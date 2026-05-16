<script>
  import { gs } from '../lib/state.svelte.js';
  import { COOK_IDS, MAX_MEAL_STOCK, ACTION_LEVEL_MILESTONES } from '../lib/data.js';
  import {
    clickAction, setActiveCook, getActionDuration, previewReward,
    getActionLevel, resolveBuyQty, getBuyCost, buyActionLevels,
  } from '../lib/actions.js';
  import { fmt, fmtMoney } from '../lib/helpers.js';

  let { action } = $props();

  const isCook = $derived(COOK_IDS.includes(action.id));
  const timer = $derived(gs.G.actionTimers[action.id]);
  const running = $derived(timer?.running);
  const hasManager = $derived(isCook ? gs.G.activeCookId === action.id : gs.G.managers.includes(action.id));
  const progressPct = $derived(running ? (timer.progress || 0) * 100 : 0);
  const durSec = $derived(getActionDuration(action) / 1000);
  const colorClass = (() => {
    if (action.color === 'green') return 'color-cook';
    if (action.color === 'blue') return 'color-film';
    if (action.color === 'gold') return 'color-business';
    if (action.color === 'purple') return 'color-special';
    return '';
  })();

  const hasAutoStation = $derived(gs.G.ownedUpgrades.includes('ug_autocook'));
  const stockFull = $derived(gs.G.mealQueue && gs.G.mealQueue.length >= MAX_MEAL_STOCK);

  // Level + buy math
  const level = $derived(getActionLevel(action.id));
  const buyQty = $derived(resolveBuyQty(action, gs.buyMode));
  const buyCost = $derived(getBuyCost(action, buyQty));
  const canAfford = $derived(buyQty > 0 && gs.G.money >= buyCost);

  // Next milestone breakpoint
  const nextMilestone = $derived(ACTION_LEVEL_MILESTONES.find((m) => m > level));
  const milestoneProgress = $derived(() => {
    if (!nextMilestone) return 1;
    const prev = [0, ...ACTION_LEVEL_MILESTONES].filter((m) => m <= level).pop() || 0;
    return (level - prev) / (nextMilestone - prev);
  });

  // Live per-cycle reward preview, recalculated whenever multipliers change.
  const preview = $derived(previewReward(action));

  let flash = $state(false);
  let lastProgress = 0;
  $effect(() => {
    const p = timer?.progress ?? 0;
    if (lastProgress > 0.9 && p < 0.1) {
      flash = true;
      setTimeout(() => (flash = false), 550);
    }
    lastProgress = p;
  });

  let bounce = $state(false);
  function onclick() {
    bounce = true;
    setTimeout(() => (bounce = false), 140);
    clickAction(action.id);
  }
  function onbuy(e) {
    e.stopPropagation();
    buyActionLevels(action);
  }
</script>

<div class="action-card {colorClass}" class:has-manager={hasManager} class:flash id="ac-{action.id}">
  <div class="action-row" class:bounce onclick={onclick}
       onkeydown={(e) => { if (e.key === 'Enter') onclick(); }}
       role="button" tabindex="0">
    <div class="action-icon-wrap">
      {action.icon}
      <div class="action-level">Lv {level}</div>
    </div>
    <div class="action-info">
      <div class="action-name">{action.name}</div>
      <div class="action-desc">{action.desc}</div>
      {#if preview}
        <div class="action-earn">
          {#if preview.money > 0}<span class="er er-money">+{fmtMoney(preview.money)}</span>{/if}
          {#if preview.subs > 0}<span class="er er-subs">+{fmt(preview.subs)} subs</span>{/if}
          {#if preview.views > 0}<span class="er er-views">+{fmt(preview.views)} views</span>{/if}
          {#if preview.xp > 0}<span class="er er-xp">+{fmt(preview.xp)} XP</span>{/if}
          {#if preview.hype > 0}<span class="er er-hype">+{Math.round(preview.hype)} hype</span>{/if}
        </div>
      {/if}
    </div>
    <div class="action-btn" class:running={running && !hasManager} class:auto={hasManager}>
      <div class="action-btn-label">{running ? (hasManager ? 'AUTO' : 'RUNNING') : 'CLICK'}</div>
      <div class="action-btn-time">{durSec.toFixed(1)}s</div>
      {#if preview && preview.money > 0}
        <div class="action-btn-rate">{fmtMoney(preview.money / durSec)}/s</div>
      {/if}
    </div>
  </div>
  <div class="action-progress">
    <div class="action-progress-fill" class:near-full={progressPct > 88} style="width:{progressPct}%"></div>
  </div>

  <div class="action-buy-row">
    <button class="buy-btn" class:can={canAfford} disabled={!canAfford} onclick={onbuy}>
      <div class="buy-btn-label">
        BUY {buyQty > 1 ? '×' + buyQty : '×1'}
        {#if nextMilestone}
          <span class="buy-milestone">→ Lv {nextMilestone} = ×2</span>
        {/if}
      </div>
      <div class="buy-btn-cost">{fmtMoney(buyCost)}</div>
    </button>
  </div>

  {#if isCook && hasAutoStation}
    <div class="manager-row">
      <button class="mgr-btn"
              class:mgr-active={gs.G.activeCookId === action.id}
              onclick={(e) => { e.stopPropagation(); setActiveCook(action.id); }}>
        {#if gs.G.activeCookId === action.id}
          {stockFull ? '⏸ Paused — stock full' : '■ Auto-Cook Active — click to stop'}
        {:else}
          ▶ Set as Auto-Cook
        {/if}
      </button>
    </div>
  {:else if isCook}
    <div class="manager-row">
      <span class="mgr-locked-hint">
        {#if gs.G.level < 3}🔒 Automation locked — Requires Level 3
        {:else if gs.G.totalCooks < 25}🔒 Automation locked — Cook {25 - gs.G.totalCooks} more meals
        {:else}🔒 Automation locked — Buy Auto-Cook Station in Upgrades
        {/if}
      </span>
    </div>
  {:else if action.managerCost && gs.G.managers.includes(action.id)}
    <div class="manager-row">
      <span class="mgr-hired">✓ {action.managerName} on duty</span>
    </div>
  {/if}
</div>
