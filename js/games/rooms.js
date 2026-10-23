import * as core from './rooms-core.js';
import { h, s, fill, haptic } from '../ui.js';
import { gameTop, hud, overlay } from './common.js';
import { restore, saveRun } from '../checkpoint.js';
import { createLoop } from '../loop.js';

const COLORS=['#efac83','#88c7e0','#bad193','#cfb0e3'];
const NAMES=['Amber','Blue','Green','Violet'];
const NOTES=[261.63,329.63,392,523.25];
const HOW={
 signal:['You are the signal keeper. Deliver twelve trains to the matching numbered stations.','Tap each brass switch to cycle between straight, up, down, and hold. Hold stops a train at its switch so you can stagger arrivals. A train takes the setting when it leaves that switch. Keep trains apart: collisions and wrong stations cost a life.','In practice, use Advance train to move one step at a time.'],
 workshop:['Bring three workshop circuits back to life.','Tap a conduit to rotate it clockwise. Power enters on the left at row 3 and must reach the socket on the right at row 3. Connected conduits light up.','The blueprint reveals one connection, with a score cost.'],
 casebook:['A collection of five small mysteries.','Inspect every numbered detail in the scene. Compare the evidence, then choose the explanation that fits.','Your notebook stays open, and incorrect theories include a hint.'],
 echo:['Restore the lantern garden with a growing melody.','Watch the numbered lanterns light up, then tap them in the same order. Keyboard: 1, 2, 3, 4.','Sound is optional. Every note has a matching number, color and light.'],
 logistics:['Five parcels. One truck. Two cargo spaces.','Load up to two parcels at the depot, then tap a destination to drive there. Every road step costs one fuel. Return to the depot for more parcels.','Choose your delivery order carefully. Roadworks block some streets. A route is highlighted before you confirm it.']
};
export function mount(root,ctx){
 const id=ctx.game.id;
 const old=ctx.resume?restore(ctx.store.loadGame(id),g=>g.id===id&&core.validRoom(g)):null;
 const g=old?old.state:core.createRoom(id,ctx.seed??Date.now()&0x7fffffff);
 let state='ready',dead=false,pauseOv=null,timer=null,playbackToken=0,railAcc=0,selected=null,moving=false,displayTruck=null,moveToken=0;
 const timers=new Set();
 const later=(fn,ms)=>{const t=setTimeout(()=>{timers.delete(t);if(!dead)fn();},ms);timers.add(t);return t;};
 const save=()=>saveRun(ctx.store,id,g,{mode:ctx.mode});
 const score=hud('Score'),level=hud(id==='signal'?'Delivered':id==='logistics'?'Fuel':'Chapter');
 const top=gameTop({title:ctx.game.name,onMenu:pause,right:h('div',{class:'hud-row'},score.el,level.el)});
 const message=h('p',{class:'room-message',role:'status','aria-live':'polite'});
 const stage=h('div',{class:'room-stage'}),controls=h('div',{class:'room-controls'}),detail=h('div',{class:'room-detail'});
 const el=h('div',{class:'room room-'+id},top,h('div',{class:'room-scroll'},h('div',{class:'room-heading'},h('span',{class:'eyebrow'},ctx.mode==='daily'?'DAILY CHALLENGE':ctx.practice?'TAKE YOUR TIME':'THE ARCADE COLLECTION'),h('h1',null,ctx.game.tag)),message,stage,detail,controls));root.append(el);
 const btn=(label,fn,cls='')=>h('button',{class:'btn '+cls,type:'button',onclick:()=>{if(state==='play')fn();}},label);
 const tone=i=>ctx.audio.beep(NOTES[i],350,.065,'sine');
 function changed(){save();render();if(g.over)finish();}
 function finish(){if(state==='over')return;state = 'over'; ctx.playing(false);loop.stop();playbackToken++;ctx.store.clearGame(id);later(()=>ctx.finish({score:g.score,level:g.stage,completed:g.won||g.moves>=5||id==='signal'&&g.tick>=10||id==='echo'&&g.best>=2,mode:ctx.mode,extra:[g.won?'Collection challenge complete':'A useful practice run',id==='signal'?`${g.delivered} trains delivered • ${g.missed} missed`:id==='logistics'?`${g.delivered} / 5 parcels delivered • ${g.steps} road steps`:id==='echo'?`Longest melody: ${g.best} notes`:id==='casebook'?`${g.case+1} case files explored`:`${g.moves} conduit rotations`,id==='signal'?'Tip: set the next junction before the train reaches it.':id==='echo'?'Tip: group a long melody into small phrases.':id==='logistics'?'Tip: pair nearby destinations and return with empty cargo.':id==='casebook'?'Tip: check the timing in each piece of evidence.':'Tip: follow the lit circuit from the power socket.']}),500);}
 function pause(){if(state!=='play'||pauseOv)return;state = 'paused'; ctx.playing(false);loop.stop();playbackToken++;moveToken++;moving=false;displayTruck=null;save();pauseOv=overlay(el,{title:'Take a break',body:h('p',null,'Your place is saved on this device.'),buttons:[{label:'Save & leave',onclick:()=>ctx.exit()},{label:'Resume',kind:'primary',onclick:()=>{pauseOv=null;state = 'play'; ctx.playing(true);if(id==='echo')playEcho();if(id==='signal'&&!ctx.practice)loop.start();}}]});}
 function render(){
  score.set(g.score.toLocaleString());level.set(id==='signal'?`${g.delivered}/12`:id==='logistics'?g.fuel:id==='echo'?g.sequence.length:g.stage);
  if(id==='signal')renderRail();if(id==='workshop')renderWorkshop();if(id==='casebook')renderCase();if(id==='echo')renderEcho();if(id==='logistics')renderTown();
 }
 function renderRail(){
  message.textContent=`${g.lives} lives • ${g.spawned} of 12 trains dispatched • trains go left → right`;
  const board=h('div',{class:'rail-map'});
  for(let row=0;row<3;row++){
   board.append(h('div',{class:'rail-label',style:{'--route':COLORS[row]}},`${row+1} · ${NAMES[row]}`));
   for(let col=0;col<7;col++){
    const train=g.trains.find(t=>t.row===row&&t.col===col),junction=[2,4].includes(col);
    const i=row*2+(col===4?1:0),dir=g.switches[i];
    const cell=h('button',{class:'rail-cell'+(junction?' junction':''),type:'button','aria-label':junction?`Track ${row+1}, junction ${col===2?1:2}: ${dir===3?'hold':dir===0?'straight':dir<0?'up':'down'}`:`Track ${row+1}, section ${col+1}`,'aria-disabled':junction?'false':'true',onclick:()=>{if(state==='play'&&junction){core.setSwitch(g,row,col);ctx.audio.tick();changed();}}},h('span',{class:'rail-track'}));
    if(junction)cell.append(h('span',{class:'rail-switch'},dir===3?'Ⅱ':dir===0?'→':dir<0?'↗':'↘'));
    if(train)cell.append(h('span',{class:'train',style:{'--route':COLORS[train.target]},'aria-label':`Train for station ${train.target+1}`},s('svg',{viewBox:'0 0 60 40','aria-hidden':'true'},s('rect',{x:5,y:9,width:42,height:21,rx:5,fill:'currentColor'}),s('rect',{x:29,y:3,width:17,height:12,rx:3,fill:'currentColor'}),s('rect',{x:32,y:6,width:9,height:7,rx:2,fill:'#162b35'}),s('circle',{cx:16,cy:32,r:5,fill:'#182932'}),s('circle',{cx:39,cy:32,r:5,fill:'#182932'})),h('b',null,train.target+1)));
    board.append(cell);
   }
  }
  fill(stage,board);fill(detail,h('div',{class:'rail-legend'},COLORS.slice(0,3).map((color,i)=>h('span',{style:{'--route':color}},h('i',null),`Station ${i+1}`))));
  fill(controls,btn(ctx.practice?'Advance train':'Advance early',()=>{railAcc=0;core.railTick(g);changed();},'primary'),h('p',{class:'fine'},ctx.practice?'Manual timetable • each press advances one section.':'A section advances every 1.8 seconds. Cycle to Ⅱ to hold a train and stagger arrivals.'));
 }
 function renderWorkshop(){
  message.textContent=g.solved?'The machine is alive. Beautiful work.':`Circuit ${g.stage} / 3 • ${g.stageMoves} rotations • power enters at ◀ and exits at ▶`;
  const board=h('div',{class:'conduit-grid',role:'group','aria-label':'Rotate the conduit tiles'});
  g.cells.forEach((c,i)=>{
   const lit=g.lit.includes(i),art=s('svg',{viewBox:'0 0 64 64','aria-hidden':'true'});
   art.append(s('rect',{x:4,y:4,width:56,height:56,rx:11,fill:'#25373a'}));
   for(const [bit,x,y]of [[1,32,0],[2,64,32],[4,32,64],[8,0,32]])if(c.mask&bit){art.append(s('path',{d:`M32 32 L${x} ${y}`,stroke:'#101d23','stroke-width':17,'stroke-linecap':'round'}),s('path',{d:`M32 32 L${x} ${y}`,stroke:lit?'#f0cc8a':'#957650','stroke-width':11,'stroke-linecap':'round'}),s('path',{d:`M32 29 L${x} ${y-3}`,stroke:lit?'#fff1bc':'#baa07a','stroke-width':2}));}
   art.append(s('circle',{cx:32,cy:32,r:8,fill:lit?'#ffe7a6':'#b39162'}),s('circle',{cx:32,cy:32,r:3,fill:'#263c40'}));
   board.append(h('button',{class:'conduit'+(lit?' powered':'')+(i===10?' source':'')+(i===14?' sink':''),type:'button','aria-label':`Conduit row ${Math.floor(i/5)+1}, column ${i%5+1}${lit?', powered':''}`,disabled:g.solved?true:null,onclick:()=>{if(state==='play'){core.turnConduit(g,i);ctx.audio.tick();changed();}}},art));
  });fill(stage,board);
  fill(detail,h('div',{class:'power-readout'},h('span',null,'◀ POWER IN'),h('span',null,`${g.lit.length} conduits lit`),h('span',null,'POWER OUT ▶')));
  fill(controls,g.solved?btn('Restore next machine',()=>{core.nextRoom(g);changed();},'primary'):btn('Blueprint hint · −25 points',()=>{const c=g.cells.find(c=>c.mask!==c.goal);if(c){c.mask=c.goal;g.score=Math.max(0,g.score-25);core.workshopPower(g);if(g.solved){g.score+=100;if(g.stage===3){g.over=true;g.won=true;}}changed();}},''));
 }
 function roomScene(caseId){
  const art=s('svg',{viewBox:'0 0 600 340',class:'case-scene','aria-hidden':'true'});
  art.append(s('rect',{width:600,height:340,fill:['#253c4a','#244b40','#694b3b','#3e3e59','#4a4654'][caseId]}),s('path',{d:'M0 245L600 245V340H0Z',fill:'#25302e'}));
  for(let i=0;i<3;i++)art.append(s('rect',{x:48+i*188,y:30,width:128,height:170,rx:48,fill:'#ceb78e'}),s('rect',{x:56+i*188,y:38,width:112,height:154,rx:42,fill:caseId===1?'#729e80':'#597985'}),s('path',{d:`M${112+i*188} 42V192 M${56+i*188} 114H${168+i*188}`,stroke:'#c4ab84','stroke-width':5}));
  if(caseId===0){art.append(s('rect',{x:45,y:230,width:190,height:20,rx:6,fill:'#c7a47b'}),s('rect',{x:65,y:250,width:12,height:50,fill:'#b18b65'}),s('rect',{x:200,y:250,width:12,height:50,fill:'#b18b65'}),s('circle',{cx:300,cy:83,r:34,fill:'#f0dfbd'}),s('path',{d:'M300 60V83L316 93',stroke:'#354550','stroke-width':5}),s('path',{d:'M425 288L465 128 M490 288L480 128 M438 246L487 246 M447 210L484 210 M456 173L481 173',stroke:'#e4be85','stroke-width':8}));}
  if(caseId===1){for(let i=0;i<8;i++){const x=40+i*73;art.append(s('path',{d:`M${x} 255h48l-6 50h-36Z`,fill:'#bd8667'}),s('path',{d:`M${x+24} 260v-58q-35 -30 -28 2q2 20 28 21q32 -44 35 -11q-1 18 -35 25`,stroke:'#afd092','stroke-width':5,fill:'#82ae74'}));}}
  if(caseId===2){art.append(s('rect',{x:40,y:205,width:520,height:70,rx:8,fill:'#b38b66'}));for(let i=0;i<6;i++)art.append(s('path',{d:`M${75+i*76} 205q-15 -40 20 -42q35 2 20 42Z`,fill:'#e5b773'}));art.append(s('rect',{x:230,y:270,width:130,height:60,rx:4,fill:'#d8b888'}),s('path',{d:'M290 270V330 M230 300H360',stroke:'#9d755a','stroke-width':4}));}
  if(caseId===3){art.append(s('path',{d:'M120 180Q390 90 460 190V270H120Z',fill:'#1a222b'}),s('rect',{x:140,y:225,width:300,height:35,fill:'#e8dfc9'}));for(let i=0;i<20;i++)art.append(s('path',{d:`M${140+i*15} 225v35`,stroke:'#3a414b','stroke-width':1}));art.append(s('rect',{x:160,y:270,width:16,height:48,fill:'#19232b'}),s('rect',{x:415,y:270,width:16,height:48,fill:'#19232b'}));}
  if(caseId===4){art.append(s('path',{d:'M215 320L275 130L345 320 M235 260H330',stroke:'#bc9473','stroke-width':10}),s('rect',{x:215,y:92,width:150,height:145,rx:4,fill:'#dbd0a9'}),s('path',{d:'M230 215q25 -75 55 -24q20 -60 65 -10v40H230',fill:'#7eaa85'}));for(let i=0;i<3;i++)art.append(s('rect',{x:430+i*40,y:250,width:30,height:38,rx:3,fill:['#5a92bd','#ebcf76','#8eb380'][i]}));}
  return art;
 }
 function renderCase(){
  const c=core.CASES[g.case];message.textContent=c.story;
  const scene=h('div',{class:'case-stage'},roomScene(g.case));
  const positions=[[16,34],[48,22],[80,41],[30,68],[65,69],[88,80]];
  positions.forEach(([left,top],i)=>scene.append(h('button',{class:'clue-pin'+(g.clues.includes(i)?' found':''),style:{left:left+'%',top:top+'%'},type:'button','aria-label':`Inspect ${c.clues[i][0]}`,onclick:()=>{if(state==='play'){core.inspectClue(g,i);ctx.audio.tick();changed();}}},String(i+1))));
  fill(stage,h('div',{class:'case-title'},h('span',{class:'eyebrow'},`CASE ${g.case+1} / ${core.CASES.length} · ${c.place}`),h('h2',null,c.title)),scene);
  fill(detail,h('div',{class:'notebook'},h('h3',null,`Field notes · ${g.clues.length}/6`),g.clues.length?g.clues.map(i=>h('div',{class:'note'},h('b',null,`${i+1}. ${c.clues[i][0]}`),h('p',null,c.clues[i][1]))):h('p',{class:'fine'},'Inspect the numbered details in the scene. Every clue is recorded here.')));
  if(g.solved)fill(controls,h('p',{class:'case-reason'},c.reason),btn('Open the next case',()=>{core.nextRoom(g);changed();},'primary'));
  else fill(controls,h('p',{class:'fine'},g.clues.length<6?'Collect all six clues before choosing a theory.':'Which explanation fits all six clues?'),c.answers.map((answer,i)=>h('button',{class:'theory',type:'button',disabled:g.clues.length<6?true:null,onclick:()=>{if(state!=='play')return;const correct=core.accuse(g,i);if(correct===false){ctx.audio.bad();changed();message.textContent='That theory conflicts with the evidence. Check the records and try again.';}else{ctx.audio.good();changed();}}},answer)));
 }
 let echoPhase='watch',active=-1;
 function renderEcho(){
  message.textContent=`${g.lives} lives • ${echoPhase==='watch'?'Watch the lanterns':`Your turn · ${g.input.length} / ${g.sequence.length}`} • longest melody ${g.best}`;
  const garden=h('div',{class:'echo-garden'});
  for(let i=0;i<4;i++)garden.append(h('button',{class:'garden-lantern'+(active===i?' lit':''),style:{'--petal':COLORS[i]},type:'button','aria-label':`Lantern ${i+1}, ${NAMES[i]}`,disabled:echoPhase==='watch'?true:null,onclick:()=>tapEcho(i)},h('span',{class:'lantern-cap'}),h('span',{class:'lantern-glass'},String(i+1)),h('span',{class:'lantern-stem'}),h('small',null,NAMES[i])));
  fill(stage,garden);fill(detail,h('div',{class:'echo-input'},Array.from({length:g.sequence.length},(_,i)=>h('span',{class:i<g.input.length?'done':''},i<g.input.length?String(g.input[i]+1):'·'))));
  fill(controls,btn('Replay melody',()=>playEcho()),h('p',{class:'fine'},'Match the numbers in order. Sound is optional. Keyboard 1–4.'));
 }
 function playEcho(){
  const token=++playbackToken;echoPhase='watch';g.input=[];active=-1;render();
  g.sequence.forEach((i,n)=>{later(()=>{if(state==='play'&&token===playbackToken){active=i;tone(i);renderEcho();}},550+n*680);later(()=>{if(state==='play'&&token===playbackToken){active=-1;renderEcho();}},980+n*680);});
  later(()=>{if(state==='play'&&token===playbackToken){active=-1;echoPhase='input';renderEcho();}},550+g.sequence.length*680);
 }
 function tapEcho(i){if(state!=='play'||echoPhase!=='input')return;tone(i);active=i;const result=core.echoTap(g,i);changed();later(()=>{active=-1;if(!g.over)renderEcho();},180);if(result==='next'||result==='miss'){echoPhase='watch';renderEcho();later(()=>{if(state==='play')playEcho();},650);}}
 function renderTown(){
  const label=['Orchard','Station','Bakery','Florist','Harbor'];
  message.textContent=`${g.delivered}/5 delivered • ${g.cargo.length}/2 cargo spaces • ${g.fuel} fuel`;
  const town=h('div',{class:'town-map',role:'group','aria-label':'Delivery town, six by six streets'});
  const preview=selected?core.townPath(g,selected.x,selected.y):null;
  for(let y=0;y<6;y++)for(let x=0;x<6;x++){
   const parcel=g.parcels.find(p=>p.x===x&&p.y===y),truck=(displayTruck||g.truck).x===x&&(displayTruck||g.truck).y===y,depot=x===0&&y===5,closed=g.closed.includes(y*6+x),route=preview?.some(p=>p.x===x&&p.y===y);
   town.append(h('button',{class:'town-cell'+(closed?' roadworks':'')+(route?' route':'')+(depot?' depot':'')+(parcel?' building':''),type:'button','aria-label':truck?'Your truck':depot?'Depot':closed?'Road closed':parcel?`${label[parcel.id]} ${parcel.done?'delivered':g.cargo.includes(parcel.id)?'in your truck':'awaiting pickup'}`:`Street ${x+1}, ${y+1}`,disabled:closed?true:null,onclick:()=>{if(state==='play'){selected={x,y};renderTown();}}},closed?h('span',null,'×'):truck?h('span',{class:'truck'},'▰'):depot?h('span',{class:'town-building'},'D'):parcel?h('span',{class:'town-building',style:{'--house':COLORS[parcel.id%4]}},h('i',null),parcel.done?'✓':String(parcel.id+1)):null));
  }
  fill(stage,town);
  const atDepot=g.truck.x===0&&g.truck.y===5;
  fill(detail,h('div',{class:'parcel-list'},g.parcels.map(p=>h('div',{class:'parcel-row'},h('span',{class:'parcel-number'},p.done?'✓':String(p.id+1)),h('div',null,h('b',null,label[p.id]),h('small',null,p.done?'Delivered':g.cargo.includes(p.id)?'In your truck':'At the depot')),!p.done&&!g.cargo.includes(p.id)?h('button',{class:'btn',type:'button',disabled:!atDepot||g.cargo.length>=2?true:null,onclick:()=>{if(state==='play'){core.loadParcel(g,p.id);changed();}}},'Load'):null))));
  fill(controls,selected?btn(`Drive here · ${preview?.length??'—'} fuel`,()=>{if(moving)return;const from={...g.truck};const path=core.driveTown(g,selected.x,selected.y);if(path){selected=null;ctx.audio.tick();save();if(ctx.settings.reduce){changed();}else{moving=true;displayTruck=from;const token=++moveToken;renderTown();path.forEach((p,i)=>later(()=>{if(token!==moveToken)return;displayTruck=p;renderTown();if(i===path.length-1){moving=false;displayTruck=null;changed();}},(i+1)*95));}}else message.textContent='That route is blocked, too far, or you are already there.';},'primary'):h('p',{class:'fine'},'Tap a destination to preview its route. Load parcels at D, the depot.'),btn('Return to depot',()=>{selected={x:0,y:5};renderTown();}));
 }
 const loop=createLoop(dt=>{if(state==='play'&&id==='signal'&&!ctx.practice){railAcc+=dt;if(railAcc>=1.8){railAcc-=1.8;core.railTick(g);changed();}}},()=>20);
 const key=e=>{if(state==='play'&&id==='echo'&&/^[1-4]$/.test(e.key)&&!e.repeat){e.preventDefault();tapEcho(Number(e.key)-1);}};
 document.addEventListener('keydown',key);
 function begin(){state = 'play'; ctx.playing(true);render();save();if(id==='signal'&&!ctx.practice)loop.start();if(id==='echo')playEcho();}
 render();
 overlay(el,{title:old?'Welcome back':ctx.game.name,body:h('div',{class:'howto'},HOW[id].map(text=>h('p',null,text))),buttons:[{label:old?'Continue playing':'Let’s play',kind:'primary',onclick:begin}]});
 return{destroy(){if(state!=='ready'&&state!=='over')save();dead=true;playbackToken++;loop.destroy();for(const t of timers)clearTimeout(t);timers.clear();document.removeEventListener('keydown',key);},pause,onBack(){if(state==='play'){pause();return true;}return state==='paused';}};
}
