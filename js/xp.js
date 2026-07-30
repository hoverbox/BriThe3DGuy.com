// ============================================================
// xp.js — Duration-based XP and non-regressing RPG ranks
// 1 second of tutorial video = 1 XP.
// Rank thresholds are generated from Markdown during GitHub Actions.
// ============================================================

const DEFAULT_RANKS = [
  { level:1, title:'Peon', minXP:0, badge:'🪨', color:'#888899', desc:'Every master starts with a blank viewport.' }
];
const RANKS = Array.isArray(window.BRI_PROGRESSION?.ranks) && window.BRI_PROGRESSION.ranks.length
  ? window.BRI_PROGRESSION.ranks
  : DEFAULT_RANKS;
const TOTAL_AVAILABLE_XP = Number(window.BRI_PROGRESSION?.totalAvailableXP || 0);
const STORAGE_KEY = 'bri3d_progress';

function tutorialMap() {
  const map = new Map();
  (window.TUTORIAL_DATA || window.BRI_TUTORIALS || []).forEach(t => map.set(String(t.id), t));
  return map;
}

function xpForTutorial(tutorialId) {
  const tutorial = tutorialMap().get(String(tutorialId));
  return Number(tutorial?.xp || tutorial?.durationSeconds || 0);
}

function computedRankIndex(xp) {
  let index = 0;
  RANKS.forEach((rank, i) => { if (xp >= Number(rank.minXP || 0)) index = i; });
  return index;
}

function normalizeProgress(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  data.completed = Array.isArray(data.completed) ? [...new Set(data.completed.map(String))] : [];

  // Migrate the old flat 10-XP system by rebuilding earned XP from completed video durations.
  const map = tutorialMap();
  if (map.size) {
    data.xp = data.completed.reduce((sum, id) => sum + Number(map.get(id)?.xp || map.get(id)?.durationSeconds || 0), 0);
  } else {
    data.xp = Math.max(0, Number(data.xp || 0));
  }

  const naturallyEarnedRank = computedRankIndex(data.xp);
  const savedHighest = Math.max(0, Number(data.highestRankIndex || 0));
  data.highestRankIndex = Math.min(RANKS.length - 1, Math.max(savedHighest, naturallyEarnedRank));
  data.progressionGenerated = window.BRI_PROGRESSION?.generated || '';
  return data;
}

function loadProgress() {
  let parsed;
  try { parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)); }
  catch { parsed = null; }
  const data = normalizeProgress(parsed);
  saveProgress(data);
  return data;
}

function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getRankIndexForProgress(data) {
  return Math.min(RANKS.length - 1, Math.max(computedRankIndex(data.xp), Number(data.highestRankIndex || 0)));
}

function getRankForXP(xp, progressData) {
  const data = progressData || { xp, highestRankIndex: computedRankIndex(xp) };
  return RANKS[getRankIndexForProgress(data)] || RANKS[0];
}

function getNextRank(xp, progressData) {
  const data = progressData || loadProgress();
  const currentIndex = getRankIndexForProgress(data);
  return RANKS[currentIndex + 1] || null;
}

function getXPProgress(xp, progressData) {
  const data = progressData || loadProgress();
  const currentIndex = getRankIndexForProgress(data);
  const current = RANKS[currentIndex];
  const next = RANKS[currentIndex + 1];
  if (!next) return { pct:100, currentXP:xp, neededXP:xp, remainingXP:0, label:'MAX RANK' };

  // If a content expansion raised the current rank's threshold above the learner's XP,
  // the learner keeps the rank and begins progress toward the next rank from zero.
  const floor = Math.min(xp, Number(current.minXP || 0));
  const range = Math.max(1, Number(next.minXP || 0) - floor);
  const earned = Math.max(0, xp - floor);
  const pct = Math.max(0, Math.min(100, Math.round((earned / range) * 100)));
  const remainingXP = Math.max(0, Number(next.minXP || 0) - xp);
  return {
    pct,
    currentXP: earned,
    neededXP: range,
    remainingXP,
    label: `${remainingXP.toLocaleString()} XP until ${next.title}`
  };
}

function completeTutorial(tutorialId, xpAward) {
  const data = loadProgress();
  tutorialId = String(tutorialId);
  if (data.completed.includes(tutorialId)) return null;
  const gained = Math.max(0, Number(xpAward ?? xpForTutorial(tutorialId)));
  const oldIndex = getRankIndexForProgress(data);
  const oldRank = RANKS[oldIndex];
  data.completed.push(tutorialId);
  data.xp += gained;
  data.highestRankIndex = Math.max(data.highestRankIndex, computedRankIndex(data.xp));
  saveProgress(data);
  const newIndex = getRankIndexForProgress(data);
  const newRank = RANKS[newIndex];
  return { newXP:data.xp, gained, leveledUp:newIndex > oldIndex, newRank, oldRank };
}

function uncompleteTutorial(tutorialId, xpAward) {
  const data = loadProgress();
  tutorialId = String(tutorialId);
  const idx = data.completed.indexOf(tutorialId);
  if (idx === -1) return null;
  const lost = Math.max(0, Number(xpAward ?? xpForTutorial(tutorialId)));
  const oldRank = RANKS[getRankIndexForProgress(data)];
  data.completed.splice(idx, 1);
  data.xp = Math.max(0, data.xp - lost);
  // highestRankIndex is intentionally not reduced. Earned ranks are permanent.
  saveProgress(data);
  const newRank = RANKS[getRankIndexForProgress(data)];
  return { newXP:data.xp, lost, leveledDown:false, newRank, oldRank };
}

