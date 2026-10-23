// PixelTown main loop: scrolling town, princess movement, doors,
// villager word questions and outfit rewards.

const screen = document.getElementById('game');
const sctx = screen.getContext('2d');
const view = document.createElement('canvas');
const vctx = view.getContext('2d');

const ui = {
  start: document.getElementById('start'),
  startBtn: document.getElementById('start-btn'),
  startPreview: document.getElementById('start-preview'),
  startTitle: document.getElementById('start-title'),
  nameInput: document.getElementById('name-input'),
  spokenInput: document.getElementById('spoken-input'),
  hearName: document.getElementById('hear-name'),
  titleChips: document.getElementById('title-chips'),
  lookChips: document.getElementById('look-chips'),
  wdTitle: document.getElementById('wd-title'),
  stars: document.getElementById('stars'),
  pictures: document.getElementById('pictures'),
  ride: document.getElementById('ride'),
  mute: document.getElementById('mute'),
  fade: document.getElementById('fade'),
  place: document.getElementById('place'),
  dialog: document.getElementById('dialog'),
  portrait: document.getElementById('dlg-portrait'),
  name: document.getElementById('dlg-name'),
  text: document.getElementById('dlg-text'),
  clue: document.getElementById('dlg-clue'),
  choices: document.getElementById('dlg-choices'),
  replay: document.getElementById('dlg-replay'),
  close: document.getElementById('dlg-close'),
  reward: document.getElementById('reward'),
  rewardTitle: document.getElementById('rw-title'),
  rewardName: document.getElementById('rw-name'),
  pvNow: document.getElementById('pv-now'),
  pvNew: document.getElementById('pv-new'),
  rewardYes: document.getElementById('rw-yes'),
  rewardNo: document.getElementById('rw-no'),
  wardrobe: document.getElementById('wardrobe'),
  wdPreview: document.getElementById('wd-preview'),
  wdSlots: document.getElementById('wd-slots'),
  wdCount: document.getElementById('wd-count'),
  wdDone: document.getElementById('wd-done'),
  coins: document.getElementById('coins'),
  dust: document.getElementById('dust'),
  shop: document.getElementById('shop'),
  shopCoins: document.getElementById('shop-coins'),
  shopMsg: document.getElementById('shop-msg'),
  shopPreview: document.getElementById('shop-preview'),
  shopItems: document.getElementById('shop-items'),
  shopBuy: document.getElementById('shop-buy'),
  shopDone: document.getElementById('shop-done'),
};

// Everything that can be worn, by slot, in wardrobe order.
const WARDROBE = [
  { slot: 'dress', title: '드레스 색', items: DRESS_COLORS },
  { slot: 'shape', title: '드레스 모양', items: DRESS_SHAPES },
  { slot: 'head', title: '머리 장식', items: HEADWEAR },
  { slot: 'hand', title: '손에 드는 것', items: HAND_ITEMS },
  { slot: 'hair', title: '머리 색', items: HAIR_COLORS },
  { slot: 'back', title: '등에 다는 것 (별빛 숲)', items: BACK_ITEMS },
  { slot: 'ride', title: '유니콘 (유니콘 마을)', items: UNICORNS },
  { slot: 'fairy', title: '요정 친구 (요정 마을)', items: FAIRIES },
];

// ---- Saved progress ------------------------------------------------------

const SAVE_KEY = 'pixeltown-v2';

function setPlayer(p) {
  if (typeof p.shown === 'string' && p.shown.trim()) PLAYER.shown = p.shown.trim().slice(0, 10);
  if (typeof p.spoken === 'string' && p.spoken.trim()) PLAYER.spoken = p.spoken.trim().slice(0, 20);
  if (TITLES[p.title]) PLAYER.title = p.title;
  if (p.look === 'girl' || p.look === 'boy') PLAYER.look = p.look;
  // Princes and kings are boys, princesses, queens and fairies girls.
  if (TITLES[PLAYER.title].look) PLAYER.look = TITLES[PLAYER.title].look;
}
const isBoy = () => PLAYER.look === 'boy';
// Whether a wardrobe item suits the hero's look.
const suits = item => !!item && !(isBoy() ? item.girl : item.boy);
const defaultOutfit = () => (isBoy() ? DEFAULT_BOY_OUTFIT : DEFAULT_OUTFIT);
// Swaps anything that doesn't suit the hero's look for the starting item.
function fitOutfit(outfit) {
  const fit = Object.assign({}, outfit);
  for (const { slot, items } of WARDROBE) if (!suits(items[fit[slot]])) fit[slot] = defaultOutfit()[slot];
  return fit;
}
// The hero's standing sprite: a princess or a boy, by look.
function heroSprite(outfit, frame) {
  return isBoy() ? boySprite(outfit, frame) : princessSprite(outfit, frame);
}
// "윤아님" style title on screen, such as 공주님.
const titleKo = () => TITLES[PLAYER.title].ko;

// Hangul to Latin letters (Revised Romanization, syllable by syllable) so
// the English voice can say a Korean name. Parents can fix it by hand.
const RR_INITIAL = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const RR_VOWEL = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const RR_FINAL = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
function romanize(text) {
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) { out += ch; continue; }
    out += RR_INITIAL[Math.floor(code / 588)] + RR_VOWEL[Math.floor((code % 588) / 28)] + RR_FINAL[code % 28];
  }
  return out.charAt(0).toUpperCase() + out.slice(1);
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    let outfit = Object.assign({}, DEFAULT_OUTFIT, s.outfit);
    Quiz.recent = s.recent;
    if (s.player) setPlayer(s.player);
    outfit = fitOutfit(outfit);
    return { outfit, owned: ownedFrom(s.owned, outfit), stars: s.stars | 0, coins: s.coins | 0, dust: s.dust | 0, pictures: !!s.pictures, looks: s.looks || {}, history: s.history || {}, books: s.books || {} };
  } catch (e) {
    return { looks: {}, outfit: Object.assign({}, DEFAULT_OUTFIT), owned: ownedFrom(null, DEFAULT_OUTFIT), stars: 0, coins: 0, dust: 0, pictures: false, history: {}, books: {} };
  }
}

// Presents she has collected, by slot. The starting outfit, "none" and
// whatever she is wearing (from before the wardrobe existed) always count.
function ownedFrom(saved, outfit) {
  const owned = {};
  for (const { slot } of WARDROBE) {
    const set = new Set((saved && saved[slot]) || []);
    set.add(DEFAULT_OUTFIT[slot]);
    // Boy-only starting clothes, so switching looks never leaves her bare.
    if (WARDROBE.find(w => w.slot === slot).items[DEFAULT_BOY_OUTFIT[slot]].boy) set.add(DEFAULT_BOY_OUTFIT[slot]);
    set.add(outfit[slot]);
    if (slot === 'head' || slot === 'hand' || slot === 'back' || slot === 'ride') set.add('none');
    owned[slot] = [...set];
  }
  return owned;
}
function save() {
  state.looks[state.worn] = state.outfit;
  const data = { outfit: state.outfit, looks: state.looks, owned: state.owned, stars: state.stars, coins: state.coins, dust: state.dust, pictures: state.pictures, recent: Quiz.recent, history: state.history, books: state.books, player: PLAYER };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
  if (typeof Account !== 'undefined') Account.push(data);
}

// ---- State ---------------------------------------------------------------

const saved = load();
const state = {
  answered: 0, // questions finished this visit, right or wrong
  outfit: saved.outfit,
  looks: saved.looks, // the outfit last worn as a girl and as a boy
  worn: PLAYER.look, // which of those state.outfit is
  owned: saved.owned,
  stars: saved.stars,
  coins: saved.coins,
  dust: saved.dust,  // fairy dust from the Fairy Village
  history: saved.history, // { questionId: { kind, tries, right, wrong, last } }
  books: saved.books, // reading log: { [bookId]: { read, quizRight, got } }
  pictures: saved.pictures,
  scenes: {},
  scene: null,
  hero: { c: 0, r: 0, path: [], flip: false, frame: 0, onArrive: null },
  cam: { x: 0, y: 0 },
  scale: 4,
  busy: false,       // a dialog, reward or scene change is showing
  question: null,
  particles: [],
  ripples: [],
  motes: [],
  lastWater: 0,
  timers: [],
  mounted: false,    // riding her unicorn right now
  parked: null,      // { sc, npc } where the unicorn waits when she is off it
  fairyAt: null,     // where her fairy friend is flying, in world pixels
};

function later(ms, fn) { state.timers.push(setTimeout(fn, ms)); }

function sceneFor(target) {
  if (!state.scenes[target]) {
    if (target === 'town') state.scenes[target] = buildTown();
    else if (target === 'castle') state.scenes[target] = buildCastleInterior();
    else if (target === 'castle2') state.scenes[target] = buildCastleUpstairs();
    else if (target === 'yuna') state.scenes[target] = buildYunaRoom();
    else if (target === 'forest') state.scenes[target] = buildForest();
    else if (target === 'unicorn') state.scenes[target] = buildUnicornVillage();
    else if (target === 'dungeon') state.scenes[target] = buildDungeon();
    else if (target === 'fairy') state.scenes[target] = buildFairyVillage();
    else state.scenes[target] = buildHouseInterior(TOWN_HOUSES.find(h => `house-${h.letter}` === target));
    // Back-to-front order for static objects; room walls go first.
    state.scenes[target].objects.sort((a, b) => (a.background ? -1 : 0) - (b.background ? -1 : 0) || (a.c0 + a.c1 + a.r0 + a.r1) - (b.c0 + b.c1 + b.r0 + b.r1));
  }
  return state.scenes[target];
}

