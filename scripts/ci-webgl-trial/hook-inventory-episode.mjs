import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
export async function runHookInventoryEpisode({browser,sourceRoot,output,expectedCommit}){
 assert.equal(expectedCommit,'3f73fdbcb630604049658f42a896db1fe1304aef');mkdirSync(output,{recursive:false});
 const files=new Map([['/__cpu_inventory_probe/inventory.mjs',readFileSync(new URL('./runtime-hook-inventory.mjs',import.meta.url),'utf8')]]);
 const report={status:'running',expectedCommit,images:[],errors:[],warnings:[],cleanup:[],probeFiles:Object.fromEntries([...files].map(([k,v])=>[k,createHash('sha256').update(v).digest('hex')]))};
 const save=()=>writeFileSync(resolve(output,'receipt.json'),JSON.stringify(report,null,2));let context,failure;
 try{
  context=await browser.newContext({viewport:{width:960,height:640},deviceScaleFactor:1,serviceWorkers:'block',acceptDownloads:false});
  await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!=='http://127.0.0.1:5198'){report.errors.push('Unexpected external request');return route.abort()}if(files.has(url.pathname))return route.fulfill({status:200,contentType:'text/javascript',body:files.get(url.pathname)});return route.continue()});
  const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text())});
  const {bindGame}=await import(pathToFileURL(resolve(sourceRoot,'scripts/browser-game.mjs'))),{openCampaignFromMainMenu}=await import(pathToFileURL(resolve(sourceRoot,'scripts/browser-new-game.mjs')));
  const response=await page.goto('http://127.0.0.1:5198/');assert.equal(response.status(),200);await openCampaignFromMainMenu(page);await page.getByRole('button',{name:'Start Mission 1',exact:true}).click();await bindGame(page);
  await page.waitForFunction(()=>window.testStore.getWorld().flyby.flags&1||!window.testStore.getWorld().inputMask);
  if(await page.evaluate(()=>!!window.testStore.getWorld().inputMask))await page.getByRole('button',{name:/Skip introduction/}).click();await page.waitForFunction(()=>!window.testStore.getWorld().inputMask);
  // Pinned page.tsx openMenu owns both pause and modal suspension.
  await page.getByRole('button',{name:'Menu',exact:true}).click();await page.waitForFunction(()=>window.testStore.getWorld().paused);await page.getByRole('dialog',{name:'Game menu',exact:true}).waitFor();await page.waitForFunction(()=>window.testSceneRef.current.modalSuspended);
  report.observedRenderer=await page.evaluate(()=>{const gl=window.testSceneRef.current.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)});assert.match(report.observedRenderer,/SwiftShader/i);
  const shot=async name=>{const bytes=await page.screenshot({type:'png',fullPage:false,timeout:15000});assert.ok(bytes.length<12*1024*1024);writeFileSync(resolve(output,name),bytes);report.images.push({name,sha256:createHash('sha256').update(bytes).digest('hex'),renderer:report.observedRenderer,scope:'Instrumented pinned game WebGL hook inventory, NOT CPU renderer'});};
  await shot('before-hook-inventory-gpu.png');
  report.inventory=await page.evaluate(async()=>{
   const {createRuntimeHookInventory}=await import('/__cpu_inventory_probe/inventory.mjs');
   const game=window.testSceneRef.current,world=window.testStore.getWorld(),probe=globalThis.__cpuHookProbe;
   if(!probe)throw new Error('Reviewed creation-site hook probe missing');
   const collect=createRuntimeHookInventory();
   const args={scene:game.scene,camera:game.camera,world,modalSuspended:game.modalSuspended,pendingSoundEnvironment:game.view.painter.pendingSoundEnvironment,probe};
   const beforeHeap=performance.memory?.usedJSHeapSize??null,start=performance.now();
   const first=collect(args),second=collect(args);
   if(JSON.stringify(first)!==JSON.stringify(second))throw new Error('Synchronous metadata inventory changed');
   return{...first,elapsedMs:performance.now()-start,beforeHeap,afterHeap:performance.memory?.usedJSHeapSize??null,serializedMetadataEquality:true,limits:['Instrumented pinned app build. Read-only inventory, no manual render/callback/compile/bounds generation, byte snapshots or CPU scene. Serialized equality treats -0 and +0 alike; does not establish exact numeric/byte identity or ordinary-frame delta permissions.']};
  });
  await shot('after-hook-inventory-gpu.png');
  report.sameScreenshotBytes=report.images[0].sha256===report.images[1].sha256;assert.deepEqual(report.errors,[]);report.status='passed-awaiting-pixel-review';
 }catch(error){failure=error;report.status='failed';report.failure=String(error)}finally{try{if(context){await context.close();report.cleanup.push('fresh context closed')}}catch(error){report.status='failed';report.errors.push('context cleanup: '+String(error));failure=failure?new AggregateError([failure,error],'Episode and cleanup failed'):error}save()}
 if(failure)throw failure;return report;
}
