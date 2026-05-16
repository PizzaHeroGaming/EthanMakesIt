// Entry point: load CSS, wire global handlers, restore save, start tick intervals.

import './styles/main.css';

import { state } from './state.js';
import { ACTIONS, COOK_IDS, TICKERS } from './data.js';
import { toggleMute } from './audio.js';
import { loadGame, saveGame, applyOfflineProgress, doReset } from './save.js';
import {
  isActionUnlocked, reapplyUpgrades, startAction, clickAction, buyManager, buyUpgrade,
  setActiveCook, updateTitle, checkUnlocks, checkMilestones,
} from './actions.js';
import {
  renderAll, updateStats, animSteam, animBurner, animRec,
} from './render.js';
import {
  scheduleNextSpawn, tickStall, tickMealSpoilage, serveCustomer,
} from './stall.js';
import {
  notify, switchTab, openMenu, closeMenu, handleMenuOverlayClick,
  menuSave, showMenuReset, hideMenuReset, showResetConfirm, hideResetConfirm,
  tutNext, closeTutorial, buildTutDots,
} from './ui.js';
import {
  showPrestigeConfirm, cancelPrestigeModal, confirmPrestige,
  buyPrestigeUpgrade, buyPrestigeUpgradeModal, getHypeDecayRate,
} from './prestige.js';

// ── Expose handlers to window so inline onclick attributes resolve ──
Object.assign(window, {
  clickAction, setActiveCook, buyUpgrade, buyManager,
  serveCustomer,
  switchTab, openMenu, closeMenu, handleMenuOverlayClick,
  menuSave, showMenuReset, hideMenuReset, showResetConfirm, hideResetConfirm,
  doReset, toggleMute, tutNext, closeTutorial,
  showPrestigeConfirm, cancelPrestigeModal, confirmPrestige,
  buyPrestigeUpgrade, buyPrestigeUpgradeModal,
});

// ── Migration check (V3 -> V4) ──
let showMigrationNotice = false;
try {
  const hasOldSave = localStorage.getItem('ethanV3') !== null;
  const hasNewSave = localStorage.getItem('ethanV4') !== null;
  if (hasOldSave && !hasNewSave) {
    showMigrationNotice = true;
    localStorage.removeItem('ethanV3');
  }
} catch (e) {}

// ── Load save & restore ──
const savedAt = loadGame();
const loaded = savedAt !== 0;

if (loaded) {
  reapplyUpgrades();
  ACTIONS.forEach((a) => {
    if (isActionUnlocked(a)) state.prevUnlockedActions.add(a.id);
  });
  applyOfflineProgress(savedAt);
  Object.keys(state.G.actionTimers).forEach((id) => {
    if (state.G.actionTimers[id].running && !COOK_IDS.includes(id)) startAction(id);
  });
  if (state.G.activeCookId && state.G.actionTimers[state.G.activeCookId]?.running) {
    startAction(state.G.activeCookId);
  }
  state.incomeBaseline = state.G.money;
  state.incomeBaselineTime = Date.now();
}

buildTutDots();

try {
  if (localStorage.getItem('ethanTutDone') || loaded) {
    document.getElementById('tutorial-overlay').style.display = 'none';
    if (loaded) notify('Welcome back!', 'blue');
  }
} catch (e) {
  document.getElementById('tutorial-overlay').style.display = 'none';
}

renderAll();
updateStats();
updateTitle();
checkUnlocks();

if (showMigrationNotice) {
  const mig = document.createElement('div');
  mig.id = 'migration-overlay';
  mig.style.cssText =
    'position:fixed;inset:0;background:#000d;z-index:600;display:flex;align-items:center;justify-content:center;';
  mig.innerHTML = `<div style="background:var(--bg2);border:1px solid var(--gold);border-radius:12px;padding:28px 32px;max-width:420px;width:90%;font-family:'DM Mono',monospace;text-align:center;">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:26px;color:var(--gold);letter-spacing:2px;margin-bottom:8px;">SAVE UPDATED</div>
    <p style="font-size:11px;color:var(--text);line-height:1.7;margin-bottom:6px;">A major update changed how the game saves progress. Your previous save isn't compatible with the new version.</p>
    <p style="font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:18px;">This only happens once — from here on your progress saves normally.</p>
    <button onclick="document.getElementById('migration-overlay').remove()" style="padding:10px 28px;font-family:'DM Mono',monospace;font-size:11px;border:1px solid var(--gold);background:transparent;color:var(--gold);border-radius:6px;cursor:pointer;letter-spacing:1px;">START FRESH →</button>
  </div>`;
  document.body.appendChild(mig);
}

// ── Intervals ──

// Income EMA tracker — runs every 2s, smooths spikes across actions.
setInterval(() => {
  const now = Date.now();
  const elapsed = (now - state.incomeBaselineTime) / 1000;
  if (elapsed > 0) {
    const earned = Math.max(0, state.G.money - state.incomeBaseline);
    const rate = earned / elapsed;
    state.smoothedIncome = state.smoothedIncome * 0.75 + rate * 0.25;
    state.incomeBaseline = state.G.money;
    state.incomeBaselineTime = now;
  }
}, 2000);

// Scene SVG bob animation.
setInterval(() => {
  state.ethanBob += state.ethanBobDir * 0.5;
  if (Math.abs(state.ethanBob) > 2) state.ethanBobDir *= -1;
  const e = document.getElementById('sc-ethan');
  if (e) e.setAttribute('transform', 'translate(0,' + state.ethanBob.toFixed(1) + ')');
}, 80);

// Scene SVG effect ticks tied to running actions.
setInterval(() => {
  const t = state.G.actionTimers;
  if (
    t['cook_eggs']?.running ||
    t['cook_pasta']?.running ||
    t['cook_stirfry']?.running ||
    t['cook_sushi']?.running ||
    t['cook_wellington']?.running ||
    t['cook_ramen']?.running
  ) {
    if (Math.random() < 0.1) {
      animSteam();
      animBurner();
    }
  }
  if (t['film_clip']?.running) {
    if (Math.random() < 0.05) animRec();
  }
}, 500);

// Stall customer-timer + spoilage.
state.stallTickTimer = setInterval(tickStall, 120);
setInterval(tickMealSpoilage, 1000);
scheduleNextSpawn();

// Main game tick: hype decay, passive sub gain, stats refresh, milestone/unlock scan.
setInterval(() => {
  state.G.hype = Math.max(0, state.G.hype - getHypeDecayRate());
  if (state.G.hype > 25 && state.G.totalEdits > 0) {
    state.G.subs += (state.G.hype / 100) * state.G.mx.sub * 0.1;
    state.G.views += state.G.subs * 0.00005 * state.G.mx.view;
  }
  state.G.tick++;
  updateStats();
  checkMilestones();
  checkUnlocks();
}, 500);

// Sidebar ticker text rotation.
setInterval(() => {
  state.tickIdx = (state.tickIdx + 1) % TICKERS.length;
  const el = document.getElementById('ticker');
  if (el) el.textContent = TICKERS[state.tickIdx];
}, 9000);

// Autosave.
setInterval(saveGame, 15000);
