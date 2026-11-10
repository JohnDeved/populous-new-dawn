import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const [sourceRoot,out]=process.argv.slice(2);assert.ok(sourceRoot&&out);mkdirSync(out,{recursive:false});
const require=createRequire(resolve(sourceRoot,'package.json'));const {chromium}=require('@playwright/test');
const files=new Map([['/',readFileSync(new URL('./index.html',import.meta.url))],['/framebuffer.mjs',readFileSync(new URL('./framebuffer.mjs',import.meta.url))]]);
const report={status:'running',scope:'synthetic Canvas2D host fixture, not original game',files:Object.fromEntries([...files].map(([p,b])=>[p,createHash('sha256').update(b).digest('hex')])),errors:[],cleanup:[]};
let browser,context,server,failure;
try{
 server=createServer((req,res)=>{const data=files.get(req.url);res.writeHead(data?200:404,{'content-type':req.url==='/'?'text/html':'text/javascript'});res.end(data??'not found')});
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});
 const origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome',headless:true,chromiumSandbox:true,ignoreDefaultArgs:true,args:['--headless','--remote-debugging-pipe']});
 report.browserVersion=browser.version();context=await browser.newContext({viewport:{width:800,height:700},deviceScaleFactor:1,serviceWorkers:'block',acceptDownloads:false});
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await page.goto(origin);assert.equal(await page.locator('h1').textContent(),'Synthetic fixture, not Populous');
 await page.waitForFunction(()=>document.querySelector('canvas').getContext('2d').getImageData(10,10,1,1).data[3]===255);
 report.samples=await page.locator('canvas').evaluate(c=>[[10,10],[330,10],[10,250],[330,250]].map(([x,y])=>[...c.getContext('2d').getImageData(x,y,1,1).data]));
 assert.deepEqual(report.samples,[[18,32,51,255],[54,183,164,255],[225,171,63,255],[255,255,255,255]]);
 report.rgba_sha256=await page.locator('canvas').evaluate(async c=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',c.getContext('2d').getImageData(0,0,640,480).data))].map(x=>x.toString(16).padStart(2,'0')).join(''));
 assert.equal(report.rgba_sha256,'0879f72b9957ef5a5bae1435d55653411d32c7e7ef89bbbc1d91ed759aef2b9d');
 await page.locator('canvas').click({position:{x:200,y:150},modifiers:['Control','Alt']});
 report.input=JSON.parse(await page.locator('#log').textContent());assert.deepEqual(report.input,{type:'pointerDown',point:{x:200,y:150},ctrl:true,alt:true});
 await page.screenshot({path:resolve(out,'synthetic-framebuffer.png'),fullPage:true});assert.deepEqual(report.errors,[]);report.status='passed';
}catch(e){failure=e;report.status='failed';report.failure=String(e)}finally{
 for(const [label,close] of [['context',()=>context?.close()],['browser',()=>browser?.close()],['loopback server',()=>server?new Promise((ok,fail)=>server.close(e=>e?fail(e):ok())):undefined]])try{await close();report.cleanup.push(`${label} closed or not created`)}catch(e){report.errors.push(`${label}: ${e}`);report.status='failed';failure??=e}
 writeFileSync(resolve(out,'receipt.json'),JSON.stringify(report,null,2));
}if(failure)throw failure;
