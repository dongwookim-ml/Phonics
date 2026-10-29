// Captain edition: the robot hero. Robot parts for every wardrobe slot, the
// robot's sprite (walking, and two battle poses), and the wording of the
// workbench (정비대), reward card and parts shop. Also what makes a new part
// easy to see: the show-off when it goes on (captainShowOff, and
// captainBenchShow at the workbench), the workbench and shop stage
// (captainStage), the reward card's moving preview and magnifier
// (captainRewardShow) and part chips cut from the sprite (captainPartIcon).
//
// js/captain-car.js fills UNICORNS with cars, draws them and seats the robot
// in them (cut at captainHeroWaist). js/captain-drone.js fills FAIRIES with
// helper buddies; this file draws them through
//   drawCaptainBuddy(ctx, x, y, buddyKey, t)
// and a stand-in until it exists.
//
// Slots keep their princess names so the reward and wardrobe code works
// unchanged: hand = arms, hair = legs, shape = body, head = head,
// dress = paint colour, back = jetpack, wings or propeller, ride = car,
// fairy = helper buddy, treasure = the treasure shelf (ROBOT_TREASURES).

// ---- Robot parts -----------------------------------------------------------
// Unmarked parts come from anyone (Robot Town hands out arms, legs and
// colours); `forest` parts come first from the Dinosaur Village; `shop`
// parts are only sold in the parts shop, for `price` coins.

// Paint: [main, shade, light, trim].
const ROBOT_PAINT = {
  blue:   { name: I18n.t('captain-hero.blue'),   icon: '🔵', c: ['#5aa6f0', '#3a74c4', '#b0dcff', '#ffd34d'] },
  red:    { name: I18n.t('captain-hero.red'),   icon: '🔴', c: ['#ff6b6b', '#cf4050', '#ffb8b0', '#ffd34d'] },
  yellow: { name: I18n.t('captain-hero.yellow'),   icon: '🟡', c: ['#ffd34d', '#e0a02a', '#fff2b0', '#ff6b6b'] },
  green:  { name: I18n.t('captain-hero.green'),   icon: '🟢', c: ['#5fd08a', '#36a066', '#c0f4d4', '#ffd34d'] },
  orange: { name: I18n.t('captain-hero.orange'),   icon: '🟠', c: ['#ffa04a', '#e0702a', '#ffd4a8', '#5aa6f0'] },
  pink:   { name: I18n.t('captain-hero.pink'),   icon: '🌸', c: ['#ff8fc0', '#e0609a', '#ffd0e6', '#ffd34d'] },
  mint:   { name: I18n.t('captain-hero.mint'),   icon: '🍃', c: ['#6fe0c0', '#36aa8c', '#c8fff0', '#ff8a5a'] },
  sky:    { name: I18n.t('captain-hero.skyBlue'),   icon: '☁️', c: ['#8fd3ff', '#5aa6e0', '#e0f6ff', '#ffd34d'] },
  purple: { name: I18n.t('captain-hero.purple'),   icon: '🟣', c: ['#a88cff', '#7a5ad8', '#dcd0ff', '#ffd34d'], forest: true },
  white:  { name: I18n.t('captain-hero.white'),   icon: '⚪', c: ['#f4f6fc', '#c4cce0', '#ffffff', '#ff6b6b'], forest: true },
  black:  { name: I18n.t('captain-hero.black'),   icon: '⚫', c: ['#4a4e6e', '#33364f', '#7a80a4', '#6ff0ff'], forest: true },
  // Gold and chrome are shiny: a glint runs over them (drawRobotGlint).
  gold:   { name: I18n.t('captain-hero.gold'),   icon: '🌟', c: ['#f2b51f', '#a8740e', '#fff1a0', '#7a3fc8'], shop: true, price: 12, metal: true },
  chrome: { name: I18n.t('captain-hero.shinySilver'), icon: '💿', c: ['#dfe6f4', '#9aa6c8', '#ffffff', '#6ff0ff'], shop: true, price: 10, metal: true },
};
const ROBOT_BODIES = {
  basic:  { name: I18n.t('captain-hero.heartBody'),     icon: '❤️' },
  tank:   { name: I18n.t('captain-hero.captainBody'),     icon: '⭐', forest: true },
  core:   { name: I18n.t('captain-hero.lightningBody'),     icon: '⚡', forest: true },
  stego:  { name: I18n.t('captain-hero.stegosaurusPlates'),   icon: '🦕', forest: true },
  ankylo: { name: I18n.t('captain-hero.ankylosaurusArmour'),   icon: '🛡️', forest: true },
  rex:    { name: I18n.t('captain-hero.tRexTail'),   icon: '🦖', forest: true },
};
const ROBOT_HEADS = {
  dome:    { name: I18n.t('captain-hero.roundHead'),     icon: '🤖' },
  box:     { name: I18n.t('captain-hero.squareHead'),     icon: '📺', forest: true },
  captain: { name: I18n.t('captain-hero.captainHelmet'),     icon: '⭐', forest: true },
  trex:    { name: I18n.t('captain-hero.tRexHelmet'),   icon: '🦖', forest: true },
  tricera: { name: I18n.t('captain-hero.triceratopsHelmet'), icon: '🦕', forest: true },
  astro:   { name: I18n.t('captain-hero.spaceHelmet'),     icon: '🪐', shop: true, price: 12 },
  cat:     { name: I18n.t('captain-hero.catHead'),   icon: '🐱' },
  shark:   { name: I18n.t('captain-hero.sharkHelmet'),     icon: '🦈' },
};
const ROBOT_ARMS = {
  basic:  { name: I18n.t('captain-hero.basicArms'),   icon: '🦾' },
  claw:   { name: I18n.t('captain-hero.clawArms'),   icon: '🦀' },
  drill:  { name: I18n.t('captain-hero.drillArms'),   icon: '🔩' },
  magnet: { name: I18n.t('captain-hero.magnetArms'),   icon: '🧲' },
  hammer: { name: I18n.t('captain-hero.hammerArms'),   icon: '🔨' },
  scoop:  { name: I18n.t('captain-hero.diggerArms'), icon: '🚧' },
  rocket: { name: I18n.t('captain-hero.rocketFists'), icon: '🥊', shop: true, price: 10 },
};
const ROBOT_LEGS = {
  basic:  { name: I18n.t('captain-hero.basicLegs'),   icon: '🦿' },
  wheel:  { name: I18n.t('captain-hero.singleWheel'),      icon: '🛞' },
  treads: { name: I18n.t('captain-hero.tankTracks'),   icon: '🚜' },
  spring: { name: I18n.t('captain-hero.springLegs'), icon: '🌀' },
  skates: { name: I18n.t('captain-hero.rollerSkates'), icon: '🛼' },
  dino:   { name: I18n.t('captain-hero.dinosaurFeet'),     icon: '🦖', forest: true },
  hover:  { name: I18n.t('captain-hero.boosterLegs'), icon: '🔥', shop: true, price: 12 },
};
const ROBOT_BACKS = {
  none:    { name: I18n.t('captain-drone.none'),   icon: '' },
  wings:   { name: I18n.t('captain-hero.robotWings'), icon: '🪽' },
  propeller: { name: I18n.t('captain-hero.propeller'), icon: '🚁' },
  jetpack: { name: I18n.t('captain-hero.jetpack'), icon: '🚀', shop: true, price: 15 },
};
// The workbench's treasure shelf (TREASURES in the princess edition).
const ROBOT_TREASURES = {
  gear:      { name: I18n.t('captain-hero.gear'),   icon: '⚙️' },
  bolt:      { name: I18n.t('captain-hero.bolt'),       icon: '🔩' },
  wrench:    { name: I18n.t('captain-hero.spanner'),     icon: '🔧' },
  toolbox:   { name: I18n.t('captain-hero.toolbox'),  icon: '🧰' },
  bulb:      { name: I18n.t('captain-hero.lightBulb'),       icon: '💡' },
  torch:     { name: I18n.t('captain-hero.torch'),     icon: '🔦' },
  antenna:   { name: I18n.t('captain-hero.antenna'),     icon: '📡' },
  satellite: { name: I18n.t('captain-hero.satellite'),   icon: '🛰️' },
  telescope: { name: I18n.t('captain-hero.telescope'),     icon: '🔭' },
  microscope: { name: I18n.t('captain-hero.microscope'),    icon: '🔬' },
  flask:     { name: I18n.t('captain-hero.testTube'),     icon: '🧪' },
  magnet:    { name: I18n.t('captain-hero.horseshoeMagnet'),   icon: '🧲' },
  gamepad:   { name: I18n.t('captain-hero.gameConsole'),     icon: '🎮' },
  joystick:  { name: I18n.t('captain-hero.joystick'),   icon: '🕹️' },
  radio:     { name: I18n.t('captain-hero.radio'),     icon: '📻' },
  clock:     { name: I18n.t('captain-hero.alarmClock'),     icon: '⏰' },
  trophy:    { name: I18n.t('captain-hero.trophy'),     icon: '🏆' },
  medal:     { name: I18n.t('captain-hero.goldMedal'),     icon: '🥇' },
  planet:    { name: I18n.t('captain-hero.littlePlanet'),  icon: '🪐' },
  comet:     { name: I18n.t('captain-hero.shootingStar'),     icon: '🌠' },
  rocket:    { name: I18n.t('captain-hero.toyRocket'), icon: '🚀' },
  lights:    { name: I18n.t('captain-hero.trafficLight'),     icon: '🚦' },
  bone:      { name: I18n.t('captain-hero.dinosaurBone'),    icon: '🦴', forest: true },
  egg:       { name: I18n.t('captain-hero.dinosaurEgg'),    icon: '🥚', forest: true },
  chequer:   { name: I18n.t('captain-hero.chequeredFlag'),  icon: '🏁', unicorn: true },
  tyre:      { name: I18n.t('captain-hero.tyre'),     icon: '🛞', unicorn: true },
  plane:     { name: I18n.t('captain-hero.littlePlane'), icon: '🛩️', fairy: true },
  parachute: { name: I18n.t('captain-hero.parachute'),     icon: '🪂', fairy: true },
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
  swap(TREASURES, ROBOT_TREASURES);
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
    treasure: ['A cool treasure for you!', 'Look! A treasure for your workbench!', 'Here is something cool for your shelf!'],
    shelf: ['Onto your treasure shelf it goes!', 'It looks so cool on your shelf!'],
    dressup: ["Let's build your robot!", 'Time for a robot upgrade!', 'Pick your favourite parts!'],
    shop: ['What would you like today?', 'Pick a cool part!', 'These parts are extra special!'],
    poor: ['Oh, you need a few more coins. Beat the villains in the cave!', 'Almost! Visit the Villain Cave for more coins.', 'Not enough coins yet. The cave villains drop lots of coins!'],
    poorPond: ['Oh, you need a few more coins. Play with the magnet crane in town!', 'Almost! Load some boxes with the magnet crane for more coins.'],
    soldOut: ['Wow, you have every part already!', 'You bought all my parts! Amazing!'],
    // Said as a new part goes on and shows what it does (captainShowOff):
    // by slot, then by part. Recorded for every giver and the narrator.
    partShow: {
      hand: { basic: 'Wave, wave! Robot hands!', claw: 'Snip, snip! Claw arms!', drill: 'Whirr! Drill arms!', magnet: 'Clink! Magnet arms!', rocket: 'Boom! Rocket fists!',
        hammer: 'Bang, bang! Hammer arms!', scoop: 'Scoop, scoop! Digger arms!' },
      hair: { basic: 'Stomp, stomp! Robot legs!', wheel: 'Roll, roll! One big wheel!', treads: 'Rumble, rumble! Tank treads!', spring: 'Boing, boing! Spring legs!', hover: 'Whoosh! Booster legs!',
        skates: 'Zoom, zoom! Roller skates!', dino: 'Stomp, stomp! Dino feet!' },
      back: { jetpack: 'Zoom! Jetpack on!', wings: 'Whoosh! Robot wings!', propeller: 'Whirr! A propeller!' },
      head: 'Ta-da! A new head!',
      shape: 'Ta-da! A new body!',
      dress: 'Ta-da! New paint!',
    },
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
  // Each tab's title and picture; the head, body, arm and leg tabs show
  // the robot's own part (`part`, see renderTabs in game.js).
  const rows = {
    head: [I18n.t('captain-hero.head'), '🤖'], shape: [I18n.t('captain-hero.body'), '🔋'], hand: [I18n.t('captain-hero.arms'), '🦾'], hair: [I18n.t('captain-hero.legs'), '🦿'], dress: [I18n.t('captain-hero.paintColour'), '🎨'],
    back: [I18n.t('captain-hero.backAccessories'), '🚀'], ride: [I18n.t('captain-hero.carsCarVillage'), '🚗'], fairy: [I18n.t('captain-hero.helpersDroneVillage'), '🛸'], treasure: [I18n.t('captain-hero.treasureShelf'), '🧰'],
  };
  const order = Object.keys(rows);
  for (const w of wardrobe) {
    if (!rows[w.slot]) continue;
    [w.title, w.icon] = rows[w.slot];
    delete w.boyTitle;
    delete w.boyIcon;
    w.part = ['head', 'shape', 'hand', 'hair'].includes(w.slot);
  }
  wardrobe.sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot));
  document.querySelector('#wardrobe .wd-done').textContent = I18n.t('captain-hero.allFixed');
  document.querySelector('#shop .wd-name').textContent = place('shop');
}

