// The hair salon in town (the princess edition): a pink shop with a striped
// awning and a large scissors sign on the fountain square, its
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
const SALON_AT = TOWN_MARKET.salon;
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
  const keeper = makeNpc({ who: I18n.t('salon.hairdresser'), look: 'stylist', c: S.c + 1, r: S.r + 4 }, null);
  Object.assign(keeper, { salon: true, badge: '✂️' });
  addMarketStore(sc, 'salon', keeper);
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
  if (pick) salonUi.buy.textContent = pick.mine ? I18n.t('salon.chooseThisLook') : I18n.t('salon.changeForStars', pick.price);
}

function salonChoose(it) {
  salon.pick = it || null;
  if (!it) salonUi.msg.textContent = I18n.t('salon.chooseAHairstyleYouLike');
  else if (state.outfit[it.slot] === it.value) salonUi.msg.textContent = I18n.t('salon.thisIsYourCurrentHairstyle');
  else salonUi.msg.textContent = it.mine ? I18n.t('salon.youVeWornThisBeforeChange') : I18n.t('salon.stars', it.label, it.price);
}

// ✂️: too few stars, or the new look, paid for if it is new to her.
function salonBuy() {
  const pick = salon.pick;
  const npc = salon.keeper;
  if (!pick) return;
  if (!pick.mine && state.stars < pick.price) {
    Sound.locked();
    salonUi.msg.textContent = I18n.t('salon.youNeedMoreStarsAnswerSome', pick.price - state.stars);
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
  salonUi.msg.textContent = I18n.t('salon.taDaYourNewHairstyle');
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
