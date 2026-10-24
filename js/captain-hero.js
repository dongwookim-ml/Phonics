// Captain edition: the robot hero. Robot parts for every wardrobe slot, the
// robot's sprite (walking, and two battle poses), and the wording of the
// workbench (정비대), reward card and parts shop.
//
// js/captain-car.js fills UNICORNS with cars, draws them and seats the robot
// in them (cut at captainHeroWaist). js/captain-drone.js fills FAIRIES with
// helper buddies; this file draws them through
//   drawCaptainBuddy(ctx, x, y, buddyKey, t)
// and a stand-in until it exists.
//
// Slots keep their princess names so the reward and wardrobe code works
// unchanged: hand = arms, hair = legs, shape = body, head = head,
// dress = paint colour, back = jetpack, ride = car, fairy = helper buddy.

// ---- Robot parts -----------------------------------------------------------
// Unmarked parts come from anyone (Robot Town hands out arms, legs and
// colours); `forest` parts come first from the Dinosaur Village; `shop`
// parts are only sold in the parts shop, for `price` coins.

// Paint: [main, shade, light, trim].
const ROBOT_PAINT = {
  blue:   { name: '파란',   icon: '🔵', c: ['#5aa6f0', '#3a74c4', '#b0dcff', '#ffd34d'] },
  red:    { name: '빨간',   icon: '🔴', c: ['#ff6b6b', '#cf4050', '#ffb8b0', '#ffd34d'] },
  yellow: { name: '노란',   icon: '🟡', c: ['#ffd34d', '#e0a02a', '#fff2b0', '#ff6b6b'] },
  green:  { name: '초록',   icon: '🟢', c: ['#5fd08a', '#36a066', '#c0f4d4', '#ffd34d'] },
  orange: { name: '주황',   icon: '🟠', c: ['#ffa04a', '#e0702a', '#ffd4a8', '#5aa6f0'] },
  purple: { name: '보라',   icon: '🟣', c: ['#a88cff', '#7a5ad8', '#dcd0ff', '#ffd34d'], forest: true },
  white:  { name: '하얀',   icon: '⚪', c: ['#f4f6fc', '#c4cce0', '#ffffff', '#ff6b6b'], forest: true },
  black:  { name: '까만',   icon: '⚫', c: ['#4a4e6e', '#33364f', '#7a80a4', '#6ff0ff'], forest: true },
  gold:   { name: '황금',   icon: '🌟', c: ['#ffd34d', '#d89a1c', '#fff6c0', '#ff6b6b'], shop: true, price: 12 },
  chrome: { name: '반짝 은빛', icon: '💿', c: ['#dfe6f4', '#9aa6c8', '#ffffff', '#6ff0ff'], shop: true, price: 10 },
};
const ROBOT_BODIES = {
  basic:  { name: '하트 몸통',     icon: '❤️' },
  tank:   { name: '캡틴 몸통',     icon: '⭐', forest: true },
  core:   { name: '번개 몸통',     icon: '⚡', forest: true },
  stego:  { name: '스테고 등판',   icon: '🦕', forest: true },
  ankylo: { name: '안킬로 갑옷',   icon: '🛡️', forest: true },
  rex:    { name: '티라노 꼬리',   icon: '🦖', forest: true },
};
const ROBOT_HEADS = {
  dome:    { name: '동글 머리',     icon: '🤖' },
  box:     { name: '네모 머리',     icon: '📺', forest: true },
  captain: { name: '캡틴 헬멧',     icon: '⭐', forest: true },
  trex:    { name: '티라노 헬멧',   icon: '🦖', forest: true },
  tricera: { name: '트리케라 헬멧', icon: '🦕', forest: true },
  astro:   { name: '우주 헬멧',     icon: '🪐', shop: true, price: 12 },
};
const ROBOT_ARMS = {
  basic:  { name: '기본 팔',   icon: '🦾' },
  claw:   { name: '집게 팔',   icon: '🦀' },
  drill:  { name: '드릴 팔',   icon: '🔩' },
  magnet: { name: '자석 팔',   icon: '🧲' },
  rocket: { name: '로켓 주먹', icon: '🥊', shop: true, price: 10 },
};
const ROBOT_LEGS = {
  basic:  { name: '기본 다리',   icon: '🦿' },
  wheel:  { name: '외바퀴',      icon: '🛞' },
  treads: { name: '탱크 바퀴',   icon: '🚜' },
  spring: { name: '용수철 다리', icon: '🌀' },
  hover:  { name: '부스터 다리', icon: '🔥', shop: true, price: 12 },
};
const ROBOT_BACKS = {
  none:    { name: '없음',   icon: '' },
  jetpack: { name: '제트팩', icon: '🚀', shop: true, price: 15 },
};
// A complete basic robot.
const ROBOT_OUTFIT = { dress: 'blue', shape: 'basic', head: 'dome', hand: 'basic', hair: 'basic', back: 'none', ride: 'none', fairy: 'none' };

