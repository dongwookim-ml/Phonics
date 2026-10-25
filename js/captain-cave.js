// Captain edition: the Villain Cave (악당 동굴), which replaces the Crystal
// Cave. Silly robot villains ask the cave's sentence questions. Tapping one
// starts a fight of three questions in a row: every right answer is a laser
// or rocket punch that knocks off one of its three hearts, a wrong answer
// gets a hint and a quick silly attack the robot blocks with its shield.
// After a second miss the answer is shown and tapping it fires a little
// punch, so a fight always ends. At no hearts left the
// villain gives up, drops coins and runs off, and comes back later.
// Hooks in js/game.js: openDialog, missed, finishShown,
// catchMonster and drawOverlay, all behind isCaptain().

// Hearts a villain starts a fight with: one question each.
const VILLAIN_HP = 3;

// LINES kinds the villains say in a fight, for tools/tts-phrases.js.
// `narrator` ones are said by the narrator.
const CAVE_LINES = { villain: ['villainHit', 'villainNext'], narrator: ['tapFire'] };
// After a second miss, the narrator asks her to tap the answer to fire.
function villainTapLine() { return { text: line('tapFire'), narrator: true }; }

if (isCaptain()) {
  // Who lives in the cave. `coins` is the smallest prize for beating one;
  // `throws` is the silly thing it throws when she gets one wrong.
  DUNGEON_NPCS.splice(0, DUNGEON_NPCS.length,
    { name: '대장 로봇',   look: 'bossbot',   c: 8,  r: 3,  coins: 5, throws: 'pie' },
    { name: '고철 로봇',   look: 'scrapbot',  c: 2,  r: 4,  coins: 3, throws: 'sock' },
    { name: '해적 로봇',   look: 'piratebot', c: 4,  r: 10, coins: 4, throws: 'duck' },
    { name: '박사 로봇',   look: 'madbot',    c: 12, r: 4,  coins: 4, throws: 'goo' },
    { name: '깡통 졸개',   look: 'canbot',    c: 5,  r: 6,  coins: 3, throws: 'banana' },
    { name: '닌자 로봇',   look: 'ninjabot',  c: 13, r: 11, coins: 4, throws: 'marshmallow' });
  // Villains are drawn by monsterSprite() from the art added in villainArt().
  for (const v of DUNGEON_NPCS) LOOKS[v.look] = { monster: v.look };

  Object.assign(VOICES, {
    bossbot:   { gender: 'male',   tts: 'bm_george',  lift: 0.93, pitch: 0.85, rate: 0.95, voice: ['Daniel', 'Gordon', 'Microsoft George'] },
    scrapbot:  { gender: 'male',   tts: 'am_eric',    pitch: 1.0,  rate: 1.0,  voice: ['Fred', 'Ralph', 'Microsoft Guy'] },
    piratebot: { gender: 'male',   tts: 'bm_fable',   pitch: 1.05, rate: 1.0,  voice: ['Arthur', 'Oliver', 'Microsoft Ryan'] },
    madbot:    { gender: 'female', tts: 'af_nova',    pitch: 1.35, rate: 1.05, voice: ['Zoe', 'Allison', 'Microsoft Ana'] },
    canbot:    { gender: 'male',   tts: 'am_puck',    lift: 1.15, pitch: 1.6, rate: 1.1, voice: ['Junior', 'Tom', 'Microsoft Brian'] },
    ninjabot:  { gender: 'male',   tts: 'am_liam',    pitch: 1.2,  rate: 1.05, voice: ['Aaron', 'Tom', 'Microsoft Christopher'] },
  });
  Object.assign(PERSONA, {
    bossbot:   ['Ho ho ho! I am the Boss Bot, the biggest villain in the cave!', 'So, {title} {name}! You want to beat the boss? Answer three questions!', 'I have the shiniest coins! But you have to beat me first!'],
    scrapbot:  ['Clank, clank! I am Scrap Bot. I am made of old junk!', 'Hey, {title} {name}! Do you have a spare bolt for me?', 'Rattle, rattle! My tummy is full of old cans!'],
    piratebot: ['Arr! I am Pirate Bot! My treasure is all mine!', 'Ahoy, {title} {name}! Answer me three, if you can!', 'Yo ho ho! I lost my parrot. Have you seen it?'],
    madbot:    ['Ha ha ha! I am Doctor Bot! I invent silly gadgets!', 'Hello, {title} {name}! Want to see my bubbly goo?', 'My brain is so big, it needs a glass hat!'],
    canbot:    ['Beep boop! I am Can Bot, the boss bot helper!', 'Hi, {title} {name}! I am small but very sneaky!', 'Boop! Do not tell the boss, but I like you!'],
    ninjabot:  ['Hiya! I am Ninja Bot. You did not see me!', 'Oops! You found me, {title} {name}!', 'I am super quiet and super quick! Ready?'],
  });

  Object.assign(LINES, {
    dungeon: ['Welcome to the Villain Cave! Be brave, {title} {name}!', 'Uh oh, silly villains ahead! Get ready, {title}!', "The Villain Cave! Let's beat some villains!"],
    // Said by a villain as it runs off.
    caught: ['I give up! I give up! Here, take my coins!', 'Okay, okay, you win! Bye bye!', 'No fair, you are too smart! I give up!', 'I give up! Run away, run away!'],
    // A right answer hits the villain.
    villainHit: ['Ouch! My bolts are wobbling!', 'Hey! That tickles!', 'Whoa! My gears went spinny!', 'Oof! You are strong, {title} {name}!', 'Yikes! My antenna is all bent!', 'Ow, ow! Okay, one more!'],
    // Said by the narrator when the answer is shown after a second miss.
    tapFire: ['Tap it to fire!', 'Tap the answer to fire!'],
    // The villain's next question in the same fight.
    villainNext: ['Round two! I am not done yet!', 'Ha! This one is super tricky!', 'You will never get this one!', 'Okay, here comes a hard one!'],
  });
}

// ---- Villain art ---------------------------------------------------------------