function placeHero(c, r) {
  Object.assign(state.hero, { c, r, path: [], onArrive: null });
}

function snapCamera() {
  const t = cameraTarget();
  state.cam.x = t.x;
  state.cam.y = t.y;
}

// ---- Movement ------------------------------------------------------------

function heroTile() {
  const h = state.hero;
  return h.path.length ? h.path[0] : { c: Math.round(h.c), r: Math.round(h.r) };
}

// Walks to the nearest tile that satisfies goal(c, r), then calls onArrive.
function walkTo(goal, onArrive, allowBlockedGoal = false) {
  const h = state.hero;
  const from = heroTile();
  const path = findPath(state.scene, from, goal, allowBlockedGoal);
  if (!path) return false;
  // If she is between tiles, finish the current step before the new path.
  h.path = (h.path.length ? [h.path[0]] : []).concat(path);
  h.onArrive = onArrive || null;
  if (!h.path.length && onArrive) { h.onArrive = null; onArrive(); }
  return true;
}

function updateHero(dt) {
  const h = state.hero;
  if (!h.path.length) { h.frame = 0; return; }
  const next = h.path[0];
  const dc = next.c - h.c;
  const dr = next.r - h.r;
  const dist = Math.hypot(dc, dr);
  const step = (state.mounted ? 6.8 : 4.2) * dt;
  if (Math.abs(dc - dr) > 0.01) h.flip = dc - dr < 0;
  if (dist <= step) {
    h.c = next.c;
    h.r = next.r;
    h.path.shift();
    Sound.step();
    if (!h.path.length && h.onArrive) {
      const cb = h.onArrive;
      h.onArrive = null;
      cb();
    }
  } else {
    h.c += (dc / dist) * step;
    h.r += (dr / dist) * step;
  }
  h.frame = Math.floor(performance.now() / 160) % 2;
}

// ---- Scenes and doors ----------------------------------------------------

function changeScene(target, at, label) {
  state.busy = true;
  ui.fade.classList.add('on');
  later(320, () => {
    state.scene = sceneFor(target);
    document.body.classList.toggle('forest', state.scene.kind === 'forest');
    document.body.classList.toggle('unicorn', state.scene.kind === 'unicorn');
    document.body.classList.toggle('dungeon', state.scene.kind === 'dungeon');
    document.body.classList.toggle('fairy', state.scene.kind === 'fairy');
    state.fairyAt = null;
    const spot = at || state.scene.start;
    placeHero(spot.c, spot.r);
    // Her unicorn waits next to her whenever she steps outside on foot.
    if (!state.scene.outdoor) state.mounted = false;
    else if (!state.mounted) parkUnicorn();
    snapCamera();
    ui.fade.classList.remove('on');
    state.busy = false;
    showPlace(label);
  });
}

function showPlace(text) {
  if (!text) return;
  ui.place.textContent = text;
  ui.place.classList.remove('show');
  void ui.place.offsetWidth;
  ui.place.classList.add('show');
}

function enterDoor(door) {
  getOff();
  Sound.door();
  if (door.target === 'castle') {
    changeScene('castle', null, `🏰 ${titleKo()}님의 성`);
    Sound.say([{ text: line('castle'), pitch: 1.3 }]);
  } else {
    const info = door.obj.info;
    changeScene(door.target, null, `${info.letter}${info.letter.toLowerCase()} 집`);
    Sound.say([{ text: line('house', { letter: info.letter }) }, { pause: 300 }, letterSound(info)]);
  }
}

function leaveRoom() {
  const sc = state.scene;
  Sound.door();
  if (sc.house) {
    const h = sc.house;
    changeScene('town', { c: h.c + 1, r: h.r + 3 }, '🌸 소리 마을');
  } else {
    changeScene('town', { c: 19, r: 10 }, '🌸 소리 마을');
  }
}

// ---- Riding --------------------------------------------------------------

const hasUnicorn = () => state.outfit.ride !== 'none';

function removeParked() {
  const p = state.parked;
  if (p) p.sc.npcs = p.sc.npcs.filter(n => n !== p.npc);
  state.parked = null;
}

// Leaves the unicorn on a free tile next to her, away from doors and gates.
function parkUnicorn() {
  removeParked();
  const sc = state.scene;
  if (!hasUnicorn() || !sc.outdoor) return;
  const h = heroTile();
  const busy = (c, r) => sc.doors.some(d => d.c === c && d.r === r) || (sc.links || []).some(l => l.c === c && l.r === r);
  const path = findPath(sc, h, (c, r) => (c !== h.c || r !== h.r) && !busy(c, r));
  if (!path || !path.length) return;
  const spot = path[path.length - 1];
  const npc = { mount: true, name: '유니콘', c: spot.c, r: spot.r, flip: state.hero.flip, phase: 0 };
  sc.npcs.push(npc);
  state.parked = { sc, npc };
}

function getOn() {
  if (!hasUnicorn() || !state.scene.outdoor) return;
  removeParked();
  state.mounted = true;
  burstAtHero(24);
  Sound.correct();
  Sound.say([{ text: line('mount'), pitch: 1.3 }]);
  renderRide();
}

// Before going indoors, or when she taps the 🦄 button.
function getOff() {
  if (!state.mounted) return;
  state.mounted = false;
  parkUnicorn();
  showPlace('🦄 유니콘은 밖에서 기다려요');
  Sound.say([{ text: line('dismount'), pitch: 1.3 }]);
  renderRide();
}

function toggleRide() {
  Sound.tap();
  if (!hasUnicorn()) {
    const first = state.owned.ride.find(v => v !== 'none');
    if (!first) { showPlace('🦄 유니콘 마을에서 유니콘을 만나요'); return; }
    state.outfit = Object.assign({}, state.outfit, { ride: first });
    save();
  }
  if (!state.scene.outdoor) { showPlace('🏠 집 안에서는 유니콘을 탈 수 없어요'); return; }
  if (state.mounted) { getOff(); return; }
  const p = state.parked;
  if (p && p.sc === state.scene) {
    const isNext = (c, r) => Math.abs(c - p.npc.c) + Math.abs(r - p.npc.r) === 1;
    if (walkTo(isNext, getOn)) return;
  }
  getOn();
}

function renderRide() {
  const any = state.owned.ride.some(v => v !== 'none');
  ui.ride.classList.toggle('hidden', !any);
  ui.ride.classList.toggle('active', state.mounted);
}

// ---- Words ---------------------------------------------------------------

function rec(kind, name) {
  return `audio/${kind}/${name.toLowerCase()}.mp3`;
}
function letterSound(info) {
  return { text: `${info.sound}, ${info.sound}`, file: rec('letters', info.letter), rate: 0.7, narrator: true };
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// A random line from a list, avoiding the one used last time.
const lastLine = {};
function line(kind, vars = {}, list = LINES[kind]) {
  let text = pick(list);
  if (list.length > 1) while (text === lastLine[kind]) text = pick(list);
  lastLine[kind] = text;
  return fill(text, vars);
}
function fill(text, vars) {
  const title = TITLES[PLAYER.title].en;
  const own = { name: PLAYER.spoken, title, little: title.toLowerCase() };
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : own[k] !== undefined ? own[k] : m));
}

function voiceOf(npc) {
  if (!npc) return null;
  if (!npc.voice) npc.voice = Sound.profile(VOICES[npc.look], Math.floor(hash(npc.c, npc.r, 8) * 1000));
  return npc.voice;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- Dialog --------------------------------------------------------------

function talkTo(npc) {
  const isNext = (c, r) => Math.abs(c - npc.c) + Math.abs(r - npc.r) === 1;
  const ok = walkTo(isNext, () => openDialog(npc));
  if (!ok) openDialog(npc);
}

function faceEachOther(npc) {
  const h = state.hero;
  const dx = (npc.c - npc.r) - (h.c - h.r);
  if (dx !== 0) { h.flip = dx < 0; npc.flip = dx > 0; }
}

// After a wrong answer she has to answer someone else's question before
// this person asks theirs again.
const waiting = npc => npc.waitUntil > state.answered;

function openDialog(npc) {
  if (npc.caught) return;
  faceEachOther(npc);
  if (npc.shop) { openShop(npc); return; }
  state.busy = true;
  state.talking = npc;
  libraryDialog(npc);
  drawPortrait(ui.portrait, npc.unicorn ? unicornSprite(npc.unicorn, 0) : villagerSprite(npc.look, 0));
  ui.name.textContent = npc.name;
  if (waiting(npc)) {
    const not = line('later');
    ui.text.textContent = not;
    ui.clue.classList.add('hidden');
    ui.choices.innerHTML = '';
    ui.dialog.classList.remove('hidden');
    ui.reward.classList.add('hidden');
    Sound.say(not, voiceOf(npc));
    later(2800, () => { if (state.talking === npc && !state.question) closeDialog(); });
    return;
  }
  // The question she missed comes back, otherwise a new one.
  const q = npc.missed || Quiz.make(npc);
  npc.missed = null;
  q.done = false;
  state.question = q;
  if (q.review) ui.name.insertAdjacentHTML('beforeend', ' <span class="review-tag">복습</span>');
  const hello = line(`persona-${npc.look}`, {}, PERSONA[npc.look]);
  ui.text.textContent = `${hello} ${q.prompt}`;
  ui.clue.innerHTML = q.clue;
  ui.clue.classList.toggle('hidden', !q.clue);
  ui.choices.innerHTML = '';
  q.options.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'choice';
    b.innerHTML = `<span class="num">${i + 1}</span>${o.html}`;
    if (o.words) b.dataset.words = '1';
    b.classList.toggle('pictures', o.alwaysPictures || (o.words && state.pictures));
    b.addEventListener('click', () => choose(i, b));
    ui.choices.append(b);
  });
  ui.choices.classList.toggle('four', q.options.length > 3);
  ui.choices.classList.toggle('spell', !!q.tiles);
  if (q.tiles) renderSpell(q);
  ui.dialog.classList.remove('hidden');
  ui.reward.classList.add('hidden');
  const greet = [{ text: hello }, { pause: 400 }];
  const house = npc.letter && LETTERS.find(l => l.letter === npc.letter);
  if (house) greet.push({ text: `This is the ${npc.letter} house.` }, { pause: 250 }, letterSound(house), { pause: 500 });
  Sound.say(greet.concat(q.ask), voiceOf(npc));
  save();
}

