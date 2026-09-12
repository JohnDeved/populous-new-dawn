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
      { changeLivePersonState, createLivePerson } = await import('/app/live-people.ts'),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, { x: 6, z: 30, path: [], casting: null })
    w.units = [shaman]
    const victim = addUnit(w, 'red', 'brave', { x: 13, z: 31 })
    victim.native = createLivePerson(w, victim)
    changeLivePersonState(w, victim, 14)
    window.swampVictim = victim
    w.selected = [shaman.id]
    w.shots.swamp = 1
    w.castingTribes[0].cooldown = 0
    w.manaWorld.gameFlags = 0
    w.speed = 0
    s.focus({ x: 12, z: 31 })
    s.onChange()
  })
  await page.keyboard.press('6')
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
    if (w.projectiles[0]?.spell !== 'swamp') throw Error('UI click did not cast Swamp')
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
    for (let i = 0; !w.effects.some(f => f.swamp) && i < 64; i++) step()
    const controller = w.effects.find(f => f.swamp)
    if (!controller) throw Error('Swamp projectile did not create its controller')
    for (let i = 0; w.units.includes(window.swampVictim) && i < 8; i++) step()
    window.swampController = controller
    window.stepSwamp = step
    return {
      id: controller.id,
      shots: w.shots.swamp,
      cast: w.stats.cast,
      remaining: controller.swamp.remaining,
      kills: controller.swamp.kills,
      victim: w.units.includes(window.swampVictim),
      credit: w.killCredits[0][1],
      corpse: w.effects.some(f => f.corpse),
      mesh: s.fxMeshes.get(controller.id)?.children[0]?.name,
      sounds: w.sounds.map(sound => sound.cue),
    }
  })
  assert.equal(result.shots, 0)
  assert.equal(result.cast, 1)
  assert.equal(result.kills, 1)
  assert.equal(result.victim, false)
  assert.equal(result.credit, 1)
  assert.ok(result.corpse)
  assert.equal(result.mesh, 'swamp-trap')
  assert.ok(result.sounds.includes(0x7f) && result.sounds.includes(0xaa))
  const pixels = await effectPixels(page, [result.id])
  assert.ok(pixels > 20, `Swamp trap must reach GPU pixels (${pixels})`)
  const removed = await page.evaluate(() => {
    const s = window.testScene,
      w = s.world,
      id = window.swampController.id
    window.swampController.swamp.remaining = 1
    window.stepSwamp()
    return !w.effects.includes(window.swampController) && !s.fxMeshes.has(id)
  })
  assert.ok(removed)
  assert.deepEqual(errors, [])
  console.log(`PASS: UI Swamp cast, native trap kill/corpse path, sound, ${pixels} GPU pixels and cleanup`)
} finally {
  await browser.close()
}
