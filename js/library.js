// The royal library on the castle's second floor: the shelf of story books
// (BOOKS in js/books.js), a reader that reads each story aloud sentence by
// sentence, and three questions at the end that pay a coin each, once.

const library = {
  book: null,
  page: 0,
  sent: 0,           // the sentence being read on this page
  playing: false,
  mode: 'read',      // 'read', 'quiz' or 'summary'
  token: 0,          // bumps whenever reading stops, so stale callbacks give up
  watchdog: null,
  quiz: null,        // { i, tries, right, coins, order, locked }
  hintUntil: 0,      // the bookcase hints stay big until then
};

const libraryEl = id => document.getElementById(id);
const libraryMuted = () => libraryEl('mute').textContent === '🔇';

// The saved reading log for one book. `got` lists the questions she has
// answered right at least once, which are the ones that already paid.
function bookLog(id) {
  if (!state.books) state.books = {};
  const b = state.books[id] = Object.assign({ read: 0, quizRight: 0, got: [] }, state.books[id]);
  if (!Array.isArray(b.got)) b.got = [];
  return b;
}

function libraryLibrarian() {
  return sceneFor('castle2').npcs.find(n => n.look === 'librarian') || null;
}

// Says parts, then calls done once they finish. Without sound (muted, or a
// voice that never reports the end) a timer moves the story along instead.
function bookSay(parts, done, who) {
  const token = ++library.token;
  clearTimeout(library.watchdog);
  const finish = () => {
    if (token !== library.token) return;
    clearTimeout(library.watchdog);
    if (done) whenPlaying(done); // not under the parent panel (js/game.js)
  };
  const letters = parts.reduce((n, p) => n + (p.text ? p.text.length : 0), 0);
  const pauses = parts.reduce((n, p) => n + (p.pause || 0), 0);
  if (libraryMuted()) {
    library.watchdog = setTimeout(finish, 900 + letters * 60 + pauses);
    return;
  }
  library.watchdog = setTimeout(finish, 7000 + letters * 110 + pauses);
  Sound.say(parts.concat({ call: finish }), who);
}

function bookHush() {
  library.token++;
  clearTimeout(library.watchdog);
  Sound.say([]);
}

const bookLine = (kind, vars) => line(`book-${kind}`, vars, BOOK_LINES[kind]);

// ---- Book list -----------------------------------------------------------

function openLibrary() {
  state.busy = true;
  renderLibrary();
  libraryEl('library').classList.remove('hidden');
  libraryEl('reader').classList.add('hidden');
  const npc = libraryLibrarian();
  bookSay([{ text: bookLine('welcome') }], null, voiceOf(npc));
}

function renderLibrary() {
  // The captain edition's library has its own name ("본부 도서관").
  libraryEl('library').querySelector('.wd-name').textContent = place('library');
  const read = BOOKS.filter(b => state.books && state.books[b.id] && state.books[b.id].read > 0).length;
  libraryEl('lib-count').textContent = `읽은 책 ${read} / ${BOOKS.length}`;
  const list = libraryEl('lib-books');
  list.innerHTML = '';
  for (const book of BOOKS) {
    const log = (state.books && state.books[book.id]) || {};
    const got = (log.got || []).length;
    const b = document.createElement('button');
    b.className = 'lib-book';
    b.classList.toggle('read', log.read > 0);
    b.style.setProperty('--cover', book.color);
    b.innerHTML = `<span class="cv">${book.cover}</span>` +
      `<span class="en">${book.title}</span><span class="ko">${book.ko}</span>` +
      `<span class="coins">${'🪙'.repeat(got)}${'<i>○</i>'.repeat(book.quiz.length - got)}</span>` +
      (log.read > 0 ? '<span class="tick">✓</span>' : '');
    b.addEventListener('click', () => { Sound.tap(); openBook(book); });
    list.append(b);
  }
}

function closeLibrary() {
  bookHush();
  libraryEl('library').classList.add('hidden');
  libraryEl('reader').classList.add('hidden');
  library.book = null;
  library.playing = false;
  state.busy = false;
}

// ---- Reader --------------------------------------------------------------

