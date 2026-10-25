// Speech (letter sounds, words) and small synthesized sound effects.

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

  // Pre-recorded lines (audio/tts, made with the Kokoro voice model). The
  // index maps each voice's sentences to a file. Anything not recorded, such
  // as a custom name, comes from TTS_SERVER if set, else the device voice.
  const index = typeof TTS_INDEX !== 'undefined' ? TTS_INDEX : {};
  const norm = t => String(t).trim().replace(/\s+/g, ' ');
  function recorded(item, who) {
    const v = item.narrator || !who.tts ? TTS_NARRATOR : who.tts;
    const text = norm(item.text);
    const id = index[v] && index[v][text];
    if (id) return { url: `audio/tts/${v}/${id}.mp3` };
    if (!TTS_SERVER) return null;
    const speed = item.narrator ? 0.8 : 0.95;
    return { url: `${TTS_SERVER.replace(/\/$/, '')}/tts?voice=${v}&speed=${speed}&text=${encodeURIComponent(text)}`, live: true };
  }
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
  function playFile(url, done, fail, live, lift) {
    const timer = live ? setTimeout(fail, 4000) : null;
    player.onplaying = () => clearTimeout(timer);
    player.onended = () => { clearTimeout(timer); done(); };
    player.onerror = () => { clearTimeout(timer); fail(); };
    player.src = url;
    // A lifted voice plays faster without keeping its pitch, so it sounds higher.
    player.preservesPitch = player.webkitPreservesPitch = !lift;
    player.playbackRate = lift || 1;
    player.play().catch(() => { clearTimeout(timer); fail(); });
  }

  // Speak a list of phrases in order. Each item is a string or
  // { text, rate, pitch, file } where `file` is an optional recording,
  // or { pause: ms } for a short silence, or { call: fn } to run fn when
  // the queue gets there. `who` is a profile() result.
  function say(parts, who) {
    if (muted) return;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (player) { player.onended = null; player.onerror = null; player.onplaying = null; player.pause(); }
    clearTimeout(pauseTimer);
    const queue = (Array.isArray(parts) ? parts : [parts]).map(p => typeof p === 'string' ? { text: p } : p);
    playNext(queue, who || {}, ++generation);
  }

  let generation = 0;
  let pauseTimer = null;

  function playNext(queue, who, gen) {
    if (gen !== generation) return; // a newer say() took over
    const item = queue.shift();
    if (!item) return;
    const next = () => playNext(queue, who, gen);
    // Your own recordings (USE_RECORDINGS) come first, then Kokoro's.
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
      }, file.live, item.narrator ? 0 : who.lift);
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
    u.rate = Math.max(0.62, Math.min(1.6, (item.rate || 0.9) * (who.rate || 1)));
    u.pitch = Math.max(0, Math.min(2, item.pitch || who.pitch || 1.15));
    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
  }

  function ctx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // Play a short sequence of notes: [[frequency, startSec, durationSec], ...]
  function notes(seq, type = 'square', gain = 0.06) {
    if (muted) return;
    const ac = ctx();
    if (!ac) return;
    const t0 = ac.currentTime;
    for (const [f, s, d] of seq) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(gain, t0 + s);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + s + d);
      o.connect(g).connect(ac.destination);
      o.start(t0 + s);
      o.stop(t0 + s + d + 0.02);
    }
  }

  return {
    say,
    profile,
    tap: () => notes([[660, 0, 0.08]]),
    step: () => notes([[220, 0, 0.04]], 'triangle', 0.03),
    correct: () => notes([[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.25]]),
    wrong: () => notes([[300, 0, 0.12], [250, 0.12, 0.2]], 'triangle', 0.08),
    door: () => notes([[392, 0, 0.08], [523, 0.08, 0.08], [659, 0.16, 0.14]], 'triangle', 0.07),
    party: () => notes([[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.4], [784, 0.5, 0.1], [1047, 0.6, 0.5]]),
    toggleMute() {
      muted = !muted;
      if (muted) { generation++; if ('speechSynthesis' in window) speechSynthesis.cancel(); if (player) player.pause(); }
      return muted;
    },
    unlock() { unlockPlayer(); return ctx(); },
  };
})();
