// Flow checks for things that went wrong before, played in Chromium:
//  - the parent panel pauses the game: no walking on, no dialog opening
//    under it, no speech, game timers wait, and closing it leaves the game
//    busy only if something is still showing;
//  - the parent password: wrong, offline (with and without the check kept
//    at login) and server busy each say the right thing;
//  - a broken or edited save never reaches the parent panel as HTML;
//  - the first tap after ▶ doesn't cut off the line being spoken;
//  - today's adventures (js/quest.js), in both editions: three quests she
//    can do are picked, doing each the way she would ticks it (a sticker
//    pack's stickers count too), the chest stays shut until all three are
//    done and never opens over a question, it pays once, a reload keeps all
//    of it, and the next day has new ones; at the edges: a pick she can no
//    longer do is swapped when the account's copy comes in (never as she
//    plays), a card left open overnight shows the new day, and a chest an
//    older tab says is shut stays open and pays nothing more;
//  - the robot's cave fight: closing the parent panel while the dialog is
//    stepped aside for the laser or the shield keeps the game busy, and ✕
//    or the end of the fight frees it;
//  - the Crystal Cave monsters' magic (princess edition): a wrong answer has
//    the monster cast at her after the hint, a right answer its last spell,
//    her star and the poof, both with the dialog stepped aside; the parent
//    panel over a spell keeps the game busy, ✕ or the poof frees it, and ✕
//    during the praise still pays the coins;
//  - a book she reads herself: tapping a word says it whole (no letter
//    sounds), ▶ comes after every word is tapped or a while, reading to the
//    end pays a star once and puts a ✓ on its cover, each time counts for
//    the 📖 quest and the star for the ⭐ one, all levels are open from
//    the start in both the shelf and parent panel;
//  - a tap outside a card (js/game.js), in both editions at the iPad sizes
//    and on a phone held sideways, with a finger and the mouse: it closes
//    the cards she only looks at and never a question, a present, a book
//    being read, the fishing game or the sleeping town; the game is free
//    (or still busy) as it should be, she doesn't walk, nothing under the
//    card is tapped or pressed, and a tap while the chest opens, stickers
//    fly in or her friend celebrates only ends that;
//  - the M3 cards, in both editions: closing one (or the parent panel over
//    it) never frees the game under another or leaves it stuck, the
//    feeding card stops her walk, neither 🔁 at the pond nor another book in
//    the library can outrun the play limit, a wake is counted and gives a
//    whole limit from then on (even with the minutes far past it, and
//    after a merge), a town left asleep wakes the next morning, no
//    village's friends in the shop before its gate, no fish she'd name
//    with the round's sound by another name (ALIAS), a friend's growth is
//    cheered even after 👋, feeding is counted per tablet;
//  - the little games (js/minigame.js, js/village-games.js), the pond's
//    and each village's, in both editions: each starts from its host's
//    dialog in its own place and nobody else's (not a look-alike at home);
//    the first round says what to do and shows the finger until she tries
//    one; a miss gets the hint and a second shows the answer; five rounds
//    won pay the coins once and count for today's games quest; the card
//    keeps the game busy and the music down until 👋 and frees it after;
//    it never opens past the play limit and 🔁 there puts the town to
//    sleep; the questions come at her tier, capped like the village asks
//    it, and playing moves no tier and records no answer; no page errors,
//    and every line said is listed for recording;
//  - presents, for a girl, a boy and the robot: every villager gives in
//    turn until nobody has anything new; never a repeat (also from a
//    villager whose own unicorn or fairy is hers), always something that
//    suits the hero, a village's treasures only from there, and the
//    wardrobe's count full at the end; the shop and wardrobe only show
//    things that suit the hero;
//  - the background music (js/music.js), in both editions: it starts only
//    after the first tap, and only once the town is on screen; it drops
//    quickly while a line is said and comes back slowly after, stays down
//    for the whole of a question (and the fishing game), follows 🔊, the
//    parent panel's pause, its 배경 음악 setting (stamped, saved, and the
//    newer stamp wins from another tablet), a hidden page and the sleeping
//    town, and a new place crossfades with a handful of voices at most;
//  - the monsters she drew herself (js/kid-monsters.js), in both editions:
//    each draws in every frame and as a villager, with its ♪ clear of it;
//    its dialog shows her drawing (loaded) where the portrait goes, inside
//    the dialog and off the cards at the iPad sizes and on a phone held
//    sideways; anyone else's shows the portrait; closing hides it; a tap
//    shows it big and any tap (or the dialog stepping aside) closes that;
//  - the first blending steps (js/quiz.js, js/blend-magic.js), in both
//    editions: a new child starts on one sound, every question there is one
//    sound and a picture that starts with it, and she moves up to two sounds
//    only once she knows all 24 letters (never on a run of right answers);
//    the sound magic shows once when she first reaches two sounds and
//    three, never again after a reload, and after a second miss on a blend
//    question (in the dialog and in the Unicorn game) as the answer; the
//    game stays busy and a tap outside never closes it, the parent panel
//    pauses it, the play limit waits for it; the Unicorn game's end card
//    shows her letters, a new one lit, and all 24 open the two-sound step.
// Run: node tools/check-flows.js  (needs the playwright package and Chromium)

const fs = require('fs');
const http = require('http');
const path = require('path');
const { launch } = require('./browser');

const root = path.join(__dirname, '..');
// The game is served over http on localhost, as it is deployed: a file://
// page sometimes finds an older localStorage after a reload (Chromium),
// which made the reload checks fail now and then.
let HOST;
let URL;
function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(new globalThis.URL(req.url, 'http://x').pathname));
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => {
    HOST = `http://127.0.0.1:${server.address().port}/`;
    URL = `${HOST}index.html`;
    ok(server);
  }));
}
// Requests to the game itself go through; anything else is the test's.
const own = r => r.request().url().startsWith(HOST);
const FAKE = 'http://127.0.0.1:9'; // an account server that never answers for real
let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || detail === undefined ? '' : `: ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
}

// A page playing as a guest (or signed in, with `user`), the start screen gone
// (still showing with `start: false`). `edition` picks the game; `days` lets
// a test move the clock on by whole days (localStorage 'test-days', read as
// the page loads); `viewport` sizes the screen, and `touch` lets it be tapped
// with a finger (page.touchscreen).
async function game(browser, { seed, user, server, edition, days, start = true, viewport = { width: 1024, height: 768 }, touch = false } = {}) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/^https?:/, r => (own(r) ? r.continue() : server ? server(r) : r.abort()));
  await page.addInitScript(([seed, user, fake]) => {
    // Seeded once per context (a flag in localStorage).
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
  // The game as it is the rest of the year (Halloween has its own check).
  await page.goto(`${URL}?halloween=0${edition ? `&edition=${edition}` : ''}`);
  await page.waitForFunction(() => typeof Account !== 'undefined' && Account._started && typeof state !== 'undefined');
  if (start) await page.evaluate(() => document.getElementById('start-btn').click());
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
  await page.route(/^https?:/, r => (own(r) ? r.continue() : r.abort()));
  await page.addInitScript(() => {
    localStorage.setItem('pixeltown-guest', '1');
    window.__log = [];
    const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      set(v) { window.__log.push({ src: String(v).split('/').slice(-2).join('/'), playing: !!this.src && !this.paused && !this.ended }); desc.set.call(this, v); },
      get() { return desc.get.call(this); },
    });
  });
  await page.goto(`${URL}?halloween=0`);
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
  // Everything open: the stars for every gate (the Monster Village's party
  // already had), and fairy dust.
  const seed = { edition, stars: 40, dust: 12, coins: 2, guide: { step: 3, opened: { monster: true } } };
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
    // The page's last localStorage writes (a save, test-days) can still be on
    // their way when a reload starts at once, and the new page would miss them.
    await page.waitForTimeout(500);
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
    // (Counters fresh too: the gates count every star earned.)
    const { stars, tally } = state;
    Object.assign(state, { stars: 0, tally: Progress.tally({}) });
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
    Object.assign(state, { stars, tally });
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
        miniCatch(mini.items.find(x => x.right && x.state === 'live'));
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
    // A sticker pack (a full gift meter with no present left) counts its
    // new stickers for 📒 too.
    const stickers = [questCount('sticker'), Object.keys(state.stickers).length];
    stickerPack();
    out.pack = [questCount('sticker') - stickers[0], Object.keys(state.stickers).length - stickers[1]];
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
  check(`${tag}: a sticker pack's new stickers count for the sticker quest`, r.pack[1] === 3 && r.pack[0] === 3, r.pack);
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

// Today's adventures at the edges: quests picked from this tablet's old
// copy before the account's came in, a card left open overnight, and a
// chest that a tab still on an older version says is shut again.
async function questEdges(browser, edition) {
  const seed = { edition, stars: 40, dust: 12 };
  const { page, ctx, errors } = await game(browser, { seed, edition });
  const r = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    if (!Sound.muted) Sound.toggleMute();
    const out = {};
    const shown = sel => document.querySelector(sel).classList;
    const friend = Object.keys(FAIRIES).find(k => k !== 'none');
    if (!state.owned.fairy.includes(friend)) state.owned.fairy.push(friend);
    const wear = key => { state.outfit = Object.assign({}, state.outfit, { fairy: key }); };
    wear(friend);
    state.friends = {};
    // A copy comes in with the account's: her friend grew up on the other tablet.
    const synced = quests => {
      save();
      const s = JSON.parse(localStorage.getItem('pixeltown-v2'));
      s.friends = { [friend]: { dOther: FRIEND_STAGES[FRIEND_STAGES.length - 1] } };
      if (quests) s.quests = quests;
      applyProgress(s);
      return questsToday().picks.slice();
    };
    // This tablet picked today's from its own copy: feed her friend. Taking
    // the friend off a moment swaps nothing as she plays.
    const day = questDay();
    state.quests = { day, picks: ['stars', 'feed', 'house'], got: {}, chest: false };
    renderQuestHud();
    wear('none');
    renderQuestHud();
    out.asShePlays = questsToday().picks.slice();
    wear(friend);
    const picks = synced();
    out.synced = { picks, grown: friendGrown(friend), group: QUESTS[picks[1]].group, open: picks.every(questOpen), card: document.querySelectorAll('#quest-btn .pips i:not(.hidden)').length };
    // One she has already done stays, though she couldn't do it now.
    out.doneStays = synced({ day, picks: ['stars', 'feed', 'house'], got: { dOther: { feed: 1 } }, chest: false });
    state.quests = { day, picks: picks.slice(), got: {}, chest: false };
    renderQuestHud();

    // Evening: all three done, the card open with the chest glowing, and the
    // tablet put down until the morning.
    for (const k of questsToday().picks) questAdd(k, QUESTS[k].n);
    const today = questsToday();
    await sleep(100);
    openQuests();
    out.evening = shown('#quests .qs-chest').contains('ready');
    const D = Date;
    const days = n => { window.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + n * 864e5])); } static now() { return D.now() + n * 864e5; } }; };
    days(1);
    questMinute(); // the minute's refresh, past midnight
    const card = () => ({ day: document.querySelector('#quests .qs-list').dataset.day === questsToday().day, glows: shown('#quests .qs-chest').contains('ready'),
      done: document.querySelectorAll('#quests .qs-quest.done').length, hud: shown('#quest-btn').contains('ready') });
    out.morning = card();
    // A day later still, before the minute's refresh: the first tap on the chest shows the new day.
    days(2);
    const said = [];
    const say = Sound.say;
    Sound.say = (parts, who) => { said.push(parts); return say(parts, who); };
    const coins0 = state.coins;
    document.querySelector('#quests .qs-chest').click();
    out.tap = Object.assign(card(), { paid: state.coins - coins0, said: said.length });
    Sound.say = say;
    window.Date = D;
    closeQuests();
    state.quests = today;

    // Opened here; then a tab still on an older version puts back chest:
    // false (its copy from before): open all the same, and it pays nothing.
    openQuests();
    const coins1 = state.coins;
    document.querySelector('#quests .qs-chest').click();
    await sleep(300);
    out.paid = state.coins - coins1;
    closeQuests();
    save();
    const s = JSON.parse(localStorage.getItem('pixeltown-v2'));
    s.quests = Object.assign({}, s.quests, { chest: false });
    const coins2 = state.coins;
    applyProgress(s);
    out.shutAgain = { chest: questsToday().chest, ready: questReady(), hud: shown('#quest-btn').contains('ready') };
    openQuests();
    document.querySelector('#quests .qs-chest').click();
    await sleep(300);
    Object.assign(out.shutAgain, { paid: state.coins - coins2, opened: shown('#quests .qs-chest').contains('opened') });
    closeQuests();
    out.chestCoins = QUEST_CHEST.coins;
    return out;
  });
  const tag = `quest edges (${edition})`;
  check(`${tag}: taking her friend off doesn't swap the quest as she plays`, r.asShePlays.includes('feed'), r.asShePlays);
  check(`${tag}: a pick she can no longer do (her friend grew on the other tablet) is swapped when the account's copy comes in`,
    r.synced.grown && !r.synced.picks.includes('feed') && r.synced.group === 'play' && r.synced.open && r.synced.card === 3, r.synced);
  check(`${tag}: one she has already done stays`, r.doneStays.includes('feed'), r.doneStays);
  check(`${tag}: the card left open overnight shows the new day at the minute's refresh`, r.evening && r.morning.day && !r.morning.glows && !r.morning.done && !r.morning.hud, r.morning);
  check(`${tag}: and at the first tap on its chest, which says nothing and pays nothing`, r.tap.day && !r.tap.glows && !r.tap.paid && !r.tap.said, r.tap);
  check(`${tag}: a chest put back shut by an older tab stays open and pays nothing more`, r.paid === r.chestCoins && r.shutAgain.chest && !r.shutAgain.ready && !r.shutAgain.hud &&
    !r.shutAgain.paid && r.shutAgain.opened, r.shutAgain);
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

// The robot's fight with a cave villain (js/captain-cave.js): the dialog
// steps aside for the laser and the shield, and closing the parent panel
// then never frees the game under the fight; ✕ and the end of the fight
// still leave it free.
async function caveFight(browser) {
  const { page, ctx, errors } = await game(browser, { seed: { edition: 'captain', stars: 40 }, edition: 'captain' });
  await page.evaluate(() => { if (!Sound.muted) Sound.toggleMute(); changeScene('dungeon'); });
  await page.waitForTimeout(800);
  const r = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    const shown = id => !document.getElementById(id).classList.contains('hidden');
    const until = async (ok, ms = 8000) => { for (let t = 0; t < ms && !ok(); t += 100) await sleep(100); return ok(); };
    const out = {};
    const v = state.scene.npcs.find(n => n.monster);
    placeHero(v.c + 1, v.r);
    // A question answered with a tap on a card (not letter tiles).
    const ask = () => {
      for (let i = 0; i < 20 && (!state.question || state.question.tiles); i++) {
        if (state.talking) closeDialog();
        openDialog(v);
      }
    };
    const tap = right => { ask(); const i = state.question.options.findIndex(o => !!o.right === right); choose(i, ui.choices.children[i]); };
    // The parent panel over what the robot says, closed after the fight's
    // own timer has come due: the dialog steps aside as it closes.
    const panel = async () => { document.getElementById('parent').click(); await sleep(1500); document.querySelector('.parent-close').click(); };
    const now = () => ({ aside: !shown('dialog') && state.talking === v, busy: state.busy });
    tap(true);
    await panel();
    out.hit = now();
    openAlbum();
    out.hit.album = shown('album');
    if (out.hit.album) closeAlbum();
    out.next = await until(() => shown('dialog') && !state.question.done);
    tap(false);
    await panel();
    out.miss = now();
    out.back = await until(() => shown('dialog') && !state.question.locked);
    // ✕ on the villain's dialog: free again, not stuck.
    ui.close.click();
    out.closed = { busy: state.busy, talking: !!state.talking };
    // The rest of the fight, to the end.
    for (let i = 0; i < 8 && !v.caught; i++) {
      tap(true);
      await until(() => v.caught || (shown('dialog') && !state.question.done));
    }
    await until(() => !state.talking);
    out.end = { caught: !!v.caught, busy: state.busy, talking: !!state.talking, dialog: shown('dialog') };
    return out;
  });
  check('cave fight: the parent panel closed while the laser fires: still busy, no card opens under the fight', r.hit.aside && r.hit.busy && !r.hit.album && r.next, r);
  check('cave fight: the same while the shield blocks a miss', r.miss.aside && r.miss.busy && r.back, r);
  check('cave fight: ✕ on the villain\'s dialog frees the game', r.closed.busy === false && !r.closed.talking, r.closed);
  check('cave fight: the villain gives up and the game is free', r.end.caught && r.end.busy === false && !r.end.talking && !r.end.dialog, r.end);
  check('cave fight: no page errors', !errors.length, errors);
  await ctx.close();
}

