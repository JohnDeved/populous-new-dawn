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
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    w.manaWorld.loadFlags |= 0x200
    w.terrain.fill(3)
    w.terrainVersion++
    w.units = [shaman]
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    window.wild = addUnit(w, 'wild', 'brave', { x: 0, z: 14 })
    w.shots.convertWild = 1
    w.castingTribes[0].cooldown = 0
    w.speed = 0
    s.focus({ x: 0, z: 14 })
    s.onChange()
  })
  await page.locator('[aria-label="Convert Wild, 1 shots"]').click()
  const point = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen({ x: 0, z: 14 }),
      r = s.container.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(point.x, point.y)

  const result = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts')
    if (w.projectiles[0]?.spell !== 'convertWild')
      throw Error('HUD click did not cast Convert Wild')
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
    for (let i = 0; w.units.includes(window.wild) && i < 100; i++) step()
    const converted = w.units.find(u => u.team === 'blue' && u.kind === 'brave'),
      visuals = w.effects.filter(fx => fx.sprite || fx.kind === 'birth').map(fx => fx.id)
    return {
      converted: !!converted,
      model: converted?.native?.model,
      shots: w.shots.convertWild,
      cast: w.stats.cast,
      visuals,
      sounds: w.sounds.map(sound => sound.cue),
    }
  })
  assert.equal(result.converted, true)
  assert.equal(result.model, 2)
  assert.equal(result.shots, 0)
  assert.equal(result.cast, 1)
  assert.ok([0x85, 0xb4, 5].every(cue => result.sounds.includes(cue)))
  const pixels = await effectPixels(page, result.visuals)
  assert.ok(pixels > 20, `Convert Wild feedback must reach GPU pixels (${pixels})`)
  assert.deepEqual(errors, [])
  console.log(
    `PASS: HUD Convert Wild cast, live recruitment, sounds and GPU feedback (${pixels} pixels)`
  )
} finally {
  await browser.close()
}
