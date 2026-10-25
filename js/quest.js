// Today's adventures (the robot's missions) and a treasure chest, in both
// editions. Every day three little quests are picked from QUESTS in
// js/data.js, one from each group, among the ones she can do with what is
// open: nothing from the Fairy Village before its gate opens, no feeding
// without a friend. Each is a big picture with dots to fill (⭐ ●●●○○),
// counted from what she does that day. A quest she finishes gets a tick and
// a chime once she is free; when all three are done the chest glows, and
// tapping it opens it (about 2 s, a tap skips it) for QUEST_CHEST.coins
// coins, once a day. A day she doesn't play changes nothing: there is no
// streak, and nothing is ever taken away.
// The chest in the HUD opens the card; it never opens over a question.
// Hooks: questAdd where things happen (answeredRight, addDust, enterDoor
// and followLink in js/game.js, collectSticker and stickerPack in
// js/album.js, miniCatch, bookFinish, selfFinish and feedOnce),
// renderQuestHud from renderStars, load/save and applyProgress. Saved:
// state.quests, { day, picks, got, chest }, with what each tablet counted
// kept apart (got[device][kind]) so two tablets on one account add up
// (joinQuests in js/progress.js).

// ---- The day's quests ----------------------------------------------------------

const QUEST_GROUPS = ['learn', 'play', 'go'];

// Today on this tablet's clock, as 2026-10-25 (so days sort as text).
function questDay() {
  const d = new Date();
  const two = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

// Whether she can do a quest with what she has now: its gate is open, the
// album has stickers left to find, her friend is on and still growing.
function questOpen(kind) {
  const q = QUESTS[kind];
  if (!q || (q.stars && state.stars < q.stars)) return false;
  if (kind === 'sticker') return albumWords().filter(x => !state.stickers[x.w]).length >= q.n * 3;
  if (kind === 'feed') {
    const key = friendWorn();
    return !!key && !friendGrown(key) && (state.dust >= q.n || state.stars >= FAIRY_STARS);
  }
  return true;
}

// One quest from each group. The day picks them, so two tablets with the
// same things open pick the same ones.
function questPick(day) {
  const [y, m, d] = day.split('-').map(Number);
  const seed = Math.round(Date.UTC(y, m - 1, d) / 864e5);
  return QUEST_GROUPS.map((g, i) => {
    const open = Object.keys(QUESTS).filter(k => QUESTS[k].group === g && questOpen(k));
    return open[Math.floor(hash(seed, i, 23) * open.length)];
  }).filter(Boolean);
}

// Today's quests; new ones when the saved ones are from an earlier day. A
// later day (a tablet whose clock is ahead) stays until today gets there.
function questsToday() {
  const day = questDay();
  const q = state.quests;
  if (q && q.day >= day && q.picks.length) return q;
  state.quests = { day, picks: questPick(day), got: {}, chest: false };
  return state.quests;
}

// A saved state.quests, or null: known quests and plain counts only.
function questSaved(x) {
  if (!x || typeof x !== 'object' || typeof x.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x.day)) return null;
  const got = {};
  for (const [dev, e] of Object.entries(x.got && typeof x.got === 'object' ? x.got : {})) {
    if (!e || typeof e !== 'object') continue;
    got[dev] = {};
    for (const [k, v] of Object.entries(e)) if (QUESTS[k] && Number.isFinite(v) && v > 0) got[dev][k] = Math.floor(v);
  }
  const picks = Array.isArray(x.picks) ? x.picks.filter(k => QUESTS[k]).slice(0, QUEST_GROUPS.length) : [];
  return { day: x.day, picks, got, chest: x.chest === true };
}

// How many times she has done a kind of thing today, on every tablet.
function questCount(kind) {
  return Object.values(questsToday().got).reduce((a, e) => a + ((e && e[kind]) | 0), 0);
}
const questDone = kind => questCount(kind) >= QUESTS[kind].n;
const questAllDone = () => questsToday().picks.every(questDone);
// All three done and the chest still shut.
const questReady = () => questAllDone() && !questsToday().chest;

// Something she did (a star, a fish, a house...): counted for today. When
// it finishes one of today's quests, a tick comes once she is free; going
// somewhere waits a moment more, so the place's welcome is heard first.
function questAdd(kind, n = 1) {
  if (!QUESTS[kind]) return;
  const q = questsToday();
  const was = questDone(kind);
  const mine = q.got[Progress.device] || (q.got[Progress.device] = {});
  mine[kind] = (mine[kind] | 0) + n;
  if (!q.picks.includes(kind)) return;
  if (!was && questDone(kind)) setTimeout(() => fanfareLater(() => questTick(kind)), QUESTS[kind].group === 'go' ? 2400 : 0);
  renderQuestHud();
  save();
}
// A way into another place (followLink in js/game.js).
function questVisit(target) {
  if (QUESTS[target] && QUESTS[target].place) questAdd(target);
}

