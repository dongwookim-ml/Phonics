// Captain edition: Robot Town, its workshops, Captain HQ (the castle), the
// HQ library upstairs and the captain's own room. Same map, links and letter
// houses as the princess town, re-skinned with robots, bolts and bright paint.
//
// The top level only touches data.js tables (tools/tts-phrases.js runs this
// file without a DOM); all drawing lives inside functions.

// ---- Robot villagers ---------------------------------------------------------

// Who lives in Robot Town. Same spots as the princess villagers.
const ROBOT_TOWN_NPCS = [
  { name: '경비 로봇',     look: 'botguard',  c: 18, r: 11 },
  { name: '꽃밭 로봇',     look: 'botgarden', c: 5,  r: 19 },
  { name: '할머니 로봇',   look: 'botgranny', c: 16, r: 18 },
  { name: '낚시 로봇',     look: 'botfisher', c: 27, r: 28 },
  { name: '빵 굽는 로봇',  look: 'botchef',   c: 12, r: 16 },
  { name: '꼬마 로봇',     look: 'botkid',    c: 34, r: 19 },
  { name: '음악 로봇',     look: 'botdj',     c: 23, r: 21 },
  { name: '농장 로봇',     look: 'botfarm',   c: 9,  r: 31 },
];
// Who runs each letter workshop (by letter; the houses keep their spots).
const ROBOT_HOUSE_FOLK = {
  A: { who: '우주비행사 로봇', look: 'botastro' },
  B: { who: '공놀이 로봇',     look: 'botkid' },
  C: { who: '고양이 로봇',     look: 'botcat' },
  D: { who: '강아지 로봇',     look: 'botdog' },
  F: { who: '소방관 로봇',     look: 'botfire' },
  G: { who: '선물 할머니 로봇', look: 'botgranny' },
  H: { who: '헬리콥터 로봇',   look: 'botheli' },
  M: { who: '달님 로봇',       look: 'botdj' },
  N: { who: '너트 로봇',       look: 'botfarm' },
  P: { who: '피자 요리 로봇',  look: 'botchef' },
  S: { who: '별님 로봇',       look: 'botgarden' },
  T: { who: '기차 로봇',       look: 'botguard' },
};
// Captain HQ: the commander and crew stand where the king, queen and maid do.
const CAPTAIN_HQ_NPCS = [
  { name: '사령관 로봇', look: 'botboss',  c: 4,  r: 1 },
  { name: '조종사 로봇', look: 'botpilot', c: 7,  r: 1 },
  { name: '정비 대원',   look: 'botcrew',  c: 10, r: 8 },
];
// Upstairs: the librarian (library.js finds her by the `librarian` look)
// and the radio operator at her console.
const ROBOT_UP_NPCS = [
  { name: '본부 사서 로봇', look: 'librarian', c: 2, r: 4 },
  { name: '통신 로봇',     look: 'botradio',  c: 6, r: 2 },
];

if (isCaptain()) {
  TOWN_NPCS.splice(0, TOWN_NPCS.length, ...ROBOT_TOWN_NPCS);
  for (const h of TOWN_HOUSES) Object.assign(h, ROBOT_HOUSE_FOLK[h.letter]);
  CASTLE_UP_NPCS.splice(0, CASTLE_UP_NPCS.length, ...ROBOT_UP_NPCS);
  // Robots are drawn from bitmaps by monsterSprite() (see registerRobots).
  for (const k of ['botguard', 'botgarden', 'botgranny', 'botfisher', 'botchef', 'botkid', 'botdj', 'botfarm',
    'botastro', 'botcat', 'botdog', 'botfire', 'botheli', 'botboss', 'botpilot', 'botcrew', 'botradio']) LOOKS[k] = { monster: k };
  LOOKS.librarian = { monster: 'botlibrarian' };

  Object.assign(VOICES, {
    botguard:  { gender: 'male',   tts: 'am_michael',  pitch: 0.8,  rate: 0.92, voice: ['Daniel', 'Google UK English Male', 'Microsoft Ryan'] },
    botgarden: { gender: 'female', tts: 'af_bella',    pitch: 1.35, rate: 1.0,  voice: ['Samantha', 'Microsoft Aria', 'Google US English'] },
    botgranny: { gender: 'female', tts: 'bf_isabella', pitch: 1.05, rate: 0.82, voice: ['Moira', 'Martha', 'Microsoft Hazel'] },
    botfisher: { gender: 'male',   tts: 'am_eric',     pitch: 0.85, rate: 0.95, voice: ['Fred', 'Rishi', 'Microsoft Guy'] },
    botchef:   { gender: 'male',   tts: 'am_adam',     pitch: 1.0,  rate: 1.0,  voice: ['Alex', 'Tom', 'Microsoft Andrew'] },
    botkid:    { gender: 'female', tts: 'af_sky',      pitch: 1.65, rate: 1.08, voice: ['Junior', 'Zoe', 'Microsoft Ana'] },
    botdj:     { gender: 'male',   tts: 'bm_fable',    pitch: 1.2,  rate: 1.05, voice: ['Oliver', 'Gordon', 'Microsoft Brian'] },
    botfarm:   { gender: 'male',   tts: 'am_liam',     pitch: 0.9,  rate: 0.92, voice: ['Aaron', 'Fred', 'Microsoft Christopher'] },
    botastro:  { gender: 'female', tts: 'af_nicole',   pitch: 1.2,  rate: 1.0,  voice: ['Samantha', 'Karen', 'Microsoft Jenny'] },
    botcat:    { gender: 'female', tts: 'af_jessica',  pitch: 1.5,  rate: 1.05, voice: ['Tessa', 'Zoe', 'Microsoft Aria'] },
    botdog:    { gender: 'male',   tts: 'am_puck',     pitch: 1.35, rate: 1.08, voice: ['Oliver', 'Tom', 'Microsoft Brian'] },
    botfire:   { gender: 'male',   tts: 'am_michael',  pitch: 0.95, rate: 1.0,  voice: ['Fred', 'Aaron', 'Microsoft Guy'] },
    botheli:   { gender: 'female', tts: 'af_river',    pitch: 1.3,  rate: 1.05, voice: ['Karen', 'Samantha', 'Microsoft Aria'] },
    botboss:   { gender: 'male',   tts: 'bm_george',   pitch: 0.65, rate: 0.88, voice: ['Arthur', 'Daniel', 'Google UK English Male'] },
    botpilot:  { gender: 'female', tts: 'bf_alice',    pitch: 1.1,  rate: 0.95, voice: ['Serena', 'Kate', 'Google UK English Female'] },
    botcrew:   { gender: 'female', tts: 'bf_lily',     pitch: 1.25, rate: 1.0,  voice: ['Karen', 'Tessa', 'Microsoft Libby'] },
    botradio:  { gender: 'female', tts: 'af_nova',     pitch: 1.4,  rate: 1.05, voice: ['Zoe', 'Allison', 'Microsoft Ana'] },
  });

  // Greetings in each robot's own style. {title} {name} is "Captain Max".
  Object.assign(PERSONA, {
    botguard:  ['Beep! Halt! Oh, it is you, {title} {name}! You may pass.', 'Guard robot reporting for duty, {title}!', 'All clear at the HQ gate! Fancy a word game?'],
    botgarden: ['Hello, {title} {name}! I water the flowers with my robot arm.', 'Look! My sunflowers grew taller than my antenna!', 'Beep boop! Flowers and robots are best friends.'],
    botgranny: ['Oh, my dear {title} {name}! Grandma Bot is so happy to see you!', 'Come here, sweetie. I just oiled my squeaky knees.', 'Hello, darling! I knitted a cozy sock for my antenna.'],
    botfisher: ['Ahoy, {title} {name}! My magnet rod caught a tin can again!', 'Splash! The fish are jumping today.', 'Hello there! I am fishing for words. Want one?'],
    botchef:   ['Good morning, {title} {name}! My robot oven makes the best bread.', 'Beep! Fresh cookies, shaped like little bolts!', 'Welcome! I baked a cake with sprinkles and springs!'],
    botkid:    ['Hey, {title} {name}! Wanna race? I am super fast!', 'Yay, you came! Zoom zoom! I have a word for you.', 'Hi hi hi! Guess what? My wheels are brand new!'],
    botdj:     ['Boom, boom, beep! Hello, {title} {name}! Let me play you a word.', 'Welcome, {title}! My speakers love a good word.', 'Ding ding! A musical word, coming right up!'],
    botfarm:   ['Howdy, {title} {name}! My robot carrots are growing so big.', 'Hello there! The robot cows say moo, beep!', 'Morning, {title}! Busy day on the robot farm.'],
    botastro:  ['Hello, {title} {name}! I just came back from the moon!', 'Three, two, one, blast off! Ready for a word?', 'Beep! Space is fun, but words are even more fun.'],
    botcat:    ['Meow, beep! Hello, {title} {name}!', 'Purr, purr! My motor purrs like a real cat.', 'Hi! I chase laser dots all day long. Want to play?'],
    botdog:    ['Woof, beep, woof! Hello, {title} {name}!', 'I can wag my tail at super speed! Look!', 'Hi! I fetched a bolt for you. Want a word too?'],
    botfire:   ['Hello, {title} {name}! Fire robot, ready to help!', 'Whoosh! My water hose is all ready.', 'Safety first, {title}! Now, how about a word?'],
    botheli:   ['Whirr, whirr! Hello, {title} {name}!', 'I just flew over the whole town. It looks so tiny!', 'Hi! My propeller is spinning. Ready for a word?'],
    botboss:   ['There you are, {title} {name}! The commander has a mission for you.', 'Good job out there, {title}! Ready for a word mission?', 'Ho ho! Captain on deck! Let us play a word game.'],
    botpilot:  ['Hello, {title} {name}! Did you have fun in Robot Town today?', 'Pilot robot here! Let me hear how well you listen.', 'Welcome back to base, {title}! You look super strong.'],
    botcrew:   ['Hello, {title} {name}! I fixed the HQ doors today. Now, a word game?', 'Hello, {title}! I polished your room. Ready for a word?', 'Crew robot reporting! Shall I give you a word?'],
    botradio:  ['Beep beep! Radio robot here. Hello, {title} {name}!', 'I hear messages from all over town! Here is one for you.', 'Welcome to the radio room, {title}! Ready to listen?'],
    librarian: ['Welcome to the HQ library, {title} {name}!', 'Every book in here is full of words. Shall we find one?', 'Ah, {title} {name}! I was just reading about rockets.'],
  });

  // Sentence questions about princesses and unicorns get robot-world ones.
  const swap = {
    'A unicorn has a shiny {}.': { s: 'A rocket flies to the {}.', w: ['moon', '🌙'], alike: ['spoon', 'noon'], other: [['cake', '🎂'], ['fish', '🐟']] },
    'The princess wears a gold {}.': { s: 'The robot has a shiny {}.', w: ['bolt', '🔩'], alike: ['boat', 'bowl'], other: [['cow', '🐄'], ['bus', '🚌']] },
    'The king lives in a big {}.': { s: 'The dinosaur has a long {}.', w: ['tail', '🦖'], alike: ['tall', 'pail'], other: [['cup', '🥤'], ['sock', '🧦']] },
    'The fairy waves her magic {}.': { s: 'The fire truck puts out the {}.', w: ['fire', '🔥'], alike: ['tire', 'wire'], other: [['pig', '🐷'], ['cake', '🎂']] },
    'The prince rides a white {}.': { s: 'The race car goes very {}.', w: ['fast', '🏎️'], alike: ['last', 'fist'], other: [['cake', '🎂'], ['spoon', '🥄']] },
  };
  SENTENCES.forEach((x, i) => { if (swap[x.s]) SENTENCES[i] = swap[x.s]; });

  // Narrator and reward lines that talked about castles, dresses and wardrobes.
  Object.assign(LINES, {
    room: ['Here is your room, {title}!', 'Welcome to your own room, {title}!', 'Your workbench is waiting for you!'],
    castle: ['Welcome back to HQ, {title}!', 'Back to base!', 'Captain on deck!'],
    house: ['Knock, knock! The {letter} workshop!', 'Here is the {letter} workshop!', "Let's visit the {letter} workshop!"],
    start: ["Good morning, {title} {name}! Let's visit Robot Town!", 'What a sunny day, {title} {name}! Shall we go and say hello to the robots?'],
    upstairs: ['Up, up, up the stairs!', 'Up we go to the second floor!', 'Look, the HQ library is up here!'],
  });
}

// ---- Robot sprites -------------------------------------------------------------

// Robots are put together from parts, 16 pixels wide, stacked top to bottom
// (antenna or hat, head, body, legs) and centred in a 20-pixel bitmap. The
// result goes to MONSTERS, so monsterSprite() inks the outline like it does
// for the cave monsters. Letters are colours:
//   b B D  paint, its highlight and its shade     t T  trim and dark trim
//   s e    face screen and its glowing eyes        F    face plate
//   j J    light and dark joints                   a l  antenna and its bulb
//   c      chest panel                             h H  hat and hat shade
//   x X n  things held or worn                     y r g  yellow, red, green
// and k w p m (eyes, white, cheeks, mouth) as for the monsters.
const BOT_PARTS = {
  top: {
    one:   ['.......ll.......', '.......aa.......', '......JJJJ......'],
    bulb:  ['.......ll.......', '......llll......', '.......aa.......', '......JJJJ......'],
    two:   ['..l..........l..', '...a........a...', '....a......a....'],
    crest: ['......rrrr......', '.....rrrrrr.....', '......tttt......'],
    chef:  ['....hhhhhhhh....', '...hhhhhhhhhh...', '...hhhhhhhhhh...', '....hhhhhhhh....', '....HHHHHHHH....'],
    straw: ['.....hhhhhh.....', '....hhhhhhhh....', '....HHHHHHHH....', 'hhhhhhhhhhhhhhhh'],
    fire:  ['.....hhhhhh.....', '...hhhhyyhhhh...', '..hhhhhyyhhhhh..', 'HHHHHHHHHHHHHHHH'],
    cap:   ['.....hhhhhh.....', '...hhhhyyhhhh...', '..hhhhyyyyhhhh..', '..HHHHHHHHHHHHHH'],
    bun:   ['......hhhh......', '.....hHhhhh.....', '......hhhh......'],
    cat:   ['..b..........b..', '..bb........bb..', '.bpbb......bbpb.'],
    prop:  ['.xxxxxx..xxxxxx.', '.......JJ.......', '.......JJ.......'],
    phones: ['....XXXXXXXX....', '...X........X...'],
    none:  [],
  },
  head: {
    tv: [
      '...BBBBBBBBBB...',
      '..BBbbbbbbbbbD..',
      'jjBbssssssssbDjj',
      'jjBbseesseesbDjj',
      'jjBbseesseesbDjj',
      '..BbsessssesbD..',
      '..BbsseeeessbD..',
      '..BbssssssssbD..',
      '..bbbbbbbbbbbD..',
      '...DDDDDDDDDD...',
    ],
    dome: [
      '....bbbbbbbb....',
      '..bBBBBBbbbbbb..',
      '.bBBbbbbbbbbbbD.',
      '.bBFFFFFFFFFFbD.',
      'jbFFkwFFFFkwFFDj',
      'jbFFkkFFFFkkFFDj',
      '.bFpFFFmmFFFpFD.',
      '.bbFFFFFFFFFFbD.',
      '..DbbbbbbbbbbD..',
      '...DDDDDDDDDD...',
    ],
    visor: [
      '.....bbbbbb.....',
      '...bbBBBBbbbb...',
      '..bBBbbbbbbbbD..',
      '..bBssssssssbD..',
      '..bseeesseeesD..',
      '..bBssssssssbD..',
      '..bbbbbmmbbbbD..',
      '...DbbbbbbbbD...',
      '....DDDDDDDD....',
    ],
  },
  body: {
    box: [
      '......JJJJ......',
      '..ttbbbbbbbbtt..',
      '.tttBccccccDttt.',
      '.jj.BcrcgycD.jj.',
      '.jj.BccccccD.jj.',
      '.jj.BbbbbbbD.jj.',
      '.TT.bbbbbbbD.TT.',
      '....DDDDDDDD....',
    ],
    round: [
      '......JJJJ......',
      '....bbbbbbbb....',
      '.tt.BBccccbbD.tt',
      '.jjbBcyccrcbDjj.',
      '.jjbBccccccbDjj.',
      '.TT.bbbbbbbbDTT.',
      '.....DDDDDD.....',
    ],
    small: [
      '......JJJJ......',
      '...ttbbbbbbtt...',
      '...jBBccccbDj...',
      '...jBcrcgcbDj...',
      '...TbbbbbbbDT...',
      '.....DDDDDD.....',
    ],
  },
  legs: {
    legs:   ['.....jj..jj.....', '.....JJ..JJ.....', '....ttt..ttt....'],
    treads: ['....jjjjjjjj....', '...JJJJJJJJJJ...', '..JjJjJjJjJjJJ..', '...JJJJJJJJJJ...'],
    wheel:  ['......jjjj......', '.....JJJJJJ.....', '....JjjjjjjJ....', '.....JJJJJJ.....'],
    jets:   ['.....jj..jj.....', '.....yy..yy.....', '......r..r......'],
  },
};

