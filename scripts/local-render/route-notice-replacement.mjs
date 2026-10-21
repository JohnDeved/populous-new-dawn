import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'

// Retain the actual React handler, then invoke it after a real public restart.
// Notice publication and stale invocation are controlled presentation fixtures.
export default async function ({ page, output }) {
  const expected = process.env.PND_ROUTE_NOTICE_EXPECT ?? 'preserved'
  assert.ok(['preserved', 'expired'].includes(expected))
  const button = name => page.getByRole('button', { name, exact: true })
  await page.setViewportSize({ width: 960, height: 720 })
  await openCampaignFromMainMenu(page)
  await button('Start Mission 1').click(); await bindGame(page)
  await skipIntroductionWithSpace(page)
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
  await page.evaluate(() => window.testStore.change(w => {
    w.routeNotice = { flags: 0x200000, message: 603, serial: 77 }
  }))
  await page.locator('.route-notice').waitFor({ state: 'visible' })
  await page.evaluate(() => {
    const node = document.querySelector('.route-notice')
    const props = Object.keys(node).find(key => key.startsWith('__reactProps$'))
    if (!props || typeof node[props].onAnimationEnd !== 'function') throw Error('Actual React completion handler unavailable')
    window.staleRouteNoticeFixture = { world: window.testStore.getWorld(),
      scene: window.testSceneRef.current, complete: node[props].onAnimationEnd }
  })
  await button('Game settings').click(); await button('Restart Level').click(); await button('Yes').click()
  await page.waitForFunction(() => window.testStore.getWorld() !== window.staleRouteNoticeFixture.world)
  await bindGame(page); await skipIntroductionWithSpace(page)
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
  await page.evaluate(() => window.testStore.change(w => {
    w.routeNotice = { flags: 0x200000, message: 603, serial: 77 }
  }))
  await page.locator('.route-notice').waitFor({ state: 'visible' })
  const result = await page.evaluate(() => {
    const fixture = window.staleRouteNoticeFixture, world = window.testStore.getWorld()
    const notice = world.routeNotice
    fixture.complete()
    return { replacedWorld: world !== fixture.world, replacedScene: window.testSceneRef.current !== fixture.scene,
      sameSerial: notice.serial === 77, noticePreserved: world.routeNotice === notice }
  })
  writeFileSync(resolve(output, 'route-notice-replacement.json'), JSON.stringify({
    scope: 'actual Home retained handler, public restart, controlled notice publication and stale invocation', expected, result,
  }, null, 2))
  assert.equal(result.replacedWorld, true); assert.equal(result.replacedScene, true)
  assert.equal(result.sameSerial, true); assert.equal(result.noticePreserved, expected === 'preserved')
  await page.screenshot({ path: resolve(output, 'route-notice-replacement.png') })
  return { status: 'passed', result }
}