function askAgain() {
  const q = state.question;
  if (q) Sound.say(q.replay, voiceOf(state.talking));
}

function choose(i, btn) {
  const q = state.question;
  if (!q || q.done || btn.disabled) return;
  const o = q.options[i];
  reviewRecord(q, o.right);
  if (o.right) {
    q.done = true;
    btn.classList.add('right');
    ui.choices.querySelectorAll('.choice').forEach(b => { b.disabled = true; });
    if (q.solved) ui.clue.innerHTML = q.solved;
    const praise = line('praise');
    ui.text.textContent = praise;
    Sound.correct();
    Sound.say([{ text: praise }, { pause: 300 }].concat(q.answer), voiceOf(state.talking));
    // Cave monsters pay in coins instead of a star and a present.
    if (state.talking.monster) { catchMonster(state.talking); return; }
    if (state.talking.level === 5) addDust();
    state.stars++;
    state.answered++;
    save();
    renderStars(true);
    burstAtHero(30);
    later(2600, () => offerReward(state.talking));
  } else {
    q.misses++;
    q.done = true;
    btn.classList.add('wrong');
    ui.choices.querySelectorAll('.choice').forEach(b => { b.disabled = true; });
    Sound.wrong();
    const npc = state.talking;
    state.answered++;
    npc.missed = q;
    npc.waitUntil = state.answered + 1;
    const retry = line('retry');
    // A misspelled word that isn't a real word has nothing to say back.
    const back = o.wrong ? [{ text: o.wrong, narrator: true, rate: 0.72 }, { pause: 300 }] : [];
    ui.text.textContent = o.wrong ? `${o.wrong}… ${retry}` : retry;
    Sound.say(back.concat({ text: retry }), voiceOf(npc));
    later(5200, () => { if (state.talking === npc) closeDialog(); });
  }
}

function closeDialog() {
  ui.dialog.classList.add('hidden');
  ui.reward.classList.add('hidden');
  state.busy = false;
  state.question = null;
  state.talking = null;
}

// ---- Rewards -------------------------------------------------------------

function itemLabel(slot, value) {
  const v = WARDROBE.find(w => w.slot === slot).items[value];
  return slot === 'dress' ? `${v.icon} ${v.name} ${isBoy() ? '옷' : '드레스'}` : `${v.icon} ${v.name}`;
}

// New presents first; once everything is collected, anything not being worn.
function rewardChoices(level) {
  const o = state.outfit;
  const fresh = [];
  const worn = [];
  for (const { slot, items } of WARDROBE) {
    for (const value of Object.keys(items)) {
      if (value === 'none' || value === o[slot]) continue;
      if (!suits(items[value])) continue;
      // The Fairy Village gives its fairies, then everyday presents.
      if (items[value].fairy && level !== 5) continue;
      if (items[value].forest && (level < 2 || level === 5)) continue;
      if (items[value].unicorn && (level < 3 || level === 5)) continue;
      if (items[value].shop) continue;
      const r = { slot, value, label: itemLabel(slot, value), isNew: !state.owned[slot].includes(value) };
      (r.isNew ? fresh : worn).push(r);
    }
  }
  // Forest folk, unicorns and fairies hand out their own treasures before anything else.
  const mark = level === 5 ? 'fairy' : level === 3 ? 'unicorn' : 'forest';
  const special = fresh.filter(r => WARDROBE.find(w => w.slot === r.slot).items[r.value][mark]);
  if (level >= 2 && special.length) return special;
  return fresh.length ? fresh : worn;
}

function collected() {
  let have = 0;
  let total = 0;
  for (const { slot, items } of WARDROBE) {
    for (const value of Object.keys(items)) {
      if (value === 'none' || items[value].shop || !suits(items[value])) continue;
      total++;
      if (state.owned[slot].includes(value)) have++;
    }
  }
  return { have, total };
}

function offerReward(npc) {
  // Pick a slot first so dress colours don't crowd out everything else.
  const all = rewardChoices((npc && npc.level) || 1);
  const slot = pick([...new Set(all.map(r => r.slot))]);
  // A unicorn that isn't hers yet would love to come along itself.
  const self = npc && npc.unicorn && all.find(r => r.slot === 'ride' && r.value === npc.unicorn && r.isNew);
  // Each fairy villager has a favourite little fairy to give first.
  const own = npc && npc.gives && all.find(r => r.slot === 'fairy' && r.value === npc.gives && r.isNew);
  const gift = self || own || pick(all.filter(r => r.slot === slot));
  state.gift = gift;
  if (gift.isNew) {
    state.owned[gift.slot].push(gift.value);
    save();
  }
  const next = Object.assign({}, state.outfit, { [gift.slot]: gift.value });
  ui.rewardTitle.textContent = `🎁 ${npc ? npc.name : ''}의 선물!`;
  const ride = gift.slot === 'ride';
  const fairy = gift.slot === 'fairy';
  ui.rewardName.textContent = !gift.isNew ? gift.label : ride || fairy ? `${gift.label} · 새 친구가 생겼어요!` : `${gift.label} · 옷장에 쏙!`;
  ui.rewardYes.textContent = ride ? '지금 탈래요 🦄' : fairy ? '같이 다닐래요 🧚' : '지금 입을래요 💖';
  ui.rewardNo.textContent = !gift.isNew ? '그대로 할래요' : ride ? '마구간에 둘래요 🏡' : fairy ? '꽃밭에 둘래요 🌷' : '옷장에 넣을래요 🎀';
  drawPortrait(ui.pvNow, heroPortrait(state.outfit, state.mounted));
  drawPortrait(ui.pvNew, heroPortrait(next, ride || state.mounted));
  ui.dialog.classList.add('hidden');
  ui.reward.classList.remove('hidden');
  Sound.party();
  state.giver = npc;
  Sound.say([{ pause: 600 }, { text: line(ride ? 'newUnicorn' : fairy ? 'newFairy' : 'gift') }], voiceOf(npc));
}

function acceptReward(yes) {
  if (yes && state.gift) {
    state.outfit = Object.assign({}, state.outfit, { [state.gift.slot]: state.gift.value });
    save();
    if (state.gift.slot === 'ride' && state.scene.outdoor) { removeParked(); state.mounted = true; }
    renderRide();
    burstAtHero(50);
    Sound.correct();
    Sound.say([{ text: line('yes') }], voiceOf(state.giver));
  } else {
    Sound.say([{ text: line('keep') }], voiceOf(state.giver));
  }
  state.gift = null;
  closeDialog();
}

function heroPortrait(outfit, riding) {
  const sprite = riding && outfit.ride !== 'none' ? riderSprite(outfit, 0, isBoy()) : heroSprite(outfit, 0);
  return withFairy(sprite, outfit, riding && outfit.ride !== 'none');
}

function drawPortrait(cv, sprite) {
  const ctx = cv.getContext('2d');
  cv.width = sprite.canvas.width;
  cv.height = sprite.canvas.height;
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.drawImage(sprite.canvas, 0, 0);
}

function renderStars(pop) {
  ui.stars.querySelector('.count').textContent = state.stars;
  if (pop) {
    ui.stars.classList.remove('pop');
    void ui.stars.offsetWidth;
    ui.stars.classList.add('pop');
  }
  renderCoins(false);
  renderDust(false);
}

function followLink(link) {
  Sound.door();
  if (link.target === 'yuna') {
    changeScene('yuna', null, `🎀 ${PLAYER.shown}의 방`);
    Sound.say([{ text: line('room') }]);
  } else if (link.target === 'forest') {
    changeScene('forest', link.at, '🌲 별빛 숲 마을');
    Sound.say([{ text: line('forest'), pitch: 1.3 }]);
  } else if (link.target === 'unicorn') {
    changeScene('unicorn', link.at, '🦄 유니콘 마을');
    Sound.say([{ text: line('unicorn'), pitch: 1.3 }]);
  } else if (link.target === 'dungeon') {
    getOff();
    respawnMonsters(sceneFor('dungeon'));
    changeScene('dungeon', link.at, '💎 반짝 동굴');
    Sound.say([{ text: line('dungeon'), pitch: 1.3 }]);
  } else if (link.target === 'fairy') {
    changeScene('fairy', link.at, '🧚 요정 마을');
    Sound.say([{ text: line('fairyland'), pitch: 1.3 }]);
  } else if (link.target === 'town') {
    changeScene('town', link.at, '🌸 소리 마을');
  } else if (link.target === 'castle2') {
    changeScene('castle2', link.at, '📚 성 2층');
    Sound.say([{ text: line('upstairs'), pitch: 1.3 }]);
  } else {
    changeScene(link.target, link.at, `🏰 ${titleKo()}님의 성`);
  }
}

