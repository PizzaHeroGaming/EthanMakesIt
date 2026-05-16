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
