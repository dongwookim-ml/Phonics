// Christmas play: things to do at Christmas beyond the decorations
// (js/christmas.js), in both editions, only while CHRISTMAS_ON.
//
// - Santa stands in the town square with Rudolph. He asks town questions in
//   his own voice like any villager. Rudolph has lost his red nose and five
//   of Santa's presents fell out of the sleigh: they lie round the town,
//   sparkling. Once she has found all six, Santa thanks her and gives his
//   special present (a treasure that only he gives, `santaGift`), and
//   Rudolph's nose shines again.
// - Her room (the captain's room too) has a tree of her own: the
//   decorations her right answers give her go up on it, under it and round
//   the room (js/christmas-decor.js).
// - An Advent calendar on her room's floor: one door a day, each with a
//   Christmas word and a few coins.
// - A fireplace with her stocking: she hangs it, and the next day Santa
//   has put a present in it.
// - Snow play outdoors: footprints in the snow behind her, a snowman she
//   rolls in the town (tap, tap, tap) and a sled she rides down the hill.
// - In the evening (17:00 to 6:00 on her clock, or ?night=1) the town is
//   dark blue, its windows lit and an aurora waves over it.
//
// What she has done is saved in `state.xmas` (per edition): lists of
// strings only, so any two copies of a save join without losing anything
// (Progress.merge joins lists as sets; older versions keep the field).

// ---- The save -----------------------------------------------------------------------

const XM_HUNT = ['nose', 'g1', 'g2', 'g3', 'g4', 'g5'];
const XM_LISTS = ['found', 'done', 'orn', 'advent', 'hung', 'got'];
function xmSaved(x) {
  const out = {};
  for (const k of XM_LISTS) out[k] = x && Array.isArray(x[k]) ? x[k].filter(v => typeof v === 'string') : [];
  return out;
}
const xmDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// This Christmas (the season is November and December of one year).
const xmYear = () => String(new Date().getFullYear());
const xmThis = list => list.filter(v => v.startsWith(xmYear()));
const xmState = () => (state.xmas = state.xmas || xmSaved(null));
const xmFound = id => xmState().found.includes(`${xmYear()}:${id}`);
const xmHuntDone = () => xmState().done.includes(xmYear());

// ---- The evening ----------------------------------------------------------------------

const XM_NIGHT_URL = (() => {
  const m = /[?&]night=([01])/.exec(typeof location !== 'undefined' ? location.search : '');
  return m ? m[1] === '1' : null;
})();
// Whether it is evening on her clock (or ?night=1), at Christmas.
function xmNightNow() {
  if (!CHRISTMAS_ON) return false;
  if (XM_NIGHT_URL !== null) return XM_NIGHT_URL;
  const h = new Date().getHours();
  return h >= 17 || h < 6;
}

// ---- Pictures ---------------------------------------------------------------------------

// Santa: red suit and hat, a white beard, a black belt with a gold buckle.
const XM_SANTA = [
  '..........ww....',
  '.......ooowww...',
  '.....oorrrrow...',
  '....orrrrrrRo...',
  '...orrrrrrrrRo..',
  '..owwwwwwwwwwwo.',
  '..owwwwwwwwwwwo.',
  '...osssssssso...',
  '...oskssssksso..',
  '...opsssssspso..',
  '..owwwssnsswwwo.',
  '..owwwwwwwwwwwo.',
  '..owwwwrrwwwwwo.',
  '...owwwwwwwwwo..',
  '..orrrowwworrro.',
  '.orrrrrowworrrro',
  'owrrrrrrwrrrrrwo',
  'osrrrrrrwrrrrrso',
  '.okkkkkyykkkkko.',
  '..orrrrrwrrrrro.',
  '..orrrrrwrrrrro.',
  '..owwwwwwwwwwwo.',
  '...orrro.orrro..',
  '...okkko.okkko..',
  '..okkkko.okkkko.',
];
const XM_SANTA_PAL = { o: '#3a2a44', r: '#e8404a', R: '#b02838', w: '#ffffff', s: '#ffe0c8', k: '#2e2a3a', p: '#ffadbc', n: '#f0a0a0', y: '#ffd34d' };
function xmSantaSprite(lookKey, frame) {
  const key = `xmsanta|${frame}`;
  if (villagerCache.has(key)) return villagerCache.get(key);
  const cv = makeCanvas(20, 34);
  const ctx = cv.getContext('2d');
  const rows = frame === 1 ? XM_SANTA.slice(0, -2).concat(['...okkko..okkko.', '..okkkko..okkkko']) : XM_SANTA;
  drawBitmap(ctx, rows, XM_SANTA_PAL, 2, 34 - rows.length);
  const sprite = { canvas: cv, ax: 10, ay: 33 };
  villagerCache.set(key, sprite);
  return sprite;
}
if (typeof LOOKS !== 'undefined' && LOOKS.santa) LOOKS.santa.draw = xmSantaSprite;

