// Halloween: every village dressed up for it, in both editions. In front of
// each house a big thing, as people dress up their gardens (a stack of
// jack-o'-lanterns, a skeleton, a witch at her cauldron, a coffin, a big
// ghost, a spider, a scarecrow, tombstones); on its roof a witch who flew
// into it, a cat, a spider or a lantern, and bats and a cobweb on its walls.
// Jack-o'-lanterns, tombstones, black cats, cauldrons, pumpkins, hay bales
// and candy pails line the roads (tap any of them and it says its word),
// little ghosts float about (tap one: "ghost!"), bats flap and a witch flies
// across the sky, strings of lights hang between the lamps, leaves and
// sweets lie on the ground, the villagers wear witch hats, pumpkin hats and
// cat ears, the rooms have a garland and a cobweb, and the music is spooky.
//
// It is only laid on top: the villages themselves (js/world.js and the
// other scene builders, js/data.js) are not changed. Each scene, once
// built, is dressed by halloweenDress (sceneFor in js/game.js); villagers'
// hats come from halloweenHat (villagerSprite in js/sprites.js); the ghosts,
// bats and lights are drawn by halloweenDraw (drawScene) and the ghosts
// tapped by halloweenTap (onPointer). With it off, none of them does
// anything and every village is just as it is the rest of the year.
//
// When: from HALLOWEEN_DAYS.from to .until every year (on this device's
// clock), unless the address said otherwise once on this device:
// ?halloween=0 turns it off for good (the villages as they are all year),
// ?halloween=1 shows it on any day, ?halloween=auto goes back to the dates.

const HALLOWEEN_DAYS = { from: [10, 1], until: [11, 7] }; // [month, day]
const HALLOWEEN_ON = (() => {
  let ask = null;
  try { ask = new URLSearchParams(location.search).get('halloween'); } catch (e) { /* no address */ }
  try {
    if (ask === '0' || ask === '1') localStorage.setItem('pixeltown-halloween', ask);
    else if (ask === 'auto') localStorage.removeItem('pixeltown-halloween');
    else ask = localStorage.getItem('pixeltown-halloween');
  } catch (e) { /* private mode: for this visit only */ }
  if (ask === '1' || ask === '0') return ask === '1';
  const d = new Date();
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  const at = ([m, day]) => m * 100 + day;
  return md >= at(HALLOWEEN_DAYS.from) && md <= at(HALLOWEEN_DAYS.until);
})();

// The narrator's hello as the game starts (LINES.halloween in js/data.js).
if (HALLOWEEN_ON && LINES.halloween) LINES.start = LINES.halloween;

// Spooky tunes for the season, in the same little band (js/music.js): the
// town, the other villages, the caves and the Monster Village, and rooms.
const HW_TUNES = {
  // The town: a creeping walk in D minor.
  spooky: {
    step: 0.3, bar: 8,
    chords: 'Dm Dm Gm A Dm Bb A Dm',
    melody: 'D5 - A4 - D5 - F5 - | E5 - D5 - A4 - - - | Bb4 - D5 - G5 - F5 - | E5 - C#5 - A4 - . . |' +
      'F5 - E5 - F5 - A5 - | G5 - F5 - D5 - Bb4 - | E5 - D5 - C#5 - E5 - | D5 - - - - - . .',
    arp: '0 . 2 . 1 . 2 .',
    bass: '0 - - - 2 - - -',
  },
  // The villages: a tiptoeing 6/8 in A minor.
  spookyWalk: {
    step: 0.27, bar: 6,
    chords: 'Am Am Dm E Am F E Am',
    melody: 'A4 - C5 E5 - C5 | A4 - - E4 - - | D5 - F5 A5 - F5 | G#5 - - E5 - - |' +
      'A5 - G5 E5 - C5 | F5 - E5 C5 - A4 | B4 - G#4 E4 - G#4 | A4 - - - - .',
    arp: '0 . 2 . 3 .',
    bass: '0 - - 2 - -',
  },
  // The caves and the Monster Village: slow, with a sliding sigh, in E minor.
  spookyCave: {
    step: 0.4, bar: 8, arpLift: 12,
    chords: 'Em Em C B Em Am B Em',
    melody: 'E5 - - - D#5 - - - | E5 - B4 - G4 - - - | C5 - - - B4 - A4 - | B4 - - - . . . . |' +
      'G5 - - - F#5 - E5 - | E5 - C5 - A4 - - - | B4 - D#5 - F#5 - - - | E5 - - - . . . .',
    arp: '. . 2 . . . 3 .',
    bass: '0 - - - - - - -',
  },
  // Rooms: a music-box waltz in A minor.
  spookyHome: {
    step: 0.32, bar: 6,
    chords: 'Am Dm E Am F Dm E Am',
    melody: 'E5 - A5 - C6 - | D5 - F5 - A5 - | G#5 - - - E5 - | A5 - - - - - |' +
      'C6 - B5 - A5 - | F5 - A5 - D5 - | E5 - G#5 - B5 - | A5 - - - - .',
    arp: '0 . 1 . 2 .',
    bass: '0 - - - - -',
  },
};
if (HALLOWEEN_ON) Object.assign(MUSIC_TUNES, HW_TUNES);
// Which of them each place plays instead of its own (musicPlaceOf).
const HALLOWEEN_MUSIC = HALLOWEEN_ON ? { town: 'spooky', forest: 'spookyWalk', fairy: 'spookyWalk', unicorn: 'spookyWalk', cave: 'spookyCave', home: 'spookyHome' } : {};

// Taps: a pumpkin hops in a shower of orange, a ghost says boo.
Object.assign(TOUCH_FX, {
  pumpkin: { move: 'hop', colors: ['#ff8a2a', '#ffd34d', '#ffb45a', '#ffffff'], star: true, tune: 'boing' },
  candy:   { move: 'hop', colors: ['#ff6fa8', '#5ad0e8', '#ffd34d', '#b58cff', '#ffffff'], star: true, tune: 'chime' },
  hay:     { move: 'shake', colors: ['#f0cf6a', '#d4aa44', '#ffe9a0'], fall: true },
  boo:     { move: 'hop', pop: '👻', colors: ['#ffffff', '#e8e0ff', '#d8f0ff'], tune: 'spooky' },
  cat:     { move: 'hop', pop: '🐾', tune: 'chime' },
  pot:     { move: 'none', colors: ['#6fe060', '#d8ff9a', '#c8ffb8', '#3fd04a'], up: true, tune: 'splash' },
  rattle:  { move: 'shake', colors: ['#ffffff', '#f6f2ea', '#c8c0d0'], tune: 'rattle' },
  witch:   { move: 'hop', colors: ['#6fe060', '#b77aff', '#ffd34d', '#ffffff'], star: true, tune: 'spooky' },
  coffin:  { move: 'shake', pop: '🦇', tune: 'spooky' },
  spider:  { move: 'shake', pop: '🕸️', tune: 'boing' },
});

// ---- Pictures ---------------------------------------------------------------

const HW_PAL = {
  o: '#6a3418', n: '#ff8a2a', N: '#e2661c', l: '#ffb45a', y: '#ffe680', Y: '#ffb020', e: '#4f8a3a', E: '#78b04a',
  h: '#f0cf6a', H: '#d4aa44', k: '#a87f2a', t: '#8a5a2a',
  s: '#c4c0d4', S: '#a29cb8', d: '#6e6888', m: '#6fb04a', M: '#4f8a3a', g: '#4a3a58',
  c: '#ff6fa8', C: '#5ad0e8', u: '#ffd34d', v: '#8a5ad0', w: '#ffffff',
};
const HW_GHOST_PAL = { o: '#a59cd0', w: '#ffffff', W: '#e6e0f8', g: '#4a3a58', p: '#ffb0c8' };
const HW_BAT_PAL = { b: '#3a2a50', B: '#5a4478', y: '#ffe680' };
const HW_CAT_PAL = { g: '#2e2238', y: '#d8ff5a', p: '#ff8ab0' };
const HW_POT_PAL = { g: '#2e2a3a', d: '#5a5470', E: '#6fe060', y: '#d8ff9a', w: '#c8ffb8' };
const HW_BONE_PAL = { o: '#3a2a48', w: '#f6f2ea', k: '#3a2a48' };
const HW_WITCH_PAL = Object.assign({}, HW_POT_PAL, { o: '#2e2238', v: '#6a3fa8', V: '#4f2c86', n: '#ff8a2a', r: '#ff6a3a', s: '#ffe0c8', k: '#2e2238', p: '#ffadbc', m: '#d0606a', t: '#8a5a2a', h: '#f0cf6a' });
const HW_COFFIN_PAL = { o: '#2e2238', h: '#8a5a44', H: '#6a4434', g: '#1e1628', y: '#ffe680' };
const HW_SPIDER_PAL = { w: 'rgba(255,255,255,0.8)', g: '#2e2238', y: '#ffffff', p: '#ff8ab0' };
const HW_SCARE_PAL = { e: '#4f8a3a', t: '#8a5a2a', o: '#6a3418', n: '#ff8a2a', N: '#e2661c', y: '#ffe680', d: '#d04a4a', r: '#ffd34d', c: '#5a7ad0', C: '#3f5ab0', h: '#f0cf6a', k: '#5a3a28' };
const HW_STONE_PAL = { g: '#4a3a58', s: '#c4c0d4', S: '#a29cb8', m: '#6fb04a', M: '#4f8a3a', w: '#f6f2ea', k: '#3a2a48' };
const HW_CRASH_PAL = { o: '#2e2238', k: '#3a2a48', v: '#6a3fa8', r: '#ff8a2a', t: '#8a5a2a' };
const HW_WEB_PAL = { w: 'rgba(255,255,255,0.85)' };

