// Clear instructions, accurate progress, readable phone layouts and local
// spoken goals, including robot-specific names and the once-only reward.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {launch}=require('./browser');
const root=path.join(__dirname,'..');
(async()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'audio/quests/manifest.json'),'utf8'));
  const clips=manifest.clips.map(c=>{
    assert.match(c.file,/^audio\/quests\/[a-f0-9]{20}\.m4a$/);
    const data=fs.readFileSync(path.join(root,c.file));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),c.sha256);
    assert.ok(c.seconds>=.18&&c.seconds<18&&c.rmsDb>-45);
    return{...c,data:data.toString('base64')};
  });
  const browser=await launch();
  try{
    for(const language of['en','ko'])for(const edition of['princess','captain']){
      const page=await browser.newPage({viewport:{width:1180,height:820}}),errors=[],live=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route(/^https?:/,r=>{if(r.request().url().includes('/tts?'))live.push(r.request().url());return r.abort();});
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.addInitScript(()=>{
        window.questPlayed=[];const play=HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play=function(){const src=this.src;this.playbackRate=8;this.addEventListener('playing',()=>window.questPlayed.push(src),{once:true});return play.call(this);};
      });
      await page.goto(`file://${path.join(root,'index.html')}?guest&language=${language}&edition=${edition}&halloween=0`);
      await page.locator('#start-btn').click({force:true});
      await page.evaluate(()=>{
        state.guide={step:3};state.stars=40;state.dust=12;
        const friend=Object.keys(FAIRIES).find(k=>k!=='none');state.outfit={...state.outfit,fairy:friend};state.owned.fairy.push(friend);state.friends={};
      });
      if(language==='en'&&edition==='princess'){
        const bad=await page.evaluate(async clips=>{
          const ac=new AudioContext(),bad=[];
          for(const c of clips){const bytes=Uint8Array.from(atob(c.data),x=>x.charCodeAt(0)),audio=await ac.decodeAudioData(bytes.buffer);let energy=0;for(const x of audio.getChannelData(0))energy+=x*x;
            if(audio.duration<.18||audio.duration>19||Math.sqrt(energy/audio.length)<.005)bad.push(c.text);}
          await ac.close();return bad;
        },clips);assert.deepEqual(bad,[]);
        const missing=await page.evaluate(()=>QuestSpeech.phrases().filter(p=>!Sound.hasClip(p.text,{tts:p.voice})).map(p=>p.text));assert.deepEqual(missing,[]);
      }
      // All goals are visible and clicking each icon plays the full English
      // instruction, without advancing the quest or buying anything.
      const kinds=await page.evaluate(()=>Object.keys(QUESTS));
      for(const kind of kinds){
        const before=await page.evaluate(kind=>{
          closeQuests();state.quests={day:questDay(),picks:[kind,'stars','book'].filter((k,i,a)=>a.indexOf(k)===i),got:{},chest:false};questUi.checked=state.quests;openQuests();
          const detail=QuestSpeech.details(kind),b=document.querySelector(`[data-quest="${kind}"]`);
          if(!b.querySelector('.qs-name').textContent||!b.querySelector('.qs-help').textContent||!b.getAttribute('aria-label').includes(detail.help))throw Error(`Missing instructions: ${kind}`);
          return{coins:state.coins,count:questCount(kind),file:QuestSpeech.clip(TTS_NARRATOR,QuestSpeech.instruction(kind)),played:window.questPlayed.length};
        },kind);
        assert.ok(before.file);
        await page.locator(`[data-quest="${kind}"] .ic`).click({force:true});
        await page.waitForFunction(({file,n})=>window.questPlayed.slice(n).some(src=>src.endsWith(file)),{file:before.file,n:before.played},{timeout:6000});
        const after=await page.evaluate(kind=>({coins:state.coins,count:questCount(kind)}),kind);
        assert.deepEqual(after,{coins:before.coins,count:before.count});
      }
      // The longest alternatives in each group must fit as real text, rather
      // than being clipped or replaced by icon-only controls on smaller screens.
      for(const [width,height]of[[1180,820],[375,667],[360,640],[844,390],[640,360]]){
        await page.setViewportSize({width,height});await page.waitForTimeout(80);
        for(const picks of[['stars','fish','house'],['gift','book','forest'],['sticker','feed','fairy'],['dust','book','unicorn'],['gift','fish','dungeon']]){
          const report=await page.evaluate(picks=>{
            closeQuests();state.quests={day:questDay(),picks,got:{},chest:false};questUi.checked=state.quests;openQuests();
            const card=questUi.box,box=card.getBoundingClientRect(),bad=[];
            if(box.left<0||box.right>innerWidth+1||box.top<0||box.bottom>innerHeight+1)bad.push('card outside screen');
            if(card.scrollWidth>card.clientWidth+1)bad.push('horizontal scroll');
            for(const task of card.querySelectorAll('.qs-quest')){
              const t=task.getBoundingClientRect();if(t.width<64||t.height<64)bad.push('small tap target');
              for(const child of task.querySelectorAll('.ic,.qs-copy,.qs-status,.qs-name,.qs-help')){
                const r=child.getBoundingClientRect();if(r.left<t.left-1||r.right>t.right+1||r.top<t.top-1||r.bottom>t.bottom+1)bad.push(`${task.dataset.quest}: ${child.className} clipped`);
                if(child.scrollWidth>child.clientWidth+1)bad.push(`${child.className} overflows`);
              }
            }
            return{bad,scroll:card.scrollHeight>card.clientHeight+1};
          },picks);
          assert.deepEqual(report.bad,[],`${language}/${edition}/${width}x${height}/${picks}`);
          if(width===375||width===844)assert.equal(report.scroll,false,`${language}/${edition}/${width}: unnecessary scrolling`);
        }
      }
      await page.setViewportSize({width:1180,height:820});
      const reward=await page.evaluate(()=>{
        closeQuests();const q=state.quests={day:questDay(),picks:['stars','fish','house'],got:{[Progress.device]:{stars:2}},chest:false};questUi.checked=q;openQuests();
        const row=questUi.list.querySelector('[data-quest="stars"]'),partial=row.querySelector('.qs-count').textContent;
        const labeled=partial===I18n.t('quest.progress',2,5)&&questUi.prize.textContent===I18n.t('quest.reward',QUEST_CHEST.coins);
        q.got[Progress.device]={stars:5,fish:3,house:1};renderQuests();
        const complete=questUi.list.querySelectorAll('.done').length===3&&questUi.chestAction.textContent===I18n.t('quest.chestReady');
        const coins=state.coins;questUi.chest.click();questUi.chest.click();questSkip();
        const paid=state.coins-coins,claimed=questUi.chestAction.textContent===I18n.t('quest.chestClaimed');closeQuests();
        return{labeled,complete,paid,claimed};
      });
      assert.deepEqual(reward,{labeled:true,complete:true,paid:5,claimed:true});
      assert.deepEqual(live,[]);assert.deepEqual(errors,[]);await page.close();
      console.log(`PASS quests/${edition}/${language}: 12 readable goals, icon speech, 5 screen sizes, progress and once-only reward`);
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
