(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>\'\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const slugify = value => String(value || '').toLowerCase().trim().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  async function getDownloads() {
    if (location.protocol !== 'file:') {
      try {
        const response = await fetch('data/downloads.json', {cache:'no-store'});
        if (response.ok) return await response.json();
      } catch (error) { console.warn('Using local downloads-data.js fallback.', error); }
    }
    return Array.isArray(window.DOWNLOAD_DATA) ? window.DOWNLOAD_DATA : [];
  }

  function cardHTML(item) {
    const categorySlug = item.categorySlug || slugify(item.category);
    const tags = (item.tags || []).map(tag => `<span class="tut-tag">${esc(tag)}</span>`).join('');
    const image = item.image ? `<img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy">` : `<div class="download-placeholder" aria-hidden="true">⬇</div>`;
    const provider = item.provider || 'Download';
    return `<article class="product-card download-data-card" data-category="${esc(categorySlug)}">
      <a class="product-thumb" href="${esc(item.url)}" target="_blank" rel="noopener">${image}</a>
      <div class="product-info">
        <div class="tut-tags"><span class="tut-tag">${esc(item.category || 'Downloads')}</span>${tags}</div>
        <div class="product-title">${esc(item.title)}</div>
        <div class="product-desc">${esc(item.description || '')}</div>
        <a class="download-provider-button" href="${esc(item.url)}" target="_blank" rel="noopener">Get on ${esc(provider)} →</a>
      </div>
    </article>`;
  }

  function render(host, items) {
    items.sort((a,b)=>(b.publishedOrder||0)-(a.publishedOrder||0));
    const filters = document.querySelector('[data-download-filters]');
    const count = document.querySelector('[data-download-count]');
    const categories = new Map();
    items.forEach(item => {
      const slug=item.categorySlug||slugify(item.category);
      if(!categories.has(slug)) categories.set(slug,{name:item.category,count:0});
      categories.get(slug).count++;
    });
    filters.innerHTML = `<button class="filter-btn active" data-filter="all">All Downloads <span>${items.length}</span></button>` +
      [...categories.entries()].map(([slug,info])=>`<button class="filter-btn" data-filter="${esc(slug)}">${esc(info.name)} <span>${info.count}</span></button>`).join('');
    host.innerHTML = items.length ? items.map(cardHTML).join('') : '<p class="v2-empty-library">Downloads will appear here after a Markdown entry is added to <code>content/downloads</code>.</p>';
    if(count) count.textContent=`${items.length} download${items.length===1?'':'s'}`;
    filters.addEventListener('click', e => {
      const btn=e.target.closest('[data-filter]'); if(!btn)return;
      const selected=btn.dataset.filter;
      host.querySelectorAll('[data-category]').forEach(card=>card.hidden=selected!=='all'&&card.dataset.category!==selected);
      filters.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b===btn));
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const host=document.querySelector('[data-download-library]');
    if(host) render(host,await getDownloads());
  });
})();
