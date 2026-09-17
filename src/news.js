import { escapeHtml } from './markdown.js';

export const NEWS_LEGACY_PATHS = new Set([
  '/ac-ev-charger-manufacturer.html', '/dc-fast-charging-station-supplier.html', '/portable-ev-charger-guide.html',
  '/ev-charging-adapter-supplier.html', '/ccs2-to-gbt-adapter-guide.html', '/nacs-ev-adapter-guide.html',
  '/type-1-vs-type-2-ev-charging.html', '/ev-charging-standards-europe.html', '/ev-charging-standards-north-america.html',
  '/how-to-choose-dc-fast-charger.html', '/fleet-ev-charging-solutions.html', '/home-and-workplace-ev-charging.html',
  '/portable-ev-charging-for-roadside-rescue.html', '/oem-ev-charger-private-label-guide.html', '/v2l-adapter-and-vehicle-to-load-guide.html',
]);

const FOOTER = `<footer><div class="container footer-grid"><div><a class="brand" href="/"><span class="brand-mark">⚡</span><span>ZUOHEN<span class="brand-light">CHARGE</span></span></a><p>EV charging equipment for the global transition to electric mobility.</p></div><div><b>Products</b><a href="/products?category=AC%20Charging">AC charging</a><a href="/products?category=DC%20Charging">DC fast charging</a><a href="/products?category=Portable">Portable chargers</a><a href="/products?category=Adapter">Adapters</a></div><div><b>Company</b><a href="/about">About ZUOHEN</a><a href="/company-profile">Company profile</a><a href="/certifications">Certifications</a><a href="/cases">Success cases</a></div><div><b>Resources</b><a href="/news">News &amp; insights</a><a href="/solutions">Solutions</a><a href="/contact">Request a quote →</a></div></div><div class="container footer-bottom"><span>© 2026 ZUOHEN Charge. All rights reserved.</span><span>Built for global EV charging.</span></div></footer>`;

const NAV = `<nav><a href="/products">Products</a><a href="/solutions">Solutions</a><a class="active" href="/news">News</a><a href="/about">About us</a><a class="nav-cta" href="/contact">Request a quote</a></nav>`;

const layout = (title, description, body) => `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | ZUOHEN</title><meta name="description" content="${escapeHtml(description)}"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/theme.css"></head><body><header class="site-header"><div class="container nav-wrap"><a class="brand" href="/"><span class="brand-mark">⚡</span><span>ZUOHEN<span class="brand-light">CHARGE</span></span></a>${NAV}</div></header><main>${body}</main>${FOOTER}</body></html>`;

const response = (html, status = 200) => new Response(html, { status, headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': status === 200 ? 'public, max-age=300' : 'no-store' } });

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': status === 200 ? 'public, max-age=300' : 'no-store' } });

/** Build the `YYYY-MM-DD` display date from a stored timestamp. */
const displayDate = value => String(value || '').slice(0, 10);

export async function handleNews(request, env, pathname) {
  if (!env.NEWS_DB) return response('<h1>News database is not configured</h1><p>Bind the NEWS_DB D1 database before serving news.</p>', 503);

  // JSON feed consumed by /news.html (static page) and any other client.
  if (pathname === '/api/news') {
    const { results } = await env.NEWS_DB.prepare('SELECT slug,title,description,published_at FROM news ORDER BY published_at DESC, id DESC').all();
    return json(results.map(item => ({
      slug: item.slug,
      title: item.title,
      description: item.description,
      date: displayDate(item.published_at),
      href: `/news/${encodeURIComponent(item.slug)}`,
    })));
  }

  if (pathname === '/news' || pathname === '/news/') {
    const { results } = await env.NEWS_DB.prepare('SELECT slug,title,description,published_at FROM news ORDER BY published_at DESC, id DESC').all();
    const cards = results.map(item => `<a class="news-card" href="/news/${encodeURIComponent(item.slug)}"><span class="news-card-date">${escapeHtml(displayDate(item.published_at))}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><span class="news-card-link">Read article →</span></a>`).join('');
    return response(layout('News & Insights', 'EV charging news and sourcing insights from ZUOHEN.', `<section class="page-hero catalog-hero"><div class="container"><p class="eyebrow">ZUOHEN NEWS & INSIGHTS</p><h1>Charging knowledge for<br><em>better sourcing.</em></h1><p>Practical guidance on standards, connector selection and equipment sourcing for EV charging distributors, fleets and project teams.</p><div class="hero-specs page-specs"><span>Standards &amp; compliance</span><span>Connector selection</span><span>Sourcing guides</span><span>Market insights</span></div></div></section><section class="section catalog"><div class="container"><div class="section-heading"><div><p class="eyebrow">LATEST ARTICLES</p><h2>Guides, standards<br><em>and sourcing insight.</em></h2></div><p class="section-intro">All published articles. Compare connectors, standards and equipment classes before you specify.</p></div>${cards ? `<div class="news-grid">${cards}</div>` : '<p>No news published yet.</p>'}</div></section>`));
  }

  const slug = pathname.startsWith('/news/') ? decodeURIComponent(pathname.slice(6).replace(/\/$/, '')) : null;
  const legacy = pathname.startsWith('/') ? pathname : '';
  if (!slug && !legacy.endsWith('.html')) return null;
  const item = await env.NEWS_DB.prepare('SELECT * FROM news WHERE slug = ?1 OR legacy_path = ?2 LIMIT 1').bind(slug || '', legacy).first();
  if (!item) return response(layout('News article not found', 'The requested news article could not be found.', '<section class="section"><div class="container"><h1>Article not found</h1><p><a href="/news">Return to news</a></p></div></section>'), 404);
  const body = `<section class="page-hero catalog-hero"><div class="container"><p class="eyebrow">ZUOHEN NEWS &amp; INSIGHTS</p><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.description)}</p></div></section><article class="section about-copy"><div class="container news-article"><p class="eyebrow">PUBLISHED ${escapeHtml(displayDate(item.published_at))}</p>${item.rendered_html}<p class="news-back"><a class="text-link" href="/news">← Back to all articles</a></p></div></article>`;
  return response(layout(item.title, item.description, body));
}