if (isCaptain()) {
  // The princess tables become robot parts, in place (they are const).
  const swap = (table, items) => {
    for (const k of Object.keys(table)) delete table[k];
    Object.assign(table, items);
  };
  swap(DRESS_COLORS, ROBOT_PAINT);
  swap(DRESS_SHAPES, ROBOT_BODIES);
  swap(HEADWEAR, ROBOT_HEADS);
  swap(HAND_ITEMS, ROBOT_ARMS);
  swap(HAIR_COLORS, ROBOT_LEGS);
  swap(BACK_ITEMS, ROBOT_BACKS);
  // UNICORNS and FAIRIES are swapped for cars and buddies by
  // js/captain-car.js and js/captain-drone.js.
  swap(DEFAULT_OUTFIT, ROBOT_OUTFIT);
  swap(DEFAULT_BOY_OUTFIT, ROBOT_OUTFIT);

  Object.assign(LINES, {
    gift: [
      'I have a cool robot part for you. Do you want to try it?', 'This is for you, {title}! Shall we fit it on?',
      'Ta-da! A new robot part! Shall we try it?', 'You earned a new part! Would you like to put it on?',
    ],
    yes: ['Looking cool!', 'Awesome upgrade!', 'Super cool, {title}!', 'Beep boop! You look great!', 'Wow, what a robot!'],
    keep: ["Okay! I'll put it on your workbench.", 'Off to the workbench it goes!', 'Great! You can fit it on in your room later.'],
    dressup: ["Let's build your robot!", 'Time for a robot upgrade!', 'Pick your favourite parts!'],
    shop: ['What would you like today?', 'Pick a cool part!', 'These parts are extra special!'],
    poor: ['Oh, you need a few more coins. Beat the villains in the cave!', 'Almost! Visit the Villain Cave for more coins.', 'Not enough coins yet. The cave villains drop lots of coins!'],
    soldOut: ['Wow, you have every part already!', 'You bought all my parts! Amazing!'],
  });
  PERSONA.merchant = ['Welcome to the Parts Shop, {title} {name}!', 'Hello, hello! Come and see my shiny parts!', 'Ah, {title} {name}! Do you have coins today?'];
}

// ---- Wiring (called by js/game.js once every script has loaded) -------------

// Marks cars and buddies for rewardChoices, puts the workbench rows in
// robot order with robot titles, and re-labels the workbench and shop.
// `wardrobe` is WARDROBE from js/game.js.
function captainWardrobe(wardrobe) {
  // Cars (js/captain-car.js) and buddies (js/captain-drone.js) refill
  // UNICORNS and FAIRIES themselves; mark them so rewards come from the
  // right village.
  for (const [k, car] of Object.entries(UNICORNS)) if (k !== 'none') car.unicorn = true;
  for (const [k, buddy] of Object.entries(FAIRIES)) if (k !== 'none') { buddy.fairy = true; buddy.glow = buddy.glow || '#9fe8ff'; }
  const rows = {
    head: '머리', shape: '몸통', hand: '팔', hair: '다리', dress: '페인트 색',
    back: '등에 메는 것 (부품 상점)', ride: '자동차 (자동차 마을)', fairy: '도우미 (드론 마을)',
  };
  const order = Object.keys(rows);
  for (const w of wardrobe) if (rows[w.slot]) w.title = rows[w.slot];
  wardrobe.sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot));
  document.querySelector('#wardrobe .wd-done').textContent = '정비 끝! 🔧';
  document.querySelector('#shop .wd-name').textContent = place('shop');
}

// "🔵 파란 페인트": paint is named by colour.
function captainItemLabel(slot, v) {
  return slot === 'dress' ? `${v.icon} ${v.name} 페인트` : `${v.icon} ${v.name}`;
}

