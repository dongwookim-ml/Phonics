"""Cache math lessons and quest instructions from the game's existing English speech service.

python3 tools/record-math.py --plan   # print the finite recording plan
python3 tools/record-math.py          # build only missing/changed math clips
python3 tools/record-math.py --lesson quests  # cache both editions’ quest goals

Uses the service's Polly neural voices, independent of the generative phonics
recordings. Keeps provenance and content hashes in audio/<lesson>/manifest.json.
Requires ffmpeg (Linux) or afconvert (macOS), no AWS credentials on this device.
"""
import argparse
import array
import hashlib
import json
import math
import pathlib
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import wave

ROOT = pathlib.Path(__file__).resolve().parent.parent

def plan(lesson='math'):
    source = r"""
const fs=require('fs'),vm=require('vm');
const source=['js/locales/ko.js','js/locales/en.js','js/i18n.js','js/data.js','js/math-data.js','js/math-speech.js','js/quest-speech.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const ctx={location:{search:''},localStorage:{getItem(){return null}}};
process.stdout.write(JSON.stringify(vm.runInNewContext(source+'\n({server:TTS_SERVER,phrases:'+ (process.argv[1]==='quests'?'QuestSpeech':'MathSpeech') +'.phrases()})',ctx)));
"""
    return json.loads(subprocess.check_output(['node', '-e', source, lesson], cwd=ROOT))

def request(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=40) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code not in (429, 502, 503, 504) or attempt == 3:
                raise
            time.sleep(min(10, int(error.headers.get('Retry-After', 3)) + attempt))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', action='store_true')
    parser.add_argument('--lesson', choices=['math','quests'], default='math')
    args = parser.parse_args()
    outdir = ROOT / 'audio' / args.lesson
    data = plan(args.lesson)
    if args.plan:
        print(json.dumps(data, indent=2))
        return
    health = json.loads(request(data['server'] + '/'))
    if not health.get('ok') or health.get('engine') != 'polly':
        raise RuntimeError('Expected the existing Polly speech service')
    encoder = shutil.which('ffmpeg') or shutil.which('afconvert')
    if not encoder:
        raise RuntimeError('Install ffmpeg or use macOS afconvert')
    outdir.mkdir(parents=True, exist_ok=True)
    previous = json.loads((outdir / 'manifest.json').read_text()) if (outdir / 'manifest.json').exists() else {}
    old = {c['file']: c for c in previous.get('clips', [])}
    index, clips = {}, []
    for pos, phrase in enumerate(data['phrases'], 1):
        identity = json.dumps({'recipe': 'polly-neural-' + args.lesson + '-aac-v1', **phrase}, sort_keys=True)
        name = hashlib.sha256(identity.encode()).hexdigest()[:20] + '.m4a'
        target = outdir / name
        rel = 'audio/' + args.lesson + '/' + name
        clip = old.get(rel)
        if not target.exists() or clip is None or hashlib.sha256(target.read_bytes()).hexdigest() != clip['sha256']:
            audio = request(data['server'] + '/tts?' + urllib.parse.urlencode(phrase))
            with tempfile.TemporaryDirectory(prefix='phonics-math-') as temp:
                raw, cleaned = pathlib.Path(temp) / 'source.wav', pathlib.Path(temp) / 'clean.wav'
                raw.write_bytes(audio)
                with wave.open(str(raw), 'rb') as wav:
                    params = wav.getparams()
                    if params.nchannels != 1 or params.sampwidth != 2:
                        raise RuntimeError('Expected mono PCM16 speech')
                    samples = array.array('h', wav.readframes(wav.getnframes()))
                peak = max(abs(s) for s in samples)
                if peak < 300:
                    raise RuntimeError('Silent math recording: ' + phrase['text'])
                # Keep 80 ms around the speech and normalize its peak to -2 dB.
                audible = [i for i, sample in enumerate(samples) if abs(sample) > 100]
                pad = round(params.framerate * .08)
                samples = samples[max(0, audible[0]-pad):min(len(samples), audible[-1]+pad+1)]
                scale = min(2, .79 * 32767 / peak)
                samples = array.array('h', (round(s*scale) for s in samples))
                seconds = len(samples) / params.framerate
                if not .18 <= seconds <= 18:
                    raise RuntimeError('Unexpected speech duration: ' + phrase['text'])
                with wave.open(str(cleaned), 'wb') as wav:
                    wav.setparams(params)
                    wav.writeframes(samples.tobytes())
                if pathlib.Path(encoder).name == 'afconvert':
                    command = [encoder, '-f', 'm4af', '-d', 'aac@44100', '-b', '64000', str(cleaned), str(target)]
                else:
                    command = [encoder, '-v', 'error', '-y', '-i', str(cleaned), '-c:a', 'aac', '-b:a', '64k', str(target)]
                subprocess.run(command, check=True)
            rms = math.sqrt(sum(s*s for s in samples)/len(samples))/32768
            clip = {**phrase, 'file': rel, 'seconds': round(seconds, 3), 'rmsDb': round(20*math.log10(rms), 2),
                    'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
            print(f"{pos}/{len(data['phrases'])} {phrase['voice']}: {phrase['text']}", flush=True)
        index.setdefault(phrase['voice'], {})[phrase['text']] = rel
        clips.append(clip)
        # Incremental progress is resumable after a network interruption.
        manifest = {'source': data['server'], 'engine': 'Amazon Polly neural', 'language': 'en', 'clips': clips}
        (outdir / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
        (outdir / 'index.js').write_text('// Generated by tools/record-math.py. English ' + args.lesson + ' instructions, cached locally.\nconst ' + args.lesson.upper() + '_AUDIO_INDEX = ' + json.dumps(index, indent=2) + ';\n')
    print(f'{len(clips)} local {args.lesson} clips ready')

if __name__ == '__main__':
    main()
