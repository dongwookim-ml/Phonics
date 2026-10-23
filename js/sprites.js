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
