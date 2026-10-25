// One little game in each village (VILLAGE_GAMES in js/data.js), run by
// js/minigame.js and started from one villager's dialog there. In three of
// them three pictures stand in a row and she taps one:
//  - Starlight Forest (rhyme): "Which one rhymes with cat?" and she hops on
//    the mushroom with the 🎩; in Dinosaur Village she hatches the egg.
//  - Unicorn Village (blend): she hears /c/ /a/ /t/ and taps the unicorn
//    whose cloud shows the 🐱, which gallops off; in Car Village the car,
//    which races over the finish line.
//  - Crystal Cave (read): "cat" is written at the top and nobody says it;
//    she opens the chest with the 🐱; in the Villain Cave she frees the
//    crystal. Only a miss sounds the word out.
// In the fourth she spells:
//  - Fairy Village (spell): she hears "cat" and taps c, a, t in order on
//    the bubbles little fairies carry (each says its sound); in Drone
//    Village drones carry letter boxes.
// Every round is a question from js/quiz.js of the village's own kind, at
// her tier for it (state.skill) capped like the village asks it, with
// three pictures (four letters): its hint after a miss and its answer
// after two, all lines already recorded. The narrator says what to do once
// at the start (LINES.miniRhyme...). Answers here don't move her tier or
// give stars; the coins come at the end.

const VG_GROUND = 104;          // where things stand, in picture pixels
const VG_ROW = [84, 132, 180];  // the three pictures
const VG_INK = '#3a2c50';

// ---- Questions ---------------------------------------------------------------

// The villager who runs a village's game (not a home's resident who looks
// the same). A caught cave monster is away for a while.
function vgHost(scene) {
  const sc = state.scenes[scene];
  const look = VILLAGE_GAMES[scene].host;
  return sc ? sc.npcs.find(n => n.look === look && !n.mount) || null : null;
}

// Her tier for a kind, capped like the village asks it.
function vgTier(kind, cap) {
  const t = ((state.skill || {})[kind] || {}).t || 1;
  return Math.max(1, Math.min(t, cap, Quiz.tierMax(kind)));
}

// A game's questions, each with another answer. `cfg` changes the tier's
// settings (three cards); `ok` turns a question down if it can (pictures
// she could call something else). A forced question never moves her tier.
function vgQuestions(kind, cap, cfg, ok = () => true) {
  const tier = vgTier(kind, cap);
  const out = [];
  for (let i = 0; out.length < VILLAGE_GAMES.rounds && i < 80; i++) {
    const q = Quiz.make({}, { kind, tier, cfg: cfg(tier) });
    if (!out.some(x => x.target === q.target) && (ok(q) || i >= 60)) out.push(q);
  }
  return out;
}

const vgWord = w => Quiz.words()[w] || { w, e: '❓' };
// Pictures she names for sure (WEAK_PICTURES aren't): the rhyme cards in
// the questions show the word too, but here there is just the picture.
const vgClear = q => q.options.every(o => vgWord(o.wrong).pic >= 2);
// The question's own lines, without the mark for when it has been heard.
const vgAsked = q => q.ask.filter(p => p !== Quiz.READY);
// What to do, said by the narrator once at the start (LINES.miniRhyme...).
const vgSay = kind => ({ text: line(kind), narrator: true });
// The answer shown after two misses: what she picked, "Here it is!" and the answer.
const vgShow = (q, it) => q.picked(it.o).concat({ pause: 400 }, { text: line('showMe') }, { pause: 300 }, q.model);
// The village's picture (🌲) before the game's name.
const vgIcon = scene => place(scene).split(' ')[0];

// How far a new thing has come in (0 to 1): they pop up one after another.
const vgIn = (it, now) => (it.born ? Math.max(0, Math.min(1, (now - it.born) / 260)) : 1);
// A wrong one shakes for a moment.
const vgShake = (it, now) => (it.t0 && now - it.t0 < 420 ? Math.round(Math.sin((now - it.t0) / 30) * 2) : 0);
const vgGrey = c => mix(c, '#aaa6bc', 0.7);
const vgEase = u => u * u * (3 - 2 * u);

// A little sprite painted on a grid, with an ink outline round it. `grey`
// paints it faded (a wrong one).
function vgSprite(W, H, paint, grey) {
  const grid = Array.from({ length: H }, () => new Array(W).fill(null));
  const set = (x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < W && y < H) grid[y][x] = grey ? vgGrey(c) : c;
  };
  paint(set);
  const cv = makeCanvas(W, H);
  const g = cv.getContext('2d');
  const ink = grey ? vgGrey(VG_INK) : VG_INK;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[y][x]) px(g, x, y, 1, 1, grid[y][x]);
    else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy] && grid[y + dy][x + dx])) px(g, x, y, 1, 1, ink);
  }
  return cv;
}
const vgCache = new Map();
const vgCached = (key, make) => { if (!vgCache.has(key)) vgCache.set(key, make()); return vgCache.get(key); };
// Fills an ellipse on a sprite grid.
function vgOval(set, cx, cy, rx, ry, col) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) set(x, y, typeof col === 'function' ? col(x, y) : col);
  }
}

// The villager who runs the game, standing at the left.
function vgDrawHost(g, x, now) {
  const n = mini.npc;
  const f = Math.floor(now / 600) % 2;
  const s = n.unicorn ? unicornSprite(n.unicorn, f) : villagerSprite(n.look, n.monster ? f : 0);
  g.drawImage(s.canvas, Math.round(x - s.ax), Math.round(VG_GROUND - s.ay));
}

// Bands of sky down to `to`, then nothing (the ground goes over it).
function vgSky(g, LW, to, cols) {
  const band = Math.max(1, Math.ceil(to / cols.length));
  cols.forEach((c, i) => px(g, 0, i * band, LW, band, c));
}

// A soft ground shadow.
function vgShadow(g, x, y, rx) {
  g.fillStyle = 'rgba(30,20,70,0.2)';
  g.beginPath();
  g.ellipse(x, y, rx, rx / 3.5, 0, 0, Math.PI * 2);
  g.fill();
}

// A yellow ring of dots round the one that is shown after two misses.
function vgGlowRing(g, x, y, rx, ry, now) {
  const col = Math.floor(now / 200) % 2 ? '#fff27a' : '#ffc21a';
  for (let a = 0; a < Math.PI * 2; a += 0.1) px(g, Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry), 1, 1, col);
}

// ---- Games where she picks one of three pictures ------------------------------

