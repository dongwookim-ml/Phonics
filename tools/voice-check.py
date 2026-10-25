"""Listens to the recorded clips with a speech recogniser (Whisper) and checks
that each one says what it should: no added "a" or "the" before a lone word,
no missing or extra words.

Runs in GitHub Actions after recording (.github/workflows/polly.yml), where the
model can be downloaded. The report, tools/voice-check.json, keeps one entry
per line ("voice|text"), so a later run only listens to clips that changed:
    python tools/voice-check.py --shard 0 --shards 8 --out part0.json
    python tools/voice-check.py --merge part*.json      # into the report
tools/polly-build.py --mode fix records the failed lone words again.
Needs faster-whisper and pronouncing (pip).
"""
import argparse
import glob
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
REPORT = os.path.join(ROOT, 'tools', 'voice-check.json')
MODEL = os.environ.get('ASR_MODEL', 'small.en')

NUMBERS = {'0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven',
           '8': 'eight', '9': 'nine', '10': 'ten'}
ARTICLES = {'a', 'an', 'the', 'uh', 'um'}
# The hero's default names, which a recogniser rarely spells right.
NAMES = {'yuna', 'max'}
# Letter sounds and letter names are said from phonemes (the same patterns
# as tools/polly-build.py); a recogniser can't judge them, so those lines are
# listed but never failed.
SOUNDS = re.compile(r'(?<= says )(ah|eh|ih|aw|uh|buh|kuh|duh|guh|puh|tuh|fff|hhh|mmm|nnn|sss|lll|rrr|ks)\b'
                    r'|^[A-Z](?=[.!?]?$)|(?<=\bwith )[A-Z](?=[.!?]?$)|\b[A-Z](?= (?:house|workshop|says)\b)')


def tokens(text):
    t = re.sub(r"[^a-z0-9' ]+", ' ', text.lower().replace('-', ' '))
    return [NUMBERS.get(w, w) for w in t.split()]


_phones = {}


def sounds_like(a, b):
    """Same word, or words that are said the same (sun / son)."""
    if a == b or a in NAMES or b in NAMES:
        return True
    import pronouncing
    pa = _phones.setdefault(a, set(pronouncing.phones_for_word(a)))
    pb = _phones.setdefault(b, set(pronouncing.phones_for_word(b)))
    return bool(pa & pb)


def distance(a, b):
    """Word edit distance, counting homophones as the same word."""
    d = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        prev, d[0] = d[0], i
        for j, y in enumerate(b, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (0 if sounds_like(x, y) else 1))
    return d[len(b)]


def judge(text, heard):
    """ok, article (a lone word came out as "a cat"), extra, silent,
    different, or phonetic (letters and letter sounds, not judged)."""
    want, got = tokens(text), tokens(heard)
    if SOUNDS.search(text):
        return 'phonetic'
    if not got:
        return 'silent'
    if len(want) == 1:
        w = want[0]
        if len(got) == 1 and sounds_like(got[0], w):
            return 'ok'
        if sounds_like(got[-1], w) and all(g in ARTICLES for g in got[:-1]):
            return 'article'
        if any(sounds_like(g, w) for g in got):
            return 'extra'
        return 'different'
    errors = distance(want, got)
    # Long lines may differ in a small word the recogniser mishears.
    return 'ok' if errors == 0 or errors <= len(want) // 8 else 'different'


def index():
    src = open(os.path.join(ROOT, 'audio', 'tts', 'index.js')).read()
    return json.loads(src[src.index('{'):src.rindex('}') + 1])


def load_report():
    try:
        return json.load(open(REPORT))
    except (OSError, ValueError):
        return {'model': MODEL, 'clips': {}}


_model = None


def model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        _model = WhisperModel(MODEL, device='cpu', compute_type='int8', cpu_threads=os.cpu_count() or 4)
    return _model


