"""Records every phrase in tools/tts-phrases.json with Amazon Polly.

Runs in GitHub Actions (.github/workflows/polly.yml) with the AWS keys kept in
the repository's secrets: change tools/polly-run.json and push. It can also
run anywhere with AWS keys in the environment (needs boto3, numpy, ffmpeg):
    node tools/tts-phrases.js
    python tools/polly-build.py --mode all        # every phrase, for the game
    python tools/polly-build.py --mode fix        # record again what the checks failed
    python tools/polly-build.py --mode normalise  # even out the voices' loudness
    python tools/polly-build.py --mode sample     # a few lines in every voice
    python tools/polly-build.py --mode voices     # which voices have which engines

Writes audio/tts/<voice>/<id>.mp3 and audio/tts/index.js, so the game finds
the clips by the same voice names. Phrases name Kokoro voices (af_heart...),
and VOICES below says which Polly voice says each, all on the generative
engine. A line the engine refuses fails and keeps the clip it had: it is
never recorded on another engine.

Every recording is high-passed at 70 Hz and trimmed at both ends; a lone
b/d/g/j word loses a long hum before its burst; each voice gets one gain
(tools/polly-gains.json, set by --mode normalise towards -20 LUFS) and a
peak limiter. A lone word is said as a sentence ("Cat."). Pure letter
sounds ("/m/") are cut from the narrator's own words (tools/letter-sounds.json,
tools/clipaudio.py), and in a line like "M says mmm." the speaker says
"M says" and the narrator's /m/ follows.

tools/polly-clips.json says how each clip was made (engine, gain, variant,
the word a sound was cut from), tools/polly-variants.json which way of
saying a line passed the checks (tools/clip-check.py, tools/voice-check.py).
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from html import escape

import numpy as np

import clipaudio as ca

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'audio', 'tts')
SAMPLES = os.path.join(ROOT, 'audio', 'polly-samples')
TOOLS = os.path.join(ROOT, 'tools')

# Kokoro voice name in the game -> (Polly voice, engine). All generative, the
# most natural engine. Characters that share a Polly voice are told apart
# by a playback `lift` in js VOICES (only on chit-chat, never on quiz words).
VOICES = {
    'af_heart':    ('Ruth', 'generative'),      # the narrator
    'af_bella':    ('Salli', 'generative'),     # flower girl, unicorns
    'af_jessica':  ('Danielle', 'generative'),
    'af_river':    ('Joanna', 'generative'),
    'af_nova':     ('Tiffany', 'generative'),
    'af_aoede':    ('Jasmine', 'generative'),
    'af_kore':     ('Aria', 'generative'),
    'af_sarah':    ('Tiffany', 'generative'),
    'af_sky':      ('Tiffany', 'generative'),   # the little girl
    'af_nicole':   ('Olivia', 'generative'),
    'bf_alice':    ('Amy', 'generative'),       # the queen
    'bf_emma':     ('Amy', 'generative'),
    'bf_isabella': ('Niamh', 'generative'),     # granny
    'bf_lily':     ('Danielle', 'generative'),  # the maid
    'am_michael':  ('Matthew', 'generative'),   # the knight
    'am_eric':     ('Stephen', 'generative'),
    'am_adam':     ('Kenneth', 'generative'),
    'am_liam':     ('Russell', 'generative'),   # the farmer
    'am_puck':     ('Curtis', 'generative'),    # elf, race car
    'am_fenrir':   ('Stephen', 'generative'),   # the baby dragon
    'am_santa':    ('Kenneth', 'generative'),
    'bm_fable':    ('Nate', 'generative'),      # the bard, the pirate
    'bm_george':   ('Brian', 'generative'),     # the king
    'bm_lewis':    ('Brian', 'generative'),     # the librarian
}
NARRATOR = 'af_heart'  # TTS_NARRATOR in js/data.js; the pure letter sounds are cut from its words

# What is done to a recording after Polly. It is part of every clip id, so
# change it whenever the processing changes: every clip then gets a new URL
# (browsers keep old ones cached) and is recorded again.
RECIPE = 'r2 hp70 trim-45 bdgj-hum30 limit-3 word-as-sentence sounds-1'
TARGET_LUFS = -20.0
PAUSE = '600ms'  # between a carrier phrase and the line

# Letter names, said from phonemes so they come out right inside a sentence
# ("the A house" is not "the a house").
LETTER_IPA = {
    'A': 'ˈeɪ', 'B': 'ˈbi', 'C': 'ˈsi', 'D': 'ˈdi', 'E': 'ˈi', 'F': 'ˈɛf', 'G': 'ˈdʒi', 'H': 'ˈeɪtʃ', 'I': 'ˈaɪ',
    'J': 'ˈdʒeɪ', 'K': 'ˈkeɪ', 'L': 'ˈɛl', 'M': 'ˈɛm', 'N': 'ˈɛn', 'O': 'ˈoʊ', 'P': 'ˈpi', 'Q': 'ˈkju', 'R': 'ˈɑɹ',
    'S': 'ˈɛs', 'T': 'ˈti', 'U': 'ˈju', 'V': 'ˈvi', 'W': 'ˈdʌbəlju', 'X': 'ˈɛks', 'Y': 'ˈwaɪ', 'Z': 'ˈzi',
}
# Letter sounds from phonemes: only a fallback for a "says" line whose pure
# sound could not be cut (they come out with a vowel: "muh").
SOUND_IPA = {
    'ah': 'ˈæ', 'eh': 'ˈɛ', 'ih': 'ˈɪ', 'aw': 'ˈɑ', 'uh': 'ˈʌ',
    'buh': 'ˈbʌ', 'kuh': 'ˈkʌ', 'duh': 'ˈdʌ', 'guh': 'ˈɡʌ', 'puh': 'ˈpʌ', 'tuh': 'ˈtʌ',
    'fff': 'ˈfə', 'hhh': 'ˈhə', 'mmm': 'ˈmə', 'nnn': 'ˈnə', 'sss': 'ˈsə', 'lll': 'ˈlə', 'rrr': 'ˈɹə', 'ks': 'ks',
    'vvv': 'ˈvə', 'wuh': 'ˈwʌ', 'zzz': 'ˈzə', 'juh': 'ˈdʒʌ', 'yuh': 'ˈjʌ',
}
# A capital letter is a letter (not the word "A" or "I") on its own, before
# "house", "workshop" or "says", or at the end after "with".
LETTER = re.compile(r'^[A-Z](?=[.!?]?$)|(?<=\bwith )[A-Z](?=[.!?]?$)|\b[A-Z](?= (?:house|workshop|says)\b)')
SOUND = re.compile(r'(?<= says )(' + '|'.join(SOUND_IPA) + r')\b')

# Pure letter sounds: "/m/" is the sound alone; "M says mmm." gets it spliced in.
SOUNDS = json.load(open(os.path.join(TOOLS, 'letter-sounds.json')))['sounds']
SPELLING = {}
for _key, _s in SOUNDS.items():
    for _sp in _s['spell']:
        SPELLING.setdefault(_sp, _key)
PURE = re.compile(r'^/([a-z]{1,2})/$')
SAYS = re.compile(r"(?<![\w'])([A-Z]) says (" + '|'.join(sorted(SPELLING, key=len, reverse=True)) + r')(?![\w])')


def sound_key(letter, spelling):
    """Which pure sound "<letter> says <spelling>" means: the letter's own
    sound when it is spelled that way (C says kuh -> c), else the spelling's."""
    k = letter.lower()
    if k in SOUNDS and spelling in SOUNDS[k]['spell']:
        return k
    return SPELLING.get(spelling)


