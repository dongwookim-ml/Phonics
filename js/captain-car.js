// Captain edition: the Car Village (자동차 마을), its talking cars and
// mechanics, and the cars the robot rides.
//
// The top level only touches js/data.js tables, because tools/tts-phrases.js
// runs this file in node; drawing and scene building live in functions.
//
// Interface for the other captain files:
//   CAPTAIN_CARS                        the ride items, shaped like UNICORNS
//   drawCaptainCar(ctx, x, y, key, frame, opts)   a car standing on (x, y)
//   captainCarSprite(key, frame, ridden)          { canvas, ax, ay, front, seat }
//   captainRiderSprite(outfit, frame, opts)       the robot driving its car
// unicornSprite() and riderSprite() in sprites.js hand over to these in
// captain, so talking cars, the parked car and riding all go through here.

// Cars to ride. These only come from the Car Village. `unicorn: true` is the
// reward mark the game uses for the level 3 village's own treasures.
//   kind: the body shape; body, shade: paint; trim: stripes and details
const CAPTAIN_CARS = {
  none:    { name: '안 타요',       icon: '' },
  police:  { name: '경찰차',        icon: '🚓', unicorn: true, kind: 'sedan', body: '#ffffff', shade: '#c8d0e8', trim: '#3a6fd8', top: 'siren' },
  taxi:    { name: '택시',          icon: '🚕', unicorn: true, kind: 'sedan', body: '#ffd23d', shade: '#e0a820', trim: '#2e2a4a', top: 'taxi' },
  race:    { name: '경주용 자동차', icon: '🏎️', unicorn: true, kind: 'race', body: '#ff4a4a', shade: '#c8303a', trim: '#ffffff' },
  fire:    { name: '소방차',        icon: '🚒', unicorn: true, kind: 'fire', body: '#ec4a3c', shade: '#b82e2e', trim: '#ffffff' },
  ambulance: { name: '구급차',      icon: '🚑', unicorn: true, kind: 'van', body: '#ffffff', shade: '#d0d6e6', trim: '#ff4a5a' },
  dump:    { name: '덤프트럭',      icon: '🚚', unicorn: true, kind: 'dump', body: '#ffc83a', shade: '#e09a20', trim: '#2e2a4a' },
  monster: { name: '몬스터 트럭',   icon: '🛻', unicorn: true, kind: 'monster', body: '#4fcf5f', shade: '#2f9f45', trim: '#ff8a3a' },
  rocket:  { name: '로켓 자동차',   icon: '🚀', unicorn: true, kind: 'rocket', body: '#8a5cff', shade: '#5a38c8', trim: '#ffd34d' },
};

// Words for riding a car instead of a unicorn (game.js shows these in captain).
const CAPTAIN_RIDE_TEXT = {
  button: '🚗',
  buttonTitle: '자동차 타기/내리기',
  wait: '🚗 자동차는 밖에 세워 둘게요',
  find: '🚗 자동차 마을에서 자동차를 만나요',
  indoors: '🏠 집 안에서는 자동차를 탈 수 없어요',
  parked: '자동차',
  // For the reward card when the present is a car.
  yes: '지금 탈래요 🚗',
  no: '차고에 둘래요 🅿️',
};

// Talking cars have `unicorn` (which car they are) instead of a villager look.
const CAR_NPCS = [
  { name: '경찰차 삐뽀',     look: 'policecar',    unicorn: 'police',  c: 10, r: 13 },
  { name: '정비사 아저씨',   look: 'mechanic',     c: 9, r: 11 },
  { name: '경주차 쌩쌩이',   look: 'racecar',      unicorn: 'race',    c: 21, r: 13 },
  { name: '주유소 누나',     look: 'attendant',    c: 20, r: 10 },
  { name: '소방차 영차',     look: 'firetruck',    unicorn: 'fire',    c: 7, r: 21 },
  { name: '몬스터 트럭 쿵쾅', look: 'monstertruck', unicorn: 'monster', c: 20, r: 23 },
];

if (isCaptain()) {
  // The ride slot's items become cars, in place, so the wardrobe, rewards,
  // shop and save all keep working with the same keys and flags.
  for (const k of Object.keys(UNICORNS)) delete UNICORNS[k];
  Object.assign(UNICORNS, CAPTAIN_CARS);
  UNICORN_NPCS.splice(0, UNICORN_NPCS.length, ...CAR_NPCS);
  Object.assign(LOOKS, {
    mechanic:  { hair: '#5a3a2a', shirt: '#3a6fd8', pants: '#2e4a8a', hat: 'cap' },
    attendant: { hair: '#2e2433', shirt: '#ff8a3a', pants: '#4a5a7a', hat: 'cap' },
  });
  Object.assign(VOICES, {
    policecar:    { gender: 'male', tts: 'am_eric', lift: 1.06, pitch: 1.1, rate: 1.0, voice: ['Fred', 'Microsoft Guy', 'Google US English'] },
    firetruck:    { gender: 'male', tts: 'am_adam', pitch: 0.95, rate: 1.0, voice: ['Alex', 'Microsoft Andrew', 'Google US English'] },
    racecar:      { gender: 'male', tts: 'am_puck', lift: 1.1, pitch: 1.3, rate: 1.08, voice: ['Junior', 'Microsoft Guy', 'Google US English'] },
    monstertruck: { gender: 'male', tts: 'am_santa', pitch: 0.7, rate: 0.95, voice: ['Ralph', 'Fred', 'Microsoft Christopher'] },
    mechanic:     { gender: 'male', tts: 'am_liam', pitch: 0.9, rate: 0.95, voice: ['Aaron', 'Fred', 'Microsoft Christopher'] },
    attendant:    { gender: 'female', tts: 'af_nova', pitch: 1.2, rate: 1.0, voice: ['Samantha', 'Microsoft Aria', 'Google US English'] },
  });
  Object.assign(PERSONA, {
    policecar:    ['Wee-woo! Hello, {title} {name}! I keep the roads safe.', 'Stop right there! Oh, it is you, {title} {name}. Time for a sentence!', 'Police car on duty! Want to play a word game?'],
    firetruck:    ['Nee-naw! Hello, {title} {name}! I am a fire truck.', 'My ladder goes up, up, up! Ready for a sentence?', 'Splash! I just washed my wheels. Hello, {title}!'],
    racecar:      ['Vroom, vroom! Hi, {title} {name}! I am super fast!', 'Ready, set, go! Can you answer as fast as me?', 'Zoom! I just won a race. Want to play?'],
    monstertruck: ['Crunch! Hello, {title} {name}! Look at my big wheels!', 'Bump, bump! I love jumping over ramps.', 'Hey, {title}! I am big, but I am very friendly!'],
    mechanic:     ['Hi, {title} {name}! I fix cars all day long.', 'Welcome to my garage! Can you pass me that wrench?', 'Every car in town comes to me for a check-up!'],
    attendant:    ['Hello, {title} {name}! Welcome to the gas station!', 'The cars get thirsty here. Fill her up?', 'Beep, beep! Time for a sentence, {title}!'],
  });
  Object.assign(LINES, {
    unicorn: ['Welcome to Car Village!', 'Vroom, vroom! Look at all the cars!', 'Honk, honk! The cars are happy to see you!'],
    mount: ['Buckle up!', "Let's roll!", 'Vroom! Off we go!'],
    dismount: ['Park here, car. I will be right back!', 'Wait here, car!', 'Cars wait outside. See you soon!'],
    newUnicorn: ['Beep, beep! Will you drive me?', 'I want to be your car! Shall we go for a ride?', 'Vroom! Hop in, {title}! Want to drive now?'],
  });
  CAPTAIN_SCENES.unicorn = () => buildCarVillage();
  // The ride button shows a car.
  if (typeof document !== 'undefined') {
    const btn = document.getElementById('ride');
    if (btn) { btn.textContent = CAPTAIN_RIDE_TEXT.button; btn.title = CAPTAIN_RIDE_TEXT.buttonTitle; }
  }
}

// ---- Car sprites -------------------------------------------------------------

const CAR_INK = '#2e2a4a';
const CAR_GLASS = '#a8dcff';
const CAR_GLASS_HI = '#e6f6ff';

// A pixel grid to paint a car into; it is inked round its outline afterwards.
function carGrid(W, H) {
  const grid = [];
  for (let y = 0; y < H; y++) grid.push(new Array(W).fill(null));
  const set = (x, y, col) => { if (x >= 0 && y >= 0 && x < W && y < H) grid[y][x] = col; };
  const rect = (x, y, w, h, col) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, col); };
  const disc = (cx, cy, r, col) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + r * 0.6) set(cx + dx, cy + dy, col);
  };
  // Rows of [x0, x1] spans starting at row y.
  const rows = (y, spans, col) => spans.forEach(([a, b], i) => rect(a, y + i, b - a + 1, 1, col));
  const clear = (x, y, w, h) => rect(x, y, w, h, null);
  return { W, H, grid, set, rect, disc, rows, clear };
}

