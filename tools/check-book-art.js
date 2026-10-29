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
      const cover = page.locator('.lib-book .cover-art');
      assert.equal(await cover.count(), 1);
      await cover.scrollIntoViewIfNeeded();
      await cover.evaluate(image => image.decode());
      for (const [width, height] of [[1024, 768], [768, 1024], [844, 390], [390, 844]]) {
        await page.setViewportSize({ width, height });
        for (let i = 0; i < 8; i++) {
          await page.evaluate(i => {
            if (!i) openBook(BOOKS.find(book => book.id === 'lion-mouse'));
            else bookTurn(1);
          }, i);
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
        await page.evaluate(() => { bookQuestion(0); bookSummary(); });
        await page.locator('.summary-art').evaluate(image => image.decode());
      }
      await page.evaluate(() => {
        openBook(BOOKS.find(book => book.id === 'tortoise-hare'));
      });
      assert.equal(await page.locator('#rd-pic img').count(), 0);
      assert.equal(await page.locator('#reader').evaluate(el => el.classList.contains('illustrated')), false);
      await page.evaluate(() => {
        state.skill.read = { t: 4 };
        openSelfBook(DECODABLE_BOOKS[0]);
      });
      assert.equal(await page.locator('#reader').evaluate(el => el.classList.contains('self') && !el.classList.contains('illustrated')), true);
      // Force an image request failure and check the fallback on this page.
      await page.evaluate(() => {
        const book = BOOKS.find(book => book.id === 'lion-mouse');
        openBook({ ...book, pages: book.pages.map((page, i) => i ? page : { ...page, image: 'img/books/lion-mouse/missing.webp' }) });
      });
      await page.waitForFunction(() => !document.querySelector('#rd-pic img'));
      assert.ok((await page.locator('#rd-pic').innerText()).length);
      assert.deepEqual(errors, []);
      console.log(`PASS ${edition}/${language}: cover, 8 illustrated pages at 4 sizes, quiz/summary, other books, self-reader, failed-image fallback`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
