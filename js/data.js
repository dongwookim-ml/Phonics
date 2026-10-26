// Phonics content, rewards and characters for PixelTown.
// Everything a parent might want to tweak lives in this file.

// Which game this is: 'princess' (the original) or 'captain' (the robot
// edition). Chosen on the login screen; ?edition=captain overrides it.
const EDITION = (() => {
  try {
    const q = /[?&]edition=(\w+)/.exec(location.search);
    const e = q ? q[1] : localStorage.getItem('pixeltown-edition');
    return e === 'captain' ? 'captain' : 'princess';
  } catch (e) { return 'princess'; }
})();
const isCaptain = () => EDITION === 'captain';

// Scene builders for the captain edition, by scene name (js/captain-*.js
// fill this in). A scene without one uses the princess builder.
const CAPTAIN_SCENES = {};

// The hero's name and title, chosen on the start screen and saved.
// `spoken` is read by the English voice, `shown` is on screen.
// `look` is 'girl' or 'boy': which hero sprite and wardrobe she or he gets.
const PLAYER = { spoken: 'Yuna', shown: '윤아', title: 'princess', look: 'girl' };
if (isCaptain()) Object.assign(PLAYER, { spoken: 'Max', shown: '맥스', title: 'captain', look: 'robot' });

// Titles the hero can pick. `en` is what villagers call her, `ko` is shown.
// A title with a `look` decides the hero's look; the others let you choose.
const TITLES = {
  princess: { ko: '공주',   en: 'Princess', icon: '👸', look: 'girl' },
  prince:   { ko: '왕자',   en: 'Prince',   icon: '🤴', look: 'boy' },
  queen:    { ko: '여왕',   en: 'Queen',    icon: '👑', look: 'girl' },
  king:     { ko: '왕',     en: 'King',     icon: '🤴', look: 'boy' },
  knight:   { ko: '기사',   en: 'Knight',   icon: '🛡️' },
  fairy:    { ko: '요정',   en: 'Fairy',    icon: '🧚', look: 'girl' },
  wizard:   { ko: '마법사', en: 'Wizard',   icon: '🧙' },
  explorer: { ko: '탐험가', en: 'Explorer', icon: '🧭' },
  captain:  { ko: isCaptain() ? '캡틴' : '선장', en: 'Captain', icon: isCaptain() ? '🤖' : '⚓', look: isCaptain() ? 'robot' : undefined },
};

// Place names, shown on signs and when she arrives. Values may be functions
// of the hero (her room carries her name); use place(key).
const PLACES = isCaptain() ? {
  town: '🤖 로봇 마을', forest: '🦖 공룡 마을', fairy: '🛸 드론 마을', unicorn: '🚗 자동차 마을', dungeon: '😈 악당 동굴',
  castle: '🛡️ 캡틴 본부', castle2: '📚 본부 2층', library: '📚 본부 도서관', room: () => '🛏️ 캡틴의 방', shop: '🔧 부품 상점',
  game: '로봇 마을',
} : {
  town: '🌸 소리 마을', forest: '🌲 별빛 숲 마을', fairy: '🧚 요정 마을', unicorn: '🦄 유니콘 마을', dungeon: '💎 반짝 동굴',
  castle: () => `🏰 ${TITLES[PLAYER.title].ko}님의 성`, castle2: '📚 성 2층', library: '📚 왕실 도서관', room: () => `🎀 ${PLAYER.shown}의 방`, shop: '🎁 별빛 상점',
  game: '소리 마을',
};
const place = key => (typeof PLACES[key] === 'function' ? PLACES[key]() : PLACES[key]);
// Just the name, without its emoji.
const placeName = key => place(key).replace(/^[^\p{L}]+\s/u, '');

// Letters and words. `sound` is what the speech engine says for the
// letter sound; short spellings like "buh" work better than IPA.
// The first twelve letters each get a house in town (see TOWN_HOUSES).
const LETTERS = [
  { letter: 'A', sound: 'ah',  color: '#ff7a8a', words: [['apple', '🍎'], ['ant', '🐜'], ['alligator', '🐊'], ['ambulance', '🚑'], ['avocado', '🥑'], ['anchor', '⚓'], ['astronaut', '👨‍🚀'], ['arrow', '🏹']] },
  { letter: 'B', sound: 'buh', color: '#6fa8ff', words: [['bus', '🚌'], ['ball', '⚽'], ['banana', '🍌'], ['bear', '🐻'], ['bird', '🐦'], ['book', '📖'], ['boat', '⛵'], ['butterfly', '🦋']] },
  { letter: 'C', sound: 'kuh', color: '#ffb347', words: [['cat', '🐱'], ['car', '🚗'], ['cake', '🎂'], ['cow', '🐮'], ['corn', '🌽'], ['carrot', '🥕'], ['cookie', '🍪'], ['camel', '🐫']] },
  { letter: 'D', sound: 'duh', color: '#a78bfa', words: [['dog', '🐶'], ['duck', '🦆'], ['drum', '🥁'], ['dolphin', '🐬'], ['door', '🚪'], ['dinosaur', '🦕'], ['donut', '🍩'], ['dragon', '🐉']] },
  { letter: 'F', sound: 'fff', color: '#5cc98a', words: [['fish', '🐟'], ['frog', '🐸'], ['fox', '🦊'], ['flag', '🚩'], ['fire', '🔥'], ['foot', '🦶'], ['fork', '🍴'], ['fairy', '🧚']] },
  { letter: 'G', sound: 'guh', color: '#f59ec8', words: [['goat', '🐐'], ['grapes', '🍇'], ['gift', '🎁'], ['guitar', '🎸'], ['gorilla', '🦍'], ['ghost', '👻'], ['glasses', '👓'], ['girl', '👧']] },
  { letter: 'H', sound: 'hhh', color: '#ff9a6b', words: [['hat', '🎩'], ['horse', '🐴'], ['house', '🏠'], ['heart', '❤️'], ['hippo', '🦛'], ['hammer', '🔨'], ['honey', '🍯'], ['helicopter', '🚁']] },
  { letter: 'M', sound: 'mmm', color: '#ff6fb5', words: [['moon', '🌙'], ['monkey', '🐵'], ['milk', '🥛'], ['mouse', '🐭'], ['mushroom', '🍄'], ['map', '🗺️'], ['mango', '🥭'], ['mountain', '⛰️']] },
  { letter: 'N', sound: 'nnn', color: '#7fd4d9', words: [['nose', '👃'], ['nut', '🥜'], ['net', '🥅'], ['nine', '9️⃣'], ['noodles', '🍜'], ['notebook', '📓'], ['newspaper', '📰']] },
  { letter: 'P', sound: 'puh', color: '#e48a5c', words: [['pig', '🐷'], ['pizza', '🍕'], ['penguin', '🐧'], ['panda', '🐼'], ['popcorn', '🍿'], ['pumpkin', '🎃'], ['pencil', '✏️'], ['pineapple', '🍍']] },
  { letter: 'S', sound: 'sss', color: '#4cc3d9', words: [['sun', '☀️'], ['snake', '🐍'], ['star', '⭐'], ['sock', '🧦'], ['spoon', '🥄'], ['strawberry', '🍓'], ['snowman', '⛄'], ['spider', '🕷️']] },
  { letter: 'T', sound: 'tuh', color: '#c39bff', words: [['tiger', '🐯'], ['tree', '🌳'], ['turtle', '🐢'], ['tomato', '🍅'], ['train', '🚂'], ['tent', '⛺'], ['tooth', '🦷'], ['taxi', '🚕']] },
  { letter: 'L', sound: 'lll', color: '#9bd36b', words: [['lion', '🦁'], ['leaf', '🍃'], ['lemon', '🍋'], ['ladybug', '🐞'], ['lollipop', '🍭'], ['lizard', '🦎'], ['lock', '🔒'], ['llama', '🦙']] },
  { letter: 'R', sound: 'rrr', color: '#ff8f8f', words: [['rabbit', '🐰'], ['rainbow', '🌈'], ['ring', '💍'], ['robot', '🤖'], ['rocket', '🚀'], ['rose', '🌹'], ['rooster', '🐓'], ['raccoon', '🦝']] },
];

// Optional recorded audio. Set to true and drop files into audio/ as
//   audio/letters/b.mp3  (the letter sound, e.g. "buh")
//   audio/words/bus.mp3  (the whole word)
// Any missing file falls back to the browser's speech voice.
const USE_RECORDINGS = false;

// ---- Princess wardrobe ---------------------------------------------------
// Items marked `girl` or `boy` only suit that look; the rest suit both.
// `forest`, `unicorn` and `fairy` items are that village's own treasures:
// its folk give them before anything else, and nobody in town does (the
// forest's also come from the villages past it; rewardChoices in
// js/game.js). Every item is drawn in js/sprites.js.

// [main, shade, light, trim]
const DRESS_COLORS = {
  pink:     { name: '분홍',   icon: '💗', c: ['#ff8fc0', '#e0609a', '#ffc8e0', '#ffd34d'] },
  lavender: { name: '보라',   icon: '💜', c: ['#b9a0ff', '#8f70e0', '#e0d4ff', '#ffd34d'] },
  sky:      { name: '하늘',   icon: '🩵', c: ['#8fd3ff', '#5aa6e0', '#d4f0ff', '#ffffff'] },
  mint:     { name: '민트',   icon: '💚', c: ['#8fe8c4', '#4fbf90', '#d4fff0', '#ffd34d'] },
  gold:     { name: '황금',   icon: '💛', c: ['#ffd66b', '#e0a83a', '#fff2b8', '#ffffff'] },
  snow:     { name: '하얀',   icon: '🤍', c: ['#ffffff', '#d4d4f0', '#ffffff', '#9fd4ff'] },
  rose:     { name: '빨간',   icon: '❤️', c: ['#ff6b7f', '#cf3f57', '#ffb4c0', '#ffd34d'] },
  peach:    { name: '복숭아', icon: '🍑', c: ['#ffb89a', '#e8866a', '#ffe0d2', '#ffffff'] },
  orange:   { name: '주황',   icon: '🧡', c: ['#ffa04a', '#e0702a', '#ffd4a8', '#ffffff'] },
  green:    { name: '초록',   icon: '🌿', c: ['#6fcf6a', '#3f9a4a', '#c4f4b8', '#ffd34d'] },
  aqua:     { name: '바다',   icon: '🌊', c: ['#4fd0d8', '#2a9cb0', '#c0f4f8', '#ffffff'] },
  navy:     { name: '남색',   icon: '💙', c: ['#4a68d0', '#2e449c', '#9ab2ff', '#ffd34d'] },
  berry:    { name: '자두',   icon: '🍇', c: ['#c860c0', '#963a94', '#f0b4ec', '#ffd34d'] },
  choco:    { name: '초코',   icon: '🍫', c: ['#a8704a', '#7a4a30', '#e0b48a', '#ffd34d'] },
  black:    { name: '까만',   icon: '🖤', c: ['#4a4560', '#2e2a40', '#7a7494', '#ffd34d'] },
  night:    { name: '밤하늘', icon: '🌌', c: ['#5a5ab8', '#3a3a86', '#9a9ae8', '#ffd34d'], forest: true },
};
// Dresses for a girl; tunics, coats, suits, armour and robes for a boy,
// in the colour above.
const DRESS_SHAPES = {
  ballgown: { name: '풍성한 드레스', icon: '👗', girl: true },
  long:     { name: '긴 드레스',     icon: '👘', girl: true },
  tutu:     { name: '발레 드레스',   icon: '🩰', girl: true },
  party:    { name: '파티 원피스',   icon: '🎀', girl: true },
  cake:     { name: '층층 드레스',   icon: '🧁', girl: true },
  mermaid:  { name: '인어 드레스',   icon: '🧜', girl: true },
  hanbok:   { name: '꽃 한복',       icon: '🎎', girl: true },
  petal:    { name: '꽃잎 드레스',   icon: '🌷', girl: true, fairy: true },
  tunic:    { name: '기사 튜닉',     icon: '👕', boy: true },
  coat:     { name: '왕자 코트',     icon: '🧥', boy: true },
  robe:     { name: '임금님 옷',     icon: '🥻', boy: true },
  suit:     { name: '멋진 정장',     icon: '🤵', boy: true },
  armour:   { name: '기사 갑옷',     icon: '🛡️', boy: true },
  sailor:   { name: '세일러복',      icon: '⚓', boy: true },
  dopo:     { name: '도령 한복',     icon: '🎎', boy: true },
  explorer: { name: '탐험가 옷',     icon: '🧭', boy: true },
  wizard:   { name: '마법사 로브',   icon: '🧙', boy: true },
  leaf:     { name: '나뭇잎 옷',     icon: '🍃', boy: true, fairy: true },
};
const HEADWEAR = {
  none:    { name: '없음',       icon: '' },
  tiara:   { name: '반짝 티아라', icon: '💎', girl: true },
  crown:   { name: '황금 왕관',   icon: '👑' },
  flowers: { name: '꽃 화관',     icon: '🌸', girl: true },
  bow:     { name: '큰 리본',     icon: '🎀', girl: true },
  heartband: { name: '하트 머리띠', icon: '💖', girl: true },
  bunny:   { name: '토끼 머리띠', icon: '🐰', girl: true },
  kitty:   { name: '고양이 머리띠', icon: '🐱', girl: true },
  butterfly: { name: '나비 핀',   icon: '🦋', girl: true },
  starpins: { name: '별 머리핀',  icon: '⭐', girl: true },
  sunhat:  { name: '밀짚모자',    icon: '👒', girl: true },
  circlet: { name: '왕자 관',     icon: '💫', boy: true },
  kingcrown: { name: '임금님 왕관', icon: '👑', boy: true },
  feather: { name: '깃털 모자',   icon: '🎩', boy: true },
  helmet:  { name: '기사 투구',   icon: '⛑️', boy: true },
  pirate:  { name: '해적 모자',   icon: '🏴‍☠️', boy: true },
  wizardhat: { name: '마법사 모자', icon: '🧙', boy: true },
  safari:  { name: '탐험가 모자', icon: '🤠', boy: true },
  cap:     { name: '야구 모자',   icon: '🧢', boy: true },
  gat:     { name: '선비 갓',     icon: '🎩', boy: true },
  horn:    { name: '유니콘 뿔',   icon: '🦄', unicorn: true },
};
const HAND_ITEMS = {
  none:    { name: '없음',     icon: '' },
  wand:    { name: '별 요술봉', icon: '🪄', girl: true },
  bouquet: { name: '꽃다발',   icon: '💐', girl: true },
  heartwand: { name: '하트 요술봉', icon: '💗', girl: true },
  moonwand: { name: '달 요술봉', icon: '🌙', girl: true },
  parasol: { name: '레이스 양산', icon: '⛱️', girl: true },
  fan:     { name: '태극 부채', icon: '🪭', girl: true },
  teddy:   { name: '곰 인형',   icon: '🧸' },
  balloon: { name: '빨간 풍선', icon: '🎈' },
  sword:   { name: '용감한 칼', icon: '🗡️', boy: true },
  sceptre: { name: '황금 홀',   icon: '🔱', boy: true },
  starsword: { name: '별빛 검', icon: '🌟', boy: true, forest: true },
  shield:  { name: '기사 방패', icon: '🛡️', boy: true },
  bow:     { name: '나무 활',   icon: '🏹', boy: true },
  staff:   { name: '마법 지팡이', icon: '🔮', boy: true },
  telescope: { name: '망원경',  icon: '🔭', boy: true },
  flag:    { name: '깃발',      icon: '🚩', boy: true },
};
// Things worn on the back.
const BACK_ITEMS = {
  none:  { name: '없음',       icon: '' },
  wings: { name: '요정 날개',   icon: '🧚', forest: true, girl: true },
  cape:  { name: '별빛 망토',   icon: '✨', forest: true },
  angel: { name: '천사 날개',   icon: '🪽', girl: true },
  butterfly: { name: '나비 날개', icon: '🦋', fairy: true, girl: true },
  redcape: { name: '기사 망토', icon: '🦸', boy: true },
  dragon: { name: '용 날개',    icon: '🐉', forest: true, boy: true },
  rainbow: { name: '무지개 망토', icon: '🌈', unicorn: true },
};
const HAIR_COLORS = {
  brown: { name: '갈색 머리', icon: '🤎', c: ['#7a4a2e', '#a8703f'] },
  black: { name: '까만 머리', icon: '🖤', c: ['#2e2433', '#5a4663'] },
  gold:  { name: '금발 머리', icon: '💛', c: ['#f0bb45', '#ffe08a'] },
  pink:  { name: '분홍 머리', icon: '🌷', c: ['#ff94c4', '#ffd0e6'] },
  red:   { name: '빨강 머리', icon: '🍎', c: ['#d0583a', '#f4905e'] },
  blue:  { name: '파랑 머리', icon: '💙', c: ['#4a72d8', '#8ab0ff'] },
  purple: { name: '보라 머리', icon: '💜', c: ['#8a5ad0', '#c4a2ff'] },
  mint:  { name: '민트 머리', icon: '🌱', c: ['#3fb498', '#9aecd4'] },
};

