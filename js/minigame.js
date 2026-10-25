// The fisherman's game at the town pond; in the robot edition the fishing
// robot works a magnet crane over boxes instead. FISHING.fish fish, each
// with a picture, swim by and he says "Catch the fish that starts with /m/!"
// with the letter's pure sound (the letter shows at the top too). She taps
// the fish whose word starts with that sound: it is reeled into the bucket
// and the narrator says "moon starts with M.". A wrong fish swims away, she
// hears its word and the sound again, and after two misses the right fish
// glows. FISHING.rounds fish fill the bucket and pay FISHING.coins coins.
// It starts from the 🎣 button in the fisherman's dialog, the 🎣 over the
// pond, or a tap on the pond. Nothing here is needed to go on in the game.

const mini = {
  el: document.getElementById('mini'),
  canvas: document.getElementById('mini-canvas'),
  title: document.getElementById('mini-title'),
  pips: document.getElementById('mini-pips'),
  letter: document.getElementById('mini-letter'),
  end: document.getElementById('mini-end'),
  catch: document.getElementById('mini-catch'),
  coins: document.getElementById('mini-coins'),
  button: document.getElementById('dlg-mini'),
  npc: null,
  rounds: [],     // [{ info, fish: [{ w, e, letter, right }] }]
  round: -1,
  items: [],      // fish (boxes) in the water
  caught: [],
  misses: 0,
  locked: true,   // until the sound has been said
  turn: 0,        // bumps whenever the game moves on, so stale callbacks give up
  anim: null,     // the right one being reeled in: { it, t0 }
  splashes: [],
  ripples: [],
  timers: [],
  trolley: 104,   // where the crane's magnet hangs (robot edition)
  view: { k: 1, bx: 0, by: 0 },
  buf: null,
  last: 0,
  loop: 0,
};
// The picture is drawn in a box this many pixels big, scaled up in whole
// pixels to fill the screen; the water starts at MINI_WATER.
const MINI_W = 208;
const MINI_H = 128;
const MINI_WATER = 44;
const MINI_CATCH_MS = () => (isCaptain() ? 1600 : 1100);
const MINI_COLORS = ['#ff9ec4', '#ffd36b', '#8fd3ff', '#b9a0ff', '#8fe8c4', '#ffb08a'];

// Like later() in js/game.js: while the parent panel is open, timers wait.
function miniLater(ms, fn) { mini.timers.push(setTimeout(() => whenPlaying(fn), ms)); }
function miniClear() { mini.timers.forEach(clearTimeout); mini.timers = []; }

// The fisherman in town (the fishing robot in the robot edition).
const miniFisher = () => { const sc = state.scenes.town; return sc ? sc.npcs.find(n => /fisher/.test(n.look)) : null; };

// ---- Questions -----------------------------------------------------------

// Words she can name from the picture alone, by letter.
function miniWords() {
  return LETTERS.map(info => ({ info, words: info.words.filter(([w]) => !WEAK_PICTURES.has(w)) })).filter(x => x.words.length);
}
// Letters she can't tell apart yet, or that say the same sound (HARD_PAIRS),
// never swim in one round.
function miniClash(a, b) {
  const pairs = HARD_PAIRS.vowels.concat(HARD_PAIRS.consonants, HARD_PAIRS.same);
  const clash = (x, y) => x === y || pairs.some(([p, q]) => (p === x && q === y) || (p === y && q === x));
  // Every C word here starts with /k/, so c is also checked as k (g and k).
  const k = l => (l === 'c' ? 'k' : l);
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return clash(x, y) || clash(k(x), k(y));
}
// The first letters of what she may call a fish's picture: its letter, and
// its other names (ALIAS: 🐂 ox is a cow to her, 🚐 van a car).
const miniHeads = f => [f.letter].concat((ALIAS[f.w] || []).map(m => m[0]));
// Two fish she could take for each other: the same picture, or names that
// start with letters that clash.
const miniLike = (a, b) => a.e === b.e || miniHeads(a).some(x => miniHeads(b).some(y => miniClash(x, y)));
// A different letter each round, and fish whose words (by any name she
// may use for them) start with letters that don't sound like it or like
// each other.
function miniRounds() {
  const all = miniWords();
  const fishOf = x => shuffle(x.words.map(([w, e]) => ({ w, e, letter: x.info.letter })));
  return shuffle(all.slice()).slice(0, FISHING.rounds).map(t => {
    const fish = [pick(fishOf(t))];
    for (const o of shuffle(all.filter(x => x !== t))) {
      const f = fish.length < FISHING.fish && fishOf(o).find(y => !fish.some(x => miniLike(x, y)));
      if (f) fish.push(f);
    }
    return { info: t.info, fish: fish.map((f, i) => Object.assign(f, { right: i === 0 })) };
  });
}
// "/m/": the letter's pure sound, in the narrator's voice (js/audio.js).
const miniSound = r => ({ text: `/${r.info.letter.toLowerCase()}/`, narrator: true });
const miniQuestion = r => [{ text: line('fishAsk') }, { pause: 150 }, miniSound(r)];

