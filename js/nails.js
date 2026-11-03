// A small nail atelier beside the hair salon. Its manicure is saved separately
// from the hero's outfit: it is visible only on this card's two hands.
const NAIL_AT = { c: 10, r: 28 };
const NAIL_DIGITS = ['thumb', 'index', 'middle', 'ring', 'little'];
const NAIL_SIDES = ['left', 'right'];
// Keep the original five save keys for the left hand. The new right hand
// starts clear, so existing manicures and purchases survive the upgrade.
const NAIL_FINGERS = [...NAIL_DIGITS, ...NAIL_DIGITS.map(f => `right-${f}`)];
const nailKey = (side, digit) => side === 'left' ? digit : `right-${digit}`;
const nailFingerName = finger => I18n.t('nails.fingerName', I18n.t(`nails.side.${finger.startsWith('right-') ? 'right' : 'left'}`), I18n.t(`nails.finger.${finger.replace(/^right-/, '')}`));
const NAIL_SLOTS = ['polish', 'sticker', 'ring'];
const NAIL_PRICE = { polish: 3, sticker: 2, ring: 5 };
const NAIL_ITEMS = {
  polish: {
    clear: { color: '#f7dcd0', free: true }, blush: { color: '#eda9ba', free: true },
    rose: { color: '#d84c7b' }, coral: { color: '#ef816b' }, lavender: { color: '#b29ade' },
    sky: { color: '#8dc7ec' }, mint: { color: '#8acdbc' }, lemon: { color: '#f3d36f' },
    berry: { color: '#885591' },
    glitter: { color: '#c56cab', finish: 'glitter', price: 8 },
    rainbow: { color: '#f38ab6', finish: 'rainbow', price: 10 },
    confetti: { color: '#fff1d5', finish: 'confetti', price: 10 },
    holographic: { color: '#c6b6f2', finish: 'holographic', price: 12 },
    mermaid: { color: '#63c8bf', finish: 'mermaid', price: 12 },
    crystal: { color: '#c1cbfa', finish: 'crystal', price: 14 },
    galaxy: { color: '#493074', finish: 'galaxy', price: 15 },
  },
  sticker: {
    none: { free: true }, heart: {}, star: {}, flower: {}, moon: {},
    butterfly: {}, cherry: {}, bow: {}, smile: {},
  },
  ring: {
    none: { free: true }, gold: { color: '#d9a637' },
    heart: { color: '#dba184', gem: 'heart', stone: '#d44f79' },
    star: { color: '#a4b7c7', gem: 'star', stone: '#f1d274' },
    pearl: { color: '#d9a637', gem: 'pearl', stone: '#fff9f0' },
    violet: { color: '#a4b7c7', gem: 'diamond', stone: '#af8dd3' },
  },
};
const nailHas = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const nailEmpty = () => ({ polish: 'clear', sticker: 'none', ring: 'none', at: 0 });

// Older saves have no manicure. Broken values cannot buy/equip unknown items.
function nailSaved(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const owned = {};
  for (const slot of NAIL_SLOTS) {
    const list = src.owned && Array.isArray(src.owned[slot]) ? src.owned[slot].filter(v => typeof v === 'string') : [];
    owned[slot] = [...new Set(Object.keys(NAIL_ITEMS[slot]).filter(v => NAIL_ITEMS[slot][v].free).concat(list))];
  }
  const fingers = {};
  for (const finger of NAIL_FINGERS) {
    const got = src.fingers && src.fingers[finger];
    const design = fingers[finger] = nailEmpty();
    for (const slot of NAIL_SLOTS) if (got && nailHas(NAIL_ITEMS[slot], got[slot]) && owned[slot].includes(got[slot])) design[slot] = got[slot];
    if (got && Number.isFinite(got.at) && got.at > 0) design.at = got.at;
  }
  return Object.assign({}, src, { owned, fingers });
}

