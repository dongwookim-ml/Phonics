// Parent panel: the ⚙️ button at the top right asks for the parent password
// (the account's login password, or 0000 without an account) and then shows
// how she is doing in each kind of question, from state.history.

// Where the long vowels are asked: the Monster Village (PLACES.monster).
const parentMonster = PLACES.monster ? placeName('monster') : I18n.t('parent.monsterVillage');
const PARENT_KINDS = [
  ['word', I18n.t('parent.listenToWords'), I18n.t('parent.town')],
  ['start', I18n.t('parent.firstSound'), I18n.t('parent.town')],
  ['findStart', I18n.t('parent.findTheFirstSoundPicture'), I18n.t('parent.letterHouses')],
  ['rhyme', I18n.t('parent.rhymes'), I18n.t('parent.town2', placeName('forest'))],
  ['family', I18n.t('parent.wordFamilies'), placeName('forest')],
  ['vowel', I18n.t('parent.middleSound'), placeName('forest')],
  ['ending', I18n.t('parent.lastSound'), placeName('forest')],
  ['read', I18n.t('parent.reading'), `${placeName('forest')} · ${placeName('fairy')}`],
  ['blend', I18n.t('parent.soundBlending'), I18n.t('parent.games', placeName('forest'), placeName('fairy'), placeName('unicorn'))],
  // Its first steps (1단계 and 2단계 of 소리 합치기), counted on their own.
  ['oneSound', I18n.t('parent.blendingStep1OneSound'), I18n.t('parent.24Letters')],
  ['twoSounds', I18n.t('parent.blendingStep2TwoSounds'), ''],
  ['sentence', I18n.t('parent.listenToSentences'), `${placeName('unicorn')} · ${placeName('dungeon')}`],
  ['meaning', I18n.t('parent.matchTheMeaning'), `${placeName('unicorn')} · ${placeName('dungeon')}`],
  ['spell', I18n.t('parent.spelling'), placeName('fairy')],
  ['longBlend', I18n.t('parent.blendLongVowels'), parentMonster],
  ['longRead', I18n.t('parent.readLongVowels'), parentMonster],
  ['longWord', I18n.t('parent.hearLongVowelsMagicE'), parentMonster],
  ['longRhyme', I18n.t('parent.longVowelRhymes'), parentMonster],
];
const PARENT_PASSWORD = '0000'; // only when js/account.js is missing

const PARENT_ERRORS = {
  wrong: I18n.t('guide.incorrectPassword'),
  offline: I18n.t('parent.noInternetConnection'),
  busy: I18n.t('parent.pleaseTryAgainShortly'),
};

const parentUi = {
  gear: document.getElementById('parent'),
  panel: null,
  paint: null, // marks the settings shown, while they are
};

function parentHasAccount() {
  return typeof Account !== 'undefined' && !!Account.user;
}

// The game stands still underneath: she stops after the step she is on
// (and doesn't arrive anywhere), nobody talks, and game timers wait.
function parentOpen() {
  if (parentUi.panel) return;
  Sound.tap();
  setPaused(true);
  state.busy = true;
  state.hero.path = state.hero.path.slice(0, 1);
  state.hero.onArrive = null;
  // A book being read aloud stops as with its ⏸ button.
  if (typeof library !== 'undefined' && library.playing && library.mode === 'read') {
    library.playing = false;
    bookHush();
    renderBookHighlight();
  }
  Sound.say([]);
  const el = document.createElement('section');
  el.className = 'parent-panel';
  el.innerHTML = I18n.t('parent.parentPanelClose');
  el.querySelector('.parent-close').addEventListener('click', parentClose);
  el.addEventListener('click', parentClick);
  // Keys typed here never reach the game (1–4 would answer a question).
  el.addEventListener('keydown', e => { if (e.key === 'Escape') parentClose(); e.stopPropagation(); });
  document.body.append(el);
  parentUi.panel = el;
  parentLock();
}

function parentClose() {
  if (!parentUi.panel) return;
  parentUi.panel.remove();
  parentUi.panel = null;
  parentUi.paint = null;
  setPaused(false);
  libraryRefresh(); // a book a new 읽기 tier opened shows open (js/library.js)
  // Busy again only if something is still showing (a question, a present,
  // a card, the sleeping town or a scene change: busyNow in js/game.js).
  state.busy = busyNow();
}

