// Picture-supported questions for ages 5–6. No phonics words or tiers are
// changed. The ordinary dialog supplies rewards, retries and play limits.
const MathQuiz = (()=>{
  let banks=null;
  const recent=new Map();
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const name=s=>I18n.t(`math.shape.${s}`);
  function shape(s,color='#9fc9c0',rotate=0,edges=false) {
    const d=MATH_SHAPES[s],label=esc(name(s));
    let body=s==='circle'?'<circle cx="50" cy="50" r="35"/>':s==='oval'?'<ellipse cx="50" cy="50" rx="40" ry="25"/>':`<polygon points="${d.points.map(p=>p.join(',')).join(' ')}"/>`;
    if(edges&&d.points)body+=d.points.map(([x,y],i)=>{
      const [nx,ny]=d.points[(i+1)%d.points.length],mx=(x+nx)/2,my=(y+ny)/2;
      return `<circle cx="${mx}" cy="${my}" r="4" fill="#fff9dc"/><text x="${50+(mx-50)*.67}" y="${54+(my-50)*.67}" fill="#544c67" stroke="none" text-anchor="middle" font-size="12">${i+1}</text>`;
    }).join('');
    return `<svg class="math-shape" viewBox="0 0 100 100" role="img" aria-label="${label}"><g transform="rotate(${rotate} 50 50)" fill="${color}" stroke="#69607a" stroke-width="3" stroke-linejoin="round">${body}</g></svg>`;
  }
  // Groups of ten always use the same two rows of five. Remaining places
  // stay empty, so 23 is visibly two tens and three ones.
  function frames(n,removed=0,type='cookie') {
    const size=Math.max(1,Math.ceil(n/10)),filled=n-removed;
    return `<div class="math-frames" aria-label="${esc(I18n.t('math.objects',n))}">${Array.from({length:size},(_,f)=>`<div class="math-ten">${Array.from({length:10},(_,i)=>{
      const at=f*10+i;return `<i class="math-dot${at<n?' filled':''}${at>=filled&&at<n?' removed':''}" aria-hidden="true">${at<n?MathPlay.token(type):''}</i>`;
    }).join('')}</div>`).join('')}</div>`;
  }
  const equation=s=>`<div class="math-equation">${s}</div>`;
  function sequence(a,gap,answer=false) {
    return `<div class="math-sequence">${a.map((v,i)=>`<span class="${i===gap?'gap':''}">${i===gap&&!answer?'?':v}</span>`).join('<b aria-hidden="true">→</b>')}</div>`;
  }
  function bank() {
    if(banks)return banks;banks=Object.fromEntries(MATH_TOPICS.map(t=>[t.kind,[]]));
    const add=(topic,id,answer,p={},min=1)=>{
      const t=mathTopic(topic);banks[t.kind].push({id:`${t.kind}:${id}`,topic,kind:t.kind,answer,p,min});
    };
    for(let n=1;n<=30;n++)add(n<=10?'count10':n<=20?'count20':'count30',n,n,{n});
    for(let a=0;a<=9;a++)for(let b=0;b<=9;b++){
      if(a+b<=10)add('add',`${a}+${b}`,a+b,{a,b},!a||!b?3:a+b<=5?1:2);
      if(a>=1&&b<=a)add('subtract',`${a}-${b}`,a-b,{a,b},!b?3:a<=5?1:2);
    }
    for(let a=0;a<=24;a++)for(const gap of [2,3])add('skip2',`${a}.${gap}`,a+gap*2,{a,gap,seq:[a,a+2,a+4,a+6]},a%2?3:a+6<=10&&gap===3?1:2);
    for(let a=0;a<30;a++)for(let b=a+1;b<=30;b++)for(const more of [true,false])add('compare',`${a}.${b}.${more?1:0}`,more?b:a,{a,b,more},b<=10?1:b<=20?2:3);
    for(let a=1;a<=28;a++)for(let gap=0;gap<3;gap++)add('missing',`${a}.${gap}`,a+gap,{a,gap,seq:[a,a+1,a+2]},a+2<=10?1:a+2<=20?2:3);
    for(const s of MATH_BASIC_SHAPES){
      const min=MATH_BASIC_SHAPES.indexOf(s)<3?1:s==='star'?3:2;
      add('shapeName',s,s,{s},min);add('sameShape',s,s,{s},min);
    }
    for(const s of ['triangle','square','rectangle','pentagon','hexagon'])add('sides',s,MATH_SHAPES[s].sides,{s},MATH_SHAPES[s].sides<=4?1:MATH_SHAPES[s].sides-3);
    for(const a of MATH_BASIC_SHAPES)for(const b of MATH_BASIC_SHAPES)if(a!==b){
      add('pattern',`${a}.${b}.ab`,b,{a,b,seq:[a,b,a,b,a,b]},[a,b].every(s=>MATH_BASIC_SHAPES.indexOf(s)<3)?1:2);
      add('pattern',`${a}.${b}.aab`,b,{a,b,seq:[a,a,b,a,a,b]},3);
    }
    return banks;
  }
  const isKind=k=>MATH_TOPICS.some(t=>t.kind===k);
  function skill(kind) {
    state.skill=state.skill||{};
    let k=state.skill[kind];
    if(!k||typeof k!=='object'||Array.isArray(k))k=state.skill[kind]={t:1,best:1,w:[],last:[],n:0};
    k.t=Math.max(1,Math.min(3,Number(k.t)||1));k.w=Array.isArray(k.w)?k.w:[];k.last=Array.isArray(k.last)?k.last:[];return k;
  }
  function setTier(kind,t) {
    const k=skill(kind);Object.assign(k,{t:Math.max(1,Math.min(3,t)),w:[],last:[],n:(k.n||0)+1,set:Math.max(Date.now(),(k.set||0)+1)});
    k.best=Math.max(k.t,k.best||1);
  }
  function options(entry,tier) {
    const {answer,topic,p}=entry;
    if(topic==='compare')return shuffle([p.a,p.b]);
    const shapes=typeof answer==='string';
    const lo=topic==='count10'?1:topic==='count20'?11:topic==='count30'?21:0;
    const hi=['count10','add','subtract'].includes(topic)?10:topic==='count20'?20:topic==='sides'?8:30;
    const pool=shapes?MATH_BASIC_SHAPES:Array.from({length:hi-lo+1},(_,i)=>i+lo);
    const others=pool.filter(v=>v!==answer);
    if(!shapes)others.sort((a,b)=>Math.abs(a-answer)-Math.abs(b-answer)||a-b);
    const wrong=shapes?shuffle(others).slice(0,tier<3?2:3):shuffle(others.slice(0,7)).slice(0,tier<3?2:3);
    return shuffle([answer,...wrong]);
  }
  function prompt(e) {
    if(e.topic==='shapeName')return I18n.t('math.ask.shapeName',name(e.answer));
    if(e.topic==='compare')return I18n.t(e.p.more?'math.ask.more':'math.ask.less');
    return I18n.t(`math.ask.${e.topic}`);
  }
  function clue(e,hint=false,solved=false) {
    const p=e.p,a=e.answer;
    if(e.topic.startsWith('count'))return frames(p.n)+(hint?`<p class="math-support">${esc(I18n.t('math.help.tens'))}</p>`:'');
    if(e.topic==='add')return equation(`${p.a} + ${p.b} = ${solved?a:'?'}`)+(hint?frames(p.a+p.b,0,'scoop'):`<div class="math-groups">${frames(p.a,0,'scoop')}<b>+</b>${frames(p.b,0,'scoop')}</div>`);
    if(e.topic==='subtract')return equation(`${p.a} − ${p.b} = ${solved?a:'?'}`)+frames(p.a,p.b,'scoop');
    if(e.topic==='skip2'||e.topic==='missing')return sequence(p.seq,p.gap,solved)+(hint?`<p class="math-support">${esc(I18n.t(e.topic==='skip2'?'math.help.two':'math.help.order'))}</p>`:'');
    if(e.topic==='compare')return `<div class="math-compare"><section>${MathPlay.toy(0)}${equation(p.a)}${frames(p.a,0,'coin')}</section><section>${MathPlay.toy(1)}${equation(p.b)}${frames(p.b,0,'coin')}</section></div>`;
    if(e.topic==='shapeName')return `<div class="math-shape-word">${esc(name(a))}</div>`+(hint?`<p class="math-support">${esc(I18n.t('math.help.shapeName'))}</p>`:'');
    if(e.topic==='sameShape')return shape(p.s,'#e8b08d',0)+(hint?`<p class="math-support">${esc(I18n.t('math.help.sameShape'))}</p>`:'');
    if(e.topic==='sides')return shape(p.s,'#aeb7db',0,hint||solved);
    return `<div class="math-pattern">${p.seq.map((s,i)=>i===5&&!solved?'<span class="math-shape-gap">?</span>':shape(s,MATH_COLORS[MATH_BASIC_SHAPES.indexOf(s)])).join('')}</div>`+(hint?`<p class="math-support">${esc(I18n.t('math.help.pattern'))}</p>`:'');
  }
  function solution(e) {
    if(e.topic==='add')return `${e.p.a} + ${e.p.b} = ${e.answer}`;
    if(e.topic==='subtract')return `${e.p.a} − ${e.p.b} = ${e.answer}`;
    return I18n.t('math.solution',typeof e.answer==='string'?name(e.answer):e.answer);
  }
  function build(e,tier,retry=false) {
    const shapeChoices=typeof e.answer==='string';
    const vals=options(e,tier);
    const q={id:e.id,kind:e.kind,math:true,entry:e,target:String(e.answer),tier,retry,done:false,misses:0,counts:!retry,
      prompt:prompt(e),clue:clue(e),solved:clue(e,false,true),ask:[...MathSpeech.question(e),Quiz.READY],replay:MathSpeech.question(e),answer:MathSpeech.expression(e,true),
      helpText:I18n.t(`math.help.${e.topic.startsWith('count')?'tens':e.topic==='skip2'?'two':e.topic==='missing'?'order':e.topic==='compare'?'compare':e.topic}`),
      solutionText:solution(e),model:MathSpeech.expression(e,true),teach:()=>[],picked:()=>[],
      options:vals.map((v,i)=>({right:v===e.answer,wrong:String(v),
        label:shapeChoices?name(v):String(v),html:shapeChoices?shape(v,MATH_COLORS[(i+2)%MATH_COLORS.length],e.topic==='sameShape'&&v!=='oval'?20:0):`<span class="math-number">${v}</span>`})),
    };return q;
  }
  function make(npc,force={}) {
    const topic=mathTopic(npc.mathTopic),k=skill(topic.kind),tier=Math.max(1,Math.min(3,force.tier||k.t));
    let list=bank()[topic.kind].filter(e=>e.min<=tier);
    const hist=state.history||{},untried=list.filter(e=>!hist[e.id]?.right),last=recent.get(topic.kind)||[];
    if(untried.length)list=untried;
    const fresh=list.filter(e=>!last.includes(e.id));if(fresh.length)list=fresh;
    const e=list[Math.floor(Math.random()*list.length)];recent.set(topic.kind,[...last,e.id].slice(-4));return build(e,tier);
  }
  function again(old) { return build(old.entry,old.tier,true); }
  function record(q,right) {
    if(q.recorded)return;q.recorded=true;
    const h=state.history[q.id]||(state.history[q.id]={kind:q.kind,tries:0,right:0,wrong:0,last:0});
    h.tries++;h.last=Date.now();if(right&&!q.retry&&!q.misses)h.right++;else if(!right)h.wrong++;
    if(q.retry)return;
    const k=skill(q.kind),ok=right&&!q.misses;k.n=(k.n||0)+1;k.w.push(ok?1:0);k.w=k.w.slice(-6);k.last.push(ok?1:0);k.last=k.last.slice(-6);
    if(k.t<3&&k.w.length>=3&&k.w.slice(-3).every(Boolean)){k.t++;k.w=[];if(k.t>(k.best||1)){k.best=k.t;q.levelUp=true;}}
    else if(k.t>1&&k.w.length>=2&&k.w.slice(-2).every(x=>!x)){k.t--;k.w=[];}
  }
  function showHint(q) {
    if(!q||!q.math)return;Sound.tap();
    ui.clue.innerHTML=clue(q.entry,true,q.reveal||q.done);ui.text.textContent=q.reveal||q.done?q.solutionText:q.helpText;
    const parts=q.reveal||q.done?q.answer:MathSpeech.hint(q.entry);
    if(q.done)Sound.say(parts,voiceOf(state.talking));else listen(q,parts,10000);
  }
  function label(id) {
    const e=Object.values(bank()).flat().find(e=>e.id===id);
    return e?`${I18n.t(`math.topic.${e.topic}`)} · ${solution(e)}`:id;
  }
  function pickTopic(npc){
    const pool=npc.mathTopics.filter(key=>key!==npc.mathLastTopic);
    const choices=pool.length?pool:npc.mathTopics;
    npc.mathTopic=choices[Math.floor(Math.random()*choices.length)];npc.mathLastTopic=npc.mathTopic;
  }
  return{pickTopic,make,again,record,isKind,skill,setTier,tierMax:k=>isKind(k)?3:0,pool:k=>(bank()[k]||[]).map(e=>e.id),bank,shape,frames,clue,label,showHint};
})();