// Treasures are not worn: they stand on the treasure shelf, the wardrobe's
// last tab. Each one is a present like the clothes.
const TREASURES = {
  shell:    { name: '조개껍데기', icon: '🐚' },
  gem:      { name: '반짝 보석',  icon: '💎' },
  orb:      { name: '수정 구슬',  icon: '🔮' },
  yoyo:     { name: '요요',       icon: '🪀' },
  kite:     { name: '방패연',     icon: '🪁' },
  puzzle:   { name: '퍼즐',       icon: '🧩' },
  doll:     { name: '나무 인형',  icon: '🪆' },
  carousel: { name: '회전목마',   icon: '🎠' },
  piano:    { name: '꼬마 피아노', icon: '🎹' },
  violin:   { name: '바이올린',   icon: '🎻' },
  trumpet:  { name: '트럼펫',     icon: '🎺' },
  drum:     { name: '작은 북',    icon: '🥁' },
  paints:   { name: '물감',       icon: '🎨' },
  clover:   { name: '네잎클로버', icon: '🍀' },
  key:      { name: '황금 열쇠',  icon: '🗝️' },
  compass:  { name: '나침반',     icon: '🧭' },
  bell:     { name: '은방울',     icon: '🔔' },
  boat:     { name: '장난감 배',  icon: '⛵' },
  mirror:   { name: '손거울',     icon: '🪞' },
  cupcake:  { name: '컵케이크',   icon: '🧁' },
  shroom:   { name: '반짝 버섯',  icon: '🍄', forest: true },
  acorn:    { name: '도토리',     icon: '🌰', forest: true },
  marble:   { name: '무지개 구슬', icon: '🌈', unicorn: true },
  plush:    { name: '유니콘 인형', icon: '🦄', unicorn: true },
  teapot:   { name: '요정 찻주전자', icon: '🫖', fairy: true },
  tulip:    { name: '튤립 화분',  icon: '🌷', fairy: true },
};

// Unicorns to ride. These only come from the Unicorn Village.
//   body, shade, mane colours (top to bottom), horn
const UNICORNS = {
  none:     { name: '안 타요',       icon: '' },
  snow:     { name: '구름 유니콘',   icon: '🤍', unicorn: true, body: '#ffffff', shade: '#d8d4f0', mane: ['#ff9ec4', '#b9a0ff', '#8fd3ff'], horn: '#ffd34d' },
  pink:     { name: '솜사탕 유니콘', icon: '💗', unicorn: true, body: '#ffd0e6', shade: '#f0a0c8', mane: ['#ff6fa8', '#ffffff', '#ff6fa8'], horn: '#ffe08a' },
  lavender: { name: '라벤더 유니콘', icon: '💜', unicorn: true, body: '#e4d8ff', shade: '#b9a0f0', mane: ['#8f70e0', '#ff9ec4', '#8f70e0'], horn: '#ffffff' },
  sky:      { name: '하늘 유니콘',   icon: '🩵', unicorn: true, body: '#d4f0ff', shade: '#9ccce8', mane: ['#5aa6e0', '#ffffff', '#5aa6e0'], horn: '#ffd34d' },
  mint:     { name: '민트 유니콘',   icon: '💚', unicorn: true, body: '#d8fff0', shade: '#98dcc0', mane: ['#4fbf90', '#ffe066', '#4fbf90'], horn: '#ff9ec4' },
  gold:     { name: '황금 유니콘',   icon: '💛', unicorn: true, body: '#fff2b8', shade: '#e8c870', mane: ['#ff9a6b', '#ffffff', '#ff9a6b'], horn: '#ffffff' },
  rainbow:  { name: '무지개 유니콘', icon: '🌈', unicorn: true, body: '#ffffff', shade: '#dcd8f4', mane: ['#ff6b7f', '#ffb347', '#ffe066', '#5fd08a', '#6fb7ff', '#b98cff'], horn: '#ffd34d' },
  night:    { name: '달빛 유니콘',   icon: '🌙', unicorn: true, body: '#6a6ac8', shade: '#48489a', mane: ['#ffe066', '#ffffff', '#ffe066'], horn: '#ffe066' },
};

const DEFAULT_OUTFIT = { dress: 'pink', shape: 'ballgown', head: 'tiara', hand: 'none', hair: 'brown', back: 'none', ride: 'none' };
// What a boy hero starts in, and what replaces anything that only suits girls.
const DEFAULT_BOY_OUTFIT = { dress: 'sky', shape: 'tunic', head: 'circlet', hand: 'none', hair: 'brown', back: 'none', ride: 'none' };

// ---- People --------------------------------------------------------------

// Villager looks: [hair, skin, shirt, pants/skirt, hat]
const LOOKS = {
  knight:  { hair: '#6b4a2e', shirt: '#b8c4d8', pants: '#6f7f99', hat: 'helmet' },
  flower:  { hair: '#e8a040', shirt: '#ff9ec4', pants: '#ffffff', hat: 'bonnet' },
  granny:  { hair: '#e8e4ee', shirt: '#9f8fd8', pants: '#7d6fb8', hat: 'none' },
  fisher:  { hair: '#4a3628', shirt: '#7fc4e8', pants: '#5a6f8f', hat: 'cap' },
  baker:   { hair: '#8a5a3a', shirt: '#ffffff', pants: '#e8b07a', hat: 'chef' },
  kid:     { hair: '#2e2433', shirt: '#ffd34d', pants: '#5aa6e0', hat: 'none' },
  bard:    { hair: '#c04a4a', shirt: '#5cc98a', pants: '#8a5a3a', hat: 'feather' },
  farmer:  { hair: '#a8703f', shirt: '#ff8f5a', pants: '#6f8f4a', hat: 'straw' },
  king:    { hair: '#8a5a3a', shirt: '#d84a6a', pants: '#7a3a8a', hat: 'crown' },
  queen:   { hair: '#f0bb45', shirt: '#b98cff', pants: '#b98cff', hat: 'crown', gown: true },
  maid:    { hair: '#4a3628', shirt: '#4a4a6a', pants: '#ffffff', hat: 'bonnet' },
  fairy:   { hair: '#ffb0e0', shirt: '#b8f0ff', pants: '#e0c8ff', hat: 'flowerband', gown: true },
  elf:     { hair: '#f0d070', shirt: '#4fb36a', pants: '#3a7a4a', hat: 'leaf' },
  wizard:  { hair: '#e8e4ee', shirt: '#6a4ab8', pants: '#4a3a8a', hat: 'wizard' },
  gnome:   { hair: '#e8e4ee', shirt: '#ff8f5a', pants: '#5a6f8f', hat: 'mushroom' },
  ranger:  { hair: '#4a3628', shirt: '#8a6a3a', pants: '#4a5a3a', hat: 'leaf' },
};

// Outdoor villagers ask about any word.
const TOWN_NPCS = [
  { name: '성문 기사님', look: 'knight', c: 18, r: 11 },
  { name: '꽃집 언니',   look: 'flower', c: 5,  r: 17 },
  { name: '할머니',     look: 'granny', c: 16, r: 18 },
  { name: '낚시 아저씨', look: 'fisher', c: 27, r: 28 },
  { name: '빵집 아저씨', look: 'baker',  c: 12, r: 16 },
  { name: '꼬마 친구',   look: 'kid',    c: 34, r: 19 },
  { name: '음악가',     look: 'bard',   c: 26, r: 20 },
  { name: '농부 아저씨', look: 'farmer', c: 9,  r: 31 },
];

// One house per letter. Each house has a resident who asks words for
// its letter. c, r is the house's back corner; houses are 3 x 3 tiles.
// Houses just right of the main road would hide the castle gate, so the
// first row leaves a gap there.
const TOWN_HOUSES = [
  { letter: 'A', c: 3,  r: 11, who: '사과 아줌마',   look: 'farmer' },
  { letter: 'B', c: 9,  r: 11, who: '곰돌이 아저씨', look: 'baker' },
  { letter: 'C', c: 13, r: 11, who: '고양이 언니',   look: 'flower' },
  { letter: 'D', c: 25, r: 11, who: '강아지 오빠',   look: 'kid' },
  { letter: 'F', c: 29, r: 11, who: '개구리 아저씨', look: 'fisher' },
  { letter: 'G', c: 34, r: 11, who: '선물 할머니',   look: 'granny' },
  { letter: 'H', c: 3,  r: 23, who: '모자 아저씨',   look: 'bard' },
  { letter: 'M', c: 9,  r: 23, who: '달님 언니',     look: 'maid' },
  { letter: 'N', c: 13, r: 23, who: '도토리 친구',   look: 'kid' },
  { letter: 'P', c: 22, r: 23, who: '피자 요리사',   look: 'baker' },
  { letter: 'S', c: 26, r: 23, who: '별님 언니',     look: 'flower' },
  { letter: 'T', c: 33, r: 23, who: '호랑이 기사님', look: 'knight' },
];

// ---- Voices and lines ------------------------------------------------------

// How each kind of villager sounds. `voice` lists preferred system voices
// (the first one installed wins); otherwise a voice of the right `gender` is
// picked for each person. Pitch and rate keep people distinct even when the
// device has only one English voice.
// `tts` names the voice of the pre-recorded lines in audio/tts (Amazon Polly;
// tools/polly-build.py maps these names to Polly voices). `lift` plays this
// person's chit-chat a little faster and higher (above 1) or slower and
// deeper (below 1), so people who share a recorded voice sound apart;
// questions, quiz words and letter sounds are never lifted. The rest
// describes the device voice used as a fallback.
const TTS_NARRATOR = 'af_heart';
// Optional live speech server (server/ in this repo, e.g. on Railway) for
// lines that were not pre-recorded, such as a custom name. Leave empty to
// use the device voice for those.
const TTS_SERVER = 'https://phonics-production-5a6d.up.railway.app';
const VOICES = {
  knight: { gender: 'male', tts: 'am_michael',   pitch: 0.75, rate: 0.92, voice: ['Daniel', 'Google UK English Male', 'Microsoft Ryan', 'Arthur'] },
  flower: { gender: 'female', tts: 'af_bella', pitch: 1.35, rate: 1.0,  voice: ['Samantha', 'Microsoft Aria', 'Google US English'] },
  granny: { gender: 'female', tts: 'bf_isabella', pitch: 1.05, rate: 0.8,  voice: ['Moira', 'Martha', 'Microsoft Hazel', 'Google UK English Female'] },
  fisher: { gender: 'male', tts: 'am_eric',   pitch: 0.85, rate: 0.95, voice: ['Fred', 'Rishi', 'Microsoft Guy', 'Aaron'] },
  baker:  { gender: 'male', tts: 'am_adam',   pitch: 1.0,  rate: 1.0,  voice: ['Alex', 'Tom', 'Microsoft Andrew', 'Google US English'] },
  kid:    { gender: 'female', tts: 'af_sky', lift: 1.12, pitch: 1.65, rate: 1.08, voice: ['Junior', 'Zoe', 'Microsoft Ana'] },
  bard:   { gender: 'male', tts: 'bm_fable',   pitch: 1.2,  rate: 1.05, voice: ['Oliver', 'Gordon', 'Microsoft Brian'] },
  farmer: { gender: 'male', tts: 'am_liam',   pitch: 0.9,  rate: 0.9,  voice: ['Aaron', 'Fred', 'Microsoft Christopher'] },
  king:   { gender: 'male', tts: 'bm_george', lift: 0.93, pitch: 0.65, rate: 0.85, voice: ['Arthur', 'Daniel', 'Google UK English Male', 'Microsoft George'] },
  queen:  { gender: 'female', tts: 'bf_alice', pitch: 1.1,  rate: 0.88, voice: ['Serena', 'Kate', 'Google UK English Female', 'Microsoft Sonia'] },
  maid:   { gender: 'female', tts: 'bf_lily', pitch: 1.25, rate: 0.98, voice: ['Karen', 'Tessa', 'Microsoft Libby', 'Microsoft Jenny'] },
};

// Things people say. {title} {name} is the hero ("Princess Yuna"), {little} the title in lower case.
const LINES = {
  ask: [
    'Listen carefully.', 'Here is my word.', 'Can you find this one?', 'Which word am I saying?',
    'Ready? Listen!', 'Ears open, here it comes.', 'Find the word I say.',
  ],
  praise: [
    'Wonderful!', 'You got it!', 'Brilliant, {title}!', 'That is exactly right!',
    'Wow, great listening!', 'Perfect!', 'Hooray, well done!', 'You are so clever!',
  ],
  // After a wrong answer (choose in js/game.js). Lines never put "a" or
  // "the" before the quiz word that follows them.
  // First miss: what she picked, then one of these and the word again.
  listen: ['Listen.', 'Listen again.', 'Listen one more time.'],
  // Second miss: the right card glows and the answer is said.
  showMe: ['Here it is!', 'Look, this one!', 'This is the one!'],
  tapIt: ['Your turn! Tap it.', 'Can you tap it?', 'Now you tap it!'],
  // Once she has tapped it. It comes back later.
  soon: ["Good try! Let's practise it again later.", "Good try! I'll ask you again soon.", 'Well done for trying! We will play it again later.'],
  // Asking a question she missed again.
  again: ["Let's try this one again!", 'Here is that one again!', 'Remember this one? Try again!'],
  // Before a question, after the first chat with someone that day.
  next: ['Here is another one!', 'Ready for one more?', 'Okay, listen!', 'One more for you!'],
  gift: [
    'I have a little present for you. Would you like to try it on?', 'This is for you, {title}! Do you want to wear it?',
    'Ta-da! A present! Shall we try it?', 'You earned a gift! Would you like to put it on?',
  ],
  yes: ['You look lovely!', 'So pretty!', 'That suits you perfectly!', 'Beautiful, {title}!', 'Wow, look at you!'],
  keep: ["Okay! I'll put it in your wardrobe.", 'Into the wardrobe it goes!', 'Lovely! You can try it on in your room later.'],
  // A treasure for her shelf (giftLine in game.js says the present line
  // until this one is recorded in the giver's voice).
  treasure: ['A little treasure for you!', 'Look! A shiny treasure for you!', 'Here is a treasure for your shelf!'],
  // Once it is on the shelf (acceptReward in game.js; nothing is said until
  // it is recorded in the giver's voice).
  shelf: ['Onto your treasure shelf it goes!', 'It looks so pretty on your shelf!'],
  room:['Here is your room, {title}!', 'Welcome to your own room!', 'Your wardrobe is waiting for you!'],
  dressup: ["Let's dress up!", 'What shall we wear today?', 'Pick your favourite!'],
  castle: ['Welcome home, {title}!', 'Back to the castle!', 'Home sweet home!'],
  house: ['Knock, knock! The {letter} house!', 'Here is the {letter} house!', "Let's visit the {letter} house!"],
  start: [`Good morning, {title} {name}! Let's visit the town!`, 'What a sunny day, {title} {name}! Shall we go and say hello to everyone?'],
};

// Greetings in each person's own style.
const PERSONA = {
  knight: ['Good day, {title} {name}! I am guarding the castle gate.', 'Halt! Oh, it is you, {title} {name}. Fancy a word game?', 'At your service, {title} {name}!'],
  flower: ['Hi, {title} {name}! Smell these roses. They smell so sweet!', 'Hello! I just picked fresh flowers this morning.', 'Oh, {title} {name}! You look like a flower today.'],
  granny: ['Oh, my dear {title} {name}! How you have grown!', 'Come here, sweetie. Grandma has a word for you.', 'Hello, darling. Would you like a cookie later?'],
  fisher: ['Ahoy, {title} {name}! The fish are jumping today.', "Quiet, the fish might hear us! Let's play quietly.", 'Hello there! I caught a big one this morning.'],
  baker:  ['Good morning, {title} {name}! My bread just came out of the oven.', 'Hello! Something smells yummy in here, right?', 'Welcome, welcome! Fresh cakes for everyone!'],
  kid:    ['Hey, {title} {name}! Wanna play a game with me?', 'Yay, you came! I have a super fun word for you.', 'Hi hi hi! Guess what? I have a word!'],
  bard:   ['La la la! Hello, {title} {name}! Let me sing you a word.', 'Greetings, {title}! Listen to my song.', 'Ding ding! A musical word, coming right up!'],
  farmer: ['Howdy, {title} {name}! My carrots are growing so big.', 'Hello there! The cows say hi too. Moo!', 'Morning, {title}! Busy day on the farm.'],
  king:   ['There you are, my little {little}! Shall we play a word game?', 'My dear {name}, I have a royal word for you.', 'Ho ho! The king has a puzzle for you.'],
  queen:  ['Hello, my sweet {name}. Did you have fun in town today?', 'My darling {little}, let me hear how well you listen.', 'You look wonderful today, {name}.'],
  maid:   ['Good afternoon, {title} {name}. Shall I give you a word?', 'Hello, {title}! I have tidied your room. Now, a word game?', 'Hello, {title}! Would you like some tea after this?'],
};

// ---- Castle upstairs -----------------------------------------------------

