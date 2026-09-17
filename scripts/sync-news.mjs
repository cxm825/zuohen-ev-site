import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const sourceDir = path.join(root, 'content', 'news');
const dbName = process.env.NEWS_DB_NAME || 'zuohen-news';
const remote = process.argv.includes('--remote');

function parseMarkdown(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) throw new Error('missing YAML front matter');
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^([\w-]+):\s*["']?(.*?)["']?\s*$/);
    if (item) metadata[item[1]] = item[2];
  }
  if (!metadata.title || !metadata.description || !metadata.legacy_path) throw new Error('title, description and legacy_path are required');
  return { metadata, body: match[2] };
}
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]); }
function renderMarkdown(markdown) {
  return markdown.split(/\r?\n/).reduce((out, line) => {
    if (!line.trim()) return out;
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) return out + `<h${heading[1].length}>${escapeHtml(heading[2])}</h${heading[1].length}>`;
    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (item) return out + `<li>${escapeHtml(item[1])}</li>`;
    return out + `<p>${escapeHtml(line.trim())}</p>`;
  }, '').replace(/(?:<li>.*?<\/li>)+/gs, value => `<ul>${value}</ul>`);
}
function sql(value) { return `'${String(value ?? '').replaceAll("'", "''")}'`; }

const names = (await fs.readdir(sourceDir, { withFileTypes: true })).filter(item => item.isFile() && item.name.toLowerCase().endsWith('.md')).map(item => item.name).sort();
if (!names.length) { console.warn('No Markdown files found in content/news; skipping news sync.'); process.exit(0); }
const statements = [];
for (const name of names) {
  const source = await fs.readFile(path.join(sourceDir, name), 'utf8');
  const { metadata, body } = parseMarkdown(source);
  const slug = metadata.slug || name.replace(/\.md$/i, '');
  const published = metadata.date || new Date().toISOString().slice(0, 10);
  const hash = crypto.createHash('sha256').update(source).digest('hex');
  const rendered = renderMarkdown(body);
  statements.push(`INSERT INTO news (slug, legacy_path, title, description, published_at, updated_at, image, source_markdown, rendered_html, content_hash) VALUES (${sql(slug)}, ${sql(metadata.legacy_path)}, ${sql(metadata.title)}, ${sql(metadata.description)}, ${sql(published)}, CURRENT_TIMESTAMP, ${sql(metadata.image || '')}, ${sql(source)}, ${sql(rendered)}, ${sql(hash)}) ON CONFLICT(slug) DO UPDATE SET legacy_path=excluded.legacy_path, title=excluded.title, description=excluded.description, published_at=excluded.published_at, updated_at=CURRENT_TIMESTAMP, image=excluded.image, source_markdown=excluded.source_markdown, rendered_html=excluded.rendered_html, content_hash=excluded.content_hash WHERE news.content_hash <> excluded.content_hash;`);
}
const sqlFile = path.join(root, '.wrangler', 'news-sync.sql');
await fs.mkdir(path.dirname(sqlFile), { recursive: true });
await fs.writeFile(sqlFile, statements.join('\n'), 'utf8');
try {
  const args = ['d1', 'execute', dbName, remote ? '--remote' : '--local', '--file', sqlFile];
  const command = process.platform === 'win32' ? 'cmd.exe' : 'npx';
  const commandArgs = process.platform === 'win32' ? ['/d', '/s', '/c', 'npx wrangler ' + args.join(' ')] : ['wrangler', ...args];
  const { stdout, stderr } = await execFileAsync(command, commandArgs, { cwd: root, maxBuffer: 10 * 1024 * 1024 });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  console.log(`Synced ${names.length} news Markdown file(s) to ${dbName} (${remote ? 'remote' : 'local'}).`);
} catch (error) {
  console.error(error.stdout || error.stderr || error.message);
  process.exit(1);
}
