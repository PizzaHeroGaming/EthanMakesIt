// Reactive game state using Svelte 5 runes.
// Components that read gs.G.money etc. re-render automatically on change.

export function DEFAULT_G() {
  return {
    money: 0,
    subs: 0,
    views: 0,
    level: 1,
    xp: 0,
    xpNeeded: 220,
    hype: 0,
    prestiges: 0,
    totalCooks: 0,
    totalFilmed: 0,
    totalEdits: 0,
    totalMealsServed: 0,
    mealStock: 0,
    mealsSpoiled: 0,
    tick: 0,
    mx: { xp: 1, sub: 1, view: 1, speed: 1, money: 1 },
    mealQueue: [],
    ownedUpgrades: [],
    doneMilestones: [],
    managers: [],
    prestigeUpgrades: {},
    cloutPoints: 0,
    totalCloutEarned: 0,
    activeCookId: null,
    stallWasUnlocked: false,
    actionTimers: {},
    actionLevels: {}, // map of action id -> level (default 1)
  };
}

export const gs = $state({
  G: DEFAULT_G(),

  // Non-persistent UI state
  currentTab: 'actions',
  ethanBob: 0,
  ethanBobDir: 1,

  // Unlock tracking
  prevUnlockedActions: new Set(),
  prevUnlockedUpgrades: new Set(),

  // Income tracker
  incomeBaseline: 0,
  incomeBaselineTime: Date.now(),
  smoothedIncome: 0,

  // Stall
  stallCustomers: [],
  custIdCounter: 0,
  stallTotalEarned: 0,
  mealIdCounter: 0,

  // Tutorial
  tutStep: 0,

  // Ticker
  tickIdx: 0,

  // Buy-amount mode for action levels
  buyMode: (() => { try { return localStorage.getItem('ethanBuyMode') || 'x1'; } catch (e) { return 'x1'; } })(),

  // Prestige modal snapshots
  _pmodCloutSnapshot: 0,
  _pmodPUSnapshot: {},
  _pmodPrestiges: 0,
  _pmodCloutEarned: 0,
  prestigeModalOpen: false,

  // Theme
  theme: (() => { try { return localStorage.getItem('ethanTheme') || 'light'; } catch (e) { return 'light'; } })(),

  // Menu / overlays
  menuOpen: false,
  menuResetConfirmOpen: false,
  sidebarResetConfirmOpen: false,
  tutorialOpen: true,

  // Notifications & floating numbers
  notifications: [], // {id, msg, cls}
  floats: [], // {id, x, y, text, cls}
  achievements: [], // {id, name, reward} — big center popups for milestones
  pulses: {}, // map of stat key -> timestamp (for counter scale-punch)
});

// Animation-frame timers live outside the reactive state.
export const activeTimers = {};
export let stallSpawnTimer = null;
export function setStallSpawnTimer(t) { stallSpawnTimer = t; }
export function getStallSpawnTimer() { return stallSpawnTimer; }

let nextNotifId = 1;
let nextFloatId = 1;

export function pushNotification(msg, cls = '') {
  const id = nextNotifId++;
  gs.notifications.push({ id, msg, cls });
  setTimeout(() => {
    const i = gs.notifications.findIndex((n) => n.id === id);
    if (i !== -1) gs.notifications.splice(i, 1);
  }, 3200);
}

export function pushFloat(text, x, y, cls = 'green') {
  const id = nextFloatId++;
  gs.floats.push({ id, x, y, text, cls });
  setTimeout(() => {
    const i = gs.floats.findIndex((f) => f.id === id);
    if (i !== -1) gs.floats.splice(i, 1);
  }, 1100);
}

export function pulseStat(key) {
  gs.pulses[key] = Date.now();
}

let nextAchId = 1;
export function pushAchievement(name, reward) {
  const id = nextAchId++;
  gs.achievements.push({ id, name, reward });
  setTimeout(() => {
    const i = gs.achievements.findIndex((a) => a.id === id);
    if (i !== -1) gs.achievements.splice(i, 1);
  }, 3600);
}
