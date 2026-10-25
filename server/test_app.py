"""Tests for app.py: accounts, saves, limits and /tts (with a fake synth, so
neither Kokoro nor Polly is needed). SQLite in a temporary folder, or the
Postgres at DATABASE_URL when it is set (CI runs both).

    pip install fastapi uvicorn pytest httpx   (+ "psycopg[binary]" for Postgres)
    pytest server
"""
import asyncio
import importlib.util
import json
import os
import tempfile
import threading
import time

if not os.environ.get('DATABASE_URL'):
    os.environ['DATA_DIR'] = tempfile.mkdtemp(prefix='pixeltown-test-')
os.environ.pop('ALLOWED_ORIGINS', None)

import httpx  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import app  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
client = TestClient(app.app)
_ip = [0]


def ip():
    """A new made-up client address (the server trusts the last X-Forwarded-For)."""
    _ip[0] += 1
    return f'10.{_ip[0] >> 16 & 255}.{_ip[0] >> 8 & 255}.{_ip[0] & 255}'


def call(method, path, body=None, token=None, addr=None, headers=None):
    h = {'X-Forwarded-For': addr or ip()}
    if token:
        h['Authorization'] = f'Bearer {token}'
    h.update(headers or {})
    return client.request(method, path, json=body, headers=h)


def signup(uid='kid_one', pw='secret12'):
    r = call('POST', '/auth/signup', {'id': uid, 'pw': pw})
    assert r.status_code == 200, r.text
    return r.json()['token']


@pytest.fixture(autouse=True)
def fresh():
    for table in ('users', 'tokens', 'saves', 'save_history'):
        app.db.run(f'DELETE FROM {table}')
    app.failures.clear()
    app.tts_buckets.clear()
    app.nudged.clear()
    with app.cache_lock:
        app.cache.clear()
        app.cache_size[0] = 0
    yield


def fresh_module(**env):
    """app.py imported again, with these environment variables."""
    saved = {k: os.environ.get(k) for k in env}
    os.environ.update(env)
    try:
        spec = importlib.util.spec_from_file_location(f'app_again_{time.monotonic_ns()}', os.path.join(HERE, 'app.py'))
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod
    finally:
        for k, v in saved.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v


# ---- Accounts ------------------------------------------------------------

def test_health():
    r = client.get('/')
    assert r.status_code == 200 and r.json()['ok'] is True


def test_signup_login_verify():
    token = signup()
    r = call('POST', '/auth/login', {'id': 'kid_one', 'pw': 'secret12'})
    assert r.status_code == 200 and r.json()['token']
    assert call('POST', '/auth/verify', {'pw': 'secret12'}, token).json() == {'ok': True}
    assert call('POST', '/auth/verify', {'pw': 'nope'}, token).json() == {'ok': False}
    assert call('POST', '/auth/login', {'id': 'kid_one', 'pw': 'nope'}).status_code == 401
    assert call('POST', '/auth/signup', {'id': 'kid_one', 'pw': 'secret12'}).status_code == 409


def test_new_accounts_need_six_characters_old_four_still_work():
    assert call('POST', '/auth/signup', {'id': 'short_pw', 'pw': '12345'}).status_code == 400
    # An account made when 4 characters were enough.
    salt = 'ab' * 16
    app.db.run('INSERT INTO users (id, salt, hash, created) VALUES (?, ?, ?, ?)', ('old_kid', salt, app.hash_pw('1234', salt), 1))
    r = call('POST', '/auth/login', {'id': 'old_kid', 'pw': '1234'})
    assert r.status_code == 200
    assert call('POST', '/auth/verify', {'pw': '1234'}, r.json()['token']).json() == {'ok': True}


def test_tokens_stay_valid_and_are_per_user():
    a = signup('kid_a')
    b = signup('kid_b')
    assert call('PUT', '/save', {'save': {'stars': 3}, 'base': 0}, a).status_code == 200
    assert call('GET', '/save', None, b).json() == {'save': None, 'updated': 0}
    assert call('GET', '/save', None, 'made-up').status_code == 401
    assert call('GET', '/save').status_code == 401
    # A token from long ago (a tablet signed in for a year) still works.
    app.db.run('INSERT INTO tokens (hash, user_id, created) VALUES (?, ?, ?)', (app.hash_token('old-token'), 'kid_a', app.now_ms() - 400 * 86400 * 1000))
    assert call('GET', '/save', None, 'old-token').json()['save'] == {'stars': 3}
    call('POST', '/auth/logout', None, a)
    assert call('GET', '/save', None, a).status_code == 401


