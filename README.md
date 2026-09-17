# ZUOHEN EV Charging Site (Cloudflare Workers)

Static marketing site for ZUOHEN EV charging equipment, deployed as a
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

First run requires `wrangler login` (Cloudflare account). After deploying,
bind a custom domain via the Cloudflare Dashboard (Workers → your worker →
Domains & Routes) if needed.

## Notes

- All internal links use relative paths, so files can live anywhere under `public/`.
- Product catalog data is `public/products.json`, rendered client-side by
  `app.js` (catalog), `catalog.js` (products page) and `product.js` (detail).
- `not_found_handling: "404-page"` in `wrangler.jsonc` serves `public/404.html`
  with HTTP 404 for unknown paths.