// ---- Opening and closing -----------------------------------------------

// The fisherman's dialog gets a "let's fish" button.
function miniDialog(npc) {
  const fisher = !!npc && npc === miniFisher() && state.scene === state.scenes.town;
  mini.button.classList.toggle('hidden', !fisher);
  mini.button.textContent = isCaptain() ? '🧲 크레인 놀이' : '🎣 낚시 놀이';
}

// Walks her to the fisherman and starts. True when there is a pond game here.
function miniGo() {
  const npc = miniFisher();
  if (!npc || state.scene !== state.scenes.town) return false;
  Sound.tap();
  const isNext = (c, r) => Math.abs(c - npc.c) + Math.abs(r - npc.r) === 1;
  if (!walkTo(isNext, () => { faceEachOther(npc); openMini(npc); })) openMini(npc);
  return true;
}

// Not once today's play time is used up: 🔁 (or 🎣 in his dialog) closes
// one card and opens the next at once, so the town could never fall asleep.
function openMini(npc) {
  if (!npc || state.busy || guideTimeUp()) return;
  state.busy = true;
  miniClear();
  Object.assign(mini, { npc, rounds: miniRounds(), round: -1, items: [], caught: [], anim: null, splashes: [], ripples: [], last: 0, trolley: 104 });
  mini.title.textContent = isCaptain() ? '🧲 자석 크레인' : '🎣 낚시 놀이';
  mini.end.classList.add('hidden');
  mini.el.classList.remove('hidden');
  miniNext(true);
  if (!mini.loop) mini.loop = requestAnimationFrame(miniFrame);
}

function closeMini() {
  if (mini.el.classList.contains('hidden')) return;
  Sound.tap();
  Sound.say([]);
  miniClear();
  mini.turn++;
  mini.el.classList.add('hidden');
  mini.items = [];
  mini.anim = null;
  state.busy = busyNow(); // js/game.js
}

// ---- Playing -------------------------------------------------------------

// The next fish to catch: the ones left swim off, new ones swim in.
function miniNext(first) {
  mini.round++;
  for (const it of mini.items) if (it.state === 'swim') { it.state = 'leave'; it.vx = Math.sign(it.vx) * 60; }
  if (mini.round >= mini.rounds.length) { miniFinish(); return; }
  const r = mini.rounds[mini.round];
  mini.misses = 0;
  const lanes = shuffle([0, 1, 2, 3]);
  const span = MINI_W - 40;
  const slots = shuffle([0, 1, 2, 3]);
  mini.items = mini.items.concat(shuffle(r.fish.slice()).map((f, i) => {
    const dir = lanes[i] % 2 ? 1 : -1;
    return Object.assign({}, f, {
      lane: lanes[i], x: 20 + (slots[i] + 0.2 + Math.random() * 0.6) * (span / 4), y: 62 + lanes[i] * 18,
      vx: dir * (6 + Math.random() * 5), ph: Math.random() * 6, color: MINI_COLORS[(mini.round + i) % MINI_COLORS.length],
      state: 'swim', born: performance.now(), glow: false,
    });
  }));
  miniRender();
  miniAsk(first);
}

// Says the question with the fish waiting; they can be caught once the sound
// has been heard (or a few seconds later, if the voice is slow or missing).
function miniAsk(first) {
  const r = mini.rounds[mini.round];
  const turn = ++mini.turn;
  mini.locked = true;
  const ready = () => { if (mini.turn === turn) mini.locked = false; };
  const hello = first ? [{ text: line('fishHello') }, { pause: 350 }] : [];
  miniSay(hello.concat(miniQuestion(r), { call: ready }), first ? 8000 : 6000, ready);
}

function miniSay(parts, ms, ready) {
  if (Sound.muted) ready();
  else miniLater(ms, ready);
  Sound.say(parts, voiceOf(mini.npc));
}

// 🔊 or the letter: the question again.
function miniReplay() {
  const r = mini.rounds[mini.round];
  if (!r || mini.anim || !mini.end.classList.contains('hidden')) return;
  Sound.tap();
  // Still waiting for the sound: ask again, and the fish open after it.
  if (mini.locked) miniAsk(false);
  else Sound.say(miniQuestion(r), voiceOf(mini.npc));
}

