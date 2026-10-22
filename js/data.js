// Phonics content, rewards and characters for PixelTown.
// Everything a parent might want to tweak lives in this file.

// The princess's name: `spoken` is read by the English voice, `shown` is on screen.
const PLAYER = { spoken: 'Yuna', shown: '윤아' };

// Letters and words. `sound` is what the speech engine says for the
// letter sound; short spellings like "buh" work better than IPA.
// The first twelve letters each get a house in town (see TOWN_HOUSES).
const LETTERS = [
  { letter: 'A', sound: 'ah',  color: '#ff7a8a', words: [['apple', '🍎'], ['ant', '🐜'], ['alligator', '🐊']] },
  { letter: 'B', sound: 'buh', color: '#6fa8ff', words: [['bus', '🚌'], ['ball', '⚽'], ['banana', '🍌'], ['bear', '🐻']] },
  { letter: 'C', sound: 'kuh', color: '#ffb347', words: [['cat', '🐱'], ['car', '🚗'], ['cake', '🎂']] },
  { letter: 'D', sound: 'duh', color: '#a78bfa', words: [['dog', '🐶'], ['duck', '🦆'], ['drum', '🥁']] },
  { letter: 'F', sound: 'fff', color: '#5cc98a', words: [['fish', '🐟'], ['frog', '🐸'], ['fox', '🦊']] },
  { letter: 'G', sound: 'guh', color: '#f59ec8', words: [['goat', '🐐'], ['grapes', '🍇'], ['gift', '🎁']] },
  { letter: 'H', sound: 'hhh', color: '#ff9a6b', words: [['hat', '🎩'], ['horse', '🐴'], ['house', '🏠']] },
  { letter: 'M', sound: 'mmm', color: '#ff6fb5', words: [['moon', '🌙'], ['monkey', '🐵'], ['milk', '🥛']] },
  { letter: 'N', sound: 'nnn', color: '#7fd4d9', words: [['nose', '👃'], ['nut', '🥜'], ['net', '🥅']] },
  { letter: 'P', sound: 'puh', color: '#e48a5c', words: [['pig', '🐷'], ['pizza', '🍕'], ['penguin', '🐧']] },
  { letter: 'S', sound: 'sss', color: '#4cc3d9', words: [['sun', '☀️'], ['snake', '🐍'], ['star', '⭐']] },
  { letter: 'T', sound: 'tuh', color: '#c39bff', words: [['tiger', '🐯'], ['tree', '🌳'], ['turtle', '🐢']] },
  { letter: 'L', sound: 'lll', color: '#9bd36b', words: [['lion', '🦁'], ['leaf', '🍃'], ['lemon', '🍋']] },
  { letter: 'R', sound: 'rrr', color: '#ff8f8f', words: [['rabbit', '🐰'], ['rainbow', '🌈'], ['ring', '💍']] },
];

// Optional recorded audio. Set to true and drop files into audio/ as
//   audio/letters/b.mp3  (the letter sound, e.g. "buh")
//   audio/words/bus.mp3  (the whole word)
// Any missing file falls back to the browser's speech voice.
const USE_RECORDINGS = false;

// ---- Princess wardrobe ---------------------------------------------------

// [main, shade, light, trim]
const DRESS_COLORS = {
  pink:     { name: '분홍',   icon: '💗', c: ['#ff8fc0', '#e0609a', '#ffc8e0', '#ffd34d'] },
  lavender: { name: '보라',   icon: '💜', c: ['#b9a0ff', '#8f70e0', '#e0d4ff', '#ffd34d'] },
  sky:      { name: '하늘',   icon: '🩵', c: ['#8fd3ff', '#5aa6e0', '#d4f0ff', '#ffffff'] },
  mint:     { name: '민트',   icon: '💚', c: ['#8fe8c4', '#4fbf90', '#d4fff0', '#ffd34d'] },
  gold:     { name: '황금',   icon: '💛', c: ['#ffd66b', '#e0a83a', '#fff2b8', '#ffffff'] },
  snow:     { name: '하얀',   icon: '🤍', c: ['#ffffff', '#d4d4f0', '#ffffff', '#9fd4ff'] },
  rose:     { name: '빨간',   icon: '❤️', c: ['#ff6b7f', '#cf3f57', '#ffb4c0', '#ffd34d'] },
};
const DRESS_SHAPES = {
  ballgown: { name: '풍성한 드레스', icon: '👗' },
  long:     { name: '긴 드레스',     icon: '👘' },
  tutu:     { name: '발레 드레스',   icon: '🩰' },
};
const HEADWEAR = {
  none:    { name: '없음',       icon: '' },
  tiara:   { name: '반짝 티아라', icon: '💎' },
  crown:   { name: '황금 왕관',   icon: '👑' },
  flowers: { name: '꽃 화관',     icon: '🌸' },
  bow:     { name: '큰 리본',     icon: '🎀' },
};
const HAND_ITEMS = {
  none:    { name: '없음',     icon: '' },
  wand:    { name: '별 요술봉', icon: '🪄' },
  bouquet: { name: '꽃다발',   icon: '💐' },
};
const HAIR_COLORS = {
  brown: { name: '갈색 머리', icon: '🤎', c: ['#7a4a2e', '#a8703f'] },
  black: { name: '까만 머리', icon: '🖤', c: ['#2e2433', '#5a4663'] },
  gold:  { name: '금발 머리', icon: '💛', c: ['#f0bb45', '#ffe08a'] },
  pink:  { name: '분홍 머리', icon: '🌷', c: ['#ff94c4', '#ffd0e6'] },
};

