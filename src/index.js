import { handleNews, NEWS_LEGACY_PATHS } from './news.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isNewsRoute = url.pathname === '/news' || url.pathname === '/news/' || url.pathname.startsWith('/news/') || NEWS_LEGACY_PATHS.has(url.pathname);
    if (isNewsRoute) return handleNews(request, env, url.pathname);
    return env.ASSETS.fetch(request);
  },
};