// "🔵 파란 페인트": paint is named by colour.
function captainItemLabel(slot, v) {
  return slot === 'dress' ? I18n.t('captain-hero.paint', v.icon, v.name) : `${v.icon} ${v.name}`;
}

// The reward card's wording for a new part, car, buddy or treasure (also
// after a buy).
function captainRewardText(isNew, label, ride, buddy, shelf) {
  ui.rewardName.textContent = !isNew ? label : ride ? I18n.t('captain-hero.youHaveANewCar', label) : buddy ? I18n.t('captain-hero.youHaveANewFriend', label) : shelf ? I18n.t('captain-hero.onTheTreasureShelf', label) : I18n.t('captain-hero.onTheWorkbench', label);
  // Car buttons are worded by js/captain-car.js.
  const car = typeof CAPTAIN_RIDE_TEXT !== 'undefined' ? CAPTAIN_RIDE_TEXT : { yes: I18n.t('captain-car.rideNow'), no: I18n.t('captain-car.parkInTheGarage') };
  ui.rewardYes.textContent = ride ? car.yes : buddy ? I18n.t('captain-hero.comeWithMe') : shelf ? I18n.t('captain-hero.putOnTheTreasureShelf') : I18n.t('captain-hero.equipIt');
  ui.rewardNo.textContent = !isNew ? I18n.t('captain-hero.keepThisOne') : ride ? car.no : buddy ? I18n.t('captain-hero.leaveInTheHangar') : I18n.t('captain-hero.leaveOnTheWorkbench');
}

// Workbench, shop and start-screen wording that game.js sets as it goes.
const CAPTAIN_TEXT = {
  workbench: () => I18n.t('captain-hero.sWorkbench', TITLES[PLAYER.title].label),
  collected: (have, total) => I18n.t('captain-hero.partsCollected', have, total),
  shopOnly: I18n.t('captain-hero.aSpecialPartOnlySoldHere'),
  poor: n => I18n.t('captain-hero.youNeedMoreCoinsDefeatVillains', n),
  poorPond: n => I18n.t('captain-hero.youNeedMoreCoinsTryThe', n),
};

// ---- The robot's sprite ------------------------------------------------------
// 28 x 38, feet at (14, 37). The head and body sit in the middle (ROBOT_OX
// from the left); the arms hang outside them and the legs are 11 rows tall,
// so every arm and leg part has room for its own shape. Parts are stamped
// into a grid of colours; an ink outline goes round the whole silhouette at
// the end, so parts can overlap freely. Bitmaps are left halves or whole rows;
// `o` is ink inside the robot and `_` a hole that stays see-through (no ink),
// so a claw or a magnet stays open.

