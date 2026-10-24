// Pure, deterministic expedition engine. Each public action commits one decision.
import {mulberry32,shuffle} from './rng.js';
import {CARDS,CARD,RELICS,RELIC,ENEMIES,AREAS,NODE_TYPES,effects,cardName} from './cinderpath-data.js';
export {CARDS,CARD,RELICS,RELIC,ENEMIES,AREAS,NODE_TYPES,cardName,cardText} from './cinderpath-data.js';
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const has=(r,id)=>r.relics.includes(id);
const pick=(r,a)=>a[Math.floor(r.rnd()*a.length)];
const live=b=>b.enemies.filter(e=>e.hp>0);
const note=(r,t)=>{if(r.battle){r.battle.log.unshift(t);r.battle.log=r.battle.log.slice(0,8);}};
export const ownedCard=(r,uid)=>r.deck.find(c=>c.uid===uid);
export const costOf=(r,c)=>CARD[c.id].cost;
export function createRun(seed=1){
 seed=seed>>>0;
 const r={schema:1,seed,rnd:mulberry32(seed),phase:'map',act:0,stage:0,lane:1,route:[],visited:[],deck:[],nextUid:1,hp:80,maxHp:80,gold:65,relics:['coal'],spentRelics:[],battle:null,loot:null,shop:null,event:null,wins:0,elites:0,turns:0,removals:0,score:0,over:false,won:false};
 for(const id of ['strike','strike','strike','strike','strike','brace','brace','brace','brace','kindle'])addCard(r,id);
 for(let act=0;act<3;act++)for(let row=0;row<6;row++){
  const types=row===0?['battle','battle','battle']:row===1?shuffle(r.rnd,['event','shop','battle']):row===2?shuffle(r.rnd,['battle','elite','camp']):row===3?shuffle(r.rnd,['shop','event','battle']):row===4?['elite','camp','battle']:['boss'];
  r.route.push(types.map((type,lane)=>({id:`${act}-${row}-${row===5?1:lane}`,type,lane:row===5?1:lane})));
 }return r;
}
function addCard(r,id,plus=false){if(r.deck.length>=60||!Object.hasOwn(CARD,id))return false;r.deck.push({uid:r.nextUid++,id,plus});return true;}
function addRelic(r,id){if(!id||has(r,id)||!Object.hasOwn(RELIC,id))return false;r.relics.push(id);if(id==='heart'){r.maxHp+=10;heal(r,10);}return true;}
function relicOffer(r){return pick(r,RELICS.filter(x=>!has(r,x.id)).map(x=>x.id))||null;}
function cardOffers(r,n=3,rare=false){const pool=CARDS.filter(c=>c.rarity>0&&(!rare||c.rarity>=2));return shuffle(r.rnd,pool).slice(0,n).map(c=>c.id);}
export const choices=r=>r.phase==='map'?r.route[r.act*6+r.stage].filter(n=>r.stage===0||Math.abs(n.lane-r.lane)<=1):[];
export function enterNode(r,id){
 if(r.over||r.phase!=='map')return false;const n=choices(r).find(n=>n.id===id);if(!n)return false;r.lane=n.lane;r.visited.push(n.id);r.loot=null;r.shop=null;r.event=null;r.battle=null;
 if(['battle','elite','boss'].includes(n.type))startBattle(r,n.type);
 else if(n.type==='camp')r.phase='camp';
 else if(n.type==='shop'){r.phase='shop';r.shop={cards:cardOffers(r).map(id=>({id,price:35+CARD[id].rarity*20,bought:false})),relic:relicOffer(r),relicBought:false,healed:false};}
 else{r.phase='event';const id=pick(r,['cache','altar','archive','reforge']);r.event={id,card:cardOffers(r,1,true)[0],relic:relicOffer(r)};}
 return true;
}
function advance(r){r.battle=null;r.loot=null;r.shop=null;r.event=null;r.stage++;if(r.stage===6){r.stage=0;r.act++;heal(r,15);}r.phase='map';}
function enemy(r,id,i,kind){const d=ENEMIES[id],extra=d.boss?0:r.act*5+(kind==='elite'?r.act*7:0);return{uid:i,id,hp:d.hp+extra,maxHp:d.hp+extra,block:0,strength:0,ember:0,weak:0,vulnerable:0,index:0,intent:{...d.pattern[0]}};}
function startBattle(r,kind){
 let ids;if(kind==='boss')ids=[AREAS[r.act].boss];else if(kind==='elite')ids=[r.act===0?'abbot':'stalker'];else{ids=[r.stage===0&&r.act===0?'mite':pick(r,AREAS[r.act].enemies)];if(r.stage>=3&&r.act>0)ids.push(r.act===1?'wisp':'hound');}
 r.phase='battle';r.battle={kind,turn:0,energy:0,block:0,strength:has(r,'crown')?1:0,weak:0,retain:false,powers:{kiln:0,thorns:0,afterglow:0,flow:0},cardsPlayed:0,firstAttack:true,draw:shuffle(r.rnd,r.deck.map(c=>c.uid)),hand:[],discard:[],exhaust:[],powersZone:[],enemies:ids.map((id,i)=>enemy(r,id,i,kind)),log:['The Lanternbearer raises the light.']};startTurn(r);
}
function heal(r,n){r.hp=Math.min(r.maxHp,r.hp+n);}
function loseHp(r,n){if(n<=0||r.over)return;r.hp=Math.max(0,r.hp-n);if(r.hp===0){if(has(r,'seed')&&!r.spentRelics.includes('seed')){r.spentRelics.push('seed');r.hp=Math.min(r.maxHp,30);note(r,'Dawnseed breaks. You return with 30 health.');}else{r.over=true;r.won=false;r.phase='defeat';}}}
function draw(r,n){const b=r.battle;for(let i=0;i<n&&b.hand.length<10;i++){if(!b.draw.length){if(!b.discard.length)break;b.draw=shuffle(r.rnd,b.discard);b.discard=[];}b.hand.push(b.draw.pop());}}
function startTurn(r){const b=r.battle;b.turn++;b.block=b.retain?b.block:has(r,'ward')?Math.min(5,b.block):0;b.retain=false;b.cardsPlayed=0;b.energy=3+(b.turn===1&&has(r,'glass')?1:0);if(has(r,'silk'))b.block+=3;if(b.turn===1&&has(r,'moss'))b.block+=8;draw(r,5+(b.turn===1&&has(r,'lens')?1:0));if(b.powers.afterglow)for(const e of live(b))applyEmber(r,e,b.powers.afterglow);}
function attackDamage(r,e,n,bonus=0){if(e.hp<=0)return;const b=r.battle;n=Math.floor(Math.max(0,n+b.strength+bonus)*(b.weak>0?.75:1)*(e.vulnerable>0?1.5:1));hitEnemy(e,n);}
function hitEnemy(e,n){const absorbed=Math.min(e.block,n);e.block-=absorbed;e.hp=Math.max(0,e.hp-n+absorbed);}
function applyEmber(r,e,n){if(e.hp<=0)return;e.ember=Math.min(500,e.ember+n+(has(r,'ash')?1:0));r.battle.block=Math.min(5000,r.battle.block+r.battle.powers.kiln);}
export function playCard(r,uid,targetUid=null){
 if(r.over||r.phase!=='battle')return false;const b=r.battle,c=ownedCard(r,uid);if(!c||!b.hand.includes(uid))return false;const d=CARD[c.id],cost=costOf(r,c),target=b.enemies.find(e=>e.uid===targetUid&&e.hp>0);
 if(b.energy<cost||d.target==='enemy'&&!target)return false;
 b.energy-=cost;b.hand.splice(b.hand.indexOf(uid),1);b.cardsPlayed=(b.cardsPlayed+1)%3;
 const bonus=d.type==='Attack'&&b.firstAttack&&has(r,'coal')?3:0;if(d.type==='Attack')b.firstAttack=false;
 note(r,cardName(c));
 for(const effect of effects(c)){
  const n=effect.value,targets=d.target==='all'?live(b):target?[target]:[];
  if(effect.kind==='damage')for(const e of targets)attackDamage(r,e,n,bonus);
  if(effect.kind==='block')b.block=Math.min(5000,b.block+n);
  if(effect.kind==='ember')for(const e of targets)applyEmber(r,e,n);
  if(effect.kind==='draw')draw(r,n);
  if(effect.kind==='energy')b.energy=Math.min(50,b.energy+n);
  if(effect.kind==='heal')heal(r,n);
  if(effect.kind==='loseHp')loseHp(r,n);
  if(effect.kind==='cleanse')b.weak=0;
  if(effect.kind==='retain')b.retain=true;
  if(effect.kind==='strength')b.strength=Math.min(200,b.strength+n);
  if(['kiln','thorns','afterglow','flow'].includes(effect.kind))b.powers[effect.kind]=Math.min(500,b.powers[effect.kind]+n);
  if(effect.kind==='weak'||effect.kind==='vulnerable')for(const e of targets)if(e.hp>0)e[effect.kind]=Math.min(500,e[effect.kind]+n);
  if(effect.kind==='emberDamage')for(const e of targets)attackDamage(r,e,e.ember*n,bonus);
  if(effect.kind==='detonate')for(const e of targets){const burn=e.ember;e.ember=0;attackDamage(r,e,burn*n,bonus);}
  if(effect.kind==='stoke')for(const e of targets)applyEmber(r,e,e.ember+n);
  if(effect.kind==='blockDamage')for(const e of targets)attackDamage(r,e,b.block*n,bonus);
  if(r.over)break;
 }
 if(!r.over&&b.powers.flow&&b.cardsPlayed%3===0)draw(r,b.powers.flow);
 // A resolving card cannot draw itself from discard, even when the deck is empty.
 (d.type==='Power'?b.powersZone:d.exhaust?b.exhaust:b.discard).push(uid);
 if(!r.over)checkVictory(r);return true;
}
export function intentText(r,e){const p=e.intent,damage=p.damage?Math.floor((p.damage+e.strength)*(1+r.act*.1)*(e.weak>0?.75:1)):0;return[damage?`${damage}${p.hits>1?' × '+p.hits:''} attack`:null,p.block?`${p.block} block`:null,p.strength?`+${p.strength} Strength`:null,p.heal?`${p.heal} heal`:null,p.weak?`${p.weak} Weak`:null].filter(Boolean).join(' · ');}
export function incoming(r){return r.battle?.enemies.filter(e=>e.hp>0).reduce((n,e)=>n+(e.intent.damage?Math.floor((e.intent.damage+e.strength)*(1+r.act*.1)*(e.weak>0?.75:1))*e.intent.hits:0),0)||0;}
export function endTurn(r){
 if(r.over||r.phase!=='battle')return false;const b=r.battle;b.discard.push(...b.hand);b.hand=[];b.weak=Math.max(0,b.weak-1);r.turns++;
 // Ember resolves before any enemy acts. Dead enemies never take a turn.
 for(const e of live(b)){e.block=0;const burn=e.ember;e.hp=Math.max(0,e.hp-burn);e.ember=Math.max(0,burn-1);if(burn)note(r,`${ENEMIES[e.id].name} takes ${burn} Ember damage.`);}
 if(checkVictory(r))return true;
 for(const e of live(b)){
  const p=e.intent;e.block=p.block||0;if(p.heal)e.hp=Math.min(e.maxHp,e.hp+p.heal);
  const damage=p.damage?Math.floor((p.damage+e.strength)*(1+r.act*.1)*(e.weak>0?.75:1)):0;
  for(let i=0;i<p.hits&&damage&&!r.over&&e.hp>0;i++){
   const blocked=Math.min(b.block,damage);b.block-=blocked;loseHp(r,damage-blocked);if(blocked&&b.powers.thorns)hitEnemy(e,b.powers.thorns);
  }
  if(r.over)return true;if(p.weak)b.weak=Math.min(500,b.weak+p.weak);e.strength=Math.min(200,e.strength+(p.strength||0));e.weak=Math.max(0,e.weak-1);e.vulnerable=Math.max(0,e.vulnerable-1);e.index=(e.index+1)%ENEMIES[e.id].pattern.length;e.intent={...ENEMIES[e.id].pattern[e.index]};
  if(checkVictory(r))return true;
 }
 startTurn(r);return true;
}
function checkVictory(r){if(live(r.battle).length)return false;const kind=r.battle.kind;r.wins++;if(kind==='elite')r.elites++;r.score+=kind==='boss'?300:kind==='elite'?125:60;if(has(r,'kit'))heal(r,3);
 if(kind==='boss'&&r.act===2){r.over=true;r.won=true;r.phase='complete';r.score+=500+r.hp*3;return true;}
 const gold=Math.floor((kind==='boss'?65:kind==='elite'?40:24)*(has(r,'coin')?1.25:1));r.gold+=gold;let relic=null;if(kind!=='battle'){relic=relicOffer(r);if(relic)addRelic(r,relic);}r.loot={cards:cardOffers(r,3,kind==='boss'),gold,relic};r.phase='reward';return true;
}
export function takeReward(r,id=null){if(r.over||r.phase!=='reward'||id!==null&&!r.loot.cards.includes(id))return false;if(id!==null&&!addCard(r,id))return false;advance(r);return true;}
export function camp(r,action,uid=null){if(r.over||r.phase!=='camp')return false;if(action==='rest')heal(r,Math.ceil(r.maxHp*.3));else if(action==='upgrade'){const c=ownedCard(r,uid);if(!c||c.plus)return false;c.plus=true;}else if(action!=='leave')return false;advance(r);return true;}
export function buy(r,kind,index=null){
 if(r.over||r.phase!=='shop')return false;const s=r.shop;
 if(kind==='card'){const offer=s.cards[index];if(!offer||offer.bought||r.gold<offer.price||r.deck.length>=60)return false;r.gold-=offer.price;addCard(r,offer.id);offer.bought=true;}
 else if(kind==='relic'){if(!s.relic||s.relicBought||r.gold<135||has(r,s.relic))return false;r.gold-=135;addRelic(r,s.relic);s.relicBought=true;}
 else if(kind==='heal'){if(s.healed||r.gold<35||r.hp===r.maxHp)return false;r.gold-=35;heal(r,20);s.healed=true;}
 else if(kind==='remove'){const c=ownedCard(r,index),price=45+r.removals*10;if(!c||r.deck.length<=5||r.gold<price)return false;r.gold-=price;r.deck.splice(r.deck.indexOf(c),1);r.removals++;}
 else return false;return true;
}
export function leaveShop(r){if(r.over||r.phase!=='shop')return false;advance(r);return true;}
export function eventChoice(r,choice,uid=null){
 if(r.over||r.phase!=='event')return false;const e=r.event;
 if(choice!=='leave'){
  if(e.id==='cache'){if(choice==='gold')r.gold+=50;else if(choice==='heal')heal(r,12);else return false;}
  else if(e.id==='altar'){if(choice!=='relic'||r.hp<=9||!e.relic||has(r,e.relic))return false;loseHp(r,9);addRelic(r,e.relic);}
  else if(e.id==='archive'){if(choice==='card'){if(!addCard(r,e.card))return false;}else if(choice==='heal')heal(r,12);else return false;}
  else if(e.id==='reforge'){if(choice!=='upgrade')return false;const c=ownedCard(r,uid);if(!c||c.plus)return false;c.plus=true;}
  else return false;
 }advance(r);return true;
}
export const result=r=>({score:r.score,level:r.act+1,completed:true,variant:'lanternbearer',extra:[r.won?'The last ember becomes a new dawn.':'The ember fades. A new expedition awaits.',`${r.wins} battles won · ${r.turns} turns`,`${r.deck.length} cards · ${r.relics.length} relics`]});
// Imported checkpoints are untrusted. Validate every value used by rules or DOM.
export function valid(r){
 if(!r||r.schema!==1||!int(r.seed,0,4294967295)||typeof r.rnd!=='function'||typeof r.rnd.getState!=='function'||!['map','battle','reward','camp','shop','event'].includes(r.phase)||r.over!==false||r.won!==false||!int(r.act,0,2)||!int(r.stage,0,5)||!int(r.lane,0,2)||!int(r.maxHp,1,1000)||!int(r.hp,1,r.maxHp)||!int(r.gold,0,1000000)||!int(r.nextUid,1,100000)||!['wins','elites','turns','removals','score'].every(k=>int(r[k],0,1000000)))return false;
 if(!Array.isArray(r.deck)||r.deck.length<5||r.deck.length>60||!r.deck.every(c=>c&&int(c.uid,1,r.nextUid-1)&&Object.hasOwn(CARD,c.id)&&typeof c.plus==='boolean')||new Set(r.deck.map(c=>c.uid)).size!==r.deck.length)return false;
 if(!Array.isArray(r.relics)||r.relics.length>12||!r.relics.every(id=>Object.hasOwn(RELIC,id))||new Set(r.relics).size!==r.relics.length||!Array.isArray(r.spentRelics)||r.spentRelics.some(id=>id!=='seed'||!has(r,id))||r.spentRelics.length>1)return false;
 if(!Array.isArray(r.route)||r.route.length!==18||!r.route.every((row,i)=>Array.isArray(row)&&row.length===(i%6===5?1:3)&&row.every((n,j)=>n&&n.lane===(i%6===5?1:j)&&n.id===`${Math.floor(i/6)}-${i%6}-${n.lane}`&&Object.hasOwn(NODE_TYPES,n.type)&&(i%6===5?n.type==='boss':n.type!=='boss'))))return false;
 const index=r.act*6+r.stage;if(!Array.isArray(r.visited)||r.visited.length!==index+(r.phase==='map'?0:1)||!r.visited.every((id,i)=>r.route[i].some(n=>n.id===id)))return false;
 for(let i=1;i<r.visited.length;i++)if(i%6!==0&&Math.abs(r.route[i].find(n=>n.id===r.visited[i]).lane-r.route[i-1].find(n=>n.id===r.visited[i-1]).lane)>1)return false;
 if(r.visited.length&&r.lane!==r.route[r.visited.length-1].find(n=>n.id===r.visited.at(-1)).lane)return false;
 const node=r.phase==='map'?null:r.route[index].find(n=>n.id===r.visited.at(-1));
 if(node&&!(['battle','reward'].includes(r.phase)?['battle','elite','boss'].includes(node.type):r.phase===node.type))return false;
 if(['battle','reward'].includes(r.phase)){
  const b=r.battle;if(!b||!['battle','elite','boss'].includes(b.kind)||b.kind!==node.type||!int(b.turn,1,10000)||!int(b.energy,0,50)||!int(b.block,0,5000)||!int(b.strength,0,200)||!int(b.weak,0,500)||typeof b.retain!=='boolean'||typeof b.firstAttack!=='boolean'||!int(b.cardsPlayed,0,1000)||!b.powers||!['kiln','thorns','afterglow','flow'].every(k=>int(b.powers[k],0,500)))return false;
  const zones=['draw','hand','discard','exhaust','powersZone'];if(!zones.every(k=>Array.isArray(b[k])&&b[k].length<=60)||b.hand.length>10)return false;const uids=zones.flatMap(k=>b[k]);if(uids.length!==r.deck.length||new Set(uids).size!==uids.length||!uids.every(uid=>ownedCard(r,uid))||!b.powersZone.every(uid=>CARD[ownedCard(r,uid).id].type==='Power'))return false;
  if(!Array.isArray(b.enemies)||b.enemies.length<1||b.enemies.length>2||!b.enemies.every((e,i)=>e&&e.uid===i&&Object.hasOwn(ENEMIES,e.id)&&int(e.maxHp,1,1000)&&int(e.hp,0,e.maxHp)&&['block','strength','ember','weak','vulnerable'].every(k=>int(e[k],0,k==='block'?5000:k==='strength'?200:500))&&int(e.index,0,ENEMIES[e.id].pattern.length-1)&&e.intent&&Object.keys(e.intent).length===Object.keys(ENEMIES[e.id].pattern[e.index]).length&&Object.entries(ENEMIES[e.id].pattern[e.index]).every(([k,v])=>e.intent[k]===v))||!Array.isArray(b.log)||b.log.length>8||!b.log.every(t=>typeof t==='string'&&t.length<200))return false;
  if(r.phase==='battle'&&!live(b).length||r.phase==='reward'&&live(b).length)return false;
 }
 if(r.phase==='reward'&&(!r.loot||!Array.isArray(r.loot.cards)||r.loot.cards.length!==3||new Set(r.loot.cards).size!==3||!r.loot.cards.every(id=>Object.hasOwn(CARD,id))||!int(r.loot.gold,0,1000)||r.loot.relic!==null&&(!Object.hasOwn(RELIC,r.loot.relic)||!has(r,r.loot.relic))))return false;
 if(r.phase==='shop'&&(!r.shop||!Array.isArray(r.shop.cards)||r.shop.cards.length!==3||!r.shop.cards.every(c=>c&&Object.hasOwn(CARD,c.id)&&int(c.price,1,1000)&&typeof c.bought==='boolean')||r.shop.relic!==null&&!Object.hasOwn(RELIC,r.shop.relic)||typeof r.shop.relicBought!=='boolean'||typeof r.shop.healed!=='boolean'))return false;
 if(r.phase==='event'&&(!r.event||!['cache','altar','archive','reforge'].includes(r.event.id)||!Object.hasOwn(CARD,r.event.card)||r.event.relic!==null&&!Object.hasOwn(RELIC,r.event.relic)))return false;
 return true;
}