function parentLock() {
  const body = parentUi.panel.querySelector('.parent-body');
  const hint = parentHasAccount()
    ? I18n.t('parent.enterThePasswordYouUseTo', parentEsc(Account.user))
    : I18n.t('parent.youArePlayingAsAGuest');
  body.innerHTML = I18n.t('parent.enterYourPasswordToViewYour', hint);
  const form = body.querySelector('form');
  const input = body.querySelector('.parent-pw');
  const err = body.querySelector('.parent-err');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    err.textContent = I18n.t('guide.checking');
    // { ok, reason }: a wrong password, no connection, or the server busy.
    let r = { ok: false, reason: 'busy' };
    try {
      r = typeof Account !== 'undefined' ? await Account.verify(input.value) : { ok: input.value === PARENT_PASSWORD, reason: 'wrong' };
    } catch (x) { /* r stays 'busy' */ }
    if (!parentUi.panel) return;
    if (!r.ok) { err.textContent = PARENT_ERRORS[r.reason] || PARENT_ERRORS.wrong; input.select(); return; }
    await parentCatchUp();
    if (parentUi.panel) parentStats();
  });
  setTimeout(() => input.focus(), 50);
}

// A tab open a while only has its own old copy (the account's comes in at
// boot and when a save of this tab is refused): the panel shows, and its
// changes start from, the account's newest, when the server can be reached.
async function parentCatchUp() {
  if (!parentHasAccount()) return;
  const s = await Account.pull();
  if (s && s.updated > Account.base) Account._merge(s, Account._dirty ? 'mine' : 'theirs');
}

// Per kind: questions got right, missed (and not yet put right) and not
// yet tried, out of everything that kind can ask.
function parentKindStats(kind) {
  const hist = state.history || {};
  const pool = reviewPool(kind);
  let right = 0, wrong = 0, tries = 0, firstRight = 0;
  for (const id of pool) {
    const h = hist[id];
    if (!h) continue;
    tries += h.tries | 0;
    firstRight += h.right | 0;
    if (h.right > 0) right++;
    else wrong++;
  }
  return { pool: pool.length, right, wrong, untried: pool.length - right - wrong, tries, firstRight };
}

// "rhyme:cat" → "🐱 cat", "sentence:The {} says moo." → "The ___ says moo. (cow)".
function parentLabel(id) {
  const kind = id.slice(0, id.indexOf(':'));
  const key = id.slice(kind.length + 1);
  if (kind === 'sentence' || kind === 'meaning') {
    const x = SENTENCES.concat(SENTENCES_L1, SENTENCES_L2).find(s => s.s === key);
    return `${key.replace('{}', '___')}${x ? ` (${x.w[0]})` : ''}`;
  }
  // A letter of blending's one-sound step: its sound.
  if (kind === 'oneSound') return `/${key}/`;
  // A written-only word (longWord: hope) has no picture.
  const hit = Quiz.words()[key];
  return hit && hit.e ? `${hit.e} ${key}` : key;
}

// Her tier in a kind (js/quiz.js): "단계 2 / 4" with − and + to set it, the
// best she has reached, and how many of her last first tries were right.
// Blending's first steps are tiers of 소리 합치기, set there: the one-sound
// step shows the letters she knows (lit) instead, the two-sound step nothing.
function parentTier(kind) {
  if (kind === 'oneSound') {
    const letters = Quiz.letters();
    const chips = letters.map(x => `<span class="l-chip${x.known ? ' good' : ''}">${x.l}</span>`).join('');
    return I18n.t('parent.lettersKnownKnownAfterTwoFirst', letters.filter(x => x.known).length, letters.length, chips);
  }
  if (!Quiz.tierMax(kind)) return '';
  const k = Quiz.skill(kind);
  const max = Quiz.tierMax(kind);
  const t = Math.min(k.t, max);
  const last = k.last || [];
  const recent = last.length ? I18n.t('parent.recent', last.filter(Boolean).length, last.length) : '';
  return I18n.t('parent.levelBest', kind, t <= 1 ? 'disabled' : '', t, max, kind, t >= max ? 'disabled' : '', Math.min(k.best || 1, max), recent);
}

// First-try accuracy per first letter, from the letter questions (word,
// start, findStart), as small chips: "C 4/5".
function parentLetters() {
  const per = {};
  for (const [id, h] of Object.entries(state.history || {})) {
    if (!['word', 'start', 'findStart'].includes(h.kind)) continue;
    const L = id.slice(id.indexOf(':') + 1)[0].toUpperCase();
    const p = per[L] || (per[L] = { tries: 0, right: 0 });
    p.tries += h.tries;
    p.right += h.right;
  }
  const chips = Object.keys(per).sort().map(L => {
    const p = per[L];
    const r = p.right / p.tries;
    return `<span class="l-chip ${r >= 0.8 ? 'good' : r >= 0.5 ? 'mid' : 'low'}" title="${p.right}/${p.tries}">${L} <b>${Math.round(100 * r)}%</b></span>`;
  }).join('');
  return chips || I18n.t('parent.noLetterQuestionsTriedYet');
}

