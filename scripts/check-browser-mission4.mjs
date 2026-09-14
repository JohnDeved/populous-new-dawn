import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld) globalThis.testStore = hook.memoizedState
    globalThis.testStore.startMission(3)
    const world = globalThis.testStore.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    globalThis.testStore.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 4', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 4)
  await page.waitForFunction(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (
          hook.memoizedState?.current?.unitMeshes &&
          hook.memoizedState.current.world === globalThis.testStore.getWorld()
        )
          globalThis.testScene = hook.memoizedState.current
    return globalThis.testScene?.world === globalThis.testStore.getWorld()
  })
  const initialCamera = await page.evaluate(() => ({ ...globalThis.testScene.viewPoint })),
    skip = page.getByRole('button', { name: 'Skip introduction', exact: false })
  await skip.waitFor()
  await page.waitForFunction(
    initial => Math.hypot(
      globalThis.testScene.viewPoint.x - initial.x,
      globalThis.testScene.viewPoint.z - initial.z
    ) > 0.5,
    initialCamera
  )
  await skip.click()
  await page.waitForFunction(() => {
    const world = globalThis.testStore.getWorld()
    return !(world.flyby.flags & 1) && !(world.inputMask & 64)
  })
  await page.getByRole('button', { name: 'Convert Wild, 0 shots' }).waitFor()
  await page.getByLabel('Focus Matak tribe').waitFor()
  await page.getByText('We face a great threat.', { exact: false }).waitFor()
  await page.getByRole('button', { name: 'buildings B' }).click()
  assert.equal(await page.getByRole('button', { name: 'Guard Tower, 5 wood' }).isDisabled(), true)
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByText('Objectives · 0 / 3', { exact: true }).click()
  await page.getByText('Convert the Wildmen', { exact: true }).waitFor()
  await page.getByText('Discover the Guard Tower', { exact: true }).waitFor()

  const result = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld()
    const initial = {
      blue: world.units.filter(unit => unit.team === 'blue').length,
      red: world.units.filter(unit => unit.team === 'red').length,
      wild: world.units.filter(unit => unit.team === 'wild').length,
      rewards: world.shrines.map(shrine => shrine.reward),
      rendered: globalThis.testScene.unitMeshes.size,
    }
    await globalThis.testStore.saveCheckpoint()
    globalThis.testStore.startMission(1)
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Mission 4 checkpoint load failed')
    const restored = globalThis.testStore.getWorld()
    return { initial, restored: { level: restored.outcome.level, wild: restored.units.filter(unit => unit.team === 'wild').length } }
  })
  assert.equal(result.initial.blue, 1)
  assert.equal(result.initial.red, 7)
  assert.ok(result.initial.wild >= 50)
  assert.deepEqual(result.initial.rewards, ['tower', 'convertWild', 'lightning'])
  assert.ok(result.initial.rendered > 0)
  assert.deepEqual(result.restored, { level: 4, wild: result.initial.wild })
  assert.deepEqual(errors, [])
  console.log('PASS: Mission 4 opening flyby skips into playable HUD and restores its checkpoint')
} finally {
  await browser.close()
}
