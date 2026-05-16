// Prestige helpers — pure functions over gs.G; mutations call back into shared logic.

import { gs, DEFAULT_G, pushNotification, stallSpawnTimer, setStallSpawnTimer } from './state.svelte.js';
import { PRESTIGE_UPGRADES } from './data.js';
import { SFX } from './audio.js';

export function getPrestigeTier(id) {
  return gs.G.prestigeUpgrades[id] !== undefined ? gs.G.prestigeUpgrades[id] : -1;
}

export function calcCloutEarned() {
  const G = gs.G;
  const subsCp = Math.floor(Math.sqrt(G.subs / 300));
  const prestigeCp = Math.floor(G.prestiges * 1.5);
  const raw = Math.max(5, 5 + subsCp + prestigeCp);
  const cap = 15 + G.prestiges * 3;
  return Math.min(raw, cap);
}

export function applyPrestigeMultipliers() {
  const G = gs.G;
  const t = (id) => getPrestigeTier(id);
  if (t('pu_speed') >= 0) G.mx.speed *= Math.pow(1.15, t('pu_speed') + 1);
  if (t('pu_xp_gain') >= 0) G.mx.xp *= Math.pow(1.20, t('pu_xp_gain') + 1);
  if (t('pu_sub_gain') >= 0) G.mx.sub *= Math.pow(1.20, t('pu_sub_gain') + 1);
  if (t('pu_view_gain') >= 0) G.mx.view *= Math.pow(1.20, t('pu_view_gain') + 1);
  if (t('pu_money_gain') >= 0) G.mx.money *= Math.pow(1.20, t('pu_money_gain') + 1);
}

export function applyPrestigeStartBonuses() {
  const G = gs.G;
  const moneyTier = getPrestigeTier('pu_start_money');
  if (moneyTier >= 0) G.money = [50, 200, 750, 3000][moneyTier];
  const subsTier = getPrestigeTier('pu_start_subs');
  if (subsTier >= 0) {
    const startSubs = [50, 250, 1000, 5000][subsTier];
    G.subs = startSubs;
    G.views = Math.floor(startSubs * 25);
  }
  const levelTier = getPrestigeTier('pu_start_level');
  if (levelTier >= 0) {
    const target = [2, 3, 5][levelTier];
    while (G.level < target) {
      G.level++;
      G.xpNeeded = Math.floor(G.xpNeeded * 1.45);
    }
  }
}

export function getHypeDecayRate() {
  const base = 0.015;
  const tier = getPrestigeTier('pu_hype_decay');
  return tier >= 0 ? base * Math.pow(0.80, tier + 1) : base;
}

export function getViralThreshold() {
  return Math.floor(100000 * Math.pow(1.25, gs.G.prestiges));
}

export function buyPrestigeUpgrade(id, reapply) {
  const pu = PRESTIGE_UPGRADES.find((p) => p.id === id);
  if (!pu) return;
  const currentTier = getPrestigeTier(id);
  const nextTier = currentTier + 1;
  if (nextTier >= pu.tiers.length) return;
  const cost = pu.tiers[nextTier].cost;
  if (gs.G.cloutPoints < cost) return;
  gs.G.cloutPoints -= cost;
  gs.G.prestigeUpgrades[id] = nextTier;
  SFX.upgrade();
  pushNotification('✦ Prestige: ' + pu.name + ' — ' + pu.tiers[nextTier].effect, 'purple');
  if (reapply) reapply();
}

export function showPrestigeConfirm() {
  gs._pmodCloutSnapshot = gs.G.cloutPoints;
  gs._pmodPUSnapshot = JSON.parse(JSON.stringify(gs.G.prestigeUpgrades));
  gs._pmodCloutEarned = calcCloutEarned();
  gs._pmodPrestiges = gs.G.prestiges + 1;
  gs.G.cloutPoints += gs._pmodCloutEarned;
  gs.G.totalCloutEarned = (gs.G.totalCloutEarned || 0) + gs._pmodCloutEarned;
  gs.prestigeModalOpen = true;
}

export function buyPrestigeUpgradeModal(id) {
  const pu = PRESTIGE_UPGRADES.find((p) => p.id === id);
  if (!pu) return;
  const currentTier = getPrestigeTier(id);
  const nextTier = currentTier + 1;
  if (nextTier >= pu.tiers.length) return;
  const cost = pu.tiers[nextTier].cost;
  if (gs.G.cloutPoints < cost) return;
  gs.G.cloutPoints -= cost;
  gs.G.prestigeUpgrades[id] = nextTier;
  SFX.upgrade();
}

export function cancelPrestigeModal() {
  gs.G.cloutPoints = gs._pmodCloutSnapshot + gs._pmodCloutEarned;
  gs.G.prestigeUpgrades = gs._pmodPUSnapshot;
  gs.prestigeModalOpen = false;
}

export function confirmPrestige(scheduleNextSpawn) {
  gs.prestigeModalOpen = false;
  const prev = gs._pmodPrestiges;
  const keepPU = { ...gs.G.prestigeUpgrades };
  const keepClout = gs.G.cloutPoints;
  const keepTotalClout = gs.G.totalCloutEarned || 0;

  gs.G = DEFAULT_G();
  gs.G.prestiges = prev;
  gs.G.prestigeUpgrades = keepPU;
  gs.G.cloutPoints = keepClout;
  gs.G.totalCloutEarned = keepTotalClout;

  gs.stallCustomers = [];
  gs.stallTotalEarned = 0;
  gs.custIdCounter = 0;
  if (stallSpawnTimer) {
    clearTimeout(stallSpawnTimer);
    setStallSpawnTimer(null);
  }
  if (scheduleNextSpawn) scheduleNextSpawn();

  applyPrestigeStartBonuses();
  applyPrestigeMultipliers();

  gs.prevUnlockedActions = new Set();
  gs.prevUnlockedUpgrades = new Set();

  SFX.viral();
  pushNotification('★★★ WENT VIRAL! Prestige #' + prev + ' — new run started!', '');
}
