import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { effectPixels, openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene,
      w = s.world,
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    w.units = [shaman]
    w.buildings = []
    w.selected = [shaman.id]
    w.shots.earthquake = 1
    w.castingTribes[0].cooldown = 0
    w.manaWorld.gameFlags = 0
    w.charging = false
    w.speed = 0
    s.focus({ x: 0, z: 8 })
    s.onChange()
  })
  await page.keyboard.press('8')
  const point = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen({ x: 0, z: 8 }),
      r = s.container.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(point.x, point.y)

  const result = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { addBuilding, nativePosition } = await import('/app/model.ts'),
      { advanceGame } = await import('/app/game-clock.ts')
    if (w.projectiles[0]?.spell !== 'earthquake') throw Error('UI click did not cast Earthquake')
    cancelAnimationFrame(s.frame)
    w.paused = true
    w.speed = 1
    w.pendingTime = 0
    s.gameClock.animationTime = 0
    const step = () => {
      w.paused = false
      advanceGame(w, s.gameClock, 1 / 12)
      w.paused = true
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    }
    for (let i = 0; !w.effects.some(f => f.earthquake) && i < 64; i++) step()
    const controller = w.effects.find(f => f.earthquake)
    if (!controller) throw Error('Earthquake projectile did not create its controller')

    const building = addBuilding(w, 'red', 'hut', { x: 0, z: 8 }),
      p = nativePosition(w, building),
      cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00),
      offset = (cell, x, y) =>
        (((cell & 255) + x) & 255) | ((((cell >>> 8) + y) & 255) << 8)
    Object.assign(controller.earthquake, { anchor: offset(cell, 16, 16), remaining: 97 })
    w.randomState = 0
    step()
    const damage = building.damageState.plan.remaining

    Object.assign(controller.earthquake, { remaining: 61, orientation: 0 })
    w.randomState = 0x12345678
    const heights = w.land.heights.slice(),
      prior = new Set(w.effects.map(f => f.id)),
      landVersion = w.landVersion
    step()
    const visuals = w.effects.filter(f => !prior.has(f.id) && f.animation).map(f => f.id),
      central = {
        changed: w.land.heights.some((height, i) => height !== heights[i]),
        visuals,
        landAdvanced: w.landVersion > landVersion,
      }
    Object.assign(controller.earthquake, { remaining: 1 })
    step()
    return {
      shots: w.shots.earthquake,
      cast: w.stats.cast,
      damage,
      central,
      removed: !w.effects.includes(controller),
      sounds: w.sounds.map(sound => sound.cue),
    }
  })
  assert.equal(result.shots, 0)
  assert.equal(result.cast, 1)
  assert.equal(result.damage, 200)
  assert.ok(result.central.changed && result.central.landAdvanced)
  assert.equal(result.central.visuals.length, 89)
  const pixels = await effectPixels(page, result.central.visuals)
  assert.ok(pixels > 20, `Earthquake sparks must reach GPU pixels (${pixels})`)
  assert.ok(result.removed)
  for (const cue of [0x82, 0xad, 0x12, 0x15]) assert.ok(result.sounds.includes(cue))
  assert.deepEqual(errors, [])
  console.log(`PASS: UI Earthquake cast, building damage, terrain/GPU sync and cleanup (${pixels} pixels)`)
} finally {
  await browser.close()
}
