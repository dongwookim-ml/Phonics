"""The gate before deploying the recordings: exits 1 (and says why) unless
  - every phrase in tools/tts-phrases.json has a clip in audio/tts/index.js,
    and every clip in the index exists,
  - every clip was recorded on its voice's engine (VOICES in
    tools/polly-build.py, as tools/polly-clips.json records it),
  - tools/clip-check.json and tools/voice-check.json were made for this very
    index (they store its hash), and no clip fails them.

    python tools/check-recordings.py
    python tools/check-recordings.py --allow-unfixable   # lines that kept an older clip
                                                         # after every way failed don't count
Needs numpy (tools/polly-build.py imports it).
"""
import argparse
import hashlib
import importlib.util
import json
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
TOOLS = os.path.join(ROOT, 'tools')


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(TOOLS, name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def read(path, default=None):
    try:
        return json.load(open(path))
    except (OSError, ValueError):
        return default


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--allow-unfixable', action='store_true')
    args = ap.parse_args()
    pb = load('polly-build')
    problems, warnings = [], []

    def report(title, items, into):
        if items:
            n = 25 if into is problems else 5
            into.append(f'{title}: {len(items)}')
            into.extend(f'    {x}' for x in items[:n])
            if len(items) > n:
                into.append(f'    ... {len(items) - n} more')

    src = open(os.path.join(ROOT, 'audio', 'tts', 'index.js'), 'rb').read()
    digest = hashlib.sha1(src).hexdigest()[:12]
    text = src.decode()
    index = json.loads(text[text.index('{'):text.rindex('}') + 1])
    phrases = json.load(open(os.path.join(TOOLS, 'tts-phrases.json')))
    report('phrases with no clip', [f"{p['voice']}|{p['text']}" for p in phrases
                                    if p['text'] not in index.get(p['voice'], {})], problems)
    report('clips in the index that are missing', [f'{v}/{i}.mp3' for v, m in index.items() for i in set(m.values())
                                                   if not os.path.exists(os.path.join(ROOT, 'audio', 'tts', v,
                                                                                      i + '.mp3'))], problems)

    clips = read(os.path.join(TOOLS, 'polly-clips.json'), {})
    wrong, untracked, fallback, norate = [], [], [], []
    for v, m in index.items():
        want = pb.VOICES[v][1] if v in pb.VOICES else None
        for t, i in m.items():
            rec = clips.get(v, {}).get(i)
            if rec is None:
                untracked.append(f'{v}|{t}')
                continue
            engine = rec.get('engine', '') if isinstance(rec, dict) else rec
            used = {e.replace(' (no rate)', '') for e in engine.split(' + ')}
            if used - {want, 'cut'}:
                wrong.append(f'{v}|{t}: {engine}, not {want}')
            if '(no rate)' in engine:
                norate.append(f'{v}|{t}')
            if isinstance(rec, dict) and rec.get('fallback'):
                fallback.append(f'{v}|{t}')
    report('clips recorded on another engine', wrong, problems)
    report('clips with no record of how they were made', untracked, problems)
    report('letter-sound lines read with phonemes (their pure sound is missing)', fallback, warnings)
    report('clips recorded without their speed (the engine refused <prosody rate>)', norate, warnings)

    # Lines the fix gave up on after every way of saying them (tools/polly-build.py
    # marks them in clip-check.json, whichever check they failed).
    given_up = {k for k, c in (read(os.path.join(TOOLS, 'clip-check.json'), {}) or {}).get('clips', {}).items()
                if c.get('unfixable')}
    for name, fails_of in (('clip-check', lambda c: c.get('fails')),
                           ('voice-check', lambda c: c.get('status') in ('article', 'extra', 'silent', 'different',
                                                                          'error'))):
        rep = read(os.path.join(TOOLS, f'{name}.json'))
        if not rep:
            problems.append(f'tools/{name}.json is missing')
            continue
        if rep.get('index') != digest:
            problems.append(f"tools/{name}.json checked index {rep.get('index') or '(unknown)'}, not this one ({digest})")
        live = {f'{v}|{t}': i for v, m in index.items() for t, i in m.items()}
        failing = [(k, f"{k}: {fails_of(c) if name == 'clip-check' else c.get('status')}")
                   for k, c in sorted(rep.get('clips', {}).items()) if live.get(k) == c.get('id') and fails_of(c)]
        allowed = [x for k, x in failing if args.allow_unfixable and k in given_up]
        report(f'clips failing {name}', [x for k, x in failing if x not in allowed], problems)
        report(f'clips failing {name} that no way of saying fixed', allowed, warnings)
        unchecked = [k for k, i in live.items() if rep.get('clips', {}).get(k, {}).get('id') != i]
        report(f'clips {name} has not checked', unchecked, problems if name == 'clip-check' else warnings)

    for w in warnings:
        print(('warning: ' if not w.startswith('    ') else '') + w)
    for p in problems:
        print(p)
    print('recordings OK' if not problems else f'{sum(1 for p in problems if not p.startswith("    "))} problem(s)')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
