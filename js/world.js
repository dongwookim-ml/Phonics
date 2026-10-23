// Scenes: the town outdoors and the rooms inside each house and the castle.
// A scene holds its tile grid, a pre-rendered ground image and a list of
// objects (buildings, trees, furniture) that are depth-sorted with the
// characters every frame.

function makeScene(kind, W, D, top, bottom = 40) {
  const M = 40;
  const sc = { kind, W, D, ox: (D - 1) * 16 + M, oy: top };
  sc.width = sc.ox + (W - 1) * 16 + 32 + M;
  sc.height = sc.oy + (W - 1 + D - 1) * 8 + 16 + bottom;
  sc.tiles = [];
  for (let r = 0; r < D; r++) {
    sc.tiles.push([]);
    for (let c = 0; c < W; c++) sc.tiles[r].push({ type: 'grass', blocked: false });
  }
  sc.objects = [];
  sc.npcs = [];
  sc.doors = [];      // { c, r, enter: () => scene, label }
  sc.signs = [];      // crisp overlay text: { x, y, text, color }
  sc.lamps = [];
  sc.decor = [];      // overlay pictures on walls: { x, y, emoji, size }
  return sc;
}

function inScene(sc, c, r) {
  return c >= 0 && r >= 0 && c < sc.W && r < sc.D;
}
function tileAt(sc, c, r) {
  return inScene(sc, c, r) ? sc.tiles[r][c] : null;
}
function setTile(sc, c, r, type) {
  const t = tileAt(sc, c, r);
  if (t) { t.type = type; t.blocked = type === 'water'; }
}
function block(sc, c0, r0, w, d) {
  for (let r = r0; r < r0 + d; r++) for (let c = c0; c < c0 + w; c++) {
    const t = tileAt(sc, c, r);
    if (t) t.blocked = true;
  }
}
function walkable(sc, c, r) {
  const t = tileAt(sc, c, r);
  if (!t || t.blocked) return false;
  return !sc.npcs.some(n => n.c === c && n.r === r);
}

// Pre-renders a static object into its own canvas. `draw(ctx)` paints in
// world coordinates; `bounds` is the world rectangle it may touch.
function addObject(sc, foot, bounds, draw, extra = {}) {
  const cv = makeCanvas(bounds.w, bounds.h);
  const ctx = cv.getContext('2d');
  ctx.translate(-bounds.x, -bounds.y);
  draw(ctx);
  const obj = Object.assign({
    c0: foot.c, r0: foot.r, c1: foot.c + foot.w - 1, r1: foot.r + foot.d - 1,
    canvas: cv, x: bounds.x, y: bounds.y, w: cv.width, h: cv.height,
  }, extra);
  obj.alpha = ctx.getImageData(0, 0, cv.width, cv.height).data;
  sc.objects.push(obj);
  return obj;
}

// True when world point (wx, wy) lands on a painted pixel of the object.
function hitObject(obj, wx, wy) {
  const x = Math.floor(wx - obj.x);
  const y = Math.floor(wy - obj.y);
  if (x < 0 || y < 0 || x >= obj.w || y >= obj.h) return false;
  if (!obj.alpha) {
    // Trees and lamps share one canvas each, so cache the pixels on it.
    const cv = obj.canvas;
    cv.alphaData = cv.alphaData || cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    obj.alpha = cv.alphaData;
  }
  return obj.alpha[(y * obj.w + x) * 4 + 3] > 40;
}

function footBounds(sc, c0, r0, w, d, up, pad = 8) {
  const k = boxCorners(sc, c0, r0, w, d);
  return { x: k.L.x - pad, y: k.T.y - up, w: k.R.x - k.L.x + pad * 2, h: k.B.y - k.T.y + up + pad };
}

function renderGround(sc) {
  sc.ground = makeCanvas(sc.width, sc.height);
  const g = sc.ground.getContext('2d');
  sc.water = [];
  for (let r = 0; r < sc.D; r++) {
    for (let c = 0; c < sc.W; c++) {
      const t = sc.tiles[r][c];
      const o = tileOrigin(sc, c, r);
      switch (t.type) {
        case 'road': drawRoad(g, o.x, o.y); break;
        case 'plaza': drawPlaza(g, o.x, o.y); break;
        case 'water': sc.water.push({ c, r }); break;
        case 'wood': drawWood(g, o.x, o.y, sc.floorTint); break;
        case 'carpet': drawCarpet(g, o.x, o.y, t.color || '#ff8fc0', t.edge); break;
        case 'flowers': drawGrass(g, o.x, o.y, c, r, true); break;
        case 'moss': drawMoss(g, o.x, o.y, c, r, t.flowers); break;
        case 'path': drawPath(g, o.x, o.y); break;
        case 'meadow': drawMeadow(g, o.x, o.y, c, r, t.flowers); break;
        case 'rainbow': drawRainbowPath(g, o.x, o.y, Math.floor(t.band / 2)); break;
        default: drawGrass(g, o.x, o.y, c, r, false);
      }
      if (t.rug) drawDoormat(g, o.x, o.y, t.rug);
      else if (t.mat) {
        const cx = o.x + 16;
        const cy = o.y + 8;
        fillPoly(g, diamondPts(o.x, o.y).map(p => ({ x: cx + (p.x - cx) * 0.7, y: cy + (p.y - cy) * 0.7 })), t.mat);
      }
      if (sc.outdoor) {
        if (r === sc.D - 1) drawEdge(g, o.x, o.y, 'left', 14);
        if (c === sc.W - 1) drawEdge(g, o.x, o.y, 'right', 14);
      }
    }
  }
  if (sc.paintGround) sc.paintGround(g);
  sc.waterLayer = makeCanvas(sc.width, sc.height);
}

// ---- Town ---------------------------------------------------------------

const TOWN_N = 40;
const CASTLE_AT = { c: 15, r: 3, w: 10, d: 7 };
// Each letter house gets its own look (see HOUSE_DRAW in sprites.js).
const HOUSE_SHAPES = {
  A: 'thatch', B: 'bakery', C: 'tower', D: 'cottage', F: 'windmill', G: 'mushroom',
  H: 'manor', M: 'tower', N: 'thatch', P: 'bakery', S: 'windmill', T: 'manor',
};