// The reward card's wording for a new part, car or buddy (also after a buy).
function captainRewardText(isNew, label, ride, buddy) {
  ui.rewardName.textContent = !isNew ? label : ride ? `${label} · 새 자동차가 생겼어요!` : buddy ? `${label} · 새 친구가 생겼어요!` : `${label} · 정비대에 쏙!`;
  // Car buttons are worded by js/captain-car.js.
  const car = typeof CAPTAIN_RIDE_TEXT !== 'undefined' ? CAPTAIN_RIDE_TEXT : { yes: '지금 탈래요 🚗', no: '차고에 둘래요 🅿️' };
  ui.rewardYes.textContent = ride ? car.yes : buddy ? '같이 다닐래요 🛸' : '장착할래요 🔧';
  ui.rewardNo.textContent = !isNew ? '그대로 할래요' : ride ? car.no : buddy ? '격납고에 둘래요 🛬' : '정비대에 둘래요 🧰';
}

// Workbench, shop and start-screen wording that game.js sets as it goes.
const CAPTAIN_TEXT = {
  workbench: () => `🔧 ${TITLES[PLAYER.title].ko}의 정비대`,
  collected: (have, total) => `모은 부품 ${have} / ${total}`,
  shopOnly: '✨ 상점에만 있는 특별 부품이에요!',
  poor: n => `코인이 ${n}개 더 필요해요. 악당 동굴에서 악당을 물리쳐 봐요! 😈`,
};

// ---- The robot's sprite ------------------------------------------------------
// Same canvas and anchor as the princess (22 x 34, feet at 11, 33) so every
// portrait, the rider and the fairy-friend room line up. Parts are stamped
// into a grid of colours; an ink outline goes round the whole silhouette at
// the end, so parts can overlap freely. Bitmaps are left halves or whole rows;
// `o` is ink inside the robot.

const ROBOT_W = 22;
const ROBOT_H = 34;
const ROBOT_INK = '#2f2c56';

function robotPalette(outfit) {
  const c = (ROBOT_PAINT[outfit.dress] || ROBOT_PAINT.blue).c;
  return {
    o: ROBOT_INK, d: c[0], D: c[1], L: c[2], t: c[3],
    a: '#d4dcec', A: '#9aa4c4', M: '#ffffff', j: '#5e6890', n: '#3c405e', N: '#6a7096',
    k: '#262c4c', K: '#38406a', e: '#6ff0ff', E: '#ffffff', p: '#ff8fb8',
    r: '#ff5a6a', R: '#c83a4a', y: '#ffd34d', Y: '#e09a2a', g: '#5fe08a', w: '#ffffff',
    i: '#fff4d6', I: '#e4cc9c', f: '#ffe066', F: '#ff8a3d', b: '#bfe8ff', B: '#8fc8f0',
  };
}

