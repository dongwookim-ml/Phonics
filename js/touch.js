// Touch and hear: tapping a thing on the map makes it move, sparkle and
// play a little sound, and the narrator says its English word while the
// word shows big over it (first letter in its letter's colour). A thing
// says its word from `react` ({ word, fx }), set where the scene is built,
// or from `canvas.touch` on shared sprites such as trees (see touchable in
// js/sprites.js). No stars or coins come from this.

// What each effect does: how the thing moves, the colours of the sparkles
// that fly out (`up` sends them upward like a splash, `fall` lets them
// drift down like leaves), an emoji that pops out and a tune (Sound.tune).
const TOUCH_FX = {
  hop:     { move: 'hop' },
  boing:   { move: 'hop', tune: 'boing' },
  leaves:  { move: 'shake', colors: ['#5fc46a', '#9be88a', '#3f9f58', '#d8ffb8'], fall: true },
  petals:  { move: 'shake', colors: ['#ff9cc8', '#ffd0e6', '#ffffff', '#c8a8ff'], fall: true },
  stars:   { move: 'shake', colors: ['#fff6a8', '#ffd34d', '#ffffff', '#a8d8ff'], star: true, tune: 'chime' },
  sparkle: { move: 'hop', colors: ['#ffffff', '#bfefff', '#ff9cf0', '#fff6a8'], star: true, tune: 'chime' },
  rainbow: { move: 'none', colors: ['#ff8a9a', '#ffbe7a', '#ffe680', '#8fe0a8', '#8fc8ff', '#c4a8ff'], star: true, tune: 'chime' },
  splash:  { move: 'none', colors: ['#bfeaff', '#ffffff', '#6cc4f0', '#a8e6ff'], up: true, tune: 'splash' },
  bubbles: { move: 'hop', colors: ['#ffffff', '#d4f0ff', '#ff9ec4', '#bfeaff'], up: true, tune: 'splash' },
  puff:    { move: 'hop', colors: ['#ffffff', '#e8e8fa', '#d8f0ff'] },
  glow:    { move: 'none', colors: ['#fff2a8', '#ffffff', '#ffd34d'], star: true, tune: 'chime' },
  zzz:     { move: 'hop', pop: '💤' },
  toy:     { move: 'hop', pop: '🧸', tune: 'boing' },
  frog:    { move: 'hop', pop: '🐸', tune: 'boing' },
  harp:    { move: 'shake', pop: '🎵', tune: 'harp' },
  coins:   { move: 'hop', colors: ['#ffd34d', '#ffe680', '#e0a52a', '#ffffff'], star: true, tune: 'clink' },
  rumble:  { move: 'shake', colors: ['#ff8a3a', '#ffd34d', '#ff5a3a', '#d8d0e0'], up: true, tune: 'rumble' },
  honk:    { move: 'hop', pop: '💨', tune: 'honk' },
};
// A thing reacts again only after this long, so fast tapping doesn't pile up.
const TOUCH_GAP = 1500;
// Words and emoji floating over things: { text, x, y, t0, pop }.
const touchShows = [];

// Reacts to a tap on a map object. False when it has nothing to say.
function touchObject(o, wx, wy) {
  const spec = o.react || (o.canvas && o.canvas.touch);
  if (!spec) return false;
  const top = Math.max(paintedTop(o) - 4, wy - 70);
  touchReact(o, spec, { x: wx, y: wy }, { x: wx, y: top });
  return true;
}

// The effect, sound, word and voice for one thing. `at` is where the
// sparkles start, `label` where the word shows.
function touchReact(thing, spec, at, label) {
  const now = performance.now();
  // Tapped again right away: just a wiggle, not the word again.
  if (thing.touchedAt && now - thing.touchedAt < TOUCH_GAP) {
    touchNudge(thing);
    return;
  }
  thing.touchedAt = now;
  const fx = TOUCH_FX[spec.fx] || TOUCH_FX.hop;
  thing.touchFx = { move: fx.move, t0: now };
  Sound.tap();
  if (fx.tune) Sound.tune(fx.tune);
  if (fx.colors) touchBurst(at, fx);
  if (fx.pop) touchShows.push({ text: fx.pop, x: at.x, y: at.y - 6, t0: now, pop: true });
  if (spec.word) {
    touchShows.push({ text: spec.word, x: label.x, y: label.y, t0: now });
    setTimeout(() => Sound.say([{ text: `${spec.word}!`, narrator: true }]), 120);
  }
}

// Something with nothing to say still wiggles, instead of the tap walking
// her to a hidden tile behind it.
function touchNudge(o) {
  o.touchFx = { move: 'shake', t0: performance.now() };
  Sound.tap();
}