// Everything the panel puts in as HTML is a number or goes through parentEsc.
const parentEsc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function parentBar(s) {
  const seg = (n, cls, label) => (n ? `<span class="seg ${cls}" style="flex:${n}" title="${label} ${n}"></span>` : '');
  return I18n.t('parent.label', s.right, s.wrong, s.untried, seg(s.right, 'right', I18n.t('parent.correct')), seg(s.wrong, 'wrong', I18n.t('parent.incorrect')), seg(s.untried, 'untried', I18n.t('parent.notTried')));
}

// Questions last answered on each of the past 7 days, as a sparkline.
function parentSpark() {
  const day = 864e5;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime() - 6 * day;
  const counts = new Array(7).fill(0);
  for (const h of Object.values(state.history || {})) {
    const i = Math.floor((h.last - start) / day);
    if (i >= 0 && i < 7) counts[i]++;
  }
  const names = [I18n.t('parent.sun'), I18n.t('parent.mon'), I18n.t('parent.tue'), I18n.t('parent.wed'), I18n.t('parent.thu'), I18n.t('parent.fri'), I18n.t('parent.sat')];
  const W = 300, H = 90, top = 18, base = 66;
  const max = Math.max(1, ...counts);
  const x = i => 16 + i * ((W - 32) / 6);
  const y = n => base - (n / max) * (base - top);
  const pts = counts.map((n, i) => `${x(i)},${y(n)}`).join(' ');
  const peak = counts.indexOf(Math.max(...counts));
  const dots = counts.map((n, i) => {
    const d = new Date(start + i * day);
    const label = i === 6 || (i === peak && n) ? `<text x="${x(i)}" y="${y(n) - 8}" class="v">${n}</text>` : '';
    return I18n.t('parent.questions', d.getMonth() + 1, d.getDate(), n, x(i), y(n), x(i), y(n), label, x(i), H - 6, i === 6 ? I18n.t('parent.today') : names[d.getDay()]);
  }).join('');
  return I18n.t('parent.label2', W, H, counts.join(', '), W - 8, base, base, pts, dots);
}

function parentStats() {
  const hist = state.history || {};
  const entries = Object.entries(hist);
  const answers = entries.reduce((a, [, h]) => a + (h.tries | 0), 0);
  const solvedCount = entries.filter(([, h]) => h.right > 0).length;
  const tile = (icon, label, n) => `<div class="parent-tile"><span class="ic">${icon}</span><b>${n | 0}</b><span>${parentEsc(label)}</span></div>`;
  const rows = PARENT_KINDS.map(([kind, ko, where]) => {
    const s = parentKindStats(kind);
    const acc = s.tries ? `${Math.round((100 * s.firstRight) / s.tries)}%` : '—';
    const review = s.pool && !s.untried && !s.wrong ? I18n.t('parent.reviewing') : '';
    return I18n.t('parent.correctIncorrectNotTriedTotal', ko, review, where, acc, parentTier(kind), parentBar(s), s.right, s.wrong, s.untried, s.pool);
  }).join('');
  const kindName = k => (PARENT_KINDS.find(x => x[0] === k) || [k, k])[1];
  const missed = entries.filter(([, h]) => h.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong || b[1].last - a[1].last).slice(0, 6)
    .map(([id, h]) => I18n.t('parent.misses', parentEsc(kindName(h.kind)), parentEsc(parentLabel(id)), h.wrong | 0, h.right ? I18n.t('parent.nowCorrect') : ''))
    .join('');
  parentUi.panel.querySelector('.parent-body').innerHTML = I18n.t('parent.progressByQuestionTypeLevelsStart', tile('⭐', starsEarned() > state.stars ? I18n.t('parent.starsEarned', starsEarned()) : I18n.t('parent.stars'), state.stars), tile('🪙', I18n.t('parent.coins'), state.coins | 0), isCaptain() ? tile('⚡', I18n.t('captain-drone.battery'), state.dust | 0) : tile('✨', I18n.t('parent.fairyDust'), state.dust | 0), tile('📝', I18n.t('parent.answersGiven'), answers), tile('✅', I18n.t('parent.questionsSolved'), solvedCount), parentEsc(questParentLine()), rows, missed ? `<ol class="parent-missed">${missed}</ol>` : I18n.t('parent.noIncorrectAnswersYet'), parentSpark(), parentLetters());
  parentSelfBooks(parentUi.panel.querySelector('.parent-body'));
  parentSettings(parentUi.panel.querySelector('.parent-body'));
}

