// The Cloud Village (letter teams: oo, ou, oi, or, ir... QUIZ_TYPES.cloud)
// and the Word Camp (sight words, QUIZ_TYPES.sight), the same in both
// editions (no captain scene replaces them). Who stands where, the places'
// names and lines and CLOUD_STARS are in js/data.js; the questions are in
// js/quiz.js.

const CLOUD_N = 24;
const CAMP_N = 22;

// ---- The Cloud Village ---------------------------------------------------------

// A village up on the clouds: soft white ground, a rainbow over the middle
// of a round square, a moon and stars to tap, cloud puffs round the edge.
// The gate on the east edge goes back down to the Monster Village.
function buildCloudVillage() {
  const N = CLOUD_N;
  const sc = makeScene('cloud', N, N, 150, 60);
  sc.outdoor = true;
  const reserved = new Set();
  const key = (c, r) => r * N + c;
  const reserve = (c, r) => reserved.add(key(c, r));
  // The square in the middle and the path east to the gate.
  const mid = { c: 11.5, r: 11.5 };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if ((c - mid.c) ** 2 + (r - mid.r) ** 2 <= 20) setTile(sc, c, r, 'plaza');
  }
  for (let c = 15; c < N; c++) for (const r of [11, 12]) setTile(sc, c, r, 'plaza');

  // The rainbow along the back of the square.
  const ac = tileCenter(sc, 11.5, 8);
  block(sc, 9, 8, 6, 1);
  for (let c = 8; c <= 15; c++) for (let r = 6; r <= 9; r++) reserve(c, r);
  addObject(sc, { c: 9, r: 8, w: 6, d: 1 }, { x: ac.x - 74, y: ac.y - 84, w: 148, h: 100 }, ctx => drawRainbowArch(ctx, Math.round(ac.x), Math.round(ac.y), 64),
    { react: { word: 'rainbow', fx: 'sparkle' } });

  // Things to tap on single tiles.
  const prop = (c, r, up, draw, react, w = 36) => {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    addObject(sc, { c, r, w: 1, d: 1 }, { x: p.x - w / 2, y: p.y - up, w, h: up + 12 }, ctx => draw(ctx, Math.round(p.x), Math.round(p.y)), { react });
    return p;
  };
  const moon = prop(11, 4, 44, drawCloudMoon, { word: 'moon', fx: 'stars' }, 44);
  sc.lamps.push({ x: moon.x, y: moon.y - 26 });
  [[4, 5], [19, 4], [3, 18], [20, 17], [12, 20], [5, 11]].forEach(([c, r], i) => {
    const p = prop(c, r, 34, (ctx, x, y) => drawCloudStar(ctx, x, y, ['#ffe066', '#ff9cc8', '#8fd3ff'][i % 3]), { word: 'star', fx: 'stars' });
    sc.lamps.push({ x: p.x, y: p.y - 18, small: true });
  });
  [[7, 3], [16, 3], [2, 9], [21, 8], [8, 19], [17, 20], [2, 14], [21, 15]].forEach(([c, r]) => {
    prop(c, r, 22, (ctx, x, y) => drawCloudPuff(ctx, x, y - 6, 1.1), { word: 'cloud', fx: 'puff' }, 40);
  });
  // Nothing stands on a villager's tile or right in front of one.
  for (const n of CLOUD_NPCS) for (let dr = 0; dr <= 2; dr++) for (let dc = 0; dc <= 2; dc++) reserve(n.c + dc, n.r + dr);
  for (let r = 10; r <= 13; r++) for (let c = N - 4; c < N; c++) reserve(c, r);

  // The ground: cloud, with a few little stars in it.
  sc.paintGround = g => {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const t = tileAt(sc, c, r);
      if (t.type !== 'grass' && t.type !== 'flowers') continue;
      const o = tileOrigin(sc, c, r);
      drawCloudGround(g, o.x, o.y, c, r);
    }
  };

  // Cloud puffs round the edge, and a few inside.
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const t = tileAt(sc, c, r);
    if (t.blocked || reserved.has(key(c, r)) || t.type !== 'grass') continue;
    const edge = c < 2 || r < 2 || c > N - 3 || r > N - 3;
    if (hash(c, r, 193) >= (edge ? 0.5 : 0.03)) continue;
    if ((c - mid.c) ** 2 + (r - mid.r) ** 2 < 49) continue;
    if (sc.objects.some(o => o.puff && Math.abs(o.c0 - c) <= 1 && Math.abs(o.r0 - r) <= 1 && !edge)) continue;
    block(sc, c, r, 1, 1);
    const p = tileCenter(sc, c, r);
    const k = 1 + hash(c, r, 194) * 0.5;
    addObject(sc, { c, r, w: 1, d: 1 }, { x: p.x - 26, y: p.y - 30, w: 52, h: 44 }, ctx => drawCloudPuff(ctx, Math.round(p.x), Math.round(p.y - 6), k),
      { puff: true, react: { word: 'cloud', fx: 'puff' } });
  }

  for (const n of CLOUD_NPCS) sc.npcs.push(Object.assign(makeNpc(n, null), { level: 7, badge: '☁️' }));
  // The gate back to the Monster Village on the east edge.
  const back = [11, 12].map(r => ({ c: N - 1, r, target: 'monster', at: { c: 2, r }, icon: '👾', style: 'gate' }));
  sc.links = [...back];
  addSideGate(sc, N - 2, [10, 13], '#bfe4ff', [N - 2, N - 1], back);
  const tg = tileCenter(sc, N - 2, 11.5);
  sc.signs.push({ x: tg.x, y: tg.y - 64, text: place('monster'), color: '#8f5ad8', links: back });
  sc.start = { c: N - 3, r: 11 };
  renderGround(sc);
  return sc;
}

