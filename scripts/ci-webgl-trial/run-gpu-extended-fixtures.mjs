import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const [sourceRoot,out]=process.argv.slice(2);assert.ok(sourceRoot&&out);mkdirSync(out,{recursive:false});
const require=createRequire(resolve(sourceRoot,'package.json'));
const {chromium}=require('@playwright/test');
const threeRoot=resolve(dirname(require.resolve('three')),'..');
assert.equal(JSON.parse(readFileSync(resolve(threeRoot,'package.json'))).version,'0.185.1');
const files=new Map([
 ['/',Buffer.from('<!doctype html><link rel="icon" href="data:,"><script type="module" src="/gpu-extended-fixtures.mjs"></script>')],
 ['/gpu-extended-fixtures.mjs',readFileSync(new URL('./gpu-extended-fixtures.mjs',import.meta.url))],
 ['/extended-fixture-scene.mjs',readFileSync(new URL('./extended-fixture-scene.mjs',import.meta.url))],
 ['/three.module.js',readFileSync(resolve(threeRoot,'build/three.module.js'))],
 ['/three.core.js',readFileSync(resolve(threeRoot,'build/three.core.js'))]
]);
const inputs=Object.fromEntries(['run-gpu-extended-fixtures.mjs','extended-fixture-scene.mjs','extended-cpu-pixels.json','rgba8-extended-cpu-pixels.json'].map(n=>[n,createHash('sha256').update(readFileSync(new URL(n,import.meta.url))).digest('hex')]));
const report={status:'running',inputs,files:Object.fromEntries([...files].map(([p,b])=>[p,createHash('sha256').update(b).digest('hex')])),errors:[],warnings:[],cleanup:[]};
let browser,context,server,failure;
try{
 server=createServer((req,res)=>{const data=files.get(req.url);res.writeHead(data?200:404,{'content-type':req.url==='/'?'text/html':'text/javascript'});res.end(data??'not found')});
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});
 const origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome',headless:true,chromiumSandbox:true,ignoreDefaultArgs:true,args:['--headless','--remote-debugging-pipe']});
 report.browserVersion=browser.version();
 context=await browser.newContext({viewport:{width:64,height:64},deviceScaleFactor:1,serviceWorkers:'block',acceptDownloads:false});
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const page=await context.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text())});
 await page.goto(origin);await page.waitForFunction(()=>window.fixtureResult);
 const result=await page.evaluate(()=>window.fixtureResult);assert.match(result.device,/SwiftShader/i);assert.equal(result.revision,'185');
 assert.deepEqual(result.results.map(x=>x.kind),['colored-normal','colored-additive','overflow-then-normal','texture-nearest','texture-linear']);

 report.device=result.device;report.limits=result.limits;report.comparisons=[];
 for(const sample of result.results){

  const cpuPixels=JSON.parse(readFileSync(new URL('./extended-cpu-pixels.json',import.meta.url)))[sample.kind];assert.equal(cpuPixels.length,1024);assert.equal(sample.pixels.length,1024);let maxDiff=0,differingChannels=0;
  for(let i=0;i<1024;i++){const target=cpuPixels[i];const d=Math.abs(sample.pixels[i]-target);maxDiff=Math.max(maxDiff,d);if(d)differingChannels++;}
  writeFileSync(resolve(out,`${sample.kind}-gpu.png`),Buffer.from(sample.image.split(',')[1],'base64'));
  const rgba8=JSON.parse(readFileSync(new URL('./rgba8-extended-cpu-pixels.json',import.meta.url)))[sample.kind];assert.equal(rgba8.length,1024);let rgba8MaxDiff=0,rgba8DifferingChannels=0;for(let i=0;i<1024;i++){const d=Math.abs(sample.pixels[i]-rgba8[i]);rgba8MaxDiff=Math.max(rgba8MaxDiff,d);if(d)rgba8DifferingChannels++;}
  report.comparisons.push({rgba8Center:rgba8.slice(544,548),rgba8MaxDiff,rgba8DifferingChannels,kind:sample.kind,gpuCenter:sample.pixels.slice(544,548),cpuCenter:cpuPixels.slice(544,548),maxDiff,differingChannels,allPixelsCompared:256});

 }
 assert.deepEqual(report.errors,[]);report.status='diagnostic-completed-awaiting-independent-review';
}catch(error){failure=error;report.status='failed';report.failure=String(error)}finally{
 const cleanupErrors=[];
 for(const [label,close] of [
  ['context',()=>context?.close()],['browser',()=>browser?.close()],
  ['loopback server',()=>server?new Promise((done,fail)=>server.close(e=>e?fail(e):done())):undefined]
 ]){try{await close();report.cleanup.push(`${label} closed or not created`)}catch(error){cleanupErrors.push(error);report.errors.push(`${label} cleanup: ${error}`)}}
 if(cleanupErrors.length){report.status='failed';failure=new AggregateError([...(failure?[failure]:[]),...cleanupErrors],'Fixture failure or cleanup failure')}
 writeFileSync(resolve(out,'receipt.json'),JSON.stringify(report,null,2));
}
if(failure)throw failure;
