// Captain edition: Dinosaur Village (scene 'forest'), its friendly talking
// dinosaurs and how they look and sound. It takes the Starlight Forest's
// place: the same gates, cave, shop and quiz level, in a sunny jungle with
// a friendly volcano and dino nests.

// ---- Dino folk -------------------------------------------------------------

// Who lives in Dinosaur Village. They ask the forest questions (level 2).
const DINO_VILLAGE_NPCS = [
  { name: '티라노 대장',       look: 'dinoRex',    c: 18, r: 8 },
  { name: '트리케라 아줌마',   look: 'dinoTops',   c: 12, r: 7 },
  { name: '스테고 형',         look: 'dinoStego',  c: 21, r: 14 },
  { name: '브라키오 할아버지', look: 'dinoBronto', c: 25, r: 18 },
  { name: '프테라 누나',       look: 'dinoPtero',  c: 5,  r: 11 },
  { name: '안킬로 아저씨',     look: 'dinoAnky',   c: 10, r: 24 },
  { name: '아기 공룡',         look: 'dinoBaby',   c: 12, r: 20 },
];

if (isCaptain()) {
  FOREST_NPCS.splice(0, FOREST_NPCS.length, ...DINO_VILLAGE_NPCS);
  // `dino` picks the sprite in dinoFolkSprite (see villagerSprite).
  Object.assign(LOOKS, {
    dinoRex: { dino: 'rex' }, dinoTops: { dino: 'tops' }, dinoStego: { dino: 'stego' }, dinoBronto: { dino: 'bronto' },
    dinoPtero: { dino: 'ptero' }, dinoAnky: { dino: 'anky' }, dinoBaby: { dino: 'baby' },
  });
  Object.assign(VOICES, {
    dinoRex:    { gender: 'male', tts: 'am_eric', pitch: 0.7, rate: 0.95, voice: ['Fred', 'Rishi', 'Microsoft Guy', 'Aaron'] },
    dinoTops:   { gender: 'female', tts: 'af_jessica', pitch: 1.1, rate: 0.98, voice: ['Samantha', 'Microsoft Aria', 'Google US English'] },
    dinoStego:  { gender: 'male', tts: 'am_liam', pitch: 1.05, rate: 1.02, voice: ['Alex', 'Tom', 'Microsoft Andrew'] },
    dinoBronto: { gender: 'male', tts: 'bm_george', pitch: 0.6, rate: 0.82, voice: ['Arthur', 'Daniel', 'Google UK English Male', 'Microsoft George'] },
    dinoPtero:  { gender: 'female', tts: 'af_nova', pitch: 1.5, rate: 1.08, voice: ['Zoe', 'Allison', 'Microsoft Ana'] },
    dinoAnky:   { gender: 'male', tts: 'am_adam', pitch: 0.85, rate: 0.88, voice: ['Ralph', 'Fred', 'Aaron'] },
    dinoBaby:   { gender: 'female', tts: 'af_sky', pitch: 1.75, rate: 1.1, voice: ['Junior', 'Zoe', 'Microsoft Ana'] },
  });
  Object.assign(PERSONA, {
    dinoRex:    ['Roar! Oh, sorry, that was my happy roar. Hello, {title} {name}!', 'My arms are tiny, but my brain is big! Let\'s play a word game.', 'Welcome to Dinosaur Village, {title} {name}! I am the big boss here.'],
    dinoTops:   ['Hello, {title} {name}! I have three horns and one big smile.', 'Tiptoe, please! My eggs are about to hatch. Want a word?', 'Oh, a shiny robot! Let\'s see how well you listen.'],
    dinoStego:  ['Hey, {title} {name}! Do you like the plates on my back? I polish them every day.', 'Stomp, stomp! I just finished my leafy breakfast.', 'Yo, {title}! Ready for a tricky word?'],
    dinoBronto: ['Hello down there, {title} {name}! I can see the whole village from up here.', 'Oh, hello! I was nibbling the treetops. Yummy leaves!', 'Welcome, little one. My neck is long, and so are my puzzles.'],
    dinoPtero:  ['Whoosh! I flew over the volcano just to say hi!', 'Hi, {title} {name}! The view from the sky is super!', 'Flap, flap! Want to play a game with me?'],
    dinoAnky:   ['Knock knock! My back is as hard as a rock. Hello, {title} {name}!', 'Hello there! I am slow, but I am very good at words.', 'See my tail? It is a club. A friendly club!'],
    dinoBaby:   ['Peep peep! I just hatched! Hello, {title} {name}!', 'Are you my mommy? No? You are a robot! So cool!', 'I am a baby dino! Wanna play with me?'],
  });
  Object.assign(LINES, {
    forest: ['Welcome to Dinosaur Village!', 'Wow, look at the big volcano!', 'Stomp, stomp! The dinosaurs are waving at you!'],
  });
}

// ---- Dino sprites ------------------------------------------------------------

// Colours for each dinosaur. They are drawn side-on facing right (the baby
// faces front), shaded from the top-left and outlined in ink like the rest.
const DINO_KINDS = {
  rex:    { body: '#6fd06a', belly: '#fff0a8', spot: '#4cb860', accent: '#ff9a4a' },
  tops:   { body: '#ffa95a', belly: '#ffe2b8', spot: '#f08a3a', accent: '#ffd34d', frill: '#8fd3ff', horn: '#fff4d8' },
  stego:  { body: '#b48cf0', belly: '#ece0ff', spot: '#9a70e0', accent: '#ff9ec4', plate2: '#ffd34d' },
  bronto: { body: '#8fd3ff', belly: '#e4f8ff', spot: '#6cb8f0', accent: '#ffd34d' },
  ptero:  { body: '#ff8fa8', belly: '#ffe0e8', spot: '#f0708e', accent: '#ffd34d', wing: '#ffc4d4' },
  anky:   { body: '#e8b878', belly: '#fff0d0', spot: '#c89050', accent: '#a8704a', stud: '#fff4d8' },
  baby:   { body: '#9be88a', belly: '#e8ffd8', spot: '#6fd06a', accent: '#8fd3ff', shell: '#fffaf0' },
};

const dinoCache = new Map();