// The Crystal Cave monsters' magic in the princess edition (js/cave-magic.js):
// a wrong answer has the monster cast a spell at her with the dialog
// stepped aside, then the same question again; a right answer its last
// spell, her star, a giggle, a twirl and the poof. The parent panel opened
// and closed over a spell never frees the game; ✕ and the poof do, and ✕
// during the praise still pays the coins.
async function caveMagic(browser) {
  const { page, ctx, errors } = await game(browser, { seed: { stars: 40 } });
  await page.evaluate(() => { if (!Sound.muted) Sound.toggleMute(); changeScene('dungeon'); });
  await page.waitForTimeout(800);
  const r = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    const shown = id => !document.getElementById(id).classList.contains('hidden');
    const until = async (ok, ms = 8000) => { for (let t = 0; t < ms && !ok(); t += 100) await sleep(100); return ok(); };
    const out = {};
    // Each part of a spell as it starts, and each move of the monsters.
    const fx = [];
    const push = magicFx.push;
    magicFx.push = (...a) => { a.forEach(f => fx.push(f.kind)); return push.apply(magicFx, a); };
    const moves = [];
    for (const n of state.scene.npcs) {
      let spell = null;
      Object.defineProperty(n, 'spell', { get: () => spell, set: x => { spell = x; moves.push(`${n.look}:${x ? x.kind : '-'}`); } });
    }
    const [v, w] = state.scene.npcs.filter(n => n.monster);
    // A question answered with a tap on a card (not letter tiles).
    const ask = n => {
      for (let i = 0; i < 20 && (!state.question || state.question.tiles); i++) {
        if (state.talking) closeDialog();
        openDialog(n);
      }
    };
    const tap = (n, right) => { ask(n); const i = state.question.options.findIndex(o => !!o.right === right); choose(i, ui.choices.children[i]); return i; };
    // The parent panel over what the monster says, closed after the spell's
    // own timer has come due: the dialog steps aside as it closes.
    const panel = async ms => { document.getElementById('parent').click(); await sleep(ms); document.querySelector('.parent-close').click(); };
    const now = () => ({ aside: !shown('dialog') && state.talking === v, busy: state.busy, spell: v.spell && v.spell.kind });
    // Busy the whole time the dialog is away, checked every 100 ms.
    let freed = false;
    const watch = () => { if (state.talking && !shown('dialog') && !state.busy) freed = true; };

    placeHero(v.c + 1, v.r);
    const hp = state.answered;
    const wrong = tap(v, false);
    const q = state.question;
    out.first = { aside: !shown('dialog'), fx: fx.length }; // she hears the hint first
    await panel(1500);
    out.miss = now();
    openAlbum();
    out.miss.album = shown('album');
    if (out.miss.album) closeAlbum();
    // The panel again in the middle of the spell.
    await panel(300);
    out.miss.again = now();
    out.back = await until(() => { watch(); return shown('dialog') && !state.question.locked; });
    out.miss.freed = freed;
    out.miss.fx = fx.splice(0);
    out.miss.moves = moves.splice(0);
    out.miss.same = state.question === q && ui.choices.children[wrong].disabled && !q.done && state.answered === hp;
    // ✕ on the monster's dialog: free again, not stuck.
    ui.close.click();
    out.closed = { busy: state.busy, talking: !!state.talking };

    // Right: its last spell, her star, the poof and the coins.
    const coins = state.coins;
    freed = false;
    tap(v, true);
    await panel(1500);
    out.hit = now();
    await panel(300);
    out.hit.again = now();
    await until(() => { watch(); return !state.talking; }, 10000);
    out.hit.freed = freed;
    out.end = { caught: !!v.caught, gone: !state.scene.npcs.includes(v), coins: state.coins - coins, busy: state.busy, talking: !!state.talking, dialog: shown('dialog'),
      answered: state.answered - hp, fx: fx.splice(0), moves: moves.splice(0), alive: !!monsterFrameCache[v.look] };

    // ✕ during the praise: free at once, and it still goes poof and pays.
    placeHero(w.c + 1, w.r);
    const before = state.coins;
    tap(w, true);
    ui.close.click();
    out.early = { busy: state.busy, talking: !!state.talking };
    out.early.gone = await until(() => !state.scene.npcs.includes(w));
    Object.assign(out.early, { coins: state.coins - before, busy2: state.busy, fx: fx.splice(0) });
    return out;
  });
  const order = (list, want) => want.every((k, i) => list.indexOf(k) >= 0 && (i === 0 || list.indexOf(k) > list.indexOf(want[i - 1])));
  check('cave magic: a wrong answer: the hint first, then the monster casts with the dialog stepped aside', !r.first.aside && !r.first.fx && r.miss.aside &&
    order(r.miss.fx, ['gather', 'bolt', 'bubble', 'burst']) && order(r.miss.moves, [`${r.miss.moves[0].split(':')[0]}:windup`, `${r.miss.moves[0].split(':')[0]}:hop`]), r.miss);
  check('cave magic: the parent panel closed during the spell: still busy, no card opens under it', r.miss.busy && r.miss.again.aside && r.miss.again.busy && !r.miss.album && !r.miss.freed, r.miss);
  check('cave magic: then the same question again, the wrong card greyed', r.back && r.miss.same, r);
  check('cave magic: ✕ on the monster\'s dialog frees the game', r.closed.busy === false && !r.closed.talking, r.closed);
  check('cave magic: a right answer: its last spell, her star, a giggle and a twirl, the panel never freeing it', r.hit.aside && r.hit.busy && r.hit.again.aside && r.hit.again.busy && !r.hit.freed &&
    order(r.end.fx, ['gather', 'bolt', 'bubble', 'burst', 'charge', 'wand', 'hearts']) && order(r.end.moves.map(m => m.split(':')[1]), ['windup', 'hop', 'giggle', 'twirl', '-']), r);
  check('cave magic: it goes poof, pays coins and the game is free', r.end.caught && r.end.gone && r.end.coins >= 1 && r.end.answered === 1 && r.end.busy === false &&
    !r.end.talking && !r.end.dialog && r.end.alive, r.end);
  check('cave magic: ✕ during the praise frees the game, and it still goes poof and pays', r.early.busy === false && !r.early.talking && r.early.gone && r.early.coins >= 1 &&
    r.early.busy2 === false && !r.early.fx.length, r.early);
  check('cave magic: no page errors', !errors.length, errors);
  await ctx.close();
}

// The library's shelf of books she reads herself (js/library.js, DECODABLE_BOOKS in js/books.js).
async function selfRead(browser) {
  const { page, ctx, errors } = await game(browser);
  const r = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    // Speech is instant: each line is noted (with the word tile lit as it
    // starts, if one is) and its callbacks run at once.
    const said = [];
    const say = Sound.say;
    Sound.say = parts => {
      const lit = document.querySelector('#rd-text .rd-word.on .g.lit');
      for (const p of [].concat(parts)) {
        if (p && p.text) said.push({ text: p.text, narrator: !!p.narrator, lit: lit ? lit.textContent : null });
        if (p && p.call) p.call();
      }
    };
    const $ = s => document.querySelector(s);
    const cover = id => $(`#lib-books .lib-book.self[data-id="${id}"]`);
    const shown = s => !$(s).classList.contains('hidden');
    const out = { stars0: state.stars };
    const quest = () => ({ book: questCount('book'), stars: questCount('stars') });
    out.quest = [quest()];
    openLibrary();
    out.covers = document.querySelectorAll('#lib-books .lib-book.self').length;
    out.firstOpen = !cover(DECODABLE_BOOKS[0].id).classList.contains('locked');
    const hard = DECODABLE_BOOKS.find(b => b.level === 3);
    out.hardLocked = cover(hard.id).classList.contains('locked');
    // Higher-level books also open immediately.
    said.length = 0;
    cover(hard.id).click();
    out.lockedSays = said.some(p => BOOK_LINES.selfLocked.includes(p.text));
    out.higherOpened = shown('#reader') && library.book.id === hard.id;
    closeLibrary();
    openLibrary();
    // The first book: every word tapped, then ▶.
    const book = DECODABLE_BOOKS[0];
    cover(book.id).click();
    out.opened = shown('#reader') && $('#reader').classList.contains('self') && library.mode === 'self';
    out.playHidden = $('#rd-play').classList.contains('wait');
    const tokens = decodeTokens(book.pages[0].text);
    const tiles = [...document.querySelectorAll('#rd-text .rd-word')];
    out.tiles = [tiles.length, tokens.length];
    // Each tap says just its word, whole, its tile lit: "cat!" (the
    // narrator's clip), a sight word as it is; never a letter's sound.
    const tap = t => { const n = said.length; t.click(); return said.slice(n).map(p => `${p.text}|${p.lit}|${p.narrator}`); };
    const plain = w => (w === 'I' ? w : w.toLowerCase());
    const want = tokens.map(t => [`${t.sight ? plain(t.word) : `${plain(t.word)}!`}|${t.word}|true`]);
    said.length = 0;
    const heard = tiles.slice(0, -1).map(tap);
    out.playHiddenBeforeLast = $('#rd-play').classList.contains('wait');
    heard.push(tap(tiles[tiles.length - 1]));
    out.words = { heard, want, sounds: said.filter(p => /^\/.+\/$/.test(p.text)).map(p => p.text), sight: tokens.some(t => t.sight), plain: tokens.some(t => !t.sight) };
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
    out.quest.push(quest());
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
    out.quest.push(quest());
    await sleep(2300);
    out.buttonsAfterWait = document.querySelectorAll('#rd-options button').length;
    document.querySelector('#rd-options .rd-wide.yes').click();
    // Changing reading tier keeps all books open and preserves shelf scroll.
    out.stillLocked = cover(hard.id).classList.contains('locked');
    const top = DECODABLE_BOOKS.find(b => b.level === 4);
    const list = $('#lib-books');
    list.scrollTop = list.scrollHeight;
    const scrolled = list.scrollTop;
    $('#parent').click();
    parentStats(); // past the password
    for (let i = 0; i < 2; i++) $('.parent-panel .tier-btn[data-kind="read"][data-step="1"]').click();
    const chip = b => [...document.querySelectorAll('.parent-panel .l-chip')].find(c => c.textContent.includes(b.title)).textContent;
    out.panel = { tier: Quiz.skill('read').t, hard: chip(hard), top: chip(top) };
    $('.parent-close').click();
    out.unlocked = { hard: !cover(hard.id).classList.contains('locked'), top: !cover(top.id).classList.contains('locked'), scroll: [scrolled, list.scrollTop] };
    closeLibrary();
    out.closed = !shown('#reader') && !shown('#library') && !state.busy;
    Sound.say = say;
    out.said = said;
    return out;
  });
  check('reading: 8 books on her shelf, the first open', r.covers === 8 && r.firstOpen, r);
  check('reading: higher-level books open immediately without a lock message', !r.hardLocked && !r.lockedSays && r.higherOpened, r);
  check('reading: the first book opens with a tile for every word', r.opened && r.tiles[0] === r.tiles[1] && r.tiles[0] > 1, r.tiles);
  check('reading: ▶ waits until she has tapped every word', r.playHidden && r.playHiddenBeforeLast && r.playAfterTaps, r);
  const w = r.words;
  check('reading: a tapped word is just said whole ("cat!"), its tile lit, a sight word as it is, no letter sounds',
    JSON.stringify(w.heard) === JSON.stringify(w.want) && !w.sounds.length && w.sight && w.plain, w);
  check('reading: ▶ reads the sentence', r.playReads, r);
  check('reading: on a page she doesn\'t tap, ▶ comes after a while', r.page2Waits && r.page2Play, r);
  check('reading: the end is a party, then a tap shows the way out', r.party && r.buttonsAfterTap === 2, r);
  check('reading: the first time to the end pays one star and logs it', r.star === 1 && r.log.read === 1, r);
  check('reading: its cover gets a ✓', r.tick, r);
  check('reading: reading it again pays nothing more', r.starAgain === 1 && r.readAgain === 2 && r.buttonsAfterWait === 2, r);
  const [q0, q1, q2] = r.quest;
  check('reading: each time to the end counts for the 📖 quest, the star once for the ⭐ quest', q1.book - q0.book === 1 && q2.book - q0.book === 2 && q1.stars - q0.stars === 1 && q2.stars - q0.stars === 1, r.quest);
  check('reading: every level stays open when reading tier changes', !r.stillLocked && r.panel.tier === 3 && r.unlocked.hard && r.unlocked.top, r);
  check('reading: parent panel shows all levels open and library keeps its scroll', r.panel.hard.includes('열림') && r.panel.top.includes('열림') && r.unlocked.scroll[0] === r.unlocked.scroll[1], r.panel);
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
    // A whole limit after the wake it sleeps again, and the tab stays open
    // overnight: the town wakes in the morning.
    state.playtime.ms = state.playtime.woke.ms + 60000;
    await sleep(300);
    out.night = guide.asleep;
    const D = Date;
    window.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + 864e5])); } static now() { return D.now() + 864e5; } };
    await sleep(400);
    out.morning = { asleep: guide.asleep, shown: !document.getElementById('sleep').classList.contains('hidden'), busy: state.busy, day: state.playtime.day === guideDay(), wakes: state.playtime.wakes | 0 };
    window.Date = D;
    // The library past the play limit: another book closes it, and the town sleeps.
    state.playtime = { day: guideDay(), ms: 0, wakes: 0 };
    openLibrary();
    const libOpen = !document.getElementById('library').classList.contains('hidden');
    state.playtime.ms = 60001;
    openLibrary(); // 📚 다른 책 읽기
    await sleep(300);
    out.library = { libOpen, shut: ['library', 'reader'].every(id => document.getElementById(id).classList.contains('hidden')), asleep: guide.asleep };
    if (guide.asleep) guideWake();
    // The limit set late, with today's minutes already far past it (2.5
    // limits): a wake still gives a whole limit from then on, and the other
    // tablet's copy, without the wake, can't take it back.
    state.playtime = { day: guideDay(), ms: 150000, wakes: 0 };
    await sleep(300);
    out.late = { asleep: guide.asleep };
    guideWake();
    await sleep(300);
    Object.assign(out.late, { woke: !guide.asleep, up: guideTimeUp() });
    save();
    const mine = JSON.parse(localStorage.getItem('pixeltown-v2'));
    const theirs = JSON.parse(JSON.stringify(mine));
    for (const e of [theirs].concat(Object.values(theirs.other))) e.playtime = { day: guideDay(), ms: state.playtime.ms + 1000, wakes: 0 };
    applyProgress(Progress.merge(mine, theirs, 'theirs'));
    await sleep(300);
    Object.assign(out.late, { merged: !guide.asleep && !guideTimeUp(), wakes: state.playtime.wakes });
    state.playtime.ms = state.playtime.woke.ms + 60000;
    await sleep(300);
    out.late.again = guide.asleep;
    if (guide.asleep) guideWake();
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
    // The fisherman asks for a stop three times (/b/ /b/ /b/), any other sound once.
    const sounds = parts => parts.filter(p => p.text && /^\/\w+\/$/.test(p.text)).map(p => p.text).join(' ');
    out.fishAsk = ['b', 'g', 'm', 's'].map(l => `${l}: ${sounds(miniQuestion({ info: { letter: l.toUpperCase() } }))}`);
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
  check(`${tag}: another book past the play limit closes the library, and the town sleeps`, r.library.libOpen && r.library.shut && r.library.asleep, r.library);
  check(`${tag}: a parent's wake keeps the minutes and counts the wake`, r.wake.ms >= 60001 && r.wake.wakes === 1 && !r.wake.up && r.wake.busy === false, r.wake);
  check(`${tag}: left asleep overnight, the town wakes in the morning`, r.night && !r.morning.asleep && !r.morning.shown && r.morning.busy === false && r.morning.day && r.morning.wakes === 0, r);
  check(`${tag}: the limit set late, minutes far past it: a wake gives a whole limit from then on, and a merge can't take it back`,
    r.late.asleep && r.late.woke && !r.late.up && r.late.merged && r.late.wakes === 1 && r.late.again, r.late);
  check(`${tag}: today's play time is saved with both editions`, r.shared);
  check(`${tag}: no fairy or unicorn in the shop before its village opens`, !r.shop.early.length && r.shop.open > 0, r.shop);
  check(`${tag}: no wrong fish she'd name with the round's sound (ALIAS)`, !r.fish.length, r.fish);
  check(`${tag}: at the pond a stop is asked three times (/b/ /b/ /b/), a long sound once`,
    r.fishAsk.join('; ') === 'b: /b/ /b/ /b/; g: /g/ /g/ /g/; m: /m/; s: /s/', r.fishAsk);
  check(`${tag}: the album's narrator line fits the edition`, r.albumLines.every(l => /sticker/.test(l) === (edition !== 'captain')), r.albumLines);
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

