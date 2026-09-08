// npm run dev, then node scripts/check-browser-building-objects.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser)
 await page.evaluate(()=>{
  const s=window.testScene;cancelAnimationFrame(s.frame);s.world.speed=0
  window.variantHut=s.world.buildings.find(b=>b.team==='blue'&&b.kind==='hut')
  s.focus(window.variantHut);s.startGroundView(3)
  for(let i=0;i<18;i++)s.updateCameraMotion(1/24)
  s.animate(s.previous);cancelAnimationFrame(s.frame)
 })
 const seen=[]
 for(const base of [107,119,131]){
  for(let tribe=0;tribe<4;tribe++)for(let level=1;level<=3;level++){
   const id=base+tribe*3+level-1
   const result=await page.evaluate(({id,level})=>{
    const s=window.testScene,b=window.variantHut;b.object=id;b.level=level
    s.animate(s.previous);cancelAnimationFrame(s.frame)
    const group=s.buildingMeshes.get(b.id),body=group.children[0],gl=s.renderer.getContext()
    const read=()=>{s.renderer.render(s.scene,s.camera);const p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);return p}
    const before=read();body.visible=false;const after=read();body.visible=true
    let pixels=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])pixels++
    return {id:body.userData.nativeModel,pixels,vertices:body.geometry.attributes.position.count,finite:[...body.geometry.attributes.position.array].every(Number.isFinite),signature:group.userData.signature}
   },{id,level})
   assert.equal(result.id,id);assert.equal(result.signature,`${id}-4`)
   assert.ok(result.finite&&result.vertices>50&&result.pixels>100,JSON.stringify(result));seen.push(result)
  }
  await page.evaluate(base=>{const s=window.testScene,b=window.variantHut;b.object=base;b.level=1;s.animate(s.previous);cancelAnimationFrame(s.frame)},base)
  await page.screenshot({path:`/private/tmp/populous-hut-${base}-v108.png`})
 }
 // Changing object identity without changing the level rebuilds the live mesh.
 assert.equal(new Set(seen.map(r=>r.id)).size,36)
 assert.deepEqual(errors,[])
 console.log(`PASS: all 36 original hut family/level/tribe models render (${Math.min(...seen.map(r=>r.pixels))}–${Math.max(...seen.map(r=>r.pixels))} GPU pixels), finite geometry, live identity changes and family captures; no browser errors`)
} finally {await browser.close()}
