// Captain edition: drone. See /tmp/claude-0/brief3.md.
//
// The Drone Village replaces the Fairy Village (scene key `fairy`, level 5):
// an airfield with hangars, a control tower, landing pads and charging
// stations, where drones and engineers ask the spelling questions. Each one
// gives a helper buddy (CAPTAIN_BUDDIES) that flies along after the robot,
// like the fairy friend does, and fairy dust becomes ⚡ batteries.
//
// The top level only touches data.js tables (tools/tts-phrases.js loads
// this file in node); everything that draws lives inside functions.

// Helper buddies that fly along beside the hero's head. The `fairy` flag
// means they come from the Drone Village, like FAIRIES. `body`, `trim`, `eye`
// and `glow` colour the sprite; `glow` also tints the light and the sparks.
const CAPTAIN_BUDDIES = {
  none:   { name: '없음',       icon: '' },
  quad:   { name: '쿼드 드론',   icon: '🚁', fairy: true, price: 10, body: '#4fa8ff', trim: '#ffd34d', eye: '#7ff0ff', glow: '#9fdcff' },
  ufo:    { name: '꼬마 UFO',    icon: '🛸', fairy: true, price: 10, body: '#b4bed2', trim: '#7fff9f', eye: '#3a3550', glow: '#b8ffcc' },
  dog:    { name: '로봇 강아지', icon: '🐶', fairy: true, price: 10, body: '#eef2f8', trim: '#ff9a3c', eye: '#3a3550', glow: '#ffd0a0' },
  bee:    { name: '꿀벌 드론',   icon: '🐝', fairy: true, price: 10, body: '#ffd34d', trim: '#ff6f8a', eye: '#7ff0ff', glow: '#fff0a0' },
  rocket: { name: '꼬마 로켓',   icon: '🚀', fairy: true, price: 10, body: '#f4f6fa', trim: '#ff5a5a', eye: '#3a3550', glow: '#ffb070' },
  owl:    { name: '부엉이 로봇', icon: '🦉', fairy: true, price: 10, body: '#9a84e8', trim: '#ffd34d', eye: '#7ff0ff', glow: '#d0c0ff' },
};

if (isCaptain()) {
  // The game reads its little flying friends from FAIRIES, so in the captain
  // edition that table holds the buddies instead.
  for (const k of Object.keys(FAIRIES)) delete FAIRIES[k];
  Object.assign(FAIRIES, CAPTAIN_BUDDIES);

  // Engineers are ordinary villagers in work clothes; drones are drawn by
  // droneNpcSprite (see the `draw` hook in villagerSprite).
  Object.assign(LOOKS, {
    droneDoc:  { hair: '#eceaf4', shirt: '#ffffff', pants: '#5a7ab8', hat: 'goggles' },
    droneMech: { hair: '#7a4a2e', shirt: '#ff9a3c', pants: '#3f6fb8', hat: 'hardhat' },
    droneQuad: { draw: (k, f) => droneNpcSprite(k, f) },
    droneBee:  { draw: (k, f) => droneNpcSprite(k, f) },
    droneOwl:  { draw: (k, f) => droneNpcSprite(k, f) },
  });
  // `gives` is the buddy each villager offers first.
  FAIRY_NPCS.splice(0, FAIRY_NPCS.length,
    { name: '드론 박사',   look: 'droneDoc',  gives: 'ufo',  c: 14, r: 3 },
    { name: '쿼디',        look: 'droneQuad', gives: 'quad', c: 6,  r: 9 },
    { name: '붕붕 드론',   look: 'droneBee',  gives: 'bee',  c: 19, r: 9 },
    { name: '부엉이 로봇', look: 'droneOwl',  gives: 'owl',  c: 15, r: 18 },
    { name: '정비사 볼트', look: 'droneMech', gives: 'dog',  c: 6,  r: 18 },
  );
  Object.assign(VOICES, {
    droneDoc:  { gender: 'male',   tts: 'bm_george', pitch: 0.95, rate: 0.95, voice: ['Daniel', 'Google UK English Male', 'Microsoft George'] },
    droneQuad: { gender: 'male',   tts: 'am_puck',   lift: 1.12, pitch: 1.5, rate: 1.05, voice: ['Fred', 'Alex', 'Microsoft Guy'] },
    droneBee:  { gender: 'female', tts: 'af_sky',    lift: 1.15, pitch: 1.6, rate: 1.05, voice: ['Zoe', 'Allison', 'Microsoft Ana'] },
    droneOwl:  { gender: 'male',   tts: 'bm_fable',  pitch: 0.9,  rate: 0.9,  voice: ['Daniel', 'Google UK English Male', 'Microsoft Ryan'] },
    droneMech: { gender: 'female', tts: 'af_river',  pitch: 1.2,  rate: 1.0,  voice: ['Samantha', 'Google US English', 'Microsoft Aria'] },
  });
  Object.assign(PERSONA, {
    droneDoc:  ['Welcome to Drone Village, {title} {name}! I build all the drones here.', 'Ah, {title} {name}! My drones love clever spellers.', "Hello, young engineer! Let's build a word, one letter at a time."],
    droneQuad: ["Beep beep! Hello, {title} {name}! I'm Quaddy!", 'Whirr! I just zoomed around the tower. Want to spell with me?', 'Hi! All four of my propellers are spinning for you!'],
    droneBee:  ['Buzz buzz! Hi, {title} {name}! I am a bee drone!', 'Zip zip! I fly from flower to flower. Ready to spell?', 'Hello! Every word is as sweet as honey.'],
    droneOwl:  ['Hoo hoo! Good day, {title} {name}!', 'Hoo! I watch the sky with my big camera eyes. Shall we spell?', 'Hello there! A wise robot owl loves a good word.'],
    droneMech: ['Hi there, {title} {name}! I fix the drones with my big wrench.', 'Clang, clang! All fixed! Now here is a word for you to spell.', "Hello! Let's put a word together, just like building a robot."],
  });
  Object.assign(LINES, {
    fairyland: ['Welcome to Drone Village!', 'Look up! Drones are zooming everywhere!', 'Beep boop! The drones are waiting for you.'],
    newFairy: ['A little helper wants to fly with you! Shall it come along?', 'This buddy would love to be your sidekick! Shall it come with you?', 'Zoom zoom! A new helper buddy for you! Shall it come now?'],
  });
  CAPTAIN_SCENES.fairy = () => buildDroneVillage();
  droneBatteryLabel();
}

// Fairy dust is ⚡ batteries here: the counter shows a bolt.
function droneBatteryLabel() {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('dust');
  if (!el) return;
  el.title = '배터리';
  el.firstElementChild.textContent = '⚡';
}

// ---- Pixel sprites ------------------------------------------------------------