// Things held or worn, drawn over the robot. `at` is 'top', 'head' or 'body'
// (y counts from the first row of that part) and x is in the 20-pixel bitmap.
const BOT_ITEMS = {
  shield: { at: 'body', x: 0, y: 2, rows: ['XXXX', 'XyyX', 'XyyX', '.XX.'] },
  can:    { at: 'body', x: 15, y: 4, rows: ['xxx.x', 'xxxx.', 'xxx..'] },
  rod:    { at: 'body', x: 15, y: -1, rows: ['...XX', '...Xw', '..X.w', '..X.w', '.X..r', '.X...', 'X....', 'X....'] },
  spoon:  { at: 'body', x: 16, y: 2, rows: ['ww', 'ww', '.X', '.X', '.X'] },
  wrench: { at: 'body', x: 16, y: 2, rows: ['X.X', 'XXX', '.X.', '.X.', '.X.'] },
  book:   { at: 'body', x: 15, y: 4, rows: ['rrrr', 'rwwr', 'rrrr'] },
  hose:   { at: 'body', x: 15, y: 3, rows: ['.xxx', 'x..x', 'x.xx', '.xxX'] },
  carrot: { at: 'body', x: 16, y: 3, rows: ['.g.', 'nnn', '.n.', '.n.'] },
  flower: { at: 'top', x: 11, y: -1, rows: ['.rr.', 'ryyr', '.rr.'] },
  glasses: { at: 'head', x: 2, y: 3, rows: ['...XXXX..XXXX...', '...X..XXXX..X...', '...X..X..X..X...', '...XXXX..XXXX...'] },
  cups:   { at: 'head', x: 2, y: 2, rows: ['XX............XX', 'XX............XX', 'XX............XX', 'XX............XX'] },
  stache: { at: 'head', x: 2, y: 6, rows: ['.....XXXXXX.....', '....XX....XX....'] },
  star:   { at: 'body', x: 2, y: 2, rows: ['......y', '.....yyy', '......y'] },
  flag:   { at: 'body', x: 2, y: 3, rows: ['......rw', '......wb'] },
  dogears: { at: 'head', x: 0, y: 1, rows: ['.xx..............xx.', 'xxx..............xxx', 'xxx..............xxx', 'xx................xx', 'x..................x'] },
  tail:   { at: 'body', x: 15, y: 3, rows: ['...x', '..x.', 'xx..'] },
  whisk:  { at: 'head', x: 0, y: 5, rows: ['XX................XX', '..X..............X..'] },
  tongue: { at: 'head', x: 2, y: 7, rows: ['.......pp.......'] },
  speaker: { at: 'body', x: 2, y: 2, rows: ['.....XXXXXX.....', '.....XnnnnX.....', '.....XnXXnX.....', '.....XnnnnX.....'] },
  ball:   { at: 'body', x: 16, y: 3, rows: ['.ww.', 'wXww', 'wwXw', '.ww.'] },
};

// Each robot: its parts, colours and items. Unset colours come from `b`.
const ROBOTS = {
  botguard:  { top: 'crest', head: 'tv', body: 'box', legs: 'legs', items: ['shield'], pal: { b: '#6fa8ff', t: '#ffd34d', c: '#e4f2ff', s: '#25365a', e: '#8ff8ff', X: '#e0a52a' } },
  botgarden: { top: 'one', head: 'dome', body: 'round', legs: 'legs', items: ['can', 'flower'], pal: { b: '#8fe0b0', t: '#ff9ec4', F: '#f4fff8', l: '#ff9ec4', x: '#5ab8e8' } },
  botgranny: { top: 'bun', head: 'dome', body: 'round', legs: 'wheel', items: ['glasses'], pal: { b: '#c8b4ff', t: '#ff9ec4', F: '#fff6fb', h: '#eceaf4', X: '#8a6ad8' } },
  botfisher: { top: 'cap', head: 'tv', body: 'box', legs: 'legs', items: ['rod'], pal: { b: '#ffd34d', t: '#4fa8e8', c: '#fff6cc', s: '#2a4560', e: '#8ff8ff', h: '#4fa8e8', X: '#9a6a44' } },
  botchef:   { top: 'chef', head: 'dome', body: 'box', legs: 'legs', items: ['spoon'], pal: { b: '#e8eef8', B: '#ffffff', t: '#ff8f5a', F: '#ffe8d0', h: '#ffffff', H: '#d8e0ec', c: '#ffd0b0', X: '#9aa4b8' } },
  botkid:    { top: 'bulb', head: 'visor', body: 'small', legs: 'treads', items: ['ball'], pal: { b: '#ff9a4a', t: '#4fc8ff', c: '#fff0d0', s: '#2a3a5a', e: '#a8ffb0', l: '#ff5a6a', X: '#ff5a6a' } },
  botdj:     { top: 'phones', head: 'tv', body: 'box', legs: 'legs', items: ['cups', 'speaker'], pal: { b: '#b98cff', t: '#ff6fb5', c: '#efe6ff', s: '#2f2550', e: '#ff9cf0', X: '#3f3a5a', n: '#9aa4b8' } },
  botfarm:   { top: 'straw', head: 'visor', body: 'round', legs: 'wheel', items: ['carrot'], pal: { b: '#7fcf6a', t: '#a8703f', c: '#eaffd8', s: '#2a4a30', e: '#ffe066', h: '#f2c86a', H: '#c89a40', n: '#ff9a3a' } },
  botastro:  { top: 'one', head: 'dome', body: 'box', legs: 'legs', items: ['flag'], pal: { b: '#e8eef8', B: '#ffffff', t: '#ff8f5a', F: '#bfe8ff', c: '#dfe8f4', l: '#ff5a6a', b2: '#4f6fb8' } },
  botcat:    { top: 'cat', head: 'dome', body: 'small', legs: 'legs', items: ['whisk', 'tail'], pal: { b: '#ffb36b', t: '#ffffff', F: '#fff2e0', c: '#fff2e0', x: '#ffb36b', X: '#9a6a44' } },
  botdog:    { top: 'one', head: 'dome', body: 'small', legs: 'wheel', items: ['dogears', 'tongue'], pal: { b: '#e0c49a', t: '#ff6b7f', F: '#fff6e8', c: '#fff6e8', x: '#9a6a44', l: '#ff6b7f' } },
  botfire:   { top: 'fire', head: 'tv', body: 'box', legs: 'legs', items: ['hose'], pal: { b: '#ff6b6b', t: '#ffd34d', c: '#ffe0e0', s: '#3a2530', e: '#fff07a', h: '#ff4f4f', H: '#c83a3a', x: '#ffd34d', X: '#9aa4b8' } },
  botheli:   { top: 'prop', head: 'visor', body: 'small', legs: 'jets', lift: 3, items: [], pal: { b: '#5fd0c8', t: '#ffd34d', c: '#e0fffb', s: '#244a50', e: '#ffffff', x: '#9aa4b8' } },
  botboss:   { top: 'cap', head: 'dome', body: 'box', legs: 'legs', items: ['stache', 'star'], pal: { b: '#3f6fd8', t: '#ffd34d', F: '#e8f0ff', c: '#d8e6ff', h: '#2a4aa8', H: '#1f3a88', X: '#8a6a50' } },
  botpilot:  { top: 'two', head: 'visor', body: 'box', legs: 'legs', items: ['star'], pal: { b: '#ff8fb8', t: '#ffffff', c: '#ffe6f0', s: '#3a2a50', e: '#8ff8ff', l: '#ffd34d' } },
  botcrew:   { top: 'one', head: 'tv', body: 'box', legs: 'treads', items: ['wrench'], pal: { b: '#ffb347', t: '#4f6fb8', c: '#fff0d8', s: '#2a3550', e: '#a8ffb0', l: '#5fd08a', X: '#9aa4b8' } },
  botradio:  { top: 'phones', head: 'visor', body: 'small', legs: 'wheel', items: ['cups'], pal: { b: '#7fd4f0', t: '#ff9ec4', c: '#e8fbff', s: '#25405a', e: '#ffe066', X: '#4a5a7a' } },
  botlibrarian: { top: 'one', head: 'dome', body: 'round', legs: 'wheel', items: ['glasses', 'book'], pal: { b: '#8aa8e8', t: '#ffd34d', F: '#f4f8ff', c: '#e8f0ff', X: '#3a4a7a', l: '#ffd34d' } },
};

// Turns a robot's parts into one 20-wide bitmap for monsterSprite().
function robotBitmap(def) {
  const P = BOT_PARTS;
  const start = {};
  const rows = [];
  const put = (name, part) => { start[name] = rows.length; rows.push(...part.map(row => `..${row}..`)); };
  put('top', P.top[def.top || 'none']);
  put('head', P.head[def.head]);
  put('body', P.body[def.body]);
  put('legs', P.legs[def.legs]);
  // Items may poke above the first row: grow the bitmap upwards.
  let lift = 0;
  for (const k of def.items || []) lift = Math.max(lift, -(start[BOT_ITEMS[k].at] + BOT_ITEMS[k].y));
  const grid = Array.from({ length: lift }, () => '.'.repeat(20).split('')).concat(rows.map(r => r.split('')));
  for (const k of def.items || []) {
    const it = BOT_ITEMS[k];
    it.rows.forEach((row, j) => {
      const y = lift + start[it.at] + it.y + j;
      for (let i = 0; i < row.length; i++) if (row[i] !== '.' && grid[y] && it.x + i < 20) grid[y][it.x + i] = row[i];
    });
  }
  return grid.map(r => r.join(''));
}

function rtRobotPalette(pal) {
  const t = pal.t || '#ffd34d';
  const h = pal.h || '#ff6b6b';
  return Object.assign({
    B: shade(pal.b, 34), D: shade(pal.b, -46), t, T: shade(t, -50), s: '#2a3a5a', e: '#8ff8ff', F: '#fff8f0',
    j: '#c8d2e0', J: '#7d889c', a: '#9aa4b8', l: '#ff5a6a', c: mix(pal.b, '#ffffff', 0.7), h, H: shade(h, -40),
    x: '#ffd34d', X: '#5a6478', n: '#ffd34d', y: '#ffd34d', r: '#ff5a6a', g: '#5fd08a', k: '#2a2440', w: '#ffffff', p: '#ffadc0', m: '#ff7a9a',
  }, pal);
}

// Adds every robot to the cave monsters' bitmap table (needs sprites.js).
function registerRobots() {
  for (const [key, def] of Object.entries(ROBOTS)) {
    MONSTERS[key] = { pal: rtRobotPalette(def.pal), rows: robotBitmap(def), lift: def.lift || 0 };
  }
}
if (isCaptain() && typeof MONSTERS !== 'undefined') registerRobots();

// ---- Robot Town drawing ----------------------------------------------------------
// Helpers here are prefixed `rt` (Robot Town) to keep clear of other files.

// Light metal plates for the roads, laid in world space so they line up.
function rtRoad(ctx, ox, oy) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const u = x / 2 + y;
    const v = y - x / 2;
    const mu = ((u % 8) + 8) % 8;
    const mv = ((v % 8) + 8) % 8;
    if (mu < 1 || mv < 1) return '#b9c3d8';
    if (mu >= 2 && mu < 3 && mv >= 2 && mv < 3) return '#a8b4cc';
    if (mu < 2 || mv < 2) return '#f2f5fb';
    const n = hash(Math.floor(u / 8), Math.floor(v / 8), 7);
    return n < 0.3 ? '#e2e7f2' : n < 0.65 ? '#dde3ef' : '#e6eaf5';
  });
}

// The town square: big white panels with glowing cyan seams.
function rtPlaza(ctx, ox, oy) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const u = x / 2 + y;
    const v = y - x / 2;
    const mu = ((u % 16) + 16) % 16;
    const mv = ((v % 16) + 16) % 16;
    if (mu < 1 || mv < 1) return '#8fe0f4';
    if (mu < 2 || mv < 2) return '#d8f6ff';
    const odd = (Math.floor(u / 16) + Math.floor(v / 16)) % 2;
    if (Math.abs(mu - 8.5) < 1.5 && Math.abs(mv - 8.5) < 1.5) return odd ? '#bfefff' : '#ffe9a8';
    return odd ? '#eef5ff' : '#f8fbff';
  });
}

// A little dropped bolt or nut in the grass.
function rtGrassBit(ctx, x, y, kind) {
  if (kind === 0) {
    px(ctx, x, y, 3, 1, '#9aa4b8');
    px(ctx, x + 1, y + 1, 1, 3, '#b8c2d4');
    px(ctx, x + 1, y + 1, 1, 1, '#7d889c');
  } else if (kind === 1) {
    px(ctx, x, y, 3, 3, '#c8d2e0');
    px(ctx, x + 1, y + 1, 1, 1, '#6fbf5f');
    px(ctx, x, y + 2, 3, 1, '#9aa4b8');
  } else {
    px(ctx, x, y + 1, 4, 1, '#ffd34d');
    px(ctx, x + 1, y, 2, 3, '#ffd34d');
    px(ctx, x + 1, y + 1, 2, 1, '#e0a52a');
  }
}

// A filled shape with an ink outline, lit from the top left.
// `inside(x, y)` is in local pixels of a W x H box drawn at (ox, oy).
function rtShape(ctx, ox, oy, W, H, inside, base, line, cx = W / 2, cy = H / 2) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5);
    if (edge) { px(ctx, ox + x, oy + y, 1, 1, line || shade(base, -70)); continue; }
    const l = (-(x - cx) * 0.6 - (y - cy) * 0.8) / Math.max(W, H) * 2;
    px(ctx, ox + x, oy + y, 1, 1, l > 0.35 ? shade(base, 30) : l < -0.3 ? shade(base, -28) : base);
  }
}

// A cog wheel standing up, facing the viewer. (cx, cy) is its centre.
function rtGear(ctx, cx, cy, R, color, teeth = 8) {
  const S = Math.ceil(R + 3);
  const inside = (x, y) => {
    const dx = x - S;
    const dy = y - S;
    const d = Math.hypot(dx, dy);
    if (d < R * 0.32) return false;
    const a = (Math.atan2(dy, dx) / (Math.PI * 2) * teeth + 8) % 1;
    return d <= R || (a < 0.5 && d <= R + 2.6);
  };
  rtShape(ctx, Math.round(cx) - S, Math.round(cy) - S, S * 2, S * 2, inside, color);
}

// Round window drawn on wall W, centred at (x, v).
function rtPort(ctx, W, x, v, r, frame, glass = '#8fd0ff') {
  for (let i = -r - 1; i <= r + 1; i++) {
    const hw = Math.sqrt(Math.max(0, (r + 1) ** 2 - i * i));
    wallRect(ctx, W, x - hw, x + hw, v + i, v + i + 1, frame);
  }
  for (let i = -r + 1; i <= r - 1; i++) {
    const hw = Math.sqrt(Math.max(0, (r - 1) ** 2 - i * i));
    wallRect(ctx, W, x - hw, x + hw, v + i, v + i + 1, glass);
  }
  wallRect(ctx, W, x - r / 2, x - r / 2 + 2, v + 1, v + 3, '#e6f7ff');
}

// Square window with a white frame and a coloured sill.
function rtWindow(ctx, W, x, v, accent, small) {
  const w = small ? 8 : 10;
  const h = small ? 8 : 10;
  wallRect(ctx, W, x - 1, x + w + 1, v - 1, v + h + 1, '#f8fbff');
  wallRect(ctx, W, x, x + w, v, v + h, '#8fd0ff');
  wallRect(ctx, W, x + 1, x + 3, v + h - 4, v + h - 1, '#e6f7ff');
  wallRect(ctx, W, x, x + w, v + h / 2, v + h / 2 + 1, '#d8ecff');
  wallRect(ctx, W, x - 2, x + w + 2, v - 3, v - 1, accent);
}

// Sliding metal door in the middle of wall W, with a porthole.
function rtDoor(ctx, W, color) {
  const mid = W.len / 2;
  wallRect(ctx, W, mid - 9, mid + 9, 0, 26, '#8a94a8');
  wallRect(ctx, W, mid - 8, mid + 8, 0, 25, '#c8d2e0');
  wallRect(ctx, W, mid - 7, mid + 7, 0, 23, color);
  wallRect(ctx, W, mid - 7, mid + 7, 0, 3, shade(color, -40));
  wallRect(ctx, W, mid - 0.5, mid + 0.5, 0, 23, shade(color, -45));
  for (const s of [-1, 1]) {
    wallRect(ctx, W, mid + s * 4 - 1, mid + s * 4 + 1, 8, 15, shade(color, 30));
    wallRect(ctx, W, mid + s * 4 - 1, mid + s * 4 + 1, 8, 9, '#ffffff');
  }
  // A little green light: open!
  wallRect(ctx, W, mid + 10, mid + 13, 18, 21, '#3a4458');
  wallRect(ctx, W, mid + 11, mid + 12, 19, 20, '#7fff9a');
}

// Yellow and dark diagonal stripes on a band of wall W.
function rtHazard(ctx, W, x0, x1, v0, v1) {
  for (let x = Math.floor(x0); x < x1; x++) for (let v = v0; v < v1; v++) {
    wallRect(ctx, W, x, x + 1, v, v + 1, ((x + v) >> 2) % 2 ? '#ffd34d' : '#4a4f63');
  }
}

// Flat roof with a raised rim over a box of height H.
function rtFlatRoof(ctx, k, H, top, rim) {
  const up = (p, d = 0) => ({ x: p.x, y: p.y - H - d });
  fillPoly(ctx, [up(k.T), up(k.R), up(k.B), up(k.L)], top);
  const c = houseMid(k);
  const inset = p => ({ x: c.x + (p.x - c.x) * 0.86, y: c.y + (p.y - c.y) * 0.86 - H });
  fillPoly(ctx, [inset(k.T), inset(k.R), inset(k.B), inset(k.L)], shade(top, -10));
  fillPoly(ctx, [up(k.L), up(k.B), up(k.B, 3), up(k.L, 3)], shade(rim, -20));
  fillPoly(ctx, [up(k.B), up(k.R), up(k.R, 3), up(k.B, 3)], rim);
  fillPoly(ctx, [up(k.L, 3), up(k.T, 3), up(k.T, 4), up(k.L, 4)], shade(rim, 30));
  fillPoly(ctx, [up(k.T, 3), up(k.R, 3), up(k.R, 4), up(k.T, 4)], shade(rim, 30));
}

// An antenna mast with a blinking-red tip. (x, y) is its foot.
function rtMast(ctx, x, y, h, light = '#ff5a6a') {
  px(ctx, x - 1, y - h, 2, h, '#8a94a8');
  px(ctx, x, y - h, 1, h, '#c8d2e0');
  for (let i = 6; i < h - 4; i += 6) px(ctx, x - 3, y - i, 6, 1, '#8a94a8');
  px(ctx, x - 2, y - h - 4, 4, 4, shade(light, -40));
  px(ctx, x - 1, y - h - 3, 2, 2, light);
  px(ctx, x - 1, y - h - 3, 1, 1, '#ffffff');
}

// A dish aerial pointing up and right. (x, y) is the top of its post.
function rtDish(ctx, x, y, R, color = '#f4f8ff') {
  px(ctx, x - 1, y, 3, 8, '#8a94a8');
  const inside = (u, v) => {
    const dx = u - R - 2;
    const dy = v - R - 2;
    const a = dx * 0.8 + dy * 0.6;
    const b = -dx * 0.6 + dy * 0.8;
    return (a / R) ** 2 + (b / (R * 0.55)) ** 2 <= 1;
  };
  rtShape(ctx, x - R - 2, y - R - 2, R * 2 + 4, R * 2 + 4, inside, color, '#7d889c');
  px(ctx, x + Math.round(R * 0.3), y - Math.round(R * 0.6), 2, 2, '#ff5a6a');
  pxLine(ctx, { x, y: y - 1 }, { x: x + Math.round(R * 0.3), y: y - Math.round(R * 0.6) }, '#7d889c');
}

