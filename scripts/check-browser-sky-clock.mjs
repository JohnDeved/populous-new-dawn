import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const runs = await page.evaluate(async () => {
    const s = window.testScene, { createSkyMotion } = await import('/app/sky.ts'),
      { createFlyby, flybyCommand } = await import('/app/flyby.ts'),
      { beginResultCamera } = await import('/app/camera-motion.ts'), runs = []
    cancelAnimationFrame(s.frame)
    window.resetSky = () => {
      s.keys.clear()
      s.navigationPointer = null
      s.cameraPreviewButtons = null
      s.cameraTime = 0
      s.flybyTime = 0
      s.cameraMotion.active = 0
      s.resultCamera.active = 0
      s.viewTransition = null
      s.overviewActive = false
      s.overviewStage = null
      s.world.paused = false
      s.world.speed = 0
      s.world.inputMask = 0
      s.world.flyby.flags &= ~1
      s.wasFlying = false
      s.cameraBearing = 0
      s.focus({ x: -10.09375, z: -8.78125 })
      s.skyOwned = createSkyMotion()
      s.skyMotion = createSkyMotion()
      s.skyRemainder = 0
      s.skyLoaded = false
      s.updateSky()
    }
    for (const mode of ['idle', 'forward', 'rotate', 'combined', 'focus', 'flyby', 'paused-flyby', 'result']) {
      for (const hz of [24, .5, 5, 30, 60, 120, 144, 240, 0]) {
        window.resetSky()
        if (mode === 'forward') s.keys.add('w')
        if (mode === 'rotate') s.keys.add('q')
        if (mode === 'combined') ['w', 'a', 'e'].forEach(k => s.keys.add(k))
        if (mode === 'focus') s.focus({ x: 25, z: 15 }, { animate: true })
        if (mode.includes('flyby')) {
          s.world.flyby = createFlyby()
          flybyCommand(s.world.flyby, 1209, [120, 90, 0, 100])
          flybyCommand(s.world.flyby, 1210, [800, 0, 100])
          flybyCommand(s.world.flyby, 1206, [])
          s.world.inputMask = 64
        }
        if (mode === 'result') beginResultCamera(s.resultCamera, 0, 0, s.cameraPosition, { x: 25000, y: 15000 })
        const duration = mode === 'paused-flyby' ? 3 : 2
        let remaining = duration, frame = 0
        const frames = new Set()
        while (remaining > 1e-9) {
          const elapsed = duration - remaining
          if (mode === 'paused-flyby') s.world.paused = elapsed >= 1 - 1e-9 && elapsed < 2 - 1e-9
          const nextPauseBoundary = mode === 'paused-flyby' ? (elapsed < 1 - 1e-9 ? 1 - elapsed : elapsed < 2 - 1e-9 ? 2 - elapsed : remaining) : remaining
          const dt = Math.min(remaining, nextPauseBoundary, hz ? 1 / hz : [.007, .013, .28, .6, .1][frame % 5])
          if (!s.updateCameraMotion(dt) && !s.updateFlyby(dt)) s.updateView()
          s.updateSky()
          frames.add(s.skyGrid[0] + '/' + s.skyGrid[1])
          remaining -= dt
          frame++
        }
        runs.push({ mode, hz, frame, distinct: frames.size, camera: { ...(mode.includes('flyby') ? s.flybyCamera : s.cameraPosition) },
          motion: { ...s.skyMotion }, owned: { ...s.skyOwned }, remainder: s.skyRemainder })
      }
    }
    return runs
  })
  for (const r of runs) {
    const expected = runs.find(e => e.mode === r.mode && e.hz === 24)
    assert.deepEqual(r.camera, expected.camera, JSON.stringify(r))
    for (const key of Object.keys(r.motion)) {
      assert.ok(Math.abs(r.motion[key] - expected.motion[key]) < 2e-7, JSON.stringify({ mode: r.mode, hz: r.hz, key, actual: r.motion, expected: expected.motion }))
      assert.ok(Math.abs(r.owned[key] - expected.owned[key]) < 2e-7, JSON.stringify({ mode: r.mode, hz: r.hz, key, actual: r.owned, expected: expected.owned }))
    }
    assert.ok(r.remainder < 1e-8, JSON.stringify(r))
    assert.equal(r.distinct, r.frame, JSON.stringify(r))
  }
  const pause = await page.evaluate(() => {
    const s = window.testScene
    window.resetSky()
    s.world.paused = true
    const start = { ...s.skyMotion }, turn = s.world.turn, render = s.renderer.render
    s.renderer.render = () => {}
    s.previous = 1000000
    for (let i = 1; i <= 240; i++) {
      s.animate(1000000 + i * 1000 / 240)
      cancelAnimationFrame(s.frame)
    }
    const moved = { ...s.skyMotion }
    window.dispatchEvent(new Event('blur'))
    s.animate(2000000)
    cancelAnimationFrame(s.frame)
    const afterBlur = { ...s.skyMotion }
    s.renderer.render = render
    return { start, moved, afterBlur, turns: s.world.turn - turn }
  })
  assert.equal(pause.turns, 0)
  assert.notEqual(pause.start.x, pause.moved.x)
  assert.deepEqual(pause.afterBlur, pause.moved, 'Blur must not replay hidden wall time into clouds')
  await page.waitForFunction(() => window.testScene.skyClouds.every(m => m.material.uniforms.map.value.image?.complete))
  const pixels = await page.evaluate(() => {
    const s = window.testScene
    window.resetSky()
    s.cameraBearing = 0
    s.focus({ x: 2, z: 30 })
    s.previous = performance.now()
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    const r = s.renderer, gl = r.getContext(), captures = []
    for (let frame = 0; frame < 3; frame++) {
      s.updateCameraMotion(1 / 240)
      s.updateSky()
      r.render(s.scene, s.camera)
      const rgba = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, rgba)
      captures.push(rgba)
    }
    const changed = []
    for (let n = 1; n < captures.length; n++) {
      let count = 0
      for (let i = 0; i < captures[n].length; i += 4)
        if ([0, 1, 2].some(k => captures[n][i + k] !== captures[n - 1][i + k])) count++
      changed.push(count)
    }
    return changed
  })
  pixels.forEach(count => assert.ok(count > 100, `Substep clouds did not change rendered pixels: ${pixels}`))
  await page.screenshot({ path: '/private/tmp/populous-sky-clock.png' })
  assert.deepEqual(errors, [])
  writeFileSync('references/performance/2026-09-09-sky-clock.json', JSON.stringify({ runs, pause, pixels }, null, 2) + '\n')
  console.log('PASS: 72 real camera/sky sequences at 0.5–240 Hz and irregular frames; identical owned/rendered endpoints, continuous UV motion, paused world with independent wind and blur reset')
} finally {
  await browser.close()
}
