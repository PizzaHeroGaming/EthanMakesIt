// All DOM rendering: action cards, upgrade/milestone/staff lists, prestige shop,
// header/sidebar stats, menu overlay stats, scene animations.

import { state } from './state.js';
import {
  ACTIONS, UPGRADES_DEF, MILESTONES_DEF, PRESTIGE_UPGRADES,
  COOK_IDS, MAX_MEAL_STOCK, MANAGER_META,
} from './data.js';
import {
  getPrestigeTier, getViralThreshold, calcCloutEarned,
} from './prestige.js';
import {
  isActionUnlocked, isUpgradeUnlocked, getActionDuration,
} from './actions.js';
import { stallUnlocked } from './stall.js';

export function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n;
}

export function fmtMoney(n) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}

export function renderActions() {
  const el = document.getElementById('action-list');
  if (!el) return;

  const unlockedCooks = ACTIONS.filter((a) => COOK_IDS.includes(a.id) && isActionUnlocked(a));
  const unlockedContent = ACTIONS.filter((a) => !COOK_IDS.includes(a.id) && isActionUnlocked(a));

  const activeName = state.G.activeCookId
    ? ACTIONS.find((a) => a.id === state.G.activeCookId)?.name
    : null;
  const autoLabel = activeName ? `<span class="auto-cook-indicator">⚙ ${activeName}</span>` : '';

  let kitchenHtml = '';
  unlockedCooks.forEach((a) => {
    kitchenHtml += buildActionCard(a, false);
  });

  let contentHtml = '';
  unlockedContent.forEach((a) => {
    contentHtml += buildActionCard(a, false);
  });

  el.innerHTML = `<div class="actions-columns">
    <div class="actions-col" id="kitchen-col">
      <div class="action-section-title"><span>🍳</span> Kitchen ${autoLabel}</div>
      ${kitchenHtml}
    </div>
    <div class="actions-col" id="content-col">
      <div class="action-section-title"><span>📱</span> Content &amp; Business</div>
      ${contentHtml}
    </div>
  </div>`;

  [...unlockedCooks, ...unlockedContent].forEach((a) => {
    if (state.G.actionTimers[a.id]?.running) updateRunningState(a.id, true);
  });
}

