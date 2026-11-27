// Christmas decorations, in both editions, only while CHRISTMAS_ON.
//
// At Christmas every right answer gives her a decoration she doesn't have
// yet (up to XD_PER_DAY a day): a card with its picture pops up over the
// game, and it goes up in her room (the captain's room too):
//
// - ornaments hang on her tree and toys sit under it (xmRoomTree, js/christmas-play.js),
// - sweets stand on a little table, lights on a stepped stand (they glow
//   in the evening), and the other decorations on a shelf.
//
// Tapping any of them opens the decoration box: a page for each kind with
// its ten things, the ones she has in colour (tap one to hear its English
// word) and the rest still to find. The kinds and words are XMAS_DECOR in
// js/data.js.
//
// What she has is saved in the Christmas lists (`state.xmas.orn`, js/christmas-play.js)
// as `year:d:id:day` strings, so two copies of a save join without losing
// anything. The ornaments an older version hung (`year:xxxx`) become her
// first ornaments here.

const XD_PER_DAY = 8;

// ---- Pictures ------------------------------------------------------------------------

const XD_PAL = Object.assign({}, XM_PAL, {
  e: '#9a90a8', q: '#cfe8ff', h: '#6a3a22', m: '#ffc8dc', L: '#d8ff70', v: '#b98cff', P: '#e0608a',
});
const XD_ART = {
  // Ornaments: small, to hang on her tree.
  redball: ['..y..', '.rrr.', 'rwrrr', 'rrrrR', '.rRR.'],
  goldball: ['..Y..', '.yyy.', 'yzyyy', 'yyyyY', '.yYY.'],
  blueball: ['..y..', '.bbb.', 'bwbbb', 'bbbbB', '.bBB.'],
  ornstar: ['..y..', 'yyyyy', '.yzy.', '.y.y.', 'y...y'],
  ornbell: ['..Y..', '.yyy.', '.yzy.', 'yyyyy', '..R..'],
  snowflake: ['w.w.w', '.www.', 'wwbww', '.www.', 'w.w.w'],
  ornheart: ['rr.rr', 'rwrrr', 'rrrrR', '.rrR.', '..R..'],
  icicle: ['wwwww', '.wWw.', '.wWw.', '..W..', '..b..'],
  pinecone: ['..g..', '.TcT.', 'cTcTc', '.TcT.', '..T..'],
  angel: ['.zzz.', '..s..', 'wwpww', '.ppp.', 'ppppp'],
  // Toys.
  teddy: ['.tt..tt.', 'tcttttct', '.tcccct.', 'tckcckct', 'tccTTcct', '.tcaact.', 'tccccccT', 'tcaaaacT', 'tccccccT', '.tt..tt.'],
  train: ['..kk......', '..kk.rrrr.', 'rrrrrrbbr.', 'ryyyrrbbr.', 'rrrrrrrrrr', 'RRRRRRRRRR', '.kk..kk.kk', '.kk..kk.kk'],
  drum: ['y.......y', '.y.....y.', '..wwwww..', '.wwwwwww.', 'yyyyyyyyy', 'rrbrrrbrr', 'rrrbrbrrr', 'rrrrbrrrr', 'rrrbrbrrr', 'yyyyyyyyy'],
  top: ['....T....', '....T....', '.rrrrrrr.', 'yyyyyyyyy', '.bbbbbbb.', '..rrrrr..', '...yyy...', '....T....'],
  ball: ['..rrbb..', '.rrrbbb.', 'rwrrbbbb', 'rrrrbbbb', 'yyyyllll', 'yyyyllll', '.yyylll.', '..yyll..'],
  blocks: ['...rrrr...', '...rwwr...', '...rwwr...', '...rrrr...', '.bbbbyyyy.', '.bwwbywwy.', '.bwwbywwy.', '.bbbbyyyy.'],
  doll: ['..YYYY..', '.YssssY.', '.YksskY.', '.YsppsY.', '..ssss..', '.pppppp.', 'pppwwppp', '.pppppp.', 'pppppppp', '..s..s..', '..k..k..'],
  rockinghorse: ['..t.........', '.ccc........', 'cckcc.......', '..cccccccc..', '..ccccccccy.', '..c.c..c.c.y', '..c.c..c.c..',
    'R..........R', '.RRRRRRRRRR.'],
  unicorntoy: ['y.........', '.y........', '.www......', 'wwkwp.....', 'wwwwwwwww.', '.wwwwwwwwp', '.wwwwwwwpp', '.w.w..w.w.', '.e.e..e.e.'],
  musicbox: ['....w.....', '...wpw....', '....p.....', '.yyyyyyy..', '.PmmmmmP..', '.PmyymmP..', '.PmmmmmP..', '.PPPPPPP..'],
  robot: ['....r....', '....k....', '.eeeeeee.', '.ebeeebe.', '.eeeeeee.', '.ekkkkke.', '..eeeee..', 'eeebbbeee', 'e.ebrbe.e', '..eeeee..', '..k...k..'],
  rocket: ['...rr...', '..rrrr..', '..wwww..', '..wbbw..', '..wbbw..', '..wwww..', '.rwwwwr.', 'rrwwwwrr', 'r.rrrr.r', '...yy...', '...ny...', '....n...'],
  racecar: ['....rrrr....', '...rbbbbr...', '.rrrrrrrrrr.', 'rrwrrrrrrwrr', 'rrrrrrrrrrrr', '.kk......kk.', '.kk......kk.'],
  dino: ['........ggg.', '.......gkgg.', '.......ggggg', '.......ggg..', '..g...gggg..', '.ggg.ggggg..', 'gglgggglgg..', '..gggggggg..', '...gg..gg...', '...GG..GG...'],
  // Sweets.
  gingerman: ['...ccc...', '..ckckc..', '..ccwcc..', 'ccccrcccc', '.ccccccc.', '...crc...', '..ccccc..', '.cc...cc.', '.cc...cc.'],
  cane: ['.rrww.', 'ww..rr', 'rr..ww', '....rr', '....ww', '....rr', '....ww', '....rr'],
  cookie: ['..aaaa..', '.acahaa.', 'aahaaaca', 'aaaachaa', 'ahaaaaaa', 'aaacaaha', '.aahaac.', '..aaaa..'],
  cupcake: ['...r....', '..mmmm..', '.mpmmpm.', 'mmmmmmmm', '.aTaTaT.', '.aTaTaT.', '..aTaT..'],
  lollipop: ['.rrrr.', 'rwwwrr', 'rwrrwr', 'rrwwrr', '.rrrr.', '...i..', '...i..', '...i..', '...i..'],
  cocoa: ['..w..w...', '...w..w..', '.whwhwh..', '.rrrrrrrr', '.rrrrrr.r', '.rrwrrrrr', '.rrrrrr..', '..rrrr...'],
  cake: ['....y.....', '....r.....', '..wwwwww..', '.wpwwpwwp.', '.pppppppp.', '.wwwwwwww.', '.pppppppp.', 'eeeeeeeeee'],
  peppermint: ['..wwww..', '.rwrrwr.', 'wwrwwrww', 'wrrwwrrw', 'wrrwwrrw', 'wwrwwrww', '.rwrrwr.', '..wwww..'],
  gingerhouse: ['....ww....', '...wccw...', '..wccccw..', '.wccccccw.', 'wwwwwwwwww', '.crccccgc.', '.ccccTTcc.', '.cgcrTTcc.', '.ccccTTcr.'],
  milk: ['..bb..', '..ww..', '.wwww.', 'wwwwww', 'wbbbbw', 'wbwwbw', 'wbbbbw', 'wwwwww'],
  // Lights.
  candle: ['..y..', '.yzy.', '..n..', '.rrr.', '.rwr.', '.rrr.', '.rrr.', '.rrr.', 'yyyyy'],
  lantern: ['...kk...', '..k..k..', '.kkkkkk.', '.kzzzzk.', '.kzyyzk.', '.kzyyzk.', '.kzzzzk.', '.kkkkkk.', '..kkkk..'],
  starlamp: ['....y....', '...yzy...', 'yyyzzzyyy', '.yzzzzzy.', '..yzzzy..', '.yyz.zyy.', '.y.....y.', '....T....', '...TTT...'],
  moonlamp: ['..yyy...', '.yzz....', 'yzz.....', 'yzz.....', 'yzz....y', '.yzzzzy.', '..yyyy..', '...TT...', '..TTTT..'],
  fairylights: ['kk........kk', 'rkkk....kkkb', 'r..kkkkkk..b', '...y.gp.y...'],
  fireflies: ['.TTTTT.', '.eqqqe.', 'e.....e', 'e.L...e', 'e...L.e', 'e.L...e', 'e..L..e', 'e.....e', '.eeeee.'],
  lamp: ['..yyyy..', '.yyyyyy.', 'yyyyyyyy', 'YYYYYYYY', '...TT...', '...TT...', '...TT...', '..TTTT..', '.TTTTTT.'],
  treelamp: ['...y...', '..ggg..', '..grg..', '.ggggg.', '.gyglg.', 'ggggggg', '...T...', '..TTT..'],
  heartlamp: ['.pp..pp.', 'pmmppmmp', 'pmmmmmmp', 'pmmmmmmp', '.pmmmmp.', '..pmmp..', '...pp...', '...TT...', '..TTTT..'],
  snowlamp: ['..kkk..', '.kkkkk.', '..wnw..', '.wwwww.', 'wwwzwww', 'wwwzwww', '.wwwww.', '..TTT..'],
  // Decorations.
  wreath: ['...gggg...', '.gglggrg..', '.grg..glg.', 'gg......gg', 'gl......lg', 'gg......gg', '.glg..grg.', '.ggrggggg.', '...rRRr...', '..r....r..'],
  snowglobe: ['..qqqqq..', '.q.w..wq.', 'q..ggg..q', 'q.w.g.w.q', 'q..ggg.wq', '.q..T..q.', '..qqqqq..', '.TTTTTTT.', 'TTyyyyyTT'],
  poinsettia: ['...r..r...', '..rRrrRr..', '.rrRyyRrr.', '..rryyrr..', '.rRr..rRr.', '..g....g..', '...TTTT...', '...TaaT...', '...TTTT...'],
  nutcracker: ['..kkk..', '.yyyyy.', '..sss..', '..sks..', '..www..', '.rrrrr.', 'yryyyry', '.rrrrr.', '.kkkkk.', '.bb.bb.', '.kk.kk.'],
  elf: ['....gg..', '...ggg..', '..gggg..', '.wwwwww.', '..ssss..', '..kssk..', '..ssss..', '.gggggg.', 'gggyyggg', '.gggggg.', '..r..r..'],
  polarbear: ['.WW....WW.', 'WwwWWWWwwW', '.wwwwwwww.', '.wkwwwwkw.', '.wwwkkwww.', '..wwwwww..', '.wwwwwwww.', 'wwwwwwwwww', 'wWwwwwwwWw', '.WW....WW.'],
  holly: ['.gg....gg.', 'gGgg..ggGg', 'ggGgrrgGgg', '.ggrRrRgg.', '..g.rr..g.'],
  penguin: ['..kkkk..', '.kkkkkk.', '.kwkkwk.', '.kkyykk.', 'kkwwwwkk', 'kkwwwwkk', 'kkwwwwkk', '.kwwwwk.', '..kwwk..', '.yy..yy.'],
  mittens: ['.rr....bb.', 'rrrr..bbbb', 'rrrrrbbbbb', 'rrrr..bbbb', 'rrrr..bbbb', 'wwww..wwww'],
  bow: ['rr......rr', 'rrrr..rrrr', 'rRrrrrrrRr', 'rrrryyrrrr', 'rRrrrrrrRr', 'rrr.rr.rrr', '...rr.rr..', '..rr...rr.'],
};