const DEFAULT_OUTFIT = { dress: 'pink', shape: 'ballgown', head: 'tiara', hand: 'none', hair: 'brown' };

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
const VOICES = {
  knight: { gender: 'male',   pitch: 0.75, rate: 0.92, voice: ['Daniel', 'Google UK English Male', 'Microsoft Ryan', 'Arthur'] },
  flower: { gender: 'female', pitch: 1.35, rate: 1.0,  voice: ['Samantha', 'Microsoft Aria', 'Google US English'] },
  granny: { gender: 'female', pitch: 1.05, rate: 0.8,  voice: ['Moira', 'Martha', 'Microsoft Hazel', 'Google UK English Female'] },
  fisher: { gender: 'male',   pitch: 0.85, rate: 0.95, voice: ['Fred', 'Rishi', 'Microsoft Guy', 'Aaron'] },
  baker:  { gender: 'male',   pitch: 1.0,  rate: 1.0,  voice: ['Alex', 'Tom', 'Microsoft Andrew', 'Google US English'] },
  kid:    { gender: 'female', pitch: 1.65, rate: 1.08, voice: ['Junior', 'Zoe', 'Microsoft Ana'] },
  bard:   { gender: 'male',   pitch: 1.2,  rate: 1.05, voice: ['Oliver', 'Gordon', 'Microsoft Brian'] },
  farmer: { gender: 'male',   pitch: 0.9,  rate: 0.9,  voice: ['Aaron', 'Fred', 'Microsoft Christopher'] },
  king:   { gender: 'male',   pitch: 0.65, rate: 0.85, voice: ['Arthur', 'Daniel', 'Google UK English Male', 'Microsoft George'] },
  queen:  { gender: 'female', pitch: 1.1,  rate: 0.88, voice: ['Serena', 'Kate', 'Google UK English Female', 'Microsoft Sonia'] },
  maid:   { gender: 'female', pitch: 1.25, rate: 0.98, voice: ['Karen', 'Tessa', 'Microsoft Libby', 'Microsoft Jenny'] },
};

// Things people say. {name} is the princess, {wrong} the word she picked.
const LINES = {
  ask: [
    'Listen carefully.', 'Here is my word.', 'Can you find this one?', 'Which word am I saying?',
    'Ready? Listen!', 'Ears open, here it comes.', 'Find the word I say.',
  ],
  praise: [
    'Wonderful!', 'You got it!', 'Brilliant, Princess!', 'That is exactly right!',
    'Wow, great listening!', 'Perfect!', 'Hooray, well done!', 'You are so clever!',
  ],
  retry: [
    "Oops, that one says {wrong}. Let's listen again.", 'Almost! That word is {wrong}. Try once more.',
    'Hmm, that is {wrong}. Listen carefully.', 'Good try! That says {wrong}. One more time.',
  ],
  gift: [
    'I have a little present for you. Would you like to try it on?', 'This is for you, Princess! Do you want to wear it?',
    'Ta-da! A present! Shall we try it?', 'You earned a gift! Would you like to put it on?',
  ],
  yes: ['You look lovely!', 'So pretty!', 'That suits you perfectly!', 'Beautiful, Princess!', 'Wow, look at you!'],
  keep: ["Okay! I'll put it in your wardrobe.", 'Into the wardrobe it goes!', 'Lovely! You can try it on in your room later.'],
  room: ['Here is your room, Princess!', 'Welcome to your own room!', 'Your wardrobe is waiting for you!'],
  dressup: ["Let's dress up!", 'What shall we wear today?', 'Pick your favourite!'],
  castle: ['Welcome home, Princess!', 'Back to the castle!', 'Home sweet home!'],
  house: ['Knock, knock! The {letter} house!', 'Here is the {letter} house!', "Let's visit the {letter} house!"],
  start: [`Good morning, Princess {name}! Let's visit the town!`, 'What a sunny day, Princess {name}! Shall we go and say hello to everyone?'],
};

// Greetings in each person's own style.
const PERSONA = {
  knight: ['Good day, Princess {name}! I am guarding the castle gate.', 'Halt! Oh, it is you, Princess {name}. Fancy a word game?', 'At your service, Princess {name}!'],
  flower: ['Hi, Princess {name}! Smell these roses. Mmm!', 'Hello! I just picked fresh flowers this morning.', 'Oh, Princess {name}! You look like a flower today.'],
  granny: ['Oh, my dear Princess {name}! How you have grown!', 'Come here, sweetie. Grandma has a word for you.', 'Hello, darling. Would you like a cookie later?'],
  fisher: ['Ahoy, Princess {name}! The fish are jumping today.', "Shh, the fish might hear us! Let's play quietly.", 'Hello there! I caught a big one this morning.'],
  baker:  ['Good morning, Princess {name}! My bread just came out of the oven.', 'Hello! Something smells yummy in here, right?', 'Welcome, welcome! Fresh cakes for everyone!'],
  kid:    ['Hey, Princess {name}! Wanna play a game with me?', 'Yay, you came! I have a super fun word for you.', 'Hi hi hi! Guess what? I have a word!'],
  bard:   ['La la la! Hello, Princess {name}! Let me sing you a word.', 'Greetings, Princess! Listen to my song.', 'Ding ding! A musical word, coming right up!'],
  farmer: ['Howdy, Princess {name}! My carrots are growing so big.', 'Hello there! The cows say hi too. Moo!', 'Morning, Princess! Busy day on the farm.'],
  king:   ['There you are, my little princess! Shall we play a word game?', 'My dear {name}, I have a royal word for you.', 'Ho ho! The king has a puzzle for you.'],
  queen:  ['Hello, my sweet {name}. Did you have fun in town today?', 'My darling princess, let me hear how well you listen.', 'You look wonderful today, {name}.'],
  maid:   ['Good afternoon, Princess {name}. Shall I give you a word?', 'Your Highness! I have tidied your room. Now, a word game?', 'Hello, Princess! Would you like some tea after this?'],
};
