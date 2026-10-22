// Pixel-art drawing for PixelTown. Everything here draws in world pixels
// onto low-resolution canvases, which are scaled up with nearest-neighbour
// sampling so every pixel stays crisp.

const TILE_W = 32;
const TILE_H = 16;

// Deterministic pseudo-random number in [0, 1).
function hash(a, b, salt = 0) {
  let h = (a * 374761393 + b * 668265263 + salt * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(v + amt)));
  return '#' + ((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0');
}

function mix(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ch = s => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0');
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

// Fills a convex polygon column by column so edges stay pixel-crisp.
// `color` is a CSS colour or a function (x, y) => colour for patterns.
function fillPoly(ctx, pts, color) {
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, Math.floor(p.x));
    maxX = Math.max(maxX, Math.ceil(p.x));
  }
  for (let x = minX; x < maxX; x++) {
    const cx = x + 0.5;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if ((a.x <= cx && b.x >= cx) || (b.x <= cx && a.x >= cx)) {
        if (a.x === b.x) continue;
        const y = a.y + (b.y - a.y) * (cx - a.x) / (b.x - a.x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
    if (y0 > y1) continue;
    const ya = Math.round(y0);
    const yb = Math.round(y1);
    if (typeof color === 'string') px(ctx, x, ya, 1, Math.max(1, yb - ya), color);
    else for (let y = ya; y < Math.max(ya + 1, yb); y++) px(ctx, x, y, 1, 1, color(x, y));
  }
}

// ---- Isometric geometry --------------------------------------------------

// Top-left of the bounding box of tile (c, r) in a scene.
function tileOrigin(sc, c, r) {
  return { x: sc.ox + (c - r) * 16, y: sc.oy + (c + r) * 8 };
}
function tileCenter(sc, c, r) {
  return { x: sc.ox + 16 + (c - r) * 16, y: sc.oy + 8 + (c + r) * 8 };
}
// Ground corners of a footprint of w x d tiles starting at (c0, r0).
function boxCorners(sc, c0, r0, w, d) {
  const T = tileOrigin(sc, c0, r0);
  const R = tileOrigin(sc, c0 + w - 1, r0);
  const B = tileOrigin(sc, c0 + w - 1, r0 + d - 1);
  const L = tileOrigin(sc, c0, r0 + d - 1);
  return {
    T: { x: T.x + 16, y: T.y },
    R: { x: R.x + 32, y: R.y + 8 },
    B: { x: B.x + 16, y: B.y + 16 },
    L: { x: L.x, y: L.y + 8 },
  };
}

// A wall standing on the ground line from P0 to P1 (left to right).
// Points on it are addressed by x pixels along the wall and v pixels up.
function wall(P0, P1) {
  return { P0, P1, len: P1.x - P0.x };
}
function wallPt(W, x, v) {
  const u = x / W.len;
  return { x: W.P0.x + x, y: W.P0.y + (W.P1.y - W.P0.y) * u - v };
}
function wallRect(ctx, W, x0, x1, v0, v1, color) {
  fillPoly(ctx, [wallPt(W, x0, v0), wallPt(W, x1, v0), wallPt(W, x1, v1), wallPt(W, x0, v1)], color);
}
// Arched opening: rectangle whose top corners are rounded off.
function wallArch(ctx, W, x0, x1, v0, v1, color) {
  const w = x1 - x0;
  for (let i = 0; i < w; i++) {
    const t = (i + 0.5) / w * 2 - 1;
    const cut = Math.round((1 - Math.sqrt(Math.max(0, 1 - t * t))) * Math.min(w / 2, v1 - v0) * 0.9);
    wallRect(ctx, W, x0 + i, x0 + i + 1, v0, v1 - cut, color);
  }
}

// ---- Ground tiles --------------------------------------------------------

function diamondPts(ox, oy) {
  return [{ x: ox + 16, y: oy }, { x: ox + 32, y: oy + 8 }, { x: ox + 16, y: oy + 16 }, { x: ox, y: oy + 8 }];
}
function drawDiamond(ctx, ox, oy, color) {
  fillPoly(ctx, diamondPts(ox, oy), color);
}

function drawGrass(ctx, ox, oy, c, r, flowers) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const n = hash(x, y, 1);
    if (n < 0.05) return '#b4ef8a';
    if (n < 0.09) return '#79c96a';
    const band = (x + y * 2 + Math.floor(hash(c, r, 2) * 6)) % 23 < 2;
    return band ? '#95dc78' : ((c * 7 + r * 3) % 5 === 0 ? '#9be47d' : '#98e07b');
  });
  // Grass tufts.
  for (let i = 0; i < 3; i++) {
    const tx = ox + 8 + Math.floor(hash(c, r, 30 + i) * 16);
    const ty = oy + 4 + Math.floor(hash(c, r, 40 + i) * 8);
    px(ctx, tx, ty, 1, 2, '#6fbf5f');
    px(ctx, tx + 2, ty + 1, 1, 1, '#6fbf5f');
  }
  if (flowers) {
    const colors = ['#ff7fb4', '#ffe066', '#ffffff', '#c7a4ff', '#ff9e7a'];
    const count = 3 + Math.floor(hash(c, r, 5) * 4);
    for (let i = 0; i < count; i++) {
      const fx = ox + 7 + Math.floor(hash(c, r, 10 + i) * 18);
      const fy = oy + 3 + Math.floor(hash(c, r, 20 + i) * 10);
      const col = colors[Math.floor(hash(c, r, 50 + i) * colors.length)];
      px(ctx, fx, fy + 1, 1, 2, '#4f9f48');
      px(ctx, fx - 1, fy, 3, 1, col);
      px(ctx, fx, fy - 1, 1, 3, col);
      px(ctx, fx, fy, 1, 1, '#fff6b0');
    }
  }
}

// Cobblestones laid out in world space so the pattern runs across tiles.
function stonePattern(base, mortar, variants, size) {
  return (x, y) => {
    const u = x / 2 + y;
    const v = y - x / 2;
    const cu = Math.floor(u / size);
    const cv = Math.floor((v + (cu % 2) * size / 2) / size);
    const mu = ((u % size) + size) % size;
    const mv = (((v + (cu % 2) * size / 2) % size) + size) % size;
    if (mu < 1 || mv < 1) return mortar;
    const n = hash(cu, cv, 7);
    if (mu < 2 && mv > 1) return shade(variants[Math.floor(n * variants.length)], 16);
    return variants[Math.floor(n * variants.length)] || base;
  };
}

