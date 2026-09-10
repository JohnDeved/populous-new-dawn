import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import { preparePainterBaseline, installPainterBaseline } from './painter-baseline.mjs'

const width = Number(process.env.POPULOUS_AUDIO_WIDTH ?? 1440)
const baseline = 'c30d8827d48e7bb0548d4082540b44c656752492'
preparePainterBaseline(baseline)
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.setViewportSize({ width, height: 1000 })
  await page.evaluate(() => window.testScene.setSize())
  await installPainterBaseline(page)
  const report = await page.evaluate(async () => {
    const s = window.testScene,
      r = s.renderer,
      gl = r.getContext()
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    const Matrix4 = s.terrain.matrixWorld.constructor,
      Vector3 = s.terrain.position.constructor
    const { polygonBucket } = await import('/app/painter-order.ts')
    const { projectPoint } = await import('/app/projection.ts')
    const cases = []
    const capture = sample => {
      const environment = sample ? s.soundEnvironment() : null
      r.render(s.scene, s.camera)
      const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels
      )
      return { environment, pixels, depth: s.view.painter.texture.image.data.slice() }
    }
    for (const [x, z, heading, zoom] of [
      [2, 30, 0, 0],
      [2, 30, 512, 0],
      [127, -127, 1024, 0],
      [-127, 127, 1536, 2],
      [80, 80, 256, 0],
      [-80, -80, 768, 0],
    ]) {
      s.viewPoint = { x, z }
      s.cameraBearing = (heading * Math.PI) / 1024
      s.viewZoom = zoom
      s.updateView()
      window.selectPainter(false)
      const before = capture(false)
      window.selectPainter(true)
      s.view.painter.land = s.world.land
      const after = capture(true)
      if (
        before.pixels.some((v, i) => v !== after.pixels[i]) ||
        before.depth.some((v, i) => v !== after.depth[i])
      )
        throw Error('Ambience sampling changed rendering')
      if (s.view.painter.pendingSoundEnvironment)
        throw Error('Render did not finish pending sample')
      // Independently rebuild the submitted terrain list from GPU painter slots
      // and world geometry, rather than reading the audio histogram.
      const position = s.terrain.geometry.getAttribute('position'),
        triangles = []
      for (let instance = 0; instance < s.terrain.count; instance++) {
        const transform = new Matrix4()
        s.terrain.getMatrixAt(instance, transform)
        transform.premultiply(s.terrain.matrixWorld)
        for (let face = 0; face < position.count / 3; face++) {
          const depth = s.view.painter.depth(s.terrain, face, instance)
          if (depth === null || depth > 1) continue
          const vertices = [0, 1, 2].map(j =>
            new Vector3().fromBufferAttribute(position, face * 3 + j).applyMatrix4(transform)
          )
          const cell = s.landIndex(
            Math.min(...vertices.map(v => v.x)),
            Math.max(...vertices.map(v => v.z))
          )
          const depths = vertices.map(
            v => projectPoint(s.view.relative(v, (v.y * 128) / 45, true), s.view.projection).z
          )
          const raised = vertices.some(v => {
            const f = s.world.land.flags[s.landIndex(v.x, v.z)]
            return f & 0x200 && !(f & 0x100000)
          })
          triangles.push({
            bucket: polygonBucket(depths, 0, raised),
            height: s.world.land.heights[cell],
            category: s.world.land.categories[cell],
          })
        }
      }
      const { total, low, water, high } = after.environment
      const treeCandidates = s.decorations.children
        .filter(
          g =>
            g.visible &&
            g.userData.point?.model > 0 &&
            g.userData.point.model < 7 &&
            s.view.visible(g.position)
        )
        .map(g => ({
          model: g.userData.point.model,
          x: Math.round((g.position.x + 8) * 256) & 65535,
          y: Math.round((-g.position.z - 8) * 256) & 65535,
        }))
      cases.push({
        view: { x, z, heading, zoom },
        triangles,
        expected: { total, low, water, high },
        treeCandidates,
        expectedTrees: after.environment.trees,
      })
    }
    const samples = [[], [], []]
    for (let i = 0; i < 48; i++)
      for (const mode of i % 2 ? [2, 1, 0] : [0, 1, 2]) {
        window.selectPainter(mode !== 0)
        s.view.painter.land = s.world.land
        if (mode === 2) s.soundEnvironment()
        const start = performance.now()
        s.view.painter.update(s.scene, r)
        s.view.painter.afterRender()
        if (i >= 8) samples[mode].push(performance.now() - start)
      }
    window.selectPainter(true)
    const statistics = samples.map(values => {
      const sorted = values.toSorted((a, b) => a - b)
      return { median: sorted[20], p95: sorted[38], samples: values }
    })
    return {
      cases,
      statistics,
      retainedBytes: s.view.painter.terrainAmbience.buckets.byteLength,
      userAgent: navigator.userAgent,
    }
  })
  assert.deepEqual(errors, [])
  assert.ok(report.cases.some(c => c.expected.water > 0))
  assert.ok(report.cases.some(c => c.expected.low > 0))
  assert.ok(new Set(report.cases.map(c => JSON.stringify(c.expected))).size > 1)
  const artifact = {
    baseline,
    browser: await browser.version(),
    headless: true,
    viewport: { width, height: 1000 },
    ...report,
    limitation:
      'Native replay consumes the actual browser-submitted ground list; it does not prove full original scene membership. CPU painter timing only, not hardware FPS. Renderer flags, tree ownership and other landscapes remain partial.',
  }
  writeFileSync('/private/tmp/populous-terrain-ambience-browser.json', JSON.stringify(artifact))
  if (process.argv.includes('--record'))
    writeFileSync(
      `references/performance/2026-09-10-terrain-ambience${width === 1440 ? '' : '-ultrawide'}.json`,
      JSON.stringify(artifact) + '\n'
    )
  console.log(
    'PASS: six actual views preserve pixels/depths and feed completed terrain snapshots; paired painter CPU timings',
    JSON.stringify({
      cases: report.cases.map(({ triangles, treeCandidates, ...c }) => ({
        ...c,
        triangles: triangles.length,
        treeCandidates: treeCandidates.length,
      })),
      statistics: report.statistics.map(({ samples, ...s }) => s),
      retainedBytes: report.retainedBytes,
    })
  )
} finally {
  await browser.close()
}
