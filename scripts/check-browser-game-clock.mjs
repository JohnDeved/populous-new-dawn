import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const result = await page.evaluate(() => {
    const s = window.testScene,
      w = s.world,
      render = s.renderer.render
    cancelAnimationFrame(s.frame)
    // Exercise the real frame orchestration under injected timestamps. GPU
    // output has separate checks; it must not determine this clock test's rate.
    s.renderer.render = () => {}
    const runs = []
    for (const hz of [5, 30, 60, 120, 144, 240]) {
      w.paused = false
      w.speed = 1
      w.pendingTime = 0
      s.gameClock = { animationTime: 0, animationFrame: 0 }
      s.previous = 1000000
      const turn = w.turn
      for (let frame = 1; frame <= hz; frame++) {
        s.animate(1000000 + (frame * 1000) / hz)
        cancelAnimationFrame(s.frame)
      }
      runs.push({ hz, turns: w.turn - turn, animations: s.gameClock.animationFrame })
    }
    const before = w.turn
    window.dispatchEvent(new Event('blur'))
    s.animate(2000000)
    cancelAnimationFrame(s.frame)
    const paused = { paused: w.paused, turns: w.turn - before }
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
    w.paused = false
    s.animate(3000000)
    cancelAnimationFrame(s.frame)
    const resumed = w.turn - before
    s.animate(3001000)
    cancelAnimationFrame(s.frame)
    const active = w.turn - before
    delete document.hidden
    s.renderer.render = render
    return { runs, paused, resumed, active }
  })
  for (const run of result.runs) {
    assert.equal(run.turns, 12, JSON.stringify(run))
    assert.equal(run.animations, 24, JSON.stringify(run))
  }
  assert.deepEqual(result.paused, { paused: true, turns: 0 })
  assert.equal(result.resumed, 0)
  assert.equal(result.active, 12)
  assert.deepEqual(errors, [])
  console.log(
    'PASS: actual Scene frame loop at 5–240 Hz, long active frames, blur and visibility clock reset',
    JSON.stringify(result)
  )
} finally {
  await browser.close()
}