function miniTapAt(e) {
  e.preventDefault();
  const p = miniPoint(e);
  mini.ripples.push({ x: p.x, y: p.y, t0: performance.now() });
  if (mini.locked || mini.anim || !mini.end.classList.contains('hidden')) return;
  let hit = null;
  let best = Infinity;
  for (const it of mini.items) {
    if (it.state !== 'swim') continue;
    const dx = Math.abs(p.x - it.x);
    const dy = Math.abs(p.y - it.y);
    if (dx < 19 && dy < 13 && dx + dy < best) { best = dx + dy; hit = it; }
  }
  if (!hit) return;
  if (hit.right) miniCatch(hit);
  else miniMiss(hit);
}

// The right one: reeled in (or picked up by the magnet), and its word said.
function miniCatch(it) {
  const turn = ++mini.turn;
  mini.locked = true;
  it.state = 'caught';
  mini.anim = { it, t0: performance.now(), x0: it.x, y0: it.y, from: mini.trolley };
  mini.caught.push(it);
  questAdd('fish'); // today's adventures (js/quest.js)
  Sound.correct();
  if (!isCaptain()) { Sound.tune('splash'); miniSplash(it.x, it.y, 14); }
  miniRender();
  // On to the next one once it is in the bucket and its word has been said.
  const next = () => { if (mini.turn === turn) { mini.anim = null; miniNext(false); } };
  let wait = Sound.muted ? 1 : 2;
  const done = () => { if (--wait <= 0) next(); };
  miniLater(MINI_CATCH_MS() + 200, done);
  miniLater(MINI_CATCH_MS() + 4500, next);
  Sound.say([{ pause: 250 }, { text: `${it.w} starts with ${it.letter}.`, narrator: true }, { pause: 300 }, { call: done }], voiceOf(mini.npc));
}

// A wrong one swims away; she hears its word and the sound again. After two
// misses the right one glows.
function miniMiss(it) {
  const r = mini.rounds[mini.round];
  mini.misses++;
  Sound.oops();
  it.state = 'flee';
  it.vx = (it.x < MINI_W / 2 ? -1 : 1) * 75;
  miniSplash(it.x, it.y, 10);
  if (mini.misses >= 2) for (const x of mini.items) if (x.right && x.state === 'swim') x.glow = true;
  const turn = ++mini.turn;
  mini.locked = true;
  const ready = () => { if (mini.turn === turn) mini.locked = false; };
  miniSay([{ text: it.w, narrator: true, show: `${it.w}…` }, { pause: 350 }, { text: line('listen') }, { pause: 150 }, miniSound(r), { call: ready }], 5000, ready);
}

function miniFinish() {
  mini.locked = true;
  ++mini.turn;
  state.coins += FISHING.coins;
  renderCoins(true);
  save();
  Sound.party();
  mini.catch.textContent = `${isCaptain() ? '🚚' : '🪣'} ${mini.caught.map(it => it.e).join(' ')}`;
  mini.coins.textContent = `🪙 +${FISHING.coins}`;
  mini.end.classList.remove('hidden');
  Sound.say([{ pause: 400 }, { text: line('fishDone') }], voiceOf(mini.npc));
}

// Round pips (a fish or box for each one caught) and the letter to listen for.
function miniRender() {
  const icon = isCaptain() ? '📦' : '🐟';
  mini.pips.innerHTML = mini.rounds.map((r, i) => `<span class="pip${i < mini.caught.length ? ' on' : ''}">${i < mini.caught.length ? icon : ''}</span>`).join('');
  const r = mini.rounds[Math.min(mini.round, mini.rounds.length - 1)];
  if (!r) return;
  mini.letter.textContent = r.info.letter + r.info.letter.toLowerCase();
  mini.letter.style.setProperty('--l', shade(r.info.color, -25));
}

function miniSplash(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const v = 20 + Math.random() * 40;
    mini.splashes.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, col: i % 3 ? '#ffffff' : '#bfeaff' });
  }
}

// ---- Drawing -------------------------------------------------------------

function miniFrame(now) {
  mini.loop = 0;
  if (mini.el.classList.contains('hidden')) return;
  const dt = Math.min(0.05, mini.last ? (now - mini.last) / 1000 : 0);
  mini.last = now;
  miniUpdate(dt, now);
  miniDraw(now);
  mini.loop = requestAnimationFrame(miniFrame);
}