function drawCloudGround(ctx, ox, oy, c, r) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const n = hash(x, y, 181);
    if (n < 0.06) return '#ffffff';
    if (n < 0.12) return '#cfe3fb';
    if (n < 0.125) return hash(c, r, 182) < 0.5 ? '#ffe9a0' : '#ffd0ea';
    return '#e6f1ff';
  });
}

// A crescent moon resting on a little cloud. (cx, cy) is the ground centre.
function drawCloudMoon(ctx, cx, cy) {
  for (let y = -13; y <= 13; y++) for (let x = -13; x <= 13; x++) {
    const d = x * x + y * y;
    if (d > 169 || (x - 6) ** 2 + (y + 3) ** 2 <= 110) continue;
    px(ctx, cx + x, cy - 26 + y, 1, 1, d > 132 ? '#e8b93a' : x < -7 ? '#fff6c0' : '#ffe066');
  }
  drawCloudPuff(ctx, cx, cy - 4, 1.1);
}

// A star on a short pole of light.
function drawCloudStar(ctx, cx, cy, color) {
  px(ctx, cx, cy - 12, 1, 12, '#ffffff');
  drawStar(ctx, cx, cy - 20, 9, color, shade(color, -50));
  px(ctx, cx - 2, cy - 23, 2, 2, '#ffffff');
}

// ---- The gate in the Monster Village ------------------------------------------------

// At the west end of the Monster Village, in both editions: a path from
// its square to the edge and a gate up to the clouds (buildMonsterVillage
// lays the path and keeps it clear).
function addCloudGate(sc) {
  const links = [11, 12].map(r => ({ c: 0, r, target: 'cloud', at: { c: CLOUD_N - 3, r }, icon: '☁️', style: 'gate', needStars: CLOUD_STARS }));
  sc.links.push(...links);
  addSideGate(sc, 1, [10, 13], '#bfe4ff', [0, 1], links);
  const gp = tileCenter(sc, 1, 11.5);
  sc.signs.push({ x: gp.x, y: gp.y - 64, text: place('cloud'), color: '#4f9ad8', needStars: CLOUD_STARS, links });
}

// ---- The Word Camp --------------------------------------------------------------

// A campsite in the woods: three tents round a campfire, logs to sit on,
// a dirt path from the gate on the west edge (back to town), pines round
// the edge.
const CAMP_TENTS = [
  { c: 8, r: 4, color: '#ff8f5a' },
  { c: 15, r: 8, color: '#5aa6e0' },
  { c: 6, r: 16, color: '#8fcf5a' },
];
const CAMP_FIRE = { c: 11, r: 11 };

