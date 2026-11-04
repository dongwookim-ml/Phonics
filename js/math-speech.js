// English lesson speech follows the other villages. Display text still uses
// the chosen interface language. Short number clips compose all 1,289 lessons.
const MathSpeech=(()=>{
  const text=(key,...values)=>PIXELTOWN_LOCALES.en[key].replace(/\{(\d+)\}/g,(m,i)=>i<values.length?String(values[i]):m);
  const host=t=>({text:t,plain:true,slow:.9}),narrator=t=>({text:String(t),narrator:true,plain:true,slow:.9});
  const hintKey=topic=>topic.startsWith('count')?'tens':topic==='skip2'?'two':topic==='missing'?'order':topic==='compare'?'compare':topic;
  function prompt(e){
    if(e.topic==='shapeName')return text('math.ask.shapeName',text(`math.shape.${e.answer}`));
    if(e.topic==='compare')return text(e.p.more?'math.ask.more':'math.ask.less');
    return text(`math.ask.${e.topic}`);
  }
  function expression(e,solved=false){
    const p=e.p;
    if(e.topic==='add'||e.topic==='subtract')return [narrator(p.a),narrator(text(e.topic==='add'?'math.speech.plus':'math.speech.minus')),narrator(p.b),...(solved?[narrator(text('math.speech.equals')),narrator(e.answer)]:[])];
    if((e.topic==='skip2'||e.topic==='missing')&&!solved)return p.seq.map((n,i)=>narrator(i===p.gap?text('math.speech.blank'):n));
    if(e.topic==='compare'&&!solved)return [narrator(text('math.toy.car')),narrator(p.a),{pause:180},narrator(text('math.toy.bear')),narrator(p.b)];
    if(solved)return [narrator(text('math.speech.answer')),narrator(typeof e.answer==='string'?text(`math.shape.${e.answer}`):e.answer)];
    return [];
  }
  function question(e){return [host(prompt(e)),...expression(e)];}
  const hint=e=>[host(text(`math.help.${hintKey(e.topic)}`))];
  const welcome=shop=>text(`math.speech.welcome.${shop}`);
  // This is also the recording plan, shared by the builder and browser audit.
  function phrases(){
    const out=new Map(),add=(voice,t,speed=.9)=>out.set(`${voice}|${t}`,{voice,text:t,speed});
    for(const shop of MATH_SHOPS){
      const v=VOICES[shop.look].tts;add(v,welcome(shop.key),.95);
      for(const topic of shop.topics){
        const examples=topic==='shapeName'?MATH_BASIC_SHAPES.map(answer=>({topic,answer})):topic==='compare'?[{topic,p:{more:true}},{topic,p:{more:false}}]:[{topic}];
        for(const e of examples)add(v,prompt(e));
        add(v,text(`math.help.${hintKey(topic)}`));
      }
    }
    for(let n=0;n<=30;n++)add(TTS_NARRATOR,String(n),.8);
    for(const key of ['plus','minus','equals','blank','answer'])add(TTS_NARRATOR,text(`math.speech.${key}`),.8);
    for(const s of MATH_BASIC_SHAPES)add(TTS_NARRATOR,text(`math.shape.${s}`),.8);
    for(const key of ['car','bear'])add(TTS_NARRATOR,text(`math.toy.${key}`),.8);
    return [...out.values()];
  }
  function clip(voice,t){return typeof MATH_AUDIO_INDEX!=='undefined'?MATH_AUDIO_INDEX[voice]?.[String(t).trim().replace(/\s+/g,' ')]:undefined;}
  return{question,hint,welcome,expression,phrases,clip};
})();
