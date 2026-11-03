// A freely accessible riverside neighborhood. Homes are 2/3 the old width/height,
// with stable house IDs and their own return doors in the correct neighborhood.
function clearNeighborhoodPath(sc, c0, r0, c1, r1, type='path') {
  const gone=o=>o.tree && o.c0>=c0 && o.c0<=c1 && o.r0>=r0 && o.r0<=r1;
  for(const o of sc.objects.filter(gone))tileAt(sc,o.c0,o.r0).blocked=false;
  sc.objects=sc.objects.filter(o=>!gone(o));
  for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)if(!tileAt(sc,c,r).blocked)setTile(sc,c,r,type);
}
function addNeighborhoodEntrances(sc) {
  for(const [key,d] of Object.entries(NEIGHBORHOODS)){
    const {cols,row}=d.entrance,[a,b]=cols;
    // A short lane beside the castle, away from the shopping square.
    clearNeighborhoodPath(sc,a-1,row-1,b+1,row+3);
    clearNeighborhoodPath(sc,a,row,b,10);
    const links=cols.map(c=>({c,r:row,target:key,at:d.start,icon:d.icon,style:'gate'}));
    sc.links.push(...links);addGate(sc,[a-1,b+1],row,d.color,links);
    const p=tileCenter(sc,(a+b)/2,row);
    sc.signs.push({x:p.x,y:p.y-64,text:place(key),color:d.color,links});
    sc.neighborhoodReturns=sc.neighborhoodReturns||[];sc.neighborhoodReturns.push(d.townReturn);
  }
}
function neighborhoodHome(sc,h,theme,index){
  const info=houseLetter(h.letter),scale=2/3;
  const shapes=theme==='garden'?['cottage','thatch','mushroom','cottage']:['thatch','cottage','windmill','manor'];
  const shape=shapes[index%shapes.length];
  const roof=mix(info.color,theme==='garden'?'#f3bad2':'#8acbd2',.22);
  block(sc,h.c,h.r,2,2);
  const obj=addObject(sc,{c:h.c,r:h.r,w:2,d:2},footBounds(sc,h.c,h.r,2,2,houseUp(shape)*scale+8,10),ctx=>{
    const k=boxCorners(sc,h.c,h.r,3,3), anchor=k.T;
    ctx.save();ctx.translate(anchor.x,anchor.y);ctx.scale(scale,scale);ctx.translate(-anchor.x,-anchor.y);
    drawHouse(ctx,k,{roof,wall:theme==='garden'?'#fff3ed':'#edf5ef',door:'left',shape});ctx.restore();
  },{kind:'house',house:h,info});
  sc.doors.push({c:h.c+1,r:h.r+2,obj,target:`house-${h.letter}`});
  const k=boxCorners(sc,h.c,h.r,2,2), p=wallPt(wall(k.L,k.B),16,21);
  sc.signs.push({x:p.x,y:p.y,text:info.letter+info.letter.toLowerCase(),color:info.color});
}
function connectNeighborhoodDoors(sc){
  for(const d of sc.doors){
    const queue=[{c:d.c,r:d.r,path:[]}],seen=new Set();
    for(let i=0;i<queue.length;i++){
      const p=queue[i],t=tileAt(sc,p.c,p.r),key=`${p.c},${p.r}`;
      if(!t||t.blocked||seen.has(key))continue;seen.add(key);
      if(['path','petals','wood','road','plaza'].includes(t.type)){
        for(const a of p.path)setTile(sc,a.c,a.r,sc.kind==='garden'?'petals':'path');break;
      }
      for(const[dc,dr]of[[0,1],[1,0],[-1,0],[0,-1]])queue.push({c:p.c+dc,r:p.r+dr,path:[...p.path,{c:p.c,r:p.r}]});
    }
  }
}
function buildNeighborhood(key){
  const theme=NEIGHBORHOODS[key],sc=makeScene(key,32,32,130,60);
  sc.outdoor=true;sc.label=place(key);sc.start={...theme.start};
  const pathType='path';
  for(const r of[7,14,22,28])for(let c=3;c<=29;c++)setTile(sc,c,r,pathType);
  for(const c of[7,25])for(let r=6;r<=29;r++)setTile(sc,c,r,pathType);
  for(let r=27;r<32;r++)for(const c of[15,16])setTile(sc,c,r,pathType);
  // An animated brook and wide wooden crossings between the two banks.
  for(let r=9;r<=25;r++)for(const c of[15,16])setTile(sc,c,r,'water');
  for(let r=7;r<=10;r++)for(let c=14;c<=17;c++)setTile(sc,c,r,'water');
  for(const row of[7,14,22,26])for(let r=row;r<=row+1;r++)for(let c=13;c<=18;c++)setTile(sc,c,r,'wood');
  const homes=TOWN_HOUSES.filter(h=>h.scene===key);
  homes.forEach((h,i)=>neighborhoodHome(sc,h,key,i));
  connectNeighborhoodDoors(sc);
  // Border planting frames the houses; the centre stays low and open.
  const plants=[makePlant('pine'),makePlant('birch'),makePlant('bush')];
  for(let r=0;r<32;r++)for(let c=0;c<32;c++){
    const t=tileAt(sc,c,r);if(t.blocked||t.type!=='grass')continue;
    if(homes.some(h=>c>=h.c-2&&c<=h.c+3&&r>=h.r-2&&r<=h.r+4))continue;
    if(c>=13&&c<=18&&r>=25)continue;
    const border=c<2||r<2||c>29||r>29;
    if(hash(c,r,307)>(border?.42:.035))continue;
    if(sc.objects.some(o=>o.tree&&Math.abs(c-o.c0)<2&&Math.abs(r-o.r0)<2))continue;
    const plant=plants[border?0:1+Math.floor(hash(c,r,310)*2)],p=tileCenter(sc,c,r);
    block(sc,c,r,1,1);sc.objects.push({c0:c,r0:r,c1:c,r1:r,tree:true,canvas:plant.canvas,x:p.x-plant.ax,y:p.y-plant.ay,w:plant.canvas.width,h:plant.canvas.height});
  }
  // Lamps mark the river crossings.
  const lamp=makeLamp();
  for(const[c,r]of[[12,14],[20,14],[12,22],[20,28]]){
    if(tileAt(sc,c,r).blocked)continue;
    const p=tileCenter(sc,c,r);block(sc,c,r,1,1);
    sc.objects.push({c0:c,r0:r,c1:c,r1:r,canvas:lamp.canvas,x:p.x-lamp.ax,y:p.y-lamp.ay,w:lamp.canvas.width,h:lamp.canvas.height});
    sc.lamps.push({x:p.x,y:p.y-lamp.ay+lamp.glow.y});
  }
  sc.links=[15,16].map(c=>({c,r:31,target:'town',at:theme.townReturn,icon:'🏰',style:'gate'}));
  addGate(sc,[14,17],30,theme.color,sc.links);
  const p=tileCenter(sc,15.5,30);sc.signs.push({x:p.x,y:p.y-64,text:place('town'),color:theme.color,links:sc.links});
  renderGround(sc);return sc;
}