// A dinosaur villager as a sprite { canvas, ax, ay }, cropped tight so its
// portrait fills the dialog box.
function dinoFolkSprite(kind, frame) {
  const ck = `${kind}|${frame}`;
  if (dinoCache.has(ck)) return dinoCache.get(ck);
  const d = DINO_KINDS[kind] || DINO_KINDS.rex;
  const W = 46;
  const H = 54;
  const FY = 50;
  const grid = [];
  for (let y = 0; y < H; y++) grid.push(new Array(W).fill(null));
  const set = (x, y, col) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < W && y < H) grid[y][x] = col;
  };
  const rect = (x, y, w, h, col) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, col); };
  // A rounded blob: lighter on the upper left, darker underneath.
  const blob = (cx, cy, rx, ry, col, flat) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const u = (x + 0.5 - cx) / rx;
      const v = (y + 0.5 - cy) / ry;
      if (u * u + v * v > 1) continue;
      let c = col;
      if (!flat && v > 0.5) c = shade(col, -26);
      else if (!flat && v < -0.45 && u < 0.35) c = mix(col, '#ffffff', 0.35);
      set(x, y, c);
    }
  };
  const poly = (pts, col) => {
    const xs = pts.map(p => p[0]);
    const ys = pts.map(p => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i];
          const [xj, yj] = pts[j];
          if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < (xj - xi) * (y + 0.5 - yi) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) set(x, y, typeof col === 'function' ? col(x, y) : col);
      }
    }
  };
  const ink = '#3f2c48';
  // Big shiny eye, rosy cheek and a smile, drawn last over the head.
  const eye = (x, y) => { rect(x, y, 2, 3, ink); set(x, y, '#ffffff'); };
  const cheek = (x, y) => rect(x, y, 2, 1, '#ff9ec4');
  const smile = pts => pts.forEach(([x, y]) => set(x, y, ink));
  const dark = shade(d.body, -34);
  const legs = (xs, top, col, toes) => xs.forEach(x => {
    rect(x, top, 4, FY - top, col);
    rect(x, FY - 1, 4, 1, shade(col, -24));
    if (toes) { set(x + 1, FY - 1, '#fff4d8'); set(x + 3, FY - 1, '#fff4d8'); }
  });
  const spots = pts => pts.forEach(([x, y]) => { set(x, y, d.spot); set(x + 1, y, d.spot); });
  DINO_DRAW[kind] && DINO_DRAW[kind]({ set, rect, blob, poly, eye, cheek, smile, legs, spots, dark, ink, d, FY, frame });

  // Ink outline wherever an empty pixel touches the dinosaur, then crop.
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  const filled = (x, y) => grid[y] && grid[y][x] && grid[y][x] !== ink;
  const out = grid.map((row, y) => row.map((col, x) =>
    col || ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => filled(x + dx, y + dy)) ? ink : null)));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (out[y][x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  const cv = makeCanvas(x1 - x0 + 1, y1 - y0 + 1);
  const ctx = cv.getContext('2d');
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (out[y][x]) px(ctx, x - x0, y - y0, 1, 1, out[y][x]);
  const sprite = { canvas: cv, ax: 22 - x0, ay: FY - y0 };
  dinoCache.set(ck, sprite);
  return sprite;
}

// One drawing per kind of dinosaur, on a 46 x 54 grid with feet on row FY.
const DINO_DRAW = {
  rex({ set, rect, blob, eye, cheek, smile, legs, spots, dark, d, FY }) {
    blob(12, 38, 8, 4, d.body);
    blob(6, 40, 4.5, 2.6, d.body);
    blob(2.5, 41, 2.5, 1.6, d.body);
    legs([15], 42, dark, true);
    blob(20, 36, 8.5, 9, d.body);
    blob(23, 38, 4.5, 6.5, d.belly);
    blob(18, 42, 5, 4.5, d.body);
    legs([17], 44, d.body, true);
    rect(17, FY - 1, 8, 1, shade(d.body, -24));
    set(24, FY - 1, '#fff4d8');
    blob(26, 29, 5, 5, d.body);
    blob(30, 21, 9, 7.5, d.body);
    blob(36, 25, 6.5, 4.5, d.body);
    rect(30, 28, 9, 1, d.belly);
    // Tiny arms.
    rect(27, 33, 4, 2, d.body);
    set(31, 34, '#fff4d8');
    rect(26, 35, 3, 2, dark);
    // Orange bumps down the back and a few spots.
    for (const [x, y] of [[27, 13], [23, 16], [19, 26], [14, 33], [9, 35]]) { set(x, y, d.accent); set(x + 1, y, d.accent); set(x, y - 1, d.accent); }
    spots([[17, 31], [21, 29], [13, 37], [24, 18], [28, 16]]);
    eye(32, 17);
    cheek(34, 22);
    smile([[33, 26], [34, 27], [35, 27], [36, 27], [37, 27], [38, 26], [39, 26], [40, 25]]);
    set(36, 26, '#ffffff');
    set(39, 25, '#ffffff');
    set(41, 21, '#3f2c48');
  },
  tops({ set, rect, blob, poly, eye, cheek, smile, legs, spots, dark, d, FY }) {
    blob(6, 39, 5, 3, d.body);
    blob(2, 40, 2.5, 1.8, d.body);
    legs([11, 24], 41, dark, false);
    blob(17, 36, 11.5, 8, d.body);
    blob(18, 41, 8, 2.5, d.belly, true);
    legs([14, 27], 42, d.body, true);
    // Frill with a ring of dots, then the head and its horns.
    blob(30, 27, 7, 9.5, d.frill);
    for (let a = -2.4; a <= 1.2; a += 0.5) set(30 + Math.cos(a) * 5.5, 27 + Math.sin(a) * 7.5, d.accent);
    blob(35, 34, 6.5, 5.5, d.body);
    blob(40, 36, 3.5, 3, d.belly);
    poly([[33, 29], [36, 29], [41, 21], [40, 20]], d.horn);
    poly([[30, 29], [32, 29], [35, 22], [34, 21]], shade(d.horn, -30));
    poly([[39, 32], [41, 32], [42, 28]], d.horn);
    spots([[12, 32], [17, 30], [22, 33], [9, 36]]);
    eye(36, 31);
    cheek(38, 35);
    smile([[39, 38], [40, 38], [41, 37], [42, 37]]);
    set(43, 35, '#3f2c48');
  },
  stego({ set, blob, eye, cheek, smile, legs, spots, dark, d, FY }) {
    // Plates first, so the back covers their roots.
    [[9, 3.0, 5], [14, 3.5, 7], [19, 4, 8], [24, 3.5, 7], [29, 3, 5]].forEach(([x, w, h], i) => {
      const top = 36 - Math.sqrt(Math.max(0, 1 - ((x - 19) / 13) ** 2)) * 9;
      blob(x, top - h / 2 + 1, w, h, i % 2 ? d.plate2 : d.accent);
    });
    blob(6, 38, 5, 3, d.body);
    blob(2, 38, 2.5, 2, d.body);
    for (const [x, y] of [[1, 35], [1, 34], [4, 35], [4, 34], [5, 33]]) set(x, y, '#fff4d8');
    legs([11, 24], 41, dark, false);
    blob(19, 36, 13, 8.5, d.body);
    blob(20, 41, 9, 2.5, d.belly, true);
    legs([14, 27], 42, d.body, true);
    blob(33, 38, 3.5, 3.5, d.body);
    blob(37, 39, 5, 3.6, d.body);
    spots([[14, 32], [20, 31], [25, 34], [10, 36]]);
    eye(38, 36);
    cheek(40, 39);
    smile([[39, 41], [40, 41], [41, 40]]);
    set(42, 38, '#3f2c48');
  },
  bronto({ set, rect, blob, eye, cheek, smile, legs, spots, dark, d, FY }) {
    blob(7, 39, 6, 3, d.body);
    blob(2.5, 41, 3, 1.8, d.body);
    legs([12, 24], 40, dark, false);
    // The long neck, a chain of shrinking blobs up to the little head.
    for (let t = 0; t <= 1; t += 0.06) blob(25 + t * 9 + Math.sin(t * 3) * 1.5, 32 - t * 22, 4.5 - t * 1.6, 4.5 - t * 1.6, d.body, true);
    blob(17, 35, 11.5, 8.5, d.body);
    blob(18, 40, 8, 2.5, d.belly, true);
    legs([15, 27], 41, d.body, true);
    rect(30, 22, 2, 8, d.belly);
    blob(37, 9, 5.5, 4, d.body);
    spots([[12, 31], [18, 29], [23, 32], [9, 35], [33, 17]]);
    for (const [x, y] of [[13, 28], [18, 27], [23, 28]]) { set(x, y, d.accent); set(x + 1, y, d.accent); }
    eye(37, 6);
    cheek(39, 10);
    smile([[40, 12], [41, 12], [42, 11]]);
    set(42, 8, '#3f2c48');
  },
  ptero({ set, rect, blob, poly, eye, cheek, smile, d }) {
    // It hovers above the ground, wings spread wide.
    const wing = (x, y) => (hash(x, y, 7) < 0.06 ? '#ffffff' : (x + y) % 9 === 0 ? shade(d.wing, -24) : d.wing);
    poly([[24, 25], [40, 14], [44, 20], [36, 28], [25, 32]], (x, y) => shade(wing(x, y), -30));
    poly([[19, 25], [3, 14], [0, 20], [7, 28], [18, 32]], wing);
    for (let i = 0; i < 16; i++) set(18 - i, 25 - Math.round(i * 0.7), shade(d.body, -10));
    for (let i = 0; i < 16; i++) set(25 + i, 25 - Math.round(i * 0.7), shade(d.body, -40));
    blob(21.5, 29, 4.5, 6.5, d.body);
    blob(22.5, 31, 2.5, 4, d.belly, true);
    rect(19, 35, 1, 3, '#ffb347');
    rect(23, 35, 1, 3, '#ffb347');
    poly([[22, 18], [12, 11], [24, 15]], d.accent);
    blob(25, 20, 5, 4.5, d.body);
    poly([[28, 18], [39, 21], [28, 23]], d.accent);
    eye(26, 17);
    cheek(27, 22);
    smile([[29, 22], [30, 22]]);
  },
  anky({ set, rect, blob, legs, eye, cheek, smile, dark, d, FY }) {
    blob(7, 41, 5.5, 2.4, d.body);
    blob(2.5, 40, 3, 3, d.accent);
    legs([11, 25], 43, dark, false);
    blob(19, 39, 12.5, 7.5, d.accent);
    blob(19, 39, 11, 6, d.body);
    // Studs on the armour and little horns along its side.
    for (let y = 34; y <= 41; y += 3) for (let x = 10 + (y % 2) * 2; x <= 28; x += 4) {
      const u = (x - 19) / 11;
      const v = (y - 39) / 6;
      if (u * u + v * v < 0.8) { set(x, y, d.stud); set(x + 1, y, shade(d.stud, -30)); }
    }
    for (const x of [9, 14, 19, 24, 29]) {
      const top = 39 - Math.sqrt(Math.max(0, 1 - ((x - 19) / 12.5) ** 2)) * 7.5;
      set(x, top - 1, d.stud);
      set(x, top - 2, d.stud);
      set(x - 1, top - 1, d.stud);
    }
    rect(13, 44, 14, 1, d.belly);
    legs([14, 28], 44, d.body, true);
    blob(34, 42, 5, 3.6, d.body);
    eye(35, 39);
    cheek(37, 42);
    smile([[37, 44], [38, 44], [39, 43]]);
  },
  baby({ set, rect, blob, poly, cheek, smile, d, FY }) {
    // A hatchling peeking out of its cracked egg, facing front.
    blob(22, 33, 6.5, 6, d.body);
    blob(22, 36, 3.5, 2.5, d.belly, true);
    const zig = x => 38 + ((x >> 1) % 2);
    for (let y = 36; y < FY; y++) for (let x = 12; x <= 32; x++) {
      const u = (x + 0.5 - 22) / 9;
      const v = (y + 0.5 - 41) / 9;
      if (u * u + v * v > 1 || y < zig(x)) continue;
      let col = u < -0.5 ? '#efe4d0' : d.shell;
      for (const [sx, sy, sr] of [[16, 44, 1.6], [25, 42, 2.1], [21, 47, 1.4], [29, 45, 1.2]]) if ((x - sx) ** 2 + (y - sy) ** 2 <= sr * sr) col = d.accent;
      set(x, y, col);
    }
    // Bit of shell worn as a hat.
    for (let x = 16; x <= 28; x++) {
      const top = Math.round(27 - Math.sqrt(Math.max(0, 1 - ((x - 22) / 6.5) ** 2)) * 4);
      for (let y = top; y <= 28 + ((x >> 1) % 2); y++) set(x, y, x < 19 ? '#efe4d0' : d.shell);
    }
    set(24, 25, d.accent);
    set(25, 25, d.accent);
    rect(13, 37, 2, 2, d.body);
    rect(30, 37, 2, 2, d.body);
    for (const x of [18, 25]) { rect(x, 31, 2, 3, '#3f2c48'); set(x, 31, '#ffffff'); }
    cheek(16, 35);
    cheek(27, 35);
    smile([[20, 36], [21, 37], [22, 37], [23, 37], [24, 36]]);
  },
};

// ---- Dinosaur Village art ----------------------------------------------------

// Bright jungle grass, with tropical flowers on some tiles.
function drawJungleGrass(ctx, ox, oy, c, r, flowers) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const n = hash(x, y, 5);
    if (n < 0.05) return '#c4f590';
    if (n < 0.09) return '#58b048';
    return (c + r) % 2 ? '#86d25e' : '#7ecb58';
  });
  // Little fern tufts.
  for (let i = 0; i < 2; i++) {
    const fx = ox + 8 + Math.floor(hash(c, r, 30 + i) * 16);
    const fy = oy + 4 + Math.floor(hash(c, r, 40 + i) * 8);
    px(ctx, fx, fy, 1, 3, '#4f9f40');
    px(ctx, fx - 1, fy + 1, 1, 1, '#4f9f40');
    px(ctx, fx + 1, fy, 1, 1, '#6fbf50');
  }
  if (flowers) {
    const colors = ['#ff5a6a', '#ffd34d', '#ff9a3a', '#ffffff', '#ff8fc8'];
    for (let i = 0; i < 3; i++) {
      const fx = ox + 8 + Math.floor(hash(c, r, 10 + i) * 16);
      const fy = oy + 4 + Math.floor(hash(c, r, 20 + i) * 8);
      const col = colors[Math.floor(hash(c, r, 50 + i) * colors.length)];
      px(ctx, fx, fy + 1, 1, 2, '#3f8f40');
      px(ctx, fx - 1, fy, 3, 1, col);
      px(ctx, fx, fy - 1, 1, 3, col);
      px(ctx, fx, fy, 1, 1, '#fff6a8');
    }
  }
}

