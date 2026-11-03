// Manicure purchases, independent layers, persistence, sync and touch layouts.
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
      for (const side of ['left', 'right']) assert.equal(await page.locator(`#nail-hand [data-hand="${side}"] [data-finger]`).count(), 5);
      const migrated = await page.evaluate(() => {
        const legacy = nailSaved({ owned: { polish: ['rose', 'glitter'] }, fingers: { thumb: { polish: 'rose', at: 5 }, index: { polish: 'glitter', at: 6 } } });
        return { count: Object.keys(legacy.fingers).length, left: legacy.fingers.thumb.polish, right: legacy.fingers['right-thumb'].polish, owned: legacy.owned.polish.includes('rose'), glitter: legacy.fingers.index.polish };
      });
      assert.deepEqual(migrated, { count: 10, left: 'rose', right: 'clear', owned: true, glitter: 'glitter' });
      const result = await page.evaluate(() => {
        const before = { outfit: JSON.stringify(state.outfit), sprite: heroSprite(state.outfit, 0).canvas.toDataURL(), earned: starsEarned() };
        const set = (finger, tab, pick, all = false) => { Object.assign(nailSalon, { finger, tab, pick, all }); renderNailSalon(); };
        set('thumb', 'polish', 'rose');
        const preview = { stars: state.stars, saved: state.nails.fingers.thumb.polish, visible: nailUi.hand.querySelector('[data-finger="thumb"]').innerHTML.includes(NAIL_ITEMS.polish.rose.color) };
        nailApply(); const first = state.stars; nailApply(); const twice = state.stars;
        set('index', 'polish', 'rose'); nailApply(); const reused = state.stars;
        set('thumb', 'sticker', 'heart'); nailApply();
        set('thumb', 'ring', 'pearl'); nailApply();
        const layers = Object.assign({}, state.nails.fingers.thumb), paid = state.stars;
        set('middle', 'polish', 'mint'); closeNailSalon();
        const cancelled = { color: state.nails.fingers.middle.polish, stars: state.stars, busy: state.busy };
        openNailSalon(sceneFor('town').npcs.find(n => n.nailSalon));
        set('middle', 'polish', 'lavender', true); nailApply();
        const all = { stars: state.stars, colors: NAIL_FINGERS.map(f => state.nails.fingers[f].polish), thumb: Object.assign({}, state.nails.fingers.thumb) };
        set('thumb', 'sticker', 'none'); nailApply();
        const removed = Object.assign({}, state.nails.fingers.thumb);
        set('right-thumb', 'polish', 'blush'); nailApply();
        set('right-thumb', 'sticker', 'heart'); nailApply();
        set('right-thumb', 'ring', 'pearl'); nailApply();
        const separate = { left: Object.assign({}, state.nails.fingers.thumb), right: Object.assign({}, state.nails.fingers['right-thumb']), stars: state.stars };
        set('middle', 'polish', 'sky'); state.paused = true; nailApply(); state.paused = false;
        const paused = { stars: state.stars, color: state.nails.fingers.middle.polish };
        state.stars = 0; save();
        const manicure = JSON.stringify(state.nails);
        set('middle', 'ring', 'star'); nailApply();
        const poor = { stars: state.stars, same: manicure === JSON.stringify(state.nails), msg: nailUi.msg.textContent, mine: state.nails.owned.ring.includes('star') };
        const unchanged = { outfit: JSON.stringify(state.outfit) === before.outfit, sprite: heroSprite(state.outfit, 0).canvas.toDataURL() === before.sprite, earned: starsEarned() === before.earned };
        closeNailSalon();
        return { preview, first, twice, reused, layers, paid, cancelled, all, removed, separate, paused, poor, unchanged };
      });
      assert.deepEqual(result.preview, { stars: 20, saved: 'clear', visible: true });
      assert.equal(result.first, 17); assert.equal(result.twice, 17); assert.equal(result.reused, 17);
      assert.equal(result.paid, 10);
      assert.equal(result.layers.polish, 'rose'); assert.equal(result.layers.sticker, 'heart'); assert.equal(result.layers.ring, 'pearl');
      assert.deepEqual(result.cancelled, { color: 'clear', stars: 10, busy: false });
      assert.equal(result.all.colors.length, 10); assert.equal(result.all.stars, 7); assert.ok(result.all.colors.every(c => c === 'lavender'));
      assert.equal(result.all.thumb.sticker, 'heart'); assert.equal(result.all.thumb.ring, 'pearl');
      assert.equal(result.separate.stars, 7);
      assert.equal(result.separate.left.polish, 'lavender'); assert.equal(result.separate.left.sticker, 'none');
      assert.equal(result.separate.right.polish, 'blush'); assert.equal(result.separate.right.sticker, 'heart'); assert.equal(result.separate.right.ring, 'pearl');
      assert.equal(result.removed.sticker, 'none'); assert.equal(result.removed.ring, 'pearl');
      assert.deepEqual(result.paused, { stars: 7, color: 'lavender' });
      assert.ok(result.poor.same && !result.poor.mine && result.poor.msg.includes('5')); assert.equal(result.poor.stars, 0);
      assert.deepEqual(result.unchanged, { outfit: true, sprite: true, earned: true });
      await page.reload();
      await page.waitForFunction(() => typeof state !== 'undefined');
      const saved = await page.evaluate(() => ({ stars: state.stars, color: state.nails.fingers.index.polish, ring: state.nails.fingers.thumb.ring, owned: state.nails.owned, right: state.nails.fingers['right-thumb'] }));
      assert.equal(saved.stars, 0); assert.equal(saved.color, 'lavender'); assert.equal(saved.ring, 'pearl');
      assert.ok(saved.owned.polish.includes('rose') && saved.owned.ring.includes('pearl'));
      assert.equal(saved.right.polish, 'blush'); assert.equal(saved.right.sticker, 'heart'); assert.equal(saved.right.ring, 'pearl');
      await page.evaluate(() => {
        Sound.say = () => {}; ui.startBtn.click(); openNailSalon(sceneFor('town').npcs.find(n => n.nailSalon));
        const local = JSON.parse(localStorage.getItem(SAVE_KEY)), remote = JSON.parse(JSON.stringify(local));
        remote.nails.owned.ring.push('star');
        remote.nails.fingers['right-little'] = { polish: 'blush', sticker: 'none', ring: 'star', at: Date.now() + 1000 };
        applyProgress(Progress.merge(local, remote, 'theirs'));
      });
      assert.equal(await page.evaluate(() => state.nails.fingers['right-little'].ring), 'star');
      await page.locator('#nail-tabs [data-slot="ring"]').click();
      assert.ok((await page.locator('#nail-items [data-value="star"]').getAttribute('class')).includes('mine'));
      // Both mirrored hands select the intended finger directly; controls retain focus.
      await page.locator('#nail-hand [data-finger="right-middle"]').click();
      assert.equal(await page.evaluate(() => nailSalon.finger), 'right-middle');
      assert.equal(await page.locator('#nail-fingers [aria-pressed="true"]').getAttribute('data-finger'), 'right-middle');
      await page.locator('#nail-hand [data-finger="thumb"]').click();
      assert.equal(await page.evaluate(() => nailSalon.finger), 'thumb');
      // Native keyboard activation and retained focus after preview re-rendering.
      await page.locator('#nail-fingers [data-finger="index"]').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => nailSalon.finger), 'index');
      await page.locator('#nail-tabs [data-slot="ring"]').focus(); await page.keyboard.press('ArrowLeft');
      assert.equal(await page.evaluate(() => nailSalon.tab), 'sticker');
      await page.locator('#nail-items [data-value="heart"]').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.value), 'heart');
      // Premium prices must be used consistently by the catalog, checkout and
      // insufficient-funds calculation. All ten nails still unlock just once.
      const specialPrices = { glitter: 8, rainbow: 10, confetti: 10, holographic: 12, mermaid: 12, crystal: 14, galaxy: 15 };
      await page.locator('#nail-tabs [data-slot="polish"]').click();
      await page.evaluate(() => { state.stars = 13; renderNailSalon(); });
      await page.locator('#nail-items [data-value="crystal"]').click();
      await page.locator('#nail-buy').click();
      assert.equal(await page.evaluate(() => state.stars), 13);
      assert.equal(await page.evaluate(() => nailMine('polish', 'crystal')), false);
      assert.equal(await page.locator('#nail-msg').innerText(), await page.evaluate(() => I18n.t('nails.needStars', 1)));
      await page.evaluate(() => { state.stars = 100; renderNailSalon(); });
      let balance = 100;
      for (const [value, price] of Object.entries(specialPrices)) {
        const item = page.locator(`#nail-items [data-value="${value}"]`);
        assert.ok((await item.locator('.nail-price').innerText()).includes(String(price)));
        await item.click();
        assert.equal(await page.evaluate(() => state.stars), balance, 'Preview must not spend stars');
        assert.ok((await page.locator('#nail-buy').innerText()).includes(String(price)));
        // Applying a premium finish to both hands costs the catalog price once.
        if (value === 'rainbow') await page.locator('#nail-all').click();
        await page.locator('#nail-buy').click();
        balance -= price;
        assert.equal(await page.evaluate(() => state.stars), balance);
        if (value === 'rainbow') {
          assert.ok(await page.evaluate(() => NAIL_FINGERS.every(f => state.nails.fingers[f].polish === 'rainbow')));
          await page.locator('#nail-fingers [data-finger="middle"]').click();
        }
        // Reuse on the other hand is free.
        await page.locator('#nail-fingers [data-finger="right-thumb"]').click();
        await page.locator('#nail-items [data-value="clear"]').click();
        await page.locator('#nail-buy').click();
        await page.locator(`#nail-items [data-value="${value}"]`).click();
        await page.locator('#nail-buy').click();
        assert.equal(await page.evaluate(() => state.stars), balance);
        assert.equal(await page.evaluate(() => state.nails.fingers['right-thumb'].polish), value);
        await page.locator('#nail-fingers [data-finger="middle"]').click();
      }
      await page.reload();
      await page.waitForFunction(() => typeof state !== 'undefined');
      assert.equal(await page.evaluate(() => state.stars), balance);
      assert.equal(await page.evaluate(() => state.nails.fingers['right-thumb'].polish), 'galaxy');
      for (const value of Object.keys(specialPrices)) assert.ok(await page.evaluate(v => nailMine('polish', v), value));
      await page.evaluate(() => { Sound.say = () => {}; ui.startBtn.click(); openNailSalon(sceneFor('town').npcs.find(n => n.nailSalon)); });
      // Every viewport keeps the hand accessible and the purchase/exit reachable;
      // small portrait screens deliberately scroll the workbench below the hand.
      for (const [width, height] of [[1180,820],[768,1024],[844,390],[390,844],[320,568]]) {
        await page.setViewportSize({ width, height });
        for (const slot of ['polish', 'sticker', 'ring']) {
          await page.locator(`#nail-tabs [data-slot="${slot}"]`).click();
          await page.locator('#nail-items [data-value]').last().scrollIntoViewIfNeeded();
          await page.locator('#nail-items [data-value]').last().click();
          await page.locator('#nail-buy').scrollIntoViewIfNeeded();
          const m = await page.evaluate(() => {
            const r = nailUi.card.getBoundingClientRect(), b = nailUi.buy.getBoundingClientRect(), svg = nailUi.hand.querySelector('svg').getBoundingClientRect();
            return { inside: r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1, buy: b.top >= r.top && b.bottom <= r.bottom + 1, hand: svg.width > 0 && svg.height > 100, noHorizontalScroll: nailUi.card.scrollWidth <= nailUi.card.clientWidth + 1 };
          });
          assert.ok(m.inside && m.buy && m.hand && m.noHorizontalScroll, `${language}/${width}x${height}/${slot}: ${JSON.stringify(m)}`);
          if (language === 'en') assert.ok(!/[가-힣]/.test(await page.locator('#nail-salon').innerText()), 'Korean text on the English nail salon');
        }
      }
      await page.locator('#nail-done').click();
      assert.equal(await page.evaluate(() => state.busy), false);
      await page.evaluate(() => {
        openWardrobe(); openNailSalon(sceneFor('town').npcs.find(n => n.nailSalon)); closeNailSalon();
      });
      assert.equal(await page.evaluate(() => state.busy), true);
      await page.evaluate(() => closeWardrobe());
      // An expired play session cannot reopen the salon or spend more stars.
      const limited = await page.evaluate(() => {
        state.settings.playLimit = 1; state.playtime = { day: guideDay(), ms: 120000 };
        const stars = state.stars;
        openNailSalon(sceneFor('town').npcs.find(n => n.nailSalon)); nailApply();
        return { closed: nailUi.card.classList.contains('hidden'), same: stars === state.stars };
      });
      assert.ok(limited.closed && limited.same);
      assert.deepEqual(errors, []);
      console.log(`PASS nails/${language}: town entry, preview, purchases/reuse, independent hands/ten fingers, legacy saves, premium pricing/reuse, insufficient stars, unchanged hero/gates, reload/sync, keyboard, 5 layouts and play limit`);
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
