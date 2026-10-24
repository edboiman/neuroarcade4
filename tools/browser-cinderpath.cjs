// First run with CINDERPATH_HARNESS=1 before registering the game in the catalog.
// Then run against the real arcade to check result storage and integration.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const root=path.resolve(__dirname,'..'),harness=process.env.CINDERPATH_HARNESS==='1';
const mime={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.woff':'font/woff','.webmanifest':'application/manifest+json'};
const fixture=`import {mount} from './js/games/cinderpath.js';import {store} from './js/store.js';import * as audio from './js/audio.js';
const key='cinderpath-test';const testStore={...store,loadGame:()=>JSON.parse(sessionStorage.getItem(key)||'null'),saveGame:(id,obj)=>{sessionStorage.setItem(key,JSON.stringify(obj));return true;},clearGame:()=>sessionStorage.removeItem(key)};
window.__cpStore=testStore;let api;api=mount(document.getElementById('app'),{store:testStore,audio,game:{id:'cinderpath',name:'Cinderpath'},seed:1,mode:'standard',resume:!!testStore.loadGame(),settings:store.settings(),playing:()=>{},finish:r=>{window.__cpResult=r;api.destroy();document.getElementById('app').textContent='Expedition finished';},exit:()=>location.reload()});`;
(async()=>{
 const C=await import(pathToFileURL(path.join(root,'js/games/cinderpath-core.js'))),{restore}=await import(pathToFileURL(path.join(root,'js/checkpoint.js'))),B=await import(pathToFileURL(path.join(root,'tools/cinderpath-bot.mjs')));
 const server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]);if(name.startsWith('/test-subpath/'))name=name.slice('/test-subpath'.length);if(name==='/cp-harness.js'){res.setHeader('Content-Type','application/javascript');return res.end(fixture);}const file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+'/')){res.writeHead(403);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}if(name==='/'&&harness)data=Buffer.from(data.toString().replace('js/main.js','cp-harness.js').replace('</head>','<link rel="stylesheet" href="css/cinderpath.css"></head>'));res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--disable-dev-shm-usage','--no-zygote']});
  const context=await browser.newContext({viewport:{width:412,height:915},hasTouch:true,isMobile:true,deviceScaleFactor:1}),page=await context.newPage();page.setDefaultTimeout(15000);const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)requests.push(r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:'+server.address().port);
  if(!harness){await page.evaluate(async()=>{const {store}=await import('./js/store.js');store.setSetting('sound',false);store.setSetting('reduce',true);store.setPref('cinderpath','test',1);const {createRun}=await import('./js/games/cinderpath-core.js'),{snapshot}=await import('./js/checkpoint.js');store.saveGame('cinderpath',snapshot(createRun(1),{mode:'standard'}));});await page.reload();await page.locator('.game-card').filter({has:page.getByRole('heading',{name:'Cinderpath',exact:true})}).getByRole('button',{name:'Continue →',exact:true}).click();}
  await page.locator('.go-actions .primary').click();
  const snap=()=>page.evaluate(async harness=>harness?window.__cpStore.loadGame('cinderpath'):(await import('./js/store.js')).store.loadGame('cinderpath'),harness);
  const state=async()=>{const restored=restore(await snap(),C.valid);assert.ok(restored,'saved decision must validate');return restored.state;};
  const shot=async name=>{if(process.env.QA_OUTPUT_DIR){fs.mkdirSync(process.env.QA_OUTPUT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.QA_OUTPUT_DIR,name+'.png')});}};
  await shot('cinderpath-map-mobile');const visitedPhases=new Set(),picturedAreas=new Set();let actions=0,reloaded=new Set(),testedBattle=false,result=null;
  while(actions++<2500){
   const done=await page.evaluate(harness=>harness?window.__cpResult||null:!!document.querySelector('.results-card'),harness);if(done){result=done;break;}
   let r=await state();visitedPhases.add(r.phase);
   if(!reloaded.has(r.phase)){
    const before=JSON.stringify((await snap()).state);await page.reload();if(!harness)await page.locator('.game-card').filter({has:page.getByRole('heading',{name:'Cinderpath',exact:true})}).getByRole('button',{name:'Continue →',exact:true}).click();await page.locator('.go-actions .primary').click();assert.equal(JSON.stringify((await snap()).state),before,'reload cannot reroll '+r.phase);reloaded.add(r.phase);r=await state();
   }
   if(r.phase==='battle'&&!picturedAreas.has(r.act)){await shot('cinderpath-area'+r.act+'-mobile');await page.setViewportSize({width:1440,height:1000});await shot('cinderpath-area'+r.act+'-desktop');await page.setViewportSize({width:412,height:915});picturedAreas.add(r.act);}
   if(r.phase==='battle'&&!testedBattle){
    const before=JSON.stringify((await snap()).state);await page.getByRole('button',{name:'Deck · '+r.deck.length,exact:true}).click();await page.getByRole('button',{name:'Back to expedition',exact:true}).click();assert.equal(JSON.stringify((await snap()).state),before);await page.getByRole('button',{name:'Pause menu',exact:true}).click();await page.getByRole('button',{name:'Resume',exact:true}).click();
    const card=r.deck.find(c=>c.uid===r.battle.hand[0]);await page.keyboard.press('1');await page.keyboard.press('Enter');const after=await state();assert.equal(after.battle.energy,r.battle.energy-C.CARD[card.id].cost);assert.ok(!after.battle.hand.includes(card.uid));testedBattle=true;continue;
   }
   const a=B.decision(r);
   if(a.type==='node')await page.locator(`[data-node="${a.id}"]`).tap();
   else if(a.type==='play'){await page.locator(`.cp-hand [data-uid="${a.uid}"]`).tap();const d=C.CARD[C.ownedCard(r,a.uid).id];if(d.target==='enemy')await page.locator(`[data-enemy="${a.target}"]`).tap();else await page.getByRole('button',{name:'Play selected card',exact:true}).tap();}
   else if(a.type==='end')await page.getByRole('button',{name:'End turn',exact:true}).tap();
   else if(a.type==='reward'){if(a.id)await page.locator(`.cp-body > .cp-card-grid [data-card="${a.id}"]`).tap();else await page.getByRole('button',{name:'Skip card · Continue',exact:true}).tap();}
   else if(a.type==='camp'){if(a.action==='rest')await page.getByRole('button',{name:/^Rest · Heal/}).tap();else await page.locator(`.cp-body [data-uid="${a.uid}"]`).tap();}
   else if(a.type==='buy'){if(a.kind==='card')await page.locator('.cp-body > .cp-card-grid .cp-card').nth(a.index).tap();else if(a.kind==='relic')await page.getByRole('button',{name:'Buy relic · 135 gold',exact:true}).tap();else if(a.kind==='heal')await page.getByRole('button',{name:'Heal 20 · 35 gold',exact:true}).tap();else{await page.locator('.cp-remove-menu summary').click();await page.locator(`.cp-remove-menu [data-uid="${a.index}"]`).tap();}}
   else if(a.type==='leaveShop')await page.getByRole('button',{name:'Leave merchant',exact:true}).tap();
   else{const e=r.event;if(a.choice==='leave')await page.getByRole('button',{name:'Leave encounter',exact:true}).tap();else if(e.id==='cache')await page.getByRole('button',{name:a.choice==='gold'?'Take 50 gold':'Drink · Heal 12',exact:true}).tap();else if(e.id==='altar')await page.getByRole('button',{name:'Offer 9 health · Take relic',exact:true}).tap();else if(e.id==='archive'){if(a.choice==='card')await page.locator(`.cp-event-offer [data-card="${e.card}"]`).tap();else await page.getByRole('button',{name:'Restore the ink · Heal 12',exact:true}).tap();}else await page.locator(`.cp-body [data-uid="${a.uid}"]`).tap();}
   if(actions%40===0)console.log('Played',actions,'decisions; area',r.act+1,'stop',r.stage+1,r.phase);
  }
  assert.ok(result,'a full expedition must finish');assert.deepEqual([...visitedPhases].sort(),['battle','camp','event','map','reward','shop']);assert.equal(picturedAreas.size,3);assert.equal(await snap(),null);
  if(harness){assert.ok(result.extra[0].includes('dawn'),'fixture seed must win');assert.equal(result.completed,true);}else{const sessions=await page.evaluate(async()=>(await import('./js/store.js')).store.sessions().filter(s=>s.g==='cinderpath'));assert.equal(sessions.length,1);assert.equal(sessions[0].c,true);assert.equal(sessions[0].l,3);assert.match(await page.locator('.results-card').innerText(),/last ember becomes a new dawn/);}
  console.log('PASS full three-area expedition using real touch buttons and keyboard; all decision phases reload unchanged; deck/pause recovery; terminal checkpoint cleared');console.log(JSON.stringify({harness,actions,errors,requests}));assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
