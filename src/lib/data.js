// Static game data: actions, upgrades, milestones, prestige tree, titles, etc.

export const ACTIONS = [
  {
    id: 'cook_eggs', name: 'Cook Eggs', icon: '🍳', color: 'green',
    baseTime: 6000, desc: 'Scramble some eggs. The classic beginner move.',
    earn: 'XP +12, Hype +1',
    unlockAt: { level: 1 }, baseLevelCost: 1,
    reward(G) { G.xp += Math.floor(12 * G.mx.xp); G.hype = Math.min(100, G.hype + 1); },
  },
  {
    id: 'buy_groceries', name: 'Buy Groceries', icon: '🛒', color: 'gold',
    baseTime: 8000, desc: 'Restock the pantry. Better ingredients mean better videos.',
    earn: 'Hype +6, XP +5',
    unlockAt: { level: 1, totalCooks: 3 }, baseLevelCost: 3,
    reward(G) { G.hype = Math.min(100, G.hype + 6); G.xp += Math.floor(5 * G.mx.xp); },
    managerCost: 250, managerName: 'Delivery Service',
  },
  {
    id: 'film_clip', name: 'Film a Clip', icon: '📱', color: 'blue',
    baseTime: 12000, desc: 'Point a phone at the stove and press record. No ring light yet.',
    earn: 'Subs +1–2, XP +10',
    unlockAt: { level: 1, totalCooks: 5 }, baseLevelCost: 5,
    reward(G) { const s = Math.max(1, Math.floor((1 + G.level * 0.2) * G.mx.sub * (1 + G.hype / 250))); G.subs += s; const fv = Math.max(2, Math.floor(s * 8 * G.mx.view)); G.views += fv; G.xp += Math.floor(10 * G.mx.xp); },
    managerCost: 350, managerName: 'Camera Intern',
  },
  {
    id: 'edit_video', name: 'Edit Video', icon: '✂️', color: 'blue',
    baseTime: 18000, desc: 'Trim the dead air, add a title card, slap on some royalty-free music.',
    earn: 'Views +30–120, Money, XP +3',
    unlockAt: { level: 1, totalFilmed: 3 }, baseLevelCost: 10,
    reward(G) { const v = Math.max(8, Math.floor((30 + G.subs * 0.04) * G.mx.view * (1 + G.hype / 120))); G.views += v; G.money += Math.max(0.005, v * 0.0003 * (1 + G.level * 0.04)); G.xp += Math.floor(3 * G.mx.xp); },
    managerCost: 500, managerName: 'Video Editor',
  },
  {
    id: 'cook_pasta', name: 'Pasta Carbonara', icon: '🍝', color: 'green',
    baseTime: 9000, desc: 'Level 2 recipe. Rich, indulgent, and you nailed it on the third attempt.',
    earn: 'XP +22, Hype +4',
    unlockAt: { level: 2 }, baseLevelCost: 15,
    reward(G) { G.xp += Math.floor(22 * G.mx.xp); G.hype = Math.min(100, G.hype + 4); },
  },
  {
    id: 'promote', name: 'Promote Channel', icon: '📣', color: 'gold',
    baseTime: 16000, desc: 'Post to socials, reply to comments, beg friends to subscribe.',
    earn: 'Subs +3–10, Hype +8',
    unlockAt: { subs: 10 }, baseLevelCost: 25,
    reward(G) { const s = Math.max(1, Math.floor((2 + G.level * 0.4) * G.mx.sub * (1 + G.hype / 150))); G.subs += s; const pv = Math.max(3, Math.floor(s * 5 * G.mx.view)); G.views += pv; G.hype = Math.min(100, G.hype + 8); },
    managerCost: 700, managerName: 'Social Manager',
  },
  {
    id: 'thumbnail', name: 'Design Thumbnail', icon: '🎨', color: 'blue',
    baseTime: 20000, desc: 'A compelling thumbnail doubles your click-through rate. Time well spent.',
    earn: 'Views boost, Hype +10',
    unlockAt: { level: 2, totalEdits: 3 }, baseLevelCost: 40,
    reward(G) { const v = Math.max(30, Math.floor((150 + G.subs * 0.08) * G.mx.view * (1 + G.hype / 90))); G.views += v; G.hype = Math.min(100, G.hype + 10); G.money += v * 0.0006; },
    managerCost: 800, managerName: 'Design Intern',
  },
  {
    id: 'cook_stirfry', name: 'Beef Stir Fry', icon: '🥩', color: 'green',
    baseTime: 12000, desc: 'Level 3 recipe. Sizzling wok, bold flavors, confident technique.',
    earn: 'XP +40, Hype +7',
    unlockAt: { level: 3 }, baseLevelCost: 60,
    reward(G) { G.xp += Math.floor(40 * G.mx.xp); G.hype = Math.min(100, G.hype + 7); },
  },
  {
    id: 'collab', name: 'Collab with Creator', icon: '🤝', color: 'purple',
    baseTime: 35000, desc: 'Film with another YouTuber. Cross-promotion and fresh audience exposure.',
    earn: 'Subs +30–120, Big views boost',
    unlockAt: { subs: 75, level: 3 }, baseLevelCost: 150,
    reward(G) { const s = Math.max(8, Math.floor((20 + G.level * 4) * G.mx.sub * (1 + G.hype / 120))); G.subs += s; const v = Math.max(60, Math.floor((300 + G.subs * 0.12) * G.mx.view)); G.views += v; G.money += v * 0.0007; },
    managerCost: 2000, managerName: 'Collab Coordinator',
  },
  {
    id: 'sponsorship', name: 'Land a Sponsorship', icon: '💼', color: 'gold',
    baseTime: 55000, desc: 'Pitch to brands. One yes changes your whole financial picture.',
    earn: '$60–250, Hype +12',
    unlockAt: { subs: 300, level: 4 }, baseLevelCost: 300,
    reward(G) { const m = (60 + G.level * 10) * (1 + G.hype / 100); G.money += m; G.hype = Math.min(100, G.hype + 12); G.xp += Math.floor(35 * G.mx.xp); },
    managerCost: 4000, managerName: 'Brand Agent',
  },
  {
    id: 'cook_sushi', name: 'Sushi Rolls', icon: '🍣', color: 'green',
    baseTime: 15000, desc: 'Level 5 recipe. Precision craft, beautiful presentation — viewers go wild.',
    earn: 'XP +80, Hype +12',
    unlockAt: { level: 5 }, baseLevelCost: 500,
    reward(G) { G.xp += Math.floor(80 * G.mx.xp); G.hype = Math.min(100, G.hype + 12); },
  },
  {
    id: 'cook_wellington', name: 'Beef Wellington', icon: '🥩', color: 'green',
    baseTime: 20000, desc: 'Level 6 recipe. Three days of prep, one perfect shot. The ultimate flex.',
    earn: 'XP +150, Hype +18',
    unlockAt: { level: 6 }, baseLevelCost: 1200,
    reward(G) { G.xp += Math.floor(150 * G.mx.xp); G.hype = Math.min(100, G.hype + 18); },
  },
  {
    id: 'merch', name: 'Launch Merch Store', icon: '👕', color: 'gold',
    baseTime: 65000, desc: 'Aprons, mugs, Ethan-branded everything. Fans become walking billboards.',
    earn: '$120–500 passive, Subs +20',
    unlockAt: { subs: 1000, level: 7 }, baseLevelCost: 2500,
    reward(G) { const m = (120 + G.subs * 0.01) * (1 + G.hype / 100); G.money += m; const ms = Math.floor(20 * G.mx.sub); G.subs += ms; G.views += Math.max(10, Math.floor(ms * 12 * G.mx.view)); },
    managerCost: 6500, managerName: 'Merch Manager',
  },
  {
    id: 'cook_ramen', name: 'Wagyu Ramen', icon: '🍜', color: 'green',
    baseTime: 25000, desc: 'Level 8 recipe. $200 of ingredients, 6 hours of filming. This one breaks the internet.',
    earn: 'XP +280, Hype +25',
    unlockAt: { level: 8 }, baseLevelCost: 6000,
    reward(G) { G.xp += Math.floor(280 * G.mx.xp); G.hype = Math.min(100, G.hype + 25); },
  },
  {
    id: 'viral_video', name: 'Chase a Viral Moment', icon: '🔥', color: 'purple',
    baseTime: 90000, desc: 'Go all-in. Rent a studio, hire a crew, stake it all on one perfect video.',
    earn: 'Subs +600–4000, Views explode',
    unlockAt: { subs: 5000, level: 9 }, baseLevelCost: 18000,
    reward(G) { const s = Math.max(100, Math.floor((300 + G.level * 20) * G.mx.sub * (1 + G.hype / 100))); G.subs += s; const v = Math.max(1500, Math.floor((6000 + G.subs) * G.mx.view)); G.views += v; G.money += v * 0.001; G.hype = Math.min(100, G.hype + 28); },
    managerCost: 15000, managerName: 'Viral Strategist',
  },
];