// Heads: 16 columns (x 3..18), stamped from row y0 so the chin row lands
// on y17, just above the neck. k screen, e/E eyes, p cheeks, d/D/L paint,
// a/A metal, i/I ivory, b/B glass.
const ROBOT_HEAD_ROWS = {
  dome: { y0: 2, rows: [
    '.........rr.....',
    '........rwrR....',
    '.........rR.....',
    '..........a.....',
    '....dddddddd....',
    '..ddLLddddddDD..',
    '.dLLddddddddddD.',
    '.dLkkkkkkkkkkDD.',
    'adLkEekkkkEekDDa',
    'AdLkeekkkkeekDDA',
    'adLkeekkkkeekDDa',
    '.dLkpkekkekpkDD.',
    '.dLkkkkeekkkkDD.',
    '.ddDkkkkkkkkDDD.',
    '..dDDDDDDDDDDD..',
    '....jjjjjjjj....',
  ] },
  box: { y0: 3, rows: [
    '...y........y...',
    '...a........a...',
    '...a........a...',
    '.dddddddddddddd.',
    '.dLLddddddddDDD.',
    '.dLkkkkkkkkkkDD.',
    'ydLkEekkkkEekDDy',
    'YdLkeekkkkeekDDY',
    'ydLkeekkkkeekDDy',
    '.dLkpkekkekpkDD.',
    '.dLkkkkeekkkkDD.',
    '.dLkkkkkkkkkkDD.',
    '.dDDDDDDDDDDDDD.',
    '.aAaAaAaAaAaAaA.',
    '....jjjjjjjj....',
  ] },
  captain: { y0: 2, rows: [
    '.......tt.......',
    '......tttt......',
    '....ddttttdd....',
    '..ddLLdyydddDD..',
    '.dLLddyyyyddDDD.',
    '.dLdyyyyyyyyDDD.',
    '.dLddyyyyyydDDD.',
    '.dLddyyddyydDDD.',
    '.dLkkkkkkkkkkDD.',
    'adLkEekkkkEekDDa',
    'AdLkeekkkkeekDDA',
    'adLkpkekkekpkDDa',
    '.dLkkkkeekkkkDD.',
    '.ddDkkkkkkkkDDD.',
    '..dDDDDDDDDDDD..',
    '....jjjjjjjj....',
  ] },
  trex: { y0: 3, rows: [
    '...dddddddddd...',
    '..dLLddddddddD..',
    '.dLwkddddddkwdD.',
    '.dLddddddddddDD.',
    'dLdddoddddodddDd',
    'dLdddddddddddDDd',
    'dDDDDDDDDDDDDDDd',
    '.dikkikkkkikkid.',
    '.dkEekkkkkkEekd.',
    '.dkeekkkkkkeekd.',
    '.dkpkkekkekkpkd.',
    '.dikkkkeekkkkid.',
    '.dDiDDiDDiDDiDd.',
    '..dDDDDDDDDDDd..',
    '....jjjjjjjj....',
  ] },
  tricera: { y0: 2, rows: [
    '..i..........i..',
    '..ii........ii..',
    '...ii......ii...',
    '...iI......Ii...',
    '...diIdiidIid...',
    '..ddLLdIIdddDD..',
    '.dLLddddddddddD.',
    '.dLkkkkkkkkkkDD.',
    'adLkEekkkkEekDDa',
    'AdLkeekkkkeekDDA',
    'adLkeekkkkeekDDa',
    '.dLkpkekkekpkDD.',
    '.dLkkkkeekkkkDD.',
    '.ddDkkkkkkkkDDD.',
    '..dDDDDDDDDDDD..',
    '....jjjjjjjj....',
  ] },
  astro: { y0: 3, rows: [
    '....bbbbbbbb....',
    '..bbMMbbbbbbbB..',
    '.bMMbbbbbbbbbbB.',
    'bMbbddddddddbbbB',
    'bMddLLddddddDDbB',
    'bdLLddddddddddDB',
    'bdLkkkkkkkkkkDDB',
    'bdLkEekkkkEekDDB',
    'bdLkeekkkkeekDDB',
    'bdLkpkekkekpkDDB',
    'bdLkkkkeekkkkDDB',
    'bddDkkkkkkkkDDDB',
    '.wwwwwwwwwwwwww.',
    '..aAaAaAaAaAaA..',
    '....jjjjjjjj....',
  ] },
};
// The triceratops frill, behind the head (20 columns, x 1..20).
const ROBOT_FRILL = [
  '....D..D....D..D....',
  '...DttDttttttDttD...',
  '..DttttttttttttttD..',
  '.DtttDttttttttDtttD.',
  '.tttttttttttttttttt.',
  'DttDttttttttttttDttD',
  'tttttttttttttttttttt',
  'Dttt............tttD',
  'ttt..............ttt',
  '.tD..............Dt.',
];

