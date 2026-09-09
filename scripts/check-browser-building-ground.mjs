// Real rotated placement: native anchor/origin, ground mesh and surrounding land.
import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
import {buildingGradeVertices,buildingPosition} from '../app/building-shapes.ts'
import {browserPosition} from '../app/model.ts'
const browser=await chromium.launch({headless:true}),results=[]
try {
 for(let direction=0;direction<4;direction++) {
  const {page,errors}=await openGame(browser)
  await page.evaluate(()=>{
   const s=window.testScene,w=s.world;w.speed=0;w.selected=w.units.filter(u=>u.team==='blue'&&u.kind==='brave').map(u=>u.id)
   window.originalGround=Array.from(w.land.heights);s.focus({x:4,z:32});s.onChange()
  })
  await page.waitForFunction(()=>!window.testScene.cameraMotion.active)
  if(!direction)await page.screenshot({path:'/private/tmp/populous-foundations-after.png'})
  await page.getByRole('button',{name:'buildings B',exact:true}).click()
  await page.getByRole('button',{name:'Hut, 3 wood',exact:true}).click()
  for(let i=0;i<direction;i++)await page.keyboard.press('Space')
  const point=await page.evaluate(()=>{
   const s=window.testScene,p={x:4.3,z:32.3},q=s.screen(p,s.y(p)),r=s.container.getBoundingClientRect()
   return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2}
  })
  await page.mouse.move(point.x,point.y)
  await page.waitForFunction(()=>window.testScene.cursor.visible&&!window.testScene.cursor.userData.invalid)
  await page.mouse.click(point.x,point.y)
  await page.waitForFunction(()=>window.testScene.world.buildings.some(b=>b.progress===0))
  await page.mouse.move(1300,950)
  await page.evaluate(()=>{const s=window.testScene;window.built=s.world.buildings.at(-1);s.focus(window.built);s.startGroundView(2)})
  await page.waitForFunction(()=>!window.testScene.cameraMotion.active)
  const result=await page.evaluate(()=>{
   const s=window.testScene,w=s.world,b=window.built,g=s.buildingMeshes.get(b.id),gl=s.renderer.getContext()
   const read=()=>{s.renderer.render(s.scene,s.camera);const p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);return p}
   const before=read();g.visible=false;const after=read();g.visible=true
   let pixels=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])pixels++
   const changes=[];w.land.heights.forEach((h,i)=>{if(h!==window.originalGround[i])changes.push([i,h])})
   return {b,changes,pixels,mesh:g.position.toArray(),heading:g.userData.nativeHeading,terrainVersion:s.terrainVersion,landVersion:w.landVersion}
  })
  const {b}=result,pose={object:b.object,angle:direction*512,anchorX:b.anchor.x,anchorY:b.anchor.y}
  assert.deepEqual(b.anchor,{x:3072,y:54784})
  const native=buildingPosition(pose),position=browserPosition(native),mask=new Set(buildingGradeVertices(pose).map(c=>c.index))
  assert.deepEqual({x:b.x,z:b.z},position)
  assert.deepEqual(result.mesh,[position.x,Math.round(b.foundation*45)/128,position.z])
  assert.equal(result.heading,direction*512);assert.equal(result.terrainVersion,result.landVersion)
  assert.ok(result.changes.length>0);assert.ok(result.changes.every(([i,h])=>mask.has(i)&&h===Math.round(b.foundation*45)))
  assert.ok(result.pixels>100,`scaffold must be visible: ${result.pixels}`)
  await page.screenshot({path:`/private/tmp/populous-foundation-${direction}.png`})
  assert.deepEqual(errors,[]);results.push({direction,height:Math.round(b.foundation*45),vertices:result.changes.length,pixels:result.pixels})
  await page.close()
 }
 console.log('PASS: all four Space rotations and real placement preserve native anchors, model origins, grade masks and GPU scaffolds; no browser errors',results)
}finally{await browser.close()}
