// Question builders. Each returns everything the dialog needs:
//   clue     HTML shown above the choices (picture, letter or word)
//   ask      speech parts that pose the question
//   prompt   the question as text (defaults to its spoken line)
//   replay   speech parts for the 🔊 button
//   options  [{ html, right, wrong }] where `wrong` is the word or letter
//            the option stands for
//   answer   speech parts said after the praise
//   solved   optional clue HTML once it is answered
//   teach(o) speech parts after a first miss on option o: what she picked
//            and a hint, then she tries again (see choose in game.js)
//   picked(o) just what she picked, before the answer is shown
//   model    speech parts that show the answer after a second miss
// `ask` holds Quiz.READY where the target has been heard: the cards can be
// tapped from there on.
//
// How hard a question is depends on her tier for that kind (TIERS in
// js/data.js, state.skill): how many cards, pictures or not, how close the
// other cards are, which words. See tierFor and learn below.

const Quiz = (() => {
  const READY = { ready: true };
  let recent = {}; // kind -> the last targets asked

  // ---- Words -----------------------------------------------------------------
  // Every word the questions use, once: { w, e, pic, aka, parts, syl }.
  //   pic 2: the picture alone names it (WEAK_PICTURES and pic-1 bank
  //   words don't); aka: other names she may use for the picture (ALIAS);
  //   parts: its sounds when a letter pair is one sound (f-i-sh);
  //   syl: its syllables (rab-bit).
  // A word whose vowel says its name (LONG_VOWELS) also has `long`, its
  // sounds with that vowel as a capital letter (c-A-k), `team`, how the
  // vowel is spelled (a_e, oa), and `says`, the letter whose name it says.
  let index = null;
  function words() {
    if (index) return index;
    index = {};
    const add = (w, e, pic = 2, parts, bank) => {
      const x = index[w] || (index[w] = { w, e, pic, aka: ALIAS[w] || [] });
      x.pic = WEAK_PICTURES.has(w) ? 1 : Math.min(x.pic, pic);
      if (parts) x[parts.some(p => p.length > 2) ? 'syl' : 'parts'] = parts;
      if (bank) x.bank = true; // every letter (or letter pair) says its usual sound
    };
    for (const list of [CVC_A1, CVC_A2, CCVC, CVCC, LONG, DIGRAPH]) for (const [w, e, pic, parts] of list) add(w, e, pic, parts, true);
    for (const g of LONG_VOWELS) {
      for (const [w, e, pic, long] of g.words) {
        add(w, e, pic);
        Object.assign(index[w], { long, team: g.team, says: g.says });
      }
    }
    LETTERS.forEach(l => l.words.forEach(([w, e]) => add(w, e)));
    WORD_FAMILIES.forEach(f => f.forEach(([w, e]) => add(w, e)));
    RHYME_SETS.concat(LONG_RHYMES).forEach(r => r.set.forEach(([w, e]) => add(w, e)));
    for (const x of SENTENCES.concat(SENTENCES_L1, SENTENCES_L2)) { add(x.w[0], x.w[1]); x.other.forEach(([w, e]) => add(w, e)); }
    return index;
  }
  const entry = ([w]) => words()[w];
  const syllables = w => (w.match(/[aeiouy]+/g) || []).length;
  // Old word families: every word with the family it belongs to.
  const famWords = () => {
    const seen = new Set();
    const list = [];
    for (const fam of WORD_FAMILIES) for (const [w] of fam) if (!seen.has(w)) { seen.add(w); list.push(Object.assign({ fam }, words()[w])); }
    return list;
  };
  // The word lists TIERS name.
  const BANK = {
    CVC_A1: () => CVC_A1.map(entry),
    CVC: () => CVC_A1.concat(CVC_A2).map(entry),
    BLEND4: () => CCVC.concat(CVCC).map(entry),
    DIGRAPH4: () => DIGRAPH.filter(([w]) => w.length === 4).map(entry),
    ONE5: () => LONG.filter(x => !x[3]).concat(DIGRAPH.filter(([w]) => w.length >= 5 && syllables(w) === 1)).map(entry),
    TWO: () => LONG.filter(x => x[3]).concat(DIGRAPH.filter(([w]) => syllables(w) > 1)).map(entry),
    FAM: famWords,
    // Long vowels with a picture she names for sure: one sound before the
    // vowel (cake, sheep), or any (snake, tree, star too).
    NAME1: () => longWords().filter(x => clear(x) && x.long.indexOf(x.says) === 1),
    NAME: () => longWords().filter(clear),
  };
  // Every word whose vowel says its name, with or without a picture.
  const longWords = () => LONG_VOWELS.flatMap(g => g.words.map(entry));
  // The short twin of a long word (kit for kite), if it has one.
  const twinOf = w => (LONG_TWINS.find(([, long]) => long === w) || [])[0];
  const minimalWords = () => [...new Set(MINIMAL_SETS.flat())].map(w => words()[w]);
  const letterWords = () => LETTERS.flatMap(info => info.words.map(([w]) => Object.assign({ info }, words()[w])));
  const clear = x => x.pic >= 2;
  // Three letters, a vowel in the middle and a plain last letter (cat, not cow).
  const cvcShape = x => /^[^aeiou][aeiou][^aeiouwy]$/.test(x.w) && !!PART_SOUNDS[x.w[2]];
  // Starts with one consonant sound: no tr, sn, sh (first-sound questions, easiest tier).
  const single = x => /^[^aeiou][aeiou]/.test(x.w) && !/^qu/.test(x.w);
  const prefer = (list, f) => { const some = f ? list.filter(f) : list; return some.length ? some : list; };
  const sentencesAt = lv => (lv === 1 ? SENTENCES_L1 : lv === 2 ? SENTENCES_L2 : SENTENCES);

  // ---- Sounds she can't tell apart -------------------------------------------
  // HARD_PAIRS: a/e, f/p, l/r... only come together at a kind's top tier
  // (`near`); letters that say the same sound (c and k) never do.
  const has = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const sameSound = (a, b) => a === b || has(HARD_PAIRS.same, a, b);
  const hardPair = (a, b) => a !== b && has(HARD_PAIRS.vowels.concat(HARD_PAIRS.consonants), a, b);
  const nearPair = (a, b) => hardPair(a, b) || has(HARD_PAIRS.looks, a, b);
  // The letter of each short vowel sound (RHYME_SETS v), to find rhymes she
  // hears as the same (at, et).
  const SHORT = { 'æ': 'a', 'ɛ': 'e', 'ɪ': 'i', 'ɑ': 'o', 'ʌ': 'u' };
  // The letter whose name each long vowel sound says: the rhymes the Monster
  // Village asks about (longRhyme), RHYME_SETS' long ones and LONG_RHYMES.
  const NAMED = { 'eɪ': 'A', i: 'E', 'aɪ': 'I', 'oʊ': 'O', 'ɑr': 'R' };
  const longRhymes = () => RHYME_SETS.filter(r => NAMED[r.v]).concat(LONG_RHYMES);
  // The last sound of a rhyme (ake: k, ell: l, ee: none), to find words that
  // end the same after another vowel (kite, bat).
  const lastSound = rime => {
    const m = /[^aeiouwy]+$/.exec(rime.replace(/e$/, ''));
    return m ? m[0].replace(/^(.)\1$/, '$1').replace('ck', 'k') : '';
  };
  // Two words that differ only in such a letter (pan, pen).
  function nearWords(a, b) {
    if (a.length !== b.length) return false;
    const diff = [...a].map((c, i) => [c, b[i]]).filter(([x, y]) => x !== y);
    return diff.length === 1 && hardPair(diff[0][0], diff[0][1]);
  }
  // A card whose picture she may call by the target's own name (🥤 for mug).
  const alike = (x, t) => x.aka.includes(t.w) || t.aka.includes(x.w) || x.e === t.e;
  // n other cards from `pool`, each passing ok(x, chosen). With `partner`,
  // the first one is a hard one: partner(x) and ok(x, chosen, true).
  function others(pool, n, ok, partner) {
    const out = [];
    const list = shuffle(pool.slice());
    if (partner) { const p = list.find(x => partner(x) && ok(x, out, true)); if (p) out.push(p); }
    for (const x of list) if (out.length < n && !out.includes(x) && ok(x, out, false)) out.push(x);
    return out;
  }

  const withId = (kind, list, key = x => x.w) => list.map(x => Object.assign({}, x, { id: `${kind}:${key(x)}` }));
  // Every question has a stable id ("rhyme:cat", "sentence:The {} says moo.")
  // and each kind has a pool of the ids it can ask at a tier, so the game can
  // tell which ones she has already got right (state.history, see record()).
  const pools = {
    word: npc => withId('word', letterWords().filter(x => !npc.letter || x.info.letter === npc.letter)),
    start: (npc, cfg) => withId('start', prefer(letterWords(), cfg.single && single)),
    // Only the picture is shown, so only pictures she can name for sure.
    findStart: (npc, cfg) => withId('findStart', prefer(letterWords().filter(x => (!npc.letter || x.info.letter === npc.letter) && clear(x)), cfg.single && single)),
    rhyme: () => withId('rhyme', RHYME_SETS.map(r => ({ r, w: r.set[0][0] }))),
    family: (npc, cfg) => withId('family', cfg.minimal ? minimalWords() : BANK[cfg.words]()),
    vowel: (npc, cfg) => withId('vowel', BANK[cfg.words]().filter(cvcShape)),
    ending: (npc, cfg) => withId('ending', BANK[cfg.words]().filter(cvcShape)),
    read: (npc, cfg) => withId('read', cfg.minimal ? minimalWords() : BANK[cfg.words]().filter(clear)),
    blend: (npc, cfg) => withId('blend', cfg.minimal ? minimalWords() : BANK[cfg.words]().filter(clear)),
    sentence: (npc, cfg) => withId('sentence', sentencesAt(cfg.lv).map(x => ({ x, w: x.w[0] })), y => y.x.s),
    meaning: (npc, cfg) => withId('meaning', sentencesAt(cfg.lv).map(x => ({ x, w: x.w[0] })), y => y.x.s),
    spell: (npc, cfg) => withId('spell', BANK[cfg.words]().filter(x => !(cfg.noX && x.w.includes('x')) && graphemes(x).every(soundOf))),
    // The Monster Village's long vowels (BANK words have pictures she names
    // for sure; longWord's are written, so any, and at a `twin` tier the
    // ones with a short twin).
    longBlend: (npc, cfg) => withId('longBlend', BANK[cfg.words]()),
    longRead: (npc, cfg) => withId('longRead', BANK[cfg.words]()),
    longWord: (npc, cfg) => withId('longWord', longWords().filter(x => !cfg.twin || twinOf(x.w))),
    longRhyme: () => withId('longRhyme', longRhymes().map(r => ({ r, w: r.set[0][0] }))),
  };
  const history = () => (typeof state !== 'undefined' && state.history) || {};
  const solved = id => (history()[id] || {}).right > 0;
  // Review mode: every question of this kind at this tier (here) has been answered right.
  const reviewing = (kind, npc, cfg) => !!pools[kind] && pools[kind](npc, cfg).every(x => solved(x.id));

  // Prefer words she hasn't seen lately; fall back to everything. Each kind
  // keeps its own list, at most half its pool, so small pools still turn over.
  function fresh(kind, list) {
    const r = recent[kind] || [];
    const f = list.filter(x => !r.includes(x.w));
    return f.length ? f : list;
  }
  function remember(kind, word, size) {
    const cap = Math.max(1, Math.min(RECENT_WORDS, Math.floor(size / 2)));
    recent[kind] = (recent[kind] || []).filter(w => w !== word).concat(word).slice(-cap);
  }

  // The next question of a kind at a tier: one she hasn't got right yet if
  // there is any, otherwise a review that favours the ones she missed and
  // the ones she hasn't seen for a while. Recent words stay out when they
  // can. A question that comes back after a miss asks for its own id (`want`).
  let want = null;
  function take(kind, npc, cfg) {
    const all = pools[kind](npc, cfg);
    const back = want && all.find(x => x.id === want);
    const x = back || choose(kind, all);
    remember(kind, x.w, all.length);
    return x;
  }
  function choose(kind, all) {
    const open = all.filter(x => !solved(x.id));
    if (open.length) return pick(fresh(kind, open));
    const now = Date.now();
    const list = fresh(kind, all);
    const weights = list.map(x => {
      const h = history()[x.id];
      const days = Math.min(14, (now - (h.last || 0)) / 864e5);
      return (1 + 12 * h.wrong / Math.max(1, h.right)) * (1 + days / 3);
    });
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) if ((r -= weights[i]) < 0) return list[i];
    return list[list.length - 1];
  }

  // ---- Tiers -----------------------------------------------------------------
  // Level 6 is the Monster Village and its tower.
  const placeOf = npc => (npc.level === 6 ? 'monster' : npc.level === 5 ? 'fairy' : npc.level === 4 ? 'dungeon' : npc.level === 3 ? 'unicorn' : npc.level === 2 ? 'forest' : npc.letter ? 'house' : 'town');
  const settings = () => (typeof state !== 'undefined' && state.settings) || {};
  // Tiers a kind has; a tier with a `setting` only once a parent turns it on.
  const allowed = c => !c.setting || settings()[c.setting];
  const tierMax = kind => TIERS[kind].filter(allowed).length;
  const newSkill = () => ({ t: 1, best: 1, w: [], last: [], placed: false, easy: false, n: 0 });
  // Her level in a kind (state.skill, saved): t her tier, best the highest
  // she has reached, w her last first-try answers at t (1 right, 0 missed),
  // last her last ten first tries anywhere, placed once she has missed one.
  function skill(kind) {
    if (typeof state === 'undefined') return newSkill();
    const all = state.skill || (state.skill = {});
    return all[kind] || (all[kind] = newSkill());
  }
  // The tier for the next question: hers, capped by the place, and one
  // lower right after a miss and for every 4th question. Only questions at
  // her own tier count towards moving up or down.
  function tierFor(kind, npc) {
    const k = skill(kind);
    const hi = Math.min((TIER_BAND[placeOf(npc)] || [1, 1])[1], tierMax(kind));
    const own = Math.max(1, Math.min(k.t, hi));
    let t = own;
    if (k.easy || ++k.n % SKILL.reviewEvery === 0) t--;
    t = Math.max(1, t);
    return { t, cfg: TIERS[kind][t - 1], counts: t === own, cap: hi };
  }
  // Her first answer to a question (from record): moves her tier. Up after
  // 5 of the last 6 (or, before her first miss, 3 in a row), down after 2
  // misses in a row; never above what this place asks. A new best tier is a
  // level-up for the child.
  function learn(q, right) {
    const k = skill(q.kind);
    const max = Math.min(tierMax(q.kind), q.cap || Infinity);
    k.last = (k.last || []).concat(right ? 1 : 0).slice(-10);
    k.easy = !right;
    if (!q.counts) return;
    if (!right) k.placed = true;
    k.w = k.w.concat(right ? 1 : 0).slice(-SKILL.window);
    const sum = k.w.reduce((a, b) => a + b, 0);
    const run = k.w.slice(-SKILL.placementRun);
    const placing = !k.placed && run.length === SKILL.placementRun && run.every(Boolean);
    if (k.t < max && (placing || (k.w.length >= SKILL.window && sum >= SKILL.promoteAt))) {
      k.t++;
      k.w = [];
      if (k.t > (k.best || 1)) { k.best = k.t; q.levelUp = true; }
    } else if (k.t > 1 && k.w.length >= SKILL.demoteAfter && k.w.slice(-SKILL.demoteAfter).every(x => !x)) {
      k.t--;
      k.w = [];
    }
  }
  // Levels for a save from before tiers, from its answers: a kind with 8 or
  // more answers starts at tier 3 if 90% were right the first time, tier 2
  // at 75%. Spelling stops at 2 (its higher tiers are new words). No kind
  // starts at its top tier or at one that puts sounds she can't tell apart
  // side by side (`near`, `minimal`): the old game never asked those.
  function migrate(histories) {
    const per = {};
    for (const hist of histories) for (const h of Object.values(hist || {})) {
      if (!h || !TIERS[h.kind]) continue;
      const p = per[h.kind] || (per[h.kind] = { tries: 0, right: 0 });
      p.tries += h.tries | 0;
      p.right += h.right | 0;
    }
    const out = {};
    for (const [kind, p] of Object.entries(per)) {
      if (p.tries < 8) continue;
      const r = p.right / p.tries;
      const hard = TIERS[kind].findIndex((c, i) => c.near || c.minimal || i === TIERS[kind].length - 1);
      const t = Math.max(1, Math.min(r >= 0.9 ? 3 : r >= 0.75 ? 2 : 1, kind === 'spell' ? 2 : 3, hard));
      out[kind] = Object.assign(newSkill(), { t, best: t, placed: true });
    }
    return out;
  }

  // Counts a question once, at her first answer (choose in game.js). A miss
  // stays a miss: the question that comes back after it (q.retry) adds a
  // try but not a right, so it is asked again later; it doesn't move her tier.
  function record(q, right) {
    if (!q || !q.id || q.recorded || typeof state === 'undefined') return;
    q.recorded = true;
    if (!state.history) state.history = {};
    const h = state.history[q.id] || (state.history[q.id] = { kind: q.kind, tries: 0, right: 0, wrong: 0, last: 0 });
    h.tries++;
    if (!right) h.wrong++;
    else if (!q.misses && !q.retry) h.right++;
    h.last = Date.now();
    if (!q.retry && TIERS[q.kind]) learn(q, right && !q.misses);
  }

  // ---- Speech ----------------------------------------------------------------
  const say = w => ({ text: w, file: rec('words', w), rate: 0.72, narrator: true });
  // The word in a question, in the asker's own voice so the line doesn't
  // switch speakers halfway (recorded for each voice by tools/tts-phrases.js).
  // `slow` plays the recording a little slower, for a hint.
  const voiced = (w, slow) => Object.assign({ text: w, file: rec('words', w), rate: 0.85 }, slow ? { slow } : {});
  // A doubled letter (the ll of bell, the gg of egg) is one sound, the
  // single letter's.
  const undoubled = l => (l.length === 2 && l[0] === l[1] ? l[0] : l);
  // How a letter's sound is spelled in lines like "C says kuh.".
  const soundOf = l => PART_SOUNDS[undoubled(l)] || (LETTERS.find(x => x.letter === undoubled(l).toUpperCase()) || {}).sound;
  // A letter's pure sound, said on its own by the narrator: "/c/" is a clip
  // of just that sound (js/audio.js says the spelling above if it has none).
  // `show` is what the dialog prints for it.
  const sound = l => ({ text: `/${undoubled(l)}/`, narrator: true, show: `${l}…` });
  // "M says mmm." in the narrator's voice.
  const says = l => ({ text: `${l.toUpperCase()} says ${soundOf(l.toLowerCase())}.`, narrator: true });
  // The word she picked, said back.
  const named = w => Object.assign(say(w), { show: `${w}…` });
  const lead = kind => ({ text: line(kind) });
  // A word whose every letter says its own sound (no sh, oo, silent e, r
  // after a vowel or soft c). Bank words say how they are sounded out.
  const plain = w => /^[a-z]{3,5}$/.test(w) && (w.match(/[aeiou]/g) || []).length === 1 &&
    !/sh|ch|th|ck|ng|ll|ss|gh|wh|ph|kn|wr|qu|w[ao]|[aoe]w|oo|ee|ea|oa|ai|[aeiou]r|[aeiouwy]$|c[eiy]|g[eiy]|olt$|[hmp]ost$|old$|ind$|ild$/.test(w) &&
    [...w].every(soundOf);
  // Its sounds, one tile each: f-i-sh, c-a-t, e-gg; a long word syllable by syllable.
  const graphemes = x => x.parts || (x.syl ? x.syl.join('').split('') : x.w.match(/(.)\1|./g));
  // A word whose vowel says its name is never sounded out letter by letter
  // (no "/k/ /a/ /k/ /e/" for cake): see nameSounds.
  const soundable = x => !x.long && !!(x.bank || plain(x.w));
  // "/f/ /i/ /sh/", a longer pause between syllables.
  function sounds(x, gap = 160) {
    const out = [];
    const groups = x.syl ? x.syl.map(s => s.split('')) : [graphemes(x)];
    groups.forEach((g, i) => {
      if (i) out.push({ pause: 300 });
      for (const l of g) out.push(sound(l), { pause: gap });
    });
    return out;
  }
  // Sounds first, then the word: "/c/ /a/ /t/… cat!"; a word that can't be
  // sounded out is just said.
  const sounded = x => (soundable(x) ? sounds(x).concat({ pause: 250 }) : []).concat(say(`${x.w}!`));
  // A long vowel's sounds (the Monster Village): the pure sounds around it,
  // and the vowel said as the narrator's own letter name: "/k/ … A … /k/".
  const letterName = L => ({ text: L, narrator: true, show: `${L}…` });
  function nameSounds(x, gap = 160) {
    const out = [];
    for (const p of x.long) out.push(/^[A-Z]$/.test(p) ? letterName(p) : sound(p), { pause: gap });
    return out;
  }
  const nameSounded = x => nameSounds(x).concat({ pause: 250 }, say(`${x.w}!`));
  // What makes the vowel say its name, said by the narrator after a miss:
  // "Magic e makes the A say its name!", "O A says O!".
  const rule = x => ({
    text: x.team.includes('_') ? line('magicE', { letter: x.says }) : line('vowelTeam', { team: x.team.toUpperCase().split('').join(' '), letter: x.says }),
    narrator: true,
  });
  // What a letter picked for a blank spells: a real word is said and shown
  // on its card ("c u t" is cut), otherwise the letter's sound is said.
  function filledIn(t, x, at) {
    const w = t.w.slice(0, at) + x + t.w.slice(at + 1);
    const e = words()[w] && words()[w].e;
    return e ? { w, e, parts: [named(w)], html: `<span class="also">${e} ${w}</span>` } : { w, parts: [says(x)], html: '' };
  }

  // ---- Cards -----------------------------------------------------------------
  const firstBig = w => `<span class="first">${w[0]}</span>${w.slice(1)}`;
  const long = w => (w.length > 6 ? ' long' : '');
  const wordCard = (w, e) => `<span class="pic">${e}</span><span class="w${long(w)}">${firstBig(w)}</span>`;
  const picCard = (w, e) => `<span class="bigpic">${e}</span><span class="w hide">${w}</span>`;
  const letterCard = l => `<span class="letter">${l}</span>`;
  const plainCard = w => `<span class="w${long(w)}">${w}</span>`;
  // Cards in a random order, the right one marked.
  const deal = (t, list, card) => shuffle([t].concat(list)).map(o => Object.assign(card(o), { right: o === t }));

  // Word cards for the word and findStart questions: other letters' words.
  // Never one she could call by a name that starts like the target (🦍 is
  // a monkey to her), nor two cards starting with letters that say the same
  // sound (c, k); at the top tier one starts with a letter she finds hard to
  // tell from the target's.
  function letterOthers(t, n, cfg, picture) {
    const L = t.w[0];
    const ok = (x, out, partner) => x.info !== t.info && !alike(x, t) && (!picture || clear(x)) &&
      ![x.w].concat(x.aka).some(m => sameSound(m[0], L)) &&
      (partner || !(cfg.far ? nearPair : hardPair)(x.w[0], L)) &&
      !out.some(o => o.info === x.info || o.e === x.e || alike(o, x) || sameSound(o.w[0], x.w[0]));
    return others(letterWords(), n, ok, cfg.near && (x => nearPair(x.w[0], L)));
  }

  // Hints shared by the kinds where she hears a word and picks it: what she
  // picked, then the word again ("cap… Listen. cat").
  const hearAgain = t => ({
    teach: o => [named(o.wrong), { pause: 300 }, lead('listen'), voiced(t.w, 0.85)],
    picked: o => [named(o.wrong)],
    model: sounded(t),
  });

  const builders = {
    word(npc, cfg) {
      const t = take('word', npc, cfg);
      return Object.assign({
        id: t.id, target: t.w, clue: '',
        ask: [{ text: line('ask') }, { pause: 750 }, voiced(t.w), READY],
        replay: [voiced(t.w)],
        options: deal(t, letterOthers(t, cfg.n - 1, cfg), o => ({ html: wordCard(o.w, o.e), wrong: o.w, words: true, alwaysPictures: cfg.pics })),
        answer: [say(`${t.w}!`)],
      }, hearAgain(t));
    },

    start(npc, cfg) {
      const t = take('start', npc, cfg);
      const L = t.info.letter;
      const low = l => l.letter.toLowerCase();
      // No letter her own name for the picture starts with (C for 🐱 "kitty" is fine, K is not).
      const ok = (l, out, partner) => l !== t.info && !t.aka.some(m => sameSound(m[0], low(l))) && !sameSound(low(l), t.w[0]) &&
        (partner || !(cfg.far ? nearPair : hardPair)(low(l), t.w[0])) && !out.some(o => sameSound(low(o), low(l)));
      const letters = others(LETTERS, cfg.n - 1, ok, cfg.near && (l => nearPair(low(l), t.w[0])));
      const card = l => (cfg.lower ? l.letter.toLowerCase() : l.letter + l.letter.toLowerCase());
      // With `sound`, she hears the word's first sound on its own too: "cat… /k/".
      const hint = cfg.sound ? [{ pause: 400 }, sound(t.w[0])] : [];
      const ask = line('firstSound');
      return {
        id: t.id, target: t.w, clue: `<span class="clue-pic">${t.e}</span>`,
        prompt: ask,
        ask: [voiced(t.w)].concat(hint, { pause: 600 }, { text: ask }, READY),
        replay: [voiced(t.w)].concat(hint),
        options: deal(t.info, letters, l => ({ html: letterCard(card(l)), wrong: l.letter })),
        answer: [{ text: `${t.w} starts with ${L}.`, narrator: true }].concat(cfg.sound ? [{ pause: 200 }, says(L)] : []),
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${firstBig(t.w)}</span>`,
        // "M says mmm. Listen. cat"
        teach: o => [says(o.wrong), { pause: 400 }, lead('listen'), voiced(t.w, 0.85)],
        picked: o => [says(o.wrong)],
        // "/k/… cat starts with C."
        model: [sound(t.w[0]), { pause: 300 }, { text: `${t.w} starts with ${L}.`, narrator: true }],
      };
    },

    findStart(npc, cfg) {
      const t = take('findStart', npc, cfg);
      const L = t.info.letter;
      // One sentence in the asker's voice, the letter said by its name;
      // with `sound`, then the letter's sound on its own.
      const ask = { text: `${line('findStart')} ${L}?` };
      const hint = cfg.sound ? [{ pause: 400 }, sound(L.toLowerCase())] : [];
      const startsWith = o => ({ text: `${o.w} starts with ${o.info.letter}.`, narrator: true });
      return {
        id: t.id, target: t.w, clue: `<span class="clue-letter">${L}${L.toLowerCase()}</span>`,
        prompt: ask.text,
        ask: [ask].concat(hint, READY),
        replay: [ask].concat(hint),
        options: deal(t, letterOthers(t, cfg.n - 1, cfg, true), o => ({ html: picCard(o.w, o.e), wrong: o.w, item: o })),
        answer: [say(`${t.w}!`)].concat(cfg.sound ? [{ pause: 200 }, says(L)] : []),
        // "dog starts with D. C says kuh."
        teach: o => [startsWith(o.item), { pause: 400 }, says(L)],
        picked: o => [startsWith(o.item)],
        model: [sound(L.toLowerCase()), { pause: 300 }, startsWith(t)],
      };
    },

    rhyme: (npc, cfg) => rhymeQuestion('rhyme', npc, cfg, RHYME_SETS),

    // Hear a word, find it among words that start the same way, so she has
    // to listen to the middle and the end.
    family(npc, cfg) {
      const t = take('family', npc, cfg);
      const list = similar(t, cfg, cfg.minimal ? minimalWords() : cfg.words === 'FAM' ? famWords() : BANK[cfg.words]());
      return Object.assign({
        id: t.id, target: t.w, clue: '',
        ask: [{ text: line('ask2') }, { pause: 750 }, voiced(t.w), READY],
        replay: [voiced(t.w)],
        options: deal(t, list, o => ({ html: wordCard(o.w, o.e), wrong: o.w, words: true, alwaysPictures: cfg.pics })),
        answer: [say(`${t.w}!`)],
      }, hearAgain(t));
    },

    vowel(npc, cfg) {
      const t = take('vowel', npc, cfg);
      const v = t.w[1];
      const ask = line('vowel');
      return Object.assign(blankQuestion(t, 1, letterChoices(v, 'aeiou', cfg)), {
        clue: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w[0]}<span class="blank">?</span>${t.w[2]}</span>`,
        // The word first, then the question about it.
        prompt: ask,
        ask: [voiced(t.w), { pause: 600 }, { text: ask }, READY],
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w[0]}<span class="first">${v}</span>${t.w[2]}</span>`,
      });
    },

    ending(npc, cfg) {
      const t = take('ending', npc, cfg);
      const end = t.w[2];
      const ask = line('ending');
      return Object.assign(blankQuestion(t, 2, letterChoices(end, 'tgnpdbmsx', cfg)), {
        clue: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w.slice(0, 2)}<span class="blank">?</span></span>`,
        prompt: ask,
        ask: [voiced(t.w), { pause: 600 }, { text: ask }, READY],
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w.slice(0, 2)}<span class="first">${end}</span></span>`,
      });
    },

    // Read a word, pick its picture. She reads it herself, so a hint sounds
    // it out without saying it.
    read(npc, cfg) {
      const t = take('read', npc, cfg);
      const list = similar(t, cfg, cfg.minimal ? minimalWords() : BANK[cfg.words]().filter(clear), true);
      const ask = line('read');
      return {
        id: t.id, target: t.w, clue: `<span class="clue-word big">${t.w}</span>`,
        ask: [{ text: ask }],
        replay: [{ text: ask }],
        options: deal(t, list, o => ({ html: picCard(o.w, o.e), wrong: o.w })),
        answer: [say(`${t.w}!`)],
        teach: o => [named(o.wrong), { pause: 300 }, lead('listen')].concat(soundable(t) ? sounds(t) : [sound(t.w[0])]),
        picked: o => [named(o.wrong)],
        model: sounded(t),
      };
    },

    // Hear a word's sounds one by one ("/s/ … /u/ … /n/") and pick its picture.
    blend(npc, cfg) {
      const t = take('blend', npc, cfg);
      const list = similar(t, cfg, cfg.minimal ? minimalWords() : BANK[cfg.words]().filter(clear), true);
      const ask = line('blend');
      const slow = sounds(t, 450);
      return {
        id: t.id, target: t.w,
        // A dot for each sound.
        clue: `<span class="clue-sounds">${graphemes(t).map(() => '<span class="dot"></span>').join('')}</span>`,
        prompt: ask,
        ask: [{ text: ask }, { pause: 500 }].concat(slow, READY),
        replay: slow,
        options: deal(t, list, o => ({ html: picCard(o.w, o.e), wrong: o.w })),
        answer: sounded(t),
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w}</span>`,
        teach: o => [named(o.wrong), { pause: 300 }, lead('listen')].concat(sounds(t, 600)),
        picked: o => [named(o.wrong)],
        model: sounded(t),
      };
    },
  };

  // Rhymes: the other cards come from rhymes with another vowel; at the top
  // tier one has the same vowel (cat, can). `sets` are the rhymes a kind
  // asks about, and the other cards' too; at an `endSound` tier one comes
  // from `ends` instead: another vowel that ends in the same sound (kite, bat).
  function rhymeQuestion(kind, npc, cfg, sets, ends = []) {
    const { r, id } = take(kind, npc, cfg);
    const [base, ans] = shuffle(r.set.slice()).map(([w]) => words()[w]);
    const fromSet = s => Object.assign({ v: s.v, rime: s.rime }, words()[pick(s.set)[0]]);
    const pool = sets.filter(s => s !== r).map(fromSet);
    const end = lastSound(r.rime);
    const endings = cfg.endSound && end ? ends.filter(s => s.v !== r.v && lastSound(s.rime) === end).map(fromSet) : [];
    // Never a picture she may call by a rhyming name (🚐 "car" for star).
    const rhymes = x => x.aka.some(a => a.endsWith(r.rime) || r.set.some(([w]) => w === a));
    // Below the top tier, never one that ends the same after a short vowel
    // she can't tell from this one yet (hat, jet).
    const near = x => hardPair(SHORT[x.v], SHORT[r.v]) && x.rime.slice(1) === r.rime.slice(1);
    // `far`: another last sound too (cake, dog).
    const ok = (x, out, partner) => (partner || (x.v !== r.v && !endings.includes(x))) && (cfg.sameVowel || !near(x)) &&
      (!cfg.far || lastSound(x.rime) !== end) && !alike(x, base) && !alike(x, ans) && !rhymes(x) &&
      !out.some(o => o.w === x.w || o.e === x.e || o.v === x.v);
    const partner = cfg.sameVowel ? (x => x.v === r.v) : endings.length ? (x => endings.includes(x)) : null;
    const list = others(pool.concat(endings), cfg.n - 1, ok, partner);
    const ask = line('rhyme');
    return {
      id, target: r.set[0][0], base: base.w, clue: `<span class="clue-pic">${base.e}</span><span class="clue-word">${base.w}</span>`,
      prompt: `${ask} "${base.w}"?`,
      ask: [{ text: ask }, { pause: 300 }, voiced(base.w), READY],
      replay: [voiced(base.w)],
      options: deal(ans, list, o => ({ html: wordCard(o.w, o.e), wrong: o.w, alwaysPictures: true })),
      answer: [{ text: `${base.w}, ${ans.w}!`, narrator: true }],
      // "dog… Listen to the end. cat"
      teach: o => [named(o.wrong), { pause: 300 }, lead('rhymeEnd'), voiced(base.w, 0.85)],
      picked: o => [named(o.wrong)],
      model: [{ text: `${base.w}, ${ans.w}!`, narrator: true }],
    };
  }

  // Words for the other cards of family, read and blend: ones that sound
  // much like the target (same first letter, or its minimal set at the top
  // tier), then others from the list. Never two that differ only in a sound
  // she can't hear yet, below the top tier; never the same picture, or one
  // she could call by the target's name.
  function similar(t, cfg, list, picture) {
    const n = cfg.n - 1;
    const sets = MINIMAL_SETS.filter(s => s.includes(t.w)).flat();
    const pool = list.concat(famWords(), BANK.CVC()).filter(x => x.w !== t.w && (!picture || clear(x) || cfg.minimal));
    const ok = (x, out) => !alike(x, t) && (cfg.minimal || !nearWords(x.w, t.w)) &&
      !out.some(o => o.w === x.w || o.e === x.e || alike(o, x) || (!cfg.minimal && nearWords(o.w, x.w)));
    const out = [];
    const add = cands => { for (const x of shuffle(cands)) if (out.length < n && ok(x, out)) out.push(x); };
    if (cfg.minimal) add(pool.filter(x => sets.includes(x.w)));
    if (cfg.minimal) add(pool.filter(x => x.w.length === t.w.length && [...x.w].filter((c, i) => c !== t.w[i]).length === 1));
    if (cfg.words === 'FAM' && t.fam) add(pool.filter(x => t.fam.some(([w]) => w === x.w)));
    // `far`: only words that start with another letter.
    if (cfg.far) add(list.filter(x => x.w !== t.w && x.w[0] !== t.w[0] && (!picture || clear(x))));
    add(list.filter(x => x.w !== t.w && x.w[0] === t.w[0] && (!picture || clear(x) || cfg.minimal)));
    add(pool.filter(x => x.w[0] === t.w[0]));
    add(list.filter(x => x.w !== t.w && (!picture || clear(x) || cfg.minimal)));
    add(pool);
    return out;
  }

  // The letters on the cards of a blank: the right one and others; the
  // easiest tier only far ones (a, o), the top tier one she finds hard (a, e).
  function letterChoices(right, from, cfg) {
    const ok = (l, out, partner) => !sameSound(l, right) && (partner || !(cfg.far ? nearPair : hardPair)(l, right)) &&
      !out.some(o => sameSound(o, l));
    return [right].concat(others(from.split(''), cfg.n - 1, ok, cfg.near && (l => hardPair(l, right))));
  }

  // Middle and last letter questions: the letter at `at` is missing. A
  // wrong letter that spells another word shows and says it ("cut ✂️").
  function blankQuestion(t, at, letters) {
    const right = t.w[at];
    const made = {};
    for (const x of letters) if (x !== right) made[x] = filledIn(t, x, at);
    return {
      id: t.id, target: t.w,
      replay: [voiced(t.w)],
      options: shuffle(letters).map(x => ({ html: letterCard(x) + (made[x] ? made[x].html : ''), right: x === right, wrong: x.toUpperCase(), letter: x })),
      answer: [say(`${t.w}!`)],
      teach: o => made[o.letter].parts.concat({ pause: 300 }, lead('listen'), voiced(t.w, 0.8)),
      picked: o => made[o.letter].parts,
      model: sounded(t),
    };
  }

  // Sentences: "The {} is hot." with the blank shown as a line.
  function sentenceParts(x) {
    const [before, after] = x.s.split('{}');
    return { before, after, full: before + x.w[0] + after };
  }
  const blankHtml = x => { const p = sentenceParts(x); return `<span class="clue-sentence">${p.before}<span class="blank wide">?</span>${p.after}</span>`; };
  const filledHtml = x => { const p = sentenceParts(x); return `<span class="clue-sentence">${p.before}<span class="first">${x.w[0]}</span>${p.after}</span>`; };
  Object.assign(builders, {
    // She hears the whole sentence and picks the word she heard from
    // words that sound alike (with pictures at the easiest tier, when they
    // all have one).
    sentence(npc, cfg) {
      const { x, id } = take('sentence', npc, cfg);
      const full = { text: sentenceParts(x).full, rate: 0.8 };
      const pic = w => words()[w] && words()[w].e;
      // Words she can't hear apart from the answer yet (pan, pen) only at
      // the top tier; at the easiest, words with a picture first.
      const fair = x.alike.filter(w => cfg.near || !nearWords(w, x.w[0]));
      const rank = w => (cfg.pics && !pic(w) ? 1 : 0);
      const alikes = shuffle(fair).sort((a, b) => rank(a) - rank(b)).slice(0, cfg.n - 1);
      const opts = [x.w[0]].concat(alikes);
      const pics = cfg.pics && opts.every(pic) && new Set(opts.map(pic)).size === opts.length;
      return {
        id, target: x.w[0], clue: blankHtml(x),
        ask: [{ text: line('sentence') }, { pause: 700 }, full, READY],
        replay: [full],
        options: deal(x.w[0], alikes, w => ({ html: pics ? wordCard(w, pic(w)) : plainCard(w), wrong: w, alwaysPictures: pics })),
        answer: [full],
        solved: filledHtml(x),
        teach: o => [named(o.wrong), { pause: 300 }, lead('listen'), Object.assign({ slow: 0.9 }, full)],
        picked: o => [named(o.wrong)],
        model: [full],
      };
    },
    // The blank is hummed, so she has to pick the word that makes sense.
    meaning(npc, cfg) {
      const { x, id } = take('meaning', npc, cfg);
      const p = sentenceParts(x);
      const hum = [{ text: p.before, rate: 0.8 }, { pause: 250 }, { text: 'hmm, hmm', rate: 0.8 }, { pause: 250 }];
      if (p.after.replace(/[.!?\s]/g, '')) hum.push({ text: p.after, rate: 0.8 });
      const ask = line('meaning');
      return {
        id, target: x.w[0], clue: blankHtml(x),
        ask: [{ text: ask }, { pause: 600 }].concat(hum, READY),
        replay: hum,
        options: deal(x.w, shuffle(x.other.slice()).slice(0, cfg.n - 1), ([w, e]) => ({ html: wordCard(w, e), wrong: w, alwaysPictures: true })),
        answer: [{ text: p.full, rate: 0.8 }],
        solved: filledHtml(x),
        // "rock… Hmm, that sounds silly!" and the sentence hummed again.
        teach: o => [named(o.wrong), { pause: 300 }, lead('silly'), { pause: 300 }].concat(hum),
        picked: o => [named(o.wrong)],
        model: [{ text: p.full, rate: 0.8 }],
      };
    },
  });

  Object.assign(builders, {
    // She hears a word and taps its sounds in order: the dialog shows
    // `tiles` (the word's letters, with sh, ck... as one tile, plus a few
    // others) and `slots`, one per tile; each tile is checked as it goes in
    // (spellTap in game.js). `given` blanks are filled in already.
    spell(npc, cfg) {
      const t = take('spell', npc, cfg);
      const own = graphemes(t);
      // Never a letter of the word, also from inside a pair (s or h for
      // ship), one that sounds like one in it, such as c for duck, or that
      // she can't tell from one yet (d for tent).
      const free = l => !own.some(o => o.includes(l) || soundOf(o) === soundOf(l) || sameSound(o, l) || hardPair(o, l));
      const myVowels = own.filter(g => 'aeiou'.includes(g));
      // One other vowel, so she has to listen for the middle sound too: a
      // far one (a, o), a hard one (a, e) at the top tier.
      const vowelOk = (v, out, partner) => !own.includes(v) && (partner || !myVowels.some(o => nearPair(o, v)));
      const vowel = cfg.vowelFoil ? others('aeiou'.split(''), 1, vowelOk, cfg.near && (v => myVowels.some(o => hardPair(o, v)))) : [];
      const extra = others('bcdfghjklmnprstvwz'.split('').filter(free), cfg.extra - vowel.length, (l, out) => !out.some(o => sameSound(o, l)));
      extra.unshift(...vowel);
      const groups = t.syl ? t.syl.map(s => s.length) : [own.length];
      let n = 0;
      const slots = groups.map(g => `<span class="syl">${Array.from({ length: g }, () => `<span class="slot" data-i="${n++}"></span>`).join('')}</span>`).join('');
      return {
        id: t.id, target: t.w,
        word: t.w,
        slots: own,
        given: cfg.firstGiven ? 1 : 0,
        clue: `<span class="clue-pic">${t.e}</span><span class="spell-word">${slots}</span>`,
        // Tapping a tile says its sound.
        tiles: shuffle(own.concat(extra)).map(l => ({ l, sound: sound(l) })),
        ask: [{ text: line('spell') }, { pause: 600 }, voiced(t.w), READY],
        replay: [voiced(t.w)],
        options: [],
        // Sound it out, then say it: "/c/ /a/ /t/… cat!"
        answer: sounds(t).concat({ pause: 250 }, say(`${t.w}!`)),
        solved: `<span class="clue-pic">${t.e}</span><span class="spell-word right">${own.map(l => `<span class="slot full">${l}</span>`).join('')}</span>`,
        // A wrong tile: the word again, slowly. Twice in one slot: the sound it needs.
        teach: () => [lead('listen'), voiced(t.w, 0.8)],
        need: i => [lead('listen'), sound(own[i])],
      };
    },
  });

  // ---- Long vowels (the Monster Village) -------------------------------------
  // How she hears a word: a long one by its sounds (c-A-k), a short one by
  // its letters (c-a-t); c and k alike, a doubled letter as one.
  const heardAs = p => { const s = undoubled(p); return s === 'c' || s === 'ck' ? 'k' : s; };
  const heard = x => (x.long || graphemes(x)).map(heardAs);
  // Two words she hears as the same (road, rode), or that differ only in a
  // sound she can't hear apart yet (peach, beach; tree, three).
  const sameHeard = (a, b) => heard(a).join('-') === heard(b).join('-');
  function hardTwin(a, b) {
    const x = heard(a);
    const y = heard(b);
    if (x.length !== y.length) return false;
    const diff = x.map((s, i) => [s, y[i]]).filter(([p, q]) => p !== q);
    return diff.length === 1 && hardPair(diff[0][0], diff[0][1]);
  }
  // How many of its sounds two words share, in order (boat, goat: 2).
  function shared(a, b) {
    const y = heard(b);
    const row = new Array(y.length + 1).fill(0);
    for (const s of heard(a)) {
      let diag = 0;
      for (let j = 1; j <= y.length; j++) {
        const up = row[j];
        row[j] = s === y[j - 1] ? diag + 1 : Math.max(up, row[j - 1]);
        diag = up;
      }
    }
    return row[y.length];
  }
  // Another first sound, and not one she can't tell from it, and another
  // vowel's name (bone, cake).
  const farLong = (x, t) => {
    const [a, b] = [heard(x)[0], heard(t)[0]];
    return !sameSound(a, b) && !nearPair(a, b) && x.says !== t.says;
  };
  // The word with the letters that make its vowel say its name in colour:
  // the vowel and the magic e (c a k e), or the team (r ai n).
  function marked(x) {
    const hi = s => `<span class="first">${s}</span>`;
    if (x.team.includes('_')) return x.w.replace(/([aeiou])([^aeiou]+)e$/, (m, v, c) => hi(v) + c + hi('e'));
    return x.w.replace(x.team, hi);
  }
  // The other cards of longBlend and longRead: pictures she names for sure,
  // never one she hears as the target or that differs from it only in a
  // sound she can't hear apart yet. `far`: another first sound and another
  // vowel's name. `near`: first one that shares all but one of its sounds,
  // long or short (boat: goat, or bat). Then ones that start with the same
  // sound (bee, bike, boat), then any.
  function similarLong(t, cfg, list) {
    const n = cfg.n - 1;
    const ok = (x, out) => x.w !== t.w && clear(x) && !alike(x, t) && !sameHeard(x, t) && !hardTwin(x, t) &&
      !out.some(o => o.w === x.w || o.e === x.e || alike(o, x) || sameHeard(o, x) || hardTwin(o, x));
    const out = [];
    const add = cands => { for (const x of shuffle(cands.slice())) if (out.length < n && ok(x, out)) out.push(x); };
    if (cfg.near) {
      const cands = list.concat(BANK.CVC(), BANK.BLEND4(), DIGRAPH.map(entry)).filter(x => ok(x, out));
      const best = Math.max(0, ...cands.map(x => shared(x, t)));
      const close = shuffle(cands.filter(x => shared(x, t) === best))[0];
      if (close && best >= heard(t).length - 1) out.push(close);
    }
    if (cfg.far) add(list.filter(x => farLong(x, t)));
    add(list.filter(x => sameSound(heard(x)[0], heard(t)[0])));
    add(list);
    return out;
  }

  Object.assign(builders, {
    // Hear a long vowel word's sounds, the vowel by its letter's name
    // ("/k/ … A … /k/"), and pick its picture.
    longBlend(npc, cfg) {
      const t = take('longBlend', npc, cfg);
      const list = similarLong(t, cfg, BANK[cfg.words]());
      const ask = line('longBlend');
      const slow = nameSounds(t, 450);
      const dot = p => (cfg.mark && /^[A-Z]$/.test(p) ? `<span class="dot name">${p}</span>` : '<span class="dot"></span>');
      return {
        id: t.id, target: t.w,
        // A dot for each sound; with `mark`, the vowel's shows its letter.
        clue: `<span class="clue-sounds">${t.long.map(dot).join('')}</span>`,
        prompt: ask,
        ask: [{ text: ask }, { pause: 500 }].concat(slow, READY),
        replay: slow,
        options: deal(t, list, o => ({ html: picCard(o.w, o.e), wrong: o.w })),
        answer: nameSounded(t),
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${marked(t)}</span>`,
        teach: o => [named(o.wrong), { pause: 300 }, lead('listen')].concat(nameSounds(t, 600)),
        picked: o => [named(o.wrong)],
        model: nameSounded(t),
      };
    },

    // Read a long vowel word and pick its picture; with `mark` the letters
    // that make the vowel say its name are coloured. She reads it herself,
    // so a hint gives that rule and sounds it out without saying it.
    longRead(npc, cfg) {
      const t = take('longRead', npc, cfg);
      const list = similarLong(t, cfg, BANK[cfg.words]());
      const ask = line('read');
      return {
        id: t.id, target: t.w, clue: `<span class="clue-word big">${cfg.mark ? marked(t) : t.w}</span>`,
        ask: [{ text: ask }],
        replay: [{ text: ask }],
        options: deal(t, list, o => ({ html: picCard(o.w, o.e), wrong: o.w })),
        answer: [say(`${t.w}!`)],
        solved: `<span class="clue-word big">${marked(t)}</span>`,
        // "boat… Magic e makes the A say its name! /k/ … A … /k/"
        teach: o => [named(o.wrong), { pause: 300 }, rule(t), { pause: 300 }].concat(nameSounds(t)),
        picked: o => [named(o.wrong)],
        model: nameSounded(t),
      };
    },

    // Hear a long vowel word and find it written: word cards only, so no
    // picture gives it away. At a `twin` tier one card is its short twin
    // (kit for kite), and picking it brings the rule.
    longWord(npc, cfg) {
      const t = take('longWord', npc, cfg);
      const out = cfg.twin ? [{ w: twinOf(t.w), twin: true }] : [];
      const ok = x => x.w !== t.w && !sameHeard(x, t) && !hardTwin(x, t) && (!cfg.far || farLong(x, t)) &&
        !out.some(o => o.w === x.w || sameHeard(o, x) || hardTwin(o, x));
      const add = cands => { for (const x of shuffle(cands)) if (out.length < cfg.n - 1 && ok(x)) out.push(x); };
      add(longWords().filter(x => sameSound(heard(x)[0], heard(t)[0])));
      add(longWords());
      return {
        id: t.id, target: t.w, clue: '',
        ask: [{ text: line('ask') }, { pause: 750 }, voiced(t.w), READY],
        replay: [voiced(t.w)],
        options: deal(t, out, o => ({ html: plainCard(o.w), wrong: o.w, twin: !!o.twin })),
        answer: [say(`${t.w}!`)],
        // "kit… Magic e makes the I say its name! Listen. kite"
        teach: o => [named(o.wrong), { pause: 300 }].concat(o.twin ? [rule(t), { pause: 300 }] : [], lead('listen'), voiced(t.w, 0.85)),
        picked: o => [named(o.wrong)],
        model: nameSounded(t),
      };
    },

    longRhyme: (npc, cfg) => rhymeQuestion('longRhyme', npc, cfg, longRhymes(), RHYME_SETS.filter(r => SHORT[r.v])),
  });

  // Picks a kind of question this person didn't ask last time, at her tier.
  // `force` ({ kind, tier }) is for tests and the village games
  // (js/village-games.js), whose `cfg` changes that tier's settings (more
  // cards); a forced question never moves her tier.
  function make(npc, force) {
    const kinds = QUIZ_TYPES[placeOf(npc)];
    let kind = force && force.kind;
    if (!kind) {
      const choices = kinds.filter(k => k !== npc.lastQuiz);
      kind = pick(choices.length ? choices : kinds);
    }
    npc.lastQuiz = kind;
    const tier = force && force.tier ? { t: force.tier, cfg: Object.assign({}, TIERS[kind][force.tier - 1], force.cfg), counts: false } : tierFor(kind, npc);
    return build(kind, npc, tier);
  }
  function build(kind, npc, tier) {
    const q = builders[kind](npc, tier.cfg);
    // Questions, hints and answers are said plainly, never lifted (js/audio.js).
    for (const p of [].concat(q.ask, q.replay, q.answer)) if (p && typeof p === 'object') p.plain = true;
    if (!q.prompt) q.prompt = (q.ask.find(p => p.text && !p.file && !p.narrator) || { text: '' }).text;
    return Object.assign(q, { kind, tier: tier.t, counts: tier.counts, cap: tier.cap, review: reviewing(kind, npc, tier.cfg), done: false, misses: 0 });
  }
  // A missed question comes back with the same target, at the same tier,
  // with new options in a new order. It is a retry: putting it right
  // doesn't count as solved yet.
  function again(old, npc) {
    want = old.id;
    try {
      const t = Math.min(old.tier || 1, TIERS[old.kind].length);
      const q = build(old.kind, npc, { t, cfg: TIERS[old.kind][t - 1], counts: false });
      return Object.assign(q, { retry: q.id === old.id });
    } finally { want = null; }
  }

  return {
    READY,
    make,
    again,
    record,
    reviewing,
    migrate,
    skill,
    tierMax,
    // A parent sets a tier by hand (parent.js); it doesn't count as a level-up.
    // A change is stamped (`set`, at least one past the last), so it wins
    // over the other tablet's tier when the saves are joined (js/progress.js),
    // and counts as one more answer (`n`): the first release (M1), which
    // keeps the entry with more answers, then keeps it too.
    setTier(kind, t) {
      const k = skill(kind);
      const to = Math.max(1, Math.min(tierMax(kind), t));
      if (to !== k.t) Object.assign(k, { set: Math.max(Date.now(), (Number(k.set) || 0) + 1), n: (k.n | 0) + 1 });
      Object.assign(k, { t: to, w: [], placed: true, easy: false });
    },
    kinds: Object.keys(pools),
    // Every id a kind can ask here, at any tier the parent's settings allow.
    pool: (kind, npc = {}) => (pools[kind] ? [...new Set(TIERS[kind].filter(allowed).flatMap(cfg => pools[kind](npc, cfg).map(x => x.id)))] : []),
    words,
    get recent() { return recent; },
    set recent(saved) { recent = saved && !Array.isArray(saved) && typeof saved === 'object' ? saved : {}; },
  };
})();

// Every question id a kind can ask here. House pools are per letter, so
// pass the house's npc (or { letter: 'C' }); without one it is the town pool.
function reviewPool(kind, npc) { return Quiz.pool(kind, npc || {}); }
// Called from choose() for her first answer to a question.
function reviewRecord(q, right) { Quiz.record(q, right); }
