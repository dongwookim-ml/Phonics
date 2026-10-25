// Visual checks before deploying, for both editions:
// - no villager stands hidden behind a building (more than a fifth of the
//   sprite covered by things drawn in front of it),
// - every word in the content fits an answer card, on each iPad size and on
//   a phone held sideways,
// - the person she talks to stays visible above the dialog,
// - what a child taps is big enough: HUD, hear-again and close 64 px,
//   spelling tiles 68 px tall, wardrobe chips 56 px (on a phone a bit less),
// - ▶ on the start screen and the guest button on the login screen show
//   without scrolling, also with Safari's toolbars (1024 x 700).
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
