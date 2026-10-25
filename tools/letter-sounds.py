"""Cuts the pure letter sounds of tools/letter-sounds.json out of clips that
are already recorded and reports how each cut went, so the cutter can be
tried without recording anything. tools/polly-build.py makes the real ones
from the narrator's words at build time (the "/m/" lines).

    python tools/letter-sounds.py                      # the narrator's set
    python tools/letter-sounds.py --voice am_eric      # from another voice's words
    python tools/letter-sounds.py --all-voices         # how often each cut works
    python tools/letter-sounds.py --out DIR --sheet DIR/sheet.png   # wav files and
                                                       # spectrograms (needs Pillow)

The checks only catch a cut in the wrong place. Listen to the sounds too:
tools/letter-sounds.html plays each one next to its word.
"""
import argparse
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

import numpy as np

import clipaudio as ca

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SPEC = os.path.join(ROOT, 'tools', 'letter-sounds.json')


def load_spec():
    return json.load(open(SPEC))['sounds']


def index():
    src = open(os.path.join(ROOT, 'audio', 'tts', 'index.js')).read()
    return json.loads(src[src.index('{'):src.rindex('}') + 1])


def anchors_for(spec, lines, folder):
    """(word, where, path) for the anchors this voice has recorded. A word
    may be listed as "moon" or "moon." (the declarative form)."""
    out = []
    for word, where in spec['anchors']:
        for t in (word, word + '.', word.capitalize() + '.'):
            if t in lines:
                out.append((word, where, os.path.join(folder, lines[t] + '.mp3')))
                break
    return out


def cut_all(voice, idx, spec):
    lines = idx.get(voice, {})
    folder = os.path.join(ROOT, 'audio', 'tts', voice)
    cache = {}

    def one(key):
        s = spec[key]
        anchors = []
        for word, where, path in anchors_for(s, lines, folder):
            if path not in cache:
                cache[path] = ca.decode(path)
            anchors.append((word, where, cache[path]))
        y, info = ca.best_cut(s['kind'], anchors)
        info['have'] = [a[0] for a in anchors]
        return key, y, info
    return [one(k) for k in spec]


# ---- Contact sheet ----------------------------------------------------------

