// Visual checks before deploying, for both editions:
// - no villager stands hidden behind a building or another villager (more
//   than a fifth of the sprite covered by things drawn in front of it),
// - every word in the content fits an answer card, on each iPad size and on
//   a phone held sideways,
// - the person she talks to stays visible above the dialog,
// - what a child taps is big enough: HUD, hear-again and close, the album's
//   tabs and done, the feeding card, the 🎣 button and the pond game's
//   buttons 64 px, spelling tiles 68 px tall (on a phone a bit less),
// - every little game (the pond's and each village's, js/minigame.js): the
//   card on screen with its top row on one line, the picture-and-word box
//   at the top fitting its text, its button in the host's dialog, ✖ and 🔊
//   and the end card's 🔁 / 👋 64 px (52 on a phone), every thing to tap
//   in every round at least that big and inside the picture, and its
//   pictures big enough to see; the Unicorn game's end card with her 25
//   letters in two rows at most, fitting the card,
// - the sound magic (js/blend-magic.js): the card on screen under the HUD,
//   its 🐢 / 🐇 / ✨ buttons and ✖ big enough, the sound bubbles inside the
//   card slow and fast, and the picture and word that pop out inside it,
//   big enough and clear of the buttons,
// - the wardrobe and the shop on every tab, for a girl, a boy and the
//   robot: on screen, the picture tabs on one row, tabs and pictures 64 px
//   (52 on a phone), every picture inside its tile, a row of them showing,
//   the mirror showing her, and the buttons on screen,
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
//   phone), and the card at the end fits;
// - the same books on a phone held upright (390 x 844, 375 x 667, 360 x
//   640): every word tile and the end card's buttons on the page and the
//   thing a tap at their middle reaches, the tiles 52 px tall; on a very
//   small one (320 x 568) the page may scroll, as long as scrolling brings
//   each of them into reach.
// Run: node tools/check-visual.js  (needs the playwright package and Chromium)

const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const SIZES = [[1024, 768], [1180, 820], [768, 1024], [1024, 700], [844, 390]];
// Phones held upright, for the books she reads herself: [w, h, fits without scrolling].
const UPRIGHT = [[390, 844, true], [375, 667, true], [360, 640, true], [320, 568, false]];
let failed = 0;
const fail = msg => { console.log(`  ${msg}`); failed++; };

// Share of each villager's sprite that objects drawn after it cover, using
// the same order as drawScene in js/game.js.
function hiddenVillagers() {
  const names = ['town', 'castle', 'castle2', 'yuna', 'forest', 'unicorn', 'dungeon', 'fairy', ...TOWN_HOUSES.map(h => `house-${h.letter}`)];
  // Scenes reached through links from these (new villages and homes), and
  // the Monster Tower's floors behind its door.
  for (let i = 0; i < names.length; i++) {
    for (const l of sceneFor(names[i]).links || []) if (typeof l.target === 'string' && !names.includes(l.target)) names.push(l.target);
    for (const d of sceneFor(names[i]).doors || []) if (/^tower/.test(d.target) && !names.includes(d.target)) names.push(d.target);
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
    // Each villager's picture where it is drawn (her monsters are never
    // mirrored), so one standing in front of another counts too.
    for (const ch of list) {
      if (!ch.isChar) continue;
      const n = ch.npc;
      const sprite = n.unicorn ? unicornSprite(n.unicorn, 0) : villagerSprite(n.look, 0);
      const p = tileCenter(sc, n.c, n.r);
      const w = sprite.canvas.width;
      const h = sprite.canvas.height;
      const flip = n.flip && !KID_MONSTERS[n.look];
      ch.pic = { w, h, flip, dx: Math.round(p.x - (flip ? w - sprite.ax : sprite.ax)), dy: Math.round(p.y + 1 - sprite.ay), px: sprite.canvas.getContext('2d').getImageData(0, 0, w, h).data };
    }
    const solid = (pic, X, Y) => {
      const x = X - pic.dx;
      const y = Y - pic.dy;
      return x >= 0 && y >= 0 && x < pic.w && y < pic.h && pic.px[(y * pic.w + (pic.flip ? pic.w - 1 - x : x)) * 4 + 3] >= 40;
    };
    list.forEach((ch, i) => {
      if (!ch.isChar) return;
      const n = ch.npc;
      const { w, h, dx, dy } = ch.pic;
      let all = 0;
      let covered = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!solid(ch.pic, dx + x, dy + y)) continue;
        all++;
        for (let j = i + 1; j < list.length; j++) {
          const o = list[j];
          if (o.isChar ? solid(o.pic, dx + x, dy + y) : !o.background && o.canvas && hitObject(o, dx + x, dy + y)) { covered++; break; }
        }
      }
      out.push({ scene: name, name: n.name, c: n.c, r: n.r, cover: all ? Math.round(100 * covered / all) : 0 });
    });
  }
  return out;
}

