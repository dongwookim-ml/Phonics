// The hair salon in town (the princess edition): a pink shop with a striped
// awning and a barber's pole, by the main road south of the houses, its
// hairdresser outside (addTownSalon, from buildTown in js/world.js).
// Tapping either opens the salon card: a tab of hairstyles (HAIR_STYLES)
// and one of hair colours (HAIR_COLORS), each a picture of her with it, at
// SALON_PRICE stars, or free if she has had it before. The one picked shows
// on her in the mirror; the ✂️ button pays and puts it on, and the card
// stays open for another go. Stars spent here are gone from the ⭐ count,
// but the gates and goals count every star she has earned (starsEarned in
// js/game.js), so nothing she opened closes again. Its lines and the
// hairdresser are in js/data.js.

// The salon's footprint (3 x 3 tiles, its door on the front-left face).
const SALON_AT = { c: 15, r: 28 };
const SALON_TABS = ['style', 'hair'];

const salonUi = {
  card: document.getElementById('salon'),
  stars: document.getElementById('salon-stars'),
  msg: document.getElementById('salon-msg'),
  tabs: document.getElementById('salon-tabs'),
  preview: document.getElementById('salon-preview'),
  items: document.getElementById('salon-items'),
  buy: document.getElementById('salon-buy'),
  done: document.getElementById('salon-done'),
};
const salon = { keeper: null, tab: 'style', pick: null };

// ---- In town ------------------------------------------------------------------

// The salon and its hairdresser in the town scene `sc`; the trees round it
// make way, and a little path runs from its door to the road.
function addTownSalon(sc) {
  const S = SALON_AT;
  const gone = o => o.tree && o.c1 >= S.c - 1 && o.c0 <= S.c + 3 && o.r1 >= S.r - 1 && o.r0 <= S.r + 4;
  for (const o of sc.objects.filter(gone)) tileAt(sc, o.c0, o.r0).blocked = false;
  sc.objects = sc.objects.filter(o => !gone(o));
  block(sc, S.c, S.r, 3, 3);
  for (let c = S.c + 1; c <= 18; c++) setTile(sc, c, S.r + 3, 'path');
  const k = boxCorners(sc, S.c, S.r, 3, 3);
  const obj = addObject(sc, { c: S.c, r: S.r, w: 3, d: 3 }, footBounds(sc, S.c, S.r, 3, 3, 110, 12), ctx => drawSalon(ctx, k), { kind: 'salon' });
  const sign = wallPt(wall(k.L, k.B), (k.B.x - k.L.x) / 2, 50);
  sc.signs.push({ x: sign.x, y: sign.y, text: place('salon'), color: '#e0609a' });
  const keeper = makeNpc({ who: '미용사 언니', look: 'stylist', c: S.c, r: S.r + 3 }, null);
  Object.assign(keeper, { salon: true, badge: '✂️' });
  obj.keeper = keeper;
  sc.npcs.push(keeper);
}

// A pink cottage with a pink and white awning over its door and a barber's
// pole beside it. `k` is its footprint's corners.
function drawSalon(ctx, k) {
  drawCottage(ctx, k, { roof: '#ff9cc8', wall: '#fff0f6', door: 'left' });
  const W = wall(k.L, k.B);
  const mid = W.len / 2;
  // The awning: stripes sloping out over the door, scalloped at the front.
  for (let x = mid - 13; x < mid + 13; x++) {
    const col = Math.floor((x - mid + 13) / 3) % 2 ? '#ffffff' : '#ff6fa8';
    wallRect(ctx, W, x, x + 1, 25, 31, col);
    wallRect(ctx, W, x, x + 1, 24 - ((x - mid + 13) % 3 === 1 ? 1 : 0), 25, col);
  }
  wallRect(ctx, W, mid - 13, mid + 13, 30, 31, '#e0609a');
  // The barber's pole: red, white and blue twisting up, gold caps.
  const pole = mid - 17;
  for (let v = 2; v < 20; v++) {
    for (let i = 0; i < 3; i++) {
      const band = (v + i * 2) % 6;
      wallRect(ctx, W, pole + i, pole + i + 1, v, v + 1, band < 2 ? '#e8485a' : band < 4 ? '#ffffff' : '#6fb7ff');
    }
  }
  wallRect(ctx, W, pole - 1, pole + 4, 20, 22, '#ffd34d');
  wallRect(ctx, W, pole - 1, pole + 4, 0, 2, '#ffd34d');
}

// ---- The salon card -------------------------------------------------------------