function buildTown() {
  const sc = makeScene('town', TOWN_N, TOWN_N, 150, 60);
  sc.outdoor = true;
  const N = TOWN_N;
  const reserved = new Set();
  const key = (c, r) => r * N + c;
  const reserve = (c, r) => reserved.add(key(c, r));

  // Roads.
  for (const rr of [14, 26]) for (let c = 2; c <= 37; c++) setTile(sc, c, rr, 'road');
  for (const cc of [8, 31]) for (let r = 14; r <= 26; r++) setTile(sc, cc, r, 'road');
  for (const cc of [19, 20]) for (let r = 10; r <= 39; r++) setTile(sc, cc, r, 'road');
  // Plaza with the fountain.
  for (let r = 17; r <= 22; r++) for (let c = 16; c <= 23; c++) setTile(sc, c, r, 'plaza');
  // Pond.
  for (let r = 28; r <= 35; r++) for (let c = 24; c <= 33; c++) {
    if (((c - 28.5) / 4.6) ** 2 + ((r - 31.5) / 3.3) ** 2 <= 1) setTile(sc, c, r, 'water');
  }
  // Flower fields.
  for (let r = 16; r <= 22; r++) for (let c = 2; c <= 6; c++) setTile(sc, c, r, 'flowers');
  for (let c = 12; c <= 27; c++) if (tileAt(sc, c, 10).type === 'grass') setTile(sc, c, 10, 'flowers');
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (tileAt(sc, c, r).type === 'grass' && hash(c, r, 77) < 0.06) setTile(sc, c, r, 'flowers');
  }

  // Castle.
  const C = CASTLE_AT;
  block(sc, C.c, C.r, C.w, C.d);
  for (let r = C.r - 1; r <= C.r + C.d; r++) for (let c = C.c - 1; c <= C.c + C.w; c++) reserve(c, r);
  const castle = addObject(sc, { c: C.c, r: C.r, w: C.w, d: C.d }, footBounds(sc, C.c, C.r, C.w, C.d, 200, 30),
    ctx => drawCastle(ctx, sc, C.c, C.r), { kind: 'castle' });
  sc.doors.push({ c: 19, r: 10, obj: castle, target: 'castle' });
  sc.doors.push({ c: 20, r: 10, obj: castle, target: 'castle' });

  // Houses.
  for (const h of TOWN_HOUSES) {
    const info = LETTERS.find(l => l.letter === h.letter);
    block(sc, h.c, h.r, 3, 3);
    for (let r = h.r - 1; r <= h.r + 3; r++) for (let c = h.c - 1; c <= h.c + 3; c++) reserve(c, r);
    const style = { roof: info.color, wall: '#fff7ee', door: 'left', shape: HOUSE_SHAPES[h.letter] || 'cottage' };
    const obj = addObject(sc, { c: h.c, r: h.r, w: 3, d: 3 }, footBounds(sc, h.c, h.r, 3, 3, houseUp(style.shape), 12),
      ctx => drawHouse(ctx, boxCorners(sc, h.c, h.r, 3, 3), style), { kind: 'house', house: h, info });
    const door = { c: h.c + 1, r: h.r + 3 };
    sc.doors.push({ c: door.c, r: door.r, obj, target: `house-${h.letter}` });
    // Sign hangs over the door.
    const k = boxCorners(sc, h.c, h.r, 3, 3);
    const sign = wallPt(wall(k.L, k.B), (k.B.x - k.L.x) / 2, 30);
    sc.signs.push({ x: sign.x, y: sign.y, text: info.letter + info.letter.toLowerCase(), color: info.color });
  }

  // Fountain in the plaza.
  block(sc, 19, 19, 2, 2);
  for (let r = 18; r <= 21; r++) for (let c = 18; c <= 21; c++) reserve(c, r);
  const fc = tileCenter(sc, 19.5, 19.5);
  sc.objects.push({ c0: 19, r0: 19, c1: 20, r1: 20, x: fc.x - 30, y: fc.y - 40, w: 60, h: 60,
    animated: (ctx, t) => drawFountain(ctx, Math.round(fc.x), Math.round(fc.y), t) });

  // Lamps along the roads.
  const lamp = makeLamp();
  const lampSpots = [[18, 13], [21, 13], [18, 24], [21, 24], [18, 30], [21, 30], [18, 36], [21, 36], [7, 15], [32, 15], [7, 25], [32, 25]];
  for (const [c, r] of lampSpots) {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, canvas: lamp.canvas, x: p.x - lamp.ax, y: p.y - lamp.ay, w: lamp.canvas.width, h: lamp.canvas.height });
    sc.lamps.push({ x: p.x, y: p.y - lamp.ay + lamp.glow.y });
  }

  for (const n of TOWN_NPCS) reserve(n.c, n.r);
  reserve(20, 12);

  // Trees: a forest ring around town and a few scattered inside.
  const green = makeTree('green');
  const blossom = makeTree('blossom');
  const ringTrees = [green, green, blossom, makePlant('pine'), makePlant('oak')];
  const innerPlants = [green, makePlant('oak'), makePlant('birch'), makePlant('pine'), makePlant('bush'), makePlant('tulips'), makePlant('bluebells')];
  const nearPond = (c, r) => Math.abs(c - 28.5) < 7 && Math.abs(r - 31.5) < 6;
  const nearRoad = (c, r) => {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const t = tileAt(sc, c + dc, r + dr);
      if (t && (t.type === 'road' || t.type === 'plaza' || t.type === 'water')) return true;
    }
    return false;
  };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const t = tileAt(sc, c, r);
    if (t.blocked || reserved.has(key(c, r)) || (t.type !== 'grass' && t.type !== 'flowers') || nearRoad(c, r)) continue;
    const ring = c < 2 || r < 2 || c > N - 3 || r > N - 3;
    const chance = ring ? 0.55 : 0.09;
    if (hash(c, r, 91) >= chance) continue;
    // Keep trees from touching each other so the town stays airy.
    if (sc.objects.some(o => o.tree && Math.abs(o.c0 - c) <= 1 && Math.abs(o.r0 - r) <= 1) && !ring) continue;
    let tree = (Math.abs(c - 20) < 9 && r < 24 && hash(c, r, 5) < 0.6) || hash(c, r, 6) < 0.25 ? blossom : green;
    // Mix in other kinds: pines and oaks in the ring, bushes and flowers in town.
    const pick = hash(c, r, 7);
    if (ring && pick < 0.45) tree = ringTrees[Math.floor(hash(c, r, 8) * ringTrees.length)];
    else if (!ring && nearPond(c, r) && pick < 0.6) tree = makePlant('palm');
    else if (!ring && pick < 0.6) tree = innerPlants[Math.floor(hash(c, r, 8) * innerPlants.length)];
    block(sc, c, r, 1, 1);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, tree: true, canvas: tree.canvas, x: p.x - tree.ax, y: p.y - tree.ay, w: tree.canvas.width, h: tree.canvas.height });
  }

  for (const n of TOWN_NPCS) sc.npcs.push(makeNpc(n, null));
  sc.start = { c: 20, r: 12 };

  // Gate to the Starlight Forest at the south end of the main road.
  addGate(sc, [18, 21], 38, '#b8a0e8');
  sc.links = [19, 20].map(c => ({ c, r: 39, target: 'forest', at: { c: 14 + (c - 19), r: 1 }, icon: '🌲', style: 'gate', needStars: FOREST_STARS }));
  const gp = tileCenter(sc, 19.5, 38);
  sc.signs.push({ x: gp.x, y: gp.y - 64, text: '🌲 별빛 숲 마을', color: '#8f70e0', needStars: FOREST_STARS });
  renderGround(sc);
  return sc;
}

