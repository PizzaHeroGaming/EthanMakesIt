// Throwaway simulator: model an "optimal-ish" player progressing from $0 to first Go Viral.
// Buys: every upgrade ASAP, every manager ASAP, auto-cook when available, levels via Max-buy
// of the highest-$/s action whenever a buy is affordable. Serves every stall customer.
// Runs at 1-second discrete ticks. Time-to-viral assumes 100K subs.

import { ACTIONS, UPGRADES_DEF, MILESTONES_DEF, COOK_IDS, MAX_MEAL_STOCK,
  applyMilestoneRewards, actionLevelMultiplier, actionLevelCost, maxAffordableLevels,
  LEVEL_COST_GROWTH } from './src/lib/data.js';

const G = {
  money: 0, subs: 0, views: 0, level: 1, xp: 0, xpNeeded: 220, hype: 0, prestiges: 0,
  totalCooks: 0, totalFilmed: 0, totalEdits: 0, totalMealsServed: 0,
  mealStock: 0, mealQueue: [], mealsSpoiled: 0, tick: 0,
  mx: { xp: 1, sub: 1, view: 1, speed: 1, money: 1 },
  ownedUpgrades: [], doneMilestones: [], managers: [],
  prestigeUpgrades: {}, cloutPoints: 0, totalCloutEarned: 0,
  activeCookId: null, stallWasUnlocked: false,
  actionTimers: {}, actionLevels: {},
};

let stallTotalEarned = 0;

function isActionUnlocked(a) {
  const u = a.unlockAt;
  if (u.level && G.level < u.level) return false;
  if (u.subs && G.subs < u.subs) return false;
  if (u.totalCooks && G.totalCooks < u.totalCooks) return false;
  if (u.totalFilmed && G.totalFilmed < u.totalFilmed) return false;
  if (u.totalEdits && G.totalEdits < u.totalEdits) return false;
  return true;
}
function isUpgradeUnlocked(u) {
  const r = u.unlockAt;
  if (r.level && G.level < r.level) return false;
  if (r.subs && G.subs < r.subs) return false;
  if (r.totalEdits && G.totalEdits < r.totalEdits) return false;
  if (r.totalFilmed && G.totalFilmed < r.totalFilmed) return false;
  return true;
}
function getActionDuration(a) { return Math.max(0.5, a.baseTime / 1000 / G.mx.speed); }
function getActionLevel(id) { return G.actionLevels[id] || 1; }
function getActionMultiplier(id) { return actionLevelMultiplier(getActionLevel(id)); }
function stallUnlocked() { return G.totalCooks >= 10; }
function getMealPrice() {
  const base = 2 + G.level * 1.8;
  return base * (1 + (G.hype / 100) * 0.6) * G.mx.money;
}

function collectReward(action) {
  if (action.id.startsWith('cook_')) {
    G.totalCooks++;
    const stockYield = { cook_eggs: 1, cook_pasta: 2, cook_stirfry: 2, cook_sushi: 3, cook_wellington: 1, cook_ramen: 2 };
    const addCount = stockYield[action.id] || 1;
    if (G.mealQueue.length < MAX_MEAL_STOCK) {
      const canAdd = Math.min(addCount, MAX_MEAL_STOCK - G.mealQueue.length);
      for (let i = 0; i < canAdd; i++) G.mealQueue.push({ addedAt: stallUnlocked() ? G.tick : null });
      G.mealStock = G.mealQueue.length;
    }
  }
  if (action.id === 'film_clip') G.totalFilmed++;
  if (action.id === 'edit_video' || action.id === 'thumbnail') G.totalEdits++;

  const pre = { money: G.money, subs: G.subs, views: G.views, xp: G.xp, hype: G.hype };
  action.reward(G);
  const mult = getActionMultiplier(action.id);
  G.money = pre.money + (G.money - pre.money) * G.mx.money * mult;
  G.subs = pre.subs + (G.subs - pre.subs) * mult;
  G.views = pre.views + (G.views - pre.views) * mult;
  G.hype = Math.min(100, pre.hype + (G.hype - pre.hype) * mult);

  while (G.xp >= G.xpNeeded) {
    G.xp -= G.xpNeeded;
    G.level++;
    G.xpNeeded = Math.floor(G.xpNeeded * 1.7);
  }

  MILESTONES_DEF.forEach((m) => {
    if (!G.doneMilestones.includes(m.id) && m.check(G)) {
      G.doneMilestones.push(m.id);
      applyMilestoneRewards(G, m.id);
    }
  });
}

function startAction(id) {
  if (!G.actionTimers[id]) G.actionTimers[id] = { progress: 0, running: false };
  G.actionTimers[id].running = true;
}

// AI: pick the "best" unlocked money-earning action to level up via max-buy.
// Score = action's potential money payout next level / cost ratio. Coarse but fine.
function tryBuyLevels() {
  const candidates = ACTIONS.filter((a) => isActionUnlocked(a) && a.baseLevelCost);
  let bestQty = 0;
  let bestAction = null;
  for (const a of candidates) {
    const lvl = getActionLevel(a.id);
    const qty = maxAffordableLevels(a.baseLevelCost, lvl, G.money);
    if (qty <= 0) continue;
    // Estimate value: prefer leveling money-earning actions, but level cooks if stall is open.
    const isMoneyAction = ['edit_video', 'sponsorship', 'merch', 'viral_video', 'thumbnail', 'collab', 'promote'].includes(a.id);
    const isCookForStall = COOK_IDS.includes(a.id) && stallUnlocked();
    if (!isMoneyAction && !isCookForStall && a.id !== 'film_clip' && a.id !== 'cook_eggs') continue;
    if (qty > bestQty) { bestQty = qty; bestAction = a; }
  }
  if (bestAction) {
    const cost = actionLevelCost(bestAction.baseLevelCost, getActionLevel(bestAction.id), bestQty);
    G.money -= cost;
    G.actionLevels[bestAction.id] = getActionLevel(bestAction.id) + bestQty;
  }
}