const nailUi = {
  card: document.getElementById('nail-salon'), stars: document.getElementById('nail-stars'),
  hand: document.getElementById('nail-hand'), fingers: document.getElementById('nail-fingers'),
  tabs: document.getElementById('nail-tabs'), items: document.getElementById('nail-items'),
  all: document.getElementById('nail-all'), msg: document.getElementById('nail-msg'),
  buy: document.getElementById('nail-buy'), done: document.getElementById('nail-done'),
};
const nailSalon = { keeper: null, finger: 'middle', tab: 'polish', pick: null, all: false };
const nailTargets = () => nailSalon.all ? NAIL_FINGERS : [nailSalon.finger];
const nailName = (slot, value) => I18n.t(`nails.${slot}.${value}`);
const nailMine = (slot, value) => state.nails.owned[slot].includes(value);
const nailPrice = (slot, value) => NAIL_ITEMS[slot][value].free ? 0 : (NAIL_ITEMS[slot][value].price ?? NAIL_PRICE[slot]);
const nailEscape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Uses the town's native pixel drawing helpers, including a little polish
// bottle sign. The clear path never crosses the lamp at (18, 36).
function addTownNailSalon(sc) {
  const S = NAIL_AT;
  const gone = o => o.tree && o.c1 >= S.c - 1 && o.c0 <= 18 && o.r1 >= S.r - 1 && o.r0 <= S.r + 3;
  for (const o of sc.objects.filter(gone)) tileAt(sc, o.c0, o.r0).blocked = false;
  sc.objects = sc.objects.filter(o => !gone(o));
  block(sc, S.c, S.r, 3, 3);
  for (let c = S.c; c <= 18; c++) setTile(sc, c, S.r + 3, 'path');
  const k = boxCorners(sc, S.c, S.r, 3, 3);
  const obj = addObject(sc, { c: S.c, r: S.r, w: 3, d: 3 }, footBounds(sc, S.c, S.r, 3, 3, 110, 12), ctx => {
    drawCottage(ctx, k, { roof: '#b7a0d5', wall: '#fff3ed', door: 'left' });
    const W = wall(k.L, k.B), mid = W.len / 2;
    for (let x = mid - 13; x < mid + 13; x++) wallRect(ctx, W, x, x + 1, 25, 31, Math.floor((x - mid + 13) / 4) % 2 ? '#fff8ee' : '#8bcbbb');
    wallRect(ctx, W, mid - 13, mid + 13, 24, 26, '#5f9f92');
    wallRect(ctx, W, mid - 23, mid - 12, 10, 22, '#fffaf0');
    wallRect(ctx, W, mid - 21, mid - 14, 11, 17, '#dc7ca5');
    wallRect(ctx, W, mid - 20, mid - 15, 17, 21, '#705271');
    wallRect(ctx, W, mid - 20, mid - 19, 12, 16, '#ffd9e6');
    const R = wall(k.R, k.B);
    for (let i = 0; i < 3; i++) wallRect(ctx, R, 10 + i * 8, 15 + i * 8, 12, 21, ['#ed9db7', '#b19bde', '#8acdbc'][i]);
  }, { kind: 'nail-salon' });
  const sign = wallPt(wall(k.L, k.B), (k.B.x - k.L.x) / 2, 50);
  sc.signs.push({ x: sign.x, y: sign.y, text: I18n.t('nails.title'), color: '#9871b4' });
  const keeper = makeNpc({ who: I18n.t('nails.artist'), look: 'stylist', c: S.c, r: S.r + 3 }, null);
  Object.assign(keeper, { nailSalon: true, badge: '💅' });
  obj.keeper = keeper;
  sc.npcs.push(keeper);
}

