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

// A striped doormat with a fringe on its front edges, marking a way out.
function drawDoormat(ctx, ox, oy, color) {
  const cx = ox + 16;
  const cy = oy + 8;
  const scaled = k => diamondPts(ox, oy).map(p => ({ x: cx + (p.x - cx) * k, y: cy + (p.y - cy) * k }));
  fillPoly(ctx, scaled(0.84), shade(color, -50));
  fillPoly(ctx, scaled(0.72), (x, y) => ((x + 2 * y) >> 2) % 2 ? color : shade(color, 22));
  fillPoly(ctx, scaled(0.26), '#fff4e0');
  // Fringe along the two front edges.
  const [, R, B, L] = scaled(0.84);
  for (let i = 1; i < 13; i += 2) {
    const t = i / 13;
    px(ctx, Math.round(L.x + (B.x - L.x) * t), Math.round(L.y + (B.y - L.y) * t) + 1, 1, 2, '#fff4e0');
    px(ctx, Math.round(B.x + (R.x - B.x) * t), Math.round(B.y + (R.y - B.y) * t) + 1, 1, 2, '#fff4e0');
  }
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
const TREE_PALETTES = {
  green:   { dark: '#3f9f58', mid: '#5fc46a', light: '#9be88a', spark: '#d8ffb8', line: '#2a6e40', sparks: 0.02 },
  blossom: { dark: '#e070a8', mid: '#ff9cc8', light: '#ffd0e6', spark: '#ffffff', line: '#a04878', sparks: 0.05 },
  star:    { dark: '#3a5f9a', mid: '#5a8fd0', light: '#a8d8ff', spark: '#fff6a8', line: '#28406e', sparks: 0.06 },
  violet:  { dark: '#6a4aa8', mid: '#9070d8', light: '#c8b0ff', spark: '#fff6a8', line: '#45307a', sparks: 0.05 },
};

// Round fluffy tree. `k` scales it, so the forest can have a giant one.
function makeTree(variant, k = 1) {
  const W = Math.round(34 * k);
  const H = Math.round(46 * k);
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  const pal = TREE_PALETTES[variant] || TREE_PALETTES.green;
  const cx = W / 2;
  // Shadow and trunk.
  ctx.fillStyle = 'rgba(40,30,60,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, 42 * k, 11 * k, 4 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  const tw = Math.round(4 * k);
  const tx = Math.round(cx - tw / 2);
  px(ctx, tx, Math.round(30 * k), tw, Math.round(12 * k), '#8a5a3c');
  px(ctx, tx, Math.round(30 * k), 1, Math.round(12 * k), '#6b4228');
  px(ctx, tx + tw - 1, Math.round(30 * k), 1, Math.round(12 * k), '#a8704a');
  px(ctx, tx - 2, Math.round(40 * k), tw + 4, 2, '#8a5a3c');
  const blobs = [[17, 15, 12], [10, 21, 8], [24, 21, 8], [17, 8, 8], [17, 24, 8]].map(([x, y, r]) => [x * k, y * k, r * k]);
  const inside = (x, y) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 <= br * br);
  for (let y = 0; y < 34 * k; y++) {
    for (let x = 0; x < W; x++) {
      if (!inside(x + 0.5, y + 0.5)) continue;
      const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5);
      if (edge) { px(ctx, x, y, 1, 1, pal.line); continue; }
      const l = (-(x - 17 * k) * 0.6 - (y - 14 * k) * 0.8) / (12 * k) + (hash(x, y, 11) - 0.5) * 0.25;
      let col = pal.mid;
      if (l > 0.45) col = pal.light;
      else if (l < -0.35) col = pal.dark;
      if (hash(x, y, 12) < pal.sparks) col = pal.spark;
      px(ctx, x, y, 1, 1, col);
    }
  }
  return { canvas: cv, ax: Math.round(cx), ay: Math.round(41 * k) };
}

function drawMoss(ctx, ox, oy, c, r, flowers) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const n = hash(x, y, 1);
    if (n < 0.05) return '#8fe0b0';
    if (n < 0.09) return '#3f8f78';
    return (c + r) % 2 ? '#5fb894' : '#58b08c';
  });
  if (flowers) {
    const colors = ['#c7a4ff', '#9fe8ff', '#ffffff', '#ffb0e8'];
    for (let i = 0; i < 4; i++) {
      const fx = ox + 7 + Math.floor(hash(c, r, 10 + i) * 18);
      const fy = oy + 3 + Math.floor(hash(c, r, 20 + i) * 10);
      px(ctx, fx, fy + 1, 1, 2, '#3f8f68');
      px(ctx, fx, fy, 1, 1, colors[Math.floor(hash(c, r, 50 + i) * colors.length)]);
    }
  }
}
function drawPath(ctx, ox, oy) {
  fillPoly(ctx, diamondPts(ox, oy), stonePattern('#c8c0e0', '#7f78a8', ['#d8d0f0', '#c4bce4', '#e0daf4', '#bcb4dc'], 7));
}

// Wooden gate post wrapped in vines, for the forest entrance.
function makeGatePost() {
  const cv = makeCanvas(14, 50);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = 'rgba(40,30,60,0.18)';
  ctx.beginPath();
  ctx.ellipse(7, 47, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, 4, 8, 6, 39, '#8a5a3c');
  px(ctx, 4, 8, 2, 39, '#6b4228');
  for (let y = 10; y < 46; y += 5) { px(ctx, 3, y, 3, 2, '#5fc46a'); px(ctx, 8, y + 2, 3, 2, '#4fa35a'); }
  px(ctx, 2, 2, 10, 6, '#5a4a6a');
  px(ctx, 3, 3, 8, 4, '#c8f0ff');
  px(ctx, 6, 0, 2, 2, '#ffd34d');
  return { canvas: cv, ax: 7, ay: 47 };
}

// Curved wooden beam with a flower garland between two gate posts standing
// on world points A (left) and B (right).
function drawGateArch(ctx, A, B, accent) {
  const x0 = Math.round(A.x) + 3;
  const x1 = Math.round(B.x) - 3;
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / (x1 - x0);
    const y = Math.round(A.y + (B.y - A.y) * t - 38 - Math.sin(Math.PI * t) * 14);
    px(ctx, x, y - 6, 1, 7, '#5a3a28');
    px(ctx, x, y - 5, 1, 5, '#a8714a');
    px(ctx, x, y - 5, 1, 1, '#c8925f');
    if ((x - x0) % 9 === 4) px(ctx, x, y - 4, 1, 3, '#7a4a30');
    // Garland of leaves with flowers hanging just under the beam.
    const sag = Math.round(Math.sin(((x - x0) / 12) * Math.PI) * 1.5) + 2;
    px(ctx, x, y + sag - 1, 1, 2, (x % 3) ? '#5fc46a' : '#4fa35a');
    if ((x - x0) % 7 === 3) {
      px(ctx, x - 1, y + sag - 1, 3, 3, accent);
      px(ctx, x, y + sag, 1, 1, '#fff4e0');
    }
  }
}

// A decorated arched door painted on wall W, centred at x along the wall.
function drawWallDoor(ctx, W, x, color) {
  wallArch(ctx, W, x - 15, x + 15, 0, 57, '#8a5a1c');
  wallArch(ctx, W, x - 14, x + 14, 0, 56, '#ffd34d');
  wallArch(ctx, W, x - 11, x + 11, 0, 51, shade(color, -40));
  wallArch(ctx, W, x - 10, x + 10, 0, 50, color);
  // Two raised panels on each leaf and a seam down the middle.
  for (const [a, b] of [[-8, -2], [2, 8]]) {
    wallRect(ctx, W, x + a, x + b, 6, 22, shade(color, -18));
    wallRect(ctx, W, x + a + 1, x + b - 1, 7, 21, shade(color, 14));
    wallRect(ctx, W, x + a, x + b, 26, 40, shade(color, -18));
    wallRect(ctx, W, x + a + 1, x + b - 1, 27, 39, shade(color, 14));
  }
  wallRect(ctx, W, x - 0.5, x + 0.5, 0, 50, shade(color, -40));
  wallRect(ctx, W, x - 4, x - 2, 23, 26, '#ffd34d');
  wallRect(ctx, W, x + 2, x + 4, 23, 26, '#ffd34d');
  // A heart in the arch and a bow on top.
  wallRect(ctx, W, x - 3, x - 1, 45, 47, '#ff4f8f');
  wallRect(ctx, W, x + 1, x + 3, 45, 47, '#ff4f8f');
  wallRect(ctx, W, x - 2, x + 2, 43, 45, '#ff4f8f');
  wallRect(ctx, W, x - 1, x + 1, 42, 43, '#ff4f8f');
  wallRect(ctx, W, x - 7, x - 1, 58, 63, '#ff6fa8');
  wallRect(ctx, W, x + 1, x + 7, 58, 63, '#ff6fa8');
  wallRect(ctx, W, x - 2, x + 2, 59, 62, '#e8507a');
  wallRect(ctx, W, x - 4, x - 2, 53, 58, '#ff6fa8');
  wallRect(ctx, W, x + 2, x + 4, 53, 58, '#ff6fa8');
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

// ---- More trees and plants -------------------------------------------------

TREE_PALETTES.apple = { dark: '#3a9050', mid: '#58b860', light: '#8fdc80', spark: '#ff5a6a', line: '#286838', sparks: 0.035 };
TREE_PALETTES.pine = { dark: '#2f7f5a', mid: '#46a06a', light: '#7fd08a', spark: '#d8ffb8', line: '#1f5a40' };
TREE_PALETTES.starPine = { dark: '#2f4f8a', mid: '#4a72b8', light: '#8fc0f0', spark: '#fff6a8', line: '#203868' };
TREE_PALETTES.mintPine = { dark: '#5fb8a8', mid: '#8fe0c8', light: '#d0fff0', spark: '#ffd0f0', line: '#3f8878' };

const plantCache = new Map();
// Pre-rendered plants by name, shared like the trees: { canvas, ax, ay }.
function makePlant(kind) {
  if (plantCache.has(kind)) return plantCache.get(kind);
  const f = {
    pine: () => makePine('pine'),
    starPine: () => makePine('starPine'),
    mintPine: () => makePine('mintPine'),
    oak: () => makeTree('apple', 1.15),
    birch: makeBirch,
    palm: makePalm,
    bush: () => makeBush(['#5fc46a', '#3f9f58', '#9be88a', '#2a6e40'], ['#ff7fb4', '#ffffff']),
    berryBush: () => makeBush(['#4a8fb0', '#2f6a90', '#8fd0e8', '#204a68'], ['#c7a4ff', '#fff6a8']),
    heartBush: () => makeBush(['#ffb0d8', '#e880b8', '#ffe0f0', '#b06090'], ['#ffffff', '#ff6f8a'], true),
    tulips: () => makeFlowerClump(['#ff6f8a', '#ffe066', '#ff9ec4']),
    bluebells: () => makeFlowerClump(['#8fd3ff', '#c7a4ff', '#ffffff']),
    lollipop: makeLollipopTree,
  }[kind];
  const p = f ? f() : makeTree('green');
  plantCache.set(kind, p);
  return p;
}

function plantShadow(ctx, cx, cy, rx) {
  ctx.fillStyle = 'rgba(40,30,60,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, rx * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Shades a filled shape: `inside(x, y)` decides the pixels, light from top-left.
function shadeBlob(ctx, W, H, inside, pal, cx, cy, R, salt) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5);
    if (edge) { px(ctx, x, y, 1, 1, pal.line); continue; }
    const l = (-(x - cx) * 0.6 - (y - cy) * 0.8) / R + (hash(x, y, salt) - 0.5) * 0.25;
    let col = pal.mid;
    if (l > 0.45) col = pal.light;
    else if (l < -0.35) col = pal.dark;
    if (pal.sparks && hash(x, y, salt + 1) < pal.sparks) col = pal.spark;
    px(ctx, x, y, 1, 1, col);
  }
}

// Tall pine made of three stacked tiers.
function makePine(variant) {
  const W = 30;
  const H = 54;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  const pal = TREE_PALETTES[variant];
  const cx = W / 2;
  plantShadow(ctx, cx, 49, 10);
  px(ctx, cx - 2, 40, 4, 10, '#8a5a3c');
  px(ctx, cx - 2, 40, 1, 10, '#6b4228');
  const tiers = [[42, 13, 16], [31, 11, 15], [20, 8, 14]];
  const inside = (x, y) => tiers.some(([base, hw, h]) => {
    const d = base - y;
    if (d < 0 || d > h) return false;
    const w = hw * (1 - d / h) + 1;
    // Soft scalloped lower edge on each tier.
    return Math.abs(x - cx) <= w && !(d < 1.5 && Math.abs(x - cx) % 5 < 1);
  });
  shadeBlob(ctx, W, H, inside, pal, cx, 24, 16, 13);
  if (variant !== 'pine') for (const [x, y] of [[cx - 4, 34], [cx + 5, 26], [cx - 2, 16], [cx + 3, 38]]) px(ctx, Math.round(x), y, 1, 1, pal.spark);
  return { canvas: cv, ax: Math.round(cx), ay: 48 };
}