// Every page of the books she reads herself, and the end card, on a phone
// held upright: what she taps is on the page (scrolled to first when the
// page may scroll), big enough, and what a tap at its middle reaches.
function readerUpright(fit) {
  const out = [];
  document.getElementById('start').classList.add('hidden');
  state.skill.read = Object.assign(Quiz.skill('read'), { t: 4 });
  state.busy = false;
  openLibrary();
  const reach = el => {
    if (!fit) el.scrollIntoView({ block: 'nearest' });
    const r = el.getBoundingClientRect();
    const p = document.getElementById('rd-paper').getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return r.left >= p.left - 0.5 && r.right <= p.right + 0.5 && r.top >= p.top - 0.5 && r.bottom <= p.bottom + 0.5 && !!hit && el.contains(hit);
  };
  const where = book => `reading upright ${book.id}`;
  for (const book of DECODABLE_BOOKS) {
    openSelfBook(book);
    book.pages.forEach((p, i) => {
      library.page = i;
      renderSelfPage();
      const tiles = [...document.querySelectorAll('#rd-text .rd-word')];
      const off = tiles.filter(t => !reach(t));
      if (off.length) out.push(`${where(book)} page ${i + 1}: ${off.map(t => t.textContent).join(' ')} can't be tapped`);
      const low = tiles.filter(t => t.getBoundingClientRect().height < 51.5);
      if (low.length) out.push(`${where(book)} page ${i + 1}: ${low.length} tile(s) under 52px`);
    });
    for (const id of ['rd-prev', 'rd-next']) {
      const r = document.getElementById(id).getBoundingClientRect();
      if (Math.min(r.width, r.height) < 51.5 || r.bottom > innerHeight) out.push(`${where(book)}: ${id} is small or off the screen`);
    }
    library.page = book.pages.length - 1;
    selfFinish();
    selfEndButtons(book);
    const off = [...document.querySelectorAll('#rd-options button')].filter(b => !reach(b));
    if (off.length) out.push(`${where(book)}: the end card's ${off.map(b => b.textContent).join(', ')} can't be tapped`);
  }
  closeLibrary();
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
  const key = npc.level === 6 ? 'monster' : npc.level === 5 ? 'fairy' : npc.level === 3 ? 'unicorn' : npc.level === 2 ? 'forest' : npc.letter ? 'house' : 'town';
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
        for (const [kind, scene] of [['word', 'town'], ['start', 'town'], ['family', 'forest'], ['sentence', 'unicorn'], ['spell', 'fairy'], ['longRead', 'monster'], ['longBlend', 'tower'], ['longWord', 'tower2']]) {
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
        // The wardrobe (and the shop) on every tab, for a girl and a boy:
        // on screen, the tabs on one row, tabs and pictures big enough to
        // tap, every picture inside its tile, nothing wider than its box, a
        // whole row of pictures showing, and the mirror showing her.
        const inBox = (el, box) => { const r = el.getBoundingClientRect(); return r.left >= box.left - 0.5 && r.right <= box.right + 0.5 && r.top >= box.top - 0.5 && r.bottom <= box.bottom + 0.5; };
        const onScreen = el => inBox(el, { left: 0, top: 0, right: innerWidth, bottom: innerHeight });
        const fits = (what, panel, tabsSel, gridSel, mirror, buttons) => {
          const p = document.getElementById(panel);
          p.style.animation = 'none'; // it rises into place as it opens
          if (!onScreen(p)) out.push(`${what}: off the screen`);
          const tabs = [...document.querySelectorAll(tabsSel)];
          if (new Set(tabs.map(t => Math.round(t.getBoundingClientRect().top))).size > 1) out.push(`${what}: the tabs take more than one row`);
          small(tabsSel, big);
          small(`${gridSel} .wd-item`, big);
          const grid = document.querySelector(gridSel);
          if (grid.scrollWidth > grid.clientWidth + 1) out.push(`${what}: the pictures are wider than their box (${grid.scrollWidth} > ${grid.clientWidth})`);
          const tiles = [...grid.querySelectorAll('.wd-item')];
          const out_ = tiles.filter(t => [...t.querySelectorAll('canvas, .ic')].some(pic => !inBox(pic, t.getBoundingClientRect())));
          if (out_.length) out.push(`${what}: ${out_.length} picture(s) run out of their tile, e.g. ${out_[0].title}`);
          const first = tiles[0] && tiles[0].getBoundingClientRect();
          const box = grid.getBoundingClientRect();
          if (first && box.bottom - first.top < first.height - 1) out.push(`${what}: less than a row of pictures shows`);
          const m = document.getElementById(mirror).getBoundingClientRect();
          if (m.width < 40 || m.height < 40 || !inBox(document.getElementById(mirror), p.getBoundingClientRect())) out.push(`${what}: the mirror is ${Math.round(m.width)}x${Math.round(m.height)} or outside the box`);
          for (const b of buttons) if (!onScreen(document.querySelector(b))) out.push(`${what}: ${b} is off the screen`);
        };
        for (const look of isCaptain() ? ['robot'] : ['girl', 'boy']) {
          if (look !== 'robot') { setPlayer({ title: look === 'boy' ? 'prince' : 'princess', look }); wearLook(); }
          // Half of everything hers, so there are pictures and ❓ shapes.
          let n = 0;
          for (const w of WARDROBE) for (const v of Object.keys(w.items)) if (n++ % 2 && !state.owned[w.slot].includes(v)) state.owned[w.slot].push(v);
          state.scene = sceneFor('yuna');
          state.busy = false;
          openWardrobe();
          for (const w of wardrobeTabs()) {
            wdTab = w.slot;
            renderWardrobe();
            fits(`wardrobe ${look} ${w.slot}`, 'wardrobe', '#wd-tabs .wd-tab', '#wd-slots .wd-grid', 'wd-preview', ['#wd-done']);
          }
          closeWardrobe();
          state.coins = 5;
          openShop(sceneFor('forest').npcs.find(x => x.shop));
          for (const slot of new Set(shopItems().map(it => it.slot))) {
            state.shopTab = slot;
            state.shopPick = shopItems().find(it => it.slot === slot);
            renderShop();
            fits(`shop ${look} ${slot}`, 'shop', '#shop-tabs .wd-tab', '#shop-items', 'shop-preview', ['#shop-buy', '#shop-done']);
          }
          closeShop();
        }
        if (!isCaptain()) { setPlayer({ title: 'princess', look: 'girl' }); wearLook(); }
        state.scene = sceneFor('yuna');
        // Her friend's feeding card, and the fisherman's 🎣 and his game.
        const friend = Object.keys(FAIRIES).find(k => k !== 'none');
        state.owned.fairy.push(friend);
        state.outfit = Object.assign({}, state.outfit, { fairy: friend });
        openFeed();
        small('#fd-jar', big, true);
        small('#fd-done', big, true);
        closeFeed();
        // Every little game, from its host's dialog.
        for (const [key, g] of Object.entries(MINI_GAMES)) {
          state.scene = sceneFor(g.scene);
          state.busy = false;
          const host = g.host();
          openDialog(host);
          small('#dlg-mini', big, true);
          closeDialog();
          state.busy = false;
          openMini(host);
          miniDraw(performance.now());
          const card = mini.el.getBoundingClientRect();
          if (card.top < 0 || card.left < 0 || card.bottom > innerHeight + 0.5 || card.right > innerWidth + 0.5) out.push(`${key} game: the card runs off the screen`);
          const head = mini.el.querySelector('.mini-head');
          if (head.scrollWidth > head.clientWidth + 1) out.push(`${key} game: the top row runs over (${head.scrollWidth} > ${head.clientWidth})`);
          if (mini.pips.scrollWidth > mini.pips.clientWidth + 1) out.push(`${key} game: the round pips run over`);
          if (mini.letter.scrollWidth > mini.letter.clientWidth + 1) out.push(`${key} game: "${mini.letter.textContent}" runs out of its box`);
          small('#mini-close', big);
          small('#mini-replay', big);
          small('#mini-letter', big, true);
          // The things to tap in every round, on the screen.
          const cv = mini.canvas.getBoundingClientRect();
          const v = mini.view;
          const dpr = mini.canvas.width / cv.width;
          const css = x => (x * v.k) / dpr;
          const tiny = [];
          for (const r of mini.rounds) {
            for (const it of g.items(r)) {
              if (it.state !== 'live') continue;
              const b = g.box(it);
              const w = css(b.x1 - b.x0);
              const h = css(b.y1 - b.y0);
              if (Math.min(w, h) < big - 0.5) tiny.push(`${Math.round(w)}x${Math.round(h)}`);
              const x0 = cv.left + css(b.x0 + v.bx);
              const y0 = cv.top + css(b.y0 + v.by);
              if (key !== 'fish' && (x0 < cv.left || y0 < cv.top || x0 + w > cv.right || y0 + h > cv.bottom)) out.push(`${key} game: a thing to tap is outside the picture`);
            }
          }
          if (tiny.length) out.push(`${key} game: ${tiny.length} thing(s) to tap under ${big}px, e.g. ${tiny[0]}`);
          // Its pictures (and letters) big enough to see.
          const least = Math.min(...g.draw.labels(performance.now() / 1000, performance.now() + 2000).map(l => css(l.size)));
          if (key !== 'fish' && least < (phone ? 24 : 40)) out.push(`${key} game: pictures only ${Math.round(least)}px`);
          document.getElementById('mini-end').classList.remove('hidden');
          // The Unicorn Village's end card with every letter of blending's
          // one-sound step and the two-sound badge (the most it shows).
          if (key === 'unicorn') {
            const box = document.getElementById('mini-letters');
            box.innerHTML = ONE_SOUND.map(s => `<span class="ml on">${s.l}</span>`).join('');
            box.classList.remove('hidden');
            const two = document.getElementById('mini-two');
            two.innerHTML = '<span class="b">b</span><span class="b name">E</span>➜🐝';
            two.classList.remove('hidden');
            if (new Set([...box.children].map(x => Math.round(x.getBoundingClientRect().top))).size > 2) out.push('unicorn game: the letters on the end card take more than two rows');
          }
          small('.mini-end .answer button', big, true);
          const end = document.getElementById('mini-end').getBoundingClientRect();
          if (end.top < card.top || end.bottom > card.bottom) out.push(`${key} game: the end card runs out of the card`);
          for (const id of ['mini-letters', 'mini-two']) document.getElementById(id).classList.add('hidden');
          closeMini();
        }

        // The sound magic (js/blend-magic.js): on screen under the HUD, its
        // steps and ✖ big enough to tap, every bubble (four sounds: frog)
        // and then the picture and its word inside the card.
        state.busy = false;
        const mg = document.getElementById('magic');
        const hud = document.querySelector('.hud').getBoundingClientRect().bottom;
        for (const m of [Quiz.magic('frog'), Quiz.magic('bee'), { w: 'sun', e: '☀️', parts: ['s'] }]) {
          openBlendMagic(m);
          mg.style.animation = 'none';
          mg.querySelectorAll('.mg-bubble').forEach(b => b.classList.add('in'));
          const box = mg.getBoundingClientRect();
          if (!onScreen(mg) || box.top < hud - 0.5) out.push(`magic (${m.w}): the card is off the screen or under the HUD`);
          small('.mg-step:not(.hidden)', big);
          small('.mg-close', big);
          for (const cls of ['', 'slow', 'fast']) {
            if (cls) mg.classList.add(cls);
            mg.querySelectorAll('.mg-bubble').forEach(b => { b.style.transition = 'none'; });
            const outside = [...mg.querySelectorAll('.mg-bubble')].filter(b => !inBox(b, box));
            if (outside.length) out.push(`magic (${m.w}${cls ? `, ${cls}` : ''}): ${outside.length} bubble(s) outside the card`);
            const steps = mg.querySelector('.mg-steps').getBoundingClientRect();
            const low = Math.max(...[...mg.querySelectorAll('.mg-bubble, .mg-runner')].map(b => b.getBoundingClientRect().bottom));
            if (low > steps.top + 1) out.push(`magic (${m.w}${cls ? `, ${cls}` : ''}): the bubbles reach the buttons`);
          }
          mg.classList.add('smash', 'popped');
          mg.querySelectorAll('.mg-pic, .mg-word').forEach(x => { x.style.animation = 'none'; });
          for (const sel of ['.mg-pic', '.mg-word']) if (!inBox(mg.querySelector(sel), box)) out.push(`magic (${m.w}): ${sel} outside the card`);
          const pic = mg.querySelector('.mg-pic').getBoundingClientRect();
          if (pic.height < (phone ? 50 : 80)) out.push(`magic (${m.w}): the picture is only ${Math.round(pic.height)}px`);
          if (mg.querySelector('.mg-pop').getBoundingClientRect().bottom > mg.querySelector('.mg-steps').getBoundingClientRect().top + 1) out.push(`magic (${m.w}): the picture reaches the buttons`);
          closeBlendMagic();
          mg.querySelectorAll('.mg-pic, .mg-word').forEach(x => { x.style.animation = ''; });
          mg.style.animation = '';
        }

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
    for (const [w, h, fit] of UPRIGHT) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('file://' + path.join(root, 'index.html') + `?edition=${edition}&fx=0`);
      await page.evaluate(() => document.fonts.ready);
      console.log(`${edition} ${w}x${h} (upright: her books)`);
      await page.click('#login-guest');
      (await page.evaluate(readerUpright, fit)).forEach(fail);
      errors.forEach(e => fail(`page error: ${e}`));
      await page.close();
    }
  }
  await browser.close();
  console.log(failed ? `${failed} problem(s)` : 'all visual checks OK');
  process.exit(failed ? 1 : 0);
})();