// `skin` is the game's look in this edition: its name, pictures, what it
// says and how it draws. Each picture `it` stands at (it.x, it.y).
function vgPickGame(scene, cap, skin) {
  const kind = VILLAGE_GAMES[scene].kind;
  const ok = kind === 'rhyme' ? vgClear : undefined;
  const picAt = (it, t, now) => {
    const p = skin.picAt(it, t, now);
    return p && { x: p.x + vgShake(it, now), y: p.y + (1 - vgIn(it, now)) * 10, s: p.s };
  };
  return {
    scene,
    host: () => vgHost(scene),
    label: () => `${vgIcon(scene)} ${skin.name}`,
    title: () => `${vgIcon(scene)} ${skin.name}`,
    pip: () => skin.pip,
    bag: () => skin.bag,
    rounds: () => vgQuestions(kind, cap, () => ({ n: VILLAGE_GAMES.choices }), ok)
      .map(q => ({ q, opts: q.options.map(o => ({ o, w: o.wrong, e: vgWord(o.wrong).e, right: !!o.right })) })),
    items: r => r.opts.map((x, i) => Object.assign({}, x, skin.spot(i), { i, look: skin.looks[(mini.round * 2 + i) % skin.looks.length], state: 'live', born: performance.now() + i * 140, glow: false })),
    clue: r => ({ text: skin.clue(r), color: skin.color }),
    ask: skin.ask,
    replay: skin.replay,
    answer: r => r.q.answer,
    teach: (r, it) => r.q.teach(it.o),
    show: (r, it) => vgShow(r.q, it),
    done: () => [{ text: line('praise') }, { pause: 300 }, vgSay('miniDone')],
    catchMs: () => skin.catchMs,
    rows: [24, 118],
    box: it => ({ x0: it.x - 22, x1: it.x + 22, y0: it.y - 50, y1: it.y + 4 }),
    pointAt: (it, t) => picAt(it, t, performance.now()),
    caught: skin.caught,
    update: skin.update,
    draw: {
      backdrop: skin.backdrop,
      back: skin.back,
      item: (g, it, t, now) => {
        const rise = Math.round((1 - vgIn(it, now)) * 10);
        if (vgIn(it, now) <= 0) return;
        if (it.glow && it.state === 'live') vgGlowRing(g, it.x, it.y - 22, 24, 30, now);
        skin.item(g, it, it.x + vgShake(it, now), it.y + rise, t, now);
      },
      front: skin.front,
      labels: (t, now) => mini.items.map(it => {
        const p = picAt(it, t, now);
        return p && vgIn(it, now) > 0 && { text: it.e, x: p.x, y: p.y, size: skin.picSize * (p.s || 1), alpha: (it.state === 'out' ? 0.4 : 1) * vgIn(it, now) };
      }).filter(Boolean),
    },
  };
}

// How far the right one's little show has gone (0 to 1), or -1.
const vgWon = (it, now) => (mini.anim && mini.anim.it === it ? Math.min(1, (now - mini.anim.t0) / mini.game.catchMs()) : -1);

// ---- Starlight Forest: hop on the mushroom that rhymes ------------------------

const VG_STUMP = { x: 46, y: VG_GROUND - 9 };

// A big toadstool with a white patch on its cap for the picture.
function vgShroom(color, grey) {
  return vgCached(`shroom|${color}|${grey}`, () => vgSprite(42, 38, set => {
    vgOval(set, 21, 30, 6.5, 8, (x) => (x < 18 ? '#ead8c0' : x > 23 ? '#fffaf2' : '#fff3e0'));
    for (let y = 2; y <= 22; y++) for (let x = 1; x <= 40; x++) {
      const u = (x + 0.5 - 21) / 19.5;
      const v = (y + 0.5 - 21) / 19;
      if (u * u + v * v > 1) continue;
      set(x, y, y > 18 ? shade(color, -35) : x < 10 ? shade(color, -18) : x > 33 ? shade(color, 18) : color);
    }
    for (const [x, y, r] of [[7, 15, 2], [35, 14, 2.2], [11, 7, 1.6], [31, 6, 1.6]]) vgOval(set, x, y, r, r, '#ffffff');
    vgOval(set, 21, 12, 8.5, 7.5, '#ffffff');
  }, grey));
}

// A stump with rings on top.
function vgStump(g) {
  const { x, y } = VG_STUMP;
  vgShadow(g, x, VG_GROUND, 11);
  px(g, x - 8, y, 16, VG_GROUND - y, '#7a4a2e');
  px(g, x - 7, y, 14, VG_GROUND - y, '#9a6a3e');
  px(g, x - 7, y, 3, VG_GROUND - y, '#8a5a34');
  px(g, x - 8, y - 2, 16, 3, '#5a3a24');
  px(g, x - 7, y - 2, 14, 2, '#d8a870');
  px(g, x - 4, y - 2, 8, 1, '#c08a50');
  px(g, x - 1, y - 2, 2, 1, '#a8703f');
}

// Where she is: on the stump, or hopping onto the mushroom she picked.
function vgHeroAt(now) {
  const a = mini.anim;
  const it = a && a.it;
  if (!it) return { x: VG_STUMP.x, y: VG_STUMP.y - 2 };
  const k = vgWon(it, now);
  const top = { x: it.x, y: it.y - 31 };
  if (k < 0.45) {
    const u = vgEase(k / 0.45);
    return { x: VG_STUMP.x + (top.x - VG_STUMP.x) * u, y: VG_STUMP.y - 2 + (top.y - VG_STUMP.y + 2) * u - Math.sin(u * Math.PI) * 16 };
  }
  return { x: top.x, y: top.y + (k < 0.6 ? 2 : 0) - (k > 0.65 && k < 0.85 ? Math.round(Math.sin((k - 0.65) / 0.2 * Math.PI) * 5) : 0) };
}

const VG_FOREST = {
  name: '버섯 점프 놀이',
  pip: '🍄',
  bag: '🍄',
  color: '#3f8f6a',
  picSize: 12.5,
  catchMs: 1500,
  looks: ['#ff6b7f', '#b98cff', '#ffb347', '#5fb8ff', '#ff8fc0'],
  spot: i => ({ x: VG_ROW[i], y: VG_GROUND }),
  clue: r => `${vgWord(r.q.base).e} ${r.q.base}`,
  // "Hop on the mushroom that rhymes!" "Which one rhymes with… cat?"
  ask: (r, first) => (first ? [vgSay('miniRhyme'), { pause: 400 }] : []).concat(vgAsked(r.q)),
  replay: r => vgAsked(r.q),
  picAt: (it, t, now) => {
    const squash = vgWon(it, now) > 0.45 && vgWon(it, now) < 0.62 ? 2 : 0;
    return { x: it.x, y: it.y - 26 + squash + (it.state === 'out' ? 3 : 0) };
  },
  backdrop(g, LW, LH, bx, by, t) {
    const G = by + VG_GROUND;
    vgSky(g, LW, G - 10, ['#2c2a6a', '#36337a', '#433d8c', '#55489e', '#6a58b0']);
    // Twinkling stars, far pines, near pines, then the mossy ground.
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(hash(i, 1, 91) * LW);
      const y = Math.floor(hash(i, 2, 91) * Math.max(1, G - 40));
      if (Math.sin(t * 2 + i * 1.7) > -0.3) px(g, x, y, 1, 1, i % 4 ? '#fff6c8' : '#ffffff');
    }
    for (const [step, base, h, col] of [[22, G - 16, 26, '#2e4a7a'], [30, G - 10, 34, '#24605a']]) {
      for (let x0 = -((bx * (step === 22 ? 0.5 : 1)) % step) - step; x0 < LW + step; x0 += step) {
        const hh = h + ((x0 / step) % 3) * 4;
        for (let y = 0; y < hh; y++) {
          const w = Math.round((y / hh) * step * 0.45);
          px(g, x0 + step / 2 - w, base - hh + y, w * 2 + 1, 1, col);
        }
      }
    }
    px(g, 0, G - 10, LW, LH - G + 10, '#4e9a62');
    px(g, 0, G - 10, LW, 2, '#6cbc74');
    for (let i = 0; i < LW; i += 6) px(g, i + (i % 4), G - 6 + ((i * 7) % 14), 1, 1, (i / 6) % 3 < 1 ? '#8fe08a' : (i / 6) % 3 < 2 ? '#3e8a52' : '#fff27a');
    // Fireflies.
    for (let i = 0; i < 9; i++) {
      const x = Math.round((hash(i, 3, 91) * (LW + 20) + t * 6 * (1 + (i % 3))) % (LW + 20) - 10);
      const y = Math.round(G - 22 - hash(i, 4, 91) * 44 + Math.sin(t * 1.5 + i) * 4);
      if (Math.sin(t * 3 + i * 2) > -0.4) { px(g, x, y, 1, 1, '#fff6a0'); px(g, x - 1, y, 3, 1, 'rgba(255,240,140,0.35)'); }
    }
  },
  back(g, t, now) {
    vgDrawHost(g, 16, now);
    vgStump(g);
  },
  item(g, it, x, y) {
    vgShadow(g, x, VG_GROUND, 14);
    g.drawImage(vgShroom(it.look, it.state === 'out'), x - 21, y - 37 + (it.state === 'out' ? 3 : 0));
  },
  // The mushroom she picked, squashed a little as she lands, and her on it.
  front(g, t, now) {
    const it = mini.anim && mini.anim.it;
    if (it) {
      const k = vgWon(it, now);
      vgShadow(g, it.x, VG_GROUND, 14);
      g.drawImage(vgShroom(it.look, false), it.x - 21, it.y - 37 + (k > 0.45 && k < 0.62 ? 2 : 0));
    }
    const h = vgHeroAt(now);
    const s = heroSprite(state.outfit, it && vgWon(it, now) < 0.45 ? 1 : 0);
    g.drawImage(s.canvas, Math.round(h.x - s.ax), Math.round(h.y - s.ay));
  },
  // Sparkles as she lands.
  update(dt, now) {
    const a = mini.anim;
    if (a && !a.landed && vgWon(a.it, now) >= 0.45) {
      a.landed = true;
      Sound.tune('boing');
      miniSpark(a.it.x, a.it.y - 34, 18, i => ['#fff27a', '#ffffff', '#ff9ec4'][i % 3], 50);
    }
  },
};

