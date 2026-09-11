import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'

const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser)
 const result=await page.evaluate(async()=>{
  const s=window.testScene,w=s.world,m=await import('/app/model.ts')
  cancelAnimationFrame(s.frame)
  w.units=[];w.buildings=[];w.trees=[];w.shrines=[];w.selected=[]
  w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32;w.speed=0
  const first=m.addUnit(w,'blue','brave',{x:0,z:8})
  const second=m.addUnit(w,'red','brave',{x:0,z:8})
  const hut=m.addBuilding(w,'blue','hut',{x:8,z:8},true)
  s.focus({x:2,z:8});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
  const r=s.renderer.domElement.getBoundingClientRect()
  const p=s.unitScreen(second.id),frame=s.unitMeshes.get(second.id).userData.frameHeight
  const event={clientX:r.left+(p.x+1)*r.width/2,clientY:r.top+(1-p.y)*r.height/2-frame/2}
  const picked=s.picking.pick(event),owned=s.pickUnit(event)?.id??null
  w.units.reverse();s.animate(s.previous);cancelAnimationFrame(s.frame)
  const reversed=s.picking.pick(event)
  const g=s.buildingMeshes.get(hut.id),mesh=g.children.find(c=>c.userData.nativeModel!==undefined)
  const commands=s.picking.model(mesh,'test'),faces=commands.filter(c=>c.kind==='model')
  let target
  for(const face of faces){
   const x=Math.trunc(face.points.reduce((a,p)=>a+p.x,0)/3),y=Math.trunc(face.points.reduce((a,p)=>a+p.y,0)/3)
   const e={clientX:r.left+x,clientY:r.top+y}
   if(s.pickWorldObject(e)?.id===hut.id){target={...e,id:hut.id};break}
  }
  if(!target)throw Error('Hut has no selectable face')
  const samples=[]
  for(let i=0;i<30;i++){
   // Distinct pixels defeat pointer-result and terrain-result caching.
   const start=performance.now()
   s.picking.pick({clientX:target.clientX+(i%7)-3,clientY:target.clientY+Math.floor(i/7)-2})
   samples.push(performance.now()-start)
  }
  samples.sort((a,b)=>a-b)
  return {first:first.id,second:second.id,picked,owned,reversed,target,samples:{median:samples[15],p95:samples[28]}}
 })
 assert.equal(result.picked,result.second,'the later painted enemy owns the overlapping sprite rectangle')
 assert.equal(result.owned,null,'the enemy blocks selection of the friendly behind it')
 assert.equal(result.reversed,result.second,'world array order does not decide hits')
 await page.evaluate(id=>{window.testScene.world.selected=[id]},result.first)
 await page.mouse.click(result.target.clientX,result.target.clientY)
 assert.equal(await page.evaluate(id=>window.testScene.world.units.find(u=>u.id===id).work,result.first),result.target.id,'a visible building click issues the building order')
 let cacheQueries=0
 for(const [width,height] of [[1440,1000],[3440,1440]]){
  await page.setViewportSize({width,height})
  cacheQueries+=await page.evaluate(async()=>{
   const s=window.testScene
   let count=0
   for(const bearing of [0,Math.PI/2,Math.PI]){
    s.cameraBearing=bearing;s.updateView();s.animate(s.previous);cancelAnimationFrame(s.frame)
    for(const x of [-.5,0,.5])for(const y of [-.5,0,.5]){
     const query=()=>s.view.pick(s.mouse.clone().set(x,y),[s.terrain],s.camera,true)
     const a=query();s.view.groundPickCache=new WeakMap();const b=query()
     const result=h=>h&&[h.triangle,h.instance,h.depth,h.point]
     if(JSON.stringify(result(a))!==JSON.stringify(result(b)))throw Error('Stale projected terrain after camera/display change')
     count++
    }
   }
   // A new position buffer may have the same version as the old one.
   const mesh=s.buildingMeshes.values().next().value.children.find(c=>c.userData.nativeModel!==undefined)
   const a=s.picking.model(mesh,'same-view'),position=mesh.geometry.getAttribute('position').clone()
   for(let i=0;i<position.count;i++)position.setY(i,position.getY(i)+1)
   mesh.geometry.setAttribute('position',position)
   const b=s.picking.model(mesh,'same-view')
   if(a===b)throw Error('Model picking reused replaced geometry')
   return count
  })
 }

 assert.deepEqual(errors,[])
 console.log('PASS: enemy occlusion, stable overlapping sprite ownership, actual hut orders and '+cacheQueries+' cached/fresh terrain queries across rotations/displays; replaced model buffers invalidate picking')
} finally {await browser.close()}