// ---- Wardrobe ------------------------------------------------------------

function openWardrobe() {
  state.busy = true;
  renderWardrobe();
  ui.wardrobe.classList.remove('hidden');
  Sound.say([{ text: line('dressup'), pitch: 1.3 }]);
}

function renderWardrobe() {
  drawPortrait(ui.wdPreview, heroPortrait(state.outfit, true));
  const { have, total } = collected();
  ui.wdCount.textContent = `모은 선물 ${have} / ${total}`;
  ui.wdSlots.innerHTML = '';
  for (const { slot, title, items } of WARDROBE) {
    const boyTitle = { dress: '옷 색', shape: '옷 모양' }[slot];
    const row = document.createElement('div');
    row.className = 'wd-row';
    const h = document.createElement('div');
    h.className = 'wd-title';
    h.textContent = (isBoy() && boyTitle) || title;
    const chips = document.createElement('div');
    chips.className = 'wd-chips';
    for (const [value, item] of Object.entries(items)) {
      if (!suits(item)) continue;
      const owned = state.owned[slot].includes(value);
      const b = document.createElement('button');
      b.className = 'chip';
      b.classList.toggle('on', state.outfit[slot] === value);
      b.disabled = !owned;
      if (!owned) b.innerHTML = '<span class="ic">❓</span>';
      else if (item.c && slot === 'dress') b.innerHTML = `<span class="sw" style="background:${item.c[0]}"></span><span class="nm">${item.name}</span>`;
      else if (item.c) b.innerHTML = `<span class="sw" style="background:${item.c[0]}"></span><span class="nm">${item.name.replace(' 머리', '')}</span>`;
      else b.innerHTML = `<span class="ic">${item.icon || '✖️'}</span><span class="nm">${item.name}</span>`;
      b.addEventListener('click', () => {
        if (state.outfit[slot] === value) return;
        state.outfit = Object.assign({}, state.outfit, { [slot]: value });
        save();
        if (slot === 'ride' && value === 'none') { removeParked(); state.mounted = false; }
        Sound.tap();
        burstAtHero(16);
        renderWardrobe();
      });
      chips.append(b);
    }
    row.append(h, chips);
    ui.wdSlots.append(row);
  }
}

function closeWardrobe() {
  ui.wardrobe.classList.add('hidden');
  state.busy = false;
  burstAtHero(40);
  Sound.correct();
  Sound.say([{ text: line('yes'), pitch: 1.3 }]);
}

// ---- Crystal Cave monsters -------------------------------------------------

function renderCoins(pop) {
  ui.coins.querySelector('.count').textContent = state.coins;
  // The coin purse shows up once the cave is open or she has coins.
  ui.coins.classList.toggle('hidden', !state.coins && state.stars < DUNGEON_STARS);
  if (pop) {
    ui.coins.classList.remove('pop');
    void ui.coins.offsetWidth;
    ui.coins.classList.add('pop');
  }
}

// A right answer catches the monster: after the praise it goes poof,
// leaves coins and comes back a while later.
function catchMonster(npc) {
  state.answered++;
  npc.caught = true;
  const coins = 1 + Math.floor(Math.random() * npc.coins);
  later(2400, () => {
    const sc = sceneFor('dungeon');
    if (state.talking === npc) closeDialog();
    if (state.scene === sc) poofAt(tileCenter(sc, npc.c, npc.r));
    sc.npcs = sc.npcs.filter(n => n !== npc);
    sc.caught.push(npc);
    const catchNo = npc.catches = (npc.catches || 0) + 1;
    later(MONSTER_RESPAWN_MS, () => { if (npc.catches === catchNo) respawnMonster(sc, npc); });
    state.coins += coins;
    save();
    renderCoins(true);
    Sound.party();
    showPlace(`🪙 코인 ${coins}개!`);
    Sound.say([{ text: line('caught') }], voiceOf(npc));
  });
}

// A puff of cloud with coins bouncing out of it.
function poofAt(p) {
  const colors = ['#ffffff', '#e4d8ff', '#ffd34d', '#ffe680', '#bfefff'];
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 15 + Math.random() * 55;
    state.particles.push({ x: p.x, y: p.y - 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 50, life: 0.8 + Math.random() * 0.8, color: colors[i % colors.length], star: i % 2 === 0 });
  }
}

// Puts a caught monster back at home, unless someone is standing there.
function respawnMonster(sc, npc) {
  if (!sc.caught.includes(npc)) return;
  const here = state.scene === sc && heroTile();
  if ((here && here.c === npc.home.c && here.r === npc.home.r) || sc.npcs.some(n => n.c === npc.home.c && n.r === npc.home.r)) {
    later(5000, () => respawnMonster(sc, npc));
    return;
  }
  sc.caught = sc.caught.filter(n => n !== npc);
  Object.assign(npc, npc.home, { caught: false, missed: null });
  sc.npcs.push(npc);
  if (state.scene === sc) poofAt(tileCenter(sc, npc.c, npc.r));
}

// Every monster is back whenever she walks into the cave.
function respawnMonsters(sc) {
  for (const npc of sc.caught.slice()) respawnMonster(sc, npc);
}

// ---- Shop ----------------------------------------------------------------

// Prices in coins. Shop treasures carry their own price.
function shopPrice(slot, item) {
  if (item.price) return item.price;
  if (item.unicorn) return 12;
  if (item.forest) return 8;
  return slot === 'head' || slot === 'hand' ? 6 : 4;
}

// Everything she doesn't own yet, shop treasures first.
function shopItems() {
  const list = [];
  for (const { slot, items } of WARDROBE) {
    for (const [value, item] of Object.entries(items)) {
      if (value === 'none' || !suits(item) || state.owned[slot].includes(value)) continue;
      list.push({ slot, value, item, label: itemLabel(slot, value), price: shopPrice(slot, item) });
    }
  }
  return list.sort((a, b) => (b.item.shop ? 1 : 0) - (a.item.shop ? 1 : 0));
}

function openShop(npc) {
  state.busy = true;
  state.shopkeeper = npc;
  const items = shopItems();
  state.shopPick = items[0] || null;
  ui.shopMsg.textContent = items.length ? '갖고 싶은 걸 골라 보세요!' : '와! 벌써 다 모았어요 ✨';
  renderShop();
  ui.shop.classList.remove('hidden');
  const hello = line(`persona-${npc.look}`, {}, PERSONA[npc.look]);
  Sound.say([{ text: hello }, { pause: 300 }, { text: line(items.length ? 'shop' : 'soldOut') }], voiceOf(npc));
}

function renderShop() {
  const pick = state.shopPick;
  ui.shopCoins.textContent = `🪙 ${state.coins}`;
  const next = pick ? Object.assign({}, state.outfit, { [pick.slot]: pick.value }) : state.outfit;
  drawPortrait(ui.shopPreview, heroPortrait(next, true));
  ui.shopItems.innerHTML = '';
  for (const it of shopItems()) {
    const b = document.createElement('button');
    b.className = 'chip shop-item';
    b.classList.toggle('on', !!pick && pick.slot === it.slot && pick.value === it.value);
    b.classList.toggle('dear', it.price > state.coins);
    const look = it.item.c ? `<span class="sw" style="background:${it.item.c[0]}"></span>` : `<span class="ic">${it.item.icon}</span>`;
    b.innerHTML = `${look}<span class="nm">${it.label.replace(/^\S+ /, '')}</span><span class="price"><span class="coin">🪙</span>${it.price}</span>`;
    b.addEventListener('click', () => {
      Sound.tap();
      state.shopPick = it;
      ui.shopMsg.textContent = it.item.shop ? '✨ 상점에만 있는 보물이에요!' : '갖고 싶은 걸 골라 보세요!';
      renderShop();
    });
    ui.shopItems.append(b);
  }
  ui.shopBuy.classList.toggle('hidden', !pick);
  if (pick) ui.shopBuy.textContent = `🪙 ${pick.price}개로 살래요`;
}

function buyPick() {
  const pick = state.shopPick;
  const npc = state.shopkeeper;
  if (!pick) return;
  if (state.coins < pick.price) {
    Sound.wrong();
    ui.shopMsg.textContent = `코인이 ${pick.price - state.coins}개 더 필요해요. 반짝 동굴에서 몬스터를 잡아 봐요! 💎`;
    Sound.say([{ text: line('poor') }], voiceOf(npc));
    return;
  }
  state.coins -= pick.price;
  state.owned[pick.slot].push(pick.value);
  save();
  renderCoins(true);
  ui.shop.classList.add('hidden');
  // The same "wear it now?" card as a present.
  const ride = pick.slot === 'ride';
  const fairy = pick.slot === 'fairy';
  state.gift = { slot: pick.slot, value: pick.value, label: pick.label, isNew: true };
  state.giver = npc;
  ui.rewardTitle.textContent = '🛍️ 샀어요!';
  ui.rewardName.textContent = ride || fairy ? `${pick.label} · 새 친구가 생겼어요!` : `${pick.label} · 옷장에 쏙!`;
  ui.rewardYes.textContent = ride ? '지금 탈래요 🦄' : fairy ? '같이 다닐래요 🧚' : '지금 입을래요 💖';
  ui.rewardNo.textContent = ride ? '마구간에 둘래요 🏡' : fairy ? '꽃밭에 둘래요 🌷' : '옷장에 넣을래요 🎀';
  drawPortrait(ui.pvNow, heroPortrait(state.outfit, state.mounted));
  drawPortrait(ui.pvNew, heroPortrait(Object.assign({}, state.outfit, { [pick.slot]: pick.value }), ride || state.mounted));
  ui.reward.classList.remove('hidden');
  Sound.party();
  burstAtHero(30);
  Sound.say([{ pause: 400 }, { text: line('bought') }], voiceOf(npc));
}

