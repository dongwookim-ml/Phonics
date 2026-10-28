// Halloween: every village dressed up for it, in both editions. Glowing
// jack-o'-lanterns, pumpkins, hay bales and candy pails line the roads
// (tap one and it says its word), little ghosts float about (tap one:
// "ghost!"), bats flap across the sky, strings of orange and purple lights
// hang between the lamps, fallen leaves and sweets lie on the ground, cute
// tombstones stand in the Monster Village, the villagers wear witch hats,
// pumpkin hats and cat ears, and the rooms have a garland and a cobweb.
//
// It is only laid on top: the villages themselves (js/world.js and the
// other scene builders, js/data.js) are not changed. Each scene, once
// built, is dressed by halloweenDress (sceneFor in js/game.js); villagers'
// hats come from halloweenHat (villagerSprite in js/sprites.js); the ghosts,
// bats and lights are drawn by halloweenDraw (drawScene) and the ghosts
// tapped by halloweenTap (onPointer). With it off, none of them does
// anything and every village is just as it is the rest of the year.
//
// When: from HALLOWEEN_DAYS.from to .until every year (on this device's
// clock), unless the address said otherwise once on this device:
// ?halloween=0 turns it off for good (the villages as they are all year),
// ?halloween=1 shows it on any day, ?halloween=auto goes back to the dates.

const HALLOWEEN_DAYS = { from: [10, 1], until: [11, 7] }; // [month, day]
const HALLOWEEN_ON = (() => {
  let ask = null;
  try { ask = new URLSearchParams(location.search).get('halloween'); } catch (e) { /* no address */ }
  try {
    if (ask === '0' || ask === '1') localStorage.setItem('pixeltown-halloween', ask);
    else if (ask === 'auto') localStorage.removeItem('pixeltown-halloween');
    else ask = localStorage.getItem('pixeltown-halloween');
  } catch (e) { /* private mode: for this visit only */ }
  if (ask === '1' || ask === '0') return ask === '1';
  const d = new Date();
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  const at = ([m, day]) => m * 100 + day;
  return md >= at(HALLOWEEN_DAYS.from) && md <= at(HALLOWEEN_DAYS.until);
})();

// The narrator's hello as the game starts (LINES.halloween in js/data.js).
if (HALLOWEEN_ON && LINES.halloween) LINES.start = LINES.halloween;

// Taps: a pumpkin hops in a shower of orange, a ghost says boo.
Object.assign(TOUCH_FX, {
  pumpkin: { move: 'hop', colors: ['#ff8a2a', '#ffd34d', '#ffb45a', '#ffffff'], star: true, tune: 'boing' },
  candy:   { move: 'hop', colors: ['#ff6fa8', '#5ad0e8', '#ffd34d', '#b58cff', '#ffffff'], star: true, tune: 'chime' },
  hay:     { move: 'shake', colors: ['#f0cf6a', '#d4aa44', '#ffe9a0'], fall: true },
  boo:     { move: 'hop', pop: '👻', colors: ['#ffffff', '#e8e0ff', '#d8f0ff'], tune: 'spooky' },
});

// ---- Pictures ---------------------------------------------------------------

const HW_PAL = {
  o: '#6a3418', n: '#ff8a2a', N: '#e2661c', l: '#ffb45a', y: '#ffe680', Y: '#ffb020', e: '#4f8a3a', E: '#78b04a',
  h: '#f0cf6a', H: '#d4aa44', k: '#a87f2a', t: '#8a5a2a',
  s: '#c4c0d4', S: '#a29cb8', d: '#6e6888', m: '#6fb04a', M: '#4f8a3a', g: '#4a3a58',
  c: '#ff6fa8', C: '#5ad0e8', u: '#ffd34d', v: '#8a5ad0', w: '#ffffff',
};
const HW_GHOST_PAL = { o: '#a59cd0', w: '#ffffff', W: '#e6e0f8', g: '#4a3a58', p: '#ffb0c8' };
const HW_BAT_PAL = { b: '#3a2a50', B: '#5a4478', y: '#ffe680' };

