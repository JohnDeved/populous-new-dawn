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
    addUnit(w, 'blue', 'warrior', { x: 1, z: 13 })
    w.shots.ghostArmy = 1
    w.castingTribes[0].cooldown = 0
    w.speed = 0
    s.focus({ x: 1, z: 13 })
    s.onChange()
  })
  await page.locator('[aria-label="Ghost Army, 1 shots"]').click()
  const point = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen({ x: 1, z: 13 }),
      r = s.container.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(point.x, point.y)

  const burst = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts')
    if (w.projectiles[0]?.spell !== 'ghostArmy') throw Error('HUD click did not cast Ghost Army')
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
    for (let i = 0; !w.effects.some(fx => fx.ghostArmy) && i < 100; i++) step()
    const before = new Set(w.effects.map(fx => fx.id))
    step()
    return w.effects.filter(fx => fx.kind === 'trail' && !before.has(fx.id)).map(fx => fx.id)
  })
  assert.equal(burst.length, 81)
  const pixels = await effectPixels(page, burst)
  assert.ok(pixels > 20, `Ghost Army burst must reach GPU pixels (${pixels})`)

  const result = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts'),
      { command } = await import('/app/model.ts')
    const step = () => {
      w.paused = false
      advanceGame(w, s.gameClock, 1 / 12)
      w.paused = true
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    }
    for (let i = 0; !w.units.some(u => u.ghost) && i < 10; i++) step()
    const ghosts = w.units.filter(u => u.ghost)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    const meshes = ghosts.map(u => s.unitMeshes.get(u.id))
    w.selected = ghosts.map(u => u.id)
    w.paused = false
    const ordered = command(w, { x: 5, z: 13 })
    w.paused = true
    return {
      count: ghosts.length,
      kinds: ghosts.map(u => u.kind),
      flags: ghosts.map(u => u.native.flags4),
      blended: meshes.every(
        mesh =>
          mesh?.userData.drawFlags & 4 &&
          mesh.userData.layers.some(
            layer => layer.material.transparent && layer.material.opacity === 0.45
          )
      ),
      ordered,
      orders: ghosts.map(u => u.native.commands[0]),
      shots: w.shots.ghostArmy,
      cast: w.stats.cast,
    }
  })
  assert.deepEqual(result.kinds, ['warrior', 'warrior', 'warrior'])
  assert.equal(result.count, 3)
  assert.ok(result.flags.every(flags => flags & 0x800))
  assert.equal(result.blended, true)
  assert.equal(result.ordered, true)
  assert.ok(result.orders.every(Boolean))
  assert.equal(result.shots, 0)
  assert.equal(result.cast, 1)
  assert.deepEqual(errors, [])
  console.log(
    `PASS: HUD Ghost Army cast, burst, translucent followers, and orders (${pixels} pixels)`
  )
} finally {
  await browser.close()
}
