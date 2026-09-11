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
    const { world } = globalThis.testScene,
      [building] = world.buildings,
      [unit] = world.units
    world.turn = 321
    world.land.heights[0] = 17
    unit.hp = 23
    building.burn = { remaining: 127, soundPlaying: true }
  })
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  assert.equal(await load.isEnabled(), true)
  const saved = await page.evaluate(() => ({
    turn: globalThis.testScene.world.turn,
    height: globalThis.testScene.world.land.heights[0],
    hp: globalThis.testScene.world.units[0].hp,
  }))
  await page.waitForFunction(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('populous-new-dawn', 1)
      request.addEventListener('success', () => resolve(request.result))
      request.addEventListener('error', () => reject(request.error))
    })
    const request = database.transaction('checkpoints').objectStore('checkpoints').get('latest')
    return new Promise((resolve, reject) => {
      request.addEventListener('success', () => resolve(request.result?.version === 1))
      request.addEventListener('error', () => reject(request.error))
    })
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.world-viewport canvas')
  await page.waitForFunction(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.current?.unitMeshes)
          globalThis.testScene = hook.memoizedState.current
    return !!globalThis.testScene
  })
  await page.waitForFunction(() => globalThis.testScene.world.flyby.flags & 1)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !globalThis.testScene.world.inputMask)
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  const restoredLoad = page.getByRole('button', { name: 'Load checkpoint', exact: true })
  await restoredLoad.waitFor({ state: 'visible' })
  await page.waitForFunction(() =>
    [...document.querySelectorAll('button')].some(
      button => button.textContent?.includes('Load checkpoint') && !button.disabled
    )
  )
  await restoredLoad.click()
  await page.waitForFunction(expected => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        const scene = hook.memoizedState?.current
        if (
          scene?.unitMeshes &&
          scene.world.turn === expected.turn &&
          scene.world.land.heights[0] === expected.height &&
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
    height: globalThis.testScene.world.land.heights[0],
    hp: globalThis.testScene.world.units[0].hp,
    paused: globalThis.testScene.world.paused,
    soundSerial: globalThis.testScene.world.soundSerial,
    soundCursor: globalThis.testScene.soundSerial,
    soundPlaying: globalThis.testScene.world.buildings[0].burn.soundPlaying,
  }))
  assert.deepEqual(restored, {
    turn: saved.turn,
    height: saved.height,
    hp: saved.hp,
    paused: false,
    soundSerial: restored.soundSerial,
    soundCursor: restored.soundSerial,
    soundPlaying: false,
  })
  assert.ok(restored.soundSerial)
  assert.deepEqual(errors, [])

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addInitScript(() => {
    Object.defineProperty(IDBFactory.prototype, 'open', {
      value: () => {
        throw new Error('Browser storage disabled for checkpoint check')
      },
    })
  })
  const blocked = await openGame({ newPage: () => context.newPage() })
  await blocked.page.getByRole('button', { name: 'Menu', exact: true }).click()
  await blocked.page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await blocked.page
    .getByRole('status')
    .filter({ hasText: 'saved for this session only' })
    .waitFor()
  assert.deepEqual(blocked.errors, [])
  await context.close()
  console.log('PASS: durable checkpoint restores an isolated world after reload')
} finally {
  await browser.close()
}
