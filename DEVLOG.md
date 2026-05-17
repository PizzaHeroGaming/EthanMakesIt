# Ethan Makes It — Devlog

A running log of what's been built, the decisions behind each pass, and the open threads.

---

## Day 1 — From single file to Vite project

Started life as `ethanmakesit.html`: 2,765 lines of vanilla JS, CSS, and HTML jammed into one file. Worked, but past a certain point you can't navigate it. First pass was purely structural:

- Bootstrap a Vite project at the repo root.
- Split the JS into `src/` modules: `state`, `data`, `audio`, `save`, `actions`, `stall`, `prestige`, `render`, `ui`, `main`.
- Move the CSS to `src/styles/main.css`.
- Keep every inline `onclick="..."` in the HTML and re-expose handlers on `window` from `main.js`. Smallest possible behavioral diff.
- ESLint + Prettier wired up, `.github/workflows/deploy.yml` building & pushing `dist/` to `gh-pages`.

**Decision:** keep mechanics 100% identical, structure only. Made the migration verifiable.

## Day 2 — GitHub Pages deployment friction

First push went up but the live site rendered as unstyled HTML — Pages was serving `main` directly, not the built `dist/`. The user (rightly) noticed the workflow had created a `gh-pages` branch for the conventional `peaceiris/actions-gh-pages` flow, which meant flipping a setting in the repo.

**Pivot:** swapped to GitHub's official `actions/deploy-pages` flow, deleted the `gh-pages` branch. Cleaner: source stays on `main`, deploys come from Actions artifacts, and the only setup is **Settings → Pages → Source: GitHub Actions** once.

## Day 3 — Svelte rewrite + AdCap aesthetic

The user wanted the game to *feel like* AdVenture Capitalist — light backgrounds, chunky business cards, big BUY buttons, juice. We chose:

1. **Svelte 5 with runes.** `$state`, `$derived`, `$effect`. The whole game state lives in one `gs` proxy object exported from `lib/state.svelte.js`; components mutate `gs.G.money` directly and Svelte handles re-renders.
2. **Visual overhaul.** Cream/white card UI, color-coded category accents per action (orange for cooking, blue for filming, gold for business, purple for special). Big chunky buttons. Counter scale-pop on every increase.
3. **Floating reward numbers.** Every action completion drops `+$X`, `+Y subs`, `+Z views`, `+N XP` chips that float up from the card.

Naming pain: hit Svelte 5's "store_rune_conflict" warning because I'd named the exported state object `state`, which collides with how `$state` looks at glance. Renamed to `gs` (game state). Saved several confused-compiler hours later.

## Day 4 — Light/dark toggle

User preferred dark mode. Wired up a theme toggle in the header that flips `data-theme="light|dark"` on `<html>`, persisted to localStorage. All component colors moved to CSS variables. A few hardcoded backgrounds caught me later — fixed them as they were spotted (staff hint banner, notif background, menu reset confirm).

Default theme later set to dark per request.

## Day 5 — Real idle-game mechanics

Played a few minutes and realized: this is still the same shallow game in a prettier shell. Real idle games have **compounding loops** — AdCap businesses level hundreds of times with exponential cost growth. So:

- Added **per-action levels** purchasable with money. Each level multiplies that action's output.
- **Buy mode selector** — `×1 / ×10 / ×100 / Max`, persisted to localStorage.
- **Milestone breakpoints** at action levels 25 / 100 / 400 / 1600 / 6400, each giving an extra ×1.5 bonus.
- **Sandboxed preview** — `previewReward(action)` clones G, runs the reward fn, diffs the result. Lets cards show live `+$X +Y subs` chips that reflect current multipliers.

**Decision:** XP is NOT scaled by action level. Action level juices money/subs/views/hype; Chef Level stays a pacing gate so unlocks don't blur past. Also bumped the XP curve from ×1.45 to ×1.7 per Chef Level.

## Day 6 — Balance tuning via simulation

User asked: "with optimal play, how long to first viral?" Built `sim.js` — discrete-time simulation of an active player who buys everything ASAP and serves every stall meal. First answer was disappointing: **8 minutes 20 seconds**.

Tried bumping cost growth from ×1.07 to ×1.12, raised viral threshold from 100K → 500K → 5M subs. Barely moved. The bottleneck wasn't cost — it was **linear `mult = level`** compounding with global multipliers into a sub firehose.

