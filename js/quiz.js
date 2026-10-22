// Question builders. Each returns everything the dialog needs:
//   clue     HTML shown above the choices (picture, letter or word)
//   ask      speech parts that pose the question
//   prompt   the question as text (defaults to its spoken line)
//   replay   speech parts for the 🔊 button
//   options  [{ html, right, wrong }] where `wrong` is what the retry line
//            says when that option is picked by mistake (`sound` when it
//            is a letter sound rather than a word)
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

  const say = w => ({ text: w, file: rec('words', w), rate: 0.72 });
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
        options: letters.map(l => ({ html: letterCard(l.letter + l.letter.toLowerCase()), right: l === t.info, wrong: l.sound, sound: true })),
        answer: [{ text: `${t.w} starts with` }, letterSound(t.info)],
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
        answer: [{ text: `${base.w}, ${ans.w}!` }],
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
        options: vowels.map(x => ({ html: letterCard(x), right: x === v, wrong: PART_SOUNDS[x], sound: true })),
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
        options: ends.map(x => ({ html: letterCard(x), right: x === end, wrong: PART_SOUNDS[x], sound: true })),
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

  // Picks a kind of question this person didn't ask last time.
  function make(npc) {
    const kinds = QUIZ_TYPES[npc.level === 2 ? 'forest' : npc.letter ? 'house' : 'town'];
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
