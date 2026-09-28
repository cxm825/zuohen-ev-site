// Shared read access to the static product catalog (public/products.json).
// Cached per isolate: the file is ~350KB and callers need only id/slug pairs.

let cache = null;

async function loadProducts(env, request) {
  if (cache) return cache;
  try {
    const response = await env.ASSETS.fetch(new Request(new URL('/products.json', request.url)));
    if (!response.ok) return [];
    const items = await response.json();
    if (!Array.isArray(items)) return [];
    cache = items
      .map(item => ({ id: Number(item?.id), slug: String(item?.slug ?? '') }))
      .filter(item => Number.isInteger(item.id) && item.id >= 0 && /^[a-z0-9-]+$/.test(item.slug));
    return cache;
  } catch {
    return [];
  }
}

/** Slug for a legacy ?id= deep link, or '' when the id is unknown. */
export async function productSlugForId(env, request, id) {
  const products = await loadProducts(env, request);
  return products.find(item => item.id === id)?.slug ?? '';
}

/** Unique product slug list for the sitemap, in catalog order. */
export async function productSlugs(env, request) {
  const products = await loadProducts(env, request);
  return [...new Set(products.map(item => item.slug))];
}
