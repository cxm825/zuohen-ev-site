import fs from 'node:fs/promises';
import path from 'node:path';

const data = JSON.parse((await fs.readFile(path.join('public', 'products.json'), 'utf8')).replace(/^\uFEFF/, ''));
const missing = [];
for (const item of data) {
  if (!item.image) { missing.push(item); continue; }
  try { await fs.access(path.join('public', item.image)); } catch { missing.push(item); }
}
if (missing.length) {
  console.error(`${missing.length} product record(s) have missing images.`);
  process.exit(1);
}
console.log(`Products OK: ${data.length} records, ${data.length - missing.length} images found.`);
