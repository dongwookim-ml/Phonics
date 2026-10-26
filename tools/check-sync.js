// Account sync checks: real tablets (Chromium pages) against a local copy
// of server/app.py with an empty database (the merge rules themselves are
// in tools/check-merge.js):
//  - a slow network: uploads go one at a time, no 409, no reload;
//  - two tablets on one account, princess + captain and princess + princess,
//    saving in turn: no reload, and every tablet's stars are kept;
//  - a guest's stars join an account that already has some (with a backup
//    and a note), someone else's synced save is replaced, unsent kept;
//  - a guest who played the other edition joins: her level and the
//    parent's settings stay, in both editions;
//  - a setting, a tier and the picture hints the parent changes on one
//    tablet stay when the other tablet's open tab saves next; the parent
//    panel of a tab open a while shows the other tablet's changes, a change
//    there to one setting keeps the other tablet's to another, and a tap
//    right after a sync came in counts;
//  - a newer save on the server goes into the game on boot, in place;
//  - the day's chest opened on two tablets before they sync pays once;
//  - the deployed game (OLD_REF, default origin/main) next to this one: one
//    tablet each on one account (both editions, both ways round), a guest
//    tablet updated to this version then logging in, a signed-in tablet
//    updated to this version, and answers the deployed game drops put back
//    when this version signs out; a save with this version's new clothes
//    and treasures loads in the deployed game without an error, and the
//    treasure shelf it drops comes back with this version's next save;
//    blending's first steps next to it: her level kept here (two tiers up)
//    and in its own count there, its move counted here, and the letters she
//    knows and her first steps' answers kept;
//  - a tab still on the first release (FIRST_REF, default eee606ec) next to
//    the parent's settings: they stay.
// Run: node tools/check-sync.js  (needs the playwright package and Chromium,
// git, and Python with fastapi and uvicorn; PYTHON picks the interpreter).
// SYNC_SERVER_REF=origin/main plays against that version of server/app.py
// instead (this game must work with the server still deployed).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { launch } = require('./browser');

const root = path.join(__dirname, '..');
const PORT = Number(process.env.SYNC_PORT || 20000 + (process.pid % 20000));
const SERVER = `http://127.0.0.1:${PORT}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const temp = []; // folders to remove at the end
let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || detail === undefined ? '' : `: ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
}

// ---- The server --------------------------------------------------------------

// server/app.py from this checkout, or from git at SYNC_SERVER_REF.
function serverDir() {
  const ref = process.env.SYNC_SERVER_REF;
  if (!ref) return path.join(root, 'server');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixeltown-server-'));
  temp.push(dir);
  const src = spawnSync('git', ['-C', root, 'show', `${ref}:server/app.py`], { maxBuffer: 1 << 26 });
  if (src.status !== 0) throw new Error(`no server/app.py at ${ref}`);
  fs.writeFileSync(path.join(dir, 'app.py'), src.stdout);
  return dir;
}

async function startServer() {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'pixeltown-sync-'));
  temp.push(data);
  const env = Object.assign({}, process.env, { DATA_DIR: data, ALLOWED_ORIGINS: '*', DATABASE_URL: '' });
  const proc = spawn(process.env.PYTHON || 'python3', ['-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', String(PORT)],
    { cwd: serverDir(), env, stdio: ['ignore', 'ignore', 'pipe'] });
  let log = '';
  proc.stderr.on('data', d => { log += d; });
  // Up when it says so itself (not some other server already on the port).
  for (let i = 0; i < 100 && proc.exitCode === null; i++) {
    if (/Uvicorn running/.test(log)) {
      try { if ((await fetch(`${SERVER}/`)).ok) return proc; } catch (e) { /* not yet */ }
    }
    await sleep(100);
  }
  proc.kill();
  throw new Error(`the server did not start on port ${PORT} (SYNC_PORT picks another):\n${log}`);
}