// A decoration's picture, `scale` times bigger, with a dark outline round
// it so white things show on a white card or floor.
const xdSprites = new Map();
function xdSprite(id, scale = 1) {
  const key = `${id}|${scale}`;
  if (xdSprites.has(key)) return xdSprites.get(key);
  const rows = XD_ART[id];
  const w = Math.max(...rows.map(r => r.length)) + 2;
  const h = rows.length + 2;
  const one = makeCanvas(w, h);
  const c1 = one.getContext('2d');
  const solid = (i, j) => j >= 0 && j < rows.length && i >= 0 && !!XD_PAL[rows[j][i]];
  for (let j = -1; j <= rows.length; j++) for (let i = -1; i < w - 1; i++) {
    if (solid(i, j)) continue;
    if (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1)) px(c1, i + 1, j + 1, 1, 1, XD_PAL.o);
  }
  drawBitmap(c1, rows, XD_PAL, 1, 1);
  let cv = one;
  if (scale !== 1) {
    cv = makeCanvas(w * scale, h * scale);
    const c2 = cv.getContext('2d');
    c2.imageSmoothingEnabled = false;
    c2.drawImage(one, 0, 0, w * scale, h * scale);
  }
  xdSprites.set(key, cv);
  return cv;
}
// A decoration drawn standing on (cx, base), `scale` times bigger.
function xdPut(ctx, id, cx, base, scale = 1) {
  const cv = xdSprite(id, scale);
  ctx.drawImage(cv, Math.round(cx - cv.width / 2), Math.round(base - cv.height + scale));
}

