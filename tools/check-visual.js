// Visual checks before deploying, for both editions:
// - no villager stands hidden behind a building (more than a fifth of the
//   sprite covered by things drawn in front of it),
// - every word in the content fits an answer card, on each iPad size and on
//   a phone held sideways,
// - the person she talks to stays visible above the dialog,
// - what a child taps is big enough: HUD, hear-again and close, the album's
//   tabs and done, the feeding card, the 🎣 button and the pond game's
//   buttons 64 px, spelling tiles 68 px tall, wardrobe chips 56 px (on a
//   phone a bit less),
// - ▶ on the start screen and the guest button on the login screen show
//   without scrolling, also with Safari's toolbars (1024 x 700),
// - with every counter and button showing (the next-gate and gift meters
//   too) the HUD stays on one row and on screen; the sticker album fits the
//   screen with big tabs and stickers and every word fits its sticker; a
//   celebration banner fits across the screen;
// - today's adventures (js/quest.js): the card fits without scrolling, its
//   pictures, arrow and chest on one row, big enough to tap, nothing runs
//   over, and the tick under the HUD chest stays on screen;
// - on every page of the books she reads herself the picture and the word
//   tiles fit the page, in two rows at most, the tiles 64 px tall (52 on a
//   phone), and the card at the end fits.
// Run: node tools/check-visual.js  (needs the playwright package and Chromium)

const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const SIZES = [[1024, 768], [1180, 820], [768, 1024], [1024, 700], [844, 390]];
let failed = 0;
const fail = msg => { console.log(`  ${msg}`); failed++; };

// Share of each villager's sprite that objects drawn after it cover, using
// the same order as drawScene in js/game.js.
function hiddenVillagers() {
  const names = ['town', 'castle', 'castle2', 'yuna', 'forest', 'unicorn', 'dungeon', 'fairy', ...TOWN_HOUSES.map(h => `house-${h.letter}`)];
  // Scenes reached through links from these (new villages and homes).
  for (let i = 0; i < names.length; i++) {
    for (const l of sceneFor(names[i]).links || []) if (typeof l.target === 'string' && !names.includes(l.target)) names.push(l.target);
  }
  const out = [];
  for (const name of names) {
    let sc;
    try { sc = sceneFor(name); } catch (e) { continue; }
    const list = sc.objects.slice();
    const chars = sc.npcs.filter(n => !n.mount).map(n => ({ isChar: true, npc: n, c: n.c, r: n.r }));
    chars.sort((a, b) => (a.c + a.r) - (b.c + b.r));
    for (const ch of chars) {
      const p = tileCenter(sc, ch.c, ch.r);
      const bx = p.x - heroBox.w / 2;
      const by = p.y - heroBox.h;
      let idx = 0;
      for (let i = 0; i < list.length; i++) {
        const o = list[i];
        if (o.isChar) { if (o.c + o.r <= ch.c + ch.r) idx = i + 1; continue; }
        if (o.background) { idx = Math.max(idx, i + 1); continue; }
        if (!overlaps(o, bx, by, heroBox.w, heroBox.h + 4)) continue;
        if (ch.c > o.c1 + 0.5 || ch.r > o.r1 + 0.5) idx = i + 1;
      }
      list.splice(idx, 0, ch);
    }
    list.forEach((ch, i) => {
      if (!ch.isChar) return;
      const n = ch.npc;
      const sprite = n.unicorn ? unicornSprite(n.unicorn, 0) : villagerSprite(n.look, 0);
      const p = tileCenter(sc, n.c, n.r);
      const w = sprite.canvas.width;
      const h = sprite.canvas.height;
      const dx = Math.round(p.x - (n.flip ? w - sprite.ax : sprite.ax));
      const dy = Math.round(p.y + 1 - sprite.ay);
      const px = sprite.canvas.getContext('2d').getImageData(0, 0, w, h).data;
      let all = 0;
      let covered = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (px[(y * w + (n.flip ? w - 1 - x : x)) * 4 + 3] < 40) continue;
        all++;
        for (let j = i + 1; j < list.length; j++) {
          const o = list[j];
          if (!o.isChar && !o.background && o.canvas && hitObject(o, dx + x, dy + y)) { covered++; break; }
        }
      }
      out.push({ scene: name, name: n.name, c: n.c, r: n.r, cover: all ? Math.round(100 * covered / all) : 0 });
    });
  }
  return out;
}