function miniUpdate(dt, now) {
  if (state.paused) return; // the parent panel is open: everything waits
  const v = mini.view;
  const left = -v.bx - 18;
  const right = (mini.buf ? mini.buf.width : MINI_W) - v.bx + 18;
  for (const it of mini.items) {
    if (it.state === 'caught') continue;
    it.x += it.vx * dt;
    if (it.state === 'swim') {
      if (it.x < left) it.x = right;
      if (it.x > right) it.x = left;
    }
  }
  mini.items = mini.items.filter(it => it.state === 'swim' || (it.state === 'caught' ? !!mini.anim && mini.anim.it === it : it.x > left - 30 && it.x < right + 30));
  for (const p of mini.splashes) { p.vy += 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  mini.splashes = mini.splashes.filter(p => p.life > 0);
  mini.ripples = mini.ripples.filter(r => now - r.t0 < 500);
  // The magnet drifts back to the middle between catches.
  if (isCaptain() && !mini.anim) mini.trolley += (104 - mini.trolley) * Math.min(1, dt * 1.5);
}

// The tap in picture pixels.
function miniPoint(e) {
  const box = mini.canvas.getBoundingClientRect();
  const v = mini.view;
  const dpr = mini.canvas.width / Math.max(1, box.width);
  return { x: ((e.clientX - box.left) * dpr) / v.k - v.bx, y: ((e.clientY - box.top) * dpr) / v.k - v.by };
}

function miniDraw(now) {
  const cv = mini.canvas;
  const dpr = window.devicePixelRatio || 1;
  const W = Math.round(cv.clientWidth * dpr);
  const H = Math.round(cv.clientHeight * dpr);
  if (!W || !H) return;
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  // Whole screen pixels per picture pixel, as big as the box fits (on a
  // small screen a fraction, so it isn't tiny); the sky, the bank and the
  // water carry on past it to the edges.
  const fit = Math.min(W / MINI_W, H / MINI_H);
  const k = fit >= 4 ? Math.floor(fit) : Math.max(0.5, fit);
  const LW = Math.ceil(W / k);
  const LH = Math.ceil(H / k);
  if (!mini.buf || mini.buf.width !== LW || mini.buf.height !== LH) mini.buf = makeCanvas(LW, LH);
  const bx = Math.floor((LW - MINI_W) / 2);
  const by = Math.floor((LH - MINI_H) / 2);
  mini.view = { k, bx, by };
  const g = mini.buf.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, LW, LH);
  const t = now / 1000;
  miniBackdrop(g, LW, LH, bx, by, t);
  g.translate(bx, by);
  const art = isCaptain() ? miniCrane : miniRod;
  art.back(g, t, now);
  for (const it of mini.items) if (it !== (mini.anim && mini.anim.it)) miniItem(g, it, t, now);
  art.front(g, t, now);
  for (const p of mini.splashes) px(g, Math.round(p.x), Math.round(p.y), 1, 1, p.col);

  const ctx = cv.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(mini.buf, 0, 0, LW * k, LH * k);
  // Pictures on the fish, sharp at screen resolution.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const at = (x, y) => ({ x: (x + bx) * k, y: (y + by) * k });
  const shown = mini.items.filter(it => it !== (mini.anim && mini.anim.it)).map(it => ({ it, p: miniItemAt(it, t) }));
  if (mini.anim) shown.push({ it: mini.anim.it, p: art.carried(now) });
  for (const { it, p } of shown) {
    if (!p) continue;
    const q = at(p.x, p.y);
    ctx.globalAlpha = it.state === 'leave' ? 0.6 : 1;
    ctx.font = `${Math.round((isCaptain() ? 11 : 9.5) * k * (p.s || 1))}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.fillText(it.e, q.x, q.y + k * 0.5);
    if (it.glow && it.state === 'swim') {
      const b = Math.abs(Math.sin(now / 260)) * 3 * k;
      ctx.font = `${Math.round(12 * k)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText('👆', q.x + 6 * k, q.y + 8 * k + b);
      ctx.textBaseline = 'middle';
    }
  }
  ctx.globalAlpha = 1;
  // Where she tapped.
  for (const r of mini.ripples) {
    const kk = (now - r.t0) / 500;
    const q = at(r.x, r.y);
    ctx.strokeStyle = `rgba(255,255,255,${1 - kk})`;
    ctx.lineWidth = Math.max(2, k * (1 - kk));
    ctx.beginPath();
    ctx.ellipse(q.x, q.y, (3 + kk * 8) * k, (1.5 + kk * 4) * k, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Sky, the far bank (or the dock) and the water, across the whole canvas.
function miniBackdrop(g, LW, LH, bx, by, t) {
  const W0 = by + MINI_WATER;
  const sky = isCaptain() ? ['#a8d8ff', '#c4e4ff', '#dcefff'] : ['#ffd6ec', '#f4dcf4', '#d8e8ff'];
  const band = Math.max(1, Math.ceil((by + 20) / 3));
  sky.forEach((c, i) => px(g, 0, i * band, LW, band, c));
  if (isCaptain()) {
    // Warehouses far off, then the concrete dock with a safety stripe.
    for (let x = -((bx) % 40); x < LW; x += 40) {
      px(g, x + 4, by + 8, 22, 14, '#bcd0e8');
      px(g, x + 4, by + 8, 22, 2, '#a8bed8');
      px(g, x + 28, by + 14, 10, 8, '#c8d8ec');
    }
    px(g, 0, by + 22, LW, W0 - by - 22, '#c8d0dc');
    for (let x = -(bx % 16); x < LW; x += 16) px(g, x, by + 22, 1, W0 - by - 24, '#b0bacb');
    px(g, 0, by + 30, LW, 1, '#b0bacb');
    for (let x = -(bx % 8); x < LW; x += 8) { px(g, x, W0 - 3, 4, 3, '#ffd34d'); px(g, x + 4, W0 - 3, 4, 3, '#3a3550'); }
  } else {
    // Soft hills, then the grassy bank with flowers.
    for (let x = 0; x < LW; x++) {
      const hgt = 5 + Math.round(Math.sin((x + bx) / 13) * 2 + Math.sin((x + bx) / 5.3) * 1.2);
      px(g, x, by + 22 - hgt, 1, hgt, '#b8e8a8');
    }
    px(g, 0, by + 22, LW, W0 - by - 22, '#8ed872');
    for (let i = 0; i < LW; i += 7) {
      const y = by + 25 + ((i * 7) % 15);
      px(g, i + ((i * 3) % 5), y, 1, 1, (i / 7) % 3 < 1 ? '#ffffff' : (i / 7) % 3 < 2 ? '#ff9ec4' : '#fff27a');
      px(g, i + 3, by + 24 + ((i * 11) % 17), 1, 1, '#6cbc5c');
    }
  }
  // Water, deeper toward the bottom, with drifting glints.
  const water = isCaptain() ? ['#7fc4ec', '#5ea8e0', '#4a90d4'] : ['#8fd8f4', '#6cc0ec', '#58a8e4'];
  const deep = Math.ceil((LH - W0) / 3);
  water.forEach((c, i) => px(g, 0, W0 + i * deep, LW, deep, c));
  px(g, 0, W0, LW, 1, '#e4f8ff');
  for (let i = 0; i < 22; i++) {
    const x = Math.round(((i * 37 + t * (4 + (i % 3) * 2)) % (LW + 12)) - 6);
    const y = W0 + 5 + ((i * 23) % Math.max(1, LH - W0 - 8));
    if (Math.sin(t * 1.3 + i) > -0.2) px(g, x, y, 3 + (i % 2), 1, 'rgba(255,255,255,0.55)');
  }
  if (!isCaptain()) {
    // Lily pads at the sides.
    for (const [x, y] of [[bx - 14, W0 + 30], [bx + MINI_W + 6, W0 + 18], [bx + MINI_W - 18, W0 + 72], [bx + 4, W0 + 66]]) {
      px(g, x, y, 8, 3, '#5fc46a');
      px(g, x + 1, y - 1, 6, 1, '#7fd88a');
      px(g, x + 5, y, 1, 2, '#58a8e4');
    }
  }
}

// Where an item is drawn now: bobbing as it swims.
function miniItemAt(it, t) {
  return { x: Math.round(it.x), y: Math.round(it.y + Math.sin(t * 2.2 + it.ph) * 1.2) };
}

function miniItem(g, it, t, now) {
  const p = miniItemAt(it, t);
  if (it.glow && it.state === 'swim') {
    const col = Math.floor(now / 200) % 2 ? '#fff27a' : '#ffc21a';
    for (let a = 0; a < Math.PI * 2; a += 0.12) px(g, Math.round(p.x + Math.cos(a) * 19), Math.round(p.y + Math.sin(a) * 12), 1, 1, col);
  }
  if (isCaptain()) {
    const s = miniBoxSprite();
    g.drawImage(s, p.x - 13, p.y - 10);
    return;
  }
  const s = miniFishSprite(it.color, Math.floor(t * 4 + it.ph) % 2);
  const left = it.vx < 0;
  if (left) {
    g.save();
    g.translate(p.x + 16, p.y - 8);
    g.scale(-1, 1);
    g.drawImage(s, 0, 0);
    g.restore();
  } else g.drawImage(s, p.x - 16, p.y - 8);
}

// A round pastel fish facing right, with a white patch for its picture.
// Frame 1 flicks the tail.
const miniFishCache = new Map();
function miniFishSprite(color, frame) {
  const ck = `${color}|${frame}`;
  if (miniFishCache.has(ck)) return miniFishCache.get(ck);
  const W = 33;
  const H = 17;
  const cx = 18;
  const cy = 8.5;
  const kind = (x, y) => {
    const u = (x + 0.5 - cx) / 11.5;
    const v = (y + 0.5 - cy) / 6.8;
    if (u * u + v * v <= 1) return 'body';
    const tx = x + 0.5;
    const half = 1 + (8 - tx) * 0.9 + (frame ? 0.6 : 0);
    if (tx >= 1 && tx <= 8 && Math.abs(y + 0.5 - cy - (frame ? 0.5 : -0.5) * (8 - tx) / 8) <= half) return 'tail';
    if (x >= 15 && x <= 21 && y >= 0 && y <= 2 && y >= 2 - (x - 14) / 2.2) return 'fin';
    return null;
  };
  const cv = makeCanvas(W, H);
  const g = cv.getContext('2d');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = kind(x, y);
    if (k) {
      let col = k === 'body' ? color : shade(color, -28);
      if (k === 'body' && y > cy + 2.5) col = shade(color, 30);
      else if (k === 'body' && y < cy - 4) col = shade(color, -12);
      px(g, x, y, 1, 1, col);
    } else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => kind(x + dx, y + dy))) px(g, x, y, 1, 1, '#3a2c50');
  }
  // The patch for the picture, the eye and a smile.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (((x + 0.5 - 16) / 6.2) ** 2 + ((y + 0.5 - cy) / 5.6) ** 2 <= 1) px(g, x, y, 1, 1, '#ffffff');
  }
  px(g, 24, 5, 2, 2, '#ffffff');
  px(g, 25, 6, 1, 1, '#2a2040');
  px(g, 27, 10, 2, 1, '#3a2c50');
  miniFishCache.set(ck, cv);
  return cv;
}

