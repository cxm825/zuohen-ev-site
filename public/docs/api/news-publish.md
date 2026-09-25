# News Publishing API (`POST /api/news`)

任何第三方都可以用这个接口向 ZOHEN Charger(zohencar.online)发布新闻。发布成功后,文章立即出现在
`/news` 列表页与新闻 feed(`/api/news`)、文章详情页 `/news/<slug>`,并进入 `sitemap.xml`
(Worker 会把 API 发布的文章合并进构建期生成的静态 sitemap)。

接口契约与 zohencar.com 的新闻发布接口一致:同字段、同校验、同默认值、同一授权码。

## 鉴权

一个固定授权码(Worker secret `NEWS_API_KEY`),两种携带方式任选:

```
Authorization: Bearer <NEWS_API_KEY>
X-API-Key: <NEWS_API_KEY>
```

- 授权码的唯一正本在仓库外:`data/secrets/news_api_key.txt`(已 gitignore),与 zohencar.com 共用同一个值。
- 本地开发从 `.dev.vars` 读取;生产通过 `npx wrangler secret put NEWS_API_KEY` 写入。
- 轮换授权码 = 生成新值写进密钥文件,再 `wrangler secret put` 同步一次(三个站点一起换)。

## 请求

`POST /api/news`,`Content-Type: application/json`。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | string | ✅ | 标题,≤300 字符。原样存储(允许 HTML)。 |
| `body` | string | ✅ | 正文,≤200,000 字符。允许 HTML,原样存储并直接渲染。 |
| `slug` | string | – | URL 片段。缺省从标题生成;与现有文章冲突时自动加 `-2`、`-3`… |
| `excerpt` | string | – | 摘要。缺省取正文纯文本前 200 字符。存入新闻表的 `description` 列。 |
| `kind` | string | – | 分类标签。缺省 `Industry Update`。 |
| `author` | string | – | 作者。缺省 `ZOHEN Charger Newsroom`。 |
| `source_name` | string | – | 来源名称。 |
| `source_url` | string | – | 原文链接,必须以 `http://` 或 `https://` 开头。 |
| `published_at` | string | – | ISO 8601 时间(如 `2026-09-24T08:00:00Z`)。缺省为当前 UTC 时间。 |

### 示例

```bash
curl -X POST https://zohencar.online/api/news \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEWS_API_KEY" \
  -d '{
    "title": "ZOHEN Charger Passes UL 2251 Recertification",
    "body": "<p>The annual audit covered …</p>",
    "source_url": "https://example.com/audit-report"
  }'
```

### 响应

`200`:

```json
{
  "success": true,
  "id": 16,
  "slug": "zohen-charger-passes-ul-2251-recertification",
  "url": "https://zohencar.online/news/zohen-charger-passes-ul-2251-recertification",
  "kind": "Industry Update",
  "published_at": "2026-09-24 04:18:30.741+00:00",
  "message": "News article published. It now appears on /news and the sitemap."
}
```

错误:`401` 授权码缺失或错误;`400` 参数问题(缺 title/body、非法 JSON、非法日期等);
`503` Worker 未配置 `NEWS_API_KEY` 或未绑定 `NEWS_DB`。错误体统一为 `{"error": "..."}`。

注意:`GET /api/news` 仍是原有 JSON feed(新闻列表数据源),不受本接口影响;发布走 `POST`。

## 实现

- Handler:`src/news-api.js` 的 `handleNewsPublish`(含恒时授权码比较)与 `handleSitemap`(静态 sitemap + 动态文章合并)。
- 写入:`news` 表(slug 唯一化后插入;`legacy_path` 自动写成 `/news/<slug>.html`,所以旧式 `.html` URL 也能打开新文章)。
- `content_hash` 为正文 SHA-256,`read_minutes` 缺省按正文纯文本 200 wpm 估算,最少 1 分钟。
- 数据表新增列见 `migrations/0003_news_api_columns.sql`;测试在 `tests/news_api.test.mjs`(`npm run test:news`)。