// Two gate posts at columns `cols` on row r, joined by a garland arch, with
// a coloured mat between. The caller hangs a destination sign under the arch.
function addGate(sc, cols, r, mat) {
  const post = makeGatePost();
  for (const c of cols) {
    const p = tileCenter(sc, c, r);
    sc.objects = sc.objects.filter(o => !(o.tree && o.c0 === c && o.r0 === r));
    block(sc, c, r, 1, 1);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, canvas: post.canvas, x: p.x - post.ax, y: p.y - post.ay, w: post.canvas.width, h: post.canvas.height });
    sc.lamps.push({ x: p.x, y: p.y - post.ay + 4 });
  }
  for (let c = cols[0] + 1; c < cols[1]; c++) for (const rr of [r, r + 1]) if (tileAt(sc, c, rr)) tileAt(sc, c, rr).mat = mat;
  const A = tileCenter(sc, cols[0], r);
  const B = tileCenter(sc, cols[1], r);
  const bounds = { x: A.x - 2, y: A.y - 60, w: B.x - A.x + 4, h: B.y - A.y + 34 };
  addObject(sc, { c: cols[0], r, w: cols[1] - cols[0] + 1, d: 1 }, bounds, ctx => drawGateArch(ctx, A, B, shade(mat, -20)));
}

function makeNpc(def, letter) {
  return { name: def.name || def.who, look: def.look, c: def.c, r: def.r, letter, flip: hash(def.c, def.r, 3) < 0.5, phase: hash(def.c, def.r, 4) * 6 };
}

// ---- Interiors ----------------------------------------------------------

// Draws the two back walls of a room as one object behind everything.
function addRoomWalls(sc, H, wallColor, trim, extraDraw) {
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  const back = { x: k.L.x - 4, y: k.T.y - H - 6, w: k.R.x - k.L.x + 8, h: H + 12 + (k.R.y - k.T.y) };
  const obj = addObject(sc, { c: -1, r: -1, w: 1, d: 1 }, back, ctx => {
    // The wall along r = 0 runs from the top corner to the right corner;
    // the wall along c = 0 runs from the left corner to the top corner.
    const WA = wall(k.L, k.T);
    const WB = wall(k.T, k.R);
    for (const [W, col] of [[WA, shade(wallColor, -10)], [WB, wallColor]]) {
      wallRect(ctx, W, 0, W.len, 0, H, col);
      wallRect(ctx, W, 0, W.len, 0, 14, shade(trim, -10));
      wallRect(ctx, W, 0, W.len, 13, 15, shade(trim, -40));
      for (let x = 6; x < W.len; x += 10) wallRect(ctx, W, x, x + 1, 0, 13, shade(trim, -30));
      wallRect(ctx, W, 0, W.len, H - 4, H, shade(trim, -20));
      // Wallpaper dots.
      for (let x = 4; x < W.len; x += 12) for (let v = 22; v < H - 8; v += 12) wallRect(ctx, W, x, x + 2, v, v + 2, shade(col, 16));
    }
    if (extraDraw) extraDraw(ctx, WA, WB);
  }, { background: true });
  obj.c0 = -10; obj.r0 = -10; obj.c1 = -10; obj.r1 = -10;
  return obj;
}

