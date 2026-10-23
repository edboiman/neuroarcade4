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
const games=[['blockfit','Block Fit'],['dungeon','Deep Delve'],['survivor','Holiday Horde'],['estate','Tycoon Row'],['cafe','Lingo'],['signal','Signal Junction'],['workshop','Clockwork Workshop'],['casebook','Casebook'],['echo','Echo Garden'],['logistics','Pocket Logistics']];
for(const [id,name]of games){
 try{
 await page.getByRole('button',{name:'Play '+name,exact:true}).click();
 if(await page.locator('.modal').count())throw Error('Unexpected game-entry confirmation');
 await page.locator('.game-overlay').waitFor();
 await page.locator('.game-overlay .go-actions .primary').click();
 if(id==='cafe')await page.getByRole('button',{name:'I already know these',exact:true}).click();
 if(id==='dungeon')await page.getByRole('button',{name:'I am ready',exact:true}).click();
 await page.waitForTimeout(id==='estate'?1800:650);
 if(id==='blockfit')await page.keyboard.press('ArrowDown');
 if(id==='signal')await page.getByRole('button',{name:'Track 2, junction 1: straight',exact:true}).click();
 if(id==='workshop')await page.getByRole('button',{name:'Conduit row 1, column 1',exact:true}).click();
 if(id==='casebook')await page.getByRole('button',{name:/Inspect Maintenance log/}).click();
 if(id==='logistics')await page.getByRole('button',{name:'Load',exact:true}).first().click();
 await shot(id+'-mobile');
 await page.getByRole('button',{name:'Pause menu',exact:true}).click();
 await page.getByRole('button',{name:'Save & leave',exact:true}).click();
 await page.locator('.arcade-header').waitFor();
 const card=page.locator('.game-card').filter({has:page.getByRole('heading',{name,exact:true})}).first();
 await card.getByRole('button',{name:'Continue →',exact:true}).click();
 await page.locator('.game-overlay .go-actions .primary').click();
 await page.waitForTimeout(200);
 await page.getByRole('button',{name:'Pause menu',exact:true}).click();
 await page.getByRole('button',{name:'Save & leave',exact:true}).click();
 await page.locator('.arcade-header').waitFor();
 console.log('PASS',name,'launch, input, pause, save, continue');
 }catch(e){console.log('FAIL',name,e.message.slice(0,400));console.log((await page.locator('body').innerText()).slice(-1200));throw e;}
}
await page.getByRole('button',{name:'Your room',exact:true}).click();await shot('collection-mobile');await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('switch',{name:'Larger text',exact:true}).click();await page.getByRole('switch',{name:'Reduce motion',exact:true}).click();await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Progress',exact:true}).click();await page.getByRole('heading',{name:'Progress',exact:true}).waitFor();console.log('PASS rendered progress');await shot('progress-mobile');await page.getByRole('button',{name:'Back',exact:true}).click();await page.locator('.arcade-header').waitFor();
console.log('PASS settings, collection, progress');
await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.locator('.arcade-header').waitFor();await context.setOffline(true);await page.reload();await page.locator('.arcade-header').waitFor();console.log('PASS offline reload');await context.setOffline(false);
const sub=await browser.newContext({viewport:{width:1440,height:1000}});const sp=await sub.newPage();sp.setDefaultTimeout(10000);await sp.goto(base+'/test-subpath/');await sp.locator('.arcade-header').waitFor();await sp.evaluate(async()=>{await navigator.serviceWorker.ready;});await sp.reload();await sp.locator('.arcade-header').waitFor();await sub.setOffline(true);await sp.reload();await sp.getByRole('button',{name:'Settings',exact:true}).click();await sp.getByRole('switch',{name:'Larger text',exact:true}).waitFor();console.log('PASS offline subpath hosting and Settings import');await sub.close();
console.log(JSON.stringify({errors,failRequests}));if(errors.length||failRequests.length)throw Error('Browser errors were recorded');
}finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
