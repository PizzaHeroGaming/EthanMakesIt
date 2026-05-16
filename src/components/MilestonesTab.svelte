<script>
  import { gs } from '../lib/state.svelte.js';
  import { MILESTONES_DEF } from '../lib/data.js';
</script>

<div>
  {#each MILESTONES_DEF as m (m.id)}
    {@const done = gs.G.doneMilestones.includes(m.id)}
    <div class="milestone-item" class:done>
      <div class="ms-check">{done ? '✓' : ''}</div>
      <div class="ms-label">{m.name}</div>
      <div class="ms-reward">{m.reward}</div>
    </div>
  {/each}
</div>