// The second floor of the castle: the royal library, a balcony and the
// treasure corner. Its people ask town questions (level 1).
LOOKS.librarian = { hair: '#e8e4ee', shirt: '#4a6ab8', pants: '#2e3a6a', hat: 'none' };
LOOKS.harpist = { hair: '#ffcf6a', shirt: '#ffb0d0', pants: '#ffe0ee', hat: 'flowerband', gown: true };
const CASTLE_UP_NPCS = [
  { name: '왕실 사서',       look: 'librarian', c: 2, r: 4 },
  { name: '궁정 하프 연주가', look: 'harpist',   c: 6, r: 2 },
];
Object.assign(VOICES, {
  librarian: { gender: 'male', tts: 'bm_lewis', pitch: 0.8, rate: 0.88, voice: ['Daniel', 'Arthur', 'Google UK English Male', 'Microsoft Ryan'] },
  harpist:   { gender: 'female', tts: 'af_river', pitch: 1.3, rate: 0.95, voice: ['Samantha', 'Kate', 'Microsoft Aria', 'Google US English'] },
});
Object.assign(PERSONA, {
  librarian: ['Welcome to the royal library, {title} {name}!', 'Every book in here is full of words. Shall we find one?', 'Ah, {title} {name}! I was just reading about dragons.'],
  harpist:   ['Hello, {title} {name}! Listen to my harp. Pling, pling!', 'Welcome, {title}! Music and words go together.', 'What a lovely day for a song on the balcony!'],
});
LINES.upstairs = ['Up, up, up the stairs!', 'Up we go to the second floor!', 'Look, the royal library is up here!'];

// ---- Starlight Forest ----------------------------------------------------

// Stars needed before the forest gate at the south end of town opens.
const FOREST_STARS = 10;

// Forest questions use four words that all start with the same letter, so
// she has to listen to the middle and the end of the word.
const WORD_FAMILIES = [
  [['cat', '🐱'], ['cap', '🧢'], ['can', '🥫'], ['cup', '🥤'], ['cow', '🐮']],
  [['bat', '🦇'], ['bag', '👜'], ['bed', '🛏️'], ['bus', '🚌'], ['bug', '🐛'], ['box', '📦']],
  [['dog', '🐶'], ['duck', '🦆'], ['drum', '🥁'], ['door', '🚪']],
  [['hat', '🎩'], ['hen', '🐔'], ['hug', '🤗'], ['horse', '🐴']],
  [['map', '🗺️'], ['man', '👨'], ['mug', '☕'], ['moon', '🌙']],
  [['pig', '🐷'], ['pan', '🍳'], ['pen', '🖊️'], ['pin', '📌']],
  [['sun', '☀️'], ['sad', '😢'], ['six', '6️⃣'], ['sock', '🧦']],
  [['ten', '🔟'], ['tub', '🛁'], ['tap', '🚰'], ['tent', '⛺']],
  [['rat', '🐀'], ['red', '🔴'], ['run', '🏃'], ['ring', '💍']],
  [['leg', '🦵'], ['lip', '👄'], ['lock', '🔒'], ['lion', '🦁']],
  [['net', '🥅'], ['nut', '🥜'], ['nap', '😴'], ['nose', '👃'], ['nine', '9️⃣']],
  [['fox', '🦊'], ['fish', '🐟'], ['fork', '🍴'], ['foot', '🦶']],
  [['web', '🕸️'], ['wolf', '🐺'], ['watch', '⌚'], ['whale', '🐳']],
  [['bin', '🗑️'], ['bell', '🔔'], ['bone', '🦴'], ['boot', '👢'], ['bee', '🐝']],
  [['cake', '🎂'], ['corn', '🌽'], ['cookie', '🍪'], ['car', '🚗']],
  [['ram', '🐏'], ['rice', '🍚'], ['rose', '🌹'], ['rain', '🌧️'], ['robot', '🤖']],
  [['mom', '👩'], ['mad', '😠'], ['milk', '🥛'], ['mouse', '🐭'], ['mask', '😷'], ['mail', '📬']],
  [['yum', '😋'], ['yarn', '🧶'], ['yawn', '🥱']],
  [['van', '🚐'], ['vest', '🦺'], ['violin', '🎻'], ['volcano', '🌋'], ['vampire', '🧛']],
  [['kid', '🧒'], ['king', '🤴'], ['kite', '🪁'], ['key', '🔑'], ['kiss', '💋'], ['koala', '🐨']],
  [['gas', '⛽'], ['gift', '🎁'], ['goat', '🐐'], ['girl', '👧'], ['ghost', '👻'], ['guitar', '🎸']],
  [['fire', '🔥'], ['flag', '🚩'], ['fairy', '🧚'], ['frog', '🐸']],
];

// Pictures a child may call something else (jet ✈️ is an airplane, mug ☕
// a cup): fine next to a written or spoken word, but never the only clue,
// so questions that show just the picture (read, findStart) leave them out.
const WEAK_PICTURES = new Set(['mom', 'man', 'kid', 'pin', 'rat', 'tub', 'tap', 'mug', 'cup', 'jet', 'net', 'lip', 'pan', 'gas',
  'run', 'nap', 'sad', 'mad', 'yum', 'yawn', 'kiss', 'hug', 'sing', 'dish', 'bin', 'mail', 'shop', 'lake', 'ram', 'red']);

const FOREST_NPCS = [
  { name: '꽃요정',     look: 'fairy',  c: 12, r: 6 },
  { name: '숲 엘프',     look: 'elf',    c: 20, r: 9 },
  { name: '별빛 마법사', look: 'wizard', c: 14, r: 15 },
  { name: '버섯 할아버지', look: 'gnome', c: 5, r: 14 },
  { name: '숲지기',     look: 'ranger', c: 22, r: 19 },
  { name: '작은 요정',   look: 'fairy',  c: 8,  r: 22 },
];

Object.assign(VOICES, {
  fairy:  { gender: 'female', tts: 'af_nova', pitch: 1.75, rate: 1.05, voice: ['Zoe', 'Allison', 'Microsoft Ana'] },
  elf:    { gender: 'male', tts: 'am_puck', lift: 1.1, pitch: 1.3,  rate: 1.02, voice: ['Oliver', 'Tom', 'Microsoft Brian'] },
  wizard: { gender: 'male', tts: 'bm_lewis',   pitch: 0.6,  rate: 0.8,  voice: ['Gordon', 'Arthur', 'Daniel', 'Microsoft George'] },
  gnome:  { gender: 'male', tts: 'am_santa',   pitch: 1.1,  rate: 0.85, voice: ['Ralph', 'Fred', 'Aaron'] },
  ranger: { gender: 'female', tts: 'af_river', pitch: 0.95, rate: 0.95, voice: ['Fiona', 'Tessa', 'Karen', 'Microsoft Hazel'] },
});

Object.assign(PERSONA, {
  fairy:  ['Twinkle twinkle! Hello, {title} {name}!', 'Hee hee! I was dancing on a flower. Want to play?', 'Sprinkle, sprinkle! A magic word for you!'],
  elf:    ['Welcome to the Starlight Forest, {title} {name}!', 'Hush, the trees are listening. Are you ready?', 'Ah, a visitor! Elves love word puzzles.'],
  wizard: ['Hmm, hmm. A new visitor. Let us test those clever ears.', 'Abracadabra! These words all look alike. Listen very closely.', 'Welcome, {title} {name}. My puzzles are a little tricky.'],
  gnome:  ['Oh ho! A visitor! Mind the mushrooms, {title} {name}.', 'Hello, little one. I have lived here a hundred years!', 'Psst! Want to hear a secret word?'],
  ranger: ['Hello, {title} {name}! I look after the forest animals.', 'Did you see the fireflies? Aren\'t they beautiful?', 'Good evening, {title}. Let\'s see how well you listen.'],
});

LINES.ask2 = [
  'They all start the same. Listen to the whole word!', 'Listen to the middle sound.', 'Listen carefully to the end of the word.',
  'Tricky one! Which word is it?', 'Use your super ears!',
];
LINES.forest = ['Welcome to the Starlight Forest!', 'Wow, the forest is sparkling!', 'Look at all the fireflies!'];
LINES.locked = ['Collect {stars} stars to open this gate!', 'This gate opens with {stars} stars. Keep going!'];

// ---- Progress she can see (js/album.js) -------------------------------------

// The narrator, when a gate's stars are reached.
LINES.openForest = isCaptain() ? ['Dinosaur Village is open!'] : ['The Starlight Forest is open!'];
LINES.openFairy = isCaptain() ? ['Drone Village is open!'] : ['The Fairy Village is open!'];
LINES.openUnicorn = isCaptain() ? ['Car Village is open!'] : ['The Unicorn Village is open!'];
LINES.openDungeon = isCaptain() ? ['The Villain Cave is open!'] : ['The Crystal Cave is open!'];
// The asker, instead of the praise, at 3 and 5 answers right the first time
// in a row (then every 5). The quiz word follows, so no "a" or "the" at the
// end. Nothing is said when a row ends.
LINES.combo = ['Three in a row!', 'Three in a row! Hooray!'];
LINES.combo5 = ['Five in a row! Super star!', 'Five in a row! Amazing!'];
LINES.comboMore = ['You are on a roll!', 'Wow, super listening!'];
// The narrator: a letter house's medal, a village's medal, the sticker album
// (the word chip book in the robot edition).
LINES.medalHouse = ['You know all the {letter} words!'];
LINES.medalVillage = ['You got a medal! Hooray!', 'A shiny medal for you!'];
LINES.album = isCaptain() ? ['Your word chip book!', "Let's look at your word chips!"] : ['Your sticker book!', "Let's look at your stickers!"];

// ---- Question variety ------------------------------------------------------

// Which kinds of questions each kind of person asks. A person never asks
// the same kind twice in a row.
//   word       hear a word, pick it from written words
//   start      hear a word (with its picture), pick the letter it starts with
//   findStart  hear a letter's name, pick the picture that starts with it
//   rhyme      pick the picture that rhymes with a word
//   family     hear a word, pick it from four that share the first letter
//   vowel      fill in the missing middle letter: c ? t
//   ending     fill in the missing last letter: ca ?
//   read       read a written word, pick its picture
//   blend      hear a word's sounds ("/s/ /u/ /n/"), pick its picture; it
//              starts with one sound, then two (ONE_SOUND, TWO_SOUNDS)
//   spell      hear a word, tap its letters (Fairy Village)
const QUIZ_TYPES = {
  town: ['word', 'start', 'rhyme'],
  house: ['word', 'findStart', 'rhyme'],
  forest: ['family', 'vowel', 'ending', 'read', 'rhyme', 'blend'],
};

// How many recent answers of a kind to keep out of new questions (at most
// half of the questions the kind can ask at her tier).
const RECENT_WORDS = 24;

// Rhymes, by their vowel sound (v): easy questions take the other cards
// from sets with another vowel, the hardest add one with the same vowel.
const RHYME_SETS = [
  { v: 'æ', rime: 'at', set: [['cat', '🐱'], ['hat', '🎩'], ['bat', '🦇'], ['rat', '🐀']] },
  { v: 'æ', rime: 'an', set: [['can', '🥫'], ['man', '👨'], ['van', '🚐'], ['pan', '🍳']] },
  { v: 'æ', rime: 'ap', set: [['cap', '🧢'], ['map', '🗺️'], ['tap', '🚰'], ['nap', '😴']] },
  { v: 'æ', rime: 'ag', set: [['bag', '👜'], ['flag', '🚩']] },
  { v: 'æ', rime: 'ant', set: [['ant', '🐜'], ['plant', '🌱']] },
  { v: 'ɛ', rime: 'ed', set: [['bed', '🛏️'], ['red', '🔴'], ['sled', '🛷']] },
  { v: 'ɛ', rime: 'en', set: [['hen', '🐔'], ['ten', '🔟'], ['pen', '🖊️']] },
  { v: 'ɛ', rime: 'et', set: [['net', '🥅'], ['jet', '✈️']] },
  { v: 'ɛ', rime: 'ell', set: [['bell', '🔔'], ['shell', '🐚']] },
  { v: 'ɪ', rime: 'ing', set: [['ring', '💍'], ['king', '🤴'], ['sing', '🎤']] },
  { v: 'ɪ', rime: 'ip', set: [['ship', '🚢'], ['lip', '👄']] },
  { v: 'ɪ', rime: 'in', set: [['pin', '📌'], ['bin', '🗑️']] },
  { v: 'ɪ', rime: 'ick', set: [['chick', '🐤'], ['brick', '🧱'], ['sick', '🤒']] },
  { v: 'ɑ', rime: 'og', set: [['dog', '🐶'], ['frog', '🐸']] },
  { v: 'ɑ', rime: 'ox', set: [['fox', '🦊'], ['box', '📦']] },
  { v: 'ɑ', rime: 'ock', set: [['clock', '⏰'], ['lock', '🔒']] },
  { v: 'ɑ', rime: 'op', set: [['stop', '🛑'], ['shop', '🏪']] },
  { v: 'ʌ', rime: 'un', set: [['sun', '☀️'], ['run', '🏃'], ['one', '1️⃣']] },
  { v: 'ʌ', rime: 'ug', set: [['bug', '🐛'], ['mug', '☕'], ['hug', '🤗'], ['plug', '🔌']] },
  { v: 'ʌ', rime: 'uck', set: [['duck', '🦆'], ['truck', '🚚']] },
  { v: 'ʌ', rime: 'um', set: [['drum', '🥁'], ['thumb', '👍']] },
  { v: 'eɪ', rime: 'ake', set: [['cake', '🎂'], ['snake', '🐍'], ['lake', '🏞️']] },
  { v: 'eɪ', rime: 'ain', set: [['train', '🚂'], ['rain', '🌧️'], ['chain', '⛓️']] },
  { v: 'eɪ', rime: 'ate', set: [['eight', '8️⃣'], ['plate', '🍽️'], ['skate', '⛸️']] },
  { v: 'i', rime: 'ee', set: [['bee', '🐝'], ['tree', '🌳'], ['three', '3️⃣'], ['key', '🔑']] },
  { v: 'aɪ', rime: 'ite', set: [['kite', '🪁'], ['light', '💡'], ['night', '🌃']] },
  { v: 'aɪ', rime: 'ice', set: [['rice', '🍚'], ['dice', '🎲'], ['ice', '🧊']] },
  { v: 'aɪ', rime: 'ie', set: [['pie', '🥧'], ['tie', '👔'], ['butterfly', '🦋']] },
  { v: 'oʊ', rime: 'oat', set: [['goat', '🐐'], ['boat', '⛵'], ['coat', '🧥']] },
  { v: 'oʊ', rime: 'ose', set: [['nose', '👃'], ['rose', '🌹']] },
  { v: 'oʊ', rime: 'one', set: [['bone', '🦴'], ['phone', '📱'], ['cone', '🍦']] },
  { v: 'oʊ', rime: 'ow', set: [['snow', '❄️'], ['rainbow', '🌈']] },
  { v: 'u', rime: 'oon', set: [['moon', '🌙'], ['spoon', '🥄'], ['balloon', '🎈'], ['raccoon', '🦝']] },
  { v: 'u', rime: 'oo', set: [['shoe', '👟'], ['two', '2️⃣'], ['kangaroo', '🦘']] },
  { v: 'ʊ', rime: 'ook', set: [['book', '📖'], ['cook', '👨‍🍳']] },
  { v: 'aʊ', rime: 'ouse', set: [['mouse', '🐭'], ['house', '🏠']] },
  { v: 'aʊ', rime: 'own', set: [['crown', '👑'], ['clown', '🤡']] },
  { v: 'ɛr', rime: 'air', set: [['bear', '🐻'], ['pear', '🍐'], ['chair', '🪑']] },
  { v: 'ɪr', rime: 'ear', set: [['ear', '👂'], ['deer', '🦌']] },
  { v: 'ɑr', rime: 'ar', set: [['star', '⭐'], ['car', '🚗'], ['guitar', '🎸']] },
  { v: 'ɔr', rime: 'oor', set: [['four', '4️⃣'], ['door', '🚪'], ['dinosaur', '🦕']] },
];

// Short sounds for single letters inside a word, spelled the way lines
// like "M says mmm." say them. A spoken "/m/" is the pure sound itself
// (see js/audio.js); c, h and r use their LETTERS sounds. A doubled letter
// (the ll of bell, the gg of egg) says the single letter's sound.
const PART_SOUNDS = {
  a: 'ah', e: 'eh', i: 'ih', o: 'aw', u: 'uh',
  b: 'buh', d: 'duh', g: 'guh', m: 'mmm', n: 'nnn', p: 'puh', t: 'tuh', x: 'ks', k: 'kuh', l: 'lll', s: 'sss', f: 'fff',
  v: 'vvv', w: 'wuh', z: 'zzz', j: 'juh', y: 'yuh',
  // Letter pairs that say one sound, on one spelling tile.
  sh: 'shh', ch: 'chuh', th: 'thh', ck: 'kuh', ng: 'ng',
};

