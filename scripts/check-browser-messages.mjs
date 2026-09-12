// Browser integration for native type-3 message motion and modern uniform HUD scaling.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const sound = await page.evaluate(async () => {
    const scene = window.testScene, world = scene.world
    const { addMessage } = await import('/app/messages.ts')
    const { advanceGame } = await import('/app/game-clock.ts')
    world.messages.slots.fill(null)
    world.messages.nextSerial = 0
    for (const [age, stringId] of [[3, 615], [2, 616], [1, 611]]) {
      const slot = addMessage(world.messages, stringId, () => 0)
      world.messages.slots[slot].age = age
    }
    world.speed = 0
    world.paused = false
    const played = []
    scene.onSound = (cue, attenuation, pan) => played.push({ cue, attenuation, pan })
    advanceGame(world, scene.gameClock, 5)
    world.paused = true
    scene.playWorldSounds()
    scene.onChange()
    return { queued: world.sounds.some(event => event.cue === 0xe4), played }
  })
  assert.equal(sound.queued, true)
  assert.ok(sound.played.some(event => event.cue === 0xe4 && event.attenuation === 1 && event.pan === 0))
  await page.waitForTimeout(250)
  const messages = await page.locator('.campaign-messages summary').evaluateAll(nodes =>
    nodes.map(node => {
      const rect = node.getBoundingClientRect()
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    })
  )
  assert.deepEqual(messages, [
    { left: 200, top: 910, width: 64, height: 50 },
    { left: 200, top: 860, width: 64, height: 50 },
    { left: 200, top: 810, width: 64, height: 50 },
  ])
  assert.deepEqual(
    await page.locator('.campaign-messages summary img').first().evaluate(node => {
      const rect = node.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }),
    { width: 30, height: 44 }
  )
  await page.locator('.campaign-messages summary').first().click()
  await page.getByText(/Single Shot Landbridge/).waitFor()
  const popup = await page.locator('.campaign-messages details').first().locator('div').evaluate(node => {
    const rect = node.getBoundingClientRect()
    return { top: rect.top, bottom: rect.bottom, height: rect.height, viewport: innerHeight }
  })
  assert.ok(popup.height > 40 && popup.top >= 0 && popup.bottom <= popup.viewport, popup)
  await page.screenshot({ path: '/private/tmp/populous-messages.png' })
  await page.locator('.campaign-messages button').first().click()
  assert.equal(await page.locator('.campaign-messages details').count(), 2)
  assert.deepEqual(errors, [])
  console.log('PASS: live campaign messages move, stack, scale, open and dismiss')
} finally {
  await browser.close()
}
