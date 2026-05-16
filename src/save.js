// localStorage save/load + offline progress simulation.

import { state } from './state.js';
import { ACTIONS, COOK_IDS } from './data.js';
import { getPrestigeTier } from './prestige.js';
import { getMealFreshness } from './stall.js';
import { getActionDuration, checkLevelUp, checkMilestones, checkUnlocks } from './actions.js';
import { notify } from './ui.js';

const SAVE_KEY = 'ethanV4';

export function saveGame() {
  try {
    const timerSnap = {};
    Object.keys(state.G.actionTimers).forEach((id) => {
      timerSnap[id] = {
        progress: state.G.actionTimers[id].progress,
        running: state.G.actionTimers[id].running,
      };
    });
    const save = {
      G: { ...state.G, mx: { ...state.G.mx }, actionTimers: timerSnap },
      savedAt: Date.now(),
      stallEarned: state.stallTotalEarned,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    const info = document.getElementById('save-info');
    if (info) info.textContent = '💾 saved ' + new Date().toLocaleTimeString();
  } catch (e) {}
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return 0;
    const save = JSON.parse(raw);
    if (!save.G) return 0;
    Object.assign(state.G, save.G);
    if (save.G.mx) state.G.mx = { ...save.G.mx };
    state.G.mx.money = state.G.mx.money || 1;
    state.G.prestigeUpgrades = state.G.prestigeUpgrades || {};
    state.G.cloutPoints = state.G.cloutPoints || 0;
    state.G.totalCloutEarned = state.G.totalCloutEarned || 0;
    if (!state.G.mealQueue) {
      state.G.mealQueue = [];
      const freshness = getMealFreshness();
      const tier = getPrestigeTier('pu_stall_unlock');
      const threshold = tier >= 0 ? [5, 2, 1][tier] : 10;
      const stallOpen = state.G.totalCooks >= threshold;
      for (let i = 0; i < state.G.mealStock; i++) {
        state.G.mealQueue.push({
          id: ++state.mealIdCounter,
          addedAt: stallOpen ? Date.now() : null,
          maxAge: freshness,
        });
      }
    }
    state.G.stallWasUnlocked = state.G.stallWasUnlocked || false;
    state.G.activeCookId = state.G.activeCookId || null;
    state.G.mealsSpoiled = state.G.mealsSpoiled || 0;

    const now = Date.now();
    const offlineExpired = state.G.mealQueue.filter(
      (m) => m.addedAt !== null && now - m.addedAt >= m.maxAge,
    ).length;
    state.G.mealQueue = state.G.mealQueue.filter(
      (m) => m.addedAt === null || now - m.addedAt < m.maxAge,
    );
    state.G.mealStock = state.G.mealQueue.length;
    if (offlineExpired > 0) state.G.mealsSpoiled += offlineExpired;

    state.stallTotalEarned = save.stallEarned || 0;
    return save.savedAt || Date.now();
  } catch (e) {
    return 0;
  }
}

export function applyOfflineProgress(savedAt) {
  const offlineSecs = Math.min((Date.now() - savedAt) / 1000, 3600 * 8);
  if (offlineSecs < 15) return;
  let anyProgress = false;
  ACTIONS.forEach((a) => {
    if (!state.G.actionTimers[a.id]?.running) return;
    const dur = Math.max(0.5, getActionDuration(a) / 1000);
    const completions = Math.min(Math.floor(offlineSecs / dur), 2000);
    if (completions <= 0) return;
    anyProgress = true;
    for (let i = 0; i < completions; i++) {
      if (a.id.startsWith('cook_')) state.G.totalCooks++;
      if (a.id === 'film_clip') state.G.totalFilmed++;
      if (a.id === 'edit_video' || a.id === 'thumbnail') state.G.totalEdits++;
      const moneyBefore = state.G.money;
      a.reward(state.G);
      const earned = state.G.money - moneyBefore;
      if (earned > 0) state.G.money = moneyBefore + earned * state.G.mx.money;
    }
  });
  if (anyProgress) {
    checkLevelUp();
    checkMilestones();
    checkUnlocks();
    const mins = Math.floor(offlineSecs / 60);
    const timeStr = mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm' : mins + 'm';
    notify('⏰ Offline ' + timeStr + ' — progress applied!', 'blue');
  }
  void COOK_IDS;
}

export function doReset() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('ethanTutDone');
  } catch (e) {}
  location.reload();
}
