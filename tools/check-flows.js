// Flow checks for things that went wrong before, played in Chromium:
//  - the parent panel pauses the game: no walking on, no dialog opening
//    under it, no speech, game timers wait, and closing it leaves the game
//    busy only if something is still showing;
//  - the parent password: wrong, offline (with and without the check kept
//    at login) and server busy each say the right thing;
//  - a broken or edited save never reaches the parent panel as HTML;
//  - the first tap after ▶ doesn't cut off the line being spoken.
// Run: node tools/check-flows.js  (needs the playwright package and Chromium)

const path = require('path');
const { launch } = require('./browser');

const root = path.join(__dirname, '..');
const URL = `file://${path.join(root, 'index.html')}`;
const FAKE = 'http://127.0.0.1:9'; // an account server that never answers for real
let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || detail === undefined ? '' : `: ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
}

// A page playing as a guest (or signed in, with `user`), the start screen gone.
async function game(browser, { seed, user, server, args } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/^https?:/, r => (server ? server(r) : r.abort()));
  await page.addInitScript(([seed, user, fake]) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    if (user) {
      localStorage.setItem('pixeltown-token', 'token');
      localStorage.setItem('pixeltown-user', user);
      localStorage.setItem('pixeltown-owner', user);
    } else localStorage.setItem('pixeltown-guest', '1');
    if (seed) localStorage.setItem('pixeltown-v2', JSON.stringify(seed));
  }, [seed || null, user || null, FAKE]);
  await page.addInitScript(fake => { window.ACCOUNT_SERVER = fake; }, FAKE);
  await page.goto(URL);
  await page.waitForFunction(() => typeof Account !== 'undefined' && Account._started && typeof state !== 'undefined');
  await page.evaluate(() => document.getElementById('start-btn').click());
  return { page, ctx, errors };
}

async function parentPauses(browser) {
  const { page, ctx, errors } = await game(browser);
  const r = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    const said = [];
    const say = Sound.say;
    Sound.say = (parts, who) => { if ([].concat(parts).length) said.push(parts); return say(parts, who); };
    // She walks to someone far away; a parent opens the panel on the way.
    const npc = state.scene.npcs.filter(n => !n.mount && !n.shop)
      .sort((a, b) => Math.hypot(b.c - state.hero.c, b.r - state.hero.r) - Math.hypot(a.c - state.hero.c, a.r - state.hero.r))[0];
    talkTo(npc);
    await sleep(300);
    said.length = 0;
    document.getElementById('parent').click();
    const at = { c: state.hero.c, r: state.hero.r };
    let fired = false;
    later(300, () => { fired = true; });
    await sleep(2500);
    const under = { moved: Math.hypot(state.hero.c - at.c, state.hero.r - at.r), dialog: !ui.dialog.classList.contains('hidden'), said: said.length, fired };
    document.querySelector('.parent-close').click();
    const afterClose = { fired, busy: state.busy };
    await sleep(2500);
    const later2 = { dialog: !ui.dialog.classList.contains('hidden'), walking: state.hero.path.length, busy: state.busy };
    // A question showing when the panel closes keeps the game busy.
    openDialog(npc);
    document.getElementById('parent').click();
    document.querySelector('.parent-close').click();
    const withDialog = state.busy;
    closeDialog();
    // A scene change under the panel finishes after it.
    changeScene('castle');
    document.getElementById('parent').click();
    await sleep(800);
    const sceneUnder = state.scene.kind;
    document.querySelector('.parent-close').click();
    await sleep(50);
    return { under, afterClose, later2, withDialog, sceneUnder, sceneAfter: state.scene === sceneFor('castle'), busyAfterScene: state.busy };
  });
  check('parent panel: she stops walking under it (at most one tile)', r.under.moved <= 1.01, r.under);
  check('parent panel: no dialog opens under it, nobody talks', !r.under.dialog && !r.under.said, r.under);
  check('parent panel: game timers wait until it closes', !r.under.fired && r.afterClose.fired, r);
  check('parent panel: she doesn\'t arrive at the villager afterwards', !r.later2.dialog && !r.later2.walking && !r.later2.busy, r.later2);
  check('parent panel: closing it with a question showing keeps the game busy', r.withDialog === true);
  check('parent panel: a scene change waits, then finishes', r.sceneUnder === 'town' && r.sceneAfter && r.busyAfterScene === false, r);
  check('parent panel: no page errors', !errors.length, errors);
  await ctx.close();
}

// The parent password, with a fake account server: `verify` answers
// /auth/verify (a status, or null for no connection).
async function parentPassword(browser) {
  let verify = 200;
  const server = r => {
    const u = r.request().url();
    if (!u.startsWith(FAKE)) return r.abort();
    if (u.endsWith('/save')) return r.fulfill({ status: 200, contentType: 'application/json', body: '{"save":null,"updated":0}' });
    if (u.endsWith('/auth/verify')) {
      if (verify === null) return r.abort();
      const ok = (r.request().postDataJSON() || {}).pw === 'right-pw';
      return r.fulfill({ status: verify, contentType: 'application/json', body: verify === 200 ? JSON.stringify({ ok }) : '{}' });
    }
    return r.fulfill({ status: 404, body: '{}' });
  };
  const { page, ctx } = await game(browser, { user: 'kid', server });
  const attempt = async pw => {
    await page.evaluate(() => document.getElementById('parent').click());
    await page.fill('.parent-pw', pw);
    await page.click('.parent-go');
    await page.waitForFunction(() => !document.querySelector('.parent-panel') || document.querySelector('.parent-tiles') ||
      !/확인하는 중/.test(document.querySelector('.parent-err').textContent), null, { timeout: 10000 });
    const r = await page.evaluate(() => ({ stats: !!document.querySelector('.parent-tiles'), msg: document.querySelector('.parent-err') ? document.querySelector('.parent-err').textContent : '' }));
    await page.evaluate(() => document.querySelector('.parent-close').click());
    return r;
  };
  verify = null;
  let r = await attempt('right-pw');
  check('password: offline, nothing kept on the tablet: "not connected"', !r.stats && r.msg.includes('인터넷에 연결되지 않았어요'), r);
  verify = 500;
  r = await attempt('right-pw');
  check('password: server down: "not connected"', !r.stats && r.msg.includes('인터넷에 연결되지 않았어요'), r);
  verify = 429;
  r = await attempt('right-pw');
  check('password: too many tries: "try again later"', !r.stats && r.msg.includes('잠시 후 다시 해 보세요'), r);
  verify = 200;
  r = await attempt('wrong-pw');
  check('password: wrong', !r.stats && r.msg.includes('비밀번호가 맞지 않아요'), r);
  r = await attempt('right-pw');
  check('password: right', r.stats, r);
  // That right answer kept a check on the tablet: offline works now.
  verify = null;
  r = await attempt('right-pw');
  check('password: offline, the check kept on the tablet lets the parent in', r.stats, r);
  r = await attempt('wrong-pw');
  check('password: offline, a wrong one is still wrong', !r.stats && r.msg.includes('비밀번호가 맞지 않아요'), r);
  await ctx.close();
}

async function brokenSave(browser) {
  const evil = f => `<img src=x onerror="window.__xss=(window.__xss||[]).concat('${f}')">`;
  const seed = {
    edition: 'princess', stars: 3, player: { shown: evil('name'), spoken: evil('spoken'), title: 'princess', look: 'girl' },
    history: {
      'word:cat': { kind: evil('kind'), tries: evil('tries'), right: 0, wrong: 2, last: Date.now() },
      'word:dog': { kind: 'word', tries: 1, right: 0, wrong: evil('wrong'), last: Date.now() },
      'word:sun': { kind: 'word', tries: 2, right: 1, wrong: 1, last: Date.now() },
      'word:hat': { kind: 'word', tries: NaN, right: 0, wrong: 1, last: Date.now() },
    },
  };
  const { page, ctx, errors } = await game(browser, { seed });
  await page.evaluate(() => document.getElementById('parent').click());
  await page.fill('.parent-pw', '0000');
  await page.click('.parent-go');
  await page.waitForSelector('.parent-tiles');
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => ({ xss: window.__xss || [], kept: Object.keys(state.history) }));
  check('broken save: nothing runs as HTML in the parent panel', !r.xss.length, r.xss);
  check('broken save: only well-formed answers are loaded', r.kept.join() === 'word:sun', r.kept);
  check('broken save: no page errors', !errors.length, errors);
  await ctx.close();
}

// Logs every change of the shared <audio> element's clip.
async function audioUnlock(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  await page.route(/^https?:/, r => r.abort());
  await page.addInitScript(() => {
    localStorage.setItem('pixeltown-guest', '1');
    window.__log = [];
    const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      set(v) { window.__log.push({ src: String(v).split('/').slice(-2).join('/'), playing: !!this.src && !this.paused && !this.ended }); desc.set.call(this, v); },
      get() { return desc.get.call(this); },
    });
  });
  await page.goto(URL);
  await page.waitForFunction(() => typeof Account !== 'undefined' && Account._started);
  await page.click('#title-chips .chip');
  await page.waitForTimeout(800);
  await page.click('#start-btn', { force: true }); // it bobs, so never "stable"
  await page.waitForTimeout(600);
  // A villager talks; while the line plays she taps the scene.
  await page.evaluate(() => { window.__log.length = 0; openDialog(state.scene.npcs.find(n => !n.mount && !n.shop)); });
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => window.__log.length);
  await page.mouse.click(500, 110);
  await page.waitForTimeout(400);
  const log = await page.evaluate(() => window.__log);
  const cut = log.filter(x => x.src.endsWith('silence.mp3') && x.playing);
  check('audio: a tap while a line is playing doesn\'t swap it for silence', !cut.length && before > 0, log);
  await ctx.close();
}

(async () => {
  const browser = await launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  // ONLY=audio node tools/check-flows.js runs the parts whose name has "audio".
  const parts = { parentPauses, parentPassword, brokenSave, audioUnlock };
  try {
    for (const [name, run] of Object.entries(parts)) if (!process.env.ONLY || name.includes(process.env.ONLY)) await run(browser);
  } catch (e) {
    check('ran to the end', false, e.stack || String(e));
  } finally {
    await browser.close();
  }
  console.log(failed ? `${failed} problem(s)` : 'flows OK');
  process.exit(failed ? 1 : 0);
})();
