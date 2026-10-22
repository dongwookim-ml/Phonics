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
  stars: document.getElementById('stars'),
  pictures: document.getElementById('pictures'),
  mute: document.getElementById('mute'),
  fade: document.getElementById('fade'),
  place: document.getElementById('place'),
  dialog: document.getElementById('dialog'),
  portrait: document.getElementById('dlg-portrait'),
  name: document.getElementById('dlg-name'),
  text: document.getElementById('dlg-text'),
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
};

// ---- Saved progress ------------------------------------------------------

const SAVE_KEY = 'pixeltown-v2';
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return {
      outfit: Object.assign({}, DEFAULT_OUTFIT, s.outfit),
      stars: s.stars | 0,
      pictures: !!s.pictures,
    };
  } catch (e) {
    return { outfit: Object.assign({}, DEFAULT_OUTFIT), stars: 0, pictures: false };
  }
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ outfit: state.outfit, stars: state.stars, pictures: state.pictures })); } catch (e) { /* private mode */ }
}

// ---- State ---------------------------------------------------------------

const saved = load();
const state = {
  outfit: saved.outfit,
  stars: saved.stars,
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
};

function later(ms, fn) { state.timers.push(setTimeout(fn, ms)); }

function sceneFor(target) {
  if (!state.scenes[target]) {
    if (target === 'town') state.scenes[target] = buildTown();
    else if (target === 'castle') state.scenes[target] = buildCastleInterior();
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
  const step = 4.2 * dt;
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
    const spot = at || state.scene.start;
    placeHero(spot.c, spot.r);
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
  Sound.door();
  if (door.target === 'castle') {
    changeScene('castle', null, '🏰 공주님의 성');
    Sound.say([{ text: 'Welcome home, Princess!', pitch: 1.3 }]);
  } else {
    const info = door.obj.info;
    changeScene(door.target, null, `${info.letter}${info.letter.toLowerCase()} 집`);
    Sound.say([{ text: `The ${info.letter} house!` }, letterSound(info)]);
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

// ---- Words ---------------------------------------------------------------

function rec(kind, name) {
  return `audio/${kind}/${name.toLowerCase()}.mp3`;
}
function letterSound(info) {
  return { text: `${info.sound}, ${info.sound}`, file: rec('letters', info.letter), rate: 0.7 };
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let lastWord = null;
function makeQuestion(letter) {
  const pool = letter ? LETTERS.filter(l => l.letter === letter) : LETTERS;
  let info;
  let word;
  for (let i = 0; i < 10; i++) {
    info = pick(pool);
    word = pick(info.words);
    if (word[0] !== lastWord) break;
  }
  lastWord = word[0];
  const others = shuffle(LETTERS.filter(l => l !== info)).slice(0, 2);
  const options = shuffle([
    { word: word[0], emoji: word[1], info, right: true },
    ...others.map(o => { const w = pick(o.words); return { word: w[0], emoji: w[1], info: o, right: false }; }),
  ]);
  return { info, word: word[0], emoji: word[1], options, done: false, misses: 0 };
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

function openDialog(npc) {
  faceEachOther(npc);
  state.busy = true;
  state.talking = npc;
  const q = makeQuestion(npc.letter);
  state.question = q;
  drawPortrait(ui.portrait, villagerSprite(npc.look, 0));
  ui.name.textContent = npc.name;
  ui.text.textContent = npc.letter
    ? `${npc.letter} 소리 집이에요. 잘 듣고 골라 봐요!`
    : `${PLAYER.shown} 공주님, 잘 듣고 골라 봐요!`;
  ui.choices.innerHTML = '';
  q.options.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'choice';
    b.innerHTML = `<span class="num">${i + 1}</span><span class="pic">${o.emoji}</span><span class="w"><span class="first">${o.word[0]}</span>${o.word.slice(1)}</span>`;
    b.classList.toggle('pictures', state.pictures);
    b.addEventListener('click', () => choose(i, b));
    ui.choices.append(b);
  });
  ui.dialog.classList.remove('hidden');
  ui.reward.classList.add('hidden');
  const greet = npc.letter
    ? [{ text: `Hello, Princess ${PLAYER.spoken}! This is the ${npc.letter} house.` }, letterSound(q.info), { text: 'Listen!' }]
    : [{ text: `Hello, Princess ${PLAYER.spoken}! Listen!` }];
  Sound.say(greet.concat([{ text: q.word, file: rec('words', q.word), rate: 0.72 }]));
}

function askAgain() {
  const q = state.question;
  if (q) Sound.say([{ text: q.word, file: rec('words', q.word), rate: 0.72 }]);
}

function choose(i, btn) {
  const q = state.question;
  if (!q || q.done || btn.disabled) return;
  const o = q.options[i];
  if (o.right) {
    q.done = true;
    btn.classList.add('right');
    ui.choices.querySelectorAll('.choice').forEach(b => { b.disabled = true; });
    ui.text.textContent = `딩동댕! ${o.emoji} ${o.word}`;
    Sound.correct();
    Sound.say([{ text: 'Yes!' }, { text: `${o.word}!`, file: rec('words', o.word) }]);
    state.stars++;
    save();
    renderStars(true);
    burstAtHero(30);
    later(1700, () => offerReward(state.talking));
  } else {
    q.misses++;
    btn.disabled = true;
    btn.classList.add('wrong');
    Sound.wrong();
    ui.text.textContent = '앗, 다시 들어 볼까요?';
    Sound.say([{ text: `That says ${o.word}.` }, { text: 'Listen!' }, { text: q.word, file: rec('words', q.word), rate: 0.72 }]);
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

function rewardChoices() {
  const o = state.outfit;
  const list = [];
  for (const [k, v] of Object.entries(DRESS_COLORS)) if (k !== o.dress) list.push({ slot: 'dress', value: k, label: `${v.icon} ${v.name} 드레스` });
  for (const [k, v] of Object.entries(DRESS_SHAPES)) if (k !== o.shape) list.push({ slot: 'shape', value: k, label: `${v.icon} ${v.name}` });
  for (const [k, v] of Object.entries(HEADWEAR)) if (k !== 'none' && k !== o.head) list.push({ slot: 'head', value: k, label: `${v.icon} ${v.name}` });
  for (const [k, v] of Object.entries(HAND_ITEMS)) if (k !== 'none' && k !== o.hand) list.push({ slot: 'hand', value: k, label: `${v.icon} ${v.name}` });
  for (const [k, v] of Object.entries(HAIR_COLORS)) if (k !== o.hair) list.push({ slot: 'hair', value: k, label: `${v.icon} ${v.name}` });
  return list;
}

function offerReward(npc) {
  // Pick a slot first so dress colours don't crowd out everything else.
  const all = rewardChoices();
  const slot = pick([...new Set(all.map(r => r.slot))]);
  const gift = pick(all.filter(r => r.slot === slot));
  state.gift = gift;
  const next = Object.assign({}, state.outfit, { [gift.slot]: gift.value });
  ui.rewardTitle.textContent = `🎁 ${npc ? npc.name : ''}의 선물!`;
  ui.rewardName.textContent = gift.label;
  drawPortrait(ui.pvNow, princessSprite(state.outfit, 0));
  drawPortrait(ui.pvNew, princessSprite(next, 0));
  ui.dialog.classList.add('hidden');
  ui.reward.classList.remove('hidden');
  Sound.party();
  Sound.say([{ text: 'A present for you! Do you want to try it?', pitch: 1.3 }]);
}

function acceptReward(yes) {
  if (yes && state.gift) {
    state.outfit = Object.assign({}, state.outfit, { [state.gift.slot]: state.gift.value });
    save();
    burstAtHero(50);
    Sound.correct();
    Sound.say([{ text: 'So pretty!', pitch: 1.4 }]);
  } else {
    Sound.say([{ text: 'Okay!' }]);
  }
  state.gift = null;
  closeDialog();
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

function resize() {
  const dpr = window.devicePixelRatio || 1;
  screen.width = Math.round(innerWidth * dpr);
  screen.height = Math.round(innerHeight * dpr);
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
}

function drawCharacter(ch, now) {
  const sc = state.scene;
  const p = tileCenter(sc, ch.c, ch.r);
  if (ch.hero) {
    const h = state.hero;
    const bob = h.path.length ? (h.frame ? -1 : 0) : 0;
    drawSprite(vctx, princessSprite(state.outfit, h.frame), p.x, p.y + 1 + bob, h.flip);
  } else {
    const n = ch.npc;
    const idle = Math.sin(now / 400 + n.phase) > 0.6 ? -1 : 0;
    drawSprite(vctx, villagerSprite(n.look, 0), p.x, p.y + 1 + idle, n.flip);
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

function drawOverlay(now) {
  const sc = state.scene;
  const s = state.scale;
  const ctx = sctx;
  const font = '"Baloo 2", "Trebuchet MS", sans-serif';

  // Lamp and window glows.
  ctx.globalCompositeOperation = 'lighter';
  for (const l of sc.lamps) {
    const p = toScreen(l.x, l.y);
    const r = (18 + Math.sin(now / 300 + l.x) * 1.5) * s;
    ctx.globalAlpha = 0.35;
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
      const w = ctx.measureText(sg.text).width + 8 * s;
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
    ctx.fillText(sg.text, p.x, p.y + 0.5 * s);
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
      const w = tileCenter(sc, n.c, n.r);
      const p = toScreen(w.x, w.y - 40 + Math.sin(now / 300 + n.phase) * 1.5);
      ctx.fillStyle = '#ffffff';
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
      ctx.fillStyle = '#ff6fa8';
      ctx.font = `800 ${7 * s}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.letter ? n.letter : '♪', p.x, p.y + 0.5 * s);
    }
  }

  // Exit mats inside rooms get a bobbing arrow.
  if (sc.exit && !state.busy) {
    const w = tileCenter(sc, sc.exit.c + (sc.exitTiles ? 0.5 : 0), sc.exit.r);
    const p = toScreen(w.x, w.y + 10 + Math.sin(now / 250) * 2);
    ctx.font = `${9 * s}px ${font}`;
    ctx.textAlign = 'center';
    ctx.fillText('🚪', p.x, p.y);
  }

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
  for (const m of state.motes) {
    const r = (3 + m.s * 5) * s * (0.8 + 0.2 * Math.sin(now / 500 + m.ph));
    ctx.globalAlpha = 0.18 + 0.12 * Math.sin(now / 700 + m.ph);
    ctx.drawImage(glow(), m.x * screen.width - r, m.y * screen.height - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

// ---- Input ---------------------------------------------------------------

function onPointer(e) {
  Sound.unlock();
  if (state.busy) return;
  const sc = state.scene;
  const dpr = window.devicePixelRatio || 1;
  const sx = e.clientX * dpr;
  const sy = e.clientY * dpr;
  const wx = sx / state.scale + Math.round(state.cam.x);
  const wy = sy / state.scale + Math.round(state.cam.y);
  state.ripples.push({ x: sx, y: sy, t0: performance.now() });

  // Villagers first: they are small and stand in front of things.
  for (const n of sc.npcs) {
    const p = tileCenter(sc, n.c, n.r);
    if (Math.abs(wx - p.x) < 10 && wy > p.y - 44 && wy < p.y + 4) {
      Sound.tap();
      talkTo(n);
      return;
    }
  }

  // Exit mat in a room.
  const t = worldToTile(sc, wx, wy);
  const exits = sc.exitTiles || (sc.exit ? [sc.exit] : []);
  if (exits.some(x => x.c === t.c && x.r === t.r)) {
    walkTo((c, r) => exits.some(x => x.c === c && x.r === r), leaveRoom);
    return;
  }

  // Buildings with doors: walk to the door and go in.
  const hits = sc.objects.filter(o => !o.background && o.canvas && hitObject(o, wx, wy));
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
  ui.choices.querySelectorAll('.choice').forEach(b => b.classList.toggle('pictures', on));
  save();
}

resize();
addEventListener('resize', resize);
state.scene = sceneFor('town');
placeHero(state.scene.start.c, state.scene.start.r);
snapCamera();
renderStars(false);
setPictures(state.pictures);
drawPortrait(ui.startPreview, princessSprite(state.outfit, 0));

screen.addEventListener('pointerdown', onPointer);
ui.replay.addEventListener('click', () => { Sound.tap(); askAgain(); });
ui.close.addEventListener('click', () => { Sound.tap(); closeDialog(); });
ui.rewardYes.addEventListener('click', () => acceptReward(true));
ui.rewardNo.addEventListener('click', () => acceptReward(false));
ui.pictures.addEventListener('click', () => { Sound.tap(); setPictures(!state.pictures); });
ui.mute.addEventListener('click', () => {
  const muted = Sound.toggleMute();
  ui.mute.textContent = muted ? '🔇' : '🔊';
});
addEventListener('keydown', e => {
  if (!ui.dialog.classList.contains('hidden') && ['1', '2', '3'].includes(e.key)) {
    const i = Number(e.key) - 1;
    const b = ui.choices.children[i];
    if (b) choose(i, b);
  }
});
ui.startBtn.addEventListener('click', () => {
  Sound.unlock();
  ui.start.classList.add('hidden');
  showPlace('🌸 소리 마을');
  Sound.say([{ text: `Good morning, Princess ${PLAYER.spoken}! Let's visit the town!`, pitch: 1.3 }]);
});
requestAnimationFrame(frame);
