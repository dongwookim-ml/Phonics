"""Listens to the recorded clips with a speech recogniser (Whisper) as a
second opinion beside tools/clip-check.py: does each clip say what it
should, with no "a", "the" or "uh" before a lone word and no missing or
extra words?

A recogniser is unsure of lone words, so a finding only fails a clip when
the acoustic measures of tools/clip-check.json back it (an "article" needs a
late start, an "extra" word a long or two-part clip, and so on); otherwise
the clip is listed as "unclear". Lone words are heard twice at most: with a
prompt full of fillers, so an added "uh" or "the" is written down, and with
the word as a hotword. The filler prompt is calibrated on each run against
the narrator's lone words that pass the acoustic checks: the strongest
prompt that hears those as just the word is used. A lone letter ("H", the
sticker book's tabs) passes when it is heard as the letter or its name
("H", "aitch"): a recogniser often mixes up b, d, e, g, p, t, v, z said
alone, so a different letter only fails it with the acoustics behind it,
while "h-i-e-j" (several sounds) is backed by its length.

Runs in GitHub Actions after recording (.github/workflows/polly.yml), where the
model can be downloaded. The report, tools/voice-check.json, keeps one entry
per line ("voice|text") and the hash of the index it checked:
    python tools/voice-check.py --shard 0 --shards 8 --out part0.json
    python tools/voice-check.py --merge part*.json      # into the report
tools/polly-build.py --mode fix records the failed lines again.
Needs faster-whisper and pronouncing (pip).
"""
import argparse
import glob
import hashlib
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
REPORT = os.path.join(ROOT, 'tools', 'voice-check.json')
CLIP_REPORT = os.path.join(ROOT, 'tools', 'clip-check.json')
MODEL = os.environ.get('ASR_MODEL', 'small.en')

NUMBERS = {'0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven',
           '8': 'eight', '9': 'nine', '10': 'ten'}
ARTICLES = {'a', 'an', 'the', 'uh', 'um'}
# The hero's default names, which a recogniser rarely spells right.
NAMES = {'yuna', 'max'}
# Letter sounds, pure sounds ("/m/") and letter names in a line; a
# recogniser can't judge them, so those lines are listed but never failed.
SOUNDS = re.compile(r'(?<= says )(ah|eh|ih|aw|uh|buh|kuh|duh|guh|puh|tuh|fff|hhh|mmm|nnn|sss|lll|rrr|ks|vvv|wuh|zzz'
                    r'|juh|yuh|kwuh|shh|ch|th|ng)\b|^/[a-z]+/$'
                    r'|(?<=\bwith )[A-Z](?=[.!?]?$)|\b[A-Z](?= (?:house|workshop|says)\b)')
# A letter on its own, and how a recogniser writes it when it is said right:
# the letter, its name, or a word said the same ("see" for C, "age" for H,
# whose name ends the same but voiced).
LETTER = re.compile(r'^([A-Z])[.!?]?$')
LETTER_HEARD = {
    'A': ['a', 'ay', 'aye'], 'B': ['b', 'bee', 'be'], 'C': ['c', 'see', 'sea', 'si'], 'D': ['d', 'dee'],
    'E': ['e', 'ee'], 'F': ['f', 'eff', 'ef'], 'G': ['g', 'gee', 'ji'], 'H': ['h', 'aitch', 'haitch', 'age'],
    'I': ['i', 'eye', 'aye', 'ai'], 'J': ['j', 'jay'], 'K': ['k', 'kay', 'cay', 'quay'],
    'L': ['l', 'el', 'ell', 'elle'], 'M': ['m', 'em'], 'N': ['n', 'en'], 'O': ['o', 'oh', 'owe'],
    'P': ['p', 'pee', 'pea'], 'Q': ['q', 'cue', 'queue', 'kew'], 'R': ['r', 'are', 'ar'], 'S': ['s', 'ess', 'es'],
    'T': ['t', 'tee', 'tea'], 'U': ['u', 'you', 'yew', 'ewe'], 'V': ['v', 'vee'],
    'W': ['w', 'double u', 'double you', 'doubleyou'], 'X': ['x', 'ex'], 'Y': ['y', 'why', 'wye'],
    'Z': ['z', 'zee', 'zed'],
}
# Statuses that fail a clip (backed by the acoustics). "unclear" is listed only.
FAILS = ('article', 'extra', 'silent', 'different')


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
    """What the recogniser alone says: ok, article (a lone word came out as
    "a cat"), extra, silent, different, or phonetic (letters and letter
    sounds in a line, not judged)."""
    want, got = tokens(text), tokens(heard)
    if SOUNDS.search(text):
        return 'phonetic'
    if not got:
        return 'silent'
    letter = LETTER.match(text)
    if letter:
        return judge_letter(letter.group(1), got)
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


