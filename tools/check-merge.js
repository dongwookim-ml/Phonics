// Unit checks of the save merge (js/progress.js), in Node, no browser:
// two devices on the new format, an older game version (no fmt) on either
// side, a guest's progress joining an account, editions, today's quests,
// unknown fields.
// Run: node tools/check-merge.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || detail === undefined ? '' : `: ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
}

// Progress as one device running one edition sees it.
function device(edition, id) {
  const store = { 'pixeltown-device': id };
  const ctx = {
    EDITION: edition, crypto: require('crypto').webcrypto, Quiz: { kinds: ['word', 'start', 'rhyme'] },
    localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
  };
  return vm.runInNewContext(`${fs.readFileSync(path.join(root, 'js/progress.js'), 'utf8')}\nProgress`, ctx);
}

// What save() in js/game.js writes after playing on top of a save `s`
// (its top level being the edition played): totals, counters, fmt.
function play(P, s, stars, coins, extra) {
  const st = { stars: (s.stars | 0) + stars, coins: (s.coins | 0) + coins, dust: s.dust | 0, tally: P.tally(s) };
  const c = P.count(st);
  return Object.assign({}, s, extra, { fmt: P.FMT, stars: st.stars, coins: st.coins, dust: st.dust, earned: c.earned, spent: c.spent });
}
// What an older version of the game writes after playing on top of a save:
// it rebuilds the save from the fields it knows, so the counters and fmt are
// gone and only the totals are left.
const OLD_FIELDS = ['outfit', 'looks', 'owned', 'stars', 'coins', 'dust', 'pictures', 'recent', 'history', 'books', 'player', 'edition', 'other', 'at'];
function playOld(s, stars, coins, extra) {
  const out = {};
  for (const k of OLD_FIELDS) if (s[k] !== undefined) out[k] = s[k];
  return Object.assign(out, extra, { stars: (s.stars | 0) + stars, coins: (s.coins | 0) + coins });
}
const answers = (tag, n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`word:${tag}${i}`, { kind: 'word', tries: 1, right: 1, wrong: 0, last: 1000 + i }]));

const A = device('princess', 'dA');
const B = device('princess', 'dB');
const C = device('captain', 'dC');

// ---- Two devices on the new format ----------------------------------------
{
  const start = { edition: 'princess', stars: 10, coins: 4, history: { 'word:cat': { kind: 'word', tries: 1, right: 1, wrong: 0, last: 5 } },
    owned: { head: ['none', 'tiara'] }, books: { b1: { read: 1, quizRight: 1, got: [0] } } };
  const a = play(A, start, 3, -2, { history: Object.assign({ 'word:dog': { kind: 'word', tries: 2, right: 0, wrong: 2, last: 9 } }, start.history),
    owned: { head: ['none', 'tiara', 'crown'] }, outfit: { head: 'crown' } });
  const b = play(B, start, 2, 5, { history: { 'word:cat': { kind: 'word', tries: 3, right: 1, wrong: 2, last: 7 } },
    owned: { head: ['none', 'tiara', 'bow'] }, books: { b1: { read: 2, quizRight: 2, got: [0, 1] } }, outfit: { head: 'bow' } });
  const m = A.merge(a, b, 'mine');
  check('two new devices: stars add up (10 + 3 + 2)', m.stars === 15, m.stars);
  check('two new devices: coins add up, spending counts (4 - 2 + 5)', m.coins === 7, m.coins);
  check('two new devices: the result is fmt 2', m.fmt === 2 && !!m.earned);
  check('two new devices: history takes the most of each field', m.history['word:cat'].tries === 3 && m.history['word:cat'].wrong === 2 && m.history['word:cat'].last === 7 && !!m.history['word:dog'], m.history);
  check('two new devices: presents joined per slot', m.owned.head.length === 4, m.owned);
  check('two new devices: books joined', m.books.b1.read === 2 && m.books.b1.got.length === 2 && m.books.b1.quizRight === 2, m.books);
  check('two new devices: the tablet with unsent progress keeps its outfit', m.outfit.head === 'crown' && A.merge(a, b, 'theirs').outfit.head === 'bow');
  check('two new devices: merging again, either way round, changes nothing', B.merge(b, m, 'mine').stars === 15 && A.same(A.merge(m, m, 'mine'), m) && A.same(A.merge(m, a, 'theirs'), A.merge(a, m, 'mine')));
  check('two new devices: the next star counts once', B.merge(m, play(A, m, 1, 0), 'mine').stars === 16);
}

