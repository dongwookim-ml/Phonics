"""Records every phrase in tools/tts-phrases.json with Amazon Polly.

Runs in GitHub Actions (.github/workflows/polly.yml) with the AWS keys kept in
the repository's secrets: change "mode" in tools/polly-run.json and push.
It can also run anywhere with AWS keys in the environment:
    node tools/tts-phrases.js
    python tools/polly-build.py --mode all      # every phrase, for the game
    python tools/polly-build.py --mode sample   # a few lines in every voice

Writes audio/tts/<voice>/<id>.mp3 and audio/tts/index.js like tts-build.py,
so the game finds the clips by the same voice names. Phrases name Kokoro
voices (af_heart...), and VOICES below says which Polly voice says each.
Clips already recorded are kept. Needs boto3 and ffmpeg.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from html import escape

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'audio', 'tts')
SAMPLES = os.path.join(ROOT, 'audio', 'polly-samples')
TRIM = ('silenceremove=start_periods=1:start_threshold=-45dB,areverse,'
        'silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.08')

# Kokoro voice name in the game -> (Polly voice, engine). Generative sounds the
# most natural; the child voices (Ivy, Justin, Kevin) and a few others only
# come as neural.
VOICES = {
    'af_heart':    ('Ruth', 'generative'),      # the narrator
    'af_bella':    ('Salli', 'generative'),     # flower girl, unicorns
    'af_jessica':  ('Danielle', 'generative'),
    'af_river':    ('Joanna', 'generative'),
    'af_nova':     ('Tiffany', 'generative'),
    'af_aoede':    ('Kimberly', 'neural'),
    'af_kore':     ('Aria', 'generative'),
    'af_sarah':    ('Ivy', 'neural'),
    'af_sky':      ('Ivy', 'neural'),           # the little girl
    'af_nicole':   ('Olivia', 'generative'),
    'bf_alice':    ('Amy', 'generative'),       # the queen
    'bf_emma':     ('Emma', 'neural'),
    'bf_isabella': ('Niamh', 'generative'),     # granny
    'bf_lily':     ('Kendra', 'neural'),        # the maid
    'am_michael':  ('Matthew', 'generative'),   # the knight
    'am_eric':     ('Stephen', 'generative'),
    'am_adam':     ('Gregory', 'neural'),
    'am_liam':     ('Joey', 'neural'),
    'am_puck':     ('Kevin', 'neural'),         # elf, race car
    'am_fenrir':   ('Justin', 'neural'),        # the baby dragon
    'am_santa':    ('Kenneth', 'generative'),
    'bm_fable':    ('Nate', 'generative'),      # the bard, the pirate
    'bm_george':   ('Arthur', 'neural'),        # the king
    'bm_lewis':    ('Brian', 'generative'),     # the librarian
}

# Letter names and letter sounds, said from phonemes so they come out right
# inside a sentence ("the A house" is not "the a house").
LETTER_IPA = {
    'A': 'ˈeɪ', 'B': 'ˈbi', 'C': 'ˈsi', 'D': 'ˈdi', 'E': 'ˈi', 'F': 'ˈɛf', 'G': 'ˈdʒi', 'H': 'ˈeɪtʃ', 'I': 'ˈaɪ',
    'J': 'ˈdʒeɪ', 'K': 'ˈkeɪ', 'L': 'ˈɛl', 'M': 'ˈɛm', 'N': 'ˈɛn', 'O': 'ˈoʊ', 'P': 'ˈpi', 'Q': 'ˈkju', 'R': 'ˈɑɹ',
    'S': 'ˈɛs', 'T': 'ˈti', 'U': 'ˈju', 'V': 'ˈvi', 'W': 'ˈdʌbəlju', 'X': 'ˈɛks', 'Y': 'ˈwaɪ', 'Z': 'ˈzi',
}
SOUND_IPA = {
    'ah': 'ˈæ', 'eh': 'ˈɛ', 'ih': 'ˈɪ', 'aw': 'ˈɑ', 'uh': 'ˈʌ',
    'buh': 'ˈbʌ', 'kuh': 'ˈkʌ', 'duh': 'ˈdʌ', 'guh': 'ˈɡʌ', 'puh': 'ˈpʌ', 'tuh': 'ˈtʌ',
    'fff': 'ˈfə', 'hhh': 'ˈhə', 'mmm': 'ˈmə', 'nnn': 'ˈnə', 'sss': 'ˈsə', 'lll': 'ˈlə', 'rrr': 'ˈɹə', 'ks': 'ks',
}
# A capital letter is a letter (not the word "A" or "I") on its own, before
# "house", "workshop" or "says", or at the end after "with".
LETTER = re.compile(r'^[A-Z](?=[.!?]?$)|(?<=\bwith )[A-Z](?=[.!?]?$)|\b[A-Z](?= (?:house|workshop|says)\b)')
SOUND = re.compile(r'(?<= says )(' + '|'.join(SOUND_IPA) + r')\b')


def phoneme(word, ipa):
    return f'<phoneme alphabet="ipa" ph="{ipa}">{word}</phoneme>'


def ssml(text, speed, rate=True):
    """The phrase as SSML: letters and letter sounds from phonemes, at its speed."""
    marks = {}

    def keep(m, ipa):
        key = f'\0{len(marks)}\0'
        marks[key] = phoneme(m.group(0), ipa)
        return key
    t = SOUND.sub(lambda m: keep(m, SOUND_IPA[m.group(1)]), text)
    t = LETTER.sub(lambda m: keep(m, LETTER_IPA[m.group(0)]), t)
    t = escape(t, quote=False)
    for k, v in marks.items():
        t = t.replace(k, v)
    if rate:
        t = f'<prosody rate="{round(speed * 100)}%">{t}</prosody>'
    return f'<speak>{t}</speak>'


def clip_id(p):
    voice, engine = VOICES[p['voice']]
    return hashlib.sha1(f"polly|{voice}|{engine}|{p['text']}|{p['speed']}".encode()).hexdigest()[:10]


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


def synth(voice, engine, text, speed, path):
    """Records one line to an mp3. Falls back to plain speed when an engine
    doesn't take <prosody rate>, and to the neural engine when a voice
    rejects the SSML on its own engine."""
    from botocore.exceptions import ClientError
    tries = [(engine, True), (engine, False)]
    if engine != 'neural':
        tries.append(('neural', True))
    err = None
    for eng, rate in tries:
        try:
            r = client().synthesize_speech(Text=ssml(text, speed, rate), TextType='ssml', VoiceId=voice, Engine=eng,
                                           OutputFormat='mp3', SampleRate='24000')
            break
        except ClientError as e:
            err = e
            if e.response['Error']['Code'] not in ('InvalidSsmlException', 'EngineNotSupportedException',
                                                   'ValidationException', 'SsmlMarksNotSupportedForTextTypeException'):
                raise
    else:
        raise err
    with tempfile.NamedTemporaryFile(suffix='.mp3') as raw:
        raw.write(r['AudioStream'].read())
        raw.flush()
        # Written beside the clip and moved in place, so a failed run never
        # leaves half a clip that looks recorded.
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw.name, '-af', TRIM,
                        '-ac', '1', '-ar', '24000', '-b:a', '48k', '-f', 'mp3', path + '.part'], check=True)
    os.replace(path + '.part', path)


def synth_retrying(*args, tries=5):
    """synth, tried again after a dropped connection or a timeout."""
    for i in range(tries):
        try:
            return synth(*args)
        except Exception as e:  # botocore raises several kinds for network trouble
            if i == tries - 1:
                raise
            print(f'  retry {args[2][:40]!r}: {type(e).__name__}', flush=True)
            time.sleep(2 ** i)


def old_index():
    """The index the last run wrote, so a line that fails now keeps its old clip."""
    try:
        src = open(os.path.join(OUT, 'index.js')).read()
        return json.loads(src[src.index('{'):src.rindex('}') + 1])
    except (OSError, ValueError):
        return {}


def record_all():
    phrases = json.load(open(os.path.join(ROOT, 'tools', 'tts-phrases.json')))
    missing = sorted({p['voice'] for p in phrases} - set(VOICES))
    if missing:
        sys.exit(f'No Polly voice for {missing}: add them to VOICES')
    for v in {p['voice'] for p in phrases}:
        os.makedirs(os.path.join(OUT, v), exist_ok=True)
    todo = [p for p in phrases if not os.path.exists(os.path.join(OUT, p['voice'], clip_id(p) + '.mp3'))]
    chars = sum(len(p['text']) for p in todo)
    print(f'{len(phrases)} phrases, {len(todo)} to record ({chars} characters)', flush=True)

    failed = []

    def one(p):
        voice, engine = VOICES[p['voice']]
        try:
            synth_retrying(voice, engine, p['text'], p['speed'], os.path.join(OUT, p['voice'], clip_id(p) + '.mp3'))
        except Exception as e:
            failed.append(p)
            print(f'  failed {p["voice"]} {p["text"]!r}: {e}', flush=True)
    with ThreadPoolExecutor(6) as pool:
        for i, _ in enumerate(pool.map(one, todo), 1):
            if i % 500 == 0:
                print(f'  {i}/{len(todo)}', flush=True)
    # Every line that has a clip: the new one, or for a line that failed, the
    # one it had before (the next run tries it again).
    before = old_index()
    index = {}
    for p in phrases:
        ids = [clip_id(p), before.get(p['voice'], {}).get(p['text'])]
        have = [i for i in ids if i and os.path.exists(os.path.join(OUT, p['voice'], i + '.mp3'))]
        if have:
            index.setdefault(p['voice'], {})[p['text']] = have[0]
    # Drop recordings that no phrase uses any more (old Kokoro clips too).
    keep = {(v, i) for v, m in index.items() for i in m.values()}
    for v in os.listdir(OUT):
        d = os.path.join(OUT, v)
        if os.path.isdir(d):
            for f in os.listdir(d):
                if (v, f[:-4]) not in keep:
                    os.remove(os.path.join(d, f))
    with open(os.path.join(OUT, 'index.js'), 'w') as f:
        f.write('// Generated by tools/polly-build.py: voice -> sentence -> recording id.\n')
        f.write('const TTS_INDEX = ' + json.dumps(index, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'done, {len(failed)} failed' if failed else 'done', flush=True)


# A few lines in every English voice and engine, to choose voices by ear.
SAMPLE_LINES = [
    ('Good morning, Princess Yuna! My bread just came out of the oven.', 0.95),
    ('This is the C house. C says kuh. Which one starts with C?', 0.95),
    ('This is the A house. A says ah. Which picture starts with A?', 0.95),
    ('M says mmm. S says sss. F says fff.', 0.9),
]
SAMPLE_VOICES = {
    'generative': ['Ruth', 'Joanna', 'Danielle', 'Salli', 'Tiffany', 'Matthew', 'Stephen', 'Nate', 'Kenneth',
                   'Amy', 'Brian', 'Olivia', 'Niamh', 'Aria', 'Ayanda', 'Kajal', 'Jasmine'],
    'neural': ['Ivy', 'Justin', 'Kevin', 'Joanna', 'Kendra', 'Kimberly', 'Salli', 'Ruth', 'Joey', 'Matthew',
               'Gregory', 'Stephen', 'Amy', 'Emma', 'Brian', 'Arthur'],
}


def record_samples():
    os.makedirs(SAMPLES, exist_ok=True)
    jobs = [(engine, voice, i, text, speed) for engine, voices in SAMPLE_VOICES.items() for voice in voices
            for i, (text, speed) in enumerate(SAMPLE_LINES, 1)]
    made = []

    def one(job):
        engine, voice, i, text, speed = job
        name = f'{engine}-{voice}-{i}.mp3'
        try:
            synth_retrying(voice, engine, text, speed, os.path.join(SAMPLES, name))
            made.append({'engine': engine, 'voice': voice, 'line': i, 'text': text, 'file': name})
        except Exception as e:  # one voice failing shouldn't stop the rest
            print(f'{name}: {e}', flush=True)
    with ThreadPoolExecutor(6) as pool:
        list(pool.map(one, jobs))
    made.sort(key=lambda m: (m['engine'], m['voice'], m['line']))
    json.dump(made, open(os.path.join(SAMPLES, 'samples.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'{len(made)}/{len(jobs)} samples', flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mode', default='', help='all or sample (default: tools/polly-run.json)')
    args = ap.parse_args()
    mode = args.mode or json.load(open(os.path.join(ROOT, 'tools', 'polly-run.json')))['mode']
    if mode == 'sample':
        record_samples()
    elif mode == 'all':
        record_all()
    else:
        sys.exit(f'unknown mode {mode!r}')


if __name__ == '__main__':
    sys.exit(main())
