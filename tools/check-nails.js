// Direct item taps, locked purchases, separate fingers, persistence and layouts.
// Run: node tools/check-nails.js (Playwright + Chromium).
const assert = require('node:assert/strict');
const path = require('path');
const { launch } = require('./browser');
const root = path.join(__dirname, '..');

(async () => {
  const browser = await launch();
  try {
    for (const language of ['en', 'ko']) {
      const context = await browser.newContext({ viewport: { width: 1180, height: 820 } });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route(/^https?:/, r => r.abort());
      await page.goto(`file://${path.join(root, 'index.html')}?guest&language=${language}&halloween=0`);
      await page.evaluate(() => {
        Sound.say = () => {};
        ui.startBtn.click(); state.guide = { step: 3 }; state.stars = 20; save();
        const town = sceneFor('town'), keeper = town.npcs.find(n => n.nailSalon);
        if (!keeper || !town.objects.some(o => o.kind === 'nail-salon')) throw Error('No nail salon in town');
        if (!findPath(town, town.start, (c, r) => Math.abs(c - keeper.c) + Math.abs(r - keeper.r) === 1)) throw Error('Nail artist is unreachable');
        if (guideAsks(keeper)) throw Error('Nail artist must not ask phonics questions');
        state.scene = town; placeHero(keeper.c + 3, keeper.r); snapCamera();
        tapObject(town.objects.find(o => o.kind === 'nail-salon'));
      });
      await page.waitForFunction(() => !nailUi.card.classList.contains('hidden'));
      assert.equal(await page.locator('#nail-hand [data-finger]').count(), 10);
      assert.equal(await page.locator('#nail-all, #nail-buy').count(), 0);
      for (const side of ['left', 'right']) assert.equal(await page.locator(`#nail-hand [data-hand="${side}"] [data-finger]`).count(), 5);
      const migrated = await page.evaluate(() => {
        const legacy = nailSaved({ owned: { polish: ['rose', 'glitter'] }, fingers: { thumb: { polish: 'rose', at: 5 }, index: { polish: 'glitter', at: 6 } } });
        return { count: Object.keys(legacy.fingers).length, left: legacy.fingers.thumb.polish, right: legacy.fingers['right-thumb'].polish, glitter: legacy.fingers.index.polish };
      });
      assert.deepEqual(migrated, { count: 10, left: 'rose', right: 'clear', glitter: 'glitter' });
      const finger = value => page.locator(`#nail-fingers [data-finger="${value}"]`).click();
      const tab = value => page.locator(`#nail-tabs [data-slot="${value}"]`).click();
      const item = value => page.locator(`#nail-items [data-value="${value}"]`);
      const stars = () => page.evaluate(() => state.stars);
      const design = f => page.evaluate(key => state.nails.fingers[key], f);
      const before = await page.evaluate(() => ({ outfit: JSON.stringify(state.outfit), sprite: heroSprite(state.outfit, 0).canvas.toDataURL(), earned: starsEarned() }));
      await finger('thumb');
      assert.equal(await item('rose').locator('.nail-item-lock').count(), 1);
      assert.ok((await item('rose').getAttribute('aria-label')).includes('3'));
      await item('rose').click();
      assert.equal(await stars(), 17); assert.equal((await design('thumb')).polish, 'rose');
      assert.equal((await design('index')).polish, 'clear'); assert.equal((await design('right-thumb')).polish, 'clear');
      assert.equal(await item('rose').locator('.nail-item-lock').count(), 0);
      assert.equal(await item('rose').getAttribute('aria-pressed'), 'true');
      const savedOnce = await page.evaluate(() => localStorage.getItem(SAVE_KEY));
      await item('rose').click();
      assert.equal(await stars(), 17);
      assert.equal(await page.evaluate(() => localStorage.getItem(SAVE_KEY)), savedOnce, 'Repeated taps on the current design must not buy or save again');
      await finger('index'); await item('rose').click(); assert.equal(await stars(), 17);
      await finger('thumb'); await tab('sticker'); await item('heart').click();
      await tab('ring'); await item('pearl').click(); assert.equal(await stars(), 10);
      const layered = await design('thumb');
      assert.equal(layered.polish, 'rose'); assert.equal(layered.sticker, 'heart'); assert.equal(layered.ring, 'pearl');
      await tab('sticker'); await item('none').click(); assert.equal((await design('thumb')).ring, 'pearl');
      await finger('right-thumb'); await item('heart').click();
      await tab('polish'); await item('blush').click();
      await tab('ring'); await item('pearl').click();
      assert.equal(await stars(), 10); assert.equal((await design('thumb')).sticker, 'none');
      assert.equal((await design('right-thumb')).sticker, 'heart');
      // Pause/insufficient stars cannot change the design. Owned items work at zero stars.
      await finger('middle'); await tab('polish');
      await page.evaluate(() => { state.paused = true; }); await item('sky').click();
      assert.equal(await stars(), 10); assert.equal((await design('middle')).polish, 'clear');
      await page.evaluate(() => { state.paused = false; state.stars = 0; save(); renderNailSalon(); });
      await tab('ring'); const poorBefore = await design('middle'); await item('star').click();
      assert.equal(await stars(), 0); assert.deepEqual(await design('middle'), poorBefore);
      assert.equal(await item('star').locator('.nail-item-lock').count(), 1);
      assert.equal(await page.locator('#nail-msg').innerText(), await page.evaluate(() => I18n.t('nails.needStars', 5)));
      await tab('polish'); await item('rose').click();
      assert.equal((await design('middle')).polish, 'rose'); assert.equal(await stars(), 0);
      const unchanged = await page.evaluate(() => ({ outfit: JSON.stringify(state.outfit), sprite: heroSprite(state.outfit, 0).canvas.toDataURL(), earned: starsEarned() }));
      assert.deepEqual(unchanged, before);
      await page.locator('#nail-done').click(); await page.reload();
      await page.waitForFunction(() => typeof state !== 'undefined');
      assert.equal(await stars(), 0); assert.equal((await design('index')).polish, 'rose'); assert.equal((await design('thumb')).ring, 'pearl');
      assert.equal((await design('right-thumb')).polish, 'blush'); assert.equal((await design('right-thumb')).sticker, 'heart');
      await page.evaluate(() => {
        Sound.say = () => {}; ui.startBtn.click(); openNailSalon(sceneFor('town').npcs.find(n => n.nailSalon));
        const local = JSON.parse(localStorage.getItem(SAVE_KEY)), remote = JSON.parse(JSON.stringify(local));
        remote.nails.owned.ring.push('star');
        remote.nails.fingers['right-little'] = { polish: 'blush', sticker: 'none', ring: 'star', at: Date.now() + 1000 };
        applyProgress(Progress.merge(local, remote, 'theirs'));
      });
      assert.equal((await design('right-little')).ring, 'star');
      await tab('ring'); assert.equal(await item('star').locator('.nail-item-lock').count(), 0);
      // Both hand diagrams and native keyboard controls retain selection/focus.
      await page.locator('#nail-hand [data-finger="right-middle"]').click();
      assert.equal(await page.evaluate(() => nailSalon.finger), 'right-middle');
      await page.locator('#nail-hand [data-finger="thumb"]').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => nailSalon.finger), 'thumb');
      await page.locator('#nail-fingers [data-finger="index"]').focus(); await page.keyboard.press('Enter');
      await page.locator('#nail-tabs [data-slot="ring"]').focus(); await page.keyboard.press('ArrowLeft');
      assert.equal(await page.evaluate(() => nailSalon.tab), 'sticker');
      await item('heart').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.value), 'heart');
      assert.equal((await design('index')).sticker, 'heart');
      // Premium locks use the same price for the label, shortage and direct purchase.
      const specialPrices = { glitter: 8, rainbow: 10, confetti: 10, holographic: 12, mermaid: 12, crystal: 14, galaxy: 15 };
      await tab('polish'); await page.evaluate(() => { state.stars = 13; renderNailSalon(); });
      await item('crystal').click(); assert.equal(await stars(), 13);
      assert.equal(await page.evaluate(() => nailMine('polish', 'crystal')), false);
      assert.equal(await page.locator('#nail-msg').innerText(), await page.evaluate(() => I18n.t('nails.needStars', 1)));
      await page.evaluate(() => { state.stars = 100; renderNailSalon(); });
      let balance = 100;
      for (const [value, price] of Object.entries(specialPrices)) {
        await finger('middle');
        assert.ok((await item(value).locator('.nail-price').innerText()).includes(String(price)));
        assert.equal(await item(value).locator('.nail-item-lock').count(), 1);
        const otherFinger = await design('right-index');
        await item(value).click(); balance -= price;
        assert.equal(await stars(), balance); assert.equal((await design('middle')).polish, value);
        assert.deepEqual(await design('right-index'), otherFinger, 'An item tap may change only the selected finger');
        assert.equal(await item(value).locator('.nail-item-lock').count(), 0);
        await finger('right-thumb'); await item(value).click();
        assert.equal(await stars(), balance); assert.equal((await design('right-thumb')).polish, value);
      }
      await page.reload(); await page.waitForFunction(() => typeof state !== 'undefined');
      assert.equal(await stars(), balance); assert.equal((await design('right-thumb')).polish, 'galaxy');
      for (const value of Object.keys(specialPrices)) assert.ok(await page.evaluate(v => nailMine('polish', v), value));
      await page.evaluate(() => { Sound.say = () => {}; ui.startBtn.click(); openNailSalon(sceneFor('town').npcs.find(n => n.nailSalon)); });
      // Every layout keeps catalog items, feedback and exit accessible.
      for (const [width, height] of [[1180,820],[1920,1080],[2560,1440],[3440,1440],[768,1024],[844,390],[390,844],[320,568]]) {
        await page.setViewportSize({ width, height });
        for (const slot of ['polish', 'sticker', 'ring']) {
          await tab(slot);
          await page.locator('#nail-items [data-value]').last().click();
          await page.locator('#nail-items [data-value]').last().scrollIntoViewIfNeeded();
          const m = await page.evaluate(() => {
            const r = nailUi.card.getBoundingClientRect(), close = nailUi.done.getBoundingClientRect(), svg = nailUi.hand.querySelector('svg').getBoundingClientRect();
            const last = nailUi.items.lastElementChild.getBoundingClientRect();
            return { inside: r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1, close: close.top >= r.top && close.bottom <= r.bottom, item: last.top >= r.top && last.bottom <= r.bottom + 1, hand: svg.width > 0 && svg.height > 100, noHorizontalScroll: nailUi.card.scrollWidth <= nailUi.card.clientWidth + 1 };
          });
          assert.ok(m.inside && m.close && m.item && m.hand && m.noHorizontalScroll, `${language}/${width}x${height}/${slot}: ${JSON.stringify(m)}`);
          if (width >= 1920) {
            const large = await page.evaluate(() => {
              const card = nailUi.card.getBoundingClientRect(), mat = nailUi.hand.getBoundingClientRect();
              const hands = [...nailUi.hand.querySelectorAll('.nail-hand-pose')].map(el => el.getBoundingClientRect());
              return { wide: card.width >= innerWidth * .9, largeHands: hands.every(r => r.height >= innerHeight * .5), fit: hands.every(r => r.left >= mat.left && r.right <= mat.right && r.top >= mat.top && r.bottom <= mat.bottom) };
            });
            assert.ok(large.wide && large.largeHands && large.fit, `${language}/${width}x${height}: ${JSON.stringify(large)}`);
          }
          if (language === 'en') assert.ok(!/[가-힣]/.test(await page.locator('#nail-salon').innerText()), 'Korean text on the English nail salon');
        }
      }
      await page.locator('#nail-done').click(); assert.equal(await page.evaluate(() => state.busy), false);
      await page.evaluate(() => { openWardrobe(); openNailSalon(sceneFor('town').npcs.find(n => n.nailSalon)); closeNailSalon(); });
      assert.equal(await page.evaluate(() => state.busy), true);
      await page.evaluate(() => closeWardrobe());
      const limited = await page.evaluate(() => {
        state.settings.playLimit = 1; state.playtime = { day: guideDay(), ms: 120000 };
        const stars = state.stars;
        openNailSalon(sceneFor('town').npcs.find(n => n.nailSalon)); nailApply('rose');
        return { closed: nailUi.card.classList.contains('hidden'), same: stars === state.stars };
      });
      assert.ok(limited.closed && limited.same); assert.deepEqual(errors, []);
      console.log(`PASS nails/${language}: direct tap apply/buy, locks, separate fingers, free reuse at zero stars, prices/shortages, reload/sync, keyboard, 8 layouts and play limit`);
      await context.close();
    }
    const captain = await browser.newPage();
    await captain.route(/^https?:/, r => r.abort());
    await captain.goto(`file://${path.join(root,'index.html')}?guest&edition=captain`);
    assert.equal(await captain.evaluate(() => sceneFor('town').npcs.some(n => n.nailSalon)), false);
    assert.ok(await captain.evaluate(() => state.nails && state.nails.fingers.middle));
    await captain.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
