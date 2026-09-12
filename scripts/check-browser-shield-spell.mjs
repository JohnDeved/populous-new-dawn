import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { addUnit } = await import('/app/model.ts'),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, { x: 0, z: 0, path: [], casting: null })
    w.units = [shaman]
    for (let i = 0; i < 7; i++) addUnit(w, 'blue', 'brave', { x: 2 + i / 10, z: 0 })
    addUnit(w, 'red', 'brave', { x: 2, z: 0 })
    w.selected = [shaman.id]
    w.shots.shield = 1
    w.castingTribes[0].cooldown = 0
    w.speed = 0
    s.focus({ x: 2, z: 0 })
    s.onChange()
  })
  await page.waitForSelector('[aria-label="Magical Shield, 1 shots"]')
  await page.keyboard.press('0')
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
    if (w.projectiles[0]?.spell !== 'shield') throw Error('UI click did not cast Shield')
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
    for (let i = 0; !w.units.some(u => u.shield) && i < 120; i++) step()
    const shielded = w.units.filter(u => u.shield),
      meshes = shielded.map(u => s.unitMeshes.get(u.id)?.userData.shield)
    return {
      shots: w.shots.shield,
      count: shielded.length,
      kinds: shielded.map(u => u.kind),
      visible: meshes.every(mesh => mesh?.visible),
      flags: shielded.map(u => u.native?.flags3 ?? 0),
    }
  })
  assert.equal(result.shots, 0)
  assert.equal(result.count, 6)
  assert.deepEqual(result.kinds, Array(6).fill('brave'))
  assert.equal(result.visible, true)
  assert.ok(result.flags.every(flags => !flags || flags & 0x80000))
  assert.deepEqual(errors, [])
  console.log('PASS: UI Shield cast protects six followers and displays their shield meshes')
} finally {
  await browser.close()
}
