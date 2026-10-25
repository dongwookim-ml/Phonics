// Background music: a short, calm tune for each kind of place, played softly
// under everything and made on the spot with Web Audio (no audio files):
// - the town and the castle, the forest, the fairy village, the unicorn
//   village, the cave, and inside a house or her room (MUSIC_TUNES): eight
//   bars in a major key, a melody over a broken chord and a bass, round and
//   round. Every third time round the melody rests, so the ear gets a break;
// - the princess edition hears a music box; the robot edition a little
//   chiptune band, a tone higher and a touch quicker (MUSIC_TIMBRES);
// - whenever anything is said (Sound.say in js/audio.js) it drops to an
//   eighth within a fraction of a second and comes back slowly once the
//   voice stops. While a question, a book or the fishing game is open it
//   stays down the whole time, so she hears every word. Sound effects play
//   over it as before;
// - a new place crossfades to its tune in about a second;
// - it starts only once a tap has unlocked the sound (Sound.unlock) and the
//   town is on screen, and goes quiet while 🔊 is off, the parent panel is
//   open, the page is hidden, the town is asleep (js/guide.js), or when a
//   parent turns it off (배경 음악 in the parent panel: state.settings.music,
//   missing means on).
// Notes are put on the audio clock a little ahead by a timer (a lookahead
// scheduler), never from the frame loop. Each note is one oscillator and its
// gain, and a tune never has more than three sounding at once (six during a
// crossfade). Without Web Audio there is simply no music.
// Hooks: Sound.say, toggleMute and unlock (js/audio.js); changeScene,
// openDialog, closeDialog and setPaused (js/game.js); guideSleep and
// guideWake (js/guide.js); the settings in js/parent.js.

const MUSIC_LEVEL = 1;            // the band at its loudest: about 14 dB under the voices
const MUSIC_DUCK = 0.12;          // under a voice or a question: an eighth of that
const MUSIC_HOLD_MS = 700;        // how long it stays down after the voice stops
const MUSIC_FADE = 1;             // seconds for the crossfade to a new place's tune
const MUSIC_AHEAD = 0.4;          // seconds of notes put on the audio clock ahead
const MUSIC_TICK_MS = 100;        // how often the scheduler looks
const MUSIC_TALK_MAX_MS = 30000;  // a voice that never says it has finished stops holding it down

// ---- The tunes -----------------------------------------------------------------

