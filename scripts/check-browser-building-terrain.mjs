// Desktop integration: terrain edits, settling, face collapse and sinking meshes.
import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame,effectPixels} from './browser-game.mjs'
import {buildingGradeVertices} from '../app/building-shapes.ts'
const browser=await chromium.launch({headless:true}),results=[]
try{
 for(const mode of ['settle','collapse','sink']){
  const {page,errors}=await openGame(browser)
  const b=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world;w.speed=0;w.manaWorld.gameFlags=32
   window.terrainTick=(await import('/app/model.ts')).tick
   window.terrainBuilding=w.buildings.find(b=>b.team==='blue'&&b.kind==='hut')
   window.terrainBuilding.counter=0
   s.focus(window.terrainBuilding);s.startGroundView(2)
   return window.terrainBuilding
  })
  await page.waitForFunction(()=>!window.testScene.cameraMotion.active)
  const pose={object:b.object,angle:Math.round(b.angle*1024/Math.PI)&2047,anchorX:b.anchor.x,anchorY:b.anchor.y},vertices=buildingGradeVertices(pose)
  await page.evaluate(({mode,vertices})=>{
   const w=window.testScene.world
   vertices.forEach(({index},i)=>{
    const x=(index&127)*2-8,z=-(index>>7)*2-8
    const bx=((x+128)%256+256)%256-128,bz=((z+128)%256+256)%256-128
    const h=w.land.heights[index]
    w.terrain[(bz+48)*97+bx+48]=(mode==='sink'?0:h+(i===0?(mode==='settle'?8:500):0))/45
   })
   w.terrainVersion++
   w.speed=1
   for(let i=0;i<4;i++)window.terrainTick(w,1/12)
   w.speed=0
  },{mode,vertices})
  if(mode==='settle'){
   await page.evaluate(()=>{
    const w=window.testScene.world;w.speed=1
    for(let i=0;i<64&&window.terrainBuilding.terrainState?.dirty;i++)window.terrainTick(w,1/12)
    w.speed=0
   })
   await page.waitForFunction(()=>{
    const b=window.terrainBuilding,g=window.testScene.buildingMeshes.get(b.id)
    return g&&g.position.y===Math.round(b.foundation*45)/128
   })
   const result=await page.evaluate(()=>{
    const s=window.testScene,b=window.terrainBuilding
    return {dirty:b.terrainState.dirty,damage:b.damageState,stage:b.progress,model:s.buildingMeshes.get(b.id).children[0].userData.nativeModel,terrain:s.terrainVersion===s.world.landVersion}
   })
   assert.deepEqual(result,{dirty:false,damage:null,stage:1,model:b.object,terrain:true})
   results.push({mode,...result})
  }else{
   assert.equal(await page.evaluate(()=>window.terrainBuilding.terrainState.delay),1)
   await page.evaluate(()=>{const w=window.testScene.world;w.speed=1;window.terrainTick(w,1/12);w.speed=0})
   await page.waitForFunction(()=>!window.testScene.buildingMeshes.has(window.terrainBuilding.id))
   const ids=await page.evaluate(mode=>window.testScene.world.effects.filter(f=>mode==='sink'?f.sinking:f.debris).map(f=>f.id),mode)
   assert.ok(ids.length)
   await page.waitForFunction(ids=>ids.every(id=>window.testScene.fxMeshes.has(id)),ids)
   const pixels=await effectPixels(page,ids)
   assert.ok(pixels>20,`${mode} must draw visible original geometry: ${pixels}`)
   if(mode==='sink'){
    const first=await page.evaluate(id=>{
     const s=window.testScene,f=s.world.effects.find(f=>f.id===id),g=s.fxMeshes.get(id)
     return {h:f.sinking.h,position:[f.x,f.z],model:g.children[0].userData.nativeModel,stage:g.children[0].userData.stage}
    },ids[0])
    assert.equal(first.model,b.object);assert.equal(first.stage,4)
    await page.evaluate(()=>{const w=window.testScene.world;w.speed=1;for(let i=0;i<12;i++)window.terrainTick(w,1/12);w.speed=0})
    await page.waitForFunction(id=>window.testScene.fxMeshes.get(id)?.userData.nativeTilt||window.testScene.fxMeshes.get(id)?.userData.nativeRoll,ids[0])
    const changed=await page.evaluate(id=>{
     const s=window.testScene,f=s.world.effects.find(f=>f.id===id),g=s.fxMeshes.get(id)
     return {h:f.sinking.h,position:[f.x,f.z],tilt:g.userData.nativeTilt,roll:g.userData.nativeRoll,stateTilt:f.sinking.tilt,stateRoll:f.sinking.roll,meshHeight:g.position.y*128}
    },ids[0])
    assert.ok(changed.h<first.h);assert.notDeepEqual(changed.position,first.position)
    assert.equal(changed.tilt,changed.stateTilt);assert.equal(changed.roll,changed.stateRoll);assert.equal(changed.meshHeight,changed.h)
    const tiltedPixels=await effectPixels(page,ids);assert.ok(tiltedPixels>20)
    const tiltPixels=await page.evaluate(id=>{
     const s=window.testScene,g=s.fxMeshes.get(id),gl=s.renderer.getContext()
     const read=()=>{s.renderer.render(s.scene,s.camera);const data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data);return data}
     const before=read(),tilt=g.userData.nativeTilt,roll=g.userData.nativeRoll
     g.userData.nativeTilt=0;g.userData.nativeRoll=0
     const after=read();g.userData.nativeTilt=tilt;g.userData.nativeRoll=roll
     let pixels=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])pixels++
     return pixels
    },ids[0])
    assert.ok(tiltPixels>20,'native pitch/roll must change the actual GPU projection')
    await page.screenshot({path:'/private/tmp/populous-building-sinking.png'})
    await page.evaluate(()=>{const w=window.testScene.world;w.speed=1;for(let i=0;i<68;i++)window.terrainTick(w,1/12);w.speed=0})
    await page.waitForFunction(id=>!window.testScene.fxMeshes.has(id),ids[0])
    results.push({mode,pixels,tiltedPixels,tiltPixels,...changed})
   }else{
    await page.screenshot({path:'/private/tmp/populous-terrain-collapse.png'})
    results.push({mode,pixels,faces:ids.length})
   }
  }
  assert.deepEqual(errors,[])
  await page.close()
 }
 console.log('PASS: live terrain notifications, healthy settling, two-turn collapse, textured faces, original sinking mesh/stage, GPU tilt/drift and cleanup',results)
}finally{await browser.close()}