const ROBOT_W = 28;
const ROBOT_H = 38;
const ROBOT_OX = 3;
const ROBOT_INK = '#2f2c56';

function robotPalette(outfit) {
  const c = (ROBOT_PAINT[outfit.dress] || ROBOT_PAINT.blue).c;
  return {
    o: ROBOT_INK, d: c[0], D: c[1], L: c[2], t: c[3],
    a: '#d4dcec', A: '#9aa4c4', M: '#ffffff', j: '#5e6890', n: '#3c405e', N: '#6a7096',
    k: '#262c4c', K: '#38406a', e: '#6ff0ff', E: '#ffffff', p: '#ff8fb8',
    r: '#ff5a6a', R: '#c83a4a', y: '#ffd34d', Y: '#e09a2a', g: '#5fe08a', w: '#ffffff',
    i: '#fff4d6', I: '#e4cc9c', f: '#ffe066', F: '#ff8a3d', u: '#fff6c0', b: '#bfe8ff', B: '#8fc8f0',
    // A colour of its own for each arm and leg part: claw, drill, rocket
    // fist, spring, and the magnet's spark.
    c: '#ff8a2a', C: '#c8501a', z: '#e8eef8', Z: '#46507a', v: '#3fc4d8', V: '#1f80a8',
    q: '#4fe07a', Q: '#1f9a50', s: '#7ff4ff',
  };
}

// Heads: 16 columns (x 6..21), stamped from row y0 so the chin row lands
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
  // Pointed ears, pink inside, and whiskers either side of the screen.
  cat: { y0: 2, rows: [
    '.d............d.',
    '.dd..........dd.',
    '.dpd........dpd.',
    '.dppd......dppD.',
    '.dLpdddddddddpD.',
    '.dLLddddddddddD.',
    '.dLLddddddddddD.',
    '.dLkkkkkkkkkkDD.',
    'adLkEekkkkEekDDa',
    'AdLkeekkkkeekDDA',
    'wdLkeekkkkeekDDw',
    '.dLkpkekkekpkDD.',
    'wdLkkkkeekkkkDDw',
    '.ddDkkkkkkkkDDD.',
    '..dDDDDDDDDDDD..',
    '....jjjjjjjj....',
  ] },
  // A fin on top and rows of teeth round the screen.
  shark: { y0: 2, rows: [
    '.......dd.......',
    '......dLd.......',
    '.....dLLd.......',
    '....dLLddd......',
    '..ddddddddddDD..',
    '.dLLddddddddddD.',
    '.dLwAwAwAwAwADD.',
    '.dLkkkkkkkkkkDD.',
    'adLkEekkkkEekDDa',
    'AdLkeekkkkeekDDA',
    'adLkpkekkekpkDDa',
    '.dLkkkkeekkkkDD.',
    '.dLAwAwAwAwAwDD.',
    '.ddDDDDDDDDDDDD.',
    '..dDDDDDDDDDDD..',
    '....jjjjjjjj....',
  ] },
};
// The triceratops frill, behind the head (20 columns, x 4..23).
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

// Bodies: 16 columns (x 6..21), rows y18..26.
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
// Pieces behind a body (left side, x from ROBOT_OX; `both` mirrors it to the
// right too): stego plates beside the head, and a T-rex tail that sweeps
// down from behind the left leg to the ground.
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
  rex: { x: -3, y: 30, rows: [
    '.......ddd',
    '.....ddLLd',
    '...ddLLddD',
    '.ddLLddDD.',
    'dLLddDD...',
    '.dDD......',
  ] },
};
// Pieces in front of a body: the ankylosaurus shoulder spikes.
const ROBOT_BODY_FRONT = {
  ankylo: { x: 1, y: 16, rows: ['.i..', '.ii.', '..Ii'] },
};

// Arms: the left arm (x 0..9) from row y19, mirrored for the right. A
// painted shoulder, the upper arm and elbow, then the hand (frames 0 and 1)
// from y25, below the belt and beside the body (x 0..7).
const ROBOT_SHOULDER = [
  '......dddd',
  '.....dLLdd',
  '.....dDDd.',
  '.....aA...',
  '.....aA...',
  '....jj....',
];
// The drill bit: a long cone whose spiral turns between the frames.
function robotDrill(f) {
  const rows = ['...aA.....', '.jNNNNj...'];
  [[1, 6], [1, 6], [1, 6], [2, 5], [2, 5], [2, 5], [3, 4], [3, 4]].forEach(([x0, x1], j) => {
    let row = '';
    for (let x = 0; x < 10; x++) row += x < x0 || x > x1 ? '.' : (x + j + f) % 3 === 0 ? 'Z' : 'z';
    rows.push(row);
  });
  return rows;
}
const ROBOT_HANDS = {
  // A big white mitten that waves its thumb.
  basic: [[
    '...aA.....',
    '..aMMa....',
    '.aMMMMa...',
    '.aMMMMa...',
    '.aMMMAa...',
    '..aAAa....',
  ], [
    '...aA.....',
    '..aMMa....',
    'aaMMMMa...',
    '.aMMMMa...',
    '.aMMMAa...',
    '..aAAa....',
  ]],
  // An orange claw: open, then snapped shut.
  claw: [[
    '...aA.....',
    '..cccc....',
    '.cCCCCc...',
    'cCc__cCc..',
    'cC____Cc..',
    'cC____Cc..',
    '.Cc__cC...',
  ], [
    '...aA.....',
    '..cccc....',
    '.cCCCCc...',
    'cCc__cCc..',
    'cC____Cc..',
    '.cC__Cc...',
    '..cCCc....',
  ]],
  // A steel drill on a dark chuck.
  drill: [robotDrill(0), robotDrill(1)],
  // A red horseshoe magnet with white tips; a spark jumps between them.
  magnet: [[
    '...aA.....',
    '.rrrrrr...',
    'rRRRRRRr..',
    'rR____Rr..',
    'rR____Rr..',
    'MM____MM..',
    'aA....aA..',
  ], [
    '...aA.....',
    '.rrrrrr...',
    'rRRRRRRr..',
    'rR____Rr..',
    'rR_s__Rr..',
    'MM__s_MM..',
    'aA.ss.aA..',
    '...s......',
  ]],
  // A steel hammer that swings down.
  hammer: [[
    '...aA.....',
    '...nN.....',
    '..aaaaa...',
    '.aMMaaaA..',
    '.aMaaaAA..',
    '.aaaaaAA..',
    '..AAAAA...',
  ], [
    '...aA.....',
    '...nN.....',
    '...nN.....',
    '.aaaaaa...',
    'aMMaaaaA..',
    'aMaaaaAA..',
    '.AAAAAA...',
  ]],
  // A yellow digger bucket with steel teeth: open, then tipped up.
  scoop: [[
    '...aA.....',
    '...jj.....',
    '.yyyyyy...',
    'yYYYYYYy..',
    'yY____Yy..',
    'yY____Yy..',
    'yYyyyyYy..',
    'aAaAaAaA..',
  ], [
    '...aA.....',
    '...jj.....',
    '.yyyyyy...',
    'yYYYYYYy..',
    'yYyyyyYy..',
    '.aAaAaA...',
  ]],
  // A big teal rocket glove on a metal cuff, its booster flickering.
  rocket: [[
    'u.aaaa....',
    'faAAAAa...',
    '.vvvvvv...',
    'vvMvvvvv..',
    'vMvvvvvV..',
    'vMvvVvvV..',
    'vvvVvvVV..',
    '.vvvvVV...',
    '..VVVV....',
  ], [
    '..aaaa....',
    'uaAAAAa...',
    'fvvvvvv...',
    'vvMvvvvv..',
    'vMvvvvvV..',
    'vMvvVvvV..',
    'vvvVvvVV..',
    '.vvvvVV...',
    '..VVVV....',
  ]],
};
// The blast pose's right arm, pointing straight out with a glowing fist
// (x 18..27; see captainHeroHand).
const ROBOT_BLAST = [
  'dddd....ff',
  'dLLdaAMwwf',
  'dDDdaAMwwf',
  '.dd.....ff',
];