// One step is an eighth note `step` seconds long; `bar` steps make a bar and
// each bar has a chord. The melody is written out note by note ('-' holds
// the note before, '.' is a rest). The broken chord (`arp`) and the bass are
// one bar's pattern, played on each bar's chord: 0 is its root, 1 its third,
// 2 its fifth, 3 the root an octave up. `arpLift` raises the broken chord.
const MUSIC_TUNES = {
  // The town and the castle: a bright little walk in C.
  town: {
    step: 0.34, bar: 8,
    chords: 'C G Am F C F G C',
    melody: 'G5 - E5 - C5 - E5 - | D5 - - - G4 - - - | A4 - C5 - E5 - A5 - | G5 - F5 - - - . . |' +
      'E5 - G5 - C6 - E5 - | F5 - A5 - G5 - F5 - | D5 - B4 - G4 - B4 - | C5 - - - - - . .',
    arp: '0 2 1 2 0 2 1 2',
    bass: '0 - - - 2 - - -',
  },
  // The forest (the dino village): a lilting 6/8 in G.
  forest: {
    step: 0.27, bar: 6,
    chords: 'G C G D Em C D G',
    melody: 'B4 - D5 G5 - D5 | E5 - G5 E5 - C5 | D5 - B4 G4 - B4 | A4 - - D5 - - |' +
      'G5 - E5 B4 - E5 | C5 - E5 G5 - E5 | F#5 - A5 F#5 - D5 | G5 - - - - .',
    arp: '0 . 2 . 3 .',
    bass: '0 - - 2 - -',
  },
  // The fairy village (the drone village): a high, sparkly waltz in F.
  fairy: {
    step: 0.25, bar: 6, arpLift: 12,
    chords: 'F Bb F C Dm Bb C F',
    melody: 'C6 - A5 - F5 - | D6 - - - Bb5 - | C6 - A5 - F5 - | G5 - - - - - |' +
      'F5 - A5 - D6 - | D6 - C6 - Bb5 - | G5 - Bb5 - E5 - | F5 - - - - .',
    arp: '0 1 2 3 2 1',
    bass: '0 - - - - -',
  },
  // The unicorn village (the car village): a gentle canter in D.
  unicorn: {
    step: 0.3, bar: 8,
    chords: 'D A Bm G D G A D',
    melody: 'A4 - D5 - F#5 - - E5 | E5 - - - C#5 - A4 - | B4 - D5 - F#5 - - E5 | D5 - - - - - . . |' +
      'F#5 - A5 - - - F#5 - | G5 - B5 - - - G5 - | A5 - G5 - F#5 - E5 - | D5 - - - - - . .',
    arp: '0 . 1 2 0 . 1 2',
    bass: '0 - - - 2 - - -',
  },
  // The cave (the villain's cave): slow and roomy in A, with drips up high.
  cave: {
    step: 0.4, bar: 8, arpLift: 12,
    chords: 'A F#m D A F#m D E E',
    melody: 'E5 - - - . . C#5 - | A4 - - - . . . . | F#5 - - - E5 - D5 - | C#5 - - - . . . . |' +
      'C#5 - - - . . E5 - | F#5 - - - A5 - - - | G#5 - - - F#5 - E5 - | B4 - - - . . . .',
    arp: '. . 3 . . . 2 .',
    bass: '0 - - - - - - -',
  },
  // Inside a house or her room: a lullaby in B flat.
  home: {
    step: 0.32, bar: 6,
    chords: 'Bb F Gm Eb Bb Eb F Bb',
    melody: 'D5 - - - F5 - | C5 - - - A4 - | Bb4 - D5 - G5 - | G5 - - - - - |' +
      'F5 - D5 - Bb4 - | Eb5 - G5 - Bb5 - | A5 - G5 - Eb5 - | D5 - - - - .',
    arp: '0 . 1 . 2 .',
    bass: '0 - - - - -',
  },
};

// Which tune a scene plays, by its kind; the castle has the town's, and any
// room (a letter house, a village home, her room) the lullaby.
const MUSIC_PLACES = { town: 'town', forest: 'forest', dino: 'forest', fairy: 'fairy', unicorn: 'unicorn', dungeon: 'cave', monster: 'cave', tower: 'cave' };

// How the band sounds, per edition. Voices: the melody, the broken chord and
// the bass, each with its loudest `gain` and how long a note may `ring` (it
// dies away by then, or by the next note of its part). `partials` makes a
// bell-like wave from harmonics; `pulse` a chiptune pulse wave of that
// width; `type` is the plain wave used when those can't be made. The robot
// edition plays `shift` semitones higher with steps `pace` times as long.
const MUSIC_TIMBRES = {
  box: {
    filter: 2600, shift: 0, pace: 1,
    voices: [
      { partials: [0, 1, 0.45, 0.12, 0.22, 0, 0.05], type: 'triangle', gain: 0.07, ring: 1.4 },
      { partials: [0, 1, 0.3, 0.05, 0.12], type: 'triangle', gain: 0.03, ring: 0.5 },
      { type: 'triangle', gain: 0.055, ring: 1.6 },
    ],
  },
  robot: {
    filter: 3400, shift: 2, pace: 0.94,
    voices: [
      { pulse: 0.25, type: 'square', gain: 0.055, ring: 0.9 },
      { pulse: 0.5, type: 'square', gain: 0.03, ring: 0.12 },
      { type: 'triangle', gain: 0.09, ring: 1.2 },
    ],
  },
};

const music = {
  ac: null,           // Sound's AudioContext, once a tap has unlocked it
  armed: false,
  broken: false,      // Web Audio failed once: no music this visit
  on: false,          // playing right now
  place: null,        // whose tune
  deck: null,         // the tune playing (musicDeck)
  fading: null,       // the one fading out after a change of place
  master: null,       // on / off (all the things that silence it)
  duck: null,         // down under voices and questions
  filter: null,       // takes the edge off
  voices: null,       // MUSIC_TIMBRES' voices with their waves
  sound: null,        // 'box' or 'robot'
  tunes: null,        // MUSIC_TUNES as notes (musicBuild)
  talking: false,     // Sound.say is busy
  talkAt: 0,
  quietAt: -Infinity, // the last moment something was said or asked
  ducked: false,
  notes: 0,           // notes played so far
  timer: 0,
  els: null,
};

