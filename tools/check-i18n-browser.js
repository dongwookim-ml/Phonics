// Browser coverage for login language persistence and localized gameplay in both editions.
// Run: node tools/check-i18n-browser.js
const {launch}=require('./browser');
const {installLanguageAudit}=require('./language-audit');
const assert=require('node:assert/strict');
(async()=>{
const browser=await launch();
try {
const pickerPage = await browser.newPage({viewport:{width:1024,height:768}});
await pickerPage.route('https://**/*',route=>route.abort());
await pickerPage.goto(`file://${process.cwd()}/index.html`,{waitUntil:'domcontentloaded'});
await pickerPage.waitForSelector('#login:not(.hidden)');
for (const lang of ['en', 'ko']) {
  await Promise.all([
    pickerPage.waitForNavigation({waitUntil:'domcontentloaded'}),
    pickerPage.selectOption('#language-select',lang),
  ]);
  assert.equal(await pickerPage.locator('html').getAttribute('lang'),lang);
  await pickerPage.reload({waitUntil:'domcontentloaded'});
  assert.equal(await pickerPage.locator('#language-select').inputValue(),lang);
}
await pickerPage.close();
console.log('PASS language picker: English/Korean selection and reload persistence');
for(const lang of ['en','ko']) for(const edition of ['princess','captain']) {
 const page=await browser.newPage({viewport:{width:1024,height:768}});
 // Load an existing Korean profile rather than relying on localized defaults.
 if (edition === 'princess') await page.addInitScript(() => {
   localStorage.setItem('pixeltown-v2', JSON.stringify({
     edition: 'princess', player: { shown: '윤아', spoken: 'Yoona', title: 'princess', look: 'girl' },
   }));
 });
 if (lang === 'en') await installLanguageAudit(page);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',route=>route.abort());
 await page.goto(`file://${process.cwd()}/index.html?edition=${edition}&language=${lang}`,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#login:not(.hidden)');
 assert.equal(await page.locator('html').getAttribute('lang'),lang);
 await page.locator('#login-go').click();
 assert.match(await page.locator('#login-msg').innerText(),lang==='en'?/lowercase/:/아이디/);
 await page.locator('#login-guest').click();
 await page.locator('#start-btn').click({force:true});
 await page.waitForTimeout(300);
 const result=await page.evaluate(()=>{
   const labels=[];
   function collect(obj,seen=new Set()) {if(typeof obj==='string'){labels.push(obj);return}if(!obj||typeof obj!=='object'||seen.has(obj))return;seen.add(obj);Object.values(obj).forEach(x=>collect(x,seen));}
   [PLACES,TITLES,DRESS_COLORS,HEADWEAR,WARDROBE,BOOKS,DECODABLE_BOOKS,PARENT_KINDS].forEach(x=>collect(x));
   labels.push(place('castle'),place('room'),CAPTAIN_TEXT?.workbench?.() || '');
   return {labels,language:I18n.language,html:document.documentElement.lang,place:place('town'), heading:ui.startTitle.textContent};
 });
 if(lang==='en') assert.deepEqual(result.labels.filter(s=>/[가-힣]/.test(s)),[]);
 if (edition === 'princess') {
   assert.equal(await page.evaluate(() => place('room')), lang === 'en' ? "🎀 Yoona's room" : '🎀 윤아의 방');
   assert.equal(await page.locator('#name-input').inputValue(), '윤아');
   assert.equal(await page.locator('#spoken-input').inputValue(), 'Yoona');
   assert.equal(result.heading, lang === 'en' ? "Princess Yoona's" : '윤아 공주의');
   await page.evaluate(() => {
     setPlayer({ shown: '서연', spoken: 'Seoyeon' });
     renderStart();
   });
   assert.equal(await page.evaluate(() => place('room')), lang === 'en' ? "🎀 Seoyeon's room" : '🎀 서연의 방');
 }

 await page.evaluate(()=>{Sound.say=()=>Promise.resolve();parentOpen();});
 await page.locator('.parent-pw').fill('0000');
 await page.locator('.parent-go').click();
 await page.waitForSelector('.parent-kinds');
 if(lang==='en') assert.equal(/[가-힣]/.test(await page.locator('.parent-panel').innerText()),false);
 await page.evaluate(()=>parentClose());
 const more=await page.evaluate(()=>{
  renderWardrobe(); renderShop();
  return [ui.wardrobe.innerText,ui.shop.innerText];
 });
 if(lang==='en')assert.deepEqual(more.filter(s=>/[가-힣]/.test(s)),[]);
 if (lang === 'en') assert.deepEqual((await page.evaluate(() => languageAudit.snapshot())).hits, []);
 assert.deepEqual(errors,[]);
 console.log(`PASS ${edition}/${lang}: login, game labels, parent progress/settings, wardrobe, shop; no runtime errors`);
 await page.close();
}
} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