// ---- The books she reads herself (js/library.js, `self:<id>` in books) ------------
{
  // Each tablet finished a different book (its star counted on that tablet);
  // both have read the first one, one of them twice.
  const start = { edition: 'princess', stars: 2, books: { 'self:cat-hat': { read: 1, last: 10 } } };
  const a = play(A, start, 1, 0, { books: { 'self:cat-hat': { read: 2, last: 30 }, 'self:i-can': { read: 1, last: 20 } } });
  const b = play(B, start, 1, 0, { books: { 'self:cat-hat': { read: 1, last: 10 }, 'self:big-pig': { read: 1, last: 25 }, b1: { read: 1, quizRight: 0, got: [] } } });
  const m = A.merge(a, b, 'mine');
  const done = Object.keys(m.books).filter(k => k.startsWith('self:') && m.books[k].read > 0).sort();
  check('own books: finished books from both tablets are all finished', done.join() === 'self:big-pig,self:cat-hat,self:i-can', m.books);
  check('own books: read counts and times take the larger', m.books['self:cat-hat'].read === 2 && m.books['self:cat-hat'].last === 30, m.books['self:cat-hat']);
  check('own books: each tablet\'s star counts once (2 + 1 + 1)', m.stars === 4, m.stars);
  check('own books: the stories\' log is kept beside them', m.books.b1.read === 1, m.books);
  check('own books: merging again changes nothing', A.same(A.merge(m, b, 'mine'), m) && A.same(B.merge(b, m, 'theirs'), m));
}

// ---- Old client → new: a save written by an older version ---------------------
{
  const old = { edition: 'princess', stars: 10, coins: 4 };
  const a = play(A, old, 3, 0);
  const b = play(B, old, 2, 0);
  check('old → new: an old save\'s totals count once, under "_"', A.merge(a, b, 'mine').stars === 15, A.merge(a, b, 'mine').stars);
  // An older version on another tablet loaded a new save (13) and played 2
  // more: it uploads plain totals (15), which already include A's 3.
  const n = play(A, old, 3, 0); // earned { _: 10, dA: 3 }
  const byOld = playOld(n, 2, 0);
  check('old → new: the older version keeps the totals readable and drops the counters', byOld.stars === 15 && !byOld.earned && !byOld.fmt);
  const later = play(A, n, 1, 0); // A played one more meanwhile: 14
  const m = A.merge(later, byOld, 'mine');
  check('old → new: its totals are a floor, never added on top (max 15, not 14 + 15)', m.stars === 15, m.stars);
  check('old → new: merging the same old copy again changes nothing', A.merge(m, byOld, 'mine').stars === 15);
  check('old → new: and from the old copy\'s side too', A.merge(byOld, later, 'theirs').stars === 15);
  const twoOld = A.merge(playOld(old, 1, 0), playOld(old, 4, 0), 'mine');
  check('old → new: two old copies: the larger of each total', twoOld.stars === 14, twoOld.stars);
}

// ---- New → old client: what an older version reads ---------------------------
{
  const s = play(A, { edition: 'princess', stars: 2, coins: 1 }, 5, 3, { other: { captain: play(C, { edition: 'captain' }, 4, 0) } });
  check('new → old: the totals an older version reads are right', s.stars === 7 && s.coins === 4 && s.other.captain.stars === 4, [s.stars, s.coins]);
  // The older version plays, uploads, and the new device merges: nothing lost,
  // and the captain edition it carried along untouched keeps its counters.
  const back = playOld(s, 1, 0);
  const m = A.merge(play(A, s, 0, 0), back, 'theirs');
  check('new → old → new: nothing lost, other edition untouched', m.stars === 8 && m.other.captain.stars === 4 && !!m.other.captain.earned, [m.stars, m.other.captain]);
}

