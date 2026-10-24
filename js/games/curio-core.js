// Curio Cabinet: seeded spatial recall, with no DOM or clock side effects.
import {mulberry32,shuffle} from './rng.js';
export const COUNTS=[4,5,6,8,10];
export const ROOM_IDS=['study','glasshouse','observatory'];
const layouts=[
 [0,2,5,7,8,11,1,4,6,9],
 [1,3,4,6,9,10,0,2,7,11],
 [0,3,5,6,8,10,2,4,9,11],
 [1,2,4,7,9,11,0,5,6,10],
 [0,2,4,6,9,11,1,3,7,10],
 [1,3,5,7,8,10,0,2,4,11],
];
export const ROOMS=[
 {id:'study',name:'Clockmaker’s Study',tag:'Walnut, brass & little wonders',reward:'The clockwork wakes. A little bird finds its song.',items:['Brass songbird','Pocket watch','Scarlet bottle','Golden key','Music box','Enamel butterfly','Ivory knight','Copper bell','Magnifying glass','Pearl box'],layouts},
 {id:'glasshouse',name:'The Glasshouse',tag:'Colored glass & quiet rain',reward:'The lamps glow. New flowers open beneath the glass.',items:['Potted fern','Watering can','Seed jar','Ceramic snail','Pink orchid','Garden gloves','Glass apple','Moss terrarium','Pruning shears','Honey bottle'],layouts:layouts.map(a=>a.map(n=>(n+4)%12))},
 {id:'observatory',name:'Midnight Observatory',tag:'Velvet skies & moving stars',reward:'The orrery turns. A new constellation comes into view.',items:['Brass telescope','Crescent moon','Celestial globe','Violet crystals','Star chart','Blue hourglass','Silver star','Ceramic owl','Armillary sphere','Moon book'],layouts:layouts.map(a=>a.map(n=>11-n))},
];
export const roomOf=r=>ROOMS.find(x=>x.id===r.room);
export const itemName=id=>ROOMS[Math.floor(id/10)]?.items[id%10]||'';
export function createRun(seed=1,{room='study',calm=false}={}){
 if(!ROOM_IDS.includes(room))room='study';
 const r={schema:1,seed,rnd:mulberry32(seed),room,calm:!!calm,round:0,order:[],phase:'study',timeLeft:10,pieces:[],tray:[],answer:[],placed:[],selected:null,assisted:false,peeks:0,results:[],score:0,over:false};
 r.order=shuffle(r.rnd,[0,1,2,3,4,5]);beginRound(r);return r;
}
function beginRound(r){const offset=ROOM_IDS.indexOf(r.room)*10,n=COUNTS[r.round];
 r.pieces=shuffle(r.rnd,Array.from({length:10},(_,i)=>offset+i)).slice(0,n);
 const layout=roomOf(r).layouts[r.order[r.round]];
 r.answer=Array(12).fill(null);r.pieces.forEach((id,i)=>r.answer[layout[i]]=id);
 r.tray=shuffle(r.rnd,r.pieces);r.placed=Array(12).fill(null);r.selected=null;r.assisted=false;r.timeLeft=10;r.phase='study';
}
export function remember(r){if(r.over||r.phase!=='study')return false;r.phase='shutter';r.timeLeft=.45;return true;}
export function tick(r,dt){if(r.over||!Number.isFinite(dt))return;dt=Math.max(0,Math.min(.25,dt));
 if(r.phase==='study'&&!r.calm){r.timeLeft=Math.max(0,r.timeLeft-dt);if(r.timeLeft===0)remember(r);}
 else if(r.phase==='shutter'||r.phase==='peek'){r.timeLeft=Math.max(0,r.timeLeft-dt);if(r.timeLeft===0)r.phase='recall';}
}
export function peek(r){if(r.over||r.phase!=='recall')return false;r.peeks++;r.assisted=true;r.phase='peek';r.timeLeft=2;return true;}
export function dismissPeek(r){if(r.phase==='peek'){r.phase='recall';r.timeLeft=0;}}
export function select(r,id){if(r.over||r.phase!=='recall'||!r.pieces.includes(id))return false;r.selected=r.selected===id?null:id;return true;}
export function place(r,slot,id=r.selected){if(r.over||r.phase!=='recall'||!Number.isInteger(slot)||slot<0||slot>=12||!r.pieces.includes(id))return false;
 const previous=r.placed.indexOf(id),occupant=r.placed[slot];
 if(previous===slot){r.placed[slot]=null;r.selected=id;return true;}
 if(previous>=0)r.placed[previous]=occupant;
 r.placed[slot]=id;r.selected=null;return true;
}
export function returnToTray(r,id=r.selected){if(r.over||r.phase!=='recall'||!r.pieces.includes(id))return false;const i=r.placed.indexOf(id);if(i>=0)r.placed[i]=null;r.selected=null;return true;}
export const readyToSubmit=r=>r.phase==='recall'&&r.pieces.every(id=>r.placed.includes(id));
export function submit(r){if(r.over||!readyToSubmit(r))return null;const total=r.pieces.length,correct=r.answer.filter((id,i)=>id!==null&&r.placed[i]===id).length;
 const score=Math.round((correct*100+(correct===total?250:0))*(r.assisted?.65:1));
 const result={correct,total,assisted:r.assisted,score};r.results.push(result);r.score+=score;r.phase='reveal';r.selected=null;return result;
}
export function nextRound(r){if(r.over||r.phase!=='reveal')return false;if(r.round===COUNTS.length-1){r.over=true;r.phase='complete';return true;}r.round++;beginRound(r);return true;}
export const accuracy=r=>{const n=r.results.reduce((n,x)=>n+x.total,0);return n?r.results.reduce((n,x)=>n+x.correct,0)/n:0;};
export const medal=r=>accuracy(r)>=.95&&r.peeks===0?3:accuracy(r)>=.75?2:accuracy(r)>=.5?1:0;
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
export function valid(r){
 if(!r||r.schema!==1||typeof r.rnd!=='function'||!int(r.seed,0,4294967295)||!ROOM_IDS.includes(r.room)||typeof r.calm!=='boolean'||!int(r.round,0,4)||!['study','shutter','recall','peek','reveal'].includes(r.phase)||!Number.isFinite(r.timeLeft)||r.timeLeft<0||r.timeLeft>10||typeof r.assisted!=='boolean'||!int(r.peeks,0,10000))return false;
 const start=ROOM_IDS.indexOf(r.room)*10,n=COUNTS[r.round],item=id=>int(id,start,start+9);
 if(!Array.isArray(r.order)||r.order.length!==6||new Set(r.order).size!==6||!r.order.every(i=>int(i,0,5)))return false;
 if(!Array.isArray(r.pieces)||r.pieces.length!==n||!r.pieces.every(item)||new Set(r.pieces).size!==n)return false;
 if(!Array.isArray(r.tray)||r.tray.length!==n||new Set(r.tray).size!==n||!r.tray.every(id=>r.pieces.includes(id)))return false;
 if(![r.answer,r.placed].every(a=>Array.isArray(a)&&a.length===12&&a.every(id=>id===null||r.pieces.includes(id))&&new Set(a.filter(id=>id!==null)).size===a.filter(id=>id!==null).length)||r.answer.filter(id=>id!==null).length!==n)return false;
 if(r.selected!==null&&!r.pieces.includes(r.selected))return false;
 if(!Array.isArray(r.results)||r.results.length!==r.round+(r.phase==='reveal'?1:0)||!r.results.every((x,i)=>x&&x.total===COUNTS[i]&&int(x.correct,0,x.total)&&typeof x.assisted==='boolean'&&int(x.score,0,1250)))return false;
 if(!int(r.score,0,10000)||r.score!==r.results.reduce((n,x)=>n+x.score,0))return false;
 return true;
}