// Legs, from row y27 down to the feet on y37. Basic, spring and booster
// legs are the left leg (x 7..12) mirrored; frame 1 lifts the left foot,
// squashes its spring or flickers the flames. The wheel and the treads are
// whole rows, with a frame that turns.
const ROBOT_LEG_ROWS = {
  basic: [[
    '..jj..',
    '..aA..',
    '..aA..',
    '..jj..',
    '..aA..',
    '..aA..',
    '.dddd.',
    'dLdddD',
    'dLdddD',
    'ddddDD',
    'jjjjjj',
  ]],
  spring: [[
    '..jj..',
    '.qqqqq',
    '.....Q',
    '.qqqqq',
    '.Q....',
    '.qqqqq',
    '.....Q',
    '.qqqqq',
    '.dddd.',
    'dLdddD',
    'jjjjjj',
  ], [
    '..jj..',
    '.qqqqq',
    '.....Q',
    '.qqqqq',
    '.Q....',
    '.qqqqq',
    '.dddd.',
    'dLdddD',
    'dLdddD',
    'jjjjjj',
  ]],
  // Roller skates: a striped boot on four little wheels.
  skates: [[
    '..jj..',
    '..aA..',
    '..aA..',
    '..jj..',
    '..aA..',
    '.dddd.',
    'dLdddD',
    'dLdddD',
    'tttttt',
    'jjjjjj',
    'nN..nN',
  ]],
  // Big dinosaur feet with three ivory claws.
  dino: [[
    '..jj..',
    '..dD..',
    '.ddDD.',
    '.dLdD.',
    '.dLdD.',
    '.dLdDD',
    'ddLddD',
    'dLdddD',
    'dLdddD',
    'dddddD',
    'i.i.i.',
  ]],
  // Booster legs: a big tube with a jet nozzle and a flame, flickering.
  hover: [[
    '..jj..',
    '.aaAA.',
    'aMaaAA',
    'aMaaAA',
    'dLdddD',
    'dddddD',
    '.nNNn.',
    '.fuuf.',
    '.fuuf.',
    '..fF..',
    '..F...',
  ], [
    '..jj..',
    '.aaAA.',
    'aMaaAA',
    'aMaaAA',
    'dLdddD',
    'dddddD',
    '.nNNn.',
    '.fuuf.',
    '.Ffuf.',
    '.fF...',
    '.F....',
  ]],
};
// One big wheel under the hips (x 6..21 from y26); the spokes turn.
const ROBOT_WHEEL = [[
  '....dd....dd....',
  '....dD....dD....',
  '......nnnn......',
  '....nnNNNNnn....',
  '...nNaaaaaaNn...',
  '..nNaaaMMaaaNn..',
  '..nNaaaMMaaaNn..',
  '..nNaMMyyMMaNn..',
  '..nNaMMyyMMaNn..',
  '..nNaaaMMaaaNn..',
  '...nNaaMMaaNn...',
  '....nnNNNNnn....',
], [
  '....dd....dd....',
  '....dD....dD....',
  '......nnnn......',
  '....nnNNNNnn....',
  '...nNaMaaaMNn...',
  '..nNaaaMaaMaNn..',
  '..nNaaaaMMaaNn..',
  '..nNaaayyaaaNn..',
  '..nNaaayyaaaNn..',
  '..nNaaMMaaaaNn..',
  '...nNaMaaaMNn...',
  '....nnNNNNnn....',
]];
// Tank treads (x 5..22 from y27): a painted housing over a track with three
// road wheels; the teeth run and the hubs turn.
const ROBOT_TREADS = [[
  '.....jj....jj.....',
  '..dddddddddddddd..',
  '.dLLdddddddddddDd.',
  '.dDDDDDDDDDDDDDDd.',
  '.nNnNnNnNnNnNnNnN.',
  'nnaannnnaannnnaann',
  'naMyannaMyannaMyan',
  'nayyAnnayyAnnayyAn',
  'nnAAnnnnAAnnnnAAnn',
  'nnnnnnnnnnnnnnnnnn',
  '.NnNnNnNnNnNnNnNn.',
], [
  '.....jj....jj.....',
  '..dddddddddddddd..',
  '.dLLdddddddddddDd.',
  '.dDDDDDDDDDDDDDDd.',
  '.NnNnNnNnNnNnNnNn.',
  'nnaannnnaannnnaann',
  'nayyannayyannayyan',
  'nayMAnnayMAnnayMAn',
  'nnAAnnnnAAnnnnAAnn',
  'nnnnnnnnnnnnnnnnnn',
  '.nNnNnNnNnNnNnNnN.',
]];
// Jetpack: a little rocket over each shoulder, flames below.
const ROBOT_JETPACK = ['.r.', 'rrR', 'aMA', 'aaA', 'tttt', 'aaA', 'aaA', 'aaA', 'aaA', 'aaA', 'aaA', 'jjj'];
// Steel wings in the robot's paint, beside its head (the left one).
const ROBOT_WINGS = [
  'aa.....',
  'aMa....',
  'aMda...',
  'aMdda..',
  '.aMdda.',
  '.aMddda',
  '..aMdda',
  '..aMdda',
  '...aMda',
  '...aaMa',
  '....aaa',
];
// A propeller on a mast above the head; the blades turn between frames.
const ROBOT_PROPELLER = [
  ['rrrrrrrrrjMMjrrrrrrrrr', 'RRRRRRRRRjAAjRRRRRRRRR', '..........aA..........'],
  ['......rrrjMMjrrr......', '......RRRjAAjRRR......', '..........aA..........'],
];

// A grid of colours to stamp bitmaps into (w x h, the robot's by default).
function robotGrid(w = ROBOT_W, h = ROBOT_H) {
  const g = [];
  const hole = [];
  for (let y = 0; y < h; y++) { g.push(new Array(w).fill(null)); hole.push(new Array(w).fill(false)); }
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const set = (x, y, col) => { if (col && inside(x, y)) { g[y][x] = col; hole[y][x] = false; } };
  // Copies a bitmap in, mirrored about the middle when `flip`. `_` clears
  // the cell and keeps it clear of ink.
  const stamp = (rows, pal, x0, y0, flip) => {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.') continue;
        const x = flip ? w - 1 - (x0 + i) : x0 + i;
        const y = y0 + j;
        if (ch !== '_') set(x, y, pal[ch]);
        else if (inside(x, y)) { g[y][x] = null; hole[y][x] = true; }
      }
    });
  };
  return { g, hole, w, h, set, stamp };
}

// Paints a grid with an ink outline round the outside. Holes stay clear, and
// flames and sparks glow without one.
function robotInk(G, pal) {
  const cv = makeCanvas(G.w, G.h);
  const ctx = cv.getContext('2d');
  const glow = new Set([pal.f, pal.F, pal.u, pal.s]);
  const solid = c => c && !glow.has(c);
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) {
    if (G.g[y][x]) px(ctx, x, y, 1, 1, G.g[y][x]);
    else if (!G.hole[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => G.g[y + dy] && solid(G.g[y + dy][x + dx]))) px(ctx, x, y, 1, 1, ROBOT_INK);
  }
  return cv;
}

const robotCache = new Map();

