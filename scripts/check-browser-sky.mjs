// Start npm run dev, then: node scripts/check-browser-sky.mjs
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.POPULOUS_URL??'http://localhost:3000',{waitUntil:'networkidle'});
 await page.waitForSelector('.world-viewport canvas');
 await page.evaluate(()=>{
  let f=document.querySelector('main');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];
  for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.current?.unitMeshes)window.testScene=h.memoizedState.current;
  const s=window.testScene;s.world.flyby.flags=0;s.world.inputMask=0;s.world.paused=false;s.focus({x:2,z:30});
 });
 await page.waitForFunction(()=>window.testScene.skyClouds.every(m=>m.material.uniforms.map.value.image?.complete));
 await page.waitForTimeout(200);
 // Read two renders in one frame: clouds must affect sky pixels and leave the
 // opaque water/terrain in the lower screen untouched. Both layers contribute.
 const pixels=await page.evaluate(()=>{
  const s=window.testScene,r=s.renderer,gl=r.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
  const read=()=>{r.render(s.scene,s.camera);const p=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,p);return p;};
  const full=read(),layers=[];
  for(const m of s.skyClouds){
   m.visible=false;const without=read();m.visible=true;
   let upper=0,lower=0,left=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;if(full[i]===without[i]&&full[i+1]===without[i+1]&&full[i+2]===without[i+2])continue;
    if(y>h*.8){upper++;if(x<w*.1)left++;}if(y<h*.2)lower++;
   }
   layers.push({upper,lower,left});
  }
  read();return layers;
 });
 for(const layer of pixels){assert.ok(layer.upper>100);assert.ok(layer.left>100,'clouds cover the battlefield left edge');assert.equal(layer.lower,0,'opaque terrain and water occlude the sky');}
 await page.screenshot({path:'/private/tmp/populous-visible-sky-after.png'});
 const before=await page.evaluate(()=>({angle:window.testScene.skyMotion.angle,bearing:window.testScene.cameraBearing}));
 await page.keyboard.down('e');await page.waitForTimeout(400);await page.keyboard.up('e');
 const after=await page.evaluate(()=>({angle:window.testScene.skyMotion.angle,bearing:window.testScene.cameraBearing}));
 assert.notEqual(after.bearing,before.bearing);assert.notEqual(after.angle,before.angle);
 await page.screenshot({path:'/private/tmp/populous-visible-sky-rotated.png'});
 const paused=await page.evaluate(()=>{const s=window.testScene;s.world.paused=true;return {turn:s.world.turn,x:s.skyMotion.x,y:s.skyMotion.y};});
 await page.waitForTimeout(200);
 assert.ok(await page.evaluate(p=>{const s=window.testScene;return s.world.turn===p.turn&&(s.skyMotion.x!==p.x||s.skyMotion.y!==p.y);},paused),'cloud clock remains independent of simulation pause');
 await page.setViewportSize({width:1920,height:1080});await page.waitForTimeout(200);
 assert.ok(await page.evaluate(()=>window.testScene.skyClouds.every(m=>[...m.geometry.attributes.position.array].every(Number.isFinite))));
 await page.evaluate(()=>window.testScene.overviewActive=true);await page.waitForTimeout(100);
 assert.ok(await page.evaluate(()=>window.testScene.skyDome.visible&&window.testScene.skyClouds.every(m=>!m.visible)));
 await page.evaluate(()=>window.testScene.focus());await page.waitForTimeout(100);
 assert.ok(await page.evaluate(()=>!window.testScene.skyDome.visible&&window.testScene.skyClouds.every(m=>m.visible)));
 assert.deepEqual(errors,[]);
 console.log('PASS: both cloud layers alter GPU sky pixels, cover the left edge and remain behind the world; keyboard rotation, independent clock, resize and overview return; no page errors');
}finally{await browser.close();}