// Sounds a Korean five-year-old hears as the same: Korean has one sound
// for e and ae, no f, v, z or th (it sounds like s or t), and one for l
// and r. A question never puts two letters (or two words that differ only
// in them) from one pair side by side. `same` are letters that can say the
// same sound (c and k), and `looks` letters that look alike.
const HARD_PAIRS = {
  vowels: [['a', 'e'], ['e', 'i'], ['a', 'u'], ['o', 'u']],
  consonants: [['f', 'p'], ['b', 'v'], ['l', 'r'], ['b', 'p'], ['d', 't'], ['g', 'k'], ['m', 'n'], ['s', 'z'], ['j', 'z'], ['t', 'th'], ['s', 'th']],
  same: [['c', 'k'], ['c', 's'], ['g', 'j'], ['x', 'z']],
  looks: [['b', 'd'], ['p', 'q'], ['b', 'p'], ['n', 'u'], ['m', 'w']],
};

LINES.firstSound = ['Which letter does it start with?', 'What is the first letter?', 'Which letter comes first?'];
// A wrong rhyme: listen to the end of the word.
LINES.rhymeEnd = ['Listen to the end.', 'Listen to the end of the word.'];
LINES.findStart = ['Which one starts with', 'Which picture starts with', 'What begins with'];
LINES.rhyme = ['Which one rhymes with', 'Find a word that sounds like', 'What rhymes with'];
LINES.vowel = ['Which letter goes in the middle?', 'What letter is missing in the middle?', 'Can you find the middle letter?'];
LINES.ending = ['Which letter goes at the end?', 'What letter is missing at the end?', 'Can you find the last letter?'];
LINES.read = ['Can you read this word?', 'Read the word, then find the picture!', 'Read it all by yourself!'];
LINES.blend = ['Listen to the sounds. Which picture is it?', 'Put the sounds together!', 'What do these sounds make?'];
// Said by the narrator when a kind of question goes up a tier.
LINES.levelUp = ['Level up!', 'Wow, level up!'];

// ---- Unicorn Village (level 3) ----------------------------------------------

// The Unicorn Village lies past the Starlight Forest and opens with more stars.
const UNICORN_STARS = 25;

// Sentence questions. {} is the blank. `alike` are words that sound close to
// the answer (she has to listen to the sentence); `other` are pictures that
// don't make sense in the sentence (she has to think about the meaning).
const SENTENCES = [
  { s: 'The {} is hot and bright.',       w: ['sun', '☀️'],     alike: ['run', 'bun'],      other: [['fish', '🐟'], ['sock', '🧦']] },
  { s: 'I sleep in my {}.',               w: ['bed', '🛏️'],     alike: ['red', 'bad'],      other: [['cake', '🎂'], ['frog', '🐸']] },
  { s: 'The {} says moo.',                w: ['cow', '🐄'],     alike: ['cat', 'cup'],      other: [['duck', '🦆'], ['pig', '🐷']] },
  { s: 'The {} can swim in the pond.',    w: ['fish', '🐟'],    alike: ['dish', 'fig'],     other: [['car', '🚗'], ['bed', '🛏️']] },
  { s: 'I wear my {} on my head.',        w: ['hat', '🎩'],     alike: ['hot', 'cat'],      other: [['shoe', '👟'], ['cake', '🎂']] },
  { s: 'The {} says woof woof.',          w: ['dog', '🐶'],     alike: ['dot', 'log'],      other: [['cat', '🐱'], ['bee', '🐝']] },
  { s: 'I drink {} in the morning.',      w: ['milk', '🥛'],    alike: ['mix', 'silk'],     other: [['car', '🚗'], ['sock', '🧦']] },
  { s: 'The {} sings in the tree.',       w: ['bird', '🐦'],    alike: ['bed', 'bun'],      other: [['fish', '🐟'], ['car', '🚗']] },
  { s: 'I eat a red {}.',                 w: ['apple', '🍎'],   alike: ['ant', 'ax'],       other: [['chair', '🪑'], ['shoe', '👟']] },
  { s: 'The {} hops and says ribbit.',    w: ['frog', '🐸'],    alike: ['fog', 'fox'],      other: [['cow', '🐄'], ['fish', '🐟']] },
  { s: 'Please open the {}.',             w: ['door', '🚪'],    alike: ['dog', 'duck'],     other: [['sun', '☀️'], ['moon', '🌙']] },
  { s: 'My birthday {} is sweet.',        w: ['cake', '🎂'],    alike: ['cape', 'lake'],    other: [['shoe', '👟'], ['frog', '🐸']] },
  { s: 'I ride the {} to school.',        w: ['bus', '🚌'],     alike: ['bun', 'bug'],      other: [['bed', '🛏️'], ['apple', '🍎']] },
  { s: 'A unicorn has a shiny {}.',       w: ['horn', '🦄'],    alike: ['corn', 'horse'],   other: [['bus', '🚌'], ['fish', '🐟']] },
  { s: 'I brush my {} at night.',         w: ['teeth', '🦷'],   alike: ['tea', 'tent'],     other: [['car', '🚗'], ['tree', '🌳']] },
  { s: 'I hug my teddy {}.',              w: ['bear', '🧸'],    alike: ['pear', 'bed'],     other: [['bus', '🚌'], ['spoon', '🥄']] },
  { s: 'I put on my {} and my shoes.',    w: ['socks', '🧦'],   alike: ['box', 'rocks'],    other: [['cake', '🎂'], ['moon', '🌙']] },
  { s: 'The {} shines at night.',         w: ['moon', '🌙'],    alike: ['spoon', 'man'],    other: [['pig', '🐷'], ['shoe', '👟']] },
  { s: 'The {} is big and green.',        w: ['tree', '🌳'],    alike: ['three', 'tea'],    other: [['milk', '🥛'], ['sun', '☀️']] },
  { s: 'I see the {} after the rain.',    w: ['rainbow', '🌈'], alike: ['rabbit', 'robot'], other: [['sock', '🧦'], ['bed', '🛏️']] },
  // Animals
  { s: 'The {} says meow.',               w: ['cat', '🐱'],     alike: ['hat', 'cap'],      other: [['cake', '🎂'], ['bus', '🚌']] },
  { s: 'The {} says oink oink.',          w: ['pig', '🐷'],     alike: ['big', 'dig'],      other: [['hat', '🎩'], ['door', '🚪']] },
  { s: 'The {} says quack.',              w: ['duck', '🦆'],    alike: ['truck', 'luck'],   other: [['moon', '🌙'], ['shoe', '👟']] },
  { s: 'The {} buzzes by the flower.',    w: ['bee', '🐝'],     alike: ['key', 'bean'],     other: [['car', '🚗'], ['bed', '🛏️']] },
  { s: 'The {} has a long trunk.',        w: ['elephant', '🐘'], alike: ['elf', 'egg'],     other: [['cup', '🥤'], ['sock', '🧦']] },
  { s: 'The {} eats a carrot.',           w: ['rabbit', '🐰'],  alike: ['ribbon', 'robot'], other: [['chair', '🪑'], ['moon', '🌙']] },
  { s: 'The {} gives a big roar.',        w: ['lion', '🦁'],    alike: ['line', 'lemon'],   other: [['spoon', '🥄'], ['cup', '🥤']] },
  { s: 'The {} lays an egg.',             w: ['hen', '🐔'],     alike: ['ten', 'pen'],      other: [['car', '🚗'], ['shoe', '👟']] },
  { s: 'The little {} likes cheese.',     w: ['mouse', '🐭'],   alike: ['house', 'mouth'],  other: [['tree', '🌳'], ['bus', '🚌']] },
  { s: 'The big {} swims in the sea.',    w: ['whale', '🐳'],   alike: ['snail', 'wheel'],  other: [['cake', '🎂'], ['chair', '🪑']] },
  { s: 'The {} has a very long neck.',    w: ['giraffe', '🦒'], alike: ['giant', 'jelly'],  other: [['egg', '🥚'], ['bed', '🛏️']] },
  { s: 'The {} has black and white stripes.', w: ['zebra', '🦓'], alike: ['zero', 'zipper'], other: [['cup', '🥤'], ['apple', '🍎']] },
  { s: 'The {} has a shell on its back.', w: ['turtle', '🐢'],  alike: ['purple', 'turkey'], other: [['cake', '🎂'], ['hat', '🎩']] },
  // Food
  { s: 'I peel a yellow {}.',             w: ['banana', '🍌'],  alike: ['bandage', 'basket'], other: [['shoe', '👟'], ['car', '🚗']] },
  { s: 'I lick my ice cream {}.',         w: ['cone', '🍦'],    alike: ['bone', 'comb'],    other: [['dog', '🐶'], ['bed', '🛏️']] },
  { s: 'I put jam on my {}.',             w: ['bread', '🍞'],   alike: ['red', 'break'],    other: [['frog', '🐸'], ['moon', '🌙']] },
  { s: 'Mom makes hot {} in a pot.',      w: ['soup', '🍲'],    alike: ['soap', 'hoop'],    other: [['sock', '🧦'], ['car', '🚗']] },
  { s: 'I eat {} with lots of cheese.',   w: ['pizza', '🍕'],   alike: ['pillow', 'piano'], other: [['car', '🚗'], ['shoe', '👟']] },
  { s: 'The {} is orange and crunchy.',   w: ['carrot', '🥕'],  alike: ['parrot', 'carpet'], other: [['bed', '🛏️'], ['door', '🚪']] },
  { s: 'I crack an {} for breakfast.',    w: ['egg', '🥚'],     alike: ['leg', 'peg'],      other: [['car', '🚗'], ['tree', '🌳']] },
  // Body
  { s: 'I smell a flower with my {}.',    w: ['nose', '👃'],    alike: ['toes', 'note'],    other: [['cup', '🥤'], ['bus', '🚌']] },
  { s: 'I hear music with my {}.',        w: ['ears', '👂'],    alike: ['tears', 'eel'],    other: [['cake', '🎂'], ['car', '🚗']] },
  { s: 'I clap my {} when I am happy.',   w: ['hands', '✋'],   alike: ['sand', 'hats'],    other: [['moon', '🌙'], ['milk', '🥛']] },
  { s: 'I close my {} to sleep.',         w: ['eyes', '👀'],    alike: ['ice', 'pies'],     other: [['shoe', '👟'], ['cake', '🎂']] },
  { s: 'I kick the ball with my {}.',     w: ['foot', '🦶'],    alike: ['food', 'book'],    other: [['moon', '🌙'], ['cake', '🎂']] },
  // Home
  { s: 'I sit on my {} to eat.',          w: ['chair', '🪑'],   alike: ['hair', 'chain'],   other: [['sun', '☀️'], ['milk', '🥛']] },
  { s: 'I take a bath in the {}.',        w: ['tub', '🛁'],     alike: ['cub', 'tug'],      other: [['tree', '🌳'], ['car', '🚗']] },
  { s: 'I read my {} at bedtime.',        w: ['book', '📖'],    alike: ['hook', 'cook'],    other: [['cow', '🐄'], ['apple', '🍎']] },
  { s: 'I wash my hands with {}.',        w: ['soap', '🧼'],    alike: ['soup', 'rope'],    other: [['car', '🚗'], ['frog', '🐸']] },
  { s: 'Grandma calls me on the {}.',     w: ['phone', '📱'],   alike: ['bone', 'foam'],    other: [['egg', '🥚'], ['bird', '🐦']] },
  { s: 'Turn on the {} so I can see.',    w: ['light', '💡'],   alike: ['kite', 'night'],   other: [['pig', '🐷'], ['cake', '🎂']] },
  { s: 'I eat soup with my {}.',          w: ['spoon', '🥄'],   alike: ['moon', 'spot'],    other: [['sock', '🧦'], ['dog', '🐶']] },
  // Weather and sky
  { s: 'A white {} floats in the sky.',   w: ['cloud', '☁️'],   alike: ['clown', 'loud'],   other: [['bed', '🛏️'], ['cow', '🐄']] },
  { s: 'I wear my boots in the {}.',      w: ['rain', '🌧️'],    alike: ['brain', 'rake'],   other: [['cake', '🎂'], ['bird', '🐦']] },
  { s: 'I make a man out of {}.',         w: ['snow', '❄️'],    alike: ['slow', 'glow'],    other: [['frog', '🐸'], ['bus', '🚌']] },
  { s: 'The {} blows my hat away.',       w: ['wind', '🌬️'],    alike: ['wing', 'wig'],     other: [['egg', '🥚'], ['bed', '🛏️']] },
  { s: 'I hold an {} in the rain.',       w: ['umbrella', '☂️'], alike: ['under', 'uncle'], other: [['fish', '🐟'], ['cake', '🎂']] },
  { s: 'The little {} twinkles in the sky.', w: ['star', '⭐'],    alike: ['jar', 'stop'],     other: [['sock', '🧦'], ['pig', '🐷']] },
  // School and play
  { s: 'I draw a picture with my {}.',    w: ['crayon', '🖍️'],  alike: ['crab', 'crow'],    other: [['milk', '🥛'], ['moon', '🌙']] },
  { s: 'I carry my books in my {}.',      w: ['bag', '👜'],     alike: ['bat', 'wag'],      other: [['sun', '☀️'], ['frog', '🐸']] },
  { s: 'I write my name with my {}.',     w: ['pencil', '✏️'],  alike: ['penguin', 'pebble'], other: [['cow', '🐄'], ['egg', '🥚']] },
  { s: 'I bounce the {} on the floor.',   w: ['ball', '⚽'],    alike: ['tall', 'fall'],    other: [['moon', '🌙'], ['cloud', '☁️']] },
  { s: 'I fly my {} on a windy day.',     w: ['kite', '🪁'],    alike: ['bite', 'kit'],     other: [['egg', '🥚'], ['chair', '🪑']] },
  { s: 'The {} goes choo choo.',          w: ['train', '🚂'],   alike: ['rain', 'tray'],    other: [['egg', '🥚'], ['tree', '🌳']] },
  { s: 'I blow out the {} on my cake.',   w: ['candles', '🕯️'], alike: ['handles', 'sandals'], other: [['frog', '🐸'], ['bus', '🚌']] },
  // Princesses and fairy tales
  { s: 'The princess wears a gold {}.',   w: ['crown', '👑'],   alike: ['clown', 'brown'],  other: [['cow', '🐄'], ['bus', '🚌']] },
  { s: 'The king lives in a big {}.',     w: ['castle', '🏰'],  alike: ['tassel', 'cattle'], other: [['cup', '🥤'], ['sock', '🧦']] },
  { s: 'The {} breathes fire.',           w: ['dragon', '🐉'],  alike: ['wagon', 'drum'],   other: [['milk', '🥛'], ['sock', '🧦']] },
  { s: 'The prince rides a white {}.',    w: ['horse', '🐴'],   alike: ['house', 'hose'],   other: [['cake', '🎂'], ['spoon', '🥄']] },
  { s: 'The witch flies on her {}.',      w: ['broom', '🧹'],   alike: ['room', 'bloom'],   other: [['fish', '🐟'], ['egg', '🥚']] },
  { s: 'Cinderella lost her glass {}.',   w: ['shoe', '👠'],    alike: ['shop', 'two'],     other: [['cow', '🐄'], ['tree', '🌳']] },
  { s: 'The {} swims with her fish tail.', w: ['mermaid', '🧜'], alike: ['mirror', 'merry'], other: [['bus', '🚌'], ['chair', '🪑']] },
];