function buildHouseInterior(h) {
  const info = LETTERS.find(l => l.letter === h.letter);
  const sc = makeScene('room', 8, 7, 110, 50);
  sc.floorTint = '#e8b488';
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) setTile(sc, c, r, 'wood');
  for (let r = 2; r <= 4; r++) for (let c = 2; c <= 5; c++) {
    const t = tileAt(sc, c, r);
    t.type = 'carpet';
    t.color = mix(info.color, '#ffffff', 0.35);
    t.edge = r === 2 || r === 4 || c === 2 || c === 5;
  }
  const exit = { c: 3, r: sc.D - 1 };
  tileAt(sc, exit.c, exit.r).rug = '#c06a8a';

  addRoomWalls(sc, 64, mix(info.color, '#ffffff', 0.72), '#d8a070', (ctx, WA, WB) => {
    // Window on the left wall and a big letter poster on the right wall.
    const wx = WA.len * 0.5;
    wallRect(ctx, WA, wx - 12, wx + 12, 24, 50, '#f8f2ff');
    wallRect(ctx, WA, wx - 10, wx + 10, 26, 48, '#a8dcff');
    wallRect(ctx, WA, wx - 1, wx + 1, 26, 48, '#f8f2ff');
    wallRect(ctx, WA, wx - 10, wx + 10, 36, 37, '#f8f2ff');
    wallRect(ctx, WA, wx - 14, wx - 10, 22, 52, info.color);
    wallRect(ctx, WA, wx + 10, wx + 14, 22, 52, info.color);
    const px0 = WB.len * 0.32;
    wallRect(ctx, WB, px0 - 18, px0 + 18, 22, 56, '#b07a50');
    wallRect(ctx, WB, px0 - 16, px0 + 16, 24, 54, '#fffaf0');
  });
  // Overlay text for the poster and picture frames.
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  const WB = wall(k.T, k.R);
  const poster = wallPt(WB, WB.len * 0.32, 39);
  sc.signs.push({ x: poster.x, y: poster.y, text: info.letter + info.letter.toLowerCase(), color: info.color, big: true, plain: true });
  info.words.slice(0, 3).forEach(([, emoji], i) => {
    const p = wallPt(WB, WB.len * (0.6 + i * 0.13), 40 + (i % 2) * 6);
    sc.decor.push({ x: p.x, y: p.y, emoji, frame: true });
  });

  // Furniture.
  const furn = (c, r, w, d, up, draw) => {
    block(sc, c, r, w, d);
    addObject(sc, { c, r, w, d }, footBounds(sc, c, r, w, d, up, 6), draw);
  };
  furn(6, 0, 1, 2, 30, ctx => drawBed(ctx, sc, 6, 0, info.color));
  furn(1, 0, 1, 1, 44, ctx => drawShelf(ctx, sc, 1, 0, info.color));
  furn(0, 3, 1, 1, 30, ctx => drawPlant(ctx, sc, 0, 3));
  furn(7, 5, 1, 1, 30, ctx => drawPlant(ctx, sc, 7, 5));
  furn(5, 5, 1, 1, 24, ctx => drawTable(ctx, sc, 5, 5));

  sc.npcs.push(makeNpc({ who: h.who, look: h.look, c: 4, r: 2 }, h.letter));
  sc.exit = exit;
  sc.start = { c: exit.c, r: exit.r - 1 };
  sc.house = h;
  sc.info = info;
  renderGround(sc);
  return sc;
}

// Where the door to the princess's room sits along the throne room's left
// wall, measured from the front corner (tile 0, 6). The stairs take the right.
const YUNA_DOOR_X = 56;

function buildCastleInterior() {
  const sc = makeScene('room', 12, 10, 120, 50);
  sc.floorTint = '#f2dce8';
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) setTile(sc, c, r, 'plaza');
  for (let r = 1; r < sc.D; r++) for (const c of [5, 6]) {
    const t = tileAt(sc, c, r);
    t.type = 'carpet';
    t.color = '#e8507a';
  }
  const exit = { c: 5, r: sc.D - 1 };
  tileAt(sc, 5, sc.D - 1).rug = '#ffc83d';
  tileAt(sc, 6, sc.D - 1).rug = '#ffc83d';

  addRoomWalls(sc, 92, '#fbe8f2', '#e8c8dc', (ctx, WA, WB) => {
    for (const W of [WA, WB]) {
      for (let x = 24; x < W.len - 16; x += 56) {
        if (W === WA && Math.abs(x - YUNA_DOOR_X) < 28) continue;
        wallArch(ctx, W, x - 12, x + 12, 30, 80, '#d8b0c8');
        wallArch(ctx, W, x - 10, x + 10, 32, 78, '#9fd0ff');
        // Stained glass diamonds.
        for (let v = 36; v < 72; v += 8) for (let i = -8; i < 9; i += 8) wallRect(ctx, W, x + i - 2, x + i + 2, v, v + 4, ['#ff8fc0', '#ffd34d', '#c7a4ff'][((v + i) / 8 + 99) % 3 | 0]);
        wallRect(ctx, W, x - 1, x + 1, 32, 78, '#d8b0c8');
      }
      // Banners, leaving room for the door to the princess's room.
      for (let x = 52; x < W.len - 20; x += 56) {
        if (W === WA && Math.abs(x - YUNA_DOOR_X) < 24) continue;
        wallRect(ctx, W, x - 6, x + 6, 40, 84, '#ff6fa8');
        wallRect(ctx, W, x - 4, x + 4, 44, 82, '#ff8fc0');
        wallRect(ctx, W, x - 2, x + 2, 60, 66, '#ffd34d');
      }
    }
    drawWallDoor(ctx, WA, YUNA_DOOR_X, '#ff8fc0');
  });

  const furn = (c, r, w, d, up, draw) => {
    block(sc, c, r, w, d);
    addObject(sc, { c, r, w, d }, footBounds(sc, c, r, w, d, up, 8), draw);
  };
  furn(5, 0, 1, 1, 40, ctx => drawThrone(ctx, sc, 5, 0, '#e8507a'));
  furn(6, 0, 1, 1, 40, ctx => drawThrone(ctx, sc, 6, 0, '#b98cff'));
  for (const [c, r] of [[2, 2], [9, 2], [2, 6], [9, 6]]) {
    furn(c, r, 1, 1, 80, ctx => { const p = tileCenter(sc, c, r); drawPillar(ctx, p.x, p.y); });
  }
  furn(0, 4, 1, 1, 30, ctx => drawPlant(ctx, sc, 0, 4));
  furn(11, 4, 1, 1, 30, ctx => drawPlant(ctx, sc, 11, 4));

  sc.npcs.push(makeNpc({ who: '임금님', look: 'king', c: 4, r: 1 }, null));
  sc.npcs.push(makeNpc({ who: '왕비님', look: 'queen', c: 7, r: 1 }, null));
  sc.npcs.push(makeNpc({ who: '시녀', look: 'maid', c: 10, r: 8 }, null));
  sc.exit = exit;
  sc.exitTiles = [{ c: 5, r: sc.D - 1 }, { c: 6, r: sc.D - 1 }];
  sc.start = { c: 5, r: sc.D - 2 };
  // A door in the left wall leads to the princess's own room.
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  const door = wallPt(wall(k.L, k.T), YUNA_DOOR_X, 28);
  tileAt(sc, 0, 6).rug = '#ff8fc0';
  sc.links = [{ c: 0, r: 6, target: 'yuna', icon: '🎀', style: 'door', door }];
  sc.signs.push({ x: door.x, y: door.y - 46, text: `🎀 ${PLAYER.shown}의 방`, color: '#ff6fa8' });
  // A staircase in the back-right corner climbs to the second floor.
  addStairs(sc, 10, 0, 2, 3, ctx => drawCastleStairs(ctx, sc, 10, 0, 2, 3),
    [10, 11].map(c => ({ c, r: 3, target: 'castle2', at: { c: 7, r: 4 }, icon: '⬆️' })));
  const up = tileCenter(sc, 10.5, 1);
  sc.signs.push({ x: up.x, y: up.y - 74, text: '⬆️ 2층', color: '#b98cff' });
  renderGround(sc);
  return sc;
}