// Pixel rows in the MONSTERS format of js/sprites.js: letters are colours
// and the ink outline is added around them. Added once sprites.js has loaded.
function villainArt() {
  Object.assign(MONSTERS, {
    // A rusty junk robot: one big eye, a springy antenna and patches.
    scrapbot: {
      pal: { b: '#c8885a', B: '#e0a878', D: '#9a6040', g: '#a8b0c0', G: '#d8dce8', y: '#ffd34d', r: '#ff6f6f', s: '#7fe8ff' },
      rows: [
        '.......yy.......',
        '........g.......',
        '.......g........',
        '........g.......',
        '..bbbbbbbbbbbb..',
        '.bBBBBBBBBBBBBb.',
        '.bBwwwBBBBBBBBb.',
        '.bBwkwBBBBkkBBb.',
        '.bBwwwBBBBkkBBb.',
        '.bBBBBBBBBBBGGb.',
        '.bBBBkmmmmkBGGb.',
        '.bDDDDDDDDDDDDb.',
        '..bbbbbbbbbbbb..',
        '....DDDDDDDD....',
        '.gg.bbbbbbbb.gg.',
        '.gg.bBBsBBBb.gg.',
        '.g..bBsrsGGb..g.',
        '.g..bBBsBGGb..g.',
        'GGG.bBBBBBBb.GGG',
        '....bDDDDDDb....',
        '.....g....g.....',
        '.....g....g.....',
        '....DDD..DDD....',
      ],
    },
    // A pirate with a big hat, an eye patch, a hook and a peg leg.
    piratebot: {
      pal: { h: '#3a3a5a', H: '#5a5a80', b: '#8fb0d8', B: '#c4d8f0', D: '#6080a8', r: '#ff6f6f', w: '#ffffff', y: '#ffd34d', G: '#d8dce8', t: '#b07a48' },
      rows: [
        '.....hhhhhh.....',
        '...hhhhyyhhhh...',
        '..hhhhyhhyhhhh..',
        '.hhhhhhyyhhhhhh.',
        'hhHHHHHHHHHHHHhh',
        '...bbbbbbbbbb...',
        '..bBBBBBBBBBBb..',
        '..bBkkkBBBwwBb..',
        '..bBkkkBBBwkBb..',
        '..bkBBBBBBBBBb..',
        '..bBBmmmmmmBBb..',
        '..bBBmwmwmwBBb..',
        '...bbbbbbbbbb...',
        '.....DDDDDD.....',
        '.bb.rrrrrrrr.b..',
        '.bb.rwwwwwwr.b..',
        '.b..rrrrrrrr.GG.',
        '.bb.rwwwwwwr..G.',
        '....rrrrrrrr.GG.',
        '....DDDDDDDD....',
        '.....b....t.....',
        '.....b....t.....',
        '....DDD...t.....',
      ],
    },
    // A mad scientist: a big pink brain under a glass dome, goggles and a
    // lab coat, with a flask of green goo.
    madbot: {
      pal: { c: '#c8f4ff', p: '#ffb0d6', P: '#ff7fb8', g: '#9aa4bc', G: '#d0d8ea', y: '#ffd34d', w: '#ffffff', W: '#dde4f4', e: '#7fe870', D: '#6a7290' },
      rows: [
        '.....cccccc.....',
        '....cpppPppc....',
        '...cpPppPpPpc...',
        '...cppPppPppc...',
        '...gggggggggg...',
        '..gGGGGGGGGGGg..',
        '..gyyyyGGyyyyg..',
        '..gywkyGGywkyg..',
        '..gyyyyGGyyyyg..',
        '..gGGGmmmmGGGg..',
        '...gggggggggg...',
        '.....DDDDDD.....',
        '...wwwwwwwwww...',
        '..wwwWwwwwWwww..',
        '.wwwwWwwwwWwwwe.',
        '.ww.wWwwwwWw.eee',
        '.ww.wWwwwwWw.eee',
        '....wWwwwwWw....',
        '....wwwwwwww....',
        '.....g....g.....',
        '.....g....g.....',
        '....DDD..DDD....',
      ],
    },
    // The boss: big, purple and gold, with a crown of spikes and a curly
    // moustache.
    bossbot: {
      pal: { y: '#ffd34d', Y: '#e0a52a', b: '#9a7ae0', B: '#c4a8ff', D: '#6a50b0', G: '#c4cce0', g: '#8a94b0', w: '#ffffff' },
      rows: [
        '...y....yy....y...',
        '...yy..yyyy..yy...',
        '...yyyyyyyyyyyy...',
        '..bbbbbbbbbbbbbb..',
        '.bBBBBBBBBBBBBBBb.',
        '.bBkkBBBBBBBBkkBb.',
        '.bBBkwwwBBwwwkBBb.',
        '.bBBwwkwBBwkwwBBb.',
        '.bBBBBBBBBBBBBBBb.',
        '.bBBkkkkBBkkkkBBb.',
        '.bBkkBBkkkkBBkkBb.',
        '.bBBBBBmmmmBBBBBb.',
        '..bbbbbbbbbbbbbb..',
        '......DDDDDD......',
        'GGG.bbbbbbbbbb.GGG',
        'GgG.bBBBBBBBBb.GgG',
        'GgG.bByyyyyyBb.GgG',
        '.G..bByYkkYyBb..G.',
        'GGG.bByyyyyyBb.GGG',
        'GgG.bBBBBBBBBb.GgG',
        'GGG.bDDDDDDDDb.GGG',
        '.....bb....bb.....',
        '.....bb....bb.....',
        '....DDDD..DDDD....',
      ],
    },
    // A tiny tin-can helper with one big eye.
    canbot: {
      pal: { b: '#8fdc9a', B: '#c4f4c8', D: '#5fae6e', r: '#ff6f6f', g: '#a8b0c0' },
      rows: [
        '......r.......',
        '......g.......',
        '...bbbbbbbb...',
        '..bBBBBBBBBb..',
        '..bBBwwwwBBb..',
        '..bBwwkkwwBb..',
        '..bBwwkkwwBb..',
        '..bBBwwwwBBb..',
        '..bBBBmmBBBb..',
        'g.bDDDDDDDDb.g',
        'gg.bBBBBBBb.gg',
        '...bDDDDDDb...',
        '...bbbbbbbb...',
        '....g....g....',
        '...DD....DD...',
      ],
    },
    // A ninja in navy with a red headband: only the eyes peek out.
    ninjabot: {
      pal: { n: '#5a6aa8', N: '#7a8ac8', D: '#3f4c88', r: '#ff5f7a', w: '#ffffff', G: '#c4cce0' },
      rows: [
        '....nnnnnnnn....',
        '...nNNNNNNNNn...',
        '..nrrrrrrrrrrn..',
        '..nNNNNNNNNNNnrr',
        '..nwwwwwwwwwwn.r',
        '..nwkkwwwwkkwn..',
        '..nwwwwwwwwwwn..',
        '..nNNNNNNNNNNn..',
        '...nnnnnnnnnn...',
        '.....DDDDDD.....',
        '..nnnnnnnnnnnn..',
        '.nn.nNNNNNNn.nn.',
        '.nn.nrrrrrrn.nn.',
        '.G..nNNNNNNn..G.',
        '....nNNNNNNn....',
        '....nDDDDDDn....',
        '.....n....n.....',
        '.....n....n.....',
        '....DDD..DDD....',
      ],
    },
  });
}
if (isCaptain() && typeof MONSTERS !== 'undefined') villainArt();

// ---- The cave ------------------------------------------------------------------

