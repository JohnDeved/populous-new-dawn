import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser)
  page.setDefaultTimeout(20_000)
  await page.evaluate(() => {
    const store = globalThis.testStore
    store.startMission(8)
    const world = store.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    store.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 9', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 9)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  await page.getByLabel('Focus Chumara tribe').waitFor()

  const opening = await page.evaluate(() => {
    const world = globalThis.testScene.world,
      vault = world.shrines.find(shrine => shrine.kind === 'vault')
    return {
      level: world.outcome.level,
      units: world.units.length,
      vehicles: world.vehicles.length,
      reward: vault?.reward,
      unlocked: world.unlockedBoatHouse,
    }
  })
  assert.deepEqual(opening, {
    level: 9,
    units: 99,
    vehicles: 0,
    reward: 'boatHouse',
    unlocked: false,
  })

  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { entrance } = await import('/app/live-command.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      vault = world.shrines.find(shrine => shrine.kind === 'vault')
    Object.assign(shaman, entrance(world, vault, 2))
    syncLivePersonCells(world)
    world.selected = [shaman.id]
    world.speed = 0
    scene.focus(vault)
    scene.onChange()
  })
  const vaultPoint = await page.evaluate(() => {
    const scene = globalThis.testScene,
      vault = scene.world.shrines.find(shrine => shrine.kind === 'vault'),
      point = scene.screen(vault),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -75; dy <= 0; dy += 3)
      for (let dx = -20; dx <= 20; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.pickWorldObject(event)?.id === vault.id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Mission 9 Vault geometry')
  })
  await page.mouse.click(vaultPoint.x, vaultPoint.y)
  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; !world.unlockedBoatHouse && turn < 2_000; turn++) tick(world, 1 / 12)
    if (!world.unlockedBoatHouse) throw new Error('Mission 9 Vault did not unlock the Boat House')
    world.speed = 0
    scene.onChange()
  })

  await page.getByLabel('Select brave').click({ modifiers: ['Shift'] })
  await page.getByRole('button', { name: 'buildings B', exact: true }).click()
  const boatHouseButton = page.getByRole('button', { name: 'Boat House, 5 wood', exact: true })
  await boatHouseButton.waitFor()
  assert.equal(await boatHouseButton.isEnabled(), true)
  const site = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, buildingPlanPose, placementError } = await import('/app/model.ts'),
      { missionPosition } = await import('/app/mission-data.ts'),
      start = missionPosition(9, 'blue'),
      bounds = scene.container.getBoundingClientRect(),
      candidates = []
    for (let z = start.z - 32; z <= start.z + 32; z += 0.5)
      for (let x = start.x - 32; x <= start.x + 32; x += 0.5)
        if (!placementError(world, 'boatHouse', { x, z })) {
          const plan = buildingPlanPose(world, 'boatHouse', { x, z }),
            point = browserPosition({ x: plan.anchorX, y: plan.anchorY })
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
      if (picked && !placementError(world, 'boatHouse', picked)) return point
    }
    throw new Error('No exposed valid Mission 9 Boat House site')
  })
  await boatHouseButton.click()
  await page.mouse.move(site.x, site.y)
  await page.evaluate(() => globalThis.testScene.updatePointerFrame(performance.now()))
  assert.deepEqual(
    await page.evaluate(() => ({
      visible: globalThis.testScene.cursor.visible,
      invalid: globalThis.testScene.cursor.userData.invalid,
    })),
    { visible: true, invalid: false }
  )
  await page.mouse.click(site.x, site.y)
  const houseId = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      house = world.buildings.find(building => building.kind === 'boatHouse')
    if (!house || house.progress !== 0) throw new Error('Real input did not place the Boat House')
    for (let turn = 0; house.progress < 1 && turn < 24_000; turn++) tick(world, 1 / 12)
    if (house.progress < 1) throw new Error(`Boat House construction timed out: ${house.progress}`)
    for (let turn = 0; world.units.some(unit => unit.work === house.id) && turn < 2_000; turn++)
      tick(world, 1 / 12)
    scene.onChange()
    return house.id
  })

  await page.getByLabel('Select brave').click()
  await page.evaluate(async id => {
    const scene = globalThis.testScene,
      world = scene.world,
      { entrance } = await import('/app/live-command.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      house = world.buildings.find(building => building.id === id),
      brave = world.units.find(unit => world.selected.includes(unit.id) && unit.kind === 'brave')
    Object.assign(brave, entrance(world, house, 2))
    syncLivePersonCells(world)
    scene.focus(house)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
  }, houseId)
  const housePoint = await page.evaluate(id => {
    const scene = globalThis.testScene,
      house = scene.world.buildings.find(building => building.id === id),
      point = scene.screen(house),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -75; dy <= 20; dy += 3)
      for (let dx = -30; dx <= 30; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (scene.pickWorldObject(event)?.id === house.id)
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Boat House geometry')
  }, houseId)
  await page.mouse.click(housePoint.x, housePoint.y)

  const launched = await page.evaluate(async id => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      { vehicleReady } = await import('/app/vehicle-routing.ts'),
      house = world.buildings.find(building => building.id === id)
    for (let turn = 0; !world.vehicles.some(vehicle => vehicle.active) && turn < 2_000; turn++)
      tick(world, 1 / 12)
    const boat = world.vehicles.find(vehicle => vehicle.active),
      driver = boat && world.units.find(unit => unit.id === boat.passengers[0])
    if (!boat || !driver) throw new Error('Boat House did not launch an occupied Boat')
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const group = scene.vehicleMeshes.get(boat.id),
      renderer = scene.renderer,
      gl = renderer.getContext(),
      length = gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      before = new Uint8Array(length),
      after = new Uint8Array(length)
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, before)
    group.visible = false
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, after)
    group.visible = true
    let pixels = 0
    for (let i = 0; i < length; i += 4)
      if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2]) pixels++
    return {
      house: { launched: house.boatLaunched, timer: house.timer },
      boat: { id: boat.id, passengers: boat.passengers, position: [boat.x, boat.y] },
      driver: { id: driver.id, vehicle: driver.native?.vehicle },
      ready: vehicleReady({ flags: world.land.flags, categories: world.land.categories }, boat),
      pixels,
    }
  }, houseId)
  assert.equal(launched.house.launched, true)
  assert.equal(launched.house.timer, 0)
  assert.deepEqual(launched.boat.passengers, [launched.driver.id])
  assert.equal(launched.driver.vehicle, launched.boat.id)
  assert.equal(launched.ready, true, JSON.stringify(launched))
  assert.ok(launched.pixels > 0, `Boat produced no GPU pixels: ${JSON.stringify(launched)}`)

  const boarding = await page.evaluate(async boatId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, setSelection } = await import('/app/model.ts'),
      { changeLivePersonState, createLivePerson } = await import('/app/live-people.ts'),
      { release } = await import('/app/world-tasks.ts'),
      boat = world.vehicles.find(vehicle => vehicle.id === boatId),
      follower = world.units.find(
        unit =>
          unit.team === 'blue' &&
          unit.kind === 'brave' &&
          !unit.inside &&
          !unit.native?.vehicle
      ),
      point = browserPosition(boat)
    release(world, follower)
    follower.native = createLivePerson(world, follower)
    changeLivePersonState(world, follower)
    setSelection(world, [follower.id])
    scene.focus(point)
    scene.onChange()
    cancelAnimationFrame(scene.frame)
    const projected = scene.view.screen(scene.vehicleMeshes.get(boat.id).position, scene.camera),
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
          scene.pickWorldObject({ clientX: click.x, clientY: click.y })?.id === boat.id
        )
          return { followerId: follower.id, click }
      }
    throw new Error('No exposed launched Boat geometry')
  }, launched.boat.id)
  await page.mouse.click(boarding.click.x, boarding.click.y)
  const occupied = await page.evaluate(async ({ boatId, houseId, driverId, followerId }) => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      boat = world.vehicles.find(vehicle => vehicle.id === boatId),
      follower = world.units.find(unit => unit.id === followerId)
    for (let turn = 0; !follower.native?.vehicle && turn < 4_000; turn++) tick(world, 1 / 12)
    if (follower.native?.vehicle !== boat.id)
      throw new Error('Real Boat input did not board follower')
    const expected = {
      level: world.outcome.level,
      house: {
        id: houseId,
        launched: world.buildings.find(building => building.id === houseId)?.boatLaunched,
        timer: world.buildings.find(building => building.id === houseId)?.timer,
      },
      boat: { id: boat.id, passengers: [...boat.passengers], position: [boat.x, boat.y] },
      people: [driverId, followerId].map(id => ({
        id,
        vehicle: world.units.find(unit => unit.id === id)?.native?.vehicle,
      })),
    }
    await globalThis.testStore.saveCheckpoint()
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Occupied Mission 9 Boat checkpoint failed')
    const saved = globalThis.testStore.getWorld(),
      savedHouse = saved.buildings.find(building => building.id === houseId),
      savedBoat = saved.vehicles.find(vehicle => vehicle.id === boatId)
    return {
      expected,
      restored: {
        level: saved.outcome.level,
        house: { id: savedHouse?.id, launched: savedHouse?.boatLaunched, timer: savedHouse?.timer },
        boat: {
          id: savedBoat?.id,
          passengers: savedBoat?.passengers,
          position: [savedBoat?.x, savedBoat?.y],
        },
        people: [driverId, followerId].map(id => ({
          id,
          vehicle: saved.units.find(unit => unit.id === id)?.native?.vehicle,
        })),
      },
    }
  }, {
    boatId: launched.boat.id,
    houseId,
    driverId: launched.driver.id,
    followerId: boarding.followerId,
  })
  assert.deepEqual(occupied.restored, occupied.expected)

  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  const target = await page.evaluate(async boatId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, nativePosition } = await import('/app/model.ts'),
      { vehicleCanDisembark } = await import('/app/vehicle-routing.ts'),
      boat = world.vehicles.find(vehicle => vehicle.id === boatId),
      land = { flags: world.land.flags, categories: world.land.categories, cellObjects: () => [] },
      candidates = []
    for (let y = 0; y < 256; y += 2)
      for (let x = 0; x < 256; x += 2) {
        const point = { x: (x + 1) * 256, y: (y + 1) * 256 },
          distance = Math.hypot((point.x - boat.x) << 16 >> 16, (point.y - boat.y) << 16 >> 16)
        if (distance > 3_000 && distance < 10_000 && vehicleCanDisembark(land, boat, point))
          candidates.push([distance, point])
      }
    for (const [, point] of candidates.sort((a, b) => a[0] - b[0])) {
      const target = browserPosition(point)
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
        picked = scene.pick({ clientX: screen.x, clientY: screen.y })
      if (picked && vehicleCanDisembark(land, boat, nativePosition(world, picked))) return screen
    }
    throw new Error('No exposed Mission 9 Boat landing target')
  }, launched.boat.id)
  await page.mouse.click(target.x, target.y)
  const landed = await page.evaluate(async ({ boatId, driverId, followerId, before }) => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      boat = world.vehicles.find(vehicle => vehicle.id === boatId),
      driver = world.units.find(unit => unit.id === driverId)
    let moved = false
    for (let turn = 0; driver.native?.vehicle && turn < 600; turn++) {
      tick(world, 1 / 12)
      moved ||= boat.x !== before[0] || boat.y !== before[1]
    }
    await globalThis.testStore.saveCheckpoint()
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Landed Mission 9 Boat checkpoint failed')
    const saved = globalThis.testStore.getWorld(),
      savedBoat = saved.vehicles.find(vehicle => vehicle.id === boatId),
      savedDriver = saved.units.find(unit => unit.id === driverId),
      savedFollower = saved.units.find(unit => unit.id === followerId)
    return {
      moved,
      vehicle: savedDriver.native?.vehicle,
      followerVehicle: savedFollower.native?.vehicle,
      passengers: savedBoat.passengers,
      boatId: savedBoat.id,
    }
  }, {
    boatId: launched.boat.id,
    driverId: launched.driver.id,
    followerId: boarding.followerId,
    before: launched.boat.position,
  })
  assert.equal(landed.moved, true, JSON.stringify(landed))
  assert.equal(landed.vehicle, 0, JSON.stringify(landed))
  assert.equal(landed.followerVehicle, 0, JSON.stringify(landed))
  assert.deepEqual(landed.passengers, [], JSON.stringify(landed))
  assert.equal(landed.boatId, launched.boat.id)

  await page.evaluate(() => {
    const store = globalThis.testStore,
      world = store.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    store.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 10', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 10)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))

  const mission10 = await page.evaluate(() => {
    const world = globalThis.testScene.world,
      boat = world.vehicles.find(vehicle => vehicle.model === 1),
      totem = world.shrines.find(shrine => shrine.kind === 'linkedEffects'),
      message = world.messages.slots.find(Boolean)
    return {
      level: world.outcome.level,
      units: world.units.length,
      boat: boat && { team: boat.team, active: boat.active, passengers: boat.passengers.length },
      totem: totem && {
        position: [totem.x, totem.z],
        remaining: totem.remaining,
        required: totem.required,
        target: totem.target,
      },
      message: message?.stringId,
      timer: world.campaignTimer,
    }
  })
  // The live scene can advance ordinary births while Playwright waits for the replacement scene.
  assert.ok(mission10.units >= 46, JSON.stringify(mission10))
  assert.deepEqual({ ...mission10, units: 46 }, {
    level: 10,
    units: 46,
    boat: { team: 'blue', active: true, passengers: 0 },
    totem: { position: [29, -67], remaining: 1, required: 2, target: 64 },
    message: 679,
    timer: null,
  })

  await page.keyboard.press('Escape')
  await page.getByLabel('Select brave').click()
  const mission10BoatHouse = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      house = world.buildings.find(
        building =>
          building.kind === 'boatHouse' &&
          Math.hypot(building.x - 31, building.z + 15) < 2
      )
    if (!house || house.progress < 1) throw new Error('Authored Mission 10 Boat House is unavailable')
    world.speed = 0
    scene.focus(house)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    cancelAnimationFrame(scene.frame)
    const projected = scene.screen(house),
      bounds = scene.container.getBoundingClientRect(),
      center = {
        x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
      }
    scene.picking.lastKey = ''
    for (let dy = -100; dy <= 30; dy += 3)
      for (let dx = -40; dx <= 40; dx += 3) {
        const click = { x: center.x + dx, y: center.y + dy },
          event = { clientX: click.x, clientY: click.y }
        if (
          document.elementFromPoint(click.x, click.y) === scene.renderer.domElement &&
          scene.pickWorldObject(event)?.id === house.id
        )
          return { houseId: house.id, click }
      }
    throw new Error('No exposed authored Mission 10 Boat House geometry')
  })
  await page.mouse.click(mission10BoatHouse.click.x, mission10BoatHouse.click.y)

  const launchedMission10 = await page.evaluate(async houseId => {
    const scene = globalThis.testScene,
      world = scene.world
    const { tick } = await import('/app/model.ts'),
      house = world.buildings.find(building => building.id === houseId),
      originalBoatIds = new Set(world.vehicles.map(vehicle => vehicle.id))
    for (
      let turn = 0;
      !world.vehicles.some(vehicle => vehicle.active && !originalBoatIds.has(vehicle.id)) &&
      turn < 4_000;
      turn++
    )
      tick(world, 1 / 12)
    const boat = world.vehicles.find(vehicle => vehicle.active && !originalBoatIds.has(vehicle.id)),
      driver = boat && world.units.find(unit => unit.id === boat.passengers[0])
    if (!boat || !driver)
      throw new Error(
        `Mission 10 Boat House did not launch: ${JSON.stringify({
          timer: house?.timer,
          launched: house?.boatLaunched,
          inside: world.units.filter(unit => unit.inside === houseId).map(unit => unit.id),
        })}`
      )
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return { boatId: boat.id, driverId: driver.id, position: [boat.x, boat.y] }
  }, mission10BoatHouse.houseId)

  const mission10BaseLanding = await page.evaluate(async boatId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, nativePosition } = await import('/app/model.ts'),
      { vehicleCanDisembark } = await import('/app/vehicle-routing.ts'),
      boat = world.vehicles.find(vehicle => vehicle.id === boatId),
      land = { flags: world.land.flags, categories: world.land.categories, cellObjects: () => [] },
      candidates = []
    for (let y = -2_048; y <= 2_048; y += 512)
      for (let x = -2_048; x <= 2_048; x += 512) {
        const point = { x: boat.x + x, y: boat.y + y },
          distance = Math.hypot(x, y)
        if (distance && vehicleCanDisembark(land, boat, point)) candidates.push([distance, point])
      }
    for (const [, point] of candidates.sort((a, b) => a[0] - b[0])) {
      const target = browserPosition(point)
      scene.focus(target)
      for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
        scene.updateCameraMotion(1 / 24)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      const projected = scene.screen(target),
        bounds = scene.container.getBoundingClientRect(),
        center = {
          x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
        }
      for (let dy = -100; dy <= 100; dy += 3)
        for (let dx = -100; dx <= 100; dx += 3) {
          const screen = { x: center.x + dx, y: center.y + dy },
            event = { clientX: screen.x, clientY: screen.y },
            picked = scene.pick(event)
          if (
            picked &&
            !scene.pickWorldObject(event) &&
            vehicleCanDisembark(land, boat, nativePosition(world, picked))
          )
            return screen
        }
    }
    throw new Error('No exposed Mission 10 base shore for the launched Boat')
  }, launchedMission10.boatId)
  await page.mouse.click(mission10BaseLanding.x, mission10BaseLanding.y)
  await page.evaluate(async ({ boatId, driverId }) => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      driver = world.units.find(unit => unit.id === driverId)
    for (let turn = 0; driver.native?.vehicle && turn < 2_000; turn++) tick(world, 1 / 12)
    if (driver.native?.vehicle) throw new Error('Mission 10 launch driver did not disembark at base')
  }, { boatId: launchedMission10.boatId, driverId: launchedMission10.driverId })

  await page.keyboard.press('Escape')
  await page.getByLabel('Select warrior').click({ modifiers: ['Control'] })
  const mission10Party = await page.evaluate(() => {
    const world = globalThis.testScene.world,
      ids = world.units
        .filter(unit => world.selected.includes(unit.id) && unit.team === 'blue' && unit.kind === 'warrior')
        .map(unit => unit.id)
    if (ids.length < 2) throw new Error('Mission 10 HUD did not select the Warrior landing party')
    return ids
  })

  const mission10Gather = await page.evaluate(async boatId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, nativePosition, supportsFollower } = await import('/app/model.ts'),
      rules = (await import('/app/original-rules.json', { with: { type: 'json' } })).default,
      boat = world.vehicles.find(vehicle => vehicle.id === boatId),
      candidates = []
    for (let y = 0; y < 256; y += 2)
      for (let x = 0; x < 256; x += 2) {
        const point = { x: (x + 1) * 256, y: (y + 1) * 256 },
          index = (y >> 1) * 128 + (x >> 1),
          distance = Math.hypot(
            (point.x - boat.x) << 16 >> 16,
            (point.y - boat.y) << 16 >> 16
          )
        if (
          distance < 2_000 &&
          !(world.land.flags[index] & 0x600) &&
          !(rules.terrainCategoryFlags[world.land.categories[index] & 15] & 60)
        )
          candidates.push([distance, point])
      }
    for (const [, point] of candidates.sort((a, b) => a[0] - b[0])) {
      const target = browserPosition(point)
      scene.focus(target)
      for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
        scene.updateCameraMotion(1 / 24)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      const projected = scene.screen(target),
        bounds = scene.container.getBoundingClientRect(),
        center = {
          x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
        }
      for (let radius = 0; radius <= 75; radius += 3)
        for (let dy = -radius; dy <= radius; dy += 3)
          for (let dx = -radius; dx <= radius; dx += 3) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue
            const screen = { x: center.x + dx, y: center.y + dy },
              event = { clientX: screen.x, clientY: screen.y },
              picked = scene.pick(event),
              native = picked && nativePosition(world, picked),
              index = native && ((native.y & 65535) >> 9) * 128 + ((native.x & 65535) >> 9)
            if (
              picked &&
              !scene.pickWorldObject(event) &&
              supportsFollower(world, picked) &&
              !(world.land.flags[index] & 0x600) &&
              !(rules.terrainCategoryFlags[world.land.categories[index] & 15] & 60) &&
              Math.hypot(
                (native.x - boat.x) << 16 >> 16,
                (native.y - boat.y) << 16 >> 16
              ) < 2_000
            )
              return { ...screen, native, boat: [boat.x, boat.y] }
          }
    }
    throw new Error('No exposed Mission 10 rally ground beside the launched Boat')
  }, launchedMission10.boatId)
  await page.mouse.click(mission10Gather.x, mission10Gather.y)
  await page.evaluate(async ({ followerIds, target }) => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts')
    let gathered = false
    for (let turn = 0; !gathered && turn < 4_000; turn++) {
      tick(world, 1 / 12)
      gathered = followerIds.every(id => {
        const person = world.units.find(unit => unit.id === id)?.native
        return (
          person &&
          Math.hypot(
            (person.x - target.x) << 16 >> 16,
            (person.y - target.y) << 16 >> 16
          ) < 1_200
        )
      })
    }
    if (!gathered) throw new Error('Mission 10 landing party did not rally beside the Boat')
  }, { followerIds: mission10Party, target: mission10Gather.native })
  await page.getByLabel('Select warrior').click({ modifiers: ['Control'] })

  const mission10Boat = await page.evaluate(boatId => {
    const scene = globalThis.testScene,
      boat = scene.world.vehicles.find(vehicle => vehicle.id === boatId)
    scene.focus(boat)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.view.screen(scene.vehicleMeshes.get(boat.id).position, scene.camera),
      bounds = scene.container.getBoundingClientRect(),
      center = {
        x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
      }
    for (let radius = 0; radius <= 90; radius += 3)
      for (let dy = -radius; dy <= radius; dy += 3)
        for (let dx = -radius; dx <= radius; dx += 3) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue
          const click = { x: center.x + dx, y: center.y + dy },
            event = { clientX: click.x, clientY: click.y }
          if (
            document.elementFromPoint(click.x, click.y) === scene.renderer.domElement &&
            !scene.pickUnit(event) &&
            scene.pickWorldObject(event)?.id === boat.id
          )
            return click
        }
    throw new Error('No exposed Mission 10 Boat geometry for the gathered party')
  }, launchedMission10.boatId)
  await page.mouse.click(mission10Boat.x, mission10Boat.y)
  await page.evaluate(async ({ boatId, followerIds }) => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      { currentPersonOrder } = await import('/app/person-orders.ts')
    let boarded = false
    for (let turn = 0; !boarded && turn < 4_000; turn++) {
      tick(world, 1 / 12)
      boarded = followerIds.every(
        id => world.units.find(unit => unit.id === id)?.native?.vehicle === boatId
      )
    }
    if (!boarded)
      throw new Error(
        `Mission 10 landing party did not board the rendered Boat: ${JSON.stringify({
          boat: world.vehicles.find(vehicle => vehicle.id === boatId),
          selection: world.selected,
          people: followerIds.map(id => {
            const unit = world.units.find(candidate => candidate.id === id)
            return {
              id,
              vehicle: unit?.native?.vehicle,
              position: unit && [unit.x, unit.z],
              state: unit?.native?.state,
              order: unit?.native && currentPersonOrder(world.buildingOrders, unit.native),
            }
          }),
          message: world.message,
        })}`
      )
  }, { boatId: launchedMission10.boatId, followerIds: mission10Party })

  const mission10Landing = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { nativePosition, supportsFollower } = await import('/app/model.ts'),
      rules = (await import('/app/original-rules.json', { with: { type: 'json' } })).default,
      totem = world.shrines.find(shrine => shrine.kind === 'linkedEffects'),
      target = { x: totem.x + 8, z: totem.z },
      destination = nativePosition(world, totem)
    scene.focus(target)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.screen(target),
      bounds = scene.container.getBoundingClientRect(),
      center = {
        x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
      }
    for (let radius = 0; radius <= 120; radius += 3)
      for (let dy = -radius; dy <= radius; dy += 3)
        for (let dx = -radius; dx <= radius; dx += 3) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue
          const screen = { x: center.x + dx, y: center.y + dy },
            event = { clientX: screen.x, clientY: screen.y },
            picked = scene.pick(event),
            native = picked && nativePosition(world, picked),
            index = native && ((native.y & 65535) >> 9) * 128 + ((native.x & 65535) >> 9),
            distance =
              native &&
              Math.hypot(
                (native.x - destination.x) << 16 >> 16,
                (native.y - destination.y) << 16 >> 16
              )
          if (
            picked &&
            !scene.pickWorldObject(event) &&
            distance < 5_000 &&
            supportsFollower(world, picked) &&
            !(world.land.flags[index] & 0x600) &&
            !(rules.terrainCategoryFlags[world.land.categories[index] & 15] & 60)
          )
            return { ...screen, native }
        }
    throw new Error('No exposed Mission 10 ground objective near the first Totem')
  })
  await page.mouse.click(mission10Landing.x, mission10Landing.y)
  const landedMission10 = await page.evaluate(async ({ boatId, followerIds, before }) => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      boat = world.vehicles.find(vehicle => vehicle.id === boatId)
    let moved = false
    const boardedIds = new Set(
      followerIds.filter(id => world.units.find(unit => unit.id === id)?.native?.vehicle === boat.id)
    )
    for (let turn = 0; turn < 12_000; turn++) {
      tick(world, 1 / 12)
      moved ||= boat.x !== before[0] || boat.y !== before[1]
      for (const id of followerIds)
        if (world.units.find(unit => unit.id === id)?.native?.vehicle === boat.id) boardedIds.add(id)
      if (boardedIds.size === followerIds.length && !boat.passengers.length) break
    }
    return {
      moved,
      boarded: boardedIds.size === followerIds.length,
      boardedIds: [...boardedIds],
      passengers: [...boat.passengers],
      people: followerIds.map(id => world.units.find(unit => unit.id === id)?.native?.vehicle),
    }
  }, {
    boatId: launchedMission10.boatId,
    followerIds: mission10Party,
    before: mission10Gather.boat,
  })
  assert.equal(landedMission10.moved, true, JSON.stringify(landedMission10))
  assert.equal(landedMission10.boarded, true, JSON.stringify(landedMission10))
  assert.deepEqual(landedMission10.boardedIds, mission10Party)
  assert.ok(landedMission10.people.every(vehicle => vehicle === 0), JSON.stringify(landedMission10))
  assert.deepEqual(landedMission10.passengers, [])

  await page.getByLabel('Select warrior').click({ modifiers: ['Control'] })
  const totemPoint = await page.evaluate(() => {
    const scene = globalThis.testScene,
      totem = scene.world.shrines.find(shrine => shrine.kind === 'linkedEffects'),
      point = scene.screen(totem),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -150; dy <= 15; dy += 3)
      for (let dx = -35; dx <= 35; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.pickWorldObject(event)?.id === totem.id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Mission 10 Totem geometry')
  })
  await page.mouse.click(totemPoint.x, totemPoint.y)

  const completedTotem = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      totem = world.shrines.find(shrine => shrine.kind === 'linkedEffects'),
      selected = world.units.filter(unit => world.selected.includes(unit.id)),
      assigned = selected.filter(unit => unit.work === totem.id)
    if (assigned.length < 2)
      throw new Error(
        `Real Mission 10 Totem input did not assign the transported landing party: ${JSON.stringify({
          selection: world.selected,
          selected: selected.map(unit => ({
            id: unit.id,
            kind: unit.kind,
            hp: unit.hp,
            work: unit.work,
            position: [unit.x, unit.z],
            state: unit.native?.state,
          })),
          message: world.message,
        })}`
      )
    // Two worshippers meet the native preferred count while the rest defend the landing.
    let peakProgress = 0,
      peakFollowers = 0,
      lostAt = null
    for (let turn = 0; totem.active && turn < 6_000; turn++) {
      tick(world, 1 / 12)
      peakProgress = Math.max(peakProgress, totem.progress)
      peakFollowers = Math.max(peakFollowers, totem.followers)
      if (lostAt === null && assigned[0].work !== totem.id) lostAt = turn
    }
    for (let turn = 0; !world.ai.variables[9] && turn < 32; turn++) tick(world, 1 / 12)
    if (totem.active || !world.ai.variables[9])
      throw new Error(
        `Mission 10 Totem did not complete: ${JSON.stringify({
          turn: world.turn,
          active: totem.active,
          work: totem.work,
          progress: totem.progress,
          peakProgress,
          peakFollowers,
          lostAt,
          followers: totem.followers,
          selected: selected.map(unit => ({
            id: unit.id,
            hp: unit.hp,
            work: unit.work,
            x: unit.x,
            z: unit.z,
            state: unit.native?.state,
            substate: unit.native?.substate,
            flags2: unit.native?.flags2,
          })),
        })}`
      )
    const expected = {
      remaining: totem.remaining,
      uses: totem.uses,
      timer: world.campaignTimer,
      latches: [world.ai.variables[7], world.ai.variables[9]],
      inputMask: world.inputMask,
      earthquakes: world.effects.filter(effect => effect.earthquake).length,
      nextTotem: world.shrines.some(shrine => shrine.name === 'Erosion Totem Pole'),
      flybyEvents: world.flyby.events.length,
    }
    await globalThis.testStore.saveCheckpoint()
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Mission 10 Totem checkpoint failed')
    const restored = globalThis.testStore.getWorld(),
      restoredTotem = restored.shrines.find(shrine => shrine.kind === 'linkedEffects'),
      control = structuredClone(world),
      restoredAtLoad = {
        remaining: restoredTotem.remaining,
        uses: restoredTotem.uses,
        timer: restored.campaignTimer,
        latches: [restored.ai.variables[7], restored.ai.variables[9]],
        inputMask: restored.inputMask,
        earthquakes: restored.effects.filter(effect => effect.earthquake).length,
        nextTotem: restored.shrines.some(shrine => shrine.name === 'Erosion Totem Pole'),
        flybyEvents: restored.flyby.events.length,
      },
      snapshot = candidate => ({
        turn: candidate.turn,
        status: candidate.status,
        randomState: candidate.randomState,
        timer: candidate.campaignTimer,
        inputMask: candidate.inputMask,
        latches: [candidate.ai.variables[7], candidate.ai.variables[9]],
        flyby: candidate.flyby,
        effects: candidate.effects.map(effect => ({
          id: effect.id,
          kind: effect.kind,
          age: effect.age,
          duration: effect.duration,
          earthquake: effect.earthquake,
        })),
        shrines: candidate.shrines.map(shrine => ({
          id: shrine.id,
          active: shrine.active,
          remaining: shrine.remaining,
          uses: shrine.uses,
          progress: shrine.progress,
          name: shrine.name,
        })),
      })
    for (let turn = 0; turn < 48; turn++) {
      tick(control, 1 / 12)
      tick(restored, 1 / 12)
    }
    return {
      expected,
      restored: restoredAtLoad,
      advancedControl: snapshot(control),
      advancedRestored: snapshot(restored),
    }
  })
  assert.equal(completedTotem.expected.remaining, 0)
  assert.equal(completedTotem.expected.uses, 1)
  assert.ok(completedTotem.expected.timer > 0 && completedTotem.expected.timer <= 5760)
  assert.deepEqual(completedTotem.expected.latches, [1, 1])
  assert.equal(completedTotem.expected.inputMask & 0x40, 0x40)
  assert.equal(completedTotem.expected.earthquakes, 2)
  assert.equal(completedTotem.expected.nextTotem, true)
  assert.equal(completedTotem.expected.flybyEvents, 10)
  assert.deepEqual(completedTotem.restored, completedTotem.expected)
  assert.deepEqual(completedTotem.advancedRestored, completedTotem.advancedControl)

  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  const renderedTransition = await page.evaluate(() => {
    const scene = globalThis.testScene,
      world = scene.world,
      start = scene.previous ?? performance.now()
    cancelAnimationFrame(scene.frame)
    let frames = 0,
      sawFlyby = false
    while (world.inputMask & 0x40 && frames < 1_200) {
      sawFlyby ||= !!(world.flyby.flags & 1)
      scene.animate(start + (++frames * 1_000) / 24)
      cancelAnimationFrame(scene.frame)
    }
    const linkedTotem = world.shrines.find(shrine => shrine.name === 'Erosion Totem Pole'),
      mesh = linkedTotem && scene.shrineMeshes.get(linkedTotem.id)
    if (!linkedTotem || !mesh) return { frames, sawFlyby, inputMask: world.inputMask, picked: false }
    scene.focus(linkedTotem)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const point = scene.screen(linkedTotem),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -150; dy <= 15; dy += 3)
      for (let dx = -35; dx <= 35; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.pickWorldObject(event)?.id === linkedTotem.id
        )
          return { frames, sawFlyby, inputMask: world.inputMask, picked: true }
      }
    return { frames, sawFlyby, inputMask: world.inputMask, picked: false }
  })
  assert.equal(renderedTransition.sawFlyby, true, JSON.stringify(renderedTransition))
  assert.equal(renderedTransition.inputMask & 0x40, 0, JSON.stringify(renderedTransition))
  assert.equal(renderedTransition.picked, true, JSON.stringify(renderedTransition))

  await page.evaluate(() => globalThis.testStore.startMission(10))
  assert.deepEqual(
    await page.evaluate(() => {
      const world = globalThis.testStore.getWorld(),
        totem = world.shrines.find(shrine => shrine.kind === 'linkedEffects')
      return {
        timer: world.campaignTimer,
        latch: world.ai.variables[9],
        remaining: totem.remaining,
        nextTotem: world.shrines.some(shrine => shrine.name === 'Erosion Totem Pole'),
      }
    }),
    { timer: null, latch: 0, remaining: 1, nextTotem: false }
  )
  assert.deepEqual(errors, [])
  console.log(
    'PASS: Mission 8 continues through exact Missions 9 and 10; Boat House play and the Mission 10 Boat, Totem, flyby, deadline, checkpoint and restart paths work'
  )
} finally {
  await browser.close()
}
