// Fixed-step circle/segment physics. The editor and challenge checks use this same engine.
export const W=900,H=560,R=9;
const ramp=(x,y,a=20)=>({kind:'ramp',x,y,a});
const rail=(x,y,x2,y2)=>({x,y,x2,y2});
export const LEVELS=[
 {name:'The first bridge',note:'Bridge the gap with two sloping rails. Let gravity do the work.',source:{x:85,y:55},goal:{x:670,y:344},fixed:[rail(30,120,350,220)],stars:[{x:440,y:244},{x:585,y:294}],stock:{ramp:3,bumper:0,fan:0},solution:[ramp(425,255),ramp(585,315)]},
 {name:'Long way down',note:'Carry your momentum across the whole bench. Overlap the rail ends slightly.',source:{x:85,y:55},goal:{x:805,y:402},fixed:[rail(30,110,240,175)],stars:[{x:350,y:218},{x:610,y:338}],stock:{ramp:4,bumper:1,fan:0},solution:[ramp(300,210),ramp(465,275,25),ramp(620,350,25),ramp(755,420,30)]},
 {name:'The missing middle',note:'The upper and lower tracks are fixed. Build a smooth connection between them.',source:{x:85,y:45},goal:{x:800,y:445},fixed:[rail(30,110,280,188),rail(570,340,825,455)],stars:[{x:380,y:227},{x:690,y:383}],stock:{ramp:3,bumper:1,fan:0},solution:[ramp(350,229,25),ramp(510,305,25)]},
 {name:'A gentle landing',note:'Keep the marble on a shallow line. A steep drop can overshoot the cup.',source:{x:70,y:40},goal:{x:800,y:335},fixed:[rail(25,100,265,155),rail(610,280,825,340)],stars:[{x:390,y:189},{x:700,y:292}],stock:{ramp:3,bumper:1,fan:1},solution:[ramp(340,188,15),ramp(505,240,20)]},
 {name:'High wire',note:'A narrow runway. Watch the marble’s trail, then adjust your angles.',source:{x:90,y:35},goal:{x:790,y:414},fixed:[rail(25,100,230,170),rail(455,285,555,330)],stars:[{x:330,y:206},{x:660,y:369}],stock:{ramp:4,bumper:2,fan:1},solution:[ramp(305,210,25),ramp(460,280,25),ramp(620,365,25),ramp(745,422,25)]},
 {name:'The final delivery',note:'Build a complete run. Both stars and a safe delivery earn the gold medal.',source:{x:80,y:35},goal:{x:810,y:420},fixed:[rail(25,100,195,155)],stars:[{x:370,y:232},{x:650,y:385}],stock:{ramp:5,bumper:2,fan:2},solution:[ramp(265,195,25),ramp(425,270,25),ramp(580,345,25),ramp(730,422,30)]},
];
export const segment=p=>{const a=p.a*Math.PI/180,dx=Math.cos(a)*90,dy=Math.sin(a)*90;return{x:p.x-dx,y:p.y-dy,x2:p.x+dx,y2:p.y+dy};};
export function createRun(seed=1,{sandbox=false}={}){return{seed,level:0,pieces:[],medals:Array(LEVELS.length).fill(0),attempts:0,sandbox,over:false};}
export function definition(s){return s.sandbox?{name:'Free build',note:'Your bench, your rules. Build, test, and experiment.',source:{x:70,y:40},goal:{x:815,y:490},fixed:[rail(20,110,190,160)],stars:[{x:400,y:250},{x:650,y:375}],stock:{ramp:18,bumper:6,fan:6}}:LEVELS[s.level];}
export function remaining(s,kind){return definition(s).stock[kind]-s.pieces.filter(p=>p.kind===kind).length;}
export function place(s,p){if(!['ramp','bumper','fan'].includes(p.kind)||remaining(s,p.kind)<=0||!Number.isFinite(p.x+p.y+p.a))return false;s.pieces.push({...p,x:Math.max(30,Math.min(W-30,p.x)),y:Math.max(70,Math.min(H-40,p.y)),a:Math.max(-75,Math.min(75,p.a))});return true;}
export function launch(s){s.attempts++;const l=definition(s);return{x:l.source.x,y:l.source.y,vx:24,vy:0,t:0,acc:0,trail:[],stars:l.stars.map(()=>false),status:'rolling',bump:0};}
export function step(s,b,dt){if(b.status!=='rolling')return;b.acc+=Math.min(.1,Math.max(0,dt));while(b.acc>=1/240&&b.status==='rolling'){b.acc-=1/240;tick(s,b,1/240);}}
function tick(s,b,dt){b.t+=dt;b.bump=Math.max(0,b.bump-dt);const l=definition(s);b.vy+=460*dt;
 for(const p of s.pieces){if(p.kind==='fan'&&Math.abs(b.x-p.x)<42&&b.y<p.y&&b.y>p.y-190){b.vy-=1100*dt;b.vx+=70*dt;}}
 b.vx*=.99995;b.x+=b.vx*dt;b.y+=b.vy*dt;
 for(const p of [...l.fixed,...s.pieces.filter(p=>p.kind==='ramp').map(segment)])if(b.x<l.goal.x-27)collide(b,p);
 for(const p of s.pieces){if(p.kind!=='bumper')continue;const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy);if(d<31&&d>0){b.x=p.x+dx/d*31;b.y=p.y+dy/d*31;if(b.bump<=0){const a=p.a*Math.PI/180;b.vx=Math.cos(a)*360;b.vy=-Math.sin(a)*360;b.bump=.2;}}}
 l.stars.forEach((p,i)=>{if(Math.hypot(b.x-p.x,b.y-p.y)<25)b.stars[i]=true;});
 if(Math.abs(b.x-l.goal.x)<28&&b.y>l.goal.y-7&&b.y<l.goal.y+32&&b.vy>=0){b.status='delivered';if(!s.sandbox)s.medals[s.level]=Math.max(s.medals[s.level],1+b.stars.filter(Boolean).length);}
 else if(b.y>H+20||b.x>W+50||b.x<-50||b.t>18)b.status='missed';
 if(Math.floor(b.t*40)>b.trail.length){b.trail.push({x:b.x,y:b.y});if(b.trail.length>600)b.trail.shift();}
}
function collide(b,p){const dx=p.x2-p.x,dy=p.y2-p.y,len=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((b.x-p.x)*dx+(b.y-p.y)*dy)/len)),x=p.x+dx*t,y=p.y+dy*t;let nx=b.x-x,ny=b.y-y,d=Math.hypot(nx,ny);if(d>=R+3)return;if(d<.001){nx=dy;ny=-dx;d=Math.hypot(nx,ny);}nx/=d;ny/=d;b.x=x+nx*(R+3);b.y=y+ny*(R+3);const v=b.vx*nx+b.vy*ny;if(v<0){b.vx-=1.06*v*nx;b.vy-=1.06*v*ny;}}
export function valid(s){return s&&Number.isInteger(s.level)&&s.level>=0&&s.level<LEVELS.length&&typeof s.sandbox==='boolean'&&Array.isArray(s.medals)&&s.medals.length===LEVELS.length&&s.medals.every(n=>Number.isInteger(n)&&n>=0&&n<=3)&&Array.isArray(s.pieces)&&s.pieces.length<=30&&s.pieces.every(p=>['ramp','bumper','fan'].includes(p.kind)&&Number.isFinite(p.x+p.y+p.a)&&p.x>=0&&p.x<=W&&p.y>=0&&p.y<=H&&Math.abs(p.a)<=75)&&['ramp','bumper','fan'].every(k=>remaining(s,k)>=0);}
