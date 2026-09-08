// npm run dev, then node scripts/check-browser-hut-birth.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame, effectPixels } from './browser-game.mjs'
import { breedingWork, buildingPose, browserPosition } from '../app/model.ts'
import soundData from '../app/original-sound.json' with { type: 'json' }
import { hutBirthPoints } from '../app/hut-birth.ts'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
  const setup = await page.evaluate(() => {
    const s = window.testScene, w = s.world
    w.speed = 0
    const play = s.onSound, start = AudioBufferSourceNode.prototype.start
    s.onSound = (cue, ...args) => {
      window.currentBirthCue = cue
      try { return play(cue, ...args) } finally { window.currentBirthCue = null }
    }
    AudioBufferSourceNode.prototype.start = function(...args) {
      if (window.currentBirthCue === 40) window.birthAudioDuration = this.buffer.duration
      return start.apply(this, args)
    }
    window.birthHut = w.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
    window.birthIds = w.units.map(u => u.id)
    for (const b of w.buildings) b.timer = 0
    for (const u of w.units) if (u.team === 'blue') u.guard = true
    s.focus(window.birthHut); s.startGroundView(2)
    for (let i=0; i<18; i++) s.updateCameraMotion(1/24)
    return { world: structuredClone(w), building: structuredClone(window.birthHut) }
  })
  const pose = buildingPose(setup.building)
  const points = hutBirthPoints(pose, p => {
    const cell = (p.y >> 9) * 128 + (p.x >> 9)
    if (!(setup.world.land.flags[cell] & 512)) return
    const b = setup.world.buildings.find(b => b.id === (setup.world.land.buildingIds[cell] & 1023))
    return b && buildingPose(b)
  })
  await page.evaluate(cost => {
    window.birthHut.timer = cost - 2; window.birthHut.counter = 3
    window.testScene.world.speed = .25
  }, breedingWork(setup.world, setup.building))
  await page.waitForFunction(() => {
    const s = window.testScene, baby = s.world.units.find(u => !window.birthIds.includes(u.id) && u.team === 'blue')
    const flash = s.world.effects.find(f => f.kind === 'birth')
    if (!baby || !flash || !s.fxMeshes.has(flash.id) || !s.unitMeshes.has(baby.id)) return false
    s.world.speed = 0; window.birthBaby = baby; window.birthFlash = flash
    return true
  })
  const first = await page.evaluate(() => {
    const s = window.testScene, baby = window.birthBaby, f = window.birthFlash
    return { id: f.id, x: f.x, z: f.z, position: { x: baby.x, z: baby.z }, inside: baby.inside,
      path: baby.path, draw: f.animation.draw, object: f.animation.object, duration: f.duration,
      opacity: s.fxMeshes.get(f.id).userData.sprite.material.opacity,
      audioDuration: window.birthAudioDuration, visible: s.unitMeshes.get(baby.id).visible, cue: s.world.sounds.some(v => v.cue === 40) }
  })
  assert.equal(first.inside, null); assert.equal(first.visible, true); assert.ok(first.path.length)
  assert.deepEqual({ x: first.x, z: first.z }, browserPosition(points.flash))
  assert.equal(first.object, 1441); assert.equal(first.draw, 41); assert.equal(first.duration, 16/12)
  assert.equal(first.opacity, 1); assert.ok(first.cue)
  const sample = soundData.samples.sound['352']
  assert.ok(Math.abs(first.audioDuration - sample.frames/sample.rate) < .0002, 'Original birth PCM reaches a real Web Audio source')
  const pixels = await effectPixels(page, [first.id]); assert.ok(pixels > 20, `${pixels} birth pixels`)
  await page.screenshot({ path: '/private/tmp/populous-hut-birth-v109.png' })
  await page.evaluate(() => { window.birthBaby.guard = true; window.testScene.world.speed = .25 })
  await page.waitForFunction(p => Math.hypot(window.birthBaby.x-p.x,window.birthBaby.z-p.z) > .25, first.position)
  await page.waitForFunction(() => !window.testScene.world.effects.includes(window.birthFlash) && !window.testScene.fxMeshes.has(window.birthFlash.id))
  await page.evaluate(() => { window.testScene.world.speed = 0 })
  assert.deepEqual(errors, [])
  console.log(`PASS: live hut birth, visible newborn exit, original HFX1441 flash (${pixels} GPU pixels), full opacity, native socket, 16-turn lifetime, cue 40 PCM playback and mesh cleanup; no browser errors`)
} finally { await browser.close() }