// The little games: the fisherman's at the pond and one in each village,
// played with real taps on the canvas. Speech is instant here: each line
// is noted with its voice and its callbacks run at once.
async function littleGames(browser, edition) {
  const other = edition === 'captain' ? 'princess' : 'captain';
  const seed = { edition, stars: 40, coins: 0, other: { [other]: { edition: other } } };
  const { page, ctx, errors } = await game(browser, { seed, edition });
  const r = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    const until = async (f, ms) => { const t0 = performance.now(); while (!f() && performance.now() - t0 < ms) await sleep(40); return f(); };
    const said = [];
    const all = new Map();
    Sound.say = (parts, who) => {
      for (const p of [].concat(parts)) {
        if (p && p.text) {
          const x = { voice: p.narrator || !(who && who.tts) ? TTS_NARRATOR : who.tts, text: String(p.text).trim().replace(/\s+/g, ' '), narrator: !!p.narrator };
          said.push(x);
          all.set(`${x.voice}|${x.text}`, x);
        }
        if (p && p.call) p.call();
      }
    };
    const shown = id => !document.getElementById(id).classList.contains('hidden');
    // A tap on a thing in the picture, where it is on the screen.
    const tap = it => {
      const b = mini.game.box(it);
      const v = mini.view;
      const box = mini.canvas.getBoundingClientRect();
      const dpr = mini.canvas.width / box.width;
      const x = box.left + (((b.x0 + b.x1) / 2 + v.bx) * v.k) / dpr;
      const y = box.top + (((b.y0 + b.y1) / 2 + v.by) * v.k) / dpr;
      mini.canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true, cancelable: true }));
    };
    const live = () => mini.items.filter(x => x.state === 'live');
    // The right one: the right picture, or the letter the next slot needs.
    const right = () => live().find(x => (mini.game.tap ? vgWants(x) : x.right));
    const wrong = () => live().find(x => (mini.game.tap ? !vgWants(x) : !x.right));
    const winRound = async () => {
      const n = mini.round;
      for (let i = 0; i < 8 && mini.round === n && right(); i++) { tap(right()); await sleep(60); }
      return until(() => mini.round > n || shown('mini-end'), 6000);
    };
    const firstLines = ['miniRhyme', 'miniSpell', 'miniBlend', 'miniRead', 'miniSound'].flatMap(k => LINES[k]).concat(LINES.fishHello);
    const out = {};
    for (const key of ['fish', 'forest', 'fairy', 'unicorn', 'dungeon']) {
      const g = MINI_GAMES[key];
      const o = out[key] = {};
      changeScene(g.scene);
      await sleep(500);
      const sc = state.scene;
      const host = g.host();
      // The button: in the host's dialog only, with the game's picture.
      openDialog(host);
      o.button = { shown: shown('dlg-mini'), text: document.getElementById('dlg-mini').textContent };
      closeDialog();
      const someone = sc.npcs.find(n => n !== host && !n.mount && !n.shop && !n.caught);
      openDialog(someone);
      o.button.other = shown('dlg-mini');
      closeDialog();
      const home = VILLAGE_HOMES.find(h => h.scene === g.scene && h.look === host.look);
      if (home) {
        changeScene(`home-${home.id}`);
        await sleep(500);
        openDialog(state.scene.npcs[0]);
        o.button.home = shown('dlg-mini');
        closeDialog();
        changeScene(g.scene);
        await sleep(500);
      }
      // Started from the button: busy, the music down, what to do said, the
      // finger. (The dialog's own question counts towards her tier.)
      openDialog(host);
      // Her tier in every kind, and the letters she knows (blending's one-sound step).
      const tiersNow = () => JSON.stringify(Quiz.kinds.filter(k => Quiz.tierMax(k)).map(k => Quiz.skill(k).t));
      const skill = tiersNow();
      const letters = Object.keys(state.skill.letters || {}).length;
      const history = JSON.stringify(state.history);
      const coins = state.coins;
      const quest = questCount('fish');
      said.length = 0;
      document.getElementById('dlg-mini').click();
      await sleep(100);
      o.open = { card: shown('mini'), dialog: shown('dialog'), busy: state.busy, music: musicListening(), title: mini.title.textContent };
      o.first = { line: said.find(p => firstLines.includes(p.text)) || null, finger: miniFingerShows() };
      o.rounds = mini.rounds.length;
      o.choices = mini.rounds.map(() => 0);
      o.choices[0] = live().length;
      // Round one: a miss (the hint), a second (the answer shown), then the right one.
      said.length = 0;
      tap(wrong());
      o.miss = { said: said.map(p => p.text), finger: miniFingerShows(), glow: mini.items.some(x => x.glow) };
      mini.locked = false;
      said.length = 0;
      tap(wrong());
      const glowing = mini.items.filter(x => x.glow);
      o.show = { said: said.map(p => p.text), glow: glowing.length === 1 && glowing[0] === right() };
      mini.locked = false;
      o.won = [await winRound()];
      for (let i = 1; i < mini.rounds.length; i++) {
        o.choices[i] = live().length;
        o.finger = o.finger || miniFingerShows();
        o.won.push(await winRound());
      }
      await until(() => shown('mini-end'), 3000);
      // The end: the coins once, the quest, the pips. (A tap on the end card
      // itself: one on the pond around it closes the game, js/game.js.)
      mini.end.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      await sleep(300);
      o.end = { card: shown('mini-end'), coins: state.coins - coins, quest: questCount('fish') - quest, pips: document.querySelectorAll('#mini-pips .pip.on').length, done: said.some(p => (key === 'fish' ? LINES.fishDone : LINES.miniDone).includes(p.text)) };
      // 🔁 plays again; 👋 closes and frees the game.
      document.getElementById('mini-again').click();
      await sleep(100);
      o.again = { card: shown('mini'), end: shown('mini-end'), round: mini.round, caught: mini.caught.length };
      document.getElementById('mini-close').click();
      await sleep(100);
      o.closed = { card: shown('mini'), busy: state.busy, music: musicListening() };
      o.kept = { skill: tiersNow() === skill, history: JSON.stringify(state.history) === history,
        // At blending's one-sound step her first tries count towards the letters she knows.
        letters: key !== 'unicorn' || Object.keys(state.skill.letters || {}).length > letters };
      // Her tier, capped like the village asks it (counted from after
      // blending's first steps); three-letter words to spell.
      if (key !== 'fish') {
        const kind = VILLAGE_GAMES[key].kind;
        const was = JSON.stringify(state.skill);
        const cap = Math.min(key === 'fairy' ? 2 : TIER_BAND[key][1] + Quiz.lead(kind), Quiz.tierMax(kind));
        o.tiers = {};
        for (const t of [1, 9]) {
          Quiz.skill(kind).t = t;
          const rounds = g.rounds();
          o.tiers[t] = { got: [...new Set(rounds.map(x => x.q.tier))], want: Math.min(t, cap), three: rounds.every(x => key !== 'fairy' || x.q.slots.length === 3) };
        }
        state.skill = JSON.parse(was);
      }
      // Past the play limit: the button opens nothing, and 🔁 puts the town to sleep.
      state.settings.playLimit = 1;
      state.playtime = { day: guideDay(), ms: 60001, wakes: 0 };
      openDialog(host);
      document.getElementById('dlg-mini').click();
      await sleep(100);
      o.limit = { card: shown('mini') };
      await until(() => guide.asleep, 2000);
      o.limit.asleep = guide.asleep;
      guideWake();
      state.playtime = { day: guideDay(), ms: 0, wakes: 0 };
      openMini(host);
      state.playtime.ms = 60001;
      document.getElementById('mini-again').click();
      await sleep(300);
      o.limit.again = { card: shown('mini'), asleep: guide.asleep };
      if (guide.asleep) guideWake();
      state.settings.playLimit = 0;
      state.playtime = { day: guideDay(), ms: 0, wakes: 0 };
    }
    return { out, said: [...all.values()] };
  });
  const tag = `little games (${edition})`;
  for (const [key, o] of Object.entries(r.out)) {
    const t = `${tag} ${key}`;
    check(`${t}: its button is in the host's dialog only, with its picture`, o.button.shown && !o.button.other && o.button.home !== true && /^\p{Extended_Pictographic}/u.test(o.button.text), o.button);
    check(`${t}: the button opens it, busy and the music down`, o.open.card && !o.open.dialog && o.open.busy && o.open.music && !!o.open.title, o.open);
    check(`${t}: the first round says what to do and shows the finger, which goes after a try`, !!o.first.line && o.first.finger && !o.miss.finger && !o.finger, { first: o.first, miss: o.miss.finger, later: o.finger });
    check(`${t}: five rounds, ${key === 'fish' ? 4 : key === 'fairy' ? '3 or 4' : 3} to pick from`, o.rounds === 5 && o.choices.every(n => (key === 'fish' ? n === 4 : key === 'fairy' ? n === 3 || n === 4 : n === 3)), o.choices);
    check(`${t}: a miss gets a hint, a second shows the right one`, o.miss.said.length > 1 && !o.miss.glow && o.show.glow && o.show.said.length > 1, { miss: o.miss, show: o.show });
    check(`${t}: every round can be won`, o.won.length === 5 && o.won.every(Boolean), o.won);
    check(`${t}: the end pays the coins once and counts each round for the games quest`, o.end.card && o.end.coins === r.out.fish.end.coins && o.end.coins > 0 && o.end.quest === 5 && o.end.pips === 5 && o.end.done, o.end);
    check(`${t}: 🔁 plays again from the start`, o.again.card && !o.again.end && o.again.round === 0 && o.again.caught === 0, o.again);
    check(`${t}: ✖ closes it and frees the game and the music`, !o.closed.card && o.closed.busy === false && o.closed.music === false, o.closed);
    check(`${t}: playing moves no tier and records no answer${key === 'unicorn' ? ' (her letters count)' : ''}`, o.kept.skill && o.kept.history && o.kept.letters, o.kept);
    if (o.tiers) check(`${t}: the questions come at her tier, capped like the village`, Object.values(o.tiers).every(x => x.got.length === 1 && x.got[0] === x.want && x.three), o.tiers);
    check(`${t}: past the play limit it doesn't open, and 🔁 puts the town to sleep`, !o.limit.card && o.limit.asleep && !o.limit.again.card && o.limit.again.asleep, o.limit);
  }
  const listed = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'tts-phrases.json'), 'utf8')).map(p => `${p.voice}|${p.text}`));
  const unlisted = r.said.filter(p => !listed.has(`${p.voice}|${p.text}`)).map(p => `${p.voice} "${p.text}"`);
  check(`${tag}: every line said (${r.said.length}) is listed in tools/tts-phrases.json`, r.said.length > 30 && !unlisted.length, unlisted);
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