def says_parts(text):
    """A "says" line as [('text', ...), ('sound', key), ('text', ...)]."""
    out, pos = [], 0
    for m in SAYS.finditer(text):
        out.append(('text', text[pos:m.start(2)].strip()))
        out.append(('sound', sound_key(m.group(1), m.group(2))))
        pos = m.end(2)
    out.append(('text', re.sub(r'^[\s.,!?;:]+', '', text[pos:])))
    return out


def kind_of(p):
    """plain, pure (a sound alone: "/m/") or says (a line with a sound in it)."""
    t = p['text']
    m = PURE.match(t)
    if m and m.group(1) in SOUNDS:
        return 'pure'
    if SAYS.search(t):
        return 'says'
    return 'plain'


def phoneme(word, ipa):
    return f'<phoneme alphabet="ipa" ph="{ipa}">{word}</phoneme>'


def ssml(text, speed, rate=True, wrap=None, before=None, after=None, sounds=False):
    """The phrase as SSML: letters from phonemes, at its speed. `wrap` puts it
    in <s> or <p>; `before`/`after` is a carrier phrase said across a pause
    (cut off afterwards); `sounds` says letter sounds from phonemes."""
    marks = {}

    def keep(m, ipa):
        key = f'\0{len(marks)}\0'
        marks[key] = phoneme(m.group(0), ipa)
        return key
    t = SOUND.sub(lambda m: keep(m, SOUND_IPA[m.group(1)]), text) if sounds else text
    t = LETTER.sub(lambda m: keep(m, LETTER_IPA[m.group(0)]), t)
    t = escape(t, quote=False)
    for k, v in marks.items():
        t = t.replace(k, v)
    if wrap:
        t = f'<{wrap}>{t}</{wrap}>'
    if before:
        t = f'{escape(before)}<break time="{PAUSE}"/>{t}'
    if after:
        t = f'{t}<break time="{PAUSE}"/>{escape(after)}'
    if rate:
        t = f'<prosody rate="{round(speed * 100)}%">{t}</prosody>'
    return f'<speak>{t}</speak>'


VARIANTS_FILE = os.path.join(TOOLS, 'polly-variants.json')
CLIPS_FILE = os.path.join(TOOLS, 'polly-clips.json')
GAINS_FILE = os.path.join(TOOLS, 'polly-gains.json')


def read_json(path, default):
    try:
        return json.load(open(path))
    except (OSError, ValueError):
        return default


# "voice|text" -> which way of saying it (see spoken()); 0 when not listed.
VARIANTS = read_json(VARIANTS_FILE, {})
# voice -> clip id -> how it was made: {engine, gain, variant, ...}
ENGINES = read_json(CLIPS_FILE, {})
# voice -> gain in dB, from --mode normalise
GAINS = read_json(GAINS_FILE, {})
LONE = re.compile(r'^[a-z]+[!.]?$')
SENTENCES = re.compile(r'[.!?]\s+\S')
LAST_VARIANT = 4
# The last resort for a lone word that is heard as another word whichever
# way it is said ("ha" for "hat"): the word as another voice said it right
# (donor_of()). Better another voice than teaching the wrong sound.
BORROW = LAST_VARIANT + 1

