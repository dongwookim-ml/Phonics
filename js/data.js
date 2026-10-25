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
  king:     { ko: '왕',     en: 'King',     icon: '🫅', look: 'boy' },
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
  { letter: 'A', sound: 'ah',  color: '#ff7a8a', words: [['apple', '🍎'], ['ant', '🐜'], ['alligator', '🐊'], ['ambulance', '🚑'], ['avocado', '🥑'], ['anchor', '⚓'], ['astronaut', '🧑‍🚀'], ['arrow', '🏹']] },
  { letter: 'B', sound: 'buh', color: '#6fa8ff', words: [['bus', '🚌'], ['ball', '⚽'], ['banana', '🍌'], ['bear', '🐻'], ['bird', '🐦'], ['book', '📖'], ['boat', '⛵'], ['butterfly', '🦋']] },
  { letter: 'C', sound: 'kuh', color: '#ffb347', words: [['cat', '🐱'], ['car', '🚗'], ['cake', '🎂'], ['cow', '🐮'], ['corn', '🌽'], ['carrot', '🥕'], ['cookie', '🍪'], ['camel', '🐫']] },
  { letter: 'D', sound: 'duh', color: '#a78bfa', words: [['dog', '🐶'], ['duck', '🦆'], ['drum', '🥁'], ['dolphin', '🐬'], ['door', '🚪'], ['dinosaur', '🦕'], ['donut', '🍩'], ['dragon', '🐉']] },
  { letter: 'F', sound: 'fff', color: '#5cc98a', words: [['fish', '🐟'], ['frog', '🐸'], ['fox', '🦊'], ['flag', '🚩'], ['fire', '🔥'], ['foot', '🦶'], ['fork', '🍴'], ['feather', '🪶']] },
  { letter: 'G', sound: 'guh', color: '#f59ec8', words: [['goat', '🐐'], ['grapes', '🍇'], ['gift', '🎁'], ['guitar', '🎸'], ['gorilla', '🦍'], ['ghost', '👻'], ['glasses', '👓'], ['girl', '👧']] },
  { letter: 'H', sound: 'hhh', color: '#ff9a6b', words: [['hat', '🎩'], ['horse', '🐴'], ['house', '🏠'], ['heart', '❤️'], ['hippo', '🦛'], ['hammer', '🔨'], ['honey', '🍯'], ['helicopter', '🚁']] },
  { letter: 'M', sound: 'mmm', color: '#ff6fb5', words: [['moon', '🌙'], ['monkey', '🐵'], ['milk', '🥛'], ['mouse', '🐭'], ['mushroom', '🍄'], ['map', '🗺️'], ['mango', '🥭'], ['mountain', '⛰️']] },
  { letter: 'N', sound: 'nnn', color: '#7fd4d9', words: [['nose', '👃'], ['nut', '🥜'], ['net', '🥅'], ['nine', '9️⃣'], ['noodles', '🍜'], ['notebook', '📓'], ['needle', '🪡'], ['newspaper', '📰']] },
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

