import { handleNews, NEWS_LEGACY_PATHS } from './news.js';
import { handleNewsPublish, handleSitemap, handleNewsSitemap } from './news-api.js';
import { handleLlms, handleLlmsFull, handleLlmsJson } from './llms.js';
import { handleInquirySubmit, handleAdmin, cleanupExpired } from './inquiries.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Third-party news publishing (POST, token-authenticated).
    if (url.pathname === '/api/news' && request.method === 'POST') {
      return handleNewsPublish(request, env, ctx);
    }

    // Static sitemap extended with every API-published article.
    if (url.pathname === '/sitemap.xml') {
      return handleSitemap(request, env);
    }

    // Article-only sitemap with real lastmod dates.
    if (url.pathname === '/news-sitemap.xml') {
      return handleNewsSitemap(request, env);
    }

    // AI answer-engine index: curated file + published articles.
    if (url.pathname === '/llms.txt') {
      return handleLlms(request, env);
    }
    if (url.pathname === '/llms-full.txt') {
      return handleLlmsFull(request, env);
    }
    if (url.pathname === '/llms.json') {
      return handleLlmsJson(request, env);
    }

    // Public inquiry intake from the site forms.
    if (url.pathname === '/api/inquiries') {
      return handleInquirySubmit(request, env);
    }

    // Password-protected admin dashboard.
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      // Opportunistic cleanup; never block the response on it.
      if (ctx?.waitUntil) ctx.waitUntil(cleanupExpired(env).catch(() => {}));
      return handleAdmin(request, env, url);
    }

    const isNewsRoute = url.pathname === '/news' || url.pathname === '/news/' || url.pathname === '/api/news' || url.pathname.startsWith('/news/') || NEWS_LEGACY_PATHS.has(url.pathname);
    if (isNewsRoute) return handleNews(request, env, url.pathname);

    return env.ASSETS.fetch(request);
  },
};
