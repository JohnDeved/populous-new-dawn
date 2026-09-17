// Start npm run dev, then node scripts/check-browser-camera-view.mjs.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'
import { openGame, settleView } from './browser-game.mjs'
import native from '../app/original-camera.json' with { type: 'json' }
// Keep captures local to this checkout; parallel workers must not share /tmp names.
const artifacts = fileURLToPath(new URL('../work/browser-camera-view/', import.meta.url))
mkdirSync(artifacts, { recursive: true })
const report = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  mode: 'headless deterministic frame schedules; not hardware performance',
  schedules: [],
}
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    s.cameraTime = 0
    s.focus({ x: 2, z: 30 })
  })
  const state = () =>
    page.evaluate(() => {
      const s = window.testScene
      return {
        preset: s.viewPreset,
        remaining: s.viewTransition?.remaining ?? 0,
        config: s.view.config,
        point: s.viewPoint,
        bearing: s.cameraBearing,
        overview: s.overviewActive,
      }
    })
  const advance = (frames = 18) =>
    page.evaluate(frames => {
      const s = window.testScene
      for (let i = 0; i < frames; i++) s.updateCameraMotion(1 / 24)
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      s.renderer.render(s.scene, s.camera)
    }, frames)
  const start = await state()
  const index = native.views.findIndex(
    v => v.width === start.config.width && v.height === start.config.height
  )
  await page.keyboard.press('=')
  let view = await state()
  assert.equal(view.preset, 3)
  assert.equal(view.remaining, 18)
  assert.deepEqual(
    view.config,
    start.config,
    'A view request preserves the current image before advancing'
  )
  await advance(9)
  view = await state()
  assert.ok(view.config.scale > start.config.scale)
  assert.equal(view.remaining, 9)
  await advance(9)
  view = await state()
  assert.equal(view.remaining, 0)
  assert.equal(view.config.scaledSprites, 1)
  assert.deepEqual(view.config, native.views[index + 3])
  assert.deepEqual(view.point, start.point)
  assert.equal(view.bearing, start.bearing)
  await page.screenshot({ path: artifacts + 'close.png' })
  await page.keyboard.press('=')
  assert.equal((await state()).remaining, 0, 'Closest view does not zoom indefinitely')
  await page.keyboard.press('-')
  await advance()
  assert.deepEqual((await state()).config, start.config, 'Normal view restores every config field')
  // Wheel uses the same discrete command adapter as the keyboard and menu.
  const canvas = page.locator('.world-viewport canvas[data-engine]'),
    rect = await canvas.boundingBox()
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
  await page.mouse.wheel(0, 120)
  await page.waitForFunction(() => window.testScene.viewPreset === 2)
  await advance()
  view = await state()
  assert.equal(view.config.curvature, 0)
  assert.deepEqual(view.config, native.views[index + 2])
  await page.screenshot({ path: artifacts + 'birds-eye.png' })
  await page.keyboard.press('-')
  await settleView(page)
  assert.equal((await state()).overview, true)
  await page.keyboard.press('=')
  await settleView(page)
  await advance()
  assert.equal((await state()).overview, false)
  assert.equal((await state()).preset, 2)
  await page.keyboard.press('=')
  await advance()
  assert.deepEqual((await state()).config, start.config)
  // Reverse partway without snapping or resetting the camera's position/angle.
  await page.keyboard.press('=')
  await advance(5)
  const middle = await state()
  await page.keyboard.press('-')
  assert.deepEqual((await state()).config, middle.config)
  await advance()
  assert.deepEqual((await state()).config, start.config)
  await page.evaluate(() => {
    window.testScene.world.inputMask = 4
  })
  await page.keyboard.press('=')
  await page.mouse.wheel(0, -120)
  await page.waitForTimeout(100)
  assert.equal((await state()).preset, 0)
  await page.evaluate(() => {
    const s = window.testScene
    s.world.inputMask = 0
    s.world.paused = true
  })
  await page.keyboard.press('=')
  await advance()
  assert.equal(
    (await state()).preset,
    3,
    'View controls remain available while simulation is paused'
  )
  // Resize refreshes the selected resolution's preset, without reverting zoom.
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.waitForTimeout(100)
  assert.equal((await state()).preset, 3)
  assert.equal((await state()).config.scaledSprites, 1)
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click()
  await advance()
  assert.equal((await state()).preset, 0)

  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  // Exercise the shipped camera runtime, not only the interpolation helper.
  // Timestamps are deterministic; these schedules are NOT measured hardware FPS.
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForTimeout(100)
  await page.evaluate(() => {
    const s = window.testScene
    window.resetZoom = (preset = 0) => {
      cancelAnimationFrame(s.frame)
      s.keys.clear()
      s.navigationPointer = null
      s.cameraPreviewButtons = null
      s.cameraTime = 0
      s.cameraMotion.active = 0
      s.resultCamera.active = 0
      s.viewTransition = null
      s.viewPreset = preset
      s.viewZoom = 0
      s.overviewActive = false
      s.overviewStage = null
      s.world.inputMask = 0
      s.world.paused = true
      s.world.speed = 0
      s.cameraBearing = 0
      s.focus({ x: 2, z: 30 })
      s.updateView()
    }
    window.zoomFrame = dt => {
      if (!s.updateCameraMotion(dt) && !s.updateFlyby(dt)) s.updateView()
    }
  })
  for (const hz of [30, 60, 120, 144, 0]) {
    for (const moving of [false, true]) {
      for (const [from, key, to] of [
        [0, '=', 3],
        [3, '-', 0],
        [0, '-', 2],
        [2, '=', 0],
      ]) {
        await page.evaluate(from => window.resetZoom(from), from)
        if (moving) {
          await page.keyboard.down('w')
          await page.keyboard.down('q')
        }
        await page.keyboard.press(key)
        const run = await page.evaluate(
          async ({ hz, moving }) => {
            const s = window.testScene,
              { stepViewTransition } = await import('/app/camera-view.ts'),
              { stepCameraInput } = await import('/app/camera-input.ts'),
              target = s.currentPreset(),
              owned = structuredClone(s.viewTransition.config),
              position = { ...s.cameraPosition },
              velocity = { ...s.cameraVelocity },
              pattern = hz ? [1 / hz] : [1 / 144, 0.013, 0.11, 1 / 30, 0.007],
              samples = []
            let remaining = 18,
              time = 0,
              accumulator = 0,
              last = JSON.stringify(s.view.config),
              changes = 0
            for (let i = 0; time < 0.75 - 1e-9; i++) {
              const dt = Math.min(0.75 - time, pattern[i % pattern.length])
              time += dt
              accumulator += dt
              window.zoomFrame(dt)
              while (accumulator + 1e-9 >= 1 / 24) {
                remaining = stepViewTransition(owned, target, remaining, 18)
                if (moving) stepCameraInput(position, velocity, 17, 24)
                accumulator = Math.max(0, accumulator - 1 / 24)
              }
              const actualOwned = s.viewTransition?.config ?? s.view.config
              if (JSON.stringify(actualOwned) !== JSON.stringify(owned))
                throw Error('Native config changed with render cadence')
              if ((s.viewTransition?.remaining ?? 0) !== remaining)
                throw Error('Native zoom duration changed')
              const config = JSON.stringify(s.view.config)
              if (config !== last) changes++
              last = config
              samples.push({
                time,
                remaining,
                scale: s.view.config.scale,
                pitch: s.view.config.pitch,
                offsetY: s.view.config.offsetY,
              })
            }
            return {
              frames: samples.length,
              changes,
              samples,
              remaining,
              preset: s.viewPreset,
              actualPosition: { ...s.cameraPosition },
              position,
              actual: s.view.config,
              target,
            }
          },
          { hz, moving }
        )
        assert.equal(run.preset, to)
        assert.equal(run.remaining, 0)
        assert.deepEqual(run.actual, run.target)
        assert.deepEqual(
          run.actualPosition,
          run.position,
          'Preview must not feed back into native pan/rotation'
        )
        // Integer native offsets may repeat after the principal zoom fields have
        // reached their native endpoint. Before that tail, every frame must move.
        const active = run.samples.filter(s => s.time < 17 / 24 - 1e-9)
        for (let i = 1; i < active.length; i++)
          assert.notDeepEqual(
            [active[i].scale, active[i].pitch, active[i].offsetY],
            [active[i - 1].scale, active[i - 1].pitch, active[i - 1].offsetY],
            'Zoom repeats before its native endpoint tail'
          )
        report.schedules.push({ hz: hz || 'irregular', moving, from, to, ...run })
        await page.keyboard.up('w')
        await page.keyboard.up('q')
      }
    }
  }
  // A pan release captures its displayed fraction. Zoom must retain its own
  // timer and must not jump when navigation changes or the view reverses.
  for (const hz of [30, 60, 120, 144, 0]) {
    await page.evaluate(() => window.resetZoom())
    await page.keyboard.down('w')
    await page.keyboard.down('q')
    await page.keyboard.press('=')
    await page.evaluate(() => window.zoomFrame(0.137))
    const beforeRelease = await state()
    await page.keyboard.up('w')
    await page.keyboard.up('q')
    await page.evaluate(() => window.zoomFrame(0))
    assert.deepEqual(
      (await state()).config,
      beforeRelease.config,
      'Zero-delta release cannot undo the zoom preview'
    )
    const completed = await page.evaluate(hz => {
      const pattern = hz ? [1 / hz] : [0.007, 0.15, 1 / 120, 1 / 30],
        s = window.testScene
      let time = 0.137,
        i = 0
      while (time < 0.75 - 1e-9) {
        const dt = Math.min(0.75 - time, pattern[i++ % pattern.length])
        time += dt
        window.zoomFrame(dt)
      }
      return {
        remaining: s.viewTransition?.remaining ?? 0,
        config: s.view.config,
        target: s.currentPreset(),
      }
    }, hz)
    assert.equal(completed.remaining, 0, 'Pan capture must not restart the native zoom clock')
    assert.deepEqual(completed.config, completed.target)
  }
  await page.evaluate(() => window.resetZoom())
  await page.keyboard.press('=')
  await page.evaluate(() => window.zoomFrame(0.137))
  const beforeReverse = await state()
  await page.keyboard.press('-')
  assert.deepEqual(
    (await state()).config,
    beforeReverse.config,
    'Retarget from exactly the displayed configuration'
  )
  await page.evaluate(() => window.zoomFrame(0))
  assert.deepEqual(
    (await state()).config,
    beforeReverse.config,
    'Zero elapsed time cannot preview the reversed request ahead'
  )
  await page.evaluate(() => window.zoomFrame(1 / 144))
  const partial = await state()
  assert.notDeepEqual(partial.config, beforeReverse.config)
  await page.evaluate(() => {
    window.testScene.world.inputMask = 4
    window.zoomFrame(0.217)
  })
  assert.deepEqual(
    (await state()).config,
    partial.config,
    'Input mask holds the rendered zoom fraction'
  )
  await page.evaluate(() => {
    window.testScene.world.inputMask = 0
    window.zoomFrame(0)
  })
  assert.deepEqual(
    (await state()).config,
    partial.config,
    'Unlock without elapsed time cannot move the displayed zoom'
  )
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.waitForTimeout(100)
  assert.equal((await state()).preset, 0)
  await advance(24)
  const resized = await page.evaluate(() => ({
    actual: window.testScene.view.config,
    target: window.testScene.currentPreset(),
  }))
  assert.deepEqual(
    resized.actual,
    resized.target,
    'Resize during a transition reaches the selected resolution preset'
  )

  // A stationary cursor must be repicked when zoom changes between native ticks.
  await page.evaluate(() => window.resetZoom())
  await page.keyboard.press('=')
  assert.equal(
    await page.evaluate(() => {
      const s = window.testScene
      s.pointerState = 'cached-before-zoom'
      window.zoomFrame(1 / 144)
      return s.pointerState
    }),
    ''
  )
  // Selected real rendered frames verify that config changes reach GPU output.
  // Scene.animate(unchanged timestamp) updates all zoom-dependent sprite/picking
  // consumers without advancing simulation or its RNG.
  const pixels = await page.evaluate(() => {
    const s = window.testScene,
      gl = s.renderer.getContext(),
      frames = [],
      configs = []
    s.updateSky = () => {}
    for (let i = 0; i < 4; i++) {
      window.zoomFrame(1 / 144)
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
      configs.push({ remaining: s.viewTransition?.remaining, scale: s.view.config.scale })
    }
    const changed = frames.slice(1).map((frame, i) => {
      let n = 0
      for (let j = 0; j < frame.length; j += 4)
        if (
          frame[j] !== frames[i][j] ||
          frame[j + 1] !== frames[i][j + 1] ||
          frame[j + 2] !== frames[i][j + 2]
        )
          n++
      return n
    })
    const extension = gl.getExtension('WEBGL_debug_renderer_info')
    return {
      changed,
      configs,
      renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : 'unknown',
    }
  })
  assert.ok(
    pixels.changed.every(n => n > 100),
    'Sub-step zoom must change real rendered pixels'
  )
  report.pixels = pixels
  report.browser = browser.version()
  await page.screenshot({ path: artifacts + 'fractional-zoom.png' })
  console.log(
    'PASS: 40 zoom schedule/direction/navigation cases, native state/duration, release/reversal/lock/resize and sub-step rendered pixels',
    JSON.stringify({
      schedules: report.schedules.map(({ hz, moving, from, to, frames, changes }) => ({
        hz,
        moving,
        from,
        to,
        frames,
        changes,
      })),
      pixels,
    })
  )

  assert.deepEqual(errors, [])
  console.log(
    "PASS: original close/normal/bird's-eye presets, 18-frame transitions, real keys/wheel/menu, endpoint limits, retargeting, pause/lock, resize and overview return"
  )
} finally {
  writeFileSync(artifacts + 'report.json', JSON.stringify(report, null, 2) + '\n')
  await browser.close()
}
