// Start npm run dev, then node scripts/check-browser-spell-halo.mjs.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.POPULOUS_URL??'http://localhost:3000',{waitUntil:'networkidle'});await page.waitForSelector('.world-viewport canvas');
 await page.evaluate(()=>{let f=document.querySelector('main');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.current?.unitMeshes)window.testScene=h.memoizedState.current;});
 await page.waitForFunction(()=>window.testScene.world.flyby.flags&1);await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!window.testScene.world.inputMask&&window.testScene.terrainTextures);
 await page.evaluate(()=>{const s=window.testScene;s.world.speed=0;s.focus({x:2,z:30});s.onChange();});
 await page.getByRole('button',{name:/^Blast, \d+ shots$/}).hover();
 await page.waitForFunction(()=>{const s=window.testScene;return s.world.mode===null&&s.range.visible&&s.range.children.length===85;});
 await page.waitForFunction(()=>window.testScene.range.children.every(g=>g.children[1].material.map.image?.complete));
 const geometry=await page.evaluate(()=>{
  const s=window.testScene;return s.range.children.map(g=>{const p=g.userData.halo,[shadow,body]=g.children;return {y:g.position.y,h:p.h,frame:p.frame,sprites:g.children.every(c=>c.isSprite),size:[body.scale.x,body.scale.y],center:[body.center.x,body.center.y],shadow:shadow.material.map.image.src};});
 });
 assert.equal(geometry.length,85);assert.ok(new Set(geometry.map(g=>g.h)).size>1);
 for(const g of geometry){assert.equal(g.y*128,g.h);assert.ok(g.frame>=1466&&g.frame<=1477);assert.ok(g.sprites);assert.deepEqual(g.size,[32,32]);assert.deepEqual(g.center,[.5,0]);assert.match(g.shadow,/effects.png$/);}
 await page.mouse.move(820,600);await page.waitForFunction(()=>!window.testScene.range.visible);
 const hidden=await page.evaluate(()=>window.testScene.halo.angle);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.testScene.halo.angle),hidden);
 await page.keyboard.press('1');await page.waitForFunction(()=>window.testScene.range.visible&&window.testScene.range.userData.model===2);
 const before=await page.evaluate(()=>({angle:window.testScene.halo.angle,frame:window.testScene.range.children[0].userData.halo.frame,random:window.testScene.world.randomState}));
 await page.waitForTimeout(180);
 const after=await page.evaluate(()=>({angle:window.testScene.halo.angle,frame:window.testScene.range.children[0].userData.halo.frame,random:window.testScene.world.randomState}));
 assert.notEqual(after.angle,before.angle);assert.notEqual(after.frame,before.frame);assert.equal(after.random,before.random);
 const changed=await page.evaluate(()=>{
  const s=window.testScene,r=s.renderer,gl=r.getContext(),width=gl.drawingBufferWidth,height=gl.drawingBufferHeight;
  r.render(s.scene,s.camera);const before=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,before);
  s.range.visible=false;r.render(s.scene,s.camera);const after=new Uint8Array(before.length);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,after);s.range.visible=true;
  let count=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])count++;return count;
 });assert.ok(changed>100,`Halo changed only ${changed} GPU pixels`);
 await page.screenshot({path:'/private/tmp/populous-halo-blast.png'});
 // Selected spell takes priority over hover; hover remains a preview on cancel.
 await page.getByRole('button',{name:/^Lightning, \d+ shots$/}).hover();assert.equal(await page.evaluate(()=>window.testScene.range.userData.model),2);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>window.testScene.range.visible&&window.testScene.range.userData.model===3);
 await page.mouse.move(820,600);await page.keyboard.press('2');await page.waitForFunction(()=>window.testScene.range.visible&&window.testScene.range.userData.model===12);
 await page.keyboard.down('q');await page.waitForTimeout(200);await page.keyboard.up('q');
 await page.screenshot({path:'/private/tmp/populous-halo-bridge.png'});
 // Pausing simulation does not freeze the presentation halo.
 await page.keyboard.press('Space');const paused=await page.evaluate(()=>window.testScene.halo.angle);await page.waitForTimeout(100);assert.notEqual(await page.evaluate(()=>window.testScene.halo.angle),paused);await page.keyboard.press('Space');
 const shaman=await page.evaluate(()=>{const s=window.testScene,i=s.world.units.findIndex(u=>u.team==='blue'&&u.kind==='shaman');const [u]=s.world.units.splice(i,1);window.savedShaman=u;return u.id;});
 await page.waitForFunction(()=>!window.testScene.range.visible);assert.ok(shaman>0);
 await page.evaluate(()=>window.testScene.world.units.push(window.savedShaman));await page.waitForFunction(()=>window.testScene.range.visible);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.testScene.range.visible);
 // The shared effect-atlas update must still render a real spell impact.
 await page.evaluate(()=>{const s=window.testScene;s.world.speed=1;s.focus({x:2,z:30});});await page.keyboard.press('1');
 const target=await page.evaluate(()=>{const s=window.testScene,q=s.screen({x:10,z:33}),r=s.container.getBoundingClientRect();return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2};});
 await page.mouse.click(target.x,target.y);
 await page.waitForFunction(()=>{const s=window.testScene;return s.world.effects.some(f=>f.kind==='blast'&&s.fxMeshes.has(f.id));});
 const impact=await page.evaluate(()=>{
  const s=window.testScene;s.world.speed=0;s.world.paused=true;const f=s.world.effects.find(f=>f.kind==='blast'),g=s.fxMeshes.get(f.id),body=g.userData.sprite;window.testFlash=f;
  const r=s.renderer,gl=r.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,before=new Uint8Array(w*h*4),after=new Uint8Array(before.length);
  r.render(s.scene,s.camera);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,before);body.visible=false;r.render(s.scene,s.camera);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,after);body.visible=true;
  let pixels=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])pixels++;return {pixels,source:body.material.map.image.src,object:f.animation.object,draw:f.animation.draw,frame:f.animation.f1,children:g.children.length,height:g.position.y*128,nativeHeight:Math.round(f.height*45),opacity:body.material.opacity};
 });assert.ok(impact.pixels>100,JSON.stringify(impact));assert.match(impact.source,/effects.png$/);
 assert.equal(impact.object,1099);assert.equal(impact.draw,30);assert.equal(impact.children,1,'no invented shockwave ring');assert.equal(impact.height,impact.nativeHeight);assert.equal(impact.opacity,1);
 await page.screenshot({path:'/private/tmp/populous-halo-impact.png'});
 await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.testFlash.animation.f1),impact.frame,'pause freezes the native flash');
 await page.evaluate(()=>{window.testScene.world.paused=false;});
 await page.waitForFunction(()=>{const s=window.testScene;return window.testFlash.animation.object===0x650&&!s.fxMeshes.get(window.testFlash.id).userData.sprite.visible;});
 assert.ok(await page.evaluate(()=>window.testScene.world.effects.includes(window.testFlash)),'native animation finishes before object lifetime');
 await page.evaluate(()=>{window.testScene.world.speed=1;});await page.waitForFunction(()=>!window.testScene.world.effects.includes(window.testFlash));
 assert.deepEqual(errors,[]);console.log(`PASS: 85 native sprite/shadow pairs, exact terrain-height anchors, hover/selected priority, animated visible GPU pixels (${changed}), camera rotation, pause, missing shaman and cancel; no browser errors`);
}finally{await browser.close();}
