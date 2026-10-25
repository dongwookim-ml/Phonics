// Princess edition: the Crystal Cave's monsters do magic. The robot
// edition's Villain Cave (js/captain-cave.js) is the model, and its dialog
// stepping aside is shared: while a spell plays the dialog steps aside
// (caveStepAside), and busyNow (js/game.js) counts that as showing
// (caveFighting), so closing the parent panel over it never frees the game.
// - A wrong answer: she hears what she picked and the hint, then the monster
//   wobbles while sparkles gather, hops and sends its magic at her (a star, a
//   bubble, a heart or a moon). A soap bubble pops up around her and the
//   magic bursts into hearts and twinkles on it. That is quick and soft, so
//   a miss is never the fun part. Then the same question again.
// - A right answer: once the praise and the answer have been said, the
//   monster tries one last spell, her bubble catches it, and her own star
//   flies back with a rainbow tail. The monster giggles, twirls and goes
//   poof, leaving coins (catchMonster in js/game.js).
// - While they wait, monsters float or bounce, and blink.
// Hooks in js/game.js: openDialog, missed, catchMonster, drawCharacter and
// drawOverlay, all behind !isCaptain().

// How long each part of a spell takes, in ms.
const MAGIC_MS = { windup: 450, fly: 450, after: 500, charge: 250, wand: 500, giggle: 450, twirl: 600 };

// Each monster's magic: the picture that flies (MAGIC_SHAPES) in its
// colours, the colours of its sparkles, and which row of its pixel art
// (MONSTERS in js/sprites.js) to leave out when it squashes down.
const MONSTER_MAGIC = {
  slime:     { bolt: 'bubble', pal: { o: '#2f9a5e', b: '#7fe0a0', B: '#c8ffd8' }, colors: ['#7fe0a0', '#c8ffd8', '#ffffff'], squash: 9 },
  slimepink: { bolt: 'heart',  pal: { o: '#c0507a', b: '#ff9ec4', B: '#ffd0e6' }, colors: ['#ff9ec4', '#ffd0e6', '#ffffff'], squash: 9 },
  bat:       { bolt: 'moon',   pal: { o: '#c08a2a', b: '#fff2a8', B: '#ffffff' }, colors: ['#c8a8ff', '#fff2a8', '#ffffff'], squash: 10 },
  ghost:     { bolt: 'star',   pal: { o: '#6a8ad0', b: '#bfefff', B: '#ffffff' }, colors: ['#bfefff', '#e4d8ff', '#ffffff'], squash: 9 },
  // "My fire is just tiny sparkles!"
  dragon:    { bolt: 'star',   pal: { o: '#d0608a', b: '#ffb0d0', B: '#fff2a0' }, colors: ['#ff9ec4', '#fff2a0', '#8fdc9a'], squash: 10 },
  shroom:    { bolt: 'bubble', pal: { o: '#8a5ad0', b: '#d8b8ff', B: '#fff6c8' }, colors: ['#b98cff', '#fff6a8', '#ffffff'], squash: 10 },
};
const magicOf = npc => MONSTER_MAGIC[npc.look] || MONSTER_MAGIC.slime;

// Her own magic: a golden star with a rainbow tail (RAINBOW in js/sprites.js).
const MAGIC_GOLD = { o: '#e0a52a', b: '#fff07a', B: '#ffffff' };

// Spells playing right now, drawn over the scene by drawMagicFx().
const magicFx = [];

// ---- The spells ----------------------------------------------------------------

// When she talks to a monster she steps back a tile to face it from across
// the floor, so its magic has room to fly (caveStandBack, as the robot does).
function monsterFaceOff(npc) {
  caveStandBack(npc);
}

