// Pure bounded profile records. Storage ownership stays in store.js.
import {HEROES,CARD,RELIC,ENEMIES} from './cinderpath-data.js';
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const known=(a,table,max)=>Array.isArray(a)?[...new Set(a.filter(id=>typeof id==='string'&&Object.hasOwn(table,id)))].slice(0,max):[];
export const emptyJournal=()=>({runs:[],cards:[],relics:[],enemies:[],unlocked:[0,0,0],wins:[0,0,0],attempts:[0,0,0],lore:[]});
export function cleanJournal(raw){
 const j=emptyJournal();if(!raw||typeof raw!=='object')return j;
 for(const key of ['unlocked','wins','attempts'])if(Array.isArray(raw[key])&&raw[key].length===3)j[key]=raw[key].map(n=>int(n,0,key==='unlocked'?5:100000)?n:0);
 j.cards=known(raw.cards,CARD,100);j.relics=known(raw.relics,RELIC,50);j.enemies=known(raw.enemies,ENEMIES,30);j.lore=Array.isArray(raw.lore)?[...new Set(raw.lore.filter(n=>int(n,0,5)))]:[];
 if(Array.isArray(raw.runs))for(const x of raw.runs.slice(-30)){
  if(!x||typeof x.id!=='string'||!/^[a-z0-9_]{1,90}$/.test(x.id)||!HEROES.some(h=>h.id===x.hero)||!int(x.seed,0,4294967295)||!int(x.t,0,4e12)||typeof x.won!=='boolean'||!int(x.challenge,0,5)||!int(x.act,0,2)||!int(x.stage,0,11)||!int(x.score,0,1e9))continue;
  const deck=Array.isArray(x.deck)?x.deck.filter(c=>c&&typeof c.id==='string'&&Object.hasOwn(CARD,c.id)&&typeof c.plus==='boolean'&&(c.enchant===null||['keen','warded','kindled','flowing','swift'].includes(c.enchant))).slice(0,60).map(c=>({id:c.id,plus:c.plus,enchant:c.enchant})):[];
  j.runs.push({id:x.id,hero:x.hero,seed:x.seed,t:x.t,won:x.won,challenge:x.challenge,act:x.act,stage:x.stage,score:x.score,deck,relics:known(x.relics,RELIC,40)});
 }
 j.runs=j.runs.filter((x,i,a)=>a.findIndex(v=>v.id===x.id)===i);return j;
}
export function recordJournal(journal,r,now=Date.now()){
 const j=cleanJournal(journal);if(j.runs.some(x=>x.id===r.runId))return j;const i=HEROES.findIndex(h=>h.id===r.hero);if(i<0)return j;
 j.attempts[i]++;if(r.won){j.wins[i]++;j.unlocked[i]=Math.max(j.unlocked[i],Math.min(5,r.challenge+1));}
 for(const [key,source]of [['cards','cards'],['relics','relics'],['enemies','enemies']])j[key]=[...new Set([...j[key],...r.discovered[source]])];
 if(r.wins>0)j.lore.push(0);if(r.act>=1)j.lore.push(1);if(r.act>=2)j.lore.push(2);if(r.won)j.lore.push(3);if(j.wins.every(n=>n>0))j.lore.push(4);if(r.won&&r.challenge>=3)j.lore.push(5);j.lore=[...new Set(j.lore)];
 j.runs.push({id:r.runId,hero:r.hero,seed:r.seed,t:now,won:r.won,challenge:r.challenge,act:r.act,stage:r.stage,score:r.score,deck:r.deck.map(c=>({id:c.id,plus:c.plus,enchant:c.enchant})),relics:[...r.relics]});j.runs=j.runs.slice(-30);return cleanJournal(j);
}
export const LORE=[
 ['The borrowed light','The first Lanternbearers found that the ember grew warmer when carried toward danger. It was remembering the shape of morning.'],
 ['Under the bell','The Cloister bells were never a warning. Their keepers rang them to help the lost find a way back.'],
 ['What the forge remembers','The roots reached the Foundry long after its fires failed. Iron and living wood learned to keep each other warm.'],
 ['A dawn returned','The final guardian was protecting the last unbroken night. The traveler offered it a beginning instead.'],
 ['Three hands, one light','The Lanternbearer, Ironbound and Starweaver carried different burdens. Each learned that light becomes a different thing in another hand.'],
 ['The difficult mercy','Some mornings ask more of those who carry them. The Waykeepers remember every promise made along the climb.'],
];
