// Original deterministic solo roguelike. Public actions commit stable save boundaries.
import {mulberry32,shuffle} from './rng.js';
import * as D from './cinderpath-data.js';
import {validLegacy} from './cinderpath-legacy.js';
export * from './cinderpath-data.js';
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const has=(r,id)=>r.relics.includes(id);
const pick=(r,a)=>a.length?a[Math.floor(r.rnd()*a.length)]:null;
const live=b=>b.enemies.filter(e=>e.hp>0);
const POWER_KEYS=['kiln','thorns','afterglow','flow','forgeTurn','glimmerTurn','dexterity','drawTurn','emberHit','starsEdge'];
const PHASES=['map','battle','reward','camp','shop','event','ancient','treasure'];
const note=(r,text)=>{if(r.battle){r.battle.log.unshift(text);r.battle.log=r.battle.log.slice(0,10);}};
export const heroOf=r=>D.HEROES.find(h=>h.id===r.hero);
export const areaOf=r=>r.variants[r.act]?D.ALTERNATE_AREAS[r.act]:D.AREAS[r.act];
export const ownedCard=(r,uid)=>r.deck.find(c=>c.uid===uid)||r.battle?.generated.find(c=>c.uid===uid);
export const cardPool=r=>D.PLAYABLE_CARDS.filter(c=>c.rarity>0&&(c.hero===r.hero||c.hero==='neutral'));
export const potionCapacity=r=>has(r,'sundial')?1:has(r,'pouch')?4:3;
export function costOf(r,c){const d=D.CARD[c.id],b=r.battle;if(d.xCost)return b?.energy??0;return has(r,'spool')&&b?.firstCard?0:Math.max(0,d.cost-(c.enchant==='swift'?1:0)+(b?.afflictions[c.uid]==='taxed'?1:0));}
export function canPlay(r,uid,targetUid=null){if(r.over||r.phase!=='battle'||r.battle.choice)return false;const b=r.battle,c=ownedCard(r,uid);if(!c||!b.hand.includes(uid))return false;const d=D.CARD[c.id];return !d.unplayable&&b.energy>=costOf(r,c)&&b.glimmer>=(d.glimmerCost||0)&&(!d.needsGlimmer||b.glimmer>0)&&(!d.effects.some(e=>['forgedDamage','forgeBlock'].includes(e.kind))||b.forge>0)&&(d.target!=='enemy'||b.enemies.some(e=>e.uid===targetUid&&e.hp>0));}
export function createRun(seed=1,{hero='lantern',challenge=0}={}){
 seed=seed>>>0;if(!D.HEROES.some(h=>h.id===hero))hero='lantern';challenge=int(challenge,0,5)?challenge:0;const h=D.HEROES.find(h=>h.id===hero);
 const r={schema:2,seed,rnd:mulberry32(seed),hero,challenge,runId:`${hero}_${seed}`,floors:12,legacy:false,variants:[],phase:'map',act:0,stage:0,lane:1,route:[],visited:[],deck:[],nextUid:1,nextEnemyUid:1,hp:h.hp,maxHp:h.hp,gold:70,relics:[h.relic],spentRelics:[],potions:['lifedrop'],battle:null,loot:null,shop:null,event:null,gift:null,wins:0,elites:0,turns:0,removals:0,score:0,over:false,won:false,discovered:{cards:[],relics:[h.relic],enemies:[]}};
 const starter=hero==='ironbound'?['strike','strike','strike','strike','brace','brace','brace','brace','temper','hammerfall']:hero==='starweaver'?['strike','strike','strike','strike','brace','brace','brace','brace','starmark','lunarblade']:['strike','strike','strike','strike','strike','brace','brace','brace','brace','kindle'];
 for(const id of starter)addCard(r,id);
 if(challenge>=3)addCard(r,'burden');
 r.variants=Array.from({length:3},()=>r.rnd()<.5?0:1);
 for(let act=0;act<3;act++)for(let row=0;row<12;row++){
  let types;if(row===0)types=['ancient'];else if(row===5)types=['treasure'];else if(row===10)types=['camp'];else if(row===11)types=['boss'];else if(row===1)types=['battle','battle','battle'];else{const pool=row<3?['battle','battle','unknown','event','shop']:['battle','battle','unknown','event','shop','elite','camp'];types=Array.from({length:3},()=>pick(r,pool));if(types.every(t=>t==='shop'||t==='camp'))types[1]='battle';}
  r.route.push(types.map((type,lane)=>({id:`${act}-${row}-${types.length===1?1:lane}`,type,lane:types.length===1?1:lane,next:[]})));
 }
 for(let i=0;i<r.route.length;i++){if(i%12===11)continue;const row=r.route[i],next=r.route[i+1];for(const n of row){if(next.length===1)n.next=[next[0].id];else if(row.length===1)n.next=next.map(n=>n.id);else{n.next=[next[n.lane].id];for(const t of next)if(Math.abs(t.lane-n.lane)===1&&r.rnd()<.48)n.next.push(t.id);}}}
 return r;
}
function addCard(r,id,plus=false){if(r.deck.length>=60||!Object.hasOwn(D.CARD,id)||D.CARD[id].temporary)return false;r.deck.push({uid:r.nextUid++,id,plus,enchant:null});discover(r,'cards',id);return true;}
function discover(r,kind,id){if(!r.discovered[kind].includes(id))r.discovered[kind].push(id);}
function heal(r,n){r.hp=Math.min(r.maxHp,r.hp+n);}
function addRelic(r,id){if(!id||has(r,id)||!Object.hasOwn(D.RELIC,id))return false;r.relics.push(id);discover(r,'relics',id);if(id==='heart'||id==='tribute'){const n=id==='heart'?10:15;r.maxHp+=n;heal(r,n);}if(id==='whetstone')for(const c of shuffle(r.rnd,r.deck.filter(c=>D.CARD[c.id].type==='Attack'&&!c.plus)).slice(0,2))c.plus=true;if(id==='sundial')while(r.potions.length>1){r.potions.pop();r.gold+=10;}return true;}
function relicOffers(r,n=3,pact=false){return shuffle(r.rnd,D.RELICS.filter(x=>!x.starter&&!has(r,x.id)&&(!x.hero||x.hero===r.hero)&&(pact?x.rarity==='pact':x.rarity!=='pact'))).slice(0,n).map(x=>x.id);}
function cardOffers(r,n=3,rare=false){const pool=[...cardPool(r).filter(c=>!rare||c.rarity>=2)],result=[];while(result.length<n&&pool.length){const weights=pool.map(c=>rare?(c.rarity===3?3:5):c.rarity===1?7:c.rarity===2?3:1);let roll=r.rnd()*weights.reduce((a,b)=>a+b,0),i=0;for(;i<weights.length-1;i++){roll-=weights[i];if(roll<0)break;}result.push(pool.splice(i,1)[0].id);}return result;}
function price(r,n){return Math.ceil(n*(has(r,'boots')?.85:1)*(has(r,'tribute')?1.2:1)*(r.challenge>=4?1.15:1));}
export function choices(r){if(r.over||r.phase!=='map')return [];const row=r.route[r.act*r.floors+r.stage];if(r.stage===0)return row;const prev=r.route[r.act*r.floors+r.stage-1].find(n=>n.id===r.visited.at(-1));return row.filter(n=>prev.next.includes(n.id));}
export function enterNode(r,id){
 if(r.over||r.phase!=='map')return false;const n=choices(r).find(n=>n.id===id);if(!n)return false;r.lane=n.lane;r.visited.push(n.id);r.loot=null;r.shop=null;r.event=null;r.battle=null;r.gift=null;
 if(n.type==='unknown')n.type=pick(r,['event','event','battle','treasure']);
 if(['battle','elite','boss'].includes(n.type))startBattle(r,n.type);
 else if(n.type==='camp')r.phase='camp';
 else if(n.type==='shop'){r.phase='shop';r.shop={cards:cardOffers(r,4).map(id=>({id,price:price(r,35+D.CARD[id].rarity*18),bought:false})),relic:relicOffers(r,1)[0]||null,relicBought:false,relicPrice:price(r,135),healed:false,healPrice:price(r,35),removePrice:price(r,45+r.removals*10),potions:shuffle(r.rnd,D.POTIONS).slice(0,2).map(p=>({id:p.id,price:price(r,35),bought:false}))};}
 else if(n.type==='treasure'){r.phase='treasure';r.gift={relics:relicOffers(r),taken:false};}
 else if(n.type==='ancient'){r.phase='ancient';r.gift=r.act===0?{offers:['vigor','fortune','rune'],relics:[]}:{offers:[],relics:relicOffers(r,3,true)};}
 else{r.phase='event';r.event={id:pick(r,['cache','altar','archive','reforge','scriptorium','cursedcache','purifier','caravan','fountain','mirror']),card:cardOffers(r,1,true)[0],relic:relicOffers(r,1)[0]||null,enchant:pick(r,Object.keys(D.ENCHANTMENTS)),potion:pick(r,D.POTIONS).id};}
 return true;
}
function advance(r){r.battle=null;r.loot=null;r.shop=null;r.event=null;r.gift=null;r.stage++;if(r.stage===r.floors){r.stage=0;r.act++;heal(r,15);}r.phase='map';}
function enemy(r,id,kind){const d=D.ENEMIES[id],scale=r.legacy?1:1+(r.challenge>=1?.08:0)+(r.challenge>=5&&d.boss?.15:0),extra=d.boss?0:r.act*4+(kind==='elite'?r.act*5:0);const hp=Math.ceil((d.hp+extra)*scale);discover(r,'enemies',id);return{uid:r.nextEnemyUid++,id,hp,maxHp:hp,block:0,strength:0,ember:0,weak:0,vulnerable:0,index:0,intent:{...d.pattern[0]},awakened:false};}
function startBattle(r,kind){
 let ids;if(kind==='boss')ids=[areaOf(r).boss];else if(kind==='elite')ids=[pick(r,r.act===0?['abbot','scarab']:['stalker','scarab'])];else{ids=[r.act===0&&r.wins===0?'mite':pick(r,areaOf(r).enemies)];if(r.stage>=7&&r.act>0)ids.push(r.act===1?'wisp':'pilgrim');}
 const b=r.battle={kind,turn:0,energy:0,block:0,strength:(has(r,'crown')?1:0)+(has(r,'hollow')?3:0),weak:has(r,'hollow')?1:0,retain:false,retainHand:false,forge:0,glimmer:has(r,'prism')?3:0,powers:Object.fromEntries(POWER_KEYS.map(k=>[k,0])),cardsPlayed:0,firstAttack:true,firstCard:true,blockBonus:true,draw:shuffle(r.rnd,r.deck.map(c=>c.uid)),hand:[],discard:[],exhaust:[],powersZone:[],look:[],deckUids:r.deck.map(c=>c.uid),generated:[],afflictions:{},choice:null,enemies:ids.map(id=>enemy(r,id,kind)),log:[`${heroOf(r).name} raises the light.`]};
 if(has(r,'burdenpact'))for(let i=0;i<2;i++)generate(r,'burden','draw');r.phase='battle';startTurn(r);
}
function generate(r,id,zone='hand'){const b=r.battle;if(b.generated.length>=120)return false;const c={uid:r.nextUid++,id,plus:false,enchant:null};discover(r,'cards',id);b.generated.push(c);if(zone==='hand'&&b.hand.length>=10)zone='discard';b[zone].push(c.uid);return true;}
function loseHp(r,n){if(n<=0||r.over)return;r.hp=Math.max(0,r.hp-n);if(r.hp===0){if(has(r,'seed')&&!r.spentRelics.includes('seed')){r.spentRelics.push('seed');r.hp=Math.min(r.maxHp,30);note(r,'Dawnseed breaks. Return with 30 health.');}else{r.over=true;r.won=false;r.phase='defeat';}}}
function gainBlock(r,n){const b=r.battle;if(n<=0)return;n+=b.powers.dexterity;if(has(r,'anvil')&&b.blockBonus){n+=3;b.forge=Math.min(12,b.forge+1);b.blockBonus=false;}b.block=Math.min(5000,b.block+n);}
function draw(r,n){const b=r.battle;if(b.choice){b.choice.deferredDraw=Math.min(100,(b.choice.deferredDraw||0)+n);return;}for(let i=0;i<n&&b.hand.length<10;i++){if(!b.draw.length){if(!b.discard.length)break;b.draw=shuffle(r.rnd,b.discard);b.discard=[];}b.hand.push(b.draw.pop());}}
function exhaust(r,uid){const b=r.battle;b.exhaust.push(uid);if(has(r,'feather'))draw(r,1);}
function startTurn(r){const b=r.battle;b.turn++;b.block=b.retain?b.block:has(r,'ward')?Math.min(5,b.block):0;b.retain=false;b.blockBonus=true;b.cardsPlayed=0;b.energy=3+(has(r,'furnace')?1:0)+(has(r,'sundial')?1:0)+(has(r,'glasspact')?1:0)+(has(r,'bellcharm')&&b.turn%3===0?1:0)+(b.turn===1&&has(r,'glass')?1:0);b.forge=Math.min(12,b.forge+b.powers.forgeTurn);b.glimmer=Math.min(12,b.glimmer+b.powers.glimmerTurn+(has(r,'shard')?1:0)+(has(r,'prism')&&b.turn>1?1:0));if(has(r,'silk'))gainBlock(r,3);if(b.turn===1&&has(r,'moss'))gainBlock(r,8);
 if(b.turn===1){const innate=b.draw.filter(uid=>D.CARD[ownedCard(r,uid).id].innate);b.draw=b.draw.filter(uid=>!innate.includes(uid));b.hand.push(...innate.slice(0,10));b.discard.push(...innate.slice(10));}
 draw(r,Math.max(0,5+(b.turn===1&&has(r,'lens')?1:0)+b.powers.drawTurn+(has(r,'burdenpact')?1:0)-(has(r,'furnace')?1:0)-(b.turn===1?b.hand.length:0)));if(b.powers.afterglow)for(const e of live(b))applyEmber(r,e,b.powers.afterglow);
}
function damageEnemy(r,e,n,{bypass=false,attack=false}={}){if(r.over||e.hp<=0)return;if(!bypass)n=Math.max(0,n-(D.ENEMIES[e.id].armor||0));const absorbed=bypass?0:Math.min(e.block,n);e.block-=absorbed;e.hp=Math.max(0,e.hp-n+absorbed);if(e.hp===0&&(D.ENEMIES[e.id].wake||r.challenge>=5&&D.ENEMIES[e.id].boss)&&!e.awakened){e.awakened=true;e.hp=Math.ceil(e.maxHp*.4);e.strength=Math.min(200,e.strength+2);e.index=0;e.intent={...D.ENEMIES[e.id].pattern[0]};note(r,`${D.ENEMIES[e.id].name} awakens: 40% health and +2 Strength.`);}if(attack&&D.ENEMIES[e.id].thorns)harmHero(r,D.ENEMIES[e.id].thorns);}
function attackDamage(r,e,n,bonus=0){if(e.hp<=0||r.over)return;const b=r.battle;n=Math.floor(Math.max(0,n+b.strength+bonus+Math.floor(b.glimmer/2)*b.powers.starsEdge)*(b.weak>0?.75:1)*(e.vulnerable>0?1.5:1));damageEnemy(r,e,n,{attack:true});if(b.powers.emberHit&&e.hp>0)applyEmber(r,e,b.powers.emberHit);}
function applyEmber(r,e,n){if(e.hp<=0||n<=0)return;e.ember=Math.min(500,e.ember+n+(has(r,'ash')?1:0));gainBlock(r,r.battle.powers.kiln);}
function harmHero(r,n){const b=r.battle;n=Math.max(0,n-(has(r,'redthread')?1:0));const blocked=Math.min(b.block,n);b.block-=blocked;loseHp(r,n-blocked);return blocked;}
function scry(r,n){const b=r.battle;if(!b.draw.length&&b.discard.length){b.draw=shuffle(r.rnd,b.discard);b.discard=[];}b.look=[];while(n-->0&&b.draw.length)b.look.push(b.draw.pop());if(b.look.length)b.choice={kind:'scry',cards:[...b.look]};else draw(r,1);}
function recover(r){const b=r.battle;if(b.discard.length&&b.hand.length<10)b.choice={kind:'recover',cards:[...b.discard]};}
export function resolveChoice(r,uids=[]){if(r.over||r.phase!=='battle'||!r.battle.choice||!Array.isArray(uids)||new Set(uids).size!==uids.length)return false;const b=r.battle,c=b.choice;if(!uids.every(uid=>c.cards.includes(uid)))return false;if(c.kind==='scry'){const kept=b.look.filter(uid=>!uids.includes(uid));b.discard.push(...uids);b.draw.push(...kept.reverse());b.look=[];b.choice=null;draw(r,1+(c.deferredDraw||0));}else{if(uids.length!==1||b.hand.length>=10)return false;const uid=uids[0];b.discard.splice(b.discard.indexOf(uid),1);b.hand.push(uid);b.choice=null;draw(r,c.deferredDraw||0);}return true;}
export function playCard(r,uid,targetUid=null){
 if(!canPlay(r,uid,targetUid))return false;const b=r.battle,c=ownedCard(r,uid),d=D.CARD[c.id],target=b.enemies.find(e=>e.uid===targetUid&&e.hp>0),energy=costOf(r,c),stars=d.glimmerCost||0;
 b.energy-=energy;b.glimmer-=stars;b.hand.splice(b.hand.indexOf(uid),1);b.cardsPlayed=(b.cardsPlayed+1)%3;const afflicted=b.afflictions[uid];delete b.afflictions[uid];if(afflicted==='brittle')loseHp(r,2);const bonus=d.type==='Attack'&&b.firstAttack&&has(r,'coal')?3:0;if(d.type==='Attack')b.firstAttack=false;if(!d.xCost)b.firstCard=false;note(r,D.cardName(c));
 for(const effect of D.effects(c)){
  if(r.over)break;const n=effect.value,targets=d.target==='all'?live(b):target?[target]:[];
  if(effect.kind==='damage')for(const e of targets)attackDamage(r,e,n,bonus);
  if(effect.kind==='block')gainBlock(r,n);
  if(effect.kind==='ember')for(const e of targets)applyEmber(r,e,n);
  if(effect.kind==='emberAll')for(const e of live(b))applyEmber(r,e,n);
  if(effect.kind==='draw')draw(r,n);
  if(effect.kind==='energy')b.energy=Math.min(50,b.energy+n);
  if(effect.kind==='heal')heal(r,n);
  if(effect.kind==='loseHp')loseHp(r,n);
  if(effect.kind==='selfWeak')b.weak=Math.min(500,b.weak+n);
  if(effect.kind==='cleanse'){b.weak=0;b.afflictions={};}
  if(effect.kind==='retain')b.retain=true;
  if(effect.kind==='retainHand')b.retainHand=true;
  if(effect.kind==='strength')b.strength=Math.min(200,b.strength+n);
  if(POWER_KEYS.includes(effect.kind))b.powers[effect.kind]=Math.min(500,b.powers[effect.kind]+n);
  if(effect.kind==='weak'||effect.kind==='vulnerable')for(const e of targets)if(e.hp>0)e[effect.kind]=Math.min(500,e[effect.kind]+n);
  if(effect.kind==='emberDamage')for(const e of targets)attackDamage(r,e,e.ember*n,bonus);
  if(effect.kind==='detonate')for(const e of targets){const burn=e.ember;e.ember=0;attackDamage(r,e,burn*n,bonus);}
  if(effect.kind==='stoke')for(const e of targets)applyEmber(r,e,e.ember+n);
  if(effect.kind==='blockDamage')for(const e of targets)attackDamage(r,e,b.block*n,bonus);
  if(effect.kind==='forge'||effect.kind==='glimmer')b[effect.kind]=Math.min(12,b[effect.kind]+n);
  if(effect.kind==='forgedDamage'){const forge=b.forge;b.forge=0;for(const e of targets)attackDamage(r,e,n*forge,bonus);}
  if(effect.kind==='forgeBlock'){const forge=b.forge;b.forge=0;gainBlock(r,forge*n);}
  if(effect.kind==='comet'){const stars=b.glimmer;b.glimmer=0;for(const e of live(b))attackDamage(r,e,stars*n,bonus);}
  if(effect.kind==='burnBlock')gainBlock(r,live(b).reduce((s,e)=>s+e.ember,0)*n);
  if(effect.kind==='xDamage')for(const e of targets)attackDamage(r,e,energy*n,bonus);
  if(effect.kind==='xBlock')gainBlock(r,energy*n);
  if(effect.kind==='xEmber')for(const e of targets)applyEmber(r,e,energy*n);
  if(effect.kind==='conjure')for(let i=0;i<n;i++)generate(r,'starbit');
  if(effect.kind==='improvise'){const pool=cardPool(r).filter(c=>!c.effects.some(e=>e.kind==='heal'));const created=pick(r,pool);if(created)generate(r,created.id);}
  if(effect.kind==='scry')scry(r,n);
  if(effect.kind==='recover')recover(r);
 }
 if(!r.over&&d.type==='Attack'&&has(r,'locket'))gainBlock(r,2);if(!r.over&&stars&&has(r,'needle'))draw(r,1);if(!r.over&&b.powers.flow&&b.cardsPlayed===0)draw(r,b.powers.flow);
 // Resolving cards are excluded from every draw until their effects finish.
 if(d.type==='Power')b.powersZone.push(uid);else if(d.exhaust)exhaust(r,uid);else b.discard.push(uid);
 if(!r.over)checkVictory(r);return true;
}
export function attackValue(r,e){const p=e.intent;return p.damage?Math.floor((p.damage+e.strength)*(1+r.act*.08+(r.challenge>=2?.1:0))*(e.weak>0?.75:1)):0;}
export function intentText(r,e){const p=e.intent,n=attackValue(r,e);return[n?`${n}${p.hits>1?' × '+p.hits:''} attack`:null,p.block?`${p.block} block`:null,p.strength?`+${p.strength} Strength`:null,p.heal?`${p.heal} heal`:null,p.weak?`${p.weak} Weak`:null,p.status?`Add ${D.CARD[p.status].name}`:null,p.afflict?`Afflict: ${p.afflict}`:null,p.summon?`Summon ${D.ENEMIES[p.summon].name}`:null].filter(Boolean).join(' · ');}
export function incoming(r){return r.battle?.enemies.filter(e=>e.hp>0).reduce((n,e)=>n+attackValue(r,e)*e.intent.hits,0)||0;}
export function endTurn(r){
 if(r.over||r.phase!=='battle'||r.battle.choice)return false;const b=r.battle,hand=[...b.hand];b.hand=[];
 const kept=hand.filter(uid=>{const d=D.CARD[ownedCard(r,uid).id];return !d.ethereal&&(d.retainCard||b.retainHand);});b.hand=[...kept];for(const uid of hand){const d=D.CARD[ownedCard(r,uid).id];if(d.endDamage)loseHp(r,d.endDamage);if(d.ethereal)exhaust(r,uid);else if(!kept.includes(uid))b.discard.push(uid);}
 b.retainHand=false;if(r.over)return true;b.weak=Math.max(0,b.weak-1);r.turns++;
 for(const e of live(b)){e.block=0;const burn=e.ember;damageEnemy(r,e,burn,{bypass:true});e.ember=Math.max(0,burn-1);if(burn)note(r,`${D.ENEMIES[e.id].name}: ${burn} Ember damage.`);}
 if(checkVictory(r))return true;
 const acting=[...live(b)];for(const e of acting){if(e.hp<=0)continue;const p=e.intent;e.block=p.block||0;if(p.heal)e.hp=Math.min(e.maxHp,e.hp+p.heal);const damage=attackValue(r,e);
  for(let i=0;i<p.hits&&damage&&!r.over&&e.hp>0;i++){const blocked=harmHero(r,damage);if(blocked){const retaliation=b.powers.thorns+(has(r,'ring')?2:0);if(retaliation)damageEnemy(r,e,retaliation);}}
  if(r.over)return true;if(e.hp>0){if(p.weak)b.weak=Math.min(500,b.weak+p.weak);if(p.status)generate(r,p.status,'discard');if(p.afflict){const cards=[...b.draw,...b.discard].filter(uid=>!D.CARD[ownedCard(r,uid).id].unplayable);const uid=pick(r,cards);if(uid)b.afflictions[uid]=p.afflict;}if(p.summon&&live(b).length<3)b.enemies.push(enemy(r,p.summon,'battle'));e.strength=Math.min(200,e.strength+(p.strength||0)+(r.challenge>=5&&D.ENEMIES[e.id].boss?1:0));e.weak=Math.max(0,e.weak-1);e.vulnerable=Math.max(0,e.vulnerable-1);e.index=(e.index+1)%D.ENEMIES[e.id].pattern.length;e.intent={...D.ENEMIES[e.id].pattern[e.index]};}
  if(checkVictory(r))return true;
 }
 // Keep at most three corpses for bounded histories and readable battlefields.
 if(b.enemies.length>6)b.enemies=b.enemies.filter(e=>e.hp>0);startTurn(r);return true;
}
function checkVictory(r){if(live(r.battle).length)return false;const kind=r.battle.kind;r.wins++;if(kind==='elite')r.elites++;r.score+=kind==='boss'?300:kind==='elite'?125:60;if(has(r,'kit'))heal(r,3);r.battle.choice=null;r.battle.draw.push(...r.battle.look.reverse());r.battle.look=[];
 if(kind==='boss'&&r.act===2){r.over=true;r.won=true;r.phase='complete';r.score+=500+r.hp*3+r.challenge*200;return true;}
 const gold=Math.floor((kind==='boss'?65:kind==='elite'?42:25)*(has(r,'coin')?1.25:1));r.gold+=gold;r.loot={cards:cardOffers(r,3,kind==='boss'),gold,relic:null,relics:kind==='elite'?relicOffers(r):[],relicTaken:false,potion:r.rnd()<(has(r,'vial')?.75:.45)?pick(r,D.POTIONS).id:null,potionTaken:false,cardTaken:false};r.phase='reward';return true;
}
export function takeReward(r,id=null,keepOpen=false){if(r.over||r.phase!=='reward'||r.loot.cardTaken||id!==null&&!r.loot.cards.includes(id))return false;if(id!==null&&!addCard(r,id))return false;r.loot.cardTaken=true;if(!keepOpen)advance(r);return true;}
export function finishReward(r){if(r.over||r.phase!=='reward')return false;advance(r);return true;}
export function takeRelic(r,id){if(r.over)return false;if(r.phase==='reward'){if(r.loot.relicTaken||!r.loot.relics.includes(id)||!addRelic(r,id))return false;r.loot.relicTaken=true;return true;}if(r.phase==='treasure'){if(!r.gift.relics.includes(id)||!addRelic(r,id))return false;advance(r);return true;}return false;}
export function takePotion(r,replace=null){if(r.over||r.phase!=='reward'||r.loot.potionTaken||!r.loot.potion)return false;if(r.potions.length>=potionCapacity(r)){if(!int(replace,0,r.potions.length-1))return false;r.potions[replace]=r.loot.potion;}else r.potions.push(r.loot.potion);r.loot.potionTaken=true;return true;}
export function discardPotion(r,index){if(r.over||r.phase==='battle'&&r.battle.choice||!int(index,0,r.potions.length-1))return false;r.potions.splice(index,1);return true;}
export function usePotion(r,index,targetUid=null){if(r.over||r.phase==='battle'&&r.battle.choice||!int(index,0,r.potions.length-1))return false;const p=D.POTION[r.potions[index]],b=r.battle,target=b?.enemies.find(e=>e.uid===targetUid&&e.hp>0);if(p.kind==='heal'){if(r.hp===r.maxHp)return false;}else if(r.phase!=='battle'||p.target==='enemy'&&!target)return false;r.potions.splice(index,1);
 if(p.kind==='heal')heal(r,p.value);if(p.kind==='damage')damageEnemy(r,target,p.value);if(p.kind==='block')gainBlock(r,p.value);if(p.kind==='energy')b.energy=Math.min(50,b.energy+p.value);if(p.kind==='draw')draw(r,p.value);if(p.kind==='ember')for(const e of live(b))applyEmber(r,e,p.value);if(p.kind==='cleanse'){b.weak=0;b.afflictions={};}if(p.kind==='resource'){if(r.hero==='lantern')b.energy=Math.min(50,b.energy+2);else if(r.hero==='ironbound')b.forge=Math.min(12,b.forge+p.value);else b.glimmer=Math.min(12,b.glimmer+p.value);}if(r.phase==='battle')checkVictory(r);return true;
}
export function enchantEligible(c,id){if(!c||c.enchant||!Object.hasOwn(D.ENCHANTMENTS,id)||D.CARD[c.id].unplayable)return false;const d=D.CARD[c.id];if(id==='swift')return d.cost>0&&!d.xCost;if(id==='keen')return d.effects.some(e=>['damage','xDamage'].includes(e.kind));if(id==='flowing')return !d.effects.some(e=>['scry','recover'].includes(e.kind));return true;}
export function camp(r,action,uid=null){if(r.over||r.phase!=='camp')return false;if(action==='rest'){if(has(r,'glasspact'))return false;heal(r,Math.ceil(r.maxHp*.3));}else if(action==='upgrade'){const c=r.deck.find(c=>c.uid===uid);if(!c||c.plus||D.CARD[c.id].unplayable)return false;c.plus=true;}else if(action!=='leave')return false;advance(r);return true;}
export function buy(r,kind,index=null){
 if(r.over||r.phase!=='shop')return false;const s=r.shop;
 if(kind==='card'){if(!int(index,0,s.cards.length-1))return false;const offer=s.cards[index];if(!offer||offer.bought||r.gold<offer.price||r.deck.length>=60)return false;r.gold-=offer.price;addCard(r,offer.id);offer.bought=true;}
 else if(kind==='relic'){if(!s.relic||s.relicBought||r.gold<s.relicPrice||has(r,s.relic))return false;r.gold-=s.relicPrice;addRelic(r,s.relic);s.relicBought=true;}
 else if(kind==='potion'){if(!int(index,0,s.potions.length-1))return false;const offer=s.potions[index];if(!offer||offer.bought||r.gold<offer.price||r.potions.length>=potionCapacity(r))return false;r.gold-=offer.price;r.potions.push(offer.id);offer.bought=true;}
 else if(kind==='heal'){if(s.healed||r.gold<s.healPrice||r.hp===r.maxHp)return false;r.gold-=s.healPrice;heal(r,20);s.healed=true;}
 else if(kind==='remove'){const c=r.deck.find(c=>c.uid===index);if(!c||r.deck.length<=5||r.gold<s.removePrice)return false;r.gold-=s.removePrice;r.deck.splice(r.deck.indexOf(c),1);r.removals++;s.removePrice=price(r,45+r.removals*10);}
 else return false;return true;
}
export function leaveShop(r){if(r.over||r.phase!=='shop')return false;advance(r);return true;}
export function leaveTreasure(r){if(r.over||r.phase!=='treasure')return false;advance(r);return true;}
export function chooseBoon(r,id,uid=null){if(r.over||r.phase!=='ancient')return false;if(id==='leave'){advance(r);return true;}if(r.act===0){if(!r.gift.offers.includes(id))return false;if(id==='vigor'){r.maxHp+=8;heal(r,8);}if(id==='fortune'){if(!addCard(r,'regret'))return false;r.gold+=80;}if(id==='rune'){const c=r.deck.find(c=>c.uid===uid);if(!enchantEligible(c,'keen'))return false;c.enchant='keen';}}else if(!r.gift.relics.includes(id)||!addRelic(r,id))return false;advance(r);return true;}
export function eventChoice(r,choice,uid=null){
 if(r.over||r.phase!=='event')return false;const e=r.event,c=r.deck.find(c=>c.uid===uid);
 if(choice!=='leave'){
  if(e.id==='cache'){if(choice==='gold')r.gold+=50;else if(choice==='heal')heal(r,12);else return false;}
  else if(e.id==='altar'){if(choice!=='relic'||r.hp<=9||!e.relic||has(r,e.relic))return false;loseHp(r,9);addRelic(r,e.relic);}
  else if(e.id==='archive'){if(choice==='card'){if(!addCard(r,e.card))return false;}else if(choice==='heal')heal(r,12);else return false;}
  else if(e.id==='reforge'){if(choice!=='upgrade'||!c||c.plus||D.CARD[c.id].unplayable)return false;c.plus=true;}
  else if(e.id==='scriptorium'){if(choice!=='enchant'||!enchantEligible(c,e.enchant))return false;c.enchant=e.enchant;}
  else if(e.id==='cursedcache'){if(choice!=='relic'||!e.relic||has(r,e.relic)||r.deck.length>=60)return false;addCard(r,'burden');addRelic(r,e.relic);}
  else if(e.id==='purifier'){if(choice!=='remove'||!c||r.deck.length<=5||r.hp<=6)return false;loseHp(r,6);r.deck.splice(r.deck.indexOf(c),1);}
  else if(e.id==='caravan'){if(choice!=='potion'||r.gold<15||r.potions.length>=potionCapacity(r))return false;r.gold-=15;r.potions.push(e.potion);}
  else if(e.id==='fountain'){if(choice==='heal')heal(r,25);else if(choice==='purify'&&c&&D.CARD[c.id].type==='Curse'&&r.deck.length>5)r.deck.splice(r.deck.indexOf(c),1);else return false;}
  else if(e.id==='mirror'){if(choice!=='transform'||!c||!['strike','brace'].includes(c.id))return false;c.id=e.card;c.plus=false;c.enchant=null;discover(r,'cards',c.id);}
  else return false;
 }advance(r);return true;
}
export const result=r=>({score:r.score,level:r.act+1,completed:true,variant:`${r.hero}_challenge${r.challenge}`,extra:[r.won?'The last ember becomes a new dawn.':'The ember fades. A new expedition awaits.',`${heroOf(r).name} · Challenge ${r.challenge} · Seed ${r.seed}`,`${r.wins} battles won · ${r.turns} turns`,`${r.deck.length} cards · ${r.relics.length} relics`]});
export function migrateRun(r){
 if(r.schema===2)return r;if(!validLegacy(r))return null;
 r.schema=2;r.hero='lantern';r.challenge=0;r.runId=`legacy_${r.seed}_${r.act}_${r.stage}`;r.floors=6;r.legacy=true;r.variants=[0,0,0];r.potions=[];r.nextEnemyUid=Math.max(1,...(r.battle?.enemies||[]).map(e=>e.uid??0))+1;r.gift=null;r.discovered={cards:[...new Set(r.deck.map(c=>c.id))],relics:[...r.relics],enemies:[...new Set((r.battle?.enemies||[]).map(e=>e.id))]};
 for(const c of r.deck)c.enchant=null;
 for(let i=0;i<r.route.length;i++)for(const n of r.route[i])n.next=i%6===5?[]:(r.route[i+1]||[]).filter(t=>Math.abs(t.lane-n.lane)<=1).map(t=>t.id);
 if(r.battle){const b=r.battle;b.deckUids=r.deck.map(c=>c.uid);b.generated=[];b.afflictions={};b.look=[];b.choice=null;b.forge=0;b.glimmer=0;b.firstCard=false;b.blockBonus=true;b.retainHand=false;for(const k of POWER_KEYS)b.powers[k]??=0;for(const e of b.enemies){e.uid=e.uid??r.nextEnemyUid++;e.awakened=false;}r.nextEnemyUid=Math.max(r.nextEnemyUid,...b.enemies.map(e=>e.uid+1));}
 if(r.loot)Object.assign(r.loot,{relics:[],relicTaken:true,potion:null,potionTaken:false,cardTaken:false});
 if(r.shop)Object.assign(r.shop,{relicPrice:135,healPrice:35,removePrice:45+r.removals*10,potions:[]});
 if(r.event){r.event.enchant='keen';r.event.potion='lifedrop';}
 return r;
}
function isCard(c,r){return c&&int(c.uid,1,r.nextUid-1)&&Object.hasOwn(D.CARD,c.id)&&typeof c.plus==='boolean'&&(c.enchant===null||Object.hasOwn(D.ENCHANTMENTS,c.enchant));}
function unique(a){return new Set(a).size===a.length;}
function ids(a,object,max){return Array.isArray(a)&&a.length<=max&&unique(a)&&a.every(id=>typeof id==='string'&&Object.hasOwn(object,id));}
function validNew(r){
 if(!r||r.schema!==2||!int(r.seed,0,4294967295)||typeof r.rnd!=='function'||typeof r.rnd.getState!=='function'||!D.HEROES.some(h=>h.id===r.hero)||!int(r.challenge,0,5)||typeof r.runId!=='string'||!/^[a-z0-9_]{1,90}$/.test(r.runId)||![6,12].includes(r.floors)||typeof r.legacy!=='boolean'||!PHASES.includes(r.phase)||r.over!==false||r.won!==false||!int(r.act,0,2)||!int(r.stage,0,r.floors-1)||!int(r.lane,0,2)||!int(r.maxHp,1,1000)||!int(r.hp,1,r.maxHp)||!int(r.gold,0,1000000)||!int(r.nextUid,1,1000000)||!int(r.nextEnemyUid,1,1000000)||!['wins','elites','turns','removals','score'].every(k=>int(r[k],0,1000000)))return false;
 if(!Array.isArray(r.variants)||r.variants.length!==3||r.variants.some(n=>n!==0&&n!==1)||!Array.isArray(r.deck)||r.deck.length<5||r.deck.length>60||!r.deck.every(c=>isCard(c,r)&&!D.CARD[c.id].temporary)||!unique(r.deck.map(c=>c.uid)))return false;
 if(!ids(r.relics,D.RELIC,32)||!Array.isArray(r.spentRelics)||r.spentRelics.length>1||r.spentRelics.some(id=>id!=='seed'||!has(r,id))||!Array.isArray(r.potions)||r.potions.length>potionCapacity(r)||!r.potions.every(id=>Object.hasOwn(D.POTION,id)))return false;
 if(!r.discovered||!ids(r.discovered.cards,D.CARD,100)||!ids(r.discovered.relics,D.RELIC,40)||!ids(r.discovered.enemies,D.ENEMIES,30))return false;
 if(!Array.isArray(r.route)||r.route.length!==r.floors*3)return false;
 for(let i=0;i<r.route.length;i++){const row=r.route[i];if(!Array.isArray(row)||row.length<1||row.length>3||!unique(row.map(n=>n?.id)))return false;for(let j=0;j<row.length;j++){const n=row[j];if(!n||!int(n.lane,0,2)||n.lane!==(row.length===1?1:j)||n.id!==`${Math.floor(i/r.floors)}-${i%r.floors}-${n.lane}`||!Object.hasOwn(D.NODE_TYPES,n.type)||!Array.isArray(n.next)||!unique(n.next))return false;if(i%r.floors===r.floors-1){if(n.type!=='boss'||n.next.length)return false;}else if(!n.next.length||!n.next.every(id=>r.route[i+1]?.some(t=>t.id===id&&Math.abs(t.lane-n.lane)<=1)))return false;}if(i%r.floors!==0&&!row.every(n=>r.route[i-1].some(p=>p.next.includes(n.id))))return false;}
 const index=r.act*r.floors+r.stage;if(!Array.isArray(r.visited)||r.visited.length!==index+(r.phase==='map'?0:1)||!r.visited.every((id,i)=>r.route[i].some(n=>n.id===id)))return false;
 for(let i=1;i<r.visited.length;i++)if(i%r.floors!==0&&!r.route[i-1].find(n=>n.id===r.visited[i-1]).next.includes(r.visited[i]))return false;
 if(r.visited.length&&r.lane!==r.route[r.visited.length-1].find(n=>n.id===r.visited.at(-1)).lane)return false;
 const node=r.phase==='map'?null:r.route[index].find(n=>n.id===r.visited.at(-1));
 if(node&&!(['battle','reward'].includes(r.phase)?['battle','elite','boss'].includes(node.type):r.phase===node.type))return false;
 if(['battle','reward'].includes(r.phase)){
  const b=r.battle;if(!b||b.kind!==node.type||!int(b.turn,1,10000)||!int(b.energy,0,50)||!int(b.block,0,5000)||!int(b.strength,0,200)||!int(b.weak,0,500)||!int(b.forge,0,12)||!int(b.glimmer,0,12)||!int(b.cardsPlayed,0,1000)||!['retain','retainHand','firstAttack','firstCard','blockBonus'].every(k=>typeof b[k]==='boolean')||!b.powers||Object.keys(b.powers).length!==POWER_KEYS.length||!POWER_KEYS.every(k=>int(b.powers[k],0,500)))return false;
  if(!Array.isArray(b.generated)||b.generated.length>120||!b.generated.every(c=>isCard(c,r))||!Array.isArray(b.deckUids)||b.deckUids.length<5||b.deckUids.length>60||!unique(b.deckUids)||!b.deckUids.every(uid=>r.deck.some(c=>c.uid===uid))||r.phase==='battle'&&b.deckUids.length!==r.deck.length)return false;
  const cardUids=[...b.deckUids,...b.generated.map(c=>c.uid)];if(!unique(cardUids))return false;const zones=['draw','hand','discard','exhaust','powersZone','look'];if(!zones.every(k=>Array.isArray(b[k])&&b[k].length<=180)||b.hand.length>10||b.look.length>10)return false;const uids=zones.flatMap(k=>b[k]);if(uids.length!==cardUids.length||!unique(uids)||!uids.every(uid=>cardUids.includes(uid))||!b.powersZone.every(uid=>D.CARD[ownedCard(r,uid).id].type==='Power'))return false;
  if(!b.afflictions||typeof b.afflictions!=='object'||Array.isArray(b.afflictions)||Object.entries(b.afflictions).some(([uid,kind])=>!cardUids.includes(+uid)||!['taxed','brittle'].includes(kind)))return false;
  if(b.choice!==null){const c=b.choice;if(!c||!['scry','recover'].includes(c.kind)||!Array.isArray(c.cards)||!c.cards.length||!unique(c.cards)||!c.cards.every(uid=>(c.kind==='scry'?b.look:b.discard).includes(uid))||!int(c.deferredDraw??0,0,100))return false;if(c.kind==='scry'&&c.cards.length!==b.look.length)return false;}else if(b.look.length)return false;
  if(!Array.isArray(b.enemies)||!b.enemies.length||b.enemies.length>9||!unique(b.enemies.map(e=>e.uid))||!b.enemies.every(e=>e&&int(e.uid,0,r.nextEnemyUid-1)&&Object.hasOwn(D.ENEMIES,e.id)&&int(e.maxHp,1,2000)&&int(e.hp,0,e.maxHp)&&['block','strength','ember','weak','vulnerable'].every(k=>int(e[k],0,k==='block'?5000:k==='strength'?200:500))&&typeof e.awakened==='boolean'&&int(e.index,0,D.ENEMIES[e.id].pattern.length-1)&&e.intent&&Object.keys(e.intent).length===Object.keys(D.ENEMIES[e.id].pattern[e.index]).length&&Object.entries(D.ENEMIES[e.id].pattern[e.index]).every(([k,v])=>e.intent[k]===v))||!Array.isArray(b.log)||b.log.length>10||!b.log.every(t=>typeof t==='string'&&t.length<250))return false;
  if(live(b).length>3||r.phase==='battle'&&!live(b).length||r.phase==='reward'&&(live(b).length||b.choice))return false;
 }
 if(r.phase==='reward'){
  const l=r.loot;if(!l||!ids(l.cards,D.CARD,3)||l.cards.length!==3||!int(l.gold,0,1000)||!ids(l.relics,D.RELIC,3)||!['relicTaken','potionTaken','cardTaken'].every(k=>typeof l[k]==='boolean')||l.potion!==null&&!Object.hasOwn(D.POTION,l.potion)||l.relic!==null&&!Object.hasOwn(D.RELIC,l.relic))return false;
 }
 if(r.phase==='shop'){
  const s=r.shop;if(!s||!Array.isArray(s.cards)||s.cards.length<3||s.cards.length>4||!s.cards.every(c=>c&&Object.hasOwn(D.CARD,c.id)&&int(c.price,1,10000)&&typeof c.bought==='boolean')||s.relic!==null&&!Object.hasOwn(D.RELIC,s.relic)||!['relicBought','healed'].every(k=>typeof s[k]==='boolean')||!['relicPrice','healPrice','removePrice'].every(k=>int(s[k],1,10000))||!Array.isArray(s.potions)||s.potions.length>2||!s.potions.every(p=>p&&Object.hasOwn(D.POTION,p.id)&&int(p.price,1,1000)&&typeof p.bought==='boolean'))return false;
 }
 if(r.phase==='event'){const e=r.event;if(!e||!['cache','altar','archive','reforge','scriptorium','cursedcache','purifier','caravan','fountain','mirror'].includes(e.id)||!Object.hasOwn(D.CARD,e.card)||e.relic!==null&&!Object.hasOwn(D.RELIC,e.relic)||!Object.hasOwn(D.ENCHANTMENTS,e.enchant)||!Object.hasOwn(D.POTION,e.potion))return false;}
 if(r.phase==='treasure'&&(!r.gift||!ids(r.gift.relics,D.RELIC,3)||typeof r.gift.taken!=='boolean'))return false;
 if(r.phase==='ancient'&&(!r.gift||!ids(r.gift.relics,D.RELIC,3)||!Array.isArray(r.gift.offers)||!unique(r.gift.offers)||r.gift.offers.some(id=>!['vigor','fortune','rune'].includes(id))||r.act===0&&r.gift.offers.length!==3||r.act>0&&r.gift.offers.length))return false;
 return true;
}
export function valid(r){try{return r?.schema===1?validLegacy(r):validNew(r);}catch{return false;}}
