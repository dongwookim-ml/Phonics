// A friend that grows. Her fairy friend (a helper buddy in the robot
// edition) eats the fairy dust (batteries) she earns in the Fairy Village.
// In her room she taps it, or ✨ on the fairy row of the wardrobe (the
// workbench), and a card opens with the friend big in the middle and a ring
// round it that fills toward the next stage; every tap feeds it one. At
// FRIEND_STAGES it grows: a brighter glow, then a crown (an antenna on a
// buddy), then a little dance now and then. A grown friend sparkles in the
// world. How much each friend has eaten is saved in state.friends, per
// tablet so two tablets on one account add up; nothing is ever taken away
// and it never gets hungry.

const friendUi = {
  card: document.getElementById('feed'),
  title: document.getElementById('fd-title'),
  canvas: document.getElementById('fd-friend'),
  pips: document.getElementById('fd-pips'),
  note: document.getElementById('fd-note'),
  jar: document.getElementById('fd-jar'),
  done: document.getElementById('fd-done'),
  key: null,     // the friend being fed
  shown: 0,      // the ring as drawn, easing toward the real progress
  flies: [],     // dust on its way to the friend: { t0 }
  burst: [],     // sparkles in the card
  party: null,   // a stage just reached: { t0, stage }
  nom: 0,        // when the last bite landed
  last: 0,
  loop: 0,
  saidEmpty: false,
};
const FRIEND_PARTY_MS = 1800;
const FRIEND_FLY_MS = 420;

// state.friends[key] is { [device]: n } (a plain number in an earlier save).
function friendFed(key) {
  const v = (state.friends || {})[key];
  return v && typeof v === 'object' ? Object.values(v).reduce((a, x) => a + (x | 0), 0) : v | 0;
}
const friendStageOf = fed => FRIEND_STAGES.filter(n => fed >= n).length;
const friendStage = key => friendStageOf(friendFed(key));
// How far from the last stage to the next one, 0 to 1 (1 once grown).
function friendProgressOf(fed) {
  const s = friendStageOf(fed);
  if (s >= FRIEND_STAGES.length) return 1;
  const from = s ? FRIEND_STAGES[s - 1] : 0;
  return (fed - from) / (FRIEND_STAGES[s] - from);
}
const friendGrown = key => friendStage(key) >= FRIEND_STAGES.length;
// The friend she has on, or null.
const friendWorn = () => (FAIRIES[state.outfit.fairy] && state.outfit.fairy !== 'none' ? state.outfit.fairy : null);
const friendDustIcon = () => (isCaptain() ? '⚡' : '✨');
const friendInRoom = () => !!state.scene && state.scene === state.scenes.yuna;

// ---- In the world --------------------------------------------------------

// From stage 2 a crown (an antenna with a blinking bulb on a buddy) sits in
// three new rows over the sprite. The anchor moves down with them, so the
// friend itself stays where it was.
const FRIEND_HATS = {
  crown: ['y.y.y', 'yypyy', 'YYYYY'],
  antenna: ['.lll.', '..y..', '..m..'],
};
const friendCache = new Map();
function friendSprite(key, frame, stage = friendStage(key)) {
  const base = fairySprite(key, frame);
  if (stage < 2) return base;
  const ck = `${key}|${frame}`;
  if (friendCache.has(ck)) return friendCache.get(ck);
  const rows = isCaptain() ? FRIEND_HATS.antenna : FRIEND_HATS.crown;
  const pal = { y: '#ffd34d', Y: '#e0a52a', p: '#ff6fa8', m: '#9aa4b8', l: frame ? '#ff8fb0' : '#fff27a' };
  const ink = isCaptain() ? '#33304f' : '#4a2c4f';
  const W = base.canvas.width;
  const cv = makeCanvas(W, base.canvas.height + 3);
  const ctx = cv.getContext('2d');
  ctx.drawImage(base.canvas, 0, 3);
  const x0 = base.ax - 2;
  const at = (x, y) => (rows[y] || '')[x - x0];
  const on = (x, y) => { const ch = at(x, y); return !!ch && ch !== '.'; };
  for (let y = 0; y < 3; y++) for (let x = 0; x < W; x++) {
    if (on(x, y)) px(ctx, x, y, 1, 1, pal[at(x, y)]);
    else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => on(x + dx, y + dy))) px(ctx, x, y, 1, 1, ink);
  }
  const sprite = { canvas: cv, ax: base.ax, ay: base.ay + 3 };
  friendCache.set(ck, sprite);
  return sprite;
}

