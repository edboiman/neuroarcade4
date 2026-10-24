import {s} from '../ui.js';
import * as C from './conquest-core.js';
const palette=['#63867c','#a39b70','#7c9a7c','#c29b66','#7e8970','#8c83a0'];
const hash=(x,y)=>Math.sin(x*1.73+y*.79)*43758.5453%1;
const key=p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`;
const base=r=>Array.from({length:6},(_,i)=>{const a=(60*i-30)*Math.PI/180;return{x:Math.round((r.x+Math.cos(a)*44)*100)/100,y:Math.round((r.y+Math.sin(a)*44)*100)/100};});
const warp=p=>({x:p.x+hash(p.x,p.y)*8,y:p.y+hash(p.y,p.x)*7});
const edge=(a,b)=>{const p=warp(a),q=warp(b),mx=(p.x+q.x)/2,my=(p.y+q.y)/2;return`M${p.x} ${p.y}Q${mx+hash(mx,my)*4} ${my+hash(my,mx)*4} ${q.x} ${q.y}`;};
export const territoryPath=r=>{const vertices=base(r);return vertices.map((a,i)=>edge(a,vertices[(i+1)%6]).replace(i?'M':'M',i?'L':'M')).join('')+'Z';};
function coast(ci){const edges=new Map();for(const r of C.REGIONS.filter(r=>r.c===ci)){const v=base(r);v.forEach((a,i)=>{const b=v[(i+1)%6],k=[key(a),key(b)].sort().join('|');if(edges.has(k))edges.delete(k);else edges.set(k,[a,b]);});}return[...edges.values()].map(([a,b])=>edge(a,b)).join('');}
const route=(a,b)=>{const p=C.REGIONS[a],q=C.REGIONS[b],dx=q.x-p.x,dy=q.y-p.y,curve=Math.min(45,Math.hypot(dx,dy)*.14);return`M${p.x} ${p.y}Q${(p.x+q.x)/2-dy/Math.hypot(dx,dy)*curve} ${(p.y+q.y)/2+dx/Math.hypot(dx,dy)*curve} ${q.x} ${q.y}`;};
const path=(d,stroke,width,extra={})=>s('path',{d,fill:'none',stroke,'stroke-width':width,...extra});
export function renderAtlas(svg,run,{selected=-1,onPick,lastBattle}={}){
 const defs=s('defs',null,s('radialGradient',{id:'bf-sea'},s('stop',{offset:0,'stop-color':'#315662'}),s('stop',{offset:1,'stop-color':'#152c38'})),s('linearGradient',{id:'bf-foil',x1:0,y1:0,x2:1,y2:1},s('stop',{offset:0,'stop-color':'#f0dba9','stop-opacity':.2}),s('stop',{offset:1,'stop-color':'#152b2b','stop-opacity':.3})),s('pattern',{id:'bf-ocean-etch',width:44,height:32,patternUnits:'userSpaceOnUse'},path('M4 18q8 -5 16 0t16 0','#b0c9c3',.8,{opacity:.09})),s('marker',{id:'bf-arrow',viewBox:'0 0 10 10',refX:24,refY:5,markerWidth:6,markerHeight:6,orient:'auto'},s('path',{d:'M0 0L10 5 0 10Z',fill:'#f5d995'})));
 const ocean=s('g',{'aria-hidden':'true'},s('rect',{width:980,height:660,fill:'url(#bf-sea)'}),s('rect',{x:12,y:12,width:956,height:636,rx:8,fill:'url(#bf-ocean-etch)',stroke:'#baa87955','stroke-width':1}),s('rect',{x:18,y:18,width:944,height:624,rx:5,fill:'none',stroke:'#baa87922','stroke-width':1}));
 for(let x=80;x<980;x+=100)ocean.append(path(`M${x} 25Q${x-65} 330 ${x} 635`,'#becbc0',.7,{opacity:.07}));for(let y=75;y<650;y+=85)ocean.append(path(`M25 ${y}Q490 ${y+20} 955 ${y}`,'#becbc0',.7,{opacity:.07}));
 const sea=s('g',{'aria-hidden':'true'});for(const [a,b]of C.SEA_LINKS)sea.append(path(route(a,b),'#adc4bd',1.5,{class:'bf-sea-route','stroke-dasharray':'2 6',opacity:.46}));
 const coasts=s('g',{'aria-hidden':'true'});C.CONTINENTS.forEach((c,i)=>{const d=coast(i);coasts.append(path(d,'#051d28',17,{opacity:.65,'stroke-linejoin':'round'}),path(d,'#7bb0ad',11,{opacity:.13,'stroke-linejoin':'round'}),path(d,'#e6d8a3',5,{opacity:.65,'stroke-linejoin':'round'}));});
 const territories=C.REGIONS.map(r=>{
 const p=C.FACTIONS[run.owner[r.id]],chosen=selected===r.id,target=selected>=0&&C.canAttack(run,selected,r.id),friendly=selected>=0&&selected!==r.id&&run.phase==='fortify'&&!run.fortified&&C.connected(run,selected,r.id),d=territoryPath(r),choose=()=>onPick(r.id);
 const group=s('g',{class:'territory'+(chosen?' selected':'')+(target?' reachable':'')+(friendly?' friendly-target':'')+(lastBattle?.conquered&&lastBattle.to===r.id?' just-captured':''),role:'button',tabindex:0,'data-region':r.id,'aria-label':`${r.name}: ${p.name}, ${run.armies[r.id]} troops`,onclick:choose,onkeydown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}}},s('path',{class:'land',d,fill:p.dark}),s('path',{d,fill:palette[r.c],opacity:.2,'pointer-events':'none'}),s('path',{d,fill:'url(#bf-foil)','pointer-events':'none'}));
 // Different physical terrain makes each continent recognizable beyond its label.
 const terrain=s('g',{'pointer-events':'none',opacity:.4});for(let i=0;i<3;i++){const x=r.x-20+i*16,y=r.y-21+(i%2)*7;
 if([0,4].includes(r.c))terrain.append(s('path',{d:`M${x-5} ${y+4}l5 -12 5 12h-10m5 -6v13`,fill:palette[r.c],stroke:'#d1d5ac','stroke-width':.7}));
 else if([1,5].includes(r.c))terrain.append(s('path',{d:`M${x-6} ${y+5}v-9h4v-5h4v5h4v9Z`,fill:'#c4bca0',stroke:'#243d41','stroke-width':.7}));
 else if(r.c===2)terrain.append(path(`M${x-7} ${y+4}q7 -12 14 0m-11 -5q4 -9 8 0`,'#dce1ae',1));
 else terrain.append(path(`M${x-8} ${y+5}q8 -11 16 0m-16 4q8 -11 16 0`,'#e6cc91',1));}
 group.append(terrain,s('text',{class:'region-name',x:r.x,y:r.y+28,'text-anchor':'middle'},r.name),s('g',{class:'bf-army-token'},s('circle',{cx:r.x,cy:r.y+2,r:17,fill:'#142c36',stroke:p.color,'stroke-width':2}),s('path',{d:`M${r.x-20} ${r.y-5}v15m0 -14h-8l3 4 -3 4h8`,fill:p.color,stroke:'#111e2a','stroke-width':1}),s('text',{class:'army-number',x:r.x,y:r.y+8,'text-anchor':'middle'},run.armies[r.id])));
 return group;
 });
 const labels=s('g',{'aria-hidden':'true'});C.CONTINENTS.forEach((c,i)=>{const control=run.owner[i*5],held=C.REGIONS.filter(r=>r.c===i).every(r=>run.owner[r.id]===control);labels.append(s('text',{x:c.x,y:c.y+125,'text-anchor':'middle',class:'bf-continent-name'},c.name),s('text',{x:c.x,y:c.y+143,'text-anchor':'middle',class:'bf-continent-bonus'},held?`${C.FACTIONS[control].name.toUpperCase()} · +${c.bonus}`:`CONTROL ALL FIVE · +${c.bonus}`));});
 const emphasis=s('g',{'aria-hidden':'true','pointer-events':'none'});if(lastBattle){const p=C.REGIONS[lastBattle.from],q=C.REGIONS[lastBattle.to];emphasis.append(path(route(p.id,q.id),lastBattle.conquered?'#ead49c':'#df9e84',3,{'stroke-dasharray':'4 6',class:'bf-battle-route','marker-end':'url(#bf-arrow)'}));}
 const compass=s('g',{transform:'translate(925 327)','aria-hidden':'true'},s('circle',{r:27,fill:'#203e48',stroke:'#bfaf7a77'}),path('M0 -23L6 -6 20 0 6 6 0 23 -6 6 -20 0 -6 -6Z','#d6c292',1.4,{fill:'#baaa7344'}),path('M0 -34V34M-32 0H32','#e0cf9f',.6,{opacity:.5}),s('text',{y:-39,'text-anchor':'middle',fill:'#dbc89a','font-size':11,'font-family':'Georgia'},'N'));
 svg.replaceChildren(s('title',null,'Bannerfall — atlas of the six realms'),defs,ocean,sea,coasts,...territories,labels,emphasis,compass,s('text',{x:35,y:625,class:'bf-chart-label','aria-hidden':'true'},'ATLAS OF THE SIX REALMS  /  CAMPAIGN EDITION'));
}
