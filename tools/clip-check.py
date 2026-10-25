"""A fast acoustic check of every recorded clip, with no speech model, so a
broken recording fails CI (.github/workflows/polly.yml) before anyone hears it.

    python tools/clip-check.py                   # every clip in audio/tts/index.js
    python tools/clip-check.py --scope changed   # measure only clips that changed

Writes tools/clip-check.json: each line's measures and the rules it fails, a
count per rule and per voice, and the hash of the index it checked. A "lone"
line is one word ("cat", "cat!", "The"). The rules:
  silent    nothing audible: under -40 dBFS, or under 120 ms of sound (30 ms
            for a pure letter sound like "/t/")
  repeat    a lone word with a second word-like burst (said twice, or an added word)
  duration  far shorter or longer than the same line in the other voices,
            allowing for how fast each voice speaks
  lead-in   a lone word with over 80 ms more voiced sound before its loud
            part than in the other voices (a hum, "uh" or "the" before it)
  rising    a lone word whose pitch rises at the end, like a question
  gap       a silence inside a lone word over 0.5 s (in a longer line, 1.5 s)
  peak      true peak above -1 dBTP
tools/polly-build.py --mode fix records the failing lines again.
Needs numpy and ffmpeg.
"""
import argparse
import hashlib
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor

import numpy as np

import clipaudio as ca

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
REPORT = os.path.join(ROOT, 'tools', 'clip-check.json')
OUT = os.path.join(ROOT, 'audio', 'tts')
LONE = re.compile(r'^[a-z]+[!.]?$')
SOUND_LINE = re.compile(r'^/[a-z]+/$|\b[A-Z] says ')
RULES = ['silent', 'repeat', 'duration', 'lead-in', 'rising', 'gap', 'peak']


def words(text):
    return re.findall(r"[A-Za-z0-9']+", text)


def index():
    src = open(os.path.join(OUT, 'index.js')).read()
    return json.loads(src[src.index('{'):src.rindex('}') + 1])


def index_hash():
    try:
        return hashlib.sha1(open(os.path.join(OUT, 'index.js'), 'rb').read()).hexdigest()[:12]
    except OSError:
        return ''


def bursts(f):
    """Stretches of sound split by >= 180 ms under -45 dB (from the loudest
    frame): a lone word is one, as stop closures inside a word are shorter."""
    act = f['rel'] > -45
    out = []
    for a, b in ca.runs(act, gap=17):
        out.append({'ms': ca.ms(b - a), 'peak': float(f['rel'][a:b].max()),
                    'voiced': int(((f['per'][a:b] > 0.6) & (f['rel'][a:b] > -30)).sum()) * 10})
    return out


def measure(path, text):
    """The measures of one clip (see the rules above)."""
    raw = ca.decode(path, highpass=False)
    m = {'tp': round(ca.true_peak(raw), 1)}
    x = ca.highpass(raw)
    if len(x) < ca.WIN:
        return dict(m, dur=0, db=-120.0)
    f = ca.frames(x)
    loud = np.nonzero((f['rel'] > -40) & (f['e'] > -60))[0]
    if not len(loud):
        return dict(m, dur=0, db=-120.0)
    first, last = int(loud[0]), int(loud[-1])
    m['dur'] = ca.ms(last - first + 1)
    m['db'] = round(ca.active_db(x), 1)
    quiet = ca.runs(f['rel'][first:last + 1] < -45)
    m['gap'] = max((ca.ms(b - a) for a, b in quiet), default=0)
    if len(words(text)) == 1:
        bs = bursts(f)
        main = max(range(len(bs)), key=lambda i: bs[i]['peak'] + bs[i]['ms'] / 100) if bs else 0
        # Another burst that is loud, long and voiced is a word, not a click or a final t.
        m['extra'] = sum(1 for i, b in enumerate(bs) if i != main and b['peak'] > -12 and b['ms'] >= 200
                         and b['voiced'] >= 120)
        # The voiced sound before the first loud voiced part held 40 ms: a hum
        # or an "uh" before the word (a hiss like the f of "fun" doesn't count).
        start = int(np.argmax(f['rel'] > -35))
        loudv = (f['per'] > 0.5) & (f['rel'] > -8)
        nuc = next((i for i in range(start, f['n'] - 3) if loudv[i:i + 4].all()), int(np.argmax(f['rel'])))
        m['lead'] = ca.ms(((f['per'][start:nuc] > 0.5) & (f['rel'][start:nuc] > -35)).sum())
        f0 = f['f0'][(f['f0'] > 0) & (f['rel'] > -25)]
        if len(f0) >= 12:
            m['rise'] = round(float(np.median(f0[-8:]) / np.median(f0[:8])), 2)
    return m


def references(rep):
    """What a line's measures are compared with: per line, each voice's
    duration and lead-in; per voice, how long it takes over lines compared
    with the other voices."""
    dur, lead = {}, {}
    for key, c in rep['clips'].items():
        if 'dur' not in c or not c.get('dur'):
            continue
        v, t = key.split('|', 1)
        dur.setdefault(t, {})[v] = c['dur']
        if 'lead' in c:
            lead.setdefault(t, {})[v] = c['lead']
    ratios = {}
    for t, by in dur.items():
        if len(by) < 4 or SOUND_LINE.search(t):
            continue
        for v, d in by.items():
            others = [x for w, x in by.items() if w != v]
            ratios.setdefault(v, []).append(d / max(1, np.median(others)))
    factor = {v: float(np.median(r)) for v, r in ratios.items() if len(r) >= 10}
    return {'dur': dur, 'lead': lead, 'factor': factor}


