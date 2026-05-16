<script>
  import { gs } from '../lib/state.svelte.js';
  import { stallUnlocked, getMealPrice, serveCustomer } from '../lib/stall.js';
  import { fmtMoney } from '../lib/helpers.js';

  const price = $derived(getMealPrice());
  const unlocked = $derived(stallUnlocked());
  const now = $state({ t: Date.now() });

  // Tick for freshness display.
  import { onMount, onDestroy } from 'svelte';
  let interval;
  onMount(() => { interval = setInterval(() => (now.t = Date.now()), 1000); });
  onDestroy(() => clearInterval(interval));
</script>

{#if !unlocked}
  <div class="stall-locked">
    <div class="big">🍳</div>
    Cook <strong style="color:var(--gold-deep)">10 meals</strong> to unlock the Food Stall.<br>
    <span style="color:var(--muted)">{gs.G.totalCooks}/10 cooked so far</span>
  </div>
{:else}
  <div class="stall-header">
    <div class="stall-title">🏪 Food Stall</div>
    <div class="stall-stock-badge">Stock: <span>{gs.G.mealStock}</span> meals</div>
  </div>
  <div class="stall-hint">Meals spoil if not sold in time — losing money and hype. Keep stock lean and cook fresh batches often.</div>
  <div class="stall-earnings">
    <span>Price/meal <strong>{fmtMoney(price)}</strong></span>
    <span>Earned <strong>{fmtMoney(gs.stallTotalEarned)}</strong></span>
    <span style="color:var(--red)">Spoiled <strong style="color:var(--red)">{gs.G.mealsSpoiled}</strong></span>
  </div>

  {#if gs.G.mealQueue && gs.G.mealQueue.length > 0}
    <div class="freshness-section">
      <div class="freshness-label">🌡 Meal Freshness ({gs.G.mealQueue.length} in stock)</div>
      <div class="freshness-grid">
        {#each gs.G.mealQueue as m (m.id)}
          {#if m.addedAt === null}
            <div class="meal-block fresh" style="opacity:0.35" title="Stall not open yet"></div>
          {:else}
            {@const pct = Math.max(0, 1 - (now.t - m.addedAt) / m.maxAge)}
            {@const cls = pct > 0.6 ? 'fresh' : pct > 0.25 ? 'aging' : 'stale'}
            <div class="meal-block {cls}"></div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  {#if gs.G.mealStock === 0 && gs.stallCustomers.length === 0}
    <div class="stall-nostock">📦 Out of stock — head to Actions and cook something to restock.</div>
  {:else if gs.stallCustomers.length === 0}
    <div class="stall-empty"><div class="big">👀</div>Waiting for customers...<br><span style="font-size:10px">They'll show up shortly.</span></div>
  {:else}
    <div class="customer-grid">
      {#each gs.stallCustomers as c (c.id)}
        {@const pct = c.timeLeft / c.maxTime}
        {@const barColor = pct > 0.5 ? 'var(--money)' : pct > 0.25 ? 'var(--gold)' : 'var(--red)'}
        <div class="customer-card"
             onclick={(e) => { e.stopPropagation(); serveCustomer(c.id, e); }}
             onkeydown={(e) => { if (e.key === 'Enter') serveCustomer(c.id, e); }}
             role="button" tabindex="0">
          <div class="cust-top">
            <div class="cust-emoji">{c.emoji}</div>
            <div style="flex:1">
              <div class="cust-name">{c.name}</div>
              <div class="cust-order">"{c.order}"</div>
            </div>
          </div>
          <div class="cust-value">{fmtMoney(c.value)}</div>
          <div class="cust-timer-track"><div class="cust-timer-bar" style="width:{pct * 100}%;background:{barColor}"></div></div>
          <div class="serve-hint">tap to serve</div>
        </div>
      {/each}
    </div>
    {#if gs.G.mealStock === 0}
      <div class="stall-nostock" style="margin-top:10px">📦 No more stock — cook more to keep serving!</div>
    {/if}
  {/if}
{/if}
