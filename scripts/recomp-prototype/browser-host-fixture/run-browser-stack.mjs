import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const [sourceRoot,out]=process.argv.slice(2);assert.ok(sourceRoot&&out);mkdirSync(out,{recursive:false});
const require=createRequire(resolve(sourceRoot,'package.json'));const {chromium}=require('@playwright/test');
const files=new Map([['/',readFileSync(new URL('./stack-index.html',import.meta.url))],...['browser-stack-test.mjs','browser-stack-worker.mjs','stack-seam.mjs'].map(f=>['/'+f,readFileSync(new URL('./'+f,import.meta.url))])]);
const report={status:'running',scope:'synthetic nested WASM in browser Worker; not original game or pthread build',files:Object.fromEntries([...files].map(([p,b])=>[p,createHash('sha256').update(b).digest('hex')])),errors:[],cleanup:[]};
let browser,context,server,failure;
try{
 server=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');const data=files.get(url.pathname);
  const headers={'content-type':url.pathname==='/'?'text/html':'text/javascript'};
  if(!url.searchParams.has('nonisolated'))Object.assign(headers,{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'});
  res.writeHead(data?200:404,headers);res.end(data??'not found');
 });
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});
 const origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome',headless:true,chromiumSandbox:true,ignoreDefaultArgs:true,args:['--headless','--remote-debugging-pipe']});
 report.browserVersion=browser.version();context=await browser.newContext({serviceWorkers:'block',acceptDownloads:false});
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await page.goto(origin);await page.waitForFunction(()=>typeof window.runStackTest==='function');
 report.normal=await page.evaluate(()=>window.runStackTest());assert.equal(report.normal.status,'passed');assert.equal(report.normal.value,25);assert.equal(report.normal.waitResult,'ok');
 report.normalCleanup=await page.evaluate(()=>window.__lastStackCleanup);assert.deepEqual(report.normalCleanup,{terminationRequested:true,hasPendingTimers:false});
 report.waitTimeout=await page.evaluate(async()=>{try{await window.runStackTest({notify:false});return {unexpectedSuccess:true};}catch(e){return {error:String(e),cleanup:window.__lastStackCleanup};}});
 assert.match(report.waitTimeout.error,/bounded wait timed out/);assert.deepEqual(report.waitTimeout.cleanup,{terminationRequested:true,hasPendingTimers:false});
 await page.goto(origin+'/?nonisolated=1');await page.waitForFunction(()=>typeof window.runStackTest==='function');
 report.nonisolated=await page.evaluate(()=>window.runStackTest());assert.equal(report.nonisolated.status,'unsupported');assert.equal(report.nonisolated.support.crossOriginIsolated,false);
 assert.deepEqual(report.errors,[]);report.status='passed';
}catch(e){failure=e;report.status='failed';report.failure=String(e);}finally{
 for(const [label,close] of [['context',()=>context?.close()],['browser',()=>browser?.close()],['loopback server',()=>server?new Promise((ok,fail)=>server.close(e=>e?fail(e):ok())):undefined]])try{await close();report.cleanup.push(`${label} closed or not created`);}catch(e){report.errors.push(`${label}: ${e}`);report.status='failed';failure??=e;}
 writeFileSync(resolve(out,'receipt.json'),JSON.stringify(report,null,2));
}if(failure)throw failure;