// ---- Dinosaur Village: hatch the egg that rhymes -------------------------------

// A speckled egg with a white patch for the picture: whole, or its top or
// bottom half (cracked along a zigzag).
function vgEgg(color, grey, part) {
  return vgCached(`egg|${color}|${grey}|${part}`, () => vgSprite(30, 36, set => {
    const crack = x => 17 + ((x >> 1) % 2 ? 2 : 0);
    vgOval(set, 15, 19, 12.5, 15.5, (x, y) => {
      if ((part === 'top' && y >= crack(x)) || (part === 'bottom' && y < crack(x))) return null;
      return x < 8 ? '#f0e2c0' : x > 22 ? '#fffdf2' : '#fff6dc';
    });
    for (const [x, y, r] of [[8, 8, 1.8], [21, 6, 1.5], [5, 22, 1.5], [25, 25, 1.8], [11, 31, 1.3], [24, 15, 1.2]]) {
      vgOval(set, x, y, r, r, (xx, yy) => ((part === 'top' && yy >= crack(xx)) || (part === 'bottom' && yy < crack(xx)) ? null : color));
    }
    vgOval(set, 15, 19, 8.5, 8, (x, y) => ((part === 'top' && y >= crack(x)) || (part === 'bottom' && y < crack(x)) ? null : '#ffffff'));
  }, grey));
}
// The baby dino that hatches: a round green head with a yellow crest.
function vgBabyDino() {
  return vgCached('babydino', () => vgSprite(22, 20, set => {
    vgOval(set, 11, 12, 8, 7, (x, y) => (y > 14 ? '#a8e890' : '#7ed36a'));
    for (const x of [6, 10, 14]) { set(x, 4, '#ffd34d'); set(x, 5, '#ffd34d'); set(x + 1, 4, '#ffd34d'); }
    for (const x of [7, 13]) { set(x, 9, '#ffffff'); set(x, 10, '#ffffff'); set(x + 1, 9, '#ffffff'); set(x + 1, 10, '#2a2040'); }
    for (const x of [8, 9, 10, 11, 12]) set(x, 15, x === 8 || x === 12 ? '#7ed36a' : '#e0506a');
    set(5, 13, '#ffadbc');
    set(17, 13, '#ffadbc');
  }));
}

function vgNest(g, x) {
  vgShadow(g, x, VG_GROUND, 17);
  for (let i = -16; i <= 16; i++) {
    const h = Math.round(4 - Math.abs(i) / 6);
    px(g, x + i, VG_GROUND - h, 1, h + 1, i % 3 ? '#c8a060' : '#a8803f');
    if (i % 4 === 0) px(g, x + i, VG_GROUND - h - 1, 2, 1, '#e8c888');
  }
}

const VG_DINO = {
  name: '공룡알 놀이',
  pip: '🐣',
  bag: '🦖',
  color: '#e0802a',
  picSize: 12,
  catchMs: 1500,
  looks: ['#7ed36a', '#ff8fc0', '#8fc8ff', '#ffb347', '#b98cff'],
  spot: i => ({ x: VG_ROW[i], y: VG_GROUND }),
  clue: VG_FOREST.clue,
  ask: VG_FOREST.ask,
  replay: VG_FOREST.replay,
  // On the egg, then floating up over the baby dino.
  picAt: (it, t, now) => {
    const k = vgWon(it, now);
    return { x: it.x, y: it.y - 19 - (k > 0.3 ? vgEase(Math.min(1, (k - 0.3) / 0.25)) * 34 : 0) };
  },
  backdrop(g, LW, LH, bx, by, t) {
    const G = by + VG_GROUND;
    vgSky(g, LW, G - 10, ['#8fd3ff', '#a4dcff', '#bce6ff', '#d4f0ff']);
    // A friendly volcano with a puff of smoke, far palms, then sand and grass.
    const vx = bx + 120;
    for (let y = 0; y < 44; y++) {
      const w = 10 + Math.round(y * 1.3);
      px(g, vx - w, G - 52 + y, w * 2, 1, y < 4 ? '#ff7a4a' : y < 7 ? '#c86a4a' : y % 5 ? '#a8785a' : '#9a6a50');
    }
    // Puffs of smoke rise, grow and drift off.
    for (let i = 0; i < 3; i++) {
      const u = (t / 4 + i / 3) % 1;
      const r = Math.round(3 + u * 6);
      const cx = vx + 2 + Math.round(u * 16);
      const cy = G - 56 - Math.round(u * 34);
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) px(g, cx + x, cy + y, 1, 1, x * x + y * y > (r - 1) * (r - 1) ? '#d4dce8' : '#f4f6fa');
    }
    for (const x0 of [bx - 6, bx + 60, bx + 200, bx + 244]) {
      px(g, x0, G - 40, 3, 32, '#a8703f');
      for (let a = 0; a < 5; a++) for (let i = 0; i < 9; i++) {
        const ang = -Math.PI / 2 + (a - 2) * 0.55;
        px(g, Math.round(x0 + 1 + Math.cos(ang) * i * 1.4), Math.round(G - 42 + Math.sin(ang) * i * 0.8 + i * i * 0.08), 2, 2, a % 2 ? '#4fb860' : '#3a9a50');
      }
    }
    px(g, 0, G - 10, LW, LH - G + 10, '#f0d9a0');
    px(g, 0, G - 10, LW, 3, '#9be070');
    for (let i = 0; i < LW; i += 5) px(g, i + (i % 3), G - 4 + ((i * 7) % 16), 1, 1, (i / 5) % 3 < 1 ? '#e0c080' : '#fff0c8');
    for (let i = 0; i < LW; i += 13) { px(g, i, G - 13, 1, 3, '#6cc050'); px(g, i + 2, G - 12, 1, 2, '#6cc050'); }
  },
  back(g, t, now) { vgDrawHost(g, 24, now); },
  item(g, it, x, y, t, now) {
    vgNest(g, x);
    const wob = it.state === 'live' && Math.sin(t * 3 + it.i * 2) > 0.92 ? 1 : 0;
    g.drawImage(vgEgg(it.look, it.state === 'out'), x - 15 + wob, y - 37);
  },
  // The egg cracks, its top flies off and the baby dino pops up.
  front(g, t, now) {
    const it = mini.anim && mini.anim.it;
    if (!it) return;
    const k = vgWon(it, now);
    vgNest(g, it.x);
    if (k < 0.3) {
      g.drawImage(vgEgg(it.look, false), it.x - 15 + Math.round(Math.sin(now / 25) * 1.5), it.y - 37);
      return;
    }
    const u = Math.min(1, (k - 0.3) / 0.4);
    const baby = vgBabyDino();
    g.drawImage(baby, it.x - 11, Math.round(it.y - 18 - vgEase(u) * 16 - Math.abs(Math.sin(now / 160)) * 2));
    g.drawImage(vgEgg(it.look, false, 'bottom'), it.x - 15, it.y - 37);
    g.drawImage(vgEgg(it.look, false, 'top'), Math.round(it.x - 15 + u * 18), Math.round(it.y - 37 - Math.sin(u * Math.PI) * 22 + u * 16));
  },
  update(dt, now) {
    const a = mini.anim;
    if (a && !a.landed && vgWon(a.it, now) >= 0.3) {
      a.landed = true;
      Sound.tune('chime');
      miniSpark(a.it.x, a.it.y - 24, 16, i => ['#fff27a', '#ffffff', '#9be070'][i % 3], 45);
    }
  },
};