PHRASES = {}  # (voice, text) -> phrase, filled by load_phrases()


def variant(p):
    return VARIANTS.get(f"{p['voice']}|{p['text']}", 0)


def base_key(p, k=None):
    """Everything that decides what a clip sounds like, except its gain."""
    voice, engine = VOICES[p['voice']]
    k = variant(p) if k is None else k
    base = f"polly|{voice}|{engine}|{p['text']}|{p['speed']}|{RECIPE}" + (f'|v{k}' if k else '')
    deps = sound_deps(p)
    return base + ('|' + ','.join(deps) if deps else '')


def content_id(p, k=None):
    return hashlib.sha1(base_key(p, k).encode()).hexdigest()[:10]


def clip_id(p, k=None, gain=None):
    g = GAINS.get(p['voice'], 0.0) if gain is None else gain
    return hashlib.sha1(f'{base_key(p, k)}|g{g:+.1f}'.encode()).hexdigest()[:10]


def fallback_id(p, gain=None):
    """A "says" line read with phoneme sounds, while its pure sound is missing."""
    g = GAINS.get(p['voice'], 0.0) if gain is None else gain
    return hashlib.sha1(f'{base_key(p)}|phonemes|g{g:+.1f}'.encode()).hexdigest()[:10]


def path_of(voice, cid):
    return os.path.join(OUT, voice, cid + '.mp3')


def sound_deps(p):
    """The clips a sound line is made from: for the narrator's "/m/", the
    words it may be cut from; for any other "/m/" or "M says mmm.", the
    narrator's "/m/". A new recording of those gives the line a new id."""
    kind = kind_of(p)
    if kind == 'plain':
        return []
    if kind == 'pure':
        key = PURE.match(p['text']).group(1)
        if p['voice'] != NARRATOR:
            n = PHRASES.get((NARRATOR, p['text']))
            return [content_id(n) if n else 'none']
        out = [hashlib.sha1(json.dumps(SOUNDS[key], sort_keys=True).encode()).hexdigest()[:8]]
        for word, _ in SOUNDS[key]['anchors']:
            a = PHRASES.get((NARRATOR, word))
            if a:
                out.append(content_id(a))
        return out
    out = []
    for what, key in says_parts(p['text']):
        if what == 'sound':
            n = PHRASES.get((NARRATOR, f'/{key}/'))
            out.append(content_id(n) if n else 'none')
    return out


def spoken(text, k):
    """How a line is said on its k-th try: (text, wrap, carrier before it).
    A lone word is said as a short sentence ("Cat."), which keeps its pitch
    falling and stops the engine from adding a word. Try 1 wraps the line in
    <s> (<p> for several sentences); try 2 says it after "Listen." and a
    pause, which is cut off. Try 3 says a lone word as "Cat!", which the
    engine says more crisply (a final t that "Cat." swallowed), and other
    lines wrapped after the carrier; try 4 is try 2 said slower (SLOWER)."""
    lone = LONE.match(text)
    if lone:
        word = text.rstrip('!.')
        text = word.capitalize() + (text[len(word):] or ('!' if k == 3 else '.'))
    wrap = ('p' if SENTENCES.search(text) else 's') if k == 1 or (k == 3 and not lone) else None
    return text, wrap, ('Listen.' if k in (2, 4) or (k == 3 and not lone) else None)


# How much slower each try is said (try 4: a careful, slower reading).
SLOWER = {4: 0.85}


polly = None


def client():
    global polly
    if polly is None:
        import boto3
        from botocore.config import Config
        polly = boto3.client('polly', region_name=os.environ.get('AWS_REGION') or 'us-east-1',
                             config=Config(retries={'max_attempts': 12, 'mode': 'adaptive'},
                                           connect_timeout=10, read_timeout=30))
    return polly


class Refused(Exception):
    """A line that can't be made this way; trying again won't help."""


REFUSED = ('InvalidSsmlException', 'EngineNotSupportedException', 'ValidationException',
           'SsmlMarksNotSupportedForTextTypeException', 'TextLengthExceededException')


def request(voice, engine, make_ssml):
    """Polly's mp3 for a line on `engine`, with its speed or, if the engine
    won't take <prosody rate>, without. Never on another engine."""
    from botocore.exceptions import ClientError
    err = None
    for rate in (True, False):
        try:
            r = client().synthesize_speech(Text=make_ssml(rate), TextType='ssml', VoiceId=voice, Engine=engine,
                                           OutputFormat='mp3', SampleRate='24000')
            return r['AudioStream'].read(), engine if rate else f'{engine} (no rate)'
        except ClientError as e:
            if e.response['Error']['Code'] not in REFUSED:
                raise
            err = e
    raise Refused(f'{engine} refused it: {err}')


