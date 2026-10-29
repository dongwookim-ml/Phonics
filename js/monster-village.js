// The Monster Village and the Monster Tower in its middle, two floors high,
// the same in both editions (no captain scene replaces them). Where everyone
// stands, the places' names and lines and MONSTER_STARS are in js/data.js;
// everyone there is one of the monsters she drew herself, with their names,
// pictures, voices and hellos in js/kid-monsters.js.

const MONSTER_N = 26;
// The tower's footprint (4 x 4 tiles) and the two tiles in front of its door.
const MONSTER_TOWER = { c: 11, r: 9, w: 4 };
const MONSTER_TOWER_DOOR = [[12, 13], [13, 13]];

// ---- The village ----------------------------------------------------------------

// Lavender grass, a stone square round the tower and a path to the gate on
// the east edge (back to town), glowing mushrooms, crystals and lanterns,
// purple trees round the edge.
function buildMonsterVillage() {
  const sc = makeScene('monster', MONSTER_N, MONSTER_N, 160, 60);
  sc.outdoor = true;
  const N = MONSTER_N;
  const T = MONSTER_TOWER;
  const reserved = new Set();
  const key = (c, r) => r * N + c;
  const reserve = (c, r) => reserved.add(key(c, r));
  // The square round the tower, and the path east to the gate.
  const mid = { c: T.c + 1.5, r: T.r + 1.5 };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if ((c - mid.c) ** 2 + (r - mid.r) ** 2 <= 22) setTile(sc, c, r, 'plaza');
  }
  for (let c = 15; c < N; c++) for (const r of [11, 12]) setTile(sc, c, r, 'plaza');
  // A little pond in the south-west corner.
  for (let r = 17; r <= 23; r++) for (let c = 2; c <= 9; c++) {
    if (((c - 5.5) / 3.4) ** 2 + ((r - 20) / 2.6) ** 2 <= 1) setTile(sc, c, r, 'water');
  }

  // The tower: its door faces the square (the row in front of it).
  block(sc, T.c, T.r, T.w, T.w);
  for (let r = T.r - 1; r <= T.r + T.w; r++) for (let c = T.c - 1; c <= T.c + T.w; c++) reserve(c, r);
  const k = boxCorners(sc, T.c, T.r, T.w, T.w);
  const tower = addObject(sc, { c: T.c, r: T.r, w: T.w, d: T.w }, footBounds(sc, T.c, T.r, T.w, T.w, MONSTER_TOWER_H + 130, 10),
    ctx => drawMonsterTower(ctx, k), { kind: 'tower' });
  for (const [c, r] of MONSTER_TOWER_DOOR) sc.doors.push({ c, r, obj: tower, target: 'tower' });
  // Its name on the battlements, over the front corner.
  const top = wallPt(wall(k.L, k.B), 64, MONSTER_TOWER_H + 22);
  sc.signs.push({ x: top.x, y: top.y, text: place('tower'), color: '#8f5ad8' });
  for (const x of [17, 47]) {
    const p = wallPt(wall(k.L, k.B), x, 66);
    sc.lamps.push({ x: p.x, y: p.y, small: true });
  }

  // Props on single tiles.
  const prop = (c, r, up, draw, react, w = 32) => {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    addObject(sc, { c, r, w: 1, d: 1 }, { x: p.x - w / 2, y: p.y - up, w, h: up + 8 }, ctx => draw(ctx, Math.round(p.x), Math.round(p.y)), { react });
    return p;
  };
  const shroom = { word: 'mushroom', fx: 'boing' };
  [[4, 4, '#ff9cf0'], [21, 4, '#7fe8ff'], [16, 20, '#fff6a8'], [22, 17, '#c8a0ff'], [9, 15, '#7fe8ff'], [3, 12, '#c8a0ff']].forEach(([c, r, col]) => {
    const p = prop(c, r, 26, (ctx, x, y) => drawBigShroom(ctx, x, y, col), shroom);
    sc.lamps.push({ x: p.x, y: p.y - 18 });
  });
  [[8, 3, '#ff8fb8'], [15, 3, '#b9a0ff'], [23, 8, '#8fd3ff'], [12, 22, '#ffb347']].forEach(([c, r, col]) => {
    prop(c, r, 46, (ctx, x, y) => drawTallShroom(ctx, x, y, col), shroom, 34);
  });
  [[10, 6, '#7fe8ff'], [17, 15, '#ff9cf0'], [6, 14, '#c8a0ff'], [20, 21, '#7fe8ff'], [1, 7, '#ff9cf0']].forEach(([c, r, col]) => {
    const p = prop(c, r, 30, (ctx, x, y) => drawCrystal(ctx, x, y, col), { word: 'crystal', fx: 'sparkle' });
    sc.lamps.push({ x: p.x, y: p.y - 12 });
  });
  // Lanterns along the path to the gate.
  const torch = makeTorch();
  for (const [c, r] of [[17, 10], [21, 10], [17, 13], [21, 13]]) {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, canvas: torch.canvas, x: p.x - torch.ax, y: p.y - torch.ay, w: torch.canvas.width, h: torch.canvas.height });
    sc.lamps.push({ x: p.x, y: p.y - torch.ay + torch.glow.y });
  }
  for (const n of MONSTER_NPCS) reserve(n.c, n.r);
  for (let r = 10; r <= 13; r++) for (let c = N - 4; c < N; c++) reserve(c, r);

  // The lawn: lavender grass with glowing dots, and the tower's shadow.
  sc.paintGround = g => {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const t = tileAt(sc, c, r);
      if (t.type !== 'grass' && t.type !== 'flowers') continue;
      const o = tileOrigin(sc, c, r);
      drawMonsterGrass(g, o.x, o.y, c, r);
      if (t.blocked || hash(c, r, 75) > 0.08) continue;
      const p = tileCenter(sc, c, r);
      drawGlowShroom(g, Math.round(p.x - 5), Math.round(p.y + 2), ['#7fe8ff', '#ff9cf0', '#fff6a8'][Math.floor(hash(c, r, 76) * 3)]);
      sc.lamps.push({ x: p.x - 5, y: p.y, small: true });
    }
  };

  // Purple trees round the edge, a few inside.
  const ring = [makeTree('violet'), makeTree('lilac'), makePlant('mintPine'), makeTree('starPine'), makeTree('violet')];
  const inner = [makeTree('lilac'), makePlant('bush'), makeTree('violet')];
  const nearPath = (c, r) => {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const t = tileAt(sc, c + dc, r + dr);
      if (t && (t.type === 'plaza' || t.type === 'water')) return true;
    }
    return false;
  };
  // Nothing tall right in front of the tower, so its face shows.
  const front = (c, r) => (c - mid.c) ** 2 + (r - mid.r) ** 2 < 64 || (c > mid.c - 4 && c < mid.c + 6 && r > mid.r);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const t = tileAt(sc, c, r);
    if (t.blocked || reserved.has(key(c, r)) || t.type !== 'grass' || nearPath(c, r)) continue;
    const edge = c < 2 || r < 2 || c > N - 3 || r > N - 3;
    if (!edge && front(c, r)) continue;
    if (hash(c, r, 93) >= (edge ? 0.55 : 0.06)) continue;
    if (!edge && sc.objects.some(o => o.tree && Math.abs(o.c0 - c) <= 1 && Math.abs(o.r0 - r) <= 1)) continue;
    const list = edge ? ring : inner;
    const tree = list[Math.floor(hash(c, r, 94) * list.length)];
    block(sc, c, r, 1, 1);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, tree: true, canvas: tree.canvas, x: p.x - tree.ax, y: p.y - tree.ay, w: tree.canvas.width, h: tree.canvas.height });
  }

  for (const n of MONSTER_NPCS) sc.npcs.push(kidVillager(n));
  // Gate back to town on the east edge.
  // She comes out in town just past the gate's mat (a tap there goes back).
  sc.links = [11, 12].map(r => ({ c: N - 1, r, target: 'town', at: { c: 2, r: r + 3 }, icon: isCaptain() ? '🤖' : '🌸', style: 'gate' }));
  addSideGate(sc, N - 2, [10, 13], '#c8b8ff', [N - 2, N - 1], sc.links);
  const tg = tileCenter(sc, N - 2, 11.5);
  sc.signs.push({ x: tg.x, y: tg.y - 64, text: place('town'), color: isCaptain() ? '#3f8fd8' : '#ff8fc0', links: sc.links });
  sc.start = { c: N - 3, r: 11 };
  renderGround(sc);
  return sc;
}