// What the salon has on a tab: everything in it that suits her.
function salonItems(slot) {
  const items = WARDROBE.find(w => w.slot === slot).items;
  return Object.entries(items)
    .filter(([, item]) => suits(item) && !item.shop)
    .map(([value, item]) => ({ slot, value, item, label: itemLabel(slot, value), price: SALON_PRICE[slot], mine: state.owned[slot].includes(value) }));
}

function openSalon(npc) {
  state.busy = true;
  salon.keeper = npc;
  salon.tab = 'style';
  salonChoose(null);
  renderSalon();
  salonUi.card.classList.remove('hidden');
  const hello = line(`persona-${npc.look}`, {}, PERSONA[npc.look]);
  Sound.say([{ text: hello }, { pause: 300 }, { text: line('salon') }], voiceOf(npc));
}

// The tabs, the pictures on the open one (with their price, or ✓ for hers),
// her in the mirror with the one picked, and the button for it.
function renderSalon() {
  const pick = salon.pick;
  salonUi.stars.textContent = `⭐ ${state.stars}`;
  showInMirror(salonUi.preview, pick);
  const tabs = SALON_TABS.map(slot => WARDROBE.find(w => w.slot === slot));
  renderTabs(salonUi.tabs, tabs, salon.tab, slot => { salon.tab = slot; salonChoose(null); renderSalon(); });
  salonUi.items.innerHTML = '';
  for (const it of salonItems(salon.tab)) {
    const b = pictureButton(it.slot, it.value, true);
    b.classList.add('shop-item');
    b.classList.toggle('on', !!pick && pick.slot === it.slot && pick.value === it.value);
    b.classList.toggle('worn', state.outfit[it.slot] === it.value);
    b.classList.toggle('mine', it.mine);
    b.classList.toggle('dear', !it.mine && it.price > state.stars);
    b.insertAdjacentHTML('beforeend', it.mine ? '<span class="price">✓</span>' : `<span class="price"><span class="coin">⭐</span>${it.price}</span>`);
    b.addEventListener('click', () => {
      Sound.tap();
      salonChoose(it);
      renderSalon();
    });
    salonUi.items.append(b);
  }
  const wearing = !!pick && state.outfit[pick.slot] === pick.value;
  salonUi.buy.classList.toggle('hidden', !pick || wearing);
  if (pick) salonUi.buy.textContent = pick.mine ? '✂️ 이걸로 할래요' : `✂️ ⭐ ${pick.price}개로 바꿀래요`;
}

function salonChoose(it) {
  salon.pick = it || null;
  if (!it) salonUi.msg.textContent = '마음에 드는 머리를 골라 보세요! 💇';
  else if (state.outfit[it.slot] === it.value) salonUi.msg.textContent = '지금 하고 있는 머리예요 💖';
  else salonUi.msg.textContent = it.mine ? '전에 해 본 머리예요. 별 없이 바꿀 수 있어요!' : `${it.label}: 별 ${it.price}개`;
}

// ✂️: too few stars, or the new look, paid for if it is new to her.
function salonBuy() {
  const pick = salon.pick;
  const npc = salon.keeper;
  if (!pick) return;
  if (!pick.mine && state.stars < pick.price) {
    Sound.locked();
    salonUi.msg.textContent = `별이 ${pick.price - state.stars}개 더 필요해요. 문제를 풀고 다시 와요! ⭐`;
    Sound.say([{ text: line('salonPoor') }], voiceOf(npc));
    return;
  }
  if (!pick.mine) {
    // Stars counted as earned first (any not saved yet), then spent.
    Progress.count(state);
    state.stars -= pick.price;
    state.owned[pick.slot].push(pick.value);
  }
  state.outfit = Object.assign({}, state.outfit, { [pick.slot]: pick.value });
  save();
  renderStars(!pick.mine);
  salonChoose(Object.assign({}, pick, { mine: true }));
  salonUi.msg.textContent = '✨ 짜잔! 새 머리 완성!';
  renderSalon();
  Sound.party();
  burstAtHero(30);
  Sound.say([{ pause: 300 }, { text: line('salonDone') }], voiceOf(npc));
}

function closeSalon() {
  salonUi.card.classList.add('hidden');
  state.busy = busyNow(); // js/game.js
  salon.keeper = null;
  salon.pick = null;
}

function salonSetup() {
  if (!salonUi.card) return;
  salonUi.buy.addEventListener('click', salonBuy);
  salonUi.done.addEventListener('click', () => { Sound.tap(); closeSalon(); });
}
salonSetup();
