// Question builders. Each returns everything the dialog needs:
//   clue     HTML shown above the choices (picture, letter or word)
//   ask      speech parts that pose the question
//   prompt   the question as text (defaults to its spoken line)
//   replay   speech parts for the 🔊 button
//   options  [{ html, right, wrong }] where `wrong` is what is said back
//            when that option is picked by mistake
//   answer   speech parts said after the praise
//   solved   optional clue HTML once it is answered

const Quiz = (() => {
  let recent = [];

  const allWords = () => LETTERS.flatMap(info => info.words.map(([w, e]) => ({ w, e, info })));
  const infoOf = w => LETTERS.find(l => l.letter === w[0].toUpperCase()) || LETTERS[0];
  const cvc = () => {
    const seen = new Set();
    const list = [];
    for (const fam of WORD_FAMILIES) for (const [w, e] of fam) {
      if (w.length === 3 && 'aeiou'.includes(w[1]) && !'aeiou'.includes(w[2]) && PART_SOUNDS[w[2]] && !seen.has(w)) {
        seen.add(w);
        list.push({ w, e });
      }
    }
    return list;
  };

  // Prefer words she hasn't seen lately; fall back to everything.
  function fresh(list, key = x => x.w) {
    const f = list.filter(x => !recent.includes(key(x)));
    return f.length ? f : list;
  }
  function remember(word) {
    recent = recent.filter(w => w !== word).concat(word).slice(-RECENT_WORDS);
  }

  // Every question has a stable id ("rhyme:cat", "sentence:The {} says moo.")
  // and each kind has a pool of all the ids it can ask, so the game can tell
  // which ones she has already got right (state.history, see record()).
  const famWords = () => {
    const seen = new Set();
    const list = [];
    for (const fam of WORD_FAMILIES) for (const [w, e] of fam) if (!seen.has(w)) { seen.add(w); list.push({ w, e, fam }); }
    return list;
  };
  const withId = (kind, list, key = x => x.w) => list.map(x => Object.assign({}, x, { id: `${kind}:${key(x)}` }));
  const pools = {
    word: npc => withId('word', npc.letter ? allWords().filter(x => x.info.letter === npc.letter) : allWords()),
    start: () => withId('start', allWords()),
    findStart: npc => withId('findStart', npc.letter ? allWords().filter(x => x.info.letter === npc.letter) : allWords()),
    rhyme: () => withId('rhyme', RHYMES.map(set => ({ set, w: set[0][0] }))),
    family: () => withId('family', famWords()),
    vowel: () => withId('vowel', cvc()),
    ending: () => withId('ending', cvc()),
    read: () => withId('read', famWords()),
    sentence: () => withId('sentence', SENTENCES.map(x => ({ x, w: x.w[0] })), y => y.x.s),
    meaning: () => withId('meaning', SENTENCES.map(x => ({ x, w: x.w[0] })), y => y.x.s),
    spell: () => withId('spell', spellWords()),
  };
  const history = () => (typeof state !== 'undefined' && state.history) || {};
  const solved = id => (history()[id] || {}).right > 0;
  // Review mode: every question of this kind (here) has been answered right.
  const reviewing = (kind, npc) => !!pools[kind] && pools[kind](npc).every(x => solved(x.id));

  // The next question of a kind: one she hasn't got right yet if there is
  // any, otherwise a review that favours the ones she missed and the ones
  // she hasn't seen for a while. Recent words still stay out when they can.
  function take(kind, npc = {}) {
    const all = pools[kind](npc);
    const open = all.filter(x => !solved(x.id));
    if (open.length) return pick(fresh(open));
    const now = Date.now();
    const list = fresh(all);
    const weights = list.map(x => {
      const h = history()[x.id];
      const days = Math.min(14, (now - (h.last || 0)) / 864e5);
      return (1 + 12 * h.wrong / Math.max(1, h.right)) * (1 + days / 3);
    });
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) if ((r -= weights[i]) < 0) return list[i];
    return list[list.length - 1];
  }

  // Counts one answer. A miss stays a miss: putting it right on a retry
  // adds a try but not a right, so the question comes back later.
  function record(q, right) {
    if (!q || !q.id || typeof state === 'undefined') return;
    if (!state.history) state.history = {};
    const h = state.history[q.id] || (state.history[q.id] = { kind: q.kind, tries: 0, right: 0, wrong: 0, last: 0 });
    h.tries++;
    if (!right) h.wrong++;
    else if (!q.misses) h.right++;
    h.last = Date.now();
  }

  const say = w => ({ text: w, file: rec('words', w), rate: 0.72, narrator: true });
  // The word in a question, in the asker's own voice so the line doesn't
  // switch speakers halfway (recorded for each voice by tools/tts-phrases.js).
  const voiced = w => ({ text: w, file: rec('words', w), rate: 0.85 });
  const firstBig = w => `<span class="first">${w[0]}</span>${w.slice(1)}`;
  const long = w => (w.length > 6 ? ' long' : '');
  const wordCard = (w, e) => `<span class="pic">${e}</span><span class="w${long(w)}">${firstBig(w)}</span>`;
  const picCard = (w, e) => `<span class="bigpic">${e}</span><span class="w hide">${w}</span>`;
  const letterCard = l => `<span class="letter">${l}</span>`;

  // Three or four words with different first letters, one of them `target`.
  function distractors(target, n) {
    const others = shuffle(allWords().filter(x => x.info !== target.info));
    const out = [];
    for (const x of others) {
      if (out.length >= n) break;
      if (!out.some(o => o.info === x.info)) out.push(x);
    }
    return out;
  }

  const builders = {
    word(npc) {
      const t = take('word', npc);
      const opts = shuffle([t, ...distractors(t, 2)]);
      return {
        id: t.id, target: t.w, clue: '',
        ask: [{ text: line('ask') }, { pause: 750 }, voiced(t.w)],
        replay: [voiced(t.w)],
        options: opts.map(o => ({ html: wordCard(o.w, o.e), right: o === t, wrong: o.w, words: true })),
        answer: [say(`${t.w}!`)],
      };
    },

    start(npc) {
      const t = take('start', npc);
      const letters = shuffle([t.info, ...shuffle(LETTERS.filter(l => l !== t.info)).slice(0, 2)]);
      return {
        id: t.id, target: t.w, clue: `<span class="clue-pic">${t.e}</span>`,
        ask: [voiced(t.w), { pause: 600 }, { text: line('firstSound') }],
        replay: [voiced(t.w)],
        options: letters.map(l => ({ html: letterCard(l.letter + l.letter.toLowerCase()), right: l === t.info, wrong: l.letter })),
        answer: [{ text: `${t.w} starts with ${t.info.letter}.`, narrator: true }],
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${firstBig(t.w)}</span>`,
      };
    },

    findStart(npc) {
      const t = take('findStart', npc);
      const info = t.info;
      const opts = shuffle([t, ...distractors(t, 2)]);
      // One sentence in the asker's voice, the letter said by its name.
      const ask = { text: `${line('findStart')} ${info.letter}?` };
      return {
        id: t.id, target: t.w, clue: `<span class="clue-letter">${info.letter}${info.letter.toLowerCase()}</span>`,
        ask: [ask],
        replay: [ask],
        options: opts.map(o => ({ html: picCard(o.w, o.e), right: o === t, wrong: o.w })),
        answer: [say(`${t.w}!`)],
      };
    },

    rhyme() {
      const { set, id } = take('rhyme');
      const [base, ans] = shuffle(set.slice()).map(([w, e]) => ({ w, e }));
      const others = shuffle(RHYMES.filter(s => s !== set)).slice(0, 2).map(s => { const [w, e] = pick(s); return { w, e }; });
      const opts = shuffle([ans, ...others]);
      const lead = line('rhyme');
      return {
        id, target: set[0][0], clue: `<span class="clue-pic">${base.e}</span><span class="clue-word">${base.w}</span>`,
        prompt: `${lead} "${base.w}"?`,
        ask: [{ text: lead }, { pause: 300 }, voiced(base.w)],
        replay: [voiced(base.w)],
        options: opts.map(o => ({ html: wordCard(o.w, o.e), right: o === ans, wrong: o.w, alwaysPictures: true })),
        answer: [{ text: `${base.w}, ${ans.w}!`, narrator: true }],
      };
    },

    family() {
      const t = take('family');
      const others = shuffle(t.fam.filter(([w]) => w !== t.w)).slice(0, 3).map(([w, e]) => ({ w, e }));
      const four = shuffle([t, ...others]);
      return {
        id: t.id, target: t.w, clue: '',
        ask: [{ text: line('ask2') }, { pause: 750 }, voiced(t.w)],
        replay: [voiced(t.w)],
        options: four.map(o => ({ html: wordCard(o.w, o.e), right: o === t, wrong: o.w, words: true })),
        answer: [say(`${t.w}!`)],
      };
    },

    vowel() {
      const t = take('vowel');
      const v = t.w[1];
      const vowels = shuffle([v, ...shuffle('aeiou'.split('').filter(x => x !== v)).slice(0, 2)]);
      return {
        id: t.id, target: t.w,
        clue: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w[0]}<span class="blank">?</span>${t.w[2]}</span>`,
        ask: [{ text: line('vowel') }, { pause: 600 }, voiced(t.w)],
        replay: [voiced(t.w)],
        options: vowels.map(x => ({ html: letterCard(x), right: x === v, wrong: x.toUpperCase() })),
        answer: [say(`${t.w}!`)],
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w[0]}<span class="first">${v}</span>${t.w[2]}</span>`,
      };
    },

    ending() {
      const t = take('ending');
      const end = t.w[2];
      const ends = shuffle([end, ...shuffle('tgnpdbm'.split('').filter(x => x !== end)).slice(0, 2)]);
      return {
        id: t.id, target: t.w,
        clue: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w.slice(0, 2)}<span class="blank">?</span></span>`,
        ask: [{ text: line('ending') }, { pause: 600 }, voiced(t.w)],
        replay: [voiced(t.w)],
        options: ends.map(x => ({ html: letterCard(x), right: x === end, wrong: x.toUpperCase() })),
        answer: [say(`${t.w}!`)],
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w.slice(0, 2)}<span class="first">${end}</span></span>`,
      };
    },

    read() {
      const t = take('read');
      const three = shuffle([t, ...shuffle(t.fam.filter(([w]) => w !== t.w)).slice(0, 2).map(([w, e]) => ({ w, e }))]);
      const lead = line('read');
      return {
        id: t.id, target: t.w, clue: `<span class="clue-word big">${t.w}</span>`,
        ask: [{ text: lead }],
        replay: [{ text: lead }],
        options: three.map(o => ({ html: picCard(o.w, o.e), right: o === t, wrong: o.w })),
        answer: [say(`${t.w}!`)],
      };
    },
  };

  // Sentences: "The {} is hot." with the blank shown as a line.
  function sentenceParts(x) {
    const [before, after] = x.s.split('{}');
    return { before, after, full: before + x.w[0] + after };
  }
  const blankHtml = x => { const p = sentenceParts(x); return `<span class="clue-sentence">${p.before}<span class="blank wide">?</span>${p.after}</span>`; };
  const filledHtml = x => { const p = sentenceParts(x); return `<span class="clue-sentence">${p.before}<span class="first">${x.w[0]}</span>${p.after}</span>`; };
  const plainCard = w => `<span class="w${long(w)}">${w}</span>`;
  Object.assign(builders, {
    // She hears the whole sentence and picks the word she heard from
    // words that sound alike.
    sentence() {
      const { x, id } = take('sentence');
      const full = { text: sentenceParts(x).full, rate: 0.8 };
      const opts = shuffle([x.w[0], ...x.alike]);
      return {
        id, target: x.w[0], clue: blankHtml(x),
        ask: [{ text: line('sentence') }, { pause: 700 }, full],
        replay: [full],
        options: opts.map(w => ({ html: plainCard(w), right: w === x.w[0], wrong: w })),
        answer: [full],
        solved: filledHtml(x),
      };
    },
    // The blank is hummed, so she has to pick the word that makes sense.
    meaning() {
      const { x, id } = take('meaning');
      const p = sentenceParts(x);
      const hum = [{ text: p.before, rate: 0.8 }, { pause: 250 }, { text: 'hmm, hmm', rate: 0.8 }, { pause: 250 }];
      if (p.after.replace(/[.!?\s]/g, '')) hum.push({ text: p.after, rate: 0.8 });
      const opts = shuffle([x.w, ...x.other]);
      const lead = line('meaning');
      return {
        id, target: x.w[0], clue: blankHtml(x),
        ask: [{ text: lead }, { pause: 600 }].concat(hum),
        replay: hum,
        options: opts.map(([w, e]) => ({ html: wordCard(w, e), right: w === x.w[0], wrong: w, alwaysPictures: true })),
        answer: [{ text: p.full, rate: 0.8 }],
        solved: filledHtml(x),
      };
    },
  });

  // Spelling: letters whose sound the narrator can say on its own.
  const soundOf = l => PART_SOUNDS[l] || (LETTERS.find(x => x.letter === l.toUpperCase()) || {}).sound;
  // Three and four letter words where every letter says its own sound:
  // no digraphs (sh, ck, oo), no silent e and no r after a vowel.
  const spellWords = () => {
    const seen = new Set();
    const list = [];
    for (const [w, e] of allWords().map(x => [x.w, x.e]).concat(...WORD_FAMILIES)) {
      if (seen.has(w) || w.length < 3 || w.length > 4 || !/^[a-z]+$/.test(w)) continue;
      if (/sh|ch|th|ck|ng|ll|ss|oo|ee|ea|oa|ai|[aeiou]r|[aeiouwy]$|[wyjqvz]/.test(w) || (w.match(/[aeiou]/g) || []).length !== 1) continue;
      if (![...w].every(soundOf)) continue;
      seen.add(w);
      list.push({ w, e });
    }
    return list;
  };
  Object.assign(builders, {
    // She hears a word and taps its letters in order. The dialog shows
    // `tiles` (the word's letters plus a few others) and fills the blanks.
    spell() {
      const t = take('spell');
      const own = [...t.w];
      // Never a letter that sounds like one in the word, such as c for milk.
      const free = l => !own.some(o => soundOf(o) === soundOf(l));
      const vowels = 'aeiou'.split('').filter(free);
      const others = shuffle('bcdfghlmnprst'.split('').filter(free));
      // One other vowel, so she has to listen for the middle sound too.
      const extra = [pick(vowels)].concat(others).slice(0, Math.max(SPELL_TILES, own.length + 3) - own.length);
      const names = own.map(l => ({ text: l.toUpperCase(), narrator: true, rate: 0.8 }));
      return {
        id: t.id, target: t.w,
        word: t.w,
        clue: `<span class="clue-pic">${t.e}</span><span class="spell-word">${own.map(() => '<span class="slot"></span>').join('')}</span>`,
        tiles: shuffle(own.concat(extra)).map(l => ({ l, sound: l.toUpperCase() })), // tapping a tile says its name
        ask: [{ text: line('spell') }, { pause: 600 }, voiced(t.w)],
        replay: [voiced(t.w)],
        // Filled in when the last blank is filled (see checkSpell in game.js).
        options: [],
        // Spell it out, then say it: "C, A, T... cat!"
        answer: names.flatMap(s => [s, { pause: 120 }]).concat({ pause: 250 }, say(`${t.w}!`)),
        solved: `<span class="clue-pic">${t.e}</span><span class="spell-word right">${own.map(l => `<span class="slot full">${l}</span>`).join('')}</span>`,
        isWord: w => w !== t.w && allWords().concat(WORD_FAMILIES.flat().map(([x]) => ({ w: x }))).some(x => x.w === w),
      };
    },
  });

  // Picks a kind of question this person didn't ask last time.
  function make(npc) {
    const kinds = QUIZ_TYPES[npc.level === 5 ? 'fairy' : npc.level === 4 ? 'dungeon' : npc.level === 3 ? 'unicorn' : npc.level === 2 ? 'forest' : npc.letter ? 'house' : 'town'];
    const choices = kinds.filter(k => k !== npc.lastQuiz);
    const kind = pick(choices.length ? choices : kinds);
    npc.lastQuiz = kind;
    const review = reviewing(kind, npc);
    const q = builders[kind](npc);
    if (!q.prompt) q.prompt = q.ask.find(p => p.text && !p.file).text;
    remember(q.target);
    return Object.assign(q, { kind, review, done: false, misses: 0 });
  }

  return {
    make,
    record,
    reviewing,
    kinds: Object.keys(pools),
    pool: (kind, npc = {}) => (pools[kind] ? pools[kind](npc).map(x => x.id) : []),
    get recent() { return recent; },
    set recent(list) { recent = Array.isArray(list) ? list.slice(-RECENT_WORDS) : []; },
  };
})();

// Every question id a kind can ask here. House pools are per letter, so
// pass the house's npc (or { letter: 'C' }); without one it is the town pool.
function reviewPool(kind, npc) { return Quiz.pool(kind, npc || {}); }
// Called from choose() for every answer.
function reviewRecord(q, right) { Quiz.record(q, right); }