// A picture on a wall. In a letter house it says what its word starts with
// ("apple starts with A."), elsewhere just the word.
function touchPicture(d) {
  const now = performance.now();
  d.touchFx = { move: 'hop', t0: now };
  Sound.tap();
  if (d.touchedAt && now - d.touchedAt < TOUCH_GAP) return;
  d.touchedAt = now;
  if (!d.word) return;
  // Under the picture, clear of the letter poster beside it.
  touchShows.push({ text: d.word, x: d.x, y: d.y + 18, t0: now });
  Sound.say([{ text: d.letter ? `${d.word} starts with ${d.letter}.` : `${d.word}!`, narrator: true }]);
}

// A letter house's big letter poster: the letter's name, then the host
// says what it sounds like (houseHello in js/game.js).
function touchPoster(sg) {
  const now = performance.now();
  sg.touchFx = { move: 'hop', t0: now };
  Sound.tap();
  if (sg.touchedAt && now - sg.touchedAt < TOUCH_GAP) return;
  sg.touchedAt = now;
  const info = sg.poster;
  const host = state.scene.npcs.find(n => n.letter === info.letter);
  Sound.say([{ text: info.letter, narrator: true }, { pause: 300 }, { text: houseHello(info) }], voiceOf(host));
}

// Water splashes and says "pond".
const touchWaterAt = {};
function touchWater(wx, wy) {
  touchReact(touchWaterAt, { word: 'pond', fx: 'splash' }, { x: wx, y: wy }, { x: wx, y: wy - 20 });
}

function touchBurst(at, fx) {
  for (let i = 0; i < 18; i++) {
    const a = fx.up ? -Math.PI / 2 + (Math.random() - 0.5) * 1.6 : Math.random() * Math.PI * 2;
    const s = 15 + Math.random() * (fx.up ? 50 : 35);
    state.particles.push({
      x: at.x + (Math.random() - 0.5) * 8, y: at.y - 4, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (fx.fall ? 5 : 30),
      life: 0.7 + Math.random() * 0.6, color: fx.colors[i % fx.colors.length], star: fx.star && i % 3 === 0,
    });
  }
}

// The top of what is painted on an object's canvas, in world pixels.
function paintedTop(o) {
  const cv = o.canvas;
  if (cv.topRow === undefined) {
    const a = o.alpha || cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let y = 0;
    find: for (; y < o.h; y++) for (let x = 0; x < o.w; x++) if (a[(y * o.w + x) * 4 + 3] > 40) break find;
    cv.topRow = Math.min(y, o.h - 1);
  }
  return o.y + cv.topRow;
}

// How far a tapped thing is moved right now: a quick shake or a hop.
function touchMove(thing, now) {
  const f = thing.touchFx;
  const k = f ? Math.max(0, (now - f.t0) / 450) : 1;
  if (k >= 1) { thing.touchFx = null; return null; }
  const fade = 1 - k;
  if (f.move === 'shake') return { x: Math.round(Math.sin(k * 30) * 2 * fade), y: 0 };
  if (f.move === 'hop') return { x: 0, y: -Math.round(Math.abs(Math.sin(k * Math.PI * 2)) * 4 * fade) };
  return null;
}

// Draws the floating words and emoji (called from drawOverlay).
function drawTouchShows(now) {
  const s = state.scale;
  const ctx = sctx;
  const font = '"Baloo 2", "Trebuchet MS", sans-serif';
  for (let i = touchShows.length - 1; i >= 0; i--) {
    const w = touchShows[i];
    const k = Math.max(0.01, (now - w.t0) / (w.pop ? 1100 : 1600));
    if (k >= 1) { touchShows.splice(i, 1); continue; }
    const p = toScreen(w.x, w.y - (w.pop ? k * 22 : k * 6));
    p.y = Math.max(p.y, 30 * s); // below the buttons at the top of the screen
    ctx.globalAlpha = Math.min(1, k * 8, (1 - k) * 4);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${(w.pop ? 12 : 17) * s}px ${font}`;
    if (w.pop) {
      ctx.textAlign = 'center';
      ctx.fillText(w.text, p.x, p.y);
      continue;
    }
    // The word, with its first letter in that letter's colour.
    const first = w.text.charAt(0);
    const rest = w.text.slice(1);
    const fw = ctx.measureText(first).width;
    const half = ctx.measureText(w.text).width / 2;
    const x0 = Math.min(screen.width - half - 6 * s, Math.max(half + 6 * s, p.x)) - half;
    const letter = LETTERS.find(l => l.letter === first.toUpperCase());
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4 * s;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(w.text, x0, p.y);
    ctx.fillStyle = letter ? shade(letter.color, -20) : '#ff6fa8';
    ctx.fillText(first, x0, p.y);
    ctx.fillStyle = '#4a2c4f';
    ctx.fillText(rest, x0 + fw, p.y);
  }
  ctx.globalAlpha = 1;
}