def speak(slot, text, speed, k=0, after=None, sounds=False):
    """One recording, cleaned up (no gain yet): (samples, notes)."""
    voice, engine = VOICES[slot]
    said, wrap, before = spoken(text, k)
    speed *= SLOWER.get(k, 1)
    audio, used = request(voice, engine, lambda rate: ssml(said, speed, rate, wrap, before, after, sounds))
    x = ca.decode(audio)
    lone = bool(LONE.match(text))
    try:
        y, notes = ca.clean(x, lone_bdgj=lone and text[0] in 'bdgj',
                            carrier='after' if before else 'before' if after else None)
    except ValueError as e:
        raise Refused(str(e))
    if len(y) < 0.05 * ca.SR or ca.active_db(y) < -50:
        raise Refused('nothing audible')
    return y, dict(notes, engine=used)


def silence(sec):
    return np.zeros(int(sec * ca.SR))


def donor_of(p):
    """For a lone word no way of saying fixed: another voice whose clip of the
    same word passed both checks, a man's for a man and a woman's for a woman
    first; (voice, path) or None. Never for the narrator, whose words the pure
    letter sounds are cut from."""
    if p['voice'] == NARRATOR or not LONE.match(p['text']):
        return None
    cc, vc = load_tool('clip-check'), load_tool('voice-check')
    crep, vrep = cc.load_report()['clips'], vc.load_report()['clips']
    idx = old_index()
    same = lambda v: v[1] == p['voice'][1]  # af_/bf_ women, am_/bm_ men
    for v in sorted((v for v in idx if v not in (p['voice'], NARRATOR)), key=lambda v: (not same(v), v)):
        cid = idx[v].get(p['text'])
        key = f"{v}|{p['text']}"
        rec = ENGINES.get(v, {}).get(cid)
        if not cid or not isinstance(rec, dict) or rec.get('engine') == 'cut':
            continue
        c, w = crep.get(key, {}), vrep.get(key, {})
        if c.get('id') == cid and not c.get('fails') and w.get('id') == cid and w.get('status') == 'ok' \
                and os.path.exists(path_of(v, cid)):
            return v, path_of(v, cid)
    return None


def make_plain(p, k, path, gain):
    if re.fullmatch(r'/[a-z]+/', p['text']):
        # Polly would read the slashes; the game says the sound's spelling instead.
        raise Refused('not a sound in tools/letter-sounds.json')
    if k == BORROW:
        d = donor_of(p)
        if not d:
            raise Refused('no other voice says it right')
        shutil.copyfile(d[1], path + '.part')
        os.replace(path + '.part', path)
        return {'engine': 'cut', 'from': d[0], 'gain': gain, 'variant': k}
    y, rec = speak(p['voice'], p['text'], p['speed'], k)
    ca.encode(y, path, gain)
    return dict(rec, gain=gain, variant=k)


def make_pure(p, k, path, gain):
    """"/m/": the narrator's pure sound, cut from its words (any other voice
    that lists it gets a copy of the narrator's)."""
    key = PURE.match(p['text']).group(1)
    if p['voice'] != NARRATOR:
        n = PHRASES.get((NARRATOR, p['text']))
        src = n and path_of(NARRATOR, clip_id(n))
        if not src or not os.path.exists(src):
            raise Refused('the narrator has no clip of it')
        shutil.copyfile(src, path + '.part')
        os.replace(path + '.part', path)
        return {'engine': 'cut', 'from': NARRATOR, 'gain': gain}
    spec = SOUNDS[key]
    anchors = []
    for word, where in spec['anchors']:
        a = PHRASES.get((NARRATOR, word))
        if a and os.path.exists(path_of(NARRATOR, clip_id(a))):
            anchors.append((word, where, ca.decode(path_of(NARRATOR, clip_id(a)))))
    y, info = ca.best_cut(spec['kind'], anchors)
    if y is None:
        raise Refused('no clean cut: ' + '; '.join(f"{t['word']}: {t['problem']}" for t in info['tried'])
                      if info['tried'] else 'none of its words is recorded')
    # The words already have the narrator's gain.
    ca.encode(y, path, 0.0, pad=0.05)
    return {'engine': 'cut', 'gain': gain, 'anchor': info['anchor'], 'where': info['where'], 'ms': info['ms'],
            'source': info['source'], 'tried': [t['word'] for t in info['tried']]}


def narrator_sound(key):
    """The narrator's "/key/" (samples) and the level of the word it was cut
    from, or None."""
    n = PHRASES.get((NARRATOR, f'/{key}/'))
    cid = n and clip_id(n)
    if not cid or not os.path.exists(path_of(NARRATOR, cid)):
        return None
    y = ca.edge_trim(ca.decode(path_of(NARRATOR, cid), highpass=False))
    rec = ENGINES.get(NARRATOR, {}).get(cid)
    a = isinstance(rec, dict) and PHRASES.get((NARRATOR, rec.get('anchor')))
    ref = ca.active_db(ca.decode(path_of(NARRATOR, clip_id(a)), highpass=False)) \
        if a and os.path.exists(path_of(NARRATOR, clip_id(a))) else None
    return y, ref