function openBook(book) {
  Object.assign(library, { book, page: 0, sent: 0, playing: true, mode: 'read', quiz: null });
  libraryEl('library').classList.add('hidden');
  libraryEl('reader').classList.remove('hidden');
  libraryEl('rd-title').textContent = `${book.cover} ${book.ko}`;
  renderBookPage();
  bookSay([{ text: `${book.title}.`, narrator: true, rate: 0.85 }, { pause: 700 }], bookRead);
}

const bookPageSentences = () => bookSentences(library.book.pages[library.page].text);

function renderBookPage() {
  const { book, page } = library;
  const reading = library.mode === 'read';
  libraryEl('rd-page').classList.toggle('hidden', !reading);
  libraryEl('rd-quiz').classList.toggle('hidden', reading);
  libraryEl('rd-nav').classList.toggle('quiz', !reading);
  libraryEl('rd-nav').classList.toggle('done', library.mode === 'summary');
  libraryEl('rd-pageno').textContent = reading ? `${page + 1} / ${book.pages.length}` : '';
  if (reading) {
    libraryEl('rd-paper').style.setProperty('--cover', book.color);
    libraryEl('rd-pic').textContent = book.pages[page].pic;
    const text = libraryEl('rd-text');
    text.innerHTML = '';
    bookPageSentences().forEach((s, i) => {
      const span = document.createElement('span');
      span.className = 'sent';
      span.textContent = s;
      span.addEventListener('click', () => { library.sent = i; library.playing = true; bookRead(); });
      text.append(span, ' ');
    });
  }
  libraryEl('rd-prev').disabled = !reading || page === 0;
  libraryEl('rd-next').disabled = !reading;
  renderBookHighlight();
}

function renderBookHighlight() {
  libraryEl('rd-text').querySelectorAll('.sent').forEach((s, i) => {
    s.classList.toggle('now', library.playing && i === library.sent);
  });
  const play = libraryEl('rd-play');
  if (library.mode === 'read') {
    play.textContent = library.playing ? '⏸' : '🔊';
    play.title = library.playing ? '잠깐 멈춰요' : '읽어 주세요';
  } else {
    play.textContent = '🔊';
    play.title = '다시 듣기';
  }
}

// Reads the current sentence, then the next, turning pages on its own.
function bookRead() {
  if (!library.book || library.mode !== 'read') return;
  const sents = bookPageSentences();
  if (library.sent >= sents.length) library.sent = 0;
  library.playing = true;
  renderBookHighlight();
  bookSay([{ text: sents[library.sent], narrator: true, rate: 0.85 }, { pause: 350 }], () => {
    library.sent++;
    if (library.sent < sents.length) { bookRead(); return; }
    // End of the page: a breath, then turn it.
    bookSay([{ pause: 700 }], () => bookTurn(1));
  });
}

function bookTurn(step) {
  if (library.mode !== 'read') return;
  const to = library.page + step;
  if (to < 0) return;
  if (to >= library.book.pages.length) { bookFinish(); return; }
  library.page = to;
  library.sent = 0;
  renderBookPage();
  if (library.playing) bookRead();
}

function bookPlayButton() {
  Sound.tap();
  if (library.mode === 'quiz') { bookAsk(); return; }
  if (library.mode !== 'read') return;
  if (library.playing) {
    library.playing = false;
    bookHush();
    renderBookHighlight();
  } else bookRead();
}

// ---- Quiz ----------------------------------------------------------------

function bookFinish() {
  const log = bookLog(library.book.id);
  log.read++;
  questAdd('book'); // today's adventures (js/quest.js)
  save();
  library.mode = 'quiz';
  library.playing = false;
  library.quiz = { i: 0, right: 0, coins: 0 };
  renderBookPage();
  libraryEl('rd-q').innerHTML = `<div class="rd-end">🎉 The End! 🎉</div>`;
  libraryEl('rd-options').innerHTML = '';
  Sound.sparkle();
  bookSay([{ text: bookLine('theEnd'), narrator: true }, { pause: 400 }, { text: bookLine('quiz'), narrator: true }, { pause: 500 }],
    () => bookQuestion(0));
}

