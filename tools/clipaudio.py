"""Audio helpers shared by tools/polly-build.py, tools/clip-check.py and
tools/letter-sounds.py: reading and writing clips with ffmpeg, per-frame
features (level, frequency bands, voicing, pitch), the clean-up every
recording gets (high-pass, edge trim, the voice-bar trim before b/d/g/j
words, cutting a carrier phrase), loudness, and cutting pure letter sounds
out of recorded words. Needs numpy and ffmpeg.
"""
import os
import re
import subprocess

import numpy as np

SR = 24000
HOP = SR // 100          # features every 10 ms
WIN = SR // 40           # over 25 ms
HIGHPASS = 'highpass=f=70'
EDGE_DB = -45            # quieter than this at either end is trimmed (as ffmpeg's silenceremove did)
PAD = 0.08               # silence left after the last sound
LIMIT_DB = -3.0          # sample-peak limit: after mp3 encoding the true peak stays under about -1.5 dBTP


def decode(src, highpass=True):
    """A clip (a path, or mp3 bytes) as mono float64 samples at SR."""
    af = ['-af', HIGHPASS] if highpass else []
    args = ['-i', src] if isinstance(src, str) else ['-i', '-']
    out = subprocess.run(['ffmpeg', '-loglevel', 'error', *args, *af, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         input=None if isinstance(src, str) else src, capture_output=True, check=True).stdout
    return np.frombuffer(out, '<f4').astype(np.float64)


def highpass(x, f=70):
    """A high-pass for analysis (ffmpeg's is used on recordings): drops what
    is under about f Hz, with a smooth edge."""
    if not len(x):
        return x
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    X *= np.clip((fr - 0.6 * f) / (0.4 * f), 0, 1)
    return np.fft.irfft(X, len(x))


def encode(x, path, gain_db=0.0, pad=PAD):
    """Writes samples as the game's mp3: gain, a peak limiter, `pad` seconds of
    silence at the end. Written beside the clip and moved in place, so a
    failed run never leaves half a clip that looks recorded."""
    af = f'volume={gain_db:.2f}dB,alimiter=limit={10 ** (LIMIT_DB / 20):.4f}:level=disabled:latency=1'
    if pad:
        af += f',apad=pad_dur={pad}'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-af', af, '-ac', '1', '-ar', str(SR), '-b:a', '48k', '-f', 'mp3', path + '.part'],
                   input=np.asarray(x, '<f4').tobytes(), check=True, capture_output=True)
    os.replace(path + '.part', path)


def db(x):
    return 10 * np.log10(np.maximum(x, 1e-12))


def frames(x):
    """Per-frame features, one frame every 10 ms:
    e      level in dBFS
    rel    level relative to the loudest frame
    lo/f1/mid/hi  energy (dB) in 80-500 Hz, 0.5-1 kHz, 1-3 kHz (vowel formants), 3.5-10 kHz (hiss)
    per    periodicity (0..1, voiced above about 0.6)
    f0     pitch in Hz where voiced (else 0)"""
    x = np.asarray(x, np.float64)
    if len(x) < WIN:
        x = np.pad(x, (0, WIN - len(x)))
    n = 1 + (len(x) - WIN) // HOP
    F = x[np.arange(WIN)[None, :] + HOP * np.arange(n)[:, None]]
    w = np.hanning(WIN)
    S = np.abs(np.fft.rfft(F * w, n=2 * WIN, axis=1)) ** 2
    fr = np.fft.rfftfreq(2 * WIN, 1 / SR)

    def band(a, b):
        return db(S[:, (fr >= a) & (fr < b)].sum(1))
    e = db(np.mean(F ** 2, 1))
    # Autocorrelation from the power spectrum, corrected for the window.
    ac = np.fft.irfft(S, axis=1)[:, :WIN]
    wac = np.correlate(w, w, 'full')[WIN - 1:]
    with np.errstate(divide='ignore', invalid='ignore'):
        ac = ac / np.maximum(ac[:, :1], 1e-12) / np.maximum(wac / wac[0], 0.25)[None, :]
    lo_lag, hi_lag = SR // 450, SR // 65
    seg = ac[:, lo_lag:hi_lag]
    k = np.argmax(seg, 1)
    per = seg[np.arange(n), k]
    # Prefer the shortest lag that is nearly as good (avoids octave errors).
    for div in (3, 2):
        kk = (k + lo_lag) // div - lo_lag
        ok = kk >= 0
        alt = np.where(ok, seg[np.arange(n), np.clip(kk, 0, seg.shape[1] - 1)], -1)
        better = ok & (alt > 0.85 * per)
        k = np.where(better, kk, k)
        per = np.where(better, alt, per)
    per = np.clip(np.nan_to_num(per), 0, 1)
    rel = e - e.max()
    f0 = np.where((per > 0.6) & (rel > -35), SR / (k + lo_lag), 0.0)
    return {'e': e, 'rel': rel, 'lo': band(80, 500), 'f1': band(500, 1000), 'mid': band(1000, 3000),
            'hi': band(3500, 10000), 'per': per, 'f0': f0, 'n': n}


