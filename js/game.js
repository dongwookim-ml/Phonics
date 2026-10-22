// PixelTown main loop: town map, unicorn friend, tapping and word quests.

const WORLD_W = 400;
const WORLD_H = 250;
const OX = 184; // world x of tile (0, 0)'s bounding box
const OY = 48;  // world y of tile (0, 0)'s bounding box
const MAP_N = TOWN_MAP.length;

const screen = document.getElementById('game');
const sctx = screen.getContext('2d');
const world = document.createElement('canvas');
world.width = WORLD_W;
world.height = WORLD_H;
const wctx = world.getContext('2d');
const ground = document.createElement('canvas');
ground.width = WORLD_W;
ground.height = WORLD_H;

const ui = {
  start: document.getElementById('start'),
  startBtn: document.getElementById('start-btn'),
  stars: document.getElementById('stars'),
  explore: document.getElementById('mode-explore'),
  quest: document.getElementById('mode-quest'),
  mute: document.getElementById('mute'),
  card: document.getElementById('quest'),
  cardEmoji: document.getElementById('quest-emoji'),
  cardWord: document.getElementById('quest-word'),
  replay: document.getElementById('replay'),
  party: document.getElementById('party'),
};

// ---- Town setup ---------------------------------------------------------

const tiles = [];
const houses = [];
const trees = [];
for (let r = 0; r < MAP_N; r++) {
  tiles.push([]);
  for (let c = 0; c < MAP_N; c++) {
    const ch = TOWN_MAP[r][c];
    let type = 'grass';
    if (ch === '=') type = 'road';
    else if (ch === '~') type = 'water';
    tiles[r].push({ type, flowers: ch === ',', blocked: ch !== '=' && ch !== '.' && ch !== ',' });
    if (ch === 'T') trees.push({ c, r });
    const info = LETTERS.find(l => l.letter.toLowerCase() === ch);
    if (info) houses.push({ c, r, info, door: { c, r: r + 1 }, anim: null, wordIndex: 0 });
  }
}

function tileOrigin(c, r) {
  return { x: OX + (c - r) * 16, y: OY + (c + r) * 8 };
}
function tileCenter(c, r) {
  return { x: OX + 16 + (c - r) * 16, y: OY + 8 + (c + r) * 8 };
}
function worldToTile(wx, wy) {
  const u = (wx - OX - 16) / 16;
  const v = (wy - OY - 8) / 8;
  return { c: Math.round((u + v) / 2), r: Math.round((v - u) / 2) };
}
function walkable(c, r) {
  return c >= 0 && r >= 0 && c < MAP_N && r < MAP_N && !tiles[r][c].blocked;
}

function buildGround() {
  const g = ground.getContext('2d');
  for (let r = 0; r < MAP_N; r++) {
    for (let c = 0; c < MAP_N; c++) {
      const t = tiles[r][c];
      const o = tileOrigin(c, r);
      if (t.type === 'road') drawRoad(g, o.x, o.y, c, r);
      else if (t.type === 'grass') drawGrass(g, o.x, o.y, c, r, t.flowers);
      if (r === MAP_N - 1) drawEdge(g, o.x, o.y, 'left');
      if (c === MAP_N - 1) drawEdge(g, o.x, o.y, 'right');
    }
  }
}

// ---- State --------------------------------------------------------------

const state = {
  mode: 'explore',
  stars: loadStars(),
  quest: null,
  uni: { c: START_TILE.c, r: START_TILE.r, path: [], flip: false, frame: 0, hop: 0 },
  bubbles: [],
  particles: [],
  timers: [],
};

function loadStars() {
  try { return parseInt(localStorage.getItem('pixeltown-stars') || '0', 10) || 0; } catch (e) { return 0; }
}
function saveStars() {
  try { localStorage.setItem('pixeltown-stars', String(state.stars)); } catch (e) { /* private mode */ }
}

function later(ms, fn) {
  state.timers.push(setTimeout(fn, ms));
}
function clearTimers() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
}

// ---- Unicorn walking ----------------------------------------------------