function drawMonsterGrass(ctx, ox, oy, c, r) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const n = hash(x, y, 81);
    if (n < 0.05) return '#c8bcf4';
    if (n < 0.1) return '#8a7cc8';
    if (n < 0.12) return hash(c, r, 82) < 0.5 ? '#bfefff' : '#ffd0f0';
    return '#a596e0';
  });
}

// ---- The tower -----------------------------------------------------------------------

const MONSTER_TOWER_H = 100;

// A stone tower with a monster's face: two big round windows for eyes
// under grumpy brows, rosy cheeks, and the doorway for its mouth, with
// teeth along the top and a pink tongue for a doormat. Horns on its
// pointed roof, a flag on top, little eyes peeping out of the windows on
// its other side. `k` is its footprint's corners.
function drawMonsterTower(ctx, k) {
  const H = MONSTER_TOWER_H;
  const WL = wall(k.L, k.B);
  const WR = wall(k.B, k.R);
  // Stone walls: rows of blocks, each block a little different.
  for (const [W, base, salt] of [[WL, '#8a78c8', 1], [WR, '#a493dc', 2]]) {
    wallRect(ctx, W, 0, W.len, 0, H, base);
    for (let v = 0; v < H; v += 9) {
      wallRect(ctx, W, 0, W.len, v, v + 1, shade(base, -26));
      const off = (v / 9) % 2 ? 0 : 7;
      for (let x = off; x < W.len; x += 14) {
        wallRect(ctx, W, x, x + 1, v, v + 9, shade(base, -22));
        if (hash(x, v, salt) < 0.35) wallRect(ctx, W, x + 2, x + 12, v + 2, v + 8, shade(base, hash(x, v, salt + 5) < 0.5 ? 8 : -8));
      }
    }
    wallRect(ctx, W, 0, W.len, 0, 6, shade(base, -40));
  }
  // The battlements along the top.
  for (const [W, base] of [[WL, '#7a68b8'], [WR, '#9483d0']]) {
    wallRect(ctx, W, 0, W.len, H, H + 4, base);
    for (let x = 0; x < W.len; x += 12) wallRect(ctx, W, x, x + 7, H + 4, H + 12, base);
  }
  const disc = (W, x, v, R, col) => {
    for (let dv = -R; dv <= R; dv++) for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dv * dv <= R * R) wallRect(ctx, W, x + dx, x + dx + 1, v + dv, v + dv + 1, col);
    }
  };
  // Eyes: white round windows with dark rims, pupils looking down at her.
  for (const x of [17, 47]) {
    disc(WL, x, 66, 11, '#3a2c60');
    disc(WL, x, 66, 9, '#fffaf0');
    disc(WL, x + 1, 62, 5, '#2a2050');
    wallRect(ctx, WL, x - 1, x + 2, 64, 67, '#ffffff');
  }
  // Grumpy brows, slanting down to the middle.
  for (let i = 0; i < 18; i++) {
    const dv = Math.round(i / 4);
    wallRect(ctx, WL, 7 + i, 8 + i, 82 - dv, 86 - dv, '#3a2c60');
    wallRect(ctx, WL, 57 - i, 58 - i, 82 - dv, 86 - dv, '#3a2c60');
  }
  // Rosy cheeks.
  disc(WL, 6, 49, 4, '#ffa8d0');
  disc(WL, 58, 49, 4, '#ffa8d0');
  // The mouth: a wide dark doorway with teeth hanging from the top.
  wallArch(ctx, WL, 14, 50, 0, 42, '#2a1f48');
  wallArch(ctx, WL, 16, 48, 0, 40, '#3e2c66');
  for (const x of [19, 27, 35, 43]) {
    for (let i = 0; i < 4; i++) wallRect(ctx, WL, x - 3 + i, x + 3 - i, 30 - i * 2, 32 - i * 2, '#ffffff');
  }
  // Its pink tongue for a doormat.
  for (let v = 0; v < 6; v++) wallRect(ctx, WL, 22 + v, 42 - v, v, v + 1, '#ff7aa8');
  wallRect(ctx, WL, 31, 33, 1, 5, '#e05a8a');
  // Windows on the other side, with eyes peeping out.
  for (const [x, v] of [[18, 30], [44, 56], [20, 76]]) {
    wallArch(ctx, WR, x - 7, x + 7, v, v + 18, '#3a2c60');
    wallArch(ctx, WR, x - 6, x + 6, v + 1, v + 17, '#ffe8a0');
    wallRect(ctx, WR, x - 4, x - 2, v + 7, v + 10, '#2a2050');
    wallRect(ctx, WR, x + 2, x + 4, v + 7, v + 10, '#2a2050');
  }
  // The pointed roof: two faces up to a peak over the middle.
  const up = p => ({ x: p.x, y: p.y - H - 12 });
  const L = up(k.L);
  const B = up(k.B);
  const R = up(k.R);
  const peak = { x: (k.L.x + k.R.x) / 2, y: (k.L.y + k.R.y) / 2 - H - 84 };
  fillPoly(ctx, [L, B, peak], (x, y) => (Math.floor((y - peak.y) / 7) % 3 === 0 ? '#5a3c9a' : '#6a48b0'));
  fillPoly(ctx, [B, R, peak], (x, y) => (Math.floor((y - peak.y) / 7) % 3 === 0 ? '#7454c0' : '#8462d0'));
  // Horns either side of the roof.
  for (const [a, dir] of [[L, -1], [R, 1]]) {
    const hx = (a.x + peak.x) / 2;
    const base = (a.y + peak.y) / 2 + 4;
    for (let i = 0; i < 18; i++) {
      const w = Math.round(5 * (1 - i / 18)) + 1;
      px(ctx, Math.round(hx + dir * (i * 0.7) - w / 2), Math.round(base - i), w, 1, i > 13 ? '#ffffff' : '#fff1c8');
    }
  }
  // A flag on the peak.
  px(ctx, Math.round(peak.x), Math.round(peak.y) - 22, 1, 22, '#5a4a70');
  for (let i = 0; i < 10; i++) px(ctx, Math.round(peak.x) + 1, Math.round(peak.y) - 22 + Math.floor(i / 2), 10 - i, 1, i % 4 < 2 ? '#7fe8a0' : '#5fd088');
}

