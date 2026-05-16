// localStorage save/load + offline progress.

import { gs } from './state.svelte.js';
import { ACTIONS } from './data.js';
import { getPrestigeTier } from './prestige.js';
import { getMealFreshness } from './stall.js';
import { getActionDuration, checkLevelUp, checkMilestones, checkUnlocks } from './actions.js';
import { pushNotification } from './state.svelte.js';

const SAVE_KEY = 'ethanV4';

export function saveGame() {
  try {
    const timerSnap = {};
    Object.keys(gs.G.actionTimers).forEach((id) => {
      timerSnap[id] = {
        progress: gs.G.actionTimers[id].progress,
        running: gs.G.actionTimers[id].running,
      };
    });
    const save = {
      G: { ...gs.G, mx: { ...gs.G.mx }, actionTimers: timerSnap },
      savedAt: Date.now(),
      stallEarned: gs.stallTotalEarned,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) {}
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return 0;
    const save = JSON.parse(raw);
    if (!save.G) return 0;
    Object.assign(gs.G, save.G);
    if (save.G.mx) gs.G.mx = { ...save.G.mx };
    gs.G.mx.money = gs.G.mx.money || 1;
    gs.G.prestigeUpgrades = gs.G.prestigeUpgrades || {};
    gs.G.cloutPoints = gs.G.cloutPoints || 0;
    gs.G.totalCloutEarned = gs.G.totalCloutEarned || 0;
    if (!gs.G.mealQueue) {
      gs.G.mealQueue = [];
      const freshness = getMealFreshness();
      const tier = getPrestigeTier('pu_stall_unlock');
      const threshold = tier >= 0 ? [5, 2, 1][tier] : 10;
      const stallOpen = gs.G.totalCooks >= threshold;
      for (let i = 0; i < gs.G.mealStock; i++) {
        gs.G.mealQueue.push({
          id: ++gs.mealIdCounter,
          addedAt: stallOpen ? Date.now() : null,
          maxAge: freshness,
        });
      }
    }
    gs.G.stallWasUnlocked = gs.G.stallWasUnlocked || false;
    gs.G.activeCookId = gs.G.activeCookId || null;
    gs.G.mealsSpoiled = gs.G.mealsSpoiled || 0;
    gs.G.actionLevels = gs.G.actionLevels || {};

    const now = Date.now();
    const offlineExpired = gs.G.mealQueue.filter(
      (m) => m.addedAt !== null && now - m.addedAt >= m.maxAge,
    ).length;
    gs.G.mealQueue = gs.G.mealQueue.filter(
      (m) => m.addedAt === null || now - m.addedAt < m.maxAge,
    );
    gs.G.mealStock = gs.G.mealQueue.length;
    if (offlineExpired > 0) gs.G.mealsSpoiled += offlineExpired;

    gs.stallTotalEarned = save.stallEarned || 0;
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
    if (!gs.G.actionTimers[a.id]?.running) return;
    const dur = Math.max(0.5, getActionDuration(a) / 1000);
    const completions = Math.min(Math.floor(offlineSecs / dur), 2000);
    if (completions <= 0) return;
    anyProgress = true;
    for (let i = 0; i < completions; i++) {
      if (a.id.startsWith('cook_')) gs.G.totalCooks++;
      if (a.id === 'film_clip') gs.G.totalFilmed++;
      if (a.id === 'edit_video' || a.id === 'thumbnail') gs.G.totalEdits++;
      const moneyBefore = gs.G.money;
      a.reward(gs.G);
      const earned = gs.G.money - moneyBefore;
      if (earned > 0) gs.G.money = moneyBefore + earned * gs.G.mx.money;
    }
  });
  if (anyProgress) {
    checkLevelUp();
    checkMilestones();
    checkUnlocks();
    const mins = Math.floor(offlineSecs / 60);
    const timeStr = mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm' : mins + 'm';
    pushNotification('⏰ Offline ' + timeStr + ' — progress applied!', 'blue');
  }
}

export function doReset() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('ethanTutDone');
  } catch (e) {}
  location.reload();
}
