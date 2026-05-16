<script>
  import { gs } from '../lib/state.svelte.js';
  import { fmt, fmtMoney } from '../lib/helpers.js';
  import { TICKERS } from '../lib/data.js';
  import { calcCloutEarned, getViralThreshold, showPrestigeConfirm } from '../lib/prestige.js';
  import { doReset } from '../lib/save.js';
  import Scene from './Scene.svelte';

  const tickerText = $derived(TICKERS[gs.tickIdx]);
  const viralThreshold = $derived(getViralThreshold());
  const cloutPreviewVisible = $derived(gs.G.subs >= viralThreshold * 0.4);
  const cloutPreview = $derived(calcCloutEarned());
  const viralReady = $derived(gs.G.subs >= viralThreshold);
</script>

<div id="sidebar">
  <Scene />

  <div class="panel">
    <div class="panel-title">Ethan's Stats</div>
    <div class="stat-row"><span class="skey">Money</span><span class="sval gold">{fmtMoney(gs.G.money)}</span></div>
    <div class="stat-row"><span class="skey">Subscribers</span><span class="sval blue">{fmt(gs.G.subs)}</span></div>
    <div class="stat-row"><span class="skey">Total Views</span><span class="sval green">{fmt(gs.G.views)}</span></div>
    <div class="stat-row"><span class="skey">Skill Level</span><span class="sval purple">{gs.G.level}</span></div>
    <div class="stat-row"><span class="skey">Prestiges</span><span class="sval">{gs.G.prestiges}</span></div>
    <div class="stat-row"><span class="skey">Income/s</span><span class="sval gold">${gs.smoothedIncome.toFixed(2)}</span></div>
  </div>

  <div class="panel">
    <div class="panel-title">Progress</div>
    <div class="bar-row">
      <div class="bar-label-row"><span>Skill XP</span><span>{fmt(gs.G.xp)}/{fmt(gs.G.xpNeeded)}</span></div>
      <div class="bar-track"><div class="bar-fill xp" style="width:{Math.min(100, (gs.G.xp / gs.G.xpNeeded) * 100)}%"></div></div>
    </div>
    <div class="bar-row">
      <div class="bar-label-row"><span>Hype</span><span>{Math.floor(gs.G.hype)}%</span></div>
      <div class="bar-track"><div class="bar-fill hype" style="width:{Math.floor(gs.G.hype)}%"></div></div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-title">Multipliers</div>
    <div class="stat-row"><span class="skey">Cook XP</span><span class="sval">x{gs.G.mx.xp.toFixed(1)}</span></div>
    <div class="stat-row"><span class="skey">Sub Gain</span><span class="sval">x{gs.G.mx.sub.toFixed(1)}</span></div>
    <div class="stat-row"><span class="skey">View Gain</span><span class="sval">x{gs.G.mx.view.toFixed(1)}</span></div>
    <div class="stat-row"><span class="skey">Speed</span><span class="sval">x{gs.G.mx.speed.toFixed(1)}</span></div>
  </div>

  <div class="viral-card">
    <h3>GO VIRAL</h3>
    <p>
      {#if viralReady}★ Ready to Go Viral! You've earned it.
      {:else}Reach {fmt(viralThreshold)} subscribers to go viral. Currently: {fmt(gs.G.subs)} / {fmt(viralThreshold)}
      {/if}
    </p>
    <button class="viral-btn" disabled={!viralReady} onclick={showPrestigeConfirm}>✦ GO VIRAL ✦</button>
    {#if cloutPreviewVisible}
      <div class="clout-preview" style="margin-top:10px;background:rgba(245,200,66,0.18);border-color:#e5a800;color:#ffe39d">
        Going viral now: ~{cloutPreview} CP
      </div>
    {/if}
  </div>

  <div class="save-info">
    💾 autosaves every 15s ·
    {#if gs.sidebarResetConfirmOpen}
      <span>wipe progress?</span>
      <button class="link" onclick={doReset}>yes, reset</button>
      <button class="link" onclick={() => (gs.sidebarResetConfirmOpen = false)}>cancel</button>
    {:else}
      <button class="link" onclick={() => (gs.sidebarResetConfirmOpen = true)}>reset</button>
    {/if}
  </div>
  <div class="ticker">{tickerText}</div>
</div>