// ---- Unicorn Village: hear the sounds, tap the unicorn ---------------------------

const VG_UNICORN = {
  name: '유니콘 달리기',
  pip: '🦄',
  bag: '🌈',
  color: '#9a6ad8',
  picSize: 12.5,
  catchMs: 1600,
  looks: ['pink', 'sky', 'mint', 'lavender', 'gold', 'snow', 'rainbow'],
  spot: i => ({ x: VG_ROW[i], y: VG_GROUND }),
  // One dot for each sound.
  clue: r => '●'.repeat(r.q.replay.filter(p => p.text).length),
  // "Listen to the sounds. Tap the picture!" (or "Listen.") then /c/ /a/ /t/.
  ask: (r, first) => [first ? vgSay('miniBlend') : { text: LINES.listen[0] }, { pause: 450 }].concat(r.q.replay),
  replay: r => r.q.replay,
  // On a little cloud over its head, flying along when it gallops off.
  picAt: (it, t, now) => {
    const k = vgWon(it, now);
    const run = k > 0.1 ? vgEase(Math.min(1, (k - 0.1) / 0.9)) * 150 : 0;
    return { x: it.x - 2 + run, y: it.y - 44 + Math.round(Math.sin(t * 2 + it.i) * 1.2) - (k > 0 ? Math.abs(Math.sin(k * 14)) * 3 : 0) };
  },
  backdrop(g, LW, LH, bx, by, t) {
    const G = by + VG_GROUND;
    vgSky(g, LW, G - 10, ['#bfe4ff', '#d4ecff', '#ecdcff', '#ffdcef']);
    drawRainbowArch(g, bx + 104, G - 4, 70);
    for (let i = 0; i < 4; i++) drawCloudPuff(g, Math.round(((i * 83 + t * 3) % (LW + 60)) - 30), by + 10 + (i % 2) * 14, 0.8);
    px(g, 0, G - 10, LW, LH - G + 10, '#9ee08a');
    px(g, 0, G - 10, LW, 2, '#c4f0a8');
    for (let i = 0; i < LW; i += 7) {
      const y = G - 6 + ((i * 11) % 18);
      px(g, i + (i % 5), y, 1, 1, ['#ffffff', '#ff9ec4', '#fff27a', '#b9a0ff'][(i / 7) % 4 | 0]);
    }
  },
  back(g, t, now) {
    vgDrawHost(g, 16, now);
    // The start line under the unicorns.
    for (let x = 58; x < 204; x += 4) px(g, x, VG_GROUND + 2, 2, 1, '#ffffff');
  },
  item(g, it, x, y, t, now) {
    vgShadow(g, x, VG_GROUND, 13);
    if (it.state === 'out') g.globalAlpha = 0.45;
    const s = unicornSprite(it.look, 0);
    g.drawImage(s.canvas, x - s.ax, y - s.ay);
    g.globalAlpha = 1;
    drawCloudPuff(g, x - 2, y - 44 + Math.round(Math.sin(t * 2 + it.i) * 1.2), 0.85);
  },
  // The one she picked gallops off over the meadow, a rainbow trail behind.
  front(g, t, now) {
    const it = mini.anim && mini.anim.it;
    if (!it) return;
    const k = vgWon(it, now);
    const run = k > 0.1 ? vgEase(Math.min(1, (k - 0.1) / 0.9)) * 150 : 0;
    const hop = k > 0 ? Math.abs(Math.sin(k * 14)) * 3 : 0;
    const s = unicornSprite(it.look, Math.floor(now / 90) % 2);
    g.drawImage(s.canvas, Math.round(it.x + run - s.ax), Math.round(it.y - hop - s.ay));
    drawCloudPuff(g, Math.round(it.x - 2 + run), Math.round(it.y - 44 - hop), 0.85);
  },
  update(dt, now) {
    const a = mini.anim;
    if (!a) return;
    const k = vgWon(a.it, now);
    if (k > 0.1 && k < 0.95 && Math.random() < 0.6) {
      const run = vgEase(Math.min(1, (k - 0.1) / 0.9)) * 150;
      miniSpark(a.it.x + run - 14, a.it.y - 10, 1, RAINBOW[Math.floor(Math.random() * RAINBOW.length)], 15, 20);
    }
  },
};

// ---- Car Village: hear the sounds, tap the car --------------------------------