def make_says(p, k, path, gain):
    """"This is the M house. M says mmm.": the speaker says "This is the M
    house. M says" (recorded with a word after a pause, so it doesn't sound
    finished, then cut there), then the narrator's pure /m/ follows, as loud
    next to this voice as it is next to the narrator's own word."""
    parts = says_parts(p['text'])
    sounds = {key: narrator_sound(key) for what, key in parts if what == 'sound'}
    if not all(sounds.values()):
        raise Refused('missing pure sound ' + ', '.join(f'/{k}/' for k, s in sounds.items() if not s))
    out, engines, level = [], set(), None
    for i, (what, val) in enumerate(parts):
        if what == 'text':
            if not re.search(r'[A-Za-z0-9]', val):
                continue
            nxt = parts[i + 1][1] if i + 1 < len(parts) else None
            y = None
            if nxt:
                try:
                    y, rec = speak(p['voice'], val, p['speed'], k, after=SOUNDS[nxt]['anchors'][0][0] + '.')
                except Refused:
                    y = None
            if y is None:
                y, rec = speak(p['voice'], val, p['speed'], k)
            y = y * 10 ** (gain / 20)
            engines.add(rec['engine'])
            level = ca.active_db(y)
            if out:
                out.append(silence(0.35))
            out.append(y)
        else:
            y, ref = sounds[val]
            if level is not None and ref is not None:
                y = y * 10 ** ((level - ref) / 20)
            out.append(silence(0.2 if out else 0.0))
            out.append(y)
    ca.encode(np.concatenate(out), path, 0.0)
    return {'engine': ' + '.join(sorted(engines)) or 'cut', 'gain': gain, 'variant': k,
            'sounds': [v for w, v in parts if w == 'sound']}


def make_fallback(p, path, gain):
    """A "says" line whose pure sound is missing, read with phoneme sounds."""
    y, rec = speak(p['voice'], p['text'], p['speed'], 0, sounds=True)
    ca.encode(y, path, gain)
    return dict(rec, gain=gain, fallback='phoneme sounds')


def make(p, k, path):
    kind = kind_of(p)
    gain = GAINS.get(p['voice'], 0.0)
    if kind == 'pure':
        return make_pure(p, k, path, gain)
    if kind == 'says':
        return make_says(p, k, path, gain)
    return make_plain(p, k, path, gain)


def make_retrying(p, k, path, tries=5):
    """make(), tried again after a dropped connection or a timeout."""
    for i in range(tries):
        try:
            return make(p, k, path)
        except Refused:
            raise
        except Exception as e:  # botocore raises several kinds for network trouble
            if i == tries - 1:
                raise
            print(f"  retry {p['text'][:40]!r}: {type(e).__name__}", flush=True)
            time.sleep(2 ** i)


def old_index():
    """The index the last run wrote, so a line that fails now keeps its old clip."""
    try:
        src = open(os.path.join(OUT, 'index.js')).read()
        return json.loads(src[src.index('{'):src.rindex('}') + 1])
    except (OSError, ValueError):
        return {}


def deployed_index():
    """The index of the build that is live (DEPLOYED_REF, default origin/main):
    tabs opened before the next deploy still ask for its clips. None if it
    can't be read."""
    ref = os.environ.get('DEPLOYED_REF', 'origin/main')
    try:
        src = subprocess.run(['git', 'show', f'{ref}:audio/tts/index.js'], cwd=ROOT, capture_output=True,
                             text=True, check=True).stdout
        return json.loads(src[src.index('{'):src.rindex('}') + 1])
    except (OSError, subprocess.CalledProcessError, ValueError):
        return None


def load_phrases():
    phrases = json.load(open(os.path.join(TOOLS, 'tts-phrases.json')))
    missing = sorted({p['voice'] for p in phrases} - set(VOICES))
    if missing:
        sys.exit(f'No Polly voice for {missing}: add them to VOICES')
    for v in {p['voice'] for p in phrases}:
        os.makedirs(os.path.join(OUT, v), exist_ok=True)
    PHRASES.clear()
    PHRASES.update({(p['voice'], p['text']): p for p in phrases})
    return phrases


def record(todo, k_of=variant):
    """Records the phrases in `todo`; returns the ones that failed."""
    failed = []

    def one(p):
        k = k_of(p)
        cid = clip_id(p, k)
        try:
            rec = make_retrying(p, k, path_of(p['voice'], cid))
            ENGINES.setdefault(p['voice'], {})[cid] = rec
        except Exception as e:
            if kind_of(p) == 'says' and k == 0 and isinstance(e, Refused) and 'missing pure sound' in str(e):
                fid = fallback_id(p)
                if not os.path.exists(path_of(p['voice'], fid)):
                    try:
                        ENGINES.setdefault(p['voice'], {})[fid] = make_fallback(p, path_of(p['voice'], fid),
                                                                                GAINS.get(p['voice'], 0.0))
                    except Exception as e2:
                        e = e2
            failed.append(p)
            print(f'  failed {p["voice"]} {p["text"]!r}: {e}', flush=True)
    with ThreadPoolExecutor(6) as pool:
        for i, _ in enumerate(pool.map(one, todo), 1):
            if i % 500 == 0:
                print(f'  {i}/{len(todo)}', flush=True)
    return failed


def stages(phrases):
    """Phrases in the order they can be made: words first, then the
    narrator's pure sounds cut from them, then everything that uses those."""
    out = [[], [], [], []]
    for p in phrases:
        k = kind_of(p)
        out[0 if k == 'plain' else 3 if k == 'says' else 1 if p['voice'] == NARRATOR else 2].append(p)
    return out


def record_missing(phrases):
    failed = []
    for todo in stages(phrases):
        todo = [p for p in todo if not os.path.exists(path_of(p['voice'], clip_id(p)))]
        if todo:
            failed += record(todo)
    return failed


