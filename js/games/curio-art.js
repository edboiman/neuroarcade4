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
