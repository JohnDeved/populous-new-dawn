// Compare full-color wide views and edge picking with a larger ground reference.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.waitForFunction(() => !!window.testScene.waves && !!window.testScene.terrainTextures)
  await page.evaluate(() => {
    const s = window.testScene
    s.world.speed = 0
    cancelAnimationFrame(s.frame)
    s.updateWater()
  })
  const cases = []
  for (const [width, height] of [
    [3440, 1440],
    [3840, 2160],
  ]) {
    await page.setViewportSize({ width, height })
    await page.waitForFunction(
      height => window.testScene.renderer.domElement.height === height,
      height
    )
    for (const preset of [0, 3])
      for (const heading of [0, 768]) {
        const result = await page.evaluate(
          async ({ width, height, preset, heading }) => {
            const s = window.testScene,
              r = s.renderer,
              gl = r.getContext()
            const { cameraPreset, cameraConfigIndex, polygonMeshBounds } =
              await import('/app/projection.ts')
            s.view.update(
              s.container.clientWidth,
              height,
              { x: 2, z: 30 },
              (heading * Math.PI) / 1024,
              0,
              false,
              width,
              cameraPreset(cameraConfigIndex(width, height), preset)
            )
            const modern = s.view.bounds
            const capture = bounds => {
              s.view.bounds = bounds
              bounds.forEach((row, i) => s.view.boundsTexture.image.data.set(row, i * 2))
              s.view.boundsTexture.needsUpdate = true
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
              const picks = [-0.95, -0.7, 0, 0.7, 0.95].flatMap(x =>
                [-0.8, 0, 0.5].map(
                  y => s.view.pick({ x, y }, [s.terrain, s.objects], s.camera)?.point ?? null
                )
              )
              return { pixels, picks }
            }
            const reference = capture(
              polygonMeshBounds(
                s.view.config.bounds.map((n, i) => (i % 2 ? n : n + Math.sign(n) * 32)),
                heading
              )
            )
            const current = capture(modern)
            let changedBytes = 0
            for (let i = 0; i < current.pixels.length; i++)
              if (current.pixels[i] !== reference.pixels[i]) changedBytes++
            return {
              width,
              height,
              preset,
              heading,
              changedBytes,
              picks: current.picks,
              referencePicks: reference.picks,
            }
          },
          { width, height, preset, heading }
        )
        cases.push(result)
        if (!heading)
          await page.screenshot({
            path: `/private/tmp/populous-wide-${width}-preset-${preset}.png`,
          })
      }
  }
  writeFileSync(
    '/private/tmp/populous-viewport-color.json',
    JSON.stringify({ cases }, null, 2) + '\n'
  )
  for (const c of cases) {
    assert.equal(c.changedBytes, 0, JSON.stringify(c))
    assert.deepEqual(c.picks, c.referencePicks, JSON.stringify(c))
  }
  assert.deepEqual(errors, [])
  console.log(
    `PASS: full-color reference pixels and 15 ground picks in ${cases.length} wide normal/close views`
  )
} finally {
  await browser.close()
}
