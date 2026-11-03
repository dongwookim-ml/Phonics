// The default town's market, outer homes, visible villagers and shop entrances.
const assert = require('node:assert/strict');
const path = require('path');
const { launch } = require('./browser');
const { hiddenVillagers } = require('./scene-visibility');
(async () => {
  const browser = await launch();
  try {
    for (const language of ['en', 'ko']) {
      const page = await browser.newPage({ viewport: { width: 1180, height: 820 } }), errors=[];
      page.on('pageerror', e=>errors.push(e.message));
      await page.route(/^https?:/,r=>r.abort());
      await page.goto(`file://${path.join(__dirname,'..','index.html')}?guest&language=${language}&halloween=0`);
      const layout=await page.evaluate(()=>{
        Sound.say=()=>{}; ui.startBtn.click(); state.guide={step:3};
        const town=sceneFor('town'), stores=town.objects.filter(o=>o.market);
        return { stores:stores.map(o=>({kind:o.kind,near:Math.abs((o.c0+o.c1)/2-19.5)+Math.abs((o.r0+o.r1)/2-19.5)<=11})),
          houses:TOWN_HOUSES.length, compact:TOWN_HOUSES.every(h=>h.w===2&&h.d===2&&(h.scene==='town'||NEIGHBORHOODS[h.scene])),
          central:town.doors.filter(d=>d.obj?.house).map(d=>d.obj.house.letter),
          entrances:town.links.filter(l=>NEIGHBORHOODS[l.target]).map(l=>({c:l.c,r:l.r})),
          castle:{c:CASTLE_AT.c,r:CASTLE_AT.r},
          peopleClear:town.npcs.every(n=>!tileAt(town,n.c,n.r).blocked && !town.doors.some(d=>d.c===n.c && d.r===n.r)),
          forestShop:sceneFor('forest').objects.some(o=>o.kind==='shop') };
      });
      assert.deepEqual(layout.stores.map(s=>s.kind).sort(), ['nail-salon','salon','shop']);
      assert.ok(layout.stores.every(s=>s.near)); assert.equal(layout.houses,26);
      assert.ok(layout.compact && layout.peopleClear && layout.forestShop);
      assert.deepEqual(layout.central,[...'ABCDEFGHIJKL']);
      assert.equal(layout.entrances.length,2);
      assert.ok(layout.entrances.every(l=>l.c<layout.castle.c&&l.r<=layout.castle.r),'Entrance belongs above-left of the castle');
      const districts=await page.evaluate(()=>Object.keys(NEIGHBORHOODS).map(key=>{
        const sc=sceneFor(key),doors=sc.doors.filter(d=>d.obj?.house);
        return {key,count:doors.length,words:doors.every(d=>reviewPool('word',{letter:d.obj.house.letter}).length>0),
          small:doors.every(d=>d.obj.c1-d.obj.c0===1&&d.obj.r1-d.obj.r0===1),
          route:sceneFor('town').links.filter(l=>l.target===key).every(l=>!l.needStars),
          water:sc.water.length,flowers:sc.tiles.flat().filter(t=>t.type==='flowers').length,
          namedOnly:sceneFor('town').signs.filter(s=>s.links?.some(l=>l.target===key)).every(s=>!/[A-Z][–-][A-Z]/.test(s.text))};
      }));
      assert.equal(districts.length,1);assert.ok(districts.every(d=>d.count===14&&d.words&&d.small&&d.route&&d.namedOnly));
      assert.ok(districts.find(d=>d.key==='riverside').water>0);
      const lessons=await page.evaluate(()=>TOWN_HOUSES.map(h=>{
        const npc=sceneFor(`house-${h.letter}`).npcs.find(n=>n.letter);
        const q=Quiz.make(npc,{kind:'word',tier:1});
        return {letter:h.letter,good:q.options.filter(o=>o.right).length===1&&houseLetter(h.letter).words.some(([w])=>w===q.target)&&
            (h.letter!=='X'||q.options.find(o=>o.right).html.includes('<span class="first">x</span>')),
          back:sceneFor(`house-${h.letter}`).returnTo.scene===h.scene};
      }));
      assert.equal(new Set(lessons.map(l=>l.letter)).size,26);assert.ok(lessons.every(l=>l.good&&l.back));
      const stickerAudio=await page.evaluate(()=>{
        const said=[],before=Sound.say;Sound.say=parts=>said.push(...parts.filter(p=>p.text).map(p=>p.text));
        for(const w of ['queen','quilt','umbrella','insect'])stickerTap(document.createElement('button'),{w,L:w[0].toUpperCase()},true);
        Sound.say=before;return said.every(text=>Sound.hasClip(text));
      });
      assert.ok(stickerAudio,'New word stickers should reuse recorded word clips');
      // Central homes return directly to town, at their own doors.
      for(const letter of ['A','K','L']){
        const door=await page.evaluate(letter=>{
          state.scene=sceneFor('town');const d=state.scene.doors.find(d=>d.obj?.house?.letter===letter);
          enterDoor(d);return{c:d.c,r:d.r};
        },letter);
        await page.waitForFunction(letter=>state.scene===sceneFor(`house-${letter}`)&&!ui.fade.classList.contains('on'),letter);
        await page.evaluate(()=>leaveRoom());
        await page.waitForFunction(()=>state.scene===sceneFor('town')&&!ui.fade.classList.contains('on'));
        assert.deepEqual(await page.evaluate(()=>heroTile()),door);
      }
      // Walk through the named gateway at zero stars, then enter and leave
      // the first/last houses. Returning must land at that home's own door.
      for(const key of Object.keys(await page.evaluate(()=>NEIGHBORHOODS))){
        await page.evaluate(key=>{
          state.scene=sceneFor('town');state.stars=0;
          const links=state.scene.links.filter(l=>l.target===key);
          placeHero(links[0].c,links[0].r+2);snapCamera();goLink(links,true);
        },key);
        await page.waitForFunction(key=>state.scene===sceneFor(key)&&!ui.fade.classList.contains('on'),key);
        for(const letter of ['M','Z']){
          const door=await page.evaluate(letter=>{
            const d=state.scene.doors.find(d=>d.obj.house.letter===letter);enterDoor(d);return{c:d.c,r:d.r};
          },letter);
          await page.waitForFunction(letter=>state.scene===sceneFor(`house-${letter}`)&&!ui.fade.classList.contains('on'),letter);
          await page.evaluate(()=>leaveRoom());
          await page.waitForFunction(key=>state.scene===sceneFor(key)&&!ui.fade.classList.contains('on'),key);
          assert.deepEqual(await page.evaluate(()=>heroTile()),door);
        }
        await page.evaluate(()=>followLink(state.scene.links[0]));
        await page.waitForFunction(()=>state.scene===sceneFor('town')&&!ui.fade.classList.contains('on'));
        assert.deepEqual(await page.evaluate(()=>heroTile()),await page.evaluate(key=>NEIGHBORHOODS[key].townReturn,key));
      }
      const visible=(await page.evaluate(hiddenVillagers)).filter(n=>n.scene==='town');
      assert.equal(visible.length,11);
      assert.ok(visible.every(n=>n.cover<=5),JSON.stringify(visible));
      // Every new storefront sign walks to its keeper and opens the proper card.
      for (const [kind,card] of [['shop','shop'],['salon','salon'],['nail-salon','nail-salon']]) {
        const tapped=await page.evaluate(kind=>{
          const sc=sceneFor('town'), o=sc.objects.find(o=>o.market && o.kind===kind), n=o.keeper;
          const spots=[[1,0],[0,1],[-1,0],[0,-1]].map(([dc,dr])=>({c:n.c+dc,r:n.r+dr}));
          const start=spots.find(p=>walkable(sc,p.c,p.r));
          state.scene=sc;placeHero(start.c,start.r);snapCamera();
          const sign=sc.signs.find(s=>s.shop===o);sc.signs.forEach(s=>{s.shown=null;});
          return tapOverlay(sc,sign.x,sign.y);
        },kind);
        assert.ok(tapped);await page.waitForFunction(id=>!document.getElementById(id).classList.contains('hidden'),card);
        await page.evaluate(kind=>{if(kind==='shop')closeShop();else if(kind==='salon')closeSalon();else closeNailSalon();},kind);
      }
      assert.deepEqual(errors,[]);
      console.log(`PASS town/${language}: three market shops, 12 central + 14 riverside homes, 11 visible villagers, 26 lessons/return doors, free castle-side gateway, sign entry`);
      await page.close();
    }
    const captain=await browser.newPage();await captain.route(/^https?:/,r=>r.abort());
    await captain.goto(`file://${path.join(__dirname,'..','index.html')}?guest&edition=captain`);
    assert.equal(await captain.evaluate(()=>TOWN_HOUSES.find(h=>h.letter==='A').r),11);
    assert.equal(await captain.evaluate(()=>sceneFor('town').objects.some(o=>o.market)),false);
    await captain.close();
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