// A jack-o'-lantern: its eyes and grin glow from the candle inside.
const HW_JACK = [
  '.......et.......',
  '.......tt.......',
  '...oooottoooo...',
  '..onnNnnnnNnnno.',
  '.onnNnnnnnNnnnno',
  'onnNnynnnnynNnno',
  'onnNyyynnyyyNnno',
  'onnNnnnyynnnNnno',
  'onYnnnnnnnnnnYno',
  'onyyYyyyyyYyyyno',
  '.onyyYnyynYyyno.',
  '..onNnnnnnNnno..',
  '...oooooooooo...',
];
// A plain pumpkin, with a curly vine.
const HW_PUMPKIN = [
  '......ttE.....',
  '......t..EE...',
  '..oooottooo...',
  '.onnlNnnlNnno.',
  'onnlnNnnlnNnno',
  'onnlnNnnnnNnno',
  'onnnnNnnnnNnno',
  '.onnnNnnnnNno.',
  '..oooooooooo..',
];
// A hay bale with a little pumpkin on top.
const HW_HAY = [
  '......et..........',
  '....ooottoo.......',
  '...onnlnnNno......',
  '...onnnnnNno......',
  '.kkkkooooookkkkk..',
  'khhhhhhhhhhhhhhhk.',
  'khHhhhHhhhhHhhHhk.',
  'kttttttttttttttttk',
  'khhhHhhhhHhhhhHhk.',
  'khHhhhhHhhhhHhhhk.',
  'khhhhhhhhhhhhhhhk.',
  '.kkkkkkkkkkkkkkk..',
];
// A jack-o'-lantern pail full of sweets.
const HW_PAIL = [
  '..c.u.C.v.',
  '.ccuuCCvvc',
  '.otttttto.',
  'o.onnnno.o',
  'oonnNnnnoo',
  '.onynnyno.',
  '.onnnnnno.',
  '.onyyyyno.',
  '.onnnnnno.',
  '..oooooo..',
];
// A smiling tombstone with grass at its foot.
const HW_STONE = [
  '...gggggg...',
  '..gsssssSg..',
  '.gsssssssSg.',
  '.gssgssgsSg.',
  '.gssgssgsSg.',
  '.gsssssssSg.',
  '.gsgsssgsSg.',
  '.gssgggssSg.',
  '.gsssssssSg.',
  '.gsssssssSg.',
  'mMgggggggggm',
  'MmmMmmMmmMmM',
];
// A little ghost, its hem waving (two frames).
const HW_GHOST = [[
  '....oooo....',
  '..oowwwwoo..',
  '.owwwwwwwwo.',
  '.owwwwwwwwo.',
  'owwgwwwwgwwo',
  'owwgwwwwgwwo',
  'owpwwwwwwpwo',
  'owwwwggwwwwo',
  'owwwwwwwwwwo',
  'owWwwwwwwWwo',
  'owwWwwwwWwwo',
  'owoowwoowwoo',
  '.o..oo..oo..',
], [
  '....oooo....',
  '..oowwwwoo..',
  '.owwwwwwwwo.',
  '.owwwwwwwwo.',
  'owwgwwwwgwwo',
  'owwgwwwwgwwo',
  'owpwwwwwwpwo',
  'owwwwggwwwwo',
  'owwwwwwwwwwo',
  'owWwwwwwwWwo',
  'owwWwwwwWwwo',
  'oowwoowwoowo',
  '..oo..oo..o.',
]];
// A bat, wings up and wings down.
const HW_BAT = [[
  'B.........B',
  'BB.......BB',
  'bBB.b.b.BBb',
  '.bbbbbbbbb.',
  '..b.yby.b..',
  '....bbb....',
], [
  '....b.b....',
  '...bbbbb...',
  '.bbbybybbb.',
  'bBBbbbbbBBb',
  'BB.......BB',
  'B.........B',
]];

// A black cat sitting with its tail curled, eyes aglow.
const HW_CAT = [
  '.g...g......',
  '.gg.gg......',
  '.ggggg......',
  'gyggyg......',
  'gggggg......',
  '.gpgg.......',
  '.gggg....g..',
  '.ggggg....g.',
  'gggggg....g.',
  'gggggg...g..',
  'ggggggg.gg..',
  'gggggggggg..',
  '.gg..gg.....',
];
// A little cauldron, bubbling green.
const HW_POT = [
  '...w....E...',
  '.E..Ew.E..w.',
  '..EEEEEEEE..',
  '.gEEyEEEEEg.',
  'gggggggggggg',
  '.gdgggggggg.',
  'gdggggggggg.',
  'gdggggggggg.',
  '.gggggggggg.',
  '..gggggggg..',
  '..g......g..',
];

// ---- Big things for the front of a house ----------------------------------

