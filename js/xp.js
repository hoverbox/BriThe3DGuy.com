// ============================================================
//  xp.js — XP & Leveling System
//  All data stored in localStorage. No login required.
// ============================================================

const RANKS = [
  { title: 'Peon',         minXP: 0,   badge: '🪨', color: '#888899', desc: 'Every master was once a peon staring at a blank viewport. Your journey starts now.' },
  { title: 'Squire',       minXP: 20,  badge: '🛡️', color: '#78909C', desc: 'You\'ve picked up your tools and learned the basics. The 3D realm is starting to make sense.' },
  { title: 'Fighter',      minXP: 50,  badge: '⚔️', color: '#42A5F5', desc: 'You know your way around a mesh. Modifiers fear you. Slightly.' },
  { title: 'Ranger',       minXP: 80,  badge: '🏹', color: '#66BB6A', desc: 'Quick, precise, and dangerous with a loop cut. You cover ground fast.' },
  { title: 'Mage',         minXP: 110, badge: '🔮', color: '#AB47BC', desc: 'Materials bend to your will. You speak the language of shaders and nodes.' },
  { title: 'Rogue',        minXP: 140, badge: '🗡️', color: '#FFA726', desc: 'Sneaky efficient. You know the shortcuts others don\'t. Your topology is clean.' },
  { title: 'Dragoon',      minXP: 170, badge: '🐉', color: '#EF5350', desc: 'You leap between Blender and Godot without flinching. The pipeline is your weapon.' },
  { title: 'Paladin',      minXP: 200, badge: '✨', color: '#FFD600', desc: 'Disciplined, powerful, and righteous. Your scenes are clean. Your exports never break.' },
  { title: 'Archmage',     minXP: 220, badge: '🌌', color: '#00E5FF', desc: 'You have achieved mastery over the dark arts of 3D. Vertices tremble at your name.' },
  { title: 'Legendary',    minXP: 240, badge: '👑', color: '#FF5722', desc: 'All 24 tutorials complete. You are the lore. You ARE the polygon. Maximum respect.' },
];

const XP_VALUES = { beginner: 10, intermediate: 10, all: 10 };

const STORAGE_KEY = 'bri3d_progress';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { xp: 0, completed: [] }; }
  catch { return { xp: 0, completed: [] }; }
}

function saveProgress(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function getRankForXP(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) { if (xp >= r.minXP) rank = r; }
  return rank;
}

function getNextRank(xp) {
  for (const r of RANKS) { if (xp < r.minXP) return r; }
  return null;
}

function getXPProgress(xp) {
  const current = getRankForXP(xp);
  const next    = getNextRank(xp);
  if (!next) return { pct: 100, currentXP: xp, neededXP: xp, label: 'MAX RANK' };
  const range   = next.minXP - current.minXP;
  const earned  = xp - current.minXP;
  const pct     = Math.round((earned / range) * 100);
  return { pct, currentXP: earned, neededXP: range, label: `${earned} / ${range} XP to next rank` };
}

function completeTutorial(tutorialId, difficulty) {
  const data    = loadProgress();
  if (data.completed.includes(tutorialId)) return null;
  const gained  = XP_VALUES[difficulty] || XP_VALUES.beginner;
  const oldRank = getRankForXP(data.xp);
  data.xp      += gained;
  data.completed.push(tutorialId);
  saveProgress(data);
  const newRank   = getRankForXP(data.xp);
  const leveledUp = newRank.title !== oldRank.title;
  return { newXP: data.xp, gained, leveledUp, newRank, oldRank };
}

function uncompleteTutorial(tutorialId, difficulty) {
  const data  = loadProgress();
  const idx   = data.completed.indexOf(tutorialId);
  if (idx === -1) return null;
  const lost    = XP_VALUES[difficulty] || XP_VALUES.beginner;
  const oldRank = getRankForXP(data.xp);
  data.xp       = Math.max(0, data.xp - lost);
  data.completed.splice(idx, 1);
  saveProgress(data);
  const newRank    = getRankForXP(data.xp);
  const leveledDown = newRank.title !== oldRank.title;
  return { newXP: data.xp, lost, leveledDown, newRank, oldRank };
}

// --- NAV XP Widget (slim: badge + title + bar + XP) ---
function injectNavXP() {
  document.getElementById('nav-xp-widget')?.remove();
  const nav = document.querySelector('nav');
  if (!nav) return;
  const data     = loadProgress();
  const rank     = getRankForXP(data.xp);
  const progress = getXPProgress(data.xp);
  const widget   = document.createElement('a');
  widget.href    = 'progress.html';
  widget.id      = 'nav-xp-widget';
  widget.title   = `${rank.title} — ${data.xp} XP total`;
  widget.innerHTML = `
    <span class="nav-xp-badge" style="color:${rank.color}">${rank.badge}</span>
    <span class="nav-xp-info">
      <span class="nav-xp-rank" style="color:${rank.color}">${rank.title}</span>
      <span class="nav-xp-bar-wrap">
        <span class="nav-xp-bar-fill" style="width:${progress.pct}%; background:${rank.color}"></span>
      </span>
    </span>
    <span class="nav-xp-total">${data.xp} XP</span>
  `;
  nav.appendChild(widget);
}

