"""PixelTown server: live speech and player accounts.

Speech: lines that were not pre-recorded (a custom name, for example) are
spoken here. GET /tts?voice=af_heart&text=Hello returns a WAV.

ENGINE=kokoro (default) runs the Kokoro model on this machine; the model is
loaded on the first /tts call. ENGINE=polly uses Amazon Polly instead; set
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_REGION. Kokoro voice names
are mapped to Polly voices in POLLY_VOICES, which is also the list of voices
/tts accepts. Each address gets about TTS_PER_MIN lines a minute, at most
SYNTH_SLOTS lines are made at once (in their own threads, so the accounts
stay quick), and the made lines are cached up to CACHE_BYTES.

Accounts: POST /auth/signup and /auth/login take {id, pw} and return a token;
POST /auth/verify {pw} checks the password again (the parent panel);
GET /save and PUT /save {save, base} keep the game's save on the server, and
the last SAVE_HISTORY saves per player stay in save_history for rollback.
Data goes to Postgres when DATABASE_URL is set (Railway's Postgres plugin),
otherwise to SQLite at $DATA_DIR/pixeltown.db (default ./data).

ALLOWED_ORIGINS limits which sites may call it (comma separated, or *); by
default the game's site and localhost. Request bodies over MAX_BODY are
turned away before they are read.
"""
import asyncio
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
from concurrent.futures import ThreadPoolExecutor

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

ENGINE = os.environ.get('ENGINE', 'kokoro')
MAX_CHARS = 200
MAX_BODY = 1024 * 1024
GAME_ORIGINS = ['https://dongwookim-ml.github.io']
LOCAL_ORIGINS = r'https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?'


