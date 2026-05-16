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
  // Friends of the channel
  { name: 'tacticizm',       color: '#5dd9c1', weight: 4 },
  { name: 'yourpizzahero',   color: '#ff6b6b', weight: 4 },
  { name: 'theboysquared',   color: '#9ac9ff', weight: 4 },
  { name: 'journeygames',    color: '#ffb56b', weight: 4 },
  { name: 'animeBJ',         color: '#ff7ed1', weight: 4 },
  { name: 'redhead',         color: '#ff5a3c', weight: 4 },
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
  // The mayo running gag — fires occasionally from any random viewer.
  mayo: [
    'needs more mayo',
    'more mayo pls',
    'wheres the mayo',
    'add mayo',
    'mayo would fix it',
    'a little mayo wouldnt hurt',
    'controversial: mayo on that',
    'MAYO',
    'one more dollop of mayo and chef kiss',
    'this slaps but mayo would slap harder',
    'okay but where mayo',
    'genuinely begging for mayo here',
    'cant believe theres no mayo on this',
  ],
  // @sendfood is Ethan — the creator chatting back to his own audience.
  sendfood: [
    'yall ready for this one',
    'thanks for hanging out',
    'real ones know',
    'shoutout the chat',
    'next video drops sunday',
    'wait til you see whats next',
    'kitchens cooking tonight',
    'this is the one',
    'appreciate every single one of you',
    'okay one more recipe and then im eating',
    'small batch tonight, big batch tomorrow',
    'follow for more',
    'we will get there',
    'no notes from me — clip it',
    'first time trying this on stream lol',
    'recipe in the description as always',
    'who needs seconds',
    'tell me what to make next',
    'gonna film one more clip then call it',
    'low key proud of this one',
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
  // ~6% chance any random viewer drops the mayo bit, regardless of context.
  if (Math.random() < 0.06) {
    text = pickComment('mayo');
  } else if (v.name === 'sendfood' && Math.random() < 0.85) {
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