function bookQuestion(i) {
  const q = library.book.quiz[i];
  // Options come in a new order each time.
  Object.assign(library.quiz, { i, tries: 0, locked: false, order: shuffle(q.options.map((o, k) => k)) });
  libraryEl('rd-q').innerHTML = `<div class="rd-qno">${i + 1} / ${library.book.quiz.length}</div><div class="rd-qtext">${q.q}</div>`;
  const opts = libraryEl('rd-options');
  opts.innerHTML = '';
  for (const k of library.quiz.order) {
    const o = q.options[k];
    const words = bookSpoken(o);
    const pic = o.slice(0, o.indexOf(words)).trim();
    const b = document.createElement('button');
    b.className = 'choice rd-option';
    b.dataset.k = k;
    b.innerHTML = `<span class="pic">${pic}</span><span class="w">${words}</span>`;
    b.addEventListener('click', () => bookPick(k, b));
    opts.append(b);
  }
  bookAsk();
}

// Reads the question and its three answers.
function bookAsk() {
  if (!library.quiz.order) return;
  const q = library.book.quiz[library.quiz.i];
  const parts = [{ text: q.q, narrator: true }];
  for (const k of library.quiz.order) parts.push({ pause: 450 }, { text: bookSpoken(q.options[k]), narrator: true, rate: 0.85 });
  bookSay(parts, null);
}

function bookPick(k, btn) {
  const z = library.quiz;
  if (!z || z.locked || btn.disabled) return;
  const book = library.book;
  const q = book.quiz[z.i];
  const opts = libraryEl('rd-options');
  if (k === q.answer) {
    z.locked = true;
    z.right++;
    btn.classList.add('right');
    opts.querySelectorAll('.rd-option').forEach(b => { b.disabled = true; });
    Sound.correct();
    // A coin, but only the first time this question is answered right.
    const log = bookLog(book.id);
    if (!log.got.includes(z.i)) {
      log.got.push(z.i);
      log.quizRight = log.got.length;
      z.coins++;
      state.coins++;
      renderCoins(true);
      const pop = document.createElement('span');
      pop.className = 'rd-coin';
      pop.textContent = '🪙 +1';
      btn.append(pop);
    }
    save();
    bookCheer();
    bookSay([{ text: bookLine('right'), narrator: true }, { pause: 700 }], bookNext);
  } else if (++z.tries < 2) {
    btn.classList.add('wrong');
    btn.disabled = true;
    Sound.wrong();
    bookSay([{ text: bookLine('tryAgain'), narrator: true }]);
  } else {
    // Two misses: show the answer kindly and move on.
    z.locked = true;
    btn.classList.add('wrong');
    opts.querySelectorAll('.rd-option').forEach(b => {
      b.disabled = true;
      if (+b.dataset.k === q.answer) b.classList.add('right', 'shown');
    });
    Sound.wrong();
    bookSay([{ text: bookLine('reveal'), narrator: true }, { pause: 300 },
      { text: bookSpoken(q.options[q.answer]), narrator: true, rate: 0.85 }, { pause: 900 }], bookNext);
  }
}

function bookNext() {
  const z = library.quiz;
  if (z.i + 1 < library.book.quiz.length) bookQuestion(z.i + 1);
  else bookSummary();
}

// Hearts and stars floating up over the reader.
function bookCheer() {
  const box = libraryEl('reader');
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('span');
    s.className = 'rd-cheer';
    s.textContent = ['⭐', '💖', '✨', '🌟'][i % 4];
    s.style.left = `${8 + Math.random() * 84}%`;
    s.style.animationDelay = `${Math.random() * 0.4}s`;
    box.append(s);
    setTimeout(() => s.remove(), 1800);
  }
}

function bookSummary() {
  const { book, quiz: z } = library;
  library.mode = 'summary';
  const n = book.quiz.length;
  const coins = z.coins ? `<div class="rd-got">🪙 +${z.coins}</div>`
    : z.right ? '<div class="rd-note">이 책의 코인은 벌써 받았어요 ✨</div>' : '';
  libraryEl('rd-q').innerHTML = `<div class="rd-summary"><div class="rd-big">${book.cover}</div>` +
    `<div class="rd-score">${n}개 중 ${z.right}개 맞혔어요!</div>` +
    `<div class="rd-stars">${'⭐'.repeat(z.right)}${'☆'.repeat(n - z.right)}</div>${coins}</div>`;
  const opts = libraryEl('rd-options');
  opts.innerHTML = '';
  const again = document.createElement('button');
  again.className = 'rd-wide yes';
  again.textContent = '📚 다른 책 읽기';
  again.addEventListener('click', () => { Sound.tap(); bookHush(); libraryEl('reader').classList.add('hidden'); openLibrary(); });
  const bye = document.createElement('button');
  bye.className = 'rd-wide no';
  bye.textContent = '나갈래요 👋';
  bye.addEventListener('click', () => { Sound.tap(); closeLibrary(); });
  opts.append(again, bye);
  renderBookPage();
  if (z.right) { Sound.party(); bookCheer(); }
  bookSay([{ text: bookLine('done'), narrator: true }]);
}

