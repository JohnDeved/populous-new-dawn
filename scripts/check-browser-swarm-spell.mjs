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
      { createLivePerson, initializeLiveCelebration } = await import('/app/live-people.ts'),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, { x: 0, z: 0, path: [], casting: null })
    w.units = [shaman]
    const victim = addUnit(w, 'red', 'brave', { x: 2, z: 0 })
    victim.native = createLivePerson(w, victim)
    initializeLiveCelebration(w, victim)
    w.shots.swarm = 1
    w.castingTribes[0].cooldown = 0
    w.speed = 0
    s.focus({ x: 2, z: 0 })
    s.onChange()
  })
  const button = page.locator('[aria-label="Swarm, 1 shots"]')
  await button.waitFor()
  await button.click()
  const point = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen({ x: 2, z: 0 }),
      r = s.container.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(point.x, point.y)

  const result = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts')
    if (w.projectiles[0]?.spell !== 'swarm') throw Error('HUD click did not cast Swarm')
    cancelAnimationFrame(s.frame)
    w.paused = true
    w.speed = 1
    const step = () => {
      w.paused = false
      advanceGame(w, s.gameClock, 1 / 12)
      w.paused = true
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    }
    for (let i = 0; !w.effects.some(fx => fx.swarm?.applied) && i < 120; i++) step()
    const victim = w.units.find(u => u.team === 'red' && u.kind === 'brave'),
      swarm = w.effects.find(fx => fx.swarm)
    return {
      effect: swarm?.id,
      panic: victim?.native?.state,
      shots: w.shots.swarm,
      cue: w.sounds.some(sound => sound.cue === 0xa4),
    }
  })
  assert.ok(result.effect)
  assert.equal(result.panic, 26)
  assert.equal(result.shots, 0)
  assert.equal(result.cue, true)
  assert.ok((await effectPixels(page, [result.effect])) > 10)
  const expired = await page.evaluate(async id => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts')
    for (let i = 0; w.effects.some(fx => fx.id === id) && i < 70; i++) {
      w.paused = false
      advanceGame(w, s.gameClock, 1 / 12)
      w.paused = true
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    }
    return !w.effects.some(fx => fx.id === id)
  }, result.effect)
  assert.equal(expired, true)
  assert.deepEqual(errors, [])
  console.log('PASS: HUD Swarm cast panics its enemy, plays its cue, renders, and expires')
} finally {
  await browser.close()
}