// ---- Princess on one tablet, captain on the other -----------------------------
{
  const p = play(A, { edition: 'princess', earned: {}, spent: {} }, 4, 0, { outfit: { dress: 'pink' } });
  const c = Object.assign(play(C, { edition: 'captain', earned: {}, spent: {} }, 3, 1, { outfit: { dress: 'robot' } }), { other: { princess: { edition: 'princess', earned: {}, spent: {} } } });
  const m = C.merge(c, p, 'mine');
  check('editions: each keeps its own stars and outfit', m.edition === 'captain' && m.stars === 3 && m.other.princess.stars === 4 && m.other.princess.outfit.dress === 'pink' && m.outfit.dress === 'robot', m);
  check('editions: no nested other', !JSON.stringify(m).includes('"other":{"other"') && !m.other.captain);
  // The other edition's outfit: the copy written on the newer server version.
  const l = { edition: 'princess', other: { captain: { edition: 'captain', stars: 7, ver: 2000, at: 2000, outfit: { a: 'local' } } } };
  const s = { edition: 'captain', stars: 2, ver: 1000, at: 1000 + 3600e3, outfit: { a: 'server' } };
  check('editions: server versions decide, not the device clock', A.merge(l, s, 'mine').other.captain.outfit.a === 'local');
}

// ---- Guest → login ----------------------------------------------------------
{
  const guest = { edition: 'princess', stars: 42, coins: 17, history: answers('g', 60), player: { shown: '서연' } };
  const acct = play(B, { edition: 'princess', stars: 0, coins: 0 }, 3, 2, { history: answers('a', 3), player: { shown: '윤아' } });
  const m = A.merge(guest, acct, 'foreign');
  check('guest → login: a guest\'s progress counts on top (42 + 3)', m.stars === 45 && m.coins === 19 && Object.keys(m.history).length === 63, [m.stars, m.coins]);
  check('guest → login: the name comes from the copy with more stars', m.player.shown === '서연');
  check('guest → login: later merges keep it', A.merge(m, acct, 'mine').stars === 45 && A.merge(play(A, m, 1, 0), m, 'mine').stars === 46);
  const oldAcct = { edition: 'princess', stars: 10, coins: 1 };
  check('guest → login: into an account an older version saved, also in full', A.merge(guest, oldAcct, 'foreign').stars === 52);
  const newGuest = play(A, { edition: 'princess' }, 5, 0);
  check('guest → login: a guest on this device and this device\'s own count in the account add up', A.merge(newGuest, play(A, { edition: 'princess' }, 2, 0), 'foreign').stars === 7);
}

// ---- Today's quests (js/quest.js) ------------------------------------------------
{
  const day = (d, x) => Object.assign({ day: d, picks: ['stars', 'fish', 'house'], got: {}, chest: false }, x);
  const ed = quests => ({ edition: 'princess', quests });
  const m1 = A.merge(ed(day('2026-10-24', { chest: true, got: { dA: { stars: 5 } } })), ed(day('2026-10-25')), 'mine');
  check('quests: the later day wins whole (yesterday\'s chest and counts stay behind)', m1.quests.day === '2026-10-25' && m1.quests.chest === false && !m1.quests.got.dA, m1.quests);
  const a = day('2026-10-25', { got: { dA: { stars: 3, fish: 1 } } });
  const b = day('2026-10-25', { picks: ['gift', 'book', 'forest'], got: { dA: { stars: 2 }, dB: { stars: 2, fish: 2 } }, chest: true });
  const m2 = A.merge(ed(a), ed(b), 'mine');
  const g = m2.quests.got;
  check('quests: same day: each tablet\'s counts take the larger, kept apart so they add up', g.dA.stars === 3 && g.dA.fish === 1 && g.dB.stars === 2 && g.dB.fish === 2, g);
  check('quests: same day: the chest is open if it was opened on either', m2.quests.chest === true && A.merge(ed(b), ed(a), 'theirs').quests.chest === true);
  check('quests: same day: the picks come from the copy that is preferred', m2.quests.picks.join() === 'stars,fish,house' && A.merge(ed(a), ed(b), 'theirs').quests.picks.join() === 'gift,book,forest');
  check('quests: merging again, either way round, changes nothing', A.same(A.merge(m2, ed(b), 'mine'), m2) && A.same(A.merge(ed(b), m2, 'theirs'), m2));
  check('quests: a copy without them (an older version of the game) keeps them', A.merge(ed(a), { edition: 'princess', stars: 1 }, 'mine').quests.got.dA.stars === 3 && A.merge({ edition: 'princess' }, ed(b), 'mine').quests.chest === true);
  check('quests: no picks on one side: the other side\'s', A.merge(ed(day('2026-10-25', { picks: [] })), ed(b), 'mine').quests.picks.join() === 'gift,book,forest');
}