// Same size, entrance and way out as the Crystal Cave. A steel walkway runs
// from the entrance to the boss's throne; a pool of bubbly green goo, scrap
// heaps, goo barrels, sparky coils and a big red button fill the rest.
function buildVillainCave() {
  const sc = makeScene('dungeon', 16, 14, 140, 50);
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) setTile(sc, c, r, 'cave');
  const walkway = (c, r) => (c >= 7 && c <= 8 && r >= 3) || (c >= 6 && c <= 10 && r >= 1 && r <= 4);
  const goo = (c, r) => ((c - 11.5) / 2.1) ** 2 + ((r - 8) / 1.6) ** 2 <= 1;
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) if (goo(c, r)) block(sc, c, r, 1, 1);
  caveLairWalls(sc, 84);

  // Props stand on single tiles; `anim` ones are drawn every frame.
  const prop = (c, r, up, draw, anim, react) => {
    block(sc, c, r, 1, 1);
    const p = tileCenter(sc, c, r);
    const bounds = { x: p.x - 16, y: p.y - up, w: 32, h: up + 8 };
    // Animated ones get a still frame so they can be tapped (stillFrame in js/world.js).
    if (anim) sc.objects.push(stillFrame(Object.assign({ c0: c, r0: r, c1: c, r1: r }, bounds, { animated: (ctx, t) => anim(ctx, Math.round(p.x), Math.round(p.y), t), react })));
    else addObject(sc, { c, r, w: 1, d: 1 }, bounds, ctx => draw(ctx, Math.round(p.x), Math.round(p.y)), { react });
    return p;
  };
  for (const [c, r] of [[1, 2], [14, 1], [1, 12], [15, 4]]) prop(c, r, 26, caveScrapHeap, null, { word: 'bolt', fx: 'hop' });
  for (const [c, r, col] of [[0, 6, '#ff9a4a'], [4, 1, '#6fb8ff'], [15, 7, '#ff6fa8'], [10, 12, '#6fb8ff']]) {
    const p = prop(c, r, 24, (ctx, x, y) => caveBarrel(ctx, x, y, col));
    sc.lamps.push({ x: p.x, y: p.y - 18, small: true });
  }
  for (const [c, r] of [[3, 7], [14, 9]]) {
    const p = prop(c, r, 40, null, caveTeslaCoil, { fx: 'sparkle' });
    sc.lamps.push({ x: p.x, y: p.y - 34 });
  }
  const lab = prop(13, 2, 30, caveLabTable);
  sc.lamps.push({ x: lab.x, y: lab.y - 20 });
  prop(11, 1, 26, caveBigButton, null, { fx: 'boing' });
  for (const [c, r] of [[6, 13], [9, 13]]) {
    const p = prop(c, r, 36, null, caveBeacon, { word: 'light', fx: 'glow' });
    sc.lamps.push({ x: p.x, y: p.y - 30 });
  }
  // The boss's golden throne, and the pirate's treasure.
  block(sc, 7, 2, 1, 1);
  addObject(sc, { c: 7, r: 2, w: 1, d: 1 }, footBounds(sc, 7, 2, 1, 1, 44), ctx => drawThrone(ctx, sc, 7, 2, '#9a7ae0'), { react: FURNITURE.chair });
  block(sc, 3, 11, 1, 1);
  addObject(sc, { c: 3, r: 11, w: 1, d: 1 }, footBounds(sc, 3, 11, 1, 1, 30), ctx => drawTreasureChest(ctx, sc, 3, 11), { react: FURNITURE.chest });

  // Bubbles popping in the goo pool. A tap anywhere on the pool bubbles too.
  const gp = tileCenter(sc, 11.5, 8);
  sc.objects.push(stillFrame({ c0: 10, r0: 7, c1: 13, r1: 9, x: gp.x - 44, y: gp.y - 30, w: 88, h: 54,
    animated: (ctx, t) => caveGooBubbles(ctx, gp.x, gp.y, t), react: { fx: 'bubbles' } }, ctx => caveGooPool(ctx, gp.x, gp.y)));
  sc.lamps.push({ x: gp.x - 14, y: gp.y - 2, small: true }, { x: gp.x + 12, y: gp.y + 3, small: true }, { x: gp.x, y: gp.y - 6 });

  // Rock floor, a riveted steel walkway with hazard stripes, the goo pool
  // and a rocky front edge.
  sc.paintGround = g => {
    const rock = stonePattern('#6a6496', '#4c4678', ['#6e6898', '#66608e', '#726ca0', '#625c8a'], 8);
    for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) {
      const o = tileOrigin(sc, c, r);
      if (walkway(c, r)) {
        const edge = !walkway(c - 1, r) || !walkway(c + 1, r) || !walkway(c, r - 1) || !walkway(c, r + 1);
        fillPoly(g, diamondPts(o.x, o.y), (x, y) => caveSteel(x - o.x, y - o.y, c, r));
        if (edge) caveHazardEdge(g, o, walkway, c, r);
      } else fillPoly(g, diamondPts(o.x, o.y), (x, y) => (hash(x, y, 5) < 0.01 ? '#a8f070' : rock(x, y)));
      if (r === sc.D - 1 || c === sc.W - 1) {
        for (let x = 0; x < 16; x++) {
          if (r === sc.D - 1) px(g, o.x + x, o.y + 8 + Math.floor(x / 2), 1, 12, x % 5 ? '#4c4678' : '#423c6c');
          if (c === sc.W - 1) px(g, o.x + 16 + x, o.y + 15 - Math.floor(x / 2), 1, 12, x % 5 ? '#3e3866' : '#36305c');
        }
      }
    }
    caveGooPool(g, gp.x, gp.y);
    for (const [c, r] of [[5, 9], [2, 8], [12, 12]]) {
      const p = tileCenter(sc, c, r);
      caveGooSplat(g, Math.round(p.x), Math.round(p.y));
    }
  };

  for (const n of DUNGEON_NPCS) {
    const npc = makeNpc(n, null);
    Object.assign(npc, { level: 4, monster: true, coins: n.coins, throws: n.throws, hp: VILLAIN_HP, home: { c: n.c, r: n.r }, badge: '⚔' });
    sc.npcs.push(npc);
  }
  sc.caught = [];
  // Back out to the Dinosaur Village (the forest) through the mat at the front.
  for (const c of [7, 8]) tileAt(sc, c, sc.D - 1).mat = '#ffd34d';
  sc.links = [7, 8].map(c => ({ c, r: sc.D - 1, target: 'forest', at: { c: 3, r: 16 + (c - 7) }, icon: '🦖' }));
  sc.start = { c: 7, r: sc.D - 2 };
  renderGround(sc);
  return sc;
}
if (isCaptain()) CAPTAIN_SCENES.dungeon = buildVillainCave;

// Steel floor plates with seams and rivets. (x, y) is inside the tile.
function caveSteel(x, y, c, r) {
  const u = x / 2 + y;
  const v = y - x / 2;
  if (Math.abs(u - 16) < 0.6 || Math.abs(v) < 0.6) return '#5c6684';
  const rivet = [[10, -6], [22, -6], [10, 6], [22, 6], [14, -2], [18, 2]].some(([a, b]) => Math.abs(u - a) < 1 && Math.abs(v - b) < 0.8);
  if (rivet) return '#e4ecf8';
  const n = hash(c, r, 9) < 0.5;
  return (u + v * 0.5) % 7 < 1 ? '#a4aec4' : n ? '#8e98b0' : '#949eb6';
}

// Yellow and black stripes along the walkway's outer edges.
function caveHazardEdge(g, o, walkway, c, r) {
  const side = [[c - 1, r, 0], [c, r - 1, 1], [c + 1, r, 2], [c, r + 1, 3]];
  const P = diamondPts(o.x, o.y); // top, right, bottom, left
  const edges = [[P[3], P[0]], [P[0], P[1]], [P[1], P[2]], [P[2], P[3]]];
  for (const [nc, nr, i] of side) {
    if (walkway(nc, nr)) continue;
    // The diamond edge facing that neighbour: up-left is c-1, up-right r-1.
    const [a, b] = edges[i];
    const inward = i < 2 ? 1 : -1;
    for (let k = 0; k < 16; k++) {
      const x = Math.round(a.x + (b.x - a.x) * (k + 0.5) / 16);
      const y = Math.round(a.y + (b.y - a.y) * (k + 0.5) / 16);
      const col = Math.floor((x + y) / 3) % 2 ? '#3a3450' : '#ffd34d';
      px(g, x, y + (inward > 0 ? 0 : -1), 1, 2, col);
    }
  }
}

// Bright green goo, lying in a round pool. (cx, cy) is its centre.
function caveGooPool(g, cx, cy) {
  const rx = 40;
  const ry = 21;
  for (let y = -ry - 2; y <= ry + 2; y++) for (let x = -rx - 3; x <= rx + 3; x++) {
    const d = (x / rx) ** 2 + (y / ry) ** 2;
    if (d > 1.12) continue;
    let col = d > 1 ? '#3e3866' : d > 0.82 ? '#4fc860' : '#7fe870';
    if (d <= 0.82 && hash(x, y, 61) < 0.03) col = '#c8ff9a';
    if (d < 0.5 && Math.abs(y + 4 - x * 0.1) < 0.6 && x > -16 && x < 0) col = '#e8ffd0';
    px(g, Math.round(cx + x), Math.round(cy + y), 1, 1, col);
  }
}

// A little splat of goo on the floor.
function caveGooSplat(g, cx, cy) {
  for (const [dx, dy, r] of [[0, 0, 4], [-5, 1, 2], [5, -1, 2], [2, 3, 1.5]]) {
    for (let y = -r; y <= r; y++) for (let x = -r * 2; x <= r * 2; x++) {
      if ((x / (r * 2)) ** 2 + (y / r) ** 2 <= 1) px(g, cx + dx + x, cy + dy + y, 1, 1, y < 0 && x < 0 ? '#a8f070' : '#6fd860');
    }
  }
}

// Goo bubbles that swell and pop, in a loop.
function caveGooBubbles(ctx, cx, cy, t) {
  for (let i = 0; i < 6; i++) {
    const k = (t * 0.6 + i * 0.37) % 1;
    const bx = Math.round(cx + (hash(i, 1, 62) - 0.5) * 56);
    const by = Math.round(cy + (hash(i, 2, 62) - 0.5) * 22);
    if (k < 0.8) {
      const r = Math.round(1 + k * 3);
      px(ctx, bx - r, by - r, r * 2, r * 2, '#a8f070');
      px(ctx, bx - r + 1, by - r, 1, 1, '#ffffff');
      px(ctx, bx - r, by + r - 1, r * 2, 1, '#4fc860');
    } else {
      for (const [dx, dy] of [[-4, -3], [4, -3], [0, -5], [-3, 1], [3, 1]]) px(ctx, bx + dx, by + dy - Math.round((k - 0.8) * 20), 1, 1, '#c8ff9a');
    }
  }
}

