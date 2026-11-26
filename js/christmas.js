// Christmas: every village dressed for it, in both editions, and special
// Christmas presents to collect. Snow lies on the ground, on the roofs and
// on the tops of the trees and fences, and snowflakes fall. In front of each
// house stands something big (a Christmas tree with lights, a snowman, a
// reindeer, a pile of presents, a gingerbread man or a penguin, the big ones
// twice the size like garden inflatables); each roof has lights down its
// edges and Santa's boots sticking out of it, a gold star or a bell on top,
// and a wreath on the wall. Little trees, snowmen, presents, candy canes,
// sleds and penguins stand beside the roads (tap any of them and it says its
// word), strings of red, green and gold lights hang between the lamp posts,
// and now and then Santa flies across the sky in his sleigh (tap him: "Ho,
// ho, ho!"). The villagers wear Santa hats, elf hats and reindeer antlers,
// the rooms have a garland, a wreath and a little tree, the music plays
// carols, and the little games have snow falling.
//
// The presents: while it is Christmas a present from anyone is, more often
// than not, one of the Christmas things (XMAS_ITEMS) she doesn't have yet:
// a Santa hat, reindeer antlers, a candy cane and Santa red for the princess
// edition, a Santa head and a reindeer head and Santa red paint for the
// robot, and six treasures for the shelf in each. They are never sold in the
// shop; after Christmas the ones she got stay hers, and the ones she didn't
// wait for next year, out of sight (xmasShown).
//
// Like Halloween (js/halloween.js, whose helpers it borrows) it is only laid
// on top: the scene builders and data are not changed. Each scene, once
// built, is dressed by christmasDress (sceneFor in js/game.js); villagers'
// hats come from christmasHat (villagerSprite in js/sprites.js); the snow
// and the sleigh are drawn by christmasDraw (drawScene) and the sleigh
// tapped by christmasTap (onPointer).
//
// When: from CHRISTMAS_DAYS.from to .until every year (on this device's
// clock), never while it is Halloween, unless the address said otherwise:
// ?christmas=0 turns it off for good on this device, ?christmas=1 shows it
// for that visit only, ?christmas=auto goes back to the dates.

const CHRISTMAS_DAYS = { from: [12, 1], until: [12, 31] }; // [month, day]: December, put away on 1 January
const CHRISTMAS_ON = (() => {
  let ask = null;
  try { ask = new URLSearchParams(location.search).get('christmas'); } catch (e) { /* no address */ }
  try {
    const kept = localStorage.getItem('pixeltown-christmas');
    if (ask === '0') localStorage.setItem('pixeltown-christmas', ask);
    else if (ask === 'auto' || ask === '1') localStorage.removeItem('pixeltown-christmas');
    else ask = kept;
  } catch (e) { /* private mode: for this visit only */ }
  if (HALLOWEEN_ON) return false;
  if (ask === '1' || ask === '0') return ask === '1';
  const d = new Date();
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  const at = ([m, day]) => m * 100 + day;
  return md >= at(CHRISTMAS_DAYS.from) && md <= at(CHRISTMAS_DAYS.until);
})();

// The narrator's hello as the game starts (LINES.christmas in js/data.js).
if (CHRISTMAS_ON && LINES.christmas) LINES.start = LINES.christmas;

// The login and start screens: the greeting under the game's name (tap it
// and the narrator says it), a winter sky, and snow and things behind (CSS:
// .start.xm, .xm-hello, .xm-deco in css/style.css).
function xmScreens() {
  for (const id of ['login', 'start']) {
    const el = document.getElementById(id);
    const h1 = el && el.querySelector('h1');
    if (!h1) continue;
    el.classList.add('xm');
    h1.insertAdjacentHTML('beforeend', `<br><span class="xm-hello" role="button">${I18n.t('christmas.screenGreeting')}</span>`);
    h1.querySelector('.xm-hello').addEventListener('click', () => {
      Sound.unlock();
      Sound.say([{ text: line('christmasHi'), narrator: true }]);
    });
    const flakes = Array.from({ length: 8 }, () => '<i class="flake">❄️</i>').join('');
    el.insertAdjacentHTML('afterbegin', `<div class="xm-deco" aria-hidden="true">${flakes}<i class="tree">🎄</i><i class="tree">🎄</i>`
      + '<i class="snowman">⛄</i><i class="gift">🎁</i><i class="sleigh">🛷</i></div>');
  }
}
if (CHRISTMAS_ON && typeof document !== 'undefined') xmScreens();

