// Development-only policy: normal legal actions, no healing/damage/RNG cheats.
import * as C from './cinderpath-v1-core.js';
import {mulberry32} from '../../js/games/rng.js';
export function copy(r){const c=JSON.parse(JSON.stringify(r));c.rnd=mulberry32(r.rnd.getState());return c;}
const priorities={ember:{afterglow:13,kiln:11,wildfire:10,stoke:9,backdraft:9,flashover:9,kindle:8,detonate:8,dart:6},bastion:{riposte:13,hold:11,shieldbash:12,bastion:10,secondwind:9,chill:9},momentum:{flow:11,battlecry:12,flurry:11,hammer:10,foresight:8,quickstep:8,spark:8,expose:8}};
export function rankCard(id,style='ember'){return priorities[style][id]??({mend:10,siphon:8,purge:5,nova:8,secondwind:7,chill:7,bastion:7,hammer:7,kindle:6,dart:5,brace:1,strike:0}[id]??4);}
function healthValue(r){return 1.6+(1-r.hp/r.maxHp)*2;}
export function bestPlay(r){
 const b=r.battle,enemyHp=b.enemies.reduce((n,e)=>n+e.hp,0),burn=b.enemies.reduce((n,e)=>n+e.ember,0),blocked=b.enemies.reduce((n,e)=>n+e.block,0),danger=C.incoming(r);let best=null;
 for(const uid of b.hand){const c=C.ownedCard(r,uid),def=C.CARD[c.id];if(def.cost>b.energy)continue;
  const targets=def.target==='enemy'?b.enemies.filter(e=>e.hp>0).map(e=>e.uid):[null];
  for(const target of targets){const q=copy(r);if(!C.playCard(q,uid,target))continue;const qb=q.battle;if(q.phase==='reward'||q.won)return{uid,target,value:10000};if(q.over)continue;
   let value=(enemyHp-qb.enemies.reduce((n,e)=>n+e.hp,0))+(blocked-qb.enemies.reduce((n,e)=>n+e.block,0))*.35+(qb.enemies.reduce((n,e)=>n+e.ember,0)-burn)*1.9;
   value+=(Math.min(danger,qb.block)-Math.min(danger,b.block))*1.15+(danger-C.incoming(q))*.8+(q.hp-r.hp)*healthValue(r)+(qb.strength-b.strength)*6;
   value+=(qb.powers.kiln-b.powers.kiln)*3+(qb.powers.thorns-b.powers.thorns)*4+(qb.powers.afterglow-b.powers.afterglow)*5+(qb.powers.flow-b.powers.flow)*5;
   value+=(qb.hand.length-b.hand.length+1)*2+(qb.energy-b.energy+def.cost)*8-def.cost*.25;
   if(qb.retain&&!b.retain)value+=Math.min(qb.block,8)*.5;
   if(value>.05&&(!best||value>best.value))best={uid,target,value};
  }
 }return best;
}
export function decision(r,style='ember'){
 if(r.over)return null;
 if(r.phase==='map'){const nodes=C.choices(r),rank=n=>n.type==='boss'?100:n.type==='camp'?95:n.type==='event'?85:n.type==='shop'?(r.gold>=65?75:5):n.type==='elite'?(r.hp>r.maxHp*.8&&r.act>0?60:0):70;const node=[...nodes].sort((a,b)=>rank(b)-rank(a))[0];return{type:'node',id:node.id};}
 if(r.phase==='battle'){const p=bestPlay(r);return p?{type:'play',...p}:{type:'end'};}
 if(r.phase==='reward'){const id=[...r.loot.cards].sort((a,b)=>rankCard(b,style)-rankCard(a,style))[0];return{type:'reward',id:r.deck.length<20&&rankCard(id,style)>=6?id:null};}
 if(r.phase==='camp'){const cards=r.deck.filter(c=>!c.plus).sort((a,b)=>rankCard(b.id,style)-rankCard(a.id,style));return r.hp<r.maxHp*.62||!cards.length?{type:'camp',action:'rest'}:{type:'camp',action:'upgrade',uid:cards[0].uid};}
 if(r.phase==='shop'){
  if(r.hp<r.maxHp*.6&&!r.shop.healed&&r.gold>=35)return{type:'buy',kind:'heal'};
  if(r.shop.relic&&!r.shop.relicBought&&r.gold>=135)return{type:'buy',kind:'relic'};
  const offer=r.shop.cards.map((c,i)=>({...c,i})).filter(c=>!c.bought&&c.price<=r.gold&&rankCard(c.id,style)>=7&&r.deck.length<19).sort((a,b)=>rankCard(b.id,style)-rankCard(a.id,style))[0];
  if(offer)return{type:'buy',kind:'card',index:offer.i};
  if(r.gold>=45+r.removals*10&&r.deck.length>10){const c=r.deck.find(c=>c.id==='strike'&&!c.plus);if(c)return{type:'buy',kind:'remove',index:c.uid};}return{type:'leaveShop'};
 }
 const e=r.event;if(e.id==='cache')return{type:'event',choice:r.hp<r.maxHp*.7?'heal':'gold'};
 if(e.id==='altar')return{type:'event',choice:r.hp>35&&e.relic?'relic':'leave'};
 if(e.id==='archive')return{type:'event',choice:r.hp<r.maxHp*.7?'heal':rankCard(e.card,style)>=7&&r.deck.length<20?'card':'leave'};
 const c=r.deck.filter(c=>!c.plus).sort((a,b)=>rankCard(b.id,style)-rankCard(a.id,style))[0];return c?{type:'event',choice:'upgrade',uid:c.uid}:{type:'event',choice:'leave'};
}
export function commit(r,a){return a.type==='node'?C.enterNode(r,a.id):a.type==='play'?C.playCard(r,a.uid,a.target):a.type==='end'?C.endTurn(r):a.type==='reward'?C.takeReward(r,a.id):a.type==='camp'?C.camp(r,a.action,a.uid):a.type==='buy'?C.buy(r,a.kind,a.index):a.type==='leaveShop'?C.leaveShop(r):C.eventChoice(r,a.choice,a.uid);}
export function expedition(seed,style='ember',verify=()=>{}){const r=C.createRun(seed);let actions=0;while(!r.over&&actions<3000){verify(r);const a=decision(r,style);if(!commit(r,a))throw Error('Illegal bot decision '+JSON.stringify(a));actions++;}if(!r.over)throw Error('Expedition stalled');return{r,actions};}