let ipNo = 0;
async function api(method, p, body, token) {
  // A different made-up address per call keeps the per-address signup limit out of the way.
  const headers = { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.88.${++ipNo >> 8 & 255}.${ipNo & 255}` };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(SERVER + p, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
}
let idNo = 0;
async function newAccount() {
  const id = `sync${process.pid % 10000}x${++idNo}`;
  const r = await api('POST', '/auth/signup', { id, pw: 'secret12' });
  if (r.status !== 200) throw new Error(`signup ${r.status}`);
  return { id, pw: 'secret12', token: r.data.token };
}
const serverSave = async acct => (await api('GET', '/save', null, acct.token)).data;
const editionOf = (save, ed) => (save.edition === ed ? save : (save.other || {})[ed]) || {};

// ---- Tablets -------------------------------------------------------------------

const gameUrl = (dir, edition) => `file://${path.join(dir, 'index.html')}${edition === 'captain' ? '?edition=captain' : ''}`;

// A tablet: its own browser storage, optionally seeded before the first
// load, running this game or the one in `dir`.
async function tablet(browser, { edition = 'princess', seed, slowPut = 0, dir = root } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  const t = { page, ctx, loads: 0, n409: 0, errors: [] };
  page.on('pageerror', e => t.errors.push(e.message));
  page.on('framenavigated', f => { if (f === page.mainFrame()) t.loads++; });
  page.on('response', r => { if (r.url().startsWith(SERVER) && r.status() === 409) t.n409++; });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.route(`${SERVER}/save`, async r => {
    if (r.request().method() === 'PUT' && t.slowPut) await sleep(t.slowPut);
    r.continue().catch(() => {});
  });
  t.slowPut = slowPut;
  await page.addInitScript(([server, seed]) => {
    window.ACCOUNT_SERVER = server;
    if (seed && !sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    }
  }, [SERVER, seed || null]);
  await page.goto(gameUrl(dir, edition));
  await page.waitForFunction(() => typeof Account !== 'undefined' && typeof state !== 'undefined');
  return t;
}
async function login(t, acct) {
  const { page } = t;
  if (await page.evaluate(() => document.getElementById('login').classList.contains('hidden'))) {
    await page.evaluate(() => document.querySelector('#account-bar .chip').click());
  }
  await page.fill('#login-id', acct.id);
  await page.fill('#login-pw', acct.pw);
  await page.click('#login-go');
  await page.waitForFunction(() => Account._started && Account.user && document.getElementById('login').classList.contains('hidden'), null, { timeout: 15000 });
}
// Progress as the game makes it: stars, a coin and an answer each, then save().
const earn = (t, n, tag) => t.page.evaluate(([n, tag]) => {
  for (let i = 0; i < n; i++) {
    state.stars++;
    state.coins++;
    state.history[`word:${tag}${state.stars}`] = { kind: 'word', tries: 1, right: 1, wrong: 0, last: Date.now() };
  }
  save();
}, [n, tag]);
// Lets a tablet send what it has (and merge what the server has).
const settle = t => t.page.evaluate(async () => { save(); for (let i = 0; i < 3 && Account._dirty; i++) await Account._upload(); });
// The parent panel, opened with the account's password: `use` taps in it.
async function parentPanel(t, acct, use) {
  await t.page.evaluate(() => document.getElementById('parent').click());
  await t.page.fill('.parent-pw', acct.pw);
  await t.page.click('.parent-go');
  await t.page.waitForSelector('.parent-kinds');
  await use(t.page);
  await t.page.evaluate(() => document.querySelector('.parent-close').click());
}
const spellTier = (page, step) => page.click(`.tier-btn[data-kind="spell"][data-step="${step}"]`);
// Her spelling tier and the two-syllable setting, live or in a save's edition.
const parentView = t => t.page.evaluate(() => ({ spell: Quiz.skill('spell').t, two: !!(state.settings || {}).twoSyllables }));
const parentSaved = e => ({ spell: ((e.skill || {}).spell || {}).t, two: !!(e.settings || {}).twoSyllables });
const live = t => t.page.evaluate(() => ({ stars: state.stars, coins: state.coins, history: Object.keys(state.history).length, name: PLAYER.shown,
  start: !document.getElementById('start').classList.contains('hidden'), dirty: !!localStorage.getItem('pixeltown-dirty') }));

async function slowNetwork(browser) {
  const acct = await newAccount();
  const t = await tablet(browser);
  await login(t, acct);
  await t.page.evaluate(() => document.getElementById('start-btn').click());
  await sleep(2600);
  const loads = t.loads;
  t.slowPut = 3000;
  await earn(t, 1, 'a');
  await sleep(2600); // the present, 2.6 s after the right answer
  await earn(t, 1, 'b');
  await sleep(11000);
  const s = await serverSave(acct);
  check('slow network: no 409', t.n409 === 0, t.n409);
  check('slow network: no reload, still playing', t.loads === loads && !(await live(t)).start, t.loads - loads);
  check('slow network: both stars on the server', s.save.stars === 2, s.save.stars);
  await t.ctx.close();
}

async function twoTablets(browser, editionB) {
  const acct = await newAccount();
  const A = await tablet(browser, { edition: 'princess' });
  const B = await tablet(browser, { edition: editionB });
  await login(A, acct);
  await login(B, acct);
  for (const t of [A, B]) await t.page.evaluate(() => document.getElementById('start-btn').click());
  await sleep(2500);
  const loads = [A.loads, B.loads];
  const rounds = 8;
  for (let i = 0; i < rounds; i++) {
    await earn(A, 1, 'a');
    await sleep(1300);
    await earn(B, 1, 'b');
    await sleep(1300);
  }
  await sleep(2500);
  await settle(A);
  await settle(B);
  await settle(A);
  const s = (await serverSave(acct)).save;
  const [a, b] = [await live(A), await live(B)];
  const name = `princess + ${editionB}`;
  check(`${name}: no reload during play`, A.loads === loads[0] && B.loads === loads[1] && !a.start && !b.start, [A.loads - loads[0], B.loads - loads[1]]);
  check(`${name}: they did conflict (409s merged)`, A.n409 + B.n409 > 0, A.n409 + B.n409);
  if (editionB === 'captain') {
    check(`${name}: each edition keeps its stars`, a.stars === rounds && b.stars === rounds && editionOf(s, 'princess').stars === rounds && editionOf(s, 'captain').stars === rounds,
      { a: a.stars, b: b.stars, server: [editionOf(s, 'princess').stars, editionOf(s, 'captain').stars] });
  } else {
    check(`${name}: stars add up on both tablets and the server`, a.stars === 2 * rounds && b.stars === 2 * rounds && s.stars === 2 * rounds && Object.keys(s.history).length === 2 * rounds,
      { a: a.stars, b: b.stars, server: s.stars, answers: Object.keys(s.history).length });
  }
  check(`${name}: no page errors`, !A.errors.length && !B.errors.length, A.errors.concat(B.errors));
  await A.ctx.close();
  await B.ctx.close();
}

const guestSave = (stars, coins, answers) => ({
  edition: 'princess', stars, coins, at: Date.now() - 3600e3, player: { shown: '서연', spoken: 'Seoyeon', title: 'princess', look: 'girl' },
  history: Object.fromEntries(Array.from({ length: answers }, (_, i) => [`word:g${i}`, { kind: 'word', tries: 2, right: 1, wrong: 1, last: Date.now() - i * 1e6 }])),
});

async function guestJoins(browser) {
  const acct = await newAccount();
  // The account already has a little progress, from another device.
  await api('PUT', '/save', { save: guestSave(3, 2, 3), base: 0 }, acct.token);
  const t = await tablet(browser, { seed: { 'pixeltown-v2': guestSave(42, 17, 60), 'pixeltown-guest': '1' } });
  const loads = t.loads;
  await login(t, acct);
  await sleep(1500);
  const after = await live(t);
  const toast = await t.page.evaluate(() => (document.querySelector('.account-toast') || {}).textContent || '');
  const backups = await t.page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('pixeltown-v2-backup-')).length);
  const s = (await serverSave(acct)).save;
  check('guest login: stars, coins and answers join the account', after.stars === 45 && after.coins === 19 && after.history === 60 && s.stars === 45,
    { live: after, server: s.stars });
  check('guest login: a note for the parent', toast.includes('42'), toast);
  check('guest login: a backup of the guest save', backups === 1, backups);
  check('guest login: no reload', t.loads === loads, t.loads - loads);
  await t.ctx.close();
}

