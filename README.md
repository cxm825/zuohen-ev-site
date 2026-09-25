# ZOHEN EV Charging Site (Cloudflare Workers)

Static marketing site for ZOHEN EV charging equipment, deployed as a
Cloudflare Worker with static assets.

## Structure

```
├─ public/            # Static site files (HTML/CSS/JS/images/products.json)
│  ├─ theme.css       # Industrial energy theme (loaded after styles.css)
│  ├─ news.html       # News index (client-renders from /api/news)
│  ├─ company-profile.html   # Factory, capability, quality control
│  ├─ certifications.html    # IATF 16949 / ISO / CE / UL 2251 / RoHS / FCC
│  ├─ cases.html             # Success cases and project workflow
│  └─ 404.html        # Custom not-found page
├─ src/
│  ├─ index.js        # Worker entry, forwards requests to static assets
│  └─ news.js         # D1 news routing, /api/news feed, page rendering
├─ wrangler.jsonc     # Cloudflare Workers config (assets + 404 handling)
└─ package.json
```

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Homepage: hero slider, categories, featured products, full catalog |
| `/products` | Product catalog with search, category filter and pagination |
| `/product?id=N` | Product detail |
| `/solutions` | Application solutions (home, fleet, commercial, mobile) |
| `/about` | Short company introduction |
| `/company-profile` | Company profile: facility, capability, quality control |
| `/certifications` | Certifications and product compliance |
| `/cases` | Success cases and the inquiry-to-shipment workflow |
| `/news` | News and insights index (D1-backed) |
| `/news/<slug>` | Individual article (D1-backed) |
| `/contact` | Quote request form |
| `/admin` | Admin dashboard: login required (`ADMIN_PASSWORD` secret) |

### Inquiries and admin dashboard

Inquiry forms on the homepage and contact page POST to `/api/inquiries`, which
stores every submission in the D1 `inquiries` table (with a honeypot field and
server-side validation for spam/basic hygiene). Admins manage leads at `/admin`:

- Sign in with the Worker secret `ADMIN_PASSWORD` (set via
  `npx wrangler secret put ADMIN_PASSWORD`; never stored in code or Git).
- Sessions are random 32-byte tokens stored hashed; cookies are HttpOnly,
  Secure, SameSite=Strict and signed, and expire after 12 hours.
- Failed logins are rate limited per client IP (8 attempts, then a 15-minute lock).
- The dashboard supports status workflow (New / In progress / Quoted / Won /
  Closed), free-text search, status filtering, pagination and CSV export.

Relevant routes live in `src/inquiries.js`; the schema is
`migrations/0002_inquiries.sql`.

`styles.css` holds the original layout; `theme.css` overrides the palette to the
industrial energy theme (dark graphite surfaces with an electric-green accent).
Every page links both, in that order. Removing the `theme.css` link reverts the
look — no layout rules live in it.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:8787

## News and D1 setup

Cloudflare calls its SQL database product **D1**. Create one database, copy its
ID into `wrangler.jsonc` in place of `REPLACE_WITH_D1_DATABASE_ID`, then run:

```bash
wrangler login
wrangler d1 create zuohen-news
npm run db:migrate:local
npm run news:sync
```

The source of truth for news is `content/news/*.md`. Each file uses YAML front
matter (`title`, `description`, `date`, `legacy_path`, optional `image`) and is
synced idempotently to D1 by its SHA-256 content hash. The deployment script
runs the asset audit, applies remote migrations, syncs new/changed Markdown,
and only then deploys the Worker.

News is available at `/news` and `/news/<slug>`. The Worker also exposes
`/api/news`, a JSON feed used by the static `news.html` index; `news.html`
307-redirects to `/news`, which is rendered server-side from D1. The 15 legacy
article `.html` URLs are resolved from D1 as well, so old links and search
rankings keep working even though those files are no longer in `public/`.

Every page links to `/news` from the main navigation and the footer, so the
news index has a visible entry point from anywhere on the site.

## Deploy

```bash
npm run deploy
```

Google Analytics 4 is wired in with measurement ID `G-G6YZP4ZDZ8`
(property `zohencar.online`, stream `https://zohencar.online`): the gtag.js
snippet is embedded in every public page (`public/*.html` and the dynamic
news layout in `src/news.js`). The inquiry forms report a `generate_lead`
event on successful submission — mark it as a key event in the GA4 admin to
track quote conversions.

First run requires `wrangler login` (Cloudflare account). After deploying,
bind a custom domain via the Cloudflare Dashboard (Workers → your worker →
Domains & Routes) if needed.

## SEO and GEO (generative engine optimisation)

### Crawling and indexing

| Endpoint | Served by | Purpose |
| --- | --- | --- |
| `/robots.txt` | static | Crawl rules, explicit AI-crawler allowances, both sitemaps |
| `/sitemap.xml` | `handleSitemap` | `public/sitemap.xml` merged with every API-published article |
| `/news-sitemap.xml` | `handleNewsSitemap` | Article-only sitemap with real `<lastmod>` dates |
| `/llms.txt` | `handleLlms` | [llms.txt](https://llmstxt.org) index: curated `public/llms.txt` plus published articles |
| `/llms-full.txt` | `handleLlmsFull` | Plain-text corpus of every article, generated on request |
| `/llms.json` | `handleLlmsJson` | Machine-readable article index |

`public/llms.txt` is the hand-curated entry point; the Worker rewrites its
`## Product Guides` section at request time so newly published articles appear
without a redeploy. `public/sitemap.xml` holds only the core static pages so the
article list never goes stale — the Worker appends them from D1.

### Structured data

Every static page carries canonical, `robots`, Open Graph, Twitter Card and
JSON-LD tags. The dynamic news layout in `src/news.js` emits a `@graph` with
`Organization`, `WebSite`, `BlogPosting` (headline, dates, word count, author,
publisher), `BreadcrumbList` and `ItemList` nodes per page. All JSON-LD uses a
shared `@id` (`https://zohencar.online/#organization`) so the entity graph
resolves consistently across pages.

### IndexNow and search pings

`POST /api/news` fans out to IndexNow and the Google/Bing sitemap ping after a
successful publish (best effort, `ctx.waitUntil`, 5 second timeouts — a ping
failure never fails the publish). Set the key secret to enable IndexNow:

```bash
npx wrangler secret put INDEXNOW_KEY   # same value as public/<key>.txt
```

Without `INDEXNOW_KEY` only the sitemap pings run. `npm run seo:indexnow`
submits the static URL list; `npm run seo:indexnow:live` first fetches the
deployed sitemap so API-published articles are included. `npm run deploy` ends
with the live variant.

## Notes

- All internal links use relative paths, so files can live anywhere under `public/`.
- Product catalog data is `public/products.json`, rendered client-side by
  `app.js` (catalog), `catalog.js` (products page) and `product.js` (detail).
- `not_found_handling: "404-page"` in `wrangler.jsonc` serves `public/404.html`
  with HTTP 404 for unknown paths.