def spectrogram(x, width):
    """dB spectrogram 0-8 kHz, 5 ms per column, 2 bins per row."""
    n, hop = 512, ca.SR // 200
    x = np.pad(np.asarray(x, np.float64), (n // 2, n))
    cols = max(1, (len(x) - n) // hop)
    F = x[np.arange(n)[None, :] + hop * np.arange(cols)[:, None]] * np.hanning(n)
    S = 20 * np.log10(np.abs(np.fft.rfft(F, axis=1))[:, :171] + 1e-6)
    img = np.full((171, width), -120.0)
    img[:, :min(width, cols)] = S[:width].T
    return img[::-1]


def colour(img, top):
    v = np.clip((img - (top - 70)) / 70, 0, 1)
    stops = np.array([[0, 0, 4], [40, 11, 84], [101, 21, 110], [159, 42, 99], [212, 72, 66], [245, 125, 21],
                      [250, 193, 39], [252, 255, 164]], np.float64)
    pos = v * (len(stops) - 1)
    i = np.clip(pos.astype(int), 0, len(stops) - 2)
    t = (pos - i)[..., None]
    return (stops[i] * (1 - t) + stops[i + 1] * t).astype(np.uint8)


def sheet(rows, path):
    """For each sound, the anchor word (0-8 kHz, 5 ms a column) with the part
    that was cut marked in blue, then the sound as the game plays it."""
    from PIL import Image, ImageDraw
    W1, W2, H, LH, PER = 180, 130, 171, 16, 4
    cw = W1 + W2 + 24
    img = Image.new('RGB', (PER * cw, -(-len(rows) // PER) * (H + LH + 8) + 4), (20, 20, 24))
    d = ImageDraw.Draw(img)
    for r, (key, word_x, src, y, label) in enumerate(rows):
        left, top = (r % PER) * cw, (r // PER) * (H + LH + 8) + 2
        d.text((left + 4, top), label, fill=(240, 240, 240))
        if word_x is not None:
            s = spectrogram(word_x, W1)
            img.paste(Image.fromarray(colour(s, s.max())), (left, top + LH))
            if src:
                a, b = (np.array(src + src[-1:] if len(src) == 1 else src) // 5).clip(0, W1 - 1)
                d.rectangle([left + a, top + LH, left + max(b, a + 2), top + LH + 3], fill=(80, 220, 255))
        if y is not None:
            s = spectrogram(y, W2)
            img.paste(Image.fromarray(colour(s, s.max())), (left + W1 + 6, top + LH))
    img.save(path)


def write_wav(x, path):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(ca.SR), '-ac', '1', '-i', '-',
                    path], input=np.asarray(x, '<f4').tobytes(), check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', default='af_heart')
    ap.add_argument('--all-voices', action='store_true')
    ap.add_argument('--out', help='write each sound (and its word) as a wav here')
    ap.add_argument('--sheet', help='write a spectrogram contact sheet (png)')
    ap.add_argument('--json', help='write the cut details here')
    ap.add_argument('--built', action='store_true', help='show the sounds as recorded (audio/tts/sounds.js) '
                    'instead of cutting them again')
    args = ap.parse_args()
    spec, idx = load_spec(), index()
    if args.built:
        src = open(os.path.join(ROOT, 'audio', 'tts', 'sounds.js')).read()
        built = json.loads(src[src.index('{'):src.rindex('}') + 1])
        folder = os.path.join(ROOT, 'audio', 'tts', 'af_heart')
        rows = []
        for key in spec:
            b = built.get(key)
            if not b:
                print(f'/{key}/  not recorded')
                rows.append((key, None, None, None, f'/{key}/ none'))
                continue
            y = ca.edge_trim(ca.decode(os.path.join(folder, b['clip'] + '.mp3')))
            wx = ca.decode(os.path.join(folder, b['anchorClip'] + '.mp3')) if b.get('anchorClip') else None
            probs = ca.check_sound(y, spec[key]['kind'])
            print(f"/{key}/  {1000 * len(y) / ca.SR:4.0f} ms from {b['anchor']!r} ({b['where']})"
                  + (f": {'; '.join(probs)}" if probs else ''))
            rows.append((key, wx, None, y, f"/{key}/ {b['anchor']} {b['where']}"))
        if args.sheet:
            sheet(rows, args.sheet)
            print('sheet:', args.sheet)
        return
    if args.all_voices:
        voices = sorted(idx)
        with ThreadPoolExecutor(4) as pool:
            res = dict(zip(voices, pool.map(lambda v: cut_all(v, idx, spec), voices)))
        print('sound  ' + ' '.join(f'{v[:8]:>8}' for v in voices))
        for i, key in enumerate(spec):
            cells = []
            for v in voices:
                _, y, info = res[v][i]
                miss = '    FAIL' if info['have'] else '    none'
                cells.append(f"{info['anchor'][:8]:>8}" if y is not None else miss)
            print(f'{key:6} ' + ' '.join(cells))
        ok = sum(y is not None for v in voices for _, y, _ in res[v])
        have = sum(bool(info['have']) for v in voices for _, _, info in res[v])
        print(f'{ok} of {have} sounds cut cleanly (where the voice has an anchor word)')
        if args.json:
            json.dump({v: {k: info for k, _, info in r} for v, r in res.items()}, open(args.json, 'w'), indent=1)
        return
    rows = []
    out = {}
    lines = idx.get(args.voice, {})
    folder = os.path.join(ROOT, 'audio', 'tts', args.voice)
    if args.out:
        os.makedirs(args.out, exist_ok=True)
    for key, y, info in cut_all(args.voice, idx, spec):
        out[key] = info
        word = info.get('anchor')
        if y is None:
            print(f'/{key}/  no clean cut: ' + '; '.join(f"{t['word']}: {t['problem']}" for t in info['tried'])
                  + ('' if info['have'] else ' (no anchor word recorded)'))
            rows.append((key, None, None, None, f'/{key}/ none'))
            continue
        tried = ', '.join(f"{t['word']} ({t['problem']})" for t in info['tried'])
        print(f"/{key}/  {info['ms']:4} ms from {word!r} ({info['where'] if 'where' in info else ''}, "
              f"{info['source']} ms){', after ' + tried if tried else ''}")
        wx = ca.decode(os.path.join(folder, next(lines[t] for t in (word, word + '.', word.capitalize() + '.')
                                                  if t in lines) + '.mp3'))
        rows.append((key, wx, info.get('source'), y, f"/{key}/ {word} {info['where']} {info['ms']} ms"))
        if args.out:
            write_wav(y, os.path.join(args.out, f'{key}.wav'))
            write_wav(np.concatenate([y, np.zeros(ca.SR // 3), wx]), os.path.join(args.out, f'{key}-{word}.wav'))
    print(f"{sum(1 for v in out.values() if 'anchor' in v)} of {len(spec)} sounds cut cleanly")
    if args.sheet:
        sheet(rows, args.sheet)
        print('sheet:', args.sheet)
    if args.json:
        json.dump(out, open(args.json, 'w'), indent=1)


if __name__ == '__main__':
    sys.exit(main())