function buildWordCamp() {
  const N = CAMP_N;
  const sc = makeScene('sight', N, N, 150, 60);
  sc.outdoor = true;
  const reserved = new Set();
  const key = (c, r) => r * N + c;
  const reserve = (c, r) => reserved.add(key(c, r));
  // The clearing round the fire and the path west to the gate.
  const F = CAMP_FIRE;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if ((c - F.c) ** 2 + (r - F.r) ** 2 <= 13) setTile(sc, c, r, 'path');
  }
  for (let c = 0; c <= 8; c++) for (const r of [10, 11]) setTile(sc, c, r, 'path');
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (tileAt(sc, c, r).type === 'grass' && hash(c, r, 277) < 0.07) setTile(sc, c, r, 'flowers');
  }

  // The tents.
  for (const T of CAMP_TENTS) {
    block(sc, T.c, T.r, 2, 2);
    for (let r = T.r - 1; r <= T.r + 3; r++) for (let c = T.c - 1; c <= T.c + 3; c++) reserve(c, r);
    const k = boxCorners(sc, T.c, T.r, 2, 2);
    addObject(sc, { c: T.c, r: T.r, w: 2, d: 2 }, footBounds(sc, T.c, T.r, 2, 2, 50, 6), ctx => drawCampTent(ctx, k, T.color), { react: { word: 'tent', fx: 'boing' } });
  }
  // The campfire, and logs to sit on round it.
  block(sc, F.c, F.r, 1, 1);
  reserve(F.c, F.r);
  const fp = tileCenter(sc, F.c, F.r);
  addObject(sc, { c: F.c, r: F.r, w: 1, d: 1 }, { x: fp.x - 16, y: fp.y - 30, w: 32, h: 40 }, ctx => drawCampFire(ctx, Math.round(fp.x), Math.round(fp.y)),
    { react: { word: 'fire', fx: 'sparkle' } });
  sc.lamps.push({ x: fp.x, y: fp.y - 10 });
  for (const [c, r] of [[9, 12], [13, 10], [12, 13]]) {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    addObject(sc, { c, r, w: 1, d: 1 }, { x: p.x - 16, y: p.y - 12, w: 32, h: 22 }, ctx => drawCampLog(ctx, Math.round(p.x), Math.round(p.y)), { react: { word: 'log', fx: 'leaves' } });
  }
  // Lanterns by the gate.
  const torch = makeTorch();
  for (const [c, r] of [[4, 9], [4, 12]]) {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, canvas: torch.canvas, x: p.x - torch.ax, y: p.y - torch.ay, w: torch.canvas.width, h: torch.canvas.height });
    sc.lamps.push({ x: p.x, y: p.y - torch.ay + torch.glow.y });
  }
  // Nothing stands on a camper's tile or right in front of one.
  for (const n of SIGHT_NPCS) for (let dr = 0; dr <= 2; dr++) for (let dc = 0; dc <= 2; dc++) reserve(n.c + dc, n.r + dr);
  for (let r = 9; r <= 12; r++) for (let c = 0; c < 4; c++) reserve(c, r);

  // Pines and bushes round the edge, a few inside.
  const ring = [makePlant('pine'), makeTree('green'), makePlant('pine'), makePlant('oak')];
  const inner = [makePlant('bush'), makePlant('pine')];
  const nearPath = (c, r) => {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const t = tileAt(sc, c + dc, r + dr);
      if (t && t.type === 'path') return true;
    }
    return false;
  };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const t = tileAt(sc, c, r);
    if (t.blocked || reserved.has(key(c, r)) || (t.type !== 'grass' && t.type !== 'flowers') || nearPath(c, r)) continue;
    const edge = c < 2 || r < 2 || c > N - 3 || r > N - 3;
    if (hash(c, r, 293) >= (edge ? 0.6 : 0.05)) continue;
    if (!edge && sc.objects.some(o => o.tree && Math.abs(o.c0 - c) <= 1 && Math.abs(o.r0 - r) <= 1)) continue;
    const list = edge ? ring : inner;
    const tree = list[Math.floor(hash(c, r, 294) * list.length)];
    block(sc, c, r, 1, 1);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, tree: true, canvas: tree.canvas, x: p.x - tree.ax, y: p.y - tree.ay, w: tree.canvas.width, h: tree.canvas.height });
  }

  // Campers ask the camp's questions and give presents as the town's people do.
  for (const n of SIGHT_NPCS) sc.npcs.push(Object.assign(makeNpc(n, null), { place: 'sight', badge: '⛺' }));
  // The gate back to town on the west edge.
  const back = [10, 11].map(r => ({ c: 0, r, target: 'town', at: { c: 37, r: r + 4 }, icon: isCaptain() ? '🤖' : '🌸', style: 'gate' }));
  sc.links = [...back];
  addSideGate(sc, 1, [9, 12], '#ffd98a', [0, 1], back);
  const tg = tileCenter(sc, 1, 10.5);
  sc.signs.push({ x: tg.x, y: tg.y - 64, text: place('town'), color: isCaptain() ? '#3f8fd8' : '#ff8fc0', links: back });
  sc.start = { c: 3, r: 10 };
  renderGround(sc);
  return sc;
}