// A jack-o'-lantern: its eyes and grin glow from the candle inside.
const HW_JACK = [
  '.......et.......',
  '.......tt.......',
  '...oooottoooo...',
  '..onnNnnnnNnnno.',
  '.onnNnnnnnNnnnno',
  'onnNnynnnnynNnno',
  'onnNyyynnyyyNnno',
  'onnNnnnyynnnNnno',
  'onYnnnnnnnnnnYno',
  'onyyYyyyyyYyyyno',
  '.onyyYnyynYyyno.',
  '..onNnnnnnNnno..',
  '...oooooooooo...',
];
// A plain pumpkin, with a curly vine.
const HW_PUMPKIN = [
  '......ttE.....',
  '......t..EE...',
  '..oooottooo...',
  '.onnlNnnlNnno.',
  'onnlnNnnlnNnno',
  'onnlnNnnnnNnno',
  'onnnnNnnnnNnno',
  '.onnnNnnnnNno.',
  '..oooooooooo..',
];
// A hay bale with a little pumpkin on top.
const HW_HAY = [
  '......et..........',
  '....ooottoo.......',
  '...onnlnnNno......',
  '...onnnnnNno......',
  '.kkkkooooookkkkk..',
  'khhhhhhhhhhhhhhhk.',
  'khHhhhHhhhhHhhHhk.',
  'kttttttttttttttttk',
  'khhhHhhhhHhhhhHhk.',
  'khHhhhhHhhhhHhhhk.',
  'khhhhhhhhhhhhhhhk.',
  '.kkkkkkkkkkkkkkk..',
];
// A jack-o'-lantern pail full of sweets.
const HW_PAIL = [
  '..c.u.C.v.',
  '.ccuuCCvvc',
  '.otttttto.',
  'o.onnnno.o',
  'oonnNnnnoo',
  '.onynnyno.',
  '.onnnnnno.',
  '.onyyyyno.',
  '.onnnnnno.',
  '..oooooo..',
];
// A smiling tombstone with grass at its foot.
const HW_STONE = [
  '...gggggg...',
  '..gsssssSg..',
  '.gsssssssSg.',
  '.gssgssgsSg.',
  '.gssgssgsSg.',
  '.gsssssssSg.',
  '.gsgsssgsSg.',
  '.gssgggssSg.',
  '.gsssssssSg.',
  '.gsssssssSg.',
  'mMgggggggggm',
  'MmmMmmMmmMmM',
];
// A little ghost, its hem waving (two frames).
const HW_GHOST = [[
  '....oooo....',
  '..oowwwwoo..',
  '.owwwwwwwwo.',
  '.owwwwwwwwo.',
  'owwgwwwwgwwo',
  'owwgwwwwgwwo',
  'owpwwwwwwpwo',
  'owwwwggwwwwo',
  'owwwwwwwwwwo',
  'owWwwwwwwWwo',
  'owwWwwwwWwwo',
  'owoowwoowwoo',
  '.o..oo..oo..',
], [
  '....oooo....',
  '..oowwwwoo..',
  '.owwwwwwwwo.',
  '.owwwwwwwwo.',
  'owwgwwwwgwwo',
  'owwgwwwwgwwo',
  'owpwwwwwwpwo',
  'owwwwggwwwwo',
  'owwwwwwwwwwo',
  'owWwwwwwwWwo',
  'owwWwwwwWwwo',
  'oowwoowwoowo',
  '..oo..oo..o.',
]];
// A bat, wings up and wings down.
const HW_BAT = [[
  'B.........B',
  'BB.......BB',
  'bBB.b.b.BBb',
  '.bbbbbbbbb.',
  '..b.yby.b..',
  '....bbb....',
], [
  '....b.b....',
  '...bbbbb...',
  '.bbbybybbb.',
  'bBBbbbbbBBb',
  'BB.......BB',
  'B.........B',
]];

