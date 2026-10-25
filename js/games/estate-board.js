import {s} from '../ui.js';
import * as E from './estate-core.js';
export const TILE_SIZE=64;
export const cityCell=i=>i<=10?[10-i,10]:i<=20?[0,20-i]:i<=30?[i-20,0]:[10,i-30];
// A shallow oblique camera: actual top, front and side faces share one projection.
export const project=(x,y,z=0)=>({x:40+x*.93+y*.17,y:43+y*.70-z});
const pts=a=>a.map(p=>`${p.x},${p.y}`).join(' ');
const polygon=(a,fill,extra={})=>s('polygon',{points:pts(a),fill,...extra});
const plane=(x,y,w,h,z=0)=>[project(x,y,z),project(x+w,y,z),project(x+w,y+h,z),project(x,y+h,z)];
const text=(p,value,extra={})=>s('text',{x:p.x,y:p.y,'text-anchor':'middle',...extra},value);
const line=(a,b,stroke,width=1,extra={})=>s('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke,'stroke-width':width,...extra});
function building(x,y,w,d,height,color,hotel=false){
 const group=s('g',{'aria-hidden':'true'}),a=plane(x,y,w,d,height),floor=plane(x,y,w,d);
 group.append(polygon([a[1],floor[1],floor[2],a[2]],hotel?'#86614f':'#63766a'),polygon([a[3],a[2],floor[2],floor[3]],hotel?'#bc8b61':color),polygon(a,hotel?'#f2d09a':'#d6d8b4',{stroke:'#f0e4ba88','stroke-width':.8}));
 for(let row=7;row<height-2;row+=7)for(let col=4;col<w-2;col+=7){const p=project(x+col,y+d,row);group.append(s('rect',{x:p.x,y:p.y,width:2.4,height:3,fill:'#f8e6ad',opacity:.85}));}
 if(hotel){const p=project(x+w/2,y+d,height+5);group.append(text(p,'H',{fill:'#ffe5ad','font-size':6,'font-weight':700}));}
 return group;
}
function centerScene(){
 const group=s('g',{'aria-hidden':'true'});
 group.append(polygon(plane(68,68,568,568),'#254b4b',{stroke:'#c6b382','stroke-width':2}),polygon(plane(81,81,542,542),'#315b57',{stroke:'#c5c79844','stroke-width':1}));
 // Printed map lines, raised parks, streets and an original miniature city.
 for(let x=120;x<610;x+=70)group.append(line(project(x,90),project(x,612),'#b1c6ae',.65,{opacity:.12}));
 for(let y=120;y<610;y+=70)group.append(line(project(90,y),project(612,y),'#b1c6ae',.65,{opacity:.12}));
 group.append(text(project(352,145,8),'TYCOON ROW',{class:'es-sculpted-title'}),text(project(352,177,8),'THE WORLD CITY EXCHANGE',{class:'es-sculpted-subtitle'}));
 group.append(polygon(plane(150,253,415,263),'#244947',{stroke:'#749984','stroke-width':1}),polygon(plane(166,269,385,232),'#3e6557'));
 for(const y of [308,383,458])group.append(polygon(plane(166,y,385,14),'#9d9c7a'),line(project(168,y+7),project(550,y+7),'#dfd4a3',.6,{'stroke-dasharray':'5 8'}));
 for(const x of [213,324,440,516])group.append(polygon(plane(x,269,12,232),'#9d9c7a'));
 const blocks=[[180,280,22,22,22],[246,276,33,28,43],[287,277,22,25,61],[350,277,32,27,45],[396,273,22,26,77],[469,278,25,25,33],[185,334,30,29,25],[245,336,23,28,64],[280,330,30,33,91],[350,338,35,26,47],[398,333,24,30,70],[470,332,26,30,50],[181,410,27,26,21],[246,407,25,30,45],[285,405,24,31,66],[350,411,30,25,26],[393,404,27,33,56],[470,410,28,28,39]];
 for(const [i,b]of blocks.entries())group.append(building(...b,['#acba9a','#b7ac87','#8da997','#c2b89a'][i%4],i===8));
 const needle=project(411,286,114);group.append(line(project(411,286,75),needle,'#e2c891',2),s('circle',{cx:needle.x,cy:needle.y,r:2.5,fill:'#f1d79b'}));
 for(const [x,y]of [[532,344],[534,427],[185,478],[270,478],[385,480]]){const p=project(x,y,4);group.append(s('ellipse',{cx:p.x,cy:p.y+4,rx:11,ry:4,fill:'#102f3066'}),line(p,project(x,y,18),'#917650',3),s('circle',{cx:p.x,cy:p.y-14,r:9,fill:'#6f9b76'}),s('circle',{cx:p.x-4,cy:p.y-18,r:6,fill:'#9caf7c'}));}
 group.append(text(project(352,566,2),'22 CITY DEEDS  ·  8 COUNTRY SETS',{class:'es-sculpted-note'}),text(project(352,598,2),'BUILD A WORLDWIDE PORTFOLIO',{class:'es-sculpted-note small'}));
 return group;
}
const blend=(hex)=>{const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16));return'#'+rgb.map((v,i)=>Math.round(v*.32+[231,224,200][i]*.68).toString(16).padStart(2,'0')).join('');};
export function createEstateBoard(onTile){
 const svg=s('svg',{class:'es-board-3d',viewBox:'0 0 860 610',role:'group','aria-label':'Tycoon Row 3D world-city board. Forty spaces. Arrow keys move between deeds; Enter inspects.'});
 const scene=s('g',{'aria-hidden':'true'},s('ellipse',{cx:452,cy:554,rx:362,ry:25,fill:'#000',opacity:.28}));
 const surface=plane(0,0,704,704),bottom=plane(0,0,704,704,-23);
 scene.append(polygon([surface[1],surface[2],bottom[2],bottom[1]],'#705b40'),polygon([surface[3],surface[2],bottom[2],bottom[3]],'#a48556'),polygon(surface,'#b4aa85',{stroke:'#e0cca1','stroke-width':4}),centerScene());
 for(let i=0;i<=11;i++){const a=project(i*64,704,-5),b=project(i*64,704,-17);scene.append(line(a,b,'#6c593b',1,{opacity:.4}));}
 const tiles=[],tokens=[],tokenLayer=s('g',{class:'es-pawn-layer','pointer-events':'none'});
 svg.append(s('title',null,'Tycoon Row — world city exchange'),scene);
 for(const t of E.TILES){
 const [col,row]=cityCell(t.i),x=col*64,y=row*64,p=project(x+32,y+(row===0?32:43)),country=t.type==='prop'?E.GROUPS[t.group].name:null;
 const face=polygon(plane(x+1.5,y+1.5,61,61),'#e7e0c8',{class:'es-city-face',stroke:'#8d8d6a','stroke-width':1});
 const group=s('g',{class:'es-city-tile '+t.type,role:'button',tabindex:0,'data-tile':t.i,'aria-label':t.name,onclick:()=>onTile(t.i),onkeydown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onTile(t.i);}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();tiles[(t.i+(['ArrowRight','ArrowDown'].includes(e.key)?1:39))%40].el.focus();}}},face);
 if(country){const band= row===10?plane(x+3,y+3,58,9):row===0?plane(x+3,y+52,58,9):col===0?plane(x+52,y+3,9,58):plane(x+3,y+3,9,58);group.append(polygon(band,E.GROUPS[t.group].color,{class:'es-city-band','pointer-events':'none'}));}
 const figure=s('g',{class:'es-development','pointer-events':'none'}),name=text(p,t.short,{class:'es-city-name','pointer-events':'none'}),price=text({x:p.x,y:p.y+10},t.price?'$'+t.price:({start:'+$200',park:'BONUS',goto:'DETOUR',jail:'VISITING',wild:'DRAW',tax:'PAY'}[t.type]||''),{class:'es-city-price','pointer-events':'none'}),badge=text(project(x+32,y+21),t.type==='prop'?['PT','ES','IT','FR','DE','JP','AU','US'][t.group]:({start:'↗',park:'♧',goto:'→',jail:'Ⅱ',wild:'?',tax:'$',station:'↔',utility:t.i===12?'ϟ':'≈'}[t.type]||''),{class:'es-city-badge','pointer-events':'none'});
 group.append(figure,badge,name,price);svg.append(group);tiles[t.i]={el:group,face,figure,badge,x,y,level:-1,owner:-2};
 }
 svg.append(tokenLayer);
 function refresh(state){for(const t of E.TILES){const q=tiles[t.i],owner=state.owner[t.i],lv=state.level[t.i];q.el.setAttribute('aria-label',`${t.name}${t.type==='prop'?', '+E.GROUPS[t.group].name:''}${t.price?', $'+t.price:''}${owner>=0?', owned by '+state.players[owner].name:''}${lv?', '+(lv===4?'hotel':lv+' buildings'):''}`);
 if(q.owner!==owner){q.owner=owner;q.face.setAttribute('fill',owner>=0?blend(state.players[owner].color):['start','jail','goto','park'].includes(t.type)?'#c4c9ad':'#e7e0c8');q.face.setAttribute('stroke',owner>=0?state.players[owner].color:'#8d8d6a');q.face.setAttribute('stroke-width',owner>=0?3:1);}
 if(q.level!==lv||q.buildOwner!==owner){q.level=lv;q.buildOwner=owner;q.figure.replaceChildren();q.badge.setAttribute('opacity',lv?0:1);if(lv){q.figure.append(building(q.x+22,q.y+10,21,16,lv===4?31:10+lv*4,owner>=0?state.players[owner].color:'#89ae88',lv===4));for(let n=1;n<Math.min(3,lv);n++)q.figure.append(building(q.x+12+n*12,q.y+22,9,10,9,'#83a989'));}}
 }
 for(const p of state.players){const node=tokens[p.id];if(node){node.classList.toggle('active',state.turn===p.id&&!state.over);node.classList.toggle('out',p.bankrupt);}}
 }
 function placeToken(p,pos,turn,over=false){
 let node=tokens[p.id];if(!node){node=s('g',{class:'es-pawn','data-player':p.id,'aria-hidden':'true'},s('g',{class:'es-pawn-body'},s('ellipse',{cx:0,cy:3,rx:7,ry:3.5,fill:'#10262a77'}),s('ellipse',{cx:0,cy:0,rx:6,ry:3,fill:p.color,stroke:'#fff0be','stroke-width':1}),s('path',{d:'M-4 0L-2 -9H2L4 0Z',fill:p.color,stroke:'#f8e6ae','stroke-width':.65}),s('circle',{cx:0,cy:-12,r:4.1,fill:p.color,stroke:'#fff2cd','stroke-width':1})));tokens[p.id]=node;tokenLayer.append(node);}
 const [c,r]=cityCell(pos),point=project(c*64+21+(p.id%2)*19,r*64+28+Math.floor(p.id/2)*13,3);node.setAttribute('transform',`translate(${point.x} ${point.y})`);node.setAttribute('data-position',pos);node.classList.toggle('active',p.id===turn&&!over);node.classList.toggle('out',p.bankrupt);return node;
 }
 return{svg,refresh,placeToken,tiles};
}