// ---- Carols ----------------------------------------------------------------------
// Old carols, free for anyone, in the same little band (js/music.js):
// Jingle Bells in town, Deck the Halls in the villages, Silent Night in the
// caves and We Wish You a Merry Christmas in the rooms.
const XM_TUNES = {
  jingle: {
    step: 0.26, bar: 8,
    chords: 'C C C C F C D G C C C C F C G C',
    melody: 'E5 - E5 - E5 - - - | E5 - E5 - E5 - - - | E5 - G5 - C5 - - D5 | E5 - - - - - . . |' +
      'F5 - F5 - F5 - - F5 | F5 - E5 - E5 - E5 E5 | E5 - D5 - D5 - E5 - | D5 - - - G5 - - - |' +
      'E5 - E5 - E5 - - - | E5 - E5 - E5 - - - | E5 - G5 - C5 - - D5 | E5 - - - - - . . |' +
      'F5 - F5 - F5 - - F5 | F5 - E5 - E5 - E5 E5 | G5 - G5 - F5 - D5 - | C5 - - - - - . . ',
    arp: '0 . 2 . 1 . 2 .',
    bass: '0 - - - 2 - - -',
  },
  deck: {
    step: 0.28, bar: 8,
    chords: 'G G D G G G D G',
    melody: 'D5 - - C5 B4 - A4 - | G4 - A4 - B4 - G4 - | A4 B4 C5 A4 B4 - - A4 | G4 - F#4 - G4 - - - |' +
      'D5 - - C5 B4 - A4 - | G4 - A4 - B4 - G4 - | A4 B4 C5 A4 B4 - - A4 | G4 - F#4 - G4 - . . ',
    arp: '0 2 1 2 0 2 1 2',
    bass: '0 - - - 2 - - -',
  },
  silent: {
    step: 0.36, bar: 6,
    chords: 'C C C C G G C C',
    melody: 'G4 - A4 G4 - - | E4 - - - - - | G4 - A4 G4 - - | E4 - - - - - |' +
      'D5 - - D5 - - | B4 - - - - . | C5 - - C5 - - | G4 - - - - . ',
    arp: '0 . 2 . 3 .',
    bass: '0 - - - - -',
  },
  wish: {
    step: 0.3, bar: 6,
    chords: 'G C A D B Em D G',
    melody: 'G5 - G5 A5 G5 F#5 | E5 - E5 - E5 - | A5 - A5 B5 A5 G5 | F#5 - D5 - D5 - |' +
      'B5 - B5 C6 B5 A5 | G5 - E5 - D5 D5 | E5 - A5 - F#5 - | G5 - - - - . ',
    arp: '0 . 1 . 2 .',
    bass: '0 - - - - -',
  },
};
if (CHRISTMAS_ON) Object.assign(MUSIC_TUNES, XM_TUNES);
// Which of them each place plays instead of its own (musicPlaceOf).
const CHRISTMAS_MUSIC = CHRISTMAS_ON ? { town: 'jingle', forest: 'deck', fairy: 'deck', unicorn: 'deck', cave: 'silent', home: 'wish' } : {};

// Taps: snow puffs up, a bell rings, Santa laughs.
Object.assign(TOUCH_FX, {
  snow:    { move: 'shake', colors: ['#ffffff', '#e8f4ff', '#cfe6ff'], fall: true },
  jingle:  { move: 'hop', colors: ['#ffd34d', '#ffffff', '#ff5a6a', '#5fc46a'], star: true, tune: 'chime' },
  gift:    { move: 'hop', pop: '🎁', colors: ['#ff5a6a', '#ffd34d', '#6fb7ff', '#5fc46a'], tune: 'boing' },
  xmtree:  { move: 'shake', colors: ['#ffd34d', '#ff5a6a', '#6fb7ff', '#ffffff'], star: true, tune: 'chime' },
  deer:    { move: 'hop', pop: '❤️', tune: 'boing' },
  waddle:  { move: 'shake', pop: '❄️', tune: 'boing' },
});

// ---- The Christmas presents -----------------------------------------------------

// Each one marked `christmas` (given only at Christmas, before the rest).
// `art` draws a thing to wear on the hero the same way for every title.
const XMAS_ITEMS = {
  princess: {
    head: {
      santahat: { name: I18n.t('christmas.santaHat'), icon: '🎅', art: { x: 1, y: -5, rows: [
        '.....oooooo.......',
        '...ooeeeeeeooo....',
        '..oeeeeeeeeeevoo..',
        '.oeeeeeeeeeeeevvoo',
        'owwwwwwwwwwwwwwowo',
        'owWwwWwwWwwWwwWoWo',
        '.oooooooooooooo.o.',
      ] } },
      antlers: { name: I18n.t('christmas.reindeerAntlers'), icon: '🦌', art: { x: 1, y: -5, rows: [
        '.K.K..........K.K.',
        '.KKK.K......K.KKK.',
        '..KKKK......KKKK..',
        '...KK........KK...',
        '..oKKo......oKKo..',
        '..oeeeeeeeeeeeeo..',
      ] } },
    },
    hand: {
      candycane: { name: I18n.t('christmas.candyCane'), icon: '🍭', art: { x: 14, y: 6, rows: [
        '.ewe',
        'w..w',
        'e..e',
        '...w',
        '...e',
        '...w',
        '...e',
        '...w',
        '...e',
      ] } },
    },
    dress: {
      santa: { name: I18n.t('christmas.santaRed'), icon: '🎅', c: ['#e8404a', '#b02838', '#ffc4c8', '#ffffff'] },
    },
    treasure: {
      xmastree: { name: I18n.t('christmas.littleTree'), icon: '🎄' },
      snowman: { name: I18n.t('christmas.snowman'), icon: '⛄' },
      stocking: { name: I18n.t('christmas.stocking'), icon: '🧦' },
      gingerbread: { name: I18n.t('christmas.gingerbread'), icon: '🍪' },
      reindeer: { name: I18n.t('christmas.reindeerToy'), icon: '🦌' },
      giftbox: { name: I18n.t('christmas.present'), icon: '🎁' },
    },
  },
  captain: {
    head: {
      santa: { name: I18n.t('christmas.santaHead'), icon: '🎅' },
      reindeer: { name: I18n.t('christmas.reindeerHead'), icon: '🦌' },
    },
    dress: {
      santa: { name: I18n.t('christmas.santaRedPaint'), icon: '🎅', c: ['#e8404a', '#b02838', '#ffc4c8', '#ffffff'] },
    },
    treasure: {
      xmastree: { name: I18n.t('christmas.littleTree'), icon: '🎄' },
      snowman: { name: I18n.t('christmas.snowman'), icon: '⛄' },
      sleigh: { name: I18n.t('christmas.sleigh'), icon: '🛷' },
      robotgift: { name: I18n.t('christmas.present'), icon: '🎁' },
      xmasbell: { name: I18n.t('christmas.jingleBell'), icon: '🔔' },
      xmasstar: { name: I18n.t('christmas.christmasStar'), icon: '🌟' },
    },
  },
};

