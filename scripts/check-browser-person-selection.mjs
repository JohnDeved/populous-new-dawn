import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'

const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser),cdp=await page.context().newCDPSession(page)
 const selected=()=>page.evaluate(()=>window.testScene.world.selected)
 const point=id=>page.evaluate(id=>{
  const s=window.testScene,r=s.renderer.domElement.getBoundingClientRect(),p=s.unitScreen(id)
  const b=s.unitMeshes.get(id)?.userData.bounds
  if(!b||!p)throw Error('Follower has no rendered sprite bounds')
  const clientX=r.left+(p.x+1)*r.width/2+(b.left+b.right)/2
  const clientY=r.top+(1-p.y)*r.height/2+(b.top+b.bottom)/2
  if(s.pickUnit({clientX,clientY})?.id!==id)throw Error('Rendered follower is not pickable')
  return {x:clientX,y:clientY}
 },id)
 const click=async(id,modifier)=>{
  const p=await point(id)
  if(modifier)await page.keyboard.down(modifier)
  await page.mouse.move(p.x,p.y);await page.mouse.down()
  // Modifier release before mouse release must not change the chosen action.
  if(modifier)await page.keyboard.up(modifier)
  await page.mouse.up()
 }
 for(const [width,height,deviceScaleFactor] of [[1440,1000,1],[3440,1440,1],[1920,1080,2]]){
  await page.setViewportSize({width,height})
  await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor,mobile:false})
  const ids=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts')
   w.speed=0;w.paused=false;w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.selected=[]
   w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32
   for(let i=0;i<3;i++)m.addUnit(w,'blue',i===2?'warrior':'brave',{x:-6+i*6,z:8})
   s.focus({x:0,z:8});s.onChange();return w.units.map(u=>u.id)
  })
  await page.waitForFunction(ids=>ids.every(id=>window.testScene.unitMeshes.get(id)?.userData.bounds),ids)
  await click(ids[0]);assert.deepEqual(await selected(),[ids[0]])
  await click(ids[1],'Control');assert.deepEqual(await selected(),ids.slice(0,2))
  await click(ids[0]);assert.deepEqual(await selected(),ids.slice(0,2))
  await click(ids[0],'Control');assert.deepEqual(await selected(),[ids[1]])
  await click(ids[2]);assert.deepEqual(await selected(),[ids[2]])
  assert.equal(await page.evaluate(()=>window.testScene.world.sounds.at(-1).cue),0x58)
  assert.ok(await page.evaluate(()=>window.testScene.world.units.every(u=>!u.native)), 'selection does not create simulation owners')
  await click(ids[0],'Control');await click(ids[1],'Control')
  assert.deepEqual(await selected(),ids)
  await click(ids[1],'Shift')
  assert.deepEqual(await selected(),ids,'Shift orders through the follower without changing selection')
  const before=await page.evaluate(()=>{
   const w=window.testScene.world
   if(!w.units.every(u=>u.native?.commandStatus===3))throw Error('Shift-click did not issue shared movement')
   return JSON.stringify(w.units.map(u=>({path:u.path,commands:u.native.commands,state:u.native.state})))
  })
  await click(ids[0],'Control');assert.deepEqual(await selected(),ids.slice(1))
  assert.equal(await page.evaluate(()=>JSON.stringify(window.testScene.world.units.map(u=>({path:u.path,commands:u.native.commands,state:u.native.state})))),before)
  await page.waitForFunction(()=>{
   const s=window.testScene
   return s.world.units.every(u=>!!s.unitMeshes.get(u.id).userData.selection.visible===s.world.selected.includes(u.id))
  })
 }
 assert.deepEqual(errors,[])
 console.log('PASS: actual sprite clicks, Ctrl press latching/toggle/add, group retention, warrior voice, Shift orders, unchanged movement and arrows at desktop/ultrawide/2x DPI')
}finally{await browser.close()}