// ---- What she has -----------------------------------------------------------------------

// This edition's kinds, each with its ten things ({ id, word, kind }).
function xdKinds() {
  const ed = isCaptain() ? 'captain' : 'princess';
  return XMAS_DECOR.map(k => ({ kind: k.kind, word: k.word, icon: k.icon,
    items: k.items.filter(([, , only]) => !only || only === ed).map(([id, word]) => ({ id, word, kind: k.kind })) }));
}
const xdKind = kind => xdKinds().find(k => k.kind === kind);
const xdAll = () => xdKinds().flatMap(k => k.items);
// This Christmas's entries, split at the colons.
const xdEntries = () => xmThis(xmState().orn).map(v => v.split(':'));
// The ids she has: the ones given, and the ornaments an older version hung.
function xdOwned() {
  const got = new Set();
  let old = 0;
  for (const e of xdEntries()) {
    if (e[1] === 'd' && e[2]) got.add(e[2]);
    else if (e.length === 2) old++;
  }
  for (const it of xdKind('ornament').items.slice(0, Math.min(old, 10))) got.add(it.id);
  return got;
}
const xdGivenToday = () => new Set(xdEntries().filter(e => e[1] === 'd' && e[3] === xmDay()).map(e => e[2])).size;
// Given this time she played (they glow in the box until it is closed).
const xdFresh = new Set();

