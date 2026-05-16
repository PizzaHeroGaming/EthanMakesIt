// Action timer engine, unlock/milestone checks, upgrade purchase, manager hiring.

import { gs, activeTimers, pushNotification, pushFloat, pulseStat } from './state.svelte.js';
import { ACTIONS, UPGRADES_DEF, MILESTONES_DEF, TITLES, COOK_IDS, MAX_MEAL_STOCK, applyMilestoneRewards } from './data.js';
import { SFX } from './audio.js';
import { applyPrestigeMultipliers, getPrestigeTier, getViralThreshold, calcCloutEarned } from './prestige.js';
import { stallUnlocked, getMealFreshness } from './stall.js';
import { fmt, fmtMoney } from './helpers.js';

export function isActionUnlocked(a) {
  const G = gs.G;
  const u = a.unlockAt;
  if (u.level && G.level < u.level) return false;
  if (u.subs && G.subs < u.subs) return false;
  if (u.money && G.money < u.money) return false;
  if (u.totalCooks && G.totalCooks < u.totalCooks) return false;
  if (u.totalFilmed && G.totalFilmed < u.totalFilmed) return false;
  if (u.totalEdits && G.totalEdits < u.totalEdits) return false;
  return true;
}

export function isUpgradeUnlocked(u) {
  const G = gs.G;
  const r = u.unlockAt;
  if (r.level && G.level < r.level) return false;
  if (r.subs && G.subs < r.subs) return false;
  if (r.money && G.money < r.money) return false;
  if (r.totalEdits && G.totalEdits < r.totalEdits) return false;
  if (r.totalFilmed && G.totalFilmed < r.totalFilmed) return false;
  return true;
}

export function getActionDuration(a) {
  return Math.max(500, a.baseTime / gs.G.mx.speed);
}

export function startAction(id) {
  if (!gs.G.actionTimers[id]) gs.G.actionTimers[id] = { progress: 0, running: false };
  const st = gs.G.actionTimers[id];
  if (st.running) return;
  st.running = true;
  runActionLoop(id);
}

export function runActionLoop(id) {
  const action = ACTIONS.find((a) => a.id === id);
  if (!action || !isActionUnlocked(action)) return;
  const st = gs.G.actionTimers[id];
  if (!st || !st.running) return;

  const duration = getActionDuration(action);
  const startTime = Date.now() - st.progress * duration;

  function tick() {
    if (!gs.G.actionTimers[id] || !gs.G.actionTimers[id].running) {
      delete activeTimers[id];
      return;
    }
    const elapsed = Date.now() - startTime;
    const pct = Math.min(1, elapsed / duration);
    gs.G.actionTimers[id].progress = pct;

    if (pct >= 1) {
      if (action.id.startsWith('cook_')) SFX.cook();
      else if (action.id === 'film_clip') SFX.film();
      else SFX.complete();
      collectReward(action);

      const isCook = COOK_IDS.includes(id);
      const shouldLoop = isCook ? gs.G.activeCookId === id : gs.G.managers.includes(id);
      if (shouldLoop) {
        setTimeout(() => {
          if (!gs.G.actionTimers[id]) return;
          gs.G.actionTimers[id].progress = 0;
          gs.G.actionTimers[id].running = true;
          runActionLoop(id);
        }, 250);
      } else {
        gs.G.actionTimers[id].progress = 0;
        gs.G.actionTimers[id].running = false;
      }
      return;
    }
    activeTimers[id] = requestAnimationFrame(tick);
  }
  activeTimers[id] = requestAnimationFrame(tick);
}

export function collectReward(action) {
  const G = gs.G;
  const before = { money: G.money, subs: G.subs, views: G.views, xp: G.xp };

  if (action.id.startsWith('cook_')) {
    G.totalCooks++;
    const stockYield = { cook_eggs: 1, cook_pasta: 2, cook_stirfry: 2, cook_sushi: 3, cook_wellington: 1, cook_ramen: 2 };
    const addCount = stockYield[action.id] || 1;
    if (G.mealQueue.length < MAX_MEAL_STOCK) {
      const freshness = getMealFreshness();
      const canAdd = Math.min(addCount, MAX_MEAL_STOCK - G.mealQueue.length);
      for (let i = 0; i < canAdd; i++) {
        G.mealQueue.push({
          id: ++gs.mealIdCounter,
          addedAt: stallUnlocked() ? Date.now() : null,
          maxAge: freshness,
        });
      }
      G.mealStock = G.mealQueue.length;
    }
  }
  if (action.id === 'film_clip') G.totalFilmed++;
  if (action.id === 'edit_video' || action.id === 'thumbnail') G.totalEdits++;

  action.reward(G);
  const earned = G.money - before.money;
  if (earned > 0) G.money = before.money + earned * G.mx.money;

  // Floating numbers — drift up from the action card.
  const cardEl = document.getElementById('ac-' + action.id);
  if (cardEl) {
    const rect = cardEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const finalEarned = G.money - before.money;
    const subsEarned = G.subs - before.subs;
    const viewsEarned = G.views - before.views;
    const xpEarned = G.xp - before.xp;
    let offset = 0;
    if (finalEarned > 0) { pushFloat('+' + fmtMoney(finalEarned), cx, cy + offset, 'green'); offset += 18; pulseStat('money'); }
    if (subsEarned > 0) { pushFloat('+' + fmt(subsEarned) + ' subs', cx, cy + offset, 'blue'); offset += 18; pulseStat('subs'); }
    if (viewsEarned > 0) { pushFloat('+' + fmt(viewsEarned) + ' views', cx, cy + offset, 'purple'); offset += 18; pulseStat('views'); }
    if (xpEarned > 0) { pushFloat('+' + fmt(xpEarned) + ' XP', cx, cy + offset, 'gold'); }
  }

  checkLevelUp();
  checkUnlocks();
  checkMilestones();
}

