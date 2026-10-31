// Hero kits: each title the princess edition offers (TITLES in js/data.js:
// princess, prince, queen, king, knight, fairy, wizard, explorer, captain)
// is a character of its own: its own body and face (`base`), and its own
// things to wear in the wardrobe, as presents, in the shop and at the salon.
// One kit per title, each in its own file (js/heroes/<title>.js), registered
// with addHeroKit(); its names are in js/locales (heroes.<title>.<key>).
//
// The hero is drawn on one 22 x 34 canvas for every kit (the anchor, the
// rider on her unicorn, the dialog portrait and the wardrobe pictures all
// rely on it): an 18-pixel grid 2 px from the left and 5 px from the top.
// Rows 0-12 are her head (hair and face), rows 13-17 her shoulders and body,
// then 10 rows of what she wears below (`bottom`), her feet on the last row
// (the anchor, OYp + 28). Head things may go up to 5 px above the grid.
//
// A kit:
//   looks      ['girl'], ['boy'] or ['girl', 'boy'] (as TITLES allows)
//   base       { girl: { top, back, front }, boy: ... }: `top` the 18 rows
//              of her head and body (18 wide); `back` / `front` bitmaps
//              drawn behind her / over her ([x, y, rows] on the grid): a
//              beard, pointed ears, a fairy's own little wings...
//   palette    (outfit, look, base) => letters to colours: `base` is the
//              usual one for the look (heroPalette); add to it or change it
//   items      { shape, head, hand, back, style }: { key: item } with
//              name: I18n.t('heroes.<title>.<key>'), icon, the usual flags
//              (girl / boy for one look only; forest / unicorn / fairy:
//              given in that village only; shop: sold in the shop only;
//              price) and its art:
//                shape  art: { bottom: 10 rows, top: { 13..17: row } (or
//                       [rows 13..17]), walk: { row: pixels } | 'legs' |
//                       'feet', ride: 'skirt' | { flap, cloth, hem, leg,
//                       sock, boot } (palette letters, see drawRideLeg) }
//                head   art: { x, y, rows } on the grid (y may be -5)
//                hand   art: { x, y, rows }
//                back   art: { wings: [rows, palette, y] } (a mirrored pair)
//                       | { cape: { cloth, edge, stars, clasp } }
//                       | { x, y, rows, front } (front: over her)
//                style  art: as HAIR_STYLE_ART (rows / back / front / short)
//              Keys are unique across the whole game: start them with the
//              title ('queen-gown').
//   uses       { slot: [keys] }: things that already exist that it wears too
//   defaults   { girl: outfit, boy: outfit }: what it starts in
//
// Hair and dress colours (HAIR_COLORS, DRESS_COLORS) are everyone's; a
// kit's art uses the palette letters h H (hair) and d D L t (dress) so they
// apply. Fairy friends, unicorns and treasures are everyone's too.

const HERO_KITS = {};
const HERO_SLOTS = { shape: DRESS_SHAPES, head: HEADWEAR, hand: HAND_ITEMS, back: BACK_ITEMS, style: HAIR_STYLES };

function addHeroKit(title, kit) {
  if (isCaptain() || !TITLES[title]) return; // the robot edition has its own hero (js/captain-hero.js)
  kit.id = title;
  kit.looks = kit.looks || (TITLES[title].look ? [TITLES[title].look] : ['girl', 'boy']);
  for (const [slot, table] of Object.entries(HERO_SLOTS)) {
    for (const [key, item] of Object.entries((kit.items || {})[slot] || {})) {
      if (table[key]) throw new Error(`hero kit ${title}: ${slot} "${key}" is already taken`);
      table[key] = Object.assign({}, item, { kits: [title] });
      if (slot === 'style' && item.art) HAIR_STYLE_ART[key] = item.art;
    }
    for (const key of ((kit.uses || {})[slot] || [])) {
      if (!table[key]) throw new Error(`hero kit ${title}: no ${slot} "${key}" to use`);
      table[key].kits = (table[key].kits || []).concat(title);
    }
  }
  HERO_KITS[title] = kit;
}

// The hero's kit (by her title), and her look in it.
const heroKit = () => HERO_KITS[PLAYER.title] || HERO_KITS[PLAYER.look === 'boy' ? 'prince' : 'princess'];
// Which outfit is hers now (state.looks): a title she can be as a girl or
// a boy keeps one for each. A princess's and a prince's are the old 'girl'
// and 'boy' ones.
function heroKey() {
  const t = PLAYER.title;
  if (t === 'princess') return 'girl';
  if (t === 'prince') return 'boy';
  return TITLES[t] && TITLES[t].look ? t : `${t}-${PLAYER.look}`;
}

