// First steps and rest.
// - A new player sees a bouncing 👆 on the nearest villager until she first
//   taps one, and once more after her first present (state.guide.step goes
//   0 → 1 → 2 → 3; players from before this have 3).
// - After GUIDE_IDLE_MS with no tap while nothing is open, the nearest
//   villager hops and calls her over (LINES.nudge), at most once a minute
//   and GUIDE_NUDGES times in a row.
// - The parent panel's play-time limit (state.settings.playLimit minutes a
//   day, counted in state.playtime while the game is on screen) puts the
//   town to sleep at the next quiet moment: no dialog, present or anything
//   else open. Only the parent password wakes it, for another stretch of
//   the limit from then on (a wake is counted in state.playtime.wakes, and
//   the minutes played when it came in state.playtime.woke, so two tablets
//   can't undo it); a town left asleep wakes by itself the next day.
//   The background music (js/music.js) stops while it sleeps.
// - The parent panel can also hide the 🔊 button from the child.

const guide = {
  lastTap: performance.now(),
  nudgedAt: -Infinity,
  nudges: 0,
  asleep: false,
  sleptOn: null, // the day it fell asleep
  el: document.getElementById('sleep'),
  key: document.getElementById('sleep-key'),
  form: document.getElementById('sleep-form'),
  pw: document.getElementById('sleep-pw'),
  err: document.getElementById('sleep-err'),
};
const GUIDE_IDLE_MS = 20000;
const GUIDE_NUDGE_GAP = 60000;
const GUIDE_NUDGES = 3;

addEventListener('pointerdown', () => { guide.lastTap = performance.now(); guide.nudges = 0; }, true);
addEventListener('keydown', () => { guide.lastTap = performance.now(); }, true);

// The town is on screen: past the start screen and not asleep.
const guidePlaying = () => ui.start.classList.contains('hidden') && !guide.asleep;

// The villager nearest to her who can be talked to (not a shopkeeper, the
// hairdresser, a ride or a caught monster).
const guideAsks = n => !n.mount && !n.shop && !n.salon && !n.caught;
function guideNearest() {
  const h = state.hero;
  let best = null;
  let far = Infinity;
  for (const n of state.scene.npcs) {
    if (!guideAsks(n)) continue;
    const d = Math.hypot(n.c - h.c, n.r - h.r);
    if (d < far) { far = d; best = n; }
  }
  return best;
}

// ---- First steps -----------------------------------------------------------