// ---- Her level and the parent's settings ---------------------------------------
const sk = (t, n, extra) => Object.assign({ t, best: t, w: [], n }, extra);
const kind = (e, k) => (e.skill || {})[k] || {};
{
  // The account has princess progress only: spelling at 4, family at 3, and
  // two-syllable spelling on. A guest played the captain game on another
  // tablet (save() wrote her level into its empty princess edition too).
  const acct = play(B, { edition: 'princess' }, 5, 0, { skill: { spell: sk(4, 60), family: sk(3, 80), start: sk(2, 1) }, settings: { twoSyllables: true } });
  const gs = { start: sk(1, 3), word: sk(1, 2) };
  const guest = play(C, { edition: 'captain', other: { princess: { edition: 'princess', skill: gs, settings: {} } } }, 1, 0, { skill: gs, settings: {} });
  const m = C.merge(guest, acct, 'foreign');
  const eds = [m, m.other.princess];
  check('guest in the other edition → login: her level is joined per kind, in every edition', eds.every(e => kind(e, 'spell').t === 4 && kind(e, 'family').t === 3 && kind(e, 'start').n === 3 && kind(e, 'word').n === 2), eds.map(e => e.skill));
  check('guest in the other edition → login: the account\'s settings, in every edition', eds.every(e => e.settings.twoSyllables === true), eds.map(e => e.settings));
  const g2 = Object.assign({}, guest, { settings: { twoSyllables: false, at: 2000 } });
  const a2 = Object.assign({}, acct, { settings: { twoSyllables: true, at: 1000 } });
  check('guest → login: the settings changed last win', C.merge(g2, a2, 'foreign').other.princess.settings.twoSyllables === false && C.merge(guest, a2, 'foreign').settings.twoSyllables === true);
}
{
  // Two tablets on one account, in step, two-syllable spelling on. The
  // parent turns it off on A (stamped, js/parent.js) and A sends it; B's
  // open tab then answers once, on its old copy.
  const base = play(A, { edition: 'princess' }, 2, 0, { settings: { twoSyllables: true, at: 1000 } });
  const phone = Object.assign({}, base, { settings: { twoSyllables: false, at: 2000 } });
  const tab = play(B, base, 1, 0);
  check('settings: the change wins when the other tablet merges as mine', B.merge(tab, phone, 'mine').settings.twoSyllables === false);
  check('settings: and when a stale copy is the server\'s', A.merge(phone, tab, 'theirs').settings.twoSyllables === false && A.merge(tab, phone, 'theirs').settings.twoSyllables === false);
  const onC = C.merge({ edition: 'captain', other: { princess: tab } }, phone, 'mine');
  check('settings: and in the other edition', [onC, onC.other.princess].every(e => (e.settings || {}).twoSyllables === false), onC.settings);
  // An older version keeps the settings it loaded, without a stamp.
  const old = Object.assign(playOld(base, 1, 0), { settings: { twoSyllables: true } });
  check('settings: a copy without a stamp never beats one with it', B.merge(old, phone, 'mine').settings.twoSyllables === false && A.merge(phone, old, 'theirs').settings.twoSyllables === false);
  check('settings: two copies without a stamp are joined as before', A.merge({ edition: 'princess', settings: {} }, { edition: 'princess', settings: { twoSyllables: true } }, 'mine').settings.twoSyllables === true);
}
{
  // Both tablets have spelling at 4. The parent lowers it to 2 on A
  // (Quiz.setTier stamps it, `set`) and A sends it; B's open tab then asks
  // one more spelling question (n 41) and a word question.
  const synced = play(A, { edition: 'princess' }, 1, 0, { skill: { spell: sk(4, 40), word: sk(2, 10) } });
  const phone = Object.assign({}, synced, { skill: { spell: sk(2, 40, { best: 4, set: 5000 }), word: sk(2, 10) } });
  const tab = Object.assign(play(B, synced, 1, 0), { skill: { spell: sk(5, 41), word: sk(2, 11) } });
  const m = B.merge(tab, phone, 'mine');
  check('tier set by the parent: kept when the other tablet merges as mine', kind(m, 'spell').t === 2 && kind(m, 'spell').set === 5000, m.skill.spell);
  check('tier set by the parent: answers and the best tier never go back', kind(m, 'spell').n === 41 && kind(m, 'spell').best === 5 && kind(m, 'word').n === 11, m.skill);
  check('tier set by the parent: from the parent\'s side too', kind(A.merge(phone, tab, 'mine'), 'spell').t === 2 && kind(A.merge(tab, phone, 'theirs'), 'spell').t === 2);
  // Once both copies have it, the entry with more answers wins again.
  const later = Object.assign({}, m, { skill: Object.assign({}, m.skill, { spell: Object.assign({}, m.skill.spell, { t: 3, n: 50 }) }) });
  check('tier set by the parent: after that, more answers win again', kind(A.merge(phone, later, 'theirs'), 'spell').t === 3 && kind(A.merge(phone, later, 'mine'), 'spell').t === 3);
  const again = Object.assign({}, phone, { skill: { spell: sk(1, 40, { best: 4, set: 6000 }) } });
  check('tier set by the parent: the newer change wins', kind(B.merge(later, again, 'mine'), 'spell').t === 1 && kind(B.merge(again, later, 'theirs'), 'spell').t === 1);
}

