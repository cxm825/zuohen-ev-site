import { escapeHtml } from './markdown.js';

export const NEWS_LEGACY_PATHS = new Set([
  '/ac-ev-charger-manufacturer.html', '/dc-fast-charging-station-supplier.html', '/portable-ev-charger-guide.html',
  '/ev-charging-adapter-supplier.html', '/ccs2-to-gbt-adapter-guide.html', '/nacs-ev-adapter-guide.html',
  '/type-1-vs-type-2-ev-charging.html', '/ev-charging-standards-europe.html', '/ev-charging-standards-north-america.html',
  '/how-to-choose-dc-fast-charger.html', '/fleet-ev-charging-solutions.html', '/home-and-workplace-ev-charging.html',
  '/portable-ev-charging-for-roadside-rescue.html', '/oem-ev-charger-private-label-guide.html', '/v2l-adapter-and-vehicle-to-load-guide.html',
]);

const layout = (title, description, body) => `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | ZUOHEN</title><meta name="description" content="${escapeHtml(description)}"><link rel="stylesheet" href="/styles.css"></head><body><header class="site-header"><div class="container nav-wrap"><a class="brand" href="/"><span class="brand-mark">⚡</span><span>ZUOHEN<span class="brand-light">CHARGE</span></span></a><nav><a href="/products">Products</a><a href="/solutions">Solutions</a><a href="/about">About us</a><a class="nav-cta" href="/contact">Request a quote</a></nav></div></header><main>${body}</main><footer><div class="container footer-bottom"><span>© 2026 ZUOHEN Charge. All rights reserved.</span><a href="/contact">Request a quote →</a></div></footer></body></html>`;

const response = (html, status = 200) => new Response(html, { status, headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': status === 200 ? 'public, max-age=300' : 'no-store' } });

export async function handleNews(request, env, pathname) {
  if (!env.NEWS_DB) return response('<h1>News database is not configured</h1><p>Bind the NEWS_DB D1 database before serving news.</p>', 503);
  if (pathname === '/news' || pathname === '/news/') {
    const { results } = await env.NEWS_DB.prepare('SELECT slug,title,description,published_at FROM news ORDER BY published_at DESC, id DESC').all();
    const cards = results.map(item => `<article class="product-card"><div class="product-body"><span class="tag">NEWS</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p><a class="product-link" href="/news/${encodeURIComponent(item.slug)}">Read article →</a></div></article>`).join('');
    return response(layout('News & Insights', 'EV charging news and sourcing insights from ZUOHEN.', `<section class="page-hero catalog-hero"><div class="container"><p class="eyebrow">ZUOHEN NEWS & INSIGHTS</p><h1>Charging knowledge for<br><em>better sourcing.</em></h1><p>Practical guidance for EV charging distributors, fleets and project teams.</p></div></section><section class="section catalog"><div class="container"><div class="product-grid">${cards || '<p>No news published yet.</p>'}</div></div></section>`));
  }
  const slug = pathname.startsWith('/news/') ? decodeURIComponent(pathname.slice(6).replace(/\/$/,'')) : null;
  const legacy = pathname.startsWith('/') ? pathname : '';
  if (!slug && !legacy.endsWith('.html')) return null;
  const item = await env.NEWS_DB.prepare('SELECT * FROM news WHERE slug = ?1 OR legacy_path = ?2 LIMIT 1').bind(slug || '', legacy).first();
  if (!item) return response(layout('News article not found', 'The requested news article could not be found.', '<section class="section"><div class="container"><h1>Article not found</h1><p><a href="/news">Return to news</a></p></div></section>'), 404);
  const body = `<section class="page-hero catalog-hero"><div class="container"><p class="eyebrow">ZUOHEN NEWS & INSIGHTS</p><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.description)}</p></div></section><article class="section about-copy"><div class="container news-article"><p class="eyebrow">PUBLISHED ${escapeHtml(item.published_at.slice(0,10))}</p>${item.rendered_html}</div></article>`;
  return response(layout(item.title, item.description, body));
}
