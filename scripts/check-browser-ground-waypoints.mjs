import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame,effectPixels} from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser)
 for(const viewport of [{width:1440,height:1000},{width:3440,height:1440}]){
  await page.setViewportSize(viewport)
  await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts');cancelAnimationFrame(s.frame)
   const version=w.terrainVersion+1;Object.assign(w,m.createWorld());w.terrainVersion=version
   w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.manaWorld.gameFlags=32;w.flyby.flags=0;w.inputMask=0;w.speed=0;w.terrain.fill(3)
   for(let i=0;i<6;i++)m.addUnit(w,'blue','brave',{x:-15+i*.5,z:8})
   window.feedbackCues=[];window.feedbackSound??=s.onSound.bind(s)
   s.onSound=(cue,...args)=>{window.feedbackCues.push(cue);return window.feedbackSound(cue,...args)}
   m.setSelection(w,w.units.map(u=>u.id));s.focus({x:0,z:12});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
  })
  const click=async(point,keys=[],releaseBeforeUp=false)=>{
   const p=await page.evaluate(point=>{const s=window.testScene,p=s.screen(point),r=s.container.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}},point)
   for(const key of keys)await page.keyboard.down(key)
   await page.mouse.move(p.x,p.y);await page.mouse.down()
   if(releaseBeforeUp)for(const key of keys)await page.keyboard.up(key)
   await page.mouse.up()
   if(!releaseBeforeUp)for(const key of keys)await page.keyboard.up(key)
  }
  await click({x:-4,z:8},['Control'])
  const flash=await page.evaluate(()=>{
   const s=window.testScene,f=s.world.effects.find(f=>f.kind==='orderMarker')
   s.animate(s.previous);cancelAnimationFrame(s.frame)
   return f&&{id:f.id,x:f.x,z:f.z,height:f.height,turns:f.turnsRemaining,sequence:s.fxMeshes.get(f.id)?.userData.sequence,cues:window.feedbackCues}
  })
  assert.ok(flash);assert.equal(flash.x,-3);assert.equal(flash.z,7)
  assert.equal(flash.turns,4);assert.equal(flash.sequence,'hit');assert.ok(flash.cues.includes(106))
  assert.ok(await effectPixels(page,[flash.id])>10,'accepted ground input must produce visible original marker pixels')
  const started=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,{advanceGame}=await import('/app/game-clock.ts');const cursor=w.orderCursor
   w.speed=1;for(let i=0;i<12;i++)advanceGame(w,s.gameClock,1/12);w.speed=0
   s.animate(s.previous);cancelAnimationFrame(s.frame)
   return {cursor,active:w.buildingOrders.active,moved:w.units.every(u=>u.x>-14),ids:w.units[0].native.commands}
  })
  assert.equal(started.cursor,1);assert.equal(started.active,1);assert.ok(started.moved)
  await click({x:-4,z:20},['Control'])
  // Queue mode reads modifiers on release, unlike the selection press latch.
  await click({x:14,z:20},['Control'],true)
  const queued=await page.evaluate(()=>{const w=window.testScene.world;return {cursor:w.orderCursor,active:w.buildingOrders.active,ids:w.units[0].native.commands,selected:w.selected.length}})
  assert.equal(queued.cursor,0);assert.equal(queued.active,3);assert.equal(queued.ids[0],started.ids[0]);assert.equal(queued.selected,6)
  const result=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,{advanceGame}=await import('/app/game-clock.ts'),visited=new Set()
   w.speed=1;for(let i=0;i<384;i++){advanceGame(w,s.gameClock,1/12);visited.add(w.units[0].native.commandCursor)}w.speed=0
   s.focus({x:14,z:20});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
   return {visited:[...visited],active:w.buildingOrders.active,routes:w.motionRoutes.active,
    people:w.units.map(u=>({x:u.x,z:u.z,state:u.native.state,visible:s.unitMeshes.get(u.id)?.visible,frame:s.unitMeshes.get(u.id)?.userData.frame}))}
  })
  assert.deepEqual(result.visited,[0,1,2]);assert.equal(result.active,0);assert.equal(result.routes,0)
  assert.ok(result.people.every(u=>u.x>11&&u.z>17&&u.state===19&&u.visible&&Number.isInteger(u.frame)),JSON.stringify(result))
  const attack=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts')
   const version=w.terrainVersion+1;Object.assign(w,m.createWorld());w.terrainVersion=version
   w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.manaWorld.gameFlags=32;w.flyby.flags=0;w.inputMask=0;w.speed=0;w.terrain.fill(3)
   const u=m.addUnit(w,'blue','brave',{x:-15,z:8}),enemy=m.addUnit(w,'red','brave',{x:0,z:20})
   m.setSelection(w,[u.id]);s.focus({x:0,z:12});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
   const r=s.renderer.domElement.getBoundingClientRect(),p=s.unitScreen(enemy.id),frame=s.unitMeshes.get(enemy.id).userData.frameHeight
   return {unit:u.id,enemy:enemy.id,click:{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2-frame/2}}
  })
  await click({x:-6,z:8},['Control'])
  await page.keyboard.down('Control');await page.mouse.click(attack.click.x,attack.click.y);await page.keyboard.up('Control')
  await click({x:14,z:8})
  const attackResult=await page.evaluate(async({unit,enemy})=>{
   const s=window.testScene,w=s.world,{advanceGame}=await import('/app/game-clock.ts'),{currentPersonOrder}=await import('/app/person-orders.ts')
   const u=w.units.find(u=>u.id===unit),target=w.units.find(u=>u.id===enemy),p=u.native,advance=()=>{w.speed=1;advanceGame(w,s.gameClock,1/12);w.speed=0}
   const models=p.commands.filter(Boolean).map(id=>w.buildingOrders.records[id].model),waiting=u.target===null
   for(let i=0;i<200&&currentPersonOrder(w.buildingOrders,p)?.model!==28;i++)advance()
   advance();const acquired=u.target===enemy,pursuitStart=u.x
   for(let i=0;i<8;i++)advance()
   const pursued=u.x!==pursuitStart
   target.hp=0;advance();const resumed=currentPersonOrder(w.buildingOrders,p)?.model===3,start=u.x
   for(let i=0;i<8;i++)advance()
   s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
   const walking=u.x!==start&&s.unitMeshes.get(unit)?.visible
   for(let i=0;i<300&&w.buildingOrders.active;i++)advance()
   return {models,waiting,acquired,pursued,resumed,walking,arrived:u.x>12,active:w.buildingOrders.active}
  },attack)
  assert.deepEqual(attackResult,{models:[3,28,3],waiting:true,acquired:true,pursued:true,resumed:true,walking:true,arrived:true,active:0})
  await click({x:5,z:12},['Control']);await click({x:0,z:12},['Alt'])
  const alt=await page.evaluate(()=>{const w=window.testScene.world;return {selected:w.selected,cursor:w.orderCursor,orders:w.units[0].native.commands.filter(Boolean).length}})
  assert.deepEqual(alt,{selected:[],cursor:0,orders:2})
  // Rejected water clicks must not allocate a marker or play either acknowledgement.
  await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts')
   m.setSelection(w,w.units.map(u=>u.id));w.terrain.fill(-.35);w.terrainVersion++;w.effects=[];window.feedbackCues=[]
   s.animate(s.previous);cancelAnimationFrame(s.frame)
  })
  await click({x:5,z:12})
  assert.deepEqual(await page.evaluate(()=>({cues:window.feedbackCues,markers:window.testScene.world.effects.filter(f=>f.kind==='orderMarker').length})),{cues:[],markers:0})
  await page.evaluate(()=>{
   const s=window.testScene,w=s.world;w.terrain.fill(3);w.terrainVersion++;w.orderCursor=0
   for(const order of w.buildingOrders.records)order.references=1
   w.buildingOrders.active=799;window.feedbackCues=[];s.animate(s.previous);cancelAnimationFrame(s.frame)
  })
  await click({x:5,z:12})
  const full=await page.evaluate(()=>({cues:window.feedbackCues,markers:window.testScene.world.effects.filter(f=>f.kind==='orderMarker').length,active:window.testScene.world.buildingOrders.active}))
  assert.equal(full.markers,1);assert.equal(full.active,799);assert.ok(full.cues.includes(106))
  const seamAttack=await page.evaluate(async()=>{
   const s=window.testScene,w=s.world,m=await import('/app/model.ts'),terrain=await import('/app/native-terrain.ts')
   const version=w.terrainVersion+1;Object.assign(w,m.createWorld());w.terrainVersion=version
   w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.nextId=1000;w.manaWorld.gameFlags=32;w.flyby.flags=0;w.inputMask=0;w.speed=0;w.terrain.fill(3)
   w.land.heights.fill(135);w.land.categories.fill(0);w.land.landFlags=0;terrain.queueTerrain(w.land,0,64,1,{surface(){},globe(){}});terrain.updateWalkMasks(w.land,0,64);w.landVersion=w.terrainVersion
   const u=m.addUnit(w,'blue','brave',{x:-127,z:0}),enemy=m.addUnit(w,'red','warrior',{x:127,z:0})
   m.setSelection(w,[u.id]);s.focus({x:127,z:0});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
   const r=s.renderer.domElement.getBoundingClientRect(),p=s.unitScreen(enemy.id),frame=s.unitMeshes.get(enemy.id).userData.frameHeight
   return {unit:u.id,enemy:enemy.id,click:{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2-frame/2}}
  })
  await page.keyboard.down('Shift');await page.mouse.click(seamAttack.click.x,seamAttack.click.y);await page.keyboard.up('Shift')
  const seamIssued=await page.evaluate(({unit,enemy})=>{const w=window.testScene.world,u=w.units.find(u=>u.id===unit);return {target:u?.target,enemy,message:w.message}},seamAttack)
  assert.equal(seamIssued.target,seamAttack.enemy,JSON.stringify(seamIssued))
  const seamResult=await page.evaluate(async({unit,enemy})=>{
   const s=window.testScene,w=s.world,{advanceGame}=await import('/app/game-clock.ts'),u=w.units.find(u=>u.id===unit),target=w.units.find(u=>u.id===enemy)
   const delta=(a,b)=>(((a-b+128)%256+256)%256)-128,separation=()=>Math.hypot(delta(target.x,u.x),delta(target.z,u.z)),before=separation()
   w.speed=1;advanceGame(w,s.gameClock,1/12);let fought=!!w.fights.length
   const shorter=separation()<before
   for(let i=0;i<47&&!fought;i++){advanceGame(w,s.gameClock,1/12);fought=!!w.fights.length}w.speed=0
   s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
   return {shorter,fought,visible:s.unitMeshes.get(unit)?.visible}
  },seamAttack)
  assert.deepEqual(seamResult,{shorter:true,fought:true,visible:true})
 }
 await page.screenshot({path:'/private/tmp/populous-ground-waypoints.png'})
 assert.deepEqual(errors,[])
 console.log('PASS: desktop/ultrawide real Ctrl mouse waypoints, queued enemy attacks, direct seam combat, target-loss handoff, immediate movement, release modifiers, Alt deselection, ordered arrival, original sprites, visible ground feedback and silent rejected clicks')
}finally{await browser.close()}