def ms(i):
    """Frame index to milliseconds."""
    return int(i) * 1000 * HOP // SR


def edge_trim(x, thr_db=EDGE_DB, keep=0.005):
    """Drops what is quieter than `thr_db` (RMS over 20 ms) at both ends."""
    if not len(x):
        return x
    w = SR // 50
    p = np.convolve(x ** 2, np.ones(w) / w, 'same')
    loud = np.nonzero(p > 10 ** (thr_db / 10))[0]
    if not len(loud):
        return x[:0]
    a = max(0, loud[0] - w // 2 - int(keep * SR))
    b = min(len(x), loud[-1] + w // 2 + int(keep * SR))
    return x[a:b]


def fade(x, fin=0.01, fout=0.01):
    x = np.array(x, np.float64)
    a, b = min(len(x), int(fin * SR)), min(len(x), int(fout * SR))
    if a:
        x[:a] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, a))
    if b:
        x[len(x) - b:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b))
    return x


# ---- Clean-up of a recording ------------------------------------------------

def voice_bar(f):
    """Frames that hum without a vowel or a burst: nothing above 1 kHz to
    speak of, and under the word's loudest part. A b/d/g/j said with a long
    hum before its burst sounds like 'uh-bear' or 'the bear'."""
    return (f['mid'] - f['lo'] <= -20) & (f['hi'] - f['lo'] <= -20) & (f['rel'] <= -6)


def lead_hum(f, first, onset=0):
    """The frame where the hum before a word's burst ends (first if none).
    The first `onset` frames may also be a quiet ramp into the hum (a lone
    letter name's "B" starts that way)."""
    bar = voice_bar(f)
    i = first
    while i < f['n'] and (bar[i] or f['rel'][i] <= -35 or (i - first < onset and f['rel'][i] <= -20)):
        i += 1
    return i


def prevoice_trim(x, keep_ms=30, min_ms=60, onset=0):
    """For a lone word starting with b/d/g/j: shortens a hum before the burst
    to `keep_ms`. Returns (samples, milliseconds removed)."""
    f = frames(x)
    act = np.nonzero(f['rel'] > -35)[0]
    if not len(act):
        return x, 0
    first = act[0]
    i = lead_hum(f, first, onset)
    if ms(i - first) < min_ms or i >= f['n']:
        return x, 0
    start = first * HOP + (i - first) * HOP - keep_ms * SR // 1000
    y = fade(x[start:], fin=0.01, fout=0)
    return y, ms(i - first) - keep_ms


