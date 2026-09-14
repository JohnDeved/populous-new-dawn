import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld) globalThis.testStore = hook.memoizedState
    globalThis.testStore.startMission(2)
    const world = globalThis.testStore.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    globalThis.testStore.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 3', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 3)
  await page.getByRole('button', { name: 'Swarm, 0 shots' }).waitFor()
  await page.getByLabel('Focus Chumara tribe').waitFor()
  assert.equal(await page.getByText('Reach the Chumara Vault').count(), 1)
  assert.equal(await page.getByText('Build a Temple and train a Preacher').count(), 1)
  await page.waitForFunction(() => {
    const world = globalThis.testStore.getWorld()
    return world.outcome.level === 3 && world.turn >= 16 && world.flyby.flags & 1
  })
  await page.waitForFunction(() => {
    const world = globalThis.testStore.getWorld()
    return world.spellCasts[2][17] === 1 && world.units.filter(unit => unit.team === 'wild').length < 44
  })
  const result = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld()
    const initial = {
      level: world.outcome.level,
      blue: world.units.filter(unit => unit.team === 'blue').length,
      red: world.units.filter(unit => unit.team === 'red').length,
      wild: world.units.filter(unit => unit.team === 'wild').length,
      vault: world.shrines.some(shrine => shrine.kind === 'vault' && shrine.reward === 'temple'),
      erosion: world.shrines.some(shrine => shrine.kind === 'erosionEffect'),
      recurringFlyby: {
        events: world.flyby.events.length,
        end: world.flyby.end,
        inputLocked: !!(world.inputMask & 64),
      },
      convertWild: {
        casts: world.spellCasts[2][17],
        stock: world.manaWorld.spells[2].stocks[17],
      },
    }
    await globalThis.testStore.saveCheckpoint()
    world.unlockedTemple = true
    globalThis.testStore.startMission(1)
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Mission 3 checkpoint load failed')
    const restored = globalThis.testStore.getWorld(),
      checkpoint = { level: restored.outcome.level, unlockedTemple: restored.unlockedTemple }
    globalThis.testStore.restart()
    const restarted = globalThis.testStore.getWorld()
    return {
      initial,
      checkpoint,
      restart: {
        level: restarted.outcome.level,
        blue: restarted.units.filter(unit => unit.team === 'blue').length,
        red: restarted.units.filter(unit => unit.team === 'red').length,
        wild: restarted.units.filter(unit => unit.team === 'wild').length,
      },
    }
  })
  assert.deepEqual(result, {
    initial: {
      level: 3,
      blue: 1,
      red: 8,
      wild: 43,
      vault: true,
      erosion: true,
      recurringFlyby: {
        events: 22,
        end: { x: 42, y: 166, angle: 1144, zoom: 0 },
        inputLocked: true,
      },
      convertWild: { casts: 1, stock: 0 },
    },
    checkpoint: { level: 3, unlockedTemple: false },
    restart: { level: 3, blue: 1, red: 7, wild: 44 },
  })
  assert.deepEqual(errors, [])
  console.log('PASS: Mission 2 continuation opens Mission 3 data, flyby and Chumara conversion')
} finally {
  await browser.close()
}
