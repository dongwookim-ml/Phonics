// Rewards that show what she learned, in both editions:
// - the word sticker album (📒): every right answer, first try or after a
//   hint, puts that question's word in it; one page per first letter;
// - the gift meter (🎁 ●●○): three answers right the first time open a
//   present, or a pack of stickers once every present is hers;
// - the next gate in the star counter (⭐ 7/10 🌲), and a short celebration
//   and a sparkle trail to the gate when it opens;
// - medals: a letter house's when every question about its letter has been
//   answered right once, a village's for every question of its kinds;
// - a cheer from the asker at 3 and 5 right the first time in a row.
// No celebration lasts much more than 2 s, a tap anywhere ends it, and none
// of them holds up the next question. They never give stars.
// Hooks in js/game.js: answeredRight, finishShown, renderStars, load/save,
// tapObject and drawOverlay. Saved: state.stickers, state.medals, state.gifts.

// ---- Words in the album ------------------------------------------------------

// Word banks that may be added to js/data.js; any that exist go in too.
function albumMoreTables() {
  /* global CVC_A1 CVC_A2 VCC CCVC CVCC LONG DIGRAPH RHYME_SETS SENTENCES_L1 SENTENCES_L2 */
  return [
    typeof CVC_A1 !== 'undefined' && CVC_A1, typeof CVC_A2 !== 'undefined' && CVC_A2, typeof VCC !== 'undefined' && VCC,
    typeof CCVC !== 'undefined' && CCVC, typeof CVCC !== 'undefined' && CVCC, typeof LONG !== 'undefined' && LONG,
    typeof DIGRAPH !== 'undefined' && DIGRAPH, typeof RHYME_SETS !== 'undefined' && RHYME_SETS,
    typeof SENTENCES_L1 !== 'undefined' && SENTENCES_L1, typeof SENTENCES_L2 !== 'undefined' && SENTENCES_L2,
  ];
}

// [word, picture] pairs anywhere in a table: a letter's words, a family or a
// rhyme set, a word bank's entries ([word, picture, ...]) and a sentence's
// answer (not the other words it shows).
function albumPairs(x, out) {
  if (Array.isArray(x)) {
    if (typeof x[0] === 'string' && typeof x[1] === 'string') out.push(x);
    else for (const y of x) albumPairs(y, out);
  } else if (x && typeof x === 'object') {
    if (typeof x.s === 'string' && x.w) albumPairs(x.w, out);
    else albumPairs(x.words || x.set || [], out);
  }
  return out;
}

// Every word a question can be about, with its picture, in table order:
// [{ w, e, L }]. Built the first time it is needed, after the editions have
// set up their tables.
let albumList = null;
let albumIndex = null;
function albumWords() {
  if (albumList) return albumList;
  albumIndex = new Map();
  /* global RHYMES */
  const tables = [LETTERS, WORD_FAMILIES, typeof RHYMES !== 'undefined' && RHYMES, SENTENCES].concat(albumMoreTables());
  for (const [w, e] of albumPairs(tables, [])) {
    if (!/^[a-z]+$/.test(w) || !e || /^[\x20-\x7e]*$/.test(e) || albumIndex.has(w)) continue;
    albumIndex.set(w, { w, e, L: w[0].toUpperCase() });
  }
  albumList = [...albumIndex.values()];
  return albumList;
}

// Stickers she has that are not in the word lists (any more) still show.
function albumAll() {
  const list = albumWords().slice();
  for (const [w, s] of Object.entries(state.stickers)) if (!albumIndex.has(w)) list.push({ w, e: s.e || '⭐', L: w[0].toUpperCase() });
  return list;
}

// A saved object (stickers, medals), or an empty one.
function albumSaved(x) {
  return x && typeof x === 'object' && !Array.isArray(x) ? Object.assign({}, x) : {};
}

// The word with its first letter in colour, as on the answer cards.
const albumWordHtml = w => `<span class="first">${w[0]}</span>${w.slice(1)}`;
const albumIcon = key => place(key).split(' ')[0];

// ---- The HUD and the album's page -------------------------------------------

