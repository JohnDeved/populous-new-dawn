import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { effectPixels, openGame, settleView } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { addBuilding, addUnit } = await import('/app/model.ts'),
      { createLivePerson } = await import('/app/live-people.ts'),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    w.units = [shaman]
    w.buildings = []
    w.trees = []
    const victim = addUnit(w, 'red', 'brave', { x: 0, z: 14 })
    victim.native = createLivePerson(w, victim)
    addBuilding(w, 'red', 'hut', { x: 0, z: 14 })
    w.shots.volcano = 1
    w.castingTribes[0].cooldown = 0
    w.speed = 0
    s.focus({ x: 0, z: 14 })
    s.onChange()
  })
  const button = page.locator('[aria-label="Volcano, 1 shots"]')
  await button.waitFor()
  await button.click()
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
    if (w.projectiles[0]?.spell !== 'volcano') throw Error('HUD click did not cast Volcano')
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
    for (let i = 0; !w.effects.some(fx => fx.volcano) && i < 64; i++) step()
    const controller = w.effects.find(fx => fx.volcano)
    if (!controller) throw Error('Volcano projectile did not create its controller')
    controller.volcano.remaining = 51
    const before = w.land.heights.slice(),
      prior = new Set(w.effects.map(fx => fx.id)),
      landVersion = w.landVersion
    step()
    const visuals = w.effects
      .filter(fx => !prior.has(fx.id) && (fx.animation || fx.fire))
      .map(fx => fx.id)
    const victim = w.units.find(u => u.team === 'red' && u.kind === 'brave'),
      building = w.buildings.find(b => b.team === 'red')
    return {
      id: controller.id,
      visuals,
      shots: w.shots.volcano,
      cast: w.stats.cast,
      terrainChanged: w.land.heights.some((height, i) => height !== before[i]),
      landAdvanced: w.landVersion === landVersion + 1,
      disturbed: victim?.native?.state === 31 && !(victim.native.flags2 & 8),
      victimHealth: victim?.hp,
      attacker: victim?.native?.damageAttacker,
      buildingState: building?.damageState?.state,
      sounds: w.sounds.map(sound => sound.cue),
    }
  })
  assert.equal(result.shots, 0)
  assert.equal(result.cast, 1)
  assert.ok(result.terrainChanged && result.landAdvanced)
  assert.equal(result.disturbed, true)
  assert.ok(result.victimHealth < 50)
  assert.equal(result.attacker, 0)
  assert.equal(result.buildingState, 3)
  for (const cue of [0x84, 0xaf]) assert.ok(result.sounds.includes(cue))
  const pixels = await effectPixels(page, result.visuals)
  assert.ok(pixels > 20, `Volcano effects must reach GPU pixels (${pixels})`)
  await page.getByRole('button', { name: 'Planet overview', exact: true }).click()
  await settleView(page)
  await page.waitForFunction(() => window.testScene.globe.effects.naturalWidth > 0)
  const overviewDraws = await page.evaluate(ids => {
    const s = window.testScene,
      g = s.globe,
      w = s.world,
      ctx = g.canvas.getContext('2d'),
      original = ctx.drawImage,
      saved = w.effects
    let draws = 0
    w.effects = saved.filter(fx => ids.includes(fx.id))
    ctx.drawImage = function (...args) {
      if (args[0] === g.effects || [...g.tintedEffects.values()].includes(args[0])) draws++
      original.apply(this, args)
    }
    try {
      g.drawEffects(ctx, g.view, w, s.terrainTextures)
    } finally {
      ctx.drawImage = original
      w.effects = saved
    }
    return draws
  }, result.visuals)
  assert.ok(overviewDraws > 0)
  const removed = await page.evaluate(async id => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts'),
      controller = w.effects.find(fx => fx.id === id)
    controller.volcano.remaining = 1
    w.paused = false
    advanceGame(w, s.gameClock, 1 / 12)
    w.paused = true
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    return !w.effects.some(fx => fx.id === id)
  }, result.id)
  assert.equal(removed, true)
  assert.deepEqual(errors, [])
  console.log(`PASS: HUD Volcano cast, disruption, terrain, ground/overview GPU and cleanup (${pixels} pixels)`)
} finally {
  await browser.close()
}