Switched to **`mult = sqrt(level)`** with smaller milestone breakpoints (×1.5 instead of ×2). Result: **12 minutes** for first viral with active play, and a curve that extends naturally — second prestige ~25-30 min, P10 ~40-60 min each, deep-late hours per prestige. Real idle territory.

## Day 7 — PHG splash, About, and the kitchen scene

Ported the **Pizza Hero Gaming studio splash** from the alchemy project. Drops in cleanly: `splash.css` + `splash.js`, invoked from `src/app.js` before mounting `<App />`. Shake, rays, shockwave, click-to-skip, 3.8s default.

Added an **About section** in the menu overlay — title, version, PHG credits, link to the PHG hub, collapsible changelog. Removed the source-repo link per request.

Then the corner scene — the user wanted something "more than" the small Ethan SVG. First attempt: detailed kitchen with subway-tile wall, window with city skyline, stove with flame gradient, cookbook, camera, animated Ethan with chef hat and apron. Looked nice but didn't fit the rest of the UI.

Second attempt: clean **Creator Dashboard card** — flat avatar with mood-reactive face, channel handle, stat tiles, hype meter. User: "feels redundant to what we have already."

Third attempt — **what stuck:** a **live YouTube chat feed**.

## Day 8 — The chat is the soul of the game

Built `src/lib/chat.js` with a viewer pool and themed comment categories. Per-action triggers push context-aware comments when actions complete. Milestones fire a 3-message celebration burst.

@sendfood started life as the "friend of the channel" (the real-life @sendfood who inspired the game). Then the user clarified: **@sendfood is Ethan himself.** Rewrote his comment pool to read as the creator chatting back to his own audience ("yall ready for this one", "next vid drops sunday", "recipe in the description"). Added a gold **CREATOR** badge next to his handle.

Added six more weighted regulars (@tacticizm, @yourpizzahero, @theboysquared, @journeygames, @animeBJ, @redhead) and a **mayo running gag** that fires from any random viewer ~6% of the time. Ethan now occasionally jokes back at the chat about people demanding mayo on his Wellington.

After feedback the chat felt repetitive — expanded every pool 3-4× and added a sliding **no-repeat window** so the same line can't pop within the last 12 messages.

Late game with 9 managers + ambient ticker = chat firehose. Added a **1.4s global throttle** on `pushChatMessage`. Milestone bursts pass `{force:true}` to skip the throttle.

## Day 9 — Bug bashes

**Stall tab not rendering on the live build.** Mid-script `import { onMount, onDestroy }` after `$state` declarations confused Svelte 5's production output. Rewrote with imports at the top and replaced nested `{#if}/{@const}` freshness logic with a helper function. Fixed.

**Frozen progress bars.** After a save/load, `startAction()` bailed early because `actionTimers[id].running` was already `true` from the saved snapshot — so the new RAF tick never started. The bars showed the saved progress forever. Fixed by also requiring an active RAF handle in `activeTimers` before bailing; otherwise treat the running flag as stale and kick the loop back to life.

**Sound spam.** All those auto-loop completions firing cook/film/complete SFX simultaneously was a wall of noise. Added per-effect throttling (350ms for cook/film/complete, 200ms for serve, 300ms for miss). Milestone/level-up/unlock SFX stay unthrottled since those are intentional pops.

## Where we are

The game has compounding action levels with milestone breakpoints, a meaningful prestige loop, full save/load with offline progress, light/dark theming, the PHG splash on cold load, a live chat feed with a cast of regulars and a running mayo joke, audible polish, and an active-play first-viral time around 12 minutes that scales out to many hours of full prestige tree completion.

What's solid:
- The core loop (click → manager auto → level → milestone → prestige)
- The mechanical scaffolding (Svelte 5 reactivity, save format, sim.js for tuning)
- The presentation (theme toggle, AdCap card language, chat widget, splash)

What's still open:
- No actual stall manager / auto-serve mechanic — stall income is gated by manual clicks
- The 13-tree prestige system hasn't been balance-tested past the first few prestiges
- Achievement / milestone list could expand into the late game (current top is 5M subs)
- No mobile-specific layout pass
- No sound design beyond the synthesized SFX

— end of log