// Paints a grid, with ink wherever an empty pixel touches the car.
function inkCarGrid(ctx, g, ink = CAR_INK) {
  const { grid, W, H } = g;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[y][x]) { px(ctx, x, y, 1, 1, grid[y][x]); continue; }
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy] && grid[y + dy][x + dx]);
    if (near) px(ctx, x, y, 1, 1, ink);
  }
}

// A wheel with its hub; frame 1 turns the spokes a little.
function carWheel(g, cx, cy, R, frame, rim = '#d8dce8') {
  g.disc(cx, cy, R + 1, CAR_INK);
  g.disc(cx, cy, R, '#3a3850');
  if (R >= 6) {
    // Big knobbly tyres: tread blocks round the edge, turning with the frame.
    for (let i = 0; i < 12; i++) {
      const a = (i + frame * 0.5) / 12 * Math.PI * 2;
      g.set(Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), '#56546e');
    }
  }
  const hub = Math.max(1, Math.round(R * 0.45));
  g.disc(cx, cy, hub, rim);
  g.set(cx, cy, shade(rim, -70));
  if (hub >= 2) {
    const d = frame ? [[1, 1], [-1, -1], [1, -1], [-1, 1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of d) g.set(cx + dx, cy + dy, shade(rim, -45));
  }
}

// Two friendly eyes looking ahead, in a window starting at (x, y).
function carEyes(g, x, y, gap = 3) {
  for (const ex of [x, x + gap]) {
    g.rect(ex, y, 2, 3, '#ffffff');
    g.rect(ex + 1, y + 1, 1, 2, CAR_INK);
    g.set(ex + 1, y + 1, '#5a5a8a');
  }
}

// A smile on the front bumper, with its corners at (x, y) and (x + 2, y).
function carSmile(g, x, y) {
  g.set(x, y, CAR_INK);
  g.set(x + 1, y + 1, CAR_INK);
  g.set(x + 2, y, CAR_INK);
}

// Glass in a span of rows, with a light streak.
function carGlass(g, y, spans, streak = true) {
  g.rows(y, spans, CAR_GLASS);
  if (!streak) return;
  spans.forEach(([a, b], i) => {
    const s = a + 1 + i;
    if (s <= b) g.set(s, y + i, CAR_GLASS_HI);
    if (s + 1 <= b) g.set(s + 1, y + i, CAR_GLASS_HI);
  });
}

// Flashing lights: frame 0 lights the first colour, frame 1 the second.
function carSiren(g, x, y, w, frame, a = '#ff4a5a', b = '#4a8aff') {
  const half = Math.floor(w / 2);
  g.rect(x, y, half, 2, frame ? shade(a, -60) : a);
  g.rect(x + half, y, w - half, 2, frame ? b : shade(b, -60));
  g.set(x + (frame ? half + 1 : 0), y, '#ffffff');
}

