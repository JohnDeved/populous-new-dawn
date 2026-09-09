// Native texel-center mapping in the actual terrain shader, including tile seams.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene
    s.world.speed = 0
    s.focus({ x: 2, z: 30 })
    s.startGroundView(1)
  })
  await page.waitForFunction(
    () =>
      !window.testScene.cameraMotion.active &&
      !window.testScene.viewTransition &&
      window.testScene.terrainTextures
  )
  const result = await page.evaluate(() => {
    const s = window.testScene,
      g = s.terrain.geometry,
      land = g.getAttribute('landUv'),
      world = g.getAttribute('uv'),
      surface = g.getAttribute('surface')
    let landVertices = 0,
      seaVertices = 0
    for (let i = 0; i < land.count; i++) {
      for (const value of [land.getX(i), land.getY(i)]) {
        const texel = (value * 4096) % 32
        if (texel !== 0.5 && texel !== 31.5) throw new Error(`Wrong native endpoint ${i}: ${texel}`)
      }
      if (surface.getX(i)) seaVertices++
      else landVertices++
    }
    const gl = s.renderer.getContext(),
      read = () => {
        s.renderer.render(s.scene, s.camera)
        const p = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
        gl.readPixels(
          0,
          0,
          gl.drawingBufferWidth,
          gl.drawingBufferHeight,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          p
        )
        return p
      }
    const corrected = read(),
      saved = land.array.slice()
    for (let i = 0; i < land.count; i++)
      land.setXY(i, (world.getX(i) + 128) / 256, (world.getY(i) + 128) / 256)
    land.needsUpdate = true
    const old = read()
    land.array.set(saved)
    land.needsUpdate = true
    read()
    let pixels = 0
    for (let i = 0; i < old.length; i += 4)
      if (
        old[i] !== corrected[i] ||
        old[i + 1] !== corrected[i + 1] ||
        old[i + 2] !== corrected[i + 2]
      )
        pixels++
    return { landVertices, seaVertices, pixels, textureWidth: s.terrainMap.image.width }
  })
  assert.ok(result.landVertices > 0 && result.seaVertices > 0)
  assert.ok(result.pixels > 100, 'texel-center mapping must change actual terrain pixels')
  await page.screenshot({ path: '/private/tmp/populous-terrain-sampling-after.png' })
  assert.deepEqual(errors, [])
  console.log(
    'PASS: original inset endpoints across the full terrain, separate sea coordinates and GPU contrast with edge sampling',
    result
  )
} finally {
  await browser.close()
}