function drawRoad(ctx, ox, oy) {
  fillPoly(ctx, diamondPts(ox, oy), stonePattern('#f2dccb', '#d8b9a6', ['#f5e2d2', '#f0d6c4', '#f8e8da', '#ecd0c0'], 6));
}
function drawPlaza(ctx, ox, oy) {
  fillPoly(ctx, diamondPts(ox, oy), stonePattern('#fbeef2', '#dcc4d0', ['#fff4f8', '#f6e0ea', '#fde8f0', '#efe4f6'], 8));
}
function drawWood(ctx, ox, oy, tint) {
  const base = tint || '#e0a878';
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const u = x / 2 + y;           // along the planks
    const v = y - x / 2;           // across the planks
    const plank = Math.floor(v / 5);
    const mv = ((v % 5) + 5) % 5;
    if (mv < 1) return shade(base, -40);
    const seam = ((u + plank * 11) % 24 + 24) % 24 < 1;
    if (seam) return shade(base, -30);
    return shade(base, (hash(plank, 0, 3) - 0.5) * 24 + (hash(x, y, 9) < 0.04 ? -12 : 0));
  });
}
function drawCarpet(ctx, ox, oy, color, edge) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    if (edge && hash(x, y, 4) < 0.08) return shade(color, 18);
    return (x + y) % 6 === 0 ? shade(color, -12) : color;
  });
}

function drawWaterTile(ctx, ox, oy, c, r, t) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const w = Math.sin(x * 0.31 + y * 0.9 - t * 2.1) + Math.sin(x * 0.13 - y * 0.4 + t * 1.3);
    if (w > 1.75) return '#e6fbff';
    if (w > 1.3) return '#a8e6ff';
    if (w < -1.5) return '#4fa3e0';
    return '#6cc4f0';
  });
}

// Earthy side wall of the island under the front edges.
function drawEdge(ctx, ox, oy, side, depth = 10) {
  if (side === 'left') {
    for (let x = 0; x < 16; x++) {
      const y = oy + 8 + Math.floor(x / 2);
      px(ctx, ox + x, y, 1, depth, (x + oy) % 7 === 0 ? '#b98a62' : '#c99a70');
      px(ctx, ox + x, y + depth - 2, 1, 2, '#a87a54');
      px(ctx, ox + x, y, 1, 1, '#7fcf6a');
    }
  } else {
    for (let x = 16; x < 32; x++) {
      const y = oy + 15 - Math.floor((x - 16) / 2);
      px(ctx, ox + x, y, 1, depth, (x + oy) % 7 === 0 ? '#9a7050' : '#a97c58');
      px(ctx, ox + x, y + depth - 2, 1, 2, '#8a6244');
      px(ctx, ox + x, y, 1, 1, '#6fbf5f');
    }
  }
}

// ---- Bitmaps -------------------------------------------------------------

function drawBitmap(ctx, rows, palette, x, y, flip = false) {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    const w = row.length;
    for (let i = 0; i < w; i++) {
      const ch = row[flip ? w - 1 - i : i];
      const col = palette[ch];
      if (col) px(ctx, x + i, y + j, 1, 1, col);
    }
  }
}

// ---- Trees and props -----------------------------------------------------

// Round fluffy trees, pre-rendered once per variant.
function makeTree(variant) {
  const W = 34;
  const H = 46;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  const blossom = variant === 'blossom';
  const pal = blossom
    ? { dark: '#e070a8', mid: '#ff9cc8', light: '#ffd0e6', spark: '#ffffff', line: '#a04878' }
    : { dark: '#3f9f58', mid: '#5fc46a', light: '#9be88a', spark: '#d8ffb8', line: '#2a6e40' };
  // Shadow and trunk.
  ctx.fillStyle = 'rgba(40,30,60,0.18)';
  ctx.beginPath();
  ctx.ellipse(17, 42, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, 15, 30, 4, 12, '#8a5a3c');
  px(ctx, 15, 30, 1, 12, '#6b4228');
  px(ctx, 18, 30, 1, 12, '#a8704a');
  px(ctx, 13, 40, 8, 2, '#8a5a3c');
  const blobs = [[17, 15, 12], [10, 21, 8], [24, 21, 8], [17, 8, 8], [17, 24, 8]];
  const inside = (x, y) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 <= br * br);
  for (let y = 0; y < 34; y++) {
    for (let x = 0; x < W; x++) {
      if (!inside(x + 0.5, y + 0.5)) continue;
      const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5);
      if (edge) { px(ctx, x, y, 1, 1, pal.line); continue; }
      const l = (-(x - 17) * 0.6 - (y - 14) * 0.8) / 12 + (hash(x, y, 11) - 0.5) * 0.25;
      let col = pal.mid;
      if (l > 0.45) col = pal.light;
      else if (l < -0.35) col = pal.dark;
      if (hash(x, y, 12) < (blossom ? 0.05 : 0.02)) col = pal.spark;
      px(ctx, x, y, 1, 1, col);
    }
  }
  return { canvas: cv, ax: 17, ay: 41 };
}

function makeLamp() {
  const cv = makeCanvas(12, 34);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = 'rgba(40,30,60,0.18)';
  ctx.beginPath();
  ctx.ellipse(6, 31, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, 5, 9, 2, 22, '#5a4a6a');
  px(ctx, 6, 9, 1, 22, '#7a6a8a');
  px(ctx, 3, 29, 6, 2, '#5a4a6a');
  px(ctx, 2, 3, 8, 7, '#5a4a6a');
  px(ctx, 3, 4, 6, 5, '#fff2a8');
  px(ctx, 4, 5, 2, 3, '#ffffff');
  px(ctx, 1, 2, 10, 1, '#5a4a6a');
  px(ctx, 4, 0, 4, 2, '#5a4a6a');
  return { canvas: cv, ax: 6, ay: 31, glow: { x: 6, y: 6 } };
}

// ---- Houses --------------------------------------------------------------