// --- Tutorial Card Buttons with toggle ---
function initTutorialButtons() {
  document.querySelectorAll('[data-tutorial-id]').forEach(card => {
    const id         = card.dataset.tutorialId;
    const difficulty = card.dataset.difficulty || 'beginner';
    const xpAward    = XP_VALUES[difficulty] || 50;
    const data       = loadProgress();
    const done       = data.completed.includes(id);
    let btn          = card.querySelector('.xp-complete-btn');
    if (!btn) return;
    if (done) { markCardDone(card, btn, id, difficulty); }
    else      { setupCompleteBtn(card, btn, id, difficulty, xpAward); }
  });
}

function setupCompleteBtn(card, btn, id, difficulty, xpAward) {
  card.classList.remove('tut-card-done');
  const newBtn = btn.cloneNode(false);
  newBtn.innerHTML = `+${xpAward} XP &nbsp;✓ Mark Complete`;
  newBtn.classList.remove('xp-done');
  newBtn.disabled  = false;
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    const result = completeTutorial(id, difficulty);
    if (!result) return;
    markCardDone(card, newBtn, id, difficulty);
    if (result.leveledUp) { showLevelUpAnimation(result); } else { showXPToast(result); }
    injectNavXP();
  });
}

function markCardDone(card, btn, id, difficulty) {
  card.classList.add('tut-card-done');
  const newBtn = btn.cloneNode(false);
  newBtn.innerHTML = '✓ Completed — Undo';
  newBtn.classList.add('xp-done');
  newBtn.disabled  = false;
  btn.parentNode.replaceChild(newBtn, btn);
  const xpAward = XP_VALUES[difficulty] || 50;
  newBtn.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    const result = uncompleteTutorial(id, difficulty);
    if (!result) return;
    setupCompleteBtn(card, newBtn, id, difficulty, xpAward);
    showUndoToast(result);
    injectNavXP();
  });
}

// --- Level-Up Full Screen Animation ---
function showLevelUpAnimation(result) {
  document.getElementById('levelup-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id    = 'levelup-overlay';
  overlay.innerHTML = `
    <div class="levelup-particles" id="levelup-particles"></div>
    <div class="levelup-card">
      <div class="levelup-glow" style="background:${result.newRank.color}"></div>
      <div class="levelup-label">⚡ RANK UP ⚡</div>
      <div class="levelup-badge">${result.newRank.badge}</div>
      <div class="levelup-title" style="color:${result.newRank.color}">${result.newRank.title}</div>
      <div class="levelup-desc">${result.newRank.desc}</div>
      <div class="levelup-xp-pill">+${result.gained} XP earned</div>
      <button class="levelup-dismiss" onclick="document.getElementById('levelup-overlay').remove()">
        Keep Going →
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Spawn particles
  const container = document.getElementById('levelup-particles');
  const colors = [result.newRank.color, '#FF5722', '#FFD600', '#00E5FF', '#ffffff', '#b98eff'];
  for (let i = 0; i < 70; i++) {
    const p     = document.createElement('div');
    p.className = 'levelup-particle';
    const isSquare = Math.random() > 0.5;
    const size  = 4 + Math.random() * 9;
    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.cssText = `
      left:${Math.random()*100}%;
      background:${color};
      width:${size}px; height:${size}px;
      border-radius:${isSquare ? '2px' : '50%'};
      animation-delay:${(Math.random()*0.9).toFixed(2)}s;
      animation-duration:${(1.4+Math.random()*1.6).toFixed(2)}s;
    `;
    container.appendChild(p);
  }

  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('levelup-show')));

  // Dismiss after 7s
  setTimeout(() => {
    overlay.classList.add('levelup-out');
    setTimeout(() => overlay.remove(), 700);
  }, 7000);
}

// --- XP Toast (small, non-level-up) ---
function showXPToast(result) {
  document.getElementById('xp-toast')?.remove();
  const toast = document.createElement('div');
  toast.id    = 'xp-toast';
  toast.innerHTML = `
    <span class="toast-xp">+${result.gained} XP</span>
    <span class="toast-msg">Tutorial complete! &nbsp;<a href="progress.html">View progress →</a></span>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => { toast.classList.remove('toast-show'); setTimeout(() => toast.remove(), 400); }, 3500);
}

// --- Undo Toast ---
function showUndoToast(result) {
  document.getElementById('xp-toast')?.remove();
  const toast = document.createElement('div');
  toast.id    = 'xp-toast';
  toast.innerHTML = `
    <span class="toast-xp" style="color:#888899">-${result.lost} XP</span>
    <span class="toast-msg">Marked as incomplete.</span>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => { toast.classList.remove('toast-show'); setTimeout(() => toast.remove(), 400); }, 2500);
}

document.addEventListener('DOMContentLoaded', () => {
  injectNavXP();
  initTutorialButtons();
});