function injectNavXP() {
  document.getElementById('nav-xp-widget')?.remove();
  const nav = document.querySelector('nav.site-nav');
  if (!nav) return;
  const data = loadProgress();
  const rank = getRankForXP(data.xp, data);
  const progress = getXPProgress(data.xp, data);
  const widget = document.createElement('a');
  widget.href = 'progress.html';
  widget.id = 'nav-xp-widget';
  widget.title = `${rank.title} — ${data.xp.toLocaleString()} XP earned`;
  widget.innerHTML = `
    <span class="nav-xp-badge" style="color:${rank.color}">${rank.badge}</span>
    <span class="nav-xp-info">
      <span class="nav-xp-rank" style="color:${rank.color}">${rank.title}</span>
      <span class="nav-xp-bar-wrap"><span class="nav-xp-bar-fill" style="width:${progress.pct}%;background:${rank.color}"></span></span>
    </span>
    <span class="nav-xp-total">${data.xp.toLocaleString()} XP</span>`;
  nav.appendChild(widget);
}

function initTutorialButtons() {
  document.querySelectorAll('[data-tutorial-id]').forEach(card => {
    const id = card.dataset.tutorialId;
    const xpAward = Number(card.dataset.xp || xpForTutorial(id) || 0);
    const done = loadProgress().completed.includes(id);
    const btn = card.querySelector('.xp-complete-btn');
    if (!btn) return;
    if (done) markCardDone(card, btn, id, xpAward);
    else setupCompleteBtn(card, btn, id, xpAward);
  });
}

function setupCompleteBtn(card, btn, id, xpAward) {
  card.classList.remove('tut-card-done');
  const newBtn = btn.cloneNode(false);
  newBtn.innerHTML = xpAward > 0 ? `+${xpAward.toLocaleString()} XP &nbsp;✓ Mark Complete` : 'Add duration to enable XP';
  newBtn.classList.remove('xp-done');
  newBtn.disabled = xpAward <= 0;
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const result = completeTutorial(id, xpAward);
    if (!result) return;
    markCardDone(card, newBtn, id, xpAward);
    if (result.leveledUp) showLevelUpAnimation(result); else showXPToast(result);
    injectNavXP();
  });
}

function markCardDone(card, btn, id, xpAward) {
  card.classList.add('tut-card-done');
  const newBtn = btn.cloneNode(false);
  newBtn.innerHTML = '✓ Completed — Undo';
  newBtn.classList.add('xp-done');
  newBtn.disabled = false;
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const result = uncompleteTutorial(id, xpAward);
    if (!result) return;
    setupCompleteBtn(card, newBtn, id, xpAward);
    showUndoToast(result);
    injectNavXP();
  });
}

function showLevelUpAnimation(result) {
  document.getElementById('levelup-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'levelup-overlay';
  overlay.innerHTML = `
    <div class="levelup-particles" id="levelup-particles"></div>
    <div class="levelup-card">
      <div class="levelup-glow" style="background:${result.newRank.color}"></div>
      <div class="levelup-label">⚡ RANK UP ⚡</div>
      <div class="levelup-badge">${result.newRank.badge}</div>
      <div class="levelup-title" style="color:${result.newRank.color}">${result.newRank.title}</div>
      <div class="levelup-desc">${result.newRank.desc}</div>
      <div class="levelup-xp-pill">+${result.gained.toLocaleString()} XP earned</div>
      <button class="levelup-dismiss" onclick="document.getElementById('levelup-overlay').remove()">Keep Going →</button>
    </div>`;
  document.body.appendChild(overlay);
  const container = document.getElementById('levelup-particles');
  const colors = [result.newRank.color, '#FF5722', '#FFD600', '#00E5FF', '#ffffff', '#b98eff'];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('div');
    p.className = 'levelup-particle';
    const size = 4 + Math.random() * 9;
    p.style.cssText = `left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};width:${size}px;height:${size}px;border-radius:${Math.random()>.5?'2px':'50%'};animation-delay:${(Math.random()*.9).toFixed(2)}s;animation-duration:${(1.4+Math.random()*1.6).toFixed(2)}s;`;
    container.appendChild(p);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('levelup-show')));
  setTimeout(() => { overlay.classList.add('levelup-out'); setTimeout(() => overlay.remove(), 700); }, 7000);
}

function showXPToast(result) {
  document.getElementById('xp-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'xp-toast';
  toast.innerHTML = `<span class="toast-xp">+${result.gained.toLocaleString()} XP</span><span class="toast-msg">Tutorial complete! &nbsp;<a href="progress.html">View profile →</a></span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => { toast.classList.remove('toast-show'); setTimeout(() => toast.remove(), 400); }, 3500);
}

function showUndoToast(result) {
  document.getElementById('xp-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'xp-toast';
  toast.innerHTML = `<span class="toast-xp" style="color:#888899">-${result.lost.toLocaleString()} XP</span><span class="toast-msg">Marked as incomplete. Your highest earned rank is preserved.</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => { toast.classList.remove('toast-show'); setTimeout(() => toast.remove(), 400); }, 2800);
}

document.addEventListener('DOMContentLoaded', () => {
  injectNavXP();
  initTutorialButtons();
});
document.addEventListener('tutorialdataready', () => {
  injectNavXP();
  initTutorialButtons();
});