const albumUi = (() => {
  const stars = document.getElementById('stars');
  // 📒 first among the buttons on the right.
  const button = document.createElement('button');
  button.id = 'album-btn';
  button.className = 'btn album-btn';
  button.title = '스티커 앨범';
  button.innerHTML = '📒<span class="badge hidden"></span>';
  document.querySelector('.hud .buttons').prepend(button);
  // The gift meter, after the stars.
  const gift = document.createElement('div');
  gift.id = 'gift-meter';
  gift.className = 'stars gift-meter';
  gift.title = '선물까지';
  gift.innerHTML = '<span class="ic">🎁</span><span class="pips"><i></i><i></i><i></i></span>';
  stars.after(gift);
  // The next gate, inside the star counter: ⭐ 7/10 🌲 over a bar.
  const gate = document.createElement('span');
  gate.className = 'gate-meter hidden';
  gate.innerHTML = '<span class="need"></span><span class="ic"></span><span class="bar"><i></i></span>';
  stars.append(gate);
  const box = document.createElement('section');
  box.id = 'album';
  box.className = 'wardrobe album hidden';
  box.innerHTML = `
    <div class="wd-head"><div class="wd-name al-name"></div><div class="wd-count al-count"></div></div>
    <div class="al-tabs"></div>
    <div class="al-page"></div>
    <button class="wd-done al-done">다 봤어요 ✨</button>`;
  document.body.append(box);
  return {
    button, badge: button.querySelector('.badge'), gift, pips: [...gift.querySelectorAll('.pips i')],
    gate, gateNeed: gate.querySelector('.need'), gateIcon: gate.querySelector('.ic'), gateBar: gate.querySelector('.bar i'),
    box, name: box.querySelector('.al-name'), count: box.querySelector('.al-count'), tabs: box.querySelector('.al-tabs'),
    page: box.querySelector('.al-page'), done: box.querySelector('.al-done'),
  };
})();

// Called by renderStars (js/game.js).
function renderAlbumHud() {
  renderGateMeter();
  renderGiftMeter();
  renderAlbumButton();
}

// The dot on 📒 counts new stickers that have landed in it.
function renderAlbumButton() {
  const n = Object.entries(state.stickers).filter(([w, s]) => s.new && !albumFlying.has(w)).length;
  albumUi.badge.classList.toggle('hidden', !n);
  albumUi.badge.textContent = n > 9 ? '9+' : n;
}

// The 📒 hops when a sticker lands in it.
function albumBump() {
  const b = albumUi.button;
  b.classList.remove('pop');
  void b.offsetWidth;
  b.classList.add('pop');
}

// ---- Stickers ------------------------------------------------------------------

// The word a question was about and its picture: the right card's word (the
// rhyme she found, the word in a sentence), else the question's target (for
// letter cards and spelling).
function stickerOf(q) {
  if (q.sticker) return q.sticker;
  const o = (q.options || []).find(x => x.right);
  const w = o && typeof o.wrong === 'string' && /^[a-z]{2,}$/.test(o.wrong) ? o.wrong : q.target;
  if (typeof w !== 'string' || !/^[a-z]+$/.test(w)) return null;
  albumWords();
  const known = albumIndex.get(w);
  const pic = /class="(?:big)?pic">([^<]+)</.exec((o && o.html) || '') || /class="clue-pic">([^<]+)</.exec(q.clue || '');
  return { w, e: known ? known.e : pic ? pic[1] : '⭐' };
}

// A right answer: its word goes into the album. A new sticker flies from
// the card to 📒 (about 1.5 s; a tap ends it); one she has already just
// counts once more (three times or more and it shines).
function collectSticker(q, from) {
  const s = stickerOf(q);
  if (!s) return;
  const had = state.stickers[s.w];
  const st = had || (state.stickers[s.w] = { e: s.e, n: 0, at: Date.now(), new: true });
  st.n++;
  if (had) { albumBump(); return; }
  questAdd('sticker'); // a new one for today's adventures (js/quest.js)
  stickerFly([s], from && from.getBoundingClientRect());
  save();
}

