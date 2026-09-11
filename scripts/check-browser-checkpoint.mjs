import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const scene = globalThis.testScene
    scene.world.speed = 0
    const { sound } = await import('/app/model.ts')
    sound(scene.world, 0x37, scene.world.units[0])
  })
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  const load = page.getByRole('button', { name: 'Load checkpoint', exact: true })
  assert.equal(await load.isDisabled(), true)
  await page.evaluate(() => {
    globalThis.testScene.world.buildings[0].burn = { remaining: 127, soundPlaying: true }
  })
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  assert.equal(await load.isEnabled(), true)
  const saved = await page.evaluate(() => ({
    turn: globalThis.testScene.world.turn,
    hp: globalThis.testScene.world.units[0].hp,
  }))
  await page.evaluate(() => {
    globalThis.testScene.world.turn = 999
    globalThis.testScene.world.units[0].hp = 1
  })
  await load.click()
  await page.waitForFunction(expected => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        const scene = hook.memoizedState?.current
        if (
          scene?.unitMeshes &&
          scene.world.turn === expected.turn &&
          scene.world.units[0].hp === expected.hp
        ) {
          globalThis.testScene = scene
          return true
        }
      }
    return false
  }, saved)
  const restored = await page.evaluate(() => ({
    turn: globalThis.testScene.world.turn,
    hp: globalThis.testScene.world.units[0].hp,
    paused: globalThis.testScene.world.paused,
    soundSerial: globalThis.testScene.world.soundSerial,
    soundCursor: globalThis.testScene.soundSerial,
    soundPlaying: globalThis.testScene.world.buildings[0].burn.soundPlaying,
  }))
  assert.deepEqual(restored, {
    turn: saved.turn,
    hp: saved.hp,
    paused: false,
    soundSerial: restored.soundSerial,
    soundCursor: restored.soundSerial,
    soundPlaying: false,
  })
  assert.ok(restored.soundSerial)
  assert.deepEqual(errors, [])
  console.log('PASS: pause-menu checkpoint restores an isolated world and rebuilds the live scene')
} finally {
  await browser.close()
}