// Half-timbered cottage with a gable roof. `door` is 'left' or 'right'.
function drawCottage(ctx, k, style) {
  const H = 46;
  const roofH = 34;
  const { T, R, B, L } = k;
  const plaster = style.wall || '#fff6ea';
  const plasterL = shade(plaster, -22);
  const beam = '#8a5a44';
  const beamL = '#6f4634';
  const stoneR = '#e4d6d4';
  const stoneL = '#c8b6b6';
  const roof = style.roof;

  // Soft shadow.
  ctx.fillStyle = 'rgba(40,30,70,0.16)';
  fillPoly(ctx, [{ x: T.x + 8, y: T.y + 4 }, { x: R.x + 8, y: R.y + 4 }, { x: B.x + 8, y: B.y + 4 }, { x: L.x + 8, y: L.y + 4 }], 'rgba(40,30,70,0.16)');

  const WL = wall(L, B);
  const WR = wall(B, R);
  const walls = [
    { W: WL, plaster: plasterL, beam: beamL, stone: stoneL, side: 'left' },
    { W: WR, plaster, beam, stone: stoneR, side: 'right' },
  ];
  for (const s of walls) {
    const { W } = s;
    wallRect(ctx, W, 0, W.len, 0, H, s.plaster);
    // Stone base with bricks.
    wallRect(ctx, W, 0, W.len, 0, 9, s.stone);
    for (let row = 0; row < 3; row++) {
      wallRect(ctx, W, 0, W.len, row * 3, row * 3 + 1, shade(s.stone, -24));
      for (let x = (row % 2) * 4; x < W.len; x += 8) wallRect(ctx, W, x, x + 1, row * 3, row * 3 + 3, shade('#c8b6b6', -30));
    }
    // Timber frame on the upper floor.
    wallRect(ctx, W, 0, W.len, 24, 27, s.beam);
    wallRect(ctx, W, 0, W.len, H - 3, H, s.beam);
    wallRect(ctx, W, 0, 3, 9, H, s.beam);
    wallRect(ctx, W, W.len - 3, W.len, 9, H, s.beam);
    for (let x = 16; x < W.len - 8; x += 16) {
      wallRect(ctx, W, x - 1, x + 1, 27, H - 3, s.beam);
      // Diagonal brace.
      for (let i = 0; i < 8; i++) wallRect(ctx, W, x + 1 + i, x + 2 + i, 27 + i * 2, 29 + i * 2, s.beam);
    }
    const hasDoor = s.side === style.door;
    const mid = W.len / 2;
    if (hasDoor) {
      wallArch(ctx, W, mid - 9, mid + 9, 0, 24, '#d8c8c0');
      wallArch(ctx, W, mid - 7, mid + 7, 0, 22, '#8b5a3c');
      for (let x = mid - 4; x < mid + 7; x += 4) wallRect(ctx, W, x, x + 1, 0, 20, '#6f4430');
      wallRect(ctx, W, mid + 3, mid + 5, 9, 11, '#ffd34d');
      // Little lantern beside the door.
      wallRect(ctx, W, mid + 11, mid + 15, 15, 20, '#5a4a6a');
      wallRect(ctx, W, mid + 12, mid + 14, 16, 19, '#fff2a8');
      // Flower pots.
      wallRect(ctx, W, mid - 15, mid - 10, 0, 4, '#c8704a');
      wallRect(ctx, W, mid - 15, mid - 10, 4, 7, '#5fb35a');
      wallRect(ctx, W, mid - 14, mid - 13, 6, 8, '#ff7fb4');
      wallRect(ctx, W, mid - 12, mid - 11, 5, 7, '#ffe066');
    }
    const winXs = hasDoor ? [10, W.len - 18] : [12, mid - 4, W.len - 20];
    for (const wx of winXs) drawWindow(ctx, W, wx, 11, style);
    for (const wx of [12, W.len - 20]) drawWindow(ctx, W, wx, 30, style, true);
  }

  // Gable roof: ridge runs along the left wall's direction.
  const up = p => ({ x: p.x, y: p.y - H });
  const Lt = up(L);
  const Bt = up(B);
  const Rt = up(R);
  const G = { x: (Bt.x + Rt.x) / 2, y: (Bt.y + Rt.y) / 2 - roofH };
  const dx = B.x - L.x;
  const dy = B.y - L.y;
  const Gb = { x: G.x - dx, y: G.y - dy };
  // Gable end above the right wall.
  fillPoly(ctx, [Bt, G, Rt], plaster);
  fillPoly(ctx, [{ x: Bt.x + 4, y: Bt.y }, { x: G.x, y: G.y + 6 }, { x: Rt.x - 4, y: Rt.y }], (x, y) => (x % 6 === 0 ? shade(plaster, -18) : plaster));
  const gw = { x: G.x - 4, y: G.y + 14 };
  fillPoly(ctx, [{ x: gw.x, y: gw.y }, { x: gw.x + 8, y: gw.y }, { x: gw.x + 8, y: gw.y + 7 }, { x: gw.x, y: gw.y + 7 }], beam);
  fillPoly(ctx, [{ x: gw.x + 1, y: gw.y + 1 }, { x: gw.x + 7, y: gw.y + 1 }, { x: gw.x + 7, y: gw.y + 6 }, { x: gw.x + 1, y: gw.y + 6 }], '#bfe6ff');
  // Left roof plane with an overhang.
  const o = 4;
  const eL = { x: Lt.x - o, y: Lt.y - o / 2 + 4 };
  const eB = { x: Bt.x + o, y: Bt.y + o / 2 + 4 };
  const rG = { x: G.x + o, y: G.y + o / 2 };
  const rB = { x: Gb.x - o, y: Gb.y - o / 2 };
  const slope = (eB.y - eL.y) / (eB.x - eL.x);
  fillPoly(ctx, [eL, eB, rG, rB], (x, y) => {
    const d = eL.y + (x - eL.x) * slope - y; // pixels above the eave
    const row = Math.floor(d / 5);
    const md = ((d % 5) + 5) % 5;
    if (d < 2) return shade(roof, -60);
    if (md < 1) return shade(roof, -38);
    if (((x + row * 4) % 8 + 8) % 8 === 0) return shade(roof, -30);
    const hl = hash(x, row, 21) < 0.06 ? 18 : 0;
    return shade(roof, (d > roofH + 4 ? 14 : 0) + hl - 8);
  });
  // Front gable edge trim and ridge.
  for (let i = 0; i <= 1; i++) fillPoly(ctx, [{ x: eB.x, y: eB.y - i }, { x: rG.x, y: rG.y - i }, { x: rG.x - 2, y: rG.y - i - 1 }, { x: eB.x - 2, y: eB.y - i - 1 }], shade(roof, -50));
  fillPoly(ctx, [rB, rG, { x: rG.x, y: rG.y - 2 }, { x: rB.x, y: rB.y - 2 }], shade(roof, 30));
  // Chimney.
  const cx = Math.round(Gb.x + dx * 0.25);
  const cy = Math.round(Gb.y + dy * 0.25);
  px(ctx, cx, cy - 10, 8, 14, '#c07a5a');
  px(ctx, cx + 5, cy - 10, 3, 14, '#a0604a');
  px(ctx, cx - 1, cy - 12, 10, 3, '#8a4f3c');
}