// A wrong answer (from missed in js/game.js): what she picked and the hint,
// then the monster's spell, then the same question again, or after a
// second miss the answer is shown.
function monsterMiss(npc, q, o, showIt) {
  const fight = npc.fight = (npc.fight || 0) + 1;
  const live = () => npc.fight === fight && state.talking === npc && state.question === q;
  const parts = showIt ? q.picked(o) : q.teach(o);
  q.locked = true;
  q.turn = (q.turn || 0) + 1; // no earlier listen() lets her answer now
  ui.dialog.classList.add('listening');
  ui.text.textContent = shownText(parts);
  caveSayThen(parts, voiceOf(npc), () => {
    if (!live()) return;
    caveStepAside(npc);
    later(monsterCast(npc) + MAGIC_MS.after, () => {
      if (!live()) return;
      caveStepBack();
      if (showIt) showAnswer(q, null);
      else listen(q, [], 0);
    });
  }, 7000);
}

// A right answer (from catchMonster in js/game.js): once `said` (the praise
// and the answer) has been said, its last spell, her star, a giggle and a
// twirl, then poof() takes it away and pays the coins. If she closed the
// dialog before that, it just goes poof.
function monsterCaught(npc, said, poof) {
  const done = () => {
    npc.spell = null;
    if (caveAside === npc) caveAside = null; // the magic is over (before poof closes the dialog)
    poof();
  };
  caveSayThen(said, voiceOf(npc), () => {
    if (state.talking !== npc) { done(); return; }
    caveStepAside(npc);
    later(monsterCast(npc) + 250, () => later(heroCast(npc), () => {
      monsterGiggle(npc);
      later(MAGIC_MS.giggle, () => {
        npc.spell = { kind: 'twirl', t0: performance.now(), dur: MAGIC_MS.twirl };
        later(MAGIC_MS.twirl, done);
      });
    }));
  }, 6000);
}

// Where things happen, in world pixels: the middle of a monster's body
// (fliers float higher), her chest.
function monsterMiddle(npc) {
  const p = tileCenter(state.scene, npc.c, npc.r);
  const m = MONSTERS[npc.look] || MONSTERS.slime;
  return { x: p.x, y: p.y + 1 - (m.lift || 0) - m.rows.length / 2 };
}
function heroChest() {
  const p = heroWorld();
  return { x: p.x, y: p.y - 16 };
}

// The monster's spell: it wobbles while sparkles gather in front of it,
// hops and sends its magic at her, and the bubble that pops up around her
// catches it in a burst of hearts. Returns the time in ms until it hits.
function monsterCast(npc) {
  const m = magicOf(npc);
  const from = monsterMiddle(npc);
  const chest = heroChest();
  const d = Math.hypot(chest.x - from.x, chest.y - from.y) || 1;
  const ux = (chest.x - from.x) / d;
  const uy = (chest.y - from.y) / d;
  // It leaves from just in front of the monster and meets the bubble on her
  // side facing the monster.
  const at = { x: from.x + ux * 8, y: from.y + uy * 8 - 2 };
  const to = { x: chest.x - ux * (BUBBLE_RX - 1), y: chest.y - uy * (BUBBLE_RY - 1) };
  const bmp = magicBitmap(m.bolt, m.pal);
  const t0 = performance.now();
  npc.spell = { kind: 'windup', t0, dur: MAGIC_MS.windup };
  magicFx.push({ kind: 'gather', t0, dur: MAGIC_MS.windup, at, mid: from, m, bmp });
  Sound.tune('boing');
  later(MAGIC_MS.windup, () => {
    const t1 = performance.now();
    npc.spell = { kind: 'hop', t0: t1, dur: 300 };
    magicFx.push({ kind: 'bolt', t0: t1, dur: MAGIC_MS.fly, from: at, to, m, bmp });
    magicFx.push({ kind: 'bubble', t0: t1 + 150, dur: MAGIC_MS.fly - 150 + MAGIC_MS.after, hit: MAGIC_MS.fly - 150, at: chest });
    Sound.sparkle();
  });
  later(MAGIC_MS.windup + MAGIC_MS.fly, () => {
    magicFx.push({ kind: 'burst', t0: performance.now(), dur: 650, at: to, m, bmp: magicBitmap('dot', HEART_PAL) });
    Sound.tune('clink');
  });
  return MAGIC_MS.windup + MAGIC_MS.fly;
}

