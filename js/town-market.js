// The default town's low shopfronts surround the castle fountain. Letter
// houses keep their familiar interiors in town and the riverside neighborhood.
const TOWN_MARKET = {
  salon: { c: 13, r: 16, color: '#e985b2', title: 'data.hairSalon' },
  nails: { c: 25, r: 14, color: '#a897cf', title: 'nails.title' },
  shop: { c: 15, r: 24, color: '#dfb95d', title: 'town.clothesAndGifts' },
};

// Shopfronts are deliberately one storey, with big display windows, striped
// canopies and product-shaped rooftop signs instead of residential roofs.
const townProductCache = {};
function townProduct(kind) {
  if (townProductCache[kind]) return townProductCache[kind];
  const cv = makeCanvas(34, 34), g = cv.getContext('2d');
  const ink = '#674761';
  if (kind === 'salon') {
    g.lineWidth = 3; g.strokeStyle = ink;
    for (const x of [9, 25]) { g.beginPath(); g.ellipse(x, 24, 5, 6, 0, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = '#e5edf7'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(12, 20); g.lineTo(26, 3); g.moveTo(22, 20); g.lineTo(8, 3); g.stroke();
    g.strokeStyle = '#7f7396'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(12, 20); g.lineTo(26, 3); g.moveTo(22, 20); g.lineTo(8, 3); g.stroke();
    px(g, 15, 15, 4, 4, '#ffd370');
  } else if (kind === 'nails') {
    px(g, 7, 13, 20, 19, ink); px(g, 9, 14, 16, 16, '#de78aa');
    px(g, 12, 1, 10, 13, ink); px(g, 14, 3, 3, 8, '#a38bb0');
    px(g, 12, 17, 3, 9, '#ffe7f1'); px(g, 22, 24, 2, 3, '#f3b6d6');
    px(g, 28, 11, 2, 6, '#fff1a4'); px(g, 26, 13, 6, 2, '#fff1a4');
  } else {
    fillPoly(g, [{x:12,y:3},{x:22,y:3},{x:23,y:13},{x:31,y:30},{x:3,y:30},{x:11,y:13}], ink);
    fillPoly(g, [{x:14,y:5},{x:20,y:5},{x:21,y:14},{x:27,y:28},{x:7,y:28},{x:13,y:14}], '#c49ce6');
    px(g, 12, 13, 10, 3, '#ffe08c'); px(g, 15, 3, 4, 4, '#fff7e8');
    px(g, 9, 23, 2, 4, '#e6d2fa'); px(g, 22, 23, 2, 4, '#e6d2fa');
  }
  return townProductCache[kind] = cv;
}

function drawTownStore(ctx, k, kind) {
  const theme = TOWN_MARKET[kind], color = theme.color;
  houseShadow(ctx, k);
  const W = wall(k.L, k.B), R = wall(k.B, k.R), H = 40;
  for (const [side, base] of [[W, '#f7e8e5'], [R, '#fff8ec']]) {
    wallRect(ctx, side, 0, side.len, 0, H, base);
    wallRect(ctx, side, 0, side.len, 0, 5, shade(color, -30));
    wallRect(ctx, side, 0, 2, 5, H, color);
    wallRect(ctx, side, side.len - 2, side.len, 5, H, color);
    wallRect(ctx, side, 0, side.len, 35, H, color);
  }
  // A glazed door and tall shop windows, with merchandise on their shelves.
  wallRect(ctx, W, 7, 22, 5, 31, '#81647b');
  wallRect(ctx, W, 9, 20, 7, 29, '#b5dfdd');
  wallRect(ctx, W, 10, 19, 9, 12, shade(color, -5));
  wallRect(ctx, W, 17, 19, 17, 19, '#ffe08c');
  for (const side of [W, R]) {
    const a = side === W ? 27 : 7, b = side.len - 5;
    wallRect(ctx, side, a - 2, b + 2, 7, 32, '#aa889d');
    wallRect(ctx, side, a, b, 9, 30, '#c8e9e9');
    wallRect(ctx, side, a + 1, b - 1, 11, 13, color);
    for (let x = a + 4, i = 0; x < b - 2; x += 10, i++) {
      if (kind === 'nails') {
        wallRect(ctx, side, x - 2, x + 3, 14, 23, ['#df6fa5','#a894d8','#72bfae'][i % 3]);
        wallRect(ctx, side, x - 1, x + 2, 23, 27, '#755777');
      } else if (kind === 'salon') {
        wallArch(ctx, side, x - 3, x + 4, 16, 27, ['#744b38','#ebbd5b','#b193cd'][i % 3]);
        wallRect(ctx, side, x - 1, x + 2, 13, 16, '#e5bd9e');
      } else {
        wallRect(ctx, side, x - 1, x + 2, 21, 27, '#c190df');
        wallRect(ctx, side, x - 3, x + 4, 14, 22, ['#b48bda','#e99eb7','#7fbfaf'][i % 3]);
        wallRect(ctx, side, x - 3, x + 4, 19, 21, '#ffe098');
      }
    }
    wallRect(ctx, side, a + 1, a + 2, 13, 27, '#f4ffff');
  }
  const up = p => ({ x: p.x, y: p.y - 43 });
  fillPoly(ctx, [up(k.T), up(k.R), up(k.B), up(k.L)], shade(color, 22));
  for (const side of [W, R]) wallRect(ctx, side, -2, side.len + 2, 39, 43, shade(color, -18));
  // Broad striped awnings project out from each window, distinct from houses.
  for (const side of [W, R]) for (let x = 4; x < side.len - 3; x += 4) {
    const strip = Math.floor(x / 4) % 2 ? '#fff9f0' : color;
    fillPoly(ctx, [wallPt(side,x,35), wallPt(side,x+4,35), { ...wallPt(side,x+4,29), y: wallPt(side,x+4,29).y+3 }, { ...wallPt(side,x,29), y: wallPt(side,x,29).y+3 }], strip);
    wallRect(ctx, side, x, x + 4, 26, 29, strip);
  }
  // Large, literal product icon on a cream-backed rooftop board.
  const mid = houseMid(k);
  px(ctx, mid.x - 2, mid.y - 54, 4, 18, shade(color, -35));
  ctx.fillStyle = '#fff8ec'; ctx.strokeStyle = shade(color, -25); ctx.lineWidth = 2;
  roundRect(ctx, mid.x - 20, mid.y - 83, 40, 37, 7); ctx.fill(); ctx.stroke();
  ctx.drawImage(townProduct(kind), Math.round(mid.x - 17), Math.round(mid.y - 82));
}

function addMarketStore(sc, kind, keeper) {
  const S = TOWN_MARKET[kind];
  block(sc, S.c, S.r, 3, 3);
  const obj = addObject(sc, { c: S.c, r: S.r, w: 3, d: 3 }, footBounds(sc, S.c, S.r, 3, 3, 100, 14),
    ctx => drawTownStore(ctx, boxCorners(sc, S.c, S.r, 3, 3), kind), { kind: kind === 'nails' ? 'nail-salon' : kind, market: true, keeper });
  sc.npcs.push(keeper);
  const k = boxCorners(sc, S.c, S.r, 3, 3), mid = houseMid(k);
  sc.signs.push({ x: mid.x, y: mid.y - 36, text: I18n.t(S.title), color: S.color, shop: obj });
  return obj;
}

function addTownBoutique(sc) {
  const S = TOWN_MARKET.shop;
  const keeper = makeNpc({ who: I18n.t('captain-dino.shopkeeper'), look: 'merchant', c: S.c + 1, r: S.r + 4 }, null);
  Object.assign(keeper, { shop: true, badge: '👗' });
  addMarketStore(sc, 'shop', keeper);
}

// Move permanent villagers into nearby visible space rather than changing the
// renderer to draw people through buildings. Test actual sprite pixels against
// the same static-object depth order used by drawScene.
function townNpcCoverage(sc, n, c, r) {
  const pic = villagerSprite(n.look, 0), p = tileCenter(sc, c, r);
  const x = Math.round(p.x - (n.flip ? pic.canvas.width - pic.ax : pic.ax)), y = Math.round(p.y + 1 - pic.ay);
  const w = pic.canvas.width, h = pic.canvas.height;
  const objects = sc.objects.slice().sort((a,b) => (a.c0+a.c1+a.r0+a.r1)-(b.c0+b.c1+b.r0+b.r1));
  let at = 0;
  objects.forEach((o, i) => { if (o.background || (o.x < x+w && o.x+o.w > x && o.y < y+h && o.y+o.h > y && (c > o.c1+.5 || r > o.r1+.5))) at = i+1; });
  const front = objects.slice(at).filter(o => !o.background && o.x < x+w && o.x+o.w > x && o.y < y+h && o.y+o.h > y);
  if (!front.length) return 0;
  const data = pic.canvas.getContext('2d').getImageData(0,0,w,h).data;
  let total = 0, hidden = 0;
  for (let py = 0; py < h; py += 2) for (let px = 0; px < w; px += 2) {
    const sx = n.flip ? w-1-px : px;
    if (data[(py*w+sx)*4+3] < 40) continue;
    total++;
    if (front.some(o => hitObject(o, x+px, y+py))) hidden++;
  }
  return total ? hidden / total : 0;
}
function placeTownVillagers(sc) {
  const avoid = [...sc.doors, sc.start, ...sc.links, ...(sc.neighborhoodReturns||[]), {c:19,r:37}, {c:20,r:37}, {c:37,r:26}, {c:37,r:27}, {c:2,r:14}, {c:2,r:15}];
  const placed = [];
  const folks = [...sc.npcs.filter(n => n.shop || n.salon || n.nailSalon), ...sc.npcs.filter(n => !n.shop && !n.salon && !n.nailSalon)];
  for (const n of folks) {
    const candidates = [];
    for (let dr=-6; dr<=6; dr++) for (let dc=-6; dc<=6; dc++) {
      const c=n.c+dc, r=n.r+dr, t=tileAt(sc,c,r), p=tileCenter(sc,c,r);
      if (!t || t.blocked || avoid.some(a=>a.c===c && a.r===r) || sc.npcs.some(m=>m!==n && m.c===c && m.r===r)) continue;
      if (placed.some(m=>{const q=tileCenter(sc,m.c,m.r);return Math.abs(q.x-p.x)<25 && Math.abs(q.y-p.y)<35;})) continue;
      const dist=Math.abs(dc)+Math.abs(dr);
      if ((n.shop||n.salon||n.nailSalon) && dist>2) continue;
      candidates.push({c,r,score:dist+(t.type==='plaza'||t.type==='road'||t.type==='path'?0:2)});
    }
    candidates.sort((a,b)=>a.score-b.score);
    const spot = candidates.find(p=>townNpcCoverage(sc,n,p.c,p.r)<=.06);
    if (spot) Object.assign(n, { c:spot.c, r:spot.r });
    placed.push(n);
  }
}
