(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const slugify = value => String(value || '').toLowerCase().trim().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  async function getTutorials() {
    if (location.protocol !== 'file:') {
      try {
        const response = await fetch('data/tutorials.json', {cache:'no-store'});
        if (response.ok) return await response.json();
      } catch (error) { console.warn('Using local tutorial-data.js fallback.', error); }
    }
    return Array.isArray(window.TUTORIAL_DATA) ? window.TUTORIAL_DATA : [];
  }

  function cardHTML(t) {
    const duration = t.duration ? `<span class="tut-duration">${esc(t.duration)}</span>` : '';
    const xp = Number(t.xp || t.durationSeconds || 0);
    const tags = (t.tags || []).map(tag => `<span class="tut-tag">${esc(tag)}</span>`).join('');
    return `<article class="tut-card" data-tutorial-id="${esc(t.id)}" data-difficulty="${esc((t.difficulty||'beginner').toLowerCase())}" data-xp="${xp}" data-topic="${esc(t.topicSlug || slugify(t.topic))}">
      <button class="tut-thumb-link" type="button" data-video="${esc(t.youtubeId)}" aria-label="Play ${esc(t.title)}">
        <div class="tut-thumb"><img src="https://i.ytimg.com/vi/${esc(t.youtubeId)}/maxresdefault.jpg" onerror="this.src='https://i.ytimg.com/vi/${esc(t.youtubeId)}/mqdefault.jpg'" alt="${esc(t.title)}" loading="lazy"><div class="play-btn">▶</div>${duration}</div>
      </button>
      <div class="tut-meta"><div class="tut-tags">${tags}</div><div class="tut-title">${esc(t.title)}</div><p class="tut-excerpt">${esc(t.description || '')}</p>
      <div class="tut-footer"><span>${t.duration ? '🕐 '+esc(t.duration) : esc(t.difficulty || '')}${xp ? ' · ⚡ '+xp.toLocaleString()+' XP' : ''}</span><button class="watch-link tutorial-watch-button" type="button">Watch →</button></div><button class="xp-complete-btn"></button></div>
    </article>`;
  }

  function renderLibrary(host, allTutorials) {
    const section = host.dataset.tutorialSection;
    const tutorials = allTutorials.filter(t => t.section === section).sort((a,b)=>(b.publishedOrder||0)-(a.publishedOrder||0));
    const filterHost = document.querySelector(`[data-topic-filters="${CSS.escape(section)}"]`);
    const countHost = document.querySelector(`[data-tutorial-count="${CSS.escape(section)}"]`);
    const topics = new Map();
    tutorials.forEach(t => { const slug=t.topicSlug||slugify(t.topic); if(!topics.has(slug)) topics.set(slug,{name:t.topic, count:0, xp:0}); topics.get(slug).count++; topics.get(slug).xp += Number(t.xp || t.durationSeconds || 0); });
    if (filterHost) {
      const totalXP = tutorials.reduce((sum,t)=>sum+Number(t.xp||t.durationSeconds||0),0);
      filterHost.innerHTML = `<button class="filter-btn active" data-filter="all">All Tutorials <span>${tutorials.length} · ${totalXP.toLocaleString()} XP</span></button>` +
        [...topics.entries()].map(([slug,info])=>`<button class="filter-btn" data-filter="${esc(slug)}">${esc(info.name)} <span>${info.count} · ${info.xp.toLocaleString()} XP</span></button>`).join('');
    }
    host.innerHTML = tutorials.length ? tutorials.map(cardHTML).join('') : '<p class="v2-empty-library">Tutorials will appear here as soon as a Markdown entry is added to <code>content/tutorials</code>.</p>';
    if (countHost) countHost.textContent = `${tutorials.length} tutorial${tutorials.length===1?'':'s'}`;
    const summaryTarget = filterHost?.parentElement;
    if (summaryTarget && !summaryTarget.querySelector('.tutorial-library-summary')) {
      const summary = document.createElement('div');
      summary.className = 'tutorial-library-summary';
      const totalXP = tutorials.reduce((sum,t)=>sum+Number(t.xp||t.durationSeconds||0),0);
      const totalSeconds = tutorials.reduce((sum,t)=>sum+Number(t.durationSeconds||0),0);
      const hours = Math.floor(totalSeconds/3600);
      const minutes = Math.floor((totalSeconds%3600)/60);
      summary.innerHTML = `<strong>${tutorials.length}</strong> tutorials <span>•</span> <strong>${totalXP.toLocaleString()}</strong> XP available <span>•</span> <strong>${hours ? hours+'h ' : ''}${minutes}m</strong> learning time`;
      filterHost.before(summary);
    }

    const applyFilter = slug => {
      host.querySelectorAll('.tut-card').forEach(card => { card.hidden = slug !== 'all' && card.dataset.topic !== slug; });
      if (filterHost) filterHost.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active',btn.dataset.filter===slug));
      history.replaceState(null,'',slug==='all'?location.pathname:`${location.pathname}?topic=${encodeURIComponent(slug)}`);
    };
    if (filterHost) filterHost.addEventListener('click', e => { const btn=e.target.closest('[data-filter]'); if(btn) applyFilter(btn.dataset.filter); });
    host.addEventListener('click', e => { const card=e.target.closest('.tut-card'); const play=e.target.closest('[data-video],.tutorial-watch-button'); if(play && card) openVideoById(card.querySelector('[data-video]').dataset.video, card.querySelector('.tut-title').textContent); });
    const requested = new URLSearchParams(location.search).get('topic');
    if (requested && (requested==='all'||topics.has(requested))) applyFilter(requested);
    if (typeof initTutorialButtons === 'function') initTutorialButtons();
  }

  window.openVideoById = window.openVideoById || function(videoId,title) {
    const modal=document.getElementById('video-modal'); if(!modal) return;
    modal.querySelector('#video-modal-iframe').src=`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    modal.querySelector('#video-modal-title').textContent=title||''; modal.classList.add('modal-open'); document.body.style.overflow='hidden';
  };
  window.closeVideo = function(){ const modal=document.getElementById('video-modal'); if(!modal)return; modal.classList.remove('modal-open'); modal.querySelector('#video-modal-iframe').src=''; document.body.style.overflow=''; };
  window.closeVideoOnBackdrop = e => { if(e.target===document.getElementById('video-modal')) closeVideo(); };
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeVideo();});

  document.addEventListener('DOMContentLoaded', async () => {
    const data=await getTutorials(); window.BRI_TUTORIALS=data;
    document.querySelectorAll('[data-tutorial-section]').forEach(host=>renderLibrary(host,data));
    document.dispatchEvent(new CustomEvent('tutorialdataready',{detail:data}));
  });
})();