// Sandy dirt path with pebbles, and now and then a big three-toed footprint.
function drawDinoDirt(ctx, ox, oy, c, r) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const n = hash(x, y, 6);
    if (n < 0.04) return '#d8a860';
    if (n < 0.08) return '#fff2c8';
    if (hash(x >> 1, y >> 1, 7) < 0.03) return '#c8b8a0';
    return '#f2d290';
  });
  if (hash(c, r, 8) < 0.28) {
    const fx = ox + 12 + Math.floor(hash(c, r, 9) * 8);
    const fy = oy + 6;
    const col = '#d8ae68';
    px(ctx, fx, fy + 2, 3, 2, col);
    px(ctx, fx - 2, fy, 1, 2, col);
    px(ctx, fx + 1, fy - 1, 1, 2, col);
    px(ctx, fx + 4, fy, 1, 2, col);
  }
}

// A flat ring of straw on the ground, for a nest that someone sits in.
function drawNestRing(ctx, cx, cy) {
  for (let y = -6; y <= 6; y++) for (let x = -14; x <= 14; x++) {
    const d = (x / 14) ** 2 + (y / 6) ** 2;
    if (d > 1) continue;
    let col = d > 0.45 ? (hash(x, y, 12) < 0.5 ? '#e0a850' : '#f2c86a') : '#b88a48';
    if (d > 0.45 && (x + y * 3) % 5 === 0) col = '#b07f30';
    px(ctx, cx + x, cy + y, 1, 1, col);
  }
}

