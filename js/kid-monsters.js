// Her own monsters: the little monsters the child drew herself. The first
// five live on the Monster Tower's ground floor; the ones she drew after on
// its second floor and out in the Monster Village round it
// (js/monster-village.js).
// Any villager with one of these looks is one of them, in either edition:
// drawCharacter (js/game.js) draws it with drawKidMonster, its ♪ goes a
// little higher (kidBubbleLift, from drawOverlay), and its dialog shows her
// drawing in a little photo frame where the portrait goes (kidDrawingShow,
// from openDialog and closeDialog).
// - KID_MONSTERS: each one's Korean name, her drawing (img/monsters, made
//   from a photo by tools/kid-drawings.py), the caption under it, and its
//   pixel art. The art is string rows with a palette letter per pixel and
//   `.` empty, like MONSTERS in js/sprites.js. An outline in her ink goes
//   round every coloured part; `o` pixels are that ink too, for stick arms
//   and legs, brows and mouths. The ink is her dark teal marker unless the
//   art has its own (`ink`: the pencil or crayon she drew it with). `k` are
//   the eyes, which shut when it blinks (blinkRows in js/cave-magic.js), or
//   as `shut` draws them over the rows (a space keeps the pixel), and `wave`
//   swaps a few rows for an arm (or the wings, or a tail) up. A long one
//   standing on legs at one end has `head`, the column its ♪ goes over.
// - A tap anywhere on one talks to it (kidTapBox), however long it is.
// - While they wait they bob, blink and now and then wave; one calling her
//   over hops (guideBob in js/guide.js). They are never drawn mirrored, so
//   a hat leans the way she drew it.
//
// The top level only touches data.js tables (tools/tts-phrases.js loads
// this file in node); everything that draws or finds the page's parts
// lives inside functions.

