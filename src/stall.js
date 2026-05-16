// Food Stall: customers, meal freshness, serving loop.

import { state } from './state.js';
import { CUSTOMER_POOL, ORDER_LINES } from './data.js';
import { SFX } from './audio.js';
import { notify } from './ui.js';
import { getPrestigeTier } from './prestige.js';
import { fmtMoney, updateTabBadges, updateStats } from './render.js';

export function stallUnlocked() {
  const tier = getPrestigeTier('pu_stall_unlock');
  const threshold = tier >= 0 ? [5, 2, 1][tier] : 10;
  return state.G.totalCooks >= threshold;
}

export function getMealFreshness() {
  const base = Math.max(180000, 300000 - state.G.level * 5000);
  const tier = getPrestigeTier('pu_freshness');
  return tier >= 0 ? base * Math.pow(1.25, tier + 1) : base;
}

export function getMealPrice() {
  const G = state.G;
  const base = 2 + G.level * 1.8;
  const hypeBonus = 1 + (G.hype / 100) * 0.6;
  const priceTier = getPrestigeTier('pu_stall_price');
  const priceBonus = priceTier >= 0 ? Math.pow(1.2, priceTier + 1) : 1;
  return base * hypeBonus * G.mx.money * priceBonus;
}

export function getCustomerPatience() {
  return Math.max(7000, 15000 - state.G.level * 350);
}

export function getSpawnInterval() {
  return Math.max(3500, 11000 - state.G.level * 600);
}

export function scheduleNextSpawn() {
  state.stallSpawnTimer = setTimeout(() => {
    if (stallUnlocked()) spawnCustomer();
    scheduleNextSpawn();
  }, getSpawnInterval());
}

export function spawnCustomer() {
  if (!stallUnlocked()) return;
  if (state.G.mealStock <= 0) return;
  if (state.stallCustomers.length >= 4) return;
  const pool = CUSTOMER_POOL.filter((c) => !state.stallCustomers.find((s) => s.name === c.name));
  const pick = pool[Math.floor(Math.random() * pool.length)] || CUSTOMER_POOL[0];
  const patience = getCustomerPatience();
  state.stallCustomers.push({
    id: ++state.custIdCounter,
    name: pick.name,
    emoji: pick.emoji,
    order: ORDER_LINES[Math.floor(Math.random() * ORDER_LINES.length)],
    timeLeft: patience,
    maxTime: patience,
    value: getMealPrice(),
  });
  if (state.currentTab === 'stall') renderStall();
  updateTabBadges();
}

export function serveCustomer(id, evt) {
  const idx = state.stallCustomers.findIndex((c) => c.id === id);
  if (idx === -1) return;
  if (state.G.mealStock <= 0) {
    notify('No meals in stock — go cook something!', '');
    return;
  }
  const c = state.stallCustomers[idx];
  state.G.mealQueue.shift();
  state.G.mealStock = state.G.mealQueue.length;
  state.G.totalMealsServed++;
  const earned = c.value;
  state.G.money += earned;
  state.stallTotalEarned += earned;
  if (evt) {
    const el = document.createElement('div');
    el.className = 'float-money';
    el.textContent = '+' + fmtMoney(earned);
    el.style.left = evt.clientX - 20 + 'px';
    el.style.top = evt.clientY - 10 + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }
  SFX.serve();
  state.G.hype = Math.min(100, state.G.hype + 0.5);
  state.stallCustomers.splice(idx, 1);
  renderStall();
  updateTabBadges();
  updateStats();
}

export function tickStall() {
  if (!stallUnlocked() || state.stallCustomers.length === 0) return;
  const dt = 120;
  let changed = false;
  state.stallCustomers = state.stallCustomers.filter((c) => {
    c.timeLeft -= dt;
    if (c.timeLeft <= 0) {
      SFX.miss();
      state.G.hype = Math.max(0, state.G.hype - 1.5);
      changed = true;
      return false;
    }
    const bar = document.getElementById('cb-' + c.id);
    if (bar) {
      const pct = c.timeLeft / c.maxTime;
      bar.style.width = pct * 100 + '%';
      bar.style.background = pct > 0.5 ? 'var(--green)' : pct > 0.25 ? 'var(--gold)' : 'var(--red)';
    }
    return true;
  });
  if (changed) {
    if (state.currentTab === 'stall') renderStall();
    updateTabBadges();
  }
}

