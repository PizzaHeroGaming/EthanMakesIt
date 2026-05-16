// Prestige logic: clout-point math, multipliers, modal flow, reset.

import { state, DEFAULT_G } from './state.js';
import { PRESTIGE_UPGRADES } from './data.js';
import { SFX } from './audio.js';
import { notify } from './ui.js';
import { reapplyUpgrades, updateTitle } from './actions.js';
import { renderAll, renderPrestigeShop, updateStats } from './render.js';
import { scheduleNextSpawn } from './stall.js';

export function getPrestigeTier(id) {
  return state.G.prestigeUpgrades[id] !== undefined ? state.G.prestigeUpgrades[id] : -1;
}

export function calcCloutEarned() {
  const G = state.G;
  const subsCp = Math.floor(Math.sqrt(G.subs / 300));
  const prestigeCp = Math.floor(G.prestiges * 1.5);
  const raw = Math.max(5, 5 + subsCp + prestigeCp);
  const cap = 15 + G.prestiges * 3;
  return Math.min(raw, cap);
}

export function applyPrestigeMultipliers() {
  const G = state.G;
  const t = (id) => getPrestigeTier(id);
  if (t('pu_speed') >= 0) G.mx.speed *= Math.pow(1.15, t('pu_speed') + 1);
  if (t('pu_xp_gain') >= 0) G.mx.xp *= Math.pow(1.20, t('pu_xp_gain') + 1);
  if (t('pu_sub_gain') >= 0) G.mx.sub *= Math.pow(1.20, t('pu_sub_gain') + 1);
  if (t('pu_view_gain') >= 0) G.mx.view *= Math.pow(1.20, t('pu_view_gain') + 1);
  if (t('pu_money_gain') >= 0) G.mx.money *= Math.pow(1.20, t('pu_money_gain') + 1);
}

export function applyPrestigeStartBonuses() {
  const G = state.G;
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
  return Math.floor(100000 * Math.pow(1.25, state.G.prestiges));
}

export function buyPrestigeUpgrade(id) {
  const pu = PRESTIGE_UPGRADES.find((p) => p.id === id);
  if (!pu) return;
  const currentTier = getPrestigeTier(id);
  const nextTier = currentTier + 1;
  if (nextTier >= pu.tiers.length) return;
  const cost = pu.tiers[nextTier].cost;
  if (state.G.cloutPoints < cost) return;
  state.G.cloutPoints -= cost;
  state.G.prestigeUpgrades[id] = nextTier;
  SFX.upgrade();
  notify('✦ Prestige: ' + pu.name + ' — ' + pu.tiers[nextTier].effect, 'purple');
  reapplyUpgrades();
  renderPrestigeShop();
  updateStats();
}

export function showPrestigeConfirm() {
  state._pmodCloutSnapshot = state.G.cloutPoints;
  state._pmodPUSnapshot = JSON.parse(JSON.stringify(state.G.prestigeUpgrades));
  state._pmodCloutEarned = calcCloutEarned();
  state._pmodPrestiges = state.G.prestiges + 1;

  state.G.cloutPoints += state._pmodCloutEarned;
  state.G.totalCloutEarned = (state.G.totalCloutEarned || 0) + state._pmodCloutEarned;

  renderPrestigeModal();
  document.getElementById('prestige-modal').classList.add('open');
}