export const UPGRADES_DEF = [
  { id: 'ug1',  name: 'Better Knife Set',         icon: '🔪', cost: 40,    desc: 'Cook XP x1.5',                unlockAt: { level: 1 },                  effect(G) { G.mx.xp *= 1.5; } },
  { id: 'ug2',  name: 'Ring Light',               icon: '💡', cost: 80,    desc: 'Sub gain x1.3',               unlockAt: { level: 1, totalFilmed: 1 },  effect(G) { G.mx.sub *= 1.3; } },
  { id: 'ug3',  name: 'Lavalier Mic',             icon: '🎙️', cost: 150,  desc: 'View gain x1.5',              unlockAt: { level: 2 },                  effect(G) { G.mx.view *= 1.5; } },
  { id: 'ug4',  name: 'Faster Cutting Technique', icon: '⚡', cost: 250,   desc: 'All speed x1.3',              unlockAt: { level: 2 },                  effect(G) { G.mx.speed *= 1.3; } },
  { id: 'ug5',  name: 'DSLR Camera',              icon: '📷', cost: 400,   desc: 'Sub & view gain x1.5',        unlockAt: { level: 3, subs: 25 },        effect(G) { G.mx.sub *= 1.5; G.mx.view *= 1.5; } },
  { id: 'ug6',  name: 'Adobe Premiere Pro',       icon: '🎬', cost: 600,   desc: 'Speed x1.5, view gain x1.5',  unlockAt: { level: 3, totalEdits: 5 },   effect(G) { G.mx.speed *= 1.5; G.mx.view *= 1.5; } },
  { id: 'ug7',  name: 'Meal Prep System',         icon: '📦', cost: 500,   desc: 'Cook XP x2, speed x1.2',      unlockAt: { level: 4 },                  effect(G) { G.mx.xp *= 2; G.mx.speed *= 1.2; } },
  { id: 'ug8',  name: 'YouTube SEO Course',       icon: '📊', cost: 800,   desc: 'Sub gain x1.5',               unlockAt: { level: 4, subs: 100 },       effect(G) { G.mx.sub *= 1.5; } },
  { id: 'ug9',  name: 'Studio Kitchen Upgrade',   icon: '🏗️', cost: 1800, desc: 'XP, sub & view gain x1.25',   unlockAt: { level: 5 },                  effect(G) { G.mx.xp *= 1.25; G.mx.sub *= 1.25; G.mx.view *= 1.25; } },
  { id: 'ug10', name: 'Sponsorship Deck',         icon: '📋', cost: 2500,  desc: 'Money from actions x3',       unlockAt: { level: 5, subs: 300 },       effect(G) { G.mx.money *= 3; } },
  { id: 'ug11', name: 'Drone Camera',             icon: '🚁', cost: 4000,  desc: 'View gain x3',                unlockAt: { level: 6, subs: 600 },       effect(G) { G.mx.view *= 3; } },
  { id: 'ug12', name: 'Hired Videographer',       icon: '🎥', cost: 6000,  desc: 'All speed x2',                unlockAt: { level: 7 },                  effect(G) { G.mx.speed *= 2; } },
  { id: 'ug13', name: 'Brand Partnership',        icon: '🤝', cost: 8000,  desc: 'Sub gain x1.5, money x1.5',   unlockAt: { level: 7, subs: 1000 },      effect(G) { G.mx.sub *= 1.5; G.mx.money *= 1.5; } },
  { id: 'ug14', name: 'Food Network Appearance',  icon: '📺', cost: 15000, desc: 'All multipliers x1.5',        unlockAt: { level: 9, subs: 4000 },      effect(G) { G.mx.xp *= 1.5; G.mx.sub *= 1.5; G.mx.view *= 1.5; G.mx.speed *= 1.5; } },
  { id: 'ug15', name: 'Netflix Deal',             icon: '🎭', cost: 50000, desc: 'Everything x3',               unlockAt: { level: 12, subs: 40000 },    effect(G) { G.mx.xp *= 3; G.mx.sub *= 3; G.mx.view *= 3; G.mx.speed *= 3; } },
  { id: 'ug_autocook', name: 'Auto-Cook Station', icon: '🤖', cost: 350,   desc: 'Install a timer system in the kitchen — lets you set one recipe to loop automatically.', unlockAt: { level: 3, totalCooks: 25 }, effect() {} },
];