// Rudolph without his nose (XM_REINDEER, js/christmas.js, has it).
const XM_RUDOLPH_BARE = XM_REINDEER.map(r => r.replace(/r/g, '.'));
// A present Santa dropped: gold paper, a red ribbon (a sparkle twinkles over it).
const XM_HUNT_GIFT = [
  '...r.r...',
  '....r....',
  'ooooroooo',
  'oyyyryyyo',
  'oyzyryyyo',
  'rrrrrrrrr',
  'oyyyryyYo',
  'oyyyryyYo',
  'ooooroooo',
];
// Rudolph's red nose, shining.
const XM_NOSE = [
  '.ooo.',
  'orrro',
  'orwrr',
  'orrRo',
  '.ooo.',
];
// Snow to roll a snowman from, then one ball, then two.
const XM_HEAP = [
  '....wwww....',
  '..wwwwwwWw..',
  '.wwwWwwwwwW.',
  'wwwwwwwwwWWW',
];
const XM_BALL1 = [
  '...oooooo...',
  '..owwwwwWo..',
  '.owwwwwwwWo.',
  'owwwwwwwwwWo',
  'owwwwwwwwwWo',
  'owwwwwwwwWWo',
  '.owwwwwwWWo.',
  '..oooooooo..',
];
const XM_BALL2 = [
  '....oooo....',
  '...owwwWo...',
  '..owwwwwWo..',
  '..owwwwwWo..',
  '...owwwWo...',
].concat(XM_BALL1);
// A fireplace of red bricks with a wooden mantel; the fire is drawn live.
const XM_FIRE = [
  'tttttttttttttt',
  'TTTTTTTTTTTTTT',
  '.BbBBbBBbBBbB.',
  '.BBbBBkkBBbBB.',
  '.bBBkkkkkkBBb.',
  '.BBkkkkkkkkBB.',
  '.bBkkkkkkkkBb.',
  '.BBkkkkkkkkBB.',
  '.bBkkkkkkkkBb.',
  '.BBkkkkkkkkBB.',
  'aaaaaaaaaaaaaa',
];
const XM_FIRE_PAL = Object.assign({}, XM_PAL, { B: '#c0503a', b: '#9a3a2a', k: '#2a1a1e', a: '#a8a0b0' });
// Her stocking (empty, then full with a present peeking out).
const XM_SOCK = ['wwww', 'wwww', 'rrrr', 'rrrr', 'rrrr', 'rrrr', 'rrrrr.', 'rrrrrr', '.rrrrr'];
const XM_SOCK_FULL = ['.yy.', 'ybby', 'wwww', 'rrrr', 'rrrr', 'rrrr', 'rrrr', 'rrrrr.', 'rrrrrr', '.rrrrr'];

// ---- Things to tap -------------------------------------------------------------------------

