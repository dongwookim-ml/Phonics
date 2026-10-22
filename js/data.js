// Phonics content and town layout for PixelTown.
// Everything a parent might want to tweak lives in this file.

// Each house in town belongs to one letter.
// `sound` is what the speech engine says for the letter sound. Short
// spellings like "buh" work better than IPA with browser voices.
// `words` start with that sound; `emoji` is the picture shown to the child.
const LETTERS = [
  { letter: 'A', sound: 'ah',   roof: '#e8534a', wall: '#fbe3c4', words: [['apple', '🍎'], ['ant', '🐜'], ['alligator', '🐊']] },
  { letter: 'B', sound: 'buh',  roof: '#4a8fe8', wall: '#fff1d6', words: [['bus', '🚌'], ['ball', '⚽'], ['banana', '🍌'], ['bear', '🐻']] },
  { letter: 'C', sound: 'kuh',  roof: '#f2a33a', wall: '#f6f0ff', words: [['cat', '🐱'], ['car', '🚗'], ['cake', '🎂']] },
  { letter: 'D', sound: 'duh',  roof: '#8a5cd6', wall: '#fff4e0', words: [['dog', '🐶'], ['duck', '🦆'], ['drum', '🥁']] },
  { letter: 'F', sound: 'fff',  roof: '#3bb273', wall: '#fdf6e8', words: [['fish', '🐟'], ['frog', '🐸'], ['fox', '🦊']] },
  { letter: 'M', sound: 'mmm',  roof: '#e85aa6', wall: '#eef7ff', words: [['moon', '🌙'], ['monkey', '🐵'], ['milk', '🥛']] },
  { letter: 'P', sound: 'puh',  roof: '#d6763a', wall: '#f4fff0', words: [['pig', '🐷'], ['pizza', '🍕'], ['penguin', '🐧']] },
  { letter: 'S', sound: 'sss',  roof: '#2fb3c4', wall: '#fff0f0', words: [['sun', '☀️'], ['snake', '🐍'], ['star', '⭐']] },
];

// Optional recorded audio. Set to true and drop files into audio/ as
//   audio/letters/b.mp3  (the letter sound, e.g. "buh")
//   audio/words/bus.mp3  (the whole word)
// Any missing file falls back to the browser's speech voice.
const USE_RECORDINGS = false;

// Stars needed for the big celebration.
const STARS_PER_PARTY = 5;

// Town map, 12 x 12 tiles. Row index = r, column index = c.
//   .  grass       ,  grass with flowers   =  road
//   ~  water       T  tree                 a-z  house for that letter
// A house's door is on its lower-left side, so the tile below it (r + 1)
// must be road for the unicorn to walk to the door.
const TOWN_MAP = [
  '..T..,..~~~.',
  '.,...T.~~~~.',
  'T..,....~~..',
  '.a..b..c..d.',
  '============',
  '.,T...=..T,.',
  '..,...=.,...',
  'T.....=...T.',
  '.f..m.=p..s.',
  '============',
  '.,..T..,..T.',
  'T...,..T...,',
];

const START_TILE = { c: 6, r: 6 };