// Opens a question of one kind from someone in the scene, standing next to
// them, as talking to them would.
function ask(kind, scene) {
  state.timers.forEach(clearTimeout);
  state.timers = [];
  closeDialog();
  const sc = sceneFor(scene);
  state.scene = sc;
  const npc = sc.npcs.find(n => !n.mount && !n.shop && !n.caught && !n.monster);
  const key = npc.level === 5 ? 'fairy' : npc.level === 3 ? 'unicorn' : npc.level === 2 ? 'forest' : npc.letter ? 'house' : 'town';
  const kinds = QUIZ_TYPES[key];
  QUIZ_TYPES[key] = [kind];
  Object.assign(npc, { lastQuiz: null, waitUntil: 0, missed: null });
  for (const [dc, dr] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) if (walkable(sc, npc.c + dc, npc.r + dr)) { placeHero(npc.c + dc, npc.r + dr); break; }
  state.busy = false;
  openDialog(npc);
  QUIZ_TYPES[key] = kinds;
  snapCamera();
  return npc;
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const edition of ['princess', 'captain']) {
    for (const [w, h] of SIZES) {
      const phone = h <= 520;
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('file://' + path.join(root, 'index.html') + `?edition=${edition}&fx=0`);
      await page.evaluate(() => document.fonts.ready);
      console.log(`${edition} ${w}x${h}`);

      const login = await page.evaluate(() => ({ guest: document.getElementById('login-guest').getBoundingClientRect().bottom, vh: innerHeight }));
      if (login.guest > login.vh) fail(`login: the guest button ends at ${Math.round(login.guest)}, below the screen (${login.vh})`);
      await page.click('#login-guest');
      const start = await page.evaluate(() => ({ play: document.getElementById('start-btn').getBoundingClientRect().bottom, vh: innerHeight }));
      if (start.play > start.vh) fail(`start: ▶ ends at ${Math.round(start.play)}, below the screen (${start.vh})`);

      if (w === 1024 && h === 768) {
        for (const v of await page.evaluate(hiddenVillagers)) {
          if (v.cover >= 20) fail(`${v.scene}: ${v.name} (${v.c},${v.r}) is ${v.cover}% hidden behind something`);
        }
      }

      await page.evaluate(src => { window.ask = (0, eval)(`(${src})`); }, ask.toString());
      const r = await page.evaluate(phone => {
        const out = [];
        document.getElementById('start').classList.add('hidden');
        state.stars = 99;
        const room = card => {
          const cs = getComputedStyle(card);
          return card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        };
        // Every word on a card of three, the word families on a card of four.
        const words = new Set();
        for (const [x] of LETTERS.flatMap(l => l.words).concat(...WORD_FAMILIES, ...RHYME_SETS.map(r => r.set))) words.add(x);
        for (const s of SENTENCES) { words.add(s.w[0]); (s.alike || []).forEach(x => words.add(x)); (s.other || []).forEach(([x]) => words.add(x)); }
        for (const [kind, scene, list] of [['word', 'town', words], ['family', 'forest', new Set(WORD_FAMILIES.flat().map(([x]) => x))]]) {
          ask(kind, scene);
          const card = ui.choices.querySelector('.choice');
          const w = card.querySelector('.w');
          const wide = [];
          for (const word of list) {
            w.className = `w${word.length > 6 ? ' long' : ''}`;
            w.innerHTML = `<span class="first">${word[0]}</span>${word.slice(1)}`;
            if (w.offsetWidth > room(card) + 1) wide.push(`${word} ${w.offsetWidth}px`);
          }
          if (wide.length) out.push(`${kind}: ${wide.length} word(s) wider than a ${Math.round(room(card))}px card: ${wide.slice(0, 8).join(', ')}`);
        }
        // The person talking and the hero stay above the dialog.
        for (const [kind, scene] of [['word', 'town'], ['start', 'town'], ['family', 'forest'], ['sentence', 'unicorn'], ['spell', 'fairy']]) {
          const npc = ask(kind, scene);
          const top = ui.dialog.getBoundingClientRect().top;
          const k = devicePixelRatio || 1;
          for (const [who, c, r] of [[npc.name, npc.c, npc.r], ['the hero', state.hero.c, state.hero.r]]) {
            const p = tileCenter(state.scene, c, r);
            const s = toScreen(p.x, p.y);
            const feet = s.y / k;
            const head = (s.y - 40 * state.scale) / k;
            if (head < 0 || feet > top + 2) out.push(`${kind} in ${scene}: ${who} is not fully visible above the dialog (head ${Math.round(head)}, feet ${Math.round(feet)}, dialog top ${Math.round(top)})`);
          }
        }
        // Sizes of what she taps.
        const big = phone ? 52 : 64;
        ask('word', 'town');
        const small = (sel, min, tall) => {
          const under = [...document.querySelectorAll(sel)].filter(b => b.offsetParent).map(b => b.getBoundingClientRect())
            .filter(r => (tall ? r.height : Math.min(r.width, r.height)) < min - 0.5);
          if (under.length) out.push(`${under.length} x ${sel} under ${min}px, e.g. ${Math.round(under[0].width)}x${Math.round(under[0].height)}`);
        };
        small('.hud .btn', big);
        small('#dlg-replay', big);
        small('#dlg-close', big);
        ask('spell', 'fairy');
        small('.choices.spell .tile', phone ? 56 : 68, true);
        small('.choices.spell .erase', phone ? 56 : 68, true);
        closeDialog();
        state.scene = sceneFor('yuna');
        openWardrobe();
        small('#wd-slots .chip', 56, true);
        closeWardrobe();
        // Her friend's feeding card, and the fisherman's 🎣 and his game.
        const friend = Object.keys(FAIRIES).find(k => k !== 'none');
        state.owned.fairy.push(friend);
        state.outfit = Object.assign({}, state.outfit, { fairy: friend });
        openFeed();
        small('#fd-jar', big, true);
        small('#fd-done', big, true);
        closeFeed();
        state.scene = sceneFor('town');
        state.busy = false;
        openDialog(miniFisher());
        small('#dlg-mini', big, true);
        closeDialog();
        openMini(miniFisher());
        small('#mini-close', big);
        small('#mini-replay', big);
        document.getElementById('mini-end').classList.remove('hidden');
        small('.mini-end .answer button', big, true);
        closeMini();

        // The HUD with everything showing (js/album.js): the stars toward the
        // last gate, the gift meter, coins and dust, and every button with
        // the ride: on one row, on screen, clear of the buttons.
        Object.assign(state, { stars: DUNGEON_STARS - 3, coins: 15, dust: 15, gifts: 2 });
        state.owned.ride.push(Object.keys(WARDROBE.find(x => x.slot === 'ride').items).find(v => v !== 'none'));
        renderRide();
        renderStars(false);
        const pills = [...document.querySelectorAll('.hud .counters > *')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect());
        const btns = [...document.querySelectorAll('.hud .buttons > *')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect());
        if (pills.concat(btns).some(r => r.left < 0 || r.right > innerWidth + 0.5 || r.top < 0)) out.push('HUD: something runs off the screen');
        const reach = Math.max(...pills.map(r => r.right));
        const from = Math.min(...btns.map(r => r.left));
        if (reach > from - 4) out.push(`HUD: the counters reach under the buttons (${Math.round(reach)} > ${Math.round(from)})`);
        if (new Set(pills.map(r => Math.round(r.top))).size > 1) out.push('HUD: the counters wrap onto a second row');
        if (!document.querySelector('#stars .gate-meter:not(.hidden)') || !document.querySelector('#gift-meter').offsetParent) out.push('HUD: the gate or gift meter is not showing');
        small('#album-btn', big);

        // The sticker album: on screen, big tabs and stickers, every word
        // fits its sticker, at least a row of stickers shows; the medals.
        state.busy = false;
        openAlbum();
        const al = document.getElementById('album').getBoundingClientRect();
        if (al.top < 0 || al.left < 0 || al.bottom > innerHeight + 0.5 || al.right > innerWidth + 0.5) out.push(`album: ${Math.round(al.left)},${Math.round(al.top)} to ${Math.round(al.right)},${Math.round(al.bottom)} is off the screen`);
        small('#album .al-tab', big);
        small('#album .sticker', phone ? 80 : 96);
        small('#album .al-done', big, true);
        const done = document.querySelector('#album .al-done').getBoundingClientRect();
        if (done.bottom > innerHeight) out.push('album: the done button is below the screen');
        const albumPage = document.querySelector('#album .al-page');
        const st = albumPage.querySelector('.sticker');
        if (albumPage.clientHeight < st.offsetHeight) out.push(`album: the page (${albumPage.clientHeight}px) shows less than a row of stickers`);
        st.classList.add('got');
        const sw = st.querySelector('.w');
        const tooWide = [];
        for (const x of albumWords()) {
          sw.className = `w${x.w.length > 7 ? ' long' : ''}`;
          sw.innerHTML = albumWordHtml(x.w);
          if (sw.offsetWidth > room(st) + 1) tooWide.push(`${x.w} ${sw.offsetWidth}px`);
        }
        if (tooWide.length) out.push(`album: ${tooWide.length} word(s) wider than a ${Math.round(room(st))}px sticker: ${tooWide.slice(0, 6).join(', ')}`);
        albumTab = 'medals';
        renderAlbum();
        small('#album .medal', phone ? 70 : 80);
        closeAlbum();
        albumTab = null;

        // The books she reads herself: on every page the picture and the
        // word tiles fit the page, in two rows at most, each tile big enough
        // to tap; and the card at the end fits too.
        state.skill.read = Object.assign(Quiz.skill('read'), { t: 4 });
        state.busy = false;
        openLibrary();
        small('#lib-books .lib-book.self', big);
        const inside = (el, box) => { const r = el.getBoundingClientRect(); return r.left >= box.left - 0.5 && r.right <= box.right + 0.5 && r.top >= box.top - 0.5 && r.bottom <= box.bottom + 0.5; };
        for (const book of DECODABLE_BOOKS) {
          openSelfBook(book);
          book.pages.forEach((p, i) => {
            library.page = i;
            renderSelfPage();
            const paper = document.getElementById('rd-paper').getBoundingClientRect();
            const tiles = [...document.querySelectorAll('#rd-text .rd-word')];
            const rows = new Set(tiles.map(t => Math.round(t.getBoundingClientRect().top))).size;
            const where = `reading ${book.id} page ${i + 1}`;
            if (rows > 2) out.push(`${where}: the words take ${rows} rows`);
            const out_ = [document.getElementById('rd-pic')].concat(tiles).filter(el => !inside(el, paper));
            if (out_.length) out.push(`${where}: ${out_.map(el => el.textContent).join(' ')} runs off the page`);
          });
          small('#rd-text .rd-word', phone ? 52 : 64, true);
          for (const b of ['#rd-prev', '#rd-next']) small(`#reader ${b}`, big);
          if (book === DECODABLE_BOOKS[DECODABLE_BOOKS.length - 1]) {
            selfFinish();
            selfEndButtons(book);
            const paper = document.getElementById('rd-paper').getBoundingClientRect();
            const off = [...document.querySelectorAll('#rd-q > *, #rd-options button')].filter(el => !inside(el, paper));
            if (off.length) out.push(`reading: the end card runs off the page (${off.map(el => el.textContent).join(', ')})`);
            small('#rd-options button', phone ? 48 : 56, true);
          }
        }
        closeLibrary();
        // A celebration with the longest place name fits across the screen.
        const longest = albumGates().map(g => placeName(g.key)).sort((a, b) => b.length - a.length)[0];
        const show = fanfareBanner('🌲🔓', longest, '문이 열렸어요!', 2500);
        show.el.style.animation = 'none';
        const fb = show.el.getBoundingClientRect();
        if (fb.left < 0 || fb.right > innerWidth || fb.bottom > innerHeight) out.push('a celebration runs off the screen');
        show.stop();

        // Today's adventures, one of them done: the card on screen without
        // scrolling, one row, big pictures, chest and 👋, nothing running
        // over, the title clear of 👋.
        state.busy = false;
        state.quests = null;
        const today = questsToday();
        questAdd(today.picks[0], QUESTS[today.picks[0]].n);
        openQuests();
        const card = document.getElementById('quests');
        const cr = card.getBoundingClientRect();
        if (cr.top < 0 || cr.left < 0 || cr.bottom > innerHeight + 0.5 || cr.right > innerWidth + 0.5) out.push(`quests: ${Math.round(cr.left)},${Math.round(cr.top)} to ${Math.round(cr.right)},${Math.round(cr.bottom)} is off the screen`);
        if (card.scrollHeight > card.clientHeight + 1) out.push(`quests: the card scrolls (${card.scrollHeight} > ${card.clientHeight})`);
        const row = [...card.querySelectorAll('.qs-quest, .qs-chest')].map(e => e.getBoundingClientRect());
        if (Math.max(...row.map(x => x.top)) - Math.min(...row.map(x => x.top)) > 12) out.push('quests: the pictures and the chest are not on one row');
        small('#quests .qs-quest', phone ? 96 : 120);
        small('#quests .qs-chest', big);
        small('#quests .qs-done', big);
        for (const el of card.querySelectorAll('.qs-head, .qs-title, .qs-row')) {
          if (el.scrollWidth > el.clientWidth + 1) out.push(`quests: ${el.className} runs over (${el.scrollWidth} > ${el.clientWidth})`);
        }
        // The tick on a done one may stick out of its corner; nothing else.
        for (const t of card.querySelectorAll('.qs-quest')) {
          const tb = t.getBoundingClientRect();
          for (const el of t.querySelectorAll('.ic, .pips')) {
            const b = el.getBoundingClientRect();
            if (b.left < tb.left || b.right > tb.right || b.top < tb.top || b.bottom > tb.bottom) out.push(`quests: the ${el.className} runs out of its picture`);
          }
        }
        if (card.querySelector('.qs-title').getBoundingClientRect().right > card.querySelector('.qs-done').getBoundingClientRect().left) out.push('quests: the title runs under 👋');
        closeQuests();
        // The tick for a finished quest, under the chest in the HUD.
        const tick = questTick(today.picks[0]);
        tick.el.style.animation = 'none';
        tick.el.style.transform = 'translateX(-50%)';
        const tr = tick.el.getBoundingClientRect();
        if (tr.left < 0 || tr.right > innerWidth || tr.bottom > innerHeight) out.push('quests: the tick under the HUD chest runs off the screen');
        tick.stop();
        return out;
      }, phone);
      r.forEach(fail);
      errors.forEach(e => fail(`page error: ${e}`));
      await page.close();
    }
  }
  await browser.close();
  console.log(failed ? `${failed} problem(s)` : 'all visual checks OK');
  process.exit(failed ? 1 : 0);
})();
