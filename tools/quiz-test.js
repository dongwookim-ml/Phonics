// Builds many questions for every kind of asker in both editions, with
// nothing answered yet, everything answered (review) and a mix, and checks
// each one: enough options, exactly one right, no two options alike, an id
// from its kind's pool, a prompt, and a recording for every line it says (a
// missing one falls back to the device voice, which sounds like somebody
// else; it fails only with TTS_STRICT=1, since new lines wait for the
// recording workflow). Also: every villager in every scene has a voice and
// a persona, and every LINES / BOOK_LINES kind the code asks for exists.
// Run: node tools/quiz-test.js  (needs the playwright package and Chromium)

const fs = require('fs');
const path = require('path');
const { launch } = require('./browser');

const root = path.join(__dirname, '..');
const ROUNDS = Number(process.env.ROUNDS || 150);
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

(async () => {
  const browser = await launch();
  let failed = 0;
  for (const edition of ['princess', 'captain']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.join(root, 'index.html') + `?edition=${edition}`);
    await page.click('#login-guest');
    const report = await page.evaluate(([rounds, asked]) => {
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
        for (let i = 0; i < rounds; i++) {
          let q;
          try { q = Quiz.make(npc); } catch (e) { problems.push(`${npc.name} (${mode}): ${e.message}`); break; }
          kinds[q.kind] = (kinds[q.kind] || 0) + 1;
          const where = `${npc.name} ${q.kind} ${q.id}`;
          if (!q.id || !Quiz.pool(q.kind, npc).includes(q.id)) problems.push(`${where} (${mode}): id not in the ${q.kind} pool`);
          if (typeof q.prompt !== 'string' || !q.prompt.trim()) problems.push(`${where}: no prompt`);
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
      return { problems: [...new Set(problems)], missing: [...missing.entries()].sort((a, b) => b[1] - a[1]), kinds };
    }, [ROUNDS, kindsAsked]);
    console.log(`${edition}: ${JSON.stringify(report.kinds)}`);
    for (const p of report.problems.slice(0, 40)) console.log(`  ${p}`);
    if (report.problems.length > 40) console.log(`  ... ${report.problems.length - 40} more`);
    for (const [k, n] of report.missing.slice(0, 40)) console.log(`  not recorded (${n}x): ${k}`);
    if (report.missing.length > 40) console.log(`  ... ${report.missing.length - 40} more lines not recorded`);
    for (const e of errors) console.log(`  page error: ${e}`);
    failed += report.problems.length + (STRICT ? report.missing.length : 0) + errors.length;
    await page.close();
  }
  await browser.close();
  console.log(failed ? `${failed} problem(s)` : 'all questions OK');
  process.exit(failed ? 1 : 0);
})();
