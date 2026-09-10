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
    const units = Array.from({length:4}, (_,i) => m.addUnit(w, 'blue', 'warrior', {x: 0, z: 32 + i / 20}))
    const near = m.addUnit(w, 'red', 'shaman', {x: 3, z: 32}), far = m.addUnit(w, 'red', 'shaman', {x: 5, z: 32})
    const visits = 4 - (w.turn & 3)
    w.speed = 1; m.tick(w, visits / 12); w.speed = 0
    s.focus({x: 2, z: 32}); s.startGroundView(3)
    for (let i=0;i<18;i++) s.updateCameraMotion(1 / 24)
    s.onChange()
    return { units: units.map(u=>u.id), targets: units.map(u=>u.target), expected: [near.id,near.id,near.id,far.id], reservation: near.attackReservation, spriteOwned: units.some(u=>u.native !== null) }
  })
  assert.deepEqual(choices.targets, choices.expected)
  assert.equal(choices.reservation.flags4, 0x100000); assert.equal(choices.spriteOwned, false)
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
  const result = { choices, poses }
  writeFileSync('/private/tmp/populous-combat-targets-browser.json', JSON.stringify(result,null,2)+'\n')
  console.log('PASS: live squad assigns three warriors to the nearer target and one to the next, retaining original walking sprites', result)
} finally { await browser.close() }