// Her magic: a twinkle at her hand, then her star flies to the monster with
// a rainbow tail. Returns the time in ms until it gets there.
function heroCast(npc) {
  const to = monsterMiddle(npc);
  const h = heroWorld();
  const from = { x: h.x + (to.x < h.x ? -6 : 6), y: h.y - 19 };
  const t0 = performance.now();
  magicFx.push({ kind: 'charge', t0, dur: MAGIC_MS.charge + 120, at: from });
  magicFx.push({ kind: 'wand', t0: t0 + MAGIC_MS.charge, dur: MAGIC_MS.wand, from, to, bmp: magicBitmap('star', MAGIC_GOLD) });
  Sound.tune('harp');
  return MAGIC_MS.charge + MAGIC_MS.wand;
}

// Her star reaches it: it giggles, with hearts and a ring of rainbow twinkles.
function monsterGiggle(npc) {
  const at = monsterMiddle(npc);
  npc.spell = { kind: 'giggle', t0: performance.now(), dur: MAGIC_MS.giggle };
  magicFx.push({ kind: 'hearts', t0: performance.now(), dur: 1200, at, bmp: magicBitmap('heart', HEART_PAL) });
  caveSparks(at, 16, RAINBOW);
  Sound.tune('chime');
}

// ---- Monsters that feel alive ----------------------------------------------------

// Called by drawCharacter (js/game.js) for a monster, with its feet at
// (x, y) in world pixels. Fliers float, the others bounce now and then, and
// all of them blink; a spell makes them wobble, hop, giggle or twirl.
function drawMonster(ctx, n, x, y, now) {
  const frames = monsterFrames(n.look);
  const t = now / 1000 + n.phase;
  const flier = frames.flier;
  let frame = 0; // 0 still, 1 eyes shut, 2 squashed, 3 squashed with eyes shut
  let dx = 0;
  let dy = 0;
  let spin = 1;
  let size = 1;
  if (flier) dy = Math.round(Math.sin(t * 2.4) * 1.5);
  else {
    const k = (t / 1.9) % 1;
    if (k < 0.07) frame = 2;
    else if (k < 0.2) dy = -1;
  }
  if ((t / 3.3) % 1 < 0.04) frame |= 1;
  const sp = n.spell;
  const e = sp ? now - sp.t0 : -1;
  if (sp && e >= 0 && (e < sp.dur || sp.kind === 'twirl')) {
    const k = Math.min(1, e / sp.dur);
    const beat = Math.floor(e / 90) % 2;
    if (sp.kind === 'windup') {
      // Boing, boing: squashing down and bouncing up, leaning side to side.
      frame = beat ? 2 : 0;
      dx = beat ? 1 : -1;
      dy = beat ? 0 : -2;
    } else if (sp.kind === 'hop') {
      frame = 0;
      dy = -Math.round(Math.sin(k * Math.PI) * 4);
    } else if (sp.kind === 'giggle') {
      frame = beat ? 3 : 1;
      dx = Math.floor(e / 60) % 2 ? 1 : -1;
      dy = -Math.round(Math.abs(Math.sin(e / 70)) * 2);
    } else {
      // A twirl: it spins round twice, rising and getting smaller, and
      // stays out of sight until it goes poof.
      if (k >= 1) return;
      frame = 1;
      spin = Math.cos(k * Math.PI * 4);
      if (Math.abs(spin) < 0.2) spin = spin < 0 ? -0.2 : 0.2;
      size = 1 - k * 0.6;
      dy = -Math.round(k * 8);
    }
  }
  const sprite = frames[frame];
  const cv = sprite.canvas;
  // Soft oval shadow on the floor.
  ctx.fillStyle = 'rgba(40,30,70,0.22)';
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y), 7 * size, 2.5 * size, 0, 0, Math.PI * 2);
  ctx.fill();
  if (!n.flip && spin === 1 && size === 1) {
    ctx.drawImage(cv, Math.round(x + dx - sprite.ax), Math.round(y + dy - sprite.ay));
    return;
  }
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x + dx), Math.round(y + dy));
  ctx.scale((n.flip ? -1 : 1) * spin * size, size);
  ctx.drawImage(cv, -sprite.ax, -sprite.ay);
  ctx.restore();
}

