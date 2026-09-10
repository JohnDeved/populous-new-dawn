import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'

const browser=await chromium.launch({headless:true})
try{
 const {page,errors}=await openGame(browser),cdp=await page.context().newCDPSession(page),samples=[]
 const screen=point=>page.evaluate(async point=>{
  const s=window.testScene,m=await import('/app/model.ts'),t=await import('/app/native-terrain.ts')
  const p=s.view.project(point,t.terrainPointHeight(s.world.land,m.nativePosition(s.world,point))/45),r=s.container.getBoundingClientRect()
  return {x:r.left+p.screenX,y:r.top+p.screenY}
 },point)
 for(const [angle,width,height,deviceScaleFactor,center] of [[0,1440,1000,1,0],[512,1440,1000,1,0],[1024,1440,1000,1,0],[1536,1440,1000,1,0],[256,3440,1440,1,0],[0,1920,1080,2,120]]){
  await page.setViewportSize({width,height})
  await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor,mobile:false})
  const ids=await page.evaluate(async ({angle,center})=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts')
   w.speed=0;w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.selected=[]
   w.terrain.fill(3);w.terrainVersion++;w.land.heights.fill(135);w.land.categories.fill(0);w.landVersion++;w.manaWorld.gameFlags=32
   for(const [x,z] of [[0,8],[4,10],[15,8]])m.addUnit(w,'blue','brave',{x:x+center,z})
   s.focus({x:2+center,z:8});s.cameraBearing=angle*Math.PI/1024;s.updateView();s.onChange()
   return w.units.map(u=>u.id)
  },{angle,center})
  const a=await screen({x:center-4,z:4}),b=await screen({x:center+8,z:14})
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:12})
  await page.waitForFunction(()=>window.testScene.dragActive.value)
  assert.deepEqual(errors,[])
  const pixels=await page.evaluate(()=>{
   const s=window.testScene,r=s.renderer,gl=r.getContext(),overlay=s.selectionOverlay
   const before=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4),after=new Uint8Array(before.length),unbatched=new Uint8Array(before.length)
   r.render(s.scene,s.camera);const calls=r.info.render.calls
   gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,before)
   const prepare=s.scene.onBeforeRender
   s.scene.onBeforeRender=(...args)=>{
    prepare(...args)
    overlay.geometry.groups=Array.from({length:overlay.geometry.drawRange.count/3},(_,i)=>({start:i*3,count:3,materialIndex:0}))
   }
   r.render(s.scene,s.camera);const unbatchedCalls=r.info.render.calls
   gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,unbatched)
   s.scene.onBeforeRender=prepare
   overlay.visible=false;r.render(s.scene,s.camera);const baseCalls=r.info.render.calls
   gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,after)
   overlay.visible=true
   let changed=0,mismatch=0
   for(let i=0;i<before.length;i++)if(before[i]!==unbatched[i])mismatch++
   for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])changed++
   return {changed,mismatch,drawCalls:calls,baseCalls,unbatchedCalls,selectionDraws:calls-baseCalls,triangles:overlay.geometry.drawRange.count/3,renderPixelRatio:r.getPixelRatio(),renderer:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL)}
  })
  assert.deepEqual(errors,[])
  assert.ok(pixels.changed>100,JSON.stringify(pixels));assert.equal(pixels.mismatch,0,JSON.stringify(pixels))
  assert.ok(pixels.selectionDraws>0);assert.ok(pixels.drawCalls<pixels.unbatchedCalls)
  samples.push({angle,width,height,deviceScaleFactor,center,...pixels})
  if(angle===512)await page.screenshot({path:'/private/tmp/populous-world-drag.png'})
  await page.mouse.up()
  assert.deepEqual(await page.evaluate(()=>window.testScene.world.selected),ids.slice(0,2),JSON.stringify({angle,center,width}))
  assert.equal(await page.evaluate(()=>window.testScene.dragActive.value),false)
  await page.waitForFunction(()=>!window.testScene.selectionOverlay.visible)
  assert.equal(await page.evaluate(()=>window.testScene.world.sounds.at(-1).cue),0x43)
  const e=await screen({x:center+12,z:4}),f=await screen({x:center+18,z:14})
  await page.keyboard.down('Control');await page.mouse.move(e.x,e.y);await page.mouse.down()
  await page.mouse.move(f.x,f.y,{steps:8});await page.keyboard.up('Control');
  await page.mouse.up()
  assert.deepEqual(await page.evaluate(()=>window.testScene.world.selected),ids)
  // A separate empty drag retains the group instead of deselecting it.
  const c=await screen({x:center-10,z:4}),d=await screen({x:center-6,z:14})
  await page.mouse.move(c.x,c.y);await page.mouse.down();await page.mouse.move(d.x,d.y,{steps:8});await page.mouse.up()
  assert.deepEqual(await page.evaluate(()=>window.testScene.world.selected),ids)
 }
 // Original first-mission terrain, including real slopes and existing objects.
 const original=await openGame(browser)
 const area=await original.page.evaluate(()=>{
  const s=window.testScene,w=s.world,u=w.units.find(u=>u.kind==='shaman'&&u.team==='blue')
  w.speed=0;s.focus(u);return {x:u.x,z:u.z}
 })
 const targets=await original.page.evaluate(async area=>{
  const s=window.testScene,m=await import('/app/model.ts'),t=await import('/app/native-terrain.ts'),r=s.container.getBoundingClientRect()
  return [[-5,-4],[6,6]].map(([x,z])=>{const p={x:area.x+x,z:area.z+z},n=m.nativePosition(s.world,p),q=s.view.project(p,t.terrainPointHeight(s.world.land,n)/45);return {x:r.left+q.screenX,y:r.top+q.screenY}})
 },area)
 await original.page.mouse.move(targets[0].x,targets[0].y);await original.page.mouse.down()
 await original.page.mouse.move(targets[1].x,targets[1].y,{steps:12})
 await original.page.waitForFunction(()=>window.testScene.dragActive.value&&window.testScene.selectionOverlay.geometry.drawRange.count>0)
 const sloped=await original.page.evaluate(async()=>{
  const s=window.testScene,t=await import('/app/native-terrain.ts'),r=s.renderer,g=s.selectionOverlay.geometry
  const values=s.selectionOverlay.triangles.flatMap(triangle=>triangle.map(p=>t.terrainPointHeight(s.world.land,p))),heights=[Math.min(...values),Math.max(...values)]
  const buffers=[g.attributes.position.array,g.attributes.uv.array,g.attributes.slot.array]
  s.updateDrag(s.pointerScreen)
  const retained=buffers.every((b,i)=>b===[g.attributes.position.array,g.attributes.uv.array,g.attributes.slot.array][i])
  r.render(s.scene,s.camera)
  const gl=r.getContext(),a=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4),b=new Uint8Array(a.length)
  gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,a)
  s.selectionOverlay.visible=false;r.render(s.scene,s.camera)
  gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,b)
  let changed=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])changed++
  s.selectionOverlay.visible=true
  return {heights,retained,selectionPixels:changed,vertices:g.drawRange.count,allocatedBytes:buffers.reduce((n,b)=>n+b.byteLength,0)}
 })
 assert.ok(Math.max(...sloped.heights)>Math.min(...sloped.heights),JSON.stringify(sloped))
 assert.ok(sloped.retained);assert.ok(sloped.selectionPixels>50,JSON.stringify(sloped))
 await original.page.screenshot({path:'/private/tmp/populous-drag-original-terrain.png'})
 await original.page.mouse.up();await original.page.waitForFunction(()=>!window.testScene.selectionOverlay.visible)
 assert.deepEqual(original.errors,[]);await original.page.close()
 assert.deepEqual(errors,[])
 writeFileSync(new URL('../references/performance/2026-09-10-selection-raster.json',import.meta.url),JSON.stringify({scope:'Native fill/edges/corners share batches separated only by intervening alpha draws. Batched and per-triangle GPU pixels match. Software-renderer correctness check; not hardware FPS or a speedup benchmark.',samples,sloped},null,2)+'\n')
 console.log('PASS: world-projected drag selection at five camera bearings, ultrawide/2x DPI, map seam, Ctrl addition, group voices, empty-area retention, terrain GPU pixels and exact batched/unbatched GPU equivalence')
}finally{await browser.close()}
