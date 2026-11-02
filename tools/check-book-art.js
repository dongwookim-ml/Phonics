// Verify illustrated books, their text/quiz flow and the existing emoji fallback.
// Run: node tools/check-book-art.js (Playwright + Chromium)
const assert = require('node:assert/strict');
const path = require('path');
const { launch } = require('./browser');
const root = path.join(__dirname, '..');
(async () => {
  const browser = await launch();
  try {
    for (const language of ['en', 'ko']) for (const edition of ['princess', 'captain']) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route(/^https?:/, route => route.abort());
      await page.goto(`file://${path.join(root, 'index.html')}?guest&language=${language}&edition=${edition}`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        ui.start.classList.add('hidden');
        Sound.say = () => {};
        bookSay = () => {}; // keep page changes under test control
        state.stars = 99;
        openLibrary();
      });
      const cover = page.locator('.lib-book:not(.self) .cover-art');
      const stories = await page.evaluate(() => BOOKS.map(b => ({ id: b.id, pages: b.pages.length })));
      assert.equal(await cover.count(), stories.length);
      for (const image of await cover.all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(image => image.decode());
      }
      for (const story of stories) {
      const bookId = story.id;
      for (const [width, height] of [[1024, 768], [768, 1024], [844, 390], [390, 844]]) {
        await page.setViewportSize({ width, height });
        for (let i = 0; i < story.pages; i++) {
          await page.evaluate(({ i, bookId }) => {
            if (!i) openBook(BOOKS.find(book => book.id === bookId));
            else bookTurn(1);
          }, { i, bookId });
          const image = page.locator('#rd-pic img');
          await image.evaluate(image => image.decode());
          const metrics = await page.evaluate(() => {
            const pic = document.querySelector('#rd-pic img');
            const text = document.querySelector('#rd-text');
            const paper = document.querySelector('#rd-paper').getBoundingClientRect();
            const bounds = element => {
              const rect = element.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0 && rect.top >= paper.top && rect.left >= paper.left && rect.right <= paper.right && rect.bottom <= paper.bottom;
            };
            return { image: bounds(pic), text: bounds(text), fitsText: text.scrollHeight <= text.clientHeight + 1, alt: pic.alt, page: library.page };
          });
          assert.equal(metrics.page, i);
          assert.ok(metrics.image && metrics.text, `${edition}/${language} ${width}x${height} page ${i + 1}: content outside paper`);
          assert.ok(metrics.fitsText, `${width}x${height} page ${i + 1}: story text needs scrolling`);
          assert.ok(metrics.alt);
        }
        await page.evaluate(() => bookTurn(1));
        assert.equal(await page.evaluate(() => library.mode), 'quiz');
        const completion = await page.evaluate(() => {
          const before = state.coins;
          for (let i = 0; i < library.book.quiz.length; i++) {
            bookQuestion(i);
            const k = library.book.quiz[i].answer;
            bookPick(k, document.querySelector(`#rd-options [data-k="${k}"]`));
          }
          bookNext();
          return { mode: library.mode, earned: state.coins - before, answered: bookLog(library.book.id).got.length };
        });
        assert.equal(completion.mode, 'summary');
        assert.equal(completion.answered, 3);
        assert.equal(completion.earned, width === 1024 ? 3 : 0, `${bookId}: quiz rewards must pay only once`);
        await page.locator('.summary-art').evaluate(image => image.decode());
      }
      }
      const selfBooks = await page.evaluate(() => DECODABLE_BOOKS.map(b => ({ id: b.id, pages: b.pages.length })));
      assert.equal(await page.locator('.lib-book.self .cover-art').count(), 8);
      for (const book of selfBooks) {
        for (const [width, height] of [[1024, 768], [768, 1024], [844, 390], [390, 844]]) {
          await page.setViewportSize({ width, height });
          for (let i = 0; i < book.pages; i++) {
            await page.evaluate(({id, i}) => {
              if (!i) openSelfBook(DECODABLE_BOOKS.find(b => b.id === id));
              else selfTurn(1);
            }, { id: book.id, i });
            await page.locator('#rd-pic img').evaluate(img => img.decode());
            const m = await page.evaluate(() => {
              const p = document.querySelector('#rd-paper').getBoundingClientRect();
              const img = document.querySelector('#rd-pic img').getBoundingClientRect();
              const t = document.querySelector('#rd-text');
              const r = t.getBoundingClientRect();
              return {fits: img.width > 0 && img.height > 0 && img.top >= p.top && img.bottom <= p.bottom + 1 && r.top >= p.top && r.bottom <= p.bottom + 1 && t.scrollHeight <= t.clientHeight + 1, words: t.querySelectorAll('.rd-word').length};
            });
            assert.ok(m.fits && m.words, `${book.id} page ${i+1} ${width}x${height}: image/word tiles overflow`);
          }
          await page.evaluate(() => selfTurn(1));
          assert.equal(await page.evaluate(() => library.mode), 'selfEnd');
        }
      }
      // Unillustrated imported/custom books still use emoji.
      await page.evaluate(() => openSelfBook({ ...DECODABLE_BOOKS[0], pages: DECODABLE_BOOKS[0].pages.map(p => ({...p, image: null})) }));
      assert.equal(await page.locator('#rd-pic img').count(), 0);
      // Force an image request failure and check the fallback on this page.
      await page.evaluate(() => {
        const book = BOOKS.find(book => book.id === 'lion-mouse');
        openBook({ ...book, pages: book.pages.map((page, i) => i ? page : { ...page, image: 'img/books/lion-mouse/missing.webp' }) });
      });
      await page.waitForFunction(() => !document.querySelector('#rd-pic img'));
      assert.ok((await page.locator('#rd-pic').innerText()).length);
      assert.deepEqual(errors, []);
      console.log(`PASS ${edition}/${language}: ${stories.length} covers, ${stories.reduce((n, b) => n + b.pages, 0)} illustrated story pages at 4 sizes, quiz/summary, 8 self-books (42 pages), failed-image fallback`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
