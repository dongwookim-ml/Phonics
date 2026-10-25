// Quick check before deploying: no two scripts define the same global, and
// every scene builds and draws without errors, for a girl and a boy hero
// and for the robot hero of the captain edition.
// Run: node tools/smoke.js  (needs the playwright package and Chromium)

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

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
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const [edition, look, title] of [['princess', 'girl', 'princess'], ['princess', 'boy', 'prince'], ['captain', 'robot', 'captain']]) {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.join(root, 'index.html') + `?edition=${edition}`);
    await page.waitForTimeout(300);
    // Play without an account, so the login screen doesn't block the test.
    await page.click('#login-guest');
    const scenes = await page.evaluate(async title => {
      document.querySelector(`[data-title="${title}"]`).click();
      document.querySelector('.start').classList.add('hidden');
      state.stars = 99;
      const names = ['town', 'castle', 'castle2', 'yuna', 'forest', 'unicorn', 'dungeon', 'fairy', ...TOWN_HOUSES.map(h => `house-${h.letter}`)];
      const bad = [];
      for (const n of names) {
        try { changeScene(n); } catch (e) { bad.push(`${n}: ${e.message}`); }
        await new Promise(r => setTimeout(r, 120));
      }
      return bad;
    }, title);
    for (const e of scenes.concat(errors)) { console.log(`${look}: ${e}`); failed++; }
    await page.close();
  }
  await browser.close();
  console.log(failed ? `${failed} problem(s)` : 'all scenes OK');
  process.exit(failed ? 1 : 0);
})();