// Each shape paints into the back grid (body) and, when ridden, the front
// grid (glass in front of the driver), and says where the driver's waist sits.
const CAR_SHAPES = {
  // A family car: police car and taxi.
  sedan(s, frame, ridden, eyes) {
    const g = carGrid(40, 26);
    const f = carGrid(40, 26);
    const G = 24;
    // Lower body.
    g.rect(4, 13, 32, 7, s.body);
    g.rect(6, 12, 27, 1, s.body);
    g.rect(4, 18, 32, 2, s.shade);
    g.rect(6, 13, 24, 1, mix(s.body, '#ffffff', 0.5));
    if (s.top === 'siren') {
      g.rect(4, 15, 32, 3, s.trim);
      g.rect(23, 14, 3, 3, '#ffd34d');
      g.set(24, 15, '#fff6b0');
    } else {
      for (let x = 4; x < 36; x++) g.set(x, 15 + ((x >> 1) % 2), (x >> 1) % 2 ? '#ffffff' : s.trim);
      for (let x = 4; x < 36; x++) g.set(x, 16 - ((x >> 1) % 2), (x >> 1) % 2 ? s.trim : '#ffffff');
    }
    // Door line and handle.
    g.rect(21, 13, 1, 6, s.shade);
    g.set(19, 14, shade(s.shade, -40));
    // Lights and bumpers.
    g.rect(35, 13, 1, 2, '#fff2a8');
    g.rect(4, 13, 1, 2, '#ff5a6a');
    g.rect(36, 16, 1, 3, '#c8ccd8');
    g.rect(3, 16, 1, 3, '#c8ccd8');
    carSmile(g, 32, 17);
    if (!ridden) {
      // Cabin with windows; eyes look out of the front one.
      g.rows(5, [[13, 25], [12, 27], [11, 28], [11, 29], [10, 30], [10, 31], [9, 32]], s.body);
      carGlass(g, 7, [[13, 19], [13, 19], [12, 19], [12, 19], [11, 19]]);
      carGlass(g, 7, [[22, 26], [22, 27], [22, 28], [22, 29], [22, 30]], false);
      if (eyes) carEyes(g, 23, 7);
      if (s.top === 'siren') carSiren(g, 15, 3, 8, frame);
      else { g.rect(17, 3, 5, 2, '#ff8a3a'); g.set(18, 3, '#ffffff'); g.set(20, 3, '#ffffff'); }
    } else {
      // Open top: a windscreen in front of the driver, the roof light on the boot.
      f.rows(6, [[27, 28], [28, 29], [28, 30], [29, 31], [30, 32], [30, 33]], 'rgba(168,220,255,0.55)');
      for (let y = 6; y < 12; y++) f.set(29 + Math.floor((y - 6) * 0.8) + 2, y, CAR_INK);
      g.rect(6, 9, 1, 3, '#5a5f73');
      if (s.top === 'siren') carSiren(g, 3, 7, 7, frame);
      else { g.rect(4, 7, 5, 2, '#ff8a3a'); g.set(5, 7, '#ffffff'); }
    }
    for (const x of [11, 29]) carWheel(g, x, G - 4, 4, frame);
    return { g, f, ax: 20, ay: G, seat: { x: 18, y: 13 } };
  },

  // An ambulance van: a tall box with the cab at the front.
  van(s, frame, ridden, eyes) {
    const g = carGrid(40, 28);
    const f = carGrid(40, 28);
    const G = 26;
    g.rect(4, 5, 25, 17, s.body);
    g.rows(5, [[29, 30], [29, 31], [29, 32], [29, 33], [29, 34], [29, 35], [29, 35], [29, 35], [29, 35]], s.body);
    g.rect(29, 14, 7, 8, s.body);
    g.rect(4, 19, 32, 2, s.shade);
    g.rect(4, 15, 32, 2, s.trim);
    // The red cross.
    g.rect(14, 6, 3, 8, s.trim);
    g.rect(11, 8, 9, 3, s.trim);
    g.rect(24, 6, 1, 13, s.shade);
    g.rect(35, 13, 1, 2, '#fff2a8');
    g.rect(36, 17, 1, 3, '#c8ccd8');
    carSmile(g, 32, 18);
    if (!ridden) {
      carGlass(g, 7, [[26, 29], [26, 29], [26, 29], [26, 29], [26, 29]]);
      carGlass(g, 7, [[31, 32], [31, 33], [31, 34], [31, 35], [31, 35]], false);
      if (eyes) carEyes(g, 26, 8, 2);
      carSiren(g, 6, 3, 6, frame);
      carSiren(g, 26, 3, 4, frame, '#ff4a5a', '#ff4a5a');
    } else {
      g.clear(25, 4, 12, 9);
      g.rect(25, 12, 11, 1, s.body);
      f.rows(6, [[32, 33], [32, 34], [33, 35], [33, 35], [34, 36], [34, 36]], 'rgba(168,220,255,0.55)');
      for (let y = 6; y < 12; y++) f.set(Math.min(37, 34 + Math.floor((y - 6) / 2)), y, CAR_INK);
      carSiren(g, 6, 3, 6, frame);
    }
    for (const x of [11, 29]) carWheel(g, x, G - 4, 4, frame);
    return { g, f, ax: 20, ay: G, seat: { x: 30, y: 13 } };
  },

  // A long fire truck with a ladder on top.
  fire(s, frame, ridden, eyes) {
    const g = carGrid(46, 28);
    const f = carGrid(46, 28);
    const G = 26;
    g.rect(3, 12, 30, 10, s.body);
    g.rect(32, 4, 10, 18, s.body);
    g.rows(6, [[42, 42], [42, 43], [42, 43], [42, 44], [42, 44], [42, 44], [42, 44]], s.body);
    g.rect(42, 13, 3, 9, s.body);
    g.rect(3, 19, 42, 2, s.shade);
    g.rect(3, 16, 42, 1, s.trim);
    // Lockers with handles.
    for (const x of [5, 13, 21]) {
      g.rect(x, 13, 7, 3, mix(s.body, '#ffffff', 0.25));
      g.set(x + 3, 14, '#ffd34d');
    }
    // A coiled hose.
    g.rect(5, 17, 22, 2, shade(s.shade, -10));
    g.rect(37, 14, 1, 5, s.shade);
    g.rect(44, 13, 1, 2, '#fff2a8');
    g.rect(45, 16, 1, 3, '#c8ccd8');
    carSmile(g, 41, 18);
    // The ladder on its turntable.
    g.rect(25, 10, 6, 2, '#8a8fa8');
    for (const y of [7, 9]) g.rect(2, y, 28, 1, '#eef0f6');
    for (let x = 3; x < 30; x += 3) g.set(x, 8, '#c8ccd8');
    if (!ridden) {
      carGlass(g, 6, [[33, 37], [33, 37], [33, 37], [33, 37], [33, 37]]);
      carGlass(g, 6, [[39, 41], [39, 42], [39, 42], [39, 43], [39, 43]], false);
      if (eyes) carEyes(g, 33, 7);
      carSiren(g, 34, 2, 6, frame, '#ff4a5a', '#ffb347');
    } else {
      g.clear(32, 2, 13, 11);
      g.rect(32, 12, 13, 1, s.body);
      f.rows(5, [[40, 41], [40, 42], [41, 42], [41, 43], [42, 43], [42, 44], [42, 44]], 'rgba(168,220,255,0.55)');
      for (let y = 5; y < 12; y++) f.set(Math.min(45, 43 + Math.floor((y - 5) / 2)), y, CAR_INK);
      carSiren(g, 26, 5, 4, frame, '#ff4a5a', '#ffb347');
    }
    for (const x of [9, 18, 37]) carWheel(g, x, G - 4, 4, frame);
    return { g, f, ax: 23, ay: G, seat: { x: 37, y: 13 } };
  },

  // A low race car with a big back wheel and a wing.
  race(s, frame, ridden, eyes) {
    const g = carGrid(42, 24);
    const f = carGrid(42, 24);
    const G = 22;
    g.rows(12, [[8, 26], [7, 30], [6, 34], [6, 38], [6, 39], [6, 39], [7, 38]], s.body);
    g.rect(6, 17, 33, 2, s.shade);
    g.rect(8, 13, 30, 1, s.trim);
    // Number one in a white roundel.
    g.disc(25, 15, 2, '#ffffff');
    g.rect(25, 14, 1, 3, CAR_INK);
    g.set(24, 14, CAR_INK);
    // Wing on a post at the back.
    g.rect(5, 8, 2, 4, '#5a5f73');
    g.rect(2, 6, 8, 2, s.body);
    g.rect(2, 7, 8, 1, s.shade);
    g.rect(39, 15, 1, 2, '#fff2a8');
    carSmile(g, 35, 16);
    // Cockpit: a roll hoop and a little windscreen.
    g.rect(12, 8, 2, 4, '#5a5f73');
    if (!ridden) {
      g.rect(14, 10, 7, 2, '#3a3850');
      carGlass(g, 8, [[21, 22], [21, 23], [21, 24], [21, 25]], false);
      if (eyes) { g.rect(21, 8, 6, 4, CAR_GLASS); carEyes(g, 22, 8); }
    } else {
      f.rows(8, [[22, 23], [22, 24], [23, 25], [23, 25]], 'rgba(168,220,255,0.55)');
    }
    carWheel(g, 10, G - 5, 5, frame);
    carWheel(g, 32, G - 4, 4, frame);
    return { g, f, ax: 21, ay: G, seat: { x: 17, y: 13 } };
  },

  // A pickup truck on giant wheels.
  monster(s, frame, ridden, eyes) {
    const g = carGrid(44, 38);
    const f = carGrid(44, 38);
    const G = 36;
    // Springs and chassis.
    for (const x of [9, 30]) for (let y = 16; y < 23; y++) g.rect(x + (y % 2 ? 0 : 2), y, 3, 1, '#9aa3b8');
    g.rect(7, 21, 30, 2, '#5a5f73');
    // Body: a long bed behind the cab.
    g.rect(3, 11, 38, 8, s.body);
    g.rect(3, 17, 38, 2, s.shade);
    g.rect(3, 10, 12, 1, s.shade);
    g.rect(4, 12, 32, 1, mix(s.body, '#ffffff', 0.45));
    // Flames on the door.
    const flame = ['#ffd34d', s.trim, '#ff5a3a'];
    for (let x = 20; x < 34; x++) {
      const h = 2 + ((x * 3) % 5 === 0 ? 2 : (x % 3));
      for (let j = 0; j < h; j++) g.set(x, 17 - j, flame[Math.min(2, j)]);
    }
    g.rect(40, 12, 1, 2, '#fff2a8');
    g.rect(41, 15, 1, 3, '#c8ccd8');
    carSmile(g, 37, 15);
    if (!ridden) {
      g.rows(3, [[17, 29], [16, 31], [15, 32], [15, 33], [14, 34], [14, 35], [13, 36], [13, 37]], s.body);
      carGlass(g, 5, [[17, 23], [17, 23], [16, 23], [16, 23], [15, 23]]);
      carGlass(g, 5, [[26, 31], [26, 32], [26, 33], [26, 34], [26, 35]], false);
      if (eyes) carEyes(g, 27, 5);
      g.rect(18, 2, 10, 1, '#ffd34d');
    } else {
      f.rows(4, [[31, 32], [31, 33], [32, 34], [32, 35], [33, 36], [33, 37], [34, 38]], 'rgba(168,220,255,0.55)');
      for (let y = 4; y < 11; y++) f.set(Math.min(41, 35 + Math.floor((y - 4) * 0.6)), y, CAR_INK);
    }
    for (const x of [11, 32]) carWheel(g, x, G - 7, 7, frame, '#ffd34d');
    return { g, f, ax: 22, ay: G, seat: { x: 23, y: 11 } };
  },

  // A dump truck with a load of pebbles.
  dump(s, frame, ridden, eyes) {
    const g = carGrid(46, 30);
    const f = carGrid(46, 30);
    const G = 28;
    g.rect(4, 19, 40, 3, '#5a5f73');
    // Pebbles heaped in the tipper.
    for (let x = 6; x < 29; x++) {
      const h = Math.round(Math.sin((x - 6) / 22 * Math.PI) * 4);
      for (let y = 8 - h; y < 9; y++) g.set(x, y, hash(x, y, 61) < 0.4 ? '#b8a088' : hash(x, y, 62) < 0.5 ? '#9a8470' : '#cdb89e');
    }
    g.rows(8, [[3, 30], [3, 30], [4, 30], [4, 30], [4, 29], [5, 29], [5, 29], [5, 29], [6, 28], [6, 28], [6, 28]], s.body);
    for (let x = 8; x < 29; x += 5) g.rect(x, 9, 1, 9, s.shade);
    g.rect(3, 8, 28, 1, mix(s.body, '#ffffff', 0.4));
    // Cab.
    g.rect(31, 6, 11, 16, s.body);
    g.rows(8, [[42, 42], [42, 43], [42, 43], [42, 44], [42, 44], [42, 44]], s.body);
    g.rect(42, 14, 3, 8, s.body);
    g.rect(31, 18, 14, 2, s.shade);
    for (let x = 31; x < 45; x++) g.set(x, 20, ((x >> 1) % 2) ? s.trim : '#ffd34d');
    g.rect(44, 14, 1, 2, '#fff2a8');
    carSmile(g, 41, 17);
    if (!ridden) {
      carGlass(g, 8, [[33, 37], [33, 37], [33, 37], [33, 37], [33, 37]]);
      carGlass(g, 8, [[39, 41], [39, 42], [39, 42], [39, 43], [39, 43]], false);
      if (eyes) carEyes(g, 33, 9);
      g.rect(35, 4, 3, 2, frame ? '#ffb347' : '#ff8a3a');
      g.set(36, 4, frame ? '#ffffff' : '#ffd34d');
    } else {
      g.clear(31, 4, 14, 10);
      g.rect(31, 13, 14, 1, s.body);
      f.rows(7, [[40, 41], [40, 42], [41, 42], [41, 43], [42, 43], [42, 44]], 'rgba(168,220,255,0.55)');
      for (let y = 7; y < 13; y++) f.set(Math.min(45, 43 + Math.floor((y - 7) / 2)), y, CAR_INK);
    }
    for (const x of [10, 19, 37]) carWheel(g, x, G - 4, 4, frame);
    return { g, f, ax: 23, ay: G, seat: { x: 37, y: 14 } };
  },

  // A rocket car with a fin, a glass bubble and a flame out the back.
  rocket(s, frame, ridden, eyes) {
    const g = carGrid(46, 28);
    const f = carGrid(46, 28);
    const G = 26;
    // Fin.
    g.rows(4, [[5, 6], [5, 7], [5, 8], [5, 9], [5, 10], [5, 11], [5, 12], [5, 13], [5, 14], [5, 15]], '#ff5a6a');
    g.rect(5, 4, 1, 10, '#c83a4a');
    g.rows(13, [[9, 34], [8, 37], [6, 39], [6, 41], [6, 42], [6, 42], [6, 41], [6, 40], [7, 37]], s.body);
    g.rect(6, 19, 35, 3, s.shade);
    g.rect(9, 14, 28, 1, mix(s.body, '#ffffff', 0.4));
    g.rect(6, 17, 36, 1, s.trim);
    // Stars on the side.
    for (const [x, y] of [[13, 16], [31, 16]]) {
      g.set(x, y, s.trim); g.set(x - 1, y, s.trim); g.set(x + 1, y, s.trim); g.set(x, y - 1, s.trim); g.set(x, y + 1, s.trim);
    }
    g.rect(41, 16, 1, 2, '#fff2a8');
    carSmile(g, 37, 19);
    // Exhaust nozzle.
    g.rect(3, 15, 3, 5, '#9aa3b8');
    const dome = [[19, 23], [17, 25], [16, 26], [15, 27], [15, 27], [14, 28]];
    if (!ridden) {
      carGlass(g, 7, dome);
      if (eyes) carEyes(g, 20, 9);
    } else {
      f.rows(7, dome, 'rgba(168,220,255,0.4)');
      for (const [x, y] of [[17, 8], [16, 9], [15, 10]]) f.set(x, y, 'rgba(255,255,255,0.8)');
    }
    for (const x of [12, 33]) carWheel(g, x, G - 3, 3, frame, '#ffd34d');
    return { g, f, ax: 23, ay: G, seat: { x: 21, y: 14 }, flame: { x: 2, y: 15 } };
  },
};