// The usual colours for a look: a girl's (the princess's) or a boy's.
function heroPalette(outfit, look) {
  if (look === 'boy') return boyPalette(outfit);
  const dress = (DRESS_COLORS[outfit.dress] || DRESS_COLORS.pink).c;
  const hair = (HAIR_COLORS[outfit.hair] || HAIR_COLORS.brown).c;
  return Object.assign({}, HERO_EXTRA, {
    o: '#4a2c4f', h: hair[0], H: hair[1], s: '#ffe3d0', k: '#3a2340', p: '#ffadbc', m: '#e0707a',
    d: dress[0], D: dress[1], L: dress[2], t: dress[3], f: '#c0507a',
    y: '#ffd34d', Y: '#e0a52a', g: '#ff5fa0', b: '#6fb7ff', r: '#ff6fa8', R: '#e04a8a', w: '#ffffff', G: '#5fc46a',
  });
}

// A shape's art: the kit's own, or the princess's skirts and the boy's
// bottoms it already had.
function shapeArt(key, look) {
  const item = DRESS_SHAPES[key];
  if (item && item.art) return item.art;
  if (look === 'boy') {
    if (!BOY_BOTTOMS[key]) return null;
    return { bottom: BOY_BOTTOMS[key], top: BOY_TOPS[key], walk: 'legs', ride: Object.assign({}, BOY_RIDE[key] || BOY_RIDE.tunic) };
  }
  if (!PRINCESS_SKIRTS[key]) return null;
  return { bottom: PRINCESS_SKIRTS[key], top: PRINCESS_TOPS[key], walk: PRINCESS_WALK[key] || 'feet', ride: 'skirt' };
}
const headArt = (key, look) => (HEADWEAR[key] && HEADWEAR[key].art) || (look === 'boy' ? BOY_HEAD_ITEMS : HEAD_ITEMS)[key] || null;
const handArt = (key, look) => (HAND_ITEMS[key] && HAND_ITEMS[key].art) || (look === 'boy' ? BOY_HAND_BITMAPS : HAND_BITMAPS)[key] || null;

// Her bottom rows for the second walking frame.
function walkRows(rows, walk) {
  const out = rows.slice();
  if (walk === 'legs') {
    if (out[9] === BOY_BOTTOMS.robe[9]) out[9] = BOY_FEET_B;
    else out.splice(7, 3, boyStep(out[7]), boyStep(out[8]), '....oooo..oooo....');
  } else if (walk && typeof walk === 'object') {
    if (out[9] === PRINCESS_SKIRTS.ballgown[9]) out[9] = PRINCESS_FEET_B;
    Object.assign(out, walk);
  } else if (out[9] === PRINCESS_SKIRTS.ballgown[9]) out[9] = PRINCESS_FEET_B;
  return out;
}

const kitCache = new Map();

// The hero of `kit` as `look`, in `outfit`, walk frame 0 or 1: { canvas, ax, ay }.
function kitSprite(kit, look, outfit, frame) {
  const key = `${kit.id}|${look}|${outfit.dress}|${outfit.shape}|${outfit.head}|${outfit.hand}|${outfit.hair}|${outfit.style}|${outfit.back}|${frame}`;
  if (kitCache.has(key)) return kitCache.get(key);
  const W = 22;
  const H = 34;
  const OXp = 2;
  const OYp = 5;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  const base = (kit.base && kit.base[look]) || {};
  const pal0 = heroPalette(outfit, look);
  const pal = kit.palette ? kit.palette(outfit, look, pal0) || pal0 : pal0;
  const def = (kit.defaults && kit.defaults[look]) || {};
  const shape = shapeArt(outfit.shape, look) || shapeArt(def.shape, look) || shapeArt(look === 'boy' ? 'tunic' : 'ballgown', look);
  const bottom = frame === 1 ? walkRows(shape.bottom, shape.walk) : shape.bottom.slice();
  const tops = shape.top || {};
  const body = base.top || (look === 'boy' ? BOY_TOP : PRINCESS_TOP);
  const cut = HAIR_STYLE_ART[outfit.style] || HAIR_STYLE_ART[def.style] || HAIR_STYLE_ART[look === 'boy' ? 'short' : 'long'];
  const top = styledTop(body.map((row, i) => (Array.isArray(tops) ? tops[i - 13] : tops[i]) || row), cut);
  drawHeroBack(ctx, outfit.back, OXp, OYp, W, pal);
  drawHairBits(ctx, base.back, pal, OXp, OYp);
  drawHairBits(ctx, cut.back, pal, OXp, OYp);
  drawBitmap(ctx, top, pal, OXp, OYp);
  drawBitmap(ctx, bottom, pal, OXp, OYp + top.length);
  drawHairBits(ctx, cut.front, pal, OXp, OYp);
  drawHairBits(ctx, base.front, pal, OXp, OYp);
  const backArt = BACK_ITEMS[outfit.back] && BACK_ITEMS[outfit.back].art;
  if (backArt && backArt.front) drawBitmap(ctx, backArt.rows, Object.assign({}, pal, backArt.pal), OXp + backArt.x, OYp + backArt.y);
  const head = headArt(outfit.head, look);
  if (head) drawBitmap(ctx, head.rows, Object.assign({}, pal, head.pal), OXp + head.x, OYp + head.y);
  const hand = handArt(outfit.hand, look);
  if (hand) drawBitmap(ctx, hand.rows, Object.assign({}, pal, hand.pal), OXp + hand.x, OYp + hand.y);
  const sprite = { canvas: cv, ax: OXp + 9, ay: OYp + 28, pal, ride: shape.ride };
  kitCache.set(key, sprite);
  return sprite;
}

