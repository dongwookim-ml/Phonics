// Flow checks for things that went wrong before, played in Chromium:
//  - the parent panel pauses the game: no walking on, no dialog opening
//    under it, no speech, game timers wait, and closing it leaves the game
//    busy only if something is still showing;
//  - the parent password: wrong, offline (with and without the check kept
//    at login) and server busy each say the right thing;
//  - a broken or edited save never reaches the parent panel as HTML;
//  - the first tap after ▶ doesn't cut off the line being spoken;
//  - today's adventures (js/quest.js), in both editions: three quests she
//    can do are picked, doing each the way she would ticks it, the chest
//    stays shut until all three are done and never opens over a question,
//    it pays once, a reload keeps all of it, and the next day has new ones;
//  - a book she reads herself: tapping words sounds them out, ▶ comes after
//    every word is tapped or a while, reading to the end pays a star once
//    and puts a ✓ on its cover, and a locked book stays locked;
//  - the M3 cards, in both editions: closing one (or the parent panel over
//    it) never frees the game under another or leaves it stuck, the
//    feeding card stops her walk, 🔁 at the pond can't outrun the play
//    limit, a wake is counted, a town left asleep wakes the next morning,
//    no village's friends in the shop before its gate, no fish she'd name
//    with the round's sound by another name (ALIAS), a friend's growth is
//    cheered even after 👋, feeding is counted per tablet.
// Run: node tools/check-flows.js  (needs the playwright package and Chromium)

const fs = require('fs');
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
// `edition` picks the game; `days` lets a test move the clock on by whole
// days (localStorage 'test-days', read as the page loads).
async function game(browser, { seed, user, server, edition, days } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/^https?:/, r => (server ? server(r) : r.abort()));
  await page.addInitScript(([seed, user, fake]) => {
    // Seeded once per context: a flag in localStorage, which a reload keeps
    // (sessionStorage for a file:// page sometimes doesn't, and the seed would
    // then overwrite the save the reload is meant to keep).
    if (localStorage.getItem('test-seeded')) return;
    localStorage.setItem('test-seeded', '1');
    if (user) {
      localStorage.setItem('pixeltown-token', 'token');
      localStorage.setItem('pixeltown-user', user);
      localStorage.setItem('pixeltown-owner', user);
    } else localStorage.setItem('pixeltown-guest', '1');
    if (seed) localStorage.setItem('pixeltown-v2', JSON.stringify(seed));
  }, [seed || null, user || null, FAKE]);
  await page.addInitScript(fake => { window.ACCOUNT_SERVER = fake; }, FAKE);
  if (days) {
    await page.addInitScript(() => {
      const shift = Number(localStorage.getItem('test-days') || 0) * 864e5;
      const D = Date;
      if (shift) window.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + shift])); } static now() { return D.now() + shift; } };
    });
  }
  await page.goto(edition ? `${URL}?edition=${edition}` : URL);
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