// A thing on tile `s`, drawn live by `draw(ctx, x, y, t)` from its top-left
// corner in a `w` x `h` box standing on the tile; a tap calls `tap(o)`
// (tapObject in js/game.js).
function xmThing(sc, s, w, h, draw, tap, extra = {}) {
  const p = tileCenter(sc, s.c, s.r);
  const x = Math.round(p.x - w / 2);
  const y = Math.round(p.y + 3 - h);
  const o = Object.assign({ c0: s.c, r0: s.r, c1: s.c, r1: s.r, x, y, w, h, christmas: true, xmTap: tap }, extra);
  o.animated = (ctx, t) => draw(ctx, x, y, t);
  stillFrame(o);
  sc.objects.push(o);
  return o;
}
// A bitmap drawn `scale` times bigger at x, y (hwSprite keeps each one).
function xmPut(ctx, rows, pal, x, y, scale = 1, shadow = false) {
  const s = hwSprite(rows, pal, shadow, scale);
  ctx.drawImage(s.canvas, Math.round(x), Math.round(y));
  return s;
}
const xmSay = (text, voice) => Sound.say([{ text, narrator: !voice }], voice || undefined);
const xmPop = (o, fx) => touchReact(o, { fx }, { x: o.x + o.w / 2, y: o.y + o.h / 2 }, { x: o.x + o.w / 2, y: o.y });

// ---- Dressing a scene ------------------------------------------------------------------------

// Called from christmasDress (js/christmas.js) once a scene is decorated.
function xmPlay(sc) {
  if (sc.kind === 'town') { xmSanta(sc); xmHunt(sc); xmSnowman(sc); }
  if (sc.outdoor) xmSled(sc);
  if (sc.kind === 'room') xmRoom(sc);
}

// Santa and Rudolph by the big tree, facing into the square.
function xmSanta(sc) {
  const ring = [];
  for (let r = 16; r <= 24; r++) for (let c = 16; c <= 24; c++) {
    const d = Math.max(Math.abs(c - 19.5), Math.abs(r - 19.5));
    if (d < 2 || d > 4) continue;
    ring.push({ c, r, k: Math.abs(c - 22) + Math.abs(r - 21) + hash(c, r, 2701) });
  }
  ring.sort((a, b) => a.k - b.k);
  const outs = hwOuts(sc);
  const free = (c, r) => walkable(sc, c, r) && !sc.hwUsed.some(u => u.c === c && u.r === r) && !outs.some(o => hwNear(o, { c, r }, 1)) &&
    !sc.npcs.some(n => hwNear(n, { c, r }, 1));
  for (const s of ring) {
    if (!free(s.c, s.r)) continue;
    const beside = [{ c: s.c + 1, r: s.r }, { c: s.c, r: s.r + 1 }, { c: s.c - 1, r: s.r }, { c: s.c, r: s.r - 1 }].filter(b => free(b.c, b.r));
    if (!beside.length) continue;
    const santa = makeNpc({ who: I18n.t('christmas.santa'), look: 'santa', c: s.c, r: s.r }, null);
    Object.assign(santa, { santa: true, christmas: true });
    sc.npcs.push(santa);
    sc.hwUsed.push(s);
    const deer = hwPlace(sc, beside, 1, 0, b => xmRudolph(sc, b));
    if (!deer.length) { sc.npcs.pop(); sc.hwUsed.pop(); continue; }
    sc.xmSanta = santa;
    return;
  }
}

// Rudolph, twice as big as the reindeer in the gardens: his nose shines red
// once she has found it.
function xmRudolph(sc, s) {
  const sprite = hwSprite(XM_REINDEER, XM_DEER_PAL, true, 2);
  const w = sprite.canvas.width;
  const h = sprite.canvas.height;
  const o = xmThing(sc, s, w, h, (ctx, x, y, t) => {
    const lit = xmFound('nose');
    const bob = Math.round(Math.sin(t * 2.2) * 0.8);
    xmPut(ctx, lit ? XM_REINDEER : XM_RUDOLPH_BARE, XM_DEER_PAL, x, y + bob, 2, true);
    if (lit && Math.sin(t * 5) > 0) {
      ctx.fillStyle = 'rgba(255,90,90,0.6)';
      ctx.fillRect(x + 1, y + 13 + bob, 4, 4);
    }
  }, o => {
    xmPop(o, 'deer');
    xmSay(line(xmFound('nose') ? 'xmRudolph' : 'xmRudolphSad'));
  }, { rudolph: true });
  // Where his nose is, for its glow.
  sc.xmNoseAt = { x: o.x + 3, y: o.y + 15 };
  if (xmFound('nose')) sc.lamps.push({ x: sc.xmNoseAt.x, y: sc.xmNoseAt.y, small: true, christmas: true });
  return o;
}