export function checkLevelUp() {
  const G = gs.G;
  let leveled = false;
  while (G.xp >= G.xpNeeded) {
    G.xp -= G.xpNeeded;
    G.level++;
    G.xpNeeded = Math.floor(G.xpNeeded * 1.45);
    SFX.levelUp();
    pushNotification('LEVEL UP — now Level ' + G.level + '!', '');
    leveled = true;
  }
  if (leveled) checkUnlocks();
}

export function getTitle() {
  let t = 'Aspiring Cook';
  for (const [lvl, name] of TITLES) if (gs.G.level >= lvl) t = name;
  const p = gs.G.prestiges > 0 ? ' (x' + gs.G.prestiges + ' Viral)' : '';
  return '★ ' + t + p;
}

export function checkUnlocks() {
  ACTIONS.forEach((a) => {
    if (isActionUnlocked(a) && !gs.prevUnlockedActions.has(a.id)) {
      gs.prevUnlockedActions.add(a.id);
      SFX.unlock();
      pushNotification('🔓 Unlocked: ' + a.name, 'blue');
    }
  });
  UPGRADES_DEF.forEach((u) => {
    if (isUpgradeUnlocked(u) && !gs.G.ownedUpgrades.includes(u.id) && !gs.prevUnlockedUpgrades.has(u.id)) {
      gs.prevUnlockedUpgrades.add(u.id);
    }
  });
  // Trigger reactivity by reassigning the sets so Svelte sees the change.
  gs.prevUnlockedActions = new Set(gs.prevUnlockedActions);
  gs.prevUnlockedUpgrades = new Set(gs.prevUnlockedUpgrades);

  void getViralThreshold;
  void calcCloutEarned;
}

export function checkMilestones() {
  const G = gs.G;
  MILESTONES_DEF.forEach((m) => {
    if (!G.doneMilestones.includes(m.id) && m.check(G)) {
      G.doneMilestones.push(m.id);
      SFX.milestone();
      pushNotification('🏆 Milestone: ' + m.name, '');
      applyMilestoneRewards(G, m.id);
    }
  });
}

export function buyUpgrade(id) {
  const G = gs.G;
  const u = UPGRADES_DEF.find((x) => x.id === id);
  if (!u || G.ownedUpgrades.includes(id) || G.money < u.cost || !isUpgradeUnlocked(u)) return;
  G.money -= u.cost;
  G.ownedUpgrades.push(id);
  u.effect(G);
  SFX.upgrade();
  pushNotification('✦ Upgrade: ' + u.name, 'green');
}

export function reapplyUpgrades() {
  const G = gs.G;
  G.mx = { xp: 1, sub: 1, view: 1, speed: 1, money: 1 };
  G.ownedUpgrades.forEach((id) => {
    const u = UPGRADES_DEF.find((x) => x.id === id);
    if (u) u.effect(G);
  });
  G.doneMilestones.forEach((id) => applyMilestoneRewards(G, id));
  applyPrestigeMultipliers();
}

export function clickAction(id) {
  if (!gs.G.actionTimers[id]) gs.G.actionTimers[id] = { progress: 0, running: false };
  if (!gs.G.actionTimers[id].running) {
    startAction(id);
  }
}

export function buyManager(id) {
  const G = gs.G;
  const a = ACTIONS.find((x) => x.id === id);
  if (!a || G.managers.includes(id) || COOK_IDS.includes(id)) return;
  const discTier = getPrestigeTier('pu_manager_disc');
  const discount = discTier >= 0 ? Math.pow(0.8, discTier + 1) : 1;
  const effectiveCost = Math.floor(a.managerCost * discount);
  if (G.money < effectiveCost) return;
  G.money -= effectiveCost;
  G.managers.push(id);
  SFX.manager();
  pushNotification('🤖 Hired: ' + a.managerName, 'green');
  if (!G.actionTimers[id] || !G.actionTimers[id].running) startAction(id);
}

export function setActiveCook(id) {
  const prev = gs.G.activeCookId;
  if (prev && prev !== id) {
    if (gs.G.actionTimers[prev]) gs.G.actionTimers[prev].running = false;
    if (activeTimers[prev]) { cancelAnimationFrame(activeTimers[prev]); delete activeTimers[prev]; }
  }
  if (gs.G.activeCookId === id) {
    gs.G.activeCookId = null;
    if (gs.G.actionTimers[id]) gs.G.actionTimers[id].running = false;
    if (activeTimers[id]) { cancelAnimationFrame(activeTimers[id]); delete activeTimers[id]; }
  } else {
    gs.G.activeCookId = id;
    if (!gs.G.actionTimers[id]) gs.G.actionTimers[id] = { progress: 0, running: false };
    if (!gs.G.actionTimers[id].running) startAction(id);
  }
}

export function getManagerCost(a) {
  const discTier = getPrestigeTier('pu_manager_disc');
  const discount = discTier >= 0 ? Math.pow(0.8, discTier + 1) : 1;
  return Math.floor(a.managerCost * discount);
}
