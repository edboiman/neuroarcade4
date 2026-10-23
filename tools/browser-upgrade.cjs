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
  await page.goto(base);await page.locator('.card').first().waitFor();assert.equal(await page.locator('.card').count(),5);
  await page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('neuroarcade.v1')||'{}');data.onboarded=true;data.seenWeek=0;data.sessions=[{g:'blockfit',t:Date.now(),d:120,s:1234,l:2,a:null,c:true}];localStorage.setItem('neuroarcade.v1',JSON.stringify(data));});
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();
  await page.getByRole('heading',{name:'A new week begins',exact:true}).waitFor();
  console.log('Reproduced legacy installation: five games and blocking weekly entry dialog.');
  release='current';
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.getByRole('button',{name:'All games (10)',exact:true}).waitFor();
  assert.equal(await page.locator('.game-card').count(),10);assert.equal(await page.locator('[role="dialog"]').count(),0);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('neuroarcade.v1')).sessions[0].s),1234);
  console.log('PASS cached five-game install upgrades to ten games; entry gate removed; score preserved.');
  await page.getByRole('button',{name:'Play Block Fit',exact:true}).click();await page.locator('.game-overlay').waitFor();assert.equal(await page.locator('.modal').count(),0);
  await page.locator('.go-actions .primary').click();await page.locator('.bf canvas').waitFor();
  overrideVersion='fffffff001';
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.waitForTimeout(1700);assert.equal(await page.locator('.bf canvas').count(),1);
  console.log('PASS update preserves an active game instead of reloading mid-run.');
  await page.getByRole('button',{name:'Pause menu',exact:true}).click();await page.getByRole('button',{name:'Save & leave',exact:true}).click();
  await page.getByRole('button',{name:'All games (10)',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('neuroarcade.v1')).sessions[0].s),1234);
  assert.ok(await page.evaluate(()=>!!localStorage.getItem('neuroarcade.v1.save.blockfit')));
  console.log('PASS update completes after leaving the game; checkpoint and score preserved.');
  assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