// Bodies: 16 columns (x 3..18), rows y18..26.
const ROBOT_BODY_ROWS = {
  basic: [
    '......aaaa......',
    '....dddddddd....',
    '...dLLddddddD...',
    '...dLwrddrrdD...',
    '...dLrrrrrrdD...',
    '...dLdrrrrddD...',
    '...dLddrrdddD...',
    '...tttttttttt...',
    '....DDDDDDDD....',
  ],
  tank: [
    '......aaaa......',
    '..dddddddddddd..',
    '..dLLddddddddD..',
    '..dLdddyydddDD..',
    '..dLdyyyyyydDD..',
    '..dLddyyyyddDD..',
    '..dLdyyddyydDD..',
    '...tttttttttt...',
    '....DDDDDDDD....',
  ],
  core: [
    '......aaaa......',
    '....dddddddd....',
    '...dLLkkkkddD...',
    '...dLkeEeekdD...',
    '...dLkeyyekdD...',
    '...dLkeyyekdD...',
    '...dLdkeekddD...',
    '...tttttttttt...',
    '....DDDDDDDD....',
  ],
  stego: [
    '......aaaa......',
    '....dddddddd....',
    '...dLLddddddD...',
    '...dLdtddtddD...',
    '...dLdddddddD...',
    '...dLddttdddD...',
    '...dLdddddddD...',
    '...tttttttttt...',
    '....DDDDDDDD....',
  ],
  ankylo: [
    '......aaaa......',
    '...dddddddddd...',
    '..dLdiddddidDD..',
    '..dLdddiiddddD..',
    '..dLdiddddidDD..',
    '..dLdddiiddddD..',
    '...dLdddddddD...',
    '...tttttttttt...',
    '....DDDDDDDD....',
  ],
  rex: [
    '......aaaa......',
    '....dddddddd....',
    '...dLdiiiiddD...',
    '...dLiIiIiidD...',
    '...dLiiiiiidD...',
    '...dLiIiIiidD...',
    '...dLdiiiiddD...',
    '...tttttttttt...',
    '....DDDDDDDD....',
  ],
};
// Pieces behind a body (left side; `both` mirrors it to the right too):
// stego plates beside the head, and a T-rex tail curling out on the left.
const ROBOT_BODY_BACK = {
  stego: { x: 0, y: 4, both: true, rows: [
    '...t',
    '..tt',
    '.tLt',
    'tLtt',
    '.tt.',
    '....',
    '..t.',
    '.tLt',
    'tLtt',
    '.tt.',
    '....',
    '.t..',
    'tLt.',
    '.t..',
  ] },
  rex: { x: 0, y: 24, rows: [
    '.....dd',
    '....dLd',
    '...dLD.',
    '..dLD..',
    '.dLD...',
    'dLD....',
    'dD.....',
  ] },
};
// Pieces in front of a body: the ankylosaurus shoulder spikes.
const ROBOT_BODY_FRONT = {
  ankylo: { x: 1, y: 16, rows: ['.i..', '.ii.', '..Ii'] },
};

// Arms: the left arm (x 0..6) from row y19, mirrored for the right.
const ROBOT_ARM_ROWS = {
  basic: [
    '....dd.',
    '...dLd.',
    '...aAo.',
    '...aAo.',
    '...jjo.',
    '..aMao.',
    '..aaAo.',
    '...AA..',
  ],
  claw: [
    '....dd.',
    '...dLd.',
    '...aAo.',
    '...aAo.',
    '...jjo.',
    '..aAAa.',
    '..a..a.',
    '..A..A.',
  ],
  magnet: [
    '....dd.',
    '...dLd.',
    '...aAo.',
    '...jjo.',
    '.rrrrR.',
    '.rR.rR.',
    '.rR.rR.',
    '.aM.aM.',
  ],
  rocket: [
    '....dd.',
    '...dLd.',
    '...aAo.',
    '...jjo.',
    '..ttt..',
    '.rwrrR.',
    '.rrrrR.',
    '..RRR..',
  ],
};
// The drill arm has a hand on the left and a drill on the right (x 16..20).
const ROBOT_DRILL = [['.aaa.', 'yYyYy', '.YyY.', '.yYy.', '..Y..', '..y..'], ['.aaa.', 'YyYyY', '.yYy.', '.YyY.', '..y..', '..Y..']];

// Legs: the left leg (x 3..10) from row y27, mirrored for the right.
const ROBOT_LEG_ROWS = {
  basic: [
    '....jj..',
    '....aA..',
    '....aA..',
    '...dddd.',
    '..dLddD.',
    '..ddddD.',
    '..jjjjj.',
  ],
  spring: [
    '....jj..',
    '...aA...',
    '....aA..',
    '...aA...',
    '....aA..',
    '...dddd.',
    '..jjjjj.',
  ],
};
// Jetpack: a little rocket over each shoulder, flames below.
const ROBOT_JETPACK = ['.r.', 'rrR', 'aMA', 'aaA', 'tttt', 'aaA', 'aaA', 'aaA', 'aaA', 'aaA', 'aaA', 'jjj'];

function robotGrid() {
  const g = [];
  for (let y = 0; y < ROBOT_H; y++) g.push(new Array(ROBOT_W).fill(null));
  const set = (x, y, col) => { if (col && x >= 0 && y >= 0 && x < ROBOT_W && y < ROBOT_H) g[y][x] = col; };
  // Copies a bitmap in, mirrored about the robot's middle when `flip`.
  const stamp = (rows, pal, x0, y0, flip) => {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] !== '.') set(flip ? ROBOT_W - 1 - (x0 + i) : x0 + i, y0 + j, pal[row[i]]);
      }
    });
  };
  return { g, set, stamp };
}