// Tiny vector stickers stay crisp when the hand is large, with no font/emoji
// dependency. They are clipped to the nail, and never spill onto the skin.
function nailSticker(value, color) {
  switch (value) {
    case 'heart': return `<path d="M0 11C-24-3-12-19 0-9C12-19 24-3 0 11Z" fill="${color || '#fff8ef'}" stroke="#b74370" stroke-width="1.5"/>`;
    case 'star': return `<path d="M0-15 4-5 15-4 7 3 9 14 0 8-9 14-7 3-15-4-4-5Z" fill="${color || '#ffe18a'}" stroke="#b88836" stroke-width="1.5"/>`;
    case 'flower': return '<g fill="#fff9f1" stroke="#d98dab" stroke-width="1"><circle cy="-10" r="7"/><circle cx="10" cy="-3" r="7"/><circle cx="6" cy="9" r="7"/><circle cx="-6" cy="9" r="7"/><circle cx="-10" cy="-3" r="7"/></g><circle r="5" fill="#ecc75f"/>';
    case 'moon': return '<path d="M7-14C-15-14-19 14 4 15C13 15 17 8 17 3C2 12-7-4 7-14Z" fill="#ffe899" stroke="#b7914c" stroke-width="1.5"/>';
    case 'butterfly': return '<g fill="#d3b7ef" stroke="#805496" stroke-width="1.5"><ellipse cx="-8" cy="-5" rx="8" ry="11" transform="rotate(-20)"/><ellipse cx="8" cy="-5" rx="8" ry="11" transform="rotate(20)"/><ellipse cx="-6" cy="8" rx="6" ry="7"/><ellipse cx="6" cy="8" rx="6" ry="7"/></g><path d="M0-10V12M0-9-4-16M0-9 4-16" fill="none" stroke="#67436b" stroke-width="2"/>';
    case 'cherry': return '<path d="M-7 7Q-6-9 5-13Q7-3 9 9" fill="none" stroke="#478b6a" stroke-width="2.5"/><ellipse cx="10" cy="-10" rx="7" ry="3" fill="#7eae71"/><g fill="#da5674"><circle cx="-8" cy="9" r="7"/><circle cx="9" cy="11" r="7"/></g><path d="M-10 6-8 5M7 8 9 7" stroke="#fff5ee" stroke-width="2"/>';
    case 'bow': return '<path d="M-2 0C-28-24-25 22-2 3L-9 17 0 10 9 17 2 3C25 22 28-24 2 0Z" fill="#e98ba8" stroke="#a84d79" stroke-width="1.5"/><circle r="4" fill="#ffe6ec"/>';
    case 'smile': return '<circle r="15" fill="#ffe18a" stroke="#c89b47" stroke-width="1.5"/><g fill="#654b52"><circle cx="-5" cy="-3" r="1.8"/><circle cx="5" cy="-3" r="1.8"/></g><path d="M-7 4Q0 12 7 4" fill="none" stroke="#654b52" stroke-width="2" stroke-linecap="round"/>';
    case 'pearl': return '<circle r="12" fill="#fff9f0" stroke="#bea993" stroke-width="2"/><circle cx="-4" cy="-5" r="4" fill="#fff"/>';
    case 'diamond': return `<path d="M0-17 14 0 0 17-14 0Z" fill="${color || '#af8dd3'}" stroke="#75588e" stroke-width="2"/><path d="M0-17 0 17M-14 0 14 0" stroke="#f5e8ff" stroke-width="1.5"/>`;
    default: return '';
  }
}

function nailRing(value, x, y, rotation = 0) {
  const item = NAIL_ITEMS.ring[value];
  if (!item || value === 'none') return '';
  return `<g transform="translate(${x} ${y}) rotate(${rotation})" pointer-events="none"><ellipse rx="30" ry="10" fill="none" stroke="#997242" stroke-width="10"/><ellipse rx="30" ry="10" fill="none" stroke="${item.color}" stroke-width="7"/><path d="M-25 4Q0 18 25 4" fill="none" stroke="#fff2c8" stroke-width="2"/>${item.gem ? `<g transform="translate(0 -6) scale(.8)">${nailSticker(item.gem, item.stone)}</g>` : ''}</g>`;
}