function drawWindow(ctx, W, x, v, style, small) {
  const w = small ? 8 : 10;
  const h = small ? 8 : 10;
  wallRect(ctx, W, x - 1, x + w + 1, v - 1, v + h + 1, '#f8f2ff');
  wallRect(ctx, W, x, x + w, v, v + h, '#8fd0ff');
  wallRect(ctx, W, x + 1, x + 3, v + h - 4, v + h - 1, '#e6f7ff');
  wallRect(ctx, W, x + w / 2, x + w / 2 + 1, v, v + h, '#f8f2ff');
  wallRect(ctx, W, x, x + w, v + h / 2, v + h / 2 + 1, '#f8f2ff');
  // Shutters in the house colour.
  wallRect(ctx, W, x - 4, x - 1, v - 1, v + h + 1, style.roof);
  wallRect(ctx, W, x + w + 1, x + w + 4, v - 1, v + h + 1, style.roof);
  if (!small) {
    // Flower box.
    wallRect(ctx, W, x - 2, x + w + 2, v - 4, v - 1, '#a0603c');
    for (let i = 0; i < w + 2; i += 2) wallRect(ctx, W, x - 1 + i, x + i, v - 1, v + 1, i % 4 ? '#ff7fb4' : '#ffe066');
  }
}

// ---- Castle --------------------------------------------------------------

const CASTLE = {
  wall: '#fbf0f6',
  wallL: '#e8d4e4',
  line: '#dcc0d4',
  lineL: '#ccacc4',
  roof: '#ff8fc0',
  gold: '#ffd34d',
  glass: '#9fd0ff',
};

function drawBattlements(ctx, W, v, color, top) {
  for (let x = 0; x < W.len; x += 6) {
    wallRect(ctx, W, x, Math.min(W.len, x + 4), v, v + 5, color);
    wallRect(ctx, W, x, Math.min(W.len, x + 4), v + 4, v + 5, top);
  }
}

// Stone box: two visible walls, a flat top and battlements.
function drawStoneBox(ctx, k, H, opts = {}) {
  const { T, R, B, L } = k;
  const WL = wall(L, B);
  const WR = wall(B, R);
  for (const [W, base, line] of [[WL, CASTLE.wallL, CASTLE.lineL], [WR, CASTLE.wall, CASTLE.line]]) {
    wallRect(ctx, W, 0, W.len, 0, H, base);
    for (let v = 6; v < H; v += 6) {
      wallRect(ctx, W, 0, W.len, v, v + 1, line);
      for (let x = ((v / 6) % 2) * 6; x < W.len; x += 12) wallRect(ctx, W, x, x + 1, v - 5, v, line);
    }
    wallRect(ctx, W, 0, W.len, H - 4, H - 2, CASTLE.gold);
  }
  const up = p => ({ x: p.x, y: p.y - H });
  fillPoly(ctx, [up(T), up(R), up(B), up(L)], opts.top || '#f2d8e6');
  if (opts.battlements !== false) {
    drawBattlements(ctx, wall(up(L), up(B)), 0, CASTLE.wallL, '#fff6fb');
    drawBattlements(ctx, wall(up(B), up(R)), 0, CASTLE.wall, '#ffffff');
  }
  return { WL, WR };
}

// Round tower with a pointed roof and a flag. (cx, cy) is the ground centre.
function drawTower(ctx, cx, cy, R, H, roofH, opts = {}) {
  const roof = opts.roof || CASTLE.roof;
  for (let dx = -R; dx < R; dx++) {
    const t = (dx + 0.5) / R;
    const e = Math.sqrt(1 - t * t) * R / 2;
    const yb = Math.round(cy + e);
    const yt = Math.round(cy - H + e);
    let col = CASTLE.wall;
    if (t < -0.45) col = CASTLE.wallL;
    else if (t < -0.1) col = mix('#e8d4e4', '#fbf0f6', 0.5);
    else if (t > 0.75) col = '#f0e0ec';
    px(ctx, cx + dx, yt, 1, yb - yt, col);
    for (let v = 6; v < H; v += 7) px(ctx, cx + dx, Math.round(yb - v), 1, 1, t < -0.1 ? CASTLE.lineL : CASTLE.line);
    px(ctx, cx + dx, Math.round(yt + 2), 1, 2, CASTLE.gold);
  }
  // Tall arched windows.
  for (const [wy, ww] of [[0.62, 3], [0.32, 3]]) {
    const vy = Math.round(cy + R / 2 - H * wy);
    px(ctx, cx - ww, vy - 8, ww * 2, 10, '#6a5a8a');
    px(ctx, cx - ww + 1, vy - 7, ww * 2 - 2, 9, CASTLE.glass);
    px(ctx, cx - ww + 1, vy - 9, ww * 2 - 2, 1, '#6a5a8a');
    px(ctx, cx - 1, vy - 7, 1, 9, '#e6f6ff');
  }
  // Conical roof.
  const RR = R + 3;
  const base = cy - H;
  const apex = base - roofH;
  for (let dx = -RR; dx < RR; dx++) {
    const t = (dx + 0.5) / RR;
    const e = Math.sqrt(Math.max(0, 1 - t * t)) * RR / 2;
    const bottom = Math.round(base + e + 2);
    const top = Math.round(apex + (base - apex) * Math.abs(t));
    for (let y = top; y < bottom; y++) {
      const d = bottom - y;
      let col = roof;
      if (t < -0.35) col = shade(roof, -34);
      else if (t < 0) col = shade(roof, -14);
      else if (t > 0.6) col = shade(roof, -8);
      if (d % 6 === 0) col = shade(roof, -46);
      if (d < 2) col = shade(roof, -60);
      px(ctx, cx + dx, y, 1, 1, col);
    }
  }
  // Finial and flag.
  px(ctx, cx - 1, apex - 4, 2, 5, CASTLE.gold);
  px(ctx, cx, apex - 14, 1, 10, '#8a7a9a');
  const flag = opts.flag || '#ff6fa8';
  for (let i = 0; i < 9; i++) px(ctx, cx + 1 + i, apex - 14 + Math.floor(i / 3), 1, 6 - Math.floor(i * 0.6), i % 3 === 2 ? shade(flag, -20) : flag);
}