// Two jack-o'-lanterns, one on the other.
const HW_BIG_JACK = [
  '...........tE...........',
  '...........t.EE.........',
  '.......oooottoooo.......',
  '......onnNnnnnNnno......',
  '.....onnNynnnnyNnno.....',
  '.....onnNyynnyyNnno.....',
  '.....onYnnnnnnnnYno.....',
  '.....onyYyyyyyyYyno.....',
  '......onnNyynyNnno......',
  '...oooooooooooooooooo...',
  '..onnnNnnnnnnnnnnNnnno..',
  '.onnnNnnnnnnnnnnnnNnnno.',
  'onnnNnnyynnnnnnyynnNnnno',
  'onnnNnyyyynnnnyyyynNnnno',
  'onnnNnnnnnnyynnnnnnNnnno',
  'onnnNnnnnnnnnnnnnnnNnnno',
  'onnYnnnnnnnnnnnnnnnnYnno',
  'onnyyYyyyyyyyyyyyyYyynno',
  'onnyyyYyyynnnyyyYyyyynno',
  '.onnnNyynnnnnnnnyyNnnno.',
  '..onnNnnnnnnnnnnnnNnno..',
  '...oooooooooooooooooo...',
];
// A friendly skeleton, waving.
const HW_SKELETON = [
  '....ooooo.......',
  '...owwwwwo......',
  '..owwwwwwwo...o.',
  '..owkkwkkwo..owo',
  '..owkkwkkwo..owo',
  '..owwwkwwwo..owo',
  '...owwwwwo..owo.',
  '...okwkwko..owo.',
  '....ooooo..owo..',
  '.....owo..owo...',
  '..ooowwwooow....',
  '.owowkwkwwoo....',
  '.owowwwwwo......',
  'owo.okwkwo......',
  'owo.owwwwo......',
  'owo..okwo.......',
  '.wo..owwo.......',
  '.....okwo.......',
  '....owwwwo......',
  '...owwoowwo.....',
  '...owo..owo.....',
  '...owo..owo.....',
  '...owo..owo.....',
  '...owo..owo.....',
  '..owwo..owwo....',
  '..oooo..oooo....',
];
// A witch stirring her cauldron.
const HW_WITCH = [
  '........oo................',
  '.......ovvo...............',
  '......ovvvo...............',
  '......ovvVvo..............',
  '.....ovvvVvo..............',
  '.....onnnnnno.............',
  '..oooovvvvvvoooo..........',
  '.oooooooooooooooo.........',
  '....orrsssssrro...........',
  '....orsksskssro...........',
  '....orsssssssro...........',
  '....orspsmspsro...........',
  '....orrsssssrro...........',
  '....orroooooorr...........',
  '....ovvvvvvvvo...t........',
  '...ovvvVvvvvvvsst.........',
  '...ovvvVvvvvvvo..t........',
  '..ovvvvVvvvvvo....t.......',
  '..ovvvvvVvvvvo....t.......',
  '..ovvvvvVvvvvvo..EtE..w...',
  '.ovvvvvvVvvvvvo.EEEEEEEE..',
  '.ovvvvvvvVvvvvo.gEEyEEEEg.',
  '.ovvvvvvvVvvvvvgggggggggggg',
  'ovvvvvvvvvVvvvvo.gdgggggggg',
  'ovvvvvvvvvVvvvvogdgggggggg.',
  'onnnnnnnnnnnnnno.gdggggggg.',
  '.oooooooooooooo..gggggggg..',
  '.....oko..oko.....g......g.',
];
// An upright coffin, its lid ajar and eyes peeping out.
const HW_COFFIN = [
  '.....ooooooo....',
  '....ohhhhhhho...',
  '...ohHHHHHHHho..',
  '..ohHHHHHHHHHho.',
  '.ohHHHHHHHHHHHho',
  '.ohHgHHHHHgHHHho',
  '.ohHggHgHggHHHgo',
  '.ohHgggggggHHgyo',
  '.ohHHgHgHgHHHggo',
  '.ohHHHHHHHHHHgyo',
  '..ohHHHHHHHHHggo',
  '..ohHHHHHHHHHggo',
  '..ohHHHHHHHHHggo',
  '..ohHHHHHHHHHggo',
  '...ohHHHHHHHHgo.',
  '...ohHHHHHHHHgo.',
  '...ohHHHHHHHHgo.',
  '...ohHHHHHHHHgo.',
  '....ohHHHHHHhgo.',
  '....ohHHHHHHhgo.',
  '.....ohhhhhhhoo.',
  '.....ooooooooo..',
];
// A big ghost on a pole, like the blown-up ones in gardens.
const HW_BIG_GHOST = [
  '......oooooo......',
  '....oowwwwwwoo....',
  '...owwwwwwwwwwo...',
  '..owwwwwwwwwwwwo..',
  '..owwwwwwwwwwwwo..',
  '.owwggwwwwwwggwwo.',
  '.owwggwwwwwwggwwo.',
  '.owwggwwwwwwggwwo.',
  '.owpwwwwwwwwwwpwo.',
  'owwwwwwggggwwwwwwo',
  'owwwwwwggggwwwwwwo',
  'owwwwwwwggwwwwwwwo',
  'owwwwwwwwwwwwwwwwo',
  'owWwwwwwwwwwwwwWwo',
  'owwWwwwwwwwwwwWwwo',
  'owwwWwwwwwwwwWwwwo',
  'owwwwwwwwwwwwwwwwo',
  'owwwwwwwwwwwwwwwwo',
  'owoowwwoowwwoowwoo',
  '.o..oww..ow..oo...',
  '.....oo...o.......',
];
// A big spider in its web.
const HW_SPIDER = [
  'w.......w.......w...',
  '.w......w......w....',
  '..w.....w.....w.....',
  '...wwwwwwwwwwwww....',
  '....w...gg...w......',
  'g..g.w.gggg.w.g..g..',
  '.g.g..gggggg..g.g...',
  '..ggggwgyygyggggg...',
  '.g.ggggyyyyyggg..g..',
  'g..g.ggggggggg.g..g.',
  '..g..ggggpggggg..g..',
  '.g...ggggggggg....g.',
  'g.....ggggggg......g',
  '.......ggggg........',
];
// A scarecrow with a pumpkin for a head.
const HW_SCARECROW = [
  '.......et.......',
  '.......tt.......',
  '....oooooooo....',
  '...onnNnnNnno...',
  '...onynnnnyno...',
  '...onnnyynnno...',
  '...onyyyyyyno...',
  '....oooooooo....',
  '.......tt.......',
  'hh.oddddddddo.hh',
  'hhoddrddrddddohh',
  'tttddddddddddttt',
  '...odrddddrdo...',
  '...oddddddddo...',
  '...ocCcCcCcCo...',
  '...occccccccco..',
  '...oCcCcCcCcCo..',
  '...occo..occo...',
  '....hh....hh....',
  '.......tt.......',
  '.......tt.......',
  '.......tt.......',
  '.......tt.......',
  '.......tt.......',
  '......kttk......',
];
// Two tombstones and a little skull.
const HW_GRAVES = [
  '...gggggg...............',
  '..gsssssSg.....gggg.....',
  '.gsssssssSg...gssssg....',
  '.gssgssgsSg..gssssSSg...',
  '.gssgssgsSg..gsgssgSg...',
  '.gsssssssSg..gssssSSg...',
  '.gsgsssgsSg..gsggggSg...',
  '.gssgggssSg..gssssSSg...',
  '.gsssssssSg..gssssSSg...',
  '.gsssssssSg..gssssSSg.ww',
  '.gsssssssSg..gssssSSgwkw',
  'mMgggggggggmMggggggggwww',
  'MmmMmmMmmMmMmmMmmMmmMmMm',
];

// ---- On the houses ----------------------------------------------------------

// A witch who flew into the roof: her legs, striped stockings, shoes and broom.
const HW_CRASH = [
  '..o..........o..',
  '.oko........oko.',
  'okko........okko',
  '.oko........oko.',
  '..ovo......ovo..',
  '..oro......oro..',
  '..ovo......ovo..',
  '...oro....oro...',
  '...ovo....ovo...',
  '....oro..oro..ttt',
  '....ovvvvvvo.tt..',
  '.....oooooo.tt...',
];
// A black cat on the ridge, back arched.
const HW_ROOF_CAT = [
  '..........g.g',
  '..........ggg',
  '.ggg.....gyggy',
  'g..gg...gggggg',
  '.g..ggggggggg.',
  '.....ggggggg..',
  '....gg.gg.gg..',
];
// A spider hanging from the eaves on its thread.
const HW_ROOF_SPIDER = [
  '....w....',
  '....w....',
  '....w....',
  '..g.w.g..',
  '.g.ggg.g.',
  'g.gyggyg.g',
  '.ggggggg.',
  'g.ggggg.g',
  '.g.....g.',
];
// A bat pinned on a wall.
const HW_WALL_BAT = [
  'b.........b',
  'bb..b.b..bb',
  'bbbbbbbbbbb',
  '.bbbbybybb.',
  '..b.bbb.b..',
];
// A cobweb in a corner.
const HW_WEB = [
  'wwwwwwwwwww',
  'w..w...w..w',
  'w.w.w.w.ww.',
  'ww...w..w..',
  'w.w..w.w...',
  'w..w.ww....',
  'w...ww.....',
  'w..w.......',
  'w.w........',
  'ww.........',
  'w..........',
];
// A witch on her broom, flying across the sky.
const HW_FLYING_WITCH = [
  '.....oo.............',
  '....ovvo............',
  '...ovvVvo...........',
  '..onnnnnno..........',
  'oooooooooooo........',
  '...orssssro.........',
  '...orskssro.........',
  '....ovvvvvo.........',
  '...ovvvvvvvsst......',
  'hhhttttttttttttttttt',
  'hhh.oo.oo...........',
];

// The villagers' hats for the night (drawn where their own hat goes).
const HW_HATS = {
  witch: { x: 1, y: -8, pal: { v: '#6a3fa8', V: '#8f62d0', n: '#ff8a2a' }, rows: [
    '.........oo...',
    '........ovo...',
    '.......ovvo...',
    '......ovVvo...',
    '.....ovvVvo...',
    '....ovvvVvvo..',
    '....onnnnnno..',
    '...ovvvvvvvvo.',
    '.ooovvvvvvvvoo',
    'oooooooooooooo',
  ] },
  blackwitch: { x: 1, y: -8, pal: { v: '#3a2a48', V: '#5a4a6a', n: '#ffb020' }, rows: [
    '..oo..........',
    '..ovo.........',
    '..ovvo........',
    '...ovVo.......',
    '...ovvVo......',
    '..ovvvVvo.....',
    '..onnnnnno....',
    '.ovvvvvvvvo...',
    'oovvvvvvvvvooo',
    'oooooooooooooo',
  ] },
  pumpkin: { x: 2, y: -6, pal: { n: '#ff8a2a', N: '#e2661c', e: '#4f8a3a' }, rows: [
    '.....ee.....',
    '....ee.e....',
    '..oooooooo..',
    '.onnNnnnNnno',
    'onnnNnnnNnnn',
    'onnnNnnnNnnn',
    'oooooooooooo',
  ] },
  cat: { x: 2, y: -3, pal: { j: '#3a2a48' }, rows: [
    '.o........o.',
    'ojo......ojo',
    'ojpo....opjo',
    'ojjo....ojjo',
  ] },
  bat: { x: 2, y: -4, pal: { j: '#3a2a48', J: '#5a4478', t: '#ffe680' }, rows: [
    'J..........J',
    'JJ...jj...JJ',
    'JJjjjtjtjjJJ',
    '.J..jjjj..J.',
  ] },
};
const HW_HAT_KEYS = ['witch', 'pumpkin', 'cat', 'blackwitch', 'bat'];

