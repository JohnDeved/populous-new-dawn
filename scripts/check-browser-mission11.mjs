import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

async function moveSelectedUnit(page, kind, mission) {
  const order = await page.evaluate(
    async ({ kind, label }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        { supportsFollower } = await import('/app/model.ts'),
        unit = world.units.find(unit => unit.team === 'blue' && unit.kind === kind),
        bounds = scene.container.getBoundingClientRect()
      if (!unit || !world.selected.includes(unit.id))
        throw new Error(`${label} ${kind} is not selected`)
      scene.focus(unit)
      for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
        scene.updateCameraMotion(1 / 24)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      for (let radius = 4; radius <= 12; radius += 2)
        for (let step = 0; step < 16; step++) {
          const angle = (step * Math.PI) / 8,
            target = {
              x: unit.x + Math.cos(angle) * radius,
              z: unit.z + Math.sin(angle) * radius,
            }
          if (!supportsFollower(world, target)) continue
          const projected = scene.screen(target),
            point = {
              x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
              y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
            },
            picked = scene.pick({ clientX: point.x, clientY: point.y })
          if (
            picked &&
            !scene.pickUnit({ clientX: point.x, clientY: point.y }) &&
            !scene.pickWorldObject({ clientX: point.x, clientY: point.y }) &&
            Math.hypot(picked.x - unit.x, picked.z - unit.z) > 3
          )
            return { id: unit.id, before: [unit.x, unit.z], point }
        }
      throw new Error(`No exposed ${label} ${kind} movement destination`)
    },
    { kind, label: mission }
  )
  await page.mouse.click(order.point.x, order.point.y)
  const moved = await page.evaluate(async ({ id, before }) => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      unit = world.units.find(unit => unit.id === id)
    for (
      let turn = 0;
      Math.hypot(unit.x - before[0], unit.z - before[1]) < 0.5 && turn < 240;
      turn++
    )
      tick(world, 1 / 12)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    return {
      distance: Math.hypot(unit.x - before[0], unit.z - before[1]),
      visible: scene.unitMeshes.get(id)?.visible,
    }
  }, order)
  assert.ok(moved.distance >= 0.5, JSON.stringify(moved))
  assert.equal(moved.visible, true)
}

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser, 12)
  page.setDefaultTimeout(20_000)
  const selectorStart = await page.evaluate(() => {
    const scene = globalThis.testScene,
      world = scene.world,
      terrain = Array.from(world.land.heights),
      renderedTrees = scene.decorations.children.filter(child => child.userData.point).length,
      positions = scene.terrain.geometry.getAttribute('position')
    return {
      level: world.outcome.level,
      terrain: {
        nonzero: terrain.filter(Boolean).length,
        minimum: Math.min(...terrain),
        maximum: Math.max(...terrain),
        renderedRange: [
          Math.min(...Array.from({ length: positions.count }, (_, i) => positions.getY(i))),
          Math.max(...Array.from({ length: positions.count }, (_, i) => positions.getY(i))),
        ],
      },
      trees: world.trees.length,
      renderedTrees,
      nativeFlags7fTargets: world.units.filter(unit => unit.nativeFlags7f & 2).length,
    }
  })
  assert.deepEqual(selectorStart, {
    level: 12,
    terrain: { nonzero: 3646, minimum: 0, maximum: 1024, renderedRange: [0, 8] },
    trees: 103,
    renderedTrees: 103,
    nativeFlags7fTargets: 20,
  })
  await page.evaluate(() => {
    const store = globalThis.testStore
    store.startMission(10)
    const world = store.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    store.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 11', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 11)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  await page.getByLabel('Focus Chumara tribe').waitFor()
  await page.getByLabel('Focus Matak tribe').waitFor()
  await page.getByText('Once again we must face two tribes.', { exact: false }).waitFor()

  const opening = await page.evaluate(() => {
    const scene = globalThis.testScene,
      world = scene.world
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    return {
      level: world.outcome.level,
      teams: Object.fromEntries(
        ['blue', 'green', 'yellow', 'wild'].map(team => [
          team,
          world.units.filter(unit => unit.team === team).length,
        ])
      ),
      sites: world.shrines.map(shrine => [shrine.kind, shrine.reward]),
      siteMeshes: world.shrines.filter(shrine => {
        const group = scene.shrineMeshes.get(shrine.id)?.g
        return (
          group?.visible &&
          group.parent === scene.objects &&
          group.children.some(child => child.visible)
        )
      }).length,
      selected: world.units.find(unit => world.selected.includes(unit.id))?.kind,
      meshes: world.units.filter(unit => scene.unitMeshes.get(unit.id)?.visible).length,
    }
  })
  assert.equal(opening.level, 11)
  assert.deepEqual(
    { blue: opening.teams.blue, green: opening.teams.green, yellow: opening.teams.yellow },
    { blue: 7, green: 7, yellow: 7 }
  )
  assert.ok(opening.teams.wild >= 150, JSON.stringify(opening))
  assert.deepEqual(opening.sites, [
    ['vault', 'hypnotise'],
    ['vault', 'swamp'],
    ['flatten', 'flatten'],
    ['swamp', 'swamp'],
  ])
  assert.equal(opening.siteMeshes, 4)
  assert.equal(opening.selected, 'shaman')
  assert.equal(
    opening.meshes,
    Object.values(opening.teams).reduce((sum, count) => sum + count, 0)
  )

  await page.getByLabel('Menu', { exact: true }).click()
  await page
    .getByText('Explore the Hypnotise, Swamp, and Flatten knowledge sites', { exact: false })
    .waitFor()
  assert.equal(await page.locator('.menu-objectives').count(), 0)
  await page.getByLabel('Close menu').click()

  const checkpoint = await page.evaluate(async () => {
    const store = globalThis.testStore,
      { tick } = await import('/app/model.ts'),
      { buildingModel } = await import('/app/building-shapes.ts')
    const snapshot = world => ({
      turn: world.turn,
      randomState: world.randomState,
      buildings: structuredClone(world.buildings),
      buildingModels: world.buildings.map(buildingModel),
      ais: [2, 3].map(tribe => structuredClone(world.campaignAIs[tribe])),
      workers: structuredClone(world.units.filter(unit => ['yellow', 'green'].includes(unit.team))),
      buildingOrders: structuredClone(world.buildingOrders),
      motionRoutes: structuredClone(world.motionRoutes),
    })
    let world = store.getWorld()
    while (world.turn < 4606) tick(world, 1 / 12)
    const control = structuredClone(world),
      before = snapshot(control)
    await store.saveCheckpoint()
    if (!store.loadCheckpoint()) throw new Error('Mission 11 settlement checkpoint failed')
    world = store.getWorld()
    const restored = snapshot(world)
    while (world.turn < 5500) {
      tick(control, 1 / 12)
      tick(world, 1 / 12)
    }
    return { before, restored, control: snapshot(control), continued: snapshot(world) }
  })
  assert.deepEqual(checkpoint.before, checkpoint.restored)
  assert.deepEqual(checkpoint.control, checkpoint.continued)
  assert.deepEqual(
    checkpoint.before.buildings
      .filter((_, index) => checkpoint.before.buildingModels[index] === 4)
      .map(tower => [tower.team, tower.progress]),
    [
      ['green', 1],
      ['yellow', 1],
      ['green', 0],
    ]
  )
  assert.deepEqual(
    checkpoint.before.ais.map(ai =>
      ai.tasks
        .filter(task => task.flags & 1)
        .map(task => [
          task.requested,
          task.members.length,
          task.extra,
          task.origin,
          task.target,
          task.phase,
        ])
    ),
    [[], [[4, 0, 1, 0xa678, 0xa478, 4]]]
  )
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  const settlement = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      { buildingModel, buildingPose } = await import('/app/building-shapes.ts')
    globalThis.testStore.update()
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    scene.renderer.render(scene.scene, scene.camera)
    const buildings = world.buildings.filter(building =>
      ['green', 'yellow'].includes(building.team)
    )
    const result = {
      buildings: buildings.map(building => [
        building.id,
        building.team,
        buildingModel(building),
        building.progress,
      ]),
      onlySettlement: world.buildings.length === buildings.length,
      buildAtTower: buildings.some(building => {
        const pose = buildingPose(building)
        return (
          building.team === 'green' &&
          buildingModel(building) === 4 &&
          building.progress === 1 &&
          pose.anchorX === 0x7800 &&
          pose.anchorY === 0xa400
        )
      }),
      rendered: buildings.every(building => {
        const group = scene.buildingMeshes.get(building.id)
        return (
          !!group && group.parent === scene.objects && group.children.some(child => child.visible)
        )
      }),
      activeTasks: [2, 3].flatMap(tribe =>
        world.campaignAIs[tribe].tasks.filter(task => task.flags & 1)
      ).length,
    }
    for (const building of buildings) building.hp = 0
    for (let turn = 0; turn < 200; turn++) tick(world, 1 / 12)
    return {
      ...result,
      replacements: world.buildings.filter(building => building.hp > 0).length,
      replacementTasks: [2, 3].flatMap(tribe =>
        world.campaignAIs[tribe].tasks.filter(task => task.flags & 1)
      ).length,
    }
  })
  assert.deepEqual(
    settlement.buildings.map(([, team, model, progress]) => [team, model, progress]),
    [
      ['green', 4, 1],
      ['yellow', 4, 1],
      ['green', 3, 1],
      ['green', 4, 1],
    ]
  )
  assert.equal(settlement.onlySettlement, true)
  assert.equal(settlement.buildAtTower, true)
  assert.equal(settlement.rendered, true)
  assert.equal(settlement.activeTasks, 0)
  assert.equal(settlement.replacements, 0)
  assert.equal(settlement.replacementTasks, 0)

  await moveSelectedUnit(page, 'shaman', 'Mission 11')

  assert.deepEqual(
    await page.evaluate(() => {
      const store = globalThis.testStore,
        world = store.getWorld()
      world.status = 'won'
      world.outcome.cameraPlaying = false
      world.outcome.completedLevel = 10
      store.update()
      return store.getCompletedMissions()
    }),
    [11]
  )
  await page.getByRole('button', { name: 'Continue to Mission 12', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 12)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  await page.getByLabel('Focus Dakini tribe').waitFor()
  await page.getByLabel('Focus Chumara tribe').waitFor()
  await page.getByLabel('Focus Matak tribe').waitFor()
  await page
    .getByRole('status')
    .getByText('For the first time we must face all three Enemy tribes.', { exact: false })
    .waitFor()

  const missionTwelve = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { buildingModel } = await import('/app/building-shapes.ts')
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    return {
      level: world.outcome.level,
      camera: { ...scene.viewPoint },
      teams: Object.fromEntries(
        ['blue', 'red', 'yellow', 'green', 'wild'].map(team => [
          team,
          world.units.filter(unit => unit.team === team).length,
        ])
      ),
      sites: world.shrines.map(shrine => [shrine.kind, shrine.reward]),
      siteMeshes: world.shrines.filter(shrine => {
        const group = scene.shrineMeshes.get(shrine.id)?.g
        return (
          group?.visible &&
          group.parent === scene.objects &&
          group.children.some(child => child.visible)
        )
      }).length,
      buildings: world.buildings.map(building => [
        building.team,
        buildingModel(building),
        !!building.preparation,
      ]),
      buildingMeshes: scene.buildingMeshes.size,
      renderedBuildings: world.buildings
        .filter(building => {
          const group = scene.buildingMeshes.get(building.id)
          return (
            group?.visible &&
            group.parent === scene.objects &&
            group.children.some(child => child.visible)
          )
        })
        .map(building => [building.team, buildingModel(building)]),
      buildingPlans: world.buildings.filter(building => scene.plans.has(building.id)).length,
      selected: world.units.find(unit => world.selected.includes(unit.id))?.kind,
      unitMeshes: world.units.filter(unit => scene.unitMeshes.get(unit.id)?.visible).length,
    }
  })
  assert.equal(missionTwelve.level, 12)
  assert.deepEqual(missionTwelve.teams, { blue: 1, red: 7, yellow: 7, green: 7, wild: 74 })
  assert.deepEqual(missionTwelve.sites, [
    ['vault', 'tornado'],
    ['vault', 'spyHut'],
    ['vault', 'erosion'],
  ])
  assert.equal(missionTwelve.siteMeshes, 3)
  assert.equal(missionTwelve.buildings.filter(([, , preparation]) => !preparation).length, 31)
  assert.ok(
    missionTwelve.buildings.some(
      ([team, model, preparation]) => team === 'yellow' && model === 6 && !preparation
    )
  )
  assert.equal(
    missionTwelve.buildingMeshes,
    missionTwelve.buildings.filter(([, , preparation]) => !preparation).length,
    JSON.stringify(errors)
  )
  assert.ok(
    missionTwelve.renderedBuildings.some(([team, model]) => team === 'yellow' && model === 6)
  )
  for (const team of ['red', 'yellow', 'green'])
    assert.ok(missionTwelve.renderedBuildings.some(([renderedTeam]) => renderedTeam === team))
  assert.equal(
    missionTwelve.buildingPlans,
    missionTwelve.buildings.filter(([, , preparation]) => preparation).length
  )
  assert.equal(missionTwelve.selected, 'shaman')
  assert.equal(
    missionTwelve.unitMeshes,
    Object.values(missionTwelve.teams).reduce((sum, count) => sum + count, 0)
  )

  const skip = page.getByRole('button', { name: 'Skip introduction', exact: false })
  await skip.waitFor()
  await page.waitForFunction(
    initial =>
      Math.hypot(
        globalThis.testScene.viewPoint.x - initial.x,
        globalThis.testScene.viewPoint.z - initial.z
      ) > 0.5,
    missionTwelve.camera
  )
  await skip.click()
  await page.waitForFunction(() => {
    const world = globalThis.testStore.getWorld()
    return !(world.flyby.flags & 1) && !(world.inputMask & 64)
  })

  await page.getByLabel('Menu', { exact: true }).click()
  await page.getByText('Prepare for all three Enemy tribes', { exact: false }).waitFor()
  await page.getByLabel('Close menu').click()

  const missionTwelveCheckpoint = await page.evaluate(async () => {
    const store = globalThis.testStore,
      { tick } = await import('/app/model.ts'),
      snapshot = world => ({
        turn: world.turn,
        randomState: world.randomState,
        units: structuredClone(world.units),
        buildings: structuredClone(world.buildings),
        shrines: structuredClone(world.shrines),
        ais: [1, 2, 3].map(tribe => structuredClone(world.campaignAIs[tribe])),
        flyby: structuredClone(world.flyby),
        inputMask: world.inputMask,
        messages: structuredClone(world.messages),
      })
    let world = store.getWorld()
    while (world.turn < 64) tick(world, 1 / 12)
    const control = structuredClone(world),
      before = snapshot(control)
    await store.saveCheckpoint()
    if (!store.loadCheckpoint()) throw new Error('Mission 12 opening checkpoint failed')
    world = store.getWorld()
    const restored = snapshot(world)
    while (world.turn < 192) {
      tick(control, 1 / 12)
      tick(world, 1 / 12)
    }
    return { before, restored, control: snapshot(control), continued: snapshot(world) }
  })
  assert.deepEqual(missionTwelveCheckpoint.before, missionTwelveCheckpoint.restored)
  assert.deepEqual(missionTwelveCheckpoint.control, missionTwelveCheckpoint.continued)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  await moveSelectedUnit(page, 'shaman', 'Mission 12')

  const convertPoint = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      wild = world.units.find(unit => unit.team === 'wild' && unit.hp > 0)
    for (let turn = 0; !world.shots.convertWild && turn < 5_000; turn++) tick(world, 1 / 12)
    if (!world.shots.convertWild || !wild)
      throw new Error('Mission 12 Convert Wild prerequisite failed')
    Object.assign(shaman, { x: wild.x + 1, z: wild.z })
    syncLivePersonCells(world)
    world.selected = [shaman.id]
    world.speed = 0
    scene.focus(wild)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const point = scene.screen(wild),
      bounds = scene.container.getBoundingClientRect()
    return {
      x: bounds.left + ((point.x + 1) * bounds.width) / 2,
      y: bounds.top + ((1 - point.y) * bounds.height) / 2,
    }
  })
  await page.getByRole('button', { name: 'Convert Wild, 1 shots' }).click()
  await page.mouse.click(convertPoint.x, convertPoint.y)
  const brave = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    for (
      let turn = 0;
      !world.units.some(unit => unit.team === 'blue' && unit.kind === 'brave') && turn < 120;
      turn++
    )
      tick(world, 1 / 12)
    const unit = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave')
    if (!unit) throw new Error('Mission 12 Convert Wild did not produce a Brave')
    scene.onChange()
    return unit.id
  })

  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { entrance } = await import('/app/live-command.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      vault = world.shrines.find(shrine => shrine.kind === 'vault' && shrine.reward === 'spyHut')
    if (!vault) throw new Error('Mission 12 Spy Vault is missing')
    Object.assign(shaman, entrance(world, vault, 2))
    syncLivePersonCells(world)
    world.selected = [shaman.id]
    scene.focus(vault)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
  })
  const vaultPoint = await page.evaluate(() => {
    const scene = globalThis.testScene,
      vault = scene.world.shrines.find(
        shrine => shrine.kind === 'vault' && shrine.reward === 'spyHut'
      ),
      point = scene.screen(vault),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -75; dy <= 0; dy += 3)
      for (let dx = -20; dx <= 20; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (scene.pickWorldObject(event)?.id === vault.id)
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Mission 12 Spy Vault geometry')
  })
  await page.mouse.click(vaultPoint.x, vaultPoint.y)
  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; !world.unlockedSpyHut && turn < 2_000; turn++) tick(world, 1 / 12)
    if (!world.unlockedSpyHut) throw new Error('Mission 12 Spy Vault did not unlock the school')
    scene.onChange()
  })

  await page.getByLabel('Select brave', { exact: true }).click()
  await page.getByRole('button', { name: 'buildings B', exact: true }).click()
  const spyBuilding = page.getByRole('button', { name: /Spy Training Hut/ })
  assert.equal(await spyBuilding.isEnabled(), true)
  const site = await page.evaluate(async braveId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, buildingPlanPose, placementError } = await import('/app/model.ts'),
      brave = world.units.find(unit => unit.id === braveId),
      bounds = scene.container.getBoundingClientRect(),
      candidates = []
    for (let z = brave.z - 16; z <= brave.z + 16; z += 0.5)
      for (let x = brave.x - 16; x <= brave.x + 16; x += 0.5)
        if (!placementError(world, 'spyHut', { x, z })) {
          const plan = buildingPlanPose(world, 'spyHut', { x, z }),
            point = browserPosition({ x: plan.anchorX, y: plan.anchorY })
          if (!candidates.some(candidate => candidate.x === point.x && candidate.z === point.z))
            candidates.push(point)
        }
    candidates.sort(
      (a, b) =>
        Math.min(...world.trees.map(tree => Math.hypot(tree.x - a.x, tree.z - a.z))) -
        Math.min(...world.trees.map(tree => Math.hypot(tree.x - b.x, tree.z - b.z)))
    )
    if (!candidates.length) throw new Error('No valid Mission 12 Spy Hut site')
    const candidate = candidates[0]
    scene.focus(candidate)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.screen(candidate),
      point = {
        x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
      },
      picked = scene.pick({ clientX: point.x, clientY: point.y })
    if (!picked || placementError(world, 'spyHut', picked))
      throw new Error('No exposed Mission 12 Spy Hut site')
    return point
  }, brave)
  await spyBuilding.click()
  await page.mouse.move(site.x, site.y)
  await page.evaluate(() => globalThis.testScene.updatePointerFrame(performance.now()))
  await page.mouse.click(site.x, site.y)
  const school = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { setSelection, tick } = await import('/app/model.ts'),
      building = world.buildings.find(b => b.team === 'blue' && b.kind === 'spyHut')
    if (!building || building.progress !== 0)
      throw new Error('Rendered Spy Hut input did not place the school')
    for (let turn = 0; building.progress < 1 && turn < 20_000; turn++) tick(world, 1 / 12)
    if (building.progress < 1)
      throw new Error(`Spy school construction timed out: ${JSON.stringify(building)}`)
    for (let turn = 0; world.units.some(unit => unit.work === building.id) && turn < 2_000; turn++)
      tick(world, 1 / 12)
    if (world.units.some(unit => unit.work === building.id))
      throw new Error('Spy school builder did not depart')
    setSelection(world, [])
    scene.onChange()
    return building.id
  })

  await page.getByLabel('Select brave', { exact: true }).click()
  await page.evaluate(async id => {
    const scene = globalThis.testScene,
      world = scene.world,
      { entrance } = await import('/app/live-command.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      school = world.buildings.find(building => building.id === id),
      brave = world.units.find(unit => world.selected.includes(unit.id) && unit.kind === 'brave')
    Object.assign(brave, entrance(world, school, 2))
    syncLivePersonCells(world)
    scene.focus(school)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
  }, school)
  const schoolPoint = await page.evaluate(id => {
    const scene = globalThis.testScene,
      school = scene.world.buildings.find(building => building.id === id),
      point = scene.screen(school),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -75; dy <= 20; dy += 3)
      for (let dx = -30; dx <= 30; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (scene.pickWorldObject(event)?.id === school.id)
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Mission 12 Spy school geometry')
  }, school)
  await page.mouse.click(schoolPoint.x, schoolPoint.y)
  const schoolPanel = page.locator('.training-panel:not([hidden])')
  await schoolPanel.waitFor({ state: 'visible' })
  assert.match(await schoolPanel.getAttribute('aria-label'), /^Spy training:/)
  const spy = await page.evaluate(async id => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      school = world.buildings.find(building => building.id === id)
    for (
      let turn = 0;
      !world.units.some(unit => unit.team === 'blue' && unit.kind === 'spy') && turn < 2_000;
      turn++
    ) {
      school.timer = 65535
      tick(world, 1 / 12)
    }
    const unit = world.units.find(
      candidate => candidate.team === 'blue' && candidate.kind === 'spy'
    )
    if (!unit) throw new Error('Mission 12 Spy training timed out')
    scene.onChange()
    return unit.id
  }, school)
  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      { setSelection } = await import('/app/model.ts')
    setSelection(scene.world, [])
    scene.onChange()
  })
  await page.getByLabel('Select spy', { exact: true }).click()
  await moveSelectedUnit(page, 'spy', 'Mission 12')
  const renderedSpy = await page.evaluate(async id => {
    const scene = globalThis.testScene,
      sprites = (await import('/app/original-units.json')).default,
      unit = scene.world.units.find(candidate => candidate.id === id),
      mesh = scene.unitMeshes.get(id)
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    scene.renderer.render(scene.scene, scene.camera)
    const frames = new Set(
      Object.values(sprites.animations['blue-spy']).flatMap(directions =>
        directions.flatMap(direction => direction.frames)
      )
    )
    return {
      model: unit.kind,
      visible: mesh.visible,
      draw: mesh.userData.draw,
      originalFrame: frames.has(mesh.userData.frame),
      layers: mesh.userData.layers.filter(layer => layer.visible).length,
    }
  }, spy)
  assert.deepEqual(renderedSpy, {
    model: 'spy',
    visible: true,
    draw: 17,
    originalFrame: true,
    layers: renderedSpy.layers,
  })
  assert.ok(renderedSpy.layers > 0)

  await page.getByLabel('Menu', { exact: true }).click()
  await page.getByRole('button', { name: 'Restart world' }).click()
  await page.waitForFunction(() => {
    const store = globalThis.testStore,
      world = store.getWorld()
    return (
      world.outcome.level === 12 && world.turn === 0 && store.getCompletedMissions().includes(11)
    )
  })
  assert.deepEqual(
    await page.evaluate(() => {
      const store = globalThis.testStore,
        world = store.getWorld()
      world.status = 'won'
      world.outcome.cameraPlaying = false
      world.outcome.completedLevel = 11
      store.update()
      return store.getCompletedMissions()
    }),
    [11, 12]
  )
  await page.getByRole('button', { name: 'Continue to Mission 13', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 13)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  await page.getByLabel('Focus Chumara tribe').waitFor()
  await page.getByLabel('Focus Matak tribe').waitFor()
  await page.getByText('I sense a new threat', { exact: false }).waitFor()
  const missionThirteenSkip = page.getByRole('button', {
    name: 'Skip introduction',
    exact: false,
  })
  await missionThirteenSkip.waitFor()

  const missionThirteen = await page.evaluate(() => {
    const scene = globalThis.testScene,
      world = scene.world
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    return {
      level: world.outcome.level,
      camera: { ...scene.viewPoint },
      teams: Object.fromEntries(
        ['blue', 'red', 'yellow', 'green', 'wild'].map(team => [
          team,
          world.units.filter(unit => unit.team === team).length,
        ])
      ),
      sites: world.shrines.map(shrine => [shrine.kind, shrine.reward]),
      siteMeshes: world.shrines.filter(shrine => {
        const group = scene.shrineMeshes.get(shrine.id)?.g
        return (
          group?.visible &&
          group.parent === scene.objects &&
          group.children.some(child => child.visible)
        )
      }).length,
      selected: world.units.find(unit => world.selected.includes(unit.id))?.kind,
      unitMeshes: world.units.filter(unit => scene.unitMeshes.get(unit.id)?.visible).length,
      vehicles: world.vehicles.length,
      balloonHut: world.unlockedBalloonHut,
      flyby: {
        events: world.flyby.events.length,
        end: { ...world.flyby.end },
        latch: world.campaignAIs[2].variables[11],
        inputMask: world.inputMask,
      },
    }
  })
  assert.equal(missionThirteen.level, 13)
  assert.deepEqual(missionThirteen.teams, {
    blue: 7,
    red: 0,
    yellow: 7,
    green: 7,
    wild: 146,
  })
  assert.deepEqual(missionThirteen.sites, [
    ['vault', 'balloonHut'],
    ['firestorm', 'firestorm'],
    ['shield', 'shield'],
    ['volcano', 'volcano'],
    ['vault', 'earthquake'],
  ])
  assert.equal(missionThirteen.siteMeshes, 5)
  assert.equal(missionThirteen.selected, 'shaman')
  assert.equal(
    missionThirteen.unitMeshes,
    Object.values(missionThirteen.teams).reduce((sum, count) => sum + count, 0)
  )
  assert.equal(missionThirteen.vehicles, 0)
  assert.equal(missionThirteen.balloonHut, false)
  assert.equal(await page.getByRole('button', { name: /Balloon Hut/ }).count(), 0)
  assert.deepEqual(
    {
      events: missionThirteen.flyby.events,
      end: missionThirteen.flyby.end,
      latch: missionThirteen.flyby.latch,
    },
    {
      events: 24,
      end: { x: 248, y: 58, angle: 350, zoom: 0 },
      latch: 1,
    }
  )
  assert.equal(missionThirteen.flyby.inputMask & 64, 64)
  await page.waitForFunction(
    initial =>
      Math.hypot(
        globalThis.testScene.viewPoint.x - initial.x,
        globalThis.testScene.viewPoint.z - initial.z
      ) > 0.5,
    missionThirteen.camera
  )
  await missionThirteenSkip.click()
  await page.waitForFunction(() => {
    const world = globalThis.testStore.getWorld()
    return !(world.flyby.flags & 1) && !(world.inputMask & 64)
  })

  await page.getByLabel('Menu', { exact: true }).click()
  await page.getByText('Seek Balloon Hut, Firestorm, Shield', { exact: false }).waitFor()
  await page.getByLabel('Close menu').click()
  await moveSelectedUnit(page, 'shaman', 'Mission 13')

  const missionThirteenCheckpoint = await page.evaluate(async () => {
    const store = globalThis.testStore,
      { tick } = await import('/app/model.ts')
    let world = store.getWorld()
    for (let turn = 0; turn < 64; turn++) tick(world, 1 / 12)
    const checkpoint = structuredClone(world)
    await store.saveCheckpoint()
    if (!store.loadCheckpoint()) throw new Error('Mission 13 opening checkpoint failed')
    world = store.getWorld()
    const restored = structuredClone(world),
      control = structuredClone(world)
    for (let turn = 0; turn < 64; turn++) {
      tick(control, 1 / 12)
      tick(world, 1 / 12)
    }
    return { checkpoint, restored, control, continued: structuredClone(world) }
  })
  assert.deepEqual(missionThirteenCheckpoint.restored, missionThirteenCheckpoint.checkpoint)
  assert.equal(missionThirteenCheckpoint.restored.outcome.level, 13)
  assert.deepEqual(missionThirteenCheckpoint.continued, missionThirteenCheckpoint.control)
  await page.getByLabel('Menu', { exact: true }).click()
  await page.getByRole('button', { name: 'Restart world' }).click()
  await page.waitForFunction(() => {
    const store = globalThis.testStore,
      world = store.getWorld()
    return (
      world.outcome.level === 13 && world.turn === 0 && store.getCompletedMissions().includes(12)
    )
  })
  assert.deepEqual(errors, [])
  console.log(
    'PASS: Missions 10-13 continue through rendered openings, Mission 11 autonomous construction, Mission 12 reaches a trained moving Spy, and Mission 13 renders both opponents, original knowledge, movement, checkpoint, restart and profile retention'
  )
} finally {
  await browser.close()
}