// The robot's Santa head (a hat with a white pompom over the round head)
// and reindeer head (antlers and a red nose light), drawn like its other
// heads (js/captain-hero.js; h H antler browns).
const XM_ROBOT_HEADS = {
  santa: { y0: 0, rows: [
    '...........ww...',
    '.........rrwww..',
    '.......rrrrRww..',
    '.....rrrrrrRR...',
    '....rrrrrrrrRR..',
    '...rrrrrrrrrrRR.',
    '.wwwwwwwwwwwwww.',
    'wMwwwwwwwwwwwwMw',
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
  reindeer: { y0: 0, rows: [
    '.h..h......h..h.',
    '.hh.h......h.hh.',
    '..hhh......hhh..',
    '...hH......Hh...',
    '...hH......Hh...',
    '....H......H....',
    '....dddddddd....',
    '..ddLLddddddDD..',
    '.dLLddddddddddD.',
    '.dLkkkkkkkkkkDD.',
    'adLkEekkkkEekDDa',
    'AdLkeekkkkeekDDA',
    'adLkeekrrkeekDDa',
    '.dLkpkkRRkkpkDD.',
    '.dLkkkkeekkkkDD.',
    '.ddDkkkkkkkkDDD.',
    '..dDDDDDDDDDDD..',
    '....jjjjjjjj....',
  ] },
};

// Adds them to the wardrobe's tables (before js/game.js builds WARDROBE):
// the princess edition's things to wear suit every title's character.
function xmAddItems() {
  const own = XMAS_ITEMS[isCaptain() ? 'captain' : 'princess'];
  const tables = { head: HEADWEAR, hand: HAND_ITEMS, dress: DRESS_COLORS, treasure: TREASURES };
  const kits = Object.keys(HERO_KITS);
  for (const [slot, items] of Object.entries(own)) {
    for (const [key, item] of Object.entries(items)) {
      if (tables[slot][key]) throw new Error(`christmas: ${slot} "${key}" is already taken`);
      const thing = Object.assign({ christmas: true }, item);
      if (!isCaptain() && (slot === 'head' || slot === 'hand')) thing.kits = kits;
      tables[slot][key] = thing;
    }
  }
  if (isCaptain()) {
    Object.assign(ROBOT_HEAD_ROWS, XM_ROBOT_HEADS);
    ROBOT_PAINT.santa = DRESS_COLORS.santa; // robotPalette reads ROBOT_PAINT
  }
}
xmAddItems();

// Whether the wardrobe shows a thing: a Christmas one only at Christmas or
// once she has it.
const xmasShown = (slot, value, item) => !item || !item.christmas || CHRISTMAS_ON || ((state.owned || {})[slot] || []).includes(value);
// Christmas presents come first this often while some are left (rewardChoices).
const XMAS_SHARE = 0.6;

// ---- Pictures -----------------------------------------------------------------------

const XM_PAL = {
  o: '#3a2a44', g: '#3f9f58', G: '#2a6e40', l: '#7ad870', r: '#ff4a5a', R: '#c02a3a', y: '#ffd34d', Y: '#e0a52a',
  z: '#fff6c0', w: '#ffffff', W: '#d4e2f2', b: '#5aa6f0', B: '#3a74c4', k: '#2e2a3a', n: '#ff8a2a', t: '#8a5a2a',
  T: '#5e3a1e', c: '#c8803a', i: '#fff4e8', a: '#e8c890', p: '#ff9ab8', s: '#ffe3d0',
};
const XM_DEER_PAL = Object.assign({}, XM_PAL, { T: '#a8703f', t: '#e0c090', w: '#f4e6cc' });

// A little Christmas tree with a star, baubles and its trunk.
const XM_TREE = [
  '......y......',
  '.....yzy.....',
  '......y......',
  '.....ogo.....',
  '....oglgo....',
  '....ogrgo....',
  '...oglgggo...',
  '...oggggyo...',
  '..ogbgglggo..',
  '..oggrgggGo..',
  '.ogglggbgggo.',
  '.ogyggggrgGo.',
  'oggggglgggGGo',
  'ooooooooooooo',
  '.....oTo.....',
  '.....oto.....',
  '....ooooo....',
];

// A snowman in a black hat and a red scarf, with a carrot nose.
const XM_SNOWMAN = [
  '...ooooo...',
  '...okkko...',
  '..ookkkoo..',
  '..orrrrro..',
  '...owwwo...',
  '..owkwkwo..',
  '..owwnnwo..',
  '..owkkkwo..',
  '..orrrrRo..',
  '.owwrRwwwo.',
  'owwwwkwwwwo',
  'owwwwwwwwWo',
  'owwwwkwwwWo',
  '.owwwwwwWo.',
  '..ooooooo..',
];

// Two presents, one on the other, with ribbons and a bow.
const XM_GIFTS = [
  '....ryr.....',
  '...rr.rr....',
  '..oooooooo..',
  '..obbwbbbo..',
  '..owwwwwwo..',
  '..obbwbbBo..',
  'oooooooooooo',
  'orrrrryrrrro',
  'oyyyyyyyyyyo',
  'orrrrryrrrro',
  'orrrrryrrrRo',
  'oooooooooooo',
];

// A candy cane standing in a heap of snow.
const XM_CANE = [
  '.oooo..',
  'orwrwo.',
  'ow.owro',
  'oo..owo',
  '....oro',
  '....owo',
  '....oro',
  '....owo',
  '...owro',
  '.wwwwww',
  'wwWwwWw',
];

// A red sled with gold runners.
const XM_SLED = [
  '.oooooooooooo..',
  'orrrrrrrrrrrRo.',
  'oRRRRRRRRRRRRo.',
  '.oooooooooooo..',
  '..y....y...y...',
  'oyyyyyyyyyyyyyo',
  '.ooooooooooooyo',
  '.............o.',
];

// A penguin with an orange beak and feet.
const XM_PENGUIN = [
  '...ooo...',
  '..okkko..',
  '.okwkwko.',
  '.okwwwko.',
  '.okwnwko.',
  'okkwwwkko',
  'okwwwwwko',
  'okwwwwwko',
  '.okwwwko.',
  '..owwwo..',
  '.nn...nn.',
];

// A gingerbread man with icing and red buttons.
const XM_GINGER = [
  '....oooo....',
  '...occcco...',
  '..ockcckco..',
  '..occiicco..',
  '...occcco...',
  'oooocccccooo',
  'ociccrccccio',
  'oooocccccooo',
  '...occrcco..',
  '...occccco..',
  '..occo.occo.',
  '..ocio.oico.',
  '..oooo.oooo.',
];

// A reindeer with a red nose, facing left.
const XM_REINDEER = [
  '..t.t.............',
  '..ttt.t...........',
  '...tttt...........',
  '....tt............',
  '...ooooo..........',
  '..oTTTTTo.........',
  '.oTkTTTTo.........',
  'roTTTTTTo.........',
  'rrooTTTTTooooooo..',
  '....oTTTTTTTTTTTo.',
  '....oTTTTTTTTTTTTo',
  '....oTwwTTTTTTTTTo',
  '.....oTTTTTTTTTTo.',
  '.....oTo.oTo.oTTo.',
  '.....oTo.oTo..oTo.',
  '.....oko.oko..oko.',
];

// ---- On the houses ------------------------------------------------------------------

// Santa's boots sticking up out of the roof, stuck on his way down.
const XM_BOOTS = [
  '.kk...kk.',
  '.kk...kk.',
  '.ww...ww.',
  '.rr...rr.',
  '..rr.rr..',
  '..rrrrr..',
  '.wwwwwww.',
  '.ooooooo.',
];
// A gold star for the top.
const XM_STAR = [
  '...y...',
  '...y...',
  'yyyyyyy',
  '.yyzyy.',
  '..yyy..',
  '.yy.yy.',
  '.y...y.',
];
// A bell with a red bow.
const XM_BELL = [
  '.r...r.',
  '.rrRrr.',
  '..oyo..',
  '.oyzyo.',
  '.oyyyo.',
  'oyyyyyo',
  'ooooooo',
  '...o...',
];
// A wreath with a red bow, for a wall.
const XM_WREATH = [
  '..ggggg..',
  '.gGgrgGg.',
  'gGg...gGg',
  'gg.....gg',
  'gr.....rg',
  'gg.....gg',
  'gGg...gGg',
  '.gGrrrGg.',
  '..grRrg..',
];

// Santa in his sleigh with his sack, and a reindeer pulling it (both facing right).
const XM_SLEIGH = [
  '.........ww.......',
  '........rrrw......',
  '.......rrrrrw.....',
  '.......wwwwww.....',
  '..tt...ssssks.....',
  '.tttt..wwwwww.....',
  '.tttt.rrwwwwrr....',
  'oooooooooooooooo.o',
  'orrrrrrrrrrrrrrrro',
  '.oRRRRRRRRRRRRRRo.',
  '..oo........oo....',
  'yyyyyyyyyyyyyyyyyy',
];
const XM_FLYING_DEER = [[
  '.......t.t',
  '.......tt.',
  '......oTTr',
  'oooooooTo.',
  'oTTTTTTTo.',
  '.oTTTTTo..',
  '.T.T..T.T.',
], [
  '.......t.t',
  '.......tt.',
  '......oTTr',
  'oooooooTo.',
  'oTTTTTTTo.',
  '.oTTTTTo..',
  'T...TT...T',
]];

// The villagers' hats for Christmas (drawn where their own hat goes).
const XM_HATS = {
  santa: { x: 1, y: -8, pal: { e: '#e8485a', E: '#c8303f', w: '#ffffff', W: '#dde4f2' }, rows: [
    '.........oo...',
    '........owwo..',
    '.......oeWwo..',
    '......oeeoo...',
    '.....oeeeeo...',
    '....oeeeeEEo..',
    '...oeeeeeeEEo.',
    '.owwwwwwwwwwwo',
    'owWwwWwwWwwWwo',
    '.oooooooooooo.',
  ] },
  elf: { x: 1, y: -8, pal: { e: '#4fae5a', E: '#3a8a48', w: '#ffd34d', W: '#e0a52a' }, rows: [
    '.........oo...',
    '........owwo..',
    '.......oeWwo..',
    '......oeeoo...',
    '.....oeeeeo...',
    '....oeeeeEEo..',
    '...oeeeeeeEEo.',
    '.owwwwwwwwwwwo',
    'owWwwWwwWwwWwo',
    '.oooooooooooo.',
  ] },
  antlers: { x: 2, y: -5, pal: { J: '#a06a3a', j: '#e8485a' }, rows: [
    'J.J......J.J',
    'JJJ.J..J.JJJ',
    '.JJJ....JJJ.',
    '..JJ....JJ..',
    '.ojjjjjjjjo.',
  ] },
};
const XM_HAT_KEYS = ['santa', 'antlers', 'elf', 'santa', 'antlers'];

// A villager's hat for Christmas, or null for their own: royals keep their
// crowns and a wizard his hat.
function christmasHat(lookKey, look) {
  if (!CHRISTMAS_ON || look.hat === 'crown' || look.hat === 'wizard') return null;
  let h = 7;
  for (const ch of lookKey) h = (h * 33 + ch.charCodeAt(0)) | 0;
  return XM_HATS[XM_HAT_KEYS[Math.abs(h) % XM_HAT_KEYS.length]];
}

// ---- Dressing a scene -------------------------------------------------------------

// Called on every scene as it is built (sceneFor in js/game.js).
function christmasDress(sc) {
  if (!CHRISTMAS_ON || sc.xmDone) return;
  sc.xmDone = true;
  sc.hwUsed = sc.hwUsed || []; // the tiles taken (hwPlace in js/halloween.js)
  if (sc.outdoor) xmOutdoors(sc);
  else xmIndoors(sc);
}

// One thing standing on a tile, saying `react` when tapped; a lit one
// glows (`glow`: how far down from its top).
function xmProp(sc, s, sprite, react, glow) {
  const p = tileCenter(sc, s.c, s.r);
  const x = Math.round(p.x - sprite.ax);
  const y = Math.round(p.y + 3 - sprite.ay);
  sc.objects.push({ c0: s.c, r0: s.r, c1: s.c, r1: s.r, canvas: sprite.canvas, x, y, w: sprite.canvas.width, h: sprite.canvas.height, react, christmas: true });
  if (glow !== undefined) sc.lamps.push({ x: p.x, y: y + glow, small: true, christmas: true });
}

// The small things along the roads: [bitmap, palette, what a tap says,
// where its glow is, how many for every 110 tiles].
const XM_SMALL = [
  [XM_TREE, XM_PAL, { word: 'tree', fx: 'xmtree' }, 1, 0.45],
  [XM_SNOWMAN, XM_PAL, { word: 'snowman', fx: 'snow' }, undefined, 0.3],
  [XM_GIFTS, XM_PAL, { word: 'present', fx: 'gift' }, undefined, 0.3],
  [XM_CANE, XM_PAL, { word: 'candy', fx: 'candy' }, undefined, 0.2],
  [XM_SLED, XM_PAL, { word: 'sled', fx: 'snow' }, undefined, 0.15],
  [XM_PENGUIN, XM_PAL, { word: 'penguin', fx: 'waddle' }, undefined, 0.15],
];
// The big ones, one in front of each house: [bitmap, palette, what a tap
// says, where its glow is, how many times bigger].
const XM_BIG = [
  [XM_TREE, XM_PAL, { word: 'tree', fx: 'xmtree' }, 1, 2],
  [XM_SNOWMAN, XM_PAL, { word: 'snowman', fx: 'snow' }, undefined, 2],
  [XM_REINDEER, XM_DEER_PAL, { word: 'reindeer', fx: 'deer' }, 7],
  [XM_GIFTS, XM_PAL, { word: 'present', fx: 'gift' }, undefined, 2],
  [XM_GINGER, XM_PAL, { word: 'gingerbread', fx: 'hop' }, undefined, 2],
  [XM_PENGUIN, XM_PAL, { word: 'penguin', fx: 'waddle' }, undefined, 2],
];

function xmOutdoors(sc) {
  const base = (sc.W * sc.D) / 110;
  xmHouses(sc);
  const spots = hwSpots(sc, () => true);
  for (const [rows, pal, react, glow, share] of XM_SMALL) {
    hwPlace(sc, spots, Math.max(1, Math.round(base * share)), 3, s => xmProp(sc, s, hwSprite(rows, pal), react, glow));
  }
  hwLights(sc, ['#ff4a5a', '#5fd06a', '#ffd34d', '#ffffff', '#6fb7ff'], { christmas: true }, '#2a5a3a');
  xmSnowGround(sc);
  xmSnowTops(sc);
  sc.xmFlakes = xmFlakes(70);
  sc.xmSleigh = { y: sc.height * (0.15 + 0.2 * hash(sc.W, sc.D, 2401)), phase: hash(sc.W, sc.D, 2402) * 30 };
}

// Every house (anything with a door) gets a big thing in its front garden,
// and lights, Santa or a star on its roof and a wreath on its wall.
function xmHouses(sc) {
  const houses = [...new Set(sc.doors.map(d => d.obj).filter(Boolean))];
  houses.forEach((o, i) => {
    const doors = sc.doors.filter(d => d.obj === o);
    const far = (c, r) => Math.min(...doors.map(d => Math.max(Math.abs(c - d.c), Math.abs(r - d.r))));
    const inFront = (c, r) => doors.some(d => Math.abs((c - r) - (d.c - d.r)) <= 1 && c + r > d.c + d.r);
    const spots = hwSpots(sc, (t, c, r) => far(c, r) >= 2 && far(c, r) <= 3 && !inFront(c, r), { tall: true, house: o })
      .sort((a, b) => far(a.c, a.r) - far(b.c, b.r) || a.k - b.k);
    const [rows, pal, react, glow, scale = 1] = XM_BIG[(i + Math.floor(hash(o.c0, o.r0, 2501) * XM_BIG.length)) % XM_BIG.length];
    hwPlace(sc, spots, 1, 2, s => xmProp(sc, s, hwSprite(rows, pal, true, scale), react, glow === undefined ? undefined : glow * scale));
    xmDecorate(sc, o, i);
  });
}

// Paints a house: lights down its roof's two edges, Santa's boots, a star
// or a bell on top and a wreath on the front wall (part of the house: a
// tap on them is a tap on the house). The snow comes later, with the rest.
function xmDecorate(sc, o, i) {
  if (!o.canvas || !o.alpha || o.xmDone) return;
  o.xmDone = true;
  const PAD = 12;
  const cv = makeCanvas(o.canvas.width, o.canvas.height + PAD);
  const ctx = cv.getContext('2d');
  ctx.drawImage(o.canvas, 0, PAD);
  Object.assign(o, { canvas: cv, y: o.y - PAD, h: o.h + PAD });
  const img = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < cv.width && y < cv.height && img[(y * cv.width + x) * 4 + 3] > 200;
  const fits = (rows, x, y) => rows.every((row, j) => [...row].every((ch, k) => ch === '.' || solid(x + k, y + j)));
  const put = (rows, pal, x, y) => drawBitmap(ctx, rows, pal, Math.round(x), Math.round(y));
  // The first row where the roof is at least 14 pixels wide.
  let top = null;
  let y0 = 0;
  for (let y = 0; y < cv.height && !top; y++) {
    let run = 0;
    for (let x = 0; x < cv.width; x++) {
      run = solid(x, y) ? run + 1 : 0;
      if (run >= 14) { top = { x: x - 6, y }; y0 = y; break; }
    }
  }
  if (!top) { o.alpha = ctx.getImageData(0, 0, cv.width, cv.height).data; return; }
  // Lights down the roof's two edges, red, green, gold and white.
  const BULB = ['#ff4a5a', '#5fd06a', '#ffd34d', '#ffffff'];
  const span = Math.min(48, Math.round((cv.height - y0) * 0.45));
  for (let y = y0 + 3, n = 0; y < y0 + span; y += 4, n++) {
    let left = 0;
    let right = -1;
    for (let x = 0, start = 0; x <= cv.width; x++) {
      if (x < cv.width && solid(x, y)) continue;
      if (x - start > right - left + 1) { left = start; right = x - 1; }
      start = x + 1;
    }
    if (right - left < 6) continue;
    for (const [x, side] of [[left + 1, 0], [right - 2, 1]]) {
      px(ctx, x, y - 1, 1, 1, '#2a5a3a');
      px(ctx, x, y, 2, 2, BULB[(n + side * 2) % BULB.length]);
      if (n % 2 === side) sc.lamps.push({ x: o.x + x + 1, y: o.y + y + 1, small: true, christmas: true });
    }
  }
  const pick = (i + Math.floor(hash(o.c0, o.r0, 2601) * 3)) % 3;
  if (pick === 0) put(XM_BOOTS, XM_PAL, top.x - 4, top.y - XM_BOOTS.length + 3);
  else if (pick === 1) {
    put(XM_STAR, XM_PAL, top.x - 3, top.y - XM_STAR.length + 1);
    sc.lamps.push({ x: o.x + top.x, y: o.y + top.y - 4, small: true, christmas: true });
  } else put(XM_BELL, XM_PAL, top.x - 3, top.y - XM_BELL.length + 2);
  // A wreath on the front wall, beside the door.
  const k = boxCorners(sc, o.c0, o.r0, o.c1 - o.c0 + 1, o.r1 - o.r0 + 1);
  const at = P => ({ x: P.x - o.x, y: P.y - o.y });
  const walls = [wall(at(k.L), at(k.B)), wall(at(k.B), at(k.R))];
  let done = false;
  walls.forEach(W => {
    for (const [u, v] of [[0.2, 26], [0.78, 26], [0.25, 20], [0.75, 20]]) {
      if (done) return;
      const p = wallPt(W, W.len * u, v);
      if (fits(XM_WREATH, p.x - 4, p.y - 4)) { put(XM_WREATH, XM_PAL, p.x - 4, p.y - 4); done = true; }
    }
  });
  o.alpha = ctx.getImageData(0, 0, cv.width, cv.height).data;
}

// Snow on the ground: the grass white, the roads and paths dusted and
// trodden, sparkles here and there (painted on the ground).
function xmSnowGround(sc) {
  const g = sc.ground.getContext('2d');
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) {
    const t = tileAt(sc, c, r);
    if (!t || t.type === 'water') continue;
    const o = tileOrigin(sc, c, r);
    const way = hwWay(t);
    const diamond = [{ x: o.x + 16, y: o.y }, { x: o.x + 32, y: o.y + 8 }, { x: o.x + 16, y: o.y + 16 }, { x: o.x, y: o.y + 8 }];
    g.globalAlpha = way ? 0.3 : 0.8;
    fillPoly(g, diamond, '#f4f8ff');
    g.globalAlpha = 1;
    // Drifts and sparkles.
    const n = way ? 1 : 4;
    for (let i = 0; i < n; i++) {
      const x = o.x + 6 + Math.round(hash(c, r, 2100 + i) * 20);
      const y = o.y + 4 + Math.round(hash(c, r, 2110 + i) * 8);
      if (hash(c, r, 2120 + i) < 0.5) px(g, x, y, 3, 1, '#ffffff');
      else px(g, x, y, 1, 1, '#dce8f8');
    }
  }
}

// Snow on the tops of things: houses, trees, fences and lamps get a white
// cap where their top edge faces the sky (copies of their pictures, so a
// picture shared with another scene stays as it is).
const xmCapped = new Map();
function xmSnowTops(sc) {
  for (const o of sc.objects) {
    if (!o.canvas || o.background || o.christmas || o.halloween || o.animated) continue;
    o.canvas = xmCap(o.canvas);
    if (o.alpha) o.alpha = o.canvas.getContext('2d').getImageData(0, 0, o.canvas.width, o.canvas.height).data;
  }
}
function xmCap(src) {
  if (xmCapped.has(src)) return xmCapped.get(src);
  const W = src.width;
  const H = src.height;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, W, H).data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && img[(y * W + x) * 4 + 3] > 200;
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      if (!solid(x, y)) continue;
      // The outline pixel stays; the snow sits just inside it, thicker on flat tops.
      const flat = solid(x - 1, y) && solid(x + 1, y);
      const deep = flat ? 2 + (hash(x, W, 2201) < 0.4 ? 1 : 0) : 1;
      for (let k = 1; k <= deep; k++) if (solid(x, y + k)) px(ctx, x, y + k, 1, 1, k === deep ? '#dce8f8' : '#ffffff');
      break;
    }
  }
  xmCapped.set(src, cv);
  return cv;
}

