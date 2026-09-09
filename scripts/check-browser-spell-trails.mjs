// Start npm run dev, then node scripts/check-browser-spell-trails.mjs.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import atlas from '../app/original-effects.json' with {type:'json'};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.POPULOUS_URL??'http://localhost:3000',{waitUntil:'networkidle'});await page.waitForSelector('.world-viewport canvas');
 await page.evaluate(()=>{let f=document.querySelector('main');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.current?.unitMeshes)window.testScene=h.memoizedState.current;});
 await page.waitForFunction(()=>window.testScene.world.flyby.flags&1);await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!window.testScene.world.inputMask&&window.testScene.terrainTextures);
 for(const [spell,key,sequence,start] of [['blast','1','blastTrail',314],['lightning','3','spellTrail',322],['bridge','2','spellTrail',322]]){
  await page.evaluate(spell=>{const s=window.testScene,w=s.world;w.paused=false;w.speed=0.25;w.shots[spell]=4;w.castingTribes[0].cooldown=0;s.focus({x:8,z:30});s.onChange();},spell);
  await page.keyboard.press(key);
  const target=await page.evaluate(()=>{const s=window.testScene,q=s.screen({x:16,z:33}),r=s.container.getBoundingClientRect();return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2};});
  await page.mouse.click(target.x,target.y);
  await page.waitForFunction(sequence=>{
   const s=window.testScene,f=s.world.effects.find(f=>f.sprite?.sequence===sequence&&f.animation.state!==4&&s.fxMeshes.has(f.id));
   if(!f)return false;s.world.paused=true;window.testTrail=f;return true;
  },sequence);
  const first=await page.evaluate(()=>{const f=window.testTrail;return structuredClone(f.animation);});
  assert.equal(first.object,start);assert.equal(first.state,spell==='blast'?3:5);
  await page.waitForTimeout(100);assert.deepEqual(await page.evaluate(()=>structuredClone(window.testTrail.animation)),first,'pause freezes trail motion and animation');
  await page.evaluate(()=>{window.testScene.world.paused=false;});
  await page.waitForFunction(()=>{const s=window.testScene,f=window.testTrail;if(f.animation.state!==4)return false;s.world.paused=true;return true;});
  // Let rendering observe the paused transition before reading the GPU.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const second=await page.evaluate(()=>{
   const s=window.testScene,f=window.testTrail,g=s.fxMeshes.get(f.id),body=g.userData.sprite;
   const gl=s.renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,a=new Uint8Array(w*h*4),b=new Uint8Array(a.length);
   s.renderer.render(s.scene,s.camera);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,a);
   const sprites=s.world.effects.filter(e=>e.sprite?.sequence===f.sprite.sequence).map(e=>s.fxMeshes.get(e.id)?.userData.sprite).filter(s=>s?.visible);for(const s of sprites)s.visible=false;
   s.renderer.render(s.scene,s.camera);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,b);for(const s of sprites)s.visible=true;
   let pixels=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])pixels++;
   return {p:structuredClone(f.animation),height:g.position.y*128,size:[body.scale.x,body.scale.y],offset:body.userData.atlasTransform.toArray().slice(2),opacity:body.material.opacity,pixels};
  });
  assert.equal(second.p.object,start+4);assert.ok(second.p.remaining>=1&&second.p.remaining<=3);assert.equal(second.height,second.p.h);assert.equal(second.opacity,1);assert.ok(second.pixels>0);
  const frame=atlas.animations[sequence][4+(second.p.f1>>>2)];assert.deepEqual(second.size,[frame.w,frame.h]);
  assert.deepEqual(second.offset,[frame.index%8*256/atlas.width,1-(Math.floor(frame.index/8)*256+frame.h)/atlas.height]);
  assert.equal(second.p.h-first.h,spell==='blast'?10*(4-second.p.remaining):0,'native Blast rise and stationary spell trail at the observed turn');
  await page.screenshot({path:`/private/tmp/populous-${spell}-trail.png`});
  await page.evaluate(()=>{window.testScene.world.paused=false;});
  await page.waitForFunction(()=>!window.testScene.world.effects.includes(window.testTrail));
  await page.waitForFunction(()=>!window.testScene.world.projectiles.length);
  await page.waitForTimeout(1000);
 }
 assert.deepEqual(errors,[]);console.log('PASS: real Blast, Lightning and Land Bridge casts, both native trail phases, frame UVs/sizes, upward/stationary motion, pause, visible GPU particles and deletion; no browser errors');
}finally{await browser.close();}