// The villagers' hats for the night (drawn where their own hat goes).
const HW_HATS = {
  witch: { x: 1, y: -8, pal: { v: '#6a3fa8', V: '#8f62d0', n: '#ff8a2a' }, rows: [
    '.........oo...',
    '........ovo...',
    '.......ovvo...',
    '......ovVvo...',
    '.....ovvVvo...',
    '....ovvvVvvo..',
    '....onnnnnno..',
    '...ovvvvvvvvo.',
    '.ooovvvvvvvvoo',
    'oooooooooooooo',
  ] },
  blackwitch: { x: 1, y: -8, pal: { v: '#3a2a48', V: '#5a4a6a', n: '#ffb020' }, rows: [
    '..oo..........',
    '..ovo.........',
    '..ovvo........',
    '...ovVo.......',
    '...ovvVo......',
    '..ovvvVvo.....',
    '..onnnnnno....',
    '.ovvvvvvvvo...',
    'oovvvvvvvvvooo',
    'oooooooooooooo',
  ] },
  pumpkin: { x: 2, y: -6, pal: { n: '#ff8a2a', N: '#e2661c', e: '#4f8a3a' }, rows: [
    '.....ee.....',
    '....ee.e....',
    '..oooooooo..',
    '.onnNnnnNnno',
    'onnnNnnnNnnn',
    'onnnNnnnNnnn',
    'oooooooooooo',
  ] },
  cat: { x: 2, y: -3, pal: { j: '#3a2a48' }, rows: [
    '.o........o.',
    'ojo......ojo',
    'ojpo....opjo',
    'ojjo....ojjo',
  ] },
  bat: { x: 2, y: -4, pal: { j: '#3a2a48', J: '#5a4478', t: '#ffe680' }, rows: [
    'J..........J',
    'JJ...jj...JJ',
    'JJjjjtjtjjJJ',
    '.J..jjjj..J.',
  ] },
};
const HW_HAT_KEYS = ['witch', 'pumpkin', 'cat', 'blackwitch', 'bat'];

// A villager's hat tonight, or null for their own: royals keep their
// crowns and a wizard his hat.
function halloweenHat(lookKey, look) {
  if (!HALLOWEEN_ON || look.hat === 'crown' || look.hat === 'wizard') return null;
  let h = 0;
  for (const ch of lookKey) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return HW_HATS[HW_HAT_KEYS[Math.abs(h) % HW_HAT_KEYS.length]];
}