// [main, shade, light, trim]
const DRESS_COLORS = {
  pink:     { name: '분홍',   icon: '💗', c: ['#ff8fc0', '#e0609a', '#ffc8e0', '#ffd34d'] },
  lavender: { name: '보라',   icon: '💜', c: ['#b9a0ff', '#8f70e0', '#e0d4ff', '#ffd34d'] },
  sky:      { name: '하늘',   icon: '🩵', c: ['#8fd3ff', '#5aa6e0', '#d4f0ff', '#ffffff'] },
  mint:     { name: '민트',   icon: '💚', c: ['#8fe8c4', '#4fbf90', '#d4fff0', '#ffd34d'] },
  gold:     { name: '황금',   icon: '💛', c: ['#ffd66b', '#e0a83a', '#fff2b8', '#ffffff'] },
  snow:     { name: '하얀',   icon: '🤍', c: ['#ffffff', '#d4d4f0', '#ffffff', '#9fd4ff'] },
  rose:     { name: '빨간',   icon: '❤️', c: ['#ff6b7f', '#cf3f57', '#ffb4c0', '#ffd34d'] },
  night:    { name: '밤하늘', icon: '🌌', c: ['#5a5ab8', '#3a3a86', '#9a9ae8', '#ffd34d'], forest: true },
};
const DRESS_SHAPES = {
  ballgown: { name: '풍성한 드레스', icon: '👗', girl: true },
  long:     { name: '긴 드레스',     icon: '👘', girl: true },
  tutu:     { name: '발레 드레스',   icon: '🩰', girl: true },
  tunic:    { name: '기사 튜닉',     icon: '👕', boy: true },
  coat:     { name: '왕자 코트',     icon: '🧥', boy: true },
  robe:     { name: '임금님 옷',     icon: '🥻', boy: true },
};
const HEADWEAR = {
  none:    { name: '없음',       icon: '' },
  tiara:   { name: '반짝 티아라', icon: '💎', girl: true },
  crown:   { name: '황금 왕관',   icon: '👑' },
  flowers: { name: '꽃 화관',     icon: '🌸', girl: true },
  bow:     { name: '큰 리본',     icon: '🎀', girl: true },
  circlet: { name: '왕자 관',     icon: '💫', boy: true },
  kingcrown: { name: '임금님 왕관', icon: '🫅', boy: true },
  feather: { name: '깃털 모자',   icon: '🪶', boy: true },
};
const HAND_ITEMS = {
  none:    { name: '없음',     icon: '' },
  wand:    { name: '별 요술봉', icon: '🪄', girl: true },
  bouquet: { name: '꽃다발',   icon: '💐', girl: true },
  sword:   { name: '용감한 칼', icon: '🗡️', boy: true },
  sceptre: { name: '황금 홀',   icon: '🔱', boy: true },
  starsword: { name: '별빛 검', icon: '🌟', boy: true, forest: true },
};
// Things worn on the back. These only come from the Starlight Forest.
const BACK_ITEMS = {
  none:  { name: '없음',       icon: '' },
  wings: { name: '요정 날개',   icon: '🧚', forest: true, girl: true },
  cape:  { name: '별빛 망토',   icon: '✨', forest: true },
};
const HAIR_COLORS = {
  brown: { name: '갈색 머리', icon: '🤎', c: ['#7a4a2e', '#a8703f'] },
  black: { name: '까만 머리', icon: '🖤', c: ['#2e2433', '#5a4663'] },
  gold:  { name: '금발 머리', icon: '💛', c: ['#f0bb45', '#ffe08a'] },
  pink:  { name: '분홍 머리', icon: '🌷', c: ['#ff94c4', '#ffd0e6'] },
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
  { name: '꽃집 언니',   look: 'flower', c: 5,  r: 19 },
  { name: '할머니',     look: 'granny', c: 16, r: 18 },
  { name: '낚시 아저씨', look: 'fisher', c: 27, r: 28 },
  { name: '빵집 아저씨', look: 'baker',  c: 12, r: 16 },
  { name: '꼬마 친구',   look: 'kid',    c: 34, r: 19 },
  { name: '음악가',     look: 'bard',   c: 23, r: 21 },
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
  // Said right after the wrong answer itself, so they don't name it. She
  // has to answer someone else's question before trying this one again.
  retry: [
    'Oops, not that one. Go help a friend, then come back and try again!',
    'Almost! Answer someone else first, then come back to me.',
    'Hmm, not quite. Visit another friend and come back later!',
    'Good try! Help someone else, and then we can try again.',
  ],
  // Tapping someone she has to come back to later.
  later: [
    'Help a friend first, then come back to me!', 'Not yet! Answer someone else first.',
    'Come back after you help another friend!',
  ],
  gift: [
    'I have a little present for you. Would you like to try it on?', 'This is for you, {title}! Do you want to wear it?',
    'Ta-da! A present! Shall we try it?', 'You earned a gift! Would you like to put it on?',
  ],
  yes: ['You look lovely!', 'So pretty!', 'That suits you perfectly!', 'Beautiful, {title}!', 'Wow, look at you!'],
  keep: ["Okay! I'll put it in your wardrobe.", 'Into the wardrobe it goes!', 'Lovely! You can try it on in your room later.'],
  room: ['Here is your room, {title}!', 'Welcome to your own room!', 'Your wardrobe is waiting for you!'],
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
  [['dog', '🐶'], ['dot', '⚫'], ['duck', '🦆'], ['dig', '⛏️'], ['doll', '🪆']],
  [['hat', '🎩'], ['hen', '🐔'], ['hug', '🤗'], ['hut', '🛖'], ['ham', '🍖']],
  [['map', '🗺️'], ['mop', '🧹'], ['man', '👨'], ['mug', '☕'], ['moon', '🌙']],
  [['pig', '🐷'], ['pan', '🍳'], ['pen', '🖊️'], ['pin', '📌'], ['pot', '🍲']],
  [['sun', '☀️'], ['sad', '😢'], ['six', '6️⃣'], ['sock', '🧦'], ['sit', '🪑']],
  [['top', '🔝'], ['ten', '🔟'], ['tub', '🛁'], ['tap', '🚰'], ['tent', '⛺']],
  [['rat', '🐀'], ['red', '🟥'], ['run', '🏃'], ['rock', '🪨'], ['ring', '💍']],
  [['log', '🪵'], ['leg', '🦵'], ['lip', '👄'], ['lamp', '💡'], ['lock', '🔒']],
  [['net', '🥅'], ['nut', '🥜'], ['nap', '😴'], ['nose', '👃'], ['nine', '9️⃣']],
  [['fox', '🦊'], ['fish', '🐟'], ['fork', '🍴'], ['foot', '🦶'], ['fun', '🎉']],
  [['web', '🕸️'], ['wet', '💦'], ['win', '🏆'], ['wolf', '🐺'], ['worm', '🪱'], ['watch', '⌚']],
  [['bun', '🍞'], ['bin', '🗑️'], ['bell', '🔔'], ['bone', '🦴'], ['boot', '👢'], ['bee', '🐝']],
  [['cab', '🚕'], ['cut', '✂️'], ['cop', '👮'], ['cake', '🎂'], ['corn', '🌽'], ['cookie', '🍪']],
  [['ram', '🐏'], ['rod', '🎣'], ['rice', '🍚'], ['rose', '🌹'], ['rain', '🌧️'], ['robot', '🤖']],
  [['mom', '👩'], ['mad', '😠'], ['milk', '🥛'], ['mouse', '🐭'], ['mask', '😷'], ['mail', '📬']],
  [['yes', '✅'], ['yam', '🍠'], ['yum', '😋'], ['yarn', '🧶'], ['yawn', '🥱'], ['yellow', '🟨']],
  [['van', '🚐'], ['vest', '🦺'], ['violin', '🎻'], ['volcano', '🌋'], ['vampire', '🧛']],
  [['kid', '🧒'], ['king', '🤴'], ['kite', '🪁'], ['key', '🔑'], ['kiss', '💋'], ['koala', '🐨']],
  [['gas', '⛽'], ['gift', '🎁'], ['goat', '🐐'], ['girl', '👧'], ['ghost', '👻'], ['guitar', '🎸']],
  [['fix', '🔧'], ['fog', '🌫️'], ['fire', '🔥'], ['flag', '🚩'], ['fly', '🪰'], ['feather', '🪶']],
];