// A straw nest holding spotted eggs. (cx, cy) is its centre on the ground.
function drawDinoNest(ctx, cx, cy, eggs) {
  ctx.fillStyle = 'rgba(40,60,30,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx + 2, cy + 3, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const straw = (x, y, d) => {
    let col = hash(x, y, 13) < 0.5 ? '#e0a850' : '#f2c86a';
    if ((x * 2 + y * 3) % 7 === 0) col = '#b07f30';
    if (d < 0.3 && y < 0) col = '#ffe08a';
    return col;
  };
  // Back half of the rim, the hollow, the eggs, then the front of the rim.
  for (let y = -9; y <= 0; y++) for (let x = -15; x <= 15; x++) {
    const d = (x / 15) ** 2 + ((y + 3) / 6) ** 2;
    if (d <= 1) px(ctx, cx + x, cy + y, 1, 1, d < 0.45 ? '#8a5a30' : straw(x, y, d));
  }
  eggs.forEach((col, i) => {
    const ex = cx - 7 + i * 7;
    const ey = cy - 4 - (i % 2);
    for (let y = -7; y <= 0; y++) for (let x = -3; x <= 3; x++) {
      if ((x / 3.5) ** 2 + ((y + 3.5) / 4.2) ** 2 > 1) continue;
      let c = x < -1 ? shade(col, -20) : col;
      if (x === -1 && y === -6) c = '#ffffff';
      if (hash(x + i * 9, y, 14) < 0.18) c = shade(col, -55);
      px(ctx, ex + x, ey + y, 1, 1, c);
    }
  });
  for (let y = -3; y <= 4; y++) for (let x = -16; x <= 16; x++) {
    const d = (x / 16) ** 2 + (y / 4.5) ** 2;
    if (d > 1 || y < -1 + Math.abs(x) / 8) continue;
    px(ctx, cx + x, cy + y, 1, 1, d > 0.8 && y > 2 ? '#b07f30' : straw(x, y, 1));
  }
  for (const [x, y] of [[-14, -1], [13, 0], [-5, 4], [7, 3]]) px(ctx, cx + x, cy + y, 3, 1, '#c8903a');
}