// A worn ring has a hidden rear half and a shallow band across the back of
// the finger. The full ellipse above belongs only to the catalog thumbnail.
function nailWornRing(value, pose, skinClip) {
  const item = NAIL_ITEMS.ring[value];
  if (!item || value === 'none') return { back: '', front: '' };
  const [x, y, angle, radius] = pose;
  const transform = `translate(${x} ${y}) rotate(${angle})`;
  const rear = `M${-radius} 0Q0 -8 ${radius} 0`;
  const band = `M${-radius} 0Q0 6 ${radius} 0`;
  const metal = path => `<path d="${path}" fill="none" stroke="#997242" stroke-width="6" stroke-linecap="round"/><path d="${path}" fill="none" stroke="${item.color}" stroke-width="4" stroke-linecap="round"/>`;
  return {
    back: `<g transform="${transform}" pointer-events="none">${metal(rear)}</g>`,
    front: `<g clip-path="url(#${skinClip})" pointer-events="none"><g transform="${transform}"><path d="M${-radius} 2Q0 8 ${radius} 2" fill="none" stroke="#a66f56" stroke-width="7" opacity=".18"/>${metal(band)}<path d="M${-radius + 2} 0Q0 5 ${radius - 2} 0" fill="none" stroke="#fff2c8" stroke-width="1"/>${item.gem ? `<g transform="translate(0 1) scale(.55)">${nailSticker(item.gem, item.stone)}</g>` : ''}</g></g>`,
  };
}

