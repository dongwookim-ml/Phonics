// Speech (letter sounds, words) and small synthesized sound effects.

const Sound = (() => {
  let voice = null;
  let muted = false;
  let audioCtx = null;

  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = speechSynthesis.getVoices().filter(v => v.lang && v.lang.startsWith('en'));
    // Prefer natural sounding US voices when the platform has them.
    const prefs = ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Karen'];
    voice = prefs.map(n => voices.find(v => v.name.includes(n))).find(Boolean)
      || voices.find(v => v.lang === 'en-US') || voices[0] || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  // Speak a list of phrases in order. Each item is a string or
  // { text, rate, pitch, file } where `file` is an optional recording.
  function say(parts) {
    if (muted) return;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    const queue = (Array.isArray(parts) ? parts : [parts]).map(p => typeof p === 'string' ? { text: p } : p);
    playNext(queue);
  }

  function playNext(queue) {
    const item = queue.shift();
    if (!item) return;
    const next = () => playNext(queue);
    if (USE_RECORDINGS && item.file) {
      const a = new Audio(item.file);
      a.onended = next;
      a.play().catch(() => speak(item, next));
    } else {
      speak(item, next);
    }
  }

  function speak(item, done) {
    if (!('speechSynthesis' in window)) { done(); return; }
    const u = new SpeechSynthesisUtterance(item.text);
    if (voice) u.voice = voice;
    u.lang = 'en-US';
    u.rate = item.rate || 0.8;
    u.pitch = item.pitch || 1.15;
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
    tap: () => notes([[660, 0, 0.08]]),
    step: () => notes([[220, 0, 0.04]], 'triangle', 0.03),
    correct: () => notes([[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.25]]),
    wrong: () => notes([[300, 0, 0.12], [250, 0.12, 0.2]], 'triangle', 0.08),
    party: () => notes([[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.4], [784, 0.5, 0.1], [1047, 0.6, 0.5]]),
    toggleMute() { muted = !muted; if (muted && 'speechSynthesis' in window) speechSynthesis.cancel(); return muted; },
    unlock: ctx,
  };
})();
