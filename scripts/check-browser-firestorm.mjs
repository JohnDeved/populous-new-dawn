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
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    w.units = [shaman]
    w.buildings = []
    w.trees = []
    w.land.buildingIds.fill(0)
    w.land.flags.forEach((flags, i) => { w.land.flags[i] = flags & ~512 })
    w.selected = [shaman.id]
    w.shots.firestorm = 1
    w.castingTribes[0].cooldown = 0
    w.manaWorld.gameFlags = 0
    w.speed = 0
    s.focus({ x: 0, z: 8 })
    s.onChange()
  })
  await page.keyboard.press('7')
  const point = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen({ x: 0, z: 8 }),
      r = s.container.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(point.x, point.y)

  const emitted = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { addBuilding, addUnit, browserPosition } = await import('/app/model.ts'),
      { changeLivePersonState, createLivePerson } = await import('/app/live-people.ts'),
      { advanceGame } = await import('/app/game-clock.ts')
    if (w.projectiles[0]?.spell !== 'firestorm' || w.projectiles[0].fireball)
      throw Error('UI click did not cast the Firestorm spell head')
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
    for (let i = 0; !w.effects.some(f => f.firestorm) && i < 64; i++) step()
    const controller = w.effects.find(f => f.firestorm)
    if (!controller) throw Error('Firestorm spell head did not create its controller')
    Object.assign(controller.firestorm, { armed: true, remaining: 5 })
    w.randomState = 0x12345678
    step()
    const shot = w.projectiles.find(p => p.fireball)
    if (!shot) throw Error('Firestorm controller did not emit a fireball')
    const target = shot.destination,
      impact = browserPosition(target),
      victim = addUnit(w, 'red', 'brave', impact)
    victim.native = createLivePerson(w, victim)
    changeLivePersonState(w, victim, 14)
    const building = addBuilding(w, 'red', 'hut', impact),
      index = ((target.y & 65535) >> 9) * 128 + ((target.x & 65535) >> 9)
    w.land.buildingIds[index] = building.id
    w.land.flags[index] |= 512
    s.focus(impact)
    s.onChange()
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    window.firestorm = { controller, shot, victim, building, step }
    return {
      controller: controller.id,
      visuals: shot.visuals.map(f => f.id),
      shots: w.shots.firestorm,
      cast: w.stats.cast,
      remaining: controller.firestorm.remaining,
      sounds: w.sounds.map(sound => sound.cue),
    }
  })
  assert.equal(emitted.shots, 0)
  assert.equal(emitted.cast, 1)
  assert.equal(emitted.remaining, 4)
  assert.ok(emitted.sounds.includes(0x7c) && emitted.sounds.includes(0xb3))
  const pixels = await effectPixels(page, emitted.visuals)
  assert.ok(pixels > 20, `Firestorm fireball must reach GPU pixels (${pixels})`)

  const impact = await page.evaluate(() => {
    const s = window.testScene,
      w = s.world,
      state = window.firestorm
    for (let i = 0; !w.effects.some(f => f.fire) && i < 16; i++) state.step()
    for (let i = 0; !state.victim.flight && i < 4; i++) state.step()
    state.controller.firestorm.remaining = 1
    state.step()
    return {
      fire: w.effects.some(f => f.fire),
      wave: w.effects.some(f => f.wave),
      victimFlight: !!state.victim.flight,
      victimBurn: state.victim.burnTrail,
      buildingBurn: !!state.building.burn,
      attacker: state.building.damageState?.attacker,
      controllerRemoved: !w.effects.includes(state.controller),
      sounds: w.sounds.map(sound => sound.cue),
    }
  })
  assert.ok(impact.fire && impact.wave)
  assert.ok(impact.victimFlight && impact.victimBurn > 0)
  assert.ok(impact.buildingBurn)
  assert.equal(impact.attacker, 0)
  assert.ok(impact.controllerRemoved)
  assert.ok(impact.sounds.includes(0xb6) && impact.sounds.includes(0xa1))
  assert.deepEqual(errors, [])
  console.log(`PASS: UI Firestorm cast, native rain impact composition, ${pixels} GPU pixels and cleanup`)
} finally {
  await browser.close()
}