// A villager's hat tonight, or null for their own: royals keep their
// crowns and a wizard his hat.
function halloweenHat(lookKey, look) {
  if (!HALLOWEEN_ON || look.hat === 'crown' || look.hat === 'wizard') return null;
  let h = 0;
  for (const ch of lookKey) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return HW_HATS[HW_HAT_KEYS[Math.abs(h) % HW_HAT_KEYS.length]];
}

const hwSprites = new Map();
// A bitmap as a canvas, its bottom middle the anchor, with a soft shadow;
// `scale` 2 blows it up like the giant inflatables in front gardens.
function hwSprite(rows, pal, shadow = true, scale = 1) {
  const own = hwSprites.get(rows) || hwSprites.set(rows, new Map()).get(rows);
  const key = `${scale}|${shadow}`;
  if (own.has(key)) return own.get(key);
  const w = Math.max(...rows.map(r => r.length)) * scale;
  const h = rows.length * scale;
  const cv = makeCanvas(w + 4, h + 2 * scale);
  const ctx = cv.getContext('2d');
  if (shadow) {
    ctx.fillStyle = 'rgba(40,30,70,0.22)';
    ctx.beginPath();
    ctx.ellipse(cv.width / 2, h, w / 2, 2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (scale === 1) drawBitmap(ctx, rows, pal, 2, 0);
  else {
    const one = hwSprite(rows, pal, false);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(one.canvas, 2, 0, one.canvas.width - 4, rows.length, 2, 0, w, h);
  }
  const sprite = { canvas: cv, ax: cv.width / 2, ay: h };
  own.set(key, sprite);
  return sprite;
}

// ---- Where things go ------------------------------------------------------------

// Tiles that are a way to walk (roads, paths, the car village's roads and
// pavements, the dino village's dirt): things stand beside them.
const HW_WAYS = new Set(['road', 'plaza', 'path', 'rainbow', 'petals', 'dronetarmac', 'droneapron']);
const hwWay = t => !!t && (HW_WAYS.has(t.type) || !!t.car || !!t.dirt);
const hwFloor = t => !!t && !t.blocked && t.type !== 'water' && !t.mat && !t.rug;
const hwWet = (sc, c, r) => [-1, 0, 1].some(dr => [-1, 0, 1].some(dc => (tileAt(sc, c + dc, r + dr) || {}).type === 'water'));
// Doors, ways out and gate mats, which nothing may stand near.
const hwOuts = sc => [...sc.doors, ...(sc.links || []), ...(sc.exitTiles || (sc.exit ? [sc.exit] : [])),
  ...sc.tiles.flatMap((row, r) => row.map((t, c) => (t.mat || t.rug ? { c, r } : null))).filter(Boolean)];
const hwNear = (a, b, d) => Math.abs(a.c - b.c) <= d && Math.abs(a.r - b.r) <= d;

// How many tiles she can reach from `from`, by steps across.
function hwReach(sc, from) {
  const seen = new Uint8Array(sc.W * sc.D);
  const q = [from];
  seen[from.r * sc.W + from.c] = 1;
  let n = 0;
  while (q.length) {
    const { c, r } = q.pop();
    n++;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const t = tileAt(sc, c + dc, r + dr);
      const i = (r + dr) * sc.W + c + dc;
      if (t && !t.blocked && !seen[i]) { seen[i] = 1; q.push({ c: c + dc, r: r + dr }); }
    }
  }
  return n;
}

// The tiles where things may stand: on the floor beside the ways (never on
// a road or path), clear of the water, the villagers, doors, ways out and
// gate mats, other things and their fronts. `pick(t, c, r)` narrows them;
// they come nearest a way first (outdoors), else in a fixed jumble. A tall
// thing (`opt.tall`) keeps further from the villagers and the ways out, and
// may stand right by the house it is for (`opt.house`).
function hwSpots(sc, pick, opt = {}) {
  const outs = hwOuts(sc);
  const things = sc.objects.filter(o => !o.background && o.c0 >= 0 && o !== opt.house);
  const fronts = things.flatMap(o => o.front || []);
  const gap = opt.tall ? 1 : 0;
  const spots = [];
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) {
    const t = tileAt(sc, c, r);
    const at = { c, r };
    if (!hwFloor(t) || hwWay(t) || hwWet(sc, c, r) || !pick(t, c, r)) continue;
    if (sc.npcs.some(n => hwNear(n, at, (KID_MONSTERS[n.look] ? 3 : 2) + gap))) continue;
    if (outs.some(o => hwNear(o, at, o.obj && o.obj === opt.house ? 1 : 2)) || fronts.some(f => hwNear(f, at, 1))) continue;
    if (sc.start && hwNear(sc.start, at, 1 + gap)) continue;
    if (things.some(o => c >= o.c0 - 1 && c <= o.c1 + 1 && r >= o.r0 - 1 && r <= o.r1 + 1)) continue;
    let way = false;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (hwWay(tileAt(sc, c + dc, r + dr))) way = true;
    spots.push({ c, r, way, k: hash(c, r, 1031) });
  }
  return spots.sort((a, b) => (b.way - a.way) || a.k - b.k);
}

// Puts `sprite` on up to `n` of the spots, `apart` tiles from each other,
// never cutting off any part of the scene. Returns the tiles used.
function hwPlace(sc, spots, n, apart, make) {
  const outs = sc.exitTiles || (sc.exit ? [sc.exit] : []);
  const from = sc.start || outs[0] || (sc.links || [])[0] || sc.doors[0];
  if (!from || n <= 0) return [];
  let reach = hwReach(sc, from);
  const used = [];
  for (const s of spots) {
    if (used.length >= n) break;
    if (sc.hwUsed.some(u => hwNear(u, s, apart)) || tileAt(sc, s.c, s.r).blocked) continue;
    block(sc, s.c, s.r, 1, 1);
    const now = hwReach(sc, from);
    if (now !== reach - 1) { tileAt(sc, s.c, s.r).blocked = false; continue; }
    reach = now;
    used.push(s);
    sc.hwUsed.push(s);
    make(s);
  }
  return used;
}

// One thing standing on a tile, saying `react` when tapped; a lit one
// glows (`glow`: how far up its candle is).
function hwProp(sc, s, sprite, react, glow) {
  const p = tileCenter(sc, s.c, s.r);
  const x = Math.round(p.x - sprite.ax);
  const y = Math.round(p.y + 3 - sprite.ay);
  sc.objects.push({ c0: s.c, r0: s.r, c1: s.c, r1: s.r, canvas: sprite.canvas, x, y, w: sprite.canvas.width, h: sprite.canvas.height, react, halloween: true });
  if (glow !== undefined) sc.lamps.push({ x: p.x, y: y + glow, small: true, halloween: true });
}

// ---- Dressing a scene -------------------------------------------------------------

// Called on every scene as it is built (sceneFor in js/game.js).
function halloweenDress(sc) {
  if (!HALLOWEEN_ON || sc.hwUsed) return;
  sc.hwUsed = [];
  sc.hwGhosts = [];
  sc.hwBats = [];
  sc.hwLights = [];
  if (sc.outdoor) hwOutdoors(sc);
  else hwIndoors(sc);
}

// The small things along the roads: [bitmap, palette, what a tap says,
// where its glow is, how many for every 110 tiles].
const HW_SMALL = [
  [HW_JACK, HW_PAL, { word: 'pumpkin', fx: 'pumpkin' }, 7, 0.5],
  [HW_STONE, HW_STONE_PAL, { word: 'boo', fx: 'boo' }, undefined, 0.25],
  [HW_CAT, HW_CAT_PAL, { word: 'cat', fx: 'cat' }, undefined, 0.2],
  [HW_POT, HW_POT_PAL, { word: 'pot', fx: 'pot' }, 3, 0.2],
  [HW_PUMPKIN, HW_PAL, { word: 'pumpkin', fx: 'pumpkin' }, undefined, 0.2],
  [HW_HAY, HW_PAL, { word: 'hay', fx: 'hay' }, undefined, 0.2],
  [HW_PAIL, HW_PAL, { word: 'candy', fx: 'candy' }, 5, 0.2],
];
// The big ones, one in front of each house, as people dress up their gardens.
// [bitmap, palette, what a tap says, where its glow is, how many times
// bigger: the blown-up ones are twice the size, taller than the villagers].
const HW_BIG = [
  [HW_BIG_JACK, HW_PAL, { word: 'pumpkin', fx: 'pumpkin' }, 13, 2],
  [HW_SKELETON, HW_BONE_PAL, { word: 'skeleton', fx: 'rattle' }],
  [HW_WITCH, HW_WITCH_PAL, { word: 'witch', fx: 'witch' }, 21],
  [HW_COFFIN, HW_COFFIN_PAL, { word: 'coffin', fx: 'coffin' }],
  [HW_BIG_GHOST, HW_GHOST_PAL, { word: 'ghost', fx: 'boo' }, undefined, 2],
  [HW_SPIDER, HW_SPIDER_PAL, { word: 'spider', fx: 'spider' }, undefined, 2],
  [HW_SCARECROW, HW_SCARE_PAL, { word: 'scarecrow', fx: 'hay' }, 5],
  [HW_GRAVES, HW_STONE_PAL, { word: 'boo', fx: 'boo' }],
];

