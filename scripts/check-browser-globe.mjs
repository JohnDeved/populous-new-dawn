// npm run dev, then node scripts/check-browser-globe.mjs.
// Native geometry/math are compared separately by check-native-globe.py.
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
    s.focus({ x: 2, z: 30 })
    s.cameraBearing = Math.PI * 333 / 1024
    s.cameraTime = 0
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
  })
  const advance = () => page.evaluate(() => {
    const s = window.testScene
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
  })
  const state = () => page.evaluate(() => {
    const s = window.testScene
    return { center: s.view.center, bearing: s.cameraBearing, overview: s.overviewActive,
      ground: s.ground.visible, globe: s.globe.visible, view: s.view.globe,
      triangles: s.globe.land.geometry.attributes.position?.count / 3,
      stars: s.globe.stars.geometry.attributes.position?.count,
      clouds: s.skyClouds.some(c => c.visible), background: s.scene.background === s.space,
      atlas: [s.globe.map.image.width, s.globe.map.image.height] }
  })
  const original = await state()
  await page.getByRole('button', { name: 'Planet overview', exact: true }).click()
  await advance()
  let view = await state()
  assert.equal(view.overview, true)
  assert.equal(view.ground, false)
  assert.equal(view.globe, true)
  assert.equal(view.clouds, false)
  assert.equal(view.background, true)
  assert.equal(view.triangles, 1220)
  assert.ok(view.stars > 200)
  assert.deepEqual(view.atlas, [1024, 1024])
  assert.deepEqual(view.center, original.center)
  const gpu = await page.evaluate(() => {
    const s = window.testScene, gl = s.renderer.getContext()
    const read = () => {
      s.renderer.render(s.scene, s.camera)
      const data = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, data)
      return data
    }
    const withMarkers = read()
    s.globe.markers.visible = false
    const withoutMarkers = read()
    s.globe.land.visible = false
    const stars = read()
    s.globe.land.visible = s.globe.markers.visible = true
    let markerPixels = 0, terrainPixels = 0, starPixels = 0
    for (let i = 0; i < stars.length; i += 4) {
      if (withMarkers[i] !== withoutMarkers[i] || withMarkers[i+1] !== withoutMarkers[i+1] || withMarkers[i+2] !== withoutMarkers[i+2]) markerPixels++
      if (withoutMarkers[i] !== stars[i] || withoutMarkers[i+1] !== stars[i+1] || withoutMarkers[i+2] !== stars[i+2]) terrainPixels++
      if (stars[i] || stars[i+1] || stars[i+2]) starPixels++
    }
    const rect = s.renderer.domElement.getBoundingClientRect()
    const center = s.pick({ clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 })
    const outside = s.pick({ clientX: rect.left + 10, clientY: rect.top + 10 })
    return { markerPixels, terrainPixels, starPixels, center, outside }
  })
  assert.ok(gpu.markerPixels > 250, 'Original icons and person/scenery markers must reach GPU pixels')
  assert.ok(gpu.terrainPixels > 450000, 'The 800-pixel globe must cover the expected disc')
  assert.ok(gpu.starPixels > 200)
  assert.deepEqual(gpu.center, { x: 2, z: 30 }, 'Center pick preserves native wrapped coordinates')
  assert.equal(gpu.outside, null)
  await advance()
  await page.screenshot({ path: '/private/tmp/populous-globe-v103.png' })
  // Navigation moves the wrapped map without turning the ground camera bearing.
  await page.keyboard.down('ArrowRight')
  await page.evaluate(() => window.testScene.updateCameraMotion(1 / 24))
  await page.keyboard.up('ArrowRight')
  await advance()
  view = await state()
  assert.equal(view.center.x, (original.center.x + 320) & 65535)
  assert.equal(view.center.y, original.center.y)
  assert.equal(view.bearing, original.bearing)
  const canvas = page.locator('.world-viewport canvas'), rect = await canvas.boundingBox()
  const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(x + 81, y + 37, { steps: 9 })
  await page.mouse.up({ button: 'right' })
  await advance()
  const dragged = await state(), scale = Math.trunc(0x320000 / 400)
  assert.deepEqual(dragged.center, { x: (view.center.x + (Math.imul(-81, scale) >> 8)) & 65535,
    y: (view.center.y + (Math.imul(37, scale) >> 8)) & 65535 })
  assert.equal(dragged.bearing, original.bearing)
  assert.notDeepEqual(await page.evaluate(() => [...window.testScene.globe.offsets]), new Array(32).fill(0))
  // Resize exercises mesh, icon target and framebuffer recreation together.
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.waitForTimeout(100)
  await advance()
  assert.equal((await state()).view.height, 900)
  assert.deepEqual(await page.evaluate(() => [window.testScene.globe.canvas.width, window.testScene.globe.canvas.height]), [(await state()).view.width, 900])
  // Zoom-in returns to the live scene and restores clouds, models and sprites.
  await page.keyboard.press('=')
  await advance()
  view = await state()
  assert.equal(view.overview, false)
  assert.equal(view.ground, true)
  assert.equal(view.globe, false)
  assert.equal(view.clouds, true)
  assert.equal(view.background, false)
  assert.equal(view.bearing, original.bearing)
  assert.deepEqual(view.center, dragged.center)
  assert.deepEqual(errors, [])
  console.log(`PASS: globe entry/return, ${gpu.terrainPixels} terrain / ${gpu.markerPixels} marker / ${gpu.starPixels} star GPU pixels; native wrapped picking, keys, cumulative drag, parallax, resize and preserved ground bearing`)
} finally {
  await browser.close()
}
