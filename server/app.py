"""PixelTown server: live speech and player accounts.

Speech: lines that were not pre-recorded (a custom name, for example) are
spoken here. GET /tts?voice=af_heart&text=Hello returns a WAV.

ENGINE=kokoro (default) runs the Kokoro model on this machine; the model is
loaded on the first /tts call. ENGINE=polly uses Amazon Polly instead; set
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_REGION. Kokoro voice names
are mapped to Polly voices in POLLY_VOICES.

Accounts: POST /auth/signup and /auth/login take {id, pw} and return a token;
POST /auth/verify {pw} checks the password again (the parent panel);
GET /save and PUT /save {save, updated} keep the game's save on the server.
Data goes to Postgres when DATABASE_URL is set (Railway's Postgres plugin),
otherwise to SQLite at $DATA_DIR/pixeltown.db (default ./data).

ALLOWED_ORIGINS limits which sites may call it (comma separated, default *).
"""
import hashlib
import hmac
import io
import json
import os
import re
import secrets
import threading
import time
from collections import OrderedDict, defaultdict, deque

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

ENGINE = os.environ.get('ENGINE', 'kokoro')
MAX_CHARS = 200

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=os.environ.get('ALLOWED_ORIGINS', '*').split(','),
                   allow_methods=['GET', 'POST', 'PUT'], allow_headers=['*', 'Authorization'])

# ---- Speech --------------------------------------------------------------

# Kokoro voice -> Polly voice, so the game can ask for the same names.
POLLY_VOICES = {
    'af_heart': 'Joanna', 'af_bella': 'Salli', 'af_sky': 'Ivy', 'af_nova': 'Ivy', 'af_nicole': 'Kendra',
    'af_river': 'Ruth', 'af_jessica': 'Danielle', 'bf_isabella': 'Amy', 'bf_alice': 'Emma', 'bf_lily': 'Amy',
    'am_michael': 'Matthew', 'am_eric': 'Stephen', 'am_adam': 'Gregory', 'am_liam': 'Joey', 'am_puck': 'Kevin',
    'am_santa': 'Gregory', 'bm_fable': 'Brian', 'bm_george': 'Arthur', 'bm_lewis': 'Brian',
}

engine = {}
engine_lock = threading.Lock()
cache = OrderedDict()


def tts_engine():
    """The Polly client or the Kokoro model, made on first use so the account
    endpoints work (and start fast) without loading the model."""
    with engine_lock:
        if not engine:
            if ENGINE == 'polly':
                import boto3
                engine['polly'] = boto3.client('polly', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
            else:
                from kokoro_onnx import Kokoro
                engine['kokoro'] = Kokoro(os.environ.get('KOKORO_MODEL', 'kokoro.onnx'),
                                          os.environ.get('KOKORO_VOICES', 'voices.bin'))
    return engine


def synth(voice, text, speed):
    import numpy as np
    import soundfile as sf
    e = tts_engine()
    if 'polly' in e:
        r = e['polly'].synthesize_speech(Text=text, VoiceId=POLLY_VOICES.get(voice, 'Joanna'), Engine='neural',
                                         OutputFormat='pcm', SampleRate='16000')
        pcm = np.frombuffer(r['AudioStream'].read(), dtype='<i2')
        samples, rate = pcm, 16000
    else:
        kokoro = e['kokoro']
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
    return {'ok': True, 'engine': ENGINE, 'db': 'postgres' if DATABASE_URL else 'sqlite'}

# ---- Storage -------------------------------------------------------------

DATABASE_URL = os.environ.get('DATABASE_URL', '')
SCHEMA = [
    'CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL, created BIGINT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS tokens (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, created BIGINT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS saves (user_id TEXT PRIMARY KEY, data TEXT NOT NULL, updated BIGINT NOT NULL)',
]


class Db:
    """One small wrapper over Postgres or SQLite. Queries use ? placeholders."""

    def __init__(self):
        self.pg = bool(DATABASE_URL)
        self.lock = threading.Lock()
        if self.pg:
            import psycopg
            self.connect = lambda: psycopg.connect(DATABASE_URL, autocommit=True)
        else:
            import sqlite3
            folder = os.environ.get('DATA_DIR', './data')
            os.makedirs(folder, exist_ok=True)
            path = os.path.join(folder, 'pixeltown.db')
            self.connect = lambda: sqlite3.connect(path, isolation_level=None, check_same_thread=False)
        self.conn = None
        for q in SCHEMA:
            self.run(q)

    def run(self, q, args=(), one=False):
        if self.pg:
            q = q.replace('?', '%s')
        with self.lock:
            # One shared connection; a dropped Postgres connection is reopened once.
            for attempt in (0, 1):
                try:
                    if self.conn is None:
                        self.conn = self.connect()
                    cur = self.conn.execute(q, args)
                    rows = cur.fetchall() if cur.description else []
                    return (rows[0] if rows else None) if one else rows
                except Exception as e:
                    if not self.pg or attempt or not _is_connection_error(e):
                        raise
                    self.conn = None


def _is_connection_error(e):
    import psycopg
    return isinstance(e, psycopg.OperationalError) or isinstance(e, psycopg.InterfaceError)


db = Db()

# ---- Accounts ------------------------------------------------------------

ID_RE = re.compile(r'^[a-z0-9_]{3,20}$')
MIN_PW = 4
MAX_PW = 200
MAX_SAVE = 512 * 1024
TOKEN_DAYS = 3650  # a family tablet stays signed in


class Creds(BaseModel):
    id: str = ''
    pw: str = ''


class Verify(BaseModel):
    pw: str = ''


class SaveBody(BaseModel):
    save: dict
    updated: int


def hash_pw(pw, salt):
    return hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt), n=2 ** 14, r=8, p=1, dklen=32).hex()