function hwOutdoors(sc) {
  const area = sc.W * sc.D;
  const base = area / 110;
  hwHouses(sc);
  const spots = hwSpots(sc, () => true);
  // More tombstones in the Monster Village, a little way off the roads.
  if (sc.kind === 'monster') hwPlace(sc, spots.filter(s => !s.way), 5, 2, s => hwProp(sc, s, hwSprite(HW_STONE, HW_STONE_PAL), { word: 'boo', fx: 'boo' }));
  for (const [rows, pal, react, glow, share] of HW_SMALL) {
    hwPlace(sc, spots, Math.max(1, Math.round(base * share)), 3, s => hwProp(sc, s, hwSprite(rows, pal), react, glow));
  }
  hwLeaves(sc);
  hwLights(sc);
  hwGhosts(sc, Math.max(3, Math.round(area / 300)));
  hwBats(sc, 8);
  sc.hwWitch = { y: sc.height * (0.2 + 0.2 * hash(sc.W, sc.D, 1401)), phase: hash(sc.W, sc.D, 1402) * 30 };
}

// Every house (anything with a door) gets a big thing in its front garden,
// and something on its roof and walls.
function hwHouses(sc) {
  const houses = [...new Set(sc.doors.map(d => d.obj).filter(Boolean))];
  houses.forEach((o, i) => {
    const doors = sc.doors.filter(d => d.obj === o);
    const far = (c, r) => Math.min(...doors.map(d => Math.max(Math.abs(c - d.c), Math.abs(r - d.r))));
    // Two or three steps from a door, not right in front of it.
    const inFront = (c, r) => doors.some(d => Math.abs((c - r) - (d.c - d.r)) <= 1 && c + r > d.c + d.r);
    const spots = hwSpots(sc, (t, c, r) => far(c, r) >= 2 && far(c, r) <= 3 && !inFront(c, r), { tall: true, house: o })
      .sort((a, b) => far(a.c, a.r) - far(b.c, b.r) || a.k - b.k);
    const [rows, pal, react, glow, scale = 1] = HW_BIG[(i + Math.floor(hash(o.c0, o.r0, 1501) * HW_BIG.length)) % HW_BIG.length];
    hwPlace(sc, spots, 1, 2, s => hwProp(sc, s, hwSprite(rows, pal, true, scale), react, glow === undefined ? undefined : glow * scale));
    hwDecorate(sc, o, i);
  });
}

// Paints a house's roof and walls: a witch who flew into the roof, a cat
// on the ridge, a spider or a jack-o'-lantern on top, bats on the walls
// and a cobweb in a corner. They become part of the house (a tap on them is
// a tap on the house). Only where the house is painted: nothing floats.
function hwDecorate(sc, o, i) {
  if (!o.canvas || !o.alpha || o.hwDone) return;
  o.hwDone = true;
  const PAD = 16;
  const cv = makeCanvas(o.canvas.width, o.canvas.height + PAD);
  const ctx = cv.getContext('2d');
  ctx.drawImage(o.canvas, 0, PAD);
  // The house as it was, kept (the checks compare it with the year-round one).
  o.hwPlain = { canvas: o.canvas, y: o.y, h: o.h };
  Object.assign(o, { canvas: cv, y: o.y - PAD, h: o.h + PAD });
  const img = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < cv.width && y < cv.height && img[(y * cv.width + x) * 4 + 3] > 200;
  const fits = (rows, x, y) => rows.every((row, j) => [...row].every((ch, k) => ch === '.' || solid(x + k, y + j)));
  const put = (rows, pal, x, y, flip) => drawBitmap(ctx, rows, pal, Math.round(x), Math.round(y), flip);
  // On top: the first row where the roof is at least 14 pixels wide (not a
  // windmill's sail nor a spire's tip).
  let top = null;
  for (let y = 0; y < cv.height && !top; y++) {
    let run = 0;
    for (let x = 0; x < cv.width; x++) {
      run = solid(x, y) ? run + 1 : 0;
      if (run >= 14) { top = { x: x - 6, y }; break; }
    }
  }
  // Lights draped down the roof's two edges from where it is wide, on the
  // widest stretch of each row (not a flag or a pole beside it), some glowing.
  let y0 = 0;
  for (let run = 0; y0 < cv.height; y0++) {
    run = 0;
    let best = 0;
    for (let x = 0; x < cv.width; x++) { run = solid(x, y0) ? run + 1 : 0; best = Math.max(best, run); }
    if (best >= 14) break;
  }
  const span = Math.min(48, Math.round((cv.height - y0) * 0.45));
  const BULB = ['#ff9a3a', '#b77aff', '#7affb0', '#ffd34d'];
  for (let y = y0 + 2, n = 0; y < y0 + span; y += 4, n++) {
    let left = 0;
    let right = -1;
    for (let x = 0, start = 0; x <= cv.width; x++) {
      if (x < cv.width && solid(x, y)) continue;
      if (x - start > right - left + 1) { left = start; right = x - 1; }
      start = x + 1;
    }
    if (right - left < 6) continue;
    for (const [x, side] of [[left + 1, 0], [right - 2, 1]]) {
      px(ctx, x, y - 1, 1, 1, '#4a3450');
      px(ctx, x, y, 2, 2, BULB[(n + side * 2) % BULB.length]);
      if (n % 2 === side) sc.lamps.push({ x: o.x + x + 1, y: o.y + y + 1, small: true, halloween: true });
    }
  }
  const pick = (i + Math.floor(hash(o.c0, o.r0, 1601) * 4)) % 4;
  if (top) {
    if (pick === 0) put(HW_CRASH, HW_CRASH_PAL, top.x - 8, top.y + 4 - HW_CRASH.length + 3);
    else if (pick === 1) put(HW_ROOF_CAT, HW_CAT_PAL, top.x - 7, top.y - HW_ROOF_CAT.length + 1);
    else if (pick === 2) put(HW_JACK, HW_PAL, top.x - 8, top.y - HW_JACK.length + 2);
    else put(HW_ROOF_SPIDER, HW_SPIDER_PAL, top.x + 2, top.y + 2);
  }
  // On the front walls, in the canvas: bats, and a cobweb by a corner.
  const k = boxCorners(sc, o.c0, o.r0, o.c1 - o.c0 + 1, o.r1 - o.r0 + 1);
  const at = P => ({ x: P.x - o.x, y: P.y - o.y });
  const walls = [wall(at(k.L), at(k.B)), wall(at(k.B), at(k.R))];
  let bats = 0;
  walls.forEach((W, w) => {
    for (const [u, v] of [[0.18, 20], [0.8, 26], [0.3, 30], [0.68, 16]]) {
      if (bats >= 3) break;
      const p = wallPt(W, W.len * u, v);
      if (Math.abs(u - 0.5) < 0.2 && w === 0) continue; // the door
      if (fits(HW_WALL_BAT, p.x - 5, p.y - 2) && hash(o.c0 + w, o.r0 + v, 1701) < 0.7) { put(HW_WALL_BAT, HW_BAT_PAL, p.x - 5, p.y - 2); bats++; }
    }
  });
  for (const v of [30, 24, 18]) {
    const p = wallPt(walls[0], 1, v);
    if (fits(HW_WEB, p.x, p.y)) { put(HW_WEB, HW_WEB_PAL, p.x, p.y); break; }
  }
  o.alpha = ctx.getImageData(0, 0, cv.width, cv.height).data;
}