// A monster's four pictures (still, eyes shut, squashed, squashed with eyes
// shut), made once from its pixel art and drawn by monsterSprite().
const monsterFrameCache = {};
function monsterFrames(look) {
  if (monsterFrameCache[look]) return monsterFrameCache[look];
  const m = MONSTERS[look] || MONSTERS.slime;
  const squashed = squashRows(m.rows, (MONSTER_MAGIC[look] || MONSTER_MAGIC.slime).squash);
  const frames = [m.rows, blinkRows(m.rows), squashed, blinkRows(squashed)].map((rows, i) => {
    MONSTERS[`${look}~${i}`] = { pal: m.pal, lift: m.lift, rows };
    return monsterSprite(`${look}~${i}`, 0);
  });
  frames.flier = !!m.lift;
  monsterFrameCache[look] = frames;
  return frames;
}

// Shut eyes: each eye (a column of k and w pixels with some k in it) turns
// into the face colour beside it, with one dark pixel line at the bottom.
function blinkRows(rows) {
  const out = rows.map(r => r.split(''));
  const eye = (x, y) => y < rows.length && (rows[y][x] === 'k' || rows[y][x] === 'w');
  for (let x = 0; x < rows[0].length; x++) {
    for (let y = 0; y < rows.length; y++) {
      if (!eye(x, y)) continue;
      let end = y;
      while (eye(x, end + 1)) end++;
      let dark = false;
      for (let j = y; j <= end; j++) if (rows[j][x] === 'k') dark = true;
      if (dark && end > y) {
        for (let j = y; j < end; j++) out[j][x] = faceBeside(rows[j], x);
        out[end][x] = 'k';
      }
      y = end;
    }
  }
  return out.map(r => r.join(''));
}
// The nearest colour beside pixel x in a row that is not an eye or empty.
function faceBeside(row, x) {
  for (let d = 1; d < row.length; d++) {
    for (const i of [x - d, x + d]) if (row[i] && row[i] !== 'k' && row[i] !== 'w' && row[i] !== '.') return row[i];
  }
  return row[x];
}

// Squashed down: one row of the body left out and, if there is room, the
// two middle columns doubled, so it gets a pixel shorter and wider.
function squashRows(rows, drop) {
  const w = rows[0].length;
  const h = w >> 1;
  return rows.filter((r, j) => j !== drop).map(r => (w > 16 ? r : r.slice(0, h) + r[h - 1] + r[h] + r.slice(h)));
}

// ---- Drawing the spells ----------------------------------------------------------

// Pixel pictures of magic: o is the outline, b the colour, B its light.
// Each spell looks its pictures up as it starts, so frames make nothing new.
const MAGIC_SHAPES = {
  star:   ['....o....', '...obo...', '...obo...', 'ooobBbooo', 'obbBBBbbo', '.obbBbbo.', '..obbbo..', '.obbobbo.', '.obo.obo.', '.oo...oo.'],
  heart:  ['.ooo.ooo.', 'oBBbobbbo', 'oBbbbbbbo', 'obbbbbbbo', '.obbbbbo.', '..obbbo..', '...obo...', '....o....'],
  bubble: ['...ooo...', '.ooBBboo.', '.oBBbbbo.', 'oBbbbbbbo', 'obbbbbbbo', 'obbbbbbbo', '.obbbbbo.', '.oobbboo.', '...ooo...'],
  moon:   ['....ooo..', '..ooBbbo.', '.oBbbbo..', '.obbbo...', 'obbbo....', '.obbbo...', '.obbbbo..', '..oobbbo.', '....ooo..'],
  // A little heart for the bursts.
  dot:    ['Bb.bb', 'bbbbb', '.bbb.', '..b..'],
};
const magicBitmapCache = {};
function magicBitmap(shape, pal) {
  const key = `${shape}|${pal.o}|${pal.b}`;
  if (!magicBitmapCache[key]) {
    const rows = MAGIC_SHAPES[shape];
    const cv = makeCanvas(rows[0].length, rows.length);
    drawBitmap(cv.getContext('2d'), rows, pal, 0, 0);
    magicBitmapCache[key] = cv;
  }
  return magicBitmapCache[key];
}
const HEART_PAL = { o: '#c0507a', b: '#ff9ec4', B: '#ffffff' };

