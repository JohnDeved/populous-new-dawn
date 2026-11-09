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
      { advanceGame } = await import('/app/game-clock.ts'),
      { swarmState } = await import('/app/swarm.ts')
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
      swarm = w.effects.find(fx => fx.swarm),
      state = swarmState(swarm.swarm),
      group = s.fxMeshes.get(swarm.id),
      beforePause = JSON.stringify({
        turn: w.turn,
        remaining: state.remaining,
        parent: [state.x, state.y, state.h],
        insect: [state.insects[0].x, state.insects[0].y, state.insects[0].h],
      })
    advanceGame(w, s.gameClock, 1)
    const afterPause = swarmState(w.effects.find(fx => fx.id === swarm.id).swarm)
    return {
      effect: swarm.id,
      panic: victim?.native?.state,
      hp: victim?.hp,
      shots: w.shots.swarm,
      cue: w.sounds.some(sound => sound.cue === 0xa4),
      remaining: state.remaining,
      insects: state.insects.length,
      visual: [group?.name, group?.children.length, group?.children[0]?.name],
      pauseStable:
        beforePause ===
        JSON.stringify({
          turn: w.turn,
          remaining: afterPause.remaining,
          parent: [afterPause.x, afterPause.y, afterPause.h],
          insect: [afterPause.insects[0].x, afterPause.insects[0].y, afterPause.insects[0].h],
        }),
      inventedText: /world bends to your will/i.test(w.message),
    }
  })
  assert.ok(result.effect)
  assert.equal(result.panic, 26)
  assert.ok(result.hp < 100)
  assert.equal(result.shots, 0)
  assert.equal(result.cue, true)
  assert.equal(result.insects, 60)
  assert.deepEqual(result.visual, ['swarm-insects', 60, 'swarm-insect'])
  assert.equal(result.pauseStable, true)
  assert.equal(result.inventedText, false)
  await page.waitForFunction(id => {
    const sprite = window.testScene.fxMeshes.get(id)?.children[0],
      image = sprite?.material?.map?.image
    return image?.width === 32 && image?.height === 32
  }, result.effect)
  assert.ok((await effectPixels(page, [result.effect])) > 10)

  assert.equal(await page.evaluate(() => window.testStore.saveCheckpoint()), true)
  await page.evaluate(() => window.testStore.loadCheckpoint())
  await page.waitForFunction(
    () => window.testSceneRef.current?.world === window.testStore.getWorld()
  )
  const restored = await page.evaluate(async id => {
    window.testScene = window.testSceneRef.current
    const s = window.testScene,
      w = s.world,
      { swarmState } = await import('/app/swarm.ts'),
      swarm = w.effects.find(fx => fx.id === id),
      state = swarmState(swarm.swarm)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    return {
      remaining: state.remaining,
      insects: state.insects.length,
      group: [s.fxMeshes.get(id)?.name, s.fxMeshes.get(id)?.children.length],
    }
  }, result.effect)
  assert.equal(restored.remaining, result.remaining)
  assert.equal(restored.insects, 60)
  assert.deepEqual(restored.group, ['swarm-insects', 60])

  const expired = await page.evaluate(async id => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts')
    for (let i = 0; w.effects.some(fx => fx.id === id) && i < 205; i++) {
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
  console.log('PASS: HUD Swarm casts, renders 60 original insects, affects its enemy, checkpoints, pauses, and expires')
} finally {
  await browser.close()
}
