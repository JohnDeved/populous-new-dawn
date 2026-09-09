// Start npm run dev, then node scripts/check-browser-building-fire.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame, effectPixels } from './browser-game.mjs'
import { buildingFirePoints } from '../app/building-shapes.ts'
import { spriteDirection } from '../app/projection.ts'
import sprites from '../app/original-units.json' with {type:'json'}

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
  await page.getByRole('button', { name: 'Mute sound', exact: true }).waitFor()
  await page.evaluate(() => {
    const scene = window.testScene
    const play=scene.onSound,start=AudioBufferSourceNode.prototype.start
    scene.onSound=(cue,...args)=>{window.workCue=cue;try{return play(cue,...args)}finally{window.workCue=null}}
    AudioBufferSourceNode.prototype.start=function(...args){
      if(window.workCue===20&&this.buffer?.getChannelData(0).some(v=>v!==0))window.heardBuildingWork=true
      return start.apply(this,args)
    }
    window.burningBuilding = scene.world.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
    scene.world.shots.lightning = 1
    scene.world.speed = 0.25
    scene.world.manaWorld.gameFlags = 32
    scene.focus(window.burningBuilding)
    scene.onChange()
  })
  await page.keyboard.press('3')
  const target = await page.evaluate(() => {
    const scene = window.testScene, point = scene.screen(window.burningBuilding)
    const rect = scene.container.getBoundingClientRect()
    return { x: rect.left + (point.x + 1) * rect.width / 2, y: rect.top + (1 - point.y) * rect.height / 2 }
  })
  await page.mouse.click(target.x, target.y)
  await page.waitForFunction(() => {
    const scene = window.testScene
    if (window.burningBuilding.burn?.remaining !== 110) return false
    scene.world.speed = 0
    window.buildingFires = scene.world.effects.filter(f => f.fire?.suppressEmbers)
    return true
  })
  await page.waitForFunction(() => window.buildingFires.every(f => window.testScene.fxMeshes.has(f.id)))
  const visible = await page.evaluate(() => {
    const scene = window.testScene, b = window.burningBuilding
    return {
      pose: { object: b.object, angle: Math.round(b.angle * 1024 / Math.PI) & 2047,
        anchorX: Math.round((b.x + 8) * 256) & 0xfe00, anchorY: Math.round((-b.z - 8) * 256) & 0xfe00 },
      fires: window.buildingFires.map(f => ({ id: f.id, x: f.fire.x, y: f.fire.y,
        maxScale: f.fire.maxScale, height: scene.fxMeshes.get(f.id).position.y * 128, h: f.fire.h,
        model: scene.fxMeshes.get(f.id).children[0].userData.nativeModel })),
      remaining: b.damageState.plan.remaining,
    }
  })
  const sockets = buildingFirePoints(visible.pose)
  assert.equal(visible.fires.length, sockets.length)
  for (const [i, f] of visible.fires.entries()) {
    assert.equal(f.x, sockets[i].x & 65535)
    assert.equal(f.y, sockets[i].y & 65535)
    assert.equal(f.maxScale, sockets[i].size * 10)
    assert.equal(f.height, f.h)
    assert.equal(f.model, 5)
  }
  assert.equal(visible.remaining, 300)
  const ids = visible.fires.map(f => f.id)
  const pixels = await effectPixels(page, ids)
  assert.ok(pixels > 100, `Building fire contributed only ${pixels} pixels`)
  await page.screenshot({ path: '/private/tmp/populous-building-fire.png' })
  await page.evaluate(() => { window.testScene.world.speed = 1 })
  await page.waitForFunction(() => {
    if (window.burningBuilding.burn?.remaining !== 79) return false
    window.testScene.world.speed = 0
    return true
  })
  assert.equal(await page.evaluate(() => window.burningBuilding.damageState.plan.remaining), 200)
  assert.ok(await page.evaluate(() => window.testScene.world.effects.some(f => f.smoke)))
  await page.evaluate(() => { window.repairSmokeTemplate = structuredClone(window.testScene.world.effects.find(f => f.smoke)) })
  await page.screenshot({ path: '/private/tmp/populous-building-fire-damaged.png' })
  await page.evaluate(() => { window.testScene.world.speed = 1 })
  await page.waitForFunction(() => {
    const scene = window.testScene
    return !window.burningBuilding.burn && window.buildingFires.every(f =>
      !scene.world.effects.includes(f) && !scene.fxMeshes.has(f.id))
  })
  assert.equal(await page.evaluate(() => window.burningBuilding.progress), 2 / 3)
  // Successful fire allocations suppress the building's own cue. Exercise its
  // fallback voice and explicit stop event through the real Web Audio adapter.
  await page.evaluate(() => {
    const scene = window.testScene, w = scene.world, b = window.burningBuilding
    w.speed = 0
    const play = scene.onSound
    scene.onSound = (cue, attenuation, pan, finished) => play(cue, attenuation, pan, () => {
      window.buildingVoiceEnded = true
      finished?.()
    })
    w.sounds.push({ serial: ++w.soundSerial, cue: 0x53, turn: w.turn, owner: b.id, x: b.x, z: b.z })
    scene.playWorldSounds()
    window.buildingVoiceStarted = scene.ownedSounds.has(b.id)
    w.sounds.push({ serial: ++w.soundSerial, cue: 0x53, turn: w.turn, owner: b.id, x: b.x, z: b.z, stop: true })
    scene.playWorldSounds()
    scene.onSound = play
  })
  assert.equal(await page.evaluate(() => window.buildingVoiceStarted), true)
  await page.waitForFunction(() => window.buildingVoiceEnded)
  assert.equal(await page.evaluate(() => window.testScene.ownedSounds.has(window.burningBuilding.id)), false)
  await page.evaluate(() => {
    const s=window.testScene,w=s.world
    w.selected=w.units.filter(u=>u.team==='blue'&&u.kind==='brave').slice(0,2).map(u=>u.id)
    s.onChange()
  })
  await page.mouse.click(target.x,target.y,{button:'right'})
  assert.ok(await page.evaluate(()=>window.burningBuilding.damageState.plan.repairDelay>1000))
  await page.evaluate(()=>{window.testScene.world.speed=4})
  await page.waitForFunction(()=>{
    if(window.burningBuilding.damageState.plan.repairDelay>900)return false
    window.testScene.world.speed=0;return true
  })
  assert.equal(await page.evaluate(()=>window.burningBuilding.progress),2/3)
  assert.equal(await page.evaluate(()=>window.testScene.world.units.filter(u=>u.work===window.burningBuilding.id).length),2)
  assert.ok(await page.evaluate(()=>window.testScene.world.units.filter(u=>u.work===window.burningBuilding.id).every(u=>u.tree===null&&!u.cargo)))
  await page.evaluate(()=>{window.testScene.world.speed=1})
  await page.waitForFunction(()=>{
    const w=window.testScene.world,u=w.units.find(u=>u.work===window.burningBuilding.id&&u.builder?.task===2&&u.builder.phase===4&&u.builder.person?.speed===0&&u.builder.person.timer>2)
    if(!u)return false
    window.workingBuilder=u;w.speed=0;w.paused=true;return true
  })
  await page.waitForFunction(()=>window.testScene.unitMeshes.get(window.workingBuilder.id).userData.state==='work')
  const pose=await page.evaluate(()=>{
    const s=window.testScene,u=window.workingBuilder,p=u.builder.person,g=s.unitMeshes.get(u.id)
    return {object:p.object,step:p.f2,heading:u.heading,bearing:s.cameraBearing,frame:g.userData.frame,flip:g.userData.frameFlip,heard:!!window.heardBuildingWork}
  })
  const directions=sprites.animations['blue-brave'].work
  assert.equal(pose.object,directions[0].source)
  const direction=spriteDirection(Math.round(pose.bearing*1024/Math.PI),Math.round((Math.PI-pose.heading)*1024/Math.PI))
  assert.equal(pose.frame,directions[direction].frames[pose.step%directions[direction].frames.length])
  assert.equal(pose.flip,directions[direction].flip)
  assert.ok(pose.heard,'original building-work cue must reach Web Audio as nonempty PCM')
  await page.screenshot({path:'/private/tmp/populous-builder-work.png'})
  await page.evaluate(()=>{window.testScene.world.paused=false})
  await page.waitForFunction(frame=>{
    if(window.workingBuilder.builder.person.f2===frame)return false
    window.testScene.world.paused=true;return true
  },pose.step)
  await page.waitForFunction(frame=>window.testScene.unitMeshes.get(window.workingBuilder.id).userData.frame!==frame,pose.frame)
  await page.evaluate(()=>{window.testScene.world.paused=false})
  await page.screenshot({path:'/private/tmp/populous-repair-waiting.png'})
  await page.evaluate(()=>{window.testScene.world.speed=4})
  await page.waitForFunction(()=>{
    const delay=window.burningBuilding.damageState.plan.repairDelay
    if(delay>8||delay<1)return false
    window.testScene.world.speed=0;return true
  },null,{timeout:45000})
  // A fresh smoke fixture exercises the cleanup consumer at actual repair resumption.
  // Smoke from the initial fire normally expires before the full holdoff ends.
  const smokeId=await page.evaluate(()=>{
    const w=window.testScene.world,fx=window.repairSmokeTemplate
    fx.id=w.nextId++;Object.assign(fx.smoke,{lifetime:100,scaleX:256,scaleY:256});window.repairSmoke=fx;w.effects.push(fx)
    return fx.id
  })
  await page.waitForFunction(id=>window.testScene.fxMeshes.has(id),smokeId)
  const smokePixels=await effectPixels(page,[smokeId])
  assert.ok(smokePixels>20,`Repair smoke rendered only ${smokePixels} pixels`)
  await page.evaluate(()=>{window.testScene.world.speed=4})
  await page.waitForFunction(()=>{
    if(window.burningBuilding.damageState.plan.repairDelay!==0)return false
    window.testScene.world.speed=0;return true
  })
  const resumed=await page.evaluate(()=>({life:window.repairSmoke.smoke.lifetime,fetching:window.testScene.world.units.filter(u=>u.work===window.burningBuilding.id&&u.builder?.task===7).length}))
  assert.ok(resumed.life>0&&resumed.life<=16,JSON.stringify(resumed))
  assert.equal(resumed.fetching,1,'two builders dispatch one hauler after the holdoff')
  await page.evaluate(()=>{window.testScene.world.speed=4})
  await page.waitForFunction(()=>window.burningBuilding.progress===1)
  assert.ok(await page.evaluate(()=>!window.testScene.world.effects.includes(window.repairSmoke)))
  assert.equal(await page.evaluate(()=>window.burningBuilding.damageState.state),2)
  await page.screenshot({path:'/private/tmp/populous-repair-complete.png'})
  assert.deepEqual(errors, [])
  console.log(`PASS: real Lightning hit, ${ids.length} fire sockets (${pixels} GPU pixels), native builder work pose/directional frames/PCM, full repair holdoff, one of two workers fetching, smoke retirement (${smokePixels} GPU pixels) and completed repair; no browser errors`)
} finally {
  await browser.close()
}