// A right answer at Christmas (answeredRight, js/game.js): a decoration she
// doesn't have yet, from a kind with some left, and its card pops up from
// `from` (the card she tapped). Nothing once she has had XD_PER_DAY today.
function christmasRight(from) {
  if (!CHRISTMAS_ON || xdGivenToday() >= XD_PER_DAY) return null;
  const owned = xdOwned();
  const left = xdAll().filter(it => !owned.has(it.id));
  if (!left.length) return null;
  const kind = pick([...new Set(left.map(it => it.kind))]);
  const it = pick(left.filter(x => x.kind === kind));
  xmState().orn.push(`${xmYear()}:d:${it.id}:${xmDay()}`);
  xdFresh.add(it.id);
  xdFly(it, from && from.getBoundingClientRect ? from.getBoundingClientRect() : null);
  return it;
}

// Its card: the picture and name rise from the card she tapped and fade.
function xdFly(it, from) {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.className = 'xd-fly';
  const cv = document.createElement('canvas');
  xdDraw(cv, it.id, 5, true);
  const card = document.createElement('span');
  card.className = 'card';
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = I18n.t('xmdeco.gotOne');
  const name = document.createElement('span');
  name.className = 'w';
  name.textContent = I18n.t(`xmdeco.${it.id}`);
  card.append(tag, cv, name);
  el.append(card);
  const x0 = from ? from.left + from.width / 2 - 140 : innerWidth * 0.3;
  const y0 = from ? from.top - 20 : innerHeight * 0.35;
  el.style.left = `${Math.round(Math.max(90, Math.min(innerWidth - 90, x0)))}px`;
  el.style.top = `${Math.round(Math.max(120, y0))}px`;
  document.body.append(el);
  Sound.sparkle();
  if (!el.animate) { setTimeout(() => el.remove(), 2400); return; }
  const a = el.animate([
    { transform: 'translate(0, 20px) scale(0.4)', opacity: 0 },
    { transform: 'translate(0, -6px) scale(1.12)', opacity: 1, offset: 0.15 },
    { transform: 'translate(0, -14px) scale(1)', opacity: 1, offset: 0.75 },
    { transform: 'translate(0, -60px) scale(0.8)', opacity: 0 },
  ], { duration: 2600, delay: 250, easing: 'ease-in-out', fill: 'both' });
  a.onfinish = () => el.remove();
}

