import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { effectPixels, openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { addUnit } = await import('/app/model.ts'),
      blue = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      red = w.units.find(u => u.team === 'red' && u.kind === 'shaman')
    w.manaWorld.loadFlags |= 0x200
    w.terrain.fill(3)
    w.terrainVersion++
    w.units = [blue, red]
    Object.assign(blue, { x: 0, z: 20, path: [], casting: null })
    Object.assign(red, { x: 30, z: 30, path: [], casting: null })
    window.enemy = addUnit(w, 'red', 'warrior', { x: 1, z: 13 })
    w.shots.hypnotise = 1
    w.castingTribes[0].cooldown = 0
    w.speed = 0
    s.focus({ x: 1, z: 13 })
    s.onChange()
  })
  await page.locator('[aria-label="Hypnotise, 1 shots"]').click()
  const point = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen({ x: 1, z: 13 }),
      r = s.container.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(point.x, point.y)

  const result = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts')
    if (w.projectiles[0]?.spell !== 'hypnotise') throw Error('HUD click did not cast Hypnotise')
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
    for (let i = 0; !w.units.some(u => u.hypnotise) && i < 100; i++) step()
    const converted = w.units.find(u => u.hypnotise),
      visuals = w.effects.filter(fx => fx.kind === 'hypnotise').map(fx => fx.id)
    return {
      converted: !!converted,
      team: converted?.team,
      tribe: converted?.native?.tribe,
      originalRemoved: !w.units.includes(window.enemy),
      shots: w.shots.hypnotise,
      cast: w.stats.cast,
      visuals,
    }
  })
  assert.deepEqual(result, {
    converted: true,
    team: 'blue',
    tribe: 0,
    originalRemoved: true,
    shots: 0,
    cast: 1,
    visuals: result.visuals,
  })
  const pixels = await effectPixels(page, result.visuals)
  assert.ok(pixels > 20, `Hypnotise feedback must reach GPU pixels (${pixels})`)
  const restored = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts'),
      converted = w.units.find(u => u.hypnotise)
    converted.hypnotise.remaining = 1
    converted.hypnotise.counter = 7
    w.paused = false
    advanceGame(w, s.gameClock, 1 / 12)
    w.paused = true
    return w.units.some(u => u.team === 'red' && u.kind === 'warrior' && !u.hypnotise)
  })
  assert.equal(restored, true)
  assert.deepEqual(errors, [])
  console.log(
    `PASS: HUD Hypnotise cast, temporary ownership, restoration, and GPU feedback (${pixels} pixels)`
  )
} finally {
  await browser.close()
}
