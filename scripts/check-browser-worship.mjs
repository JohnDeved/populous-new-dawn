import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

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
  assert.deepEqual(errors, [])
  console.log('PASS: real stone-head click, seven distinct native standing slots, rendered original prayer frames, pause and four decoded/playable original worship sounds', audio)
} finally {
  await browser.close()
}
