<script>
  import { gs } from '../lib/state.svelte.js';
  import { ACTIONS } from '../lib/data.js';
  import { fmt, fmtMoney } from '../lib/helpers.js';
  import { saveGame, doReset } from '../lib/save.js';
  import { toggleMute, isMuted } from '../lib/audio.js';

  let saveTime = $state('not yet saved this session');
  let mutedLabel = $state(isMuted() ? '🔇 Sounds Off' : '🔊 Sounds On');

  function onSave() {
    saveGame();
    saveTime = 'Saved at ' + new Date().toLocaleTimeString();
  }
  function onMute() {
    toggleMute();
    mutedLabel = isMuted() ? '🔇 Sounds Off' : '🔊 Sounds On';
  }

  function onBackdropClick(e) {
    if (e.target === e.currentTarget) gs.menuOpen = false;
  }
</script>

{#if gs.menuOpen}
  <div class="menu-backdrop" onclick={onBackdropClick}
       onkeydown={(e) => { if (e.key === 'Escape') gs.menuOpen = false; }}
       role="dialog" tabindex="-1">
    <div class="menu-panel">
      <div class="menu-panel-header">
        <h2>⚙ Menu</h2>
        <button class="menu-close" onclick={() => (gs.menuOpen = false)}>✕</button>
      </div>

      <div class="menu-section">
        <div class="menu-section-title">📊 Stats</div>
        <div class="menu-stat-grid">
          <div class="menu-stat"><span class="mk">Money</span><span class="mv gold">{fmtMoney(gs.G.money)}</span></div>
          <div class="menu-stat"><span class="mk">Level</span><span class="mv purple">{gs.G.level}</span></div>
          <div class="menu-stat"><span class="mk">Subscribers</span><span class="mv blue">{fmt(gs.G.subs)}</span></div>
          <div class="menu-stat"><span class="mk">Total Views</span><span class="mv green">{fmt(gs.G.views)}</span></div>
          <div class="menu-stat"><span class="mk">Hype</span><span class="mv">{Math.floor(gs.G.hype)}%</span></div>
          <div class="menu-stat"><span class="mk">Income/s</span><span class="mv gold">${gs.smoothedIncome.toFixed(2)}</span></div>
          <div class="menu-stat"><span class="mk">Meals Cooked</span><span class="mv">{gs.G.totalCooks}</span></div>
          <div class="menu-stat"><span class="mk">Meals Served</span><span class="mv green">{gs.G.totalMealsServed}</span></div>
          <div class="menu-stat"><span class="mk">Meal Stock</span><span class="mv gold">{gs.G.mealStock}</span></div>
          <div class="menu-stat"><span class="mk">Meals Spoiled</span><span class="mv red">{gs.G.mealsSpoiled || 0}</span></div>
          <div class="menu-stat"><span class="mk">Stall Earned</span><span class="mv gold">{fmtMoney(gs.stallTotalEarned)}</span></div>
          <div class="menu-stat"><span class="mk">Videos Filmed</span><span class="mv">{gs.G.totalFilmed}</span></div>
          <div class="menu-stat"><span class="mk">Videos Edited</span><span class="mv">{gs.G.totalEdits}</span></div>
          <div class="menu-stat"><span class="mk">Prestiges</span><span class="mv">{gs.G.prestiges}</span></div>
          <div class="menu-stat"><span class="mk">Clout Points</span><span class="mv purple">{gs.G.cloutPoints || 0} CP</span></div>
          <div class="menu-stat"><span class="mk">Managers</span><span class="mv green">{gs.G.managers.length} / {ACTIONS.filter((a) => a.managerCost).length}</span></div>
        </div>
      </div>

      <div class="menu-section">
        <div class="menu-section-title">✦ Multipliers</div>
        <div class="menu-stat-grid">
          <div class="menu-stat"><span class="mk">Cook XP</span><span class="mv purple">x{gs.G.mx.xp.toFixed(2)}</span></div>
          <div class="menu-stat"><span class="mk">Sub Gain</span><span class="mv blue">x{gs.G.mx.sub.toFixed(2)}</span></div>
          <div class="menu-stat"><span class="mk">View Gain</span><span class="mv green">x{gs.G.mx.view.toFixed(2)}</span></div>
          <div class="menu-stat"><span class="mk">Speed</span><span class="mv gold">x{gs.G.mx.speed.toFixed(2)}</span></div>
          <div class="menu-stat"><span class="mk">Money</span><span class="mv gold">x{gs.G.mx.money.toFixed(2)}</span></div>
        </div>
      </div>

      <div class="menu-section">
        <div class="menu-section-title">🔊 Sound</div>
        <div class="menu-btn-row">
          <button class="menu-action-btn save" onclick={onMute}>{mutedLabel}</button>
        </div>
      </div>

      <div class="menu-section">
        <div class="menu-section-title">💾 Save &amp; Load</div>
        <div class="menu-btn-row">
          <button class="menu-action-btn save" onclick={onSave}>Save Now</button>
        </div>
        <div id="menu-save-time">Last save: {saveTime}</div>
      </div>

      <div class="menu-section">
        <div class="menu-section-title">⚠ Reset</div>
        <div class="menu-btn-row">
          <button class="menu-action-btn danger" onclick={() => (gs.menuResetConfirmOpen = true)}>Reset Game</button>
        </div>
        {#if gs.menuResetConfirmOpen}
          <div class="menu-reset-confirm" style="display:block">
            This will wipe all progress and start fresh. This cannot be undone.
            <div class="confirm-btns">
              <button class="confirm-yes" onclick={doReset}>Yes, reset everything</button>
              <button class="confirm-no" onclick={() => (gs.menuResetConfirmOpen = false)}>Cancel</button>
            </div>
          </div>
        {/if}
      </div>

      <div class="menu-section">
        <div class="menu-section-title">ℹ About</div>
        <div class="about-block">
          <div class="about-title">ETHAN MAKES IT</div>
          <div class="about-sub">A FoodTube Idle RPG · v0.2.0</div>
          <div class="about-credits">
            Made by <strong>Pizza Hero Gaming</strong>
          </div>
          <div class="about-links">
            <a href="https://pizzaherogaming.github.io/PizzaHeroGaming/" target="_blank" rel="noopener noreferrer">🍕 More PHG games</a>
          </div>
          <details class="about-changelog">
            <summary>Changelog</summary>
            <ul>
              <li><strong>v0.2.0</strong> — Per-action levels with Buy ×1/×10/×100/Max selector, milestone breakpoints, sqrt scaling. New viral target 5M subs. Achievement popups for milestones.</li>
              <li><strong>v0.1.5</strong> — Light/dark theme toggle, AdCap-style visual language, floating reward numbers, header counter punch.</li>
              <li><strong>v0.1.0</strong> — Migrated to Svelte 5. Per-card $/s preview, click bounce, completion flash.</li>
              <li><strong>v0.0.1</strong> — Initial single-file prototype.</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  </div>
{/if}