const KID_MONSTERS = {
  // A grumpy little one with a tall pointy hat leaning to one side, angry
  // brows, a straight mouth and a narrow dress.
  kidmon1: {
    name: '뾰족모자 몬스터',
    drawing: 'img/monsters/kidmon1.jpg',
    by: '직접 그린 몬스터',
    pal: { b: '#c9b4ff', B: '#e6dcff', d: '#a68ee8', h: '#a98cf2', H: '#cdb8ff' },
    rows: [
      '.............h......',
      '.............h......',
      '............hh......',
      '............hh......',
      '...........Hhh......',
      '...........Hhh......',
      '..........Hhhh......',
      '..........Hhhh......',
      '.........Hhhhh......',
      '.........ooooo......',
      '........BBbbbbb.....',
      '......BBbbbbbbbb....',
      '.....Bboobbbbboob...',
      '.....bbbbobbbobbbb..',
      '....bbbbkbbbbbkbbbb.',
      '....bbbbkkbbbkkbbd..',
      '....bbbpbbbbbbbpd...',
      '.....bbbbooooobd....',
      '......bbbbbbbbd.....',
      '........bbbbdd......',
      '....................',
      '..........bbb.......',
      '..........bbb.......',
      '..oooo....bbb.......',
      '......ooo.Bbbb......',
      '.........Bbbbb.ooo..',
      '.........Bbbbbb...oo',
      '........Bbbbbbbb....',
      '........Bbbbbbbbb...',
      '.......Bbbbbbbbbbd..',
      '......Bbbbbbbbbbbdd.',
      '....................',
      '.........o..o.......',
      '.........o..o.......',
      '.........o..o.......',
      '.........o..o.......',
      '........oo..oo......',
    ],
    wave: {
      21: '..........bbb.....o.',
      22: '..........bbb....o..',
      23: '..oooo....bbb...o...',
      24: '......ooo.Bbbb.o....',
      25: '.........Bbbbb......',
      26: '.........Bbbbbb.....',
    },
  },
  // A happy one with two big pointy ears, raised brows, a smile and a round
  // balloon of a body.
  kidmon2: {
    name: '방긋 여우귀 몬스터',
    drawing: 'img/monsters/kidmon2.jpg',
    by: '직접 그린 몬스터',
    pal: { b: '#ffc79e', B: '#ffe2cc', d: '#f0a070', e: '#ff9ec4' },
    rows: [
      '.b..................b.',
      '.bb................bb.',
      '.beb..............beb.',
      '.bebb............bbeb.',
      '..beb............beb..',
      '..beeb..........beeb..',
      '..beebb........bbeeb..',
      '..bbeebbbbbbbbbbeebb..',
      '...BBbbbbbbbbbbbbb....',
      '...Bboooobbboooobb....',
      '...Bbbbbbbbbbbbbbbb...',
      '....bbwkbbbbbwkbbb....',
      '....bbkkbbbbbkkbbb....',
      '....bbkkbbbbbkkbbd....',
      '.....pbbbbbbbobpdd....',
      '......bbbobbobbbd.....',
      '.......bbboobbbdd.....',
      '........bbbbbbdd......',
      '.........bbbbbdd......',
      '..........bbbdd.......',
      '...........bbd........',
      '......................',
      '............bb........',
      'o.........BBbbbb.....o',
      '.oooooo.Bbbbbbbbbb.oo.',
      '.......Bbbbbbbbbbbb...',
      '.......Bbbbbbbbbbbd...',
      '......Bbbbbbbbbbbbbd..',
      '......bbbbbbbbbbbbdd..',
      '.......bbbbbbbbbbdd...',
      '........bbbbbbbbdd....',
      '..........bbbbdd......',
      '......................',
      '...........o..o.......',
      '...........o..o.......',
      '...........o..o.......',
      '..........oo..oo......',
    ],
    wave: {
      20: '...........bbd.......o',
      21: '.....................o',
      22: '............bb......o.',
      23: 'o.........BBbbbb...o..',
      24: '.oooooo.Bbbbbbbbbb....',
    },
  },
  // A grumpy cat with frowning brows and an X for a mouth, in a striped
  // jacket, arms straight out.
  kidmon3: {
    name: '줄무늬 고양이 몬스터',
    drawing: 'img/monsters/kidmon3.jpg',
    by: '직접 그린 몬스터',
    pal: { b: '#a8d8ff', B: '#d4ecff', d: '#7fb4e8', s: '#4f86c0' },
    rows: [
      '....b.........b......',
      '....bb.......bb......',
      '....bbb.....bbb......',
      '....Bbbbbbbbbbbb.....',
      '....Bbbbbbbbbbbbb....',
      '....Bboobbbbbboobb...',
      '....BbbbobbbbobbbbB..',
      '....BbbbkbbbbkbbbbB..',
      '....bbbbkbbbbkbbbbd..',
      '....bbpbbobbobbpbd...',
      '....bbbbbbobbbbbbd...',
      '....bbbbbobbobbbd....',
      '.....bbbbbbbbbbdd....',
      '......bbbbbbbbdd.....',
      '.....................',
      '.....BbsbbsbbsbB.....',
      '.....BbsbbsbbsbB....o',
      'ooooobbsbbsbbsbbooooo',
      '.....BbsbbsbbsbB.....',
      '.....BbsbbsbbsbB.....',
      '.....bbsbbsbbsbd.....',
      '.....bbsbbsbbsbd.....',
      '.....bbsbbsbbsbd.....',
      '.....bbsbbsbbsbd.....',
      '.....................',
      '.......o.....o.......',
      '.......o.....o.......',
      '.......o.....o.......',
      '.......o.....o.......',
      '.......o.....o.......',
      '.......o.....o.......',
      '......oo.....o.......',
      '.............o.......',
      '.............oo......',
    ],
    wave: {
      13: '......bbbbbbbbdd....o',
      14: '...................o.',
      15: '.....BbsbbsbbsbB..o..',
      16: '.....BbsbbsbbsbB.o...',
      17: 'ooooobbsbbsbbsbb.....',
    },
  },
  // One very tall spire, a little triangle face with tiny eyes, a big
  // triangle body with a wing each side (the left one has a little hole in
  // it, like the paper) and long thin legs. Its wave is a flap.
  kidmon4: {
    name: '뾰족탑 날개 몬스터',
    drawing: 'img/monsters/kidmon4.jpg',
    by: '직접 그린 몬스터',
    pal: { b: '#ffe680', B: '#fff4c0', d: '#f0c850', h: '#ffd36a', H: '#fff0b0', v: '#e4d4ff' },
    rows: [
      '...........h...........',
      '...........Hh..........',
      '...........Hh..........',
      '...........Hh..........',
      '...........Hh..........',
      '...........Hh..........',
      '...........Hh..........',
      '...........Hh..........',
      '...........Hh..........',
      '...........Hh..........',
      '...........Hh..........',
      '...........Hh..........',
      '...........Hh..........',
      '.......................',
      '...........bb..........',
      '..........bbbb.........',
      '..........bbbb.........',
      '.........bkbbkb........',
      '.........oooooo........',
      '.v......Bbbbbbbb.......',
      '.vv.....Bbbbbbbb..vv...',
      '.vvkv..Bbbbbbbbbd.vvvv.',
      '.vvv...Bbbbbbbbbd.vvvvv',
      '.v....Bbbbbbbbbbbd.....',
      '.....Bbbbbbbbbbbbbd....',
      '.....Bbbbbbbbbbbbbd....',
      '....Bbbbbbbbbbbbbbbd...',
      '....bbbbbbbbbbbbbbbd...',
      '...bbbbbbbbbbbbbbbbbd..',
      '.......................',
      '.........o...o.........',
      '.........o...o.........',
      '.........o...o.........',
      '........o.....o........',
      '........o.....o........',
      '........o.....o........',
      '.......oo.....oo.......',
    ],
    wave: {
      17: '.v.......bkbbkb........',
      18: '.vv......oooooo........',
      19: '.vvv....Bbbbbbbb.....v.',
      20: '.vkvv...Bbbbbbbb...vvv.',
      21: '..vvv..Bbbbbbbbbd.vvvv.',
      22: '.......Bbbbbbbbbd.vv...',
      23: '......Bbbbbbbbbbbd.....',
    },
  },
  // A frowning bunny with three tall ears and a leaf of an ear at the side,
  // holding a magic loop.
  kidmon5: {
    name: '요술고리 토끼 몬스터',
    drawing: 'img/monsters/kidmon5.jpg',
    by: '직접 그린 몬스터',
    pal: { b: '#ffb6d6', B: '#ffdcec', d: '#f08cba', e: '#ff8cc0', c: '#fff6c8' },
    rows: [
      '.bb.....b......bb.....',
      '.be.....bb.....eb.....',
      '..be....be....eb......',
      '..be....be...eb.......',
      '...be...be...eb.......',
      '...be...be..eb........',
      '....be..be..eb........',
      '....be..be.eb.........',
      '.....be.be.eb.........',
      '.....bebbbeb..........',
      '......bbbbbb..........',
      '.....BBbbbbbb.....b...',
      '....BBbbbbbbbb...bb...',
      '....Boobbbboob...bbb..',
      '....bbbobbobbb...bbb..',
      '....bbkbbbbkbb...bbb..',
      '....bbkkbbkkbd...bbb..',
      '....bpbbbbbbpd....bb..',
      '.oo..bbboobbd.....b...',
      'occo..bbbbdd..........',
      'occo..................',
      '.oo...bbbbbbb.........',
      '..o..Bbbbbbbbb......o.',
      '..o..Bbbbbbbbbd...oo..',
      'ooooobbbbbbbbbd.ooo...',
      '.....bbbbbbbbbd.......',
      '......bbbbbbbd........',
      '......................',
      '.......o...o..........',
      '.......o...o..........',
      '.......o...o..........',
      '......oo...oo.........',
    ],
    wave: {
      19: 'occo..bbbbdd.........o',
      20: 'occo................o.',
      21: '.oo...bbbbbbb......o..',
      22: '..o..Bbbbbbbbb....o...',
      23: '..o..Bbbbbbbbbd.oo....',
      24: 'ooooobbbbbbbbbd.......',
    },
  },
  // Three eyes on a square head under two pink horns, round ears, and a
  // second face on its tummy: one more eye and a big mouth with fangs and a
  // tongue. Four little legs. Her pencil was brown (`ink`).
  kidmon6: {
    name: '배에 입 달린 몬스터',
    drawing: 'img/monsters/kidmon6.jpg',
    by: '직접 그린 몬스터',
    ink: '#8a4e2e',
    pal: { b: '#ffe1c2', B: '#fff1e2', d: '#f2c69c', h: '#e0407a', H: '#ff86b0', m: '#7a2a3a', t: '#ff8aa8' },
    rows: [
      '.....H..........h.....',
      '.....Hh........hh.....',
      '.....Hhh......hhh.....',
      '.....Hhhh....hhhh.....',
      '.....BBBbbbbbbbbb.....',
      '.....Bbbbbwkbbbbb.....',
      '.....Bbbbbkkbbbbb.....',
      '....bBoobbbbbboobb....',
      '...bbBbkbbbbbbkbbbb...',
      '...bbBbkbbbbbbkbbbb...',
      '....bbbbbobbbbbbbb....',
      '.....bbbbobbbbbbbd....',
      '.....bbbbbobbbbbbd....',
      '.....bbbbbbbbbbbbd....',
      '.....bbbbbbbbbbbdd....',
      '.....dbbbbbbbbbddd....',
      '.........Bbbd.........',
      '.bbooooooBbbdooooobb..',
      '.bb......Bbbd.....bb..',
      '........BBbbbd........',
      '.......Bbbbbbbd.......',
      '......Bbbbwkbbbd......',
      '......Bbbbkkbbbbd.....',
      '.....Bbbbbbbbbbbd.....',
      '.....bbmmmmmmmbbd.....',
      '.....bbwmmmmmwbbd.....',
      '.....bbmttmmmmbdd.....',
      '......bbmmmmmbbd......',
      '.......bbbbbbbd.......',
      '........bbbbdd........',
      '......o..o..o..o......',
      '.....o...o..o...o.....',
      '....o....o..o....o....',
      '...bb...bb..bb...bb...',
    ],
    wave: {
      15: '.....dbbbbbbbbbddd..bb',
      16: '.........Bbbd....ooobb',
      17: '.bbooooooBbbdoooo.....',
      18: '.bb......Bbbd.........',
    },
  },
  // One big eye under a green horn, hairs sticking up, two pink fangs, a
  // swirl on its round tummy and four arms with mitten hands. Its eye
  // shuts as a line (`shut`).
  kidmon7: {
    name: '외눈 초록뿔 몬스터',
    drawing: 'img/monsters/kidmon7.jpg',
    by: '직접 그린 몬스터',
    ink: '#2c2c3a',
    pal: { b: '#d6e6ff', B: '#eef5ff', d: '#aec8f0', g: '#5cb84a', G: '#9be07a', f: '#e0508a', s: '#c0703a' },
    rows: [
      '...........g............',
      '...........Gg...........',
      '...........Gg...........',
      '......o...Ggg....o......',
      '...o...o..Gggg..o...o...',
      '....o..o..Gggg..o..o....',
      '.....o..oGgggggo..o.....',
      '.........oooooo.........',
      '........BBbbbbbb........',
      '.......Bbbbbbbbbb.......',
      '......Bbbboooobbbb......',
      '......Bbbowwwwobbd......',
      '......Bbbowkkwobbd......',
      '......Bbbowkkwobbd......',
      '......bbbboooobbbd......',
      '......bbbbbbbbbbbd......',
      '.......boooooooodd......',
      'b.b.....bfbbbbfd.....b.b',
      'bbb......f....f......bbb',
      'bbb......BBbbbb......bbb',
      '.o.....Bbbbbbbbbd...o...',
      '...o..Bbbbbbbbbbbd.o....',
      '....oBbbbbbsbbbbbbo.....',
      '.....Bbbbbsbbbbbbbd.....',
      '.....Bbbbbsssbbbbbd..bb.',
      '.....Bbbbbsbbsbbbbdoobbb',
      '....obbbbbbssbbbbbdoobbb',
      '...o..bbbbbbbbbbdd...bb.',
      '..o....bbbbbbbbdd.......',
      'bbb......bbbbdd.........',
      'bbb.....bb....bb........',
      'b.b.....bb....bb........',
      '.....bbbbb....bbbbb.....',
      '.....bbbbb....bbbbb.....',
      '........................',
    ],
    shut: {
      10: '      Bbbbbbbbbbbb      ',
      11: '      Bbbbbbbbbbbd      ',
      12: '      Bbbooooobbbd      ',
      13: '      Bbbbbbbbbbbd      ',
      14: '      bbbbbbbbbbbd      ',
    },
    wave: {
      14: '......bbbboooobbbd...b.b',
      15: '......bbbbbbbbbbbd...bbb',
      16: '.......boooooooodd...bbb',
      17: 'b.b.....bfbbbbfd......o.',
      18: 'bbb......f....f......o..',
      19: 'bbb......BBbbbb.....o...',
    },
  },
  // A caterpillar: an angry head with red eyes, a curly feeler and a huge
  // mouth full of teeth, then round body parts, purple feet and a purple
  // spike on its tail, which flicks up when it waves. Its ♪ goes over its
  // head (`head`).
  kidmon8: {
    name: '이빨 애벌레 몬스터',
    drawing: 'img/monsters/kidmon8.jpg',
    by: '직접 그린 몬스터',
    ink: '#2c2c3a',
    pal: { b: '#c4ecaa', B: '#e2fbd2', d: '#98d07e', m: '#6a2a3a', f: '#b07ae0', k: '#c8283c' },
    head: 7,
    rows: [
      '.........oo...................',
      '........oo.o..................',
      '.......o..o...................',
      '.......o......................',
      '..oo.BBbbb.oo.................',
      '....oobbboo...................',
      '...Bkwbbbbkw..................',
      '..BBkbbbbbkbb.................',
      '..Bbbbbbbbbbb.................',
      '..bbbbbbbbbbb...............f.',
      '..bbbbobobbbd..............ff.',
      '..bbbbbbbbddd....Bb..Bbb.Bbb..',
      '...oBBbbbbbo...BBbbbbbbbbobbb.',
      '.BwBbwbmbwbbwb.Bbbbbbobbbobbb.',
      'Bbwmmwmmmwmmwbbobbbbbobbbobbd.',
      'bbmmmmmmmmmmmddobbbbdobbdobd..',
      '.bbwbmmwmmdwdd.bbbbddbbd......',
      '....bbbbddd......bd...........',
      '......o...o....o...o..o...o...',
      '......o...o....o...o..o...o...',
      '.....ff..ff...ff..ff.ff..ff...',
    ],
    wave: {
      7: '..BBkbbbbbkbb................f',
      8: '..Bbbbbbbbbbb...............ff',
      9: '..bbbbbbbbbbb..............ff.',
      10: '..bbbbobobbbd..............bb.',
    },
  },
  // Cat ears (one short, one tall), a grumpy face, blue wings like a big
  // bow, a grey dress with a purple stripe, arms straight out with claws,
  // and long thin legs with bird feet.
  kidmon9: {
    name: '파란 날개 고양이 몬스터',
    drawing: 'img/monsters/kidmon9.jpg',
    by: '직접 그린 몬스터',
    ink: '#2c2c3a',
    pal: { b: '#ece6f8', B: '#faf7ff', d: '#d2c6ec', g: '#a9b6be', G: '#c9d3d9', s: '#c0409a', v: '#6e9cf0', V: '#a4c4ff' },
    rows: [
      '................b.........',
      '.........b.....bb.........',
      '.........bb....bb.........',
      '.........BBbbbbbb.........',
      '.........Bbbbbbbb.........',
      '.........Bobbbboo.........',
      '.........Bbobbobb.........',
      '.........Bbkbbkbd.........',
      '.........bbkbbkbd.........',
      '.........bbbbbbbd.........',
      '..........boooob..........',
      'o.....VVv.bbbbdd.vvd.....o',
      '.oooooooooobb..oooooooooo.',
      'o...VvvvvvGGsg..vvvvvd...o',
      '....VvvvvvGgsgggvvvvvd....',
      '.....vvvv.Ggsggg.vvvd.....',
      '.........Gggsgggg.........',
      '.........Gggssggg.........',
      '........Ggggsggggg........',
      '........Gggsgggggg........',
      '.......Ggggssgggggg.......',
      '.......ggggsggggggg.......',
      '..........o....o..........',
      '..........o....o..........',
      '..........o....o..........',
      '..........o....o..........',
      '..........o....o..........',
      '..........o....o..........',
      '..........o....o..........',
      '..........o....o..........',
      '..........o....o..........',
      '..........o....o..........',
      '..........o....o..........',
      '.........o.o..o.o.........',
      '........o...oo...o........',
      '.......o....o.....o.......',
    ],
    wave: {
      4: '.........Bbbbbbbb.....o...',
      5: '.........Bobbbboo....o.o..',
      6: '.........Bbobbobb....o....',
      7: '.........Bbkbbkbd...o.....',
      8: '.........bbkbbkbd..o......',
      9: '.........bbbbbbbd.o.......',
      10: '..........boooob.o........',
      11: 'o.....VVv.bbbbd.ovvd......',
      12: '.oooooooooobb..ovvvvvd....',
      13: 'o...VvvvvvGGsg..vvvvvd....',
    },
  },
  // Spiky hair like a crown, cross orange eyes, a triangle dress, an arm
  // down its side and crossed legs, all in her red crayon (`ink`).
  kidmon10: {
    name: '삐죽머리 빨강 몬스터',
    drawing: 'img/monsters/kidmon10.jpg',
    by: '직접 그린 몬스터',
    ink: '#d23a24',
    pal: { b: '#ffe6d8', B: '#fff3ec', d: '#f6c9b2', h: '#ff6a3c', H: '#ff9a70', e: '#ffb070', r: '#ffb4a4', R: '#ffd2c8', k: '#2a1a1a' },
    rows: [
      '...h.......h...........',
      '...h...h...h...h.......',
      '...h...h...h...h...h...',
      '..Hhh..h..Hhh..h...h...',
      '..Hhh.Hhh.Hhh.Hhh..h...',
      '..Hhh.Hhh.Hhh.Hhh.Hhh..',
      'Hhhhhhhhhhhhhhhhhhhhhh.',
      '....BBbbbbbbbbbbbbb....',
      '....Bbbbbbbbbbbbbbd....',
      '....Bbboobbbbboobbd....',
      '.....bbeekbbbekeebd....',
      '.....bbeekbbbekeebd....',
      '.....bbbbbbbbbbbbbd....',
      '......bbbboooobbbd.....',
      '.......bbbbbbbbdd......',
      '........bbbbbbdd.......',
      '..........Rrr.o........',
      '.........Rrrr..o.......',
      '........Rrrrrr.o.......',
      '........Rrrrrr..o......',
      '.......Rrrrrrdd.o......',
      '......Rrrrrrrrdd.o.....',
      '......Rrrrrrrrdd.o.....',
      '.....Rrrrrrrrrrdd.o....',
      '.....Rrrrrrrrrrdd.o....',
      '....Rrrrrrrrrrrrdd.....',
      '...Rrrrrrrrrrrrrrdd....',
      '........o....o.........',
      '.........o..o..........',
      '.........o..o..........',
      '..........oo...........',
      '..........oo...........',
      '.........o..o..........',
      '.........o..o..........',
      '......o.o...o.o........',
      '.....o...o.o...o.......',
    ],
    wave: {
      12: '.....bbbbbbbbbbbbbd..o.',
      13: '......bbbboooobbbd...oo',
      14: '.......bbbbbbbbdd...o..',
      15: '........bbbbbbdd..oo...',
      16: '..........Rrr...oo.....',
      17: '.........Rrrr.oo.......',
      18: '........Rrrrrr.........',
      19: '........Rrrrrr.........',
      20: '.......Rrrrrrdd........',
      21: '......Rrrrrrrrdd.......',
      22: '......Rrrrrrrrdd.......',
      23: '.....Rrrrrrrrrrdd......',
      24: '.....Rrrrrrrrrrdd......',
    },
  },
  // Two tall pink boxes with dark leaf tips on a pink head with cross eyes,
  // and a big box of a body with arms straight out: eight mouths with their
  // tongues out, four on its tummy and two on each arm, which all shut at
  // once when it waves.
  kidmon11: {
    name: '입이 많이 달린 몬스터',
    drawing: 'img/monsters/kidmon11.jpg',
    by: '직접 그린 몬스터',
    ink: '#2c2c3a',
    pal: { b: '#e9e9f2', B: '#f6f6fb', d: '#cfcfe0', h: '#ffd8ea', H: '#ffeaf3', x: '#3a3a4a', e: '#ff7ab0', t: '#ff7aa8' },
    rows: [
      '.................x............',
      '.........x......xx............',
      '.........xx.....xx............',
      '.........xx.....x.............',
      '..........x.....o.............',
      '..........o....Hhh............',
      '..........Hhh..Hhh............',
      '..........Hhh..Hhh............',
      '..........Hhh..Hhh............',
      '..........Hhh..Hhh............',
      '..........Hhh..Hhh............',
      '........HHhhhhhhhhhh..........',
      '........Hhhhhhhhhhhd..........',
      '........Hhhhhhhhhhhd..........',
      '........Hhekhhhhkehd..........',
      '........Hhkehhhhekhd..........',
      '........Hhhhhhhhhhhd..........',
      '.......Hhhhhhhhhhhhd..........',
      '.......hhhhhhhhhhhdd..........',
      '.......Bbbbbbbbbbbbbbbd.......',
      'BbbbbbbBbbbbbbbbbbbbbbdbbbbbbd',
      'BooboobBbobbbbbbobbbbbdboobood',
      'BttbttbBbooobbbbooobbbdbttbttd',
      'BbbbbbbBbbttbbbbbttbbbdbbbbbbd',
      '.......Bbbtbbbbbbtbbbbd.......',
      '.......Bbbobbbbobbbbbbd.......',
      '.......Bbbooobbooobbbbd.......',
      '.......Bbbbttbbbttbbbbd.......',
      '.......Bbbbtbbbbtbbbbbd.......',
      '.......Bbbbbbbbbbbbbbbd.......',
      '.......bbbbbbbbbbbbbbdd.......',
      '.........bbbb....bbbd.........',
      '.........bbbb....bbbd.........',
      '.........bbbb....bbbd.........',
      '.........bbbb....bbbd.........',
      '.........bbbb....bbbd.........',
      '.........bbbb....bbbd.........',
    ],
    shut: {
      14: '          hh    hh            ',
      15: '          oo    oo            ',
    },
    wave: {
      22: 'BbbbbbbBbooobbbbooobbbdbbbbbbd',
      23: 'BbbbbbbBbbbbbbbbbbbbbbdbbbbbbd',
      24: '.......Bbbbbbbbbbbbbbbd.......',
      27: '.......Bbbbbbbbbbbbbbbd.......',
      28: '.......Bbbbbbbbbbbbbbbd.......',
    },
  },
  // A snake with a cat's face: spiky hair, cross yellow eyes, a long
  // striped body with a fish's tail, two forked arms up from its back,
  // little legs under it and two long front legs. Its tail flicks when it
  // waves; it stands on its front legs (`head`: where its ♪ goes).
  kidmon12: {
    name: '몸통이 긴 뱀 몬스터',
    drawing: 'img/monsters/kidmon12.jpg',
    by: '직접 그린 몬스터',
    ink: '#8a2a6a',
    pal: { b: '#f6e8f6', B: '#fff4fb', d: '#e4cce4', h: '#c8408e', y: '#f0d84a', e: '#f2d63a', k: '#1a1a1a', G: '#dedee8', s: '#c8408e', f: '#ffd0e8' },
    head: 6,
    rows: [
      '..h.....h.................................',
      '..h..h..h.................................',
      '..h..h..h..h.......o.....o................',
      '.yhh.h.yhh.h.o.....oo...o.................',
      '.yhhyhhyhh.h..o...o..o.o..................',
      '.yhhyhhyhhyhh..o.o....o...................',
      'yhhhhhhhhhhhh...o.....o...................',
      '..BBbbbbbbbbb...o.....o...................',
      '.Bbbbbbbbbbbb...o.....o...................',
      '.Bboobbbbbobb...o.....o.................ff',
      '.Bbekebbbekeb...o.....o................fff',
      '.Bbekebbbekeb...o.....o...............foof',
      '.bbbbbbbbbbbd...o.....o..............fffff',
      '..bbbobbbbbbd...o.....o..sbbsbbsbbsbfffoof',
      '..bboobbbbbdd...o...GGoGGsbbsbbsbbsbffffff',
      '...bbobbbbbGGoGGoGGoGGoGGsbbsbbsbbsbfffoof',
      '....bbbbbddGGoGGoGGoGGoGG............fffff',
      '......o..o.GGoGGoGGoo..o..............foof',
      '......o..o..........o..o...............fff',
      '.....o...o..............................ff',
      '.....o..o.................................',
      '....o...o.................................',
      '....o...o.................................',
      '...o...o..................................',
      '...o...o..................................',
      '..o....o..................................',
      '..o...o...................................',
      'o.o..o.o..................................',
      'o...o...o.................................',
      '..........................................',
    ],
    wave: {
      2: '..h..h..h..h..............................',
      3: '.yhh.h.yhh.h.......oo...oo................',
      4: '.yhhyhhyhh.h.oo...oo.o.o..................',
      6: 'yhhhhhhhhhhhh...o.....o.................ff',
      7: '..BBbbbbbbbbb...o.....o................fff',
      8: '.Bbbbbbbbbbbb...o.....o...............foof',
      9: '.Bboobbbbbobb...o.....o...............ffff',
      10: '.Bbekebbbekeb...o.....o..............ffoof',
      11: '.Bbekebbbekeb...o.....o..............ffff.',
      12: '.bbbbbbbbbbbd...o.....o.............fffoo.',
      13: '..bbbobbbbbbd...o.....o..sbbsbbsbbsbfff...',
      14: '..bboobbbbbdd...o...GGoGGsbbsbbsbbsbff....',
      15: '...bbobbbbbGGoGGoGGoGGoGGsbbsbbsbbsb......',
      16: '....bbbbbddGGoGGoGGoGGoGG.................',
      17: '......o..o.GGoGGoGGoo..o..................',
      18: '......o..o..........o..o..................',
      19: '.....o...o................................',
    },
  },
};

