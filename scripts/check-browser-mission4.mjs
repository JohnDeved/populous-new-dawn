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
  const ordinaryRaid = await page.evaluate(async () => {
    await globalThis.testStore.saveCheckpoint()
    const world = globalThis.testStore.getWorld(),
      { browserPosition, tick } = await import('/app/model.ts'),
      { missionData } = await import('/app/mission-data.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      { currentPersonOrder } = await import('/app/person-orders.ts'),
      { cellDistanceSquared } = await import('/app/native-math.ts'),
      { nativePosition } = await import('/app/world-terrain-runtime.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      marker = missionData(5).level.markers[10]
    Object.assign(
      shaman,
      browserPosition({ x: (marker & 255) * 256, y: (marker >>> 8) * 256 }),
      { native: undefined }
    )
    syncLivePersonCells(world)
    for (let turn = 0; turn < 64 && !world.ai.tasks.some(task => task.flags & 1 && task.type === 20); turn++)
      tick(world, 1 / 12)
    const task = world.ai.tasks.find(task => task.flags & 1 && task.type === 20),
      taskFields = task && [task.requested, task.extra, task.entity, task.retreatPercent]
    let attackers = []
    for (let turn = 0; turn < 256 && attackers.length < 2; turn++) {
      tick(world, 1 / 12)
      attackers = world.units.filter(unit => unit.team === 'red' && unit.target === shaman.id)
    }
    const orders = attackers.map(unit => currentPersonOrder(world.buildingOrders, unit.native)?.model),
      hp = shaman.hp
    for (let turn = 0; turn < 512 && shaman.hp === hp && !attackers.some(unit => unit.fight); turn++)
      tick(world, 1 / 12)
    const engaged = shaman.hp < hp || attackers.some(unit => unit.fight)
    for (let turn = 0; turn < 512 && (task?.flags & 1); turn++) tick(world, 1 / 12)
    const retired = !(task?.flags & 1)
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Mission 5 raid restore failed')
    globalThis.testStore.update()
    return { taskFields, shaman: shaman.id, attackers: attackers.length, orders, engaged, retired }
  })
  assert.deepEqual(ordinaryRaid, {
    taskFields: [2, 6, ordinaryRaid.shaman, 20],
    shaman: ordinaryRaid.shaman,
    attackers: 2,
    orders: [28, 28],
    engaged: true,
    retired: true,
  })
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
      { buildingModel } = await import('/app/building-shapes.ts'),
      { migrateCheckpoint } = await import('/app/game-store.ts'),
      { default: rules } = await import('/app/original-rules.json'),
      renderedOwners = [...globalThis.testScene.unitMeshes.values()].map(mesh => mesh.userData.owner),
      counterattacks = []
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Mission 6 construction restore failed')
    const constructionWorld = globalThis.testStore.getWorld()
    const housing = team =>
      constructionWorld.buildings
        .filter(building => building.team === team && building.hp > 0)
        .reduce((sum, building) => {
          const model = buildingModel(building)
          return sum + (rules.buildingFlags[model] & 0x20 ? rules.buildingCapacity[model] : 0)
        }, 0)
    for (
      let turn = 0;
      turn < 100 &&
      [2, 3].some(tribe =>
        constructionWorld.campaignAIs[tribe].tasks.every(task => task.phase !== 8)
      );
      turn++
    )
      tick(constructionWorld, 1 / 12)
    const assigned = [2, 3].map(tribe => {
      const task = constructionWorld.campaignAIs[tribe].tasks.find(task => task.phase === 8)
      return task && { model: task.requested, workers: task.members.length, building: task.entity }
    })
    for (
      let turn = 0;
      turn < 6000 &&
      ['yellow', 'green'].some(team =>
        constructionWorld.buildings.every(
          building =>
            building.team !== team || buildingModel(building) !== 4 || building.progress < 1
        )
      );
      turn++
    )
      tick(constructionWorld, 1 / 12)
    for (
      let turn = 0;
      turn < 12000 &&
      !(
        constructionWorld.buildings.some(
          building => building.team === 'yellow' && building.kind === 'camp' && building.progress === 1
        ) &&
        constructionWorld.buildings.some(
          building => building.team === 'green' && building.kind === 'camp' && building.progress === 1
        ) &&
        constructionWorld.buildings.some(
          building =>
            building.team === 'yellow' && building.kind === 'temple' && building.progress === 1
        ) &&
        constructionWorld.units.some(
          unit => unit.team === 'yellow' && unit.kind === 'preacher'
        ) &&
        housing('yellow') >= constructionWorld.campaignAIs[2].attributes[10] &&
        housing('green') >= 6 &&
        constructionWorld.units.filter(unit => unit.team === 'yellow' && unit.kind === 'warrior')
          .length > 1 &&
        constructionWorld.units.filter(unit => unit.team === 'green' && unit.kind === 'warrior')
          .length >= 6 &&
        constructionWorld.units.filter(unit => unit.team === 'green' && unit.hp > 0).length >= 23
      );
      turn++
    )
      tick(constructionWorld, 1 / 12)
    const restoredConstruction = migrateCheckpoint(structuredClone(constructionWorld))
    const construction = {
      assigned,
      matakProfile: constructionWorld.campaignAIs[3].attributes.slice(2, 8),
      completed: ['yellow', 'green'].map(team =>
        constructionWorld.buildings.some(
          building =>
            building.team === team && buildingModel(building) === 4 && building.progress === 1
        )
      ),
      expansion: [
        {
          model: 7,
          completed: constructionWorld.buildings.some(
            building =>
              building.team === 'yellow' && building.kind === 'camp' && building.progress === 1
          ),
          housing: housing('yellow') >= constructionWorld.campaignAIs[2].attributes[10],
          output:
            constructionWorld.units.filter(
              unit => unit.team === 'yellow' && unit.kind === 'warrior'
            ).length > 1,
        },
        {
          model: 7,
          completed: constructionWorld.buildings.some(
            building =>
              building.team === 'green' && building.kind === 'camp' && building.progress === 1
          ),
          housing: housing('green') >= 6,
          output:
            constructionWorld.units.filter(unit => unit.team === 'green' && unit.kind === 'warrior')
              .length >= 6,
        },
      ],
      chumaraTemple: {
        target: constructionWorld.campaignAIs[2].attributes[2],
        completed: constructionWorld.buildings.some(
          building =>
            building.team === 'yellow' && building.kind === 'temple' && building.progress === 1
        ),
        preacher: constructionWorld.units.some(
          unit => unit.team === 'yellow' && unit.kind === 'preacher'
        ),
        restored: restoredConstruction.buildings.some(
          building =>
            building.team === 'yellow' && building.kind === 'temple' && building.progress === 1
        ) && restoredConstruction.units.some(
          unit => unit.team === 'yellow' && unit.kind === 'preacher'
        ),
      },
      population: constructionWorld.units.filter(unit => unit.team === 'green' && unit.hp > 0).length,
      restoredPopulation: restoredConstruction.units.filter(
        unit => unit.team === 'green' && unit.hp > 0
      ).length,
      restoredWarriors: restoredConstruction.units.filter(
        unit => unit.team === 'green' && unit.kind === 'warrior'
      ).length,
    }
    const raidSource = migrateCheckpoint(structuredClone(constructionWorld))
    for (
      let turn = 0;
      turn < 2048 &&
      !raidSource.campaignAIs[3].tasks.some(task => task.flags & 1 && task.type === 20);
      turn++
    )
      tick(raidSource, 1 / 12)
    const allocatedRaid = raidSource.campaignAIs[3].tasks.find(
        task => task.flags & 1 && task.type === 20
      ),
      raidWorld = migrateCheckpoint(structuredClone(raidSource)),
      raidTask = raidWorld.campaignAIs[3].tasks.find(task => task.flags & 1 && task.type === 20)
    let raidTargeted = false,
      raidReleased = false
    if (raidTask)
      for (let turn = 0; turn < 1025; turn++) {
        tick(raidWorld, 1 / 12)
        if (raidTask.members.length && raidTask.members.every(id => {
          const unit = raidWorld.units.find(unit => unit.id === id)
          return unit && unit.inside === null && !unit.entry && unit.work === null
        })) raidReleased = true
        for (const id of raidTask.members) {
          const unit = raidWorld.units.find(unit => unit.id === id),
            person = unit && (unit.native ?? unit.fight?.motion),
            order = person && currentPersonOrder(raidWorld.buildingOrders, person)
          if (raidTask.phase === 10 && order?.model === 3 &&
              order.a === (((raidTask.target << 8) + 128) & 65535) &&
              order.b === ((raidTask.target & 0xff00) + 128))
            raidTargeted = true
        }
      }
    const raid = allocatedRaid && {
      requested: allocatedRaid.requested,
      damage: allocatedRaid.extra,
      building: allocatedRaid.mode,
      scheduled: (raidSource.turn - 1 + 3 + 399) & 1023,
      latched: raidSource.campaignAIs[3].variables[20],
      nextSize: raidSource.campaignAIs[3].variables[16],
      checkpointTasks: raidWorld.campaignAIs[3].tasks.filter(
        task => task.flags & 1 && task.type === 20
      ).length,
      members: raidTask?.members.length ?? 0,
      released: raidReleased,
      targeted: raidTargeted,
      waitingForBridge: raidTask?.phase === 10 && raidTask.members.every(id =>
        raidWorld.units.find(unit => unit.id === id)?.native?.state === 33
      ),
    }
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
      construction,
      raid,
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
    missionSix.construction.assigned.map(({ model, workers }) => ({ model, workers })),
    [
      { model: 4, workers: 2 },
      { model: 4, workers: 2 },
    ]
  )
  assert.deepEqual(missionSix.construction.matakProfile, [8, 64, 72, 32, 40, 70])
  assert.notEqual(
    missionSix.construction.assigned[0].building,
    missionSix.construction.assigned[1].building
  )
  assert.deepEqual(missionSix.construction.completed, [true, true])
  assert.deepEqual(missionSix.construction.expansion, [
    { model: 7, completed: true, housing: true, output: true },
    { model: 7, completed: true, housing: true, output: true },
  ])
  assert.deepEqual(missionSix.construction.chumaraTemple, {
    target: 1,
    completed: true,
    preacher: true,
    restored: true,
  })
  assert.ok(missionSix.construction.population >= 23)
  assert.ok(missionSix.construction.restoredPopulation >= 23)
  assert.ok(missionSix.construction.restoredWarriors >= 6)
  assert.deepEqual(missionSix.raid, {
    requested: 5,
    damage: 128,
    building: 0,
    scheduled: 0,
    latched: 1,
    nextSize: 7,
    checkpointTasks: 1,
    members: missionSix.raid.members,
    released: true,
    targeted: true,
    waitingForBridge: true,
  })
  assert.ok(missionSix.raid.members > 0)
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
  console.log(
    'PASS: Mission 6 opponents establish settlements, sustain Matak growth, raid, and counterattack through live browser paths'
  )
} finally {
  await browser.close()
}
