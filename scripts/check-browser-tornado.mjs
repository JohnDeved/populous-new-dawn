import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { effectPixels, openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene,
      w = s.world,
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      victim = w.units.find(u => u.team === 'red' && u.kind === 'brave')
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    w.units = [shaman, victim]
    w.buildings = []
    w.trees = []
    w.selected = [shaman.id]
    w.shots.tornado = 1
    w.castingTribes[0].cooldown = 0
    w.manaWorld.gameFlags = 0
    w.charging = false
    w.speed = 0
    s.focus({ x: 0, z: 8 })
    s.onChange()
  })
  await page.keyboard.press('9')
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
      { browserPosition } = await import('/app/model.ts'),
      { advanceGame } = await import('/app/game-clock.ts')
    if (w.projectiles[0]?.spell !== 'tornado') throw Error('UI click did not cast Tornado')
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
    for (let i = 0; !w.effects.some(f => f.tornado) && i < 64; i++) step()
    const fx = w.effects.find(f => f.tornado),
      victim = w.units.find(u => u.team === 'red')
    if (!fx) throw Error('Tornado projectile did not create its controller')
    Object.assign(victim, { ...browserPosition(fx.tornado), native: null, flight: undefined, path: [] })
    step()
    const captured = victim.native?.state === 24 && victim.native.stateObject === fx.id
    victim.native.substate = 18
    step()
    const thrown = victim.flight === victim.native && victim.flight?.velocity.y === 230
    const tree = { ...browserPosition(fx.tornado), id: w.nextId++, model: 1, logs: 2 }
    w.trees.push(tree)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    const mesh = s.decorations.children.find(group => group.userData.point?.id === tree.id)?.children[0],
      before = mesh?.userData.nativeSize
    for (let i = 0; tree.logs === 2 && i < 32; i++) step()
    return {
      id: fx.id,
      shots: w.shots.tornado,
      cast: w.stats.cast,
      captured,
      thrown,
      treeLogs: tree.logs,
      treeShrank: mesh?.userData.nativeSize < before,
      sounds: w.sounds.map(sound => sound.cue),
    }
  })
  const pixels = await effectPixels(page, [result.id])
  assert.equal(result.shots, 0)
  assert.equal(result.cast, 1)
  assert.ok(result.captured)
  assert.ok(result.thrown)
  assert.equal(result.treeLogs, 1)
  assert.ok(result.treeShrank)
  assert.ok(result.sounds.includes(0x78) && result.sounds.includes(163))
  assert.ok(pixels > 20, `Tornado smoke must reach GPU pixels (${pixels})`)
  assert.deepEqual(errors, [])
  console.log(`PASS: UI Tornado cast, capture, throw, tree damage and smoke (${pixels} pixels)`)
} finally {
  await browser.close()
}
