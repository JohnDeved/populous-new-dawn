// Native axis scaling across desktop sizes; raw CSS bounds allow one pixel of
// the original integer coordinate truncation. Full control placement is separate.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import fixture from '../tests/fixtures/hud-scale.json' with { type: 'json' }
import camera from '../app/original-camera.json' with { type: 'json' }

const browser = await chromium.launch({ headless: true })
try {
  assert.equal(fixture.executableSha256, camera.executableSha256)
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => { window.testScene.world.speed = 0 })
  for (const c of fixture.cases) {
    await page.setViewportSize({ width: c.width, height: c.height })
    await page.waitForFunction(({ width, height }) => {
      const s = window.testScene, r = s.renderer.domElement.getBoundingClientRect()
      return Math.abs(r.x - width * 100 / 640) < 1 && r.height === height &&
        s.renderer.domElement.clientWidth === s.container.clientWidth
    }, c)
    for (const [selector, expected] of [['.native-hud', c.sidebar], ['.health-bar', c.health]]) {
      const actual = await page.locator(selector).evaluate(el => {
        const r = el.getBoundingClientRect()
        return [r.x, r.y, r.width, r.height]
      })
      actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) <= 1,
        JSON.stringify({ size: [c.width, c.height], selector, actual, expected })))
    }
  }
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.waitForFunction(() => document.querySelector('.world-viewport').getBoundingClientRect().x === 200)
  await page.screenshot({ path: '/private/tmp/populous-hud-scale-after.png' })
  await page.evaluate(() => document.querySelector('main').style.setProperty('--hud-scale-x', '1.5'))
  assert.equal(await page.locator('.native-hud').evaluate(el => el.getBoundingClientRect().width), 150)
  await page.screenshot({ path: '/private/tmp/populous-hud-scale-before.png' })
  await page.evaluate(() => document.querySelector('main').style.setProperty('--hud-scale-x', '2'))
  assert.deepEqual(errors, [])
  console.log('PASS: native sidebar/health geometry and live renderer resize at eight desktop sizes; 1280×720 sidebar corrected from 150 to 200px')
} finally {
  await browser.close()
}