const hwSprites = new Map();
// A bitmap as a canvas, its bottom middle the anchor, with a soft shadow.
function hwSprite(rows, pal, shadow = true) {
  if (hwSprites.has(rows)) return hwSprites.get(rows);
  const w = rows[0].length;
  const h = rows.length;
  const cv = makeCanvas(w + 4, h + 2);
  const ctx = cv.getContext('2d');
  if (shadow) {
    ctx.fillStyle = 'rgba(40,30,70,0.22)';
    ctx.beginPath();
    ctx.ellipse(cv.width / 2, h, w / 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  drawBitmap(ctx, rows, pal, 2, 0);
  const sprite = { canvas: cv, ax: cv.width / 2, ay: h };
  hwSprites.set(rows, sprite);
  return sprite;
}

// ---- Where things go ------------------------------------------------------------

// Tiles that are a way to walk (roads, paths, the car village's roads and
// pavements, the dino village's dirt): things stand beside them.
const HW_WAYS = new Set(['road', 'plaza', 'path', 'rainbow', 'petals', 'dronetarmac', 'droneapron']);
const hwWay = t => !!t && (HW_WAYS.has(t.type) || !!t.car || !!t.dirt);
const hwFloor = t => !!t && !t.blocked && t.type !== 'water' && !t.mat && !t.rug;
const hwWet = (sc, c, r) => [-1, 0, 1].some(dr => [-1, 0, 1].some(dc => (tileAt(sc, c + dc, r + dr) || {}).type === 'water'));
// Doors, ways out and gate mats, which nothing may stand near.
const hwOuts = sc => [...sc.doors, ...(sc.links || []), ...(sc.exitTiles || (sc.exit ? [sc.exit] : [])),
  ...sc.tiles.flatMap((row, r) => row.map((t, c) => (t.mat || t.rug ? { c, r } : null))).filter(Boolean)];
const hwNear = (a, b, d) => Math.abs(a.c - b.c) <= d && Math.abs(a.r - b.r) <= d;

// How many tiles she can reach from `from`, by steps across.
function hwReach(sc, from) {
  const seen = new Uint8Array(sc.W * sc.D);
  const q = [from];
  seen[from.r * sc.W + from.c] = 1;
  let n = 0;
  while (q.length) {
    const { c, r } = q.pop();
    n++;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const t = tileAt(sc, c + dc, r + dr);
      const i = (r + dr) * sc.W + c + dc;
      if (t && !t.blocked && !seen[i]) { seen[i] = 1; q.push({ c: c + dc, r: r + dr }); }
    }
  }
  return n;
}

// The tiles where things may stand: on the floor beside the ways (never on
// a road or path), clear of the water, the villagers, doors, ways out and
// gate mats, other things and their fronts. `pick(t, c, r)` narrows them;
// they come nearest a way first (outdoors), else in a fixed jumble.
function hwSpots(sc, pick) {
  const outs = hwOuts(sc);
  const things = sc.objects.filter(o => !o.background && o.c0 >= 0);
  const fronts = things.flatMap(o => o.front || []);
  const spots = [];
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) {
    const t = tileAt(sc, c, r);
    const at = { c, r };
    if (!hwFloor(t) || hwWay(t) || hwWet(sc, c, r) || !pick(t, c, r)) continue;
    if (sc.npcs.some(n => hwNear(n, at, KID_MONSTERS[n.look] ? 3 : 2))) continue;
    if (outs.some(o => hwNear(o, at, 2)) || fronts.some(f => hwNear(f, at, 1))) continue;
    if (sc.start && hwNear(sc.start, at, 1)) continue;
    if (things.some(o => c >= o.c0 - 1 && c <= o.c1 + 1 && r >= o.r0 - 1 && r <= o.r1 + 1)) continue;
    let way = false;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (hwWay(tileAt(sc, c + dc, r + dr))) way = true;
    spots.push({ c, r, way, k: hash(c, r, 1031) });
  }
  return spots.sort((a, b) => (b.way - a.way) || a.k - b.k);
}

// Puts `sprite` on up to `n` of the spots, `apart` tiles from each other,
// never cutting off any part of the scene. Returns the tiles used.
function hwPlace(sc, spots, n, apart, make) {
  const outs = sc.exitTiles || (sc.exit ? [sc.exit] : []);
  const from = sc.start || outs[0] || (sc.links || [])[0] || sc.doors[0];
  if (!from || n <= 0) return [];
  let reach = hwReach(sc, from);
  const used = [];
  for (const s of spots) {
    if (used.length >= n) break;
    if (sc.hwUsed.some(u => hwNear(u, s, apart)) || tileAt(sc, s.c, s.r).blocked) continue;
    block(sc, s.c, s.r, 1, 1);
    const now = hwReach(sc, from);
    if (now !== reach - 1) { tileAt(sc, s.c, s.r).blocked = false; continue; }
    reach = now;
    used.push(s);
    sc.hwUsed.push(s);
    make(s);
  }
  return used;
}

// One thing standing on a tile, saying `react` when tapped; a lit one
// glows (`glow`: how far up its candle is).
function hwProp(sc, s, sprite, react, glow) {
  const p = tileCenter(sc, s.c, s.r);
  const x = Math.round(p.x - sprite.ax);
  const y = Math.round(p.y + 3 - sprite.ay);
  sc.objects.push({ c0: s.c, r0: s.r, c1: s.c, r1: s.r, canvas: sprite.canvas, x, y, w: sprite.canvas.width, h: sprite.canvas.height, react, halloween: true });
  if (glow !== undefined) sc.lamps.push({ x: p.x, y: y + glow, small: true, halloween: true });
}

