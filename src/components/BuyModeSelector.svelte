<script>
  import { gs } from '../lib/state.svelte.js';

  const modes = ['x1', 'x10', 'x100', 'max'];

  function setMode(m) {
    gs.buyMode = m;
    try { localStorage.setItem('ethanBuyMode', m); } catch (e) {}
  }
</script>

<div class="buy-mode-selector">
  <span class="buy-mode-label">Buy</span>
  {#each modes as m}
    <button class="buy-mode-btn" class:active={gs.buyMode === m} onclick={() => setMode(m)}>
      {m.toUpperCase()}
    </button>
  {/each}
</div>
