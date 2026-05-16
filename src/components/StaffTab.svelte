<script>
  import { gs } from '../lib/state.svelte.js';
  import { ACTIONS, COOK_IDS, MANAGER_META } from '../lib/data.js';
  import { isActionUnlocked, buyManager, getManagerCost } from '../lib/actions.js';
  import { fmt, fmtMoney } from '../lib/helpers.js';

  const managerActions = $derived(ACTIONS.filter((a) => a.managerCost && !COOK_IDS.includes(a.id)));

  function lockReason(a) {
    const u = a.unlockAt;
    const parts = [];
    if (u.level && gs.G.level < u.level) parts.push('Level ' + u.level);
    if (u.subs && gs.G.subs < u.subs) parts.push(fmt(u.subs) + ' subs');
    if (u.totalCooks && gs.G.totalCooks < u.totalCooks) parts.push(u.totalCooks + ' cooks');
    if (u.totalFilmed && gs.G.totalFilmed < u.totalFilmed) parts.push(u.totalFilmed + ' videos');
    if (u.totalEdits && gs.G.totalEdits < u.totalEdits) parts.push(u.totalEdits + ' edits');
    return 'Unlock: ' + parts.join(' + ');
  }
</script>

<div style="font-size:11px;color:var(--ink2);margin-bottom:10px;line-height:1.55;border-left:3px solid var(--gold);padding:8px 12px;background:#fff8dd;border-radius:0 8px 8px 0">
  Hire staff to automate Content &amp; Business actions forever. Staff unlock when their action unlocks. Auto-Cook is managed from the Actions tab.
</div>

<div class="staff-grid">
  {#each managerActions as a (a.id)}
    {@const meta = MANAGER_META[a.id] || { animClass: '', animIcon: '🧑', role: 'Handles this action' }}
    {@const isHired = gs.G.managers.includes(a.id)}
    {@const unlocked = isActionUnlocked(a)}
    {@const cost = getManagerCost(a)}
    {@const canAfford = gs.G.money >= cost}
    <div class="staff-card"
         class:hired={isHired}
         class:locked-staff={!unlocked && !isHired}
         class:affordable={!isHired && unlocked && canAfford}>
      <div class="staff-card-top">
        <div class="staff-icon">{meta.animIcon}</div>
        <div>
          <div class="staff-name">{a.managerName}</div>
          <div class="staff-role">{meta.role}</div>
        </div>
      </div>
      <div class="staff-desc">Automates <strong>{a.name}</strong> — {a.desc}</div>
      <div class="staff-footer">
        {#if isHired}
          <div class="staff-hired-badge"><span class="staff-hired-dot"></span>On duty — auto-running</div>
        {:else if unlocked}
          <span class="staff-cost" class:can={canAfford}>{fmtMoney(cost)}</span>
          <button class="staff-hire-btn" disabled={!canAfford} onclick={() => buyManager(a.id)}>Hire</button>
        {:else}
          <span class="staff-lock-reason">{lockReason(a)}</span>
        {/if}
      </div>
    </div>
  {/each}
</div>
