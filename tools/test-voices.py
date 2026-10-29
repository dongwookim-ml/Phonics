"""Checks of the voice tools that run anywhere, with no AWS keys and no
speech model: the pure letter sounds cut from the narrator's committed
words (long enough, and no vowel in them), the clip ids a new cut gives,
how a lone letter is said and judged, and the clip check's letter rule.

    python tools/test-voices.py          # exits 1 if a check fails
    python tools/test-voices.py --plan   # also: what the next workflow run
                                         # would record, cut and fix (nothing
                                         # is recorded or written)
Needs numpy and ffmpeg.
"""
import importlib.util
import json
import os
import sys

import numpy as np

import clipaudio as ca

TOOLS = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(TOOLS, '..', 'audio', 'tts')
NARRATOR = 'af_heart'
# The shortest each kind of initial consonant may be (seconds): long enough
# to hear clearly, as asked ("발음 길이를 조금 더 늘여줘"); the old cuts were
# 65 ms for a stop and 82-145 ms for the rest.
SHORTEST = {'stop': 0.12, 'vstop': 0.09, 'affricate': 0.18, 'vaffricate': 0.17, 'kw': 0.18, 'glide': 0.18}

failures = []


def check(ok, what):
    if not ok:
        failures.append(what)
        print('  FAIL', what)


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(TOOLS, name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def narrator_clip(text):
    src = open(os.path.join(OUT, 'index.js')).read()
    cid = json.loads(src[src.index('{'):src.rindex('}') + 1]).get(NARRATOR, {}).get(text)
    path = cid and os.path.join(OUT, NARRATOR, cid + '.mp3')
    return ca.decode(path) if path and os.path.exists(path) else None


def test_cuts():
    """Every sound cuts cleanly from the narrator's words, the initial
    consonants at their new lengths, with no vowel in them."""
    print('pure sounds cut from the narrator\'s words:')
    sounds = json.load(open(os.path.join(TOOLS, 'letter-sounds.json')))['sounds']
    for key, s in sounds.items():
        anchors = [(w, where, x) for w, where in s['anchors'] for x in [narrator_clip(w)] if x is not None]
        y, info = ca.best_cut(s['kind'], anchors)
        check(y is not None, f'/{key}/ cuts cleanly: ' + '; '.join(f"{t['word']}: {t['problem']}" for t in info['tried']))
        if y is None:
            continue
        dur = len(y) / ca.SR
        print(f"  /{key}/ {s['kind']:10s} {1000 * dur:4.0f} ms from {info['anchor']!r}"
              + (f", {info['margin']} dB from the vowel" if 'margin' in info else ''))
        check(not info.get('lenient'), f'/{key}/ cut without leniency')
        if s['kind'] in SHORTEST:
            check(dur >= SHORTEST[s['kind']], f'/{key}/ lasts at least {SHORTEST[s["kind"]] * 1000:.0f} ms')
            check(info['margin'] >= 6, f'/{key}/ stays 6 dB from the vowel ({info["margin"]})')
        if 'lift' in ca.KINDS[s['kind']]:
            # Raised as the build raises it: loud enough to make out next to its word.
            word = next(x for w, _, x in anchors if w == info['anchor'])
            gain = ca.lift_gain(y, s['kind'], word)
            under = ca.active_db(word) - (ca.active_db(y) + gain)
            print(f'      raised {gain:4.1f} dB: {under:4.1f} dB under {info["anchor"]!r}')
            check(under <= 8, f'/{key}/ is at most 8 dB under its word once raised ({under:.1f})')


def test_checks_catch_a_vowel():
    """The way the old cuts went wrong (a vowel after the consonant) fails
    the checks."""
    print('a vowel left in a cut is caught:')
    for word, kind, problem in (('cat', 'stop', 'voicing after the burst'), ('chick', 'affricate', 'voicing after'),
                                ('bus', 'vstop', 'a vowel after the burst'), ('web', 'glide', 'spectrum drifts')):
        x = narrator_clip(word)
        if x is None:
            print(f'  ({word} is not recorded: skipped)')
            continue
        y, info = ca.cut_onset(x, kind)
        # The same start, but running on into the vowel.
        f = ca.frames(x)
        end = (ca.established(f, 2) + 8) * ca.HOP
        start = info['source'][0] * ca.MS if kind == 'glide' else 0
        bad = ca.fade(x[start:max(end, start + len(y))], 0.015, 0.06)
        probs = ca.check_sound(bad, kind)
        print(f'  {word} into its vowel as /{kind}/: {probs}')
        check(any(problem in p for p in probs), f'{word}: a cut into the vowel fails "{problem}"')


def test_stretch_noise():
    """Drawing out a breath keeps its level and adds no buzz."""
    rng = np.random.default_rng(1)
    x = rng.standard_normal(ca.SR // 10) * 0.05
    y = ca.stretch_noise(x, ca.SR // 5)
    check(len(y) == ca.SR // 5, 'stretch_noise length')
    check(abs(ca.db(np.mean(y ** 2)) - ca.db(np.mean(x ** 2))) < 1, 'stretch_noise keeps the level')
    f = ca.frames(y)
    check(((f['per'] > 0.6) & (f['rel'] > -30)).sum() <= 1, 'stretch_noise adds no voicing')


def test_ids(pb):
    """A new cut gives the sounds of that kind, and the lines made from them,
    new ids, and leaves every other line's id as it was."""
    print('clip ids follow the cut:')
    pb.load_phrases()
    P = pb.PHRASES
    lines = [(NARRATOR, '/p/'), (NARRATOR, '/m/'), (NARRATOR, 'P says puh.'), (NARRATOR, 'M says mmm.'),
             (NARRATOR, 'pig'), ('am_adam', 'This is the P house. P says puh.')]
    lines = [k for k in lines if k in P]
    before = {k: pb.clip_id(P[k]) for k in lines}
    old = dict(ca.KINDS['stop'])
    ca.KINDS['stop']['cut'] = old['cut'] + '-test'
    try:
        after = {k: pb.clip_id(P[k]) for k in lines}
    finally:
        ca.KINDS['stop'] = old
    for k in lines:
        made_from_p = '/p/' in k[1] or 'P says' in k[1]
        check((before[k] != after[k]) == made_from_p,
              f'{k}: {"new id" if made_from_p else "same id"} when the stop cut changes')
    check(all(pb.clip_id(P[k]) == before[k] for k in lines), 'ids back as they were')
    for t, hum in (('B', True), ('D', True), ('G', True), ('J', True), ('H', False), ('A', False)):
        check(pb.hum_letter(t) == hum, f'{t}: hum trimmed {hum}')
        if (NARRATOR, t) in P:
            check(('letter-hum30' in pb.base_key(P[(NARRATOR, t)])) == hum, f'{t}: hum trim in its clip id')


def test_spoken_letters(pb):
    """A lone letter: phonemes first, then its name in plain words."""
    print('how a lone letter is said:')
    for k, want in ((1, ('Aitch.', 's', None)), (2, ('Aitch.', None, 'Listen.')), (3, ('H.', 's', None)),
                    (4, ('Aitch.', None, 'Listen.'))):
        check(pb.spoken('H', k) == want, f'H try {k}: {pb.spoken("H", k)} is {want}')
    check(pb.spoken('H', 0)[0] == 'H', 'H try 0 is the letter')
    check('ph="ˈeɪtʃ"' in pb.ssml('H', 0.8), 'try 0 says H from phonemes')
    check('phoneme' not in pb.ssml('H.', 0.8, letters=False), 'a later try says the bare letter without phonemes')
    check('<s>Aitch.</s>' in pb.ssml(*pb.spoken('H', 1)[:1], 0.8, wrap='s', letters=False), 'try 1 says "Aitch."')
    check('phoneme' in pb.ssml('This is the H house.', 0.95), 'a letter in a sentence keeps its phonemes')
    check(set(pb.LETTER_SAID) == set('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'every letter has a name to say')
    print('  H:', [pb.spoken('H', k) for k in range(5)])


def test_letter_judging(vc, cc):
    """The recogniser's verdict on a lone letter, and the length rule."""
    print('judging a lone letter:')
    cases = [('H', 'H.', 'ok'), ('H', 'Aitch.', 'ok'), ('H', 'Age.', 'ok'), ('H', 'h-i-e-j', 'extra'),
             ('H', 'H, H.', 'extra'), ('H', 'Uh, H.', 'article'), ('H', 'Hi.', 'different'), ('B', 'V.', 'different'),
             ('B', 'Bee.', 'ok'), ('C', 'See?', 'ok'), ('Y', 'Why?', 'ok'), ('W', 'Double you.', 'ok'),
             ('W', 'W.', 'ok'), ('A', 'A.', 'ok'), ('A', 'AY', 'ok'), ('T', 'Tea.', 'ok'), ('U', 'You', 'ok'),
             ('O', 'Oh.', 'ok'), ('N', 'n', 'ok'), ('Z', 'Zed.', 'ok'), ('H', '', 'silent')]
    for text, heard, want in cases:
        got = vc.judge(text, heard)
        check(got == want, f'{text} heard {heard!r}: {got}, not {want}')
    check(vc.judge('This is the H house.', 'This is the age house.') == 'phonetic', 'letters inside a line stay unjudged')
    check(vc.judge('/m/', 'Mmm.') == 'phonetic', 'pure sounds stay unjudged')
    check(vc.backed('extra', {'fails': ['letter']}), '"h-i-e-j" is backed by the length rule')
    check(not vc.backed('different', {'fails': []}), 'B heard as V alone fails nothing (letters are easily misheard)')
    refs = {'dur': {}, 'lead': {}, 'factor': {}}
    for text, dur, fails in (('H', 1300, True), ('H', 600, False), ('W', 1100, False), ('W', 1300, True),
                             ('A', 950, True), ('h', 1300, False)):
        got = 'letter' in cc.judge(NARRATOR, text, {'dur': dur, 'db': -20, 'tp': -8}, refs)
        check(got == fails, f'clip check: {text} of {dur} ms {"fails" if fails else "passes"} the letter rule')


def test_letter_hum():
    """A lone letter's long hum before its burst is trimmed even when the
    clip starts with a quiet ramp (as the narrator's "B" does)."""
    sr, n = ca.SR, int(0.03 * ca.SR)
    t = np.arange(int(0.6 * sr)) / sr
    hum = 0.08 * np.sin(2 * np.pi * 180 * t[:int(0.11 * sr)])     # 110 ms of hum, fading in with a breath
    hum[:n] = hum[:n] * np.linspace(0, 1, n) ** 2 + np.random.default_rng(3).standard_normal(n) * 0.006 * np.linspace(1, 0, n)
    burst = np.random.default_rng(2).standard_normal(int(0.01 * sr)) * 0.3
    vowel = sum(np.sin(2 * np.pi * 180 * h * t[:int(0.4 * sr)]) / h for h in range(1, 20)) * 0.3
    x = np.concatenate([hum, burst, vowel])
    _, word = ca.prevoice_trim(x)
    _, letter = ca.prevoice_trim(x, onset=3)
    print(f'hum before a burst, after a quiet start: a word\'s trim takes {word} ms, a letter\'s {letter} ms')
    check(letter >= 40, 'a letter\'s long hum is trimmed')
    check(word == 0, 'a word\'s trim is as it was (it is part of every word\'s clip id)')


def plan(pb, cc, vc):
    """What the next workflow run (mode "all", then fix) would do, from the
    committed clips and reports, with record(), finish() and the reports'
    writers stubbed out."""
    from collections import Counter
    for mod in (cc, vc):
        mod.write_report = lambda rep, *a, **k: None
    pb.load_tool = lambda name: {'clip-check': cc, 'voice-check': vc}[name]
    phrases = pb.load_phrases()
    todo = [p for p in phrases if not os.path.exists(pb.path_of(p['voice'], pb.clip_id(p)))]
    kinds = Counter('pure sound (cut)' if pb.kind_of(p) == 'pure' else pb.kind_of(p) for p in todo)
    print(f'\nnext run, mode "all": {len(todo)} lines to record or cut: {dict(kinds)}')
    for p in todo:
        print(f"  {pb.kind_of(p):5s} {p['voice']:12s} {p['text']}")
    # Then the checks; the recogniser hears the lone letters again (they were
    # "phonetic"): judged here from what it wrote last time.
    idx = pb.old_index()
    for p in todo:
        cid = pb.clip_id(p)
        idx.setdefault(p['voice'], {})[p['text']] = cid
        pb.ENGINES.setdefault(p['voice'], {})[cid] = {'engine': 'generative', 'variant': 0}
    pb.old_index = lambda: idx
    crep, vrep = cc.load_report(), vc.load_report()
    refs = cc.references(crep)
    for key, c in crep['clips'].items():
        v, t = key.split('|', 1)
        c['fails'] = cc.judge(v, t, c, refs)
    for key, w in vrep['clips'].items():
        v, t = key.split('|', 1)
        if w.get('status') == 'phonetic' and not vc.SOUNDS.search(t) and idx.get(v, {}).get(t) == w['id']:
            st, a = vc.judge(t, w['heard']), crep['clips'].get(key, {})
            w['status'] = st if st not in vc.FAILS or (a.get('id') == w['id'] and vc.backed(st, a)) else 'unclear'
            if w['status'] != 'ok':
                print(f"  heard again: {key} {w['heard']!r} -> {w['status']}")
    cc.load_report = lambda *a, **k: crep
    vc.load_report = lambda *a, **k: vrep
    vc.available = lambda: False
    rounds = []

    def record(todo, k_of=pb.variant):
        rounds.append([(p, k_of(p)) for p in todo])
        return list(todo)
    pb.record, pb.record_missing, pb.finish = record, (lambda phrases: []), (lambda phrases: None)
    pb.donor_of = lambda p: None
    import contextlib
    import io
    with contextlib.redirect_stdout(io.StringIO()):
        pb.fix()
    print(f'then fix: {len(rounds[0]) if rounds else 0} lines recorded again (the new clips assumed to pass):')
    for p, k in rounds[0] if rounds else []:
        said, wrap, before = pb.spoken(p['text'], k)
        print(f"  {p['voice']}|{p['text']}: try {k} says {said!r}" + (f' after {before!r}' if before else '')
              + (f', then tries {", ".join(str(k2) for r in rounds[1:] for q, k2 in r if q is p)} if it fails'
                 if len(rounds) > 1 else ''))


def main():
    pb, cc, vc = load('polly-build'), load('clip-check'), load('voice-check')
    test_cuts()
    test_checks_catch_a_vowel()
    test_stretch_noise()
    test_ids(pb)
    test_spoken_letters(pb)
    test_letter_judging(vc, cc)
    test_letter_hum()
    print(f'{len(failures)} failed' if failures else 'all passed')
    if '--plan' in sys.argv:
        plan(pb, cc, vc)
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