// Slim birch with a white spotted trunk and a light airy crown.
function makeBirch() {
  const W = 28;
  const H = 52;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  const cx = W / 2;
  plantShadow(ctx, cx, 48, 8);
  px(ctx, cx - 2, 22, 3, 26, '#f6f2ea');
  px(ctx, cx + 1, 22, 1, 26, '#d8d0c4');
  for (let y = 24; y < 46; y += 4) px(ctx, cx - 2 + (y % 8 ? 0 : 1), y, 2, 1, '#4a4040');
  const pal = { dark: '#6fb850', mid: '#9cd870', light: '#d0f4a0', line: '#4a8a38', spark: '#ffe066', sparks: 0.015 };
  const blobs = [[cx, 16, 9], [cx - 6, 22, 6], [cx + 6, 21, 6], [cx, 8, 6], [cx + 1, 26, 5]];
  const inside = (x, y) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + ((y - by) * 0.85) ** 2 <= br * br);
  shadeBlob(ctx, W, 34, inside, pal, cx, 14, 10, 15);
  return { canvas: cv, ax: Math.round(cx), ay: 47 };
}

// Little palm with a curved trunk, for beside the water.
function makePalm() {
  const W = 40;
  const H = 52;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  plantShadow(ctx, 20, 48, 9);
  for (let i = 0; i < 32; i++) {
    const x = Math.round(20 + Math.sin(i / 32 * 1.6) * 6);
    px(ctx, x - 2, 47 - i, 4, 1, i % 4 === 0 ? '#a8704a' : '#c8905a');
    px(ctx, x - 2, 47 - i, 1, 1, '#8a5a3c');
  }
  const top = { x: 26, y: 15 };
  for (const [ang, len] of [[-2.7, 15], [-0.4, 15], [-2.1, 12], [-1.0, 12], [2.6, 13], [0.5, 13]]) {
    for (let s = 0; s < len; s++) {
      const x = Math.round(top.x + Math.cos(ang) * s);
      const y = Math.round(top.y + Math.sin(ang) * s + (s * s) / 30);
      px(ctx, x - 1, y - 1, 3, 3, '#2f8f50');
      px(ctx, x - 1, y - 1, 2, 2, s < len - 3 ? '#5fc46a' : '#9be88a');
    }
  }
  px(ctx, top.x - 3, top.y, 3, 3, '#8a5a3c');
  px(ctx, top.x + 1, top.y + 1, 3, 3, '#a8704a');
  return { canvas: cv, ax: 20, ay: 47 };
}

// Round low bush. `cols` = dark, mid, light, line; `dots` are its flowers.
function makeBush(cols, dots, hearts) {
  const W = 26;
  const H = 24;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  plantShadow(ctx, 13, 20, 11);
  const pal = { dark: cols[1], mid: cols[0], light: cols[2], line: cols[3] };
  const blobs = [[13, 13, 8], [7, 15, 6], [19, 15, 6], [12, 9, 6]];
  const inside = (x, y) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 <= br * br) && y < 21;
  shadeBlob(ctx, W, H, inside, pal, 13, 12, 9, 17);
  for (let i = 0; i < 6; i++) {
    const x = 6 + Math.floor(hash(i, 3, 19) * 14);
    const y = 7 + Math.floor(hash(i, 4, 19) * 10);
    const c = dots[i % dots.length];
    if (hearts) { px(ctx, x - 1, y, 1, 1, c); px(ctx, x + 1, y, 1, 1, c); px(ctx, x - 1, y + 1, 3, 1, c); px(ctx, x, y + 2, 1, 1, c); }
    else { px(ctx, x, y, 2, 2, c); px(ctx, x, y, 1, 1, '#ffffff'); }
  }
  return { canvas: cv, ax: 13, ay: 19 };
}

// Clump of tall flowers.
function makeFlowerClump(cols) {
  const W = 26;
  const H = 26;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  plantShadow(ctx, 13, 21, 9);
  const stems = [[6, 13], [10, 9], [13, 14], [16, 8], [20, 12], [9, 15], [18, 15]];
  stems.forEach(([x, top], i) => {
    px(ctx, x, top + 4, 1, 21 - top - 4, '#4fa35a');
    px(ctx, x + (i % 2 ? 1 : -2), top + 9, 2, 2, '#7fd07a');
    const c = cols[i % cols.length];
    px(ctx, x - 1, top, 3, 4, c);
    px(ctx, x - 2, top, 1, 2, c);
    px(ctx, x + 2, top, 1, 2, c);
    px(ctx, x, top + 1, 1, 1, mix(c, '#ffffff', 0.5));
  });
  return { canvas: cv, ax: 13, ay: 20 };
}

