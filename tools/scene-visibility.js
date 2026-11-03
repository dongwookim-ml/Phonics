// Shared browser-side occlusion audit, using the game's real draw order.
// Share of each villager's sprite that objects drawn after it cover, using
// the same order as drawScene in js/game.js.
function hiddenVillagers() {
  const names = ['town', 'castle', 'castle2', 'yuna', 'forest', 'unicorn', 'dungeon', 'fairy', ...TOWN_HOUSES.map(h => `house-${h.letter}`)];
  // Scenes reached through links from these (new villages and homes), and
  // the Monster Tower's floors behind its door.
  for (let i = 0; i < names.length; i++) {
    for (const l of sceneFor(names[i]).links || []) if (typeof l.target === 'string' && !names.includes(l.target)) names.push(l.target);
    for (const d of sceneFor(names[i]).doors || []) if (/^tower/.test(d.target) && !names.includes(d.target)) names.push(d.target);
  }
  const out = [];
  for (const name of names) {
    let sc;
    try { sc = sceneFor(name); } catch (e) { continue; }
    const list = sc.objects.slice();
    const chars = sc.npcs.filter(n => !n.mount).map(n => ({ isChar: true, npc: n, c: n.c, r: n.r }));
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
    // Each villager's picture where it is drawn (her monsters are never
    // mirrored), so one standing in front of another counts too.
    for (const ch of list) {
      if (!ch.isChar) continue;
      const n = ch.npc;
      const sprite = n.unicorn ? unicornSprite(n.unicorn, 0) : villagerSprite(n.look, 0);
      const p = tileCenter(sc, n.c, n.r);
      const w = sprite.canvas.width;
      const h = sprite.canvas.height;
      const flip = n.flip && !KID_MONSTERS[n.look];
      ch.pic = { w, h, flip, dx: Math.round(p.x - (flip ? w - sprite.ax : sprite.ax)), dy: Math.round(p.y + 1 - sprite.ay), px: sprite.canvas.getContext('2d').getImageData(0, 0, w, h).data };
    }
    const solid = (pic, X, Y) => {
      const x = X - pic.dx;
      const y = Y - pic.dy;
      return x >= 0 && y >= 0 && x < pic.w && y < pic.h && pic.px[(y * pic.w + (pic.flip ? pic.w - 1 - x : x)) * 4 + 3] >= 40;
    };
    list.forEach((ch, i) => {
      if (!ch.isChar) return;
      const n = ch.npc;
      const { w, h, dx, dy } = ch.pic;
      let all = 0;
      let covered = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!solid(ch.pic, dx + x, dy + y)) continue;
        all++;
        for (let j = i + 1; j < list.length; j++) {
          const o = list[j];
          if (o.isChar ? solid(o.pic, dx + x, dy + y) : !o.background && o.canvas && hitObject(o, dx + x, dy + y)) { covered++; break; }
        }
      }
      out.push({ scene: name, name: n.name, c: n.c, r: n.r, cover: all ? Math.round(100 * covered / all) : 0 });
    });
  }
  return out;
}

module.exports = { hiddenVillagers };
