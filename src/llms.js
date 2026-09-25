// llms.js — /llms.txt and /llms-full.txt.
//
// The static public/llms.txt is the hand-curated entry point for AI answer
// engines (spec: https://llmstxt.org). The Worker extends it with every
// article that was published through POST /api/news, so the file stays
// accurate without a redeploy. /llms-full.txt additionally inlines the plain
// text of each article, giving a model the whole corpus in one request.

const GUIDES_HEADING = '## Product Guides';
const CONTACT_LINES = 1000;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store' },
  });

const text = (body, maxAge = 3600) =>
  new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=UTF-8',
      'cache-control': `public, max-age=${maxAge}`,
    },
  });

function siteOrigin(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function inlineText(value, max = CONTACT_LINES) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Replaces (or appends) the Product Guides section of the curated file. */
function withGuides(base, lines) {
  if (lines.length === 0) return base;
  const block = `${GUIDES_HEADING}\n\n${lines.join('\n')}\n`;
  const start = base.indexOf(GUIDES_HEADING);
  if (start === -1) return `${base.replace(/\s*$/, '')}\n\n${block}`;
  const next = base.indexOf('\n## ', start + GUIDES_HEADING.length);
  const end = next === -1 ? base.length : next + 1;
  return `${base.slice(0, start)}${block}${base.slice(end)}`;
}

async function loadRows(env, columns) {
  if (!env.NEWS_DB) return [];
  const { results } = await env.NEWS_DB.prepare(
    `SELECT ${columns} FROM news ORDER BY published_at DESC, id DESC`,
  ).all();
  return results;
}

export async function handleLlms(request, env) {
  const staticResponse = await env.ASSETS.fetch(new Request(new URL('/llms.txt', request.url)));
  const base = staticResponse.status === 200 ? await staticResponse.text() : '# ZOHEN Charger\n';
  if (!env.NEWS_DB) return text(base);

  const origin = siteOrigin(request);
  const rows = await loadRows(env, 'slug, title, description');
  const lines = rows.map(item => {
    const summary = inlineText(item.description, 160);
    const title = inlineText(item.title, 160).replace(/\s*\|\s*ZOHEN\s*$/i, '');
    return `- [${title}](${origin}/news/${encodeURIComponent(item.slug)})${summary ? `: ${summary}` : ''}`;
  });
  return text(withGuides(base, lines));
}

export async function handleLlmsFull(request, env) {
  const origin = siteOrigin(request);
  if (!env.NEWS_DB) return text(`# ZOHEN Charger — full corpus\n\nNews database is not configured.\n`);

  const rows = await loadRows(env, 'slug, title, description, published_at, rendered_html');
  const parts = [
    '# ZOHEN Charger — full corpus',
    '',
    `> Complete plain-text copy of every published ZOHEN article, generated at request time. Canonical HTML: ${origin}`,
    '',
  ];
  for (const item of rows) {
    parts.push(
      `## ${inlineText(item.title, 300).replace(/\s*\|\s*ZOHEN\s*$/i, '')}`,
      '',
      `URL: ${origin}/news/${encodeURIComponent(item.slug)}`,
      `Published: ${String(item.published_at || '').slice(0, 10)}`,
      '',
      inlineText(item.rendered_html, 20_000),
      '',
    );
  }
  return text(parts.join('\n'), 600);
}

/** Optional JSON twin of llms.txt, cheap for programmatic consumers. */
export async function handleLlmsJson(request, env) {
  const origin = siteOrigin(request);
  const rows = await loadRows(env, 'slug, title, description, published_at');
  return json({
    name: 'ZOHEN Charger',
    url: origin,
    llms: `${origin}/llms.txt`,
    articles: rows.map(item => ({
      title: inlineText(item.title, 300).replace(/\s*\|\s*ZOHEN\s*$/i, ''),
      description: item.description,
      url: `${origin}/news/${encodeURIComponent(item.slug)}`,
      published_at: String(item.published_at || '').slice(0, 10),
    })),
  });
}