// A giant cracked eggshell that a dinosaur family lives in.
function drawEggHut(ctx, cx, cy, spot) {
  ctx.fillStyle = 'rgba(40,60,30,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx + 5, cy + 2, 30, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  const RX = 24;
  const RY = 34;
  const ey = cy - 30;
  const inside = (x, y) => (x / RX) ** 2 + ((y - ey + cy) / RY) ** 2 <= 1 && y <= 1;
  const crack = x => -40 + ((Math.floor((x + 40) / 4)) % 2 ? 3 : 0);
  const spots = [[-12, -50, 4], [6, -58, 3], [12, -44, 4.5], [-4, -34, 3], [-15, -22, 3.5], [16, -18, 3], [3, -48, 2.5], [-8, -60, 2.5]];
  for (let y = -66; y <= 1; y++) for (let x = -RX; x <= RX; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5);
    const l = (-x * 0.6 - (y + 40) * 0.5) / 30 + (hash(x, y, 15) - 0.5) * 0.15;
    let col = l > 0.45 ? '#ffffff' : l < -0.45 ? '#eadcc4' : '#fff8ea';
    // Pastel spots.
    for (const [sx, sy, sr] of spots) {
      const d = (x - sx) ** 2 + (y - sy) ** 2;
      if (d <= sr * sr) col = d > (sr - 1) ** 2 ? shade(spot, -24) : spot;
    }
    if (y === crack(x) || (y === crack(x) + 1 && x % 4 === 1)) col = '#b8a890';
    if (y < crack(x) && !edge) col = mix(col, spot, 0.12);
    px(ctx, cx + x, cy + y, 1, 1, edge ? '#a89878' : col);
  }
  // Round wooden door, a porthole window and a vine.
  for (let x = -7; x <= 7; x++) {
    const top = Math.round(Math.sqrt(1 - (x / 7.5) ** 2) * 6) + 10;
    for (let y = 0; y <= top; y++) {
      const col = y > top - 1 || Math.abs(x) === 7 ? '#6b4228' : x % 4 === 0 ? '#8a5a3c' : '#a8704a';
      px(ctx, cx - 6 + x, cy - y, 1, 1, col);
    }
  }
  px(ctx, cx - 2, cy - 7, 2, 2, '#ffd34d');
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
    const d = x * x + y * y;
    if (d <= 16) px(ctx, cx + 11 + x, cy - 26 + y, 1, 1, d > 9 ? '#a8704a' : d < 3 && x < 0 ? '#ffffff' : '#9fd8ff');
  }
  for (let i = 0; i < 24; i++) {
    const x = Math.round(cx - 20 + Math.sin(i / 3) * 2 + i * 0.3);
    const y = cy - 2 - i * 2;
    px(ctx, x, y, 1, 2, '#3f9f40');
    if (i % 3 === 0) px(ctx, x + (i % 2 ? 1 : -2), y, 2, 2, '#7fd05a');
  }
}

// The friendly volcano: a terracotta cone with a smiley face, a bubbling
// pool of lava on top and icing-like drips. (cx, cy) is the base centre.
function drawVolcano(ctx, cx, cy) {
  const H = 92;
  const half = y => {
    const t = (y + H) / H;
    return 15 + 52 * Math.pow(Math.max(0, t), 1.3);
  };
  // The foot of the cone follows the ground, rounder in front.
  const foot = x => -14 + 14 * Math.sqrt(Math.max(0, 1 - (x / 68) ** 2));
  const inside = (x, y) => y >= -H && y <= foot(x) && Math.abs(x) <= half(y);
  // Leafy scallops of grass climbing the lower slopes.
  const grass = x => foot(x) - 16 - 5 * Math.abs(Math.sin(x / 6)) - 3 * hash(Math.floor(x / 4), 0, 19);
  ctx.fillStyle = 'rgba(40,60,30,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx + 6, cy - 4, 74, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let y = -H; y <= 0; y++) for (let x = -70; x <= 70; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y + 1.5);
    const u = x / half(y);
    let col = u < -0.45 ? '#e8a070' : u > 0.5 ? '#b0623e' : '#cc7c50';
    if (hash(Math.floor((x + 80) / 5), Math.floor((y + 100) / 4), 17) < 0.12) col = shade(col, 12);
    if (hash(x, y, 18) < 0.03) col = shade(col, -18);
    // Soft rocky ledges round the cone.
    if ((y + H) % 17 === 0 && hash(Math.floor(x / 9), y, 22) < 0.6) col = shade(col, -22);
    const g = grass(x);
    if (y > g) {
      col = u < -0.4 ? '#9be070' : u > 0.5 ? '#5fae48' : '#7ecb58';
      if (y < g + 2) col = shade(col, 18);
      if (hash(x, y, 23) < 0.04) col = ['#ff5a6a', '#ffd34d', '#ffffff'][Math.floor(hash(x, y, 24) * 3)];
    }
    px(ctx, cx + x, cy + y, 1, 1, edge ? (y > g ? '#3f8a38' : '#7a3e28') : col);
  }
  // Crater with a pool of lava.
  const top = cy - H;
  for (let y = -5; y <= 5; y++) for (let x = -17; x <= 17; x++) {
    const d = (x / 17) ** 2 + (y / 5) ** 2;
    if (d > 1) continue;
    let col = d > 0.6 ? (y < 0 ? '#8a4a30' : '#d88a5a') : '#ff7a3a';
    if (d < 0.35) col = hash(x >> 1, y, 20) < 0.3 ? '#fff2a0' : '#ffb347';
    px(ctx, cx + x, top + y + 1, 1, 1, col);
  }
  // Lava draped over the rim like icing, with a few longer drips.
  for (let x = -22; x <= 22; x++) {
    const drip = { '-13': 9, '-12': 10, '-11': 9, '-3': 14, '-2': 15, '-1': 14, '8': 7, '9': 8, '10': 7, '15': 5 }[x] || 0;
    const len = 4 + Math.round(2 * Math.abs(Math.sin(x / 2.5))) + drip;
    for (let i = 0; i < len; i++) {
      const y = top + 4 + i;
      if (!inside(x + 0.5, y - cy + 0.5) || !inside(x - 0.5, y - cy + 0.5) || !inside(x + 1.5, y - cy + 0.5)) continue;
      let col = i === len - 1 ? '#d8602a' : x < -6 && i < 3 ? '#ffd34d' : '#ff8a3a';
      if (i === 0 || (drip && x % 2 === 0 && i < len - 2 && i % 4 === 1)) col = '#ffb347';
      px(ctx, cx + x, y, 1, 1, col);
    }
  }
  // A happy face.
  const fy = cy - 46;
  for (const ex of [-14, 10]) {
    px(ctx, cx + ex, fy, 1, 1, '#4a2620');
    px(ctx, cx + ex + 1, fy - 1, 3, 1, '#4a2620');
    px(ctx, cx + ex + 4, fy, 1, 1, '#4a2620');
  }
  px(ctx, cx - 18, fy + 5, 5, 2, '#ff9a8a');
  px(ctx, cx + 14, fy + 5, 5, 2, '#ff9a8a');
  px(ctx, cx - 6, fy + 7, 1, 1, '#4a2620');
  px(ctx, cx - 5, fy + 8, 10, 2, '#4a2620');
  px(ctx, cx - 3, fy + 9, 6, 1, '#ff7a6a');
  px(ctx, cx + 5, fy + 7, 1, 1, '#4a2620');
}