// The nose and five presents, round the town, apart from each other.
function xmHunt(sc) {
  if (xmHuntDone() || !sc.xmSanta) return;
  const left = XM_HUNT.filter(id => !xmFound(id));
  const spots = hwSpots(sc, () => true).sort((a, b) => a.k - b.k);
  const taken = [];
  for (const id of left) {
    // Far from each other (the decorations may stand close by).
    const far = spots.filter(s => !taken.some(u => hwNear(u, s, 6)));
    const got = hwPlace(sc, far, 1, 0, s => xmHuntThing(sc, s, id));
    taken.push(...got);
  }
}
function xmHuntThing(sc, s, id) {
  {
    const nose = id === 'nose';
    const rows = nose ? XM_NOSE : XM_HUNT_GIFT;
    const w = rows[0].length * (nose ? 2 : 1) + 4;
    const h = rows.length * (nose ? 2 : 1) + 10;
    xmThing(sc, s, w, h, (ctx, x, y, t) => {
      const hop = Math.round(Math.abs(Math.sin(t * 3 + s.c)) * -2);
      xmPut(ctx, rows, XM_PAL, x, y + 10 + hop, nose ? 2 : 1, true);
      // A twinkle over it, so she can spot it.
      const k = (t * 2 + s.r) % 2;
      if (k < 1.2) {
        const a = Math.round(2 + Math.sin(k * Math.PI) * 2);
        ctx.fillStyle = '#fff6c0';
        ctx.fillRect(x + w / 2 - 0.5, y + 4 - a, 1, a * 2 + 1);
        ctx.fillRect(x + w / 2 - a, y + 4, a * 2 + 1, 1);
      }
    }, o => xmFind(sc, o, id), { xmHunt: id });
  }
}

// She found one: it pops, the narrator cheers, and the count shows.
function xmFind(sc, o, id) {
  const x = xmState();
  const key = `${xmYear()}:${id}`;
  sc.objects = sc.objects.filter(t => t !== o);
  const t = tileAt(sc, o.c0, o.r0);
  if (t) t.blocked = false;
  if (!x.found.includes(key)) x.found.push(key);
  save();
  touchReact({}, { fx: id === 'nose' ? 'deer' : 'gift' }, { x: o.x + o.w / 2, y: o.y + o.h }, { x: o.x + o.w / 2, y: o.y });
  Sound.sparkle();
  if (id === 'nose' && sc.xmNoseAt) sc.lamps.push({ x: sc.xmNoseAt.x, y: sc.xmNoseAt.y, small: true, christmas: true });
  const gifts = XM_HUNT.filter(k => k !== 'nose' && xmFound(k)).length;
  showPlace(I18n.t('christmas.huntCount', gifts, XM_HUNT.length - 1, xmFound('nose') ? 1 : 0));
  xmSay(line(id === 'nose' ? 'xmFoundNose' : 'xmFoundGift'));
  if (XM_HUNT.every(xmFound) && !xmHuntDone()) later(2200, () => xmSantaGift(sc));
}

