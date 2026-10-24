import {h,s} from '../ui.js';
export function objectArt(id){return h('span',{class:`curio-object object-${id}`,'aria-hidden':'true',style:{'background-position':`${id%5*25}% ${Math.floor(id/5)*20}%`}});}
// Architecture belongs to the playable cabinet: changing rooms changes its frame,
// windows, shelving and materials, while these fixed motifs never reveal an answer.
export function roomDecoration(room){
 const svg=s('svg',{viewBox:'0 0 1000 160',class:'curio-pediment','aria-hidden':'true',preserveAspectRatio:'xMidYMid meet'});
 const path=(d,stroke='#c6a56d',w=2)=>s('path',{d,stroke,'stroke-width':w,fill:'none'});
 if(room==='study'){
  svg.append(path('M50 130Q130 20 350 66L420 110H580L650 66Q870 20 950 130', '#b3915e',4),path('M70 132Q150 50 338 82L405 125H595L662 82Q850 50 930 132'));
  for(const x of [140,240,760,860])svg.append(path(`M${x} 120q-30 -30 0 -50q30 20 0 50m0 -7q-35 13 -45 -5m45 5q35 13 45 -5`));
  svg.append(s('circle',{cx:500,cy:82,r:56,fill:'#392b24',stroke:'#c8a46d','stroke-width':5}),s('circle',{cx:500,cy:82,r:47,fill:'#d8c8a4',stroke:'#6b563b','stroke-width':2}));
  for(let i=0;i<12;i++){const a=i*Math.PI/6;svg.append(path(`M${500+Math.sin(a)*36} ${82-Math.cos(a)*36}L${500+Math.sin(a)*41} ${82-Math.cos(a)*41}`,'#504434',2));}
  svg.append(s('g',{class:'curio-clock-hands'},path('M500 52V82L522 92','#3e423a',4)),s('circle',{cx:500,cy:82,r:4,fill:'#997240'}));
 }else if(room==='glasshouse'){
  svg.append(path('M35 150Q500 -115 965 150','#92c3ae',5),path('M90 150Q500 -57 910 150','#416f62',2));
  for(let x=180;x<1000;x+=160)svg.append(path(`M500 0L${x} 150`,'#8caf96',3));
  for(const x of [100,900])for(let i=0;i<4;i++){const y=130-i*22;svg.append(s('ellipse',{cx:x+(i%2?14:-14),cy:y,rx:22,ry:9,transform:`rotate(${i%2?-35:35} ${x+(i%2?14:-14)} ${y})`,fill:i%2?'#72987c':'#8dad80',opacity:.8}));}
  svg.append(s('path',{d:'M478 120L484 66H516L522 120Z',fill:'#c6b373',stroke:'#ede0ac','stroke-width':2}),path('M490 66Q500 28 510 66','#b8c9aa',3),s('circle',{class:'curio-lamp-glow',cx:500,cy:96,r:17,fill:'#f7e4a1',opacity:.65}));
 }else{
  svg.append(path('M70 150Q500 -95 930 150','#ad9672',3),path('M105 150Q500 -55 895 150','#625a71',1));
  for(let i=0;i<36;i++){const x=90+(i*137%820),y=10+(i*41%130);svg.append(s('circle',{cx:x,cy:y,r:i%4===0?2:1,fill:'#e6d9b5',opacity:.35+(i%3)*.2}));}
  const orbit=s('g',{transform:'translate(500 90)'},s('g',{class:'curio-orbit'},s('circle',{r:52,stroke:'#c9ad70','stroke-width':2,fill:'none'}),s('ellipse',{rx:72,ry:24,transform:'rotate(-30)',stroke:'#d4ba86','stroke-width':2,fill:'none'}),s('circle',{cx:61,cy:-19,r:8,fill:'#a7bdd2',stroke:'#e5d1a1'}),s('circle',{r:19,fill:'#d2b174'})));svg.append(orbit);
 }
 return svg;
}

