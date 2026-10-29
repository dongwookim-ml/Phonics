// The books she reads herself (DECODABLE_BOOKS in js/books.js), so a later
// edit can't slip in a word she can't read yet:
//  - every word of every page and title is one of the SIGHT_WORDS (at most
//    12) or one decodeLevel says she can sound out at the book's level, and
//    each book has a word of its own level;
//  - decodeLevel agrees with the word bank in js/data.js: the CVC_A1 and
//    CVC_A2 words are level 1 (short a) or 2, the one-syllable DIGRAPH words
//    3 (4 with a blend: clock), CCVC, CVCC and one-syllable LONG words 4, and
//    words of two syllables can't be read at any level; a word's letters
//    split the way the bank splits them (f-i-sh), and tricky words (was,
//    put, ball, cold) never count as readable, nor words she would sound
//    out wrong: an s that says /z/ after a vowel (has, his, as) or a voiced
//    th (then, this, that, them), so a book has them only as SIGHT_WORDS;
//  - every sound a word is made of is one the game teaches as a pure sound
//    cut from the narrator's words (tools/letter-sounds.json), and every
//    letter pair it knows is one the spelling tiles know (PART_SOUNDS) or a
//    doubled letter (ll, ss), which says its one letter's sound, as in
//    js/quiz.js;
//  - 4 to 6 pages of one sentence and a picture, its emoji (and the
//    cover's) ones an older iPad has (Unicode 13 or before); levels 1 to 4
//    in order, the first book at level 1; ids unique.
// Run: node tools/check-books.js  (no browser; tools/quiz-test.js runs it too)

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const LEVELS = 4;
// Words that look regular but aren't (or are): what decodeLevel must say.
const TRICKY = { was: 0, want: 0, wash: 0, swan: 0, put: 0, push: 0, full: 0, of: 0, from: 0, son: 0, ball: 0, talk: 0, salt: 0,
  half: 0, cold: 0, bolt: 0, most: 0, kind: 0, wild: 0, roll: 0, cent: 0, city: 0, gem: 0, said: 0, you: 0, car: 0, cake: 0,
  wag: 1, swam: 4, doll: 3, cost: 4, get: 2, gift: 4, wind: 4, fox: 2, yes: 2, cats: 2, bells: 3, dresses: 0,
  // An s that says /z/ after a vowel, or a voiced th; the s in gas and bus
  // and the th in bath say their sounds.
  has: 0, his: 0, as: 0, is: 0, then: 0, this: 0, that: 0, them: 0, than: 0, gas: 1, bus: 2, us: 2, bath: 3 };
// Emoji newer than Unicode 13, which an older iPad shows as an empty box
// (🫧 🛞 🩵 🥹 ...).
const NEW_EMOJI = /[\u{1F6DC}-\u{1F6DF}\u{1F7F0}\u{1F979}\u{1F9CC}\u{1FA75}-\u{1FA77}\u{1FA7B}-\u{1FA7F}\u{1FA87}-\u{1FA8F}\u{1FAA9}-\u{1FAAF}\u{1FAB7}-\u{1FABF}\u{1FAC3}-\u{1FACF}\u{1FAD7}-\u{1FAFF}]/u;