// ---- Dressing a scene -------------------------------------------------------------

// Called on every scene as it is built (sceneFor in js/game.js).
function halloweenDress(sc) {
  if (!HALLOWEEN_ON || sc.hwUsed) return;
  sc.hwUsed = [];
  sc.hwGhosts = [];
  sc.hwBats = [];
  sc.hwLights = [];
  if (sc.outdoor) hwOutdoors(sc);
  else hwIndoors(sc);
}

function hwOutdoors(sc) {
  const jack = hwSprite(HW_JACK, HW_PAL);
  const area = sc.W * sc.D;
  const base = Math.round(area / 110);
  const spots = hwSpots(sc, () => true);
  // Tombstones in the Monster Village, a little way off the roads.
  if (sc.kind === 'monster') hwPlace(sc, spots.filter(s => !s.way), 6, 2, s => hwProp(sc, s, hwSprite(HW_STONE, HW_PAL), { word: 'boo', fx: 'boo' }));
  hwPlace(sc, spots, base, 3, s => hwProp(sc, s, jack, { word: 'pumpkin', fx: 'pumpkin' }, 7));
  hwPlace(sc, spots, Math.round(base * 0.4), 3, s => hwProp(sc, s, hwSprite(HW_PUMPKIN, HW_PAL), { word: 'pumpkin', fx: 'pumpkin' }));
  hwPlace(sc, spots, Math.max(2, Math.round(base * 0.25)), 3, s => hwProp(sc, s, hwSprite(HW_HAY, HW_PAL), { word: 'hay', fx: 'hay' }));
  hwPlace(sc, spots, Math.max(2, Math.round(base * 0.2)), 3, s => hwProp(sc, s, hwSprite(HW_PAIL, HW_PAL), { word: 'candy', fx: 'candy' }, 5));
  hwLeaves(sc);
  hwLights(sc);
  hwGhosts(sc, Math.max(3, Math.round(area / 300)));
  hwBats(sc, 8);
}

// Rooms: a garland along the top of the walls, a cobweb in the corner, a
// lantern or two by the walls; caves get bats instead of the garland.
function hwIndoors(sc) {
  const cave = sc.kind === 'dungeon' || sc.caveWalls;
  if (sc.wallH) hwWalls(sc, sc.wallH, !cave);
  const spots = hwSpots(sc, (t, c, r) => c <= 1 || r <= 1);
  hwPlace(sc, spots, sc.W * sc.D >= 70 ? 2 : 1, 3, s => hwProp(sc, s, hwSprite(HW_JACK, HW_PAL), { word: 'pumpkin', fx: 'pumpkin' }, 7));
  if (cave) hwBats(sc, 3);
}

// Leaves and a few sweets on the ground (painted on it).
function hwLeaves(sc) {
  const g = sc.ground.getContext('2d');
  const LEAF = ['#e8762a', '#f0a030', '#c8502a', '#a85a2a', '#f5c040'];
  const SWEET = ['#ff6fa8', '#5ad0e8', '#ffd34d', '#b58cff'];
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) {
    const t = tileAt(sc, c, r);
    if (!t || t.type === 'water') continue;
    const o = tileCenter(sc, c, r);
    const way = hwWay(t);
    const n = hash(c, r, 401) < (way ? 0.12 : 0.22) ? 1 + Math.floor(hash(c, r, 402) * 3) : 0;
    for (let i = 0; i < n; i++) {
      const dx = Math.round((hash(c, r, 410 + i) - 0.5) * 20);
      const dy = Math.round((hash(c, r, 420 + i) - 0.5) * 8);
      const col = LEAF[Math.floor(hash(c, r, 430 + i) * LEAF.length)];
      px(g, o.x + dx, o.y + dy, 2, 1, col);
      px(g, o.x + dx + (hash(c, r, 440 + i) < 0.5 ? 1 : 0), o.y + dy + 1, 2, 1, shade(col, -30));
    }
    if (!way && !t.blocked && hash(c, r, 450) < 0.02) {
      const col = SWEET[Math.floor(hash(c, r, 451) * SWEET.length)];
      const x = o.x - 2;
      const y = o.y - 1;
      px(g, x, y, 1, 1, shade(col, 40));
      px(g, x + 1, y - 1, 3, 3, col);
      px(g, x + 2, y - 1, 1, 1, '#ffffff');
      px(g, x + 4, y, 1, 1, shade(col, 40));
    }
  }
}

