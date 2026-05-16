<script>
  import { gs } from '../lib/state.svelte.js';
  import { PRESTIGE_UPGRADES } from '../lib/data.js';
  import {
    getPrestigeTier, buyPrestigeUpgradeModal, cancelPrestigeModal, confirmPrestige,
  } from '../lib/prestige.js';
  import { scheduleNextSpawn } from '../lib/stall.js';
  import { reapplyUpgrades, checkUnlocks } from '../lib/actions.js';

  function doConfirm() {
    confirmPrestige(scheduleNextSpawn);
    reapplyUpgrades();
    checkUnlocks();
  }
</script>

{#if gs.prestigeModalOpen}
  <div class="modal-backdrop">
    <div id="prestige-modal-panel">
      <div class="pmod-header">
        <div>
          <div class="pmod-title">★ WENT VIRAL!</div>
          <div class="pmod-sub">SPEND YOUR CLOUT POINTS BEFORE THE NEW RUN STARTS</div>
        </div>
        <div style="text-align:right">
          <div class="pmod-cp-earned">This run: +{gs._pmodCloutEarned} CP · Previously: {gs._pmodCloutSnapshot} CP</div>
          <div class="pmod-cp-total">{gs.G.cloutPoints} CP</div>
          <div class="pmod-cp-label">Clout Points Available</div>
        </div>
      </div>
      <div class="pmod-body">
        <div class="pmod-notice">
          <strong>Spend now or save for later.</strong> Any unspent CP carries into the next prestige. Purchased upgrades are <strong>permanent</strong> and take effect immediately in the new run. You can cancel to keep playing this run — your CP has already been added.
        </div>
        <div class="pmod-grid">
          {#each PRESTIGE_UPGRADES as pu (pu.id)}
            {@const tier = getPrestigeTier(pu.id)}
            {@const maxTier = pu.tiers.length - 1}
            {@const isMaxed = tier >= maxTier}
            {@const nextTier = tier + 1}
            {@const nextCost = !isMaxed ? pu.tiers[nextTier].cost : 0}
            {@const canAfford = !isMaxed && gs.G.cloutPoints >= nextCost}
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
                <button class="pu-btn" disabled={!canAfford} onclick={() => buyPrestigeUpgradeModal(pu.id)}>
                  {canAfford ? '▲ Upgrade' : '🔒'} — {nextCost} CP
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>
      <div class="pmod-footer">
        <button class="pmod-btn pmod-btn-cancel" onclick={cancelPrestigeModal}>← Keep Playing</button>
        <button class="pmod-btn pmod-btn-confirm" onclick={doConfirm}>Start New Run →</button>
      </div>
    </div>
  </div>
{/if}