def judge(voice, text, m, refs):
    """The rules this clip fails. Also notes in `m` how its duration compares
    with the other voices (dur_r) and how much later it starts (lead_x)."""
    fails = []
    lone = len(words(text)) == 1
    sound = bool(SOUND_LINE.search(text))
    if m.get('dur', 0) < (30 if sound else 120) or m.get('db', -120) < -40:
        return ['silent']
    if m.get('tp', -120) > -1.0:
        fails.append('peak')
    if m.get('gap', 0) > (500 if lone and not sound else 1500):
        fails.append('gap')
    if sound:
        return fails
    if lone and m.get('extra', 0):
        fails.append('repeat')
    others = [d for v, d in refs['dur'].get(text, {}).items() if v != voice]
    if len(others) >= 3:
        r = m['dur'] / max(1, np.median(others)) / refs['factor'].get(voice, 1.0)
        m['dur_r'] = round(float(r), 2)
        lo, hi = (0.55, 1.8) if lone else (0.6, 1.7)
        if not lo <= r <= hi:
            fails.append('duration')
    if lone and 'lead' in m:
        others = [x for v, x in refs['lead'].get(text, {}).items() if v != voice]
        if len(others) >= 3:
            m['lead_x'] = int(m['lead'] - np.median(others))
            if m['lead_x'] > 80:
                fails.append('lead-in')
    if LONE.match(text) and m.get('rise', 0) > 1.15:
        fails.append('rising')
    return fails


def load_report(path=REPORT):
    try:
        return json.load(open(path))
    except (OSError, ValueError):
        return {'clips': {}}


def write_report(rep, path=REPORT):
    """One clip per line, so the report merges and diffs well."""
    clips = rep.get('clips', {})
    head = {k: v for k, v in rep.items() if k != 'clips'}
    with open(path, 'w') as f:
        f.write('{\n')
        for k in sorted(head):
            f.write(f'{json.dumps(k)}: {json.dumps(head[k], sort_keys=True)},\n')
        f.write('"clips": {\n')
        f.write(',\n'.join(f'{json.dumps(k, ensure_ascii=False)}: {json.dumps(c, ensure_ascii=False, sort_keys=True)}'
                           for k, c in sorted(clips.items())))
        f.write('\n}\n}\n')


def summarise(rep):
    total, voices = {r: 0 for r in RULES}, {}
    for key, c in rep['clips'].items():
        v = key.split('|', 1)[0]
        row = voices.setdefault(v, {'clips': 0, **{r: 0 for r in RULES}})
        row['clips'] += 1
        for r in c.get('fails', []):
            total[r] += 1
            row[r] += 1
    rep['summary'] = total
    rep['voices'] = voices
    rep['failing'] = sum(1 for c in rep['clips'].values() if c.get('fails'))


def table(rep):
    lines = ['| voice | clips | ' + ' | '.join(RULES) + ' |', '|' + '---|' * (len(RULES) + 2)]
    for v, row in sorted(rep['voices'].items()):
        lines.append(f"| {v} | {row['clips']} | " + ' | '.join(str(row[r] or '') for r in RULES) + ' |')
    lines.append('| all | ' + str(len(rep['clips'])) + ' | ' + ' | '.join(str(rep['summary'][r]) for r in RULES) + ' |')
    return '\n'.join(lines)


def run(scope='all', jobs=4, path=REPORT):
    old = load_report(path)['clips']
    idx = index()
    todo, rep = [], {'clips': {}}
    for v, lines in sorted(idx.items()):
        for t, cid in sorted(lines.items()):
            key = f'{v}|{t}'
            prev = old.get(key, {})
            if scope == 'changed' and prev.get('id') == cid and 'dur' in prev:
                rep['clips'][key] = {k: x for k, x in prev.items() if k not in ('fails', 'dur_r', 'lead_x')}
            else:
                todo.append((key, v, t, cid))
    print(f'measuring {len(todo)} clips', flush=True)

    def one(job):
        key, v, t, cid = job
        try:
            return key, dict(measure(os.path.join(OUT, v, cid + '.mp3'), t), id=cid)
        except Exception as e:  # a clip that can't be read is a finding
            return key, {'id': cid, 'dur': 0, 'db': -120.0, 'error': str(e)[:200]}
    with ThreadPoolExecutor(jobs) as pool:
        for i, (key, m) in enumerate(pool.map(one, todo), 1):
            if old.get(key, {}).get('id') == m['id'] and old[key].get('unfixable'):
                m['unfixable'] = True
            rep['clips'][key] = m
            if i % 1000 == 0:
                print(f'  {i}/{len(todo)}', flush=True)
    refs = references(rep)
    for key, c in rep['clips'].items():
        v, t = key.split('|', 1)
        c['fails'] = judge(v, t, c, refs)
    rep['index'] = index_hash()
    summarise(rep)
    return rep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--scope', default='all', choices=['all', 'changed'])
    ap.add_argument('--jobs', type=int, default=os.cpu_count() or 4)
    ap.add_argument('--out', default=REPORT)
    args = ap.parse_args()
    rep = run(args.scope, args.jobs, args.out)
    write_report(rep, args.out)
    t = table(rep)
    print(t)
    print(f"{rep['failing']} of {len(rep['clips'])} clips fail a rule", flush=True)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as f:
            f.write('### Clip check\n\n' + t + '\n\n')


if __name__ == '__main__':
    sys.exit(main())
