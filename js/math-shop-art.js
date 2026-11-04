// Storybook shop silhouettes, drawn into the same native canvases as town.
function mathShopOval(g,x,y,rx,ry,color,line) {
  g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();
  if(line){g.strokeStyle=line;g.lineWidth=2;g.stroke();}
}
function mathShopBread(g,x,y,size=1) {
  g.save();g.translate(x,y);g.scale(size,size);
  mathShopOval(g,0,0,25,14,'#d99c5c','#ac764a');
  mathShopOval(g,-3,-4,22,11,'#f4ce89');
  for(const a of[-12,0,12])riverLine(g,[[a-3,-9],[a+2,-1]],'#e1a966',3);
  g.restore();
}
function mathShopCone(g,x,y,n=3,size=1) {
  g.save();g.translate(x,y);g.scale(size,size);
  fillPoly(g,[{x:-19,y:0},{x:19,y:0},{x:0,y:36}],'#e4b77a');
  for(let i=0;i<4;i++)riverLine(g,[[-15+i*8,3],[4+i*3,27-i*5]],'#c3905d',1);
  for(let i=0;i<3;i++)riverLine(g,[[15-i*8,3],[-5-i*3,25-i*5]],'#f6d9a1',1);
  for(let i=0;i<n;i++){
    const yy=-10-i*19;mathShopOval(g,0,yy,21,17,['#efb1c0','#c2dac0','#f4dba2'][i%3],'#b88d92');
    mathShopOval(g,-7,yy-6,6,3,'#fff0dc');
  }
  g.restore();
}
function mathShopToy(g,x,y,type='car',size=1) {
  g.save();g.translate(x,y);g.scale(size,size);
  if(type==='bear'){
    mathShopOval(g,-12,-17,8,8,'#bb946c');mathShopOval(g,12,-17,8,8,'#bb946c');
    mathShopOval(g,0,-9,19,17,'#d6ae7e','#a68365');
    mathShopOval(g,0,10,15,16,'#d6ae7e');mathShopOval(g,0,12,9,10,'#efd0a0');
    px(g,-7,-13,2,3,'#655e60');px(g,6,-13,2,3,'#655e60');
    mathShopOval(g,0,-5,8,6,'#f1d4a4');px(g,-2,-8,4,3,'#7d6660');
    riverLine(g,[[0,-4],[0,0],[-4,2]],'#8c7269',1);
    mathShopOval(g,-15,20,8,6,'#bc936e');mathShopOval(g,15,20,8,6,'#bc936e');
    fillPoly(g,[{x:-7,y:1},{x:0,y:5},{x:-7,y:9}],'#df9baa');fillPoly(g,[{x:7,y:1},{x:0,y:5},{x:7,y:9}],'#df9baa');
  }else if(type==='robot'){
    px(g,-13,-22,26,21,'#a6c7d6');px(g,-9,-18,18,12,'#ebefda');
    px(g,-6,-15,3,4,'#776783');px(g,4,-15,3,4,'#776783');px(g,-4,-7,9,2,'#95a9b8');
    px(g,-11,1,22,20,'#a4c6b4');px(g,-3,6,6,6,'#e7b778');
    px(g,-18,4,5,13,'#98b9c8');px(g,13,4,5,13,'#98b9c8');
    px(g,-10,22,7,5,'#7f8c9b');px(g,4,22,7,5,'#7f8c9b');px(g,-1,-28,2,6,'#b28b76');
  }else{
    fillPoly(g,[{x:-22,y:3},{x:-13,y:-11},{x:7,y:-11},{x:17,y:3}],'#9ec7bd');
    fillPoly(g,[{x:-9,y:-8},{x:4,y:-8},{x:10,y:1},{x:-14,y:1}],'#f1eddb');
    px(g,-28,3,55,14,'#dda5b3');px(g,-24,6,8,3,'#f6d9b3');
    mathShopOval(g,-17,18,7,7,'#6a6574');mathShopOval(g,16,18,7,7,'#6a6574');
    mathShopOval(g,-17,18,3,3,'#d5ccb9');mathShopOval(g,16,18,3,3,'#d5ccb9');
  }
  g.restore();
}
function mathShopAnimal(g,x,y,kind='rabbit') {
  g.save();g.translate(x,y);
  const rabbit=kind==='rabbit',col=rabbit?'#f3e3d2':'#c6baad';
  if(rabbit){mathShopOval(g,-5,-22,3,10,col);mathShopOval(g,5,-22,3,10,col);px(g,-5,-28,1,8,'#dfb3b3');px(g,5,-28,1,8,'#dfb3b3');}
  else{fillPoly(g,[{x:-10,y:-13},{x:-9,y:-26},{x:-2,y:-17}],col);fillPoly(g,[{x:10,y:-13},{x:9,y:-26},{x:2,y:-17}],col);}
  mathShopOval(g,0,-12,12,10,col,'#b59c91');mathShopOval(g,0,2,10,10,col);
  px(g,-5,-15,1,2,'#6e6467');px(g,4,-15,1,2,'#6e6467');px(g,-1,-10,2,2,'#cc999d');
  px(g,-8,-9,3,1,'#e8bab5');px(g,6,-9,3,1,'#e8bab5');
  px(g,-10,10,8,3,col);px(g,3,10,8,3,col);px(g,-8,0,16,5,rabbit?'#b6d0ba':'#ddbec7');
  g.restore();
}
function drawMathShop(g,sc,s) {
  const k=boxCorners(sc,s.c,s.r,s.w,s.d),mid=houseMid(k),L=wall(k.L,k.B),R=wall(k.B,k.R),H=s.key==='station'?35:48;
  houseShadow(g,k);
  for(const [side,col]of[[L,'#fbefd8'],[R,'#fff8e9']]){
    wallRect(g,side,0,side.len,0,H,col);wallRect(g,side,0,side.len,0,6,shade(s.color,-25));
    wallRect(g,side,0,3,0,H,s.color);wallRect(g,side,side.len-3,side.len,0,H,s.color);
    wallRect(g,side,0,side.len,H-8,H,s.color);
  }
  wallArch(g,L,12,34,5,H-5,'#a17c72');wallArch(g,L,15,31,6,H-8,'#b9d9cf');
  wallRect(g,L,27,29,15,18,'#f4cf87');
  for(const side of[L,R]){
    const start=side===L?43:10,end=side.len-8;
    wallRect(g,side,start-2,end+2,10,H-11,'#b29e98');wallRect(g,side,start,end,12,H-13,'#c8e2dc');
    for(let x=start+7,i=0;x<end-3;x+=14,i++){
      if(s.key==='bakery'){
        wallArch(g,side,x-5,x+5,14,24,'#dcaf73');wallRect(g,side,x-4,x+4,14,17,'#efd19a');
      }else if(s.key==='icecream'){
        wallArch(g,side,x-4,x+4,17,26,['#e3a5b9','#b8cfa6','#edcc8c'][i%3]);wallRect(g,side,x-2,x+3,12,18,'#d2ac7e');
      }else if(s.key==='workshop'){
        wallRect(g,side,x-4,x+4,13,22,MATH_COLORS[i%6]);wallArch(g,side,x-3,x+3,23,29,MATH_COLORS[(i+2)%6]);
      }else if(s.key==='toys'){
        wallRect(g,side,x-4,x+4,13,23,['#c7afd8','#e7ba7d','#a7cad2'][i%3]);wallRect(g,side,x-2,x+2,23,27,'#f2dbb0');
      }else wallRect(g,side,x-3,x+3,14,23,'#e9c57d');
    }
    wallRect(g,side,start+2,start+3,13,H-15,'#f4ffef');
  }
  const up=p=>({x:p.x,y:p.y-H-3});
  fillPoly(g,[k.T,k.R,k.B,k.L].map(up),mix(s.color,'#fff7df',.4));
  if(s.key==='bakery'){
    // A pitched biscuit roof, loaf sign, brick oven chimney and bun windows.
    const ridge={x:k.T.x+10,y:k.T.y-H-32};
    fillPoly(g,[ridge,up(k.R),up(k.B),{x:k.L.x+8,y:k.L.y-H-19}],'#dca96e');
    for(let i=0;i<6;i++)riverLine(g,[[ridge.x-i*9,ridge.y+i*4],[k.B.x-i*8,k.B.y-H-i*4]],'#efc68c',1);
    px(g,mid.x+23,mid.y-87,15,35,'#bd8a79');px(g,mid.x+20,mid.y-90,21,6,'#d8af8c');
    mathShopBread(g,mid.x-6,mid.y-90,1.15);
  }else if(s.key==='icecream'){
    for(const side of[L,R])for(let x=5;x<side.len-5;x+=7){
      const col=Math.floor(x/7)%2?'#fff4e5':s.color;wallRect(g,side,x,x+7,H-9,H-2,col);
      const p=wallPt(side,x+3,H-11);mathShopOval(g,p.x,p.y,4,3,col);
    }
    mathShopCone(g,mid.x+2,mid.y-94,3,.95);
    for(const[x,y]of[[-38,-61],[35,-44]]){
      riverLine(g,[[mid.x+x,mid.y+y],[mid.x+x+5,mid.y+y-20]],'#c797ad',2);
      mathShopOval(g,mid.x+x+6,mid.y+y-24,9,9,'#e8b6c5','#be8b9f');
    }
  }else if(s.key==='workshop'){
    fillPoly(g,[{x:mid.x-50,y:mid.y-49},{x:mid.x-4,y:mid.y-104},{x:mid.x+41,y:mid.y-50}],'#9eb7d1');
    riverLine(g,[[mid.x-50,mid.y-49],[mid.x-4,mid.y-104],[mid.x+41,mid.y-50]],'#7c91b3',3);
    mathCanvasShape(g,'circle',mid.x-5,mid.y-68,29,'#f5db95');
    px(g,mid.x+32,mid.y-84,25,36,'#e4bd84');
    mathCanvasShape(g,'triangle',mid.x+44,mid.y-94,39,'#d5a1af');
    mathCanvasShape(g,'square',mid.x+44,mid.y-66,18,'#c3d9cd');
    mathCanvasShape(g,'hexagon',mid.x-35,mid.y-62,28,'#c9afd4');
  }else if(s.key==='toys'){
    const top=[k.T,k.R,k.B,k.L].map(p=>({x:p.x,y:p.y-H-13}));fillPoly(g,top,'#b9c794');
    riverLine(g,top.concat(top[0]).map(p=>[p.x,p.y]),'#8f9e78',3);
    mathShopToy(g,mid.x,mid.y-90,'bear',.85);
    for(const[x,col]of[[-34,'#b7c9dc'],[35,'#e5b183']]){
      riverLine(g,[[mid.x+x,mid.y-57],[mid.x+x,mid.y-95]],'#b6a382',1);
      mathShopOval(g,mid.x+x,mid.y-100,10,13,col,'#9c96a3');
    }
  }else{
    const ridge={x:k.T.x+5,y:k.T.y-H-18};
    fillPoly(g,[ridge,up(k.R),up(k.B),{x:k.L.x,y:k.L.y-H-12}],'#88b6ad');
    for(let x=6;x<L.len-4;x+=6)wallRect(g,L,x,x+6,H-1,H+5,Math.floor(x/6)%2?'#f8e6bd':'#6ca49e');
    mathShopOval(g,mid.x,mid.y-70,16,16,'#fff5dc','#8eaa9c');
    riverLine(g,[[mid.x,mid.y-80],[mid.x,mid.y-70],[mid.x+7,mid.y-66]],'#a27e6b',2);
    px(g,mid.x-2,mid.y-72,4,4,'#e1b783');
  }
}