// A wooden box with a white label for its picture.
let miniBoxCanvas = null;
function miniBoxSprite() {
  if (miniBoxCanvas) return miniBoxCanvas;
  const W = 26;
  const H = 20;
  const cv = makeCanvas(W, H);
  const g = cv.getContext('2d');
  px(g, 0, 0, W, H, '#3a3550');
  px(g, 1, 1, W - 2, H - 2, '#d8a060');
  for (let y = 4; y < H - 1; y += 5) px(g, 1, y, W - 2, 1, '#b07a48');
  px(g, 1, 1, 3, H - 2, '#c08850');
  px(g, W - 4, 1, 3, H - 2, '#c08850');
  px(g, 1, 1, W - 2, 1, '#f0c080');
  px(g, 5, 3, 16, 14, '#3a3550');
  px(g, 6, 4, 14, 12, '#ffffff');
  for (const [x, y] of [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3]]) px(g, x, y, 1, 1, '#8a94a8');
  miniBoxCanvas = cv;
  return cv;
}

// Princess: the fisherman on his pier with a rod; the line drops to the
// fish she picked and it jumps up into his bucket.
const MINI_TIP = { x: 66, y: 10 };
const MINI_BUCKET = { x: 56, y: 36 };
const miniRod = {
  back(g, t) {
    // The pier, its posts in the water, and the bucket.
    px(g, 6, MINI_WATER - 6, 62, 8, '#8a5a3a');
    px(g, 6, MINI_WATER - 6, 62, 7, '#c8905a');
    for (let x = 6; x < 68; x += 7) px(g, x, MINI_WATER - 6, 1, 7, '#a8703f');
    for (const x of [10, 34, 60]) px(g, x, MINI_WATER + 1, 3, 9, '#7a4a2e');
    const sprite = villagerSprite(mini.npc.look, 0);
    g.drawImage(sprite.canvas, 30 - sprite.ax, MINI_WATER - 4 - sprite.ay);
    // Bucket.
    const b = MINI_BUCKET;
    px(g, b.x - 6, b.y - 7, 13, 1, '#3a3550');
    px(g, b.x - 6, b.y - 6, 1, 7, '#3a3550');
    px(g, b.x + 6, b.y - 6, 1, 7, '#3a3550');
    px(g, b.x - 5, b.y + 1, 11, 1, '#3a3550');
    px(g, b.x - 5, b.y - 6, 11, 7, '#a8bcd8');
    px(g, b.x - 5, b.y - 3, 11, 1, '#8aa0c0');
    px(g, b.x - 4, b.y - 6, 9, 1, '#5aa0e0');
    for (let i = 0; i < mini.caught.length && i < 5; i++) px(g, b.x - 4 + i * 2, b.y - 8 - (i % 2), 1, 2, MINI_COLORS[i % MINI_COLORS.length]);
    for (let x = 0; x < 13; x++) px(g, b.x - 6 + x, b.y - 9 - Math.round(Math.sin((x / 12) * Math.PI) * 3), 1, 1, '#5a6478');
  },
  front(g, t, now) {
    // The rod from his hands, and the line to the float (or the fish).
    miniLine(g, 36, MINI_WATER - 18, MINI_TIP.x, MINI_TIP.y, '#7a4a2e');
    const end = this.lineEnd(now, t);
    miniLine(g, MINI_TIP.x, MINI_TIP.y, end.x, end.y, 'rgba(255,255,255,0.9)');
    if (!mini.anim) {
      px(g, end.x - 1, end.y - 1, 3, 2, '#ff5a6a');
      px(g, end.x - 1, end.y + 1, 3, 1, '#ffffff');
    } else {
      const p = this.carried(now);
      if (p) {
        // Wriggling, facing the way it flies.
        const s = miniFishSprite(mini.anim.it.color, Math.floor(now / 90) % 2);
        const left = p.x > MINI_BUCKET.x || (p.x === mini.anim.x0 && mini.anim.it.vx < 0);
        g.save();
        g.translate(Math.round(p.x) + (left ? 16 : -16), Math.round(p.y) - 8);
        if (left) g.scale(-1, 1);
        g.drawImage(s, 0, 0);
        g.restore();
      }
    }
  },
  // The float bobs on the water; while reeling, the line ends at the fish.
  lineEnd(now, t) {
    if (!mini.anim) return { x: MINI_TIP.x + 6, y: MINI_WATER + 8 + Math.round(Math.sin(t * 2.4)) };
    const k = (now - mini.anim.t0) / MINI_CATCH_MS();
    const p = this.carried(now);
    if (k < 0.25 || !p) {
      const u = Math.min(1, k / 0.25);
      return { x: Math.round(MINI_TIP.x + 6 + (mini.anim.x0 - MINI_TIP.x - 6) * u), y: Math.round(MINI_WATER + 8 + (mini.anim.y0 - MINI_WATER - 8) * u) };
    }
    return { x: Math.round(p.x + 8), y: Math.round(p.y - 4) };
  },
  // Where the fish being reeled in is: in the water, then flying up in an
  // arc into the bucket (null once it is in).
  carried(now) {
    const a = mini.anim;
    if (!a) return null;
    const k = (now - a.t0) / MINI_CATCH_MS();
    if (k < 0.25) return { x: a.x0, y: a.y0 };
    if (k >= 0.92) return null;
    const u = (k - 0.25) / 0.67;
    const x = a.x0 + (MINI_BUCKET.x - a.x0) * u;
    const y = a.y0 + (MINI_BUCKET.y - 6 - a.y0) * u - Math.sin(u * Math.PI) * 26;
    return { x, y, s: 1 - u * 0.35 };
  },
};

