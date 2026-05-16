<script>
  import { gs } from '../lib/state.svelte.js';
  import { fmt } from '../lib/helpers.js';
  import { onMount, onDestroy } from 'svelte';

  let bobOffset = $state(0);
  let bobDir = 1;
  let bobTimer;
  let steamVisible = $state(false);
  let burnerOn = $state(false);
  let recOn = $state(false);
  let recPulse = $state(false);
  let effectTimer;
  let recBlinkTimer;

  onMount(() => {
    bobTimer = setInterval(() => {
      bobOffset += bobDir * 0.5;
      if (Math.abs(bobOffset) > 2) bobDir *= -1;
    }, 80);
    effectTimer = setInterval(() => {
      const t = gs.G.actionTimers;
      const cooking =
        t['cook_eggs']?.running ||
        t['cook_pasta']?.running ||
        t['cook_stirfry']?.running ||
        t['cook_sushi']?.running ||
        t['cook_wellington']?.running ||
        t['cook_ramen']?.running;
      if (cooking && Math.random() < 0.1) {
        steamVisible = true;
        burnerOn = true;
        setTimeout(() => (steamVisible = false), 2200);
        setTimeout(() => (burnerOn = false), 1500);
      }
      if (t['film_clip']?.running && Math.random() < 0.05) {
        recOn = true;
        let n = 0;
        clearInterval(recBlinkTimer);
        recBlinkTimer = setInterval(() => {
          recPulse = !recPulse;
          if (++n > 7) {
            clearInterval(recBlinkTimer);
            recOn = false;
            recPulse = false;
          }
        }, 300);
      }
    }, 500);
  });

  onDestroy(() => {
    clearInterval(bobTimer);
    clearInterval(effectTimer);
    clearInterval(recBlinkTimer);
  });
</script>

<div id="scene-wrap">
  <svg id="scene" viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg">
    <rect width="260" height="160" fill="#1a2540"/>
    <rect x="0" y="0" width="260" height="100" fill="#243155"/>
    <rect x="0" y="100" width="260" height="60" fill="#3a1f0e"/>
    <line x1="0" y1="25" x2="260" y2="25" stroke="#1e2b4a" stroke-width="1"/>
    <line x1="0" y1="50" x2="260" y2="50" stroke="#1e2b4a" stroke-width="1"/>
    <line x1="0" y1="75" x2="260" y2="75" stroke="#1e2b4a" stroke-width="1"/>
    <rect x="10" y="90" width="180" height="18" fill="#4a2e10" rx="2"/>
    <rect x="10" y="106" width="180" height="40" fill="#3a200b" rx="2"/>
    <rect x="18" y="68" width="80" height="28" fill="#2a3550" rx="3"/>
    <circle cx="38" cy="82" r="9" fill="#1a223a" stroke="#444" stroke-width="1.5"/>
    <circle cx="38" cy="82" r="4" fill={burnerOn ? '#f60' : '#1e2640'}/>
    <circle cx="78" cy="82" r="9" fill="#1a223a" stroke="#444" stroke-width="1.5"/>
    <circle cx="78" cy="82" r="4" fill={burnerOn ? '#fa0' : '#1e2640'}/>
    <ellipse cx="38" cy="70" rx="14" ry="5" fill="#3d3d4d"/>
    <rect x="52" y="68" width="16" height="3" fill="#666" rx="1"/>
    <rect x="200" y="30" width="48" height="120" fill="#283850" rx="3"/>
    <rect x="202" y="32" width="44" height="55" fill="#1f2d44" rx="2"/>
    <rect x="202" y="89" width="44" height="59" fill="#1f2d44" rx="2"/>
    <rect x="155" y="40" width="34" height="22" fill="#111" rx="3"/>
    <circle cx="168" cy="51" r="7" fill="#0a0a14" stroke="#444" stroke-width="1"/>
    <circle cx="168" cy="51" r="4" fill="#0e0e20"/>
    <circle cx="158" cy="43" r="2.5" fill="#cc0000" opacity={recOn && !recPulse ? 1 : 0}/>
    <line x1="172" y1="62" x2="172" y2="96" stroke="#555" stroke-width="1.5"/>
    <line x1="158" y1="96" x2="186" y2="96" stroke="#555" stroke-width="1.5"/>
    <rect x="108" y="72" width="55" height="18" fill="#8a691c" rx="2"/>
    <rect x="116" y="75" width="10" height="12" fill="#d04d3b" rx="1"/>
    <rect x="130" y="77" width="8" height="9" fill="#ffaa30" rx="1"/>
    <rect x="142" y="75" width="10" height="12" fill="#3bb86a" rx="1"/>
    <g transform={`translate(0,${bobOffset.toFixed(1)})`}>
      <rect x="56" y="55" width="26" height="40" fill="#2980b9" rx="2"/>
      <rect x="58" y="60" width="22" height="35" fill="#ecf0f1" rx="1"/>
      <circle cx="69" cy="46" r="14" fill="#e8b86a"/>
      <rect x="57" y="32" width="24" height="10" fill="#3a1e05" rx="5"/>
      <circle cx="64" cy="44" r="2" fill="#2c1810"/>
      <circle cx="74" cy="44" r="2" fill="#2c1810"/>
      <path d="M64 51 Q69 56 74 51" stroke="#2c1810" stroke-width="1.5" fill="none"/>
      <rect x="38" y="60" width="18" height="8" fill="#2980b9" rx="2"/>
      <rect x="66" y="60" width="18" height="8" fill="#2980b9" rx="2"/>
      <circle cx="35" cy="64" r="5" fill="#e8b86a"/>
      <circle cx="87" cy="64" r="5" fill="#e8b86a"/>
      <rect x="57" y="95" width="10" height="20" fill="#1c2833" rx="1"/>
      <rect x="71" y="95" width="10" height="20" fill="#1c2833" rx="1"/>
    </g>
    {#if steamVisible}
      <g>
        <path d="M33 58 Q28 48 33 38 Q38 28 33 18" stroke="#aaa" stroke-width="2" fill="none" opacity="0.6"/>
        <path d="M43 58 Q38 46 43 36 Q48 26 43 16" stroke="#aaa" stroke-width="2" fill="none" opacity="0.4"/>
      </g>
    {/if}
    <rect x="6" y="116" width="80" height="32" fill="#000000aa" rx="3"/>
    <text x="12" y="127" fill="#aaa" font-family="monospace" font-size="7" font-weight="bold">SUBSCRIBERS</text>
    <text x="12" y="143" fill="#ff8d8d" font-family="monospace" font-size="12" font-weight="bold">{fmt(gs.G.subs)}</text>
    <rect x="92" y="116" width="80" height="32" fill="#000000aa" rx="3"/>
    <text x="98" y="127" fill="#aaa" font-family="monospace" font-size="7" font-weight="bold">VIEWS</text>
    <text x="98" y="143" fill="#9b9bff" font-family="monospace" font-size="12" font-weight="bold">{fmt(gs.G.views)}</text>
  </svg>
</div>