const DRONE_INK = '#33304f';
const DRONE_METAL = '#8a94a8';
const DRONE_DARK = '#5a6478';
const DRONE_SCREEN = '#24304a';
const DRONE_BLUR = '#d4e4f6';

// A little pixel grid drawn with a dark outline round everything, like the
// fairy and monster sprites. paint(g) fills it with g.set / g.rect / g.disc;
// after g.soft = true, pixels go on a layer under the outline that gets none
// (rotor blur, flames). A colour may be a function (x, y) => colour.
function droneGrid(W, H, paint) {
  const body = [];
  const soft = [];
  for (let y = 0; y < H; y++) { body.push(new Array(W).fill(null)); soft.push(new Array(W).fill(null)); }
  const g = { soft: false };
  g.set = (x, y, col) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    (g.soft ? soft : body)[y][x] = typeof col === 'function' ? col(x, y) : col;
  };
  g.rect = (x, y, w, h, col) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g.set(x + i, y + j, col); };
  g.disc = (cx, cy, rx, ry, col) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) g.set(x, y, col);
    }
  };
  paint(g);
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  const near = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => body[y + dy] && body[y + dy][x + dx]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (body[y][x]) px(ctx, x, y, 1, 1, body[y][x]);
    else if (near(x, y)) px(ctx, x, y, 1, 1, DRONE_INK);
    else if (soft[y][x]) px(ctx, x, y, 1, 1, soft[y][x]);
  }
  return cv;
}

// Rounded shading: lighter towards the top left of a disc centred at (cx, cy).
const droneShade = (col, cx, cy, rx, ry) => (x, y) => {
  const l = -((x + 0.5 - cx) / rx) * 0.5 - ((y + 0.5 - cy) / ry) * 0.8;
  return l > 0.45 ? shade(col, 28) : l < -0.55 ? shade(col, -28) : col;
};

// Each buddy painted on a 17 x 14 grid, centred on column 8. Frame 1 moves
// the propellers, wings or flame.
const DRONE_BUDDY_PAINT = {
  quad(g, b, f) {
    g.soft = true;
    if (f) for (const [x, y] of [[0, 3], [1, 2], [3, 2], [4, 1], [12, 1], [13, 2], [15, 2], [16, 3]]) g.set(x, y, DRONE_BLUR);
    else { g.rect(0, 2, 5, 1, DRONE_BLUR); g.rect(12, 2, 5, 1, DRONE_BLUR); }
    g.soft = false;
    g.rect(2, 3, 1, 2, DRONE_DARK);
    g.rect(14, 3, 1, 2, DRONE_DARK);
    g.rect(3, 5, 3, 1, DRONE_METAL);
    g.rect(11, 5, 3, 1, DRONE_METAL);
    g.disc(8.5, 7.2, 3.8, 3.3, droneShade(b.body, 8.5, 7.2, 3.8, 3.3));
    g.rect(6, 6, 5, 3, DRONE_SCREEN);
    g.set(7, 7, b.eye);
    g.set(9, 7, b.eye);
    g.rect(6, 10, 5, 1, b.trim);
    g.set(8, 3, DRONE_METAL);
    g.set(8, 2, b.trim);
    g.set(6, 11, DRONE_DARK);
    g.set(10, 11, DRONE_DARK);
    g.rect(5, 12, 3, 1, DRONE_DARK);
    g.rect(9, 12, 3, 1, DRONE_DARK);
  },
  ufo(g, b, f) {
    g.disc(8.5, 6.5, 3.3, 3.8, (x, y) => (x === 6 && y === 4 ? '#ffffff' : '#bff0ff'));
    g.set(7, 6, b.eye);
    g.set(9, 6, b.eye);
    g.set(8, 2, DRONE_METAL);
    g.set(8, 1, b.trim);
    g.disc(8.5, 9, 8.2, 2.3, droneShade(b.body, 8.5, 9, 8.2, 2.3));
    for (const x of [2, 5, 8, 11, 14]) g.set(x, 9, (x + f * 3) % 2 ? b.trim : '#ffffff');
    g.rect(6, 11, 5, 1, shade(b.body, -40));
  },
  dog(g, b, f) {
    g.soft = true;
    g.rect(f ? 7 : 5, 0, f ? 3 : 7, 1, DRONE_BLUR);
    g.soft = false;
    g.set(8, 1, b.trim);
    g.set(8, 2, DRONE_METAL);
    g.rect(5, 3, 7, 6, droneShade(b.body, 8.5, 6, 4.5, 3));
    g.rect(4, 4, 9, 4, droneShade(b.body, 8.5, 6, 4.5, 3));
    g.rect(2, 4, 2, 4, b.trim);
    g.rect(13, 4, 2, 4, b.trim);
    g.rect(6, 5, 2, 2, b.eye);
    g.rect(9, 5, 2, 2, b.eye);
    g.set(6, 5, '#ffffff');
    g.set(9, 5, '#ffffff');
    g.set(8, 7, b.eye);
    g.set(8, 9, '#ff7f9f');
    g.rect(6, 9, 5, 3, shade(b.body, -18));
    g.set(7, 9, shade(b.body, -18));
    g.set(9, 9, shade(b.body, -18));
    g.set(6, 12, DRONE_DARK);
    g.set(10, 12, DRONE_DARK);
    g.set(12, f ? 9 : 10, b.trim);
  },
  bee(g, b, f) {
    g.soft = true;
    if (f) { g.disc(3.5, 6.5, 2.8, 1.6, DRONE_BLUR); g.disc(13.5, 6.5, 2.8, 1.6, DRONE_BLUR); }
    else { g.disc(4, 4, 2.6, 2.2, DRONE_BLUR); g.disc(13, 4, 2.6, 2.2, DRONE_BLUR); }
    g.soft = false;
    g.set(5, 1, b.trim);
    g.set(11, 1, b.trim);
    g.set(6, 2, '#3a3550');
    g.set(10, 2, '#3a3550');
    g.set(7, 3, '#3a3550');
    g.set(9, 3, '#3a3550');
    g.disc(8.5, 8, 4.6, 4.2, (x, y) => (y === 8 || y === 10 ? '#3a3550' : droneShade(b.body, 8.5, 8, 4.6, 4.2)(x, y)));
    g.rect(6, 5, 5, 2, DRONE_SCREEN);
    g.set(7, 5, b.eye);
    g.set(9, 5, b.eye);
    g.set(7, 12, '#3a3550');
    g.set(9, 12, '#3a3550');
  },
  rocket(g, b, f) {
    g.soft = true;
    if (f) { g.rect(7, 11, 3, 1, '#ffe066'); g.set(8, 12, '#ffb347'); }
    else { g.rect(7, 11, 3, 2, '#ffb347'); g.set(8, 13, '#ffe066'); g.set(8, 11, '#ffe066'); }
    g.soft = false;
    g.set(8, 0, b.trim);
    g.rect(7, 1, 3, 2, b.trim);
    g.rect(6, 3, 5, 7, (x, y) => (x === 6 ? shade(b.body, 10) : x === 10 ? shade(b.body, -30) : b.body));
    g.rect(7, 4, 3, 3, '#bff0ff');
    g.set(7, 5, b.eye);
    g.set(9, 5, b.eye);
    g.rect(4, 8, 2, 3, b.trim);
    g.rect(11, 8, 2, 3, b.trim);
    g.rect(7, 10, 3, 1, DRONE_DARK);
  },
  owl(g, b, f) {
    const wing = shade(b.body, -35);
    if (f) { g.rect(1, 4, 3, 2, wing); g.rect(13, 4, 3, 2, wing); }
    else { g.rect(2, 6, 2, 4, wing); g.rect(13, 6, 2, 4, wing); }
    g.disc(8.5, 7.5, 5, 5.2, droneShade(b.body, 8.5, 7.5, 5, 5.2));
    g.disc(8.5, 10.2, 3, 2.2, shade(b.body, 30));
    g.set(4, 2, b.trim);
    g.set(12, 2, b.trim);
    g.disc(6.5, 6.5, 1.9, 1.9, '#e8eef8');
    g.disc(10.5, 6.5, 1.9, 1.9, '#e8eef8');
    g.set(6, 6, b.eye);
    g.set(10, 6, b.eye);
    g.set(8, 8, '#ffb347');
    g.set(8, 9, '#e08a2a');
    g.set(6, 13, '#ffb347');
    g.set(10, 13, '#ffb347');
  },
};

