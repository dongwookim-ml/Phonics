// Quick check before deploying: no two scripts define the same global, and
// every scene (village homes too) builds and draws without errors, for a
// girl and a boy hero and for the robot hero of the captain edition. Every
// door must be reachable and lead back out where it was. Every wardrobe
// thing that suits the hero draws (walking, riding, in a portrait and as its
// wardrobe picture) and shows on the hero. Also with Halloween on.
// Run: node tools/smoke.js  (needs the playwright package and Chromium)

const fs = require('fs');
const path = require('path');
const { launch } = require('./browser');

const root = path.join(__dirname, '..');
const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
let failed = 0;

// A second top-level function or const with the same name silently replaces
// the first, which is how two features can break each other.
const seen = {};
for (const s of scripts) {
  const src = fs.readFileSync(path.join(root, s), 'utf8');
  for (const m of src.matchAll(/^(?:function|const|let|class)\s+(\w+)/gm)) {
    if (seen[m[1]]) { console.log(`duplicate global ${m[1]}: ${seen[m[1]]} and ${s}`); failed++; }
    else seen[m[1]] = s;
  }
}

(async () => {
  const browser = await launch();
  // Each of them the rest of the year and at Halloween (js/halloween.js).
  for (const [edition, look, title, halloween] of [['princess', 'girl', 'princess', 0], ['princess', 'boy', 'prince', 0], ['captain', 'robot', 'captain', 0],
    ['princess', 'girl', 'princess', 1], ['captain', 'robot', 'captain', 1]]) {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.join(root, 'index.html') + `?edition=${edition}&halloween=${halloween}&language=${process.env.UI_LANGUAGE || 'ko'}`);
    await page.waitForTimeout(300);
    // Play without an account, so the login screen doesn't block the test.
    await page.click('#login-guest');
    const scenes = await page.evaluate(async title => {
      document.querySelector(`[data-title="${title}"]`).click();
      document.querySelector('.start').classList.add('hidden');
      state.stars = 99;
      const names = ['town', 'castle', 'castle2', 'yuna', 'forest', 'unicorn', 'dungeon', 'fairy', 'monster', 'tower', 'tower2', ...TOWN_HOUSES.map(h => `house-${h.letter}`),
        ...VILLAGE_HOMES.map(h => `home-${h.id}`)];
      const bad = [];
      for (const n of names) {
        try { changeScene(n); } catch (e) { bad.push(`${n}: ${e.message}`); }
        await new Promise(r => setTimeout(r, 120));
      }
      // Every door can be walked to from where she arrives, nobody stands on
      // it, and the room behind it leads back out to the scene it is in.
      for (const n of ['town', 'forest', 'unicorn', 'fairy', 'monster']) {
        const sc = sceneFor(n);
        for (const d of sc.doors) {
          const where = `${n} door ${d.c},${d.r} -> ${d.target}`;
          if (!findPath(sc, sc.start, (c, r) => c === d.c && r === d.r)) bad.push(`${where}: can't be reached`);
          if (sc.npcs.some(p => p.c === d.c && p.r === d.r)) bad.push(`${where}: someone stands on it`);
          const room = sceneFor(d.target);
          if ((d.home || d.target === 'tower') && (!room.returnTo || room.returnTo.scene !== n)) bad.push(`${where}: leads back to ${room.returnTo && room.returnTo.scene}`);
        }
        const homes = VILLAGE_HOMES.filter(h => h.scene === n);
        for (const h of homes) if (!sc.doors.some(d => d.home === h)) bad.push(`${n}: home ${h.id} has no door`);
      }
      return bad;
    }, title);
    // Everything in the wardrobe that suits this look draws: on foot (both
    // walking frames), riding, in a portrait with room for a fairy, and as
    // its wardrobe picture. Something worn changes the hero's picture (from
    // the same slot's next thing), so nothing is given that doesn't show.
    const items = await page.evaluate(() => {
      const bad = [];
      const data = o => heroSprite(o, 0).canvas.getContext('2d').getImageData(0, 0, 40, 40).data.join();
      const ride = Object.keys(UNICORNS).find(k => k !== 'none');
      let n = 0;
      for (const w of WARDROBE) {
        const fits = Object.keys(w.items).filter(v => suits(w.items[v]));
        for (const [v, item] of Object.entries(w.items)) {
          if (!suits(item)) continue;
          n++;
          const o = Object.assign({}, defaultOutfit(), w.shelf ? {} : { [w.slot]: v });
          try {
            heroSprite(o, 0);
            heroSprite(o, 1);
            riderSprite(Object.assign({}, o, { ride: w.slot === 'ride' && v !== 'none' ? v : ride }), 1, isBoy());
            drawPortrait(document.createElement('canvas'), heroPortrait(o, w.slot === 'ride', true));
            if (!itemPicture(w.slot, v)) bad.push(`${w.slot} ${v}: no picture`);
          } catch (e) {
            bad.push(`${w.slot} ${v}: ${e.message}`);
            continue;
          }
          if (w.shelf || w.slot === 'ride' || w.slot === 'fairy') continue;
          const other = fits.find(k => k !== v);
          if (other && data(o) === data(Object.assign({}, o, { [w.slot]: other }))) bad.push(`${w.slot} ${v} looks the same as ${other}`);
        }
      }
      // Every row of a body bitmap is 18 pixels, and an item's rows as wide
      // as its first (a row off by one shifts the rest of the picture).
      const width = (name, rows, w) => rows.forEach((r, i) => { if (r && r.length !== w) bad.push(`${name} row ${i} is ${r.length} wide, not ${w}`); });
      for (const [table, w] of [[PRINCESS_SKIRTS, 18], [PRINCESS_TOPS, 18], [BOY_BOTTOMS, 18], [BOY_TOPS, 18]]) for (const [k, rows] of Object.entries(table)) width(k, rows, w);
      for (const table of [HEAD_ITEMS, HAND_BITMAPS, BOY_HEAD_ITEMS, BOY_HAND_BITMAPS]) for (const [k, v] of Object.entries(table)) width(k, v.rows, v.rows[0].length);
      for (const [k, [rows]] of Object.entries(HERO_WINGS)) width(k, rows, rows[0].length);
      return { bad, n };
    });
    if (!items.n) items.bad.push('no wardrobe items');
    for (const e of items.bad.concat(scenes, errors)) { console.log(`${look}${halloween ? ' (Halloween)' : ''}: ${e}`); failed++; }
    await page.close();
  }
  await browser.close();
  console.log(failed ? `${failed} problem(s)` : 'all scenes OK');
  process.exit(failed ? 1 : 0);
})();
