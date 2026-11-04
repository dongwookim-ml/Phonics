// A closed scenic railway. Only the current village advances; pausing freezes
// both the train and its passenger. A ride is free and returns to the platform.
const MathTrain=(()=>{
  const route=[[19,36],[8,36],[3,31],[3,8],[8,3],[31,3],[36,8],[36,31],[31,36]],spacing=35,speed=59;
  const sprites=new Map();let rideBar;
  function position(tr,d){
    d=((d%tr.length)+tr.length)%tr.length;
    const s=tr.segments.find(s=>d<s.end)||tr.segments.at(-1),u=(d-s.start)/s.len;
    return{c:s.a.c+(s.b.c-s.a.c)*u,r:s.a.r+(s.b.r-s.a.r)*u,x:s.a.x+(s.b.x-s.a.x)*u,y:s.a.y+(s.b.y-s.a.y)*u,dx:(s.b.x-s.a.x)/s.len,dy:(s.b.y-s.a.y)/s.len};
  }
  function carSprite(p,i){
    const angle=Math.round(Math.atan2(p.dy,p.dx)*16/Math.PI),key=`${angle}:${i}`;
    if(sprites.has(key))return sprites.get(key);
    const cv=makeCanvas(94,92),g=cv.getContext('2d');g.translate(47,64);
    const a=angle*Math.PI/16,u={x:Math.cos(a),y:Math.sin(a)},v={x:-u.y*.58,y:u.x*.58};
    const point=(x,y,z=0)=>({x:u.x*x+v.x*y,y:u.y*x+v.y*y-z});
    const box=(x,y,w,d,z,h,col)=>{
      const q=[point(x-w/2,y-d/2,z),point(x+w/2,y-d/2,z),point(x+w/2,y+d/2,z),point(x-w/2,y+d/2,z)];
      // Far faces before near faces; every direction gets a solid volume.
      for(const j of[0,1,2,3].sort((j,k)=>(q[j].y+q[(j+1)%4].y)-(q[k].y+q[(k+1)%4].y))){
        const b=q[(j+1)%4],c=q[j];fillPoly(g,[c,b,{x:b.x,y:b.y-h},{x:c.x,y:c.y-h}],shade(col,j%2?-15:0));
      }
      fillPoly(g,q.map(p=>({x:p.x,y:p.y-h})),mix(col,'#fff7de',.28));
    };
    mathShopOval(g,0,4,27,9,'#9da78b66');
    for(const x of[-12,12])for(const y of[-11,11]){
      const p=point(x,y);mathShopOval(g,p.x,p.y,5,6,'#6c7373');mathShopOval(g,p.x,p.y,2,3,'#ddb888');
    }
    const col=['#91bfb3','#e9b6bd','#e5c789','#b5bedb'][i];
    box(0,0,33,22,3,8,col);
    if(i===0){
      box(-8,0,15,22,11,24,'#75a99f');box(-8,0,21,27,35,4,'#e7c18c');
      box(9,0,18,18,11,13,'#a7cdc0');box(11,0,7,8,24,15,'#788d91');box(11,0,11,12,39,3,'#d8ac76');
      const w=point(-8,12,24);mathShopOval(g,w.x,w.y,5,6,'#f4e7ba');
    }else{
      box(0,0,31,21,12,10,col);box(-12,0,4,21,22,6,col);box(12,0,4,21,22,6,col);
      const n=point(0,13,15);g.fillStyle='#786c7e';g.font='bold 12px sans-serif';g.textAlign='center';g.fillText(String(i*2),n.x,n.y+4);
    }
    const sprite={canvas:cv,alpha:g.getImageData(0,0,cv.width,cv.height).data};sprites.set(key,sprite);return sprite;
  }
  function update(sc){
    const tr=sc.mathTrain;
    tr.cars.forEach((o,i)=>{
      const p=position(tr,tr.distance-i*spacing),pic=carSprite(p,i);Object.assign(o,{c0:p.c-.35,c1:p.c+.35,r0:p.r-.35,r1:p.r+.35,x:p.x-47,y:p.y-64,w:94,h:92,canvas:pic.canvas,alpha:pic.alpha});o.position=p;
    });
    if(state.mathRide&&state.scene===sc){const p=tr.cars[1].position;Object.assign(state.hero,{c:p.c,r:p.r,path:[],frame:0,flip:p.dx<0});}
  }
  function build(sc){
    const points=route.map(([c,r])=>({c,r,...tileCenter(sc,c,r)}));let length=0;
    const segments=points.map((a,i)=>{const b=points[(i+1)%points.length],len=Math.hypot(b.x-a.x,b.y-a.y),s={a,b,len,start:length,end:length+len};length+=len;return s;});
    const tr=sc.mathTrain={segments,length,distance:0,wait:9,cars:[]};
    for(let i=0;i<4;i++){
      const o={mathTrain:true,c0:0,c1:0,r0:0,r1:0,x:0,y:0,w:94,h:92};
      o.animated=(g,t)=>{
        g.drawImage(o.canvas,o.x,o.y);
        if(i===1&&state.mathRide){
          const p=o.position,sprite=heroSprite(state.outfit,0);g.save();g.translate(p.x,p.y-17);g.scale(.58,.58);drawSprite(g,sprite,0,0,p.dx<0);g.restore();
          // The carriage front covers the passenger's feet.
          mathShopOval(g,p.x,p.y-12,11,4,'#e9b6bd');
        }
        if(i===0&&(!reduced()||state.mathRide))for(let j=0;j<3;j++){
          const u=(t*.55+j/3)%1,p=o.position;g.globalAlpha=(1-u)*.48;
          mathShopOval(g,p.x+p.dx*12-u*9,p.y-47-u*27,3+u*6,3+u*4,'#fff7df');g.globalAlpha=1;
        }
      };
      sc.objects.push(o);tr.cars.push(o);
    }
    update(sc);
  }
  function track(g,sc){
    const tr=sc.mathTrain;
    g.lineJoin='round';g.lineCap='round';
    const line=offset=>{g.beginPath();tr.segments.forEach((s,i)=>{const dx=(s.b.x-s.a.x)/s.len,dy=(s.b.y-s.a.y)/s.len;const p={x:s.a.x-dy*offset,y:s.a.y+dx*offset*.65};i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);});g.closePath();g.stroke();};
    g.strokeStyle='#d6c8a7';g.lineWidth=22;line(0);
    for(const s of tr.segments){
      const dx=(s.b.x-s.a.x)/s.len,dy=(s.b.y-s.a.y)/s.len;
      for(let d=0;d<s.len;d+=10){const x=s.a.x+dx*d,y=s.a.y+dy*d;riverLine(g,[[x-dy*10,y+dx*7],[x+dy*10,y-dx*7]],'#a99476',3);}
    }
    g.strokeStyle='#8c918b';g.lineWidth=2;line(-6);line(6);
    const platform=boxCorners(sc,18,34,8,2);fillPoly(g,[platform.T,platform.R,platform.B,platform.L],'#e8d9b8');
    const a=tileCenter(sc,18,35),b=tileCenter(sc,25,35);riverLine(g,[[a.x-7,a.y-3],[b.x+7,b.y+3]],'#f7e3a5',4);
    // Boarding is on the north side of the station track; the entry lane
    // crosses the rails at a painted pedestrian crossing.
    for(let i=-2;i<=2;i++){const p=tileCenter(sc,17+i*.22,36);riverLine(g,[[p.x-6,p.y-4],[p.x+6,p.y+4]],'#fff1d2',3);}
  }
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(dt){
    const sc=state.scene,tr=sc?.mathTrain;if(!tr||state.paused||guide.asleep)return;
    if(reduced()&&!state.mathRide)return;
    if(tr.wait>0){tr.wait=Math.max(0,tr.wait-dt);return;}
    tr.distance+=Math.max(0,Math.min(.1,dt))*speed;
    if(tr.distance>=tr.length){tr.distance=0;tr.wait=8;update(sc);if(state.mathRide){leave();return;}}
    update(sc);
  }
  function depart(){const tr=state.scene?.mathTrain;if(tr)tr.wait=0;}
  function board(){
    if(state.scene?.kind!=='math'||state.busy||state.paused||guide.asleep||guideTimeUp())return;
    closeDialog();state.mounted=false;renderRide();parkUnicorn();
    const tr=state.scene.mathTrain;tr.distance=0;tr.wait=0;state.mathRide=true;state.busy=true;update(state.scene);
    if(!rideBar){rideBar=document.createElement('div');rideBar.id='math-ride';rideBar.className='math-ride';const label=document.createElement('span'),b=document.createElement('button');b.type='button';b.addEventListener('click',()=>{Sound.tap();leave();});rideBar.append(label,b);document.body.append(rideBar);}
    rideBar.firstChild.textContent=I18n.t('math.ride.touring');rideBar.lastChild.textContent=I18n.t('math.ride.leave');rideBar.classList.remove('hidden');Sound.tap();snapCamera();
  }
  function requestRide(){
    if(state.mathRide||state.busy)return;Sound.tap();
    walkTo((c,r)=>r===35&&c>=18&&c<=24,board);
  }
  function leave(){
    if(!state.mathRide)return;state.mathRide=false;rideBar?.classList.add('hidden');
    if(state.scene?.kind==='math'){placeHero(MATH_START.c,MATH_START.r);parkUnicorn();snapCamera();}
    state.busy=busyNow();
  }
  addEventListener('keydown',e=>{if(e.key==='Escape'&&typeof state!=='undefined'&&state.mathRide){e.preventDefault();leave();}});
  return{build,track,tick,board,requestRide,leave,depart,position};
})();
