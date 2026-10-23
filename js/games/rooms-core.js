// Pure engines for the five new arcade rooms. No DOM or timers.
import { mulberry32, shuffle } from './rng.js';
export const rotateMask = m => ((m << 1) & 15) | (m >> 3);
export function createRoom(id, seed = 1) {
  const g = { id, seed, rnd: mulberry32(seed), stage: 1, score: 0, moves: 0, over: false, won: false, events: [] };
  if (id === 'signal') Object.assign(g, { tick: 0, switches: Array(6).fill(0), trains: [], delivered: 0, missed: 0, spawned: 0, nextId: 1, lives: 3, total: 12 });
  if (id === 'workshop') makeWorkshop(g);
  if (id === 'echo') Object.assign(g, { sequence: [Math.floor(g.rnd()*4)], input: [], lives: 3, best: 0 });
  if (id === 'casebook') Object.assign(g, { case: 0, clues: [], solved: false, wrong: 0 });
  if (id === 'logistics') makeTown(g);
  return g;
}
export function setSwitch(g, row, col) {
  if (g.over || g.id !== 'signal' || ![2,4].includes(col) || row<0 || row>2) return false;
  const i = row * 2 + (col === 4 ? 1 : 0);
  const options = row === 0 ? [0,1,3] : row === 2 ? [0,-1,3] : [0,-1,1,3];
  g.switches[i] = options[(options.indexOf(g.switches[i]) + 1) % options.length]; g.moves++; return true;
}
export function railTick(g) {
  if (g.over) return;
  g.events = []; g.tick++;
  for (const t of g.trains) {
    if ([2,4].includes(t.col)) {const setting=g.switches[t.row*2+(t.col===4?1:0)];if(setting===3)continue;t.row+=setting;}
    t.col++;
    if (t.col > 6) {
      if (t.row === t.target) { g.delivered++; g.score += 100; g.events.push({ type: 'delivery' }); }
      else { g.missed++; g.lives--; g.events.push({ type: 'miss' }); }
    }
  }
  g.trains = g.trains.filter(t=>t.col<=6);
  const occupied = new Map();
  for(const t of g.trains) {
    const k=t.row*7+t.col;
    if(occupied.has(k)) { t.crashed=true; occupied.get(k).crashed=true; }
    else occupied.set(k,t);
  }
  const crashed = g.trains.filter(t=>t.crashed).length;
  if(crashed) { g.lives--; g.missed+=crashed; g.events.push({type:'collision'}); g.trains=g.trains.filter(t=>!t.crashed); }
  if (g.spawned < g.total && g.tick % 6 === 1) {
    const rows=shuffle(g.rnd,[0,1,2]);
    for(const row of rows.slice(0,Math.min(2,g.total-g.spawned))){const target=Math.floor(g.rnd()*3);g.trains.push({id:g.nextId++,row,col:0,target});g.spawned++;}
  }
  if(g.lives<=0 || (g.spawned === g.total && !g.trains.length)) { g.over=true; g.won=g.lives>0; }
}
// Conduit directions: N=1 E=2 S=4 W=8. Every generated board has a known solution.
export function makeWorkshop(g) {
  const cells=Array.from({length:25},()=>({mask:0,goal:0}));
  const path=[{x:0,y:2}]; let y=2;
  for(let x=0;x<5;x++) {
    const target=x===4?2:Math.floor(g.rnd()*5);
    while(y!==target) { y+=Math.sign(target-y); path.push({x,y}); }
    if(x<4) path.push({x:x+1,y});
  }
  const bit=(a,b)=>b.x>a.x?2:b.x<a.x?8:b.y>a.y?4:1;
  path.forEach((q,i)=>{
    let mask=i===0?8:bit(q,path[i-1]);
    mask|=i===path.length-1?2:bit(q,path[i+1]);
    cells[q.y*5+q.x].goal=mask;
  });
  for(const c of cells) {
    if(!c.goal) c.goal=[3,5,6,9,10,12][Math.floor(g.rnd()*6)];
    c.mask=c.goal;
    const turns=Math.floor(g.rnd()*4); for(let i=0;i<turns;i++) c.mask=rotateMask(c.mask);
  }
  g.cells=cells; g.stageMoves=0; g.lit=[]; g.solved=false; workshopPower(g);
}
export function workshopPower(g) {
  const lit = new Set(); const q=[];
  if(g.cells[10].mask & 8) { q.push(10); lit.add(10); }
  const dirs=[[0,-1,1,4],[1,0,2,8],[0,1,4,1],[-1,0,8,2]];
  for(let j=0;j<q.length;j++) {
    const i=q[j], x=i%5,y=Math.floor(i/5);
    for(const [dx,dy,a,b] of dirs) {
      const nx=x+dx,ny=y+dy,k=ny*5+nx;
      if(nx<0||nx>=5||ny<0||ny>=5||lit.has(k)) continue;
      if((g.cells[i].mask&a)&&(g.cells[k].mask&b)) { lit.add(k); q.push(k); }
    }
  }
  g.lit=[...lit]; g.solved=lit.has(14)&&!!(g.cells[14].mask&2);
  return g.solved;
}
export function turnConduit(g,i) {
  if(g.over||g.solved||!Number.isInteger(i)||i<0||i>=25) return false;
  g.cells[i].mask=rotateMask(g.cells[i].mask);g.moves++;g.stageMoves++;
  if(workshopPower(g)) { g.score+=Math.max(100,600-g.stageMoves*5); if(g.stage===3) {g.over=true;g.won=true;} }
  return true;
}
export function echoTap(g,i) {
  if(g.over||!Number.isInteger(i)||i<0||i>3) return 'ignore';
  if(g.sequence[g.input.length]!==i) { g.lives--;g.input=[];if(g.lives<=0)g.over=true;return 'miss'; }
  g.input.push(i);g.moves++;
  if(g.input.length===g.sequence.length) {
    g.best=g.sequence.length;g.score+=g.sequence.length*25;
    if(g.best===12) {g.over=true;g.won=true;return 'win';}
    g.stage++;g.sequence.push(Math.floor(g.rnd()*4));g.input=[];return 'next';
  }
  return 'hit';
}
export const CASES = [
 {title:'The missing station clock',place:'The midnight station',story:'The platform clock vanished during the evening handover. Who took it down?',clues:[['Maintenance log','An electrician signed out a ladder at 18:40.'],['Counter receipt','The florist was serving a customer at 18:45.'],['Clock bracket','The screws were carefully removed, not forced.'],['Notice board','The clock was booked for a wiring inspection at 18:45.'],['Ticket punch','The conductor departed on the 18:30 train.'],['Work trolley','The clock is wrapped in a padded repair blanket.']],answers:['The electrician took it for its scheduled inspection.','The florist stole it while closing the shop.','The conductor took it aboard the train.'],correct:0,reason:'The inspection notice, signed ladder, and protected clock all point to routine maintenance.'},
 {title:'A greenhouse surprise',place:'The botanical garden',story:'The new seedlings wilted overnight, although the watering can was used. What went wrong?',clues:[['Soil','Only the top of the soil is wet; the roots are dry.'],['Watering can','The can holds one liter.'],['Care card','This tray needs four liters, applied slowly.'],['Thermometer','Overnight temperatures stayed in the safe range.'],['Window latch','The greenhouse stayed closed all night.'],['Garden journal','The helper recorded using one full can for the whole tray.']],answers:['A cold draft froze the seedlings.','The tray received too little water.','The seedlings were watered four times.'],correct:1,reason:'One one-liter can supplied only a quarter of the four liters the tray needed.'},
 {title:'The late delivery',place:'Copper Street bakery',story:'A bakery parcel arrived an hour late. Follow the records to find the cause.',clues:[['Dispatch slip','The parcel left the bakery at 09:00.'],['Driver log','The driver stopped at the closed East Bridge at 09:10.'],['Roadworks notice','East Bridge closed at 08:00; the diversion adds an hour.'],['Parcel seal','The original seal is intact.'],['Customer message','The customer was ready at 09:15.'],['Map','The dispatch route still uses East Bridge.']],answers:['The bakery dispatched it an hour late.','The customer was unavailable.','An outdated route sent the driver to a closed bridge.'],correct:2,reason:'The dispatch was on time. The route ignored a documented closure and its one-hour diversion.'},
 {title:'The silent piano',place:'The recital room',story:'The electronic piano makes no sound before rehearsal. Which explanation fits?',clues:[['Power light','The power light is on.'],['Volume dial','The volume is set halfway.'],['Headphone socket','A headphone adapter is still plugged in.'],['Manual','Inserting an adapter mutes the built-in speakers.'],['Power cable','The cable is firmly connected.'],['Rehearsal note','The pianist practiced with headphones yesterday.']],answers:['The headphone adapter is muting the speakers.','The power is disconnected.','The volume is set to zero.'],correct:0,reason:'The powered piano has volume, but the adapter triggers the manual’s speaker-mute behavior.'},
 {title:'The vanished blue paint',place:'The restoration studio',story:'The painter’s blue paint jar is empty, yet no blue picture was painted. Where did it go?',clues:[['Palette','Fresh green paint fills the mixing well.'],['Recipe card','Mix equal parts blue and yellow for the required green.'],['Yellow jar','The yellow jar is also half empty.'],['Brushes','The brushes hold green paint.'],['Work order','The day’s task was restoring a green garden gate.'],['Jar lid','The blue lid is clean; there is no sign of a spill.']],answers:['The blue paint spilled on the floor.','It was mixed with yellow to restore the green gate.','It was used to paint a blue sky.'],correct:1,reason:'The recipe, palette, brushes, and green-gate work order describe the same use of the blue paint.'},
];
export function inspectClue(g,i) { if(!g.over&&!g.solved&&Number.isInteger(i)&&i>=0&&i<6&&!g.clues.includes(i))g.clues.push(i); }
export function accuse(g,i) {
  if(g.over||g.solved||g.clues.length<6||!Number.isInteger(i)||i<0||i>2) return null;
  if(i===CASES[g.case].correct) {g.solved=true;g.score+=Math.max(50,300-g.wrong*50);if(g.case===CASES.length-1){g.over=true;g.won=true;}return true;}
  g.wrong++;return false;
}
export function townPath(g,tx,ty) {
  if(!Number.isInteger(tx)||!Number.isInteger(ty)||tx<0||tx>5||ty<0||ty>5)return null;
  const start=g.truck.y*6+g.truck.x,goal=ty*6+tx,prev=Array(36).fill(-2),q=[start];prev[start]=-1;
  for(let i=0;i<q.length;i++) {const c=q[i];if(c===goal)break;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=c%6+dx,y=Math.floor(c/6)+dy,n=y*6+x;if(x<0||x>5||y<0||y>5||prev[n]!==-2||g.closed.includes(n))continue;prev[n]=c;q.push(n);}}
  if(prev[goal]===-2)return null;const path=[];for(let c=goal;c!==start;c=prev[c])path.push({x:c%6,y:Math.floor(c/6)});return path.reverse();
}
function makeTown(g) {
  g.truck={x:0,y:5};g.fuel=60-(g.stage-1)*5;g.delivered=0;g.cargo=[];
  const candidates=shuffle(g.rnd,Array.from({length:29},(_,i)=>i+1));
  g.closed=[];
  for(const n of candidates.slice(0,4)) {g.closed.push(n);if(!Array.from({length:36},(_,i)=>i).every(i=>g.closed.includes(i)||townPath(g,i%6,Math.floor(i/6))))g.closed.pop();}
  const available=candidates.filter(i=>!g.closed.includes(i));
  g.parcels=available.slice(0,5).map((n,i)=>({id:i,x:n%6,y:Math.floor(n/6),done:false}));g.steps=0;
}
export function loadParcel(g,id) {
  if(g.over||g.truck.x!==0||g.truck.y!==5||g.cargo.length>=2||g.cargo.includes(id)||!g.parcels.some(p=>p.id===id&&!p.done))return false;
  g.cargo.push(id);return true;
}
export function driveTown(g,tx,ty) {
  if(g.over)return null;const path=townPath(g,tx,ty);if(!path||!path.length||path.length>g.fuel)return null;
  g.fuel-=path.length;g.steps+=path.length;g.moves++;g.truck={x:tx,y:ty};g.events=[];
  for(const p of g.parcels)if(!p.done&&p.x===tx&&p.y===ty&&g.cargo.includes(p.id)){p.done=true;g.delivered++;g.cargo=g.cargo.filter(id=>id!==p.id);g.score+=100;g.events.push({type:'delivery'});}
  if(g.delivered===5){g.score+=g.fuel*10;g.over=true;g.won=true;}
  else if(g.fuel===0)g.over=true;
  return path;
}
export function nextRoom(g) {
  if(g.over)return false;
  if(g.id==='workshop'&&g.solved){g.stage++;makeWorkshop(g);return true;}
  if(g.id==='casebook'&&g.solved){g.case++;g.stage++;g.clues=[];g.solved=false;g.wrong=0;return true;}
  return false;
}
export function validRoom(g) {
  if(!['signal','workshop','casebook','echo','logistics'].includes(g.id)||typeof g.rnd!=='function'||!Number.isInteger(g.seed)||!Number.isInteger(g.stage)||g.stage<1||g.stage>12||!Number.isFinite(g.score)||g.score<0)return false;
  if(g.id==='signal')return Array.isArray(g.switches)&&g.switches.length===6&&g.switches.every((n,i)=>[0,1,-1,3].includes(n)&&(n===3||Math.floor(i/2)+n>=0&&Math.floor(i/2)+n<3))&&Array.isArray(g.trains)&&g.trains.length<=12&&g.trains.every(t=>Number.isInteger(t.row)&&t.row>=0&&t.row<=2&&Number.isInteger(t.col)&&t.col>=0&&t.col<=6&&Number.isInteger(t.target)&&t.target>=0&&t.target<=2)&&Number.isInteger(g.tick)&&g.tick>=0&&g.lives>0&&g.lives<=3;
  if(g.id==='workshop')return Array.isArray(g.cells)&&g.cells.length===25&&g.cells.every(c=>Number.isInteger(c.mask)&&c.mask>0&&c.mask<16&&Number.isInteger(c.goal)&&c.goal>0&&c.goal<16)&&Array.isArray(g.lit)&&g.lit.every(i=>Number.isInteger(i)&&i>=0&&i<25);
  if(g.id==='echo')return Array.isArray(g.sequence)&&g.sequence.length<=12&&g.sequence.length>0&&g.sequence.every(i=>Number.isInteger(i)&&i>=0&&i<4)&&Array.isArray(g.input)&&g.input.length<g.sequence.length&&g.lives>0&&g.lives<=3;
  if(g.id==='casebook')return Number.isInteger(g.case)&&g.case>=0&&g.case<CASES.length&&Array.isArray(g.clues)&&g.clues.length<=6&&g.clues.every(i=>Number.isInteger(i)&&i>=0&&i<6);
  return g.truck&&Number.isInteger(g.truck.x)&&g.truck.x>=0&&g.truck.x<6&&Number.isInteger(g.truck.y)&&g.truck.y>=0&&g.truck.y<6&&Array.isArray(g.closed)&&g.closed.length<=5&&g.closed.every(i=>Number.isInteger(i)&&i>=0&&i<36)&&Array.isArray(g.parcels)&&g.parcels.length===5&&g.parcels.every(p=>Number.isInteger(p.id)&&p.id>=0&&p.id<5&&Number.isInteger(p.x)&&p.x>=0&&p.x<6&&Number.isInteger(p.y)&&p.y>=0&&p.y<6)&&Array.isArray(g.cargo)&&g.cargo.length<=2&&g.cargo.every(i=>Number.isInteger(i)&&i>=0&&i<5)&&Number.isFinite(g.fuel)&&g.fuel>=0&&g.fuel<=60;
}
