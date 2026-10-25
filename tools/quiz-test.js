// Builds many questions for every kind of asker in both editions, at every
// tier their place asks, with nothing answered yet, everything answered
// (review) and a mix, and checks each one: as many cards as the tier says,
// exactly one right, no two alike (words or pictures), the rules for sounds
// she can't tell apart and other names for a picture, spelling tiles, an id
// from its kind's pool, a prompt, and a recording for every line it says (a
// missing one falls back to the device voice, which sounds like somebody
// else; it fails only with TTS_STRICT=1, since new lines wait for the
// recording workflow), every pure sound one tools/letter-sounds.json can cut,
// and a word sounded out once per sound. Also: Quiz.pool holds only what the
// parent's settings let her be asked, an old save never starts a kind at its
// hardest tier, a tier the parent sets is stamped (Quiz.setTier), every
// villager in every scene has a voice and a persona, and
// every LINES / BOOK_LINES kind the code asks for exists.
// First it runs tools/check-books.js: every word of the books she reads
// herself can be sounded out at the book's level, or is a sight word.
// Run: node tools/quiz-test.js  (needs the playwright package and Chromium)

const fs = require('fs');
const path = require('path');
const { launch } = require('./browser');

const root = path.join(__dirname, '..');
const ROUNDS = Number(process.env.ROUNDS || 150);
// LIST=all prints every problem and missing line instead of the first 40.
const SHOW = process.env.LIST === 'all' ? Infinity : 40;
const STRICT = process.env.TTS_STRICT === '1';
// line('kind') and line('kind', { vars }) in the code (not those given their
// own list), with whether only the robot edition's files ask for it.
const kindsAsked = { LINES: {}, BOOK_LINES: {} };
for (const f of fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(root, 'js', f), 'utf8');
  const note = (table, k) => { table[k] = (table[k] !== false) && f.startsWith('captain-'); };
  for (const m of src.matchAll(/\bline\('([\w-]+)'(?:, *\{[^{}]*\})?\)/g)) note(kindsAsked.LINES, m[1]);
  for (const m of src.matchAll(/\bbookLine\('([\w-]+)'/g)) note(kindsAsked.BOOK_LINES, m[1]);
}
// The pure sounds ("/m/") the recording workflow can cut.
const cuts = Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, 'letter-sounds.json'), 'utf8')).sounds);