def judge_letter(letter, got):
    """A lone letter heard as the words `got`: ok (the letter or its name),
    article ("a H", "uh, aitch"), extra (it and more: "h i e j"), or
    different."""
    names = LETTER_HEARD[letter]
    if ' '.join(got) in names:
        return 'ok'
    for i in range(1, len(got)):
        if ' '.join(got[i:]) in names and all(g in ARTICLES for g in got[:i]):
            return 'article'
    if any(g in names for g in got) or any(' ' in n and n in ' '.join(got) for n in names):
        return 'extra'
    return 'different'


def backed(status, a):
    """Do the acoustic measures (a tools/clip-check.json entry) agree with the
    recogniser's finding?"""
    fails = set(a.get('fails', []))
    if status == 'silent':
        return 'silent' in fails
    if status == 'article':
        return 'lead-in' in fails or a.get('lead_x', 0) >= 60
    if status == 'extra':
        return bool(fails & {'repeat', 'duration', 'gap', 'letter'}) or a.get('dur_r', 1) > 1.5
    if status == 'different':
        return bool(fails) or not 0.7 <= a.get('dur_r', 1) <= 1.4
    return False


def index():
    src = open(os.path.join(ROOT, 'audio', 'tts', 'index.js')).read()
    return json.loads(src[src.index('{'):src.rindex('}') + 1])


def index_hash():
    try:
        return hashlib.sha1(open(os.path.join(ROOT, 'audio', 'tts', 'index.js'), 'rb').read()).hexdigest()[:12]
    except OSError:
        return ''


def load_report():
    try:
        return json.load(open(REPORT))
    except (OSError, ValueError):
        return {'model': MODEL, 'clips': {}}


def acoustic_report():
    try:
        return json.load(open(CLIP_REPORT))['clips']
    except (OSError, ValueError, KeyError):
        return {}


def available():
    try:
        import faster_whisper  # noqa: F401
        return True
    except ImportError:
        return False


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
# are heard with a prompt like these first; calibrate() picks the first one
# that doesn't make it hear fillers in clean clips.
PROMPTS = ['Umm, uh, a, the... Uh, so, um, like, the... a', 'Um... uh, the.', None]
prompt = PROMPTS[0]


def hear(path, prompt=None, hint=None, timed=False):
    """(text, [[word, start, end, probability]] when `timed`)."""
    segs, _ = model().transcribe(samples(path), language='en', beam_size=5, temperature=0.0, word_timestamps=timed,
                                 condition_on_previous_text=False, vad_filter=False, initial_prompt=prompt,
                                 hotwords=hint)
    segs = list(segs)
    words = [[w.word.strip(), round(w.start, 2), round(w.end, 2), round(w.probability, 2)]
             for s in segs for w in (s.words or [])]
    return ' '.join(s.text.strip() for s in segs).strip(), words


def check_clip(voice, text, clip_id, acoustic=None):
    """The recogniser's verdict on one clip, failing it only where the
    acoustic measures (`acoustic`, a clip-check entry) agree."""
    path = os.path.join(ROOT, 'audio', 'tts', voice, clip_id + '.mp3')
    lone = len(tokens(text)) == 1 and not SOUNDS.search(text)
    heard, words = hear(path, prompt if lone else None, timed=lone)
    res = {'id': clip_id, 'heard': heard, 'status': judge(text, heard)}
    if lone:
        res['words'] = words
    if lone and res['status'] in FAILS:
        # A lone word is hard to recognise without context: listen again
        # with the word (a letter: the letter) as a hint.
        again, _ = hear(path, hint=text.rstrip('.!?') if LETTER.match(text) else tokens(text)[0])
        res['hinted'] = again
        if judge(text, again) == 'ok' and res['status'] in ('different', 'silent'):
            res['status'] = 'ok'
    if res['status'] in FAILS and acoustic is not None and not backed(res['status'], acoustic):
        res['asr'] = res['status']
        res['status'] = 'unclear'
    return res


