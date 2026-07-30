// ============================================================
//  main.js — shared across all pages
// ============================================================

// ============================================================
//  Tutorial content is loaded from data/tutorials.json.
//  For direct local preview, data/tutorials-data.js is the generated fallback.
// ============================================================
let TUTORIALS = Array.isArray(window.TUTORIAL_DATA) ? window.TUTORIAL_DATA : [];

// ============================================================
//  HERO_VIDEO_IDS — automatically derived from TUTORIALS so the
//  scrolling hero background always stays in sync with your content.
//  Optionally add extra IDs below for more background variety.
// ============================================================
const HERO_VIDEO_IDS = [
  ...TUTORIALS.map(t => t.youtubeId || t.id),
  // extra background-only IDs (optional — won't show as cards):
  'UrFgT7LMp9I', '7zxj4kGN3NQ', 'v3dJ2UvV8sI', 'ijt-1CUFouA',
  'DXVfmzvmK4c', '-lKuSonXKqo', 'yCD80QSTWmg', 'z-l0xmczPhc',
  'v_PK6CV_ktQ', 'zb6I3HiQ3Sk', 'ux4qXyJpavU', 'WPHjfOoZnXg',
  'YLOrS1kgCpc', 'X2EuW1AgzTw', 'RokaDLSQT0M', 'qZj_TGe4nLo',
];