// Letters every monster shares: her marker's ink, eyes, a glint and blush.
const KID_INK = '#1f5566';
const KID_PAL = { o: KID_INK, k: '#173246', w: '#ffffff', p: '#ff9ec4' };

// Drawn by kidMonsterSprite (see the `draw` hook in villagerSprite), so
// portraits, the little games and the checks all find them.
for (const look of Object.keys(KID_MONSTERS)) LOOKS[look] = { draw: (k, f) => kidMonsterSprite(k, f) };

Object.assign(VOICES, {
  kidmon1: { gender: 'male',   tts: 'am_eric',   lift: 1.08, pitch: 1.2,  rate: 1.0,  voice: ['Fred', 'Microsoft Guy', 'Google US English'] },
  kidmon2: { gender: 'female', tts: 'af_sky',    lift: 1.12, pitch: 1.6,  rate: 1.08, voice: ['Junior', 'Zoe', 'Microsoft Ana'] },
  kidmon3: { gender: 'male',   tts: 'am_adam',  lift: 0.94, pitch: 0.9,  rate: 0.95, voice: ['Oliver', 'Gordon', 'Microsoft Brian'] },
  kidmon4: { gender: 'female', tts: 'af_aoede',  pitch: 1.35, rate: 0.95, voice: ['Samantha', 'Karen', 'Microsoft Aria'] },
  kidmon5: { gender: 'female', tts: 'af_kore',   lift: 1.06, pitch: 1.4,  rate: 1.0,  voice: ['Tessa', 'Zoe', 'Microsoft Jenny'] },
  // The ones after share voices the Monster Village had already (so its
  // questions are recorded in them), each lifted to sound like itself.
  kidmon6: { gender: 'male',   tts: 'am_michael', lift: 1.1,  pitch: 1.2,  rate: 0.95, voice: ['Daniel', 'Fred', 'Microsoft Guy'] },
  kidmon7: { gender: 'female', tts: 'af_nova',   lift: 1.14, pitch: 1.6,  rate: 1.0,  voice: ['Junior', 'Zoe', 'Microsoft Ana'] },
  kidmon8: { gender: 'male',   tts: 'am_liam',   lift: 1.02, pitch: 1.1,  rate: 1.0,  voice: ['Oliver', 'Tom', 'Microsoft Brian'] },
  kidmon9: { gender: 'female', tts: 'bf_lily',   lift: 1.08, pitch: 1.4,  rate: 0.95, voice: ['Zoe', 'Allison', 'Microsoft Ana'] },
  kidmon10: { gender: 'female', tts: 'af_kore',  lift: 1.16, pitch: 1.5,  rate: 1.05, voice: ['Tessa', 'Zoe', 'Microsoft Jenny'] },
  kidmon11: { gender: 'male',   tts: 'am_adam',  lift: 1.1,  pitch: 1.1,  rate: 1.0,  voice: ['Oliver', 'Gordon', 'Microsoft Brian'] },
  kidmon12: { gender: 'male',   tts: 'am_eric',  lift: 1.14, pitch: 1.3,  rate: 0.95, voice: ['Fred', 'Microsoft Guy', 'Google US English'] },
});
Object.assign(PERSONA, {
  kidmon1: ['Hmph! I am grumpy, but I like letters!', 'Grr! Do not touch my pointy hat, {title} {name}!', 'Hmph. Okay, okay. One word game. Just one!'],
  kidmon2: ['Hee hee! Hello, {title} {name}! Look at my big ears!', 'Yay, a friend! My round tummy is full of words!', 'Hi hi! My big ears hear every sound. Can yours?'],
  kidmon3: ['Meow! Hmph! Do you like my stripy jacket?', 'Grr, meow! I am a grumpy cat. Want to play anyway?', 'Hmph! Show me your super ears, {title} {name}.'],
  kidmon4: ['Whoosh! Hello, {title} {name}! My spire touches the clouds.', 'Flap, flap! I fly round and round the Monster Tower.', 'Hello! I am the tallest monster in the tower!'],
  kidmon5: ['Hmph! I have three ears. I hear everything!', 'Swish! This is my magic loop. Ready, {title} {name}?', "I am not grumpy. I am thinking! Let's play."],
  kidmon6: ['Hello, {title} {name}! I have a mouth on my tummy!', 'Three eyes on top, one more on my tummy. I see you!', 'Yum, yum! My tummy mouth loves long words!'],
  kidmon7: ['Hi, {title} {name}! I have one big eye and four arms!', 'Wave, wave, wave, wave! Four arms to say hello!', 'My green horn is pointy, but I am friendly!'],
  kidmon8: ['Chomp, chomp! I am a hungry caterpillar monster.', 'Look at all my legs, {title} {name}! Wiggle, wiggle!', 'My teeth are big, but I only eat leaves. And words!'],
  kidmon9: ['Hello, {title} {name}! Do you like my blue wings?', 'My legs are long and thin. I walk like a bird!', 'Meow! I am a cat with wings. Flap, flap!'],
  kidmon10: ['Hmph! Do you like my spiky red hair, {title} {name}?', 'My hair is spiky like a crown!', 'Grr! I look grumpy, but I love word games!'],
  kidmon11: ['Hello, {title} {name}! I have eight mouths!', 'Blah, blah, blah! All my mouths talk at once!', 'Two mouths on each arm, four on my tummy. Count them!'],
  kidmon12: ['Hiss! I am a snake monster with a very long body!', 'Look at my fishy tail, {title} {name}!', 'Sss, sss! I like the snake sound. Do you?'],
});

