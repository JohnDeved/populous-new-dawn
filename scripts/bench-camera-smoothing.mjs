import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { cpus, platform, arch } from 'node:os'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const result = await page.evaluate(() => {
    const s = window.testScene,
      preview = s.previewCamera
    cancelAnimationFrame(s.frame)
    const run = (smooth, hz, frames) => {
      s.previewCamera = smooth ? preview : () => false
      s.cameraPreviewButtons = null
      s.cameraTime = 0
      s.cameraMotion.active = 0
      s.resultCamera.active = 0
      s.viewTransition = null
      s.overviewActive = false
      s.overviewStage = null
      s.world.paused = false
      s.world.inputMask = 0
      s.world.flyby.flags &= ~1
      s.keys.clear()
      s.keys.add('q')
      s.navigationPointer = null
      s.cameraBearing = 0
      s.focus({ x: 2, z: 30 })
      const start = performance.now()
      for (let i = 0; i < frames; i++)
        if (!s.updateCameraMotion(1 / hz) && !s.updateFlyby(1 / hz)) s.updateView()
      return { ms: (performance.now() - start) / frames, angle: s.cameraPosition.angle }
    }
    const rows = []
    for (const hz of [60, 240]) {
      run(false, hz, 1200)
      run(true, hz, 1200)
      const batches = []
      for (let batch = 0; batch < 9; batch++) {
        const values = {}
        for (const smooth of batch % 2 ? [true, false] : [false, true])
          values[smooth] = run(smooth, hz, 2400)
        batches.push({ stepped: values.false, smooth: values.true })
      }
      const median = values => values.sort((a, b) => a - b)[4],
        steppedMs = median(batches.map(b => b.stepped.ms)),
        smoothMs = median(batches.map(b => b.smooth.ms))
      rows.push({
        hz,
        steppedMs,
        smoothMs,
        deltaMicroseconds: (smoothMs - steppedMs) * 1000,
        batches,
      })
    }
    s.previewCamera = preview
    return { browser: navigator.userAgent, viewport: [innerWidth, innerHeight], rows }
  })
  for (const row of result.rows)
    for (const batch of row.batches) assert.equal(batch.smooth.angle, batch.stepped.angle)
  assert.deepEqual(errors, [])
  const report = {
    date: new Date().toISOString(),
    cpu: cpus()[0].model,
    os: platform(),
    arch: arch(),
    workload:
      'Actual Scene camera/input/flyby/view-update path, GPU drawing excluded; 1200 warmup frames per mode, nine alternating batches of 2400 frames',
    ...result,
  }
  if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}