// A helper buddy, anchored at its middle: { canvas, ax, ay }.
const droneBuddyCache = new Map();
function captainBuddySprite(key, frame) {
  const ck = `${key}|${frame}`;
  if (droneBuddyCache.has(ck)) return droneBuddyCache.get(ck);
  const b = CAPTAIN_BUDDIES[key] && CAPTAIN_BUDDIES[key].body ? CAPTAIN_BUDDIES[key] : CAPTAIN_BUDDIES.quad;
  const paint = DRONE_BUDDY_PAINT[key] || DRONE_BUDDY_PAINT.quad;
  const sprite = { canvas: droneGrid(17, 14, g => paint(g, b, frame)), ax: 8, ay: 7 };
  droneBuddyCache.set(ck, sprite);
  return sprite;
}

// Draws a buddy centred on (x, y) at time t (ms), propellers turning.
function drawCaptainBuddy(ctx, x, y, buddyKey, t, flip = false) {
  drawFlying(ctx, captainBuddySprite(buddyKey, Math.floor(t / 110) % 2), x, y, flip);
}

// Drone villagers on a 20 x 34 grid like the other villagers, standing (or
// hovering) on row 31. Quaddy and the bee drone float; the owl stands.
const DRONE_NPC_PAINT = {
  droneQuad(g) {
    const body = '#4fa8ff';
    g.soft = true;
    g.rect(0, 9, 6, 1, DRONE_BLUR);
    g.rect(14, 9, 6, 1, DRONE_BLUR);
    g.soft = false;
    g.rect(2, 10, 2, 2, DRONE_DARK);
    g.rect(16, 10, 2, 2, DRONE_DARK);
    g.rect(3, 12, 4, 2, DRONE_METAL);
    g.rect(13, 12, 4, 2, DRONE_METAL);
    g.rect(9, 9, 2, 3, DRONE_METAL);
    g.rect(9, 8, 2, 1, '#ffd34d');
    g.disc(10, 17, 6.3, 5.3, droneShade(body, 10, 17, 6.3, 5.3));
    g.rect(6, 14, 8, 6, DRONE_SCREEN);
    g.rect(7, 15, 2, 2, '#7ff0ff');
    g.rect(11, 15, 2, 2, '#7ff0ff');
    g.set(7, 18, '#7ff0ff');
    g.rect(8, 19, 4, 1, '#7ff0ff');
    g.set(12, 18, '#7ff0ff');
    g.rect(6, 21, 8, 1, '#ffd34d');
    g.rect(6, 22, 1, 2, DRONE_DARK);
    g.rect(13, 22, 1, 2, DRONE_DARK);
    g.rect(4, 24, 5, 1, DRONE_DARK);
    g.rect(11, 24, 5, 1, DRONE_DARK);
  },
  droneBee(g) {
    const body = '#ffd34d';
    const stripe = '#3a3550';
    g.soft = true;
    g.disc(3.8, 11.5, 3.6, 2.7, DRONE_BLUR);
    g.disc(16.2, 11.5, 3.6, 2.7, DRONE_BLUR);
    g.soft = false;
    g.set(6, 5, '#ff6f8a');
    g.set(13, 5, '#ff6f8a');
    g.set(7, 6, stripe);
    g.set(12, 6, stripe);
    g.set(8, 7, stripe);
    g.set(11, 7, stripe);
    g.disc(10, 20.5, 6, 5, (x, y) => (y === 20 || y === 23 ? stripe : droneShade(body, 10, 20.5, 6, 5)(x, y)));
    g.disc(10, 12.5, 5.3, 4.3, droneShade(body, 10, 12.5, 5.3, 4.3));
    g.rect(6, 11, 8, 3, DRONE_SCREEN);
    g.rect(7, 11, 2, 2, '#7ff0ff');
    g.rect(11, 11, 2, 2, '#7ff0ff');
    g.rect(9, 13, 2, 1, '#7ff0ff');
    g.set(5, 14, '#ff9ec4');
    g.set(14, 14, '#ff9ec4');
    g.rect(8, 25, 1, 2, stripe);
    g.rect(11, 25, 1, 2, stripe);
  },
  droneOwl(g) {
    const body = '#9a84e8';
    const wing = shade(body, -35);
    g.soft = true;
    g.rect(4, 6, 12, 1, DRONE_BLUR);
    g.soft = false;
    g.rect(9, 7, 2, 1, '#ffd34d');
    g.rect(9, 8, 2, 2, DRONE_METAL);
    g.rect(2, 18, 2, 7, wing);
    g.rect(16, 18, 2, 7, wing);
    g.disc(10, 19.5, 7, 8.6, droneShade(body, 10, 19.5, 7, 8.6));
    g.disc(10, 24, 4.5, 3.8, shade(body, 32));
    for (const y of [22, 24, 26]) for (const x of [8, 11]) g.set(x, y, shade(body, 10));
    g.rect(4, 10, 2, 2, '#ffd34d');
    g.rect(14, 10, 2, 2, '#ffd34d');
    g.disc(7, 16, 2.7, 2.7, '#e8eef8');
    g.disc(13, 16, 2.7, 2.7, '#e8eef8');
    g.rect(6, 15, 2, 2, DRONE_SCREEN);
    g.rect(12, 15, 2, 2, DRONE_SCREEN);
    g.set(7, 16, '#7ff0ff');
    g.set(13, 16, '#7ff0ff');
    g.rect(9, 18, 2, 2, '#ffb347');
    g.rect(9, 20, 2, 1, '#e08a2a');
    g.rect(6, 28, 3, 2, '#ffb347');
    g.rect(11, 28, 3, 2, '#ffb347');
  },
};

