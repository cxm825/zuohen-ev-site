const root = document.querySelector('#detail');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[char]));
}

function enrich(product, index) {
  const text = `${product.title} ${product.listInfo}`.toLowerCase();
  const category = product.category || 'EV Charging';
  const standards = product.standards || ([...new Set((text.match(/ccs1|ccs2|gb\/?t|nacs|chademo|type ?1|type ?2/gi) || []).map(value => value.toUpperCase()))].slice(0, 4).join(' / '));
  const power = product.power || (text.match(/\b(?:\d{1,3}(?:\.\d+)?\s?kw|\d{2,3}a|\d{3,4}v)\b/gi) || []).slice(0, 5).join(' · ');
  return { ...product, id: product.id ?? index, displayTitle: product.displayTitle || product.title, category, standards, power };
}

function referenceList(items) {
  return items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

async function init() {
  try {
    const response = await fetch('/products.json');
    if (!response.ok) throw new Error('Product data unavailable');
    const raw = await response.json();
    const requested = Number(new URLSearchParams(location.search).get('id'));
    const matched = raw.find(item => Number(item.id) === requested);
    if (!matched) {
      root.innerHTML = '<div class="buyer-note"><strong>Product reference unavailable</strong><span>This item is no longer in our catalog. Browse the products page or contact ZOHEN for sourcing support.</span></div>';
      document.title = 'Product not found | ZOHEN';
      return;
    }
    const product = enrich(matched, requested);
    const image = product.image && product.image.startsWith('assets/') ? product.image : '';
    const related = raw.map(enrich).filter(item => item.id !== product.id && item.category === product.category).slice(0, 4);
    const title = escapeHtml(product.displayTitle);
    const listInfo = escapeHtml(product.listInfo || 'Sourcing information available by request.');
    const category = escapeHtml(product.category);
    const standards = escapeHtml(product.standards || 'Confirm standard with engineering');
    const power = escapeHtml(product.power || 'Configuration-dependent');
    root.innerHTML = `
      <p class="eyebrow">HOME / PRODUCTS / ${category.toUpperCase()}</p>
      <div class="buyer-note"><strong>Buyer sourcing reference</strong><span>This page is for product discovery and project qualification, not online checkout. Confirm final specifications with ZOHEN engineering.</span></div>
      <div class="detail-grid">
        <div class="detail-image">${image ? `<img src="/${image}" alt="${title}" onerror="this.closest('.detail-image').remove()">` : ''}</div>
        <div class="detail-copy-column">
          <span class="tag">${category}</span>
          <h1>${title}</h1>
          <p class="detail-lead">${listInfo}</p>
          <div class="detail-stats"><div><b>${power || 'Available by request'}</b><span>Power / input reference</span></div><div><b>${standards}</b><span>Connector standards</span></div><div><b>Confirm with sales</b><span>Commercial terms</span></div></div>
          <h3>Product overview</h3>
          <p class="detail-copy">This ${category.toLowerCase()} product is presented as a sourcing reference for distributors, fleet operators, installers and charging projects. Use the inquiry form to confirm the exact model, electrical configuration, connector, cable length, compliance documents and destination-market requirements.</p>
          <a class="button primary" href="contact.html?product=${encodeURIComponent(product.displayTitle)}">Request a quotation →</a>
        </div>
      </div>
      <div class="detail-sections">
        <section><p class="eyebrow">CONFIRMED FROM LISTING</p><ul>${referenceList([product.displayTitle, product.power || 'Power rating available by model', product.standards || 'Connector standard available by model'])}</ul></section>
        <section><p class="eyebrow">OPTIONAL CONFIGURATIONS</p><ul>${referenceList(['OEM / ODM branding and packaging', 'Cable length, connector and housing options', 'Communication, payment and installation configuration'])}</ul></section>
        <section><p class="eyebrow">TO CONFIRM WITH ENGINEERING</p><ul>${referenceList(['Input voltage, output current and efficiency', 'Protection rating, operating temperature and certifications', 'Lead time, sample policy and destination-market compliance'])}</ul></section>
      </div>
      <section class="related"><div class="section-heading"><div><p class="eyebrow">RELATED SOURCING OPTIONS</p><h2>More ${category.toLowerCase()} products.</h2></div><a class="text-link" href="products.html">View catalog →</a></div><div class="product-grid">${related.map(item => `<article class="product-card"><div class="product-image"><img src="/${item.image}" alt="${escapeHtml(item.displayTitle)}"></div><div class="product-body"><span class="tag">${escapeHtml(item.category)}</span><h3>${escapeHtml(item.displayTitle)}</h3><a class="product-link" href="product.html?id=${item.id}">View sourcing reference →</a></div></article>`).join('')}</div></section>`;
    document.title = `${product.displayTitle} | ZOHEN Sourcing Reference`;
    const schema = { '@context': 'https://schema.org', '@type': 'Product', name: product.displayTitle, description: `Buyer sourcing reference for ${product.category.toLowerCase()} buyers. Confirm final configuration with ZOHEN engineering.`, image: image ? [`${location.origin}/${image}`] : [], sku: product.slug || `zohen-${product.id}`, brand: { '@type': 'Brand', name: 'ZOHEN' }, category: product.category, url: location.href };
    const script = document.createElement('script'); script.type = 'application/ld+json'; script.textContent = JSON.stringify(schema); document.head.appendChild(script);
  } catch (error) {
    root.innerHTML = '<div class="buyer-note"><strong>Product reference unavailable</strong><span>Please return to the catalog or contact ZOHEN for sourcing support.</span></div>';
  }
}
init();