async function otherOwner(browser) {
  // Someone else's progress, already on the server (her sign-in ran out, and
  // the login screen is up): the new account starts fresh.
  const acct = await newAccount();
  const seed = { 'pixeltown-v2': guestSave(9, 0, 5), 'pixeltown-owner': 'someone' };
  let t = await tablet(browser, { seed });
  let loads = t.loads;
  await login(t, acct);
  await sleep(800);
  let after = await live(t);
  check('another owner\'s synced save: a fresh start, in place', after.stars === 0 && after.history === 0 && after.name !== '서연' && t.loads === loads, { after, reloads: t.loads - loads });
  await t.ctx.close();
  // Someone else's progress that never reached the server comes along.
  const acct2 = await newAccount();
  t = await tablet(browser, { seed: Object.assign({}, seed, { 'pixeltown-dirty': '1' }) });
  loads = t.loads;
  await login(t, acct2);
  await sleep(800);
  after = await live(t);
  check('another owner\'s unsent save is carried, not dropped', after.stars === 9 && (await serverSave(acct2)).save.stars === 9 && t.loads === loads, after);
  await t.ctx.close();
}

async function guestOtherEdition(browser) {
  // The account has princess progress only, and the parent set spelling to
  // tier 3 and two-syllable spelling there.
  const acct = await newAccount();
  const A = await tablet(browser);
  await login(A, acct);
  await A.page.evaluate(() => document.getElementById('start-btn').click());
  await parentPanel(A, acct, async page => { await page.click('[data-set="two"]:not(.on)'); await spellTier(page, 1); await spellTier(page, 1); });
  await earn(A, 2, 'a');
  await settle(A);
  await A.ctx.close();
  // A guest plays the robot game on another tablet, then the parent signs in there.
  const t = await tablet(browser, { edition: 'captain', seed: { 'pixeltown-guest': '1' } });
  await t.page.evaluate(() => document.getElementById('start-btn').click());
  await earn(t, 2, 'g');
  await login(t, acct);
  await sleep(1000);
  await settle(t);
  const after = await parentView(t);
  const s = (await serverSave(acct)).save;
  const saved = ['princess', 'captain'].map(ed => parentSaved(editionOf(s, ed)));
  check('guest in the other edition → login: her level and the parent\'s settings stay, in both editions', [after].concat(saved).every(v => v.spell === 3 && v.two),
    { live: after, server: saved });
  check('guest in the other edition → login: no page errors', !A.errors.length && !t.errors.length, A.errors.concat(t.errors));
  await t.ctx.close();
}

async function parentChanges(browser) {
  // Two tablets in step: two-syllable spelling on, spelling at tier 3.
  const acct = await newAccount();
  const A = await tablet(browser);
  await login(A, acct);
  await A.page.evaluate(() => document.getElementById('start-btn').click());
  await parentPanel(A, acct, async page => { await page.click('[data-set="two"]:not(.on)'); await spellTier(page, 1); await spellTier(page, 1); });
  await settle(A);
  const B = await tablet(browser);
  await login(B, acct);
  await B.page.evaluate(() => document.getElementById('start-btn').click());
  // A reloads; the parent turns two syllables off and lowers spelling to 2.
  await A.page.reload();
  await A.page.waitForFunction(() => typeof Account !== 'undefined' && Account._started);
  await A.page.evaluate(() => document.getElementById('start-btn').click());
  await parentPanel(A, acct, async page => { await page.click('[data-set="two"]:not(.on)'); await spellTier(page, -1); });
  await settle(A);
  // The child answers on B's open tab, on its old copy: one save.
  const loads = B.loads;
  await earn(B, 1, 'b');
  await settle(B);
  const s = (await serverSave(acct)).save;
  const b = await parentView(B);
  await A.page.reload();
  await A.page.waitForFunction(() => typeof Account !== 'undefined' && Account._started);
  const a = await parentView(A);
  const want = v => v.spell === 2 && !v.two;
  check('parent changes on one tablet: the other tablet\'s next save keeps them', want(parentSaved(s)) && want(b) && want(a) && B.loads === loads,
    { server: parentSaved(s), B: b, A: a });
  check('parent changes on one tablet: no page errors', !A.errors.length && !B.errors.length, A.errors.concat(B.errors));
  await A.ctx.close();
  await B.ctx.close();
}

