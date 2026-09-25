// news-api.js — POST /api/news: third-party news publishing with one fixed
// token (NEWS_API_KEY). Same contract as zohencar.com: published rows go live
// immediately on /news, /news/<slug>, the /api/news feed and the sitemaps,
// which this module also merges with the static public/sitemap.xml.
//
// Publishing also fans out to the IndexNow endpoints (Bing, Yandex, Seznam,
// Naver) and Google's sitemap ping, honouring INDEXNOW_KEY when configured.

const NEWS_KIND = 'Industry Update';
const NEWS_AUTHOR = 'ZOHEN Charger Newsroom';
const NEWS_EXCERPT_LIMIT = 200;
const NEWS_MAX_TITLE = 300;
const NEWS_MAX_BODY = 200_000;
const NEWS_OPTIONAL_STRING_FIELDS = ['excerpt', 'author', 'kind', 'source_name', 'source_url'];

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store' } });
const jsonError = (error, status) => json({ error }, status);

/** Constant-time equality so response timing cannot probe the token. */
function secureEqual(a, b) {
  let diff = a.length ^ b.length;
  const shared = Math.min(a.length, b.length);
  for (let i = 0; i < shared; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Accepts "Authorization: Bearer <key>" and "X-API-Key: <key>". */
function presentedNewsKey(request) {
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) return apiKey.trim();
  const authorization = request.headers.get('Authorization') ?? '';
  return authorization.replace(/^Bearer\s+/i, '').trim();
}

/** Production serves the custom domain; the request origin is the base for URLs. */
function siteOrigin(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

/** URL-safe slug: lowercase, non-alphanumerics collapse to one dash. */
function slugifyText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/** Strips tags and entities so excerpts and read time derive from real words. */
function plainText(body) {
  return body
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function defaultExcerpt(body) {
  const text = plainText(body);
  if (text.length <= NEWS_EXCERPT_LIMIT) return text;
  return `${text.slice(0, NEWS_EXCERPT_LIMIT).replace(/\s+\S*$/, '')}…`;
}

/** Reading time at 200 wpm, at least one minute. */
function defaultReadMinutes(body) {
  const words = plainText(body).split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** ISO input → the "YYYY-MM-DD HH:MM:SS.mmm+00:00" wall format rows are stored in. */
function normalizePublishedAt(input) {
  const toStored = date => date.toISOString().replace('T', ' ').replace('Z', '+00:00');
  if (input === undefined || input === null || input === '') return { value: toStored(new Date()) };
  if (typeof input !== 'string') return { error: 'published_at must be an ISO 8601 timestamp string' };
  const parsed = new Date(input.trim());
  if (Number.isNaN(parsed.getTime())) return { error: 'published_at is not a valid date' };
  return { value: toStored(parsed) };
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Inserts the article, appending -2, -3, … to the slug on collisions. */
async function insertArticle(env, article) {
  let slug = article.slug;
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const taken = await env.NEWS_DB.prepare('SELECT 1 FROM news WHERE slug = ? LIMIT 1').bind(slug).first();
    if (!taken) break;
    slug = `${article.slug}-${attempt + 1}`;
  }
  const result = await env.NEWS_DB.prepare(
    `INSERT INTO news (slug, legacy_path, title, description, published_at, updated_at, image,
                       source_markdown, rendered_html, content_hash, kind, author, read_minutes, source_name, source_url)
     VALUES (?1, ?2, ?3, ?4, ?5, ?5, '', ?6, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`,
  ).bind(
    slug,
    `/news/${slug}.html`,
    article.title,
    article.excerpt,
    article.publishedAt,
    article.body,
    await sha256Hex(article.body),
    article.kind,
    article.author,
    article.readMinutes,
    article.sourceName,
    article.sourceURL,
  ).run();
  return { id: Number(result.meta.last_row_id ?? 0), slug };
}

export async function handleNewsPublish(request, env, ctx) {
  if (!env.NEWS_DB) return jsonError('News database is not configured', 503);
  const configured = String(env.NEWS_API_KEY ?? '').trim();
  if (configured === '') return jsonError('News publishing is not configured', 503);
  if (!secureEqual(presentedNewsKey(request), configured)) {
    return jsonError('Invalid or missing API key', 401);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonError('Invalid request payload', 400);
  }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return jsonError('Invalid request payload', 400);
  }
  const input = payload;

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (title === '' || body === '') return jsonError('Title and Body are required', 400);
  if (title.length > NEWS_MAX_TITLE) return jsonError(`Title must be at most ${NEWS_MAX_TITLE} characters`, 400);
  if (body.length > NEWS_MAX_BODY) return jsonError(`Body must be at most ${NEWS_MAX_BODY} characters`, 400);

  const optional = {};
  for (const field of NEWS_OPTIONAL_STRING_FIELDS) {
    const value = input[field];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value !== 'string') return jsonError(`${field} must be a string`, 400);
    optional[field] = value.trim();
  }
  if (optional.source_url && !/^https?:\/\//i.test(optional.source_url)) {
    return jsonError('source_url must start with http:// or https://', 400);
  }

  const requestedSlug = typeof input.slug === 'string' ? slugifyText(input.slug) : '';
  if (typeof input.slug === 'string' && requestedSlug === '') {
    return jsonError('slug must contain letters or digits', 400);
  }
  // The title may carry markup (it is stored as-is), so slug from plain words.
  const slug = requestedSlug || slugifyText(plainText(title)) || 'news';

  const publishedAt = normalizePublishedAt(input.published_at);
  if (publishedAt.error) return jsonError(publishedAt.error, 400);

  const kind = optional.kind ?? NEWS_KIND;
  const created = await insertArticle(env, {
    slug,
    kind,
    title,
    excerpt: optional.excerpt ?? defaultExcerpt(body),
    body,
    author: optional.author ?? NEWS_AUTHOR,
    readMinutes: defaultReadMinutes(body),
    sourceName: optional.source_name ?? '',
    sourceURL: optional.source_url ?? '',
    publishedAt: publishedAt.value,
  });

  const origin = siteOrigin(request);
  const articleURL = `${origin}/news/${encodeURIComponent(created.slug)}`;
  await notifySearchEngines(origin, articleURL, env, ctx);

  return json({
    success: true,
    id: created.id,
    slug: created.slug,
    url: articleURL,
    kind,
    published_at: publishedAt.value,
    message: 'News article published. It now appears on /news, /sitemap.xml, /news-sitemap.xml and llms.txt.',
  });
}

export async function handleSitemap(request, env) {
  const staticResponse = await env.ASSETS.fetch(new Request(new URL('/sitemap.xml', request.url)));
  let xml = staticResponse.status === 200 ? await staticResponse.text() : null;
  if (xml === null) {
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>';
  }
  if (!env.NEWS_DB) return staticResponse;

  const { results } = await env.NEWS_DB.prepare('SELECT slug FROM news ORDER BY published_at DESC, id DESC').all();
  const origin = siteOrigin(request);
  const entries = [];
  for (const item of results) {
    const loc = `${origin}/news/${encodeURIComponent(item.slug)}`;
    if (xml.includes(`${loc}</loc>`)) continue;
    entries.push(`  <url><loc>${loc}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
  }
  if (entries.length === 0) return staticResponse;

  xml = xml.replace('</urlset>', `${entries.join('\n')}\n</urlset>`);
  return xmlResponse(xml);
}

/**
 * Serves /news-sitemap.xml: every published article with its real lastmod, so
 * crawlers can re-index individual guides without recrawling the whole site.
 */
export async function handleNewsSitemap(request, env) {
  const origin = siteOrigin(request);
  const header = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  if (!env.NEWS_DB) return xmlResponse(`${header}\n</urlset>`);

  const { results } = await env.NEWS_DB.prepare(
    'SELECT slug, published_at, updated_at FROM news ORDER BY published_at DESC, id DESC',
  ).all();
  const entries = results.map(item => {
    const lastmod = displayLastmod(item.updated_at || item.published_at);
    return `  <url><loc>${origin}/news/${encodeURIComponent(item.slug)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>monthly</changefreq><priority>0.6</priority></url>`;
  });
  return xmlResponse(`${header}\n${entries.join('\n')}${entries.length ? '\n' : ''}</urlset>`);
}

/** D1 stores "YYYY-MM-DD HH:MM:SS+00:00"; sitemaps want an ISO-8601 date. */
function displayLastmod(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const parsed = new Date(text.includes('T') ? text : text.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? text.slice(0, 10) : parsed.toISOString().slice(0, 10);
}

function xmlResponse(xml, status = 200) {
  return new Response(xml, {
    status,
    headers: { 'content-type': 'application/xml; charset=UTF-8', 'cache-control': 'public, max-age=300' },
  });
}

/**
 * Tells search engines a new article exists. Never blocks or fails the publish
 * response: every ping is best effort with a short timeout.
 */
async function notifySearchEngines(origin, articleURL, env, ctx) {
  const sitemapURL = `${origin}/sitemap.xml`;
  const tasks = [
    ping(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapURL)}`),
    ping(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapURL)}`),
  ];

  const key = String(env.INDEXNOW_KEY ?? '').trim();
  if (key) {
    const body = JSON.stringify({
      host: new URL(origin).host,
      key,
      keyLocation: `${origin}/${key}.txt`,
      urlList: [articleURL, `${origin}/news`],
    });
    const headers = { 'content-type': 'application/json; charset=utf-8' };
    for (const endpoint of ['https://api.indexnow.org/indexnow', 'https://yandex.com/indexnow']) {
      tasks.push(ping(endpoint, { method: 'POST', headers, body }));
    }
  }

  const work = Promise.allSettled(tasks).catch(() => {});
  if (ctx?.waitUntil) {
    ctx.waitUntil(work);
    return;
  }
  await work;
}

function ping(url, init = {}) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(5_000) }).then(response => response.body?.cancel?.()).catch(() => {});
}