// ---- Pixel sprites ------------------------------------------------------------

// The one place a monster's art is looked up: its rows, palette, wave rows,
// drawing and caption. A drawing a parent uploads later can be returned
// here instead, per monster; sprites are made from whatever this returns
// (kept per art object, so new art draws at once) and so is the picture in
// the dialog.
function kidMonsterArt(look) {
  return KID_MONSTERS[look];
}

// Frames: 0 still, 1 eyes shut, 2 waving, 3 waving with eyes shut. Like the
// other sprites, { canvas, ax, ay } with the feet at (ax, ay).
const kidSpriteCache = new WeakMap();
function kidMonsterSprite(look, frame = 0) {
  const art = kidMonsterArt(look);
  let frames = kidSpriteCache.get(art);
  if (!frames) kidSpriteCache.set(art, frames = []);
  if (!frames[frame]) frames[frame] = kidPaint(art, frame);
  return frames[frame];
}

function kidPaint(art, frame) {
  let rows = art.rows;
  if (frame & 2 && art.wave) rows = rows.map((r, j) => art.wave[j] || r);
  if (frame & 1) rows = art.shut ? rows.map((r, j) => kidOver(r, art.shut[j])) : blinkRows(rows);
  const ink = art.ink || KID_INK;
  const pal = Object.assign({}, KID_PAL, { o: ink }, art.pal);
  const at = (x, y) => (rows[y - 1] || '')[x - 1] || '.';
  const coloured = (x, y) => { const ch = at(x, y); return ch !== '.' && ch !== 'o'; };
  // A pixel of room all round for the outline.
  const cv = makeCanvas(rows[0].length + 2, rows.length + 2);
  const ctx = cv.getContext('2d');
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
    const ch = at(x, y);
    if (ch !== '.') px(ctx, x, y, 1, 1, pal[ch]);
    else if (coloured(x + 1, y) || coloured(x - 1, y) || coloured(x, y + 1) || coloured(x, y - 1)) px(ctx, x, y, 1, 1, ink);
  }
  // The feet: between the outermost legs in the last few rows (from the
  // still picture, so every frame stands in the same place).
  const used = art.rows.map(r => /[^.]/.test(r));
  const last = used.lastIndexOf(true);
  let x0 = Infinity;
  let x1 = -Infinity;
  for (let j = Math.max(0, last - 3); j <= last; j++) {
    const r = art.rows[j];
    if (!used[j]) continue;
    x0 = Math.min(x0, r.search(/[^.]/));
    x1 = Math.max(x1, r.length - 1 - [...r].reverse().join('').search(/[^.]/));
  }
  return { canvas: cv, ax: Math.round((x0 + x1) / 2) + 1, ay: last + 1 };
}

