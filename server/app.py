"""Live speech for PixelTown: lines that were not pre-recorded (a custom name,
for example) are spoken here. GET /tts?voice=af_heart&text=Hello returns a WAV.

ENGINE=kokoro (default) runs the Kokoro model on this machine.
ENGINE=polly uses Amazon Polly instead; set AWS_ACCESS_KEY_ID,
AWS_SECRET_ACCESS_KEY and AWS_REGION. Kokoro voice names are mapped to
Polly voices in POLLY_VOICES.
ALLOWED_ORIGINS limits which sites may call it (comma separated, default *).
"""
import io
import os
from collections import OrderedDict

import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

ENGINE = os.environ.get('ENGINE', 'kokoro')
MAX_CHARS = 200

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=os.environ.get('ALLOWED_ORIGINS', '*').split(','),
                   allow_methods=['GET'], allow_headers=['*'])

# Kokoro voice -> Polly voice, so the game can ask for the same names.
POLLY_VOICES = {
    'af_heart': 'Joanna', 'af_bella': 'Salli', 'af_sky': 'Ivy', 'af_nova': 'Ivy', 'af_nicole': 'Kendra',
    'af_river': 'Ruth', 'af_jessica': 'Danielle', 'bf_isabella': 'Amy', 'bf_alice': 'Emma', 'bf_lily': 'Amy',
    'am_michael': 'Matthew', 'am_eric': 'Stephen', 'am_adam': 'Gregory', 'am_liam': 'Joey', 'am_puck': 'Kevin',
    'am_santa': 'Gregory', 'bm_fable': 'Brian', 'bm_george': 'Arthur', 'bm_lewis': 'Brian',
}

kokoro = None
polly = None
if ENGINE == 'polly':
    import boto3
    polly = boto3.client('polly', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
else:
    from kokoro_onnx import Kokoro
    kokoro = Kokoro(os.environ.get('KOKORO_MODEL', 'kokoro.onnx'), os.environ.get('KOKORO_VOICES', 'voices.bin'))

cache = OrderedDict()


def synth(voice, text, speed):
    if polly:
        r = polly.synthesize_speech(Text=text, VoiceId=POLLY_VOICES.get(voice, 'Joanna'), Engine='neural',
                                    OutputFormat='pcm', SampleRate='16000')
        pcm = np.frombuffer(r['AudioStream'].read(), dtype='<i2')
        samples, rate = pcm, 16000
    else:
        if voice not in kokoro.get_voices():
            voice = 'af_heart'
        samples, rate = kokoro.create(text, voice=voice, speed=speed, lang='en-us')
    buf = io.BytesIO()
    sf.write(buf, samples, rate, format='WAV', subtype='PCM_16')
    return buf.getvalue()


@app.get('/tts')
def tts(text: str = Query(..., max_length=MAX_CHARS), voice: str = 'af_heart', speed: float = 0.95):
    text = ' '.join(text.split())
    if not text:
        raise HTTPException(400, 'empty text')
    speed = min(1.3, max(0.6, speed))
    key = (voice, text, speed)
    if key not in cache:
        cache[key] = synth(voice, text, speed)
        if len(cache) > 500:
            cache.popitem(last=False)
    cache.move_to_end(key)
    return Response(cache[key], media_type='audio/wav', headers={'Cache-Control': 'public, max-age=604800'})


@app.get('/')
def health():
    return {'ok': True, 'engine': ENGINE}
