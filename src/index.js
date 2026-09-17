import { handleNews, NEWS_LEGACY_PATHS } from './news.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/news' || url.pathname.startsWith('/news/') || NEWS_LEGACY_PATHS.has(url.pathname)) {
      const newsResponse = await handleNews(request, env, url.pathname);
      if (newsResponse) return newsResponse;
    }
    return env.ASSETS.fetch(request);
  },
};