// ---- Inside the tower --------------------------------------------------------------

// One of her monsters as a villager here: level 6 (the Monster Village's
// questions), with its own name and a 🖍️ over it.
function kidVillager(n) {
  const art = typeof KID_MONSTERS !== 'undefined' && KID_MONSTERS[n.look];
  const npc = makeNpc(Object.assign({ name: art ? art.name : I18n.t('monster-village.monsterFriend') }, n), null);
  return Object.assign(npc, { level: 6, badge: '🖍️' });
}

// The tower's stairs: purple stone with a pink runner and pale gold rails.
const STAIRS_TOWER = {
  side: '#a493dc', top: '#c8bcf4', front: '#8a78c8', edge: '#6a58a8', runner: '#ff9cc8', riser: '#e07aa8',
  gold: '#ffe08a', post: '#e8c060', arch: ['#2a2050', '#3e2c66'], hole: '#2a1f48', holeSide: '#7a68b8', step: '#5f4fa0',
};

// A round room of purple stone with a soft rug, torches, star windows and
// the monsters she drew, each with its picture in the dialog
// (js/kid-monsters.js). Out through the mat at the front, to the door; up
// the stairs in the back corner to the second floor.
function buildMonsterTower() {
  const sc = makeScene('tower', 12, 10, 130, 50);
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) setTile(sc, c, r, 'cave');
  for (let r = 3; r <= 7; r++) for (let c = 3; c <= 8; c++) {
    if (((c - 5.5) / 3) ** 2 + ((r - 5) / 2.4) ** 2 > 1) continue;
    Object.assign(tileAt(sc, c, r), { type: 'carpet', color: '#c8a8f0', edge: ((c - 5.5) / 3) ** 2 + ((r - 5) / 2.4) ** 2 > 0.55 });
  }
  addRoomWalls(sc, 84, '#7e6cc4', '#4f4288', (ctx, WA, WB) => {
    // Windows onto the night: a moon in one, stars in the others.
    for (const [W, u, moon] of [[WA, 0.3, true], [WA, 0.72, false], [WB, 0.22, false], [WB, 0.62, true]]) {
      const x = W.len * u;
      wallArch(ctx, W, x - 12, x + 12, 30, 64, '#3a2c60');
      wallArch(ctx, W, x - 10, x + 10, 32, 62, '#2a3a7a');
      if (moon) for (let dv = -4; dv <= 4; dv++) for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dv * dv <= 16 && (dx - 2) ** 2 + (dv + 1) ** 2 > 9) wallRect(ctx, W, x + dx, x + dx + 1, 48 + dv, 49 + dv, '#fff4b0');
      }
      for (const [sx, sv] of [[-6, 40], [5, 56], [-2, 58], [6, 38]]) wallRect(ctx, W, x + sx, x + sx + 1, sv, sv + 1, '#ffffff');
    }
    // Paper bunting with crayon colours.
    for (const W of [WA, WB]) for (let x = 6; x < W.len - 6; x += 12) {
      const col = ['#ff9cc8', '#8fd3ff', '#fff27a', '#9fe8a0', '#c8a0ff'][Math.floor(x / 12) % 5];
      for (let i = 0; i < 6; i++) wallRect(ctx, W, x + i, x + 10 - i, 74 - i, 75 - i, col);
    }
  });
  const torch = makeTorch();
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  for (const [W, u] of [[wall(k.L, k.T), 0.5], [wall(k.T, k.R), 0.42]]) {
    const p = wallPt(W, W.len * u, 22);
    sc.objects.push({ c0: -10, r0: -10, c1: -10, r1: -10, background: true, canvas: torch.canvas, x: Math.round(p.x - torch.ax), y: Math.round(p.y - torch.ay), w: torch.canvas.width, h: torch.canvas.height });
    sc.lamps.push({ x: p.x, y: p.y - torch.ay + torch.glow.y });
  }
  // A few things to tap: crystals and glowing mushrooms by the walls.
  const prop = (c, r, up, draw, react) => {
    block(sc, c, r, 1, 1);
    const p = tileCenter(sc, c, r);
    addObject(sc, { c, r, w: 1, d: 1 }, { x: p.x - 16, y: p.y - up, w: 32, h: up + 8 }, ctx => draw(ctx, Math.round(p.x), Math.round(p.y)), { react });
    return p;
  };
  for (const [c, r, col] of [[0, 0, '#7fe8ff'], [11, 7, '#ff9cf0'], [0, 9, '#c8a0ff']]) {
    const p = prop(c, r, 30, (ctx, x, y) => drawCrystal(ctx, x, y, col), { word: 'crystal', fx: 'sparkle' });
    sc.lamps.push({ x: p.x, y: p.y - 12 });
  }
  for (const [c, r, col] of [[11, 8, '#fff6a8'], [5, 0, '#c8a0ff']]) {
    const p = prop(c, r, 26, (ctx, x, y) => drawBigShroom(ctx, x, y, col), { word: 'mushroom', fx: 'boing' });
    sc.lamps.push({ x: p.x, y: p.y - 18 });
  }

  // Stairs up in the back-right corner, to the second floor.
  addStairs(sc, 10, 0, 2, 3, ctx => drawCastleStairs(ctx, sc, 10, 0, 2, 3, 6, STAIRS_TOWER),
    [10, 11].map(c => ({ c, r: 3, target: 'tower2', at: { c: 9, r: 4 }, icon: '⬆️' })));
  const up = tileCenter(sc, 10.5, 1);
  sc.signs.push({ x: up.x, y: up.y - 74, text: I18n.t('captain-town.upstairs'), color: '#8f5ad8', links: sc.links.filter(l => l.target === 'tower2') });

  for (const n of TOWER_NPCS) sc.npcs.push(kidVillager(n));
  const exit = { c: 5, r: sc.D - 1 };
  tileAt(sc, 5, sc.D - 1).rug = '#8f5ad8';
  tileAt(sc, 6, sc.D - 1).rug = '#8f5ad8';
  sc.exit = exit;
  sc.exitTiles = [{ c: 5, r: sc.D - 1 }, { c: 6, r: sc.D - 1 }];
  sc.returnTo = { scene: 'monster', at: { c: MONSTER_TOWER_DOOR[0][0], r: MONSTER_TOWER_DOOR[0][1] } };
  sc.start = { c: 5, r: sc.D - 2 };
  renderGround(sc);
  return sc;
}

