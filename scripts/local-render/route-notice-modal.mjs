import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'

// Presentation fixture only: seed one route notice after real Home/scene startup.
// This does not establish that a public gameplay command produces route failure.
export default async function ({ page, output }) {
  const expected = process.env.PND_ROUTE_NOTICE_EXPECT ?? 'preserved'
  assert.ok(['preserved', 'expired'].includes(expected))
  const observations = [], button = name => page.getByRole('button', { name, exact: true })
  const record = value => {
    observations.push(value)
    writeFileSync(resolve(output, 'route-notice.json'), JSON.stringify({
      scope: 'actual Home CSS/handlers with a controlled route-notice fixture', expected, observations,
    }, null, 2))
  }
  await page.setViewportSize({ width: 960, height: 720 })
  await openCampaignFromMainMenu(page)
  await button('Start Mission 1').click()
  await bindGame(page)
  await page.locator('.skip-introduction').click()
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
  for (const initiallyPaused of [false, true]) {
    if (initiallyPaused) await button('Pause game').click()
    assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), initiallyPaused)
    await page.evaluate(() => {
      const store = window.testStore, world = store.getWorld()
      store.change(w => { w.routeNotice = { flags: 0x200000, message: 603, serial: (w.routeNotice?.serial ?? 0) + 1 } })
      window.routeNoticeFixture = { world, notice: world.routeNotice, scene: window.testSceneRef.current,
        canvas: document.querySelector('.world-viewport canvas') }
    })
    await page.locator('.route-notice').waitFor({ state: 'visible' })
    await page.evaluate(() => {
      const fixture = window.routeNoticeFixture
      fixture.animation = document.querySelector('.route-notice').getAnimations()[0]
      fixture.animation.addEventListener('finish', () => { fixture.finishedAt = performance.now() }, { once: true })
    })
    await page.waitForFunction(() => window.routeNoticeFixture.animation.currentTime >= 1200)
    await button('Game settings').click()
    await page.getByRole('dialog', { name: 'Game menu', exact: true }).waitFor()
    const observe = () => page.evaluate(() => {
      const fixture = window.routeNoticeFixture, world = window.testStore.getWorld()
      const node = document.querySelector('.route-notice'), animation = node?.getAnimations()[0]
      return { sameWorld: world === fixture.world, sameNotice: world.routeNotice === fixture.notice,
        sameScene: window.testSceneRef.current === fixture.scene, sceneWorld: fixture.scene.world === world,
        sameCanvas: document.querySelector('.world-viewport canvas') === fixture.canvas,
        paused: world.paused, suspended: fixture.scene.modalSuspended, turn: world.turn, time: world.time,
        sameAnimation: animation === fixture.animation,
        animationState: animation?.playState ?? null, animationTime: animation?.currentTime ?? null }
    })
    const before = await observe()
    await page.waitForTimeout(3400)
    const after = await observe()
    record({ initiallyPaused, stage: 'hidden-longer-than-original-lifetime', before, after })
    for (const key of ['sameWorld', 'sameScene', 'sceneWorld', 'sameCanvas', 'paused', 'suspended']) assert.equal(after[key], true)
    assert.equal(after.turn, before.turn); assert.equal(after.time, before.time)
    if (expected === 'expired') {
      assert.equal(before.animationState, 'running')
      assert.equal(after.sameNotice, false, 'baseline must reproduce hidden notice expiry')
      assert.equal(after.animationState, null)
      await page.screenshot({ path: resolve(output, `route-notice-baseline-menu-${initiallyPaused}.png`) })
      await button('Continue Game').click()
      assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), initiallyPaused)
      record({ initiallyPaused, stage: 'baseline-return-expired', final: await observe() })
      continue
    }
    assert.equal(after.sameNotice, true, 'menu must retain the notice beyond its wall-clock lifetime')
    assert.equal(after.sameAnimation, true)
    assert.equal(after.animationState, 'paused')
    assert.ok(Math.abs(after.animationTime - before.animationTime) < 60)
    await button('Quit Level').click(); await button('No').click()
    await button('Options').click(); await button('Browser compatibility and help').click()
    await button('Select Level').click()
    const selector = await observe()
    assert.equal(selector.animationState, 'paused')
    assert.equal(selector.sameAnimation, true)
    await page.keyboard.press('Escape')
    await button('Continue Game').click()
    await page.locator('.route-notice').waitFor({ state: 'visible' })
    await button('Game settings').click()
    await page.waitForTimeout(500)
    const reopened = await observe()
    assert.equal(reopened.sameNotice, true)
    assert.equal(reopened.sameAnimation, true)
    assert.ok(reopened.animationTime >= after.animationTime)
    await page.screenshot({ path: resolve(output, `route-notice-menu-${initiallyPaused}.png`) })
    await page.keyboard.press('Escape')
    assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), initiallyPaused)
    const resumed = await page.evaluate(() => {
      const fixture = window.routeNoticeFixture
      const animation = document.querySelector('.route-notice').getAnimations()[0]
      fixture.resumedAt = performance.now()
      return { sameAnimation: animation === fixture.animation, currentTime: animation.currentTime,
        remaining: animation.effect.getTiming().duration - animation.currentTime }
    })
    assert.equal(resumed.sameAnimation, true)
    assert.ok(resumed.currentTime >= 1200)
    assert.ok(resumed.remaining > 0 && resumed.remaining <= 1800)
    await page.screenshot({ path: resolve(output, `route-notice-return-${initiallyPaused}.png`) })
    await page.waitForFunction(() => window.testStore.getWorld().routeNotice === null, null, { timeout: 5000 })
    const elapsed = await page.evaluate(() => window.routeNoticeFixture.finishedAt - window.routeNoticeFixture.resumedAt)
    record({ initiallyPaused, stage: 'resumed-presentation-expired', resumed, elapsed, final: await observe() })
    assert.ok(Number.isFinite(elapsed) && Math.abs(elapsed - resumed.remaining) < 250,
      `expiry ${elapsed}ms must match remaining ${resumed.remaining}ms, not restart at three seconds`)
  }
  return { status: 'passed', episodes: observations.length / 2, observations }
}
