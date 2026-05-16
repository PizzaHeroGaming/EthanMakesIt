// Shared mutable game state. Modules import { state } and access state.G.*
// to keep references live across the prestige reset (which reassigns G).

export const DEFAULT_G = () => ({
  money: 10,
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
  unlockedActions: [],
  unlockedUpgrades: [],
});

export const state = {
  G: DEFAULT_G(),
  activeTimers: {},
  currentTab: 'actions',
  ethanBob: 0,
  ethanBobDir: 1,

  // Unlock tracking
  prevUnlockedActions: new Set(),
  prevUnlockedUpgrades: new Set(),

  // Income tracker (EMA)
  incomeBaseline: 10,
  incomeBaselineTime: Date.now(),
  smoothedIncome: 0,

  // Stall
  stallCustomers: [],
  custIdCounter: 0,
  stallSpawnTimer: null,
  stallTickTimer: null,
  stallTotalEarned: 0,
  mealIdCounter: 0,

  // Prestige modal snapshots
  _pmodCloutSnapshot: 0,
  _pmodPUSnapshot: {},
  _pmodPrestiges: 0,
  _pmodCloutEarned: 0,

  // Tutorial
  tutStep: 0,

  // Ticker
  tickIdx: 0,
};