// Little puffs of steam over a chimney.
function rtSteam(ctx, x, y) {
  for (const [dx, dy, r] of [[0, 0, 3], [3, -5, 4], [-1, -11, 5], [4, -17, 4]]) {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      if (i * i + j * j > r * r) continue;
      px(ctx, x + dx + i, y + dy + j, 1, 1, i * i + j * j > (r - 1) * (r - 1) ? '#d8deef' : i + j < 0 ? '#ffffff' : '#f0f3fb');
    }
  }
}

// The flat round top of a round body: an ellipse of radius R at height cy.
function rtDisc(ctx, cx, cy, R, color) {
  for (let dx = -R; dx < R; dx++) {
    const t = (dx + 0.5) / R;
    const e = Math.sqrt(1 - t * t) * R / 2;
    px(ctx, cx + dx, Math.round(cy - e), 1, Math.max(1, Math.round(e * 2)), color);
    px(ctx, cx + dx, Math.round(cy - e), 1, 1, shade(color, 24));
  }
}

// ---- Robot workshops -----------------------------------------------------------

// Every shape stands on a 3 x 3 footprint with its door in the middle of the
// front-left wall, like the princess houses. `style.roof` is the colour.
const RT_SHOP_SHAPE = {
  A: 'lab', B: 'garage', C: 'head', D: 'battery', F: 'factory', G: 'radio',
  H: 'garage', M: 'lab', N: 'battery', P: 'factory', S: 'radio', T: 'head',
};
const RT_SHOP_UP = { lab: 116, garage: 110, head: 120, battery: 118, factory: 128, radio: 158 };

// A garage with a roll-up door and a big cog on the roof.
function rtGarage(ctx, k, accent) {
  const H = 38;
  houseShadow(ctx, k);
  boxWalls(ctx, k, H, '#f2f6fc', (W, left) => {
    wallRect(ctx, W, 0, W.len, 0, 5, shade(accent, left ? -50 : -30));
    for (let x = 4; x < W.len; x += 8) wallRect(ctx, W, x, x + 1, 5, H - 6, left ? '#c4ccdc' : '#dde3ee');
    wallRect(ctx, W, 0, W.len, H - 6, H, left ? shade(accent, -18) : accent);
    for (let x = 3; x < W.len; x += 9) wallRect(ctx, W, x, x + 2, H - 4, H - 2, '#ffffff');
    if (left) {
      rtDoor(ctx, W, shade(accent, -10));
      rtWindow(ctx, W, 4, 12, accent, true);
      rtWindow(ctx, W, W.len - 13, 12, accent, true);
    } else {
      wallRect(ctx, W, 5, W.len - 5, 0, 27, '#5a6478');
      wallRect(ctx, W, 6, W.len - 6, 0, 26, mix(accent, '#ffffff', 0.35));
      for (let v = 2; v < 26; v += 3) wallRect(ctx, W, 6, W.len - 6, v, v + 1, mix(accent, '#ffffff', 0.1));
      wallRect(ctx, W, W.len / 2 - 3, W.len / 2 + 3, 2, 4, '#5a6478');
      rtHazard(ctx, W, 5, W.len - 5, 27, 30);
    }
  });
  rtFlatRoof(ctx, k, H, '#dfe6f2', shade(accent, -10));
  const m = houseMid(k);
  rtGear(ctx, m.x + 2, m.y - H - 16, 13, accent, 9);
  rtGear(ctx, m.x + 19, m.y - H - 7, 7, '#ffd34d', 7);
  rtMast(ctx, Math.round(m.x - 22), Math.round(m.y - H - 2), 14);
}

// A round lab under a shiny dome, with portholes and an aerial.
function rtLab(ctx, k, accent) {
  const R = 32;
  const H = 36;
  const m = houseMid(k);
  const cx = Math.round(m.x);
  const cy = Math.round(m.y);
  houseShadow(ctx, k);
  roundBody(ctx, cx, cy, R, R, H, (t, h) => {
    let col = roundShade('#f6f9ff', t);
    if (h < 6) col = roundShade(shade(accent, -30), t);
    if (h >= H - 4) col = roundShade('#dfe6f2', t);
    if (h === H - 5 || h === 6) col = roundShade(accent, t);
    if (h > 6 && h < H - 6 && Math.floor((t + 1) * 10) % 4 === 0) col = shade(col, -8);
    return col;
  });
  rtDoor(ctx, roundDoorWall(cx, cy, R), shade(accent, -20));
  for (const t of [0.25, 0.6]) {
    const p = roundPt(cx, cy, R, t, 18);
    for (let j = -5; j <= 5; j++) {
      const hw = Math.round(Math.sqrt(30 - j * j));
      px(ctx, p.x - hw, p.y + j - 4, hw * 2, 1, j * j + hw * hw > 20 ? '#8a94a8' : '#8fd0ff');
    }
    px(ctx, p.x - 3, p.y - 7, 2, 2, '#e6f7ff');
  }
  // Metal dome with seams, a sliding slit and a shine.
  const base = cy - H;
  const D = 20;
  for (let dx = -R; dx < R; dx++) {
    const t = (dx + 0.5) / R;
    const s = Math.sqrt(1 - t * t);
    const bottom = Math.round(base + s * R / 2 + 1);
    const top = Math.round(base - s * D - 1);
    for (let y = top; y < bottom; y++) {
      const v = (bottom - y) / (bottom - top);
      let col = accent;
      if (t < -0.45) col = shade(accent, -34);
      else if (t < -0.05) col = shade(accent, -14);
      if (Math.abs(Math.abs(t) - 0.55) < 0.03) col = shade(col, -26);
      if (Math.abs(v - 0.42) < 0.03) col = shade(col, -22);
      if (t > 0.2 && t < 0.42 && v > 0.55 && v < 0.85) col = mix(accent, '#ffffff', 0.55);
      if (Math.abs(t + 0.02) < 0.07 && v > 0.45) col = '#3a4458';
      if (y === top || y === bottom - 1) col = shade(accent, -60);
      px(ctx, cx + dx, y, 1, 1, col);
    }
  }
  px(ctx, cx - 3, base - D - 4, 6, 3, '#ffd34d');
  rtMast(ctx, cx + 1, base - D - 4, 12, '#7fff9a');
}

// A shop shaped like a giant robot head: window eyes and a door mouth.
function rtHeadHouse(ctx, k, accent) {
  const H = 46;
  const body = mix(accent, '#ffffff', 0.55);
  houseShadow(ctx, k);
  boxWalls(ctx, k, H, body, (W, left) => {
    wallRect(ctx, W, 0, W.len, 0, 4, shade(accent, -50));
    wallRect(ctx, W, 0, 3, 0, H, shade(body, left ? -30 : -14));
    wallRect(ctx, W, W.len - 3, W.len, 0, H, shade(body, left ? -30 : -14));
    wallRect(ctx, W, 0, W.len, H - 4, H, shade(accent, left ? -10 : 10));
    if (left) {
      const mid = W.len / 2;
      // Eyes: big round windows with pupils looking at the street.
      for (const s of [-1, 1]) {
        const x = mid + s * 16;
        rtPort(ctx, W, x, 36, 6, '#ffffff', '#bfe8ff');
        wallRect(ctx, W, x - 2, x + 3, 32, 38, '#2a3a5a');
        wallRect(ctx, W, x, x + 2, 35, 37, '#ffffff');
        wallRect(ctx, W, x - 3, x + 3, 24, 26, '#ffadc0');
      }
      rtDoor(ctx, W, shade(accent, -20));
    } else {
      // Vent grill and a little window on the side of the head.
      for (let v = 10; v < 30; v += 4) wallRect(ctx, W, 8, 24, v, v + 2, shade(body, -26));
      rtWindow(ctx, W, W.len - 20, 14, accent);
      rtPort(ctx, W, W.len / 2 + 4, 34, 3, '#8a94a8', '#ffd34d');
    }
  });
  rtFlatRoof(ctx, k, H, mix(accent, '#ffffff', 0.4), shade(accent, -20));
  // Two ear aerials with bulbs, and a bolt on top.
  for (const p of [k.L, k.R]) {
    const m = houseMid(k);
    const x = Math.round(m.x + (p.x - m.x) * 0.55);
    const y = Math.round(m.y + (p.y - m.y) * 0.55 - H - 2);
    px(ctx, x - 2, y - 2, 4, 3, '#8a94a8');
    px(ctx, x - 1, y - 14, 2, 12, '#c8d2e0');
    px(ctx, x - 3, y - 20, 6, 6, '#c83a4a');
    px(ctx, x - 2, y - 19, 4, 4, '#ff5a6a');
    px(ctx, x - 1, y - 19, 1, 1, '#ffffff');
  }
  const m = houseMid(k);
  px(ctx, Math.round(m.x) - 6, Math.round(m.y) - H - 6, 12, 5, '#8a94a8');
  px(ctx, Math.round(m.x) - 4, Math.round(m.y) - H - 10, 8, 5, '#c8d2e0');
  px(ctx, Math.round(m.x) - 4, Math.round(m.y) - H - 10, 8, 1, '#ffffff');
}

// A big round battery with a lightning bolt and glowing charge bars.
function rtBattery(ctx, k, accent) {
  const R = 30;
  const H = 54;
  const m = houseMid(k);
  const cx = Math.round(m.x);
  const cy = Math.round(m.y);
  houseShadow(ctx, k);
  roundBody(ctx, cx, cy, R, R, H, (t, h) => {
    let col = roundShade(accent, t);
    if (h >= 34) col = roundShade('#4a5268', t);
    if (h === 33 || h === 34) col = roundShade('#ffffff', t);
    if (h < 4) col = roundShade(shade(accent, -40), t);
    if (h >= H - 3) col = roundShade('#c8d2e0', t);
    return col;
  });
  rtDoor(ctx, roundDoorWall(cx, cy, R), shade(accent, -35));
  // Lightning bolt on the dark wrapper.
  const bolt = roundPt(cx, cy, R, 0.28, 50);
  const B = ['...yyy', '..yyy.', '.yyyyy', '...yy.', '..yy..', '..y...'];
  B.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'y') px(ctx, bolt.x - 4 + i * 2, bolt.y + j * 2, 2, 2, '#ffe066'); });
  // Charge bars.
  for (let i = 0; i < 3; i++) {
    const p = roundPt(cx, cy, R, 0.7, 12 + i * 7);
    px(ctx, p.x - 3, p.y - 4, 7, 5, '#3a4458');
    px(ctx, p.x - 2, p.y - 3, 5, 3, '#7fff9a');
  }
  // The + terminal on top.
  rtDisc(ctx, cx, cy - H, R, '#c8d2e0');
  roundBody(ctx, cx, cy - H, 11, 11, 7, t => roundShade('#ffd34d', t));
  rtDisc(ctx, cx, cy - H - 7, 11, '#ffe680');
  const plus = roundPt(cx, cy, R, -0.45, 46);
  px(ctx, plus.x - 3, plus.y - 1, 7, 2, '#ffffff');
  px(ctx, plus.x - 1, plus.y - 3, 2, 6, '#ffffff');
}

// A little factory with two striped smokestacks puffing steam.
function rtFactory(ctx, k, accent) {
  const H = 36;
  houseShadow(ctx, k);
  boxWalls(ctx, k, H, '#fbf4ec', (W, left) => {
    const brick = left ? '#e8cfc0' : '#f6e2d4';
    wallRect(ctx, W, 0, W.len, 0, 8, brick);
    for (let row = 0; row < 3; row++) {
      wallRect(ctx, W, 0, W.len, row * 3, row * 3 + 1, shade(brick, -24));
      for (let x = (row % 2) * 4; x < W.len; x += 8) wallRect(ctx, W, x, x + 1, row * 3, row * 3 + 3, shade(brick, -30));
    }
    wallRect(ctx, W, 0, W.len, H - 5, H, left ? shade(accent, -20) : accent);
    if (left) {
      rtDoor(ctx, W, shade(accent, -20));
      rtWindow(ctx, W, 4, 13, accent, true);
      rtWindow(ctx, W, W.len - 13, 13, accent, true);
    } else {
      for (const x of [6, 20, 34]) rtWindow(ctx, W, x, 13, accent);
      // A wrench sign on the wall.
      wallRect(ctx, W, W.len - 12, W.len - 4, 26, 28, '#9aa4b8');
      wallRect(ctx, W, W.len - 14, W.len - 11, 24, 30, '#9aa4b8');
    }
  });
  // Saw-tooth roof: three slanted strips with skylights.
  const m = houseMid(k);
  const WL = wall({ x: k.L.x, y: k.L.y - H }, { x: k.B.x, y: k.B.y - H });
  const back = { x: k.T.x - k.L.x, y: k.T.y - k.L.y };
  rtFlatRoof(ctx, k, H, '#e8edf6', shade(accent, -30));
  for (let i = 0; i < 3; i++) {
    const a = wallPt(WL, WL.len * (0.12 + i * 0.29), 0);
    const b = wallPt(WL, WL.len * (0.12 + i * 0.29 + 0.24), 0);
    const f = 0.85;
    const pts = [a, b, { x: b.x + back.x * f, y: b.y + back.y * f - 14 }, { x: a.x + back.x * f, y: a.y + back.y * f - 14 }];
    fillPoly(ctx, [a, { x: a.x + back.x * f, y: a.y + back.y * f }, pts[3]], '#8fd0ff');
    fillPoly(ctx, pts, (x, y) => ((x + y) % 5 === 0 ? shade(accent, -16) : accent));
    pxLine(ctx, pts[0], pts[3], shade(accent, -50));
    pxLine(ctx, pts[3], pts[2], shade(accent, 40));
  }
  for (const [dx, dy, h] of [[16, -4, 30], [26, 2, 22]]) {
    const x = Math.round(m.x + dx);
    const y = Math.round(m.y - H + dy);
    for (let v = 0; v < h; v++) {
      const col = Math.floor(v / 5) % 2 ? '#ffffff' : accent;
      px(ctx, x - 4, y - v, 9, 1, col);
      px(ctx, x - 4, y - v, 2, 1, shade(col, -30));
    }
    px(ctx, x - 5, y - h - 2, 11, 3, '#5a6478');
    rtSteam(ctx, x + 1, y - h - 6);
  }
}

// A radio tower with a railing on top, a dish and a tall mast.
function rtRadio(ctx, k, accent) {
  const R = 27;
  const H = 70;
  const m = houseMid(k);
  const cx = Math.round(m.x);
  const cy = Math.round(m.y);
  houseShadow(ctx, k);
  roundBody(ctx, cx, cy, R, R - 6, H, (t, h) => {
    let col = roundShade('#f4f7fd', t);
    if (h < 6) col = roundShade('#c8d2e0', t);
    if ((h >= 30 && h < 34) || (h >= 56 && h < 60)) col = roundShade(accent, t);
    if (h > 6 && h % 9 === 0) col = shade(col, -10);
    return col;
  });
  rtDoor(ctx, roundDoorWall(cx, cy, R), shade(accent, -20));
  for (const [t, h] of [[0.3, 20], [-0.2, 46], [0.45, 46]]) {
    const p = roundPt(cx, cy, R - 6 * h / H, t, h);
    px(ctx, p.x - 4, p.y - 9, 9, 10, '#8a94a8');
    px(ctx, p.x - 3, p.y - 8, 7, 8, '#8fd0ff');
    px(ctx, p.x - 2, p.y - 7, 2, 2, '#e6f7ff');
  }
  // Round deck on top with a railing.
  const top = cy - H;
  const r = R - 3;
  for (let dx = -r - 2; dx < r + 2; dx++) {
    const t = (dx + 0.5) / (r + 2);
    const e = Math.sqrt(Math.max(0, 1 - t * t)) * (r + 2) / 2;
    px(ctx, cx + dx, Math.round(top - e), 1, Math.round(e * 2) + 1, '#dfe6f2');
    px(ctx, cx + dx, Math.round(top + e), 1, 3, roundShade(accent, t));
    if ((dx + 40) % 5 === 0) px(ctx, cx + dx, Math.round(top + e) - 6, 1, 6, '#9aa4b8');
    px(ctx, cx + dx, Math.round(top + e) - 7, 1, 1, '#c8d2e0');
  }
  rtDish(ctx, cx - 8, top - 6, 11);
  rtMast(ctx, cx + 9, top - 2, 34);
}

const RT_SHOP_DRAW = { lab: rtLab, garage: rtGarage, head: rtHeadHouse, battery: rtBattery, factory: rtFactory, radio: rtRadio };
function rtDrawShop(ctx, k, shape, accent) {
  RT_SHOP_DRAW[shape](ctx, k, accent);
}

// ---- Street props ----------------------------------------------------------------

// Iso box corners around a ground centre point, `s` pixels to each side.
function rtBox(cx, cy, s) {
  return { T: { x: cx, y: cy - s / 2 }, R: { x: cx + s, y: cy }, B: { x: cx, y: cy + s / 2 }, L: { x: cx - s, y: cy } };
}

