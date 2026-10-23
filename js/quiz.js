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

  const say = w => ({ text: w, file: rec('words', w), rate: 0.72, narrator: true });
  const firstBig = w => `<span class="first">${w[0]}</span>${w.slice(1)}`;
  const wordCard = (w, e) => `<span class="pic">${e}</span><span class="w">${firstBig(w)}</span>`;
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
      const pool = npc.letter ? allWords().filter(x => x.info.letter === npc.letter) : allWords();
      const t = pick(fresh(pool));
      const opts = shuffle([t, ...distractors(t, 2)]);
      return {
        target: t.w, clue: '',
        ask: [{ text: line('ask') }, { pause: 750 }, say(t.w)],
        replay: [say(t.w)],
        options: opts.map(o => ({ html: wordCard(o.w, o.e), right: o === t, wrong: o.w, words: true })),
        answer: [say(`${t.w}!`)],
      };
    },

    start(npc) {
      const t = pick(fresh(allWords()));
      const letters = shuffle([t.info, ...shuffle(LETTERS.filter(l => l !== t.info)).slice(0, 2)]);
      return {
        target: t.w, clue: `<span class="clue-pic">${t.e}</span>`,
        ask: [say(t.w), { pause: 600 }, { text: line('firstSound') }],
        replay: [say(t.w)],
        options: letters.map(l => ({ html: letterCard(l.letter + l.letter.toLowerCase()), right: l === t.info, wrong: l.sound })),
        answer: [{ text: `${t.w} starts with`, narrator: true }, letterSound(t.info)],
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${firstBig(t.w)}</span>`,
      };
    },

    findStart(npc) {
      const info = LETTERS.find(l => l.letter === npc.letter) || pick(LETTERS);
      const pool = allWords().filter(x => x.info === info);
      const t = pick(fresh(pool));
      const opts = shuffle([t, ...distractors(t, 2)]);
      const lead = line('findStart');
      return {
        target: t.w, clue: `<span class="clue-letter">${info.letter}${info.letter.toLowerCase()}</span>`,
        prompt: `${lead} ${info.letter}?`,
        ask: [{ text: lead }, { pause: 300 }, letterSound(info)],
        replay: [letterSound(info)],
        options: opts.map(o => ({ html: picCard(o.w, o.e), right: o === t, wrong: o.w })),
        answer: [say(`${t.w}!`)],
      };
    },

    rhyme() {
      const set = pick(fresh(RHYMES, s => s[0][0]));
      const [base, ans] = shuffle(set.slice()).map(([w, e]) => ({ w, e }));
      const others = shuffle(RHYMES.filter(s => s !== set)).slice(0, 2).map(s => { const [w, e] = pick(s); return { w, e }; });
      const opts = shuffle([ans, ...others]);
      const lead = line('rhyme');
      return {
        target: set[0][0], clue: `<span class="clue-pic">${base.e}</span><span class="clue-word">${base.w}</span>`,
        prompt: `${lead} "${base.w}"?`,
        ask: [{ text: lead }, { pause: 300 }, say(base.w)],
        replay: [say(base.w)],
        options: opts.map(o => ({ html: wordCard(o.w, o.e), right: o === ans, wrong: o.w, alwaysPictures: true })),
        answer: [{ text: `${base.w}, ${ans.w}!`, narrator: true }],
      };
    },

    family() {
      const fam = pick(fresh(WORD_FAMILIES, f => f[0][0]));
      const four = shuffle(fam.slice()).slice(0, 4).map(([w, e]) => ({ w, e }));
      const t = pick(fresh(four));
      return {
        target: t.w, clue: '',
        ask: [{ text: line('ask2') }, { pause: 750 }, say(t.w)],
        replay: [say(t.w)],
        options: four.map(o => ({ html: wordCard(o.w, o.e), right: o === t, wrong: o.w, words: true })),
        answer: [say(`${t.w}!`)],
      };
    },

    vowel() {
      const t = pick(fresh(cvc()));
      const v = t.w[1];
      const vowels = shuffle([v, ...shuffle('aeiou'.split('').filter(x => x !== v)).slice(0, 2)]);
      return {
        target: t.w,
        clue: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w[0]}<span class="blank">?</span>${t.w[2]}</span>`,
        ask: [{ text: line('vowel') }, { pause: 600 }, say(t.w)],
        replay: [say(t.w)],
        options: vowels.map(x => ({ html: letterCard(x), right: x === v, wrong: PART_SOUNDS[x] })),
        answer: [say(`${t.w}!`)],
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w[0]}<span class="first">${v}</span>${t.w[2]}</span>`,
      };
    },

    ending() {
      const t = pick(fresh(cvc()));
      const end = t.w[2];
      const ends = shuffle([end, ...shuffle('tgnpdbm'.split('').filter(x => x !== end)).slice(0, 2)]);
      return {
        target: t.w,
        clue: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w.slice(0, 2)}<span class="blank">?</span></span>`,
        ask: [{ text: line('ending') }, { pause: 600 }, say(t.w)],
        replay: [say(t.w)],
        options: ends.map(x => ({ html: letterCard(x), right: x === end, wrong: PART_SOUNDS[x] })),
        answer: [say(`${t.w}!`)],
        solved: `<span class="clue-pic">${t.e}</span><span class="clue-word">${t.w.slice(0, 2)}<span class="first">${end}</span></span>`,
      };
    },

    read() {
      const fam = pick(WORD_FAMILIES);
      const three = shuffle(fam.slice()).slice(0, 3).map(([w, e]) => ({ w, e }));
      const t = pick(fresh(three));
      const lead = line('read');
      return {
        target: t.w, clue: `<span class="clue-word big">${t.w}</span>`,
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
  const plainCard = w => `<span class="w">${w}</span>`;
  Object.assign(builders, {
    // She hears the whole sentence and picks the word she heard from
    // words that sound alike.
    sentence() {
      const x = pick(fresh(SENTENCES, x => x.w[0]));
      const full = { text: sentenceParts(x).full, rate: 0.8 };
      const opts = shuffle([x.w[0], ...x.alike]);
      return {
        target: x.w[0], clue: blankHtml(x),
        ask: [{ text: line('sentence') }, { pause: 700 }, full],
        replay: [full],
        options: opts.map(w => ({ html: plainCard(w), right: w === x.w[0], wrong: w })),
        answer: [full],
        solved: filledHtml(x),
      };
    },
    // The blank is hummed, so she has to pick the word that makes sense.
    meaning() {
      const x = pick(fresh(SENTENCES, x => x.w[0]));
      const p = sentenceParts(x);
      const hum = [{ text: p.before, rate: 0.8 }, { pause: 250 }, { text: 'hmm, hmm', rate: 0.8 }, { pause: 250 }];
      if (p.after.replace(/[.!?\s]/g, '')) hum.push({ text: p.after, rate: 0.8 });
      const opts = shuffle([x.w, ...x.other]);
      const lead = line('meaning');
      return {
        target: x.w[0], clue: blankHtml(x),
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
      const t = pick(fresh(spellWords()));
      const own = [...t.w];
      // Never a letter that sounds like one in the word, such as c for milk.
      const free = l => !own.some(o => soundOf(o) === soundOf(l));
      const vowels = 'aeiou'.split('').filter(free);
      const others = shuffle('bcdfghlmnprst'.split('').filter(free));
      // One other vowel, so she has to listen for the middle sound too.
      const extra = [pick(vowels)].concat(others).slice(0, Math.max(SPELL_TILES, own.length + 3) - own.length);
      const sounds = own.map(l => ({ text: soundOf(l), narrator: true, rate: 0.8 }));
      return {
        target: t.w,
        word: t.w,
        clue: `<span class="clue-pic">${t.e}</span><span class="spell-word">${own.map(() => '<span class="slot"></span>').join('')}</span>`,
        tiles: shuffle(own.concat(extra)).map(l => ({ l, sound: soundOf(l) })),
        ask: [{ text: line('spell') }, { pause: 600 }, say(t.w)],
        replay: [say(t.w)],
        // Filled in when the last blank is filled (see checkSpell in game.js).
        options: [],
        // Sound it out, then say it: "kuh, ah, tuh... cat!"
        answer: sounds.flatMap(s => [s, { pause: 120 }]).concat({ pause: 250 }, say(`${t.w}!`)),
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
    const q = builders[kind](npc);
    if (!q.prompt) q.prompt = q.ask.find(p => p.text && !p.file).text;
    remember(q.target);
    return Object.assign(q, { kind, done: false, misses: 0 });
  }

  return {
    make,
    get recent() { return recent; },
    set recent(list) { recent = Array.isArray(list) ? list.slice(-RECENT_WORDS) : []; },
  };
})();