// Returns { canvas, ax, ay, shine } for an outfit and frame. Frames 0 and 1
// walk (and move each part); 'blast' fires from the right fist (see
// captainHeroHand), 'shield' wraps the robot in an energy bubble and 'punch'
// is frame 0 with the right fist flown off; 'bare' has no arms (for the
// part chips). `shine` lists the painted
// pixels, where gold and chrome paint glint.
function robotSprite(outfit, frame) {
  const key = `${outfit.dress}|${outfit.shape}|${outfit.head}|${outfit.hand}|${outfit.hair}|${outfit.back}|${frame}`;
  if (robotCache.has(key)) return robotCache.get(key);
  const pal = robotPalette(outfit);
  const G = robotGrid();
  const step = frame === 1;
  const flame = (x, y) => { G.set(x, y, pal.f); G.set(x, y + 1, step ? pal.F : pal.f); G.set(x + (step ? 1 : -1), y + 2, pal.F); };
  const OX = ROBOT_OX;

  // Behind everything: the jetpack, a frill, plates or a tail.
  if (outfit.back === 'jetpack') {
    for (const flip of [false, true]) G.stamp(ROBOT_JETPACK, pal, 2, 8, flip);
    flame(3, 20);
    flame(24, 20);
  } else if (outfit.back === 'wings') {
    for (const flip of [false, true]) G.stamp(ROBOT_WINGS, pal, 0, 5, flip);
  } else if (outfit.back === 'propeller') {
    G.stamp(ROBOT_PROPELLER[step ? 1 : 0], pal, 3, 0, false);
  }
  if (outfit.head === 'tricera') G.stamp(ROBOT_FRILL, pal, OX + 1, 1, false);
  const back = ROBOT_BODY_BACK[outfit.shape];
  if (back) {
    G.stamp(back.rows, pal, OX + back.x, back.y, false);
    if (back.both) G.stamp(back.rows, pal, OX + back.x, back.y, true);
  }

  // Legs.
  const legs = outfit.hair;
  if (legs === 'wheel') G.stamp(ROBOT_WHEEL[step ? 1 : 0], pal, 6, 26, false);
  else if (legs === 'treads') G.stamp(ROBOT_TREADS[step ? 1 : 0], pal, 5, 27, false);
  else {
    const rows = ROBOT_LEG_ROWS[legs] || ROBOT_LEG_ROWS.basic;
    // Walking: the left foot lifts (or its spring squashes) on frame 1;
    // booster flames flicker on both sides, out of step.
    G.stamp(step && rows[1] ? rows[1] : rows[0], pal, 7, step && !rows[1] ? 26 : 27, false);
    G.stamp(legs === 'hover' && !step ? rows[1] : rows[0], pal, 7, 27, true);
  }

  // Body.
  G.stamp(ROBOT_BODY_ROWS[outfit.shape] || ROBOT_BODY_ROWS.basic, pal, OX + 3, 18, false);

  // Arms: the left one (on the left of the picture) dips as the right one
  // swings up, and both hands move. A blast points the right arm straight
  // out; a punch has sent the right fist flying.
  const hand = (ROBOT_HANDS[outfit.hand] || ROBOT_HANDS.basic)[step ? 1 : 0];
  if (frame !== 'bare') G.stamp(ROBOT_SHOULDER.concat(hand), pal, 0, step ? 20 : 19, false);
  if (frame === 'blast') G.stamp(ROBOT_BLAST, pal, 18, 19, false);
  else if (frame === 'punch') G.stamp(ROBOT_SHOULDER, pal, 0, 19, true);
  else if (frame !== 'bare') G.stamp(ROBOT_SHOULDER.concat(hand), pal, 0, step ? 18 : 19, true);
  const front = ROBOT_BODY_FRONT[outfit.shape];
  if (front) {
    G.stamp(front.rows, pal, OX + front.x, front.y, false);
    G.stamp(front.rows, pal, OX + front.x, front.y, true);
  }

  // The head goes on last.
  const head = ROBOT_HEAD_ROWS[outfit.head] || ROBOT_HEAD_ROWS.dome;
  G.stamp(head.rows, pal, OX + 3, head.y0, false);

  // Paint the grid, with an ink outline round the outside.
  const cv = robotInk(G, pal);
  const ctx = cv.getContext('2d');
  if (frame === 'shield') {
    // A see-through bubble with a bright rim and a twinkle.
    for (let y = 0; y < ROBOT_H; y++) for (let x = 0; x < ROBOT_W; x++) {
      const d = ((x + 0.5 - 14) / 14) ** 2 + ((y + 0.5 - 19.5) / 19) ** 2;
      if (d > 1) continue;
      ctx.globalAlpha = d > 0.8 ? 0.85 : 0.2;
      px(ctx, x, y, 1, 1, d > 0.8 ? '#8ff4ff' : '#c8faff');
    }
    ctx.globalAlpha = 1;
    px(ctx, 5, 8, 2, 1, '#ffffff');
    px(ctx, 4, 9, 1, 2, '#ffffff');
  }
  const shine = [];
  for (let y = 0; y < ROBOT_H; y++) for (let x = 0; x < ROBOT_W; x++) if (G.g[y][x] === pal.d || G.g[y][x] === pal.L) shine.push([x, y]);
  const sprite = { canvas: cv, ax: 14, ay: 37, shine };
  robotCache.set(key, sprite);
  return sprite;
}

// One hand on its own (frame 0), such as the rocket fist that flies off in a
// punch: { canvas, x, y }, where x, y is where it sits on the robot's canvas.
// `right` for the right hand.
function robotHandSprite(outfit, right) {
  const key = `hand|${outfit.dress}|${outfit.hand}|${!!right}`;
  if (robotCache.has(key)) return robotCache.get(key);
  const rows = (ROBOT_HANDS[outfit.hand] || ROBOT_HANDS.basic)[0];
  const G = robotGrid(12, rows.length + 2);
  G.stamp(rows, robotPalette(outfit), 1, 1, !!right);
  const sprite = { canvas: robotInk(G, robotPalette(outfit)), x: right ? ROBOT_W - 11 : -1, y: 24 };
  robotCache.set(key, sprite);
  return sprite;
}

// Draws the robot standing on (x, y), with its shadow, like drawSprite.
function drawCaptainHero(ctx, outfit, frame, x, y, flip) {
  drawSprite(ctx, robotSprite(outfit, frame), x, y, flip);
}

// Where the glowing fist of the 'blast' pose is, from the robot's feet.
function captainHeroHand(flip) {
  return { x: flip ? -12 : 12, y: -17 };
}

// ---- Riding a car ------------------------------------------------------------
// js/captain-car.js draws the cars and the rider: it cuts the robot at its
// belt, this many rows from the top of robotSprite's canvas.
function captainHeroWaist(outfit) {
  return 26;
}


// ---- Showing off a new part ---------------------------------------------------
// When a part goes on (a present put on, or a chip tapped on the workbench)
// the robot shows it off for SHOW_MS: it pops up to twice its size, its new
// pixels blink white three times and the part does its thing: the claw
// snaps, the drill spins with sparks, the magnet pulls in a bolt, the rocket
// fist punches, springs bounce, the wheel and treads roll, boosters and the
// jetpack lift it, and a new head, body or paint spins round. The same
// drawing runs in the world (over everything) and in the workbench mirror.

const SHOW_MS = 1600;
let robotShow = null; // playing in the world
let benchShow = null; // playing in the workbench mirror

const robotKey = o => `${o.dress}|${o.shape}|${o.head}|${o.hand}|${o.hair}|${o.back}`;

// A show: { slot, value, prev, outfit, t0 }, or null for a car or a buddy.
function robotShowFor(slot, prev, outfit) {
  if (slot === 'ride' || slot === 'fairy' || robotKey(prev) === robotKey(outfit)) return null;
  return { slot, value: outfit[slot], prev: Object.assign({}, prev), outfit: Object.assign({}, outfit), t0: performance.now() };
}

// What is said as a part goes on (LINES.partShow), or null.
function captainShowLine(slot, value) {
  const s = LINES.partShow && LINES.partShow[slot];
  return (typeof s === 'string' ? s : s && s[value]) || null;
}

// A present put on: the robot shows it off where it stands. Returns the
// line to say for it, or null.
function captainShowOff(slot, prev, outfit) {
  const show = robotShowFor(slot, prev, outfit);
  if (!show) return null;
  show.scene = state.scene;
  robotShow = show;
  robotShowSound(show);
  return captainShowLine(slot, show.value);
}

// Whether the world show is playing (drawCharacter leaves the robot to
// drawCaptainShowOff meanwhile). Walking off or a new scene ends it.
function captainShowing(now) {
  const s = robotShow;
  if (s && (now - s.t0 > SHOW_MS || state.scene !== s.scene || state.hero.path.length)) robotShow = null;
  return !!robotShow;
}