// Rooms: a garland along the top of the walls, a cobweb in the corner, a
// lantern or two by the walls; caves get bats instead of the garland.
function hwIndoors(sc) {
  const cave = sc.kind === 'dungeon' || sc.caveWalls;
  if (sc.wallH) hwWalls(sc, sc.wallH, !cave);
  const spots = hwSpots(sc, (t, c, r) => c <= 1 || r <= 1);
  hwPlace(sc, spots, 1, 3, s => hwProp(sc, s, hwSprite(HW_JACK, HW_PAL), { word: 'pumpkin', fx: 'pumpkin' }, 7));
  // And a black cat or a cauldron in a bigger room.
  const [rows, pal, react, glow] = HW_SMALL[hash(sc.W, sc.D, 1801) < 0.5 ? 2 : 3];
  if (sc.W * sc.D >= 70) hwPlace(sc, spots, 1, 3, s => hwProp(sc, s, hwSprite(rows, pal), react, glow));
  if (cave) hwBats(sc, 3);
}

// Leaves and a few sweets on the ground (painted on it).
function hwLeaves(sc) {
  const g = sc.ground.getContext('2d');
  const LEAF = ['#e8762a', '#f0a030', '#c8502a', '#a85a2a', '#f5c040'];
  const SWEET = ['#ff6fa8', '#5ad0e8', '#ffd34d', '#b58cff'];
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) {
    const t = tileAt(sc, c, r);
    if (!t || t.type === 'water') continue;
    const o = tileCenter(sc, c, r);
    const way = hwWay(t);
    const n = hash(c, r, 401) < (way ? 0.12 : 0.22) ? 1 + Math.floor(hash(c, r, 402) * 3) : 0;
    for (let i = 0; i < n; i++) {
      const dx = Math.round((hash(c, r, 410 + i) - 0.5) * 20);
      const dy = Math.round((hash(c, r, 420 + i) - 0.5) * 8);
      const col = LEAF[Math.floor(hash(c, r, 430 + i) * LEAF.length)];
      px(g, o.x + dx, o.y + dy, 2, 1, col);
      px(g, o.x + dx + (hash(c, r, 440 + i) < 0.5 ? 1 : 0), o.y + dy + 1, 2, 1, shade(col, -30));
    }
    if (!way && !t.blocked && hash(c, r, 450) < 0.02) {
      const col = SWEET[Math.floor(hash(c, r, 451) * SWEET.length)];
      const x = o.x - 2;
      const y = o.y - 1;
      px(g, x, y, 1, 1, shade(col, 40));
      px(g, x + 1, y - 1, 3, 3, col);
      px(g, x + 2, y - 1, 1, 1, '#ffffff');
      px(g, x + 4, y, 1, 1, shade(col, 40));
    }
  }
}

// Strings of lights from each lamp post (a lamp or a torch on a pole) to
// the post nearest it (across the road), when that one is near enough.
function hwLights(sc) {
  const posts = sc.objects.filter(o => o.canvas && o.canvas.width === 12 && o.canvas.height === 34);
  const lamps = sc.lamps.filter(l => !l.small && !l.big && posts.some(o => Math.abs(l.x - (o.x + 6)) <= 1 && l.y >= o.y && l.y <= o.y + 16));
  const COLORS = ['#ff9a3a', '#b77aff', '#7affb0', '#ffd34d'];
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const pairs = new Set();
  lamps.forEach((a, i) => {
    let j = -1;
    lamps.forEach((b, k) => { if (k !== i && (j < 0 || dist(a, b) < dist(a, lamps[j]))) j = k; });
    if (j >= 0) pairs.add(i < j ? `${i},${j}` : `${j},${i}`);
  });
  const postOf = l => posts.find(o => Math.abs(l.x - (o.x + 6)) <= 1 && l.y >= o.y && l.y <= o.y + 16);
  for (const pair of pairs) {
    const [a, b] = pair.split(',').map(i => lamps[i]);
    const d = dist(a, b);
    if (d < 30 || d > 80) continue;
    const bulbs = [];
    const n = Math.round(d / 7);
    for (let k = 1; k < n; k++) {
      const u = k / n;
      const p = { x: a.x + (b.x - a.x) * u, y: a.y + 3 + (b.y - a.y) * u + Math.sin(u * Math.PI) * 6, col: COLORS[k % COLORS.length] };
      bulbs.push(p);
      if (k % 2) sc.lamps.push({ x: p.x, y: p.y, small: true, halloween: true });
    }
    // Drawn in its place among the things (behind a house in front of
    // it), as deep as the two posts; there is nothing on it to tap.
    const s = { a, b, bulbs };
    const [pa, pb] = [postOf(a), postOf(b)];
    sc.hwLights.push(s);
    sc.objects.push({ c0: Math.min(pa.c0, pb.c0), r0: Math.min(pa.r0, pb.r0), c1: Math.max(pa.c1, pb.c1), r1: Math.max(pa.r1, pb.r1),
      x: Math.min(a.x, b.x) - 2, y: Math.min(a.y, b.y) - 2, w: Math.abs(b.x - a.x) + 4, h: Math.abs(b.y - a.y) + 14,
      halloween: true, animated: (ctx, t) => hwDrawLights(ctx, s, t) });
  }
}

// One string: its wire and its bulbs, twinkling.
function hwDrawLights(ctx, s, t) {
  ctx.fillStyle = '#4a3450';
  const pts = [s.a, ...s.bulbs, s.b];
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const q = pts[i];
    const steps = Math.max(1, Math.round(Math.abs(q.x - p.x)));
    for (let k = 0; k < steps; k++) ctx.fillRect(Math.round(p.x + ((q.x - p.x) * k) / steps), Math.round(p.y + ((q.y - p.y) * k) / steps), 1, 1);
  }
  s.bulbs.forEach((b, i) => {
    ctx.fillStyle = Math.sin(t * 3 + i) > -0.6 ? b.col : shade(b.col, -70);
    ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y), 2, 2);
  });
}

// Ghosts float clear of the villagers, doors, ways out, signs, water and
// anything that does something when tapped (a tree behind one may be
// hidden), so a tap on one is never meant for something under it.
function hwGhosts(sc, n) {
  const outs = hwOuts(sc);
  const boxes = sc.objects.filter(o => !o.background && (o.kind || o.links || o.stairs || o.keeper || o.halloween || o.react || sc.doors.some(d => d.obj === o)));
  const free = (x, y) => !boxes.some(o => x + 10 > o.x && x - 10 < o.x + o.w && y + 10 > o.y && y - 10 < o.y + o.h)
    && !sc.signs.some(g => Math.abs(g.x - x) < 50 && Math.abs(g.y - y) < 24);
  const spots = [];
  for (let r = 1; r < sc.D - 1; r++) for (let c = 1; c < sc.W - 1; c++) {
    const at = { c, r };
    if (sc.npcs.some(v => hwNear(v, at, 4)) || outs.some(o => hwNear(o, at, 3))) continue;
    const p = tileCenter(sc, c, r);
    // What is under it on the screen, two tiles behind its own.
    if (free(p.x, p.y - 30) && !hwWet(sc, c, r) && !hwWet(sc, c - 2, r - 2)) spots.push({ c, r, k: hash(c, r, 1201) });
  }
  spots.sort((a, b) => a.k - b.k);
  for (const s of spots) {
    if (sc.hwGhosts.length >= n) break;
    if (sc.hwGhosts.some(g => hwNear(g, s, 6))) continue;
    const p = tileCenter(sc, s.c, s.r);
    sc.hwGhosts.push({ c: s.c, r: s.r, x: p.x, y: p.y - 30, phase: s.k * 6.28 });
  }
}

// Bats looping about over the scene.
function hwBats(sc, n) {
  for (let i = 0; i < n; i++) {
    sc.hwBats.push({
      cx: sc.width * (0.15 + 0.7 * hash(i, sc.W, 1301)), cy: sc.height * (0.15 + 0.6 * hash(i, sc.D, 1302)),
      rx: 40 + 60 * hash(i, 3, 1303), ry: 14 + 18 * hash(i, 4, 1304), speed: 0.35 + 0.3 * hash(i, 5, 1305), phase: 6.28 * hash(i, 6, 1306),
    });
  }
}

