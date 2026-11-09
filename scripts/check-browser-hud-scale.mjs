// Modern sizing deliberately replaces native X/Y stretching. Original artwork
// coordinates, live controls and renderer/minimap hit regions must still agree.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => { window.testScene.world.speed = 0 })
  const check = async (width, height, scale) => {
    await page.setViewportSize({ width, height })
    const notice = page.getByRole('button', { name: 'Continue anyway' })
    if (await notice.isVisible()) await notice.click()
    await page.waitForFunction(({ width, height, scale }) => {
      const s = window.testScene, r = s.renderer.domElement.getBoundingClientRect()
      return Math.abs(r.x - scale * 100) < .1 && r.height === height &&
        Math.abs(r.width - (width - scale * 100)) < .1 &&
        s.renderer.domElement.clientWidth === s.container.clientWidth
    }, { width, height, scale })
    const bounds = await page.evaluate(() => {
      const rect = selector => {
        const r = document.querySelector(selector).getBoundingClientRect()
        return [r.x, r.y, r.width, r.height]
      }
      return { hud: rect('.native-hud'), health: rect('.health-bar'),
        mini: rect('.minimap-wrap canvas'), portrait: rect('.portrait'),
        settings: rect('[aria-label="Game settings"]') }
    })
    const close = (actual, expected) => actual.forEach((v, i) =>
      assert.ok(Math.abs(v - expected[i]) < .1, JSON.stringify({ width, height, actual, expected })))
    close(bounds.hud, [0, 0, scale * 100, height])
    close(bounds.health, [64, 126, 10, 22].map(v => v * scale))
    close(bounds.mini, [0, 0, 100, 96].map(v => v * scale))
    close(bounds.portrait, [33, 114, 30, 35].map(v => v * scale))
    assert.ok(bounds.settings[1] + bounds.settings[3] <= height)
    const hit = await page.locator('[aria-label="Game settings"]').evaluate(el => {
      const r = el.getBoundingClientRect()
      return document.querySelector('dialog').open ||
        document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el
    })
    assert.ok(hit, 'Settings must remain visible and clickable')
  }
  // 640×480 keeps exact 1:1 geometry. Widening a monitor cannot stretch the HUD.
  for (const c of [[640, 480, 1], [1280, 720, 1.5], [1440, 900, 1.5],
    [1440, 1000, 2], [1920, 1080, 2], [2560, 1440, 2.5],
    [3440, 1440, 2.5], [5120, 1440, 2.5], [3840, 2160, 2.5],
    [1280, 400, 400 / 480]]) {
    await check(...c)
  }
  await check(1920, 1080, 2)
  await page.screenshot({ path: '/private/tmp/populous-modern-hud-1080.png' })
  await check(3440, 1440, 2.5)
  await page.screenshot({ path: '/private/tmp/populous-modern-hud-ultrawide.png' })
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  const size = page.getByLabel('HUD size', { exact: true })
  await size.selectOption('4')
  await check(3440, 1440, 3) // User size is bounded to fit all original controls.
  await check(3840, 2160, 4)
  assert.equal(await page.evaluate(() => localStorage.getItem('hud-size')), '4')
  await size.selectOption('1.5')
  await check(3840, 2160, 1.5)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelector('.native-hud').getBoundingClientRect().width === 150)
  // Disabled storage must not break the live preference control.
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage disabled') } })
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await size.selectOption('auto')
  await page.waitForFunction(() => document.querySelector('.native-hud').getBoundingClientRect().width === 250)
  assert.deepEqual(errors, [])
  console.log('PASS: uniform original HUD geometry at ten desktop/window sizes, full-height panel, live renderer resize, reachable settings, saved size and disabled-storage fallback')
} finally {
  await browser.close()
}
