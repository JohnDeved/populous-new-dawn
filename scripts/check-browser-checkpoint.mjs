import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const missionTwoMessage =
  'Now we must face the Matak Tribe. I sense many Warriors ready to stand against us. In my vision we are aided by magic from a Stone Head. There must be a way to reach it...'

async function assertMissionTwoMessage(page) {
  await page.getByText(missionTwoMessage, { exact: true }).waitFor()
  const icon = page.locator('.campaign-messages summary img')
  assert.equal(await icon.getAttribute('src'), '/original/message-type1.png')
  assert.deepEqual(await icon.evaluate(node => {
    const { width, height } = node.getBoundingClientRect()
    return { width, height }
  }), { width: 50, height: 36 })
  const popup = await page.locator('.campaign-messages details>div').evaluate(node => {
    const { top, bottom, height } = node.getBoundingClientRect()
    return { top, bottom, height, viewport: innerHeight }
  })
  assert.ok(popup.height > 40 && popup.top >= 0 && popup.bottom <= popup.viewport, popup)
}

async function waitForScene(page) {
  await page.waitForSelector('.world-viewport canvas')
  await page.waitForFunction(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return) {
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        if (hook.memoizedState?.current?.unitMeshes)
          globalThis.testScene = hook.memoizedState.current
        if (hook.memoizedState?.getWorld) globalThis.testStore = hook.memoizedState
      }
    }
    return !!globalThis.testScene
  })
}

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser)
  assert.equal(await page.getByRole('dialog', { name: 'Start game' }).count(), 0)
  const missionOne = await page.evaluate(() => ({
    height: globalThis.testScene.world.land.heights[0],
    hp: globalThis.testScene.world.units[0].hp,
  }))
  await page.evaluate(async () => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld) globalThis.testStore = hook.memoizedState
    const world = globalThis.testStore.getWorld(),
      { tick } = await import('/app/model.ts')
    world.units = world.units.filter(unit => unit.team === 'blue')
    world.turn = 31
    tick(world, 1 / 12)
    globalThis.testStore.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 2', exact: false }).click()
  await waitForScene(page)
  await page.waitForFunction(() => globalThis.testScene.world === globalThis.testStore.getWorld())
  const original = await page.evaluate(() => ({
    level: globalThis.testScene.world.outcome.level,
    height: globalThis.testScene.world.land.heights[0],
    hp: globalThis.testScene.world.units[0].hp,
  }))
  assert.equal(original.level, 2)
  await page.locator('.loading-world').waitFor({ state: 'detached' })
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => {
    const world = globalThis.testStore.getWorld(),
      tower = world.buildings.find(building => building.team === 'red' && building.kind === 'tower'),
      patrols = world.units.filter(unit => {
        if (unit.team !== 'red' || !unit.native) return false
        const id = unit.native.immediateCommand || unit.native.commands[unit.native.commandCursor],
          order = id ? world.buildingOrders.records[id] : null
        return order?.model === 25
      }).length
    return (
      world.turn >= 122 &&
      !(world.inputMask & 128) &&
      world.ai.flags & 0x40000 &&
      tower &&
      world.units.some(unit => unit.inside === tower.id && unit.kind === 'warrior') &&
      patrols === 3 &&
      world.messages.slots[world.lastMessage]?.stringId === 641
    )
  })
  await page.waitForFunction(() => !globalThis.testStore.getWorld().inputMask)
  await assertMissionTwoMessage(page)
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
    level: globalThis.testScene.world.outcome.level,
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
  const startup = page.getByRole('dialog', { name: 'Start game' })
  await startup.waitFor()
  assert.equal(await page.locator('.world-viewport canvas').count(), 0, 'no hidden fresh scene')
  await page.getByRole('button', { name: 'Load Game', exact: true }).click()
  await waitForScene(page)
  await page.waitForFunction(
    expected => {
      const world = globalThis.testScene.world
      return (
        world.turn === expected.turn &&
        world.outcome.level === expected.level &&
        world.land.heights[0] === expected.height &&
        world.units[0].hp === expected.hp
      )
    },
    saved
  )
  const restored = await page.evaluate(() => ({
    level: globalThis.testScene.world.outcome.level,
    turn: globalThis.testScene.world.turn,
    height: globalThis.testScene.world.land.heights[0],
    hp: globalThis.testScene.world.units[0].hp,
    paused: globalThis.testScene.world.paused,
    soundSerial: globalThis.testScene.world.soundSerial,
    soundCursor: globalThis.testScene.soundSerial,
    soundPlaying: globalThis.testScene.world.buildings[0].burn.soundPlaying,
  }))
  assert.deepEqual(restored, {
    level: 2,
    turn: saved.turn,
    height: saved.height,
    hp: saved.hp,
    paused: false,
    soundSerial: restored.soundSerial,
    soundCursor: restored.soundSerial,
    soundPlaying: false,
  })
  assert.ok(restored.soundSerial)
  await assertMissionTwoMessage(page)

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('dialog', { name: 'Start game' }).waitFor()
  await page.getByRole('button', { name: 'New Game', exact: true }).click()
  await waitForScene(page)
  const fresh = await page.evaluate(() => ({
    turn: globalThis.testScene.world.turn,
    height: globalThis.testScene.world.land.heights[0],
    hp: globalThis.testScene.world.units[0].hp,
  }))
  assert.notEqual(fresh.turn, saved.turn)
  assert.deepEqual({ height: fresh.height, hp: fresh.hp }, missionOne)
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
  console.log('PASS: startup Load Game restores Mission 2; New Game starts fresh in Mission 1')
} finally {
  await browser.close()
}