const VG_CARS = {
  name: '자동차 경주',
  pip: '🏁',
  bag: '🏆',
  color: '#d84a4a',
  picSize: 12,
  catchMs: 1500,
  looks: ['race', 'police', 'taxi', 'fire', 'monster', 'rocket', 'ambulance'],
  // On the starting grid, one row behind the other.
  spot: i => ({ x: VG_ROW[i] - 4, y: VG_GROUND - 6 + i * 6 }),
  clue: VG_UNICORN.clue,
  ask: VG_UNICORN.ask,
  replay: VG_UNICORN.replay,
  // On a round sign over its roof.
  picAt: (it, t, now) => {
    const k = vgWon(it, now);
    return { x: it.x + (k > 0.1 ? ((k - 0.1) / 0.9) ** 2 * 170 : 0), y: it.y - 34 };
  },
  backdrop(g, LW, LH, bx, by, t) {
    const G = by + VG_GROUND;
    vgSky(g, LW, G - 26, ['#8fd3ff', '#a8dcff', '#c4e8ff']);
    // The stands full of fans, flags on a line, then the track.
    px(g, 0, G - 50, LW, 22, '#5a6a8a');
    for (let x = 0; x < LW; x += 4) for (let y = G - 47; y < G - 30; y += 4) px(g, x + ((y >> 2) % 2) * 2, y, 2, 2, ['#ff6f8a', '#ffd34d', '#7fd0ff', '#ffffff', '#9be070'][((x * 3 + y) >> 2) % 5]);
    px(g, 0, G - 51, LW, 2, '#3a3550');
    for (let x = -(bx % 10); x < LW; x += 10) {
      px(g, x, G - 58 + ((x >> 1) % 3 === 0 ? 1 : 0), 10, 1, '#3a3550');
      px(g, x + 2, G - 57, 5, 4, ['#ff5a5a', '#ffd34d', '#4fa8ff', '#5fd08a'][((x + bx) / 10 | 0) % 4 & 3]);
    }
    px(g, 0, G - 28, LW, LH - G + 28, '#6a7086');
    px(g, 0, G - 28, LW, 2, '#ffffff');
    for (let x = -((bx + t * 0) % 16); x < LW; x += 16) px(g, x, G + 9, 8, 1, '#e8ecf4');
    // The finish line at the right, black and white.
    const fx = bx + MINI_W - 6;
    for (let y = G - 28, j = 0; y < LH; y += 3, j++) for (let i = 0; i < 2; i++) px(g, fx + i * 3, y, 3, 3, (j + i) % 2 ? '#ffffff' : '#2a2a3a');
  },
  back(g, t, now) { vgDrawHost(g, 14, now); },
  item(g, it, x, y, t, now) {
    vgSign(g, x, y - 34, true);
    if (it.state === 'out') g.globalAlpha = 0.45;
    drawCaptainCar(g, x, y, it.look, 0);
    g.globalAlpha = 1;
    vgSign(g, x, y - 34);
    if (it.state === 'out' && now - it.t0 < 900) for (let i = 0; i < 3; i++) px(g, x + 8 + i * 3, y - 22 - Math.round((now - it.t0) / 90) - i * 2, 2, 2, '#b8bccc');
  },
  // The car she picked races over the finish line.
  front(g, t, now) {
    const it = mini.anim && mini.anim.it;
    if (!it) return;
    const k = vgWon(it, now);
    const run = k > 0.1 ? ((k - 0.1) / 0.9) ** 2 * 170 : 0;
    vgSign(g, Math.round(it.x + run), it.y - 34, true);
    drawCaptainCar(g, Math.round(it.x + run), it.y, it.look, Math.floor(now / 70) % 2);
    vgSign(g, Math.round(it.x + run), it.y - 34);
    // It drives behind the cars on the rows in front of it.
    for (const x of mini.items) if (x !== it && x.y > it.y) mini.game.draw.item(g, x, t, now);
  },
  caught() { Sound.tune('honk'); },
  update(dt, now) {
    const a = mini.anim;
    if (!a) return;
    const k = vgWon(a.it, now);
    if (k > 0.05 && k < 0.9 && Math.random() < 0.5) {
      const run = k > 0.1 ? ((k - 0.1) / 0.9) ** 2 * 170 : 0;
      miniSpark(a.it.x + run - 24, a.it.y - 6, 1, '#d8dce8', 12, -10);
    }
  },
};
// A round white sign on a pole, for the picture (`pole`: just the pole,
// which goes behind the car).
function vgSign(g, x, y, pole) {
  if (pole) { px(g, x, y + 9, 1, 14, '#5a6478'); return; }
  for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) {
    const d = i * i + j * j;
    if (d <= 100) px(g, x + i, y + j, 1, 1, d > 81 ? VG_INK : d > 64 ? '#ffd34d' : '#ffffff');
  }
}

// ---- Crystal Cave: read the word, open its chest -----------------------------------

// A treasure chest with a white plate on its front for the picture, and
// its lid on its own (it opens).
function vgChest(color, grey, part) {
  return vgCached(`chest|${color}|${grey}|${part}`, () => vgSprite(40, 34, set => {
    if (part === 'lid') {
      for (let y = 2; y <= 11; y++) for (let x = 2; x <= 37; x++) {
        const round = y < 5 && (x < 2 + (5 - y) || x > 37 - (5 - y));
        if (round) continue;
        set(x, y, x >= 7 && x <= 9 || x >= 30 && x <= 32 ? '#ffd34d' : y < 5 ? shade(color, 25) : color);
      }
      for (let x = 18; x <= 21; x++) for (let y = 8; y <= 12; y++) set(x, y, '#ffd34d');
      return;
    }
    for (let y = 12; y <= 32; y++) for (let x = 3; x <= 36; x++) set(x, y, x >= 7 && x <= 9 || x >= 30 && x <= 32 ? '#e0a83a' : y > 29 ? shade(color, -30) : shade(color, -12));
    for (let y = 14; y <= 30; y++) for (let x = 11; x <= 28; x++) set(x, y, (x === 11 || x === 28 || y === 14 || y === 30) ? '#ffd34d' : '#ffffff');
  }, grey));
}

const VG_CHESTS = {
  name: '보물 상자 놀이',
  pip: '💎',
  bag: '💎',
  color: '#7a52c8',
  picSize: 12,
  catchMs: 1400,
  looks: ['#b07a4a', '#c8604a', '#7a6ac8', '#4a9a8a', '#c87a9a'],
  spot: i => ({ x: VG_ROW[i], y: VG_GROUND }),
  clue: r => r.q.target,
  // "Read the word. Tap its picture!" once; then just "One more for you!".
  ask: (r, first) => [first ? vgSay('miniRead') : { text: line('next', {}, LINES.next.filter(l => !/listen/i.test(l))) }],
  replay: () => [vgSay('miniRead')],
  picAt: (it, t, now) => {
    const k = vgWon(it, now);
    return { x: it.x, y: it.y - 12 - (k > 0.2 ? vgEase(Math.min(1, (k - 0.2) / 0.5)) * 26 : 0), s: k > 0.2 ? 1.15 : 1 };
  },
  backdrop(g, LW, LH, bx, by, t) {
    const G = by + VG_GROUND;
    vgSky(g, LW, G - 10, ['#1e1840', '#221b48', '#271f50', '#2c2358']);
    vgCaveWall(g, LW, G, bx, ['#2c2358', '#352a66', '#3f3274'], by);
    for (const [x, col] of [[bx - 20, '#7fe8ff'], [bx + 40, '#ff9cf0'], [bx + 104, '#c8a0ff'], [bx + 160, '#7fe8ff'], [bx + 228, '#ff9cf0']]) {
      drawCrystal(g, x, G - 12, col, 0.7);
      if (Math.sin(t * 2 + x) > 0.6) px(g, x - 1, G - 26, 1, 1, '#ffffff');
    }
    px(g, 0, G - 10, LW, LH - G + 10, '#4a3e7a');
    px(g, 0, G - 10, LW, 2, '#5f52a0');
    for (let i = 0; i < LW; i += 9) px(g, i + (i % 4), G - 4 + ((i * 7) % 16), 3, 1, '#3f3470');
  },
  back(g, t, now) { vgDrawHost(g, 16, now); },
  item(g, it, x, y, t, now) {
    vgShadow(g, x, VG_GROUND, 18);
    const grey = it.state === 'out';
    g.drawImage(vgChest(it.look, grey), x - 20, y - 33);
    g.drawImage(vgChest(it.look, grey, 'lid'), x - 20, y - 33);
  },
  // Its lid swings up, and gems and gold fly out.
  front(g, t, now) {
    const it = mini.anim && mini.anim.it;
    if (!it) return;
    const k = vgWon(it, now);
    vgShadow(g, it.x, VG_GROUND, 18);
    const lid = vgChest(it.look, false, 'lid');
    const up = Math.min(1, k / 0.2);
    // The lid swings back on its hinge: shut, then standing up behind the
    // chest, upside down, with the gold inside glowing.
    g.drawImage(vgChest(it.look, false), it.x - 20, it.y - 33);
    if (up < 0.5) {
      const h = Math.max(1, Math.round(13 * (1 - up * 2)));
      g.drawImage(lid, 0, 0, 40, 13, it.x - 20, it.y - 20 - h, 40, h);
      return;
    }
    g.save();
    g.translate(it.x - 20, it.y - 21);
    g.scale(1, -1);
    g.drawImage(lid, 0, 0, 40, 13, 0, 0, 40, Math.max(1, Math.round(13 * (up - 0.5) * 2)));
    g.restore();
    px(g, it.x - 16, it.y - 22, 32, 3, '#4a2c4f');
    px(g, it.x - 14, it.y - 22, 28, 2, Math.floor(now / 120) % 2 ? '#fff27a' : '#ffd34d');
  },
  update(dt, now) {
    const a = mini.anim;
    if (a && !a.landed && vgWon(a.it, now) >= 0.15) {
      a.landed = true;
      Sound.tune('chime');
      miniSpark(a.it.x, a.it.y - 24, 26, i => ['#7fe8ff', '#ff9cf0', '#ffd34d', '#ffffff', '#9be070'][i % 5], 60);
    }
  },
};