// Puffs of smoke drifting up from the volcano, looping every few seconds.
function drawVolcanoSmoke(ctx, cx, top, t) {
  const a0 = ctx.globalAlpha;
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.22 + i / 3) % 1;
    const x = Math.round(cx + Math.sin(p * 4 + i) * 5 + p * 14);
    const y = Math.round(top - 6 - p * 54);
    const R = 3 + p * 8;
    ctx.globalAlpha = a0 * Math.min(1, (1 - p) * 1.6);
    for (let dy = -Math.ceil(R); dy <= Math.ceil(R); dy++) for (let dx = -Math.ceil(R * 1.3); dx <= Math.ceil(R * 1.3); dx++) {
      const d = (dx / (R * 1.3)) ** 2 + (dy / R) ** 2;
      if (d > 1) continue;
      px(ctx, x + dx, y + dy, 1, 1, d > 0.7 ? '#d8d0e0' : dy > R * 0.3 ? '#ece8f0' : '#ffffff');
    }
  }
  ctx.globalAlpha = a0;
}

// Rocky hill with a dark doorway: the way into the Villain Cave. A striped
// warning plank over the door says villains live inside.
function drawVillainCaveMouth(ctx, cx, cy) {
  const blobs = [[0, -22, 30], [-22, -12, 18], [22, -12, 18], [-10, -38, 16], [12, -36, 15]];
  const inside = (x, y) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + ((y - by) * 1.15) ** 2 <= br * br) && y <= 2;
  ctx.fillStyle = 'rgba(40,60,30,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 44, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let y = -56; y <= 2; y++) for (let x = -42; x <= 42; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5);
    const l = (-x * 0.5 - y * 0.6) / 40 + (hash(x, y, 31) - 0.5) * 0.3;
    let col = l > 0.55 ? '#c8b49a' : l < -0.05 ? '#8a7460' : '#a8927a';
    if (hash(Math.floor((x + 50) / 6), Math.floor((y + 60) / 5), 32) < 0.12) col = shade(col, 14);
    px(ctx, cx + x, cy + y, 1, 1, edge ? '#5a4838' : col);
  }
  // Vines hanging over the rock.
  for (const [vx, len] of [[-30, 14], [-18, 22], [20, 18], [31, 10]]) {
    for (let i = 0; i < len; i++) {
      const y = cy - 46 + Math.abs(vx) / 2 + i;
      px(ctx, cx + vx + Math.round(Math.sin(i / 3)), y, 1, 1, '#3f9f40');
      if (i % 4 === 1) px(ctx, cx + vx + Math.round(Math.sin(i / 3)) + 1, y, 2, 2, '#7fd05a');
    }
  }
  for (let x = -12; x <= 12; x++) {
    const t = x / 12.5;
    const top = Math.round(Math.sqrt(1 - t * t) * 12) + 12;
    for (let y = 0; y < top; y++) {
      const col = y > top - 2 ? '#3a2c30' : mix('#1e1620', '#5a3a50', Math.max(0, 1 - y / top - 0.2));
      px(ctx, cx + x, cy + 1 - y, 1, 1, col);
    }
  }
  // Two cheeky glowing eyes peeking out of the dark.
  px(ctx, cx - 5, cy - 8, 3, 2, '#fff06a');
  px(ctx, cx + 3, cy - 8, 3, 2, '#fff06a');
  px(ctx, cx - 4, cy - 8, 1, 1, '#3a2c30');
  px(ctx, cx + 4, cy - 8, 1, 1, '#3a2c30');
  // Warning plank.
  for (let x = -15; x <= 15; x++) for (let y = 0; y < 5; y++) {
    const col = y === 0 || y === 4 ? '#3a2c30' : Math.floor((x + y + 40) / 3) % 2 ? '#ffd34d' : '#3a2c30';
    px(ctx, cx + x, cy - 29 + y, 1, 1, col);
  }
}

// Fern tree with a scaly trunk and a crown of long fronds.
function makeCycad() {
  const W = 46;
  const H = 54;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  const cx = 23;
  plantShadow(ctx, cx, 49, 10);
  for (let y = 26; y < 49; y++) {
    const w = 6 + (y > 44 ? 2 : 0);
    for (let x = 0; x < w; x++) {
      const dia = ((x + y) % 4 === 0) || ((x - y + 40) % 4 === 0);
      px(ctx, cx - w / 2 + x, y, 1, 1, x === 0 ? '#6b4228' : dia ? '#8a5a3c' : x > w - 3 ? '#d8a06a' : '#b8804e');
    }
  }
  const top = { x: cx, y: 25 };
  for (const [ang, len] of [[-2.9, 20], [-0.25, 20], [-2.4, 17], [-0.75, 17], [-1.9, 14], [-1.25, 14], [2.8, 16], [0.35, 16]]) {
    for (let s = 0; s < len; s++) {
      const x = Math.round(top.x + Math.cos(ang) * s);
      const y = Math.round(top.y + Math.sin(ang) * s + (s * s) / 34);
      px(ctx, x, y, 1, 1, '#2f8040');
      if (s > 1 && s < len - 1 && s % 2 === 0) {
        const lx = Math.round(-Math.sin(ang) * 3);
        const ly = Math.round(Math.cos(ang) * 3);
        for (const k of [1, -1]) {
          px(ctx, x + lx * k / 3, y + ly * k / 3 + 1, 1, 1, '#4fb050');
          px(ctx, x + Math.round(lx * k * 2 / 3), y + Math.round(ly * k * 2 / 3) + 1, 1, 1, s < len - 4 ? '#5fc060' : '#9be88a');
          px(ctx, x + lx * k, y + ly * k + 2, 1, 1, '#3f9f50');
        }
      }
    }
  }
  px(ctx, top.x - 2, top.y - 1, 4, 3, '#ffb347');
  px(ctx, top.x - 1, top.y - 1, 1, 1, '#fff2a0');
  return { canvas: cv, ax: cx, ay: 48 };
}

// Low fern clump.
function makeFernClump() {
  const W = 30;
  const H = 24;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  plantShadow(ctx, 15, 20, 11);
  for (const [ang, len] of [[-2.8, 13], [-0.35, 13], [-2.2, 11], [-0.9, 11], [-1.55, 10]]) {
    for (let s = 0; s < len; s++) {
      const x = Math.round(15 + Math.cos(ang) * s);
      const y = Math.round(20 + Math.sin(ang) * s + (s * s) / 14);
      px(ctx, x, y, 1, 1, '#2f8040');
      if (s > 1 && s % 2 === 1) {
        px(ctx, x - 1, y + 1, 1, 1, '#5fc060');
        px(ctx, x + 1, y + 1, 1, 1, s > len - 4 ? '#b4f090' : '#7fd870');
      }
    }
  }
  return { canvas: cv, ax: 15, ay: 20 };
}