function closeShop() {
  ui.shop.classList.add('hidden');
  state.busy = false;
  state.shopkeeper = null;
}

// ---- Fairy Village -------------------------------------------------------

// Spelling questions: letter tiles under the blanks, and an erase key.
// Each tap fills the next blank and says the letter's sound; when every
// blank is full the word is checked like any other answer (see choose).
function renderSpell(q) {
  q.picked = [];
  q.checking = false;
  q.options = [];
  ui.choices.innerHTML = '';
  q.tiles.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'choice tile';
    b.innerHTML = `<span class="letter">${t.l}</span>`;
    b.addEventListener('click', () => spellTap(i));
    ui.choices.append(b);
  });
  const erase = document.createElement('button');
  erase.className = 'erase';
  erase.title = '지움';
  erase.innerHTML = '<span class="ic">⌫</span><span>지움</span>';
  erase.addEventListener('click', spellErase);
  ui.choices.append(erase);
  showSpelled(q);
}

function showSpelled(q) {
  ui.clue.querySelectorAll('.spell-word .slot').forEach((s, i) => {
    const t = q.tiles[q.picked[i]];
    s.textContent = t ? t.l : '';
    s.classList.toggle('full', !!t);
    s.classList.toggle('next', !q.done && i === q.picked.length);
  });
  ui.choices.querySelectorAll('.tile').forEach((b, i) => { b.disabled = q.done || q.picked.includes(i); });
  const erase = ui.choices.querySelector('.erase');
  if (erase) erase.disabled = q.done || q.checking || !q.picked.length;
}

function spellTap(i) {
  const q = state.question;
  if (!q || !q.tiles || q.done || q.checking || q.picked.includes(i)) return;
  q.picked.push(i);
  Sound.tap();
  Sound.say([{ text: q.tiles[i].sound, narrator: true, rate: 0.8 }]);
  if (q.picked.length === q.word.length) {
    // A moment to see the last letter before the answer.
    q.checking = true;
    later(700, () => checkSpell(q));
  }
  showSpelled(q);
}

function spellErase() {
  const q = state.question;
  if (!q || !q.tiles || q.done || q.checking || !q.picked.length) return;
  q.picked.pop();
  Sound.tap();
  showSpelled(q);
}

function checkSpell(q) {
  if (state.question !== q || q.done) return;
  q.checking = false;
  const spelled = q.picked.map(i => q.tiles[i].l).join('');
  q.options = [{ right: true }, { right: false, wrong: q.isWord(spelled) ? spelled : '' }];
  choose(spelled === q.word ? 0 : 1, ui.clue.querySelector('.spell-word'));
  q.options = [];
  showSpelled(q);
}

// Typing works too: a letter key taps its tile, Backspace erases.
function spellKey(key) {
  const q = state.question;
  if (key === 'Backspace') { spellErase(); return; }
  if (!/^[a-z]$/i.test(key)) return;
  const i = q.tiles.findIndex((t, j) => t.l === key.toLowerCase() && !q.picked.includes(j));
  if (i >= 0) spellTap(i);
}

// Fairy dust: a little for every right answer here. What it is for is not
// decided yet; it is counted, shown and saved.
function addDust() {
  const [lo, hi] = FAIRY_DUST;
  const n = lo + Math.floor(Math.random() * (hi - lo + 1));
  state.dust += n;
  renderDust(true);
  showPlace(`✨ 요정의 가루 ${n}개!`);
}

function renderDust(pop) {
  ui.dust.querySelector('.count').textContent = state.dust;
  // The dust jar shows up once the Fairy Village is open or she has some.
  ui.dust.classList.toggle('hidden', !state.dust && state.stars < FAIRY_STARS);
  if (pop) {
    ui.dust.classList.remove('pop');
    void ui.dust.offsetWidth;
    ui.dust.classList.add('pop');
  }
}

// Portraits get room above the head for a fairy friend once she has one,
// so "now" and "after" previews stay the same size.
const FAIRY_ROOM = 13;
function withFairy(sprite, outfit, riding) {
  if (!state.owned.fairy.some(v => v !== 'none')) return sprite;
  const cv = makeCanvas(sprite.canvas.width, sprite.canvas.height + FAIRY_ROOM);
  const ctx = cv.getContext('2d');
  ctx.drawImage(sprite.canvas, 0, FAIRY_ROOM);
  if (FAIRIES[outfit.fairy] && outfit.fairy !== 'none') {
    const f = fairySprite(outfit.fairy, 0);
    ctx.drawImage(f.canvas, (riding ? 15 : 13) - f.ax, riding ? 7 : 1);
  }
  return { canvas: cv, ax: sprite.ax, ay: sprite.ay + FAIRY_ROOM };
}

// Her fairy floats above her head, a little behind her, bobbing and
// trailing after her when she moves. `p` is the hero's ground point.
function drawFairyFriend(p, riding, now) {
  const key = state.outfit.fairy;
  if (!FAIRIES[key] || key === 'none') return;
  const h = state.hero;
  const goal = { x: p.x + (h.flip ? 7 : -7), y: p.y - (riding ? 41 : 39) + Math.sin(now / 320) * 2 };
  const f = state.fairyAt || (state.fairyAt = { x: goal.x, y: goal.y, t: now });
  const k = Math.min(1, Math.max(0, now - f.t) / 1000 * 4);
  f.t = now;
  f.x += (goal.x - f.x) * k;
  f.y += (goal.y - f.y) * k;
  const sprite = fairySprite(key, Math.floor(now / 110) % 2);
  drawFlying(vctx, sprite, f.x, f.y, h.flip);
  // A trail of sparkles while she is catching up.
  if (Math.hypot(goal.x - f.x, goal.y - f.y) > 2 && Math.random() < 0.35) {
    state.particles.push({ x: f.x + (Math.random() - 0.5) * 4, y: f.y + 3, vx: (Math.random() - 0.5) * 10, vy: -10, life: 0.6, color: FAIRIES[key].glow, star: Math.random() < 0.3 });
  }
}

