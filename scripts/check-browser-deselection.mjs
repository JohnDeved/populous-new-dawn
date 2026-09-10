import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser)
 const mouse=async(point,button='left')=>{
  const p=await page.evaluate(point=>{const s=window.testScene,p=s.screen(point),r=s.container.getBoundingClientRect();return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}},point)
  await page.mouse.click(p.x,p.y,{button})
 }
 for(const [width,height] of [[1440,1000],[3440,1440],[1920,1080]]){
  await page.setViewportSize({width,height})
  await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts')
   w.speed=0;w.paused=false;w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.pendingTime=0;w.manaWorld.gameFlags=32
   w.terrain.fill(3);w.terrainVersion++
   for(let i=0;i<6;i++)m.addUnit(w,'blue','brave',{x:i*.7,z:8})
   w.selected=w.units.map(u=>u.id);s.focus({x:6,z:8});s.onChange()
  })
  await mouse({x:12,z:8})
  const before=await page.evaluate(()=>{
   const s=window.testScene,w=s.world
   if(!w.units.every(u=>u.native?.commandStatus===3&&u.path.length))throw Error('Left click must issue a real shared move order')
   return JSON.stringify(w.units.map(u=>({path:u.path,commands:u.native.commands,state:u.native.state,goalX:u.native.goalX,goalY:u.native.goalY})))
  })
  await page.evaluate(()=>{const s=window.testScene;s.world.mode='blast';s.onChange()})
  await mouse({x:8,z:8},'right')
  assert.deepEqual(await page.evaluate(()=>[window.testScene.world.mode,window.testScene.world.selected.length]),[null,6])
  await mouse({x:8,z:8},'right')
  await page.waitForFunction(()=>!window.testScene.world.selected.length&&[...window.testScene.unitMeshes.values()].every(g=>!g.userData.selection.visible))
  assert.equal(await page.evaluate(()=>JSON.stringify(window.testScene.world.units.map(u=>({path:u.path,commands:u.native.commands,state:u.native.state,goalX:u.native.goalX,goalY:u.native.goalY})))),before)
  const state=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,{tick}=await import('/app/model.ts')
   w.speed=1;for(let i=0;i<60;i++)tick(w,1/12);w.speed=0
   s.focus(w.units[0]);s.onChange()
   return w.units.map(u=>u.x)
  })
  assert.ok(state.every(x=>x>4),'deselected followers continue moving')
  await page.getByRole('button',{name:'Select all braves',exact:true}).click()
  await page.waitForFunction(()=>window.testScene.world.selected.length===6)
  // Right dragging rotates the camera without clearing the selected group.
  const box=await page.locator('.world-viewport canvas').first().boundingBox()
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5)
  await page.mouse.down({button:'right'});await page.mouse.move(box.x+box.width*.5+45,box.y+box.height*.5,{steps:5});await page.mouse.up({button:'right'})
  assert.equal(await page.evaluate(()=>window.testScene.world.selected.length),6)
  await page.evaluate(()=>{window.testScene.world.mode='hut';window.testScene.onChange()})
  await page.keyboard.press('Escape')
  assert.deepEqual(await page.evaluate(()=>[window.testScene.world.mode,window.testScene.world.selected.length]),[null,6])
  await page.keyboard.press('Escape')
  await page.waitForFunction(()=>!window.testScene.world.selected.length&&[...window.testScene.unitMeshes.values()].every(g=>!g.userData.selection.visible))
 }
 assert.deepEqual(errors,[])
 console.log('PASS: real left-click orders, right-click/Escape deselection, tool cancellation, retained movement, arrow removal and right-drag preservation at three desktop sizes including ultrawide')
}finally{await browser.close()}