// A drawn staircase prop. Tapping it walks to its links like a door.
function addStairs(sc, c, r, w, d, draw, links) {
  block(sc, c, r, w, d);
  addObject(sc, { c, r, w, d }, footBounds(sc, c, r, w, d, 110, 10), draw, { stairs: links });
  sc.links = (sc.links || []).concat(links);
}

// The castle's second floor: the royal library on the left, a balcony
// looking out over the town, a harp and the treasure corner.
function buildCastleUpstairs() {
  const sc = makeScene('room', 10, 9, 120, 50);
  sc.floorTint = '#e8c8a0';
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) setTile(sc, c, r, 'wood');
  for (let r = 2; r <= 6; r++) for (let c = 2; c <= 5; c++) {
    const t = tileAt(sc, c, r);
    t.type = 'carpet';
    t.color = '#c7a4ff';
    t.edge = r === 2 || r === 6 || c === 2 || c === 5;
  }

  addRoomWalls(sc, 92, '#f0e4ff', '#d8c4f0', (ctx, WA, WB) => {
    // Balcony doors on the back-right wall, open to the sky and the town.
    const bx = WB.len * 0.5;
    const x0 = bx - 26;
    const x1 = bx + 26;
    wallArch(ctx, WB, x0 - 4, x1 + 4, 0, 84, CASTLE.gold);
    wallArch(ctx, WB, x0, x1, 0, 80, '#9fd8ff');
    wallRect(ctx, WB, x0, x1, 0, 44, '#bfe6ff');
    wallRect(ctx, WB, x0, x1, 0, 30, '#e0f4ff');
    // Clouds, faraway hills and little pink roofs.
    for (const [cx, v] of [[x0 + 12, 66], [x1 - 14, 56]]) {
      wallRect(ctx, WB, cx - 7, cx + 7, v, v + 4, '#ffffff');
      wallRect(ctx, WB, cx - 4, cx + 4, v + 4, v + 7, '#ffffff');
    }
    for (let x = x0; x < x1; x++) {
      const h = 22 + Math.round(Math.sin((x - x0) / 7) * 3 + Math.sin((x - x0) / 3) * 1.5);
      wallRect(ctx, WB, x, x + 1, 12, h, x % 9 < 1 ? '#7fcf86' : '#8fd896');
    }
    for (const [hx, col] of [[x0 + 9, '#ff8fc0'], [x0 + 22, '#ffd34d'], [x1 - 16, '#b98cff'], [x1 - 6, '#ff6fa8']]) {
      wallRect(ctx, WB, hx - 3, hx + 3, 14, 20, '#fff7ee');
      for (let i = 0; i < 4; i++) wallRect(ctx, WB, hx - 4 + i, hx + 4 - i, 20 + i, 21 + i, col);
    }
    // Balcony railing in front of the view.
    wallRect(ctx, WB, x0, x1, 0, 4, '#f4e6f0');
    wallRect(ctx, WB, x0, x1, 15, 17, '#ffffff');
    for (let x = x0 + 2; x < x1; x += 5) wallRect(ctx, WB, x, x + 2, 4, 15, '#ffffff');
    wallRect(ctx, WB, bx - 1, bx + 1, 17, 80, CASTLE.gold);
    // Purple curtains.
    wallRect(ctx, WB, x0 - 12, x0 - 2, 6, 88, '#9a6ad8');
    wallRect(ctx, WB, x1 + 2, x1 + 12, 6, 88, '#9a6ad8');
    wallRect(ctx, WB, x0 - 12, x0 - 9, 6, 88, '#b98cff');
    wallRect(ctx, WB, x1 + 9, x1 + 12, 6, 88, '#b98cff');
    // Little star lights on the library wall.
    for (let x = 12; x < WA.len - 8; x += 20) wallRect(ctx, WA, x, x + 2, 76, 78, CASTLE.gold);
  });

  const furn = (c, r, w, d, up, draw, extra) => {
    block(sc, c, r, Math.ceil(w), Math.ceil(d));
    return addObject(sc, { c, r, w: Math.ceil(w), d: Math.ceil(d) }, footBounds(sc, c, r, w, d, up, 8), draw, extra);
  };
  furn(0, 1, 0.45, 2, 70, ctx => drawBookcase(ctx, sc, 0, 1, 2));
  furn(0, 4, 0.45, 2, 70, ctx => drawBookcase(ctx, sc, 0, 4, 2));
  furn(1, 0, 1, 1, 44, ctx => drawShelf(ctx, sc, 1, 0, '#b98cff'));
  furn(3, 7, 1, 1, 24, ctx => drawTable(ctx, sc, 3, 7));
  furn(7, 2, 1, 1, 44, ctx => drawHarp(ctx, sc, 7, 2));
  furn(8, 0, 1, 1, 34, ctx => drawTreasureChest(ctx, sc, 8, 0));
  furn(9, 0, 1, 1, 34, ctx => drawTreasureChest(ctx, sc, 9, 0));
  furn(9, 1, 1, 1, 20, ctx => drawCoinPile(ctx, sc, 9, 1));
  furn(9, 3, 1, 1, 30, ctx => drawPlant(ctx, sc, 9, 3));
  const lib = tileCenter(sc, 0, 3);
  sc.signs.push({ x: lib.x - 4, y: lib.y - 68, text: '📚 왕실 도서관', color: '#4a6ab8' });
  const gem = tileCenter(sc, 8.5, 0);
  sc.signs.push({ x: gem.x, y: gem.y - 44, text: '💎', color: '#ffd34d', plain: true });

  // Stairs back down in the front-right corner.
  addStairs(sc, 7, 6, 2, 3, ctx => drawStairwell(ctx, sc, 7, 6, 2, 3),
    [7, 8].map(c => ({ c, r: 5, target: 'castle', at: { c: 10, r: 4 }, icon: '⬇️' })));

  for (const n of CASTLE_UP_NPCS) sc.npcs.push(makeNpc(n, null));
  sc.start = { c: 7, r: 4 };
  renderGround(sc);
  return sc;
}