export function renderPrestigeModal() {
  document.getElementById('pmod-cp-earned').textContent =
    'This run: +' + state._pmodCloutEarned + ' CP · Previously: ' + state._pmodCloutSnapshot + ' CP';
  document.getElementById('pmod-cp-total').textContent = state.G.cloutPoints + ' CP';

  const grid = document.getElementById('pmod-grid');
  if (!grid) return;
  const clout = state.G.cloutPoints;

  grid.innerHTML = PRESTIGE_UPGRADES.map((pu) => {
    const tier = getPrestigeTier(pu.id);
    const maxTier = pu.tiers.length - 1;
    const isMaxed = tier >= maxTier;
    const nextTier = tier + 1;
    const nextCost = !isMaxed ? pu.tiers[nextTier].cost : 0;
    const canAfford = !isMaxed && clout >= nextCost;

    let cls = 'pu-card';
    if (isMaxed) cls += ' pu-maxed';
    else if (canAfford) cls += ' pu-affordable';

    const pips = pu.tiers
      .map((_, i) => `<div class="pu-pip${i <= tier ? ' on' : ''}"></div>`)
      .join('');

    const effectLine = tier >= 0
      ? `<div class="pu-effect">▶ ${pu.tiers[tier].effect}</div>`
      : `<div class="pu-effect" style="color:var(--muted)">Not yet purchased</div>`;

    const btn = isMaxed
      ? `<button class="pu-btn pu-maxed-btn" disabled>✓ Maxed</button>`
      : `<button class="pu-btn" onclick="buyPrestigeUpgradeModal('${pu.id}')" ${canAfford ? '' : 'disabled'}>
           ${canAfford ? '▲ Upgrade' : '🔒'} — ${nextCost} CP
         </button>`;

    return `<div class="${cls}" id="pmod-card-${pu.id}">
      <div class="pu-card-top">
        <div class="pu-icon">${pu.icon}</div>
        <div>
          <div class="pu-name">${pu.name}</div>
          <div class="pu-tier-label">${tier < 0 ? 'LOCKED' : 'TIER ' + (tier + 1) + ' / ' + pu.tiers.length}</div>
        </div>
      </div>
      <div class="pu-desc">${pu.desc}</div>
      <div class="pu-pips">${pips}</div>
      ${effectLine}
      ${btn}
    </div>`;
  }).join('');
}

export function buyPrestigeUpgradeModal(id) {
  const pu = PRESTIGE_UPGRADES.find((p) => p.id === id);
  if (!pu) return;
  const currentTier = getPrestigeTier(id);
  const nextTier = currentTier + 1;
  if (nextTier >= pu.tiers.length) return;
  const cost = pu.tiers[nextTier].cost;
  if (state.G.cloutPoints < cost) return;
  state.G.cloutPoints -= cost;
  state.G.prestigeUpgrades[id] = nextTier;
  SFX.upgrade();
  renderPrestigeModal();
}

export function cancelPrestigeModal() {
  state.G.cloutPoints = state._pmodCloutSnapshot + state._pmodCloutEarned;
  state.G.prestigeUpgrades = state._pmodPUSnapshot;
  document.getElementById('prestige-modal').classList.remove('open');
}

export function confirmPrestige() {
  document.getElementById('prestige-modal').classList.remove('open');

  const prev = state._pmodPrestiges;
  const keepPU = { ...state.G.prestigeUpgrades };
  const keepClout = state.G.cloutPoints;
  const keepTotalClout = state.G.totalCloutEarned || 0;

  state.G = DEFAULT_G();
  state.G.prestiges = prev;
  state.G.prestigeUpgrades = keepPU;
  state.G.cloutPoints = keepClout;
  state.G.totalCloutEarned = keepTotalClout;
  state.G.activeCookId = null;
  state.G.stallWasUnlocked = false;

  // Reset stall state — customers from the old run don't carry over.
  state.stallCustomers = [];
  state.stallTotalEarned = 0;
  state.custIdCounter = 0;
  if (state.stallSpawnTimer) {
    clearTimeout(state.stallSpawnTimer);
    state.stallSpawnTimer = null;
  }
  scheduleNextSpawn();

  applyPrestigeStartBonuses();
  applyPrestigeMultipliers();

  state.prevUnlockedActions = new Set();
  state.prevUnlockedUpgrades = new Set();

  SFX.viral();
  notify('★★★ WENT VIRAL! Prestige #' + prev + ' — new run started!', '');

  updateTitle();
  renderAll();
  renderPrestigeShop();
  updateStats();
}

export function doPrestige() { confirmPrestige(); }
