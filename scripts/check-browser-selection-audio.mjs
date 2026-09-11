import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const main = document.querySelector('main')
    for (let f = main[Object.keys(main).find(k => k.startsWith('__reactFiber'))]; f; f = f.return)
      for (let h = f.memoizedState; h; h = h.next)
        if (h.memoizedState?.current?.buffers instanceof Map) window.testAudio = h.memoizedState.current
    window.testScene.world.speed = 0
  })
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
  await page.waitForFunction(() => window.testAudio.enabled && window.testAudio.backgroundTimer !== null)
  const loading = await page.evaluate(async () => {
    const a = window.testAudio
    clearInterval(a.backgroundTimer); a.backgroundTimer = null; a.music.element.pause(); a.music.reset(); a.stopAll()
    const analyser = a.context.createAnalyser(), data = new Float32Array(analyser.fftSize)
    a.master.connect(analyser)
    window.voicePeak = 0; window.voiceCalls = []
    window.voiceTimer = setInterval(() => {
      analyser.getFloatTimeDomainData(data)
      window.voicePeak = Math.max(window.voicePeak, ...data.map(Math.abs))
    }, 10)
    const cue = a.cue.bind(a)
    a.cue = (...args) => {
      const stop = cue(...args)
      window.voiceCalls.push({ cue: args[0], started: typeof stop === 'function' })
      return stop
    }
    const { SELECTION_CUES } = await import('/app/person-selection.ts')
    const { default: sounds } = await import('/app/original-sound.json', { with: { type: 'json' } })
    const keys = new Set([...SELECTION_CUES, 0x6a].flatMap(c => sounds.cues[c].samples.map(s => `${sounds.cues[c].bank}-${s}`)))
    for (const key of keys) if (!a.buffers.has(key)) throw new Error(`Voice not decoded: ${key}`)
    return { sampleRate: a.context.sampleRate, buffers: a.buffers.size, selectionBuffers: keys.size,
      selectionPcmBytes: [...keys].reduce((sum, key) => { const b = a.buffers.get(key); return sum + b.length * b.numberOfChannels * 4 }, 0) }
  })
  const screen = point => page.evaluate(point => {
    const s = window.testScene, p = s.screen(point), r = s.container.getBoundingClientRect()
    return { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }
  }, point)
  const resetAudio = async () => {
    await page.evaluate(() => window.testAudio.stopAll())
    await page.waitForTimeout(100)
    await page.evaluate(() => { window.voiceCalls = []; window.voicePeak = 0 })
  }
  const readAudio = async () => {
    await page.waitForTimeout(550)
    return page.evaluate(() => ({ calls: window.voiceCalls, peak: window.voicePeak, selected: window.testScene.world.selected.length }))
  }
  const setup = async (kinds) => {
    const ids = await page.evaluate(async kinds => {
      const s = window.testScene, w = s.world, m = await import('/app/model.ts')
      Object.assign(w, { units: [], buildings: [], shrines: [], trees: [], selected: [], speed: 0, paused: false })
      w.manaWorld.gameFlags = 0; w.terrain.fill(3); w.terrainVersion++
      for (const [i, kind] of kinds.entries()) m.addUnit(w, 'blue', kind, { x: i % 4, z: 8 + Math.floor(i / 4) })
      s.focus({ x: 2, z: 8 }); s.onChange()
      return w.units.map(u => u.id)
    }, kinds)
    await page.waitForFunction(ids => ids.every(id => window.testScene.unitMeshes.get(id)?.userData.bounds), ids)
    await resetAudio()
    return ids
  }
  const samples = []
  for (const [kind, cues] of [['brave', [0x58, 0x43, 0x44, 0x45]], ['shaman', [0x18]]]) {
    for (const [i, cue] of cues.entries()) {
      await setup(Array(i + 1).fill(kind))
      const a = await screen({ x: -4, z: 4 }), b = await screen({ x: 8, z: 14 })
      await page.mouse.move(a.x, a.y); await page.mouse.down()
      await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up()
      const audio = await readAudio()
      assert.equal(audio.selected, i + 1)
      assert.deepEqual(audio.calls, [{ cue, started: true }])
      assert.ok(audio.peak > .001, JSON.stringify({ kind, audio }))
      samples.push({ kind, count: i + 1, ...audio })
    }
  }
  // Specialist classes are not live yet; verify their existing native voice
  // selector through real playback without pretending they are playable people.
  for (const model of [4, 5]) for (const count of [1, 2, 3, 4]) {
    await resetAudio()
    const cue = await page.evaluate(async ({ model, count }) => {
      const { selectedGroupVoices } = await import('/app/person-selection.ts')
      const [cue] = selectedGroupVoices(Array(count).fill(model))
      window.testAudio.cue(cue)
      return cue
    }, { model, count })
    const audio = await readAudio()
    assert.deepEqual(audio.calls, [{ cue, started: true }]); assert.ok(audio.peak > .001)
    samples.push({ model, count, directPlayback: true, ...audio })
  }
  // A held sprite press isolates the native acknowledgement from the release voice.
  const [id] = await setup(['brave'])
  const point = await page.evaluate(id => {
    const s = window.testScene, r = s.container.getBoundingClientRect(), p = s.unitScreen(id), b = s.unitMeshes.get(id).userData.bounds
    return { x: r.left + (p.x + 1) * r.width / 2 + (b.left + b.right) / 2, y: r.top + (1 - p.y) * r.height / 2 + (b.top + b.bottom) / 2 }
  }, id)
  await page.mouse.move(point.x, point.y); await page.mouse.down()
  const press = await readAudio()
  assert.deepEqual(press.calls, [{ cue: 0x6a, started: true }]); assert.ok(press.peak > .001)
  await resetAudio(); await page.mouse.up()
  const release = await readAudio()
  assert.deepEqual(release.calls, [{ cue: 0x58, started: true }]); assert.ok(release.peak > .001)
  await setup(['brave', 'brave', 'brave', 'brave', 'brave'])
  const button = page.getByRole('button', { name: 'Select brave', exact: true })
  await button.click({ modifiers: ['Shift'] })
  const hud = await readAudio()
  assert.deepEqual(hud.calls, [{ cue: 0x45, started: true }]); assert.ok(hud.peak > .001); assert.equal(hud.selected, 5)
  await page.keyboard.press('Escape'); await resetAudio()
  await button.click({ modifiers: ['Control'] })
  const five = await readAudio()
  assert.equal(five.selected, 5); assert.deepEqual(five.calls, []); assert.equal(five.peak, 0)
  const reuse = await page.evaluate(async () => {
    const a = window.testAudio, buffers = new Map(a.buffers)
    a.mute(); await a.enable(); clearInterval(a.backgroundTimer); a.backgroundTimer = null
    const retained = [...buffers].every(([key, value]) => a.buffers.get(key) === value)
    clearInterval(window.voiceTimer); a.dispose()
    return retained
  })
  assert.equal(reuse, true); assert.deepEqual(errors, [])
  const report = { browser: await browser.version(), headless: true, loading, samples, press, release, hud, five, reuse,
    limitation: 'Actual mouse/drag/HUD input, decoded original PCM and isolated Web Audio output. No human listening, native voice-priority arbitration or hardware FPS claim.' }
  writeFileSync('references/performance/2026-09-11-selection-audio.json', JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