export const MILESTONES_DEF = [
  { id: 'ms1',  name: 'First Meal Cooked',               check: (G) => G.totalCooks >= 1,     reward: 'XP +20' },
  { id: 'ms2',  name: 'First Video Filmed',              check: (G) => G.totalFilmed >= 1,    reward: 'Hype +10' },
  { id: 'ms3',  name: 'First 10 Subscribers',            check: (G) => G.subs >= 10,          reward: 'Sub gain x1.2' },
  { id: 'ms4',  name: 'First $100 Earned',               check: (G) => G.money >= 100,        reward: 'Money gain x1.2' },
  { id: 'ms5',  name: 'First 100 Subscribers',           check: (G) => G.subs >= 100,         reward: 'View gain x1.2' },
  { id: 'ms6',  name: 'Level 3 Chef',                    check: (G) => G.level >= 3,          reward: 'Speed x1.1' },
  { id: 'ms7',  name: '2,000 Total Views',               check: (G) => G.views >= 2000,       reward: 'Sub gain x1.3' },
  { id: 'ms8',  name: '500 Subscribers',                 check: (G) => G.subs >= 500,         reward: 'All x1.2' },
  { id: 'ms9',  name: '100 Recipes Cooked',              check: (G) => G.totalCooks >= 100,   reward: 'Cook speed x1.5' },
  { id: 'ms10', name: 'Level 5 Chef',                    check: (G) => G.level >= 5,          reward: 'XP gain x1.5' },
  { id: 'ms11', name: '15,000 Views',                    check: (G) => G.views >= 15000,      reward: 'View gain x1.5' },
  { id: 'ms12', name: 'First $500 Earned',               check: (G) => G.money >= 500,        reward: 'Income x1.5' },
  { id: 'ms13', name: '5,000 Subscribers!',              check: (G) => G.subs >= 5000,        reward: 'All x1.5' },
  { id: 'ms14', name: 'Level 9 Chef',                    check: (G) => G.level >= 9,          reward: 'All x1.5' },
  { id: 'ms15', name: '500,000 Views',                   check: (G) => G.views >= 500000,     reward: 'View gain x2' },
  { id: 'ms16', name: '5,000,000 Subscribers — Go Viral!', check: (G) => G.subs >= 5000000,      reward: 'Prestige unlocked' },
];