def calibrate(clips, acoustic, n=40):
    """Picks the filler prompt on the narrator's lone words that pass the
    acoustic checks: the first of PROMPTS that hears at most 1 in 30 of them
    as anything but the word."""
    global prompt
    clean = sorted(t for t, cid in clips.items() if re.fullmatch(r'[a-z]+', t)
                   and acoustic.get(f'af_heart|{t}', {}).get('id') == cid and not acoustic[f'af_heart|{t}'].get('fails'))
    step = max(1, len(clean) // n)
    sample = clean[::step][:n]
    rates = {}
    for p in PROMPTS:
        bad = sum(judge(t, hear(os.path.join(ROOT, 'audio', 'tts', 'af_heart', clips[t] + '.mp3'), p)[0]) != 'ok'
                  for t in sample)
        rates[repr(p)] = f'{bad}/{len(sample)}'
        if bad * 30 <= len(sample):
            prompt = p
            break
    else:
        prompt = None
    print(f'filler prompt {prompt!r} (false findings on clean narrator words: {rates})', flush=True)
    return {'prompt': prompt, 'rates': rates, 'words': len(sample)}


def run(shard, shards, scope, out):
    old = load_report()['clips']
    acoustic = acoustic_report()
    idx = index()
    todo = []
    for voice, lines in sorted(idx.items()):
        for text, clip_id in sorted(lines.items()):
            key = f'{voice}|{text}'
            # Heard again: a clip that errored, and one listed as "phonetic"
            # that is judged now (a lone letter, since these rules).
            if scope == 'changed' and old.get(key, {}).get('id') == clip_id and old[key]['status'] != 'error' \
                    and not (old[key]['status'] == 'phonetic' and not SOUNDS.search(text)):
                continue
            if scope == 'short' and len(tokens(text)) > 4:
                continue
            todo.append((voice, text, clip_id))
    todo = todo[shard::shards]
    print(f'shard {shard}/{shards}: {len(todo)} clips', flush=True)
    cal = calibrate(idx.get('af_heart', {}), acoustic) if todo else None
    res = {}
    for i, (voice, text, clip_id) in enumerate(todo, 1):
        key = f'{voice}|{text}'
        a = acoustic.get(key)
        try:
            res[key] = check_clip(voice, text, clip_id, a if a and a.get('id') == clip_id else None)
        except Exception as e:  # a broken clip is a finding, not a crash
            res[key] = {'id': clip_id, 'heard': '', 'status': 'error', 'error': str(e)}
        if i % 200 == 0:
            print(f'  {i}/{len(todo)}', flush=True)
    json.dump({'clips': res, 'calibration': cal, 'index': index_hash()}, open(out, 'w'), ensure_ascii=False)


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
        part = json.load(open(p))
        rep['clips'].update(part['clips'] if isinstance(part.get('clips'), dict) else part)
        if part.get('calibration'):
            rep['calibration'] = part['calibration']
    # Forget lines the game no longer says.
    rep['clips'] = {k: v for k, v in rep['clips'].items()
                    if live.get(k.split('|', 1)[0], {}).get(k.split('|', 1)[1]) == v['id']}
    rep['model'] = MODEL
    rep['shards'] = len(parts)
    write_report(rep)
    print(json.dumps(rep['summary']))


def write_report(rep):
    """One clip per line, so the report merges and diffs well."""
    rep['summary'] = summary(rep['clips'])
    rep['index'] = index_hash()
    live = index()
    rep['unchecked'] = sum(1 for v, m in live.items() for t, i in m.items()
                           if rep['clips'].get(f'{v}|{t}', {}).get('id') != i)
    head = {k: v for k, v in rep.items() if k != 'clips'}
    with open(REPORT, 'w') as f:
        f.write('{\n')
        for k in sorted(head):
            f.write(f'{json.dumps(k)}: {json.dumps(head[k], ensure_ascii=False, sort_keys=True)},\n')
        f.write('"clips": {\n')
        f.write(',\n'.join(f'{json.dumps(k, ensure_ascii=False)}: {json.dumps(c, ensure_ascii=False, sort_keys=True)}'
                           for k, c in sorted(rep['clips'].items())))
        f.write('\n}\n}\n')


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