const robotCache = new Map();

// Returns { canvas, ax, ay } for an outfit and frame. Frames 0 and 1 walk;
// 'blast' fires from the right fist (see captainHeroHand) and 'shield'
// wraps the robot in an energy bubble.
function robotSprite(outfit, frame) {
  const key = `${outfit.dress}|${outfit.shape}|${outfit.head}|${outfit.hand}|${outfit.hair}|${outfit.back}|${frame}`;
  if (robotCache.has(key)) return robotCache.get(key);
  const pal = robotPalette(outfit);
  const G = robotGrid();
  const step = frame === 1;
  const flame = (x, y) => { G.set(x, y, pal.f); G.set(x, y + 1, step ? pal.F : pal.f); G.set(x + (step ? 1 : -1), y + 2, pal.F); };

  // Behind everything: the jetpack, a frill, plates or a tail.
  if (outfit.back === 'jetpack') {
    for (const flip of [false, true]) G.stamp(ROBOT_JETPACK, pal, 0, 11, flip);
    flame(1, 23);
    flame(20, 23);
  }
  if (outfit.head === 'tricera') G.stamp(ROBOT_FRILL, pal, 1, 1, false);
  const back = ROBOT_BODY_BACK[outfit.shape];
  if (back) {
    G.stamp(back.rows, pal, back.x, back.y, false);
    if (back.both) G.stamp(back.rows, pal, back.x, back.y, true);
  }

  // Legs.
  const legs = outfit.hair;
  if (legs === 'wheel') {
    G.stamp(['.....jjjjjj.....'], pal, 3, 26, false);
    G.stamp(['....nnnnnnnn....', '...nNnnnnnnNn...', '...nnaaaaaann...', '...nnaMaaMann...', '...nnaaMMaann...', '...nnaMaaMann...', '...nnaaaaaann...', '....nnnnnnnn....'], pal, 3, 26, false);
    // The hub turns as it rolls.
    if (step) G.stamp(['aaMaa', 'aMMMa', 'aaMaa'], pal, 8, 29, false);
    G.stamp(['ddd', 'dLd', '.d.'], pal, 4, 26, false);
    G.stamp(['ddd', 'dDd', '.d.'], pal, 15, 26, false);
  } else if (legs === 'treads') {
    const top = step ? 'nNnNnNnNnNnNnN' : 'NnNnNnNnNnNnNn';
    G.stamp(['..dLddddddddDd..'], pal, 3, 27, false);
    G.stamp(['.' + top + '.', 'naMAnaMAAMannAMn', 'naAAnaAAAAannAAn', '.' + [...top].reverse().join('') + '.'], pal, 3, 29, false);
    G.stamp(['....jj....jj....'], pal, 3, 28, false);
  } else if (legs === 'hover') {
    G.stamp(['....jjjjjjjj....', '....aAaAaAaA....', '.....aaaaaa.....', '......jjjj......'], pal, 3, 26, false);
    flame(10, 30);
    flame(11, 30);
    G.set(step ? 9 : 12, 30, pal.f);
  } else {
    const rows = ROBOT_LEG_ROWS[legs] || ROBOT_LEG_ROWS.basic;
    // Walking: the left foot lifts on frame 1.
    G.stamp(rows, pal, 3, step ? 26 : 27, false);
    G.stamp(rows, pal, 3, 27, true);
  }

  // Body.
  G.stamp(ROBOT_BODY_ROWS[outfit.shape] || ROBOT_BODY_ROWS.basic, pal, 3, 18, false);

  // Arms: the left one (on the left of the picture) dips as the right
  // one swings up. A blast points the right arm straight out.
  const arm = ROBOT_ARM_ROWS[outfit.hand] || ROBOT_ARM_ROWS.basic;
  G.stamp(arm, pal, 0, step ? 20 : 19, false);
  if (frame === 'blast') {
    G.stamp(['.dd..ff', '.dLaMwf', '.dDaawf', '.....ff'], pal, 15, 19, false);
  } else if (outfit.hand === 'drill') {
    G.stamp(ROBOT_ARM_ROWS.basic.slice(0, 5), pal, 0, step ? 18 : 19, true);
    G.stamp(ROBOT_DRILL[step ? 1 : 0], pal, 16, step ? 23 : 24, false);
  } else {
    G.stamp(arm, pal, 0, step ? 18 : 19, true);
  }
  const front = ROBOT_BODY_FRONT[outfit.shape];
  if (front) {
    G.stamp(front.rows, pal, front.x, front.y, false);
    G.stamp(front.rows, pal, front.x, front.y, true);
  }

  // The head goes on last.
  const head = ROBOT_HEAD_ROWS[outfit.head] || ROBOT_HEAD_ROWS.dome;
  G.stamp(head.rows, pal, 3, head.y0, false);

  // Paint the grid, with an ink outline round the outside (flames glow
  // without one).
  const cv = makeCanvas(ROBOT_W, ROBOT_H);
  const ctx = cv.getContext('2d');
  const g = G.g;
  const solid = c => c && c !== pal.f && c !== pal.F;
  for (let y = 0; y < ROBOT_H; y++) for (let x = 0; x < ROBOT_W; x++) {
    if (g[y][x]) px(ctx, x, y, 1, 1, g[y][x]);
    else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && solid(g[y + dy][x + dx]))) px(ctx, x, y, 1, 1, ROBOT_INK);
  }
  if (frame === 'shield') {
    // A see-through bubble with a bright rim and a twinkle.
    for (let y = 0; y < ROBOT_H; y++) for (let x = 0; x < ROBOT_W; x++) {
      const d = ((x + 0.5 - 11) / 11) ** 2 + ((y + 0.5 - 18) / 16) ** 2;
      if (d > 1) continue;
      ctx.globalAlpha = d > 0.8 ? 0.85 : 0.2;
      px(ctx, x, y, 1, 1, d > 0.8 ? '#8ff4ff' : '#c8faff');
    }
    ctx.globalAlpha = 1;
    px(ctx, 4, 8, 2, 1, '#ffffff');
    px(ctx, 3, 9, 1, 2, '#ffffff');
  }
  const sprite = { canvas: cv, ax: 11, ay: 33 };
  robotCache.set(key, sprite);
  return sprite;
}