// Today's adventures and the chest, played through in one edition. Game
// timers (later) wait in a queue that each step runs, as in check-tts.js,
// so a present or a scene change happens when the step says.
async function quests(browser, edition) {
  // Everything open: the stars for every gate, and fairy dust.
  const seed = { edition, stars: 40, dust: 12, coins: 2 };
  const { page, ctx, errors } = await game(browser, { seed, edition, days: true });
  const setup = () => page.evaluate(() => {
    if (!Sound.muted) Sound.toggleMute();
    window.queue = [];
    later = (ms, fn) => { window.queue.push(fn); };
    window.flush = () => { for (let i = 0; i < 500 && window.queue.length; i++) window.queue.shift()(); };
    // Closes whatever a step left open: a present, a dialog, a scene change.
    window.settle = () => {
      for (let i = 0; i < 5; i++) {
        flush();
        if (!ui.reward.classList.contains('hidden')) acceptReward(false);
        if (state.talking) closeDialog();
      }
    };
    window.cardOpen = () => !document.getElementById('quests').classList.contains('hidden');
  });
  const reload = async () => {
    await page.reload();
    await page.waitForFunction(() => typeof Account !== 'undefined' && Account._started && typeof state !== 'undefined');
    await page.evaluate(() => document.getElementById('start-btn').click());
    await setup();
  };
  await setup();
  const r = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    const out = { chestCoins: QUEST_CHEST.coins };
    const q = questsToday();
    out.picks = q.picks.slice();
    out.day = q.day;
    out.groups = new Set(q.picks.map(k => QUESTS[k].group)).size;
    out.allOpen = q.picks.every(questOpen);
    // A new player is only asked for what she can do: nothing behind a gate,
    // no feeding without a friend, over a month of days.
    const stars = state.stars;
    state.stars = 0;
    state.outfit = Object.assign({}, state.outfit, { fairy: 'none' });
    const seen = new Set();
    const locked = [];
    for (let d = 1; d <= 31; d++) {
      for (const k of questPick(`2026-01-${String(d).padStart(2, '0')}`)) {
        seen.add(k);
        if (QUESTS[k].stars || k === 'feed') locked.push(k);
      }
    }
    out.newPlayer = { seen: [...seen], locked };
    state.stars = stars;
    // Her friend on, for the feeding quest.
    const friend = Object.keys(FAIRIES).find(k => k !== 'none');
    if (!state.owned.fairy.includes(friend)) state.owned.fairy.push(friend);
    state.outfit = Object.assign({}, state.outfit, { fairy: friend });

    // The card never opens over a question; the chest stays shut until all
    // three are done.
    const npc = sceneFor('town').npcs.find(n => !n.mount && !n.shop);
    openDialog(npc);
    openQuests();
    out.overQuestion = cardOpen();
    closeDialog();
    openQuests();
    out.opens = cardOpen();
    out.tiles = document.querySelectorAll('#quests .qs-quest').length;
    const coins0 = state.coins;
    document.querySelector('#quests .qs-chest').click();
    out.early = { coins: state.coins - coins0, chest: questsToday().chest };
    closeQuests();
    out.closed = !cardOpen() && !state.busy;

    // Each kind of quest, done the way she does it: its count goes up.
    const answer = () => {
      changeScene('town');
      settle();
      const who = sceneFor('town').npcs.filter(n => !n.mount && !n.shop)[state.answered % 4];
      Object.assign(who, { waitUntil: 0, missed: null });
      openDialog(who);
      const i = state.question.options.findIndex(o => o.right);
      choose(i, ui.choices.children[i]);
      settle();
    };
    const go = target => {
      for (const n of ['town', 'forest']) {
        const l = (sceneFor(n).links || []).find(x => x.target === target);
        if (!l) continue;
        changeScene(n);
        settle();
        followLink(l);
        settle();
        return;
      }
    };
    const doing = {
      stars: answer,
      gift: answer,
      sticker: answer,
      dust: () => addDust(),
      fish: () => {
        changeScene('town');
        settle();
        openMini(miniFisher());
        miniCatch(mini.items.find(x => x.right && x.state === 'swim'));
        closeMini();
      },
      book: () => { openLibrary(); openBook(BOOKS[0]); bookFinish(); closeLibrary(); },
      feed: () => { state.dust = Math.max(state.dust, 1); openFeed(); feedOnce(); closeFeed(); },
      house: () => {
        changeScene('town');
        settle();
        enterDoor(sceneFor('town').doors.find(d => d.obj && d.obj.info));
        settle();
      },
    };
    let ticks = 0;
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.classList && n.classList.contains('quest-tick')) ticks++; })))
      .observe(document.body, { childList: true });
    out.hooks = {};
    for (const kind of Object.keys(QUESTS)) {
      const run = doing[kind] || (() => go(kind));
      const before = questCount(kind);
      for (let i = 0; i < 12 && !questDone(kind); i++) run();
      out.hooks[kind] = [before, questCount(kind), QUESTS[kind].n];
    }
    changeScene('town');
    settle();
    // The ticks come once she is free, one after another, and are gone.
    await sleep(3500 + 2 * 1400 + 2400 + 1500);
    out.ticked = { shown: ticks, left: document.querySelectorAll('.quest-tick').length };
    out.hud = { on: document.querySelectorAll('#quest-btn .pips i.on').length, ready: document.getElementById('quest-btn').classList.contains('ready') };
    openQuests();
    out.done = document.querySelectorAll('#quests .qs-quest.done').length;
    out.glows = document.querySelector('#quests .qs-chest').classList.contains('ready');
    // Opened: it pays once, a second tap pays nothing.
    const coins1 = state.coins;
    document.querySelector('#quests .qs-chest').click();
    await sleep(300);
    out.paid = state.coins - coins1;
    document.querySelector('#quests .qs-chest').click();
    await sleep(2500);
    out.paidTwice = state.coins - coins1;
    out.opened = { chest: questsToday().chest, prize: document.querySelector('#quests .prize').textContent, hud: document.getElementById('quest-btn').classList.contains('ready') };
    closeQuests();
    out.coins = state.coins;
    out.saved = JSON.parse(localStorage.getItem('pixeltown-v2')).quests;
    return out;
  });
  const tag = `quests (${edition})`;
  check(`${tag}: three quests, one from each group, all she can do`, r.picks.length === 3 && r.groups === 3 && r.allOpen, r);
  check(`${tag}: a new player is never asked for what is still locked`, !r.newPlayer.locked.length && r.newPlayer.seen.length >= 4, r.newPlayer);
  check(`${tag}: the card doesn't open over a question`, !r.overQuestion && r.opens && r.tiles === 3, r);
  check(`${tag}: a shut chest pays nothing before all three are done`, r.early.coins === 0 && !r.early.chest && r.closed, r);
  const unhooked = Object.entries(r.hooks).filter(([, [, after, n]]) => after < n);
  check(`${tag}: doing each kind of quest counts it`, !unhooked.length, r.hooks);
  if (process.env.SHOW) console.log(JSON.stringify(r));
  check(`${tag}: each finished quest ticks once, and the chest glows`, r.ticked.shown === 3 && !r.ticked.left && r.hud.on === 3 && r.hud.ready && r.done === 3 && r.glows, r);
  check(`${tag}: the chest pays once`, r.paid === r.chestCoins && r.paidTwice === r.chestCoins && r.opened.chest && r.opened.prize.includes(`+${r.chestCoins}`) && !r.opened.hud, r);
  check(`${tag}: saved`, !!r.saved && r.saved.day === r.day && r.saved.chest === true && r.saved.picks.join() === r.picks.join(), r.saved);

  // A reload keeps it all; tapping the open chest pays nothing.
  await reload();
  const again = await page.evaluate(async () => {
    const q = questsToday();
    const coins = state.coins;
    openQuests();
    document.querySelector('#quests .qs-chest').click();
    await new Promise(res => setTimeout(res, 300));
    const out = { day: q.day, picks: q.picks.slice(), chest: q.chest, done: q.picks.every(questDone), coins, paid: state.coins - coins, shownOpen: document.querySelector('#quests .qs-chest').classList.contains('opened') };
    closeQuests();
    return out;
  });
  check(`${tag}: a reload keeps the day, the picks, the counts and the open chest`, again.day === r.day && again.picks.join() === r.picks.join() && again.chest && again.done && again.coins === r.coins && !again.paid && again.shownOpen, again);

  // The next day: new quests and a shut chest; the coins stay.
  await page.evaluate(() => localStorage.setItem('test-days', '1'));
  await reload();
  const next = await page.evaluate(() => {
    const q = questsToday();
    return { day: q.day, picks: q.picks.slice(), chest: q.chest, counts: q.picks.map(questCount), coins: state.coins, ready: document.getElementById('quest-btn').classList.contains('ready'), on: document.querySelectorAll('#quest-btn .pips i.on').length };
  });
  check(`${tag}: the next day has new quests and a shut chest`, next.day > r.day && next.picks.length === 3 && !next.chest && next.counts.every(n => n === 0) && !next.ready && !next.on && next.coins === r.coins, next);
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

