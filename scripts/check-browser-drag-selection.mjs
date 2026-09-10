import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'

const browser=await chromium.launch({headless:true})
try{
 const {page,errors}=await openGame(browser),cdp=await page.context().newCDPSession(page),samples=[]
 const screen=point=>page.evaluate(point=>{
  const s=window.testScene,p=s.screen(point),r=s.container.getBoundingClientRect()
  return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}
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
  const pixels=await page.evaluate(()=>{
   const s=window.testScene,r=s.renderer,gl=r.getContext(),before=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4),after=new Uint8Array(before.length)
   r.render(s.scene,s.camera);const calls=r.info.render.calls
   gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,before)
   s.dragActive.value=false;r.render(s.scene,s.camera)
   gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,after)
   const noExtraDraws=r.info.render.calls===calls;s.dragActive.value=true
   let changed=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])changed++
   return {changed,noExtraDraws,drawCalls:calls,renderPixelRatio:r.getPixelRatio(),renderer:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL)}
  })
  assert.ok(pixels.changed>100,JSON.stringify(pixels));assert.ok(pixels.noExtraDraws)
  samples.push({angle,width,height,deviceScaleFactor,center,...pixels})
  if(angle===512)await page.screenshot({path:'/private/tmp/populous-world-drag.png'})
  await page.mouse.up()
  assert.deepEqual(await page.evaluate(()=>window.testScene.world.selected),ids.slice(0,2))
  assert.equal(await page.evaluate(()=>window.testScene.dragActive.value),false)
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
 assert.deepEqual(errors,[])
 writeFileSync(new URL('../references/performance/2026-09-10-drag-selection.json',import.meta.url),JSON.stringify({scope:'Terrain-fragment overlay adds no draw calls. Software-renderer correctness check; not hardware FPS or a speedup benchmark.',samples},null,2)+'\n')
 console.log('PASS: world-projected drag selection at five camera bearings, ultrawide/2x DPI, map seam, Ctrl addition, group voices, empty-area retention, terrain GPU pixels and zero additional draw calls')
}finally{await browser.close()}