// ---- Villain Cave: read the word, free its crystal --------------------------------

const VG_CRYSTALS = {
  name: '크리스탈 놀이',
  pip: '💠',
  bag: '💎',
  color: '#2a8a9a',
  picSize: 12,
  catchMs: 1400,
  looks: ['#7fe8ff', '#ff9cf0', '#c8a0ff', '#9be070', '#ffd34d'],
  spot: i => ({ x: VG_ROW[i], y: VG_GROUND }),
  clue: VG_CHESTS.clue,
  ask: VG_CHESTS.ask,
  replay: VG_CHESTS.replay,
  picAt: (it, t, now) => {
    const k = vgWon(it, now);
    return { x: it.x, y: it.y - 13 - (k > 0 ? vgEase(k) * 40 : 0) + Math.round(Math.sin(t * 2 + it.i) * 1) };
  },
  backdrop(g, LW, LH, bx, by, t) {
    const G = by + VG_GROUND;
    vgSky(g, LW, G - 10, ['#1a1f2e', '#1e2434', '#222a3c', '#283246']);
    vgCaveWall(g, LW, G, bx, ['#283246', '#303c52', '#3a465e'], by);
    for (const [x, col] of [[bx - 16, '#7fe8ff'], [bx + 52, '#c8a0ff'], [bx + 150, '#7fe8ff'], [bx + 232, '#c8a0ff']]) {
      drawCrystal(g, x, G - 12, col, 0.6);
      if (Math.sin(t * 2 + x) > 0.6) px(g, x - 1, G - 24, 1, 1, '#ffffff');
    }
    // A pipe the villains put up, with blinking lights.
    px(g, 0, by + 8, LW, 4, '#4a5468');
    px(g, 0, by + 8, LW, 1, '#6a7488');
    for (let x = -(bx % 30); x < LW; x += 30) { px(g, x, by + 6, 4, 8, '#3a4258'); px(g, x + 1, by + 12, 2, 2, Math.sin(t * 3 + x) > 0 ? '#7fff9f' : '#3a8a5a'); }
    px(g, 0, G - 10, LW, LH - G + 10, '#3a4258');
    for (let x = -(bx % 8); x < LW; x += 8) { px(g, x, G - 10, 4, 3, '#ffd34d'); px(g, x + 4, G - 10, 4, 3, '#2a2a3a'); }
    for (let i = 0; i < LW; i += 11) px(g, i + (i % 5), G - 2 + ((i * 7) % 16), 3, 1, '#323a4e');
  },
  back(g, t, now) { vgDrawHost(g, 16, now); },
  item(g, it, x, y, t, now) {
    const grey = it.state === 'out';
    if (it.state === 'out' && now - it.t0 < 500) g.globalAlpha = Math.floor(now / 80) % 2 ? 1 : 0.5;
    else if (grey) g.globalAlpha = 0.45;
    drawCrystal(g, x, y, grey && now - it.t0 >= 500 ? '#9aa0b4' : grey ? '#ff6f6f' : it.look, 1.75);
    g.globalAlpha = 1;
    vgWindow(g, x, y - 13 + Math.round(Math.sin(t * 2 + it.i) * 1), grey);
  },
  // Free: it shines, and floats up in a beam of light.
  front(g, t, now) {
    const it = mini.anim && mini.anim.it;
    if (!it) return;
    const k = vgWon(it, now);
    const up = vgEase(k) * 40;
    g.fillStyle = `rgba(255,255,255,${0.35 * (1 - k)})`;
    g.fillRect(it.x - 12, 0, 24, it.y);
    drawCrystal(g, it.x, Math.round(it.y - up), Math.floor(now / 100) % 2 ? '#ffffff' : it.look, 1.75);
    vgWindow(g, it.x, Math.round(it.y - 13 - up), false);
  },
  update(dt, now) {
    const a = mini.anim;
    if (a && !a.landed) {
      a.landed = true;
      Sound.tune('chime');
      miniSpark(a.it.x, a.it.y - 20, 24, i => ['#7fe8ff', '#ffffff', a.it.look][i % 3], 55);
    }
  },
};
// The cave's far wall: rocky ledges in three shades, and icicles of rock
// hanging from the roof.
function vgCaveWall(g, LW, G, bx, cols, by) {
  for (let x = 0; x < LW; x++) {
    const w = x + bx;
    const h = [44 + Math.sin(w / 11) * 6 + Math.sin(w / 4.3) * 2, 28 + Math.sin(w / 7 + 1) * 4, 14 + Math.sin(w / 5.1 + 2) * 3];
    h.forEach((hh, i) => px(g, x, Math.round(G - 10 - hh), 1, Math.round(hh), cols[i]));
  }
  for (let x = -(bx % 17); x < LW; x += 17) {
    const len = 8 + ((x + bx) * 7 % 13 + 13) % 13;
    for (let y = 0; y < len; y++) {
      const w = Math.max(1, Math.round((1 - y / len) * 4));
      px(g, x - w, by + y - 6, w * 2, 1, cols[1]);
    }
  }
}

// A round glass window in a crystal, for the picture.
function vgWindow(g, x, y, grey) {
  for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) {
    const d = i * i + j * j;
    if (d <= 81) px(g, x + i, y + j, 1, 1, d > 64 ? (grey ? '#8a8ea0' : VG_INK) : grey ? '#e4e4ec' : d < 20 && i < 0 && j < 0 ? '#ffffff' : '#f2fbff');
  }
}

// ---- Fairy Village: spell the word ------------------------------------------------

// Slots for the word at the top, the picture to its left, and the letters
// below, each carried by a little fairy (a drone with a box in the robot
// edition). Tapping a letter says its sound; the right one flies up into
// the next slot, a wrong one shakes and she hears the word again. Two
// wrong ones for the same slot make the right letter glow.
const VG_SLOT_Y = 30;
const VG_TILE_Y = 84;
const VG_PIC = { x: 44, y: 30 };
const vgSlotX = (i, n) => 124 + (i - (n - 1) / 2) * 28;
// The letters in their slots so far, in order.
const vgPlaced = () => mini.items.filter(x => x.state === 'placed' || x.state === 'caught').sort((a, b) => a.slot - b.slot);
// The letter the next slot needs.
function vgWants(it) {
  const r = miniRound();
  return !!r && it.state === 'live' && it.l === r.q.slots[vgPlaced().length];
}

