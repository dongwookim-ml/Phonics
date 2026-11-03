// Play the park interactions, fishing entry and collectible X-word page.
const assert=require('node:assert/strict');
const path=require('node:path');
const {launch}=require('./browser');
const {hiddenVillagers}=require('./scene-visibility');
(async()=>{
  const browser=await launch();
  try{
    for(const language of ['en','ko']){
      const page=await browser.newPage({viewport:{width:1180,height:820}}),errors=[];
      page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
      await page.goto(`file://${path.join(__dirname,'..','index.html')}?guest&language=${language}&halloween=0`);
      await page.evaluate(()=>{Sound.say=()=>{};ui.startBtn.click();state.guide={step:3};state.scene=sceneFor('riverside');placeHero(8,7);snapCamera();});
      const click=await page.evaluate(()=>{
        const sc=state.scene,o=sc.objects.find(o=>o.parkProp==='swing');
        const p=tileCenter(sc,(o.c0+o.c1)/2,(o.r0+o.r1)/2),x=p.x-15,y=p.y-36;
        const box=screen.getBoundingClientRect();
        return{x:box.left+(x-Math.round(state.cam.x))*state.scale*box.width/screen.width,
          y:box.top+(y-Math.round(state.cam.y))*state.scale*box.height/screen.height};
      });
      await page.mouse.click(click.x,click.y);
      const park=await page.evaluate(()=>{
        const sc=state.scene,swing=sc.objects.find(o=>o.parkProp==='swing');
        const animation=!!swing.touchedAt&&Math.abs(riverSwingAngle(swing.touchedAt/1000+.3,swing.touchedAt))>.1&&riverSwingAngle(swing.touchedAt/1000+8,swing.touchedAt)===0;
        const ducks=[0,.15,.3];let water=true,space=true;
        for(let t=0;t<30;t+=.5){
          const points=ducks.map(d=>riverDuckAt(sc,t,d));
          water=water&&points.every(p=>{const a=worldToTile(sc,p.x,p.y);return tileAt(sc,a.c,a.r).type==='water';});
          space=space&&points.every((a,i)=>points.every((b,j)=>i===j||Math.hypot(a.x-b.x,a.y-b.y)>8));
        }
        return{animation,water,space,homes:sc.doors.filter(d=>d.obj?.house).length,
          props:['slide','sandpit','bench','basket','apple-tree','butterfly','dock','duck','duckling','fish'].every(k=>sc.objects.some(o=>o.parkProp===k))};
      });
      assert.ok(park.animation,'A real tap starts and then settles the swing');
      assert.ok(park.water&&park.space&&park.props,JSON.stringify(park));assert.equal(park.homes,14);
      const fisher=(await page.evaluate(hiddenVillagers)).filter(n=>n.scene==='riverside');
      assert.equal(fisher.length,1);assert.ok(fisher[0].cover<=5,JSON.stringify(fisher));
      assert.ok(await page.evaluate(()=>{const n=state.scene.npcs.find(n=>n.riverFisher);placeHero(14,11);return miniGo(n);}));
      await page.waitForFunction(()=>!mini.el.classList.contains('hidden'));
      assert.equal(await page.evaluate(()=>mini.game===MINI_GAMES.riverFish),true);
      await page.evaluate(()=>closeMini());
      for(const edition of ['princess','captain']){
        if(edition==='captain'){
          await page.goto(`file://${path.join(__dirname,'..','index.html')}?guest&edition=captain&language=${language}`);
          await page.evaluate(()=>{Sound.say=()=>{};ui.startBtn.click();});
        }
        const album=await page.evaluate(()=>{
          state.busy=false;state.stickers={};
          // The two X words are available in ordinary sticker packs.
          for(const x of albumWords())if(x.L!=='X')state.stickers[x.w]={e:x.e,n:1,at:1};
          stickerPack();albumSkip();albumTab='X';openAlbum();
          const said=[],before=Sound.say;Sound.say=parts=>said.push(...parts.filter(p=>p.text).map(p=>p.text));
          for(const x of albumAll().filter(x=>x.L==='X'))stickerTap(document.createElement('button'),x,true);
          Sound.say=before;
          const result={tabs:albumUi.tabs.querySelectorAll('.al-tab:not(.medal-tab)').length,
            words:[...albumUi.page.querySelectorAll('.w')].map(e=>e.textContent),art:albumUi.page.querySelectorAll('svg').length,
            collected:['xylophone','x-ray'].every(w=>!!state.stickers[w]),
            recorded:said.every(t=>Sound.hasClip(t)),plain:said.join('|')==='xylophone|x-ray',
            xSound:houseLetter('X').words.map(([w])=>w)};
          closeAlbum();return result;
        });
        assert.equal(album.tabs,26);assert.deepEqual(album.words,['xylophone','X-ray']);assert.equal(album.art,2);
        assert.ok(album.collected&&album.recorded&&album.plain);assert.deepEqual(album.xSound,['fox','box','six']);
        await page.reload();
        assert.ok(await page.evaluate(()=>['xylophone','x-ray'].every(w=>state.stickers[w]?.n===1)),'X stickers survive save/reload');
      }
      assert.deepEqual(errors,[]);await page.close();
      console.log(`PASS riverside/${language}: swing tap, separated swimming ducks, visible fisherman/fishing game, 14 homes; both editions: 26 sticker tabs, X art/recordings/pack/save`);
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
