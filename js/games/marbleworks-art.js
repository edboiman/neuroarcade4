import * as M from './marbleworks-core.js';
// All ornament is visual. Rails, marble radius and target mouth match the physics engine.
export function createMarbleRenderer(canvas){
 const g=canvas.getContext('2d'),bench=canvas.ownerDocument.createElement('canvas');bench.width=1800;bench.height=1120;const bg=bench.getContext('2d');
 let lastBall=null,seen=[],lastBump=0,particles=[];
 const round=(c,x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
 const line=(c,x,y,x2,y2,color,width=1)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();};
 function screw(c,x,y,r=3){c.fillStyle='#201d19';c.beginPath();c.arc(x+1,y+1,r+1,0,Math.PI*2);c.fill();const m=c.createLinearGradient(x-r,y-r,x+r,y+r);m.addColorStop(0,'#ffe3aa');m.addColorStop(.4,'#b49560');m.addColorStop(1,'#655036');c.fillStyle=m;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();line(c,x-r*.6,y+r*.3,x+r*.6,y-r*.3,'#473d31',1);}
 function gear(c,x,y,r,angle=0,color='#9e8052') {c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;for(let i=0;i<12;i++){c.rotate(Math.PI/6);c.fillRect(-r*.15,-r*1.12,r*.3,r*.35);}c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.fillStyle='#152b2e';c.beginPath();c.arc(0,0,r*.66,0,Math.PI*2);c.fill();for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.fillStyle=color;c.fillRect(-2,0,4,r*.8);}screw(c,0,0,r*.17);c.restore();}
 function makeBench(){bg.scale(2,2);let grad=bg.createLinearGradient(0,0,900,560);grad.addColorStop(0,'#73523a');grad.addColorStop(.4,'#3f3028');grad.addColorStop(.8,'#68503a');grad.addColorStop(1,'#352b25');bg.fillStyle=grad;bg.fillRect(0,0,900,560);
 for(let y=0;y<560;y+=3){bg.beginPath();bg.moveTo(0,y);for(let x=0;x<=900;x+=40)bg.lineTo(x,y+Math.sin(x*.014+y)*2);bg.strokeStyle=y%9===0?'#e3bc7720':'#160f0c22';bg.lineWidth=.7;bg.stroke();}
 round(bg,12,12,876,528,14,'#172b2d','#b08c58');round(bg,18,18,864,516,9,'#203b3e','#0b2023');
 const felt=bg.createRadialGradient(380,180,10,450,250,580);felt.addColorStop(0,'#335257');felt.addColorStop(.65,'#254247');felt.addColorStop(1,'#142e33');round(bg,22,22,856,508,7,felt);
 for(let y=28;y<530;y+=7)for(let x=28;x<878;x+=11){bg.fillStyle=(x+y)%3?'#b4c5b006':'#0000000b';bg.fillRect(x,y,2,1);}
 bg.strokeStyle='#c4d4be0b';bg.lineWidth=.7;for(let x=50;x<880;x+=25){bg.beginPath();bg.moveTo(x,30);bg.lineTo(x,520);bg.stroke();}for(let y=50;y<530;y+=25){bg.beginPath();bg.moveTo(30,y);bg.lineTo(870,y);bg.stroke();}
 // Calibrated brass rulers and inset corner pieces frame the usable board.
 for(let x=35;x<875;x+=10)line(bg,x,535,x,535+(x%50===5?7:3),'#c6aa7777');
 for(let y=35;y<520;y+=10)line(bg,11,y,y%50===5?18:14,y,'#dac28b77');
 for(const [x,y]of [[26,26],[874,26],[26,522],[874,522]]){bg.save();bg.translate(x,y);bg.rotate(x>450?Math.PI:0);bg.strokeStyle='#ceb57966';bg.lineWidth=2;bg.beginPath();bg.moveTo(0,25);bg.lineTo(0,0);bg.lineTo(25,0);bg.stroke();bg.restore();screw(bg,x,y,3);}
 bg.font='9px monospace';bg.textAlign='right';bg.fillStyle='#c7c9aa66';bg.fillText('M A R B L E W O R K S   /   PRECISION ATELIER',855,513);
 for(let i=0;i<3;i++){bg.strokeStyle='#8db7b40b';bg.beginPath();bg.arc(735,110,45+i*8,0,Math.PI*2);bg.stroke();}bg.save();bg.globalAlpha=.16;gear(bg,820,82,21,.1);gear(bg,853,116,27,-.2);bg.restore();
 }
 makeBench();
 function stroke(p,color,width,offset=0){line(g,p.x,p.y+offset,p.x2,p.y2+offset,color,width);}
 function rail(p,selected,ghost=false){g.save();g.globalAlpha=ghost?.32:1;g.shadowColor='#000a';g.shadowBlur=7;g.shadowOffsetY=7;stroke(p,'#0c1b1e',17);g.shadowBlur=0;g.shadowOffsetY=0;
 const wood=g.createLinearGradient(0,p.y-7,0,p.y+7);wood.addColorStop(0,'#f2d29d');wood.addColorStop(.25,'#b58453');wood.addColorStop(.55,'#7f5536');wood.addColorStop(1,'#4b3428');stroke(p,selected?'#99d4b8':wood,12);
 stroke(p,'#503e2b',4,-2);stroke(p,selected?'#ebfff0':'#f3dcae',1.4,-5);stroke(p,'#dfbe8244',1,3);
 const dx=p.x2-p.x,dy=p.y2-p.y;for(let i=1;i<8;i++){const t=i/8;line(g,p.x+dx*t-5,p.y+dy*t+1,p.x+dx*t+4,p.y+dy*t+2,'#271e151f',.6);}
 for(const [x,y]of [[p.x,p.y],[p.x2,p.y2]]){round(g,x-7,y-6,14,12,3,'#aa8850');screw(g,x,y,3);}
 if(selected){g.setLineDash([3,5]);stroke(p,'#d9ffe270',23);g.setLineDash([]);}g.restore();}
 function star(x,y,collected,t){g.save();g.translate(x,y);if(!collected){g.globalAlpha=.22;g.strokeStyle='#e6c178';g.beginPath();g.arc(0,0,23,0,Math.PI*2);g.stroke();g.globalAlpha=1;g.rotate(Math.sin(t*.8)*.1);}g.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?6:14;g.lineTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();const gr=g.createLinearGradient(-10,-10,10,15);gr.addColorStop(0,collected?'#597c72':'#fff0b3');gr.addColorStop(.4,collected?'#354f49':'#edbd55');gr.addColorStop(1,collected?'#1c3a35':'#b36b2c');g.fillStyle=gr;g.shadowColor='#f7c565';g.shadowBlur=collected?0:9+Math.sin(t*2)*3;g.fill();g.shadowBlur=0;g.lineWidth=1;g.strokeStyle=collected?'#81a09277':'#ffe6a2';g.stroke();if(collected){g.strokeStyle='#b3dac6';g.lineWidth=2;g.beginPath();g.moveTo(-5,0);g.lineTo(-1,4);g.lineTo(6,-4);g.stroke();}g.restore();}
 function piece(p,index,chosen,t,ghost){if(p.kind==='ramp')return rail(M.segment(p),index===chosen,ghost);g.save();g.globalAlpha=ghost?.3:1;g.translate(p.x,p.y);
 if(p.kind==='bumper'){g.shadowColor='#0009';g.shadowBlur=6;g.shadowOffsetY=5;g.fillStyle='#573f2e';g.beginPath();g.arc(0,0,26,0,Math.PI*2);g.fill();g.shadowBlur=0;g.shadowOffsetY=0;gear(g,0,0,24,-p.a*Math.PI/180,'#c3a56d');g.fillStyle='#63392f';g.beginPath();g.arc(0,0,20,0,Math.PI*2);g.fill();const gr=g.createRadialGradient(-7,-8,2,0,0,20);gr.addColorStop(0,'#ffa68d');gr.addColorStop(.45,'#c55642');gr.addColorStop(1,'#6a2c27');g.fillStyle=gr;g.beginPath();g.arc(0,-1,17,0,Math.PI*2);g.fill();g.strokeStyle='#f6b98a';g.lineWidth=1;g.stroke();g.rotate(-p.a*Math.PI/180);g.fillStyle='#ffe6b5';g.beginPath();g.moveTo(12,0);g.lineTo(0,-5);g.lineTo(0,5);g.closePath();g.fill();}
 else{const haze=g.createLinearGradient(0,-180,0,0);haze.addColorStop(0,'#a1ead300');haze.addColorStop(1,'#a1ead31a');g.fillStyle=haze;g.beginPath();g.moveTo(-38,-180);g.lineTo(38,-180);g.lineTo(27,0);g.lineTo(-27,0);g.fill();g.lineWidth=1.5;
 for(let i=0;i<7;i++){const y=-18-((t*35+i*23)%160);g.globalAlpha=(ghost?.3:1)*(1-Math.abs(y+80)/100)*.35;g.strokeStyle='#bde9dc';g.beginPath();g.moveTo(-26,y);g.quadraticCurveTo(-18,y-7,-22,y-13);g.moveTo(26,y);g.quadraticCurveTo(18,y-7,22,y-13);g.stroke();}g.globalAlpha=ghost?.3:1;
 round(g,-30,-8,60,27,6,'#17292c','#ad9b73');round(g,-27,-6,54,18,3,'#42676a','#719e9c');g.save();g.translate(0,2);g.rotate(t*4);for(let i=0;i<4;i++){g.rotate(Math.PI/2);g.fillStyle='#a8c3b5';g.beginPath();g.ellipse(8,0,8,3,.3,0,Math.PI*2);g.fill();}g.restore();screw(g,0,2,3);for(const x of [-24,24])screw(g,x,3,2);}
 if(index===chosen){g.strokeStyle='#bdf0d2';g.lineWidth=1.5;g.setLineDash([3,4]);round(g,-33,-34,66,68,8,null,'#c7f4da');g.setLineDash([]);}g.restore();}
 function emit(x,y,t,color,n=12){for(let i=0;i<n;i++){const a=i*Math.PI*2/n;particles.push({x,y,t,color,vx:Math.cos(a)*(25+i%3*13),vy:Math.sin(a)*45-30});}particles=particles.slice(-80);}
 function marble(b,t){g.save();g.translate(b.x,b.y);g.shadowColor='#000a';g.shadowBlur=7;g.shadowOffsetY=5;let gr=g.createRadialGradient(-3,-4,.5,0,0,9);gr.addColorStop(0,'#ffffff');gr.addColorStop(.18,'#d4fbf1');gr.addColorStop(.45,'#79bcb9');gr.addColorStop(.73,'#254c61');gr.addColorStop(1,'#b0dfd7');g.fillStyle=gr;g.beginPath();g.arc(0,0,9,0,Math.PI*2);g.fill();g.shadowBlur=0;g.shadowOffsetY=0;g.save();g.beginPath();g.arc(0,0,8,0,Math.PI*2);g.clip();g.rotate((b.t||0)*3+t*.1);g.strokeStyle='#a3f1ca99';g.lineWidth=3;g.beginPath();g.ellipse(0,0,3,11,.5,0,Math.PI*2);g.stroke();g.restore();g.fillStyle='#fff';g.globalAlpha=.8;g.beginPath();g.ellipse(-3,-4,2.5,1.5,-.5,0,Math.PI*2);g.fill();g.restore();}
 function draw(run,{ball=null,selected=-1,hint=false,time=0,reduce=false}={}){
 const t=reduce?0:time,l=M.definition(run);g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,canvas.width,canvas.height);g.drawImage(bench,0,0);g.setTransform(2,0,0,2,0,0);
 if(ball!==lastBall){lastBall=ball;seen=l.stars.map(()=>false);lastBump=0;particles=[];}
 l.fixed.forEach(p=>rail(p,false));if(hint&&!run.sandbox)M.LEVELS[run.level].solution.forEach(p=>piece(p,-2,-1,t,true));run.pieces.forEach((p,i)=>piece(p,i,selected,t,false));
 l.stars.forEach((s,i)=>{const on=!!ball?.stars[i];if(on&&!seen[i]&&!reduce)emit(s.x,s.y,time,'#f5d183',16);seen[i]=on;star(s.x,s.y,on,t);});
 if(ball?.bump>lastBump&&!reduce)emit(ball.x,ball.y,time,'#e8a186',8);lastBump=ball?.bump||0;
 // Mechanical dispenser above the exact release position.
 round(g,l.source.x-18,8,36,Math.max(8,l.source.y-7),5,'#182a2d','#a48a5f');for(let x=-12;x<=12;x+=6)line(g,l.source.x+x,13,l.source.x+x,l.source.y-7,'#577b7b',1);round(g,l.source.x-25,l.source.y-6,50,9,3,'#c0a06c','#f1dba7');screw(g,l.source.x-20,l.source.y-2,2);screw(g,l.source.x+20,l.source.y-2,2);
 const c=l.goal;g.save();g.shadowColor='#0008';g.shadowBlur=12;g.shadowOffsetY=7;const metal=g.createLinearGradient(c.x-34,0,c.x+34,0);metal.addColorStop(0,'#5e462d');metal.addColorStop(.22,'#b28c50');metal.addColorStop(.4,'#f1d396');metal.addColorStop(.6,'#b68b4e');metal.addColorStop(.85,'#d0ad6d');metal.addColorStop(1,'#5b432b');g.fillStyle=metal;g.beginPath();g.moveTo(c.x-34,c.y);g.lineTo(c.x-25,c.y+42);g.quadraticCurveTo(c.x,c.y+54,c.x+25,c.y+42);g.lineTo(c.x+34,c.y);g.fill();g.shadowBlur=0;g.shadowOffsetY=0;g.fillStyle='#102529';g.beginPath();g.ellipse(c.x,c.y,M.CUP.opening,7,0,0,Math.PI*2);g.fill();g.lineWidth=3;g.strokeStyle='#f0d29a';g.stroke();round(g,c.x-17,c.y+20,34,14,3,'#6c5333','#d9b779');g.font='8px monospace';g.textAlign='center';g.fillStyle='#f5e3b6';g.fillText('GOAL',c.x,c.y+30);round(g,c.x-29,c.y+48,58,5,2,'#a88954');g.restore();
 if(ball?.trail.length){g.beginPath();ball.trail.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.lineWidth=2;g.strokeStyle='#b5e3d440';g.setLineDash([2,5]);g.stroke();g.setLineDash([]);}
 if(!ball||ball.status!=='delivered')marble(ball||l.source,t);
 particles=particles.filter(p=>time-p.t<.85);if(!reduce)for(const p of particles){const age=time-p.t;g.globalAlpha=Math.max(0,1-age/.85);g.fillStyle=p.color;g.save();g.translate(p.x+p.vx*age,p.y+p.vy*age+75*age*age);g.rotate(age*3);g.fillRect(-2,-2,4,4);g.restore();}g.globalAlpha=1;
 if(ball?.status==='delivered'){round(g,310,28,280,48,10,'#102c2de8','#cbb783');g.font='23px Georgia';g.textAlign='center';g.fillStyle='#f0dfad';g.fillText('A little engineering magic.',450,59);}
 }
 return{draw};
}
