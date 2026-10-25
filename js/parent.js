// Parent panel: the ⚙️ button at the top right asks for the parent password
// (the account's login password, or 0000 without an account) and then shows
// how she is doing in each kind of question, from state.history.

const PARENT_KINDS = [
  ['word', '단어 듣기', '마을'],
  ['start', '첫소리', '마을'],
  ['findStart', '첫소리 그림 찾기', '글자 집'],
  ['rhyme', '라임', `마을 · ${placeName('forest')}`],
  ['family', '단어 가족', placeName('forest')],
  ['vowel', '가운데 소리', placeName('forest')],
  ['ending', '끝소리', placeName('forest')],
  ['read', '읽기', placeName('forest')],
  ['sentence', '문장 듣기', `${placeName('unicorn')} · ${placeName('dungeon')}`],
  ['meaning', '뜻 맞추기', `${placeName('unicorn')} · ${placeName('dungeon')}`],
  ['spell', '스펠링', placeName('fairy')],
];
const PARENT_PASSWORD = '0000'; // only when js/account.js is missing

const PARENT_ERRORS = {
  wrong: '비밀번호가 맞지 않아요.',
  offline: '인터넷에 연결되지 않았어요.',
  busy: '잠시 후 다시 해 보세요.',
};

const parentUi = {
  gear: document.getElementById('parent'),
  panel: null,
};

function parentHasAccount() {
  return typeof Account !== 'undefined' && !!Account.user;
}

// The game stands still underneath: she stops after the step she is on
// (and doesn't arrive anywhere), nobody talks, and game timers wait.
function parentOpen() {
  if (parentUi.panel) return;
  Sound.tap();
  setPaused(true);
  state.busy = true;
  state.hero.path = state.hero.path.slice(0, 1);
  state.hero.onArrive = null;
  // A book being read aloud stops as with its ⏸ button.
  if (typeof library !== 'undefined' && library.playing && library.mode === 'read') {
    library.playing = false;
    bookHush();
    renderBookHighlight();
  }
  Sound.say([]);
  const el = document.createElement('section');
  el.className = 'parent-panel';
  el.innerHTML = `
    <div class="parent-box">
      <div class="parent-head">
        <div class="parent-title">⚙️ 부모 패널</div>
        <button class="parent-close" type="button">닫기</button>
      </div>
      <div class="parent-body"></div>
    </div>`;
  el.querySelector('.parent-close').addEventListener('click', parentClose);
  // Keys typed here never reach the game (1–4 would answer a question).
  el.addEventListener('keydown', e => { if (e.key === 'Escape') parentClose(); e.stopPropagation(); });
  document.body.append(el);
  parentUi.panel = el;
  parentLock();
}

function parentClose() {
  if (!parentUi.panel) return;
  parentUi.panel.remove();
  parentUi.panel = null;
  setPaused(false);
  // Busy again only if something is still showing (a question, a present,
  // the wardrobe, the shop, the library or a scene change).
  const shown = el => !!el && !el.classList.contains('hidden');
  state.busy = [ui.dialog, ui.reward, ui.wardrobe, ui.shop, document.getElementById('library'), document.getElementById('reader'),
    document.getElementById('feed'), document.getElementById('mini'), document.getElementById('sleep')].some(shown) ||
    ui.fade.classList.contains('on');
}

function parentLock() {
  const body = parentUi.panel.querySelector('.parent-body');
  const hint = parentHasAccount()
    ? `로그인할 때 쓴 비밀번호(<b>${parentEsc(Account.user)}</b> 계정)를 입력하세요.`
    : '계정 없이 하고 있어요. 비밀번호는 <b>0000</b>이에요. 로그인하면 로그인 비밀번호를 쓰세요.';
  body.innerHTML = `
    <form class="parent-lock">
      <p>아이의 학습 기록을 보려면 비밀번호가 필요해요.<br>${hint}</p>
      <input type="password" class="parent-pw" autocomplete="current-password" placeholder="비밀번호">
      <button type="submit" class="parent-go">확인</button>
      <p class="parent-err"></p>
    </form>`;
  const form = body.querySelector('form');
  const input = body.querySelector('.parent-pw');
  const err = body.querySelector('.parent-err');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    err.textContent = '확인하는 중…';
    // { ok, reason }: a wrong password, no connection, or the server busy.
    let r = { ok: false, reason: 'busy' };
    try {
      r = typeof Account !== 'undefined' ? await Account.verify(input.value) : { ok: input.value === PARENT_PASSWORD, reason: 'wrong' };
    } catch (x) { /* r stays 'busy' */ }
    if (!parentUi.panel) return;
    if (r.ok) parentStats();
    else { err.textContent = PARENT_ERRORS[r.reason] || PARENT_ERRORS.wrong; input.select(); }
  });
  setTimeout(() => input.focus(), 50);
}