function load() {
  const src = ['js/locales/ko.js', 'js/locales/en.js', 'js/i18n.js', 'js/data.js', 'js/books.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  const ctx = { location: { search: '' }, localStorage: { getItem: () => null, setItem() {} } };
  return vm.runInNewContext(`${src}
({ DECODABLE_BOOKS, SIGHT_WORDS, DECODE, decodeLevel, decodeParts, decodeSounds, decodeTokens, bookSentences,
   PART_SOUNDS, CVC_A1, CVC_A2, CCVC, CVCC, LONG, DIGRAPH })`, ctx);
}

function check() {
  const D = load();
  const problems = [];
  const say = msg => problems.push(msg);
  const syllables = w => (w.match(/[aeiou]+/g) || []).length;
  const vowel = p => /^[aeiou]$/.test(p);

  // ---- The rule against the word bank ----
  const expect = [];
  for (const [w] of D.CVC_A1.concat(D.CVC_A2)) expect.push([w, w.includes('a') ? 1 : 2, 'CVC']);
  for (const [w] of D.CCVC.concat(D.CVCC)) expect.push([w, 4, 'CCVC/CVCC']);
  for (const [w, , , parts] of D.LONG) expect.push([w, parts ? 0 : 4, 'LONG']);
  for (const [w, , , parts] of D.DIGRAPH) {
    // A blend: two sounds side by side that aren't vowels (c-l-o-ck).
    const blend = parts.some((p, i) => i && !vowel(p) && !vowel(parts[i - 1]));
    expect.push([w, syllables(w) > 1 ? 0 : blend ? 4 : 3, 'DIGRAPH']);
    if (decodeJoin(D.decodeParts(w)) !== parts.join('-')) say(`decodeParts("${w}") is ${decodeJoin(D.decodeParts(w))}, the bank says ${parts.join('-')}`);
  }
  for (const [w, lv, from] of expect) if (D.decodeLevel(w) !== lv) say(`decodeLevel("${w}") is ${D.decodeLevel(w)}, ${from} says ${lv}`);
  for (const [w, lv] of Object.entries(TRICKY)) if (D.decodeLevel(w) !== lv) say(`decodeLevel("${w}") is ${D.decodeLevel(w)}, should be ${lv}`);
  for (const p of D.DECODE.pairs) if (!D.PART_SOUNDS[p] && p[0] !== p[1]) say(`letter pair "${p}" has no sound in PART_SOUNDS`);

  // ---- The books ----
  const pure = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, 'letter-sounds.json'), 'utf8')).sounds));
  const sight = new Set(D.SIGHT_WORDS);
  if (D.SIGHT_WORDS.length > 12) say(`${D.SIGHT_WORDS.length} sight words, keep it to 12`);
  if (sight.size !== D.SIGHT_WORDS.length) say('a sight word is listed twice');
  const ids = new Set();
  let last = 1;
  if (!D.DECODABLE_BOOKS.length || D.DECODABLE_BOOKS[0].level !== 1) say('the first book is not level 1');
  for (const b of D.DECODABLE_BOOKS) {
    const where = `${b.id || '?'} (level ${b.level})`;
    if (!b.id || ids.has(b.id)) say(`${where}: missing or repeated id`);
    ids.add(b.id);
    if (!Number.isInteger(b.level) || b.level < 1 || b.level > LEVELS) say(`${where}: level must be 1 to ${LEVELS}`);
    if (b.level < last) say(`${where}: comes after a level ${last} book`);
    last = b.level;
    if (!b.title || !b.label || !b.cover || !/^#[0-9a-f]{6}$/i.test(b.color || '')) say(`${where}: needs a title, label, cover and color`);
    if (NEW_EMOJI.test(b.cover || '')) say(`${where}: the cover ${b.cover} is newer than Unicode 13`);
    if (b.pages.length < 4 || b.pages.length > 6) say(`${where}: ${b.pages.length} pages, should be 4 to 6`);
    let top = 0;
    for (const [i, p] of [{ text: b.title, title: true }].concat(b.pages).entries()) {
      const at = p.title ? `${where} title` : `${where} page ${i}`;
      if (!p.title) {
        if (D.bookSentences(p.text).length !== 1) say(`${at}: "${p.text}" is not one sentence`);
        if (!p.pic || /[A-Za-z0-9]/.test(p.pic)) say(`${at}: needs an emoji picture`);
        else if (NEW_EMOJI.test(p.pic)) say(`${at}: the picture ${p.pic} is newer than Unicode 13`);
      }
      for (const t of D.decodeTokens(p.text)) {
        if (!/^[A-Za-z]+$/.test(t.word)) { say(`${at}: "${t.text}" is not a plain word`); continue; }
        if (t.sight) continue;
        if (!t.level) say(`${at}: "${t.word}" can't be sounded out and is not a sight word`);
        else if (t.level > b.level) say(`${at}: "${t.word}" is level ${t.level}`);
        top = Math.max(top, t.level);
        for (const s of D.decodeSounds(t.word)) if (!pure.has(s)) say(`${at}: "${t.word}" needs /${s}/, which has no pure sound`);
      }
    }
    if (top < b.level) say(`${where}: no word of its own level (the hardest is ${top})`);
  }
  for (let lv = 1; lv <= LEVELS; lv++) if (!D.DECODABLE_BOOKS.some(b => b.level === lv)) say(`no book at level ${lv}`);
  return problems;
}
const decodeJoin = parts => [...parts].join('-');

if (require.main === module) {
  const problems = check();
  for (const p of problems) console.log(`FAIL ${p}`);
  console.log(problems.length ? `${problems.length} problem(s)` : 'books OK');
  process.exit(problems.length ? 1 : 0);
}

module.exports = { check, NEW_EMOJI };