// A heap of junk: grey lumps, a cog, a tyre and a spring.
function caveScrapHeap(ctx, cx, cy) {
  ctx.fillStyle = 'rgba(30,20,70,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const lumps = [[-6, -4, 6, '#8a94b0'], [5, -4, 6, '#7a84a0'], [0, -9, 6, '#a4aec4'], [-2, -14, 4, '#8a94b0']];
  for (const [dx, dy, R, col] of lumps) {
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      if (x * x + y * y > R * R) continue;
      px(ctx, cx + dx + x, cy + dy + y, 1, 1, x * x + y * y > (R - 1) * (R - 1) ? '#4a4a6a' : y < -R / 3 ? shade(col, 22) : col);
    }
  }
  // A tyre leaning on the left.
  for (let y = -5; y <= 5; y++) for (let x = -3; x <= 3; x++) {
    const d = (x / 3) ** 2 + (y / 5) ** 2;
    if (d <= 1 && d > 0.3) px(ctx, cx - 9 + x, cy - 4 + y, 1, 1, d > 0.8 ? '#2a2a3e' : '#46465e');
  }
  // A yellow cog on top.
  const gx = cx + 3;
  const gy = cy - 14;
  for (let a = 0; a < 8; a++) {
    const ang = a * Math.PI / 4;
    px(ctx, Math.round(gx + Math.cos(ang) * 5) - 1, Math.round(gy + Math.sin(ang) * 5) - 1, 2, 2, '#e0a52a');
  }
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
    const d = x * x + y * y;
    if (d <= 16 && d > 2) px(ctx, gx + x, gy + y, 1, 1, d > 9 ? '#e0a52a' : '#ffd34d');
  }
  // A spring poking out, and a tin can.
  for (let i = 0; i < 4; i++) px(ctx, cx - 4 + (i % 2), cy - 20 + i * 2, 3, 1, '#d8dce8');
  px(ctx, cx + 6, cy - 8, 4, 5, '#ff8f8f');
  px(ctx, cx + 6, cy - 8, 4, 1, '#d8dce8');
}

// An oil drum with a hazard band and glowing goo slopping over the top.
function caveBarrel(ctx, cx, cy, color) {
  ctx.fillStyle = 'rgba(30,20,70,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const H = 18;
  for (let dx = -6; dx <= 6; dx++) {
    const t = (dx + 6) / 12;
    const col = t < 0.25 ? shade(color, 30) : t > 0.75 ? shade(color, -40) : color;
    const bottom = cy - Math.round(Math.sqrt(1 - ((dx + 0.5) / 7) ** 2) * -2);
    px(ctx, cx + dx, bottom - H, 1, H, dx === -6 || dx === 6 ? shade(color, -80) : col);
    // Hazard band.
    px(ctx, cx + dx, bottom - 11, 1, 4, Math.floor((dx + 9) / 2) % 2 ? '#3a3450' : '#ffd34d');
    px(ctx, cx + dx, bottom - 3, 1, 1, shade(color, -60));
    px(ctx, cx + dx, bottom - H + 2, 1, 1, shade(color, -60));
  }
  // Goo top, with a drip down the front.
  for (let x = -6; x <= 6; x++) for (let y = -3; y <= 3; y++) {
    if ((x / 6.5) ** 2 + (y / 3) ** 2 <= 1) px(ctx, cx + x, cy - H - 1 + y, 1, 1, y < 0 && x < 0 ? '#c8ff9a' : '#7fe870');
  }
  px(ctx, cx + 2, cy - H + 1, 2, 5, '#7fe870');
  px(ctx, cx + 2, cy - H + 6, 2, 1, '#4fc860');
}

// A sparky coil: copper rings on a pole with a silver ball that crackles.
function caveTeslaCoil(ctx, cx, cy, t) {
  ctx.fillStyle = 'rgba(30,20,70,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, cx - 7, cy - 5, 14, 5, '#5c6684');
  px(ctx, cx - 7, cy - 5, 14, 1, '#8e98b0');
  px(ctx, cx - 7, cy - 3, 14, 1, '#ffd34d');
  px(ctx, cx - 2, cy - 26, 4, 22, '#8e98b0');
  px(ctx, cx - 2, cy - 26, 1, 22, '#c4cce0');
  for (let i = 0; i < 6; i++) {
    px(ctx, cx - 5, cy - 9 - i * 3, 10, 2, i % 2 ? '#d87a3a' : '#f0a050');
    px(ctx, cx - 5, cy - 9 - i * 3, 2, 2, '#ffc890');
  }
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
    const d = x * x + y * y;
    if (d <= 17) px(ctx, cx + x, cy - 32 + y, 1, 1, d > 11 ? '#6a7290' : x + y < -2 ? '#ffffff' : '#c4cce0');
  }
  // Little zigzag sparks, a new set every few frames.
  const step = Math.floor(t * 8);
  for (let s = 0; s < 2; s++) {
    if (hash(step, s, 63) < 0.35) continue;
    const ang = hash(step, s, 64) * Math.PI * 2;
    let x = cx + Math.cos(ang) * 4;
    let y = cy - 32 + Math.sin(ang) * 4;
    for (let k = 0; k < 4; k++) {
      x += Math.cos(ang) * 3 + (hash(step, s * 7 + k, 65) - 0.5) * 4;
      y += Math.sin(ang) * 3 + (hash(step, s * 7 + k, 66) - 0.5) * 4;
      px(ctx, Math.round(x), Math.round(y), 1, 1, k % 2 ? '#bfefff' : '#ffffff');
    }
  }
}

// The mad scientist's bench: bubbling flasks of every colour.
function caveLabTable(ctx, cx, cy) {
  ctx.fillStyle = 'rgba(30,20,70,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs and top.
  px(ctx, cx - 10, cy - 10, 2, 10, '#5c6684');
  px(ctx, cx + 8, cy - 10, 2, 10, '#5c6684');
  px(ctx, cx - 1, cy - 8, 2, 10, '#5c6684');
  px(ctx, cx - 12, cy - 13, 24, 4, '#c4cce0');
  px(ctx, cx - 12, cy - 10, 24, 1, '#8e98b0');
  const flask = (x, col, tall) => {
    const top = cy - 13 - tall;
    px(ctx, x - 1, top - 3, 2, 3, '#e4f4ff');
    for (let y = 0; y < tall; y++) {
      const w = Math.min(5, 1 + y);
      px(ctx, x - Math.ceil(w / 2), top + y, w, 1, y > tall / 3 ? col : '#e4f4ff');
    }
    px(ctx, x - 1, top + Math.floor(tall / 2), 1, 1, '#ffffff');
  };
  flask(cx - 7, '#ff6fa8', 7);
  flask(cx, '#7fe870', 10);
  flask(cx + 7, '#6fb8ff', 6);
  // Bubbles rising out of the middle flask.
  for (const [dx, dy] of [[1, -27], [-1, -31], [1, -35]]) px(ctx, cx + dx, cy + dy, 2, 2, '#c8ff9a');
}

// A big red button on a striped stand. Nobody knows what it does.
function caveBigButton(ctx, cx, cy) {
  ctx.fillStyle = 'rgba(30,20,70,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let dx = -6; dx <= 5; dx++) px(ctx, cx + dx, cy - 12, 1, 11, Math.floor((dx + 7) / 2) % 2 ? '#3a3450' : '#ffd34d');
  px(ctx, cx - 7, cy - 14, 14, 3, '#8e98b0');
  px(ctx, cx - 7, cy - 14, 14, 1, '#c4cce0');
  for (let y = -4; y <= 0; y++) for (let x = -5; x <= 5; x++) {
    if ((x / 5.5) ** 2 + (y / 4.5) ** 2 <= 1) px(ctx, cx + x, cy - 15 + y, 1, 1, x < -1 && y < -1 ? '#ffb0b0' : '#ff4f5f');
  }
  px(ctx, cx - 3, cy - 18, 2, 1, '#ffffff');
}