// The princess's bedroom with the wardrobe where her presents are kept.
function buildYunaRoom() {
  const sc = makeScene('room', 9, 8, 110, 50);
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) {
    setTile(sc, c, r, 'carpet');
    const t = tileAt(sc, c, r);
    const inner = c >= 2 && c <= 6 && r >= 2 && r <= 5;
    t.color = inner ? '#ffd0e6' : '#ffe8f2';
    t.edge = inner;
  }
  tileAt(sc, 4, sc.D - 1).rug = '#ffc83d';

  addRoomWalls(sc, 66, '#ffe0ee', '#ffb0d2', (ctx, WA, WB) => {
    // Window with curtains on the left wall, hearts on both walls.
    const wx = WA.len * 0.62;
    wallArch(ctx, WA, wx - 13, wx + 13, 22, 54, '#ffffff');
    wallArch(ctx, WA, wx - 11, wx + 11, 24, 52, '#bfe6ff');
    wallRect(ctx, WA, wx - 1, wx + 1, 24, 52, '#ffffff');
    wallRect(ctx, WA, wx - 17, wx - 11, 20, 56, '#ff8fc0');
    wallRect(ctx, WA, wx + 11, wx + 17, 20, 56, '#ff8fc0');
    for (const W of [WA, WB]) {
      for (let x = 10; x < W.len - 6; x += 22) {
        wallRect(ctx, W, x, x + 2, 58, 60, '#ff8fc0');
        wallRect(ctx, W, x + 3, x + 5, 58, 60, '#ff8fc0');
        wallRect(ctx, W, x + 1, x + 4, 56, 58, '#ff8fc0');
      }
    }
  });
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  const WB = wall(k.T, k.R);
  ['🦄', '🌈', '⭐'].forEach((emoji, i) => {
    const p = wallPt(WB, WB.len * (0.62 + i * 0.12), 40 + (i % 2) * 5);
    sc.decor.push({ x: p.x, y: p.y, emoji, frame: true });
  });

  const furn = (c, r, w, d, up, draw, extra) => {
    block(sc, c, r, w, Math.ceil(d));
    return addObject(sc, { c, r, w, d: Math.ceil(d) }, footBounds(sc, c, r, w, d, up, 8), draw, extra);
  };
  furn(1, 0, 2, 0.5, 64, ctx => drawWardrobe(ctx, sc, 1, 0), { kind: 'wardrobe', front: [{ c: 1, r: 1 }, { c: 2, r: 1 }] });
  furn(0, 3, 0.5, 1, 64, ctx => drawVanity(ctx, sc, 0, 3), { kind: 'wardrobe', front: [{ c: 1, r: 3 }] });
  furn(7, 0, 1, 2, 30, ctx => drawBed(ctx, sc, 7, 0, '#ff8fc0'));
  furn(8, 4, 1, 1, 30, ctx => drawToyChest(ctx, sc, 8, 4));
  furn(0, 6, 1, 1, 30, ctx => drawPlant(ctx, sc, 0, 6));
  furn(5, 0, 1, 1, 30, ctx => drawPlant(ctx, sc, 5, 0));

  sc.links = [{ c: 4, r: sc.D - 1, target: 'castle', at: { c: 1, r: 6 }, icon: '🚪', style: 'mat' }];
  sc.start = { c: 4, r: sc.D - 2 };
  renderGround(sc);
  return sc;
}

// BFS over walkable tiles. `goal(c, r)` may accept several tiles.
function findPath(sc, from, goal, allowBlockedGoal = false) {
  const W = sc.W;
  const key = (c, r) => r * W + c;
  const prev = new Map([[key(from.c, from.r), -1]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (goal(cur.c, cur.r)) {
      const path = [];
      for (let k = key(cur.c, cur.r); k !== -1; k = prev.get(k)) path.unshift({ c: k % W, r: Math.floor(k / W) });
      return path.slice(1);
    }
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = cur.c + dc;
      const r = cur.r + dr;
      if (prev.has(key(c, r)) || !inScene(sc, c, r)) continue;
      if (!walkable(sc, c, r) && !(allowBlockedGoal && goal(c, r))) continue;
      prev.set(key(c, r), key(cur.c, cur.r));
      queue.push({ c, r });
    }
  }
  return null;
}

// ---- Starlight Forest ------------------------------------------------------

const FOREST_N = 30;