// Milestone reward effects — applied when milestone first completes AND on every reapplyUpgrades.
export function applyMilestoneRewards(G, id) {
  if (id === 'ms3') G.mx.sub *= 1.2;
  if (id === 'ms4') G.mx.money *= 1.2;
  if (id === 'ms5') G.mx.view *= 1.2;
  if (id === 'ms6') G.mx.speed *= 1.1;
  if (id === 'ms7') G.mx.sub *= 1.15;
  if (id === 'ms8') { G.mx.xp *= 1.1; G.mx.sub *= 1.1; G.mx.view *= 1.1; }
  if (id === 'ms9') G.mx.speed *= 1.2;
  if (id === 'ms10') G.mx.xp *= 1.3;
  if (id === 'ms11') G.mx.view *= 1.3;
  if (id === 'ms12') G.mx.money *= 1.25;
  if (id === 'ms13') { G.mx.xp *= 1.2; G.mx.sub *= 1.2; G.mx.view *= 1.2; }
  if (id === 'ms14') { G.mx.xp *= 1.2; G.mx.sub *= 1.2; G.mx.view *= 1.2; G.mx.speed *= 1.2; }
  if (id === 'ms15') G.mx.view *= 1.5;
}

export const PRESTIGE_UPGRADES = [
  {
    id: 'pu_start_money', name: 'Seed Funding', icon: '💸',
    desc: 'Begin each run with more starting money.',
    tiers: [
      { cost: 5,   effect: 'Start with $50' },
      { cost: 18,  effect: 'Start with $200' },
      { cost: 60,  effect: 'Start with $750' },
      { cost: 150, effect: 'Start with $3,000' },
    ],
  },
  {
    id: 'pu_start_subs', name: 'Loyal Base', icon: '👥',
    desc: 'Begin each run with existing subscribers.',
    tiers: [
      { cost: 6,   effect: 'Start with 50 subs' },
      { cost: 22,  effect: 'Start with 250 subs' },
      { cost: 70,  effect: 'Start with 1,000 subs' },
      { cost: 180, effect: 'Start with 5,000 subs' },
    ],
  },
  {
    id: 'pu_speed', name: 'Muscle Memory', icon: '⚡',
    desc: 'Permanent ×1.15 action speed per tier.',
    tiers: [
      { cost: 8,   effect: 'Speed ×1.15' },
      { cost: 25,  effect: 'Speed ×1.32' },
      { cost: 70,  effect: 'Speed ×1.52' },
      { cost: 160, effect: 'Speed ×1.75' },
    ],
  },
  {
    id: 'pu_xp_gain', name: 'Culinary Instincts', icon: '🎓',
    desc: 'Permanent ×1.2 XP gain per tier.',
    tiers: [
      { cost: 6,  effect: 'XP ×1.2' },
      { cost: 20, effect: 'XP ×1.44' },
      { cost: 60, effect: 'XP ×1.73' },
    ],
  },
  {
    id: 'pu_sub_gain', name: 'Viral DNA', icon: '🧬',
    desc: 'Permanent ×1.2 subscriber gain per tier.',
    tiers: [
      { cost: 10,  effect: 'Subs ×1.2' },
      { cost: 30,  effect: 'Subs ×1.44' },
      { cost: 90,  effect: 'Subs ×1.73' },
      { cost: 200, effect: 'Subs ×2.07' },
    ],
  },
  {
    id: 'pu_view_gain', name: 'Algorithm Whisperer', icon: '📊',
    desc: 'Permanent ×1.2 view gain per tier.',
    tiers: [
      { cost: 8,  effect: 'Views ×1.2' },
      { cost: 25, effect: 'Views ×1.44' },
      { cost: 70, effect: 'Views ×1.73' },
    ],
  },
  {
    id: 'pu_money_gain', name: 'Monetization Expert', icon: '💰',
    desc: 'Permanent ×1.2 money gain per tier.',
    tiers: [
      { cost: 10,  effect: 'Money ×1.2' },
      { cost: 35,  effect: 'Money ×1.44' },
      { cost: 100, effect: 'Money ×1.73' },
    ],
  },
  {
    id: 'pu_hype_decay', name: 'Brand Recognition', icon: '📣',
    desc: 'Hype decays 20% slower per tier.',
    tiers: [
      { cost: 8,  effect: 'Hype decay ×0.80' },
      { cost: 28, effect: 'Hype decay ×0.64' },
      { cost: 80, effect: 'Hype decay ×0.51' },
    ],
  },
  {
    id: 'pu_start_level', name: 'Chef Prodigy', icon: '👨‍🍳',
    desc: 'Begin each run at a higher Chef Level.',
    tiers: [
      { cost: 25,  effect: 'Start at Level 2' },
      { cost: 80,  effect: 'Start at Level 3' },
      { cost: 200, effect: 'Start at Level 5' },
    ],
  },
  {
    id: 'pu_stall_unlock', name: 'Food Truck Veteran', icon: '🚚',
    desc: 'Unlock the food stall after fewer cooks.',
    tiers: [
      { cost: 12,  effect: 'Stall unlocks after 5 cooks' },
      { cost: 40,  effect: 'Stall unlocks after 2 cooks' },
      { cost: 110, effect: 'Stall unlocks after 1st cook' },
    ],
  },
  {
    id: 'pu_stall_price', name: 'Premium Branding', icon: '🏷️',
    desc: 'Meals sell for more at the stall.',
    tiers: [
      { cost: 10, effect: 'Meal price ×1.2' },
      { cost: 32, effect: 'Meal price ×1.44' },
      { cost: 90, effect: 'Meal price ×1.73' },
    ],
  },
  {
    id: 'pu_freshness', name: 'Food Safety Pro', icon: '🌡️',
    desc: 'Meals stay fresh longer before spoiling.',
    tiers: [
      { cost: 10, effect: 'Freshness ×1.25' },
      { cost: 32, effect: 'Freshness ×1.56' },
      { cost: 90, effect: 'Freshness ×1.95' },
    ],
  },
  {
    id: 'pu_manager_disc', name: 'Industry Connections', icon: '🤝',
    desc: 'Managers cost 20% less per tier.',
    tiers: [
      { cost: 15,  effect: 'Managers 20% cheaper' },
      { cost: 50,  effect: 'Managers 36% cheaper' },
      { cost: 140, effect: 'Managers 49% cheaper' },
    ],
  },
];