const FOREST_NPCS = [
  { name: '꽃요정',     look: 'fairy',  c: 12, r: 6 },
  { name: '숲 엘프',     look: 'elf',    c: 20, r: 9 },
  { name: '별빛 마법사', look: 'wizard', c: 14, r: 15 },
  { name: '버섯 할아버지', look: 'gnome', c: 6, r: 14 },
  { name: '숲지기',     look: 'ranger', c: 22, r: 19 },
  { name: '작은 요정',   look: 'fairy',  c: 9,  r: 22 },
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
const QUIZ_TYPES = {
  town: ['word', 'start', 'rhyme'],
  house: ['word', 'findStart', 'rhyme'],
  forest: ['family', 'vowel', 'ending', 'read', 'rhyme'],
};

// How many recent answers to keep out of new questions.
const RECENT_WORDS = 24;

const RHYMES = [
  [['cat', '🐱'], ['hat', '🎩'], ['bat', '🦇'], ['rat', '🐀']],
  [['dog', '🐶'], ['log', '🪵'], ['frog', '🐸']],
  [['sun', '☀️'], ['bun', '🍞'], ['run', '🏃']],
  [['cake', '🎂'], ['snake', '🐍'], ['lake', '🏞️']],
  [['star', '⭐'], ['car', '🚗'], ['guitar', '🎸']],
  [['moon', '🌙'], ['spoon', '🥄'], ['balloon', '🎈']],
  [['bee', '🐝'], ['tree', '🌳'], ['three', '3️⃣'], ['key', '🔑']],
  [['ring', '💍'], ['king', '🤴'], ['sing', '🎤']],
  [['fox', '🦊'], ['box', '📦'], ['socks', '🧦']],
  [['hen', '🐔'], ['ten', '🔟'], ['pen', '🖊️']],
  [['bug', '🐛'], ['mug', '☕'], ['hug', '🤗']],
  [['goat', '🐐'], ['boat', '⛵'], ['coat', '🧥']],
  [['mouse', '🐭'], ['house', '🏠']],
  [['bed', '🛏️'], ['red', '🟥'], ['sled', '🛷']],
  [['kite', '🪁'], ['light', '💡'], ['night', '🌃']],
  [['mop', '🧹'], ['top', '🔝'], ['shop', '🏪']],
  [['bear', '🐻'], ['pear', '🍐'], ['chair', '🪑']],
  [['fish', '🐟'], ['dish', '🍽️']],
  [['can', '🥫'], ['pan', '🍳'], ['man', '👨'], ['van', '🚐']],
  [['cap', '🧢'], ['map', '🗺️'], ['tap', '🚰'], ['nap', '😴']],
  [['pot', '🍲'], ['dot', '⚫'], ['hot', '🥵']],
  [['net', '🥅'], ['jet', '✈️'], ['wet', '💦']],
  [['pin', '📌'], ['bin', '🗑️'], ['win', '🏆']],
  [['pig', '🐷'], ['dig', '⛏️']],
  [['duck', '🦆'], ['truck', '🚚']],
  [['clock', '🕰️'], ['rock', '🪨'], ['lock', '🔒']],
  [['bell', '🔔'], ['shell', '🐚']],
  [['nose', '👃'], ['rose', '🌹'], ['toes', '🦶']],
  [['train', '🚂'], ['rain', '🌧️']],
  [['rice', '🍚'], ['dice', '🎲'], ['ice', '🧊']],
  [['drum', '🥁'], ['thumb', '👍']],
  [['book', '📖'], ['cook', '🧑‍🍳'], ['hook', '🪝']],
  [['chick', '🐤'], ['brick', '🧱'], ['sick', '🤒']],
  [['crown', '👑'], ['clown', '🤡']],
  [['ship', '🚢'], ['lip', '👄']],
];

// Short sounds for single letters inside a word.
const PART_SOUNDS = {
  a: 'ah', e: 'eh', i: 'ih', o: 'aw', u: 'uh',
  b: 'buh', d: 'duh', g: 'guh', m: 'mmm', n: 'nnn', p: 'puh', t: 'tuh', x: 'ks', k: 'kuh', l: 'lll', s: 'sss', f: 'fff',
};

LINES.firstSound = ['Which letter does it start with?', 'What is the first letter?', 'Which letter comes first?'];
LINES.findStart = ['Which one starts with', 'Which picture starts with', 'What begins with'];
LINES.rhyme = ['Which one rhymes with', 'Find a word that sounds like', 'What rhymes with'];
LINES.vowel = ['Which letter goes in the middle?', 'What letter is missing in the middle?', 'Can you find the middle letter?'];
LINES.ending = ['Which letter goes at the end?', 'What letter is missing at the end?', 'Can you find the last letter?'];
LINES.read = ['Can you read this word?', 'Read the word, then find the picture!', 'Read it all by yourself!'];

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
  { s: 'I drink {} in the morning.',      w: ['milk', '🥛'],    alike: ['mix', 'silk'],     other: [['rock', '🪨'], ['sock', '🧦']] },
  { s: 'The {} sings in the tree.',       w: ['bird', '🐦'],    alike: ['bed', 'bun'],      other: [['fish', '🐟'], ['car', '🚗']] },
  { s: 'I eat a red {}.',                 w: ['apple', '🍎'],   alike: ['ant', 'ax'],       other: [['chair', '🪑'], ['shoe', '👟']] },
  { s: 'The {} hops and says ribbit.',    w: ['frog', '🐸'],    alike: ['fog', 'fox'],      other: [['cow', '🐄'], ['fish', '🐟']] },
  { s: 'Please open the {}.',             w: ['door', '🚪'],    alike: ['dog', 'duck'],     other: [['sun', '☀️'], ['moon', '🌙']] },
  { s: 'My birthday {} is sweet.',        w: ['cake', '🎂'],    alike: ['cape', 'lake'],    other: [['rock', '🪨'], ['frog', '🐸']] },
  { s: 'I ride the {} to school.',        w: ['bus', '🚌'],     alike: ['bun', 'bug'],      other: [['bed', '🛏️'], ['apple', '🍎']] },
  { s: 'A unicorn has a shiny {}.',       w: ['horn', '🦄'],    alike: ['corn', 'horse'],   other: [['bus', '🚌'], ['fish', '🐟']] },
  { s: 'I brush my {} at night.',         w: ['teeth', '🦷'],   alike: ['tea', 'tent'],     other: [['car', '🚗'], ['tree', '🌳']] },
  { s: 'I hug my teddy {}.',              w: ['bear', '🧸'],    alike: ['pear', 'bed'],     other: [['bus', '🚌'], ['rock', '🪨']] },
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
  { s: 'The {} eats a carrot.',           w: ['rabbit', '🐰'],  alike: ['ribbon', 'robot'], other: [['chair', '🪑'], ['rock', '🪨']] },
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
  { s: 'I eat {} with lots of cheese.',   w: ['pizza', '🍕'],   alike: ['pillow', 'piano'], other: [['rock', '🪨'], ['shoe', '👟']] },
  { s: 'The {} is orange and crunchy.',   w: ['carrot', '🥕'],  alike: ['parrot', 'carpet'], other: [['bed', '🛏️'], ['door', '🚪']] },
  { s: 'I crack an {} for breakfast.',    w: ['egg', '🥚'],     alike: ['leg', 'peg'],      other: [['car', '🚗'], ['tree', '🌳']] },
  // Body
  { s: 'I smell a flower with my {}.',    w: ['nose', '👃'],    alike: ['toes', 'note'],    other: [['cup', '🥤'], ['bus', '🚌']] },
  { s: 'I hear music with my {}.',        w: ['ears', '👂'],    alike: ['tears', 'eel'],    other: [['cake', '🎂'], ['car', '🚗']] },
  { s: 'I clap my {} when I am happy.',   w: ['hands', '👏'],   alike: ['sand', 'hats'],    other: [['moon', '🌙'], ['milk', '🥛']] },
  { s: 'I close my {} to sleep.',         w: ['eyes', '👀'],    alike: ['ice', 'pies'],     other: [['shoe', '👟'], ['cake', '🎂']] },
  { s: 'I kick the ball with my {}.',     w: ['foot', '🦶'],    alike: ['food', 'book'],    other: [['moon', '🌙'], ['cake', '🎂']] },
  // Home
  { s: 'I sit on my {} to eat.',          w: ['chair', '🪑'],   alike: ['hair', 'chain'],   other: [['sun', '☀️'], ['milk', '🥛']] },
  { s: 'I take a bath in the {}.',        w: ['tub', '🛁'],     alike: ['cub', 'tug'],      other: [['tree', '🌳'], ['car', '🚗']] },
  { s: 'I read my {} at bedtime.',        w: ['book', '📖'],    alike: ['hook', 'cook'],    other: [['cow', '🐄'], ['apple', '🍎']] },
  { s: 'I wash my hands with {}.',        w: ['soap', '🧼'],    alike: ['soup', 'rope'],    other: [['car', '🚗'], ['frog', '🐸']] },
  { s: 'Grandma calls me on the {}.',     w: ['phone', '📱'],   alike: ['bone', 'foam'],    other: [['egg', '🥚'], ['bird', '🐦']] },
  { s: 'Turn on the {} so I can see.',    w: ['light', '💡'],   alike: ['kite', 'night'],   other: [['pig', '🐷'], ['cake', '🎂']] },
  { s: 'I look out the {} at the rain.',  w: ['window', '🪟'],  alike: ['wind', 'willow'],  other: [['fish', '🐟'], ['milk', '🥛']] },
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
  { s: 'I carry my books in my {}.',      w: ['bag', '🎒'],     alike: ['bat', 'wag'],      other: [['sun', '☀️'], ['frog', '🐸']] },
  { s: 'I write my name with my {}.',     w: ['pencil', '✏️'],  alike: ['penguin', 'pebble'], other: [['cow', '🐄'], ['egg', '🥚']] },
  { s: 'I bounce the {} on the floor.',   w: ['ball', '⚽'],    alike: ['tall', 'fall'],    other: [['moon', '🌙'], ['cloud', '☁️']] },
  { s: 'I fly my {} on a windy day.',     w: ['kite', '🪁'],    alike: ['bite', 'kit'],     other: [['egg', '🥚'], ['chair', '🪑']] },
  { s: 'The {} goes choo choo.',          w: ['train', '🚂'],   alike: ['rain', 'tray'],    other: [['egg', '🥚'], ['tree', '🌳']] },
  { s: 'I blow out the {} on my cake.',   w: ['candles', '🕯️'], alike: ['handles', 'sandals'], other: [['frog', '🐸'], ['bus', '🚌']] },
  // Princesses and fairy tales
  { s: 'The princess wears a gold {}.',   w: ['crown', '👑'],   alike: ['clown', 'brown'],  other: [['cow', '🐄'], ['bus', '🚌']] },
  { s: 'The king lives in a big {}.',     w: ['castle', '🏰'],  alike: ['tassel', 'cattle'], other: [['cup', '🥤'], ['sock', '🧦']] },
  { s: 'The fairy waves her magic {}.',   w: ['wand', '🪄'],    alike: ['pond', 'want'],    other: [['pig', '🐷'], ['cake', '🎂']] },
  { s: 'The {} breathes fire.',           w: ['dragon', '🐉'],  alike: ['wagon', 'drum'],   other: [['milk', '🥛'], ['sock', '🧦']] },
  { s: 'The prince rides a white {}.',    w: ['horse', '🐴'],   alike: ['house', 'hose'],   other: [['cake', '🎂'], ['spoon', '🥄']] },
  { s: 'The witch flies on her {}.',      w: ['broom', '🧹'],   alike: ['room', 'bloom'],   other: [['fish', '🐟'], ['egg', '🥚']] },
  { s: 'Cinderella lost her glass {}.',   w: ['shoe', '👠'],    alike: ['shop', 'two'],     other: [['cow', '🐄'], ['tree', '🌳']] },
  { s: 'The {} swims with her fish tail.', w: ['mermaid', '🧜'], alike: ['mirror', 'merry'], other: [['bus', '🚌'], ['chair', '🪑']] },
];

