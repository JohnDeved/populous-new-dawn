import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame, openGame } from './browser-game.mjs'

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

async function vehicleLandingTarget(page, vehicleId) {
  return page.evaluate(async id => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, nativePosition } = await import('/app/model.ts'),
      { liveCommandContext } = await import('/app/live-command.ts'),
      { liveVehicleCellObjects } = await import('/app/live-vehicles.ts'),
      { vehicleCanDisembark } = await import('/app/vehicle-routing.ts'),
      vehicle = world.vehicles.find(candidate => candidate.id === id),
      land = {
        flags: world.land.flags,
        categories: world.land.categories,
        cellObjects: cell => liveVehicleCellObjects(world, cell),
      },
      candidates = [],
      blockers = new Map()
    if (!vehicle.passengers.some(passenger => world.selected.includes(passenger)))
      throw new Error('Balloon passenger is not selected through player controls')
    world.mode = null
    for (let y = 0; y < 256; y += 2)
      for (let x = 0; x < 256; x += 2) {
        const point = { x: (x + 1) * 256, y: (y + 1) * 256 },
          distance = Math.hypot(
            ((point.x - vehicle.x) << 16) >> 16,
            ((point.y - vehicle.y) << 16) >> 16
          )
        if (distance > 3_000 && distance < 10_000 && vehicleCanDisembark(land, vehicle, point))
          candidates.push([distance, point])
      }
    for (const [, point] of candidates.sort((a, b) => a[0] - b[0])) {
      const target = browserPosition({ x: point.x + 73, y: point.y + 119 })
      scene.focus(target)
      for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
        scene.updateCameraMotion(1 / 24)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      const projected = scene.screen(target),
        bounds = scene.container.getBoundingClientRect(),
        screen = {
          x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
        },
        picked = scene.pick({ clientX: screen.x, clientY: screen.y }),
        element = document.elementFromPoint(screen.x, screen.y),
        blocker = element ? `${element.tagName}.${element.className}#${element.id}` : 'none'
      blockers.set(blocker, (blockers.get(blocker) ?? 0) + 1)
      if (
        picked &&
        element === scene.renderer.domElement &&
        !scene.pickUnit({ clientX: screen.x, clientY: screen.y }) &&
        !scene.pickWorldObject({ clientX: screen.x, clientY: screen.y }) &&
        vehicleCanDisembark(land, vehicle, nativePosition(world, picked)) &&
        liveCommandContext(world, picked)?.enabled
      )
        return screen
    }
    throw new Error(
      `No exposed Balloon landing target: ${JSON.stringify({
        rendererConnected: scene.renderer.domElement.isConnected,
        blockers: Object.fromEntries(blockers),
      })}`
    )
  }, vehicleId)
}

async function vehicleClickPoint(page, vehicleId) {
  return page.evaluate(async id => {
    const scene = globalThis.testScene,
      vehicle = scene.world.vehicles.find(candidate => candidate.id === id),
      { browserPosition } = await import('/app/model.ts')
    scene.focus(browserPosition(vehicle))
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.view.screen(scene.vehicleMeshes.get(id).position, scene.camera),
      bounds = scene.container.getBoundingClientRect(),
      center = {
        x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
      }
    scene.picking.lastKey = ''
    for (let dy = -100; dy <= 40; dy += 3)
      for (let dx = -50; dx <= 50; dx += 3) {
        const click = { x: center.x + dx, y: center.y + dy }
        if (
          document.elementFromPoint(click.x, click.y) === scene.renderer.domElement &&
          !scene.pickUnit({ clientX: click.x, clientY: click.y }) &&
          scene.pickWorldObject({ clientX: click.x, clientY: click.y })?.id === id
        )
          return click
      }
    throw new Error('No exposed landed Balloon geometry')
  }, vehicleId)
}

async function unitClickPoint(page, kind, excludedIds = []) {
  return page.evaluate(({ kind, ids }) => {
    const scene = globalThis.testScene,
      follower = scene.world.units.find(
        unit =>
          unit.team === 'blue' &&
          unit.kind === kind &&
          !ids.includes(unit.id) &&
          !unit.inside &&
          !unit.native?.vehicle
      )
    scene.focus(follower)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.screen(follower),
      bounds = scene.container.getBoundingClientRect(),
      center = {
        x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
      }
    for (let radius = 0; radius <= 20; radius += 2)
      for (let step = 0; step < 16; step++) {
        const click = {
          x: center.x + Math.cos((step * Math.PI) / 8) * radius,
          y: center.y + Math.sin((step * Math.PI) / 8) * radius,
        }
        if (
          document.elementFromPoint(click.x, click.y) === scene.renderer.domElement &&
          scene.pickUnit({ clientX: click.x, clientY: click.y })?.id === follower.id
        )
          return { id: follower.id, click }
      }
    throw new Error(`No exposed ordinary ${kind} geometry`)
  }, { kind, ids: Array.isArray(excludedIds) ? excludedIds : [excludedIds] })
}

const braveClickPoint = (page, excludedIds) => unitClickPoint(page, 'brave', excludedIds)

