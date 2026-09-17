import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const root = path.resolve('public');
const missing = new Set();
let refs = 0;
const files = [];
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && (entry.name === 'product' || entry.name === 'products')) continue;
    if (entry.isDirectory()) await walk(full);
    else if (/\.(html?|css|js|json|xml)$/i.test(entry.name)) files.push(full);
  }
}
function check(value, source) {
  if (!value || /^(https?:|data:|mailto:|#|javascript:)/i.test(value)) return;
  const clean = value.split(/[?#]/)[0];
  if (!/\.(png|jpe?g|gif|webp|svg|ico|css|js|json|xml|html?)$/i.test(clean) && !clean.startsWith('assets/')) return;
  const relative = clean.startsWith('/') ? clean.slice(1) : clean;
  const target = path.normalize(path.join(path.dirname(source), relative));
  if (!target.startsWith(root)) return;
  refs++;
  if (!existsSync(target)) missing.add(path.relative(root, target));
}
await walk(root);
for (const file of files) {
  const content = await fs.readFile(file, 'utf8');
  for (const match of content.matchAll(/(?:src|href|poster|content|image)\s*=\s*["']([^"']+)["']/gi)) check(match[1], file);
  for (const match of content.matchAll(/url\(\s*["']?([^\)"']+)["']?\s*\)/gi)) check(match[1], file);
  for (const match of content.matchAll(/(?:src|image)\s*[:=]\s*["']([^"']+)["']/gi)) check(match[1], file);
}
const products = JSON.parse((await fs.readFile(path.join(root, 'products.json'), 'utf8')).replace(/^\uFEFF/, ''));
for (const item of products) if (item.image) check(item.image, path.join(root, 'products.json'));
console.log(`Scanned ${files.length} source files and ${refs} local references.`);
console.log(`Product records: ${products.length}; product images checked: ${products.filter(item => item.image).length}.`);
if (missing.size) { console.error(`Missing resources (${missing.size}):`); for (const item of missing) console.error(`- ${item}`); process.exitCode = 1; }
else console.log('Missing resources: 0');