// Pre-rendered props by name, shared like the trees: { canvas, ax, ay }.
const rtPropCache = new Map();
function rtProp(kind) {
  if (rtPropCache.has(kind)) return rtPropCache.get(kind);
  const make = {
    // Solar panel on a post, tilted to the sun.
    solar: () => {
      const cv = makeCanvas(32, 34);
      const ctx = cv.getContext('2d');
      plantShadow(ctx, 16, 30, 10);
      px(ctx, 15, 16, 3, 14, '#8a94a8');
      px(ctx, 15, 16, 1, 14, '#c8d2e0');
      const P = [{ x: 3, y: 15 }, { x: 22, y: 5 }, { x: 30, y: 13 }, { x: 11, y: 23 }];
      fillPoly(ctx, P, '#dfe6f2');
      const I = [{ x: 5, y: 15 }, { x: 22, y: 7 }, { x: 28, y: 13 }, { x: 11, y: 21 }];
      fillPoly(ctx, I, (x, y) => ((x + 2 * y) % 6 === 0 || (2 * x - y) % 9 === 0 ? '#8fb8ff' : y < 12 ? '#5a8af0' : '#3f6fd8'));
      return { canvas: cv, ax: 16, ay: 30 };
    },
    // White wind turbine.
    turbine: () => {
      const cv = makeCanvas(36, 70);
      const ctx = cv.getContext('2d');
      plantShadow(ctx, 18, 66, 7);
      for (let y = 18; y < 66; y++) {
        const w = 2 + Math.floor((y - 18) / 16);
        px(ctx, 18 - w / 2, y, w, 1, '#f4f8ff');
        px(ctx, 18 - w / 2, y, 1, 1, '#c8d2e0');
      }
      for (const a of [-Math.PI / 2 + 0.3, Math.PI / 6 + 0.3, Math.PI * 5 / 6 + 0.3]) {
        for (let s = 2; s < 16; s++) {
          const x = Math.round(18 + Math.cos(a) * s);
          const y = Math.round(16 + Math.sin(a) * s);
          px(ctx, x - 1, y - 1, 3, 2, s > 12 ? '#ff6b6b' : '#ffffff');
          px(ctx, x - 1, y + 1, 3, 1, '#c8d2e0');
        }
      }
      px(ctx, 16, 14, 5, 5, '#c8d2e0');
      px(ctx, 17, 15, 3, 3, '#ffd34d');
      return { canvas: cv, ax: 18, ay: 66 };
    },
    // A dish aerial on a little box.
    dish: () => {
      const cv = makeCanvas(32, 40);
      const ctx = cv.getContext('2d');
      plantShadow(ctx, 16, 35, 9);
      drawFurnitureBox(ctx, rtBox(16, 34, 7), 8, '#dfe6f2', '#f4f8ff', '#b8c2d4');
      rtDish(ctx, 15, 20, 10);
      return { canvas: cv, ax: 16, ay: 34 };
    },
    // A yellow cog standing in a flower bed.
    gear: () => {
      const cv = makeCanvas(36, 40);
      const ctx = cv.getContext('2d');
      plantShadow(ctx, 18, 34, 12);
      drawFurnitureBox(ctx, rtBox(18, 33, 12), 4, '#a8704a', '#7fcf6a', '#8a5a3c');
      rtGear(ctx, 18, 17, 11, '#ffd34d', 8);
      for (const [x, c] of [[9, '#ff7fb4'], [13, '#ffffff'], [24, '#ff7fb4'], [27, '#8fd3ff']]) px(ctx, x, 30, 2, 2, c);
      return { canvas: cv, ax: 18, ay: 33 };
    },
    // Two stacked crates of spare parts.
    crates: () => {
      const cv = makeCanvas(34, 40);
      const ctx = cv.getContext('2d');
      plantShadow(ctx, 17, 34, 12);
      for (const [x, y, s, col] of [[17, 33, 11, '#ffb347'], [16, 21, 8, '#6fa8ff']]) {
        const { WL, WR } = drawFurnitureBox(ctx, rtBox(x, y, s), s, col, shade(col, 26), shade(col, -24));
        for (const W of [WL, WR]) {
          wallRect(ctx, W, 0, W.len, 0, 1, shade(col, -50));
          wallRect(ctx, W, W.len / 2 - 1, W.len / 2 + 1, 0, s, shade(col, -40));
        }
      }
      px(ctx, 14, 3, 4, 3, '#c8d2e0');
      px(ctx, 15, 2, 2, 1, '#ffffff');
      return { canvas: cv, ax: 17, ay: 33 };
    },
    // A pair of traffic cones.
    cones: () => {
      const cv = makeCanvas(30, 24);
      const ctx = cv.getContext('2d');
      plantShadow(ctx, 15, 20, 11);
      for (const [x, y, h] of [[9, 19, 14], [20, 21, 12]]) {
        px(ctx, x - 5, y - 1, 11, 2, '#ff7a3a');
        for (let i = 0; i < h; i++) {
          const w = Math.max(1, Math.round((h - i) / h * 4));
          const col = i % 6 > 2 && i % 6 < 5 ? '#ffffff' : '#ff8f4a';
          px(ctx, x - w, y - 2 - i, w * 2 + 1, 1, col);
          px(ctx, x - w, y - 2 - i, 1, 1, '#d8602a');
        }
      }
      return { canvas: cv, ax: 15, ay: 20 };
    },
    // A stack of old tyres with a flower growing out of the top.
    tires: () => {
      const cv = makeCanvas(30, 34);
      const ctx = cv.getContext('2d');
      plantShadow(ctx, 15, 30, 11);
      for (let i = 0; i < 3; i++) {
        const y = 28 - i * 6;
        for (let dx = -10; dx <= 10; dx++) {
          const e = Math.sqrt(1 - (dx / 10.5) ** 2) * 4;
          px(ctx, 15 + dx, Math.round(y - e), 1, Math.round(e * 2) + 5, dx < -5 ? '#3a3f50' : '#4f5568');
        }
        px(ctx, 6, y + 1, 18, 1, '#6a7088');
      }
      for (let dx = -6; dx <= 6; dx++) px(ctx, 15 + dx, 15 - Math.round(Math.sqrt(1 - (dx / 6.5) ** 2) * 2), 1, 3, '#7fcf6a');
      for (const [x, y, c] of [[11, 10, '#ff7fb4'], [15, 7, '#ffe066'], [19, 10, '#8fd3ff']]) {
        px(ctx, x, y + 2, 1, 4, '#4f9f48');
        px(ctx, x - 1, y, 3, 3, c);
        px(ctx, x, y + 1, 1, 1, '#ffffff');
      }
      return { canvas: cv, ax: 15, ay: 30 };
    },
    // Street lamp with a round glowing bulb.
    lamp: () => {
      const cv = makeCanvas(14, 36);
      const ctx = cv.getContext('2d');
      plantShadow(ctx, 7, 33, 5);
      px(ctx, 6, 9, 2, 24, '#7d889c');
      px(ctx, 7, 9, 1, 24, '#c8d2e0');
      px(ctx, 4, 30, 6, 3, '#5a6478');
      px(ctx, 4, 30, 6, 1, '#ffd34d');
      px(ctx, 3, 1, 8, 1, '#5a6478');
      px(ctx, 2, 2, 10, 2, '#4f6fb8');
      px(ctx, 3, 4, 8, 6, '#e8fbff');
      px(ctx, 4, 5, 6, 4, '#bff4ff');
      px(ctx, 4, 5, 2, 2, '#ffffff');
      px(ctx, 3, 10, 8, 1, '#5a6478');
      return { canvas: cv, ax: 7, ay: 33, glow: { x: 7, y: 6 } };
    },
    // Gate pylon: a blue post with warning stripes and a glowing orb.
    post: () => {
      const cv = makeCanvas(16, 52);
      const ctx = cv.getContext('2d');
      plantShadow(ctx, 8, 49, 6);
      px(ctx, 4, 10, 8, 39, '#5a8af0');
      px(ctx, 4, 10, 3, 39, '#3f6fd8');
      px(ctx, 10, 10, 2, 39, '#8fb8ff');
      for (let y = 40; y < 49; y++) for (let x = 4; x < 12; x++) px(ctx, x, y, 1, 1, ((x + y) >> 1) % 2 ? '#ffd34d' : '#4a4f63');
      for (let y = 14; y < 38; y += 8) px(ctx, 6, y, 4, 2, '#7fff9a');
      px(ctx, 3, 8, 10, 3, '#4a4f63');
      px(ctx, 4, 1, 8, 7, '#7fd4f0');
      px(ctx, 5, 2, 6, 5, '#d8fbff');
      px(ctx, 5, 2, 2, 2, '#ffffff');
      return { canvas: cv, ax: 8, ay: 48 };
    },
  }[kind];
  const p = make();
  // What each one says when tapped (js/touch.js).
  const [word, fx] = { solar: ['sun', 'glow'], turbine: ['wind', 'shake'], dish: ['dish', 'hop'], gear: ['gear', 'hop'], crates: ['box', 'hop'],
    cones: ['cone', 'hop'], tires: ['tire', 'boing'], lamp: ['lamp', 'glow'] }[kind] || [];
  if (word) touchable(p, word, fx);
  rtPropCache.set(kind, p);
  return p;
}

// A metal truss between two gate posts on world points A (left) and B
// (right), hung with coloured bulbs.
function rtArch(ctx, A, B, accent) {
  const x0 = Math.round(A.x) + 3;
  const x1 = Math.round(B.x) - 3;
  const bulbs = [accent, '#ffe066', '#7fe8ff', '#ff8fb8', '#7fff9a'];
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / (x1 - x0);
    const y = Math.round(A.y + (B.y - A.y) * t - 38 - Math.sin(Math.PI * t) * 12);
    px(ctx, x, y - 8, 1, 2, '#4f6fb8');
    px(ctx, x, y - 1, 1, 2, '#4f6fb8');
    px(ctx, x, y - 8, 1, 1, '#8fb8ff');
    // Zig-zag struts between the rails.
    const z = (x - x0) % 8;
    px(ctx, x, y - 6 + (z < 4 ? z : 8 - z) * 1.25, 1, 1, '#8a94a8');
    if ((x - x0) % 6 === 3) {
      const c = bulbs[Math.floor((x - x0) / 6) % bulbs.length];
      px(ctx, x, y + 1, 1, 1, '#5a6478');
      px(ctx, x - 1, y + 2, 3, 3, c);
      px(ctx, x - 1, y + 2, 1, 1, '#ffffff');
    }
  }
}

// Like addGate and addSideGate in world.js, with pylons and a truss.
function rtAddGate(sc, cols, r, mat, links) {
  const post = rtProp('post');
  for (const c of cols) {
    const p = tileCenter(sc, c, r);
    sc.objects = sc.objects.filter(o => !(o.tree && o.c0 === c && o.r0 === r));
    block(sc, c, r, 1, 1);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, canvas: post.canvas, x: p.x - post.ax, y: p.y - post.ay, w: post.canvas.width, h: post.canvas.height, links });
    sc.lamps.push({ x: p.x, y: p.y - post.ay + 4 });
  }
  for (let c = cols[0] + 1; c < cols[1]; c++) for (const rr of [r, r + 1]) if (tileAt(sc, c, rr)) tileAt(sc, c, rr).mat = mat;
  const A = tileCenter(sc, cols[0], r);
  const B = tileCenter(sc, cols[1], r);
  addObject(sc, { c: cols[0], r, w: cols[1] - cols[0] + 1, d: 1 }, { x: A.x - 2, y: A.y - 60, w: B.x - A.x + 4, h: B.y - A.y + 34 },
    ctx => rtArch(ctx, A, B, shade(mat, -20)), { links });
}
function rtAddSideGate(sc, c, rows, mat, mats, links) {
  const post = rtProp('post');
  for (const r of rows) {
    const p = tileCenter(sc, c, r);
    sc.objects = sc.objects.filter(o => !(o.tree && o.c0 === c && o.r0 === r));
    block(sc, c, r, 1, 1);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, canvas: post.canvas, x: p.x - post.ax, y: p.y - post.ay, w: post.canvas.width, h: post.canvas.height, links });
    sc.lamps.push({ x: p.x, y: p.y - post.ay + 4 });
  }
  for (let r = rows[0] + 1; r < rows[1]; r++) for (const cc of mats) if (tileAt(sc, cc, r)) tileAt(sc, cc, r).mat = mat;
  const A = tileCenter(sc, c, rows[1]);
  const B = tileCenter(sc, c, rows[0]);
  addObject(sc, { c, r: rows[0], w: 1, d: rows[1] - rows[0] + 1 }, { x: A.x - 2, y: B.y - 60, w: B.x - A.x + 4, h: A.y - B.y + 34 },
    ctx => rtArch(ctx, A, B, shade(mat, -20)), { links });
}

// The fountain in the square: a golden robot statue splashing water.
function rtFountain(ctx, cx, cy, t) {
  const rx = 26;
  const ry = 13;
  ctx.fillStyle = 'rgba(40,30,70,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy + 3, rx + 2, ry + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let dx = -rx; dx < rx; dx++) {
    const tt = (dx + 0.5) / rx;
    const e = Math.sqrt(1 - tt * tt) * ry;
    px(ctx, cx + dx, Math.round(cy - e), 1, Math.round(e * 2) + 6, tt < -0.3 ? '#c8d4e8' : '#eef3fb');
    px(ctx, cx + dx, Math.round(cy + e) + 3, 1, 1, '#5a8af0');
    px(ctx, cx + dx, Math.round(cy + e) + 5, 1, 1, '#9aa8c4');
  }
  for (let dx = -rx + 3; dx < rx - 3; dx++) {
    const tt = (dx + 0.5) / (rx - 3);
    const e = Math.sqrt(1 - tt * tt) * (ry - 2);
    for (let y = Math.round(cy - e); y < Math.round(cy + e); y++) {
      const w = Math.sin(dx * 0.4 + y * 0.8 - t * 3) + Math.sin(dx * 0.2 - y * 0.5 + t * 2);
      px(ctx, cx + dx, y + 1, 1, 1, w > 1.4 ? '#e6fbff' : w > 0.8 ? '#a8e6ff' : '#6cc4f0');
    }
  }
  // Pedestal and the statue: arms up, waving at the town.
  px(ctx, cx - 6, cy - 10, 12, 10, '#dfe6f2');
  px(ctx, cx - 6, cy - 10, 4, 10, '#c8d2e0');
  px(ctx, cx - 7, cy - 11, 14, 2, '#5a8af0');
  const g = '#ffd34d';
  const gd = '#e0a52a';
  const gl = '#fff2a8';
  px(ctx, cx - 3, cy - 14, 2, 3, gd);
  px(ctx, cx + 1, cy - 14, 2, 3, gd);
  px(ctx, cx - 5, cy - 22, 10, 8, g);
  px(ctx, cx - 5, cy - 22, 2, 8, gd);
  px(ctx, cx - 2, cy - 20, 4, 3, gl);
  const wave = Math.round(Math.sin(t * 3));
  px(ctx, cx - 8, cy - 28 + wave, 2, 8, g);
  px(ctx, cx + 6, cy - 28 - wave, 2, 8, g);
  px(ctx, cx - 1, cy - 24, 2, 2, gd);
  px(ctx, cx - 6, cy - 33, 12, 9, g);
  px(ctx, cx - 6, cy - 33, 2, 9, gd);
  px(ctx, cx - 4, cy - 31, 8, 5, '#3a4458');
  px(ctx, cx - 3, cy - 30, 2, 2, '#8ff8ff');
  px(ctx, cx + 1, cy - 30, 2, 2, '#8ff8ff');
  px(ctx, cx - 1, cy - 37, 2, 4, gd);
  px(ctx, cx - 2, cy - 39, 4, 2, '#ff5a6a');
  // Water arcs from the antenna.
  for (let i = 0; i < 14; i++) {
    const p = ((t * 0.9 + i / 14) % 1);
    const side = i % 2 ? 1 : -1;
    const x = cx + side * p * 18;
    const y = cy - 40 + (p * 2 - 1) ** 2 * 18 - 10 + p * 18;
    px(ctx, Math.round(x), Math.round(y), 1, 2, p > 0.8 ? '#ffffff' : '#bfeaff');
  }
}

// ---- Captain HQ -------------------------------------------------------------------

const HQ = { wall: '#f4f8ff', wallL: '#d8e2f2', line: '#c8d4e8', blue: '#4f7fe8', blueD: '#3a5fc0', orange: '#ff9a3a', glass: '#8fe0ff' };

// A box of white panels with a blue base and an orange band on top.
function rtPanelBox(ctx, k, H, opts = {}) {
  const WL = wall(k.L, k.B);
  const WR = wall(k.B, k.R);
  for (const [W, base, left] of [[WL, HQ.wallL, true], [WR, HQ.wall, false]]) {
    wallRect(ctx, W, 0, W.len, 0, H, base);
    for (let v = 18; v < H - 6; v += 14) wallRect(ctx, W, 0, W.len, v, v + 1, HQ.line);
    for (let x = 16; x < W.len; x += 24) wallRect(ctx, W, x, x + 1, 6, H - 5, HQ.line);
    wallRect(ctx, W, 0, W.len, 0, 6, left ? HQ.blueD : HQ.blue);
    wallRect(ctx, W, 0, W.len, H - 5, H, left ? shade(HQ.orange, -20) : HQ.orange);
    if (opts.lights) for (let x = 8; x < W.len - 4; x += 12) {
      wallRect(ctx, W, x, x + 3, H - 12, H - 9, '#3a4458');
      wallRect(ctx, W, x + 1, x + 2, H - 11, H - 10, '#7fe8ff');
    }
  }
  rtFlatRoof(ctx, k, H, '#e4ebf6', HQ.blue);
  return { WL, WR };
}

// Round white tower with blue bands and a glass dome or a control cabin.
// (cx, cy) is its ground centre.
function rtTower(ctx, cx, cy, R, H, opts = {}) {
  roundBody(ctx, cx, cy, R, R, H, (t, h) => {
    let col = roundShade(HQ.wall, t);
    if (h < 6) col = roundShade(HQ.blue, t);
    if (h % 22 === 12 || h % 22 === 13) col = roundShade(HQ.blue, t);
    if (h >= H - 4) col = roundShade(HQ.orange, t);
    return col;
  });
  for (const v of [0.35, 0.65]) {
    const p = roundPt(cx, cy, R, 0.2, H * v);
    for (let j = -3; j <= 3; j++) {
      const hw = Math.round(Math.sqrt(12 - j * j));
      px(ctx, p.x - hw, p.y + j, hw * 2, 1, j * j + hw * hw > 8 ? '#5a6478' : HQ.glass);
    }
    px(ctx, p.x - 2, p.y - 2, 1, 1, '#ffffff');
  }
  const base = cy - H;
  if (opts.cabin) {
    // Control cabin: a band of windows, a roof disc and a mast.
    roundBody(ctx, cx, base, R + 4, R + 4, 14, (t, h) => (h < 2 || h > 12 ? roundShade('#5a6478', t) : Math.floor((t + 1) * 8) % 2 ? roundShade(HQ.glass, t) : '#5a6478'));
    roundBody(ctx, cx, base - 14, R + 6, R + 2, 4, (t, h) => roundShade(h > 2 ? HQ.wall : HQ.orange, t));
    rtDisc(ctx, cx, base - 18, R + 2, '#e4ebf6');
    rtMast(ctx, cx + 4, base - 20, 26);
    rtDish(ctx, cx - 8, base - 22, 7);
    return;
  }
  // Glass dome with a highlight and a little light on top.
  const D = Math.round(R * 0.9);
  for (let dx = -R - 1; dx < R + 1; dx++) {
    const t = (dx + 0.5) / (R + 1);
    const s = Math.sqrt(Math.max(0, 1 - t * t));
    const bottom = Math.round(base + s * (R + 1) / 2 + 1);
    const top = Math.round(base - s * (D + 4) - 1);
    for (let y = top; y < bottom; y++) {
      const v = (bottom - y) / Math.max(1, bottom - top);
      let col = opts.dome || '#7fd4f0';
      if (t < -0.4) col = shade(col, -30);
      else if (t < 0) col = shade(col, -12);
      if (t > 0.1 && t < 0.4 && v > 0.5 && v < 0.85) col = '#e8fbff';
      if (y === top) col = shade(opts.dome || '#7fd4f0', -60);
      px(ctx, cx + dx, y, 1, 1, col);
    }
  }
  px(ctx, cx - 1, base - D - 4, 2, 4, '#8a94a8');
  px(ctx, cx - 2, base - D - 7, 4, 3, '#ff5a6a');
  if (opts.flag) {
    px(ctx, cx, base - D - 20, 1, 14, '#8a94a8');
    for (let i = 0; i < 10; i++) px(ctx, cx + 1 + i, base - D - 20 + Math.floor(i / 3), 1, 7 - Math.floor(i * 0.6), i % 3 === 2 ? shade(opts.flag, -20) : opts.flag);
    px(ctx, cx + 3, base - D - 17, 2, 2, '#ffffff');
  }
}