// Lollipop tree for the Unicorn Village: a swirl on a striped stick.
function makeLollipopTree() {
  const W = 30;
  const H = 46;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  plantShadow(ctx, 15, 42, 8);
  for (let y = 22; y < 42; y++) px(ctx, 14, y, 3, 1, (y >> 1) % 2 ? '#ff6f8a' : '#ffffff');
  const cx = 15;
  const cy = 13;
  for (let y = 0; y < 27; y++) for (let x = 0; x < W; x++) {
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    const d = Math.hypot(dx, dy);
    if (d > 12) continue;
    if (d > 11) { px(ctx, x, y, 1, 1, '#b06090'); continue; }
    const a = Math.atan2(dy, dx);
    const band = Math.floor(((a / (Math.PI * 2) + 1) * 3 + d / 4)) % 3;
    px(ctx, x, y, 1, 1, ['#ff9ec4', '#ffffff', '#8fd3ff'][band]);
  }
  px(ctx, 9, 7, 3, 2, '#ffffff');
  return { canvas: cv, ax: 15, ay: 41 };
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

// ---- More house shapes ---------------------------------------------------

// Every shape stands on a 3 x 3 footprint with its door in the middle of the
// front-left wall, so doors, signs and taps work the same as for the cottage.
// `style.shape` picks the drawing; `style.roof` is the house colour.
const HOUSE_DRAW = {
  cottage: (ctx, k, style) => drawCottage(ctx, k, style),
  thatch: drawThatchHouse,
  bakery: drawBakery,
  tower: drawRoundHouse,
  windmill: drawWindmill,
  mushroom: drawMushroomCottage,
  manor: drawManor,
  cloud: drawCloudHouse,
  stable: drawRainbowStable,
  crystal: drawCrystalHut,
  candy: drawCandyCottage,
  star: drawStarTower,
};
// How far above the footprint each shape reaches, for its object bounds.
const HOUSE_UP = { windmill: 150, tower: 136, star: 150, manor: 124, crystal: 124 };

function drawHouse(ctx, k, style) {
  (HOUSE_DRAW[style.shape] || HOUSE_DRAW.cottage)(ctx, k, style);
}
function houseUp(shape) {
  return HOUSE_UP[shape] || 110;
}

function houseShadow(ctx, k) {
  const { T, R, B, L } = k;
  fillPoly(ctx, [{ x: T.x + 8, y: T.y + 4 }, { x: R.x + 8, y: R.y + 4 }, { x: B.x + 8, y: B.y + 4 }, { x: L.x + 8, y: L.y + 4 }], 'rgba(40,30,70,0.16)');
}
function houseMid(k) {
  return { x: (k.L.x + k.R.x) / 2, y: (k.L.y + k.R.y) / 2 };
}

// Arched wooden door in the middle of wall W, with a gold knob.
function houseDoor(ctx, W, color = '#8b5a3c', frame = '#d8c8c0') {
  const mid = W.len / 2;
  wallArch(ctx, W, mid - 9, mid + 9, 0, 24, frame);
  wallArch(ctx, W, mid - 7, mid + 7, 0, 22, color);
  for (let x = mid - 4; x < mid + 7; x += 4) wallRect(ctx, W, x, x + 1, 0, 20, shade(color, -30));
  wallRect(ctx, W, mid + 3, mid + 5, 9, 11, '#ffd34d');
}

// A short flat strip on a round body, facing front-left, for its door.
// (cx, cy) is the ground centre and R the radius at the ground.
function roundDoorWall(cx, cy, R) {
  const p = { x: cx - R * 0.7071, y: cy + R * 0.3536 };
  return wall({ x: p.x - 12, y: p.y - 6 }, { x: p.x + 12, y: p.y + 6 });
}
// Point on the front of a round body: `t` runs -1 (left edge) to 1 (right).
function roundPt(cx, cy, r, t, h) {
  return { x: Math.round(cx + t * r), y: Math.round(cy - h + Math.sqrt(Math.max(0, 1 - t * t)) * r / 2) };
}

// Upright round body tapering from radius R0 at the ground to R1 at height H.
// `colorAt(t, h)` colours it, with t across the front from -1 to 1.
function roundBody(ctx, cx, cy, R0, R1, H, colorAt) {
  for (let dx = -R0; dx < R0; dx++) {
    let prev = null;
    for (let h = 0; h <= H; h++) {
      const r = R0 + (R1 - R0) * h / H;
      const t = (dx + 0.5) / r;
      if (Math.abs(t) >= 1) break;
      const y = Math.round(cy - h + Math.sqrt(1 - t * t) * r / 2);
      if (prev === null) px(ctx, cx + dx, y, 1, 2, colorAt(t, h));
      else if (y < prev) px(ctx, cx + dx, y, 1, prev - y, colorAt(t, h));
      prev = prev === null ? y : Math.min(prev, y);
    }
  }
}
// Soft round shading shared by the round bodies.
function roundShade(base, t) {
  if (t < -0.55) return shade(base, -30);
  if (t < -0.15) return shade(base, -14);
  if (t > 0.7) return shade(base, -8);
  return base;
}

// Cone roof sitting on a circle of radius R at height `base` (a y value).
// `colorAt(t, d)` gets d, the pixels up from the eave.
function coneRoof(ctx, cx, base, R, roofH, colorAt) {
  const apex = base - roofH;
  for (let dx = -R; dx < R; dx++) {
    const t = (dx + 0.5) / R;
    const e = Math.sqrt(Math.max(0, 1 - t * t)) * R / 2;
    const bottom = Math.round(base + e + 2);
    const top = Math.round(apex + (base - apex) * Math.abs(t));
    for (let y = top; y < bottom; y++) px(ctx, cx + dx, y, 1, 1, colorAt(t, bottom - y, cx + dx, y));
  }
  return apex;
}
function shingle(roof, t, d) {
  let col = roof;
  if (t < -0.35) col = shade(roof, -34);
  else if (t < 0) col = shade(roof, -14);
  else if (t > 0.6) col = shade(roof, -8);
  if (d % 6 === 0) col = shade(roof, -46);
  if (d < 2) col = shade(roof, -60);
  return col;
}

// Four-sided roof over a box of height H. `o` widens the eaves; `paint`
// gets (x, y, side, d) with side 'left' or 'right' and d the pixels above the eave.
function hipRoof(ctx, k, H, roofH, o, paint) {
  const c = houseMid(k);
  const e = p => ({ x: c.x + (p.x - c.x) * (1 + o), y: c.y + (p.y - c.y) * (1 + o) - H + 3 });
  const L = e(k.L);
  const T = e(k.T);
  const R = e(k.R);
  const B = e(k.B);
  const A = { x: c.x, y: c.y - H - roofH };
  for (const [P, Q, side] of [[L, T, 'back'], [T, R, 'back'], [L, B, 'left'], [B, R, 'right']]) {
    const slope = (Q.y - P.y) / (Q.x - P.x);
    fillPoly(ctx, [P, Q, A], (x, y) => paint(x, y, side === 'back' ? 'right' : side, P.y + (x - P.x) * slope - y));
  }
  return { L, T, R, B, A };
}

// Plain box walls of height H; `paint(W, left)` decorates each one.
function boxWalls(ctx, k, H, base, paint) {
  const WL = wall(k.L, k.B);
  const WR = wall(k.B, k.R);
  wallRect(ctx, WL, 0, WL.len, 0, H, shade(base, -22));
  wallRect(ctx, WR, 0, WR.len, 0, H, base);
  if (paint) { paint(WL, true); paint(WR, false); }
  return { WL, WR };
}

// Cosy cottage under a fat straw roof.
function drawThatchHouse(ctx, k, style) {
  const H = 32;
  const accent = style.roof;
  houseShadow(ctx, k);
  boxWalls(ctx, k, H, '#fff1d8', (W, left) => {
    const stone = left ? '#cbbcae' : '#e2d6c8';
    wallRect(ctx, W, 0, W.len, 0, 7, stone);
    for (let x = 2; x < W.len; x += 7) wallRect(ctx, W, x, x + 4, 2 + (x % 3), 4 + (x % 3), shade(stone, 16));
    wallRect(ctx, W, 0, 3, 0, H, left ? '#6f4634' : '#8a5a44');
    wallRect(ctx, W, W.len - 3, W.len, 0, H, left ? '#6f4634' : '#8a5a44');
    if (left) houseDoor(ctx, W, accent);
    const wins = left ? [6, W.len - 15] : [10, W.len - 20];
    for (const x of wins) drawWindow(ctx, W, x, 11, style, true);
  });
  // Straw roof with layered rows and a soft rounded eave.
  const straw = '#f2c86a';
  const r = hipRoof(ctx, k, H, 42, 0.2, (x, y, side, d) => {
    const row = Math.floor((d + 2) / 7);
    const md = ((d + 2) % 7 + 7) % 7;
    if (d < 2) return '#b07f30';
    let col = side === 'left' ? shade(straw, -18) : straw;
    if (md === 0) col = shade(col, -26);
    else if (md < 3) col = shade(col, 12);
    if ((x + row * 3 + Math.floor(hash(x, row, 31) * 3)) % 4 === 0) col = shade(col, -16);
    return col;
  });
  // Flowers tucked along the eaves and a ribbon at the top.
  for (const [P, Q] of [[r.L, r.B], [r.B, r.R]]) {
    for (let i = 1; i < 8; i++) {
      const x = Math.round(P.x + (Q.x - P.x) * i / 8);
      const y = Math.round(P.y + (Q.y - P.y) * i / 8) - 3;
      px(ctx, x - 1, y, 3, 1, i % 2 ? accent : '#ffffff');
      px(ctx, x, y - 1, 1, 3, i % 2 ? accent : '#ffffff');
      px(ctx, x, y, 1, 1, '#ffe066');
    }
  }
  px(ctx, r.A.x - 4, r.A.y + 2, 8, 4, accent);
  px(ctx, r.A.x - 4, r.A.y + 5, 8, 1, shade(accent, -40));
  px(ctx, r.A.x - 1, r.A.y - 3, 2, 5, '#b07f30');
}

// Bakery with a striped awning and a giant cupcake on the roof.
function drawBakery(ctx, k, style) {
  const H = 42;
  const accent = style.roof;
  const soft = mix(accent, '#ffffff', 0.55);
  houseShadow(ctx, k);
  const { WL } = boxWalls(ctx, k, H, '#fff4e4', (W, left) => {
    wallRect(ctx, W, 0, W.len, 0, 6, shade(accent, left ? -50 : -30));
    for (let x = 0; x < W.len; x += 6) wallRect(ctx, W, x, x + 1, 6, 24, left ? shade('#fff4e4', -36) : shade('#fff4e4', -14));
    wallRect(ctx, W, 0, W.len, H - 6, H, left ? shade(accent, -20) : accent);
    for (let x = 2; x < W.len; x += 6) wallRect(ctx, W, x, x + 3, H - 5, H - 3, '#ffffff');
    if (left) {
      houseDoor(ctx, W, shade(accent, -30));
      // Shop window full of bread.
      wallRect(ctx, W, 3, 14, 5, 21, '#f8f2ff');
      wallRect(ctx, W, 4, 13, 6, 20, '#bfe6ff');
      for (const [x, v, c] of [[5, 7, '#d08a4a'], [9, 7, '#e8a860'], [6, 13, '#ff9ec4'], [10, 13, '#d08a4a']]) {
        wallRect(ctx, W, x, x + 3, v, v + 3, c);
        wallRect(ctx, W, x, x + 3, v + 2, v + 3, '#ffffff');
      }
      drawWindow(ctx, W, W.len - 14, 10, style, true);
    } else {
      drawWindow(ctx, W, 8, 10, style);
      drawWindow(ctx, W, W.len - 18, 10, style);
    }
  });
  // Striped awning sloping out over the shop front.
  const out = { x: -6, y: 9 };
  for (let x = 0; x < WL.len; x += 4) {
    const a = wallPt(WL, x, 33);
    const b = wallPt(WL, x + 4, 33);
    const col = (x / 4) % 2 ? '#ffffff' : accent;
    fillPoly(ctx, [a, b, { x: b.x + out.x, y: b.y + out.y }, { x: a.x + out.x, y: a.y + out.y }], col);
    px(ctx, Math.round(a.x + out.x), Math.round(a.y + out.y), 4, 2, col);
    px(ctx, Math.round(a.x + out.x + 1), Math.round(a.y + out.y + 2), 2, 1, col);
  }
  // Flat roof with a rim.
  const up = p => ({ x: p.x, y: p.y - H });
  fillPoly(ctx, [up(k.T), up(k.R), up(k.B), up(k.L)], soft);
  fillPoly(ctx, [up(k.L), up(k.B), { x: k.B.x, y: k.B.y - H - 2 }, { x: k.L.x, y: k.L.y - H - 2 }], shade(accent, -10));
  fillPoly(ctx, [up(k.B), up(k.R), { x: k.R.x, y: k.R.y - H - 2 }, { x: k.B.x, y: k.B.y - H - 2 }], accent);
  // Cupcake.
  const m = houseMid(k);
  const cx = Math.round(m.x);
  const base = Math.round(m.y - H + 2);
  for (let i = 0; i < 18; i++) {
    const w = 10 + Math.floor(i / 3);
    const col = i % 4 < 2 ? '#ffffff' : soft;
    px(ctx, cx - w, base - i, w * 2, 1, col);
    px(ctx, cx - w, base - i, 2, 1, shade(soft, -30));
  }
  for (let x = -16; x < 16; x += 4) px(ctx, cx + x + 1, base - 17, 2, 16, shade(soft, -16));
  const frost = [[0, -24, 13], [-8, -20, 9], [8, -20, 9], [0, -32, 9], [0, -38, 5]];
  for (let y = -46; y < -14; y++) for (let x = -18; x < 18; x++) {
    const inside = frost.some(([bx, by, br]) => (x - bx) ** 2 + ((y - by) * 1.2) ** 2 <= br * br);
    if (!inside) continue;
    const l = -x * 0.5 - (y + 28) * 0.8;
    px(ctx, cx + x, base + y, 1, 1, l > 6 ? '#ffffff' : l < -8 ? '#ffb0d0' : '#ffd0e6');
  }
  for (const [x, y, c] of [[-6, -26, '#7fd4ff'], [5, -24, '#ffe066'], [-2, -33, '#9be88a'], [8, -30, '#c7a4ff'], [-9, -21, '#ffe066']]) px(ctx, cx + x, base + y, 2, 1, c);
  px(ctx, cx - 3, base - 50, 6, 6, '#ff4f6a');
  px(ctx, cx - 2, base - 49, 2, 2, '#ffb0b8');
  px(ctx, cx, base - 54, 1, 4, '#5fb35a');
}

// Round stone house with a tall pointed roof and a pennant.
function drawRoundHouse(ctx, k, style) {
  const R = 34;
  const H = 60;
  const accent = style.roof;
  const m = houseMid(k);
  const cx = Math.round(m.x);
  const cy = Math.round(m.y);
  houseShadow(ctx, k);
  roundBody(ctx, cx, cy, R, R - 4, H, (t, h) => {
    let col = roundShade('#fbefe6', t);
    if (h < 8) col = roundShade('#dccdc6', t);
    if (h % 8 === 0 && h > 0) col = shade(col, -14);
    if (h % 8 > 0 && Math.floor((t + 1) * 9 + (h >> 3)) % 2 === 0 && h % 8 === 4) col = shade(col, -10);
    if (h >= 34 && h < 38) col = roundShade(accent, t);
    return col;
  });
  houseDoor(ctx, roundDoorWall(cx, cy, R), shade(accent, -20));
  for (const [t, h] of [[0.25, 14], [0.4, 46], [-0.3, 46]]) {
    const p = roundPt(cx, cy, R - (R * h / H) * (4 / R), t, h);
    px(ctx, p.x - 5, p.y - 11, 10, 12, '#f8f2ff');
    px(ctx, p.x - 4, p.y - 10, 8, 10, '#8fd0ff');
    px(ctx, p.x - 3, p.y - 12, 6, 1, '#f8f2ff');
    px(ctx, p.x - 1, p.y - 10, 1, 10, '#f8f2ff');
    px(ctx, p.x - 3, p.y - 5, 2, 3, '#e6f7ff');
    px(ctx, p.x - 6, p.y + 1, 12, 2, '#a0603c');
    px(ctx, p.x - 5, p.y, 2, 1, '#ff7fb4');
    px(ctx, p.x + 2, p.y, 2, 1, '#ffe066');
  }
  const apex = coneRoof(ctx, cx, cy - H, R, 52, (t, d) => shingle(accent, t, d));
  // Little round dormer window on the roof.
  px(ctx, cx + 6, cy - H - 24, 9, 9, shade(accent, -50));
  px(ctx, cx + 7, cy - H - 23, 7, 7, '#fff2a8');
  px(ctx, cx + 10, cy - H - 23, 1, 7, shade(accent, -50));
  // Finial and pennant.
  px(ctx, cx - 1, apex - 4, 2, 5, '#ffd34d');
  px(ctx, cx, apex - 14, 1, 10, '#8a7a9a');
  for (let i = 0; i < 10; i++) px(ctx, cx + 1 + i, apex - 14 + Math.floor(i / 4), 1, 5 - Math.floor(i / 2.5), i % 3 === 2 ? '#ffffff' : mix(accent, '#ffffff', 0.4));
}

// White windmill with a coloured cap and four lattice sails.
function drawWindmill(ctx, k, style) {
  const R = 34;
  const H = 76;
  const accent = style.roof;
  const m = houseMid(k);
  const cx = Math.round(m.x);
  const cy = Math.round(m.y);
  houseShadow(ctx, k);
  roundBody(ctx, cx, cy, R, 21, H, (t, h) => {
    let col = roundShade('#fffaf2', t);
    if (h < 9) col = roundShade('#d8cabc', t);
    if (h < 9 && h % 3 === 0) col = shade(col, -18);
    if (h === 9 || h === H - 2) col = roundShade(accent, t);
    return col;
  });
  houseDoor(ctx, roundDoorWall(cx, cy, R), '#8b5a3c');
  for (const [t, h] of [[0.3, 22], [-0.1, 48]]) {
    const r = R + (21 - R) * h / H;
    const p = roundPt(cx, cy, r, t, h);
    px(ctx, p.x - 4, p.y - 9, 8, 10, '#8a5a44');
    px(ctx, p.x - 3, p.y - 8, 6, 8, '#8fd0ff');
    px(ctx, p.x - 3, p.y - 4, 6, 1, '#8a5a44');
  }
  const apex = coneRoof(ctx, cx, cy - H, 25, 24, (t, d) => shingle(accent, t, d));
  px(ctx, cx - 1, apex - 4, 2, 5, '#ffd34d');
  // Sails, turned a little so they read as a windmill and not a cross.
  const hub = { x: cx - 9, y: cy - H + 8 };
  for (let i = 0; i < 4; i++) {
    const a = 0.35 + i * Math.PI / 2;
    const d = { x: Math.cos(a), y: Math.sin(a) };
    const n = { x: -d.y, y: d.x };
    const pt = (s, w) => ({ x: hub.x + d.x * s + n.x * w, y: hub.y + d.y * s + n.y * w });
    fillPoly(ctx, [pt(14, 0), pt(46, 0), pt(46, 10), pt(14, 10)], '#fffaf2');
    for (let s = 14; s <= 46; s += 8) fillPoly(ctx, [pt(s, 0), pt(s + 1.2, 0), pt(s + 1.2, 10), pt(s, 10)], '#c8a080');
    fillPoly(ctx, [pt(14, 4.5), pt(46, 4.5), pt(46, 5.7), pt(14, 5.7)], '#c8a080');
    fillPoly(ctx, [pt(0, -1.5), pt(48, -1.5), pt(48, 1.5), pt(0, 1.5)], '#8a5a3c');
  }
  px(ctx, hub.x - 3, hub.y - 3, 6, 6, '#6f4634');
  px(ctx, hub.x - 1, hub.y - 1, 2, 2, '#ffd34d');
}

// A big spotted mushroom with a round door in its stem.
function drawMushroomCottage(ctx, k, style) {
  const R = 34;
  const H = 34;
  const cap = style.roof;
  const m = houseMid(k);
  const cx = Math.round(m.x);
  const cy = Math.round(m.y);
  houseShadow(ctx, k);
  roundBody(ctx, cx, cy, R, R - 3, H, (t, h) => {
    const col = roundShade('#fff6e6', t);
    return Math.floor((t + 1) * 12) % 3 === 0 ? shade(col, -8) : col;
  });
  houseDoor(ctx, roundDoorWall(cx, cy, R), '#a8704a', '#e8d8c0');
  const win = roundPt(cx, cy, R, 0.35, 16);
  px(ctx, win.x - 4, win.y - 10, 9, 9, '#8a5a3c');
  px(ctx, win.x - 3, win.y - 9, 7, 7, '#fff2a8');
  px(ctx, win.x, win.y - 9, 1, 7, '#8a5a3c');
  // Domed cap with white spots.
  const CR = 56;
  const top = cy - H - 44;
  for (let dx = -CR; dx < CR; dx++) {
    const t = (dx + 0.5) / CR;
    const dome = Math.sqrt(Math.max(0, 1 - t * t));
    const y0 = Math.round(cy - H - dome * 42 + 4);
    const y1 = Math.round(cy - H + dome * 12 + 6);
    for (let y = y0; y < y1; y++) {
      let col = cap;
      if (t < -0.45) col = shade(cap, -35);
      else if (t < -0.1) col = shade(cap, -14);
      if (y < y0 + 5 && t > -0.3 && t < 0.35) col = shade(cap, 30);
      const sx = Math.floor((dx + 60) / 11);
      const sy = Math.floor((y - top) / 10);
      const mx = (dx + 60) % 11;
      const my = (y - top) % 10;
      if (hash(sx, sy, 43) < 0.4 && mx > 2 && mx < 9 && my > 2 && my < 8 && !((mx === 3 || mx === 8) && (my === 3 || my === 7))) col = '#ffffff';
      if (y >= y1 - 2) col = shade(cap, -60);
      px(ctx, cx + dx, y, 1, 1, col);
    }
  }
  // Tiny chimney poking through the cap.
  px(ctx, cx + 20, cy - H - 40, 6, 10, '#c07a5a');
  px(ctx, cx + 19, cy - H - 42, 8, 3, '#8a4f3c');
}

// Two-storey town house: brick below, siding above, a balcony over the door.
function drawManor(ctx, k, style) {
  const H = 64;
  const accent = style.roof;
  const brick = mix(accent, '#fff4ee', 0.72);
  houseShadow(ctx, k);
  const { WL } = boxWalls(ctx, k, H, '#fffaf2', (W, left) => {
    const b = left ? shade(brick, -22) : brick;
    wallRect(ctx, W, 0, W.len, 0, 30, b);
    for (let v = 4; v < 30; v += 4) {
      wallRect(ctx, W, 0, W.len, v, v + 1, shade(b, -18));
      for (let x = (v / 4 % 2) * 4; x < W.len; x += 8) wallRect(ctx, W, x, x + 1, v - 3, v, shade(b, -18));
    }
    for (let v = 36; v < H; v += 4) wallRect(ctx, W, 0, W.len, v, v + 1, left ? '#d8ccc4' : '#ece2da');
    wallRect(ctx, W, 0, W.len, 30, 33, '#ffffff');
    wallRect(ctx, W, 0, W.len, 33, 34, '#d8ccc4');
    wallRect(ctx, W, 0, 3, 0, H, '#ffffff');
    wallRect(ctx, W, W.len - 3, W.len, 0, H, '#ffffff');
    if (left) {
      houseDoor(ctx, W, shade(accent, -20), '#ffffff');
      drawWindow(ctx, W, 6, 9, style, true);
      drawWindow(ctx, W, W.len - 14, 9, style, true);
      // Balcony door and railing above the front door.
      const mid = W.len / 2;
      wallArch(ctx, W, mid - 6, mid + 6, 34, 54, '#ffffff');
      wallArch(ctx, W, mid - 5, mid + 5, 34, 53, '#8fd0ff');
      wallRect(ctx, W, mid - 1, mid, 34, 52, '#ffffff');
      drawWindow(ctx, W, 6, 41, style);
      drawWindow(ctx, W, W.len - 15, 41, style);
    } else {
      drawWindow(ctx, W, 8, 9, style);
      drawWindow(ctx, W, W.len - 18, 9, style);
      drawWindow(ctx, W, 8, 41, style);
      drawWindow(ctx, W, W.len - 18, 41, style);
    }
  });
  // Balcony floor sticking out of the left wall.
  const mid = WL.len / 2;
  const o = { x: -5, y: 2.5 };
  const a = wallPt(WL, mid - 11, 33);
  const b = wallPt(WL, mid + 11, 33);
  fillPoly(ctx, [a, b, { x: b.x + o.x, y: b.y + o.y }, { x: a.x + o.x, y: a.y + o.y }], '#e8dcd4');
  fillPoly(ctx, [{ x: a.x + o.x, y: a.y + o.y }, { x: b.x + o.x, y: b.y + o.y }, { x: b.x + o.x, y: b.y + o.y + 2 }, { x: a.x + o.x, y: a.y + o.y + 2 }], '#c8b8b0');
  for (let x = mid - 11; x <= mid + 11; x += 3) {
    const p = wallPt(WL, x, 33);
    px(ctx, Math.round(p.x + o.x), Math.round(p.y + o.y - 7), 1, 7, '#ffffff');
  }
  fillPoly(ctx, [{ x: a.x + o.x, y: a.y + o.y - 8 }, { x: b.x + o.x, y: b.y + o.y - 8 }, { x: b.x + o.x, y: b.y + o.y - 6 }, { x: a.x + o.x, y: a.y + o.y - 6 }], '#ffffff');
  const r = hipRoof(ctx, k, H, 34, 0.1, (x, y, side, d) => {
    const row = Math.floor(d / 5);
    let col = side === 'left' ? shade(accent, -26) : accent;
    if (d < 2) return shade(accent, -60);
    if (((d % 5) + 5) % 5 < 1) col = shade(col, -24);
    if (((x + row * 3) % 6 + 6) % 6 === 0) col = shade(col, -16);
    return col;
  });
  for (const f of [0.3, 0.72]) {
    const cx = Math.round(r.L.x + (r.R.x - r.L.x) * f);
    const cy = Math.round(r.A.y + 26);
    px(ctx, cx, cy - 12, 7, 14, '#c07a5a');
    px(ctx, cx + 4, cy - 12, 3, 14, '#a0604a');
    px(ctx, cx - 1, cy - 14, 9, 3, '#8a4f3c');
  }
}

// ---- Unicorn homes -------------------------------------------------------

// A fluffy cloud you can live in, with a rainbow doorway and a turret.
function drawCloudHouse(ctx, k, style) {
  const m = houseMid(k);
  const cx = Math.round(m.x);
  const cy = Math.round(m.y);
  ctx.fillStyle = 'rgba(80,60,140,0.14)';
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy + 4, 46, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  const blobs = [[0, -18, 28], [-24, -6, 20], [24, -8, 20], [-14, -34, 20], [14, -36, 19], [0, -48, 16], [-34, 2, 13], [34, 0, 13], [-18, 8, 14], [12, 8, 15]];
  const inside = (x, y) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 <= br * br);
  for (let y = -66; y < 26; y++) for (let x = -50; x < 50; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5);
    const l = -x * 0.4 - y * 0.6;
    let col = l > 22 ? '#ffffff' : l > -6 ? '#f6f4ff' : '#e4e0fa';
    if (edge) col = '#b8b0e0';
    else if (hash(x, y, 51) < 0.015) col = '#ffd0f0';
    px(ctx, cx + x, cy + y, 1, 1, col);
  }
  // Rainbow doorway.
  const W = roundDoorWall(cx, cy, 34);
  const mid = W.len / 2;
  RAINBOW.forEach((c, i) => wallArch(ctx, W, mid - 11 + i, mid + 11 - i, 0, 27 - i, c));
  wallArch(ctx, W, mid - 5, mid + 5, 0, 20, '#fff6fb');
  wallArch(ctx, W, mid - 4, mid + 4, 0, 18, '#ffc0dc');
  wallRect(ctx, W, mid + 1, mid + 3, 8, 10, '#ffd34d');
  // Round windows.
  for (const [x, y] of [[12, -22], [-6, -40], [26, -12]]) {
    ctx.fillStyle = '#c8b8f0';
    ctx.beginPath(); ctx.arc(cx + x, cy + y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bfe6ff';
    ctx.beginPath(); ctx.arc(cx + x, cy + y, 4, 0, Math.PI * 2); ctx.fill();
    px(ctx, cx + x - 2, cy + y - 2, 2, 2, '#ffffff');
  }
  // Turret on top.
  const tx = cx + 8;
  const ty = cy - 52;
  roundBody(ctx, tx, ty, 9, 8, 16, t => roundShade('#fff0f8', t));
  px(ctx, tx - 2, ty - 10, 4, 6, '#fff2a8');
  const apex = coneRoof(ctx, tx, ty - 16, 11, 20, (t, d) => shingle(style.roof, t, d));
  px(ctx, tx, apex - 9, 1, 9, '#8a7a9a');
  for (let i = 0; i < 6; i++) px(ctx, tx + 1 + i, apex - 9 + (i >> 1), 1, 4 - (i >> 1), '#ff6fa8');
}