// Soft light around her fairy, and twinkles in the air of the Fairy Village.
function drawFairyGlows(now) {
  const s = state.scale;
  const ctx = sctx;
  ctx.globalCompositeOperation = 'lighter';
  const f = state.fairyAt;
  if (f && FAIRIES[state.outfit.fairy] && state.outfit.fairy !== 'none') {
    const p = toScreen(f.x, f.y);
    const r = (11 + Math.sin(now / 250) * 1.5) * s;
    ctx.globalAlpha = 0.2;
    ctx.drawImage(glow(), p.x - r, p.y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  if (state.scene.kind === 'fairy') {
    const cols = ['#ffffff', '#ffd0ec', '#fff2a8', '#d8c8ff', '#c8f4ff'];
    state.motes.forEach((m, i) => {
      const tw = Math.sin(now / 380 + m.ph * 3);
      if (tw < 0.2) return;
      const x = ((m.x * 1.7 + 0.31) % 1) * screen.width;
      const y = ((m.y * 1.3 + 0.17) % 1) * screen.height;
      const z = Math.round(s * (1 + tw * (m.s > 0.9 ? 2 : 1)));
      ctx.globalAlpha = tw;
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(x - z / 2, y - z * 1.5, z, z * 3);
      ctx.fillRect(x - z * 1.5, y - z / 2, z * 3, z);
    });
  }
  ctx.globalAlpha = 1;
}

// ---- Effects -------------------------------------------------------------

function heroWorld() {
  return tileCenter(state.scene, state.hero.c, state.hero.r);
}

function burstAtHero(count) {
  const p = heroWorld();
  const colors = ['#ff6fa8', '#ffd34d', '#9fd0ff', '#c7a4ff', '#ffffff', '#9be88a'];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 20 + Math.random() * 60;
    state.particles.push({ x: p.x, y: p.y - 16, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 1 + Math.random() * 0.7, color: colors[i % colors.length], star: i % 3 === 0 });
  }
}

function updateEffects(dt, now) {
  for (const p of state.particles) {
    p.vy += 90 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter(p => p.life > 0);
  state.ripples = state.ripples.filter(r => now - r.t0 < 500);
  // Floating light motes, the soft dust of light that fills the air.
  while (state.motes.length < 46) {
    state.motes.push({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.9, ph: Math.random() * 6, sp: 0.01 + Math.random() * 0.02 });
  }
  for (const m of state.motes) {
    m.y -= m.sp * dt;
    m.x += Math.sin(now / 1800 + m.ph) * 0.004 * dt;
    if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
  }
}

// ---- Camera and view -----------------------------------------------------

function cameraTarget() {
  const sc = state.scene;
  const p = heroWorld();
  const vw = view.width;
  const vh = view.height;
  let x = p.x - vw / 2;
  let y = p.y - vh * 0.55;
  x = sc.width <= vw ? (sc.width - vw) / 2 : Math.max(0, Math.min(sc.width - vw, x));
  y = sc.height <= vh ? (sc.height - vh) / 2 : Math.max(0, Math.min(sc.height - vh, y));
  return { x, y };
}

// The canvas fills whatever the browser actually shows. On iPad, 100vh is
// taller than the visible area while the toolbar is up, which stretched the
// picture and made taps land below the finger, so measure the element.
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const box = screen.getBoundingClientRect();
  screen.width = Math.round(box.width * dpr);
  screen.height = Math.round(box.height * dpr);
  // Integer zoom keeps the pixels square; aim for ~270 world pixels tall.
  state.scale = Math.max(2, Math.round(Math.min(screen.height / 270, screen.width / 300)));
  view.width = Math.ceil(screen.width / state.scale);
  view.height = Math.ceil(screen.height / state.scale);
  if (state.scene) snapCamera();
}

function toScreen(wx, wy) {
  return { x: (wx - Math.round(state.cam.x)) * state.scale, y: (wy - Math.round(state.cam.y)) * state.scale };
}

// ---- Drawing -------------------------------------------------------------

const heroBox = { w: 22, h: 34 };

function overlaps(o, x, y, w, h) {
  return o.x < x + w && o.x + o.w > x && o.y < y + h && o.y + o.h > y;
}

function drawScene(now) {
  const sc = state.scene;
  const t = now / 1000;
  const cx = Math.round(state.cam.x);
  const cy = Math.round(state.cam.y);
  vctx.setTransform(1, 0, 0, 1, 0, 0);
  vctx.clearRect(0, 0, view.width, view.height);
  vctx.setTransform(1, 0, 0, 1, -cx, -cy);
  vctx.drawImage(sc.ground, 0, 0);

  if (sc.water.length) {
    if (now - state.lastWater > 120 || state.lastWaterScene !== sc) {
      const w = sc.waterLayer.getContext('2d');
      w.clearRect(0, 0, sc.waterLayer.width, sc.waterLayer.height);
      for (const { c, r } of sc.water) {
        const o = tileOrigin(sc, c, r);
        drawWaterTile(w, o.x, o.y, c, r, t);
      }
      state.lastWater = now;
      state.lastWaterScene = sc;
    }
    vctx.drawImage(sc.waterLayer, 0, 0);
  }

  // Drifting cloud shadows outdoors.
  if (sc.kind === 'town') {
    vctx.fillStyle = 'rgba(70,60,120,0.07)';
    for (let i = 0; i < 4; i++) {
      const x = ((t * 6 + i * 420) % (sc.width + 400)) - 200;
      const y = 200 + i * 160 + Math.sin(t * 0.1 + i) * 30;
      vctx.beginPath();
      vctx.ellipse(x, y, 120, 46, 0, 0, Math.PI * 2);
      vctx.fill();
    }
  }

  // Depth-sorted objects and characters.
  const vx = cx - 40;
  const vy = cy - 40;
  const vw = view.width + 80;
  const vh = view.height + 80;
  const list = sc.objects.filter(o => overlaps(o, vx, vy, vw, vh));
  const chars = sc.npcs.map(n => ({ isChar: true, npc: n, c: n.c, r: n.r }));
  chars.push({ isChar: true, hero: true, c: state.hero.c, r: state.hero.r });
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

  // Anything drawn over the princess fades so she never gets lost behind a house.
  const hp = heroWorld();
  const hx = hp.x - heroBox.w / 2;
  const hy = hp.y - heroBox.h;
  let heroDrawn = false;
  for (const o of list) {
    if (o.isChar) {
      drawCharacter(o, now);
      if (o.hero) heroDrawn = true;
      continue;
    }
    const over = heroDrawn && !o.background && overlaps(o, hx, hy, heroBox.w, heroBox.h) && (!o.canvas || hitObject(o, hp.x, hp.y - 14) || hitObject(o, hp.x, hp.y - 4));
    o.fade = Math.max(0.45, Math.min(1, (o.fade || 1) + (over ? -0.08 : 0.08)));
    vctx.globalAlpha = o.fade;
    if (o.animated) o.animated(vctx, t);
    else vctx.drawImage(o.canvas, o.x, o.y);
    vctx.globalAlpha = 1;
  }

  // Evening light in the forest; glows are added on top afterwards.
  if (sc.kind === 'forest' || sc.kind === 'dungeon') {
    vctx.setTransform(1, 0, 0, 1, 0, 0);
    vctx.fillStyle = sc.kind === 'dungeon' ? 'rgba(40,30,120,0.16)' : 'rgba(50,40,130,0.22)';
    vctx.fillRect(0, 0, view.width, view.height);
  }
}

function drawCharacter(ch, now) {
  const sc = state.scene;
  const p = tileCenter(sc, ch.c, ch.r);
  if (ch.hero) {
    const h = state.hero;
    const bob = h.path.length ? (h.frame ? -1 : 0) : 0;
    const riding = state.mounted && hasUnicorn();
    drawSprite(vctx, riding ? riderSprite(state.outfit, h.frame, isBoy()) : heroSprite(state.outfit, h.frame), p.x, p.y + 1 + bob, h.flip);
    drawFairyFriend(p, riding, now);
  } else {
    const n = ch.npc;
    const idle = Math.sin(now / 400 + n.phase) > 0.6 ? -1 : 0;
    const uni = n.mount ? state.outfit.ride : n.unicorn;
    if (uni && uni !== 'none') drawSprite(vctx, unicornSprite(uni, 0), p.x, p.y + 1 + idle, n.flip);
    else if (!n.mount) drawSprite(vctx, villagerSprite(n.look, 0), p.x, p.y + 1 + idle, n.flip);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

let glowSprite = null;
function glow() {
  if (glowSprite) return glowSprite;
  glowSprite = makeCanvas(64, 64);
  const g = glowSprite.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,250,220,1)');
  grad.addColorStop(0.3, 'rgba(255,230,200,0.5)');
  grad.addColorStop(1, 'rgba(255,220,200,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return glowSprite;
}

let fireflySprite = null;
function firefly() {
  if (fireflySprite) return fireflySprite;
  fireflySprite = makeCanvas(64, 64);
  const g = fireflySprite.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(240,255,190,1)');
  grad.addColorStop(0.25, 'rgba(190,255,150,0.6)');
  grad.addColorStop(1, 'rgba(150,255,200,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return fireflySprite;
}

function drawOverlay(now) {
  const sc = state.scene;
  const s = state.scale;
  const ctx = sctx;
  const font = '"Baloo 2", "Trebuchet MS", sans-serif';

  // Lamp and window glows.
  ctx.globalCompositeOperation = 'lighter';
  for (const l of sc.lamps) {
    const p = toScreen(l.x, l.y);
    const r = ((l.small ? 7 : l.big ? 46 : 18) + Math.sin(now / 300 + l.x) * 1.5) * s;
    ctx.globalAlpha = l.small ? 0.3 + 0.15 * Math.sin(now / 600 + l.x * 3) : 0.35;
    ctx.drawImage(glow(), p.x - r, p.y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // House signs and room posters.
  for (const sg of sc.signs) {
    const p = toScreen(sg.x, sg.y);
    if (p.x < -200 || p.y < -200 || p.x > screen.width + 200 || p.y > screen.height + 200) continue;
    const fs = (sg.big ? 22 : 11) * s;
    ctx.font = `800 ${fs}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (!sg.plain) {
      const text = sg.needStars && state.stars < sg.needStars ? `${sg.text} 🔒 ⭐${state.stars}/${sg.needStars}` : sg.text;
      const w = ctx.measureText(text).width + 8 * s;
      const h = 14 * s;
      ctx.strokeStyle = '#6f4430';
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.moveTo(p.x - w / 3, p.y - h / 2);
      ctx.lineTo(p.x - w / 3, p.y - h / 2 - 4 * s);
      ctx.moveTo(p.x + w / 3, p.y - h / 2);
      ctx.lineTo(p.x + w / 3, p.y - h / 2 - 4 * s);
      ctx.stroke();
      ctx.fillStyle = '#fff4e0';
      ctx.strokeStyle = sg.color;
      ctx.lineWidth = 1.5 * s;
      roundRect(ctx, p.x - w / 2, p.y - h / 2, w, h, 3 * s);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = shade(sg.color, -60);
    ctx.fillText(sg.needStars && state.stars < sg.needStars ? `${sg.text} 🔒 ⭐${state.stars}/${sg.needStars}` : sg.text, p.x, p.y + 0.5 * s);
  }
  for (const d of sc.decor) {
    const p = toScreen(d.x, d.y);
    ctx.fillStyle = '#b07a50';
    ctx.fillRect(p.x - 9 * s, p.y - 9 * s, 18 * s, 18 * s);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(p.x - 7.5 * s, p.y - 7.5 * s, 15 * s, 15 * s);
    ctx.font = `${10 * s}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.emoji, p.x, p.y + s);
  }

  // Speech bubbles over villagers so she knows who to visit.
  if (!state.busy) {
    for (const n of sc.npcs) {
      if (n.mount) continue;
      const w = tileCenter(sc, n.c, n.r);
      const p = toScreen(w.x, w.y - 40 + Math.sin(now / 300 + n.phase) * 1.5);
      const wait = waiting(n);
      ctx.fillStyle = wait ? '#e4dce8' : '#ffffff';
      ctx.strokeStyle = '#4a2c4f';
      ctx.lineWidth = s * 0.8;
      roundRect(ctx, p.x - 7 * s, p.y - 5 * s, 14 * s, 10 * s, 4 * s);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x - 2 * s, p.y + 5 * s - 1);
      ctx.lineTo(p.x, p.y + 8 * s);
      ctx.lineTo(p.x + 2 * s, p.y + 5 * s - 1);
      ctx.fill();
      ctx.fillStyle = wait ? '#9a8aa3' : '#ff6fa8';
      ctx.font = `800 ${7 * s}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(wait ? '…' : n.badge ? n.badge : n.letter ? n.letter : n.level === 3 ? '♥' : n.level === 2 ? '★' : '♪', p.x, p.y + 0.5 * s);
    }
  }

  // Ways out of the scene glow softly, with arrows or a lock.
  if (!state.busy) drawExitHints(now);
  drawFairyGlows(now);

  // Tap ripples.
  for (const r of state.ripples) {
    const k = (now - r.t0) / 500;
    ctx.strokeStyle = `rgba(255,255,255,${1 - k})`;
    ctx.lineWidth = 2 * s * (1 - k) + 1;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, (4 + k * 10) * s, (2 + k * 5) * s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Sparkles.
  for (const p of state.particles) {
    const q = toScreen(p.x, p.y);
    ctx.globalAlpha = Math.min(1, p.life * 1.5);
    ctx.fillStyle = p.color;
    const z = (p.star ? 2 : 1.5) * s;
    if (p.star) {
      ctx.fillRect(q.x - z / 2, q.y - z * 1.5, z, z * 3);
      ctx.fillRect(q.x - z * 1.5, q.y - z / 2, z * 3, z);
    } else ctx.fillRect(q.x, q.y, z, z);
  }
  ctx.globalAlpha = 1;

  // Light motes.
  ctx.globalCompositeOperation = 'lighter';
  const forest = sc.kind === 'forest' || sc.kind === 'dungeon';
  for (const m of state.motes) {
    const r = (3 + m.s * 5) * s * (0.8 + 0.2 * Math.sin(now / 500 + m.ph)) * (forest ? 0.7 : 1);
    ctx.globalAlpha = (forest ? 0.45 : 0.18) + 0.12 * Math.sin(now / (forest ? 300 : 700) + m.ph);
    ctx.drawImage(forest ? firefly() : glow(), m.x * screen.width - r, m.y * screen.height - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

// Each way out of a scene: links to other scenes plus a room's exit mat.
// Neighbouring link tiles with the same target share one hint. A link may
// set `style` ('gate', 'door' or 'mat'; outdoors defaults to 'gate') and
// `dir` ({ dc, dr }, the way the arrows point; defaults to off the map edge).
function exitSpots(sc) {
  if (sc.exitSpots) return sc.exitSpots;
  const spots = [];
  for (const l of sc.links || []) {
    const style = l.style || (sc.outdoor ? 'gate' : 'mat');
    const near = s => s.link && s.link.target === l.target && s.style === style && s.tiles.some(t => Math.abs(t.c - l.c) + Math.abs(t.r - l.r) === 1);
    const spot = spots.find(near);
    if (spot) spot.tiles.push(l);
    else spots.push({ link: l, style, tiles: [l] });
  }
  const exits = sc.exitTiles || (sc.exit ? [sc.exit] : []);
  if (exits.length) spots.push({ link: null, style: 'mat', tiles: exits });
  for (const sp of spots) {
    sp.c = sp.tiles.reduce((a, t) => a + t.c, 0) / sp.tiles.length;
    sp.r = sp.tiles.reduce((a, t) => a + t.r, 0) / sp.tiles.length;
    const t = sp.tiles[0];
    sp.dir = (sp.link && sp.link.dir) ||
      (t.r === sc.D - 1 ? { dc: 0, dr: 1 } : t.c === sc.W - 1 ? { dc: 1, dr: 0 } :
        t.r === 0 ? { dc: 0, dr: -1 } : t.c === 0 ? { dc: -1, dr: 0 } : null);
  }
  sc.exitSpots = spots;
  return spots;
}

function drawExitHints(now) {
  const sc = state.scene;
  const s = state.scale;
  const ctx = sctx;
  for (const sp of exitSpots(sc)) {
    const w = tileCenter(sc, sp.c, sp.r);
    const p = toScreen(w.x, w.y);
    if (p.x < -100 || p.y < -100 || p.x > screen.width + 100 || p.y > screen.height + 100) continue;
    const locked = sp.link && sp.link.needStars && state.stars < sp.link.needStars;
    const pulse = 0.5 + 0.5 * Math.sin(now / 450);

    // Soft glow on the ground, and on the door itself for wall doors.
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = locked ? 0.12 : 0.22 + 0.18 * pulse;
    const rx = (sp.tiles.length > 1 ? 30 : 20) * s;
    ctx.drawImage(glow(), p.x - rx, p.y - rx / 2, rx * 2, rx);
    if (sp.link && sp.link.door) {
      const d = toScreen(sp.link.door.x, sp.link.door.y);
      ctx.globalAlpha = 0.2 + 0.2 * pulse;
      ctx.drawImage(glow(), d.x - 22 * s, d.y - 34 * s, 44 * s, 68 * s);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (locked) drawPadlock(ctx, p.x, p.y - (sp.style === 'gate' ? 14 : 10) * s + Math.sin(now / 400) * 1.5 * s, s);
    else if (sp.dir) drawChevrons(ctx, sp, w, now, s);
    else drawDownArrow(ctx, p.x, p.y - (14 + Math.abs(Math.sin(now / 300)) * 4) * s, s);
  }
}

// A row of three chevrons on the ground that light up in turn toward the way out.
function drawChevrons(ctx, sp, w, now, s) {
  const { dc, dr } = sp.dir;
  const len = Math.hypot((dc - dr) * 16, (dc + dr) * 8);
  const ux = (dc - dr) * 16 / len;
  const uy = (dc + dr) * 8 / len;
  const shape = [[2, 0], [-3, -5], [-6, -5], [-1, 0], [-6, 5], [-3, 5]];
  ctx.lineJoin = 'round';
  for (let i = 0; i < 3; i++) {
    const k = (i - 1) * 6 + 1;
    const ph = ((now / 700 - i / 3) % 1 + 1) % 1;
    const c = toScreen(w.x + ux * k, w.y + uy * k);
    // Squash across the arrow a little so it lies on the floor.
    const pts = shape.map(([a, b]) => ({ x: c.x + (ux * a - uy * b * 0.8) * s, y: c.y + (uy * a + ux * b * 0.8) * s }));
    ctx.globalAlpha = 0.45 + 0.55 * Math.max(0, Math.sin(Math.PI * ph));
    ctx.beginPath();
    pts.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.strokeStyle = '#7a3e6a';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();
    ctx.fillStyle = '#fff4c0';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Small pixel padlock for ways that open after collecting more stars.
function drawPadlock(ctx, x, y, s) {
  const P = (dx, dy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x + dx * s), Math.round(y + dy * s), w * s, h * s); };
  P(-4, -10, 8, 2, '#5a4a6a');
  P(-4, -9, 2, 6, '#5a4a6a');
  P(2, -9, 2, 6, '#5a4a6a');
  P(-3, -9, 6, 1, '#c8c0d8');
  P(-6, -4, 12, 10, '#8a5a1c');
  P(-5, -3, 10, 8, '#ffc83d');
  P(-5, -3, 10, 2, '#ffe28a');
  P(-1, -1, 2, 2, '#6b4228');
  P(-0.5, 1, 1, 2, '#6b4228');
}

// Bouncing arrow over a way out that is not on the scene's edge.
function drawDownArrow(ctx, x, y, s) {
  const P = (dx, dy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x + dx * s), Math.round(y + dy * s), w * s, h * s); };
  P(-3, -7, 6, 6, '#7a3e6a');
  P(-6, -2, 12, 2, '#7a3e6a');
  P(-4, 0, 8, 2, '#7a3e6a');
  P(-2, 2, 4, 2, '#7a3e6a');
  P(-2, -6, 4, 6, '#fff4c0');
  P(-4, -1, 8, 1, '#fff4c0');
  P(-3, 0, 6, 1, '#fff4c0');
  P(-1, 1, 2, 2, '#fff4c0');
}

// ---- Input ---------------------------------------------------------------

function onPointer(e) {
  Sound.unlock();
  if (state.busy) return;
  const sc = state.scene;
  // Map the tap into canvas pixels using its real on-screen box.
  const box = screen.getBoundingClientRect();
  const sx = (e.clientX - box.left) * (screen.width / box.width);
  const sy = (e.clientY - box.top) * (screen.height / box.height);
  const wx = sx / state.scale + Math.round(state.cam.x);
  const wy = sy / state.scale + Math.round(state.cam.y);
  state.ripples.push({ x: sx, y: sy, t0: performance.now() });

  // Villagers first: they are small and stand in front of things.
  for (const n of sc.npcs) {
    const p = tileCenter(sc, n.c, n.r);
    if (Math.abs(wx - p.x) < (n.mount || n.unicorn ? 14 : 10) && wy > p.y - 44 && wy < p.y + 4) {
      Sound.tap();
      if (n.mount) {
        const isNext = (c, r) => Math.abs(c - n.c) + Math.abs(r - n.r) === 1;
        if (!walkTo(isNext, getOn)) getOn();
      } else talkTo(n);
      return;
    }
  }

  const t = worldToTile(sc, wx, wy);

  // Doors between rooms, such as the castle to the princess's room.
  // Wall doors can also be tapped on the door itself.
  const link = (sc.links || []).find(l => l.c === t.c && l.r === t.r) ||
    (sc.links || []).find(l => l.door && Math.abs(wx - l.door.x) < 14 && wy > l.door.y - 32 && wy < l.door.y + 30);
  if (link) {
    if (link.needStars && state.stars < link.needStars) {
      Sound.wrong();
      showPlace(`🔒 별 ${link.needStars}개를 모으면 열려요 (지금 ⭐${state.stars})`);
      Sound.say([{ text: line('locked', { stars: link.needStars }) }]);
      return;
    }
    walkTo((c, r) => c === link.c && r === link.r, () => followLink(link));
    return;
  }

  // Exit mat in a room.
  const exits = sc.exitTiles || (sc.exit ? [sc.exit] : []);
  if (exits.some(x => x.c === t.c && x.r === t.r)) {
    walkTo((c, r) => exits.some(x => x.c === c && x.r === r), leaveRoom);
    return;
  }

  // Buildings with doors: walk to the door and go in.
  const hits = sc.objects.filter(o => !o.background && o.canvas && hitObject(o, wx, wy));
  // A staircase walks her to its foot and up (or down).
  const stairs = hits.find(o => o.stairs);
  if (stairs) {
    Sound.tap();
    walkTo((c, r) => stairs.stairs.some(l => l.c === c && l.r === r), () => {
      const here = heroTile();
      followLink(stairs.stairs.find(l => l.c === here.c && l.r === here.r) || stairs.stairs[0]);
    });
    return;
  }
  const shop = hits.find(o => o.kind === 'shop');
  if (shop) {
    Sound.tap();
    talkTo(shop.keeper);
    return;
  }
  // The library's bookcases open the book list.
  const shelf = hits.find(o => o.kind === 'bookcase');
  if (shelf) {
    Sound.tap();
    walkTo((c, r) => shelf.front.some(f => f.c === c && f.r === r), openLibrary);
    return;
  }
  const robe = hits.find(o => o.kind === 'wardrobe');
  if (robe) {
    Sound.tap();
    walkTo((c, r) => robe.front.some(f => f.c === c && f.r === r), openWardrobe);
    return;
  }
  for (let i = hits.length - 1; i >= 0; i--) {
    const doors = sc.doors.filter(d => d.obj === hits[i]);
    if (doors.length) {
      Sound.tap();
      walkTo((c, r) => doors.some(d => d.c === c && d.r === r), () => {
        const here = heroTile();
        enterDoor(doors.find(d => d.c === here.c && d.r === here.r) || doors[0]);
      });
      return;
    }
  }

  if (walkable(sc, t.c, t.r)) walkTo((c, r) => c === t.c && r === t.r);
}

function worldToTile(sc, wx, wy) {
  const u = (wx - sc.ox - 16) / 16;
  const v = (wy - sc.oy - 8) / 8;
  return { c: Math.round((u + v) / 2), r: Math.round((v - u) / 2) };
}

// ---- Loop ----------------------------------------------------------------

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (state.scene) {
    updateHero(dt);
    updateEffects(dt, now);
    const target = cameraTarget();
    const k = Math.min(1, dt * 6);
    state.cam.x += (target.x - state.cam.x) * k;
    state.cam.y += (target.y - state.cam.y) * k;
    drawScene(now);
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.clearRect(0, 0, screen.width, screen.height);
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(view, 0, 0, view.width * state.scale, view.height * state.scale);
    drawOverlay(now);
  }
  requestAnimationFrame(frame);
}

// ---- Boot ----------------------------------------------------------------

function setPictures(on) {
  state.pictures = on;
  ui.pictures.classList.toggle('active', on);
  ui.choices.querySelectorAll('.choice[data-words]').forEach(b => b.classList.toggle('pictures', on));
  save();
}

resize();
addEventListener('resize', resize);
if (window.visualViewport) visualViewport.addEventListener('resize', resize);
state.scene = sceneFor('town');
placeHero(state.scene.start.c, state.scene.start.r);
parkUnicorn();
renderRide();
snapCamera();
renderStars(false);
setPictures(state.pictures);

screen.addEventListener('pointerdown', onPointer);
ui.replay.addEventListener('click', () => { Sound.tap(); askAgain(); });
ui.close.addEventListener('click', () => { Sound.tap(); closeDialog(); });
ui.rewardYes.addEventListener('click', () => acceptReward(true));
ui.rewardNo.addEventListener('click', () => acceptReward(false));
ui.wdDone.addEventListener('click', closeWardrobe);
ui.shopBuy.addEventListener('click', buyPick);
ui.shopDone.addEventListener('click', () => { Sound.tap(); closeShop(); });
ui.pictures.addEventListener('click', () => { Sound.tap(); setPictures(!state.pictures); });
ui.ride.addEventListener('click', toggleRide);
ui.mute.addEventListener('click', () => {
  const muted = Sound.toggleMute();
  ui.mute.textContent = muted ? '🔇' : '🔊';
});
addEventListener('keydown', e => {
  if (!ui.dialog.classList.contains('hidden') && state.question && state.question.tiles) { spellKey(e.key); return; }
  if (!ui.dialog.classList.contains('hidden') && ['1', '2', '3', '4'].includes(e.key)) {
    const i = Number(e.key) - 1;
    const b = ui.choices.children[i];
    if (b) choose(i, b);
  }
});
// The start screen: pick a name and a title, then press play.
let spokenEdited = false;
// Switching between a girl and a boy puts on what that look wore last time.
function wearLook() {
  if (state.worn !== PLAYER.look) {
    state.looks[state.worn] = state.outfit;
    const { ride, fairy } = state.outfit;
    state.outfit = Object.assign({}, state.looks[PLAYER.look] || defaultOutfit(), { ride, fairy });
    state.worn = PLAYER.look;
  }
  state.outfit = fitOutfit(state.outfit);
  // The starting clothes of a look she just switched to are hers.
  for (const { slot } of WARDROBE) if (!state.owned[slot].includes(state.outfit[slot])) state.owned[slot].push(state.outfit[slot]);
}
function renderStart() {
  ui.startTitle.textContent = `${PLAYER.shown} ${titleKo()}의`;
  ui.wdTitle.textContent = `${isBoy() ? '👑' : '🎀'} ${titleKo()}님의 옷장`;
  document.title = `${PLAYER.shown} ${titleKo()}의 소리 마을`;
  ui.titleChips.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.title === PLAYER.title));
  // Knights, wizards, explorers and captains can be a girl or a boy.
  ui.lookChips.classList.toggle('hidden', !!TITLES[PLAYER.title].look);
  ui.lookChips.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.look === PLAYER.look));
  wearLook();
  drawPortrait(ui.startPreview, heroSprite(state.outfit, 0));
}
ui.nameInput.value = PLAYER.shown;
ui.spokenInput.value = PLAYER.spoken;
spokenEdited = PLAYER.spoken !== romanize(PLAYER.shown);
for (const [key, t] of Object.entries(TITLES)) {
  const b = document.createElement('button');
  b.className = 'chip';
  b.dataset.title = key;
  b.innerHTML = `<span class="ic">${t.icon}</span>${t.ko}`;
  b.addEventListener('click', () => {
    Sound.unlock();
    Sound.tap();
    setPlayer({ title: key });
    renderStart();
    Sound.say([{ text: `${t.en} ${PLAYER.spoken}!`, pitch: 1.3 }]);
  });
  ui.titleChips.append(b);
}
for (const [look, label] of [['girl', '👧 여자'], ['boy', '👦 남자']]) {
  const b = document.createElement('button');
  b.className = 'chip';
  b.dataset.look = look;
  b.textContent = label;
  b.addEventListener('click', () => {
    Sound.unlock();
    Sound.tap();
    setPlayer({ look });
    renderStart();
  });
  ui.lookChips.append(b);
}
ui.nameInput.addEventListener('input', () => {
  setPlayer({ shown: ui.nameInput.value });
  if (!spokenEdited) {
    ui.spokenInput.value = romanize(ui.nameInput.value.trim());
    setPlayer({ spoken: ui.spokenInput.value });
  }
  renderStart();
});
ui.spokenInput.addEventListener('input', () => {
  spokenEdited = ui.spokenInput.value.trim() !== '';
  setPlayer({ spoken: ui.spokenInput.value || romanize(PLAYER.shown) });
});
ui.hearName.addEventListener('click', () => {
  Sound.unlock();
  Sound.say([{ text: `${TITLES[PLAYER.title].en} ${PLAYER.spoken}!`, pitch: 1.3 }]);
});
renderStart();

ui.startBtn.addEventListener('click', () => {
  Sound.unlock();
  ui.nameInput.blur();
  ui.spokenInput.blur();
  save();
  ui.start.classList.add('hidden');
  showPlace('🌸 소리 마을');
  Sound.say([{ text: line('start'), pitch: 1.3 }]);
});
requestAnimationFrame(frame);