// The car as a sprite: { canvas, ax, ay } like the other sprites, plus
// `front` (glass to draw over a driver) and `seat` (where the driver's waist
// goes) when ridden. Talking and parked cars have eyes; a driven one doesn't.
const captainCarCache = new Map();
function captainCarSprite(key, frame = 0, ridden = false, eyes = true) {
  const ck = `${key}|${frame}|${ridden}|${eyes}`;
  if (captainCarCache.has(ck)) return captainCarCache.get(ck);
  const s = CAPTAIN_CARS[key] && CAPTAIN_CARS[key].kind ? CAPTAIN_CARS[key] : CAPTAIN_CARS.police;
  const shape = CAR_SHAPES[s.kind](s, frame ? 1 : 0, ridden, eyes && !ridden);
  const { g } = shape;
  const cv = makeCanvas(g.W, g.H);
  const ctx = cv.getContext('2d');
  // A soft shadow under the wheels.
  ctx.fillStyle = 'rgba(40,30,70,0.18)';
  ctx.beginPath();
  ctx.ellipse(shape.ax, shape.ay, g.W / 2 - 3, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  inkCarGrid(ctx, g);
  if (shape.flame) {
    // A flickering flame, no outline.
    const { x, y } = shape.flame;
    const len = frame ? 3 : 5;
    for (let i = 0; i < len; i++) {
      px(ctx, x - i, y + 1, 1, 3, i < 2 ? '#ffe066' : '#ff8a3a');
      if (i < len - 1) px(ctx, x - i, y + 2, 1, 1, '#ffffff');
    }
  }
  let front = null;
  if (ridden) {
    front = makeCanvas(g.W, g.H);
    const fctx = front.getContext('2d');
    for (let y = 0; y < g.H; y++) for (let x = 0; x < g.W; x++) if (shape.f.grid[y][x]) px(fctx, x, y, 1, 1, shape.f.grid[y][x]);
  }
  const sprite = { canvas: cv, ax: shape.ax, ay: shape.ay, front, seat: shape.seat };
  captainCarCache.set(ck, sprite);
  return sprite;
}

// Draws a car standing on the ground point (x, y), facing right.
// opts: { flip, ridden, eyes, layer: 'back' | 'front' } (both layers by default).
function drawCaptainCar(ctx, x, y, carKey, frame = 0, opts = {}) {
  const car = captainCarSprite(carKey, frame, !!opts.ridden, opts.eyes !== false);
  const dx = Math.round(x - (opts.flip ? car.canvas.width - car.ax : car.ax));
  const dy = Math.round(y - car.ay);
  const layers = [];
  if (opts.layer !== 'front') layers.push(car.canvas);
  if (opts.layer !== 'back' && car.front) layers.push(car.front);
  for (const cv of layers) {
    if (opts.flip) {
      ctx.save();
      ctx.translate(dx + cv.width, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(cv, 0, 0);
      ctx.restore();
    } else ctx.drawImage(cv, dx, dy);
  }
}

// Where the driver's waist goes, from the car's ground point (facing right).
function captainCarSeat(carKey) {
  const car = captainCarSprite(carKey, 0, true);
  return { x: car.seat.x - car.ax, y: car.seat.y - car.ay };
}

// The robot driving its car: the top of the hero sprite down to the waist,
// sat in the car's seat, with the windscreen in front.
// opts: { hero: sprite, cut: rows from the sprite's top to the waist }.
// Without them it uses heroSprite() and captainHeroWaist(outfit) if the
// hero file defines it, or the bottom nine rows count as legs.
const captainRiderCache = new Map();
function captainRiderSprite(outfit, frame = 0, opts = {}) {
  const hero = opts.hero || heroSprite(Object.assign({}, outfit, { ride: 'none' }), 0);
  const cut = opts.cut || (typeof captainHeroWaist === 'function' ? captainHeroWaist(outfit) : hero.ay - 9);
  const key = `${Object.values(outfit).join('|')}|${frame}|${cut}|${opts.hero ? hero.canvas.width + 'x' + hero.canvas.height : ''}`;
  if (!opts.hero && captainRiderCache.has(key)) return captainRiderCache.get(key);
  const car = captainCarSprite(outfit.ride, frame, true);
  const hx = car.seat.x - hero.ax;
  const padL = Math.max(0, -hx);
  const padR = Math.max(0, hx + hero.canvas.width - car.canvas.width);
  const top = Math.max(0, cut - car.seat.y);
  const cv = makeCanvas(car.canvas.width + padL + padR, car.canvas.height + top);
  const ctx = cv.getContext('2d');
  ctx.drawImage(car.canvas, padL, top);
  ctx.drawImage(hero.canvas, 0, 0, hero.canvas.width, cut, padL + hx, top + car.seat.y - cut, hero.canvas.width, cut);
  ctx.drawImage(car.front, padL, top);
  const sprite = { canvas: cv, ax: padL + car.ax, ay: top + car.ay };
  if (!opts.hero) captainRiderCache.set(key, sprite);
  return sprite;
}

// ---- Car Village ground ----------------------------------------------------

// Ground kinds painted over the grass: road, walk (pavement), apron (the
// gas station's concrete), lot (parking) and dirt (the monster truck's yard).
function paintCarGround(sc, g) {
  // World (c, r) of a ground pixel, so markings run smoothly across tiles.
  const at = (x, y) => ({ A: (x - sc.ox - 16) / 32 + (y - sc.oy) / 16, B: (y - sc.oy) / 16 - (x - sc.ox - 16) / 32 });
  const frac = v => v - Math.floor(v);
  const kindAt = (c, r) => { const t = tileAt(sc, c, r); return t && t.car; };
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) {
    const t = sc.tiles[r][c];
    if (!t.car) continue;
    const o = tileOrigin(sc, c, r);
    let paint;
    if (t.car === 'road') {
      paint = (x, y) => {
        const { A, B } = at(x, y);
        if (t.zebra) {
          const across = t.dir === 'v' ? A : B;
          const along = t.dir === 'v' ? B : A;
          if (frac(along) > 0.12 && frac(along) < 0.88 && Math.floor(across * 6) % 2 === 0) return '#f4f4fa';
        }
        if (t.checker) {
          const n = Math.floor(A * 4) + Math.floor(B * 4);
          if (frac(A) > 0.25 && frac(A) < 0.75) return n % 2 ? '#2e2a4a' : '#ffffff';
        }
        if (t.line !== undefined) {
          const across = t.dir === 'v' ? A : B;
          const along = t.dir === 'v' ? B : A;
          if (Math.abs(across - t.line) < 0.07 && Math.floor(along * 1.5) % 2 === 0) return '#ffd84a';
        }
        const n = hash(x, y, 71);
        return n < 0.05 ? '#7a8194' : n < 0.09 ? '#5a6072' : '#676e80';
      };
    } else if (t.car === 'walk' || t.car === 'apron') {
      const walk = t.car === 'walk';
      paint = (x, y) => {
        const { A, B } = at(x, y);
        // A kerb along any side that meets the road.
        const fa = frac(A);
        const fb = frac(B);
        if (walk) {
          if ((fa > 0.88 && kindAt(c + 1, r) === 'road') || (fa < 0.12 && kindAt(c - 1, r) === 'road') ||
              (fb > 0.88 && kindAt(c, r + 1) === 'road') || (fb < 0.12 && kindAt(c, r - 1) === 'road')) return '#bdb6cc';
        }
        const k = walk ? 2 : 1;
        if (frac(A * k) < 0.06 || frac(B * k) < 0.06) return walk ? '#cdc7d9' : '#c4c9d6';
        const n = hash(x, y, 72);
        if (!walk && hash(Math.floor(A * 3), Math.floor(B * 3), 73) < 0.08 && n < 0.5) return '#b8bcc8';
        return n < 0.05 ? '#f4f2f8' : walk ? '#e6e2ee' : '#dde1ea';
      };
    } else if (t.car === 'lot') {
      paint = (x, y) => {
        const { A, B } = at(x, y);
        const inner = frac(B) > 0.15;
        if ((frac(A) < 0.07 && inner) || (frac(B) < 0.07 && t.edge)) return '#f4f4fa';
        const n = hash(x, y, 74);
        return n < 0.05 ? '#848a9c' : '#71788a';
      };
    } else if (t.car === 'dirt') {
      paint = (x, y) => {
        const n = hash(x, y, 75);
        if (n < 0.05) return '#f0d2a0';
        if (n < 0.12) return '#b88a58';
        const tr = frac(at(x, y).A * 2 + at(x, y).B * 0.5);
        return tr < 0.08 ? '#c09060' : '#d4a46c';
      };
    }
    if (paint) fillPoly(g, diamondPts(o.x, o.y), paint);
    // Gate mats go back on top.
    if (t.mat) {
      const cx = o.x + 16;
      const cy = o.y + 8;
      fillPoly(g, diamondPts(o.x, o.y).map(p => ({ x: cx + (p.x - cx) * 0.7, y: cy + (p.y - cy) * 0.7 })), t.mat);
    }
  }
}

// ---- Car Village buildings -------------------------------------------------

// A flat-roofed box with a rim round the roof. Returns its two front walls.
function drawCarBox(ctx, k, H, wallCol, roofCol) {
  houseShadow(ctx, k);
  const walls = boxWalls(ctx, k, H, wallCol);
  const c = houseMid(k);
  const up = (p, s = 1) => ({ x: c.x + (p.x - c.x) * s, y: c.y - H + (p.y - c.y) * s });
  fillPoly(ctx, [up(k.L), up(k.T), up(k.R), up(k.B)], shade(roofCol, 20));
  fillPoly(ctx, [up(k.L, 0.86), up(k.T, 0.86), up(k.R, 0.86), up(k.B, 0.86)], roofCol);
  fillPoly(ctx, [up(k.L, 0.86), up(k.T, 0.86), { x: up(k.T, 0.86).x, y: up(k.T, 0.86).y + 2 }, { x: up(k.L, 0.86).x, y: up(k.L, 0.86).y + 2 }], shade(roofCol, -30));
  fillPoly(ctx, [up(k.T, 0.86), up(k.R, 0.86), { x: up(k.R, 0.86).x, y: up(k.R, 0.86).y + 2 }, { x: up(k.T, 0.86).x, y: up(k.T, 0.86).y + 2 }], shade(roofCol, -30));
  return walls;
}

// A roll-up garage door, closed, between x0 and x1 on wall W.
function drawRollDoor(ctx, W, x0, x1, h, col) {
  wallRect(ctx, W, x0 - 2, x1 + 2, 0, h + 2, '#5a5f73');
  wallRect(ctx, W, x0, x1, 0, h, col);
  for (let v = 2; v < h; v += 3) wallRect(ctx, W, x0, x1, v, v + 1, shade(col, -26));
  wallRect(ctx, W, (x0 + x1) / 2 - 2, (x0 + x1) / 2 + 2, 2, 3, '#3f4458');
}

// A square window with a white frame.
function drawCarWindow(ctx, W, x, v, w = 10, h = 9) {
  wallRect(ctx, W, x - 1, x + w + 1, v - 1, v + h + 1, '#f8f8ff');
  wallRect(ctx, W, x, x + w, v, v + h, '#8fd0ff');
  wallRect(ctx, W, x + 1, x + 3, v + 2, v + h - 1, '#e6f7ff');
  wallRect(ctx, W, x, x + w, v + h / 2, v + h / 2 + 1, '#f8f8ff');
}

// A little home with a garage for a car family.
function drawCarHome(ctx, k, style) {
  const H = 30;
  houseShadow(ctx, k);
  const { WL, WR } = boxWalls(ctx, k, H, style.wall || '#fff4e4', (W, left) => {
    wallRect(ctx, W, 0, W.len, 0, 4, left ? '#b8b0c4' : '#d6cee0');
    if (left) {
      drawRollDoor(ctx, W, W.len / 2 - 12, W.len / 2 + 4, 18, style.roof);
      wallRect(ctx, W, W.len / 2 + 9, W.len / 2 + 17, 0, 20, '#8b5a3c');
      wallRect(ctx, W, W.len / 2 + 14, W.len / 2 + 16, 9, 11, '#ffd34d');
    } else {
      drawCarWindow(ctx, W, 9, 10);
      drawCarWindow(ctx, W, W.len - 21, 10);
    }
  });
  const roof = style.roof;
  hipRoof(ctx, k, H, 24, 0.1, (x, y, side, d) => {
    if (d < 2) return shade(roof, -55);
    if (Math.floor(d) % 5 === 0) return shade(roof, -30);
    return side === 'left' ? shade(roof, -12) : roof;
  });
  return { WL, WR };
}

// A small wrench, drawn upright with its top-left at (x, y).
function drawWrench(ctx, x, y, col) {
  px(ctx, x, y, 2, 3, col);
  px(ctx, x + 4, y, 2, 3, col);
  px(ctx, x + 1, y + 2, 4, 2, col);
  px(ctx, x + 2, y + 4, 2, 7, col);
  px(ctx, x + 1, y + 10, 4, 2, col);
}

// The mechanic's workshop: one door open on a car up on the lift.
function drawWorkshop(ctx, k) {
  const H = 38;
  const { WL, WR } = drawCarBox(ctx, k, H, '#e4eaf4', '#9aa3b8');
  for (const [W, left] of [[WL, true], [WR, false]]) {
    wallRect(ctx, W, 0, W.len, 0, 4, left ? '#9aa0b4' : '#b8bed0');
    wallRect(ctx, W, 0, W.len, H - 8, H - 4, '#3a6fd8');
    wallRect(ctx, W, 0, W.len, H - 4, H - 3, '#ffd34d');
  }
  // Open bay with a taxi on the lift, and a closed one.
  const bay = [6, 30];
  wallRect(ctx, WL, bay[0] - 2, bay[1] + 2, 0, 26, '#5a5f73');
  wallRect(ctx, WL, bay[0], bay[1], 0, 24, '#3b3652');
  wallRect(ctx, WL, bay[0], bay[1], 0, 3, '#4a4566');
  wallRect(ctx, WL, bay[0] + 2, bay[0] + 4, 0, 12, '#ffd34d');
  wallRect(ctx, WL, bay[1] - 4, bay[1] - 2, 0, 12, '#ffd34d');
  const mid = wallPt(WL, (bay[0] + bay[1]) / 2, 10);
  const taxi = captainCarSprite('taxi', 0, false, false);
  ctx.drawImage(taxi.canvas, Math.round(mid.x - taxi.ax * 0.5 - 5), Math.round(mid.y - 9), Math.round(taxi.canvas.width * 0.5) + 2, Math.round(taxi.canvas.height * 0.5));
  wallRect(ctx, WL, bay[0], bay[1], 24, 26, '#ffd34d');
  drawRollDoor(ctx, WL, 38, 58, 24, '#c8d0e0');
  // A wrench badge and a window on the side.
  drawCarWindow(ctx, WR, 10, 12, 12, 10);
  const b = wallPt(WR, WR.len - 16, 22);
  px(ctx, Math.round(b.x) - 2, Math.round(b.y) - 2, 10, 16, '#3a6fd8');
  drawWrench(ctx, Math.round(b.x), Math.round(b.y), '#ffffff');
  // Tyres stacked on the roof edge.
  const roofAt = wallPt(WR, 8, H);
  for (let i = 0; i < 3; i++) {
    const ty = Math.round(roofAt.y) - 4 - i * 3;
    px(ctx, Math.round(roofAt.x) - 1, ty, 10, 3, CAR_INK);
    px(ctx, Math.round(roofAt.x), ty, 8, 2, '#4a4860');
    px(ctx, Math.round(roofAt.x) + 3, ty, 2, 1, '#8a8fa8');
  }
}

// The fire station: red brick, a tall red door and a siren on the roof.
function drawFireStation(ctx, k) {
  const H = 42;
  const { WL, WR } = drawCarBox(ctx, k, H, '#e06450', '#a8acbc');
  for (const [W, left] of [[WL, true], [WR, false]]) {
    for (let v = 3; v < H; v += 4) for (let x = (v % 8 ? 0 : 3); x < W.len; x += 7) wallRect(ctx, W, x, x + 1, v, v + 3, left ? '#b04838' : '#c85444');
    for (let v = 3; v < H; v += 4) wallRect(ctx, W, 0, W.len, v, v + 1, left ? '#c45040' : '#ec7a64');
    wallRect(ctx, W, 0, W.len, H - 4, H, '#f4f0f0');
  }
  // Big door with little windows, white trim.
  const mid = WL.len / 2;
  wallRect(ctx, WL, mid - 15, mid + 15, 0, 30, '#f4f0f0');
  wallRect(ctx, WL, mid - 13, mid + 13, 0, 28, '#ec4a3c');
  for (let v = 3; v < 28; v += 4) wallRect(ctx, WL, mid - 13, mid + 13, v, v + 1, '#c03a30');
  for (let x = mid - 11; x < mid + 11; x += 6) wallRect(ctx, WL, x, x + 4, 18, 22, '#bfe6ff');
  drawCarWindow(ctx, WR, 9, 16, 10, 12);
  drawCarWindow(ctx, WR, WR.len - 21, 16, 10, 12);
  // A round badge.
  const b = wallPt(WR, WR.len / 2, 36);
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.arc(Math.round(b.x), Math.round(b.y), 4, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, Math.round(b.x) - 1, Math.round(b.y) - 2, 2, 4, '#ec4a3c');
}

// Siren on the fire station roof, flashing.
function drawFireSiren(ctx, x, y, t) {
  const on = Math.floor(t * 3) % 2;
  px(ctx, x - 3, y - 2, 7, 3, '#5a5f73');
  px(ctx, x - 2, y - 7, 5, 5, on ? '#ff4a5a' : '#a83040');
  px(ctx, x - 1, y - 6, 1, 2, '#ffffff');
  px(ctx, x - 3, y - 8, 7, 1, '#5a5f73');
}

// The car wash: an open archway with spinning brushes and bubbles on top.
function drawCarWash(ctx, k) {
  const H = 34;
  const { WL, WR } = drawCarBox(ctx, k, H, '#bfe6ff', '#e8f6ff');
  for (const [W, left] of [[WL, true], [WR, false]]) {
    wallRect(ctx, W, 0, W.len, 0, 4, left ? '#7fb0d8' : '#9cc8e8');
    for (let x = 0; x < W.len; x++) wallRect(ctx, W, x, x + 1, H - 9 + Math.round(Math.sin(x / 3) * 1.5), H - 5 + Math.round(Math.sin(x / 3) * 1.5), '#ffffff');
  }
  const mid = WL.len / 2;
  wallArch(ctx, WL, mid - 14, mid + 14, 0, 26, '#ffffff');
  wallArch(ctx, WL, mid - 12, mid + 12, 0, 24, '#2f4a78');
  // Brushes in pink and blue stripes.
  for (const bx of [mid - 10, mid + 5]) {
    for (let v = 1; v < 21; v++) wallRect(ctx, WL, bx, bx + 5, v, v + 1, (v >> 1) % 2 ? '#ff8fc0' : '#6fb7ff');
  }
  for (const [x, v] of [[mid - 3, 18], [mid - 1, 10], [mid + 1, 15]]) wallRect(ctx, WL, x, x + 1, v, v + 2, '#bfeaff');
  drawCarWindow(ctx, WR, 10, 11);
  drawCarWindow(ctx, WR, WR.len - 22, 11);
  // Bubbles on the roof.
  const c = houseMid(k);
  for (const [dx, dy, r] of [[-12, -4, 7], [4, -10, 9], [14, 0, 5], [-2, 2, 4]]) {
    const x = Math.round(c.x + dx);
    const y = Math.round(c.y - H + dy - r);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4f0ff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    px(ctx, x - Math.round(r / 2), y - Math.round(r / 2), 2, 2, '#ffffff');
    px(ctx, x + Math.round(r / 3), y + Math.round(r / 3), 1, 1, '#ff9ec4');
  }
}

// The gas station shop: big windows and a red stripe.
function drawGasShop(ctx, k) {
  const H = 30;
  const { WL, WR } = drawCarBox(ctx, k, H, '#fbfbff', '#c4c9d6');
  for (const [W, left] of [[WL, true], [WR, false]]) {
    wallRect(ctx, W, 0, W.len, 0, 3, left ? '#b8b0c4' : '#d6cee0');
    wallRect(ctx, W, 0, W.len, H - 7, H - 2, '#ec4a3c');
    wallRect(ctx, W, 0, W.len, H - 2, H, '#ffd34d');
  }
  const mid = WL.len / 2;
  for (const x0 of [5, mid + 7]) {
    wallRect(ctx, WL, x0 - 1, x0 + 13, 4, 18, '#f8f8ff');
    wallRect(ctx, WL, x0, x0 + 12, 5, 17, '#8fd0ff');
    wallRect(ctx, WL, x0 + 1, x0 + 3, 7, 16, '#e6f7ff');
  }
  wallRect(ctx, WL, mid - 5, mid + 5, 0, 20, '#f8f8ff');
  wallRect(ctx, WL, mid - 4, mid + 4, 0, 19, '#bfe6ff');
  wallRect(ctx, WL, mid - 1, mid, 0, 19, '#f8f8ff');
  drawCarWindow(ctx, WR, 12, 8, 12, 10);
}

// A petrol pump standing on (cx, cy), with a hose.
function drawPump(ctx, cx, cy, col) {
  px(ctx, cx - 6, cy - 2, 12, 4, '#b8bcc8');
  px(ctx, cx - 5, cy - 22, 10, 21, CAR_INK);
  px(ctx, cx - 4, cy - 21, 8, 20, col);
  px(ctx, cx - 4, cy - 21, 2, 20, shade(col, -30));
  px(ctx, cx - 2, cy - 18, 5, 5, '#2e3a4a');
  px(ctx, cx - 1, cy - 17, 3, 1, '#7fffb0');
  px(ctx, cx - 1, cy - 15, 2, 1, '#7fffb0');
  px(ctx, cx - 3, cy - 24, 7, 3, '#ffffff');
  px(ctx, cx - 3, cy - 24, 7, 1, CAR_INK);
  // Hose and nozzle.
  px(ctx, cx + 4, cy - 12, 1, 8, CAR_INK);
  px(ctx, cx + 5, cy - 6, 2, 1, CAR_INK);
  px(ctx, cx + 6, cy - 10, 2, 4, '#5a5f73');
}

// The gas station canopy on four posts, over two pumps.
function drawCanopy(ctx, sc, c0, r0, w, d, pumps) {
  const k = boxCorners(sc, c0, r0, w, d);
  const H = 46;
  const posts = [[c0, r0], [c0 + w - 1, r0], [c0, r0 + d - 1], [c0 + w - 1, r0 + d - 1]].map(([c, r]) => tileCenter(sc, c, r));
  for (const p of posts.slice(0, 2)) { px(ctx, Math.round(p.x) - 2, Math.round(p.y) - H, 4, H, '#c8ccd8'); px(ctx, Math.round(p.x) - 2, Math.round(p.y) - H, 1, H, '#9aa0b4'); }
  for (const [c, r, col] of pumps) {
    const p = tileCenter(sc, c, r);
    drawPump(ctx, Math.round(p.x), Math.round(p.y), col);
  }
  for (const p of posts.slice(2)) { px(ctx, Math.round(p.x) - 2, Math.round(p.y) - H, 4, H, '#e4e8f0'); px(ctx, Math.round(p.x) - 2, Math.round(p.y) - H, 1, H, '#b8bcc8'); }
  // The slab: white top, red and white sides.
  const c = houseMid(k);
  const up = (p, s, h) => ({ x: c.x + (p.x - c.x) * s, y: c.y + (p.y - c.y) * s - h });
  const s = 1.08;
  const top = [up(k.L, s, H + 7), up(k.T, s, H + 7), up(k.R, s, H + 7), up(k.B, s, H + 7)];
  const low = [up(k.L, s, H), up(k.T, s, H), up(k.R, s, H), up(k.B, s, H)];
  fillPoly(ctx, [top[0], top[3], low[3], low[0]], '#ec4a3c');
  fillPoly(ctx, [top[3], top[2], low[2], low[3]], (x, y) => (y - (top[3].y + (x - top[3].x) * (top[2].y - top[3].y) / (top[2].x - top[3].x)) < 3 ? '#ffffff' : '#ff6a5a'));
  fillPoly(ctx, top, '#f4f6fa');
  fillPoly(ctx, [up(k.L, 0.95, H + 7), up(k.T, 0.95, H + 7), up(k.R, 0.95, H + 7), up(k.B, 0.95, H + 7)], '#e4e8f0');
  // A big lightning-bolt badge on the front edge.
  const m = { x: (top[3].x + top[2].x) / 2, y: (low[3].y + low[2].y) / 2 - 4 };
  px(ctx, Math.round(m.x) - 1, Math.round(m.y) - 3, 3, 3, '#ffd34d');
  px(ctx, Math.round(m.x) - 2, Math.round(m.y), 3, 3, '#ffd34d');
}

// ---- Car Village props -------------------------------------------------------

// A traffic light on (cx, cy) that changes every two seconds.
function drawTrafficLight(ctx, cx, cy, t, offset = 0) {
  const on = Math.floor(t / 2 + offset) % 3;
  ctx.fillStyle = 'rgba(40,30,70,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, cx - 1, cy - 26, 2, 26, '#5a5f73');
  px(ctx, cx - 4, cy - 40, 8, 16, CAR_INK);
  px(ctx, cx - 3, cy - 39, 6, 14, '#3f4458');
  const cols = [['#ff4a5a', '#5a2a34'], ['#ffd34d', '#5a4a2a'], ['#5fe08a', '#2a4a34']];
  cols.forEach(([lit, dim], i) => {
    px(ctx, cx - 2, cy - 38 + i * 4, 4, 3, on === i ? lit : dim);
    if (on === i) px(ctx, cx - 1, cy - 38 + i * 4, 1, 1, '#ffffff');
  });
}

// An orange traffic cone.
function makeCone() {
  const cv = makeCanvas(10, 14);
  const ctx = cv.getContext('2d');
  px(ctx, 0, 11, 10, 2, '#e05a2a');
  px(ctx, 0, 12, 10, 1, '#b8401a');
  for (let y = 1; y < 11; y++) {
    const w = 2 + Math.floor(y / 2) * 2;
    px(ctx, 5 - w / 2, y, w, 1, y === 5 || y === 6 ? '#ffffff' : '#ff8a3a');
    px(ctx, 5 - w / 2, y, 1, 1, '#c8501e');
  }
  return { canvas: cv, ax: 5, ay: 12 };
}

// A stack of tyres.
function makeTyres(n = 3) {
  const cv = makeCanvas(14, 6 + n * 4);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = 'rgba(40,30,70,0.18)';
  ctx.beginPath();
  ctx.ellipse(7, cv.height - 3, 7, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < n; i++) {
    const y = cv.height - 7 - i * 4;
    px(ctx, 1, y, 12, 5, CAR_INK);
    px(ctx, 0, y + 1, 14, 3, CAR_INK);
    px(ctx, 1, y + 1, 12, 3, '#4a4860');
    px(ctx, 2, y + 1, 10, 1, '#5e5c78');
    if (i === n - 1) { px(ctx, 4, y + 1, 6, 2, '#2a2838'); px(ctx, 5, y + 1, 4, 1, '#1e1c2a'); }
  }
  return { canvas: cv, ax: 7, ay: cv.height - 3 };
}

// An oil drum.
function makeDrum(col) {
  const cv = makeCanvas(10, 16);
  const ctx = cv.getContext('2d');
  px(ctx, 0, 2, 10, 13, CAR_INK);
  px(ctx, 1, 2, 8, 12, col);
  px(ctx, 1, 2, 2, 12, shade(col, -30));
  px(ctx, 1, 6, 8, 1, shade(col, -40));
  px(ctx, 1, 10, 8, 1, shade(col, -40));
  px(ctx, 1, 1, 8, 2, shade(col, 30));
  px(ctx, 6, 1, 2, 1, CAR_INK);
  return { canvas: cv, ax: 5, ay: 14 };
}

// A wooden jump ramp for the monster truck, rising toward +c.
function drawRamp(ctx, sc, c, r) {
  const k = boxCorners(sc, c, r, 1, 1);
  const H = 12;
  const lift = p => ({ x: p.x, y: p.y - H });
  fillPoly(ctx, [k.L, k.B, lift(k.B)], '#a8703f');
  fillPoly(ctx, [k.B, k.R, lift(k.R), lift(k.B)], '#c8884a');
  fillPoly(ctx, [k.L, k.T, lift(k.R), lift(k.B)], (x, y) => ((x + y * 2) % 6 < 1 ? '#c8884a' : '#e0a868'));
  fillPoly(ctx, [lift(k.B), lift(k.R), { x: k.R.x, y: k.R.y - H + 2 }, { x: k.B.x, y: k.B.y - H + 2 }], '#ffd34d');
}

// A chequered flag on a pole, waving.
function drawFlag(ctx, cx, cy, t) {
  px(ctx, cx - 1, cy - 34, 2, 34, '#5a5f73');
  px(ctx, cx - 2, cy - 36, 4, 2, '#ffd34d');
  for (let i = 0; i < 12; i++) {
    const wave = Math.round(Math.sin(t * 5 - i * 0.6) * 1.2);
    for (let j = 0; j < 8; j++) px(ctx, cx + 1 + i, cy - 33 + j + wave, 1, 1, ((i >> 1) + (j >> 1)) % 2 ? CAR_INK : '#ffffff');
  }
}

// ---- Car Village ---------------------------------------------------------------

// Roads round the village and across it, a workshop, gas station, fire
// station, car wash, parking lot and a dirt yard with jumps. The gate to
// the dinosaur village is at the north end, where the unicorn one was.
function buildCarVillage() {
  const N = 30;
  const sc = makeScene('unicorn', N, N, 130, 60);
  sc.outdoor = true;
  const reserved = new Set();
  const key = (c, r) => r * N + c;
  const reserve = (c, r) => reserved.add(key(c, r));
  const mark = (c, r, kind, extra) => { const t = tileAt(sc, c, r); if (t) Object.assign(t, { car: kind }, extra); };

  // Two-lane roads: `line` is where the dashed middle line runs.
  const road = (c, r, dir, line) => {
    const t = tileAt(sc, c, r);
    if (!t) return;
    if (t.car === 'road' && t.dir !== dir) { t.dir = 'x'; delete t.line; return; }
    Object.assign(t, { car: 'road', dir, line });
  };
  const vRoad = (c0, r0, r1) => { for (let r = r0; r <= r1; r++) for (const c of [c0, c0 + 1]) road(c, r, 'v', c0 + 1); };
  const hRoad = (r0, c0, c1) => { for (let c = c0; c <= c1; c++) for (const r of [r0, r0 + 1]) road(c, r, 'h', r0 + 1); };
  vRoad(14, 0, 27);
  hRoad(14, 3, 26);
  vRoad(3, 14, 27);
  vRoad(25, 14, 27);
  hRoad(26, 3, 26);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const t = tileAt(sc, c, r);
    if (t.car === 'road' && t.dir !== 'x' && [c, r].some(v => v >= 12 && v <= 17)) {
      // Zebra crossings either side of the crossroads.
      const along = t.dir === 'v' ? r : c;
      const across = t.dir === 'v' ? c : r;
      if (across >= 14 && across <= 15 && (along === 12 || along === 17)) t.zebra = true;
    }
  }
  // The start line of the race car's lap.
  for (const r of [14, 15]) tileAt(sc, 20, r).checker = true;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const t = tileAt(sc, c, r);
    if (t.car) continue;
    let near = false;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const n = tileAt(sc, c + dc, r + dr); if (n && n.car === 'road') near = true; }
    if (near) t.car = 'walk';
  }
  for (let r = 3; r <= 10; r++) for (let c = 17; c <= 23; c++) mark(c, r, 'apron');
  for (let r = 17; r <= 20; r++) for (let c = 17; c <= 23; c++) mark(c, r, 'lot', { edge: r === 17 });
  for (let r = 21; r <= 24; r++) for (let c = 17; c <= 23; c++) mark(c, r, 'dirt');
  for (const [c, r] of [[8, 10], [8, 11], [9, 10], [7, 20], [7, 21], [11, 20]]) mark(c, r, 'apron');
  for (let r = 0; r <= 2; r++) for (let c = 12; c <= 17; c++) reserve(c, r);

  // Buildings: footprint, how tall, how to draw, a sign over the door wall.
  const building = (c, r, w, d, up, draw, sign) => {
    block(sc, c, r, w, d);
    for (let rr = r - 1; rr <= r + d; rr++) for (let cc = c - 1; cc <= c + w; cc++) reserve(cc, rr);
    const k = boxCorners(sc, c, r, w, d);
    const obj = addObject(sc, { c, r, w, d }, footBounds(sc, c, r, w, d, up, 12), ctx => draw(ctx, k));
    if (sign) {
      const p = wallPt(wall(k.L, k.B), (k.B.x - k.L.x) / 2, sign.v);
      sc.signs.push({ x: p.x, y: p.y, text: sign.text, color: sign.color, plain: sign.plain });
    }
    return { obj, k };
  };
  building(6, 7, 4, 3, 70, drawWorkshop, { v: 50, text: '🔧 정비소', color: '#3a6fd8' });
  const fs = building(6, 17, 3, 3, 70, drawFireStation, { v: 52, text: '🚒 소방서', color: '#e0503a' });
  building(10, 17, 3, 3, 70, drawCarWash, { v: 30, text: '🫧 세차장', color: '#4a9ad8' });
  building(21, 4, 3, 3, 60, drawGasShop, { v: 40, text: '⛽ 주유소', color: '#e0503a' });
  building(2, 2, 3, 3, 80, (ctx, k) => drawCarHome(ctx, k, { roof: '#5a8fe0' }), { v: 22, text: '🚗', color: '#5a8fe0', plain: true });
  building(8, 1, 3, 3, 80, (ctx, k) => drawCarHome(ctx, k, { roof: '#ff8a5a' }), { v: 22, text: '🚙', color: '#ff8a5a', plain: true });
  building(25, 8, 3, 3, 80, (ctx, k) => drawCarHome(ctx, k, { roof: '#4fbf70', wall: '#f4f8ff' }), { v: 22, text: '🚐', color: '#4fbf70', plain: true });
  // The fire station's siren.
  const sirenAt = { x: (fs.k.L.x + fs.k.R.x) / 2, y: (fs.k.L.y + fs.k.R.y) / 2 - 42 };
  sc.objects.push({ c0: 6, r0: 17, c1: 8, r1: 19, x: sirenAt.x - 6, y: sirenAt.y - 12, w: 12, h: 14,
    animated: (ctx, t) => drawFireSiren(ctx, Math.round(sirenAt.x), Math.round(sirenAt.y), t) });
  sc.lamps.push({ x: sirenAt.x, y: sirenAt.y - 4, small: true });

  // The canopy over the pumps: only its posts and the pumps block the way.
  const pumps = [[19, 5, '#ec4a3c'], [19, 7, '#3a6fd8']];
  const posts = [[18, 4], [20, 4], [18, 8], [20, 8]];
  for (const [c, r] of posts.concat(pumps.map(([c, r]) => [c, r]))) { block(sc, c, r, 1, 1); reserve(c, r); }
  addObject(sc, { c: 18, r: 4, w: 3, d: 5 }, footBounds(sc, 18, 4, 3, 5, 64, 14), ctx => drawCanopy(ctx, sc, 18, 4, 3, 5, pumps));

  // Small things standing on single tiles.
  const prop = (c, r, sprite) => {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, canvas: sprite.canvas, x: p.x - sprite.ax, y: p.y - sprite.ay, w: sprite.canvas.width, h: sprite.canvas.height });
  };
  const cone = makeCone();
  const tyres = makeTyres(3);
  const lamp = makeLamp();
  for (const [c, r] of [[17, 21], [23, 21], [17, 24], [23, 24], [11, 10], [12, 21]]) prop(c, r, cone);
  for (const [c, r] of [[5, 10], [10, 9], [9, 21], [22, 3]]) prop(c, r, makeTyres(2 + ((c + r) % 3)));
  prop(17, 10, makeDrum('#3a6fd8'));
  prop(23, 9, makeDrum('#ec4a3c'));
  prop(5, 11, tyres);
  for (const [c, r] of [[13, 5], [16, 9], [13, 22], [16, 24], [6, 13], [9, 16], [22, 16], [24, 12], [2, 18], [27, 21], [8, 25], [21, 25]]) {
    prop(c, r, lamp);
    const p = tileCenter(sc, c, r);
    sc.lamps.push({ x: p.x, y: p.y - lamp.ay + lamp.glow.y });
  }
  // Traffic lights at the crossroads, taking turns.
  [[13, 13, 0], [16, 13, 1.5], [13, 16, 1.5], [16, 16, 0]].forEach(([c, r, off]) => {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, x: p.x - 6, y: p.y - 42, w: 12, h: 46,
      animated: (ctx, t) => drawTrafficLight(ctx, Math.round(p.x), Math.round(p.y), t, off) });
  });
  // The race flag by the start line.
  {
    const p = tileCenter(sc, 19, 13);
    block(sc, 19, 13, 1, 1);
    reserve(19, 13);
    sc.objects.push({ c0: 19, r0: 13, c1: 19, r1: 13, x: p.x - 3, y: p.y - 40, w: 18, h: 42,
      animated: (ctx, t) => drawFlag(ctx, Math.round(p.x), Math.round(p.y), t) });
  }
  // Jumps in the dirt yard.
  for (const [c, r] of [[18, 22], [22, 23]]) {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    addObject(sc, { c, r, w: 1, d: 1 }, { x: p.x - 18, y: p.y - 24, w: 36, h: 34 }, ctx => drawRamp(ctx, sc, c, r));
  }
  // A couple of sleepy cars in the parking lot (just for looks).
  for (const [c, r, car, flip] of [[18, 19, 'taxi', false], [22, 19, 'ambulance', true]]) {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    addObject(sc, { c, r, w: 1, d: 1 }, { x: p.x - 26, y: p.y - 34, w: 52, h: 40 }, ctx => drawCaptainCar(ctx, Math.round(p.x), Math.round(p.y), car, 0, { flip, eyes: false }));
  }
  const lotSign = tileCenter(sc, 20, 17);
  sc.signs.push({ x: lotSign.x, y: lotSign.y - 20, text: '🅿️ 주차장', color: '#3a6fd8' });

  for (const n of UNICORN_NPCS) reserve(n.c, n.r);

  // Trees round the edge and a few in the gardens.
  const trees = [makeTree('green'), makePlant('pine'), makePlant('oak'), makeTree('green'), makePlant('bush'), makePlant('birch')];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const t = tileAt(sc, c, r);
    if (t.blocked || t.car || reserved.has(key(c, r))) continue;
    const ring = c < 2 || r < 2 || c > N - 3 || r > N - 3;
    if (hash(c, r, 97) >= (ring ? 0.55 : 0.1)) continue;
    if (!ring && sc.objects.some(o => o.tree && Math.abs(o.c0 - c) <= 1 && Math.abs(o.r0 - r) <= 1)) continue;
    const tree = trees[Math.floor(hash(c, r, 98) * trees.length)];
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
  addGate(sc, [13, 16], 1, '#9fb4d8');
  sc.links = [14, 15].map(c => ({ c, r: 0, target: 'forest', at: { c: c + 1, r: 27 }, icon: '🦖', style: 'gate' }));
  const fg = tileCenter(sc, 14.5, 1);
  sc.signs.push({ x: fg.x, y: fg.y - 64, text: place('forest'), color: '#4f9f58' });
  sc.start = { c: 14, r: 1 };
  sc.paintGround = g => paintCarGround(sc, g);
  renderGround(sc);
  return sc;
}