// Rooms: a garland along the top of the walls with baubles and a wreath in
// the corner, a little tree and a present by the walls.
function xmIndoors(sc) {
  const cave = sc.kind === 'dungeon' || sc.caveWalls;
  if (sc.wallH && !cave) xmWalls(sc, sc.wallH);
  const spots = hwSpots(sc, (t, c, r) => c <= 1 || r <= 1);
  hwPlace(sc, spots, 1, 3, s => xmProp(sc, s, hwSprite(XM_TREE, XM_PAL), { word: 'tree', fx: 'xmtree' }, 1));
  if (sc.W * sc.D >= 70) hwPlace(sc, spots, 1, 3, s => xmProp(sc, s, hwSprite(XM_GIFTS, XM_PAL), { word: 'present', fx: 'gift' }));
  if (cave) sc.xmFlakes = xmFlakes(25);
}

// A green garland swagged along the top of both back walls with red and
// gold baubles, and a wreath where they meet, behind everything.
function xmWalls(sc, H) {
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  const WA = wall(k.L, k.T);
  const WB = wall(k.T, k.R);
  const bounds = { x: k.L.x - 4, y: k.T.y - H - 8, w: k.R.x - k.L.x + 8, h: H + 8 + (k.R.y - k.T.y) };
  const obj = addObject(sc, { c: -1, r: -1, w: 1, d: 1 }, bounds, ctx => {
    const BAUBLE = ['#ff4a5a', '#ffd34d', '#6fb7ff'];
    for (const W of [WA, WB]) {
      const top = H - 16;
      const sag = x => Math.sin(((x % 36) / 36) * Math.PI) * 5;
      for (let x = 0; x < W.len; x++) {
        const p = wallPt(W, x, top - sag(x));
        px(ctx, Math.round(p.x), Math.round(p.y) - 1, 1, 3, x % 3 ? '#3f9f58' : '#2a6e40');
        if (x % 5 === 0) px(ctx, Math.round(p.x), Math.round(p.y) - 2, 1, 1, '#7ad870');
      }
      for (let x = 18, i = 0; x < W.len - 6; x += 36, i++) {
        const p = wallPt(W, x, top - sag(x));
        const col = BAUBLE[i % BAUBLE.length];
        px(ctx, Math.round(p.x) - 1, Math.round(p.y) + 2, 3, 3, col);
        px(ctx, Math.round(p.x) - 1, Math.round(p.y) + 2, 1, 1, '#ffffff');
      }
    }
    const corner = wallPt(WB, 0, H - 10);
    drawBitmap(ctx, XM_WREATH, XM_PAL, Math.round(corner.x - 4), Math.round(corner.y));
  }, { background: true, christmas: true });
  obj.c0 = -10; obj.r0 = -10; obj.c1 = -10; obj.r1 = -10;
}

