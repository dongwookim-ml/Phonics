// How she moves on (js/quiz.js, SKILL and NEXT_STAGE in js/data.js):
//   - her first 3 first tries at a tier all right move her up (an easy
//     tier is soon passed), else 5 of the last 6; 2 misses in a row, down;
//     a right answer asked below her tier by a place's cap doesn't count;
//   - every 6th question is from the tier below, unless her last 8 first
//     tries of that kind were all right; after a miss the next is easier;
//   - a kind she has mastered at a place (at the highest tier it asks
//     there, the last 5 right) is asked only now and then; once every kind
//     of a place is, its people ask the next village's (NEXT_STAGE), at her
//     tier there, capped like that village; never before; a letter house
//     keeps asking its own until its questions are all solved (its medal);
//   - looking at whether she has mastered a kind gives no level to a kind
//     she has never played;
//   - a letter house she has finished (its medal) asks nothing: its host
//     sends her to the nearest house with new words.
// Run: node tools/check-levels.js  (needs the playwright package and Chromium)

const path = require('path');
const { launch } = require('./browser');

const root = path.join(__dirname, '..');
// The send-off's wordings (LINES.houseDone in js/data.js).
const LINES_HOUSE_DONE = /no more questions here|did every question/;
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

      // 1b. Asked below her tier by a place's cap (sentences at a unicorn,
      // tier 3, she is at 4 from the cave).
      const capped = right => {
        fresh();
        Object.assign(Quiz.skill('sentence'), { t: 4, best: 4, placed: true, w: [], last: [], n: 0 });
        let q;
        do { q = ask({ name: 'unicorn', level: 3 }, 'sentence'); if (!q.counts) Quiz.record(q, true); } while (!q.counts);
        Quiz.record(q, right);
        return Quiz.skill('sentence').w.join('');
      };
      out.capped = { right: capped(true), wrong: capped(false) };

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
      // A letter house: its kinds stay its own while its questions (in its
      // medal) aren't all solved; then the forest's too.
      fresh();
      master(QUIZ_TYPES.house, 'house');
      out.houseOpen = tally({ name: 'host', letter: 'C' });
      for (const kind of QUIZ_TYPES.house) for (const id of Quiz.pool(kind, { letter: 'C' })) state.history[id] = { kind, tries: 1, right: 1, wrong: 0, last: Date.now() };
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
    check(`${tag}: her first 3 at a tier right move her up; after a miss there, 5 of 6 (${r.streak.join(' ')})`, r.streak.join() === '1,1,2,2,2,2,2,2,3,3', r.streak);
    check(`${tag}: right answers asked below her tier (a place's cap) don't count towards her tier there; a miss does`, r.capped.right === '' && r.capped.wrong === '0', r.capped);
    check(`${tag}: 2 misses in a row at her tier, one tier down (${r.down.join(' ')})`, r.down.join() === '3,2', r.down);
    const below = t => t.filter(x => x < 3).length;
    check(`${tag}: every 6th question is from the tier below when she isn't sure (${r.notSure.join('')})`, below(r.notSure) === 3 && r.notSure.every((t, i) => (t < 3) === ((i + 1) % 6 === 0)), r.notSure);
    check(`${tag}: none is easier when her last 8 were right (${r.sure.join('')})`, below(r.sure) === 0, r.sure);
    check(`${tag}: nothing mastered: only the town's kinds, and no level for kinds she never played`, !r.none.stages.forest && Object.keys(r.none.kinds).every(k => r.townKinds.includes(k)) && r.noneSkill.split(',').every(k => r.townKinds.includes(k)), r.none);
    const share = (t, k) => (t.kinds[k] || 0) / Object.values(t.kinds).reduce((a, b) => a + b, 0);
    check(`${tag}: a mastered kind is asked now and then (${Math.round(share(r.one, 'word') * 100)}%)`, share(r.one, 'word') > 0.08 && share(r.one, 'word') < 0.3 && !r.one.stages.forest, r.one);
    check(`${tag}: all mastered in town: the forest's questions, capped like the forest, the town's now and then (${JSON.stringify(r.town.stages)})`,
      r.town.stages.forest > 200 && r.town.stages.here > 20 && !r.town.bad.length && ['family', 'vowel', 'ending', 'read', 'blend'].every(k => r.town.kinds[k] > 0), r.town);
    check(`${tag}: a letter house keeps asking its own while its questions aren't all solved`, !r.houseOpen.stages.forest, r.houseOpen);
    check(`${tag}: then the forest's there too (${JSON.stringify(r.house.stages)})`, r.house.stages.forest > 200 && !r.house.bad.length, r.house);
    check(`${tag}: the forest mastered: the Unicorn Village's sentences (${JSON.stringify(r.forest.kinds)})`, r.forest.stages.unicorn > 200 && r.forest.kinds.sentence > 0 && r.forest.kinds.meaning > 0 && !r.forest.bad.length, r.forest);
    check(`${tag}: mastered there too: still the next village's, all of them`, r.both.stages.forest > 200 && !r.both.bad.length, r.both);
    check(`${tag}: the Monster Village, mastered, asks its own`, !Object.keys(r.monster.stages).some(s => s !== 'here'), r.monster);
    check(`${tag}: a miss on a mastered kind brings it back as usual`, r.slip.kinds.word > 50 && !r.slip.stages.forest, r.slip);

    // A letter house she has finished (every question of its medal right):
    // its host asks nothing and sends her on to the nearest house with new
    // words, its letter shown; the dialog closes by itself, 🔊 says it
    // again. Not before; and once every house is done, it asks as usual.
    const h = await page.evaluate(async () => {
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      state.skill = {};
      state.history = {};
      document.querySelector('.start').classList.add('hidden');
      const host = sceneFor('house-C').npcs.find(n => n.letter === 'C');
      const solve = letter => { for (const id of medalList().find(m => m.id === `house:${letter}`).ids) state.history[id] = { kind: id.split(':')[0], tries: 1, right: 1, wrong: 0, last: Date.now() }; };
      const open = () => {
        closeDialog();
        host.missed = null;
        openDialog(host);
        return { question: !!state.question, cards: ui.choices.children.length, text: ui.text.textContent, clue: ui.clue.textContent, shown: !ui.dialog.classList.contains('hidden') };
      };
      const out = { before: open() };
      solve('C');
      out.done = open();
      const here = TOWN_HOUSES.find(x => x.letter === 'C');
      const away = x => Math.abs(x.c - here.c) + Math.abs(x.r - here.r);
      out.nearest = TOWN_HOUSES.filter(x => x !== here).sort((a, b) => away(a) - away(b))[0].letter;
      let said = 0;
      const say = Sound.say;
      Sound.say = (parts, v) => { said++; return say.call(Sound, parts, v); };
      askAgain();
      Sound.say = say;
      out.again = said;
      // Once it has been said (or after 12 s at the latest: no voice).
      for (let i = 0; i < 70 && !ui.dialog.classList.contains('hidden'); i++) await sleep(200);
      out.closed = ui.dialog.classList.contains('hidden') && !state.talking && !state.busy;
      // The nearest done too: the next nearest.
      solve(out.nearest);
      out.second = open();
      out.secondNearest = TOWN_HOUSES.filter(x => x !== here && x.letter !== out.nearest).sort((a, b) => away(a) - away(b))[0].letter;
      for (const x of TOWN_HOUSES) solve(x.letter);
      out.all = open();
      closeDialog();
      return out;
    });
    const sentTo = (o, letter) => !o.question && o.cards === 0 && o.shown && LINES_HOUSE_DONE.test(o.text) && o.text.includes(` ${letter} `) && o.clue === `${letter}${letter.toLowerCase()}`;
    check(`${tag}: a letter house asks as usual until she has finished it`, h.before.question && h.before.cards >= 2, h.before);
    check(`${tag}: finished, its host asks nothing and sends her to the nearest house with new words (${h.nearest}): "${h.done.text}"`, sentTo(h.done, h.nearest), h.done);
    check(`${tag}: 🔊 says it again, and the dialog closes by itself`, h.again === 1 && h.closed, h);
    check(`${tag}: that one finished too, the next nearest (${h.secondNearest})`, sentTo(h.second, h.secondNearest), h.second);
    check(`${tag}: every house finished: the hosts ask on as usual`, h.all.question && h.all.cards >= 2, h.all);
    check(`${tag}: no page errors`, !errors.length, errors);
    await page.close();
  }
  await browser.close();
  console.log(failed ? `${failed} problem(s)` : 'levels OK');
  process.exit(failed ? 1 : 0);
})();
