// Fake YouTube live-chat content. Pools of viewers + comments by category.
// Chat.svelte picks lines based on the current game state.

export const VIEWERS = [
  // The friend who inspired the game — appears often.
  { name: 'sendfood',        color: '#f5c842', vip: true, weight: 8 },
  // Regulars
  { name: 'cookielover',     color: '#c47ad9' },
  { name: 'kitchen_dad',     color: '#5db8e0' },
  { name: 'flavortown',      color: '#f08a3c' },
  { name: 'midnight_chef',   color: '#9b88ff' },
  { name: 'hungryghost',     color: '#94a0bd' },
  { name: 'PanQueen',        color: '#ff7eb1' },
  { name: 'umamiagain',      color: '#7adba0' },
  { name: 'sauce.boss',      color: '#ff9c5b' },
  { name: 'notachef',        color: '#a8b3ca' },
  { name: 'bigappetite',     color: '#ffd97a' },
  { name: 'breakfast_enj',   color: '#7ec5ff' },
  { name: 'recipebox',       color: '#52c07a' },
  { name: 'lurkingbtw',      color: '#7a85a0' },
  { name: 'first_comment',   color: '#e0a8ff' },
  { name: 'CulinaryCarl',    color: '#d4a824' },
  { name: 'PanFried',        color: '#ff8a8a' },
  { name: 'ChefDad42',       color: '#52c0c8' },
];

// Comments grouped by trigger context.
export const COMMENTS = {
  ambient: [
    'first',
    'gm ethan',
    'watching live',
    'finally home, time to chill',
    'comfort viewing',
    'anyone else binging the whole playlist',
    'just subscribed',
    'this stream is the best part of my day',
    'tell me you cook for a living without telling me',
    'lurking',
    'you got the best edits on this app',
    'whats the playlist song',
    'second day in a row checking in',
    'love the vibe',
    'always smooth',
  ],
  cook: [
    'looks amazing 🤤',
    'im hungry now',
    'send some pls',
    'recipe drop when',
    'that plating tho',
    'i can smell it from here',
    'drooling fr',
    'okay chef',
    'this >>> restaurant',
    'this is making me eat my keyboard',
  ],
  cook_eggs: [
    'eggs gang',
    'breakfast supremacy',
    'scrambled or bust',
    'add butter add butter add butter',
  ],
  cook_pasta: [
    'carbonara hype',
    'no cream right? respect',
    'i need pasta now',
    'pls drop the sauce recipe',
  ],
  cook_stirfry: [
    'wok hei moment',
    'that sizzle audio 👌',
    'beef stir fry slaps',
  ],
  cook_sushi: [
    'sushi?? when did this happen',
    'knife skills 🔥',
    'rice game looking elite',
  ],
  cook_wellington: [
    'wellington in a youtube short?? icon',
    'no way this is one take',
    'three days of prep for 30s of footage',
  ],
  cook_ramen: [
    'wagyu ramen i cannot',
    'the broth deserves its own channel',
    '$200 of ingredients let him cook',
  ],
  film_clip: [
    'lighting today is great',
    'mic quality is so clean',
    'whats your camera setup',
    'cinematic',
  ],
  edit_video: [
    'edits are wild',
    'jump cuts crisp',
    'whoever cuts these deserves a raise',
    'the SFX 😭',
  ],
  thumbnail: [
    'love the new thumbnail style',
    'CTR speedrun',
    'photoshop legend',
  ],
  promote: [
    'shared with my whole feed',
    'told my friends',
    'algorithm cant ignore this',
    'manifesting 100k',
  ],
  collab: [
    'CROSSOVER EPISODE',
    'wait who is that',
    'two foodtubers one kitchen',
    'collab arc starting',
  ],
  sponsorship: [
    'is this an ad?',
    'sponsored but i forgive him',
    'they actually pay you??',
    'pls take the bag king',
    'brand deal hes officially big',
  ],
  merch: [
    'where do i buy the apron',
    'shipping to UK?',
    'merch dropped omg',
    'gimme that mug',
  ],
  viral_video: [
    '🚀🚀🚀',
    'WE GOING VIRAL',
    'MY GUY',
    'i was here before it blew up',
    'tagging everyone i know',
    '🔥🔥🔥 the trending tab is coming',
  ],
  buy_groceries: [
    'restock arc',
    'whats in the cart this week',
    'protein protein protein',
  ],
  // Big celebrations — used when a milestone fires
  milestone: [
    'HUGE 🎉',
    'congrats ethan',
    'we made it',
    'historic stream',
    '🥳🥳🥳',
    'this calls for cake',
  ],
  // @sendfood-specific banter
  sendfood: [
    'love u brotha',
    'okay im stealing the recipe ngl',
    'when we collabing again',
    'this is the move',
    'GOATED meal',
    'plate me up next',
    'imma try this tonight',
  ],
};

let chatIdCounter = 1;

export function pickViewer() {
  // Weighted pick — sendfood appears more often than the rest.
  const total = VIEWERS.reduce((s, v) => s + (v.weight || 1), 0);
  let r = Math.random() * total;
  for (const v of VIEWERS) {
    r -= v.weight || 1;
    if (r <= 0) return v;
  }
  return VIEWERS[0];
}

export function pickComment(category) {
  const pool = COMMENTS[category] || COMMENTS.ambient;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function makeMessage(category, viewer) {
  const v = viewer || pickViewer();
  let text;
  if (v.name === 'sendfood' && Math.random() < 0.5) {
    text = pickComment('sendfood');
  } else {
    text = pickComment(category);
  }
  return {
    id: chatIdCounter++,
    name: v.name,
    color: v.color,
    text,
    vip: !!v.vip,
  };
}
