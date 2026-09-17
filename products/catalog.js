let products = [];
const pageSize = 16;
let currentPage = Math.max(1, Number(new URLSearchParams(location.search).get('page')) || 1);
let activeCategory = new URLSearchParams(location.search).get('category') || 'all';

const grid = document.querySelector('#product-grid');
const search = document.querySelector('#search');
const category = document.querySelector('#category');
const count = document.querySelector('#result-count');
const more = document.querySelector('#load-more');

function enrich(product, id) {
  const text = `${product.title} ${product.listInfo}`.toLowerCase();
  let productCategory = 'EV Charging';
  if (/adapter|connector|plug|socket|cable holder|v2l/.test(text)) productCategory = 'Adapter';
  else if (/portable|mobile|movable/.test(text)) productCategory = 'Portable';
  else if (/ac |wallbox|type 1 type 2|type1 type2|7kw|11kw|22kw|44kw/.test(text)) productCategory = 'AC Charging';
  else if (/dc |fast|kw/.test(text)) productCategory = 'DC Charging';
  const power = (text.match(/\b(?:\d{1,3}(?:\.\d+)?\s?kw|\d{2,3}a|\d{3,4}v)\b/gi) || []).slice(0, 3).join(' · ');
  const price = (product.listInfo.match(/\$[\d,.]+(?:-[\d,.]+)?/) || [])[0] || 'Request pricing';
  const moq = (product.listInfo.match(/Min\. Order:?\s*\d+\s+\w+/i) || [])[0] || '';
  return { ...product, id, category: productCategory, power, price, moq };
}

function card(product) {
  const image = product.image && product.image.startsWith('assets/') ? product.image : '';
  const safeTitle = product.title.replace(/"/g, '&quot;');
  const imageMarkup = image
    ? `<img loading="lazy" src="${image}" alt="${safeTitle}" onerror="this.closest('.product-card').remove();document.querySelector('#result-count').textContent='Some unavailable products were hidden';">`
    : '';
  return `<article class="product-card"><div class="product-image">${imageMarkup}</div><div class="product-body"><span class="tag">${product.category}</span><h3>${product.title}</h3><p class="product-info">${product.power || 'Global connector options'}<br>${product.price}${product.moq ? ` · ${product.moq}` : ''}</p><a class="product-link" href="product.html?id=${product.id}">View product details →</a></div></article>`;
}

function render() {
  const query = search.value.toLowerCase().trim();
  const filtered = products.filter(product => {
    const categoryMatch = activeCategory === 'all' || product.category === activeCategory;
    const queryMatch = !query || `${product.title} ${product.listInfo} ${product.power}`.toLowerCase().includes(query);
    return categoryMatch && queryMatch;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * pageSize;
  const shown = filtered.slice(start, start + pageSize);
  grid.innerHTML = shown.map(card).join('') || '<p>No products match your search.</p>';
  count.textContent = filtered.length ? `Page ${currentPage} of ${totalPages} · Showing ${start + 1}–{start + shown.length} of ${filtered.length} products` : 'No products found';
  const pageItems = [];
  const addPage = page => pageItems.push(`<button type="button" class="page-button ${page === currentPage ? 'active' : ''}" data-page="${page}">${page}</button>`);
  const addEllipsis = () => pageItems.push('<span class="page-ellipsis">…</span>');
  if (totalPages <= 7) {
    for (let page = 1; page <= totalPages; page++) addPage(page);
  } else {
    addPage(1);
    if (currentPage > 4) addEllipsis();
    const from = Math.max(2, currentPage - 1);
    const to = Math.min(totalPages - 1, currentPage + 1);
    for (let page = from; page <= to; page++) addPage(page);
    if (currentPage < totalPages - 3) addEllipsis();
    addPage(totalPages);
  }
  more.innerHTML = `<span class="pagination-label">Page navigation</span><button type="button" class="page-button" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>← Previous</button>${pageItems.join('')}<button type="button" class="page-button" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
  more.style.display = filtered.length > pageSize ? 'flex' : 'none';
  more.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => {
    const target = button.dataset.page;
    currentPage = target === 'prev' ? currentPage - 1 : target === 'next' ? currentPage + 1 : Number(target);
    const url = new URL(location.href);
    url.searchParams.set('page', currentPage);
    if (activeCategory === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', activeCategory);
    history.pushState({}, '', url);
    render();
    window.scrollTo({top: document.querySelector('#products')?.offsetTop || 0, behavior: 'smooth'});
  }));
}

async function init() {
  try {
    const response = await fetch('/products.json');
    products = (await response.json()).map(enrich);
    category.value = activeCategory;
    render();
  } catch (error) {
    grid.innerHTML = '<p>Product data is unavailable. Please refresh the page.</p>';
  }
}

search.addEventListener('input', () => { currentPage = 1; render(); });
category.addEventListener('change', () => { activeCategory = category.value; currentPage = 1; render(); });
window.addEventListener('popstate', () => { currentPage = Math.max(1, Number(new URLSearchParams(location.search).get('page')) || 1); activeCategory = new URLSearchParams(location.search).get('category') || 'all'; category.value = activeCategory; render(); });
init();