// The whole castle as one picture. The footprint is 10 x 7 tiles.
function drawCastle(ctx, sc, c0, r0) {
  const W = 10;
  const D = 7;
  const tc = (c, r) => tileCenter(sc, c, r);
  const k = boxCorners(sc, c0, r0, W, D);
  // Shadow.
  fillPoly(ctx, [
    { x: k.T.x + 14, y: k.T.y + 6 }, { x: k.R.x + 14, y: k.R.y + 6 },
    { x: k.B.x + 14, y: k.B.y + 6 }, { x: k.L.x + 14, y: k.L.y + 6 },
  ], 'rgba(40,30,70,0.15)');

  const back = tc(c0, r0);
  drawTower(ctx, back.x, back.y, 18, 84, 42, { flag: '#9fd0ff' });

  // Keep in the middle, tall enough to rise over the courtyard walls.
  const keep = boxCorners(sc, c0 + 2, r0 + 1, 6, 4);
  const { WL, WR } = drawStoneBox(ctx, keep, 78);
  for (const Wk of [WL, WR]) {
    for (let x = 12; x < Wk.len - 10; x += 22) {
      wallArch(ctx, Wk, x - 1, x + 9, 41, 61, '#8a7aa8');
      wallArch(ctx, Wk, x, x + 8, 42, 60, CASTLE.glass);
      wallRect(ctx, Wk, x + 4, x + 5, 42, 58, '#e6f6ff');
      wallRect(ctx, Wk, x - 2, x + 10, 39, 41, CASTLE.gold);
    }
  }
  // Central tower on top of the keep.
  const kc = tc(c0 + 4.5, r0 + 2.5);
  drawTower(ctx, Math.round(kc.x), Math.round(kc.y - 78 + 8), 20, 36, 52, { flag: '#ffd34d' });

  // Courtyard walls along the two front sides.
  const rightWall = boxCorners(sc, c0 + W - 1, r0, 1, D);
  drawStoneBox(ctx, rightWall, 38);
  const frontWall = boxCorners(sc, c0, r0 + D - 1, W, 1);
  const fw = drawStoneBox(ctx, frontWall, 38);
  // Gate in the middle of the front wall.
  const WLf = fw.WL;
  const gm = WLf.len / 2;
  wallArch(ctx, WLf, gm - 18, gm + 18, 0, 34, '#cbb0c8');
  wallArch(ctx, WLf, gm - 15, gm + 15, 0, 31, '#5a3a4a');
  wallArch(ctx, WLf, gm - 13, gm + 13, 0, 29, '#a8704a');
  for (let x = gm - 12; x < gm + 13; x += 5) wallRect(ctx, WLf, x, x + 1, 0, 28, '#7a4a34');
  for (let v = 6; v < 28; v += 7) wallRect(ctx, WLf, gm - 12, gm + 13, v, v + 1, CASTLE.gold);
  wallRect(ctx, WLf, gm - 1, gm + 1, 0, 30, '#6a3a2a');
  // Banners either side of the gate.
  for (const bx of [gm - 30, gm + 24]) {
    wallRect(ctx, WLf, bx, bx + 7, 10, 32, '#ff6fa8');
    wallRect(ctx, WLf, bx + 1, bx + 6, 12, 30, '#ff8fc0');
    wallRect(ctx, WLf, bx + 2, bx + 5, 20, 24, CASTLE.gold);
    wallRect(ctx, WLf, bx, bx + 7, 32, 34, CASTLE.gold);
  }

  const right = tc(c0 + W - 1, r0);
  const left = tc(c0, r0 + D - 1);
  const front = tc(c0 + W - 1, r0 + D - 1);
  drawTower(ctx, right.x, right.y, 18, 70, 40, { flag: '#c7a4ff' });
  drawTower(ctx, left.x, left.y, 18, 70, 40, { flag: '#c7a4ff' });
  drawTower(ctx, front.x, front.y, 20, 76, 44, { flag: '#ff6fa8' });
}

function drawFountain(ctx, cx, cy, t) {
  const rx = 26;
  const ry = 13;
  ctx.fillStyle = 'rgba(40,30,70,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy + 3, rx + 2, ry + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let dx = -rx; dx < rx; dx++) {
    const tt = (dx + 0.5) / rx;
    const e = Math.sqrt(1 - tt * tt) * ry;
    px(ctx, cx + dx, Math.round(cy - e), 1, Math.round(e * 2) + 6, tt < -0.3 ? '#e0d0e0' : '#f6eef6');
    px(ctx, cx + dx, Math.round(cy + e) + 5, 1, 1, '#c8b0c8');
  }
  for (let dx = -rx + 3; dx < rx - 3; dx++) {
    const tt = (dx + 0.5) / (rx - 3);
    const e = Math.sqrt(1 - tt * tt) * (ry - 2);
    for (let y = Math.round(cy - e); y < Math.round(cy + e); y++) {
      const w = Math.sin(dx * 0.4 + y * 0.8 - t * 3) + Math.sin(dx * 0.2 - y * 0.5 + t * 2);
      px(ctx, cx + dx, y + 1, 1, 1, w > 1.4 ? '#e6fbff' : w > 0.8 ? '#a8e6ff' : '#6cc4f0');
    }
  }
  // Pillar and bowl.
  px(ctx, cx - 3, cy - 18, 6, 18, '#f6eef6');
  px(ctx, cx - 3, cy - 18, 2, 18, '#e0d0e0');
  px(ctx, cx - 10, cy - 22, 20, 4, '#f6eef6');
  px(ctx, cx - 10, cy - 19, 20, 1, '#c8b0c8');
  px(ctx, cx - 1, cy - 30, 2, 8, '#bfeaff');
  // Water arcs.
  for (let i = 0; i < 14; i++) {
    const p = ((t * 0.9 + i / 14) % 1);
    const side = i % 2 ? 1 : -1;
    const x = cx + side * p * 14;
    const y = cy - 30 + (p * 2 - 1) ** 2 * 16 - 8 + p * 8;
    px(ctx, Math.round(x), Math.round(y), 1, 2, p > 0.8 ? '#ffffff' : '#bfeaff');
  }
}

