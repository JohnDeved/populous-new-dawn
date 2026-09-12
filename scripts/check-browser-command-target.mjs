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
   const s=window.testScene,w=s.world
   cancelAnimationFrame(s.frame)
   const m=await import('/app/model.ts')
   w.units=[];w.buildings=[];w.trees=[];w.shrines=[];w.selected=[];s.treeSignature=''
   w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32;w.speed=0
   const follower=m.addUnit(w,'blue','brave',{x:-12,z:8})
   m.addUnit(w,'red','brave',{x:0,z:10.8})
   const enemy=m.addUnit(w,'red','brave',{x:0,z:10.8})
   const hut=m.addBuilding(w,'blue','hut',{x:0,z:8},true)
   const tree={id:w.nextId++,x:-6,z:14,model:1,logs:4};w.trees.push(tree)
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
   const treeMesh=s.decorations.children.find(g=>g.userData.point?.id===tree.id)?.children[0]
   let treePoint
   for(const face of s.picking.model(treeMesh,'command-tree-test').filter(c=>c.kind==='model')){
    const x=r.left+Math.trunc(face.points.reduce((a,p)=>a+p.x,0)/3)
    const y=r.top+Math.trunc(face.points.reduce((a,p)=>a+p.y,0)/3)
    if(s.picking.pick({clientX:x,clientY:y})===tree.id){treePoint={x,y};break}
   }
   if(!treePoint)throw Error('Tree face is not visible')
   w.selected=[follower.id]
   window.extraWorldLookups=0
   if(!window.originalWorldLookup)window.originalWorldLookup=s.pickWorldObject.bind(s)
   s.pickWorldObject=event=>{window.extraWorldLookups++;return window.originalWorldLookup(event)}
   return {follower:follower.id,enemy:enemy.id,hut:hut.id,tree:tree.id,treeSize:treeMesh.userData.nativeSize,person,building,treePoint}
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
  const ground=await page.evaluate(async id=>{
   const s=window.testScene,w=s.world,b=w.buildings.find(b=>b.id===id)
   const {liveCommandContext}=await import('/app/live-command.ts')
   const r=s.renderer.domElement.getBoundingClientRect(),p=s.screen(b)
   const cx=r.left+(p.x+1)*r.width/2,cy=r.top+(1-p.y)*r.height/2
   let closest=Infinity,detail
   for(let dy=-120;dy<=120;dy+=3)for(let dx=-120;dx<=120;dx+=3){
    const event={clientX:cx+dx,clientY:cy+dy}
    if(s.picking.pick(event))continue
    const point=s.pick(event)
    if(point&&Math.hypot(point.x-b.x,point.z-b.z)<closest){closest=Math.hypot(point.x-b.x,point.z-b.z);detail={point,model:liveCommandContext(w,point)?.model,b:{x:b.x,z:b.z},cx,cy}}
    if(point&&Math.hypot(point.x-b.x,point.z-b.z)<3.1&&liveCommandContext(w,point)?.model===3)
     return {x:event.clientX,y:event.clientY}
   }
   throw Error('No visible ground beside the hut exercises the old proximity radius '+JSON.stringify({closest,detail}))
  },fixture.hut)
  await page.mouse.click(ground.x,ground.y)
  assert.deepEqual(await order(),{target:null,work:null},'ground beside the hut must move rather than enter it')
  assert.equal(await page.evaluate(id=>window.testScene.world.units.find(u=>u.id===id).native?.commandStatus,fixture.follower),3)
  await page.mouse.click(fixture.treePoint.x,fixture.treePoint.y)
  assert.equal(await page.evaluate(id=>window.testScene.world.units.find(u=>u.id===id).tree,fixture.follower),fixture.tree)
  await page.evaluate(id=>{
   const s=window.testScene
   window.commandTreeFollower=id;window.treeOrderSawHarvest=false
   window.commandTargetAfterTurn??=s.gameClock.afterTurn
   s.gameClock.afterTurn=()=>{
    window.commandTargetAfterTurn()
    if(s.world.units.find(u=>u.id===window.commandTreeFollower)?.harvest)window.treeOrderSawHarvest=true
   }
   s.world.speed=2;s.animate(performance.now())
  },fixture.follower)
  await page.waitForFunction(id=>{
   const s=window.testScene,u=s.world.units.find(u=>u.id===id)
   return u.cargo>0
  },fixture.follower).catch(async error=>{
   console.error(await page.evaluate(id=>{
    const s=window.testScene,u=s.world.units.find(u=>u.id===id)
    return {unit:u,speed:s.world.speed,status:s.world.status}
   },fixture.follower))
   throw error
  })
  const timber=await page.evaluate(({follower,tree})=>{
   const s=window.testScene,u=s.world.units.find(u=>u.id===follower),t=s.world.trees.find(t=>t.id===tree)
   s.world.speed=0
   const mesh=s.decorations.children.find(g=>g.userData.point===t)?.children[0]
   return {cargo:u.cargo,logs:t.logs,size:mesh?.userData.nativeSize,harvested:!!window.treeOrderSawHarvest}
  },fixture)
  assert.ok(timber.cargo>0);assert.ok(timber.logs<4);assert.ok(timber.size<fixture.treeSize);assert.ok(timber.harvested)

 }
 assert.deepEqual(errors,[])
 console.log('PASS: actual overlapping person/building/tree commands, native-timed visible tree harvesting, reordered objects and ground beside a hut at desktop and ultrawide sizes')
} finally {await browser.close()}