// Presents (offerReward in js/game.js) for a girl, a boy and the robot:
// every villager in turn gives until nobody has anything new left. Each
// present is new (never a repeat), also from villagers whose own unicorn or
// fairy is hers already; it suits the hero; a village's own treasures come
// only from that village; and at the end the wardrobe's count is full.
// Nothing that doesn't suit her is in the shop or the wardrobe either.
async function presents(browser, edition, look) {
  const { page, ctx, errors } = await game(browser, { edition, seed: { edition, stars: 99 } });
  const r = await page.evaluate(look => {
    if (!Sound.muted) Sound.toggleMute();
    if (look !== 'robot') {
      setPlayer({ title: look === 'boy' ? 'prince' : 'princess', look });
      wearLook();
    }
    const out = { repeats: [], notNew: [], wrongLook: [], wrongVillage: [], ownAgain: [], gifts: 0, shelf: 0 };
    const givers = ['town', 'forest', 'unicorn', 'fairy'].flatMap(n => sceneFor(n).npcs.filter(p => !p.mount && !p.shop && !p.monster));
    const allowed = { forest: [2, 3, 4], unicorn: [3, 4], fairy: [5] };
    // The villagers' own unicorns and fairies are hers already.
    for (const p of givers) {
      if (p.unicorn && UNICORNS[p.unicorn]) state.owned.ride.push(p.unicorn);
      if (p.gives && FAIRIES[p.gives]) state.owned.fairy.push(p.gives);
    }
    const before = collected().have;
    const seen = new Set();
    for (let round = 0; round < 1000; round++) {
      const left = givers.filter(p => hasNewGift(p));
      if (!left.length) break;
      const npc = left[round % left.length];
      offerReward(npc);
      const g = state.gift;
      const key = `${g.slot}:${g.value}`;
      const item = WARDROBE.find(w => w.slot === g.slot).items[g.value];
      const level = npc.level || 1;
      if (seen.has(key)) out.repeats.push(key);
      if (!g.isNew) out.notNew.push(key);
      if (!suits(item)) out.wrongLook.push(key);
      for (const [mark, levels] of Object.entries(allowed)) if (item[mark] && !levels.includes(level)) out.wrongVillage.push(`${key} from level ${level}`);
      if ((npc.unicorn && g.value === npc.unicorn && g.slot === 'ride') || (npc.gives && g.value === npc.gives && g.slot === 'fairy')) out.ownAgain.push(key);
      if (npc.unicorn || npc.gives) out.fromOwners = (out.fromOwners || 0) + 1;
      if (isShelf(g.slot)) out.shelf++;
      seen.add(key);
      acceptReward(round % 2 === 0);
    }
    out.gifts = seen.size;
    out.count = collected();
    out.before = before;
    out.stuck = givers.filter(p => hasNewGift(p)).map(p => p.name);
    // The shop and the wardrobe: only things that suit her.
    for (const w of WARDROBE) state.owned[w.slot] = state.owned[w.slot].filter(v => w.shelf ? false : v === 'none' || v === state.outfit[w.slot]);
    out.shopWrong = shopItems().filter(it => !suits(it.item)).map(it => `${it.slot}:${it.value}`);
    out.wardrobeWrong = [];
    changeScene('yuna');
    openWardrobe();
    for (const w of wardrobeTabs()) {
      wdTab = w.slot;
      renderWardrobe();
      const shown = document.querySelectorAll('#wd-slots .wd-item').length;
      const fit = Object.values(w.items).filter(item => suits(item)).length;
      if (shown !== fit) out.wardrobeWrong.push(`${w.slot}: ${shown} pictures for ${fit} things`);
    }
    closeWardrobe();
    return out;
  }, look);
  const tag = `presents (${edition} ${look})`;
  check(`${tag}: every present is new, none twice (${r.gifts} presents, ${r.shelf} treasures)`, !r.repeats.length && !r.notNew.length && r.gifts > 30, { repeats: r.repeats, notNew: r.notNew, gifts: r.gifts });
  check(`${tag}: a villager whose own unicorn or fairy is hers gives something else new (${r.fromOwners} presents)`, !r.ownAgain.length && r.fromOwners > 0, r.ownAgain);
  check(`${tag}: nothing that doesn't suit the hero`, !r.wrongLook.length, r.wrongLook);
  check(`${tag}: a village's own treasures come only from there`, !r.wrongVillage.length, r.wrongVillage);
  check(`${tag}: once nobody has anything new, every present is hers (모은 선물 ${r.count.have} / ${r.count.total})`, !r.stuck.length && r.count.have === r.count.total && r.count.have - r.before === r.gifts, r);
  check(`${tag}: the shop and the wardrobe show only things that suit the hero`, !r.shopWrong.length && !r.wardrobeWrong.length, { shop: r.shopWrong, wardrobe: r.wardrobeWrong });
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

// A tap outside a card (outsideTap in js/game.js), at the iPad sizes and on
// a phone held sideways, with a finger and the mouse in turn: it closes each
// card she only looks at (album, today's adventures, the library's shelf,
// wardrobe, shop, feeding card, the fishing game's end card), and never a
// question, a present, a book being read, the fishing game, the sleeping
// town or anything under the parent panel. The game is free (or still busy)
// after it, the tap doesn't walk her or reach anyone under the card, a
// button of the card under it isn't pressed, the buttons at the top keep
// their job, and a tap while the chest opens, stickers fly in or her friend
// celebrates only ends that.
const OUTSIDE_SIZES = [[844, 390], [1024, 768], [768, 1024], [1180, 820], [1024, 700]];

// In the page: window.T, what the taps need.
function outsideSetup() {
  if (!Sound.muted) Sound.toggleMute();
  const friend = Object.keys(FAIRIES).find(k => k !== 'none');
  if (!state.owned.fairy.includes(friend)) state.owned.fairy.push(friend);
  state.outfit = Object.assign({}, state.outfit, { fairy: friend });
  const home = Object.assign({}, state.scene.start);
  const hero = state.hero;
  const shown = id => { const el = document.getElementById(id); return !!el && !el.closest('.hidden'); };
  const names = ['town', 'forest', 'unicorn', 'fairy', 'dungeon'];
  window.T = {
    shown,
    friend,
    // Nothing open, the sound off, and she stands where she started.
    reset() {
      if (parentUi.panel) parentClose();
      if (guide.asleep) guideWake(true);
      if (state.gift) acceptReward(false);
      closeBlendMagic();
      if (state.talking) closeDialog();
      closeFeed();
      closeMini();
      closeQuests();
      if (shown('album')) closeAlbum();
      if (shown('wardrobe')) closeWardrobe();
      if (shown('shop')) closeShop();
      if (shown('library') || shown('reader')) closeLibrary();
      if (!Sound.muted) Sound.toggleMute();
      placeHero(home.c, home.r);
      snapCamera();
      state.busy = busyNow();
    },
    now: () => ({ busy: state.busy, walking: hero.path.length, going: !!hero.onArrive, talking: !!state.talking, at: `${hero.c},${hero.r}` }),
    ask: () => openDialog(state.scene.npcs.find(n => !n.mount && !n.shop && !n.caught)),
    // Something bought: the "wear it now?" card.
    buy() {
      openShop(names.map(sceneFor).flatMap(sc => sc.npcs).find(n => n.shop));
      state.coins = 999;
      state.shopPick = shopItems()[0];
      buyPick();
    },
    shopkeeper: () => names.map(sceneFor).flatMap(sc => sc.npcs).find(n => n.shop),
    // A point on the town outside the card `id`, away from its edge and the
    // buttons at the top (a finger near one counts as on it), where a tap
    // with nothing open would walk her (`want` 'go': walk her to someone or
    // something; 'any': whatever it would do). Else the star counter.
    spot(id, want = 'walk') {
      const card = document.getElementById(id).getBoundingClientRect();
      const box = screen.getBoundingClientRect();
      const top = document.querySelector('.hud').getBoundingClientRect().bottom + 36;
      for (let y = box.bottom - 24; y > Math.max(box.top + 24, top); y -= 17) {
        for (let x = box.left + 24; x < box.right - 24; x += 19) {
          if (x > card.left - 30 && x < card.right + 30 && y > card.top - 30 && y < card.bottom + 30) continue;
          if (document.elementFromPoint(x, y) !== screen) continue;
          if (want === 'any' || T.tries(x, y, want === 'go')) return { x: Math.round(x), y: Math.round(y), town: true };
        }
      }
      const s = document.getElementById('stars').getBoundingClientRect();
      return { x: Math.round(s.left + 14), y: Math.round(s.top + s.height / 2), town: false };
    },
    // A pretend tap there with nothing open: whether it walks her (to
    // someone, with `go`). Everything goes back as it was.
    tries(x, y, go) {
      const at = { c: hero.c, r: hero.r };
      const busy = state.busy;
      const mini = shown('mini');
      state.busy = false;
      onPointer({ clientX: x, clientY: y });
      const ok = hero.path.length > 0 && !!hero.onArrive === go;
      if (state.talking) closeDialog();
      if (!mini) closeMini();
      placeHero(at.c, at.r);
      state.busy = busy;
      return ok;
    },
  };
}

async function outsideTaps(browser, edition) {
  const results = new Map();
  const note = (name, ok, detail) => {
    if (!results.has(name)) results.set(name, []);
    if (!ok) results.get(name).push(detail);
  };
  const errs = [];
  const chips = []; // the sizes where a wardrobe button showed beside the feeding card
  for (const [i, [width, height]] of OUTSIDE_SIZES.entries()) {
    const size = `${width}x${height}`;
    const seed = { edition, stars: 40, dust: 12, coins: 60 };
    const { page, ctx, errors } = await game(browser, { seed, edition, viewport: { width, height }, touch: true });
    await page.evaluate(outsideSetup);
    const ev = (fn, arg) => page.evaluate(fn, arg);
    // A finger, or the mouse, in turn (or as `finger` says).
    let turn = i;
    const tap = async (p, finger = turn++ % 2 === 0) => {
      if (finger) await page.touchscreen.tap(p.x, p.y);
      else await page.mouse.click(p.x, p.y);
      await page.waitForTimeout(120);
      return finger ? 'finger' : 'mouse';
    };
    const now = id => ev(id => Object.assign(T.now(), { open: T.shown(id) }), id);

    // The cards she only looks at: one tap outside closes it, the game is
    // free, she doesn't walk; the next tap there walks her.
    for (const [k, [id, open]] of [['album', 'openAlbum()'], ['quests', 'openQuests()'], ['library', 'openLibrary()'], ['wardrobe', 'openWardrobe()'],
      ['shop', 'openShop(T.shopkeeper())'], ['feed', 'openFeed()']].entries()) {
      await ev(`T.reset(); ${open}`);
      const p = await ev(id => T.spot(id), id);
      const before = await now(id);
      const how = await tap(p, (i + k) % 2 === 0);
      const after = await now(id);
      note(`a tap outside closes the ${id} card, frees the game and doesn't walk her`,
        before.open && before.busy && !after.open && after.busy === false && !after.walking && !after.going && after.at === before.at, { size, how, p, before, after });
      if (p.town) await tap(p);
      const again = await ev(() => T.now());
      note(`after the ${id} card, a tap on the town walks her again`, !p.town || again.walking > 0, { size, p, again });
      if (process.env.SHOW) console.log(edition, size, id, how, JSON.stringify(p));
    }
    // On someone (or a door) under the album: nobody is talked to, she
    // doesn't set off.
    await ev('T.reset(); openAlbum()');
    const someone = await ev(() => T.spot('album', 'go'));
    await tap(someone);
    const met = await now('album');
    note('a tap on someone outside the album closes it and goes no further', !met.open && !met.busy && !met.walking && !met.going && !met.talking && (someone.town || width !== 1024 || height !== 768), { size, someone, met });

    // The fishing game's end card: a tap on the pond around it.
    await ev('T.reset(); openMini(miniFisher()); miniFinish()');
    const pond = await ev(() => {
      const c = document.getElementById('mini-canvas').getBoundingClientRect();
      const e = document.getElementById('mini-end').getBoundingClientRect();
      return [[c.left + 20, c.top + 20], [c.right - 20, c.top + 20], [c.left + 20, c.bottom - 20], [c.right - 20, c.bottom - 20]]
        .map(([x, y]) => ({ x: Math.round(x), y: Math.round(y) })).find(q => q.x < e.left || q.x > e.right || q.y < e.top || q.y > e.bottom);
    });
    const endBefore = await now('mini');
    await tap(pond);
    const endSoon = await now('mini');
    note('a tap on the pond as the end card comes up (her finger still going) leaves it', endSoon.open && endSoon.busy, { size, pond, endSoon });
    await ev('mini.endAt -= MINI_END_HOLD');
    await tap(pond);
    const endAfter = await now('mini');
    note('a tap outside the fishing game\'s end card closes the game and frees it', endBefore.open && !endAfter.open && endAfter.busy === false && !endAfter.walking, { size, pond, endBefore, endAfter });

    // Cards that stay: a question, a present, a book being read, the
    // fishing game, the sound magic over a question (js/blend-magic.js),
    // the sleeping town.
    for (const [id, open, close] of [['dialog', 'T.ask()', 'closeDialog()'], ['reward', 'T.buy()', 'acceptReward(false); closeShop()'],
      ['magic', "T.ask(); ui.dialog.classList.add('hidden'); openBlendMagic(Quiz.magic('sun'))", 'closeDialog()'],
      ['reader', 'openLibrary(); openBook(BOOKS[0])', 'closeLibrary()'], ['reader', 'openLibrary(); openSelfBook(DECODABLE_BOOKS[0])', 'closeLibrary()'],
      ['mini', 'openMini(miniFisher())', 'closeMini()'], ['sleep', 'guideSleep()', 'guideWake(true)']]) {
      await ev(`T.reset(); ${open}`);
      const p = await ev(id => T.spot(id, 'any'), id);
      const how = await tap(p);
      const after = await now(id);
      note(`a tap outside leaves the ${id} card open and the game busy`, after.open && after.busy && !after.walking && !after.going, { size, how, p, after });
      await ev(close);
      const shut = await ev(() => T.now());
      note(`... and its own way out still frees the game (${id})`, shut.busy === false, { size, shut });
    }
    // The parent panel over the album: a tap on its dimmed edge closes neither.
    await ev(`T.reset(); openAlbum(); document.getElementById('parent').click()`);
    await tap({ x: 3, y: height - 3 });
    const panel = await ev(() => ({ panel: !!document.querySelector('.parent-panel'), album: T.shown('album') }));
    await ev('parentClose()');
    const underPanel = await now('album');
    note('a tap on the parent panel\'s edge closes neither it nor the album under it', panel.panel && panel.album && underPanel.open && underPanel.busy, { size, panel, underPanel });
    await ev('closeAlbum()');

    // The feeding card over the wardrobe: a tap on a wardrobe button beside
    // it closes the feeding card only, and that button isn't pressed. (She
    // has everything, so there are buttons to press beside it.)
    await ev(`T.reset(); for (const { slot, items } of WARDROBE) state.owned[slot] = Object.keys(items); openWardrobe(); openFeed()`);
    // A point on a thing of hers, or a tab, that shows beside the card (on a
    // small screen there may be none).
    const chip = await ev(() => {
      const card = document.getElementById('feed').getBoundingClientRect();
      for (const b of document.querySelectorAll('#wd-slots .wd-item:not(.on):not(.locked), #wd-tabs .wd-tab:not(.on)')) {
        const r = b.getBoundingClientRect();
        for (let x = r.left + 6; x < r.right - 6; x += 8) {
          const q = { x: Math.round(x), y: Math.round(r.top + r.height / 2) };
          if ((q.x < card.left - 30 || q.x > card.right + 30 || q.y < card.top - 30 || q.y > card.bottom + 30) && b.contains(document.elementFromPoint(q.x, q.y))) return q;
        }
      }
      return null;
    });
    if (chip) {
      const outfit = await ev(() => JSON.stringify(state.outfit) + wdTab);
      await tap(chip);
      const stacked = await ev(() => ({ feed: T.shown('feed'), wardrobe: T.shown('wardrobe'), busy: state.busy, outfit: JSON.stringify(state.outfit) + wdTab }));
      note('a tap on the wardrobe beside the feeding card closes that card only, and presses nothing under it',
        !stacked.feed && stacked.wardrobe && stacked.busy && stacked.outfit === outfit, { size, chip, stacked });
      chips.push(size);
    } else await ev('closeFeed()');
    const wd = await ev(() => T.spot('wardrobe'));
    await tap(wd);
    note('... then a tap outside the wardrobe closes it and frees the game', !(await ev(() => T.shown('wardrobe') || state.busy)), { size, wd });

    // 🔊 at the top with the album open keeps its job; the album stays.
    await ev('T.reset(); openAlbum()');
    const mute = await ev(() => { const r = document.getElementById('mute').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), muted: Sound.muted }; });
    await tap(mute);
    const muted = await ev(() => ({ album: T.shown('album'), muted: Sound.muted, busy: state.busy }));
    await tap(mute);
    note('🔊 at the top with the album open turns the sound off and leaves the album open', muted.album && muted.busy && muted.muted !== mute.muted, { size, mute, muted });
    await ev('if (!Sound.muted) Sound.toggleMute(); closeAlbum()');

    // Something still playing: the first tap outside ends it, the next one
    // closes the card. The chest opening, paid once.
    await ev(`T.reset(); const q = questsToday(); q.got[Progress.device] = Object.fromEntries(q.picks.map(k => [k, QUESTS[k].n])); openQuests()`);
    const out = await ev(() => T.spot('quests'));
    const chest = await ev(() => { const r = document.querySelector('#quests .qs-chest').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), coins: state.coins }; });
    await tap(chest);
    const flying = await ev(() => document.querySelectorAll('.coin-fly').length);
    await tap(out);
    const ended = await ev(() => ({ open: T.shown('quests'), flying: document.querySelectorAll('.coin-fly').length, coins: state.coins, busy: state.busy }));
    await tap(out);
    const closed = await ev(() => ({ open: T.shown('quests'), coins: state.coins, busy: state.busy }));
    const paid = await ev(() => QUEST_CHEST.coins);
    note('a tap outside while the chest opens lands the coins and leaves the card; the next one closes it; paid once',
      flying > 0 && ended.open && !ended.flying && ended.busy && !closed.open && closed.busy === false && ended.coins === chest.coins + paid && closed.coins === ended.coins, { size, flying, ended, closed });
    // Stickers flying into 📒 over the open album.
    await ev(`T.reset(); openAlbum(); stickerFly([{ w: 'cat', e: '🐱' }, { w: 'dog', e: '🐶' }], null)`);
    const sp = await ev(() => T.spot('album'));
    const stickers = await ev(() => document.querySelectorAll('.sticker-fly').length);
    await tap(sp);
    const landed = await ev(() => ({ open: T.shown('album'), flying: document.querySelectorAll('.sticker-fly').length }));
    await tap(sp);
    const gone = await now('album');
    note('a tap outside while stickers fly in lands them and leaves the album; the next one closes it',
      stickers === 2 && landed.open && !landed.flying && !gone.open && gone.busy === false, { size, stickers, landed, gone });
    // Her grown friend's party on the feeding card.
    await ev(`T.reset(); state.friends[T.friend] = { x: FRIEND_STAGES[FRIEND_STAGES.length - 1] }; openFeed()`);
    const fp = await ev(() => T.spot('feed'));
    const party = await ev(() => !!friendUi.party);
    await tap(fp);
    const calm = await ev(() => ({ open: T.shown('feed'), party: !!friendUi.party }));
    await tap(fp);
    const fed = await now('feed');
    note('a tap outside during her friend\'s party ends it and leaves the card; the next one closes it',
      party && calm.open && !calm.party && !fed.open && fed.busy === false, { size, party, calm, fed });

    errs.push(...errors.map(e => `${size}: ${e}`));
    await ctx.close();
  }
  for (const [name, bad] of results) check(`outside (${edition}): ${name}`, !bad.length, bad);
  check(`outside (${edition}): a wardrobe button showed beside the feeding card at some size`, chips.length > 0, chips);
  check(`outside (${edition}): no page errors`, !errs.length, errs);
}

// The background music (js/music.js), watched through musicInfo, with real
// taps and real clips.
async function musicFlows(browser, edition) {
  const { page, ctx, errors } = await game(browser, { edition, start: false });
  const tag = `music (${edition})`;
  const info = () => page.evaluate(() => ({ armed: musicInfo.armed, playing: musicInfo.playing, place: musicInfo.place, notes: musicInfo.notes, ducked: musicInfo.ducked, level: musicInfo.level }));
  await page.waitForTimeout(800);
  const before = await info();
  // A tap on the start screen unlocks the sound; the music waits for the town.
  await page.click('#title-chips .chip');
  await page.waitForTimeout(500);
  const startScreen = await info();
  await page.click('#start-btn', { force: true }); // it bobs, so never "stable"
  await page.waitForTimeout(800);
  const started = await page.evaluate(() => ({ playing: musicInfo.playing, place: musicInfo.place, notes: musicInfo.notes, sound: musicInfo.sound, ducked: musicInfo.ducked }));
  check(`${tag}: nothing plays before the first tap`, !before.armed && !before.playing && !before.notes, before);
  check(`${tag}: a tap on the start screen doesn't start it`, startScreen.armed && !startScreen.playing && !startScreen.notes, startScreen);
  check(`${tag}: ▶ starts the town's tune, under the hello`, started.playing && started.place === 'town' && started.notes > 0 && started.ducked, started);
  check(`${tag}: the edition's own sound`, started.sound === (edition === 'captain' ? 'robot' : 'box'), started.sound);

  const r = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    const until = async (f, ms) => { const t0 = performance.now(); while (!f() && performance.now() - t0 < ms) await sleep(50); return f(); };
    const out = {};
    // The hello said, it comes back up.
    await until(() => !musicInfo.ducked, 15000);
    await sleep(4000);
    out.up = { duck: musicInfo.duck, level: musicInfo.level };

    // A line: down at once, and up again slowly once it has been said.
    let saidAt = 0;
    Sound.say([{ text: line('start'), pitch: 1.3 }, { call: () => { saidAt = performance.now(); } }]);
    out.line = { at: musicInfo.ducked };
    await sleep(250);
    out.line.quick = musicInfo.duck;
    let most = 0;
    while (!saidAt && musicInfo.ducked) { most = Math.max(most, musicInfo.duck); await sleep(100); }
    out.line.during = most;
    out.line.said = !!saidAt;
    await until(() => !musicInfo.ducked, 3000);
    out.line.hold = performance.now() - saidAt;
    await sleep(500);
    out.line.rising = musicInfo.duck;
    await sleep(4000);
    out.line.back = musicInfo.duck;

    // A question: down from the moment it opens until it closes, also while
    // nobody talks.
    const npc = state.scene.npcs.find(n => !n.mount && !n.shop);
    openDialog(npc);
    out.q = { open: musicInfo.ducked };
    await sleep(300);
    most = 0;
    let up = 0;
    for (let i = 0; i < 25; i++) {
      if (i === 10) Sound.say([]); // the voice is done; the question is still open
      most = Math.max(most, musicInfo.duck);
      if (!musicInfo.ducked) up++;
      await sleep(100);
    }
    Object.assign(out.q, { most, up, question: !!state.question });
    closeDialog();
    await sleep(300);
    out.q.held = musicInfo.duck;
    await sleep(4500);
    out.q.after = { ducked: musicInfo.ducked, duck: musicInfo.duck };
    // The fishing game is all listening too.
    openMini(miniFisher());
    await sleep(200);
    Sound.say([]);
    await sleep(1500);
    out.mini = musicInfo.ducked;
    closeMini();
    await sleep(300);

    // 🔊 off and on.
    document.getElementById('mute').click();
    await sleep(500);
    out.mute = { playing: musicInfo.playing, level: musicInfo.level };
    document.getElementById('mute').click();
    await sleep(300);
    out.unmute = musicInfo.playing;

    // The page hidden and shown again.
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    out.hidden = musicInfo.playing;
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
    out.shown = musicInfo.playing;

    // New places crossfade; never more than a handful of notes at once.
    let voices = 0;
    const watch = setInterval(() => { voices = Math.max(voices, musicInfo.voices); }, 20);
    await sleep(1500);
    changeScene('forest');
    await sleep(700);
    out.forest = { place: musicInfo.place, fading: musicInfo.fading };
    await sleep(1800);
    out.forest.after = musicInfo.fading;
    changeScene('yuna');
    await sleep(1500);
    out.room = musicInfo.place;
    changeScene('castle');
    await sleep(1500);
    out.castle = musicInfo.place;
    changeScene('town');
    await sleep(1500);
    clearInterval(watch);
    out.voices = voices;

    // The town falls asleep: quiet; a parent's wake brings it back.
    state.settings.playLimit = 1;
    state.playtime = { day: guideDay(), ms: 60001, wakes: 0 };
    await until(() => guide.asleep, 3000);
    await sleep(300);
    out.sleep = { asleep: guide.asleep, playing: musicInfo.playing, level: musicInfo.level };
    guideWake();
    state.settings.playLimit = 0;
    await sleep(300);
    out.wake = musicInfo.playing;
    return out;
  });
  check(`${tag}: it comes back up after the hello`, r.up.duck > 0.9 && r.up.level > 0.9, r.up);
  check(`${tag}: a line: down to an eighth at once, and stays down while it is said`, r.line.at && r.line.quick < 0.2 && r.line.during < 0.15 && r.line.said, r.line);
  check(`${tag}: a line: a moment after it ends it comes back, slowly`, r.line.hold >= 500 && r.line.rising > 0.15 && r.line.rising < 0.8 && r.line.back > 0.9, r.line);
  check(`${tag}: a question: down the whole time it is open, also when nobody talks`, r.q.open && r.q.most < 0.15 && !r.q.up && r.q.question, r.q);
  check(`${tag}: a question: back up once it closes`, r.q.held < 0.3 && !r.q.after.ducked && r.q.after.duck > 0.85, r.q);
  check(`${tag}: the fishing game keeps it down`, r.mini === true, r.mini);
  check(`${tag}: 🔊 off silences it, on brings it back`, !r.mute.playing && r.mute.level < 0.02 && r.unmute, r);
  check(`${tag}: a hidden page pauses it`, !r.hidden && r.shown, r);
  check(`${tag}: a new place crossfades to its tune`, r.forest.place === 'forest' && r.forest.fading && !r.forest.after && r.room === 'home' && r.castle === 'town', r);
  check(`${tag}: a handful of notes at once at most`, r.voices > 0 && r.voices <= 6, r.voices);
  check(`${tag}: the sleeping town is quiet, a wake brings it back`, r.sleep.asleep && !r.sleep.playing && r.sleep.level < 0.05 && r.wake, r);

  // The parent panel: paused while open; 배경 음악 off, stamped and saved,
  // stays off after it closes; on again.
  const setMusic = async v => {
    await page.evaluate(() => document.getElementById('parent').click());
    await page.waitForTimeout(400);
    const paused = await page.evaluate(() => musicInfo.playing);
    await page.fill('.parent-pw', '0000');
    await page.click('.parent-go');
    await page.waitForSelector('.parent-settings [data-set="music"]');
    const at = await page.evaluate(() => Number(state.settings.at) || 0);
    const chips = await page.evaluate(() => [...document.querySelectorAll('.parent-settings [data-set="music"]')].map(b => b.textContent + (b.classList.contains('on') ? '*' : '')));
    await page.click(`.parent-settings [data-set="music"][data-v="${v}"]`);
    const set = await page.evaluate(() => ({ music: state.settings.music, at: Number(state.settings.at), saved: JSON.parse(localStorage.getItem('pixeltown-v2')).settings }));
    await page.evaluate(() => document.querySelector('.parent-close').click());
    await page.waitForTimeout(500);
    return { paused, at, chips, set, after: await info() };
  };
  const off = await setMusic(0);
  check(`${tag}: the parent panel pauses it`, off.paused === false, off);
  check(`${tag}: 배경 음악 is on at first, 끄기 turns it off and stamps it`, off.chips.join() === '켜기*,끄기' && off.set.music === false && off.set.at > off.at && off.set.saved.music === false && off.set.saved.at === off.set.at, off);
  check(`${tag}: off, it stays quiet after the panel closes`, !off.after.playing && off.after.level < 0.05, off.after);
  const on = await setMusic(1);
  check(`${tag}: 켜기 turns it back on, stamped again`, on.chips.join() === '켜기,끄기*' && on.set.music === true && on.set.at > off.set.at && on.after.playing, on);

  // Another tablet turns it off: its newer stamp wins, and the music stops;
  // an older one changes nothing.
  const merged = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    const mine = JSON.parse(localStorage.getItem('pixeltown-v2'));
    const copy = (music, at) => Object.assign(JSON.parse(JSON.stringify(mine)), { settings: Object.assign({}, mine.settings, { music, at }) });
    const older = Progress.merge(mine, copy(false, mine.settings.at - 1000), 'theirs');
    const newer = Progress.merge(mine, copy(false, mine.settings.at + 1000), 'theirs');
    applyProgress(newer);
    await sleep(300);
    const out = { older: older.settings.music, newer: newer.settings.music, playing: musicInfo.playing };
    applyProgress(mine);
    await sleep(300);
    out.again = musicInfo.playing;
    return out;
  });
  check(`${tag}: the newer stamp wins from another tablet, and the music follows`, merged.older === true && merged.newer === false && !merged.playing && merged.again, merged);
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();

  // A browser without Web Audio: no music, and nothing breaks.
  const bare = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const p2 = await bare.newPage();
  const errs = [];
  p2.on('pageerror', e => errs.push(e.message));
  await p2.route(/^https?:/, rt => (own(rt) ? rt.continue() : rt.abort()));
  await p2.addInitScript(() => { localStorage.setItem('pixeltown-guest', '1'); delete window.AudioContext; delete window.webkitAudioContext; });
  await p2.goto(`${URL}?edition=${edition}&halloween=0`);
  await p2.waitForFunction(() => typeof Account !== 'undefined' && Account._started);
  await p2.click('#start-btn', { force: true });
  const none = await p2.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    openDialog(state.scene.npcs.find(n => !n.mount && !n.shop));
    await sleep(500);
    closeDialog();
    document.getElementById('mute').click();
    document.getElementById('mute').click();
    changeScene('forest');
    await sleep(800);
    return { armed: musicInfo.armed, playing: musicInfo.playing, voices: musicInfo.voices, place: state.scene.kind };
  });
  check(`${tag}: without Web Audio there is no music and no error`, !none.armed && !none.playing && !errs.length, { none, errs });
  await bare.close();
}