// The settings and her spelling tier, live or in a save's edition.
const settingsView = t => t.page.evaluate(() => ({ limit: state.settings.playLimit, mute: state.settings.hideMute, pictures: state.pictures, spell: Quiz.skill('spell').t }));
const settingsSaved = e => ({ limit: (e.settings || {}).playLimit, mute: (e.settings || {}).hideMute, pictures: e.pictures, spell: ((e.skill || {}).spell || {}).t });
const reloaded = async t => {
  await t.page.reload();
  await t.page.waitForFunction(() => typeof Account !== 'undefined' && Account._started);
};

async function stalePanel(browser) {
  // Two tablets in step. On A the parent sets 15 minutes and turns the
  // picture hints off, and the child's spelling climbs to tier 4. Later the
  // parent opens the panel on B, whose tab has been open since before.
  const acct = await newAccount();
  const A = await tablet(browser);
  await login(A, acct);
  await A.page.evaluate(() => document.getElementById('start-btn').click());
  await settle(A);
  const B = await tablet(browser);
  await login(B, acct);
  await B.page.evaluate(() => document.getElementById('start-btn').click());
  await parentPanel(A, acct, async page => { await page.click('[data-set="limit"][data-v="15"]'); await page.click('[data-set="pictures"][data-v="0"]'); });
  await A.page.evaluate(() => { Object.assign(Quiz.skill('spell'), { t: 4, best: 4, n: 40, placed: true }); save(); });
  await settle(A);
  let shown;
  await parentPanel(B, acct, async page => {
    shown = await page.evaluate(() => ({ limit: document.querySelector('[data-set="limit"].on').textContent, pictures: document.querySelector('[data-set="pictures"].on').textContent,
      spell: document.querySelector('.tier-btn[data-kind="spell"]').parentElement.querySelector('.tier-n b').textContent }));
    await page.click('[data-set="mute"][data-v="1"]');
    await spellTier(page, 1);
  });
  await settle(B);
  check('a panel open a while: it shows the other tablet\'s changes', shown.limit === '15분' && shown.pictures === '끄기' && shown.spell === '4', shown);
  // The child answers on A's open tab, on its old copy: one save.
  await earn(A, 1, 'a');
  await settle(A);
  const s = settingsSaved((await serverSave(acct)).save);
  const b = await settingsView(B);
  await reloaded(A);
  const a = await settingsView(A);
  const want = v => v.limit === 15 && v.mute === true && v.pictures === false && v.spell === 5;
  check('a panel open a while: a change there keeps the other tablet\'s, and the next save there keeps both', want(s) && want(a) && want(b), { server: s, A: a, B: b });
  check('a panel open a while: no page errors', !A.errors.length && !B.errors.length, A.errors.concat(B.errors));
  await A.ctx.close();
  await B.ctx.close();
}

async function panelAfterSync(browser) {
  // The panel is open on A while the child saves on B; the parent sets 15
  // minutes (A's save is refused, and the two are put together), then hides
  // the 🔊 button: once is enough.
  const acct = await newAccount();
  const A = await tablet(browser);
  await login(A, acct);
  await A.page.evaluate(() => document.getElementById('start-btn').click());
  await settle(A);
  const B = await tablet(browser);
  await login(B, acct);
  await B.page.evaluate(() => document.getElementById('start-btn').click());
  let after;
  await parentPanel(A, acct, async page => {
    await earn(B, 1, 'b');
    await settle(B);
    await page.click('[data-set="limit"][data-v="15"]');
    await page.evaluate(async () => { for (let i = 0; i < 3 && Account._dirty; i++) await Account._upload(); });
    await page.click('[data-set="mute"][data-v="1"]');
    after = await page.evaluate(() => ({ mute: state.settings.hideMute, on: document.querySelector('[data-set="mute"].on').textContent, stars: state.stars }));
  });
  check('a tap in the panel right after a sync came in counts', A.n409 > 0 && after.mute === true && after.on === '숨기기' && after.stars === 1, Object.assign(after, { n409: A.n409 }));
  await A.ctx.close();
  await B.ctx.close();
}

async function newerOnBoot(browser) {
  // This tablet was signed in and in sync at version 1; another device has
  // saved since. On boot the newer save goes into the game without a reload.
  const acct = await newAccount();
  const first = await api('PUT', '/save', { save: guestSave(5, 0, 5), base: 0 }, acct.token);
  const newer = Object.assign(guestSave(8, 1, 8), { player: { shown: '하나', spoken: 'Hana', title: 'queen', look: 'girl' } });
  await api('PUT', '/save', { save: newer, base: first.data.updated }, acct.token);
  const t = await tablet(browser, { seed: { 'pixeltown-v2': guestSave(5, 0, 5), 'pixeltown-token': acct.token, 'pixeltown-user': acct.id,
    'pixeltown-owner': acct.id, 'pixeltown-updated': String(first.data.updated) } });
  await t.page.waitForFunction(() => Account._started, null, { timeout: 15000 });
  await sleep(500);
  const after = await t.page.evaluate(() => ({ stars: state.stars, name: document.getElementById('name-input').value, title: PLAYER.title }));
  check('boot: a newer save on the server goes in, in place', after.stars === 8 && after.name === '하나' && after.title === 'queen' && t.loads === 1, Object.assign(after, { loads: t.loads }));
  await t.ctx.close();
}

