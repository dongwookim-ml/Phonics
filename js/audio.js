// Speech (recorded lines, words, letter sounds) and small synthesized sound effects.

const Sound = (() => {
  let voice = null;
  let voices = [];
  let muted = false;
  let audioCtx = null;

  // Name fragments of common system voices, used to guess a voice's gender.
  const MALE = ['Daniel', 'Alex', 'Fred', 'Aaron', 'Arthur', 'Gordon', 'Oliver', 'Rishi', 'Tom', 'Junior', 'Ralph',
    'Male', 'Guy', 'David', 'Mark', 'Ryan', 'Christopher', 'Eric', 'Andrew', 'Brian', 'George', 'Roger', 'Steffan'];
  const FEMALE = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Fiona', 'Victoria', 'Allison', 'Ava', 'Susan', 'Zoe', 'Kate',
    'Serena', 'Martha', 'Female', 'Aria', 'Jenny', 'Zira', 'Hazel', 'Sonia', 'Libby', 'Emma', 'Michelle', 'Ana', 'Google US English'];
  const isGender = (v, list) => list.some(n => v.name.includes(n));

  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    voices = speechSynthesis.getVoices().filter(v => v.lang && v.lang.startsWith('en'));
    // Prefer natural sounding US voices when the platform has them.
    const prefs = ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Karen'];
    voice = prefs.map(n => voices.find(v => v.name.includes(n))).find(Boolean)
      || voices.find(v => v.lang === 'en-US') || voices[0] || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  // A speaking style for one person: a system voice plus pitch and rate.
  // `seed` spreads people of the same kind across the voices available.
  function profile(style, seed = 0) {
    if (!style) return { voice: null, pitch: 1.15, rate: 1 };
    if (!voices.length) pickVoice();
    let v = (style.voice || []).map(n => voices.find(x => x.name.includes(n))).find(Boolean);
    if (!v) {
      const pool = voices.filter(x => isGender(x, style.gender === 'male' ? MALE : FEMALE));
      if (pool.length) v = pool[Math.abs(seed) % pool.length];
    }
    return { voice: v || null, pitch: style.pitch, rate: style.rate, tts: style.tts, lift: style.lift };
  }

  // Pre-recorded lines (audio/tts, recorded with Amazon Polly by
  // tools/polly-build.py). The index maps each voice's sentences to a file.
  // Anything not recorded, such as a custom name, comes from TTS_SERVER if
  // set, else the device voice.
  const index = typeof TTS_INDEX !== 'undefined' ? TTS_INDEX : {};
  const norm = t => String(t).trim().replace(/\s+/g, ' ');
  const voiceFor = (item, who) => (item.narrator || !who.tts ? TTS_NARRATOR : who.tts);
  const clipId = (item, who) => { const m = index[voiceFor(item, who)]; return m && m[norm(item.text)]; };
  function recorded(item, who) {
    const v = voiceFor(item, who);
    const text = norm(item.text);
    const id = clipId(item, who);
    if (id) return { url: `audio/tts/${v}/${id}.mp3` };
    if (!TTS_SERVER) return null;
    const speed = item.narrator ? 0.8 : 0.95;
    return { url: `${TTS_SERVER.replace(/\/$/, '')}/tts?voice=${v}&speed=${speed}&text=${encodeURIComponent(text)}`, live: true };
  }

  // "/m/" is a pure letter sound, cut from the narrator's own words when the
  // clips are recorded. Without a recording it is said the old way ("mmm",
  // "kuh"), never as "slash m slash"; a doubled letter ("/ll/") as the
  // single one.
  const PURE = /^\/[a-z]+\/$/;
  const DIGRAPHS = { sh: 'shh', ch: 'ch', th: 'th', ck: 'kuh', ng: 'ng', q: 'kwuh', qu: 'kwuh' };
  function spelledSound(text) {
    const l = text.slice(1, -1).replace(/^(.)\1$/, '$1');
    const letter = typeof LETTERS !== 'undefined' && LETTERS.find(x => x.letter === l.toUpperCase());
    return (typeof PART_SOUNDS !== 'undefined' && PART_SOUNDS[l]) || DIGRAPHS[l] || (letter && letter.sound) || l;
  }

  // `lift` plays a voice faster and higher so characters who share a voice
  // sound apart. It is for chit-chat only: speeding up shifts the vowels a
  // listener needs, so never on the narrator, quiz words (`file`, `word`),
  // questions and teaching (`plain`) or letter sounds.
  const TEACH = /\b[A-Z] says |^\/[a-z]+\/$/;
  const liftFor = (item, who) =>
    (item.narrator || item.plain || item.file || item.word || TEACH.test(norm(item.text)) ? 0 : who.lift);

  // One audio element, reused so iPad keeps it unlocked after the first tap.
  // The unlock never swaps out a clip that is playing (that cut off the line
  // being said), and only a refusal to play counts as still locked: a
  // say() in the same tap replacing the silence is fine.
  const player = typeof Audio !== 'undefined' ? new Audio() : null;
  let unlocked = false;
  function unlockPlayer() {
    if (unlocked || !player) return;
    unlocked = true;
    if (player.src && !player.paused) return;
    player.src = 'audio/tts/silence.mp3';
    player.play().catch(e => { if (e && e.name === 'NotAllowedError') unlocked = false; });
  }
  // A live clip that hasn't started after a few seconds gives way to the
  // device voice so nobody waits on a slow server.
  function playFile(url, done, fail, live, lift, slow) {
    const timer = live ? setTimeout(fail, 4000) : null;
    player.onplaying = () => { clearTimeout(timer); duck(true); };
    player.onended = () => { clearTimeout(timer); duck(false); done(); };
    player.onerror = () => { clearTimeout(timer); duck(false); fail(); };
    player.src = url;
    // A lifted voice plays faster without keeping its pitch, so it sounds
    // higher. A slow part (a hint) keeps its pitch.
    player.preservesPitch = player.webkitPreservesPitch = !lift;
    player.playbackRate = (lift || 1) * (slow || 1);
    player.play().catch(() => { clearTimeout(timer); fail(); });
  }

  // Speak a list of phrases in order. Each item is a string or
  // { text, rate, pitch, file, narrator, plain, slow } where `file` is an
  // optional recording, `plain` marks a question or teaching line (never
  // lifted) and `slow` plays it slower (0.8 is four fifths of the speed),
  // or { pause: ms } for a short silence, or { call: fn } to run fn when
  // the queue gets there. `who` is a profile() result.
  // Speech never starts on top of a sound effect: it waits for a short one
  // to end, and a longer one is turned down while the voice plays.
  function say(parts, who) {
    if (muted) return;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (player) { player.onended = null; player.onerror = null; player.onplaying = null; player.pause(); }
    clearTimeout(pauseTimer);
    duck(false);
    const queue = (Array.isArray(parts) ? parts : [parts]).map(p => typeof p === 'string' ? { text: p } : p);
    const gen = ++generation;
    const wait = sfxEnd - now();
    if (wait > 120) pauseTimer = setTimeout(() => playNext(queue, who || {}, gen), Math.min(wait, 600) + 40);
    else playNext(queue, who || {}, gen);
  }

  let generation = 0;
  let pauseTimer = null;

  function playNext(queue, who, gen) {
    if (gen !== generation) return; // a newer say() took over
    let item = queue.shift();
    if (!item) return;
    const next = () => playNext(queue, who, gen);
    if (item.text && PURE.test(norm(item.text)) && !clipId(item, who)) {
      item = Object.assign({}, item, { text: spelledSound(norm(item.text)), plain: true });
    }
    // Your own recordings (USE_RECORDINGS) come first, then Polly's.
    const own = USE_RECORDINGS && item.file && player ? { url: item.file } : null;
    const file = own || (item.text && player ? recorded(item, who) : null);
    if (item.call) {
      item.call();
      next();
    } else if (item.pause) {
      pauseTimer = setTimeout(next, item.pause);
    } else if (file) {
      let failed = false;
      playFile(file.url, next, () => {
        if (failed || gen !== generation) return;
        failed = true;
        player.onended = null;
        player.pause();
        speak(item, who, next);
      }, file.live, liftFor(item, who), item.slow);
    } else {
      speak(item, who, next);
    }
  }

  function speak(item, who, done) {
    if (!('speechSynthesis' in window)) { done(); return; }
    const u = new SpeechSynthesisUtterance(item.text);
    const v = who.voice || voice;
    if (v) u.voice = v;
    u.lang = v ? v.lang : 'en-US';
    u.rate = Math.max(0.62, Math.min(1.6, (item.rate || 0.9) * (who.rate || 1) * (item.slow || 1)));
    u.pitch = Math.max(0, Math.min(2, item.pitch || who.pitch || 1.15));
    u.onstart = () => duck(true);
    u.onend = () => { duck(false); done(); };
    u.onerror = () => { duck(false); done(); };
    speechSynthesis.speak(u);
  }

  // Sound effects go through one gain, turned down while speech plays.
  let sfxBus = null;
  let sfxEnd = 0;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  function ctx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
      sfxBus = audioCtx.createGain();
      sfxBus.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function duck(on) {
    if (sfxBus) sfxBus.gain.setTargetAtTime(on ? 0.25 : 1, audioCtx.currentTime, 0.04);
  }

  // Play a short sequence of notes: [[frequency, startSec, durationSec], ...]
  function notes(seq, type = 'square', gain = 0.06) {
    if (muted) return;
    const ac = ctx();
    if (!ac) return;
    const t0 = ac.currentTime;
    let end = 0;
    for (const [f, s, d] of seq) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(gain, t0 + s);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + s + d);
      o.connect(g).connect(sfxBus);
      o.start(t0 + s);
      o.stop(t0 + s + d + 0.02);
      end = Math.max(end, s + d);
    }
    sfxEnd = Math.max(sfxEnd, now() + end * 1000);
  }

  // Whether a line has a recording in this person's voice (new lines play
  // only once they have been recorded).
  const hasClip = (text, who = {}) => !!(index[who.tts || TTS_NARRATOR] || {})[norm(text)];

  return {
    say,
    profile,
    hasClip,
    tap: () => notes([[660, 0, 0.08]]),
    step: () => notes([[220, 0, 0.04]], 'triangle', 0.03),
    // correct and wrong are for answers only.
    correct: () => notes([[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.25]]),
    wrong: () => notes([[300, 0, 0.12], [250, 0.12, 0.2]], 'triangle', 0.08),
    // A wrong answer: soft and short, so a miss is never the fun part.
    oops: () => notes([[523, 0, 0.09], [392, 0.1, 0.18]], 'sine', 0.06),
    // A soft rising twinkle: dressing up, getting on the unicorn, taking a present.
    sparkle: () => notes([[784, 0, 0.08], [988, 0.07, 0.08], [1319, 0.14, 0.18]], 'triangle', 0.05),
    // Two soft low blips: a gate that is still locked, not enough coins.
    locked: () => notes([[262, 0, 0.07], [247, 0.12, 0.1]], 'triangle', 0.06),
    coin: () => notes([[988, 0, 0.07], [1319, 0.07, 0.22]], 'square', 0.04),
    door: () => notes([[392, 0, 0.08], [523, 0.08, 0.08], [659, 0.16, 0.14]], 'triangle', 0.07),
    party: () => notes([[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.4], [784, 0.5, 0.1], [1047, 0.6, 0.5]]),
    // Little sounds for things she taps on the map (js/touch.js).
    tune(name) {
      const t = {
        chime: [[[1047, 0, 0.12], [1319, 0.08, 0.12], [1568, 0.16, 0.25]], 'triangle'],
        boing: [[[220, 0, 0.08], [330, 0.06, 0.08], [440, 0.12, 0.12]], 'square'],
        splash: [[[880, 0, 0.05], [660, 0.04, 0.05], [990, 0.08, 0.06], [740, 0.12, 0.08]], 'triangle'],
        clink: [[[1568, 0, 0.06], [2093, 0.07, 0.14]], 'triangle'],
        harp: [[[523, 0, 0.3], [659, 0.1, 0.3], [784, 0.2, 0.3], [1047, 0.3, 0.3], [1319, 0.4, 0.5]], 'triangle'],
        honk: [[[392, 0, 0.12], [392, 0.18, 0.18]], 'square'],
        rumble: [[[82, 0, 0.3], [73, 0.2, 0.4], [65, 0.45, 0.4]], 'square'],
      }[name];
      if (t) notes(t[0], t[1], 0.05);
    },
    levelUp: () => notes([[392, 0, 0.12], [523, 0.12, 0.12], [659, 0.24, 0.12], [784, 0.36, 0.2], [1047, 0.56, 0.18], [1319, 0.74, 0.6]], 'triangle', 0.08),
    toggleMute() {
      muted = !muted;
      if (muted) { generation++; if ('speechSynthesis' in window) speechSynthesis.cancel(); if (player) player.pause(); }
      return muted;
    },
    unlock() { unlockPlayer(); return ctx(); },
    get muted() { return muted; },
  };
})();