(async () => {
  const browser = await launch();
  let failed = 0;
  // Every word of the books she reads herself can be read at its level.
  const books = require('./check-books').check();
  console.log(`books she reads herself: ${books.length ? `${books.length} problem(s)` : 'OK'}`);
  for (const p of books) console.log(`  ${p}`);
  failed += books.length;
  for (const edition of ['princess', 'captain']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.join(root, 'index.html') + `?edition=${edition}`);
    await page.click('#login-guest');
    const report = await page.evaluate(([rounds, asked, cuts]) => {
      const problems = [];
      const missing = new Map();
      const norm = t => String(t).trim().replace(/\s+/g, ' ');
      // Which recorded voice says a part, as js/audio.js decides it.
      const heard = (part, who) => {
        if (!part || !part.text) return;
        const v = part.narrator || !who.tts ? TTS_NARRATOR : who.tts;
        const t = norm(part.text);
        if (/^\/[a-z]+\/$/.test(t) && !cuts.includes(t.slice(1, -1))) problems.push(`"${t}" is said, but tools/letter-sounds.json has no such sound to cut`);
        if (!(TTS_INDEX[v] && TTS_INDEX[v][t])) missing.set(`${v}|${t}`, (missing.get(`${v}|${t}`) || 0) + 1);
      };
      // One asker of each kind, as the scenes make them.
      const askers = [];
      for (const n of TOWN_NPCS) askers.push(Object.assign({ level: 1 }, n));
      for (const h of TOWN_HOUSES) askers.push({ name: h.who, look: h.look, letter: h.letter, level: 1 });
      for (const n of FOREST_NPCS) askers.push(Object.assign({ level: 2 }, n));
      for (const n of UNICORN_NPCS) askers.push(Object.assign({ level: 3 }, n));
      for (const n of DUNGEON_NPCS) askers.push(Object.assign({ level: 4, monster: true }, n));
      for (const n of FAIRY_NPCS) askers.push(Object.assign({ level: 5 }, n));
      for (const h of VILLAGE_HOMES) askers.push({ name: h.who, look: h.look, unicorn: h.unicorn, gives: h.gives, level: HOME_LEVEL[h.scene] });
      // The rules every set of cards keeps (HARD_PAIRS, ALIAS in js/data.js).
      const has = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
      const sameSound = (a, b) => a === b || has(HARD_PAIRS.same, a, b);
      const hardPair = (a, b) => a !== b && has(HARD_PAIRS.vowels.concat(HARD_PAIRS.consonants), a, b);
      const nearWords = (a, b) => {
        if (a.length !== b.length) return false;
        const diff = [...a].map((c, i) => [c, b[i]]).filter(([x, y]) => x !== y);
        return diff.length === 1 && hardPair(diff[0][0], diff[0][1]);
      };
      // The letter of each short vowel sound (RHYME_SETS v).
      const SHORT = { 'æ': 'a', 'ɛ': 'e', 'ɪ': 'i', 'ɑ': 'o', 'ʌ': 'u' };
      // Words a voice may read two ways, never said alone in a rhyme (bow).
      const HETERONYMS = ['bow', 'row', 'sow', 'tear', 'wind', 'lead', 'read', 'live', 'close', 'dove', 'wound', 'bass'];
      for (const r of RHYME_SETS) for (const [w] of r.set) if (HETERONYMS.includes(w)) problems.push(`rhyme ${r.rime}: ${w} can be read two ways`);
      const W = Quiz.words();
      const div = document.createElement('div');
      const picOf = o => { div.innerHTML = o.html; const p = div.querySelector('.pic, .bigpic'); return p && p.textContent; };
      const placeOf = npc => (npc.level === 5 ? 'fairy' : npc.level === 4 ? 'dungeon' : npc.level === 3 ? 'unicorn' : npc.level === 2 ? 'forest' : npc.letter ? 'house' : 'town');
      // Quiz.pool (the parent panel's counts) holds only what she can be asked
      // with the parent's settings (all off here): each of its ids comes up at
      // a tier they allow. Asked ones are marked solved, so the next is new.
      state.settings = {};
      for (const kind of Quiz.kinds) {
        const npcs = ['word', 'findStart'].includes(kind) ? [{ level: 1 }].concat(TOWN_HOUSES.map(h => ({ level: 1, letter: h.letter }))) : [{ level: 1 }];
        for (const npc of npcs) {
          state.history = {};
          for (let t = 1; t <= Quiz.tierMax(kind); t++) {
            for (let i = 0; i < 500; i++) {
              const q = Quiz.make(npc, { kind, tier: t });
              if (state.history[q.id]) break;
              state.history[q.id] = { kind, tries: 1, right: 1, wrong: 0, last: Date.now() };
            }
          }
          const never = Quiz.pool(kind, npc).filter(id => !state.history[id]);
          if (never.length) problems.push(`${kind}${npc.letter ? ` (${npc.letter} house)` : ''}: ${never.length} id(s) in Quiz.pool are never asked with these settings, e.g. ${never[0]}`);
        }
      }
      // A save from before tiers never starts a kind at its top tier, or at
      // one that puts sounds she can't tell apart side by side.
      const old = {};
      for (const kind of Object.keys(TIERS)) for (let i = 0; i < 10; i++) old[`${kind}:${i}`] = { kind, tries: 1, right: 1, wrong: 0, last: 1 };
      for (const [kind, k] of Object.entries(Quiz.migrate([old]))) {
        const c = TIERS[kind][k.t - 1];
        if (k.t >= TIERS[kind].length || c.near || c.minimal) problems.push(`an old save starts ${kind} at tier ${k.t} of ${TIERS[kind].length}`);
      }
      // A tier the parent sets is stamped and counts as one more answer, so
      // the saves keep it (tools/check-merge.js); setting it again to the
      // same tier changes nothing.
      const skills = state.skill;
      state.skill = { spell: { t: 3, best: 3, w: [1], last: [], n: 7, set: 9e15 } };
      Quiz.setTier('spell', 2);
      Quiz.setTier('spell', 2);
      const set = Quiz.skill('spell');
      if (set.t !== 2 || set.set !== 9e15 + 1 || set.n !== 8 || set.w.length) problems.push(`Quiz.setTier: ${JSON.stringify(set)}`);
      state.skill = skills;
      // The parent-only tiers are asked below too, so their ids are in the pool.
      state.settings = Object.fromEntries(Object.values(TIERS).flat().filter(c => c.setting).map(c => [c.setting, true]));
      const kinds = {};
      const tiers = {};
      // Histories to ask under: nothing answered, all answered right (review), a mix.
      const fill = (npc, make) => {
        const h = {};
        for (const kind of Quiz.kinds) {
          for (const id of Quiz.pool(kind, npc)) {
            const x = make();
            if (x) h[id] = Object.assign({ kind, tries: x.right + x.wrong, last: Date.now() - Math.random() * 20 * 864e5 }, x);
          }
        }
        return h;
      };
      const histories = {
        new: () => ({}),
        solved: npc => fill(npc, () => ({ right: 1, wrong: Math.random() < 0.3 ? 1 : 0 })),
        mixed: npc => fill(npc, () => (Math.random() < 0.7 ? { right: Math.random() < 0.8 ? 1 : 0, wrong: 1 } : null)),
      };
      for (const [mode, history] of Object.entries(histories)) for (const npc of askers) {
        const who = voiceOf(npc);
        state.history = history(npc);
        npc.lastQuiz = null;
        // Every kind this person asks at every tier their place goes up to
        // (spelling's parent-only tier too), in turn.
        const place = placeOf(npc);
        const combos = [];
        for (const kind of new Set(QUIZ_TYPES[place])) for (let t = 1; t <= Math.min(TIER_BAND[place][1], TIERS[kind].length); t++) combos.push({ kind, tier: t });
        for (let i = 0; i < rounds; i++) {
          let q;
          const force = combos[i % combos.length];
          try { q = Quiz.make(npc, i < combos.length * Math.floor(rounds / combos.length) ? force : null); } catch (e) { problems.push(`${npc.name} (${mode}) ${force.kind} t${force.tier}: ${e.message}`); continue; }
          kinds[q.kind] = (kinds[q.kind] || 0) + 1;
          tiers[`${place} ${q.kind} t${q.tier}`] = (tiers[`${place} ${q.kind} t${q.tier}`] || 0) + 1;
          const cfg = TIERS[q.kind][q.tier - 1];
          const where = `${npc.name} ${q.kind} t${q.tier} ${q.id}`;
          const rightCard = q.options.find(o => o.right);
          const t = W[q.kind === 'rhyme' ? String(rightCard.wrong) : q.target] || { w: q.target, aka: [] };
          // What is said after a miss: the hint, what she picked, the answer shown.
          const after = [].concat(q.model || []);
          if (!q.id || !Quiz.pool(q.kind, npc).includes(q.id)) problems.push(`${where} (${mode}): id not in the ${q.kind} pool`);
          if (typeof q.prompt !== 'string' || !q.prompt.trim()) problems.push(`${where}: no prompt`);
          if (q.tiles) {
            const letters = q.tiles.map(x => x.l);
            const left = letters.slice();
            for (const g of q.slots) { const i = left.indexOf(g); if (i < 0) problems.push(`${where}: "${g}" of ${q.word} has no tile`); else left.splice(i, 1); }
            if (q.slots.join('') !== q.word) problems.push(`${where}: blanks ${q.slots.join('/')} don't spell ${q.word}`);
            if (letters.length !== q.slots.length + cfg.extra) problems.push(`${where}: ${letters.length} tiles for ${q.slots.length} blanks + ${cfg.extra}`);
            const undoubled = l => (l.length === 2 && l[0] === l[1] ? l[0] : l);
            const soundOf = l => PART_SOUNDS[undoubled(l)] || (LETTERS.find(x => x.letter === undoubled(l).toUpperCase()) || {}).sound;
            for (const f of left) if (q.slots.some(g => sameSound(f, g) || soundOf(f) === soundOf(g) || (!cfg.near && hardPair(f, g)))) problems.push(`${where}: tile ${f} sounds like a letter of ${q.word}`);
            for (let a = 0; a < left.length; a++) for (let b = a + 1; b < left.length; b++) if (sameSound(left[a], left[b])) problems.push(`${where}: tiles ${left[a]} and ${left[b]} say the same sound`);
            for (const f of left) for (const g of q.slots) if (g.length > 1 && g.includes(f)) problems.push(`${where}: tile ${f} is a letter of ${g}`);
            if (cfg.noX && q.word.includes('x')) problems.push(`${where}: an x word at the easiest tier`);
            if ((q.given || 0) !== (cfg.firstGiven ? 1 : 0)) problems.push(`${where}: ${q.given} letters given`);
            for (const x of q.tiles) heard(x.sound, who);
            after.push(...q.teach());
            q.slots.forEach((g, i) => after.push(...q.need(i)));
          } else {
            const n = q.options.length;
            if (n !== cfg.n) problems.push(`${where}: ${n} cards, the tier has ${cfg.n}`);
            if (q.options.filter(o => o.right).length !== 1) problems.push(`${where}: ${q.options.filter(o => o.right).length} right options`);
            if (new Set(q.options.map(o => o.html)).size !== n) problems.push(`${where}: two options alike`);
            const ws = q.options.map(o => String(o.wrong || '').toLowerCase());
            if (new Set(ws).size !== n) problems.push(`${where}: two options say the same word`);
            for (const o of q.options) if (!o.right) after.push(...q.teach(o), ...q.picked(o));
            const pics = q.options.map(picOf).filter(Boolean);
            if (new Set(pics).size !== pics.length) problems.push(`${where}: two cards show the same picture ${pics.join(' ')}`);
            if ((cfg.pics || ['rhyme', 'meaning'].includes(q.kind)) && q.kind !== 'sentence' && pics.length !== n) problems.push(`${where}: a card without its picture`);
            const right = q.options.find(o => o.right);
            const rw = String(right.wrong).toLowerCase();
            const wrongs = q.options.filter(o => !o.right).map(o => String(o.wrong).toLowerCase());
            // Cards that are only a picture: pictures she can name for sure.
            if (/bigpic/.test(q.options[0].html) && !cfg.minimal) for (const w of ws) if (!W[w] || W[w].pic < 2) problems.push(`${where}: unclear picture ${w} on a picture-only card`);
            const letterCards = /class="letter"/.test(q.options[0].html);
            const firstOf = w => (letterCards ? w : w[0]);
            if (['word', 'findStart', 'start', 'vowel', 'ending'].includes(q.kind)) {
              const L = q.kind === 'vowel' ? q.target[1] : q.kind === 'ending' ? q.target[2] : q.target[0];
              const hard = wrongs.filter(w => hardPair(firstOf(w), L));
              // Same sound (c, k): never. Hard to hear apart: only at the top tier, once.
              for (const w of wrongs) if (sameSound(firstOf(w), L) && firstOf(w) !== rw[0] || (letterCards && sameSound(w, L))) problems.push(`${where}: ${w} says the same first sound as ${q.target}`);
              if (!cfg.near && hard.length) problems.push(`${where}: ${hard.join(',')} hard to tell from ${L} below the top tier`);
              if (cfg.near && hard.length > 1) problems.push(`${where}: ${hard.length} hard cards`);
            }
            // Never two cards whose letters (or first letters) say the same sound (c, k).
            if (['word', 'findStart', 'start'].includes(q.kind) || letterCards) for (let a = 0; a < ws.length; a++) for (let b = a + 1; b < ws.length; b++) if (sameSound(firstOf(ws[a]), firstOf(ws[b]))) problems.push(`${where}: ${ws[a]} and ${ws[b]} start with the same sound`);
            // Never a card she could call by the target's name, or (first-sound
            // questions) by a name that starts with the target's sound.
            if (!letterCards) for (const w of wrongs) {
              const x = W[w];
              if (!x) continue;
              if (x.aka.includes(t.w) || t.aka.includes(w)) problems.push(`${where}: ${w} is also called ${t.w}`);
              if (['findStart', 'word'].includes(q.kind) && x.aka.some(m => sameSound(m[0], t.w[0]))) problems.push(`${where}: ${w} (${x.aka.join('/')}) starts like ${t.w}`);
            }
            if (q.kind === 'start') for (const w of wrongs) if (t.aka.some(m => sameSound(m[0], w.toLowerCase()))) problems.push(`${where}: ${q.target} (${t.aka}) starts with ${w}`);
            // Words that differ only in a sound she can't hear yet: top tiers only.
            if (['family', 'read', 'blend'].includes(q.kind) && !cfg.minimal) for (const w of wrongs) if (nearWords(w, rw)) problems.push(`${where}: ${w} and ${rw} differ only in a hard pair`);
            if (q.kind === 'sentence' && !cfg.near) for (const w of wrongs) if (nearWords(w, rw)) problems.push(`${where}: ${w} and ${rw} differ only in a hard pair below the top tier`);
            if (q.kind === 'rhyme') {
              const set = RHYME_SETS.find(r => r.set.some(([w]) => w === rw));
              const same = wrongs.filter(w => RHYME_SETS.find(r => r.set.some(([x]) => x === w)).v === set.v);
              const can = RHYME_SETS.some(r => r !== set && r.v === set.v);
              if (same.length !== (cfg.sameVowel && can ? 1 : 0)) problems.push(`${where}: ${same.length} cards with the same vowel`);
              // Below the top tier, none that ends the same after a short vowel she can't tell apart (hat, jet).
              for (const w of wrongs) {
                const s = RHYME_SETS.find(r => r.set.some(([x]) => x === w));
                if (!cfg.sameVowel && hardPair(SHORT[s.v], SHORT[set.v]) && s.rime.slice(1) === set.rime.slice(1)) problems.push(`${where}: ${w} (${s.rime}) sounds like a rhyme of ${rw} (${set.rime})`);
              }
            }
          }
          // Sounding a word out says each sound once: a doubled letter (the gg
          // of egg, the ll of bell) is one sound, its single letter's.
          const sounding = q.tiles ? q.answer : ['word', 'family', 'read', 'blend', 'vowel', 'ending'].includes(q.kind) ? q.model : [];
          const said = sounding.map(p => /^\/([a-z]+)\/$/.exec((p && p.text) || '')).filter(Boolean).map(m => m[1]).join('');
          const sw = W[q.target];
          if (said && sw && said !== (sw.syl || [sw.w]).map(s => s.replace(/(.)\1/g, '$1')).join('')) problems.push(`${where}: sounded out as ${said}`);
          // The cards wait for the word, except in silent reading.
          if (q.kind !== 'read' && !q.ask.includes(Quiz.READY)) problems.push(`${where}: no READY in ask`);
          if (!q.tiles && !(q.model && q.model.length)) problems.push(`${where}: no answer to show`);
          // No "a" or "the" right before a quiz word.
          for (const p of after) if (p.text && /(^|\s)(a|an|the|A|An|The)$/.test(p.text)) problems.push(`${where}: "${p.text}" ends with an article`);
          for (const p of [].concat(q.ask, q.replay, q.answer, after)) heard(p, who);
        }
      }
      // Everyone in every scene can talk: a voice and a persona.
      const names = ['town', 'castle', 'castle2', 'yuna', 'forest', 'unicorn', 'dungeon', 'fairy', ...TOWN_HOUSES.map(h => `house-${h.letter}`)];
      for (const n of names) {
        for (const npc of sceneFor(n).npcs) {
          if (npc.mount) continue;
          if (!VOICES[npc.look] || !VOICES[npc.look].tts) problems.push(`${n}: ${npc.name} (${npc.look}) has no voice`);
          if (!(PERSONA[npc.look] || []).length) problems.push(`${n}: ${npc.name} (${npc.look}) has no persona lines`);
        }
      }
      for (const [table, list] of [['LINES', LINES], ['BOOK_LINES', BOOK_LINES]]) {
        for (const [k, robotOnly] of Object.entries(asked[table])) {
          if ((isCaptain() || !robotOnly) && !(Array.isArray(list[k]) && list[k].length)) problems.push(`${table}.${k} is asked for but missing`);
        }
      }
      return { problems: [...new Set(problems)], missing: [...missing.entries()].sort((a, b) => b[1] - a[1]), kinds, tiers };
    }, [ROUNDS, kindsAsked, cuts]);
    console.log(`${edition}: ${JSON.stringify(report.kinds)}`);
    console.log(`  tiers built: ${Object.keys(report.tiers).length} (place kind tier) ${process.env.LIST === 'all' ? JSON.stringify(report.tiers) : ''}`);
    for (const p of report.problems.slice(0, SHOW)) console.log(`  ${p}`);
    if (report.problems.length > SHOW) console.log(`  ... ${report.problems.length - SHOW} more`);
    for (const [k, n] of report.missing.slice(0, SHOW)) console.log(`  not recorded (${n}x): ${k}`);
    if (report.missing.length > SHOW) console.log(`  ... ${report.missing.length - SHOW} more lines not recorded`);
    for (const e of errors) console.log(`  page error: ${e}`);
    failed += report.problems.length + (STRICT ? report.missing.length : 0) + errors.length;
    await page.close();
  }
  await browser.close();
  console.log(failed ? `${failed} problem(s)` : 'all questions OK');
  process.exit(failed ? 1 : 0);
})();
