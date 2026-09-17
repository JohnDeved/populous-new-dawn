import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    errors = []
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Mission 20', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => !globalThis.testScene.world.inputMask)
  await page.getByText(/create more land to build on/).waitFor()

  async function worship(reward) {
    const point = await page.evaluate(async reward => {
      const scene = globalThis.testScene,
        world = scene.world,
        { addUnit, browserPosition, nativePosition } = await import('/app/model.ts'),
        { syncLivePersonCells } = await import('/app/live-people.ts'),
        { worshipPositions } = await import('/app/worship.ts'),
        head = world.shrines.find(shrine => shrine.active && shrine.reward === reward),
        slots = worshipPositions({
          ...nativePosition(world, head),
          angle: Math.round((head.angle * 1024) / Math.PI) & 2047,
        })
      slots
        .slice(0, head.required)
        .forEach(slot => addUnit(world, 'blue', 'brave', browserPosition(slot)))
      syncLivePersonCells(world)
      world.selected = []
      world.speed = 0
      scene.focus(head)
      scene.onChange()
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
      const projected = scene.screen(head),
        rect = scene.container.getBoundingClientRect(),
        x = rect.left + ((projected.x + 1) * rect.width) / 2,
        y = rect.top + ((1 - projected.y) * rect.height) / 2
      for (let dy = -75; dy <= 0; dy += 3)
        for (let dx = -20; dx <= 20; dx += 3) {
          const event = { clientX: x + dx, clientY: y + dy }
          if (!scene.pickUnit(event) && scene.pickWorldObject(event)?.id === head.id)
            return { ...event, head: head.id }
        }
      throw new Error(`No exposed ${reward} head geometry`)
    }, reward)
    await page.getByRole('button', { name: 'Select brave', exact: true }).click({ modifiers: ['Shift'] })
    await page.mouse.click(point.clientX, point.clientY)
    return page.evaluate(async ({ head: headId, reward }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        { tick } = await import('/app/model.ts'),
        head = world.shrines.find(shrine => shrine.id === headId)
      world.speed = 1
      for (let turn = 0; turn < 24; turn++) tick(world, 1 / 12)
      if (!head.followers) throw new Error(`${reward} head click did not enter live worship`)
      head.work = head.target * head.required ** 2 - 1
      for (let turn = 0; turn < 8 && !head.uses; turn++) tick(world, 1 / 12)
      const lightning = world.effects.filter(effect => effect.lightning?.visualOnly).length
      for (let turn = 0; turn < 82 && world.gifts.length; turn++) tick(world, 1 / 12)
      world.speed = 0
      scene.onChange()
      return {
        uses: head.uses,
        active: head.active,
        stock: world.shots[reward],
        next: world.shrines.find(shrine => shrine.active && shrine.kind === 'linkedEffects')?.reward,
        earthquake: world.effects.some(effect => effect.earthquake),
        lightning,
        firestorm: world.effects.some(effect => effect.firestorm),
        volcano: world.effects.some(effect => effect.volcano),
      }
    }, { head: point.head, reward })
  }

  assert.deepEqual(await worship('bridge'), {
    uses: 1,
    active: false,
    stock: 1,
    next: 'flatten',
    earthquake: true,
    lightning: 0,
    firestorm: false,
    volcano: false,
  })
  assert.deepEqual(await worship('flatten'), {
    uses: 1,
    active: false,
    stock: 1,
    next: 'firestorm',
    earthquake: false,
    lightning: 4,
    firestorm: false,
    volcano: false,
  })
  assert.deepEqual(await worship('firestorm'), {
    uses: 1,
    active: false,
    stock: 1,
    next: 'volcano',
    earthquake: false,
    lightning: 0,
    firestorm: true,
    volcano: true,
  })
  assert.equal((await worship('volcano')).next, undefined)
  await page.getByRole('button', { name: 'Land Bridge, 1 shots', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Flatten, 1 shots', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Firestorm, 1 shots', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Volcano, 1 shots', exact: true }).waitFor()

  await page.evaluate(() => {
    const store = globalThis.testStore
    store.startMission(19)
    const world = store.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    store.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 20', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 20)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  assert.deepEqual(errors, [])
  console.log('PASS: Mission 20 continuation, opening, four linked heads, effects, and HUD stocks')
} finally {
  await browser.close()
}
