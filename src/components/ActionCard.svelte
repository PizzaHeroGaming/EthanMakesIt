<script>
  import { gs } from '../lib/state.svelte.js';
  import { COOK_IDS, MAX_MEAL_STOCK } from '../lib/data.js';
  import { clickAction, setActiveCook, getActionDuration } from '../lib/actions.js';

  let { action } = $props();

  const isCook = $derived(COOK_IDS.includes(action.id));
  const timer = $derived(gs.G.actionTimers[action.id]);
  const running = $derived(timer?.running);
  const hasManager = $derived(isCook ? gs.G.activeCookId === action.id : gs.G.managers.includes(action.id));
  const progressPct = $derived(running ? (timer.progress || 0) * 100 : 0);
  const durSec = $derived((getActionDuration(action) / 1000).toFixed(1));
  const colorClass = (() => {
    if (action.color === 'green') return 'color-cook';
    if (action.color === 'blue') return 'color-film';
    if (action.color === 'gold') return 'color-business';
    if (action.color === 'purple') return 'color-special';
    return '';
  })();

  const hasAutoStation = $derived(gs.G.ownedUpgrades.includes('ug_autocook'));
  const stockFull = $derived(gs.G.mealQueue && gs.G.mealQueue.length >= MAX_MEAL_STOCK);

  function onclick() { clickAction(action.id); }
</script>

<div class="action-card {colorClass}" class:has-manager={hasManager} id="ac-{action.id}">
  <div class="action-row" onclick={onclick}
       onkeydown={(e) => { if (e.key === 'Enter') onclick(); }}
       role="button" tabindex="0">
    <div class="action-icon-wrap">{action.icon}</div>
    <div class="action-info">
      <div class="action-name">{action.name}</div>
      <div class="action-desc">{action.desc}</div>
      <div class="action-earn">→ {action.earn}</div>
    </div>
    <div class="action-btn" class:running={running && !hasManager} class:auto={hasManager}>
      <div class="action-btn-label">{running ? (hasManager ? 'AUTO' : 'RUNNING') : 'CLICK'}</div>
      <div class="action-btn-time">{durSec}s</div>
    </div>
  </div>
  <div class="action-progress">
    <div class="action-progress-fill" style="width:{progressPct}%"></div>
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
