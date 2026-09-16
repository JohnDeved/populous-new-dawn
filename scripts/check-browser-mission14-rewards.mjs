import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame, effectPixels } from './browser-game.mjs'

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
  await page.getByRole('button', { name: 'Mission 14', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => !globalThis.testScene.world.inputMask)

  async function prepareHead(reward) {
    return page.evaluate(async reward => {
      const scene = globalThis.testScene,
        world = scene.world,
        { browserPosition, nativePosition } = await import('/app/model.ts'),
        { syncLivePersonCells } = await import('/app/live-people.ts'),
        { worshipPositions } = await import('/app/worship.ts'),
        head = world.shrines.find(shrine =>
          reward === 'multi' ? shrine.rewards?.length === 2 : shrine.reward === reward
        ),
        followers = world.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave'),
        slots = worshipPositions({
          ...nativePosition(world, head),
          angle: Math.round((head.angle * 1024) / Math.PI) & 2047,
        })
      followers.forEach((unit, index) =>
        Object.assign(unit, browserPosition(slots[index]), { native: null })
      )
      for (const unit of world.units) if (unit.team !== 'blue') unit.inside = 1
      syncLivePersonCells(world)
      world.selected = []
      world.speed = 0
      scene.focus(head)
      scene.onChange()
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
      const point = scene.screen(head),
        rect = scene.container.getBoundingClientRect(),
        x = rect.left + ((point.x + 1) * rect.width) / 2,
        y = rect.top + ((1 - point.y) * rect.height) / 2
      for (let dy = -75; dy <= 0; dy += 3)
        for (let dx = -20; dx <= 20; dx += 3) {
          const event = { clientX: x + dx, clientY: y + dy }
          if (!scene.pickUnit(event) && scene.pickWorldObject(event)?.id === head.id)
            return { x: event.clientX, y: event.clientY, head: head.id }
        }
      throw new Error(`No exposed ${reward} head geometry`)
    }, reward)
  }

  async function worshipAndDeliver(reward, modifier) {
    const point = await prepareHead(reward)
    await page.getByRole('button', { name: 'Select brave', exact: true }).click({ modifiers: [modifier] })
    await page.mouse.click(point.x, point.y)
    return page.evaluate(async headId => {
      const scene = globalThis.testScene,
        world = scene.world,
        { tick } = await import('/app/model.ts'),
        head = world.shrines.find(shrine => shrine.id === headId)
      if (!world.selected.every(id => world.units.find(unit => unit.id === id)?.native?.commandStatus === 27))
        throw new Error(
          `Head click did not enter the live worship command: ${JSON.stringify(
            world.selected.map(id => {
              const unit = world.units.find(candidate => candidate.id === id)
              return [id, unit?.kind, unit?.native?.commandStatus, unit?.native?.state]
            })
          )}`
        )
      world.speed = 1
      for (let turn = 0; turn < 24; turn++) tick(world, 1 / 12)
      if (head.followers < head.required) throw new Error('Selected followers did not reach worship')
      head.work = head.target * head.required ** 2 - 1
      for (let turn = 0; turn < 8 && !head.uses; turn++) tick(world, 1 / 12)
      for (let turn = 0; turn < 82 && world.gifts.length; turn++) tick(world, 1 / 12)
      world.speed = 0
      scene.onChange()
      return { uses: head.uses, rewards: head.rewards }
    }, point.head)
  }

  assert.deepEqual(await worshipAndDeliver('multi', 'Shift'), {
    uses: 1,
    rewards: ['earthquake', 'bridge'],
  })
  await page.getByRole('button', { name: 'Earthquake, 1 shots', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Land Bridge, 1 shots', exact: true }).waitFor()

  assert.equal((await worshipAndDeliver('angel', 'Control')).uses, 1)
  const angelButton = page.getByRole('button', { name: 'Angel of Death, 1 shots', exact: true })
  await angelButton.waitFor()
  const castPoint = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      shaman = scene.world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      target = { x: shaman.x + 2, z: shaman.z + 2 },
      { spellTargetError } = await import('/app/model.ts')
    scene.focus(shaman)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const point = scene.screen(target, Math.max(0, scene.y(target))),
      rect = scene.container.getBoundingClientRect(),
      center = {
        x: rect.left + ((point.x + 1) * rect.width) / 2,
        y: rect.top + ((1 - point.y) * rect.height) / 2,
      }
    for (let radius = 0; radius <= 40; radius += 2)
      for (let step = 0; step < 16; step++) {
        const event = {
            clientX: center.x + Math.cos((step * Math.PI) / 8) * radius,
            clientY: center.y + Math.sin((step * Math.PI) / 8) * radius,
          },
          picked = scene.pick(event)
        if (picked && !scene.pickUnit(event) && !scene.pickWorldObject(event) && !spellTargetError(scene.world, 'angel', picked))
          return event
      }
    throw new Error('No exposed Angel cast target')
  })
  await angelButton.click()
  await page.mouse.click(castPoint.clientX, castPoint.clientY)
  const angelId = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; turn < 120 && !world.effects.some(effect => effect.angel); turn++) tick(world, 1 / 12)
    const angel = world.effects.find(effect => effect.angel)
    if (!angel || angel.team !== 'blue' || world.shots.angel !== 0)
      throw new Error('HUD Angel cast did not create and consume the live summon')
    scene.focus(angel)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return angel.id
  })
  assert.ok((await effectPixels(page, [angelId])) > 20)

  const combat = await page.evaluate(async angelId => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      angel = world.effects.find(effect => effect.id === angelId),
      victim = world.units.find(unit => unit.team !== 'blue' && unit.hp > 0)
    for (const unit of world.units) if (unit.team !== 'blue') unit.inside = 1
    angel.angel.target = null
    world.outcome.alliances[0] = 0
    Object.assign(victim, {
      x: angel.x + 1.9,
      z: angel.z + 1.9,
      team: 'red',
      inside: null,
      invisibility: 0,
      flight: null,
      fight: null,
      entry: null,
      builder: null,
      native: null,
    })
    tick(world, 1 / 12)
    const target = angel.angel.target
    for (let turn = 0; turn < 80 && world.units.includes(victim); turn++) tick(world, 1 / 12)
    return {
      target,
      victim: victim.id,
      removed: !world.units.includes(victim),
      giftCount: world.giftCounts.angel,
    }
  }, angelId)
  assert.deepEqual(combat, {
    target: combat.victim,
    victim: combat.victim,
    removed: true,
    giftCount: 1,
  })

  assert.equal(await page.evaluate(() => globalThis.testStore.saveCheckpoint()), true)
  const restored = await page.evaluate(() => {
    const store = globalThis.testStore
    store.change(world => {
      world.effects = world.effects.filter(effect => !effect.angel)
      world.shrines.find(shrine => shrine.rewards).rewards = []
    })
    if (!store.loadCheckpoint()) return null
    const world = store.getWorld()
    return {
      rewards: world.shrines.find(shrine => shrine.rewards)?.rewards,
      angel: world.effects.some(effect => effect.angel),
      stock: world.shots.angel,
      gifts: world.giftCounts.angel,
    }
  })
  assert.deepEqual(restored, {
    rewards: ['earthquake', 'bridge'],
    angel: true,
    stock: 0,
    gifts: 1,
  })
  assert.deepEqual(errors, [])
  console.log('PASS: Mission 14 worship delivered linked gifts; HUD Angel cast rendered, killed an enemy, and restored from checkpoint')
} finally {
  await browser.close()
}