def write_lines(d, path):
    """A {key: {key: value}} JSON file with one inner entry per line, so
    merges of it don't fight over one long line."""
    keys = sorted(d)
    with open(path, 'w') as f:
        f.write('{\n')
        for n, v in enumerate(keys):
            inner = sorted(d[v].items())
            body = ',\n'.join(f'{json.dumps(k, ensure_ascii=False)}: '
                              f'{json.dumps(x, ensure_ascii=False, sort_keys=True)}' for k, x in inner)
            f.write(f'{json.dumps(v)}: {{\n{body}\n}}' + (',' if n < len(keys) - 1 else '') + '\n')
        f.write('}\n')


def index_hash():
    """Which index a report was made for (the first 12 hex of its sha1)."""
    try:
        return hashlib.sha1(open(os.path.join(OUT, 'index.js'), 'rb').read()).hexdigest()[:12]
    except OSError:
        return ''


def finish(phrases):
    """Writes the index (every line that has a clip: the new one, or for a line
    that failed, the one it had before), deletes clips that neither this
    index nor the deployed one uses, and saves how each clip was made."""
    before = old_index()
    index = {}
    for p in phrases:
        ids = [clip_id(p), before.get(p['voice'], {}).get(p['text'])]
        if kind_of(p) == 'says':
            ids.insert(1, fallback_id(p))
        have = [i for i in ids if i and os.path.exists(path_of(p['voice'], i))]
        if have:
            index.setdefault(p['voice'], {})[p['text']] = have[0]
    keep = {(v, i) for v, m in index.items() for i in m.values()}
    deployed = deployed_index()
    if deployed is None:
        print('the deployed index (origin/main) could not be read: no clip is deleted', flush=True)
    else:
        keep |= {(v, i) for v, m in deployed.items() for i in m.values()}
        for v in os.listdir(OUT):
            d = os.path.join(OUT, v)
            if os.path.isdir(d):
                for f in os.listdir(d):
                    if f.endswith('.mp3') and (v, f[:-4]) not in keep:
                        os.remove(os.path.join(d, f))
    with open(os.path.join(OUT, 'index.js'), 'w') as f:
        f.write('// Generated by tools/polly-build.py: voice -> line -> recording id, one per line.\n')
        f.write('const TTS_INDEX = ' + json.dumps(index, ensure_ascii=False, indent=0, sort_keys=True) + ';\n')
    clips = {v: {i: ENGINES[v][i] for i in set(m.values()) if i in ENGINES.get(v, {})} for v, m in index.items()}
    write_lines(clips, CLIPS_FILE)
    live = {f"{p['voice']}|{p['text']}" for p in phrases}
    json.dump({k: v for k, v in VARIANTS.items() if k in live and v}, open(VARIANTS_FILE, 'w'), indent=0,
              sort_keys=True)
    write_sounds(index)
    counts = {}
    for m in clips.values():
        for r in m.values():
            e = r.get('engine') if isinstance(r, dict) else r
            counts[e] = counts.get(e, 0) + 1
    untracked = sum(len(set(m.values())) for m in index.values()) - sum(len(m) for m in clips.values())
    print('clips by engine:', counts, f'(and {untracked} from before tracking)' if untracked else '', flush=True)


def write_sounds(index):
    """audio/tts/sounds.js: the narrator's pure sounds and the words they were
    cut from, for tools/letter-sounds.html."""
    lines = index.get(NARRATOR, {})
    out = {}
    for key, spec in SOUNDS.items():
        cid = lines.get(f'/{key}/')
        rec = ENGINES.get(NARRATOR, {}).get(cid) if cid else None
        if not isinstance(rec, dict):
            continue
        word = rec.get('anchor')
        out[key] = {'clip': cid, 'kind': spec['kind'], 'anchor': word, 'anchorClip': lines.get(word),
                    'where': rec.get('where'), 'ms': rec.get('ms')}
    with open(os.path.join(OUT, 'sounds.js'), 'w') as f:
        f.write('// Generated by tools/polly-build.py: the pure letter sounds (narrator) and the words they were cut '
                'from.\n')
        f.write('const TTS_SOUNDS = ' + json.dumps(out, indent=0, sort_keys=True) + ';\n')


def record_all():
    phrases = load_phrases()
    todo = [p for p in phrases if not os.path.exists(path_of(p['voice'], clip_id(p)))]
    chars = sum(len(p['text']) for p in todo if kind_of(p) != 'pure')
    print(f'{len(phrases)} phrases, {len(todo)} to record ({chars} characters)', flush=True)
    failed = record_missing(phrases)
    finish(phrases)
    print(f'done, {len(failed)} failed' if failed else 'done', flush=True)