// Strings of lights from each lamp post (a lamp or a torch on a pole) to
// the post nearest it (across the road), when that one is near enough.
function hwLights(sc) {
  const posts = sc.objects.filter(o => o.canvas && o.canvas.width === 12 && o.canvas.height === 34);
  const lamps = sc.lamps.filter(l => !l.small && !l.big && posts.some(o => Math.abs(l.x - (o.x + 6)) <= 1 && l.y >= o.y && l.y <= o.y + 16));
  const COLORS = ['#ff9a3a', '#b77aff', '#7affb0', '#ffd34d'];
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const pairs = new Set();
  lamps.forEach((a, i) => {
    let j = -1;
    lamps.forEach((b, k) => { if (k !== i && (j < 0 || dist(a, b) < dist(a, lamps[j]))) j = k; });
    if (j >= 0) pairs.add(i < j ? `${i},${j}` : `${j},${i}`);
  });
  const postOf = l => posts.find(o => Math.abs(l.x - (o.x + 6)) <= 1 && l.y >= o.y && l.y <= o.y + 16);
  for (const pair of pairs) {
    const [a, b] = pair.split(',').map(i => lamps[i]);
    const d = dist(a, b);
    if (d < 30 || d > 80) continue;
    const bulbs = [];
    const n = Math.round(d / 7);
    for (let k = 1; k < n; k++) {
      const u = k / n;
      const p = { x: a.x + (b.x - a.x) * u, y: a.y + 3 + (b.y - a.y) * u + Math.sin(u * Math.PI) * 6, col: COLORS[k % COLORS.length] };
      bulbs.push(p);
      if (k % 2) sc.lamps.push({ x: p.x, y: p.y, small: true, halloween: true });
    }
    // Drawn in its place among the things (behind a house in front of
    // it), as deep as the two posts; there is nothing on it to tap.
    const s = { a, b, bulbs };
    const [pa, pb] = [postOf(a), postOf(b)];
    sc.hwLights.push(s);
    sc.objects.push({ c0: Math.min(pa.c0, pb.c0), r0: Math.min(pa.r0, pb.r0), c1: Math.max(pa.c1, pb.c1), r1: Math.max(pa.r1, pb.r1),
      x: Math.min(a.x, b.x) - 2, y: Math.min(a.y, b.y) - 2, w: Math.abs(b.x - a.x) + 4, h: Math.abs(b.y - a.y) + 14,
      halloween: true, animated: (ctx, t) => hwDrawLights(ctx, s, t) });
  }
}

// One string: its wire and its bulbs, twinkling.
function hwDrawLights(ctx, s, t) {
  ctx.fillStyle = '#4a3450';
  const pts = [s.a, ...s.bulbs, s.b];
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const q = pts[i];
    const steps = Math.max(1, Math.round(Math.abs(q.x - p.x)));
    for (let k = 0; k < steps; k++) ctx.fillRect(Math.round(p.x + ((q.x - p.x) * k) / steps), Math.round(p.y + ((q.y - p.y) * k) / steps), 1, 1);
  }
  s.bulbs.forEach((b, i) => {
    ctx.fillStyle = Math.sin(t * 3 + i) > -0.6 ? b.col : shade(b.col, -70);
    ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y), 2, 2);
  });
}

