// Pixel-art drawing for the town. Everything here draws onto the small
// low-resolution "world" canvas, which is then scaled up with nearest-
// neighbour sampling so every pixel stays crisp.

const TILE_W = 32;
const TILE_H = 16;

// Deterministic pseudo-random number in [0, 1) for a tile and a salt.
function hash(c, r, salt = 0) {
  let h = (c * 374761393 + r * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Calls fn(x, y) for every pixel inside the tile diamond at (ox, oy).
function eachDiamondPixel(fn) {
  for (let y = 0; y < TILE_H; y++) {
    const w = y < 8 ? 4 * (y + 1) : 4 * (TILE_H - y);
    const x0 = 16 - w / 2;
    for (let x = x0; x < x0 + w; x++) fn(x, y);
  }
}

function drawDiamond(ctx, ox, oy, color) {
  ctx.fillStyle = color;
  for (let y = 0; y < TILE_H; y++) {
    const w = y < 8 ? 4 * (y + 1) : 4 * (TILE_H - y);
    ctx.fillRect(ox + 16 - w / 2, oy + y, w, 1);
  }
}

// ---- Ground tiles -------------------------------------------------------

function drawGrass(ctx, ox, oy, c, r, flowers) {
  drawDiamond(ctx, ox, oy, (c + r) % 2 ? '#7ccf6a' : '#74c663');
  eachDiamondPixel((x, y) => {
    const n = hash(c * 32 + x, r * 16 + y, 1);
    if (n < 0.06) px(ctx, ox + x, oy + y, 1, 1, '#9be07f');
    else if (n < 0.1) px(ctx, ox + x, oy + y, 1, 1, '#5fae52');
  });
  if (flowers) {
    const colors = ['#ff6fa8', '#ffd84a', '#ffffff', '#b98cff'];
    for (let i = 0; i < 4; i++) {
      const fx = 9 + Math.floor(hash(c, r, 10 + i) * 14);
      const fy = 4 + Math.floor(hash(c, r, 20 + i) * 8);
      px(ctx, ox + fx, oy + fy + 1, 1, 1, '#3f8f3a');
      px(ctx, ox + fx, oy + fy, 1, 1, colors[i % colors.length]);
    }
  }
}

function drawRoad(ctx, ox, oy, c, r) {
  drawDiamond(ctx, ox, oy, '#ecd8a8');
  eachDiamondPixel((x, y) => {
    const n = hash(c * 32 + x, r * 16 + y, 2);
    if (n < 0.05) px(ctx, ox + x, oy + y, 1, 1, '#d4bd86');
    else if (n < 0.07) px(ctx, ox + x, oy + y, 1, 1, '#fff0c8');
  });
}

function drawWater(ctx, ox, oy, c, r, t) {
  drawDiamond(ctx, ox, oy, '#4ea9e6');
  eachDiamondPixel((x, y) => {
    const wave = Math.sin((x + c * 32) * 0.35 + (y + r * 16) * 0.9 - t * 2.2);
    if (wave > 0.93) px(ctx, ox + x, oy + y, 1, 1, '#bfe8ff');
    else if (wave < -0.9) px(ctx, ox + x, oy + y, 1, 1, '#3b8fd0');
  });
}

// The island's earthy side wall, drawn under edge tiles.
function drawEdge(ctx, ox, oy, side) {
  const depth = 6;
  if (side === 'left') {
    for (let x = 0; x < 16; x++) {
      const y = 8 + Math.floor(x / 2);
      px(ctx, ox + x, oy + y, 1, depth, x % 5 === 0 ? '#9a6a3c' : '#a8774a');
      px(ctx, ox + x, oy + y, 1, 2, '#5fae52');
    }
  } else {
    for (let x = 16; x < 32; x++) {
      const y = 15 - Math.floor((x - 16) / 2);
      px(ctx, ox + x, oy + y, 1, depth, x % 5 === 0 ? '#7f5530' : '#8c603a');
      px(ctx, ox + x, oy + y, 1, 2, '#4f9a45');
    }
  }
}

// ---- Bitmap sprites -----------------------------------------------------

function drawBitmap(ctx, rows, palette, x, y, flip = false) {
  const w = rows[0].length;
  for (let j = 0; j < rows.length; j++) {
    for (let i = 0; i < w; i++) {
      const ch = rows[j][flip ? w - 1 - i : i];
      const col = palette[ch];
      if (col) px(ctx, x + i, y + j, 1, 1, col);
    }
  }
}

const TREE = [
  '....gggggg....',
  '..ggGGGggggg..',
  '.ggGGGGgggggg.',
  'gggGGggggggdgg',
  'ggggggggggggdg',
  'gggggggggggddg',
  'gggggggggdddgg',
  '.gggggddddddg.',
  '..gddddddddd..',
  '....ddtttd....',
  '......tt......',
  '......tT......',
  '.....tttT.....',
];
const TREE_PAL = { g: '#3fa34d', G: '#6fd06a', d: '#2b7d3c', t: '#8a5a32', T: '#6b4325' };

// Unicorn friend, facing right. Two walk frames.
const UNICORN = [
  [
    '...........y....',
    '..........yy....',
    '........vvwo....',
    '.......vvwwwo...',
    '......vvwwkwwo..',
    '......vowwwwpo..',
    '.....vvowwwwo...',
    '....vvvowwoo....',
    '.voooowwwwo.....',
    'vvowwwwwwwwo....',
    'v.owwwwwwwwo....',
    '..owwwwwwwo.....',
    '...ow.ow.ow.....',
    '...ow.ow.ow.....',
    '...hh.hh.hh.....',
  ],
  [
    '...........y....',
    '..........yy....',
    '........vvwo....',
    '.......vvwwwo...',
    '......vvwwkwwo..',
    '......vowwwwpo..',
    '.....vvowwwwo...',
    '....vvvowwoo....',
    '.voooowwwwo.....',
    'vvowwwwwwwwo....',
    'v.owwwwwwwwo....',
    '..owwwwwwwo.....',
    '..ow..ow.ow.....',
    '.ow...ow..ow....',
    '.hh...hh..hh....',
  ],
];
const UNICORN_PAL = { w: '#ffffff', o: '#8f7fb8', v: '#c86fe8', y: '#ffcf3a', k: '#2a2040', p: '#ff9ec7', h: '#b89ad8' };

function drawTree(ctx, ox, oy, sway) {
  // Shadow on the grass, then the tree standing on the tile centre.
  px(ctx, ox + 11, oy + 9, 10, 2, 'rgba(0,0,0,0.15)');
  drawBitmap(ctx, TREE, TREE_PAL, ox + 9 + sway, oy - 2);
}

function drawUnicorn(ctx, x, y, frame, flip) {
  px(ctx, x - 6, y - 1, 12, 2, 'rgba(0,0,0,0.18)');
  drawBitmap(ctx, UNICORN[frame], UNICORN_PAL, x - 8, y - 15, flip);
}

// ---- Houses -------------------------------------------------------------

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(v + amt)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `rgb(${r},${g},${b})`;
}

// Draws a house whose footprint is the tile at (ox, oy).
// `lift` raises it (for the happy bounce), `dx` shifts it (for a wiggle).
function drawHouse(ctx, ox, oy, info, lift = 0, dx = 0, glow = false) {
  const WALL = 15;
  const ROOF = 13;
  const x0 = ox + dx;
  const y0 = oy - lift;
  const wallL = shade(info.wall, -28);
  const wallR = info.wall;

  // Shadow on the ground.
  drawDiamond(ctx, ox + 2, oy + 2, 'rgba(0,0,0,0.12)');

  // Left wall (faces the viewer's lower left; the door is here).
  for (let x = 4; x < 16; x++) {
    const yb = y0 + 8 + Math.floor((x - 4) / 2);
    px(ctx, x0 + x, yb - WALL, 1, WALL + 1, wallL);
  }
  // Right wall.
  for (let x = 16; x < 28; x++) {
    const yb = y0 + 13 - Math.floor((x - 16) / 2);
    px(ctx, x0 + x, yb - WALL, 1, WALL + 1, wallR);
  }
  // Door on the left wall.
  for (let x = 8; x < 12; x++) {
    const yb = y0 + 8 + Math.floor((x - 4) / 2);
    px(ctx, x0 + x, yb - 8, 1, 8, '#7a4a2a');
    if (x === 8) px(ctx, x0 + x, yb - 8, 1, 8, '#5e3720');
  }
  px(ctx, x0 + 11, y0 + 7, 1, 1, '#ffd84a'); // door knob
  // Window on the right wall.
  for (let x = 19; x < 25; x++) {
    const yb = y0 + 13 - Math.floor((x - 16) / 2);
    const lit = glow ? '#fff6a8' : '#bfe6ff';
    px(ctx, x0 + x, yb - 11, 1, 5, (x === 21 || x === 22) ? '#ffffff' : lit);
    px(ctx, x0 + x, yb - 12, 1, 1, '#6b4a3a');
    px(ctx, x0 + x, yb - 6, 1, 1, '#6b4a3a');
  }
  // Pyramid roof with a small overhang.
  const L = { x: 1, y: y0 + 8 - WALL };
  const B = { x: 16, y: y0 + 15 - WALL + 1 };
  const R = { x: 31, y: y0 + 8 - WALL };
  const A = { x: 16, y: y0 + 8 - WALL - ROOF };
  const roofL = shade(info.roof, -30);
  const roofR = info.roof;
  for (let x = L.x; x <= R.x; x++) {
    let top, bot;
    if (x < 16) {
      const t = (x - L.x) / (A.x - L.x);
      top = L.y + (A.y - L.y) * t;
      bot = L.y + (B.y - L.y) * t;
    } else {
      const t = (x - A.x) / (R.x - A.x);
      top = A.y + (R.y - A.y) * t;
      bot = B.y + (R.y - B.y) * t;
    }
    top = Math.round(top);
    bot = Math.round(bot);
    const base = x < 16 ? roofL : roofR;
    px(ctx, x0 + x, top, 1, bot - top + 1, base);
    // Shingle stripes.
    for (let y = top + 2; y < bot; y += 3) px(ctx, x0 + x, y, 1, 1, shade(info.roof, x < 16 ? -55 : -22));
    px(ctx, x0 + x, bot, 1, 1, shade(info.roof, -70));
  }
  // Chimney.
  px(ctx, x0 + 22, A.y + 4, 3, 5, '#b55a3c');
  px(ctx, x0 + 22, A.y + 3, 3, 1, '#8a3f28');

  // Returns the roof apex in world pixels so the letter badge can sit on top.
  return { x: x0 + 16, y: A.y };
}