// Barn for the unicorns with a rainbow roof and a big X door.
function drawRainbowStable(ctx, k, style) {
  const H = 36;
  const accent = style.roof;
  houseShadow(ctx, k);
  boxWalls(ctx, k, H, '#fff6ee', (W, left) => {
    for (let x = 4; x < W.len; x += 5) wallRect(ctx, W, x, x + 1, 0, H, left ? '#d8c8c0' : '#ecdcd4');
    wallRect(ctx, W, 0, W.len, 0, 4, left ? '#b8a8a0' : '#d0c0b8');
    wallRect(ctx, W, 0, 3, 0, H, shade(accent, left ? -30 : 0));
    wallRect(ctx, W, W.len - 3, W.len, 0, H, shade(accent, left ? -30 : 0));
    wallRect(ctx, W, 0, W.len, H - 3, H, shade(accent, left ? -30 : 0));
    const mid = W.len / 2;
    if (left) {
      wallRect(ctx, W, mid - 12, mid + 12, 0, 26, '#ffffff');
      wallRect(ctx, W, mid - 10, mid + 10, 0, 24, shade(accent, -10));
      for (let i = 0; i < 20; i++) {
        wallRect(ctx, W, mid - 10 + i, mid - 9 + i, i * 1.2, i * 1.2 + 2, '#ffffff');
        wallRect(ctx, W, mid - 10 + i, mid - 9 + i, 22 - i * 1.2, 24 - i * 1.2, '#ffffff');
      }
      wallRect(ctx, W, mid - 1, mid + 1, 0, 24, '#ffffff');
      // Horseshoe for luck.
      wallRect(ctx, W, mid - 3, mid + 3, 29, 30, '#ffd34d');
      wallRect(ctx, W, mid - 3, mid - 2, 29, 33, '#ffd34d');
      wallRect(ctx, W, mid + 2, mid + 3, 29, 33, '#ffd34d');
    } else {
      // Hay loft window with hay peeking out.
      wallRect(ctx, W, mid - 8, mid + 8, 12, 28, '#ffffff');
      wallRect(ctx, W, mid - 6, mid + 6, 14, 26, '#8a5a44');
      wallRect(ctx, W, mid - 6, mid + 6, 14, 19, '#ffe066');
      for (let x = mid - 6; x < mid + 6; x += 2) wallRect(ctx, W, x, x + 1, 17, 21, '#f2c86a');
    }
  });
  hipRoof(ctx, k, H, 34, 0.14, (x, y, side, d) => {
    if (d < 2) return '#9a88c8';
    const col = RAINBOW[Math.floor(d / 6) % RAINBOW.length];
    const c2 = side === 'left' ? shade(col, -22) : col;
    return d % 6 === 0 ? shade(c2, -20) : c2;
  });
  // Hay bales beside the door.
  const W = wall(k.L, k.B);
  for (const [x, v] of [[6, 0], [10, 0], [8, 6]]) {
    const p = wallPt(W, x, v);
    const q = { x: Math.round(p.x - 6), y: Math.round(p.y + 2) };
    px(ctx, q.x - 5, q.y - 6, 10, 7, '#f2c86a');
    px(ctx, q.x - 5, q.y - 6, 10, 1, '#ffe39a');
    px(ctx, q.x - 5, q.y - 3, 10, 1, '#c89a40');
    px(ctx, q.x - 5, q.y - 6, 1, 7, '#c89a40');
  }
}

// One gem crystal: a prism with two lit faces and a pointed top.
// (x, y) is the bottom of its front edge; w is the half width.
function drawHutCrystal(ctx, x, y, w, h, color) {
  const tip = { x, y: y - h - w };
  const fl = { x, y: y + w / 2 };
  fillPoly(ctx, [{ x: x - w, y }, fl, { x, y: fl.y - h }, { x: x - w, y: y - h }], shade(color, -18));
  fillPoly(ctx, [fl, { x: x + w, y }, { x: x + w, y: y - h }, { x, y: fl.y - h }], mix(color, '#ffffff', 0.25));
  fillPoly(ctx, [{ x: x - w, y: y - h }, { x, y: fl.y - h }, tip], mix(color, '#ffffff', 0.15));
  fillPoly(ctx, [{ x, y: fl.y - h }, { x: x + w, y: y - h }, tip], mix(color, '#ffffff', 0.55));
  // Edge highlights.
  px(ctx, x, Math.round(fl.y - h), 1, Math.round(h), '#ffffff');
  px(ctx, Math.round(x + w * 0.5), Math.round(y - h * 0.8), 1, Math.round(h * 0.5), mix(color, '#ffffff', 0.7));
}
// A hut grown from big pastel crystals.
function drawCrystalHut(ctx, k, style) {
  const m = houseMid(k);
  const cx = Math.round(m.x);
  const cy = Math.round(m.y);
  ctx.fillStyle = 'rgba(80,60,140,0.16)';
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy + 4, 44, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  const tint = style.roof;
  const set = [
    [cx + 2, cy - 14, 13, 64, '#c8a8ff'],
    [cx - 22, cy - 6, 11, 40, '#ffb0e0'],
    [cx + 22, cy - 6, 14, 54, tint],
    [cx - 13, cy + 7, 20, 34, '#c8a8ff'],
    [cx + 30, cy + 10, 9, 22, '#ffb0e0'],
    [cx + 12, cy + 14, 8, 16, tint],
    [cx - 38, cy + 8, 7, 16, tint],
  ];
  for (const [x, y, w, h, c] of set) drawHutCrystal(ctx, x, y, w, h, c);
  // Door on the front crystal's left face.
  const W = wall({ x: cx - 33, y: cy + 7 }, { x: cx - 13, y: cy + 17 });
  const mid = W.len / 2;
  wallArch(ctx, W, mid - 7, mid + 7, 0, 22, '#ffffff');
  wallArch(ctx, W, mid - 5, mid + 5, 0, 20, '#8a6ad8');
  wallRect(ctx, W, mid + 1, mid + 3, 8, 10, '#ffd34d');
  // Sparkles.
  for (const [x, y] of [[-6, -70], [24, -60], [-26, -34], [36, -16]]) {
    px(ctx, cx + x - 2, cy + y, 5, 1, '#ffffff');
    px(ctx, cx + x, cy + y - 2, 1, 5, '#ffffff');
  }
}