export const TITLES = [
  [1, 'Aspiring Cook'], [2, 'Home Chef'], [3, 'Recipe Tester'], [4, 'Content Creator'],
  [5, 'Food Blogger'], [6, 'Food Influencer'], [7, 'YouTube Chef'], [8, 'Trending Creator'],
  [9, 'Food Icon'], [10, 'Culinary Legend'], [12, 'Internet Chef'], [15, 'Culinary Empire'],
];

export const TICKERS = [
  'keep cooking, ethan. the algorithm loves consistency.',
  'ethan stirs the pot... literally and figuratively.',
  'one viral video changes everything.',
  'salt, fat, acid, heat — and good lighting.',
  '"this video took 3 days to make" — ethan, probably.',
  'consistency beats perfection, every time.',
  'the subscribe button is right there, viewers...',
  'ethan checks his analytics at 2am again.',
  'a food youtuber must eat their mistakes.',
];

export const COOK_IDS = ['cook_eggs', 'cook_pasta', 'cook_stirfry', 'cook_sushi', 'cook_wellington', 'cook_ramen'];
export const MAX_MEAL_STOCK = 12;

// Per-action level scaling. Output multiplier = level * milestone bonuses.
// Cost of level N = baseLevelCost * LEVEL_COST_GROWTH^(N-1).
export const LEVEL_COST_GROWTH = 1.12;