// Santa's special present, once all six are found.
function xmSantaGift(sc) {
  if (xmHuntDone()) return;
  if (state.busy || state.gift || state.hero.path.length) { later(1500, () => xmSantaGift(sc)); return; }
  const x = xmState();
  x.done.push(xmYear());
  const giver = sc.xmSanta || xmSantaGiver();
  const value = Object.keys(TREASURES).find(k => TREASURES[k].santaGift && suits(TREASURES[k]));
  const said = line('santaThanks');
  if (!value) { save(); Sound.say([{ text: said }], voiceOf(giver)); return; }
  const gift = { slot: 'treasure', value, label: itemLabel('treasure', value), isNew: !state.owned.treasure.includes(value) };
  offerReward(giver, gift, said);
}
// Santa as the giver of what is in her stocking (he isn't in her room).
const xmSantaGiver = () => ({ name: I18n.t('christmas.santa'), look: 'santa', c: 0, r: 0, santa: true });

// A heap of snow near the square: tap, tap, tap and it is a snowman.
function xmSnowman(sc) {
  const near = hwSpots(sc, (t, c, r) => Math.abs(c - 19.5) + Math.abs(r - 19.5) < 12).sort((a, b) => a.k - b.k);
  hwPlace(sc, near, 1, 0, s => {
    let stage = 0;
    const stages = [XM_HEAP, XM_BALL1, XM_BALL2, XM_SNOWMAN];
    const o = xmThing(sc, s, 30, 42, (ctx, x, y) => {
      const rows = stages[stage];
      const scale = 2;
      const w = Math.max(...rows.map(r => r.length)) * scale + 4;
      xmPut(ctx, rows, XM_PAL, x + (30 - w) / 2, y + 42 - rows.length * scale - 2 * scale, scale, true);
    }, o => {
      const was = stage;
      stage = Math.min(3, stage + 1);
      stillFrame(o);
      xmPop(o, 'snow');
      xmSay(stage === 3 ? 'snowman!' : line('xmRoll'));
      if (was === 2) Sound.sparkle();
    }, { xmSnowman: true });
    o.stage = () => stage;
  });
}

// A sled at the top of a run of five clear tiles; she rides it down and,
// the next time, back up.
function xmSled(sc) {
  if (sc.kind === 'room' || sc.mathTrain) return;
  const outs = hwOuts(sc);
  const ok = (c, r) => {
    const t = tileAt(sc, c, r);
    return hwFloor(t) && !hwWay(t) && walkable(sc, c, r) && !hwWet(sc, c, r) && !outs.some(o => hwNear(o, { c, r }, 2)) &&
      !sc.npcs.some(n => hwNear(n, { c, r }, 1)) && !sc.hwUsed.some(u => u.c === c && u.r === r) &&
      !sc.objects.some(o => !o.background && c >= o.c0 - 1 && c <= o.c1 + 1 && r >= o.r0 - 1 && r <= o.r1 + 1);
  };
  const tiles = [];
  for (let r = 1; r < sc.D - 1; r++) for (let c = 1; c < sc.W - 1; c++) tiles.push({ c, r, k: hash(c, r, 2801) });
  tiles.sort((a, b) => a.k - b.k);
  for (const s of tiles) {
    for (const [dc, dr] of [[1, 0], [0, 1]]) {
      const run = [0, 1, 2, 3, 4].map(i => ({ c: s.c + dc * i, r: s.r + dr * i }));
      if (!run.every(t => ok(t.c, t.r))) continue;
      sc.hwUsed.push(...run);
      sc.xmSled = { at: run[0], end: run[4], ride: null };
      return;
    }
  }
}

// Her room: her tree (its ornaments from her answers), the fireplace with
// her stocking, and the Advent calendar, against the back walls.
function xmRoom(sc) {
  const outs = hwOuts(sc);
  const spots = [];
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) {
    const t = tileAt(sc, c, r);
    if ((c > 0 && r > 0) || !hwFloor(t) || outs.some(o => hwNear(o, { c, r }, 1)) || (sc.start && hwNear(sc.start, { c, r }, 1))) continue;
    if (sc.objects.some(o => (o.front || []).some(f => f.c === c && f.r === r))) continue;
    spots.push({ c, r });
  }
  const place = (key, make) => hwPlace(sc, spots.slice().sort((a, b) => key(a) - key(b)), 1, 0, make);
  place(s => s.c + s.r, s => xmRoomTree(sc, s));
  place(s => -(s.r === 0 ? 100 + s.c : s.r), s => xmFireplace(sc, s));
  place(s => Math.abs(s.r - sc.D / 2) + (s.c === 0 ? 0 : 50), s => xmCalendar(sc, s));
  xdRoom(sc); // her sweets, lights and decorations (js/christmas-decor.js)
}

