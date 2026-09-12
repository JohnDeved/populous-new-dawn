// Start npm run dev, then run this file. POPULOUS_URL may select another local preview.
import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', { waitUntil: 'networkidle' })
  await page.waitForSelector('.world-viewport canvas')
  const result = await page.evaluate(async () => {
    const model = await import('/app/model.ts'),
      people = await import('/app/live-people.ts'),
      orders = await import('/app/person-orders.ts')
    let fiber = document.querySelector('main')
    fiber = fiber[Object.keys(fiber).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld) window.testStore = hook.memoizedState
    const world = window.testStore.getWorld(),
      until = (test, turns = 24) => {
        for (let i = 0; i < turns && !test(); i++) model.tick(world, 1 / 12)
        if (!test()) throw new Error('Training scenario timed out')
      }
    world.paused = false
    until(() => !world.ai.tasks.some(task => task.flags & 1 && task.type === 24))
    for (const unit of world.units.filter(unit => unit.team === 'red' && unit.kind === 'warrior'))
      unit.hp = 0
    world.turn = 255
    world.pendingTime = 0
    model.tick(world, 1 / 12)
    until(() => world.ai.tasks.some(task => task.flags & 1 && task.type === 6 && task.phase === 7))
    const assigned = world.units.find(unit => {
        const person = model.unitAnimationSource(unit) ?? unit.native,
          order = person && orders.currentPersonOrder(world.buildingOrders, person)
        return unit.team === 'red' && order?.model === 8
      }),
      idle = world.units.find(
        unit => unit.team === 'red' && unit.kind === 'brave' && unit.id !== assigned.id
      )
    Object.assign(assigned, { x: idle.x, z: idle.z, path: [] })
    world.units = world.units.filter(unit => unit.hp > 0)
    people.syncLivePersonCells(world)
    model.addUnit(world, 'red', 'brave', idle)
    model.tick(world, 1 / 12)
    world.ai.attributes[7] = 25
    world.turn = 318
    world.pendingTime = 0
    model.tick(world, 1 / 12)
    const next = world.ai.tasks.find((task, index) => index !== 0 && task.flags & 1 && task.type === 6)
    world.ai.attributes[7] = 25
    model.tick(world, 1 / 12)
    world.paused = true
    const person = model.unitAnimationSource(assigned) ?? assigned.native
    return {
      phase: next.phase,
      remaining: next.remaining,
      assignedOrder: orders.currentPersonOrder(world.buildingOrders, person)?.model,
    }
  })
  assert.deepEqual(result, { phase: 8, remaining: 0, assignedOrder: 8 })
  assert.deepEqual(errors, [])
  console.log('PASS: live browser AI does not reserve an already committed warrior trainee twice')
} finally {
  await browser.close()
}
