<script>
  import { gs } from '../lib/state.svelte.js';
  import { fmt, fmtMoney } from '../lib/helpers.js';
  import { COOK_IDS, ACTIONS } from '../lib/data.js';

  // ── LIVE indicator: true if any action is running ──
  const liveActions = $derived(() => {
    const t = gs.G.actionTimers;
    return Object.keys(t).filter((id) => t[id]?.running);
  });
  const live = $derived(liveActions().length > 0);
  const currentAction = $derived(() => {
    const ids = liveActions();
    if (!ids.length) return null;
    return ACTIONS.find((a) => a.id === ids[0]);
  });

  // ── Mood from hype ──
  const mood = $derived(() => {
    const h = gs.G.hype;
    if (h > 70) return 'hyped';
    if (h > 30) return 'chill';
    return 'flat';
  });

  // ── Stat pulses on increase ──
  let subPulse = $state(false);
  let viewPulse = $state(false);
  let lastSubs = 0;
  let lastViews = 0;
  $effect(() => {
    if (gs.G.subs > lastSubs && lastSubs > 0) {
      subPulse = true; setTimeout(() => (subPulse = false), 350);
    }
    lastSubs = gs.G.subs;
  });
  $effect(() => {
    if (gs.G.views > lastViews && lastViews > 0) {
      viewPulse = true; setTimeout(() => (viewPulse = false), 350);
    }
    lastViews = gs.G.views;
  });

  const subsLabel = $derived(fmt(gs.G.subs));
  const viewsLabel = $derived(fmt(gs.G.views));
  const moneyLabel = $derived(fmtMoney(gs.G.money));
</script>

<div class="creator-card">
  <div class="cc-top">
    <div class="cc-avatar mood-{mood()}">
      <!-- minimal flat Ethan: chef hat + face circle, no scene -->
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- chef hat -->
        <ellipse cx="32" cy="20" rx="14" ry="4" fill="var(--cc-hat)"/>
        <ellipse cx="24" cy="14" rx="7" ry="8" fill="var(--cc-hat)"/>
        <ellipse cx="32" cy="11" rx="8" ry="9" fill="var(--cc-hat)"/>
        <ellipse cx="40" cy="14" rx="7" ry="8" fill="var(--cc-hat)"/>
        <rect x="18" y="19" width="28" height="6" fill="var(--cc-hat-band)" rx="2"/>
        <!-- face -->
        <circle cx="32" cy="38" r="15" fill="var(--cc-skin)"/>
        <!-- eyes -->
        <circle cx="26" cy="37" r="2" fill="#1a1a24"/>
        <circle cx="38" cy="37" r="2" fill="#1a1a24"/>
        <circle cx="26.5" cy="36.3" r="0.7" fill="#fff"/>
        <circle cx="38.5" cy="36.3" r="0.7" fill="#fff"/>
        <!-- mouth — changes with mood -->
        {#if mood() === 'hyped'}
          <path d="M24 44 Q32 51 40 44" stroke="#1a1a24" stroke-width="2" fill="none" stroke-linecap="round"/>
        {:else if mood() === 'chill'}
          <path d="M26 45 Q32 48 38 45" stroke="#1a1a24" stroke-width="2" fill="none" stroke-linecap="round"/>
        {:else}
          <line x1="27" y1="46" x2="37" y2="46" stroke="#1a1a24" stroke-width="2" stroke-linecap="round"/>
        {/if}
        <!-- cheek blush -->
        <circle cx="22" cy="43" r="2" fill="#ff8a8a" opacity={mood() === 'hyped' ? 0.55 : 0.3}/>
        <circle cx="42" cy="43" r="2" fill="#ff8a8a" opacity={mood() === 'hyped' ? 0.55 : 0.3}/>
      </svg>
    </div>

    <div class="cc-id">
      <div class="cc-handle">@ethanmakesit</div>
      <div class="cc-channel-title">Ethan Makes It</div>
      {#if live}
        <div class="cc-live">
          <span class="cc-live-dot"></span>
          {currentAction() ? currentAction().name : 'LIVE'}
        </div>
      {:else}
        <div class="cc-offline">offline</div>
      {/if}
    </div>
  </div>

  <div class="cc-tiles">
    <div class="cc-tile">
      <div class="cc-tile-label">Subscribers</div>
      <div class="cc-tile-val red" class:pop={subPulse}>{subsLabel}</div>
    </div>
    <div class="cc-tile">
      <div class="cc-tile-label">Views</div>
      <div class="cc-tile-val blue" class:pop={viewPulse}>{viewsLabel}</div>
    </div>
    <div class="cc-tile">
      <div class="cc-tile-label">Bank</div>
      <div class="cc-tile-val gold">{moneyLabel}</div>
    </div>
  </div>

  <div class="cc-hype-row">
    <span class="cc-hype-label">Hype</span>
    <div class="cc-hype-track"><div class="cc-hype-fill" style="width:{Math.floor(gs.G.hype)}%"></div></div>
    <span class="cc-hype-val">{Math.floor(gs.G.hype)}%</span>
  </div>
</div>
