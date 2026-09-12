import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { effectPixels, openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene, w = s.world
    w.speed = 0
    w.manaWorld.gameFlags = 32
    w.units = w.units.filter(u => u.team === 'blue')
    w.selected = w.units.map(u => u.id)
    s.focus(w.shrines.find(h => h.kind === 'bridge'))
    s.onChange()
  })
  const point = await page.evaluate(() => {
    const s = window.testScene, h = s.world.shrines.find(h => h.kind === 'bridge'), p = s.screen(h), r = s.container.getBoundingClientRect()
    return { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }
  })
  await page.mouse.click(point.x, point.y)
  assert.equal(await page.evaluate(() => window.testScene.world.units[0].native?.commandStatus), 27)
  const result = await page.evaluate(async () => {
    const s = window.testScene, w = s.world, { advanceGame } = await import('/app/game-clock.ts')
    const { liveWorshippers } = await import('/app/live-worship.ts')
    cancelAnimationFrame(s.frame)
    w.speed = 1
    const frames = new Set(), phases = new Set()
    for (let i = 0; i < 360; i++) {
      advanceGame(w, s.gameClock, 1 / 24)
      for (const u of w.units) if ([64, 744].includes(u.native.object)) {
        frames.add(`${u.native.object}:${u.native.f2}`)
        phases.add(u.native.substate)
      }
    }
    w.paused = true
    s.onChange(); s.animate(s.previous); cancelAnimationFrame(s.frame)
    const head = w.shrines.find(h => h.kind === 'bridge')
    return {
      roster: liveWorshippers(w, head).map(p => p.id),
      units: w.units.map(u => ({ id: u.id, x: u.x, z: u.z, object: u.native.object, visible: s.unitMeshes.get(u.id)?.visible, frame: s.unitMeshes.get(u.id)?.userData.frame })),
      frames: [...frames], phases: [...phases],
      sounds: w.sounds.filter(e => e.cue === 82).map(e => e.owner),
      paused: JSON.stringify(w.units),
    }
  })
  assert.equal(result.roster.length, 7)
  assert.equal(new Set(result.units.map(u => `${u.x},${u.z}`)).size, 7)
  assert.ok(result.units.every(u => u.visible && Number.isInteger(u.frame) && [64, 744].includes(u.object)))
  assert.ok(result.frames.length > 6, JSON.stringify(result.frames))
  assert.ok(result.phases.includes(2) && result.phases.includes(3))
  assert.ok(result.sounds.length > 0 && result.sounds.every(id => result.roster.includes(id)))
  assert.equal(await page.evaluate(async () => {
    const s = window.testScene, { advanceGame } = await import('/app/game-clock.ts')
    advanceGame(s.world, s.gameClock, 2)
    return JSON.stringify(s.world.units)
  }), result.paused)
  await page.evaluate(() => {
    const s=window.testScene
    s.world.paused=false; s.world.speed=0; s.onChange()
  })
  await page.mouse.move(250,900)
  await page.waitForTimeout(100)
  await page.screenshot({ path: '/private/tmp/populous-native-worship.png' })
  // Decode every original prayer sample through the same Web Audio loader.
  const audio = await page.evaluate(async () => {
    const { Soundscape, AUDIO_CUES } = await import('/app/audio.ts')
    const s = new Soundscape()
    await s.enable()
    const buffers = [270,271,272,273].map(id => s.buffers.get(`sound-${id}`)?.duration ?? 0)
    const before = s.active.size
    s.cue(82)
    const played = s.active.size > before
    s.dispose()
    return { enabled: AUDIO_CUES.includes(82), buffers, played, released: s.active.size === 0 }
  })
  assert.ok(audio.enabled && audio.played && audio.released && audio.buffers.every(d => d > 0))
  const rewards = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { createGift } = await import('/app/model.ts')
    cancelAnimationFrame(s.frame)
    Object.assign(w, {
      speed: 0,
      paused: true,
      units: [],
      buildings: [],
      shrines: [],
      trees: [],
      effects: [],
      gifts: [],
      pendingTime: 0,
    })
    w.manaWorld.gameFlags = 32
    w.land.heights.fill(384)
    w.land.flags.fill(0)
    w.terrain.fill(384 / 45)
    w.landVersion++
    w.terrainVersion = w.landVersion
    const gifts = [
      createGift(w, 'vault', { x: -4, z: 0 }),
      createGift(w, 'lightning', { x: 0, z: 0 }),
      createGift(w, 'bridge', { x: 4, z: 0 }),
    ]
    s.focus({ x: 0, z: 0 })
    s.onChange()
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    return gifts.map(gift => {
      const group = s.fxMeshes.get(gift.id),
        glow = group.userData.glow
      return {
        id: gift.id,
        reward: gift.reward,
        phase: gift.phase,
        remaining: gift.remaining,
        frame: group.userData.frame,
        glowFrame: glow.userData.frame,
        layers: group.userData.layers.length,
        glowLayers: glow.userData.layers.length,
        height: Math.round(group.position.y * 128),
        glowOffset: Math.round(glow.position.y * 128),
        visible: group.visible,
      }
    })
  })
  assert.deepEqual(
    rewards.map(({ reward, phase, remaining, frame, glowFrame, height, glowOffset, visible }) => ({
      reward,
      phase,
      remaining,
      frame,
      glowFrame,
      height,
      glowOffset,
      visible,
    })),
    [
      { reward: 'vault', phase: 6, remaining: 82, frame: 1077, glowFrame: 1417, height: 1184, glowOffset: -80, visible: true },
      { reward: 'lightning', phase: 6, remaining: 82, frame: 1059, glowFrame: 1417, height: 1184, glowOffset: -80, visible: true },
      { reward: 'bridge', phase: 6, remaining: 82, frame: 1068, glowFrame: 1417, height: 1184, glowOffset: -80, visible: true },
    ]
  )
  assert.ok(rewards.every(reward => reward.layers > 0 && reward.glowLayers > 0))
  const rewardPixels = await effectPixels(page, rewards.map(reward => reward.id))
  assert.ok(rewardPixels > 20, `native reward sprites must reach GPU pixels (${rewardPixels})`)
  await page.screenshot({ path: '/private/tmp/populous-worship-rewards.png' })
  const lifecycle = await page.evaluate(async ids => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts'),
      phases = []
    advanceGame(w, s.gameClock, 10)
    const paused = w.gifts.every(gift => gift.phase === 6 && gift.remaining === 82)
    w.paused = false
    w.speed = 1
    for (let visit = 0; visit < 6; visit++) {
      advanceGame(w, s.gameClock, 1 / 12)
      w.paused = true
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      phases.push(ids.map(id => {
        const gift = w.gifts.find(gift => gift.id === id)
        return [gift.phase, gift.remaining, s.fxMeshes.get(id).visible]
      }))
      w.paused = false
    }
    advanceGame(w, s.gameClock, 76 / 12)
    w.paused = true
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    return {
      paused,
      phases,
      gifts: w.gifts.length,
      rewards: ids.filter(id => s.fxMeshes.has(id)).length,
      shots: { bridge: w.shots.bridge, lightning: w.shots.lightning },
      unlockedCamp: w.unlockedCamp,
    }
  }, rewards.map(reward => reward.id))
  assert.equal(lifecycle.paused, true)
  assert.deepEqual(lifecycle.phases.map(phase => phase[0]), [
    [5, 81, true],
    [4, 80, true],
    [3, 79, true],
    [2, 78, true],
    [1, 77, true],
    [0, 76, false],
  ])
  assert.deepEqual(
    lifecycle.phases.map(phase => new Set(phase.map(item => JSON.stringify(item))).size),
    [1, 1, 1, 1, 1, 1]
  )
  assert.deepEqual(
    { gifts: lifecycle.gifts, rewards: lifecycle.rewards, shots: lifecycle.shots, unlockedCamp: lifecycle.unlockedCamp },
    { gifts: 0, rewards: 0, shots: { bridge: 1, lightning: 1 }, unlockedCamp: true }
  )
  assert.deepEqual(errors, [])
  console.log(`PASS: live worship plus three native reward sprites (${rewardPixels} GPU pixels), six-visit hide, 82-turn delivery, pause and original audio`)
} finally {
  await browser.close()
}