// Ghosts float clear of the villagers, doors, ways out, signs, water and
// anything that does something when tapped (a tree behind one may be
// hidden), so a tap on one is never meant for something under it.
function hwGhosts(sc, n) {
  const outs = hwOuts(sc);
  const boxes = sc.objects.filter(o => !o.background && (o.kind || o.links || o.stairs || o.keeper || o.halloween || o.react || sc.doors.some(d => d.obj === o)));
  const free = (x, y) => !boxes.some(o => x + 10 > o.x && x - 10 < o.x + o.w && y + 10 > o.y && y - 10 < o.y + o.h)
    && !sc.signs.some(g => Math.abs(g.x - x) < 50 && Math.abs(g.y - y) < 24);
  const spots = [];
  for (let r = 1; r < sc.D - 1; r++) for (let c = 1; c < sc.W - 1; c++) {
    const at = { c, r };
    if (sc.npcs.some(v => hwNear(v, at, 4)) || outs.some(o => hwNear(o, at, 3))) continue;
    const p = tileCenter(sc, c, r);
    // What is under it on the screen, two tiles behind its own.
    if (free(p.x, p.y - 30) && !hwWet(sc, c, r) && !hwWet(sc, c - 2, r - 2)) spots.push({ c, r, k: hash(c, r, 1201) });
  }
  spots.sort((a, b) => a.k - b.k);
  for (const s of spots) {
    if (sc.hwGhosts.length >= n) break;
    if (sc.hwGhosts.some(g => hwNear(g, s, 6))) continue;
    const p = tileCenter(sc, s.c, s.r);
    sc.hwGhosts.push({ c: s.c, r: s.r, x: p.x, y: p.y - 30, phase: s.k * 6.28 });
  }
}

// Bats looping about over the scene.
function hwBats(sc, n) {
  for (let i = 0; i < n; i++) {
    sc.hwBats.push({
      cx: sc.width * (0.15 + 0.7 * hash(i, sc.W, 1301)), cy: sc.height * (0.15 + 0.6 * hash(i, sc.D, 1302)),
      rx: 40 + 60 * hash(i, 3, 1303), ry: 14 + 18 * hash(i, 4, 1304), speed: 0.35 + 0.3 * hash(i, 5, 1305), phase: 6.28 * hash(i, 6, 1306),
    });
  }
}

// A garland of orange, purple and black flags along the top of both back
// walls and a cobweb with its spider in the corner where they meet,
// painted behind everything like the walls. `flags`: the garland too.
function hwWalls(sc, H, flags) {
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  const WA = wall(k.L, k.T);
  const WB = wall(k.T, k.R);
  const bounds = { x: k.L.x - 4, y: k.T.y - H - 8, w: k.R.x - k.L.x + 8, h: H + 8 + (k.R.y - k.T.y) };
  const obj = addObject(sc, { c: -1, r: -1, w: 1, d: 1 }, bounds, ctx => {
    if (flags) {
      const FLAG = ['#ff8a2a', '#8a5ad0', '#3a2a48'];
      for (const W of [WA, WB]) {
        const top = H - 18;
        const sag = x => Math.sin(((x % 40) / 40) * Math.PI) * 4;
        for (let x = 0; x < W.len; x++) {
          const p = wallPt(W, x, top - sag(x));
          px(ctx, Math.round(p.x), Math.round(p.y), 1, 1, '#5a4060');
        }
        for (let x = 6, i = 0; x < W.len - 4; x += 10, i++) {
          const a = wallPt(W, x - 3, top - sag(x - 3));
          const b = wallPt(W, x + 3, top - sag(x + 3));
          const tip = wallPt(W, x, top - sag(x) - 7);
          fillPoly(ctx, [a, b, tip], FLAG[i % FLAG.length]);
        }
      }
    }
    // The cobweb: threads from the corner and rings across them.
    const corner = wallPt(WB, 0, H);
    const ends = [wallPt(WA, WA.len - 26, H), wallPt(WA, WA.len - 18, H - 14), { x: corner.x, y: corner.y + 24 }, wallPt(WB, 18, H - 14), wallPt(WB, 26, H)];
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const e of ends) { ctx.moveTo(corner.x + 0.5, corner.y + 0.5); ctx.lineTo(e.x + 0.5, e.y + 0.5); }
    for (const u of [0.35, 0.65, 0.95]) {
      ends.forEach((e, i) => {
        const p = { x: corner.x + (e.x - corner.x) * u, y: corner.y + (e.y - corner.y) * u };
        if (i) ctx.lineTo(p.x + 0.5, p.y + 0.5);
        else ctx.moveTo(p.x + 0.5, p.y + 0.5);
      });
    }
    ctx.stroke();
    // Its spider, hanging on a thread.
    const sx = Math.round(corner.x + 8);
    const sy = Math.round(corner.y + 20);
    px(ctx, sx, corner.y + 8, 1, sy - corner.y - 8, 'rgba(255,255,255,0.75)');
    px(ctx, sx - 2, sy, 5, 4, '#3a2a48');
    px(ctx, sx - 4, sy + 1, 9, 1, '#3a2a48');
    px(ctx, sx - 4, sy + 3, 9, 1, '#3a2a48');
    px(ctx, sx - 1, sy + 1, 1, 1, '#ffffff');
    px(ctx, sx + 1, sy + 1, 1, 1, '#ffffff');
  }, { background: true, halloween: true });
  obj.c0 = -10; obj.r0 = -10; obj.c1 = -10; obj.r1 = -10;
}

