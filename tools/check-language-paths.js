// Exercise static locale entrypoints as a GitHub Pages project subpath.
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!pathname.startsWith('/Phonics/')) { res.writeHead(404).end(); return; }
  let file = path.resolve(root, '.' + pathname.slice('/Phonics'.length));
  if (!file.startsWith(root + path.sep)) { res.writeHead(404).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!pathname.endsWith('/')) { res.writeHead(301, { Location: pathname + '/' }).end(); return; }
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.json': 'application/json' };
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM, headless: true });
    const base = `http://127.0.0.1:${server.address().port}/Phonics/`;
    for (const locale of ['en', 'ko']) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
      await page.addInitScript(value => localStorage.setItem('pixeltown-language', value), locale === 'en' ? 'ko' : 'en');
      await page.goto(`${base}${locale}/?language=${locale === 'en' ? 'ko' : 'en'}`);
      await page.waitForFunction(() => typeof I18n !== 'undefined');
      assert.equal(await page.evaluate(() => I18n.language), locale);
      assert.equal(await page.locator('html').getAttribute('lang'), locale);
      assert.equal(await page.evaluate(() => new URL('img/books/lion-mouse/page-01.webp', document.baseURI).pathname), '/Phonics/img/books/lion-mouse/page-01.webp');
      const next = locale === 'en' ? 'ko' : 'en';
      await page.locator('#language-select').selectOption(next);
      await page.waitForURL(url => url.pathname === `/Phonics/${next}/` && !url.searchParams.has('language'));
      assert.equal(await page.evaluate(() => I18n.language), next);
      await page.reload();
      assert.equal(await page.evaluate(() => I18n.language), next);
      await context.close();
    }
    console.log('locale paths OK: priority, project assets, switching and reload');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