// ---- Interior furniture -------------------------------------------------

// Small furniture pieces are boxes with a coloured top.
function drawFurnitureBox(ctx, k, H, side, top, front) {
  const WL = wall(k.L, k.B);
  const WR = wall(k.B, k.R);
  wallRect(ctx, WL, 0, WL.len, 0, H, front || shade(side, -26));
  wallRect(ctx, WR, 0, WR.len, 0, H, side);
  const up = p => ({ x: p.x, y: p.y - H });
  fillPoly(ctx, [up(k.T), up(k.R), up(k.B), up(k.L)], top);
  return { WL, WR };
}

function drawBed(ctx, sc, c, r, color) {
  const k = boxCorners(sc, c, r, 1, 2);
  drawFurnitureBox(ctx, k, 8, '#c8905a', '#ffffff');
  const up = p => ({ x: p.x, y: p.y - 9 });
  const kb = boxCorners(sc, c, r + 0.7, 1, 1.3);
  fillPoly(ctx, [up(kb.T), up(kb.R), up(kb.B), up(kb.L)], color);
  fillPoly(ctx, [up(kb.L), up(kb.B), { x: kb.B.x, y: kb.B.y - 4 }, { x: kb.L.x, y: kb.L.y - 4 }], shade(color, -30));
  const head = boxCorners(sc, c, r, 1, 0.25);
  drawFurnitureBox(ctx, head, 18, '#a8704a', '#c8905a');
}

function drawTable(ctx, sc, c, r) {
  const k = boxCorners(sc, c + 0.15, r + 0.15, 0.7, 0.7);
  const leg = boxCorners(sc, c + 0.42, r + 0.42, 0.16, 0.16);
  drawFurnitureBox(ctx, leg, 10, '#8a5a3c', '#8a5a3c');
  const up = p => ({ x: p.x, y: p.y - 10 });
  fillPoly(ctx, [up(k.T), up(k.R), up(k.B), up(k.L)], '#ffffff');
  fillPoly(ctx, [up(k.L), up(k.B), { x: k.B.x, y: k.B.y - 7 }, { x: k.L.x, y: k.L.y - 7 }], '#ffd0e6');
  const m = tileCenter(sc, c, r);
  px(ctx, m.x - 2, m.y - 14, 4, 3, '#ff7fb4');
  px(ctx, m.x - 1, m.y - 16, 2, 2, '#5fc46a');
}

function drawShelf(ctx, sc, c, r, color) {
  const k = boxCorners(sc, c, r, 1, 0.45);
  const { WL } = drawFurnitureBox(ctx, k, 34, '#b07a50', '#c8905a', '#9a6440');
  for (let v = 6; v < 32; v += 9) {
    wallRect(ctx, WL, 1, WL.len - 1, v, v + 1, '#6f4430');
    for (let x = 2; x < WL.len - 2; x += 3) wallRect(ctx, WL, x, x + 2, v + 1, v + 6 + (x % 2), ['#ff7fb4', '#6fa8ff', '#ffd34d', color, '#5fc46a'][(x + v) % 5]);
  }
}

function drawPlant(ctx, sc, c, r) {
  const m = tileCenter(sc, c, r);
  px(ctx, m.x - 4, m.y - 6, 8, 7, '#d07a50');
  px(ctx, m.x - 4, m.y - 6, 3, 7, '#b0603c');
  const leaves = [[0, -14, 6], [-5, -10, 4], [5, -10, 4], [0, -19, 4]];
  for (const [dx, dy, rr] of leaves) {
    for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) {
      if (x * x + y * y <= rr * rr) px(ctx, m.x + dx + x, m.y + dy + y, 1, 1, x + y < -1 ? '#9be88a' : x + y > 2 ? '#3f9f58' : '#5fc46a');
    }
  }
}

function drawThrone(ctx, sc, c, r, color) {
  const seat = boxCorners(sc, c + 0.1, r + 0.2, 0.8, 0.7);
  drawFurnitureBox(ctx, seat, 9, CASTLE.gold, color);
  const back = boxCorners(sc, c + 0.1, r, 0.8, 0.22);
  const { WL } = drawFurnitureBox(ctx, back, 30, CASTLE.gold, CASTLE.gold, '#e0a83a');
  wallRect(ctx, WL, 2, WL.len - 2, 10, 26, color);
  wallRect(ctx, WL, WL.len / 2 - 1, WL.len / 2 + 2, 27, 32, '#ff6fa8');
}

function drawPillar(ctx, cx, cy) {
  for (let dx = -6; dx < 6; dx++) {
    const t = (dx + 0.5) / 6;
    const col = t < -0.3 ? '#e8d4e4' : t > 0.5 ? '#f4e6f0' : '#fbf0f6';
    px(ctx, cx + dx, cy - 66, 1, 66, col);
  }
  px(ctx, cx - 8, cy - 4, 16, 5, '#e8d4e4');
  px(ctx, cx - 8, cy - 70, 16, 5, CASTLE.gold);
  px(ctx, cx - 8, cy - 66, 16, 1, '#e0a83a');
}

// ---- Characters ----------------------------------------------------------

