import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import sprites from '../app/original-units.json' with { type: 'json' }

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser)
  const choices = await page.evaluate(async () => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts')
    w.speed = 0; w.units = []; w.buildings = []; w.fights = []; w.pendingTime = 0
    w.terrain.fill(3); w.terrainVersion++
    w.speed = 1; m.tick(w, 1 / 6); w.speed = 0
    const units = Array.from({length:4}, (_,i) => m.addUnit(w, 'blue', 'warrior', {x: 0, z: 32.5 + i / 20}))
    const near = m.addUnit(w, 'red', 'shaman', {x: 3, z: 32.5}), far = m.addUnit(w, 'red', 'shaman', {x: 5, z: 32.5})
    const visits = 4 - (w.turn & 3),timeline=[];let allocated
    w.speed = 1
    for(let i=0;i<visits;i++){
      m.tick(w,1/12)
      const commands=units.map(u=>(u.native??u.fight?.motion)?.immediateCommand??0)
      timeline.push(commands)
      if(!allocated&&commands.every(Boolean)&&new Set(commands).size===1){const command=commands[0];allocated={commands,model:w.buildingOrders.records[command].model,references:w.buildingOrders.records[command].references}}
    }
    w.speed = 0
    s.focus({x: 2, z: 32}); s.startGroundView(3)
    for (let i=0;i<18;i++) s.updateCameraMotion(1 / 24)
    s.onChange()
    const people=units.map(u=>u.native??u.fight?.motion)
    return { units: units.map(u=>u.id), targets: units.map((u,i)=>people[i]?.workTarget??u.fight?.opponent), expected: [near.id,near.id,near.id,far.id], reservation: near.attackReservation, timeline, allocated, spriteOwned: people.every(Boolean) }
  })
  assert.deepEqual(choices.targets, choices.expected)
  assert.ok(choices.allocated,JSON.stringify(choices));assert.equal(choices.allocated.model,21);assert.equal(choices.allocated.references,4)
  assert.equal(choices.reservation.flags4, 0x100000); assert.equal(choices.spriteOwned, true)
  await page.waitForFunction(ids => ids.every(id => window.testScene.unitMeshes.get(id)?.userData.state === 'walk'), choices.units)
  const poses = await page.evaluate(ids => ids.map(id => {
    const g = window.testScene.unitMeshes.get(id)
    return {frame:g.userData.frame,visible:g.visible,state:g.userData.state}
  }), choices.units)
  for (const pose of poses) {
    assert.equal(pose.visible, true)
    assert.ok(sprites.animations['blue-warrior'].walk.some(dir=>dir.frames.includes(pose.frame)))
  }
  await page.screenshot({path:'/private/tmp/populous-combat-targets.png'})
  assert.deepEqual(errors, [])
  const pursuit = await page.evaluate(async () => {
    const s=window.testScene, w=s.world, m=await import('/app/model.ts')
    w.units=[];w.buildings=[];w.fights=[];w.shrines=[];w.pendingTime=0
    w.terrain.fill(3);w.terrainVersion++
    const u=m.addUnit(w,'blue','warrior',{x:0,z:32}), enemy=m.addUnit(w,'red','shaman',{x:12,z:32})
    w.selected=[u.id];m.command(w,enemy)
    const original=w.pathfinding.people.get(u.id)
    enemy.z+=167/256;w.speed=1;m.tick(w,1/12);w.speed=0
    const reused=w.pathfinding.people.get(u.id)===original
    enemy.z+=1/256;w.speed=1;m.tick(w,1/12);w.speed=0
    const refreshed=w.pathfinding.people.get(u.id)!==original
    enemy.x=8;enemy.z=38;w.speed=1;m.tick(w,1/12);w.speed=0
    s.focus({x:3,z:34});s.onChange()
    return {id:u.id,reused,refreshed,path:u.path,native:u.native,target:u.target,expected:enemy.id}
  })
  assert.equal(pursuit.reused,true,JSON.stringify(pursuit));assert.equal(pursuit.refreshed,true,JSON.stringify(pursuit))
  assert.equal(pursuit.target,pursuit.expected);assert.equal(pursuit.native,null)
  assert.deepEqual(pursuit.path.at(-1),{x:8,z:38})
  await page.waitForFunction(id=>window.testScene.unitMeshes.get(id)?.userData.state==='walk',pursuit.id)
  const pursuitPose=await page.evaluate(id=>{
    const g=window.testScene.unitMeshes.get(id)
    return {visible:g.visible,state:g.userData.state,frame:g.userData.frame}
  },pursuit.id)
  assert.equal(pursuitPose.visible,true)
  assert.ok(sprites.animations['blue-warrior'].walk.some(dir=>dir.frames.includes(pursuitPose.frame)))
  await page.screenshot({path:'/private/tmp/populous-pursuit.png'})
  assert.deepEqual(errors,[])
  const coastal = await page.evaluate(async () => {
    const w=window.testScene.world, m=await import('/app/model.ts'), combat=await import('/app/live-combat.ts')
    w.speed=0;w.units=[];w.buildings=[];w.fights=[];w.land.categories.fill(0);w.land.flags.fill(0);w.land.buildingIds.fill(0);w.land.owners.fill(0)
    w.turn += (4 - (w.turn & 3)) & 3
    const u=m.addUnit(w,'blue','warrior',{x:1,z:31})
    m.addUnit(w,'red','shaman',{x:1.5,z:31})
    const inland=m.addUnit(w,'red','shaman',{x:1,z:33}), p=m.nativePosition(w,u)
    w.land.categories[((p.y&65535)>>9)*128+((p.x&65535)>>9)]=2
    u.path=[{x:10,z:31}];w.levelFlags2|=0x2000000
    const suppressed=combat.automaticMeleeTarget(w,u)?.id??null
    w.levelFlags2&=~0x2000000
    const target=combat.automaticMeleeTarget(w,u)?.id??null
    return {suppressed,target,expected:inland.id,native:u.native}
  })
  assert.equal(coastal.suppressed,null);assert.equal(coastal.target,coastal.expected);assert.equal(coastal.native,null)
  const result = { choices, poses, coastal, pursuit, pursuitPose }
  writeFileSync('/private/tmp/populous-combat-targets-browser.json', JSON.stringify(result,null,2)+'\n')
  console.log('PASS: live squad assigns three warriors to the nearer target and one to the next, retaining original walking sprites', result)
} finally { await browser.close() }
