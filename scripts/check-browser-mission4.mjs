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
  await page.evaluate(() => {
    const world = globalThis.testStore.getWorld()
    globalThis.mission4Initial = {
      blue: world.units.filter(unit => unit.team === 'blue').length,
      green: world.units.filter(unit => unit.team === 'green').length,
      wild: world.units.filter(unit => unit.team === 'wild').length,
      rewards: world.shrines.map(shrine => shrine.reward),
    }
  })
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
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

  await page.evaluate(() => (globalThis.mission4Initial.rendered = globalThis.testScene.unitMeshes.size))
  const triggerTutorial = async (turn, promote, warriors, preachers, stringId, text) => {
    await page.evaluate(([turn, promote, warriors, preachers]) => {
      const world = globalThis.testStore.getWorld()
      for (const unit of world.units.filter(unit => unit.team === 'wild').slice(0, promote))
        unit.team = 'blue'
      const followers = world.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave')
      for (const unit of followers.slice(0, warriors))
        Object.assign(unit, { kind: 'warrior', native: null })
      for (const unit of followers.slice(warriors, warriors + preachers))
        Object.assign(unit, { kind: 'preacher', native: null })
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
  assert.equal(result.initial.green, 7)
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
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
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
  const towerStaffing = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld(),
      { tick } = await import('/app/model.ts'),
      { buildingFootprintCells, buildingModel, buildingPose } = await import('/app/building-shapes.ts'),
      cell = ((178 & 254) >>> 1) * 128 + ((194 & 254) >>> 1),
      tower = world.buildings.find(building =>
        building.team === 'red' &&
        buildingModel(building) === 4 &&
        buildingFootprintCells(buildingPose(building)).includes(cell)
      )
    for (let turn = 0; turn < 256 && !world.units.some(unit => unit.inside === tower.id); turn++)
      tick(world, 1 / 12)
    globalThis.testStore.update()
    const occupant = world.units.find(unit => unit.inside === tower.id)
    return { tower: !!tower, team: occupant?.team, kind: occupant?.kind }
  })
  assert.deepEqual(towerStaffing, { tower: true, team: 'red', kind: 'preacher' })
  const boatTutorial = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld(),
      { browserPosition, command, nativePosition, tick } = await import('/app/model.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      { worshipPositions } = await import('/app/worship.ts'),
      head = world.shrines.find(shrine => shrine.kind === 'boat'),
      follower = world.units.find(unit => unit.team === 'blue' && unit.kind === 'warrior'),
      point = worshipPositions({ ...nativePosition(world, head), angle: Math.round(head.angle * 1024 / Math.PI) & 2047 })[0]
    Object.assign(follower, browserPosition(point))
    syncLivePersonCells(world)
    world.selected = [follower.id]
    const ordered = command(world, head)
    for (let turn = 0; turn < 120 && !world.messages.slots.some(message => message?.stringId === 662); turn++)
      tick(world, 1 / 12)
    globalThis.testStore.update()
    const message = world.messages.slots.find(message => message?.stringId === 662)
    return { ordered, boat: world.vehicles.some(vehicle => vehicle.active), message, latch: world.ai.variables[15] }
  })
  assert.deepEqual(
    { ordered: boatTutorial.ordered, boat: boatTutorial.boat, stringId: boatTutorial.message?.stringId, lifetime: boatTutorial.message?.lifetime, view: boatTutorial.message?.view, latch: boatTutorial.latch },
    { ordered: true, boat: true, stringId: 662, lifetime: 512, view: { cell: 13022, payload: 1800 }, latch: 1 }
  )
  const boatMessage = page.locator('.campaign-messages details').filter({ hasText: 'The Ancients have granted you a Boat, Shaman.' })
  await boatMessage.locator('summary').click()
  await boatMessage.getByText('The Ancients have granted you a Boat, Shaman.', { exact: true }).waitFor()
  const lastStand = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld(),
      { tick } = await import('/app/model.ts'),
      { currentPersonOrder } = await import('/app/person-orders.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      red = world.units.filter(unit => unit.team === 'red'),
      survivors = [red.at(-1), ...red.slice(0, 6)],
      survivorIds = new Set(survivors.map(unit => unit.id)),
      attacker = survivors.find(unit => unit.kind === 'warrior')
    world.units = world.units.filter(unit => unit.team !== 'red' || survivorIds.has(unit.id))
    for (const building of world.buildings.filter(building => building.team === 'red')) building.hp = 0
    Object.assign(attacker, { x: shaman.x - 12, z: shaman.z, native: undefined })
    world.killCredits[0][1] = 11
    const initialDistance = Math.hypot(attacker.x - shaman.x, attacker.z - shaman.z)
    for (let turn = 0; turn < 64 && !(world.manaTribes[1].flags2 & 0x40); turn++) tick(world, 1 / 12)
    const order = currentPersonOrder(world.buildingOrders, attacker.native)?.model,
      target = attacker.target
    for (let turn = 0; turn < 120 && !attacker.fight && Math.hypot(attacker.x - shaman.x, attacker.z - shaman.z) >= initialDistance; turn++)
      tick(world, 1 / 12)
    globalThis.testStore.update()
    return {
      enabled: !!(world.manaTribes[1].flags2 & 0x40),
      order,
      target,
      shaman: shaman.id,
      advanced: !!attacker.fight || Math.hypot(attacker.x - shaman.x, attacker.z - shaman.z) < initialDistance,
    }
  })
  assert.deepEqual(lastStand, { enabled: true, order: 28, target: lastStand.shaman, shaman: lastStand.shaman, advanced: true })
  const missionFive = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld(),
      { tick } = await import('/app/model.ts')
    world.units = world.units.filter(unit => unit.team !== 'red')
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
  await page.getByRole('button', { name: 'Continue to Mission 6', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 6)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  await page.getByLabel('Focus Chumara tribe').waitFor()
  await page.getByLabel('Focus Matak tribe').waitFor()
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByText('Defeat the Chumara tribe', { exact: true }).waitFor()
  await page.getByText('Defeat the Matak tribe', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Return to the world', exact: false }).click()
  const missionSix = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld()
    await globalThis.testStore.saveCheckpoint()
    globalThis.testStore.startMission(1)
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Mission 6 checkpoint load failed')
    const { tick } = await import('/app/model.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      { currentPersonOrder } = await import('/app/person-orders.ts'),
      renderedOwners = [...globalThis.testScene.unitMeshes.values()].map(mesh => mesh.userData.owner),
      counterattacks = []
    for (const { tribe, team, triggerTurn } of [
      { tribe: 2, team: 'yellow', triggerTurn: 8 },
      { tribe: 3, team: 'green', triggerTurn: 7 },
    ]) {
      if (!globalThis.testStore.loadCheckpoint()) throw new Error('Mission 6 scenario restore failed')
      const scenario = globalThis.testStore.getWorld(),
        survivor = scenario.units.find(unit => unit.team === team && unit.kind === 'brave'),
        shaman = scenario.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
        start = { x: survivor.x, z: survivor.z }
      Object.assign(shaman, { x: survivor.x + 12, z: survivor.z })
      scenario.units = scenario.units.filter(unit => unit.team !== team || unit === survivor)
      syncLivePersonCells(scenario)
      scenario.killCredits[0][tribe] = 6
      scenario.turn = triggerTurn - 1
      tick(scenario, 1 / 12)
      const early = scenario.manaTribes[tribe].flags2 & 0x40
      tick(scenario, 1 / 12)
      const order = currentPersonOrder(scenario.buildingOrders, survivor.native)
      for (let turn = 0; turn < 64 && !survivor.fight; turn++) tick(scenario, 1 / 12)
      counterattacks.push({
        team,
        early,
        enabled: scenario.manaTribes[tribe].flags2 & 0x40,
        order: order?.model,
        target: order?.a,
        shaman: shaman.id,
        moved: Math.hypot(survivor.x - start.x, survivor.z - start.z) > 0,
        engaged: !!survivor.fight,
      })
    }
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Mission 6 outcome restore failed')
    const restored = globalThis.testStore.getWorld()
    restored.units = restored.units.filter(unit => unit.team !== 'yellow')
    restored.turn = 32
    const { stepOutcome } = await import('/app/tribe-turns.ts')
    stepOutcome(restored)
    const oneOpponent = restored.land.landFlags & 0x2000000
    restored.units = restored.units.filter(unit => unit.team !== 'green')
    restored.turn = 48
    stepOutcome(restored)
    globalThis.testStore.update()
    return {
      blue: restored.units.filter(unit => unit.team === 'blue').length,
      yellow: world.units.filter(unit => unit.team === 'yellow').length,
      green: world.units.filter(unit => unit.team === 'green').length,
      wild: world.units.filter(unit => unit.team === 'wild').length,
      independentAI: restored.campaignAIs[2] !== restored.campaignAIs[3],
      independentScans: restored.spellScans[2] !== restored.spellScans[3],
      counterattacks,
      renderedOwners,
      oneOpponent,
      victory: restored.land.landFlags & 0x2000000,
      completed: restored.outcome.completedLevel,
    }
  })
  assert.deepEqual(
    { yellow: missionSix.yellow, green: missionSix.green, wild: missionSix.wild },
    { yellow: 8, green: 7, wild: 172 }
  )
  assert.equal(missionSix.blue, 7)
  assert.equal(missionSix.independentAI, true)
  assert.equal(missionSix.independentScans, true)
  assert.deepEqual(
    missionSix.counterattacks.map(({ team, early, enabled, order, target, shaman, moved, engaged }) => ({
      team, early, enabled, order, targetedShaman: target === shaman, moved, engaged,
    })),
    [
      { team: 'yellow', early: 0, enabled: 0x40, order: 28, targetedShaman: true, moved: true, engaged: true },
      { team: 'green', early: 0, enabled: 0x40, order: 28, targetedShaman: true, moved: true, engaged: true },
    ]
  )
  assert.ok(missionSix.renderedOwners.includes(2))
  assert.ok(missionSix.renderedOwners.includes(3))
  assert.equal(missionSix.oneOpponent, 0)
  assert.equal(missionSix.victory, 0x2000000)
  assert.equal(missionSix.completed, 5)
  assert.deepEqual(errors, [])
  console.log('PASS: campaign continues through Mission 6 with distinct live opponent counterattacks')
} finally {
  await browser.close()
}