const droneNpcCache = new Map();
function droneNpcSprite(lookKey, frame) {
  const ck = `${lookKey}|${frame}`;
  if (droneNpcCache.has(ck)) return droneNpcCache.get(ck);
  const paint = DRONE_NPC_PAINT[lookKey] || DRONE_NPC_PAINT.droneQuad;
  const sprite = { canvas: droneGrid(20, 34, paint), ax: 10, ay: lookKey === 'droneOwl' ? 30 : 31 };
  droneNpcCache.set(ck, sprite);
  return sprite;
}

// Engineer hats: a yellow hard hat, and flying goggles pushed up on the head.
function droneHats() {
  if (typeof HATS === 'undefined' || HATS.hardhat) return;
  Object.assign(HATS, {
    hardhat: { x: 2, y: -3, rows: ['....oooo....', '..oottttoo..', '.ottwttttto.', '.otttttttto.', 'oYYYYYYYYYYo'] },
    goggles: { x: 3, y: 1, rows: ['.ooo..ooo.', 'oyAyooyAyo', 'oyyyooyyyo', '.ooo..ooo.'] },
  });
}
if (isCaptain()) droneHats();

// ---- Drone Village scenery ----------------------------------------------------

// Mown airfield lawn in light and dark stripes.
function drawDroneTurf(ctx, ox, oy, c, r) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const n = hash(x, y, 5);
    if (n < 0.04) return '#b8f090';
    if (n < 0.08) return '#6cbc5c';
    return (c + r) % 2 ? '#8ed872' : '#84cf68';
  });
}
function drawDroneTarmac(ctx, ox, oy) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const n = hash(x, y, 6);
    return n < 0.06 ? '#9aa2b4' : n < 0.11 ? '#727a8e' : '#848ca0';
  });
}
function drawDroneApron(ctx, ox, oy) {
  fillPoly(ctx, diamondPts(ox, oy), stonePattern('#dfe4ee', '#b0bacb', ['#e6eaf2', '#dbe1eb', '#eef1f6', '#d6dce8'], 12));
}

// A round landing pad painted on the ground: a yellow ring and a big H.
function drawDronePad(ctx, cx, cy, R, ring = '#ffd34d') {
  cx = Math.round(cx);
  cy = Math.round(cy);
  for (let y = -R / 2; y <= R / 2; y++) for (let x = -R; x <= R; x++) {
    const d = Math.sqrt((x / R) ** 2 + (y / (R / 2)) ** 2);
    if (d > 1) continue;
    px(ctx, cx + x, cy + y, 1, 1, d > 0.92 ? '#4a5266' : d > 0.74 && d < 0.84 ? ring : '#646e84');
  }
  const h = Math.round(R * 0.22);
  px(ctx, cx - h - 2, cy - h, 2, h * 2, '#ffffff');
  px(ctx, cx + h, cy - h, 2, h * 2, '#ffffff');
  px(ctx, cx - h, cy - 1, h * 2, 2, '#ffffff');
}

// A box floating `h0` pixels above the footprint k, `H` tall.
function droneBox(ctx, k, h0, H, side, top, front) {
  const up = p => ({ x: p.x, y: p.y - h0 });
  return drawFurnitureBox(ctx, { T: up(k.T), R: up(k.R), B: up(k.B), L: up(k.L) }, H, side, top, front);
}

// A drone hangar: white walls, a striped roll-up door, round windows and a
// little landing pad on the flat roof. (cx, cy) is the middle of its footprint.
function drawDroneHangar(ctx, sc, c, r, trim) {
  const k = boxCorners(sc, c, r, 2, 2);
  const H = 30;
  const { WL, WR } = drawFurnitureBox(ctx, k, H, '#e4e9f2', '#cfd6e2', '#f4f6fa');
  wallRect(ctx, WL, 0, WL.len, H - 5, H, trim);
  wallRect(ctx, WR, 0, WR.len, H - 5, H, shade(trim, -20));
  // Roll-up door.
  const m = WL.len / 2;
  wallRect(ctx, WL, m - 12, m + 12, 0, 21, shade(trim, -50));
  wallRect(ctx, WL, m - 11, m + 11, 0, 20, '#aeb8c8');
  for (let v = 2; v < 20; v += 3) wallRect(ctx, WL, m - 11, m + 11, v, v + 1, '#8a94a8');
  wallRect(ctx, WL, m - 3, m + 3, 1, 2, '#ffd34d');
  // Round windows and a drone painted on the side.
  for (const x of [6, WR.len - 10]) {
    wallRect(ctx, WR, x, x + 5, 12, 18, DRONE_DARK);
    wallRect(ctx, WR, x + 1, x + 4, 13, 17, '#9fe4ff');
    wallRect(ctx, WR, x + 1, x + 2, 15, 17, '#ffffff');
  }
  const d = WR.len / 2;
  wallRect(ctx, WR, d - 4, d + 4, 13, 17, trim);
  wallRect(ctx, WR, d - 8, d - 5, 18, 19, trim);
  wallRect(ctx, WR, d + 5, d + 8, 18, 19, trim);
  // Roof pad and a parapet light.
  const mid = { x: (k.L.x + k.R.x) / 2, y: (k.T.y + k.B.y) / 2 - H };
  drawDronePad(ctx, mid.x, mid.y, 14, trim);
  px(ctx, Math.round(k.T.x) - 1, Math.round(k.T.y) - H - 5, 2, 5, DRONE_METAL);
  px(ctx, Math.round(k.T.x) - 1, Math.round(k.T.y) - H - 7, 2, 2, '#ff5a5a');
}

