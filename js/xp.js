// ============================================================
//  xp.js — XP & Leveling System
//  All data stored in localStorage. No login required.
// ============================================================

// ------------------------------------------------------------
//  RANK TABLE
//  Add or edit ranks here. Each rank needs:
//    title    — displayed name
//    minXP    — XP required to reach this rank
//    badge    — emoji shown on the progress page
//    color    — accent color for the rank badge
//    desc     — flavour text shown on progress page
// ------------------------------------------------------------
const RANKS = [
  { title: 'Lost in the Viewport',  minXP: 0,    badge: '🌀', color: '#888899', desc: 'Every legend starts somewhere. Welcome.' },
  { title: 'Rookie Modeler',        minXP: 50,   badge: '🧊', color: '#00E5FF', desc: 'You\'ve touched a mesh. The journey begins.' },
  { title: 'Node Wrangler',         minXP: 150,  badge: '🌿', color: '#4CAF50', desc: 'The scene tree no longer scares you.' },
  { title: 'UV Survivor',           minXP: 300,  badge: '📐', color: '#FFD600', desc: 'You unwrapped something and kept your sanity.' },
  { title: 'GDScript Apprentice',   minXP: 500,  badge: '📝', color: '#FF9800', desc: 'Your code actually runs. Sometimes.' },
  { title: 'Shader Sorcerer',       minXP: 750,  badge: '🔷', color: '#9C27B0', desc: 'You\'re bending pixels to your will.' },
  { title: 'Rig Whisperer',         minXP: 1050, badge: '🦴', color: '#F44336', desc: 'Characters move because you made them.' },
  { title: 'Pipeline Master',       minXP: 1400, badge: '🚀', color: '#FF5722', desc: 'Blender to Godot without breaking a sweat.' },
  { title: 'Indie Dev Unleashed',   minXP: 1800, badge: '🎮', color: '#00BCD4', desc: 'You\'re building real games. Respect.' },
  { title: 'The 3D Enlightened',    minXP: 2500, badge: '⚡', color: '#FFD600', desc: 'You\'ve seen the polygon. You ARE the polygon.' },
];

// ------------------------------------------------------------
//  XP VALUES PER DIFFICULTY
//  Change these numbers to adjust how fast players level up
// ------------------------------------------------------------
const XP_VALUES = {
  beginner:     50,
  intermediate: 100,
  all:          75,   // "All Levels" tutorials
};

// ------------------------------------------------------------
//  STORAGE HELPERS
// ------------------------------------------------------------
const STORAGE_KEY = 'bri3d_progress';

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { xp: 0, completed: [] };
  } catch {
    return { xp: 0, completed: [] };
  }
}

function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ------------------------------------------------------------
//  RANK HELPERS
// ------------------------------------------------------------
function getRankForXP(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r;
  }
  return rank;
}

function getNextRank(xp) {
  for (const r of RANKS) {
    if (xp < r.minXP) return r;
  }
  return null; // maxed out
}

function getXPProgress(xp) {
  const current  = getRankForXP(xp);
  const next     = getNextRank(xp);
  if (!next) return { pct: 100, currentXP: xp, neededXP: xp, label: 'MAX RANK' };
  const range    = next.minXP - current.minXP;
  const earned   = xp - current.minXP;
  const pct      = Math.round((earned / range) * 100);
  return { pct, currentXP: earned, neededXP: range, label: `${earned} / ${range} XP to next rank` };
}

// ------------------------------------------------------------
//  COMPLETE A TUTORIAL
//  Call: completeTutorial('tutorial-id', 'beginner')
//  Returns { newXP, gained, leveledUp, newRank } or null if already done
// ------------------------------------------------------------
function completeTutorial(tutorialId, difficulty) {
  const data     = loadProgress();
  if (data.completed.includes(tutorialId)) return null; // already done

  const gained   = XP_VALUES[difficulty] || XP_VALUES.beginner;
  const oldRank  = getRankForXP(data.xp);
  data.xp       += gained;
  data.completed.push(tutorialId);
  saveProgress(data);

  const newRank  = getRankForXP(data.xp);
  const leveledUp = newRank.title !== oldRank.title;
  return { newXP: data.xp, gained, leveledUp, newRank, oldRank };
}

// ------------------------------------------------------------
//  NAV XP WIDGET
//  Injects a compact XP bar into the nav on every page
// ------------------------------------------------------------
function injectNavXP() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  const data     = loadProgress();
  const rank     = getRankForXP(data.xp);
  const progress = getXPProgress(data.xp);

  const widget = document.createElement('a');
  widget.href  = 'progress.html';
  widget.id    = 'nav-xp-widget';
  widget.title = `${rank.title} — ${data.xp} XP total`;
  widget.innerHTML = `
    <span class="nav-xp-badge" style="color:${rank.color}">${rank.badge}</span>
    <span class="nav-xp-info">
      <span class="nav-xp-rank">${rank.title}</span>
      <span class="nav-xp-bar-wrap">
        <span class="nav-xp-bar-fill" style="width:${progress.pct}%; background:${rank.color}"></span>
      </span>
    </span>
    <span class="nav-xp-total">${data.xp} XP</span>
  `;
  nav.appendChild(widget);
}

// ------------------------------------------------------------
//  TUTORIAL CARD BUTTONS
//  Scans the page for [data-tutorial-id] elements and wires them up
// ------------------------------------------------------------
function initTutorialButtons() {
  document.querySelectorAll('[data-tutorial-id]').forEach(card => {
    const id         = card.dataset.tutorialId;
    const difficulty = card.dataset.difficulty || 'beginner';
    const xpAward    = XP_VALUES[difficulty] || 50;
    const data       = loadProgress();
    const done       = data.completed.includes(id);

    // Find or create the complete button
    let btn = card.querySelector('.xp-complete-btn');
    if (!btn) return;

    if (done) {
      markCardDone(card, btn);
      return;
    }

    btn.innerHTML  = `+${xpAward} XP &nbsp;✓ Mark Complete`;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const result = completeTutorial(id, difficulty);
      if (!result) return;

      markCardDone(card, btn);
      showXPToast(result);
      injectNavXP(); // refresh nav bar
    });
  });
}

function markCardDone(card, btn) {
  card.classList.add('tut-card-done');
  btn.innerHTML  = '✓ Completed';
  btn.classList.add('xp-done');
  btn.disabled   = true;
}

// ------------------------------------------------------------
//  XP TOAST NOTIFICATION
// ------------------------------------------------------------
function showXPToast(result) {
  // Remove existing toast
  document.getElementById('xp-toast')?.remove();

  const toast = document.createElement('div');
  toast.id    = 'xp-toast';

  if (result.leveledUp) {
    toast.innerHTML = `
      <div class="toast-rank-up">
        <span class="toast-badge">${result.newRank.badge}</span>
        <div>
          <div class="toast-title">RANK UP!</div>
          <div class="toast-rank">${result.newRank.title}</div>
          <div class="toast-sub">${result.newRank.desc}</div>
        </div>
      </div>
    `;
    toast.classList.add('toast-levelup');
  } else {
    toast.innerHTML = `
      <span class="toast-xp">+${result.gained} XP</span>
      <span class="toast-msg">Tutorial complete! &nbsp;<a href="progress.html">View progress →</a></span>
    `;
  }

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 400);
  }, result.leveledUp ? 5000 : 3500);
}

// ------------------------------------------------------------
//  AUTO-INIT on DOMContentLoaded
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  injectNavXP();
  initTutorialButtons();
});
