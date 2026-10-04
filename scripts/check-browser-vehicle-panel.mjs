import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {writeFileSync} from 'node:fs'
import {bindGame} from './browser-game.mjs'

export async function vehiclePoint(page,id){
 return page.evaluate(async id=>{
  const s=window.testSceneRef.current,{browserPosition}=await import('/app/model.ts'),v=s.world.vehicles.find(v=>v.id===id)
  s.focus(browserPosition(v));for(let i=0;s.cameraMotion.active&&i<64;i++)s.updateCameraMotion(1/24)
  s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
  const p=s.view.screen(s.vehicleMeshes.get(id).position,s.camera),r=s.container.getBoundingClientRect(),center={x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}
  s.picking.lastKey=''
  for(let dy=-100;dy<=40;dy+=3)for(let dx=-50;dx<=50;dx+=3){const e={clientX:center.x+dx,clientY:center.y+dy};if(document.elementFromPoint(e.clientX,e.clientY)===s.renderer.domElement&&!s.pickUnit(e)&&s.pickWorldObject(e)?.id===id)return{x:e.clientX,y:e.clientY}}
  throw Error(`No exposed vehicle geometry ${id}`)
 },id)
}
const render=page=>page.evaluate(()=>{const s=window.testSceneRef.current;s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)})
const selection=page=>page.evaluate(()=>window.testSceneRef.current.world.selected)
export default async function vehiclePanels({page,openMission,output,receipt}){
 await openMission(22)
 const ids=await page.evaluate(()=>{const s=window.testSceneRef.current;s.world.speed=0;cancelAnimationFrame(s.frame);return s.world.vehicles.map(v=>({id:v.id,model:v.model}))})
 await page.keyboard.press('Escape')
 const result={method:'Actual authored Mission22 vehicle meshes and shipped world right-click/panel controls. Passenger population/location and deterministic turn advancement are supporting fixtures; no natural acquisition or hardware-performance claim.',vehicles:[],layouts:[]}
 for(const model of [1,3]){
  const id=ids.find(v=>v.model===model).id,p=await vehiclePoint(page,id)
  await page.mouse.click(p.x,p.y,{button:'right'});await render(page)
  const panel=page.getByRole('group',{name:new RegExp(`^${model===1?'Boat':'Balloon'}: \\d+ passengers$`)})
  await panel.waitFor({state:'visible'})
  assert.equal(await panel.getByRole('button',{name:'Unload all passengers',exact:true}).isDisabled(),true)
  await panel.screenshot({path:resolve(output,`vehicle-${model}-empty.png`)})
  // Supporting mixed-class roster; subsequent boarding is an actual terrain/model click.
  const roster=await page.evaluate(async id=>{
   const s=window.testSceneRef.current,w=s.world,{addUnit,browserPosition}=await import('/app/model.ts'),v=w.vehicles.find(v=>v.id===id)
   w.units=[];w.pathfinding.people.clear();w.selected=[];s.objectPanels.dispose()
   const point=browserPosition(v),units=['brave','warrior'].map((kind,i)=>addUnit(w,'blue',kind,{x:point.x+0.2*i,z:point.z}))
   s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
   return units.map(u=>u.id)
  },id)
  await page.getByRole('button',{name:'Select follower',exact:true}).click({modifiers:['Shift']})
  assert.deepEqual((await selection(page)).toSorted(),roster.toSorted())
  const boardingPoint=await vehiclePoint(page,id);await page.mouse.click(boardingPoint.x,boardingPoint.y)
  const boarded=await page.evaluate(async({id,roster})=>{const s=window.testSceneRef.current,w=s.world,{tick}=await import('/app/model.ts'),v=w.vehicles.find(v=>v.id===id);for(let i=0;i<120&&v.passengerCount<roster.length;i++)tick(w,1/12);s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame);return{count:v.passengerCount,ids:[...v.passengers],units:roster.map(id=>{const u=w.units.find(u=>u.id===id);return{id,hp:u.hp,vehicle:u.native?.vehicle}})}},{id,roster})
  assert.equal(boarded.count,2,JSON.stringify(boarded));await page.keyboard.press('Escape')
  const focusPoint=await vehiclePoint(page,id);await page.mouse.click(focusPoint.x,focusPoint.y,{button:'right'});await render(page)
  await panel.waitFor({state:'visible'});assert.equal(await panel.getByRole('button',{name:'Unload all passengers',exact:true}).isEnabled(),true)
  await panel.screenshot({path:resolve(output,`vehicle-${model}-occupied.png`)})
  const first=panel.getByRole('button',{name:'Toggle passenger 1; Shift selects the group',exact:true}),second=panel.getByRole('button',{name:'Toggle passenger 2; Shift selects the group',exact:true})
  await first.click();assert.deepEqual(await selection(page),[roster[0]])
  await second.click({modifiers:['Shift']});assert.deepEqual((await selection(page)).toSorted(),roster.toSorted())
  await first.click();assert.deepEqual(await selection(page),[])
  const camera=await page.evaluate(()=>({...window.testSceneRef.current.cameraPosition}))
  await second.click({button:'right'});await render(page)
  assert.deepEqual(await page.evaluate(()=>({...window.testSceneRef.current.cameraPosition})),camera)
  assert.equal(await page.evaluate(id=>window.testSceneRef.current.objectPanels.panels.has(id),roster[1]),true)
  assert.equal(await panel.isVisible(),true,'passenger and vehicle panels coexist')
  for(const viewport of [{width:1280,height:720},{width:1920,height:1080},{width:3440,height:1440}]){
   await page.setViewportSize(viewport);await vehiclePoint(page,id);await render(page)
   const bounds=await panel.boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport.width&&bounds.y+bounds.height<=viewport.height)
   result.layouts.push({model,viewport,bounds})
  }
  await page.setViewportSize({width:1440,height:1000})
  await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Save checkpoint',exact:true}).click()
  await page.waitForFunction(()=>window.testStore.hasCheckpoint());await page.getByRole('button',{name:'Close menu',exact:true}).click()
  const unload=panel.getByRole('button',{name:'Unload all passengers',exact:true})
  await unload.click({button:'right'});assert.equal(await page.evaluate(id=>window.testSceneRef.current.world.vehicles.find(v=>v.id===id).passengerCount,id),2)
  await unload.click();await render(page)
  const landed=await page.evaluate(async roster=>{const s=window.testSceneRef.current,w=s.world,{tick}=await import('/app/model.ts');let turns=0;for(;turns<200&&w.units.some(u=>roster.includes(u.id)&&u.flight);turns++)tick(w,1/12);s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame);return{turns,people:roster.map(id=>{const u=w.units.find(u=>u.id===id);return{id,alive:!!u&&u.hp>0,flight:!!u?.flight,vehicle:u?.native?.vehicle??0}})}},roster)
  assert.ok(landed.turns>1,JSON.stringify(landed));assert.ok(landed.people.every(p=>p.alive&&!p.flight&&!p.vehicle),JSON.stringify(landed))
  await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Load checkpoint',exact:true}).click();await bindGame(page)
  await page.waitForFunction(()=>window.testSceneRef.current?.world===window.testStore.getWorld())
  await page.evaluate(()=>{const s=window.testSceneRef.current;s.world.speed=0;cancelAnimationFrame(s.frame)})
  assert.equal(await page.evaluate(id=>window.testSceneRef.current.world.vehicles.find(v=>v.id===id).passengerCount,id),2)
  await page.keyboard.press('Escape');const restored=await vehiclePoint(page,id);await page.mouse.click(restored.x,restored.y,{button:'right'});await render(page)
  await panel.waitFor({state:'visible'});await panel.screenshot({path:resolve(output,`vehicle-${model}-checkpoint.png`)})
  await page.evaluate(()=>window.testSceneRef.current.objectPanels.dispose())
  result.vehicles.push({model,id,boarded,landed})
 }
 assert.deepEqual(receipt.errors,[])
 writeFileSync(resolve(output,'vehicle-panel-results.json'),JSON.stringify(result,null,2)+'\n')
 return result
}