// ---- The HUD and the card ------------------------------------------------------

const questUi = (() => {
  // The chest first among the buttons on the right, with a dot per quest.
  const button = document.createElement('button');
  button.id = 'quest-btn';
  button.className = 'btn quest-btn';
  button.title = isCaptain() ? '오늘의 임무' : '오늘의 모험';
  button.innerHTML = '<canvas width="20" height="16"></canvas><span class="pips"><i></i><i></i><i></i></span>';
  document.querySelector('.hud .buttons').prepend(button);
  const box = document.createElement('section');
  box.id = 'quests';
  box.className = 'quests hidden';
  box.innerHTML = `
    <div class="qs-head"><div class="qs-title"></div><button class="qs-done" title="다 봤어요">👋</button></div>
    <div class="qs-row">
      <div class="qs-list"></div>
      <div class="qs-arrow">➜</div>
      <button class="qs-chest" title="보물상자"><canvas width="20" height="16"></canvas><span class="prize"></span></button>
    </div>`;
  document.body.append(box);
  return {
    button, chip: button.querySelector('canvas'), pips: [...button.querySelectorAll('.pips i')], chipOpen: null,
    box, title: box.querySelector('.qs-title'), list: box.querySelector('.qs-list'), done: box.querySelector('.qs-done'),
    chest: box.querySelector('.qs-chest'), chestArt: box.querySelector('.qs-chest canvas'), prize: box.querySelector('.prize'),
    party: 0, // when the chest last opened
  };
})();

// The treasure chest, 20 x 16 pixels: shut, or open with gold inside.
const QUEST_CHEST_ART = {
  shut: [
    '....................', '....................', '...oooooooooooooo...', '..ollggllllllggllo..',
    '.owwwggwwwwwwggwwwo.', '.owwwggwwwwwwggwwwo.', '.oWWWGGWWWWWWGGWWWo.', '.oooooooggggooooooo.',
    '.owwwggwgyygwggwwwo.', '.owwwggwgkkgwggwwwo.', '.owwwggwGggGwggwwwo.', '.owwwggwwwwwwggwwwo.',
    '.owwwggwwwwwwggwwwo.', '.owwwggwwwwwwggwwwo.', '.oWWWGGWWWWWWGGWWWo.', '.oooooooooooooooooo.',
  ],
  open: [
    '...oooooooooooooo...', '..oWWGGWWWWWWGGWWo..', '.oWWWGGWWWWWWGGWWWo.', '.oWWWGGWWWWWWGGWWWo.',
    '.oooooooooooooooooo.', '.oWgyWgrgWWygWbgWWo.', '.ogyggrgygggbgyggro.', '.oooooooggggooooooo.',
    '.owwwggwgyygwggwwwo.', '.owwwggwgkkgwggwwwo.', '.owwwggwGggGwggwwwo.', '.owwwggwwwwwwggwwwo.',
    '.owwwggwwwwwwggwwwo.', '.owwwggwwwwwwggwwwo.', '.oWWWGGWWWWWWGGWWWo.', '.oooooooooooooooooo.',
  ],
};
// Wood with gold bands; the robot's is steel blue.
function drawQuestChest(cv, open) {
  const robot = isCaptain();
  const pal = {
    o: robot ? '#2f2c56' : '#4a2c4f', w: robot ? '#4f86d8' : '#b07a4a', l: robot ? '#86b8f4' : '#d8a066', W: robot ? '#2f5aa8' : '#8a5a3c',
    g: '#ffd34d', G: '#e0a83a', y: '#fff6a8', k: robot ? '#2f2c56' : '#4a2c4f', r: '#ff6fa8', b: '#6fd0ff',
  };
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  QUEST_CHEST_ART[open ? 'open' : 'shut'].forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (pal[row[x]]) px(ctx, x, y, 1, 1, pal[row[x]]);
  });
}

// A quest's picture: its emoji, the place's own (🌲), or her friend itself.
function questPicture(kind) {
  const q = QUESTS[kind];
  const key = kind === 'feed' && friendWorn();
  if (key) {
    const s = friendSprite(key, 0);
    const cv = document.createElement('canvas');
    cv.className = 'ic';
    cv.width = s.canvas.width;
    cv.height = s.canvas.height;
    cv.getContext('2d').drawImage(s.canvas, 0, 0);
    return cv;
  }
  const el = document.createElement('span');
  el.className = 'ic';
  el.textContent = q.place ? albumIcon(kind) : q.icon;
  return el;
}

