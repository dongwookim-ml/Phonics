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
  ['read', '읽기', `${placeName('forest')} · ${placeName('fairy')}`],
  ['blend', '소리 합치기', `${placeName('forest')} · ${placeName('fairy')}`],
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
  el.addEventListener('click', parentClick);
  el.addEventListener('change', parentChange);
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
  state.busy = [ui.dialog, ui.reward, ui.wardrobe, ui.shop, document.getElementById('library'), document.getElementById('reader')].some(shown) ||
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
    const x = SENTENCES.concat(SENTENCES_L1, SENTENCES_L2).find(s => s.s === key);
    return `${key.replace('{}', '___')}${x ? ` (${x.w[0]})` : ''}`;
  }
  const hit = Quiz.words()[key];
  return hit ? `${hit.e} ${key}` : key;
}

// Her tier in a kind (js/quiz.js): "단계 2 / 4" with − and + to set it, the
// best she has reached, and how many of her last first tries were right.
function parentTier(kind) {
  const k = Quiz.skill(kind);
  const max = Quiz.tierMax(kind);
  const t = Math.min(k.t, max);
  const last = k.last || [];
  const recent = last.length ? ` · 최근 ${last.filter(Boolean).length}/${last.length}` : '';
  return `<div class="k-tier">
    <button type="button" class="tier-btn" data-kind="${kind}" data-step="-1" ${t <= 1 ? 'disabled' : ''} title="쉽게">−</button>
    <span class="tier-n">단계 <b>${t}</b> / ${max}</span>
    <button type="button" class="tier-btn" data-kind="${kind}" data-step="1" ${t >= max ? 'disabled' : ''} title="어렵게">+</button>
    <span class="tier-more">최고 ${Math.min(k.best || 1, max)}${recent}</span>
  </div>`;
}

// First-try accuracy per first letter, from the letter questions (word,
// start, findStart), as small chips: "C 4/5".
function parentLetters() {
  const per = {};
  for (const [id, h] of Object.entries(state.history || {})) {
    if (!['word', 'start', 'findStart'].includes(h.kind)) continue;
    const L = id.slice(id.indexOf(':') + 1)[0].toUpperCase();
    const p = per[L] || (per[L] = { tries: 0, right: 0 });
    p.tries += h.tries;
    p.right += h.right;
  }
  const chips = Object.keys(per).sort().map(L => {
    const p = per[L];
    const r = p.right / p.tries;
    return `<span class="l-chip ${r >= 0.8 ? 'good' : r >= 0.5 ? 'mid' : 'low'}" title="${p.right}/${p.tries}">${L} <b>${Math.round(100 * r)}%</b></span>`;
  }).join('');
  return chips || '<p class="parent-empty">아직 글자 문제를 푼 적이 없어요.</p>';
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
      ${parentTier(kind)}
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
    <p class="parent-note">단계: 쉬운 문제부터 시작해서, 잘 맞히면 올라가고 연달아 틀리면 내려가요. − / + 로 직접 바꿀 수 있어요.</p>
    <div class="parent-legend"><span class="sw right"></span>맞힘<span class="sw wrong"></span>틀림 (아직 못 맞힘)<span class="sw untried"></span>안 해봄<span class="note">정답률 = 한 번에 맞힌 비율</span></div>
    <div class="parent-kinds">${rows}</div>
    <div class="parent-two">
      <div><h3>자주 틀린 문제</h3>${missed ? `<ol class="parent-missed">${missed}</ol>` : '<p class="parent-empty">아직 틀린 문제가 없어요.</p>'}</div>
      <div><h3>최근 7일 활동</h3>${parentSpark()}<p class="parent-empty">그날 마지막으로 푼 문제 수예요.</p></div>
    </div>
    <h3>글자별 정답률 (한 번에 맞힌 비율)</h3>
    <div class="parent-letters">${parentLetters()}</div>
    <h3>설정</h3>
    <label class="parent-setting"><input type="checkbox" class="set-two" ${state.settings && state.settings.twoSyllables ? 'checked' : ''}>
      스펠링 마지막 단계에 두 음절 단어(rab·bit, rock·et)도 내기</label>`;
}

// − / + on a tier, and the settings.
function parentClick(e) {
  const b = e.target.closest('.tier-btn');
  if (b) {
    Quiz.setTier(b.dataset.kind, Quiz.skill(b.dataset.kind).t + Number(b.dataset.step));
    save();
    parentStats();
  }
}
function parentChange(e) {
  if (!e.target.classList.contains('set-two')) return;
  state.settings = Object.assign({}, state.settings, { twoSyllables: e.target.checked });
  Quiz.setTier('spell', Quiz.skill('spell').t);
  save();
  parentStats();
}

parentUi.gear.addEventListener('click', parentOpen);
// While the panel is open, game keys (1–4, spelling letters) do nothing.
addEventListener('keydown', e => {
  if (!parentUi.panel || parentUi.panel.contains(e.target)) return;
  e.stopImmediatePropagation();
  if (e.key === 'Escape') parentClose();
}, true);
