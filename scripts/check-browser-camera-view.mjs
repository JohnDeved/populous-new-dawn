// Start npm run dev, then node scripts/check-browser-camera-view.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame, settleView } from './browser-game.mjs'
import native from '../app/original-camera.json' with { type: 'json' }
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
  await page.screenshot({ path: '/private/tmp/populous-camera-view-close.png' })
  await page.keyboard.press('=')
  assert.equal((await state()).remaining, 0, 'Closest view does not zoom indefinitely')
  await page.keyboard.press('-')
  await advance()
  assert.deepEqual((await state()).config, start.config, 'Normal view restores every config field')
  // Wheel uses the same discrete command adapter as the keyboard and menu.
  const canvas = page.locator('.world-viewport canvas'),
    rect = await canvas.boundingBox()
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
  await page.mouse.wheel(0, 120)
  await page.waitForFunction(() => window.testScene.viewPreset === 2)
  await advance()
  view = await state()
  assert.equal(view.config.curvature, 0)
  assert.deepEqual(view.config, native.views[index + 2])
  await page.screenshot({ path: '/private/tmp/populous-camera-view-birds-eye.png' })
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
  assert.deepEqual(errors, [])
  console.log(
    "PASS: original close/normal/bird's-eye presets, 18-frame transitions, real keys/wheel/menu, endpoint limits, retargeting, pause/lock, resize and overview return"
  )
} finally {
  await browser.close()
}
