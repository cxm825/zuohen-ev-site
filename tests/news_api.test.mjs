import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { handleNewsPublish } from '../src/news-api.js';
import { createTestD1 } from './helpers/d1.mjs';

const NEWS_API_KEY = 'news_test_key';

/** The `news` schema after migrations 0001 + 0003 (the columns the API touches). */
const NEWS_DDL = `
  CREATE TABLE news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    legacy_path TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    published_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    image TEXT NOT NULL DEFAULT '',
    source_markdown TEXT NOT NULL,
    rendered_html TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kind TEXT NOT NULL DEFAULT '',
    author TEXT NOT NULL DEFAULT '',
    read_minutes INTEGER NOT NULL DEFAULT 1,
    source_name TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL DEFAULT ''
  );
`;

describe('POST /api/news (zuohen-ev-site)', () => {
  let database;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec(NEWS_DDL);
  });

  afterEach(() => {
    database.close();
  });

  function makeEnv(overrides = {}) {
    return { NEWS_API_KEY, NEWS_DB: createTestD1(database), ...overrides };
  }

  async function post(env, body, headers = { authorization: `Bearer ${NEWS_API_KEY}` }) {
    return handleNewsPublish(new Request('https://zohencar.online/api/news', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'content-type': 'application/json', ...headers },
    }), env);
  }

  async function storedRows() {
    const { results } = await createTestD1(database).prepare('SELECT * FROM news ORDER BY id').all();
    return results;
  }

  describe('authentication', () => {
    it('rejects a missing key', async () => {
      const response = await post(makeEnv(), { title: 'T', body: 'B' }, {});
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { error: 'Invalid or missing API key' });
    });

    it('rejects a wrong key', async () => {
      const response = await post(makeEnv(), { title: 'T', body: 'B' }, { authorization: 'Bearer news_wrong' });
      assert.equal(response.status, 401);
    });

    it('accepts the key via X-API-Key as well', async () => {
      const response = await post(makeEnv(), { title: 'Via header', body: 'Body' }, { 'x-api-key': NEWS_API_KEY });
      assert.equal(response.status, 200);
    });

    it('answers 503 when the Worker has no key configured', async () => {
      const response = await post(makeEnv({ NEWS_API_KEY: '' }), { title: 'T', body: 'B' });
      assert.equal(response.status, 503);
    });

    it('answers 503 when the Worker has no database bound', async () => {
      const response = await post(makeEnv({ NEWS_DB: undefined }), { title: 'T', body: 'B' });
      assert.equal(response.status, 503);
    });
  });

  describe('validation', () => {
    it('rejects a malformed JSON body', async () => {
      const response = await post(makeEnv(), '{not json');
      assert.equal(response.status, 400);
    });

    it('rejects a non-object payload', async () => {
      const response = await post(makeEnv(), ['title']);
      assert.equal(response.status, 400);
    });

    it('requires title and body', async () => {
      for (const payload of [{ title: 'Only title' }, { body: 'Only body' }, {}]) {
        const response = await post(makeEnv(), payload);
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: 'Title and Body are required' });
      }
    });

    it('rejects an unparsable published_at', async () => {
      const response = await post(makeEnv(), { title: 'T', body: 'B', published_at: 'yesterday' });
      assert.equal(response.status, 400);
    });

    it('rejects a non-http source_url', async () => {
      const response = await post(makeEnv(), { title: 'T', body: 'B', source_url: 'javascript:alert(1)' });
      assert.equal(response.status, 400);
    });

    it('rejects a slug without letters or digits', async () => {
      const response = await post(makeEnv(), { title: 'T', body: 'B', slug: '---' });
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: 'slug must contain letters or digits' });
    });

    it('rejects non-string optional fields', async () => {
      const response = await post(makeEnv(), { title: 'T', body: 'B', author: 42 });
      assert.equal(response.status, 400);
    });
  });

  describe('publishing', () => {
    it('derives slug, excerpt, read time and kind when only title and body are sent', async () => {
      const response = await post(makeEnv(), {
        title: 'ZOHEN Ships First DC Charger to Europe',
        body: `Long body. `.repeat(300).trim(), // 900 words → 5 read minutes
      });
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.success, true);
      assert.equal(payload.slug, 'zohen-ships-first-dc-charger-to-europe');
      assert.equal(payload.url, 'https://zohencar.online/news/zohen-ships-first-dc-charger-to-europe');
      assert.equal(payload.kind, 'Industry Update');
      assert.match(String(payload.published_at), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\+00:00$/);
    });

    it('stores the row with derived fields and feed-compatible columns', async () => {
      const longBody = `Word. `.repeat(400).trim();
      await post(makeEnv(), { title: 'Derived Fields', body: longBody });
      const [row] = await storedRows();
      assert.equal(row.slug, 'derived-fields');
      assert.equal(row.legacy_path, '/news/derived-fields.html');
      assert.equal(row.kind, 'Industry Update');
      assert.equal(row.author, 'ZOHEN Charger Newsroom');
      assert.equal(Number(row.read_minutes), 2); // 400 words / 200 wpm
      assert.match(String(row.description), /^Word\. Word\./);
      assert.equal(row.rendered_html, longBody);
      assert.equal(row.source_markdown, longBody);
      assert.equal(row.content_hash, createHash('sha256').update(longBody).digest('hex'));
      assert.match(String(row.published_at), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\+00:00$/);
    });

    it('stores every explicitly provided field and honours published_at', async () => {
      const response = await post(makeEnv(), {
        title: 'CE Audit Passed',
        body: '<p>CE audit <b>passed</b>.</p>',
        slug: 'ce-audit-passed',
        kind: 'Certification',
        excerpt: 'Custom excerpt.',
        author: 'QA Team',
        source_name: 'ZOHEN QA',
        source_url: 'https://zohencar.online/qa',
        published_at: '2026-09-01T08:30:00Z',
      });
      assert.equal(response.status, 200);
      const [row] = await storedRows();
      assert.equal(row.slug, 'ce-audit-passed');
      assert.equal(row.kind, 'Certification');
      assert.equal(row.description, 'Custom excerpt.');
      assert.equal(row.author, 'QA Team');
      assert.equal(row.source_name, 'ZOHEN QA');
      assert.equal(row.source_url, 'https://zohencar.online/qa');
      assert.equal(row.published_at, '2026-09-01 08:30:00.000+00:00');
      assert.ok(String(row.body ?? row.rendered_html).includes('<b>passed</b>'));
    });

    it('appends -2 to a slug that already exists', async () => {
      const first = await post(makeEnv(), { title: 'Same Title', body: 'One' });
      const second = await post(makeEnv(), { title: 'Same', body: 'Two', slug: 'same-title' });
      assert.equal((await first.json()).slug, 'same-title');
      assert.equal((await second.json()).slug, 'same-title-2');
      assert.deepEqual((await storedRows()).map(row => row.slug), ['same-title', 'same-title-2']);
      assert.deepEqual((await storedRows()).map(row => row.legacy_path), ['/news/same-title.html', '/news/same-title-2.html']);
    });

    it('slugs a markup-bearing title from its plain words', async () => {
      const response = await post(makeEnv(), { title: '<b>Bold</b> Title Check', body: 'x' });
      assert.equal((await response.json()).slug, 'bold-title-check');
    });
  });
});
