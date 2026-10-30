import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, showSelectorControls } from '../browser-game.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'

// Real Home/store/scene fixture. Only the lost outcome prerequisite is seeded;
// this does not establish natural defeat, statistics producers, or native timing.
export default async function ({ page, output }) {
  const button = name => page.getByRole('button', { name, exact: true })
  const result = page.locator('[data-original-result]')
  const selector = page.getByRole('dialog', { name: 'Start game', exact: true })
  const observations = []
  await page.setViewportSize({ width: 960, height: 720 })
  await openCampaignFromMainMenu(page)
  await button('Start Mission 1').click()
  await bindGame(page)
  await skipIntroductionWithSpace(page, { timeout: 45000 })
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
  await page.locator('.world-viewport').press('Space')
  assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), true)
  await page.evaluate(() => {
    const world = window.testStore.getWorld(), scene = window.testSceneRef.current
    window.resultLossFixture = { world, scene, canvas: scene.renderer.domElement }
    window.testStore.change(w => { w.status = 'lost'; w.outcome.cameraPlaying = false })
  })
  await result.waitFor({ state: 'visible' })
  assert.equal(await result.getByRole('heading', { name: 'Level Lost', exact: true }).count(), 1)
  assert.equal(await result.getByRole('button', { name: 'Restart Level', exact: true }).count(), 1)
  assert.equal(await result.getByRole('button', { name: /Continue to Mission/ }).count(), 0)
  assert.equal(await result.getByRole('group', { name: /: unavailable$/ }).count(), 10)
  await page.screenshot({ path: resolve(output, 'lost-result.png') })
  for (const route of ['Back', 'Escape']) {
    await result.getByRole('button', { name: 'Select Level', exact: true }).click()
    await selector.waitFor({ state: 'visible' })
    if (route === 'Back') {
      await showSelectorControls(page)
      await selector.getByRole('button', { name: 'Back', exact: true }).click()
    } else await page.keyboard.press('Escape')
    await selector.waitFor({ state: 'hidden' })
    await result.waitFor({ state: 'visible' })
    const retained = await page.evaluate(() => {
      const fixture = window.resultLossFixture, world = window.testStore.getWorld()
      return { sameWorld: world === fixture.world, sameScene: window.testSceneRef.current === fixture.scene,
        sameCanvas: window.testSceneRef.current.renderer.domElement === fixture.canvas,
        disposed: fixture.scene.disposed, status: world.status, paused: world.paused }
    })
    assert.deepEqual(retained, { sameWorld: true, sameScene: true, sameCanvas: true, disposed: false, status: 'lost', paused: true })
    assert.equal(await page.getByRole('dialog', { name: 'Game menu', exact: true }).count(), 0)
    observations.push({ route, retained })
  }
  await result.getByRole('button', { name: 'Restart Level', exact: true }).click()
  await page.waitForFunction(() => window.testStore.getWorld() !== window.resultLossFixture.world)
  await bindGame(page)
  await result.waitFor({ state: 'detached' })
  await skipIntroductionWithSpace(page, { timeout: 45000 })
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
  const restarted = await page.evaluate(() => {
    const fixture = window.resultLossFixture, world = window.testStore.getWorld(), scene = window.testSceneRef.current
    return { replacedWorld: world !== fixture.world, replacedScene: scene !== fixture.scene,
      sceneOwnsWorld: scene.world === world, oldDisposed: fixture.scene.disposed,
      oldAborted: fixture.scene.terrainLoad.signal.aborted, oldCanvasDetached: !fixture.canvas.isConnected,
      oldStatus: fixture.world.status, oldPaused: fixture.world.paused,
      level: world.outcome.level, status: world.status, paused: world.paused, suspended: scene.modalSuspended }
  })
  assert.deepEqual(restarted, { replacedWorld: true, replacedScene: true, sceneOwnsWorld: true,
    oldDisposed: true, oldAborted: true, oldCanvasDetached: true, oldStatus: 'lost', oldPaused: true,
    level: 1, status: 'playing', paused: false, suspended: false })
  await page.screenshot({ path: resolve(output, 'restarted-after-loss.png') })
  const report = { status: 'passed', scope: 'actual Home with a seeded paused loss; public selector return and Restart', observations, restarted }
  writeFileSync(resolve(output, 'result-loss-lifecycle.json'), JSON.stringify(report, null, 2) + '\n')
  return report
}
