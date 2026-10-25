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
if (isCaptain()) captainWardrobe(WARDROBE); // robot parts, js/captain-hero.js

// ---- Saved progress ------------------------------------------------------

const SAVE_KEY = 'pixeltown-v2';

function setPlayer(p) {
  if (typeof p.shown === 'string' && p.shown.trim()) PLAYER.shown = p.shown.trim().slice(0, 10);
  if (typeof p.spoken === 'string' && p.spoken.trim()) PLAYER.spoken = p.spoken.trim().slice(0, 20);
  if (TITLES[p.title] && !isCaptain()) PLAYER.title = p.title;
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
  if (isCaptain()) return robotSprite(outfit, frame);
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
// One save holds both editions: the one being played at the top level, the
// other tucked under `other`, so one account keeps both games' progress.
function editionSave(s) {
  const had = s.edition || 'princess';
  if (had === EDITION) return s;
  const other = Object.assign({}, s.other);
  const mine = other[EDITION] || {};
  delete other[EDITION];
  const rest = Object.assign({}, s);
  delete rest.other;
  other[had] = rest;
  return Object.assign({}, mine, { edition: EDITION, other });
}
const PLAYER_START = Object.assign({}, PLAYER); // before a save changes it
let otherEditions = {};
let savedRest = {}; // fields of the save this version doesn't use, kept as they are
// `raw` is a save object (from js/account.js), else the one in localStorage.
function load(raw) {
  try {
    const s = editionSave(raw || JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'));
    otherEditions = s.other || {};
    savedRest = Object.assign({}, s);
    delete savedRest.other;
    let outfit = Object.assign({}, DEFAULT_OUTFIT, s.outfit);
    Quiz.recent = s.recent;
    if (s.player) setPlayer(s.player);
    outfit = fitOutfit(outfit);
    // Picture hints start on for a new player (a pre-reader needs them).
    const pictures = s.pictures === undefined ? true : !!s.pictures;
    // Her level per kind of question and the parent's settings describe her,
    // so both editions share them; a save from before levels gets them from
    // its answers.
    const others = Object.values(otherEditions);
    const skill = s.skill || (others.find(o => o && o.skill) || {}).skill || Quiz.migrate([s.history].concat(others.map(o => o && o.history)));
    const settings = Object.assign({ playLimit: 0, hideMute: false }, s.settings || (others.find(o => o && o.settings) || {}).settings);
    // The first-steps pointer (js/guide.js) is for new players only.
    const firstSteps = s.guide || { step: s.stars || Object.keys(s.history || {}).length ? 3 : 0 };
    // Stars, coins and dust are also counted per device (js/progress.js).
    return { outfit, owned: ownedFrom(s.owned, outfit), stars: s.stars | 0, coins: s.coins | 0, dust: s.dust | 0, tally: Progress.tally(s), pictures, looks: s.looks || {}, history: Progress.history(s.history), books: s.books || {},
      skill, settings, friends: s.friends || {}, guide: firstSteps, playtime: s.playtime || {},
      stickers: albumSaved(s.stickers), medals: albumSaved(s.medals), gifts: s.gifts | 0 };
  } catch (e) {
    return { looks: {}, outfit: Object.assign({}, DEFAULT_OUTFIT), owned: ownedFrom(null, DEFAULT_OUTFIT), stars: 0, coins: 0, dust: 0, tally: Progress.tally({}), pictures: true, history: {}, books: {},
      skill: {}, settings: { playLimit: 0, hideMute: false }, friends: {}, guide: { step: 0 }, playtime: {}, stickers: {}, medals: {}, gifts: 0 };
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
  // Her level and the parent's settings go with both editions.
  for (const o of Object.values(otherEditions)) if (o) Object.assign(o, { skill: state.skill, settings: state.settings });
  // fmt 2: stars, coins and dust are also counted per device (earned /
  // spent, js/progress.js); the totals stay for older versions of the game.
  // Fields this version doesn't know are kept (savedRest). `ver`: the server
  // version this was written on (js/account.js), the server's clock, so
  // another device can tell which copy is newer.
  const data = Object.assign({}, savedRest, { fmt: Progress.FMT, outfit: state.outfit, looks: state.looks, owned: state.owned, stars: state.stars, coins: state.coins, dust: state.dust, pictures: state.pictures, recent: Quiz.recent, history: state.history, skill: state.skill, settings: state.settings, books: state.books, player: PLAYER, edition: EDITION, other: otherEditions, ver: typeof Account !== 'undefined' ? Account.base : 0, at: Date.now(),
    friends: state.friends, guide: state.guide, playtime: state.playtime, stickers: state.stickers, medals: state.medals, gifts: state.gifts }, Progress.count(state));
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
  if (typeof Account !== 'undefined') Account.push(data);
}

// A save that js/account.js put together with the account's (another
// tablet's progress, or the account's own) goes into the running game in
// place, without a reload: counters, presents, answers and books, and the
// outfit and name it carries.
function applyProgress(s) {
  const p = load(s || { edition: EDITION, player: PLAYER_START }); // null: start fresh
  Object.assign(state, { owned: p.owned, stars: p.stars, coins: p.coins, dust: p.dust, tally: p.tally, history: p.history, books: p.books, looks: p.looks, pictures: p.pictures,
    skill: p.skill, settings: p.settings, friends: p.friends, guide: p.guide, playtime: p.playtime, stickers: p.stickers, medals: p.medals, gifts: p.gifts });
  const ride = state.outfit.ride;
  state.worn = PLAYER.look;
  state.outfit = p.outfit;
  if (state.outfit.ride !== ride) {
    if (state.outfit.ride === 'none') state.mounted = false;
    if (!state.mounted && state.scene) parkUnicorn();
  }
  guideApplySettings(); // the parent may have hidden the 🔊 button
  renderStars(false);
  renderRide();
  if (!ui.wardrobe.classList.contains('hidden')) renderWardrobe();
  if (!ui.start.classList.contains('hidden')) {
    ui.nameInput.value = PLAYER.shown;
    ui.spokenInput.value = PLAYER.spoken;
    spokenEdited = PLAYER.spoken !== romanize(PLAYER.shown);
    renderStart();
  }
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
  tally: saved.tally, // the same three, counted per device: { earned, spent }
  history: saved.history, // { questionId: { kind, tries, right, wrong, last } }
  skill: saved.skill, // her tier per kind of question (js/quiz.js)
  settings: saved.settings, // parent settings: { twoSyllables }
  books: saved.books, // reading log: { [bookId]: { read, quizRight, got } }
  stickers: saved.stickers || {}, // the word album: { [word]: { e, n, at, new } } (js/album.js)
  medals: saved.medals || {}, // { 'house:C' or 'village:forest': when }
  gifts: saved.gifts | 0, // pips on the gift meter
  combo: 0, // answers right the first time in a row, this visit
  pictures: saved.pictures,
  friends: saved.friends,   // fairy dust fed to each fairy friend: { [key]: n } (js/friend.js)
  settings: saved.settings, // from the parent panel: { playLimit, hideMute }
  guide: saved.guide,       // first-steps pointer: { step } (js/guide.js)
  playtime: saved.playtime, // { day, ms } played today, for the limit
  scenes: {},
  scene: null,
  hero: { c: 0, r: 0, path: [], flip: false, frame: 0, onArrive: null },
  cam: { x: 0, y: 0 },
  scale: 4,
  busy: false,       // a dialog, reward or scene change is showing
  paused: false,     // the parent panel is open: no walking, timers wait
  held: [],          // timers that came due while paused
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

// Game timers. While the parent panel is open (state.paused) they wait,
// and run when it closes.
function later(ms, fn) { state.timers.push(setTimeout(() => whenPlaying(fn), ms)); }
function whenPlaying(fn) { if (state.paused) state.held.push(fn); else fn(); }
function setPaused(on) {
  state.paused = on;
  if (!on) for (const fn of state.held.splice(0)) fn();
}

function sceneFor(target) {
  if (!state.scenes[target]) {
    const captain = isCaptain() && CAPTAIN_SCENES[target];
    const home = VILLAGE_HOMES.find(h => `home-${h.id}` === target);
    const house = TOWN_HOUSES.find(h => `house-${h.letter}` === target);
    if (captain) state.scenes[target] = captain();
    else if (target === 'town') state.scenes[target] = buildTown();
    else if (target === 'castle') state.scenes[target] = buildCastleInterior();
    else if (target === 'castle2') state.scenes[target] = buildCastleUpstairs();
    else if (target === 'yuna') state.scenes[target] = buildYunaRoom();
    else if (target === 'forest') state.scenes[target] = buildForest();
    else if (target === 'unicorn') state.scenes[target] = buildUnicornVillage();
    else if (target === 'dungeon') state.scenes[target] = buildDungeon();
    else if (target === 'fairy') state.scenes[target] = buildFairyVillage();
    else if (home) state.scenes[target] = buildHomeInterior(home);
    else if (house) state.scenes[target] = buildHouseInterior(house);
    // A place that doesn't exist takes her to the town instead of breaking.
    else return sceneFor('town');
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
    document.body.classList.toggle('dino', state.scene.kind === 'dino');
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
    changeScene('castle', null, place('castle'));
    Sound.say([{ text: line('castle'), pitch: 1.3 }]);
  } else if (door.home) {
    // A village home: a knock, then the resident says hello from inside.
    // She comes back out on the door tile she went in by.
    const room = sceneFor(door.target);
    const theme = door.home.theme;
    room.returnTo = { scene: door.home.scene, at: { c: door.c, r: door.r } };
    changeScene(door.target, null, room.label);
    Sound.say([{ text: line('knock'), narrator: true }, { pause: 500 }, { text: line(`home-${theme}`, {}, HOME_HELLO[theme]) }], voiceOf(room.npcs[0]));
  } else if (door.obj.info) {
    const info = door.obj.info;
    changeScene(door.target, null, `${info.letter}${info.letter.toLowerCase()} ${isCaptain() ? '공방' : '집'}`);
    Sound.say([{ text: line('house', { letter: info.letter }) }]);
  } else {
    changeScene(door.target);
  }
}

// Out through a room's exit mat: back to the door she came in by. Letter
// houses go back to their door in town, the castle to its gate.
function leaveRoom() {
  const sc = state.scene;
  Sound.door();
  const back = sc.returnTo || { scene: 'town', at: sc.house ? { c: sc.house.c + 1, r: sc.house.r + 3 } : { c: 19, r: 10 } };
  changeScene(back.scene, back.at, place(back.scene));
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
  const npc = { mount: true, name: isCaptain() ? '자동차' : '유니콘', c: spot.c, r: spot.r, flip: state.hero.flip, phase: 0 };
  sc.npcs.push(npc);
  state.parked = { sc, npc };
}

function getOn() {
  if (!hasUnicorn() || !state.scene.outdoor) return;
  removeParked();
  state.mounted = true;
  burstAtHero(24);
  Sound.sparkle();
  Sound.say([{ text: line('mount'), pitch: 1.3 }]);
  renderRide();
}

// Before going indoors, or when she taps the 🦄 button.
function getOff() {
  if (!state.mounted) return;
  state.mounted = false;
  parkUnicorn();
  showPlace(isCaptain() ? CAPTAIN_RIDE_TEXT.wait : '🦄 유니콘은 밖에서 기다려요');
  Sound.say([{ text: line('dismount'), pitch: 1.3 }]);
  renderRide();
}

function toggleRide() {
  Sound.tap();
  if (!hasUnicorn()) {
    const first = state.owned.ride.find(v => v !== 'none');
    if (!first) { showPlace(isCaptain() ? CAPTAIN_RIDE_TEXT.find : '🦄 유니콘 마을에서 유니콘을 만나요'); return; }
    state.outfit = Object.assign({}, state.outfit, { ride: first });
    save();
  }
  if (!state.scene.outdoor) { showPlace(isCaptain() ? CAPTAIN_RIDE_TEXT.indoors : '🏠 집 안에서는 유니콘을 탈 수 없어요'); return; }
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

// A question she missed comes back from the same person once she has
// finished another one, with new options in a new order.
const comeBack = npc => !!npc.missed && state.answered >= npc.missedDue;

function openDialog(npc) {
  if (npc.caught || state.gift) return;
  faceEachOther(npc);
  if (npc.shop) { openShop(npc); return; }
  state.busy = true;
  state.talking = npc;
  libraryDialog(npc);
  miniDialog(npc);
  drawPortrait(ui.portrait, npc.unicorn ? unicornSprite(npc.unicorn, 0) : villagerSprite(npc.look, 0));
  ui.name.textContent = npc.name;
  const back = comeBack(npc);
  const q = back ? Quiz.again(npc.missed, npc) : Quiz.make(npc);
  if (back) npc.missed = null;
  state.question = q;
  if (q.review) ui.name.insertAdjacentHTML('beforeend', ' <span class="review-tag">복습</span>');
  // A captain-edition villain shows its hearts and taunts between questions.
  // In a letter house the host skips the chat and teaches the letter instead.
  // Others say their own hello the first time she talks to them, and just a
  // short lead after that.
  const house = npc.letter && LETTERS.find(l => l.letter === npc.letter);
  const villain = isCaptain() && npc.monster && villainRound(npc);
  const greet = !npc.greeted;
  npc.greeted = true;
  const hello = house ? houseHello(house) : villain ||
    (back ? line('again') : greet ? line(`persona-${npc.look}`, {}, PERSONA[npc.look]) : line('next'));
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
  // The cards wait until she has heard the word (Quiz.READY in q.ask).
  listen(q, [{ text: hello }, { pause: house ? 500 : 400 }].concat(q.ask), 12000);
  save();
}

// "This is the C house. C says kuh." (recorded per voice by tools/tts-phrases.js)
function houseHello(info) {
  return `This is the ${info.letter} ${isCaptain() ? 'workshop' : 'house'}. ${info.letter} says ${info.sound}.`;
}

// Says `parts` with the cards dimmed, and lets her answer from Quiz.READY
// on (or at the end), or after `ms` at the latest: the voice can be muted,
// slow or missing. Nothing happens if this dialog has gone by then.
function listen(q, parts, ms) {
  q.locked = true;
  ui.dialog.classList.add('listening');
  const turn = q.turn = (q.turn || 0) + 1;
  const ready = () => {
    if (state.question !== q || q.turn !== turn || !q.locked) return;
    q.locked = false;
    ui.dialog.classList.remove('listening');
  };
  if (!parts.includes(Quiz.READY)) parts = parts.concat(Quiz.READY);
  if (Sound.muted) ready();
  else later(ms, ready);
  Sound.say(parts.map(p => (p === Quiz.READY ? { call: ready } : p)), voiceOf(state.talking));
}

// 🔊: the word again (once the answer is shown or given, the answer).
function askAgain() {
  const q = state.question;
  if (!q) return;
  const parts = q.done ? q.answer : q.reveal ? q.model : q.replay;
  if (q.locked) listen(q, parts.slice(), 5000);
  else Sound.say(parts, voiceOf(state.talking));
}

// What the dialog shows for some speech parts.
const shownText = parts => parts.filter(p => p.text).map(p => (p.show !== undefined ? p.show : p.text)).join(' ');

function choose(i, btn) {
  const q = state.question;
  if (!q || q.done || q.locked || q.tiles || !btn || btn.disabled) return;
  const o = q.options[i];
  // Once the answer is shown, only that card can be tapped.
  if (q.reveal) { if (o.right) finishShown(q, btn); return; }
  reviewRecord(q, o.right);
  if (o.right) answeredRight(q, btn);
  else missed(q, o, btn);
}

// A right answer: praise, a star and the word's sticker (js/album.js).
// Right the first time fills a pip of the gift meter; a full meter opens a
// present she doesn't have yet (or a sticker pack). Three in a row get a
// cheer instead of the praise.
function answeredRight(q, btn) {
  const npc = state.talking;
  q.done = true;
  btn.classList.add('right');
  ui.choices.querySelectorAll('.choice').forEach(b => { b.disabled = true; });
  if (q.solved) ui.clue.innerHTML = q.solved;
  collectSticker(q, btn);
  const praise = comboCheer(q) || line('praise');
  ui.text.textContent = praise;
  Sound.correct();
  // A kind of question just went up to a new tier.
  const levelUp = q.levelUp ? [{ pause: 300 }, { text: line('levelUp'), narrator: true }] : [];
  if (q.levelUp) later(600, showLevelUp);
  checkMedals();
  // Cave monsters pay in coins instead of a star and a present.
  if (npc.monster) {
    Sound.say([{ text: praise }, { pause: 300 }].concat(q.answer, levelUp), voiceOf(npc));
    catchMonster(npc);
    return;
  }
  const full = !q.misses && fillGiftMeter();
  const gift = full && hasNewGift(npc);
  if (full && !gift) later(700, stickerPack);
  const close = () => { if (state.question === q) closeDialog(); };
  Sound.say([{ text: praise }, { pause: 300 }].concat(q.answer, levelUp, gift ? [] : [{ pause: 700 }, { call: close }]), voiceOf(npc));
  if (npc.level === 5 && !q.misses) addDust();
  const before = state.stars++;
  state.answered++;
  save();
  renderStars(true);
  gateCheck(before);
  burstAtHero(q.misses ? 14 : 30);
  if (gift) giftLater(q, npc);
  else later(Sound.muted ? 1800 : 7000, close);
}

// A wrong pick. The first time she hears what she picked and a hint, and
// tries again with the cards that are left. The second time (or when only
// the right card is left) the answer is shown and she taps it.
function missed(q, o, btn) {
  const npc = state.talking;
  q.misses++;
  Sound.oops();
  btn.classList.add('wrong');
  btn.disabled = true;
  const left = q.options.filter((x, j) => !x.right && !ui.choices.children[j].disabled).length;
  const showIt = q.misses >= 2 || !left;
  // A captain-edition villain throws something first (js/captain-cave.js).
  if (isCaptain() && npc.monster) { villainMiss(npc, q, o, showIt); return; }
  if (showIt) showAnswer(q, o);
  else hint(q, o);
}

// First miss: what she picked, and a hint for this kind of question.
function hint(q, o) {
  const parts = q.teach(o);
  ui.text.textContent = shownText(parts);
  listen(q, parts, 7000);
}

// The answer, shown and said: the right card glows and the others fade.
function showAnswer(q, o) {
  q.reveal = true;
  q.options.forEach((x, j) => {
    const b = ui.choices.children[j];
    if (x.right) { b.classList.add('glow', 'pictures'); b.disabled = false; } else { b.classList.add('gone'); b.disabled = true; }
  });
  const showMe = line('showMe');
  const tap = isCaptain() && state.talking.monster ? villainTapLine() : { text: line('tapIt') };
  const parts = (o ? q.picked(o).concat({ pause: 400 }) : []).concat({ text: showMe }, { pause: 300 }, q.model);
  ui.text.textContent = `${shownText(parts)} ${tap.text}`;
  listen(q, parts.concat(Quiz.READY, { pause: 300 }, tap), 8000);
  // A nudge if she hasn't tapped it a while later.
  later(16000, () => { if (state.question === q && !q.done && !q.locked) Sound.say([tap], voiceOf(state.talking)); });
}

// "⭐ 레벨 업!" over the game, with a fanfare.
function showLevelUp() {
  const el = document.createElement('div');
  el.className = 'level-up';
  el.textContent = '⭐ 레벨 업!';
  document.body.append(el);
  Sound.levelUp();
  burstAtHero(40);
  setTimeout(() => el.remove(), 2600);
}

// She tapped the shown answer: it is said once more, no star, and it comes
// back later. The next question of this kind is an easier one.
function finishShown(q, btn) {
  const npc = state.talking;
  q.done = true;
  state.combo = 0;
  btn.classList.remove('glow');
  btn.classList.add('right');
  ui.choices.querySelectorAll('.choice').forEach(b => { b.disabled = true; });
  if (q.solved) ui.clue.innerHTML = q.solved;
  npc.missed = q;
  npc.missedDue = state.answered + 2;
  Sound.tap();
  burstAtHero(8);
  if (isCaptain() && npc.monster) { villainHit(npc, true); return; }
  state.answered++;
  save();
  const soon = line('soon');
  ui.text.textContent = soon;
  const close = () => { if (state.question === q) closeDialog(); };
  Sound.say(q.answer.concat({ pause: 400 }, { text: soon }, { pause: 600 }, { call: close }), voiceOf(npc));
  later(Sound.muted ? 1500 : 9000, close);
}

function closeDialog() {
  ui.dialog.classList.add('hidden');
  ui.dialog.classList.remove('listening');
  ui.reward.classList.add('hidden');
  state.busy = false;
  state.question = null;
  state.talking = null;
  state.gift = null;
}

// The present for a right answer comes once the praise has been said. If
// she closed the dialog before that, it comes when nothing else is open,
// and it is always from the person she answered.
function giftLater(q, npc) {
  q.giver = npc;
  later(2600, () => giveGift(q));
}
// Whether a present here would be something she doesn't have yet. An old
// one is never handed out as a present.
const hasNewGift = npc => rewardChoices((npc && npc.level) || 1).some(r => r.isNew);
function giveGift(q) {
  if (!q.giver) return;
  const free = state.question === q || (!state.busy && !state.hero.onArrive && !state.gift);
  if (!free) { later(1500, () => giveGift(q)); return; }
  const npc = q.giver;
  q.giver = null;
  if (hasNewGift(npc)) offerReward(npc);
  else if (state.question === q) closeDialog();
}

// ---- Rewards -------------------------------------------------------------

function itemLabel(slot, value) {
  const v = WARDROBE.find(w => w.slot === slot).items[value];
  if (isCaptain()) return captainItemLabel(slot, v);
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
  if (isCaptain()) captainRewardText(gift.isNew, gift.label, ride, fairy);
  ui.dialog.classList.add('hidden');
  ui.reward.classList.remove('hidden');
  showPresent(gift, next);
  state.busy = true;
  Sound.party();
  state.giver = npc;
  Sound.say([{ pause: 600 }, { text: line(ride ? 'newUnicorn' : fairy ? 'newFairy' : 'gift') }], voiceOf(npc));
}

function acceptReward(yes) {
  if (yes && state.gift) {
    const was = state.outfit;
    state.outfit = Object.assign({}, state.outfit, { [state.gift.slot]: state.gift.value });
    save();
    if (state.gift.slot === 'ride' && state.scene.outdoor) { removeParked(); state.mounted = true; }
    renderRide();
    burstAtHero(50);
    Sound.sparkle();
    // The robot shows its new part off and says what it does (once that
    // line is recorded).
    const who = voiceOf(state.giver);
    const show = isCaptain() && captainShowOff(state.gift.slot, was, state.outfit);
    Sound.say([{ text: show && Sound.hasClip(show, who) ? show : line('yes') }], who);
  } else {
    Sound.say([{ text: line('keep') }], voiceOf(state.giver));
  }
  guideGift(state.giver);
  state.gift = null;
  closeDialog();
}

// The "now" and "after" previews of a present (or something just bought).
// She is on foot unless the present is a ride, and both leave room for a
// fairy friend if either one has one.
function showPresent(gift, next) {
  const ride = gift.slot === 'ride';
  const room = state.outfit.fairy !== 'none' || next.fairy !== 'none';
  drawPortrait(ui.pvNow, heroPortrait(state.outfit, ride, room));
  drawPortrait(ui.pvNew, heroPortrait(next, ride, room));
  if (isCaptain()) captainRewardShow(gift, state.outfit, next, room);
}

// Her standing (or riding, when `riding`) picture for previews, with room
// above for her fairy friend when `room` (by default, when she has one).
function heroPortrait(outfit, riding, room = outfit.fairy !== 'none', frame = 0) {
  const ride = riding && outfit.ride !== 'none';
  const sprite = ride ? riderSprite(outfit, 0, isBoy()) : heroSprite(outfit, frame);
  return room ? withFairy(sprite, outfit, ride) : sprite;
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
  renderAlbumHud();
}

function followLink(link) {
  Sound.door();
  if (link.target === 'yuna') {
    changeScene('yuna', null, place('room'));
    Sound.say([{ text: line('room') }]);
  } else if (link.target === 'forest') {
    changeScene('forest', link.at, place('forest'));
    Sound.say([{ text: line('forest'), pitch: 1.3 }]);
  } else if (link.target === 'unicorn') {
    changeScene('unicorn', link.at, place('unicorn'));
    Sound.say([{ text: line('unicorn'), pitch: 1.3 }]);
  } else if (link.target === 'dungeon') {
    getOff();
    respawnMonsters(sceneFor('dungeon'));
    changeScene('dungeon', link.at, place('dungeon'));
    Sound.say([{ text: line('dungeon'), pitch: 1.3 }]);
  } else if (link.target === 'fairy') {
    changeScene('fairy', link.at, place('fairy'));
    Sound.say([{ text: line('fairyland'), pitch: 1.3 }]);
  } else if (link.target === 'town') {
    changeScene('town', link.at, place('town'));
  } else if (link.target === 'castle2') {
    changeScene('castle2', link.at, place('castle2'));
    Sound.say([{ text: line('upstairs'), pitch: 1.3 }, { pause: 400 }]);
    libraryInvite();
  } else {
    changeScene(link.target, link.at, place('castle'));
  }
}

// ---- Wardrobe ------------------------------------------------------------

// The wardrobe slot tapped last: the mirror shows her riding only after a
// unicorn is picked, so everything else is seen on foot.
let wdShown = null;

function openWardrobe() {
  state.busy = true;
  wdShown = null;
  renderWardrobe();
  ui.wardrobe.classList.remove('hidden');
  Sound.say([{ text: line('dressup'), pitch: 1.3 }]);
}

function renderWardrobe() {
  // The robot stands on a stage where its parts move (js/captain-hero.js).
  if (isCaptain()) captainStage(ui.wdPreview, state.outfit, wdShown === 'ride');
  else drawPortrait(ui.wdPreview, heroPortrait(state.outfit, wdShown === 'ride'));
  const { have, total } = collected();
  ui.wdCount.textContent = `모은 선물 ${have} / ${total}`;
  if (isCaptain()) ui.wdCount.textContent = CAPTAIN_TEXT.collected(have, total);
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
      const part = owned && isCaptain() && captainPartIcon(slot, value, state.outfit);
      if (!owned) b.innerHTML = '<span class="ic">❓</span>';
      else if (item.c && slot === 'dress') b.innerHTML = `<span class="sw" style="background:${isCaptain() ? captainSwatch(item) : item.c[0]}"></span><span class="nm">${item.name}</span>`;
      else if (item.c) b.innerHTML = `<span class="sw" style="background:${item.c[0]}"></span><span class="nm">${item.name.replace(' 머리', '')}</span>`;
      else b.innerHTML = `<span class="ic">${item.icon || '✖️'}</span><span class="nm">${item.name}</span>`;
      // Robot parts show the part itself instead of an emoji.
      if (part) b.querySelector('.ic').replaceChildren(part);
      b.addEventListener('click', () => {
        if (state.outfit[slot] === value) return;
        const was = state.outfit;
        state.outfit = Object.assign({}, state.outfit, { [slot]: value });
        wdShown = slot;
        save();
        if (slot === 'ride' && value === 'none') { removeParked(); state.mounted = false; }
        Sound.tap();
        burstAtHero(16);
        renderWardrobe();
        if (isCaptain()) captainBenchShow(slot, was, state.outfit);
      });
      chips.append(b);
    }
    // Her fairy friend's ✨ feeding chip (js/friend.js).
    if (slot === 'fairy') friendChip(chips);
    row.append(h, chips);
    ui.wdSlots.append(row);
  }
}

function closeWardrobe() {
  ui.wardrobe.classList.add('hidden');
  state.busy = false;
  burstAtHero(40);
  Sound.sparkle();
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
  // In the captain edition it's a fight: see villainHit in js/captain-cave.js.
  if (isCaptain()) { villainHit(npc); return; }
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
    Sound.coin();
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
  // On foot, unless what she is looking at is a unicorn.
  const riding = !!pick && pick.slot === 'ride';
  if (isCaptain()) captainStage(ui.shopPreview, next, riding);
  else drawPortrait(ui.shopPreview, heroPortrait(next, riding));
  ui.shopItems.innerHTML = '';
  for (const it of shopItems()) {
    const b = document.createElement('button');
    b.className = 'chip shop-item';
    b.classList.toggle('on', !!pick && pick.slot === it.slot && pick.value === it.value);
    b.classList.toggle('dear', it.price > state.coins);
    const look = it.item.c ? `<span class="sw" style="background:${isCaptain() ? captainSwatch(it.item) : it.item.c[0]}"></span>` : `<span class="ic">${it.item.icon}</span>`;
    b.innerHTML = `${look}<span class="nm">${it.label.replace(/^\S+ /, '')}</span><span class="price"><span class="coin">🪙</span>${it.price}</span>`;
    const part = isCaptain() && captainPartIcon(it.slot, it.value, state.outfit);
    if (part) b.querySelector('.ic').replaceChildren(part);
    b.addEventListener('click', () => {
      Sound.tap();
      state.shopPick = it;
      ui.shopMsg.textContent = it.item.shop ? '✨ 상점에만 있는 보물이에요!' : '갖고 싶은 걸 골라 보세요!';
      if (isCaptain() && it.item.shop) ui.shopMsg.textContent = CAPTAIN_TEXT.shopOnly;
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
    Sound.locked();
    ui.shopMsg.textContent = `코인이 ${pick.price - state.coins}개 더 필요해요. 반짝 동굴에서 몬스터를 잡아 봐요! 💎`;
    if (isCaptain()) ui.shopMsg.textContent = CAPTAIN_TEXT.poor(pick.price - state.coins);
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
  if (isCaptain()) captainRewardText(true, pick.label, ride, fairy);
  ui.reward.classList.remove('hidden');
  showPresent(state.gift, Object.assign({}, state.outfit, { [pick.slot]: pick.value }));
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

// Spelling questions: letter tiles under the blanks. Each tile says its
// sound when tapped and is checked as it goes in: a right one stays in its
// blank, a wrong one hops back to the tiles with a hint. After two wrong
// tiles for the same blank the right tile glows, and the word comes back
// later like any answer that had to be shown.
function renderSpell(q) {
  q.picked = []; // the tile in each filled blank
  q.slotMiss = [];
  q.glow = -1;
  ui.choices.innerHTML = '';
  q.tiles.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'choice tile';
    b.innerHTML = `<span class="letter">${t.l}</span>`;
    b.addEventListener('click', () => spellTap(i));
    ui.choices.append(b);
  });
  // The easiest words come with the first letter in already.
  for (let i = 0; i < (q.given || 0); i++) q.picked.push(q.tiles.findIndex((t, j) => t.l === q.slots[i] && !q.picked.includes(j)));
  showSpelled(q);
}

function showSpelled(q) {
  ui.clue.querySelectorAll('.spell-word .slot').forEach((s, i) => {
    const t = q.tiles[q.picked[i]];
    s.textContent = t ? t.l : '';
    s.classList.remove('bad');
    s.classList.toggle('full', !!t);
    s.classList.toggle('ok', !!t);
    s.classList.toggle('next', !q.done && i === q.picked.length);
  });
  ui.choices.querySelectorAll('.tile').forEach((b, i) => {
    b.disabled = q.done || q.picked.includes(i) || (q.glow >= 0 && i !== q.glow);
    b.classList.toggle('glow', i === q.glow);
  });
}

function spellTap(i) {
  const q = state.question;
  if (!q || !q.tiles || !q.tiles[i] || q.done || q.locked || q.picked.includes(i) || (q.glow >= 0 && i !== q.glow)) return;
  const at = q.picked.length;
  if (at >= q.slots.length) return;
  const t = q.tiles[i];
  Sound.tap();
  if (t.l === q.slots[at]) {
    q.picked.push(i);
    q.glow = -1;
    showSpelled(q);
    Sound.say([t.sound]);
    // A moment to see the last letter before the answer.
    if (q.picked.length === q.slots.length) { q.locked = true; q.turn = (q.turn || 0) + 1; later(700, () => checkSpell(q)); }
    return;
  }
  // A wrong tile hops into the blank, shakes and hops back.
  reviewRecord(q, false);
  q.misses++;
  q.slotMiss[at] = (q.slotMiss[at] || 0) + 1;
  Sound.oops();
  const slot = ui.clue.querySelectorAll('.spell-word .slot')[at];
  const tile = ui.choices.children[i];
  slot.textContent = t.l;
  slot.classList.add('bad');
  tile.classList.add('wrong');
  const twice = q.slotMiss[at] >= 2;
  if (twice) {
    q.helped = true;
    q.glow = q.tiles.findIndex((x, j) => x.l === q.slots[at] && !q.picked.includes(j));
  }
  later(650, () => {
    if (state.question !== q) return;
    tile.classList.remove('wrong');
    showSpelled(q);
  });
  const parts = [t.sound, { pause: 350 }].concat(twice ? q.need(at) : q.teach());
  ui.text.textContent = shownText(parts);
  listen(q, parts, 6000);
}

function checkSpell(q) {
  if (state.question !== q || q.done) return;
  q.locked = false;
  const word = ui.clue.querySelector('.spell-word');
  if (q.helped) { finishShown(q, word); return; }
  reviewRecord(q, true);
  answeredRight(q, word);
}

// Typing works too: a letter key taps its tile.
function spellKey(key) {
  const q = state.question;
  if (!/^[a-z]$/i.test(key)) return;
  const i = q.tiles.findIndex((t, j) => t.l === key.toLowerCase() && !q.picked.includes(j) && (q.glow < 0 || j === q.glow));
  if (i >= 0) spellTap(i);
}

// Fairy dust: a little for every right answer here. She feeds it to her
// fairy friend in her room, which makes it grow (js/friend.js).
function addDust() {
  const [lo, hi] = FAIRY_DUST;
  const n = lo + Math.floor(Math.random() * (hi - lo + 1));
  state.dust += n;
  renderDust(true);
  showPlace(isCaptain() ? `⚡ 배터리 ${n}개!` : `✨ 요정의 가루 ${n}개!`);
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

// A portrait with room above the head for a fairy friend (heroPortrait
// asks for it when one is worn or given, so "now" and "after" stay the
// same size), and the fairy in it if she has one on.
const FAIRY_ROOM = 13;
function withFairy(sprite, outfit, riding) {
  const cv = makeCanvas(sprite.canvas.width, sprite.canvas.height + FAIRY_ROOM);
  const ctx = cv.getContext('2d');
  ctx.drawImage(sprite.canvas, 0, FAIRY_ROOM);
  if (FAIRIES[outfit.fairy] && outfit.fairy !== 'none') {
    const f = fairySprite(outfit.fairy, 0);
    let x = riding ? 15 : 13;
    let y = riding ? 7 : 1;
    // Over the robot's head: it is wider, and sits in its car's seat.
    if (isCaptain()) {
      const seat = riding && captainCarSprite(outfit.ride, 0, true).seat;
      x = sprite.ax + (seat ? captainCarSeat(outfit.ride).x : 0) + 2;
      y = 1 + (seat ? Math.max(0, seat.y - captainHeroWaist(outfit)) : 0);
    }
    ctx.drawImage(f.canvas, x - f.ax, y);
  }
  return { canvas: cv, ax: sprite.ax, ay: sprite.ay + FAIRY_ROOM };
}

// Her fairy floats above her head, a little behind her, bobbing and
// trailing after her when she moves. `p` is the hero's ground point.
function drawFairyFriend(p, riding, now) {
  const key = state.outfit.fairy;
  if (!FAIRIES[key] || key === 'none') return;
  const h = state.hero;
  // The robot stands 4 pixels taller than the princess.
  const tall = isCaptain() && !riding ? 4 : 0;
  const goal = { x: p.x + (h.flip ? 7 : -7), y: p.y - (riding ? 41 : 39) - tall + Math.sin(now / 320) * 2 };
  const f = state.fairyAt || (state.fairyAt = { x: goal.x, y: goal.y, t: now });
  const k = Math.min(1, Math.max(0, now - f.t) / 1000 * 4);
  f.t = now;
  f.x += (goal.x - f.x) * k;
  f.y += (goal.y - f.y) * k;
  // A friend that has grown wears a crown and loops the loop (js/friend.js).
  const sprite = friendSprite(key, Math.floor(now / 110) % 2);
  const d = friendFly(f, key, now);
  drawFlying(vctx, sprite, f.x + d.x, f.y + d.y, h.flip !== d.flip);
  // A trail of sparkles while she is catching up.
  if (Math.hypot(goal.x - f.x, goal.y - f.y) > 2 && Math.random() < 0.35) {
    state.particles.push({ x: f.x + (Math.random() - 0.5) * 4, y: f.y + 3, vx: (Math.random() - 0.5) * 10, vy: -10, life: 0.6, color: FAIRIES[key].glow, star: Math.random() < 0.3 });
  }
  friendSparkle(f, key, now);
}

// Soft light around her fairy, and twinkles in the air of the Fairy Village.
function drawFairyGlows(now) {
  const s = state.scale;
  const ctx = sctx;
  ctx.globalCompositeOperation = 'lighter';
  const f = state.fairyAt;
  if (f && FAIRIES[state.outfit.fairy] && state.outfit.fairy !== 'none') {
    const p = toScreen(f.x, f.y);
    const g = friendGlow(state.outfit.fairy); // bigger as it grows
    const r = (g.r + Math.sin(now / 250) * 1.5) * s;
    ctx.globalAlpha = g.a;
    ctx.drawImage(glow(), p.x - r, p.y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  if (state.scene.kind === 'fairy') {
    const cols = isCaptain() ? ['#ffffff', '#9fe8ff', '#fff27a', '#8fffc8', '#c8e0ff'] : ['#ffffff', '#ffd0ec', '#fff2a8', '#d8c8ff', '#c8f4ff'];
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
  // In a room, look up far enough to show the name signs on the wall below
  // the HUD, as long as she stays in the top three quarters of the screen.
  const signs = sc.outdoor ? [] : sc.signs.filter(g => !g.plain).map(g => g.y - 12);
  if (signs.length) y = Math.max(Math.min(y, 0), p.y - vh * 0.75, Math.min(y, Math.min(...signs) - screenBox.hud / state.scale));
  // While she talks, keep her and the person she talks to in the space above
  // the dialog. On an iPad they usually are already; on a phone the dialog
  // covers most of the screen, so the picture moves up as far as needed.
  const top = state.talking ? dialogTop() : 0;
  if (top > 0) {
    const n = tileCenter(sc, state.talking.c, state.talking.r);
    const head = Math.min(p.y, n.y) - 44;
    const feet = Math.max(p.y, n.y) + 4;
    const y0 = y;
    if (feet - head > top - 8) y = (head + feet - top) / 2;
    else if (feet - y > top - 4) y = feet - top + 4;
    else if (head - y < 4) y = head - 4;
    // The scene's bottom edge may go up behind the dialog, but no further.
    y = Math.max(Math.min(y0, 0), Math.min(Math.max(sc.height - vh, sc.height - top), y));
  }
  return { x, y };
}

// The top of the open dialog in world pixels from the top of the view.
function dialogTop() {
  if (ui.dialog.classList.contains('hidden')) return 0;
  return (ui.dialog.getBoundingClientRect().top - screenBox.top) * screenBox.k / state.scale;
}

// CSS pixels to canvas pixels, and where the HUD ends (for room signs).
const screenBox = { top: 0, k: 1, hud: 0 };

// The canvas fills whatever the browser actually shows. On iPad, 100vh is
// taller than the visible area while the toolbar is up, which stretched the
// picture and made taps land below the finger, so measure the element.
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const box = screen.getBoundingClientRect();
  screen.width = Math.round(box.width * dpr);
  screen.height = Math.round(box.height * dpr);
  screenBox.top = box.top;
  screenBox.k = box.height ? screen.height / box.height : dpr;
  screenBox.hud = (document.querySelector('.hud').getBoundingClientRect().bottom - box.top) * screenBox.k;
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

const heroBox = isCaptain() ? { w: ROBOT_W, h: ROBOT_H } : { w: 22, h: 34 };

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
    // A thing she just tapped shakes or hops (js/touch.js).
    const m = o.touchFx && touchMove(o, now);
    if (m) vctx.translate(m.x, m.y);
    if (o.animated) o.animated(vctx, t);
    else vctx.drawImage(o.canvas, o.x, o.y);
    if (m) vctx.translate(-m.x, -m.y);
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
    // A robot showing off a new part is drawn over everything instead
    // (drawCaptainShowOff), out of its car, which waits beside it.
    if (isCaptain() && captainShowing(now)) {
      if (riding) drawSprite(vctx, unicornSprite(state.outfit.ride, 0), p.x + (h.flip ? 9 : -9), p.y + 1, h.flip);
    } else if (riding) drawSprite(vctx, riderSprite(state.outfit, h.frame, isBoy()), p.x, p.y + 1 + bob, h.flip);
    else {
      const sprite = heroSprite(state.outfit, h.frame);
      drawSprite(vctx, sprite, p.x, p.y + 1 + bob, h.flip);
      if (isCaptain()) drawRobotGlint(vctx, state.outfit, sprite, p.x, p.y + 1 + bob, h.flip, now);
    }
    drawFairyFriend(p, riding, now);
  } else {
    const n = ch.npc;
    // A villager calling her over hops (js/guide.js).
    const idle = (Math.sin(now / 400 + n.phase) > 0.6 ? -1 : 0) + guideBob(n, now);
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

// ---- HD-2D finish --------------------------------------------------------

// Tilt-shift softness at the top and bottom, a warm bloom and a soft
// vignette, drawn into the canvas before the signs, bubbles and arrows so
// those stay sharp. FX.level 2 has all of it, 1 drops the tilt-shift, 0 has
// none; it steps down by itself when frames are slow, and ?fx=0, 1 or 2 fixes it.
const FX = { level: 2, auto: true, avg: 16.7, slow: 0, layer: null, key: '' };
{
  const m = /[?&]fx=([012])/.exec(location.search);
  if (m) Object.assign(FX, { level: Number(m[1]), auto: false });
}

// Per kind of scene: two bloom lights [x %, colour, strength] at the top
// left and bottom right, and the vignette [clear up to, colour, strength].
const FX_LOOKS = {
  town: { a: [18, '255,236,190', 0.55], b: [90, '255,170,220', 0.35], edge: [0.58, '90,50,110', 0.32] },
  unicorn: { a: [18, '255,236,190', 0.55], b: [90, '255,170,220', 0.35], edge: [0.55, '255,150,200', 0.35] },
  forest: { a: [20, '160,200,255', 0.5], b: [85, '200,140,255', 0.45], edge: [0.5, '30,20,80', 0.5] },
  dungeon: { a: [20, '140,230,255', 0.45], b: [85, '255,150,240', 0.4], edge: [0.5, '30,20,80', 0.5] },
  fairy: { a: [20, '255,220,245', 0.6], b: [85, '200,180,255', 0.45], edge: [0.58, '220,150,220', 0.3] },
};
const CAPTAIN_FX_LOOKS = {
  town: { a: [18, '255,244,200', 0.5], b: [90, '140,200,255', 0.35], edge: [0.58, '40,80,140', 0.28] },
  unicorn: { a: [18, '255,244,200', 0.5], b: [90, '140,200,255', 0.35], edge: [0.55, '90,150,220', 0.3] },
  dino: { a: [18, '255,240,170', 0.6], b: [90, '255,190,120', 0.35], edge: [0.6, '40,110,60', 0.25] },
  fairy: { a: [20, '255,244,200', 0.55], b: [85, '160,220,255', 0.4], edge: [0.58, '90,150,220', 0.25] },
};

// The bloom and vignette for this scene and screen size, drawn once at a
// quarter of the resolution (they are soft anyway) and scaled up each frame.
function fxLayer() {
  const looks = isCaptain() ? CAPTAIN_FX_LOOKS : FX_LOOKS;
  const kind = state.scene.kind;
  const key = `${screen.width}x${screen.height} ${kind}`;
  if (FX.key === key) return FX.layer;
  const look = looks[kind] || looks.town;
  const w = Math.ceil(screen.width / 4);
  const h = Math.ceil(screen.height / 4);
  const cv = makeCanvas(w, h);
  const g = cv.getContext('2d');
  // Like CSS radial-gradient(ellipse at x y): the box's proportions, reaching
  // its farthest corner at 100%.
  const ellipse = (xp, yp, stops) => {
    const cx = w * xp;
    const cy = h * yp;
    const rx = Math.SQRT2 * Math.max(cx, w - cx);
    const ry = Math.SQRT2 * Math.max(cy, h - cy);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    for (const [at, color] of stops) grad.addColorStop(at, color);
    g.setTransform(1, 0, 0, ry / rx, cx, cy);
    g.fillStyle = grad;
    g.fillRect(-cx, -cy * rx / ry, w, h * rx / ry);
  };
  // The bloom used to be a soft-light blend; a plain, lighter wash costs far
  // less and looks almost the same.
  for (const [[x, rgb, k], y, end] of [[look.a, 0, 0.55], [look.b, 1, 0.6]]) {
    ellipse(x / 100, y, [[0, `rgba(${rgb},${k * 0.45})`], [end, `rgba(${rgb},0)`]]);
  }
  const [clear, rgb, k] = look.edge;
  ellipse(0.5, 0.5, [[0, `rgba(${rgb},0)`], [clear, `rgba(${rgb},0)`], [1, `rgba(${rgb},${k})`]]);
  Object.assign(FX, { layer: cv, key });
  return cv;
}

// Tilt-shift: the top and bottom of the picture drawn again with smoothing,
// which softens it by about one world pixel, fading out toward the middle.
function drawTiltShift() {
  const s = state.scale;
  const n = 6;
  const h = Math.round(screen.height * 0.12 / n);
  sctx.imageSmoothingEnabled = true;
  for (let i = 0; i < n; i++) {
    sctx.globalAlpha = 1 - i / n;
    for (const y of [i * h, screen.height - (i + 1) * h]) sctx.drawImage(view, 0, y / s, view.width, h / s, 0, y, view.width * s, h);
  }
  sctx.globalAlpha = 1;
}

function drawFinish() {
  if (FX.level >= 2) drawTiltShift();
  // Without smoothing: the steps between 4-pixel blocks are far too small to
  // see, and a smoothed full-screen scale-up is several times slower.
  sctx.imageSmoothingEnabled = false;
  if (FX.level >= 1) sctx.drawImage(fxLayer(), 0, 0, screen.width, screen.height);
}

// Older tablets: when frames stay slower than ~45 a second for two seconds,
// drop the costliest effect that is left (stalls like a scene being built
// don't count).
function watchFrames(ms) {
  if (!FX.auto || !FX.level || ms > 250 || document.hidden) return;
  FX.avg += (ms - FX.avg) * 0.1;
  FX.slow = FX.avg > 22 ? FX.slow + ms : 0;
  if (FX.slow > 2000) Object.assign(FX, { level: FX.level - 1, slow: 0, avg: 16.7 });
}

// Text colours from the page's CSS, so the captain edition's blue is used too.
let overlayInk = null;
function inkColors() {
  if (!overlayInk) {
    const css = getComputedStyle(document.body);
    overlayInk = { ink: css.getPropertyValue('--ink').trim() || '#4a2c4f', accent: css.getPropertyValue('--accent-ink').trim() || '#c92a72' };
  }
  return overlayInk;
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

  // House signs and room posters. A tapped one hops.
  for (const sg of sc.signs) {
    const m = sg.touchFx && touchMove(sg, now);
    const p = toScreen(sg.x, sg.y + (m ? m.y : 0));
    if (p.x < -200 || p.y < -200 || p.x > screen.width + 200 || p.y > screen.height + 200) continue;
    const fs = (sg.big ? 22 : 11) * s;
    ctx.font = `800 ${fs}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (!sg.plain) {
      const text = sg.needStars && state.stars < sg.needStars ? `${sg.text} 🔒 ⭐${state.stars}/${sg.needStars}` : sg.text;
      const w = ctx.measureText(text).width + 8 * s;
      const h = 14 * s;
      // A room's name sign stays on screen and below the HUD, so the door
      // it names is never labelled "-아의 방".
      if (!sc.outdoor) {
        p.x = Math.max(w / 2 + 4 * s, Math.min(screen.width - w / 2 - 4 * s, p.x));
        p.y = Math.max(screenBox.hud + h / 2 + 6 * s, Math.min(screen.height - h / 2 - 4 * s, p.y));
      }
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
    const m = d.touchFx && touchMove(d, now);
    const p = toScreen(d.x, d.y + (m ? m.y : 0));
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
      // A gold "!" when a question she missed is ready to try again.
      const back = comeBack(n);
      ctx.fillStyle = back ? '#fff4b8' : '#ffffff';
      ctx.strokeStyle = inkColors().ink;
      ctx.lineWidth = s * 0.8;
      roundRect(ctx, p.x - 7 * s, p.y - 5 * s, 14 * s, 10 * s, 4 * s);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x - 2 * s, p.y + 5 * s - 1);
      ctx.lineTo(p.x, p.y + 8 * s);
      ctx.lineTo(p.x + 2 * s, p.y + 5 * s - 1);
      ctx.fill();
      ctx.fillStyle = back ? '#e0a52a' : inkColors().accent;
      ctx.font = `800 ${7 * s}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(back ? '!' : n.badge ? n.badge : n.letter ? n.letter : n.level === 3 ? '♥' : n.level === 2 ? '★' : '♪', p.x, p.y + 0.5 * s);
    }
  }

  // Ways out of the scene glow softly, with arrows or a lock.
  if (!state.busy) drawExitHints(now);
  drawFairyGlows(now);
  if (!state.busy) drawBookHints(now);
  // The 🎣 over the pond, her friend's ring in her room, the first-steps 👆.
  if (!state.busy) { drawMiniHint(now); drawFriendHint(now); drawGuide(now); }
  // Medals on house signs, the sparkle trail to a gate that just opened.
  drawProgressFx(now);

  // Tap ripples.
  for (const r of state.ripples) {
    // A frame's clock can start a little before the tap was handled.
    const k = Math.max(0, (now - r.t0) / 500);
    ctx.strokeStyle = `rgba(255,255,255,${1 - k})`;
    ctx.lineWidth = 2 * s * (1 - k) + 1;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, (4 + k * 10) * s, (2 + k * 5) * s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Lasers, punches and shields in the Villain Cave; a robot showing off.
  if (isCaptain()) {
    drawCaveFx(now);
    drawCaptainShowOff(now);
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

  // Words and emoji over things she tapped.
  drawTouchShows(now);

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

  // Her fairy friend and the 🎣 over the pond fly over everything.
  if (friendTap(wx, wy) || miniTap(wx, wy)) return;

  // Villagers first: they are small and stand in front of things.
  for (const n of sc.npcs) {
    const p = tileCenter(sc, n.c, n.r);
    if (Math.abs(wx - p.x) < (n.mount || n.unicorn ? 14 : 10) && wy > p.y - 44 && wy < p.y + 4) {
      Sound.tap();
      if (n.mount) {
        const isNext = (c, r) => Math.abs(c - n.c) + Math.abs(r - n.r) === 1;
        if (!walkTo(isNext, getOn)) getOn();
      } else { guideTalked(); talkTo(n); }
      return;
    }
  }

  // Pictures, signs and the hints over ways out are drawn on top of everything.
  if (tapOverlay(sc, wx, wy)) return;

  // Things on the map, the front-most first: the first one that knows what
  // to do with a tap takes it, so a gate in front of a house is the gate.
  // Only the front-most one may just say its word; one behind it can only
  // take her somewhere. Shadows on the ground (faint pixels) don't count.
  const hits = sc.objects.filter(o => !o.background && o.canvas && hitObject(o, wx, wy, 64));
  for (let i = hits.length - 1; i >= 0; i--) if (tapObject(hits[i], wx, wy, i === hits.length - 1)) return;
  // Scenery with nothing to do wiggles; the tap never walks her to a
  // hidden tile behind it.
  if (hits.length) {
    touchNudge(hits[hits.length - 1]);
    return;
  }

  const t = worldToTile(sc, wx, wy);

  // Ways to other places: a link tile, a wall door (tapped on the door
  // itself, such as the castle to the princess's room) or a gate's mat.
  const group = linkAt(sc, t, wx, wy);
  if (group) {
    goLink(group);
    return;
  }

  // Exit mat in a room.
  const exits = sc.exitTiles || (sc.exit ? [sc.exit] : []);
  if (exits.some(x => x.c === t.c && x.r === t.r)) {
    walkTo((c, r) => exits.some(x => x.c === c && x.r === r), leaveRoom);
    return;
  }

  const tile = tileAt(sc, t.c, t.r);
  if (tile && tile.type === 'water') {
    // The town pond is the fisherman's: a tap there goes fishing (js/minigame.js).
    if (!miniGo()) touchWater(wx, wy);
    return;
  }

  if (walkable(sc, t.c, t.r)) walkTo((c, r) => c === t.c && r === t.r);
}

// What a tapped object does. True when it took the tap.
function tapObject(o, wx, wy, front) {
  const sc = state.scene;
  // A staircase walks her to its foot and up (or down); any part of a
  // gate or the cave goes through it.
  if (o.stairs || o.links) {
    goLink(o.stairs || o.links, true);
    return true;
  }
  if (o.kind === 'shop') {
    Sound.tap();
    talkTo(o.keeper);
    return true;
  }
  // The sticker album on its desk in her room (js/album.js).
  if (o.kind === 'album') {
    Sound.tap();
    walkTo((c, r) => o.front.some(f => f.c === c && f.r === r), openAlbum);
    return true;
  }
  // The library's bookcases open the book list, the wardrobe and mirror the wardrobe.
  if (o.kind === 'bookcase' || o.kind === 'wardrobe') {
    Sound.tap();
    walkTo((c, r) => o.front.some(f => f.c === c && f.r === r), o.kind === 'bookcase' ? openLibrary : openWardrobe);
    return true;
  }
  // Buildings with doors: walk to the door and go in.
  const doors = sc.doors.filter(d => d.obj === o);
  if (doors.length) {
    Sound.tap();
    walkTo((c, r) => doors.some(d => d.c === c && d.r === r), () => {
      const here = heroTile();
      enterDoor(doors.find(d => d.c === here.c && d.r === here.r) || doors[0]);
    });
    return true;
  }
  // Everything else says its word (js/touch.js).
  return front && touchObject(o, wx, wy);
}

// Taps on things drawn over the map: wall pictures, signs (a gate's sign
// goes through the gate, a letter poster says its letter) and the padlock
// or bouncing arrow over a way out. True when one took the tap.
function tapOverlay(sc, wx, wy) {
  const d = sc.decor.find(x => Math.abs(wx - x.x) < 10 && Math.abs(wy - x.y) < 10);
  if (d) {
    touchPicture(d);
    return true;
  }
  const font = '"Baloo 2", "Trebuchet MS", sans-serif';
  for (const sg of sc.signs) {
    if (!sg.links && !sg.poster && !sg.react) continue;
    sctx.font = `800 ${sg.big ? 22 : 11}px ${font}`;
    const half = sctx.measureText(sg.text).width / 2 + 4;
    if (Math.abs(wx - sg.x) > half || Math.abs(wy - sg.y) > (sg.big ? 13 : 8)) continue;
    if (sg.links) goLink(sg.links, true);
    else if (sg.poster) touchPoster(sg);
    else touchReact(sg, sg.react, { x: sg.x, y: sg.y }, { x: sg.x, y: sg.y - 14 });
    return true;
  }
  for (const sp of exitSpots(sc)) {
    const locked = sp.link && sp.link.needStars && state.stars < sp.link.needStars;
    if (!locked && sp.dir) continue; // arrows on the ground: the tiles themselves
    const w = tileCenter(sc, sp.c, sp.r);
    if (Math.abs(wx - w.x) > 8 || wy < w.y - 27 || wy > w.y - 6) continue;
    if (sp.link) goLink(sp.tiles, true);
    else walkTo((c, r) => sp.tiles.some(x => x.c === c && x.r === r), leaveRoom);
    return true;
  }
  return false;
}

// The way out a tap on tile t means: a link on that tile, a wall door
// around the tap, or the mat of the gate next to it.
function linkAt(sc, t, wx, wy) {
  const links = sc.links || [];
  const link = links.find(l => l.c === t.c && l.r === t.r) ||
    links.find(l => l.door && Math.abs(wx - l.door.x) < 14 && wy > l.door.y - 32 && wy < l.door.y + 30);
  if (link) return [link];
  const tile = tileAt(sc, t.c, t.r);
  const gate = tile && tile.mat && exitSpots(sc).find(sp => sp.link && sp.tiles.some(l => Math.abs(l.c - t.c) + Math.abs(l.r - t.r) <= 2));
  return gate ? gate.tiles : null;
}

// Goes another way out: a locked one says how many stars it needs, an open
// one walks her to it (whichever of its tiles is nearest) and through.
function goLink(group, tap) {
  const locked = group.find(l => l.needStars && state.stars < l.needStars);
  if (locked) {
    Sound.locked();
    showPlace(`🔒 별 ${locked.needStars}개를 모으면 열려요 (지금 ⭐${state.stars})`);
    Sound.say([{ text: line('locked', { stars: locked.needStars }) }]);
    return;
  }
  if (tap) Sound.tap();
  walkTo((c, r) => group.some(l => l.c === c && l.r === r), () => {
    const here = heroTile();
    followLink(group.find(l => l.c === here.c && l.r === here.r) || group[0]);
  });
}

function worldToTile(sc, wx, wy) {
  const u = (wx - sc.ox - 16) / 16;
  const v = (wy - sc.oy - 8) / 8;
  return { c: Math.round((u + v) / 2), r: Math.round((v - u) / 2) };
}

// ---- Loop ----------------------------------------------------------------

let lastTime = performance.now();
function frame(now) {
  const ms = now - lastTime;
  const dt = Math.min(0.05, ms / 1000);
  lastTime = now;
  if (state.scene) {
    if (!state.paused) updateHero(dt);
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
    drawFinish();
    drawOverlay(now);
    watchFrames(ms);
    guideTick(now, ms); // the idle nudge and the play-time limit (js/guide.js)
  }
  requestAnimationFrame(frame);
}

// ---- Boot ----------------------------------------------------------------

// Picture hints on the word cards, set in the parent panel (js/parent.js).
function setPictures(on) {
  state.pictures = on;
  ui.choices.querySelectorAll('.choice[data-words]').forEach(b => b.classList.toggle('pictures', on));
  save();
}

// Long words get smaller so they fit their card. CSS does it with container
// query units; this covers iPads older than iPadOS 16 and a fallback font
// that runs wider.
function fitWords() {
  for (const w of ui.choices.querySelectorAll('.choice .w')) {
    w.style.fontSize = '';
    const card = getComputedStyle(w.parentElement);
    const room = w.parentElement.clientWidth - parseFloat(card.paddingLeft) - parseFloat(card.paddingRight);
    let px = parseFloat(getComputedStyle(w).fontSize);
    while (w.offsetWidth > room && px > 14) w.style.fontSize = `${px -= 2}px`;
  }
}
new MutationObserver(fitWords).observe(ui.choices, { childList: true, subtree: true });
addEventListener('resize', fitWords);
if (document.fonts) document.fonts.addEventListener('loadingdone', fitWords);

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
  ui.startTitle.textContent = isCaptain() ? `${titleKo()} ${PLAYER.shown}의` : `${PLAYER.shown} ${titleKo()}의`;
  ui.wdTitle.textContent = `${isBoy() ? '👑' : '🎀'} ${titleKo()}님의 옷장`;
  if (isCaptain()) ui.wdTitle.textContent = CAPTAIN_TEXT.workbench();
  document.title = `${ui.startTitle.textContent} ${placeName('game')}`;
  ui.titleChips.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.title === PLAYER.title));
  // Knights, wizards, explorers and captains can be a girl or a boy.
  ui.lookChips.classList.toggle('hidden', !!TITLES[PLAYER.title].look);
  ui.lookChips.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.look === PLAYER.look));
  wearLook();
  drawPortrait(ui.startPreview, heroSprite(state.outfit, 0));
}
document.body.classList.toggle('captain', isCaptain());
document.getElementById('start-game').textContent = placeName('game');
ui.nameInput.value = PLAYER.shown;
ui.spokenInput.value = PLAYER.spoken;
spokenEdited = PLAYER.spoken !== romanize(PLAYER.shown);
for (const [key, t] of Object.entries(TITLES)) {
  if (isCaptain() && key !== 'captain') continue; // the robot edition has one title
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
  showPlace(place('town'));
  Sound.say([{ text: line('start'), pitch: 1.3 }]);
});
requestAnimationFrame(frame);
