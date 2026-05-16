<script>
  import { gs } from '../lib/state.svelte.js';
  import { ACTIONS, COOK_IDS } from '../lib/data.js';
  import { isActionUnlocked } from '../lib/actions.js';
  import ActionCard from './ActionCard.svelte';
  import BuyModeSelector from './BuyModeSelector.svelte';

  const unlockedCooks = $derived(ACTIONS.filter((a) => COOK_IDS.includes(a.id) && isActionUnlocked(a)));
  const unlockedContent = $derived(ACTIONS.filter((a) => !COOK_IDS.includes(a.id) && isActionUnlocked(a)));
  const activeName = $derived(
    gs.G.activeCookId ? ACTIONS.find((a) => a.id === gs.G.activeCookId)?.name : null,
  );
</script>

<BuyModeSelector />

<div class="actions-columns">
  <div class="actions-col">
    <div class="actions-col-title">
      🍳 Kitchen
      {#if activeName}<span class="auto-cook-indicator">⚙ {activeName}</span>{/if}
    </div>
    {#each unlockedCooks as a (a.id)}
      <ActionCard action={a} />
    {/each}
  </div>
  <div class="actions-col">
    <div class="actions-col-title">📱 Content &amp; Business</div>
    {#each unlockedContent as a (a.id)}
      <ActionCard action={a} />
    {/each}
  </div>
</div>
