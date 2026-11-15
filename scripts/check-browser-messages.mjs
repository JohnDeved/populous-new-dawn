// Browser integration for native type-3 message motion and native screen-parameterized strip geometry.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame, settleOpeningMessages } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  // Mission 1's opening box (611) would pause the world and drop input (#1046).
  await settleOpeningMessages(page)
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
  // 72f5978d5 (decomp/research/campaign-message-presentation.md): the strip is anchored
  // at the browser HUD/world seam; width and each record's position/height use the
  // native 0x44a1f0/0x44a210 screen parameterization, not the uniform HUD scale.
  const native = await page.evaluate(() => {
    const screenX = (value, width) => {
        const product = Math.imul(width, value)
        return (product + ((product >> 31) & 0xffff)) >> 16
      },
      screenY = (value, height) => {
        const product = (Math.imul(height, value) + Math.trunc(height / 2)) | 0
        return (product + ((product >> 31) & 0xffff)) >> 16
      }
    let normalized = 0x0ccc
    if (screenX(normalized, innerWidth) & 1) normalized += 0x66
    return {
      seam: document.querySelector('.world-viewport').getBoundingClientRect().left,
      records: window.testScene.world.messages.slots
        .filter(Boolean)
        .sort((a, b) => b.age - a.age)
        .map(message => ({
          top: screenY(message.position, innerHeight),
          width: screenX(normalized, innerWidth),
          height: screenY(message.height, innerHeight),
        })),
    }
  })
  assert.equal(native.seam, 200)
  assert.deepEqual(
    messages,
    native.records.map(record => ({ left: native.seam, ...record }))
  )
  // Three type-3 messages stack upward from the bottom edge without overlapping.
  assert.equal(messages.length, 3)
  assert.equal(messages[0].top + messages[0].height, 999)
  for (let i = 1; i < messages.length; i++)
    assert.equal(messages[i].top + messages[i].height, messages[i - 1].top, JSON.stringify(messages))
  assert.deepEqual(
    await page.locator('.campaign-messages summary img').first().evaluate(node => {
      const rect = node.getBoundingClientRect()
      return { width: rect.width, height: rect.height, natural: [node.naturalWidth, node.naturalHeight] }
    }),
    // Native message sprite at its own pixel size (public/original/message.png).
    { width: 15, height: 22, natural: [15, 22] }
  )
  assert.equal(
    await page.locator('.campaign-messages summary img').first().getAttribute('src'),
    '/original/message.png'
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
  await page.evaluate(async () => {
    const scene = window.testScene,
      world = scene.world,
      { campaignCommand } = await import('/app/model.ts')
    world.messages.slots.fill(null)
    campaignCommand(world, 1177, [0, 1, 2, 3], {
      fields: [[0, 68], [0, 204], [0, 96], [0, 308]],
    })
    scene.onChange()
  })
  const positioned = page.locator('.campaign-messages details').filter({
    hasText: 'Shaman, this Stone Head will aid you faster',
  })
  await positioned.locator('summary').click()
  assert.deepEqual(
    await page.evaluate(() => {
      const { target } = window.testScene.cameraMotion
      return { x: target.x, y: target.y }
    }),
    { x: 0xcd00, y: 0x6100 }
  )
  assert.equal(await page.evaluate(async () => {
    const world = window.testScene.world,
      message = world.messages.slots.find(message => message?.stringId === 644),
      { stepMessages } = await import('/app/messages.ts')
    const lifetime = message.lifetime
    for (let i = 0; i < lifetime; i++) stepMessages(world.messages)
    window.testScene.onChange()
    return world.messages.slots.some(message => message?.stringId === 644)
  }), false)
  assert.deepEqual(errors, [])
  console.log('PASS: live campaign messages move, stack, focus, expire, use native screen geometry, open and dismiss')
} finally {
  await browser.close()
}
