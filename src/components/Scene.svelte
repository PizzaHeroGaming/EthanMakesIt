<script>
  import { onMount, onDestroy } from 'svelte';
  import { gs, pushChatMessage } from '../lib/state.svelte.js';
  import { makeMessage } from '../lib/chat.js';
  import { fmt } from '../lib/helpers.js';

  let listEl;
  let ambientTimer;

  // Ambient chatter: every 4-9s, push a comment scoped to the current activity.
  function scheduleAmbient() {
    const wait = 4000 + Math.random() * 5000;
    ambientTimer = setTimeout(() => {
      const runningCookId = ['cook_eggs','cook_pasta','cook_stirfry','cook_sushi','cook_wellington','cook_ramen']
        .find((id) => gs.G.actionTimers[id]?.running);
      const runningContent = ['film_clip','edit_video','thumbnail','promote','collab','sponsorship','merch','viral_video']
        .find((id) => gs.G.actionTimers[id]?.running);
      let category = 'ambient';
      // Bias toward what's happening, but mix in ambient.
      const r = Math.random();
      if (runningCookId && r < 0.45) category = runningCookId;
      else if (runningContent && r < 0.7) category = runningContent;
      else if (Math.random() < 0.5 && runningCookId) category = 'cook';
      pushChatMessage(makeMessage(category));
      scheduleAmbient();
    }, wait);
  }

  // Auto-scroll to bottom whenever a new message arrives.
  $effect(() => {
    void gs.chatMessages.length;
    if (listEl) requestAnimationFrame(() => { listEl.scrollTop = listEl.scrollHeight; });
  });

  onMount(() => {
    // Seed with a couple of opening messages so the panel isn't empty.
    pushChatMessage(makeMessage('ambient', { name: 'sendfood', color: '#f5c842', vip: true }));
    pushChatMessage(makeMessage('ambient'));
    scheduleAmbient();
  });
  onDestroy(() => clearTimeout(ambientTimer));

  // Live viewer count: hype-modulated fraction of subs, with a floor.
  const viewerCount = $derived(
    Math.max(3, Math.floor(8 + gs.G.subs * 0.0015 * (1 + gs.G.hype / 100)))
  );
</script>

<div class="chat-card">
  <div class="chat-header">
    <div class="chat-title">
      <span class="chat-live-dot"></span>
      Live Chat
    </div>
    <div class="chat-viewers">👁 {fmt(viewerCount)}</div>
  </div>
  <div class="chat-list" bind:this={listEl}>
    {#each gs.chatMessages as m (m.id)}
      <div class="chat-msg" class:vip={m.vip}>
        {#if m.name === 'sendfood'}<span class="chat-badge">CREATOR</span>{/if}
        <span class="chat-user" style="color:{m.color}">@{m.name}</span>
        <span class="chat-text">{m.text}</span>
      </div>
    {/each}
    {#if gs.chatMessages.length === 0}
      <div class="chat-empty">Waiting for chat...</div>
    {/if}
  </div>
</div>
