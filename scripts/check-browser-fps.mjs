import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const base = process.env.POPULOUS_URL ?? 'http://localhost:3000'
  const ordinary = await openGame(browser)
  assert.equal(
    await ordinary.page.locator('.fps-graph').count(),
    0,
    'Ordinary play does not create the diagnostic'
  )
  assert.equal(await ordinary.page.evaluate(() => window.testScene.fpsGraph), null)
  assert.deepEqual(ordinary.errors, [])
  await ordinary.page.close()
  const url = new URL(base)
  url.searchParams.set('fps', '')
  process.env.POPULOUS_URL = url.href
  const { page, errors } = await openGame(browser)
  const overlay = page.locator('.fps-graph')
  await page.waitForFunction(() => Number(document.querySelector('.fps-graph strong')?.textContent) > 0)
  assert.equal(await overlay.isVisible(), true, 'The fps URL flag enables the diagnostic')
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 3440, height: 1440 }, { width: 640, height: 480 }]) {
    await page.setViewportSize(viewport)
    const box = await overlay.boundingBox()
    assert.equal(box.y, 12)
    assert.equal(Math.round(box.x + box.width), viewport.width - 12)
    assert.equal(await overlay.evaluate(el => getComputedStyle(el).pointerEvents), 'none')
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  if (process.env.FPS_SCREENSHOT) await page.screenshot({ path: process.env.FPS_SCREENSHOT })
  // Direct intervals isolate aggregation; Scene timestamps cover live ownership and reset paths.
  await page.evaluate(() => {
    cancelAnimationFrame(window.testScene.frame)
    const scene = window.testScene,
      graph = scene.fpsGraph
    const check = (condition, message) => { if (!condition) throw new Error(message) }
    graph.update(0)
    for (let i = 0; i < 32; i++) graph.update(1000 / 120)
    check(graph.element.querySelector('strong').textContent === '120', '120 RAF callbacks/s')
    graph.update(0)
    for (let i = 0; i < 10; i++) graph.update(10)
    graph.update(150)
    check(graph.element.querySelector('strong').textContent === '44', 'Slow callback must count')
    for (let i = 0; i < 60; i++) graph.update(250)
    check(graph.history.length === 40, 'Bounded history')
    graph.update(0)
    scene.world.paused = true
    scene.previous = 1_000_000
    for (let i = 1; i <= 32; i++) {
      scene.animate(1_000_000 + (i * 1000) / 120)
      cancelAnimationFrame(scene.frame)
    }
    check(graph.element.querySelector('strong').textContent === '120', 'Scene owns RAF cadence')
    window.dispatchEvent(new Event('blur'))
    scene.animate(2_000_000)
    cancelAnimationFrame(scene.frame)
    check(graph.history.length === 0 && graph.element.querySelector('strong').textContent === '--', 'Blur resets history')
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
    scene.animate(3_000_000)
    cancelAnimationFrame(scene.frame)
    check(graph.history.length === 0 && scene.previous === 3_000_000, 'Visibility resumes without hidden time')
    delete document.hidden
  })
  await page.evaluate(() => window.testScene.dispose())
  assert.equal(await overlay.count(), 0, 'Scene disposal removes graph')
  assert.deepEqual(errors, [])
  console.log('passed: opt-in RAF cadence, placement, timing, bounded history, reset and disposal')
} finally {
  await browser.close()
}
