// Exhaustive answer invariants, then real village/dialog/reward/save flows.
const assert=require('node:assert/strict');
const path=require('node:path');
const {launch}=require('./browser');
const {hiddenVillagers}=require('./scene-visibility');
(async()=>{
  const browser=await launch();
  try{
    for(const language of ['en','ko'])for(const edition of ['princess','captain']){
      const page=await browser.newPage({viewport:{width:1180,height:820}}),errors=[];
      page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
      const url=`file://${path.join(__dirname,'..','index.html')}?guest&language=${language}&edition=${edition}&halloween=0`;
      await page.goto(url);await page.evaluate(()=>{Sound.say=parts=>{for(const p of parts)if(p.call&&!state.question?.done)p.call();};ui.startBtn.click();state.guide={step:3};});
      const bank=await page.evaluate(()=>{
        const errors=[],ids=new Set(),counts={};let questions=0;
        for(const topic of MATH_TOPICS){
          const entries=MathQuiz.bank()[topic.kind];counts[topic.key]=entries.length;
          for(let tier=1;tier<=3;tier++)if(!entries.some(e=>e.min<=tier))errors.push(`${topic.key}: empty tier ${tier}`);
          for(const e of entries){
            questions++;if(ids.has(e.id))errors.push(`duplicate ${e.id}`);ids.add(e.id);
            let expected;
            const p=e.p;
            if(e.topic.startsWith('count'))expected=p.n;
            else if(e.topic==='add')expected=p.a+p.b;
            else if(e.topic==='subtract')expected=p.a-p.b;
            else if(e.topic==='compare')expected=p.more?Math.max(p.a,p.b):Math.min(p.a,p.b);
            else if(e.topic==='missing')expected=p.seq[p.gap];
            else if(e.topic==='skip2'){
              expected=p.seq[p.gap];if(!p.seq.every((n,i)=>i===0||n-p.seq[i-1]===2))errors.push(`not by twos: ${e.id}`);
            }else if(e.topic==='sides')expected=MATH_SHAPES[p.s].points.length;
            else if(e.topic==='pattern')expected=p.seq[p.seq.length-1];
            else expected=p.s;
            if(e.answer!==expected)errors.push(`wrong answer: ${e.id}`);
            if(typeof e.answer==='number'&&(e.answer<0||e.answer>30))errors.push(`outside 0–30: ${e.id}`);
            if(['add','subtract'].includes(e.topic)&&(p.a>9||p.b>9||e.answer>10))errors.push(`arithmetic too hard: ${e.id}`);
            const q=MathQuiz.again({entry:e,tier:3}),right=q.options.filter(o=>o.right);
            if(right.length!==1||right[0].wrong!==String(expected)||new Set(q.options.map(o=>o.wrong)).size!==q.options.length)errors.push(`ambiguous choices: ${e.id}`);
            const range=e.topic==='count10'?[1,10]:e.topic==='count20'?[11,20]:e.topic==='count30'?[21,30]:['add','subtract'].includes(e.topic)?[0,10]:null;
            if(range&&q.options.some(o=>Number(o.wrong)<range[0]||Number(o.wrong)>range[1]))errors.push(`choices outside this lesson: ${e.id}`);
            if(e.topic.startsWith('count')){
              const d=document.createElement('div');d.innerHTML=q.clue;
              if(d.querySelectorAll('.filled').length!==expected)errors.push(`wrong picture count: ${e.id}`);
            }
          }
        }
        return{errors,questions,counts,stats:PARENT_KINDS.filter(([k])=>MathQuiz.isKind(k)).length};
      });
      assert.deepEqual(bank.errors,[]);assert.equal(Object.keys(bank.counts).length,12);assert.equal(bank.stats,12);
      assert.equal(bank.counts.count10,10);assert.equal(bank.counts.count20,10);assert.equal(bank.counts.count30,10);
      await page.evaluate(()=>{state.stars=0;followLink(sceneFor('town').links.find(l=>l.target==='math'));});
      await page.waitForFunction(()=>state.scene===sceneFor('math')&&!ui.fade.classList.contains('on'));
      const visible=(await page.evaluate(hiddenVillagers)).filter(n=>n.scene==='math');
      assert.equal(visible.length,5);assert.ok(visible.every(n=>n.cover<=5),JSON.stringify(visible));
      // The physical teaching station walks to its own tutor and opens math.
      await page.evaluate(()=>{
        const sc=state.scene,n=mathHostFor(sc,'add');n.mathTopics=['add'];placeHero(n.c-1,n.r);snapCamera();
        tapObject(sc.objects.find(o=>o.mathHost===n),0,0,true);
      });
      await page.waitForFunction(()=>state.question?.math&&!ui.dialog.classList.contains('hidden'));
      assert.equal(await page.evaluate(()=>state.question.kind),'mathAdd');
      const before=await page.evaluate(()=>({stars:state.stars,stickers:Object.keys(state.stickers).length,id:state.question.id}));
      await page.locator('#dlg-math-hint').click();assert.ok(await page.locator('#dlg-text').innerText());
      const wrong=await page.evaluate(()=>state.question.options.findIndex(o=>!o.right));
      await page.locator('#dlg-choices .choice').nth(wrong).click();
      assert.equal(await page.evaluate(()=>state.question.reveal||false),false);
      const nextWrong=await page.evaluate(()=>state.question.options.findIndex((o,i)=>!o.right&&!ui.choices.children[i].disabled));
      await page.locator('#dlg-choices .choice').nth(nextWrong).click();
      assert.equal(await page.evaluate(()=>state.question.reveal),true);
      let right=await page.evaluate(()=>state.question.options.findIndex(o=>o.right));
      await page.locator('#dlg-choices .choice').nth(right).click();
      assert.equal(await page.evaluate(()=>state.stars),before.stars,'Shown answer pays no star');
      assert.equal(await page.evaluate(()=>state.history[state.question.id].wrong),1);
      assert.equal(await page.evaluate(()=>state.history[state.question.id].completed||0),0,'A shown answer earns no toy order');
      // Missed question comes back with the same mathematical target.
      assert.ok(await page.evaluate(()=>{
        const npc=state.talking,old=state.question;closeDialog();npc.missedDue=0;openDialog(npc);
        return state.question.id===old.id&&state.question.retry;
      }));
      await page.evaluate(()=>{closeDialog();state.gifts=0;const n=mathHostFor(state.scene,'add');n.mathTopics=['add'];n.missed=null;openDialog(n);});
      right=await page.evaluate(()=>state.question.options.findIndex(o=>o.right));
      await page.locator('#dlg-choices .choice').nth(right).click();
      const earned=await page.evaluate(()=>({stars:state.stars,stickers:Object.keys(state.stickers).length,id:state.question.id,stats:parentKindStats('mathAdd')}));
      assert.equal(earned.stars,before.stars+1);assert.equal(earned.stickers,before.stickers);assert.ok(earned.stats.tries>=1);
      await page.evaluate(right=>choose(right,ui.choices.children[right]),right);assert.equal(await page.evaluate(()=>state.stars),earned.stars);
      // Learning and a parent's explicit level change survive save/reload.
      await page.evaluate(()=>{
        closeDialog();MathQuiz.setTier('mathAdd',1);
        for(let i=0;i<3;i++){const q=MathQuiz.make({mathTopic:'add'});reviewRecord(q,true);}
        if(MathQuiz.skill('mathAdd').t!==2)throw Error('three correct should move up');
        MathQuiz.setTier('mathCount30',3);save();
      });
      await page.reload();
      assert.ok(await page.evaluate(id=>state.history[id]?.right>0&&state.history[id]?.completed===1,earned.id));
      assert.equal(await page.evaluate(()=>MathQuiz.skill('mathAdd').t),2);
      assert.equal(await page.evaluate(()=>MathQuiz.skill('mathCount30').t),3);
      // Each visit supplies one random question without a topic selector.
      await page.evaluate(()=>{Sound.say=parts=>{for(const p of parts)if(p.call&&!state.question?.done)p.call();};ui.startBtn.click();state.guide={step:3};state.scene=sceneFor('math');placeHero(MATH_START.c,MATH_START.r);});
      const rotation=await page.evaluate(()=>{
        const errors=[];
        for(const shop of MATH_SHOPS){
          const n=state.scene.npcs.find(n=>n.mathShop===shop.key),seen=new Set();let last=null;
          for(let i=0;i<50;i++){
            closeDialog();openDialog(n);const key=state.question.entry.topic;seen.add(key);
            if(!shop.topics.includes(key))errors.push(`${shop.key}: unrelated question`);
            if(shop.topics.length>1&&key===last)errors.push(`${shop.key}: immediately repeated topic`);
            if(document.querySelectorAll('#math-extras > button:not(.math-board)').length)errors.push('Topic selector remains');
            if(document.querySelectorAll('#dlg-choices .choice').length!==state.question.options.length)errors.push('More than one question');
            last=key;
          }
          if(seen.size!==shop.topics.length)errors.push(`${shop.key}: missing question types`);
        }
        closeDialog();return errors;
      });
      assert.deepEqual(rotation,[]);
      // A station button boards without spending stars, tracks the passenger,
      // freezes under pause/sleep, and returns safely after exactly one lap.
      const fare=await page.evaluate(()=>{closeDialog();placeHero(19,35);openDialog(mathHostFor(state.scene,'skip2'));return state.stars;});
      await page.locator('#math-extras .math-board').click();
      await page.waitForFunction(()=>state.mathRide);
      const trip=await page.evaluate(()=>{
        const tr=state.scene.mathTrain,start={c:state.hero.c,r:state.hero.r};
        for(let i=0;i<80;i++)MathTrain.tick(.1);
        const moved=Math.hypot(state.hero.c-start.c,state.hero.r-start.r)>4,passenger=tr.cars[1].position;
        const follows=Math.hypot(state.hero.c-passenger.c,state.hero.r-passenger.r)<.001;
        setPaused(true);const d=tr.distance;MathTrain.tick(.1);const paused=tr.distance===d;setPaused(false);
        guide.asleep=true;MathTrain.tick(.1);const sleeping=tr.distance===d;guide.asleep=false;
        for(let i=0;i<1000&&state.mathRide;i++)MathTrain.tick(.1);
        return{moved,follows,paused,sleeping,returned:!state.mathRide&&!state.busy&&state.hero.c===MATH_START.c&&state.hero.r===MATH_START.r,stars:state.stars};
      });
      assert.deepEqual(trip,{moved:true,follows:true,paused:true,sleeping:true,returned:true,stars:fare});
      await page.evaluate(()=>{placeHero(19,35);openDialog(mathHostFor(state.scene,'skip2'));});
      await page.locator('#math-extras .math-board').click();await page.waitForFunction(()=>state.mathRide);
      await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>state.mathRide),false);
      assert.equal(await page.locator('#math-ride').isVisible(),false);
      assert.equal(await page.evaluate(()=>state.stars),fare);
      // An occupied boarding tile (such as a parked ride) still leaves other
      // platform tiles available. Reduced motion stops ambient trips only.
      await page.evaluate(()=>{
        placeHero(17,35);window.mathBoardBlocker=makeNpc({who:I18n.t('math.shop.station'),look:state.scene.npcs[0].look,c:19,r:35},null);
        state.scene.npcs.push(window.mathBoardBlocker);MathTrain.requestRide();
      });
      await page.waitForFunction(()=>state.mathRide);
      await page.evaluate(()=>{state.scene.npcs=state.scene.npcs.filter(n=>n!==window.mathBoardBlocker);delete window.mathBoardBlocker;});
      await page.keyboard.press('Escape');
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.ok(await page.evaluate(()=>{const tr=state.scene.mathTrain,d=tr.distance;MathTrain.tick(.1);return tr.distance===d;}));
      await page.evaluate(()=>{placeHero(19,35);openDialog(mathHostFor(state.scene,'skip2'));});
      await page.locator('#math-extras .math-board').click();await page.waitForFunction(()=>state.mathRide);
      assert.ok(await page.evaluate(()=>{const tr=state.scene.mathTrain,d=tr.distance;MathTrain.tick(.1);return tr.distance>d;}));
      await page.keyboard.press('Escape');await page.emulateMedia({reducedMotion:'no-preference'});
      // Nine distinct successful orders fill the shelf; syncing an older save
      // and reloading cannot erase the toys or count a completed order twice.
      await page.evaluate(()=>{
        closeDialog();
        for(const t of MATH_TOPICS.slice(0,9)){
          const n={...mathHostFor(state.scene,t.key),mathTopics:[t.key],missed:null};n.mathTopic=t.key;state.gifts=0;openDialog(n);
          const q=state.question,i=q.options.findIndex(o=>o.right);choose(i,ui.choices.children[i]);
          if(!ui.clue.querySelector('.math-order-done'))throw Error('The order should visibly finish');closeDialog();
        }
        if(MathPlay.completed()<9)throw Error('Successful orders should fill the shelf');
        const old={edition:EDITION,history:{}};
        const merged=Progress.merge({edition:EDITION,history:state.history},old,'theirs');
        if(Object.values(merged.history).filter(h=>h.completed===1).length!==MathPlay.completed())throw Error('Sync lost the shelf');
        save();
      });
      await page.reload();
      assert.ok(await page.evaluate(()=>MathPlay.completed()>=9));
      const shelf=await page.evaluate(()=>{const d=document.createElement('div');d.innerHTML=MathPlay.collection();return d.querySelectorAll('.earned').length;});
      assert.equal(shelf,3,'All three earned toys survive reload');
      // Representative mobile/landscape layouts keep every answer in the card.
      for(const size of [{width:375,height:667},{width:812,height:375}]){
        await page.setViewportSize(size);
        await page.evaluate(()=>{Sound.say=parts=>{for(const p of parts)if(p.call&&!state.question?.done)p.call();};ui.startBtn.click();state.guide={step:3};state.scene=sceneFor('math');});
        for(const key of ['count30','compare','add','sides','pattern']){
          await page.evaluate(key=>{closeDialog();MathQuiz.setTier(mathTopic(key).kind,3);const n={...mathHostFor(state.scene,key),mathTopics:[key]};openDialog(n);},key);
          await page.waitForTimeout(280);
          const layout=await page.evaluate(()=>{
            const box=ui.dialog.getBoundingClientRect();return{fits:box.left>=-1&&box.right<=innerWidth+1&&box.bottom<=innerHeight+1,
              noSideScroll:ui.dialog.scrollWidth<=ui.dialog.clientWidth+1,
              cards:[...ui.choices.children].every(b=>b.getBoundingClientRect().width>=40)};
          });
          assert.ok(layout.fits&&layout.noSideScroll&&layout.cards,`${edition}/${language}/${size.width}/${key}: ${JSON.stringify(layout)}`);
        }
      }
      assert.ok(await page.evaluate(()=>{
        closeDialog();state.scene=sceneFor('town');openDialog(state.scene.npcs.find(n=>!n.shop&&!n.salon&&!n.nailSalon));
        const good=!state.question.math&&!ui.dialog.classList.contains('math-dialog')&&document.getElementById('dlg-replay').textContent==='🔊';
        closeDialog();return good;
      }),'Returning to phonics restores the ordinary question and replay button');
      assert.deepEqual(errors,[]);await page.close();
      console.log(`PASS math/${edition}/${language}: ${bank.questions} exact questions, 5 accessible shops / 12 activities, hints/retries/rewards, saved levels/history, random visits without topic tabs, free train ride/pause/return, phone/landscape cards`);
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