// One finish renderer for the actual nails and their bottle swatches. Artwork
// is mapped into each shape and clipped, so glitter/scales never paint skin.
function nailPolishArt(value, path, id, bounds) {
  const item = NAIL_ITEMS.polish[value] || NAIL_ITEMS.polish.clear;
  const [x, y, w, h] = bounds;
  let defs = '', fill = item.color, art = '';
  const gradient = (colors, attrs = 'x1="0" y1="0" x2="1" y2="1"') => {
    defs += `<linearGradient id="${id}-color" ${attrs}>${colors.map((c, i) => `<stop offset="${i / (colors.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
    fill = `url(#${id}-color)`;
  };
  const sparkle = (cx, cy, r, color = '#fffbe7') => `<path d="M${cx} ${cy-r}Q${cx+1} ${cy-1} ${cx+r*.65} ${cy}Q${cx+1} ${cy+1} ${cx} ${cy+r}Q${cx-1} ${cy+1} ${cx-r*.65} ${cy}Q${cx-1} ${cy-1} ${cx} ${cy-r}Z" fill="${color}"/>`;
  switch (item.finish) {
    case 'rainbow':
      gradient(['#ff697f', '#ffae60', '#ffe178', '#7cd69c', '#66c8ef', '#a593f1', '#f6a5d7'], 'x1="0" y1="0" x2="0" y2="1"');
      art = sparkle(72, 24, 9) + sparkle(27, 73, 6);
      break;
    case 'glitter':
      gradient(['#8a4096', '#ef92c5', '#c069aa', '#e9b263']);
      for (let i = 0; i < 38; i++) art += `<circle cx="${(i * 29 + 11) % 100}" cy="${(i * 43 + 7) % 100}" r="${i % 3 === 0 ? 2.6 : 1.5}" fill="${['#fff4ce', '#fff', '#ffcaed'][i % 3]}"/>`;
      art += sparkle(28, 25, 12) + sparkle(72, 53, 10) + sparkle(36, 82, 7);
      break;
    case 'confetti':
      gradient(['#fff7dd', '#ffe4ef']);
      for (let i = 0; i < 21; i++) {
        const cx = (i * 31 + 9) % 100, cy = (i * 47 + 12) % 100;
        art += `<rect x="${cx}" y="${cy}" width="${i % 2 ? 8 : 5}" height="${i % 2 ? 4 : 9}" rx="1.5" transform="rotate(${i * 37 % 180} ${cx} ${cy})" fill="${['#e9639e', '#55bfc0', '#9a77d5', '#f0ba42', '#ea855c'][i % 5]}"/>`;
      }
      break;
    case 'holographic':
      gradient(['#a986dd', '#d1c4f7', '#92e5dd', '#fff6c6', '#f8b9db', '#b6c0f2', '#e7d3ff']);
      art = '<path d="M-40 60 50-20 72-20-18 60ZM23 120 123 20 132 30 32 130Z" fill="#fff" opacity=".5"/>' + sparkle(64, 28, 9) + sparkle(31, 72, 7);
      break;
    case 'mermaid':
      gradient(['#7c91e6', '#6ddacb', '#a8eed0', '#b79ae5'], 'x1="0" y1="0" x2=".8" y2="1"');
      for (let row = 0; row < 6; row++) for (let col = -1; col < 4; col++) {
        const cx = col * 32 + (row % 2 ? 16 : 0), cy = row * 21 - 8;
        art += `<path d="M${cx} ${cy}q16 28 32 0" fill="none" stroke="#e9fff0" stroke-width="2.4" opacity=".8"/>`;
      }
      art += sparkle(66, 30, 9) + sparkle(28, 75, 6);
      break;
    case 'crystal':
      gradient(['#a899e8', '#e0f7ff', '#b5d5f4', '#eabef0']);
      art = '<path d="M-5 40 40 0 66 44 18 75Z" fill="#fff" opacity=".6"/><path d="M40 0 107 13 66 44Z" fill="#aa95df" opacity=".55"/><path d="M18 75 66 44 85 110Z" fill="#91b2ec" opacity=".45"/><path d="M66 44 110 63 85 110Z" fill="#fff" opacity=".65"/><path d="M40 0 66 44 18 75M66 44 107 13M66 44 110 63M66 44 85 110" fill="none" stroke="#fff" stroke-width="1.8" opacity=".8"/>' + sparkle(65, 43, 11);
      break;
    case 'galaxy':
      gradient(['#191e53', '#65418d', '#b75bba', '#344c8b', '#18264b']);
      art = '<path d="M-15 92Q35 19 113 10L110 40Q43 41 8 114Z" fill="#da9be6" opacity=".35"/>';
      for (let i = 0; i < 16; i++) art += `<circle cx="${(i * 37 + 14) % 100}" cy="${(i * 53 + 8) % 100}" r="1.5" fill="#f6efff"/>`;
      art += sparkle(29, 26, 11) + sparkle(72, 58, 8) + sparkle(42, 83, 6);
      break;
  }
  return `<defs>${defs}<clipPath id="${id}-clip"><path d="${path}"/></clipPath></defs><path d="${path}" fill="${fill}"/>${art ? `<g clip-path="url(#${id}-clip)" pointer-events="none"><g transform="translate(${x} ${y}) scale(${w / 100} ${h / 100})">${art}</g></g>` : ''}`;
}

function nailDesign(finger) {
  const design = Object.assign({}, state.nails.fingers[finger]);
  if (nailSalon.pick && nailTargets().includes(finger)) design[nailSalon.tab] = nailSalon.pick;
  return design;
}