// A warning beacon by the entrance, its orange light spinning.
function caveBeacon(ctx, cx, cy, t) {
  ctx.fillStyle = 'rgba(30,20,70,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 6; i++) px(ctx, cx - 1, cy - 4 - i * 4, 3, 4, i % 2 ? '#3a3450' : '#ffd34d');
  px(ctx, cx - 4, cy - 28, 9, 3, '#5c6684');
  px(ctx, cx - 3, cy - 35, 7, 7, '#ff9a4a');
  px(ctx, cx - 2, cy - 37, 5, 2, '#ffbe5a');
  // The bright stripe of the spinning light sweeps across.
  const k = Math.floor(((t * 2) % 1) * 7);
  px(ctx, cx - 3 + k, cy - 35, 1, 7, '#fff6c8');
  px(ctx, cx - 4, cy - 28, 9, 1, '#8e98b0');
}

// Rocky cave walls with pipes, blinking lights and the boss's big screen.
function caveLairWalls(sc, H) {
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  const back = { x: k.L.x - 4, y: k.T.y - H - 30, w: k.R.x - k.L.x + 8, h: H + 36 + (k.R.y - k.T.y) };
  const WA = wall(k.L, k.T);
  const WB = wall(k.T, k.R);
  const obj = addObject(sc, { c: -1, r: -1, w: 1, d: 1 }, back, ctx => {
    drawCaveWall(ctx, WA, H, 1);
    drawCaveWall(ctx, WB, H, 2);
    // Pipes along both walls, with a valve wheel here and there.
    for (const W of [WA, WB]) {
      wallRect(ctx, W, 0, W.len, 14, 18, '#8e98b0');
      wallRect(ctx, W, 0, W.len, 17, 18, '#c4cce0');
      wallRect(ctx, W, 0, W.len, 14, 15, '#5c6684');
      for (let x = 20; x < W.len - 10; x += 46) {
        wallRect(ctx, W, x, x + 3, 12, 20, '#5c6684');
        wallRect(ctx, W, x + 10, x + 16, 19, 25, '#ff6f6f');
        wallRect(ctx, W, x + 12, x + 14, 21, 23, '#ffd34d');
      }
    }
    // The boss's big screen, showing his grinning, moustached face.
    const s0 = WA.len * 0.52;
    wallRect(ctx, WA, s0 - 4, s0 + 52, 28, 74, '#5c6684');
    wallRect(ctx, WA, s0 - 4, s0 + 52, 73, 74, '#c4cce0');
    wallRect(ctx, WA, s0, s0 + 48, 32, 70, '#2a6e5a');
    wallRect(ctx, WA, s0 + 2, s0 + 46, 34, 68, '#3f9f78');
    for (let v = 35; v < 68; v += 3) wallRect(ctx, WA, s0 + 2, s0 + 46, v, v + 1, '#4fb888');
    wallRect(ctx, WA, s0 + 8, s0 + 40, 40, 64, '#c4a8ff'); // face
    wallRect(ctx, WA, s0 + 8, s0 + 40, 63, 66, '#ffd34d'); // crown band
    for (const x of [s0 + 9, s0 + 22, s0 + 35]) wallRect(ctx, WA, x, x + 4, 66, 70, '#ffd34d');
    for (const x of [s0 + 13, s0 + 27]) {
      wallRect(ctx, WA, x, x + 7, 53, 59, '#ffffff');
      wallRect(ctx, WA, x + 3, x + 6, 54, 57, '#3a2340');
    }
    wallRect(ctx, WA, s0 + 11, s0 + 23, 47, 50, '#3a2340'); // moustache
    wallRect(ctx, WA, s0 + 25, s0 + 37, 47, 50, '#3a2340');
    wallRect(ctx, WA, s0 + 9, s0 + 12, 49, 52, '#3a2340');
    wallRect(ctx, WA, s0 + 36, s0 + 39, 49, 52, '#3a2340');
    wallRect(ctx, WA, s0 + 18, s0 + 30, 43, 45, '#c0507a'); // grin
    // A rolling shutter door on the right wall, with hazard stripes.
    const d0 = WB.len * 0.32;
    wallRect(ctx, WB, d0 - 3, d0 + 37, 0, 50, '#5c6684');
    wallRect(ctx, WB, d0, d0 + 34, 0, 46, '#a4aec4');
    for (let v = 3; v < 44; v += 4) wallRect(ctx, WB, d0, d0 + 34, v, v + 1, '#7a84a0');
    for (let x = 0; x < 34; x += 6) {
      wallRect(ctx, WB, d0 + x, d0 + x + 3, 0, 5, '#ffd34d');
      wallRect(ctx, WB, d0 + x + 3, d0 + x + 6, 0, 5, '#3a3450');
    }
  }, { background: true });
  obj.c0 = -10; obj.r0 = -10; obj.c1 = -10; obj.r1 = -10;

  // A string of blinking bulbs along the top of both walls.
  const bulbs = [];
  for (const W of [WA, WB]) for (let x = 12; x < W.len - 6; x += 22) bulbs.push(wallPt(W, x, H - 18));
  const cols = ['#ff6f6f', '#ffd34d', '#7fe870', '#6fb8ff', '#ff9cf0'];
  sc.objects.push({
    c0: -10, r0: -10, c1: -10, r1: -10, background: true, x: back.x, y: back.y, w: back.w, h: back.h,
    animated: (ctx, t) => bulbs.forEach((p, i) => {
      const on = Math.floor(t * 3 + i) % 3 !== 0;
      px(ctx, Math.round(p.x) - 1, Math.round(p.y) - 4, 3, 2, '#5c6684');
      px(ctx, Math.round(p.x) - 2, Math.round(p.y) - 2, 4, 4, on ? cols[i % cols.length] : shade(cols[i % cols.length], -90));
      if (on) px(ctx, Math.round(p.x) - 1, Math.round(p.y) - 2, 1, 1, '#ffffff');
    }),
  });
  for (const p of bulbs) sc.lamps.push({ x: p.x, y: p.y, small: true });
  // The screen glows.
  const sp = wallPt(WA, WA.len * 0.52 + 24, 51);
  sc.lamps.push({ x: sp.x, y: sp.y, big: true });
}

// ---- The fight -------------------------------------------------------------------

// Effects playing right now, drawn over the scene by drawCaveFx().
const caveFx = [];
const caveMuted = () => Sound.muted;

// The dialog steps aside while the robot and a villain fight, and the fight
// goes on without it: busyNow (js/game.js) counts that as showing, so
// closing the parent panel over it never frees the game. It is over when
// the dialog comes back (caveStepBack, or the next round's openDialog) or
// the villain gives up. The Crystal Cave's monsters step it aside the same
// way for their magic (js/cave-magic.js).
let caveAside = null; // the villain fighting with the dialog stepped aside
function caveStepAside(npc) {
  caveAside = npc;
  ui.dialog.classList.add('hidden');
}
function caveStepBack() {
  caveAside = null;
  ui.dialog.classList.remove('hidden');
}
const caveFighting = () => !!caveAside && state.talking === caveAside && ui.dialog.classList.contains('hidden');

// Says `parts`, then runs fn once the villain has finished talking, or
// after `ms` at the latest (the voice can be muted, slow or missing).
function caveSayThen(parts, who, fn, ms) {
  let done = false;
  const go = () => { if (!done) { done = true; fn(); } };
  Sound.say(parts.concat({ pause: 250 }, { call: go }), who);
  later(caveMuted() ? Math.min(ms, 1200) : ms, go);
}

