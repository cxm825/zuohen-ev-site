import { handleNews, NEWS_LEGACY_PATHS } from './news.js';
import { handleNewsPublish, handleSitemap, handleNewsSitemap } from './news-api.js';
import { handleLlms, handleLlmsFull, handleLlmsJson } from './llms.js';
import { handleInquirySubmit, handleAdmin, cleanupExpired } from './inquiries.js';
import { productSlugForId } from './products.js';

// Canonical URLs are extensionless. Cloudflare's asset layer would 307 these;
// we intercept first and answer with a permanent 301 so signals consolidate.
const CANONICAL_PAGE_REDIRECTS = {
  '/index.html': '/',
  '/news.html': '/news',
  '/products.html': '/products',
  '/solutions.html': '/solutions',
  '/company-profile.html': '/company-profile',
  '/certifications.html': '/certifications',
  '/cases.html': '/cases',
  '/about.html': '/about',
  '/contact.html': '/contact',
};

// Module-level cache lives in ./products.js (shared with the sitemap builder).

function redirect(location, status = 301) {
  return new Response(null, { status, headers: { location, 'cache-control': 'public, max-age=86400' } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const isRead = request.method === 'GET' || request.method === 'HEAD';

    // Third-party news publishing (POST, token-authenticated).
    if (path === '/api/news' && request.method === 'POST') {
      return handleNewsPublish(request, env, ctx);
    }

    // Static sitemap extended with every API-published article and product page.
    if (path === '/sitemap.xml') {
      return handleSitemap(request, env);
    }

    // Article-only sitemap with real lastmod dates.
    if (path === '/news-sitemap.xml') {
      return handleNewsSitemap(request, env);
    }

    // AI answer-engine index: curated file + published articles.
    if (path === '/llms.txt') {
      return handleLlms(request, env);
    }
    if (path === '/llms-full.txt') {
      return handleLlmsFull(request, env);
    }
    if (path === '/llms.json') {
      return handleLlmsJson(request, env);
    }

    // Public inquiry intake from the site forms.
    if (path === '/api/inquiries') {
      return handleInquirySubmit(request, env);
    }

    // Password-protected admin dashboard.
    if (path === '/admin' || path.startsWith('/admin/')) {
      // Opportunistic cleanup; never block the response on it.
      if (ctx?.waitUntil) ctx.waitUntil(cleanupExpired(env).catch(() => {}));
      return handleAdmin(request, env, url);
    }

    // .html forms of static pages permanently move to their clean URLs.
    if (isRead && CANONICAL_PAGE_REDIRECTS[path]) {
      return redirect(`${url.origin}${CANONICAL_PAGE_REDIRECTS[path]}${url.search}`);
    }

    // Legacy product deep links (?id=N) permanently move to the slug URL.
    if (isRead && path === '/product.html') {
      const requested = Number(url.searchParams.get('id'));
      const slug = Number.isInteger(requested) ? await productSlugForId(env, request, requested) : '';
      return redirect(slug ? `${url.origin}/product/${slug}` : `${url.origin}/products`);
    }

    // The bare shell page is thin; the catalog is its canonical home.
    if (isRead && path === '/product') {
      return redirect(`${url.origin}/products`);
    }

    const isNewsRoute = path === '/news' || path === '/news/' || path === '/api/news' || path.startsWith('/news/') || NEWS_LEGACY_PATHS.has(path);
    if (isNewsRoute) return handleNews(request, env, path);

    const assetResponse = await env.ASSETS.fetch(request);

    // /product/<slug> has no static file: serve the shell and let product.js
    // render from the path. Real assets under /product/ still fall through.
    if (isRead && assetResponse.status === 404 && path.startsWith('/product/')) {
      const shell = await env.ASSETS.fetch(new Request(new URL('/product.html', request.url)));
      if (shell.status === 200) {
        return new Response(shell.body, {
          status: 200,
          headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'public, max-age=300' },
        });
      }
    }

    return assetResponse;
  },
};
