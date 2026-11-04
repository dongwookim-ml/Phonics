// Math lessons must actually have playable local speech, without live TTS.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {launch}=require('./browser');
const root=path.join(__dirname,'..');
(async()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'audio/math/manifest.json'),'utf8'));
  const clips=manifest.clips.map(c=>{
    assert.match(c.file,/^audio\/math\/[a-f0-9]{20}\.m4a$/);
    const data=fs.readFileSync(path.join(root,c.file));
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'),c.sha256,`${c.text}: changed audio bytes`);
    assert.ok(c.seconds>=.18&&c.seconds<18&&c.rmsDb>-45,`${c.text}: silent or abnormal speech`);
    return{...c,data:data.toString('base64')};
  });
  const browser=await launch();
  try{
    const page=await browser.newPage({viewport:{width:1180,height:820}}),errors=[],live=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route(/^https?:/,r=>{if(r.request().url().includes('/tts?'))live.push(r.request().url());return r.abort();});
    await page.addInitScript(()=>{
      window.mathPlayed=[];
      const play=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(){
        const src=this.src;this.playbackRate=8;
        this.addEventListener('playing',()=>window.mathPlayed.push(src),{once:true});
        return play.call(this);
      };
    });
    await page.goto(`file://${path.join(root,'index.html')}?guest&language=ko&halloween=0`);
    await page.locator('#start-btn').click({force:true});
    const decoded=await page.evaluate(async clips=>{
      const ac=new AudioContext(),bad=[];
      for(const c of clips){
        const bytes=Uint8Array.from(atob(c.data),x=>x.charCodeAt(0)),audio=await ac.decodeAudioData(bytes.buffer);
        const samples=audio.getChannelData(0);let power=0;for(const x of samples)power+=x*x;
        if(audio.duration<.18||audio.duration>19||Math.sqrt(power/samples.length)<.005)bad.push(c.text);
      }
      await ac.close();return bad;
    },clips);
    assert.deepEqual(decoded,[],'Every cached math clip decodes to audible speech');
    const plan=await page.evaluate(()=>MathSpeech.phrases().map(p=>({voice:p.voice,text:p.text,file:MathSpeech.clip(p.voice,p.text)})));
    assert.equal(plan.length,clips.length);
    for(const p of plan)assert.ok(clips.some(c=>c.voice===p.voice&&c.text===p.text&&c.file===p.file),`Missing math recording: ${p.voice}/${p.text}`);
    // Every generated ask, model and answer uses recorded speech. An unsolved
    // counting question never reads its own answer aloud.
    const coverage=await page.evaluate(()=>{
      const bad=[];
      for(const entries of Object.values(MathQuiz.bank()))for(const entry of entries){
        const shop=mathShopFor(entry.topic),who=Sound.profile(VOICES[shop.look]);
        const q=MathQuiz.again({entry,tier:3});
        for(const p of [...q.ask,...q.replay,...q.model,...q.answer,...MathSpeech.hint(entry)])if(p?.text){
          const v=p.narrator?TTS_NARRATOR:who.tts;if(!Sound.hasClip(p.text,{tts:v}))bad.push(`${entry.id}: ${v}/${p.text}`);
        }
        if(entry.topic.startsWith('count')&&q.ask.some(p=>p?.text===String(entry.answer)))bad.push(`${entry.id}: answer spoiled`);
      }
      return bad;
    });
    assert.deepEqual(coverage,[]);
    await page.evaluate(()=>{state.guide={step:3};state.scene=sceneFor('math');placeHero(MATH_START.c,MATH_START.r);openDialog(state.scene.npcs.find(n=>n.mathShop==='bakery'));});
    assert.equal(await page.evaluate(()=>state.question.locked),true);
    await page.waitForFunction(()=>!state.question?.locked,undefined,{timeout:9000});
    assert.ok(await page.evaluate(()=>window.mathPlayed.some(src=>src.includes('/audio/math/'))),'The host actually plays local speech');
    const prompt=await page.evaluate(()=>MathSpeech.clip(voiceOf(state.talking).tts,state.question.replay[0].text));
    assert.ok(await page.evaluate(file=>window.mathPlayed.some(src=>src.endsWith(file)),prompt),'The actual question is heard');
    const beforeHint=await page.evaluate(()=>window.mathPlayed.length);
    await page.locator('#dlg-math-hint').click();
    await page.waitForFunction(n=>window.mathPlayed.length>n,beforeHint,{timeout:5000});
    await page.waitForFunction(()=>!state.question?.locked,undefined,{timeout:9000});
    const beforeReplay=await page.evaluate(()=>window.mathPlayed.length);
    await page.locator('#dlg-replay').click();
    await page.waitForFunction(n=>window.mathPlayed.length>n,beforeReplay,{timeout:5000});
    const answerClip=await page.evaluate(()=>{
      const q=state.question,file=MathSpeech.clip(TTS_NARRATOR,q.target),i=q.options.findIndex(o=>o.right);
      choose(i,ui.choices.children[i]);return file;
    });
    await page.waitForFunction(file=>window.mathPlayed.some(src=>src.endsWith(file)),answerClip,{timeout:6000});
    await page.evaluate(()=>{Sound.toggleMute();closeDialog();openDialog(state.scene.npcs.find(n=>n.mathShop==='workshop'));});
    assert.equal(await page.evaluate(()=>state.question.locked),false,'Mute never blocks answering');
    assert.deepEqual(live,[],'Math speech must work with the live server blocked');
    assert.deepEqual(errors,[]);
    console.log(`PASS ${clips.length} decoded local math clips; all 1,289 lessons covered; welcome/question/hint/replay/mute work without live TTS`);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