// The soft light round her friend: bigger and brighter as it grows.
function friendGlow(key) {
  const s = friendStage(key);
  return { r: [11, 15, 17, 19][s], a: [0.2, 0.28, 0.32, 0.36][s] };
}

// Where the friend is drawn this frame, relative to where it flies: a quick
// twirl when she taps it, and at stage 3 a loop-the-loop every few seconds.
function friendFly(f, key, now) {
  const twirl = f.twirl ? (now - f.twirl) / 700 : 1;
  if (twirl < 1) return { x: 0, y: -Math.round(Math.sin(twirl * Math.PI) * 5), flip: Math.floor(twirl * 6) % 2 === 1 };
  if (friendStage(key) < 3) return { x: 0, y: 0, flip: false };
  const k = (now % 7000) / 1300;
  if (k >= 1) return { x: 0, y: 0, flip: false };
  const a = k * Math.PI * 2;
  return { x: Math.round(Math.sin(a) * 7), y: -Math.round((1 - Math.cos(a)) * 5), flip: k > 0.25 && k < 0.75 };
}

// A grown friend sparkles every few seconds, more often the bigger it is.
let friendSparkAt = 0;
function friendSparkle(f, key, now) {
  const s = friendStage(key);
  if (!s || now - friendSparkAt < [0, 5200, 3800, 2600][s]) return;
  friendSparkAt = now;
  friendBurstAt(f.x, f.y, FAIRIES[key].glow, 3 + s * 2);
}
function friendBurstAt(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 10 + Math.random() * 20;
    state.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 16, life: 0.6 + Math.random() * 0.5, color: i % 2 ? '#ffffff' : color, star: true });
  }
}

