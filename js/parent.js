// Parent panel: the ⚙️ button at the top right asks for the parent password
// (the account's login password, or 0000 without an account) and then shows
// how she is doing in each kind of question, from state.history.

const PARENT_KINDS = [
  ['word', '단어 듣기', '마을'],
  ['start', '첫소리', '마을'],
  ['findStart', '첫소리 그림 찾기', '글자 집'],
  ['rhyme', '라임', '마을 · 숲'],
  ['family', '단어 가족', '숲'],
  ['vowel', '가운데 소리', '숲'],
  ['ending', '끝소리', '숲'],
  ['read', '읽기', '숲'],
  ['sentence', '문장 듣기', '유니콘 · 동굴'],
  ['meaning', '뜻 맞추기', '유니콘 · 동굴'],
  ['spell', '스펠링', '요정 마을'],
];
const PARENT_PASSWORD = '0000'; // only when js/account.js is missing

const parentUi = {
  gear: document.getElementById('parent'),
  panel: null,
  wasBusy: false,
};

function parentHasAccount() {
  return typeof Account !== 'undefined' && !!Account.user;
}

function parentOpen() {
  Sound.tap();
  parentUi.wasBusy = state.busy;
  state.busy = true;
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
  // Something else that was open keeps the game paused itself.
  if (!parentUi.wasBusy) state.busy = false;
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
    let ok = false;
    try {
      ok = typeof Account !== 'undefined' ? await Account.verify(input.value) : input.value === PARENT_PASSWORD;
    } catch (x) {
      err.textContent = '서버에 연결하지 못했어요. 잠시 후 다시 해 보세요.';
      return;
    }
    if (!parentUi.panel) return;
    if (ok) parentStats();
    else { err.textContent = '비밀번호가 맞지 않아요.'; input.select(); }
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
    tries += h.tries;
    firstRight += h.right;
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

const parentEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
  const answers = entries.reduce((a, [, h]) => a + h.tries, 0);
  const solvedCount = entries.filter(([, h]) => h.right > 0).length;
  const tile = (icon, label, n) => `<div class="parent-tile"><span class="ic">${icon}</span><b>${n}</b><span>${label}</span></div>`;
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
    .map(([id, h]) => `<li><span class="m-kind">${kindName(h.kind)}</span><span class="m-what">${parentEsc(parentLabel(id))}</span><span class="m-n">${h.wrong}번 틀림${h.right ? ' · 지금은 맞힘' : ''}</span></li>`)
    .join('');
  parentUi.panel.querySelector('.parent-body').innerHTML = `
    <div class="parent-tiles">
      ${tile('⭐', '별', state.stars)}${tile('🪙', '코인', state.coins | 0)}${tile('✨', '요정의 가루', state.dust | 0)}
      ${tile('📝', '답한 횟수', answers)}${tile('✅', '맞힌 문제', solvedCount)}
    </div>
    <h3>문제 유형별 진행도</h3>
    <div class="parent-legend"><span class="sw right"></span>맞힘<span class="sw wrong"></span>틀림 (아직 못 맞힘)<span class="sw untried"></span>안 해봄<span class="note">정답률 = 한 번에 맞힌 비율</span></div>
    <div class="parent-kinds">${rows}</div>
    <div class="parent-two">
      <div><h3>자주 틀린 문제</h3>${missed ? `<ol class="parent-missed">${missed}</ol>` : '<p class="parent-empty">아직 틀린 문제가 없어요.</p>'}</div>
      <div><h3>최근 7일 활동</h3>${parentSpark()}<p class="parent-empty">그날 마지막으로 푼 문제 수예요.</p></div>
    </div>`;
}

parentUi.gear.addEventListener('click', parentOpen);
// While the panel is open, game keys (1–4, spelling letters) do nothing.
addEventListener('keydown', e => {
  if (!parentUi.panel || parentUi.panel.contains(e.target)) return;
  e.stopImmediatePropagation();
  if (e.key === 'Escape') parentClose();
}, true);
