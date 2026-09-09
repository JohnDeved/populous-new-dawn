// CPU painter work only: isolate warm reuse, moving water and new geometry.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import {
  preparePainterBaseline,
  installPainterBaseline,
  painterBaselineCommit,
} from './painter-baseline.mjs'
preparePainterBaseline()
const browser = await chromium.launch({ headless: false })
try {
  const { page, errors } = await openGame(browser)
  await installPainterBaseline(page)
  const report = await page.evaluate(() => {
    const s = window.testScene
    s.world.speed = 0
    s.focus({ x: 2, z: 30 })
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    s.scene.updateMatrixWorld(true)
    const original = s.terrain.geometry.getAttribute('position'),
      results = []
    const run = optimized => {
      window.selectPainter(optimized)
      const start = performance.now()
      s.view.painter.update(s.scene, s.renderer)
      s.view.painter.afterRender()
      return performance.now() - start
    }
    for (let i = 0; i < 12; i++) {
      run(false)
      run(true)
    }
    for (const mode of ['warm', 'water', 'cold']) {
      const samples = [[], []]
      for (let i = 0; i < 18; i++) {
        if (mode === 'cold') s.terrain.geometry.setAttribute('position', original.clone())
        if (mode === 'water') {
          const p = s.terrain.geometry.getAttribute('position')
          for (let j = 0; j < p.count; j++) p.setY(j, p.getY(j) + (i % 2 ? -0.0078125 : 0.0078125))
          p.needsUpdate = true
        }
        for (const optimized of i % 2 ? [true, false] : [false, true])
          samples[Number(optimized)].push(run(optimized))
        const [a, b] = window.painters.map(p => p.texture.image.data)
        if (a.length !== b.length || a.some((v, j) => v !== b[j]))
          throw Error('Different painter depths in ' + mode)
      }
      const stats = values => {
        const sorted = values.toSorted((a, b) => a - b)
        return {
          median: sorted[Math.floor(sorted.length / 2)],
          p95: sorted[Math.floor((sorted.length - 1) * 0.95)],
          max: sorted.at(-1),
        }
      }
      results.push({ mode, samples, separate: stats(samples[0]), shared: stats(samples[1]) })
    }
    const vertices = window.painters[1].vertices.get(s.terrain.geometry.getAttribute('position'))
    return {
      results,
      terrain: {
        source: vertices.source.length,
        unique: new Set(vertices.source).size,
        retainedBytes:
          vertices.source.byteLength + vertices.seen.byteLength + vertices.depth.byteLength,
      },
      userAgent: navigator.userAgent,
    }
  })
  assert.deepEqual(errors, [])
  writeFileSync(
    process.argv[2] ?? '/private/tmp/populous-painter-work-cost.json',
    JSON.stringify({ baseline: painterBaselineCommit, ...report }, null, 2) + '\n'
  )
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}