// Easier and harder sentences for the tiers (TIERS below); SENTENCES above
// are the hardest ('old'). lv 1: a 3-letter answer, the words that sound
// alike make no sense and the other pictures are silly. lv 2: a blend or a
// longer answer, close sounding words, and one other picture of the right
// kind of thing. Their alike words never differ from the answer in just a
// sound she can't tell apart yet (pan, pen; HARD_PAIRS): only the old ones do.
const SENTENCES_L1 = [
  { lv: 1, s: 'The red {} runs in the woods.',     w: ['fox', '🦊'],  alike: ['box', 'fix'],  other: [['cup', '🥤'], ['pen', '🖊️']] },
  { lv: 1, s: 'I put my toys in the {}.',          w: ['box', '📦'],  alike: ['fox', 'ox'],   other: [['hen', '🐔'], ['leg', '🦵']] },
  { lv: 1, s: 'Look at the {} to find the way.',   w: ['map', '🗺️'],  alike: ['mop', 'cap'],  other: [['pig', '🐷'], ['egg', '🥚']] },
  { lv: 1, s: 'I drink juice from my {}.',         w: ['cup', '🥤'],  alike: ['pup', 'cut'],  other: [['bed', '🛏️'], ['fox', '🦊']] },
  { lv: 1, s: 'A bug has {} legs.',                w: ['six', '6️⃣'],  alike: ['sit', 'mix'],  other: [['hat', '🎩'], ['sun', '☀️']] },
  { lv: 1, s: 'I have {} fingers.',                w: ['ten', '🔟'],  alike: ['hen', 'pen'],  other: [['bus', '🚌'], ['fox', '🦊']] },
  { lv: 1, s: 'A little {} sits on the leaf.',     w: ['bug', '🐛'],  alike: ['mug', 'hug'],  other: [['bus', '🚌'], ['bed', '🛏️']] },
  { lv: 1, s: 'I write with my {}.',               w: ['pen', '🖊️'],  alike: ['hen', 'ten'],  other: [['dog', '🐶'], ['sun', '☀️']] },
  { lv: 1, s: 'We all ride in the {}.',            w: ['van', '🚐'],  alike: ['fan', 'man'],  other: [['cup', '🥤'], ['hat', '🎩']] },
  { lv: 1, s: 'The {} sleeps upside down.',        w: ['bat', '🦇'],  alike: ['bag', 'hat'],  other: [['bed', '🛏️'], ['egg', '🥚']] },
  { lv: 1, s: 'I hop on one {}.',                  w: ['leg', '🦵'],  alike: ['log', 'peg'],  other: [['cup', '🥤'], ['hat', '🎩']] },
  { lv: 1, s: 'The squirrel eats a {}.',           w: ['nut', '🥜'],  alike: ['net', 'hut'],  other: [['bus', '🚌'], ['bed', '🛏️']] },
  { lv: 1, s: 'A strawberry is {}.',               w: ['red', '🔴'],  alike: ['bed', 'rod'],  other: [['dog', '🐶'], ['bus', '🚌']] },
  { lv: 1, s: 'The spider makes a {}.',            w: ['web', '🕸️'],  alike: ['wet', 'bed'],  other: [['cup', '🥤'], ['pig', '🐷']] },
  { lv: 1, s: 'The {} flies in the sky.',          w: ['jet', '✈️'],  alike: ['net', 'jam'],  other: [['pig', '🐷'], ['bed', '🛏️']] },
  { lv: 1, s: 'Dad cooks eggs in a {}.',           w: ['pan', '🍳'],  alike: ['man', 'can'],  other: [['hat', '🎩'], ['dog', '🐶']] },
  { lv: 1, s: 'Soup comes in a {}.',               w: ['can', '🥫'],  alike: ['cat', 'fan'],  other: [['sun', '☀️'], ['leg', '🦵']] },
  { lv: 1, s: 'The {} wags its tail.',             w: ['dog', '🐶'],  alike: ['dig', 'dot'],  other: [['cup', '🥤'], ['bus', '🚌']] },
  { lv: 1, s: 'I put on my {} and go out.',        w: ['cap', '🧢'],  alike: ['map', 'tap'],  other: [['egg', '🥚'], ['pig', '🐷']] },
  { lv: 1, s: 'The {} has a little chick.',        w: ['hen', '🐔'],  alike: ['ten', 'hat'],  other: [['box', '📦'], ['cup', '🥤']] },
];
const SENTENCES_L2 = [
  { lv: 2, s: 'The {} jumps into the pond.',          w: ['frog', '🐸'],  alike: ['fog', 'flag'],   other: [['drum', '🥁'], ['tent', '⛺']] },
  { lv: 2, s: 'We sleep in a {} when we go camping.', w: ['tent', '⛺'],  alike: ['ten', 'test'],   other: [['crab', '🦀'], ['tub', '🛁']] },
  { lv: 2, s: 'The {} walks sideways on the sand.',   w: ['crab', '🦀'],  alike: ['cab', 'grab'],   other: [['tent', '⛺'], ['flag', '🚩']] },
  { lv: 2, s: 'Boom, boom! I bang my {}.',            w: ['drum', '🥁'],  alike: ['drip', 'dream'], other: [['milk', '🥛'], ['frog', '🐸']] },
  { lv: 2, s: 'We slide down the snowy hill on a {}.', w: ['sled', '🛷'], alike: ['bled', 'bed'],  other: [['milk', '🥛'], ['hand', '✋']] },
  { lv: 2, s: 'Cars {} at the red light.',            w: ['stop', '🛑'],  alike: ['step', 'shop'],  other: [['crab', '🦀'], ['gift', '🎁']] },
  { lv: 2, s: 'Fish {} in the sea.',                  w: ['swim', '🏊'],  alike: ['swing', 'slim'], other: [['milk', '🥛'], ['tent', '⛺']] },
  { lv: 2, s: 'I wave a {} at the race.',             w: ['flag', '🚩'],  alike: ['flat', 'frog'],  other: [['milk', '🥛'], ['crab', '🦀']] },
  { lv: 2, s: 'I open my birthday {}.',               w: ['gift', '🎁'],  alike: ['lift', 'gust'],  other: [['crab', '🦀'], ['drum', '🥁']] },
  { lv: 2, s: 'I wear a {} when I have a cold.',      w: ['mask', '😷'],  alike: ['mast', 'mass'],  other: [['frog', '🐸'], ['tent', '⛺']] },
  { lv: 2, s: "I hold Mom's {} to cross the road.",   w: ['hand', '✋'],  alike: ['band', 'sand'],  other: [['crab', '🦀'], ['sled', '🛷']] },
  { lv: 2, s: 'The cow gives us {}.',                 w: ['milk', '🥛'],  alike: ['silk', 'mint'],  other: [['egg', '🥚'], ['drum', '🥁']] },
  { lv: 2, s: 'A {} is green and has spikes.',        w: ['cactus', '🌵'], alike: ['catch', 'cats'], other: [['frog', '🐸'], ['milk', '🥛']] },
  { lv: 2, s: 'I carry apples in a {}.',              w: ['basket', '🧺'], alike: ['blanket', 'biscuit'], other: [['frog', '🐸'], ['drum', '🥁']] },
  { lv: 2, s: 'The {} sticks to the fridge.',         w: ['magnet', '🧲'], alike: ['magic', 'market'], other: [['crab', '🦀'], ['milk', '🥛']] },
  { lv: 2, s: 'The {} blasts off to the moon.',       w: ['rocket', '🚀'], alike: ['pocket', 'racket'], other: [['milk', '🥛'], ['bus', '🚌']] },
  { lv: 2, s: 'We carve a {} for Halloween.',         w: ['pumpkin', '🎃'], alike: ['pumping', 'napkin'], other: [['sled', '🛷'], ['crab', '🦀']] },
  { lv: 2, s: 'I wear a {} when I ride my bike.',     w: ['helmet', '⛑️'], alike: ['hammer', 'hello'], other: [['milk', '🥛'], ['frog', '🐸']] },
  { lv: 2, s: 'The little {} says cheep, cheep.',     w: ['chick', '🐤'], alike: ['chin', 'sick'], other: [['drum', '🥁'], ['frog', '🐸']] },
  { lv: 2, s: 'I find a pretty {} at the beach.',     w: ['shell', '🐚'], alike: ['shelf', 'smell'], other: [['milk', '🥛'], ['sled', '🛷']] },
  { lv: 2, s: 'The big {} carries the sand.',         w: ['truck', '🚚'], alike: ['trick', 'duck'], other: [['chick', '🐤'], ['milk', '🥛']] },
  { lv: 2, s: 'The {} says tick tock.',               w: ['clock', '⏰'], alike: ['click', 'block'], other: [['frog', '🐸'], ['bell', '🔔']] },
  { lv: 2, s: 'I paint a picture with a {}.',         w: ['brush', '🖌️'], alike: ['bush', 'brick'], other: [['crab', '🦀'], ['milk', '🥛']] },
  { lv: 2, s: 'The big {} sails on the sea.',         w: ['ship', '🚢'], alike: ['shop', 'chip'],  other: [['truck', '🚚'], ['drum', '🥁']] },
  { lv: 2, s: 'The {} grows in a pot.',               w: ['plant', '🌱'], alike: ['plan', 'pants'], other: [['drum', '🥁'], ['crab', '🦀']] },
  { lv: 2, s: 'I put on my {} and my shirt.',         w: ['pants', '👖'], alike: ['plants', 'ants'], other: [['frog', '🐸'], ['clock', '⏰']] },
  { lv: 2, s: 'The princess wears a pink {}.',       w: ['dress', '👗'], alike: ['desk', 'press'],  other: [['crab', '🦀'], ['drum', '🥁']] },
  { lv: 2, s: 'I ring the {}. Ding, dong!',           w: ['bell', '🔔'], alike: ['belt', 'shell'],  other: [['milk', '🥛'], ['frog', '🐸']] },
];

// ---- Word bank and difficulty (js/quiz.js) ---------------------------------

// More first letters for the town's letter questions (no houses: E, O,
// K, V, W and Z). K says the same sound as C, so no question shows both.
const LETTERS_MORE = [
  { letter: 'E', sound: 'eh',  color: '#7ab8ff', words: [['egg', '🥚'], ['elephant', '🐘'], ['elf', '🧝'], ['envelope', '✉️']] },
  { letter: 'O', sound: 'aw',  color: '#ffa94d', words: [['octopus', '🐙'], ['ox', '🐂'], ['otter', '🦦']] },
  { letter: 'K', sound: 'kuh', color: '#c78bff', words: [['king', '🤴'], ['key', '🔑'], ['kangaroo', '🦘'], ['koala', '🐨'], ['kiwi', '🥝'], ['kite', '🪁']] },
  { letter: 'V', sound: 'vvv', color: '#6fd3a8', words: [['van', '🚐'], ['violin', '🎻'], ['volcano', '🌋'], ['vest', '🦺']] },
  { letter: 'W', sound: 'wuh', color: '#5fb0e8', words: [['watermelon', '🍉'], ['wolf', '🐺'], ['web', '🕸️'], ['watch', '⌚'], ['whale', '🐳']] },
  { letter: 'Z', sound: 'zzz', color: '#ff9fb0', words: [['zebra', '🦓'], ['zero', '0️⃣']] },
];
LETTERS.push(...LETTERS_MORE);

// Other names a child may use for a picture, so a wrong card is never
// right by her own name for it (🦍 is "monkey" to her: not a wrong M).
const ALIAS = {
  gorilla: ['monkey'], alligator: ['crocodile'], rabbit: ['bunny'], gift: ['present'], nut: ['peanut'], dolphin: ['fish'],
  net: ['goal'], notebook: ['book'], boat: ['ship'], taxi: ['car'], rose: ['flower'], noodles: ['ramen'], arrow: ['bow'],
  rooster: ['chicken', 'hen'], ladybug: ['bug'], panda: ['bear'], lollipop: ['candy'], newspaper: ['paper'], tiger: ['cat'],
  ambulance: ['car'], mountain: ['hill'], heart: ['love'], penguin: ['bird'], duck: ['bird'], hen: ['chicken'], cap: ['hat'],
  van: ['car', 'bus'], bug: ['worm'], web: ['spider'], mom: ['lady'], rat: ['mouse'], tub: ['bath'], tap: ['water'],
  mug: ['cup', 'coffee'], jet: ['airplane', 'plane'], kid: ['boy', 'girl'], lip: ['mouth'], pan: ['egg'], nap: ['sleep'],
  sad: ['cry'], ox: ['cow', 'bull'], grin: ['smile'], drip: ['water'], ship: ['boat'], king: ['prince'], shop: ['store'],
  chick: ['bird'], brick: ['wall'], helmet: ['hat'], laptop: ['computer'], tennis: ['ball'], backpack: ['bag'],
  drumstick: ['chicken'], koala: ['bear'], otter: ['beaver'], kangaroo: ['animal'],
  volcano: ['mountain'], elf: ['fairy'], watch: ['clock'], wolf: ['dog'], whale: ['fish'], envelope: ['letter', 'mail'],
  zebra: ['horse'], violin: ['guitar'],
};

// Words for the tiers, each [word, picture, pic, parts?]. pic 2: the
// picture alone names the word (safe where the picture is the answer:
// read, blend, findStart); pic 1: fine beside the written or spoken word.
// `parts` are its sounds (sh, ck... are one) or, for long words, its
// syllables. Every letter says its usual sound.
// First 3-letter words: very common, clear pictures.
const CVC_A1 = [
  ['cat', '🐱', 2], ['dog', '🐶', 2], ['pig', '🐷', 2], ['sun', '☀️', 2], ['bus', '🚌', 2], ['hat', '🎩', 2],
  ['bed', '🛏️', 2], ['box', '📦', 2], ['fox', '🦊', 2], ['hen', '🐔', 2], ['map', '🗺️', 2], ['cup', '🥤', 1],
  ['man', '👨', 1], ['six', '6️⃣', 2], ['ten', '🔟', 2], ['bug', '🐛', 2], ['pen', '🖊️', 2], ['van', '🚐', 2],
];
// The other 3-letter words.
const CVC_A2 = [
  ['bat', '🦇', 2], ['cap', '🧢', 2], ['bag', '👜', 2], ['can', '🥫', 2], ['leg', '🦵', 2], ['nut', '🥜', 2],
  ['red', '🔴', 1], ['web', '🕸️', 2], ['mom', '👩', 1], ['pin', '📌', 1], ['rat', '🐀', 1], ['tub', '🛁', 1],
  ['tap', '🚰', 1], ['mug', '☕', 1], ['jet', '✈️', 1], ['net', '🥅', 1], ['kid', '🧒', 1], ['lip', '👄', 1],
  ['pan', '🍳', 1], ['gas', '⛽', 1], ['run', '🏃', 1], ['nap', '😴', 1], ['sad', '😢', 1], ['yum', '😋', 1],
];
// Blends: two letters first (frog) or last (milk).
const CCVC = [
  ['frog', '🐸', 2], ['flag', '🚩', 2], ['crab', '🦀', 2], ['drum', '🥁', 2], ['sled', '🛷', 2], ['stop', '🛑', 2],
  ['swim', '🏊', 2], ['plug', '🔌', 1], ['clip', '📎', 1], ['clap', '👏', 1], ['grin', '😁', 1], ['drip', '💧', 1],
];
const CVCC = [
  ['milk', '🥛', 2], ['tent', '⛺', 2], ['gift', '🎁', 2], ['hand', '✋', 2], ['mask', '😷', 2], ['golf', '🏌️', 1],
  ['fist', '✊', 1], ['wind', '🌬️', 1], ['vest', '🦺', 1],
];
// Five or more letters: one syllable with blends at both ends, or two
// short syllables (spelled one syllable at a time).
const LONG = [
  ['plant', '🌱', 2], ['pants', '👖', 2], ['cactus', '🌵', 2, ['cac', 'tus']], ['basket', '🧺', 2, ['bas', 'ket']],
  ['magnet', '🧲', 2, ['mag', 'net']], ['laptop', '💻', 2, ['lap', 'top']], ['helmet', '⛑️', 1, ['hel', 'met']],
  ['rabbit', '🐰', 2, ['rab', 'bit']], ['tennis', '🎾', 1, ['ten', 'nis']], ['sunset', '🌇', 1, ['sun', 'set']],
  ['pumpkin', '🎃', 2, ['pump', 'kin']], ['hotdog', '🌭', 2, ['hot', 'dog']], ['trumpet', '🎺', 2, ['trum', 'pet']],
];
// Letter pairs that say one sound (sh, ch, ck, ll, ss, ng): one tile each.
const DIGRAPH = [
  ['fish', '🐟', 2, ['f', 'i', 'sh']], ['ship', '🚢', 2, ['sh', 'i', 'p']], ['duck', '🦆', 2, ['d', 'u', 'ck']],
  ['sock', '🧦', 2, ['s', 'o', 'ck']], ['lock', '🔒', 2, ['l', 'o', 'ck']], ['bell', '🔔', 2, ['b', 'e', 'll']],
  ['ring', '💍', 2, ['r', 'i', 'ng']], ['king', '🤴', 2, ['k', 'i', 'ng']], ['shop', '🏪', 1, ['sh', 'o', 'p']],
  ['chick', '🐤', 2, ['ch', 'i', 'ck']], ['shell', '🐚', 2, ['sh', 'e', 'll']], ['clock', '⏰', 2, ['c', 'l', 'o', 'ck']],
  ['truck', '🚚', 2, ['t', 'r', 'u', 'ck']], ['brick', '🧱', 2, ['b', 'r', 'i', 'ck']], ['brush', '🖌️', 1, ['b', 'r', 'u', 'sh']],
  ['dress', '👗', 2, ['d', 'r', 'e', 'ss']], ['chess', '♟️', 1, ['ch', 'e', 'ss']],
  ['rocket', '🚀', 2, ['r', 'o', 'ck', 'e', 't']], ['ticket', '🎫', 1, ['t', 'i', 'ck', 'e', 't']],
  ['shrimp', '🦐', 2, ['sh', 'r', 'i', 'm', 'p']], ['sandwich', '🥪', 2, ['s', 'a', 'n', 'd', 'w', 'i', 'ch']],
  ['backpack', '🎒', 2, ['b', 'a', 'ck', 'p', 'a', 'ck']], ['chopstick', '🥢', 2, ['ch', 'o', 'p', 's', 't', 'i', 'ck']],
  ['lipstick', '💄', 2, ['l', 'i', 'p', 's', 't', 'i', 'ck']], ['drumstick', '🍗', 1, ['d', 'r', 'u', 'm', 's', 't', 'i', 'ck']],
];
// Words that differ in one sound, all with pictures, for the hardest tiers.
const MINIMAL_SETS = [
  ['pan', 'pen', 'pin'], ['bag', 'bug'], ['cap', 'cup'], ['net', 'nut'],
  ['cat', 'hat', 'bat', 'rat'], ['can', 'man', 'van', 'pan'], ['hen', 'pen', 'ten'], ['box', 'fox'], ['bug', 'mug'],
  ['map', 'cap', 'tap'], ['bed', 'red'], ['cat', 'cap', 'can'], ['bat', 'bag'], ['pin', 'pig'], ['map', 'man'],
  ['bus', 'bug'],
];

// ---- Difficulty ---------------------------------------------------------------