// Her tree, three times as big as the little ones, with the ornaments and
// toys her answers gave her (xdTree, js/christmas-decor.js); a tap opens
// the decoration box.
function xmRoomTree(sc, s) {
  const scale = 3;
  const w = 92;
  const h = XM_TREE.length * scale + 16;
  xmThing(sc, s, w, h, (ctx, x, y, t) => xdTree(ctx, x, y, w, h, t, scale), o => {
    xmPop(o, 'xmtree');
    xdOpen('ornament');
  }, { xmRoomTree: true });
  sc.lamps.push(Object.assign({}, { x: tileCenter(sc, s.c, s.r).x, y: tileCenter(sc, s.c, s.r).y - h + 17, small: true, christmas: true }));
}

// Her stocking: hung one day, full the next.
const xmStockingFull = () => { const x = xmState(); return x.hung.some(d => d < xmDay() && !x.got.includes(d)); };
const xmHungToday = () => xmState().hung.includes(xmDay());
function xmFireplace(sc, s) {
  const scale = 2;
  const w = XM_FIRE[0].length * scale + 4;
  const h = XM_FIRE.length * scale + 4;
  const o = xmThing(sc, s, w, h, (ctx, x, y, t) => {
    xmPut(ctx, XM_FIRE, XM_FIRE_PAL, x, y + 4, scale);
    // The fire, flickering.
    for (let i = 0; i < 6; i++) {
      const fh = 3 + Math.round((Math.sin(t * 9 + i * 1.9) + 1) * 2.5);
      ctx.fillStyle = i % 2 ? '#ffd34d' : '#ff8a2a';
      ctx.fillRect(x + 2 + 7 * scale - 6 + i * 2, y + 4 + 10 * scale - fh, 2, fh);
    }
    const full = xmStockingFull();
    if (full || xmHungToday()) xmPut(ctx, full ? XM_SOCK_FULL : XM_SOCK, XM_PAL, x + 2 + 2 * scale, y + 4 + 2 * scale - (full ? 2 : 0));
  }, o => xmStocking(o), { xmFireplace: true });
  const p = tileCenter(sc, s.c, s.r);
  sc.lamps.push({ x: p.x, y: o.y + h - 6, christmas: true });
}
function xmStocking(o) {
  const x = xmState();
  const day = xmDay();
  xmPop(o, 'gift');
  const full = x.hung.filter(d => d < day && !x.got.includes(d));
  if (full.length) {
    x.got.push(...full);
    save();
    const giver = xmSantaGiver();
    if (hasNewGift({ level: 1 })) { offerReward(giver, null, line('santaStocking')); return; }
    xmCoins(`stocking:${day}`, 5);
    Sound.say([{ text: line('santaStocking') }], voiceOf(giver));
    return;
  }
  if (!x.hung.includes(day)) { x.hung.push(day); save(); xmSay(line('xmHang')); return; }
  xmSay(line('xmWait'));
}

// Coins for a door or a stocking, counted once whichever tablet it was on
// (keyed in the counters like the daily chest, js/quest.js).
function xmCoins(key, coins) {
  if (state.tally && state.tally.earned[key]) return;
  if (state.tally) state.tally.earned[key] = { coins };
  state.coins += coins;
  save();
  renderCoins(true);
  Sound.coin();
}

