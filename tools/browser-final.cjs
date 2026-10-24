const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright' : 'playwright');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.woff':'font/woff','.webmanifest':'application/manifest+json'};
(async()=>{
const server=http.createServer((req,res)=>{let name;try{name=decodeURIComponent(req.url.split('?')[0])}catch{res.writeHead(400);res.end();return;}if(name.startsWith('/test-subpath/'))name=name.slice('/test-subpath'.length);const file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
let browser;try{
browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE || undefined,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--disable-dev-shm-usage','--no-zygote'],headless:true});
const context=await browser.newContext({viewport:{width:412,height:915},hasTouch:true,isMobile:true,deviceScaleFactor:1});
const page=await context.newPage();page.setDefaultTimeout(10000);
const shot=async name=>{if(process.env.QA_OUTPUT_DIR){fs.mkdirSync(process.env.QA_OUTPUT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.QA_OUTPUT_DIR,name+'.png')});}};const errors=[];const failRequests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,300))});page.on('response',r=>{if(r.status()>=400)failRequests.push(r.url()+': '+r.status());});
await page.goto(base);await page.waitForTimeout(350);
await shot('arcade-mobile');
const assert=require('assert/strict');
const cdp=await context.newCDPSession(page);
const touch=async(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(p=>({id:p.id,x:p.x,y:p.y,radiusX:6,radiusY:6,force:1}))});
const tap=async(x,y)=>{await touch('touchStart',[{id:1,x,y}]);await touch('touchEnd',[]);};
async function readRun(id){return page.evaluate(async id=>{const {store}=await import('./js/store.js');return store.loadGame(id)?.state;},id);}
async function launchSave(name){const card=page.locator('.game-card').filter({has:page.getByRole('heading',{name,exact:true})});await card.getByRole('button',{name:'Continue →',exact:true}).click();await page.locator('.go-actions .primary').click();}
async function pauseRead(id){await page.getByRole('button',{name:'Pause menu',exact:true}).click();return readRun(id);}
async function leave(){await page.getByRole('button',{name:'Save & leave',exact:true}).click();await page.locator('.arcade-header').waitFor();}
await page.evaluate(async()=>{
 const {store}=await import('./js/store.js'),{snapshot}=await import('./js/checkpoint.js'),S=await import('./js/games/survivor-core.js');
 store.setSetting('sound',false);store.setSetting('haptics',false);store.setSetting('reduce',true);store.setSetting('saver',false);store.setPref('survivor','aim',1);
 const r=S.createRun(823,{modern:true,duration:600,manual:true});r.t=20;r.hero.hp=r.hero.maxHp=200;r.cd=0;
 r.enemies=[{id:100,kind:'boss',x:0,y:0,hp:1000,maxHp:1000,hit:0,orbCd:0,vx:0,vy:0},{id:101,kind:'grunt',x:180,y:0,hp:1000,maxHp:1000,hit:0,orbCd:0,vx:0,vy:0}];r.nextId=102;
 store.saveGame('survivor',snapshot(r,{heroClass:0,theme:0,mode:'standard'}));
});
await page.reload();await launchSave('Holiday Horde');let box=await page.locator('.sv-canvas').boundingBox();let center={x:box.x+box.width/2,y:box.y+box.height/2};
await tap(center.x+140,center.y);await page.waitForTimeout(300);let first=await pauseRead('survivor');assert.equal(first.manual,false,'saved manual aim must migrate');assert.ok(first.hero.x>15,'a single right-side tap must move immediately after finger lifts');assert.ok(first.hero.hp<200,'enemy must actually hit during the test');assert.ok(first.shots.length>0||first.enemies.find(e=>e.id===100)?.hp<1000,'auto-fire must work after contact without a shooting finger');
await page.getByRole('button',{name:'Resume',exact:true}).click();await tap(center.x-140,center.y);await page.waitForTimeout(350);let second=await pauseRead('survivor');assert.ok(second.hero.x<first.hero.x-20,'contact or pause must not lock direction changes');assert.ok(second.t>first.t);await page.getByRole('button',{name:'Resume',exact:true}).click();
await touch('touchStart',[{id:1,x:center.x+140,y:center.y}]);await touch('touchStart',[{id:1,x:center.x+140,y:center.y},{id:2,x:center.x-140,y:center.y}]);await touch('touchEnd',[{id:2,x:center.x-140,y:center.y}]);await touch('touchEnd',[]);await page.waitForTimeout(300);let third=await pauseRead('survivor');assert.ok(third.hero.x>second.hero.x+15,'an extra finger must not hijack movement or cancel a released destination');await page.getByRole('button',{name:'Resume',exact:true}).click();
await touch('touchStart',[{id:3,x:center.x+100,y:center.y}]);await touch('touchCancel',[]);await page.waitForTimeout(100);let cancelled=await pauseRead('survivor');await page.getByRole('button',{name:'Resume',exact:true}).click();await page.waitForTimeout(200);let still=await pauseRead('survivor');assert.ok(Math.abs(still.hero.x-cancelled.hero.x)<3,'cancelled input cannot stay held');await leave();
console.log('PASS real touch: single-tap movement, old manual saves, point-blank hits, auto-fire, retargeting, extra fingers, cancellation and pause recovery');
// A pending upgrade is a visible choice, and choosing it must resume autonomous fire.
await page.evaluate(async()=>{const {store}=await import('./js/store.js'),r=store.loadGame('survivor');r.state.pending=1;r.state.hero.x=0;r.state.hero.y=0;r.state.hero.hp=200;r.state.enemies[0].x=0;r.state.enemies[0].y=0;r.state.cd=0;store.saveGame('survivor',r);});await page.reload();await launchSave('Holiday Horde');await page.locator('.up-card').first().click();await tap(center.x+120,center.y);await page.waitForTimeout(300);const upgraded=await pauseRead('survivor');assert.equal(upgraded.pending,0);assert.ok(upgraded.hero.x>15);assert.ok(upgraded.shots.length||upgraded.enemies[0].hp<1000);await leave();console.log('PASS contact and tap-to-move recover after an upgrade choice');
await page.getByRole('button',{name:'Play Curio Cabinet',exact:true}).click();await page.getByRole('checkbox',{name:'Unlimited study time',exact:true}).check();await page.locator('.go-actions .primary').click();await shot('curio-study-mobile');
await page.getByRole('button',{name:'I have it — close cabinet',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.curio-phase')?.textContent==='PUT THE OBJECTS BACK');
assert.equal(await page.locator('.curio-slot.occupied').count(),0,'recall must not retain study images');let r=await readRun('curio');let ids=r.pieces;
const itemName=async id=>page.evaluate(async id=>(await import('./js/games/curio-core.js')).itemName(id),id);
// Native touch select/place, followed by keyboard placement and a pointer drag.
let id=ids[0],slot=r.answer.indexOf(id);await page.getByRole('button',{name:'Select '+await itemName(id),exact:true}).tap();await page.locator('.curio-slot').nth(slot).tap();assert.equal((await readRun('curio')).placed[slot],id);
id=ids[1];slot=r.answer.indexOf(id);await page.getByRole('button',{name:'Select '+await itemName(id),exact:true}).focus();await page.keyboard.press('Enter');for(let j=0;j<slot%4;j++)await page.keyboard.press('ArrowRight');for(let j=0;j<Math.floor(slot/4);j++)await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal((await readRun('curio')).placed[slot],id);
id=ids[2];slot=r.answer.indexOf(id);let src=await page.getByRole('button',{name:'Select '+await itemName(id),exact:true}).boundingBox(),dst=await page.locator('.curio-slot').nth(slot).boundingBox();await page.mouse.move(src.x+src.width/2,src.y+src.height/2);await page.mouse.down();await page.mouse.move(dst.x+dst.width/2,dst.y+dst.height/2,{steps:10});await page.mouse.up();assert.equal((await readRun('curio')).placed[slot],id);await page.waitForTimeout(360);
await page.getByRole('button',{name:'Peek at arrangement',exact:true}).click();await page.getByRole('button',{name:'Pause menu',exact:true}).click();assert.equal(await page.locator('.curio-slot.occupied').count(),0,'pause must hide answers');await leave();await launchSave('Curio Cabinet');assert.equal(await page.locator('.curio-phase').textContent(),'PUT THE OBJECTS BACK');assert.equal(await page.locator('.curio-slot.occupied').count(),3,'resume must restore placements without revealing remaining answers');
for(let round=0;round<5;round++){
 r=await readRun('curio');
 for(const id of r.pieces){if(r.placed.includes(id))continue;const i=r.answer.indexOf(id);await page.getByRole('button',{name:'Select '+await itemName(id),exact:true}).click();await page.locator('.curio-slot').nth(i).click();}
 await page.getByRole('button',{name:'Check arrangement',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.curio-phase')?.textContent==='THE ARRANGEMENT REVEALED');if(round===0)await shot('curio-reveal-mobile');
 if(round<4){await page.getByRole('button',{name:'Next arrangement',exact:true}).click();await page.getByRole('button',{name:'I have it — close cabinet',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.curio-phase')?.textContent==='PUT THE OBJECTS BACK');}else await page.getByRole('button',{name:'Finish collection',exact:true}).click();
}
await page.locator('.results-card').waitFor();assert.equal(await readRun('curio'),undefined);const outcome=await page.evaluate(async()=>{const {store}=await import('./js/store.js');return{session:store.sessions().at(-1),medal:store.pref('curio','medal_study',0)};});assert.equal(outcome.session.g,'curio');assert.equal(outcome.session.a,1);assert.equal(outcome.medal,2);await page.getByRole('button',{name:'Back to games',exact:true}).click();await page.locator('.arcade-header').waitFor();
console.log('PASS Curio touch, keyboard, drag/drop, hidden answers, assisted peek pause/resume, all five rounds, result storage and medals');
for(const [room,label]of [['glasshouse','The Glasshouse'],['observatory','Midnight Observatory']]){
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Play Curio Cabinet',exact:true}).click();await page.getByRole('button',{name:new RegExp(label)}).click();await page.locator('.go-actions .primary').click();await page.waitForTimeout(100);await shot('curio-'+room+'-desktop');await page.getByRole('button',{name:'Pause menu',exact:true}).click();await leave();
}
console.log('PASS all room materials and desktop layouts');console.log(JSON.stringify({errors,failRequests}));if(errors.length||failRequests.length)throw Error('Browser errors were recorded');
}finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