// A row with `over` drawn on it, where `over` has no space.
function kidOver(row, over) {
  return over ? [...row].map((ch, i) => (over[i] && over[i] !== ' ' ? over[i] : ch)).join('') : row;
}

// Called by drawCharacter (js/game.js) with its feet at (x, y) in world
// pixels: a soft bob, a blink every few seconds, now and then a wave (an arm
// up and down three times, or a flap), and the hop when it calls her over.
function drawKidMonster(ctx, n, x, y, now) {
  const t = now / 1000 + n.phase;
  // Eyes shut for 0.15 s every 3.4 s; every 7.7 s the arm goes up and down
  // three times, 0.2 s each way.
  let frame = t % 3.4 < 0.15 ? 1 : 0;
  const wave = (t % 7.7) / 0.2;
  if (wave < 6 && Math.floor(wave) % 2 === 0) frame |= 2;
  const dy = (Math.sin(t * 2.4) > 0.55 ? -1 : 0) + guideBob(n, now);
  drawSprite(ctx, kidMonsterSprite(n.look, frame), x, y + dy, false);
}

// How much higher the ♪ bubble over a villager goes (drawOverlay in
// js/game.js puts it 40 px over the feet): over one of these, clear of a
// tall hat, ears or spire; over anyone else, not at all.
function kidBubbleLift(n) {
  return KID_MONSTERS[n.look] ? Math.max(0, kidMonsterSprite(n.look).ay - 27) : 0;
}
// How far right of the feet it goes: over the head of a long one.
function kidBubbleShift(n) {
  const art = KID_MONSTERS[n.look] && kidMonsterArt(n.look);
  return art && art.head !== undefined ? art.head + 1 - kidMonsterSprite(n.look).ax : 0;
}
// Where a tap talks to one, from its feet: all of it and its ♪, at least
// as much as anyone else (10 px each side and 44 up, as in onTap in
// js/game.js). Null for anyone else.
function kidTapBox(n) {
  if (!KID_MONSTERS[n.look]) return null;
  const s = kidMonsterSprite(n.look);
  return { x0: Math.min(-10, -s.ax), x1: Math.max(10, s.canvas.width - s.ax), y0: -Math.max(44, s.ay + 2, 46 + kidBubbleLift(n)) };
}