// Each kind of question has tiers, easiest first (js/quiz.js). A tier sets:
//   n         how many cards
//   pics      pictures on word cards
//   far       other cards far from the answer (another first letter or vowel)
//   near      one other card she finds hard to tell apart (HARD_PAIRS); for
//             sentences, words that sound alike may be such words (pan, pen)
//   sound     the letter's pure sound is said with the question ("/k/")
//   single    first-sound words start with one consonant (no tr, sn...)
//   lower     lower-case letter cards
//   sameVowel a rhyme card with the same vowel (sun, drum)
//   words     which word list (see Quiz bank in js/quiz.js)
//   minimal   cards are words that differ in one sound (MINIMAL_SETS)
//   lv        sentence level: 1, 2 or 'old' (SENTENCES)
//   step      a first step before the tiers a kind had: its questions are
//             of that kind of their own (blending's oneSound, twoSounds)
//   then      that many cards once she knows LETTER_MASTERY.more letters
//   letters   passed only by knowing every letter (LETTER_MASTERY), and a
//             tier she never goes back down to
// Spelling: `extra` letter tiles beside the word's own, `vowelFoil` one of
// them a vowel, `firstGiven` the first letter is already in, `noX` no x
// words, `setting` only when the parent panel turns it on.
const SPELL_TIERS = [
  { words: 'CVC_A1', extra: 1, firstGiven: true, noX: true }, // 1: c _ _ given, 4 tiles
  { words: 'CVC', extra: 2, vowelFoil: true },                 // 2: 3 letters, 5 tiles
  { words: 'DIGRAPH4', extra: 3, vowelFoil: true },            // 3: fish, duck, bell: sh, ck, ll on one tile
  { words: 'BLEND4', extra: 3, vowelFoil: true },              // 4: frog, milk: 4 letters
  { words: 'ONE5', extra: 3, vowelFoil: true },                // 5: plant, truck, shell
  { words: 'TWO', extra: 3, vowelFoil: true, near: true, setting: 'twoSyllables' }, // 6: rab-bit, rock-et
];
const TIERS = {
  word:      [{ n: 2, pics: true, far: true }, { n: 3, pics: true }, { n: 3 }, { n: 3, near: true }],
  start:     [{ n: 2, far: true, sound: true, single: true }, { n: 3, sound: true }, { n: 3 }, { n: 3, near: true, lower: true }],
  findStart: [{ n: 2, far: true, sound: true, single: true }, { n: 3, sound: true }, { n: 3, near: true }],
  rhyme:     [{ n: 2 }, { n: 3 }, { n: 3, sameVowel: true }],
  family:    [{ n: 3, pics: true, words: 'CVC_A1' }, { n: 3, words: 'CVC' }, { n: 4, words: 'FAM' }, { n: 4, minimal: true }],
  vowel:     [{ n: 2, far: true, words: 'CVC_A1' }, { n: 3, words: 'CVC' }, { n: 3, near: true, words: 'CVC' }],
  ending:    [{ n: 2, far: true, words: 'CVC_A1' }, { n: 3, words: 'CVC' }, { n: 3, near: true, words: 'CVC' }],
  read:      [{ n: 2, far: true, words: 'CVC_A1' }, { n: 3, words: 'CVC' }, { n: 3, minimal: true }, { n: 3, words: 'BLEND4' }],
  // One sound, then two (ONE_SOUND, TWO_SOUNDS below), then three-letter words.
  blend:     [{ step: 'oneSound', n: 2, then: 3, letters: true }, { step: 'twoSounds', n: 2, far: true },
    { n: 2, far: true, words: 'CVC_A1' }, { n: 3, words: 'CVC' }, { n: 3, minimal: true }, { n: 3, words: 'BLEND4' }],
  sentence:  [{ n: 2, lv: 1, pics: true }, { n: 3, lv: 1 }, { n: 3, lv: 2 }, { n: 3, lv: 'old', near: true }],
  meaning:   [{ n: 2, lv: 1 }, { n: 3, lv: 1 }, { n: 3, lv: 2 }, { n: 3, lv: 'old' }],
  spell:     SPELL_TIERS,
};
// The highest tier each place asks (every place starts at tier 1), counted
// from a kind's first tier without a `step`: blending's first steps come on
// top, so the forest asks it up to its 6th tier, as up to the 4th before.
const TIER_BAND = { town: [1, 4], house: [1, 4], forest: [1, 4], unicorn: [1, 3], dungeon: [1, 4], fairy: [1, 6] };
// Up a tier after 5 right first tries of the last 6 at it (or the first 3
// in a row, before her first miss of that kind); down after 2 misses in a
// row. After a miss the next one is a tier easier, and every 4th question
// is from the tier below; those two don't count.
const SKILL = { window: 6, promoteAt: 5, placementRun: 3, demoteAfter: 2, reviewEvery: 4 };

// ---- Sound blending's first steps (TIERS.blend, js/quiz.js) ------------------

// Blending ("/s/ … /u/ … /n/", pick ☀️) starts with two steps before the
// three-letter words:
//   oneSound   she hears one letter's pure sound ("/s/") and picks the
//              picture that starts with it, two cards and then three; she
//              moves on once she knows every letter here (LETTER_MASTERY)
//   twoSounds  she hears two ("/b/ … E") and picks the picture; a long vowel
//              is said by its letter's name, as in the Monster Village
// Every letter but x (no word starts with its /ks/) and q (always qu, two
// sounds /kw/, and its 👸 is a princess to her): 24, with words that start
// with that very sound (no ch for c, th for t, the e of ear or the o of
// one) and pictures she names for sure; ALIAS keeps a picture she may call
// something else off a question about that other sound.
const ONE_SOUND = [
  { l: 'a', words: [['apple', '🍎'], ['ant', '🐜'], ['avocado', '🥑']] },
  { l: 'b', words: [['bus', '🚌'], ['bed', '🛏️'], ['box', '📦'], ['bee', '🐝'], ['ball', '⚽'], ['banana', '🍌'], ['bear', '🐻'], ['book', '📖'], ['balloon', '🎈']] },
  { l: 'c', words: [['cat', '🐱'], ['cake', '🎂'], ['cow', '🐮'], ['corn', '🌽'], ['carrot', '🥕'], ['cookie', '🍪'], ['camel', '🐫']] },
  { l: 'd', words: [['dog', '🐶'], ['door', '🚪'], ['dinosaur', '🦕'], ['donut', '🍩'], ['dice', '🎲'], ['deer', '🦌']] },
  { l: 'e', words: [['egg', '🥚'], ['elephant', '🐘']] },
  { l: 'f', words: [['fox', '🦊'], ['fish', '🐟'], ['five', '5️⃣'], ['fire', '🔥'], ['foot', '🦶'], ['fork', '🍴'], ['four', '4️⃣']] },
  { l: 'g', words: [['guitar', '🎸'], ['ghost', '👻'], ['girl', '👧']] },
  { l: 'h', words: [['hat', '🎩'], ['hand', '✋'], ['horse', '🐴'], ['house', '🏠'], ['hippo', '🦛'], ['hammer', '🔨'], ['honey', '🍯']] },
  { l: 'i', words: [['insect', '🦗']] },
  { l: 'j', words: [['juice', '🧃']] },
  { l: 'k', words: [['kite', '🪁'], ['key', '🔑'], ['kiwi', '🥝']] },
  { l: 'l', words: [['leg', '🦵'], ['lion', '🦁'], ['lemon', '🍋'], ['leaf', '🍃'], ['lock', '🔒'], ['lizard', '🦎']] },
  { l: 'm', words: [['moon', '🌙'], ['monkey', '🐵'], ['mouse', '🐭'], ['milk', '🥛'], ['map', '🗺️'], ['mushroom', '🍄'], ['mango', '🥭']] },
  { l: 'n', words: [['nose', '👃'], ['nine', '9️⃣']] },
  { l: 'o', words: [['octopus', '🐙']] },
  { l: 'p', words: [['pig', '🐷'], ['pen', '🖊️'], ['pizza', '🍕'], ['popcorn', '🍿'], ['pumpkin', '🎃'], ['peach', '🍑']] },
  { l: 'r', words: [['ring', '💍'], ['rainbow', '🌈'], ['robot', '🤖'], ['rice', '🍚']] },
  { l: 's', words: [['sun', '☀️'], ['sock', '🧦'], ['six', '6️⃣'], ['soap', '🧼'], ['sandwich', '🥪']] },
  { l: 't', words: [['ten', '🔟'], ['tent', '⛺'], ['tomato', '🍅'], ['tooth', '🦷']] },
  { l: 'u', words: [['umbrella', '☂️']] },
  { l: 'v', words: [['violin', '🎻'], ['van', '🚐'], ['volcano', '🌋']] },
  { l: 'w', words: [['watermelon', '🍉'], ['web', '🕸️']] },
  { l: 'y', words: [['yoyo', '🪀'], ['yarn', '🧶']] },
  { l: 'z', words: [['zero', '0️⃣'], ['zebra', '🦓']] },
];
Object.assign(ALIAS, { insect: ['bug', 'grasshopper'], juice: ['milk'], queen: ['princess'] });
// Two-sound words: [word, picture, its sounds], a long vowel as its
// capital (said by the narrator as the letter's name: b-E is "/b/ … E").
// Words she names for sure from the picture: no tie (👔 a shirt), tea (🍵 a
// cup), toe, bow (🎀 a ribbon) or ape (🦍 a monkey).
const TWO_SOUNDS = [
  ['bee', '🐝', ['b', 'E']], ['key', '🔑', ['k', 'E']], ['pie', '🥧', ['p', 'I']], ['car', '🚗', ['c', 'R']],
  ['ear', '👂', ['E', 'r']], ['egg', '🥚', ['e', 'g']], ['ice', '🧊', ['I', 's']], ['eight', '8️⃣', ['A', 't']],
];
// The one-sound step is passed by knowing every letter on it. A letter is
// known once she has picked its picture right on the first try `right`
// times, and her latest try at it was right. Questions favour letters she
// doesn't know yet, `working` at a time (new ones in LETTER_ORDER), bring a
// missed one back `soon` (that many one-sound questions later), and now and
// then (`review`, a share) ask one she knows. Two cards until she knows
// `more` letters, then three.
const LETTER_MASTERY = { right: 2, working: 4, soon: 2, review: 0.2, more: 8 };
// New letters come in this order, the first ones the easiest to hear apart.
const LETTER_ORDER = 'satipnckehrmdgoulfbjzwvy';
// The easy word the sound magic (js/blend-magic.js) shows the first time
// she is at the two-sound and the three-sound step.
// Two each: never the word of the question it comes before.
const MAGIC_INTRO = { 2: ['bee', 'key'], 3: ['sun', 'hat'] };
// Asked by the villager before the sound (the one-sound step).
LINES.oneSound = ['Which picture starts with this sound?', 'Listen! Which one starts with this sound?'];
// The narrator: the Unicorn Village's game at the one-sound step, the sound
// magic (only once they are recorded), and the two-sound step opening.
LINES.miniSound = ['Listen to the sound. Tap the picture!'];
LINES.magicHello = ["Let's put the sounds together!"];
LINES.magicSlow = ['Slowly…'];
LINES.magicFast = ['Faster!'];
LINES.magicPop = ['Pop!'];
LINES.blendTwo = ['You can blend two sounds now!'];

// ---- Long vowels: the Monster Village's questions (level 6) ----------------

// The next step after short vowels and blends: the vowel says its own name.
// Each group is one way to spell that sound (`team`; a_e is a magic e, as in
// cake) and `says` is the letter whose name it says (ar says the name of R).
// Words are [word, picture, pic, parts] as in the banks above, but `parts`
// are its sounds, with the long vowel as that capital letter: c-A-k is
// sounded out "/k/ … A … /k/", the narrator saying the letter's name in the
// middle (never "/k/ /a/ /k/ /e/"); an s that says /z/ is a z (n-O-z).
// pic 0: no picture, so only ever a written card (longWord).
const LONG_VOWELS = [
  { team: 'a_e', says: 'A', words: [
    ['cake', '🎂', 2, ['c', 'A', 'k']], ['snake', '🐍', 2, ['s', 'n', 'A', 'k']], ['skate', '⛸️', 2, ['s', 'k', 'A', 't']],
    ['plane', '✈️', 2, ['p', 'l', 'A', 'n']], ['cape', '', 0, ['c', 'A', 'p']], ['tape', '', 0, ['t', 'A', 'p']]] },
  { team: 'i_e', says: 'I', words: [
    ['kite', '🪁', 2, ['k', 'I', 't']], ['bike', '🚲', 2, ['b', 'I', 'k']], ['five', '5️⃣', 2, ['f', 'I', 'v']],
    ['nine', '9️⃣', 2, ['n', 'I', 'n']], ['pine', '🌲', 1, ['p', 'I', 'n']], ['bite', '', 0, ['b', 'I', 't']]] },
  { team: 'o_e', says: 'O', words: [
    ['bone', '🦴', 2, ['b', 'O', 'n']], ['nose', '👃', 2, ['n', 'O', 'z']], ['rose', '🌹', 2, ['r', 'O', 'z']],
    ['note', '🎵', 1, ['n', 'O', 't']], ['hope', '', 0, ['h', 'O', 'p']]] },
  // Only where u_e says "yoo", the name of U (tube is "toob" to the narrator).
  { team: 'u_e', says: 'U', words: [['cube', '🧊', 1, ['c', 'U', 'b']], ['cute', '', 0, ['c', 'U', 't']]] },
  { team: 'ee', says: 'E', words: [
    ['bee', '🐝', 2, ['b', 'E']], ['tree', '🌳', 2, ['t', 'r', 'E']], ['three', '3️⃣', 2, ['th', 'r', 'E']],
    ['sheep', '🐑', 2, ['sh', 'E', 'p']], ['feed', '', 0, ['f', 'E', 'd']]] },
  { team: 'ea', says: 'E', words: [
    ['leaf', '🍃', 2, ['l', 'E', 'f']], ['peach', '🍑', 2, ['p', 'E', 'ch']], ['beach', '🏖️', 2, ['b', 'E', 'ch']],
    ['meat', '🍖', 1, ['m', 'E', 't']], ['seat', '💺', 1, ['s', 'E', 't']]] },
  { team: 'ai', says: 'A', words: [['rain', '🌧️', 2, ['r', 'A', 'n']], ['train', '🚂', 2, ['t', 'r', 'A', 'n']], ['snail', '🐌', 2, ['s', 'n', 'A', 'l']]] },
  { team: 'ay', says: 'A', words: [['day', '', 0, ['d', 'A']], ['play', '', 0, ['p', 'l', 'A']], ['tray', '', 0, ['t', 'r', 'A']]] },
  { team: 'oa', says: 'O', words: [
    ['boat', '⛵', 2, ['b', 'O', 't']], ['goat', '🐐', 2, ['g', 'O', 't']], ['coat', '🧥', 2, ['c', 'O', 't']],
    ['soap', '🧼', 2, ['s', 'O', 'p']], ['road', '🛣️', 1, ['r', 'O', 'd']]] },
  { team: 'ow', says: 'O', words: [['snow', '❄️', 2, ['s', 'n', 'O']], ['bowl', '🥣', 1, ['b', 'O', 'l']]] },
  { team: 'igh', says: 'I', words: [['light', '💡', 2, ['l', 'I', 't']], ['night', '🌃', 1, ['n', 'I', 't']]] },
  { team: 'ie', says: 'I', words: [['pie', '🥧', 2, ['p', 'I']], ['tie', '👔', 1, ['t', 'I']]] },
  { team: 'ar', says: 'R', words: [
    ['star', '⭐', 2, ['s', 't', 'R']], ['car', '🚗', 2, ['c', 'R']],
    ['shark', '🦈', 2, ['sh', 'R', 'k']], ['scarf', '🧣', 2, ['s', 'c', 'R', 'f']]] },
];
// Short and long twins for hearing a magic e or a vowel team (longWord): the
// same letters, but one more makes the vowel say its name. [short, long]
const LONG_TWINS = [
  ['kit', 'kite'], ['cap', 'cape'], ['pin', 'pine'], ['hop', 'hope'], ['not', 'note'], ['cub', 'cube'],
  ['bit', 'bite'], ['plan', 'plane'], ['cut', 'cute'], ['tap', 'tape'],
  ['cot', 'coat'], ['got', 'goat'], ['ran', 'rain'], ['set', 'seat'], ['met', 'meat'], ['rod', 'road'], ['fed', 'feed'],
];
// More rhymes with a long vowel, beside RHYME_SETS' own (cake, bee, kite,
// goat, star...), for longRhyme: pictures she names for sure. `v` is the
// vowel sound, as there; a rhyme may be spelled two ways (snail, whale).
const LONG_RHYMES = [
  { v: 'eɪ', rime: 'ail', set: [['snail', '🐌'], ['whale', '🐳']] },
];
Object.assign(ALIAS, {
  plane: ['airplane', 'jet'], skate: ['skates'], bike: ['bicycle'], pine: ['tree'], note: ['music'], cube: ['ice'],
  sheep: ['lamb'], beach: ['umbrella', 'sand'], meat: ['bone', 'chicken'], seat: ['chair'], rain: ['cloud'], coat: ['jacket'],
  road: ['street'], snow: ['snowflake'], bowl: ['cereal', 'spoon'], light: ['lamp'], night: ['city'], tie: ['shirt'],
  shark: ['fish'],
  // Pictures she may mix up, never on one question.
  pie: ['cake'], goat: ['sheep'],
});
// Rhyme pictures she may not name for sure (🏞️ "park", 🍦 "ice cream"):
// never the word she rhymes with or the answer in longRhyme.
const LONG_RHYME_UNSURE = new Set(['lake', 'chain', 'plate', 'cone', 'night', 'tie']);

