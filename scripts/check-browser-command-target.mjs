import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'

const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser)
 for(const [width,height] of [[1440,1000],[3440,1440]]){
  await page.setViewportSize({width,height})
  await page.waitForFunction(()=>{
   const s=window.testScene,r=s.container.getBoundingClientRect()
   return Math.abs(s.camera.aspect-r.width/r.height)<1e-8
  })
  const fixture=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts')
   cancelAnimationFrame(s.frame)
   w.units=[];w.buildings=[];w.trees=[];w.shrines=[];w.selected=[]
   w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32;w.speed=0
   const follower=m.addUnit(w,'blue','brave',{x:-12,z:8})
   m.addUnit(w,'red','brave',{x:0,z:10.8})
   const enemy=m.addUnit(w,'red','brave',{x:0,z:10.8})
   const hut=m.addBuilding(w,'blue','hut',{x:0,z:8},true)
   s.focus({x:0,z:8});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
   const r=s.renderer.domElement.getBoundingClientRect()
   const p=s.unitScreen(enemy.id),frame=s.unitMeshes.get(enemy.id).userData.frameHeight
   const person={x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2-frame/2}
   if(s.picking.pick({clientX:person.x,clientY:person.y})!==enemy.id)throw Error('Enemy body is not visible')
   const mesh=s.buildingMeshes.get(hut.id).children.find(c=>c.userData.nativeModel!==undefined)
   let building
   for(const face of s.picking.model(mesh,'command-test').filter(c=>c.kind==='model')){
    const x=r.left+Math.trunc(face.points.reduce((a,p)=>a+p.x,0)/3)
    const y=r.top+Math.trunc(face.points.reduce((a,p)=>a+p.y,0)/3)
    if(s.picking.pick({clientX:x,clientY:y})===hut.id){building={x,y};break}
   }
   if(!building)throw Error('Hut face is not visible')
   w.selected=[follower.id]
   window.extraWorldLookups=0
   if(!window.originalWorldLookup)window.originalWorldLookup=s.pickWorldObject.bind(s)
   s.pickWorldObject=event=>{window.extraWorldLookups++;return window.originalWorldLookup(event)}
   return {follower:follower.id,enemy:enemy.id,hut:hut.id,person,building}
  })
  const order=()=>page.evaluate(id=>{
   const u=window.testScene.world.units.find(u=>u.id===id)
   return {target:u.target,work:u.work}
  },fixture.follower)
  await page.mouse.click(fixture.person.x,fixture.person.y)
  assert.deepEqual(await order(),{target:fixture.enemy,work:null},'the clicked enemy wins over its overlapping neighbour and nearby hut')
  await page.mouse.click(fixture.building.x,fixture.building.y)
  assert.deepEqual(await order(),{target:null,work:fixture.hut},'the clicked hut wins over nearby enemies')
  await page.evaluate(()=>{
   const s=window.testScene;s.world.units.reverse();s.world.buildings.reverse()
   s.animate(s.previous);cancelAnimationFrame(s.frame);window.extraWorldLookups=0
  })
  await page.mouse.click(fixture.person.x,fixture.person.y)
  assert.deepEqual(await order(),{target:fixture.enemy,work:null},'reordering arrays does not change the clicked target')
  assert.equal(await page.evaluate(()=>window.extraWorldLookups),0,'pointer release must reuse the chosen hit instead of running another world lookup')
 }
 assert.deepEqual(errors,[])
 console.log('PASS: actual overlapping person/building commands and reordered objects at desktop and ultrawide sizes')
} finally {await browser.close()}
