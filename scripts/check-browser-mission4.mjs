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
  await page.getByRole('button', { name: 'Return to the world', exact: false }).click()

  await page.evaluate(() => {
    const world = globalThis.testStore.getWorld()
    globalThis.mission4Initial = {
      blue: world.units.filter(unit => unit.team === 'blue').length,
      red: world.units.filter(unit => unit.team === 'red').length,
      wild: world.units.filter(unit => unit.team === 'wild').length,
      rewards: world.shrines.map(shrine => shrine.reward),
      rendered: globalThis.testScene.unitMeshes.size,
    }
  })
  const triggerTutorial = async (turn, promote, warriors, preachers, stringId, text) => {
    await page.evaluate(([turn, promote, warriors, preachers]) => {
      const world = globalThis.testStore.getWorld()
      for (const unit of world.units.filter(unit => unit.team === 'wild').slice(0, promote))
        unit.team = 'blue'
      const followers = world.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave')
      for (const unit of followers.slice(0, warriors)) unit.kind = 'warrior'
      for (const unit of followers.slice(warriors, warriors + preachers)) unit.kind = 'preacher'
      world.turn = turn
    }, [turn, promote, warriors, preachers])
    await page.waitForFunction(
      stringId =>
        globalThis.testStore
          .getWorld()
          .messages.slots.some(message => message?.stringId === stringId),
      stringId
    )
    const message = page.locator('.campaign-messages details').filter({ hasText: text })
    await message.locator('summary').click()
    await message.getByText(text, { exact: false }).waitFor()
  }
  await triggerTutorial(253, 25, 0, 0, 657, 'Build a Warrior Training Hut')
  await triggerTutorial(509, 15, 0, 0, 658, 'subvert your Followers')
  await triggerTutorial(765, 0, 10, 10, 659, 'destroy the Enemy once and for all')

  const result = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld()
    const initial = {
      ...globalThis.mission4Initial,
      tutorials: [657, 658, 659].map(stringId =>
        world.messages.slots.filter(message => message?.stringId === stringId).length
      ),
      tutorialLatches: [20, 21, 24].map(index => world.ai.variables[index]),
    }
    const checkpointWild = world.units.filter(unit => unit.team === 'wild').length
    await globalThis.testStore.saveCheckpoint()
    globalThis.testStore.startMission(1)
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Mission 4 checkpoint load failed')
    const restored = globalThis.testStore.getWorld()
    return { initial, checkpointWild, restored: { level: restored.outcome.level, wild: restored.units.filter(unit => unit.team === 'wild').length } }
  })
  assert.equal(result.initial.blue, 1)
  assert.equal(result.initial.red, 7)
  assert.ok(result.initial.wild >= 50)
  assert.deepEqual(result.initial.rewards, ['tower', 'convertWild', 'lightning'])
  assert.ok(result.initial.rendered > 0)
  assert.deepEqual(result.initial.tutorials, [1, 1, 1])
  assert.deepEqual(result.initial.tutorialLatches, [1, 1, 1])
  assert.deepEqual(result.restored, { level: 4, wild: result.checkpointWild })
  await page.evaluate(() => {
    const world = globalThis.testStore.getWorld()
    world.status = 'won'
    world.outcome.completedLevel = 3
    world.outcome.cameraPlaying = false
    globalThis.testStore.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 5', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 5)
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
  const missionFiveInitialCamera = await page.evaluate(() => ({ ...globalThis.testScene.viewPoint })),
    missionFiveSkip = page.getByRole('button', { name: 'Skip introduction', exact: false })
  await missionFiveSkip.waitFor()
  await page.waitForFunction(
    initial => Math.hypot(
      globalThis.testScene.viewPoint.x - initial.x,
      globalThis.testScene.viewPoint.z - initial.z
    ) > 0.5,
    missionFiveInitialCamera
  )
  await missionFiveSkip.click()
  await page.waitForFunction(() => {
    const world = globalThis.testStore.getWorld()
    return !(world.flyby.flags & 1) && !world.inputMask && world.ai.variables[10] === 2
  })
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByText('Claim the Boat from the stone head', { exact: true }).waitFor()
  await page.getByText('Board followers onto the Boat', { exact: true }).waitFor()
  await page.getByText('Claim the Boat from the stone head, board your followers', { exact: false }).waitFor()
  await page.getByRole('button', { name: 'Return to the world', exact: false }).click()
  const missionFive = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld(),
      { tick } = await import('/app/model.ts')
    world.units = world.units.filter(unit => unit.team !== 'red')
    for (const building of world.buildings.filter(building => building.team === 'red')) building.hp = 0
    for (let i = 0; i < 64 && world.status === 'playing'; i++) tick(world, 1 / 12)
    globalThis.testStore.update()
    return {
      level: world.outcome.level,
      status: world.status,
      completed: world.outcome.completedLevel,
      profile: globalThis.testStore.getCompletedMissions(),
    }
  })
  assert.deepEqual(missionFive, { level: 5, status: 'won', completed: 4, profile: [4, 5] })
  await page.getByRole('button', { name: 'Begin again', exact: false }).waitFor()
  assert.deepEqual(errors, [])
  console.log('PASS: Mission 4 opens, restores, continues into playable Mission 5 and records its victory')
} finally {
  await browser.close()
}
