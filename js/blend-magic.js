// 소리 합치기 마법 (sound magic): a little show of blending she does herself,
// in about five or six seconds. Each blend question brings its word
// (`magic` in js/quiz.js: { w, e, parts }):
//  - bubbles pop out one by one, each with its letter in it, saying its
//    sound (/s/ … /u/ … /n/); a long vowel's bubble shows its capital and
//    says the letter's name (E);
//  - she taps 🐢 and the bubbles slide closer while a turtle creeps along
//    under them and the sounds are said slowly: stretched where a sound can
//    be held (sss-uuu-nnn), just spaced out for one that can't (/t/, /k/);
//  - she taps 🐇 (🚀 in the robot edition) and they bump close while a
//    rabbit hops along and the sounds are said fast (s-u-n);
//  - she taps ✨ (💥) and they smash together with a pop: the picture comes
//    out with sparkles and the word is said (sun!).
// One sound (blending's first step) is the short show: its bubble and its
// sound, then ✨ and the picture. The button to tap next bounces, a 👆 comes
// after a moment, and a step she leaves alone plays by itself a while later,
// so the show never waits for ever. It moves on timers, the same with the
// sound off or a line not recorded yet; its own lines are said once they
// are recorded (Sound.hasClip). ✖ skips to the end.
// It shows:
//  - the first time she is at the two-sound and at the three-sound step of
//    blending, once each (state.guide.magic, the highest seen), with an easy
//    word (MAGIC_INTRO), before the question: openDialog in js/game.js,
//    openMini in js/minigame.js;
//  - as the answer after a second miss on a blend question, in the dialog
//    (showAnswer in js/game.js) and in the Unicorn Village's game (miniMiss
//    in js/minigame.js): the dialog steps aside for it, the game waits, and
//    then the right card (or unicorn) glows for her to tap.
// The card is one of BUSY_CARDS and OUTSIDE_CARDS (js/game.js): a tap
// outside it does nothing. Its timers wait while the parent panel is open
// (whenPlaying), and the panel's hush only moves it on to its next step.

const MG_IDLE_MS = 7000;  // a step she leaves alone plays by itself
const MG_HINT_MS = 1500;  // a 👆 on the button to tap
const MG_HOLD_MS = 1300;  // the picture stays after the word
// Sounds that can be held (sss, mmm, aaa) and the letter names: said
// slowly they are stretched, at this speed; a stop (/t/, /k/) can't be.
const MG_HELD = /^(?:[aeioufsvzmnlr]|ff|ss|zz|ll|sh|th|ng|[AEIOUR])$/;
const MG_SLOW = 0.6;
// About how long a sound takes, for the clock when the voice doesn't say it.
const mgMs = (p, slow) => (MG_HELD.test(p) ? (slow ? 850 : 480) : 160);
const MG_COLORS = ['#ffb3d4', '#a8dcff', '#bff0b4', '#ffe08a', '#d8c4ff'];

const blendMagic = (() => {
  const el = document.createElement('section');
  el.id = 'magic';
  el.className = 'magic hidden';
  el.innerHTML = `
    <button class="round small mg-close" type="button" title="건너뛰기">✖</button>
    <div class="mg-stage">
      <div class="mg-row"></div>
      <div class="mg-runner"></div>
      <div class="mg-pop"><span class="mg-pic"></span><span class="mg-word"></span></div>
    </div>
    <div class="mg-steps">
      <button class="mg-step" data-step="slow" type="button" title="천천히">🐢</button>
      <button class="mg-step" data-step="fast" type="button" title="빠르게">${isCaptain() ? '🚀' : '🐇'}</button>
      <button class="mg-step" data-step="pop" type="button" title="펑!">${isCaptain() ? '💥' : '✨'}</button>
    </div>`;
  document.body.append(el);
  const q = s => el.querySelector(s);
  return {
    el, stage: q('.mg-stage'), row: q('.mg-row'), runner: q('.mg-runner'), pop: q('.mg-pop'), pic: q('.mg-pic'), word: q('.mg-word'),
    close: q('.mg-close'), buttons: [...el.querySelectorAll('.mg-step')],
    m: null,      // the word: { w, e, parts }
    done: null,   // run once it is over
    step: null,   // the button waiting for her: 'slow', 'fast' or 'pop'; else what plays
    token: 0,     // bumps whenever it opens or closes, so stale timers give up
  };
})();

const blendMagicShown = () => !blendMagic.el.classList.contains('hidden');

// A game timer (later in js/game.js: it waits while the parent panel is
// open) for the show playing now, which gives up once it has closed.
function mgLater(ms, fn) {
  const token = blendMagic.token;
  later(ms, () => { if (blendMagic.token === token) fn(); });
}

// One of its own lines, once it is recorded (in the narrator's voice).
function mgLine(kind) {
  const text = line(kind);
  return Sound.hasClip(text) ? [{ text, narrator: true }] : [];
}

