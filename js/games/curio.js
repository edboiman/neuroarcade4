import * as C from './curio-core.js';
import {objectArt,roomDecoration,roomScene} from './curio-art.js';
import {h,fill} from '../ui.js';
import {gameTop,overlay,hud} from './common.js';
import {createLoop} from '../loop.js';
import {restore,saveRun} from '../checkpoint.js';
export function mount(root,ctx){
 const old=ctx.resume?restore(ctx.store.loadGame('curio'),C.valid):null;
 const seed=ctx.seed??((Date.now()^0x43a5f1)>>>0);
 let roomIdx=Math.max(0,Math.min(2,Math.round(ctx.store.pref('curio','room',0)))),calm=ctx.store.pref('curio','calm',0)===1;
 let run=old?.state||C.createRun(seed,{room:C.ROOM_IDS[roomIdx],calm});
 if(old){roomIdx=C.ROOM_IDS.indexOf(run.room);calm=run.calm;C.dismissPeek(run);}
 let started=false,paused=false,ov=null,drag=null,ghost=null,suppressClickUntil=0,placedSlot=-1,sceneRoom=null;
 const round=hud('Round','1 / 5'),score=hud('Score','0'),title=h('h1'),subtitle=h('p'),phase=h('span',{class:'curio-phase'}),clock=h('span',{class:'curio-clock'}),meter=h('i'),pediment=h('div',{class:'curio-decoration'}),grid=h('div',{class:'curio-grid',role:'group','aria-label':'Cabinet positions'}),tray=h('div',{class:'curio-tray',role:'group','aria-label':'Object tray'}),feedback=h('div',{class:'curio-feedback'}),actions=h('div',{class:'curio-actions'}),status=h('p',{class:'curio-status',role:'status','aria-live':'polite'});
 const scene=h('div',{class:'curio-scenery','aria-hidden':'true'});
 const cabinet=h('div',{class:'curio-cabinet'},pediment,h('div',{class:'curio-shelves'},grid),h('div',{class:'curio-shutters','aria-hidden':'true'},h('i'),h('i')));
 const stage=h('section',{class:'curio-stage'},cabinet);
 const el=h('div',{class:'curio-game'},scene,gameTop({title:'Curio Cabinet',onMenu:pause,right:h('div',{class:'hud-row'},round.el,score.el)}),h('div',{class:'curio-heading'},h('span',{class:'eyebrow'},'A SMALL WORLD TO REMEMBER'),title,subtitle),h('div',{class:'curio-phasebar'},phase,clock,h('div',{class:'curio-timer','aria-hidden':'true'},meter)),stage,h('div',{class:'curio-lower'},tray,actions,status,feedback));root.append(el);
 const save=()=>saveRun(ctx.store,'curio',run,{mode:ctx.mode});
 const active=()=>started&&!paused&&!run.over;
 const recall=()=>active()&&run.phase==='recall';
 const btn=(text,fn,primary=false,disabled=false)=>h('button',{class:'btn'+(primary?' primary':''),type:'button',disabled:disabled?true:null,onclick:fn},text);
 function synchronize(){ctx.playing(active()&&run.phase!=='reveal');if(active()&&['study','shutter','peek'].includes(run.phase)&&!(run.phase==='study'&&run.calm))loop.start();else loop.stop();}
 function act(fn){if(!active())return;const before=[...run.placed];fn();placedSlot=run.phase==='recall'?run.placed.findIndex((id,i)=>id!==null&&id!==before[i]):-1;save();render();placedSlot=-1;synchronize();}
 function choose(id){if(!recall()||performance.now()<suppressClickUntil)return;act(()=>C.select(run,id));grid.children[0]?.focus({preventScroll:true});}
 function slotClick(i){if(!recall()||performance.now()<suppressClickUntil)return;if(run.selected!==null)act(()=>C.place(run,i));else if(run.placed[i]!==null)act(()=>C.select(run,run.placed[i]));grid.children[i]?.focus({preventScroll:true});}
 function slotKey(e,i){const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-4,ArrowDown:4}[e.key];if(delta===undefined)return;e.preventDefault();grid.children[Math.max(0,Math.min(11,i+delta))]?.focus();}
 function render(){
  const room=C.roomOf(run),visible=active(),showAnswers=visible&&['study','peek','reveal'].includes(run.phase),showPlaced=visible&&run.phase==='recall',result=run.results.at(-1);
  el.className=`curio-game curio-room-${run.room}`+(ctx.settings.reduce?' curio-still':'')+(!visible?' curio-asleep':'')+(visible&&run.phase==='reveal'?' restored':'');
  if(sceneRoom!==run.room){fill(scene,roomScene(run.room));sceneRoom=run.room;}
  stage.classList.toggle('shuttered',visible&&run.phase==='shutter');
  title.textContent=room.name;subtitle.textContent=room.tag;round.set(`${run.round+1} / 5`);score.set(run.score);
  phase.textContent=!visible?'CABINET CLOSED':{study:'STUDY THE ARRANGEMENT',shutter:'PICTURE IT IN YOUR MIND',recall:'PUT THE OBJECTS BACK',peek:'A LITTLE REMINDER',reveal:'THE ARRANGEMENT REVEALED'}[run.phase]||'';
  fill(pediment,roomDecoration(run.room));
  fill(grid,Array.from({length:12},(_,i)=>{
   const id=showAnswers?run.answer[i]:showPlaced?run.placed[i]:null;
   const wrong=visible&&run.phase==='reveal'&&run.placed[i]!==run.answer[i];
   const selected=showPlaced&&id!==null&&id===run.selected;
   const cell=h('button',{class:'curio-slot'+(id!==null?' occupied':'')+(selected?' selected':'')+(wrong?' incorrect':'')+(placedSlot===i?' just-placed':''),type:'button',dataset:{slot:i,item:showPlaced&&id!==null?id:''},'aria-label':`Shelf ${Math.floor(i/4)+1}, position ${i%4+1}: ${id===null?'empty':C.itemName(id)}`,'aria-pressed':String(selected),onclick:()=>slotClick(i),onkeydown:e=>slotKey(e,i)},h('span',{class:'slot-number','aria-hidden':'true'},String(i+1)),id!==null?objectArt(id):h('span',{class:'curio-empty','aria-hidden':'true'}),h('small',null,id===null?'':C.itemName(id)));
   return cell;
  }));
  const available=run.tray.filter(id=>!run.placed.includes(id));
  fill(tray,visible&&['recall','peek'].includes(run.phase)?available.map(id=>h('button',{class:'curio-tray-item'+(run.selected===id?' selected':''),type:'button',dataset:{item:id},disabled:run.phase==='peek'?true:null,'aria-label':`Select ${C.itemName(id)}`,'aria-pressed':String(run.selected===id),onclick:()=>choose(id)},objectArt(id),h('small',null,C.itemName(id)))):null);
  tray.hidden=!visible||!['recall','peek'].includes(run.phase);
  let buttons=[];
  if(visible&&run.phase==='study')buttons=[btn('I have it — close cabinet',()=>act(()=>C.remember(run)),true)];
  if(visible&&run.phase==='recall')buttons=[btn('Peek at arrangement',()=>act(()=>C.peek(run))),btn('Return selected to tray',()=>act(()=>C.returnToTray(run)),false,run.selected===null),btn('Check arrangement',()=>act(()=>{if(C.submit(run)){ctx.audio.good();if(run.room==='study'){ctx.audio.beep(1180,65,.04,'sine',100);ctx.audio.beep(1480,80,.035,'sine',220);}}}),true,!C.readyToSubmit(run))];
  if(visible&&run.phase==='reveal')buttons=[btn(run.round===4?'Finish collection':'Next arrangement',()=>{act(()=>C.nextRound(run));if(run.over)finish();},true)];
  fill(actions,buttons);
  status.textContent=!visible?'':run.phase==='study'?`${run.pieces.length} objects. Remember their positions. Empty positions matter too.`:run.phase==='shutter'?'The shutters are closing…':run.phase==='peek'?'This round is assisted. Your placements will return when the reminder ends.':run.phase==='recall'?(run.selected!==null?`${C.itemName(run.selected)} selected. Choose a cabinet position.`:`${run.placed.filter(id=>id!==null).length} of ${run.pieces.length} placed. Select an object and its position, or drag it there.`):run.phase==='reveal'?`${result.correct} of ${result.total} correct · +${result.score} points${result.assisted?' · assisted round':''}. ${room.reward}`:'';
  const misses=visible&&run.phase==='reveal'?run.answer.map((id,i)=>run.placed[i]!==id?{id,i,yours:run.placed[i]}:null).filter(Boolean):[];
  fill(feedback,misses.length?h('details',null,h('summary',null,`Review ${misses.length} changed positions`),h('ul',null,misses.map(x=>h('li',null,`Position ${x.i+1}: ${x.id===null?'should be empty':C.itemName(x.id)}${x.yours!==null?` · you placed ${C.itemName(x.yours)}`:' · you left it empty'}`)))):visible&&run.phase==='reveal'?h('p',null,'Every object found its place. Perfect recall.'):null);
  updateClock();
 }
 function updateClock(){const visible=active();clock.textContent=!visible?'':run.phase==='study'?(run.calm?'Take your time':`${Math.ceil(run.timeLeft)}s to study`):run.phase==='peek'?`${Math.ceil(run.timeLeft)}s reminder`:run.phase==='recall'?'No time limit':'';meter.style.setProperty('width',visible&&run.phase==='study'?`${run.calm?100:run.timeLeft*10}%`:'0%');}
 const loop=createLoop(dt=>{if(!active())return;const previous=run.phase;C.tick(run,dt);updateClock();if(run.phase!==previous){render();save();synchronize();}},()=>ctx.fps());
 function cancelDrag(){if(ghost){ghost.remove();ghost=null;}if(drag){try{if(el.hasPointerCapture(drag.pointer))el.releasePointerCapture(drag.pointer);}catch{}}drag=null;}
 el.addEventListener('pointerdown',e=>{if(!recall()||drag||e.pointerType==='mouse'&&e.button!==0)return;const button=e.target.closest('button[data-item]');if(!button||button.dataset.item==='')return;drag={pointer:e.pointerId,id:+button.dataset.item,x:e.clientX,y:e.clientY,started:false};});
 el.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer||!recall())return;if(!drag.started&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;
  if(!drag.started){drag.started=true;ghost=h('div',{class:'curio-drag-ghost','aria-hidden':'true'},objectArt(drag.id));document.body.append(ghost);try{el.setPointerCapture(e.pointerId);}catch{}}
  e.preventDefault();ghost.style.setProperty('left',`${e.clientX-42}px`);ghost.style.setProperty('top',`${e.clientY-50}px`);
 });
 el.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.pointer)return;const d=drag;if(d.started){suppressClickUntil=performance.now()+350;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot],.curio-tray');if(target?.dataset.slot!==undefined&&run.placed[+target.dataset.slot]!==d.id)act(()=>C.place(run,+target.dataset.slot,d.id));else if(target?.classList.contains('curio-tray'))act(()=>C.returnToTray(run,d.id));}cancelDrag();});
 el.addEventListener('pointercancel',cancelDrag);el.addEventListener('lostpointercapture',()=>{if(drag?.started)cancelDrag();});
 function pause(){if(!active())return;cancelDrag();C.dismissPeek(run);paused=true;loop.stop();ctx.playing(false);save();render();ov=overlay(el,{title:'Cabinet closed',body:h('p',null,'Your arrangement is saved. The answer stays behind the shutters.'),buttons:[{label:'Save & leave',onclick:()=>ctx.exit()},{label:'Resume',kind:'primary',onclick:()=>{paused=false;render();synchronize();}}]});}
 function finish(){cancelDrag();loop.stop();ctx.playing(false);ctx.store.clearGame('curio');const medal=C.medal(run),key=`medal_${run.room}`;if(medal>ctx.store.pref('curio',key,0))ctx.store.setPref('curio',key,medal);ctx.finish({score:run.score,level:5,accuracy:C.accuracy(run),completed:true,variant:`${run.room}_${run.calm?'calm':'timed'}`,extra:[`${run.results.reduce((n,x)=>n+x.correct,0)} of ${run.results.reduce((n,x)=>n+x.total,0)} objects remembered`,`${run.peeks} peek${run.peeks===1?'':'s'}`,`${['A collection begun','Bronze cabinet','Silver cabinet','Gold cabinet'][medal]}`]});}
 const onHide=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',onHide);
 render();
 if(old)ov=overlay(el,{title:'Your cabinet awaits',body:h('p',null,`${C.roomOf(run).name} · Round ${run.round+1} of 5. Your current arrangement is saved.`),buttons:[{label:'Continue collection',kind:'primary',onclick:()=>{started=true;render();synchronize();}}]});
 else{
  const picker=h('div',{class:'curio-room-picker',role:'group','aria-label':'Choose a cabinet'}),calmInput=h('input',{type:'checkbox','aria-label':'Unlimited study time',checked:calm?true:null,onchange:e=>{calm=e.target.checked;ctx.store.setPref('curio','calm',calm?1:0);run=C.createRun(seed,{room:C.ROOM_IDS[roomIdx],calm});render();}});
  fill(picker,C.ROOMS.map((room,i)=>h('button',{class:`curio-room-choice theme-${room.id}`+(roomIdx===i?' selected':''),type:'button','aria-pressed':String(roomIdx===i),onclick:e=>{roomIdx=i;ctx.store.setPref('curio','room',i);run=C.createRun(seed,{room:room.id,calm});for(const b of picker.children){b.classList.toggle('selected',b===e.currentTarget);b.setAttribute('aria-pressed',String(b===e.currentTarget));}render();}},objectArt(i*10),h('b',null,room.name),h('small',null,ctx.store.pref('curio',`medal_${room.id}`,0)>0?`${['','Bronze','Silver','Gold'][ctx.store.pref('curio',`medal_${room.id}`,0)]} cabinet`:room.tag))));
  ov=overlay(el,{title:'Curio Cabinet',body:h('div',null,h('p',null,'Study a cabinet of little treasures. Close its shutters, then put each object back where it belongs. Five arrangements bring the room to life.'),picker,h('label',{class:'curio-calm-toggle'},calmInput,h('span',null,'Unlimited study time')),h('p',{class:'fine'},'Recall is always untimed. Tap an object and a position, or drag. Use Peek whenever you need a reminder.')),buttons:[{label:'Open cabinet',kind:'primary',onclick:()=>{started=true;save();render();synchronize();}}]});
 }
 return{pause,onBack:()=>{if(!started)return false;pause();return true;},destroy(){cancelDrag();loop.destroy();document.removeEventListener('visibilitychange',onHide);ov?.close();if(started&&!run.over)save();el.remove();}};
}
