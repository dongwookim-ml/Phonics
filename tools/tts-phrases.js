// Lists every line the game can say, with the voice that says it (by its
// Kokoro name), so tools/polly-build.py (Amazon Polly, see
// .github/workflows/polly.yml) can record them. Run: node tools/tts-phrases.js
// Anything missed here still plays, just with the device voice.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
// Content constants read from js/data.js (and, for the robot edition, the
// js/captain-*.js files, which change those tables and add their own).
const NAMES = ['PLAYER', 'TITLES', 'LETTERS', 'LINES', 'PERSONA', 'VOICES', 'TTS_NARRATOR', 'TOWN_NPCS', 'TOWN_HOUSES',
  'FOREST_NPCS', 'UNICORN_NPCS', 'CASTLE_UP_NPCS', 'WORD_FAMILIES', 'RHYMES', 'SENTENCES', 'FOREST_STARS',
  'UNICORN_STARS', 'DUNGEON_NPCS', 'DUNGEON_STARS', 'FAIRY_NPCS', 'FAIRY_STARS', 'CAPTAIN_LINES', 'CAVE_LINES', 'CAPTAIN_HQ_NPCS'];
function loadData(edition) {
  const files = ['js/data.js'];
  if (edition === 'captain') {
    files.push(...fs.readdirSync(path.join(root, 'js')).filter(f => /^captain-.*\.js$/.test(f)).sort().map(f => `js/${f}`));
  }
  const src = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  const store = { 'pixeltown-edition': edition };
  const ctx = { location: { search: '' }, localStorage: { getItem: k => store[k] || null, setItem() {} } };
  return vm.runInNewContext(`${src}
({ ${NAMES.map(n => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ')} })`, ctx);
}

const B = vm.runInNewContext(`${fs.readFileSync(path.join(root, 'js/books.js'), 'utf8')}
({ BOOKS, BOOK_LINES, bookSpoken, bookSentences })`);

const out = new Map();
const add = (voice, text, speed = 0.95) => {
  const t = String(text).trim().replace(/\s+/g, ' ');
  if (t) out.set(`${voice}|${t}`, { voice, text: t, speed });
};