// A short synthesized sound: a tone sliding from f0 to f1 Hz.
function caveTone(f0, f1, dur, type = 'square', gain = 0.05, delay = 0) {
  if (caveMuted()) return;
  const ac = Sound.unlock();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ac.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

// Called by openDialog for a cave villain: shows its hearts by its name and
// returns what it says before the question (null: its usual hello).
function villainRound(npc) {
  ui.name.insertAdjacentHTML('beforeend', ` <span style="font-size:0.8em;letter-spacing:1px">${'❤️'.repeat(npc.hp)}${'🤍'.repeat(VILLAIN_HP - npc.hp)}</span>`);
  const round = npc.round;
  npc.round = null;
  if (!round) caveStandBack(npc);
  return round ? line('villainNext') : null;
}

// The robot steps back a tile to face the villain from across the floor,
// so the fight has room. Stays put when there is no free tile.
function caveStandBack(npc) {
  const h = heroTile();
  const sc = state.scene;
  if (Math.abs(h.c - npc.c) + Math.abs(h.r - npc.r) !== 1) return;
  const back = { c: 2 * h.c - npc.c, r: 2 * h.r - npc.r };
  const spots = [back].concat([[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dc, dr]) => ({ c: h.c + dc, r: h.r + dr })))
    .filter(t => Math.abs(t.c - npc.c) + Math.abs(t.r - npc.r) === 2 && walkable(sc, t.c, t.r));
  if (spots.length) walkTo((c, r) => c === spots[0].c && r === spots[0].r, () => faceEachOther(npc));
}

// Where things happen, in world pixels: the hero's chest, the villain's middle.
function caveHeroAt(npc) {
  const p = heroWorld();
  if (!npc) return { x: p.x, y: p.y - 15 };
  // Just in front of the robot, on the villain's side.
  const v = tileCenter(state.scene, npc.c, npc.r);
  return { x: p.x + Math.sign(v.x - p.x) * 6, y: p.y - 15 };
}
function caveVillainAt(npc) {
  const p = tileCenter(state.scene, npc.c, npc.r);
  return { x: p.x, y: p.y - 12 };
}

// A right answer (from catchMonster): once the answer has been read out the
// robot fires at the villain, who loses a heart. Then the next question,
// or, with no hearts left, the villain gives up. `small`: she tapped the
// answer after it was shown (finishShown in game.js), which is a little
// tap of a punch, so every fight still ends.
function villainHit(npc, small) {
  state.answered++;
  const q = state.question;
  const fight = npc.fight = (npc.fight || 0) + 1;
  const live = () => npc.fight === fight && state.talking === npc;
  const said = small ? q.answer : [{ text: ui.text.textContent }, { pause: 300 }].concat(q.answer);
  caveSayThen(said, voiceOf(npc), () => {
    if (!live()) return;
    caveStepAside(npc);
    const kind = small ? 'tap' : npc.hp === 1 ? 'mega' : npc.hp === VILLAIN_HP ? 'laser' : 'punch';
    const impact = caveFire(kind, npc);
    later(impact, () => {
      if (!live()) return;
      npc.hp = Math.max(0, npc.hp - 1);
      if (npc.hp > 0) {
        caveSayThen([{ text: line('villainHit') }], voiceOf(npc), () => {
          if (!live()) return;
          npc.round = 'next';
          caveAside = null;
          openDialog(npc);
        }, 3200);
      } else villainGiveUp(npc);
    });
  }, 6000);
}

// Fires a laser, a rocket punch or, for the last heart, a mega laser.
// Returns the time in ms until it hits.
function caveFire(kind, npc) {
  const from = caveHeroAt(npc);
  const to = caveVillainAt(npc);
  const t0 = performance.now();
  const hit = kind === 'punch' || kind === 'tap' ? 420 : 260;
  if (kind === 'tap') {
    // Just a little bonk: no shake, a few sparks.
    caveFx.push({ kind: 'punch', t0, dur: 820, from, to, hit });
    caveTone(300, 420, 0.2, 'triangle', 0.035);
    later(hit, () => {
      caveFx.push({ kind: 'pow', t0: performance.now(), dur: 700, at: { x: to.x, y: to.y - 8 }, text: 'BONK', block: true });
      caveSparks(to, 6, ['#ffffff', '#bff4ff']);
    });
    return hit + 120;
  }
  if (kind === 'punch') {
    caveFx.push({ kind: 'punch', t0, dur: 820, from, to, hit });
    caveTone(180, 520, 0.35, 'sawtooth', 0.04);
  } else {
    caveFx.push({ kind: 'laser', t0, dur: kind === 'mega' ? 900 : 650, from, to, mega: kind === 'mega' });
    caveTone(1600, 300, 0.3, 'square', 0.05);
    if (kind === 'mega') caveTone(900, 120, 0.5, 'sawtooth', 0.04, 0.05);
  }
  later(hit, () => {
    caveFx.push({ kind: 'pow', t0: performance.now(), dur: 900, at: { x: to.x, y: to.y - 8 }, text: kind === 'punch' ? 'POW!' : kind === 'mega' ? 'KABOOM!' : 'ZAP!' });
    caveFx.push({ kind: 'shake', t0: performance.now(), dur: 420, npc, base: { c: npc.c, r: npc.r }, dir: Math.sign(to.x - from.x) || 1 });
    caveSparks(to, kind === 'mega' ? 40 : 22, ['#ffffff', '#fff07a', '#7fe8ff', '#ff9cf0']);
    caveTone(140, 60, 0.25, 'square', 0.07);
  });
  return hit + 120;
}

function caveSparks(p, n, colors) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 20 + Math.random() * 60;
    state.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.5 + Math.random() * 0.6, color: colors[i % colors.length], star: i % 2 === 0 });
  }
}

// No hearts left: a white flag, "I give up!", coins, and off it runs. It
// comes back after a while, like the monsters do.
function villainGiveUp(npc) {
  const sc = state.scene;
  npc.caught = true;
  mini.button.classList.add('hidden'); // its little game waits until it's back (js/minigame.js)
  const coins = npc.coins + Math.floor(Math.random() * (npc.coins + 1));
  caveFx.push({ kind: 'flag', t0: performance.now(), dur: 2600, npc });
  caveFx.push({ kind: 'bubble', t0: performance.now(), dur: 2400, npc, text: 'I give up!' });
  caveTone(700, 200, 0.6, 'triangle', 0.06);
  later(700, () => {
    caveSparks(caveVillainAt(npc), 30, ['#ffd34d', '#fff07a', '#e0a83a', '#ffffff']);
    state.coins += coins;
    save();
    renderCoins(true);
    Sound.coin();
    showPlace(`🪙 코인 ${coins}개!`);
  });
  caveSayThen([{ text: line('caught') }], voiceOf(npc), () => {
    // Off it runs, away from the robot, and out of sight.
    const from = tileCenter(sc, npc.c, npc.r);
    const h = heroWorld();
    const len = Math.hypot(from.x - h.x, from.y - h.y) || 1;
    caveFx.push({ kind: 'run', t0: performance.now(), dur: 1300, npc, from, dx: (from.x - h.x) / len, dy: (from.y - h.y) / len });
    caveTone(500, 900, 0.12, 'square', 0.03);
    caveTone(500, 900, 0.12, 'square', 0.03, 0.16);
    caveTone(500, 900, 0.12, 'square', 0.03, 0.32);
    sc.npcs = sc.npcs.filter(n => n !== npc);
    sc.caught.push(npc);
    npc.hp = VILLAIN_HP;
    const catchNo = npc.catches = (npc.catches || 0) + 1;
    later(MONSTER_RESPAWN_MS, () => { if (npc.catches === catchNo) respawnMonster(sc, npc); });
    if (caveAside === npc) caveAside = null; // the fight is over (before closeDialog asks busyNow)
    if (state.talking === npc) closeDialog();
  }, 3600);
}

// A wrong answer (from missed in game.js): she hears what she picked and
// the hint, then the villain throws something silly and the shield blocks
// it. That is quick and plain, so a miss is never the fun part. Then the
// same question again: the wrong card stays grey and she tries the others,
// or after a second miss the answer is shown and tapping it fires.
function villainMiss(npc, q, o, showIt) {
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
    const t0 = performance.now();
    const from = caveVillainAt(npc);
    const to = caveHeroAt();
    caveFx.push({ kind: 'shield', t0, dur: 1000, hit: 420 });
    caveFx.push({ kind: 'throw', t0, dur: 800, from, to, hit: 420, item: npc.throws });
    caveTone(300, 600, 0.3, 'triangle', 0.035);
    later(420, () => {
      caveFx.push({ kind: 'pow', t0: performance.now(), dur: 600, at: { x: to.x, y: to.y - 18 }, text: 'BLOCK', block: true });
      caveTone(880, 860, 0.15, 'square', 0.03);
    });
    later(1300, () => {
      if (!live()) return;
      caveStepBack();
      if (showIt) showAnswer(q, null);
      else listen(q, [], 0);
    });
  }, 7000);
}

