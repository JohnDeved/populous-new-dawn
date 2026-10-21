import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import { enterRouteLevel, captureRouteClock, advanceRouteClock, releaseRouteClock,
  issueRouteAnchorCommand, publishRouteNotice, observeRouteNotice, assertRouteVisible } from './route-notice-modal.mjs'

// Controlled publications deliberately reuse serial77 across a real public
// restart. Invoke the retained disposed Scene's actual RAF callback, not a removed
// React/CSS completion handler. This is not an earned pathfinding-failure test.
export default async function ({ page, output }) {
  const observations = [], button = name => page.getByRole('button', { name, exact: true }),
    record = value => {
      observations.push(value)
      writeFileSync(resolve(output, 'route-notice-replacement.json'), JSON.stringify({
        scope: 'public commands/restart; controlled publications and retained real Scene callback; fixture-owned frame clock',
        referenceHz: 24, lifetimeEligibleVisits: 72, observations,
      }, null, 2))
    }
  await page.setViewportSize({ width: 960, height: 720 })
  await openCampaignFromMainMenu(page); await button('Start Mission 1').click()
  await enterRouteLevel(page); await page.evaluate(captureRouteClock)
  try {
    const oldCommand = await issueRouteAnchorCommand(page)
    await page.evaluate(publishRouteNotice, 77)
    await page.evaluate(advanceRouteClock, { count: 1 })
    const old = await page.evaluate(observeRouteNotice)
    record({ stage: 'old-publication', oldCommand, old }); assertRouteVisible(old, 71)
    await page.evaluate(() => { window.staleRouteNoticeFixture = window.routeNoticeFixture })
    await button('Menu').click(); await button('Restart Level').click(); await button('Yes').click()
    await page.waitForFunction(() => window.testStore.getWorld() !== window.staleRouteNoticeFixture.world)
    await enterRouteLevel(page); await page.evaluate(captureRouteClock)
    const newCommand = await issueRouteAnchorCommand(page)
    await page.evaluate(publishRouteNotice, 77)
    await page.evaluate(advanceRouteClock, { count: 1 })
    const before = await page.evaluate(observeRouteNotice)
    record({ stage: 'replacement-publication', newCommand, before }); assertRouteVisible(before, 71)
    const ownership = await page.evaluate(() => ({
      replacedWorld: window.routeNoticeFixture.world !== window.staleRouteNoticeFixture.world,
      replacedScene: window.routeNoticeFixture.scene !== window.staleRouteNoticeFixture.scene,
      staleInactive: !window.staleRouteNoticeFixture.scene.isCurrent(),
      sameSerial: window.routeNoticeFixture.notice.serial === window.staleRouteNoticeFixture.notice.serial,
    }))
    assert.ok(Object.values(ownership).every(Boolean))
    const stale = await page.evaluate(advanceRouteClock, { count: 96, mode: 'frames', stale: true })
    assert.equal(stale.visits, 0)
    const after = await page.evaluate(observeRouteNotice)
    record({ stage: 'stale-owner', ownership, stale, before, after })
    assert.deepEqual(after, before, 'stale owner cannot advance or clear replacement presentation')
    assert.equal(await page.evaluate(() => window.staleRouteNoticeFixture.scene.tooltip.remaining), old.remaining)
    await page.evaluate(advanceRouteClock, { count: 70 }); assertRouteVisible(await page.evaluate(observeRouteNotice), 1)
    await page.screenshot({ path: resolve(output, 'route-notice-replacement.png') })
    await page.evaluate(advanceRouteClock, { count: 1 })
    const expired = await page.evaluate(observeRouteNotice)
    record({ stage: 'replacement-expiry', expired })
    assert.equal(expired.remaining, 0); assert.equal(expired.visits, 72); assert.equal(expired.hidden, true)
    assert.equal(await page.evaluate(() => window.testStore.getWorld().routeNotice), null)
    const result = { oldCommand, newCommand, old, ownership, stale, before, after, expired }
    return { status: 'passed', result }
  } finally { await page.evaluate(releaseRouteClock) }
}