function buildForest() {
  const sc = makeScene('forest', FOREST_N, FOREST_N, 120, 60);
  sc.outdoor = true;
  const N = FOREST_N;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    setTile(sc, c, r, 'moss');
    tileAt(sc, c, r).flowers = hash(c, r, 61) < 0.12;
  }
  const reserved = new Set();
  const key = (c, r) => r * N + c;
  const reserve = (c, r) => reserved.add(key(c, r));
  // Winding stone path from the north entrance through the clearing.
  const path = [];
  for (let r = 0; r <= 12; r++) path.push([14 + Math.round(Math.sin(r / 3) * 1.5), r]);
  for (let r = 12; r <= 29; r++) path.push([r >= 26 ? 15 : 14 + Math.round(Math.sin(r / 4) * 2), r]);
  for (const [c, r] of path) for (const dc of [0, 1]) setTile(sc, c + dc, r, 'path');
  for (let c = 5; c <= 24; c++) setTile(sc, c, 17, 'path');
  // Clearing around the giant star tree.
  for (let r = 9; r <= 13; r++) for (let c = 16; c <= 22; c++) if (tileAt(sc, c, r).type === 'moss') tileAt(sc, c, r).flowers = true;
  // Pond.
  for (let r = 19; r <= 27; r++) for (let c = 17; c <= 27; c++) {
    if (((c - 22.5) / 4.2) ** 2 + ((r - 23) / 3.2) ** 2 <= 1) setTile(sc, c, r, 'water');
  }
  // Giant star tree.
  const giant = makeTree('star', 2.2);
  block(sc, 18, 10, 2, 2);
  for (let r = 9; r <= 12; r++) for (let c = 17; c <= 20; c++) reserve(c, r);
  const gc = tileCenter(sc, 18.5, 10.5);
  sc.objects.push({ c0: 18, r0: 10, c1: 19, r1: 11, tree: true, canvas: giant.canvas, x: gc.x - giant.ax, y: gc.y - giant.ay, w: giant.canvas.width, h: giant.canvas.height });
  sc.lamps.push({ x: gc.x, y: gc.y - giant.ay * 0.7, big: true });
  sc.signs.push({ x: gc.x, y: gc.y - giant.ay - 6, text: '⭐', color: '#ffd34d', plain: true, big: true });
  // Mushroom cottages.
  for (const [c, r, cap] of [[5, 4, '#ff6b7f'], [22, 3, '#b98cff'], [3, 20, '#ff8fc0'], [9, 9, '#ffb347']]) {
    block(sc, c, r, 2, 2);
    for (let rr = r - 1; rr <= r + 2; rr++) for (let cc = c - 1; cc <= c + 2; cc++) reserve(cc, rr);
    const m = tileCenter(sc, c + 0.5, r + 0.5);
    addObject(sc, { c, r, w: 2, d: 2 }, { x: m.x - 44, y: m.y - 80, w: 90, h: 92 }, ctx => drawMushroomHouse(ctx, Math.round(m.x), Math.round(m.y), cap));
    sc.lamps.push({ x: m.x + 15, y: m.y - 17 });
  }
  for (const n of FOREST_NPCS) reserve(n.c, n.r);
  for (let r = 0; r <= 2; r++) for (let c = 13; c <= 16; c++) reserve(c, r);
  for (let r = 26; r <= 29; r++) for (let c = 13; c <= 18; c++) reserve(c, r);

  // Glowing mushrooms on the ground.
  sc.paintGround = g => {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const t = tileAt(sc, c, r);
      if (t.type !== 'moss' || hash(c, r, 71) > 0.08) continue;
      const p = tileCenter(sc, c, r);
      const col = ['#7fe8ff', '#ff9cf0', '#fff6a8'][Math.floor(hash(c, r, 72) * 3)];
      drawGlowShroom(g, Math.round(p.x - 4), Math.round(p.y + 2), col);
      drawGlowShroom(g, Math.round(p.x + 3), Math.round(p.y + 4), col);
      sc.lamps.push({ x: p.x, y: p.y, small: true });
    }
  };

  // Dense trees around the edge, a few inside.
  const trees = [makeTree('star'), makeTree('violet'), makeTree('green'), makePlant('starPine'), makePlant('pine'), makeTree('star'), makePlant('berryBush'), makePlant('bluebells')];
  const nearPath = (c, r) => {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const t = tileAt(sc, c + dc, r + dr);
      if (t && (t.type === 'path' || t.type === 'water')) return true;
    }
    return false;
  };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const t = tileAt(sc, c, r);
    if (t.blocked || reserved.has(key(c, r)) || t.type !== 'moss' || nearPath(c, r)) continue;
    const ring = c < 2 || r < 2 || c > N - 3 || r > N - 3;
    if (hash(c, r, 93) >= (ring ? 0.6 : 0.12)) continue;
    if (!ring && sc.objects.some(o => o.tree && Math.abs(o.c0 - c) <= 1 && Math.abs(o.r0 - r) <= 1)) continue;
    const tree = trees[Math.floor(hash(c, r, 94) * trees.length)];
    block(sc, c, r, 1, 1);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, tree: true, canvas: tree.canvas, x: p.x - tree.ax, y: p.y - tree.ay, w: tree.canvas.width, h: tree.canvas.height });
  }

  for (const n of FOREST_NPCS) {
    const npc = makeNpc(n, null);
    npc.level = 2;
    sc.npcs.push(npc);
  }
  // Gate back to the town at the north end, and to the Unicorn Village at the south end.
  addGate(sc, [13, 16], 1, '#c8b0f0');
  sc.links = [14, 15].map(c => ({ c, r: 0, target: 'town', at: { c: 19 + (c - 14), r: 37 }, icon: '🏰', style: 'gate' }));
  const tg = tileCenter(sc, 14.5, 1);
  sc.signs.push({ x: tg.x, y: tg.y - 64, text: '🌸 소리 마을', color: '#ff8fc0' });
  addGate(sc, [14, 17], 28, '#ff9ec4');
  for (const c of [15, 16]) sc.links.push({ c, r: 29, target: 'unicorn', at: { c: c - 1, r: 1 }, icon: '🦄', style: 'gate', needStars: UNICORN_STARS });
  const ug = tileCenter(sc, 15.5, 28);
  sc.signs.push({ x: ug.x, y: ug.y - 64, text: '🦄 유니콘 마을', color: '#ff6fa8', needStars: UNICORN_STARS });
  sc.start = { c: 14, r: 1 };
  renderGround(sc);
  return sc;
}

// ---- Unicorn Village ---------------------------------------------------------

const UNICORN_N = 30;