export function buildActionCard(a, isLocked) {
  const G = state.G;
  const running = G.actionTimers[a.id] && G.actionTimers[a.id].running;
  const hasManager = COOK_IDS.includes(a.id) ? G.activeCookId === a.id : G.managers.includes(a.id);
  const duration = getActionDuration(a);
  const durSec = (duration / 1000).toFixed(1) + 's';
  const color = a.color || 'green';

  let lockReason = '';
  if (isLocked) {
    const u = a.unlockAt;
    const parts = [];
    if (u.level) parts.push('Level ' + u.level);
    if (u.subs) parts.push(fmt(u.subs) + ' subs');
    if (u.money) parts.push('$' + u.money + ' money');
    if (u.totalCooks) parts.push(u.totalCooks + ' cooks');
    if (u.totalFilmed) parts.push(u.totalFilmed + ' videos');
    if (u.totalEdits) parts.push(u.totalEdits + ' edits');
    lockReason = 'Requires: ' + parts.join(' + ');
  }

  const isCookAction = COOK_IDS.includes(a.id);
  let mgrSection = '';
  if (!isLocked && isCookAction) {
    const hasAutoStation = G.ownedUpgrades.includes('ug_autocook');
    if (hasAutoStation) {
      const isActive = G.activeCookId === a.id;
      const stockFull = G.mealQueue && G.mealQueue.length >= MAX_MEAL_STOCK;
      mgrSection = `<div class="manager-row">
        <button class="mgr-btn${isActive ? ' mgr-active' : ''}" onclick="event.stopPropagation();setActiveCook('${a.id}')">
          ${isActive ? (stockFull ? '⏸ Paused — stock full' : '■ Auto-Cook Active — click to stop') : '▶ Set as Auto-Cook'}
        </button>
      </div>`;
    } else {
      const meetsLevel = G.level >= 3;
      const meetsCooks = G.totalCooks >= 25;
      const reason = !meetsLevel
        ? 'Requires Level 3'
        : !meetsCooks
          ? `Cook ${25 - G.totalCooks} more meals`
          : 'Buy Auto-Cook Station in Upgrades';
      mgrSection = `<div class="manager-row"><span class="mgr-locked-hint">🔒 Automation locked — ${reason}</span></div>`;
    }
  }
  if (!isLocked && !isCookAction && a.managerCost && G.managers.includes(a.id)) {
    mgrSection = `<div class="manager-row"><span class="mgr-hired">✓ ${a.managerName} on duty</span></div>`;
  }

  return `<div class="action-card${isLocked ? ' locked' : ''}" id="ac-${a.id}">
    <div class="${hasManager ? 'has-manager' : ''}">
      <div class="manager-dot"></div>
      <div class="action-top" onclick="${isLocked ? '' : "clickAction('" + a.id + "')"}" >
        <div class="action-icon">${a.icon}</div>
        <div class="action-info">
          <div class="action-name">${a.name}</div>
          <div class="action-desc">${isLocked ? lockReason : a.desc}</div>
          <div class="action-earn">${isLocked ? '' : '→ ' + a.earn}</div>
        </div>
        <div class="action-btn-area${running ? ' running' : ''}" id="abtn-${a.id}">
          <div class="action-btn-label">${running ? (hasManager ? 'AUTO' : 'RUNNING') : 'CLICK'}</div>
          <div class="action-btn-time">${durSec}</div>
        </div>
      </div>
      <div class="action-progress">
        <div class="action-progress-fill ${color}" id="ap-${a.id}" style="width:${running ? G.actionTimers[a.id].progress * 100 + '%' : '0%'}"></div>
      </div>
    </div>
    ${mgrSection}
    ${isLocked ? '<div class="lock-overlay">🔒 ' + lockReason + '</div>' : ''}
  </div>`;
}

export function renderActionCard(id) {
  const a = ACTIONS.find((x) => x.id === id);
  if (!a) return;
  const st = state.G.actionTimers[id];
  const running = st && st.running;
  const hasManager = state.G.managers.includes(id);
  const btn = document.getElementById('abtn-' + id);
  if (btn) {
    btn.className = 'action-btn-area' + (running ? ' running' : hasManager ? ' running' : '');
    btn.querySelector('.action-btn-label').textContent = running
      ? hasManager ? 'AUTO' : 'RUNNING'
      : 'CLICK';
    btn.querySelector('.action-btn-time').textContent = (getActionDuration(a) / 1000).toFixed(1) + 's';
  }
}

export function updateRunningState(id, running) {
  const btn = document.getElementById('abtn-' + id);
  if (btn) {
    btn.className = 'action-btn-area' + (running ? ' running' : '');
    btn.querySelector('.action-btn-label').textContent = running ? 'RUNNING' : 'CLICK';
  }
}

export function renderUpgrades() {
  const el = document.getElementById('upgrade-list');
  if (!el) return;
  const G = state.G;
  el.innerHTML = UPGRADES_DEF.map((u) => {
    const owned = G.ownedUpgrades.includes(u.id);
    const unlocked = isUpgradeUnlocked(u);
    const affordable = !owned && unlocked && G.money >= u.cost;
    let cls = 'upgrade-card';
    if (owned) cls += ' owned';
    else if (!unlocked) cls += ' locked-u';
    else if (affordable) cls += ' affordable';

    let costDisplay;
    if (owned) costDisplay = '✓ OWNED';
    else if (!unlocked) {
      const r = u.unlockAt;
      const parts = [];
      if (r.level && G.level < r.level) parts.push('Lv' + r.level);
      if (r.subs && G.subs < r.subs) parts.push(fmt(r.subs) + ' subs');
      if (r.totalEdits && G.totalEdits < r.totalEdits) parts.push(r.totalEdits + ' edits');
      if (r.totalFilmed && G.totalFilmed < r.totalFilmed) parts.push(r.totalFilmed + ' vids');
      costDisplay = '🔒 ' + parts.join(', ');
    } else costDisplay = fmtMoney(u.cost);

    return `<div id="ugcard-${u.id}" class="${cls}" onclick="buyUpgrade('${u.id}')">
      <div class="upgrade-icon">${u.icon}</div>
      <div class="upgrade-info">
        <div class="upgrade-name">${u.name}</div>
        <div class="upgrade-desc">${u.desc}</div>
      </div>
      <div class="upgrade-cost">${costDisplay}</div>
    </div>`;
  }).join('');
}