// Draws the robot standing on (x, y), with its shadow, like drawSprite.
function drawCaptainHero(ctx, outfit, frame, x, y, flip) {
  drawSprite(ctx, robotSprite(outfit, frame), x, y, flip);
}

// Where the glowing fist of the 'blast' pose is, from the robot's feet.
function captainHeroHand(flip) {
  return { x: flip ? -10 : 10, y: -13 };
}

// ---- Riding a car ------------------------------------------------------------
// js/captain-car.js draws the cars and the rider: it cuts the robot at its
// belt, this many rows from the top of robotSprite's canvas.
function captainHeroWaist(outfit) {
  return 26;
}

// ---- Helper buddies ----------------------------------------------------------
// A buddy is drawn by drawCaptainBuddy(ctx, x, y, buddyKey, t) centred on
// (x, y) of a 20 x 18 canvas; t is the animation frame, 0 or 1. It flies
// along above the robot like the princess's fairy friend.

const captainBuddyCache = new Map();

function captainBuddySprite(key, frame) {
  const ck = `${key}|${frame}`;
  if (captainBuddyCache.has(ck)) return captainBuddyCache.get(ck);
  const cv = makeCanvas(20, 18);
  const ctx = cv.getContext('2d');
  if (typeof drawCaptainBuddy === 'function') drawCaptainBuddy(ctx, 10, 9, key, frame);
  else drawStandInBuddy(ctx, 10, 9, frame);
  const sprite = { canvas: cv, ax: 10, ay: 9 };
  captainBuddyCache.set(ck, sprite);
  return sprite;
}

// A tiny drone, until js/captain-drone.js draws the real buddies.
function drawStandInBuddy(ctx, x, y, frame) {
  px(ctx, x - (frame ? 6 : 3), y - 6, frame ? 12 : 6, 1, '#9aa4c4');
  px(ctx, x, y - 5, 1, 2, ROBOT_INK);
  px(ctx, x - 4, y - 3, 9, 6, ROBOT_INK);
  px(ctx, x - 3, y - 2, 7, 4, '#d4dcec');
  px(ctx, x - 2, y - 1, 5, 2, '#262c4c');
  px(ctx, x - 1, y - 1, 1, 1, '#6ff0ff');
  px(ctx, x + 1, y - 1, 1, 1, '#6ff0ff');
}