async function chestTwice(browser) {
  // Today's three quests done on A; B hears of them on its next save, so
  // both show the chest ready. It is opened on A, then on B before B hears
  // of that: each tablet shows its coins, and the chest pays once.
  const acct = await newAccount();
  const A = await tablet(browser);
  const B = await tablet(browser);
  await login(A, acct);
  await login(B, acct);
  for (const t of [A, B]) await t.page.evaluate(() => { document.getElementById('start-btn').click(); if (!Sound.muted) Sound.toggleMute(); });
  const loads = [A.loads, B.loads];
  await A.page.evaluate(() => { for (const k of questsToday().picks) questAdd(k, QUESTS[k].n); });
  await settle(A);
  await earn(B, 1, 'b');
  await settle(B);
  const ready = await B.page.evaluate(() => questReady());
  const before = (await serverSave(acct)).save.coins;
  const open = t => t.page.evaluate(async () => {
    const coins = state.coins;
    openQuests();
    document.querySelector('#quests .qs-chest').click();
    await new Promise(r => setTimeout(r, 300));
    closeQuests();
    return state.coins - coins;
  });
  const paid = [await open(A)];
  await settle(A);
  paid.push(await open(B));
  await settle(B);
  await settle(A);
  const s = (await serverSave(acct)).save;
  const [a, b] = [await live(A), await live(B)];
  check('the day\'s chest opened on both tablets before they synced: each shows its coins, and it pays once', ready && paid.join() === '5,5' &&
    s.coins === before + 5 && a.coins === s.coins && b.coins === s.coins && s.quests.chest === true, { ready, paid, before, server: s.coins, a: a.coins, b: b.coins });
  check('the day\'s chest on both tablets: no reload, no page errors', A.loads === loads[0] && B.loads === loads[1] && !A.errors.length && !B.errors.length, A.errors.concat(B.errors));
  await A.ctx.close();
  await B.ctx.close();
}

// ---- The deployed game next to this one --------------------------------------