// Per kind: questions got right, missed (and not yet put right) and not
// yet tried, out of everything that kind can ask.
function parentKindStats(kind) {
  const hist = state.history || {};
  const pool = reviewPool(kind);
  let right = 0, wrong = 0, tries = 0, firstRight = 0;
  for (const id of pool) {
    const h = hist[id];
    if (!h) continue;
    tries += h.tries | 0;
    firstRight += h.right | 0;
    if (h.right > 0) right++;
    else wrong++;
  }
  return { pool: pool.length, right, wrong, untried: pool.length - right - wrong, tries, firstRight };
}

// "rhyme:cat" → "🐱 cat", "sentence:The {} says moo." → "The ___ says moo. (cow)".
function parentLabel(id) {
  const kind = id.slice(0, id.indexOf(':'));
  const key = id.slice(kind.length + 1);
  if (kind === 'sentence' || kind === 'meaning') {
    const x = SENTENCES.find(s => s.s === key);
    return `${key.replace('{}', '___')}${x ? ` (${x.w[0]})` : ''}`;
  }
  const all = LETTERS.flatMap(l => l.words).concat(...WORD_FAMILIES, ...RHYMES);
  const hit = all.find(([w]) => w === key);
  return hit ? `${hit[1]} ${key}` : key;
}

// Everything the panel puts in as HTML is a number or goes through parentEsc.
const parentEsc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function parentBar(s) {
  const seg = (n, cls, label) => (n ? `<span class="seg ${cls}" style="flex:${n}" title="${label} ${n}"></span>` : '');
  return `<div class="parent-bar" role="img" aria-label="맞힘 ${s.right}, 틀림 ${s.wrong}, 안 해봄 ${s.untried}">
    ${seg(s.right, 'right', '맞힘')}${seg(s.wrong, 'wrong', '틀림')}${seg(s.untried, 'untried', '안 해봄')}</div>`;
}

// Questions last answered on each of the past 7 days, as a sparkline.
function parentSpark() {
  const day = 864e5;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime() - 6 * day;
  const counts = new Array(7).fill(0);
  for (const h of Object.values(state.history || {})) {
    const i = Math.floor((h.last - start) / day);
    if (i >= 0 && i < 7) counts[i]++;
  }
  const names = ['일', '월', '화', '수', '목', '금', '토'];
  const W = 300, H = 90, top = 18, base = 66;
  const max = Math.max(1, ...counts);
  const x = i => 16 + i * ((W - 32) / 6);
  const y = n => base - (n / max) * (base - top);
  const pts = counts.map((n, i) => `${x(i)},${y(n)}`).join(' ');
  const peak = counts.indexOf(Math.max(...counts));
  const dots = counts.map((n, i) => {
    const d = new Date(start + i * day);
    const label = i === 6 || (i === peak && n) ? `<text x="${x(i)}" y="${y(n) - 8}" class="v">${n}</text>` : '';
    return `<g><title>${d.getMonth() + 1}/${d.getDate()} · ${n}문제</title>
      <circle cx="${x(i)}" cy="${y(n)}" r="10" class="hit"/><circle cx="${x(i)}" cy="${y(n)}" r="4" class="dot"/>${label}
      <text x="${x(i)}" y="${H - 6}" class="d">${i === 6 ? '오늘' : names[d.getDay()]}</text></g>`;
  }).join('');
  return `<svg class="parent-spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="최근 7일: ${counts.join(', ')}">
    <line x1="8" x2="${W - 8}" y1="${base}" y2="${base}" class="axis"/>
    <polyline points="${pts}" class="line"/>${dots}</svg>`;
}