// The Advent calendar: a little wooden house with 24 doors, one to open a day.
const xmDoorsOpen = () => xmThis(xmState().advent).length;
function xmCalendar(sc, s) {
  const w = 26;
  const h = 34;
  xmThing(sc, s, w, h, (ctx, x, y, t) => {
    ctx.fillStyle = 'rgba(40,30,70,0.22)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 1, 11, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Roof, board and feet.
    for (let i = 0; i < 6; i++) px(ctx, x + 7 - i, y + 1 + i, 12 + 2 * i, 1, i % 2 ? '#c02a3a' : '#ff4a5a');
    px(ctx, x + 1, y + 7, 24, 24, '#3a2a44');
    px(ctx, x + 2, y + 8, 22, 22, '#8a5a2a');
    px(ctx, x + 12, y - 1, 2, 2, '#ffd34d');
    const open = xmDoorsOpen();
    const today = !xmState().advent.includes(xmDay()) && open < ADVENT_WORDS.length;
    for (let i = 0; i < 24; i++) {
      const dx = x + 3 + (i % 4) * 5;
      const dy = y + 9 + Math.floor(i / 4) * 3.5;
      const next = today && i === open;
      const col = i < open ? '#3a2a44' : next && Math.sin(t * 6) > 0 ? '#fff6c0' : ['#ff4a5a', '#3f9f58', '#ffd34d', '#6fb7ff'][(i + Math.floor(i / 4)) % 4];
      px(ctx, Math.round(dx), Math.round(dy), 4, 3, col);
      if (i < open) px(ctx, Math.round(dx) + 1, Math.round(dy) + 1, 2, 1, '#ffd34d');
    }
    px(ctx, x + 3, y + 30, 3, 2, '#5e3a1e');
    px(ctx, x + 20, y + 30, 3, 2, '#5e3a1e');
  }, o => xmAdvent(o), { xmCalendar: true });
}
function xmAdvent(o) {
  const x = xmState();
  const day = xmDay();
  const n = xmDoorsOpen();
  if (x.advent.includes(day) || n >= ADVENT_WORDS.length) { xmPop(o, 'jingle'); xmSay(line('xmAdventDone')); return; }
  x.advent.push(day);
  save();
  const [word, emoji] = ADVENT_WORDS[n];
  xmPop(o, 'gift');
  Sound.sparkle();
  xmCoins(`advent:${day}`, 3);
  showPlace(I18n.t('christmas.adventDoor', n + 1, emoji, word, 3));
  Sound.say([{ text: line('xmDoor', { n: n + 1 }), narrator: true }, { pause: 300 }, { text: `${word}!`, narrator: true }]);
}

// ---- Every frame -----------------------------------------------------------------------------

// On the ground, under everything (drawScene in js/game.js): her footprints
// and the sled's tracks in the snow, and the sled.
function christmasGround(ctx, sc, now) {
  if (!sc.xmDone) return;
  if (sc.outdoor) xmPrints(ctx, sc, now);
  const sled = sc.xmSled;
  if (!sled) return;
  const ride = sled.ride;
  let at = sled.at;
  if (ride) {
    const u = Math.min(1, (now - ride.t0) / 1500);
    const e = u * u * (3 - 2 * u);
    at = { c: ride.from.c + (ride.to.c - ride.from.c) * e, r: ride.from.r + (ride.to.r - ride.from.r) * e };
    Object.assign(state.hero, { c: at.c, r: at.r, path: [], frame: 0 });
    if (u >= 1) {
      sled.ride = null;
      sled.at = ride.to;
      sled.end = ride.from;
      state.hero.c = ride.to.c;
      state.hero.r = ride.to.r;
      state.busy = busyNow();
    }
  }
  const p = tileCenter(sc, at.c, at.r);
  xmPut(ctx, XM_SLED, XM_PAL, p.x - 9, p.y - 6, 1);
  sled.x = p.x;
  sled.y = p.y;
}