// The books she reads herself (js/library.js): read to the end (✓ and how
// often), open, or waiting for her reading tier (🔒 읽기 3단계).
function parentSelfBooks(body) {
  const box = document.createElement('section');
  const chips = DECODABLE_BOOKS.map(b => {
    const n = ((state.books || {})[selfKey(b)] || {}).read | 0;
    const what = n ? I18n.t('parent.times', n) : selfOpen(b) ? I18n.t('parent.open') : I18n.t('parent.readingLevel', b.level);
    return `<span class="l-chip${n ? ' good' : ''}">${b.cover} ${parentEsc(b.title)} <b>${what}</b></span>`;
  }).join('');
  box.innerHTML = I18n.t('parent.independentReadingLibraryShortBooksUsing', chips);
  body.append(box);
}

// − / + on a tier.
function parentClick(e) {
  const b = e.target.closest('.tier-btn');
  if (b) {
    Quiz.setTier(b.dataset.kind, Quiz.skill(b.dataset.kind).t + Number(b.dataset.step));
    save();
    parentStats();
  }
}

// ---- Settings: play time, picture hints, the 🔊 button, music --------------
// Saved with the game (state.settings, state.pictures), each change stamped
// on its own (Progress.stamp in js/progress.js). The play-time limit
// and the hidden 🔊 button are handled in js/guide.js, the background music
// (settings.music, missing means on) in js/music.js.

function parentSettings(body) {
  const box = document.createElement('section');
  box.className = 'parent-settings';
  body.append(box);
  const chips = (name, options) => options.map(([v, label]) =>
    `<button type="button" class="chip" data-set="${name}" data-v="${v}">${label}</button>`).join('');
  box.innerHTML = I18n.t('parent.settingsPlayTimeWhenTimeIs', chips('limit', [[0, I18n.t('parent.off')], [15, I18n.t('parent.15Min')], [20, I18n.t('parent.20Min')], [30, I18n.t('parent.30Min')]]), chips('pictures', [[1, I18n.t('parent.on')], [0, I18n.t('parent.off')]]), chips('mute', [[0, I18n.t('parent.show')], [1, I18n.t('parent.hide')]]), chips('music', [[1, I18n.t('parent.on')], [0, I18n.t('parent.off')]]), chips('two', [[0, I18n.t('parent.off')], [1, I18n.t('parent.on')]]));
  // The chip that is on, from the live settings: after a tap, and after a
  // sync put the other tablet's in (parentRefresh). The chips stay in place,
  // so a tap already under way still lands.
  const paint = () => {
    const s = state.settings;
    const on = { limit: s.playLimit | 0, pictures: state.pictures ? 1 : 0, mute: s.hideMute ? 1 : 0, music: s.music === false ? 0 : 1, two: s.twoSyllables ? 1 : 0 };
    box.querySelectorAll('[data-set]').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === on[b.dataset.set]));
    box.querySelector('.ps-played').textContent = Math.floor(guidePlayedMs() / 60000);
  };
  const keys = { limit: 'playLimit', mute: 'hideMute', music: 'music', two: 'twoSyllables' };
  box.querySelectorAll('[data-set]').forEach(b => b.addEventListener('click', () => {
    const v = Number(b.dataset.v);
    const k = keys[b.dataset.set];
    // Each setting is stamped on its own, so the newest change to it wins
    // on the other tablet and a change to another one there stays
    // (js/progress.js). The live settings: a sync may have replaced them.
    if (k) state.settings.at = Progress.stamp(state.settings, k, k === 'playLimit' ? v : !!v);
    if (b.dataset.set === 'two') Quiz.setTier('spell', Quiz.skill('spell').t);
    if (b.dataset.set === 'pictures') { Progress.stamp(state, 'pictures', !!v); setPictures(state.pictures); } // saves
    else save();
    guideApplySettings();
    musicUpdate(); // heard once the panel closes
    paint();
  }));
  parentUi.paint = paint;
  paint();
}

// Called by applyProgress (js/game.js) when a sync changed the game.
function parentRefresh() {
  if (parentUi.paint) parentUi.paint();
}

parentUi.gear.addEventListener('click', parentOpen);
// While the panel is open, game keys (1–4, spelling letters) do nothing.
addEventListener('keydown', e => {
  if (!parentUi.panel || parentUi.panel.contains(e.target)) return;
  e.stopImmediatePropagation();
  if (e.key === 'Escape') parentClose();
}, true);