// A round mossy boulder.
function makeBoulder() {
  const W = 26;
  const H = 22;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  plantShadow(ctx, 13, 18, 11);
  const pal = { dark: '#9a8a7a', mid: '#bcae9c', light: '#e0d6c8', line: '#6a5a4c', spark: '#7fcf58', sparks: 0.05 };
  const blobs = [[13, 12, 8], [7, 15, 5], [19, 15, 5]];
  const inside = (x, y) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + ((y - by) * 1.2) ** 2 <= br * br) && y < 19;
  shadeBlob(ctx, W, H, inside, pal, 13, 11, 9, 21);
  return { canvas: cv, ax: 13, ay: 18 };
}

const dinoPlants = new Map();
function dinoPlant(kind) {
  if (dinoPlants.has(kind)) return dinoPlants.get(kind);
  TREE_PALETTES.jungle = TREE_PALETTES.jungle || { dark: '#2f9a50', mid: '#4cc060', light: '#a0ec72', spark: '#ffb347', line: '#1f6a3a', sparks: 0.035 };
  const p = {
    jungle: () => makeTree('jungle'),
    bigJungle: () => makeTree('jungle', 1.3),
    cycad: makeCycad,
    fern: makeFernClump,
    boulder: makeBoulder,
    palm: () => makePlant('palm'),
    tropic: () => makeBush(['#4cc060', '#2f9a50', '#a0ec72', '#1f6a3a'], ['#ff5a6a', '#ffd34d', '#ff9a3a']),
  }[kind]();
  dinoPlants.set(kind, p);
  return p;
}

// ---- Dinosaur Village ----------------------------------------------------------

const DINO_N = 30;

CAPTAIN_SCENES.forest = function buildDinoVillage() {
  const sc = makeScene('dino', DINO_N, DINO_N, 140, 60);
  sc.outdoor = true;
  const N = DINO_N;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) tileAt(sc, c, r).flowers = hash(c, r, 61) < 0.1;
  const reserved = new Set();
  const key = (c, r) => r * N + c;
  const reserve = (c, r) => reserved.add(key(c, r));
  const reserveBox = (c0, r0, c1, r1) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) reserve(c, r); };
  // The same winding way as the forest path, in sandy dirt: north gate to
  // south gate, and a cross path out to the cave in the west.
  const dirt = (c, r) => { const t = tileAt(sc, c, r); if (t && t.type !== 'water') t.dirt = true; };
  for (let r = 0; r <= 12; r++) for (const dc of [0, 1]) dirt(14 + Math.round(Math.sin(r / 3) * 1.5) + dc, r);
  for (let r = 12; r <= 29; r++) for (const dc of [0, 1]) dirt((r >= 26 ? 15 : 14 + Math.round(Math.sin(r / 4) * 2)) + dc, r);
  for (let c = 5; c <= 24; c++) dirt(c, 17);
  // A warm blue lagoon.
  for (let r = 19; r <= 27; r++) for (let c = 17; c <= 27; c++) {
    if (((c - 22.5) / 4.2) ** 2 + ((r - 23) / 3.2) ** 2 <= 1) setTile(sc, c, r, 'water');
  }

  // The friendly volcano, with smoke puffing out of the top.
  const V = { c: 21, r: 3, w: 4, d: 4 };
  block(sc, V.c, V.r, V.w, V.d);
  reserveBox(V.c - 1, V.r - 1, V.c + V.w, V.r + V.d);
  const vc = tileCenter(sc, V.c + 1.5, V.r + 2.5);
  addObject(sc, V, { x: vc.x - 74, y: vc.y - 100, w: 150, h: 120 }, ctx => drawVolcano(ctx, Math.round(vc.x), Math.round(vc.y)));
  sc.objects.push({ c0: V.c, r0: V.r, c1: V.c + V.w - 1, r1: V.r + V.d - 1, x: vc.x - 40, y: vc.y - 170, w: 100, h: 80,
    animated: (ctx, t) => drawVolcanoSmoke(ctx, Math.round(vc.x), Math.round(vc.y) - 92, t) });
  sc.lamps.push({ x: vc.x, y: vc.y - 92 });

  // Eggshell homes.
  for (const [c, r, spot] of [[4, 3, '#8fd3ff'], [25, 9, '#ff9ec4'], [9, 8, '#b48cf0'], [3, 21, '#ffd34d'], [3, 7, '#9be070']]) {
    block(sc, c, r, 2, 2);
    reserveBox(c - 1, r - 1, c + 2, r + 2);
    const m = tileCenter(sc, c + 0.5, r + 0.5);
    addObject(sc, { c, r, w: 2, d: 2 }, { x: m.x - 44, y: m.y - 80, w: 90, h: 92 }, ctx => drawEggHut(ctx, Math.round(m.x), Math.round(m.y), spot));
  }
  // Lily pads on the lagoon.
  for (const [c, r, flower] of [[20, 22, '#ff9ec4'], [24, 24, null], [22, 25, '#ffffff'], [25, 21, null]]) {
    const p = tileCenter(sc, c, r);
    addObject(sc, { c, r, w: 1, d: 1 }, { x: p.x - 8, y: p.y - 8, w: 16, h: 12 }, ctx => drawLilyPad(ctx, Math.round(p.x), Math.round(p.y), flower));
  }

  // Nests full of eggs.
  for (const [c, r, eggs] of [[9, 5, ['#9fd8ff', '#fff4d8', '#ffc4d4']], [24, 13, ['#ffe08a', '#c8f0a0', '#fff4d8']], [6, 26, ['#ffc4d4', '#d8c8ff']]]) {
    block(sc, c, r, 1, 1);
    reserveBox(c - 1, r - 1, c + 1, r + 1);
    const p = tileCenter(sc, c, r);
    addObject(sc, { c, r, w: 1, d: 1 }, { x: p.x - 18, y: p.y - 16, w: 36, h: 24 }, ctx => drawDinoNest(ctx, Math.round(p.x), Math.round(p.y), eggs));
  }

  const cave = addDinoCave(sc);
  reserveBox(0, 12, 3, 20);
  const shop = addDinoShop(sc);
  reserveBox(7, 12, 12, 17);
  for (const n of FOREST_NPCS) reserveBox(n.c - 1, n.r - 1, n.c + 1, n.r + 1);
  reserveBox(13, 0, 16, 2);
  reserveBox(13, 26, 18, 29);

  sc.paintGround = g => {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const t = tileAt(sc, c, r);
      if (t.type === 'water') continue;
      const o = tileOrigin(sc, c, r);
      if (t.dirt) drawDinoDirt(g, o.x, o.y, c, r);
      else drawJungleGrass(g, o.x, o.y, c, r, t.flowers);
      if (t.mat) {
        const cx = o.x + 16;
        const cy = o.y + 8;
        fillPoly(g, diamondPts(o.x, o.y).map(p => ({ x: cx + (p.x - cx) * 0.7, y: cy + (p.y - cy) * 0.7 })), t.mat);
      }
    }
    // A sandy shore round the lagoon.
    for (const { c, r } of sc.water) for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const t = tileAt(sc, c + dc, r + dr);
      if (!t || t.type === 'water' || t.dirt) continue;
      const o = tileOrigin(sc, c + dc, r + dr);
      fillPoly(g, diamondPts(o.x, o.y).map(p => ({ x: o.x + 16 + (p.x - o.x - 16) * 0.9 - dc * 3 + dr * 3, y: o.y + 8 + (p.y - o.y - 8) * 0.9 - dc * 1.5 - dr * 1.5 })),
        (x, y) => (hash(x, y, 33) < 0.08 ? '#fff6d0' : '#f6dc9c'));
    }
    // The baby dino's nest is flat on the ground, so the baby can sit in it.
    const baby = FOREST_NPCS.find(n => n.look === 'dinoBaby');
    if (baby) { const p = tileCenter(sc, baby.c, baby.r); drawNestRing(g, Math.round(p.x), Math.round(p.y) + 1); }
  };

  // Jungle all round the edge and dotted about inside.
  const plants = ['jungle', 'palm', 'cycad', 'bigJungle', 'fern', 'tropic', 'cycad', 'palm', 'jungle', 'boulder'].map(dinoPlant);
  const nearPath = (c, r) => {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const t = tileAt(sc, c + dc, r + dr);
      if (t && (t.dirt || t.type === 'water')) return true;
    }
    return false;
  };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const t = tileAt(sc, c, r);
    if (t.blocked || reserved.has(key(c, r)) || t.dirt || nearPath(c, r)) continue;
    const ring = c < 2 || r < 2 || c > N - 3 || r > N - 3;
    if (hash(c, r, 93) >= (ring ? 0.6 : 0.13)) continue;
    if (!ring && sc.objects.some(o => o.tree && Math.abs(o.c0 - c) <= 1 && Math.abs(o.r0 - r) <= 1)) continue;
    const tree = ring ? plants[Math.floor(hash(c, r, 94) * 4)] : plants[Math.floor(hash(c, r, 94) * plants.length)];
    block(sc, c, r, 1, 1);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, tree: true, canvas: tree.canvas, x: p.x - tree.ax, y: p.y - tree.ay, w: tree.canvas.width, h: tree.canvas.height });
  }

  for (const n of FOREST_NPCS) {
    const npc = makeNpc(n, null);
    npc.level = 2;
    sc.npcs.push(npc);
  }
  // Gate back to Robot Town in the north, and to Car Village in the south.
  addGate(sc, [13, 16], 1, '#ffc8a0');
  sc.links = [14, 15].map(c => ({ c, r: 0, target: 'town', at: { c: 19 + (c - 14), r: 37 }, icon: '🤖', style: 'gate' }));
  const tg = tileCenter(sc, 14.5, 1);
  sc.signs.push({ x: tg.x, y: tg.y - 64, text: place('town'), color: '#5aa6e0' });
  addGate(sc, [14, 17], 28, '#ffd34d');
  for (const c of [15, 16]) sc.links.push({ c, r: 29, target: 'unicorn', at: { c: c - 1, r: 1 }, icon: '🚗', style: 'gate', needStars: UNICORN_STARS });
  const ug = tileCenter(sc, 15.5, 28);
  sc.signs.push({ x: ug.x, y: ug.y - 64, text: place('unicorn'), color: '#ff8a3a', needStars: UNICORN_STARS });
  sc.links.push(...cave);
  sc.npcs.push(shop.keeper);
  sc.start = { c: 14, r: 1 };
  renderGround(sc);
  return sc;
};

