// Legal development policy, used for balance signals and complete-run regressions.
import * as C from '../js/games/cinderpath-core.js';
import {mulberry32} from '../js/games/rng.js';
export function copy(r){const c=JSON.parse(JSON.stringify(r));c.rnd=mulberry32(r.rnd.getState());return c;}
const rank={afterglow:13,kiln:10,wildfire:10,stoke:9,backdraft:9,flashover:9,kindle:8,detonate:8,dart:6,charbolt:8,emberglass:6,pyre:8,coalfold:9,heatsink:9,cindersight:8,phoenix:10,ashmemory:8,emberrain:10,vow:11,bastion:8,hold:8,shieldbash:10,riposte:10,chill:8,secondwind:8,temper:9,rivets:8,hammerfall:12,quench:9,towerguard:9,slatesting:8,anvilchorus:12,shieldwall:9,rallyplate:7,anchor:8,rebuckle:8,steelwill:12,bulwark:9,ram:8,fortressoath:11,starmark:8,stardust:7,lance:11,orbitguard:9,constellation:12,comet:11,moondraw:10,satellite:8,prismburst:9,eclipse:8,astralstep:7,voidchart:8,afterimage:12,moonwell:10,gravity:9,lunarblade:9,starforge:8,timestitch:8,aetherweave:8,supernova:10,northstar:12,mend:10,siphon:8,purge:5,nova:9,flow:9,battlecry:10,flurry:9,hammer:8,foresight:8,quickstep:8,spark:8,expose:8,fervor:6,brace:2,strike:1};
export const rankCard=id=>rank[id]??0;
export function bestPlay(r){
 const b=r.battle,hp=b.enemies.reduce((n,e)=>n+e.hp,0),burn=b.enemies.reduce((n,e)=>n+e.ember,0),blocked=b.enemies.reduce((n,e)=>n+e.block,0),danger=C.incoming(r);let best=null;
 for(const uid of b.hand){const c=C.ownedCard(r,uid),d=C.CARD[c.id],cost=C.costOf(r,c),targets=d.target==='enemy'?b.enemies.filter(e=>e.hp>0).map(e=>e.uid):[null];for(const target of targets){if(!C.canPlay(r,uid,target))continue;const q=copy(r);C.playCard(q,uid,target);const qb=q.battle;if(q.phase==='reward'||q.won)return{uid,target,value:10000};if(q.over)continue;
  let value=hp-qb.enemies.reduce((n,e)=>n+e.hp,0)+(blocked-qb.enemies.reduce((n,e)=>n+e.block,0))*.3+(qb.enemies.reduce((n,e)=>n+e.ember,0)-burn)*1.8;
  value+=(Math.min(danger,qb.block)-Math.min(danger,b.block))*1.2+(danger-C.incoming(q))*.8+(q.hp-r.hp)*(1.8+(1-r.hp/r.maxHp)*2)+(qb.strength-b.strength)*6;
  for(const [key,weight]of Object.entries({kiln:3,thorns:4,afterglow:5,flow:5,forgeTurn:6,glimmerTurn:6,dexterity:6,drawTurn:9,emberHit:5,starsEdge:5}))value+=(qb.powers[key]-b.powers[key])*weight;
  value+=(qb.forge-b.forge)*1.8+(qb.glimmer-b.glimmer)*2.2+(qb.hand.length-b.hand.length+1)*2+(qb.energy-b.energy+cost)*7-cost*.25+(qb.generated.length-b.generated.length)*2;
  if(qb.choice&&!b.choice)value+=4;if(qb.retain&&!b.retain)value+=Math.min(qb.block,12)*.5;if(qb.retainHand&&!b.retainHand)value+=qb.hand.length;
  if(value>.05&&(!best||value>best.value))best={uid,target,value};
 }}return best;
}
function relicRank(id,r){return({seed:14,spool:14,glass:13,silk:12,kit:12,ring:11,crown:10,ash:r.hero==='lantern'?13:5,whetstone:10,heart:10,locket:10,shard:12,needle:10,feather:9,ward:9,sundial:12,furnace:10,glasspact:r.hp>r.maxHp*.8?9:3,hollow:8,tribute:11,burdenpact:6}[id]??7);}
export function decision(r){
 if(r.over)return null;
 if(r.phase==='map'){const rank=n=>n.type==='ancient'||n.type==='treasure'||n.type==='boss'?120:n.type==='camp'?(r.hp<r.maxHp*.75?110:75):n.type==='event'?84:n.type==='shop'?(r.gold>=75?90:15):n.type==='unknown'?76:n.type==='elite'?(r.hp>r.maxHp*.83&&r.deck.length>=13?78:5):72;const n=[...C.choices(r)].sort((a,b)=>rank(b)-rank(a))[0];return{type:'node',id:n.id};}
 if(r.phase==='ancient')return{type:'boon',id:r.act===0?'vigor':[...r.gift.relics].sort((a,b)=>relicRank(b,r)-relicRank(a,r))[0]||'leave'};
 if(r.phase==='treasure')return r.gift.relics.length?{type:'relic',id:[...r.gift.relics].sort((a,b)=>relicRank(b,r)-relicRank(a,r))[0]}:{type:'leaveTreasure'};
 if(r.phase==='battle'){
  const b=r.battle;if(b.choice){const c=b.choice;if(c.kind==='scry')return{type:'choice',uids:c.cards.filter(uid=>{const card=C.ownedCard(r,uid);return C.CARD[card.id].unplayable||r.deck.length>=14&&['strike','brace'].includes(card.id)&&!card.plus;})};return{type:'choice',uids:[[...c.cards].sort((a,b)=>rankCard(C.ownedCard(r,b).id)-rankCard(C.ownedCard(r,a).id))[0]]};}
  for(let i=0;i<r.potions.length;i++){const p=C.POTION[r.potions[i]],target=b.enemies.find(e=>e.hp>0)?.uid;let use=false;
   if(p.kind==='heal')use=r.hp<=r.maxHp-15;
   if(p.kind==='damage')use=b.enemies.some(e=>e.hp>0&&e.hp<=20)||b.energy===0;
   if(p.kind==='block')use=C.incoming(r)>b.block+10&&r.hp<r.maxHp*.8;
   if(p.kind==='energy')use=b.energy===0&&b.hand.some(uid=>C.CARD[C.ownedCard(r,uid).id].cost>0&&!C.CARD[C.ownedCard(r,uid).id].unplayable);
   if(p.kind==='draw')use=b.hand.length<=2&&b.energy>0;
   if(p.kind==='ember')use=b.turn<=2;
   if(p.kind==='cleanse')use=b.weak>0||Object.keys(b.afflictions).length>1;
   if(p.kind==='resource')use=r.hero==='lantern'?b.energy===0:r.hero==='ironbound'?b.forge<3:b.glimmer<3;
   if(use)return{type:'potion',index:i,target:p.target==='enemy'?(b.enemies.find(e=>e.hp>0&&e.hp<=20)?.uid??target):null};
  }
  const p=bestPlay(r);return p?{type:'play',...p}:{type:'end'};
 }
 if(r.phase==='reward'){
  if(r.loot.relics.length&&!r.loot.relicTaken)return{type:'relic',id:[...r.loot.relics].sort((a,b)=>relicRank(b,r)-relicRank(a,r))[0]};
  if(r.loot.potion&&!r.loot.potionTaken&&r.potions.length<C.potionCapacity(r))return{type:'takePotion'};
  if(!r.loot.cardTaken){const id=[...r.loot.cards].sort((a,b)=>rankCard(b)-rankCard(a))[0];return{type:'reward',id:r.deck.length<20&&rankCard(id)>=7?id:null};}return{type:'finishReward'};
 }
 if(r.phase==='camp'){const cards=r.deck.filter(c=>!c.plus&&!C.CARD[c.id].unplayable).sort((a,b)=>rankCard(b.id)-rankCard(a.id));return r.hp<r.maxHp*.72&&!r.relics.includes('glasspact')||!cards.length&&!r.relics.includes('glasspact')?{type:'camp',action:'rest'}:cards.length?{type:'camp',action:'upgrade',uid:cards[0].uid}:{type:'camp',action:'leave'};}
 if(r.phase==='shop'){
  const s=r.shop;if(r.hp<r.maxHp*.7&&!s.healed&&r.gold>=s.healPrice)return{type:'buy',kind:'heal'};
  if(s.relic&&!s.relicBought&&r.gold>=s.relicPrice&&relicRank(s.relic,r)>=8)return{type:'buy',kind:'relic'};
  const o=s.cards.map((c,i)=>({...c,i})).filter(c=>!c.bought&&c.price<=r.gold&&rankCard(c.id)>=9&&r.deck.length<19).sort((a,b)=>rankCard(b.id)-rankCard(a.id))[0];if(o)return{type:'buy',kind:'card',index:o.i};
  if(r.gold>=s.removePrice&&r.deck.length>10){const c=r.deck.find(c=>C.CARD[c.id].type==='Curse')||r.deck.find(c=>c.id==='strike'&&!c.plus&&!c.enchant);if(c)return{type:'buy',kind:'remove',index:c.uid};}
  const p=s.potions.findIndex(o=>!o.bought&&o.price<=r.gold&&['lifedrop','emberoil','suntonic'].includes(o.id));if(p>=0&&r.potions.length<C.potionCapacity(r))return{type:'buy',kind:'potion',index:p};return{type:'leaveShop'};
 }
 const e=r.event;if(e.id==='cache')return{type:'event',choice:r.hp<r.maxHp*.8?'heal':'gold'};
 if(e.id==='altar')return{type:'event',choice:r.hp>35&&e.relic?'relic':'leave'};
 if(e.id==='archive')return{type:'event',choice:r.hp<r.maxHp*.75?'heal':rankCard(e.card)>=8&&r.deck.length<20?'card':'leave'};
 if(e.id==='cursedcache')return{type:'event',choice:e.relic&&relicRank(e.relic,r)>=9&&r.deck.length<60?'relic':'leave'};
 if(e.id==='caravan')return{type:'event',choice:r.gold>=15&&r.potions.length<C.potionCapacity(r)?'potion':'leave'};
 if(e.id==='fountain'){const curse=r.deck.find(c=>C.CARD[c.id].type==='Curse');return curse&&r.hp>r.maxHp*.65?{type:'event',choice:'purify',uid:curse.uid}:{type:'event',choice:'heal'};}
 if(e.id==='purifier'){const c=r.deck.find(c=>C.CARD[c.id].type==='Curse')||r.deck.find(c=>c.id==='strike'&&!c.plus);return c&&r.hp>25&&r.deck.length>10?{type:'event',choice:'remove',uid:c.uid}:{type:'event',choice:'leave'};}
 if(e.id==='mirror'){const c=r.deck.find(c=>c.id==='strike'&&!c.plus)||r.deck.find(c=>c.id==='brace'&&!c.plus);return c&&rankCard(e.card)>=7?{type:'event',choice:'transform',uid:c.uid}:{type:'event',choice:'leave'};}
 const cards=r.deck.filter(c=>e.id==='scriptorium'?C.enchantEligible(c,e.enchant):!c.plus&&!C.CARD[c.id].unplayable).sort((a,b)=>rankCard(b.id)-rankCard(a.id));return cards.length?{type:'event',choice:e.id==='scriptorium'?'enchant':'upgrade',uid:cards[0].uid}:{type:'event',choice:'leave'};
}
export function commit(r,a){switch(a.type){case'node':return C.enterNode(r,a.id);case'play':return C.playCard(r,a.uid,a.target);case'end':return C.endTurn(r);case'choice':return C.resolveChoice(r,a.uids);case'potion':return C.usePotion(r,a.index,a.target);case'reward':return C.takeReward(r,a.id,true);case'finishReward':return C.finishReward(r);case'relic':return C.takeRelic(r,a.id);case'takePotion':return C.takePotion(r);case'camp':return C.camp(r,a.action,a.uid);case'buy':return C.buy(r,a.kind,a.index);case'leaveShop':return C.leaveShop(r);case'boon':return C.chooseBoon(r,a.id,a.uid);case'leaveTreasure':return C.leaveTreasure(r);default:return C.eventChoice(r,a.choice,a.uid);}}
export function expedition(seed,hero='lantern',verify=()=>{},challenge=0){const r=C.createRun(seed,{hero,challenge});let actions=0;while(!r.over&&actions<5000){verify(r);const a=decision(r);if(!commit(r,a))throw Error('Illegal bot decision '+JSON.stringify(a));actions++;}if(!r.over)throw Error('Expedition stalled '+hero+' seed '+seed+' '+r.phase+' '+r.act+':'+r.stage);return{r,actions};}