// The game as deployed (OLD_REF, default origin/main) in a folder of its own,
// with this checkout's recordings. null when that ref isn't here. Tabs on
// the first release (FIRST_REF) may still share an account too.
const OLD_REF = process.env.OLD_REF || 'origin/main';
const FIRST_REF = process.env.FIRST_REF || 'eee606ec';
function deployedGame(ref = OLD_REF) {
  if (spawnSync('git', ['-C', root, 'rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).status !== 0) return null;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixeltown-deployed-'));
  temp.push(dir);
  const tar = spawnSync('git', ['-C', root, 'archive', '--format=tar', ref, 'index.html', 'js', 'css'], { maxBuffer: 1 << 28 });
  if (tar.status !== 0 || spawnSync('tar', ['-x', '-C', dir], { input: tar.stdout }).status !== 0) throw new Error(`git archive ${ref} failed`);
  fs.symlinkSync(path.join(root, 'audio'), path.join(dir, 'audio'));
  return dir;
}

// The older game reloads itself on every conflict, so an answer there may
// land in the middle of a reload: try again on the next page.
async function earnOld(t, tag) {
  for (let i = 0; i < 6; i++) {
    try {
      await t.page.waitForFunction(() => typeof state !== 'undefined' && typeof save === 'function' && typeof Account !== 'undefined' && Account._started, null, { timeout: 15000 });
      await earn(t, 1, tag);
      return;
    } catch (e) {
      await sleep(500);
    }
  }
}
// Stars in one edition of the server's save, and that edition's answers tagged `tag`.
const tagged = (save, ed, tag) => ({ stars: editionOf(save, ed).stars, answers: Object.keys(editionOf(save, ed).history || {}).filter(k => k.startsWith(`word:${tag}`)).length });

async function withDeployed(browser, deployed, oldEdition) {
  const newEdition = oldEdition === 'princess' ? 'captain' : 'princess';
  const name = `deployed ${oldEdition} + new ${newEdition}`;
  const acct = await newAccount();
  const O = await tablet(browser, { edition: oldEdition, dir: deployed });
  const N = await tablet(browser, { edition: newEdition });
  await login(O, acct);
  await login(N, acct);
  for (const t of [O, N]) await t.page.evaluate(() => document.getElementById('start-btn').click()).catch(() => {});
  await sleep(2500);
  const loads = [O.loads, N.loads];
  const rounds = 6;
  for (let i = 0; i < rounds; i++) {
    await earnOld(O, 'o');
    await sleep(1500);
    await earn(N, 1, 'n');
    await sleep(1500);
  }
  // Let both send what they have (the older one may reload on the way).
  let s;
  for (let i = 0; i < 12; i++) {
    await sleep(2500);
    await settle(N).catch(() => {});
    s = (await serverSave(acct)).save;
    const o = tagged(s, oldEdition, 'o');
    if (o.stars === o.answers && o.answers >= rounds && tagged(s, newEdition, 'n').stars === rounds) break;
  }
  const o = tagged(s, oldEdition, 'o');
  const n = tagged(s, newEdition, 'n');
  check(`${name}: the new tablet's stars are all there`, n.stars === rounds && n.answers === rounds, n);
  check(`${name}: the deployed tablet's stars are all there`, o.stars === o.answers && o.answers >= rounds, o);
  check(`${name}: the new tablet never reloads`, N.loads === loads[1] && !(await live(N)).start, N.loads - loads[1]);
  check(`${name}: the deployed tablet doesn't keep reloading`, O.loads - loads[0] <= 2 * rounds + 2, O.loads - loads[0]);
  check(`${name}: the new tablet's edition is fmt 2 on the server`, editionOf(s, newEdition).fmt === 2, editionOf(s, newEdition).fmt);
  check(`${name}: no page errors on the new tablet`, !N.errors.length, N.errors);
  await O.ctx.close();
  await N.ctx.close();
}

async function guestUpdated(browser, deployed) {
  // A guest plays the deployed game, the tablet gets this version, then logs in.
  const acct = await newAccount();
  await api('PUT', '/save', { save: guestSave(3, 2, 3), base: 0 }, acct.token);
  const t = await tablet(browser, { dir: deployed, seed: { 'pixeltown-guest': '1' } });
  await t.page.evaluate(() => document.getElementById('start-btn').click());
  await earn(t, 7, 'g');
  await t.page.goto(gameUrl(root));
  await t.page.waitForFunction(() => typeof Account !== 'undefined' && Account._started && typeof state !== 'undefined');
  const before = await live(t);
  const loads = t.loads;
  await login(t, acct);
  await sleep(1500);
  const after = await live(t);
  const s = (await serverSave(acct)).save;
  check('deployed guest → this version → login: the guest\'s 7 stars join the account\'s 3', before.stars === 7 && after.stars === 10 && s.stars === 10 && t.loads === loads,
    { before: before.stars, after: after.stars, server: s.stars });
  await t.ctx.close();
}

async function signedInUpdated(browser, deployed) {
  // A tablet signed in on the deployed game gets this version.
  const acct = await newAccount();
  const t = await tablet(browser, { dir: deployed });
  await login(t, acct);
  await t.page.evaluate(() => document.getElementById('start-btn').click());
  await earn(t, 4, 's');
  await sleep(3500); // its upload
  await t.page.goto(gameUrl(root));
  await t.page.waitForFunction(() => typeof Account !== 'undefined' && Account._started && typeof state !== 'undefined');
  const loads = t.loads;
  await t.page.evaluate(() => document.getElementById('start-btn').click());
  await earn(t, 1, 's');
  await settle(t);
  const after = await live(t);
  const s = (await serverSave(acct)).save;
  check('deployed, signed in → this version: progress kept, and the save becomes fmt 2', after.stars === 5 && s.stars === 5 && s.fmt === 2 && t.loads === loads,
    { live: after.stars, server: s.stars, fmt: s.fmt });
  await t.ctx.close();
}

async function deployedLogout(browser, deployed) {
  // This version answers questions of a kind the deployed game doesn't know
  // (longBlend, the Monster Village's long vowels), and the parent changes a
  // setting and a tier here; a deployed tab on the same account and edition
  // drops the answers from the server's copy when it saves, and puts back
  // its older tier. This tablet then signs out while in step: its copy goes
  // back up first.
  const acct = await newAccount();
  const N = await tablet(browser);
  const O = await tablet(browser, { dir: deployed });
  await login(N, acct);
  await login(O, acct);
  for (const t of [N, O]) await t.page.evaluate(() => document.getElementById('start-btn').click()).catch(() => {});
  await parentPanel(N, acct, async page => { await page.click('[data-set="two"]:not(.on)'); await spellTier(page, 1); });
  await N.page.evaluate(() => {
    for (const w of ['cake', 'bee']) state.history[`longBlend:${w}`] = { kind: 'longBlend', tries: 1, right: 1, wrong: 0, last: Date.now() };
    save();
  });
  await settle(N);
  for (let i = 0; i < 2; i++) {
    await earnOld(O, 'o');
    await settle(O).catch(() => {});
  }
  const blends = save => Object.keys(editionOf(save, 'princess').history || {}).filter(k => k.startsWith('longBlend:')).length;
  const before = blends((await serverSave(acct)).save);
  await Promise.all([N.page.waitForNavigation({ timeout: 15000 }), N.page.evaluate(() => Account.logout())]).catch(() => {});
  const s = (await serverSave(acct)).save;
  const p = parentSaved(editionOf(s, 'princess'));
  check('deployed tab drops answers it doesn\'t know: this version signing out puts them back', blends(s) === 2 && tagged(s, 'princess', 'o').answers === 2,
    { before, after: blends(s), deployed: tagged(s, 'princess', 'o') });
  check('deployed tab next to the parent\'s changes: they are kept', p.spell === 2 && p.two, p);
  check('deployed tab + this version signing out: no page errors', !N.errors.length && !O.errors.length, N.errors.concat(O.errors));
  await O.ctx.close();
  await N.ctx.close();
}

async function deployedBlend(browser, deployed) {
  // Blending's first steps (js/quiz.js): a child who played blend before
  // (three-letter words and up, tier 2 in its old count) keeps her level
  // here, two tiers up; the deployed game on the same account reads and
  // moves blending in its own count, and this version reads its move two
  // up; the letters she knows (skill) and her first steps' answers
  // (history, which the deployed game drops) come back.
  const acct = await newAccount();
  const sk = (t, n) => ({ t, best: t, w: [], last: [], placed: true, easy: false, n });
  await api('PUT', '/save', { save: { edition: 'princess', fmt: 2, stars: 20, earned: { _: { stars: 20 } }, spent: {}, skill: { blend: sk(2, 30) },
    history: { 'blend:cat': { kind: 'blend', tries: 3, right: 2, wrong: 1, last: 5 } } }, base: 0 }, acct.token);
  const N = await tablet(browser);
  const O = await tablet(browser, { dir: deployed });
  await login(N, acct);
  await login(O, acct);
  for (const t of [N, O]) await t.page.evaluate(() => document.getElementById('start-btn').click()).catch(() => {});
  const view = t => t.page.evaluate(() => ({ t: Quiz.skill('blend').t, known: typeof Quiz.letters === 'function' ? Quiz.letters().filter(x => x.known).map(x => x.l).join('') : null }));
  const first = { here: await view(N), deployed: await view(O) };
  // Here she gets to know n, s and t; there blending moves up a tier.
  await N.page.evaluate(() => {
    for (const l of 'NST') state.skill.letters[l] = { right: 2, hit: 10, last: 10 };
    state.history['oneSound:s'] = { kind: 'oneSound', tries: 2, right: 2, wrong: 0, last: 10 };
    save();
  });
  await settle(N);
  for (let i = 0; i < 2; i++) {
    await O.page.evaluate(() => { const k = Quiz.skill('blend'); Object.assign(k, { t: 3, best: 3, n: (k.n | 0) + 5 }); save(); }).catch(() => {});
    await earnOld(O, 'o');
    await settle(O).catch(() => {});
  }
  await settle(N);
  const after = { here: await view(N), deployed: await view(O).catch(() => null) };
  await Promise.all([N.page.waitForNavigation({ timeout: 15000 }), N.page.evaluate(() => Account.logout())]).catch(() => {});
  const e = editionOf((await serverSave(acct)).save, 'princess');
  const saved = { blend: ((e.skill || {}).blend || {}).t, first: ((e.skill || {}).blendFirst || {}).t, letters: Object.keys((e.skill || {}).letters || {}).sort().join(''), answer: !!(e.history || {})['oneSound:s'] };
  check('deployed tab next to blending\'s first steps: a child who played blend keeps her level here, the deployed game its own count', first.here.t === 4 && first.deployed.t === 2, first);
  check('deployed tab next to blending\'s first steps: its move counts here two up, and the letters she knows stay', after.here.t === 5 && after.here.known === 'nst', after);
  check('deployed tab next to blending\'s first steps: the account keeps both counts, the letters and the answers', saved.blend === 3 && saved.first === 3 && saved.letters === 'NST' && saved.answer, saved);
  check('deployed tab next to blending\'s first steps: no page errors', !N.errors.length && !O.errors.length, N.errors.concat(O.errors));
  await O.ctx.close();
  await N.ctx.close();
}

async function firstRelease(browser, first) {
  // A tab on the first release (which knows no settings) loaded the save
  // before the parent set anything. She sets 15 minutes and hides the 🔊
  // button on this version's tablet; then the child answers on the old tab,
  // which puts its own old values back beside her stamps.
  const acct = await newAccount();
  const N = await tablet(browser);
  await login(N, acct);
  await N.page.evaluate(() => document.getElementById('start-btn').click());
  await earn(N, 1, 'n');
  await settle(N);
  const O = await tablet(browser, { dir: first });
  await login(O, acct);
  await O.page.evaluate(() => document.getElementById('start-btn').click()).catch(() => {});
  await parentPanel(N, acct, async page => { await page.click('[data-set="limit"][data-v="15"]'); await page.click('[data-set="mute"][data-v="1"]'); });
  await settle(N);
  await earnOld(O, 'o');
  for (let i = 0; i < 8 && !tagged((await serverSave(acct)).save, 'princess', 'o').answers; i++) {
    await sleep(1000);
    await settle(O).catch(() => {});
  }
  const left = settingsSaved((await serverSave(acct)).save);
  await reloaded(N);
  const n = await settingsView(N);
  const F = await tablet(browser);
  await login(F, acct);
  const f = await settingsView(F);
  const want = v => v.limit === 15 && v.mute === true;
  check('first release next to the parent\'s settings: it put its old values back', left.limit === 0, left);
  check('first release next to the parent\'s settings: they stay, on this tablet and on a new one', want(n) && want(f), { N: n, new: f });
  check('first release next to the parent\'s settings: no page errors here', !N.errors.length && !F.errors.length, N.errors.concat(F.errors));
  for (const t of [N, O, F]) await t.ctx.close();
}

async function deployedWardrobe(browser, deployed) {
  // This version dresses a boy in a suit and a helmet and gives him
  // treasures; the deployed game on the same account loads that save, wears
  // what it knows instead, keeps the new things in its lists and opens its
  // wardrobe without an error. It saves without the treasure shelf (a slot
  // it doesn't know); this version's next save puts the shelf back.
  const acct = await newAccount();
  const N = await tablet(browser);
  await login(N, acct);
  await N.page.evaluate(() => {
    document.getElementById('start-btn').click();
    setPlayer({ title: 'knight', look: 'boy' });
    wearLook();
    const now = { shape: 'suit', head: 'helmet', hand: 'shield', back: 'redcape', hair: 'mint', dress: 'navy' };
    for (const [slot, v] of Object.entries(now)) state.owned[slot].push(v);
    state.owned.treasure.push('shell', 'kite');
    state.outfit = Object.assign({}, state.outfit, now);
    save();
  });
  await settle(N);
  const O = await tablet(browser, { dir: deployed });
  await login(O, acct);
  await O.page.evaluate(() => document.getElementById('start-btn').click()).catch(() => {});
  const old = await O.page.evaluate(() => {
    state.scene = sceneFor('yuna');
    openWardrobe();
    closeWardrobe();
    const known = Object.entries(state.outfit).every(([slot, v]) => !WARDROBE.some(w => w.slot === slot) || WARDROBE.find(w => w.slot === slot).items[v]);
    return { look: PLAYER.look, known, kept: state.owned.shape.includes('suit') && state.owned.head.includes('helmet') };
  });
  await earnOld(O, 'o');
  await settle(O).catch(() => {});
  const shelf = save => (editionOf(save, 'princess').owned || {}).treasure || [];
  const afterOld = shelf((await serverSave(acct)).save).length;
  await earn(N, 1, 'n');
  await settle(N);
  const s = editionOf((await serverSave(acct)).save, 'princess');
  const owned = s.owned || {};
  check('deployed tab loads a save with new clothes: a boy in things it knows, the new ones kept in its lists', old.look === 'boy' && old.known && old.kept, old);
  check(`deployed tab + this version: the treasure shelf (${afterOld} after the deployed tab saved) and the new clothes are all there after both save`,
    ['shell', 'kite'].every(v => (owned.treasure || []).includes(v)) && (owned.shape || []).includes('suit'), owned);
  // Then this tablet signs out (nothing here holds the shelf any more) and
  // the deployed tab saves twice: the shelf's own copy (`shelf`, a field the
  // deployed game keeps as it is) brings it back on a new tablet.
  await Promise.all([N.page.waitForNavigation({ timeout: 15000 }), N.page.evaluate(() => Account.logout())]).catch(() => {});
  for (let i = 0; i < 2; i++) {
    await earnOld(O, 'o');
    await settle(O).catch(() => {});
  }
  const left = shelf((await serverSave(acct)).save).length;
  const F = await tablet(browser);
  await login(F, acct);
  const fresh = await F.page.evaluate(() => state.owned.treasure);
  check(`deployed tab saving after this tablet signed out (the shelf ${left} in its save): a new tablet still has the treasures`,
    ['shell', 'kite'].every(v => fresh.includes(v)), fresh);
  check('deployed tab + this version\'s wardrobe: no page errors', !N.errors.length && !O.errors.length && !F.errors.length, N.errors.concat(O.errors, F.errors));
  await F.ctx.close();
  await O.ctx.close();
  await N.ctx.close();
}

(async () => {
  let server = null;
  let browser = null;
  try {
    server = await startServer();
    browser = await launch();
  } catch (e) {
    if (server) server.kill();
    console.log(`FAIL ${e.message}`);
    process.exit(1);
  }
  let deployed = null;
  try { deployed = deployedGame(); } catch (e) { check('the deployed game could be unpacked', false, e.message); }
  if (!deployed) check(`the deployed game (${OLD_REF}) is here`, !process.env.CI, `git has no ${OLD_REF}; fetch it (CI checks out with fetch-depth 0)`);
  let first = null;
  try { first = deployedGame(FIRST_REF); } catch (e) { check('the first release could be unpacked', false, e.message); }
  if (!first) check(`the first release (${FIRST_REF}) is here`, !process.env.CI, `git has no ${FIRST_REF}; fetch it (CI checks out with fetch-depth 0)`);
  // ONLY=guest node tools/check-sync.js runs the parts whose name has "guest".
  const parts = { slowNetwork, princessCaptain: b => twoTablets(b, 'captain'), princessPrincess: b => twoTablets(b, 'princess'), guestJoins, otherOwner, guestOtherEdition, parentChanges,
    stalePanel, panelAfterSync, newerOnBoot, chestTwice };
  if (deployed) {
    Object.assign(parts, {
      deployedPrincess: b => withDeployed(b, deployed, 'princess'),
      deployedCaptain: b => withDeployed(b, deployed, 'captain'),
      deployedGuestUpdated: b => guestUpdated(b, deployed),
      deployedSignedInUpdated: b => signedInUpdated(b, deployed),
      deployedLogout: b => deployedLogout(b, deployed),
      deployedWardrobe: b => deployedWardrobe(b, deployed),
      deployedBlend: b => deployedBlend(b, deployed),
    });
  }
  if (first) parts.firstRelease = b => firstRelease(b, first);
  try {
    for (const [name, run] of Object.entries(parts)) if (!process.env.ONLY || name.includes(process.env.ONLY)) await run(browser);
  } catch (e) {
    check('ran to the end', false, e.stack || String(e));
  } finally {
    await browser.close();
    server.kill();
    for (const dir of temp) fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(failed ? `${failed} problem(s)` : 'sync OK');
  process.exit(failed ? 1 : 0);
})();