// Called by renderStars (js/game.js): a dot lights for each quest done, the
// chest glows when it can be opened and stays open once it has been.
function renderQuestHud() {
  const q = questsToday();
  const done = q.picks.filter(questDone).length;
  questUi.pips.forEach((p, i) => {
    p.classList.toggle('on', i < done);
    p.classList.toggle('hidden', i >= q.picks.length);
  });
  questUi.button.classList.toggle('ready', questReady());
  if (questUi.chipOpen !== q.chest) {
    questUi.chipOpen = q.chest;
    drawQuestChest(questUi.chip, q.chest);
  }
  if (!questUi.box.classList.contains('hidden') && Date.now() - questUi.party > 2500) renderQuests();
}

// The HUD chest hops: a quest is done, or the card can't open right now.
function questBump() {
  const b = questUi.button;
  b.classList.remove('pop');
  void b.offsetWidth;
  b.classList.add('pop');
}

function renderQuests() {
  const q = questsToday();
  questUi.title.textContent = isCaptain() ? '🗺️ 오늘의 임무' : '🗺️ 오늘의 모험';
  questUi.list.innerHTML = '';
  for (const kind of q.picks) {
    const need = QUESTS[kind].n;
    const have = Math.min(need, questCount(kind));
    const b = document.createElement('button');
    b.className = 'qs-quest';
    b.classList.toggle('done', have >= need);
    const pips = document.createElement('span');
    pips.className = 'pips';
    pips.innerHTML = '<i class="on"></i>'.repeat(have) + '<i></i>'.repeat(need - have);
    const tick = document.createElement('span');
    tick.className = 'qs-tick';
    b.append(questPicture(kind), pips, tick);
    b.addEventListener('click', () => questTapPicture(b, kind));
    questUi.list.append(b);
  }
  questUi.chest.classList.toggle('ready', questReady());
  questUi.chest.classList.toggle('opened', q.chest);
  drawQuestChest(questUi.chestArt, q.chest);
  questUi.prize.textContent = q.chest ? `🪙 +${QUEST_CHEST.coins}` : '';
}

// A quest's picture says its word, when that is recorded ("fish!").
function questTapPicture(b, kind) {
  b.classList.remove('wiggle');
  void b.offsetWidth;
  b.classList.add('wiggle');
  Sound.tap();
  const w = QUESTS[kind].word;
  if (w && Sound.hasClip(`${w}!`)) Sound.say([{ text: `${w}!`, narrator: true }]);
}

function openQuests() {
  if (!questUi.box.classList.contains('hidden')) { closeQuests(); return; }
  if (state.busy) { questBump(); return; }
  Sound.tap();
  state.busy = true;
  // She stops where she is: nobody starts talking under the card.
  const h = state.hero;
  h.onArrive = null;
  h.path = h.path.slice(0, 1);
  renderQuests();
  questUi.box.classList.remove('hidden');
  if (questReady()) Sound.say([{ text: line('questReady'), narrator: true }]);
  else if (!questsToday().chest) Sound.say([{ text: line('questHello'), narrator: true }]);
}

function closeQuests() {
  if (questUi.box.classList.contains('hidden')) return;
  questSkip();
  questUi.box.classList.add('hidden');
  questUi.chest.classList.remove('burst');
  state.busy = busyNow(); // js/game.js
  Sound.tap();
  renderQuestHud();
}

// ---- The chest -----------------------------------------------------------------

// A tap on the chest: it opens when all three are done; otherwise it
// wiggles (and says "chest!").
function questChestTap() {
  const c = questUi.chest;
  if (questReady()) { questOpenChest(); return; }
  c.classList.remove('wiggle');
  void c.offsetWidth;
  c.classList.add('wiggle');
  Sound.tap();
  if (!questsToday().chest && Sound.hasClip('chest!')) Sound.say([{ text: 'chest!', narrator: true }]);
}

// It pops open, sparkles fly out and the coins fly into the purse while the
// narrator cheers. It pays at once, so it pays once whatever happens next.
function questOpenChest() {
  questsToday().chest = true;
  state.coins += QUEST_CHEST.coins;
  save();
  renderCoins(false); // the purse shows, to catch them
  questUi.party = Date.now();
  renderQuests();
  renderQuestHud();
  questUi.chest.classList.remove('burst');
  void questUi.chest.offsetWidth;
  questUi.chest.classList.add('burst');
  Sound.party();
  Sound.say([{ pause: 500 }, { text: line('questChest'), narrator: true }]);
  questSparkles();
  questCoinsFly();
}