// ---- Hints ---------------------------------------------------------------

// Coming upstairs, the librarian waves her over to the bookcases.
function libraryInvite() {
  later(2600, () => {
    const npc = libraryLibrarian();
    if (state.scene !== sceneFor('castle2') || state.talking || !libraryEl('library').classList.contains('hidden')) return;
    library.hintUntil = performance.now() + 8000;
    Sound.say([{ text: bookLine('invite') }], voiceOf(npc));
  });
}

// A bobbing "read a book" bubble and twinkles over each bookcase. They are
// bigger right after the invite and until she has read her first book.
function drawBookHints(now) {
  const sc = state.scene;
  if (sc !== sceneFor('castle2')) return;
  const s = state.scale;
  const ctx = sctx;
  const loud = now < (library.hintUntil || 0) || !Object.keys(state.books).length;
  for (const o of sc.objects.filter(o => o.kind === 'bookcase')) {
    const f = o.front[0];
    const w = tileCenter(sc, 0.2, f.r + 0.5);
    const p = toScreen(w.x, w.y - 52 + Math.sin(now / 280 + f.r) * (loud ? 3 : 1.5));
    ctx.font = `800 ${(loud ? 9 : 7) * s}px "Baloo 2", "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = '📖 책 읽기';
    const bw = ctx.measureText(text).width + 8 * s;
    const bh = (loud ? 13 : 10) * s;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#4a6ab8';
    ctx.lineWidth = s;
    roundRect(ctx, p.x - bw / 2, p.y - bh / 2, bw, bh, 4 * s);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x - 2.5 * s, p.y + bh / 2 - 1);
    ctx.lineTo(p.x, p.y + bh / 2 + 3.5 * s);
    ctx.lineTo(p.x + 2.5 * s, p.y + bh / 2 - 1);
    ctx.fill();
    ctx.fillStyle = '#4a6ab8';
    ctx.fillText(text, p.x, p.y + 0.5 * s);
    // Twinkles on the shelves.
    if (!loud) continue;
    ctx.fillStyle = '#fff2a8';
    for (let i = 0; i < 3; i++) {
      const tw = Math.sin(now / 260 + i * 2.1 + f.r);
      if (tw < 0.3) continue;
      const q = toScreen(w.x - 6 + i * 6, w.y - 14 - ((i * 23 + f.r * 7) % 26));
      const z = Math.max(1, Math.round(s * (0.6 + tw)));
      ctx.globalAlpha = tw;
      ctx.fillRect(q.x - z / 2, q.y - z * 1.5, z, z * 3);
      ctx.fillRect(q.x - z * 1.5, q.y - z / 2, z * 3, z);
    }
    ctx.globalAlpha = 1;
  }
}

// ---- Wiring --------------------------------------------------------------

// The librarian's dialog gets a "read me a book" button.
function libraryDialog(npc) {
  libraryEl('dlg-books').classList.toggle('hidden', !npc || npc.look !== 'librarian');
}

libraryEl('dlg-books').addEventListener('click', () => { Sound.tap(); closeDialog(); openLibrary(); });
libraryEl('lib-done').addEventListener('click', () => { Sound.tap(); closeLibrary(); });
libraryEl('rd-close').addEventListener('click', () => { Sound.tap(); closeLibrary(); });
libraryEl('rd-prev').addEventListener('click', () => { Sound.tap(); bookHush(); bookTurn(-1); });
libraryEl('rd-next').addEventListener('click', () => { Sound.tap(); bookHush(); bookTurn(1); });
libraryEl('rd-play').addEventListener('click', bookPlayButton);
