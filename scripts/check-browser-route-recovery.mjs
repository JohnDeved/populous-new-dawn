import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true }), reports = []
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 3440, height: 1440 }]) {
    const { page, errors } = await openGame(browser)
    await page.setViewportSize(viewport)
    await page.evaluate(async () => {
      const s = window.testScene, w = s.world, m = await import('/app/model.ts')
      cancelAnimationFrame(s.frame)
      const version = w.terrainVersion + 1
      Object.assign(w, m.createWorld(), { units: [], buildings: [], shrines: [], trees: [], inputMask: 0, speed: 0 })
      w.terrainVersion = version; w.terrain.fill(0); w.manaWorld.gameFlags = 96; w.flyby.flags = 0
      for (let z = -9; z <= 9; z++) for (let x = -29; x <= 29; x++)
        if (x <= -10 || x >= 10) w.terrain[(z + 48) * m.GRID + x + 48] = 3
      const b = m.addBuilding(w, 'red', 'hut', { x: 20, z: 0 })
      const units = Array.from({ length: 6 }, (_, i) => m.addUnit(w, 'blue', 'warrior', { x: -20, z: i / 4 }))
      window.recovery = { b, units }; s.soundSerial = 0
      m.setSelection(w, units.map(u => u.id))
      s.focus({ x: 20, z: 2 }); s.onChange(); s.animate(s.previous); cancelAnimationFrame(s.frame)
    })
    for (const [z, ctrl] of [[0, true], [6, false]]) {
      const point = await page.evaluate(z => {
        const s = window.testScene, p = s.screen({ x: 20, z }), r = s.container.getBoundingClientRect()
        return { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }
      }, z)
      if (ctrl) await page.keyboard.down('Control')
      await page.mouse.click(point.x, point.y)
      if (ctrl) await page.keyboard.up('Control')
    }
    const result = await page.evaluate(async () => {
      const s = window.testScene, w = s.world, { units, b } = window.recovery
      const { advanceGame } = await import('/app/game-clock.ts')
      const advance = () => { w.speed = 1; advanceGame(w, s.gameClock, 1 / 12); w.speed = 0 }
      const people = units.map(u => u.native), ids = people[0].commands.filter(Boolean)
      const models = ids.map(id => w.buildingOrders.records[id].model)
      for (let i = 0; i < 70; i++) advance()
      const stopped = people.every(p => p.state === 33 && p.substate === 3 && !p.speed && !p.motionGroup)
      const shared = ids.every(id => w.buildingOrders.records[id].references === 6)
      const notices = w.sounds.filter(e => e.cue === 225).length
      s.focus({ x: -20, z: 0 }); s.onChange(); s.animate(s.previous); cancelAnimationFrame(s.frame)
      const visible = units.every(u => s.unitMeshes.get(u.id)?.visible)
      const before = JSON.stringify(people)
      w.paused = true; w.speed = 1; advanceGame(w, s.gameClock, 10); w.speed = 0; w.paused = false
      const paused = JSON.stringify(people) === before
      w.terrain.fill(3); w.terrainVersion++
      let resumed = false
      for (let i = 0; i < 1500 && w.buildingOrders.active; i++) {
        advance(); resumed ||= people.every(p => p.state === 10)
      }
      s.onChange(); s.animate(s.previous); cancelAnimationFrame(s.frame)
      return { viewport: [innerWidth, innerHeight], models, stopped, shared, notices, visible, paused, resumed,
        destroyed: b.hp === 0, arrived: units.every(u => u.hp > 0 && u.x > 18 && u.z > 3), orders: w.buildingOrders.active }
    })
    assert.deepEqual(result.models, [19, 3])
    for (const key of ['stopped', 'shared', 'visible', 'paused', 'resumed', 'destroyed', 'arrived']) assert.equal(result[key], true, key)
    assert.equal(result.notices, 6); assert.equal(result.orders, 0)
    if (viewport.width === 1440) {
      await page.evaluate(() => {
        const main = document.querySelector('main')
        for (let fiber = main[Object.keys(main).find(k => k.startsWith('__reactFiber'))]; fiber; fiber = fiber.return)
          for (let hook = fiber.memoizedState; hook; hook = hook.next)
            if (hook.memoizedState?.current?.buffers instanceof Map) window.testAudio = hook.memoizedState.current
      })
      await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
      await page.waitForFunction(() => window.testAudio?.enabled)
      result.audio = await page.evaluate(async () => {
        const a = window.testAudio, s = window.testScene, w = s.world
        const { default: native } = await import('/app/original-sound.json', { with: { type: 'json' } })
        clearInterval(a.backgroundTimer); a.backgroundTimer = null; a.music.element.pause(); a.music.reset(); a.stopAll()
        const analyser = a.context.createAnalyser(); a.master.connect(analyser)
        const samples = new Set(), voices = [], dispatched = [], original = s.onSound
        s.onSound = (...args) => { dispatched.push(args.slice(0, 3)); return original(...args) }
        for (const cue of [45, 46, 47, 48, 225, 226]) {
          a.stopAll(); await new Promise(resolve => setTimeout(resolve, 80))
          for (const sample of native.cues[cue].samples) {
            const key = `${native.cues[cue].bank}-${sample}`
            if (!a.buffers.has(key)) throw new Error(`Missing decoded voice ${key}`)
            samples.add(key)
          }
          if (cue >= 225) {
            const { sound } = await import('/app/model.ts')
            sound(w, cue, { x: -100, z: -100 }); s.playWorldSounds()
          } else a.cue(cue)
          const active = a.active.size
          let peak = 0
          for (let i = 0; i < 12; i++) {
            await new Promise(resolve => setTimeout(resolve, 50))
            const values = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(values)
            peak = Math.max(peak, ...values.map(Math.abs))
          }
          voices.push({ cue, active, peak })
        }
        s.onSound = original; analyser.disconnect(); a.dispose()
        return { voices, dispatched, decodedSamples: samples.size,
          limitation: 'Actual decoded assets and isolated Web Audio output; not a human listening assessment or full native voice arbitration.' }
      })
      for (const voice of result.audio.voices) assert.ok(voice.active > 0 && voice.peak > .001, JSON.stringify(voice))
      assert.deepEqual(result.audio.dispatched, [[225, 1, 0], [226, 1, 0]])
    }
    assert.deepEqual(errors, []); reports.push(result); await page.close()
  }
  writeFileSync('references/performance/2026-09-11-failed-route-recovery.json', JSON.stringify({ browser: await browser.version(), headless: true, reports }, null, 2) + '\n')
  console.log(JSON.stringify(reports, null, 2))
} finally { await browser.close() }
