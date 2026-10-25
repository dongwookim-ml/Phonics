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

const Quiz = (() => {
  const READY = { ready: true };
  let recent = [];

  const allWords = () => LETTERS.flatMap(info => info.words.map(([w, e]) => ({ w, e, info })));
  const infoOf = w => LETTERS.find(l => l.letter === w[0].toUpperCase()) || LETTERS[0];
  const cvc = () => {
    const seen = new Set();
    const list = [];
    for (const fam of WORD_FAMILIES) for (const [w, e] of fam) {
      if (w.length === 3 && 'aeiou'.includes(w[1]) && !'aeiouwy'.includes(w[2]) && PART_SOUNDS[w[2]] && !seen.has(w)) {
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
  const clearPicture = x => !WEAK_PICTURES.has(x.w);

  // Letters she can't tell apart yet, or that say the same sound (HARD_PAIRS),
  // never sit side by side in one question; nor do words that differ only in
  // such letters (pan, pen).
  const pairs = () => HARD_PAIRS.vowels.concat(HARD_PAIRS.consonants, HARD_PAIRS.same);
  const confusable = (x, y) => x !== y && pairs().some(([a, b]) => (a === x && b === y) || (a === y && b === x));
  function nearWords(a, b) {
    if (a.length !== b.length) return false;
    const diff = [...a].map((c, i) => [c, b[i]]).filter(([x, y]) => x !== y);
    return diff.length === 1 && confusable(diff[0][0], diff[0][1]);
  }
  // Adds things from `list` to `chosen`, up to n, skipping any that clash
  // with one already chosen.
  function apart(chosen, list, n, clash) {
    const out = chosen.slice();
    for (const x of list) if (out.length < n && !out.some(y => clash(x, y))) out.push(x);
    return out;
  }
  const pools = {
    word: npc => withId('word', npc.letter ? allWords().filter(x => x.info.letter === npc.letter) : allWords()),
    start: () => withId('start', allWords()),
    // Only the picture is shown, so only pictures she can name for sure.
    findStart: npc => withId('findStart', allWords().filter(x => (!npc.letter || x.info.letter === npc.letter) && clearPicture(x))),
    rhyme: () => withId('rhyme', RHYMES.map(set => ({ set, w: set[0][0] }))),
    family: () => withId('family', famWords()),
    vowel: () => withId('vowel', cvc()),
    ending: () => withId('ending', cvc()),
    read: () => withId('read', famWords().filter(clearPicture)),
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
  // A question that comes back after a miss asks for its own id (`want`).
  let want = null;
  function take(kind, npc = {}) {
    const all = pools[kind](npc);
    const back = want && all.find(x => x.id === want);
    if (back) return back;
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

  // Counts a question once, at her first answer (choose in game.js). A miss
  // stays a miss: the question that comes back after it (q.retry) adds a
  // try but not a right, so it is asked again later.
  function record(q, right) {
    if (!q || !q.id || q.recorded || typeof state === 'undefined') return;
    q.recorded = true;
    if (!state.history) state.history = {};
    const h = state.history[q.id] || (state.history[q.id] = { kind: q.kind, tries: 0, right: 0, wrong: 0, last: 0 });
    h.tries++;
    if (!right) h.wrong++;
    else if (!q.misses && !q.retry) h.right++;
    h.last = Date.now();
  }

  const say = w => ({ text: w, file: rec('words', w), rate: 0.72, narrator: true });
  // The word in a question, in the asker's own voice so the line doesn't
  // switch speakers halfway (recorded for each voice by tools/tts-phrases.js).
  // `slow` plays the recording a little slower, for a hint.
  const voiced = (w, slow) => Object.assign({ text: w, file: rec('words', w), rate: 0.85 }, slow ? { slow } : {});

  // ---- Hints after a miss --------------------------------------------------
  // How a letter's sound is spelled in lines like "C says kuh.".
  const soundOf = l => PART_SOUNDS[l] || (LETTERS.find(x => x.letter === l.toUpperCase()) || {}).sound;
  // A letter's pure sound, said on its own by the narrator: "/c/" is a clip
  // of just that sound (js/audio.js says the spelling above if it has none).
  // `show` is what the dialog prints for it.
  const sound = l => ({ text: `/${l}/`, narrator: true, show: `${l}…` });
  // "M says mmm." in the narrator's voice.
  const says = l => ({ text: `${l.toUpperCase()} says ${soundOf(l.toLowerCase())}.`, narrator: true });
  // The word she picked, said back.
  const named = w => Object.assign(say(w), { show: `${w}…` });
  const lead = kind => ({ text: line(kind) });
  // Sounds first, then the word: "/c/ /a/ /t/… cat!" for a word whose every
  // letter says its own sound (no sh, oo, silent e, r after a vowel or soft
  // c); other words are just said.
  const plain = w => /^[a-z]{3,5}$/.test(w) && (w.match(/[aeiou]/g) || []).length === 1 &&
    !/sh|ch|th|ck|ng|ll|ss|gh|wh|ph|kn|wr|qu|w[ao]|[aoe]w|oo|ee|ea|oa|ai|[aeiou]r|[aeiouwy]$|c[eiy]|g[eiy]|olt$|[hmp]ost$|old$|ind$|ild$/.test(w) &&
    [...w].every(soundOf);
  const sounds = w => [...w].flatMap(l => [sound(l), { pause: 160 }]);
  const sounded = w => (plain(w) ? sounds(w).concat({ pause: 250 }) : []).concat(say(`${w}!`));
  // Every word in the content with its picture, to show what a wrong letter
  // spells ("c u t" is cut ✂️).
  let pictures = null;
  const pictureOf = w => {
    if (!pictures) {
      pictures = {};
      const add = ([x, e]) => { if (!pictures[x]) pictures[x] = e; };
      LETTERS.forEach(l => l.words.forEach(add));
      WORD_FAMILIES.forEach(f => f.forEach(add));
      RHYMES.forEach(s => s.forEach(add));
      SENTENCES.forEach(x => { add(x.w); x.other.forEach(add); });
    }
    return pictures[w];
  };
  // What a letter picked for a blank spells: a real word is said and shown
  // on its card, otherwise the letter's sound is said.
  function filledIn(t, x, at) {
    const w = t.w.slice(0, at) + x + t.w.slice(at + 1);
    const e = pictureOf(w);
    return e ? { w, e, parts: [named(w)], html: `<span class="also">${e} ${w}</span>` } : { w, parts: [says(x)], html: '' };
  }
  const firstBig = w => `<span class="first">${w[0]}</span>${w.slice(1)}`;
  const long = w => (w.length > 6 ? ' long' : '');
  const wordCard = (w, e) => `<span class="pic">${e}</span><span class="w${long(w)}">${firstBig(w)}</span>`;
  const picCard = (w, e) => `<span class="bigpic">${e}</span><span class="w hide">${w}</span>`;
  const letterCard = l => `<span class="letter">${l}</span>`;

  // `n` words for the other cards, each with a different first letter that
  // doesn't sound like another card's. `picture`: only clear pictures.
  function distractors(target, n, picture) {
    const others = shuffle(allWords().filter(x => x.info !== target.info && (!picture || clearPicture(x))));
    return apart([target], others, n + 1, (x, y) => x.info === y.info || confusable(x.w[0], y.w[0])).slice(1);
  }

  // Hints shared by the kinds where she hears a word and picks it: what she
  // picked, then the word again ("cap… Listen. cat").
  const hearAgain = t => ({
    teach: o => [named(o.wrong), { pause: 300 }, lead('listen'), voiced(t.w, 0.85)],
    picked: o => [named(o.wrong)],
    model: sounded(t.w),
  });

  const builders = {
    word(npc) {
      const t = take('word', npc);
      const opts = shuffle([t, ...distractors(t, 2)]);
      return Object.assign({
        id: t.id, target: t.w, clue: '',
        ask: [{ text: line('ask') }, { pause: 750 }, voiced(t.w), READY],
        replay: [voiced(t.w)],
        options: opts.map(o => ({ html: wordCard(o.w, o.e), right: o === t, wrong: o.w, words: true })),
        answer: [say(`${t.w}!`)],
      }, hearAgain(t));
    },

    start(npc) {
      const t = take('start', npc);
      const low = l => l.letter.toLowerCase();
      const letters = shuffle(apart([t.info], shuffle(LETTERS.filter(l => l !== t.info)), 3, (x, y) => confusable(low(x), low(y))));
      const L = t.info.letter;
      return {
        id: t.id, target: t.w, clue: `<span class="clue-pic">${t.e}</span>`,
        ask: [voiced(t.w), { pause: 600 }, { text: line('firstSound') }, READY],
        replay: [voiced(t.w)],
        options: letters.map(l => ({ html: letterCard(l.letter + l.letter.toLowerCase()), right: l === t.info, wrong: l.letter })),
        answer: [{ text: `${t.w} starts with ${L}.`, narrator: true }],
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${firstBig(t.w)}</span>`,
        // "M says mmm. Listen. cat"
        teach: o => [says(o.wrong), { pause: 400 }, lead('listen'), voiced(t.w, 0.85)],
        picked: o => [says(o.wrong)],
        // "/k/… cat starts with C."
        model: [sound(L.toLowerCase()), { pause: 300 }, { text: `${t.w} starts with ${L}.`, narrator: true }],
      };
    },

    findStart(npc) {
      const t = take('findStart', npc);
      const info = t.info;
      const opts = shuffle([t, ...distractors(t, 2, true)]);
      // One sentence in the asker's voice, the letter said by its name.
      const ask = { text: `${line('findStart')} ${info.letter}?` };
      const startsWith = o => ({ text: `${o.w} starts with ${o.info.letter}.`, narrator: true });
      return {
        id: t.id, target: t.w, clue: `<span class="clue-letter">${info.letter}${info.letter.toLowerCase()}</span>`,
        ask: [ask, READY],
        replay: [ask],
        options: opts.map(o => ({ html: picCard(o.w, o.e), right: o === t, wrong: o.w, item: o })),
        answer: [say(`${t.w}!`)],
        // "dog starts with D. C says kuh."
        teach: o => [startsWith(o.item), { pause: 400 }, says(info.letter)],
        picked: o => [startsWith(o.item)],
        model: [sound(info.letter.toLowerCase()), { pause: 300 }, startsWith(t)],
      };
    },

    rhyme() {
      const { set, id } = take('rhyme');
      const [base, ans] = shuffle(set.slice()).map(([w, e]) => ({ w, e }));
      const others = shuffle(RHYMES.filter(s => s !== set)).slice(0, 2).map(s => { const [w, e] = pick(s); return { w, e }; });
      const opts = shuffle([ans, ...others]);
      const ask = line('rhyme');
      return {
        id, target: set[0][0], clue: `<span class="clue-pic">${base.e}</span><span class="clue-word">${base.w}</span>`,
        prompt: `${ask} "${base.w}"?`,
        ask: [{ text: ask }, { pause: 300 }, voiced(base.w), READY],
        replay: [voiced(base.w)],
        options: opts.map(o => ({ html: wordCard(o.w, o.e), right: o === ans, wrong: o.w, alwaysPictures: true })),
        answer: [{ text: `${base.w}, ${ans.w}!`, narrator: true }],
        // "dog… Listen to the end. cat"
        teach: o => [named(o.wrong), { pause: 300 }, lead('rhymeEnd'), voiced(base.w, 0.85)],
        picked: o => [named(o.wrong)],
        model: [{ text: `${base.w}, ${ans.w}!`, narrator: true }],
      };
    },

    family() {
      const t = take('family');
      const others = shuffle(t.fam.filter(([w]) => w !== t.w)).map(([w, e]) => ({ w, e }));
      const four = shuffle(apart([t], others, 4, (x, y) => nearWords(x.w, y.w)));
      return Object.assign({
        id: t.id, target: t.w, clue: '',
        ask: [{ text: line('ask2') }, { pause: 750 }, voiced(t.w), READY],
        replay: [voiced(t.w)],
        options: four.map(o => ({ html: wordCard(o.w, o.e), right: o === t, wrong: o.w, words: true })),
        answer: [say(`${t.w}!`)],
      }, hearAgain(t));
    },

    vowel() {
      const t = take('vowel');
      const v = t.w[1];
      const vowels = shuffle(apart([v], shuffle('aeiou'.split('')), 3, (x, y) => x === y || confusable(x, y)));
      return Object.assign(blankQuestion(t, 1, vowels), {
        clue: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w[0]}<span class="blank">?</span>${t.w[2]}</span>`,
        // The word first, then the question about it.
        ask: [voiced(t.w), { pause: 600 }, { text: line('vowel') }, READY],
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w[0]}<span class="first">${v}</span>${t.w[2]}</span>`,
      });
    },

    ending() {
      const t = take('ending');
      const end = t.w[2];
      const ends = shuffle(apart([end], shuffle('tgnpdbm'.split('')), 3, (x, y) => x === y || confusable(x, y)));
      return Object.assign(blankQuestion(t, 2, ends), {
        clue: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w.slice(0, 2)}<span class="blank">?</span></span>`,
        // The word first, then the question about it.
        ask: [voiced(t.w), { pause: 600 }, { text: line('ending') }, READY],
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w.slice(0, 2)}<span class="first">${end}</span></span>`,
      });
    },

    read() {
      const t = take('read');
      // Pictures from its family, or from any family when it has too few clear ones.
      const own = t.fam.filter(([w]) => w !== t.w).map(([w, e]) => ({ w, e })).filter(clearPicture);
      const more = own.length >= 2 ? [] : famWords().filter(x => x.w !== t.w && x.fam !== t.fam && clearPicture(x));
      const three = shuffle(apart([t], shuffle(own).concat(shuffle(more)), 3, (x, y) => x.w === y.w || x.e === y.e || nearWords(x.w, y.w)));
      const ask = line('read');
      // She reads it herself, so the hint sounds it out without saying it.
      const hint = plain(t.w) ? sounds(t.w) : [sound(t.w[0])];
      return {
        id: t.id, target: t.w, clue: `<span class="clue-word big">${t.w}</span>`,
        ask: [{ text: ask }],
        replay: [{ text: ask }],
        options: three.map(o => ({ html: picCard(o.w, o.e), right: o === t, wrong: o.w })),
        answer: [say(`${t.w}!`)],
        teach: o => [named(o.wrong), { pause: 300 }, lead('listen')].concat(hint),
        picked: o => [named(o.wrong)],
        model: sounded(t.w),
      };
    },
  };

  // Middle and last letter questions: the letter at `at` is missing. A
  // wrong letter that spells another word shows and says it ("cut ✂️").
  function blankQuestion(t, at, letters) {
    const right = t.w[at];
    const made = {};
    for (const x of letters) if (x !== right) made[x] = filledIn(t, x, at);
    return {
      id: t.id, target: t.w,
      replay: [voiced(t.w)],
      options: letters.map(x => ({ html: letterCard(x) + (made[x] ? made[x].html : ''), right: x === right, wrong: x.toUpperCase(), letter: x })),
      answer: [say(`${t.w}!`)],
      teach: o => made[o.letter].parts.concat({ pause: 300 }, lead('listen'), voiced(t.w, 0.8)),
      picked: o => made[o.letter].parts,
      model: sounded(t.w),
    };
  }

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
        ask: [{ text: line('sentence') }, { pause: 700 }, full, READY],
        replay: [full],
        options: opts.map(w => ({ html: plainCard(w), right: w === x.w[0], wrong: w })),
        answer: [full],
        solved: filledHtml(x),
        teach: o => [named(o.wrong), { pause: 300 }, lead('listen'), Object.assign({ slow: 0.9 }, full)],
        picked: o => [named(o.wrong)],
        model: [full],
      };
    },
    // The blank is hummed, so she has to pick the word that makes sense.
    meaning() {
      const { x, id } = take('meaning');
      const p = sentenceParts(x);
      const hum = [{ text: p.before, rate: 0.8 }, { pause: 250 }, { text: 'hmm, hmm', rate: 0.8 }, { pause: 250 }];
      if (p.after.replace(/[.!?\s]/g, '')) hum.push({ text: p.after, rate: 0.8 });
      const opts = shuffle([x.w, ...x.other]);
      const ask = line('meaning');
      return {
        id, target: x.w[0], clue: blankHtml(x),
        ask: [{ text: ask }, { pause: 600 }].concat(hum, READY),
        replay: hum,
        options: opts.map(([w, e]) => ({ html: wordCard(w, e), right: w === x.w[0], wrong: w, alwaysPictures: true })),
        answer: [{ text: p.full, rate: 0.8 }],
        solved: filledHtml(x),
        // "rock… Hmm, that sounds silly!" and the sentence hummed again.
        teach: o => [named(o.wrong), { pause: 300 }, lead('silly'), { pause: 300 }].concat(hum),
        picked: o => [named(o.wrong)],
        model: [{ text: p.full, rate: 0.8 }],
      };
    },
  });

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
    // `tiles` (the word's letters plus a few others) and `slots`, one per
    // letter; each tile is checked as it goes in (spellTap in game.js).
    spell() {
      const t = take('spell');
      const own = [...t.w];
      // Never a letter that sounds like one in the word, such as c for milk,
      // or that she can't tell from one yet (d for tent).
      const free = l => !own.some(o => soundOf(o) === soundOf(l) || confusable(o, l));
      const vowels = 'aeiou'.split('').filter(free);
      const others = shuffle('bcdfghlmnprst'.split('').filter(free));
      // One other vowel, so she has to listen for the middle sound too.
      const extra = [pick(vowels)].concat(others).slice(0, Math.max(SPELL_TILES, own.length + 3) - own.length);
      return {
        id: t.id, target: t.w,
        word: t.w,
        slots: own,
        clue: `<span class="clue-pic">${t.e}</span><span class="spell-word">${own.map(() => '<span class="slot"></span>').join('')}</span>`,
        // Tapping a tile says its sound.
        tiles: shuffle(own.concat(extra)).map(l => ({ l, sound: sound(l) })),
        ask: [{ text: line('spell') }, { pause: 600 }, voiced(t.w), READY],
        replay: [voiced(t.w)],
        options: [],
        // Sound it out, then say it: "/c/ /a/ /t/… cat!"
        answer: sounds(t.w).concat({ pause: 250 }, say(`${t.w}!`)),
        solved: `<span class="clue-pic">${t.e}</span><span class="spell-word right">${own.map(l => `<span class="slot full">${l}</span>`).join('')}</span>`,
        // A wrong tile: the word again, slowly. Twice in one slot: the sound it needs.
        teach: () => [lead('listen'), voiced(t.w, 0.8)],
        need: i => [lead('listen'), sound(own[i])],
      };
    },
  });

  // Picks a kind of question this person didn't ask last time.
  function make(npc) {
    const kinds = QUIZ_TYPES[npc.level === 5 ? 'fairy' : npc.level === 4 ? 'dungeon' : npc.level === 3 ? 'unicorn' : npc.level === 2 ? 'forest' : npc.letter ? 'house' : 'town'];
    const choices = kinds.filter(k => k !== npc.lastQuiz);
    const kind = pick(choices.length ? choices : kinds);
    npc.lastQuiz = kind;
    return build(kind, npc);
  }
  function build(kind, npc) {
    const review = reviewing(kind, npc);
    const q = builders[kind](npc);
    if (!q.prompt) q.prompt = q.ask.find(p => p.text && !p.file).text;
    remember(q.target);
    return Object.assign(q, { kind, review, done: false, misses: 0 });
  }
  // A missed question comes back with the same target and new options in a
  // new order. It is a retry: putting it right doesn't count as solved yet.
  function again(old, npc) {
    want = old.id;
    try {
      const q = build(old.kind, npc);
      return Object.assign(q, { retry: q.id === old.id });
    } finally { want = null; }
  }

  return {
    READY,
    make,
    again,
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