// Gingerbread cottage with pink frosting dripping off the roof.
function drawCandyCottage(ctx, k, style) {
  const H = 34;
  const accent = style.roof;
  houseShadow(ctx, k);
  const { WL } = boxWalls(ctx, k, H, '#d89a64', (W, left) => {
    for (let x = 0; x < W.len; x += 3) for (let v = 1; v < H; v += 5) if (hash(x, v, left ? 61 : 62) < 0.12) wallRect(ctx, W, x, x + 1, v, v + 1, shade('#d89a64', -40));
    // Icing bands with candy buttons.
    for (const v of [0, H - 5]) {
      wallRect(ctx, W, 0, W.len, v, v + 4, '#ffffff');
      for (let x = 0; x < W.len; x += 4) wallRect(ctx, W, x + 1, x + 3, v - 1, v, '#ffffff');
    }
    for (let x = 5; x < W.len; x += 8) wallRect(ctx, W, x, x + 2, H - 4, H - 2, ['#ff6f8a', '#7fd4ff', '#9be88a', '#ffe066'][(x >> 3) % 4]);
    wallRect(ctx, W, 0, 3, 0, H, '#ff9ec4');
    wallRect(ctx, W, W.len - 3, W.len, 0, H, '#ff9ec4');
    for (let v = 0; v < H; v += 4) {
      wallRect(ctx, W, 0, 3, v, v + 2, '#ffffff');
      wallRect(ctx, W, W.len - 3, W.len, v, v + 2, '#ffffff');
    }
    // Peppermint windows.
    const mints = left ? [8, W.len - 12] : [12, W.len - 16];
    for (const x of mints) {
      wallRect(ctx, W, x - 5, x + 5, 10, 20, '#ffffff');
      wallRect(ctx, W, x - 4, x + 4, 11, 19, '#bfe6ff');
      wallRect(ctx, W, x - 4, x + 4, 14, 16, '#ff6f8a');
      wallRect(ctx, W, x - 1, x + 1, 11, 19, '#ff6f8a');
    }
    if (left) houseDoor(ctx, W, '#ff8fc0', '#ffffff');
  });
  const frost = mix(accent, '#ffb0d0', 0.5);
  const r = hipRoof(ctx, k, H, 34, 0.16, (x, y, side, d) => {
    if (hash(x, y, 63) < 0.05) return ['#ffffff', '#7fd4ff', '#ffe066', '#9be88a'][Math.floor(hash(x, y, 64) * 4)];
    const col = side === 'left' ? shade(frost, -20) : frost;
    return d % 7 < 1 ? shade(col, -10) : col;
  });
  // Drips along the eaves.
  for (const [P, Q] of [[r.L, r.B], [r.B, r.R]]) {
    for (let x = Math.ceil(P.x); x < Q.x; x++) {
      const y = Math.round(P.y + (Q.y - P.y) * (x - P.x) / (Q.x - P.x));
      const len = 2 + Math.floor(hash(x, 7, 65) * 3) + (x % 7 === 0 ? 4 : 0);
      px(ctx, x, y - 1, 1, len, '#ffffff');
    }
  }
  // Cherry on top and lollipops by the door.
  px(ctx, r.A.x - 3, r.A.y - 4, 6, 6, '#ff4f6a');
  px(ctx, r.A.x - 2, r.A.y - 3, 2, 2, '#ffb0b8');
  px(ctx, r.A.x, r.A.y - 8, 1, 4, '#5fb35a');
  for (const x of [WL.len / 2 - 15, WL.len / 2 + 14]) {
    const p = wallPt(WL, x, 0);
    const q = { x: Math.round(p.x - 4), y: Math.round(p.y + 3) };
    px(ctx, q.x, q.y - 18, 1, 18, '#ffffff');
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(q.x + 0.5, q.y - 21, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = x < WL.len / 2 ? '#ff6f8a' : '#7fd4ff';
    ctx.beginPath(); ctx.arc(q.x + 0.5, q.y - 21, 4, 0, Math.PI * 2); ctx.fill();
    px(ctx, q.x - 1, q.y - 23, 2, 2, '#ffffff');
  }
}

// Five-pointed star filled pixel by pixel. (cx, cy) is its centre.
function drawStar(ctx, cx, cy, R, color, edge) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? R * 0.45 : R;
    pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
  }
  const inside = (x, y) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i];
      const b = pts[j];
      if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c;
    }
    return c;
  };
  for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    const e = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5);
    px(ctx, x, y, 1, 1, e ? edge : (x - cx) + (y - cy) < -2 ? mix(color, '#ffffff', 0.5) : color);
  }
}
// Tall lavender tower for stargazing, with a night-blue roof and a gold star.
function drawStarTower(ctx, k, style) {
  const R = 30;
  const H = 72;
  const m = houseMid(k);
  const cx = Math.round(m.x);
  const cy = Math.round(m.y);
  houseShadow(ctx, k);
  const wallC = mix(style.roof, '#ffffff', 0.55);
  roundBody(ctx, cx, cy, R, 26, H, (t, h) => {
    let col = roundShade(wallC, t);
    if (h < 6) col = roundShade('#b8a8d8', t);
    if (h === 30 || h === 31 || h === H - 3 || h === H - 2) col = roundShade('#ffd34d', t);
    if (hash(Math.floor((t + 1) * 10), h >> 2, 71) < 0.05 && h > 6) col = '#ffffff';
    return col;
  });
  const W = roundDoorWall(cx, cy, R);
  houseDoor(ctx, W, '#6a5ac8', '#ffffff');
  for (const [t, h] of [[0.3, 20], [-0.1, 50], [0.45, 52]]) {
    const p = roundPt(cx, cy, R - 4 * h / H, t, h);
    px(ctx, p.x - 4, p.y - 11, 8, 12, '#ffffff');
    px(ctx, p.x - 3, p.y - 10, 6, 10, '#fff2a8');
    px(ctx, p.x - 2, p.y - 12, 4, 1, '#ffffff');
  }
  const night = '#5a62c8';
  const apex = coneRoof(ctx, cx, cy - H, R + 2, 56, (t, d, x, y) => {
    if (hash(x, y, 72) < 0.04) return '#ffe680';
    return shingle(night, t, d);
  });
  px(ctx, cx, apex - 6, 1, 7, '#ffd34d');
  drawStar(ctx, cx, apex - 12, 9, '#ffd34d', '#d89a20');
}