function parentStats() {
  const hist = state.history || {};
  const entries = Object.entries(hist);
  const answers = entries.reduce((a, [, h]) => a + (h.tries | 0), 0);
  const solvedCount = entries.filter(([, h]) => h.right > 0).length;
  const tile = (icon, label, n) => `<div class="parent-tile"><span class="ic">${icon}</span><b>${n | 0}</b><span>${parentEsc(label)}</span></div>`;
  const rows = PARENT_KINDS.map(([kind, ko, where]) => {
    const s = parentKindStats(kind);
    const acc = s.tries ? `${Math.round((100 * s.firstRight) / s.tries)}%` : '—';
    const review = s.pool && !s.untried && !s.wrong ? '<span class="review-tag">복습 중</span>' : '';
    return `<div class="parent-kind">
      <div class="k-name">${ko}${review}<small>${where}</small></div>
      <div class="k-acc" title="한 번에 맞힌 답 / 전체 답">${acc}</div>
      ${parentBar(s)}
      <div class="k-nums">맞힘 ${s.right} · 틀림 ${s.wrong} · 안 해봄 ${s.untried} <span>/ 전체 ${s.pool}</span></div>
    </div>`;
  }).join('');
  const kindName = k => (PARENT_KINDS.find(x => x[0] === k) || [k, k])[1];
  const missed = entries.filter(([, h]) => h.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong || b[1].last - a[1].last).slice(0, 6)
    .map(([id, h]) => `<li><span class="m-kind">${parentEsc(kindName(h.kind))}</span><span class="m-what">${parentEsc(parentLabel(id))}</span><span class="m-n">${h.wrong | 0}번 틀림${h.right ? ' · 지금은 맞힘' : ''}</span></li>`)
    .join('');
  parentUi.panel.querySelector('.parent-body').innerHTML = `
    <div class="parent-tiles">
      ${tile('⭐', '별', state.stars)}${tile('🪙', '코인', state.coins | 0)}${isCaptain() ? tile('⚡', '배터리', state.dust | 0) : tile('✨', '요정의 가루', state.dust | 0)}
      ${tile('📝', '답한 횟수', answers)}${tile('✅', '맞힌 문제', solvedCount)}
    </div>
    <h3>문제 유형별 진행도</h3>
    <div class="parent-legend"><span class="sw right"></span>맞힘<span class="sw wrong"></span>틀림 (아직 못 맞힘)<span class="sw untried"></span>안 해봄<span class="note">정답률 = 한 번에 맞힌 비율</span></div>
    <div class="parent-kinds">${rows}</div>
    <div class="parent-two">
      <div><h3>자주 틀린 문제</h3>${missed ? `<ol class="parent-missed">${missed}</ol>` : '<p class="parent-empty">아직 틀린 문제가 없어요.</p>'}</div>
      <div><h3>최근 7일 활동</h3>${parentSpark()}<p class="parent-empty">그날 마지막으로 푼 문제 수예요.</p></div>
    </div>`;
  parentSettings(parentUi.panel.querySelector('.parent-body'));
}

// ---- Settings: play time, picture hints, the 🔊 button --------------------
// Saved with the game (state.settings, state.pictures). The play-time limit
// and the hidden 🔊 button are handled in js/guide.js.

function parentSettings(body) {
  const box = document.createElement('section');
  box.className = 'parent-settings';
  body.append(box);
  const render = () => {
    const s = state.settings;
    const played = Math.floor(guidePlayedMs() / 60000);
    const chips = (name, options, value) => options.map(([v, label]) =>
      `<button type="button" class="chip${v === value ? ' on' : ''}" data-set="${name}" data-v="${v}">${label}</button>`).join('');
    box.innerHTML = `<h3>설정</h3>
      <div class="ps-row">
        <div class="ps-name">놀이 시간<small>시간이 되면 대화가 끝난 뒤 마을이 잠들고, 비밀번호로만 다시 놀 수 있어요. 오늘 ${played}분 놀았어요.</small></div>
        <div class="ps-chips">${chips('limit', [[0, '끄기'], [15, '15분'], [20, '20분'], [30, '30분']], s.playLimit | 0)}</div>
      </div>
      <div class="ps-row">
        <div class="ps-name">그림 힌트<small>단어 카드에 그림을 함께 보여줘요. 끄면 첫 글자를 읽어야 해요.</small></div>
        <div class="ps-chips">${chips('pictures', [[1, '켜기'], [0, '끄기']], state.pictures ? 1 : 0)}</div>
      </div>
      <div class="ps-row">
        <div class="ps-name">🔊 소리 버튼<small>아이 화면 위쪽의 소리 끄기 버튼이에요.</small></div>
        <div class="ps-chips">${chips('mute', [[0, '보이기'], [1, '숨기기']], s.hideMute ? 1 : 0)}</div>
      </div>`;
    box.querySelectorAll('[data-set]').forEach(b => b.addEventListener('click', () => {
      const v = Number(b.dataset.v);
      if (b.dataset.set === 'limit') s.playLimit = v;
      if (b.dataset.set === 'mute') s.hideMute = !!v;
      if (b.dataset.set === 'pictures') setPictures(!!v); // saves
      else save();
      guideApplySettings();
      render();
    }));
  };
  render();
}

parentUi.gear.addEventListener('click', parentOpen);
// While the panel is open, game keys (1–4, spelling letters) do nothing.
addEventListener('keydown', e => {
  if (!parentUi.panel || parentUi.panel.contains(e.target)) return;
  e.stopImmediatePropagation();
  if (e.key === 'Escape') parentClose();
}, true);
