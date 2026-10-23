// Lists every line the game can say, with the Kokoro voice that says it,
// so tools/tts-build.py can record them. Run: node tools/tts-phrases.js
// Anything missed here still plays, just with the device voice.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
const D = vm.runInNewContext(`${src}
({ PLAYER, TITLES, LETTERS, LINES, PERSONA, VOICES, TTS_NARRATOR, TOWN_NPCS, TOWN_HOUSES, FOREST_NPCS,
   UNICORN_NPCS, CASTLE_UP_NPCS, WORD_FAMILIES, RHYMES, PART_SOUNDS, SENTENCES, FOREST_STARS, UNICORN_STARS })`);

const out = new Map();
const add = (voice, text, speed = 0.95) => {
  const t = String(text).trim().replace(/\s+/g, ' ');
  if (t) out.set(`${voice}|${t}`, { voice, text: t, speed });
};

// Every way a line can come out: each title, the default name.
function fills(text, vars = {}) {
  const res = new Set();
  for (const t of Object.values(D.TITLES)) {
    const own = { name: D.PLAYER.spoken, title: t.en, little: t.en.toLowerCase() };
    res.add(text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : own[k] !== undefined ? own[k] : m)));
  }
  return [...res];
}
const lines = (voice, kinds, vars) => {
  for (const k of kinds) for (const l of D.LINES[k]) for (const t of fills(l, vars)) add(voice, t);
};

// Who asks what: town and house folk, forest folk, unicorn village folk.
const town = new Set([...D.TOWN_NPCS.map(n => n.look), ...D.TOWN_HOUSES.map(h => h.look), 'king', 'queen', 'maid',
  ...D.CASTLE_UP_NPCS.map(n => n.look)]);
const forest = new Set(D.FOREST_NPCS.map(n => n.look));
const unicorn = new Set(D.UNICORN_NPCS.map(n => n.look));
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
}
for (const h of D.TOWN_HOUSES) add(D.VOICES[h.look].tts, `This is the ${h.letter} house.`);

// The narrator: words, letter sounds and lines said by nobody in particular.
const N = D.TTS_NARRATOR;
const words = new Set();
for (const l of D.LETTERS) for (const [w] of l.words) words.add(w);
for (const f of D.WORD_FAMILIES) for (const [w] of f) words.add(w);
for (const r of D.RHYMES) for (const [w] of r) words.add(w);
for (const x of D.SENTENCES) { words.add(x.w[0]); x.alike.forEach(w => words.add(w)); x.other.forEach(([w]) => words.add(w)); }
for (const w of words) { add(N, w, 0.8); add(N, `${w}!`, 0.8); }
for (const l of D.LETTERS) {
  add(N, `${l.sound}, ${l.sound}`, 0.75);
  add(N, l.sound, 0.8);
  for (const [w] of l.words) add(N, `${w} starts with`);
}
for (const s of Object.values(D.PART_SOUNDS)) add(N, s, 0.8);
for (const set of D.RHYMES) for (const [a] of set) for (const [b] of set) if (a !== b) add(N, `${a}, ${b}!`, 0.9);
lines(N, ['start', 'castle', 'room', 'dressup', 'yes', 'forest', 'unicorn', 'mount', 'dismount', 'upstairs']);
for (const l of D.TOWN_HOUSES) lines(N, ['house'], { letter: l.letter });
for (const stars of [D.FOREST_STARS, D.UNICORN_STARS]) lines(N, ['locked'], { stars });
for (const t of Object.values(D.TITLES)) add(N, `${t.en} ${D.PLAYER.spoken}!`);

const list = [...out.values()];
fs.writeFileSync(path.join(__dirname, 'tts-phrases.json'), JSON.stringify(list, null, 0));
const per = {};
for (const x of list) per[x.voice] = (per[x.voice] || 0) + 1;
console.log(list.length, 'phrases', per);
