// Player accounts: the login / sign-up screen before the start screen, and
// keeping the save on the server (server/app.py) so progress follows her to
// another device. Without an account the game keeps today's browser-only save.
//
// Account.user    the signed-in id, or null
// Account.ready   resolves once the login screen is done
// Account.verify  checks the account password (the parent panel), offline too
// Account.push    uploads the save, 2 s after the last change (one at a time)
// Account.pull    the server's save, or null

// Tests point this at a local server with window.ACCOUNT_SERVER, and skip
// the login screen with ?guest or window.ACCOUNT_SKIP.
const ACCOUNT_SERVER = (window.ACCOUNT_SERVER || TTS_SERVER || '').replace(/\/$/, '');
const ACCOUNT_SAVE_KEY = 'pixeltown-v2'; // the game's own save (SAVE_KEY in game.js)
const ACCOUNT_KEYS = { token: 'pixeltown-token', user: 'pixeltown-user', guest: 'pixeltown-guest', updated: 'pixeltown-updated', snap: 'pixeltown-synced', dirty: 'pixeltown-dirty', owner: 'pixeltown-owner', join: 'pixeltown-join', pwcheck: 'pixeltown-pwcheck' };
// updated: the server version the local save builds on (the server's clock).
// dirty:   the local save has changes the server has not seen.
// owner:   whose progress the local save is; empty for a guest or an old save.
// join:    a login whose first sync has not happened yet (it was offline).
// pwcheck: a check of the password kept on this device, for the parent
//          panel offline: { id, salt, iter, hash } (PBKDF2-SHA-256).
const ACCOUNT_GUEST_PW = '0000'; // parent password when playing without an account

const accountUi = {
  screen: document.getElementById('login'),
  tabs: document.querySelectorAll('#login .login-tabs .chip'),
  id: document.getElementById('login-id'),
  pw: document.getElementById('login-pw'),
  msg: document.getElementById('login-msg'),
  go: document.getElementById('login-go'),
  guest: document.getElementById('login-guest'),
  bar: document.getElementById('account-bar'),
};

function accountGet(key) { try { return localStorage.getItem(ACCOUNT_KEYS[key]); } catch (e) { return null; } }
function accountSet(key, value) {
  try {
    if (value === null) localStorage.removeItem(ACCOUNT_KEYS[key]);
    else localStorage.setItem(ACCOUNT_KEYS[key], String(value));
  } catch (e) { /* private mode */ }
}
function accountLocalSave() { try { return localStorage.getItem(ACCOUNT_SAVE_KEY); } catch (e) { return null; } }

// A copy of the local save before a login replaces or joins it, as
// 'pixeltown-v2-backup-<time>'; the last three are kept.
function accountBackup(json) {
  try {
    const prefix = `${ACCOUNT_SAVE_KEY}-backup-`;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix)).sort();
    if (keys.length && localStorage.getItem(keys[keys.length - 1]) === json) return;
    keys.push(prefix + Date.now());
    localStorage.setItem(keys[keys.length - 1], json);
    for (const k of keys.slice(0, -3)) localStorage.removeItem(k);
  } catch (e) { /* storage full or private mode */ }
}

// The password check kept on this device. WebCrypto needs https, localhost
// or a file; elsewhere there is none and the panel needs the server.
const accountHex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
async function accountPwHash(pw, salt, iter) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  return accountHex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}
async function accountRemember(id, pw) {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iter = 150000;
    accountSet('pwcheck', JSON.stringify({ id, salt: accountHex(salt), iter, hash: await accountPwHash(pw, salt, iter) }));
  } catch (e) { /* no WebCrypto here */ }
}
// true or false, or null when this device has no check for that account.
async function accountCheckPw(id, pw) {
  try {
    const v = JSON.parse(accountGet('pwcheck'));
    if (!v || v.id !== id) return null;
    const salt = new Uint8Array(v.salt.match(/../g).map(h => parseInt(h, 16)));
    return (await accountPwHash(pw, salt, v.iter)) === v.hash;
  } catch (e) {
    return null;
  }
}