// A lab with a big observatory dome, a sliding door and an antenna.
function drawDroneLab(ctx, sc, c, r, trim) {
  const k = boxCorners(sc, c, r, 2, 2);
  const H = 22;
  const { WL, WR } = drawFurnitureBox(ctx, k, H, '#e4e9f2', '#cfd6e2', '#f4f6fa');
  wallRect(ctx, WL, 0, WL.len, H - 4, H, trim);
  wallRect(ctx, WR, 0, WR.len, H - 4, H, shade(trim, -20));
  const m = WL.len / 2;
  wallRect(ctx, WL, m - 7, m + 7, 0, 16, DRONE_DARK);
  wallRect(ctx, WL, m - 6, m, 0, 15, '#9fe4ff');
  wallRect(ctx, WL, m, m + 6, 0, 15, '#7fd0f0');
  for (let x = 5; x < WR.len - 6; x += 9) {
    wallRect(ctx, WR, x, x + 5, 8, 14, DRONE_DARK);
    wallRect(ctx, WR, x + 1, x + 4, 9, 13, '#9fe4ff');
  }
  // Dome: shaded columns with a dark slit up the middle.
  const cx = Math.round((k.L.x + k.R.x) / 2);
  const cy = Math.round((k.T.y + k.B.y) / 2 - H);
  const R = 20;
  for (let x = -R; x <= R; x++) {
    const s = Math.sqrt(Math.max(0, 1 - (x / R) ** 2));
    const top = Math.round(cy - s * 22);
    const bot = Math.round(cy + s * R * 0.45);
    const col = x < -R * 0.4 ? '#ffffff' : x > R * 0.5 ? '#b8c2d4' : '#dfe5ef';
    px(ctx, cx + x, top, 1, bot - top, col);
    px(ctx, cx + x, top, 1, 1, DRONE_INK);
    if (Math.abs(x) <= 2) px(ctx, cx + x, top + 2, 1, Math.round(s * 16), x === 0 ? '#2a3550' : '#3a4a6a');
  }
  px(ctx, cx - R, cy, 2 * R + 1, 2, shade(trim, -30));
  // Antenna with a tiny dish.
  px(ctx, cx + 12, cy - 30, 1, 14, DRONE_METAL);
  px(ctx, cx + 9, cy - 32, 7, 2, '#e8eef8');
  px(ctx, cx + 11, cy - 34, 3, 2, '#e8eef8');
  px(ctx, cx + 12, cy - 36, 1, 2, '#ff5a5a');
}

// The control tower in the middle, drawn without its radar dish (which turns).
function drawDroneTower(ctx, sc) {
  const base = boxCorners(sc, 12, 12, 2, 2);
  droneBox(ctx, base, 0, 12, '#cfd6e2', '#eef1f6', '#e0e6ee');
  const shaft = boxCorners(sc, 12.6, 12.6, 0.8, 0.8);
  const { WL, WR } = droneBox(ctx, shaft, 12, 48, '#dfe5ef', '#ffffff', '#f4f6fa');
  for (const W of [WL, WR]) for (let v = 6; v < 48; v += 14) wallRect(ctx, W, 0, W.len, v, v + 5, W === WL ? '#ff9a3c' : '#e88a30');
  const cab = boxCorners(sc, 12.1, 12.1, 1.8, 1.8);
  const glass = droneBox(ctx, cab, 58, 16, '#5fb8e8', '#3a4a6a', '#7fd0f8');
  for (const W of [glass.WL, glass.WR]) {
    wallRect(ctx, W, 0, W.len, 0, 2, '#3a4a6a');
    for (let x = 0; x <= W.len; x += 7) wallRect(ctx, W, x, x + 1, 0, 16, '#3a4a6a');
    wallRect(ctx, W, 2, W.len - 2, 10, 12, '#bff0ff');
  }
  const roof = boxCorners(sc, 11.95, 11.95, 2.1, 2.1);
  droneBox(ctx, roof, 74, 3, '#3a4a6a', '#5a6a8a', '#4a5a7a');
}

// The radar dish on top of the tower swings round; the beacon blinks.
function drawDroneRadar(ctx, x, y, t) {
  px(ctx, x, y, 1, 6, DRONE_METAL);
  const a = Math.cos(t * 1.6);
  const w = Math.max(1, Math.round(Math.abs(a) * 7));
  px(ctx, x - w, y - 3, w * 2 + 1, 3, a > 0 ? '#ffffff' : '#c8d0dc');
  px(ctx, x - w, y - 1, w * 2 + 1, 1, '#9aa4b8');
  px(ctx, x + Math.round(Math.sin(t * 1.6) * 3), y - 5, 1, 2, DRONE_DARK);
  px(ctx, x - 1, y - 8, 2, 2, Math.sin(t * 4) > 0 ? '#ff4a4a' : '#8a2a3a');
}

// A charging station: a dark post with a battery gauge and a lightning bolt.
function drawDroneCharger(ctx, sc, c, r, t) {
  const k = boxCorners(sc, c + 0.25, r + 0.25, 0.5, 0.5);
  const { WL, WR } = drawFurnitureBox(ctx, k, 28, '#c8d2e2', '#ffffff', '#eef2f8');
  const m = WL.len / 2;
  wallRect(ctx, WL, 0, WL.len, 24, 28, '#4fa8ff');
  wallRect(ctx, WR, 0, WR.len, 24, 28, '#3f88d8');
  wallRect(ctx, WL, m - 3, m + 3, 5, 21, DRONE_INK);
  wallRect(ctx, WL, m - 2, m + 2, 6, 20, DRONE_SCREEN);
  for (let i = 0; i < 3; i++) wallRect(ctx, WL, m - 2, m + 2, 7 + i * 4, 10 + i * 4, '#7fff9f');
  wallRect(ctx, WL, m - 1, m + 1, 21, 22, DRONE_INK);
  // A coiled cable on the side.
  for (let v = 4; v < 18; v += 2) wallRect(ctx, WR, 3, 6, v, v + 1, '#3a4a6a');
  // A big bolt sign on top.
  const p = { x: Math.round((k.L.x + k.R.x) / 2), y: Math.round(k.T.y) - 28 };
  const bolt = ['...ooo', '..oyyo', '.oyyo.', 'oyyyyo', 'oyyyo.', '.oyyo.', '.oyo..', '.oo...'];
  bolt.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') px(ctx, p.x - 3 + i, p.y - 8 + j, 1, 1, ch === 'y' ? '#ffd34d' : DRONE_INK); }));
}

// A striped radio mast with a dish halfway up.
function drawDroneMast(ctx, x, y) {
  for (let v = 0; v < 50; v++) {
    const col = Math.floor(v / 8) % 2 ? '#ffffff' : '#ff5a5a';
    px(ctx, x - 2, y - v, 1, 1, col);
    px(ctx, x + 2, y - v, 1, 1, col);
    if (v % 6 === 0) px(ctx, x - 2, y - v, 5, 1, DRONE_METAL);
    else px(ctx, x + ((v % 6) < 3 ? -1 : 1), y - v, 1, 1, DRONE_METAL);
  }
  px(ctx, x + 3, y - 34, 5, 7, '#e8eef8');
  px(ctx, x + 3, y - 34, 1, 7, '#b8c2d4');
  px(ctx, x - 1, y - 53, 3, 3, '#ff4a4a');
}