def samples(path):
    """The clip as 16 kHz mono floats (decoded with ffmpeg, which is steadier
    than faster-whisper's own decoder across PyAV versions)."""
    import subprocess
    import numpy as np
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


# Whisper leaves out "uh" and "um" unless the prompt shows them, so lone words
# are heard with this prompt first: an added "uh" or "a" then shows up.
FILLERS = 'Umm, uh, a, the... Uh, so, um, like, the... a'


def hear(path, prompt=None, hint=None):
    segs, _ = model().transcribe(samples(path), language='en', beam_size=5, temperature=0.0, without_timestamps=True,
                                 condition_on_previous_text=False, vad_filter=False, initial_prompt=prompt, hotwords=hint)
    return ' '.join(s.text.strip() for s in segs).strip()


def check_clip(voice, text, clip_id):
    path = os.path.join(ROOT, 'audio', 'tts', voice, clip_id + '.mp3')
    lone = len(tokens(text)) == 1 and not SOUNDS.search(text)
    heard = hear(path, FILLERS if lone else None)
    status = judge(text, heard)
    if lone and status in ('different', 'silent'):
        # A lone word is hard to recognise without context: listen again
        # with the word as a hint, so only a clip that really says
        # something else (or mumbles) fails.
        again = hear(path, hint=tokens(text)[0])
        if judge(text, again) == 'ok':
            return {'id': clip_id, 'heard': heard, 'hinted': again, 'status': 'ok'}
    return {'id': clip_id, 'heard': heard, 'status': status}


def run(shard, shards, scope, out):
    old = load_report()['clips']
    todo = []
    for voice, lines in sorted(index().items()):
        for text, clip_id in sorted(lines.items()):
            key = f'{voice}|{text}'
            if scope == 'changed' and old.get(key, {}).get('id') == clip_id and old[key]['status'] != 'error':
                continue
            if scope == 'short' and len(tokens(text)) > 4:
                continue
            todo.append((voice, text, clip_id))
    todo = todo[shard::shards]
    print(f'shard {shard}/{shards}: {len(todo)} clips', flush=True)
    res = {}
    for i, (voice, text, clip_id) in enumerate(todo, 1):
        try:
            res[f'{voice}|{text}'] = check_clip(voice, text, clip_id)
        except Exception as e:  # a broken clip is a finding, not a crash
            res[f'{voice}|{text}'] = {'id': clip_id, 'heard': '', 'status': 'error', 'error': str(e)}
        if i % 200 == 0:
            print(f'  {i}/{len(todo)}', flush=True)
    json.dump(res, open(out, 'w'), ensure_ascii=False)


def summary(clips):
    counts = {}
    for key, c in clips.items():
        counts.setdefault(c['status'], 0)
        counts[c['status']] += 1
    return counts


def merge(parts):
    rep = load_report()
    live = index()
    for p in parts:
        rep['clips'].update(json.load(open(p)))
    # Forget lines the game no longer says.
    rep['clips'] = {k: v for k, v in rep['clips'].items()
                    if live.get(k.split('|', 1)[0], {}).get(k.split('|', 1)[1]) == v['id']}
    rep['model'] = MODEL
    rep['summary'] = summary(rep['clips'])
    write_report(rep)
    print(json.dumps(rep['summary']))


def write_report(rep):
    with open(REPORT, 'w') as f:
        json.dump(rep, f, ensure_ascii=False, indent=0, sort_keys=True)
        f.write('\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--shard', type=int, default=0)
    ap.add_argument('--shards', type=int, default=1)
    ap.add_argument('--scope', default='changed', choices=['changed', 'short', 'all'])
    ap.add_argument('--out', default='voice-check-part.json')
    ap.add_argument('--merge', nargs='*')
    args = ap.parse_args()
    if args.merge is not None:
        merge([p for pat in args.merge for p in glob.glob(pat)])
    else:
        run(args.shard, args.shards, args.scope, args.out)


if __name__ == '__main__':
    sys.exit(main())
