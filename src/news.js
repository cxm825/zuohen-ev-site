import { escapeHtml } from './markdown.js';

export const NEWS_LEGACY_PATHS = new Set([
  '/ac-ev-charger-manufacturer.html', '/dc-fast-charging-station-supplier.html', '/portable-ev-charger-guide.html',
  '/ev-charging-adapter-supplier.html', '/ccs2-to-gbt-adapter-guide.html', '/nacs-ev-adapter-guide.html',
  '/type-1-vs-type-2-ev-charging.html', '/ev-charging-standards-europe.html', '/ev-charging-standards-north-america.html',
  '/how-to-choose-dc-fast-charger.html', '/fleet-ev-charging-solutions.html', '/home-and-workplace-ev-charging.html',
  '/portable-ev-charging-for-roadside-rescue.html', '/oem-ev-charger-private-label-guide.html', '/v2l-adapter-and-vehicle-to-load-guide.html',
]);

const SITE = 'https://zohencar.online';
const SITE_NAME = 'ZOHEN Charger';
const OG_IMAGE = `${SITE}/assets/hero/hero-01.png`;
const WHATSAPP = 'https://wa.me/8617201807491?text=Hello%20ZOHEN%20team%2C%20I%20would%20like%20to%20discuss%20EV%20charging%20equipment.';
const FOOTER = `<footer><div class="container footer-grid"><div><a class="brand" href="/"><span class="brand-mark">⚡</span><span>ZOHEN<span class="brand-light">CHARGER</span></span></a><p>EV charging equipment for the global transition to electric mobility.</p><a href="mailto:sales@zohencar.online">sales@zohencar.online</a></div><div><b>Products</b><a href="/products?category=AC%20Charging">AC charging</a><a href="/products?category=DC%20Charging">DC fast charging</a><a href="/products?category=Portable">Portable chargers</a><a href="/products?category=Adapter">Adapters</a></div><div><b>Company</b><a href="/about">About ZOHEN</a><a href="/company-profile">Company profile</a><a href="/certifications">Certifications</a><a href="/cases">Success cases</a></div><div><b>Resources</b><a href="/news">News &amp; insights</a><a href="/solutions">Solutions</a><a href="/contact">Request a quote →</a><a class="whatsapp-link" href="${WHATSAPP}" target="_blank" rel="noopener">WhatsApp: +86 172 0180 7491</a></div></div><div class="container footer-bottom"><span>© 2026 ZOHEN Charger. All rights reserved.</span><span>Built for global EV charging.</span></div></footer>`;

const NAV = `<nav><a href="/products">Products</a><a href="/solutions">Solutions</a><a class="active" href="/news">News</a><a href="/about">About us</a><a class="nav-cta" href="/contact">Request a quote</a></nav>`;

/** Serialises JSON-LD without letting `</script>` escape the block. */
const ld = value => JSON.stringify(value).replace(/</g, '\\u003c');

const ORG_SCHEMA = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'Anhui Zuoheng International Trade Co.,Ltd.',
  alternateName: SITE_NAME,
  url: SITE,
  logo: `${SITE}/assets/hero/hero-05.png`,
  email: 'sales@zohencar.online',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'No. 188 Automotive High-Tech Industrial Park',
    addressRegion: 'Anhui',
    addressCountry: 'CN',
  },
  areaServed: ['Europe', 'Middle East', 'South America', 'Southeast Asia'],
};

const WEBSITE_SCHEMA = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  url: SITE,
  name: SITE_NAME,
  inLanguage: 'en',
  publisher: { '@id': `${SITE}/#organization` },
};

/**
 * Shared shell for every dynamic news page. Beyond title/description this now
 * emits canonical, Open Graph, Twitter Card and JSON-LD graph blocks so
 * articles can be indexed and quoted by search and AI answer engines.
 */