// The Monster Village and its tower ask only about long vowels (js/quiz.js):
//   longBlend  hear "/k/ … A … /k/" and pick the picture
//   longRead   read a word with no voice and pick its picture
//   longWord   hear a word and find it written (kite), its short twin (kit)
//              beside it at the top tier
//   longRhyme  pick the picture that rhymes with a long vowel word
QUIZ_TYPES.monster = ['longBlend', 'longRead', 'longWord', 'longRhyme'];
// Their tiers, one spelling at a time: NAME0 the magic e and ee words with
// one sound before the vowel (cake, kite, bone, bee), NAME1 all such words
// but ar (rain, boat, light too), NAME all of them (snake, tree, star too);
// `easy` (longWord) only magic e and ee words. `mark` colours the
// letters that make the vowel say its name (c a k e) and shows that letter
// among the sound dots; `twin` puts the short twin beside the long word;
// `endSound` puts in a rhyme card that ends the same after a short vowel
// (kite, bat); for these `far` also means another vowel and another last
// sound, and `near` one card that shares all but one of the sounds (boat:
// goat, or bat).
Object.assign(TIERS, {
  longBlend: [{ n: 2, far: true, mark: true, words: 'NAME0' }, { n: 3, mark: true, words: 'NAME1' }, { n: 3, words: 'NAME' }, { n: 3, near: true, words: 'NAME' }],
  longRead:  [{ n: 2, far: true, mark: true, words: 'NAME0' }, { n: 3, mark: true, words: 'NAME1' }, { n: 3, words: 'NAME' }, { n: 3, near: true, words: 'NAME' }],
  longWord:  [{ n: 2, far: true, easy: true }, { n: 3, easy: true }, { n: 3, twin: true }],
  longRhyme: [{ n: 2, far: true }, { n: 3, endSound: true }, { n: 3, sameVowel: true }],
});
TIER_BAND.monster = [1, 4];

// The asker, before a word's sounds. Reading, hearing a word and rhymes use
// LINES.read, ask and rhyme.
LINES.longBlend = ['One letter says its name. Listen!', 'Listen to the sounds. One letter says its name!'];
// The narrator, after a miss: what makes the vowel say its name. {letter}
// is that letter, {team} the letters that spell it, one by one ("O A").
LINES.magicE = ['Magic e makes the {letter} say its name!'];
LINES.vowelTeam = ['{team} says {letter}!'];

QUIZ_TYPES.unicorn = ['sentence', 'meaning'];

LINES.sentence = ['Listen to my sentence. Which word is missing?', 'Here is a sentence. Find the missing word!', 'Listen closely to the whole sentence.'];
LINES.meaning = ['Which word makes sense?', 'Fill in the blank! What fits best?', 'Hmm, what word goes here?'];
// A word that doesn't fit the sentence, before it is hummed again.
LINES.silly = ['Hmm, that sounds silly!', 'Silly! Does that make sense?', 'Hee hee, that is silly!'];
LINES.unicorn = ['Welcome to the Unicorn Village!', 'Look, rainbows everywhere!', 'Neigh! The unicorns are happy to see you!'];
LINES.mount = ['Giddy up!', "Let's go, unicorn!", 'Wheee! Off we go!'];
LINES.dismount = ['Wait here, unicorn. I will be right back!', 'Stay here, unicorn!', 'Unicorns wait outside. See you soon!'];
LINES.newUnicorn = ['I want to be your friend! Will you ride me?', 'A unicorn for you! Do you want to ride now?', 'Neigh! Shall we go for a ride?'];

LOOKS.keeper = { hair: '#c04a4a', shirt: '#ff9ec4', pants: '#8fd3ff', hat: 'straw' };

// Unicorns that talk have `unicorn` (their colour) instead of a villager look.
const UNICORN_NPCS = [
  { name: '무지개 유니콘', look: 'unicorn', unicorn: 'rainbow', c: 17, r: 7 },
  { name: '목장 언니',     look: 'keeper', c: 9, r: 9 },
  { name: '솜사탕 유니콘', look: 'unicorn', unicorn: 'pink', c: 23, r: 14 },
  { name: '무지개 요정',   look: 'fairy', c: 8, r: 19 },
  { name: '구름 유니콘',   look: 'unicorn', unicorn: 'snow', c: 23, r: 21 },
  { name: '달빛 유니콘',   look: 'unicorn', unicorn: 'night', c: 12, r: 24 },
];

Object.assign(VOICES, {
  // `lift` plays her recordings a little faster and higher: bright and bouncy.
  unicorn: { gender: 'female', tts: 'af_bella', lift: 1.12, pitch: 1.55, rate: 1.0, voice: ['Samantha', 'Karen', 'Google US English', 'Microsoft Jenny'] },
  keeper:  { gender: 'female', tts: 'af_jessica', pitch: 1.2,  rate: 1.0,  voice: ['Tessa', 'Karen', 'Microsoft Aria'] },
});
Object.assign(PERSONA, {
  unicorn: ['Neigh! Hello, {title} {name}!', 'Sparkle, sparkle! Do you like my mane?', 'Hello! I love sentences. Want to play?', 'Neigh! My horn is glowing today!'],
  keeper:  ['Hi, {title} {name}! I take care of the unicorns.', 'Welcome to the unicorn farm!', 'The unicorns love clever friends like you!'],
});

// ---- Crystal Cave (level 4) and the shop ------------------------------------

// The Crystal Cave opens from the west end of the Starlight Forest path.
const DUNGEON_STARS = 30;

// Cute cave monsters ask sentence questions like the unicorns. Answering
// right "catches" one: it goes poof and leaves 1 to `coins` coins behind.
// Caught monsters come back after a while, or when she comes in again.
const DUNGEON_NPCS = [
  { name: '말랑 슬라임', look: 'slime',     c: 4,  r: 9,  coins: 2 },
  { name: '꼬마 박쥐',   look: 'bat',       c: 10, r: 2,  coins: 2 },
  { name: '부끄럼 유령', look: 'ghost',     c: 13, r: 7,  coins: 3 },
  { name: '아기 드래곤', look: 'dragon',    c: 7,  r: 5,  coins: 3 },
  { name: '버섯 꼬물이', look: 'shroom',    c: 3,  r: 3,  coins: 2 },
  { name: '분홍 슬라임', look: 'slimepink', c: 12, r: 11, coins: 2 },
];
const MONSTER_RESPAWN_MS = 60000;

QUIZ_TYPES.dungeon = ['sentence', 'meaning'];

// Monsters are drawn by monsterSprite() in js/sprites.js.
for (const m of ['slime', 'slimepink', 'bat', 'ghost', 'dragon', 'shroom']) LOOKS[m] = { monster: m };
LOOKS.merchant = { hair: '#ff9a6b', shirt: '#ffd34d', pants: '#8a5a3a', hat: 'feather' };

Object.assign(VOICES, {
  slime:     { gender: 'female', tts: 'af_kore',   pitch: 1.7,  rate: 1.0,  voice: ['Junior', 'Zoe', 'Microsoft Ana'] },
  slimepink: { gender: 'female', tts: 'af_aoede',   pitch: 1.8,  rate: 1.05, voice: ['Junior', 'Zoe', 'Microsoft Ana'] },
  bat:       { gender: 'male',   tts: 'am_puck', lift: 1.1, pitch: 1.5,  rate: 1.1,  voice: ['Oliver', 'Tom', 'Microsoft Brian'] },
  ghost:     { gender: 'female', tts: 'bf_emma', lift: 1.06, pitch: 1.4,  rate: 0.85, voice: ['Zoe', 'Allison', 'Microsoft Ana'] },
  dragon:    { gender: 'male',   tts: 'am_fenrir', lift: 1.12, pitch: 0.9,  rate: 1.0,  voice: ['Oliver', 'Gordon', 'Microsoft Brian'] },
  shroom:    { gender: 'male',   tts: 'am_michael', pitch: 1.3,  rate: 0.95, voice: ['Ralph', 'Fred', 'Aaron'] },
  merchant:  { gender: 'male',   tts: 'am_liam',  pitch: 1.05, rate: 1.0,  voice: ['Aaron', 'Fred', 'Microsoft Christopher'] },
});
Object.assign(PERSONA, {
  slime:     ['Hello! I am a wobbly slime. Catch me if you can!', 'Hi there! Answer my question and I will give you coins!', 'Wiggle, wiggle! Hello, {title} {name}!'],
  slimepink: ['Hello! I am a pink slime. I love sentences!', 'Bounce, bounce! Can you catch me, {title} {name}?', 'Hi! I have a shiny coin for you.'],
  bat:       ['Hello! I am a little bat. I sleep upside down!', 'Oh, hello, {title} {name}! Do you want to play?', 'Flap, flap! Catch me with a right answer!'],
  ghost:     ['Boo! Did I scare you? I am a friendly ghost.', 'Oh! You found me, {title} {name}! I am a little shy.', 'Answer my riddle and I will go poof!'],
  dragon:    ['Roar! I am a baby dragon. My fire is just tiny sparkles!', 'Hello, {title} {name}! I guard the shiny coins.', 'Roar! Can you beat a dragon at words?'],
  shroom:    ['Hello! I am a mushroom. I glow in the dark!', 'Hey there, {title} {name}! I hide under my big hat.', 'Answer me, and I will share my coins.'],
  merchant:  ['Welcome to the Starlight Shop, {title} {name}!', 'Hello, hello! Come and see my treasures!', 'Ah, {title} {name}! Do you have coins today?'],
});

LINES.dungeon = ['Welcome to the Crystal Cave!', 'Wow, the crystals are glowing!', "The cave sparkles! Let's find some monsters."];
// Said by a monster as it goes poof.
LINES.caught = ['You caught me! Here are some shiny coins!', 'Poof! You win! Take these coins!', 'Okay, okay, you got me! Coins for you!', 'Wow, so clever! Here, have my coins!'];
// The shopkeeper.
LINES.shop = ['What would you like today?', 'Pick something lovely!', 'Everything here is extra special!'];
LINES.bought = ['Thank you! It is yours now!', 'A wonderful choice!', 'Here you go! Enjoy it!'];
LINES.poor = ['Oh, you need a few more coins. Catch some monsters in the cave!', 'Almost! Visit the Crystal Cave for more coins.', 'Not enough coins yet. The cave monsters have lots!'];
// Before the cave opens, coins come from the fishing game at the town pond.
LINES.poorPond = ['Oh, you need a few more coins. Go fishing at the town pond!', 'Almost! Catch some fish at the pond for more coins.'];
LINES.soldOut = ['Wow, you have everything already!', 'You bought all my treasures! Amazing!'];

// Shop-only treasures, bought with coins. `price` is in coins; everything
// else in the shop is priced by shopPrice() in js/game.js.
Object.assign(DRESS_COLORS, {
  crystal: { name: '크리스탈', icon: '💠', c: ['#a8f0f0', '#64c4d4', '#e4ffff', '#c8a0ff'], shop: true, price: 10 },
});
Object.assign(HAIR_COLORS, {
  silver: { name: '은빛 머리', icon: '🩶', c: ['#c4c4dc', '#f2f2ff'], shop: true, price: 8 },
});
Object.assign(HEADWEAR, {
  gemband: { name: '보석 머리띠', icon: '💠', shop: true, price: 10 },
});
Object.assign(HAND_ITEMS, {
  lantern: { name: '반딧불 랜턴', icon: '🏮', shop: true, price: 8 },
});

// ---- Fairy Village (level 5) ------------------------------------------------

// The Fairy Village opens from the east end of town's lower road.
const FAIRY_STARS = 15;

// Little fairies that fly along above the hero's head. These only come from
// the Fairy Village (or the shop). `dress`, `wing`, `hair` and `glow` colour the sprite.
const FAIRIES = {
  none:     { name: '없음',       icon: '' },
  pink:     { name: '꽃잎 요정',   icon: '🌸', fairy: true, price: 10, dress: '#ff8fc0', wing: '#ffd8ec', hair: '#ffe08a', glow: '#ffb0d8' },
  lavender: { name: '라벤더 요정', icon: '💜', fairy: true, price: 10, dress: '#b9a0ff', wing: '#e8dcff', hair: '#7a4a2e', glow: '#d0b8ff' },
  sky:      { name: '이슬 요정',   icon: '💧', fairy: true, price: 10, dress: '#8fd3ff', wing: '#e0f6ff', hair: '#ffffff', glow: '#a8e4ff' },
  mint:     { name: '새싹 요정',   icon: '🌱', fairy: true, price: 10, dress: '#8fe8b0', wing: '#e0fff0', hair: '#a8703f', glow: '#b0ffd0' },
  sun:      { name: '햇살 요정',   icon: '🌼', fairy: true, price: 10, dress: '#ffd66b', wing: '#fff6c8', hair: '#ff9a6b', glow: '#fff0a0' },
  star:     { name: '별빛 요정',   icon: '⭐', fairy: true, price: 10, dress: '#6a6ac8', wing: '#d8d8ff', hair: '#ffe066', glow: '#fff6a8' },
};
DEFAULT_OUTFIT.fairy = 'none';
DEFAULT_BOY_OUTFIT.fairy = 'none';

// Fairy dust: every right answer in the Fairy Village gives between these
// two amounts. She feeds it to her fairy friend, who grows (FRIEND_STAGES).
const FAIRY_DUST = [2, 4];

// Fairy folk have wings. `gives` is the little fairy each one offers first.
LOOKS.fairyqueen = { hair: '#fff2b8', shirt: '#e4d8ff', pants: '#c8b0ff', hat: 'crown', gown: true, wings: '#d8c8ff' };
LOOKS.pixie      = { hair: '#ff94c4', shirt: '#ffd0e6', pants: '#ff9ec4', hat: 'flowerband', gown: true, wings: '#ffd8ec' };
LOOKS.dewfairy   = { hair: '#8fd3ff', shirt: '#d4f0ff', pants: '#9ccce8', hat: 'dewdrop', gown: true, wings: '#d4f4ff' };
LOOKS.sprout     = { hair: '#a8703f', shirt: '#b0f0c8', pants: '#5fc48a', hat: 'leaf', wings: '#d8ffe8' };
LOOKS.sunny      = { hair: '#ff9a6b', shirt: '#fff2b8', pants: '#ffd66b', hat: 'petalcap', gown: true, wings: '#fff6c8' };

const FAIRY_NPCS = [
  { name: '요정 여왕', look: 'fairyqueen', gives: 'star', c: 14, r: 3 },
  { name: '꽃잎 요정', look: 'pixie',      gives: 'pink', c: 6,  r: 9 },
  { name: '햇살 요정', look: 'sunny',      gives: 'sun',  c: 19, r: 9 },
  { name: '이슬 요정', look: 'dewfairy',   gives: 'sky',  c: 15, r: 18 },
  { name: '새싹 요정', look: 'sprout',     gives: 'mint', c: 6,  r: 18 },
];

Object.assign(VOICES, {
  fairyqueen: { gender: 'female', tts: 'bf_emma',  pitch: 1.2,  rate: 0.9,  voice: ['Serena', 'Kate', 'Google UK English Female', 'Microsoft Sonia'] },
  pixie:      { gender: 'female', tts: 'af_kore',  pitch: 1.7,  rate: 1.05, voice: ['Zoe', 'Allison', 'Microsoft Ana'] },
  dewfairy:   { gender: 'female', tts: 'af_aoede', pitch: 1.5,  rate: 0.95, voice: ['Samantha', 'Karen', 'Microsoft Aria'] },
  sprout:     { gender: 'female', tts: 'af_sarah', lift: 1.12, pitch: 1.6,  rate: 1.05, voice: ['Tessa', 'Zoe', 'Microsoft Jenny'] },
  sunny:      { gender: 'female', tts: 'af_bella', pitch: 1.55, rate: 1.0,  voice: ['Samantha', 'Google US English', 'Microsoft Aria'] },
});
Object.assign(PERSONA, {
  fairyqueen: ['Welcome to the Fairy Village, {title} {name}!', 'Hello, dear {name}. My fairies love clever spellers.', 'Ah, {title} {name}! Shall we make some word magic?'],
  pixie:      ['Hee hee! Hello, {title} {name}! I live in a tulip.', 'Flutter flutter! I have a word for you to spell!', 'Hi! I just woke up in my flower. Want to play?'],
  dewfairy:   ['Hello, {title} {name}! I sprinkle the morning dew.', 'Splish! I was sitting on a lily pad. Ready to spell?', 'Hi there! Every dewdrop has a letter inside.'],
  sprout:     ['Hi, {title} {name}! I help the little seeds grow.', 'Pop! A new leaf! And a new word for you!', "Hello! Let's grow a word, one letter at a time."],
  sunny:      ['Good morning, {title} {name}! I bring the sunshine.', 'Hello, sunshine! I have a sparkly word for you.', "Yay, a visitor! Let's spell together!"],
});

