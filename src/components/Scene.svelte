<script>
  import { gs } from '../lib/state.svelte.js';
  import { fmt } from '../lib/helpers.js';
  import { COOK_IDS, ACTIONS } from '../lib/data.js';
  import { onMount, onDestroy } from 'svelte';

  // ── Ethan idle bob ──
  let bobOffset = $state(0);
  let bobDir = 1;

  // ── Eye blink ──
  let blinking = $state(false);

  // ── Burner / steam / camera REC ──
  let steamPuffs = $state([]); // array of {id, dx, age}
  let nextPuff = 1;
  let burnerOn = $state(false);
  let recOn = $state(false);
  let recPulse = $state(false);

  // ── Hype glow intensity (0-1) ──
  const hypePct = $derived(gs.G.hype / 100);

  // ── Active cook recipe (drives pan contents) ──
  const activeCook = $derived(() => {
    for (const id of COOK_IDS) {
      if (gs.G.actionTimers[id]?.running) return id;
    }
    return null;
  });

  // ── Sub/view sparkles when value increases ──
  let subSparkle = $state(false);
  let viewSparkle = $state(false);
  let lastSubs = 0;
  let lastViews = 0;
  $effect(() => {
    if (gs.G.subs > lastSubs && lastSubs > 0) {
      subSparkle = true;
      setTimeout(() => (subSparkle = false), 400);
    }
    lastSubs = gs.G.subs;
  });
  $effect(() => {
    if (gs.G.views > lastViews && lastViews > 0) {
      viewSparkle = true;
      setTimeout(() => (viewSparkle = false), 400);
    }
    lastViews = gs.G.views;
  });

  let timers = [];
  onMount(() => {
    // Idle bob
    timers.push(setInterval(() => {
      bobOffset += bobDir * 0.4;
      if (Math.abs(bobOffset) > 1.6) bobDir *= -1;
    }, 80));

    // Random blink every 2-5s
    function scheduleBlink() {
      const wait = 2000 + Math.random() * 3500;
      timers.push(setTimeout(() => {
        blinking = true;
        setTimeout(() => { blinking = false; scheduleBlink(); }, 130);
      }, wait));
    }
    scheduleBlink();

    // Steam puffs + burner flicker while cooking
    timers.push(setInterval(() => {
      const cooking = COOK_IDS.some((id) => gs.G.actionTimers[id]?.running);
      if (cooking) {
        burnerOn = true;
        if (Math.random() < 0.45) {
          const id = nextPuff++;
          const dx = (Math.random() - 0.5) * 6;
          steamPuffs.push({ id, dx, born: Date.now() });
          setTimeout(() => {
            const i = steamPuffs.findIndex((p) => p.id === id);
            if (i !== -1) steamPuffs.splice(i, 1);
          }, 1800);
        }
      } else {
        burnerOn = false;
      }
    }, 200));

    // Camera REC blink while filming
    timers.push(setInterval(() => {
      if (gs.G.actionTimers['film_clip']?.running) {
        recOn = true;
        recPulse = !recPulse;
      } else {
        recOn = false;
        recPulse = false;
      }
    }, 400));
  });

  onDestroy(() => timers.forEach((t) => { clearInterval(t); clearTimeout(t); }));

  // Recipe -> pan contents
  const panContents = $derived(() => {
    switch (activeCook()) {
      case 'cook_eggs':       return { color: '#fee48a', accent: '#fff5c2', icon: '🍳' };
      case 'cook_pasta':      return { color: '#f4d97a', accent: '#fff0b0', icon: '🍝' };
      case 'cook_stirfry':    return { color: '#a85a2a', accent: '#d97b3c', icon: '🥩' };
      case 'cook_sushi':      return { color: '#f4f4ec', accent: '#ff8a8a', icon: '🍣' };
      case 'cook_wellington': return { color: '#7a3a1a', accent: '#c97a4c', icon: '🥩' };
      case 'cook_ramen':      return { color: '#d97a1a', accent: '#ffd07a', icon: '🍜' };
      default: return null;
    }
  });
