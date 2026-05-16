<script>
  import { gs } from '../lib/state.svelte.js';
</script>

<div id="notif-container">
  {#each gs.notifications as n (n.id)}
    <div class="notif {n.cls}">{n.msg}</div>
  {/each}
</div>

{#each gs.floats as f (f.id)}
  <div class="float-num {f.cls}" style="left:{f.x}px;top:{f.y}px;transform:translate(-50%,0)">{f.text}</div>
{/each}

<div id="achievement-stack">
  {#each gs.achievements as a (a.id)}
    <div class="achievement-pop">
      <div class="ach-burst"></div>
      <div class="ach-icon">🏆</div>
      <div class="ach-body">
        <div class="ach-title">MILESTONE UNLOCKED</div>
        <div class="ach-name">{a.name}</div>
        <div class="ach-reward">{a.reward}</div>
      </div>
    </div>
  {/each}
</div>