// Arch of flowers over a path. (a) and (b) are the ground centres of its feet.
function drawFlowerArch(ctx, a, b, H = 46) {
  const cols = ['#ff9ec4', '#ffffff', '#ffe066', '#c7a4ff', '#8fd3ff'];
  for (const p of [a, b]) {
    ctx.fillStyle = 'rgba(40,30,70,0.16)';
    ctx.beginPath();
    ctx.ellipse(p.x + 2, p.y + 1, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    px(ctx, Math.round(p.x) - 2, Math.round(p.y) - H, 4, H, '#ffffff');
    px(ctx, Math.round(p.x) + 1, Math.round(p.y) - H, 1, H, '#e0d0e8');
  }
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const x = a.x + (b.x - a.x) * s;
    const y = a.y + (b.y - a.y) * s - H - Math.sin(s * Math.PI) * 14;
    px(ctx, Math.round(x) - 1, Math.round(y) - 1, 3, 3, i % 3 ? '#5fc46a' : '#3f9f58');
  }
  // Vines up the posts and flowers along the arch.
  for (const p of [a, b]) for (let v = 4; v < H; v += 5) {
    px(ctx, Math.round(p.x) + (v % 10 ? -3 : 1), Math.round(p.y) - v, 3, 2, '#5fc46a');
    if (v % 15 === 4) px(ctx, Math.round(p.x) - 1, Math.round(p.y) - v - 1, 2, 2, cols[v % cols.length]);
  }
  for (let i = 0; i <= 14; i++) {
    const s = i / 14;
    const x = Math.round(a.x + (b.x - a.x) * s + (hash(i, 1, 73) - 0.5) * 3);
    const y = Math.round(a.y + (b.y - a.y) * s - H - Math.sin(s * Math.PI) * 14 + (hash(i, 2, 73) - 0.5) * 4);
    const c = cols[i % cols.length];
    px(ctx, x - 1, y, 3, 1, c);
    px(ctx, x, y - 1, 1, 3, c);
    px(ctx, x, y, 1, 1, '#ffd34d');
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

// ---- Castle stairs and the floor upstairs --------------------------------

// A box between heights v0 and v1 above the ground (negative goes below).
function drawSlab(ctx, k, v0, v1, side, top, front) {
  const WL = wall(k.L, k.B);
  const WR = wall(k.B, k.R);
  wallRect(ctx, WL, 0, WL.len, v0, v1, front);
  wallRect(ctx, WR, 0, WR.len, v0, v1, side);
  const up = p => ({ x: p.x, y: p.y - v1 });
  fillPoly(ctx, [up(k.T), up(k.R), up(k.B), up(k.L)], top);
  return { WL, WR };
}

// One-pixel line, for rails.
function pxLine(ctx, a, b, color, thick = 1) {
  const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
  for (let i = 0; i <= n; i++) px(ctx, Math.round(a.x + (b.x - a.x) * i / n), Math.round(a.y + (b.y - a.y) * i / n), 1, thick, color);
}

// Gold banister post on a stair corner, standing `v` above the ground.
function stairPost(ctx, p, v) {
  px(ctx, Math.round(p.x) - 1, Math.round(p.y - v) - 12, 2, 12, '#e0a83a');
  px(ctx, Math.round(p.x) - 2, Math.round(p.y - v) - 14, 4, 3, CASTLE.gold);
}

// A carpeted stone staircase in a w x d footprint rising towards the back
// wall (r0), with gold banisters and an arched doorway at the top.
function drawCastleStairs(ctx, sc, c0, r0, w, d, n = 6) {
  const rise = 8;
  const k = boxCorners(sc, c0, r0, w, d);
  const back = wall(k.T, k.R);
  const top = n * rise;
  wallArch(ctx, back, 3, back.len - 3, top - 2, top + 42, CASTLE.gold);
  wallArch(ctx, back, 5, back.len - 5, top, top + 40, '#6a4a7a');
  wallArch(ctx, back, 9, back.len - 9, top, top + 34, '#8a68a0');
  // Steps from the top one down, so each lower step covers the foot of the
  // one behind it.
  const s = d / n;
  const posts = [];
  for (let i = n - 1; i >= 0; i--) {
    const H = (i + 1) * rise;
    const ks = boxCorners(sc, c0, r0 + d - (i + 1) * s, w, s);
    const { WL } = drawSlab(ctx, ks, 0, H, '#e8d4e4', '#fbf0f6', '#d8c0d4');
    wallRect(ctx, WL, 0, WL.len, H - 1, H, '#c8a8c0');
    // Red runner up the middle of the tread and the riser.
    const kr = boxCorners(sc, c0 + w * 0.22, r0 + d - (i + 1) * s, w * 0.56, s);
    const up = p => ({ x: p.x, y: p.y - H });
    fillPoly(ctx, [up(kr.T), up(kr.R), up(kr.B), up(kr.L)], '#e8507a');
    const RL = wall(kr.L, kr.B);
    wallRect(ctx, RL, 0, RL.len, H - rise, H, '#c83a64');
    wallRect(ctx, RL, 0, 1, H - rise, H, CASTLE.gold);
    wallRect(ctx, RL, RL.len - 1, RL.len, H - rise, H, CASTLE.gold);
    posts.push({ L: ks.L, B: ks.B, H });
  }
  // Banisters on both sides.
  for (const side of ['L', 'B']) {
    for (const p of posts) stairPost(ctx, p[side], p.H);
    const lo = posts[posts.length - 1];
    const hi = posts[0];
    const a = { x: lo[side].x, y: lo[side].y - lo.H - 13 };
    const b = { x: hi[side].x, y: hi[side].y - hi.H - 13 };
    pxLine(ctx, a, b, CASTLE.gold, 2);
  }
}

// The top of the stairs on the floor above: a hole in the floor with steps
// going down towards the front (+r), and gold rails along its sides.
function drawStairwell(ctx, sc, c0, r0, w, d, n = 6) {
  const rise = 5;
  const deep = n * rise + 12;
  const k = boxCorners(sc, c0, r0, w, d);
  ctx.save();
  ctx.beginPath();
  for (const p of [k.T, k.R, k.B, k.L]) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.clip();
  fillPoly(ctx, [k.T, k.R, k.B, k.L], '#3a2a48');
  wallRect(ctx, wall(k.T, k.R), 0, k.R.x - k.T.x, -deep, 0, '#d8c0d4');
  wallRect(ctx, wall(k.L, k.T), 0, k.T.x - k.L.x, -deep, 0, '#b89cb4');
  const s = d / n;
  for (let i = 0; i < n; i++) {
    const H = -(i + 1) * rise;
    const ks = boxCorners(sc, c0, r0 + i * s, w, s);
    const { WL } = drawSlab(ctx, ks, -deep, H, '#e8d4e4', mix('#fbf0f6', '#3a2a48', i / n * 0.6), mix('#d8c0d4', '#3a2a48', i / n * 0.6));
    const kr = boxCorners(sc, c0 + w * 0.22, r0 + i * s, w * 0.56, s);
    const up = p => ({ x: p.x, y: p.y - H });
    fillPoly(ctx, [up(kr.T), up(kr.R), up(kr.B), up(kr.L)], mix('#e8507a', '#3a2a48', i / n * 0.6));
    wallRect(ctx, WL, 0, WL.len, H - 1, H, '#a888a0');
  }
  ctx.restore();
  // Stone rim and gold rails along the two sides; the back stays open.
  pxLine(ctx, k.T, k.R, '#c8a8c0');
  for (const [a, b] of [[k.T, k.L], [k.R, k.B]]) {
    pxLine(ctx, a, b, '#c8a8c0', 2);
    for (let i = 0; i <= 3; i++) {
      const p = { x: a.x + (b.x - a.x) * i / 3, y: a.y + (b.y - a.y) * i / 3 };
      stairPost(ctx, p, 0);
    }
    pxLine(ctx, { x: a.x, y: a.y - 13 }, { x: b.x, y: b.y - 13 }, CASTLE.gold, 2);
  }
}

// Tall bookcase against the back-left wall (faces +c), d tiles long.
function drawBookcase(ctx, sc, c, r, d) {
  const k = boxCorners(sc, c, r, 0.45, d);
  const { WR } = drawFurnitureBox(ctx, k, 60, '#9a6440', '#c8905a', '#7a4a30');
  wallRect(ctx, WR, 0, WR.len, 0, 3, '#6f4430');
  for (let v = 5; v < 56; v += 12) {
    wallRect(ctx, WR, 1, WR.len - 1, v, v + 1, '#6f4430');
    for (let x = 2; x < WR.len - 2; x += 2) {
      const h = 7 + Math.floor(hash(x, v, c * 7 + r) * 4);
      wallRect(ctx, WR, x, x + 2, v + 1, v + 1 + h, ['#ff7fb4', '#6fa8ff', '#ffd34d', '#5fc46a', '#b98cff', '#ff8f5a'][Math.floor(hash(x, v, 11) * 6)]);
      if (hash(x, v, 12) < 0.3) x += 1;
    }
  }
}

// Golden harp: a column, a curved neck, a slanted soundbox and strings.
function drawHarp(ctx, sc, c, r) {
  const m = tileCenter(sc, c, r);
  const x = Math.round(m.x);
  const y = Math.round(m.y);
  px(ctx, x - 7, y - 3, 14, 4, '#e0a83a');
  px(ctx, x - 7, y - 4, 14, 1, CASTLE.gold);
  const neck = xx => y - 32 + Math.round((xx + 6) * 0.55 - Math.sin((xx + 6) / 12 * Math.PI) * 3);
  const box = xx => y - 4 - Math.round((xx + 4) * 2.1);
  for (let xx = -3; xx <= 5; xx += 2) pxLine(ctx, { x: x + xx, y: neck(xx) + 1 }, { x: x + xx, y: box(xx) - 1 }, '#fff4fa');
  for (let xx = -6; xx <= 6; xx++) px(ctx, x + xx, neck(xx) - 1, 1, 3, CASTLE.gold);
  for (let xx = -4; xx <= 6; xx++) px(ctx, x + xx, box(xx) - 1, 2, 3, '#ff8fc0');
  px(ctx, x - 7, y - 32, 3, 29, CASTLE.gold);
  px(ctx, x - 7, y - 32, 1, 29, '#e0a83a');
  px(ctx, x - 8, y - 35, 5, 3, '#ff6fa8');
}

// Treasure chest with its lid open, spilling gold and jewels.
function drawTreasureChest(ctx, sc, c, r) {
  // The open lid stands up behind the box.
  const lid = boxCorners(sc, c + 0.12, r + 0.12, 0.76, 0.13);
  const L = drawSlab(ctx, lid, 12, 22, '#8a5a3c', '#a8704a', '#a8704a');
  wallRect(ctx, L.WL, 0, L.WL.len, 20, 22, CASTLE.gold);
  const k = boxCorners(sc, c + 0.12, r + 0.25, 0.76, 0.55);
  const { WL, WR } = drawFurnitureBox(ctx, k, 12, '#a8704a', '#ffd34d', '#8a5a3c');
  for (const W of [WL, WR]) {
    wallRect(ctx, W, 0, W.len, 0, 2, CASTLE.gold);
    wallRect(ctx, W, 0, W.len, 10, 12, CASTLE.gold);
    wallRect(ctx, W, 1, 3, 0, 12, CASTLE.gold);
    wallRect(ctx, W, W.len - 3, W.len - 1, 0, 12, CASTLE.gold);
  }
  wallRect(ctx, WL, WL.len / 2 - 2, WL.len / 2 + 2, 5, 9, '#e0a83a');
  const m = tileCenter(sc, c + 0.1, r + 0.1);
  for (const [dx, dy, col] of [[-5, -14, '#ffd34d'], [-1, -16, '#fff07a'], [3, -14, '#ffd34d'], [0, -13, '#ff6fa8'], [-4, -12, '#6fd0ff'], [5, -12, '#ffd34d']]) {
    px(ctx, m.x + dx, m.y + dy, 3, 2, col);
  }
}

// A little heap of gold coins on the floor.
function drawCoinPile(ctx, sc, c, r) {
  const m = tileCenter(sc, c, r);
  for (let i = 0; i < 26; i++) {
    const a = hash(i, c, r) * Math.PI * 2;
    const d = Math.sqrt(hash(i, r, c + 3)) * 9;
    const x = Math.round(m.x + Math.cos(a) * d);
    const y = Math.round(m.y + 1 + Math.sin(a) * d * 0.5 - (9 - d) * 0.6);
    px(ctx, x - 2, y, 4, 2, '#e0a83a');
    px(ctx, x - 1, y, 2, 1, i % 5 === 0 ? '#ffffff' : '#fff07a');
  }
  px(ctx, Math.round(m.x) - 1, Math.round(m.y) - 8, 3, 3, '#ff6fa8');
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

const WING = [
  '.ww..',
  'wWWw.',
  'wWsWw',
  'wWWWw',
  '.wWWw',
  '..www',
  '.wWw.',
  'wWsw.',
  '.ww..',
];

const princessCache = new Map();

// Returns { canvas, ax, ay } for an outfit and walk frame.
function princessSprite(outfit, frame) {
  const key = `${outfit.dress}|${outfit.shape}|${outfit.head}|${outfit.hand}|${outfit.hair}|${outfit.back}|${frame}`;
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
  // Wings or a cape go behind everything else.
  if (outfit.back === 'wings') {
    const wp = { w: '#6fb4e8', W: '#e8f8ff', s: '#fff6a8' };
    drawBitmap(ctx, WING, wp, 0, OYp + 10);
    drawBitmap(ctx, WING, wp, W - WING[0].length, OYp + 10, true);
  } else if (outfit.back === 'cape') {
    for (let y = 12; y < 28; y++) {
      const spread = Math.min(3, Math.floor((y - 12) / 4));
      const x0 = OXp + 2 - spread;
      const x1 = OXp + 16 + spread;
      px(ctx, x0, OYp + y, x1 - x0, 1, y === 27 ? '#2e2466' : '#4a3a9a');
      px(ctx, x0, OYp + y, 1, 1, '#2e2466');
      px(ctx, x1 - 1, OYp + y, 1, 1, '#2e2466');
      if ((y * 7) % 5 === 0) px(ctx, x0 + 1 + (y % 3), OYp + y, 1, 1, '#ffd34d');
      if ((y * 3) % 7 === 0) px(ctx, x1 - 3, OYp + y, 1, 1, '#ffd34d');
    }
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

// ---- Boy hero ------------------------------------------------------------

// Same grid as the princess (18 wide, head on the same rows) so the rider
// and every portrait line up. Short hair, a tunic top and a belt.
const BOY_TOP = [
  '......oooooo......',
  '....oohhhhhhoo....',
  '...ohhhHHhhhhho...',
  '..ohhHHhhhhhhhho..',
  '..ohHhhhhhhhhhho..',
  '..ohhsshhhhsshho..',
  '...ohsssssssssho..',
  '...ohsskssskssho..',
  '...ohsskssskssho..',
  '....ospssssspso...',
  '....ossssmsssso...',
  '.....ossssssso....',
  '......oossoo......',
  '...oLdddttdddDo...',
  '..oLLdddttdddDDo..',
  '..oLodddddddDoDo..',
  '..osodddddddDoso..',
  '...oobbbyybbboo...',
];
// Below the belt, by shape: n trousers, f boots, w and k ermine trim.
const BOY_BOTTOMS = {
  tunic: [
    '....oddddddddo....',
    '...oLddddddddDo...',
    '...oLdddddddDDo...',
    '...otttttttttto...',
    '.....onnoonno.....',
    '.....onnoonno.....',
    '.....onnoonno.....',
    '.....offooffo.....',
    '.....offooffo.....',
    '.....oooooooo.....',
  ],
  coat: [
    '....odddttdddo....',
    '...oLdddttddDDo...',
    '..oLddddttdddDDo..',
    '..oLddddttdddDDo..',
    '..otttttootttttto.',
    '.....onnoonno.....',
    '.....onnoonno.....',
    '.....offooffo.....',
    '.....offooffo.....',
    '.....oooooooo.....',
  ],
  robe: [
    '....odddttdddo....',
    '...oLdddttdddDo...',
    '...oLdddttdddDo...',
    '..oLddddttddddDo..',
    '..oLddddttdddDDo..',
    '..oLddddttdddDDo..',
    '.oLdddddttddddDDo.',
    'owwkwwwwwwwwkwwkwo',
    '.oooooooooooooooo.',
    '......ff..ff......',
  ],
};
// Second walking frame: legs apart.
const BOY_LEGS_B = ['....offo..offo....', '....offo..offo....', '....oooo..oooo....'];
const BOY_FEET_B = '.....ff....ff.....';

const BOY_HEAD_ITEMS = {
  crown:     HEAD_ITEMS.crown,
  circlet:   { x: 5, y: -2, rows: ['y..yy..y', 'Yyybbyyy'] },
  kingcrown: { x: 4, y: -6, rows: ['....yy....', '.y..yy..y.', '.yyvvvvyy.', 'yyvvvvvvyy', 'ybyyryybyy', 'YYYYYYYYYY'] },
  feather:   { x: 3, y: -4, rows: ['..........ww', '.oooooooowWo', 'oDDDDDDDDDwo', 'oDDDDDDDDDDo', 'oyyyyyyyyyyo'] },
};
const BOY_HAND_BITMAPS = {
  sword:     { x: 13, y: 4, rows: ['..o..', '.oao.', '.oao.', '.oao.', '.oao.', '.oao.', '.oao.', '.oao.', 'oyYyo', '.ofo.', '.ofo.', '..y..'] },
  sceptre:   { x: 13, y: 5, rows: ['.oyo.', 'oyryo', 'oyyyo', '.oYo.', '.oyo.', '.oYo.', '.oyo.', '.oYo.', '.oyo.', '.oYo.', '..y..'] },
  starsword: { x: 13, y: 2, rows: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.ycy.', '.oco.', '.oco.', '.oco.', '.oco.', '.oco.', 'oyYyo', '.ofo.', '.ofo.', '..y..'] },
};

const boyCache = new Map();

// The boy hero, on the princess's canvas size and anchor. Wings never
// reach a boy (see suits() in game.js); a cape does.
function boySprite(outfit, frame) {
  const key = `${outfit.dress}|${outfit.shape}|${outfit.head}|${outfit.hand}|${outfit.hair}|${outfit.back}|${frame}`;
  if (boyCache.has(key)) return boyCache.get(key);
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
    d: dress[0], D: dress[1], L: dress[2], t: dress[3], b: '#6b4a3a', n: '#4a4a7a', f: '#7a4a2e',
    y: '#ffd34d', Y: '#e0a52a', r: '#ff6f8a', v: '#c8303f', w: '#ffffff', a: '#c8d2e4', c: '#9fe8ff',
  };
  const bottom = (BOY_BOTTOMS[outfit.shape] || BOY_BOTTOMS.tunic).slice();
  if (frame === 1) {
    if (outfit.shape === 'robe') bottom[9] = BOY_FEET_B;
    else bottom.splice(7, 3, ...BOY_LEGS_B);
  }
  if (outfit.back === 'cape') {
    for (let y = 12; y < 28; y++) {
      const spread = Math.min(3, Math.floor((y - 12) / 4));
      const x0 = OXp + 2 - spread;
      const x1 = OXp + 16 + spread;
      px(ctx, x0, OYp + y, x1 - x0, 1, y === 27 ? '#2e2466' : '#4a3a9a');
      px(ctx, x0, OYp + y, 1, 1, '#2e2466');
      px(ctx, x1 - 1, OYp + y, 1, 1, '#2e2466');
      if ((y * 7) % 5 === 0) px(ctx, x0 + 1 + (y % 3), OYp + y, 1, 1, '#ffd34d');
      if ((y * 3) % 7 === 0) px(ctx, x1 - 3, OYp + y, 1, 1, '#ffd34d');
    }
  }
  drawBitmap(ctx, BOY_TOP, pal, OXp, OYp);
  drawBitmap(ctx, bottom, pal, OXp, OYp + BOY_TOP.length);
  const head = BOY_HEAD_ITEMS[outfit.head];
  if (head) drawBitmap(ctx, head.rows, pal, OXp + head.x, OYp + head.y);
  const hand = BOY_HAND_BITMAPS[outfit.hand];
  if (hand) drawBitmap(ctx, hand.rows, pal, OXp + hand.x, OYp + hand.y);
  const sprite = { canvas: cv, ax: OXp + 9, ay: OYp + 28 };
  boyCache.set(key, sprite);
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
  wizard:  { x: 2, y: -10, rows: ['.....oo.....', '....occo....', '....occo....', '...occcco...', '...ocyccco..', '..occcccco..', '..occcccyco.', '.occcccccco.', 'oaaaaaaaaaao', '.oooooooooo.'] },
  leaf:    { x: 3, y: -3, rows: ['....gg....', '..gggggg..', '.gggGgggg.', 'gggggggggg'] },
  flowerband: { x: 3, y: -1, rows: ['.r..y..r..', 'rgrgygrgrg'] },
  mushroom: { x: 2, y: -6, rows: ['...oooooo...', '..orrwrrro..', '.orwrrrrwro.', 'orrrrwrrrrro', 'oooooooooooo'] },
};

const villagerCache = new Map();

function villagerSprite(lookKey, frame) {
  const key = `${lookKey}|${frame}`;
  if (villagerCache.has(key)) return villagerCache.get(key);
  const look = LOOKS[lookKey];
  if (look.monster) return monsterSprite(look.monster, frame);
  const cv = makeCanvas(20, 34);
  const ctx = cv.getContext('2d');
  const OXv = 2;
  const OYv = 8;
  const pal = {
    o: '#3f2c48', h: look.hair, s: '#ffe0c8', k: '#3a2340', p: '#ffadbc', m: '#d0606a',
    c: look.shirt, d: look.pants, b: shade(look.pants, -40), f: '#6b4a3a', t: '#ffd34d',
    w: '#ffffff', a: '#c8d2e4', A: '#ffffff', r: '#ff6fa8', g: '#5fc46a', G: '#9be88a', y: look.hat === 'crown' ? '#ffd34d' : '#f2d27a', Y: '#e0a52a',
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

// Mushroom cottage for the forest: a fat stem with a spotted dome cap.
function drawMushroomHouse(ctx, cx, cy, cap) {
  const R = 30;
  const H = 30;
  ctx.fillStyle = 'rgba(30,20,60,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx + 6, cy + 4, R + 4, R / 2 + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let dx = -R + 6; dx < R - 6; dx++) {
    const t = (dx + 0.5) / (R - 6);
    const e = Math.sqrt(1 - t * t) * (R - 6) / 2;
    const col = t < -0.4 ? '#e8d8c0' : t > 0.6 ? '#f4e8d4' : '#fff6e6';
    px(ctx, cx + dx, Math.round(cy - H + e), 1, Math.round(H), col);
  }
  // Round door and window.
  px(ctx, cx - 6, cy - 14, 12, 16, '#8a5a3c');
  px(ctx, cx - 4, cy - 16, 8, 2, '#8a5a3c');
  px(ctx, cx - 5, cy - 12, 10, 14, '#a8704a');
  px(ctx, cx + 2, cy - 6, 2, 2, '#ffd34d');
  px(ctx, cx + 12, cy - 20, 7, 7, '#5a4a6a');
  px(ctx, cx + 13, cy - 19, 5, 5, '#fff2a8');
  // Cap.
  const top = cy - H - 30;
  for (let dx = -R - 6; dx < R + 6; dx++) {
    const t = (dx + 0.5) / (R + 6);
    const dome = Math.sqrt(Math.max(0, 1 - t * t));
    const y0 = Math.round(cy - H - dome * 30 + 6);
    const y1 = Math.round(cy - H + dome * 10 + 8);
    for (let y = y0; y < y1; y++) {
      let col = cap;
      if (t < -0.45) col = shade(cap, -35);
      else if (t < -0.1) col = shade(cap, -14);
      if (y < y0 + 4 && t > -0.3 && t < 0.3) col = shade(cap, 26);
      const sx = Math.floor((dx + 40) / 9);
      const sy = Math.floor((y - top) / 8);
      const dot = hash(sx, sy, 41) < 0.35 && ((dx + 40) % 9) > 2 && ((dx + 40) % 9) < 7 && ((y - top) % 8) > 2 && ((y - top) % 8) < 6;
      if (dot) col = '#ffffff';
      if (y === y1 - 1) col = shade(cap, -60);
      px(ctx, cx + dx, y, 1, 1, col);
    }
  }
}

// Little glowing mushrooms scattered on the forest floor.
function drawGlowShroom(ctx, x, y, color) {
  px(ctx, x, y - 3, 1, 3, '#f4e8d4');
  px(ctx, x - 2, y - 5, 5, 2, color);
  px(ctx, x - 1, y - 6, 3, 1, shade(color, 30));
}

// ---- Unicorns --------------------------------------------------------------

// A side-view unicorn facing right, drawn on a pixel grid and then outlined.
const unicornCache = new Map();
function unicornSprite(key, frame) {
  const ck = `${key}|${frame}`;
  if (unicornCache.has(ck)) return unicornCache.get(ck);
  const u = UNICORNS[key] || UNICORNS.snow;
  const W = 32;
  const H = 30;
  const grid = [];
  for (let y = 0; y < H; y++) grid.push(new Array(W).fill(null));
  const set = (x, y, col) => { if (x >= 0 && y >= 0 && x < W && y < H) grid[y][x] = col; };
  const rect = (x, y, w, h, col) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, col); };
  const Y = 3;
  const hoof = shade(u.shade, -30);
  // Legs: the far pair is darker. Frame 1 lifts one front and one back leg.
  const legs = [[8, true], [19, true], [11, false], [22, false]];
  legs.forEach(([x, far], i) => {
    const lift = frame === 1 && (i === 1 || i === 2) ? 2 : 0;
    rect(x, Y + 17, 2, 7 - lift, far ? u.shade : u.body);
    rect(x, Y + 23 - lift, 2, 1, hoof);
  });
  // Body with a rounded back and belly.
  rect(7, Y + 11, 18, 7, u.body);
  rect(8, Y + 10, 16, 1, u.body);
  rect(8, Y + 18, 16, 1, u.shade);
  rect(7, Y + 16, 18, 2, u.shade);
  rect(10, Y + 11, 10, 1, mix(u.body, '#ffffff', 0.5));
  // Neck and head.
  rect(20, Y + 6, 5, 6, u.body);
  rect(21, Y + 3, 6, 5, u.body);
  rect(25, Y + 5, 4, 4, u.body);
  rect(26, Y + 8, 3, 1, u.shade);
  set(28, Y + 7, shade(u.shade, -40));
  // Ear.
  rect(22, Y + 1, 2, 2, u.body);
  set(23, Y + 2, '#ffadbc');
  // Horn.
  const horn = [[25, Y + 2], [25, Y + 1], [26, Y], [26, Y - 1], [27, Y - 2], [27, Y - 3]];
  horn.forEach(([x, y], i) => set(x, y, i % 2 ? shade(u.horn, -40) : u.horn));
  // Eye with a sparkle, and a pink cheek.
  set(25, Y + 4, '#3a2340');
  set(25, Y + 5, '#3a2340');
  set(24, Y + 4, '#ffffff');
  set(26, Y + 6, '#ffadbc');
  // Mane down the back of the neck, in stripes.
  const mane = u.mane;
  for (let y = 0; y < 10; y++) {
    const col = mane[Math.floor(y / 10 * mane.length)];
    const x0 = 19 - Math.floor(y / 4);
    rect(x0, Y + 2 + y, 3, 1, col);
  }
  rect(22, Y + 2, 3, 1, mane[0]);
  // Tail.
  for (let y = 0; y < 11; y++) {
    const col = mane[Math.floor(y / 11 * mane.length)];
    const x0 = 3 + Math.round(Math.sin(y / 2.2) * 1.5);
    rect(x0, Y + 10 + y, 4 - (y > 8 ? 1 : 0), 1, col);
  }
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  // Outline: ink wherever an empty pixel touches the unicorn.
  const ink = '#4a2c4f';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[y][x]) { px(ctx, x, y, 1, 1, grid[y][x]); continue; }
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy] && grid[y + dy][x + dx]);
    if (near) px(ctx, x, y, 1, 1, ink);
  }
  if (u.mane.length > 4 || key === 'night') {
    // Little sparkles on the special ones.
    for (const [x, y] of [[12, Y + 13], [17, Y + 14], [14, Y + 12]]) px(ctx, x, y, 1, 1, key === 'night' ? '#ffe066' : '#ff9ec4');
  }
  const sprite = { canvas: cv, ax: 16, ay: Y + 24 };
  unicornCache.set(ck, sprite);
  return sprite;
}