const PRINCESS_TOP = [
  '......oooooo......',
  '....oohhhhhhoo....',
  '...ohhhHHhhhhho...',
  '..ohhHHhhhhhhhho..',
  '..ohHhhhhhhhhhho..',
  '.ohhhsshhhhsshhho.',
  '.ohhhssssssssshho.',
  '.ohhhsskssskssho..',
  '.ohhhsskssskssho..',
  '.ohhhspssssspsho..',
  '.ohhhssssmsssshho.',
  '.ohhhossssssohhho.',
  '.ohhhhoossoohhhho.',
  '..ohLLoddddoLLho..',
  '..oLLLddddddLLLo..',
  '...osoddddddoso...',
  '...os.oddddo.so...',
  '......otttto......',
];
const PRINCESS_SKIRTS = {
  ballgown: [
    '.....oddddddo.....',
    '....oddLddddDo....',
    '...oddLdddddDDo...',
    '..oddLddddddDDDo..',
    '..odLdddddddDDDo..',
    '.oddLdddddddDDDDo.',
    '.odLddddddddDDDDo.',
    'oddLdddddddddDDDDo',
    'otttttttttttttttto',
    '......ff..ff......',
  ],
  long: [
    '......oddddo......',
    '.....oddLdDDo.....',
    '.....odLddDDo.....',
    '....oddLdddDDo....',
    '....odLddddDDo....',
    '...oddLddddDDDo...',
    '...odLdddddDDDo...',
    '..oddLdddddDDDDo..',
    '..otttttttttttto..',
    '......ff..ff......',
  ],
  tutu: [
    '.....oddddddo.....',
    '...oodLddddDDoo...',
    '..odLLdddddDDDDo..',
    '.odLddddddddDDDDo.',
    '.otttttttttttttto.',
    '......os..so......',
    '......os..so......',
    '......os..so......',
    '......os..so......',
    '......ff..ff......',
  ],
};
// Feet for the second walking frame.
const PRINCESS_FEET_B = '.....ff....ff.....';
const PRINCESS_TUTU_LEGS_B = '.....os....so.....';

const HEAD_ITEMS = {
  tiara:   { x: 5, y: -3, rows: ['...gg...', 'y..yy..y', 'yyyyyyyy'] },
  crown:   { x: 5, y: -5, rows: ['y..yy..y', 'yy.yy.yy', 'yyyyyyyy', 'yrygbyry', 'YYYYYYYY'] },
  flowers: { x: 3, y: -2, rows: ['.p..w..p..w.', 'pyp.wyw.pypw', 'GpGGwGGpGGwG'] },
  bow:     { x: 11, y: -3, rows: ['rr..rr', 'rrrrrr', 'rrRRrr', '.r..r.'] },
};
const HAND_BITMAPS = {
  wand:    { x: 15, y: 9, rows: ['.y.', 'yyy', '.y.', '.w.', '.w.', '.w.', '.w.'] },
  bouquet: { x: 14, y: 12, rows: ['pwp.', 'wpyp', 'GpwG', '.GG.', '.GG.'] },
};

const princessCache = new Map();

// Returns { canvas, ax, ay } for an outfit and walk frame.
function princessSprite(outfit, frame) {
  const key = `${outfit.dress}|${outfit.shape}|${outfit.head}|${outfit.hand}|${outfit.hair}|${frame}`;
  if (princessCache.has(key)) return princessCache.get(key);
  const W = 22;
  const H = 34;
  const OXp = 2;
  const OYp = 5;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  const dress = DRESS_COLORS[outfit.dress].c;
  const hair = HAIR_COLORS[outfit.hair].c;
  const pal = {
    o: '#4a2c4f', h: hair[0], H: hair[1], s: '#ffe3d0', k: '#3a2340', p: '#ffadbc', m: '#e0707a',
    d: dress[0], D: dress[1], L: dress[2], t: dress[3], f: '#c0507a',
    y: '#ffd34d', Y: '#e0a52a', g: '#ff5fa0', b: '#6fb7ff', r: '#ff6fa8', R: '#e04a8a', w: '#ffffff', G: '#5fc46a',
  };
  const skirt = PRINCESS_SKIRTS[outfit.shape].slice();
  if (frame === 1) {
    skirt[9] = PRINCESS_FEET_B;
    if (outfit.shape === 'tutu') { skirt[6] = PRINCESS_TUTU_LEGS_B; skirt[8] = PRINCESS_TUTU_LEGS_B; }
  }
  // Long hair behind the dress.
  for (let y = 13; y < 20; y++) { px(ctx, OXp + 1, OYp + y, 2, 1, pal.h); px(ctx, OXp + 15, OYp + y, 2, 1, pal.h); }
  drawBitmap(ctx, PRINCESS_TOP, pal, OXp, OYp);
  drawBitmap(ctx, skirt, pal, OXp, OYp + PRINCESS_TOP.length);
  const head = HEAD_ITEMS[outfit.head];
  if (head) drawBitmap(ctx, head.rows, pal, OXp + head.x, OYp + head.y);
  const hand = HAND_BITMAPS[outfit.hand];
  if (hand) drawBitmap(ctx, hand.rows, pal, OXp + hand.x, OYp + hand.y);
  const sprite = { canvas: cv, ax: OXp + 9, ay: OYp + 28 };
  princessCache.set(key, sprite);
  return sprite;
}

const VILLAGER = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohsssssho....',
  '...osssssssso...',
  '...ossksskss o..',
  '...ossksskss o..',
  '...opsssssspo...',
  '...ossssmsso....',
  '....ossssso.....',
  '.....oossoo.....',
  '....occcccco....',
  '...occcccccco...',
  '..osccccccccso..',
  '..osccccccccso..',
  '...occcccccco...',
  '...obbbbbbbbo...',
  '...oddddddddo...',
  '...odddoodddo...',
  '...odddoodddo...',
  '...oddo..oddo...',
  '...offo..offo...',
];
const VILLAGER_GOWN_BOTTOM = [
  '...oddddddddo...',
  '..oddddddddddo..',
  '..oddddddddddo..',
  '.oddddddddddddo.',
  '.otttttttttttto.',
];
const HATS = {
  helmet:  { x: 3, y: -2, rows: ['...oooo...', '..oaaaao..', '.oaaAaaao.', '.oaaaaaao.', 'oaaaaaaaao', 'oaoooooaao'] },
  bonnet:  { x: 2, y: -1, rows: ['...oooooo...', '..owwwwwwo..', '.owwwwwwwwo.', 'rowwwwwwwwor'] },
  cap:     { x: 3, y: -1, rows: ['..oooooo..', '.occccccoo', 'occccccccooo'] },
  chef:    { x: 3, y: -7, rows: ['..oooooo..', '.owwwwwwo.', 'owwwwwwwwo', 'owwwwwwwwo', 'owwwwwwwwo', '.owwwwwwo.', '.oaaaaaao.', '.owwwwwwo.'] },
  feather: { x: 3, y: -4, rows: ['........r.', '.......rr.', '..oooooro.', '.oggggggo.', 'oggggggggo'] },
  straw:   { x: 1, y: -1, rows: ['....oooooo....', '...oyyyyyyo...', '.ooyyyyyyyyoo.', 'oyyyyyyyyyyyyo'] },
  crown:   { x: 4, y: -4, rows: ['y.y..y.y', 'yyyyyyyy', 'yrybyryy', 'YYYYYYYY'] },
};