// ---- Fields this version doesn't know, and broken entries ---------------------------
{
  const mu = A.merge({ edition: 'princess', stickers: ['cat'], skill: { word: { t: 2, n: 10 }, rhyme: { t: 1, n: 2 } }, x: { a: 1 } },
    { edition: 'princess', stickers: ['dog'], skill: { word: { t: 3, n: 4 }, rhyme: { t: 2, n: 9 } }, y: 5 }, 'mine');
  check('unknown fields: kept and joined', mu.stickers.length === 2 && mu.x.a === 1 && mu.y === 5, mu);
  check('unknown fields: skill takes the entry with more answers', mu.skill.word.t === 2 && mu.skill.rhyme.t === 2, mu.skill);
  const h = A.history({ ok: { kind: 'word', tries: 1, right: 1, wrong: 0, last: 1 }, k: { kind: '<b>', tries: 1 }, t: { kind: 'word', tries: '<b>' }, x: null, f: { kind: 'word', tries: Infinity } });
  check('history: broken entries dropped', Object.keys(h).join() === 'ok', Object.keys(h));
  const bad = A.merge({ edition: 'princess', earned: { dA: { stars: 'x' } }, history: { a: 'nope', b: { kind: 'word', tries: -3 } } }, { edition: 'princess', stars: -5 }, 'mine');
  check('garbage numbers count as 0', bad.stars === 0 && bad.history.b.tries === 0 && !bad.history.a, bad);
}

console.log(failed ? `${failed} problem(s)` : 'merge OK');
process.exit(failed ? 1 : 0);