// A white wind turbine; the blades turn (drawn each frame).
function drawDroneTurbineMast(ctx, x, y) {
  ctx.fillStyle = 'rgba(40,30,60,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let v = 0; v < 46; v++) {
    const w = v < 20 ? 3 : 2;
    px(ctx, x - 1, y - v, w, 1, '#f4f6fa');
    px(ctx, x - 1, y - v, 1, 1, '#d0d8e4');
  }
  px(ctx, x - 2, y - 49, 5, 4, '#e8eef8');
  px(ctx, x - 2, y - 46, 5, 1, '#b8c2d4');
}
function drawDroneBlades(ctx, x, y, t) {
  for (let i = 0; i < 3; i++) {
    const a = t * 1.8 + i * Math.PI * 2 / 3;
    for (let s = 2; s <= 15; s++) {
      const bx = Math.round(x + Math.cos(a) * s);
      const by = Math.round(y + Math.sin(a) * s);
      px(ctx, bx, by, 1, 1, s > 12 ? '#ff5a5a' : '#ffffff');
      px(ctx, bx, by + 1, 1, 1, '#b8c2d4');
    }
  }
  px(ctx, x - 1, y - 1, 3, 3, DRONE_METAL);
}

// A solar panel on a stand, tilted up to the sky.
function drawDroneSolar(ctx, x, y) {
  ctx.fillStyle = 'rgba(40,30,60,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, x - 6, y - 10, 2, 10, DRONE_DARK);
  px(ctx, x + 5, y - 14, 2, 14, DRONE_DARK);
  const pts = [{ x: x - 15, y: y - 13 }, { x: x + 1, y: y - 27 }, { x: x + 15, y: y - 20 }, { x: x - 1, y: y - 6 }];
  fillPoly(ctx, pts.map(p => ({ x: p.x, y: p.y + 2 })), '#c8d2e2');
  fillPoly(ctx, pts, (px2, py2) => ((px2 + 2 * py2) % 6 === 0 || (py2 - px2 * 0.875) % 7 < 1 ? '#8fc8ff' : '#2f5fb0'));
  px(ctx, x - 5, y - 18, 2, 1, '#ffffff');
}

// Wooden crates of spare parts, one with a gear stencilled on.
function drawDroneCrates(ctx, sc, c, r) {
  const a = boxCorners(sc, c + 0.05, r + 0.15, 0.55, 0.6);
  drawFurnitureBox(ctx, a, 11, '#c8905a', '#e0a878', '#b07a48');
  const b = boxCorners(sc, c + 0.5, r + 0.45, 0.45, 0.45);
  const { WL } = drawFurnitureBox(ctx, b, 9, '#c8905a', '#e0a878', '#b07a48');
  const t = boxCorners(sc, c + 0.15, r + 0.25, 0.4, 0.4);
  droneBox(ctx, t, 11, 9, '#4fa8ff', '#8fd0ff', '#3f88d8');
  wallRect(ctx, WL, 3, 7, 3, 7, '#7a4a30');
  wallRect(ctx, WL, 4, 6, 4, 6, '#e0a878');
}

// A big orange cargo drone parked on (or hovering `h` above) a landing pad.
// `spin` picks how the propeller blur lies.
function drawCargoDrone(ctx, x, y, h, spin, col = '#ff9a3c') {
  x = Math.round(x);
  y = Math.round(y - h);
  const arms = [[-14, -10], [14, -10], [-14, -2], [14, -2]];
  if (h < 4) for (const dx of [-6, 6]) px(ctx, x + dx, y - 6, 1, 6, DRONE_DARK);
  px(ctx, x - 8, y - 1, 6, 1, DRONE_DARK);
  px(ctx, x + 3, y - 1, 6, 1, DRONE_DARK);
  for (const [dx, dy] of arms) {
    const ax = x + dx;
    const ay = y + dy - 6;
    for (let i = 0; i <= 10; i++) px(ctx, Math.round(x + dx * i / 14), Math.round(y - 9 + (dy + 6) * i / 14), 2, 1, DRONE_METAL);
    px(ctx, ax - 1, ay, 3, 3, DRONE_DARK);
    ctx.fillStyle = 'rgba(70,80,110,0.45)';
    if (spin) ctx.fillRect(ax - 7, ay - 1, 15, 1);
    else { ctx.fillRect(ax - 4, ay - 2, 9, 1); ctx.fillRect(ax - 6, ay - 1, 3, 1); ctx.fillRect(ax + 4, ay - 1, 3, 1); }
  }
  // Body: a rounded box with a camera eye.
  for (let j = -6; j <= 4; j++) {
    const w = j < -4 || j > 2 ? 7 : 9;
    px(ctx, x - w, y - 9 + j, w * 2 + 1, 1, j < -2 ? shade(col, 26) : j > 1 ? shade(col, -30) : col);
  }
  px(ctx, x - 10, y - 13, 1, 7, DRONE_INK);
  px(ctx, x + 10, y - 13, 1, 7, DRONE_INK);
  px(ctx, x - 7, y - 16, 15, 1, DRONE_INK);
  px(ctx, x - 7, y - 4, 15, 1, DRONE_INK);
  px(ctx, x - 4, y - 12, 9, 4, DRONE_SCREEN);
  px(ctx, x - 3, y - 11, 2, 2, '#7ff0ff');
  px(ctx, x + 2, y - 11, 2, 2, '#7ff0ff');
  px(ctx, x - 1, y - 18, 3, 2, '#ffd34d');
}

// A racing gate for drones: two striped poles and a light bar between the
// ground points A (left) and B (right), with blinking coloured lights.
function drawDroneGate(ctx, A, B, t = 0) {
  const H = 44;
  for (const P of [A, B]) {
    const x = Math.round(P.x);
    const y = Math.round(P.y);
    ctx.fillStyle = 'rgba(40,30,60,0.18)';
    ctx.beginPath();
    ctx.ellipse(x, y, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let v = 0; v < H; v++) px(ctx, x - 2, y - v, 4, 1, Math.floor(v / 5) % 2 ? '#3a3550' : '#ffd34d');
    px(ctx, x - 2, y - H, 1, H, 'rgba(255,255,255,0.35)');
  }
  const x0 = Math.round(A.x);
  const x1 = Math.round(B.x);
  const cols = ['#ff5a8a', '#5fd0ff', '#ffd34d', '#7fff9f'];
  for (let x = x0 - 2; x <= x1 + 2; x++) {
    const u = (x - x0) / Math.max(1, x1 - x0);
    const y = Math.round(A.y + (B.y - A.y) * u - H);
    px(ctx, x, y - 4, 1, 6, '#3a4a6a');
    px(ctx, x, y - 3, 1, 4, '#5a6a8a');
    if ((x - x0) % 4 === 1) px(ctx, x, y - 2, 1, 2, cols[(Math.floor((x - x0) / 4) + Math.floor(t * 3)) % cols.length]);
  }
}

// ---- Drone Village ------------------------------------------------------------

const DRONE_N = 26;

