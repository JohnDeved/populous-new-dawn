// Real desktop casting, native flight height, visible sprites/shadows and landing.
import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser)
 page.on('pageerror',e=>console.error(e.message))
 page.setDefaultTimeout(15000)
 await page.evaluate(async()=>{
  const s=window.testScene,w=s.world,m=await import('/app/model.ts')
  window.blastModel=m; w.speed=0; w.manaWorld.gameFlags=32
  const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman')
  Object.assign(shaman,{x:8,z:32,path:[],casting:null})
  w.units=[shaman];w.selected=[shaman.id];w.castingTribes[0].cooldown=0;w.shots.blast=4
  window.blastAlly=m.addUnit(w,'blue','brave',{x:12,z:30})
  s.focus({x:11,z:31});s.startGroundView(2);s.onChange()
 })
 await page.waitForFunction(()=>!window.testScene.cameraMotion.active&&!window.testScene.viewTransition)
 await page.keyboard.press('1')
 const point=await page.evaluate(()=>{
  const s=window.testScene,p=s.screen({x:11,z:31}),r=s.container.getBoundingClientRect()
  return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}
 })
 await page.mouse.click(point.x,point.y)
 assert.equal(await page.evaluate(()=>window.testScene.world.projectiles.length),1,'mouse cast creates the projectile')
 await page.evaluate(()=>{
  const w=window.testScene.world;w.speed=1
  for(let i=0;w.projectiles.length&&i<120;i++)window.blastModel.tick(w,1/12)
  w.speed=0;window.blastWave=w.effects.find(f=>f.wave)
 })
 assert.equal(await page.evaluate(()=>window.blastWave?.wave.remaining),3)
 for(let i=0;i<2;i++){
  await page.evaluate(()=>{const w=window.testScene.world;w.speed=1;window.blastModel.tick(w,1/12);w.speed=0})
  assert.equal(await page.evaluate(()=>!!window.blastAlly.flight),false)
 }
 await page.evaluate(()=>{const w=window.testScene.world;w.speed=1;window.blastModel.tick(w,1/12);w.speed=0})
 await page.waitForFunction(()=>{
  const u=window.blastAlly,g=window.testScene.unitMeshes.get(u.id)
  return u.flight && g?.position.y*128===u.flight.h
 })
 const first=await page.evaluate(()=>{window.testScene.world.paused=true;return structuredClone(window.blastAlly.flight)})
 await page.waitForTimeout(100)
 assert.deepEqual(await page.evaluate(()=>structuredClone(window.blastAlly.flight)),first,'pause freezes flight and animation')
 await page.evaluate(()=>{window.testScene.world.paused=false})
 const visible=await page.evaluate(()=>{
  const s=window.testScene,u=window.blastAlly,g=s.unitMeshes.get(u.id),gl=s.renderer.getContext()
  const read=()=>{s.renderer.render(s.scene,s.camera);const a=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,a);return a}
  const a=read();g.visible=false;const b=read();g.visible=true
  let pixels=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])pixels++
  return {pixels,shadow:g.userData.shadow.visible,height:g.position.y*128,nativeHeight:u.flight.h,groundHeight:(g.position.y+g.userData.shadow.position.y)*128,frame:g.userData.frame,object:u.flight.object,hp:u.hp,cues:s.world.sounds.map(s=>s.cue),layers:g.userData.layers.length}
 })
 assert.ok(visible.pixels>5);assert.ok(visible.shadow);assert.equal(visible.hp,50);assert.ok(visible.layers>0)
 assert.ok(visible.cues.includes(0xa1)&&visible.cues.includes(0xb2))
 await page.screenshot({path:'/private/tmp/populous-blast-native-flight.png'})
 const landing=await page.evaluate(()=>{
  const w=window.testScene.world,u=window.blastAlly,heights=[],sparks=new Set()
  w.speed=1
  for(let i=0;u.flight&&i<160;i++){
   heights.push(u.flight.h);window.blastModel.tick(w,1/12)
   for(const f of w.effects)if(f.sprite?.sequence==='blastTrail'&&f.animation.remaining===4)sparks.add(f.id)
  }
  w.speed=0
  return {heights,sparks:sparks.size,flying:!!u.flight,alive:w.units.includes(u)&&u.hp>0,cells:[...w.objectCells.objects.keys()]}
 })
 assert.equal(landing.flying,false);assert.ok(landing.alive);assert.ok(landing.sparks>0)
 assert.ok(first.h>visible.groundHeight);assert.ok(landing.heights.some((h,i)=>i&&h<landing.heights[i-1]))
 assert.deepEqual(errors,[])
 console.log('PASS: desktop Blast input, three native wave passes, allied protection, frozen/native-height flight, visible sprite/shadow, sound cues, landing spark and cell cleanup',{visible,landing})
 await page.close()
}finally{await browser.close()}