</script>

<div id="scene-wrap">
  <svg id="scene" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <!-- subway tile pattern (wall) -->
      <pattern id="tiles" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
        <rect width="40" height="20" fill="#2a3554"/>
        <rect x="0.5" y="0.5" width="39" height="19" fill="#324068" rx="1"/>
      </pattern>
      <pattern id="tiles2" x="20" y="20" width="40" height="20" patternUnits="userSpaceOnUse">
        <rect width="40" height="20" fill="#2a3554"/>
        <rect x="0.5" y="0.5" width="39" height="19" fill="#324068" rx="1"/>
      </pattern>
      <!-- hype glow gradient (red ambient when hype maxed) -->
      <radialGradient id="hypeGlow" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#ff6060" stop-opacity={hypePct * 0.25}/>
        <stop offset="100%" stop-color="#ff6060" stop-opacity="0"/>
      </radialGradient>
      <!-- burner flame -->
      <radialGradient id="flame1" cx="50%" cy="60%" r="60%">
        <stop offset="0%" stop-color="#ffefa0"/>
        <stop offset="50%" stop-color="#ff7a1f"/>
        <stop offset="100%" stop-color="#ff7a1f" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="flame2" cx="50%" cy="60%" r="60%">
        <stop offset="0%" stop-color="#fff0a0"/>
        <stop offset="50%" stop-color="#ffa030"/>
        <stop offset="100%" stop-color="#ffa030" stop-opacity="0"/>
      </radialGradient>
      <!-- window sky -->
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#5a85b8"/>
        <stop offset="100%" stop-color="#f5b878"/>
      </linearGradient>
    </defs>

    <!-- Wall (upper) -->
    <rect width="320" height="120" fill="url(#tiles)"/>
    <!-- Hype ambient glow on wall -->
    <rect width="320" height="120" fill="url(#hypeGlow)"/>

    <!-- Window with city skyline -->
    <rect x="210" y="14" width="92" height="58" rx="4" fill="#1a2540" stroke="#101830" stroke-width="2"/>
    <rect x="214" y="18" width="84" height="50" rx="2" fill="url(#sky)"/>
    <!-- skyline -->
    <rect x="218" y="48" width="10" height="20" fill="#1a2540"/>
    <rect x="230" y="42" width="14" height="26" fill="#1a2540"/>
    <rect x="246" y="50" width="8"  height="18" fill="#1a2540"/>
    <rect x="256" y="38" width="12" height="30" fill="#1a2540"/>
    <rect x="270" y="46" width="16" height="22" fill="#1a2540"/>
    <rect x="288" y="44" width="10" height="24" fill="#1a2540"/>
    <!-- mullion -->
    <line x1="256" y1="18" x2="256" y2="68" stroke="#101830" stroke-width="2"/>
    <line x1="214" y1="43" x2="298" y2="43" stroke="#101830" stroke-width="2"/>

    <!-- Subscribe poster -->
    <rect x="14" y="20" width="44" height="32" rx="3" fill="#c8102e" stroke="#8b0a1f" stroke-width="2"/>
    <text x="36" y="34" text-anchor="middle" font-family="'Bebas Neue', sans-serif" font-size="9" fill="#fff" letter-spacing="1.5">SUBSCRIBE</text>
    <text x="36" y="46" text-anchor="middle" font-size="11" fill="#fff">▶</text>

    <!-- Pendant light -->
    <line x1="160" y1="0" x2="160" y2="18" stroke="#222" stroke-width="1.5"/>
    <ellipse cx="160" cy="24" rx="11" ry="7" fill="#2a2a2a"/>
    <ellipse cx="160" cy="22" rx="9" ry="3" fill="#444"/>
    <ellipse cx="160" cy="30" rx="14" ry="4" fill="#ffd97a" opacity="0.35"/>

    <!-- Floor / counter -->
    <rect x="0" y="120" width="320" height="80" fill="#3a200b"/>
    <rect x="0" y="120" width="320" height="6" fill="#5a3215"/>
    <!-- counter top -->
    <rect x="6" y="118" width="308" height="14" rx="2" fill="#5a3a18"/>
    <rect x="6" y="118" width="308" height="3" fill="#8a5828" opacity="0.6"/>
    <!-- cabinet doors below -->
    <rect x="14" y="136" width="60" height="50" rx="2" fill="#2a1808" stroke="#1a0e02" stroke-width="1"/>
    <rect x="78" y="136" width="60" height="50" rx="2" fill="#2a1808" stroke="#1a0e02" stroke-width="1"/>
    <rect x="142" y="136" width="60" height="50" rx="2" fill="#2a1808" stroke="#1a0e02" stroke-width="1"/>
    <rect x="206" y="136" width="60" height="50" rx="2" fill="#2a1808" stroke="#1a0e02" stroke-width="1"/>
    <circle cx="44" cy="158" r="1.5" fill="#8a5828"/>
    <circle cx="108" cy="158" r="1.5" fill="#8a5828"/>
    <circle cx="172" cy="158" r="1.5" fill="#8a5828"/>
    <circle cx="236" cy="158" r="1.5" fill="#8a5828"/>

    <!-- Stove on counter -->
    <rect x="20" y="92" width="100" height="28" fill="#2a3550" rx="2"/>
    <rect x="20" y="92" width="100" height="3" fill="#3a4570"/>
    <!-- left burner -->
    <circle cx="46" cy="106" r="10" fill="#1a223a" stroke="#444" stroke-width="1.5"/>
    <circle cx="46" cy="106" r="6" fill={burnerOn ? '#cc4a1a' : '#1e2640'}/>
    {#if burnerOn}<circle cx="46" cy="106" r="5" fill="url(#flame1)"/>{/if}
    <!-- right burner -->
    <circle cx="96" cy="106" r="10" fill="#1a223a" stroke="#444" stroke-width="1.5"/>
    <circle cx="96" cy="106" r="6" fill={burnerOn ? '#e0731f' : '#1e2640'}/>
    {#if burnerOn}<circle cx="96" cy="106" r="5" fill="url(#flame2)"/>{/if}

    <!-- Pan on left burner -->
    <ellipse cx="46" cy="92" rx="16" ry="5" fill="#3a3a48"/>
    <ellipse cx="46" cy="90" rx="14" ry="3.5" fill="#2c2c38"/>
    {#if panContents()}
      <ellipse cx="46" cy="90" rx="11" ry="2.8" fill={panContents().color}/>
      <ellipse cx="44" cy="89" rx="3" ry="1.2" fill={panContents().accent} opacity="0.7"/>
      <ellipse cx="49" cy="90" rx="2" ry="0.9" fill={panContents().accent} opacity="0.5"/>
    {/if}
    <rect x="62" y="89" width="18" height="2.5" fill="#666" rx="1"/>

    <!-- Cutting board with knife on counter -->
    <rect x="138" y="111" width="44" height="8" fill="#a5763a" rx="1"/>
    <rect x="138" y="111" width="44" height="2" fill="#c08c54"/>
    <rect x="144" y="113" width="20" height="3" fill="#3bb86a" rx="0.5" opacity="0.85"/>
    <rect x="166" y="113" width="6" height="3" fill="#d04d3b" rx="0.5"/>
    <!-- knife -->
    <rect x="172" y="108" width="16" height="2.5" fill="#dcdce5" rx="0.5"/>
    <rect x="188" y="108" width="4" height="2.5" fill="#3a2010" rx="0.5"/>

    <!-- Cookbook -->
    <rect x="196" y="106" width="14" height="14" fill="#c8102e" rx="0.5"/>
    <rect x="196" y="106" width="14" height="2" fill="#8b0a1f"/>
    <line x1="196" y1="112" x2="210" y2="112" stroke="#fff" stroke-width="0.4" opacity="0.5"/>

    <!-- Camera on tripod (right side) -->
    <g>
      <!-- tripod legs -->
      <line x1="266" y1="118" x2="262" y2="180" stroke="#3a3a3a" stroke-width="2"/>
      <line x1="266" y1="118" x2="266" y2="180" stroke="#3a3a3a" stroke-width="2"/>
      <line x1="266" y1="118" x2="270" y2="180" stroke="#3a3a3a" stroke-width="2"/>
      <!-- camera body -->
      <rect x="248" y="76" width="36" height="26" fill="#1a1a1a" rx="3" stroke="#444" stroke-width="1"/>
      <rect x="248" y="76" width="36" height="6" fill="#2c2c2c" rx="2"/>
      <!-- lens -->
      <circle cx="266" cy="92" r="9" fill="#0a0a14" stroke="#444" stroke-width="1.5"/>
      <circle cx="266" cy="92" r="6" fill="#1a1a28"/>
      <circle cx="266" cy="92" r="3" fill="#0a0a14"/>
      <circle cx="264" cy="90" r="1.2" fill="#6688aa" opacity="0.7"/>
      <!-- top viewfinder bump -->
      <rect x="261" y="71" width="10" height="6" fill="#2a2a2a" rx="1"/>
      <!-- REC light -->
      <circle cx="278" cy="80" r="2" fill="#cc0000" opacity={recOn && !recPulse ? 1 : 0.15}/>
      {#if recOn}
        <circle cx="278" cy="80" r="4" fill="#cc0000" opacity={!recPulse ? 0.4 : 0}/>
      {/if}
    </g>

    <!-- Ethan -->
    <g transform={`translate(0,${bobOffset.toFixed(1)})`}>
      <!-- legs -->
      <rect x="146" y="148" width="9" height="22" fill="#2c3540" rx="1"/>
      <rect x="159" y="148" width="9" height="22" fill="#2c3540" rx="1"/>
      <!-- shoes -->
      <ellipse cx="150" cy="172" rx="6" ry="2" fill="#1a1a1a"/>
      <ellipse cx="163" cy="172" rx="6" ry="2" fill="#1a1a1a"/>
      <!-- apron back of shirt -->
      <rect x="139" y="98" width="36" height="52" fill="#3a76b8" rx="2"/>
      <!-- chef apron front -->
      <rect x="142" y="105" width="30" height="48" fill="#f4f0e6" rx="2"/>
      <rect x="142" y="105" width="30" height="3" fill="#d8d0bc"/>
      <!-- apron tie -->
      <rect x="139" y="118" width="3" height="6" fill="#c0baa6"/>
      <rect x="172" y="118" width="3" height="6" fill="#c0baa6"/>
      <!-- collar -->
      <path d="M148 100 L157 108 L166 100" fill="#3a76b8" stroke="#26537f" stroke-width="0.5"/>
      <!-- arms -->
      <rect x="124" y="105" width="16" height="10" fill="#3a76b8" rx="2"/>
      <rect x="174" y="105" width="16" height="10" fill="#3a76b8" rx="2"/>
      <!-- hands -->
      <circle cx="122" cy="113" r="5" fill="#e8b86a"/>
      <circle cx="192" cy="113" r="5" fill="#e8b86a"/>
      <!-- neck -->
      <rect x="153" y="92" width="9" height="6" fill="#e8b86a"/>
      <!-- head -->
      <circle cx="157" cy="80" r="14" fill="#e8b86a"/>
      <!-- shadow under chin -->
      <ellipse cx="157" cy="91" rx="10" ry="2" fill="#c89858" opacity="0.4"/>
      <!-- chef hat -->
      <ellipse cx="157" cy="60" rx="14" ry="5" fill="#ffffff"/>
      <ellipse cx="151" cy="56" rx="6" ry="7" fill="#ffffff"/>
      <ellipse cx="157" cy="54" rx="7" ry="8" fill="#ffffff"/>
      <ellipse cx="163" cy="56" rx="6" ry="7" fill="#ffffff"/>
      <rect x="143" y="62" width="28" height="6" fill="#f4f0e6" rx="2"/>
      <!-- hair peeking -->
      <path d="M145 68 Q146 71 150 70" stroke="#3a1e05" stroke-width="2" fill="none"/>
      <path d="M169 68 Q168 71 164 70" stroke="#3a1e05" stroke-width="2" fill="none"/>
      <!-- eyes -->
      {#if blinking}
        <line x1="150" y1="78" x2="155" y2="78" stroke="#2c1810" stroke-width="1.5"/>
        <line x1="159" y1="78" x2="164" y2="78" stroke="#2c1810" stroke-width="1.5"/>
      {:else}
        <circle cx="152" cy="78" r="1.8" fill="#2c1810"/>
        <circle cx="162" cy="78" r="1.8" fill="#2c1810"/>
        <circle cx="152.5" cy="77.4" r="0.5" fill="#fff"/>
        <circle cx="162.5" cy="77.4" r="0.5" fill="#fff"/>
      {/if}
      <!-- eyebrows -->
      <path d="M148 73 Q152 71 156 73" stroke="#3a1e05" stroke-width="1.4" fill="none"/>
      <path d="M158 73 Q162 71 166 73" stroke="#3a1e05" stroke-width="1.4" fill="none"/>
      <!-- mouth -->
      <path d="M152 86 Q157 90 162 86" stroke="#2c1810" stroke-width="1.4" fill="none"/>
      <!-- cheek blush -->
      <circle cx="148" cy="84" r="1.5" fill="#ff8a8a" opacity="0.45"/>
      <circle cx="166" cy="84" r="1.5" fill="#ff8a8a" opacity="0.45"/>
    </g>

    <!-- Steam puffs -->
    {#each steamPuffs as p (p.id)}
      <circle class="steam-puff" cx={46 + p.dx} cy="86" r="3" fill="#ddd"/>
    {/each}

    <!-- Active recipe icon floating near pan -->
    {#if panContents()}
      <text x="46" y="78" text-anchor="middle" font-size="10" opacity="0.85">{panContents().icon}</text>
    {/if}

    <!-- Sub/View HUD overlays (bottom) -->
    <g>
      <rect x="8" y="183" width="78" height="14" rx="4" fill="rgba(0,0,0,0.55)"/>
      <text x="14" y="193.5" font-family="'Bebas Neue', sans-serif" font-size="9" fill="#ff8d8d" letter-spacing="1">SUBS</text>
      <text x="80" y="193.5" text-anchor="end" font-family="'Bebas Neue', sans-serif" font-size="11" fill="#fff" letter-spacing="0.5">{fmt(gs.G.subs)}</text>
      {#if subSparkle}
        <circle cx="80" cy="190" r="3" fill="#ff8d8d" class="sparkle"/>
      {/if}

      <rect x="90" y="183" width="78" height="14" rx="4" fill="rgba(0,0,0,0.55)"/>
      <text x="96" y="193.5" font-family="'Bebas Neue', sans-serif" font-size="9" fill="#9bb6ff" letter-spacing="1">VIEWS</text>
      <text x="162" y="193.5" text-anchor="end" font-family="'Bebas Neue', sans-serif" font-size="11" fill="#fff" letter-spacing="0.5">{fmt(gs.G.views)}</text>
      {#if viewSparkle}
        <circle cx="162" cy="190" r="3" fill="#9bb6ff" class="sparkle"/>
      {/if}
    </g>
  </svg>
</div>

<style>
  #scene-wrap { height: 200px; }
  :global(.steam-puff) { animation: steam 1.8s ease-out forwards; }
  @keyframes steam {
    0%   { opacity: 0.85; transform: translateY(0) scale(0.8); }
    100% { opacity: 0; transform: translateY(-40px) scale(1.6); }
  }
  :global(.sparkle) { animation: sparkle 0.45s ease-out forwards; }
  @keyframes sparkle {
    0%   { opacity: 1; transform: scale(0.4); }
    100% { opacity: 0; transform: scale(2.4); }
  }
</style>
