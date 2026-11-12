// Verify illustrated books, tales still told with emoji pictures, their text/quiz
// flow and the emoji fallback when an image fails.
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
      const stories = await page.evaluate(() => BOOKS.map(b => ({ id: b.id, pages: b.pages.length, art: !!b.coverImage })));
      // A tale without art yet shows its emoji on the cover and on every page.
      assert.equal(await cover.count(), stories.filter(b => b.art).length);
      assert.equal(await page.locator('.lib-book:not(.self):not(.illustrated) .cv').count(), stories.filter(b => !b.art).length);
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
          if (story.art) await page.locator('#rd-pic img').evaluate(image => image.decode());
          const metrics = await page.evaluate(() => {
            const pic = document.querySelector('#rd-pic img') || document.querySelector('#rd-pic');
            const text = document.querySelector('#rd-text');
            const paper = document.querySelector('#rd-paper').getBoundingClientRect();
            const bounds = element => {
              const rect = element.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0 && rect.top >= paper.top && rect.left >= paper.left && rect.right <= paper.right && rect.bottom <= paper.bottom;
            };
            const content = library.book.pages[library.page];
            return { image: bounds(pic), text: bounds(text), fitsText: text.scrollHeight <= text.clientHeight + 1, alt: pic.alt, emoji: pic.tagName !== 'IMG' && pic.textContent === content.pic, page: library.page };
          });
          assert.equal(metrics.page, i);
          assert.ok(metrics.image && metrics.text, `${bookId} ${edition}/${language} ${width}x${height} page ${i + 1}: content outside paper`);
          assert.ok(metrics.fitsText, `${bookId} ${width}x${height} page ${i + 1}: story text needs scrolling`);
          assert.ok(story.art ? metrics.alt : metrics.emoji, `${bookId} page ${i + 1}: ${story.art ? 'picture has no alt text' : 'emoji picture missing'}`);
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
        if (story.art) await page.locator('.summary-art').evaluate(image => image.decode());
        else assert.equal(await page.locator('.summary-art').count(), 0);
      }
      }
      const selfBooks = await page.evaluate(() => DECODABLE_BOOKS.map(b => ({ id: b.id, pages: b.pages.length, art: !!b.coverImage })));
      assert.equal(await page.locator('.lib-book.self .cover-art').count(), selfBooks.filter(b => b.art).length);
      assert.equal(await page.locator('.lib-book.self:not(.illustrated) .cv').count(), selfBooks.filter(b => !b.art).length);
      for (const book of selfBooks) {
        for (const [width, height] of [[1024, 768], [768, 1024], [844, 390], [390, 844]]) {
          await page.setViewportSize({ width, height });
          for (let i = 0; i < book.pages; i++) {
            await page.evaluate(({id, i}) => {
              if (!i) openSelfBook(DECODABLE_BOOKS.find(b => b.id === id));
              else selfTurn(1);
            }, { id: book.id, i });
            if (book.art) await page.locator('#rd-pic img').evaluate(img => img.decode());
            const m = await page.evaluate(() => {
              const p = document.querySelector('#rd-paper').getBoundingClientRect();
              const pic = document.querySelector('#rd-pic img') || document.querySelector('#rd-pic');
              const img = pic.getBoundingClientRect();
              const t = document.querySelector('#rd-text');
              const r = t.getBoundingClientRect();
              const emoji = pic.tagName !== 'IMG' && pic.textContent === library.book.pages[library.page].pic;
              return {fits: img.width > 0 && img.height > 0 && img.top >= p.top && img.bottom <= p.bottom + 1 && img.left >= p.left - 1 && img.right <= p.right + 1 && r.top >= p.top && r.bottom <= p.bottom + 1 && t.scrollHeight <= t.clientHeight + 1, words: t.querySelectorAll('.rd-word').length, emoji};
            });
            assert.ok(m.fits && m.words, `${book.id} page ${i+1} ${width}x${height}: image/word tiles overflow`);
            assert.ok(book.art || m.emoji, `${book.id} page ${i+1}: emoji picture missing`);
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
      const drawn = stories.filter(b => b.art), emoji = stories.filter(b => !b.art);
      const selfPages = selfBooks.reduce((n, b) => n + b.pages, 0), selfDrawn = selfBooks.filter(b => b.art).length;
      console.log(`PASS ${edition}/${language}: ${drawn.length} covers, ${drawn.reduce((n, b) => n + b.pages, 0)} illustrated story pages and ${emoji.length} emoji tales (${emoji.reduce((n, b) => n + b.pages, 0)} pages) at 4 sizes, quiz/summary, ${selfBooks.length} self-books (${selfDrawn} illustrated, ${selfPages} pages), failed-image fallback`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