// Stickers flying into 📒 from `from` (a box on screen; the middle of the
// screen when there is none). A tap anywhere ends them (albumSkip).
const albumAnims = new Set();
const albumFlying = new Set(); // words on their way
function stickerFly(list, from) {
  const to = albumUi.button.getBoundingClientRect();
  if (!to.width) { renderAlbumButton(); return; }
  const start = from || { left: innerWidth / 2 - 60, top: innerHeight * 0.38, width: 120, height: 0 };
  list.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'sticker-fly';
    el.innerHTML = `<span class="card"><span class="em">${s.e}</span><span class="w">${albumWordHtml(s.w)}</span></span>`;
    const x0 = start.left + start.width / 2 + (i - (list.length - 1) / 2) * 110;
    const y0 = start.top + start.height / 2;
    el.style.left = `${Math.round(x0)}px`;
    el.style.top = `${Math.round(y0)}px`;
    document.body.append(el);
    const dx = Math.round(to.left + to.width / 2 - x0);
    const dy = Math.round(to.top + to.height / 2 - y0);
    albumFlying.add(s.w);
    const land = () => { el.remove(); albumFlying.delete(s.w); albumBump(); renderAlbumButton(); };
    if (!el.animate) { land(); return; }
    const a = el.animate([
      { transform: 'translate(0, 0) scale(0.4)', opacity: 0 },
      { transform: 'translate(0, -10px) scale(1.15)', opacity: 1, offset: 0.2 },
      { transform: 'translate(0, -24px) scale(1)', opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.25)`, opacity: 0.8 },
    ], { duration: 1300, delay: 200 + i * 150, easing: 'ease-in-out', fill: 'both' });
    albumAnims.add(a);
    a.onfinish = () => { albumAnims.delete(a); land(); };
    a.oncancel = a.onfinish;
  });
}

// A full gift meter with no present left that she doesn't have: three
// stickers she hasn't found yet. Once she has every sticker, fairy dust
// (batteries for the robot) instead.
function stickerPack() {
  const open = albumWords().filter(x => !state.stickers[x.w]);
  if (!open.length) {
    addDust();
    save();
    return;
  }
  const three = shuffle(open.slice()).slice(0, 3);
  for (const s of three) state.stickers[s.w] = { e: s.e, n: 1, at: Date.now(), new: true };
  Sound.tune('chime');
  stickerFly(three, null);
  showPlace(isCaptain() ? `💾 단어 칩 ${three.length}개!` : `📒 스티커 ${three.length}장!`);
  save();
}

// ---- Gift meter ---------------------------------------------------------------

const GIFT_PIPS = 3;
let giftFull = 0; // when the meter last filled up: it stays lit until the present opens

// A right answer the first time adds a pip. True when that filled it: then a
// present comes (answeredRight in js/game.js), and the meter starts again.
function fillGiftMeter() {
  state.gifts = (state.gifts | 0) + 1;
  const full = state.gifts >= GIFT_PIPS;
  if (full) {
    state.gifts = 0;
    giftFull = Date.now();
    setTimeout(() => renderGiftMeter(), 2700);
  }
  renderGiftMeter(true);
  return full;
}

function renderGiftMeter(pop) {
  const full = Date.now() - giftFull < 2600;
  const n = full ? GIFT_PIPS : state.gifts | 0;
  albumUi.pips.forEach((p, i) => p.classList.toggle('on', i < n));
  albumUi.gift.classList.toggle('full', full);
  // The pip just lit pops.
  const last = pop && albumUi.pips[n - 1];
  if (last) {
    last.classList.remove('pop');
    void last.offsetWidth;
    last.classList.add('pop');
  }
}

// ---- Gates ----------------------------------------------------------------------

// The gates in the order they open: { key (the scene behind it), stars }.
function albumGates() {
  return [['forest', FOREST_STARS], ['fairy', FAIRY_STARS], ['unicorn', UNICORN_STARS], ['dungeon', DUNGEON_STARS]]
    .map(([key, stars]) => ({ key, stars })).sort((a, b) => a.stars - b.stars);
}
const GATE_LINES = { forest: 'openForest', fairy: 'openFairy', unicorn: 'openUnicorn', dungeon: 'openDungeon' };

// ⭐ 7/10 🌲: the stars needed for the next gate that is still shut, with a
// bar that fills from the last gate that opened. Hidden once all are open.
function renderGateMeter() {
  const gates = albumGates();
  const next = gates.find(g => state.stars < g.stars);
  albumUi.gate.classList.toggle('hidden', !next);
  ui.stars.classList.toggle('to-gate', !!next);
  if (!next) return;
  const from = gates.filter(g => g.stars <= state.stars).reduce((a, g) => Math.max(a, g.stars), 0);
  albumUi.gateNeed.textContent = `/${next.stars}`;
  albumUi.gateIcon.textContent = albumIcon(next.key);
  albumUi.gateBar.style.width = `${Math.round((100 * (state.stars - from)) / (next.stars - from))}%`;
  ui.stars.title = `${placeName(next.key)}까지 별 ${next.stars - state.stars}개`;
}

// After a star: a gate whose stars were just reached opens with a party,
// once she is free (the dialog and any present closed).
function gateCheck(before) {
  for (const g of albumGates()) if (before < g.stars && state.stars >= g.stars) fanfareLater(() => gateFanfare(g));
}

function gateFanfare(g) {
  const show = fanfareBanner(`${albumIcon(g.key)}🔓`, placeName(g.key), '문이 열렸어요!', 2500);
  fanfareFireworks(show, 5);
  Sound.party();
  Sound.say([{ pause: 400 }, { text: line(GATE_LINES[g.key]), narrator: true }]);
  startGateTrail(g);
  return show;
}

// Sparkles on the ground from her to the gate that just opened, in the scene
// with that gate, or to the way into that scene (town to the forest), for a
// minute and a half of being there, or until she goes through. GATE_HOME is
// where each gate stands, for scenes not built yet (building one during the
// party would make it stutter).
let gateTrail = null;
const TRAIL_MS = 90000;
const GATE_HOME = { forest: 'town', fairy: 'town', unicorn: 'forest', dungeon: 'forest' };
function startGateTrail(g) {
  const built = Object.keys(state.scenes).find(n => (state.scenes[n].links || []).some(l => l.needStars === g.stars));
  const home = built || GATE_HOME[g.key];
  if (home) gateTrail = { stars: g.stars, home, target: g.key, left: TRAIL_MS, last: 0, key: '', path: [] };
}

function drawGateTrail(now) {
  const t = gateTrail;
  if (!t) return;
  const sc = state.scene;
  if (sc === state.scenes[t.target]) { gateTrail = null; return; }
  const links = sc.links || [];
  let goals = links.filter(l => l.needStars === t.stars);
  if (!goals.length) goals = links.filter(l => l.target === t.home);
  if (!goals.length) { t.last = 0; return; }
  t.left -= t.last ? Math.min(100, now - t.last) : 0;
  t.last = now;
  if (t.left <= 0) { gateTrail = null; return; }
  const h = heroTile();
  const key = `${sc.kind} ${h.c},${h.r}`;
  if (t.key !== key) {
    t.key = key;
    t.path = findPath(sc, h, (c, r) => goals.some(l => l.c === c && l.r === r), true) || [];
  }
  const s = state.scale;
  const ctx = sctx;
  const fade = Math.min(1, t.left / 4000);
  t.path.forEach((tile, i) => {
    const w = tileCenter(sc, tile.c, tile.r);
    const p = toScreen(w.x, w.y);
    if (p.x < -60 || p.y < -60 || p.x > screen.width + 60 || p.y > screen.height + 60) return;
    // A wave of light running toward the gate: a glow on the ground and a
    // gold twinkle over it.
    const k = 0.5 + 0.5 * Math.sin(now / 170 - i * 0.7);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (0.3 + 0.4 * k) * fade;
    const r = (10 + 4 * k) * s;
    ctx.drawImage(glow(), p.x - r, p.y - r / 2, r * 2, r);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = (0.55 + 0.45 * k) * fade;
    const y = p.y - (3 + 2 * k) * s;
    const z = Math.max(2, Math.round((1.4 + 0.8 * k) * s));
    ctx.fillStyle = '#e0a52a';
    ctx.fillRect(p.x - z, y - z * 2.5, z * 2, z * 5);
    ctx.fillRect(p.x - z * 2.5, y - z, z * 5, z * 2);
    ctx.fillStyle = '#fff6a8';
    ctx.fillRect(p.x - z / 2, y - z * 2, z, z * 4);
    ctx.fillRect(p.x - z * 2, y - z / 2, z * 4, z);
  });
  ctx.globalAlpha = 1;
  // Now and then a sparkle rises from the trail near her.
  if (t.path.length > 1 && Math.random() < 0.25 * fade) {
    const tile = t.path[1 + Math.floor(Math.random() * Math.min(8, t.path.length - 1))];
    const w = tileCenter(sc, tile.c, tile.r);
    state.particles.push({ x: w.x + (Math.random() - 0.5) * 10, y: w.y - 2, vx: (Math.random() - 0.5) * 8, vy: -30 - Math.random() * 20, life: 0.7, color: Math.random() < 0.5 ? '#fff6a8' : '#ffffff', star: true });
  }
}

// ---- Medals ---------------------------------------------------------------------

// Every medal and the question ids behind it. A letter house's are the
// questions of its kinds that are about its letter (its words, the pictures
// that start with it); a village's are all the questions of its kinds. A
// place whose kinds are another's (the cave asks the unicorns' questions)
// shares that medal.
function medalList() {
  const out = [];
  const houseKinds = QUIZ_TYPES.house || [];
  for (const h of TOWN_HOUSES) {
    const ids = new Set();
    for (const kind of houseKinds) {
      const own = reviewPool(kind, { letter: h.letter });
      if (own.length && own.length < reviewPool(kind).length) own.forEach(id => ids.add(id));
    }
    out.push({ id: `house:${h.letter}`, letter: h.letter, ids: [...ids] });
  }
  const seen = new Set();
  for (const key of ['town', 'forest', 'unicorn', 'fairy', 'dungeon']) {
    const kinds = QUIZ_TYPES[key];
    const sig = kinds && kinds.slice().sort().join();
    if (!kinds || seen.has(sig)) continue;
    seen.add(sig);
    const ids = new Set();
    for (const kind of kinds) reviewPool(kind).forEach(id => ids.add(id));
    out.push({ id: `village:${key}`, key, ids: [...ids] });
  }
  return out;
}

const medalSolved = id => ((state.history || {})[id] || {}).right > 0;
function medalProgress(m) {
  return { have: m.ids.filter(medalSolved).length, total: m.ids.length };
}

// After every answer: any medal she has just earned is hers, and is
// celebrated once she is free (several at once share one celebration).
function checkMedals() {
  const got = [];
  for (const m of medalList()) {
    if (state.medals[m.id] || !m.ids.length || !m.ids.every(medalSolved)) continue;
    state.medals[m.id] = Date.now();
    got.push(m);
  }
  if (!got.length) return;
  save();
  fanfareLater(() => medalFanfare(got));
}

const medalIcon = () => (isCaptain() ? '🎖️' : '🏅');
const medalName = m => (m.letter ? `${m.letter}${m.letter.toLowerCase()}` : placeName(m.key));

function medalFanfare(list) {
  const first = list[0];
  const show = fanfareBanner(`${medalIcon()}${list.length > 1 ? medalIcon() : ''}`, list.map(medalName).join(' · '), '메달을 받았어요!', 2000);
  fanfareFireworks(show, 3);
  Sound.party();
  const said = first.letter ? line('medalHouse', { letter: first.letter }) : line('medalVillage');
  Sound.say([{ pause: 400 }, { text: said, narrator: true }]);
  return show;
}

// A small ⭐ on the sign of every letter house with a medal, and on the
// letter poster inside.
function drawMedalBadges() {
  const sc = state.scene;
  const s = state.scale;
  const ctx = sctx;
  for (const sg of sc.signs) {
    const m = /^([A-Z])([a-z])$/.exec(sg.text);
    if (!m || m[2] !== m[1].toLowerCase() || !state.medals[`house:${m[1]}`]) continue;
    const p = toScreen(sg.x, sg.y);
    if (p.x < -60 || p.y < -60 || p.x > screen.width + 60 || p.y > screen.height + 60) continue;
    ctx.font = `800 ${(sg.big ? 22 : 11) * s}px "Baloo 2", "Trebuchet MS", sans-serif`;
    const w = ctx.measureText(sg.text).width + (sg.plain ? 0 : 8 * s);
    drawStarBadge(ctx, p.x + w / 2 + (sg.big ? 4 : 1) * s, p.y - (sg.big ? 9 : 6) * s, (sg.big ? 7 : 5) * s);
  }
}

function drawStarBadge(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = r * 0.22;
  ctx.strokeStyle = '#e0a52a';
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const k = i % 2 ? r * 0.36 : r * 0.78;
    ctx.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffc83d';
  ctx.fill();
}

// Called from drawOverlay (js/game.js).
function drawProgressFx(now) {
  drawMedalBadges();
  if (!state.busy) drawGateTrail(now);
}

// ---- Cheers -------------------------------------------------------------------

// Answers right the first time in a row (this visit only). At 3 and 5, then
// every 5, the asker cheers instead of the usual praise, with a burst of
// sparkles over them. A miss starts the count again without a word.
function comboCheer(q) {
  if (q.misses) { state.combo = 0; return null; }
  const n = state.combo = (state.combo | 0) + 1;
  const kind = n === 3 ? 'combo' : n === 5 ? 'combo5' : n > 5 && n % 5 === 0 ? 'comboMore' : null;
  if (!kind) return null;
  const who = state.talking;
  const p = who ? tileCenter(state.scene, who.c, who.r) : heroWorld();
  const colors = ['#ff6fa8', '#ffd34d', '#ffffff', '#ff9cf0', '#9fd0ff'];
  for (let i = 0; i < (n >= 5 ? 36 : 24); i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
    const v = 30 + Math.random() * 45;
    state.particles.push({ x: p.x, y: p.y - 40, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.8 + Math.random() * 0.5, color: colors[i % colors.length], star: i % 2 === 0 });
  }
  return line(kind);
}

// ---- Celebrations -------------------------------------------------------------

// Waiting celebrations (a gate, a medal) play one at a time once she is
// free: no dialog, present or panel open, and a moment after a present so
// its last line is heard.
const fanfares = [];
let fanfareNow = null;
let fanfareTimer = null;
let fanfareCalm = 0;
let fanfareRewardAt = 0;
function fanfareLater(run) {
  fanfares.push({ run, after: Date.now() + 600 });
  if (!fanfareTimer) fanfareTimer = setInterval(fanfareTick, 200);
}
function fanfareTick() {
  if (typeof state === 'undefined') return;
  const now = Date.now();
  if (!ui.reward.classList.contains('hidden')) fanfareRewardAt = now;
  const free = !state.busy && !state.gift && ui.dialog.classList.contains('hidden') && ui.reward.classList.contains('hidden') && ui.start.classList.contains('hidden');
  if (!free) { fanfareCalm = 0; return; }
  if (!fanfareCalm) fanfareCalm = now;
  if (fanfareNow && now < fanfareNow.end) return;
  fanfareNow = null;
  const next = fanfares[0];
  if (!next) { clearInterval(fanfareTimer); fanfareTimer = null; return; }
  if (now < next.after || now - fanfareCalm < 300 || now - fanfareRewardAt < 1600) return;
  fanfares.shift();
  fanfareNow = next.run();
}

// A big icon and a line or two in the middle of the screen for `ms`.
function fanfareBanner(icon, title, sub, ms) {
  const el = document.createElement('div');
  el.className = 'fanfare';
  el.style.animationDuration = `${ms}ms`;
  el.innerHTML = `<div class="ic">${icon}</div><div class="t">${title}</div>${sub ? `<div class="s">${sub}</div>` : ''}`;
  document.body.append(el);
  ui.place.classList.remove('show');
  const show = { el, end: Date.now() + ms, timers: [] };
  show.stop = () => { show.timers.forEach(clearTimeout); el.remove(); show.end = 0; };
  show.timers.push(setTimeout(show.stop, ms));
  return show;
}

// Fireworks over her: `n` bursts, one every 0.4 s.
function fanfareFireworks(show, n) {
  const colors = [['#ff6fa8', '#ffd0e6', '#ffffff'], ['#ffd34d', '#fff6a8', '#ffffff'], ['#9fd0ff', '#d8f0ff', '#ffffff'], ['#c7a4ff', '#ece0ff', '#ffffff'], ['#9be88a', '#e0ffd8', '#ffffff']];
  for (let k = 0; k < n; k++) {
    show.timers.push(setTimeout(() => {
      const h = heroWorld();
      const at = { x: h.x + (Math.random() - 0.5) * 120, y: h.y - 60 - Math.random() * 40 };
      const cols = colors[k % colors.length];
      for (let i = 0; i < 34; i++) {
        const a = (i / 34) * Math.PI * 2;
        const v = 45 + Math.random() * 25;
        state.particles.push({ x: at.x, y: at.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0.9 + Math.random() * 0.5, color: cols[i % cols.length], star: i % 3 === 0 });
      }
      Sound.tune('chime');
    }, k * 400));
  }
}

// A tap anywhere ends what is playing: stickers land at once, a banner goes.
// The tap still does whatever it does in the game.
function albumSkip() {
  for (const a of albumAnims) a.finish();
  if (fanfareNow) fanfareNow.stop();
}
addEventListener('pointerdown', albumSkip, true);

// ---- The album ------------------------------------------------------------------

let albumTab = null; // the letter on show, or 'medals'

function openAlbum() {
  if (!albumUi.box.classList.contains('hidden')) { closeAlbum(); return; }
  if (state.busy) { albumBump(); return; }
  Sound.tap();
  state.busy = true;
  // She stops where she is: nobody starts talking under the album.
  const h = state.hero;
  h.onArrive = null;
  h.path = h.path.slice(0, 1);
  // The page of the newest sticker she hasn't seen yet, else the last page.
  const fresh = Object.entries(state.stickers).filter(([, s]) => s.new).sort((a, b) => b[1].at - a[1].at)[0];
  if (fresh) albumTab = fresh[0][0].toUpperCase();
  if (!albumTab) albumTab = albumAll()[0].L;
  renderAlbum();
  albumUi.box.classList.remove('hidden');
  Sound.say([{ text: line('album'), narrator: true }]);
}

function closeAlbum() {
  albumUi.box.classList.add('hidden');
  for (const s of Object.values(state.stickers)) delete s.new;
  state.busy = false;
  Sound.tap();
  renderAlbumButton();
  save();
}

function renderAlbum() {
  const robot = isCaptain();
  const all = albumAll();
  const have = all.filter(x => state.stickers[x.w]).length;
  albumUi.name.textContent = robot ? '💾 단어 칩 북' : '📒 단어 스티커';
  albumUi.box.classList.toggle('medals', albumTab === 'medals');
  // Tabs: one big letter per page, with how full it is, then the medals.
  const letters = [...new Set(all.map(x => x.L))].sort();
  albumUi.tabs.innerHTML = '';
  for (const L of letters.concat('medals')) {
    const b = document.createElement('button');
    b.className = 'al-tab';
    b.classList.toggle('on', L === albumTab);
    if (L === 'medals') {
      b.classList.add('medal-tab');
      b.innerHTML = `<span class="L">${medalIcon()}</span>`;
    } else {
      const page = all.filter(x => x.L === L);
      const got = page.filter(x => state.stickers[x.w]).length;
      b.classList.toggle('done', got === page.length);
      b.classList.toggle('fresh', page.some(x => (state.stickers[x.w] || {}).new));
      b.innerHTML = `<span class="L">${L}</span><span class="bar"><i style="width:${Math.round((100 * got) / page.length)}%"></i></span>`;
    }
    b.addEventListener('click', () => {
      Sound.tap();
      albumTab = L;
      renderAlbum();
      albumUi.page.scrollTop = 0;
      if (L !== 'medals') Sound.say([{ text: L, narrator: true }]);
    });
    albumUi.tabs.append(b);
  }
  if (albumTab === 'medals') { renderMedalPage(); return; }
  albumUi.count.textContent = `${robot ? '모은 칩' : '모은 스티커'} ${have} / ${all.length}`;
  albumUi.page.innerHTML = '';
  for (const x of all.filter(y => y.L === albumTab)) {
    const st = state.stickers[x.w];
    const b = document.createElement('button');
    b.className = 'sticker';
    b.classList.toggle('got', !!st);
    b.classList.toggle('new', !!st && !!st.new);
    b.classList.toggle('shiny', !!st && st.n >= 3);
    b.innerHTML = `<span class="em">${x.e}</span><span class="w${st && x.w.length > 7 ? ' long' : ''}">${st ? albumWordHtml(x.w) : '?'}</span>`;
    b.addEventListener('click', () => stickerTap(b, x, !!st));
    albumUi.page.append(b);
  }
}

// A sticker she has says its word and, when recorded, what it starts with.
function stickerTap(b, x, got) {
  b.classList.remove('wiggle');
  void b.offsetWidth;
  b.classList.add('wiggle');
  Sound.tap();
  if (!got) return;
  const parts = [{ text: `${x.w}!`, narrator: true }];
  const starts = `${x.w} starts with ${x.L}.`;
  if (Sound.hasClip(starts)) parts.push({ pause: 300 }, { text: starts, narrator: true });
  Sound.say(parts);
}

function renderMedalPage() {
  const medals = medalList();
  const earned = medals.filter(m => state.medals[m.id]).length;
  albumUi.count.textContent = `메달 ${earned} / ${medals.length}`;
  albumUi.page.innerHTML = '';
  const group = (title, list) => {
    const h = document.createElement('div');
    h.className = 'al-group';
    h.textContent = title;
    const row = document.createElement('div');
    row.className = 'al-medals';
    for (const m of list) {
      const { have, total } = medalProgress(m);
      const got = !!state.medals[m.id];
      const b = document.createElement('button');
      b.className = 'medal';
      b.classList.toggle('got', got);
      b.classList.toggle('house', !!m.letter);
      b.style.setProperty('--p', `${total ? Math.round((100 * have) / total) : 0}%`);
      b.title = `${medalName(m)} ${have} / ${total}`;
      b.innerHTML = `<span class="disc"><span class="L">${m.letter ? medalName(m) : albumIcon(m.key)}</span></span>${got ? '<span class="ribbon">⭐</span>' : ''}`;
      b.addEventListener('click', () => {
        b.classList.remove('wiggle');
        void b.offsetWidth;
        b.classList.add('wiggle');
        Sound.tap();
        if (m.letter) Sound.say([{ text: m.letter, narrator: true }]);
      });
      row.append(b);
    }
    albumUi.page.append(h, row);
  };
  group(isCaptain() ? '🔧 글자 공방' : '🏠 글자 집', medals.filter(m => m.letter));
  group('🗺️ 마을', medals.filter(m => !m.letter));
}

albumUi.button.addEventListener('click', () => { Sound.unlock(); openAlbum(); });
albumUi.done.addEventListener('click', closeAlbum);

// ---- In her room ------------------------------------------------------------------

// A little desk with the sticker book open on it, in her room (and in the
// robot's). Tapping it opens the album (tapObject in js/game.js).
function addAlbumDesk(sc, c, r) {
  block(sc, c, r, 1, 1);
  const top = tileCenter(sc, c, r);
  sc.signs.push({ x: top.x, y: top.y - 30, text: '📒', color: '#ffd34d', plain: true });
  return addObject(sc, { c, r, w: 1, d: 1 }, footBounds(sc, c, r, 1, 1, 30, 8), ctx => drawAlbumDesk(ctx, sc, c, r), { kind: 'album', front: [{ c, r: r + 1 }] });
}

function drawAlbumDesk(ctx, sc, c, r) {
  const robot = isCaptain();
  const H = 13;
  const k = boxCorners(sc, c + 0.12, r + 0.18, 0.76, 0.64);
  drawFurnitureBox(ctx, k, H, robot ? '#9aa8c4' : '#c8905a', robot ? '#d4ddef' : '#e8b07a', robot ? '#7a88a8' : '#a8704a');
  const up = (p, h) => ({ x: p.x, y: p.y - h });
  const quad = (q, h, col) => fillPoly(ctx, [q.T, q.R, q.B, q.L].map(p => up(p, h)), col);
  // The cover, then two white pages with stickers on them.
  quad(boxCorners(sc, c + 0.2, r + 0.24, 0.6, 0.52), H + 1, robot ? '#2f6fd8' : '#ff6fa8');
  quad(boxCorners(sc, c + 0.24, r + 0.28, 0.25, 0.44), H + 2, '#ffffff');
  quad(boxCorners(sc, c + 0.51, r + 0.28, 0.25, 0.44), H + 2, '#fffaf0');
  const dots = robot ? ['#ffd34d', '#5ad0ff', '#7fe870', '#ff9a3a'] : ['#ffd34d', '#ff8fc0', '#9fd0ff', '#9be88a'];
  [[0.32, 0.4], [0.4, 0.6], [0.6, 0.38], [0.66, 0.6]].forEach(([dc, dr], i) => {
    const p = tileCenter(sc, c + dc - 0.5, r + dr - 0.5);
    px(ctx, Math.round(p.x) - 1, Math.round(p.y - H - 3), 3, 2, dots[i]);
  });
}
