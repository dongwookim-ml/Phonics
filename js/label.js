// Text in a box drawn on the canvas: house signs, room signs, the bubbles over
// villagers and the little hint bubbles. Every one of them goes through
// drawLabel so the box is always sized and placed around the text as it is
// really drawn.
//
// Why not measureText: on an iPad, Safari's measureText and the way it
// centres a line that mixes a colour emoji, Korean and Latin letters do not
// always agree with where the letters are painted, and Apple's emoji are
// wider than the emoji font on the computers the checks run on. A box sized
// from measureText and text drawn with textAlign 'center' then come apart
// (the box too wide on one side, the text running out on the other). Here the
// text is drawn once, off screen, at a reference size and the painted pixels
// are scanned, so the box follows what the browser actually draws. The text
// is then always drawn left-aligned from that same measured start.

const LABEL_FONT = '"Baloo 2", "Trebuchet MS", sans-serif';
const LABEL_REF = 48;
const labelInkCache = new Map();

// Web fonts that finish loading change how text looks, so measure again.
if (typeof document !== 'undefined' && document.fonts && document.fonts.addEventListener) {
  document.fonts.addEventListener('loadingdone', () => labelInkCache.clear());
}

// Where the painted pixels of a line of text sit, in ems, relative to a
// left-aligned, middle-baseline anchor: { l, r, t, b }.
function labelInk(text, weight = '800', family = LABEL_FONT) {
  const key = `${weight}|${family}|${text}`;
  const hit = labelInkCache.get(key);
  if (hit) return hit;
  let ink = null;
  try {
    const cv = document.createElement('canvas');
    // Room for any glyph however wide, not trusting measureText.
    const chars = [...text].length;
    cv.width = Math.ceil(LABEL_REF * (2 * chars + 4));
    cv.height = LABEL_REF * 4;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.font = `${weight} ${LABEL_REF}px ${family}`;
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#000';
    const ax = LABEL_REF * 2, ay = cv.height / 2;
    g.fillText(text, ax, ay);
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
    let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
    for (let y = 0; y < cv.height; y++) {
      for (let x = 0, i = y * cv.width * 4 + 3; x < cv.width; x++, i += 4) {
        if (d[i] < 20) continue;
        if (x < l) l = x;
        if (x > r) r = x;
        if (y < t) t = y;
        if (y > b) b = y;
      }
    }
    if (r >= l) ink = { l: (l - ax) / LABEL_REF, r: (r + 1 - ax) / LABEL_REF, t: (t - ay) / LABEL_REF, b: (b + 1 - ay) / LABEL_REF };
  } catch (e) { /* no canvas (a test without a DOM): fall back below */ }
  if (!ink) ink = { l: 0, r: 0.6 * [...text].length, t: -0.4, b: 0.4 };
  if (labelInkCache.size > 500) labelInkCache.clear();
  labelInkCache.set(key, ink);
  return ink;
}

// The size of a label's box and where its text goes inside it.
//   o.size: font size in canvas pixels; o.padX, o.padY: room around the
//   letters; o.minW, o.minH: smallest box; o.weight, o.family.
function labelBox(text, o) {
  const size = o.size;
  const ink = labelInk(text, o.weight || '800', o.family || LABEL_FONT);
  // A pixel either side for antialiasing at any scale.
  const inkW = (ink.r - ink.l) * size + 2;
  const inkH = (ink.b - ink.t) * size + 2;
  const padX = o.padX != null ? o.padX : size * 0.36;
  const padY = o.padY != null ? o.padY : size * 0.1;
  return {
    w: Math.max(o.minW || 0, inkW + 2 * padX),
    h: Math.max(o.minH || 0, inkH + 2 * padY),
    // From the box's centre to the left-aligned, middle-baseline anchor.
    dx: -(ink.l + ink.r) / 2 * size,
    dy: -(ink.t + ink.b) / 2 * size,
  };
}

// Draws text centred on (x, y) in a rounded box and returns the box
// { x, y, w, h } (x, y its centre). Options besides labelBox's:
//   ink: text colour; fill, stroke, line, radius: the box (box: false for
//   text alone); posts: colour of two posts the sign hangs from;
//   tail: { x, w, h } a speech-bubble tail under the box, x from the centre.
function drawLabel(ctx, x, y, text, o) {
  const b = o.layout || labelBox(text, o);
  const s = o.size / 11;
  ctx.save();
  if (o.box !== false) {
    const L = x - b.w / 2, T = y - b.h / 2;
    if (o.posts) {
      ctx.strokeStyle = o.posts;
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.moveTo(x - b.w / 3, T);
      ctx.lineTo(x - b.w / 3, T - 4 * s);
      ctx.moveTo(x + b.w / 3, T);
      ctx.lineTo(x + b.w / 3, T - 4 * s);
      ctx.stroke();
    }
    ctx.fillStyle = o.fill || '#ffffff';
    ctx.strokeStyle = o.stroke || '#4a2c4f';
    ctx.lineWidth = o.line != null ? o.line : s;
    roundRect(ctx, L, T, b.w, b.h, Math.min(o.radius != null ? o.radius : 3 * s, b.h / 2));
    ctx.fill();
    if (ctx.lineWidth > 0) ctx.stroke();
    if (o.tail) {
      const tw = o.tail.w / 2, tx = x + (o.tail.x || 0), by = T + b.h;
      ctx.beginPath();
      ctx.moveTo(tx - tw, by - 1);
      ctx.lineTo(tx + (o.tail.lean || 0), by + o.tail.h);
      ctx.lineTo(tx + tw, by - 1);
      ctx.fill();
    }
  }
  ctx.font = `${o.weight || '800'} ${o.size}px ${o.family || LABEL_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = o.ink || '#4a2c4f';
  if (o.outline) {
    ctx.strokeStyle = o.outline;
    ctx.lineWidth = o.outlineWidth || s * 2;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x + b.dx, y + b.dy);
  }
  ctx.fillText(text, x + b.dx, y + b.dy);
  ctx.restore();
  return { x, y, w: b.w, h: b.h };
}