function findPath(from, to) {
  const key = (c, r) => r * MAP_N + c;
  const prev = new Map([[key(from.c, from.r), null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur.c === to.c && cur.r === to.r) {
      const path = [];
      for (let k = key(cur.c, cur.r); k !== null; k = prev.get(k)) path.unshift({ c: k % MAP_N, r: Math.floor(k / MAP_N) });
      return path.slice(1);
    }
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { c: cur.c + dc, r: cur.r + dr };
      if (walkable(n.c, n.r) && !prev.has(key(n.c, n.r))) {
        prev.set(key(n.c, n.r), key(cur.c, cur.r));
        queue.push(n);
      }
    }
  }
  return [];
}

function walkTo(target) {
  const u = state.uni;
  const from = u.path.length ? u.path[0] : { c: Math.round(u.c), r: Math.round(u.r) };
  u.path = (u.path.length ? [u.path[0]] : []).concat(findPath(from, target));
}

function updateUnicorn(dt) {
  const u = state.uni;
  u.hop = Math.max(0, u.hop - dt);
  if (!u.path.length) { u.frame = 0; return; }
  const next = u.path[0];
  const dc = next.c - u.c;
  const dr = next.r - u.r;
  const dist = Math.hypot(dc, dr);
  const step = 4 * dt;
  if (Math.abs(dc - dr) > 0.01) u.flip = dc - dr < 0;
  if (dist <= step) {
    u.c = next.c;
    u.r = next.r;
    u.path.shift();
  } else {
    u.c += (dc / dist) * step;
    u.r += (dr / dist) * step;
  }
  u.frame = Math.floor(performance.now() / 140) % 2;
}

// ---- Effects ------------------------------------------------------------

function animateHouse(h, type) {
  h.anim = { type, t0: performance.now() };
}

function houseOffset(h, now) {
  if (!h.anim) return { lift: 0, dx: 0 };
  const t = (now - h.anim.t0) / 1000;
  if (h.anim.type === 'bounce') {
    if (t > 0.9) { h.anim = null; return { lift: 0, dx: 0 }; }
    return { lift: Math.round(Math.abs(Math.sin(t * Math.PI * 3.3)) * 6 * (1 - t / 0.9)), dx: 0 };
  }
  if (t > 0.45) { h.anim = null; return { lift: 0, dx: 0 }; }
  return { lift: 0, dx: Math.round(Math.sin(t * 45) * 2) };
}

function burst(wx, wy, count, spread = 1) {
  const colors = ['#ff6fa8', '#ffd84a', '#7fd3ff', '#9be07f', '#c86fe8', '#ffffff'];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = (30 + Math.random() * 70) * spread;
    state.particles.push({
      x: wx, y: wy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60 * spread,
      life: 1 + Math.random() * 0.6, color: colors[i % colors.length], star: Math.random() < 0.3,
    });
  }
}