async function buildingClickPoint(page, buildingId) {
  return page.evaluate(id => {
    const scene = globalThis.testScene,
      building = scene.world.buildings.find(candidate => candidate.id === id)
    scene.focus(building)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.screen(building),
      bounds = scene.container.getBoundingClientRect(),
      center = {
        x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
      }
    for (let dy = -75; dy <= 20; dy += 3)
      for (let dx = -30; dx <= 30; dx += 3) {
        const click = { x: center.x + dx, y: center.y + dy }
        if (scene.pickWorldObject({ clientX: click.x, clientY: click.y })?.id === id) return click
      }
    throw new Error('No exposed building geometry')
  }, buildingId)
}

async function shrineClickPoint(page, shrineId) {
  return page.evaluate(id => {
    const scene = globalThis.testScene,
      shrine = scene.world.shrines.find(candidate => candidate.id === id)
    scene.focus(shrine)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.screen(shrine),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((projected.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - projected.y) * bounds.height) / 2
    scene.picking.lastKey = ''
    for (let dy = -75; dy <= 0; dy += 3)
      for (let dx = -20; dx <= 20; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.pickWorldObject(event)?.id === shrine.id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Mission 13 Balloon Vault geometry')
  }, shrineId)
}

async function terrainClickPoint(page, target, spell = null) {
  return page.evaluate(async ({ point, spell }) => {
    const scene = globalThis.testScene,
      { spellTargetError } = await import('/app/live-command.ts')
    scene.focus(point)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.screen(point),
      bounds = scene.container.getBoundingClientRect(),
      center = {
        x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
      }
    for (let radius = 0; radius <= 50; radius += 2)
      for (let step = 0; step < 16; step++) {
        const screen = {
            x: center.x + Math.cos((step * Math.PI) / 8) * radius,
            y: center.y + Math.sin((step * Math.PI) / 8) * radius,
          },
          picked = scene.pick({ clientX: screen.x, clientY: screen.y })
        if (
          picked &&
          !scene.pickUnit({ clientX: screen.x, clientY: screen.y }) &&
          !scene.pickWorldObject({ clientX: screen.x, clientY: screen.y }) &&
          Math.hypot(picked.x - point.x, picked.z - point.z) < 2 &&
          (!spell || !spellTargetError(scene.world, spell, picked))
        )
          return { ...screen, picked }
      }
    throw new Error('No exposed terrain target')
  }, { point: target, spell })
}

async function castLandBridge(page, target) {
  const before = await page.evaluate(() => globalThis.testScene.world.stats.bridges),
    click = await terrainClickPoint(page, target, 'bridge')
  await page.getByRole('button', { name: /Land Bridge, [1-9] shots/ }).click()
  await page.mouse.click(click.x, click.y)
  await page.evaluate(async previous => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (let turn = 0; world.stats.bridges === previous && turn < 1_000; turn++) tick(world, 1 / 12)
    for (let turn = 0; world.effects.some(effect => effect.bridge) && turn < 2_000; turn++)
      tick(world, 1 / 12)
    if (
      shaman.hp <= 0 ||
      world.stats.bridges !== previous + 1 ||
      world.effects.some(effect => effect.bridge)
    )
      throw new Error(
        `Player-cast Land Bridge did not finish: ${JSON.stringify({
          shaman: [shaman.hp, shaman.x, shaman.z],
          message: world.message,
          mode: world.mode,
          shots: world.shots.bridge,
        })}`
      )
  }, before)
}