// ============================================================
//  LATEST TUTORIALS CAROUSEL
//  Reads from TUTORIALS array above. Renders into
//  #latest-tutorials-track on the homepage automatically.
//  XP buttons are wired up by xp.js after DOMContentLoaded.
// ============================================================
function buildLatestCarousel() {
  const track = document.getElementById('latest-tutorials-track');
  const carousel = document.getElementById('latest-tutorials-carousel');
  const prevButton = document.getElementById('latest-tutorials-prev');
  const nextButton = document.getElementById('latest-tutorials-next');
  if (!track || !carousel) return;

  const latest = [...TUTORIALS]
    .sort((a, b) => (b.publishedOrder || 0) - (a.publishedOrder || 0))
    .slice(0, 8);

  latest.forEach(raw => {
    const tut = {
      id: raw.youtubeId || raw.id,
      tutId: raw.id || raw.tutId,
      title: raw.title,
      tags: raw.tags || [],
      duration: raw.duration || raw.difficulty || 'Tutorial',
      difficulty: (raw.difficulty || 'beginner').toLowerCase(),
      excerpt: raw.description || raw.excerpt || '',
      section: raw.section,
      xp: Number(raw.xp || raw.durationSeconds || 0)
    };
    const targetPage = tut.section === 'Game Development'
      ? 'game-development.html'
      : tut.section === 'Animation'
        ? 'animation.html'
        : '3d-graphics.html';
    const tagsHTML = tut.tags.map(tag => `<span class="tut-tag">${tag}</span>`).join('');

    const card = document.createElement('article');
    card.className = 'tut-card latest-carousel-card';
    card.dataset.tutorialId = tut.tutId;
    card.dataset.difficulty = tut.difficulty;
    card.dataset.xp = String(tut.xp);
    card.innerHTML = `
      <a class="tut-thumb-link" href="${targetPage}" aria-label="Watch ${tut.title}">
        <div class="tut-thumb" data-youtube-id="${tut.id}">
          <div class="tut-thumb-image" role="img" aria-label="${tut.title}"></div>
          <div class="play-btn" aria-hidden="true">▶</div>
        </div>
      </a>
      <div class="tut-meta">
        <div class="tut-tags">${tagsHTML}</div>
        <div class="tut-title">${tut.title}</div>
        <p class="tut-excerpt">${tut.excerpt}</p>
        <div class="tut-footer">
          <span>🕐 ${tut.duration}${tut.xp ? ` · ⚡ ${tut.xp.toLocaleString()} XP` : ''}</span>
          <a href="${targetPage}" class="watch-link">Watch →</a>
        </div>
        <button class="xp-complete-btn" style="margin-top:0.9rem;width:100%;"></button>
      </div>
    `;
    track.appendChild(card);

    // Use a CSS background rather than an <img> so failed thumbnail requests
    // can never expose alt text or metadata inside the image area.
    const thumbImage = card.querySelector('.tut-thumb-image');
    const maxres = `https://i.ytimg.com/vi/${tut.id}/maxresdefault.jpg`;
    const fallback = `https://i.ytimg.com/vi/${tut.id}/mqdefault.jpg`;
    const probe = new Image();
    probe.onload = () => {
      const usable = probe.naturalWidth >= 640;
      thumbImage.style.backgroundImage = `url("${usable ? maxres : fallback}")`;
    };
    probe.onerror = () => {
      thumbImage.style.backgroundImage = `url("${fallback}")`;
    };
    probe.src = maxres;
  });

  const getStep = () => {
    const card = track.querySelector('.latest-carousel-card');
    if (!card) return carousel.clientWidth * 0.8;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return card.getBoundingClientRect().width + gap;
  };

  const scrollByCard = direction => {
    carousel.scrollBy({ left: direction * getStep(), behavior: 'smooth' });
  };

  prevButton?.addEventListener('click', () => scrollByCard(-1));
  nextButton?.addEventListener('click', () => scrollByCard(1));

  carousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollByCard(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollByCard(1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      carousel.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (event.key === 'End') {
      event.preventDefault();
      carousel.scrollTo({ left: carousel.scrollWidth, behavior: 'smooth' });
    }
  });

  // Translate vertical mouse-wheel motion into horizontal carousel motion.
  carousel.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      carousel.scrollLeft += event.deltaY;
    }
  }, { passive: false });

  // Pointer drag support for mouse, pen, and touch-capable browsers.
  let dragging = false;
  let startX = 0;
  let startScrollLeft = 0;
  let moved = false;

  carousel.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    moved = false;
    startX = event.clientX;
    startScrollLeft = carousel.scrollLeft;
    carousel.classList.add('is-dragging');
    carousel.setPointerCapture?.(event.pointerId);
    pauseAutoAdvance();
  });

  carousel.addEventListener('pointermove', event => {
    if (!dragging) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) > 5) moved = true;
    carousel.scrollLeft = startScrollLeft - distance;
  });

  const stopDragging = event => {
    if (!dragging) return;
    dragging = false;
    carousel.classList.remove('is-dragging');
    carousel.releasePointerCapture?.(event.pointerId);
    resumeAutoAdvance();
  };
  carousel.addEventListener('pointerup', stopDragging);
  carousel.addEventListener('pointercancel', stopDragging);
  carousel.addEventListener('pointerleave', event => {
    if (dragging) stopDragging(event);
  });

  carousel.addEventListener('click', event => {
    if (moved) {
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    }
  }, true);

  let autoAdvanceTimer = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function advanceAutomatically() {
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    if (maxScroll <= 1) return;
    if (carousel.scrollLeft >= maxScroll - getStep() * 0.5) {
      carousel.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scrollByCard(1);
    }
  }

  function pauseAutoAdvance() {
    if (autoAdvanceTimer) {
      window.clearInterval(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  }

  function resumeAutoAdvance() {
    if (reducedMotion || autoAdvanceTimer || latest.length < 2) return;
    autoAdvanceTimer = window.setInterval(advanceAutomatically, 5000);
  }

  carousel.addEventListener('mouseenter', pauseAutoAdvance);
  carousel.addEventListener('mouseleave', resumeAutoAdvance);
  carousel.addEventListener('focusin', pauseAutoAdvance);
  carousel.addEventListener('focusout', resumeAutoAdvance);
  carousel.addEventListener('touchstart', pauseAutoAdvance, { passive: true });
  carousel.addEventListener('touchend', resumeAutoAdvance, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAutoAdvance();
    else resumeAutoAdvance();
  });

  resumeAutoAdvance();
}


function populateContentStats() {
  const sections = window.BRI_CONTENT_STATS?.sections || {};
  document.querySelectorAll('[data-home-section-stats]').forEach(host => {
    const stats = sections[host.dataset.homeSectionStats] || {};
    const count = Number(stats.tutorialCount || 0);
    const xp = Number(stats.xp || 0);
    host.innerHTML = `<span>${count} tutorial${count === 1 ? '' : 's'}</span><span>⚡ ${xp.toLocaleString()} XP available</span>`;
  });
}

// --- Mobile nav toggle ---
const hamburger = document.querySelector('.nav-hamburger');
const navLinks  = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// --- Mark active nav link based on current page ---
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// --- Newsletter form handler ---
function handleSubscribe(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;
  const btn   = e.target.querySelector('button');
  btn.textContent = '✓ You\'re in!';
  btn.style.background = '#1db954';
  setTimeout(() => {
    btn.textContent = 'Subscribe';
    btn.style.background = '';
    e.target.reset();
  }, 3000);
  console.log('Subscribed:', email);
}

document.addEventListener('DOMContentLoaded', () => {
  populateContentStats();
  buildLatestCarousel();
});