// Where a letter is: in the row, flying up, or in its slot (hopping when
// the word is done).
function vgTileAt(it, now) {
  const n = miniRound() ? miniRound().q.slots.length : 3;
  if (it.state === 'live' || it.state === 'out') {
    return { x: it.x + vgShake(it, now), y: it.y + Math.round(Math.sin(now / 400 + it.i * 1.7) * 1.5) + (1 - vgIn(it, now)) * 10 };
  }
  const to = { x: vgSlotX(it.slot, n), y: VG_SLOT_Y };
  const u = Math.min(1, (now - it.t0) / 380);
  let y = it.from.y + (to.y - it.from.y) * vgEase(u) - Math.sin(u * Math.PI) * 10;
  const a = mini.anim;
  if (a) {
    const h = (now - a.t0 - 250 - it.slot * 450) / 300;
    if (h > 0 && h < 1) y -= Math.sin(h * Math.PI) * 6;
  }
  return { x: it.from.x + (to.x - it.from.x) * vgEase(u), y, small: u >= 1 };
}

function vgSpellGame(skin) {
  return {
    scene: 'fairy',
    host: () => vgHost('fairy'),
    label: () => `${vgIcon('fairy')} ${skin.name}`,
    title: () => `${vgIcon('fairy')} ${skin.name}`,
    pip: () => skin.pip,
    bag: () => skin.bag,
    // 3-letter words: the first letter given at her first tier, four
    // letters to pick from (one a vowel that isn't in the word after that).
    rounds: () => vgQuestions('spell', 2, t => (t === 1 ? {} : { extra: 1 })).map(q => ({ q, e: vgWord(q.word).e, miss: [] })),
    items(r) {
      const now = performance.now();
      const tiles = r.q.tiles.map((t, i) => ({ l: t.l, sound: t.sound, i, look: skin.looks[i % skin.looks.length], glow: false }));
      // The easiest words come with the first letter in already.
      for (let i = 0; i < (r.q.given || 0); i++) {
        const t = tiles.find(x => x.l === r.q.slots[i] && x.state !== 'placed');
        Object.assign(t, { state: 'placed', slot: i, t0: now - 1000, from: { x: vgSlotX(i, r.q.slots.length), y: VG_SLOT_Y } });
      }
      const live = tiles.filter(t => t.state !== 'placed');
      const gap = live.length > 3 ? 36 : 44;
      live.forEach((t, j) => Object.assign(t, { x: Math.round(124 + (j - (live.length - 1) / 2) * gap), y: VG_TILE_Y, state: 'live', born: now + j * 120, right: false }));
      return tiles;
    },
    clue: r => ({ text: r.e, color: skin.color }),
    // "Tap the letters in order!" once, then "Can you spell it? … cat".
    ask: (r, first) => (first ? [vgSay('miniSpell'), { pause: 400 }] : []).concat(vgAsked(r.q)),
    replay: r => r.q.replay,
    // "/c/ /a/ /t/… cat!"
    answer: r => r.q.answer,
    done: () => [{ text: line('praise') }, { pause: 300 }, vgSay('miniDone')],
    catchMs: () => 600 + miniRound().q.slots.length * 450,
    rows: [6, 116],
    box: it => ({ x0: it.x - 17, x1: it.x + 17, y0: it.y - 26, y1: it.y + 17 }),
    pointAt: it => vgTileAt(it, performance.now()),
    tap: it => vgSpellTap(it),
    caught() {
      for (let i = 0; i < 3; i++) miniSpark(vgSlotX(i, 3), VG_SLOT_Y, 8, j => ['#fff27a', '#ffffff', skin.sparkle][j % 3], 45);
    },
    draw: {
      backdrop: skin.backdrop,
      back(g, t, now) {
        vgDrawHost(g, 16, now);
        skin.frame(g, VG_PIC.x, VG_PIC.y, t);
        const r = miniRound();
        const n = r ? r.q.slots.length : 3;
        const filled = vgPlaced().length;
        for (let i = 0; i < n; i++) skin.slot(g, vgSlotX(i, n), VG_SLOT_Y, !mini.anim && i === filled && Math.floor(now / 450) % 2, now);
      },
      item(g, it, t, now) {
        if (it.state !== 'live' && it.state !== 'out') return;
        if (vgIn(it, now) <= 0) return;
        const p = vgTileAt(it, now);
        if (it.glow) vgGlowRing(g, p.x, p.y - 4, 19, 21, now);
        skin.carrier(g, p.x, p.y, it, now);
        skin.tile(g, p.x, p.y, it, now);
      },
      // The letters flying up or in their slots.
      front(g, t, now) {
        for (const it of vgPlaced()) {
          const p = vgTileAt(it, now);
          if (!p.small) skin.tile(g, p.x, p.y, it, now);
        }
      },
      labels(t, now) {
        const r = miniRound();
        const out = r ? [{ text: r.e, x: VG_PIC.x, y: VG_PIC.y, size: 17 }] : [];
        for (const it of mini.items) {
          if (it.state === 'live' && vgIn(it, now) <= 0) continue;
          const p = vgTileAt(it, now);
          out.push({ text: it.l, x: p.x, y: p.y - 1, size: p.small ? 15 : 16, letter: true, color: skin.ink, alpha: it.state === 'live' ? vgIn(it, now) : 1 });
        }
        return out;
      },
    },
  };
}

// A letter tapped: the right one for the next slot flies up into it; a
// wrong one shakes and she hears the word again (the sound the slot needs
// after two). The last letter wins the round.
function vgSpellTap(it) {
  const r = miniRound();
  const at = vgPlaced().length;
  Sound.tap();
  if (vgWants(it)) {
    Object.assign(it, { state: 'placed', slot: at, t0: performance.now(), from: { x: it.x, y: it.y }, glow: false });
    for (const x of mini.items) x.glow = false;
    if (at + 1 < r.q.slots.length) { Sound.say([it.sound]); return; }
    // The last one: a moment to see it in, then the word.
    it.prize = r.e;
    const turn = ++mini.turn;
    mini.locked = true;
    Sound.say([it.sound]);
    miniLater(650, () => { if (mini.turn === turn) miniCatch(it); });
    return;
  }
  r.miss[at] = (r.miss[at] || 0) + 1;
  const twice = r.miss[at] >= 2;
  it.t0 = performance.now();
  Sound.oops();
  if (twice) {
    const want = r.q.slots[at];
    const right = mini.items.find(x => x.state === 'live' && x.l === want);
    miniGlow(x => x === right);
  }
  miniHint([it.sound, { pause: 350 }].concat(twice ? r.q.need(at) : r.q.teach()), 6000);
}

// A bubble of light with the letter in it.
function vgBubble(g, x, y, col) {
  for (let j = -13; j <= 13; j++) for (let i = -13; i <= 13; i++) {
    const d = i * i + j * j;
    if (d > 169) continue;
    px(g, Math.round(x) + i, Math.round(y) + j, 1, 1, d > 144 ? VG_INK : d > 110 ? col : i < -3 && j < -3 && d < 60 && d > 30 ? '#ffffff' : mix(col, '#ffffff', 0.72));
  }
}