// A rocket standing on its launch pad. (cx, cy) is the ground centre.
function rtRocket(ctx, cx, cy) {
  // Pad.
  for (let dx = -22; dx < 22; dx++) {
    const t = (dx + 0.5) / 22;
    const e = Math.sqrt(1 - t * t) * 11;
    px(ctx, cx + dx, Math.round(cy - e), 1, Math.round(e * 2) + 4, t < -0.3 ? '#9aa4b8' : '#c8d2e0');
    px(ctx, cx + dx, Math.round(cy - e), 1, 1, (dx >> 2) % 2 ? '#ffd34d' : '#4a4f63');
  }
  const R = 10;
  const bottom = cy - 6;
  const top = cy - 86;
  // Fins behind and beside the body.
  for (const s of [-1, 1]) {
    for (let i = 0; i < 16; i++) {
      const w = Math.round(i * 0.7);
      px(ctx, s < 0 ? cx - R - w : cx + R, bottom - 22 + i, w + 1, 1, s < 0 ? '#3a5fc0' : HQ.blue);
    }
  }
  roundBody(ctx, cx, bottom, R, R, bottom - top, (t, h) => {
    let col = roundShade('#ffffff', t);
    if ((h > 8 && h < 14) || (h > 56 && h < 60)) col = roundShade('#ff5a6a', t);
    if (t > 0.35 && t < 0.6 && h > 14 && h < 70) col = '#ffffff';
    return col;
  });
  for (const h of [38, 50]) {
    const p = roundPt(cx, bottom, R, -0.1, h);
    px(ctx, p.x - 4, p.y - 4, 8, 8, '#5a6478');
    px(ctx, p.x - 3, p.y - 3, 6, 6, HQ.glass);
    px(ctx, p.x - 2, p.y - 2, 2, 2, '#ffffff');
  }
  // Nose cone.
  coneRoof(ctx, cx, top, R, 24, t => (t < -0.35 ? '#c83a4a' : t < 0 ? '#e84a5a' : '#ff5a6a'));
  px(ctx, cx - 1, top - 28, 2, 4, '#c8d2e0');
  // Middle fin and the nozzle.
  px(ctx, cx - 1, bottom - 20, 3, 18, '#3a5fc0');
  px(ctx, cx - 5, bottom, 10, 3, '#5a6478');
}

// The HQ shield badge with a star, painted on wall W centred at (x, v).
function rtBadge(ctx, W, x, v, s = 1) {
  // v is the top edge; the shield narrows to a point at the bottom.
  const Hs = Math.round(17 * s);
  for (let i = 0; i < Hs; i++) {
    const hw = Math.min(1, (Hs - i) / (8 * s)) * 9 * s;
    wallRect(ctx, W, x - hw - 1, x + hw + 1, v - i - 1, v - i, '#ffffff');
    if (hw > 1) wallRect(ctx, W, x - hw + 1, x + hw - 1, v - i - 1, v - i, i < 2 * s ? HQ.blueD : HQ.blue);
  }
  const star = ['....y....', '...yyy...', 'yyyyyyyyy', '.yyyyyyy.', '..yyyyy..', '.yy...yy.'];
  star.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'y') wallRect(ctx, W, x - 4.5 * s + i * s, x - 4.5 * s + (i + 1) * s, v - 3 * s - (j + 1) * s, v - 3 * s - j * s, '#ffd34d'); });
}

// The whole HQ as one picture, on the castle's 10 x 7 footprint.
function rtHQ(ctx, sc, c0, r0) {
  const W = 10;
  const D = 7;
  const tc = (c, r) => tileCenter(sc, c, r);
  const k = boxCorners(sc, c0, r0, W, D);
  fillPoly(ctx, [
    { x: k.T.x + 14, y: k.T.y + 6 }, { x: k.R.x + 14, y: k.R.y + 6 },
    { x: k.B.x + 14, y: k.B.y + 6 }, { x: k.L.x + 14, y: k.L.y + 6 },
  ], 'rgba(40,30,70,0.15)');

  const back = tc(c0, r0);
  rtTower(ctx, back.x, back.y, 16, 96, { cabin: true });

  // Main hall, with a strip of windows, the badge and a radar on the roof.
  const keep = boxCorners(sc, c0 + 2, r0 + 1, 6, 4);
  const { WL, WR } = rtPanelBox(ctx, keep, 78);
  for (const [Wk, left] of [[WL, true], [WR, false]]) {
    for (const v of [44, 60]) {
      wallRect(ctx, Wk, 6, Wk.len - 6, v, v + 10, '#5a6478');
      for (let x = 7; x < Wk.len - 7; x += 9) {
        wallRect(ctx, Wk, x, x + 7, v + 1, v + 9, left ? shade(HQ.glass, -18) : HQ.glass);
        wallRect(ctx, Wk, x + 1, x + 2, v + 5, v + 8, '#e8fbff');
      }
    }
  }
  rtBadge(ctx, WL, WL.len / 2, 74, 1.4);
  const kc = tc(c0 + 4.5, r0 + 2.5);
  rtDish(ctx, Math.round(kc.x - 10), Math.round(kc.y - 78 - 8), 18);
  rtMast(ctx, Math.round(kc.x + 22), Math.round(kc.y - 78 + 2), 30, '#7fff9a');
  rtGear(ctx, Math.round(kc.x + 8), Math.round(kc.y - 78 - 6), 7, HQ.orange, 7);

  // Courtyard walls along the two front sides, with a hangar gate.
  rtPanelBox(ctx, boxCorners(sc, c0 + W - 1, r0, 1, D), 36, { lights: true });
  const fw = rtPanelBox(ctx, boxCorners(sc, c0, r0 + D - 1, W, 1), 36, { lights: true });
  const WLf = fw.WL;
  const gm = WLf.len / 2;
  wallRect(ctx, WLf, gm - 19, gm + 19, 0, 33, '#5a6478');
  wallRect(ctx, WLf, gm - 16, gm + 16, 0, 30, '#c8d2e0');
  for (let v = 1; v < 29; v += 4) wallRect(ctx, WLf, gm - 15, gm + 15, v, v + 3, v % 8 === 1 ? HQ.blue : '#6f9af0');
  wallRect(ctx, WLf, gm - 0.5, gm + 0.5, 0, 30, HQ.blueD);
  rtHazard(ctx, WLf, gm - 19, gm + 19, 30, 34);
  // Blue banners with stars either side of the gate.
  for (const bx of [gm - 32, gm + 25]) {
    wallRect(ctx, WLf, bx, bx + 7, 8, 32, HQ.blueD);
    wallRect(ctx, WLf, bx + 1, bx + 6, 10, 30, HQ.blue);
    wallRect(ctx, WLf, bx + 2, bx + 5, 20, 23, '#ffd34d');
    wallRect(ctx, WLf, bx, bx + 7, 32, 34, HQ.orange);
  }

  const right = tc(c0 + W - 1, r0);
  const left = tc(c0, r0 + D - 1);
  const front = tc(c0 + W - 1, r0 + D - 1);
  rtTower(ctx, right.x, right.y, 17, 66, { flag: '#ff9a3a' });
  rtTower(ctx, left.x, left.y, 17, 66, { flag: '#ff9a3a', dome: '#9fe8c8' });
  rtRocket(ctx, Math.round(front.x), Math.round(front.y));
}

// ---- Robot Town ---------------------------------------------------------------------

// The same map as buildTown() in world.js: roads, the square, the pond, the
// letter houses, the gates and the villagers all sit on the same tiles.
function buildRobotTown() {
  const sc = makeScene('town', TOWN_N, TOWN_N, 150, 60);
  sc.outdoor = true;
  const N = TOWN_N;
  const reserved = new Set();
  const key = (c, r) => r * N + c;
  const reserve = (c, r) => reserved.add(key(c, r));

  // Roads.
  for (const rr of [14, 26]) for (let c = 2; c <= 37; c++) setTile(sc, c, rr, 'road');
  for (const cc of [8, 31]) for (let r = 14; r <= 26; r++) setTile(sc, cc, r, 'road');
  for (const cc of [19, 20]) for (let r = 10; r <= 39; r++) setTile(sc, cc, r, 'road');
  // The square with the robot fountain.
  for (let r = 17; r <= 22; r++) for (let c = 16; c <= 23; c++) setTile(sc, c, r, 'plaza');
  // Pond.
  for (let r = 28; r <= 35; r++) for (let c = 24; c <= 33; c++) {
    if (((c - 28.5) / 4.6) ** 2 + ((r - 31.5) / 3.3) ** 2 <= 1) setTile(sc, c, r, 'water');
  }
  // Flower beds, a few less than the princess town: robots like bolts too.
  for (let r = 16; r <= 22; r++) for (let c = 2; c <= 6; c++) setTile(sc, c, r, 'flowers');
  for (let c = 12; c <= 27; c++) if (tileAt(sc, c, 10).type === 'grass') setTile(sc, c, 10, 'flowers');
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (tileAt(sc, c, r).type === 'grass' && hash(c, r, 77) < 0.05) setTile(sc, c, r, 'flowers');
  }

  // Captain HQ where the castle stands.
  const C = CASTLE_AT;
  block(sc, C.c, C.r, C.w, C.d);
  for (let r = C.r - 1; r <= C.r + C.d; r++) for (let c = C.c - 1; c <= C.c + C.w; c++) reserve(c, r);
  const hq = addObject(sc, { c: C.c, r: C.r, w: C.w, d: C.d }, footBounds(sc, C.c, C.r, C.w, C.d, 210, 30),
    ctx => rtHQ(ctx, sc, C.c, C.r), { kind: 'castle' });
  sc.doors.push({ c: 19, r: 10, obj: hq, target: 'castle' });
  sc.doors.push({ c: 20, r: 10, obj: hq, target: 'castle' });

  // Letter workshops.
  for (const h of TOWN_HOUSES) {
    const info = LETTERS.find(l => l.letter === h.letter);
    const shape = RT_SHOP_SHAPE[h.letter] || 'garage';
    block(sc, h.c, h.r, 3, 3);
    for (let r = h.r - 1; r <= h.r + 3; r++) for (let c = h.c - 1; c <= h.c + 3; c++) reserve(c, r);
    const obj = addObject(sc, { c: h.c, r: h.r, w: 3, d: 3 }, footBounds(sc, h.c, h.r, 3, 3, RT_SHOP_UP[shape], 12),
      ctx => rtDrawShop(ctx, boxCorners(sc, h.c, h.r, 3, 3), shape, info.color), { kind: 'house', house: h, info });
    sc.doors.push({ c: h.c + 1, r: h.r + 3, obj, target: `house-${h.letter}` });
    const k = boxCorners(sc, h.c, h.r, 3, 3);
    const sign = wallPt(wall(k.L, k.B), (k.B.x - k.L.x) / 2, 30);
    sc.signs.push({ x: sign.x, y: sign.y, text: info.letter + info.letter.toLowerCase(), color: info.color });
  }

  // Fountain in the square.
  block(sc, 19, 19, 2, 2);
  for (let r = 18; r <= 21; r++) for (let c = 18; c <= 21; c++) reserve(c, r);
  const fc = tileCenter(sc, 19.5, 19.5);
  sc.objects.push(stillFrame({ c0: 19, r0: 19, c1: 20, r1: 20, x: fc.x - 30, y: fc.y - 52, w: 60, h: 72,
    animated: (ctx, t) => rtFountain(ctx, Math.round(fc.x), Math.round(fc.y), t), react: { word: 'fountain', fx: 'splash' } }));

  // Street lamps.
  const lamp = rtProp('lamp');
  const lampSpots = [[18, 13], [21, 13], [18, 24], [21, 24], [18, 30], [21, 30], [18, 36], [21, 36], [7, 15], [32, 15], [7, 25], [32, 25]];
  for (const [c, r] of lampSpots) {
    block(sc, c, r, 1, 1);
    reserve(c, r);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, canvas: lamp.canvas, x: p.x - lamp.ax, y: p.y - lamp.ay, w: lamp.canvas.width, h: lamp.canvas.height });
    sc.lamps.push({ x: p.x, y: p.y - lamp.ay + lamp.glow.y });
  }

  for (const n of TOWN_NPCS) reserve(n.c, n.r);
  reserve(20, 12);

  // Trees all round, with robot things in among them in town: solar panels,
  // dish aerials, wind turbines, cogs, crates, cones and tyres.
  const green = makeTree('green');
  const ringTrees = [green, green, makePlant('pine'), makePlant('oak'), makeTree('blossom')];
  const inner = [green, makePlant('oak'), makePlant('pine'), makePlant('bush'), makePlant('tulips'),
    rtProp('solar'), rtProp('dish'), rtProp('turbine'), rtProp('gear'), rtProp('crates'), rtProp('cones'), rtProp('tires'), rtProp('solar'), rtProp('turbine')];
  const nearPond = (c, r) => Math.abs(c - 28.5) < 7 && Math.abs(r - 31.5) < 6;
  const nearRoad = (c, r) => {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const t = tileAt(sc, c + dc, r + dr);
      if (t && (t.type === 'road' || t.type === 'plaza' || t.type === 'water')) return true;
    }
    return false;
  };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const t = tileAt(sc, c, r);
    if (t.blocked || reserved.has(key(c, r)) || (t.type !== 'grass' && t.type !== 'flowers') || nearRoad(c, r)) continue;
    const ring = c < 2 || r < 2 || c > N - 3 || r > N - 3;
    if (hash(c, r, 91) >= (ring ? 0.55 : 0.09)) continue;
    if (sc.objects.some(o => o.tree && Math.abs(o.c0 - c) <= 1 && Math.abs(o.r0 - r) <= 1) && !ring) continue;
    let tree = green;
    const pick = hash(c, r, 7);
    if (ring) tree = ringTrees[Math.floor(hash(c, r, 8) * ringTrees.length)];
    else if (nearPond(c, r) && pick < 0.6) tree = makePlant('palm');
    else tree = inner[Math.floor(hash(c, r, 8) * inner.length)];
    block(sc, c, r, 1, 1);
    const p = tileCenter(sc, c, r);
    sc.objects.push({ c0: c, r0: r, c1: c, r1: r, tree: true, canvas: tree.canvas, x: p.x - tree.ax, y: p.y - tree.ay, w: tree.canvas.width, h: tree.canvas.height });
  }

  // Metal roads and the square are painted over the plain tiles, with a few
  // bolts and nuts dropped in the grass.
  sc.paintGround = g => {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const t = tileAt(sc, c, r);
      const o = tileOrigin(sc, c, r);
      if (t.type === 'road') rtRoad(g, o.x, o.y);
      else if (t.type === 'plaza') rtPlaza(g, o.x, o.y);
      else if (t.type === 'grass' && !t.blocked && hash(c, r, 79) < 0.05) rtGrassBit(g, o.x + 10 + Math.floor(hash(c, r, 80) * 10), o.y + 5 + Math.floor(hash(c, r, 81) * 5), Math.floor(hash(c, r, 82) * 3));
      if (t.mat) {
        const cx = o.x + 16;
        const cy = o.y + 8;
        fillPoly(g, diamondPts(o.x, o.y).map(p => ({ x: cx + (p.x - cx) * 0.7, y: cy + (p.y - cy) * 0.7 })), t.mat);
      }
    }
  };

  for (const n of TOWN_NPCS) sc.npcs.push(makeNpc(n, null));
  sc.start = { c: 20, r: 12 };

  // Gate to the Dino Village at the south end of the main road.
  const toDino = [19, 20].map(c => ({ c, r: 39, target: 'forest', at: { c: 14 + (c - 19), r: 1 }, icon: '🦖', style: 'gate', needStars: FOREST_STARS }));
  sc.links = [...toDino];
  rtAddGate(sc, [18, 21], 38, '#9fe0a0', toDino);
  const gp = tileCenter(sc, 19.5, 38);
  sc.signs.push({ x: gp.x, y: gp.y - 64, text: place('forest'), color: '#4fa35a', needStars: FOREST_STARS, links: toDino });
  // Gate to the Drone Village at the east end of the lower road.
  for (const [c, r] of [[37, 27], [38, 26], [38, 27], [39, 26], [39, 27]]) setTile(sc, c, r, 'road');
  sc.objects = sc.objects.filter(o => !(o.tree && o.c0 >= 37 && o.r0 >= 26 && o.r0 <= 29));
  for (let r = 26; r <= 29; r++) for (let c = 37; c <= 39; c++) tileAt(sc, c, r).blocked = false;
  const toDrones = [26, 27].map(r => ({ c: 39, r, target: 'fairy', at: { c: 2, r: r - 14 }, icon: '🛸', style: 'gate', needStars: FAIRY_STARS }));
  sc.links.push(...toDrones);
  rtAddSideGate(sc, 38, [25, 28], '#9fd8ff', [38, 39], toDrones);
  const dp = tileCenter(sc, 39, 25.5);
  sc.signs.push({ x: dp.x, y: dp.y - 64, text: place('fairy'), color: '#3f8fd8', needStars: FAIRY_STARS, links: toDrones });
  renderGround(sc);
  return sc;
}
CAPTAIN_SCENES.town = buildRobotTown;

// ---- Indoor floors and furniture -------------------------------------------------------