// ---- Her drawing in the dialog ----------------------------------------------------

// The photo frame in the dialog (index.html) and the big picture over the
// town, found by kidDrawingSetup.
const kidUi = {};

// From openDialog with the villager she talks to, and from closeDialog with
// none: one of her monsters shows its drawing where the portrait goes,
// anyone else the portrait.
function kidDrawingShow(npc) {
  const art = npc && KID_MONSTERS[npc.look] && kidMonsterArt(npc.look);
  kidBig(false);
  kidUi.dialog.classList.toggle('drawn', !!art);
  kidUi.frame.classList.toggle('hidden', !art);
  if (!art) return;
  if (kidUi.img.getAttribute('src') !== art.drawing) kidUi.img.src = art.drawing;
  kidUi.img.alt = npc.name;
  kidUi.by.textContent = art.by;
}

// Tapping the photo shows it big; any tap closes that.
function kidBig(on) {
  kidUi.big.classList.toggle('hidden', !on);
  if (!on) return;
  kidUi.bigImg.src = kidUi.img.src;
  kidUi.bigImg.alt = kidUi.img.alt;
  kidUi.bigBy.textContent = kidUi.by.textContent;
}

function kidDrawingSetup() {
  if (typeof document === 'undefined') return; // tools/tts-phrases.js, in node
  const ids = { dialog: 'dialog', frame: 'dlg-drawing', img: 'dlg-drawing-img', by: 'dlg-drawing-by', big: 'drawing-big', bigImg: 'drawing-big-img', bigBy: 'drawing-big-by' };
  for (const [k, id] of Object.entries(ids)) kidUi[k] = document.getElementById(id);
  kidUi.frame.addEventListener('click', () => { Sound.tap(); kidBig(true); });
  kidUi.big.addEventListener('click', () => kidBig(false));
  // The big picture goes with the dialog, also when it steps aside for a spell.
  new MutationObserver(() => { if (kidUi.dialog.classList.contains('hidden')) kidBig(false); })
    .observe(kidUi.dialog, { attributes: true, attributeFilter: ['class'] });
}
kidDrawingSetup();
