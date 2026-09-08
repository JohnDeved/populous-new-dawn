// Start npm run dev, then node scripts/check-browser-building-fire.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame, effectPixels } from './browser-game.mjs'
import { buildingFirePoints } from '../app/building-shapes.ts'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
  await page.getByRole('button', { name: 'Mute sound', exact: true }).waitFor()
  await page.evaluate(() => {
    const scene = window.testScene
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
      pose: { object: 131 + b.level - 1, angle: Math.round(b.angle * 1024 / Math.PI) & 2047,
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
  assert.deepEqual(errors, [])
  console.log(`PASS: real Lightning building hit, ${ids.length} original fire sockets (${pixels} GPU pixels), scale/grounding, timed structural damage, smoke, cleanup and owned voice cancellation; no browser errors`)
} finally {
  await browser.close()
}
