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
    Object.assign(shaman, { x: 6, z: 30, path: [], casting: null })
    w.units = [shaman]
    w.selected = [shaman.id]
    w.shots.flatten = 1
    w.land.walkMasks.forEach(mask => mask.fill(0))
    w.castingTribes[0].cooldown = 0
    w.manaWorld.gameFlags = 32
    w.speed = 0
    s.focus({ x: 12, z: 31 })
    s.onChange()
  })
  await page.keyboard.press('4')
  const point = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen({ x: 12, z: 31 }),
      r = s.container.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(point.x, point.y)

  const first = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts')
    if (w.projectiles[0]?.spell !== 'flatten') throw Error('UI click did not cast Flatten')
    cancelAnimationFrame(s.frame)
    w.paused = true
    w.speed = 1
    w.pendingTime = 0
    s.gameClock.animationTime = 0
    const draw = () => {
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    }
    const step = () => {
      w.paused = false
      advanceGame(w, s.gameClock, 1 / 12)
      w.paused = true
      draw()
    }
    for (let i = 0; !w.effects.some(f => f.flatten) && i < 64; i++) step()
    const controller = w.effects.find(f => f.flatten)
    if (!controller) throw Error('Flatten projectile did not create its controller')
    const heights = Array.from(w.land.heights),
      walkMasks = w.land.walkMasks.map(mask => mask.slice()),
      landVersion = w.landVersion
    step()
    window.stepFlatten = step
    window.flattenController = controller
    const orbitIds = controller.flatten.orbits.map(o => o.id),
      orbits = orbitIds.map(id => w.effects.find(f => f.id === id)),
      sparkles = w.effects.filter(
        f => f.id > controller.id && f.sprite?.sequence === 'sparkle' && !orbitIds.includes(f.id)
      )
    return {
      shots: w.shots.flatten,
      cast: w.stats.cast,
      remaining: controller.flatten.remaining,
      orbitIds,
      orbitFrames: orbits.map(f => [f.sprite.frame, f.sprite.fixed]),
      sparkleFrames: sparkles.map(f => f.sprite.frame),
      firstSparkleLift: Math.round((sparkles[0].height - orbits[0].height) * 45),
      changed: w.land.heights.some((height, i) => height !== heights[i]),
      walkChanged: w.land.walkMasks.some((mask, pass) =>
        mask.some((value, i) => value !== walkMasks[pass][i])
      ),
      landAdvanced: w.landVersion > landVersion,
      sounds: w.sounds.map(sound => sound.cue),
    }
  })
  assert.equal(first.shots, 0)
  assert.equal(first.cast, 1)
  assert.equal(first.remaining, 14)
  assert.equal(first.orbitIds.length, 32)
  assert.ok(first.orbitFrames.every(([frame, fixed]) => frame === 0 && fixed))
  assert.equal(first.sparkleFrames.length, 32)
  assert.ok(first.sparkleFrames.every(frame => frame === 6))
  assert.equal(first.firstSparkleLift, 0)
  assert.ok(first.changed && first.walkChanged && first.landAdvanced)
  assert.ok(first.sounds.includes(0x83) && first.sounds.includes(0xae))
  await page.evaluate(() => window.stepFlatten())
  const pixels = await effectPixels(page, first.orbitIds)
  assert.ok(pixels > 20, `Flatten orbit sprites must reach GPU pixels (${pixels})`)

  const finished = await page.evaluate(() => {
    const s = window.testScene,
      w = s.world
    for (let i = 2; i < 21; i++) window.stepFlatten()
    return {
      controller: w.effects.includes(window.flattenController),
      orbits: w.effects.some(f => window.flattenController.flatten.orbits.some(o => o.id === f.id)),
      versions: [s.terrainMapVersion, s.terrainVersion, w.terrainVersion, w.landVersion],
    }
  })
  assert.equal(finished.controller, false)
  assert.equal(finished.orbits, false)
  assert.ok(finished.versions.every(version => version === finished.versions[0]))
  assert.deepEqual(errors, [])
  await page.screenshot({ path: '/private/tmp/populous-flatten.png' })
  console.log(
    `PASS: UI Flatten cast, native lifecycle, terrain/walk/GPU sync and cleanup (${pixels} effect pixels)`
  )
} finally {
  await browser.close()
}