// Robot edition: a magnet crane on a gantry over the water; the magnet
// moves over the box she picked, picks it up and drops it in the truck.
const MINI_TRUCK = { x: 184, y: 40 };
const miniCrane = {
  back(g, t) {
    // The truck the boxes go into, and the robot at the controls.
    const tr = MINI_TRUCK;
    px(g, tr.x - 17, tr.y - 12, 34, 13, '#3a3550');
    px(g, tr.x - 16, tr.y - 11, 32, 11, '#4fa8ff');
    px(g, tr.x - 16, tr.y - 11, 32, 2, '#8fd0ff');
    for (let i = 0; i < mini.caught.length && i < 5; i++) px(g, tr.x - 13 + i * 6, tr.y - 15, 5, 4, '#d8a060');
    for (const x of [tr.x - 10, tr.x + 10]) { px(g, x - 3, tr.y, 6, 4, '#3a3550'); px(g, x - 1, tr.y + 1, 2, 2, '#9aa4b8'); }
    const sprite = villagerSprite(mini.npc.look, 0);
    g.drawImage(sprite.canvas, 22 - sprite.ax, MINI_WATER - 2 - sprite.ay);
  },
  front(g, t, now) {
    // Posts and the striped beam.
    for (const x of [2, 202]) { px(g, x, 2, 5, MINI_WATER - 2, '#3a3550'); px(g, x + 1, 3, 3, MINI_WATER - 3, '#ffd34d'); }
    px(g, 0, 1, MINI_W, 8, '#3a3550');
    px(g, 1, 2, MINI_W - 2, 6, '#ffd34d');
    for (let x = 2; x < MINI_W - 2; x += 8) for (let j = 0; j < 6; j++) px(g, x + j, 2 + j, 3, 1, '#3a3550');
    const m = this.magnet(now);
    // Trolley, cable and the horseshoe magnet.
    px(g, Math.round(m.x) - 6, 8, 12, 5, '#3a3550');
    px(g, Math.round(m.x) - 5, 8, 10, 4, '#5a6478');
    px(g, Math.round(m.x), 13, 1, Math.max(0, Math.round(m.y) - 13), '#9aa4b8');
    const x = Math.round(m.x);
    const y = Math.round(m.y);
    MINI_MAGNET.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') px(g, x - 6 + i, y + j, 1, 1, MINI_MAGNET_INK[ch]); }));
    if (Math.floor(now / 150) % 2 && mini.anim) { px(g, x - 4, y + 11, 1, 2, '#fff27a'); px(g, x + 4, y + 11, 1, 2, '#fff27a'); }
    const p = this.carried(now);
    if (p) g.drawImage(miniBoxSprite(), Math.round(p.x) - 13, Math.round(p.y) - 10);
  },
  // Where the magnet hangs: over the trolley, lowered to the box she picked.
  magnet(now) {
    const a = mini.anim;
    const rest = { x: mini.trolley, y: 22 };
    if (!a) return rest;
    const k = (now - a.t0) / MINI_CATCH_MS();
    const ease = u => u * u * (3 - 2 * u);
    const low = a.y0 - 19;
    if (k < 0.25) return { x: a.from + (a.x0 - a.from) * ease(k / 0.25), y: 22 };
    if (k < 0.45) return { x: a.x0, y: 22 + (low - 22) * ease((k - 0.25) / 0.2) };
    if (!a.clinked) { a.clinked = true; Sound.tune('clink'); }
    if (k < 0.65) return { x: a.x0, y: low + (22 - low) * ease((k - 0.45) / 0.2) };
    if (k < 0.9) { mini.trolley = a.x0 + (MINI_TRUCK.x - a.x0) * ease((k - 0.65) / 0.25); return { x: mini.trolley, y: 22 }; }
    mini.trolley = MINI_TRUCK.x;
    return { x: MINI_TRUCK.x, y: 22 };
  },
  // The box on the magnet, then dropping into the truck (null once it is in).
  carried(now) {
    const a = mini.anim;
    if (!a) return null;
    const k = (now - a.t0) / MINI_CATCH_MS();
    if (k < 0.45) return { x: a.x0, y: a.y0 };
    if (k < 0.9) { const m = this.magnet(now); return { x: m.x, y: m.y + 19 }; }
    if (k >= 1) return null;
    const u = (k - 0.9) / 0.1;
    return { x: MINI_TRUCK.x, y: 41 - 7 * u, s: 1 - u * 0.4 };
  },
};
// The magnet: red, with steel tips, 13 x 10.
const MINI_MAGNET = [
  'ooooooooooooo',
  'orRRRRRRRRRro',
  'orrrrrrrrrrro',
  'orrrrrrrrrrro',
  'orrrooooorrro',
  'orrro...orrro',
  'orrro...orrro',
  'owwwo...owwwo',
  'owWwo...owWwo',
  'ooooo...ooooo',
];
const MINI_MAGNET_INK = { o: '#3a3550', r: '#ff5a5a', R: '#ff9a9a', w: '#e8eef8', W: '#ffffff' };