export function tickMealSpoilage() {
  if (!state.G.mealQueue || state.G.mealQueue.length === 0) return;

  const nowUnlocked = stallUnlocked();
  if (nowUnlocked && !state.G.stallWasUnlocked) {
    state.G.stallWasUnlocked = true;
    const now2 = Date.now();
    state.G.mealQueue.forEach((m) => {
      if (m.addedAt === null) m.addedAt = now2;
    });
    if (state.currentTab === 'stall') renderStall();
  }

  if (!nowUnlocked) return;

  const now = Date.now();
  let spoiledCount = 0;
  let totalPenalty = 0;
  state.G.mealQueue = state.G.mealQueue.filter((m) => {
    if (m.addedAt === null) return true;
    if (now - m.addedAt >= m.maxAge) {
      spoiledCount++;
      totalPenalty += getMealPrice() * 0.5;
      return false;
    }
    return true;
  });
  if (spoiledCount > 0) {
    state.G.mealStock = state.G.mealQueue.length;
    state.G.mealsSpoiled += spoiledCount;
    state.G.money = Math.max(0, state.G.money - totalPenalty);
    state.G.hype = Math.max(0, state.G.hype - spoiledCount * 6);
    if (state.currentTab === 'stall') renderStall();
    updateStats();
  }
}

export function renderStall() {
  const el = document.getElementById('stall-wrap');
  if (!el) return;
  if (!stallUnlocked()) {
    el.innerHTML = `<div class="stall-locked">
      <div class="big">🍳</div>
      Cook <strong style="color:var(--gold)">10 meals</strong> to unlock the Food Stall.<br>
      <span style="color:var(--muted)">${state.G.totalCooks}/10 cooked so far</span>
    </div>`;
    return;
  }
  const price = getMealPrice();
  let html = `
    <div class="stall-header">
      <div class="stall-title">🏪 Food Stall</div>
      <div class="stall-stock-badge">Stock: <span>${state.G.mealStock}</span> meals</div>
    </div>
    <div class="stall-hint">Meals spoil if not sold in time — losing money and hype. Keep stock lean and cook fresh batches often.</div>
    <div class="stall-earnings">
      <span>Price/meal</span><span class="se-val">${fmtMoney(price)}</span>
      <span style="margin-left:8px">Earned</span><span class="se-val">${fmtMoney(state.stallTotalEarned)}</span>
      <span style="margin-left:8px;color:var(--red)">Spoiled</span><span class="se-val" style="color:var(--red)">${state.G.mealsSpoiled}</span>
    </div>`;
  if (state.G.mealQueue && state.G.mealQueue.length > 0) {
    const now = Date.now();
    html += `<div class="freshness-section">
      <div class="freshness-label">🌡 Meal Freshness <span style="color:var(--muted);font-size:9px">(${state.G.mealQueue.length} in stock)</span></div>
      <div class="freshness-grid">`;
    state.G.mealQueue.forEach((m) => {
      if (m.addedAt === null) {
        html += `<div class="meal-block fresh" title="Stall not open yet — timer not started" style="opacity:0.4;border-style:dashed"></div>`;
        return;
      }
      const pct = Math.max(0, 1 - (now - m.addedAt) / m.maxAge);
      const secLeft = Math.ceil((m.maxAge - (now - m.addedAt)) / 1000);
      const minLeft = secLeft >= 60 ? Math.floor(secLeft / 60) + 'm ' + (secLeft % 60) + 's' : secLeft + 's';
      const cls = pct > 0.6 ? 'fresh' : pct > 0.25 ? 'aging' : 'stale';
      html += `<div class="meal-block ${cls}" title="${minLeft} left"></div>`;
    });
    html += `</div></div>`;
  }
  if (state.G.mealStock === 0 && state.stallCustomers.length === 0) {
    html += `<div class="stall-nostock">📦 Out of stock — head to Actions and cook something to restock.</div>`;
  } else if (state.stallCustomers.length === 0) {
    html += `<div class="stall-empty"><div class="big">👀</div>Waiting for customers...<br><span style="font-size:9px">They'll show up shortly.</span></div>`;
  } else {
    html += `<div class="customer-grid">`;
    state.stallCustomers.forEach((c) => {
      const pct = c.timeLeft / c.maxTime;
      const barColor = pct > 0.5 ? 'var(--green)' : pct > 0.25 ? 'var(--gold)' : 'var(--red)';
      html += `<div class="customer-card" onclick="event.stopPropagation();serveCustomer(${c.id}, event)">
        <div class="cust-top">
          <div class="cust-emoji">${c.emoji}</div>
          <div class="cust-info">
            <div class="cust-name">${c.name}</div>
            <div class="cust-order">"${c.order}"</div>
          </div>
        </div>
        <div class="cust-value">${fmtMoney(c.value)}</div>
        <div class="cust-timer-track"><div class="cust-timer-bar" id="cb-${c.id}" style="width:${pct * 100}%;background:${barColor}"></div></div>
        <div class="serve-hint">tap to serve</div>
      </div>`;
    });
    html += `</div>`;
    if (state.G.mealStock === 0) html += `<div class="stall-nostock" style="margin-top:8px">📦 No more stock — cook more to keep serving!</div>`;
  }
  el.innerHTML = html;
}
