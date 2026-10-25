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
  'FOREST_NPCS', 'UNICORN_NPCS', 'CASTLE_UP_NPCS', 'WORD_FAMILIES', 'RHYME_SETS', 'SENTENCES', 'FOREST_STARS',
  'UNICORN_STARS', 'DUNGEON_NPCS', 'DUNGEON_STARS', 'FAIRY_NPCS', 'FAIRY_STARS', 'CAPTAIN_LINES', 'CAVE_LINES', 'CAPTAIN_HQ_NPCS',
  'VILLAGE_HOMES', 'HOME_HELLO', 'PROP_WORDS', 'PART_SOUNDS', 'QUIZ_TYPES', 'SENTENCES_L1', 'SENTENCES_L2', 'CVC_A1', 'CVC_A2', 'CCVC', 'CVCC', 'LONG', 'DIGRAPH', 'MINIMAL_SETS'];
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
({ BOOKS, BOOK_LINES, bookSpoken, bookSentences, DECODABLE_BOOKS, decodeTokens })`);

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
  // The robot's part show-off lines (LINES.partShow: by slot, then by part),
  // said by whoever gave the part, or by the narrator at the workbench.
  const partShow = [];
  const flat = v => (typeof v === 'string' ? partShow.push(v) : Object.values(v).forEach(flat));
  if (D.LINES.partShow) flat(D.LINES.partShow);

  // Who asks what: each place's people ask that place's kinds of question
  // (QUIZ_TYPES); the cave monsters ask the Unicorn Village's.
  const town = new Set([...D.TOWN_NPCS.map(n => n.look), ...D.TOWN_HOUSES.map(h => h.look), 'king', 'queen', 'maid',
    ...D.CASTLE_UP_NPCS.map(n => n.look), ...(D.CAPTAIN_HQ_NPCS || []).map(n => n.look)]);
  const forest = new Set(D.FOREST_NPCS.map(n => n.look));
  const unicorn = new Set([...D.UNICORN_NPCS, ...D.DUNGEON_NPCS].map(n => n.look));
  const monsters = new Set(D.DUNGEON_NPCS.map(n => n.look));
  const fairies = new Set(D.FAIRY_NPCS.map(n => n.look));
  const kindsOf = look => new Set([].concat(town.has(look) ? D.QUIZ_TYPES.town.concat(D.QUIZ_TYPES.house) : [],
    forest.has(look) ? D.QUIZ_TYPES.forest : [], unicorn.has(look) ? D.QUIZ_TYPES.unicorn : [], fairies.has(look) ? D.QUIZ_TYPES.fairy : []));
  const first = list => list.map(([w]) => w);
  const cvc = first(D.CVC_A1.concat(D.CVC_A2));
  const sentences = D.SENTENCES.concat(D.SENTENCES_L1, D.SENTENCES_L2);
  // The lines each kind of question says in the asker's voice (js/quiz.js),
  // and the words it says in that voice (`voiced`).
  const kindLines = { word: ['ask'], start: ['firstSound'], findStart: [], rhyme: ['rhyme', 'rhymeEnd'], family: ['ask2'], vowel: ['vowel'],
    ending: ['ending'], read: ['read'], blend: ['blend'], sentence: ['sentence'], meaning: ['meaning', 'silly'], spell: ['spell'] };
  const kindWords = {
    word: D.LETTERS.flatMap(l => first(l.words)),
    start: D.LETTERS.flatMap(l => first(l.words)),
    rhyme: D.RHYME_SETS.flatMap(r => first(r.set)),
    family: cvc.concat(first(D.WORD_FAMILIES.flat()), D.MINIMAL_SETS.flat()),
    vowel: cvc,
    ending: cvc,
    spell: cvc.concat(first(D.CCVC), first(D.CVCC), first(D.LONG), first(D.DIGRAPH)),
  };
  for (const [look, style] of Object.entries(D.VOICES)) {
    const v = style.tts;
    if (!v) continue;
    for (const l of D.PERSONA[look] || []) for (const t of fills(l)) add(v, t);
    // Calling her over when nothing has been tapped for a while (js/guide.js).
    for (const l of D.LINES.nudge || []) for (const t of fills(l)) add(v, t);
    // Praise, the hints after a miss and the answer shown after a second one
    // (choose in js/game.js), and the present.
    lines(v, ['praise', 'listen', 'showMe', 'tapIt', 'soon', 'again', 'next', 'gift', 'yes', 'keep']);
    // A cheer instead of the praise for answers right in a row (js/album.js).
    lines(v, ['combo', 'combo5', 'comboMore']);
    const kinds = kindsOf(look);
    const asks = new Set();
    for (const k of kinds) {
      lines(v, kindLines[k]);
      for (const w of kindWords[k] || []) asks.add(w);
    }
    // The word in each question, said by whoever asks it (`voiced` in quiz.js).
    for (const w of asks) add(v, w, 0.85);
    // "Which one starts with C?", the letter said by its name (letter houses).
    if (kinds.has('findStart')) for (const lead of D.LINES.findStart) for (const h of D.TOWN_HOUSES) add(v, `${lead} ${h.letter}?`);
    if (kinds.has('sentence') || kinds.has('meaning')) {
      for (const x of sentences) {
        const [before, after] = x.s.split('{}');
        add(v, before + x.w[0] + after, 0.85);
        add(v, before, 0.85);
        if (after.replace(/[.!?\s]/g, '')) add(v, after, 0.85);
      }
      add(v, 'hmm, hmm', 0.85);
    }
    if (unicorn.has(look)) lines(v, ['newUnicorn']);
    if (monsters.has(look)) lines(v, ['caught'].concat(D.CAVE_LINES ? D.CAVE_LINES.villain : []));
    if (fairies.has(look)) lines(v, ['newFairy']);
    if (look === 'merchant') lines(v, ['shop', 'bought', 'poor', 'poorPond', 'soldOut']);
    // Anyone who gives presents (not the cave villains), and the shop.
    const gives = town.has(look) || forest.has(look) || fairies.has(look) || D.UNICORN_NPCS.some(n => n.look === look) || look === 'merchant';
    if (gives) for (const t of partShow) add(v, t);
  }
  const robots = D.TITLES.captain.look === 'robot';
  // Village home residents say hello as she comes in (enterDoor in game.js).
  // Their questions are their village's, recorded above by their look.
  for (const h of D.VILLAGE_HOMES) for (const l of D.HOME_HELLO[h.theme]) for (const t of fills(l)) add(D.VOICES[h.look].tts, t);
  // Each letter house's host: "This is the C house. C says kuh." (houseHello in game.js)
  for (const h of D.TOWN_HOUSES) {
    const l = D.LETTERS.find(x => x.letter === h.letter);
    add(D.VOICES[h.look].tts, `This is the ${l.letter} ${robots ? 'workshop' : 'house'}. ${l.letter} says ${l.sound}.`);
  }
  // The fisherman's game at the pond (js/minigame.js): his lines; the pure
  // sounds and "moon starts with M." are the narrator's, recorded below.
  const fisher = D.TOWN_NPCS.find(n => /fisher/.test(n.look));
  if (fisher && D.LINES.fishAsk) lines(D.VOICES[fisher.look].tts, ['fishHello', 'fishAsk', 'fishDone']);

  // The narrator: words, letters and lines said by nobody in particular.
  const N = D.TTS_NARRATOR;
  const words = new Set();
  for (const l of D.LETTERS) for (const [w] of l.words) words.add(w);
  for (const f of D.WORD_FAMILIES) for (const [w] of f) words.add(w);
  for (const r of D.RHYME_SETS) for (const [w] of r.set) words.add(w);
  for (const list of [D.CVC_A1, D.CVC_A2, D.CCVC, D.CVCC, D.LONG, D.DIGRAPH]) for (const [w] of list) words.add(w);
  for (const x of sentences) { words.add(x.w[0]); x.alike.forEach(w => words.add(w)); x.other.forEach(([w]) => words.add(w)); }
  // Words said when she taps a thing on the map (js/touch.js).
  for (const w of D.PROP_WORDS) words.add(w);
  for (const w of words) { add(N, w, 0.8); add(N, `${w}!`, 0.8); }
  for (const l of D.LETTERS) for (const [w] of l.words) add(N, `${w} starts with ${l.letter}.`);
  // Letter names: spelled-out answers.
  for (const l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') add(N, l, 0.8);
  // Letter sounds (js/quiz.js): "/c/" is the pure sound on its own, for
  // spelling tiles and sounding a word out; "C says kuh." after a wrong letter.
  const soundOf = l => D.PART_SOUNDS[l] || (D.LETTERS.find(x => x.letter === l.toUpperCase()) || {}).sound;
  for (const l of 'abcdefghijklmnopqrstuvwxyz') {
    const s = soundOf(l);
    if (!s) continue;
    add(N, `/${l}/`, 0.8);
    add(N, `${l.toUpperCase()} says ${s}.`);
  }
  // Letter pairs with one sound (sh, ck...) on spelling tiles.
  for (const g of Object.keys(D.PART_SOUNDS)) if (g.length > 1) add(N, `/${g}/`, 0.8);
  lines(N, ['levelUp'].concat((D.CAVE_LINES && D.CAVE_LINES.narrator) || []));
  for (const r of D.RHYME_SETS) for (const [a] of r.set) for (const [b] of r.set) if (a !== b) add(N, `${a}, ${b}!`, 0.9);
  lines(N, ['start', 'castle', 'room', 'dressup', 'yes', 'forest', 'unicorn', 'dungeon', 'mount', 'dismount', 'upstairs', 'fairyland', 'knock']);
  // Her growing fairy friend (js/friend.js) and the town going to sleep (js/guide.js).
  lines(N, ['friendHello', 'friendEmpty', 'friendGrow', 'sleep'].filter(k => D.LINES[k]));
  // Today's adventures and the treasure chest (js/quest.js). Tapping a
  // quest's picture says its word, which is recorded with the words below.
  lines(N, ['questHello', 'questReady', 'questChest'].filter(k => D.LINES[k]));
  for (const t of partShow) add(N, t);
  for (const l of D.TOWN_HOUSES) lines(N, ['house'], { letter: l.letter });
  // Gates opening, medals and the sticker album (js/album.js). A sticker says
  // what its word starts with, unless it starts with two letters that make
  // one sound (chair, ship, three) or one that sounds like another (one).
  lines(N, ['openForest', 'openFairy', 'openUnicorn', 'openDungeon', 'medalVillage', 'album']);
  for (const l of D.TOWN_HOUSES) lines(N, ['medalHouse'], { letter: l.letter });
  const stickers = [...D.WORD_FAMILIES.flat(), ...D.RHYME_SETS.flatMap(r => r.set), ...sentences.map(x => x.w),
    ...[D.CVC_A1, D.CVC_A2, D.CCVC, D.CVCC, D.LONG, D.DIGRAPH].flat()].map(([w]) => w);
  for (const w of stickers) if (/^[a-z]+$/.test(w) && !/^(ch|sh|th|wh|ph|gh|kn|wr)/.test(w) && w !== 'one') add(N, `${w} starts with ${w[0].toUpperCase()}.`);
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
  // The books she reads herself: a word she taps is sounded out (its pure
  // sounds, listed below) and said ("cat!"), a sight word just said, and ▶
  // reads the page slowly (js/library.js).
  for (const k of ['selfStart', 'selfLocked', 'selfDone']) for (const l of B.BOOK_LINES[k]) for (const t of fills(l)) add(N, t);
  for (const b of B.DECODABLE_BOOKS) {
    for (const p of b.pages) {
      add(N, p.text, 0.85);
      for (const t of B.decodeTokens(p.text)) {
        if (t.sight || !t.level) add(N, t.word === 'I' ? t.word : t.word.toLowerCase(), 0.8);
        else add(N, `${t.word.toLowerCase()}!`, 0.8);
      }
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