// The first question at a new step of blending (her own tier, 2 or 3,
// before she has seen it there): the easy word to show it with, once.
// Never the answer of the question it comes before, and if the other will
// do, none of its cards nor of `avoid` (the answers of a minigame's later
// rounds).
function blendMagicIntro(q, avoid = []) {
  if (!q || q.ladder !== 'blend' || typeof state === 'undefined') return null;
  const t = Quiz.skill('blend').t;
  const seen = ((state.guide || {}).magic) | 0;
  if (q.tier !== t || seen >= t || !MAGIC_INTRO[t]) return null;
  const near = (q.options || []).map(o => o.wrong).concat(avoid);
  const ok = MAGIC_INTRO[t].filter(w => w !== q.target);
  const w = ok.find(w => !near.includes(w)) || ok[0];
  const m = w && Quiz.magic(w);
  if (!m) return null;
  if (!state.guide) state.guide = {};
  state.guide.magic = t;
  save();
  return m;
}

// Says `parts`, then runs fn once they have been said, or after `ms` at the
// latest (the voice can be muted, slow or missing).
function blendMagicAfter(parts, who, ms, fn) {
  let done = false;
  const go = () => { if (!done) { done = true; fn(); } };
  Sound.say(parts.concat({ pause: 200 }, { call: go }), who);
  later(Sound.muted ? 300 : ms, go);
}

// Opens the show for `m`. `intro`: the first time at a step, with its hello
// ("Let's put the sounds together!"). `done` runs once it is over: popped,
// or skipped with ✖ (not when what it was on closes it: closeBlendMagic).
function openBlendMagic(m, { intro = false, done = null } = {}) {
  const g = blendMagic;
  g.token++;
  Object.assign(g, { m, done, intro, step: 'appear' });
  const short = m.parts.length < 2;
  g.el.classList.toggle('short', short);
  g.el.classList.remove('slow', 'fast', 'smash', 'popped');
  g.row.innerHTML = m.parts.map((p, i) => `<span class="mg-bubble${/^[A-Z]$/.test(p) ? ' name' : ''}" style="--c:${MG_COLORS[i % MG_COLORS.length]}">${p}</span>`).join('');
  g.row.style.setProperty('--n', m.parts.length);
  g.pic.textContent = m.e;
  g.word.innerHTML = `<span class="first">${m.w[0]}</span>${m.w.slice(1)}`;
  g.runner.textContent = '';
  g.runner.className = 'mg-runner';
  for (const b of g.buttons) {
    b.classList.remove('next', 'hint', 'done');
    b.classList.toggle('hidden', short && b.dataset.step !== 'pop');
    b.disabled = true;
  }
  g.el.classList.remove('hidden');
  document.body.classList.add('magic-on');
  state.busy = true;
  mgAppear();
}

// Closes it without running `done`: what it was on has gone (the dialog
// closed, the game ended).
function closeBlendMagic() {
  if (!blendMagicShown()) return;
  blendMagic.token++;
  blendMagic.el.classList.add('hidden');
  document.body.classList.remove('magic-on');
  state.busy = busyNow(); // js/game.js
}

// Over: it closes and `done` runs (the dialog comes back, the game goes on).
function mgFinish() {
  const g = blendMagic;
  const done = g.done;
  g.done = null;
  g.token++;
  g.el.classList.add('hidden');
  document.body.classList.remove('magic-on');
  if (done) done();
  state.busy = busyNow();
}

// Plays a part of the show: speech parts and beats ({ beat, at }). A beat
// runs when the voice gets to it, or `at` ms in on the clock if the voice
// doesn't (the sound off, a sound not recorded, the parent panel hushed it):
// a bit later than that while the voice is on, so it never runs ahead.
function mgPlay(seq) {
  const token = blendMagic.token;
  const parts = [];
  for (const x of seq) {
    if (!x.beat) { parts.push(x); continue; }
    let ran = false;
    const run = () => { if (!ran && blendMagic.token === token) { ran = true; x.beat(); } };
    parts.push({ call: run });
    mgLater(Sound.muted ? x.at : x.at * 1.4 + 600, run);
  }
  Sound.say(parts);
}

// A bubble says its sound: it is in, and glows while it says it.
function mgBubble(i, cls) {
  const bubbles = [...blendMagic.row.children];
  bubbles.forEach((b, j) => {
    b.classList.toggle('say', j === i);
    if (j === i) {
      b.classList.add('in');
      if (cls) { b.classList.remove(cls); void b.offsetWidth; b.classList.add(cls); }
    }
  });
}

// The bubbles pop out, each saying its sound.
function mgAppear() {
  const g = blendMagic;
  const seq = [];
  let at = 250;
  if (g.intro) {
    const hello = mgLine('magicHello');
    if (hello.length) { seq.push(...hello, { pause: 300 }); at += 1800; }
  }
  g.m.parts.forEach((p, i) => {
    seq.push({ beat: () => mgBubble(i, 'pop-in'), at }, Quiz.sayPart(p), { pause: 320 });
    at += mgMs(p) + 320;
  });
  seq.push({ beat: () => { mgBubble(-1); mgNext(g.m.parts.length > 1 ? 'slow' : 'pop'); }, at });
  mgPlay(seq);
}