// The airfield: tarmac runways crossing at the control tower, hangars and
// labs, a launch field with landing pads, and charging stations. The gate
// back to town is on the west edge, where the Fairy Village's was.
function buildDroneVillage() {
  const sc = makeScene('fairy', DRONE_N, DRONE_N, 150, 60);
  sc.outdoor = true;
  const N = DRONE_N;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) setTile(sc, c, r, 'droneturf');
  const reserved = new Set();
  const key = (c, r) => r * N + c;
  const reserve = (c, r) => reserved.add(key(c, r));
  // Runways from the gate and up to Dr. Gizmo's lab, round an apron.
  for (let c = 0; c <= 22; c++) for (const r of [12, 13]) setTile(sc, c, r, 'dronetarmac');
  for (let r = 2; r <= 22; r++) for (const c of [12, 13]) setTile(sc, c, r, 'dronetarmac');
  const onApron = (c, r) => (c - 12.5) ** 2 + (r - 12.5) ** 2 <= 10;
  for (let r = 8; r <= 17; r++) for (let c = 8; c <= 17; c++) if (onApron(c, r)) setTile(sc, c, r, 'droneapron');
  // The launch field where the pond was.
  const inField = (c, r) => ((c - 19) / 4.2) ** 2 + ((r - 19.5) / 3.6) ** 2 <= 1;
  for (let r = 15; r <= 23; r++) for (let c = 14; c <= 23; c++) if (inField(c, r)) setTile(sc, c, r, 'droneapron');
  const pads = [{ c: 17, r: 18.5, R: 20 }, { c: 21, r: 20.5, R: 20 }];

  // Props on single tiles.
  const prop = (c, r, up, draw, w = 32) => {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    return addObject(sc, { c, r, w: 1, d: 1 }, { x: p.x - w / 2, y: p.y - up, w, h: up + 8 }, ctx => draw(ctx, Math.round(p.x), Math.round(p.y)));
  };

  // The control tower in the middle, with a turning radar and a beacon.
  block(sc, 12, 12, 2, 2);
  for (let r = 11; r <= 14; r++) for (let c = 11; c <= 14; c++) reserve(c, r);
  const mid = tileCenter(sc, 12.5, 12.5);
  const tower = addObject(sc, { c: 12, r: 12, w: 2, d: 2 }, { x: mid.x - 40, y: mid.y - 112, w: 80, h: 124 }, ctx => drawDroneTower(ctx, sc));
  const radarAt = { x: Math.round(mid.x), y: Math.round(mid.y) - 8 - 77 - 6 };
  tower.animated = (ctx, t) => {
    ctx.drawImage(tower.canvas, tower.x, tower.y);
    drawDroneRadar(ctx, radarAt.x, radarAt.y, t);
  };
  sc.lamps.push({ x: mid.x, y: mid.y - 72, big: true });
  sc.lamps.push({ x: radarAt.x, y: radarAt.y - 7, small: true });

  // Charging stations and radio masts where the giant flowers grew.
  [[3, 9], [10, 3], [16, 6], [22, 10], [10, 16], [2, 21], [15, 23], [23, 15], [7, 11], [16, 9]].forEach(([c, r], i) => {
    const p = tileCenter(sc, c, r);
    if (i % 2 === 0) {
      prop(c, r, 44, ctx => drawDroneCharger(ctx, sc, c, r));
      sc.lamps.push({ x: p.x, y: p.y - 38, small: true });
    } else {
      prop(c, r, 58, (ctx, x, y) => drawDroneMast(ctx, x, y), 20);
      sc.lamps.push({ x: p.x, y: p.y - 52, small: true });
    }
  });
  // Wind turbines, solar panels and crates of parts.
  [[10, 6], [2, 6], [21, 4], [9, 22], [23, 18], [15, 10]].forEach(([c, r], i) => {
    if (i % 3 === 0) {
      const o = prop(c, r, 52, (ctx, x, y) => drawDroneTurbineMast(ctx, x, y), 34);
      const hub = tileCenter(sc, c, r);
      o.animated = (ctx, t) => {
        ctx.drawImage(o.canvas, o.x, o.y);
        drawDroneBlades(ctx, Math.round(hub.x), Math.round(hub.y) - 47, t + i);
      };
    } else if (i % 3 === 1) prop(c, r, 32, (ctx, x, y) => drawDroneSolar(ctx, x, y));
    else prop(c, r, 30, ctx => drawDroneCrates(ctx, sc, c, r));
  });

  // Hangars and labs on the cottage plots, each on a 2 x 2 footprint.
  for (const [c, r, kind, col] of [[5, 5, 'hangar', '#4fa8ff'], [15, 1, 'lab', '#9a7af0'], [20, 7, 'hangar', '#ff9a3c'], [4, 17, 'lab', '#5fd08a'], [7, 1, 'hangar', '#ff6f8a'], [18, 14, 'hangar', '#5fd08a']]) {
    block(sc, c, r, 2, 2);
    for (let rr = r - 1; rr <= r + 2; rr++) for (let cc = c - 1; cc <= c + 2; cc++) reserve(cc, rr);
    const m = tileCenter(sc, c + 0.5, r + 0.5);
    addObject(sc, { c, r, w: 2, d: 2 }, { x: m.x - 46, y: m.y - 86, w: 92, h: 100 },
      ctx => (kind === 'lab' ? drawDroneLab : drawDroneHangar)(ctx, sc, c, r, col));
    sc.lamps.push({ x: m.x - 12, y: m.y - 12 });
  }

  // Racing gates over the runways: only their poles block the way.
  for (const [a, b] of [[[4, 11], [4, 14]], [[11, 5], [14, 5]], [[11, 19], [14, 19]]]) {
    for (const [c, r] of [a, b]) { block(sc, c, r, 1, 1); reserve(c, r); }
    const pa = tileCenter(sc, a[0], a[1]);
    const pb = tileCenter(sc, b[0], b[1]);
    const L = pa.x < pb.x ? pa : pb;
    const R = pa.x < pb.x ? pb : pa;
    const foot = { c: Math.min(a[0], b[0]), r: Math.min(a[1], b[1]), w: Math.abs(a[0] - b[0]) + 1, d: Math.abs(a[1] - b[1]) + 1 };
    const o = addObject(sc, foot, { x: L.x - 8, y: Math.min(pa.y, pb.y) - 54, w: R.x - L.x + 16, h: Math.abs(pa.y - pb.y) + 62 }, ctx => drawDroneGate(ctx, L, R));
    o.animated = (ctx, t) => drawDroneGate(ctx, L, R, t);
  }

  // A cargo drone parked on one pad; a smaller one hops up and down on the other.
  const p1 = tileCenter(sc, pads[0].c, pads[0].r);
  block(sc, 17, 18, 1, 1);
  block(sc, 17, 19, 1, 1);
  addObject(sc, { c: 17, r: 18, w: 1, d: 2 }, { x: p1.x - 26, y: p1.y - 40, w: 52, h: 48 }, ctx => drawCargoDrone(ctx, p1.x, p1.y, 0, false));
  const p2 = tileCenter(sc, pads[1].c, pads[1].r);
  block(sc, 21, 20, 1, 1);
  block(sc, 21, 21, 1, 1);
  const hop = addObject(sc, { c: 21, r: 20, w: 1, d: 2 }, { x: p2.x - 26, y: p2.y - 70, w: 52, h: 78 }, () => {});
  hop.animated = (ctx, t) => {
    const h = 12 + Math.sin(t * 0.9) * 9;
    ctx.fillStyle = 'rgba(40,30,70,0.25)';
    ctx.beginPath();
    ctx.ellipse(Math.round(p2.x), Math.round(p2.y) - 1, 14 - h / 4, 4 - h / 16, 0, 0, Math.PI * 2);
    ctx.fill();
    drawCargoDrone(ctx, p2.x, p2.y, h, Math.floor(t * 9) % 2, '#4fa8ff');
  };
  for (const n of FAIRY_NPCS) reserve(n.c, n.r);
  for (let r = 10; r <= 15; r++) for (let c = 0; c <= 3; c++) reserve(c, r);

  // Runway paint, landing pads and blue edge lights.
  sc.paintGround = g => {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const t = tileAt(sc, c, r);
      const o = tileOrigin(sc, c, r);
      if (t.type === 'droneturf') drawDroneTurf(g, o.x, o.y, c, r);
      else if (t.type === 'dronetarmac') drawDroneTarmac(g, o.x, o.y);
      else if (t.type === 'droneapron') drawDroneApron(g, o.x, o.y);
    }
    // Dashed centre lines down the middle of each runway.
    const corner = (c, r) => ({ x: sc.ox + 16 + (c - r) * 16, y: sc.oy + (c + r) * 8 });
    const dash = (from, to) => {
      for (let s = 0; s <= 1; s += 0.02) {
        const p = { x: from.x + (to.x - from.x) * s, y: from.y + (to.y - from.y) * s };
        px(g, Math.round(p.x), Math.round(p.y), 2, 1, '#ffe066');
      }
    };
    for (let c = 0; c < 22; c += 1) if (!onApron(c, 12.5) && !onApron(c + 1, 12.5)) dash(corner(c + 0.15, 13), corner(c + 0.6, 13));
    for (let r = 2; r < 22; r += 1) if (!onApron(12.5, r) && !onApron(12.5, r + 1)) dash(corner(13, r + 0.15), corner(13, r + 0.6));
    for (const p of pads) {
      const q = tileCenter(sc, p.c, p.r);
      drawDronePad(g, q.x, q.y, p.R);
    }
    for (let i = 0; i <= 22; i += 2) {
      for (const [c, r] of [[i, 11.85], [i, 14.15], [11.85, i], [14.15, i]]) {
        if (onApron(c, r) || (r === 11.85 && c < 2) || i < 2 && c > 11 && c < 15) continue;
        const q = { x: sc.ox + 16 + (c - r) * 16, y: sc.oy + (c + r) * 8 };
        px(g, Math.round(q.x) - 1, Math.round(q.y), 2, 1, '#5fb0ff');
        px(g, Math.round(q.x) - 1, Math.round(q.y) - 1, 2, 1, '#d8f0ff');
      }
    }
  };

  // Trees round the edge, little bushes inside.
  const ring = [makeTree('green'), makePlant('pine'), makePlant('oak'), makeTree('green'), makePlant('birch')];
  const inner = [makePlant('bush'), makePlant('berryBush'), makePlant('bush')];
  const nearPath = (c, r) => {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const t = tileAt(sc, c + dc, r + dr);
      if (t && t.type !== 'droneturf') return true;
    }
    return false;
  };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const t = tileAt(sc, c, r);
    if (t.blocked || reserved.has(key(c, r)) || t.type !== 'droneturf' || nearPath(c, r)) continue;
    const edge = c < 2 || r < 2 || c > N - 3 || r > N - 3;
    if (hash(c, r, 97) >= (edge ? 0.55 : 0.1)) continue;
    if (!edge && sc.objects.some(o => o.tree && Math.abs(o.c0 - c) <= 1 && Math.abs(o.r0 - r) <= 1)) continue;
    const list = edge ? ring : inner;
    const tree = list[Math.floor(hash(c, r, 98) * list.length)];
    block(sc, c, r, 1, 1);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, tree: true, canvas: tree.canvas, x: p.x - tree.ax, y: p.y - tree.ay, w: tree.canvas.width, h: tree.canvas.height });
  }

  // Little drones looping in the sky over everything.
  const sky = { c0: N, r0: N, c1: N, r1: N, canvas: makeCanvas(1, 1), x: 0, y: 0, w: sc.width, h: sc.height };
  sky.alpha = [0, 0, 0, 0];
  sky.animated = (ctx, t) => {
    [['quad', 0.21, 0], ['bee', -0.16, 2.1], ['ufo', 0.12, 4.2]].forEach(([k, sp, ph], i) => {
      const a = t * sp + ph;
      const x = sc.width / 2 + Math.cos(a) * sc.width * 0.3;
      const y = sc.height * 0.42 + Math.sin(a * 2) * sc.height * 0.12 - 40 - i * 20;
      drawCaptainBuddy(ctx, x, y, k, t * 1000, Math.sin(a) * sp > 0);
    });
  };
  sc.objects.push(sky);

  for (const n of FAIRY_NPCS) {
    const npc = makeNpc(n, null);
    Object.assign(npc, { level: 5, gives: n.gives, badge: '⚡' });
    sc.npcs.push(npc);
  }
  // Gate back to town on the west edge: a racing gate over the runway.
  for (const r of [11, 14]) block(sc, 1, r, 1, 1);
  for (let r = 12; r <= 13; r++) for (const c of [0, 1]) tileAt(sc, c, r).mat = '#4fa8ff';
  const ga = tileCenter(sc, 1, 14);
  const gb = tileCenter(sc, 1, 11);
  const gate = addObject(sc, { c: 1, r: 11, w: 1, d: 4 }, { x: ga.x - 8, y: gb.y - 54, w: gb.x - ga.x + 16, h: ga.y - gb.y + 62 }, ctx => drawDroneGate(ctx, ga, gb));
  gate.animated = (ctx, t) => drawDroneGate(ctx, ga, gb, t);
  sc.links = [12, 13].map(r => ({ c: 0, r, target: 'town', at: { c: 37, r: r + 14 }, icon: '🤖', style: 'gate' }));
  const tg = tileCenter(sc, 1, 12.5);
  sc.signs.push({ x: tg.x, y: tg.y - 64, text: place('town'), color: '#4fa8ff' });
  sc.start = { c: 2, r: 12 };
  renderGround(sc);
  return sc;
}