def load_tool(name):
    import importlib.util
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(TOOLS, name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def fix():
    """Records again the lines that fail the checks: tools/clip-check.py's
    acoustic rules, and tools/voice-check.py where the recogniser's finding is
    backed by the acoustics. Each is tried the next way of saying it
    (spoken()), on the same engine, until one passes both; a line that never
    passes keeps the clip it had and is marked unfixable."""
    cc, vc = load_tool('clip-check'), load_tool('voice-check')
    phrases = load_phrases()
    idx = old_index()
    crep, vrep = cc.load_report(), vc.load_report()
    whisper = vc.available()
    if whisper and vrep.get('calibration'):
        vc.prompt = vrep['calibration'].get('prompt')

    def current(key):
        v, t = key.split('|', 1)
        return idx.get(v, {}).get(t)

    bad, tried = [], {}
    for key, p in ((f"{p['voice']}|{p['text']}", p) for p in phrases):
        cid = current(key)
        if kind_of(p) != 'plain' or variant(p) >= LAST_VARIANT:
            continue
        tried[key] = variant(p)
        if not cid or cid not in ENGINES.get(p['voice'], {}):
            # No clip at all (refused, or nothing audible), or one kept from
            # before clips were tracked: try the other ways.
            bad.append(key)
            continue
        c, w = crep['clips'].get(key, {}), vrep['clips'].get(key, {})
        misheard = w.get('id') == cid and w.get('status') in vc.FAILS
        if c.get('unfixable') or w.get('unfixable'):
            # Given up on after every way there was then (2 before tries 3
            # and 4 existed): only the ways added since are left to try, and
            # for a misheard lone word another voice's (BORROW).
            tried[key] = max(tried[key], c.get('tried', 2))
            if tried[key] >= LAST_VARIANT and not (misheard and donor_of(p)):
                continue
        if (c.get('id') == cid and c.get('fails')) or misheard:
            bad.append(key)
    by_key = {f"{p['voice']}|{p['text']}": p for p in phrases}
    print(f'{len(bad)} lines to record again' + ('' if whisper else ' (no recogniser here: acoustic checks only)'),
          flush=True)
    refs = cc.references(crep)
    tried = {key: tried[key] for key in bad}
    while bad:
        todo = [key for key in bad if tried[key] < LAST_VARIANT]
        if not todo:
            break
        for key in todo:
            tried[key] += 1
        record([by_key[key] for key in todo], lambda p: tried[f"{p['voice']}|{p['text']}"])
        bad = [key for key in bad if key not in todo]
        for key in todo:
            p = by_key[key]
            cid = clip_id(p, tried[key])
            path = path_of(p['voice'], cid)
            if not os.path.exists(path):
                bad.append(key)  # not recorded (refused or network): try the next way
                continue
            m = cc.measure(path, p['text'])
            fails = cc.judge(p['voice'], p['text'], m, refs)
            heard = None
            if not fails and whisper:
                heard = vc.check_clip(p['voice'], p['text'], cid, acoustic=dict(m, fails=fails))
                if heard['status'] in vc.FAILS:
                    fails = [f"heard {heard['heard']!r} ({heard['status']})"]
            print(f"  v{tried[key]} {key}: {'; '.join(fails) or 'ok'}", flush=True)
            if fails:
                os.remove(path)
                bad.append(key)
            else:
                VARIANTS[key] = tried[key]
                crep['clips'][key] = dict(m, id=cid, fails=[])
                if heard:
                    vrep['clips'][key] = heard
    # A lone word still heard as another word: another voice's, if one says it right.
    for key in list(bad):
        p = by_key[key]
        w = vrep['clips'].get(key, {})
        if not (w.get('id') == current(key) and w.get('status') in vc.FAILS) or not donor_of(p):
            continue
        cid = clip_id(p, BORROW)
        try:
            ENGINES.setdefault(p['voice'], {})[cid] = make_plain(p, BORROW, path_of(p['voice'], cid), GAINS.get(p['voice'], 0.0))
        except Refused as e:
            print(f'  {key}: {e}', flush=True)
            continue
        VARIANTS[key] = BORROW
        crep['clips'][key] = dict(cc.measure(path_of(p['voice'], cid), p['text']), id=cid, fails=[])
        if whisper:
            vrep['clips'][key] = vc.check_clip(p['voice'], p['text'], cid, acoustic=crep['clips'][key])
        bad.remove(key)
        print(f"  {key}: borrowed from {ENGINES[p['voice']][cid]['from']}", flush=True)
    for key in bad:
        crep['clips'].setdefault(key, {}).update(unfixable=True, tried=tried[key])
        print(f'  unfixable, keeps its clip: {key}', flush=True)
    # Sounds and "says" lines made from a clip that changed.
    record_missing(phrases)
    finish(phrases)
    cc.write_report(crep)
    vc.write_report(vrep)
    print(f'fixed {len(tried) - len(bad)} of {len(tried)}', flush=True)


def normalise():
    """Evens out the voices: measures each voice's loudness over all its clips
    (EBU R128) and, when it is more than 1 LU off TARGET_LUFS, changes its
    gain by the difference and re-makes its clips at the new gain, under new
    ids so browsers fetch them again. Later recordings get the same gain
    (tools/polly-gains.json), so running it again changes nothing."""
    phrases = load_phrases()
    idx = old_index()
    renamed = {}
    by_voice = {}
    for p in phrases:
        if p['text'] in idx.get(p['voice'], {}):
            by_voice.setdefault(p['voice'], []).append(p)

    def applied(v, cid):
        r = ENGINES.get(v, {}).get(cid)
        return r.get('gain', 0.0) if isinstance(r, dict) else 0.0

    for v in sorted(by_voice):
        lines = [(p, idx[v][p['text']]) for p in by_voice[v]]
        lines = [(p, cid) for p, cid in lines if os.path.exists(path_of(v, cid))]
        with ThreadPoolExecutor(4) as pool:
            clips = list(pool.map(lambda pc: ca.decode(path_of(v, pc[1]), highpass=False).astype(np.float32), lines))
        level, _ = ca.loudness(np.concatenate(clips))
        old = GAINS.get(v, 0.0)
        new = round(old + TARGET_LUFS - level, 1)
        if abs(TARGET_LUFS - level) < 1.0:
            print(f'{v}: {level:.1f} LUFS, gain {old:+.1f} dB stays', flush=True)
            continue
        print(f'{v}: {level:.1f} LUFS, gain {old:+.1f} -> {new:+.1f} dB', flush=True)
        GAINS[v] = new

        def redo(pc_x):
            (p, cid), x = pc_x
            if cid != clip_id(p, gain=old) and not (kind_of(p) == 'says' and cid == fallback_id(p, old)):
                return None  # a clip kept from before: it is recorded again anyway
            nid = clip_id(p) if cid == clip_id(p, gain=old) else fallback_id(p)
            ca.encode(x * 10 ** ((new - applied(v, cid)) / 20), path_of(v, nid), 0.0, pad=0)
            return cid, nid
        with ThreadPoolExecutor(4) as pool:
            for r in pool.map(redo, zip(lines, clips)):
                if r:
                    cid, nid = r
                    rec = ENGINES.get(v, {}).get(cid)
                    ENGINES.setdefault(v, {})[nid] = dict(rec if isinstance(rec, dict) else {}, gain=new)
                    renamed[(v, cid)] = nid
    json.dump(GAINS, open(GAINS_FILE, 'w'), indent=0, sort_keys=True)
    finish(phrases)
    # The checks' findings carry over to the renamed clips.
    cc, vc = load_tool('clip-check'), load_tool('voice-check')
    for mod in (cc, vc):
        rep = mod.load_report()
        for key, c in rep['clips'].items():
            nid = renamed.get((key.split('|', 1)[0], c.get('id')))
            if nid:
                c['id'] = nid
        mod.write_report(rep)
    print(f'{len(renamed)} clips at a new gain', flush=True)


def list_voices():
    """Every English voice and the engines it has, from Polly itself."""
    out = []
    token = None
    while True:
        kw = {'IncludeAdditionalLanguageCodes': True}
        if token:
            kw['NextToken'] = token
        r = client().describe_voices(**kw)
        for v in r['Voices']:
            if v['LanguageCode'].startswith('en-'):
                out.append({'id': v['Id'], 'gender': v['Gender'], 'lang': v['LanguageCode'],
                            'engines': sorted(v.get('SupportedEngines', []))})
        token = r.get('NextToken')
        if not token:
            break
    out.sort(key=lambda v: (v['lang'], v['id']))
    json.dump(out, open(os.path.join(TOOLS, 'polly-voices.json'), 'w'), indent=1)
    for v in out:
        print(v['lang'], v['id'], v['gender'], ','.join(v['engines']), flush=True)


# A few lines in every generative English voice, to choose voices by ear.
SAMPLE_LINES = [
    ('Good morning, Princess Yuna! My bread just came out of the oven.', 0.95),
    ('This is the C house. C says', 0.95),
    ('Cat.', 0.85),
    ('Which picture starts with A?', 0.95),
]
SAMPLE_VOICES = ['Ruth', 'Joanna', 'Danielle', 'Salli', 'Tiffany', 'Matthew', 'Stephen', 'Nate', 'Kenneth', 'Amy',
                 'Brian', 'Olivia', 'Niamh', 'Aria', 'Ayanda', 'Kajal', 'Jasmine', 'Russell', 'Curtis', 'Arjun',
                 'Kiara']


def record_samples():
    os.makedirs(SAMPLES, exist_ok=True)
    jobs = [(voice, i, text, speed) for voice in SAMPLE_VOICES for i, (text, speed) in enumerate(SAMPLE_LINES, 1)]
    made = []

    def one(job):
        voice, i, text, speed = job
        name = f'generative-{voice}-{i}.mp3'
        try:
            audio, used = request(voice, 'generative', lambda rate: ssml(text, speed, rate))
            y, _ = ca.clean(ca.decode(audio))
            ca.encode(y, os.path.join(SAMPLES, name))
            made.append({'engine': used, 'voice': voice, 'line': i, 'text': text, 'file': name})
        except Exception as e:  # one voice failing shouldn't stop the rest
            print(f'{name}: {e}', flush=True)
    with ThreadPoolExecutor(6) as pool:
        list(pool.map(one, jobs))
    made.sort(key=lambda m: (m['voice'], m['line']))
    json.dump(made, open(os.path.join(SAMPLES, 'samples.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'{len(made)}/{len(jobs)} samples', flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mode', default='', help='all, fix, normalise, voices or sample (default: tools/polly-run.json)')
    args = ap.parse_args()
    mode = args.mode or json.load(open(os.path.join(TOOLS, 'polly-run.json')))['mode']
    if mode == 'sample':
        record_samples()
    elif mode == 'all':
        record_all()
    elif mode == 'fix':
        fix()
    elif mode == 'normalise':
        normalise()
    elif mode == 'voices':
        list_voices()
    else:
        sys.exit(f'unknown mode {mode!r}')


if __name__ == '__main__':
    sys.exit(main())