// The Villain Cave doorway on the west edge, where the forest had its
// Crystal Cave (same tiles and links). Returns the links.
function addDinoCave(sc) {
  for (let c = 2; c <= 4; c++) tileAt(sc, c, 17).dirt = true;
  tileAt(sc, 2, 16).dirt = true;
  block(sc, 0, 15, 2, 4);
  const m = tileCenter(sc, 1.5, 16.5);
  addObject(sc, { c: 0, r: 15, w: 2, d: 4 }, { x: m.x - 48, y: m.y - 64, w: 96, h: 80 }, ctx => drawVillainCaveMouth(ctx, Math.round(m.x), Math.round(m.y)), { kind: 'cave' });
  sc.signs.push({ x: m.x, y: m.y - 70, text: place('dungeon'), color: '#8a5ac0', needStars: DUNGEON_STARS });
  return [16, 17].map(r => ({ c: 2, r, target: 'dungeon', at: { c: 7 + (r - 16), r: 12 }, icon: '😈', needStars: DUNGEON_STARS }));
}

// The parts shop: a leaf-roofed hut on the cross path, its keeper outside
// (same spot as the forest shop).
function addDinoShop(sc) {
  const S = { c: 8, r: 13 };
  block(sc, S.c, S.r, 3, 3);
  tileAt(sc, S.c + 1, S.r + 3).dirt = true;
  const obj = addObject(sc, { c: S.c, r: S.r, w: 3, d: 3 }, footBounds(sc, S.c, S.r, 3, 3, houseUp('thatch'), 12),
    ctx => drawHouse(ctx, boxCorners(sc, S.c, S.r, 3, 3), { roof: '#5aa6e0', wall: '#fff4e0', door: 'left', shape: 'thatch' }), { kind: 'shop' });
  const k = boxCorners(sc, S.c, S.r, 3, 3);
  const sign = wallPt(wall(k.L, k.B), (k.B.x - k.L.x) / 2, 48);
  sc.signs.push({ x: sign.x, y: sign.y, text: place('shop'), color: '#e0a52a' });
  const keeper = makeNpc({ who: '상점 아저씨', look: 'merchant', c: S.c + 3, r: S.r + 3 }, null);
  keeper.shop = true;
  keeper.badge = '🪙';
  obj.keeper = keeper;
  return obj;
}