// Called from drawOverlay: the robot, popped up, over everything else.
// Riding, it hops out beside its car to show off.
function drawCaptainShowOff(now) {
  if (!captainShowing(now)) return;
  // A frame's time can be a little before the tap that started the show.
  const ms = Math.max(0, now - robotShow.t0);
  const p = heroWorld();
  const flip = state.hero.flip;
  const q = toScreen(state.mounted ? p.x + (flip ? -9 : 9) : p.x, p.y + 1);
  drawRobotShow(sctx, robotShow, ms, q.x, q.y, state.scale * robotPop(ms), flip);
}

// How big the robot is: up to 2x in a quarter second with a little bounce,
// and back to 1x at the end.
function robotPop(ms) {
  if (ms < 250) {
    const k = ms / 250 - 1;
    return 2 + 2.7 * k * k * k + 1.7 * k * k;
  }
  if (ms < 1300) return 2;
  const k = Math.min(1, (ms - 1300) / 300);
  return 2 - k * k * (3 - 2 * k);
}

// The three white blinks.
const robotBlink = ms => [300, 600, 900].some(t => ms >= t && ms < t + 110);

// How the robot moves `ms` into a show: { frame, dx, dy, sx } in robot
// pixels (sx squeezes it sideways for a spin).
function robotShowPose(show, ms) {
  const { slot, value } = show;
  const act = ms > 250 && ms < 1300;
  const a = Math.max(0, Math.min(1, (ms - 250) / 1050));
  const alt = period => (act ? Math.floor(ms / period) % 2 : 0);
  const pose = { frame: 0, dx: 0, dy: 0, sx: 1 };
  if (slot === 'hand') {
    if (value === 'rocket') pose.frame = ms > 350 && ms < 1150 ? 'punch' : 0;
    else pose.frame = alt({ claw: 110, drill: 50, magnet: 140 }[value] || 200);
  } else if (slot === 'hair') {
    if (value === 'spring') {
      const b = Math.abs(Math.sin(a * Math.PI * 3));
      pose.dy = -Math.round(b * 8);
      pose.frame = act && b < 0.35 ? 1 : 0;
    } else if (value === 'wheel' || value === 'treads' || value === 'skates') {
      pose.frame = alt(80);
      pose.dx = Math.round(Math.sin(a * Math.PI * 2) * 6);
    } else if (value === 'hover') {
      pose.frame = Math.floor(ms / 70) % 2;
      pose.dy = -Math.round(Math.sin(a * Math.PI) * 6);
    } else {
      pose.frame = alt(160);
      pose.dy = -pose.frame;
    }
  } else if (slot === 'back' && value !== 'none') {
    // The jetpack, wings and propeller lift it off the ground.
    pose.frame = Math.floor(ms / 60) % 2;
    pose.dy = -Math.round(Math.sin(a * Math.PI) * 12);
  } else if (act) {
    // A new head, body or paint: two spins.
    const c = Math.cos(a * Math.PI * 4);
    pose.sx = Math.sign(c || 1) * Math.max(0.15, Math.abs(c));
  }
  return pose;
}