function tryBuyUpgrades() {
  for (const u of UPGRADES_DEF) {
    if (G.ownedUpgrades.includes(u.id)) continue;
    if (!isUpgradeUnlocked(u)) continue;
    if (G.money < u.cost) continue;
    G.money -= u.cost;
    G.ownedUpgrades.push(u.id);
    u.effect(G);
  }
}

function tryHireManagers() {
  for (const a of ACTIONS) {
    if (!a.managerCost) continue;
    if (COOK_IDS.includes(a.id)) continue;
    if (G.managers.includes(a.id)) continue;
    if (!isActionUnlocked(a)) continue;
    if (G.money < a.managerCost) continue;
    G.money -= a.managerCost;
    G.managers.push(a.id);
    startAction(a.id);
  }
}

function tryAutoCook() {
  if (!G.ownedUpgrades.includes('ug_autocook')) return;
  if (G.activeCookId) return;
  // Pick highest tier cook unlocked
  for (const id of [...COOK_IDS].reverse()) {
    const a = ACTIONS.find((x) => x.id === id);
    if (isActionUnlocked(a)) { G.activeCookId = id; startAction(id); return; }
  }
}

function startUnlockedActions() {
  // Start anything that has a manager or is set as active cook.
  for (const a of ACTIONS) {
    if (!isActionUnlocked(a)) continue;
    const id = a.id;
    if (!G.actionTimers[id]) G.actionTimers[id] = { progress: 0, running: false };
    const isCook = COOK_IDS.includes(id);
    const shouldRun = isCook ? G.activeCookId === id : G.managers.includes(id);
    // Without manager, simulate the player clicking once: they keep it running by re-clicking.
    // For sim purposes, assume player has hands and clicks every action that's unlocked.
    if (shouldRun || !G.actionTimers[id].running) {
      G.actionTimers[id].running = true;
    }
  }
}

let firstDollarTime = null;
let stallOpenTime = null;
let level9Time = null;

const DT = 0.1; // 100ms tick for finer resolution

for (let secs = 0; secs < 60 * 60 * 10; secs += DT) {
  G.tick = secs;

  // Per-second-ish economy actions
  if (Math.floor(secs * 10) % 10 === 0) {
    tryBuyUpgrades();
    tryHireManagers();
    tryAutoCook();
    tryBuyLevels();
    startUnlockedActions();
  }

  // Advance each running action's progress
  for (const a of ACTIONS) {
    const t = G.actionTimers[a.id];
    if (!t || !t.running || !isActionUnlocked(a)) continue;
    const dur = getActionDuration(a);
    t.progress += DT / dur;
    if (t.progress >= 1) {
      collectReward(a);
      t.progress = 0;
    }
  }

  // Hype passive subs/views, like the main tick
  G.hype = Math.max(0, G.hype - 0.015 * DT * 2);
  if (G.hype > 25 && G.totalEdits > 0) {
    G.subs += (G.hype / 100) * G.mx.sub * 0.1 * DT * 2;
    G.views += G.subs * 0.00005 * G.mx.view * DT * 2;
  }

  // Stall: instantly sell every meal once unlocked. Customer spawn cadence isn't the bottleneck —
  // assume player serves everything instantly. Each meal sale = getMealPrice().
  if (stallUnlocked() && !stallOpenTime) stallOpenTime = secs;
  if (stallUnlocked() && G.mealQueue.length > 0) {
    // Sell one meal per simulated 3 seconds (rough avg customer pace)
    if (Math.floor(secs / 3) !== Math.floor((secs - DT) / 3)) {
      const earned = getMealPrice();
      G.money += earned;
      stallTotalEarned += earned;
      G.totalMealsServed++;
      G.hype = Math.min(100, G.hype + 0.5);
      G.mealQueue.shift();
      G.mealStock = G.mealQueue.length;
    }
  }

  if (firstDollarTime === null && G.money >= 1) firstDollarTime = secs;
  if (level9Time === null && G.level >= 9) level9Time = secs;

  if (G.subs >= 5000000) {
    const fmt = (s) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      const h = Math.floor(m / 60);
      return h ? `${h}h ${m % 60}m ${sec}s` : `${m}m ${sec}s`;
    };
    console.log('--- WENT VIRAL ---');
    console.log('Time to viral:       ', fmt(secs));
    console.log('First $1:            ', fmt(firstDollarTime || 0));
    console.log('Stall unlocked at:   ', fmt(stallOpenTime || 0));
    console.log('Chef Level 9 at:     ', fmt(level9Time || 0));
    console.log('Final Chef Level:    ', G.level);
    console.log('Final money:         ', '$' + Math.floor(G.money).toLocaleString());
    console.log('Final views:         ', Math.floor(G.views).toLocaleString());
    console.log('Meals served:        ', G.totalMealsServed);
    console.log('Stall earned:        ', '$' + Math.floor(stallTotalEarned).toLocaleString());
    console.log('Upgrades owned:      ', G.ownedUpgrades.length + '/' + UPGRADES_DEF.length);
    console.log('Managers hired:      ', G.managers.length);
    console.log('Action levels:');
    for (const a of ACTIONS) {
      const lvl = getActionLevel(a.id);
      if (lvl > 1) console.log('  ' + a.name.padEnd(26) + 'Lv ' + lvl + '  (×' + actionLevelMultiplier(lvl) + ')');
    }
    process.exit(0);
  }
}

console.log('Did not reach viral in 10 hours. Subs:', Math.floor(G.subs));