function updateParticles(dt) {
  for (const p of state.particles) {
    p.vy += 140 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter(p => p.life > 0);
  state.bubbles = state.bubbles.filter(b => performance.now() < b.until);
}

function showBubble(h, text) {
  state.bubbles = state.bubbles.filter(b => b.house !== h);
  state.bubbles.push({ house: h, text, until: performance.now() + 2600 });
}

// ---- Phonics ------------------------------------------------------------

function rec(kind, name) {
  return `audio/${kind}/${name.toLowerCase()}.mp3`;
}

function letterSound(info) {
  return { text: `${info.sound}, ${info.sound}`, file: rec('letters', info.letter), rate: 0.7 };
}

function tapHouseExplore(h) {
  const [word, emoji] = h.info.words[h.wordIndex % h.info.words.length];
  h.wordIndex++;
  animateHouse(h, 'bounce');
  showBubble(h, `${emoji} ${word}`);
  Sound.tap();
  Sound.say([{ text: h.info.letter, rate: 0.8 }, letterSound(h.info), { text: `${word}!`, file: rec('words', word) }]);
}

function newQuest() {
  const last = state.quest && state.quest.info;
  const choices = LETTERS.filter(l => l !== last);
  const info = choices[Math.floor(Math.random() * choices.length)];
  const [word, emoji] = info.words[Math.floor(Math.random() * info.words.length)];
  state.quest = { info, word, emoji, tries: 0, solved: false };
  ui.cardEmoji.textContent = emoji;
  setCardWord(false);
  ui.card.classList.remove('solved', 'hint');
  askQuest();
}

function askQuest() {
  const q = state.quest;
  if (!q) return;
  Sound.say([{ text: 'Find the house for' }, { text: `${q.word}.`, file: rec('words', q.word) }]);
}

function setCardWord(revealed) {
  const q = state.quest;
  const first = q.word[0];
  ui.cardWord.innerHTML = '';
  const head = document.createElement('span');
  head.className = revealed ? 'first' : 'blank';
  head.textContent = revealed ? first : '?';
  ui.cardWord.append(head, document.createTextNode(q.word.slice(1)));
}

function tapHouseQuest(h) {
  const q = state.quest;
  if (!q || q.solved) return;
  if (h.info === q.info) {
    q.solved = true;
    state.stars++;
    saveStars();
    renderStars(true);
    setCardWord(true);
    ui.card.classList.add('solved');
    ui.card.classList.remove('hint');
    animateHouse(h, 'bounce');
    showBubble(h, `${q.emoji} ${q.word}`);
    const top = tileCenter(h.c, h.r);
    burst(top.x, top.y - 30, 26);
    Sound.correct();
    Sound.say([{ text: 'Yes!' }, { text: h.info.letter }, letterSound(h.info), { text: `${q.word}!`, file: rec('words', q.word) }]);
    const party = state.stars % STARS_PER_PARTY === 0;
    later(3200, () => {
      if (party) celebrate();
      later(party ? 3500 : 0, () => { if (state.mode === 'quest') newQuest(); });
    });
  } else {
    q.tries++;
    animateHouse(h, 'wiggle');
    Sound.wrong();
    const parts = [{ text: `This is ${h.info.letter},` }, letterSound(h.info)];
    if (q.tries >= 2) {
      ui.card.classList.add('hint');
      parts.push({ text: `${q.word} starts with` }, letterSound(q.info));
    } else {
      parts.push({ text: 'Try again!' });
    }
    Sound.say(parts);
  }
}

function celebrate() {
  Sound.party();
  Sound.say([{ text: `Hooray! ${STARS_PER_PARTY} more stars!`, pitch: 1.3 }]);
  ui.party.classList.add('show');
  for (let i = 0; i < 6; i++) later(i * 250, () => burst(60 + Math.random() * 280, 40 + Math.random() * 80, 30, 1.3));
  later(3000, () => ui.party.classList.remove('show'));
}

function renderStars(pop) {
  ui.stars.querySelector('.count').textContent = state.stars;
  const dots = ui.stars.querySelector('.dots');
  dots.innerHTML = '';
  const filled = state.stars % STARS_PER_PARTY;
  for (let i = 0; i < STARS_PER_PARTY; i++) {
    const d = document.createElement('span');
    d.className = i < filled ? 'on' : '';
    dots.append(d);
  }
  if (pop) {
    ui.stars.classList.remove('pop');
    void ui.stars.offsetWidth;
    ui.stars.classList.add('pop');
  }
}

function setMode(mode) {
  clearTimers();
  state.bubbles = [];
  state.mode = mode;
  ui.explore.classList.toggle('active', mode === 'explore');
  ui.quest.classList.toggle('active', mode === 'quest');
  ui.card.classList.toggle('hidden', mode !== 'quest');
  document.body.classList.toggle('questing', mode === 'quest');
  resize();
  if (mode === 'quest') newQuest();
  else {
    state.quest = null;
    Sound.say([{ text: 'Tap a house to hear its sound!' }]);
  }
}

// ---- Input --------------------------------------------------------------

let view = { scale: 1, x: 0, y: 0, dpr: 1 };

function houseBox(h) {
  const o = tileOrigin(h.c, h.r);
  return { x0: o.x, x1: o.x + 32, y0: o.y - 46, y1: o.y + 16 };
}

function onPointer(e) {
  Sound.unlock();
  const wx = (e.clientX * view.dpr - view.x) / view.scale;
  const wy = (e.clientY * view.dpr - view.y) / view.scale;

  // Houses nearer the viewer are drawn on top, so test them first.
  const sorted = houses.slice().sort((a, b) => (b.c + b.r) - (a.c + a.r));
  for (const h of sorted) {
    const b = houseBox(h);
    if (wx >= b.x0 && wx <= b.x1 && wy >= b.y0 && wy <= b.y1) {
      walkTo(h.door);
      if (state.mode === 'quest') tapHouseQuest(h);
      else tapHouseExplore(h);
      return;
    }
  }

  const u = state.uni;
  const uc = tileCenter(u.c, u.r);
  if (Math.abs(wx - uc.x) < 10 && wy > uc.y - 18 && wy < uc.y + 3) {
    u.hop = 0.5;
    Sound.tap();
    Sound.say([{ text: 'Hi! I love letters!', pitch: 1.4 }]);
    return;
  }

  const t = worldToTile(wx, wy);
  if (walkable(t.c, t.r)) {
    Sound.step();
    walkTo(t);
  }
}

// ---- Rendering ----------------------------------------------------------

function resize() {
  const dpr = window.devicePixelRatio || 1;
  screen.width = Math.round(innerWidth * dpr);
  screen.height = Math.round(innerHeight * dpr);
  const top = 70 * dpr;
  const bottom = (state.mode === 'quest' ? ui.card.offsetHeight + 24 : 12) * dpr;
  const availH = screen.height - top - bottom;
  const scale = Math.max(0.5, Math.min(screen.width / WORLD_W, availH / WORLD_H));
  view = {
    dpr,
    scale,
    x: Math.round((screen.width - WORLD_W * scale) / 2),
    y: Math.round(top + (availH - WORLD_H * scale) / 2),
  };
}

function renderWorld(now) {
  const t = now / 1000;
  wctx.clearRect(0, 0, WORLD_W, WORLD_H);
  wctx.drawImage(ground, 0, 0);
  for (let r = 0; r < MAP_N; r++) {
    for (let c = 0; c < MAP_N; c++) {
      if (tiles[r][c].type !== 'water') continue;
      const o = tileOrigin(c, r);
      drawWater(wctx, o.x, o.y, c, r, t);
    }
  }

  // Door mats glow softly under the house that answers the current quest
  // once the child has had a couple of tries.
  const q = state.quest;
  const hintHouse = q && !q.solved && q.tries >= 2 ? houses.find(h => h.info === q.info) : null;
  if (hintHouse) {
    const o = tileOrigin(hintHouse.door.c, hintHouse.door.r);
    if (Math.floor(t * 3) % 2) drawDiamond(wctx, o.x, o.y, 'rgba(255,240,120,0.55)');
  }

  const objects = [];
  for (const h of houses) objects.push({ depth: h.c + h.r, draw: () => {
    const off = houseOffset(h, now);
    h.apex = drawHouse(wctx, tileOrigin(h.c, h.r).x, tileOrigin(h.c, h.r).y, h.info, off.lift, off.dx, h === hintHouse);
  } });
  for (const tr of trees) objects.push({ depth: tr.c + tr.r, draw: () => {
    const o = tileOrigin(tr.c, tr.r);
    drawTree(wctx, o.x, o.y, 0);
  } });
  const u = state.uni;
  objects.push({ depth: u.c + u.r + 0.1, draw: () => {
    const p = tileCenter(u.c, u.r);
    const bob = !u.path.length && Math.sin(t * 3) > 0 ? -1 : 0;
    const hop = u.hop > 0 ? Math.round(Math.sin((0.5 - u.hop) / 0.5 * Math.PI) * 6) : 0;
    drawUnicorn(wctx, Math.round(p.x), Math.round(p.y + 2 + bob - hop), u.frame, u.flip);
  } });
  objects.sort((a, b) => a.depth - b.depth);
  objects.forEach(o => o.draw());
}

function toScreen(wx, wy) {
  return { x: view.x + wx * view.scale, y: view.y + wy * view.scale };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function renderOverlay(now) {
  const s = view.scale;
  const q = state.quest;
  // Letter badges above each roof.
  for (const h of houses) {
    if (!h.apex) continue;
    const p = toScreen(h.apex.x, h.apex.y - 8);
    const hint = q && !q.solved && q.tries >= 2 && h.info === q.info;
    const rad = 8.5 * s * (hint ? 1 + 0.12 * Math.sin(now / 120) : 1);
    sctx.fillStyle = 'rgba(0,0,0,0.18)';
    sctx.beginPath();
    sctx.arc(p.x, p.y + s, rad, 0, Math.PI * 2);
    sctx.fill();
    sctx.fillStyle = hint ? '#fff6a8' : '#ffffff';
    sctx.strokeStyle = h.info.roof;
    sctx.lineWidth = 1.6 * s;
    sctx.beginPath();
    sctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
    sctx.fill();
    sctx.stroke();
    sctx.fillStyle = shade(h.info.roof, -50);
    sctx.font = `800 ${Math.round(9 * s)}px "Baloo 2", "Trebuchet MS", sans-serif`;
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.fillText(h.info.letter + h.info.letter.toLowerCase(), p.x, p.y + 0.6 * s);
  }

  // Word bubbles.
  for (const b of state.bubbles) {
    const h = b.house;
    if (!h.apex) continue;
    const p = toScreen(h.apex.x, h.apex.y - 30);
    sctx.font = `700 ${Math.round(9 * s)}px "Baloo 2", "Trebuchet MS", sans-serif`;
    const w = sctx.measureText(b.text).width + 12 * s;
    const hgt = 16 * s;
    const fade = Math.min(1, (b.until - now) / 300);
    sctx.globalAlpha = fade;
    sctx.fillStyle = '#ffffff';
    sctx.strokeStyle = '#3a2f5b';
    sctx.lineWidth = 1 * s;
    roundRect(sctx, p.x - w / 2, p.y - hgt / 2, w, hgt, 5 * s);
    sctx.fill();
    sctx.stroke();
    sctx.beginPath();
    sctx.moveTo(p.x - 3 * s, p.y + hgt / 2 - 0.5);
    sctx.lineTo(p.x, p.y + hgt / 2 + 4 * s);
    sctx.lineTo(p.x + 3 * s, p.y + hgt / 2 - 0.5);
    sctx.fill();
    sctx.fillStyle = '#3a2f5b';
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.fillText(b.text, p.x, p.y + 0.5 * s);
    sctx.globalAlpha = 1;
  }

  // Confetti.
  for (const p of state.particles) {
    const sp = toScreen(p.x, p.y);
    sctx.globalAlpha = Math.min(1, p.life * 2);
    sctx.fillStyle = p.color;
    const size = (p.star ? 3 : 2) * s;
    sctx.fillRect(Math.round(sp.x), Math.round(sp.y), size, size);
  }
  sctx.globalAlpha = 1;
}

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  updateUnicorn(dt);
  updateParticles(dt);
  renderWorld(now);
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.clearRect(0, 0, screen.width, screen.height);
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(world, view.x, view.y, WORLD_W * view.scale, WORLD_H * view.scale);
  renderOverlay(now);
  requestAnimationFrame(frame);
}

// ---- Boot ---------------------------------------------------------------

buildGround();
renderStars(false);
resize();
addEventListener('resize', resize);
screen.addEventListener('pointerdown', onPointer);
ui.explore.addEventListener('click', () => { Sound.tap(); setMode('explore'); });
ui.quest.addEventListener('click', () => { Sound.tap(); setMode('quest'); });
ui.replay.addEventListener('click', () => { Sound.tap(); askQuest(); });
ui.mute.addEventListener('click', () => {
  const muted = Sound.toggleMute();
  ui.mute.textContent = muted ? '🔇' : '🔊';
});
ui.startBtn.addEventListener('click', () => {
  Sound.unlock();
  ui.start.classList.add('hidden');
  Sound.say([{ text: 'Welcome to Pixel Town! Tap a house to hear its sound!', pitch: 1.3 }]);
});
requestAnimationFrame(frame);
