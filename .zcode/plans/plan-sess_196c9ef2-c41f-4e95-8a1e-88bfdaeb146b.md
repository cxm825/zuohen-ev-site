## 执行方案（已按你的选择调整）

### 目标
1. 使用 Cloudflare **D1**（Cloudflare 没有 D2 产品）存储全部 15 篇现有新闻/资讯文章，并让 Worker 负责新闻路由。
2. 新增 `content/news/` Markdown 内容源；每次部署前扫描本地 MD，按 `slug + content_hash` 幂等同步到 D1，只有新文件或内容变更才写入/更新。
3. 增加静态资源审计，重点检查 HTML/JS/CSS/JSON 中的图片和其他本地引用；审计发现缺失时让部署前检查失败。
4. 修复商品页可靠性问题，统一入口、修复嵌套旧副本/分页显示错误，并在本地浏览器/HTTP 层验证 400 条商品可见。

### 预期项目结构
```
├─ public/
│  ├─ index.html / products.html / product.html ...
│  ├─ assets/                 # 现有 422 个图片资源
│  └─ news/                   # 可选静态兼容入口（不存新闻正文）
├─ content/news/              # 15 篇现有文章转换后的 Markdown；以后新增新闻放这里
├─ src/
│  ├─ index.js                # Worker：静态资源 + D1 新闻路由
│  ├─ news.js                 # D1 查询、slug/旧路径路由、HTML 页面渲染
│  └─ markdown.js             # 同步前把 Markdown 转为安全 HTML（Worker 不依赖重型解析器）
├─ scripts/
│  ├─ sync-news.mjs           # 部署前扫描 content/news/*.md，生成/执行 D1 幂等 upsert SQL
│  └─ audit-assets.mjs        # 图片/静态资源引用审计
├─ migrations/0001_news.sql  # D1 news 表及索引
├─ wrangler.jsonc             # D1 binding：NEWS_DB
├─ package.json
└─ README.md
```

### D1 数据模型
`migrations/0001_news.sql`：
- `news(id, slug UNIQUE, legacy_path UNIQUE, title, description, published_at, updated_at, image, source_markdown, rendered_html, content_hash, created_at)`
- `slug` 用于 `/news/:slug`；`legacy_path` 保存原 15 个 `.html` 路径，保证旧 SEO URL 继续工作。
- `content_hash` 使用 SHA-256，部署同步时比较 hash；SQL 使用 `INSERT ... ON CONFLICT(slug) DO UPDATE`，内容相同不会产生实际更新。

### 现有 15 篇文章迁移
- 从当前 15 个文章 HTML 提取 title、description、canonical/旧路径、hero 标题和正文内容。
- 为每篇生成对应 `content/news/<slug>.md`，使用 YAML front matter（`title`、`description`、`date`、`legacy_path`、`image`）和 Markdown 正文。
- Worker 对旧路径（例如 `/ev-charging-standards-europe.html`）以及新路径 `/news/ev-charging-standards-europe` 统一查询 D1，返回统一新闻页面；原来的文章 HTML 不再作为新闻正文来源，可移至兼容重定向页或从 `public/` 移除（保留 URL 行为）。
- 新增 `/news` 列表页，从 D1 按发布时间倒序列出新闻。

### Worker 路由
`src/index.js` 按顺序处理：
1. `/news`、`/news/:slug` 和 15 个 `legacy_path` → `env.NEWS_DB.prepare(...).bind(...).first()/all()`，生成响应（`Content-Type: text/html`、缓存头、404）。
2. 其他请求 → `env.ASSETS.fetch(request)`。
3. D1 未绑定（例如未执行本地迁移）时，新闻路由返回清晰的配置错误，而不是静默 500；静态站点仍可访问。

为避免运行时 Markdown 解析复杂度，部署同步脚本把 Markdown 转为 `rendered_html` 存入 D1；同时保留原始 `source_markdown`，便于后续重新渲染/审计。

### 部署流程
将 `package.json` 脚本改成：
- `npm run audit:assets`：运行资源审计；
- `npm run db:migrate:local` / `npm run db:migrate:remote`：执行 D1 migration；
- `npm run news:sync`：扫描 `content/news/*.md` 并执行远程幂等同步；
- `npm run deploy`：依次执行 `audit:assets` → `db:migrate:remote` → `news:sync` → `wrangler deploy`。

`sync-news.mjs`：
- 忽略 `node_modules/.git/.wrangler`；只读 `content/news/*.md`；校验必需 front matter 和唯一 slug；
- 读取文件、计算 SHA-256、生成 HTML；
- 生成参数安全的 SQL（正确转义单引号/反斜杠），调用 Wrangler D1 execute；
- 输出“新增/更新/未变化/失败”统计；无 MD 文件时明确警告但不破坏部署。

### 静态资源审计
`scripts/audit-assets.mjs` 扫描：
- HTML 的 `src`/`href`、`img`/`source` 等；
- CSS 的 `url(...)`；
- JS 中 `assets/...` 和 fetch 的本地文件；
- `products.json` 的 400 个 `image` 字段。

审计规则：忽略外部 `http(s):`、`mailto:`、锚点和 data URI；以引用文件所在目录解析相对路径；输出缺失文件清单和总数；发现缺失时返回非零退出码。当前审计基线预期：400 个商品图片全部存在，现有关键首页图片全部存在。

### 商品显示修复
- 保留根目录的新版本 `public/products.html`、`public/catalog.js` 作为唯一推荐入口；将 `public/products/index.html` 和 `public/product/index.html` 改为兼容重定向/规范链接，避免旧副本、错误导航和错误标签继续被访问。
- 修复 `public/catalog.js` 分页计数中的 `${start + shown.length}` 模板错误。
- 确保商品卡片图片使用统一的 `assets/...` 相对路径，并保留 400 条数据、25 页分页。
- 增加 `products:check`/本地检查，确认 JSON 能取到、前 16 张图返回 200，并通过浏览器黑盒验证 `/products` 能看到商品卡片和翻页。

### 验证
1. 执行 `npm install`。
2. 执行本地 D1 migration + `npm run news:sync`（local），验证 15 篇记录和新增 MD 幂等行为。
3. 启动 `wrangler dev`，检查：
   - `/`、`/products`、`/products.json`、关键图片；
   - `/news` 和至少 2 个 `/news/:slug`；
   - 旧文章 URL；
   - 不存在新闻返回 404；
   - 400 条商品数据与商品卡片可见。
4. 运行资源审计，确认缺失数为 0。
5. 最后提交 git commit；不提交 `.dev.vars`、本地 D1 状态和 Cloudflare 凭据。

### 重要说明
- D1 远程数据库必须由你在 Cloudflare 账号中创建/绑定（或通过 `wrangler d1 create zuohen-news` 创建）；我会提供配置占位和命令，但不会替你执行需要账号授权的远程部署。
- 15 篇现有页面内容目前很短、主体大部分是共用模板；迁移会忠实保存现有可见内容，不会凭空扩写新闻正文。
- 新闻图片不迁移到 R2；文章中若引用现有 `assets/` 图片，继续由 Workers Static Assets 提供，并由资源审计保证文件存在。