// ---- Drawing the fight -----------------------------------------------------------

// Small pixel pictures used in a fight, pre-drawn once each.
const CAVE_BITMAPS = {
  heart:       { pal: { o: '#4a2c4f', r: '#ff4f6f', R: '#ffb0c0', g: '#6a5c88' }, rows: ['.oo.oo.', 'orRorro', 'oRrrrro', 'orrrrro', '.orrro.', '..oro..', '...o...'] },
  heartGone:   { pal: { o: '#4a2c4f', g: '#8a80a8' }, rows: ['.oo.oo.', 'oggoggo', 'ogggggo', 'ogggggo', '.oggo..', '..ogo..', '...o...'] },
  fist:        { pal: { o: '#3a3450', G: '#e4ecf8', g: '#a4aec4', b: '#3fb8ff', y: '#fff07a', r: '#ff9a4a' }, rows: ['.....oooooo.', '....oGGGGGGo', 'yy.obGGGGGgo', 'yrrobGgggGGo', 'yrrobGGGGGgo', 'yy.obGGGGGGo', '....oGGGGGgo', '.....oooooo.'] },
  flag:        { pal: { o: '#4a2c4f', w: '#ffffff', W: '#dde4f4', b: '#a8704a' }, rows: ['bwwwwwo', 'bwWwwwo', 'bwwwwWo', 'bwwwwwo', 'boooooo', 'b......', 'b......', 'b......', 'b......'] },
  sock:        { pal: { o: '#4a2c4f', w: '#ffffff', r: '#ff6f6f', g: '#c8c0a0' }, rows: ['oooo...', 'orro...', 'owwo...', 'orro...', 'owwooo.', 'owwwwwo', '.ooooo.'] },
  duck:        { pal: { o: '#4a2c4f', y: '#ffd34d', Y: '#e0a52a', r: '#ff9a4a', w: '#ffffff' }, rows: ['..ooo...', '.oyyyo..', '.oykyoo.', '.oyyyrro', 'ooyyyoo.', 'oyyyyyyo', 'oyYyyyyo', '.oooooo.'] },
  goo:         { pal: { o: '#2a6e3a', g: '#7fe870', G: '#c8ff9a' }, rows: ['..ooo..', '.oGggo.', 'oGggggo', 'ogggggo', 'ogggggo', '.ooooo.'] },
  banana:      { pal: { o: '#7a5a20', y: '#ffe066', Y: '#e0b030', b: '#6b4a3a' }, rows: ['.....b.', '....oyo', '...oyYo', '..oyyo.', 'ooyyo..', 'oyyo...', '.oo....'] },
  pie:         { pal: { o: '#7a4a2a', c: '#d8a060', w: '#ffffff', r: '#ff6f8f' }, rows: ['..wwrw..', '.wwwwww.', 'occcccco', '.oooooo.'] },
  marshmallow: { pal: { o: '#8a80a8', w: '#ffffff', p: '#ffd0e6' }, rows: ['.ooooo.', 'owwwwwo', 'owwppwo', 'owwwwwo', '.ooooo.'] },
};
const caveBitmapCache = {};
function caveBitmap(key) {
  if (!caveBitmapCache[key]) {
    const b = CAVE_BITMAPS[key];
    const cv = makeCanvas(Math.max(...b.rows.map(r => r.length)), b.rows.length);
    drawBitmap(cv.getContext('2d'), b.rows, b.pal, 0, 0);
    caveBitmapCache[key] = cv;
  }
  return caveBitmapCache[key];
}
// Draws a small bitmap centred at screen point (x, y), `k` screen pixels per pixel.
function caveBlit(ctx, key, x, y, k, flip) {
  const cv = caveBitmap(key);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(cv, -cv.width * k / 2, -cv.height * k / 2, cv.width * k, cv.height * k);
  ctx.restore();
}

// Called from drawOverlay every frame in the captain edition: villains'
// hearts and whatever effects are playing.
function drawCaveFx(now) {
  const sc = state.scene;
  const ctx = sctx;
  const s = state.scale;
  if (sc.kind !== 'dungeon') {
    for (const f of caveFx) if (f.kind === 'shake') Object.assign(f.npc, f.base);
    caveFx.length = 0;
    return;
  }

  // Hearts over each villain: above the speech bubble while she walks
  // around, just over its head in a fight.
  for (const n of sc.npcs) {
    if (!n.monster || n.hp === undefined) continue;
    const fighting = state.talking === n;
    if (!fighting && (state.busy || n.hp === VILLAIN_HP)) continue;
    const w = tileCenter(sc, n.c, n.r);
    const p = toScreen(w.x, w.y - (fighting ? 32 : 52));
    for (let i = 0; i < VILLAIN_HP; i++) caveBlit(ctx, i < n.hp ? 'heart' : 'heartGone', p.x + (i - 1) * 9 * s * 0.9, p.y, s * 0.9);
  }

  for (let i = caveFx.length - 1; i >= 0; i--) {
    const f = caveFx[i];
    const k = (now - f.t0) / f.dur;
    if (k >= 1) {
      if (f.kind === 'shake') Object.assign(f.npc, f.base);
      caveFx.splice(i, 1);
      continue;
    }
    if (k < 0) continue;
    const ms = now - f.t0;
    if (f.kind === 'laser') caveDrawLaser(ctx, f, ms, s);
    else if (f.kind === 'punch') caveDrawPunch(ctx, f, ms, s);
    else if (f.kind === 'throw') caveDrawThrow(ctx, f, ms, s);
    else if (f.kind === 'shield') caveDrawShield(ctx, f, ms, s);
    else if (f.kind === 'pow') caveDrawPow(ctx, f, k, s);
    else if (f.kind === 'shake') {
      // Knocked back a little, wobbling, then back in place.
      const a = Math.sin(k * Math.PI) * 0.18 + Math.sin(k * 40) * 0.05 * (1 - k);
      f.npc.c = f.base.c + a * (f.dir > 0 ? 1 : -1) * 0.7;
      f.npc.r = f.base.r - a * (f.dir > 0 ? 1 : -1) * 0.7;
    } else if (f.kind === 'flag') {
      if (!sc.npcs.includes(f.npc)) continue;
      const w = tileCenter(sc, f.npc.c, f.npc.r);
      const p = toScreen(w.x + 8, w.y - 30);
      caveBlit(ctx, 'flag', p.x + Math.sin(now / 90) * s * 0.5, p.y, s * 1.5);
    } else if (f.kind === 'bubble') {
      if (!sc.npcs.includes(f.npc)) continue;
      const w = tileCenter(sc, f.npc.c, f.npc.r);
      caveDrawBubble(ctx, toScreen(w.x - 10, w.y - 42), f.text, s, Math.min(1, k * 8));
    } else if (f.kind === 'run') caveDrawRun(ctx, f, k, now, s);
  }
}