function buildUnicornVillage() {
  const sc = makeScene('unicorn', UNICORN_N, UNICORN_N, 130, 60);
  sc.outdoor = true;
  const N = UNICORN_N;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    setTile(sc, c, r, 'meadow');
    tileAt(sc, c, r).flowers = hash(c, r, 81) < 0.16;
  }
  const reserved = new Set();
  const key = (c, r) => r * N + c;
  const reserve = (c, r) => reserved.add(key(c, r));
  // A rainbow road from the forest gate in the north, looping round the meadow.
  let step = 0;
  const lay = (c, r) => { const t = tileAt(sc, c, r); if (t && t.type !== 'rainbow') { t.type = 'rainbow'; t.band = step++; } };
  for (let r = 0; r <= 16; r++) for (const dc of [0, 1]) lay(14 + dc + Math.round(Math.sin(r / 3.5) * 1.2), r);
  for (let c = 5; c <= 25; c++) lay(c, 16);
  for (let r = 16; r <= 26; r++) { lay(5, r); lay(25, r); }
  for (let c = 5; c <= 25; c++) lay(c, 26);
  // Crystal lake.
  for (let r = 18; r <= 24; r++) for (let c = 13; c <= 22; c++) {
    if (((c - 17.5) / 4) ** 2 + ((r - 21) / 2.6) ** 2 <= 1) setTile(sc, c, r, 'water');
  }
  // Rainbow arch over the road near the entrance. Its feet sit on one screen row.
  block(sc, 13, 7, 1, 1);
  block(sc, 17, 3, 1, 1);
  for (const [c, r] of [[13, 7], [17, 3], [12, 7], [13, 8], [17, 2], [18, 3]]) reserve(c, r);
  const ac = tileCenter(sc, 15, 5);
  addObject(sc, { c: 13, r: 3, w: 5, d: 5 }, { x: ac.x - 74, y: ac.y - 84, w: 148, h: 100 }, ctx => drawRainbowArch(ctx, Math.round(ac.x), Math.round(ac.y), 64));
  // Unicorn homes, each one different.
  for (const [c, r, shape, roof] of [[3, 9, 'cloud', '#ff9ec4'], [21, 7, 'stable', '#b9a0ff'], [8, 11, 'crystal', '#8fd3ff'], [20, 11, 'candy', '#ff9ec4'], [8, 2, 'star', '#b9a0ff']]) {
    block(sc, c, r, 3, 3);
    for (let rr = r - 1; rr <= r + 3; rr++) for (let cc = c - 1; cc <= c + 3; cc++) reserve(cc, rr);
    addObject(sc, { c, r, w: 3, d: 3 }, footBounds(sc, c, r, 3, 3, houseUp(shape), 12),
      ctx => drawHouse(ctx, boxCorners(sc, c, r, 3, 3), { roof, wall: '#fffaf4', door: 'left', shape }));
    const k = boxCorners(sc, c, r, 3, 3);
    const sign = wallPt(wall(k.L, k.B), (k.B.x - k.L.x) / 2, 30);
    sc.signs.push({ x: sign.x, y: sign.y, text: '🦄', color: roof, plain: true });
  }
  // A fountain inside the rainbow loop.
  block(sc, 9, 21, 2, 2);
  for (let r = 20; r <= 23; r++) for (let c = 8; c <= 11; c++) reserve(c, r);
  const fc = tileCenter(sc, 9.5, 21.5);
  sc.objects.push({ c0: 9, r0: 21, c1: 10, r1: 22, x: fc.x - 30, y: fc.y - 40, w: 60, h: 60,
    animated: (ctx, t) => drawFountain(ctx, Math.round(fc.x), Math.round(fc.y), t) });
  // Flower arches over the rainbow road: only their feet block the way.
  for (const [a, b] of [[[9, 15], [9, 17]], [[4, 21], [6, 21]], [[24, 19], [26, 19]]]) {
    for (const [c, r] of [a, b]) { block(sc, c, r, 1, 1); reserve(c, r); }
    const pa = tileCenter(sc, a[0], a[1]);
    const pb = tileCenter(sc, b[0], b[1]);
    const c0 = Math.min(a[0], b[0]);
    const r0 = Math.min(a[1], b[1]);
    const foot = { c: c0, r: r0, w: Math.abs(a[0] - b[0]) + 1, d: Math.abs(a[1] - b[1]) + 1 };
    const x0 = Math.min(pa.x, pb.x) - 10;
    const y0 = Math.min(pa.y, pb.y) - 70;
    addObject(sc, foot, { x: x0, y: y0, w: Math.abs(pa.x - pb.x) + 20, h: Math.abs(pa.y - pb.y) + 80 }, ctx => drawFlowerArch(ctx, pa, pb));
  }
  // Clouds resting on the meadow.
  for (const [c, r] of [[3, 2], [25, 3], [2, 14], [27, 17], [9, 28], [22, 28], [27, 24]]) {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    addObject(sc, { c, r, w: 1, d: 1 }, { x: p.x - 20, y: p.y - 18, w: 40, h: 32 }, ctx => drawCloudPuff(ctx, Math.round(p.x), Math.round(p.y - 4), 1));
  }
  for (const n of UNICORN_NPCS) reserve(n.c, n.r);
  for (let r = 0; r <= 2; r++) for (let c = 13; c <= 17; c++) reserve(c, r);

  // Cotton candy trees.
  const trees = [makeTree('cotton'), makeTree('candy'), makeTree('blossom'), makeTree('cotton'), makePlant('mintPine'), makePlant('lollipop'), makePlant('heartBush'), makePlant('tulips')];
  const nearRoad = (c, r) => {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const t = tileAt(sc, c + dc, r + dr);
      if (t && (t.type === 'rainbow' || t.type === 'water')) return true;
    }
    return false;
  };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const t = tileAt(sc, c, r);
    if (t.blocked || reserved.has(key(c, r)) || t.type !== 'meadow' || nearRoad(c, r)) continue;
    const ring = c < 2 || r < 2 || c > N - 3 || r > N - 3;
    if (hash(c, r, 95) >= (ring ? 0.5 : 0.08)) continue;
    if (!ring && sc.objects.some(o => o.tree && Math.abs(o.c0 - c) <= 1 && Math.abs(o.r0 - r) <= 1)) continue;
    const tree = trees[Math.floor(hash(c, r, 96) * trees.length)];
    block(sc, c, r, 1, 1);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, tree: true, canvas: tree.canvas, x: p.x - tree.ax, y: p.y - tree.ay, w: tree.canvas.width, h: tree.canvas.height });
  }

  for (const n of UNICORN_NPCS) {
    const npc = makeNpc(n, null);
    npc.level = 3;
    if (n.unicorn) npc.unicorn = n.unicorn;
    sc.npcs.push(npc);
  }
  addGate(sc, [13, 16], 1, '#b8a0e8');
  sc.links = [14, 15].map(c => ({ c, r: 0, target: 'forest', at: { c: c + 1, r: 27 }, icon: '🌲', style: 'gate' }));
  const fg = tileCenter(sc, 14.5, 1);
  sc.signs.push({ x: fg.x, y: fg.y - 64, text: '🌲 별빛 숲 마을', color: '#8f70e0' });
  sc.start = { c: 14, r: 1 };
  renderGround(sc);
  return sc;
}
