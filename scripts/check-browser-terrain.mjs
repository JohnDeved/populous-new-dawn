// Start npm run dev, then: node scripts/check-browser-terrain.mjs
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.POPULOUS_URL??'http://localhost:3000',{waitUntil:'networkidle'});
 await page.waitForSelector('.world-viewport canvas');
 await page.evaluate(()=>{
  let f=document.querySelector('main');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];
  for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.current?.unitMeshes)window.testScene=h.memoizedState.current;
  const s=window.testScene;s.world.flyby.flags=0;s.world.inputMask=0;s.world.paused=false;s.focus({x:2,z:30});
 });
 await page.waitForFunction(()=>{const s=window.testScene;return s.terrainTextures&&s.world.landVersion>=0&&s.terrainMapVersion===s.world.landVersion;});
 await page.screenshot({path:'/private/tmp/populous-terrain-after.png'});
 assert.ok(await page.evaluate(()=>{
  const s=window.testScene,r=s.renderer,gl=r.getContext();r.render(s.scene,s.camera);
  const pixels=new Uint8Array(4*gl.drawingBufferWidth*gl.drawingBufferHeight);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  let ground=0;for(let y=gl.drawingBufferHeight*.4|0;y<gl.drawingBufferHeight*.6;y++)for(let x=gl.drawingBufferWidth*.35|0;x<gl.drawingBufferWidth*.65;x++){
   const i=(y*gl.drawingBufferWidth+x)*4;if(pixels[i]>45&&pixels[i+1]>45&&pixels[i+2]>20)ground++;
  }return ground>1000;
 }),'native terrain texture reaches actual GPU pixels');
 await page.evaluate(()=>{
  const s=window.testScene,w=s.world,u=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');
  Object.assign(u,{x:0,z:20,path:[],casting:null});w.selected=[u.id];w.shots.bridge=1;w.speed=3;s.focus({x:0,z:14});
  window.terrainBefore=s.terrainMap.image.data.slice();window.versionBefore=w.terrainVersion;
  window.tileUpdates=[];const update=s.updateTerrainTexture.bind(s);s.updateTerrainTexture=()=>{const old=s.terrainAtlasState;update();if(old!==s.terrainAtlasState)window.tileUpdates.push(s.terrainAtlasState.updated);};
 });
 await page.keyboard.press('2');
 await page.waitForFunction(()=>window.testScene.world.mode==='bridge');
 await page.waitForTimeout(100);
 const target=await page.evaluate(()=>{const s=window.testScene,p=s.screen({x:0,z:4}),r=s.renderer.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};});
 await page.mouse.click(target.x,target.y);
 await page.waitForFunction(()=>window.testScene.world.shots.bridge===0,{},{timeout:3000});
 await page.waitForFunction(()=>{
  const s=window.testScene,w=s.world;return w.stats.bridges>0&&!w.effects.some(f=>f.bridge)&&w.landVersion===w.terrainVersion&&s.terrainMapVersion===w.landVersion;
 },{},{timeout:15000});
 const result=await page.evaluate(()=>{
  const s=window.testScene,w=s.world;w.paused=true;let changed=0;
  s.terrainMap.image.data.forEach((v,i)=>{if(v!==window.terrainBefore[i])changed++;});
  return {changed,version:w.terrainVersion,before:window.versionBefore,updates:window.tileUpdates};
 });
 assert.ok(result.changed>1000);assert.ok(result.version>result.before);assert.ok(result.updates.some(n=>n>0)&&result.updates.every(n=>n<16384));
 await page.screenshot({path:'/private/tmp/populous-terrain-bridge.png'});
 // A shade update without a terrain-height version change still refreshes.
 await page.evaluate(()=>{const s=window.testScene,i=s.world.land.heights.findIndex(h=>h>20);window.shadeCell=i;window.shadeStamp=s.terrainAtlasState.cells[i];s.world.land.shadows[i]^=7;});
 await page.waitForFunction(()=>window.testScene.terrainAtlasState.cells[window.shadeCell]!==window.shadeStamp);
 assert.deepEqual(errors,[]);
 console.log('PASS: native terrain appears in GPU pixels; a clicked Land Bridge rebuilds changed tiles after native synchronization; shade-only invalidation works; no browser errors');
}finally{await browser.close();}