// Snowflakes, as places on a tile of the screen that repeats.
function xmFlakes(n) {
  return Array.from({ length: n }, (x, i) => ({
    x: hash(i, 1, 2301), y: hash(i, 2, 2302), speed: 14 + 18 * hash(i, 3, 2303), sway: 4 + 8 * hash(i, 4, 2304),
    size: hash(i, 5, 2305) < 0.3 ? 2 : 1, phase: 6.28 * hash(i, 6, 2306),
  }));
}

// ---- Every frame ---------------------------------------------------------------------

// Drawn over the scene (drawScene in js/game.js, in world pixels): a soft
// winter evening outdoors, Santa's sleigh now and then, and falling snow.
function christmasDraw(ctx, sc, now, view) {
  if (!sc.xmDone) return;
  const t = now / 1000;
  if (sc.outdoor && sc.kind !== 'forest' && sc.kind !== 'monster') {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(40,70,150,0.08)';
    ctx.fillRect(0, 0, view.width, view.height);
    ctx.restore();
  }
  const s = xmSleighAt(sc, now);
  if (s) {
    const deer = hwSprite(XM_FLYING_DEER[Math.floor(t * 6) % 2], XM_DEER_PAL, false);
    const sleigh = hwSprite(XM_SLEIGH, XM_PAL, false);
    for (const dx of [26, 40]) ctx.drawImage(deer.canvas, Math.round(s.x + dx - deer.ax), Math.round(s.y - 4 - deer.ay + Math.sin(t * 6 + dx) * 1.5));
    // The reins.
    ctx.fillStyle = '#8a5a2a';
    for (let x = 10; x < 26; x++) ctx.fillRect(Math.round(s.x + x), Math.round(s.y - 9 + (x - 10) / 8), 1, 1);
    ctx.drawImage(sleigh.canvas, Math.round(s.x - sleigh.ax), Math.round(s.y - sleigh.ay));
  }
  if (sc.xmFlakes) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const W = view.width;
    const H = view.height;
    for (const f of sc.xmFlakes) {
      const y = (f.y * H + t * f.speed) % (H + 8) - 4;
      const x = ((f.x * W + Math.sin(t * 0.8 + f.phase) * f.sway) % W + W) % W;
      ctx.fillRect(Math.round(x), Math.round(y), f.size, f.size);
    }
    ctx.restore();
  }
}