// The button for the next step bounces; a 👆 after a moment; it plays by
// itself if she leaves it.
function mgNext(step) {
  const g = blendMagic;
  g.step = step;
  for (const b of g.buttons) {
    const on = b.dataset.step === step;
    b.classList.toggle('next', on);
    b.classList.remove('hint');
    b.disabled = !on;
  }
  const btn = g.buttons.find(b => b.dataset.step === step);
  mgLater(MG_HINT_MS, () => { if (g.step === step) btn.classList.add('hint'); });
  mgLater(MG_IDLE_MS, () => { if (g.step === step) mgGo(step); });
}

function mgGo(step) {
  const g = blendMagic;
  if (g.step !== step) return;
  const btn = g.buttons.find(b => b.dataset.step === step);
  btn.classList.remove('next', 'hint');
  btn.classList.add('done');
  btn.disabled = true;
  g.step = `${step}ing`;
  ({ slow: mgSlow, fast: mgFast, pop: mgPop })[step]();
}

// The animal that runs along under the bubbles, from the first to the last
// over `ms`.
function mgRun(icon, cls, ms) {
  const r = blendMagic.runner;
  r.textContent = icon;
  r.className = `mg-runner ${cls}`;
  r.style.transitionDuration = '0s';
  r.style.left = '8%';
  void r.offsetWidth;
  r.style.transitionDuration = `${ms}ms`;
  r.style.left = '84%';
}

// 🐢: closer, slowly, the sounds stretched.
function mgSlow() {
  const g = blendMagic;
  const seq = mgLine('magicSlow');
  let at = seq.length ? 900 : 100;
  let total = 0;
  g.m.parts.forEach(p => { total += mgMs(p, true) + (MG_HELD.test(p) ? 80 : 380); });
  g.el.classList.add('slow');
  g.row.style.setProperty('--ms', `${at + total}ms`);
  mgRun('🐢', 'crawl', at + total);
  g.m.parts.forEach((p, i) => {
    const held = MG_HELD.test(p);
    seq.push({ beat: () => mgBubble(i, 'wobble'), at }, Object.assign({}, Quiz.sayPart(p), held ? { slow: MG_SLOW } : {}), { pause: held ? 80 : 380 });
    at += mgMs(p, true) + (held ? 80 : 380);
  });
  seq.push({ beat: () => { mgBubble(-1); mgNext('fast'); }, at: at + 150 });
  mgPlay(seq);
}

// 🐇: close up, fast, the sounds one right after the other.
function mgFast() {
  const g = blendMagic;
  const seq = mgLine('magicFast');
  let at = seq.length ? 700 : 100;
  let total = 0;
  g.m.parts.forEach(p => { total += mgMs(p) + 40; });
  g.el.classList.add('fast');
  g.row.style.setProperty('--ms', '350ms');
  mgRun(isCaptain() ? '🚀' : '🐇', 'hop', at + total);
  g.m.parts.forEach((p, i) => {
    seq.push({ beat: () => mgBubble(i, 'bump'), at }, Quiz.sayPart(p), { pause: 40 });
    at += mgMs(p) + 40;
  });
  seq.push({ beat: () => { mgBubble(-1); mgNext('pop'); }, at: at + 250 });
  mgPlay(seq);
}

// ✨: the bubbles smash together, pop, and the picture comes out with its word.
function mgPop() {
  const g = blendMagic;
  g.el.classList.add('smash');
  g.runner.textContent = '';
  const burst = () => {
    g.el.classList.add('popped');
    Sound.tune('pop');
    mgSparkles();
  };
  const seq = [{ pause: 280 }, { beat: burst, at: 280 }].concat(mgLine('magicPop'), { pause: 120 }, Quiz.sayWord(g.m.w), { pause: MG_HOLD_MS });
  seq.push({ beat: mgFinish, at: 280 + 900 + MG_HOLD_MS });
  mgPlay(seq);
}

// Sparkles flying out of the pop.
function mgSparkles() {
  const box = blendMagic.pop;
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.className = 'mg-spark';
    const a = (i / 12) * Math.PI * 2;
    const d = 70 + (i % 3) * 22;
    s.style.setProperty('--dx', `${Math.round(Math.cos(a) * d)}px`);
    s.style.setProperty('--dy', `${Math.round(Math.sin(a) * d * 0.7)}px`);
    s.textContent = i % 3 ? '✦' : '✨';
    s.style.color = MG_COLORS[i % MG_COLORS.length];
    box.append(s);
    setTimeout(() => s.remove(), 1100);
  }
}

blendMagic.buttons.forEach(b => b.addEventListener('click', () => {
  if (state.paused || b.dataset.step !== blendMagic.step) return;
  Sound.tap();
  mgGo(b.dataset.step);
}));
// ✖: to the end, as if it had played.
blendMagic.close.addEventListener('click', () => {
  if (state.paused || !blendMagicShown()) return;
  Sound.tap();
  Sound.say([]);
  mgFinish();
});
