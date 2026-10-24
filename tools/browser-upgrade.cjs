// Regression: a cached five-game installation must migrate without clearing progress.
// LEGACY_APP_DIR points to the extracted previous release. No fixture is shipped to phones.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const current=path.resolve(__dirname,'..'),legacy=process.env.LEGACY_APP_DIR;
if(!legacy)throw Error('Set LEGACY_APP_DIR to the extracted five-game release.');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.woff':'font/woff','.webmanifest':'application/manifest+json'};
(async()=>{
 let release='legacy',overrideVersion=null;
 const server=http.createServer((req,res)=>{
  let name=decodeURIComponent(req.url.split('?')[0]);
  if(!name.startsWith('/arcade/')){res.writeHead(404);res.end();return;}
  name=name.slice('/arcade/'.length)||'index.html';const root=release==='legacy'?legacy:current,file=path.resolve(root,name);
  if(!file.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}
   if(name==='sw.js'&&overrideVersion)data=Buffer.from(data.toString().replace(/const VERSION = '[^']+';/,`const VERSION = '${overrideVersion}';`));
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);
  });
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/arcade/';
 let browser;try{
  browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-software-rasterizer','--no-zygote'],headless:true});
  const context=await browser.newContext({viewport:{width:412,height:915}}),page=await context.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);if(process.env.LEGACY_IS_V2){await page.locator('.game-card').first().waitFor();assert.equal(await page.locator('.game-card').count(),Number(process.env.LEGACY_GAME_COUNT||10));}else{await page.locator('.card').first().waitFor();assert.equal(await page.locator('.card').count(),5);}
  await page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('neuroarcade.v1')||'{}');data.onboarded=true;data.seenWeek=0;data.sessions=[{g:'blockfit',t:Date.now(),d:120,s:1234,l:2,a:null,c:true},{g:'dungeon',t:Date.now()-1000,d:120,s:987,l:3,a:null,c:true},{g:'cafe',t:Date.now()-2000,d:120,s:765,l:2,a:.9,c:true}];data.skills={cafe_es:{rung:2,box:{coffee:3},reviews:{coffee:{due:Date.now(),interval:7,last:Date.now()-86400000}}}};data.prefs={cafe:{lang:1,scene:3}};localStorage.setItem('neuroarcade.v1.save.cafe',JSON.stringify({version:2,saved:Date.now(),state:{seed:37},meta:{mode:'standard'}}));localStorage.setItem('neuroarcade.v1.save.dungeon',JSON.stringify({version:2,saved:Date.now(),state:{seed:44},meta:{mode:'standard'}}));localStorage.setItem('neuroarcade.v1',JSON.stringify(data));});
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();
  if(!process.env.LEGACY_IS_V2)await page.getByRole('heading',{name:'A new week begins',exact:true}).waitFor();
  console.log(process.env.LEGACY_IS_V2?'Loaded the previous arcade installation.':'Reproduced legacy installation: five games and blocking weekly entry dialog.');
  release='current';
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.getByRole('button',{name:'Games (12)',exact:true}).waitFor();
  assert.equal(await page.locator('.game-card').count(),12);assert.equal(await page.locator('[role="dialog"]').count(),0);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('neuroarcade.v1')).sessions.find(s=>s.g==='blockfit').s),1234);
  assert.equal(await page.getByRole('button',{name:'Play Deep Delve',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Play Lingo',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Learn',exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('neuroarcade.v1')).sessions.find(s=>s.g==='cafe')?.s),765);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('neuroarcade.v1')).skills.cafe_es.box.coffee),3);
  assert.ok(await page.evaluate(()=>localStorage.getItem('neuroarcade.v1.save.cafe')));

  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('neuroarcade.v1')).sessions.find(s=>s.g==='dungeon')?.s),987);
  assert.ok(await page.evaluate(()=>localStorage.getItem('neuroarcade.v1.save.dungeon')));
  await page.getByRole('button',{name:'Progress',exact:true}).click();await page.getByRole('heading',{name:'Progress',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:/Deep Delve|Lingo/}).count(),0);await page.getByRole('button',{name:'Back',exact:true}).click();await page.locator('.arcade-header').waitFor();
  await page.evaluate(()=>{const state={s:'game',p:{id:'dungeon',resume:true}};history.pushState(state,'');window.dispatchEvent(new PopStateEvent('popstate',{state}));});await page.locator('.arcade-header').waitFor();
  await page.evaluate(()=>{const state={s:'game',p:{id:'cafe',resume:true}};history.pushState(state,'');window.dispatchEvent(new PopStateEvent('popstate',{state}));});await page.locator('.arcade-header').waitFor();
  console.log('PASS twelve-game update removes retired game routes, cards, and progress rows; earlier scores and checkpoints preserved.');
  await page.getByRole('button',{name:'Play Block Fit',exact:true}).click();await page.locator('.game-overlay').waitFor();assert.equal(await page.locator('.modal').count(),0);
  await page.locator('.go-actions .primary').click();await page.locator('.bf canvas').waitFor();
  overrideVersion='fffffff001';
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.waitForTimeout(1700);assert.equal(await page.locator('.bf canvas').count(),1);
  console.log('PASS update preserves an active game instead of reloading mid-run.');
  await page.getByRole('button',{name:'Pause menu',exact:true}).click();await page.getByRole('button',{name:'Save & leave',exact:true}).click();
  await page.getByRole('button',{name:'Games (12)',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('neuroarcade.v1')).sessions.find(s=>s.g==='blockfit').s),1234);
  assert.ok(await page.evaluate(()=>!!localStorage.getItem('neuroarcade.v1.save.blockfit')));
  console.log('PASS update completes after leaving the game; checkpoint and score preserved.');
  assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