// The shop: another tab picks its first thing (the mirror and the 🪙 button
// never show one from a tab she has left), and a village's clothes cost
// what other villages' do, less than a unicorn or a car.
async function shopTabs(browser, edition) {
  const { page, ctx, errors } = await game(browser, { edition });
  const r = await page.evaluate(() => {
    state.stars = 99; // every village's things are in the shop
    const npc = ['town', 'forest', 'unicorn', 'fairy', 'dungeon'].map(sceneFor).flatMap(sc => sc.npcs).find(n => n.shop);
    openShop(npc);
    const first = { tab: state.shopTab, pick: state.shopPick && state.shopPick.slot };
    const tabs = [...document.querySelectorAll('#shop-tabs .wd-tab')];
    const other = tabs.find(b => !b.classList.contains('on'));
    other.click();
    const pick = state.shopPick;
    const after = { tabs: tabs.length, tab: state.shopTab, pick: pick && pick.slot, lit: document.querySelectorAll('#shop-items .wd-item.on').length,
      buy: document.getElementById('shop-buy').textContent, price: pick && pick.price };
    const price = slot => { const w = WARDROBE.find(w => w.slot === slot); const v = Object.keys(w.items).find(v => w.items[v].unicorn); return v ? shopPrice(slot, w.items[v]) : null; };
    const prices = { ride: price('ride'), head: price('head'), back: price('back'), forestBack: shopPrice('back', { forest: true }) };
    closeShop();
    return { first, after, prices };
  });
  const tag = `shop (${edition})`;
  check(`${tag}: it opens on the tab of the thing picked`, !!r.first.tab && r.first.tab === r.first.pick, r.first);
  check(`${tag}: another tab picks its first thing, lit, on the 🪙 button`, r.after.tabs > 1 && r.after.tab !== r.first.tab && r.after.pick === r.after.tab && r.after.lit === 1 && r.after.buy.includes(String(r.after.price)), r.after);
  check(`${tag}: a village's clothes cost like other villages', a ride more`, r.prices.ride === 12 && [r.prices.head, r.prices.back].every(p => p === null || p === r.prices.forestBack) && r.prices.forestBack < 12, r.prices);
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

// Riding up to a house (or into the cave): the ride waits outside, and she
// is back on it as she comes out. On foot, it waits next to her as before.
async function rideInOut(browser, edition) {
  const { page, ctx, errors } = await game(browser, { edition });
  const trip = (how, riding) => page.evaluate(async ([how, riding]) => {
    const wait = ok => new Promise(res => { const t0 = performance.now(); const go = () => (ok() || performance.now() - t0 > 4000 ? res() : setTimeout(go, 50)); go(); });
    const settled = () => !ui.fade.classList.contains('on');
    // The town and one of its houses, or the place the cave is in and the
    // way in and out of it.
    const name = how === 'door' ? 'town' : ['town', 'forest', 'unicorn', 'fairy'].find(n => (sceneFor(n).links || []).some(l => l.target === 'dungeon'));
    const town = sceneFor(name);
    const v = Object.keys(UNICORNS).find(x => x !== 'none');
    if (!state.owned.ride.includes(v)) state.owned.ride.push(v);
    state.outfit = Object.assign({}, state.outfit, { ride: v });
    if (state.scene !== town) { changeScene(name); await wait(() => state.scene === town && settled()); }
    if (riding) getOn();
    else getOff();
    const before = { mounted: state.mounted };
    if (how === 'door') enterDoor(town.doors.find(d => d.obj && d.obj.info) || town.doors[0]);
    else followLink(town.links.find(l => l.target === 'dungeon'));
    await wait(() => !state.scene.outdoor && settled());
    const inside = { scene: state.scene.kind, mounted: state.mounted, button: ui.ride.classList.contains('active'), waits: !!state.parked && state.parked.sc === town };
    if (how === 'door') leaveRoom();
    else followLink(state.scene.links.find(l => l.target === name));
    await wait(() => state.scene === town && settled());
    return { before, inside, out: { mounted: state.mounted, parked: !!state.parked, button: ui.ride.classList.contains('active'), busy: state.busy } };
  }, [how, riding]);
  const tag = `riding (${edition})`;
  for (const how of ['door', 'cave']) {
    const rode = await trip(how, true);
    check(`${tag}: rides up to the ${how}, goes in on foot, and is back on as she comes out`, rode.before.mounted && !rode.inside.mounted && !rode.inside.button
      && rode.inside.waits && rode.out.mounted && !rode.out.parked && rode.out.button && !rode.out.busy, rode);
    const walked = await trip(how, false);
    check(`${tag}: walks to the ${how}: comes out on foot, the ride waiting next to her`, !walked.before.mounted && !walked.out.mounted && walked.out.parked && !walked.out.button, walked);
  }
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

// Finding the little games: a bubble with the game's picture over each host
// (over the pond in town), the same picture as on the host's button; a tap
// on it walks her over and the game starts. Coming into a village from
// another place, the host calls her over; coming out of a house there, not.
async function gameSpots(browser, edition) {
  const { page, ctx, errors } = await game(browser, { edition });
  const out = await page.evaluate(async () => {
    const wait = ok => new Promise(res => { const t0 = performance.now(); const go = () => (ok() || performance.now() - t0 > 12000 ? res() : setTimeout(go, 50)); go(); });
    const settled = () => !ui.fade.classList.contains('on');
    const go = async name => { if (state.scene !== sceneFor(name)) { changeScene(name); await wait(() => state.scene === sceneFor(name) && settled()); } };
    state.stars = 99;
    if (!Sound.muted) Sound.toggleMute();
    const res = {};
    for (const [key, g] of Object.entries(MINI_GAMES)) {
      // In by its way from another place (the cave from where it is), or
      // straight there.
      const from = key === 'fish' ? 'forest' : ['town', 'forest', 'unicorn', 'fairy'].find(n => n !== g.scene && (sceneFor(n).links || []).some(l => l.target === g.scene));
      await go(from);
      const link = sceneFor(from).links.find(l => l.target === g.scene);
      followLink(link);
      await wait(() => state.scene === sceneFor(g.scene) && settled());
      const host = g.host();
      const called = { host: !!host, called: mini.called === host, hops: !!host && host.nudgeAt > 0 };
      const spot = miniSpots().find(sp => sp.npc === host);
      openDialog(host);
      const button = mini.button.classList.contains('hidden') ? '' : mini.button.textContent;
      closeDialog();
      const r = { called, spot: !!spot, icon: spot && spot.icon, button, opened: false };
      if (spot) {
        // A real tap where the bubble is drawn, her standing near it.
        const near = findPath(state.scene, { c: host.c, r: host.r }, (c, rr) => Math.abs(c - host.c) + Math.abs(rr - host.r) >= 3) || [];
        const at = near[near.length - 1] || { c: host.c + 3, r: host.r };
        placeHero(at.c, at.r);
        snapCamera();
        await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
        const p = toScreen(spot.w.x, spot.w.y);
        const box = screen.getBoundingClientRect();
        onPointer({ clientX: box.left + p.x * box.width / screen.width, clientY: box.top + p.y * box.height / screen.height });
        await wait(() => !mini.el.classList.contains('hidden'));
        r.opened = !mini.el.classList.contains('hidden') && mini.npc === host && mini.game === g;
        closeMini();
        state.busy = busyNow();
      }
      res[key] = r;
    }
    // Out of a house in a village: no call (only coming in from elsewhere).
    await go('forest');
    const home = sceneFor('forest').doors.find(d => d.home);
    mini.called = null;
    if (home) {
      enterDoor(home);
      await wait(() => !state.scene.outdoor && settled());
      leaveRoom();
      await wait(() => state.scene === sceneFor('forest') && settled());
    }
    res.leftHouse = { home: !!home, called: mini.called === null };
    return res;
  });
  const tag = `game bubbles (${edition})`;
  for (const [key, r] of Object.entries(out)) {
    if (key === 'leftHouse') continue;
    const village = key !== 'fish';
    check(`${tag} ${key}: a bubble with the game's picture, the same as its button's`, r.spot && !!r.button && r.button.startsWith(village ? r.icon : r.button.split(' ')[0]), r);
    check(`${tag} ${key}: a tap on the bubble walks her over and the game starts`, r.opened, r);
    if (village) check(`${tag} ${key}: coming in from another place, its host calls her over`, r.called.called && r.called.hops, r.called);
  }
  check(`${tag}: coming out of a house in the village, nobody calls`, out.leftHouse.home && out.leftHouse.called, out.leftHouse);
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

// The monsters she drew herself (js/kid-monsters.js): each one draws in
// every frame (still, eyes shut, waving) and in the town as a villager,
// stands on its feet and is between 20 and 40 px tall (the caterpillar is
// long and low) with its ♪ clear of it; talking to one shows her drawing in the dialog where the portrait
// goes (the picture loaded), and at the iPad sizes and on a phone held
// sideways it sits inside the dialog, off the cards, which stay on screen;
// another villager's dialog shows the portrait and no drawing; closing the
// dialog hides it; the drawing shows big with a tap and goes with any tap,
// or as the dialog steps aside. Each speaks with a recorded voice and has
// three hellos.
async function kidMonsters(browser, edition) {
  const { page, ctx, errors } = await game(browser, { edition });
  const tag = `her monsters (${edition})`;
  const looks = await page.evaluate(() => {
    if (!Sound.muted) Sound.toggleMute();
    return Object.keys(KID_MONSTERS);
  });
  const drawn = await page.evaluate(async () => {
    const out = {};
    const sc = state.scene;
    const h = state.hero;
    for (const look of Object.keys(KID_MONSTERS)) {
      const r = out[look] = { frames: [], bad: [] };
      try {
        const art = kidMonsterArt(look);
        art.rows.concat(Object.values(art.wave || {}), Object.values(art.shut || {})).forEach((row, i) => { if (row.length !== art.rows[0].length) r.bad.push(`row ${i} is ${row.length} wide`); });
        for (let f = 0; f < 4; f++) {
          const s = kidMonsterSprite(look, f);
          const px = s.canvas.getContext('2d').getImageData(0, 0, s.canvas.width, s.canvas.height).data;
          let ink = 0;
          for (let i = 3; i < px.length; i += 4) if (px[i]) ink++;
          const feet = s.canvas.getContext('2d').getImageData(0, s.ay, s.canvas.width, 1).data.some((v, i) => i % 4 === 3 && v);
          r.frames.push({ ink, feet, tall: s.ay, data: s.canvas.toDataURL() });
        }
        r.portrait = villagerSprite(look, 0) === kidMonsterSprite(look, 0);
        r.lift = kidBubbleLift({ look });
        // In the town as a villager, drawn over a few seconds of its idle life.
        const npc = makeNpc({ name: KID_MONSTERS[look].name, look, c: h.c + 1, r: h.r + 1 });
        sc.npcs.push(npc);
        for (let t = 0; t < 9000; t += 150) drawKidMonster(vctx, npc, 100, 100, t);
        drawScene(performance.now());
        sc.npcs.splice(sc.npcs.indexOf(npc), 1);
      } catch (e) {
        r.bad.push(e.message);
      }
      r.waves = new Set(r.frames.map(f => f.data)).size;
      r.frames.forEach(f => delete f.data);
      r.voice = !!(VOICES[look] && TTS_INDEX[VOICES[look].tts]);
      r.hellos = (PERSONA[look] || []).length;
    }
    out.otherLift = kidBubbleLift(sc.npcs[0]);
    return out;
  });
  for (const look of looks) {
    const r = drawn[look];
    check(`${tag} ${look}: draws in every frame, on its feet, 20 to 40 px tall, also as a villager`, !r.bad.length && r.frames.every(f => f.ink > 150 && f.feet && f.tall >= 20 && f.tall <= 40)
      && r.portrait && r.waves >= 2, r);
    check(`${tag} ${look}: its ♪ goes up clear of it`, r.lift >= 0 && r.frames[0].tall - r.lift <= 32, r.lift);
    check(`${tag} ${look}: a recorded voice and three hellos`, r.voice && r.hellos === 3, r);
  }
  check(`${tag}: anyone else's ♪ stays where it was`, drawn.otherLift === 0, drawn.otherLift);

  // Talking to each: her drawing where the portrait goes, loaded.
  const talk = look => page.evaluate(async look => {
    const sc = state.scene;
    let npc = sc.npcs.find(n => n.look === look);
    if (!npc) {
      npc = makeNpc({ name: KID_MONSTERS[look].name, look, c: state.hero.c + 2, r: state.hero.r });
      sc.npcs.push(npc);
    }
    if (state.talking) closeDialog();
    openDialog(npc);
    const img = document.getElementById('dlg-drawing-img');
    for (let t = 0; t < 5000 && !(img.complete && img.naturalWidth); t += 50) await new Promise(res => setTimeout(res, 50));
    const seen = el => !!el.offsetParent;
    return { talking: state.talking === npc, shown: seen(document.getElementById('dlg-drawing')), portrait: seen(document.querySelector('.portrait')),
      src: img.getAttribute('src'), want: kidMonsterArt(look).drawing, loaded: img.complete ? img.naturalWidth : 0,
      by: document.getElementById('dlg-drawing-by').textContent };
  }, look);
  for (const look of looks) {
    const r = await talk(look);
    check(`${tag} ${look}: her drawing shows in its dialog instead of the portrait`, r.talking && r.shown && !r.portrait && r.src === r.want && r.loaded > 0 && !!r.by, r);
  }
  // Where it sits, at each size, in each kind of dialog (three cards, four,
  // the letter tiles), before and after a miss.
  const fits = [];
  for (const [w, h] of [[844, 390], [1024, 768], [768, 1024], [1180, 820], [1024, 700]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    fits.push(...await page.evaluate(async size => {
      const bad = [];
      const npc = state.scene.npcs.find(n => KID_MONSTERS[n.look]);
      const look = () => {
        const R = el => el.getBoundingClientRect();
        const photo = R(document.querySelector('#dlg-drawing .photo'));
        const box = R(ui.dialog);
        const where = `${size} ${state.question.tiles ? 'tiles' : `${state.question.options.length} cards`}`;
        if (photo.width < 40 || photo.top < box.top - 12 || photo.bottom > box.bottom + 2 || photo.left < box.left) bad.push(`${where}: the photo is outside the dialog`);
        for (const c of [...ui.choices.children].map(R)) {
          if (c.left < photo.right && c.right > photo.left && c.top < photo.bottom && c.bottom > photo.top) bad.push(`${where}: the photo covers a card`);
          if (c.left < 0 || c.right > innerWidth || c.bottom > innerHeight) bad.push(`${where}: a card is off the screen`);
        }
      };
      for (const level of [undefined, 2, 5]) {
        npc.level = level;
        closeDialog();
        openDialog(npc);
        await new Promise(res => requestAnimationFrame(res));
        look();
        const q = state.question;
        q.locked = false;
        if (q.tiles) {
          q.picked = q.tiles.map((t, i) => i).filter(i => !q.word.includes(q.tiles[i].l)).slice(0, 1);
          checkSpell(q);
        } else {
          const i = q.options.findIndex(o => !o.right);
          choose(i, ui.choices.children[i]);
        }
        await new Promise(res => requestAnimationFrame(res));
        look();
      }
      npc.level = undefined;
      return bad;
    }, `${w}x${h}`));
  }
  check(`${tag}: her drawing sits in the dialog, off the cards, at every size`, !fits.length, fits);
  await page.setViewportSize({ width: 1024, height: 768 });

  const r = await page.evaluate(async () => {
    const seen = el => el.getClientRects().length > 0; // the big picture is fixed, so no offsetParent
    const frame = document.getElementById('dlg-drawing');
    const big = document.getElementById('drawing-big');
    const tick = () => new Promise(res => setTimeout(res, 50));
    const out = {};
    // Big with a tap, gone with the next; gone too when the dialog steps aside.
    frame.click();
    const bigImg = document.getElementById('drawing-big-img');
    for (let t = 0; t < 3000 && !(bigImg.complete && bigImg.naturalWidth); t += 50) await tick();
    out.big = seen(big) && bigImg.naturalWidth > 0;
    big.click();
    out.bigGone = !seen(big);
    frame.click();
    caveStepAside(state.talking);
    await tick();
    out.asideGone = !seen(big);
    caveStepBack();
    out.back = seen(frame);
    // Closing the dialog hides it.
    closeDialog();
    await tick();
    out.closed = !seen(frame) && frame.classList.contains('hidden') && !seen(big) && !ui.dialog.classList.contains('drawn');
    // Another villager: the portrait, no drawing.
    const other = state.scene.npcs.find(n => !KID_MONSTERS[n.look] && !n.mount && !n.shop && !n.unicorn);
    openDialog(other);
    out.other = { name: other.name, drawing: seen(frame), portrait: seen(document.querySelector('.portrait')) };
    closeDialog();
    out.free = !state.busy;
    return out;
  });
  check(`${tag}: a tap shows her drawing big and any tap closes it, as does the dialog stepping aside`, r.big && r.bigGone && r.asideGone && r.back, r);
  check(`${tag}: closing the dialog hides her drawing`, r.closed, r);
  check(`${tag}: another villager's dialog shows the portrait and no drawing`, !r.other.drawing && r.other.portrait && r.free, r.other);
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

// The Monster Village and its tower (js/monster-village.js): everyone out
// in the village is one of the monsters she drew, asking the village's
// questions with her drawing in the dialog, and a tap on any part of a
// long one talks to it. In by the tower's door, up its stairs to the
// second floor (its name shown, the ones who live there), down again to
// the foot of the stairs, and out to the door she went in by. Each of her
// monsters is in one place only.
async function monsterTower(browser, edition) {
  const { page, ctx, errors } = await game(browser, { edition });
  const r = await page.evaluate(async () => {
    const wait = ok => new Promise(res => { const t0 = performance.now(); const go = () => (ok() || performance.now() - t0 > 15000 ? res() : setTimeout(go, 50)); go(); });
    const settled = () => !ui.fade.classList.contains('on') && !state.hero.path.length;
    const at = () => [state.hero.c, state.hero.r].join();
    const kids = sc => sc.npcs.filter(n => !n.mount).map(n => ({ look: n.look, kid: !!KID_MONSTERS[n.look], level: n.level, named: !!KID_MONSTERS[n.look] && n.name === KID_MONSTERS[n.look].name }));
    state.stars = 60;
    if (!Sound.muted) Sound.toggleMute();
    const out = {};
    changeScene('monster');
    await wait(() => state.scene === sceneFor('monster') && settled());
    const village = state.scene;
    out.village = kids(village);
    const npc = village.npcs.find(n => KID_MONSTERS[n.look]);
    state.busy = false;
    openDialog(npc);
    out.talk = { asked: !!state.question, drawing: !document.getElementById('dlg-drawing').classList.contains('hidden') };
    closeDialog();
    // A tap on any part of a long one talks to it: the caterpillar's head
    // and tail, the snake's head and its fish's tail (pixels of the art),
    // standing next to it.
    const said = [];
    const talk = window.talkTo;
    window.talkTo = m => said.push(m.look);
    const box = screen.getBoundingClientRect();
    out.taps = [['kidmon8', 4, 7], ['kidmon8', 27, 12], ['kidmon12', 6, 10], ['kidmon12', 38, 14]].map(([look, col, row]) => {
      const n = state.scene.npcs.find(m => m.look === look);
      placeHero(n.c + 1, n.r + 1);
      snapCamera();
      const p = tileCenter(state.scene, n.c, n.r);
      const sp = kidMonsterSprite(look, 0);
      const wx = p.x - sp.ax + col + 1;
      const wy = p.y + 1 - sp.ay + row + 1;
      const sx = (wx - Math.round(state.cam.x)) * state.scale;
      const sy = (wy - Math.round(state.cam.y)) * state.scale;
      said.length = 0;
      state.busy = false;
      screen.dispatchEvent(new PointerEvent('pointerdown', { clientX: box.left + sx * box.width / screen.width, clientY: box.top + sy * box.height / screen.height, bubbles: true }));
      state.hero.path = [];
      state.hero.onArrive = null;
      return `${look}@${col}:${said.join() || 'nobody'}`;
    });
    window.talkTo = talk;
    const door = village.doors.find(d => d.target === 'tower');
    enterDoor(door);
    await wait(() => state.scene === sceneFor('tower') && settled());
    out.tower = { inside: state.scene === sceneFor('tower'), looks: kids(state.scene).map(k => k.look).join() };
    tapObject(state.scene.objects.find(o => o.stairs));
    await wait(() => state.scene === sceneFor('tower2') && settled());
    out.up = { there: state.scene === sceneFor('tower2'), at: at(), label: ui.place.textContent, monsters: kids(state.scene), busy: state.busy };
    tapObject(state.scene.objects.find(o => o.stairs));
    await wait(() => state.scene === sceneFor('tower') && settled());
    out.down = { there: state.scene === sceneFor('tower'), at: at(), label: ui.place.textContent };
    leaveRoom();
    await wait(() => state.scene === village && settled());
    out.out = { there: state.scene === village, at: at(), door: [door.c, door.r].join(), busy: state.busy };
    return out;
  });
  const tag = `Monster Tower (${edition})`;
  const want = looks => looks.map(n => n.look).join();
  const theirs = await page.evaluate(() => ({ village: MONSTER_NPCS.map(n => n.look).join(), up: TOWER2_NPCS.map(n => n.look).join(), floor1: TOWER_NPCS.map(n => n.look).join(),
    upName: place('tower2'), downName: place('tower') }));
  check(`${tag}: everyone out in the village is one of her monsters, named as she drew them, asking the village's questions`,
    want(r.village) === theirs.village && r.village.length >= 3 && r.village.every(k => k.kid && k.named && k.level === 6) && r.talk.asked && r.talk.drawing, r);
  check(`${tag}: up the stairs from the ground floor to the second floor, where a few more of her monsters live`, r.tower.inside && r.tower.looks === theirs.floor1 && r.up.there && r.up.at === '9,4'
    && r.up.label === theirs.upName && want(r.up.monsters) === theirs.up && r.up.monsters.every(k => k.kid && k.named && k.level === 6) && !r.up.busy, r);
  check(`${tag}: a tap on a long monster's head or tail talks to it`, r.taps.every(t => t.split(':')[1] === t.split('@')[0]), r.taps);
  const all = [theirs.village, theirs.floor1, theirs.up].join().split(',');
  check(`${tag}: each of her monsters is in one place only`, new Set(all).size === all.length, all);
  check(`${tag}: down again to the foot of the stairs, and out to the door she went in by`, r.down.there && r.down.at === '10,4' && r.down.label === theirs.downName
    && r.out.there && r.out.at === r.out.door && !r.out.busy, r);
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

// Blending's first steps and the sound magic (js/quiz.js, js/blend-magic.js),
// with the sound off, so the show moves on its timers: a new child starts
// at one sound (two cards, the letter's pure sound asked); answers right in
// a row don't move her on, knowing every letter does (a level-up), and she
// never goes back down to one sound; a parent's + past one sound moves her
// on too. The first question at two sounds and at three sounds shows the
// magic first, once each (kept over a reload), and the dialog asks after;
// a second miss shows the answer as the magic with the question's word (one
// sound: its bubble and ✨ only), then the right card glows to tap. While it
// shows the game is busy, a tap outside does nothing (no walking), the
// parent panel holds it, and ✖ skips to the end. In the Unicorn Village's
// game (the Car Village's): a first try counts towards her letters, a
// missed letter comes back two rounds on, the answer after two misses is
// the magic, the end card shows the letters she knows (a new one
// sparkling) and, once all are lit, the party and the two-sound step open;
// 🔁 then starts with the magic at two sounds. Past the play limit the town
// sleeps only once the show and its question are over.
async function blendSteps(browser, edition) {
  const { page, ctx, errors } = await game(browser, { seed: { edition, stars: 40 }, edition });
  await page.evaluate(() => { if (!Sound.muted) Sound.toggleMute(); changeScene('forest'); });
  await page.waitForTimeout(800);
  // Helpers in the page: a forest villager asks blending only.
  await page.evaluate(() => {
    window.T = {};
    T.said = [];
    const say = Sound.say;
    Sound.say = (parts, who) => { for (const p of [].concat(parts)) if (p && p.text) T.said.push(String(p.text)); return say(parts, who); };
    T.sleep = ms => new Promise(res => setTimeout(res, ms));
    T.until = async (ok, ms = 15000) => { for (let t = 0; t < ms && !ok(); t += 100) await T.sleep(100); return ok(); };
    T.shown = id => !document.getElementById(id).classList.contains('hidden');
    QUIZ_TYPES.forest = ['blend'];
    T.npc = state.scene.npcs.find(n => !n.mount && !n.shop);
    T.ask = () => {
      if (state.talking) closeDialog();
      const k = Quiz.skill('blend');
      Object.assign(k, { n: 0, easy: false });
      T.npc.lastQuiz = null;
      T.npc.missed = null;
      state.busy = false;
      openDialog(T.npc);
      return state.question;
    };
    T.tap = right => {
      const q = state.question;
      const i = q.options.findIndex((o, j) => !!o.right === right && !ui.choices.children[j].disabled);
      choose(i, ui.choices.children[i]);
    };
    T.unlock = () => { if (state.question) { state.question.locked = false; ui.dialog.classList.remove('listening'); } };
    // Taps each step of the show as it comes, until it is over.
    T.through = async () => {
      const seen = [];
      for (let i = 0; i < 300 && blendMagicShown(); i++) {
        const b = blendMagic.buttons.find(x => x.classList.contains('next'));
        if (b && !seen.includes(b.dataset.step)) { seen.push(b.dataset.step); b.click(); }
        await T.sleep(100);
      }
      return seen;
    };
    T.magic = () => ({ shown: blendMagicShown(), dialog: T.shown('dialog'), busy: state.busy, w: blendMagic.m && blendMagic.m.w, bubbles: blendMagic.row.children.length,
      steps: blendMagic.buttons.filter(b => !b.classList.contains('hidden')).map(b => b.dataset.step) });
  });
  const r = {};
  // A new child: one sound.
  r.one = await page.evaluate(() => {
    const q = T.ask();
    return { tier: Quiz.skill('blend').t, kind: q.kind, cards: q.options.length, letter: q.letter, sound: q.ask.some(p => p.text === `/${q.letter}/`),
      clue: ui.clue.textContent.trim() === q.letter, magic: blendMagicShown() };
  });
  // Right answers in a row: still one sound.
  r.row = await page.evaluate(async () => {
    for (let i = 0; i < 8; i++) {
      T.ask();
      T.unlock();
      T.tap(true);
      await T.sleep(50);
    }
    return { tier: Quiz.skill('blend').t, letters: Object.keys(state.skill.letters).length };
  });
  // Every letter known but one, right once already: right once more passes the step.
  r.pass = await page.evaluate(async () => {
    for (const s of ONE_SOUND) state.skill.letters[s.l.toUpperCase()] = { right: 2, hit: 10, last: 10 };
    state.skill.letters.N = { right: 1, hit: 10, last: 10 };
    T.said.length = 0;
    let q;
    for (let i = 0; i < 40; i++) {
      q = T.ask();
      T.unlock();
      if (q.letter === 'n') break;
      T.tap(true);
    }
    T.said.length = 0;
    T.tap(true);
    await T.until(() => !!document.querySelector('.level-up'), 3000);
    return { letter: q.letter, tier: Quiz.skill('blend').t, levelUp: !!q.levelUp, two: !!q.twoOpen, line: T.said.some(t => LINES.blendTwo.includes(t)), banner: !!document.querySelector('.level-up') };
  });
  // Two sounds: the magic first (bee), then the dialog asks.
  r.intro2 = await page.evaluate(async () => {
    const q = T.ask();
    const at = T.magic();
    const seen = await T.through();
    await T.until(() => T.shown('dialog'));
    return { at, seen, kind: q.kind, target: q.target, after: { dialog: T.shown('dialog'), magic: blendMagicShown(), asked: state.question === q }, seenStep: state.guide.magic };
  });
  // The magic over the dialog: busy, a tap outside does nothing, the panel holds it.
  await page.evaluate(() => { closeDialog(); T.ask(); T.unlock(); T.tap(false); });
  await page.waitForFunction(() => blendMagicShown(), null, { timeout: 15000 }).catch(() => {});
  const before = await page.evaluate(() => ({ magic: blendMagicShown(), busy: state.busy, w: blendMagic.m && blendMagic.m.w, target: state.question && state.question.target, dialog: T.shown('dialog'), hero: [state.hero.c, state.hero.r] }));
  const vp = page.viewportSize();
  await page.mouse.click(vp.width / 2, 120);
  await page.waitForTimeout(400);
  r.outside = await page.evaluate(([b]) => ({ before: b, magic: blendMagicShown(), busy: state.busy, path: state.hero.path.length, hero: [state.hero.c, state.hero.r], dialog: T.shown('dialog') }), [before]);
  r.panel = await page.evaluate(async () => {
    document.getElementById('parent').click();
    const step = blendMagic.step;
    await T.sleep(9000);
    const held = blendMagic.step === step && blendMagicShown();
    document.querySelector('.parent-close').click();
    return { held, step, busy: state.busy, magic: blendMagicShown() };
  });
  // Through the show: the dialog back, the right card glowing to tap; no going back to one sound.
  r.answer = await page.evaluate(async () => {
    const q = state.question;
    const seen = await T.through();
    await T.until(() => T.shown('dialog') && !q.locked);
    const glow = [...ui.choices.children].findIndex(b => b.classList.contains('glow'));
    const right = q.options.findIndex(o => o.right);
    if (glow >= 0) choose(glow, ui.choices.children[glow]);
    await T.sleep(100);
    // A second miss on another question: two in a row, still at two sounds.
    const q2 = T.ask();
    T.unlock();
    T.tap(false);
    if (!blendMagicShown() && !q2.done) { T.unlock(); T.tap(false); }
    await T.until(() => blendMagicShown());
    closeDialog();
    return { seen, glow, right, done: q.done, kind2: q2.kind, tier: Quiz.skill('blend').t, magicClosed: !blendMagicShown(), busy: state.busy };
  });
  // ✖ skips to the end: the dialog comes back.
  r.skip = await page.evaluate(async () => {
    const q = T.ask();
    T.unlock();
    T.tap(false);
    if (!blendMagicShown()) { T.unlock(); T.tap(false); }
    await T.until(() => blendMagicShown());
    blendMagic.close.click();
    await T.until(() => T.shown('dialog'));
    const out = { magic: blendMagicShown(), dialog: T.shown('dialog'), busy: state.busy, reveal: !!q.reveal };
    closeDialog();
    return out;
  });
  // A parent's + past one sound moves her on (no letters needed); three sounds: its magic (sun) once.
  r.three = await page.evaluate(async () => {
    state.skill = {};
    state.guide.magic = 0;
    Quiz.setTier('blend', 2);
    const two = T.ask().kind;
    await T.through();
    closeDialog();
    Quiz.setTier('blend', 3);
    const q = T.ask();
    const at = T.magic();
    await T.through();
    await T.until(() => T.shown('dialog'));
    const kind = state.question.kind;
    closeDialog();
    save();
    return { two, at, kind, target: q.target, seenStep: state.guide.magic };
  });
  // Kept over a reload: no magic at three sounds again.
  await page.reload();
  await page.waitForFunction(() => typeof Account !== 'undefined' && Account._started && typeof state !== 'undefined');
  await page.evaluate(() => { document.getElementById('start-btn').click(); if (!Sound.muted) Sound.toggleMute(); changeScene('forest'); });
  await page.waitForTimeout(800);
  r.reload = await page.evaluate(() => {
    QUIZ_TYPES.forest = ['blend'];
    const npc = state.scene.npcs.find(n => !n.mount && !n.shop);
    Object.assign(Quiz.skill('blend'), { n: 0, easy: false });
    state.busy = false;
    openDialog(npc);
    const out = { tier: Quiz.skill('blend').t, magic: blendMagicShown(), dialog: !document.getElementById('dialog').classList.contains('hidden'), seenStep: state.guide.magic };
    closeDialog();
    return out;
  });
  // One sound: the short show.
  r.short = await page.evaluate(async () => {
    window.T = window.T || {};
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    const npc = state.scene.npcs.find(n => !n.mount && !n.shop);
    Quiz.setTier('blend', 1);
    Object.assign(Quiz.skill('blend'), { n: 0, easy: false });
    state.busy = false;
    openDialog(npc);
    const q = state.question;
    q.locked = false;
    const i = q.options.findIndex(o => !o.right);
    choose(i, ui.choices.children[i]);
    for (let t = 0; t < 100 && !blendMagicShown(); t++) await sleep(100);
    const out = { kind: q.kind, shown: blendMagicShown(), bubbles: blendMagic.row.children.length, steps: blendMagic.buttons.filter(b => !b.classList.contains('hidden')).map(b => b.dataset.step), w: blendMagic.m && blendMagic.m.w, target: q.target };
    closeDialog();
    return out;
  });
  // The Unicorn Village's game at one sound.
  await page.evaluate(() => { changeScene('unicorn'); });
  await page.waitForTimeout(800);
  r.game = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    const until = async (ok, ms = 15000) => { for (let t = 0; t < ms && !ok(); t += 100) await sleep(100); return ok(); };
    const shown = id => !document.getElementById(id).classList.contains('hidden');
    state.skill = {};
    state.guide.magic = 0;
    const g = MINI_GAMES.unicorn;
    state.busy = false;
    openMini(g.host(), g);
    await sleep(50);
    const live = () => mini.items.filter(x => x.state === 'live');
    const out = { kind: mini.rounds[0].q.kind, clue: mini.letter.textContent, letter: mini.rounds[0].q.letter };
    mini.locked = false;
    miniMiss(live().find(x => !x.right));
    out.counted = !!state.skill.letters[out.letter.toUpperCase()];
    out.back = mini.rounds[2].q.letter === out.letter;
    mini.locked = false;
    miniMiss(live().find(x => !x.right));
    await until(() => blendMagicShown());
    out.magic = { shown: blendMagicShown(), locked: mini.locked, glow: mini.items.filter(x => x.glow).length === 1 && mini.items.find(x => x.glow).right, w: blendMagic.m && blendMagic.m.w };
    for (let i = 0; i < 300 && blendMagicShown(); i++) { const b = blendMagic.buttons.find(x => x.classList.contains('next')); if (b) b.click(); await sleep(100); }
    out.magic.after = { locked: mini.locked, shown: blendMagicShown() };
    closeMini();
    // Every letter known but one, right once already: a game where she gets it.
    for (const s of ONE_SOUND) state.skill.letters[s.l.toUpperCase()] = { right: 2, hit: 10, last: 10 };
    state.skill.letters.Z = { right: 1, hit: 10, last: 10 };
    state.busy = false;
    openMini(g.host(), g);
    for (let i = 0; i < 5; i++) {
      await until(() => !mini.locked && live().length);
      mini.locked = false;
      miniCatch(live().find(x => x.right));
      await until(() => mini.round > i || shown('mini-end'), 8000);
    }
    await until(() => shown('mini-end'));
    await sleep(2500);
    const box = document.getElementById('mini-letters');
    out.end = { letters: box.children.length, shown: !box.classList.contains('hidden'), lit: box.querySelectorAll('.ml.on').length, fresh: [...box.querySelectorAll('.ml.new')].map(x => x.textContent).join(''),
      all: box.classList.contains('all'), two: shown('mini-two'), tier: Quiz.skill('blend').t };
    const card = document.getElementById('mini-end').getBoundingClientRect();
    const m = mini.el.getBoundingClientRect();
    out.end.fits = card.top >= m.top && card.bottom <= m.bottom && card.left >= m.left && card.right <= m.right;
    // 🔁 at two sounds: the magic first.
    document.getElementById('mini-again').click();
    await sleep(100);
    out.again = { magic: blendMagicShown(), w: blendMagic.m && blendMagic.m.w, round: mini.round, kind: mini.rounds[0].q.kind, targets: mini.rounds.map(x => x.q.target),
      first: (mini.rounds[0].q.options || []).map(o => o.wrong) };
    for (let i = 0; i < 300 && blendMagicShown(); i++) { const b = blendMagic.buttons.find(x => x.classList.contains('next')); if (b) b.click(); await sleep(100); }
    out.again.after = { round: mini.round, magic: blendMagicShown() };
    closeMini();
    out.closed = { busy: state.busy, magic: blendMagicShown() };
    return out;
  });
  // Past the play limit while the magic shows: the town sleeps only after it and the question.
  await page.evaluate(() => { changeScene('forest'); });
  await page.waitForTimeout(800);
  r.limit = await page.evaluate(async () => {
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    const until = async (ok, ms = 15000) => { for (let t = 0; t < ms && !ok(); t += 100) await sleep(100); return ok(); };
    QUIZ_TYPES.forest = ['blend'];
    const npc = state.scene.npcs.find(n => !n.mount && !n.shop);
    Quiz.setTier('blend', 3);
    state.guide.magic = 3;
    Object.assign(Quiz.skill('blend'), { n: 0, easy: false });
    state.busy = false;
    openDialog(npc);
    const q = state.question;
    for (let k = 0; k < 2 && !blendMagicShown(); k++) {
      q.locked = false;
      ui.dialog.classList.remove('listening');
      const i = q.options.findIndex((o, j) => !o.right && !ui.choices.children[j].disabled);
      choose(i, ui.choices.children[i]);
      await sleep(50);
    }
    await until(() => blendMagicShown());
    state.settings.playLimit = 1;
    state.playtime = { day: guideDay(), ms: 60001, wakes: 0 };
    await sleep(1500);
    const during = { magic: blendMagicShown(), asleep: guide.asleep };
    closeDialog();
    await until(() => guide.asleep, 3000);
    const out = { during, after: { asleep: guide.asleep, magic: blendMagicShown() } };
    if (guide.asleep) guideWake();
    state.settings.playLimit = 0;
    return out;
  });
  // A parent puts her back at one sound: the letters she knew count again only once right again.
  r.back = await page.evaluate(() => {
    state.skill = { letters: Object.fromEntries(ONE_SOUND.map(s => [s.l.toUpperCase(), { right: 3, hit: 1000, last: 1000 }])) };
    Quiz.setTier('blend', 2);
    const two = Quiz.letters().filter(x => x.known).length;
    Quiz.setTier('blend', 1);
    const one = Quiz.letters().filter(x => x.known).length;
    Object.assign(state.skill.letters.B, { hit: Date.now() + 5, last: Date.now() + 5 });
    const again = Quiz.letters().filter(x => x.known).map(x => x.l).join('');
    return { two, one, again, tier: Quiz.skill('blend').t };
  });
  const MAGIC_INTRO = await page.evaluate(() => MAGIC_INTRO);
  const tag = `blend steps (${edition})`;
  check(`${tag}: a new child starts at one sound: two pictures, the letter's pure sound, no magic`, r.one.tier === 1 && r.one.kind === 'oneSound' && r.one.cards === 2 && r.one.sound && r.one.clue && !r.one.magic, r.one);
  check(`${tag}: answers right in a row don't move her on from one sound (her letters count)`, r.row.tier === 1 && r.row.letters > 0, r.row);
  check(`${tag}: knowing every letter moves her on to two sounds: a level-up, and "You can blend two sounds now!"`, r.pass.letter === 'n' && r.pass.tier === 2 && r.pass.levelUp && r.pass.two && r.pass.line && r.pass.banner, r.pass);
  check(`${tag}: two sounds: the magic first (bee or key, not the question's word) with the dialog aside and busy, then the dialog asks`, r.intro2.at.shown && !r.intro2.at.dialog && r.intro2.at.busy && MAGIC_INTRO[2].includes(r.intro2.at.w) && r.intro2.at.w !== r.intro2.target &&
    r.intro2.seen.join() === 'slow,fast,pop' && r.intro2.kind === 'twoSounds' && r.intro2.after.dialog && !r.intro2.after.magic && r.intro2.after.asked && r.intro2.seenStep === 2, r.intro2);
  check(`${tag}: a second miss shows the answer as the magic with the question's word`, r.outside.before.magic && r.outside.before.w === r.outside.before.target && !r.outside.before.dialog, r.outside.before);
  check(`${tag}: a tap outside the magic does nothing: still showing, busy, she doesn't walk`, r.outside.magic && r.outside.busy && !r.outside.path && r.outside.hero.join() === r.outside.before.hero.join() && !r.outside.dialog, r.outside);
  check(`${tag}: the parent panel holds the magic, and closing it leaves the game busy`, r.panel.held && r.panel.busy && r.panel.magic, r.panel);
  check(`${tag}: after the show the dialog is back with the right card glowing to tap`, r.answer.seen.length >= 1 && r.answer.glow === r.answer.right && r.answer.done, r.answer);
  check(`${tag}: misses at two sounds never send her back to one sound; closing the dialog closes the magic`, r.answer.kind2 === 'twoSounds' && r.answer.tier === 2 && r.answer.magicClosed && r.answer.busy === false, r.answer);
  check(`${tag}: ✖ on the magic skips to the end: the dialog is back`, !r.skip.magic && r.skip.dialog && r.skip.busy && r.skip.reveal, r.skip);
  check(`${tag}: a parent's + past one sound moves her on; three sounds: the magic first (sun or hat, not the question's word), once`, r.three.two === 'twoSounds' && r.three.at.shown && MAGIC_INTRO[3].includes(r.three.at.w) && r.three.at.w !== r.three.target && r.three.at.bubbles === 3 && r.three.kind === 'blend' && r.three.seenStep === 3, r.three);
  check(`${tag}: the magic seen at a step is kept over a reload`, r.reload.tier === 3 && !r.reload.magic && r.reload.dialog && r.reload.seenStep === 3, r.reload);
  check(`${tag}: one sound: the short show, its letter's bubble and ✨ only`, r.short.kind === 'oneSound' && r.short.shown && r.short.bubbles === 1 && r.short.steps.join() === 'pop' && r.short.w === r.short.target, r.short);
  check(`${tag}: the Unicorn game at one sound: its letter at the top, a first try counts, a missed letter comes back two rounds on`, r.game.kind === 'oneSound' && r.game.clue === r.game.letter.toUpperCase() + r.game.letter && r.game.counted && r.game.back, r.game);
  check(`${tag}: the Unicorn game: two misses show the magic over the game, the right one glowing, and then she can tap`, r.game.magic.shown && r.game.magic.locked && r.game.magic.glow && !r.game.magic.after.locked && !r.game.magic.after.shown, r.game.magic);
  check(`${tag}: the end card shows every letter, the new one sparkling; all lit: the party, and two sounds open`, r.game.end.shown && r.game.end.letters === 24 && r.game.end.fresh === 'z' && r.game.end.lit === 24 && r.game.end.all && r.game.end.two && r.game.end.tier === 2 && r.game.end.fits, r.game.end);
  // (The other word will do unless it is a later round's answer or one of the first round's pictures.)
  check(`${tag}: 🔁 at two sounds starts with the magic (not its first round's word, nor a later one's if the other will do), then the rounds`, r.game.again.magic && MAGIC_INTRO[2].includes(r.game.again.w) && r.game.again.w !== r.game.again.targets[0] &&
    (!r.game.again.targets.includes(r.game.again.w) || MAGIC_INTRO[2].every(w => r.game.again.targets.includes(w) || r.game.again.first.includes(w))) && r.game.again.kind === 'twoSounds' && r.game.again.after.round === 0 && !r.game.again.after.magic && r.game.closed.busy === false && !r.game.closed.magic, r.game.again);
  check(`${tag}: past the play limit the magic plays on, and the town sleeps once it and the question are over`, r.limit.during.magic && !r.limit.during.asleep && r.limit.after.asleep && !r.limit.after.magic, r.limit);
  check(`${tag}: put back at one sound by a parent, the letters she knew count once she gets them right again`, r.back.two === 24 && r.back.one === 0 && r.back.again === 'b' && r.back.tier === 1, r.back);
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

// The hair salon in town (js/salon.js, the princess edition): a tap on the
// hairdresser opens its card. A new hairstyle costs its stars: they leave
// the ⭐ count but not the stars she has earned, so a gate she opened stays
// open; it is hers and on her, and the card stays open. With too few stars
// nothing changes; one she has had is free; a hair colour has its own price.
// The wardrobe's hairstyle tab sends her to the salon; hairstyles are never
// presents nor in the shop; spent stars stay spent over a reload. The
// captain edition has no salon.
async function hairSalon(browser, edition, look) {
  const { page, ctx, errors } = await game(browser, { edition });
  const r = await page.evaluate(async look => {
    const wait = ok => new Promise(res => { const t0 = performance.now(); const go = () => (ok() || performance.now() - t0 > 15000 ? res() : setTimeout(go, 50)); go(); });
    const settled = () => !ui.fade.classList.contains('on') && !state.hero.path.length;
    const town = sceneFor('town');
    const keeper = town.npcs.find(n => n.salon);
    const building = town.objects.find(o => o.kind === 'salon');
    if (isCaptain()) return { captain: { keeper: !!keeper, building: !!building, slot: WARDROBE.some(w => w.slot === 'style'), card: !!salonUi.card } };
    if (!Sound.muted) Sound.toggleMute();
    if (look === 'boy') { setPlayer({ title: 'prince', look: 'boy' }); wearLook(); }
    const shown = () => !salonUi.card.classList.contains('hidden');
    const pics = () => [...salonUi.items.querySelectorAll('.wd-item')];
    const out = {};
    changeScene('town');
    await wait(() => state.scene === town && settled());
    state.stars = FOREST_STARS + 2;
    save();
    renderStars();
    // Next to her, the first steps' 👆 and the idle nudge come from someone who asks.
    placeHero(keeper.c + 1, keeper.r);
    out.guide = { nearest: guideNearest() && guideNearest().name, keeper: keeper.name };
    const step = (state.guide = { step: 0 });
    // A tap on the hairdresser walks her there and opens the card.
    placeHero(keeper.c + 3, keeper.r);
    snapCamera();
    const box = screen.getBoundingClientRect();
    const p = tileCenter(town, keeper.c, keeper.r);
    const sx = (p.x - Math.round(state.cam.x)) * state.scale;
    const sy = (p.y - 10 - Math.round(state.cam.y)) * state.scale;
    state.busy = false;
    screen.dispatchEvent(new PointerEvent('pointerdown', { clientX: box.left + sx * box.width / screen.width, clientY: box.top + sy * box.height / screen.height, bubbles: true }));
    await wait(shown);
    out.guide.step = step.step;
    state.guide = { step: 3 };
    const styles = Object.entries(HAIR_STYLES).filter(([, it]) => suits(it));
    out.open = { shown: shown(), busy: state.busy, tab: salon.tab, pics: pics().length, styles: styles.length, stars: salonUi.stars.textContent,
      prices: pics().map(b => b.querySelector('.price').textContent), worn: pics().filter(b => b.classList.contains('worn')).length, buy: salonUi.buy.classList.contains('hidden') };
    // A new one: picked, it shows its price; ✂️ pays and puts it on.
    const newOne = styles.findIndex(([v]) => !state.owned.style.includes(v));
    const value = styles[newOne][0];
    const was = heroSprite(state.outfit, 0).canvas.toDataURL();
    pics()[newOne].click();
    out.pick = { pick: salon.pick && salon.pick.value, buy: !salonUi.buy.classList.contains('hidden'), text: salonUi.buy.textContent, lit: pics().filter(b => b.classList.contains('on')).length };
    const earned = starsEarned();
    salonUi.buy.click();
    const forest = exitSpots(town).find(sp => sp.link && sp.link.needStars === FOREST_STARS);
    const said = [];
    const showPlace0 = window.showPlace;
    const walkTo0 = window.walkTo;
    window.showPlace = t => said.push(t);
    window.walkTo = () => { said.push('walk'); return true; };
    goLink(forest.tiles);
    window.showPlace = showPlace0;
    window.walkTo = walkTo0;
    out.bought = { stars: state.stars, earned: starsEarned(), before: earned, style: state.outfit.style, value, mine: state.owned.style.includes(value), shown: shown(),
      sprite: heroSprite(state.outfit, 0).canvas.toDataURL() !== was, hud: ui.stars.querySelector('.count').textContent, forest: said.join(), gift: notYet({ forest: true }),
      tick: pics()[newOne].querySelector('.price').textContent, buy: salonUi.buy.classList.contains('hidden') };
    // Another new one (7 → 2), then too few stars for a third: nothing changes.
    pics()[styles.findIndex(([v]) => !state.owned.style.includes(v))].click();
    salonUi.buy.click();
    out.second = { stars: state.stars, earned: starsEarned() };
    const another = styles.findIndex(([v]) => !state.owned.style.includes(v));
    pics()[another].click();
    const outfit = JSON.stringify(state.outfit);
    salonUi.buy.click();
    out.poor = { stars: state.stars, outfit: JSON.stringify(state.outfit) === outfit, mine: state.owned.style.includes(styles[another][0]), msg: salonUi.msg.textContent };
    // Back to the one she had: free.
    const first = styles.findIndex(([v]) => v === (look === 'boy' ? 'short' : 'long'));
    pics()[first].click();
    out.back = { text: salonUi.buy.textContent };
    salonUi.buy.click();
    out.back = Object.assign(out.back, { stars: state.stars, style: state.outfit.style });
    // The hair colour tab: its own price.
    salonUi.tabs.querySelectorAll('.wd-tab')[1].click();
    out.colours = { tab: salon.tab, prices: pics().map(b => b.querySelector('.price').textContent) };
    closeSalon();
    out.closed = { shown: shown(), busy: state.busy };
    // The wardrobe's hairstyle tab: hers to wear, the others at the salon.
    changeScene('yuna');
    await wait(() => state.scene === sceneFor('yuna') && settled());
    openWardrobe();
    wdTab = 'style';
    renderWardrobe();
    const items = [...document.querySelectorAll('#wd-slots .wd-item')];
    const locked = items[styles.findIndex(([v]) => !state.owned.style.includes(v))];
    const wearing = state.outfit.style;
    locked.click();
    out.wardrobe = { pics: items.length, styles: styles.length, note: document.querySelector('#wd-slots .wd-title .nm').textContent, same: state.outfit.style === wearing };
    items[newOne].click();
    out.wardrobe.wore = state.outfit.style;
    closeWardrobe();
    // Never a present nor in the shop, and not counted with the presents.
    out.never = { shop: shopItems().filter(it => it.slot === 'style').length };
    const npc = sceneFor('forest').npcs.find(n => !n.mount && !n.shop && !n.monster);
    const slots = new Set();
    for (let i = 0; i < 40 && hasNewGift(npc); i++) { offerReward(npc); slots.add(state.gift.slot); acceptReward(true); }
    out.never.presents = slots.has('style');
    out.never.slots = [...slots];
    return out;
  }, look);
  const tag = `hair salon (${edition}${look ? ` ${look}` : ''})`;
  if (r.captain) {
    check(`${tag}: no salon, hairdresser nor hairstyle tab in the captain edition`, !r.captain.keeper && !r.captain.building && !r.captain.slot && r.captain.card, r.captain);
  } else {
    check(`${tag}: a tap on the hairdresser opens the card on the hairstyles, hers ticked and on her, the rest ⭐5`,
      r.open.shown && r.open.busy && r.open.tab === 'style' && r.open.pics === r.open.styles && r.open.stars.includes('12') && r.open.worn === 1 && r.open.buy
      && r.open.prices.filter(t => t === '✓').length >= 1 && r.open.prices.filter(t => t.includes('5')).length === r.open.styles - r.open.prices.filter(t => t === '✓').length, r.open);
    check(`${tag}: the first steps' 👆 and the idle nudge never come from the hairdresser, and a tap on her isn't a talk`, !!r.guide.nearest && r.guide.nearest !== r.guide.keeper && r.guide.step === 0, r.guide);
    check(`${tag}: a new one picked: lit, and ✂️ says its price`, r.pick.buy && r.pick.lit === 1 && r.pick.text.includes('5'), r.pick);
    check(`${tag}: ✂️ pays 5 stars (12 → 7), it is hers and on her, the card stays open`, r.bought.stars === 7 && r.bought.hud === '7' && r.bought.style === r.bought.value && r.bought.mine && r.bought.shown
      && r.bought.sprite && r.bought.tick === '✓' && r.bought.buy, r.bought);
    check(`${tag}: the stars she earned still count (12), so the forest she opened stays open with 7 left`, r.bought.earned === 12 && r.bought.before === 12 && r.bought.forest === 'walk' && !r.bought.gift, r.bought);
    check(`${tag}: another new one: 7 → 2, still 12 earned`, r.second.stars === 2 && r.second.earned === 12, r.second);
    check(`${tag}: too few stars for a third: nothing changes, and she hears how many more`, r.poor.stars === 2 && r.poor.outfit && !r.poor.mine && r.poor.msg.includes('별'), r.poor);
    check(`${tag}: back to the one she had: free`, !r.back.text.includes('⭐') && r.back.stars === 2 && r.back.style === (look === 'boy' ? 'short' : 'long'), r.back);
    check(`${tag}: the hair colour tab: ⭐3 for a new colour`, r.colours.tab === 'hair' && r.colours.prices.some(t => t.includes('3')) && r.colours.prices.includes('✓'), r.colours);
    check(`${tag}: closing it frees the game`, !r.closed.shown && !r.closed.busy, r.closed);
    check(`${tag}: the wardrobe's hairstyle tab: one she hasn't had sends her to the salon; hers she can wear`, r.wardrobe.pics === r.wardrobe.styles && r.wardrobe.note.includes('미용실') && r.wardrobe.same && r.wardrobe.wore === r.bought.value, r.wardrobe);
    check(`${tag}: hairstyles are never presents nor in the shop`, !r.never.shop && !r.never.presents && r.never.slots.length > 0, r.never);
    await page.reload();
    await page.waitForFunction(() => typeof Account !== 'undefined' && Account._started && typeof state !== 'undefined');
    const after = await page.evaluate(() => ({ stars: state.stars, earned: starsEarned(), owned: state.owned.style }));
    check(`${tag}: after a reload: 2 stars, 12 earned, the hairstyles still hers`, after.stars === 2 && after.earned === 12 && after.owned.includes(r.bought.value), after);
  }
  check(`${tag}: no page errors`, !errors.length, errors);
  await ctx.close();
}

// Halloween (js/halloween.js), in each edition: with ?halloween=1 every
// village has its pumpkins, ghosts and bats and every room its lantern or
// garland, none of them cutting off a tile she could reach; a pumpkin and
// a ghost say their words when tapped, the villagers wear a hat for the
// night (the king keeps his crown) and the game starts with "Happy
// Halloween". With ?halloween=0 there is none of it, and taking the
// decorations away from a dressed village gives back exactly the village.
async function halloween(browser, edition) {
  const SCENES = () => ['town', 'castle', 'castle2', 'yuna', 'forest', 'unicorn', 'dungeon', 'fairy', 'monster', 'tower', 'tower2',
    ...TOWN_HOUSES.map(h => `house-${h.letter}`), ...VILLAGE_HOMES.map(h => `home-${h.id}`)];
  const look = async on => {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(/^https?:/, r => (own(r) ? r.continue() : r.abort()));
    await page.addInitScript(() => localStorage.setItem('pixeltown-guest', '1'));
    await page.goto(`${URL}?edition=${edition}&halloween=${on}`);
    await page.waitForFunction(() => typeof Account !== 'undefined' && Account._started && typeof state !== 'undefined');
    const r = await page.evaluate(async names => {
      if (!Sound.muted) Sound.toggleMute();
      const said = [];
      const say = Sound.say;
      Sound.say = (parts, who) => { for (const p of [].concat(parts)) if (p && p.text) said.push(p.text); return say(parts, who); };
      const out = { on: HALLOWEEN_ON, start: LINES.start[0], scenes: {}, cut: [] };
      const reach = (sc, from) => hwReach(sc, from);
      for (const n of eval(names)()) {
        const sc = sceneFor(n);
        const props = sc.objects.filter(o => o.halloween && o.react); // the things standing on tiles
        // Every tile still reachable but the ones the things stand on.
        const from = sc.start || (sc.exitTiles || [sc.exit])[0] || (sc.links || [])[0] || sc.doors[0];
        if (from && props.length) {
          const now = reach(sc, from);
          props.forEach(o => { tileAt(sc, o.c0, o.r0).blocked = false; });
          const free = reach(sc, from);
          props.forEach(o => { tileAt(sc, o.c0, o.r0).blocked = true; });
          if (free - now !== props.length) out.cut.push(`${n}: ${free - now} tiles for ${props.length} things`);
        }
        out.scenes[n] = {
          outdoor: !!sc.outdoor, props: props.length, garland: sc.objects.some(o => o.halloween && o.background), ghosts: (sc.hwGhosts || []).length, bats: (sc.hwBats || []).length,
          // What the village is without them.
          // (A house painted for the night is compared as it was, picture and all.)
          sig: JSON.stringify({ objects: sc.objects.filter(o => !o.halloween).map(o => Object.assign({}, o, o.hwPlain)).map(o => [o.c0, o.r0, o.c1, o.r1, o.x, o.y, o.w, o.h, o.canvas && o.canvas.width > 40 ? o.canvas.toDataURL().length : ''].join()),
            blocked: sc.tiles.flatMap((row, r) => row.map((t, c) => (t.blocked && !props.some(o => o.c0 === c && o.r0 === r) ? `${c},${r}` : null))).filter(Boolean).join(' '),
            lamps: sc.lamps.filter(l => !l.halloween).map(l => [l.x, l.y].join()).join(' '), npcs: sc.npcs.map(v => [v.look, v.c, v.r].join()).join(' ') }),
        };
      }
      out.hat = { fisher: villagerSprite('fisher', 0).canvas.toDataURL(), king: villagerSprite('king', 0).canvas.toDataURL() };
      // The town: many kinds of things, a big one by most houses, every house painted.
      const town0 = sceneFor('town');
      const houses = [...new Set(town0.doors.map(d => d.obj).filter(Boolean))];
      const props = town0.objects.filter(o => o.halloween && o.react);
      out.town = { kinds: [...new Set(props.map(o => o.react.word))].sort().join(), houses: houses.length, painted: houses.filter(o => o.hwPlain).length,
        big: houses.filter(h => props.some(o => o.canvas.height > 24 && town0.doors.some(d => d.obj === h && Math.max(Math.abs(o.c0 - d.c), Math.abs(o.r0 - d.r)) <= 3))).length };
      // The little games: their names and pictures, and each draws a frame without trouble.
      out.games = Object.entries(MINI_GAMES).map(([k, g]) => `${k}:${g.title()}:${g.pip()}:${g.bag()}`).join(' ');
      out.drawn = [];
      for (const [k, g] of Object.entries(MINI_GAMES)) {
        try {
          const c = document.createElement('canvas').getContext('2d');
          g.draw.backdrop(c, 260, 160, 26, 16, 1.5);
          if (k === 'forest' && VG_FOREST.hop) VG_FOREST.hop('#ff8a2a', false);
          out.drawn.push(k);
        } catch (e) { out.drawn.push(`${k}: ${e.message}`); }
      }
      out.music = { town: musicPlaceOf(town0), forest: musicPlaceOf(sceneFor('forest')), room: musicPlaceOf(sceneFor('yuna')), cave: musicPlaceOf(sceneFor('dungeon')) };
      out.tunes = Object.keys(HW_TUNES).map(k => { const b = musicBuild(HW_TUNES[k], 0, 1); const mel = HW_TUNES[k].melody.split(/[\s|]+/).filter(Boolean).length; return mel === b.steps ? null : `${k}: ${mel} notes for ${b.steps} steps`; }).filter(Boolean);
      // The greeting on the login and start screens; a tap on it says it.
      out.screens = { hello: [...document.querySelectorAll('#login h1 .hw-hello, #start h1 .hw-hello')].length, deco: document.querySelectorAll('.hw-deco').length };
      const hello = document.querySelector('#start .hw-hello');
      if (hello) { said.length = 0; hello.click(); out.screens.said = said.slice(); }
      // Tapping a pumpkin and a ghost in town.
      document.getElementById('start-btn').click();
      out.hello = said.slice();
      const town = sceneFor('town');
      const pumpkin = town.objects.find(o => o.halloween && o.react && o.react.word === 'pumpkin');
      if (pumpkin) {
        state.cam.x = pumpkin.x + pumpkin.w / 2 - view.width / 2;
        state.cam.y = pumpkin.y + pumpkin.h / 2 - view.height / 2;
        const box = screen.getBoundingClientRect();
        const at = (wx, wy) => ({ clientX: box.left + ((wx - Math.round(state.cam.x)) * state.scale) * box.width / screen.width, clientY: box.top + ((wy - Math.round(state.cam.y)) * state.scale) * box.height / screen.height, bubbles: true });
        state.busy = false;
        said.length = 0;
        screen.dispatchEvent(new PointerEvent('pointerdown', at(pumpkin.x + pumpkin.w / 2, pumpkin.y + pumpkin.h - 6)));
        const g = town.hwGhosts[0];
        const gp = hwGhostAt(g, performance.now());
        state.cam.x = gp.x - view.width / 2;
        state.cam.y = gp.y - view.height / 2;
        screen.dispatchEvent(new PointerEvent('pointerdown', at(gp.x, gp.y)));
        await new Promise(res => setTimeout(res, 400));
        out.taps = { said: said.filter(t => /^(pumpkin|ghost)!$/.test(t)), walking: state.hero.path.length > 0 };
      }
      Sound.say = say;
      return out;
    }, SCENES.toString());
    await ctx.close();
    return { r, errors };
  };
  const on = await look(1);
  const off = await look(0);
  const tag = `Halloween (${edition})`;
  const names = Object.keys(on.r.scenes);
  const outdoors = names.filter(n => on.r.scenes[n].outdoor);
  const bare = names.filter(n => on.r.scenes[n].outdoor ? !on.r.scenes[n].props || !on.r.scenes[n].ghosts || !on.r.scenes[n].bats : !on.r.scenes[n].props && !on.r.scenes[n].garland);
  check(`${tag}: every village has pumpkins, ghosts and bats, every room a lantern or a garland (${outdoors.length} villages, ${names.length - outdoors.length} rooms)`, on.r.on && outdoors.length >= 5 && !bare.length, bare);
  check(`${tag}: nothing cuts off a tile she could walk to`, !on.r.cut.length, on.r.cut);
  check(`${tag}: a tapped pumpkin says "pumpkin!" and a tapped ghost "ghost!", and she stays put`, !!on.r.taps && on.r.taps.said.join() === 'pumpkin!,ghost!' && !on.r.taps.walking, on.r.taps);
  check(`${tag}: the login and start screens say "Happy Halloween!" (tap it to hear it), with bats and pumpkins behind; none of it with ?halloween=0`,
    on.r.screens.hello === 2 && on.r.screens.deco === 2 && (on.r.screens.said || []).join() === 'Happy Halloween!' && !off.r.screens.hello && !off.r.screens.deco, { on: on.r.screens, off: off.r.screens });
  check(`${tag}: the game starts with "Happy Halloween" or "Trick or treat"`, /Halloween|Trick or treat/.test(on.r.hello.join(' ')) && on.r.start !== off.r.start, { on: on.r.hello, off: off.r.start });
  if (edition === 'princess') check(`${tag}: villagers wear a hat for the night, the king keeps his crown`, on.r.hat.fisher !== off.r.hat.fisher && on.r.hat.king === off.r.hat.king);
  check(`${tag}: the town has many kinds of things (${on.r.town.kinds}), a big one by most houses, and every house painted on its roof and walls`,
    on.r.town.kinds.split(',').length >= 7 && on.r.town.big >= on.r.town.houses * 0.6 && on.r.town.painted === on.r.town.houses, on.r.town);
  check(`${tag}: the little games have Halloween names and pictures (${on.r.games})`, /유령 물고기|호박 크레인/.test(on.r.games) && /호박 점프|할로윈 공룡알/.test(on.r.games) && /박쥐 글자|할로윈 드론/.test(on.r.games)
    && on.r.drawn.every(d => !d.includes(':')) && off.r.drawn.every(d => !d.includes(':')) && !/할로윈|유령|호박|박쥐|사탕/.test(off.r.games), { on: on.r.games, off: off.r.games, drawn: on.r.drawn });
  check(`${tag}: spooky music: the town, the villages, the caves and the rooms each have theirs, and each tune is whole`,
    on.r.music.town === 'spooky' && on.r.music.forest === 'spookyWalk' && on.r.music.cave === 'spookyCave' && on.r.music.room === 'spookyHome' && !on.r.tunes.length
    && off.r.music.town === 'town' && off.r.music.room === 'home', { on: on.r.music, off: off.r.music, tunes: on.r.tunes });
  const left = names.filter(n => off.r.scenes[n].props || off.r.scenes[n].garland || off.r.scenes[n].ghosts || off.r.scenes[n].bats);
  check(`${tag}: with ?halloween=0 there is none of it, and the hello is the usual one`, !off.r.on && !left.length && !/Halloween/.test(off.r.hello.join(' ')), left);
  const changed = names.filter(n => on.r.scenes[n].sig !== off.r.scenes[n].sig);
  check(`${tag}: without its decorations every place is exactly as it is the rest of the year`, !changed.length, changed);
  check(`${tag}: no page errors`, !on.errors.length && !off.errors.length, [...on.errors, ...off.errors]);
}

// A gate added in an update (the Monster Village): a child already past its
// stars gets its party once, after her next answer; one who reaches it
// later gets it as she crosses, and not again.
async function lateGate(browser) {
  const { page, ctx, errors } = await game(browser);
  const r = await page.evaluate(() => {
    const seen = [];
    fanfareLater = fn => fn();
    gateFanfare = g => seen.push(g.key);
    state.guide = { step: 3 };
    state.stars = 52;
    gateCheck(51);
    const first = seen.slice();
    gateCheck(52);
    const again = seen.length;
    state.guide = { step: 3 };
    state.stars = 40;
    seen.length = 0;
    gateCheck(39);
    gateCheck(40);
    return { first, again, crossing: seen.slice() };
  });
  check('a gate new in an update: its party once for a child already past it', r.first.join() === 'monster' && r.again === 1, r);
  check('... and once as she crosses it, not again after', r.crossing.join() === 'monster', r);
  check('late gate: no page errors', !errors.length, errors);
  await ctx.close();
}

(async () => {
  const site = await serve();
  const browser = await launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  // ONLY=audio node tools/check-flows.js runs the parts whose name has "audio".
  const parts = { parentPauses, parentPassword, brokenSave, audioUnlock, quests: b => quests(b, 'princess'), questsCaptain: b => quests(b, 'captain'),
    questEdges: b => questEdges(b, 'princess'), questEdgesCaptain: b => questEdges(b, 'captain'), caveFight, caveMagic,
    cards: b => cards(b, 'princess'), cardsCaptain: b => cards(b, 'captain'), selfRead,
    games: b => littleGames(b, 'princess'), gamesCaptain: b => littleGames(b, 'captain'),
    presentsGirl: b => presents(b, 'princess', 'girl'), presentsBoy: b => presents(b, 'princess', 'boy'), presentsRobot: b => presents(b, 'captain', 'robot'),
    outside: b => outsideTaps(b, 'princess'), outsideCaptain: b => outsideTaps(b, 'captain'),
    music: b => musicFlows(b, 'princess'), musicCaptain: b => musicFlows(b, 'captain'),
    shop: b => shopTabs(b, 'princess'), shopCaptain: b => shopTabs(b, 'captain'),
    ride: b => rideInOut(b, 'princess'), rideCaptain: b => rideInOut(b, 'captain'),
    gameSpots: b => gameSpots(b, 'princess'), gameSpotsCaptain: b => gameSpots(b, 'captain'),
    kidMonsters: b => kidMonsters(b, 'princess'), kidMonstersCaptain: b => kidMonsters(b, 'captain'), lateGate,
    monsterTower: b => monsterTower(b, 'princess'), monsterTowerCaptain: b => monsterTower(b, 'captain'),
    halloween: b => halloween(b, 'princess'), halloweenCaptain: b => halloween(b, 'captain'),
    salon: b => hairSalon(b, 'princess', 'girl'), salonBoy: b => hairSalon(b, 'princess', 'boy'), salonCaptain: b => hairSalon(b, 'captain'),
    blendSteps: b => blendSteps(b, 'princess'), blendStepsCaptain: b => blendSteps(b, 'captain') };
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
