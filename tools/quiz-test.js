// Builds many questions for every kind of asker in both editions and checks
// each one: enough options, exactly one right, no two options alike, and a
// recording for every line it says (a missing one falls back to the device
// voice, which sounds like somebody else).
// Run: node tools/quiz-test.js  (needs the playwright package and Chromium)

const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const ROUNDS = Number(process.env.ROUNDS || 150);

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
          if (q.tiles) {
            const letters = q.tiles.map(t => t.l);
            if ([...q.word].some(l => !letters.includes(l))) problems.push(`${where}: a letter of ${q.word} has no tile`);
          } else {
            const n = q.options.length;
            if (n < 2) problems.push(`${where}: ${n} options`);
            if (q.options.filter(o => o.right).length !== 1) problems.push(`${where}: ${q.options.filter(o => o.right).length} right options`);
            const seen = new Set(q.options.map(o => o.html));
            if (seen.size !== n) problems.push(`${where}: two options alike`);
            const words = q.options.map(o => o.wrong).filter(Boolean);
            if (new Set(words).size !== words.length) problems.push(`${where}: two options say the same word`);
            for (const o of q.options) if (!o.right && o.wrong) heard({ text: o.wrong, narrator: true }, who);
          }
          for (const p of [].concat(q.ask, q.replay, q.answer)) heard(p, who);
        }
      }
      return { problems: [...new Set(problems)], missing: [...missing.entries()].sort((a, b) => b[1] - a[1]), kinds };
    }, ROUNDS);
    console.log(`${edition}: ${JSON.stringify(report.kinds)}`);
    for (const p of report.problems.slice(0, 40)) console.log(`  ${p}`);
    if (report.problems.length > 40) console.log(`  ... ${report.problems.length - 40} more`);
    for (const [k, n] of report.missing.slice(0, 40)) console.log(`  not recorded (${n}x): ${k}`);
    if (report.missing.length > 40) console.log(`  ... ${report.missing.length - 40} more lines not recorded`);
    for (const e of errors) console.log(`  page error: ${e}`);
    failed += report.problems.length + report.missing.length + errors.length;
    await page.close();
  }
  await browser.close();
  console.log(failed ? `${failed} problem(s)` : 'all questions OK');
  process.exit(failed ? 1 : 0);
})();
