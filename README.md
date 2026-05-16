# Ethan Makes It

A FoodTube idle RPG. Ethan has $10, a bag of eggs, and zero subscribers — help him cook, film, edit, and grow into a culinary internet legend. Idle progression with manager automation, a food-stall minigame, milestones, and a Clout-Points prestige system.

Playable single-page web app. Vanilla JS + ES modules, bundled by Vite.

## Install / run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build locally
npm run lint
npm run format
```

## Controls

- **Click an action** to start it. It loops automatically once running.
- **Buy Upgrades** in the Upgrades tab to permanently boost multipliers.
- **Hire Staff** in the Staff tab to automate non-cooking actions forever.
- **Auto-Cook Station** (Upgrades) lets you set one recipe to loop automatically.
- **Food Stall** (Stall tab) — sell meals to customers. Meals spoil if not sold in time.
- **Go Viral** when you hit 100 K subs to prestige and earn Clout Points for permanent bonuses.
- **☰ menu** (top right) for stats, save/reset, sound toggle.

Save autosaves every 15 s to `localStorage`. Reset is in the sidebar and the menu.

## Architecture

All source lives in `src/`. The single `index.html` hosts the markup; every inline `onclick="..."` attribute is wired to a function that `src/main.js` attaches to `window` — this keeps the diff vs. the original single-file build minimal.

```
index.html                 Markup + Google Fonts link, loads /src/main.js
src/
  main.js                  Entry point — wires window handlers, restores save, starts intervals
  state.js                 Shared mutable `state` object: G (game state), timers, EMA, tutorial step
  data.js                  Static defs: ACTIONS, UPGRADES_DEF, MILESTONES_DEF, PRESTIGE_UPGRADES, TITLES…
  audio.js                 Web-Audio oscillator/noise SFX; mute toggle persisted in localStorage
  save.js                  saveGame / loadGame / applyOfflineProgress / doReset (key: ethanV4)
  actions.js               Action timer engine, unlock + milestone checks, upgrade/manager purchase
  stall.js                 Food-stall: customers, freshness, spoilage, render
  prestige.js              Clout-Point math, multipliers, modal flow, run reset
  render.js                All DOM rendering + scene SVG animations + stat updates
  ui.js                    Notifications, tab switching, menu overlay, tutorial flow
  styles/main.css          All CSS (lifted as-is from the original single-file build)
```

### State coupling

`state.js` exports a single `state` object. Modules import it and access `state.G.money`, `state.stallCustomers`, etc. This is the key trick that lets prestige reassign `state.G = DEFAULT_G()` in one place and have every other module see the new object on its next access. No event bus, no observers — just shared mutable state.

### Window handler bridge

The original HTML uses inline `onclick="functionName()"` extensively, including inside HTML strings built by render functions (action cards, upgrade cards, customer cards, prestige modal). To keep behavior identical without rewriting the HTML, `main.js` does:

```js
Object.assign(window, { clickAction, buyUpgrade, serveCustomer, /* … */ });
```

### Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds on every push to `main` and publishes `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`. First time:

1. Push the repo to GitHub on `main`.
2. The Action runs and creates the `gh-pages` branch.
3. Repo → Settings → Pages → Source: `Deploy from a branch` → `gh-pages` / `(root)`.
4. Live URL appears in the Pages settings.

`vite.config.js` sets `base: './'` so the built `index.html` works at any subpath (e.g. `https://username.github.io/ethan-makes-it/`).

## Credits

© 2026 Jamie. All rights reserved.

Fonts: [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue) & [DM Mono](https://fonts.google.com/specimen/DM+Mono) via Google Fonts.