class BodyLimit:
    """Turns away a request body over MAX_BODY before anything reads it: by
    its Content-Length, or while it streams in without one."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)
        length = dict(scope['headers']).get(b'content-length')
        if length is not None and (not length.isdigit() or int(length) > MAX_BODY):
            return await JSONResponse({'detail': 'request too big'}, 413)(scope, receive, send)
        seen = 0

        async def limited():
            nonlocal seen
            message = await receive()
            if message['type'] == 'http.request':
                seen += len(message.get('body', b''))
                if seen > MAX_BODY:
                    raise HTTPException(413, 'request too big')
            return message

        await self.app(scope, limited, send)


app = FastAPI()
app.add_middleware(BodyLimit)
# Added last, so it is the outermost: even a refusal carries the CORS headers.
_origins = [o.strip() for o in os.environ.get('ALLOWED_ORIGINS', '').split(',') if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=_origins or GAME_ORIGINS,
                   allow_origin_regex=None if _origins else LOCAL_ORIGINS,
                   allow_methods=['GET', 'POST', 'PUT'], allow_headers=['*', 'Authorization'])

# ---- Speech --------------------------------------------------------------

# Kokoro voice -> Polly voice, so the game can ask for the same names.
POLLY_VOICES = {
    'af_heart': 'Joanna', 'af_bella': 'Salli', 'af_sky': 'Ivy', 'af_nova': 'Ivy', 'af_nicole': 'Kendra',
    'af_river': 'Ruth', 'af_jessica': 'Danielle', 'bf_isabella': 'Amy', 'bf_alice': 'Emma', 'bf_lily': 'Amy',
    'am_michael': 'Matthew', 'am_eric': 'Stephen', 'am_adam': 'Gregory', 'am_liam': 'Joey', 'am_puck': 'Kevin',
    'am_santa': 'Gregory', 'bm_fable': 'Brian', 'bm_george': 'Arthur', 'bm_lewis': 'Brian',
    'af_kore': 'Ivy', 'af_aoede': 'Kimberly', 'bf_emma': 'Emma', 'am_fenrir': 'Justin', 'af_sarah': 'Ivy',
}
TTS_PER_MIN = 60           # lines a minute per address, in bursts of up to as many
SYNTH_SLOTS = 2            # lines made at the same time
SYNTH_QUEUE = 8            # more waiting than this: 503, and the game uses the device's voice
CACHE_BYTES = 50 * 1024 * 1024

engine = {}
engine_lock = threading.Lock()
cache = OrderedDict()      # (voice, text, speed) -> WAV bytes, least recently used first
cache_size = [0]
cache_lock = threading.Lock()
# Lines are made in these threads only, so a burst never takes the threads
# that serve the accounts.
synth_pool = ThreadPoolExecutor(max_workers=SYNTH_SLOTS, thread_name_prefix='synth')
synth_waiting = [0]        # lines being made or waiting for a thread
tts_buckets = {}           # address -> (tokens, time)
tts_lock = threading.Lock()


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


def cache_get(key):
    with cache_lock:
        data = cache.get(key)
        if data is not None:
            cache.move_to_end(key)
        return data


def cache_put(key, data):
    if len(data) > CACHE_BYTES:
        return
    with cache_lock:
        if key in cache:
            return
        cache[key] = data
        cache_size[0] += len(data)
        while cache_size[0] > CACHE_BYTES:
            cache_size[0] -= len(cache.popitem(last=False)[1])


def tts_allowed(ip):
    """A token bucket per address: TTS_PER_MIN lines a minute, in bursts."""
    t = time.monotonic()
    with tts_lock:
        if len(tts_buckets) > 10000:
            for k in [k for k, (_, last) in tts_buckets.items() if t - last > 60]:
                del tts_buckets[k]
        tokens, last = tts_buckets.get(ip, (TTS_PER_MIN, t))
        tokens = min(TTS_PER_MIN, tokens + (t - last) * TTS_PER_MIN / 60)
        ok = tokens >= 1
        tts_buckets[ip] = (tokens - 1 if ok else tokens, t)
        return ok


@app.get('/tts')
async def tts(request: Request, text: str = Query(..., max_length=MAX_CHARS), voice: str = 'af_heart', speed: float = 0.95):
    text = ' '.join(text.split())
    if not text:
        raise HTTPException(400, 'empty text')
    if voice not in POLLY_VOICES:
        raise HTTPException(400, 'unknown voice')
    if not tts_allowed(client_ip(request)):
        raise HTTPException(429, 'too many lines', headers={'Retry-After': '5'})
    speed = round(min(1.3, max(0.6, speed)), 2)
    key = (voice, text, speed)
    data = cache_get(key)
    if data is None:
        if synth_waiting[0] >= SYNTH_QUEUE:
            raise HTTPException(503, 'busy', headers={'Retry-After': '5'})
        synth_waiting[0] += 1
        try:
            data = await asyncio.get_running_loop().run_in_executor(synth_pool, synth, voice, text, speed)
        finally:
            synth_waiting[0] -= 1
        cache_put(key, data)
    # Private: a child's name in the line is nobody else's business.
    return Response(data, media_type='audio/wav', headers={'Cache-Control': 'private, max-age=604800'})


@app.get('/')
def health():
    return {'ok': True, 'engine': ENGINE, 'db': 'postgres' if DATABASE_URL else 'sqlite'}

# ---- Storage -------------------------------------------------------------

DATABASE_URL = os.environ.get('DATABASE_URL', '')
SCHEMA = [
    'CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL, created BIGINT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS tokens (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, created BIGINT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS saves (user_id TEXT PRIMARY KEY, data TEXT NOT NULL, updated BIGINT NOT NULL)',
    # Earlier saves, the last SAVE_HISTORY per player, to roll back to by hand.
    'CREATE TABLE IF NOT EXISTS save_history (user_id TEXT NOT NULL, updated BIGINT NOT NULL, data TEXT NOT NULL, '
    'PRIMARY KEY (user_id, updated))',
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
MIN_PW = 6  # for new accounts; older ones may have 4 and keep working
MAX_PW = 200
MAX_SAVE = 512 * 1024
SAVE_HISTORY = 20
TOKEN_DAYS = 3650  # a family tablet stays signed in


class Creds(BaseModel):
    id: str = ''
    pw: str = ''


class Verify(BaseModel):
    pw: str = ''


class SaveBody(BaseModel):
    save: dict
    base: int = 0  # the server version this save builds on


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


# Failed tries, in memory, over 10 minutes: at most 10 per id from one
# address and 30 per address, and at most 5 new accounts per address an
# hour. Someone guessing an id from elsewhere doesn't lock its owner out:
# after ID_FREE failures for an id from anywhere, its logins only slow down,
# each try waiting twice as long as the last, up to ID_MAX_WAIT seconds. The
# parent panel's check (/auth/verify, signed in already) never waits for them.
LIMIT_WINDOW = 600
LIMITS = {'pair': 10, 'ip': 30, 'signup': 5}
WINDOWS = {'signup': 3600}
ID_FREE = 10
ID_MAX_WAIT = 60
failures = defaultdict(deque)
fail_lock = threading.Lock()


def limited(keys):
    t = time.time()
    with fail_lock:
        if len(failures) > 10000:
            # Forget keys whose tries are all old, so random ids can't fill memory.
            for k in [k for k, q in failures.items() if not q or t - q[-1] > WINDOWS.get(k[0], LIMIT_WINDOW)]:
                del failures[k]
        for kind, key in keys:
            q = failures[(kind, key)]
            while q and t - q[0] > WINDOWS.get(kind, LIMIT_WINDOW):
                q.popleft()
            if len(q) >= LIMITS[kind]:
                return True
    return False


def id_wait(uid):
    """Seconds before the next login try for this id may be checked."""
    t = time.time()
    with fail_lock:
        q = failures.get(('id', uid))
        while q and t - q[0] > LIMIT_WINDOW:
            q.popleft()
        if not q or len(q) < ID_FREE:
            return 0
        return max(0.0, min(ID_MAX_WAIT, 2 ** (len(q) - ID_FREE)) - (t - q[-1]))


def note_failure(keys):
    with fail_lock:
        for k in keys:
            failures[k].append(time.time())


def client_ip(request):
    # Railway's proxy appends the real address to X-Forwarded-For; earlier
    # entries come from the caller and can be made up.
    fwd = request.headers.get('x-forwarded-for', '')
    return fwd.split(',')[-1].strip() or (request.client.host if request.client else '?')


def too_many(wait=600):
    return HTTPException(429, 'too many tries', headers={'Retry-After': str(max(1, int(wait + 0.999)))})


@app.post('/auth/signup')
def signup(body: Creds, request: Request):
    uid = body.id.strip().lower()
    if not ID_RE.match(uid):
        raise HTTPException(400, 'bad id')
    if not MIN_PW <= len(body.pw) <= MAX_PW:
        raise HTTPException(400, 'bad pw')
    ip = client_ip(request)
    keys = [('ip', ip)]
    if limited(keys + [('signup', ip)]):
        raise too_many()
    if db.run('SELECT 1 FROM users WHERE id = ?', (uid,), one=True):
        note_failure(keys)
        raise HTTPException(409, 'id taken')
    note_failure([('signup', ip)])
    salt = secrets.token_hex(16)
    try:
        db.run('INSERT INTO users (id, salt, hash, created) VALUES (?, ?, ?, ?)', (uid, salt, hash_pw(body.pw, salt), now_ms()))
    except Exception:
        raise HTTPException(409, 'id taken')
    return {'ok': True, 'id': uid, 'token': new_token(uid)}


@app.post('/auth/login')
def login(body: Creds, request: Request):
    uid = body.id.strip().lower()
    ip = client_ip(request)
    keys = [('pair', f'{uid}|{ip}'), ('ip', ip)]
    if limited(keys):
        raise too_many()
    wait = id_wait(uid)
    if wait > 0:
        raise too_many(wait)
    if not ID_RE.match(uid) or not check_pw(uid, body.pw[:MAX_PW]):
        note_failure(keys + [('id', uid)])
        raise HTTPException(401, 'wrong id or pw')
    return {'ok': True, 'id': uid, 'token': new_token(uid)}


@app.post('/auth/verify')
def verify(body: Verify, request: Request, uid: str = Depends(current_user)):
    ip = client_ip(request)
    keys = [('pair', f'{uid}|{ip}'), ('ip', ip)]
    if limited(keys):
        raise too_many()
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


# Saves from the game since it counts stars per device have fmt 2 (see
# js/progress.js). An older game in some tab sends saves without it: once
# the stored save has fmt 2, such a save gets 409, and that tab fetches the
# save and reloads, coming back as the new game. At most once per
# OLD_TAB_NUDGE seconds per player, so a tab still served the old files (a
# cache, or the site not deployed yet) is never stuck reloading; its saves
# are then stored, and the new game takes their totals as a floor.
OLD_TAB_NUDGE = 600
nudged = {}
nudge_lock = threading.Lock()


def save_fmt(save):
    fmt = save.get('fmt') if isinstance(save, dict) else None
    return fmt if isinstance(fmt, (int, float)) and not isinstance(fmt, bool) else 0


def nudge_old_tab(uid):
    t = time.time()
    with nudge_lock:
        if t - nudged.get(uid, 0) < OLD_TAB_NUDGE:
            return False
        if len(nudged) > 10000:
            for k in [k for k, v in nudged.items() if t - v > OLD_TAB_NUDGE]:
                del nudged[k]
        nudged[uid] = t
        return True


@app.put('/save')
def put_save(body: SaveBody, uid: str = Depends(current_user)):
    data = json.dumps(body.save, separators=(',', ':'))
    if len(data) > MAX_SAVE:
        raise HTTPException(413, 'save too big')
    if save_fmt(body.save) < 2:
        row = db.run('SELECT data FROM saves WHERE user_id = ?', (uid,), one=True)
        if row and save_fmt(json.loads(row[0])) >= 2 and nudge_old_tab(uid):
            raise HTTPException(409, 'saved by a newer game: reload')
    # The save being replaced goes to the history first (once).
    db.run('INSERT INTO save_history (user_id, updated, data) SELECT user_id, updated, data FROM saves WHERE user_id = ? '
           'ON CONFLICT (user_id, updated) DO NOTHING', (uid,))
    # The server stamps each save with its own clock. A save built on an older
    # version than the stored one means another device saved first: 409.
    row = db.run('SELECT updated FROM saves WHERE user_id = ?', (uid,), one=True)
    stamp = max(now_ms(), (row[0] if row else 0) + 1)
    db.run('INSERT INTO saves (user_id, data, updated) VALUES (?, ?, ?) '
           'ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated = excluded.updated '
           'WHERE saves.updated <= ?', (uid, data, stamp, body.base))
    row = db.run('SELECT updated FROM saves WHERE user_id = ?', (uid,), one=True)
    if row[0] != stamp:
        raise HTTPException(409, 'newer save on the server')
    db.run('DELETE FROM save_history WHERE user_id = ? AND updated NOT IN '
           '(SELECT updated FROM save_history WHERE user_id = ? ORDER BY updated DESC LIMIT ?)', (uid, uid, SAVE_HISTORY))
    return {'ok': True, 'updated': stamp}