// Spelling twice, so it comes up most; reading and blending are easier.
QUIZ_TYPES.fairy = ['spell', 'read', 'spell', 'blend'];

LINES.spell = ['Can you spell it?', 'Spell the word you hear!', 'Tap the letters in order.', 'Which letters make this word?', "Let's spell it together!"];
LINES.fairyland = ['Welcome to the Fairy Village!', 'Look, the flowers are giant here!', 'Sparkle, sparkle! The fairies are waiting for you.'];
LINES.newFairy = ['A little fairy wants to fly with you! Shall she come along?', 'This fairy would love to be your friend! Shall she fly with you?', 'Flutter flutter! A fairy friend for you! Shall she come now?'];

// ---- A friend that grows, fishing, first steps and rest (M3) -----------------

// Fairy dust (batteries in the robot edition) fed to her fairy friend makes
// it grow: these are the totals fed for stage 1 (a brighter glow), 2 (a
// crown, or an antenna on a buddy) and 3 (a little dance). At 2 to 4 dust a
// right answer that is about 4, 9 and 16 answers in the Fairy Village.
// Each tap on the friend feeds it one. Nothing ever shrinks or gets hungry.
const FRIEND_STAGES = [10, 25, 45];
// Said by the narrator in her room (js/friend.js). friendGrow has one line
// per stage, in order.
LINES.friendHello = isCaptain() ? ['Tap me! Charge me up with batteries!'] : ['Tap me! Sprinkle some fairy dust on me!'];
LINES.friendEmpty = isCaptain() ? ["Let's get more batteries in Drone Village!"] : ["Let's get more fairy dust in the Fairy Village!"];
LINES.friendGrow = isCaptain()
  ? ['Beep! My lights are brighter!', 'Look! A shiny new antenna!', 'Full power! Watch me dance!']
  : ['Yay! I am glowing brighter!', 'Look! A little crown for me!', 'I am all grown up! Watch me dance!'];

// The fisherman's game at the town pond (js/minigame.js): fish with pictures
// swim by and he says "Catch the fish that starts with /m/!" (the letter's
// pure sound). The robot edition plays it with a magnet crane and boxes.
// `rounds` fish to catch, `fish` in the water each time, `coins` at the end.
const FISHING = { rounds: 5, fish: 4, coins: 3 };
LINES.fishHello = isCaptain() ? ["Let's play with my magnet crane!"] : ["Let's go fishing together!"];
// The pure sound follows, so these never end with a full stop.
LINES.fishAsk = isCaptain() ? ['Pick up the box that starts with', 'Find the box that starts with'] : ['Catch the fish that starts with', 'Find the fish that starts with'];
LINES.fishDone = isCaptain()
  ? ['Great job! Here are some coins for you!', 'All the boxes are loaded! Coins for you!']
  : ['What a great catch! Here are some coins for you!', 'A full bucket! These coins are for you!'];

// A little game in each village (js/village-games.js), from one villager's
// dialog there: `rounds` rounds of the village's own kind of question at
// her tier, `choices` pictures to pick from (four letters to spell), and
// the fishing game's coins at the end. `host` is that villager's look.
//   forest   rhyme  hop on the mushroom that rhymes (hatch the egg)
//   fairy    spell  tap the letters of a word she hears, in order
//   unicorn  blend  hear /c/ /a/ /t/, tap the unicorn (car) with its picture
//                   (at the first steps /s/ or /b/ … E; its end card shows
//                   the letters she knows)
//   dungeon  read   read a word, open the chest (free the crystal) with its picture
const VILLAGE_GAMES = {
  rounds: FISHING.rounds, choices: 3, coins: FISHING.coins,
  forest:  { kind: 'rhyme', host: isCaptain() ? 'dinoTops' : 'gnome' },
  fairy:   { kind: 'spell', host: isCaptain() ? 'droneDoc' : 'pixie' },
  unicorn: { kind: 'blend', host: isCaptain() ? 'mechanic' : 'keeper' },
  dungeon: { kind: 'read', host: isCaptain() ? 'canbot' : 'dragon' },
};
// The narrator says what to do as a village's game starts, and hands over
// the coins at the end. Everything else in them is already recorded.
LINES.miniRhyme = isCaptain() ? ['Hatch the egg that rhymes!'] : ['Hop on the mushroom that rhymes!'];
LINES.miniSpell = ['Tap the letters in order!'];
LINES.miniBlend = ['Listen to the sounds. Tap the picture!'];
LINES.miniRead = ['Read the word. Tap its picture!'];
LINES.miniDone = ['Hooray! Coins for you!'];

// A villager calls her over when nothing has been tapped for a while
// (js/guide.js); recorded in every voice, like the PERSONA lines.
LINES.nudge = ['{title} {name}, over here!'];
// The play-time limit in the parent panel: the town goes to sleep.
LINES.sleep = ['Time to rest! See you tomorrow.'];

// ---- Today's adventures and the treasure chest (M3, js/quest.js) ---------------

// Three little quests a day, one from each group (answering, playing,
// going somewhere), picked among the ones she can do with what is open.
// Each is a picture and `n` dots she fills: stars she earns, rounds she
// wins in the little games (fishing and the villages' games; the quest is
// still called `fish`, as saved quests have it), stickers new to her album,
// fairy dust she earns, letter houses she goes into... counted from what
// she does that day. `stars` keeps a
// quest back until that many stars open its gate; a quest with `place` is
// going through that gate, and shows the place's own picture. `word` is
// said when she taps the picture (only once it is recorded). The robot
// edition has boxes, batteries, workshops and its own villages.
const QUESTS = {
  stars:   { group: 'learn', icon: '⭐', n: 5, word: 'star' },
  gift:    { group: 'learn', icon: '🎁', n: 1, word: 'gift' },
  sticker: { group: 'learn', icon: '📒', n: 2 },
  dust:    { group: 'learn', icon: isCaptain() ? '⚡' : '✨', n: 5, stars: FAIRY_STARS },
  fish:    { group: 'play', icon: isCaptain() ? '🕹️' : '🎮', n: 3 },
  book:    { group: 'play', icon: '📖', n: 1, word: 'book' },
  feed:    { group: 'play', icon: isCaptain() ? '🤖' : '🧚', n: 1, word: isCaptain() ? 'robot' : 'fairy' }, // shows her friend itself
  house:   { group: 'go', icon: isCaptain() ? '🔧' : '🏠', n: 1, word: isCaptain() ? null : 'house' },
  forest:  { group: 'go', place: true, n: 1, stars: FOREST_STARS, word: isCaptain() ? 'dinosaur' : 'tree' },
  fairy:   { group: 'go', place: true, n: 1, stars: FAIRY_STARS, word: isCaptain() ? 'drone' : 'fairy' },
  unicorn: { group: 'go', place: true, n: 1, stars: UNICORN_STARS, word: isCaptain() ? 'car' : 'unicorn' },
  dungeon: { group: 'go', place: true, n: 1, stars: DUNGEON_STARS, word: isCaptain() ? null : 'crystal' },
};
// The chest opens once a day, when all three are done. A day she doesn't
// play changes nothing: no streak, nothing lost.
const QUEST_CHEST = { coins: 5 };
// The narrator: the card opens, all three are done, the chest opens.
LINES.questHello = isCaptain() ? ["Here are today's missions!"] : ["Here are today's adventures!"];
LINES.questReady = ['All done! Open the treasure chest!'];
LINES.questChest = isCaptain() ? ['Mission complete! Coins for you!'] : ['You found the treasure! Coins for you!'];

// ---- Monster Village and the Monster Tower (both editions) -------------------

// The Monster Village opens from the west end of the town's upper road, in
// both editions alike. Its people ask the next step after short vowels:
// long vowels, the ones that say their name (QUIZ_TYPES.monster). In the
// middle stands the Monster Tower, where the monsters she drew herself live
// (KID_MONSTERS in js/kid-monsters.js). Built in js/monster-village.js.
const MONSTER_STARS = 40;
PLACES.monster = '👾 몬스터 마을';
PLACES.tower = '🗼 몬스터 탑';
// Friendly monsters out in the village: the cave monsters' pictures
// (MONSTERS in js/sprites.js, under these looks) with words of their own.
const MONSTER_NPCS = [
  { name: '말랑 슬라임',   look: 'mvSlime',  c: 5,  r: 10 },
  { name: '부끄럼쟁이 유령', look: 'mvGhost',  c: 18, r: 7 },
  { name: '박쥐 길잡이',   look: 'mvBat',    c: 19, r: 17 },
  { name: '버섯 몬스터',   look: 'mvShroom', c: 10, r: 18 },
];
// The monsters in the tower, each one of her drawings.
const TOWER_NPCS = [
  { look: 'kidmon1', c: 2, r: 3 },
  { look: 'kidmon2', c: 6, r: 2 },
  { look: 'kidmon3', c: 9, r: 4 },
  { look: 'kidmon4', c: 3, r: 7 },
  { look: 'kidmon5', c: 8, r: 7 },
];
// Drawn as the cave monster they look like (villagerSprite, js/sprites.js).
Object.assign(LOOKS, { mvSlime: { monster: 'slime' }, mvGhost: { monster: 'ghost' }, mvBat: { monster: 'bat' }, mvShroom: { monster: 'shroom' } });
Object.assign(VOICES, {
  mvSlime:  { gender: 'female', tts: 'af_nova',   lift: 1.1,  pitch: 1.6, rate: 1.0,  voice: ['Junior', 'Zoe', 'Microsoft Ana'] },
  mvGhost:  { gender: 'female', tts: 'bf_lily',   lift: 1.06, pitch: 1.4, rate: 0.9,  voice: ['Zoe', 'Allison', 'Microsoft Ana'] },
  mvBat:    { gender: 'male',   tts: 'am_liam',   lift: 1.1,  pitch: 1.4, rate: 1.05, voice: ['Oliver', 'Tom', 'Microsoft Brian'] },
  mvShroom: { gender: 'male',   tts: 'am_michael', lift: 1.04, pitch: 1.2, rate: 0.95, voice: ['Daniel', 'Fred', 'Microsoft Guy'] },
});
Object.assign(PERSONA, {
  mvSlime:  ['Bloop! Welcome to the Monster Village, {title} {name}!', 'Wiggle, wiggle! Monsters love long vowels!', 'Hello! I am squishy and friendly.'],
  mvGhost:  ['Boo! Hee hee, I am the friendliest ghost here.', 'Oh! Hello, {title} {name}! Do you know the magic e?', 'I float around the Monster Tower all day.'],
  mvBat:    ['Flap, flap! The Monster Tower is right in the middle!', 'Hello, {title} {name}! The monsters in the tower want to meet you.', 'I see everything from up high!'],
  mvShroom: ['Hello! I am a mushroom monster. I grow very slowly.', 'Welcome, {title} {name}! Shall we read some long words?', 'My cap keeps the rain off. Rain, rain!'],
});
// Said as she comes in (the narrator, like the other places).
LINES.monster = ['Welcome to the Monster Village!', 'Rawr! The monsters are happy to see you!'];
LINES.tower = ['Welcome to the Monster Tower!', 'The monsters live up here. Say hello!'];
LINES.openMonster = ['The Monster Village is open!'];

// ---- Village homes -----------------------------------------------------------

// Every home in the villages can be entered. c, r is the home's back corner
// and w its size (w x w tiles); `door` lists the tiles in front of its door.
// Inside, one resident asks that village's questions (HOME_LEVEL by scene).
// Residents use the villages' own looks, so their questions are recorded.
// `theme` picks the room inside (HOME_THEMES in js/world.js) and what the
// resident says when she comes in (HOME_HELLO). A unicorn resident has
// `unicorn` (its colour); `gives` is the fairy friend a fairy offers first.
// The captain files swap in their own homes (captainHomes in js/captain-town.js).
const HOME_LEVEL = { forest: 2, unicorn: 3, fairy: 5 };
const VILLAGE_HOMES = [
  { id: 'mush1', scene: 'forest',  c: 5,  r: 4,  w: 2, door: [[7, 5], [6, 6]],     theme: 'mushroom', color: '#ff6b7f', who: '버섯 아저씨',   look: 'gnome' },
  { id: 'mush2', scene: 'forest',  c: 22, r: 3,  w: 2, door: [[24, 4], [23, 5]],   theme: 'mushroom', color: '#b98cff', who: '꼬마 엘프',     look: 'elf' },
  { id: 'mush3', scene: 'forest',  c: 3,  r: 20, w: 2, door: [[5, 21], [4, 22]],   theme: 'mushroom', color: '#ff8fc0', who: '아기 요정',     look: 'fairy' },
  { id: 'mush4', scene: 'forest',  c: 9,  r: 9,  w: 2, door: [[11, 10], [10, 11]], theme: 'mushroom', color: '#ffb347', who: '숲속 마법사',   look: 'wizard' },
  { id: 'uni1',  scene: 'unicorn', c: 3,  r: 9,  w: 3, door: [[4, 12]],  theme: 'unicorn', color: '#ff9ec4', who: '라벤더 유니콘', look: 'unicorn', unicorn: 'lavender' },
  { id: 'uni2',  scene: 'unicorn', c: 21, r: 7,  w: 3, door: [[22, 10]], theme: 'stable',  color: '#b9a0ff', who: '마구간 언니',   look: 'keeper' },
  { id: 'uni3',  scene: 'unicorn', c: 8,  r: 11, w: 3, door: [[9, 14]],  theme: 'unicorn', color: '#8fd3ff', who: '하늘 유니콘',   look: 'unicorn', unicorn: 'sky' },
  { id: 'uni4',  scene: 'unicorn', c: 20, r: 11, w: 3, door: [[21, 14]], theme: 'unicorn', color: '#ff9ec4', who: '민트 유니콘',   look: 'unicorn', unicorn: 'mint' },
  { id: 'uni5',  scene: 'unicorn', c: 8,  r: 2,  w: 3, door: [[9, 5]],   theme: 'unicorn', color: '#b9a0ff', who: '황금 유니콘',   look: 'unicorn', unicorn: 'gold' },
  { id: 'fae1',  scene: 'fairy',   c: 5,  r: 5,  w: 2, door: [[7, 6], [6, 7]],     theme: 'teacup', color: '#ff9ec4', who: '찻잔 요정',     look: 'pixie' },
  { id: 'fae2',  scene: 'fairy',   c: 15, r: 1,  w: 2, door: [[17, 2], [16, 3]],   theme: 'tulip',  color: '#c8a8ff', who: '튤립 요정',     look: 'sunny', gives: 'lavender' },
  { id: 'fae3',  scene: 'fairy',   c: 20, r: 7,  w: 2, door: [[22, 8], [21, 9]],   theme: 'teacup', color: '#8fc8ff', who: '물방울 요정',   look: 'dewfairy' },
  { id: 'fae4',  scene: 'fairy',   c: 4,  r: 17, w: 2, door: [[5, 19]],            theme: 'tulip',  color: '#ff9ec4', who: '꽃봉오리 요정', look: 'sprout' },
  { id: 'fae5',  scene: 'fairy',   c: 7,  r: 1,  w: 2, door: [[9, 2], [8, 3]],     theme: 'tulip',  color: '#ffd66b', who: '해바라기 요정', look: 'sunny' },
  { id: 'fae6',  scene: 'fairy',   c: 18, r: 14, w: 2, door: [[20, 15], [19, 16]], theme: 'teacup', color: '#8fdcc0', who: '민트 요정',     look: 'pixie' },
];

// What a home's resident says when she comes in, by theme.
const HOME_HELLO = {
  mushroom: ['Welcome to my mushroom house, {title} {name}!', 'Come in, come in! It is cozy under my mushroom.', 'Hello! Mind your head, my roof is a mushroom cap!'],
  unicorn:  ['Neigh! Welcome to my home, {title} {name}!', 'Come in! This is my cozy unicorn home.', 'Hello! Do you like my rainbow carpet?'],
  stable:   ['Welcome to the unicorn stable, {title} {name}!', 'Come in! The unicorns sleep here on soft hay.', 'Hello! I brush the unicorns every morning.'],
  teacup:   ['Welcome to my teacup house, {title} {name}!', 'Hello! Would you like some tea in my teacup house?', 'Come in! Everything in here is round, like a cup.'],
  tulip:    ['Welcome to my tulip house, {title} {name}!', 'Come in! It smells so sweet in here.', 'Hello! My house opens up when the sun comes out.'],
};
// Said by the narrator at the door of a home.
LINES.knock = ['Knock, knock! Hello?', 'Can I come in?', "Let's peek inside!"];

// Tapping a thing says its English word (the narrator). Most of those words
// are recorded already from the word lists above; these are the extra ones.
const PROP_WORDS = ['fountain', 'flower', 'bush', 'plant', 'table', 'harp', 'chest', 'coin', 'crystal', 'unicorn', 'drone', 'gear', 'gate'];
