// Math is a separate subject: its own problem pools and three gentle levels.
// UI wording lives in locales; numbers, shape geometry and limits live here.
PLACES.math = I18n.t('math.place');
const MATH_TOWN_GATE = {cols:[35,36],row:7,back:{c:35,r:10}};
const MATH_START = {c:17,r:37};
const MATH_SHOPS = [
  {key:'bakery',c:8,r:7,w:5,d:4,look:'baker',color:'#e7b36f',topics:['count10','count20','count30']},
  {key:'icecream',c:7,r:22,w:5,d:4,look:'flower',color:'#e6a1b7',topics:['add','subtract']},
  {key:'workshop',c:25,r:10,w:5,d:4,look:'farmer',color:'#a8bad7',topics:['shapeName','sameShape','sides','pattern']},
  {key:'toys',c:26,r:25,w:4,d:3,look:'kid',color:'#b3bf8c',topics:['compare']},
  {key:'station',c:18,r:31,w:5,d:3,look:'bard',color:'#89bdb8',topics:['skip2','missing']},
];
const mathShopFor = topic => MATH_SHOPS.find(s=>s.topics.includes(topic));
const mathHostFor = (sc,topic) => sc.npcs.find(n=>n.mathTopics?.includes(topic));
const MATH_TOPICS = [
  {key:'count10',kind:'mathCount10',icon:'1–10',zone:'count'},
  {key:'count20',kind:'mathCount20',icon:'11–20',zone:'count'},
  {key:'count30',kind:'mathCount30',icon:'21–30',zone:'count'},
  {key:'skip2',kind:'mathSkip2',icon:'+2',zone:'count'},
  {key:'add',kind:'mathAdd',icon:'+',zone:'calculate'},
  {key:'subtract',kind:'mathSubtract',icon:'−',zone:'calculate'},
  {key:'compare',kind:'mathCompare',icon:'> <',zone:'calculate'},
  {key:'missing',kind:'mathMissing',icon:'?',zone:'calculate'},
  {key:'shapeName',kind:'mathShapeName',icon:'● ▲',zone:'shapes'},
  {key:'sameShape',kind:'mathSameShape',icon:'◆ ◆',zone:'shapes'},
  {key:'sides',kind:'mathSides',icon:'3 4 5',zone:'shapes'},
  {key:'pattern',kind:'mathPattern',icon:'● ▲ ●',zone:'shapes'},
];
const MATH_SHAPES = {
  circle:{sides:0}, triangle:{sides:3,points:[[50,9],[92,83],[8,83]]},
  square:{sides:4,points:[[22,22],[78,22],[78,78],[22,78]]},
  rectangle:{sides:4,points:[[10,30],[90,30],[90,70],[10,70]]},
  oval:{sides:0}, star:{sides:null},
  pentagon:{sides:5}, hexagon:{sides:6},
};
for(const [key,n] of [['pentagon',5],['hexagon',6],['star',10]]) {
  MATH_SHAPES[key].points=Array.from({length:n},(_,i)=>{
    const a=-Math.PI/2+i*Math.PI*2/n,rad=key==='star'&&i%2?19:41;
    return [50+Math.cos(a)*rad,50+Math.sin(a)*rad];
  });
}
const MATH_BASIC_SHAPES = ['circle','triangle','square','rectangle','oval','star'];
const MATH_COLORS = ['#e7a18e','#86bdad','#c2aad5','#88bcd4','#e1bc70','#ce9ebb'];
const mathTopic = key => MATH_TOPICS.find(t=>t.key===key||t.kind===key);
