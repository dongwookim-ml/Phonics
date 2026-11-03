// Native pixel scenery for the two empty riverside lots. The park stays
// outside house doorways; low planting leaves the water and people visible.
const RIVER_PARK = { mint:'#72bdb0', pink:'#e9a0b3', sand:'#efdaab', wood:'#b47c55', ink:'#59665f' };

function riverLine(g, points, color, width=2) {
  g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';
  g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();
}
function riverProp(sc, kind, c, r, w, d, up, paint, react, solid=true) {
  if(solid)block(sc,c,r,w,d);
  const bounds=footBounds(sc,c,r,w,d,up,18),p=tileCenter(sc,c+(w-1)/2,r+(d-1)/2);
  const o={c0:c,r0:r,c1:c+w-1,r1:r+d-1,...bounds,parkProp:kind,react};
  o.animated=(g,t)=>{g.save();g.translate(p.x,p.y);paint(g,t,o);g.restore();};
  stillFrame(o);sc.objects.push(o);return o;
}
// Seconds are shared with drawScene; tapping the frame sets touchedAt.
function riverSwingAngle(t, touchedAt) {
  const age=t-(touchedAt||0)/1000;
  return touchedAt&&age>=0&&age<7?Math.sin(age*4.5)*.62*Math.exp(-age*.32):0;
}
function riverDrawSwing(g,t,o) {
  const a=riverSwingAngle(t,o.touchedAt),dx=Math.sin(a)*20,dy=(1-Math.cos(a))*16;
  const legs=[[[-26,4],[-17,-36],[-8,14]],[[17,25],[26,-15],[35,35]]];
  for(const pts of legs)riverLine(g,pts,'#846449',4);
  riverLine(g,[[-18,-37],[27,-15]],RIVER_PARK.mint,6);
  riverLine(g,[[-18,-39],[27,-17]],'#a9dfc8',2);
  riverLine(g,[[-9,-31],[-9+dx,1-dy]],'#d9c8a2',1.5);
  riverLine(g,[[10,-22],[10+dx,10-dy]],'#d9c8a2',1.5);
  fillPoly(g,[{x:-14+dx,y:1-dy},{x:9+dx,y:12-dy},{x:16+dx,y:8-dy},{x:-7+dx,y:-3-dy}],RIVER_PARK.pink);
  riverLine(g,[[-14+dx,1-dy],[9+dx,12-dy],[16+dx,8-dy]],'#b66f8b',3);
  for(const[x,y]of[[-26,4],[-8,14],[17,25],[35,35]])px(g,x-3,y,6,2,'#72957c');
}
function riverDrawSlide(g) {
  // A little raised platform, ladder and open mint chute with coral rails.
  riverLine(g,[[9,-21],[9,6]],'#9d7955',3);riverLine(g,[[24,-13],[24,14]],'#9d7955',3);
  fillPoly(g,[{x:8,y:-24},{x:23,y:-17},{x:16,y:-12},{x:1,y:-19}],'#f2d396');
  for(let i=0;i<5;i++)riverLine(g,[[23,-12+i*5],[33,-17+i*5]],'#d7b480',2);
  riverLine(g,[[23,-16],[23,13]],'#997455',2);riverLine(g,[[33,-21],[33,8]],'#997455',2);
  fillPoly(g,[{x:0,y:-20},{x:14,y:-13},{x:-10,y:21},{x:-27,y:13}],RIVER_PARK.mint);
  fillPoly(g,[{x:4,y:-17},{x:10,y:-14},{x:-13,y:17},{x:-20,y:14}],'#b7e8d6');
  riverLine(g,[[0,-23],[-27,10],[-26,14]],RIVER_PARK.pink,3);
  riverLine(g,[[14,-16],[-10,18],[-9,21]],RIVER_PARK.pink,3);
  riverLine(g,[[6,-29],[6,-37],[25,-28],[25,-20]],RIVER_PARK.mint,2);
}
function riverDrawSand(g) {
  const pts=[{x:0,y:-12},{x:34,y:5},{x:10,y:17},{x:-24,y:0}];
  fillPoly(g,pts,'#b98e63');fillPoly(g,pts.map(p=>({x:p.x*.86+1,y:p.y*.8})),RIVER_PARK.sand);
  for(let i=0;i<24;i++)px(g,-14+(i*13)%41,-3+(i*7)%12,1,1,i%2?'#dfc58d':'#fff0c9');
  px(g,2,-3,9,7,'#cdae72');px(g,1,-5,3,3,'#dfc38a');px(g,8,-5,3,3,'#dfc38a');
  px(g,5,1,2,3,'#9a805d');px(g,-10,0,6,5,RIVER_PARK.pink);
  riverLine(g,[[-9,0],[-8,-3],[-6,-3],[-5,0]],'#bc738d',1);
  riverLine(g,[[17,6],[23,2]],RIVER_PARK.mint,2);px(g,23,0,4,3,RIVER_PARK.mint);
}
function riverDrawBench(g) {
  for(const x of[-19,14])riverLine(g,[[x,-4],[x,9]],'#667f76',3);
  fillPoly(g,[{x:-25,y:-5},{x:15,y:15},{x:27,y:9},{x:-13,y:-11}],'#d7b181');
  riverLine(g,[[-25,-7],[15,13]],'#f4d5a2',2);
  riverLine(g,[[-24,-20],[17,0]],RIVER_PARK.mint,7);
  riverLine(g,[[-24,-15],[17,5]],'#a7d9bd',4);
  riverLine(g,[[-24,-22],[-24,-3]],'#668d7c',2);riverLine(g,[[17,-2],[17,17]],'#668d7c',2);
}
function riverDrawBasket(g) {
  fillPoly(g,[{x:-12,y:-5},{x:0,y:-11},{x:14,y:-4},{x:2,y:2}],'#efd1a0');
  fillPoly(g,[{x:-12,y:-5},{x:2,y:2},{x:2,y:13},{x:-10,y:6}],'#b48151');
  fillPoly(g,[{x:2,y:2},{x:14,y:-4},{x:12,y:6},{x:2,y:13}],'#d1a06b');
  riverLine(g,[[-7,-4],[-6,-15],[0,-18],[8,-14],[9,-7]],'#a5754f',2);
  for(let y=0;y<8;y+=3)riverLine(g,[[-9,y],[1,y+5],[11,y]],'#e7bb82',1);
  px(g,-7,-8,5,5,'#e2918c');px(g,1,-8,4,4,'#d9e1a0');
  px(g,8,10,7,3,'#fff3de');px(g,9,10,2,2,'#e99caa');
}
function riverFruitTree(sc,c,r) {
  const tree=makeTree('green'),p=tileCenter(sc,c,r),cv=makeCanvas(tree.canvas.width,tree.canvas.height),g=cv.getContext('2d');
  g.drawImage(tree.canvas,0,0);
  for(const[x,y]of[[10,15],[22,12],[17,25],[25,24]]){px(g,x,y,4,4,'#df8790');px(g,x,y,1,2,'#ffd3bd');px(g,x+2,y-2,1,2,'#627b45');}
  block(sc,c,r,1,1);
  sc.objects.push({c0:c,r0:r,c1:c,r1:r,tree:true,parkProp:'apple-tree',canvas:cv,x:p.x-tree.ax,y:p.y-tree.ay,w:cv.width,h:cv.height,react:{word:'apple',fx:'petals'}});
}
function riverButterflyAt(p,t,phase) {
  return {x:p.x+Math.sin(t*.6+phase)*19,y:p.y-16+Math.sin(t*.9+phase)*8};
}
function riverDrawButterfly(g,p,t,phase,color) {
  const a=riverButterflyAt(p,t,phase),wing=2+Math.abs(Math.sin(t*8+phase))*3;
  px(g,a.x-wing-1,a.y-4,wing,5,color);px(g,a.x+1,a.y-4,wing,5,color);
  px(g,a.x-wing,a.y+1,wing-1,3,color);px(g,a.x+1,a.y+1,wing-1,3,color);
  px(g,a.x,a.y-3,1,7,'#6f6a68');px(g,a.x-1,a.y-5,1,1,'#6f6a68');px(g,a.x+1,a.y-5,1,1,'#6f6a68');
}
function riverAddButterfly(sc,c,r,phase,color) {
  const p=tileCenter(sc,c,r),o={c0:c,r0:r,c1:c,r1:r,x:p.x-27,y:p.y-35,w:54,h:42,parkProp:'butterfly',react:{word:'butterfly',fx:'petals'}};
  o.animated=(g,t)=>riverDrawButterfly(g,p,t,phase,color);
  o.tapHitTest=(x,y)=>{const a=riverButterflyAt(p,performance.now()/1000,phase);return Math.abs(x-a.x)<9&&Math.abs(y-a.y)<8;};
  stillFrame(o);sc.objects.push(o);
}
// Equal distances along the oval keep ducklings apart, including at turns.
const RIVER_DUCK_ROUTE = Array.from({length:81},(_,i)=>{
  const a=i/80*Math.PI*2;return {c:15.5+Math.sin(a)*.7,r:18.5+Math.cos(a)*1.55};
});
let riverDuckLength=0;
RIVER_DUCK_ROUTE.forEach((p,i)=>{
  if(i){const a=RIVER_DUCK_ROUTE[i-1],dc=p.c-a.c,dr=p.r-a.r;riverDuckLength+=Math.hypot((dc-dr)*16,(dc+dr)*8);}
  p.at=riverDuckLength;
});
function riverDuckAt(sc,t,delay) {
  const target=((t*.035-delay)%1+1)%1*riverDuckLength;
  const i=Math.max(1,RIVER_DUCK_ROUTE.findIndex(p=>p.at>=target)),a=RIVER_DUCK_ROUTE[i-1],b=RIVER_DUCK_ROUTE[i];
  const f=(target-a.at)/(b.at-a.at),c=a.c+(b.c-a.c)*f,r=a.r+(b.r-a.r)*f;
  return {...tileCenter(sc,c,r),flip:b.c-b.r<a.c-a.r,c,r};
}
function riverDrawDuck(g,p,t,chick) {
  g.save();g.translate(Math.round(p.x),Math.round(p.y));if(p.flip)g.scale(-1,1);
  const bob=Math.round(Math.sin(t*3)*.7),s=chick?.65:1;g.scale(s,s);g.translate(0,bob);
  riverLine(g,[[-11,5],[-5,7],[4,7]],'#c9edee',1);
  const body=chick?'#f3d489':'#fff4d9',wing=chick?'#dbb46e':'#e5d8b9';
  px(g,-8,-4,15,8,body);px(g,-5,-6,10,3,body);px(g,3,-12,7,10,body);
  px(g,1,-10,4,5,body);px(g,-11,-4,5,3,body);px(g,-5,-2,8,4,wing);
  px(g,8,-7,5,3,'#da9a5d');px(g,7,-10,1,1,'#605a4e');px(g,3,-12,3,1,'#fffce8');
  g.restore();
}
function riverAddDuck(sc,delay,chick) {
  const p=tileCenter(sc,15.55,18.5),o={c0:15,r0:17,c1:16,r1:20,x:p.x-62,y:p.y-46,w:124,h:85,parkProp:chick?'duckling':'duck',react:{word:'duck',fx:'splash'}};
  o.animated=(g,t)=>riverDrawDuck(g,riverDuckAt(sc,t,delay),t+delay,chick);
  o.tapHitTest=(x,y)=>{const a=riverDuckAt(sc,performance.now()/1000,delay);return Math.abs(x-a.x)<(chick?8:14)&&Math.abs(y-a.y+3)<12;};
  stillFrame(o);sc.objects.push(o);
}
function riverFishPhase(t,touchedAt,offset) {
  const age=t-(touchedAt||0)/1000;
  if(touchedAt&&age>=0&&age<1.2)return age/1.2;
  const cycle=(t+offset)%8;return cycle<1.2?cycle/1.2:-1;
}
function riverAddFish(sc,c,r,offset) {
  const p=tileCenter(sc,c,r),o={c0:c,r0:r,c1:c,r1:r,x:p.x-24,y:p.y-32,w:48,h:45,parkProp:'fish',react:{word:'fish',fx:'splash'}};
  o.animated=(g,t)=>{
    const a=riverFishPhase(t,o.touchedAt,offset),rip=a<0?2:3+Math.sin(a*Math.PI)*7;
    g.strokeStyle='#c9eeeb';g.lineWidth=1;g.beginPath();g.ellipse(p.x,p.y+3,rip,rip/3,0,0,Math.PI*2);g.stroke();
    if(a<0)return;
    const x=p.x-9+a*18,y=p.y-Math.sin(a*Math.PI)*22;
    px(g,x-4,y-2,9,5,'#f4b48c');px(g,x-2,y-4,5,2,'#ffd2a2');px(g,x-7,y-3,3,6,'#d58e78');px(g,x+3,y-1,1,1,'#73645a');
  };
  // The ripple can be tapped between jumps; the airborne target follows
  // the fish, so empty space above the water never takes a walking tap.
  o.tapHitTest=(x,y)=>{
    const a=riverFishPhase(performance.now()/1000,o.touchedAt,offset);
    if(Math.abs(x-p.x)<12&&Math.abs(y-p.y-3)<5)return true;
    return a>=0&&Math.abs(x-(p.x-9+a*18))<9&&Math.abs(y-(p.y-Math.sin(a*Math.PI)*22))<5;
  };
  stillFrame(o);sc.objects.push(o);
}
function addRiversidePark(sc) {
  sc.parkAreas=[{c0:2,r0:1,c1:13,r1:7},{c0:12,r0:9,c1:16,r1:13}];
  for(let r=2;r<=6;r++)for(let c=2;c<=13;c++){
    setTile(sc,c,r,'meadow');tileAt(sc,c,r).flowers=r===2||r===6||c===2||c===13;
  }
  for(let r=3;r<=7;r++)setTile(sc,8,r,'petals');
  for(let c=3;c<=12;c++)setTile(sc,c,6,'petals');
  riverProp(sc,'swing',3,3,2,2,59,riverDrawSwing,{word:'swing',fx:'glow'});
  riverProp(sc,'slide',6,3,1,2,50,riverDrawSlide,{fx:'glow'});
  riverProp(sc,'sandpit',4,5,2,1,16,riverDrawSand,{word:'sand',fx:'stars'});
  riverProp(sc,'bench',9,2,2,1,32,riverDrawBench,{fx:'glow'});
  riverProp(sc,'basket',11,5,1,1,30,riverDrawBasket,{word:'basket',fx:'glow'});
  // A checkered blanket lies flat, with a path around its edges.
  sc.paintGround=g=>{
    const k=boxCorners(sc,9,4,3,2);fillPoly(g,[k.T,k.R,k.B,k.L],'#fff3df');
    for(let r=4;r<6;r++)for(let c=9;c<12;c++){
      const p=tileOrigin(sc,c,r);fillPoly(g,diamondPts(p.x,p.y),(c+r)%2?'#eeb7be':'#fff2df');
    }
    riverLine(g,[[k.L.x,k.L.y],[k.B.x,k.B.y],[k.R.x,k.R.y]],'#cb919d',1);
  };
  riverFruitTree(sc,2,2);riverFruitTree(sc,12,2);
  riverAddButterfly(sc,5,2,0,'#eaa2bd');riverAddButterfly(sc,11,3,2,'#e3bd6e');riverAddButterfly(sc,12,6,4,'#b8a2db');
  const sign=tileCenter(sc,8,2);sc.signs.push({x:sign.x,y:sign.y-18,text:I18n.t('park.name'),color:'#6aab91',plain:true});
  // A short dock reaches one tile into the brook, leaving its crossings open.
  for(let r=10;r<=11;r++)for(let c=12;c<=15;c++)setTile(sc,c,r,'wood');
  riverProp(sc,'dock',12,10,4,2,37,g=>{
    riverLine(g,[[-27,-4],[-27,-15],[-10,-7],[-10,4]],'#bd956a',3);
    riverLine(g,[[-27,-16],[-10,-8]],'#e0bc88',2);
    px(g,-15,5,9,8,'#82aaa5');px(g,-14,5,7,2,'#b9d3c1');
  },{word:'fish',fx:'splash'},false);
  const fisher=makeNpc({who:I18n.t('park.fisher'),look:'fisher',c:15,r:11},null);
  Object.assign(fisher,{riverFisher:true,level:1,flip:false});sc.npcs.push(fisher);
  riverProp(sc,'fishing-rod',15,11,1,1,50,(g,t)=>{
    riverLine(g,[[4,-12],[28,-37]],'#9b7f58',2);
    riverLine(g,[[28,-37],[39,5+Math.sin(t*2)]],'#e6e2c4',1);
    px(g,37,4+Math.sin(t*2),4,3,RIVER_PARK.pink);
  },{word:'fish',fx:'splash'},false);
  riverAddDuck(sc,0,false);riverAddDuck(sc,.15,true);riverAddDuck(sc,.3,true);
  riverAddFish(sc,16,12.5,2);riverAddFish(sc,15.6,24.5,5);
  // Small flower pockets soften the otherwise straight residential lanes.
  for(const[c,r]of[[12,16],[19,18],[12,24],[19,25],[24,8],[5,22]]){
    if(tileAt(sc,c,r).blocked)continue;
    const f=makePlant('tulips'),p=tileCenter(sc,c,r);
    sc.objects.push({c0:c,r0:r,c1:c,r1:r,canvas:f.canvas,x:p.x-f.ax,y:p.y-f.ay,w:f.canvas.width,h:f.canvas.height,parkProp:'flowers',react:{word:'flower',fx:'petals'}});
  }
}