// Where Santa's sleigh is now (in world pixels), or null when he isn't
// flying over: once every 28 seconds, for 14 of them, left to right.
function xmSleighAt(sc, now) {
  if (!sc.xmSleigh) return null;
  const t = now / 1000;
  const u = ((t + sc.xmSleigh.phase) % 28) / 14;
  if (u >= 1) return null;
  const m = sc.xmSleigh.touchFx && touchMove(sc.xmSleigh, now);
  return { x: -60 + u * (sc.width + 120), y: sc.xmSleigh.y + Math.sin(u * 10) * 5 - u * 40 + (m ? m.y : 0) };
}

// A tap on Santa's sleigh: "Ho, ho, ho! Merry Christmas!" and a burst of
// snow and stars. True when it took the tap.
function christmasTap(wx, wy) {
  const sc = state.scene;
  if (!sc.xmSleigh) return false;
  const now = performance.now();
  const s = xmSleighAt(sc, now);
  if (!s || Math.abs(wx - (s.x + 14)) > 34 || wy < s.y - 18 || wy > s.y + 4) return false;
  const thing = sc.xmSleigh;
  if (thing.touchedAt && now - thing.touchedAt < TOUCH_GAP) { touchNudge(thing); return true; }
  thing.touchedAt = now;
  touchReact({}, { fx: 'jingle' }, { x: s.x, y: s.y - 8 }, { x: s.x, y: s.y - 24 });
  Sound.say([{ text: line('christmasHo'), narrator: true }]);
  return true;
}

