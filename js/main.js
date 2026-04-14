// ============================================================
//  main.js — shared across all pages
// ============================================================

// ============================================================
//  TUTORIAL DATA — Edit this to control what appears on the
//  homepage "Latest Tutorials" carousel AND the hero background.
//
//  ADD A NEW TUTORIAL: paste a new object at the TOP of the array.
//  The homepage carousel and hero background both update automatically.
//
//  Fields:
//    id         — YouTube video ID (the part after ?v=)
//    tutId      — unique slug used for XP tracking (must match
//                 data-tutorial-id on the tutorials.html card)
//    title      — card headline
//    tags       — array of tag strings shown as pills
//    duration   — display string e.g. "6 min"
//    difficulty — "beginner" | "intermediate" | "all"
//    excerpt    — one-sentence description shown under the title
// ============================================================
const TUTORIALS = [
  {
    id: 'inckC5b7zRk',
    tutId: 'grease-pencil',
    title: 'Blender Grease Pencil — Learn in 6 Minutes!',
    tags: ['Blender', 'Beginner'],
    duration: '6 min',
    difficulty: 'beginner',
    excerpt: 'Everything you need to get started with Grease Pencil.',
  },
  {
    id: 'uCaAJanwrds',
    tutId: 'uv-unwrap',
    title: 'Learn to UV Unwrap in Blender',
    tags: ['Blender', 'Materials'],
    duration: '4 min',
    difficulty: 'beginner',
    excerpt: 'UV unwrapping and adding textures to your 3D models.',
  },
  {
    id: 'jGw283Fc4aE',
    tutId: 'principled-bsdf',
    title: 'Guide to the Principled BSDF',
    tags: ['Blender', 'Materials'],
    duration: '6 min',
    difficulty: 'beginner',
    excerpt: 'Make everything from rubber to glass with the Principled BSDF.',
  },
  {
    id: 'dExoV7ZD5R8',
    tutId: 'modifiers-intro',
    title: 'Blender Modifiers — The Complete Beginner Guide',
    tags: ['Blender', 'Beginner'],
    duration: '9 min',
    difficulty: 'beginner',
    excerpt: 'Non-destructive workflows: Subdivision, Mirror, Array and more.',
  },
  {
    id: 'zLAChQHot5Y',
    tutId: 'godot-first-scene',
    title: 'Your First Godot 4 Scene',
    tags: ['Godot', 'Beginner'],
    duration: '8 min',
    difficulty: 'beginner',
    excerpt: 'Nodes, scenes, and scripts — the three pillars of Godot.',
  },
  {
    id: '9Jv6sCBDZR4',
    tutId: 'godot-physics',
    title: 'Godot 4 Physics & Collision Explained',
    tags: ['Godot', 'Intermediate'],
    duration: '11 min',
    difficulty: 'intermediate',
    excerpt: 'RigidBody, CharacterBody, and Area2D — when to use each.',
  },
  {
    id: 'JFzWbjJ8IIY',
    tutId: 'blender-lighting',
    title: 'Blender Lighting for Game Art',
    tags: ['Blender', 'Lighting'],
    duration: '7 min',
    difficulty: 'beginner',
    excerpt: 'Three-point lighting and HDRI setups that look great in Godot.',
  },
  {
    id: 'dduAKv9G8DE',
    tutId: 'blender-shortcuts',
    title: 'The Blender Shortcuts You Actually Need',
    tags: ['Blender', 'Beginner'],
    duration: '5 min',
    difficulty: 'beginner',
    excerpt: 'Cut your modelling time in half with these essential hotkeys.',
  },
];

// ============================================================
//  HERO_VIDEO_IDS — automatically derived from TUTORIALS so the
//  scrolling hero background always stays in sync with your content.
//  Optionally add extra IDs below for more background variety.
// ============================================================
const HERO_VIDEO_IDS = [
  ...TUTORIALS.map(t => t.id),
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

  TUTORIALS.forEach(tut => {
    const tagsHTML = tut.tags
      .map(t => `<span class="tut-tag">${t}</span>`)
      .join('');

    const card = document.createElement('div');
    card.className = 'tut-card latest-carousel-card';
    card.dataset.tutorialId = tut.tutId;
    card.dataset.difficulty  = tut.difficulty;
    card.innerHTML = `
      <div class="tut-thumb-link" onclick="window.location.href='tutorials.html'">
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
          <a href="tutorials.html" class="watch-link">Watch →</a>
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
