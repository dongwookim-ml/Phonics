// Checks every hero kit (js/heroes.js, js/heroes/<title>.js) in the
// princess edition: each title is its own character, looks unlike the
// others, and has its own things to wear, all drawing and named.
//   - a kit for the title, with the looks TITLES allows (a princess is a
//     girl, a knight a girl or a boy);
//   - its starting clothes exist and suit it;
//   - for each look: at least 8 shapes, 8 head things, 7 hand things, 6
//     back things and 6 hairstyles of its own to choose from, some given
//     in the Forest, the Unicorn Village and the Fairy Village;
//   - each of its things changes how it looks when worn, draws on a unicorn
//     too, and has a name in Korean and English and a picture;
//   - its own things' keys start with its title;
//   - its own body (no head, hand or back thing) and its starting look are
//     each at least 12% unlike every other title's of the same look.
// Run: node tools/check-heroes.js            (every title)
//      TITLE=queen node tools/check-heroes.js (one)
const path = require('path');
const { launch } = require('./browser');

const root = path.join(__dirname, '..');
const NEED = { shape: 8, head: 8, hand: 7, back: 6, style: 6 };

(async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/^https?:/, r => r.abort());
  await page.goto(`file://${path.join(root, 'index.html')}?edition=princess&halloween=0`);
  await page.click('#login-guest');
  const r = await page.evaluate(async ({ only, NEED }) => {
    const out = [];
    const fail = m => out.push(m);
    const titles = Object.keys(TITLES).filter(t => !only || t === only);
    const pixels = sprite => sprite.canvas.getContext('2d').getImageData(0, 0, sprite.canvas.width, sprite.canvas.height).data;
    const unlike = (a, b) => {
      let n = 0;
      let d = 0;
      for (let i = 0; i < a.length; i += 4) {
        if (a[i + 3] < 40 && b[i + 3] < 40) continue;
        n++;
        if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) + Math.abs(a[i + 3] - b[i + 3]) > 60) d++;
      }
      return n ? d / n : 0;
    };
    const has = key => typeof PIXELTOWN_LOCALES.ko[key] === 'string' && typeof PIXELTOWN_LOCALES.en[key] === 'string';
    const slots = Object.keys(NEED);
    const tables = { shape: DRESS_SHAPES, head: HEADWEAR, hand: HAND_ITEMS, back: BACK_ITEMS, style: HAIR_STYLES };
    const bodies = {};
    const starts = {};
    const summary = {};
    for (const title of titles) {
      const kit = HERO_KITS[title];
      if (!kit) { fail(`${title}: no kit (addHeroKit('${title}', ...) in js/heroes/${title}.js)`); continue; }
      const want = TITLES[title].look ? [TITLES[title].look] : ['girl', 'boy'];
      if (kit.looks.join() !== want.join()) fail(`${title}: looks ${kit.looks.join()}, want ${want.join()}`);
      for (const [slot, table] of Object.entries(tables)) {
        for (const [key, item] of Object.entries(table)) {
          if (!item.kits || item.kits[0] !== title || !(kit.items && kit.items[slot] && kit.items[slot][key])) continue;
          if (!key.startsWith(`${title}-`)) fail(`${title}: its ${slot} "${key}" should start with "${title}-"`);
          if (!item.art) fail(`${title}: its ${slot} "${key}" has no art`);
          const nameKey = `heroes.${title}.${key.slice(title.length + 1)}`;
          if (!has(nameKey)) fail(`${title}: no Korean and English name ${nameKey}`);
          if (!item.icon) fail(`${title}: its ${slot} "${key}" has no icon`);
        }
      }
      for (const look of want) {
        setPlayer({ title, look });
        state.worn = '';
        wearLook();
        const tag = `${title} (${look})`;
        const def = defaultOutfit();
        for (const slot of slots) {
          const item = tables[slot][def[slot]];
          if (!suits(item)) fail(`${tag}: starts in ${slot} "${def[slot]}", which ${item ? "doesn't suit it" : "doesn't exist"}`);
        }
        const mine = {};
        for (const slot of slots) mine[slot] = Object.entries(tables[slot]).filter(([k, it]) => k !== 'none' && suits(it)).map(([k]) => k);
        summary[tag] = Object.fromEntries(slots.map(s => [s, mine[s].length]));
        for (const slot of slots) if (mine[slot].length < NEED[slot]) fail(`${tag}: ${mine[slot].length} ${slot} things, want at least ${NEED[slot]}`);
        const village = flag => slots.some(s => s !== 'style' && mine[s].some(k => tables[s][k][flag]));
        for (const flag of ['forest', 'unicorn', 'fairy']) if (!village(flag)) fail(`${tag}: nothing given in the ${flag} village (a thing with ${flag}: true)`);
        const base = Object.assign({}, def, { head: 'none', hand: 'none', back: 'none' });
        const plain = kitSprite(kit, look, base, 0);
        bodies[look] = bodies[look] || {};
        bodies[look][title] = pixels(plain);
        starts[look] = starts[look] || {};
        starts[look][title] = pixels(kitSprite(kit, look, def, 0));
        for (const slot of slots) {
          for (const key of mine[slot]) {
            if (key === def[slot]) continue;
            try {
              const worn = Object.assign({}, def, { [slot]: key });
              const a = kitSprite(kit, look, worn, 0);
              kitSprite(kit, look, worn, 1);
              if (unlike(pixels(a), starts[look][title]) === 0) fail(`${tag}: wearing ${slot} "${key}" changes nothing`);
              riderSprite(Object.assign({}, worn, { ride: Object.keys(UNICORNS).find(u => u !== 'none') }), 0, look === 'boy');
              itemPicture(slot, key);
            } catch (e) {
              fail(`${tag}: ${slot} "${key}": ${e.message}`);
            }
          }
        }
      }
    }
    // Every title unlike the others of the same look.
    for (const [what, sets] of [['body', bodies], ['starting look', starts]]) {
      for (const look of Object.keys(sets)) {
        const names = Object.keys(sets[look]);
        for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
          const u = unlike(sets[look][names[i]], sets[look][names[j]]);
          if (u < 0.12) fail(`${names[i]} and ${names[j]} (${look}): their ${what} is only ${Math.round(u * 100)}% unlike`);
        }
      }
    }
    return { out, summary };
  }, { only: process.env.TITLE || '', NEED });
  for (const [tag, n] of Object.entries(r.summary)) console.log(`  ${tag}: ${Object.entries(n).map(([s, k]) => `${k} ${s}`).join(', ')}`);
  for (const m of r.out) console.log(`FAIL ${m}`);
  for (const e of errors) console.log(`FAIL page error: ${e}`);
  await browser.close();
  const failed = r.out.length + errors.length;
  console.log(failed ? `${failed} problem(s)` : 'heroes OK');
  process.exit(failed ? 1 : 0);
})();
