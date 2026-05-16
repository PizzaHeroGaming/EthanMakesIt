<script>
  import { gs } from '../lib/state.svelte.js';

  const STEPS = 4;
  function next() {
    gs.tutStep++;
    if (gs.tutStep >= STEPS) close();
  }
  function close() {
    gs.tutorialOpen = false;
    try { localStorage.setItem('ethanTutDone', '1'); } catch (e) {}
  }
</script>

{#if gs.tutorialOpen}
  <div class="tut-backdrop">
    <div class="tut-box">
      <h2>ETHAN MAKES IT</h2>
      <div class="tut-sub">A FOODTUBE IDLE RPG</div>
      <div class="tut-dots">
        {#each Array(STEPS) as _, i}
          <div class="tut-dot" class:active={i === gs.tutStep}></div>
        {/each}
      </div>

      {#if gs.tutStep === 0}
        <div class="tut-step active">
          <p>Meet <strong style="color:var(--gold-deep)">Ethan</strong> — a 26-year-old with a tiny apartment kitchen, a secondhand camera, and a dream to become a food YouTube creator.</p>
          <p>He's got an empty wallet, a bag of eggs, and zero subscribers. Your job? Help him build an empire — one recipe at a time.</p>
          <div class="tut-tip">🎮 This is an idle game. Start actions and let them run — no babysitting required.</div>
        </div>
      {:else if gs.tutStep === 1}
        <div class="tut-step active">
          <p>Every action has a <strong style="color:var(--gold-deep)">timer bar</strong>. Click the action to start it. When the bar fills up, you earn rewards automatically.</p>
          <p>Actions keep looping on their own once started. You click to <em>launch</em>, the game does the rest.</p>
          <div class="tut-tip">⏱ Upgrades reduce timers. Managers make actions run forever without clicking.</div>
        </div>
      {:else if gs.tutStep === 2}
        <div class="tut-step active">
          <p>New actions and upgrades <strong style="color:var(--gold-deep)">unlock as you progress</strong> — level up your cooking skill, earn money, and grow your subscriber count.</p>
          <p>Watch for glowing unlock notifications when new content becomes available!</p>
          <div class="tut-tip">🔓 Start with "Cook Eggs" and work your way up to Wagyu Ramen and brand deals.</div>
        </div>
      {:else}
        <div class="tut-step active">
          <p>Hit <strong style="color:var(--red)">5,000,000 subscribers</strong> and you can <strong style="color:var(--red)">Go Viral</strong> — a prestige that resets progress but grants permanent multipliers.</p>
          <p>Each prestige makes everything faster and more rewarding. True FoodTubers go viral more than once.</p>
          <div class="tut-tip">📈 Your first goal: cook something, film it, and get your first subscriber.</div>
        </div>
      {/if}

      <div class="tut-btns">
        <button class="tut-btn tut-btn-skip" onclick={close}>Skip</button>
        <button class="tut-btn tut-btn-primary" onclick={next}>
          {gs.tutStep === STEPS - 1 ? 'Start Cooking! →' : gs.tutStep === 0 ? "Let's Cook →" : 'Next →'}
        </button>
      </div>
    </div>
  </div>
{/if}