// Light metal floor plates, tinted. Painted over the plain tiles.
function rtFloor(ctx, ox, oy, base) {
  fillPoly(ctx, diamondPts(ox, oy), (x, y) => {
    const u = x / 2 + y;
    const v = y - x / 2;
    const mu = ((u % 16) + 16) % 16;
    const mv = ((v % 16) + 16) % 16;
    if (mu < 1 || mv < 1) return shade(base, -34);
    if (mu < 2 || mv < 2) return shade(base, 14);
    if (mu >= 3 && mu < 4 && mv >= 3 && mv < 4) return shade(base, -26);
    // Little raised diamonds, like tread plate.
    if ((Math.floor(u / 2) + Math.floor(v / 2) * 3) % 7 === 0 && mu > 4 && mv > 4) return shade(base, 10);
    return base;
  });
}
// Paints every tile of `types` in a scene with rtFloor.
function rtPaintFloor(sc, types, base) {
  sc.paintGround = g => {
    for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) {
      const t = tileAt(sc, c, r);
      if (!types.includes(t.type)) continue;
      const o = tileOrigin(sc, c, r);
      rtFloor(g, o.x, o.y, base);
      if (t.rug) drawDoormat(g, o.x, o.y, t.rug);
    }
  };
}

// Places a piece of furniture on a footprint, like `furn` in world.js.
function rtFurn(sc, c, r, w, d, up, draw, extra) {
  block(sc, c, r, Math.ceil(w), Math.ceil(d));
  return addObject(sc, { c, r, w: Math.ceil(w), d: Math.ceil(d) }, footBounds(sc, c, r, w, d, up, 8), draw, extra);
}

// A charging bed: a white frame, a coloured cushion and a battery panel.
function rtPod(ctx, sc, c, r, color) {
  const k = boxCorners(sc, c, r, 1, 2);
  drawFurnitureBox(ctx, k, 8, '#dfe6f2', '#ffffff', '#b8c2d4');
  const up = p => ({ x: p.x, y: p.y - 9 });
  const kb = boxCorners(sc, c, r + 0.7, 1, 1.3);
  fillPoly(ctx, [up(kb.T), up(kb.R), up(kb.B), up(kb.L)], color);
  fillPoly(ctx, [up(kb.L), up(kb.B), { x: kb.B.x, y: kb.B.y - 4 }, { x: kb.L.x, y: kb.L.y - 4 }], shade(color, -30));
  const head = boxCorners(sc, c, r, 1, 0.25);
  const { WL } = drawFurnitureBox(ctx, head, 22, '#c8d2e0', '#f4f8ff', '#a8b4cc');
  wallRect(ctx, WL, 2, WL.len - 2, 8, 18, '#3a4458');
  for (let i = 0; i < 3; i++) wallRect(ctx, WL, 3 + i * 3.4, 5.5 + i * 3.4, 10, 16, '#7fff9a');
}

// Metal shelf of boxed parts, cogs and bolts.
function rtPartsShelf(ctx, sc, c, r, color) {
  const k = boxCorners(sc, c, r, 1, 0.45);
  const { WL } = drawFurnitureBox(ctx, k, 34, '#9aa8c4', '#c8d2e0', '#7d889c');
  for (let v = 6; v < 32; v += 9) {
    wallRect(ctx, WL, 1, WL.len - 1, v, v + 1, '#5a6478');
    for (let x = 2; x < WL.len - 3; x += 5) {
      const pick = (x + v) % 3;
      const col = ['#ffb347', color, '#6fa8ff', '#7fcf6a'][(x + v) % 4];
      if (pick === 0) wallRect(ctx, WL, x, x + 4, v + 1, v + 5, col);
      else if (pick === 1) { wallRect(ctx, WL, x, x + 3, v + 1, v + 4, '#ffd34d'); wallRect(ctx, WL, x + 1, x + 2, v + 2, v + 3, '#e0a52a'); }
      else { wallRect(ctx, WL, x + 1, x + 2, v + 1, v + 6, '#dfe6f2'); wallRect(ctx, WL, x, x + 3, v + 5, v + 6, '#9aa4b8'); }
    }
  }
}

// Small worktable with a toy robot on it.
function rtWorkTable(ctx, sc, c, r, color = '#ff9a3a') {
  const k = boxCorners(sc, c + 0.15, r + 0.15, 0.7, 0.7);
  for (const [dc, dr] of [[0.2, 0.2], [0.68, 0.2], [0.2, 0.68], [0.68, 0.68]]) {
    drawFurnitureBox(ctx, boxCorners(sc, c + dc, r + dr, 0.1, 0.1), 10, '#7d889c', '#9aa4b8');
  }
  const up = p => ({ x: p.x, y: p.y - 10 });
  fillPoly(ctx, [up(k.T), up(k.R), up(k.B), up(k.L)], '#f4f8ff');
  fillPoly(ctx, [up(k.L), up(k.B), { x: k.B.x, y: k.B.y - 7 }, { x: k.L.x, y: k.L.y - 7 }], color);
  fillPoly(ctx, [up(k.B), up(k.R), { x: k.R.x, y: k.R.y - 7 }, { x: k.B.x, y: k.B.y - 7 }], shade(color, 20));
  const m = tileCenter(sc, c, r);
  px(ctx, m.x - 3, m.y - 20, 6, 5, '#6fa8ff');
  px(ctx, m.x - 2, m.y - 19, 1, 1, '#8ff8ff');
  px(ctx, m.x + 1, m.y - 19, 1, 1, '#8ff8ff');
  px(ctx, m.x - 2, m.y - 15, 4, 3, '#4f7fe8');
  px(ctx, m.x, m.y - 22, 1, 2, '#ff5a6a');
  rtGear(ctx, m.x + 6, m.y - 13, 2, '#ffd34d', 6);
}

// A tall pegboard workbench: the captain's parts cupboard.
function rtWorkbench(ctx, sc, c, r) {
  const k = boxCorners(sc, c, r, 2, 0.5);
  const { WL } = drawFurnitureBox(ctx, k, 22, '#4f7fe8', '#ffb347', '#3a5fc0');
  // Drawers.
  for (const [x0, x1] of [[3, WL.len / 2 - 1], [WL.len / 2 + 1, WL.len - 3]]) {
    for (const v of [3, 11]) {
      wallRect(ctx, WL, x0, x1, v, v + 6, '#6f9af0');
      wallRect(ctx, WL, (x0 + x1) / 2 - 2, (x0 + x1) / 2 + 2, v + 3, v + 4, '#ffd34d');
    }
  }
  // Pegboard standing on the back edge of the bench, hung with tools.
  const back = boxCorners(sc, c, r, 2, 0.12);
  const B = drawSlab(ctx, back, 22, 60, '#dfe6f2', '#f4f8ff', '#e8eef8').WL;
  for (let x = 3; x < B.len - 2; x += 4) for (let v = 26; v < 58; v += 4) wallRect(ctx, B, x, x + 1, v, v + 1, '#b8c2d4');
  wallRect(ctx, B, 0, B.len, 58, 60, '#ff9a3a');
  // Wrench, hammer, screwdriver, a spare robot arm and a big cog.
  wallRect(ctx, B, 6, 8, 32, 50, '#9aa4b8');
  wallRect(ctx, B, 4, 10, 48, 52, '#9aa4b8');
  wallRect(ctx, B, 5, 9, 49, 51, '#f4f8ff');
  wallRect(ctx, B, 16, 18, 30, 46, '#a8703f');
  wallRect(ctx, B, 13, 21, 44, 49, '#7d889c');
  wallRect(ctx, B, 26, 28, 30, 40, '#ffd34d');
  wallRect(ctx, B, 26.5, 27.5, 40, 48, '#c8d2e0');
  wallRect(ctx, B, 34, 40, 34, 37, '#ff6b6b');
  wallRect(ctx, B, 38, 41, 37, 48, '#ff6b6b');
  wallRect(ctx, B, 37, 42, 48, 51, '#7d889c');
  const g = wallPt(B, B.len - 10, 42);
  rtGear(ctx, g.x, g.y, 5, '#ffd34d', 7);
  // Things on the bench: a robot head and a toolbox.
  const m = tileCenter(sc, c + 0.6, r + 0.2);
  px(ctx, m.x - 4, m.y - 31, 8, 7, '#c8d2e0');
  px(ctx, m.x - 3, m.y - 30, 6, 4, '#2a3a5a');
  px(ctx, m.x - 2, m.y - 29, 1, 2, '#8ff8ff');
  px(ctx, m.x + 1, m.y - 29, 1, 2, '#8ff8ff');
  px(ctx, m.x, m.y - 34, 1, 3, '#9aa4b8');
  px(ctx, m.x - 1, m.y - 35, 2, 1, '#ff5a6a');
  const t = tileCenter(sc, c + 1.5, r);
  px(ctx, t.x - 5, t.y - 30, 10, 5, '#ff5a6a');
  px(ctx, t.x - 5, t.y - 30, 10, 1, '#ff8f8f');
  px(ctx, t.x - 2, t.y - 32, 4, 2, '#c83a4a');
}

// A red rolling tool cabinet against the left wall.
function rtToolCabinet(ctx, sc, c, r) {
  const k = boxCorners(sc, c, r, 0.5, 1);
  const { WR } = drawFurnitureBox(ctx, k, 34, '#ff6b6b', '#ff8f8f', '#e04f4f');
  for (let v = 4; v < 32; v += 7) {
    wallRect(ctx, WR, 2, WR.len - 2, v, v + 5, '#ff8f8f');
    wallRect(ctx, WR, 2, WR.len - 2, v, v + 1, '#c83a4a');
    wallRect(ctx, WR, WR.len / 2 - 3, WR.len / 2 + 3, v + 2, v + 3, '#dfe6f2');
  }
  const m = tileCenter(sc, c, r + 0.1);
  // A shiny trophy on top.
  px(ctx, m.x - 5, m.y - 43, 7, 2, '#e0a52a');
  px(ctx, m.x - 4, m.y - 47, 5, 4, '#ffd34d');
  px(ctx, m.x - 3, m.y - 46, 1, 2, '#fff2a8');
}

// A box of toys: a little car and a ball.
function rtToyBox(ctx, sc, c, r) {
  const k = boxCorners(sc, c + 0.15, r + 0.2, 0.7, 0.6);
  const { WL, WR } = drawFurnitureBox(ctx, k, 12, '#5fd0c8', '#8fe8e0', '#3fb0a8');
  wallRect(ctx, WL, 0, WL.len, 9, 10, '#ffd34d');
  wallRect(ctx, WR, 0, WR.len, 9, 10, '#ffd34d');
  const m = tileCenter(sc, c, r);
  px(ctx, m.x - 7, m.y - 20, 8, 3, '#ff5a6a');
  px(ctx, m.x - 5, m.y - 22, 4, 2, '#ff8f8f');
  px(ctx, m.x - 6, m.y - 17, 2, 2, '#3a4458');
  px(ctx, m.x - 1, m.y - 17, 2, 2, '#3a4458');
  px(ctx, m.x + 2, m.y - 20, 4, 4, '#ffd34d');
  px(ctx, m.x + 3, m.y - 19, 1, 1, '#ffffff');
}

// A bed with a blue blanket, a star pillow and a metal frame.
function rtBed(ctx, sc, c, r, color) {
  const k = boxCorners(sc, c, r, 1, 2);
  drawFurnitureBox(ctx, k, 8, '#9aa8c4', '#ffffff', '#7d889c');
  const up = p => ({ x: p.x, y: p.y - 9 });
  const kb = boxCorners(sc, c, r + 0.7, 1, 1.3);
  fillPoly(ctx, [up(kb.T), up(kb.R), up(kb.B), up(kb.L)], (x, y) => ((x + 2 * y) % 10 < 2 ? shade(color, 24) : color));
  fillPoly(ctx, [up(kb.L), up(kb.B), { x: kb.B.x, y: kb.B.y - 4 }, { x: kb.L.x, y: kb.L.y - 4 }], shade(color, -30));
  const p = tileCenter(sc, c, r + 0.35);
  px(ctx, p.x - 4, p.y - 13, 8, 4, '#ffffff');
  px(ctx, p.x - 1, p.y - 13, 2, 3, '#ffd34d');
  const head = boxCorners(sc, c, r, 1, 0.25);
  const { WL } = drawFurnitureBox(ctx, head, 20, '#5a8af0', '#8fb8ff', '#3f6fd8');
  wallRect(ctx, WL, 3, WL.len - 3, 8, 15, '#ffd34d');
  wallRect(ctx, WL, 4, WL.len - 4, 9, 14, '#ff9a3a');
}

// A plain round-ended board on wall W showing a glowing map of the town.
function rtScreen(ctx, W, x0, x1, v0, v1) {
  wallRect(ctx, W, x0 - 2, x1 + 2, v0 - 2, v1 + 2, '#5a6478');
  wallRect(ctx, W, x0, x1, v0, v1, '#1f3a5a');
  for (let x = x0 + 4; x < x1; x += 6) wallRect(ctx, W, x, x + 1, v0, v1, '#2a4f78');
  for (let v = v0 + 4; v < v1; v += 6) wallRect(ctx, W, x0, x1, v, v + 1, '#2a4f78');
  // Blips: home base and friends around town.
  const w = x1 - x0;
  const h = v1 - v0;
  for (const [u, t, col] of [[0.5, 0.55, '#ffd34d'], [0.2, 0.3, '#7fff9a'], [0.75, 0.25, '#7fff9a'], [0.3, 0.75, '#ff8fb8'], [0.82, 0.7, '#8ff8ff']]) {
    wallRect(ctx, W, x0 + w * u - 1, x0 + w * u + 2, v0 + h * t - 1, v0 + h * t + 2, col);
  }
  wallRect(ctx, W, x0 + w * 0.5 - 6, x0 + w * 0.5 + 7, v0 + h * 0.55, v0 + h * 0.55 + 1, '#ffd34d');
  wallRect(ctx, W, x0 + w * 0.5, x0 + w * 0.5 + 1, v0 + h * 0.55 - 6, v0 + h * 0.55 + 7, '#ffd34d');
}

// A sliding blue door painted on wall W, centred at x, with a star.
function rtWallDoor(ctx, W, x, color) {
  wallRect(ctx, W, x - 15, x + 15, 0, 56, '#5a6478');
  wallRect(ctx, W, x - 14, x + 14, 0, 55, '#c8d2e0');
  wallRect(ctx, W, x - 11, x + 11, 0, 50, shade(color, -40));
  wallRect(ctx, W, x - 10, x + 10, 0, 49, color);
  wallRect(ctx, W, x - 0.5, x + 0.5, 0, 49, shade(color, -45));
  for (const s of [-1, 1]) {
    wallRect(ctx, W, x + s * 5 - 3, x + s * 5 + 3, 26, 40, shade(color, 30));
    wallRect(ctx, W, x + s * 5 - 2, x + s * 5 + 2, 27, 39, '#bfe8ff');
  }
  rtHazard(ctx, W, x - 14, x + 14, 51, 55);
  const star = ['..y..', '.yyy.', 'yyyyy', '.y.y.'];
  star.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'y') wallRect(ctx, W, x - 5 + i * 2, x - 3 + i * 2, 58 + (3 - j) * 2, 60 + (3 - j) * 2, '#ffd34d'); });
}

// ---- Workshops inside -----------------------------------------------------------------

function buildRobotWorkshop(h) {
  const info = LETTERS.find(l => l.letter === h.letter);
  const sc = makeScene('room', 8, 7, 110, 50);
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) setTile(sc, c, r, 'wood');
  for (let r = 2; r <= 4; r++) for (let c = 2; c <= 5; c++) {
    const t = tileAt(sc, c, r);
    t.type = 'carpet';
    t.color = mix(info.color, '#ffffff', 0.35);
    t.edge = r === 2 || r === 4 || c === 2 || c === 5;
  }
  const exit = { c: 3, r: sc.D - 1 };
  tileAt(sc, exit.c, exit.r).rug = '#4f7fe8';
  rtPaintFloor(sc, ['wood'], '#e2e9f6');

  addRoomWalls(sc, 64, mix(info.color, '#ffffff', 0.75), mix(info.color, '#4f7fe8', 0.45), (ctx, WA, WB) => {
    // A round window and a tool pegboard on the left wall; the letter poster
    // and a little screen on the right wall.
    rtPort(ctx, WA, WA.len * 0.35, 40, 9, '#c8d2e0', '#a8dcff');
    wallRect(ctx, WA, WA.len * 0.35 - 1, WA.len * 0.35 + 1, 31, 49, '#c8d2e0');
    const bx = WA.len * 0.72;
    wallRect(ctx, WA, bx - 14, bx + 14, 22, 50, '#f4f8ff');
    for (let x = bx - 12; x < bx + 13; x += 4) for (let v = 24; v < 49; v += 4) wallRect(ctx, WA, x, x + 1, v, v + 1, '#c8d2e0');
    wallRect(ctx, WA, bx - 10, bx - 8, 28, 44, '#9aa4b8');
    wallRect(ctx, WA, bx - 2, bx, 32, 46, '#a8703f');
    wallRect(ctx, WA, bx - 4, bx + 2, 42, 46, '#7d889c');
    wallRect(ctx, WA, bx + 6, bx + 8, 26, 40, info.color);
    const px0 = WB.len * 0.32;
    wallRect(ctx, WB, px0 - 18, px0 + 18, 22, 56, '#5a6478');
    wallRect(ctx, WB, px0 - 16, px0 + 16, 24, 54, '#fffaf0');
    wallRect(ctx, WB, px0 - 16, px0 + 16, 24, 27, info.color);
  });
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  const WB = wall(k.T, k.R);
  const poster = wallPt(WB, WB.len * 0.32, 39);
  sc.signs.push({ x: poster.x, y: poster.y, text: info.letter + info.letter.toLowerCase(), color: info.color, big: true, plain: true, poster: info });
  info.words.slice(0, 3).forEach(([word, emoji], i) => {
    const p = wallPt(WB, WB.len * (0.6 + i * 0.13), 40 + (i % 2) * 6);
    sc.decor.push({ x: p.x, y: p.y, emoji, word, letter: info.letter, frame: true });
  });

  rtFurn(sc, 6, 0, 1, 2, 30, ctx => rtPod(ctx, sc, 6, 0, info.color), { react: FURNITURE.bed });
  rtFurn(sc, 1, 0, 1, 1, 44, ctx => rtPartsShelf(ctx, sc, 1, 0, info.color), { react: RT_FURNITURE.shelf });
  rtFurn(sc, 0, 3, 1, 1, 30, ctx => drawPlant(ctx, sc, 0, 3), { react: FURNITURE.plant });
  rtFurn(sc, 7, 5, 1, 1, 30, ctx => drawPlant(ctx, sc, 7, 5), { react: FURNITURE.plant });
  rtFurn(sc, 5, 5, 1, 1, 26, ctx => rtWorkTable(ctx, sc, 5, 5, info.color), { react: RT_FURNITURE.table });

  sc.npcs.push(makeNpc({ who: h.who, look: h.look, c: 4, r: 2 }, h.letter));
  sc.exit = exit;
  sc.start = { c: exit.c, r: exit.r - 1 };
  sc.house = h;
  sc.info = info;
  renderGround(sc);
  return sc;
}
for (const h of TOWN_HOUSES) CAPTAIN_SCENES[`house-${h.letter}`] = () => buildRobotWorkshop(h);