// What she wears below, hanging over a unicorn's side: a skirt in her
// dress colours, or cloth, a leg and a boot (`r`: palette letters).
function drawRideLeg(ctx, sx, sy, outfit, pal, r) {
  if (!r || r === 'skirt') {
    const dress = (DRESS_COLORS[outfit.dress] || DRESS_COLORS.pink).c;
    for (let y = 0; y < 5; y++) {
      const w = 10 + Math.min(y, 2) * 2;
      const x0 = sx - Math.min(y, 2);
      px(ctx, x0, sy + y, w, 1, y === 4 ? dress[3] : y > 2 ? dress[1] : dress[0]);
      px(ctx, x0 - 1, sy + y, 1, 1, '#4a2c4f');
      px(ctx, x0 + w, sy + y, 1, 1, '#4a2c4f');
    }
    px(ctx, sx - 2, sy + 5, 14, 1, '#4a2c4f');
    px(ctx, sx + 2, sy + 1, 2, 1, dress[2]);
    px(ctx, sx + 6, sy + 6, 2, 2, outfit.shape === 'mermaid' ? dress[3] : pal.f || '#c0507a');
    px(ctx, sx + 5, sy + 6, 1, 2, '#4a2c4f');
    px(ctx, sx + 8, sy + 6, 1, 2, '#4a2c4f');
    px(ctx, sx + 6, sy + 8, 2, 1, '#4a2c4f');
    return;
  }
  drawBoyLeg(ctx, sx, sy, outfit, pal, r);
}

const kitRiderCache = new Map();

// The hero on her unicorn: the top of her as she stands (wings or a cape
// behind her too) and what she wears below hanging over its side.
function kitRiderSprite(outfit, frame) {
  const kit = heroKit();
  const look = PLAYER.look;
  const key = `${kit.id}|${look}|${Object.values(outfit).join('|')}|${frame}`;
  if (kitRiderCache.has(key)) return kitRiderCache.get(key);
  const uni = unicornSprite(outfit.ride, frame);
  const hero = kitSprite(kit, look, outfit, 0);
  const W = 36;
  const H = 46;
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d');
  const ux = 2;
  const uy = H - uni.canvas.height;
  ctx.drawImage(uni.canvas, ux, uy);
  const cut = 24;
  ctx.drawImage(hero.canvas, 0, 0, hero.canvas.width, cut, ux + 1, uy + 13 - cut + 1, hero.canvas.width, cut);
  drawRideLeg(ctx, ux + 7, uy + 13, outfit, hero.pal, hero.ride);
  const sprite = { canvas: cv, ax: ux + uni.ax, ay: uy + uni.ay };
  kitRiderCache.set(key, sprite);
  return sprite;
}

// Once every kit has registered (from js/game.js): a thing to wear that no
// kit took is nobody's now (it stays in her save, unseen), so each title
// shows only its own; 'none' stays everyone's.
function finishHeroKits() {
  if (isCaptain()) return;
  for (const table of Object.values(HERO_SLOTS)) {
    for (const [key, item] of Object.entries(table)) if (key !== 'none' && !item.kits) item.kits = [];
  }
}