// The soap bubble around her, with rainbow edges and a shine, drawn once.
const BUBBLE_RX = 13;
const BUBBLE_RY = 17;
let magicBubbleCv = null;
function magicBubble() {
  if (magicBubbleCv) return magicBubbleCv;
  const rx = BUBBLE_RX;
  const ry = BUBBLE_RY;
  const cv = makeCanvas(rx * 2 + 1, ry * 2 + 1);
  const g = cv.getContext('2d');
  const edge = ['#ffb0d6', '#e4c8ff', '#bfefff', '#c8ffd8', '#fff2a8'];
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x / (rx + 0.5)) ** 2 + (y / (ry + 0.5)) ** 2;
    if (d > 1) continue;
    const a = Math.atan2(y, x);
    let col = 'rgba(255,214,240,0.16)';
    if (d > 0.84) col = edge[Math.floor((a / Math.PI + 1) * 2.5) % edge.length];
    else if (d > 0.52 && d < 0.7 && Math.abs(a + 2.2) < 0.45) col = 'rgba(255,255,255,0.85)';
    px(g, x + rx, y + ry, 1, 1, col);
  }
  px(g, rx - 7, ry - 12, 2, 2, '#ffffff');
  magicBubbleCv = cv;
  return cv;
}

// A soft round glow in one colour, drawn once per colour.
const magicGlowCache = {};
function magicGlow(color) {
  if (!magicGlowCache[color]) {
    const cv = makeCanvas(32, 32);
    const g = cv.getContext('2d');
    const n = parseInt(color.slice(1), 16);
    const rgb = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, `rgba(${rgb},0.9)`);
    grad.addColorStop(0.4, `rgba(${rgb},0.35)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    magicGlowCache[color] = cv;
  }
  return magicGlowCache[color];
}

// The camera and zoom for this frame, so drawing needs no new objects.
let magicCamX = 0;
let magicCamY = 0;
let magicS = 1;

// Called from drawOverlay every frame in the princess edition.
function drawMagicFx(now) {
  if (state.scene.kind !== 'dungeon') { magicFx.length = 0; return; }
  if (!magicFx.length) return;
  const ctx = sctx;
  magicS = state.scale;
  magicCamX = Math.round(state.cam.x);
  magicCamY = Math.round(state.cam.y);
  for (let i = magicFx.length - 1; i >= 0; i--) if (now - magicFx[i].t0 >= magicFx[i].dur) magicFx.splice(i, 1);
  for (let i = 0; i < magicFx.length; i++) {
    const f = magicFx[i];
    const ms = now - f.t0;
    if (ms < 0) continue;
    const k = ms / f.dur;
    if (f.kind === 'gather') magicDrawGather(ctx, f, k, now);
    else if (f.kind === 'bolt') magicDrawBolt(ctx, f, k, now);
    else if (f.kind === 'bubble') magicDrawBubble(ctx, f, ms);
    else if (f.kind === 'burst') magicDrawBurst(ctx, f, k);
    else if (f.kind === 'charge') magicDrawCharge(ctx, f, k);
    else if (f.kind === 'wand') magicDrawWand(ctx, f, k, now);
    else if (f.kind === 'hearts') magicDrawHearts(ctx, f, k);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

// A four-pointed twinkle at world point (wx, wy), its arms `a` pixels long.
function magicTwinkle(ctx, wx, wy, a, color) {
  const s = magicS;
  const x = (Math.round(wx) - magicCamX) * s;
  const y = (Math.round(wy) - magicCamY) * s;
  ctx.fillStyle = color;
  ctx.fillRect(x - a * s, y, (a * 2 + 1) * s, s);
  ctx.fillRect(x, y - a * s, s, (a * 2 + 1) * s);
  if (a > 1) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, s, s);
  }
}

// A pixel picture centred on world point (wx, wy).
function magicBlit(ctx, cv, wx, wy) {
  const s = magicS;
  ctx.drawImage(cv, (Math.round(wx - cv.width / 2) - magicCamX) * s, (Math.round(wy - cv.height / 2) - magicCamY) * s, cv.width * s, cv.height * s);
}

// A soft light of radius r world pixels.
function magicGlowAt(ctx, wx, wy, r, color, alpha) {
  const s = magicS;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.drawImage(magicGlow(color), (wx - r - magicCamX) * s, (wy - r - magicCamY) * s, r * 2 * s, r * 2 * s);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

// Sparkles in the monster's colours swirl in, and its magic grows in front of it.
function magicDrawGather(ctx, f, k, now) {
  const c = f.m.colors;
  const r = (1 - k) * 16;
  magicGlowAt(ctx, f.mid.x, f.mid.y, 12 + k * 6 + Math.sin(now / 60), c[0], 0.15 + k * 0.2);
  magicGlowAt(ctx, f.at.x, f.at.y, 3 + k * 10, c[0], 0.4 + k * 0.5);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + k * Math.PI * 1.5;
    magicTwinkle(ctx, f.at.x + Math.cos(a) * r, f.at.y + Math.sin(a) * r * 0.7, 1 + (i % 2), c[i % 3]);
  }
  if (k > 0.55) magicBlit(ctx, f.bmp, f.at.x, f.at.y + (Math.floor(now / 90) % 2));
  else magicTwinkle(ctx, f.at.x, f.at.y, k > 0.25 ? 2 : 1, c[1]);
}

// The magic flies to her in a little arc, twinkles trailing behind.
function magicDrawBolt(ctx, f, k, now) {
  const c = f.m.colors;
  for (let j = 6; j >= 1; j--) {
    const t = k - j * 0.06;
    if (t <= 0) continue;
    ctx.globalAlpha = 1 - j / 7;
    magicTwinkle(ctx, f.from.x + (f.to.x - f.from.x) * t, f.from.y + (f.to.y - f.from.y) * t - Math.sin(t * Math.PI) * 12, j < 4 ? 1 : 0, c[j % 3]);
  }
  ctx.globalAlpha = 1;
  const x = f.from.x + (f.to.x - f.from.x) * k;
  const y = f.from.y + (f.to.y - f.from.y) * k - Math.sin(k * Math.PI) * 12;
  magicGlowAt(ctx, x, y, 14, c[0], 0.85);
  magicBlit(ctx, f.bmp, x, y + (Math.floor(now / 90) % 2));
}

// The soap bubble: pops up, wobbles when the magic lands, and fades away
// in a few little bubbles floating up.
function magicDrawBubble(ctx, f, ms) {
  const s = magicS;
  const cv = magicBubble();
  const pop = Math.min(1, ms / 150);
  let sx = pop < 1 ? 0.4 + pop * 0.7 : 1;
  let sy = sx;
  const j = ms - f.hit;
  if (j > 0 && j < 320) {
    const w = Math.sin(j / 320 * Math.PI * 3) * (1 - j / 320) * 0.1;
    sx += w;
    sy -= w;
  }
  const fade = ms > f.dur - 320 ? Math.max(0, (f.dur - ms) / 320) : 1;
  const w = Math.round(cv.width * sx);
  const h = Math.round(cv.height * sy);
  const x = (Math.round(f.at.x - w / 2) - magicCamX) * s;
  const y = (Math.round(f.at.y - h / 2) - magicCamY) * s;
  ctx.globalAlpha = fade;
  ctx.drawImage(cv, x, y, w * s, h * s);
  // A bright flash as the magic lands on it.
  if (j > 0 && j < 220) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (1 - j / 220) * 0.7;
    ctx.drawImage(cv, x, y, w * s, h * s);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (fade < 1) {
    const up = (1 - fade) * 14;
    ctx.globalAlpha = fade;
    for (let i = 0; i < 5; i++) {
      const bx = f.at.x + (i - 2) * 6 + Math.sin(ms / 120 + i) * 1.5;
      const by = f.at.y - 6 - up - (i % 2) * 5;
      const r = 1 + (i % 2);
      px(ctx, (Math.round(bx) - magicCamX) * s, (Math.round(by) - magicCamY) * s, r * 2 * s, r * 2 * s, 'rgba(255,214,240,0.5)');
      px(ctx, (Math.round(bx) - magicCamX) * s, (Math.round(by) - magicCamY) * s, s, s, '#ffffff');
    }
  }
  ctx.globalAlpha = 1;
}

// Where the magic lands on the bubble: little hearts and twinkles spring out.
function magicDrawBurst(ctx, f, k) {
  const c = f.m.colors;
  const d = (1 - (1 - k) * (1 - k)) * 15;
  magicGlowAt(ctx, f.at.x, f.at.y, 12 * (1 - k), c[0], 0.8 * (1 - k));
  ctx.globalAlpha = k > 0.5 ? (1 - k) * 2 : 1;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + 0.4;
    const x = f.at.x + Math.cos(a) * d;
    const y = f.at.y + Math.sin(a) * d * 0.8 - k * 5;
    if (i % 2) magicBlit(ctx, f.bmp, x, y);
    else magicTwinkle(ctx, x, y, k < 0.5 ? 2 : 1, c[(i / 2) % 3]);
  }
  ctx.globalAlpha = 1;
}

// A twinkle growing at her hand before her star flies.
function magicDrawCharge(ctx, f, k) {
  magicGlowAt(ctx, f.at.x, f.at.y, 4 + k * 8, '#fff07a', 0.8);
  magicTwinkle(ctx, f.at.x, f.at.y, k < 0.3 ? 1 : k < 0.7 ? 2 : 3, RAINBOW[Math.floor(k * 12) % RAINBOW.length]);
}

// Her golden star flies to the monster with a rainbow tail.
function magicDrawWand(ctx, f, k, now) {
  for (let j = RAINBOW.length; j >= 1; j--) {
    const t = k - j * 0.05;
    if (t <= 0) continue;
    ctx.globalAlpha = 1 - j / (RAINBOW.length + 2);
    const x = f.from.x + (f.to.x - f.from.x) * t;
    const y = f.from.y + (f.to.y - f.from.y) * t - Math.sin(t * Math.PI) * 12;
    magicTwinkle(ctx, x, y, j < 4 ? 1 : 0, RAINBOW[j - 1]);
    magicTwinkle(ctx, x, y + 2, 0, RAINBOW[j - 1]);
  }
  ctx.globalAlpha = 1;
  const x = f.from.x + (f.to.x - f.from.x) * k;
  const y = f.from.y + (f.to.y - f.from.y) * k - Math.sin(k * Math.PI) * 12;
  magicGlowAt(ctx, x, y, 12, '#fff07a', 0.8);
  magicBlit(ctx, f.bmp, x, y + (Math.floor(now / 90) % 2));
}

// Hearts floating up from a giggling monster, and a ring of rainbow twinkles.
function magicDrawHearts(ctx, f, k) {
  if (k < 0.45) {
    const r = 4 + k / 0.45 * 16;
    ctx.globalAlpha = 1 - k / 0.45;
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      magicTwinkle(ctx, f.at.x + Math.cos(a) * r, f.at.y + Math.sin(a) * r * 0.75, 1, RAINBOW[i % RAINBOW.length]);
    }
  }
  ctx.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1;
  for (let i = 0; i < 3; i++) {
    const t = k * 1.2 - i * 0.15;
    if (t <= 0) continue;
    magicBlit(ctx, f.bmp, f.at.x + (i - 1) * 9 + Math.sin(t * 9 + i) * 2, f.at.y - 6 - t * 22);
  }
  ctx.globalAlpha = 1;
}