const VG_FAIRY_SKIN = {
  name: '글자 요정 놀이',
  pip: '✨',
  bag: '✨',
  color: '#d85aa0',
  sparkle: '#ff9ec4',
  ink: '#7a2a5a',
  looks: ['pink', 'lavender', 'sky', 'mint', 'sun'],
  backdrop(g, LW, LH, bx, by, t) {
    const G = by + VG_GROUND;
    vgSky(g, LW, G - 10, ['#ffdcef', '#ffe4f4', '#f6e4ff', '#e6ecff']);
    for (const [x, col, h] of [[bx - 30, '#ff9ec4', 60], [bx + 8, '#b9a0ff', 40], [bx + 216, '#ffd36b', 56], [bx + 250, '#8fd3ff', 44]]) drawGiantFlower(g, x, G - 6, col, h);
    px(g, 0, G - 10, LW, LH - G + 10, '#a8e8a0');
    px(g, 0, G - 10, LW, 2, '#c8f4b8');
    for (let i = 0; i < LW; i += 6) px(g, i + (i % 5), G - 5 + ((i * 7) % 16), 1, 1, ['#ffffff', '#ff9ec4', '#fff27a'][(i / 6) % 3 | 0]);
    for (let i = 0; i < 12; i++) {
      const x = Math.round(hash(i, 5, 91) * LW + t * 5) % LW;
      const y = by + 40 + Math.round(Math.sin(t + i) * 8 + hash(i, 6, 91) * 30);
      if (Math.sin(t * 3 + i) > 0) px(g, x, y, 1, 1, '#ffffff');
    }
  },
  // A daisy round the picture.
  frame(g, x, y) {
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j <= 25) px(g, Math.round(x + Math.cos(ang) * 14) + i, Math.round(y + Math.sin(ang) * 14) + j, 1, 1, i * i + j * j > 18 ? '#e86fb0' : '#ffd0e8');
    }
    for (let j = -13; j <= 13; j++) for (let i = -13; i <= 13; i++) if (i * i + j * j <= 169) px(g, x + i, y + j, 1, 1, i * i + j * j > 150 ? '#e86fb0' : '#ffffff');
  },
  // A rounded slot of petals, glowing when it is the next one.
  slot(g, x, y, next) {
    px(g, x - 12, y - 12, 24, 24, next ? '#ffd34d' : '#e86fb0');
    px(g, x - 11, y - 11, 22, 22, next ? '#fff6c8' : '#fff0f8');
    for (const [dx, dy] of [[-12, -12], [11, -12], [-12, 11], [11, 11]]) px(g, x + dx, y + dy, 1, 1, '#f6e4ff');
  },
  carrier(g, x, y, it, now) {
    const f = fairySprite(it.look, Math.floor(now / 140 + it.i) % 2);
    drawFlying(g, f, x, y - 19);
    px(g, Math.round(x), Math.round(y - 14), 1, 2, '#ffffff');
  },
  tile(g, x, y, it, now) {
    const col = it.state === 'out' && now - it.t0 < 420 ? '#c8c4d4' : ['#ff9ec4', '#b9a0ff', '#8fd3ff', '#8fe8c4', '#ffd36b'][it.i % 5];
    vgBubble(g, x, y, col);
  },
};

const VG_DRONE_SKIN = {
  name: '드론 배달 놀이',
  pip: '📦',
  bag: '🛸',
  color: '#2f7ad8',
  sparkle: '#7fe8ff',
  ink: '#2f2c56',
  looks: ['quad', 'bee', 'ufo', 'owl', 'rocket'],
  backdrop(g, LW, LH, bx, by, t) {
    const G = by + VG_GROUND;
    vgSky(g, LW, G - 10, ['#9fd4ff', '#b4deff', '#c8e8ff', '#dcf0ff']);
    // Hangars and the control tower far off, then the landing field.
    for (let x = -(bx % 70) - 70; x < LW; x += 70) {
      px(g, x + 6, G - 34, 40, 24, '#c8d4e8');
      for (let y = 0; y < 8; y++) px(g, x + 6 + y, G - 42 + y, 40 - y * 2, 1, '#a8b8d4');
      px(g, x + 18, G - 26, 16, 16, '#8a9ab8');
    }
    px(g, bx + 196, G - 70, 8, 60, '#d8e0ee');
    px(g, bx + 192, G - 76, 16, 8, '#4f86d8');
    px(g, bx + 194, G - 74, 12, 4, Math.sin(t * 4) > 0 ? '#7ff0ff' : '#bfefff');
    px(g, 0, G - 10, LW, LH - G + 10, '#8a94a8');
    px(g, 0, G - 10, LW, 2, '#aab4c8');
    for (let x = -(bx % 20); x < LW; x += 20) px(g, x, G + 6, 10, 2, '#ffd34d');
  },
  // A screen showing the picture.
  frame(g, x, y, t) {
    px(g, x - 16, y - 15, 32, 30, '#2f2c56');
    px(g, x - 14, y - 13, 28, 26, '#e8f6ff');
    px(g, x - 14, y + 10, 28, 3, '#bfe4ff');
    px(g, x - 3, y + 15, 6, 4, '#5a6478');
    px(g, x + 11, y - 12, 2, 2, Math.sin(t * 4) > 0 ? '#7fff9f' : '#3a8a5a');
  },
  // A landing pad with a striped edge; the next one blinks.
  slot(g, x, y, next) {
    px(g, x - 12, y - 12, 24, 24, '#2f2c56');
    for (let i = 0; i < 22; i += 4) {
      for (const [dx, dy] of [[-11 + i, -11], [-11 + i, 9], [-11, -11 + i], [9, -11 + i]]) px(g, x + dx, y + dy, 2, 2, next ? '#7ff0ff' : '#ffd34d');
    }
    px(g, x - 9, y - 9, 18, 18, next ? '#e0fbff' : '#dfe6f2');
  },
  carrier(g, x, y, it, now) {
    const s = captainBuddySprite(it.look, Math.floor(now / 80) % 2);
    drawFlying(g, s, x, y - 21);
    px(g, Math.round(x - 6), Math.round(y - 16), 1, 4, '#5a6478');
    px(g, Math.round(x + 5), Math.round(y - 16), 1, 4, '#5a6478');
  },
  // A cardboard box with a white label for the letter.
  tile(g, x, y, it, now) {
    x = Math.round(x);
    y = Math.round(y);
    const red = it.state === 'out' && now - it.t0 < 420;
    px(g, x - 13, y - 12, 26, 25, '#2f2c56');
    px(g, x - 12, y - 11, 24, 23, red ? '#d0c8c8' : '#d8a060');
    px(g, x - 12, y - 11, 24, 2, '#f0c080');
    px(g, x - 1, y - 11, 2, 4, '#c08850');
    px(g, x - 9, y - 7, 18, 17, '#2f2c56');
    px(g, x - 8, y - 6, 16, 15, '#ffffff');
  },
};

MINI_GAMES.forest = vgPickGame('forest', TIER_BAND.forest[1], isCaptain() ? VG_DINO : VG_FOREST);
MINI_GAMES.fairy = vgSpellGame(isCaptain() ? VG_DRONE_SKIN : VG_FAIRY_SKIN);
MINI_GAMES.unicorn = vgPickGame('unicorn', TIER_BAND.unicorn[1], isCaptain() ? VG_CARS : VG_UNICORN);
MINI_GAMES.dungeon = vgPickGame('dungeon', TIER_BAND.dungeon[1], isCaptain() ? VG_CRYSTALS : VG_CHESTS);
