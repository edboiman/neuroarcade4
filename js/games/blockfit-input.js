import * as B from './blockfit-core.js';
// Transient pointer ownership. Nothing here is included in a checkpoint.
export const createDrag=()=>({pointer:null});
export function grabbed(d,g){return !!d.pointer&&d.pointer.mode==='grab'&&d.pointer.piece===g.cur&&!g.over;}
export function beginDrag(d,g,p,m){
 if(d.pointer||g.over||![p.x,p.y,m.cell].every(Number.isFinite)||m.cell<=0)return false;
 const slop=m.cell*.22,hit=B.absCells(g.cur).some(([x,y])=>y>=0&&p.x>=m.pad+x*m.cell-slop&&p.x<=m.pad+(x+1)*m.cell+slop&&p.y>=m.boardTop+y*m.cell-slop&&p.y<=m.boardTop+(y+1)*m.cell+slop);
 d.pointer={id:p.id,x:p.x,y:p.y,lx:p.x,t:p.t,acc:0,moved:false,mode:hit?'grab':'swipe',piece:g.cur,startX:g.cur.x,startY:g.cur.y};
 B.setSoft(g,false);if(hit){g.acc=0;g.lockMs=0;}return true;
}
export function moveDrag(d,g,p,m){
 const q=d.pointer;if(!q||q.id!==p.id||g.over||q.piece!==g.cur)return false;
 if(Math.hypot(p.x-q.x,p.y-q.y)>=m.cell*.3)q.moved=true;
 if(q.mode==='grab'){
 const target=q.startX+Math.round((p.x-q.x)/m.cell),dx=Math.sign(target-g.cur.x);
 for(let i=0;i<B.COLS&&g.cur.x!==target;i++)if(!B.move(g,g.twist?.kind==='mirror'?-dx:dx))break;
 const down=q.startY+Math.round(Math.max(0,p.y-q.y)/m.cell)-g.cur.y;
 if(down>0)B.dragDown(g,down);
 }else{
 q.acc+=p.x-q.lx;const step=m.cell*.85;
 while(Math.abs(q.acc)>=step){const dir=Math.sign(q.acc);B.move(g,dir);q.acc-=dir*step;q.moved=true;}
 B.setSoft(g,p.y-q.y>m.cell*1.6);
 }
 q.lx=p.x;return true;
}
export function cancelDrag(d,g){const q=d.pointer;d.pointer=null;B.setSoft(g,false);if(q?.mode==='grab'){g.acc=0;g.lockMs=0;}return q?.id??null;}
export function endDrag(d,g,p,m,{cancel=false}={}){
 const q=d.pointer;if(!q||q.id!==p.id)return false;
 B.setSoft(g,false);
 if(!cancel&&!g.over&&q.piece===g.cur){const dx=p.x-q.x,dy=p.y-q.y,dt=p.t-q.t;
 if(!q.moved&&Math.hypot(dx,dy)<Math.min(12,m.cell*.45)&&dt<280)B.rotate(g,1);
 else if(q.mode==='swipe'&&dy>m.cell*2.2&&dt<300&&Math.abs(dx)<m.cell*2)B.hardDrop(g);
 }
 cancelDrag(d,g);return true;
}