// Per-action milestone breakpoints (× 1.5 multiplier each when reached).
export const ACTION_LEVEL_MILESTONES = [25, 100, 400, 1600, 6400];

// Compute current multiplier for an action at a given level.
// sqrt scaling keeps long-term leveling meaningful without exponential firehose.
export function actionLevelMultiplier(level) {
  if (level <= 0) return 0;
  let mult = Math.sqrt(level);
  for (const ms of ACTION_LEVEL_MILESTONES) {
    if (level >= ms) mult *= 1.5;
  }
  return mult;
}

// Cost to buy levels from currentLevel+1 to currentLevel+qty.
export function actionLevelCost(baseCost, currentLevel, qty) {
  const g = LEVEL_COST_GROWTH;
  // sum baseCost * g^(currentLevel + k) for k in 0..qty-1
  // = baseCost * g^currentLevel * (g^qty - 1) / (g - 1)
  return baseCost * Math.pow(g, currentLevel) * (Math.pow(g, qty) - 1) / (g - 1);
}

// How many levels can be afforded with budget.
export function maxAffordableLevels(baseCost, currentLevel, budget) {
  if (budget <= 0) return 0;
  const g = LEVEL_COST_GROWTH;
  const start = baseCost * Math.pow(g, currentLevel);
  if (start > budget) return 0;
  // Solve baseCost * g^currentLevel * (g^qty - 1) / (g - 1) <= budget
  // => g^qty <= 1 + budget * (g - 1) / (baseCost * g^currentLevel)
  const ratio = 1 + (budget * (g - 1)) / start;
  return Math.max(0, Math.floor(Math.log(ratio) / Math.log(g)));
}

