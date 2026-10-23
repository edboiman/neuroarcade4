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
for(const name of ['Marbleworks','Bannerfall']){await page.getByRole('button',{name:'Play '+name,exact:true}).click();await page.locator('.game-overlay').waitFor();await page.goBack();await page.locator('.arcade-header').waitFor();}
console.log('PASS leaving setup returns directly to Games');
// Exercise full build rendering and action dialogs in addition to the twelve-game smoke suite.
await page.evaluate(async()=>{
 const {store}=await import('./js/store.js'),{snapshot}=await import('./js/checkpoint.js'),S=await import('./js/games/survivor-core.js');
 const r=S.createRun(419,{modern:true,duration:600});r.hero.hp=r.hero.maxHp=500;r.season='halloween';
 for(const k of Object.keys(S.UPGRADES))r.up[k]=Math.min(3,S.UPGRADES[k].max);
 for(const k of Object.keys(S.EVOLUTIONS)){r.up[k]=S.UPGRADES[k].max;const e=S.EVOLUTIONS[k];r.up[e.need]=Math.max(e.rank,r.up[e.need]);S.openChest(r);}
 for(let i=0;i<3000;i++){r.pending=0;r.milestone=0;S.step(r,1/60,{x:Math.cos(i/100),y:Math.sin(i/100)});r.events=[];}
 r.pending=0;r.milestone=0;store.saveGame('survivor',snapshot(r,{heroClass:0,theme:0,mode:'standard'}));
});
await page.reload();
let card=page.locator('.game-card').filter({has:page.getByRole('heading',{name:'Holiday Horde',exact:true})});await card.getByRole('button',{name:'Continue →',exact:true}).click();await page.getByRole('button',{name:'Continue run',exact:true}).click();await page.waitForTimeout(250);
await page.locator('.sv-build .evolved').first().waitFor();if(await page.locator('.sv-build .evolved').count()!==5)throw Error('Missing evolution in live build HUD');
await shot('horde-arsenal-mobile');await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');await page.getByRole('button',{name:'Pause menu',exact:true}).click();await page.getByRole('button',{name:'Save & leave',exact:true}).click();
await page.evaluate(async()=>{
 const C=await import('./js/games/conquest-core.js'),{store}=await import('./js/store.js'),{snapshot}=await import('./js/checkpoint.js');const r=C.createRun(52);r.owner[0]=0;r.owner[1]=1;r.armies[0]=30;r.armies[1]=1;r.phase='attack';r.reserve=0;store.saveGame('conquest',snapshot(r,{mode:'standard'}));
});
await page.reload();card=page.locator('.game-card').filter({has:page.getByRole('heading',{name:'Bannerfall',exact:true})});await card.getByRole('button',{name:'Continue →',exact:true}).click();await page.getByRole('button',{name:'Continue campaign',exact:true}).click();
await page.getByRole('button',{name:/^Pinewatch:/}).click();await page.getByRole('button',{name:/^Frostholm:/}).click();await page.getByRole('button',{name:'Blitz battle',exact:true}).click();await page.getByRole('button',{name:/^Advance \d+ more troops$/}).click();
await page.getByRole('button',{name:'Rules & continent bonuses',exact:true}).click();await page.getByRole('button',{name:'Back to campaign',exact:true}).click();await shot('bannerfall-battle-mobile');await page.getByRole('button',{name:'Pause menu',exact:true}).click();await page.getByRole('button',{name:'Save & leave',exact:true}).click();
await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Play Bannerfall',exact:true}).click();await page.locator('.go-actions .primary').click();await shot('bannerfall-desktop');await page.getByRole('button',{name:'Pause menu',exact:true}).click();await page.getByRole('button',{name:'Save & leave',exact:true}).click();
await page.getByRole('button',{name:'Play Marbleworks',exact:true}).click();await page.locator('.go-actions .primary').click();await page.getByRole('button',{name:'Free build',exact:true}).click();await page.getByRole('button',{name:/Air lift/}).click();const box=await page.locator('.mw-canvas').boundingBox();await page.mouse.click(box.x+300/900*box.width,box.y+400/560*box.height);await shot('marbleworks-desktop');
console.log('PASS live evolved arsenal, conquest dice and advance, rules, mobile/desktop layouts, free build');
console.log(JSON.stringify({errors,failRequests}));if(errors.length||failRequests.length)throw Error('Browser errors were recorded');
}finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
