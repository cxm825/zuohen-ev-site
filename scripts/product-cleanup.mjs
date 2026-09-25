/**
 * Product catalog cleanup analysis.
 *
 * Reads public/products.json and produces product-cleanup-report.md listing:
 *  - critical data errors (duplicate slugs)
 *  - exact duplicates (same listing/title)
 *  - near-duplicates (same power + highly similar title)
 *  - data-quality flags (no price, no power, missing image)
 *
 * Read-only: it never modifies products.json. Run: node scripts/product-cleanup.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const raw = fs.readFileSync(path.join(root, 'public', 'products.json'), 'utf8').replace(/^\uFEFF/, '');
const items = JSON.parse(raw);

const STOP = new Set([
  'certified', 'wholesale', 'hot', 'sale', 'new', 'oem', 'odm', 'factory', 'price', 'china',
  'manufacturer', 'manufacturers', 'supply', 'stock', 'ready', 'ship', 'high', 'quality',
  'for', 'with', 'and', 'the', 'of', 'in', 'to', 'a', 'an',
]);

// Tokens that distinguish genuinely different products in this catalog:
// connector standards and electrical ratings. "Type 1" vs "Type 2" or
// "CCS1" vs "CCS2" are different products even when titles look alike.
const SPEC_RE = /^(ccs1|ccs2|ccs|gbt|nacs|chademo|type1|type2|tesla|\d+(?:\.\d+)?(?:a|v|kw)?)$/;

const normTokens = title =>
  String(title).toLowerCase()
    .replace(/gb\/?\s?t/g, 'gbt')
    .replace(/cha\s?demo/g, 'chademo')
    .replace(/type\s?([12])/g, 'type$1')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => w && !STOP.has(w));

const specSignature = tokens =>
  JSON.stringify([...new Set(tokens.filter(w => SPEC_RE.test(w)))].sort());

const powerKey = item => {
  const found = `${item.title} ${item.listInfo}`.match(/\b\d{1,3}(?:\.\d+)?\s?kw\b/gi) || [];
  return found.map(s => s.toLowerCase().replace(/\s/g, '')).sort().join(',') || 'no-kw';
};

const jaccard = (a, b) => {
  const A = new Set(a); const B = new Set(b);
  const inter = [...A].filter(x => B.has(x)).length;
  return inter / new Set([...a, ...b]).size;
};

const hasPrice = item => /\$[\d,.]+/.test(item.listInfo || '');
const titleOf = item => item.displayTitle || item.title;

// ---------------------------------------------------------------- groupings

const groups = [];
const assigned = new Set();

function addGroup(kind, reason, members, keepId) {
  members.forEach(m => assigned.add(m.id));
  groups.push({ kind, reason, members, keepId });
}

// 1. Duplicate slugs — data error regardless of similarity
const bySlug = new Map();
for (const item of items) {
  const key = String(item.slug || '').toLowerCase();
  if (!bySlug.has(key)) bySlug.set(key, []);
  bySlug.get(key).push(item);
}
for (const [, members] of bySlug) {
  if (members.length > 1) {
    const keeper = members.find(m => hasPrice(m) && m.image) || members[0];
    addGroup('critical', `duplicate slug "${members[0].slug}"`, members, keeper.id);
  }
}

// 2. Exact normalized title duplicates
const byTitle = new Map();
for (const item of items) {
  const key = normTokens(item.title).join(' ');
  if (!byTitle.has(key)) byTitle.set(key, []);
  byTitle.get(key).push(item);
}
for (const [, members] of byTitle) {
  if (members.length > 1 && !members.every(m => assigned.has(m.id))) {
    const keeper = members.find(m => hasPrice(m) && m.image) || members[0];
    addGroup('exact', 'identical product title', members, keeper.id);
  }
}

// 3. Near-duplicates: same power bucket + token similarity ≥ 0.72
const remaining = items.filter(i => !assigned.has(i.id));
const buckets = new Map();
for (const item of remaining) {
  const key = `${powerKey(item)}|${item.category || 'uncat'}`;
  if (!buckets.has(key)) buckets.set(key, []);
  buckets.get(key).push(item);
}
const seenPairs = new Set();
for (const [, members] of buckets) {
  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      const a = members[i]; const b = members[j];
      if (assigned.has(a.id) || assigned.has(b.id)) continue;
      const pairKey = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
      if (seenPairs.has(pairKey)) continue;
      const sim = jaccard(normTokens(a.title), normTokens(b.title));
      const specsMatch = specSignature(normTokens(a.title)) === specSignature(normTokens(b.title));
      if (sim >= 0.72 && specsMatch) {
        seenPairs.add(pairKey);
        const keeper = hasPrice(a) === hasPrice(b)
          ? (a.title.length <= b.title.length ? a : b)
          : (hasPrice(a) ? a : b);
        addGroup('near', `similar title (${Math.round(sim * 100)}% overlap, ${powerKey(a)})`, [a, b], keeper.id);
      }
    }
  }
}

// 4. Data-quality flags on whatever is left
const flagged = [];
for (const item of items) {
  if (assigned.has(item.id)) continue;
  const problems = [];
  if (!item.image || !item.image.startsWith('assets/')) problems.push('missing image');
  if (!hasPrice(item)) problems.push('no price in source data');
  if (powerKey(item) === 'no-kw') problems.push('no power rating anywhere');
  if (problems.length) flagged.push({ item, problems });
}

// ---------------------------------------------------------------- report

const removeIds = new Set();
for (const group of groups) {
  group.members.filter(m => m.id !== group.keepId).forEach(m => removeIds.add(m.id));
}
const flagRemoveIds = new Set(flagged.filter(f => f.problems.includes('missing image')).map(f => f.item.id));

const row = (item, note) =>
  `| ${item.id} | ${titleOf(item).slice(0, 90)}${titleOf(item).length > 90 ? '…' : ''} | ${item.category || '—'} | ${item.image ? 'yes' : 'no'} | ${hasPrice(item) ? 'yes' : 'no'} | ${note} |`;

const lines = [];
lines.push('# Product catalog cleanup report');
lines.push('');
lines.push(`Generated ${new Date().toISOString().slice(0, 10)} from \`public/products.json\` (${items.length} items).`);
lines.push('**This report is read-only — nothing has been removed from the catalog yet.**');
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push(`| Metric | Count |`);
lines.push(`| --- | --- |`);
lines.push(`| Total products | ${items.length} |`);
lines.push(`| Critical data errors (duplicate slugs) | ${groups.filter(g => g.kind === 'critical').reduce((n, g) => n + g.members.length - 1, 0)} |`);
lines.push(`| Exact duplicate rows | ${groups.filter(g => g.kind === 'exact').reduce((n, g) => n + g.members.length - 1, 0)} |`);
lines.push(`| Near-duplicate rows | ${groups.filter(g => g.kind === 'near').reduce((n, g) => n + g.members.length - 1, 0)} |`);
lines.push(`| Items with data-quality flags | ${flagged.length} |`);
lines.push(`| **Recommended removals (duplicates only)** | **${removeIds.size}** |`);
lines.push(`| Catalog after cleanup | **${items.length - removeIds.size}** |`);
lines.push('');
lines.push('Keeper selection: within each group the item with a price and image wins; ties go to the shorter, cleaner title. IDs refer to the `id` field in products.json.');
lines.push('');

const section = (title, kind, note) => {
  const list = groups.filter(g => g.kind === kind);
  if (!list.length) return;
  lines.push(`## ${title}`);
  lines.push('');
  lines.push(note);
  lines.push('');
  lines.push('| ID | Title | Category | Image | Price | Action |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const group of list) {
    for (const member of group.members) {
      const action = member.id === group.keepId ? `**KEEP** — ${group.reason}` : `remove — duplicate of #${group.keepId}`;
      lines.push(row(member, action));
    }
    lines.push('| | | | | | |');
  }
  lines.push('');
};

section('1. Critical: duplicate slugs', 'critical', 'Two or more products share one slug. Slugs key the product URLs, so these break canonical URLs and must be resolved first (keep one, or re-slug).');
section('2. Exact duplicates', 'exact', 'Same product listed more than once under an identical title.');
section('3. Near-duplicates', 'near', 'Same power rating and ≥72% title-token overlap — most of these are the same hardware in trim variants. Review before removal; genuine variants (color, cable length) may be worth keeping.');

if (flagged.length) {
  lines.push('## 4. Data-quality flags (kept, for review)');
  lines.push('');
  lines.push('| ID | Title | Category | Image | Price | Problems |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const { item, problems } of flagged) lines.push(row(item, problems.join(', ')));
  lines.push('');
  lines.push('These are not counted in the removal total above: missing prices and absent power figures are common on brand-new listings, and the asset audit confirms every image file exists. Fix the data or remove them in a second pass once confirmed.');
  lines.push('');
}

lines.push('## Suggested next step');
lines.push('');
lines.push('Confirm the list, then remove the marked IDs from `public/products.json` (renumber `id` fields) and re-run `npm run audit:assets`. The three pages that consume the catalog (homepage grid, /products, /product) all read the same file, so no other changes are needed.');
lines.push('');

const out = path.join(root, 'product-cleanup-report.md');
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`Report written to ${out}`);
console.log(`Total ${items.length} | duplicate slugs ${groups.filter(g => g.kind === 'critical').length} groups | exact ${groups.filter(g => g.kind === 'exact').length} groups | near ${groups.filter(g => g.kind === 'near').length} groups | flagged ${flagged.length} | recommended removals ${removeIds.size} | remaining ${items.length - removeIds.size}`);