def carrier_cut(x, keep='after', min_gap=0.4):
    """A line recorded with a short carrier phrase and a pause ("Listen.
    <pause> Cat." keeps what comes after; "M says <pause> ham." keeps what
    comes before) cut at the pause next to the carrier, which is longer than
    a pause between sentences. Returns None when there is no such pause (the
    line is then recorded without a carrier)."""
    carrier_max = 1.6 if keep == 'after' else 0.9   # "Listen." / one word
    f = frames(x)
    quiet = f['rel'] < -45
    gaps = [(a, b) for a, b in runs(quiet) if a > 0 and b < f['n'] and ms(b - a) >= min_gap * 1000]
    if keep == 'after':
        gaps = [(a, b) for a, b in gaps if ms(a) <= carrier_max * 1000][:1]
    else:
        gaps = [(a, b) for a, b in gaps if ms(f['n'] - b) <= carrier_max * 1000][-1:]
    if not gaps:
        return None
    a, b = gaps[0]
    part = x[b * HOP:] if keep == 'after' else x[:a * HOP + WIN // 2]
    if len(part) < 0.12 * SR:
        return None
    return edge_trim(part)


def clean(x, lone_bdgj=False, carrier=None, letter=False):
    """The clean-up every recording gets after the high-pass: the carrier cut
    (when it was recorded in one), the edge trim, and for lone b/d/g/j words
    the voice-bar trim (for a lone letter name, `letter`, one that may start
    with a quiet ramp into its hum). Returns (samples, notes)."""
    notes = {}
    if carrier:
        y = carrier_cut(x, carrier)
        if y is None:
            raise ValueError('no pause to cut the carrier at')
        x = y
    x = edge_trim(x)
    if lone_bdgj and len(x):
        x, cut = prevoice_trim(x, onset=3 if letter else 0)
        if cut:
            notes['prevoice_ms'] = int(cut)
    return x, notes


# ---- Loudness and peaks -----------------------------------------------------

def loudness(x):
    """EBU R128 integrated loudness (LUFS, mono as ffmpeg measures it) and
    true peak (dBTP) of samples at SR, from ffmpeg's ebur128 filter."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                        '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'],
                       input=np.asarray(x, '<f4').tobytes(), capture_output=True)
    err = r.stderr.decode(errors='replace')
    i = re.findall(r'I:\s+(-?[\d.]+|-inf) LUFS', err)
    p = re.findall(r'Peak:\s+(-?[\d.]+|-inf) dBFS', err)
    num = lambda s: -120.0 if 'inf' in s else float(s)
    return (num(i[-1]) if i else -120.0), (num(p[-1]) if p else -120.0)


def active_db(x):
    """Level (dBFS) of the loud part of a clip: the 10 ms frames within 20 dB
    of its loudest."""
    if len(x) < WIN:
        return -120.0
    f = frames(x)
    keep = f['rel'] > -20
    return float(db(np.mean(10 ** (f['e'][keep] / 10))))


def true_peak(x):
    """True peak in dBTP: the sample peak after 4x oversampling."""
    if not len(x):
        return -120.0
    n = len(x)
    X = np.fft.rfft(x)
    y = np.fft.irfft(X, 4 * n) * 4
    return float(20 * np.log10(max(np.max(np.abs(y)), 1e-9)))


# ---- Pure letter sounds -----------------------------------------------------

class CutError(ValueError):
    pass


def stretch(x, n_out, voiced, seed=0):
    """Holds a steady sound for n_out samples. Voiced sounds are joined in
    pitch with WSOLA; hiss is laid down as random short grains."""
    x = np.asarray(x, np.float64)
    rng = np.random.default_rng(seed)
    if voiced:
        frame = min(int(0.03 * SR), len(x) // 3)
        hop = frame // 2
        tol = min(int(0.006 * SR), max(1, (len(x) - frame - hop) // 4))
        w = np.hanning(frame + 2)[1:-1]
        out = np.zeros(n_out + 2 * frame)
        norm = np.zeros_like(out)
        usable = len(x) - frame - hop - 2 * tol
        if usable <= 0:
            raise CutError('too short to stretch')
        steps = max(1, (n_out - frame) // hop + 1)
        prev = None
        for j in range(steps + 1):
            o = j * hop
            ideal = tol + int(round(usable * j / steps))
            if prev is None:
                pos = ideal
            else:
                nat = x[prev + hop:prev + hop + frame]
                best, pos = -2, ideal
                for d in range(-tol, tol + 1):
                    p = ideal + d
                    if p < 0 or p + frame > len(x):
                        continue
                    c = x[p:p + frame]
                    v = float(np.dot(c, nat)) / (np.linalg.norm(c) * np.linalg.norm(nat) + 1e-12)
                    if v > best:
                        best, pos = v, p
            out[o:o + frame] += x[pos:pos + frame] * w
            norm[o:o + frame] += w
            prev = pos
        y = out[:n_out] / np.maximum(norm[:n_out], 1e-3)
    else:
        frame = min(int(0.02 * SR), len(x) // 2)
        hop = frame // 2
        w = np.sin(np.pi * (np.arange(frame) + 0.5) / frame)
        out = np.zeros(n_out + 2 * frame)
        for o in range(0, n_out + frame, hop):
            p = int(rng.integers(0, len(x) - frame + 1))
            out[o:o + frame] += x[p:p + frame] * w
        y = out[frame // 2:frame // 2 + n_out]
    return y


def stretch_noise(x, n_out, seed=0):
    """Draws out a breath or a hiss that changes over time (the aspiration
    after p, the hiss of ch) to n_out samples: its short-time spectra, spread
    over the new length, said again with random phases. Grains of the sound
    itself would repeat and buzz like a voice."""
    x = np.asarray(x, np.float64)
    if n_out <= len(x):
        return x[:n_out].copy()
    n, hop = 256, 64
    w = np.hanning(n + 1)[:n]
    xp = np.pad(x, (n // 2, n))
    k = 1 + len(x) // hop
    P = np.abs(np.fft.rfft(xp[np.arange(n)[None, :] + hop * np.arange(k)[:, None]] * w, axis=1)) ** 2
    j = 1 + n_out // hop
    pos = np.arange(j) * len(x) / n_out
    i0 = np.clip(np.floor(pos).astype(int), 0, k - 1)
    t = (pos - np.floor(pos))[:, None]
    mag = np.sqrt(P[i0] * (1 - t) + P[np.minimum(i0 + 1, k - 1)] * t)
    rng = np.random.default_rng(seed)
    F = np.fft.irfft(mag * np.exp(2j * np.pi * rng.random(mag.shape)), n, axis=1) * w
    out = np.zeros(j * hop + n)
    for i in range(j):
        out[i * hop:i * hop + n] += F[i]
    y = out[n // 2:n // 2 + n_out]
    return y * np.sqrt(np.mean(x ** 2) / max(float(np.mean(y ** 2)), 1e-20))


def join(a, b, xf):
    """a then b, b's first xf samples laid over a's last with a crossfade."""
    xf = min(xf, len(a), len(b))
    r = np.linspace(0, np.pi / 2, xf)
    mid = a[len(a) - xf:] * np.cos(r) ** 2 + b[:xf] * np.sin(r) ** 2
    return np.concatenate([a[:len(a) - xf], mid, b[xf:]])


MS = SR // 1000


def band_env(x, a, b, win=0.01):
    """Level (dB) of x between a and b Hz every millisecond: entry i is the
    window of `win` seconds centred on i ms."""
    x = np.asarray(x, np.float64)
    n, k = int(win * SR), len(x) // MS
    if k < 1:
        return np.full(1, -120.0)
    xp = np.pad(x, (n // 2, n))
    S = np.abs(np.fft.rfft(xp[np.arange(n)[None, :] + MS * np.arange(k)[:, None]] * np.hanning(n), 2 * n,
                           axis=1)) ** 2
    fr = np.fft.rfftfreq(2 * n, 1 / SR)
    return db(S[:, (fr >= a) & (fr < b)].sum(1))


# What each kind of sound is, how it is found in its anchor word and how long
# it is held (`hold`, a steady sound) or lasts (`length`, a consonant that
# starts its word, see cut_onset()). `where`: the sound starts the word
# (initial), ends it (final), or is the word's first vowel (vowel).
# `cut` names the way a kind is cut: tools/polly-build.py puts the kind's
# entry in the clip id of its sounds, so changing `cut` or `length` gives
# those sounds, and every line made from them, new clips (and new URLs).
# `range`: the lengths check_sound() accepts.
KINDS = {
    'nasal':     {'hold': 0.55, 'voiced': True},
    'liquid':    {'hold': 0.55, 'voiced': True},
    'fricative': {'hold': 0.55, 'voiced': False},
    'vfricative': {'hold': 0.55, 'voiced': True},
    'breath':    {'hold': 0.40, 'voiced': False},
    'vowel':     {'hold': 0.40, 'voiced': True},
    'stop':      {'voiced': False, 'length': 0.13, 'range': [0.10, 0.17], 'cut': 'onset-2'},
    'vstop':     {'voiced': True, 'length': 0.115, 'range': [0.08, 0.15], 'cut': 'onset-2'},
    'affricate': {'voiced': False, 'length': 0.20, 'range': [0.15, 0.26], 'cut': 'onset-2'},
    'vaffricate': {'voiced': True, 'length': 0.18, 'range': [0.14, 0.25], 'cut': 'onset-2'},
    'kw':        {'voiced': False, 'length': 0.19, 'range': [0.14, 0.25], 'cut': 'onset-2'},
    'glide':     {'voiced': True, 'length': 0.19, 'range': [0.14, 0.25], 'cut': 'onset-2'},
    'cluster':   {'voiced': False, 'range': [0.08, 0.36]},
}
ONSET = ('stop', 'vstop', 'affricate', 'vaffricate', 'kw', 'glide')


def runs(mask, gap=0):
    """(start, end) of the runs of True, joining runs split by <= gap frames."""
    out = []
    i, n = 0, len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]:
                j += 1
            if out and i - out[-1][1] <= gap:
                out[-1] = (out[-1][0], j)
            else:
                out.append((i, j))
            i = j
        else:
            i += 1
    return out


def formants(f):
    """Frames with a vowel's formants: as much above 500 Hz as under it, near enough."""
    return (f['mid'] - f['lo'] > -15) | (f['f1'] - f['lo'] > -8)


def labels(f):
    """Frame classes used to find sounds in a word."""
    active = f['rel'] > -40
    voiced = (f['per'] > 0.6) & (f['rel'] > -35)
    vowel = voiced & formants(f) & (f['rel'] > -18)
    hiss = active & ~voiced & (f['hi'] > f['lo'] - 3)
    return {'active': active, 'voiced': voiced, 'vowel': vowel, 'hiss': hiss}


def burst_sample(x, start, end):
    """The sample where a stop's burst begins within [start, end): the first
    sharp rise of the high-frequency envelope."""
    seg = x[max(0, start):max(start + 1, end)]
    d = np.abs(np.diff(seg, prepend=seg[:1]))
    k = SR // 1000
    env = np.convolve(d, np.ones(k) / k, 'same')
    if not len(env) or env.max() <= 0:
        return start
    i = int(np.argmax(env > 0.3 * env.max()))
    return max(0, start) + i


def find_burst(x, start, end):
    """The sample where a stop's burst begins within [start, end): where the
    level above 2 kHz first comes within 20 dB of its peak there, followed
    back down its rise. The voice before a b, d, g or j has hardly anything
    that high, so it isn't taken for the burst."""
    hf = band_env(x, 2000, 10000, win=0.004)
    i0 = max(0, start // MS)
    seg = hf[i0:max(i0 + 2, end // MS)]
    peak = seg.max()
    i = int(np.argmax(seg >= peak - 20))
    while i > 0 and seg[i - 1] < seg[i] - 0.3 and seg[i - 1] > peak - 40:
        i -= 1
    return (i0 + i) * MS


def established(f, start):
    """The first frame from `start` where the vowel is established: voiced,
    with formants, within 8 dB of the word's loudest, three frames running."""
    ok = (f['per'] > 0.6) & (f['rel'] > -8) & formants(f)
    for k in range(start, f['n'] - 2):
        if ok[k:k + 3].all():
            return k
    raise CutError('no vowel after it')


def cut_onset(x, kind, lenient=False):
    """A consonant that starts its word, cut to about KINDS[kind]['length']
    with no vowel in it (phonics: /b/, not "buh"):
      stop        p t k: the burst and the breath after it (aspiration) up
                  to where the vowel's voice starts; the breath is drawn
                  out (stretch_noise) when the word's is shorter
      affricate   ch: the same, with its hiss
      kw          q: the same, k and the breath through rounded lips
      vstop       b d g: the voice before the burst (held longer: a longer
                  breath after the burst would make it p, t or k), the burst
                  and the release, faded out before the vowel's formants come
                  within 6 dB of their level in the vowel
      vaffricate  j: the voice before the burst, the burst, and the hiss
                  drawn out with that voice under it (a hiss alone is ch)
      glide       w y: the steady start, before it glides into the vowel, held
    `lenient` (when no anchor word cuts cleanly) lets b d g j go without the
    voice before the burst (b d g are then short and fade out a little into
    the vowel, j has no voice under its hiss) and a glide hold a less steady
    start of 20 ms.
    Returns (samples, info); info['margin'] is how far (dB) the cut stays
    from the vowel: under it in the band that tells (under 500 Hz for the
    vowel's voice, 500 Hz-3 kHz for b d g's formants), and for a glide how
    unlike the vowel's spectrum the held part is. Raises CutError."""
    f = frames(x)
    lab = labels(f)
    act = np.nonzero(lab['active'])[0]
    if not len(act):
        raise CutError('silent')
    first = int(act[0])
    est = established(f, first + 2)
    lo, form = band_env(x, 80, 500), band_env(x, 500, 3000)
    v = (est * HOP + WIN // 2) // MS
    lo_ref, form_ref = float(np.median(lo[v:v + 30])), float(np.median(form[v:v + 30]))
    length = int(KINDS[kind]['length'] * SR)
    info = {'kind': kind, 'where': 'initial'}

    def span(a, b):
        return float(np.max(a[max(0, b[0] // MS):max(b[0] // MS + 1, b[1] // MS)]))

    if kind == 'glide':
        loud = np.nonzero(lab['voiced'][first:est] & (f['rel'][first:est] > -15))[0]
        if not len(loud):
            raise CutError('no voiced start')
        a = first + int(loud[0])
        prof = np.stack([f['f1'] - f['lo'], f['mid'] - f['lo'], f['hi'] - f['lo']], 1)
        ref = np.median(prof[a:a + 3], 0)
        b = a
        tol = 9 if lenient else 6
        while b < est and lab['voiced'][b] and f['rel'][b] > -20 and np.abs(prof[b] - ref).max() <= tol:
            b += 1
        if b - a < (2 if lenient else 3):
            raise CutError(f'steady start of {ms(b - a)} ms')
        s, e = a * HOP + WIN // 2 - HOP // 2, b * HOP + WIN // 2 - HOP // 2
        # How unlike the vowel (30-70 ms into it) the held part is.
        vs = est * HOP + WIN // 2 + 30 * MS
        margin = float(np.sqrt(np.mean((shape(x[s:e]) - shape(x[vs:vs + 40 * MS])) ** 2)))
        if margin < 3:
            raise CutError(f'its start is like the vowel ({margin:.1f} dB apart)')
        y = fade(stretch(x[s:e], length, True, seed=e - s), fin=0.015, fout=0.06)
        info.update(ms=round(1000 * len(y) / SR), source=[s // MS, e // MS], margin=round(margin, 1))
        return y, info

    s0 = find_burst(x, first * HOP, est * HOP)
    start = max(0, s0 - 3 * MS)
    pre = None
    if kind in ('vstop', 'vaffricate'):
        # The voice before the burst (a voice bar: low, no formants).
        p0, p1 = first * HOP + 3 * MS, s0 - 4 * MS
        centres = [k for k in range(f['n']) if p0 <= k * HOP + WIN // 2 <= p1 + HOP]
        if p1 - p0 < 15 * MS:
            problem = f'voice before the burst of {max(0, p1 - p0) // MS} ms'
        elif not centres or (lab['voiced'] | voice_bar(f))[centres].mean() < 0.5:
            problem = 'no voice before the burst'
        else:
            problem = None
            pre = x[p0:p1]
        if problem and not lenient:
            raise CutError(problem)
    if kind == 'vstop':
        i = s0 // MS + 5
        while i < len(form) and form[i] < form_ref - (3 if lenient and pre is None else 6):
            i += 1
        end = (i - 2) * MS
        if end - s0 < 5 * MS:
            raise CutError(f'release of {max(0, end - s0) // MS} ms')
        rel = fade(x[start:end], fin=0, fout=min(0.012, 0.5 * (end - start) / SR))
        if pre is None:
            y = fade(rel, fin=0.002, fout=0)
        else:
            n_pre = int(np.clip(length - len(rel), len(pre), min(0.08 * SR, 3 * len(pre))))
            y = join(fade(stretch(pre, n_pre, True, seed=len(pre)), fin=0.012, fout=0), rel, 3 * MS)
        info.update(ms=round(1000 * len(y) / SR), source=[(start if pre is None else s0 - len(pre) - 4 * MS) // MS,
                                                          end // MS], margin=round(form_ref - span(form, (s0, end)), 1))
        return y, info
    # Voiceless after the burst: up to where the vowel's voice starts (the
    # level under 500 Hz within 10 dB of the vowel's).
    i = s0 // MS + (15 if kind == 'vaffricate' else 10)
    while i < len(lo) and lo[i] < lo_ref - 10:
        i += 1
    end = (i - 2) * MS
    if end - s0 < 25 * MS:
        raise CutError(f'release of {max(0, end - s0) // MS} ms')
    margin = lo_ref - span(lo, (s0 + (15 if kind == 'vaffricate' else 0) * MS, end))
    if margin < 8:
        raise CutError(f'the voice of the vowel {margin:.0f} dB under it')
    keep = s0 + 15 * MS                       # the burst itself, as it was said
    n_pre = int(min(0.06 * SR, 3 * len(pre))) if pre is not None else 0
    tail = x[keep:end]
    n_tail = int(np.clip(length - n_pre - (keep - start), len(tail), 2.5 * len(tail)))
    if kind == 'vaffricate' and pre is None:
        n_tail = len(tail)   # a longer hiss with no voice under it would be ch
    y = join(x[start:keep + 4 * MS], stretch_noise(tail, n_tail, seed=len(tail)), 4 * MS)
    y = fade(y, fin=0.002, fout=0.03 if kind == 'stop' else 0.05)
    if pre is not None:
        buzz = stretch(pre, len(y), True, seed=len(pre) + 1) * 10 ** (-3 / 20)
        y = y + fade(buzz, fin=0.01, fout=0.06)
        y = join(fade(stretch(pre, n_pre, True, seed=len(pre)), fin=0.012, fout=0), y, 3 * MS)
    info.update(ms=round(1000 * len(y) / SR), source=[(start if pre is None else s0 - len(pre) - 4 * MS) // MS,
                                                      end // MS], margin=round(margin, 1))
    return y, info


def cut_sound(x, kind, where, lenient=False):
    """Cuts a pure sound of `kind` (see KINDS) out of the samples of its anchor
    word, where it is the word's first sound (initial), its last (final) or
    its first vowel (vowel). Returns (samples, info). Raises CutError when
    the word doesn't show the sound clearly enough."""
    if kind in ONSET:
        if where != 'initial':
            raise CutError(f'a {kind} is only cut where it starts its word')
        return cut_onset(x, kind, lenient)
    f = frames(x)
    lab = labels(f)
    act = np.nonzero(lab['active'])[0]
    if not len(act):
        raise CutError('silent')
    first, last = int(act[0]), int(act[-1])
    vruns = [r for r in runs(lab['vowel'], gap=1) if r[1] - r[0] >= 4]
    if not vruns:
        raise CutError('no vowel found')
    v0, v1 = vruns[0][0], vruns[-1][1]
    info = {'kind': kind, 'where': where}
    hold = KINDS[kind].get('hold')
    peak_e = float(f['e'].max())

    def pick(lo_i, hi_i, pred, trim=(1, 1), min_frames=4):
        """The longest run of frames matching `pred` within [lo_i, hi_i)."""
        lo_i, hi_i = max(lo_i, 0), min(hi_i, f['n'])
        if hi_i - lo_i < min_frames:
            raise CutError(f'region of {ms(hi_i - lo_i)} ms')
        m = np.zeros(f['n'], bool)
        m[lo_i:hi_i] = pred[lo_i:hi_i]
        rs = runs(m, gap=1)
        if not rs:
            raise CutError('sound not found')
        a, b = max(rs, key=lambda r: r[1] - r[0])
        a, b = a + trim[0], b - trim[1]
        if b - a < min_frames:
            raise CutError(f'steady part of {ms(b - a)} ms')
        return a, b

    nasal = lab['voiced'] & (f['mid'] - f['lo'] < -12)
    if where == 'vowel':
        a, b = vruns[0]
        a, b = a + 2, b - 2
        if b - a < 5:
            raise CutError(f'vowel of {ms(b - a)} ms')
        if b - a > 18:   # the middle 180 ms
            c = (a + b) // 2
            a, b = c - 9, c + 9
    elif kind == 'vfricative':
        # v, z: a voice often starts the sound and a hiss ends it, so the
        # buzz and the hiss are each held and then laid together.
        lo_i, hi_i = (first, v0) if where == 'initial' else (v1, last + 1)
        hissy = lab['active'] & ~lab['vowel'] & (f['hi'] > f['lo'] - 10)
        parts = []
        for pred, voiced in ((lab['voiced'] & ~lab['vowel'], True), (hissy & ~lab['voiced'], False)):
            try:
                a, b = pick(lo_i, hi_i, pred, trim=(0, 1), min_frames=3)
            except CutError:
                continue
            seg = x[a * HOP + WIN // 2 - HOP // 2:b * HOP + WIN // 2 + HOP // 2]
            parts.append((stretch(seg, int(hold * SR), voiced, seed=len(seg)), [ms(a), ms(b) + 10]))
        if not parts:
            raise CutError('sound not found')
        if len(parts) == 2:
            # The buzz under the hiss is what makes it z and not s: keep it on top.
            (v, sv), (h, _) = parts
            lift = db(np.mean(h ** 2)) + 4 - db(np.mean(v ** 2))
            if lift > 0:
                parts[0] = (v * 10 ** (min(lift, 12) / 20), sv)
        y = fade(sum(p for p, _ in parts), fin=0.03, fout=0.08)
        info.update(ms=round(1000 * len(y) / SR), source=[min(s[0] for _, s in parts), max(s[1] for _, s in parts)],
                    layers=len(parts))
        return y, info
    elif kind in ('nasal', 'liquid', 'fricative', 'breath'):
        pred = {'nasal': nasal, 'liquid': lab['voiced'] & ~lab['vowel'] | nasal,
                'fricative': lab['hiss'], 'breath': lab['active'] & ~lab['voiced']}[kind]
        if where == 'initial':
            a, b = pick(first, v0, pred, trim=(0, 1) if kind == 'liquid' else (1, 2), min_frames=3)
        else:
            a, b = pick(v1, last + 1, pred, trim=(3, 3), min_frames=4)
    elif kind == 'cluster':
        # x = k + s at the end of the word: after the last vowel, the closure,
        # then the burst and the hiss.
        tail = np.zeros(f['n'], bool)
        tail[v1:last + 1] = True
        quiet = tail & (f['rel'] < -30)
        q = runs(quiet)
        if not q:
            raise CutError('no closure before the final k')
        cstart = q[0][1]
        s0 = burst_sample(x, cstart * HOP - HOP, cstart * HOP + WIN)
        end = (last + 1) * HOP + WIN // 2
        y = x[max(0, s0 - SR // 200):end]
        if len(y) < 0.08 * SR:
            raise CutError(f'final ks of {round(1000 * len(y) / SR)} ms')
        y = fade(y[:int(0.35 * SR)], fin=0.002, fout=0.06)
        info.update(ms=round(1000 * len(y) / SR), source=[round(1000 * s0 / SR), round(1000 * end / SR)])
        return y, info
    else:
        raise CutError(f'unknown kind {kind}')

    seg = x[a * HOP + WIN // 2 - HOP // 2:b * HOP + WIN // 2 + HOP // 2]
    info['source'] = [ms(a), ms(b) + 10]
    info['source_ms'] = ms(b - a) + 10
    y = stretch(seg, int(hold * SR), KINDS[kind]['voiced'], seed=len(seg))
    # Level: as loud as the word's own sound, but weak hiss (f, th, h) is
    # raised so a child hears it clearly.
    level = db(np.mean(seg ** 2))
    floor = {'fricative': -15, 'breath': -16}.get(kind)
    gain = 0.0
    if floor is not None and level - peak_e < floor:
        gain = min(12.0, floor - (level - peak_e))
    y = y * 10 ** (gain / 20)
    y = fade(y, fin=0.03, fout=0.08)
    info.update(ms=round(1000 * len(y) / SR), gain_db=round(gain, 1))
    return y, info


def shape(z):
    """The spectrum's shape (dB in 12 bands from 300 Hz to 5 kHz, less their
    mean) averaged over samples z."""
    edges = np.geomspace(300, 5000, 13)
    z = np.pad(np.asarray(z, np.float64), (0, max(0, WIN - len(z))))
    k = 1 + (len(z) - WIN) // HOP
    F = z[np.arange(WIN)[None, :] + HOP * np.arange(k)[:, None]] * np.hanning(WIN)
    S = (np.abs(np.fft.rfft(F, axis=1)) ** 2).mean(0)
    fr = np.fft.rfftfreq(WIN, 1 / SR)
    b = db(np.array([S[(fr >= a) & (fr < c)].sum() for a, c in zip(edges[:-1], edges[1:])]))
    return b - b.mean()


def drift(y):
    """How much the spectrum's shape (300 Hz-5 kHz) changes from the first
    third of a held sound to the last, in dB: a held sound that still
    glides into a vowel changes a lot."""
    n = len(y) // 3
    if n < WIN:
        return 0.0
    return float(np.sqrt(np.mean((shape(y[:n]) - shape(y[-n:])) ** 2)))


def check_sound(y, kind, lenient=False):
    """Acoustic checks on a cut sound. Returns a list of problems (empty when
    it looks right). They catch a cut in the wrong place (a vowel left after
    a consonant, voicing in p/t/k, a broken hold); they can't tell whether it
    sounds right to a listener, so the sounds are also listened to
    (tools/letter-sounds.html)."""
    f = frames(y)
    act = f['rel'] > -30
    if act.sum() < 2:
        return ['silent']
    voiced = (f['per'] > 0.6) & act
    formant = (f['mid'] - f['lo'] > -15) & act
    dur = len(y) / SR
    probs = []
    core = np.zeros(f['n'], bool)
    a = 4 if f['n'] > 16 else 0
    core[a:max(a + 1, f['n'] - 9)] = True   # without the fades
    core &= act
    vf = voiced[core].mean() if core.any() else 0
    hold = KINDS[kind].get('hold')
    if hold and abs(dur - hold) > 0.08:
        probs.append(f'held {dur:.2f} s, not {hold:.2f} s')
    span = KINDS[kind].get('range')
    if span and not (0 if lenient else span[0]) <= dur <= span[1]:
        probs.append(f'{dur * 1000:.0f} ms long')
    if kind in ('nasal',):
        if vf < 0.8:
            probs.append(f'voiced in {vf:.0%} of the hold')
        if formant[core].mean() > 0.1:
            probs.append('vowel formants in a nasal')
    elif kind == 'liquid':
        if vf < 0.8:
            probs.append(f'voiced in {vf:.0%} of the hold')
    elif kind in ('fricative', 'breath'):
        if vf > 0.15:
            probs.append(f'voiced in {vf:.0%} of the hiss')
    elif kind == 'vfricative':
        if vf < 0.5:
            probs.append(f'voiced in {vf:.0%} of the hold')
    elif kind == 'vowel':
        if vf < 0.85:
            probs.append(f'voiced in {vf:.0%} of the vowel')
        if formant[core].mean() < 0.7:
            probs.append('weak vowel formants')
    elif kind in ('stop', 'affricate'):
        # p t k ch are voiceless to the end: a voice there is the vowel's.
        if voiced[:max(1, f['n'] - 1)].sum() > 1:
            probs.append('voicing after the burst')
    elif kind in ('vstop', 'vaffricate'):
        # The voice before the burst is low and has no formants; a vowel has both.
        if (voiced & formants(f) & (f['rel'] > -6)).sum() > 1:
            probs.append('a vowel after the burst')
        mid = slice(f['n'] // 4, max(f['n'] // 4 + 1, 3 * f['n'] // 4))
        if kind == 'vaffricate' and not lenient and np.median((f['lo'] - f['hi'])[mid]) < -15:
            probs.append('no voice under the hiss (that is ch)')
    elif kind == 'glide':
        if vf < 0.8:
            probs.append(f'voiced in {vf:.0%} of the hold')
        d = drift(y[int(0.03 * SR):len(y) - int(0.06 * SR)])
        if d > 6:
            probs.append(f'spectrum drifts {d:.1f} dB')
    if hold and core.sum() > 4:
        # A held sound should hold steady: no pumping, no glide into a vowel.
        e = f['e'][core]
        if np.ptp(e) > 12:
            probs.append(f'level swings {np.ptp(e):.0f} dB')
        d = drift(y[int(0.04 * SR):len(y) - int(0.09 * SR)])
        if d > 6:
            probs.append(f'spectrum drifts {d:.1f} dB')
    return probs


def best_cut(kind, anchors):
    """The first clean cut from a list of (word, where, samples); when none
    cuts cleanly, the first that cuts leniently (see cut_onset(); then
    info['lenient'] is True). Returns (samples, info); samples is None when
    no anchor gave a cut, and info['tried'] says why each one failed."""
    tried = []
    for lenient in (False, True) if kind in ONSET else (False,):
        for word, where, x in anchors:
            try:
                y, info = cut_sound(x, kind, where, lenient)
            except CutError as e:
                tried.append({'word': word, 'problem': str(e)})
                continue
            probs = check_sound(y, kind, lenient)
            if probs:
                tried.append({'word': word, 'problem': '; '.join(probs)})
                continue
            info.update(anchor=word, tried=tried)
            if lenient:
                info['lenient'] = True
            return y, info
    return None, {'tried': tried}
