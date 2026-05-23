# Ethan Makes It

A FoodTube idle RPG. Ethan starts with an empty wallet, a bag of eggs, and zero subscribers — help him cook, film, edit, and climb his way to 5 million subscribers and Going Viral. Idle progression with manager automation, per-action levels, a live YouTube-style chat feed, a food-stall side hustle, milestones, and a Clout-Points prestige loop.

Built with **Svelte 5 + Vite**, deployed to GitHub Pages.

## Install / run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build locally
npm run lint
npm run format
```

A simulation script (`sim.js`) is also included for tuning the progression curve:

```bash
node sim.js        # estimates time-to-first-viral with active-play assumptions
```

## How to play

1. **Click Cook Eggs** to start cooking. It loops automatically.
2. As you cook, **new actions unlock** — Buy Groceries, Film a Clip, Edit Video. Eventually Sponsorship, Merch, Viral Video.
3. Each action has its own **level** — spend money to buy levels, multiplying that action's output. Use the `×1 / ×10 / ×100 / Max` selector at the top of the Actions tab. Milestone breakpoints at levels 25 / 100 / 400 / 1600 / 6400 give an extra ×1.5 bonus.
4. **Hire Staff** in the Staff tab to put Content & Business actions on autopilot forever.
5. **Auto-Cook Station** (Upgrades) lets you set one recipe to auto-loop.
6. **Food Stall** (Stall tab) opens after 10 cooks — sell meals to customers before they spoil for extra money.
7. **Live Chat** in the sidebar — your fake YouTube audience reacts to whatever you're doing. @sendfood is Ethan himself talking back.
8. **Go Viral** at 5,000,000 subscribers to prestige. Earn Clout Points, spend them on permanent cross-run bonuses (Speed, Sub Gain, Stall Price, Manager Discount, etc.).
9. **☰ menu** for stats, save, sound toggle, theme toggle, reset, and the About panel with PHG links + changelog.
10. **☀ / ☾** in the header toggles light/dark mode. Defaults to dark; preference is persisted.

Save autosaves every 15 s to `localStorage` (key: `ethanV4`).

## Architecture

```
index.html                       Mount point + Google Fonts + PHG splash
src/
  app.js                         Entry point — shows PHG splash, then mounts <App />
  App.svelte                     Composes header, sidebar, tabs, overlays. Hosts the main game intervals.
  lib/
    state.svelte.js              The single source of truth — `gs` is a Svelte 5 $state proxy.
                                 Holds G (game state), timers, chat queue, notifications, etc.
    data.js                      Static defs: ACTIONS, UPGRADES_DEF, MILESTONES_DEF, PRESTIGE_UPGRADES,
                                 TITLES, MANAGER_META + the level-scaling helpers.
    actions.js                   Action timer engine, unlock + milestone checks, upgrade/manager/level
                                 purchase, reward scaling, reward preview sandbox.
    stall.js                     Food-stall: customers, freshness, spoilage.
    prestige.js                  Clout-Point math, prestige multipliers, modal flow, run reset.
    save.js                      saveGame / loadGame / applyOfflineProgress / doReset.
    audio.js                     Web-Audio oscillator/noise SFX with per-effect throttling.
    chat.js                      Fake live-chat: viewer pool with @sendfood as the creator,
                                 per-action comment categories, mayo running gag, no-repeat window.
    helpers.js                   fmt / fmtMoney number formatters.
    splash.js                    PHG studio bumper (ported from the alchemy project).
  components/
    Header.svelte                Money / Subs / Views big counters with scale-pop on increase,
                                 title rank, theme toggle, menu button.
    Sidebar.svelte               Stats panels, XP & hype bars, multipliers, GO VIRAL card, ticker.
    Scene.svelte                 The live chat feed widget (used to be a kitchen SVG).
    Tabs / ActionsTab / ActionCard / UpgradesTab / MilestonesTab / StaffTab / StallTab /
    PrestigeShop / PrestigeModal / MenuOverlay / Tutorial / Notifications / BuyModeSelector.
  styles/
    main.css                     All component styling — light + dark themes via CSS variables.
    splash.css                   PHG splash screen styling.
```

### Reactive state

`gs` is a Svelte 5 `$state` proxy exported from `lib/state.svelte.js`. Components read fields like `gs.G.money` directly in templates; Svelte tracks the access and re-renders on mutation. Prestige reassigns `gs.G = DEFAULT_G()` in one place and the entire UI follows automatically — no event bus, no manual subscribe.

### Balance / scaling at a glance

| Lever | Value |
|---|---|
| Starting money | $0 |
| Starting XP needed | 220, growing ×1.7 per Chef Level |
| Action level cost growth | ×1.12 per level |
| Action level multiplier | √level × milestone bonuses |
| Action milestone breakpoints | 25 / 100 / 400 / 1600 / 6400 (each ×1.5) |
| Viral threshold | 5,000,000 subs, growing ×1.25 per prestige |
| Hype decay | 0.015/tick (modified by `pu_hype_decay`) |
| Save autosave interval | 15 s |
| Offline progress cap | 8 hours |

An active-play simulation puts the first prestige at roughly **12 minutes**; the curve scales out to dozens of hours for full prestige tree completion.

### Deployment (GitHub Pages)

`.github/workflows/deploy.yml` uses the official `actions/deploy-pages` flow:

1. On push to `main`, the workflow runs `npm ci && npm run build`.
2. It uploads `dist/` as a Pages artifact and deploys it.
3. **One-time setup**: Repo → Settings → Pages → Source: **GitHub Actions**.

`vite.config.js` sets `base: './'` so the built `index.html` works at any subpath, including `https://pizzaherogaming.github.io/EthanMakesIt/`.

## Credits

Built by **Pizza Hero Gaming**. Inspired by **@sendfood**.

Fonts: [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue), [DM Mono](https://fonts.google.com/specimen/DM+Mono), [Inter](https://fonts.google.com/specimen/Inter), [Bungee](https://fonts.google.com/specimen/Bungee), [Outfit](https://fonts.google.com/specimen/Outfit) via Google Fonts.

© 2026 Pizza Hero Gaming. All rights reserved.

- More PHG games: [pizzaherogaming.github.io/PizzaHeroGaming/](https://pizzaherogaming.github.io/PizzaHeroGaming/)
- Discord: [discord.gg/WPsNeR7wyJ](https://discord.gg/WPsNeR7wyJ)
