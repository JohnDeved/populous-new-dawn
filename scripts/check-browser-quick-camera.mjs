// Start the dev server, then: POPULOUS_URL=http://localhost:3000 node scripts/check-browser-quick-camera.mjs [captureDir]
// Real keyboard input: period moves the camera to the Shaman (native action 0x5d), H to the
// player reincarnation site (native action 0x96). Neither changes selection.
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const captures = process.argv[2] ?? 'work/quick-camera'
mkdirSync(captures, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const speed = await page.evaluate(() => window.testScene.world.speed)
  await page.evaluate(() => { const s = window.testScene; s.world.speed = 0; s.focus({ x: 2, z: 30 }) })
  // An open campaign message owns gameplay shortcuts; collapse it through its public summary.
  for (const summary of await page.locator('.campaign-messages details[open] > summary').all()) await summary.click()
  assert.equal(await page.locator('.campaign-messages details[open]').count(), 0)
  // Separate the two targets: Mission 1 starts the Shaman on her site. Walk her away with an
  // ordinary portrait selection plus a supplied move command, then stop the clock.
  await page.evaluate(speed => { const s = window.testScene; s.world.speed = speed; s.focus({ x: 9, z: 33 }) }, speed)
  await page.getByRole('button', { name: 'Select shaman', exact: true }).click()
  await page.waitForFunction(() => window.testScene.world.selected.length === 1)
  // Supplied setup: issue the ordinary move through the shipped command owner (not real input).
  assert.equal(await page.evaluate(async () => {
    const { command } = await import('/app/model.ts')
    return command(window.testScene.world, { x: 17, z: 30 })
  }), true, 'Move command accepted')
  await page.waitForFunction(() => {
    const w = window.testScene.world, u = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    return Math.hypot(u.x - 9, u.z - 33) > 4
  }, undefined, { timeout: 60000 })
  await page.evaluate(() => { const s = window.testScene; s.world.speed = 0; s.focus({ x: 2, z: 30 }) })
  await page.locator('.world-viewport canvas.battlefield').focus()
  // Ordinary Escape cancels the selection, so H can be shown not to select the Shaman.
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => window.testScene.world.selected.length === 0)
  await page.screenshot({ path: `${captures}/0-away.png` })
  const state = () => page.evaluate(() => {
    const s = window.testScene, w = s.world, shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
    return { view: s.viewPoint, motion: s.cameraMotion.active, selected: [...w.selected],
      shaman: shaman && { x: shaman.x, z: shaman.z }, site: w.reincarnationSites[0] }
  })
  const arrive = async () => {
    await page.waitForFunction(() => !window.testScene.cameraMotion.active)
    return state()
  }
  const near = (a, b, label) => assert.ok(Math.hypot(a.x - b.x, a.z - b.z) < 1.5, `${label}: ${JSON.stringify({ a, b })}`)

  const selection = (await state()).selected
  await page.keyboard.press('Period')
  assert.equal((await state()).motion, 1, 'Period starts an animated camera journey')
  const atShaman = await arrive()
  near(atShaman.view, atShaman.shaman, 'Camera arrives at the Shaman')
  assert.deepEqual(atShaman.selected, selection, 'Period is camera-only')
  await page.screenshot({ path: `${captures}/1-period-shaman.png` })

  await page.evaluate(() => window.testScene.focus({ x: 2, z: 30 }))
  await page.keyboard.press('h')
  assert.equal((await state()).motion, 1, 'H starts an animated camera journey')
  const atSite = await arrive()
  const site = await page.evaluate(async () => {
    const { browserPosition } = await import('/app/model.ts')
    return browserPosition(window.testScene.world.reincarnationSites[0])
  })
  near(atSite.view, site, 'Camera arrives at the reincarnation site')
  assert.deepEqual(atSite.selected, selection, 'H no longer changes selection')
  await page.screenshot({ path: `${captures}/2-h-reincarnation-site.png` })

  const before = await state()
  await page.keyboard.press('Shift+H')
  await page.keyboard.press('Control+Period')
  const after = await state()
  assert.equal(after.motion, 0, 'Modified variants do not match the native records')
  assert.deepEqual(after.view, before.view)
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ status: 'passed', atShaman, atSite, site, captures }, null, 2))
} finally {
  await browser.close()
}
