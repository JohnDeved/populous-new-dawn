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
      orders = await import('/app/person-orders.ts')
    let fiber = document.querySelector('main')
    fiber = fiber[Object.keys(fiber).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld) window.testStore = hook.memoizedState
    const world = window.testStore.getWorld(),
      script = { fields: [[2, 1], [2, 1223], [0, 999], [2, 1224], [0, 0], [0, -1]] },
      args = [1118, 0, 1071, 1, 2, 3, 3, 3, 1078, 4, 5, 5, 4]
    world.paused = false
    world.ai.tasks.forEach(task => (task.flags = 0))
    world.ai.cursor = 0
    model.campaignCommand(world, 1059, args, script)
    const task = world.ai.tasks[0],
      members = world.units.filter(unit => unit.team === 'red' && unit.kind !== 'shaman').slice(0, 2)
    task.phase = 16
    task.members = members.map(unit => unit.id)
    members[1].hp = 0
    world.ai.flags |= 0x100
    world.ai.defencePosition = 0xf204
    world.turn = 1
    world.pendingTime = 0
    model.tick(world, 1 / 12)
    world.paused = true
    const order = orders.currentPersonOrder(world.buildingOrders, members[0].native)
    return {
      requested: task.requested,
      retreatPercent: task.retreatPercent,
      phase: task.phase,
      fallback: task.fallback,
      order: order?.model,
      target: members[0].target,
    }
  })
  assert.deepEqual(result, {
    requested: 5,
    retreatPercent: 50,
    phase: 6,
    fallback: 23,
    order: 3,
    target: null,
  })
  assert.deepEqual(errors, [])
  console.log('PASS: mission-one Dakini attack survivors retreat through the live browser order path')
} finally {
  await browser.close()
}
