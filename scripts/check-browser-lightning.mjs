// Start npm run dev, then node scripts/check-browser-lightning.mjs.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {lightningTexture} from '../app/lightning.ts';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.POPULOUS_URL??'http://localhost:3000',{waitUntil:'networkidle'});await page.waitForSelector('.world-viewport canvas');
 await page.evaluate(()=>{let f=document.querySelector('main');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.current?.unitMeshes)window.testScene=h.memoizedState.current;});
 await page.waitForFunction(()=>window.testScene.world.flyby.flags&1);await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!window.testScene.world.inputMask&&window.testScene.terrainTextures);
 // Slow simulation for phase snapshots; exact native timing is checked in Node/Unicorn.
 await page.evaluate(()=>{const s=window.testScene;s.world.shots.lightning=1;s.world.speed=.25;s.focus({x:8,z:30});s.onChange();});await page.keyboard.press('3');
 const target=await page.evaluate(()=>{const s=window.testScene,q=s.screen({x:16,z:33}),r=s.container.getBoundingClientRect();return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2};});await page.mouse.click(target.x,target.y);
 await page.waitForFunction(()=>{const s=window.testScene,f=s.world.effects.find(f=>f.lightning?.turn===1&&s.fxMeshes.has(f.id));if(!f)return false;s.world.paused=true;window.testBolt=f;return true;});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const first=await page.evaluate(()=>{
  const s=window.testScene,f=window.testBolt,g=s.fxMeshes.get(f.id),mesh=g.userData.bolt,body=g.userData.sprite,r=s.renderer,gl=r.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
  const a=new Uint8Array(w*h*4),b=new Uint8Array(a.length);r.render(s.scene,s.camera);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,a);
  mesh.visible=false;r.render(s.scene,s.camera);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,b);mesh.visible=true;
  let pixels=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])pixels++;
  return {pixels,segments:structuredClone(f.lightning.segments),start:f.lightning.start,target:f.lightning.target,texture:Array.from(mesh.material.uniforms.map.value.image.data),mesh:mesh.isMesh,line:!!mesh.isLine,
    object:f.animation.object,draw:f.animation.draw,height:g.position.y*128,bodyOpacity:body.material.opacity,vertices:mesh.geometry.getAttribute('position').count,
    geometry:Array.from(mesh.geometry.getAttribute('position').array),gameRandom:s.world.randomState,cosmetic:s.world.cosmeticRandom.randomState};
 });
 assert.equal(first.segments.length,8);assert.ok(first.pixels>100,`Bolt contributed only ${first.pixels} pixels`);assert.ok(first.mesh&&!first.line);assert.ok(first.vertices>48);
 assert.equal(first.object,1361);assert.equal(first.draw,41);assert.equal(first.height,first.start.h);assert.equal(first.bodyOpacity,1);assert.deepEqual(first.texture,Array.from(lightningTexture()));
 assert.notEqual(first.start.x,first.target.x,'upper endpoint retains native projectile displacement');
 await page.screenshot({path:'/private/tmp/populous-native-lightning.png'});
 await page.waitForTimeout(120);
 const paused=await page.evaluate(()=>{const s=window.testScene,f=window.testBolt;return {turn:f.lightning.turn,segments:f.lightning.segments,gameRandom:s.world.randomState,cosmetic:s.world.cosmeticRandom.randomState};});
 assert.equal(paused.turn,1);assert.deepEqual(paused.segments,first.segments);assert.equal(paused.gameRandom,first.gameRandom);assert.notEqual(paused.cosmetic,first.cosmetic,'screen branches keep drawing while simulation is paused');
 await page.keyboard.down('q');await page.waitForTimeout(180);await page.keyboard.up('q');
 assert.notDeepEqual(await page.evaluate(()=>Array.from(window.testScene.fxMeshes.get(window.testBolt.id).userData.bolt.geometry.getAttribute('position').array)),first.geometry);
 for(const turn of [2,3]){
  await page.evaluate(()=>{window.testScene.world.paused=false;});
  await page.waitForFunction(turn=>{const s=window.testScene,f=window.testBolt;if(f.lightning.turn!==turn)return false;s.world.paused=true;return true;},turn);
  assert.equal(await page.evaluate(()=>window.testBolt.lightning.segments.length),8);
 }
 await page.evaluate(()=>{window.testScene.world.speed=1;window.testScene.world.paused=false;});await page.waitForFunction(()=>!window.testScene.world.effects.includes(window.testBolt));
 assert.deepEqual(errors,[]);console.log(`PASS: real Lightning cast, displaced upper flash, 8 textured segments, native texture pixels, visible GPU bolt (${first.pixels}), three shapes, pause/cosmetic branching, camera rotation and cleanup; no browser errors`);
}finally{await browser.close();}
