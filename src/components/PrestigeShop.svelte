<script>
  import { gs } from '../lib/state.svelte.js';
  import { PRESTIGE_UPGRADES } from '../lib/data.js';
  import { getPrestigeTier, calcCloutEarned, buyPrestigeUpgrade } from '../lib/prestige.js';
  import { reapplyUpgrades } from '../lib/actions.js';

  const clout = $derived(gs.G.cloutPoints || 0);
  const totalClout = $derived(gs.G.totalCloutEarned || 0);
  const preview = $derived(calcCloutEarned());
  const empty = $derived(gs.G.prestiges === 0 && clout === 0);
  const subsSqrt = $derived(Math.floor(Math.sqrt(gs.G.subs / 300)));
  const prestigeBonus = $derived(Math.floor(gs.G.prestiges * 1.5));
</script>

<div class="prestige-header">
  <div>
    <h3>✦ Prestige Upgrades</h3>
    <div style="font-size:10px;color:#94a0bd;letter-spacing:1.5px;margin-top:2px">PERMANENT ACROSS ALL RUNS</div>
  </div>
  <div class="clout-display">
    <span class="clout-val">{clout} CP</span>
    <span class="clout-label">Clout Points</span>
    <div style="font-size:9px;color:#94a0bd;margin-top:2px">Total earned: {totalClout}</div>
  </div>
</div>

{#if empty}
  <div class="prestige-empty">
    <div class="big">🌟</div>
    <strong style="color:var(--gold-deep)">Prestige upgrades unlock after your first Go Viral.</strong><br>
    Reach 100,000 subscribers and go viral to earn<br>
    <span style="color:var(--gold-deep)">Clout Points</span> — use them here for permanent bonuses that carry over into every future run.<br><br>
    <span style="color:var(--muted)">First viral will earn approximately <strong style="color:var(--gold-deep)">{preview} CP</strong>.</span>
  </div>
{:else}
  <div class="clout-preview">
    Next viral: ~{preview} CP &nbsp;·&nbsp; from subs: {subsSqrt} &nbsp;·&nbsp; prestige bonus: {prestigeBonus} &nbsp;·&nbsp; all-time: {totalClout} CP
  </div>
  <div class="prestige-grid">
    {#each PRESTIGE_UPGRADES as pu (pu.id)}
      {@const tier = getPrestigeTier(pu.id)}
      {@const maxTier = pu.tiers.length - 1}
      {@const isMaxed = tier >= maxTier}
      {@const nextTier = tier + 1}
      {@const nextCost = !isMaxed ? pu.tiers[nextTier].cost : 0}
      {@const canAfford = !isMaxed && clout >= nextCost}
      <div class="pu-card" class:pu-affordable={canAfford} class:pu-maxed={isMaxed}>
        <div class="pu-card-top">
          <div class="pu-icon">{pu.icon}</div>
          <div>
            <div class="pu-name">{pu.name}</div>
            <div class="pu-tier-label">{tier < 0 ? 'LOCKED' : 'TIER ' + (tier + 1) + ' / ' + pu.tiers.length}</div>
          </div>
        </div>
        <div class="pu-desc">{pu.desc}</div>
        <div class="pu-pips">
          {#each pu.tiers as _, i}
            <div class="pu-pip" class:on={i <= tier}></div>
          {/each}
        </div>
        {#if tier >= 0}
          <div class="pu-effect">▶ {pu.tiers[tier].effect}</div>
        {:else}
          <div class="pu-effect" style="color:var(--muted)">Not yet purchased</div>
        {/if}
        {#if isMaxed}
          <button class="pu-btn pu-maxed-btn" disabled>✓ Maxed</button>
        {:else}
          <button class="pu-btn"
                  disabled={!canAfford}
                  onclick={() => buyPrestigeUpgrade(pu.id, reapplyUpgrades)}>
            {canAfford ? '▲ Upgrade' : '🔒'} — {nextCost} CP
          </button>
        {/if}
      </div>
    {/each}
  </div>
{/if}
