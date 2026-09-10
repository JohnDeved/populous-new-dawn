import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const failed = []
  page.on('response', r => {
    if (r.url().includes('/original/audio/') && !r.ok()) failed.push([r.url(), r.status()])
  })
  // Retrieve the actual React-owned soundscape, without a shipped debug API.
  await page.evaluate(() => {
    let fiber =
      document.querySelector('main')[
        Object.keys(document.querySelector('main')).find(k => k.startsWith('__reactFiber'))
      ]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (
          hook.memoizedState?.current?.buffers instanceof Map &&
          'randomState' in hook.memoizedState.current
        )
          window.testAudio = hook.memoizedState.current
  })
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
  await page.waitForFunction(
    () => window.testAudio?.enabled && window.testAudio.music?.element.readyState >= 2
  )
  const before = await page.evaluate(() => {
    const a = window.testAudio
    window.analyser = a.context.createAnalyser()
    window.analyser.fftSize = 2048
    a.master.connect(window.analyser)
    window.musicAnalyser = a.context.createAnalyser()
    a.music.media.connect(window.musicAnalyser)
    return {
      bank: a.music.bank,
      drone: a.music.drone,
      state: a.context.state,
      musicPaused: a.music.element.paused,
      decodedMusic: a.music.clips.length,
      buffers: a.buffers.size,
    }
  })
  assert.equal(before.state, 'running')
  assert.equal(before.musicPaused, false)
  assert.ok(before.decodedMusic === 3 || before.decodedMusic === 4)
  const peaks = { mix: 0, music: 0 }
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(250)
    const value = await page.evaluate(() =>
      [window.analyser, window.musicAnalyser].map(a => {
        const values = new Float32Array(a.fftSize)
        a.getFloatTimeDomainData(values)
        return Math.max(...values.map(Math.abs))
      })
    )
    peaks.mix = Math.max(peaks.mix, value[0])
    peaks.music = Math.max(peaks.music, value[1])
  }
  assert.ok(peaks.mix > 0.001 && peaks.music > 0.001, JSON.stringify(peaks))
  const mixing = await page.evaluate(async () => {
    const a = window.testAudio
    clearInterval(a.backgroundTimer)
    a.backgroundTimer = null
    a.stopAll()
    const original = a.environment
    const lowland = { total: 81, low: 81, high: 0, water: 0, trees: false, overview: false, activity: 0 }
    a.environment = lowland
    a.updateBackground()
    const land = a.ambientVoices.get(29)
    await new Promise(resolve => setTimeout(resolve, 60))
    const initial = land.gain.gain.value
    a.environment = { ...lowland, low: 0, water: 81 }
    a.updateBackground()
    await new Promise(resolve => setTimeout(resolve, 60))
    const sea = a.ambientVoices.get(32)
    const overWater = { land: land.gain.gain.value, sea: sea.gain.gain.value }
    a.environment = lowland
    a.updateBackground()
    await new Promise(resolve => setTimeout(resolve, 60))
    const returned = { land: land.gain.gain.value, sea: sea.gain.gain.value }
    const sameVoices = a.ambientVoices.get(29) === land && a.ambientVoices.get(32) === sea
    a.environment = { ...lowland, overview: true }
    a.updateBackground()
    const globe = a.ambientVoices.get(33)
    a.environment = lowland
    a.updateBackground()
    await new Promise(resolve => setTimeout(resolve, 60))
    const globeGain = globe.gain.gain.value
    a.stopAll()
    a.environment = lowland
    a.updateBackground()
    const replacement = a.ambientVoices.get(29)
    await new Promise(resolve => setTimeout(resolve, 60))
    const restartRetained = replacement !== land && a.ambientVoices.get(29) === replacement
    a.environment = original
    await a.setPaused(false)
    return { initial, overWater, returned, sameVoices, globeGain, restartRetained }
  })
  assert.ok(Math.abs(mixing.initial - 32 / 127) < 1e-7)
  assert.equal(mixing.overWater.land, 0)
  assert.ok(Math.abs(mixing.overWater.sea - 32 / 127) < 1e-7)
  assert.equal(mixing.returned.sea, 0)
  assert.equal(mixing.returned.land, mixing.initial)
  assert.equal(mixing.sameVoices, true)
  assert.ok(Math.abs(mixing.globeGain - 31 / 127) < 1e-7)
  assert.equal(mixing.restartRetained, true)
  const environment = await page.evaluate(() => {
    const a = window.testAudio,
      s = window.testScene
    const sample = point => {
      s.viewPoint = point
      s.updateView()
      const environment = s.soundEnvironment()
      s.renderer.render(s.scene, s.camera)
      return environment
    }
    const home = sample({ ...s.viewPoint })
    let ocean
    for (const point of [{x:80,z:80},{x:-80,z:-80},{x:127,z:-127},{x:-127,z:127}]) {
      const candidate = sample(point)
      if (candidate.water > (ocean?.water ?? -1)) ocean = candidate
    }
    a.environment = ocean ?? home
    a.updateBackground()
    return { home, ocean, layers: [...a.ambientVoices.keys()] }
  })
  assert.ok(environment.layers.length > 0)
  assert.ok(environment.ocean.water > 0)
  await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  await page.waitForFunction(
    () => window.testAudio.context.state === 'suspended' && window.testAudio.music.element.paused
  )
  const paused = await page.evaluate(() => [
    window.testAudio.context.currentTime,
    window.testAudio.music.element.currentTime,
  ])
  await page.waitForTimeout(500)
  const still = await page.evaluate(() => [
    window.testAudio.context.currentTime,
    window.testAudio.music.element.currentTime,
  ])
  assert.deepEqual(still, paused)
  await page.getByRole('button', { name: 'Resume game', exact: true }).click()
  await page.waitForFunction(
    () => window.testAudio.context.state === 'running' && !window.testAudio.music.element.paused
  )
  await page.waitForTimeout(300)
  const resumed = await page.evaluate(() => window.testAudio.music.element.currentTime)
  assert.ok(resumed > paused[1])
  const timing = await page.evaluate(async () => {
    const a = window.testAudio
    a.setMusicVolume(0)
    await new Promise(resolve => setTimeout(resolve, 100))
    const gain = a.music.gain.gain.value
    a.setMusicVolume(0.65)
    a.music.section.activity = 2
    a.environment.activity = 2
    a.music.nextTime = a.context.currentTime + 0.05
    a.music.schedule()
    return { gain, sources: a.music.sources.size, future: a.music.nextTime - a.context.currentTime }
  })
  assert.equal(timing.gain, 0)
  assert.ok(timing.sources > 0 && timing.future > 3)
  await page.getByRole('button', { name: 'Mute sound', exact: true }).click()
  await page.waitForFunction(() => window.testAudio.context.state === 'suspended')
  assert.deepEqual(
    await page.evaluate(() => ({
      enabled: window.testAudio.enabled,
      voices: window.testAudio.active.size,
      ambience: window.testAudio.ambientVoices.size,
      timer: window.testAudio.backgroundTimer,
      paused: window.testAudio.music.element.paused,
    })),
    { enabled: false, voices: 0, ambience: 0, timer: null, paused: true }
  )
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
  await page.waitForFunction(
    () => window.testAudio.enabled && window.testAudio.context.state === 'running'
  )
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('slider', { name: 'Music volume', exact: true }).fill('0.5')
  const controls = await page.evaluate(() => {
    const dialog = document.querySelector('.game-dialog')
    const bounds = dialog.getBoundingClientRect()
    return {
      music: window.testAudio.musicVolume,
      fits: [...dialog.querySelectorAll('.audio-settings input')].every(input => {
        const r = input.getBoundingClientRect()
        return r.left >= bounds.left && r.right <= bounds.right
      }),
      overflow: dialog.scrollWidth > dialog.clientWidth,
    }
  })
  assert.deepEqual(controls, { music: 0.5, fits: true, overflow: false })
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await page.waitForFunction(() => window.testAudio.context.state === 'running')
  const assets = await page.evaluate(async () => {
    const { default: manifest } = await import('/app/original-music.json', {
      with: { type: 'json' },
    })
    const a = window.testAudio,
      media = new Audio(),
      durations = []
    const node = a.context.createMediaElementSource(media),
      analyser = a.context.createAnalyser()
    node.connect(analyser)
    for (const track of manifest.drones) {
      media.src = `/original/audio/${track.file}`
      await new Promise((resolve, reject) => {
        media.addEventListener('loadedmetadata', resolve, { once: true })
        media.addEventListener('error', () => reject(new Error('Music decode failed')), {
          once: true,
        })
        media.load()
      })
      const duration = media.duration
      media.currentTime = 10
      await media.play()
      let peak = 0
      for (let i = 0; i < 6; i++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        const values = new Float32Array(analyser.fftSize)
        analyser.getFloatTimeDomainData(values)
        peak = Math.max(peak, ...values.map(Math.abs))
      }
      media.pause()
      durations.push({ duration, expected: track.frames / track.rate, peak })
    }
    media.removeAttribute('src')
    media.load()
    node.disconnect()
    analyser.disconnect()
    let drums = 0
    for (const bank of manifest.drums)
      for (const clip of bank) {
        if (!clip.file) continue
        const response = await fetch(`/original/audio/${clip.file}`)
        const buffer = await a.context.decodeAudioData(await response.arrayBuffer())
        if (
          Math.abs(buffer.duration - clip.frames / clip.rate) > 1 / a.context.sampleRate ||
          buffer.numberOfChannels !== 2
        )
          throw new Error('Percussion format mismatch')
        drums++
      }
    return {
      durations,
      drums,
      retainedDrumBytes: a.music.clips.reduce(
        (sum, b) => sum + (b ? b.length * b.numberOfChannels * 4 : 0),
        0
      ),
      sampleRate: a.context.sampleRate,
    }
  })
  assert.equal(assets.drums, 29)
  for (const track of assets.durations) {
    assert.ok(Math.abs(track.duration - track.expected) < 0.06)
    assert.ok(track.peak > 0.001)
  }
  const combatMusic = await page.evaluate(async () => {
    const { addUnit, command, tick } = await import('/app/model.ts')
    const w = window.testScene.world
    w.speed = 0
    w.units = []
    w.buildings = []
    w.fights = []
    w.shrines = []
    w.terrain.fill(3)
    w.terrainVersion++
    const attacker = addUnit(w, 'blue', 'warrior', { x: 0, z: 0 })
    const defender = addUnit(w, 'red', 'warrior', { x: 1, z: 0 })
    const life = [attacker.hp, defender.hp]
    w.selected = [attacker.id]
    command(w, defender)
    tick(w, 1 / 12)
    return { activity: w.musicActivity, state: attacker.fight?.motion?.state, life, after: [attacker.hp, defender.hp] }
  })
  assert.equal(combatMusic.activity, 2)
  assert.equal(combatMusic.state, 29)
  assert.deepEqual(combatMusic.after, combatMusic.life)
  await page.waitForFunction(() => window.testAudio.music.section.activity === 2)
  await page.evaluate(async () => {
    const { tick } = await import('/app/model.ts')
    const w = window.testScene.world
    w.units = []
    w.fights = []
    tick(w, 1 / 12)
  })
  await page.waitForFunction(() => window.testAudio.music.section.activity === 0)
  const disposal = await page.evaluate(async () => {
    const a = window.testAudio,
      music = a.music,
      ctx = a.context
    a.reset()
    const reset = {
      time: music.element.currentTime,
      voices: a.active.size,
      ambience: a.ambientVoices.size,
      drums: music.sources.size,
    }
    a.dispose()
    await new Promise(resolve => setTimeout(resolve, 50))
    return {
      reset,
      state: ctx.state,
      voices: a.active.size,
      buffers: a.buffers.size,
      music: a.music,
      timer: a.backgroundTimer,
      src: music.element.getAttribute('src'),
    }
  })
  assert.deepEqual(disposal, {
    reset: { time: 0, voices: 0, ambience: 0, drums: 0 },
    state: 'closed',
    voices: 0,
    buffers: 0,
    music: null,
    timer: null,
    src: null,
  })
  assert.deepEqual(failed, [])
  assert.deepEqual(errors, [])
  if (process.argv.includes('--record'))
    await writeFile(
      'references/performance/2026-09-10-background-audio.json',
      JSON.stringify(
        {
          browser: await browser.version(),
          headless: true,
          viewport: { width: 1440, height: 1000 },
          before,
          peaks,
          mixing,
          environment,
          timing,
          controls,
          combatMusic,
          assets,
          disposal,
          limitation:
            'Audio decode/output/lifecycle and retained PCM buffer evidence; not human listening or hardware frame-time/total-process-memory measurement.',
        },
        null,
        2
      ) + '\n'
    )
  console.log(
    'PASS: real UI audio activation, original streamed music and environmental samples produce signal; pause/resume, music gain, percussion scheduling, mute/re-enable, restart and disposal',
    JSON.stringify({ before, peaks, mixing, environment, timing, combatMusic, assets, disposal })
  )
} finally {
  await browser.close()
}