async function castSwarm(page, target) {
  const click = await terrainClickPoint(page, target, 'swarm')
  await page.getByRole('button', { name: /^Swarm, [1-9] shots$/ }).click()
  await page.mouse.click(click.x, click.y)
  await page.evaluate(async () => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (
      let turn = 0;
      (!world.effects.some(effect => effect.swarm?.applied) ||
        shaman.casting ||
        world.castingTribes[0].cooldown) &&
        turn < 1_000;
      turn++
    )
      tick(world, 1 / 12)
    if (!world.effects.some(effect => effect.swarm?.applied))
      throw new Error('Mission 13 rendered Swarm did not protect the third bridge approach')
  })
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
  await page.waitForFunction(() => globalThis.testStore.getWorld().flyby.flags & 1)
  await page.evaluate(() => (globalThis.testStore.getWorld().speed = 0))
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
  await page.evaluate(() => (globalThis.testScene.world.speed = 0))

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

  const sabotage = await page.evaluate(async id => {
    const scene = globalThis.testScene,
      world = scene.world,
      { entrance } = await import('/app/model.ts'),
      { tribeForTeam } = await import('/app/world-types.ts'),
      spy = world.units.find(unit => unit.id === id)
    const candidates = world.buildings
      .filter(building => building.team !== 'blue' && building.hp > 0 && building.progress === 1)
      .map(building => {
        const door = entrance(world, building),
          clearance = Math.min(
            ...world.units
              .filter(unit => unit.team === building.team && unit.hp > 0 && unit.inside === null)
              .map(unit => Math.hypot(unit.x - door.x, unit.z - door.z))
          )
        return {
          building,
          clearance,
          distance: Math.hypot(spy.x - door.x, spy.z - door.z),
        }
      })
      .toSorted((a, b) => b.clearance - a.clearance || a.distance - b.distance)
    const target = candidates[0]
    if (!target) throw new Error('No Mission 12 enemy building for Spy sabotage')
    const tribe = tribeForTeam(target.building.team),
      name = ['', 'Dakini', 'Chumara', 'Matak'][tribe]
    return { id: target.building.id, tribe, name, clearance: target.clearance }
  }, spy)
  await page.getByTitle('followers', { exact: true }).click()
  await page.getByLabel(`Disguise selected spies as ${sabotage.name}`).click()
  const disguised = await page.evaluate(async ({ id, tribe }) => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      unit = world.units.find(candidate => candidate.id === id)
    tick(world, 1 / 12)
    for (let turn = 0; (unit.native?.disguise & 63) && turn < 80; turn++) tick(world, 1 / 12)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    scene.renderer.render(scene.scene, scene.camera)
    return {
      disguise: unit.native?.disguise,
      owner: scene.unitMeshes.get(id)?.userData.owner,
      expected: tribe << 6,
    }
  }, { id: spy, tribe: sabotage.tribe })
  assert.deepEqual(disguised, {
    disguise: disguised.expected,
    owner: sabotage.tribe,
    expected: sabotage.tribe << 6,
  })

  await page.evaluate(async ({ buildingId, spyId }) => {
    const scene = globalThis.testScene,
      world = scene.world,
      { entrance } = await import('/app/model.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      { tribeForTeam } = await import('/app/world-types.ts'),
      building = world.buildings.find(candidate => candidate.id === buildingId),
      spy = world.units.find(candidate => candidate.id === spyId)
    world.campaignAIs[tribeForTeam(building.team)].attributes[40] = 100
    Object.assign(spy, entrance(world, building))
    spy.path = []
    syncLivePersonCells(world)
    scene.focus(building)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
  }, { buildingId: sabotage.id, spyId: spy })
  const sabotagePoint = await page.evaluate(id => {
    const scene = globalThis.testScene,
      building = scene.world.buildings.find(candidate => candidate.id === id),
      point = scene.screen(building),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -75; dy <= 30; dy += 3)
      for (let dx = -35; dx <= 35; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (scene.pickWorldObject(event)?.id === building.id)
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Mission 12 sabotage target geometry')
  }, sabotage.id)
  await page.mouse.click(sabotagePoint.x, sabotagePoint.y)
  const sabotageCheckpoint = await page.evaluate(async ({ spyId, buildingId }) => {
    const store = globalThis.testStore,
      world = store.getWorld(),
      { tick } = await import('/app/model.ts'),
      { currentPersonOrder } = await import('/app/person-orders.ts'),
      unit = world.units.find(candidate => candidate.id === spyId),
      building = world.buildings.find(candidate => candidate.id === buildingId)
    if (currentPersonOrder(world.buildingOrders, unit.native)?.model !== 15)
      throw new Error('Canvas input did not issue native Spy command 15')
    for (let turn = 0; !building.burn && turn < 2_000; turn++) tick(world, 1 / 12)
    if (!building.burn)
      throw new Error(
        `Mission 12 Spy sabotage did not ignite its target: ${JSON.stringify({
          spy: {
            x: unit.x,
            z: unit.z,
            hp: unit.hp,
            path: unit.path.length,
            target: unit.target,
            state: unit.native?.state,
            status: unit.native?.commandStatus,
            phase: unit.native?.substate,
            timer: unit.native?.timer,
            disguise: unit.native?.disguise,
          },
          order: unit.native ? currentPersonOrder(world.buildingOrders, unit.native) : null,
          building: { hp: building.hp, progress: building.progress, damage: building.damageState },
        })}`
      )
    const snapshot = source => {
      const spy = source.units.find(candidate => candidate.id === spyId),
        target = source.buildings.find(candidate => candidate.id === buildingId),
        order = currentPersonOrder(source.buildingOrders, spy.native)
      return {
        disguise: spy.native.disguise,
        substate: spy.native.substate,
        timer: spy.native.timer,
        order: order && { model: order.model, a: order.a, b: order.b },
        building: {
          state: target.damageState.state,
          attacker: target.damageState.attacker,
          burn: structuredClone(target.burn),
        },
      }
    }
    const before = snapshot(world)
    await store.saveCheckpoint()
    if (!store.loadCheckpoint()) throw new Error('Mission 12 Spy sabotage checkpoint failed')
    return { before, restored: snapshot(store.getWorld()) }
  }, { spyId: spy, buildingId: sabotage.id })
  assert.deepEqual(sabotageCheckpoint.restored, sabotageCheckpoint.before)
  assert.equal(sabotageCheckpoint.before.building.state, 4)
  assert.equal(sabotageCheckpoint.before.building.attacker, 0)
  assert.equal(sabotageCheckpoint.before.disguise, 0)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))

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
  await page.waitForFunction(() => globalThis.testStore.getWorld().flyby.flags & 1)
  await page.evaluate(() => (globalThis.testStore.getWorld().speed = 0))
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
  await page.evaluate(() => (globalThis.testScene.world.speed = 0))

  await page.getByLabel('Menu', { exact: true }).click()
  await page.getByText('Seek Balloon Hut, Firestorm, Shield', { exact: false }).waitFor()
  await page.getByLabel('Close menu').click()
  await moveSelectedUnit(page, 'shaman', 'Mission 13')

  await page.evaluate(async () => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts')
    world.speed = 0
    for (let turn = 0; world.shots.bridge < 3 && turn < 120_000; turn++) tick(world, 1 / 12)
    if (world.shots.bridge < 3) throw new Error('Mission 13 did not charge three Land Bridges')
    globalThis.testScene.onChange()
  })
  const bridgeShaman = await unitClickPoint(page, 'shaman')
  await page.mouse.click(bridgeShaman.click.x, bridgeShaman.click.y)
  const bridgeEscorts = []
  for (let i = 0; i < 4; i++) {
    const escort = await braveClickPoint(page, bridgeEscorts)
    await page.keyboard.down('Control')
    await page.mouse.click(escort.click.x, escort.click.y)
    await page.keyboard.up('Control')
    bridgeEscorts.push(escort.id)
  }
  assert.deepEqual(
    (await page.evaluate(() => globalThis.testScene.world.selected)).toSorted((a, b) => a - b),
    [bridgeShaman.id, ...bridgeEscorts].toSorted((a, b) => a - b)
  )
  await page.keyboard.press('g')
  assert.deepEqual(
    await page.evaluate(
      ids =>
        globalThis.testScene.world.units
          .filter(unit => ids.includes(unit.id))
          .map(unit => unit.guard),
      bridgeEscorts
    ),
    bridgeEscorts.map(() => true)
  )
  await page.keyboard.press('h')
  assert.deepEqual(await page.evaluate(() => globalThis.testScene.world.selected), [bridgeShaman.id])

  const firstBridgeSource = { x: -91, z: 61 },
    firstBridgeTarget = { x: -103, z: 54 },
    secondBridgeSource = { x: -104.5, z: 56 },
    secondBridgeTarget = { x: -116, z: 62 },
    thirdBridgeSource = { x: -117, z: 62 },
    thirdBridgeTarget = { x: -123, z: 63 }
  const bridgeApproach = { x: -50, z: 75 }
  let crossing = await terrainClickPoint(page, bridgeApproach)
  await page.mouse.click(crossing.x, crossing.y)
  await page.evaluate(async target => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (
      let turn = 0;
      shaman.hp > 0 && Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3 && turn < 5_000;
      turn++
    )
      tick(world, 1 / 12)
    if (shaman.hp <= 0 || Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3)
      throw new Error('Mission 13 party did not reach the safe bridge approach')
  }, bridgeApproach)
  await castSwarm(page, { x: -70, z: 68 })

  crossing = await terrainClickPoint(page, firstBridgeSource)
  await page.mouse.click(crossing.x, crossing.y)
  await page.evaluate(async target => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (
      let turn = 0;
      shaman.hp > 0 && Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3 && turn < 5_000;
      turn++
    )
      tick(world, 1 / 12)
    if (shaman.hp <= 0 || Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3)
      throw new Error(
        `Mission 13 party did not reach the first bridge shore: ${JSON.stringify({
          shaman: [shaman.hp, shaman.x, shaman.z],
          selected: world.selected,
          blue: world.units
            .filter(unit => unit.team === 'blue' && unit.hp > 0)
            .map(unit => [unit.id, unit.kind, unit.x, unit.z]),
        })}`
      )
  }, firstBridgeSource)
  await castLandBridge(page, firstBridgeTarget)

  crossing = await terrainClickPoint(page, secondBridgeSource)
  await page.mouse.click(crossing.x, crossing.y)
  await page.evaluate(async target => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (
      let turn = 0;
      shaman.hp > 0 && Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3 && turn < 5_000;
      turn++
    )
      tick(world, 1 / 12)
    if (shaman.hp <= 0 || Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3)
      throw new Error('Mission 13 Shaman did not cross the first Land Bridge')
  }, secondBridgeSource)
  await castLandBridge(page, secondBridgeTarget)

  crossing = await terrainClickPoint(page, thirdBridgeSource)
  await page.mouse.click(crossing.x, crossing.y)
  await page.evaluate(async target => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (
      let turn = 0;
      shaman.hp > 0 && Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3 && turn < 5_000;
      turn++
    )
      tick(world, 1 / 12)
    if (shaman.hp <= 0 || Math.hypot(shaman.x - target.x, shaman.z - target.z) > 3)
      throw new Error('Mission 13 Shaman did not cross the second Land Bridge')
  }, thirdBridgeSource)
  await castSwarm(page, { x: 123, z: 67 })
  await castLandBridge(page, thirdBridgeTarget)
  await page.evaluate(source => {
    const world = globalThis.testScene.world,
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    if (Math.hypot(shaman.x - source.x, shaman.z - source.z) <= 20) return
    throw new Error(
      `Mission 13 Shaman did not survive the third Land Bridge: ${JSON.stringify({
        shaman: [shaman.hp, shaman.x, shaman.z],
        guards: world.units
          .filter(unit => unit.team === 'blue' && unit.kind === 'brave')
          .map(unit => [unit.hp, unit.x, unit.z, unit.guard]),
        yellow: world.units
          .filter(unit => unit.team === 'yellow')
          .map(unit => [unit.kind, unit.hp, unit.x, unit.z]),
      })}`
    )
  }, thirdBridgeSource)
  await castSwarm(page, { x: 123, z: 67 })
  const balloonVaultId = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      vault = world.shrines.find(shrine => shrine.reward === 'balloonHut')
    world.speed = 0
    scene.focus(vault)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    return vault.id
  })
  const clickVault = async () => {
    const point = await shrineClickPoint(page, balloonVaultId)
    await page.mouse.move(point.x, point.y)
    await page.mouse.click(point.x, point.y)
    return page.evaluate(async () => {
      const world = globalThis.testScene.world,
        { currentPersonOrder } = await import('/app/person-orders.ts'),
        shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
      return currentPersonOrder(world.buildingOrders, shaman.native)?.model === 33
    })
  }
  if (!(await clickVault()) && !(await clickVault()))
    throw new Error('Rendered Mission 13 Balloon Vault clicks did not start worship')
  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; !world.unlockedBalloonHut && turn < 12_000; turn++) tick(world, 1 / 12)
    if (!world.unlockedBalloonHut) {
      const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
        vault = world.shrines.find(shrine => shrine.reward === 'balloonHut')
      throw new Error(
        `Mission 13 Vault did not unlock the Balloon Hut: ${JSON.stringify({
          selected: world.selected,
          shaman: shaman && [shaman.hp, shaman.x, shaman.z, shaman.work],
          vault: vault && [vault.x, vault.z, vault.progress, vault.followers],
          message: world.message,
        })}`
      )
    }
    scene.onChange()
  })

  await page.getByLabel('Select brave').click()
  await page.getByRole('button', { name: 'buildings B', exact: true }).click()
  const balloonHutButton = page.getByRole('button', {
    name: 'Balloon Hut, 11 wood',
    exact: true,
  })
  await balloonHutButton.waitFor()
  assert.equal(await balloonHutButton.isEnabled(), true)
  const balloonHutSite = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, buildingPlanPose, nativePosition, placementError } =
        await import('/app/model.ts'),
      { buildingFootprintCells } = await import('/app/building-shapes.ts'),
      { missionPosition } = await import('/app/mission-data.ts'),
      start = missionPosition(13, 'blue'),
      bounds = scene.container.getBoundingClientRect(),
      candidates = []
    for (let z = start.z - 32; z <= start.z + 32; z += 0.5)
      for (let x = start.x - 32; x <= start.x + 32; x += 0.5)
        if (!placementError(world, 'balloonHut', { x, z })) {
          const plan = buildingPlanPose(world, 'balloonHut', { x, z }),
            point = browserPosition({ x: plan.anchorX, y: plan.anchorY })
          if (
            buildingFootprintCells(plan).some(index =>
              world.units.some(unit => {
                const native = nativePosition(world, unit)
                return (
                  unit.hp > 0 &&
                  unit.inside === null &&
                  ((native.y & 65535) >> 9) * 128 + ((native.x & 65535) >> 9) === index
                )
              })
            )
          )
            continue
          if (!candidates.some(candidate => candidate.x === point.x && candidate.z === point.z))
            candidates.push(point)
        }
    for (const candidate of candidates) {
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
      if (picked && !placementError(world, 'balloonHut', picked)) {
        const nearestTree = Math.min(
          ...world.trees
            .filter(tree => tree.logs > 0)
            .map(tree => Math.hypot(tree.x - picked.x, tree.z - picked.z))
        )
        if (nearestTree < 12) return point
      }
    }
    throw new Error('No exposed valid Mission 13 Balloon Hut site')
  })
  await balloonHutButton.click()
  await page.mouse.move(balloonHutSite.x, balloonHutSite.y)
  await page.evaluate(() => globalThis.testScene.updatePointerFrame(performance.now()))
  assert.deepEqual(
    await page.evaluate(() => ({
      visible: globalThis.testScene.cursor.visible,
      invalid: globalThis.testScene.cursor.userData.invalid,
    })),
    { visible: true, invalid: false }
  )
  await page.mouse.click(balloonHutSite.x, balloonHutSite.y)
  const balloonHutId = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      hut = world.buildings.find(building => building.kind === 'balloonHut')
    if (!hut || hut.progress !== 0) throw new Error('Real input did not place the Balloon Hut')
    for (let turn = 0; hut.progress < 1 && turn < 24_000; turn++) tick(world, 1 / 12)
    if (hut.progress < 1)
      throw new Error(
        `Balloon Hut construction timed out: ${JSON.stringify({
          progress: hut.progress,
          position: [hut.x, hut.z],
          woodUnavailable: hut.woodUnavailable,
          workers: world.units.filter(unit => unit.work === hut.id).map(unit => unit.id),
        })}`
      )
    for (let turn = 0; world.units.some(unit => unit.work === hut.id) && turn < 2_000; turn++)
      tick(world, 1 / 12)
    scene.onChange()
    return hut.id
  })

  await page.keyboard.press('h')
  await page.getByLabel('Select brave').click()
  await page.evaluate(async id => {
    const scene = globalThis.testScene,
      world = scene.world,
      hut = world.buildings.find(building => building.id === id)
    scene.focus(hut)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
  }, balloonHutId)
  const balloonHutPoint = await page.evaluate(id => {
    const scene = globalThis.testScene,
      hut = scene.world.buildings.find(building => building.id === id),
      projected = scene.screen(hut),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((projected.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - projected.y) * bounds.height) / 2
    for (let dy = -75; dy <= 20; dy += 3)
      for (let dx = -30; dx <= 30; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (scene.pickWorldObject(event)?.id === hut.id)
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Balloon Hut geometry')
  }, balloonHutId)
  await page.mouse.click(balloonHutPoint.x, balloonHutPoint.y)

  const launchedBalloon = await page.evaluate(async id => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, tick } = await import('/app/model.ts'),
      { terrainPointHeight } = await import('/app/native-terrain.ts'),
      hut = world.buildings.find(building => building.id === id)
    for (let turn = 0; !world.vehicles.some(vehicle => vehicle.model === 3) && turn < 12_000; turn++)
      tick(world, 1 / 12)
    const balloon = world.vehicles.find(vehicle => vehicle.model === 3),
      driver = balloon && world.units.find(unit => unit.id === balloon.passengers[0])
    if (!balloon || !driver) throw new Error('Balloon Hut did not launch an occupied Balloon')
    scene.focus(browserPosition(balloon))
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const group = scene.vehicleMeshes.get(balloon.id),
      renderer = scene.renderer,
      gl = renderer.getContext(),
      length = gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      before = new Uint8Array(length),
      after = new Uint8Array(length)
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      before
    )
    group.visible = false
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      after
    )
    group.visible = true
    let pixels = 0
    for (let i = 0; i < length; i += 4)
      if (
        before[i] !== after[i] ||
        before[i + 1] !== after[i + 1] ||
        before[i + 2] !== after[i + 2]
      )
        pixels++
    return {
      id: balloon.id,
      driver: driver.id,
      model: balloon.model,
      physics: balloon.physics,
      passengers: [...balloon.passengers],
      height: balloon.h,
      terrain: terrainPointHeight(world.land, balloon),
      timer: hut.timer,
      pixels,
    }
  }, balloonHutId)
  assert.deepEqual(
    {
      model: launchedBalloon.model,
      physics: launchedBalloon.physics,
      passengers: launchedBalloon.passengers,
      height: launchedBalloon.height,
      timer: launchedBalloon.timer,
    },
    {
      model: 3,
      physics: 0,
      passengers: [launchedBalloon.driver],
      height: launchedBalloon.terrain + 560,
      timer: 0,
    }
  )
  assert.ok(launchedBalloon.pixels > 0, JSON.stringify(launchedBalloon))

  const firstBalloonTarget = await vehicleLandingTarget(page, launchedBalloon.id)
  await page.mouse.click(firstBalloonTarget.x, firstBalloonTarget.y)
  const firstBalloonLanding = await page.evaluate(async ({ vehicleId, driverId }) => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      balloon = world.vehicles.find(vehicle => vehicle.id === vehicleId),
      driver = world.units.find(unit => unit.id === driverId),
      before = [balloon.x, balloon.y]
    for (let turn = 0; driver.native?.vehicle && turn < 1_000; turn++) tick(world, 1 / 12)
    scene.onChange()
    return {
      moved: balloon.x !== before[0] || balloon.y !== before[1],
      passengers: [...balloon.passengers],
      driverVehicle: driver.native?.vehicle,
    }
  }, { vehicleId: launchedBalloon.id, driverId: launchedBalloon.driver })
  assert.deepEqual(firstBalloonLanding, { moved: true, passengers: [], driverVehicle: 0 })

  let balloonClick = await vehicleClickPoint(page, launchedBalloon.id)
  await page.mouse.click(balloonClick.x, balloonClick.y)
  let followerId = await page.evaluate(async ({ vehicleId, driverId }) => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      balloon = world.vehicles.find(vehicle => vehicle.id === vehicleId),
      driver = world.units.find(unit => unit.id === driverId)
    for (
      let turn = 0;
      (driver.native?.vehicle !== vehicleId || balloon.passengerCount < 2) && turn < 4_000;
      turn++
    )
      tick(world, 1 / 12)
    const follower = balloon.passengers.find(id => id !== driverId)
    if (driver.native?.vehicle !== vehicleId)
      throw new Error('Builder did not reboard the Balloon through rendered input')
    return follower ?? null
  }, { vehicleId: launchedBalloon.id, driverId: launchedBalloon.driver })
  if (!followerId) {
    await page.keyboard.press('h')
    const follower = await braveClickPoint(page, launchedBalloon.driver)
    await page.mouse.click(follower.click.x, follower.click.y)
    balloonClick = await vehicleClickPoint(page, launchedBalloon.id)
    await page.mouse.click(balloonClick.x, balloonClick.y)
    followerId = await page.evaluate(
      async ({ vehicleId, followerId }) => {
        const world = globalThis.testScene.world,
          { tick } = await import('/app/model.ts'),
          follower = world.units.find(unit => unit.id === followerId)
        for (let turn = 0; follower.native?.vehicle !== vehicleId && turn < 4_000; turn++)
          tick(world, 1 / 12)
        if (follower.native?.vehicle !== vehicleId)
          throw new Error('Real Balloon input did not board the selected follower')
        return followerId
      },
      { vehicleId: launchedBalloon.id, followerId: follower.id }
    )
  }

  const occupiedBalloon = await page.evaluate(
    async ({ vehicleId, hutId, followerId }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        { tick } = await import('/app/model.ts'),
        balloon = world.vehicles.find(vehicle => vehicle.id === vehicleId),
        follower = world.units.find(unit => unit.id === followerId)
      for (let turn = 0; follower.native?.vehicle !== vehicleId && turn < 4_000; turn++)
        tick(world, 1 / 12)
      if (follower.native?.vehicle !== vehicleId)
        throw new Error('Real Balloon input did not board follower')
      const snapshot = state => {
        const savedBalloon = state.vehicles.find(vehicle => vehicle.id === vehicleId),
          savedHut = state.buildings.find(building => building.id === hutId),
          savedFollower = state.units.find(unit => unit.id === followerId)
        return {
          hut: { id: savedHut?.id, timer: savedHut?.timer },
          balloon: {
            id: savedBalloon?.id,
            model: savedBalloon?.model,
            physics: savedBalloon?.physics,
            position: [savedBalloon?.x, savedBalloon?.y, savedBalloon?.h],
            passengers: savedBalloon?.passengers,
          },
          follower: { id: savedFollower?.id, vehicle: savedFollower?.native?.vehicle },
        }
      }
      const expected = snapshot(world)
      if (!(await globalThis.testStore.saveCheckpoint()))
        throw new Error('Occupied Mission 13 Balloon checkpoint save failed')
      return expected
    },
    {
      vehicleId: launchedBalloon.id,
      hutId: balloonHutId,
      followerId,
    }
  )
  assert.deepEqual(occupiedBalloon.balloon.passengers, [launchedBalloon.driver, followerId])
  const secondBalloonTarget = await vehicleLandingTarget(page, launchedBalloon.id)
  await page.mouse.click(secondBalloonTarget.x, secondBalloonTarget.y)
  const completedBalloonFlight = await page.evaluate(
    async ({ vehicleId, driverId, followerId, before }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        { tick } = await import('/app/model.ts'),
        { currentPersonOrder } = await import('/app/person-orders.ts'),
        { terrainPointHeight } = await import('/app/native-terrain.ts'),
        balloon = world.vehicles.find(vehicle => vehicle.id === vehicleId),
        driver = world.units.find(unit => unit.id === driverId),
        follower = world.units.find(unit => unit.id === followerId)
      for (let turn = 0; follower.native?.vehicle && turn < 1_000; turn++) tick(world, 1 / 12)
      for (let turn = 0; turn < 32; turn++) tick(world, 1 / 12)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      return {
        moved: Math.hypot(balloon.x - before[0], balloon.y - before[1]) > 512,
        passengers: [...balloon.passengers],
        driverVehicle: driver.native?.vehicle,
        followerVehicle: follower.native?.vehicle,
        activeOrders: [driver, follower].map(unit =>
          currentPersonOrder(world.buildingOrders, unit.native)?.model ?? 0
        ),
        height: balloon.h,
        terrain: terrainPointHeight(world.land, balloon),
        visible: scene.vehicleMeshes.get(balloon.id)?.visible,
      }
    },
    {
      vehicleId: launchedBalloon.id,
      driverId: launchedBalloon.driver,
      followerId,
      before: occupiedBalloon.balloon.position,
    }
  )
  assert.deepEqual(
    completedBalloonFlight,
    {
      moved: true,
      passengers: [],
      driverVehicle: 0,
      followerVehicle: 0,
      activeOrders: [0, 0],
      height: completedBalloonFlight.terrain + 560,
      terrain: completedBalloonFlight.terrain,
      visible: true,
    },
    JSON.stringify(completedBalloonFlight)
  )

  await page.keyboard.press('h')
  await page.getByLabel('Select brave', { exact: true }).click()
  assert.ok(
    await page.evaluate(() => {
      const world = globalThis.testScene.world
      return world.units.some(
        unit => unit.kind === 'brave' && world.selected.includes(unit.id) && unit.hp > 0
      )
    })
  )
  const recurringHutClick = await buildingClickPoint(page, balloonHutId)
  await page.mouse.click(recurringHutClick.x, recurringHutClick.y)
  const recurringBalloon = await page.evaluate(async hutId => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      hut = world.buildings.find(building => building.id === hutId)
    for (
      let turn = 0;
      world.vehicles.filter(vehicle => vehicle.model === 3).length < 2 && turn < 12_000;
      turn++
    )
      tick(world, 1 / 12)
    const balloons = world.vehicles.filter(vehicle => vehicle.model === 3)
    return {
      count: balloons.length,
      passengers: balloons.at(-1)?.passengers.length,
      timer: hut.timer,
    }
  }, balloonHutId)
  assert.deepEqual(recurringBalloon, { count: 2, passengers: 1, timer: 0 })

  const restoredPage = await page.context().newPage()
  restoredPage.setDefaultTimeout(20_000)
  restoredPage.on('pageerror', error => errors.push(error.stack ?? error.message))
  restoredPage.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await restoredPage.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', {
    waitUntil: 'domcontentloaded',
  })
  await restoredPage.getByRole('button', { name: 'Load Game', exact: true }).click()
  await bindGame(restoredPage)
  const restoredOccupiedBalloon = await restoredPage.evaluate(
    ({ vehicleId, hutId, followerId }) => {
      const state = globalThis.testStore.getWorld(),
        balloon = state.vehicles.find(vehicle => vehicle.id === vehicleId),
        hut = state.buildings.find(building => building.id === hutId),
        follower = state.units.find(unit => unit.id === followerId)
      return {
        hut: { id: hut?.id, timer: hut?.timer },
        balloon: {
          id: balloon?.id,
          model: balloon?.model,
          physics: balloon?.physics,
          position: [balloon?.x, balloon?.y, balloon?.h],
          passengers: balloon?.passengers,
        },
        follower: { id: follower?.id, vehicle: follower?.native?.vehicle },
      }
    },
    { vehicleId: launchedBalloon.id, hutId: balloonHutId, followerId }
  )
  assert.deepEqual(restoredOccupiedBalloon, occupiedBalloon)

  const restoredBalloonTarget = await vehicleLandingTarget(restoredPage, launchedBalloon.id)
  await restoredPage.mouse.click(restoredBalloonTarget.x, restoredBalloonTarget.y)
  const completedRestoredBalloonFlight = await restoredPage.evaluate(
    async ({ vehicleId, driverId, followerId, before }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        { tick } = await import('/app/model.ts'),
        { currentPersonOrder } = await import('/app/person-orders.ts'),
        { terrainPointHeight } = await import('/app/native-terrain.ts'),
        balloon = world.vehicles.find(vehicle => vehicle.id === vehicleId),
        driver = world.units.find(unit => unit.id === driverId),
        follower = world.units.find(unit => unit.id === followerId)
      for (let turn = 0; follower.native?.vehicle && turn < 1_000; turn++) tick(world, 1 / 12)
      for (let turn = 0; turn < 32; turn++) tick(world, 1 / 12)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      return {
        moved: Math.hypot(balloon.x - before[0], balloon.y - before[1]) > 512,
        passengers: [...balloon.passengers],
        driverVehicle: driver.native?.vehicle,
        followerVehicle: follower.native?.vehicle,
        activeOrders: [driver, follower].map(unit =>
          currentPersonOrder(world.buildingOrders, unit.native)?.model ?? 0
        ),
        height: balloon.h,
        terrain: terrainPointHeight(world.land, balloon),
        visible: scene.vehicleMeshes.get(balloon.id)?.visible,
      }
    },
    {
      vehicleId: launchedBalloon.id,
      driverId: launchedBalloon.driver,
      followerId,
      before: occupiedBalloon.balloon.position,
    }
  )
  assert.deepEqual(
    completedRestoredBalloonFlight,
    {
      moved: true,
      passengers: [],
      driverVehicle: 0,
      followerVehicle: 0,
      activeOrders: [0, 0],
      height: completedRestoredBalloonFlight.terrain + 560,
      terrain: completedRestoredBalloonFlight.terrain,
      visible: true,
    },
    JSON.stringify(completedRestoredBalloonFlight)
  )

  const missionThirteenCheckpoint = await restoredPage.evaluate(async () => {
    const world = globalThis.testStore.getWorld(),
      { tick } = await import('/app/model.ts'),
      restored = structuredClone(world),
      control = structuredClone(world)
    for (let turn = 0; turn < 64; turn++) {
      tick(control, 1 / 12)
      tick(world, 1 / 12)
    }
    return { restored, control, continued: structuredClone(world) }
  })
  assert.equal(missionThirteenCheckpoint.restored.outcome.level, 13)
  assert.deepEqual(missionThirteenCheckpoint.continued, missionThirteenCheckpoint.control)
  assert.deepEqual(errors, [])
  await restoredPage.getByLabel('Menu', { exact: true }).click()
  await restoredPage.getByRole('button', { name: 'Restart world' }).click()
  await restoredPage.waitForFunction(() => {
    const store = globalThis.testStore,
      world = store.getWorld()
    return (
      world.outcome.level === 13 && world.turn === 0 && store.getCompletedMissions().includes(12)
    )
  })
  assert.deepEqual(errors, [])
  console.log(
    'PASS: Missions 10-13 continue through rendered openings, Mission 11 autonomous construction, Mission 12 trains, disguises and sabotages with a checkpoint-safe Spy, and Mission 13 builds, renders, boards, reloads, flies and lands a Balloon before restart and profile retention'
  )
} finally {
  await browser.close()
}