// A garland of orange, purple and black flags along the top of both back
// walls and a cobweb with its spider in the corner where they meet,
// painted behind everything like the walls. `flags`: the garland too.
function hwWalls(sc, H, flags) {
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  const WA = wall(k.L, k.T);
  const WB = wall(k.T, k.R);
  const bounds = { x: k.L.x - 4, y: k.T.y - H - 8, w: k.R.x - k.L.x + 8, h: H + 8 + (k.R.y - k.T.y) };
  const obj = addObject(sc, { c: -1, r: -1, w: 1, d: 1 }, bounds, ctx => {
    if (flags) {
      const FLAG = ['#ff8a2a', '#8a5ad0', '#3a2a48'];
      for (const W of [WA, WB]) {
        const top = H - 18;
        const sag = x => Math.sin(((x % 40) / 40) * Math.PI) * 4;
        for (let x = 0; x < W.len; x++) {
          const p = wallPt(W, x, top - sag(x));
          px(ctx, Math.round(p.x), Math.round(p.y), 1, 1, '#5a4060');
        }
        for (let x = 6, i = 0; x < W.len - 4; x += 10, i++) {
          const a = wallPt(W, x - 3, top - sag(x - 3));
          const b = wallPt(W, x + 3, top - sag(x + 3));
          const tip = wallPt(W, x, top - sag(x) - 7);
          fillPoly(ctx, [a, b, tip], FLAG[i % FLAG.length]);
        }
      }
    }
    // The cobweb: threads from the corner and rings across them.
    const corner = wallPt(WB, 0, H);
    const ends = [wallPt(WA, WA.len - 26, H), wallPt(WA, WA.len - 18, H - 14), { x: corner.x, y: corner.y + 24 }, wallPt(WB, 18, H - 14), wallPt(WB, 26, H)];
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const e of ends) { ctx.moveTo(corner.x + 0.5, corner.y + 0.5); ctx.lineTo(e.x + 0.5, e.y + 0.5); }
    for (const u of [0.35, 0.65, 0.95]) {
      ends.forEach((e, i) => {
        const p = { x: corner.x + (e.x - corner.x) * u, y: corner.y + (e.y - corner.y) * u };
        if (i) ctx.lineTo(p.x + 0.5, p.y + 0.5);
        else ctx.moveTo(p.x + 0.5, p.y + 0.5);
      });
    }
    ctx.stroke();
    // Its spider, hanging on a thread.
    const sx = Math.round(corner.x + 8);
    const sy = Math.round(corner.y + 20);
    px(ctx, sx, corner.y + 8, 1, sy - corner.y - 8, 'rgba(255,255,255,0.75)');
    px(ctx, sx - 2, sy, 5, 4, '#3a2a48');
    px(ctx, sx - 4, sy + 1, 9, 1, '#3a2a48');
    px(ctx, sx - 4, sy + 3, 9, 1, '#3a2a48');
    px(ctx, sx - 1, sy + 1, 1, 1, '#ffffff');
    px(ctx, sx + 1, sy + 1, 1, 1, '#ffffff');
  }, { background: true, halloween: true });
  obj.c0 = -10; obj.r0 = -10; obj.c1 = -10; obj.r1 = -10;
}

// ---- Every frame ---------------------------------------------------------------------

// Drawn over the scene (drawScene in js/game.js, in world pixels): a dusk
// outdoors, the ghosts and the bats (the lights are drawn with the things).
function halloweenDraw(ctx, sc, now, view) {
  if (!sc.hwUsed) return;
  const t = now / 1000;
  if (sc.outdoor && sc.kind !== 'forest' && sc.kind !== 'monster') {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(60,28,110,0.13)';
    ctx.fillRect(0, 0, view.width, view.height);
    ctx.restore();
  }
  for (const g of sc.hwGhosts) {
    const p = hwGhostAt(g, now);
    const sprite = hwSprite(HW_GHOST[Math.floor(t * 2 + g.phase) % 2], HW_GHOST_PAL, false);
    ctx.globalAlpha = 0.88;
    ctx.drawImage(sprite.canvas, Math.round(p.x - sprite.ax), Math.round(p.y - sprite.ay / 2));
    ctx.globalAlpha = 1;
  }
  // Now and then a witch flies across on her broom.
  if (sc.hwWitch) {
    const lap = 26;
    const u = ((t + sc.hwWitch.phase) % lap) / 16;
    if (u < 1) {
      const sprite = hwSprite(HW_FLYING_WITCH, HW_WITCH_PAL, false);
      const x = -40 + u * (sc.width + 80);
      const y = sc.hwWitch.y + Math.sin(u * 12) * 6 - u * 60;
      ctx.drawImage(sprite.canvas, Math.round(x - sprite.ax), Math.round(y - sprite.ay));
    }
  }
  for (const b of sc.hwBats) {
    const a = t * b.speed + b.phase;
    const x = b.cx + Math.cos(a) * b.rx;
    const y = b.cy + Math.sin(a * 2) * b.ry;
    const sprite = hwSprite(HW_BAT[Math.floor(t * 8 + b.phase) % 2], HW_BAT_PAL, false);
    ctx.drawImage(sprite.canvas, Math.round(x - sprite.ax), Math.round(y - sprite.ay));
  }
}

// Where a ghost is now: bobbing and swaying, and hopping when tapped.
function hwGhostAt(g, now) {
  const t = now / 1000;
  const m = g.touchFx && touchMove(g, now);
  return { x: g.x + Math.sin(t * 0.7 + g.phase) * 6 + (m ? m.x : 0), y: g.y + Math.sin(t * 1.9 + g.phase) * 3 + (m ? m.y : 0) };
}

// A tap on a ghost: "ghost!" with a 👻. True when it took the tap.
function halloweenTap(wx, wy) {
  const sc = state.scene;
  if (!sc.hwGhosts) return false;
  const now = performance.now();
  const g = sc.hwGhosts.find(x => { const p = hwGhostAt(x, now); return Math.abs(wx - p.x) < 9 && wy > p.y - 9 && wy < p.y + 9; });
  if (!g) return false;
  const p = hwGhostAt(g, now);
  touchReact(g, { word: 'ghost', fx: 'boo' }, { x: p.x, y: p.y }, { x: p.x, y: p.y - 18 });
  return true;
}

// ---- The little games (js/minigame.js, js/village-games.js) -------------------------

// Every game plays as before, in a Halloween look: a night sky over its own
// picture with a moon, bats, cobwebs in the corners and lanterns at the
// sides; ghost fish in the pond (the robot's crane lifts pumpkins), pumpkins
// to hop on instead of toadstools, bats carrying the fairies' letter
// bubbles, sweet-coloured chests, crystals and eggs, and names and pictures
// to match. With Halloween off none of this is touched.
const HW_GAMES = {
  fish: { label: () => (isCaptain() ? I18n.t('halloween.pumpkinCrane') : I18n.t('halloween.ghostFishing')), title: () => (isCaptain() ? I18n.t('halloween.pumpkinCrane') : I18n.t('halloween.ghostFishing2')), pip: () => (isCaptain() ? '🎃' : '👻'), bag: () => '🎃' },
};
const HW_SKINS = () => ({
  VG_FOREST: { name: I18n.t('halloween.pumpkinJump'), pip: '🎃', bag: '🍬', looks: ['#ff8a2a', '#b98cff', '#ffb347', '#f4ece0', '#8fd05a'], hop: hwHopPumpkin },
  VG_DINO: { name: I18n.t('halloween.halloweenDinosaurEggs'), bag: '🎃', looks: ['#ff8a2a', '#b98cff', '#8fd05a', '#ffd34d', '#f4ece0'] },
  VG_UNICORN: { name: I18n.t('halloween.halloweenUnicornRun'), bag: '🍬' },
  VG_CARS: { name: I18n.t('halloween.halloweenCarRace'), bag: '🎃' },
  VG_CHESTS: { name: I18n.t('halloween.candyBoxGame'), pip: '🍬', bag: '🎃', looks: ['#e8762a', '#7a4ab8', '#4a3a58', '#4a9a5a', '#c8502a'] },
  VG_CRYSTALS: { name: I18n.t('halloween.halloweenCrystalGame'), bag: '🎃', looks: ['#ff9a3a', '#b77aff', '#7affb0', '#ffd34d', '#ff6fa8'] },
  VG_FAIRY_SKIN: { name: I18n.t('halloween.batLetterGame'), pip: '🦇', badge: '🦇', bag: '🍬', color: '#7a4ab8', sparkle: '#ff9a3a', ink: '#4a2a6a', carrier: hwBatCarrier, tile: hwTileBubble(), frame: hwPumpkinFrame },
  VG_DRONE_SKIN: { name: I18n.t('halloween.halloweenDroneDelivery'), bag: '🎃' },
});
if (HALLOWEEN_ON) hwDressGames();