// In her room: a ring round the friend shows how far it is to the next
// stage, and a bobbing ✨ bubble when she has dust to give it.
function drawFriendHint(now) {
  const key = friendWorn();
  const f = state.fairyAt;
  if (!key || !f || !friendInRoom()) return;
  const s = state.scale;
  const ctx = sctx;
  const d = friendFly(f, key, now);
  const p = toScreen(f.x + d.x, f.y + d.y);
  const r = 12 * s;
  ctx.lineCap = 'round';
  ctx.lineWidth = 3 * s;
  ctx.strokeStyle = 'rgba(74,44,79,0.22)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2 * s;
  ctx.strokeStyle = '#ffc21a';
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, friendProgressOf(friendFed(key))));
  ctx.stroke();
  ctx.lineCap = 'butt';
  if (!state.dust || friendGrown(key)) return;
  const b = toScreen(f.x + d.x, f.y + d.y - 21 + Math.sin(now / 280) * 1.5);
  ctx.fillStyle = '#fff4b8';
  ctx.strokeStyle = inkColors().ink;
  ctx.lineWidth = s * 0.8;
  roundRect(ctx, b.x - 7 * s, b.y - 5 * s, 14 * s, 10 * s, 4 * s);
  ctx.fill();
  ctx.stroke();
  ctx.font = `${7 * s}px "Baloo 2", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(friendDustIcon(), b.x, b.y + 0.5 * s);
}

// A tap on her flying friend: in her room it opens the feeding card,
// anywhere else the friend twirls and sparkles. True when it took the tap.
function friendTap(wx, wy) {
  const key = friendWorn();
  const f = state.fairyAt;
  if (!key || !f || Math.abs(wx - f.x) > 11 || Math.abs(wy - f.y) > 11) return false;
  if (friendInRoom()) {
    Sound.tap();
    openFeed();
    return true;
  }
  f.twirl = performance.now();
  friendBurstAt(f.x, f.y, FAIRIES[key].glow, 8);
  Sound.tune('chime');
  return true;
}

// The ✨ chip at the front of the fairy row in the wardrobe (workbench).
function friendChip(chips) {
  const key = friendWorn();
  if (!key) return;
  const stage = friendStage(key);
  const b = document.createElement('button');
  b.className = 'chip feed-chip';
  b.innerHTML = `<span class="ic">${friendDustIcon()}</span><span class="nm">${state.dust}</span>` +
    `<span class="pips">${'●'.repeat(stage)}${'○'.repeat(FRIEND_STAGES.length - stage)}</span>`;
  b.addEventListener('click', () => { Sound.tap(); openFeed(); });
  chips.prepend(b);
}

// ---- The feeding card ----------------------------------------------------

function openFeed() {
  const key = friendWorn();
  if (!key) return;
  if (!state.friends) state.friends = {};
  state.busy = true; // the wardrobe may be open under it too
  // She stops where she is: she doesn't walk out of the room under the card.
  const h = state.hero;
  h.onArrive = null;
  h.path = h.path.slice(0, 1);
  Object.assign(friendUi, { key, shown: friendProgressOf(friendFed(key)), flies: [], burst: [], party: null, saidEmpty: false, last: 0 });
  const info = FAIRIES[key];
  friendUi.title.textContent = `${info.icon} ${info.name}`;
  friendRender();
  friendUi.card.classList.remove('hidden');
  if (!friendUi.loop) friendUi.loop = requestAnimationFrame(friendFrame);
  if (friendGrown(key)) {
    friendUi.party = { t0: performance.now(), stage: FRIEND_STAGES.length };
    Sound.say([{ text: fill(LINES.friendGrow[FRIEND_STAGES.length - 1], {}), narrator: true }]);
  } else if (!state.dust) {
    friendUi.saidEmpty = true;
    Sound.say([{ text: line('friendEmpty'), narrator: true }]);
  } else Sound.say([{ text: line('friendHello'), narrator: true }]);
}

function closeFeed() {
  if (friendUi.card.classList.contains('hidden')) return;
  Sound.tap();
  // Dust still on its way lands now: a stage it reaches is still celebrated.
  const key = friendUi.key;
  const fed = friendFed(key);
  const grew = friendStageOf(fed) > friendStageOf(fed - friendUi.flies.length) ? friendStageOf(fed) : 0;
  Sound.say(grew ? [{ pause: 300 }, { text: fill(LINES.friendGrow[grew - 1], {}), narrator: true }] : []);
  if (grew) {
    Sound.party();
    if (state.fairyAt) friendBurstAt(state.fairyAt.x, state.fairyAt.y, FAIRIES[key].glow, 24);
  }
  friendUi.card.classList.add('hidden');
  friendUi.flies = [];
  friendUi.party = null;
  state.busy = busyNow(); // js/game.js
  save();
  if (!ui.wardrobe.classList.contains('hidden')) renderWardrobe();
}

// The jar's count, the three stage badges and a line for the parent.
function friendRender() {
  const key = friendUi.key;
  const stage = friendStage(key);
  const grown = stage >= FRIEND_STAGES.length;
  friendUi.jar.innerHTML = `<span class="ic">${friendDustIcon()}</span><span class="count">${state.dust}</span>`;
  friendUi.jar.classList.toggle('empty', !state.dust || grown);
  const icons = isCaptain() ? ['💡', '📡', '🎵'] : ['✨', '👑', '🎵'];
  friendUi.pips.innerHTML = icons.map((ic, i) => `<span class="pip${i < stage ? ' on' : ''}">${ic}</span>`).join('');
  const where = isCaptain() ? '드론 마을에서 ⚡ 배터리를 모아요' : '요정 마을에서 ✨ 요정의 가루를 모아요';
  friendUi.note.textContent = grown ? '다 컸어요! 💖' : state.dust ? `눌러서 ${isCaptain() ? '배터리를' : '가루를'} 주세요` : where;
}

// A celebration on the card ends at a tap: on the friend, or outside the
// card, which then doesn't close it yet (outsideTap in js/game.js). True
// when there was one.
function friendSkip() {
  if (!friendUi.party) return false;
  friendUi.party = null;
  return true;
}

// One tap: one dust flies into the friend. A tap during a celebration skips it.
function feedOnce() {
  const key = friendUi.key;
  if (!key || friendUi.card.classList.contains('hidden')) return;
  const now = performance.now();
  if (friendSkip()) return;
  if (friendGrown(key)) {
    friendUi.party = { t0: now, stage: FRIEND_STAGES.length, dance: true };
    Sound.tune('chime');
    return;
  }
  if (!state.dust) {
    Sound.tap();
    friendUi.jar.classList.remove('nope');
    void friendUi.jar.offsetWidth;
    friendUi.jar.classList.add('nope');
    if (!friendUi.saidEmpty) { friendUi.saidEmpty = true; Sound.say([{ text: line('friendEmpty'), narrator: true }]); }
    return;
  }
  state.dust--;
  const was = state.friends[key];
  const fed = was && typeof was === 'object' ? was : was ? { _: was | 0 } : {};
  fed[Progress.device] = (fed[Progress.device] | 0) + 1;
  state.friends[key] = fed;
  questAdd('feed'); // today's adventures (js/quest.js)
  friendUi.flies.push({ t0: now, side: Math.random() < 0.5 ? -1 : 1 });
  renderDust(true);
  Sound.tune('clink');
  friendRender();
}

function friendStart(stage) {
  friendUi.party = { t0: performance.now(), stage };
  Sound.party();
  Sound.say([{ pause: 300 }, { text: fill(LINES.friendGrow[stage - 1], {}), narrator: true }]);
  for (let i = 0; i < 40; i++) friendCardSpark(0.5, 0.5, 0.5 + Math.random());
  save();
  friendRender();
}

function friendFrame(now) {
  friendUi.loop = 0;
  if (friendUi.card.classList.contains('hidden')) return;
  friendDraw(now);
  friendUi.loop = requestAnimationFrame(friendFrame);
}

// A sparkle in the card at (u, v), in parts of its width and height.
function friendCardSpark(u, v, speed = 1) {
  const a = Math.random() * Math.PI * 2;
  const s = (0.15 + Math.random() * 0.35) * speed;
  friendUi.burst.push({ u, v, du: Math.cos(a) * s, dv: Math.sin(a) * s - 0.1, life: 0.7 + Math.random() * 0.5, white: Math.random() < 0.4 });
}

function friendStar(ctx, x, y, z, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - z / 2, y - z * 1.5, z, z * 3);
  ctx.fillRect(x - z * 1.5, y - z / 2, z * 3, z);
}

function friendDraw(now) {
  const cv = friendUi.canvas;
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(cv.clientWidth * dpr);
  const h = Math.round(cv.clientHeight * dpr);
  if (!w || !h) return;
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const dt = Math.min(0.05, friendUi.last ? (now - friendUi.last) / 1000 : 0);
  friendUi.last = now;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;
  const key = friendUi.key;
  const info = FAIRIES[key];
  const cx = w / 2;
  const cy = h * 0.48;
  const R = Math.min(w, h) * 0.4;

  // Dust lands: a nibble, and a new stage once the ring is full.
  let landed = friendFed(key) - friendUi.flies.length;
  for (const fly of friendUi.flies.slice()) {
    if (now - fly.t0 < FRIEND_FLY_MS) continue;
    friendUi.flies.splice(friendUi.flies.indexOf(fly), 1);
    friendUi.nom = now;
    for (let i = 0; i < 6; i++) friendCardSpark(0.5, 0.48);
    if (friendStageOf(landed + 1) > friendStageOf(landed)) friendStart(friendStageOf(landed + 1));
    landed++;
  }
  const fed = friendFed(key) - friendUi.flies.length;
  const stage = friendStageOf(fed);
  if (friendUi.party && now - friendUi.party.t0 > FRIEND_PARTY_MS) friendUi.party = null;
  const party = friendUi.party;
  const pk = party ? (now - party.t0) / FRIEND_PARTY_MS : 0;

  // Glow behind the friend.
  const gr = R * (0.85 + stage * 0.12);
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
  grad.addColorStop(0, shade(info.glow, 30));
  grad.addColorStop(0.5, info.glow);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = 0.45 + stage * 0.12 + (party ? 0.2 * Math.sin(pk * Math.PI) : 0);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, gr, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // The ring: the part filled is the way to the next stage.
  const target = friendProgressOf(fed);
  if (target < friendUi.shown - 0.001 && !party) friendUi.shown = target;
  friendUi.shown += (target - friendUi.shown) * Math.min(1, dt * 10);
  const lw = R * 0.13;
  ctx.lineCap = 'round';
  ctx.lineWidth = lw;
  ctx.strokeStyle = 'rgba(74,44,79,0.14)';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  const full = party || stage >= FRIEND_STAGES.length;
  ctx.strokeStyle = full ? (Math.floor(now / 120) % 2 && party ? '#fff27a' : '#ffc21a') : '#ffc21a';
  ctx.beginPath();
  ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (full ? 1 : Math.max(0.001, friendUi.shown)));
  ctx.stroke();
  ctx.lineWidth = lw * 0.35;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(cx, cy, R - lw * 0.18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (full ? 1 : Math.max(0.001, friendUi.shown)));
  ctx.stroke();

  // The friend, bobbing; it squashes for a bite and jumps and spins when it grows.
  const sprite = friendSprite(key, Math.floor(now / 110) % 2, stage);
  const k = Math.max(2, Math.floor((R * 1.15) / sprite.canvas.width));
  let y = cy + Math.sin(now / 320) * R * 0.04;
  let flip = false;
  let sx = 1;
  let sy = 1;
  if (party) {
    y -= Math.abs(Math.sin(pk * Math.PI * 3)) * R * 0.22;
    flip = Math.floor(pk * 10) % 2 === 1;
    const pop = party.dance ? 1 : 1 + 0.25 * Math.sin(Math.min(1, pk * 3) * Math.PI);
    sx = pop;
    sy = pop;
  } else if (now - friendUi.nom < 160) { sx = 1.1; sy = 0.86; }
  const dw = sprite.canvas.width * k * sx;
  const dh = sprite.canvas.height * k * sy;
  ctx.save();
  ctx.translate(cx, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(sprite.canvas, -sprite.ax * k * sx, -sprite.ay * k * sy, dw, dh);
  ctx.restore();

  // Dust on its way from the jar.
  for (const fly of friendUi.flies) {
    const t = (now - fly.t0) / FRIEND_FLY_MS;
    const x = cx + Math.sin(t * Math.PI) * R * 0.5 * fly.side;
    const fy = h * 0.98 + (cy - h * 0.98) * t;
    friendStar(ctx, x, fy, Math.max(2, R * 0.05), t > 0.5 ? '#ffffff' : info.glow);
  }
  // Sparkles.
  for (const p of friendUi.burst) {
    p.u += p.du * dt;
    p.v += p.dv * dt;
    p.dv += 0.25 * dt;
    p.life -= dt;
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    friendStar(ctx, p.u * w, p.v * h, Math.max(2, R * 0.035), p.white ? '#ffffff' : info.glow);
  }
  ctx.globalAlpha = 1;
  friendUi.burst = friendUi.burst.filter(p => p.life > 0);
}

friendUi.canvas.addEventListener('pointerdown', e => { e.preventDefault(); feedOnce(); });
friendUi.jar.addEventListener('click', feedOnce);
friendUi.done.addEventListener('click', closeFeed);