function renderNailHand() {
  // A relaxed back-of-hand pose: a longer middle finger, gently splayed
  // fingers, a rounded palm and an inward thumb. Mirror the outline for its
  // partner, while each nail keeps its own saved design and hit target.
  const outline = 'M15 530L57 395Q65 372 51 348Q38 327 40 292L42 239L23 131Q18 112 29 108Q43 102 47 123L66 219Q70 235 76 222L79 91Q79 70 93 69Q108 68 109 89L112 217Q113 231 121 219L138 54Q140 32 156 34Q173 36 171 57L162 223Q161 237 170 227L203 93Q208 73 223 77Q239 81 233 103L207 268Q204 285 211 293L256 239Q270 223 284 232Q298 242 287 261L251 326Q240 347 217 367Q202 382 200 401L193 530Z';
  const poses = { thumb: [276, 247, 34], index: [219, 96, 14], middle: [154, 54, 5], ring: [94, 88, -2], little: [35, 127, -12] };
  // Centers sit on the proximal finger segments, above the webbing. Widths
  // follow each segment's outline, rather than using one ring size for all.
  const ringPoses = { thumb: [241, 295, 34, 24], index: [195, 212, 12, 20.5], middle: [145, 177, 5, 19.5], ring: [94, 182, 0, 17], little: [47, 194, -12, 13.5] };
  const nailPath = 'M-10-6Q-10-19 0-19Q10-19 10-6L10 11Q0 17-10 11Z';
  let hands = '';
  for (const side of NAIL_SIDES) {
    let nails = '', ringsBack = '', ringsFront = '';
    const skinClip = `nail-hand-clip-${side}`;
    for (const digit of NAIL_DIGITS) {
      const finger = nailKey(side, digit);
      const [x, y, rotate] = poses[digit], d = nailDesign(finger);
      const chosen = nailTargets().includes(finger);
      const label = nailEscape(I18n.t('nails.chooseFinger', nailFingerName(finger)));
      nails += `<g class="nail-finger${chosen ? ' selected' : ''}" data-finger="${finger}" role="button" tabindex="0" aria-label="${label}" aria-pressed="${chosen}" transform="translate(${x} ${y}) rotate(${rotate})"><rect x="-19" y="-25" width="38" height="49" rx="16" fill="transparent"/><path class="nail-selection" d="${nailPath}" transform="scale(1.28)" fill="none"/>${nailPolishArt(d.polish, nailPath, `nail-paint-${finger}`, [-10, -19, 20, 36])}<path d="${nailPath}" fill="none" stroke="#bb8573" stroke-width="1.5"/><path d="M-6-5Q-6-12-3-13" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="2.5" stroke-linecap="round"/><clipPath id="nail-clip-${finger}"><path d="${nailPath}"/></clipPath><g clip-path="url(#nail-clip-${finger})"><g transform="translate(0 -1) scale(.46)">${nailSticker(d.sticker)}</g></g></g>`;
      const worn = nailWornRing(d.ring, ringPoses[digit], skinClip);
      ringsBack += worn.back; ringsFront += worn.front;
    }
    hands += `<g class="nail-hand-pose" data-hand="${side}" transform="${side === 'left' ? 'translate(60 10)' : 'translate(660 10) scale(-1 1)'}"><defs><clipPath id="${skinClip}" clipPathUnits="userSpaceOnUse"><path d="${outline}"/></clipPath></defs>${ringsBack}<path d="${outline}" fill="#f6d1c9" stroke="#b9856d" stroke-width="2.5" stroke-linejoin="round"/>${ringsFront}${nails}</g>`;
  }
  nailUi.hand.innerHTML = `<svg viewBox="0 0 720 555" role="group" aria-label="${nailEscape(I18n.t('nails.hand'))}">${hands}</svg>`;
  nailUi.fingers.replaceChildren();
  for (const side of NAIL_SIDES) {
    const row = document.createElement('div'); row.className = 'nail-finger-row';
    row.setAttribute('role', 'group'); row.setAttribute('aria-label', I18n.t(`nails.side.${side}`));
    const label = document.createElement('span'); label.className = 'nail-side-label';
    label.textContent = I18n.t(`nails.side.${side}`); row.append(label);
    for (const digit of NAIL_DIGITS) {
      const finger = nailKey(side, digit), b = document.createElement('button');
      b.className = 'nail-finger-choice'; b.dataset.finger = finger;
      b.textContent = I18n.t(digit === 'little' ? 'nails.littleShort' : `nails.finger.${digit}`);
      b.setAttribute('aria-label', I18n.t('nails.chooseFinger', nailFingerName(finger)));
      b.setAttribute('aria-pressed', String(nailTargets().includes(finger)));
      b.addEventListener('click', () => nailSelectFinger(finger));
      row.append(b);
    }
    nailUi.fingers.append(row);
  }
}

