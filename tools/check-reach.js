// Every scene in both editions can be walked: the tiles she arrives on are
// free, and from each of them every villager, door, link, way out, bookcase
// and wardrobe can be reached, also with the unicorn (or car) parked next
// to her. All of it the rest of the year and at Halloween (js/halloween.js),
// whose pumpkins take tiles away and can move where the ride is parked.
// Run: node tools/check-reach.js  (needs the playwright package and Chromium)

const path = require('path');
const { launch } = require('./browser');

const root = path.join(__dirname, '..');

(async () => {
  const browser = await launch();
  let failed = 0;
  for (const [edition, halloween] of [['princess', 0], ['captain', 0], ['princess', 1], ['captain', 1]]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(/^https?:/, r => r.abort());
    await page.goto(`file://${path.join(root, 'index.html')}?edition=${edition}&halloween=${halloween}`);
    await page.click('#login-guest');
    const report = await page.evaluate(() => {
      const names = ['town', 'castle', 'castle2', 'yuna', 'forest', 'unicorn', 'dungeon', 'fairy', 'monster', 'tower', 'tower2', ...TOWN_HOUSES.map(h => `house-${h.letter}`)];
      const problems = [];
      // Where she can arrive: each scene's start, every link's landing spot,
      // and the tiles in front of the doors she comes out of.
      const arrivals = {};
      const arrive = (n, a) => (arrivals[n] = arrivals[n] || []).push(a);
      for (const n of names) arrive(n, Object.assign({ from: 'start' }, sceneFor(n).start));
      for (const n of names) {
        const sc = sceneFor(n);
        for (const l of sc.links || []) if (l.at) arrive(l.target, Object.assign({ from: `${n} link` }, l.at));
        if (sc.house) arrive('town', { c: sc.house.c + 1, r: sc.house.r + 3, from: `${n} exit` });
        if (sc.returnTo) arrive(sc.returnTo.scene, Object.assign({ from: `${n} exit` }, sc.returnTo.at));
      }
      arrive('town', { c: 19, r: 10, from: 'castle exit' });
      let checked = 0;
      for (const n of names) {
        const sc = sceneFor(n);
        const targets = [];
        for (const npc of sc.npcs) if (!npc.mount) targets.push({ what: `villager ${npc.name}`, ok: (c, r) => Math.abs(c - npc.c) + Math.abs(r - npc.r) === 1 });
        for (const d of sc.doors) targets.push({ what: `door to ${d.target}`, ok: (c, r) => c === d.c && r === d.r });
        for (const l of sc.links || []) targets.push({ what: `way to ${l.target} at ${l.c},${l.r}`, ok: (c, r) => c === l.c && r === l.r });
        for (const x of sc.exitTiles || (sc.exit ? [sc.exit] : [])) targets.push({ what: `way out at ${x.c},${x.r}`, ok: (c, r) => c === x.c && r === x.r });
        for (const o of sc.objects) if (o.front) targets.push({ what: `${o.kind} front`, ok: (c, r) => o.front.some(f => f.c === c && f.r === r) });
        for (const a of arrivals[n] || []) {
          const t = tileAt(sc, a.c, a.r);
          if (!t) { problems.push(`${n}: arriving at ${a.c},${a.r} (${a.from}) is off the map`); continue; }
          if (t.blocked) problems.push(`${n}: arriving at ${a.c},${a.r} (${a.from}) is a blocked tile`);
          if (sc.npcs.some(m => m.c === a.c && m.r === a.r)) problems.push(`${n}: arriving at ${a.c},${a.r} (${a.from}) is on a villager`);
          for (const tg of targets) {
            checked++;
            if (!findPath(sc, a, tg.ok)) problems.push(`${n}: from ${a.from} (${a.c},${a.r}) no way to the ${tg.what}`);
          }
          // With the ride parked next to her.
          if (!sc.outdoor) continue;
          const keep = { scene: state.scene, parked: state.parked, outfit: state.outfit };
          state.scene = sc;
          placeHero(a.c, a.r);
          state.outfit = Object.assign({}, state.outfit, { ride: Object.keys(UNICORNS).find(x => x !== 'none') });
          parkUnicorn();
          if (state.parked) {
            for (const tg of targets) if (!findPath(sc, a, tg.ok)) problems.push(`${n}: the ride parked at ${state.parked.npc.c},${state.parked.npc.r} blocks the ${tg.what} (${a.from})`);
          }
          removeParked();
          Object.assign(state, keep);
        }
      }
      return { problems, checked };
    });
    console.log(`${edition}${halloween ? " at Halloween" : ""}: ${report.checked} ways checked`);
    for (const p of report.problems) console.log(`  ${p}`);
    for (const e of errors) console.log(`  page error: ${e}`);
    failed += report.problems.length + errors.length;
    await page.close();
  }
  await browser.close();
  console.log(failed ? `${failed} problem(s)` : 'every way OK');
  process.exit(failed ? 1 : 0);
})();
