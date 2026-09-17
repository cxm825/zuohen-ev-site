# ZUOHEN EV Charging Site (Cloudflare Workers)

Static marketing site for ZUOHEN EV charging equipment, deployed as a
Cloudflare Worker with static assets.

## Structure

```
├─ public/            # Static site files (HTML/CSS/JS/images/products.json)
│  └─ 404.html        # Custom not-found page
├─ src/
│  └─ index.js        # Worker entry, forwards requests to static assets
├─ wrangler.jsonc     # Cloudflare Workers config (assets + 404 handling)
└─ package.json
```

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

News is available at `/news` and `/news/<slug>`. Existing article `.html` URLs
are also resolved from D1 so old links continue to work.

## Deploy

```bash
npm run deploy
```

First run requires `wrangler login` (Cloudflare account). After deploying,
bind a custom domain via the Cloudflare Dashboard (Workers → your worker →
Domains & Routes) if needed.

## Notes

- All internal links use relative paths, so files can live anywhere under `public/`.
- Product catalog data is `public/products.json`, rendered client-side by
  `app.js` (catalog), `catalog.js` (products page) and `product.js` (detail).
- `not_found_handling: "404-page"` in `wrangler.jsonc` serves `public/404.html`
  with HTTP 404 for unknown paths.