function nailItemArt(slot, value) {
  const item = NAIL_ITEMS[slot][value];
  if (value === 'none' || (slot === 'polish' && value === 'clear')) return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="19" fill="#fff9f4" stroke="#beadb9" stroke-width="3"/><path d="M20 44 44 20" stroke="#beadb9" stroke-width="3"/></svg>';
  if (slot === 'polish') {
    const bottle = 'M24 25H40Q50 25 50 35V47Q50 57 40 57H24Q14 57 14 47V35Q14 25 24 25Z';
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${nailPolishArt(value, bottle, `nail-bottle-${value}`, [14, 25, 36, 32])}<path d="${bottle}" fill="none" stroke="#705571" stroke-width="2"/><rect x="22" y="7" width="20" height="22" rx="4" fill="#705571"/><path d="M22 35V46" stroke="#fff" stroke-opacity=".65" stroke-width="3" stroke-linecap="round"/></svg>`;
  }
  if (slot === 'sticker') return `<svg viewBox="-25 -25 50 50" aria-hidden="true">${nailSticker(value)}</svg>`;
  return `<svg viewBox="-40 -28 80 68" aria-hidden="true">${nailRing(value, 0, 4)}</svg>`;
}

function openNailSalon(keeper) {
  if (guideTimeUp()) { closeNailSalon(); return; }
  state.busy = true;
  Object.assign(nailSalon, { keeper, finger: 'middle', tab: 'polish', pick: null, all: false });
  renderNailSalon();
  nailUi.card.classList.remove('hidden');
  // Already recorded for the hairdresser; does not mention hair or a mirror.
  Sound.say([{ text: 'Which one would you like to try?' }], voiceOf(keeper));
}

function nailSelectFinger(finger, source = 'button') {
  if (!NAIL_FINGERS.includes(finger)) return;
  Sound.tap();
  Object.assign(nailSalon, { finger, pick: null, all: false });
  renderNailSalon();
  nailUi.card.querySelector(`${source === 'svg' ? '#nail-hand' : '#nail-fingers'} [data-finger="${finger}"]`).focus({ preventScroll: true });
}

function renderNailSalon() {
  nailUi.stars.textContent = `⭐ ${state.stars}`;
  renderNailHand();
  nailUi.tabs.replaceChildren();
  for (const slot of NAIL_SLOTS) {
    const b = document.createElement('button'); b.className = 'nail-tab';
    b.textContent = I18n.t(`nails.tab.${slot}`); b.setAttribute('role', 'tab');
    b.dataset.slot = slot; b.id = `nail-tab-${slot}`; b.setAttribute('aria-controls', 'nail-items');
    b.setAttribute('aria-selected', String(slot === nailSalon.tab));
    b.addEventListener('click', () => { Sound.tap(); nailSalon.tab = slot; nailSalon.pick = null; renderNailSalon(); nailUi.tabs.querySelector(`[data-slot="${slot}"]`).focus({ preventScroll: true }); });
    nailUi.tabs.append(b);
  }
  const slot = nailSalon.tab;
  nailUi.items.setAttribute('aria-labelledby', `nail-tab-${slot}`);
  nailUi.items.replaceChildren();
  for (const [value, item] of Object.entries(NAIL_ITEMS[slot])) {
    const mine = nailMine(slot, value), price = nailPrice(slot, value);
    const current = nailTargets().every(f => state.nails.fingers[f][slot] === value);
    const b = document.createElement('button');
    b.className = `nail-item${mine ? ' mine' : ''}${!mine && price > state.stars ? ' dear' : ''}`;
    b.dataset.value = value; b.setAttribute('aria-pressed', String(nailSalon.pick === value));
    b.setAttribute('aria-label', I18n.t(mine ? 'nails.ownedItem' : 'nails.pricedItem', nailName(slot, value), price));
    b.innerHTML = `${nailItemArt(slot, value)}<span class="nail-item-name">${nailEscape(nailName(slot, value))}</span><span class="nail-price">${mine ? I18n.t(current ? 'nails.wearing' : 'nails.owned') : `⭐ ${price}`}</span>`;
    b.addEventListener('click', () => { Sound.tap(); nailSalon.pick = value; renderNailSalon(); nailUi.items.querySelector(`[data-value="${value}"]`).focus({ preventScroll: true }); });
    nailUi.items.append(b);
  }
  nailUi.all.setAttribute('aria-pressed', String(nailSalon.all));
  nailUi.all.textContent = I18n.t(nailSalon.all ? 'nails.allSelected' : 'nails.applyAll');
  const pick = nailSalon.pick;
  const current = pick && nailTargets().every(f => state.nails.fingers[f][slot] === pick);
  nailUi.buy.disabled = !pick || current;
  if (!pick) {
    nailUi.msg.textContent = I18n.t('nails.choose', nailSalon.all ? I18n.t('nails.allFingers') : nailFingerName(nailSalon.finger));
    nailUi.buy.textContent = I18n.t('nails.apply');
  } else {
    const mine = nailMine(slot, pick), price = nailPrice(slot, pick);
    nailUi.msg.textContent = current ? I18n.t('nails.alreadyApplied') : mine ? I18n.t('nails.reuseFree') : I18n.t('nails.unlock', nailName(slot, pick), price);
    nailUi.buy.textContent = I18n.t(mine ? 'nails.apply' : 'nails.buyApply', price);
  }
}

function nailApply() {
  const { tab, pick } = nailSalon;
  if (state.paused || nailUi.card.classList.contains('hidden') || !pick || !nailHas(NAIL_ITEMS[tab], pick)) return;
  if (guideTimeUp()) { closeNailSalon(); return; }
  const targets = nailTargets();
  if (targets.every(f => state.nails.fingers[f][tab] === pick)) return;
  const mine = nailMine(tab, pick), price = nailPrice(tab, pick);
  if (!mine && state.stars < price) {
    Sound.locked();
    nailUi.msg.textContent = I18n.t('nails.needStars', price - state.stars);
    return;
  }
  if (!mine) {
    Progress.count(state);
    state.stars -= price;
    state.nails.owned[tab].push(pick);
  }
  const at = Math.max(Date.now(), ...NAIL_FINGERS.map(f => state.nails.fingers[f].at + 1));
  for (const finger of targets) state.nails.fingers[finger] = Object.assign({}, state.nails.fingers[finger], { [tab]: pick, at });
  save(); renderStars(!mine); renderNailSalon();
  nailUi.msg.textContent = I18n.t('nails.finished');
  Sound.party();
}

function closeNailSalon() {
  nailUi.card.classList.add('hidden');
  nailSalon.pick = null; nailSalon.keeper = null;
  state.busy = busyNow();
}
function nailRefresh() {
  if (!nailUi.card.classList.contains('hidden')) renderNailSalon();
}
function nailSetup() {
  nailUi.hand.addEventListener('click', e => { const g = e.target.closest('[data-finger]'); if (g) nailSelectFinger(g.dataset.finger, 'svg'); });
  nailUi.hand.addEventListener('keydown', e => { const g = e.target.closest('[data-finger]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nailSelectFinger(g.dataset.finger, 'svg'); } });
  nailUi.tabs.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const at = NAIL_SLOTS.indexOf(nailSalon.tab), next = (at + (e.key === 'ArrowRight' ? 1 : 2)) % 3;
    nailUi.tabs.querySelector(`[data-slot="${NAIL_SLOTS[next]}"]`).click();
  });
  nailUi.all.addEventListener('click', () => { Sound.tap(); nailSalon.all = !nailSalon.all; renderNailSalon(); });
  nailUi.buy.addEventListener('click', nailApply);
  nailUi.done.addEventListener('click', () => { Sound.tap(); closeNailSalon(); });
}
nailSetup();