def test_lockout_is_per_id_and_address():
    signup('kid_lock', 'secret12')
    stranger = '10.200.0.1'
    for _ in range(10):
        assert call('POST', '/auth/login', {'id': 'kid_lock', 'pw': 'wrong'}, addr=stranger).status_code == 401
    assert call('POST', '/auth/login', {'id': 'kid_lock', 'pw': 'secret12'}, addr=stranger).status_code == 429
    # The owner elsewhere: the id only slows down (here a 1 s wait), no 10-minute lock.
    home = '10.200.0.2'
    r = call('POST', '/auth/login', {'id': 'kid_lock', 'pw': 'secret12'}, addr=home)
    assert r.status_code == 429 and int(r.headers['retry-after']) <= 1
    time.sleep(1.05)
    r = call('POST', '/auth/login', {'id': 'kid_lock', 'pw': 'secret12'}, addr=home)
    assert r.status_code == 200
    # The parent panel's check, signed in, never waits for the stranger.
    assert call('POST', '/auth/verify', {'pw': 'secret12'}, r.json()['token'], addr=home).json() == {'ok': True}


def test_login_backoff_grows():
    signup('kid_slow', 'secret12')
    for i in range(12):
        call('POST', '/auth/login', {'id': 'kid_slow', 'pw': 'wrong'}, addr=f'10.201.0.{i}')
    # 12 failures (2 over the free 10, the last 2 of them waited on): 4 s.
    wait = app.id_wait('kid_slow')
    assert 0 < wait <= 4


def test_signups_per_address_are_limited():
    addr = '10.202.0.1'
    for i in range(5):
        assert call('POST', '/auth/signup', {'id': f'many_{i}', 'pw': 'secret12'}, addr=addr).status_code == 200
    assert call('POST', '/auth/signup', {'id': 'many_5', 'pw': 'secret12'}, addr=addr).status_code == 429


# ---- Saves ---------------------------------------------------------------

def test_save_versions_and_conflict():
    token = signup()
    r = call('PUT', '/save', {'save': {'fmt': 2, 'stars': 1}, 'base': 0}, token)
    v1 = r.json()['updated']
    r = call('PUT', '/save', {'save': {'fmt': 2, 'stars': 2}, 'base': v1}, token)
    v2 = r.json()['updated']
    assert v2 > v1
    # Built on the older version: another device saved first.
    assert call('PUT', '/save', {'save': {'fmt': 2, 'stars': 9}, 'base': v1}, token).status_code == 409
    assert call('GET', '/save', None, token).json() == {'save': {'fmt': 2, 'stars': 2}, 'updated': v2}


def test_save_contents_are_not_checked():
    token = signup()
    odd = {'anything': [1, {'x': None}], 'other': 'not an object', 'stars': 'many'}
    assert call('PUT', '/save', {'save': odd, 'base': 0}, token).status_code == 200
    assert call('GET', '/save', None, token).json()['save'] == odd


