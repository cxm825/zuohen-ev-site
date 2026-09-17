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