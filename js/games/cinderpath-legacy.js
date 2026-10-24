import {CARD,RELIC,ENEMIES,NODE_TYPES} from './cinderpath-data.js';
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const has=(r,id)=>r.relics.includes(id);
const live=b=>b.enemies.filter(e=>e.hp>0);
const ownedCard=(r,uid)=>r.deck.find(c=>c.uid===uid);
export function validLegacy(r){
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
