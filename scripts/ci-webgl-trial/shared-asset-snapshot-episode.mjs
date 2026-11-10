import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
export async function runSharedAssetEpisode({browser,sourceRoot,output,expectedCommit}){
 assert.equal(expectedCommit,'1f76849ea332c1328553f13f4819d46f92f82ee7');mkdirSync(output,{recursive:false});
 const require=createRequire(resolve(sourceRoot,'package.json')),threeRoot=resolve(dirname(require.resolve('three')),'..');
 const files=new Map([
  ['/__cpu_asset_probe/store.mjs',readFileSync(new URL('./shared-texture-snapshot.mjs',import.meta.url),'utf8').replace("from 'three'","from './three.module.js'")],
  ['/__cpu_asset_probe/read.mjs',readFileSync(new URL('./read-asset-image-pixels.mjs',import.meta.url),'utf8')],
  ['/__cpu_asset_probe/three.module.js',readFileSync(resolve(threeRoot,'build/three.module.js'),'utf8')],
  ['/__cpu_asset_probe/three.core.js',readFileSync(resolve(threeRoot,'build/three.core.js'),'utf8')]
 ]);
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
  await page.getByRole('button',{name:'Pause game',exact:true}).click();await page.waitForFunction(()=>window.testStore.getWorld().paused);await page.getByRole('button',{name:'Game settings',exact:true}).click();await page.getByRole('dialog',{name:'Game menu',exact:true}).waitFor();await page.waitForFunction(()=>window.testSceneRef.current.modalSuspended);
  report.observedRenderer=await page.evaluate(()=>{const gl=window.testSceneRef.current.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)});assert.match(report.observedRenderer,/SwiftShader/i);
  const shot=async name=>{const bytes=await page.screenshot({type:'png',fullPage:false,timeout:15000});assert.ok(bytes.length<12*1024*1024);writeFileSync(resolve(output,name),bytes);report.images.push({name,sha256:createHash('sha256').update(bytes).digest('hex'),renderer:report.observedRenderer,scope:'Real pinned game WebGL, NOT CPU renderer'});};
  await shot('before-asset-snapshot-gpu.png');
  report.snapshot=await page.evaluate(async()=>{
   const {createTextureSnapshotStore}=await import('/__cpu_asset_probe/store.mjs'),{readAssetImagePixels}=await import('/__cpu_asset_probe/read.mjs');
   const game=window.testSceneRef.current,world=window.testStore.getWorld();if(!world.paused||!game.modalSuspended)throw new Error('Require public paused/suspended game');
   const turn=world.turn,found=new Map();let objects=0;
   const inspect=t=>{if(!t?.isTexture)return;const i=t.image;if((i?.width===4096&&i?.height===4096)||(i?.width===2048&&i?.height===8192))found.set(t.source,t)};
   game.scene.traverse(o=>{if(++objects>5000)throw new Error('Scene scan bound');for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m)continue;inspect(m.map);for(const u of Object.values(m.uniforms??{}))inspect(u.value);for(const u of Object.values(m.userData?.nativeUniforms??{}))inspect(u.value)}});for(const u of Object.values(game.view.uniforms))inspect(u.value);
   if(found.size!==2)throw new Error('Expected exactly two known large atlas sources');
   const terrain=game.terrainMap;
   if(!terrain?.isDataTexture||terrain.image.width!==4096||terrain.image.height!==4096||terrain.image.data!==game.terrainAtlasState?.pixels||!found.has(terrain.source)||game.terrainMapVersion!==world.landVersion)throw new Error('Named current generated terrain atlas not verified');
   const sprite=[...found.values()].find(t=>t!==terrain),image=sprite?.image;
   if(!(image instanceof HTMLImageElement)||!image.complete||image.width!==2048||image.height!==8192||image.naturalWidth!==2048||image.naturalHeight!==8192)throw new Error('Loaded unscaled sprite atlas image required');
   const spriteUrl=new URL(image.currentSrc),allowedPaths=['/original/unit-layers.png'];
   if(spriteUrl.origin!==location.origin||!allowedPaths.includes(spriteUrl.pathname)||spriteUrl.search||spriteUrl.hash)throw new Error('Unreviewed sprite atlas URL: '+spriteUrl.href);
   const landVersion=world.landVersion,terrainVersion=game.terrainMapVersion;
   const heap=()=>performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit}:null;
   const before=heap(),start=performance.now(),store=createTextureSnapshotStore({maxBytes:128*1024*1024,maxClones:66,readImagePixels:readAssetImagePixels});
   const original=[...found.values()].map(t=>({t,source:t.source,image:t.image,sv:t.source.version,tv:t.version,offset:t.offset.toArray(),repeat:t.repeat.toArray()}));
   let result;
   try{
    for(const t of found.values())await store.admitImmutable(t,{stableDuringCapture:true});
    for(const t of found.values())for(let i=0;i<33;i++)store.clone(t);
    store.verifySources();for(const s of original)if(s.t.source!==s.source||s.t.image!==s.image||s.t.source.version!==s.sv||s.t.version!==s.tv||s.t.offset.toArray().toString()!==s.offset.toString()||s.t.repeat.toArray().toString()!==s.repeat.toString())throw new Error('Source identity/version/transform changed');
    if(game.terrainMap!==terrain||terrain.image.data!==game.terrainAtlasState.pixels||world.landVersion!==landVersion||game.terrainMapVersion!==terrainVersion||world.turn!==turn||!world.paused||!game.modalSuspended)throw new Error('Game pause state changed');
    result={stats:store.stats(),elapsedMs:performance.now()-start,heapBefore:before,heapRetained:heap(),turn,assets:original.map(s=>({width:s.image.width,height:s.image.height,dataTexture:s.t.isDataTexture===true,textureUUID:s.t.uuid,sourceUUID:s.source.uuid,textureVersion:s.tv,sourceVersion:s.sv,sourceIdentity:s.t===terrain?'game.terrainMap -> game.terrainAtlasState.pixels':spriteUrl.href})),landVersion,terrainVersion,sourceIdentityVerified:true};
   }finally{store.dispose()}
   return{...result,statsAfterDispose:store.stats(),heapAfterDispose:heap(),limits:['Real pinned game atlas copies only, not CPU scene rendering. Pixel budget excludes temporary Canvas2D/decoder copies and browser memory. JS heap snapshots are not process RSS or leak proof; DOM asset verification is metadata-only under trusted stable-asset contract.']};
  });
  assert.equal(report.snapshot.stats.copiedBytes,128*1024*1024);assert.equal(report.snapshot.stats.sourceCount,2);assert.equal(report.snapshot.stats.cloneCount,66);assert.equal(report.snapshot.statsAfterDispose.copiedBytes,0);await shot('after-asset-snapshot-gpu.png');
  report.sameScreenshotBytes=report.images[0].sha256===report.images[1].sha256;assert.deepEqual(report.errors,[]);report.status='passed-awaiting-pixel-review';
 }catch(error){failure=error;report.status='failed';report.failure=String(error)}finally{try{if(context){await context.close();report.cleanup.push('fresh context closed')}}catch(error){report.status='failed';report.errors.push('context cleanup: '+String(error));failure=failure?new AggregateError([failure,error],'Episode and cleanup failed'):error}save()}
 if(failure)throw failure;return report;
}