export function renderMilestones() {
  const el = document.getElementById('milestone-list');
  if (!el) return;
  el.innerHTML = MILESTONES_DEF.map((m) => {
    const done = state.G.doneMilestones.includes(m.id);
    return `<div class="milestone-item${done ? ' done' : ''}">
      <div class="ms-check">${done ? '✓' : ''}</div>
      <div class="ms-label">${m.name}</div>
      <div class="ms-reward">${m.reward}</div>
    </div>`;
  }).join('');
}

export function renderStaffTab() {
  const el = document.getElementById('staff-wrap');
  if (!el) return;
  const G = state.G;

  const disc = getPrestigeTier('pu_manager_disc');
  const discMult = disc >= 0 ? Math.pow(0.8, disc + 1) : 1;

  const managerActions = ACTIONS.filter((a) => a.managerCost && !COOK_IDS.includes(a.id));

  let html = `<div style="font-size:10px;color:var(--muted);margin-bottom:10px;line-height:1.6;border-left:2px solid var(--border2);padding-left:8px;">
    Hire staff to automate Content &amp; Business actions forever.<br>
    Staff unlock when their action unlocks. Auto-Cook is managed from the Actions tab.
  </div><div class="staff-grid">`;

  managerActions.forEach((a) => {
    const meta = MANAGER_META[a.id] || { animClass: 'anim-pulse', animIcon: '🧑', role: 'Handles this action' };
    const isHired = G.managers.includes(a.id);
    const unlocked = isActionUnlocked(a);
    const cost = Math.floor(a.managerCost * discMult);
    const canAfford = G.money >= cost;

    let cls = 'staff-card';
    if (isHired) cls += ' hired';
    else if (!unlocked) cls += ' locked-staff';
    else if (canAfford) cls += ' affordable';

    let lockReason = '';
    if (!unlocked) {
      const u = a.unlockAt;
      const parts = [];
      if (u.level && G.level < u.level) parts.push('Level ' + u.level);
      if (u.subs && G.subs < u.subs) parts.push(fmt(u.subs) + ' subs');
      if (u.totalCooks && G.totalCooks < u.totalCooks) parts.push(u.totalCooks + ' cooks');
      if (u.totalFilmed && G.totalFilmed < u.totalFilmed) parts.push(u.totalFilmed + ' videos');
      if (u.totalEdits && G.totalEdits < u.totalEdits) parts.push(u.totalEdits + ' edits');
      lockReason = 'Unlock: ' + parts.join(' + ');
    }

    const footer = isHired
      ? `<div class="staff-hired-badge"><div class="staff-hired-dot"></div>On duty — auto-running</div>`
      : unlocked
        ? `<span class="staff-cost${canAfford ? ' can' : ''}">${fmtMoney(cost)}</span>
           <button class="staff-hire-btn" onclick="buyManager('${a.id}')" ${canAfford ? '' : 'disabled'}>
             Hire
           </button>`
        : `<span class="staff-lock-reason">${lockReason}</span>`;

    html += `<div class="staff-card ${cls}" id="staff-card-${a.id}">
      <div class="staff-card-top">
        <div class="staff-anim-icon ${meta.animClass}">
          <span class="icon-inner">${meta.animIcon}</span>
        </div>
        <div class="staff-card-info">
          <div class="staff-card-name">${a.managerName}</div>
          <div class="staff-card-role">${meta.role}</div>
        </div>
      </div>
      <div class="staff-card-desc">Automates <strong style="color:var(--text)">${a.name}</strong> — ${a.desc}</div>
      <div class="staff-card-footer">${footer}</div>
    </div>`;
  });

  html += '</div>';
  el.innerHTML = html;
}