function caveDrawLaser(ctx, f, ms, s) {
  const a = toScreen(f.from.x, f.from.y);
  const b = toScreen(f.to.x, f.to.y);
  const dur = f.dur;
  // Charge up for a moment, then the beam shoots across and fades.
  const charge = Math.min(1, ms / 180);
  const reach = Math.max(0, Math.min(1, (ms - 120) / 140));
  const fade = ms > dur - 250 ? (dur - ms) / 250 : 1;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = fade;
  const r = (f.mega ? 7 : 4) * s * charge * (0.85 + 0.15 * Math.sin(ms / 30));
  ctx.drawImage(glow(), a.x - r * 2, a.y - r * 2, r * 4, r * 4);
  if (reach > 0) {
    const x = a.x + (b.x - a.x) * reach;
    const y = a.y + (b.y - a.y) * reach;
    const wob = 1 + 0.2 * Math.sin(ms / 25);
    const cols = f.mega ? [['#ff6fa8', 9], ['#ffd34d', 6], ['#ffffff', 2.5]] : [['#3fb8ff', 5], ['#7fe8ff', 3], ['#ffffff', 1.2]];
    ctx.lineCap = 'round';
    for (const [col, wd] of cols) {
      ctx.strokeStyle = col;
      ctx.lineWidth = wd * s * wob;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    if (reach >= 1) {
      const R = (f.mega ? 18 : 11) * s * wob;
      ctx.drawImage(glow(), b.x - R, b.y - R, R * 2, R * 2);
    }
  }
  ctx.restore();
}

function caveDrawPunch(ctx, f, ms, s) {
  // Out to the villain, then back home to the robot's arm.
  const out = Math.min(1, ms / f.hit);
  const back = Math.max(0, (ms - f.hit - 80) / (f.dur - f.hit - 80));
  const k = ms < f.hit + 80 ? out * out : 1 - back;
  const a = toScreen(f.from.x, f.from.y);
  const b = toScreen(f.to.x, f.to.y);
  const x = a.x + (b.x - a.x) * k;
  const y = a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * 6 * s;
  const flip = b.x < a.x;
  // A puffy trail behind it on the way out.
  if (ms < f.hit) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i <= 4; i++) {
      const t = Math.max(0, k - i * 0.08);
      ctx.globalAlpha = 0.5 - i * 0.1;
      const r = (5 - i) * s;
      ctx.drawImage(glow(), a.x + (b.x - a.x) * t - r, a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 6 * s - r, r * 2, r * 2);
    }
    ctx.restore();
  }
  caveBlit(ctx, 'fist', x, y, s * 1.6, flip);
}

function caveDrawThrow(ctx, f, ms, s) {
  const a = toScreen(f.from.x, f.from.y);
  const b = toScreen(f.to.x, f.to.y);
  // Shield sits a little in front of the robot, toward the villain.
  const stop = 0.62;
  let x;
  let y;
  if (ms < f.hit) {
    const k = (ms / f.hit) * stop;
    x = a.x + (b.x - a.x) * k;
    y = a.y + (b.y - a.y) * k - Math.sin((k / stop) * Math.PI) * 14 * s;
  } else {
    // Bounced off: up and away, tumbling.
    const t = (ms - f.hit) / 1000;
    const hx = a.x + (b.x - a.x) * stop;
    const hy = a.y + (b.y - a.y) * stop;
    const dir = Math.sign(a.x - b.x) || 1;
    x = hx + dir * t * 70 * s;
    y = hy - t * 90 * s + t * t * 260 * s;
    ctx.globalAlpha = Math.max(0, 1 - t * 1.6);
  }
  caveBlit(ctx, f.item || 'sock', x, y, s * 1.5, Math.floor(ms / 120) % 2 === 0);
  ctx.globalAlpha = 1;
}

function caveDrawShield(ctx, f, ms, s) {
  const h = caveHeroAt();
  const p = toScreen(h.x, h.y - 2);
  const grow = Math.min(1, ms / 150);
  const fade = ms > f.dur - 300 ? (f.dur - ms) / 300 : 1;
  const flash = Math.max(0, 1 - Math.abs(ms - f.hit) / 160);
  const rx = 17 * s * grow * (1 + flash * 0.1);
  const ry = 21 * s * grow * (1 + flash * 0.1);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = `rgba(127,232,255,${0.18 + flash * 0.3})`;
  ctx.strokeStyle = flash > 0.2 ? '#ffffff' : '#7fe8ff';
  ctx.lineWidth = (1.5 + flash * 1.5) * s;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Honeycomb lines shimmering across it.
  ctx.globalAlpha = fade * 0.45;
  ctx.strokeStyle = '#d8f8ff';
  ctx.lineWidth = 0.6 * s;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  const hex = 6 * s;
  const shift = (ms / 20) % (hex * 2);
  for (let gy = -ry - hex; gy < ry + hex; gy += hex * 1.5) {
    for (let gx = -rx - hex * 2; gx < rx + hex * 2; gx += hex * 1.74) {
      const ox = gx + ((Math.round(gy / (hex * 1.5)) % 2) ? hex * 0.87 : 0);
      ctx.moveTo(p.x + ox + hex * 0.87, p.y + gy + shift * 0.1);
      for (let i = 1; i <= 6; i++) {
        const ang = i * Math.PI / 3 - Math.PI / 6;
        ctx.lineTo(p.x + ox + Math.cos(ang) * hex, p.y + gy + shift * 0.1 + Math.sin(ang) * hex);
      }
    }
  }
  ctx.stroke();
  ctx.restore();
}

// A comic-book burst with a big word in it.
function caveDrawPow(ctx, f, k, s) {
  const p = toScreen(f.at.x, f.at.y);
  const pop = k < 0.15 ? k / 0.15 * 1.25 : k < 0.25 ? 1.25 - (k - 0.15) * 2.5 : 1;
  const z = s * pop * (f.text.length > 5 ? 0.75 : 0.85);
  ctx.save();
  ctx.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 1;
  ctx.translate(p.x, p.y - k * 6 * s);
  ctx.rotate(f.block ? 0.12 : -0.15);
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const r = (i % 2 ? 9 : 15) * z * (i % 4 === 0 ? 1.15 : 1);
    const ang = i * Math.PI / 12;
    ctx.lineTo(Math.cos(ang) * r * 1.5, Math.sin(ang) * r);
  }
  ctx.closePath();
  ctx.fillStyle = f.block ? '#bff4ff' : '#fff07a';
  ctx.strokeStyle = f.block ? '#3fb8ff' : '#ff6f6f';
  ctx.lineWidth = 1.5 * s;
  ctx.fill();
  ctx.stroke();
  ctx.font = `800 ${8 * z}px "Baloo 2", "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 2 * s;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeText(f.text, 0, z * 0.5);
  ctx.fillStyle = f.block ? '#1f6fb8' : '#e8344f';
  ctx.fillText(f.text, 0, z * 0.5);
  ctx.restore();
}

// A speech bubble with a short line in it, its tail pointing down to (p.x, p.y + …).
function caveDrawBubble(ctx, p, text, s, pop) {
  ctx.save();
  ctx.font = `800 ${7 * s}px "Baloo 2", "Trebuchet MS", sans-serif`;
  const w = ctx.measureText(text).width + 8 * s;
  const h = 12 * s;
  ctx.translate(p.x, p.y);
  ctx.scale(pop, pop);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#4a2c4f';
  ctx.lineWidth = s * 0.8;
  roundRect(ctx, -w / 2, -h / 2, w, h, 4 * s);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w / 4 - 2 * s, h / 2 - 1);
  ctx.lineTo(w / 4 + 2 * s, h / 2 + 4 * s);
  ctx.lineTo(w / 4 + 3 * s, h / 2 - 1);
  ctx.fill();
  ctx.fillStyle = '#4a2c4f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0.5 * s);
  ctx.restore();
}

// The beaten villain hops away, waving its flag, and fades out of sight.
function caveDrawRun(ctx, f, k, now, s) {
  const sprite = villagerSprite(f.npc.look, 0);
  const d = k * 70;
  const hop = Math.abs(Math.sin(k * Math.PI * 6)) * 5;
  const w = { x: f.from.x + f.dx * d, y: f.from.y + f.dy * d * 0.6 - hop };
  const p = toScreen(w.x, w.y);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1;
  ctx.translate(Math.round(p.x), Math.round(p.y));
  if (f.dx < 0) ctx.scale(-1, 1);
  ctx.drawImage(sprite.canvas, -sprite.ax * s, -sprite.ay * s, sprite.canvas.width * s, sprite.canvas.height * s);
  ctx.restore();
  ctx.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1;
  caveBlit(ctx, 'flag', p.x + (f.dx < 0 ? -8 : 8) * s + Math.sin(now / 70) * s * 0.5, p.y - 28 * s, s * 1.5);
  ctx.globalAlpha = 1;
  // Little dust puffs at its feet.
  if (Math.random() < 0.5) {
    state.particles.push({ x: w.x, y: w.y + hop, vx: -f.dx * 20 + (Math.random() - 0.5) * 20, vy: -10, life: 0.4, color: '#d8d0f0', star: false });
  }
}
