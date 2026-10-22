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
