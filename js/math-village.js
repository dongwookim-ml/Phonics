// A toy shopping village with a closed scenic railway. Every activity is free.
function addMathVillageGate(sc) {
  const {cols,row}=MATH_TOWN_GATE,[a,b]=cols;
  clearNeighborhoodPath(sc,a-1,row-1,b+1,row+3,'road');
  clearNeighborhoodPath(sc,32,10,b,10,'road');
  const links=cols.map(c=>({c,r:row,target:'math',at:MATH_START,icon:'🔢',style:'gate'}));
  sc.links.push(...links);addGate(sc,[a-1,b+1],row,'#8dcab9',links);
  const p=tileCenter(sc,(a+b)/2,row);sc.signs.push({x:p.x,y:p.y-64,text:place('math'),color:'#669e91',links});
}
function mathCanvasShape(g,s,x,y,size,color) {
  const d=MATH_SHAPES[s];g.save();g.translate(x,y);g.scale(size/100,size/100);
  g.fillStyle=color;g.strokeStyle='#726d82';g.lineWidth=3;g.lineJoin='round';g.beginPath();
  if(s==='circle')g.arc(0,0,35,0,Math.PI*2);
  else if(s==='oval')g.ellipse(0,0,40,25,0,0,Math.PI*2);
  else d.points.forEach(([px,py],i)=>i?g.lineTo(px-50,py-50):g.moveTo(px-50,py-50));
  g.closePath();g.fill();g.stroke();g.restore();
}
// Four shops around a picnic green; the railway stays outside the shops.
function buildMathVillage() {
  const sc=makeScene('math',40,40,170,70);sc.outdoor=true;sc.label=place('math');sc.start={...MATH_START};
  const rect=(c,r,w,d,type)=>{for(let y=r;y<r+d;y++)for(let x=c;x<c+w;x++)setTile(sc,x,y,type);};
  rect(6,5,10,10,'meadow');rect(5,20,11,10,'petals');rect(23,8,11,11,'petals');rect(24,23,10,8,'meadow');
  rect(16,30,10,6,'plaza');
  // Curving, connected lanes give every shop a clear front approach.
  const lane=(a,b)=>{const n=Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]));for(let i=0;i<=n;i++)rect(Math.round(a[0]+(b[0]-a[0])*i/n),Math.round(a[1]+(b[1]-a[1])*i/n),2,2,'path');};
  for(const[a,b]of[[[17,38],[19,34]],[[19,34],[19,28]],[[19,28],[10,27]],[[10,27],[10,12]],[[10,12],[19,16]],[[19,16],[27,15]],[[27,15],[28,29]],[[28,29],[19,33]],[[19,16],[19,28]]])lane(a,b);
  for(const s of MATH_SHOPS){
    block(sc,s.c,s.r,s.w,s.d);
    const n=makeNpc({who:I18n.t(`math.shop.${s.key}`),look:isCaptain()?({baker:'botchef',flower:'botgarden',farmer:'botfarm',kid:'botkid',bard:'botdj'}[s.look]):s.look,c:s.c+2,r:s.r+s.d+1},null);
    Object.assign(n,{mathShop:s.key,mathTopics:s.topics,mathTopic:s.topics[0],level:1,badge:({bakery:'🍞',icecream:'🍦',workshop:'🔺',toys:'🧸',station:'🚂'})[s.key]});sc.npcs.push(n);
    addObject(sc,{c:s.c,r:s.r,w:s.w,d:s.d},footBounds(sc,s.c,s.r,s.w,s.d,185,24),g=>drawMathShop(g,sc,s),{kind:'math-shop',mathHost:n});
    const p=houseMid(boxCorners(sc,s.c,s.r,s.w,s.d));
    sc.signs.push({x:p.x,y:p.y-8,text:n.name,color:shade(s.color,-35),mathHost:n});
    // Little customers wait beside, rather than in front of, the host.
    const at=tileCenter(sc,s.c+s.w+1,s.r+s.d);
    const customer=addObject(sc,{c:s.c+s.w+1,r:s.r+s.d,w:1,d:1},{x:at.x-29,y:at.y-49,w:58,h:66},g=>{
      g.save();g.translate(at.x,at.y);mathShopAnimal(g,0,0,s.key==='bakery'||s.key==='workshop'?'rabbit':'cat');g.restore();
    },{mathCustomer:s.key,react:{word:s.key==='bakery'||s.key==='workshop'?'rabbit':'cat',fx:'stars'}});
    customer.animated=(g,t)=>{
      const order=sc.mathOrder,celebrate=order?.shop===s.key&&performance.now()-order.at<4500;
      const hop=celebrate?-Math.abs(Math.sin(t*7))*5:0;
      g.drawImage(customer.canvas,customer.x,customer.y+hop);
      if(celebrate){g.save();g.translate(at.x+17,at.y-16+hop);px(g,-6,-6,13,13,'#efcf98');riverLine(g,[[-4,-6],[-3,-11],[3,-11],[4,-6]],'#b39371',1);g.restore();}
    };
  }
  // A picnic garden, shape sculptures and a winding 1–10 hopscotch trail.
  for(const[c,r]of[[15,8],[7,17],[33,20],[15,29],[30,31]])riverFruitTree(sc,c,r);
  for(const[c,r]of[[16,20],[23,23],[14,15]]){
    const p=tileCenter(sc,c,r);block(sc,c,r,2,1);
    addObject(sc,{c,r,w:2,d:1},{x:p.x-30,y:p.y-28,w:62,h:53},g=>{g.save();g.translate(p.x,p.y);riverDrawBench(g);g.restore();},{react:{fx:'petals'}});
  }
  const picnic=tileCenter(sc,16,17);block(sc,16,17,2,2);
  addObject(sc,{c:16,r:17,w:2,d:2},{x:picnic.x-43,y:picnic.y-25,w:86,h:63},g=>{
    const k=boxCorners(sc,15,16,3,3);fillPoly(g,[k.T,k.R,k.B,k.L],'#f3d8b4');
    for(let i=-2;i<=2;i++)riverLine(g,[[picnic.x-32+i*7,picnic.y-5+i*3],[picnic.x+i*7,picnic.y+11+i*3]],'#e4a8a3',2);
    g.save();g.translate(picnic.x,picnic.y);riverDrawBasket(g);mathShopBread(g,20,4,.4);g.restore();
  },{react:{fx:'petals'}});
  for(const[c,r,s,col]of[[17,12,'circle','#dfb96e'],[32,17,'triangle','#99c6b0'],[16,25,'square','#b7a4d2'],[23,7,'hexagon','#e7ad91']]){
    block(sc,c,r,1,1);const p=tileCenter(sc,c,r);
    addObject(sc,{c,r,w:1,d:1},{x:p.x-24,y:p.y-38,w:48,h:46},g=>{
      mathShopOval(g,p.x,p.y+1,18,7,'#c3cba9');px(g,p.x-2,p.y-12,4,15,'#a88768');mathCanvasShape(g,s,p.x,p.y-20,43,col);
    },{react:{fx:'stars'}});
  }
  MathTrain.build(sc);
  const railNear=(c,r)=>sc.mathTrain.segments.some(s=>{
    const dc=s.b.c-s.a.c,dr=s.b.r-s.a.r,u=Math.max(0,Math.min(1,((c-s.a.c)*dc+(r-s.a.r)*dr)/(dc*dc+dr*dr)));
    return Math.hypot(c-s.a.c-u*dc,r-s.a.r-u*dr)<2.2;
  });
  const trees=[makeTree('green'),makeTree('blossom'),makePlant('birch')];
  for(let r=0;r<40;r++)for(let c=0;c<40;c++){
    const t=tileAt(sc,c,r),edge=c<2||r<2||c>37||r>37;
    if(t.blocked||t.type!=='grass'||railNear(c,r)||c>=17&&c<=23&&r>33)continue;
    if(MATH_SHOPS.some(s=>c>=s.c-2&&c<=s.c+s.w+3&&r>=s.r-2&&r<=s.r+s.d+4))continue;
    if(hash(c,r,811)>(edge?.32:.025))continue;
    const pic=trees[Math.floor(hash(c,r,813)*trees.length)],p=tileCenter(sc,c,r);block(sc,c,r,1,1);
    sc.objects.push({c0:c,r0:r,c1:c,r1:r,tree:true,canvas:pic.canvas,x:p.x-pic.ax,y:p.y-pic.ay,w:pic.canvas.width,h:pic.canvas.height});
  }
  sc.paintGround=g=>{
    MathTrain.track(g,sc);
    g.textAlign='center';g.textBaseline='middle';g.font='bold 8px sans-serif';
    for(let n=1;n<=10;n++){
      const p=tileCenter(sc,19+Math.sin(n*.7)*.55,17+n);mathShopOval(g,p.x,p.y,11,5,n%2?'#f9e3a8':'#d8e3cd');
      g.fillStyle='#78647c';g.fillText(String(n),p.x,p.y+.5);
    }
    // Flowers along the railway and in the gaps between the shop gardens.
    for(let r=5;r<35;r++)for(let c=5;c<35;c++){
      const t=tileAt(sc,c,r);if(t.blocked||t.type!=='grass'||hash(c,r,99)>.18)continue;
      const p=tileCenter(sc,c,r);for(let i=0;i<3;i++){px(g,p.x+i*4-5,p.y+i%2*2,1,3,'#8fa77c');px(g,p.x+i*4-6,p.y+i%2*2-1,3,2,['#edc2b4','#e9dfa5','#c5bbdb'][i]);}
    }
  };
  const links=[17,18].map(c=>({c,r:39,target:'town',at:MATH_TOWN_GATE.back,icon:'🏰',style:'gate'}));
  sc.links=links;addGate(sc,[16,19],38,'#a7d1bb',links);
  const p=tileCenter(sc,17.5,38);sc.signs.push({x:p.x,y:p.y-64,text:place('town'),color:'#6b9f90',links});
  for(const n of sc.npcs){
    if(townNpcCoverage(sc,n,n.c,n.r)<=.05)continue;
    const spots=[];for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++)if(walkable(sc,n.c+dc,n.r+dr))spots.push({c:n.c+dc,r:n.r+dr,d:Math.abs(dc)+Math.abs(dr)});
    const p=spots.sort((a,b)=>a.d-b.d).find(p=>townNpcCoverage(sc,n,p.c,p.r)<=.05);if(p)Object.assign(n,{c:p.c,r:p.r});
  }
  renderGround(sc);return sc;
}