// Draws a show `ms` in, with the robot's feet on (x, y) of ctx, `u` canvas
// pixels to a robot pixel (any pop included), mirrored when `flip`.
function drawRobotShow(ctx, show, ms, x, y, u, flip) {
  const pose = robotShowPose(show, ms);
  const sprite = robotSprite(show.outfit, pose.frame);
  const dir = flip ? -1 : 1;
  const fx = Math.round(x + pose.dx * u * dir);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // The shadow stays on the ground when it jumps.
  ctx.fillStyle = 'rgba(40,30,70,0.22)';
  ctx.beginPath();
  ctx.ellipse(fx, Math.round(y), 7 * u, 2.5 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(fx, Math.round(y + pose.dy * u));
  ctx.scale(dir * pose.sx, 1);
  // Draws in robot pixels from the feet.
  const img = (cv, rx, ry) => ctx.drawImage(cv, rx * u, ry * u, cv.width * u, cv.height * u);
  const dot = (rx, ry, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(rx * u, ry * u, w * u, h * u); };
  img(sprite.canvas, -sprite.ax, -sprite.ay);
  if (robotBlink(ms)) {
    ctx.globalAlpha = 0.85;
    img(robotDiffMask(show.prev, show.outfit, pose.frame === 'punch' ? 0 : pose.frame), -sprite.ax, -sprite.ay);
    ctx.globalAlpha = 1;
  }
  robotShowExtras(show, ms, pose, img, dot, -pose.dy);
  ctx.restore();
}

// A little random number for spark i, the same every frame.
const showRand = (i, salt) => hash(i, salt, 77);

// What flies about in a show, in robot pixels from the feet. `lift` is how
// far up the robot is, so things can reach the ground.
function robotShowExtras(show, ms, pose, img, dot, lift) {
  const { slot, value, outfit } = show;
  // Sparks shot out from (x, y) of spark i, `age` ms old.
  const spark = (i, x, y, age, cols) => {
    const t = age / 1000;
    const vx = (showRand(i, 1) - 0.5) * 50;
    const vy = -20 - showRand(i, 2) * 35;
    dot(Math.round(x + vx * t), Math.round(y + vy * t + 140 * t * t), 1, 1, cols[i % cols.length]);
  };
  // Puffs of dust at (x, y), drifting off and fading.
  const puff = (x, y, age, drift) => {
    const k = age / 400;
    if (k < 0 || k > 1) return;
    const r = 1 + Math.round(k * 2);
    const col = `rgba(232,226,248,${(1 - k) * 0.9})`;
    dot(Math.round(x + drift * k * 6) - r, Math.round(y - k * 4) - r, r * 2, r * 2, col);
  };
  if (slot === 'hand' && value === 'drill') {
    // Sparks fly off both drill tips.
    for (let i = 0; i < 24; i++) {
      const age = ms - 260 - i * 40;
      if (age < 0 || age > 380) continue;
      spark(i, i % 2 ? 10 : -11, -2, age, ['#fff6c0', '#ffd34d', '#ff8a3d', '#ffffff']);
    }
  } else if (slot === 'hand' && value === 'magnet') {
    // A bolt on the ground in front flies up into each magnet and sticks.
    const k = Math.max(0, Math.min(1, (ms - 300) / 450));
    const e = k * k;
    for (const side of [-1, 1]) {
      const x = side * (22 - 12 * e) - 2.5;
      const y = (lift - 4) * (1 - e) - 5 * e - Math.sin(k * Math.PI) * 6;
      img(robotBolt(), Math.round(x), Math.round(y));
    }
  } else if (slot === 'hand' && value === 'rocket' && pose.frame === 'punch') {
    // The right fist flies out, hits, and flies home.
    const t = ms - 350;
    const out = t < 350 ? 1 - (1 - t / 350) ** 2 : t < 450 ? 1 : Math.max(0, 1 - (t - 450) / 350);
    const hand = robotHandSprite(outfit, true);
    const x = hand.x - ROBOT_W / 2 + Math.round(out * 16);
    const y = hand.y - (ROBOT_H - 1);
    if (t < 350) for (let j = 1; j <= 4; j++) dot(x + 2 - j * 2, y + 4, 2, 2, ['#fff6c0', '#ffe066', '#ff8a3d', '#ff8a3d'][j - 1]);
    img(hand.canvas, x, y);
    if (t >= 330 && t < 520) {
      // POW: a white star where it lands.
      dot(x + 12, y + 2, 1, 5, '#ffffff');
      dot(x + 10, y + 4, 5, 1, '#ffffff');
      dot(x + 11, y + 3, 3, 3, '#fff6c0');
    }
  } else if (slot === 'hair' && (value === 'wheel' || value === 'treads' || value === 'skates')) {
    // Dust behind the wheels as it rolls back and forth.
    for (let i = 0; i < 12; i++) {
      const born = 260 + i * 85;
      const a = (born - 250) / 1050;
      const back = Math.cos(a * Math.PI * 2) > 0 ? -1 : 1;
      puff(back * 8, lift, ms - born, back);
    }
  } else if (slot === 'hair' && value === 'spring') {
    // A puff each time it lands.
    for (let i = 1; i <= 3; i++) {
      const land = 250 + (1050 * i) / 3;
      puff(-6, lift, ms - land, -1);
      puff(6, lift, ms - land, 1);
    }
  } else if ((slot === 'hair' && value === 'hover') || (slot === 'back' && value === 'jetpack')) {
    // Long flames down towards the ground while it lifts off.
    const legs = slot === 'hair';
    const w = legs ? 2 : 1;
    const top = legs ? 1 : -14;
    const flick = Math.floor(ms / 60) % 2;
    const len = Math.max(2, lift + (legs ? 1 : 4)) + flick;
    for (const c of legs ? [-5, 3] : [-11, 10]) {
      dot(c, top, w, len, '#ffe066');
      dot(c, top, 1, Math.max(1, len - 2), '#fff6c0');
      dot(c + (w > 1 ? flick : 0), top + len, 1, 2, '#ff8a3d');
    }
  } else if (slot === 'hair') {
    // Stomping: a puff under each foot as it lands.
    for (let i = 0; i < 6; i++) puff(i % 2 ? 6 : -6, lift, ms - 250 - i * 160, i % 2 ? 1 : -1);
  } else if (slot !== 'hand') {
    // A spin: sparkles all round.
    for (let i = 0; i < 12; i++) {
      const age = ms - 260 - i * 70;
      if (age < 0 || age > 320) continue;
      const x = Math.round((showRand(i, 3) - 0.5) * 34);
      const y = -Math.round(4 + showRand(i, 4) * 36);
      const r = age < 160 ? 1 : 0;
      const col = i % 2 ? '#ffffff' : '#fff27a';
      dot(x - r, y, 1 + r * 2, 1, col);
      dot(x, y - r, 1, 1 + r * 2, col);
    }
  }
}

// A little nut for the magnet to pull in.
let robotBoltCanvas = null;
function robotBolt() {
  if (!robotBoltCanvas) {
    robotBoltCanvas = makeCanvas(5, 4);
    drawBitmap(robotBoltCanvas.getContext('2d'), ['.ooo.', 'oaMAo', 'oAjAo', '.ooo.'], { o: ROBOT_INK, a: '#d4dcec', M: '#ffffff', A: '#9aa4c4', j: '#5e6890' }, 0, 0);
  }
  return robotBoltCanvas;
}

// Each pixel's RGBA of a robot sprite, kept with it.
function robotPixels(outfit, frame) {
  const s = robotSprite(outfit, frame);
  if (!s.data) s.data = s.canvas.getContext('2d').getImageData(0, 0, ROBOT_W, ROBOT_H).data;
  return s.data;
}

// The pixels of `outfit` that differ from `prev`, in white.
const robotMaskCache = new Map();
function robotDiffMask(prev, outfit, frame) {
  const key = `${robotKey(prev)}>${robotKey(outfit)}|${frame}`;
  if (robotMaskCache.has(key)) return robotMaskCache.get(key);
  const a = robotPixels(prev, frame);
  const b = robotPixels(outfit, frame);
  const cv = makeCanvas(ROBOT_W, ROBOT_H);
  const ctx = cv.getContext('2d');
  for (let i = 0; i < b.length; i += 4) {
    if (!b[i + 3] || (a[i] === b[i] && a[i + 1] === b[i + 1] && a[i + 2] === b[i + 2] && a[i + 3] === b[i + 3])) continue;
    px(ctx, (i / 4) % ROBOT_W, Math.floor(i / 4 / ROBOT_W), 1, 1, '#ffffff');
  }
  robotMaskCache.set(key, cv);
  return cv;
}

// The part show's sounds (synthesized, see caveTone in js/captain-cave.js).
function robotShowSound(show) {
  if (typeof caveTone !== 'function') return;
  const { slot, value } = show;
  const part = slot === 'hand' || slot === 'hair' || slot === 'back' ? value : '';
  if (part === 'claw') for (let i = 0; i < 5; i++) caveTone(1800, 900, 0.06, 'square', 0.035, 0.3 + i * 0.22);
  else if (part === 'drill') caveTone(220, 880, 0.9, 'sawtooth', 0.025, 0.25);
  else if (part === 'magnet') { caveTone(300, 600, 0.4, 'sine', 0.05, 0.3); caveTone(2400, 2300, 0.12, 'triangle', 0.06, 0.75); }
  else if (part === 'rocket') { caveTone(180, 620, 0.35, 'sawtooth', 0.04, 0.35); caveTone(140, 60, 0.25, 'square', 0.07, 0.7); }
  else if (part === 'spring') for (let i = 0; i < 3; i++) caveTone(260, 720, 0.18, 'sine', 0.06, 0.25 + i * 0.35);
  else if (part === 'wheel' || part === 'treads' || part === 'skates') caveTone(90, 140, 1.0, 'sawtooth', 0.03, 0.25);
  else if (part === 'hover' || part === 'jetpack' || part === 'wings' || part === 'propeller') caveTone(300, 1100, 0.8, 'triangle', 0.04, 0.25);
  else if (part === 'hammer') for (let i = 0; i < 3; i++) caveTone(160, 90, 0.08, 'square', 0.07, 0.3 + i * 0.3);
  else for (let i = 0; i < 4; i++) caveTone(880 + i * 220, 1320 + i * 220, 0.1, 'triangle', 0.04, 0.3 + i * 0.12);
}

// Gold and chrome paint glint: a bright band runs over the paint every 2 s.
// Draws over `sprite` drawn standing on (x, y) like drawSprite.
function drawRobotGlint(ctx, outfit, sprite, x, y, flip, now) {
  const paint = ROBOT_PAINT[outfit.dress];
  const t = now % 2000;
  if (!paint || !paint.metal || !sprite.shine || t > 500) return;
  const band = -4 + (t / 500) * (ROBOT_W + ROBOT_H + 8);
  const dx = Math.round(x - (flip ? ROBOT_W - sprite.ax : sprite.ax));
  const dy = Math.round(y - sprite.ay);
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#ffffff';
  for (const [sx, sy] of sprite.shine) {
    if (Math.abs(sx + sy - band) > 1) continue;
    ctx.fillRect(dx + (flip ? ROBOT_W - 1 - sx : sx), dy + sy, 1, 1);
  }
  ctx.restore();
}

// ---- The workbench and shop mirror ----------------------------------------------
// A stage with room above the robot for its buddy and for jumps, and at
// the sides for a punch or a roll. The parts move gently (frames 0 and 1);
// a chip tap on the workbench plays a show (captainBenchShow).

const STAGE_W = 40;
const STAGE_H = 52;
const robotStages = new Map(); // canvas -> { outfit, riding }
let stageLoop = 0;

// Puts `outfit` on the stage in canvas `cv`, driving its car if `riding`.
function captainStage(cv, outfit, riding) {
  robotStages.set(cv, { outfit: Object.assign({}, outfit), riding: !!riding });
  drawStage(cv, performance.now());
  if (!stageLoop) stageLoop = requestAnimationFrame(stageTick);
}

// The stage on `cv` stops, so something else can be drawn there (a
// treasure in the shop's mirror).
function captainStageStop(cv) {
  robotStages.delete(cv);
}

// Redraws the open stages every frame, and stops when they are closed.
function stageTick(now) {
  stageLoop = 0;
  let open = false;
  for (const cv of robotStages.keys()) {
    if (!cv.offsetParent) continue;
    open = true;
    drawStage(cv, now);
  }
  if (open) stageLoop = requestAnimationFrame(stageTick);
  else benchShow = null;
}

function drawStage(cv, now) {
  const { outfit, riding } = robotStages.get(cv);
  const show = benchShow && benchShow.cv === cv && now - benchShow.t0 < SHOW_MS ? benchShow : null;
  const car = riding && outfit.ride !== 'none' ? riderSprite(outfit, 0) : null;
  const w = car ? Math.max(STAGE_W, 2 * Math.max(car.ax, car.canvas.width - car.ax) + 4) : STAGE_W;
  const h = car ? Math.max(STAGE_H, car.ay + 18) : STAGE_H;
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;
  const fx = w / 2;
  const fy = h - 3;
  let top = fy - ROBOT_H + 1;
  if (car) {
    ctx.drawImage(car.canvas, fx - car.ax, fy - car.ay);
    top = fy - car.ay;
  } else if (show) drawRobotShow(ctx, show, Math.max(0, now - show.t0), fx, fy, 1, false);
  else {
    const sprite = robotSprite(outfit, Math.floor(now / 500) % 2);
    drawSprite(ctx, sprite, fx, fy, false);
    drawRobotGlint(ctx, outfit, sprite, fx, fy, false, now);
  }
  // The buddy hovers over its head.
  if (FAIRIES[outfit.fairy] && outfit.fairy !== 'none') {
    drawFlying(ctx, fairySprite(outfit.fairy, Math.floor(now / 110) % 2), fx + 3, top - 4 + Math.round(Math.sin(now / 320)), false);
  }
}

// A chip tapped on the workbench: the mirror pulses and the robot in it
// shows the part off, saying what it is.
function captainBenchShow(slot, prev, outfit) {
  const show = robotShowFor(slot, prev, outfit);
  if (!show) return;
  show.cv = ui.wdPreview;
  benchShow = show;
  robotShowSound(show);
  const text = captainShowLine(slot, show.value);
  if (text) Sound.say([{ text, pitch: 1.3 }]);
  ui.wdPreview.classList.remove('pulse');
  void ui.wdPreview.offsetWidth;
  ui.wdPreview.classList.add('pulse');
}

// ---- The reward card --------------------------------------------------------------
// Previews in whole screen pixels per robot pixel; the new look moves, its
// new pixels blink, and a magnifier shows the part that changes: the old
// one, then the new one. Tapping the new look blinks it again.

let rewardAnim = 0;

// Sizes preview canvases to the same whole number of screen pixels per
// pixel, as big as fits.
function captainPreviewSize(...cvs) {
  let k = window.innerWidth < 600 ? 3 : 5;
  for (const cv of cvs) k = Math.min(k, Math.floor(180 / cv.width), Math.floor(260 / cv.height));
  k = Math.max(2, k);
  for (const cv of cvs) {
    cv.style.width = `${cv.width * k}px`;
    cv.style.height = `${cv.height * k}px`;
  }
}

// The box round what changes between two outfits ([x, y, w, h] on the
// robot's canvas), or null. Arms: just the left one, so it shows big.
function robotChangeBox(slot, prev, next) {
  let x0 = ROBOT_W;
  let y0 = ROBOT_H;
  let x1 = -1;
  let y1 = -1;
  for (const f of [0, 1]) {
    const a = robotPixels(prev, f);
    const b = robotPixels(next, f);
    for (let i = 0; i < a.length; i += 4) {
      if (a[i] === b[i] && a[i + 1] === b[i + 1] && a[i + 2] === b[i + 2] && a[i + 3] === b[i + 3]) continue;
      const x = (i / 4) % ROBOT_W;
      const y = Math.floor(i / 4 / ROBOT_W);
      if (slot === 'hand' && x >= ROBOT_W / 2) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - 1);
  y0 = Math.max(0, y0 - 1);
  return [x0, y0, Math.min(ROBOT_W - 1, x1 + 1) - x0 + 1, Math.min(ROBOT_H - 1, y1 + 1) - y0 + 1];
}

// The magnifier: the box of `outfit` as big as it fits, flashing white
// when `flash`.
function drawRobotZoom(cv, outfit, frame, box, flash) {
  const S = 120;
  if (cv.width !== S) { cv.width = S; cv.height = S; }
  const [x, y, w, h] = box;
  const k = Math.max(1, Math.floor(Math.min(S / w, S / h)));
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, S, S);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(robotSprite(outfit, frame).canvas, x, y, w, h, Math.floor((S - w * k) / 2), Math.floor((S - h * k) / 2), w * k, h * k);
  if (flash) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(0, 0, S, S);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// Called by offerReward and buyPick once the previews are drawn: `now` and
// `next` are the outfits shown, `room` whether they leave room for a buddy.
function captainRewardShow(gift, now, next, room) {
  clearInterval(rewardAnim);
  captainPreviewSize(ui.pvNow, ui.pvNew);
  const zoom = document.getElementById('pv-zoom');
  const box = gift.slot === 'ride' || gift.slot === 'fairy' ? null : robotChangeBox(gift.slot, now, next);
  zoom.parentNode.classList.toggle('hidden', !box);
  ui.pvNew.onclick = null;
  if (!box) return;
  const top = room ? FAIRY_ROOM : 0;
  let t0 = performance.now();
  ui.pvNew.onclick = () => { t0 = performance.now(); };
  const tick = () => {
    if (ui.reward.classList.contains('hidden')) { clearInterval(rewardAnim); return; }
    const time = performance.now();
    const t = time - t0;
    const f = Math.floor(t / 250) % 2;
    const sprite = heroPortrait(next, false, room, f);
    drawPortrait(ui.pvNew, sprite);
    const ctx = ui.pvNew.getContext('2d');
    if (t < 2400 && Math.floor(t / 200) % 2 === 0) {
      ctx.globalAlpha = 0.75;
      ctx.drawImage(robotDiffMask(now, next, f), 0, top);
      ctx.globalAlpha = 1;
    }
    drawRobotGlint(ctx, next, robotSprite(next, f), sprite.ax, sprite.ay, false, time);
    const z = t % 2600;
    drawRobotZoom(zoom, z < 800 ? now : next, f, box, z >= 800 && z < 950);
  };
  tick();
  rewardAnim = setInterval(tick, 50);
}

// ---- Workbench and shop chips ----------------------------------------------------
// Arms, legs, heads, bodies and the jetpack show the part itself, cut from
// the robot's sprite, so a child who can't read 집게 팔 sees the claw.

// Where each slot's part is on the robot's canvas: [x, y, w, h].
const ROBOT_PART_BOX = { hand: [0, 24, 8, 11], hair: [4, 26, 20, 12], head: [4, 0, 20, 19], shape: [6, 17, 16, 11], back: [1, 7, 26, 17] };
const robotIconCache = new Map();

// A canvas showing `value` in `slot` on this robot, or null for slots
// without one (paint, cars and buddies).
function captainPartIcon(slot, value, outfit, max = 40) {
  const box = ROBOT_PART_BOX[slot];
  if (!box || value === 'none') return null;
  const o = Object.assign({}, outfit, { [slot]: value });
  const dpr = Math.min(3, Math.round(window.devicePixelRatio || 1));
  const key = `${robotKey(o)}|${slot}|${dpr}|${max}`;
  if (!robotIconCache.has(key)) {
    if (robotIconCache.size > 400) robotIconCache.clear();
    let [x, y, w, h] = box;
    if (slot === 'shape' || slot === 'back') {
      // Bodies: the torso, and plates, spikes or a tail if it has them;
      // backs: wings and a propeller reach up past the head.
      const more = robotChangeBox(slot, Object.assign({}, o, { [slot]: slot === 'shape' ? 'basic' : 'none' }), o);
      if (more) {
        const x1 = Math.max(x + w, more[0] + more[2]);
        const y1 = Math.max(y + h, more[1] + more[3]);
        x = Math.min(x, more[0]);
        y = Math.min(y, more[1]);
        w = x1 - x;
        h = y1 - y;
      }
    }
    // Up to `max` screen pixels across, in device pixels.
    const k = [4, 3, 2.5, 2, 1.5].find(n => Math.max(w, h) * n <= max) || 1.5;
    const cv = makeCanvas(Math.round(w * k) * dpr, Math.round(h * k) * dpr);
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // Arms show on their own chips only.
    ctx.drawImage(robotSprite(o, slot === 'hand' ? 0 : 'bare').canvas, x, y, w, h, 0, 0, cv.width, cv.height);
    robotIconCache.set(key, cv);
  }
  const icon = robotIconCache.get(key);
  const cv = makeCanvas(icon.width, icon.height);
  cv.className = 'part';
  cv.style.width = `${icon.width / dpr}px`;
  cv.style.height = `${icon.height / dpr}px`;
  cv.getContext('2d').drawImage(icon, 0, 0);
  return cv;
}