// Footprints fade after a while; the sled leaves two lines.
function xmPrints(ctx, sc, now) {
  const prints = sc.xmPrints || (sc.xmPrints = []);
  const h = state.hero;
  if (state.scene === sc && (h.path.length || (sc.xmSled && sc.xmSled.ride)) && !state.mathRide) {
    const last = prints[prints.length - 1];
    if (!last || now - last.t > 150) {
      const p = tileCenter(sc, h.c, h.r);
      prints.push({ x: p.x, y: p.y, t: now, side: last ? -last.side : 1, sled: !!(sc.xmSled && sc.xmSled.ride) });
      if (prints.length > 90) prints.shift();
    }
  }
  for (const f of prints) {
    const a = 1 - (now - f.t) / 9000;
    if (a <= 0) continue;
    ctx.fillStyle = `rgba(120,140,190,${(0.45 * a).toFixed(3)})`;
    if (f.sled) { ctx.fillRect(Math.round(f.x - 5), Math.round(f.y), 2, 1); ctx.fillRect(Math.round(f.x + 4), Math.round(f.y + 1), 2, 1); }
    else ctx.fillRect(Math.round(f.x + f.side * 2), Math.round(f.y + f.side * 0.5), 2, 1);
  }
}

// Over the scene in the evening (from christmasDraw): the windows glow
// and the northern lights wave across the top of the view.
function xmNightDraw(ctx, sc, now, view) {
  const t = now / 1000;
  if (sc.xmWindows) {
    for (const w of sc.xmWindows) {
      px(ctx, w.x - 2, w.y - 3, 4, 5, '#3a2a44');
      px(ctx, w.x - 1, w.y - 2, 2, 3, Math.sin(t + w.x) > -0.9 ? '#ffe9a0' : '#ffd060');
    }
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  const W = view.width;
  const H = view.height;
  [['#3aff9a', 0.2, 0.08, 0], ['#5ad8ff', 0.15, 0.14, 2], ['#b07aff', 0.12, 0.2, 4]].forEach(([col, alpha, top, ph]) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(8, H * 0.035);
    ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      ctx.globalAlpha = alpha * (0.55 + 0.45 * Math.sin(t * 0.7 + ph + k));
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 16) {
        const y = H * top + Math.sin(x / (W * 0.18) + t * 0.35 + ph) * H * 0.04 + Math.sin(x / (W * 0.07) - t * 0.6 + k) * H * 0.012 + k * H * 0.025;
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
  ctx.restore();
}

// Taps that christmasTap takes first (js/christmas.js): the sled, which lies
// on the ground. True when it took the tap.
function xmPlayTap(wx, wy) {
  const sc = state.scene;
  const sled = sc.xmSled;
  if (!sled || sled.ride || sled.x === undefined || Math.abs(wx - sled.x) > 14 || Math.abs(wy - (sled.y - 2)) > 9) return false;
  Sound.tap();
  const ride = () => {
    if (sled.ride || state.busy) return;
    state.busy = true;
    sled.ride = { from: sled.at, to: sled.end, t0: performance.now() };
    xmSay(line('xmWhee'));
  };
  if (!walkTo((c, r) => c === sled.at.c && r === sled.at.r, ride)) ride();
  return true;
}

// Every new line, said once (tools/check-tts.js checks they are recorded).
function xmEveryLine() {
  const santa = voiceOf(xmSantaGiver());
  for (const t of PERSONA.santa) Sound.say([{ text: line('santa', {}, [t]) }], santa);
  for (const k of ['santaThanks', 'santaStocking']) Sound.say([{ text: line(k) }], santa);
  for (const k of ['xmFoundGift', 'xmFoundNose', 'xmRudolphSad', 'xmRudolph', 'xmTree', 'xmTreeEmpty', 'xmHang', 'xmWait', 'xmAdventDone', 'xmRoll', 'xmWhee']) {
    for (const t of LINES[k]) xmSay(line(k, {}, [t]));
  }
  ADVENT_WORDS.forEach(([word], i) => { xmSay(line('xmDoor', { n: i + 1 })); xmSay(`${word}!`); });
  xmSay('snowman!');
  xdEveryLine(); // js/christmas-decor.js
}