// The library's shelf of books she reads herself (js/library.js, DECODABLE_BOOKS in js/books.js).
async function selfRead(browser) {
  const { page, ctx, errors } = await game(browser);
  const r = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    // Speech is instant: each line is noted and its callbacks run at once.
    const said = [];
    const say = Sound.say;
    Sound.say = parts => {
      for (const p of [].concat(parts)) {
        if (p && p.text) said.push({ text: p.text, narrator: !!p.narrator });
        if (p && p.call) p.call();
      }
    };
    const $ = s => document.querySelector(s);
    const cover = id => $(`#lib-books .lib-book.self[data-id="${id}"]`);
    const shown = s => !$(s).classList.contains('hidden');
    const out = { stars0: state.stars };
    openLibrary();
    out.covers = document.querySelectorAll('#lib-books .lib-book.self').length;
    out.firstOpen = !cover(DECODABLE_BOOKS[0].id).classList.contains('locked');
    const hard = DECODABLE_BOOKS.find(b => b.level === 3);
    out.hardLocked = cover(hard.id).classList.contains('locked');
    // A locked book says so and doesn't open.
    said.length = 0;
    cover(hard.id).click();
    out.lockedSays = said.some(p => BOOK_LINES.selfLocked.includes(p.text));
    out.lockedStaysShut = !shown('#reader');
    // The first book: every word tapped, then ▶.
    const book = DECODABLE_BOOKS[0];
    cover(book.id).click();
    out.opened = shown('#reader') && $('#reader').classList.contains('self') && library.mode === 'self';
    out.playHidden = $('#rd-play').classList.contains('wait');
    const tokens = decodeTokens(book.pages[0].text);
    const tiles = [...document.querySelectorAll('#rd-text .rd-word')];
    out.tiles = [tiles.length, tokens.length];
    said.length = 0;
    tiles.slice(0, -1).forEach(t => t.click());
    out.playHiddenBeforeLast = $('#rd-play').classList.contains('wait');
    tiles[tiles.length - 1].click();
    const sounded = tokens.find(t => !t.sight);
    const sight = tokens.find(t => t.sight);
    out.soundsOut = decodeSounds(sounded.word).every(s => said.some(p => p.text === `/${s}/`)) && said.some(p => p.text === `${sounded.word.toLowerCase()}!`);
    out.sightSaid = said.some(p => p.text === sight.word.toLowerCase());
    out.playAfterTaps = !$('#rd-play').classList.contains('wait');
    said.length = 0;
    $('#rd-play').click();
    out.playReads = said.some(p => p.text === book.pages[0].text);
    // The next page: no taps, ▶ comes after a while.
    $('#rd-next').click();
    out.page2Waits = library.page === 1 && $('#rd-play').classList.contains('wait');
    await sleep(SELF_PLAY_MS + 600);
    out.page2Play = !$('#rd-play').classList.contains('wait');
    // To the end: a party, a star, and a tap goes on to the way out.
    for (let i = 1; i < book.pages.length; i++) $('#rd-next').click();
    out.party = library.mode === 'selfEnd' && shown('#rd-quiz') && !document.querySelector('#rd-options button');
    out.star = state.stars - out.stars0;
    out.log = Object.assign({}, state.books[`self:${book.id}`]);
    await sleep(100);
    $('#rd-paper').click();
    out.buttonsAfterTap = document.querySelectorAll('#rd-options button').length;
    document.querySelector('#rd-options .rd-wide.yes').click();
    out.tick = !!cover(book.id).querySelector('.tick');
    // Read again: no second star.
    cover(book.id).click();
    for (let i = 0; i < book.pages.length; i++) $('#rd-next').click();
    out.starAgain = state.stars - out.stars0;
    out.readAgain = state.books[`self:${book.id}`].read;
    await sleep(2300);
    out.buttonsAfterWait = document.querySelectorAll('#rd-options button').length;
    document.querySelector('#rd-options .rd-wide.yes').click();
    // Still locked at reading tier 1; open once a parent sets tier 3.
    out.stillLocked = cover(hard.id).classList.contains('locked');
    state.skill.read = Object.assign(Quiz.skill('read'), { t: 3 });
    renderLibrary();
    out.unlocked = !cover(hard.id).classList.contains('locked') && cover(DECODABLE_BOOKS.find(b => b.level === 4).id).classList.contains('locked');
    closeLibrary();
    out.closed = !shown('#reader') && !shown('#library') && !state.busy;
    Sound.say = say;
    out.said = said;
    return out;
  });
  check('reading: 8 books on her shelf, the first open', r.covers === 8 && r.firstOpen, r);
  check('reading: a level 3 book is locked, says so and stays shut', r.hardLocked && r.lockedSays && r.lockedStaysShut, r);
  check('reading: the first book opens with a tile for every word', r.opened && r.tiles[0] === r.tiles[1] && r.tiles[0] > 1, r.tiles);
  check('reading: ▶ waits until she has tapped every word', r.playHidden && r.playHiddenBeforeLast && r.playAfterTaps, r);
  check('reading: a tapped word is sounded out and said, a sight word just said', r.soundsOut && r.sightSaid, r);
  check('reading: ▶ reads the sentence', r.playReads, r);
  check('reading: on a page she doesn\'t tap, ▶ comes after a while', r.page2Waits && r.page2Play, r);
  check('reading: the end is a party, then a tap shows the way out', r.party && r.buttonsAfterTap === 2, r);
  check('reading: the first time to the end pays one star and logs it', r.star === 1 && r.log.read === 1, r);
  check('reading: its cover gets a ✓', r.tick, r);
  check('reading: reading it again pays nothing more', r.starAgain === 1 && r.readAgain === 2 && r.buttonsAfterWait === 2, r);
  check('reading: a locked book stays locked until her reading tier reaches its level', r.stillLocked && r.unlocked, r);
  check('reading: closing the library frees the game', r.closed, r);
  // Everything the narrator said is listed for recording.
  const listed = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'tts-phrases.json'), 'utf8')).filter(p => p.voice === 'af_heart').map(p => p.text));
  const unlisted = [...new Set(r.said.filter(p => p.narrator && !listed.has(p.text.trim())).map(p => p.text))];
  check('reading: every line said is in tools/tts-phrases.json', !unlisted.length, unlisted);
  check('reading: no page errors', !errors.length, errors);
  await ctx.close();
}