// The princess sitting on her unicorn: her top half above the saddle and
// the skirt draped over the unicorn's side. A boy shows a leg and a boot.
const riderCache = new Map();
function riderSprite(outfit, frame, boy) {
  const key = `${Object.values(outfit).join('|')}|${frame}|${!!boy}`;
  if (riderCache.has(key)) return riderCache.get(key);
  const uni = unicornSprite(outfit.ride, frame);
  const hero = boy ? boySprite(outfit, 0) : princessSprite(outfit, 0);
  const W = 36;
  const H = 46;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  const ux = 2;
  const uy = H - uni.canvas.height;
  const dress = DRESS_COLORS[outfit.dress].c;
  // Wings or a cape behind her stay with the full sprite's top.
  ctx.drawImage(uni.canvas, ux, uy);
  const cut = 24;
  const hx = ux + 12 - 11;
  const hy = uy + 13 - cut + 1;
  ctx.drawImage(hero.canvas, 0, 0, hero.canvas.width, cut, hx, hy, hero.canvas.width, cut);
  // Skirt over the unicorn's side.
  const sx = ux + 7;
  const sy = uy + 13;
  if (boy) {
    drawBoyLeg(ctx, sx, sy, outfit, dress);
    const sprite = { canvas: cv, ax: ux + uni.ax, ay: uy + uni.ay };
    riderCache.set(key, sprite);
    return sprite;
  }
  for (let y = 0; y < 5; y++) {
    const w = 10 + Math.min(y, 2) * 2;
    const x0 = sx - Math.min(y, 2);
    px(ctx, x0, sy + y, w, 1, y === 4 ? dress[3] : y > 2 ? dress[1] : dress[0]);
    px(ctx, x0 - 1, sy + y, 1, 1, '#4a2c4f');
    px(ctx, x0 + w, sy + y, 1, 1, '#4a2c4f');
  }
  px(ctx, sx - 2, sy + 5, 14, 1, '#4a2c4f');
  px(ctx, sx + 2, sy + 1, 2, 1, dress[2]);
  // A little foot peeking out under the skirt.
  px(ctx, sx + 6, sy + 6, 2, 2, '#c0507a');
  px(ctx, sx + 5, sy + 6, 1, 2, '#4a2c4f');
  px(ctx, sx + 8, sy + 6, 1, 2, '#4a2c4f');
  px(ctx, sx + 6, sy + 8, 2, 1, '#4a2c4f');
  const sprite = { canvas: cv, ax: ux + uni.ax, ay: uy + uni.ay };
  riderCache.set(key, sprite);
  return sprite;
}

// A boy's tunic or coat over the unicorn's side, with his leg and boot below.
function drawBoyLeg(ctx, sx, sy, outfit, dress) {
  const flap = outfit.shape === 'tunic' ? 3 : 5;
  for (let y = 0; y < flap; y++) {
    const w = 10 + Math.min(y, 1) * 2;
    const x0 = sx - Math.min(y, 1);
    px(ctx, x0, sy + y, w, 1, y === flap - 1 ? (outfit.shape === 'robe' ? '#ffffff' : dress[3]) : y > flap - 3 ? dress[1] : dress[0]);
    px(ctx, x0 - 1, sy + y, 1, 1, '#4a2c4f');
    px(ctx, x0 + w, sy + y, 1, 1, '#4a2c4f');
  }
  px(ctx, sx - 1, sy + flap, 12, 1, '#4a2c4f');
  px(ctx, sx + 2, sy + 1, 2, 1, dress[2]);
  // Trousers down to a brown boot.
  for (let y = sy + flap + 1; y < sy + 9; y++) {
    const boot = y >= sy + 6;
    px(ctx, sx + 5, y, 3, 1, boot ? '#7a4a2e' : '#4a4a7a');
    px(ctx, sx + 4, y, 1, 1, '#4a2c4f');
    px(ctx, sx + 8, y, 1, 1, '#4a2c4f');
  }
  px(ctx, sx + 4, sy + 9, 6, 1, '#4a2c4f');
  px(ctx, sx + 8, sy + 8, 1, 1, '#7a4a2e');
  px(ctx, sx + 9, sy + 8, 1, 1, '#4a2c4f');
}

// ---- Unicorn Village props ---------------------------------------------------

TREE_PALETTES.cotton = { dark: '#e890c0', mid: '#ffc0e0', light: '#fff0f8', spark: '#9fe0ff', line: '#b06090', sparks: 0.08 };
TREE_PALETTES.candy = { dark: '#70a8e8', mid: '#a8d8ff', light: '#e8f6ff', spark: '#ffd0f0', line: '#4878b0', sparks: 0.08 };

function drawMeadow(ctx, ox, oy, c, r, flowers) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const n = hash(x, y, 1);
    if (n < 0.05) return '#e8fff0';
    if (n < 0.08) return '#a8e8c0';
    return (c * 3 + r) % 4 === 0 ? '#c4f4d0' : '#c0f0cc';
  });
  if (flowers) {
    const colors = ['#ff9ec4', '#b9a0ff', '#8fd3ff', '#ffe066', '#ffffff'];
    for (let i = 0; i < 4; i++) {
      const fx = ox + 7 + Math.floor(hash(c, r, 10 + i) * 18);
      const fy = oy + 3 + Math.floor(hash(c, r, 20 + i) * 10);
      const col = colors[Math.floor(hash(c, r, 50 + i) * colors.length)];
      px(ctx, fx, fy + 1, 1, 2, '#7fc89a');
      px(ctx, fx - 1, fy, 3, 1, col);
      px(ctx, fx, fy - 1, 1, 3, col);
    }
  }
}

const RAINBOW = ['#ff8a9a', '#ffbe7a', '#ffe680', '#8fe0a8', '#8fc8ff', '#c4a8ff'];
function drawRainbowPath(ctx, ox, oy, i) {
  const col = RAINBOW[((i % 6) + 6) % 6];
  fillPoly(ctx, diamondPts(ox, oy), col);
  const cx = ox + 16;
  const cy = oy + 8;
  fillPoly(ctx, diamondPts(ox, oy).map(p => ({ x: cx + (p.x - cx) * 0.6, y: cy + (p.y - cy) * 0.6 })), mix(col, '#ffffff', 0.45));
  px(ctx, cx - 1, cy - 1, 2, 1, '#ffffff');
}

// A big rainbow arch with clouds at its feet. (cx, cy) is the ground centre.
function drawRainbowArch(ctx, cx, cy, R) {
  for (let i = 0; i < RAINBOW.length; i++) {
    const r0 = R - i * 4;
    for (let y = -r0; y <= 0; y++) for (let x = -r0; x <= r0; x++) {
      const d = Math.hypot(x, y * 1.05);
      if (d <= r0 && d > r0 - 4) px(ctx, cx + x, cy - 8 + y, 1, 1, RAINBOW[i]);
    }
  }
  for (const s of [-1, 1]) drawCloudPuff(ctx, cx + s * (R - 10), cy - 4, 1.1);
}