// The second floor: a playroom under the roof, with her pictures pinned up
// on the walls, round windows onto the night sky, a crayon table and a toy
// chest, and a few more of her monsters. Down the stairs in the front
// corner, back to the ground floor.
function buildMonsterTower2() {
  const sc = makeScene('tower', 12, 10, 130, 50);
  sc.floorTint = '#d8c8f4';
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) setTile(sc, c, r, 'wood');
  for (let r = 1; r <= 8; r++) for (let c = 1; c <= 8; c++) {
    const v = ((c - 4.5) / 3.6) ** 2 + ((r - 4.5) / 3.6) ** 2;
    if (v > 1) continue;
    Object.assign(tileAt(sc, c, r), { type: 'carpet', color: v > 0.6 ? '#ffb8dc' : '#ffd6ec', edge: v > 0.6 });
  }
  addRoomWalls(sc, 84, '#9c8ad8', '#5a4a98', (ctx, WA, WB) => {
    // Round windows onto the night sky, a moon in one.
    for (const [W, u, moon] of [[WA, 0.5, false], [WB, 0.3, true]]) {
      const x = W.len * u;
      for (let dv = -15; dv <= 15; dv++) for (let dx = -15; dx <= 15; dx++) {
        const d = dx * dx + dv * dv;
        if (d <= 225) wallRect(ctx, W, x + dx, x + dx + 1, 54 + dv, 55 + dv, d > 156 ? '#3a2c60' : d > 132 ? '#ffe08a' : '#2a3a7a');
      }
      if (moon) for (let dv = -4; dv <= 4; dv++) for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dv * dv <= 16 && (dx - 2) ** 2 + (dv + 1) ** 2 > 9) wallRect(ctx, W, x + dx + 3, x + dx + 4, 56 + dv, 57 + dv, '#fff4b0');
      }
      for (const [sx, sv] of [[-7, 60], [6, 48], [-3, 46], [8, 62], [-9, 52]]) wallRect(ctx, W, x + sx, x + sx + 1, sv, sv + 1, '#ffffff');
    }
    // Her pictures pinned up: monsters in crayon on white paper.
    const cols = ['#ff7aa8', '#5cb84a', '#6e9cf0', '#ff8a3c', '#a46ae0', '#e0a020'];
    const pics = [[WA, 0.18], [WA, 0.8], [WB, 0.58], [WB, 0.78]];
    pics.forEach(([W, u], i) => {
      const x = Math.round(W.len * u);
      const col = cols[i % cols.length];
      wallRect(ctx, W, x - 9, x + 9, 34, 60, '#e8e0f8');
      wallRect(ctx, W, x - 8, x + 8, 35, 59, '#ffffff');
      wallRect(ctx, W, x - 1, x + 1, 57, 61, '#ff5a7a'); // the pin
      // A round body, eyes, horns or ears and legs, a little different each time.
      for (let dv = -5; dv <= 5; dv++) for (let dx = -5; dx <= 5; dx++) {
        const d = dx * dx + dv * dv;
        if (d <= 25 && d > 15) wallRect(ctx, W, x + dx, x + dx + 1, 46 + dv, 47 + dv, col);
      }
      const eyes = i % 2 ? [0] : [-2, 2];
      for (const e of eyes) wallRect(ctx, W, x + e, x + e + 1, 47, 49, '#2c2c3a');
      wallRect(ctx, W, x - 3, x - 2, 52, 54, col);
      wallRect(ctx, W, x + 2, x + 3, 52, 54, col);
      for (let j = 0; j < 3; j++) {
        wallRect(ctx, W, x - 4 + j, x - 3 + j, 39 - j, 40 - j, col);
        wallRect(ctx, W, x + 3 - j, x + 4 - j, 39 - j, 40 - j, col);
      }
      wallRect(ctx, W, x - 3, x - 2, 39, 41, col);
      wallRect(ctx, W, x + 2, x + 3, 39, 41, col);
    });
    // Paper bunting with crayon colours, higher up under the roof.
    for (const W of [WA, WB]) for (let x = 6; x < W.len - 6; x += 12) {
      const col = cols[Math.floor(x / 12) % cols.length];
      for (let i = 0; i < 6; i++) wallRect(ctx, W, x + i, x + 10 - i, 78 - i, 79 - i, col);
    }
  });
  const torch = makeTorch();
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  for (const [W, u] of [[wall(k.L, k.T), 0.3], [wall(k.T, k.R), 0.1], [wall(k.T, k.R), 0.92]]) {
    const p = wallPt(W, W.len * u, 22);
    sc.objects.push({ c0: -10, r0: -10, c1: -10, r1: -10, background: true, canvas: torch.canvas, x: Math.round(p.x - torch.ax), y: Math.round(p.y - torch.ay), w: torch.canvas.width, h: torch.canvas.height });
    sc.lamps.push({ x: p.x, y: p.y - torch.ay + torch.glow.y });
  }
  const furn = (c, r, up, draw, react) => {
    block(sc, c, r, 1, 1);
    const p = tileCenter(sc, c, r);
    addObject(sc, { c, r, w: 1, d: 1 }, footBounds(sc, c, r, 1, 1, up, 8), draw, { react });
    return p;
  };
  furn(10, 2, 24, ctx => drawTable(ctx, sc, 10, 2), FURNITURE.table);
  furn(11, 0, 34, ctx => drawTreasureChest(ctx, sc, 11, 0), FURNITURE.chest);
  furn(0, 4, 30, ctx => { const p = tileCenter(sc, 0, 4); drawCrystal(ctx, Math.round(p.x), Math.round(p.y), '#7fe8ff'); }, { word: 'crystal', fx: 'sparkle' });
  furn(0, 8, 26, ctx => { const p = tileCenter(sc, 0, 8); drawBigShroom(ctx, Math.round(p.x), Math.round(p.y), '#ff9cf0'); }, { word: 'mushroom', fx: 'boing' });
  for (const [c, r] of [[0, 4], [0, 8]]) { const p = tileCenter(sc, c, r); sc.lamps.push({ x: p.x, y: p.y - 14 }); }

  // Stairs back down in the front-right corner.
  addStairs(sc, 9, 6, 2, 3, ctx => drawStairwell(ctx, sc, 9, 6, 2, 3, 6, STAIRS_TOWER),
    [9, 10].map(c => ({ c, r: 5, target: 'tower', at: { c: 10, r: 4 }, icon: '⬇️' })));

  for (const n of TOWER2_NPCS) sc.npcs.push(kidVillager(n));
  sc.start = { c: 9, r: 4 };
  renderGround(sc);
  return sc;
}

