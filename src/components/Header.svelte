<script>
  import { gs } from '../lib/state.svelte.js';
  import { fmtMoney, fmt } from '../lib/helpers.js';
  import { getTitle } from '../lib/actions.js';

  let { onmenu } = $props();

  // Pulse class toggles briefly when gs.pulses[key] updates.
  let moneyPulse = $state(false);
  let subsPulse = $state(false);
  let viewsPulse = $state(false);
  $effect(() => {
    if (gs.pulses.money) {
      moneyPulse = true;
      setTimeout(() => (moneyPulse = false), 180);
    }
  });
  $effect(() => {
    if (gs.pulses.subs) {
      subsPulse = true;
      setTimeout(() => (subsPulse = false), 180);
    }
  });
  $effect(() => {
    if (gs.pulses.views) {
      viewsPulse = true;
      setTimeout(() => (viewsPulse = false), 180);
    }
  });

  function toggleTheme() {
    gs.theme = gs.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('ethanTheme', gs.theme); } catch (e) {}
    document.documentElement.setAttribute('data-theme', gs.theme);
  }
</script>

<div id="header">
  <div>
    <h1>ETHAN MAKES IT</h1>
    <div id="header-sub">FOODTUBE IDLE RPG</div>
    <div id="title-rank">{getTitle()}</div>
  </div>
  <div id="header-stats">
    <div class="hstat">
      <div class="hstat-val" class:pulse={moneyPulse}>{fmtMoney(gs.G.money)}</div>
      <div class="hstat-label">Money</div>
    </div>
    <div class="hstat">
      <div class="hstat-val blue" class:pulse={subsPulse}>{fmt(gs.G.subs)}</div>
      <div class="hstat-label">Subscribers</div>
    </div>
    <div class="hstat">
      <div class="hstat-val green" class:pulse={viewsPulse}>{fmt(gs.G.views)}</div>
      <div class="hstat-label">Views</div>
    </div>
  </div>
  <div style="display:flex;gap:8px;align-items:center">
    <button id="menu-btn" onclick={toggleTheme} title="Toggle theme">
      {gs.theme === 'dark' ? '☀' : '☾'}
    </button>
    <button id="menu-btn" onclick={onmenu}>☰</button>
  </div>
</div>
