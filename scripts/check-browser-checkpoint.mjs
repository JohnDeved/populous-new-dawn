import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const missionTwoMessage =
  'Now we must face the Matak Tribe. I sense many Warriors ready to stand against us. In my vision we are aided by magic from a Stone Head. There must be a way to reach it...'
const tornadoGuidance =
  'Shaman, this Stone Head will aid you faster if you command two of your Followers to worship there.'
const tornadoInstruction =
  'Use the Tornado Spell to destroy the Enemy and their buildings before they have a chance to react.'

async function assertMissionTwoMessage(page) {
  const details = page.locator('.campaign-messages details').filter({ hasText: missionTwoMessage })
  await details.getByText(missionTwoMessage, { exact: true }).waitFor()
  const icon = details.locator('summary img')
  assert.equal(await icon.getAttribute('src'), '/original/message-type1.png')
  assert.deepEqual(await icon.evaluate(node => {
    const { width, height } = node.getBoundingClientRect()
    return { width, height }
  }), { width: 50, height: 36 })
  const popup = await details.locator('div').evaluate(node => {
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

async function assertMatakSwarm(page) {
  const swarm = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld(),
      { command, setSelection, tick } = await import('/app/model.ts'),
      warriors = world.units
        .filter(unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.hp > 0)
        .slice(0, 6),
      inactive = { mana: world.manaTribes[1].mana, available: world.manaTribes[1].available },
      matakMana = world.manaTribes[3].mana
    globalThis.missionTwoBeforeSwarm = structuredClone(world)
    setSelection(world, warriors.map(unit => unit.id))
    if (!command(world, { x: 83, z: 127 })) throw new Error('Matak approach command failed')
    for (
      let i = 0;
      i < 5000 &&
      !world.projectiles.some(projectile => projectile.team === 'red' && projectile.spell === 'swarm');
      i++
    )
      tick(world, 1 / 12)
    const projectile = world.projectiles.find(
      projectile => projectile.team === 'red' && projectile.spell === 'swarm'
    )
    if (!projectile) throw new Error(`Mission 2 Matak Swarm timed out at turn ${world.turn}`)
    for (let i = 0; i < 100 && !world.effects.some(effect => effect.swarm); i++) tick(world, 1 / 12)
    world.speed = 0
    globalThis.testStore.update()
    const effect = world.effects.find(effect => effect.swarm)
    return {
      effectId: effect?.id,
      effectTribe: effect?.swarm.tribe,
      tribe1: { mana: world.manaTribes[1].mana, available: world.manaTribes[1].available },
      inactive,
      tribe3Mana: world.manaTribes[3].mana,
      matakMana,
      tribe1Casts: world.spellCasts[1][5],
      tribe3Casts: world.spellCasts[3][5],
    }
  })
  assert.ok(swarm.effectId)
  assert.equal(swarm.effectTribe, 3)
  assert.deepEqual(swarm.tribe1, swarm.inactive)
  assert.ok(swarm.tribe3Mana < swarm.matakMana)
  assert.equal(swarm.tribe1Casts, 0)
  assert.equal(swarm.tribe3Casts, 1)
  await page.waitForFunction(effectId => globalThis.testScene.fxMeshes.has(effectId), swarm.effectId)
  await page.evaluate(() => {
    Object.assign(globalThis.testStore.getWorld(), globalThis.missionTwoBeforeSwarm)
    delete globalThis.missionTwoBeforeSwarm
    globalThis.testStore.update()
  })
}

async function assertMatakRaid(page) {
  const raid = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld(),
      { command, setSelection, tick } = await import('/app/model.ts'),
      { currentPersonOrder } = await import('/app/person-orders.ts'),
      warriors = () =>
        world.units.filter(
          unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.hp > 0
        ),
      tribe1Kills = world.killCredits[0][1]
    globalThis.missionTwoBeforeRaid = structuredClone(world)
    for (let attempts = 0; world.killCredits[0][3] <= 3 && attempts < 8; attempts++) {
      const target = world.units
        .filter(unit => unit.team === 'red' && unit.kind !== 'shaman' && unit.hp > 0)
        .sort(
          (a, b) =>
            Math.hypot(a.x + 99, a.z + 105) - Math.hypot(b.x + 99, b.z + 105)
        )[0]
      if (!target) throw new Error('Mission 2 ran out of natural Matak raid prerequisites')
      setSelection(world, warriors().map(unit => unit.id))
      if (!command(world, target)) throw new Error('Mission 2 Matak attack command failed')
      for (let i = 0; i < 10000 && target.hp > 0; i++) tick(world, 1 / 12)
      if (target.hp > 0) throw new Error(`Mission 2 Matak kill timed out at turn ${world.turn}`)
    }
    const task = () => world.ai.tasks.find(candidate => candidate.flags & 1 && candidate.type === 20)
    for (let i = 0; i < 5000 && !task(); i++) tick(world, 1 / 12)
    const active = task()
    if (!active) throw new Error(`Mission 2 Matak raid timed out at turn ${world.turn}`)
    for (
      let i = 0;
      i < 2000 &&
      !(
        active.members.length === 2 &&
        active.members.every(id => {
          const unit = world.units.find(candidate => candidate.id === id)
          return unit?.native && currentPersonOrder(world.buildingOrders, unit.native)?.model === 19
        })
      );
      i++
    )
      tick(world, 1 / 12)
    const blueHp = world.units
      .filter(unit => unit.team === 'blue' && unit.hp > 0)
      .reduce((sum, unit) => sum + unit.hp, 0)
    for (
      let i = 0;
      i < 5000 &&
      world.units
        .filter(unit => unit.team === 'blue' && unit.hp > 0)
        .reduce((sum, unit) => sum + unit.hp, 0) >= blueHp;
      i++
    )
      tick(world, 1 / 12)
    world.speed = 0
    globalThis.testStore.update()
    return {
      tribe1Kills,
      tribe1KillsAfter: world.killCredits[0][1],
      tribe3Kills: world.killCredits[0][3],
      requested: active.requested,
      mode: active.mode,
      entity: active.entity,
      camp: world.buildings.find(
        building => building.team === 'blue' && building.kind === 'camp'
      )?.id,
      phase: active.phase,
      fallback: active.fallback,
      members: [...active.members],
      active: active.flags & 1,
      damaged:
        world.units
          .filter(unit => unit.team === 'blue' && unit.hp > 0)
          .reduce((sum, unit) => sum + unit.hp, 0) < blueHp,
    }
  })
  assert.equal(raid.tribe1KillsAfter, raid.tribe1Kills)
  assert.ok(raid.tribe3Kills > 3)
  assert.deepEqual(
    {
      requested: raid.requested,
      mode: raid.mode,
      entity: raid.entity,
      phase: raid.phase,
      fallback: raid.fallback,
      active: raid.active,
      damaged: raid.damaged,
    },
    {
      requested: 2,
      mode: 7,
      entity: raid.camp,
      phase: 16,
      fallback: 14,
      active: 1,
      damaged: true,
    }
  )
  await page.waitForFunction(
    ids => ids.every(id => globalThis.testScene.unitMeshes.has(id)),
    raid.members
  )
  await page.evaluate(() => {
    Object.assign(globalThis.testStore.getWorld(), globalThis.missionTwoBeforeRaid)
    delete globalThis.missionTwoBeforeRaid
    globalThis.testStore.update()
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
  const guidance = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld(),
      { command, placeBuilding, select, setSelection, tick } = await import('/app/model.ts'),
      bridge = world.shrines.find(shrine => shrine.kind === 'bridgeEffect'),
      tornado = world.shrines.find(shrine => shrine.kind === 'tornado')
    const until = (ready, limit) => {
      for (let i = 0; i < limit && !ready(); i++) tick(world, 1 / 12)
      if (!ready()) throw new Error(`Mission 2 route timed out at turn ${world.turn}`)
    }
    select(world, 'brave')
    if (!placeBuilding(world, 'camp', { x: -99, z: -105 }))
      throw new Error('Mission 2 warrior camp placement failed')
    const camp = world.buildings.find(
      building => building.team === 'blue' && building.kind === 'camp'
    )
    until(() => camp.progress === 1, 3000)
    until(() => !world.units.some(unit => unit.builder), 1000)
    setSelection(
      world,
      world.units
        .filter(unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0)
        .slice(0, 8)
        .map(unit => unit.id)
    )
    if (!command(world, camp)) throw new Error('Mission 2 warrior training command failed')
    until(
      () =>
        world.units.filter(
          unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.hp > 0
        ).length >= 8,
      10000
    )
    select(world, 'shaman')
    if (!command(world, bridge)) throw new Error('Land-raising worship command failed')
    until(() => bridge.uses === 1, 10000)
    until(() => !world.effects.some(effect => effect.kind === 'bridge'), 5000)
    select(world, 'shaman')
    if (!command(world, tornado)) throw new Error('Tornado worship command failed')
    until(() => world.messages.slots.some(message => message?.stringId === 644), 10000)
    select(world, 'brave')
    if (!command(world, tornado)) throw new Error('Follower Tornado worship command failed')
    until(() => world.messages.slots.some(message => message?.stringId === 642), 10000)
    world.speed = 0
    globalThis.testStore.update()
    const message = world.messages.slots.find(message => message?.stringId === 644),
      instruction = world.messages.slots.find(message => message?.stringId === 642)
    return { turn: world.turn, flags: message.flags, lifetime: message.lifetime, view: message.view, warriors: world.units.filter(unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.hp > 0).length, tornado: { flags: instruction.flags, variables: world.ai.variables.slice(9, 12) } }
  })
  const { turn: guidanceTurn, ...guidanceState } = guidance
  assert.ok(guidanceTurn > 700)
  assert.deepEqual(guidanceState, {
    flags: 0x36f1,
    lifetime: 3000,
    view: { cell: 0x60cc, payload: 308 },
    warriors: 8,
    tornado: { flags: 0x2d1, variables: [0, 2, 1] },
  })
  const instruction = page.locator('.campaign-messages details').filter({ hasText: tornadoInstruction })
  await instruction.locator('summary').click()
  await instruction.getByText(tornadoInstruction, { exact: true }).waitFor()
  const positioned = page.locator('.campaign-messages details').filter({ hasText: tornadoGuidance })
  assert.equal(await positioned.locator('summary img').getAttribute('src'), '/original/message.png')
  await page.waitForFunction(() => !(globalThis.testScene.world.inputMask & 64))
  await positioned.locator('summary').click()
  await page.getByText(tornadoGuidance, { exact: true }).waitFor()
  assert.deepEqual(
    await page.evaluate(() => {
      const { target } = globalThis.testScene.cameraMotion
      return { x: target.x, y: target.y }
    }),
    { x: 0xcd00, y: 0x6100 }
  )
  await assertMatakSwarm(page)
  await assertMatakRaid(page)
  const counterattack = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld(),
      { createLivePerson, syncLivePersonCells } = await import('/app/live-people.ts'),
      { currentPersonOrder } = await import('/app/person-orders.ts'),
      { addUnit, command, select, tick } = await import('/app/model.ts'),
      tower = world.buildings.find(building => building.team === 'red' && building.kind === 'tower'),
      defender = addUnit(world, 'red', 'warrior', { x: tower.x + 2, z: tower.z })
    defender.native = createLivePerson(world, defender)
    defender.native.state = 17
    syncLivePersonCells(world)
    select(world, 'shaman')
    if (!command(world, tower)) throw new Error('Enemy-tower command failed')
    for (let i = 0; i < 360 && currentPersonOrder(world.buildingOrders, defender.native)?.model !== 19; i++) {
      defender.native.flags3 |= 0x800
      tick(world, 1 / 12)
    }
    defender.native.flags3 &= ~0x800
    const order = currentPersonOrder(world.buildingOrders, defender.native)
    globalThis.testStore.update()
    return { defenderId: defender.id, variables: world.ai.variables.slice(1, 3), model: order?.model, flags: order?.flags, a: order?.a, b: order?.b }
  })
  assert.deepEqual(counterattack, { defenderId: counterattack.defenderId, variables: [1, 1], model: 19, flags: 0x32, a: 0x7c7c, b: 0x0a0a })
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
    world.turn += 10
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
  const missionFour = page.getByRole('button', { name: 'Mission 4', exact: true })
  assert.equal(await startup.evaluate(dialog => dialog.matches(':modal')), true)
  assert.equal(
    await page.getByRole('button', { name: 'Load Game', exact: true }).evaluate(button => button === document.activeElement),
    true
  )
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab')
  assert.equal(await missionFour.evaluate(button => button === document.activeElement), true)
  await page.keyboard.press('Enter')
  await waitForScene(page)
  await page.waitForFunction(() => globalThis.testScene.world.outcome.level === 4)

  await page.reload({ waitUntil: 'networkidle' })
  await startup.waitFor()
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
  const restored = await page.evaluate(defenderId => {
    const world = globalThis.testScene.world,
      defender = world.units.find(unit => unit.id === defenderId),
      person = defender.native ?? defender.entry?.person ?? defender.builder?.person,
      orderId = person.immediateCommand || person.commands[person.commandCursor],
      order = world.buildingOrders.records[orderId]
    return {
      level: world.outcome.level,
      turn: world.turn,
      height: world.land.heights[0],
      hp: world.units[0].hp,
      paused: world.paused,
      soundSerial: world.soundSerial,
      soundCursor: globalThis.testScene.soundSerial,
      soundPlaying: world.buildings[0].burn.soundPlaying,
      guidance: world.messages.slots.find(message => message?.stringId === 644)?.view,
      counterattack: { variables: world.ai.variables.slice(1, 3), model: order.model, flags: order.flags, a: order.a, b: order.b },
    }
  }, counterattack.defenderId)
  assert.deepEqual(restored, {
    level: 2,
    turn: saved.turn,
    height: saved.height,
    hp: saved.hp,
    paused: false,
    soundSerial: restored.soundSerial,
    soundCursor: restored.soundSerial,
    soundPlaying: false,
    guidance: { cell: 0x60cc, payload: 308 },
    counterattack: { variables: [1, 1], model: 19, flags: 0x32, a: 0x7c7c, b: 0x0a0a },
  })
  assert.ok(restored.soundSerial)
  await assertMissionTwoMessage(page)

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('dialog', { name: 'Start game' }).waitFor()
  await page.getByRole('button', { name: 'Mission 1', exact: true }).click()
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
  console.log('PASS: startup selects Missions 1 and 4 by keyboard/mouse and restores Mission 2')
} finally {
  await browser.close()
}