export const MANAGER_META = {
  buy_groceries: { animClass: 'anim-slide',  animIcon: '🛵', role: 'Restocks pantry automatically' },
  film_clip:     { animClass: 'anim-blink',  animIcon: '📹', role: 'Keeps the camera rolling' },
  edit_video:    { animClass: 'anim-snip',   animIcon: '✂️', role: 'Edits footage on loop' },
  promote:       { animClass: 'anim-bounce', animIcon: '📲', role: 'Runs social media non-stop' },
  thumbnail:     { animClass: 'anim-swing',  animIcon: '🎨', role: 'Designs thumbnails continuously' },
  collab:        { animClass: 'anim-pulse',  animIcon: '🤝', role: 'Books collabs while you cook' },
  sponsorship:   { animClass: 'anim-bob',    animIcon: '💼', role: 'Pitches brands on your behalf' },
  merch:         { animClass: 'anim-spin',   animIcon: '👕', role: 'Runs the merch store 24/7' },
  viral_video:   { animClass: 'anim-fire',   animIcon: '🔥', role: 'Chases virality around the clock' },
};

export const CUSTOMER_POOL = [
  { name: 'Alex', emoji: '🧑' }, { name: 'Sam', emoji: '👩' }, { name: 'Jordan', emoji: '👨' },
  { name: 'Riley', emoji: '🧑‍💼' }, { name: 'Casey', emoji: '👩‍🦱' }, { name: 'Morgan', emoji: '🧔' },
  { name: 'Taylor', emoji: '👩‍🦳' }, { name: 'Drew', emoji: '🧑‍🎤' }, { name: 'Quinn', emoji: '🧕' },
  { name: 'Blair', emoji: '👱' }, { name: 'Reese', emoji: '🧑‍🍳' }, { name: 'Jamie', emoji: '🧑‍💻' },
];

export const ORDER_LINES = [
  'smells amazing from outside', 'saw it on your channel', 'friend recommended you',
  'been waiting all week', 'this is my lunch break', 'huge fan btw',
  'finally found your stall!', 'just one more please', 'can I get two?',
];