function miniLine(g, x0, y0, x1, y1, col) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) px(g, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1, col);
}

// ---- In town ---------------------------------------------------------------

// A bobbing 🎣 (🧲) bubble over the pond by the fisherman.
function miniHintAt() {
  const sc = state.scene;
  return sc && sc === state.scenes.town && miniFisher() ? tileCenter(sc, 28.5, 30.5) : null;
}
function drawMiniHint(now) {
  const w = miniHintAt();
  if (!w) return;
  const s = state.scale;
  const ctx = sctx;
  const p = toScreen(w.x, w.y - 16 + Math.sin(now / 300) * 2);
  if (p.x < -60 || p.y < -60 || p.x > screen.width + 60 || p.y > screen.height + 60) return;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#3f88d8';
  ctx.lineWidth = s;
  roundRect(ctx, p.x - 9 * s, p.y - 7 * s, 18 * s, 14 * s, 5 * s);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p.x - 2.5 * s, p.y + 7 * s - 1);
  ctx.lineTo(p.x, p.y + 10.5 * s);
  ctx.lineTo(p.x + 2.5 * s, p.y + 7 * s - 1);
  ctx.fill();
  ctx.font = `${10 * s}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isCaptain() ? '🧲' : '🎣', p.x, p.y + 0.5 * s);
}
// A tap on that bubble. True when it took the tap.
function miniTap(wx, wy) {
  const w = miniHintAt();
  if (!w || Math.abs(wx - w.x) > 11 || wy < w.y - 25 || wy > w.y - 5) return false;
  return miniGo();
}

mini.canvas.addEventListener('pointerdown', miniTapAt);
mini.letter.addEventListener('click', miniReplay);
document.getElementById('mini-replay').addEventListener('click', miniReplay);
document.getElementById('mini-close').addEventListener('click', closeMini);
document.getElementById('mini-bye').addEventListener('click', closeMini);
document.getElementById('mini-again').addEventListener('click', () => { const npc = mini.npc; Sound.tap(); closeMini(); openMini(npc); });
mini.button.addEventListener('click', () => { const npc = state.talking; Sound.tap(); closeDialog(); openMini(npc); });