// Animations of the chest opening; a tap anywhere ends them (questSkip).
const questAnims = new Set();
function questAnim(el, frames, opts, done) {
  if (!el.animate) { done(); return; }
  const a = el.animate(frames, Object.assign({ fill: 'both' }, opts));
  questAnims.add(a);
  a.onfinish = () => { questAnims.delete(a); done(); };
  a.oncancel = a.onfinish;
}

function questSparkles() {
  const colors = ['#ffd34d', '#fff6a8', '#ffffff', '#ff9cf0', '#9fd0ff'];
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('i');
    s.className = 'qs-spark';
    s.style.background = colors[i % colors.length];
    questUi.chest.append(s);
    const a = (i / 18) * Math.PI * 2;
    const r = 55 + Math.random() * 45;
    const to = `translate(calc(-50% + ${Math.round(Math.cos(a) * r)}px), calc(-50% + ${Math.round(Math.sin(a) * r - 24)}px))`;
    questAnim(s, [{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }, { transform: `${to} scale(0.3)`, opacity: 0 }],
      { duration: 900 + Math.random() * 500, easing: 'ease-out' }, () => s.remove());
  }
}

// Coins jump out of the chest and fly into 🪙, which pops as the last lands.
function questCoinsFly() {
  const from = questUi.chestArt.getBoundingClientRect();
  const to = ui.coins.getBoundingClientRect();
  const n = Math.min(QUEST_CHEST.coins, 6);
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'coin-fly';
    el.textContent = '🪙';
    const x0 = from.left + from.width / 2 + (i - (n - 1) / 2) * 16;
    const y0 = from.top + from.height * 0.35;
    el.style.left = `${Math.round(x0)}px`;
    el.style.top = `${Math.round(y0)}px`;
    document.body.append(el);
    const land = () => { el.remove(); if (i === n - 1) { renderCoins(true); Sound.coin(); } };
    if (!to.width) { land(); continue; }
    const dx = Math.round(to.left + to.width / 2 - x0);
    const dy = Math.round(to.top + to.height / 2 - y0);
    questAnim(el, [
      { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 0 },
      { transform: 'translate(-50%, calc(-50% - 54px)) scale(1.2)', opacity: 1, offset: 0.3 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.6)`, opacity: 0.9 },
    ], { duration: 1100, delay: 250 + i * 110, easing: 'ease-in-out' }, land);
  }
}

function questSkip() {
  for (const a of [...questAnims]) a.finish();
}
addEventListener('pointerdown', questSkip, true);

// A finished quest: its picture with a tick under the chest in the HUD, and
// a chime. After the last one the chest glows and the narrator says so.
function questTick(kind) {
  renderQuestHud();
  questBump();
  const all = questReady();
  const ms = all ? 2400 : 1400;
  const b = questUi.button.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'quest-tick';
  el.style.left = `${Math.round(b.left + b.width / 2)}px`;
  el.style.top = `${Math.round(b.bottom + 10)}px`;
  el.style.animationDuration = `${ms}ms`;
  const tick = document.createElement('span');
  tick.className = 'qs-tick';
  el.append(questPicture(kind), tick);
  document.body.append(el);
  Sound.sparkle();
  if (all) Sound.say([{ pause: 500 }, { text: line('questReady'), narrator: true }]);
  const show = { el, end: Date.now() + ms, stop: () => { el.remove(); show.end = 0; } };
  setTimeout(show.stop, ms);
  return show;
}

// For the parent panel (js/parent.js): today's three and the chest.
function questParentLine() {
  const q = questsToday();
  const each = q.picks.map(k => `${QUESTS[k].place ? albumIcon(k) : QUESTS[k].icon} ${Math.min(questCount(k), QUESTS[k].n)}/${QUESTS[k].n}`);
  const chest = q.chest ? '열었어요' : questAllDone() ? '열 수 있어요' : '아직 닫혀 있어요';
  return `오늘의 ${isCaptain() ? '임무' : '모험'}: ${each.join(' · ')} · 보물상자 ${chest}`;
}

questUi.button.addEventListener('click', () => { Sound.unlock(); openQuests(); });
questUi.done.addEventListener('click', closeQuests);
questUi.chest.addEventListener('click', questChestTap);
// Past midnight the HUD shows the new day's quests.
setInterval(() => { if (typeof state !== 'undefined' && !state.busy) renderQuestHud(); }, 60000);