def test_save_size_limits():
    token = signup()
    big = {'blob': 'x' * (app.MAX_SAVE + 10)}
    assert call('PUT', '/save', {'save': big, 'base': 0}, token).status_code == 413
    # Over 1 MB: turned away by its length before it is read or parsed (not
    # even valid JSON, which would otherwise be a 422).
    body = b'{' + b'x' * (app.MAX_BODY + 1)
    r = client.put('/save', content=body, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    assert r.status_code == 413
    # The same without a length, streamed in pieces.
    def pieces():
        for _ in range(20):
            yield b'x' * 65536
    r = client.put('/save', content=pieces(), headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    assert r.status_code == 413


def test_old_game_tab_is_sent_to_reload_once():
    token = signup()
    v = call('PUT', '/save', {'save': {'fmt': 2, 'stars': 5}, 'base': 0}, token).json()['updated']
    # An older game in some tab (no fmt): 409, so it fetches and reloads.
    assert call('PUT', '/save', {'save': {'stars': 5}, 'base': v}, token).status_code == 409
    # Still old after the reload (cached files): stored, never a reload loop.
    r = call('PUT', '/save', {'save': {'stars': 6}, 'base': v}, token)
    assert r.status_code == 200
    v = r.json()['updated']
    # The stored save is old now: old saves go through, new ones too.
    v = call('PUT', '/save', {'save': {'stars': 7}, 'base': v}, token).json()['updated']
    assert call('PUT', '/save', {'save': {'fmt': 2, 'stars': 8}, 'base': v}, token).status_code == 200


def test_old_saves_without_fmt_are_fine_until_a_new_one():
    token = signup()
    v = call('PUT', '/save', {'save': {'stars': 1}, 'base': 0}, token).json()['updated']
    assert call('PUT', '/save', {'save': {'stars': 2}, 'base': v}, token).status_code == 200


def test_save_history_keeps_the_last_twenty():
    token = signup()
    base = 0
    for i in range(25):
        r = call('PUT', '/save', {'save': {'fmt': 2, 'n': i}, 'base': base}, token)
        assert r.status_code == 200
        base = r.json()['updated']
    rows = app.db.run('SELECT data, updated FROM save_history WHERE user_id = ? ORDER BY updated', ('kid_one',))
    assert len(rows) == app.SAVE_HISTORY
    # The saves before the current one, newest last, ready to roll back to.
    assert [json.loads(d)['n'] for d, _ in rows] == list(range(4, 24))


def test_existing_database_gets_the_new_table():
    # A database from before save_history: accounts, tokens and saves as they were.
    app.db.run('DROP TABLE IF EXISTS save_history')
    salt = 'cd' * 16
    app.db.run('INSERT INTO users (id, salt, hash, created) VALUES (?, ?, ?, ?)', ('before', salt, app.hash_pw('1234', salt), 1))
    app.db.run('INSERT INTO tokens (hash, user_id, created) VALUES (?, ?, ?)', (app.hash_token('tablet-token'), 'before', app.now_ms() - 30 * 86400 * 1000))
    app.db.run('INSERT INTO saves (user_id, data, updated) VALUES (?, ?, ?)', ('before', json.dumps({'stars': 4}), 100))
    again = fresh_module()
    c = TestClient(again.app)
    auth = {'Authorization': 'Bearer tablet-token'}
    assert c.get('/save', headers=auth).json() == {'save': {'stars': 4}, 'updated': 100}
    assert c.put('/save', json={'save': {'fmt': 2, 'stars': 5}, 'base': 100}, headers=auth).status_code == 200
    assert len(again.db.run('SELECT 1 FROM save_history WHERE user_id = ?', ('before',))) == 1
    assert c.post('/auth/login', json={'id': 'before', 'pw': '1234'}).status_code == 200


# ---- CORS ----------------------------------------------------------------

def preflight(c, origin):
    return c.options('/save', headers={'Origin': origin, 'Access-Control-Request-Method': 'PUT',
                                       'Access-Control-Request-Headers': 'authorization,content-type'})


def test_cors_default_is_the_game_and_localhost():
    for origin in ('https://dongwookim-ml.github.io', 'http://localhost:8080', 'http://127.0.0.1:5500'):
        r = preflight(client, origin)
        assert r.status_code == 200 and r.headers['access-control-allow-origin'] == origin
    r = preflight(client, 'https://evil.example')
    assert 'access-control-allow-origin' not in r.headers
    r = client.get('/', headers={'Origin': 'https://dongwookim-ml.github.io'})
    assert r.headers['access-control-allow-origin'] == 'https://dongwookim-ml.github.io'


def test_cors_can_be_set():
    c = TestClient(fresh_module(ALLOWED_ORIGINS='https://a.example, https://b.example').app)
    assert preflight(c, 'https://b.example').headers['access-control-allow-origin'] == 'https://b.example'
    assert 'access-control-allow-origin' not in preflight(c, 'https://dongwookim-ml.github.io').headers
    c = TestClient(fresh_module(ALLOWED_ORIGINS='*').app)
    assert preflight(c, 'https://anywhere.example').headers['access-control-allow-origin'] in ('*', 'https://anywhere.example')


# ---- Speech --------------------------------------------------------------

@pytest.fixture
def fake_synth(monkeypatch):
    fake = {'made': [], 'running': [0, 0], 'delay': 0}  # running: now, most at once
    lock = threading.Lock()

    def synth(voice, text, speed):
        with lock:
            fake['running'][0] += 1
            fake['running'][1] = max(fake['running'][1], fake['running'][0])
        time.sleep(fake['delay'])
        with lock:
            fake['running'][0] -= 1
            fake['made'].append((voice, text, speed))
        return f'{voice}|{text}|{speed}'.encode() * 10

    monkeypatch.setattr(app, 'synth', synth)
    return fake


def test_tts_voices_cache_and_headers(fake_synth):
    r = client.get('/tts', params={'text': 'Hello Seoyeon', 'voice': 'af_sarah'})
    assert r.status_code == 200 and r.headers['content-type'] == 'audio/wav'
    assert r.headers['cache-control'].startswith('private')
    client.get('/tts', params={'text': 'Hello  Seoyeon', 'voice': 'af_sarah'})
    assert len(fake_synth['made']) == 1  # the second came from the cache
    assert client.get('/tts', params={'text': 'Hi', 'voice': 'evil_voice'}).status_code == 400
    assert client.get('/tts', params={'text': '   '}).status_code == 400
    assert client.get('/tts', params={'text': 'x' * (app.MAX_CHARS + 1)}).status_code == 422


def test_every_game_voice_is_accepted():
    # Every voice js/data.js and the captain files give a villager, and the narrator.
    import re
    root = os.path.join(HERE, '..', 'js')
    voices = set()
    for name in os.listdir(root):
        voices |= set(re.findall(r"tts: '([a-z_]+)'", open(os.path.join(root, name), encoding='utf8').read()))
    voices.add('af_heart')
    assert voices and voices <= set(app.POLLY_VOICES), voices - set(app.POLLY_VOICES)


def test_tts_rate_limit_per_address(fake_synth):
    addr = '10.203.0.1'
    t = time.monotonic()
    codes = [client.get('/tts', params={'text': f'line {i}'}, headers={'X-Forwarded-For': addr}).status_code for i in range(app.TTS_PER_MIN + 10)]
    refilled = int((time.monotonic() - t) * app.TTS_PER_MIN / 60) + 1  # one a second meanwhile
    assert codes[:app.TTS_PER_MIN] == [200] * app.TTS_PER_MIN and codes[-1] == 429
    assert codes.count(200) <= app.TTS_PER_MIN + refilled
    assert client.get('/tts', params={'text': 'line'}, headers={'X-Forwarded-For': '10.203.0.2'}).status_code == 200


def test_tts_cache_is_capped_by_bytes(fake_synth, monkeypatch):
    monkeypatch.setattr(app, 'CACHE_BYTES', 1000)
    for i in range(30):
        assert client.get('/tts', params={'text': f'line number {i}'}).status_code == 200
    assert 0 < app.cache_size[0] <= 1000
    assert app.cache_size[0] == sum(len(v) for v in app.cache.values())
    assert ('af_heart', 'line number 29', 0.95) in app.cache  # the newest stay
    assert ('af_heart', 'line number 0', 0.95) not in app.cache


def test_tts_runs_two_at_a_time_and_accounts_stay_quick(fake_synth):
    fake_synth['delay'] = 0.4

    async def main():
        transport = httpx.ASGITransport(app=app.app)
        async with httpx.AsyncClient(transport=transport, base_url='http://test') as c:
            lines = [c.get('/tts', params={'text': f'slow {i}'}, headers={'X-Forwarded-For': f'10.204.0.{i}'}) for i in range(6)]
            pending = [asyncio.ensure_future(x) for x in lines]
            await asyncio.sleep(0.1)
            t = time.monotonic()
            health = await c.get('/')
            quick = time.monotonic() - t
            done = await asyncio.gather(*pending)
            return health.status_code, quick, [r.status_code for r in done]

    status, quick, codes = asyncio.run(main())
    assert status == 200 and quick < 0.3
    assert codes == [200] * 6
    assert fake_synth['running'][1] == app.SYNTH_SLOTS


def test_tts_too_many_waiting_is_busy(fake_synth, monkeypatch):
    fake_synth['delay'] = 0.3
    monkeypatch.setattr(app, 'SYNTH_QUEUE', 2)

    async def main():
        transport = httpx.ASGITransport(app=app.app)
        async with httpx.AsyncClient(transport=transport, base_url='http://test') as c:
            return [r.status_code for r in await asyncio.gather(*[c.get('/tts', params={'text': f'q {i}'}) for i in range(5)])]

    codes = asyncio.run(main())
    assert codes.count(200) == 2 and codes.count(503) == 3