// ---- The little games (js/minigame.js, js/village-games.js) -------------------------

// Every game plays as before, with snow falling over its picture and snow
// along its ground. With Christmas off none of this is touched.
function xmDressGames() {
  for (const g of Object.values(MINI_GAMES)) {
    const own = g.draw.backdrop;
    const ground = g === MINI_GAMES.fish ? 34 : VG_GROUND - 2;
    g.draw.backdrop = (c, LW, LH, bx, by, t) => { own(c, LW, LH, bx, by, t); xmMiniSnow(c, LW, LH, by, t, ground); };
  }
}
if (CHRISTMAS_ON) xmDressGames();

function xmMiniSnow(g, LW, LH, by, t, ground) {
  // Snow drifts along the ground at the sides.
  for (let x = 0; x < LW; x += 2) {
    const h = 2 + Math.round(2 * (Math.sin(x * 0.11) + 1));
    px(g, x, by + ground - h + 2, 2, h, '#ffffff');
  }
  g.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 40; i++) {
    const y = (hash(i, 2, 2302) * LH + t * (10 + 14 * hash(i, 3, 2303))) % LH;
    const x = (hash(i, 1, 2301) * LW + Math.sin(t + i) * 4 + LW) % LW;
    g.fillRect(Math.round(x), Math.round(y), hash(i, 5, 2305) < 0.3 ? 2 : 1, hash(i, 5, 2305) < 0.3 ? 2 : 1);
  }
}