const layout = (title, description, body, options = {}) => {
  const fullTitle = `${title} | ZOHEN`;
  const canonical = options.canonical || `${SITE}/news`;
  const robots = options.robots || 'index, follow, max-image-preview:large, max-snippet:-1';
  const graph = [ORG_SCHEMA, WEBSITE_SCHEMA, ...(options.graph || [])];
  const head = [
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="canonical" href="' + escapeHtml(canonical) + '">',
    '<meta name="robots" content="' + escapeHtml(robots) + '">',
    '<meta property="og:site_name" content="' + escapeHtml(SITE_NAME) + '">',
    '<meta property="og:type" content="' + escapeHtml(options.ogType || 'website') + '">',
    '<meta property="og:title" content="' + escapeHtml(options.ogTitle || fullTitle) + '">',
    '<meta property="og:description" content="' + escapeHtml(description) + '">',
    '<meta property="og:url" content="' + escapeHtml(canonical) + '">',
    '<meta property="og:image" content="' + escapeHtml(options.image || OG_IMAGE) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + escapeHtml(options.ogTitle || fullTitle) + '">',
    '<meta name="twitter:description" content="' + escapeHtml(description) + '">',
    '<meta name="twitter:image" content="' + escapeHtml(options.image || OG_IMAGE) + '">',
    '<link rel="alternate" type="application/json" href="/llms.json" title="ZOHEN article index for AI assistants">',
    '<link rel="alternate" type="text/plain" href="/llms.txt" title="ZOHEN llms.txt">',
    '<script type="application/ld+json">' + ld({ '@context': 'https://schema.org', '@graph': graph }) + '</script>',
  ].join('');
  return `<!doctype html><html lang="en"><head><script async src="https://www.googletagmanager.com/gtag/js?id=G-G6YZP4ZDZ8"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-G6YZP4ZDZ8');</script><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(fullTitle)}</title><meta name="description" content="${escapeHtml(description)}">${head}<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/theme.css"></head><body><header class="site-header"><div class="container nav-wrap"><a class="brand" href="/"><span class="brand-mark">⚡</span><span>ZOHEN<span class="brand-light">CHARGER</span></span></a>${NAV}</div></header><main>${body}</main>${FOOTER}<a class="whatsapp-float" href="${WHATSAPP}" target="_blank" rel="noopener" aria-label="Chat with ZOHEN on WhatsApp"><span aria-hidden="true">◔</span><b>WhatsApp</b><small>+86 172 0180 7491</small></a></body></html>`;
};

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
    const itemList = {
      '@type': 'ItemList',
      name: 'ZOHEN News & Insights',
      numberOfItems: results.length,
      itemListElement: results.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE}/news/${encodeURIComponent(item.slug)}`,
        name: item.title,
      })),
    };
    return response(layout(
      'News & Insights',
      'EV charging news and sourcing insights from ZOHEN.',
      `<section class="page-hero catalog-hero"><div class="container"><p class="eyebrow">ZOHEN NEWS & INSIGHTS</p><h1>Charging knowledge for<br><em>better sourcing.</em></h1><p>Practical guidance on standards, connector selection and equipment sourcing for EV charging distributors, fleets and project teams.</p><div class="hero-specs page-specs"><span>Standards &amp; compliance</span><span>Connector selection</span><span>Sourcing guides</span><span>Market insights</span></div></div></section><section class="section catalog"><div class="container"><div class="section-heading"><div><p class="eyebrow">LATEST ARTICLES</p><h2>Guides, standards<br><em>and sourcing insight.</em></h2></div><p class="section-intro">All published articles. Compare connectors, standards and equipment classes before you specify.</p></div>${cards ? `<div class="news-grid">${cards}</div>` : '<p>No news published yet.</p>'}</div></section>`,
      {
        canonical: `${SITE}/news`,
        ogTitle: 'News & Insights | ZOHEN EV Charging',
        graph: [
          {
            '@type': 'Blog',
            '@id': `${SITE}/news#blog`,
            name: 'ZOHEN News & Insights',
            description: 'EV charging sourcing guides and technical insights for distributors, fleets and project teams.',
            url: `${SITE}/news`,
            inLanguage: 'en',
            publisher: { '@id': `${SITE}/#organization` },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
              { '@type': 'ListItem', position: 2, name: 'News & Insights', item: `${SITE}/news` },
            ],
          },
          itemList,
        ],
      },
    ));
  }

  const slug = pathname.startsWith('/news/') ? decodeURIComponent(pathname.slice(6).replace(/\/$/, '')) : null;
  const legacy = pathname.startsWith('/') ? pathname : '';
  if (!slug && !legacy.endsWith('.html')) return null;
  const item = await env.NEWS_DB.prepare('SELECT * FROM news WHERE slug = ?1 OR legacy_path = ?2 LIMIT 1').bind(slug || '', legacy).first();
  if (!item) {
    return response(layout(
      'News article not found',
      'The requested news article could not be found.',
      '<section class="section"><div class="container"><h1>Article not found</h1><p><a href="/news">Return to news</a></p></div></section>',
      { canonical: `${SITE}/news`, robots: 'noindex, follow', ogType: 'article' },
    ), 404);
  }
  // Stored titles may already carry the brand suffix; avoid "| ZOHEN | ZOHEN".
  const pageTitle = item.title.replace(/\s*\|\s*ZOHEN\s*$/i, '');
  const canonical = `${SITE}/news/${encodeURIComponent(item.slug)}`;
  const published = displayDate(item.published_at);
  const modified = displayDate(item.updated_at) || published;
  const words = String(item.rendered_html || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const body = `<section class="page-hero catalog-hero"><div class="container"><p class="eyebrow">ZOHEN NEWS &amp; INSIGHTS</p><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.description)}</p></div></section><article class="section about-copy"><div class="container news-article"><p class="eyebrow">PUBLISHED ${escapeHtml(published)}</p>${item.rendered_html}<p class="news-back"><a class="text-link" href="/news">← Back to all articles</a></p></div></article>`;
  return response(layout(pageTitle, item.description, body, {
    canonical,
    ogType: 'article',
    ogTitle: pageTitle,
    graph: [
      {
        '@type': 'BlogPosting',
        '@id': `${canonical}#article`,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        headline: item.title,
        description: item.description,
        url: canonical,
        datePublished: published,
        dateModified: modified,
        inLanguage: 'en',
        wordCount: words,
        articleSection: item.kind || 'Industry Update',
        author: { '@type': 'Organization', name: item.author || SITE_NAME, url: SITE },
        publisher: { '@id': `${SITE}/#organization` },
        image: item.image ? [item.image.startsWith('http') ? item.image : `${SITE}/${item.image.replace(/^\//, '')}`] : [OG_IMAGE],
        about: { '@id': `${SITE}/#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'News & Insights', item: `${SITE}/news` },
          { '@type': 'ListItem', position: 3, name: pageTitle, item: canonical },
        ],
      },
    ],
  }));
}
