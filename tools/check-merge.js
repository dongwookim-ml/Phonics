// Unit checks of the save merge (js/progress.js), in Node, no browser:
// two devices on the new format, an older game version (no fmt) on either
// side, a guest's progress joining an account, editions, today's quests
// and the day's chest, play time and a parent's wake, stickers, dust fed to
// a friend, unknown fields, the parent's settings, tiers and picture hints,
// and the kinds of question this version adds (the long vowels), also next
// to tabs still on the two older releases (their own merge code, from git).
// Run: node tools/check-merge.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || detail === undefined ? '' : `: ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
}

// Progress as one device running one edition sees it; with `rev`, as a tab
// still on that older release does (its js/progress.js from git; null when
// git doesn't have it).
function device(edition, id, rev) {
  let src = fs.readFileSync(path.join(root, 'js/progress.js'), 'utf8');
  if (rev) {
    const r = spawnSync('git', ['-C', root, 'show', `${rev}:js/progress.js`], { maxBuffer: 1 << 26 });
    if (r.status !== 0) return null;
    src = r.stdout.toString();
  }
  const store = { 'pixeltown-device': id };
  const ctx = {
    EDITION: edition, crypto: require('crypto').webcrypto, Quiz: { kinds: ['word', 'start', 'rhyme'] },
    localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
  };
  return vm.runInNewContext(`${src}\nProgress`, ctx);
}
// The same on a version of the game in git (`ref`), or null when git doesn't have it here.
function deviceAt(ref, edition, id) {
  return device(edition, id, ref);
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

// ---- The treasure shelf and new clothes ------------------------------------------
{
  // This version keeps treasures in a slot older versions don't know; an
  // older tablet saves only the slots it knows (and keeps unknown values in
  // them). Joined, nothing is lost; two tablets' treasures add up.
  const start = { edition: 'princess', stars: 5, owned: { shape: ['ballgown'], head: ['none', 'tiara'] } };
  const a = play(A, start, 2, 0, { owned: { shape: ['ballgown', 'mermaid'], head: ['none', 'tiara', 'bunny'], treasure: ['shell', 'kite'] } });
  const known = Object.assign({}, a.owned, { head: a.owned.head.concat('crown') });
  delete known.treasure;
  const old = playOld(a, 1, 0, { owned: known });
  const m = A.merge(a, old, 'theirs');
  check('treasures: a slot an older tablet drops is kept from the other copy', m.owned.treasure.join() === 'shell,kite' && m.owned.head.includes('bunny') && m.owned.head.includes('crown') && m.owned.shape.includes('mermaid'), m.owned);
  const b = play(B, m, 1, 0, { owned: Object.assign({}, m.owned, { treasure: ['gem'] }) });
  check('treasures: two tablets\' treasures are joined', A.merge(m, b, 'mine').owned.treasure.sort().join() === 'gem,kite,shell', A.merge(m, b, 'mine').owned);
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

// ---- The day's chest (js/quest.js) --------------------------------------------------
{
  // What questOpenChest does to a save: the coins under the day's own entry,
  // the same on every tablet, and the chest open.
  const open = (P, s, day) => play(P, Object.assign({}, s, { coins: (s.coins | 0) + 5, earned: Object.assign({}, s.earned, { [`chest:${day}`]: { coins: 5 } }),
    quests: { day, picks: ['stars', 'fish', 'house'], got: {}, chest: true } }), 0, 0);
  const start = play(A, { edition: 'princess' }, 10, 2);
  // Both tablets showed it ready, and it was opened on each before they synced.
  const a = open(A, play(A, start, 1, 0), '2026-10-25');
  const b = open(B, play(B, start, 2, 0), '2026-10-25');
  check('chest: each tablet\'s own opening pays its 5 coins', a.coins === 7 && b.coins === 7, [a.coins, b.coins]);
  const m = A.merge(a, b, 'mine');
  check('chest: opened on two tablets before they synced, it pays once (2 + 5)', m.coins === 7 && B.merge(b, a, 'theirs').coins === 7 && m.stars === 13, [m.coins, m.stars]);
  check('chest: the next day\'s pays again', A.merge(open(A, m, '2026-10-26'), b, 'mine').coins === 12);
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
  // Per kind: spelling lowered on A, family raised in B's panel (open since before).
  const b = Object.assign({}, tab, { skill: { spell: sk(5, 41), word: sk(3, 11, { set: 7000 }) } });
  check('tiers set on two tablets: each kind keeps its own', ['mine', 'theirs'].every(how => {
    const x = B.merge(b, phone, how);
    return kind(x, 'spell').t === 2 && kind(x, 'word').t === 3;
  }), B.merge(b, phone, 'mine').skill);
}

// ---- The parent's settings, one by one (js/parent.js) ------------------------------
// A change stamps that setting alone (Progress.stamp), so a change on one
// tablet never reverts another setting changed on the other.
const settingsOf = s => ({ limit: s.playLimit | 0, mute: !!s.hideMute, two: !!s.twoSyllables, music: s.music !== false });
const changed = (P, s, k, v) => { const x = JSON.parse(JSON.stringify(s)); x.at = P.stamp(x, k, v); return x; };
const withSettings = (save, settings) => Object.assign({}, save, { settings });
{
  // In step, nothing set. The parent sets 15 minutes on A; later, in B's
  // panel, open since before (still showing 끄기), she hides the 🔊 button.
  const base = play(A, { edition: 'princess' }, 1, 0, { settings: { playLimit: 0, hideMute: false } });
  const a = withSettings(base, changed(A, base.settings, 'playLimit', 15));
  const b = withSettings(play(B, base, 1, 0), changed(B, base.settings, 'hideMute', true));
  const all = [B.merge(b, a, 'mine'), B.merge(b, a, 'theirs'), A.merge(a, b, 'mine'), A.merge(a, b, 'theirs')];
  check('settings one by one: a change on each tablet, both stay (mine and theirs, both ways)', all.every(m => m.settings.playLimit === 15 && m.settings.hideMute === true), all.map(m => m.settings));
  check('settings one by one: merging again, either way round, changes nothing', all.every(m => A.same(A.merge(m, a, 'mine'), m) && A.same(B.merge(b, m, 'theirs'), m)));
  const guest = withSettings({ edition: 'princess', stars: 3 }, changed(C, { playLimit: 0 }, 'music', false));
  const g = A.merge(guest, a, 'foreign');
  check('settings one by one: a guest\'s change joins the account\'s, and its unchanged ones don\'t count', g.settings.music === false && g.settings.playLimit === 15, g.settings);
  // The same one on both: the newer change, whichever copy is preferred.
  const at = (v, t) => withSettings(base, { playLimit: v, hideMute: false, at: t, stamps: { playLimit: { v, at: t } } });
  check('settings one by one: the same one changed on both: the newer wins', ['mine', 'theirs'].every(how => A.merge(at(20, 3000), at(30, 4000), how).settings.playLimit === 30 && A.merge(at(30, 4000), at(20, 3000), how).settings.playLimit === 30));
  const ahead = { playLimit: 30, at: 9e15, stamps: { playLimit: { v: 30, at: 9e15 } } };
  check('settings one by one: a change beats the one it replaces, whatever this clock says', changed(A, ahead, 'playLimit', 15).stamps.playLimit.at === 9e15 + 1);
  check('settings one by one: what the game reads is plain values', settingsOf(all[0].settings).limit === 15 && all[0].settings.at === Math.max(...Object.values(all[0].settings.stamps).map(r => r.at)));
}

// ---- Tabs still on an older release -----------------------------------------------
// The first release (M1, eee606ec) knows no settings or tiers: its game
// keeps them as it loaded them, and its merge joins the settings key by key
// (its own value first) and keeps a tier entry with more answers. The
// previous one (M2+M3, 144e11e1) stamps the settings whole (`at`), and
// leaves the picture hints unstamped. Both read the plain values.
const M1 = device('princess', 'dO', 'eee606ec');
const M23 = device('princess', 'dM', '144e11e1');
if (!M1 || !M23) check('the older releases are in git (eee606ec, 144e11e1)', !process.env.CI, 'fetch them (CI checks out with fetch-depth 0)');
if (M1 && M23) {
  // A tab on the first release loaded the save while nothing was set. The
  // parent sets 15 minutes and hides the 🔊 button on this version's tablet
  // N; then the child answers once on the old tab, which joins the server's
  // copy into its own: its old values, beside the server's stamps.
  const base = play(A, { edition: 'princess' }, 2, 0, { settings: { playLimit: 0, hideMute: false } });
  const n = withSettings(base, changed(A, changed(A, base.settings, 'playLimit', 15), 'hideMute', true));
  const o = M1.merge(play(M1, base, 1, 0), n, 'mine');
  check('first release: its copy has its own old values beside the newest stamp', o.settings.playLimit === 0 && o.settings.at === n.settings.at, o.settings);
  const want = v => v.limit === 15 && v.mute === true;
  const back = [A.merge(n, o, 'theirs'), A.merge(n, o, 'mine')];
  check('first release: its old values don\'t win with the stamp (this version, theirs and mine)', back.every(m => want(settingsOf(m.settings))), back.map(m => m.settings));
  // The same with the old tab in the robot game: the princess edition it
  // carries along is joined the same way.
  const oc = device('captain', 'dO', 'eee606ec').merge(Object.assign(play(M1, { edition: 'captain' }, 1, 0), { other: { princess: Object.assign({}, base, { ver: 9 }) } }), n, 'mine');
  check('first release, robot game: its old values don\'t win either', [A.merge(n, oc, 'theirs'), A.merge(oc, n, 'mine')].every(m => want(settingsOf(m.settings)) && want(settingsOf(m.other.captain.settings))), oc.other.princess.settings);
  check('first release: a tablet that only has its copy reads the parent\'s settings', want(settingsOf(A.settings(o.settings))), A.settings(o.settings));
  check('first release: what this version sends back has them plain, for both older releases', want(settingsOf(M23.merge(o, back[0], 'theirs').settings)) && want(settingsOf(M1.merge(o, back[0], 'theirs').settings)) && want(settingsOf(back[0].settings)));
  // The old tab loaded this version's stamped copy: its stamps go with its
  // values, and the newer change wins.
  const n2 = withSettings(n, changed(A, n.settings, 'playLimit', 20));
  const o2 = M1.merge(play(M1, n, 1, 0), n2, 'mine');
  check('first release: a copy with its own older stamps loses to the newer change', A.merge(n2, o2, 'theirs').settings.playLimit === 20 && A.settings(o2.settings).playLimit === 15 && A.merge(o2, n2, 'mine').settings.playLimit === 20);
  // A tab on the previous release reads this version's copy, and changes
  // one in its own panel: it stamps `at` and keeps the stamps it loaded.
  const p = M23.merge(play(M23, base, 1, 0), n, 'mine');
  check('previous release: it reads this version\'s settings', want(settingsOf(p.settings)) && want(settingsOf(M23.merge(n, play(M23, base, 1, 0), 'theirs').settings)), p.settings);
  const oldPanel = (s, k, v) => Object.assign({}, s, { [k]: v, at: Math.max(Date.now(), (Number(s.at) || 0) + 1) });
  const p2 = withSettings(p, oldPanel(p.settings, 'twoSyllables', true));
  const n3 = withSettings(n, changed(A, n.settings, 'music', false));
  const both = [A.merge(n3, p2, 'mine'), A.merge(n3, p2, 'theirs'), A.merge(p2, n3, 'theirs')];
  check('previous release: a change in its panel counts, and this version\'s other change stays', both.every(m => { const v = settingsOf(m.settings); return want(v) && v.two && !v.music; }), both.map(m => m.settings));
  const p3 = withSettings(p, oldPanel(p.settings, 'playLimit', 30));
  check('previous release: changing one that has a stamp counts too', A.merge(n, p3, 'mine').settings.playLimit === 30 && A.settings(p3.settings).playLimit === 30);
  // Saves from before any stamp: the previous release's `at` counts for
  // every setting in its copy; without it, they are joined as before.
  const whole = { playLimit: 20, hideMute: true, at: 500 };
  check('unstamped: the previous release\'s whole stamp counts for each setting', A.merge(withSettings(base, whole), n, 'mine').settings.playLimit === 15 && A.merge(n, withSettings(base, { playLimit: 30, at: 9e15 }), 'mine').settings.playLimit === 30 && ((A.settings(whole).stamps || {}).hideMute || {}).at === 500);
  // Tiers: a tier the parent sets counts as one more answer (Quiz.setTier),
  // so the first release, which keeps the entry with more answers, keeps it.
  const synced = play(A, { edition: 'princess' }, 1, 0, { skill: { spell: sk(4, 40) } });
  const lowered = Object.assign({}, synced, { skill: { spell: sk(2, 41, { best: 4, set: 5000 }) } });
  const t = M1.merge(play(M1, synced, 1, 0), lowered, 'mine');
  check('first release next to a tier the parent set: it keeps it', kind(t, 'spell').t === 2 && kind(A.merge(lowered, t, 'theirs'), 'spell').t === 2, t.skill);
}

// ---- The picture hints (그림 힌트), per edition -----------------------------------
{
  // In step, hints on in both games. The parent turns them off on A in the
  // princess game (and sets 20 minutes); B's open tab then saves once, and
  // so do tabs on the older releases, each with its own copy first.
  const base = play(A, { edition: 'princess', pictures: true, other: { captain: { edition: 'captain', pictures: true } } }, 1, 0);
  const a = withSettings(JSON.parse(JSON.stringify(base)), changed(A, {}, 'playLimit', 20));
  A.stamp(a, 'pictures', false);
  const stale = play(B, base, 1, 0);
  const off = m => m.pictures === false && m.settings.playLimit === 20 && m.other.captain.pictures === true;
  check('picture hints: turned off on one tablet, the other tablet\'s next save keeps them off', off(B.merge(stale, a, 'mine')) && off(A.merge(a, stale, 'theirs')) && off(B.merge(stale, a, 'theirs')), B.merge(stale, a, 'mine'));
  for (const [name, P] of [['first release', M1], ['previous release', M23]]) {
    if (!P) continue;
    const o = P.merge(play(P, base, 1, 0), a, 'mine');
    check(`picture hints: a tab on the ${name} keeps its own beside the stamp, and this version puts it right`, o.pictures === true && A.setting(o, 'pictures') === false && off(A.merge(a, o, 'theirs')) && off(A.merge(o, a, 'mine')), o);
  }
  // The robot game's hints are its own.
  const c = C.merge(base, base, 'theirs');
  C.stamp(c, 'pictures', false);
  const m = A.merge(stale, c, 'mine');
  check('picture hints: each edition has its own', m.pictures === true && m.other.captain.pictures === false && A.merge(a, c, 'mine').pictures === false, [m.pictures, m.other.captain.pictures]);
  check('picture hints: merging again changes nothing', A.same(A.merge(m, c, 'mine'), m) && A.same(B.merge(B.merge(stale, a, 'mine'), a, 'theirs'), B.merge(stale, a, 'mine')));
  check('picture hints: a save without a stamp, as before (the copy preferred)', A.merge(Object.assign({}, base, { pictures: false }), base, 'mine').pictures === false && A.merge(base, Object.assign({}, base, { pictures: false }), 'mine').pictures === true);
}

// ---- Play time today (js/guide.js) -----------------------------------------------
{
  const ed = playtime => ({ edition: 'princess', playtime });
  const pt = (day, ms, wakes) => ({ day, ms, wakes });
  const m1 = A.merge(ed(pt('2026-9-30', 800000, 2)), ed(pt('2026-10-1', 5000, 0)), 'mine');
  check('playtime: the later day wins whole, as numbers (10-1 after 9-30)', m1.playtime.day === '2026-10-1' && m1.playtime.ms === 5000 && m1.playtime.wakes === 0, m1.playtime);
  const m2 = A.merge(ed(pt('2026-10-25', 180000, 0)), ed(pt('2026-10-25', 900000, 1)), 'mine');
  check('playtime: same day: the most played and the most wakes, whichever is preferred', m2.playtime.ms === 900000 && m2.playtime.wakes === 1 &&
    A.same(A.merge(ed(pt('2026-10-25', 900000, 1)), ed(pt('2026-10-25', 180000, 0)), 'theirs'), m2), m2.playtime);
  check('playtime: a copy without it (an older version of the game) keeps it', A.merge({ edition: 'princess', stars: 1 }, ed(pt('2026-10-25', 5, 0)), 'mine').playtime.ms === 5);
  // A wake notes the minutes played when it came (woke): the town sleeps a
  // whole limit after it. Neither copy can take it back.
  const woke = (p, ms, day = p.day) => Object.assign({}, p, { woke: { day, ms } });
  const awake = woke(pt('2026-10-25', 2500000, 1), 2400000);
  const other = pt('2026-10-25', 2600000, 0); // the other tablet: no wake, a little more played
  const ok = (m, ms) => m.playtime.woke && m.playtime.woke.ms === ms && m.playtime.wakes === 1 && m.playtime.ms === 2600000;
  check('playtime: a wake\'s minutes stay, whichever copy is preferred', ['mine', 'theirs'].every(how => ok(A.merge(ed(awake), ed(other), how), 2400000) && ok(A.merge(ed(other), ed(awake), how), 2400000)));
  check('playtime: two wakes: the later one', ok(A.merge(ed(awake), ed(woke(other, 2550000)), 'mine'), 2550000) && ok(A.merge(ed(woke(other, 2550000)), ed(awake), 'mine'), 2550000));
  check('playtime: a wake from another day doesn\'t count', ok(A.merge(ed(woke(other, 9000000, '2026-10-24')), ed(awake), 'mine'), 2400000));
}

// ---- Older versions of the game next to this one ------------------------------------
// Tabs still on an older version (M1, eee606ec, and M2+M3, 144e11e1) share
// the account until they reload: what this version adds to a save stays
// through their merges, even of their own older copy ('mine').
{
  const OLD = [['M1', 'eee606ec'], ['M2+M3', '144e11e1']].map(([name, ref]) => [name, deviceAt(ref, 'princess', 'dO')]);
  if (OLD.some(([, P]) => !P)) console.log('skip older versions: git has no eee606ec or 144e11e1 here');
  else {
    const day = '2026-10-25';
    // Their copy from before: today's first two quests done, the chest shut.
    const before = play(A, { edition: 'princess', quests: { day, picks: ['stars', 'fish', 'house'], got: { dA: { stars: 5, fish: 3 } }, chest: false },
      playtime: { day, ms: 2450000, wakes: 0 } }, 40, 0);
    // Then on this version: the house, the chest opened (+5), and the parent's wake.
    const now = play(A, Object.assign({}, before, { coins: 5, earned: Object.assign({}, before.earned, { [`chest:${day}`]: { coins: 5 } }),
      quests: { day, picks: ['stars', 'fish', 'house'], got: { dA: { stars: 5, fish: 3, house: 1 } }, chest: true },
      playtime: { day, ms: 2500000, wakes: 1, woke: { day, ms: 2400000 } } }), 0, 0);
    for (const [name, P] of OLD) {
      // The old tab answers one question on its copy from before: 409, merged as 'mine'.
      const m = P.merge(play(P, before, 1, 0), now, 'mine');
      check(`${name} tab: the day's chest stays paid once (its entry kept)`, m.earned[`chest:${day}`].coins === 5 && m.coins === 5, [m.coins, m.earned]);
      check(`${name} tab: the parent's wake (woke) is kept`, !!m.playtime.woke && m.playtime.woke.ms === 2400000, m.playtime);
      // Another tablet on this version, its own copy from before, merges what
      // the old tab sent: the chest paid once and the wake are there (M1
      // puts back its own count of wakes, but the woke minutes still hold).
      const back = B.merge(play(B, before, 0, 0), m, 'theirs');
      check(`${name} tab, then this version: coins once, the wake kept`, back.coins === 5 && back.playtime.woke.ms === 2400000 && back.stars === 41,
        [back.coins, back.stars, back.playtime]);
    }
  }
}

// ---- Kinds of question this version adds (the Monster Village's long vowels) ----------
// Her answers and her tier in them join like any other kind's. A tab still on
// an older release drops answers of a kind it doesn't know when it loads a
// save (it saves its copy without them), but its merge keeps the ones in
// the other copy, and so does this version's next merge.
{
  const LONG_IDS = ['longRead:cake', 'longWord:kite'];
  const answer = (k, right) => ({ kind: k, tries: 1, right: right ? 1 : 0, wrong: right ? 0 : 1, last: 9 });
  const a = play(A, { edition: 'princess' }, 2, 0, { history: { 'word:cat': answer('word', 1), 'longRead:cake': answer('longRead', 0), 'longWord:kite': answer('longWord', 1) },
    skill: { longRead: sk(2, 9), longWord: sk(3, 4, { set: 5000 }), word: sk(2, 5) } });
  const b = play(B, { edition: 'princess' }, 1, 0, { history: { 'word:cat': answer('word', 1), 'word:dog': answer('word', 0) }, skill: { word: sk(1, 7) } });
  const has = (m, ids) => ids.every(id => !!(m.history || {})[id]);
  const tiers = m => kind(m, 'longRead').t === 2 && kind(m, 'longWord').t === 3;
  const both = [B.merge(b, a, 'mine'), B.merge(b, a, 'theirs'), A.merge(a, b, 'mine'), A.merge(a, b, 'theirs')];
  check('new kinds: their answers and tiers are joined like any other kind\'s', both.every(m => has(m, LONG_IDS.concat('word:dog')) && tiers(m) && kind(m, 'word').n === 7), both[0]);
  // load() keeps only answers of kinds the game knows (Quiz.kinds, js/quiz.js).
  const quiz = vm.runInNewContext(`${['js/data.js', 'js/quiz.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n')}\nQuiz`,
    { location: { search: '' }, localStorage: { getItem: () => null, setItem() {} } });
  const P = vm.runInNewContext(`${fs.readFileSync(path.join(root, 'js/progress.js'), 'utf8')}\nProgress`,
    { EDITION: 'princess', crypto: require('crypto').webcrypto, Quiz: quiz, localStorage: { getItem: () => null, setItem() {} } });
  check('new kinds: this version keeps their answers when it loads a save', has({ history: P.history(a.history) }, LONG_IDS), Object.keys(P.history(a.history)));
  for (const [name, Old] of [['first release', M1], ['previous release', M23]]) {
    if (!Old) continue;
    // The old tab's copy as its game saves it after loading this version's:
    // without the new kinds' answers, and one more answer of its own.
    const old = play(Old, Object.assign({}, a, { history: { 'word:cat': answer('word', 1), 'word:sun': answer('word', 1) } }), 1, 0);
    const o = Old.merge(old, a, 'mine');
    check(`new kinds: a tab on the ${name} keeps their answers and tiers through its merge`, has(o, LONG_IDS.concat('word:sun')) && tiers(o), o);
    const next = [A.merge(b, o, 'mine'), A.merge(o, b, 'theirs')];
    check(`new kinds: and this version's next merge after it has them`, next.every(m => has(m, LONG_IDS.concat('word:sun', 'word:dog')) && tiers(m)), next[0]);
  }
}

// ---- Stickers (js/album.js) ----------------------------------------------------------
{
  const ed = stickers => ({ edition: 'princess', stickers });
  // A saw cat and dog in the album (closeAlbum dropped `new`); B still has them as new.
  const a = { cat: { e: '🐱', n: 4, at: 200 }, dog: { e: '🐶', n: 1, at: 300 } };
  const b = { cat: { e: '🐱', n: 2, at: 100, new: true }, dog: { e: '🐶', n: 3, at: 300, new: true }, sun: { e: '☀️', n: 1, at: 400, new: true } };
  for (const how of ['mine', 'theirs']) {
    const s = A.merge(ed(a), ed(b), how).stickers;
    check(`stickers (${how}): seen on either copy stays seen, a new one stays new`, !s.cat.new && !s.dog.new && s.sun.new === true, s);
    check(`stickers (${how}): the larger count and the first time found`, s.cat.n === 4 && s.dog.n === 3 && s.cat.at === 100, s);
  }
}

// ---- Dust fed to a friend (js/friend.js) ------------------------------------------------
{
  const ed = (friends, dust) => ({ edition: 'princess', friends, dust });
  const fed = f => Object.values(f || {}).reduce((t, v) => t + v, 0);
  // Both from 10 eaten (an earlier save's plain number): A feeds 10 more, B 5.
  const m = A.merge(ed({ pink: { _: 10, dA: 10 } }), ed({ pink: { _: 10, dB: 5 } }), 'mine');
  check('friends: feeds on two tablets add up (10 + 10 + 5)', fed(m.friends.pink) === 25, m.friends);
  check('friends: an earlier save\'s plain number counts once', fed(A.merge(ed({ pink: 10 }), ed({ pink: { _: 10, dB: 2 } }), 'theirs').friends.pink) === 12 &&
    fed(A.merge(ed({ pink: 10, mint: 3 }), ed({ pink: 12 }), 'mine').friends.pink) === 12);
  check('friends: merging again changes nothing', A.same(A.merge(m, ed({ pink: { _: 10, dB: 5 } }), 'mine'), m));
  const g = A.merge(ed({ pink: { dA: 20 } }), ed({ pink: { dA: 15 } }), 'foreign');
  check('friends: a guest\'s feeds go on top of the account\'s (20 + 15)', fed(g.friends.pink) === 35, g.friends);
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
