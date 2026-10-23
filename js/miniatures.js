import { s } from './ui.js';
// Small native scene previews for the new rooms, built from the same playable motifs.
export function miniature(g) {
 const art=s('svg',{viewBox:'0 0 400 240',preserveAspectRatio:'xMidYMid slice','aria-hidden':'true'});
 const rect=(x,y,w,h,fill,rx=0)=>s('rect',{x,y,width:w,height:h,fill,rx});
 art.append(rect(0,0,400,240,'#1a3036'),s('circle',{cx:330,cy:30,r:120,fill:g.accent,opacity:.12}));
 if(g.id==='signal'){
  for(let r=0;r<3;r++){
   const y=60+r*63;
   for(let x=0;x<400;x+=17)art.append(rect(x,y-13,5,26,'#635d4d',2));
   art.append(s('path',{d:`M0 ${y-5}H400 M0 ${y+5}H400`,stroke:'#bec6bc','stroke-width':3}));
  }
  art.append(s('path',{class:'mini-train',d:'M80 112h72v30H80z M124 98h28v17h-28z',fill:'#e2af75'}),s('path',{d:'M175 60L255 123 M175 123L255 186',stroke:'#80c5b2','stroke-width':5}));
  for(let r=0;r<3;r++)art.append(rect(344,32+r*63,50,44,['#e6b385','#93bacc','#bad09b'][r],7));
 }else if(g.id==='workshop'){
  for(let r=0;r<3;r++)for(let c=0;c<5;c++){const x=45+c*64,y=29+r*64;art.append(rect(x,y,58,58,'#31494a',9),s('path',{d:`M${x+29} ${y}V${y+29}H${x+58}`,fill:'none',stroke:r===1?'#edcb8e':'#8b7860','stroke-width':10,'stroke-linecap':'round'}),s('circle',{cx:x+29,cy:y+29,r:8,fill:'#d0b17d'}));}
 }else if(g.id==='echo'){
  art.append(s('path',{d:'M0 210Q110 150 220 200T400 185V240H0Z',fill:'#37584d'}));
  for(let i=0;i<4;i++){const x=70+i*85,y=65+(i%2)*35;art.append(s('path',{d:`M${x} ${y+45}V235`,stroke:'#ac9464','stroke-width':5}),rect(x-22,y,44,55,['#e7b086','#8bbacb','#bad190','#b6a0d4'][i],12),s('path',{d:`M${x-30} ${y}Q${x} ${y-30} ${x+30} ${y}Z`,fill:'#b39e74'}),s('text',{x,y:y+35,'text-anchor':'middle',fill:'#243a3b','font-size':22,text:String(i+1)}));}
 }else if(g.id==='casebook'){
  art.append(rect(55,35,290,185,'#6d5444',10),s('path',{d:'M85 65Q145 45 200 65Q255 45 315 65V195Q255 175 200 195Q145 175 85 195Z',fill:'#e2d3b0'}),s('path',{d:'M200 65V195',stroke:'#ac9976','stroke-width':3}));
  for(let r=0;r<5;r++)art.append(rect(108,90+r*17,65,3,'#bca987',1));
  art.append(s('circle',{cx:264,cy:120,r:29,fill:'#80adad',opacity:.7,stroke:'#e1bd77','stroke-width':7}),s('path',{d:'M284 143L315 180',stroke:'#d1ab72','stroke-width':11,'stroke-linecap':'round'}));
 }else{
  art.append(s('path',{d:'M0 130H400 M120 0V240 M280 0V240',stroke:'#647a72','stroke-width':27}));
  for(let i=0;i<8;i++){const x=20+(i%4)*100,y=25+Math.floor(i/4)*140;art.append(rect(x,y+20,55,55,['#c28f74','#98b1ad','#c7b58d'][i%3],4),s('path',{d:`M${x-6} ${y+22}L${x+27} ${y}L${x+61} ${y+22}Z`,fill:'#526e69'}),rect(x+19,y+49,15,26,'#405b59'));}
  art.append(rect(169,112,45,26,'#e5bb79',5),s('circle',{cx:178,cy:139,r:6,fill:'#193339'}),s('circle',{cx:205,cy:139,r:6,fill:'#193339'}));
 }
 return art;
}

export function decorationArt(kind){
 const art=s('svg',{viewBox:'0 0 180 180','aria-hidden':'true'});
 if(kind===1){
  art.append(s('path',{d:'M56 116H132L122 174H68Z',fill:'#c58f67'}),s('path',{d:'M93 130V23',stroke:'#b4bd82','stroke-width':4}));
  for(const [x,y,angle]of [[65,91,-40],[116,71,35],[64,49,-35],[113,29,35],[90,12,0]])art.append(s('ellipse',{cx:x,cy:y,rx:14,ry:30,transform:`rotate(${angle} ${x} ${y})`,fill:y<50?'#a6bd85':'#6d9a71'}));
 }else if(kind===2){
  art.append(s('ellipse',{cx:90,cy:165,rx:46,ry:9,fill:'#c1a06b'}),s('path',{d:'M90 162V53',stroke:'#d5b379','stroke-width':6}),s('path',{d:'M52 20H128L151 81H29Z',fill:'#d3b77d'}),s('ellipse',{cx:90,cy:82,rx:60,ry:9,fill:'#f1d7a0'}));
 }else if(kind===3){
  art.append(s('rect',{x:15,y:89,width:150,height:78,rx:5,fill:'#af865d'}),s('rect',{x:25,y:101,width:130,height:53,fill:'#364f4b'}));
  for(let i=0;i<5;i++)art.append(s('path',{d:`M${33+i*22} 143L${29+i*22} 48L${49+i*22} 43L${53+i*22} 143Z`,fill:['#b4c8b2','#d5b37d','#8fabba','#cba391','#c4be9c'][i]}));
  art.append(s('circle',{cx:100,cy:60,r:38,fill:'#1e3639'}),s('circle',{cx:100,cy:60,r:16,fill:'#dcc596'}),s('circle',{cx:100,cy:60,r:4,fill:'#274343'}));
 }else if(kind===4){
  for(const[x,y,size]of [[20,30,8],[90,20,6],[154,46,9],[120,99,7],[40,128,11],[85,155,5]])art.append(s('path',{d:`M${x-size} ${y}H${x+size} M${x} ${y-size}V${y+size}`,stroke:'#e9d8a2','stroke-width':2}));
  art.append(s('path',{d:'M20 30L90 20L154 46L120 99L40 128L85 155',stroke:'#c6ca9c','stroke-width':1,fill:'none'}));
 }
 return art;
}
