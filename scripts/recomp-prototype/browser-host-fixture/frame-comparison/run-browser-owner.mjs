import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const [sourceRoot,out]=process.argv.slice(2);assert.ok(sourceRoot&&out);mkdirSync(out,{recursive:false});
const require=createRequire(resolve(sourceRoot,'package.json'));const {chromium}=require('@playwright/test');
const prefix='/browser-host-fixture/frame-comparison/';
const files=new Map([['/',readFileSync(new URL('./browser-owner-index.html',import.meta.url))],...['browser-owner-test.mjs','browser-owner-worker.mjs','owner-core.mjs','capture-surface.mjs','normalize-surface.mjs'].map(f=>[prefix+f,readFileSync(new URL('./'+f,import.meta.url))]),['/browser-boundary-fixture/guest-memory.mjs',readFileSync(new URL('../../browser-boundary-fixture/guest-memory.mjs',import.meta.url))]]);
const report={status:'running',scope:'authored synthetic browser surface ownership only, no original game',files:Object.fromEntries([...files].map(([p,b])=>[p,createHash('sha256').update(b).digest('hex')])),errors:[],cleanup:[]};
let browser,context,server,failure;
try{
 server=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),data=files.get(url.pathname);
  const headers={'content-type':url.pathname==='/'?'text/html':'text/javascript'};
  if(!url.searchParams.has('nonisolated'))Object.assign(headers,{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'});
  res.writeHead(data?200:404,headers);res.end(data??'not found');
 });
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});
 const origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome',headless:true,chromiumSandbox:true,ignoreDefaultArgs:true,args:['--headless','--remote-debugging-pipe']});
 report.browserVersion=browser.version();assert.equal(report.browserVersion,'156.0.8078.79');context=await browser.newContext({serviceWorkers:'block',acceptDownloads:false});
 await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 for(const isolated of [true,false]){
  await page.goto(origin+(isolated?'':'/?nonisolated=1'));await page.waitForFunction(()=>typeof window.runOwnerTest==='function');
  const result=await page.evaluate(()=>window.runOwnerTest());
  assert.equal(result.crossOriginIsolated,isolated);assert.equal(result.frames,4);assert.equal(result.exactCanvasBytes,true);assert.equal(result.terminationRequested,true);
  assert.equal(result.sharedInputControl,isolated?'both rejected':'unavailable, not tested');
  report[isolated?'isolated':'nonisolated']=result;
 }
 await page.screenshot({path:resolve(out,'synthetic-owner.png')});assert.deepEqual(report.errors,[]);report.status='passed';
}catch(e){failure=e;report.status='failed';report.failure=String(e);}finally{
 for(const [name,close] of [['context',()=>context?.close()],['browser',()=>browser?.close()],['loopback server',()=>server?new Promise((ok,fail)=>server.close(e=>e?fail(e):ok())):undefined]])try{await close();report.cleanup.push(name+' closed or not created');}catch(e){report.errors.push(name+': '+e);report.status='failed';failure??=e;}
 writeFileSync(resolve(out,'receipt.json'),JSON.stringify(report,null,2));
}if(failure)throw failure;
