// Food stall logic.

import { gs, pushNotification, pushFloat, setStallSpawnTimer } from './state.svelte.js';
import { CUSTOMER_POOL, ORDER_LINES } from './data.js';
import { SFX } from './audio.js';
import { getPrestigeTier } from './prestige.js';
import { fmtMoney } from './helpers.js';

export function stallUnlocked() {
  const tier = getPrestigeTier('pu_stall_unlock');
  const threshold = tier >= 0 ? [5, 2, 1][tier] : 10;
  return gs.G.totalCooks >= threshold;
}

export function getMealFreshness() {
  const base = Math.max(180000, 300000 - gs.G.level * 5000);
  const tier = getPrestigeTier('pu_freshness');
  return tier >= 0 ? base * Math.pow(1.25, tier + 1) : base;
}

export function getMealPrice() {
  const G = gs.G;
  const base = 2 + G.level * 1.8;
  const hypeBonus = 1 + (G.hype / 100) * 0.6;
  const priceTier = getPrestigeTier('pu_stall_price');
  const priceBonus = priceTier >= 0 ? Math.pow(1.2, priceTier + 1) : 1;
  return base * hypeBonus * G.mx.money * priceBonus;
}

function getCustomerPatience() {
  return Math.max(7000, 15000 - gs.G.level * 350);
}

function getSpawnInterval() {
  return Math.max(3500, 11000 - gs.G.level * 600);
}

export function scheduleNextSpawn() {
  setStallSpawnTimer(setTimeout(() => {
    if (stallUnlocked()) spawnCustomer();
    scheduleNextSpawn();
  }, getSpawnInterval()));
}

export function spawnCustomer() {
  if (!stallUnlocked()) return;
  if (gs.G.mealStock <= 0) return;
  if (gs.stallCustomers.length >= 4) return;
  const pool = CUSTOMER_POOL.filter((c) => !gs.stallCustomers.find((s) => s.name === c.name));
  const pick = pool[Math.floor(Math.random() * pool.length)] || CUSTOMER_POOL[0];
  const patience = getCustomerPatience();
  gs.stallCustomers.push({
    id: ++gs.custIdCounter,
    name: pick.name,
    emoji: pick.emoji,
    order: ORDER_LINES[Math.floor(Math.random() * ORDER_LINES.length)],
    timeLeft: patience,
    maxTime: patience,
    value: getMealPrice(),
  });
}

export function serveCustomer(id, evt) {
  const idx = gs.stallCustomers.findIndex((c) => c.id === id);
  if (idx === -1) return;
  if (gs.G.mealStock <= 0) {
    pushNotification('No meals in stock — go cook something!', '');
    return;
  }
  const c = gs.stallCustomers[idx];
  gs.G.mealQueue.shift();
  gs.G.mealStock = gs.G.mealQueue.length;
  gs.G.totalMealsServed++;
  const earned = c.value;
  gs.G.money += earned;
  gs.stallTotalEarned += earned;
  if (evt) pushFloat('+' + fmtMoney(earned), evt.clientX, evt.clientY, 'green');
  SFX.serve();
  gs.G.hype = Math.min(100, gs.G.hype + 0.5);
  gs.stallCustomers.splice(idx, 1);
}

export function tickStall() {
  if (!stallUnlocked() || gs.stallCustomers.length === 0) return;
  const dt = 120;
  gs.stallCustomers = gs.stallCustomers.filter((c) => {
    c.timeLeft -= dt;
    if (c.timeLeft <= 0) {
      SFX.miss();
      gs.G.hype = Math.max(0, gs.G.hype - 1.5);
      return false;
    }
    return true;
  });
}

export function tickMealSpoilage() {
  if (!gs.G.mealQueue || gs.G.mealQueue.length === 0) return;
  const nowUnlocked = stallUnlocked();
  if (nowUnlocked && !gs.G.stallWasUnlocked) {
    gs.G.stallWasUnlocked = true;
    const now2 = Date.now();
    gs.G.mealQueue.forEach((m) => { if (m.addedAt === null) m.addedAt = now2; });
  }
  if (!nowUnlocked) return;
  const now = Date.now();
  let spoiledCount = 0;
  let totalPenalty = 0;
  gs.G.mealQueue = gs.G.mealQueue.filter((m) => {
    if (m.addedAt === null) return true;
    if (now - m.addedAt >= m.maxAge) {
      spoiledCount++;
      totalPenalty += getMealPrice() * 0.5;
      return false;
    }
    return true;
  });
  if (spoiledCount > 0) {
    gs.G.mealStock = gs.G.mealQueue.length;
    gs.G.mealsSpoiled += spoiledCount;
    gs.G.money = Math.max(0, gs.G.money - totalPenalty);
    gs.G.hype = Math.max(0, gs.G.hype - spoiledCount * 6);
  }
}
