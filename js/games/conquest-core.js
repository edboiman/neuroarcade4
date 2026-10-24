import {mulberry32} from './rng.js';
export const FACTIONS=[{name:'Your banner',color:'#54b8b1',dark:'#286f73'},{name:'The Ember Court',color:'#e18a6e',dark:'#9b5045'},{name:'The Violet League',color:'#ae91d7',dark:'#6e558e'},{name:'The Golden March',color:'#e2bd68',dark:'#917744'}];
export const CONTINENTS=[
 {name:'The Northreach',bonus:3,x:170,y:152,names:['Pinewatch','Frostholm','Greywater','Raven Bay','Whitecliff'],cells:[[0,0],[1,0],[0,1],[-1,1],[-1,0]]},
 {name:'The Crownlands',bonus:4,x:485,y:148,names:['Crownspire','Eastmere','Goldfield','Redgate','Westridge'],cells:[[0,0],[1,0],[0,1],[-1,1],[0,-1]]},
 {name:'The Jade Isles',bonus:3,x:797,y:152,names:['Jadeport','Cloudstep','Lotus Vale','Silkshore','Tidefall'],cells:[[0,0],[1,0],[0,1],[-1,1],[-1,0]]},
 {name:'The Sunward',bonus:3,x:174,y:439,names:['Sunkeep','Amberwell','Dunewatch','Saltreach','Copper Bay'],cells:[[0,0],[1,0],[0,1],[-1,1],[1,-1]]},
 {name:'The Ironwild',bonus:4,x:493,y:440,names:['Ironroot','Ashforge','Mossgate','Wildmere','Stonepass'],cells:[[0,0],[1,0],[0,1],[-1,1],[-1,0]]},
 {name:'The Southern Veil',bonus:3,x:802,y:439,names:['Veilhold','Mistport','Moonfen','Starfall','Deepwater'],cells:[[0,0],[1,0],[0,1],[-1,1],[0,-1]]},
];
export const REGIONS=CONTINENTS.flatMap((c,ci)=>c.cells.map(([q,r],i)=>({id:ci*5+i,c:ci,name:c.names[i],q,r,x:c.x+Math.sqrt(3)*44*(q+r/2),y:c.y+66*r})));
export const LINKS=[];
for(let a=0;a<REGIONS.length;a++)for(let b=a+1;b<REGIONS.length;b++){const x=REGIONS[a],y=REGIONS[b];if(x.c===y.c&&Math.max(Math.abs(x.q-y.q),Math.abs(x.r-y.r),Math.abs(x.q+x.r-y.q-y.r))===1)LINKS.push([a,b]);}
export const SEA_LINKS=[[1,9],[6,14],[2,19],[7,24],[12,29],[16,24],[21,29],[4,13],[18,28]];
LINKS.push(...SEA_LINKS);
export const ADJ=REGIONS.map((_,i)=>LINKS.filter(e=>e.includes(i)).map(e=>e[0]===i?e[1]:e[0]));
const shuffle=(a,rnd)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
export const CARDS=REGIONS.map(r=>({id:r.id,symbol:r.id%3,territory:r.id,name:r.name})).concat([30,31].map(id=>({id,symbol:3,territory:null,name:'Wild banner'})));
export const SYMBOLS=['Footguard','Rider','Cannon','Wild'];
export const owned=(s,p=s.turn)=>s.owner.map((v,i)=>v===p?i:-1).filter(i=>i>=0);
export const armyTotal=(s,p)=>owned(s,p).reduce((n,i)=>n+s.armies[i],0);
export const bonuses=(s,p)=>CONTINENTS.map((c,i)=>REGIONS.filter(r=>r.c===i).every(r=>s.owner[r.id]===p)?c.bonus:0);
export const reinforcement=(s,p=s.turn)=>Math.max(3,Math.floor(owned(s,p).length/3))+bonuses(s,p).reduce((a,b)=>a+b,0);
export const cardSymbol=c=>CARDS[c]?.symbol??-1;
export const cardInfo=(s,c)=>s.schema===2?CARDS[c]:{id:c,symbol:c,territory:null,name:SYMBOLS[c]};
export const setValue=s=>s.sets<5?4+s.sets*2:15+(s.sets-5)*5;
function log(s,line){s.log.unshift(line);s.log=s.log.slice(0,35);}
export function createRun(seed=1){
 const rnd=mulberry32(seed),s={schema:2,seed,rnd,owner:Array(30).fill(0),armies:Array(30).fill(1),cards:[[],[],[],[]],deck:[],discard:[],defenseDice:2,cardBonusUsed:false,tradeToAttack:false,drawn:false,turn:0,round:1,phase:'deploy',reserve:0,conquered:false,fortified:false,sets:0,battles:0,log:[],over:false,winner:-1};
 const order=shuffle(REGIONS.map(r=>r.id),rnd);order.forEach((id,i)=>s.owner[id]=i%4);
 for(let p=0;p<4;p++){const ids=owned(s,p);for(let n=ids.length;n<30;n++)s.armies[ids[Math.floor(rnd()*ids.length)]]++;}
 s.deck=shuffle(CARDS.map(c=>c.id),rnd);s.reserve=reinforcement(s);log(s,'Your banner has the first turn. Reinforce your borders.');return s;
}
// Existing campaigns retain their symbol-only hands and original deployment.
export function migrateRun(s){if(s.schema!==2){s.defenseDice=2;s.tradeToAttack=false;s.cardBonusUsed=false;}return s;}
export const mustTrade=s=>s.phase==='deploy'&&s.cards[s.turn].length>=5;
function endDeployment(s){if(s.reserve===0&&!mustTrade(s)){s.phase='attack';s.tradeToAttack=false;}}
export function deploy(s,to,n=1){if(s.over||s.phase!=='deploy'||mustTrade(s)||!int(to,0,29)||s.owner[to]!==s.turn||!Number.isInteger(n)||n<1||n>s.reserve)return false;s.armies[to]+=n;s.reserve-=n;endDeployment(s);return true;}
export function validSet(cards){if(cards.length!==3)return false;const symbols=cards.map(cardSymbol),plain=symbols.filter(n=>n!==3);return symbols.every(n=>n>=0)&&(new Set(plain).size===1||new Set(plain).size===plain.length);}
export function cardSets(cards){const out=[];for(let a=0;a<cards.length-2;a++)for(let b=a+1;b<cards.length-1;b++)for(let c=b+1;c<cards.length;c++)if(validSet([cards[a],cards[b],cards[c]]))out.push([a,b,c]);return out;}
export const cardSet=cards=>cardSets(cards)[0]||null;
export function trade(s,indices=cardSet(s.cards[s.turn]),bonusTerritory=null){
 if(s.over||s.phase!=='deploy'||s.tradeToAttack&&s.cards[s.turn].length<=4||!Array.isArray(indices)||indices.length!==3||new Set(indices).size!==3||indices.some(i=>!int(i,0,s.cards[s.turn].length-1)))return 0;
 const chosen=indices.map(i=>s.cards[s.turn][i]);if(!validSet(chosen))return 0;
 const bonus=s.schema===2&&!s.cardBonusUsed?chosen.map(c=>CARDS[c].territory).filter(t=>t!==null&&s.owner[t]===s.turn):[];
 if(bonusTerritory!==null&&!bonus.includes(bonusTerritory))return 0;
 const territory=bonusTerritory??bonus[0];
 [...indices].sort((a,b)=>b-a).forEach(i=>s.cards[s.turn].splice(i,1));if(s.schema===2)s.discard.push(...chosen);
 const value=setValue(s);s.sets++;s.reserve+=value;
 if(territory!==undefined){s.armies[territory]+=2;s.cardBonusUsed=true;log(s,`Territory card bonus: +2 troops in ${REGIONS[territory].name}.`);}
 log(s,`${FACTIONS[s.turn].name} traded a set for ${value} troops.`);return value;
}
// Dice compare high-to-high; the defender wins a tie.
export function compareDice(att,def){const a=[...att].sort((x,y)=>y-x),d=[...def].sort((x,y)=>y-x);let lostA=0,lostD=0;for(let i=0;i<Math.min(a.length,d.length);i++){if(a[i]>d[i])lostD++;else lostA++;}return{lostA,lostD};}
export function canAttack(s,a,b){return !s.over&&s.phase==='attack'&&int(a,0,29)&&int(b,0,29)&&s.owner[a]===s.turn&&s.owner[b]!==s.turn&&s.armies[a]>1&&ADJ[a].includes(b);}
export function attack(s,a,b,{blitz=false,dice=3,defenseDice}={}){
 if(!canAttack(s,a,b)||!int(dice,1,3)||defenseDice!==undefined&&!int(defenseDice,1,2))return null;
 s.advance=null;const previous=s.owner[b],result={from:a,to:b,att:[],def:[],lostA:0,lostD:0,rolls:0,conquered:false};
 do{
 const na=Math.min(dice,s.armies[a]-1),nd=Math.min(defenseDice??(s.owner[b]===0?s.defenseDice??2:2),s.armies[b]);
 result.att=Array.from({length:na},()=>1+Math.floor(s.rnd()*6)).sort((x,y)=>y-x);result.def=Array.from({length:nd},()=>1+Math.floor(s.rnd()*6)).sort((x,y)=>y-x);
 const losses=compareDice(result.att,result.def);s.armies[a]-=losses.lostA;s.armies[b]-=losses.lostD;result.lostA+=losses.lostA;result.lostD+=losses.lostD;result.rolls++;s.battles++;
 if(s.armies[b]===0){
 const move=na;s.owner[b]=s.turn;s.armies[a]-=move;s.armies[b]=move;s.conquered=true;s.advance={a,b};result.conquered=true;
 log(s,`${FACTIONS[s.turn].name} captured ${REGIONS[b].name}.`);
 if(!owned(s,previous).length){s.cards[s.turn].push(...s.cards[previous]);s.cards[previous]=[];result.eliminated=previous;log(s,`${FACTIONS[previous].name} was eliminated.`);
 if(s.cards[s.turn].length>=6){s.phase='deploy';s.reserve=0;s.tradeToAttack=true;log(s,'Captured cards must be traded to four or fewer, then deploy before attacking again.');}}
 if(owned(s,s.turn).length===30){s.over=true;s.winner=s.turn;s.phase='over';s.tradeToAttack=false;}
 break;}
 }while(blitz&&s.armies[a]>1&&result.rolls<1000);
 if(!result.conquered)log(s,`${REGIONS[a].name} → ${REGIONS[b].name}: lost ${result.lostA}, defender lost ${result.lostD}.`);return result;
}
export function connected(s,a,b,p=s.turn){if(!int(a,0,29)||!int(b,0,29)||s.owner[a]!==p||s.owner[b]!==p)return false;const seen=new Set([a]),queue=[a];while(queue.length){const x=queue.shift();if(x===b)return true;for(const y of ADJ[x])if(s.owner[y]===p&&!seen.has(y)){seen.add(y);queue.push(y);}}return false;}
export function fortify(s,a,b,n){if(s.over||s.phase!=='fortify'||s.fortified||a===b||!int(a,0,29)||!int(b,0,29)||!Number.isInteger(n)||n<1||n>=s.armies[a]||!connected(s,a,b))return false;s.armies[a]-=n;s.armies[b]+=n;s.fortified=true;log(s,`${FACTIONS[s.turn].name} moved ${n} troops to ${REGIONS[b].name}.`);return true;}
function drawCard(s){if(s.schema===2){if(!s.deck.length){s.deck=shuffle(s.discard.splice(0),s.rnd);}if(s.deck.length)s.cards[s.turn].push(s.deck.pop());}else s.cards[s.turn].push(Math.floor(s.rnd()*3));log(s,`${FACTIONS[s.turn].name} earned a campaign card.`);}
export function nextPhase(s){
 if(s.over)return false;
 if(s.phase==='attack'){s.advance=null;s.phase='fortify';if(s.schema===2&&s.conquered&&!s.drawn){drawCard(s);s.drawn=true;}return true;}
 if(s.phase!=='fortify')return false;
 if(s.schema!==2&&s.conquered)drawCard(s);
 do{s.turn=(s.turn+1)%4;if(s.turn===0)s.round++;}while(!owned(s,s.turn).length);
 s.phase='deploy';s.reserve=reinforcement(s);s.conquered=false;s.fortified=false;s.cardBonusUsed=false;s.tradeToAttack=false;s.drawn=false;
 log(s,`Round ${s.round}: ${FACTIONS[s.turn].name}, ${s.reserve} reinforcements.`);return true;
}
export function advance(s,n){const a=s.advance;if(!a||s.over||s.phase!=='attack'||s.owner[a.a]!==s.turn||s.owner[a.b]!==s.turn||!Number.isInteger(n)||n<1||n>=s.armies[a.a])return false;s.armies[a.a]-=n;s.armies[a.b]+=n;s.advance=null;return true;}
const border=(s,i)=>ADJ[i].some(j=>s.owner[j]!==s.turn);
function threat(s,i){return ADJ[i].filter(j=>s.owner[j]!==s.turn).reduce((n,j)=>n+s.armies[j],0)-s.armies[i];}
export function aiStep(s,includeHuman=false){
 if(s.over||s.turn===0&&!includeHuman)return false;
 if(s.phase==='deploy'){
 if(cardSet(s.cards[s.turn])&&(!s.tradeToAttack||s.cards[s.turn].length>=5)){trade(s);return true;}
 const targets=owned(s).filter(i=>border(s,i));const opportunity=i=>{const foes=ADJ[i].filter(j=>s.owner[j]!==s.turn),weakest=Math.min(...foes.map(j=>s.armies[j]));return(s.armies[i]+s.reserve)/(weakest+1)+owned(s).filter(j=>REGIONS[j].c===REGIONS[i].c).length*.35;};
 targets.sort((a,b)=>opportunity(b)-opportunity(a));deploy(s,targets[0]??owned(s)[0],s.reserve);return true;}
 if(s.phase==='attack'){
 if(s.advance)advance(s,s.armies[s.advance.a]-1);
 const options=owned(s).flatMap(a=>ADJ[a].filter(b=>canAttack(s,a,b)).map(b=>({a,b,score:s.armies[a]-s.armies[b]*1.25>1?s.armies[b]+(REGIONS[a].c===REGIONS[b].c?2:0)+(owned(s,s.owner[b]).length===1?20:0):-1}))).filter(o=>o.score>=1);options.sort((a,b)=>b.score-a.score);
 if(options.length){attack(s,options[0].a,options[0].b,{blitz:true});return true;}nextPhase(s);return true;}
 if(s.phase==='fortify'){const inside=owned(s).filter(i=>!border(s,i)&&s.armies[i]>1).sort((a,b)=>s.armies[b]-s.armies[a]);if(!s.fortified&&inside.length){const a=inside[0],targets=owned(s).filter(i=>border(s,i)&&connected(s,a,i)).sort((a,b)=>threat(s,b)-threat(s,a));if(targets.length)fortify(s,a,targets[0],s.armies[a]-1);}nextPhase(s);return true;}return false;
}
export function valid(s){
 if(!(s&&typeof s.rnd==='function'&&int(s.turn,0,3)&&int(s.round,1,100000)&&['deploy','attack','fortify'].includes(s.phase)&&!s.over&&Array.isArray(s.owner)&&s.owner.length===30&&s.owner.every(n=>int(n,0,3))&&owned(s).length&&Array.isArray(s.armies)&&s.armies.length===30&&s.armies.every(n=>int(n,1,100000))&&Array.isArray(s.cards)&&s.cards.length===4&&s.cards.every(a=>Array.isArray(a)&&a.length<=40&&a.every(n=>int(n,0,s.schema===2?31:2)))&&int(s.reserve,0,100000)&&int(s.sets,0,100000)&&int(s.battles,0,10000000)&&typeof s.conquered==='boolean'&&typeof s.fortified==='boolean'&&(!s.advance||int(s.advance.a,0,29)&&int(s.advance.b,0,29)&&s.owner[s.advance.a]===s.turn&&s.owner[s.advance.b]===s.turn&&ADJ[s.advance.a].includes(s.advance.b))&&Array.isArray(s.log)&&s.log.length<=35&&s.log.every(t=>typeof t==='string'&&t.length<300)))return false;
 if(s.phase==='deploy'&&s.reserve===0&&!mustTrade(s))return false;
 if(s.schema===undefined)return true;
 if(s.schema!==2||!int(s.defenseDice,1,2)||typeof s.cardBonusUsed!=='boolean'||typeof s.tradeToAttack!=='boolean'||typeof s.drawn!=='boolean'||s.tradeToAttack&&s.phase!=='deploy'||!Array.isArray(s.deck)||!Array.isArray(s.discard))return false;
 const all=[...s.cards.flat(),...s.deck,...s.discard];return all.length===32&&new Set(all).size===32&&all.every(n=>int(n,0,31))&&(s.phase==='deploy'||s.reserve===0);
}