const villagerCache = new Map();

function villagerSprite(lookKey, frame) {
  const key = `${lookKey}|${frame}`;
  if (villagerCache.has(key)) return villagerCache.get(key);
  const look = LOOKS[lookKey];
  const cv = makeCanvas(20, 34);
  const ctx = cv.getContext('2d');
  const OXv = 2;
  const OYv = 8;
  const pal = {
    o: '#3f2c48', h: look.hair, s: '#ffe0c8', k: '#3a2340', p: '#ffadbc', m: '#d0606a',
    c: look.shirt, d: look.pants, b: shade(look.pants, -40), f: '#6b4a3a', t: '#ffd34d',
    w: '#ffffff', a: '#c8d2e4', A: '#ffffff', r: '#ff6fa8', g: '#5fc46a', y: look.hat === 'crown' ? '#ffd34d' : '#f2d27a', Y: '#e0a52a',
  };
  let rows = VILLAGER.map(r => r.replace(/ /g, 'h'));
  if (look.gown) rows = rows.slice(0, 18).concat(VILLAGER_GOWN_BOTTOM);
  else if (frame === 1) {
    rows = rows.slice();
    rows[21] = '...oddo..oddo...'.replace('oddo..oddo', 'oddo..oddo');
    rows[22] = '..offo....offo..';
  }
  drawBitmap(ctx, rows, pal, OXv, OYv);
  const hat = HATS[look.hat];
  if (hat) drawBitmap(ctx, hat.rows, pal, OXv + hat.x, OYv + hat.y);
  const sprite = { canvas: cv, ax: OXv + 8, ay: OYv + rows.length - 1 };
  villagerCache.set(key, sprite);
  return sprite;
}

function drawSprite(ctx, sprite, x, y, flip) {
  const dx = Math.round(x - (flip ? sprite.canvas.width - sprite.ax : sprite.ax));
  const dy = Math.round(y - sprite.ay);
  // Soft oval shadow under the feet.
  ctx.fillStyle = 'rgba(40,30,70,0.22)';
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y), 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (flip) {
    ctx.save();
    ctx.translate(dx + sprite.canvas.width, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite.canvas, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(sprite.canvas, dx, dy);
  }
}

// ---- Princess room -------------------------------------------------------

// Tall wardrobe standing against the back-right wall.
function drawWardrobe(ctx, sc, c, r) {
  const k = boxCorners(sc, c, r, 2, 0.5);
  const { WL } = drawFurnitureBox(ctx, k, 50, '#ffc4de', '#ffe0ee', '#ffb0d2');
  const mid = WL.len / 2;
  for (const [x0, x1] of [[3, mid - 1], [mid + 1, WL.len - 3]]) {
    wallRect(ctx, WL, x0, x1, 4, 44, '#ff9cc8');
    wallRect(ctx, WL, x0 + 2, x1 - 2, 6, 42, '#ffd0e6');
  }
  wallRect(ctx, WL, mid - 3, mid - 1, 22, 26, CASTLE.gold);
  wallRect(ctx, WL, mid + 1, mid + 3, 22, 26, CASTLE.gold);
  // Gold crown on top.
  const top = wallPt(WL, mid, 50);
  px(ctx, top.x - 6, top.y - 4, 12, 3, CASTLE.gold);
  for (const dx of [-6, -1, 4]) px(ctx, top.x + dx, top.y - 7, 2, 3, CASTLE.gold);
  px(ctx, top.x - 1, top.y - 3, 2, 1, '#ff5fa0');
}

// Vanity table with a big oval mirror against the back-left wall.
function drawVanity(ctx, sc, c, r) {
  const k = boxCorners(sc, c, r, 0.5, 1);
  const { WR } = drawFurnitureBox(ctx, k, 14, '#ffffff', '#ffe0ee', '#f0d4e4');
  wallRect(ctx, WR, 2, WR.len - 2, 9, 12, '#ffc4de');
  const back = boxCorners(sc, c, r, 0.15, 1);
  const m = drawFurnitureBox(ctx, back, 50, '#fff4fa', '#fff4fa', '#f0d4e4').WR;
  const mid = m.len / 2;
  for (let i = 0; i < m.len; i++) {
    const t = (i + 0.5) / m.len * 2 - 1;
    const h = Math.sqrt(Math.max(0, 1 - t * t)) * 15;
    if (h < 2) continue;
    wallRect(ctx, m, i, i + 1, 32 - h - 1, 32 + h + 1, CASTLE.gold);
    wallRect(ctx, m, i, i + 1, 32 - h + 1, 32 + h - 1, i < mid - 2 ? '#d8f2ff' : '#bfe6ff');
  }
  wallRect(ctx, m, mid - 4, mid - 3, 24, 40, '#ffffff');
}

function drawToyChest(ctx, sc, c, r) {
  const k = boxCorners(sc, c + 0.15, r + 0.2, 0.7, 0.6);
  const { WL, WR } = drawFurnitureBox(ctx, k, 12, '#c8905a', '#e8b07a', '#a8704a');
  wallRect(ctx, WL, 0, WL.len, 9, 10, CASTLE.gold);
  wallRect(ctx, WR, 0, WR.len, 9, 10, CASTLE.gold);
  const m = tileCenter(sc, c, r);
  px(ctx, m.x - 6, m.y - 20, 5, 5, '#ffffff');
  px(ctx, m.x - 5, m.y - 22, 1, 2, '#ffd34d');
  px(ctx, m.x + 1, m.y - 19, 5, 4, '#9fd0ff');
}
