import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const results = await page.evaluate(() => {
    const s = window.testScene,
      r = s.renderer,
      gl = r.getContext(),
      terrain = s.terrain
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    const results = []
    for (const [x, z, heading, zoom, overview] of [
      [2, 30, 0, 0, false],
      [2, 30, 256, 0, false],
      [2, 30, 512, 0, false],
      [127, -127, 1024, 0, false],
      [-127, 127, 1536, 2, false],
      [2, 30, 0, 4, false],
      [2, 30, 0, 0, true],
    ]) {
      s.view.update(
        s.container.clientWidth,
        s.container.clientHeight,
        { x, z },
        (heading * Math.PI) / 1024,
        zoom,
        overview
      )
      const pixels = () => {
        r.render(s.scene, s.camera)
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
        return data
      }
      const optimized = pixels(),
        triangles = r.info.render.triangles,
        index = terrain.geometry.index,
        range = { ...terrain.geometry.drawRange },
        pick = s.view.pick({ x: 0, y: 0 }, [terrain], s.camera)
      terrain.userData.terrainGrid = false
      terrain.geometry.setIndex(null)
      terrain.geometry.setDrawRange(0, Infinity)
      const baseline = pixels(),
        originalTriangles = r.info.render.triangles,
        originalPick = s.view.pick({ x: 0, y: 0 }, [terrain], s.camera)
      terrain.userData.terrainGrid = true
      terrain.geometry.setIndex(index)
      terrain.geometry.setDrawRange(range.start, range.count)
      let changed = 0
      for (let i = 0; i < baseline.length; i++) if (baseline[i] !== optimized[i]) changed++
      results.push({
        x,
        z,
        heading,
        zoom,
        overview,
        changed,
        triangles,
        originalTriangles,
        pick: pick?.point ?? null,
        originalPick: originalPick?.point ?? null,
      })
    }
    return results
  })
  for (const result of results) {
    assert.equal(result.changed, 0, JSON.stringify(result))
    assert.deepEqual(result.pick, result.originalPick)
    if (!result.overview)
      assert.ok(result.triangles < result.originalTriangles * 0.3, JSON.stringify(result))
  }
  assert.deepEqual(errors, [])
  console.log(
    'PASS: pixel-identical terrain submission and picking across headings, seams, zoom and globe',
    JSON.stringify(results)
  )
} finally {
  await browser.close()
}
