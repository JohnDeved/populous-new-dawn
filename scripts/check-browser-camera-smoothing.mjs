import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    window.resetNavigation = () => {
      s.keys.clear()
      s.navigationPointer = null
      s.cameraPreviewButtons = null
      s.cameraTime = 0
      s.cameraMotion.active = 0
      s.resultCamera.active = 0
      s.viewTransition = null
      s.world.paused = false
      s.world.inputMask = 0
      s.world.flyby.flags &= ~1
      s.cameraBearing = (333 * Math.PI) / 1024
      s.focus({ x: -10.09375, z: -8.78125 })
    }
    window.bookmarkSounds = []
    s.onSound = cue => window.bookmarkSounds.push(cue)
  })
  await page.keyboard.press('z')
  assert.deepEqual(await page.evaluate(() => window.bookmarkSounds), [], 'unset recall is silent')
  const bookmarkKeys = ['z', 'x', 'c', 'v'], bookmarks = []
  for (let i = 0; i < bookmarkKeys.length; i++) {
    const bookmark = { x: (65500 + i * 4096) & 65535, y: (40 + i * 6144) & 65535, angle: i ? i * 511 : 2047 }
    bookmarks.push(bookmark)
    await page.evaluate(bookmark => {
      const s = window.testScene
      s.cameraMotion.active = 0
      Object.assign(s.cameraPosition, bookmark)
      s.viewPoint = { x: bookmark.x / 256 - 8, z: -(bookmark.y / 256 + 8) }
      s.cameraBearing = bookmark.angle * Math.PI / 1024
      s.updateView()
    }, bookmark)
    await page.keyboard.press(`Shift+${bookmarkKeys[i]}`)
  }
  await page.evaluate(() => {
    const s = window.testScene
    Object.assign(s.cameraPosition, { x: 12000, y: 28000, angle: 123 })
    s.viewPoint = { x: 12000 / 256 - 8, z: -(28000 / 256 + 8) }
    s.cameraBearing = 123 * Math.PI / 1024
    s.updateView()
  })
  for (let i = 0; i < bookmarkKeys.length; i++) {
    await page.keyboard.press(bookmarkKeys[i])
    assert.deepEqual(await page.evaluate(() => window.testScene.cameraMotion.target), {
      x: (bookmarks[i].x & 0xfe00) | 0x100,
      y: (bookmarks[i].y & 0xfe00) | 0x100,
      angle: bookmarks[i].angle,
    })
  }
  assert.deepEqual(await page.evaluate(() => window.bookmarkSounds), [221, 221, 221, 221, 222, 222, 222, 222])
  await page.evaluate(() => {
    const s = window.testScene
    s.cameraMotion.active = 0
    s.world.inputMask = 64
  })
  await page.keyboard.press('z')
  assert.equal(await page.evaluate(() => window.testScene.cameraMotion.active), 0, 'flyby/input locks block recall')
  await page.evaluate(() => {
    const s = window.testScene
    s.world.inputMask = 0
    s.world.paused = true
    s.overview()
    for (let i = 0; i < 100 && s.overviewStage; i++) s.stepViewChange()
  })
  assert.deepEqual(
    await page.evaluate(() => ({
      active: window.testScene.overviewActive,
      stage: window.testScene.overviewStage,
    })),
    { active: true, stage: null },
    'enter overview through the shipped transition path'
  )
  const overviewReturn = await page.evaluate(() => ({ ...window.testScene.overviewReturn }))
  await page.keyboard.press('z')
  assert.deepEqual(
    await page.evaluate(() => {
      const s = window.testScene
      return {
        paused: s.world.paused,
        overview: s.overviewActive,
        stage: s.overviewStage,
        preset: s.viewPreset,
        bearing: s.cameraBearing,
        active: s.cameraMotion.active,
        target: s.cameraMotion.target,
      }
    }),
    {
      paused: true,
      overview: false,
      stage: null,
      preset: overviewReturn.preset,
      bearing: overviewReturn.bearing,
      active: 1,
      target: {
        x: (bookmarks[0].x & 0xfe00) | 0x100,
        y: (bookmarks[0].y & 0xfe00) | 0x100,
        angle: bookmarks[0].angle,
      },
    },
    'pause keeps camera controls available and recall leaves a real overview'
  )
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  const beforeModal = await page.evaluate(() => window.bookmarkSounds.length)
  await page.keyboard.press('x')
  assert.equal(await page.evaluate(() => window.bookmarkSounds.length), beforeModal, 'modal blocks recall')
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  assert.equal(await page.evaluate(async () => {
    const { AUDIO_CUES } = await import('/app/audio.ts')
    return AUDIO_CUES.includes(221) && AUDIO_CUES.includes(222)
  }), true)
  await page.evaluate(() => window.resetNavigation())
  const runs = await page.evaluate(async () => {
    const { stepCameraInput } = await import('/app/camera-input.ts'),
      s = window.testScene,
      runs = []
    for (const keys of [['w'], ['q'], ['w', 'a', 'e']]) {
      const buttons = keys.length === 3 ? 37 : keys[0] === 'w' ? 1 : 16,
        expected = { x: 65000, y: 200, angle: 333 },
        velocity = { turn: 0, forward: 0, side: 0 }
      for (let i = 0; i < 48; i++) stepCameraInput(expected, velocity, buttons, 24)
      for (const hz of [5, 30, 60, 120, 144, 240, 0]) {
        window.resetNavigation()
        keys.forEach(k => s.keys.add(k))
        const views = new Set()
        let missing = 0,
          last = '',
          remaining = 2,
          frames = 0
        for (let i = 0; remaining > 1e-9; i++) {
          const dt = Math.min(remaining, hz ? 1 / hz : [0.007, 0.013, 0.28, 0.6, 0.1][i % 5])
          s.updateCameraMotion(dt)
          if (Math.abs(s.viewPoint.x) > 128 || Math.abs(s.viewPoint.z) > 128)
            throw new Error('Fractional views must retain the canonical wrapped map copy')
          remaining -= dt
          frames++
          const key = [s.view.rawCenter.x, s.view.rawCenter.y, ...s.view.projection.matrix].join(
            ','
          )
          if (key === last) missing++
          views.add(key)
          last = key
        }
        runs.push({
          keys,
          hz,
          frames,
          expected,
          actual: { ...s.cameraPosition },
          distinct: views.size,
          missing,
        })
      }
    }
    return runs
  })
  for (const run of runs) {
    assert.deepEqual(run.actual, run.expected, JSON.stringify(run))
    assert.equal(run.missing, 0, JSON.stringify(run))
    assert.equal(run.distinct, run.frames, JSON.stringify(run))
  }
  await page.evaluate(() => window.resetNavigation())
  await page.keyboard.down('w')
  const first = await page.evaluate(() => {
    const s = window.testScene
    const before = { ...s.view.rawCenter }
    s.updateCameraMotion(1 / 240)
    return {
      before,
      owned: { ...s.cameraPosition },
      displayed: { ...s.viewPoint },
      raw: { ...s.view.rawCenter },
    }
  })
  assert.deepEqual(first.owned, { x: 65000, y: 200, angle: 333 })
  assert.notDeepEqual(first.raw, first.before, 'The first high-refresh frame must respond')
  await page.keyboard.up('w')
  const released = await page.evaluate(() => {
    const s = window.testScene
    s.updateCameraMotion(1 / 240)
    const displayed = { ...s.viewPoint }
    for (let i = 0; i < 24; i++) s.updateCameraMotion(1 / 24)
    return { displayed, after: { ...s.viewPoint } }
  })
  assert.deepEqual(
    released.displayed,
    first.displayed,
    'Key release must not undo the displayed fraction'
  )
  assert.deepEqual(released.after, first.displayed, 'Momentum-off release must not drift')
  const focus = await page.evaluate(async () => {
    const s = window.testScene,
      { stepCameraMotion } = await import('/app/camera-motion.ts')
    window.resetNavigation()
    s.focus({ x: 2, z: 30 }, { animate: true })
    const expected = { ...s.cameraPosition },
      motion = structuredClone(s.cameraMotion),
      views = new Set(),
      mismatches = []
    let frames = 0,
      steps = 0
    for (; frames < 2400 && s.cameraMotion.active; frames++) {
      s.updateCameraMotion(1 / 240)
      views.add([s.view.rawCenter.x, s.view.rawCenter.y].join(','))
      if ((frames + 1) % 10 === 0) {
        stepCameraMotion(motion, expected, 0, { rotate: () => {}, globe: () => {} })
        steps++
        if (
          JSON.stringify(s.cameraPosition) !== JSON.stringify(expected) ||
          JSON.stringify(s.cameraMotion) !== JSON.stringify(motion)
        )
          mismatches.push(frames)
      }
    }
    return {
      frames,
      steps,
      distinct: views.size,
      mismatches,
      active: s.cameraMotion.active,
      actual: s.cameraPosition,
      expected,
    }
  })
  assert.equal(focus.active, 0)
  assert.deepEqual(focus.mismatches, [], 'Preview must not mutate the owned focus schedule')
  assert.deepEqual(focus.actual, focus.expected)
  assert.ok(focus.distinct > focus.steps * 3, JSON.stringify(focus))
  const pixels = await page.evaluate(() => {
    const s = window.testScene,
      preview = s.previewCamera,
      skyUpdate = s.updateSky,
      gl = s.renderer.getContext(),
      results = []
    // Isolate camera pixels from independently advancing cloud motion.
    s.updateSky = () => {}
    for (const smooth of [false, true]) {
      window.resetNavigation()
      s.cameraBearing = 0
      s.focus({ x: 2, z: 30 })
      s.previewCamera = smooth ? preview : () => false
      s.keys.add('q')
      const frames = []
      for (let i = 0; i < 3; i++) {
        s.updateCameraMotion(1 / 240)
        s.animate(s.previous)
        cancelAnimationFrame(s.frame)
        const data = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
        gl.readPixels(
          0,
          0,
          gl.drawingBufferWidth,
          gl.drawingBufferHeight,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          data
        )
        frames.push(data)
      }
      const changed = frames.slice(1).map((frame, i) => {
        let count = 0
        for (let j = 0; j < frame.length; j += 4)
          if (
            frame[j] !== frames[i][j] ||
            frame[j + 1] !== frames[i][j + 1] ||
            frame[j + 2] !== frames[i][j + 2]
          )
            count++
        return count
      })
      results.push({ smooth, changed })
    }
    s.previewCamera = preview
    s.updateSky = skyUpdate
    return results
  })
  assert.deepEqual(pixels[0].changed, [0, 0], 'The old camera repeats pixels between native steps')
  assert.ok(
    pixels[1].changed.every(count => count > 100),
    'Fractional views must reach actual GPU output'
  )
  await page.screenshot({ path: '/private/tmp/populous-camera-smoothing.png' })
  assert.deepEqual(errors, [])
  console.log(
    'PASS: four original camera bookmarks plus native endpoints and a new projected view on every frame at 5–240 Hz, seam crossing, diagonal turning, actual key response/release',
    JSON.stringify({ runs, focus, pixels })
  )
} finally {
  await browser.close()
}