export function updateStaffButtons() {
  const G = state.G;
  const disc = getPrestigeTier('pu_manager_disc');
  const discMult = disc >= 0 ? Math.pow(0.8, disc + 1) : 1;
  ACTIONS.filter((a) => a.managerCost && !COOK_IDS.includes(a.id)).forEach((a) => {
    const card = document.getElementById('staff-card-' + a.id);
    if (!card) return;
    const isHired = G.managers.includes(a.id);
    const unlocked = isActionUnlocked(a);
    const cost = Math.floor(a.managerCost * discMult);
    const canAfford = G.money >= cost;
    card.className = 'staff-card' + (isHired ? ' hired' : !unlocked ? ' locked-staff' : canAfford ? ' affordable' : '');
    const btn = card.querySelector('.staff-hire-btn');
    if (btn) btn.disabled = !canAfford;
    const costEl = card.querySelector('.staff-cost');
    if (costEl) costEl.className = 'staff-cost' + (canAfford ? ' can' : '');
  });
}

export function renderPrestigeShop() {
  const el = document.getElementById('prestige-shop-wrap');
  if (!el) return;
  const G = state.G;

  const clout = G.cloutPoints || 0;
  const totalClout = G.totalCloutEarned || 0;
  const preview = calcCloutEarned();

  let html = `<div class="prestige-header">
    <div>
      <h3>✦ Prestige Upgrades</h3>
      <div style="font-size:9px;color:var(--muted);letter-spacing:1px;margin-top:2px">PERMANENT ACROSS ALL RUNS</div>
    </div>
    <div class="clout-display">
      <span class="clout-val" id="prestige-clout-val">${clout} CP</span>
      <span class="clout-label">Clout Points</span>
      <div style="font-size:8px;color:var(--muted);margin-top:2px">Total earned: ${totalClout}</div>
    </div>
  </div>`;

  if (G.prestiges === 0 && clout === 0) {
    html += `<div class="prestige-empty">
      <div class="big">🌟</div>
      <strong style="color:var(--gold)">Prestige upgrades unlock after your first Go Viral.</strong><br>
      Reach 100,000 subscribers and go viral to earn<br>
      <span style="color:var(--gold)">Clout Points</span> — use them here for permanent bonuses<br>
      that carry over into every future run.<br><br>
      <span style="color:var(--muted)">First viral will earn approximately <strong style="color:var(--gold)">${preview} CP</strong>.</span>
    </div>`;
  } else {
    const subsSqrt = Math.floor(Math.sqrt(G.subs / 300));
    const prestigeBonus = Math.floor(G.prestiges * 1.5);
    html += `<div class="clout-preview" id="prestige-next-viral">Next viral: ~${preview} CP &nbsp;·&nbsp; from subs: ${subsSqrt} &nbsp;·&nbsp; prestige bonus: ${prestigeBonus} &nbsp;·&nbsp; all-time: ${totalClout} CP</div>`;
    html += `<div class="prestige-grid" style="margin-top:10px">`;

    PRESTIGE_UPGRADES.forEach((pu) => {
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
        : `<button class="pu-btn" onclick="event.stopPropagation();buyPrestigeUpgrade('${pu.id}')" ${canAfford ? '' : 'disabled'}>
            ${canAfford ? '▲ Upgrade' : '🔒'} — ${nextCost} CP
          </button>`;

      html += `<div class="${cls}">
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
    });

    html += `</div>`;
  }

  el.innerHTML = html;

  const cpEl = document.getElementById('clout-preview');
  if (cpEl) {
    cpEl.style.display = G.subs >= 50000 ? 'block' : 'none';
    cpEl.textContent = 'Going viral now earns ~' + preview + ' Clout Points';
  }
}

export function renderAll() {
  renderActions();
  renderUpgrades();
  renderMilestones();
  renderPrestigeShop();
  if (state.currentTab === 'staff') renderStaffTab();
}

export function updateUpgradeGlow() {
  const G = state.G;
  UPGRADES_DEF.forEach((u) => {
    const card = document.getElementById('ugcard-' + u.id);
    if (!card) return;
    const owned = G.ownedUpgrades.includes(u.id);
    const unlocked = isUpgradeUnlocked(u);
    const affordable = !owned && unlocked && G.money >= u.cost;
    card.className = 'upgrade-card' + (owned ? ' owned' : !unlocked ? ' locked-u' : affordable ? ' affordable' : '');
    const costEl = card.querySelector('.upgrade-cost');
    if (!costEl) return;
    if (owned) costEl.textContent = '✓ OWNED';
    else if (!unlocked) {
      const r = u.unlockAt;
      const parts = [];
      if (r.level && G.level < r.level) parts.push('Lv' + r.level);
      if (r.subs && G.subs < r.subs) parts.push(fmt(r.subs) + ' subs');
      if (r.totalEdits && G.totalEdits < r.totalEdits) parts.push(r.totalEdits + ' edits');
      if (r.totalFilmed && G.totalFilmed < r.totalFilmed) parts.push(r.totalFilmed + ' vids');
      if (r.totalCooks && G.totalCooks < r.totalCooks) parts.push(r.totalCooks + ' cooks');
      costEl.textContent = '🔒 ' + (parts.join(', ') || 'locked');
    } else costEl.textContent = fmtMoney(u.cost);
  });
}

export function updatePrestigePreview() {
  const cloutEl = document.getElementById('prestige-clout-val');
  const previewEl = document.getElementById('prestige-next-viral');
  if (cloutEl) cloutEl.textContent = (state.G.cloutPoints || 0) + ' CP';
  if (previewEl)
    previewEl.textContent =
      'Next viral: ~' + calcCloutEarned() + ' CP · Total: ' + (state.G.totalCloutEarned || 0) + ' CP';
  updateUpgradeGlow();
}

export function updateTabBadges() {
  const G = state.G;
  const stallBadge = document.getElementById('badge-stall');
  if (stallBadge) {
    const hasCustomers = state.stallCustomers.length > 0 && stallUnlocked();
    stallBadge.classList.toggle('active', hasCustomers);
  }

  const upgBadge = document.getElementById('badge-upgrades');
  if (upgBadge) {
    const hasAffordable = UPGRADES_DEF.some(
      (u) => !G.ownedUpgrades.includes(u.id) && isUpgradeUnlocked(u) && G.money >= u.cost,
    );
    upgBadge.classList.toggle('active', hasAffordable);
  }

  const staffBadge = document.getElementById('badge-staff');
  if (staffBadge) {
    const disc = getPrestigeTier('pu_manager_disc');
    const discMult = disc >= 0 ? Math.pow(0.8, disc + 1) : 1;
    const hasAffordable = ACTIONS.some(
      (a) =>
        a.managerCost &&
        !COOK_IDS.includes(a.id) &&
        !G.managers.includes(a.id) &&
        isActionUnlocked(a) &&
        G.money >= Math.floor(a.managerCost * discMult),
    );
    staffBadge.classList.toggle('active', hasAffordable);
  }
}

export function updateStats() {
  const G = state.G;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('h-money', fmtMoney(G.money));
  set('h-subs', fmt(G.subs));
  set('h-views', fmt(G.views));
  set('st-money', fmtMoney(G.money));
  set('st-subs', fmt(G.subs));
  set('st-views', fmt(G.views));
  set('st-level', G.level);
  set('st-prestiges', G.prestiges);
  set('xp-label', fmt(G.xp) + '/' + fmt(G.xpNeeded));
  const xpBar = document.getElementById('xp-bar');
  if (xpBar) xpBar.style.width = Math.min(100, (G.xp / G.xpNeeded) * 100) + '%';
  set('hype-label', Math.floor(G.hype) + '%');
  const hypeBar = document.getElementById('hype-bar');
  if (hypeBar) hypeBar.style.width = Math.floor(G.hype) + '%';
  set('mx-xp', 'x' + G.mx.xp.toFixed(1));
  set('mx-sub', 'x' + G.mx.sub.toFixed(1));
  set('mx-view', 'x' + G.mx.view.toFixed(1));
  set('mx-speed', 'x' + G.mx.speed.toFixed(1));
  set('sc-subs', fmt(G.subs));
  set('sc-views', fmt(G.views));
  set('st-income', '$' + state.smoothedIncome.toFixed(2) + '/s');
  const viralBtn = document.getElementById('go-viral-btn');
  if (viralBtn) viralBtn.disabled = G.subs < getViralThreshold();
  const vt = getViralThreshold();
  const prestigeDesc = document.getElementById('prestige-desc');
  if (prestigeDesc) {
    prestigeDesc.textContent =
      G.subs >= vt
        ? "★ Ready to Go Viral! You've earned it."
        : 'Reach ' + fmt(vt) + ' subscribers to go viral. Currently: ' + fmt(G.subs) + ' / ' + fmt(vt);
  }
  if (state.currentTab === 'upgrades') renderUpgrades();
}

export function updateMenuStats() {
  const G = state.G;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('ms-money', fmtMoney(G.money));
  set('ms-level', G.level);
  set('ms-subs', fmt(G.subs));
  set('ms-views', fmt(G.views));
  set('ms-hype', Math.floor(G.hype) + '%');
  set('ms-income', '$' + state.smoothedIncome.toFixed(2) + '/s');
  set('ms-cooks', G.totalCooks);
  set('ms-served', G.totalMealsServed);
  set('ms-stock', G.mealStock);
  set('ms-stall', fmtMoney(state.stallTotalEarned));
  set('ms-spoiled', G.mealsSpoiled || 0);
  set('ms-filmed', G.totalFilmed);
  set('ms-edits', G.totalEdits);
  set('ms-prestiges', G.prestiges);
  set('ms-managers', G.managers.length + ' / ' + ACTIONS.filter((a) => a.managerCost).length);
  set('ms-mx-xp', 'x' + G.mx.xp.toFixed(2));
  set('ms-mx-sub', 'x' + G.mx.sub.toFixed(2));
  set('ms-mx-view', 'x' + G.mx.view.toFixed(2));
  set('ms-mx-speed', 'x' + G.mx.speed.toFixed(2));
  set('ms-mx-money', 'x' + G.mx.money.toFixed(2));
  set('ms-clout', (G.cloutPoints || 0) + ' CP (total: ' + (G.totalCloutEarned || 0) + ')');
}

// ── Scene SVG animations ──
export function animSteam() {
  const s = document.getElementById('sc-steam');
  if (!s) return;
  s.setAttribute('opacity', '1');
  setTimeout(() => s.setAttribute('opacity', '0'), 2200);
}

export function animBurner() {
  const b1 = document.getElementById('sc-b1');
  const b2 = document.getElementById('sc-b2');
  if (!b1 || !b2) return;
  b1.setAttribute('fill', '#f60');
  b2.setAttribute('fill', '#fa0');
  setTimeout(() => {
    b1.setAttribute('fill', '#1e1e2e');
    b2.setAttribute('fill', '#1e1e2e');
  }, 1500);
}

export function animRec() {
  const r = document.getElementById('sc-rec');
  if (!r) return;
  let on = true;
  let n = 0;
  const iv = setInterval(() => {
    r.setAttribute('opacity', on ? '1' : '0');
    on = !on;
    if (++n > 7) {
      clearInterval(iv);
      r.setAttribute('opacity', '0');
    }
  }, 300);
}
