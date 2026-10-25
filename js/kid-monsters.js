// Her own monsters: five little monsters the child drew herself, who live in
// the Monster Tower. Any villager with one of these looks is one of them,
// in either edition: drawCharacter (js/game.js) draws it with
// drawKidMonster, its ♪ goes a little higher (kidBubbleLift, from
// drawOverlay), and its dialog shows her drawing in a little photo frame
// where the portrait goes (kidDrawingShow, from openDialog and closeDialog).
// - KID_MONSTERS: each one's Korean name, her drawing (img/monsters, made
//   from a photo by tools/kid-drawings.py), the caption under it, and its
//   pixel art. The art is string rows with a palette letter per pixel and
//   `.` empty, like MONSTERS in js/sprites.js. An outline in her dark teal
//   marker goes round every coloured part; `o` pixels are that ink too, for
//   stick arms and legs, brows and mouths. `k` are the eyes, which shut when
//   it blinks (blinkRows in js/cave-magic.js), and `wave` swaps a few rows
//   for an arm (or the wings) up.
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
});
Object.assign(PERSONA, {
  kidmon1: ['Hmph! I am grumpy, but I like letters!', 'Grr! Do not touch my pointy hat, {title} {name}!', 'Hmph. Okay, okay. One word game. Just one!'],
  kidmon2: ['Hee hee! Hello, {title} {name}! Look at my big ears!', 'Yay, a friend! My round tummy is full of words!', 'Hi hi! My big ears hear every sound. Can yours?'],
  kidmon3: ['Meow! Hmph! Do you like my stripy jacket?', 'Grr, meow! I am a grumpy cat. Want to play anyway?', 'Hmph! Show me your super ears, {title} {name}.'],
  kidmon4: ['Whoosh! Hello, {title} {name}! My spire touches the clouds.', 'Flap, flap! I fly round and round the Monster Tower.', 'Hello! I am the tallest monster in the tower!'],
  kidmon5: ['Hmph! I have three ears. I hear everything!', 'Swish! This is my magic loop. Ready, {title} {name}?', "I am not grumpy. I am thinking! Let's play."],
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
  if (frame & 1) rows = blinkRows(rows);
  const pal = Object.assign({}, KID_PAL, art.pal);
  const at = (x, y) => (rows[y - 1] || '')[x - 1] || '.';
  const coloured = (x, y) => { const ch = at(x, y); return ch !== '.' && ch !== 'o'; };
  // A pixel of room all round for the outline.
  const cv = makeCanvas(rows[0].length + 2, rows.length + 2);
  const ctx = cv.getContext('2d');
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
    const ch = at(x, y);
    if (ch !== '.') px(ctx, x, y, 1, 1, pal[ch]);
    else if (coloured(x + 1, y) || coloured(x - 1, y) || coloured(x, y + 1) || coloured(x, y - 1)) px(ctx, x, y, 1, 1, KID_INK);
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