// A short note for the parent at the top of the screen.
function accountToast(text) {
  const el = document.createElement('div');
  el.className = 'account-toast';
  el.setAttribute('role', 'status');
  el.textContent = text;
  document.body.append(el);
  setTimeout(() => el.remove(), 6500);
}

// Talks to the server. Resolves to { status, data }; status 0 means offline.
async function accountFetch(method, path, body, opts = {}) {
  if (!ACCOUNT_SERVER) return { status: 0, data: null };
  const headers = { 'Content-Type': 'application/json' };
  const token = accountGet('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), opts.timeout || 8000);
  try {
    const r = await fetch(ACCOUNT_SERVER + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctl.signal, keepalive: !!opts.keepalive });
    let data = null;
    try { data = await r.json(); } catch (e) { /* empty body */ }
    return { status: r.status, data };
  } catch (e) {
    return { status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

function accountParse(json) { try { return JSON.parse(json); } catch (e) { return null; } }
// Whether js/game.js is running (so a merged save can go into it in place).
function accountInGame() {
  try { return typeof state !== 'undefined' && typeof applyProgress === 'function'; } catch (e) { return false; }
}

const Account = {
  user: null,
  ready: null,
  _resolve: null,
  _started: false, // the login screen is done; saves from now on are real progress
  _timer: 0,
  _inflight: null, // the upload on its way, if any
  _again: false,   // something changed while it was: send again after it
  get _dirty() { return !!accountGet('dirty'); },
  // The server version the local save builds on.
  get base() { return Number(accountGet('updated')) || 0; },

  // The parent password: { ok, reason }, reason 'wrong', 'offline' (no
  // connection, or the server down) or 'busy' (too many tries, try later).
  // When the server can't be reached the check kept at login answers.
  async verify(pw) {
    if (!this.user) return { ok: pw === ACCOUNT_GUEST_PW, reason: 'wrong' };
    const r = await accountFetch('POST', '/auth/verify', { pw });
    if (r.status === 200 && r.data) {
      // Signed in before this check existed (or it is another account's): keep one now.
      if (r.data.ok && (accountParse(accountGet('pwcheck')) || {}).id !== this.user) accountRemember(this.user, pw);
      return { ok: !!r.data.ok, reason: 'wrong' };
    }
    if (r.status === 429) return { ok: false, reason: 'busy' };
    const here = await accountCheckPw(this.user, pw);
    if (here !== null) return { ok: here, reason: 'wrong' };
    return { ok: false, reason: r.status === 0 || r.status >= 500 ? 'offline' : 'busy' };
  },

  async pull() {
    if (!this.user) return null;
    const r = await accountFetch('GET', '/save');
    if (r.status === 401) this._expired();
    return r.status === 200 && r.data && r.data.save ? r.data : null;
  },

  // Called by save() in game.js with the object it wrote to localStorage.
  push(saveObject) {
    if (!this._started) return; // boot-time saves, before the login screen is done
    const json = JSON.stringify(saveObject);
    if (json === accountGet('snap')) return;
    accountSet('snap', json);
    accountSet('dirty', '1');
    if (!this.user) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this._upload(), 2000);
  },

  // Sends the local save up now, one upload at a time: a save made while one
  // is on its way goes up after it, on the version that one gets back (two
  // at once would be built on the same version, and the second would be
  // refused). Fails quietly; the next save tries again.
  _upload(keepalive) {
    clearTimeout(this._timer);
    // The last one as the page goes away may overlap; a 409 there is harmless.
    if (keepalive) return this._send(true);
    if (this._inflight) { this._again = true; return this._inflight; }
    this._inflight = (async () => {
      try {
        do { this._again = false; await this._send(false); } while (this._again);
      } finally {
        this._inflight = null;
      }
    })();
    return this._inflight;
  },

  // When another device saved first (409), both saves are put together and
  // sent again on top of the server's version; the game goes on, with the
  // other device's progress added in place. Never a reload.
  async _send(keepalive) {
    for (let tries = 0; tries < 3; tries++) {
      const json = accountLocalSave();
      const save = accountParse(json);
      if (!this.user || !save || !this._dirty) return;
      // Browsers cap keepalive bodies at 64 KB.
      const r = await accountFetch('PUT', '/save', { save, base: this.base }, { keepalive: keepalive && json.length < 60000 });
      if (r.status === 200 && r.data) {
        accountSet('updated', r.data.updated);
        if (accountLocalSave() === json) accountSet('dirty', null); // nothing changed meanwhile
        return;
      }
      if (r.status === 401) { this._expired(); return; }
      if (r.status !== 409 || keepalive) return;
      const s = await accountFetch('GET', '/save');
      if (s.status !== 200 || !s.data || !s.data.save || !this._merge(s.data, 'mine')) return;
    }
  },

  // Puts the server's save together with the local one (js/progress.js; `how`
  // is 'mine' when this device has unsent progress, 'theirs' when the server's
  // copy is simply newer), stores the result as the local save on top of the
  // server's version, and shows it in the running game.
  _merge(data, how) {
    if (accountInGame()) save(); // the very latest progress goes in too
    const local = accountParse(accountLocalSave());
    const merged = local ? Progress.merge(local, data.save, how) : data.save;
    try { localStorage.setItem(ACCOUNT_SAVE_KEY, JSON.stringify(merged)); } catch (e) { return false; }
    accountSet('owner', this.user);
    accountSet('updated', data.updated);
    accountSet('snap', null);
    accountSet('dirty', Progress.same(merged, data.save) ? null : '1');
    if (accountInGame()) applyProgress(merged);
    return true;
  },

  // Makes the server's save the local one, in place.
  _take(data) {
    try { localStorage.setItem(ACCOUNT_SAVE_KEY, JSON.stringify(data.save)); } catch (e) { return false; }
    accountSet('owner', this.user);
    accountSet('updated', data.updated);
    accountSet('snap', null);
    accountSet('dirty', null);
    if (accountInGame()) applyProgress(data.save);
    return true;
  },

  // After signing in (or on boot with a saved token). This account's local
  // save is put together with a newer one on the server. A guest's progress
  // on this device (or someone else's that never reached the server) joins
  // the account instead of being replaced: every star counts on top, a copy
  // of the old save stays on the device, and a toast tells the parent.
  async _sync() {
    const r = await accountFetch('GET', '/save', null, { timeout: 5000 });
    if (r.status === 401) { this._expired(); return 'expired'; }
    if (r.status !== 200 || !r.data) return 'offline';
    const owner = accountGet('owner') || '';
    // No owner and no login just now: a save from before owners were noted.
    const mine = owner === this.user || (!owner && !accountGet('join'));
    if (mine) {
      if (r.data.save && r.data.updated > this.base) this._merge(r.data, this._dirty ? 'mine' : 'theirs');
      else accountSet('owner', this.user);
    } else {
      if (accountInGame()) save();
      const json = accountLocalSave();
      const local = accountParse(json);
      const carry = !!local && Progress.played(local) && (!owner || this._dirty);
      if (json) accountBackup(json);
      if (r.data.save) {
        if (!(carry ? this._merge(r.data, 'foreign') : this._take(r.data))) return 'offline';
      } else {
        accountSet('owner', this.user);
        accountSet('updated', 0);
        ['snap', 'dirty'].forEach(k => accountSet(k, null));
        if (carry) accountSet('dirty', '1');
        else if (owner) {
          // Someone else's progress, already on the server: a new account starts fresh.
          try { localStorage.removeItem(ACCOUNT_SAVE_KEY); } catch (e) { /* private mode */ }
          if (accountInGame()) applyProgress(null);
        }
      }
      if (carry) {
        const n = Progress.stars(local);
        accountToast(n ? `이 기기의 별 ${n}개를 계정에 합쳤어요` : '이 기기의 기록을 계정에 합쳤어요');
      }
    }
    accountSet('join', null);
    if (this._dirty || (accountLocalSave() && !r.data.save)) {
      accountSet('dirty', '1');
      await this._upload();
    }
    return 'synced';
  },

  _expired() {
    accountSet('token', null);
    accountSet('user', null);
    this.user = null;
    accountRenderBar();
  },

  _done() {
    // The login screen picked the other edition: start over as that game
    // (dropping a ?edition= test override, which would win otherwise).
    if (accountEditionPicked && accountEditionPicked !== EDITION) {
      location.replace(location.pathname + location.search.replace(/([?&])edition=\w+&?/, '$1').replace(/[?&]$/, '') + location.hash);
      return;
    }
    accountUi.screen.classList.add('hidden');
    this._started = true;
    accountRenderBar();
    if (this._resolve) { this._resolve(this.user); this._resolve = null; }
  },

  // The progress is on the server, so the device forgets it and starts over
  // at the login screen. If the upload failed it stays, still marked as hers.
  async logout() {
    if (this._dirty) await this._upload();
    await accountFetch('POST', '/auth/logout', null, { timeout: 3000 });
    if (!this._dirty) {
      try { localStorage.removeItem(ACCOUNT_SAVE_KEY); } catch (e) { /* private mode */ }
      ['snap', 'updated', 'owner'].forEach(k => accountSet(k, null));
    }
    ['token', 'user', 'guest', 'join', 'pwcheck'].forEach(k => accountSet(k, null));
    location.reload();
  },
};
Account.ready = new Promise(r => { Account._resolve = r; });

// ---- Login screen --------------------------------------------------------

// Princess or captain: which game starts after the login screen. Only a tap
// on the login screen changes it; the game being played is shown at first.
let accountEditionPicked = null;
function accountPickEdition(edition, tapped) {
  if (tapped) {
    accountEditionPicked = edition;
    try { localStorage.setItem('pixeltown-edition', edition); } catch (e) { /* private mode */ }
  }
  document.querySelectorAll('#login .edition').forEach(b => b.classList.toggle('on', b.dataset.edition === edition));
  document.getElementById('login-icon').textContent = edition === 'captain' ? '🤖' : '🏰';
  document.getElementById('login-game').textContent = edition === 'captain' ? '로봇 마을' : '소리 마을';
}
document.querySelectorAll('#login .edition').forEach(b => b.addEventListener('click', () => {
  if (typeof Sound !== 'undefined') Sound.tap();
  accountPickEdition(b.dataset.edition, true);
}));
accountPickEdition(EDITION);

let accountTab = 'login';
const ACCOUNT_ID_RE = /^[a-z0-9_]{3,20}$/;
const ACCOUNT_ERRORS = {
  badId: '아이디는 영어 소문자, 숫자, _ 로 3~20자예요',
  badPw: '비밀번호는 6자 이상이에요', // new accounts; older ones may have 4
  taken: '이미 있는 아이디예요. 다른 아이디를 써 주세요',
  wrong: '아이디나 비밀번호가 틀렸어요',
  many: '너무 많이 틀렸어요. 10분 뒤에 다시 해 보세요',
  offline: '서버에 연결할 수 없어요. 인터넷을 확인해 주세요',
  other: '잠깐 문제가 생겼어요. 다시 해 보세요',
};

function accountSay(text, good) {
  accountUi.msg.textContent = text;
  accountUi.msg.classList.toggle('good', !!good);
}

function accountSetTab(tab) {
  accountTab = tab;
  accountUi.tabs.forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  accountUi.go.textContent = tab === 'login' ? '로그인 🔑' : '가입하기 ✨';
  accountUi.pw.autocomplete = tab === 'login' ? 'current-password' : 'new-password';
  accountSay(tab === 'signup' ? '아이디와 비밀번호만 정하면 돼요' : '');
}

function accountShowLogin() {
  accountUi.pw.value = '';
  accountSetTab(accountTab);
  accountUi.screen.classList.remove('hidden');
}

async function accountSubmit() {
  if (accountUi.go.disabled) return;
  if (typeof Sound !== 'undefined') { Sound.unlock(); Sound.tap(); }
  const id = accountUi.id.value.trim().toLowerCase();
  const pw = accountUi.pw.value;
  if (!ACCOUNT_ID_RE.test(id)) return accountSay(ACCOUNT_ERRORS.badId);
  if (pw.length < (accountTab === 'signup' ? 6 : 4)) return accountSay(accountTab === 'signup' ? ACCOUNT_ERRORS.badPw : ACCOUNT_ERRORS.wrong);
  accountUi.go.disabled = true;
  accountSay('잠깐만요…', true);
  const r = await accountFetch('POST', accountTab === 'login' ? '/auth/login' : '/auth/signup', { id, pw });
  if (r.status === 200 && r.data && r.data.token) {
    accountSet('token', r.data.token);
    accountSet('user', r.data.id);
    accountSet('guest', null);
    accountSet('join', '1'); // until the first sync, even if it waits for the next visit
    Account.user = r.data.id;
    await accountRemember(r.data.id, pw);
    accountSay('불러오는 중…', true);
    await Account._sync();
    accountUi.go.disabled = false;
    Account._done();
    return;
  }
  accountUi.go.disabled = false;
  if (r.status === 0) accountSay(ACCOUNT_ERRORS.offline);
  else if (r.status === 409) accountSay(ACCOUNT_ERRORS.taken);
  else if (r.status === 401) accountSay(ACCOUNT_ERRORS.wrong);
  else if (r.status === 429) accountSay(ACCOUNT_ERRORS.many);
  else if (r.status === 400) accountSay(accountTab === 'signup' && ACCOUNT_ID_RE.test(id) ? ACCOUNT_ERRORS.badPw : ACCOUNT_ERRORS.badId);
  else accountSay(ACCOUNT_ERRORS.other);
}

// The little account button at the top of the start screen.
function accountRenderBar() {
  const bar = accountUi.bar;
  bar.innerHTML = '';
  const b = document.createElement('button');
  b.className = 'chip';
  if (Account.user) {
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = `👤 ${Account.user}`;
    bar.append(who);
    b.textContent = '로그아웃';
    b.addEventListener('click', () => { if (typeof Sound !== 'undefined') Sound.tap(); Account.logout(); });
  } else {
    b.textContent = '🔑 로그인';
    b.addEventListener('click', () => {
      if (typeof Sound !== 'undefined') Sound.tap();
      accountSet('guest', null);
      Account._started = false;
      Account.ready = new Promise(r => { Account._resolve = r; });
      accountShowLogin();
    });
  }
  bar.append(b);
}

accountUi.tabs.forEach(b => b.addEventListener('click', () => {
  if (typeof Sound !== 'undefined') Sound.tap();
  accountSetTab(b.dataset.tab);
}));
accountUi.go.addEventListener('click', accountSubmit);
accountUi.pw.addEventListener('keydown', e => { if (e.key === 'Enter') accountSubmit(); });
accountUi.id.addEventListener('keydown', e => { if (e.key === 'Enter') accountUi.pw.focus(); });
accountUi.pw.addEventListener('input', () => accountSay(''));
accountUi.id.addEventListener('input', () => {
  accountSay('');
  const v = accountUi.id.value.toLowerCase().replace(/\s/g, '');
  if (v !== accountUi.id.value) accountUi.id.value = v;
});
accountUi.guest.addEventListener('click', () => {
  if (typeof Sound !== 'undefined') Sound.tap();
  accountSet('guest', '1');
  Account._done();
});

// Send what is left when the page goes away; try again when back online.
addEventListener('pagehide', () => { if (Account._dirty) Account._upload(true); });
addEventListener('online', () => { if (Account._dirty) Account._upload(); });

// ---- Boot ----------------------------------------------------------------

(function accountBoot() {
  const skip = window.ACCOUNT_SKIP || /[?&]guest\b/.test(location.search);
  if (accountGet('token') && accountGet('user') && !skip) {
    // Signed in before: no login screen, just bring the newest save over.
    Account.user = accountGet('user');
    accountUi.screen.classList.add('hidden');
    accountRenderBar();
    Account._sync().then(how => {
      if (how === 'expired') accountShowLogin();
      else Account._done();
    });
  } else if (accountGet('guest') || skip) {
    Account._done();
  } else {
    accountShowLogin();
  }
})();