def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


def new_token(user_id):
    token = secrets.token_urlsafe(32)
    db.run('INSERT INTO tokens (hash, user_id, created) VALUES (?, ?, ?)', (hash_token(token), user_id, now_ms()))
    return token


def now_ms():
    return int(time.time() * 1000)


def check_pw(user_id, pw):
    row = db.run('SELECT salt, hash FROM users WHERE id = ?', (user_id,), one=True)
    if not row:
        hash_pw(pw, '00' * 16)  # same work either way, so timing does not reveal ids
        return False
    return hmac.compare_digest(hash_pw(pw, row[0]), row[1])


def current_user(authorization: str = Header('')):
    token = authorization[7:].strip() if authorization.lower().startswith('bearer ') else ''
    row = token and db.run('SELECT user_id, created FROM tokens WHERE hash = ?', (hash_token(token),), one=True)
    if not row or now_ms() - row[1] > TOKEN_DAYS * 86400 * 1000:
        raise HTTPException(401, 'bad token')
    return row[0]


# Failed logins, in memory: at most 10 per id and 30 per address in 10 minutes.
LIMIT_WINDOW = 600
LIMITS = {'id': 10, 'ip': 30}
failures = defaultdict(deque)
fail_lock = threading.Lock()


def limited(keys):
    t = time.time()
    with fail_lock:
        for kind, key in keys:
            q = failures[(kind, key)]
            while q and t - q[0] > LIMIT_WINDOW:
                q.popleft()
            if len(q) >= LIMITS[kind]:
                return True
    return False


def note_failure(keys):
    with fail_lock:
        for k in keys:
            failures[k].append(time.time())


def client_ip(request):
    # Railway sits behind a proxy that sets X-Forwarded-For.
    fwd = request.headers.get('x-forwarded-for', '')
    return fwd.split(',')[0].strip() or (request.client.host if request.client else '?')


@app.post('/auth/signup')
def signup(body: Creds, request: Request):
    uid = body.id.strip().lower()
    if not ID_RE.match(uid):
        raise HTTPException(400, 'bad id')
    if not MIN_PW <= len(body.pw) <= MAX_PW:
        raise HTTPException(400, 'bad pw')
    keys = [('ip', client_ip(request))]
    if limited(keys):
        raise HTTPException(429, 'too many tries')
    if db.run('SELECT 1 FROM users WHERE id = ?', (uid,), one=True):
        note_failure(keys)
        raise HTTPException(409, 'id taken')
    salt = secrets.token_hex(16)
    try:
        db.run('INSERT INTO users (id, salt, hash, created) VALUES (?, ?, ?, ?)', (uid, salt, hash_pw(body.pw, salt), now_ms()))
    except Exception:
        raise HTTPException(409, 'id taken')
    return {'ok': True, 'id': uid, 'token': new_token(uid)}


@app.post('/auth/login')
def login(body: Creds, request: Request):
    uid = body.id.strip().lower()
    keys = [('id', uid), ('ip', client_ip(request))]
    if limited(keys):
        raise HTTPException(429, 'too many tries')
    if not ID_RE.match(uid) or not check_pw(uid, body.pw[:MAX_PW]):
        note_failure(keys)
        raise HTTPException(401, 'wrong id or pw')
    return {'ok': True, 'id': uid, 'token': new_token(uid)}


@app.post('/auth/verify')
def verify(body: Verify, request: Request, uid: str = Depends(current_user)):
    keys = [('id', uid), ('ip', client_ip(request))]
    if limited(keys):
        raise HTTPException(429, 'too many tries')
    ok = check_pw(uid, body.pw[:MAX_PW])
    if not ok:
        note_failure(keys)
    return {'ok': ok}


@app.post('/auth/logout')
def logout(authorization: str = Header('')):
    token = authorization[7:].strip() if authorization.lower().startswith('bearer ') else ''
    if token:
        db.run('DELETE FROM tokens WHERE hash = ?', (hash_token(token),))
    return {'ok': True}


@app.get('/save')
def get_save(uid: str = Depends(current_user)):
    row = db.run('SELECT data, updated FROM saves WHERE user_id = ?', (uid,), one=True)
    if not row:
        return {'save': None, 'updated': 0}
    return {'save': json.loads(row[0]), 'updated': row[1]}


@app.put('/save')
def put_save(body: SaveBody, uid: str = Depends(current_user)):
    data = json.dumps(body.save, separators=(',', ':'))
    if len(data) > MAX_SAVE:
        raise HTTPException(413, 'save too big')
    row = db.run('SELECT updated FROM saves WHERE user_id = ?', (uid,), one=True)
    # The newer save wins; an older one (from a device that was offline) is ignored.
    if row and row[0] > body.updated:
        return {'ok': False, 'updated': row[0]}
    if row:
        db.run('UPDATE saves SET data = ?, updated = ? WHERE user_id = ?', (data, body.updated, uid))
    else:
        db.run('INSERT INTO saves (user_id, data, updated) VALUES (?, ?, ?)', (uid, data, body.updated))
    return {'ok': True, 'updated': body.updated}