// Permanent room scenery contains no game objects or position information.
export function roomScene(room){
 const svg=s('svg',{viewBox:'0 0 1600 960',preserveAspectRatio:'xMidYMin slice',class:'curio-room-scene','aria-hidden':'true'});
 const path=(d,stroke,w=1,fill='none',attrs={})=>s('path',{d,stroke,'stroke-width':w,fill,...attrs});
 const rect=(x,y,width,height,fill,extra={})=>s('rect',{x,y,width,height,fill,...extra});
 const defs=s('defs',null,s('linearGradient',{id:'curio-room-light',x2:0,y2:1},s('stop',{offset:0,'stop-color':room==='glasshouse'?'#b7d6ad':'#efce8e','stop-opacity':.13}),s('stop',{offset:1,'stop-color':'#d8c79b','stop-opacity':0})),s('pattern',{id:'curio-wall-grain',width:14,height:14,patternUnits:'userSpaceOnUse'},path('M0 0V14M7 0V14','#dac6a3',.7,'none',{opacity:.045})));
 svg.append(defs,rect(0,0,1600,960,'url(#curio-wall-grain)'));
 for(const x of [120,1460])svg.append(rect(x,50,16,800,'#0a171b33'),path(`M${x+20} 50V850`,'#b39b6a22',3));
 if(room==='study'){
  // Fluted bookcases, leaded windows and a working pendulum.
  for(const x of [170,1250]){svg.append(rect(x,235,180,400,'#142226',{rx:75,stroke:'#96744b','stroke-width':7}),rect(x+9,325,162,275,'#c9a9720b'),path(`M${x+90} 245V630M${x+5} 385H${x+175}M${x+5} 480H${x+175}`,'#957653',4));
   for(let y=345;y<610;y+=45)svg.append(path(`M${x+18} ${y}l70 -43 72 43 -72 43Z`,'#b99d6833',1));
  }
  for(const x of [0,1390])for(let row=0;row<4;row++){const y=335+row*115;for(let i=0;i<8;i++){const w=13+(i*7%9),height=45+(i*13%36);svg.append(rect(x+18+i*22,y-height,w,height,['#524939','#5b4337','#394e4e','#5a4b5c'][i%4],{rx:2}),path(`M${x+20+i*22} ${y-height+8}h${w-4}m0 ${height-18}h${-w+4}`,'#c4ad7844',1));}svg.append(rect(x,y,196,8,'#886b48'),rect(x,y+8,196,7,'#1b2422'));}
  svg.append(path('M139 112Q235 20 331 112V220H139Z','#a2875c',4,'#342f28'),s('circle',{cx:235,cy:132,r:55,fill:'#d5c29b',stroke:'#b99861','stroke-width':5}));
  for(let i=0;i<12;i++){const a=i*Math.PI/6;svg.append(path(`M${235+Math.sin(a)*43} ${132-Math.cos(a)*43}l${Math.sin(a)*-6} ${Math.cos(a)*6}`,'#4c4637',2));}
  svg.append(path('M235 98V132L260 146','#484131',3),s('g',{class:'curio-pendulum'},path('M235 220V302','#baa071',3),s('circle',{cx:235,cy:302,r:18,fill:'#b69a63',stroke:'#e2c490','stroke-width':3})));
  for(const x of [90,1500]){svg.append(path(`M${x} 725V640m-24 85h48m-13 -85v-45h-22v45Z`,'#bd9c64',3,'#887347'),s('ellipse',{class:'curio-candle',cx:x,cy:577,rx:5,ry:13,fill:'#ffe3a1'}));}
 }else if(room==='glasshouse'){
  for(let x=50;x<1600;x+=190)svg.append(path(`M800 -100L${x} 860`,'#6a998542',6));
  for(let y=90;y<900;y+=160)svg.append(path(`M0 ${y}Q800 ${y-100} 1600 ${y}`,'#9eb99722',3));
  for(const side of [0,1]){const group=s('g',{class:side?'curio-frond right':'curio-frond'});for(let i=0;i<9;i++){const x=side?1505-i*12:95+i*12,y=800-i*46;group.append(path(`M${side?1535:65} 910Q${x} ${y+70} ${x} ${y}`,'#668d67',4));for(let k=0;k<4;k++)group.append(s('ellipse',{cx:x+(side?-1:1)*k*6,cy:y+k*18,rx:32-k*3,ry:10,transform:`rotate(${side?-30:30} ${x} ${y+k*18})`,fill:i%2?'#6d936e':'#91aa79',opacity:.45}));}svg.append(group);}
  for(const x of [190,1410])svg.append(path(`M${x} 0V185`,'#b2b18b77',2),path(`M${x-30} 185H${x+30}L${x+22} 222H${x-22}Z`,'#a69569',2,'#4c6650'));
  svg.append(path('M250 80L700 800H980L430 80Z','none',0,'url(#curio-room-light)'));
 }else{
  svg.append(path('M35 700Q35 -200 800 -130Q1565 -200 1565 700','#9b917266',7),path('M100 700Q100 -130 800 -70Q1500 -130 1500 700','#5f697955',3));
  for(const x of [120,320,1280,1480])svg.append(path(`M800 -140Q${x} 220 ${x} 810`,'#9b8d6744',3));
  for(let i=0;i<90;i++){const x=(i*137+30)%1600,y=(i*97+20)%750;svg.append(s('circle',{cx:x,cy:y,r:i%9===0?2:1,fill:'#d6d6c4',opacity:.15+i%4*.09,class:i%6===0?'curio-twinkle':''}));}
  svg.append(path('M80 410L155 295 260 350 285 210M1365 370L1400 240 1510 285 1480 415','#b9bbd950',1));
  for(const [x,y]of [[80,410],[155,295],[260,350],[285,210],[1365,370],[1400,240],[1510,285],[1480,415]])svg.append(s('circle',{cx:x,cy:y,r:3,fill:'#dfd7be'}));
  const orrery=s('g',{transform:'translate(1400 600)'},s('g',{class:'curio-scene-orbit'},s('ellipse',{rx:110,ry:35,stroke:'#ab9871','stroke-width':3,fill:'none',transform:'rotate(-35)'}),s('ellipse',{rx:100,ry:55,stroke:'#82725a','stroke-width':2,fill:'none',transform:'rotate(35)'}),s('circle',{cx:70,cy:-55,r:13,fill:'#90a8a8',stroke:'#e0cf98','stroke-width':2}),s('circle',{r:28,fill:'#c2a16c'})),path('M0 30V115M-55 115H55','#ad9161',5));svg.append(orrery,path('M100 730L260 660 280 690 120 765Z','#b6a37d',2,'#637381'),path('M205 720L160 845M205 720L255 845M160 845H255','#a58d67',4));
 }
 for(let i=0;i<12;i++)svg.append(s('circle',{cx:90+i*127,cy:120+i*67%640,r:1+i%2,fill:'#e7d6ad',opacity:.12,class:'curio-dust',style:{'animation-delay':`-${i*1.3}s`}}));
 svg.append(path('M0 850H1600M0 870H1600','#b2a47722',3));for(let x=-600;x<2100;x+=230)svg.append(path(`M800 850L${x} 960`,'#b2a47711',1));return svg;
}
