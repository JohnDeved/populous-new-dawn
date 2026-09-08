// npm run dev, then node scripts/check-browser-globe-motion.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import { moveGlobeStars } from '../app/globe.ts'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    s.focus({ x: -8.5, z: -8 })
    s.cameraTime = 0
    s.overview()
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
  })
  const state = () => page.evaluate(() => {
    const s = window.testScene
    return { motion: s.globeMotion, center: s.view.center, offsets: [...s.globe.offsets], bearing: s.cameraBearing }
  })
  const frame = (count = 1) => page.evaluate(count => {
    const s = window.testScene
    for (let i = 0; i < count; i++) s.updateCameraMotion(1 / 24)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
  }, count)
  const rect = await page.locator('.world-viewport canvas').boundingBox()
  const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2
  let before = await state()
  await page.mouse.move(x, y)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(x - 20, y + 10, { steps: 8 })
  assert.deepEqual((await state()).center, before.center, 'Pointer events must wait for a presentation tick')
  await frame()
  const held = await state(), scale = Math.trunc(0x320000 / 400)
  const velocity = { x: Math.imul(20, scale) >> 8, y: Math.imul(10, scale) >> 8 }
  assert.deepEqual(held.motion.velocity, velocity)
  assert.equal(held.center.x, (before.center.x + velocity.x) & 65535)
  const stars = Int32Array.from(before.offsets)
  moveGlobeStars(stars, velocity.x, velocity.y)
  assert.deepEqual(held.offsets, [...stars], 'Motion must update star parallax exactly once')
  await page.mouse.up({ button: 'right' })
  await frame(3)
  const gliding = await state()
  assert.equal(gliding.center.x, (held.center.x + velocity.x * 3) & 65535)
  assert.equal(gliding.center.y, (held.center.y + velocity.y * 3) & 65535)
  assert.deepEqual(gliding.motion.velocity, velocity, 'Native glide has no friction')
  for (let i = 0; i < 3; i++) moveGlobeStars(stars, velocity.x, velocity.y)
  assert.deepEqual(gliding.offsets, [...stars], 'Coalesced renders retain each native parallax step')
  // A failed grab in space leaves glide intact; keyboard movement cancels it.
  await page.mouse.move(rect.x + 10, rect.y + 10)
  await page.mouse.down({ button: 'right' })
  assert.equal((await state()).motion.dragging, false)
  await page.mouse.up({ button: 'right' })
  await page.mouse.move(x, y)
  await page.keyboard.down('ArrowRight')
  await frame()
  await page.keyboard.up('ArrowRight')
  assert.deepEqual((await state()).motion.velocity, { x: 0, y: 0 })
  // A stationary sampled frame while held clears velocity, even across a seam.
  await page.mouse.down({ button: 'middle' })
  await page.mouse.move(x + 90, y)
  await frame()
  assert.equal((await state()).motion.velocity.x, -2048, 'Flick velocity is clamped independently of displacement')
  await frame()
  assert.deepEqual((await state()).motion.velocity, { x: 0, y: 0 })
  await page.mouse.up({ button: 'middle' })
  before = await state()
  await frame(3)
  assert.deepEqual((await state()).center, before.center)
  // Input locks/modal UI freeze the glide; blur cancels it without a stuck grab.
  await page.mouse.move(x, y)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(x + 20, y)
  await frame()
  await page.mouse.up({ button: 'right' })
  before = await state()
  await page.evaluate(() => { window.testScene.world.inputMask = 4 })
  await frame(2)
  assert.deepEqual((await state()).center, before.center)
  await page.evaluate(() => { window.testScene.world.inputMask = 0 })
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await frame(2)
  assert.deepEqual((await state()).center, before.center)
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await frame(2)
  assert.deepEqual((await state()).motion.velocity, { x: 0, y: 0 })
  // Return keyboard focus from the closed dialog to the game.
  await page.evaluate(() => document.activeElement?.blur())
  await page.keyboard.press('=')
  await frame()
  assert.equal(await page.evaluate(() => window.testScene.overviewActive), false)
  await page.getByRole('button', { name: 'Planet overview', exact: true }).click()
  await frame()
  assert.deepEqual((await state()).motion.velocity, { x: 0, y: 0 })
  assert.equal((await state()).bearing, held.bearing)
  assert.deepEqual(errors, [])
  console.log('PASS: sampled right/middle drag, seam crossing, clamped flicks, persistent release glide, exact star steps, stationary stop, space rejection, keyboard takeover, input/modal/blur gates and clean reentry')
} finally { await browser.close() }
