// Builds many questions for every kind of asker in both editions and checks
// each one: enough options, exactly one right, no two options alike, and a
// recording for every line it says (a missing one falls back to the device
// voice, which sounds like somebody else).
// Run: node tools/quiz-test.js  (needs the playwright package and Chromium)

const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const ROUNDS = Number(process.env.ROUNDS || 150);
// LIST=all prints every problem and missing line instead of the first 40.
const SHOW = process.env.LIST === 'all' ? Infinity : 40;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  let failed = 0;
  for (const edition of ['princess', 'captain']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.join(root, 'index.html') + `?edition=${edition}`);
    await page.click('#login-guest');
    const report = await page.evaluate(rounds => {
      const problems = [];
      const missing = new Map();
      const norm = t => String(t).trim().replace(/\s+/g, ' ');
      // Which recorded voice says a part, as js/audio.js decides it.
      const heard = (part, who) => {
        if (!part || !part.text) return;
        const v = part.narrator || !who.tts ? TTS_NARRATOR : who.tts;
        const t = norm(part.text);
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
      const kinds = {};
      for (const npc of askers) {
        const who = voiceOf(npc);
        for (let i = 0; i < rounds; i++) {
          let q;
          try { q = Quiz.make(npc); } catch (e) { problems.push(`${npc.name}: ${e.message}`); break; }
          kinds[q.kind] = (kinds[q.kind] || 0) + 1;
          const where = `${npc.name} ${q.kind} ${q.id}`;
          // What is said after a miss: the hint, what she picked, the answer shown.
          const after = [].concat(q.model || []);
          if (q.tiles) {
            const letters = q.tiles.map(t => t.l);
            if ([...q.word].some(l => !letters.includes(l))) problems.push(`${where}: a letter of ${q.word} has no tile`);
            if (q.slots.join('') !== q.word) problems.push(`${where}: blanks ${q.slots.join('/')} don't spell ${q.word}`);
            for (const t of q.tiles) heard(t.sound, who);
            after.push(...q.teach());
            q.slots.forEach((s, i) => after.push(...q.need(i)));
          } else {
            const n = q.options.length;
            if (n < 2) problems.push(`${where}: ${n} options`);
            if (q.options.filter(o => o.right).length !== 1) problems.push(`${where}: ${q.options.filter(o => o.right).length} right options`);
            const seen = new Set(q.options.map(o => o.html));
            if (seen.size !== n) problems.push(`${where}: two options alike`);
            const words = q.options.map(o => o.wrong).filter(Boolean);
            if (new Set(words).size !== words.length) problems.push(`${where}: two options say the same word`);
            for (const o of q.options) if (!o.right) after.push(...q.teach(o), ...q.picked(o));
            // No two cards with the same picture; picture-only cards are clear pictures.
            const div = document.createElement('div');
            const pics = q.options.map(o => { div.innerHTML = o.html; const p = div.querySelector('.pic, .bigpic'); return p && p.textContent; }).filter(Boolean);
            if (new Set(pics).size !== pics.length) problems.push(`${where}: two cards show the same picture ${pics.join(' ')}`);
            if (/bigpic/.test(q.options[0].html)) for (const o of q.options) if (WEAK_PICTURES.has(o.wrong)) problems.push(`${where}: unclear picture ${o.wrong} on a picture-only card`);
            // No letters she can't tell apart side by side (HARD_PAIRS): the
            // letters on letter cards, the first letters of word cards, and
            // words that differ only in such a letter.
            const hard = HARD_PAIRS.vowels.concat(HARD_PAIRS.consonants, HARD_PAIRS.same);
            const conf = (x, y) => hard.some(([a, b]) => (a === x && b === y) || (a === y && b === x));
            const ws = q.options.map(o => String(o.wrong || '').toLowerCase());
            const letterCards = /class="letter"/.test(q.options[0].html);
            for (let a = 0; a < ws.length; a++) for (let b = a + 1; b < ws.length; b++) {
              const [x, y] = [ws[a], ws[b]];
              if (letterCards ? conf(x[0], y[0]) : ['word', 'findStart'].includes(q.kind) && conf(x[0], y[0])) problems.push(`${where}: ${x} and ${y} sound alike to her`);
              const diff = [...x].map((c, i) => [c, y[i]]).filter(([c, d]) => c !== d);
              if (!letterCards && ['family', 'read'].includes(q.kind) && x.length === y.length && diff.length === 1 && conf(...diff[0])) problems.push(`${where}: ${x} and ${y} differ only in a hard pair`);
            }
          }
          // The cards wait for the word, except in silent reading.
          if (q.kind !== 'read' && !q.ask.includes(Quiz.READY)) problems.push(`${where}: no READY in ask`);
          if (!q.tiles && !(q.model && q.model.length)) problems.push(`${where}: no answer to show`);
          // No "a" or "the" right before a quiz word.
          for (const p of after) if (p.text && /(^|\s)(a|an|the|A|An|The)$/.test(p.text)) problems.push(`${where}: "${p.text}" ends with an article`);
          for (const p of [].concat(q.ask, q.replay, q.answer, after)) heard(p, who);
        }
      }
      return { problems: [...new Set(problems)], missing: [...missing.entries()].sort((a, b) => b[1] - a[1]), kinds };
    }, ROUNDS);
    console.log(`${edition}: ${JSON.stringify(report.kinds)}`);
    for (const p of report.problems.slice(0, SHOW)) console.log(`  ${p}`);
    if (report.problems.length > SHOW) console.log(`  ... ${report.problems.length - SHOW} more`);
    for (const [k, n] of report.missing.slice(0, SHOW)) console.log(`  not recorded (${n}x): ${k}`);
    if (report.missing.length > SHOW) console.log(`  ... ${report.missing.length - SHOW} more lines not recorded`);
    for (const e of errors) console.log(`  page error: ${e}`);
    failed += report.problems.length + report.missing.length + errors.length;
    await page.close();
  }
  await browser.close();
  console.log(failed ? `${failed} problem(s)` : 'all questions OK');
  process.exit(failed ? 1 : 0);
})();