// A decoration on a square canvas of its own (14 pixels, `scale` times
// bigger); one she hasn't got yet is a grey shape (`have` false).
function xdDraw(cv, id, scale, have) {
  const rows = XD_ART[id];
  // A small one (an ornament) drawn bigger, to fill the same square.
  const big = Math.max(scale, Math.floor((14 * scale) / (Math.max(rows.length, ...rows.map(r => r.length)) + 2)));
  const s = xdSprite(id, big);
  cv.width = 14 * scale;
  cv.height = 14 * scale;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.drawImage(s, Math.round((cv.width - s.width) / 2), Math.round((cv.height - s.height) / 2));
  if (!have) {
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#d8ccd6';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---- In her room ------------------------------------------------------------------------

// Where the ten ornaments hang on her tree, in the tree's own pixels
// (XM_TREE), and where the ten toys sit round its foot.
const XD_ORN_AT = [[6, 5], [4.5, 7], [8, 7.3], [3.4, 9.3], [6.4, 9.6], [9.4, 9.8], [2.3, 11.6], [5, 12], [7.8, 11.8], [10.6, 12]];
// The toys pile up to the left of the trunk (what stands beside the tree
// may hide its right side), from the back to the front.
const XD_TOY_AT = [[-30, -10], [-19, -11], [-8, -12], [-42, -3], [-31, -3], [-20, -4], [-9, -4], [-36, 4], [-25, 4], [-14, 4]];

// Her tree, `scale` times bigger, with her ornaments on it and her toys at
// its foot, in a `w` x `h` box (xmRoomTree, js/christmas-play.js).
function xdTree(ctx, x, y, w, h, t, scale) {
  const owned = xdOwned();
  const tw = XM_TREE[0].length * scale;
  const tx = x + (w - tw - 4) / 2;
  const ty = y + h - 8 - XM_TREE.length * scale;
  xmPut(ctx, XM_TREE, XM_PAL, tx, ty, scale, true);
  xdKind('ornament').items.forEach((it, i) => {
    if (!owned.has(it.id)) return;
    const [c, r] = XD_ORN_AT[i];
    const cx = tx + 2 + c * scale;
    const cy = ty + r * scale;
    xdPut(ctx, it.id, cx, cy + 3);
    if (Math.sin(t * 3 + i * 1.7) > 0.8) px(ctx, Math.round(cx) - 1, Math.round(cy) - 1, 1, 1, '#ffffff');
  });
  const cx = x + w / 2;
  xdKind('toy').items.forEach((it, i) => {
    if (!owned.has(it.id)) return;
    const [dx, dy] = XD_TOY_AT[i];
    xdPut(ctx, it.id, cx + dx, y + h - 1 + dy);
  });
}

// Sweets on a little table with a cake stand, lights on a stepped stand and
// the other decorations on a shelf, against the back walls of her room
// (the table on the right wall, the shelf on the left), clear of her tree
// so the toys round its foot show, and not right at the front ends.
function xdRoom(sc) {
  const outs = hwOuts(sc);
  const tree = sc.objects.find(o => o.xmRoomTree);
  const spots = [];
  for (let r = 0; r < sc.D; r++) for (let c = 0; c < sc.W; c++) {
    const t = tileAt(sc, c, r);
    if ((c > 0 && r > 0) || (c === 0 && r >= sc.D - 1) || (r === 0 && c >= sc.W - 1)) continue;
    if ((tree && hwNear({ c: tree.c0, r: tree.r0 }, { c, r }, 2)) || !hwFloor(t) || outs.some(o => hwNear(o, { c, r }, 1)) ||
      (sc.start && hwNear(sc.start, { c, r }, 1))) continue;
    if (sc.objects.some(o => (o.front || []).some(f => f.c === c && f.r === r))) continue;
    spots.push({ c, r });
  }
  const put = (key, make) => {
    const order = spots.slice().sort((p, q) => key(p) - key(q));
    hwPlace(sc, order, 1, 0, s => make(sc, s));
  };
  put(s => (s.r === 0 ? 0 : 100) + s.c, xdTable);
  put(s => (s.c === 0 ? 0 : 100) + s.r, xdShelf);
  put(s => (s.c === 0 ? 0 : 100) + s.c + s.r, xdStand);
}

// One of the stands, drawn by `draw(ctx, x, y, t, owned, items)`; a tap opens
// the box at its kind.
function xdThing(sc, s, kind, w, h, draw) {
  return xmThing(sc, s, w, h, (ctx, x, y, t) => draw(ctx, x, y, t, xdOwned(), xdKind(kind).items), o => {
    xmPop(o, 'jingle');
    xdOpen(kind);
  }, { xdStand: kind });
}

function xdTable(sc, s) {
  xdThing(sc, s, 'sweet', 60, 42, (ctx, x, y, t, owned, items) => {
    ctx.fillStyle = 'rgba(40,30,70,0.22)';
    ctx.beginPath();
    ctx.ellipse(x + 30, y + 41, 26, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // The cake stand at the back, then the table with its cloth.
    px(ctx, x + 6, y + 16, 48, 2, '#e8c890');
    px(ctx, x + 6, y + 18, 48, 1, '#c8a070');
    px(ctx, x + 28, y + 19, 4, 8, '#c8803a');
    px(ctx, x + 6, y + 40 - 12, 3, 12, '#5e3a1e');
    px(ctx, x + 51, y + 40 - 12, 3, 12, '#5e3a1e');
    items.slice(0, 5).forEach((it, i) => { if (owned.has(it.id)) xdPut(ctx, it.id, x + 10 + i * 10, y + 16); });
    px(ctx, x + 2, y + 27, 56, 4, '#ffffff');
    px(ctx, x + 2, y + 31, 56, 2, '#ff4a5a');
    for (let i = 0; i < 14; i++) px(ctx, x + 3 + i * 4, y + 33, 2, 1, '#ff4a5a');
    items.slice(5).forEach((it, i) => { if (owned.has(it.id)) xdPut(ctx, it.id, x + 8 + i * 11, y + 29); });
  });
}

// Four steps (4, 3, 2 and 1 lights), lit up in the evening.
const XD_STEPS = [[4, 46, 42], [3, 37, 32], [2, 28, 22], [1, 19, 12]];
function xdStand(sc, s) {
  xdThing(sc, s, 'light', 46, 50, (ctx, x, y, t, owned, items) => {
    ctx.fillStyle = 'rgba(40,30,70,0.22)';
    ctx.beginPath();
    ctx.ellipse(x + 23, y + 49, 21, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const [, top, w] of XD_STEPS) {
      px(ctx, x + 23 - w / 2, y + top, w, 49 - top, '#8a5a2a');
      px(ctx, x + 23 - w / 2, y + top, w, 2, '#c8803a');
    }
    const night = xmNightNow();
    let i = 0;
    const lit = [];
    for (const [n, top] of XD_STEPS) {
      for (let j = 0; j < n; j++, i++) {
        const it = items[i];
        if (!it || !owned.has(it.id)) continue;
        const cx = x + 23 + (j - (n - 1) / 2) * 10;
        lit.push([cx, top, i]);
      }
    }
    // The top step's lights are drawn first: the lower ones stand in front.
    for (const [cx, top, k] of lit.slice().reverse()) xdPut(ctx, items[k].id, cx, y + top + 1);
    for (const [cx, top, k] of lit) {
      const cy = y + top - 6;
      const a = (night ? 0.32 : 0.14) + Math.sin(t * 4 + k * 1.3) * 0.06;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, night ? 9 : 6);
      g.addColorStop(0, `rgba(255,230,140,${a})`);
      g.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - 10, cy - 10, 20, 20);
    }
  });
}

// A shelf of three rows (4, 3 and 3).
const XD_ROWS = [[4, 20], [3, 36], [3, 52]];
function xdShelf(sc, s) {
  xdThing(sc, s, 'decor', 52, 57, (ctx, x, y, t, owned, items) => {
    ctx.fillStyle = 'rgba(40,30,70,0.22)';
    ctx.beginPath();
    ctx.ellipse(x + 26, y + 55, 24, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    px(ctx, x + 2, y + 4, 48, 50, '#5e3a1e');
    px(ctx, x + 4, y + 6, 44, 46, '#f4e0c0');
    let i = 0;
    for (const [n, base] of XD_ROWS) {
      px(ctx, x + 2, y + base, 48, 2, '#8a5a2a');
      for (let j = 0; j < n; j++, i++) {
        const it = items[i];
        if (it && owned.has(it.id)) xdPut(ctx, it.id, x + 26 + (j - (n - 1) / 2) * 11, y + base);
      }
    }
    // A sprig of holly on top.
    px(ctx, x + 21, y + 2, 3, 2, '#3f9f58');
    px(ctx, x + 28, y + 2, 3, 2, '#3f9f58');
    px(ctx, x + 24, y + 2, 4, 2, '#ff4a5a');
  });
}

// ---- The decoration box -----------------------------------------------------------------------

let xdUi = null;
let xdTab = 'ornament';
function xdMakeBox() {
  if (xdUi) return xdUi;
  const box = document.createElement('section');
  box.id = 'xmas-box';
  box.className = 'wardrobe album xd-box hidden';
  box.setAttribute('role', 'dialog');
  const head = document.createElement('div');
  head.className = 'wd-head';
  const name = document.createElement('div');
  name.className = 'wd-name';
  const count = document.createElement('div');
  count.className = 'wd-count';
  head.append(name, count);
  const tabs = document.createElement('div');
  tabs.className = 'al-tabs';
  const page = document.createElement('div');
  page.className = 'xd-page';
  const done = document.createElement('button');
  done.className = 'wd-done';
  done.textContent = I18n.t('xmdeco.done');
  done.addEventListener('click', xdClose);
  box.append(head, tabs, page, done);
  document.body.append(box);
  xdUi = { box, name, count, tabs, page };
  return xdUi;
}

// Opens the box at `kind` (the stand she tapped).
function xdOpen(kind) {
  const ui2 = xdMakeBox();
  if (!ui2.box.classList.contains('hidden')) return;
  state.busy = true;
  const h = state.hero;
  h.onArrive = null;
  h.path = h.path.slice(0, 1);
  xdTab = kind || xdTab;
  xdRender();
  ui2.box.classList.remove('hidden');
  const k = xdKind(xdTab);
  if (kind === 'ornament') xmSay(line(xdOwned().size ? 'xmTree' : 'xmTreeEmpty'));
  else xmSay(`${k.word}!`);
}

function xdClose() {
  if (!xdUi) return;
  xdUi.box.classList.add('hidden');
  xdFresh.clear();
  state.busy = busyNow();
  Sound.tap();
}

function xdRender() {
  const owned = xdOwned();
  const kinds = xdKinds();
  const all = kinds.flatMap(k => k.items);
  xdUi.name.textContent = I18n.t('xmdeco.title');
  xdUi.count.textContent = I18n.t('xmdeco.count', all.filter(it => owned.has(it.id)).length, all.length);
  xdUi.tabs.replaceChildren(...kinds.map(k => {
    const b = document.createElement('button');
    const have = k.items.filter(it => owned.has(it.id)).length;
    b.className = `al-tab${k.kind === xdTab ? ' on' : ''}${have === k.items.length ? ' done' : ''}${k.items.some(it => xdFresh.has(it.id)) ? ' fresh' : ''}`;
    b.title = I18n.t(`xmdeco.kind.${k.kind}`);
    b.innerHTML = `<span class="L">${k.icon}</span><span class="bar"><i style="width:${Math.round(100 * have / k.items.length)}%"></i></span>`;
    b.addEventListener('click', () => {
      xdTab = k.kind;
      Sound.tap();
      xdRender();
      xmSay(`${k.word}!`);
    });
    return b;
  }));
  const k = xdKind(xdTab);
  const title = document.createElement('div');
  title.className = 'al-group xd-kind';
  title.textContent = `${k.icon} ${I18n.t(`xmdeco.kind.${k.kind}`)} ${k.items.filter(it => owned.has(it.id)).length}/${k.items.length}`;
  const cards = k.items.map(it => {
    const have = owned.has(it.id);
    const b = document.createElement('button');
    b.className = `sticker xd-card${have ? ' got' : ''}${xdFresh.has(it.id) ? ' new' : ''}`;
    const cv = document.createElement('canvas');
    xdDraw(cv, it.id, 5, have);
    const w = document.createElement('span');
    w.className = 'w';
    w.textContent = have ? I18n.t(`xmdeco.${it.id}`) : '?';
    b.append(cv, w);
    b.addEventListener('click', () => {
      if (!have) { Sound.tap(); return; }
      b.classList.remove('wiggle');
      void b.offsetWidth;
      b.classList.add('wiggle');
      xmSay(`${it.word}!`);
    });
    return b;
  });
  const grid = document.createElement('div');
  grid.className = 'xd-grid';
  grid.append(...cards);
  xdUi.page.replaceChildren(title, grid);
}

// Every word the box says (tools/check-tts.js checks they are recorded).
function xdEveryLine() {
  for (const k of XMAS_DECOR) {
    xmSay(`${k.word}!`);
    for (const [, word] of k.items) xmSay(`${word}!`);
  }
}