// ---- Every frame ---------------------------------------------------------------------

// Drawn over the scene (drawScene in js/game.js, in world pixels): a dusk
// outdoors, the ghosts and the bats (the lights are drawn with the things).
function halloweenDraw(ctx, sc, now, view) {
  if (!sc.hwUsed) return;
  const t = now / 1000;
  if (sc.outdoor && sc.kind !== 'forest' && sc.kind !== 'monster') {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(60,28,110,0.13)';
    ctx.fillRect(0, 0, view.width, view.height);
    ctx.restore();
  }
  for (const g of sc.hwGhosts) {
    const p = hwGhostAt(g, now);
    const sprite = hwSprite(HW_GHOST[Math.floor(t * 2 + g.phase) % 2], HW_GHOST_PAL, false);
    ctx.globalAlpha = 0.88;
    ctx.drawImage(sprite.canvas, Math.round(p.x - sprite.ax), Math.round(p.y - sprite.ay / 2));
    ctx.globalAlpha = 1;
  }
  for (const b of sc.hwBats) {
    const a = t * b.speed + b.phase;
    const x = b.cx + Math.cos(a) * b.rx;
    const y = b.cy + Math.sin(a * 2) * b.ry;
    const sprite = hwSprite(HW_BAT[Math.floor(t * 8 + b.phase) % 2], HW_BAT_PAL, false);
    ctx.drawImage(sprite.canvas, Math.round(x - sprite.ax), Math.round(y - sprite.ay));
  }
}

// Where a ghost is now: bobbing and swaying, and hopping when tapped.
function hwGhostAt(g, now) {
  const t = now / 1000;
  const m = g.touchFx && touchMove(g, now);
  return { x: g.x + Math.sin(t * 0.7 + g.phase) * 6 + (m ? m.x : 0), y: g.y + Math.sin(t * 1.9 + g.phase) * 3 + (m ? m.y : 0) };
}

// A tap on a ghost: "ghost!" with a 👻. True when it took the tap.
function halloweenTap(wx, wy) {
  const sc = state.scene;
  if (!sc.hwGhosts) return false;
  const now = performance.now();
  const g = sc.hwGhosts.find(x => { const p = hwGhostAt(x, now); return Math.abs(wx - p.x) < 9 && wy > p.y - 9 && wy < p.y + 9; });
  if (!g) return false;
  const p = hwGhostAt(g, now);
  touchReact(g, { word: 'ghost', fx: 'boo' }, { x: p.x, y: p.y }, { x: p.x, y: p.y - 18 });
  return true;
}
