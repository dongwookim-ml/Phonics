// How she moves on (js/quiz.js, SKILL and NEXT_STAGE in js/data.js):
//   - 3 right first tries in a row at her tier move her up a tier, at any
//     time (not only before her first miss); 2 misses in a row, down;
//   - every 6th question is from the tier below, unless her last 8 first
//     tries of that kind were all right; after a miss the next is easier;
//   - a kind she has mastered at a place (at the highest tier it asks
//     there, the last 5 right) is asked only now and then; once every kind
//     of a place is, its people ask the next village's (NEXT_STAGE), at her
//     tier there, capped like that village; never before;
//   - looking at whether she has mastered a kind gives no level to a kind
//     she has never played.
// Run: node tools/check-levels.js  (needs the playwright package and Chromium)

const path = require('path');
const { launch } = require('./browser');

const root = path.join(__dirname, '..');
let failed = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : `\n     ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
};

(async () => {
  const browser = await launch();
  for (const edition of ['princess', 'captain']) {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(/^https?:/, r => r.abort());
    await page.goto(`file://${path.join(root, 'index.html')}?edition=${edition}&halloween=0`);
    await page.click('#login-guest');
    const r = await page.evaluate(() => {
      const out = {};
      const fresh = () => { state.skill = {}; state.history = {}; Quiz.recent = {}; };
      const town = () => ({ name: 'test' });
      // Only `word`: the town asks three kinds, so ask until it is a word.
      const ask = (npc, kind) => { for (let i = 0; i < 200; i++) { const q = Quiz.make(npc); if (q.ladder === kind || q.kind === kind) return q; } return null; };

      // 1. Three right in a row move her up, also after a miss.
      fresh();
      const path1 = [];
      for (const right of [1, 1, 1, 0, 1, 1, 1, 1, 1, 1]) {
        let q;
        do { q = ask(town(), 'word'); if (!q.counts) Quiz.record(q, true); } while (!q.counts);
        Quiz.record(q, !!right);
        path1.push(Quiz.skill('word').t);
      }
      out.streak = path1;

      // 2. Two misses in a row at her tier: one tier down.
      fresh();
      Object.assign(Quiz.skill('word'), { t: 3, best: 3, placed: true });
      const path2 = [];
      for (let i = 0; i < 2; i++) {
        let q;
        do { q = ask(town(), 'word'); if (!q.counts) Quiz.record(q, true); } while (!q.counts);
        Quiz.record(q, false);
        path2.push(Quiz.skill('word').t);
        Quiz.skill('word').easy = false;
      }
      out.down = path2;

      // 3. Easier questions: every 6th when she isn't sure, none when she is.
      const easier = sureNow => {
        fresh();
        const k = Quiz.skill('word');
        Object.assign(k, { t: 3, best: 3, placed: true, n: 0, last: sureNow ? [1, 1, 1, 1, 1, 1, 1, 1] : [1, 0, 1, 1, 0, 1, 1, 1] });
        const tiers = [];
        for (let i = 0; i < 18; i++) { const q = ask(town(), 'word'); tiers.push(q.tier); }
        // Answering keeps her last tries as they were (nothing recorded).
        return tiers;
      };
      out.notSure = easier(false);
      out.sure = easier(true);

      // 4. Mastered kinds: the town asks the forest's.
      const master = (kinds, place) => {
        for (const kind of kinds) {
          const top = Math.min(TIER_BAND[place][1] + Quiz.lead(kind), Quiz.tierMax(kind));
          Object.assign(Quiz.skill(kind), { t: top, best: top, placed: true, w: [1, 1, 1, 1, 1], last: [1, 1, 1, 1, 1] });
        }
      };
      const tally = (npc, n = 300) => {
        const kinds = {};
        const stages = {};
        const bad = [];
        for (let i = 0; i < n; i++) {
          const q = Quiz.make(npc);
          const kind = q.ladder || q.kind;
          kinds[kind] = (kinds[kind] || 0) + 1;
          stages[q.stage || 'here'] = (stages[q.stage || 'here'] || 0) + 1;
          if (q.stage) {
            const cap = Math.min(TIER_BAND[q.stage][1] + Quiz.lead(kind), Quiz.tierMax(kind));
            if (q.tier > cap || !QUIZ_TYPES[q.stage].includes(kind)) bad.push(`${kind} t${q.tier} from ${q.stage}`);
          }
        }
        return { kinds, stages, bad };
      };
      fresh();
      out.none = tally(town());
      out.noneSkill = Object.keys(state.skill).sort().join();
      fresh();
      master(['word'], 'town');
      out.one = tally(town());
      fresh();
      master(QUIZ_TYPES.town, 'town');
      out.town = tally(town());
      // A letter house: its own three, then the forest's too.
      fresh();
      master(QUIZ_TYPES.house, 'house');
      out.house = tally({ name: 'host', letter: 'C' });
      // The forest, mastered: the Unicorn Village's sentences.
      fresh();
      master(QUIZ_TYPES.forest, 'forest');
      out.forest = tally({ name: 'elf', level: 2 });
      // Mastered there too: still the next village's, all of them.
      fresh();
      master(QUIZ_TYPES.town, 'town');
      master(QUIZ_TYPES.forest, 'forest');
      out.both = tally(town());
      // The Monster Village has none after it.
      fresh();
      master(QUIZ_TYPES.monster, 'monster');
      out.monster = tally({ name: 'monster', level: 6 });
      // A miss on a mastered kind: it is asked again as usual.
      fresh();
      master(QUIZ_TYPES.town, 'town');
      Quiz.skill('word').w = [1, 1, 1, 1, 0];
      out.slip = tally(town());
      out.townKinds = QUIZ_TYPES.town;
      return out;
    });
    const tag = edition;
    check(`${tag}: 3 right in a row move her up, and again after a miss (${r.streak.join(' ')})`, r.streak.join() === '1,1,2,2,2,2,3,3,3,4', r.streak);
    check(`${tag}: 2 misses in a row at her tier, one tier down (${r.down.join(' ')})`, r.down.join() === '3,2', r.down);
    const below = t => t.filter(x => x < 3).length;
    check(`${tag}: every 6th question is from the tier below when she isn't sure (${r.notSure.join('')})`, below(r.notSure) === 3 && r.notSure.every((t, i) => (t < 3) === ((i + 1) % 6 === 0)), r.notSure);
    check(`${tag}: none is easier when her last 8 were right (${r.sure.join('')})`, below(r.sure) === 0, r.sure);
    check(`${tag}: nothing mastered: only the town's kinds, and no level for kinds she never played`, !r.none.stages.forest && Object.keys(r.none.kinds).every(k => r.townKinds.includes(k)) && r.noneSkill.split(',').every(k => r.townKinds.includes(k)), r.none);
    const share = (t, k) => (t.kinds[k] || 0) / Object.values(t.kinds).reduce((a, b) => a + b, 0);
    check(`${tag}: a mastered kind is asked now and then (${Math.round(share(r.one, 'word') * 100)}%)`, share(r.one, 'word') > 0.08 && share(r.one, 'word') < 0.3 && !r.one.stages.forest, r.one);
    check(`${tag}: all mastered in town: the forest's questions, capped like the forest, the town's now and then (${JSON.stringify(r.town.stages)})`,
      r.town.stages.forest > 200 && r.town.stages.here > 20 && !r.town.bad.length && ['family', 'vowel', 'ending', 'read', 'blend'].every(k => r.town.kinds[k] > 0), r.town);
    check(`${tag}: in a letter house too (${JSON.stringify(r.house.stages)})`, r.house.stages.forest > 200 && !r.house.bad.length, r.house);
    check(`${tag}: the forest mastered: the Unicorn Village's sentences (${JSON.stringify(r.forest.kinds)})`, r.forest.stages.unicorn > 200 && r.forest.kinds.sentence > 0 && r.forest.kinds.meaning > 0 && !r.forest.bad.length, r.forest);
    check(`${tag}: mastered there too: still the next village's, all of them`, r.both.stages.forest > 200 && !r.both.bad.length, r.both);
    check(`${tag}: the Monster Village, mastered, asks its own`, !Object.keys(r.monster.stages).some(s => s !== 'here'), r.monster);
    check(`${tag}: a miss on a mastered kind brings it back as usual`, r.slip.kinds.word > 50 && !r.slip.stages.forest, r.slip);
    check(`${tag}: no page errors`, !errors.length, errors);
    await page.close();
  }
  await browser.close();
  console.log(failed ? `${failed} problem(s)` : 'levels OK');
  process.exit(failed ? 1 : 0);
})();
