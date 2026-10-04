import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {writeFileSync} from 'node:fs'
import {bindGame} from './browser-game.mjs'
import {vehiclePanel as nativePairedLayout} from '../app/vehicle-panel.ts'
import hud from '../app/original-hud.json' with {type:'json'}

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
async function save(page, id, airborne) {
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Save checkpoint',exact:true}).click()
 await page.waitForFunction(async ({id,airborne})=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('populous-new-dawn',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
  const saved=await new Promise((resolve,reject)=>{const r=db.transaction('checkpoints','readonly').objectStore('checkpoints').get('latest');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
  db.close();const v=saved?.world?.vehicles.find(v=>v.id===id)
  return airborne ? v?.passengerCount===0&&saved.world.units.some(u=>u.flight) : v?.passengerCount===2
 },{id,airborne})
 await page.getByRole('button',{name:'Close menu',exact:true}).click()
}
async function restore(page) {
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Load checkpoint',exact:true}).click();await bindGame(page)
 await page.waitForFunction(()=>window.testSceneRef.current?.world===window.testStore.getWorld())
 await page.evaluate(()=>{const s=window.testSceneRef.current;s.world.speed=0;cancelAnimationFrame(s.frame)})
}
async function sourcePixels(panel,model,people,ready,output,name,hover=-1,pressed=false) {
 const layout=nativePairedLayout(model,people,ready,hover,pressed), canvas=panel.locator('canvas')
 const result=await canvas.evaluate(async(canvas,{layout,hud})=>{
  const image=await createImageBitmap(await(await fetch('/original/hud.png')).blob()),expected=document.createElement('canvas');expected.width=layout.width;expected.height=layout.height
  const c=expected.getContext('2d');c.imageSmoothingEnabled=false
  for(const draw of layout.events){
   if(draw[0]==='sprite'){const[,id,x,y,tint,faded]=draw,r=hud.rects[tint===130?`vehicle-${id}-pressed`:tint<0?id:`panel-${id}-${faded?'empty':'shadow'}`];c.globalAlpha=id===52?170/255:tint<0&&faded?85/255:1;c.drawImage(image,r.x,r.y,r.w,r.h,x,y,r.w,r.h);c.globalAlpha=1}
   else{const[k,color,[l,t,r,b]]=draw;c.fillStyle=hud.colors[color];c.globalAlpha=k==='fill'?draw[3]/255:1;c.fillRect(l,t,k==='fill'?r-l:Math.max(1,r-l),k==='fill'?b-t:Math.max(1,b-t));c.globalAlpha=1}
  }
  image.close();const actual=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,want=c.getImageData(0,0,expected.width,expected.height).data
  let mismatches=0;for(let i=0;i<actual.length;i++)if(actual[i]!==want[i])mismatches++
  return{width:canvas.width,height:canvas.height,mismatches}
 },{layout,hud})
 assert.deepEqual(result,{width:layout.width,height:layout.height,mismatches:0})
 await canvas.screenshot({path:resolve(output,name+'.png')});return result
}
export default async function vehiclePanels({browser,page,openMission,output,receipt,url}){
 await openMission(22)
 const ids=await page.evaluate(()=>{const s=window.testSceneRef.current;s.world.speed=0;cancelAnimationFrame(s.frame);return s.world.vehicles.map(v=>({id:v.id,model:v.model}))})
 await page.keyboard.press('Escape')
 const result={method:'Actual authored Mission22 vehicle meshes and shipped world right-click/panel controls. Passenger population/location and deterministic turn advancement are supporting fixtures; no natural acquisition or hardware-performance claim.',vehicles:[],layouts:[],pixels:[]}
 for(const model of [1,3]){
  const id=ids.find(v=>v.model===model).id,p=await vehiclePoint(page,id)
  await page.mouse.click(p.x,p.y,{button:'right'});await render(page)
  const panel=page.getByRole('group',{name:new RegExp(`^${model===1?'Boat':'Balloon'}: [0-9]+ passengers$`)})
  await panel.waitFor({state:'visible'})
  assert.equal(await panel.getByRole('button',{name:'Unload all passengers',exact:true}).isDisabled(),true)
  await page.mouse.move(900,400);await render(page)
  result.pixels.push(await sourcePixels(panel,model,[],false,output,`vehicle-${model}-empty-pixels`))
  await page.screenshot({path:resolve(output,`vehicle-${model}-empty.png`)})
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
  await page.mouse.move(900,400);await render(page)
  result.pixels.push(await sourcePixels(panel,model,[{model:2,selected:false,own:true},{model:3,selected:false,own:true}],true,output,`vehicle-${model}-occupied-pixels`))
  await page.screenshot({path:resolve(output,`vehicle-${model}-occupied.png`)})
  const first=panel.getByRole('button',{name:'Toggle passenger 1; Shift selects the group',exact:true}),second=panel.getByRole('button',{name:'Toggle passenger 2; Shift selects the group',exact:true})
  await first.hover();await render(page)
  result.pixels.push(await sourcePixels(panel,model,[{model:2,selected:false,own:true},{model:3,selected:false,own:true}],true,output,`vehicle-${model}-hover-pixels`,0))
  await page.mouse.down();await render(page)
  result.pixels.push(await sourcePixels(panel,model,[{model:2,selected:false,own:true},{model:3,selected:false,own:true}],true,output,`vehicle-${model}-pressed-pixels`,0,true))
  await page.mouse.up();assert.deepEqual(await selection(page),[roster[0]])
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
  await save(page,id,false);await restore(page)
  assert.equal(await page.evaluate(id=>window.testSceneRef.current.world.vehicles.find(v=>v.id===id).passengerCount,id),2)
  await page.keyboard.press('Escape');let point=await vehiclePoint(page,id);await page.mouse.click(point.x,point.y,{button:'right'});await render(page)
  await panel.waitFor({state:'visible'});await panel.screenshot({path:resolve(output,`vehicle-${model}-checkpoint.png`)})
  const unload=panel.getByRole('button',{name:'Unload all passengers',exact:true})
  await unload.click({button:'right'});assert.equal(await page.evaluate(id=>window.testSceneRef.current.world.vehicles.find(v=>v.id===id).passengerCount,id),2)
  // Supporting state changes intentionally occur after the enabled frame and before click.
  const speed=await page.evaluate(id=>{const v=window.testSceneRef.current.world.vehicles.find(v=>v.id===id),old=v.speed;v.speed=12;return old},id)
  await unload.click();assert.equal(await page.evaluate(id=>window.testSceneRef.current.world.vehicles.find(v=>v.id===id).passengerCount,id),2)
  await page.evaluate(({id,speed})=>{window.testSceneRef.current.world.vehicles.find(v=>v.id===id).speed=speed},{id,speed});await render(page)
  const cell=await page.evaluate(id=>{const w=window.testSceneRef.current.world,v=w.vehicles.find(v=>v.id===id),index=((v.y&65535)>>9)*128+((v.x&65535)>>9),flags=w.land.flags[index];w.land.flags[index]|=4;return{index,flags}},id)
  await unload.click();assert.equal(await page.evaluate(id=>window.testSceneRef.current.world.vehicles.find(v=>v.id===id).passengerCount,id),2)
  await page.evaluate(({index,flags})=>{window.testSceneRef.current.world.land.flags[index]=flags},cell);await render(page)
  await unload.click();await render(page)
  assert.equal(await page.evaluate(id=>window.testSceneRef.current.world.vehicles.find(v=>v.id===id).passengerCount,id),0)
  await save(page,id,true);await restore(page)
  assert.equal(await page.evaluate(()=>window.testSceneRef.current.world.units.some(u=>u.flight)),true)
  const landed=await page.evaluate(async roster=>{const s=window.testSceneRef.current,w=s.world,{tick}=await import('/app/model.ts');let turns=0;for(;turns<200&&w.units.some(u=>roster.includes(u.id)&&u.flight);turns++)tick(w,1/12);s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame);return{turns,people:roster.map(id=>{const u=w.units.find(u=>u.id===id);return{id,alive:!!u&&u.hp>0,flight:!!u?.flight,vehicle:u?.native?.vehicle??0}})}},roster)
  assert.ok(landed.turns>1,JSON.stringify(landed));assert.ok(landed.people.every(p=>p.alive&&!p.flight&&!p.vehicle),JSON.stringify(landed))
  await page.keyboard.press('Escape');point=await vehiclePoint(page,id);await page.mouse.click(point.x,point.y,{button:'right'});await render(page)
  await panel.waitFor({state:'visible'});assert.equal(await unload.isDisabled(),true)
  await page.evaluate(()=>{window.testSceneRef.current.world.inputMask=1});await render(page);assert.equal(await panel.isVisible(),false)
  await page.evaluate(()=>{window.testSceneRef.current.world.inputMask=0});await render(page);assert.equal(await panel.isVisible(),true)
  await page.evaluate(id=>{window.testSceneRef.current.world.vehicles.find(v=>v.id===id).active=false},id);await render(page);assert.equal(await panel.count(),0,'destroyed target panel is removed')
  await page.evaluate(()=>window.testSceneRef.current.objectPanels.dispose())
  result.vehicles.push({model,id,boarded,landed})
 }
 const dpr=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:2}),dp=await dpr.newPage()
 dp.setDefaultTimeout(45000);dp.on('pageerror',error=>receipt.errors.push(String(error)))
 await dp.goto(url,{waitUntil:'domcontentloaded'});await dp.getByRole('dialog',{name:'Start game',exact:true}).waitFor({state:'visible'})
 await dp.getByRole('button',{name:'All missions',exact:true}).click();await dp.getByRole('button',{name:'Mission 22',exact:true}).focus();await dp.keyboard.press('Enter');await bindGame(dp)
 const skip=dp.locator('.skip-introduction');await skip.waitFor({state:'visible',timeout:45000}).catch(()=>{});if(await skip.isVisible())await skip.click()
 await dp.waitForFunction(()=>!window.testStore.getWorld().inputMask)
 const did=await dp.evaluate(()=>{const s=window.testSceneRef.current;s.world.speed=0;cancelAnimationFrame(s.frame);return s.world.vehicles.find(v=>v.model===1).id})
 await dp.keyboard.press('Escape');const dpoint=await vehiclePoint(dp,did);await dp.mouse.click(dpoint.x,dpoint.y,{button:'right'});await render(dp)
 const dpanel=dp.getByRole('group',{name:/^Boat: 0 passengers$/});await dpanel.waitFor({state:'visible'});await dp.mouse.move(900,400);await render(dp)
 assert.equal(await dp.evaluate(()=>devicePixelRatio),2);result.pixels.push(await sourcePixels(dpanel,1,[],false,output,'vehicle-dpr2-pixels'))
 await dp.screenshot({path:resolve(output,'vehicle-dpr2.png')});await dpr.close()
 assert.deepEqual(receipt.errors,[])
 writeFileSync(resolve(output,'vehicle-panel-results.json'),JSON.stringify(result,null,2)+'\n')
 return result
}