function collect(D) {
  // Every way a line can come out: each title, the default name.
  function fills(text, vars = {}) {
    const res = new Set();
    // The robot edition has just the one title.
    for (const t of D.TITLES.captain.look === 'robot' ? [D.TITLES.captain] : Object.values(D.TITLES)) {
      const own = { name: D.PLAYER.spoken, title: t.en, little: t.en.toLowerCase() };
      res.add(text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : own[k] !== undefined ? own[k] : m)));
    }
    return [...res];
  }
  const lines = (voice, kinds, vars) => {
    for (const k of kinds) for (const l of D.LINES[k]) for (const t of fills(l, vars)) add(voice, t);
  };

  // Who asks what: town and house folk, forest folk, unicorn village folk
  // and the cave monsters, who ask the same sentence questions.
  const town = new Set([...D.TOWN_NPCS.map(n => n.look), ...D.TOWN_HOUSES.map(h => h.look), 'king', 'queen', 'maid',
    ...D.CASTLE_UP_NPCS.map(n => n.look), ...(D.CAPTAIN_HQ_NPCS || []).map(n => n.look)]);
  const forest = new Set(D.FOREST_NPCS.map(n => n.look));
  const unicorn = new Set([...D.UNICORN_NPCS, ...D.DUNGEON_NPCS].map(n => n.look));
  const monsters = new Set(D.DUNGEON_NPCS.map(n => n.look));
  const fairies = new Set(D.FAIRY_NPCS.map(n => n.look));
  const letterWords = D.LETTERS.flatMap(l => l.words.map(([w]) => w));
  const rhymeWords = D.RHYMES.flat().map(([w]) => w);
  const famWords = D.WORD_FAMILIES.flat().map(([w]) => w);
  for (const [look, style] of Object.entries(D.VOICES)) {
    const v = style.tts;
    if (!v) continue;
    for (const l of D.PERSONA[look] || []) for (const t of fills(l)) add(v, t);
    lines(v, ['praise', 'retry', 'later', 'gift', 'yes', 'keep']);
    if (town.has(look)) lines(v, ['ask', 'firstSound', 'findStart', 'rhyme']);
    if (forest.has(look)) lines(v, ['ask2', 'vowel', 'ending', 'read', 'rhyme']);
    if (unicorn.has(look)) {
      lines(v, ['sentence', 'meaning', 'newUnicorn']);
      for (const x of D.SENTENCES) {
        const [before, after] = x.s.split('{}');
        add(v, before + x.w[0] + after, 0.85);
        add(v, before, 0.85);
        if (after.replace(/[.!?\s]/g, '')) add(v, after, 0.85);
      }
      add(v, 'hmm, hmm', 0.85);
    }
    // The word in each question, said by whoever asks it (`voiced` in quiz.js).
    const asks = new Set();
    if (town.has(look)) for (const w of letterWords.concat(rhymeWords)) asks.add(w);
    // "Which one starts with C?", the letter said by its name.
    if (town.has(look)) for (const lead of D.LINES.findStart) for (const l of D.LETTERS) add(v, `${lead} ${l.letter}?`);
    if (forest.has(look)) for (const w of famWords.concat(rhymeWords)) asks.add(w);
    if (fairies.has(look)) for (const w of letterWords.concat(famWords)) if (/^[a-z]{3,4}$/.test(w)) asks.add(w);
    for (const w of asks) add(v, w, 0.85);
    if (monsters.has(look)) lines(v, ['caught'].concat(D.CAVE_LINES ? D.CAVE_LINES.villain : []));
    if (fairies.has(look)) lines(v, ['spell', 'newFairy']);
    if (look === 'merchant') lines(v, ['shop', 'bought', 'poor', 'soldOut']);
  }
  const robots = D.TITLES.captain.look === 'robot';
  // Each letter house's host: "This is the C house. C says kuh." (houseHello in game.js)
  for (const h of D.TOWN_HOUSES) {
    const l = D.LETTERS.find(x => x.letter === h.letter);
    add(D.VOICES[h.look].tts, `This is the ${l.letter} ${robots ? 'workshop' : 'house'}. ${l.letter} says ${l.sound}.`);
  }

  // The narrator: words, letters and lines said by nobody in particular.
  const N = D.TTS_NARRATOR;
  const words = new Set();
  for (const l of D.LETTERS) for (const [w] of l.words) words.add(w);
  for (const f of D.WORD_FAMILIES) for (const [w] of f) words.add(w);
  for (const r of D.RHYMES) for (const [w] of r) words.add(w);
  for (const x of D.SENTENCES) { words.add(x.w[0]); x.alike.forEach(w => words.add(w)); x.other.forEach(([w]) => words.add(w)); }
  for (const w of words) { add(N, w, 0.8); add(N, `${w}!`, 0.8); }
  for (const l of D.LETTERS) for (const [w] of l.words) add(N, `${w} starts with ${l.letter}.`);
  // Letter names: spelling tiles and spelled-out answers, and a wrong letter picked.
  for (const l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') add(N, l, 0.8);
  for (const set of D.RHYMES) for (const [a] of set) for (const [b] of set) if (a !== b) add(N, `${a}, ${b}!`, 0.9);
  lines(N, ['start', 'castle', 'room', 'dressup', 'yes', 'forest', 'unicorn', 'dungeon', 'mount', 'dismount', 'upstairs', 'fairyland']);
  for (const l of D.TOWN_HOUSES) lines(N, ['house'], { letter: l.letter });
  for (const stars of [D.FOREST_STARS, D.UNICORN_STARS, D.DUNGEON_STARS, D.FAIRY_STARS]) lines(N, ['locked'], { stars });
  for (const t of robots ? [D.TITLES.captain] : Object.values(D.TITLES)) add(N, `${t.en} ${D.PLAYER.spoken}!`);

  // The royal library: the librarian's welcome, then the narrator reads each
  // book a sentence at a time and asks its questions (js/library.js).
  for (const l of B.BOOK_LINES.welcome.concat(B.BOOK_LINES.invite)) for (const t of fills(l)) add(D.VOICES.librarian.tts, t);
  for (const k of ['quiz', 'right', 'tryAgain', 'reveal', 'done', 'theEnd']) for (const l of B.BOOK_LINES[k]) for (const t of fills(l)) add(N, t);
  for (const b of B.BOOKS) {
    add(N, `${b.title}.`, 0.85);
    for (const p of b.pages) for (const s of B.bookSentences(p.text)) add(N, s, 0.85);
    for (const q of b.quiz) {
      add(N, q.q);
      for (const o of q.options) add(N, B.bookSpoken(o), 0.85);
    }
  }
}
for (const edition of ['princess', 'captain']) collect(loadData(edition));

// Pure letter sounds: the narrator's "/m/" (a spelling tile, or spliced into
// "M says mmm." by whoever says it) is cut from the narrator's own words, so
// it records every anchor word of tools/letter-sounds.json too.
const N = loadData('princess').TTS_NARRATOR;
const SOUNDS = JSON.parse(fs.readFileSync(path.join(__dirname, 'letter-sounds.json'), 'utf8')).sounds;
for (const [key, s] of Object.entries(SOUNDS)) {
  add(N, `/${key}/`, 0.8);
  for (const [word] of s.anchors) if (!out.has(`${N}|${word}`)) add(N, word, 0.8);
}

const list = [...out.values()];
fs.writeFileSync(path.join(__dirname, 'tts-phrases.json'), JSON.stringify(list, null, 0));
const per = {};
for (const x of list) per[x.voice] = (per[x.voice] || 0) + 1;
console.log(list.length, 'phrases', per);
