<script>
  import { gs } from '../lib/state.svelte.js';
  import { UPGRADES_DEF } from '../lib/data.js';
  import { isUpgradeUnlocked, buyUpgrade } from '../lib/actions.js';
  import { fmt, fmtMoney } from '../lib/helpers.js';

  function lockText(u) {
    const r = u.unlockAt;
    const parts = [];
    if (r.level && gs.G.level < r.level) parts.push('Lv' + r.level);
    if (r.subs && gs.G.subs < r.subs) parts.push(fmt(r.subs) + ' subs');
    if (r.totalEdits && gs.G.totalEdits < r.totalEdits) parts.push(r.totalEdits + ' edits');
    if (r.totalFilmed && gs.G.totalFilmed < r.totalFilmed) parts.push(r.totalFilmed + ' vids');
    if (r.totalCooks && gs.G.totalCooks < r.totalCooks) parts.push(r.totalCooks + ' cooks');
    return '🔒 ' + (parts.join(', ') || 'locked');
  }
</script>

<div class="upgrade-grid">
  {#each UPGRADES_DEF as u (u.id)}
    {@const owned = gs.G.ownedUpgrades.includes(u.id)}
    {@const unlocked = isUpgradeUnlocked(u)}
    {@const affordable = !owned && unlocked && gs.G.money >= u.cost}
    <div class="upgrade-card"
         class:owned
         class:locked-u={!unlocked && !owned}
         class:affordable
         onclick={() => unlocked && !owned && buyUpgrade(u.id)}
         onkeydown={(e) => { if (e.key === 'Enter' && unlocked && !owned) buyUpgrade(u.id); }}
         role="button" tabindex="0">
      <div class="upgrade-icon">{u.icon}</div>
      <div class="upgrade-info">
        <div class="upgrade-name">{u.name}</div>
        <div class="upgrade-desc">{u.desc}</div>
      </div>
      <div class="upgrade-cost">
        {#if owned}✓ OWNED
        {:else if !unlocked}{lockText(u)}
        {:else}{fmtMoney(u.cost)}
        {/if}
      </div>
    </div>
  {/each}
</div>
