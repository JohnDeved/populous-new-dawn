import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene,
      w = s.world,
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, { x: 6, z: 30, path: [], casting: null })
    w.units = [shaman]
    w.selected = [shaman.id]
    w.shots.erosion = 1
    w.land.walkMasks.forEach(mask => mask.fill(0))
    w.castingTribes[0].cooldown = 0
    w.manaWorld.gameFlags = 32
    w.speed = 0
    s.focus({ x: 12, z: 31 })
    s.onChange()
  })
  await page.keyboard.press('5')
  const point = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen({ x: 12, z: 31 }),
      r = s.container.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(point.x, point.y)

  const result = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts')
    if (w.projectiles[0]?.spell !== 'erosion') throw Error('UI click did not cast Erosion')
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
    for (let i = 0; !w.effects.some(f => f.erosion) && i < 64; i++) step()
    const controller = w.effects.find(f => f.erosion)
    if (!controller) throw Error('Erosion projectile did not create its controller')
    const heights = Array.from(w.land.heights),
      masks = w.land.walkMasks.map(mask => mask.slice()),
      landVersion = w.landVersion
    step()
    const first = {
      shots: w.shots.erosion,
      cast: w.stats.cast,
      remaining: controller.erosion.remaining,
      changed: w.land.heights.some((height, i) => height !== heights[i]),
      walkChanged: w.land.walkMasks.some((mask, pass) =>
        mask.some((value, i) => value !== masks[pass][i])
      ),
      landAdvanced: w.landVersion > landVersion,
      sounds: w.sounds.map(sound => sound.cue),
    }
    for (let i = 0; w.effects.includes(controller) && i < 70; i++) step()
    return {
      first,
      controller: w.effects.includes(controller),
      versions: [s.terrainMapVersion, s.terrainVersion, w.terrainVersion, w.landVersion],
    }
  })
  assert.equal(result.first.shots, 0)
  assert.equal(result.first.cast, 1)
  assert.equal(result.first.remaining, 63)
  assert.ok(result.first.changed && result.first.walkChanged && result.first.landAdvanced)
  assert.ok(result.first.sounds.includes(0x7e) && result.first.sounds.includes(0xa9))
  assert.equal(result.controller, false)
  assert.ok(result.versions.every(version => version === result.versions[0]))
  assert.deepEqual(errors, [])
  console.log('PASS: UI Erosion cast, native terrain/RNG lifecycle, sound, GPU sync and cleanup')
} finally {
  await browser.close()
}