// ---- The gate in town ------------------------------------------------------------------

// At the west end of the town's upper road, in both editions: the road runs
// on through the ring of trees, which make way. `sideGate` is the edition's
// own (addSideGate, rtAddSideGate).
function addTownMonsterGate(sc, sideGate) {
  for (const [c, r] of [[0, 14], [0, 15], [1, 14], [1, 15], [2, 15]]) setTile(sc, c, r, 'road');
  const gone = o => o.tree && o.c0 <= 2 && o.r0 >= 12 && o.r0 <= 17;
  for (const o of sc.objects.filter(gone)) tileAt(sc, o.c0, o.r0).blocked = false;
  sc.objects = sc.objects.filter(o => !gone(o));
  for (let r = 13; r <= 16; r++) for (let c = 0; c <= 2; c++) tileAt(sc, c, r).blocked = false;
  const links = [14, 15].map(r => ({ c: 0, r, target: 'monster', at: { c: MONSTER_N - 3, r: r - 3 }, icon: '👾', style: 'gate', needStars: MONSTER_STARS }));
  sc.links.push(...links);
  sideGate(sc, 1, [13, 16], '#c8b8ff', [0, 1], links);
  const gp = tileCenter(sc, 1, 14.5);
  sc.signs.push({ x: gp.x, y: gp.y - 64, text: place('monster'), color: '#8f5ad8', needStars: MONSTER_STARS, links });
}