// The M3 cards (album, feeding, fishing, quests) with each other and with
// the parent panel: closing one never frees the game under another or
// leaves it stuck; the feeding card stops her walk; the play limit and the
// next morning; the shop before a village opens; fish she'd call by
// another name.
async function cards(browser, edition) {
  const other = edition === 'captain' ? 'princess' : 'captain';
  const seed = { edition, stars: 12, dust: 12, coins: 60, other: { [other]: { edition: other } } };
  const { page, ctx, errors } = await game(browser, { seed, edition });
  const r = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    if (!Sound.muted) Sound.toggleMute();
    const out = {};
    const panel = () => { document.getElementById('parent').click(); document.querySelector('.parent-close').click(); return state.busy; };
    const friend = Object.keys(FAIRIES).find(k => k !== 'none');
    if (!state.owned.fairy.includes(friend)) state.owned.fairy.push(friend);
    state.outfit = Object.assign({}, state.outfit, { fairy: friend });

    // The feeding card over the wardrobe, the wardrobe closed first.
    openWardrobe();
    openFeed();
    closeWardrobe();
    out.feedOverWardrobe = { underFeed: state.busy, panel: panel() };
    closeFeed();
    out.feedOverWardrobe.after = state.busy;
    // The parent panel over the album and over the quest card.
    openAlbum();
    out.album = { panel: panel() };
    closeAlbum();
    out.album.after = state.busy;
    openQuests();
    out.quests = { panel: panel() };
    closeQuests();
    out.quests.after = state.busy;

    // In her room, walking: the feeding card stops her where she is.
    changeScene('yuna');
    await sleep(500);
    let arrived = false;
    const h = state.hero;
    walkTo((c, r) => Math.hypot(c - h.c, r - h.r) > 3, () => { arrived = true; });
    const steps = h.path.length;
    openFeed();
    out.walk = { steps, left: h.path.length, onArrive: !!h.onArrive };
    await sleep(1500);
    out.walk.arrived = arrived;
    closeFeed();
    // The bite that grows her friend, and 👋 before it lands: still celebrated.
    const said = [];
    const say = Sound.say;
    Sound.say = (parts, who) => { [].concat(parts).forEach(p => p && p.text && said.push(p.text)); return say(parts, who); };
    state.friends = { [friend]: FRIEND_STAGES[0] - 1 };
    state.dust = 5;
    openFeed();
    said.length = 0;
    feedOnce();
    closeFeed();
    Sound.say = say;
    out.grow = { stage: friendStage(friend), said, line: fill(LINES.friendGrow[0], {}) };
    // That bite is this tablet's, on top of the plain count it had before.
    out.perDevice = { saved: state.friends[friend], mine: (state.friends[friend] || {})[Progress.device], fed: friendFed(friend), want: FRIEND_STAGES[0] };
    changeScene('town');
    await sleep(500);

    // The play limit while she keeps pressing 🔁 at the pond.
    state.settings.playLimit = 1;
    state.playtime = { day: guideDay(), ms: 0, wakes: 0 };
    openMini(miniFisher());
    state.playtime.ms = 60001;
    document.getElementById('mini-again').click();
    await sleep(300);
    out.again = { mini: !document.getElementById('mini').classList.contains('hidden'), asleep: guide.asleep };
    // A wake by the password is counted, not a reset: a merge can't undo it.
    guideWake();
    out.wake = { ms: state.playtime.ms, wakes: state.playtime.wakes, up: guideTimeUp(), busy: state.busy };
    // Asleep, and the tab stays open overnight: the town wakes in the morning.
    state.playtime.ms = 120001;
    await sleep(300);
    out.night = guide.asleep;
    const D = Date;
    window.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + 864e5])); } static now() { return D.now() + 864e5; } };
    await sleep(400);
    out.morning = { asleep: guide.asleep, shown: !document.getElementById('sleep').classList.contains('hidden'), busy: state.busy, day: state.playtime.day === guideDay(), wakes: state.playtime.wakes | 0 };
    window.Date = D;
    state.settings.playLimit = 0;
    // Today's play time goes with both editions, like her level.
    save();
    const saved = JSON.parse(localStorage.getItem('pixeltown-v2'));
    out.shared = Object.values(saved.other).every(o => JSON.stringify(o.playtime) === JSON.stringify(saved.playtime));

    // The shop: no village's own friends before its gate opens.
    const village = list => list.filter(x => x.item.fairy || x.item.unicorn).map(x => x.value);
    out.shop = { early: village(shopItems()) };
    state.stars = 40;
    out.shop.open = village(shopItems()).length;

    // Fish: no wrong one she'd call by a name that starts with the sound.
    const same = (a, b) => a === b || HARD_PAIRS.same.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    const bad = [];
    for (let i = 0; i < 600; i++) {
      for (const round of miniRounds()) {
        const L = round.info.letter.toLowerCase();
        for (const f of round.fish) if (!f.right && [f.w].concat(ALIAS[f.w] || []).some(m => same(m[0], L))) bad.push(`${L}: ${f.w}`);
      }
    }
    out.fish = [...new Set(bad)];
    out.albumLines = LINES.album;
    return out;
  });
  const tag = `cards (${edition})`;
  const f = r.feedOverWardrobe;
  check(`${tag}: the feeding card over the wardrobe, the wardrobe closed first: busy until the card closes`, f.underFeed && f.panel && f.after === false, f);
  check(`${tag}: the parent panel over the album or the quest card keeps the game busy`, r.album.panel && r.album.after === false && r.quests.panel && r.quests.after === false, r);
  check(`${tag}: the feeding card stops her walk`, r.walk.steps > 1 && r.walk.left <= 1 && !r.walk.onArrive && !r.walk.arrived, r.walk);
  check(`${tag}: 👋 before the growing bite lands: the friend's new stage is still celebrated`, r.grow.stage === 1 && r.grow.said.includes(r.grow.line), r.grow);
  check(`${tag}: feeding is counted per tablet, an earlier plain count kept`, r.perDevice.mine === 1 && r.perDevice.fed === r.perDevice.want, r.perDevice);
  check(`${tag}: 🔁 at the pond past the play limit: the town sleeps`, !r.again.mini && r.again.asleep, r.again);
  check(`${tag}: a parent's wake keeps the minutes and counts the wake`, r.wake.ms >= 60001 && r.wake.wakes === 1 && !r.wake.up && r.wake.busy === false, r.wake);
  check(`${tag}: left asleep overnight, the town wakes in the morning`, r.night && !r.morning.asleep && !r.morning.shown && r.morning.busy === false && r.morning.day && r.morning.wakes === 0, r);
  check(`${tag}: today's play time is saved with both editions`, r.shared);
  check(`${tag}: no fairy or unicorn in the shop before its village opens`, !r.shop.early.length && r.shop.open > 0, r.shop);
  check(`${tag}: no wrong fish she'd name with the round's sound (ALIAS)`, !r.fish.length, r.fish);
  check(`${tag}: the album's narrator line fits the edition`, r.albumLines.every(l => /sticker/.test(l) === (edition !== 'captain')), r.albumLines);
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

(async () => {
  const browser = await launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  // ONLY=audio node tools/check-flows.js runs the parts whose name has "audio".
  const parts = { parentPauses, parentPassword, brokenSave, audioUnlock, quests: b => quests(b, 'princess'), questsCaptain: b => quests(b, 'captain'),
    cards: b => cards(b, 'princess'), cardsCaptain: b => cards(b, 'captain'), selfRead };
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
