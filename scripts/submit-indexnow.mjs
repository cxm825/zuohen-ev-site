import { readFileSync } from 'node:fs';

const KEY = '1141f4a68b82e39d521fd9f2301698e8';
const HOST = 'zohencar.online';
const ORIGIN = `https://${HOST}`;
const online = process.argv.includes('--live');

const staticUrls = [...readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
  .matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

// The Worker merges API-published articles into /sitemap.xml at request time.
const urlList = new Set([...staticUrls, `${ORIGIN}/news`, `${ORIGIN}/llms.txt`, `${ORIGIN}/news-sitemap.xml`]);
if (online) {
  try {
    const res = await fetch(`${ORIGIN}/sitemap.xml`, { signal: AbortSignal.timeout(30_000) });
    if (res.ok) {
      for (const match of (await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)) urlList.add(match[1]);
    } else {
      console.warn(`Could not read live sitemap (HTTP ${res.status}); submitting the static list only.`);
    }
  } catch (error) {
    console.warn(`Could not read live sitemap (${error.message}); submitting the static list only.`);
  }
}
const urls = [...urlList];

console.log(`Submitting ${urls.length} URLs to IndexNow:`);
urls.forEach(u => console.log('  ' + u));

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `${ORIGIN}/${KEY}.txt`,
    urlList: urls,
  }),
  signal: AbortSignal.timeout(60_000),
});

console.log(`\nHTTP ${res.status} ${res.statusText}`);
const text = await res.text();
if (text) console.log('Response:', text.slice(0, 500));

const ok = [200, 202];
if (!ok.includes(res.status)) {
  console.error('IndexNow submission FAILED (see https://www.indexnow.org/documentation#response-codes)');
  process.exit(1);
}
console.log('IndexNow submission accepted.');