function drawCloudPuff(ctx, cx, cy, k = 1) {
  const blobs = [[0, 0, 9], [-9, 3, 6], [9, 3, 6], [-4, -5, 6], [5, -4, 6]].map(([x, y, r]) => [x * k, y * k, r * k]);
  const inside = (x, y) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 <= br * br);
  const R = Math.ceil(16 * k);
  ctx.fillStyle = 'rgba(80,60,140,0.12)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8 * k, 14 * k, 4 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5);
    px(ctx, cx + x, cy + y, 1, 1, edge ? '#b8b0e0' : y > 3 * k ? '#e8e8fa' : '#ffffff');
  }
}

// ---- Crystal Cave ------------------------------------------------------------

// Cute cave monsters, front-facing. Letters are colours; an ink outline is
// added wherever an empty pixel touches the body. `lift` floats fliers.
const MONSTERS = {
  slime: {
    pal: { b: '#7fe0a0', D: '#4fb878', W: '#ffffff' },
    rows: [
      '.....bbbbbb.....',
      '...bbbbbbbbbb...',
      '..bbWWbbbbbbbb..',
      '..bWWbbbbbbbbb..',
      '.bbWbbbbbbbbbbb.',
      '.bbbkwbbbbkwbbb.',
      'bbbbkkbbbbkkbbbb',
      'bbbbkkbbbbkkbbbb',
      'bbpbbbbmmbbbbpbb',
      'bbbbbbbbbbbbbbbb',
      'DbbbbbbbbbbbbbbD',
      '.DDDDDDDDDDDDDD.',
    ],
  },
  bat: {
    lift: 7,
    pal: { b: '#a88ae0', B: '#e4d8ff', v: '#7a5ac0', V: '#5a3a9a', f: '#5a3a9a' },
    rows: [
      '.....b......b.....',
      '.....bb....bb.....',
      '......bbbbbb......',
      'v....bbbbbbbb....v',
      'vv..bbkwbbkwbb..vv',
      'vvv.bbkkbbkkbb.vvv',
      'vvvvbbbbbbbbbbvvvv',
      'vVvvbpbbmmbbpbvvVv',
      '.VvVbbbbbbbbbbVvV.',
      '...V.bBBBBBBb.V...',
      '.....bBBBBBBb.....',
      '......bbbbbb......',
      '.......f..f.......',
    ],
  },
  ghost: {
    lift: 5,
    pal: { g: '#f6f2ff', G: '#cfc6ee' },
    rows: [
      '....gggggg....',
      '..gggggggggg..',
      '.gggggggggggg.',
      '.ggkkggggkkgg.',
      'gggkwggggkwggg',
      'gggkkggggkkggg',
      'ggpggggggggpgg',
      'ggggggmmgggggg',
      'gggggggggggggg',
      'Gggggggggggggg',
      'GggggggggggggG',
      'GGggggggggggGG',
      'GGG..GGGG..GGG',
      '.G....GG....G.',
    ],
  },
  dragon: {
    pal: { d: '#8fdc9a', h: '#fff2c0', y: '#fff2a0', v: '#ff9ec4', t: '#ff9ec4', f: '#4fa36a' },
    rows: [
      '...h........h...',
      '...hd......dh...',
      '....dddddddd....',
      '...dddddddddd...',
      '..ddkwddddkwdd..',
      '..ddkkddddkkdd..',
      '..dpddddddddpd..',
      '...ddddmmdddd...',
      '.v..dddddddd..v.',
      'vv.ddyyyyyydd.vv',
      'vvvddyyyyyyddvvv',
      '.vvddyyyyyyddvv.',
      '...ddyyyyyyddt..',
      '...dddddddddtt..',
      '...ddd....ddd...',
      '...fff....fff...',
    ],
  },
  shroom: {
    pal: { r: '#b98cff', c: '#e8d8c0', s: '#fff6e6', f: '#a8704a' },
    rows: [
      '....rrrrrr....',
      '..rrwwrrrrrr..',
      '.rrwwwrrrrwwr.',
      'rrrwwrrrrrwwwr',
      'rrrrrrrwwrrrrr',
      'rwwrrrrwwrrrrr',
      '.cccccccccccc.',
      '..skwsssskws..',
      '..skksssskks..',
      '..spssmmssps..',
      '...ssssssss...',
      '...ff....ff...',
    ],
  },
};
MONSTERS.slimepink = { pal: { b: '#ffb0d6', D: '#e878b0', W: '#ffffff' }, rows: MONSTERS.slime.rows };

const monsterCache = new Map();
function monsterSprite(key, frame) {
  const ck = `${key}|${frame}`;
  if (monsterCache.has(ck)) return monsterCache.get(ck);
  const m = MONSTERS[key] || MONSTERS.slime;
  const W = 20;
  const H = 34;
  const foot = 31;
  const pal = Object.assign({ k: '#3a2340', w: '#ffffff', p: '#ff9ec4', m: '#c0507a' }, m.pal);
  const bw = m.rows[0].length;
  const x0 = Math.floor((W - bw) / 2);
  const y0 = foot - m.rows.length + 1 - (m.lift || 0);
  const grid = [];
  for (let y = 0; y < H; y++) grid.push(new Array(W).fill(null));
  m.rows.forEach((row, j) => {
    for (let i = 0; i < bw; i++) if (pal[row[i]]) grid[y0 + j][x0 + i] = pal[row[i]];
  });
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  const ink = '#4a2c4f';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[y][x]) { px(ctx, x, y, 1, 1, grid[y][x]); continue; }
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy] && grid[y + dy][x + dx]);
    if (near) px(ctx, x, y, 1, 1, ink);
  }
  const sprite = { canvas: cv, ax: 10, ay: foot };
  monsterCache.set(ck, sprite);
  return sprite;
}

// Shop treasures worn by the princess.
Object.assign(HEAD_ITEMS, {
  gemband: { x: 4, y: -1, rows: ['...b.g.b..', '..bybgbyb.', 'yyyyyyyyyy'] },
});
Object.assign(HAND_BITMAPS, {
  lantern: { x: 15, y: 10, rows: ['.o..', 'oooo', 'oyyo', 'oywo', 'oyyo', 'oooo'] },
});

// Lavender stone floor with tiny crystal specks.
function drawCaveFloor(ctx, ox, oy) {
  const stone = stonePattern('#7a6cb0', '#5a4c90', ['#7e70b4', '#7468aa', '#8476ba', '#7064a6'], 8);
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => (hash(x, y, 3) < 0.012 ? '#bfefff' : stone(x, y)));
}

// A shiny puddle lying on the floor. (cx, cy) is its centre.
function drawPuddle(ctx, cx, cy, k = 1) {
  const rx = 9 * k;
  const ry = 4 * k;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x / rx) ** 2 + (y / ry) ** 2;
    if (d > 1) continue;
    let col = d > 0.7 ? '#5aa6d8' : '#8fd8f8';
    if (y === -1 && x > -rx / 2 && x < 0) col = '#e6fbff';
    px(ctx, Math.round(cx + x), Math.round(cy + y), 1, 1, col);
  }
}

// A cluster of pointed crystals. (cx, cy) is the ground centre.
function drawCrystal(ctx, cx, cy, color, k = 1) {
  ctx.fillStyle = 'rgba(30,20,70,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 11 * k, 4 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  const shards = [[-6, 14, 3], [5, 12, 3], [0, 24, 4], [-2, 9, 3], [3, 7, 2]];
  const light = mix(color, '#ffffff', 0.5);
  const dark = shade(color, -70);
  for (const [dx, h, w] of shards) {
    const x0 = Math.round(cx + dx * k);
    const H = Math.round(h * k);
    const half = Math.round(w * k);
    for (let i = -half - 1; i <= half; i++) {
      const top = H - Math.abs(i + 0.5) * 2;
      const edge = i === -half - 1 || i === half;
      const col = edge ? dark : i < 0 ? light : color;
      px(ctx, x0 + i, Math.round(cy - top), 1, Math.round(top), col);
      px(ctx, x0 + i, Math.round(cy - top), 1, 1, dark);
    }
    px(ctx, x0 - 1, Math.round(cy - H + 4), 1, 2, '#ffffff');
  }
}

// Big glowing mushroom, as tall as the princess's knee.
function drawBigShroom(ctx, cx, cy, color) {
  ctx.fillStyle = 'rgba(30,20,70,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, cx - 2, cy - 11, 5, 11, '#fff6e6');
  px(ctx, cx - 2, cy - 11, 1, 11, '#e8d8c0');
  for (let dx = -9; dx <= 9; dx++) {
    const t = dx / 9.5;
    const h = Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * 8);
    const col = dx < -4 ? shade(color, -30) : dx > 3 ? shade(color, 20) : color;
    px(ctx, cx + dx, cy - 12 - h, 1, h + 2, col);
    px(ctx, cx + dx, cy - 12 - h, 1, 1, shade(color, -60));
    px(ctx, cx + dx, cy - 10, 1, 1, shade(color, -60));
  }
  for (const [x, y] of [[-4, -16], [2, -18], [5, -14]]) px(ctx, cx + x, cy + y, 2, 2, '#ffffff');
}

// A round rocky spike rising from the floor.
function drawStalagmite(ctx, cx, cy) {
  ctx.fillStyle = 'rgba(30,20,70,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let dx = -6; dx <= 6; dx++) {
    const h = Math.round(22 * (1 - Math.abs(dx) / 7) ** 1.3) + 2;
    const col = dx < -2 ? '#9a8cd0' : dx > 2 ? '#5f5296' : '#7a6cb0';
    px(ctx, cx + dx, cy - h, 1, h, col);
    px(ctx, cx + dx, cy - h, 1, 1, '#3f3470');
  }
  px(ctx, cx - 3, cy - 12, 1, 3, '#c8bcf0');
}

// Torch on a pole with a happy orange flame.
function makeTorch() {
  const cv = makeCanvas(12, 34);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = 'rgba(30,20,70,0.22)';
  ctx.beginPath();
  ctx.ellipse(6, 31, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, 5, 12, 2, 19, '#8a5a3c');
  px(ctx, 5, 12, 1, 19, '#6b4228');
  px(ctx, 3, 10, 6, 3, '#5a4a6a');
  px(ctx, 3, 4, 6, 6, '#ff9a4a');
  px(ctx, 4, 2, 4, 3, '#ffbe5a');
  px(ctx, 5, 0, 2, 2, '#ffd34d');
  px(ctx, 4, 6, 4, 4, '#ffe680');
  px(ctx, 5, 7, 2, 2, '#ffffff');
  return { canvas: cv, ax: 6, ay: 31, glow: { x: 6, y: 6 } };
}

// Rocky hill with a round, glowing doorway, seen from the forest.
function drawCaveMouth(ctx, cx, cy) {
  const blobs = [[0, -22, 30], [-22, -12, 18], [22, -12, 18], [-10, -38, 16], [12, -36, 15]];
  const inside = (x, y) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + ((y - by) * 1.15) ** 2 <= br * br) && y <= 2;
  ctx.fillStyle = 'rgba(30,20,60,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 44, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let y = -56; y <= 2; y++) for (let x = -42; x <= 42; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5);
    const l = (-x * 0.5 - y * 0.6) / 40 + (hash(x, y, 31) - 0.5) * 0.3;
    let col = l > 0.55 ? '#a89ad8' : l < -0.05 ? '#64579c' : '#8172bc';
    if (hash(Math.floor((x + 50) / 6), Math.floor((y + 60) / 5), 32) < 0.12) col = shade(col, 14);
    px(ctx, cx + x, cy + y, 1, 1, edge ? '#3f3470' : col);
  }
  // The doorway: an arch fading into a soft purple glow.
  for (let x = -12; x <= 12; x++) {
    const t = x / 12.5;
    const top = Math.round(Math.sqrt(1 - t * t) * 12) + 12;
    for (let y = 0; y < top; y++) {
      const col = y > top - 2 ? '#3f3470' : mix('#2a2050', '#7a5ac0', Math.max(0, 1 - y / top - 0.2));
      px(ctx, cx + x, cy + 1 - y, 1, 1, col);
    }
  }
  for (const [x, y] of [[-5, -8], [4, -14], [7, -5], [-8, -16]]) px(ctx, cx + x, cy + y, 1, 1, '#bfefff');
  drawCrystal(ctx, cx - 26, cy - 4, '#7fe8ff', 0.7);
  drawCrystal(ctx, cx + 25, cy - 2, '#ff9cf0', 0.6);
  drawCrystal(ctx, cx + 6, cy - 46, '#c8a0ff', 0.6);
}

// Rocky back wall of the cave with crystals growing out of it.
function drawCaveWall(ctx, W, H, salt) {
  for (let x = 0; x < W.len; x++) {
    const top = H - 10 + Math.round(Math.sin(x / 9 + salt) * 4 + hash(Math.floor(x / 3), salt, 33) * 5);
    wallRect(ctx, W, x, x + 1, 0, 10, '#4f4288');
    wallRect(ctx, W, x, x + 1, 10, top, (Math.floor(x / 11) + salt) % 2 ? '#6a5ca8' : '#6658a2');
    wallRect(ctx, W, x, x + 1, top - 3, top, '#8a7cc8');
    wallRect(ctx, W, x, x + 1, top, top + 1, '#3f3470');
  }
  // Light rock blocks.
  for (let x = 6; x < W.len - 10; x += 17) {
    const v = 18 + Math.floor(hash(x, salt, 34) * (H - 40));
    wallRect(ctx, W, x, x + 9, v, v + 6, '#7a6cb4');
    wallRect(ctx, W, x, x + 9, v, v + 1, '#8f82c8');
  }
}