// "C#5" → 73 (MIDI note number).
const MUSIC_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function musicMidi(name) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  return 12 * (Number(m[3]) + 1) + MUSIC_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const musicHz = midi => 440 * Math.pow(2, (midi - 69) / 12);

// "F#m" → { pc: 6, tones: [0, 3, 7, 12] } (root, third, fifth, octave).
function musicChord(name) {
  const m = /^([A-G][#b]?)(m?)$/.exec(name);
  return { pc: musicMidi(`${m[1]}4`) % 12, tones: [0, m[2] ? 3 : 4, 7, 12] };
}

// A tune as notes in time order: { v: voice (0 melody, 1 broken chord,
// 2 bass), s: step, d: steps it lasts, f: Hz, a: loudness }, with its step
// and loop length in seconds. The first beat of each bar is a little louder.
function musicBuild(tune, shift, pace) {
  const words = s => s.split(/[\s|]+/).filter(Boolean);
  const chords = words(tune.chords).map(musicChord);
  const steps = chords.length * tune.bar;
  const events = [];
  const part = (list, v, pitch) => {
    let note = null;
    list.forEach((w, s) => {
      if (w === '-') { if (note) note.d++; return; }
      note = w === '.' ? null : { v, s, d: 1, f: musicHz(pitch(w, s) + shift), a: s % tune.bar ? 0.82 : 1 };
      if (note) events.push(note);
    });
  };
  const bars = pattern => { const w = words(pattern); return Array.from({ length: steps }, (x, s) => w[s % tune.bar]); };
  // The broken chord's root sits between G#3 and G4, the bass's an octave
  // lower.
  const tone = (low, lift) => (w, s) => {
    const c = chords[Math.floor(s / tune.bar)];
    return c.pc + (c.pc > 7 ? low - 12 : low) + lift + c.tones[Number(w)];
  };
  part(words(tune.melody), 0, musicMidi);
  part(bars(tune.arp), 1, tone(60, tune.arpLift || 0));
  part(bars(tune.bass), 2, tone(48, 0));
  events.sort((x, y) => x.s - y.s || x.v - y.v);
  const step = tune.step * pace;
  return { events, step, loop: steps * step, steps };
}

// A wave from harmonics (a bell, a pulse), or null for the plain one.
function musicWave(ac, v) {
  if (!ac.createPeriodicWave || !(v.partials || v.pulse)) return null;
  let amps = v.partials;
  if (v.pulse) {
    amps = [0];
    for (let n = 1; n <= 12; n++) amps.push((2 / (n * Math.PI)) * Math.sin(n * Math.PI * v.pulse) / (1 + (n / 6) * (n / 6)));
  }
  try { return ac.createPeriodicWave(new Float32Array(amps.length), new Float32Array(amps)); } catch (e) { return null; }
}

// One note into `out`: an oscillator and its gain, a quick start and dying
// away by `end`. Returns the oscillator.
function musicNote(ac, out, voice, e, at, end) {
  const o = ac.createOscillator();
  if (voice.wave) o.setPeriodicWave(voice.wave);
  else o.type = voice.type;
  o.frequency.value = e.f;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(voice.gain * e.a, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0008, end);
  o.connect(g);
  g.connect(out);
  o.start(at);
  o.stop(end + 0.02);
  return o;
}

// A tune being played into its own gain: where it is (`pos` in its notes,
// `t0` the audio time its loop began, `pass` how many times round), when it
// stops (`until`, once it fades out), and its last notes (oscillators with
// their start and end times), so a tune that has to go at once can stop
// them and musicInfo can count what sounds.
function musicDeck(tune, gain, t0) {
  return { tune, gain, pos: 0, t0, pass: 0, until: Infinity, n: 0, oscs: new Array(16), starts: new Float64Array(16), ends: new Float64Array(16) };
}

// ---- Starting and stopping ---------------------------------------------------------

// The first tap (Sound.unlock): the band sets up on Sound's AudioContext.
// Later taps just look again (a tablet may have paused the sound meanwhile).
function musicArm(ac) {
  if (music.armed) { musicUpdate(); return; }
  if (!ac || music.broken) return;
  try {
    music.sound = isCaptain() ? 'robot' : 'box';
    const timbre = MUSIC_TIMBRES[music.sound];
    music.voices = timbre.voices.map(v => Object.assign({}, v, { wave: musicWave(ac, v) }));
    music.tunes = {};
    for (const k of Object.keys(MUSIC_TUNES)) music.tunes[k] = musicBuild(MUSIC_TUNES[k], timbre.shift, timbre.pace);
    music.filter = ac.createBiquadFilter();
    music.filter.type = 'lowpass';
    music.filter.frequency.value = timbre.filter;
    music.filter.Q.value = 0;
    music.duck = ac.createGain();
    music.master = ac.createGain();
    music.master.gain.value = 0;
    music.filter.connect(music.duck);
    music.duck.connect(music.master);
    music.master.connect(ac.destination);
  } catch (e) {
    music.broken = true;
    return;
  }
  music.ac = ac;
  music.armed = true;
  music.timer = setInterval(musicTick, MUSIC_TICK_MS);
  musicUpdate();
}

// Whether it should play now (once armed and the sound is running).
function musicWanted() {
  return !(state.settings && state.settings.music === false) && !Sound.muted && !state.paused && !document.hidden && guidePlaying();
}

// A question, a book or the fishing game is open: words she has to hear.
function musicListening() {
  const els = music.els || (music.els = { reader: document.getElementById('reader'), mini: document.getElementById('mini') });
  return !!state.question || !els.reader.classList.contains('hidden') || !els.mini.classList.contains('hidden');
}

function musicPlaceOf(sc) {
  if (!sc || sc === state.scenes.castle || sc === state.scenes.castle2) return 'town';
  return MUSIC_PLACES[sc.kind] || 'home';
}

// Sound.say started (true) or finished its queue (false).
function musicHush(on) {
  if (!on && music.talking) music.quietAt = performance.now();
  music.talking = on;
  if (on) music.talkAt = performance.now();
  musicUpdate();
}

// Looks at everything again: on or off, ducked or not, the place, and the
// next notes. Called by the timer and by the hooks; it never throws, and
// any trouble with Web Audio just ends the music.
function musicUpdate() {
  if (!music.ac) return;
  try { musicStep(); } catch (e) { musicBreak(); }
}

function musicTick() {
  if (music.talking && performance.now() - music.talkAt > MUSIC_TALK_MAX_MS) musicHush(false);
  else musicUpdate();
}

function musicBreak() {
  clearInterval(music.timer);
  try { music.master.disconnect(); } catch (e) { /* already gone */ }
  Object.assign(music, { ac: null, on: false, broken: true });
}

function musicStep() {
  const ac = music.ac;
  const t = ac.currentTime;
  const want = musicWanted() && (!ac.state || ac.state === 'running');
  if (want !== music.on) {
    music.on = want;
    // In over a couple of seconds; out at once.
    musicRamp(music.master.gain, want ? MUSIC_LEVEL : 0, t, want ? 0.6 : 0.08);
    if (want) musicStart(musicPlaceOf(state.scene), t, true);
  }
  musicDuck(t);
  if (!music.on) return;
  const place = musicPlaceOf(state.scene);
  if (place !== music.place) musicStart(place, t, false);
  musicFill(music.deck, t, t + MUSIC_AHEAD);
  const f = music.fading;
  if (f && t >= f.until) {
    f.gain.disconnect();
    music.fading = null;
  } else if (f) musicFill(f, t, Math.min(t + MUSIC_AHEAD, f.until));
}

// Down quickly when something is said or asked; back up slowly a moment
// after the last word.
function musicDuck(t) {
  const now = performance.now();
  const busy = music.talking || musicListening();
  if (busy) music.quietAt = now;
  const down = busy || now - music.quietAt < MUSIC_HOLD_MS;
  if (down === music.ducked) return;
  music.ducked = down;
  musicRamp(music.duck.gain, down ? MUSIC_DUCK : 1, t, down ? 0.05 : 0.9);
}

// Glides an AudioParam from wherever it is now towards v (time constant tau).
function musicRamp(param, v, t, tau) {
  param.cancelScheduledValues(t);
  param.setTargetAtTime(v, t, tau);
}

// A place's tune from its first bar. `fresh`: the music was off, so the
// old tune just goes; otherwise the two crossfade.
function musicStart(place, t, fresh) {
  if (music.fading) musicDrop(music.fading, t);
  music.fading = null;
  const old = music.deck;
  if (old && !fresh) {
    musicRamp(old.gain.gain, 0, t, MUSIC_FADE / 3);
    old.until = t + MUSIC_FADE * 1.5;
    music.fading = old;
  } else if (old) musicDrop(old, t);
  const g = music.ac.createGain();
  g.gain.setValueAtTime(fresh ? 1 : 0, t);
  if (!fresh) g.gain.setTargetAtTime(1, t, MUSIC_FADE / 3);
  g.connect(music.filter);
  music.place = place;
  music.deck = musicDeck(music.tunes[place], g, t + 0.08);
}

// A tune that has to go at once: its notes stop, then it is let go.
function musicDrop(deck, t) {
  musicRamp(deck.gain.gain, 0, t, 0.02);
  deck.until = 0;
  for (let k = 0; k < 16; k++) {
    if (!(deck.ends[k] > t)) continue;
    try { deck.oscs[k].stop(t + 0.08); } catch (e) { /* an old browser: the gain is down anyway */ }
    deck.ends[k] = Math.max(deck.starts[k], t + 0.08);
  }
  setTimeout(() => deck.gain.disconnect(), 400);
}

// Puts a tune's notes from `t` up to `until` on the audio clock. A note
// that is already late is skipped; a tune far behind (the tablet was busy)
// starts again from the top. A tune fading out ends every note by the time
// it has gone, so the two tunes of a crossfade never hold more than six.
// Nothing is made here but the notes themselves.
function musicFill(d, t, until) {
  const tune = d.tune;
  const ev = tune.events;
  if (d.t0 + ev[d.pos].s * tune.step < t - 2) {
    d.t0 = t + 0.05 - ev[0].s * tune.step;
    d.pos = 0;
  }
  for (let i = 0; i < 256; i++) {
    const e = ev[d.pos];
    const at = d.t0 + e.s * tune.step;
    if (at >= until) return;
    if (at >= t && at < d.until - 0.05 && (e.v || d.pass % 3 !== 2)) {
      const voice = music.voices[e.v];
      const end = Math.min(at + Math.min(e.d * tune.step, voice.ring), d.until);
      const k = d.n++ & 15;
      d.oscs[k] = musicNote(music.ac, d.gain, voice, e, at, end);
      d.starts[k] = at;
      d.ends[k] = end;
      music.notes++;
    }
    if (++d.pos === ev.length) {
      d.pos = 0;
      d.t0 += tune.loop;
      d.pass++;
    }
  }
}

document.addEventListener('visibilitychange', musicUpdate);
// iOS lets a page start or resume its sound only inside a tap (a touchend
// or a click), and stops it when the tablet sleeps or another app plays:
// the next tap brings it back.
for (const type of ['touchend', 'click']) {
  addEventListener(type, () => {
    const ac = music.ac;
    if (ac && ac.state && ac.state !== 'running' && ac.state !== 'closed') Sound.unlock();
  }, true);
}

// How many of a tune's notes sound right now.
function musicSounding(d) {
  const t = music.ac.currentTime;
  let n = 0;
  if (d) for (let k = 0; k < 16; k++) if (d.starts[k] <= t && t < d.ends[k]) n++;
  return n;
}

// What the music is doing, read-only (tools/check-flows.js).
const musicInfo = Object.freeze({
  get armed() { return music.armed; },
  get playing() { return music.on; },
  get place() { return music.on ? music.place : null; },
  get sound() { return music.sound; },
  get ducked() { return music.ducked; },
  get duck() { return music.duck ? music.duck.gain.value : 1; },
  get level() { return music.master ? music.master.gain.value : 0; },
  get fading() { return !!music.fading; },
  get notes() { return music.notes; },
  // Notes sounding right now.
  get voices() { return music.ac ? musicSounding(music.deck) + musicSounding(music.fading) : 0; },
});