// A ridge tent on a 2 x 2 footprint (`k` its corners): the open front
// faces her, striped in its colour.
function drawCampTent(ctx, k, color) {
  const H = 40;
  const midOf = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const front = midOf(k.L, k.B);
  const rear = midOf(k.T, k.R);
  const A = { x: front.x, y: front.y - H };
  const Z = { x: rear.x, y: rear.y - H };
  // The far slope, the near slope and the front.
  fillPoly(ctx, [Z, A, k.B, k.R], (x, y) => (Math.floor((x + y) / 6) % 2 ? shade(color, 18) : shade(color, 4)));
  fillPoly(ctx, [k.L, A, k.B], (x, y) => (Math.floor((x - y) / 6) % 2 ? shade(color, -14) : shade(color, -30)));
  // The doorway and its flap.
  const D0 = { x: front.x - 7, y: front.y + 1 };
  const D1 = { x: front.x + 7, y: front.y + 5 };
  fillPoly(ctx, [D0, { x: front.x, y: front.y - H + 12 }, D1], '#4a3628');
  fillPoly(ctx, [D1, { x: front.x, y: front.y - H + 12 }, { x: front.x + 3, y: front.y + 3 }], shade(color, 30));
  // The ridge pole and a little flag.
  px(ctx, Math.round(A.x), Math.round(A.y) - 9, 1, 10, '#8a5a3a');
  for (let i = 0; i < 6; i++) px(ctx, Math.round(A.x) + 1, Math.round(A.y) - 9 + Math.floor(i / 2), 6 - i, 1, '#fff27a');
}

// Crossed logs and a flame.
function drawCampFire(ctx, cx, cy) {
  ctx.fillStyle = 'rgba(60,40,20,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [x, w] of [[-10, 20], [-7, 14]]) px(ctx, cx + x, cy + (w === 20 ? 0 : 3), w, 3, w === 20 ? '#8a5a3a' : '#6b4a2e');
  px(ctx, cx - 10, cy, 2, 3, '#c9a070');
  px(ctx, cx + 8, cy, 2, 3, '#c9a070');
  const flame = [[0, 9, '#ff8a3c'], [1, 7, '#ff8a3c'], [2, 6, '#ffb347'], [3, 5, '#ffb347'], [5, 4, '#ffd34d'], [7, 3, '#ffd34d'], [9, 2, '#fff27a'], [12, 1, '#fff27a'], [15, 1, '#ffffff']];
  for (const [up, half, col] of flame) px(ctx, cx - half, cy - 2 - Math.round(up * 1.3), half * 2, 3, col);
  px(ctx, cx - 2, cy - 5, 4, 4, '#fff27a');
}

// A log lying on its side.
function drawCampLog(ctx, cx, cy) {
  px(ctx, cx - 11, cy - 5, 22, 8, '#8a5a3a');
  px(ctx, cx - 11, cy - 5, 22, 2, '#a8703f');
  px(ctx, cx - 11, cy + 1, 22, 2, '#6b4a2e');
  px(ctx, cx + 8, cy - 5, 3, 8, '#e8c89a');
  px(ctx, cx + 9, cy - 3, 1, 4, '#a8703f');
}

// ---- The gate in town --------------------------------------------------------------

// At the east end of the town's upper road, in both editions, open from
// the start: the road runs on through the ring of trees, which make way.
// `sideGate` is the edition's own (addSideGate, rtAddSideGate).
function addTownCampGate(sc, sideGate) {
  const E = sc.W - 1;
  for (const [c, r] of [[E, 14], [E, 15], [E - 1, 14], [E - 1, 15], [E - 2, 15]]) setTile(sc, c, r, 'road');
  const gone = o => o.tree && o.c0 >= E - 1 && o.r0 >= 12 && o.r0 <= 17;
  for (const o of sc.objects.filter(gone)) tileAt(sc, o.c0, o.r0).blocked = false;
  sc.objects = sc.objects.filter(o => !gone(o));
  for (let r = 14; r <= 15; r++) for (let c = E - 2; c <= E; c++) tileAt(sc, c, r).blocked = false;
  const links = [14, 15].map(r => ({ c: E, r, target: 'sight', at: { c: 2, r: r - 4 }, icon: '⛺', style: 'gate' }));
  sc.links.push(...links);
  sideGate(sc, E - 1, [13, 16], '#ffd98a', [E - 1, E], links);
  // The sign hangs toward the far post, clear of the G house's sign.
  const gp = tileCenter(sc, E + 0.5, 13.5);
  sc.signs.push({ x: gp.x, y: gp.y - 64, text: place('sight'), color: '#c8862a', links });
}
