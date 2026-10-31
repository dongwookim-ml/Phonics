// A contact sheet of one hero kit (js/heroes/<title>.js), 5x: for each look
// its starting look (both walking frames), its body with nothing on its
// head, hands or back, on a unicorn, then every one of its things worn, by
// slot, with their wardrobe pictures; and the last row, every title's
// starting look side by side.
// Run: node tools/hero-gallery.js queen [out.png]
const path = require('path');
const { launch } = require('./browser');

const root = path.join(__dirname, '..');
const title = process.argv[2] || 'princess';
const out = process.argv[3] || path.join(process.cwd(), `hero-${title}.png`);

(async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/^https?:/, r => r.abort());
  await page.goto(`file://${path.join(root, 'index.html')}?edition=princess&halloween=0`);
  await page.click('#login-guest');
  const size = await page.evaluate(title => {
    const S = 5;
    const cv = document.createElement('canvas');
    cv.width = 1600;
    cv.height = 4000;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#e8f4e0';
    g.fillRect(0, 0, cv.width, cv.height);
    g.font = '13px sans-serif';
    let y = 10;
    const kit = HERO_KITS[title];
    const looks = kit ? kit.looks : [];
    const put = (canvas, x, label) => {
      g.drawImage(canvas, x, y, canvas.width * S, canvas.height * S);
      if (label) { g.fillStyle = '#333'; g.fillText(label, x, y + canvas.height * S + 12); }
      return x + canvas.width * S + 14;
    };
    const tables = { shape: DRESS_SHAPES, head: HEADWEAR, hand: HAND_ITEMS, back: BACK_ITEMS, style: HAIR_STYLES };
    for (const look of looks) {
      setPlayer({ title, look });
      state.worn = '';
      wearLook();
      const def = defaultOutfit();
      g.fillStyle = '#000';
      g.fillText(`${title} (${look}) starting: ${JSON.stringify(def)}`, 10, y + 10);
      y += 18;
      let x = 10;
      x = put(kitSprite(kit, look, def, 0).canvas, x, 'start');
      x = put(kitSprite(kit, look, def, 1).canvas, x, 'walking');
      x = put(kitSprite(kit, look, Object.assign({}, def, { head: 'none', hand: 'none', back: 'none' }), 0).canvas, x, 'body');
      x = put(riderSprite(Object.assign({}, def, { ride: Object.keys(UNICORNS).find(u => u !== 'none') }), 0, look === 'boy').canvas, x, 'riding');
      y += 34 * S + 24;
      for (const [slot, table] of Object.entries(tables)) {
        const keys = Object.keys(table).filter(k => k !== 'none' && suits(table[k]));
        g.fillStyle = '#000';
        g.fillText(`${slot}: ${keys.length}`, 10, y + 10);
        y += 16;
        x = 10;
        for (const k of keys) {
          const s = kitSprite(kit, look, Object.assign({}, def, { [slot]: k }), 0);
          if (x + s.canvas.width * S > cv.width) { x = 10; y += 34 * S + 34; }
          const it = table[k];
          const flags = ['forest', 'unicorn', 'fairy', 'shop'].filter(f => it[f]).join(',');
          x = put(s.canvas, x, `${k}${flags ? ` [${flags}]` : ''}`);
        }
        y += 34 * S + 30;
      }
    }
    // Every title's starting look, for comparing.
    g.fillStyle = '#000';
    g.fillText('every title', 10, y + 10);
    y += 18;
    let x = 10;
    for (const t of Object.keys(TITLES)) {
      const k = HERO_KITS[t];
      for (const look of k ? k.looks : []) {
        setPlayer({ title: t, look });
        state.worn = '';
        wearLook();
        x = put(kitSprite(k, look, defaultOutfit(), 0).canvas, x, `${t} ${look}`);
      }
    }
    y += 34 * S + 30;
    cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999';
    document.body.appendChild(cv);
    return { h: Math.min(cv.height, y + 10) };
  }, title);
  await page.setViewportSize({ width: 1600, height: size.h });
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1600, height: size.h } });
  console.log(out, errors.length ? `errors: ${errors.join('; ')}` : '');
  await browser.close();
})();