QUIZ_TYPES.unicorn = ['sentence', 'meaning'];

LINES.sentence = ['Listen to my sentence. Which word is missing?', 'Here is a sentence. Find the missing word!', 'Listen closely to the whole sentence.'];
LINES.meaning = ['Which word makes sense?', 'Fill in the blank! What fits best?', 'Hmm, what word goes here?'];
LINES.unicorn = ['Welcome to the Unicorn Village!', 'Look, rainbows everywhere!', 'Neigh! The unicorns are happy to see you!'];
LINES.mount = ['Giddy up!', "Let's go, unicorn!", 'Wheee! Off we go!'];
LINES.dismount = ['Wait here, unicorn. I will be right back!', 'Stay here, unicorn!', 'Unicorns wait outside. See you soon!'];
LINES.newUnicorn = ['I want to be your friend! Will you ride me?', 'A unicorn for you! Do you want to ride now?', 'Neigh! Shall we go for a ride?'];

LOOKS.keeper = { hair: '#c04a4a', shirt: '#ff9ec4', pants: '#8fd3ff', hat: 'straw' };

// Unicorns that talk have `unicorn` (their colour) instead of a villager look.
const UNICORN_NPCS = [
  { name: '무지개 유니콘', look: 'unicorn', unicorn: 'rainbow', c: 17, r: 8 },
  { name: '목장 언니',     look: 'keeper', c: 9, r: 10 },
  { name: '솜사탕 유니콘', look: 'unicorn', unicorn: 'pink', c: 21, r: 14 },
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

// Spelling questions use short words whose letters each say their own sound
// (c-a-t, f-r-o-g), taken from the word lists above so their recordings
// exist. She picks from at least this many letter tiles.
const SPELL_TILES = 6;

// Fairy dust: every right answer in the Fairy Village gives between these
// two amounts. What it buys is still to be decided; for now it is saved.
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

QUIZ_TYPES.fairy = ['spell'];

LINES.spell = ['Can you spell it?', 'Spell the word you hear!', 'Tap the letters in order.', 'Which letters make this word?', "Let's spell it together!"];
LINES.fairyland = ['Welcome to the Fairy Village!', 'Look, the flowers are giant here!', 'Sparkle, sparkle! The fairies are waiting for you.'];
LINES.newFairy = ['A little fairy wants to fly with you! Shall she come along?', 'This fairy would love to be your friend! Shall she fly with you?', 'Flutter flutter! A fairy friend for you! Shall she come now?'];