function hwDressGames() {
  for (const [key, own] of Object.entries(HW_GAMES)) if (MINI_GAMES[key]) Object.assign(MINI_GAMES[key], own);
  const skins = { VG_FOREST, VG_DINO, VG_UNICORN, VG_CARS, VG_CHESTS, VG_CRYSTALS, VG_FAIRY_SKIN, VG_DRONE_SKIN };
  for (const [name, own] of Object.entries(HW_SKINS())) Object.assign(skins[name], own);
  if (MINI_GAMES.fish) MINI_GAMES.fish.draw.item = hwFishItem;
  for (const g of Object.values(MINI_GAMES)) {
    const own = g.draw.backdrop;
    const ground = g === MINI_GAMES.fish ? 34 : VG_GROUND - 2;
    const sky = g === MINI_GAMES.fish ? 22 : VG_GROUND - 40;
    const cave = g.scene === 'dungeon';
    g.draw.backdrop = (c, LW, LH, bx, by, t) => { own(c, LW, LH, bx, by, t); hwMiniNight(c, LW, bx, by, t, ground, sky, cave); };
  }
}

// Over a game's own backdrop: dusk, a moon (not in a cave), bats, cobwebs
// and lanterns. `ground` is where things stand, `sky` how far down the sky
// goes (picture pixels, from the box's top).
function hwMiniNight(g, LW, bx, by, t, ground, sky, cave) {
  g.fillStyle = 'rgba(50,25,100,0.22)';
  g.fillRect(0, 0, LW, by + ground + 40);
  // The moon, with its glow.
  const mx = cave ? -100 : LW - 24;
  const my = Math.max(10, Math.min(16, by + sky / 2));
  g.fillStyle = 'rgba(255,240,180,0.22)';
  g.beginPath();
  g.arc(mx, my, 13, 0, Math.PI * 2);
  g.fill();
  for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) if (i * i + j * j <= 64) px(g, mx + i, my + j, 1, 1, (i + 3) ** 2 + (j - 2) ** 2 <= 5 || (i - 3) ** 2 + (j + 3) ** 2 <= 2 ? '#f0dc8a' : '#fff3b0');
  // Bats across the sky.
  for (let i = 0; i < 4; i++) {
    const x = ((t * (12 + i * 4) + i * 70) % (LW + 40)) - 20;
    const y = 6 + ((i * 9) % Math.max(8, by + sky - 14)) + Math.sin(t * 3 + i) * 2;
    const s = hwSprite(HW_BAT[Math.floor(t * 8 + i) % 2], HW_BAT_PAL, false);
    g.drawImage(s.canvas, Math.round(x), Math.round(y));
  }
  drawBitmap(g, HW_WEB, HW_WEB_PAL, 0, 0);
  drawBitmap(g, HW_WEB, HW_WEB_PAL, LW - HW_WEB[0].length, 0, true);
  // Lanterns at the sides, outside the box.
  const jack = hwSprite(HW_JACK, HW_PAL, false);
  for (const x of [bx - 22, bx - 46, bx + MINI_W + 8, bx + MINI_W + 32]) {
    if (x > -10 && x < LW - 6) g.drawImage(jack.canvas, Math.round(x), Math.round(by + ground - jack.ay));
  }
}

// The pond's fish as little ghosts (the robot's crane lifts pumpkins), each
// with its white patch for the picture where the fish's was.
function hwFishItem(g, it, t, now) {
  const p = miniItemAt(it, t);
  if (it.glow && it.state === 'live') {
    const col = Math.floor(now / 200) % 2 ? '#fff27a' : '#ffc21a';
    for (let a = 0; a < Math.PI * 2; a += 0.12) px(g, Math.round(p.x + Math.cos(a) * 19), Math.round(p.y + Math.sin(a) * 12), 1, 1, col);
  }
  if (isCaptain()) {
    g.drawImage(hwCratePumpkin(), p.x - 13, p.y - 12);
    return;
  }
  const s = hwGhostFish(Math.floor(t * 4 + it.ph) % 2);
  if (it.vx < 0) {
    g.save();
    g.translate(p.x + 16, p.y - 8);
    g.scale(-1, 1);
    g.drawImage(s, 0, 0);
    g.restore();
  } else g.drawImage(s, p.x - 16, p.y - 8);
}

// A ghost fish facing right: see-through white, a wavy tail, a white patch
// for its picture, an eye and a smile. Frame 1 flicks the tail.
const hwFishCache = [];
function hwGhostFish(frame) {
  if (hwFishCache[frame]) return hwFishCache[frame];
  const W = 33;
  const H = 17;
  const cy = 8.5;
  const kind = (x, y) => {
    const u = (x + 0.5 - 18) / 11.5;
    const v = (y + 0.5 - cy) / 6.8;
    if (u * u + v * v <= 1) return 'body';
    const tx = x + 0.5;
    const wave = Math.sin(tx * 1.2 + frame * 2) * 1.2;
    if (tx >= 1 && tx <= 8 && Math.abs(y + 0.5 - cy - wave) <= 1.2 + (8 - tx) * 0.7) return 'tail';
    return null;
  };
  const cv = makeCanvas(W, H);
  const g = cv.getContext('2d');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = kind(x, y);
    if (k) px(g, x, y, 1, 1, k === 'tail' ? 'rgba(232,226,255,0.85)' : y > cy + 2.5 ? '#e6e0f8' : 'rgba(250,248,255,0.95)');
    else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => kind(x + dx, y + dy))) px(g, x, y, 1, 1, '#9a90c8');
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (((x + 0.5 - 16) / 6.2) ** 2 + ((y + 0.5 - cy) / 5.6) ** 2 <= 1) px(g, x, y, 1, 1, '#ffffff');
  }
  px(g, 24, 5, 2, 2, '#2a2040');
  px(g, 27, 9, 2, 1, '#ff8ab0');
  px(g, 26, 11, 3, 1, '#3a2c50');
  hwFishCache[frame] = cv;
  return cv;
}

// The crane's pumpkin: orange, with a white label for its picture.
let hwCrate = null;
function hwCratePumpkin() {
  if (hwCrate) return hwCrate;
  hwCrate = vgSprite(26, 22, set => {
    vgOval(set, 13, 13, 12, 8.5, (x, y) => ((x === 6 || x === 19) ? '#e2661c' : y < 9 ? '#ffa040' : '#ff8a2a'));
    for (let y = 1; y <= 4; y++) set(13, y, '#4f8a3a');
    set(14, 2, '#78b04a');
    vgOval(set, 13, 13, 7, 5.5, '#ffffff');
  });
  return hwCrate;
}

// A pumpkin to hop on, the size of the toadstool, with a pale patch on top
// for the picture (`color`: orange, or a white, purple or green pumpkin).
function hwHopPumpkin(color, grey) {
  return vgCached(`hwpumpkin|${color}|${grey}`, () => vgSprite(42, 38, set => {
    vgOval(set, 21, 22, 19.5, 14.5, (x, y) => {
      const ridge = [8, 14, 21, 28, 34].some(r => Math.abs(x - r) < 0.6);
      return ridge ? shade(color, -30) : y > 30 ? shade(color, -22) : x < 10 ? shade(color, -12) : x > 32 ? shade(color, 14) : color;
    });
    for (let y = 2; y <= 8; y++) { set(20, y, '#5a7a3a'); set(21, y, '#4f8a3a'); }
    for (const [x, y] of [[22, 3], [23, 2], [24, 2], [25, 3]]) set(x, y, '#78b04a');
    vgOval(set, 21, 13, 8.5, 6.5, '#fff8ec');
  }, grey));
}

// A bat carrying a letter bubble on a thread.
function hwBatCarrier(g, x, y, it, now) {
  const s = hwSprite(HW_BAT[Math.floor(now / 140 + it.i) % 2], HW_BAT_PAL, false, 2);
  g.drawImage(s.canvas, Math.round(x - s.ax), Math.round(y - 30));
  px(g, Math.round(x), Math.round(y - 19), 1, 6, '#5a4478');
}

// The bubbles in Halloween colours.
function hwTileBubble() {
  const COLS = ['#ff9a3a', '#b77aff', '#7ad870', '#ffd34d', '#ff6fa8'];
  return (g, x, y, it, now) => vgBubble(g, x, y, it.state === 'out' && now - it.t0 < 420 ? '#c8c4d4' : COLS[it.i % COLS.length]);
}

// A jack-o'-lantern ring round the picture, its stem on top.
function hwPumpkinFrame(g, x, y) {
  vgStamp(g, 'hwframe', x, y, [39, 41, 19, 21], (c, x, y) => {
    for (let j = -16; j <= 16; j++) for (let i = -16; i <= 16; i++) {
      const d = i * i + j * j;
      if (d > 256) continue;
      px(c, x + i, y + j, 1, 1, d > 225 ? '#a8501a' : d > 169 ? ((Math.abs(i) % 6 < 1) ? '#e2661c' : '#ff8a2a') : d > 150 ? '#e2661c' : '#ffffff');
    }
    px(c, x - 1, y - 20, 3, 5, '#4f8a3a');
    px(c, x + 2, y - 20, 3, 2, '#78b04a');
  });
}
