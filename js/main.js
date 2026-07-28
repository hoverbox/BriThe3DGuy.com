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
  if (!track) return;

  [...TUTORIALS].sort((a,b)=>(b.publishedOrder||0)-(a.publishedOrder||0)).slice(0,8).forEach(raw => {
    const tut = { id: raw.youtubeId || raw.id, tutId: raw.id || raw.tutId, title: raw.title, tags: raw.tags || [], duration: raw.duration || raw.difficulty || "Tutorial", difficulty: (raw.difficulty || "beginner").toLowerCase(), excerpt: raw.description || raw.excerpt || "", section: raw.section };
    const tagsHTML = tut.tags
      .map(t => `<span class="tut-tag">${t}</span>`)
      .join('');

    const card = document.createElement('div');
    card.className = 'tut-card latest-carousel-card';
    card.dataset.tutorialId = tut.tutId;
    card.dataset.difficulty  = tut.difficulty;
    card.innerHTML = `
      <div class="tut-thumb-link" onclick="window.location.href='${tut.section === 'Game Development' ? 'game-development.html' : tut.section === 'Animation' ? 'animation.html' : '3d-graphics.html'}'">
        <div class="tut-thumb">
          <img src="https://i.ytimg.com/vi/${tut.id}/maxresdefault.jpg"
               onerror="this.src='https://i.ytimg.com/vi/${tut.id}/mqdefault.jpg'"
               alt="${tut.title}" loading="lazy">
          <div class="play-btn">▶</div>
          <span class="tut-duration">${tut.duration}</span>
        </div>
      </div>
      <div class="tut-meta">
        <div class="tut-tags">${tagsHTML}</div>
        <div class="tut-title">${tut.title}</div>
        <p class="tut-excerpt">${tut.excerpt}</p>
        <div class="tut-footer">
          <span>🕐 ${tut.duration}</span>
          <a href="${tut.section === 'Game Development' ? 'game-development.html' : tut.section === 'Animation' ? 'animation.html' : '3d-graphics.html'}" class="watch-link">Watch →</a>
        </div>
        <button class="xp-complete-btn" style="margin-top:0.9rem;width:100%;"></button>
      </div>
    `;
    track.appendChild(card);
  });

  // Duplicate cards for seamless infinite loop
  Array.from(track.children).forEach(c => {
    const clone = c.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  // Pause scroll on hover / touch
  const carousel = document.getElementById('latest-tutorials-carousel');
  if (carousel) {
    const pause  = () => track.style.animationPlayState = 'paused';
    const resume = () => track.style.animationPlayState = 'running';
    carousel.addEventListener('mouseenter', pause);
    carousel.addEventListener('mouseleave', resume);
    carousel.addEventListener('touchstart', pause,  { passive: true });
    carousel.addEventListener('touchend',   resume, { passive: true });
  }
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
  buildLatestCarousel();
});