// What robot furniture says when tapped (with FURNITURE in js/world.js).
const RT_FURNITURE = {
  shelf: { word: 'bolt', fx: 'hop' },
  table: { word: 'robot', fx: 'hop' },
  console: { word: 'light', fx: 'glow' },
  cup: { word: 'cup', fx: 'sparkle' },
};

// ---- Village homes inside (robot edition) --------------------------------------------

// Swaps a village's homes (VILLAGE_HOMES in js/data.js) for robot-edition
// ones, each with a robot room inside. Called by the village files.
function captainHomes(scene, homes) {
  for (let i = VILLAGE_HOMES.length - 1; i >= 0; i--) if (VILLAGE_HOMES[i].scene === scene) VILLAGE_HOMES.splice(i, 1);
  VILLAGE_HOMES.push(...homes);
  for (const h of homes) CAPTAIN_SCENES[`home-${h.id}`] = () => buildRobotHome(h);
}

// How each robot home looks inside, like HOME_THEMES in js/world.js: the
// label on the way in, the pictures on the wall and the thing in the corner
// ([draw(ctx, sc, x, y, color), what it says and does]).
const ROBOT_HOME_THEMES = {
  garage:  { label: '🔧 정비소', pictures: [['🚗', 'car'], ['🔩', 'bolt'], ['🚌', 'bus']],
    big: [(ctx, sc, x, y) => { const t = makeTyres(3); ctx.drawImage(t.canvas, x - t.ax, y - t.ay); }, { word: 'tire', fx: 'boing' }] },
  fire:    { label: '🚒 소방서', pictures: [['🔥', 'fire'], ['🚒', 'truck'], ['🔔', 'bell']],
    big: [(ctx, sc, x, y) => drawCaptainCar(ctx, x, y, 'fire', 0, { eyes: false }), { word: 'truck', fx: 'honk' }] },
  wash:    { label: '🫧 세차장', pictures: [['🦆', 'duck'], ['🚗', 'car'], ['☀️', 'sun']],
    big: [(ctx, sc, x, y) => drawCaptainCar(ctx, x, y, 'police', 0, { eyes: false }), { word: 'car', fx: 'bubbles' }] },
  gas:     { label: '⛽ 주유소', pictures: [['⛽', 'gas'], ['🚕', 'taxi'], ['🚚', 'truck']],
    big: [(ctx, sc, x, y) => drawPump(ctx, x, y, '#ec4a3c'), { word: 'gas', fx: 'hop' }] },
  carhome: { label: '🚗 자동차 집', pictures: [['🚗', 'car'], ['🏠', 'house'], ['⭐', 'star']],
    big: [(ctx, sc, x, y, col, c, r) => rtToyBox(ctx, sc, c, r), { word: 'box', fx: 'toy' }] },
  egg:     { label: '🥚 알 집', pictures: [['🥚', 'egg'], ['🦕', 'dinosaur'], ['🌋', 'volcano']],
    big: [(ctx, sc, x, y) => drawDinoNest(ctx, x, y, ['#9fd8ff', '#fff4d8', '#ffc4d4']), { word: 'egg', fx: 'hop' }] },
  hangar:  { label: '🚁 드론 격납고', pictures: [['🚁', 'helicopter'], ['✈️', 'jet'], ['🚀', 'rocket']],
    big: [(ctx, sc, x, y, col) => drawCargoDrone(ctx, x, y, 0, false, col), { word: 'drone', fx: 'hop' }] },
  lab:     { label: '🔬 드론 연구소', pictures: [['🤖', 'robot'], ['🚀', 'rocket'], ['🌙', 'moon']],
    big: [(ctx, sc, x, y, col, c, r) => rtWorkTable(ctx, sc, c, r, col), RT_FURNITURE.table] },
};

// Inside a robot-edition village home: a workshop-like room in the home's
// colours with its resident, who asks the village's questions.
function buildRobotHome(home) {
  const theme = ROBOT_HOME_THEMES[home.theme];
  const sc = makeScene('room', 8, 7, 110, 50);
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) setTile(sc, c, r, 'wood');
  for (let r = 2; r <= 4; r++) for (let c = 2; c <= 5; c++) {
    const t = tileAt(sc, c, r);
    t.type = 'carpet';
    t.color = mix(home.color, '#ffffff', 0.35);
    t.edge = r === 2 || r === 4 || c === 2 || c === 5;
  }
  const exit = { c: 3, r: sc.D - 1 };
  tileAt(sc, exit.c, exit.r).rug = '#4f7fe8';
  rtPaintFloor(sc, ['wood'], '#e2e9f6');

  addRoomWalls(sc, 64, mix(home.color, '#ffffff', 0.75), mix(home.color, '#4f7fe8', 0.45), (ctx, WA, WB) => {
    // A round window and a screen on the left wall, hazard stripes along the top.
    rtPort(ctx, WA, WA.len * 0.35, 40, 9, '#c8d2e0', '#a8dcff');
    wallRect(ctx, WA, WA.len * 0.35 - 1, WA.len * 0.35 + 1, 31, 49, '#c8d2e0');
    rtScreen(ctx, WA, WA.len * 0.62, WA.len * 0.86, 30, 50);
    for (const W of [WA, WB]) rtHazard(ctx, W, 0, W.len, 58, 61);
  });
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  const WB = wall(k.T, k.R);
  theme.pictures.forEach(([emoji, word], i) => {
    const p = wallPt(WB, WB.len * (0.3 + i * 0.15), 40 + (i % 2) * 6);
    sc.decor.push({ x: p.x, y: p.y, emoji, word, frame: true });
  });

  rtFurn(sc, 6, 0, 1, 2, 30, ctx => rtPod(ctx, sc, 6, 0, home.color), { react: FURNITURE.bed });
  rtFurn(sc, 1, 0, 1, 1, 44, ctx => rtPartsShelf(ctx, sc, 1, 0, home.color), { react: RT_FURNITURE.shelf });
  rtFurn(sc, 7, 5, 1, 1, 30, ctx => drawPlant(ctx, sc, 7, 5), { react: FURNITURE.plant });
  rtFurn(sc, 5, 5, 1, 1, 26, ctx => rtWorkTable(ctx, sc, 5, 5, home.color), { react: RT_FURNITURE.table });
  // The thing in the corner may be a whole car, so it gets a wide box.
  const [draw, react] = theme.big;
  const p = tileCenter(sc, 0, 3);
  block(sc, 0, 3, 1, 1);
  addObject(sc, { c: 0, r: 3, w: 1, d: 1 }, { x: p.x - 30, y: p.y - 48, w: 60, h: 58 }, ctx => draw(ctx, sc, Math.round(p.x), Math.round(p.y), home.color, 0, 3), { react });

  const npc = makeNpc({ who: home.who, look: home.look, c: 4, r: 2 }, null);
  npc.level = HOME_LEVEL[home.scene];
  if (home.unicorn) npc.unicorn = home.unicorn;
  if (home.gives) npc.gives = home.gives;
  if (npc.level === 5) npc.badge = '⚡';
  sc.npcs.push(npc);
  sc.exit = exit;
  sc.start = { c: exit.c, r: exit.r - 1 };
  sc.home = home;
  sc.label = theme.label;
  sc.returnTo = { scene: home.scene, at: { c: home.door[0][0], r: home.door[0][1] } };
  renderGround(sc);
  return sc;
}

// ---- Captain HQ inside ----------------------------------------------------------------

// Metal stairs with a blue runner, warning stripes and blue rails, rising to
// the back wall (like drawCastleStairs in sprites.js).
function rtStairs(ctx, sc, c0, r0, w, d, n = 6) {
  const rise = 8;
  const k = boxCorners(sc, c0, r0, w, d);
  const back = wall(k.T, k.R);
  const top = n * rise;
  wallRect(ctx, back, 3, back.len - 3, top - 2, top + 40, '#5a6478');
  wallRect(ctx, back, 5, back.len - 5, top, top + 38, '#3a4a6a');
  wallRect(ctx, back, 9, back.len - 9, top, top + 32, '#4f6a98');
  rtHazard(ctx, back, 3, back.len - 3, top + 36, top + 40);
  const s = d / n;
  const posts = [];
  for (let i = n - 1; i >= 0; i--) {
    const H = (i + 1) * rise;
    const ks = boxCorners(sc, c0, r0 + d - (i + 1) * s, w, s);
    const { WL } = drawSlab(ctx, ks, 0, H, '#d8e2f2', '#f4f8ff', '#c8d4e8');
    wallRect(ctx, WL, 0, WL.len, H - 2, H, '#ffd34d');
    const kr = boxCorners(sc, c0 + w * 0.22, r0 + d - (i + 1) * s, w * 0.56, s);
    const up = p => ({ x: p.x, y: p.y - H });
    fillPoly(ctx, [up(kr.T), up(kr.R), up(kr.B), up(kr.L)], '#5a8af0');
    const RL = wall(kr.L, kr.B);
    wallRect(ctx, RL, 0, RL.len, H - rise, H - 2, '#3f6fd8');
    posts.push({ L: ks.L, B: ks.B, H });
  }
  for (const side of ['L', 'B']) {
    for (const p of posts) {
      px(ctx, Math.round(p[side].x) - 1, Math.round(p[side].y - p.H) - 12, 2, 12, '#9aa4b8');
      px(ctx, Math.round(p[side].x) - 2, Math.round(p[side].y - p.H) - 14, 4, 3, '#4f7fe8');
    }
    const lo = posts[posts.length - 1];
    const hi = posts[0];
    pxLine(ctx, { x: lo[side].x, y: lo[side].y - lo.H - 13 }, { x: hi[side].x, y: hi[side].y - hi.H - 13 }, '#4f7fe8', 2);
  }
}

// The top of those stairs on the floor above (like drawStairwell).
function rtStairwell(ctx, sc, c0, r0, w, d, n = 6) {
  const rise = 5;
  const deep = n * rise + 12;
  const k = boxCorners(sc, c0, r0, w, d);
  ctx.save();
  ctx.beginPath();
  for (const p of [k.T, k.R, k.B, k.L]) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.clip();
  fillPoly(ctx, [k.T, k.R, k.B, k.L], '#2a3450');
  wallRect(ctx, wall(k.T, k.R), 0, k.R.x - k.T.x, -deep, 0, '#c8d4e8');
  wallRect(ctx, wall(k.L, k.T), 0, k.T.x - k.L.x, -deep, 0, '#a8b4cc');
  const s = d / n;
  for (let i = 0; i < n; i++) {
    const H = -(i + 1) * rise;
    const ks = boxCorners(sc, c0, r0 + i * s, w, s);
    const f = i / n * 0.6;
    const { WL } = drawSlab(ctx, ks, -deep, H, '#d8e2f2', mix('#f4f8ff', '#2a3450', f), mix('#c8d4e8', '#2a3450', f));
    const kr = boxCorners(sc, c0 + w * 0.22, r0 + i * s, w * 0.56, s);
    const up = p => ({ x: p.x, y: p.y - H });
    fillPoly(ctx, [up(kr.T), up(kr.R), up(kr.B), up(kr.L)], mix('#5a8af0', '#2a3450', f));
    wallRect(ctx, WL, 0, WL.len, H - 1, H, mix('#ffd34d', '#2a3450', f));
  }
  ctx.restore();
  pxLine(ctx, k.T, k.R, '#9aa4b8');
  for (const [a, b] of [[k.T, k.L], [k.R, k.B]]) {
    pxLine(ctx, a, b, '#9aa4b8', 2);
    for (let i = 0; i <= 3; i++) {
      const p = { x: a.x + (b.x - a.x) * i / 3, y: a.y + (b.y - a.y) * i / 3 };
      px(ctx, Math.round(p.x) - 1, Math.round(p.y) - 12, 2, 12, '#9aa4b8');
      px(ctx, Math.round(p.x) - 2, Math.round(p.y) - 14, 4, 3, '#4f7fe8');
    }
    pxLine(ctx, { x: a.x, y: a.y - 13 }, { x: b.x, y: b.y - 13 }, '#4f7fe8', 2);
  }
}

// The commander's big swivel chair, with armrest screens.
function rtChair(ctx, sc, c, r, color) {
  const seat = boxCorners(sc, c + 0.1, r + 0.2, 0.8, 0.7);
  drawFurnitureBox(ctx, seat, 10, '#9aa8c4', color, '#7d889c');
  const back = boxCorners(sc, c + 0.1, r, 0.8, 0.22);
  const { WL } = drawFurnitureBox(ctx, back, 32, '#c8d2e0', '#f4f8ff', '#a8b4cc');
  wallRect(ctx, WL, 2, WL.len - 2, 12, 28, color);
  wallRect(ctx, WL, 3, WL.len - 3, 26, 27, shade(color, 40));
  wallRect(ctx, WL, WL.len / 2 - 2, WL.len / 2 + 2, 29, 31, '#ffd34d');
  for (const dc of [0.02, 0.78]) {
    const arm = boxCorners(sc, c + dc, r + 0.3, 0.2, 0.55);
    const a = drawFurnitureBox(ctx, arm, 15, '#c8d2e0', '#3a4458', '#a8b4cc');
    wallRect(ctx, a.WL, 1, a.WL.len - 1, 12, 14, '#7fff9a');
  }
}

// A white pillar with glowing rings.
function rtPillar(ctx, cx, cy) {
  for (let dx = -6; dx < 6; dx++) {
    const t = (dx + 0.5) / 6;
    const col = t < -0.3 ? '#d8e2f2' : t > 0.5 ? '#e8eef8' : '#f6f9ff';
    px(ctx, cx + dx, cy - 66, 1, 66, col);
    for (const v of [18, 44]) px(ctx, cx + dx, cy - v, 1, 2, t < -0.3 ? '#4fc8e8' : '#8ff0ff');
  }
  px(ctx, cx - 8, cy - 5, 16, 5, '#4f7fe8');
  px(ctx, cx - 8, cy - 5, 16, 1, '#8fb8ff');
  px(ctx, cx - 8, cy - 71, 16, 5, '#4f7fe8');
  px(ctx, cx - 8, cy - 66, 16, 1, '#3a5fc0');
}

// A round table projecting a little glowing hologram of the town.
function rtHoloTable(ctx, sc, c, r) {
  const m = tileCenter(sc, c, r);
  const x = Math.round(m.x);
  const y = Math.round(m.y);
  rtDisc(ctx, x, y - 2, 13, '#9aa8c4');
  roundBody(ctx, x, y - 2, 5, 5, 8, t => roundShade('#c8d2e0', t));
  roundBody(ctx, x, y - 10, 13, 13, 3, t => roundShade('#4f7fe8', t));
  rtDisc(ctx, x, y - 13, 13, '#3a4458');
  rtDisc(ctx, x, y - 13, 9, '#4fc8e8');
  // The hologram: a tiny HQ and rocket in light blue.
  ctx.globalAlpha = 0.7;
  px(ctx, x - 8, y - 26, 10, 10, '#bff4ff');
  px(ctx, x - 6, y - 24, 6, 2, '#ffffff');
  px(ctx, x + 4, y - 32, 3, 16, '#bff4ff');
  px(ctx, x + 5, y - 35, 1, 3, '#ffffff');
  ctx.globalAlpha = 1;
}

// A desk console with buttons and a screen.
function rtConsole(ctx, sc, c, r) {
  const k = boxCorners(sc, c + 0.1, r + 0.15, 0.8, 0.7);
  const { WL, WR } = drawFurnitureBox(ctx, k, 14, '#c8d2e0', '#3a4458', '#a8b4cc');
  for (const W of [WL, WR]) wallRect(ctx, W, 0, W.len, 12, 14, '#4f7fe8');
  const m = tileCenter(sc, c, r);
  for (const [dx, dy, col] of [[-6, -16, '#ff5a6a'], [-2, -18, '#ffd34d'], [2, -16, '#7fff9a'], [5, -18, '#8ff8ff'], [-3, -14, '#8ff8ff']]) px(ctx, m.x + dx, m.y + dy, 2, 1, col);
  const back = boxCorners(sc, c + 0.1, r + 0.1, 0.8, 0.12);
  const S = drawSlab(ctx, back, 14, 34, '#9aa8c4', '#c8d2e0', '#7d889c').WL;
  wallRect(ctx, S, 2, S.len - 2, 17, 32, '#1f3a5a');
  for (let x = 3; x < S.len - 3; x++) wallRect(ctx, S, x, x + 1, 23 + Math.round(Math.sin(x * 0.9) * 3), 24 + Math.round(Math.sin(x * 0.9) * 3), '#7fff9a');
}

