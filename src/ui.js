// Notifications, tab switching, menu overlay, tutorial.

import { state } from './state.js';
import { saveGame } from './save.js';
import {
  updateMenuStats, renderUpgrades, renderMilestones, renderStaffTab, renderPrestigeShop,
} from './render.js';
import { renderStall } from './stall.js';
import { isMuted } from './audio.js';

export function notify(msg, cls = '') {
  const c = document.getElementById('notif-container');
  if (!c) return;
  const d = document.createElement('div');
  d.className = 'notif' + (cls ? ' ' + cls : '');
  d.textContent = msg;
  c.appendChild(d);
  setTimeout(() => d.remove(), 3200);
}

// Log tab was removed; keep no-op so call sites stay identical.
export function addLog() {}

export function switchTab(tab) {
  state.currentTab = tab;
  const ids = ['actions', 'stall', 'upgrades', 'milestones', 'staff', 'prestige'];
  ids.forEach((t) => {
    const el = document.getElementById('tab-' + t);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', ids[i] === tab);
  });
  if (tab === 'upgrades') renderUpgrades();
  if (tab === 'milestones') renderMilestones();
  if (tab === 'stall') renderStall();
  if (tab === 'staff') renderStaffTab();
  if (tab === 'prestige') renderPrestigeShop();
}

export function openMenu() {
  updateMenuStats();
  document.getElementById('menu-overlay').classList.add('open');
  document.getElementById('menu-reset-confirm').style.display = 'none';
  const btn = document.getElementById('mute-btn');
  if (btn) btn.textContent = isMuted() ? '🔇 Sounds Off' : '🔊 Sounds On';
}

export function closeMenu() {
  document.getElementById('menu-overlay').classList.remove('open');
}

export function handleMenuOverlayClick(e) {
  if (e.target === document.getElementById('menu-overlay')) closeMenu();
}

export function menuSave() {
  saveGame();
  const el = document.getElementById('menu-save-time');
  if (el) el.textContent = 'Saved at ' + new Date().toLocaleTimeString();
}

export function showMenuReset() {
  document.getElementById('menu-reset-confirm').style.display = 'block';
}

export function hideMenuReset() {
  document.getElementById('menu-reset-confirm').style.display = 'none';
}

export function showResetConfirm() {
  document.getElementById('reset-confirm').style.display = 'block';
}

export function hideResetConfirm() {
  document.getElementById('reset-confirm').style.display = 'none';
}

// ── Tutorial ──
const TUT_STEPS = 4;

export function buildTutDots() {
  const el = document.getElementById('tut-dots');
  if (!el) return;
  el.innerHTML = Array.from(
    { length: TUT_STEPS },
    (_, i) => `<div class="tut-dot${i === 0 ? ' active' : ''}"></div>`,
  ).join('');
}

export function tutNext() {
  const steps = document.querySelectorAll('.tut-step');
  const dots = document.querySelectorAll('.tut-dot');
  steps[state.tutStep].classList.remove('active');
  dots[state.tutStep].classList.remove('active');
  state.tutStep++;
  if (state.tutStep >= TUT_STEPS) {
    closeTutorial();
    return;
  }
  steps[state.tutStep].classList.add('active');
  dots[state.tutStep].classList.add('active');
  const btn = document.getElementById('tut-next-btn');
  if (btn) btn.textContent = state.tutStep === TUT_STEPS - 1 ? 'Start Cooking! →' : 'Next →';
}

export function closeTutorial() {
  document.getElementById('tutorial-overlay').style.display = 'none';
  try { localStorage.setItem('ethanTutDone', '1'); } catch (e) {}
}
