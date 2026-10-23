// Player accounts: the login / sign-up screen before the start screen, and
// keeping the save on the server (server/app.py) so progress follows her to
// another device. Without an account the game keeps today's browser-only save.
//
// Account.user    the signed-in id, or null
// Account.ready   resolves once the login screen is done
// Account.verify  checks the account password (the parent panel)
// Account.push    uploads the save, 2 s after the last change
// Account.pull    the server's save, or null

// Tests point this at a local server with window.ACCOUNT_SERVER, and skip
// the login screen with ?guest or window.ACCOUNT_SKIP.
const ACCOUNT_SERVER = (window.ACCOUNT_SERVER || TTS_SERVER || '').replace(/\/$/, '');
const ACCOUNT_SAVE_KEY = 'pixeltown-v2'; // the game's own save (SAVE_KEY in game.js)
const ACCOUNT_KEYS = { token: 'pixeltown-token', user: 'pixeltown-user', guest: 'pixeltown-guest', updated: 'pixeltown-updated', snap: 'pixeltown-synced', dirty: 'pixeltown-dirty', owner: 'pixeltown-owner' };
// updated: the server version the local save builds on (the server's clock).
// dirty:   the local save has changes the server has not seen.
// owner:   whose progress the local save is; empty for a guest or an old save.
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

const Account = {
  user: null,
  ready: null,
  _resolve: null,
  _started: false, // the login screen is done; saves from now on are real progress
  _timer: 0,
  get _dirty() { return !!accountGet('dirty'); },

  async verify(pw) {
    if (!this.user) return pw === ACCOUNT_GUEST_PW;
    const r = await accountFetch('POST', '/auth/verify', { pw });
    return r.status === 200 && !!(r.data && r.data.ok);
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

  // Sends the local save up now. Fails quietly; the next save tries again.
  async _upload(keepalive) {
    clearTimeout(this._timer);
    const json = accountLocalSave();
    if (!this.user || !json || !this._dirty) return;
    const body = { save: JSON.parse(json), base: Number(accountGet('updated')) || 0 };
    // Browsers cap keepalive bodies at 64 KB.
    const r = await accountFetch('PUT', '/save', body, { keepalive: keepalive && json.length < 60000 });
    if (r.status === 200 && r.data) {
      accountSet('updated', r.data.updated);
      if (accountLocalSave() === json) accountSet('dirty', null); // nothing changed meanwhile
    } else if (r.status === 409 && !keepalive) {
      // Another device saved first: its save wins and this one reloads with it.
      const s = await accountFetch('GET', '/save');
      if (s.status === 200 && s.data && s.data.save) this._adopt(s.data);
    } else if (r.status === 401) this._expired();
  },

  // Makes the server's save the local one, and reloads the page with it.
  _adopt(data) {
    const json = JSON.stringify(data.save);
    try { localStorage.setItem(ACCOUNT_SAVE_KEY, json); } catch (e) { return false; }
    accountSet('snap', json);
    accountSet('updated', data.updated);
    accountSet('dirty', null);
    accountSet('owner', this.user);
    location.reload();
    return true;
  },

  // After signing in (or on boot with a saved token). The local save is kept
  // only when it is this account's and the server has nothing newer; a guest's
  // or an old save is carried into an account that has no save yet.
  async _sync() {
    const r = await accountFetch('GET', '/save', null, { timeout: 5000 });
    if (r.status === 401) { this._expired(); return 'expired'; }
    if (r.status !== 200 || !r.data) return 'offline';
    const owner = accountGet('owner') || '';
    const mine = owner === this.user;
    const base = mine ? Number(accountGet('updated')) || 0 : 0;
    if (r.data.save && (!mine || r.data.updated > base)) {
      return this._adopt(r.data) ? 'reload' : 'offline';
    }
    if (!r.data.save && owner && !mine) {
      // Someone else's progress is on this device: a new account starts fresh.
      try { localStorage.removeItem(ACCOUNT_SAVE_KEY); } catch (e) { return 'offline'; }
      ['snap', 'updated', 'dirty'].forEach(k => accountSet(k, null));
      accountSet('owner', this.user);
      location.reload();
      return 'reload';
    }
    accountSet('owner', this.user);
    if (!mine) accountSet('updated', 0);
    if (accountLocalSave() && (this._dirty || !r.data.save)) {
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
    ['token', 'user', 'guest'].forEach(k => accountSet(k, null));
    location.reload();
  },
};
Account.ready = new Promise(r => { Account._resolve = r; });

// ---- Login screen --------------------------------------------------------

let accountTab = 'login';
const ACCOUNT_ID_RE = /^[a-z0-9_]{3,20}$/;
const ACCOUNT_ERRORS = {
  badId: '아이디는 영어 소문자, 숫자, _ 로 3~20자예요',
  badPw: '비밀번호는 4자 이상이에요',
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
  if (pw.length < 4) return accountSay(ACCOUNT_ERRORS.badPw);
  accountUi.go.disabled = true;
  accountSay('잠깐만요…', true);
  const r = await accountFetch('POST', accountTab === 'login' ? '/auth/login' : '/auth/signup', { id, pw });
  if (r.status === 200 && r.data && r.data.token) {
    accountSet('token', r.data.token);
    accountSet('user', r.data.id);
    accountSet('guest', null);
    Account.user = r.data.id;
    accountSay('불러오는 중…', true);
    const how = await Account._sync();
    accountUi.go.disabled = false;
    if (how !== 'reload') Account._done();
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
      if (how === 'reload') return;
      if (how === 'expired') accountShowLogin();
      else Account._done();
    });
  } else if (accountGet('guest') || skip) {
    Account._done();
  } else {
    accountShowLogin();
  }
})();