function buildCaptainHQ() {
  const sc = makeScene('room', 12, 10, 120, 50);
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) setTile(sc, c, r, 'plaza');
  for (let r = 1; r < sc.D; r++) for (const c of [5, 6]) {
    const t = tileAt(sc, c, r);
    t.type = 'carpet';
    t.color = '#5a8af0';
  }
  const exit = { c: 5, r: sc.D - 1 };
  tileAt(sc, 5, sc.D - 1).rug = '#ffc83d';
  tileAt(sc, 6, sc.D - 1).rug = '#ffc83d';
  rtPaintFloor(sc, ['plaza'], '#e6edf9');

  addRoomWalls(sc, 92, '#e4eeff', '#8fb0e8', (ctx, WA, WB) => {
    // Wide windows onto the sky, a big map screen and blue banners.
    for (const W of [WA, WB]) {
      for (let x = 24; x < W.len - 16; x += 56) {
        if (W === WA && Math.abs(x - YUNA_DOOR_X) < 28) continue;
        if (W === WB && x > W.len * 0.3 && x < W.len * 0.75) continue;
        wallRect(ctx, W, x - 13, x + 13, 34, 76, '#5a6478');
        wallRect(ctx, W, x - 11, x + 11, 36, 74, '#9fdcff');
        wallRect(ctx, W, x - 11, x + 11, 36, 50, '#c8f0ff');
        wallRect(ctx, W, x - 8, x - 2, 60, 63, '#ffffff');
        wallRect(ctx, W, x - 6, x, 63, 65, '#ffffff');
        wallRect(ctx, W, x - 0.5, x + 0.5, 36, 74, '#5a6478');
      }
      for (let x = 52; x < W.len - 20; x += 56) {
        if (W === WA && Math.abs(x - YUNA_DOOR_X) < 24) continue;
        if (W === WB && x > W.len * 0.3 && x < W.len * 0.75) continue;
        wallRect(ctx, W, x - 6, x + 6, 40, 84, '#3a5fc0');
        wallRect(ctx, W, x - 4, x + 4, 44, 82, '#4f7fe8');
        wallRect(ctx, W, x - 2, x + 2, 60, 66, '#ffd34d');
      }
    }
    rtScreen(ctx, WB, WB.len * 0.36, WB.len * 0.68, 32, 80);
    rtBadge(ctx, WB, WB.len * 0.52, 90, 0.7);
    rtWallDoor(ctx, WA, YUNA_DOOR_X, '#5a8af0');
  });

  rtFurn(sc, 5, 0, 1, 1, 40, ctx => rtChair(ctx, sc, 5, 0, '#ff9a3a'), { react: FURNITURE.chair });
  rtFurn(sc, 6, 0, 1, 1, 40, ctx => rtChair(ctx, sc, 6, 0, '#5a8af0'), { react: FURNITURE.chair });
  for (const [c, r] of [[2, 2], [9, 2], [2, 6], [9, 6]]) {
    rtFurn(sc, c, r, 1, 1, 80, ctx => { const p = tileCenter(sc, c, r); rtPillar(ctx, p.x, p.y); });
  }
  rtFurn(sc, 0, 4, 1, 1, 30, ctx => drawPlant(ctx, sc, 0, 4), { react: FURNITURE.plant });
  rtFurn(sc, 11, 4, 1, 1, 30, ctx => drawPlant(ctx, sc, 11, 4), { react: FURNITURE.plant });
  rtFurn(sc, 8, 4, 1, 1, 40, ctx => rtHoloTable(ctx, sc, 8, 4), { react: { word: 'map', fx: 'sparkle' } });
  rtFurn(sc, 3, 0, 1, 1, 40, ctx => rtConsole(ctx, sc, 3, 0), { react: RT_FURNITURE.console });
  rtFurn(sc, 8, 0, 1, 1, 40, ctx => rtConsole(ctx, sc, 8, 0), { react: RT_FURNITURE.console });

  for (const n of CAPTAIN_HQ_NPCS) sc.npcs.push(makeNpc(n, null));
  sc.exit = exit;
  sc.exitTiles = [{ c: 5, r: sc.D - 1 }, { c: 6, r: sc.D - 1 }];
  sc.start = { c: 5, r: sc.D - 2 };
  // A door in the left wall leads to the captain's room.
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  const door = wallPt(wall(k.L, k.T), YUNA_DOOR_X, 28);
  tileAt(sc, 0, 6).rug = '#5a8af0';
  sc.links = [{ c: 0, r: 6, target: 'yuna', icon: '🛏️', style: 'door', door }];
  sc.signs.push({ x: door.x, y: door.y - 46, text: place('room'), color: '#3f6fd8', links: sc.links });
  // Stairs in the back-right corner up to the library floor.
  addStairs(sc, 10, 0, 2, 3, ctx => rtStairs(ctx, sc, 10, 0, 2, 3),
    [10, 11].map(c => ({ c, r: 3, target: 'castle2', at: { c: 7, r: 4 }, icon: '⬆️' })));
  const up = tileCenter(sc, 10.5, 1);
  sc.signs.push({ x: up.x, y: up.y - 74, text: '⬆️ 2층', color: '#4f7fe8', links: sc.links.filter(l => l.target === 'castle2') });
  renderGround(sc);
  return sc;
}
CAPTAIN_SCENES.castle = buildCaptainHQ;

// ---- The HQ library upstairs --------------------------------------------------------------

// Tall metal bookcase against the back-left wall (faces +c), d tiles long.
function rtBookcase(ctx, sc, c, r, d) {
  const k = boxCorners(sc, c, r, 0.45, d);
  const { WR } = drawFurnitureBox(ctx, k, 60, '#5a8af0', '#8fb8ff', '#3f6fd8');
  wallRect(ctx, WR, 0, WR.len, 0, 3, '#3a5fc0');
  wallRect(ctx, WR, 0, WR.len, 57, 60, '#ffd34d');
  for (let v = 5; v < 56; v += 12) {
    wallRect(ctx, WR, 1, WR.len - 1, v, v + 11, '#2f4f98');
    wallRect(ctx, WR, 1, WR.len - 1, v, v + 1, '#c8d2e0');
    for (let x = 2; x < WR.len - 2; x += 2) {
      const h = 7 + Math.floor(hash(x, v, c * 7 + r) * 4);
      wallRect(ctx, WR, x, x + 2, v + 1, v + 1 + h, ['#ff7f7f', '#ffd34d', '#7fe8a0', '#ffffff', '#ffb347', '#ff9ec4'][Math.floor(hash(x, v, 11) * 6)]);
      if (hash(x, v, 12) < 0.3) x += 1;
    }
  }
}

// A model rocket on a stand.
function rtModelRocket(ctx, sc, c, r) {
  const m = tileCenter(sc, c, r);
  const x = Math.round(m.x);
  const y = Math.round(m.y);
  drawFurnitureBox(ctx, rtBox(x, y, 9), 8, '#c8d2e0', '#f4f8ff', '#a8b4cc');
  roundBody(ctx, x, y - 10, 4, 4, 22, (t, h) => (h > 8 && h < 11 ? roundShade('#ff5a6a', t) : roundShade('#ffffff', t)));
  coneRoof(ctx, x, y - 32, 4, 8, t => (t < 0 ? '#e84a5a' : '#ff5a6a'));
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) px(ctx, s < 0 ? x - 4 - Math.floor(i / 2) : x + 4, y - 16 + i, Math.floor(i / 2) + 1, 1, '#4f7fe8');
  px(ctx, x - 1, y - 24, 2, 2, '#8fe0ff');
}

// A golden trophy cup on a little plinth.
function rtTrophy(ctx, sc, c, r) {
  const m = tileCenter(sc, c, r);
  const x = Math.round(m.x);
  const y = Math.round(m.y);
  drawFurnitureBox(ctx, rtBox(x, y, 9), 10, '#4f7fe8', '#8fb8ff', '#3a5fc0');
  px(ctx, x - 4, y - 14, 8, 3, '#e0a52a');
  px(ctx, x - 1, y - 18, 2, 4, '#e0a52a');
  px(ctx, x - 6, y - 28, 12, 10, '#ffd34d');
  px(ctx, x - 6, y - 28, 3, 10, '#e0a52a');
  px(ctx, x - 9, y - 26, 3, 5, '#e0a52a');
  px(ctx, x + 6, y - 26, 3, 5, '#ffd34d');
  px(ctx, x - 2, y - 26, 2, 5, '#fff2a8');
  px(ctx, x - 2, y - 24, 4, 3, '#ff5a6a');
}

function buildHQUpstairs() {
  const sc = makeScene('room', 10, 9, 120, 50);
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) setTile(sc, c, r, 'wood');
  for (let r = 2; r <= 6; r++) for (let c = 2; c <= 5; c++) {
    const t = tileAt(sc, c, r);
    t.type = 'carpet';
    t.color = '#8fb8ff';
    t.edge = r === 2 || r === 6 || c === 2 || c === 5;
  }

  addRoomWalls(sc, 92, '#e8f0ff', '#9fb8e0', (ctx, WA, WB) => {
    // A big window on the back-right wall looking out over Robot Town.
    const bx = WB.len * 0.5;
    const x0 = bx - 28;
    const x1 = bx + 28;
    wallRect(ctx, WB, x0 - 4, x1 + 4, 0, 84, '#5a6478');
    wallRect(ctx, WB, x0, x1, 0, 80, '#9fd8ff');
    wallRect(ctx, WB, x0, x1, 0, 44, '#bfe6ff');
    wallRect(ctx, WB, x0, x1, 0, 30, '#e0f4ff');
    for (const [cx, v] of [[x0 + 12, 66], [x1 - 14, 56]]) {
      wallRect(ctx, WB, cx - 7, cx + 7, v, v + 4, '#ffffff');
      wallRect(ctx, WB, cx - 4, cx + 4, v + 4, v + 7, '#ffffff');
    }
    for (let x = x0; x < x1; x++) {
      const h = 22 + Math.round(Math.sin((x - x0) / 7) * 3 + Math.sin((x - x0) / 3) * 1.5);
      wallRect(ctx, WB, x, x + 1, 12, h, x % 9 < 1 ? '#7fcf86' : '#8fd896');
    }
    // Little workshops, a radio tower and a rocket on the skyline.
    for (const [hx, col] of [[x0 + 8, '#ff8f5a'], [x0 + 20, '#6fa8ff'], [x1 - 18, '#b98cff'], [x1 - 7, '#ffd34d']]) {
      wallRect(ctx, WB, hx - 4, hx + 4, 14, 22, '#f4f8ff');
      wallRect(ctx, WB, hx - 4, hx + 4, 22, 24, col);
      wallRect(ctx, WB, hx - 1, hx + 1, 15, 18, '#8fd0ff');
    }
    wallRect(ctx, WB, bx + 2, bx + 6, 14, 36, '#ffffff');
    wallRect(ctx, WB, bx + 3, bx + 5, 36, 40, '#ff5a6a');
    wallRect(ctx, WB, bx - 8, bx - 5, 14, 34, '#f4f8ff');
    wallRect(ctx, WB, bx - 7.5, bx - 5.5, 34, 37, '#ff5a6a');
    // Railing, and blue curtains.
    wallRect(ctx, WB, x0, x1, 15, 17, '#ffffff');
    for (let x = x0 + 2; x < x1; x += 5) wallRect(ctx, WB, x, x + 2, 0, 15, '#ffffff');
    wallRect(ctx, WB, bx - 1, bx + 1, 17, 80, '#5a6478');
    wallRect(ctx, WB, x0 - 14, x0 - 4, 6, 88, '#3f6fd8');
    wallRect(ctx, WB, x1 + 4, x1 + 14, 6, 88, '#3f6fd8');
    wallRect(ctx, WB, x0 - 14, x0 - 11, 6, 88, '#5a8af0');
    wallRect(ctx, WB, x1 + 11, x1 + 14, 6, 88, '#5a8af0');
    // Little star lights along the library wall.
    for (let x = 12; x < WA.len - 8; x += 20) wallRect(ctx, WA, x, x + 2, 76, 78, '#ffd34d');
  });
  rtPaintFloor(sc, ['wood'], '#e4ebf7');

  // Tapping a bookcase opens the story books (js/library.js).
  const shelf = r => ({ kind: 'bookcase', front: [{ c: 1, r }, { c: 1, r: r + 1 }] });
  rtFurn(sc, 0, 1, 0.45, 2, 70, ctx => rtBookcase(ctx, sc, 0, 1, 2), shelf(1));
  rtFurn(sc, 0, 4, 0.45, 2, 70, ctx => rtBookcase(ctx, sc, 0, 4, 2), shelf(4));
  rtFurn(sc, 1, 0, 1, 1, 44, ctx => rtPartsShelf(ctx, sc, 1, 0, '#ff9a3a'), { react: RT_FURNITURE.shelf });
  rtFurn(sc, 3, 7, 1, 1, 26, ctx => rtWorkTable(ctx, sc, 3, 7, '#5a8af0'), { react: RT_FURNITURE.table });
  rtFurn(sc, 7, 2, 1, 1, 40, ctx => rtConsole(ctx, sc, 7, 2), { react: RT_FURNITURE.console });
  rtFurn(sc, 8, 0, 1, 1, 44, ctx => rtModelRocket(ctx, sc, 8, 0), { react: { word: 'rocket', fx: 'stars' } });
  rtFurn(sc, 9, 0, 1, 1, 34, ctx => rtTrophy(ctx, sc, 9, 0), { react: RT_FURNITURE.cup });
  rtFurn(sc, 9, 1, 1, 1, 20, ctx => drawCoinPile(ctx, sc, 9, 1), { react: FURNITURE.coins });
  rtFurn(sc, 9, 3, 1, 1, 30, ctx => drawPlant(ctx, sc, 9, 3), { react: FURNITURE.plant });
  const lib = tileCenter(sc, 0, 3);
  sc.signs.push({ x: lib.x - 4, y: lib.y - 84, text: place('library'), color: '#4a6ab8' });
  const cup = tileCenter(sc, 8.5, 0);
  sc.signs.push({ x: cup.x, y: cup.y - 50, text: '🏆', color: '#ffd34d', plain: true, react: RT_FURNITURE.cup });

  // Stairs back down in the front-right corner.
  addStairs(sc, 7, 6, 2, 3, ctx => rtStairwell(ctx, sc, 7, 6, 2, 3),
    [7, 8].map(c => ({ c, r: 5, target: 'castle', at: { c: 10, r: 4 }, icon: '⬇️' })));

  for (const n of CASTLE_UP_NPCS) sc.npcs.push(makeNpc(n, null));
  sc.start = { c: 7, r: 4 };
  renderGround(sc);
  return sc;
}
CAPTAIN_SCENES.castle2 = buildHQUpstairs;

// ---- The captain's room --------------------------------------------------------------------

// The captain's bedroom, with the parts workbench where presents are kept.
function buildCaptainRoom() {
  const sc = makeScene('room', 9, 8, 110, 50);
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) {
    setTile(sc, c, r, 'carpet');
    const t = tileAt(sc, c, r);
    const inner = c >= 2 && c <= 6 && r >= 2 && r <= 5;
    t.color = inner ? '#bcd4ff' : '#dde8ff';
    t.edge = inner;
  }
  tileAt(sc, 4, sc.D - 1).rug = '#ffc83d';
  // A road mat for toy cars in the middle of the rug.
  sc.paintGround = g => {
    const k = boxCorners(sc, 3, 3, 3, 2);
    const c = houseMid(k);
    const ring = (f, col) => fillPoly(g, [k.T, k.R, k.B, k.L].map(p => ({ x: c.x + (p.x - c.x) * f, y: c.y + (p.y - c.y) * f })), col);
    ring(0.92, '#ffffff');
    ring(0.88, '#6a7088');
    ring(0.6, '#ffffff');
    ring(0.56, '#9fe08a');
    for (let i = 0; i < 40; i += 2) {
      const t = i / 40;
      const p = [k.T, k.R, k.B, k.L];
      const a = p[Math.floor(t * 4)];
      const b = p[(Math.floor(t * 4) + 1) % 4];
      const u = t * 4 % 1;
      const x = c.x + (a.x + (b.x - a.x) * u - c.x) * 0.74;
      const y = c.y + (a.y + (b.y - a.y) * u - c.y) * 0.74;
      px(g, Math.round(x), Math.round(y), 2, 1, '#ffffff');
    }
  };

  addRoomWalls(sc, 66, '#dce9ff', '#8fb0e8', (ctx, WA, WB) => {
    // Window with blue curtains on the left wall, stars and rockets around.
    const wx = WA.len * 0.62;
    wallArch(ctx, WA, wx - 13, wx + 13, 22, 54, '#ffffff');
    wallArch(ctx, WA, wx - 11, wx + 11, 24, 52, '#bfe6ff');
    wallRect(ctx, WA, wx - 1, wx + 1, 24, 52, '#ffffff');
    wallRect(ctx, WA, wx - 17, wx - 11, 20, 56, '#5a8af0');
    wallRect(ctx, WA, wx + 11, wx + 17, 20, 56, '#5a8af0');
    for (const W of [WA, WB]) {
      for (let x = 10; x < W.len - 6; x += 22) {
        const col = (x / 22) % 2 < 1 ? '#ffd34d' : '#ff9a3a';
        wallRect(ctx, W, x + 1, x + 4, 57, 58, col);
        wallRect(ctx, W, x + 2, x + 3, 55, 60, col);
        wallRect(ctx, W, x, x + 5, 58, 59, col);
      }
    }
    // A big HQ badge over the bed.
    rtBadge(ctx, WB, WB.len * 0.86, 62, 0.9);
  });
  const k = boxCorners(sc, 0, 0, sc.W, sc.D);
  const WB = wall(k.T, k.R);
  [['🚀', 'rocket'], ['🤖', 'robot'], ['⭐', 'star']].forEach(([emoji, word], i) => {
    const p = wallPt(WB, WB.len * (0.42 + i * 0.12), 40 + (i % 2) * 5);
    sc.decor.push({ x: p.x, y: p.y, emoji, word, frame: true });
  });

  // Tapping the workbench or the tool cabinet opens the parts (game.js).
  rtFurn(sc, 1, 0, 2, 0.5, 66, ctx => rtWorkbench(ctx, sc, 1, 0), { kind: 'wardrobe', front: [{ c: 1, r: 1 }, { c: 2, r: 1 }] });
  rtFurn(sc, 0, 3, 0.5, 1, 52, ctx => rtToolCabinet(ctx, sc, 0, 3), { kind: 'wardrobe', front: [{ c: 1, r: 3 }] });
  rtFurn(sc, 7, 0, 1, 2, 30, ctx => rtBed(ctx, sc, 7, 0, '#5a8af0'), { react: FURNITURE.bed });
  rtFurn(sc, 8, 4, 1, 1, 30, ctx => rtToyBox(ctx, sc, 8, 4), { react: FURNITURE.toys });
  rtFurn(sc, 0, 6, 1, 1, 30, ctx => drawPlant(ctx, sc, 0, 6), { react: FURNITURE.plant });
  rtFurn(sc, 5, 0, 1, 1, 30, ctx => drawPlant(ctx, sc, 5, 0), { react: FURNITURE.plant });

  sc.links = [{ c: 4, r: sc.D - 1, target: 'castle', at: { c: 1, r: 6 }, icon: '🚪', style: 'mat' }];
  sc.start = { c: 4, r: sc.D - 2 };
  renderGround(sc);
  return sc;
}
CAPTAIN_SCENES.yuna = buildCaptainRoom;