// A finger tapping on the nearest villager, with a soft ring at their feet.
function drawGuide(now) {
  const g = state.guide;
  if (!g || (g.step !== 0 && g.step !== 2) || !guidePlaying() || state.busy) return;
  const n = guideNearest();
  if (!n) return;
  const s = state.scale;
  const ctx = sctx;
  const w = tileCenter(state.scene, n.c, n.r);
  const feet = toScreen(w.x, w.y);
  const pulse = (now % 1100) / 1100;
  ctx.strokeStyle = `rgba(255,214,77,${1 - pulse})`;
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.ellipse(feet.x, feet.y, (6 + pulse * 8) * s, (3 + pulse * 4) * s, 0, 0, Math.PI * 2);
  ctx.stroke();
  const tap = Math.abs(Math.sin(now / 280));
  const p = toScreen(w.x + 5, w.y - 17 + tap * 5);
  ctx.font = `${20 * s}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(255,255,255,0.95)';
  ctx.shadowBlur = 5 * s;
  ctx.fillText('👆', p.x, p.y);
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

// Her first tap on a villager (onPointer in js/game.js), and the one after
// her first present.
function guideTalked() {
  const g = state.guide;
  if (g && (g.step === 0 || g.step === 2)) { g.step++; save(); }
}
// A present was accepted or put away (acceptReward); things bought in the
// shop don't count.
function guideGift(giver) {
  const g = state.guide;
  if (g && g.step === 1 && giver && !giver.shop) { g.step = 2; save(); }
}

// ---- Calling her over --------------------------------------------------------

// How far a villager who is calling her hops right now (negative is up).
function guideBob(n, now) {
  const k = n.nudgeAt ? (now - n.nudgeAt) / 1600 : 1;
  return k >= 0 && k < 1 ? -Math.round(Math.abs(Math.sin(k * Math.PI * 4)) * 5 * (1 - k * 0.6)) : 0;
}

// Every frame (js/game.js): the play-time clock and the idle nudge.
function guideTick(now, ms) {
  if (state.paused) return; // the parent panel is open
  // "See you tomorrow": a tab left open overnight wakes up in the morning.
  if (guide.asleep && !document.hidden && guide.sleptOn !== guideDay()) guideWake(true);
  guidePlayTime(ms);
  if (!guidePlaying() || state.busy || state.hero.path.length) return;
  if (now - guide.lastTap < GUIDE_IDLE_MS || now - guide.nudgedAt < GUIDE_NUDGE_GAP || guide.nudges >= GUIDE_NUDGES) return;
  const n = guideNearest();
  if (!n) return;
  guide.nudgedAt = now;
  guide.nudges++;
  n.nudgeAt = now;
  Sound.say([{ text: line('nudge') }], voiceOf(n));
}

// ---- Play time ---------------------------------------------------------------

function guideDay() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
// Minutes played today, for the parent panel.
function guidePlayedMs() {
  const p = state.playtime || {};
  return p.day === guideDay() ? p.ms | 0 : 0;
}
function guidePlayTime(ms) {
  if (!guidePlaying() || document.hidden || !(ms > 0)) return;
  if (!state.playtime) state.playtime = {};
  const p = state.playtime;
  const day = guideDay();
  if (p.day !== day) Object.assign(p, { day, ms: 0, wakes: 0 });
  // A stall (the tab was away) doesn't count.
  p.ms = (p.ms | 0) + Math.min(ms, 250);
  if (guideTimeUp() && !state.busy && !state.gift && !state.hero.onArrive) guideSleep();
}
// Today's play time is used up: the limit, once more for each wake, and
// never sooner than the limit after today's last wake (`woke`: the minutes
// may already be far past the limit when the parent sets it late). A wake
// noted on another day doesn't count: a new day's count starts without
// clearing it, here and in older versions of the game.
function guideTimeUp() {
  const limit = ((state.settings && state.settings.playLimit) | 0) * 60000;
  const p = state.playtime || {};
  const woke = p.woke && p.woke.day === p.day ? p.woke.ms | 0 : 0;
  return !!limit && p.day === guideDay() && (p.ms | 0) >= Math.max(limit * (1 + (p.wakes | 0)), woke + limit);
}

// The town goes to sleep: it dims, stars twinkle, and the narrator says
// good night. Nothing is lost.
function guideSleep() {
  guide.asleep = true;
  guide.sleptOn = guideDay();
  state.busy = true;
  state.hero.path = [];
  save();
  if (!guide.el.querySelector('.sleep-star')) {
    for (let i = 0; i < 28; i++) {
      const s = document.createElement('span');
      s.className = 'sleep-star';
      s.style.left = `${4 + Math.random() * 92}%`;
      s.style.top = `${3 + Math.random() * 70}%`;
      s.style.animationDelay = `${(Math.random() * 2.4).toFixed(2)}s`;
      if (i % 4 === 0) s.classList.add('big');
      guide.el.prepend(s);
    }
  }
  guide.form.classList.add('hidden');
  guide.key.classList.remove('hidden');
  guide.err.textContent = '';
  guide.el.classList.remove('hidden');
  musicUpdate(); // the music goes quiet (js/music.js)
  Sound.say([{ pause: 600 }, { text: line('sleep'), narrator: true }]);
}

// The parent's password wakes the town for another stretch of play, the
// limit from now on; the next day (`morning`) it wakes by itself and the
// day's count starts again.
function guideWake(morning) {
  guide.asleep = false;
  guide.el.classList.add('hidden');
  const p = state.playtime || (state.playtime = {});
  if (!morning) {
    p.wakes = (p.wakes | 0) + 1;
    p.woke = { day: p.day, ms: p.ms | 0 };
  }
  state.busy = busyNow(); // js/game.js
  guide.lastTap = performance.now();
  save();
  musicUpdate();
  if (!morning) Sound.correct();
}

guide.key.addEventListener('click', () => {
  Sound.tap();
  guide.key.classList.add('hidden');
  guide.form.classList.remove('hidden');
  guide.pw.value = '';
  setTimeout(() => guide.pw.focus(), 50);
});
// The same check as the parent panel (Account.verify: { ok, reason }).
guide.form.addEventListener('submit', async e => {
  e.preventDefault();
  guide.err.textContent = '확인하는 중…';
  let r = { ok: false, reason: 'busy' };
  try {
    r = typeof Account !== 'undefined' ? await Account.verify(guide.pw.value) : { ok: guide.pw.value === '0000', reason: 'wrong' };
  } catch (x) { /* r stays 'busy' */ }
  if (r && r.ok === true) { guideWake(); return; }
  const errors = typeof PARENT_ERRORS !== 'undefined' ? PARENT_ERRORS : {};
  guide.err.textContent = errors[r && r.reason] || '비밀번호가 맞지 않아요.';
  guide.pw.select();
});
// Keys typed for the password never reach the game.
guide.el.addEventListener('keydown', e => e.stopPropagation());

// ---- Settings from the parent panel -----------------------------------------

// Hides or shows the child's 🔊 button. A hidden button never leaves her
// without sound.
function guideApplySettings() {
  const hide = !!(state.settings && state.settings.hideMute);
  ui.mute.classList.toggle('hidden', hide);
  if (hide && Sound.muted) { Sound.toggleMute(); ui.mute.textContent = '🔊'; }
}
addEventListener('DOMContentLoaded', guideApplySettings);
