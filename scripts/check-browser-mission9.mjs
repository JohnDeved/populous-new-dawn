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
  await page.getByLabel('Select and focus shaman').click()
  await page.getByLabel('Select warrior').click()
  await page.getByLabel('Select warrior').click()
  await page.getByLabel('Select warrior').click()
  const mission10Party = await page.evaluate(() => {
    const world = globalThis.testScene.world,
      ids = world.units
        .filter(
          unit =>
            world.selected.includes(unit.id) &&
            unit.team === 'blue' &&
            (unit.kind === 'warrior' || unit.kind === 'shaman')
        )
        .map(unit => unit.id)
    if (ids.length !== 4) throw new Error('Mission 10 HUD did not select the Shaman and three Warriors')
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
    // The native failed-route cache lives for 16 turns after the rally command.
    for (let turn = 0; turn < 16; turn++) tick(world, 1 / 12)
  }, { followerIds: mission10Party, target: mission10Gather.native })
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
            !scene.pickUnit(event) &&
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
  const automaticBoarding = await page.evaluate(async ({ boatId, followerIds }) => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      { currentPersonOrder } = await import('/app/person-orders.ts'),
      boat = world.vehicles.find(vehicle => vehicle.id === boatId)
    for (let turn = 0; turn < 4_000; turn++) {
      if (
        followerIds.every(
          id => world.units.find(unit => unit.id === id)?.native?.vehicle === boatId
        )
      ) {
        const before = followerIds.map(id => {
          const person = world.units.find(unit => unit.id === id).native,
            order = currentPersonOrder(world.buildingOrders, person)
          return {
            id,
            order: order && [order.model, order.a, order.b],
            goal: [person.goalX, person.goalY],
            route: person.motionGroup,
            vehicle: person.vehicle,
          }
        })
        await globalThis.testStore.saveCheckpoint()
        if (!globalThis.testStore.loadCheckpoint())
          throw new Error('Automatic Mission 10 Boat crossing checkpoint failed')
        const restored = globalThis.testStore.getWorld()
        return {
          before,
          restored: followerIds.map(id => {
            const person = restored.units.find(unit => unit.id === id).native,
              order = currentPersonOrder(restored.buildingOrders, person)
            return {
              id,
              order: order && [order.model, order.a, order.b],
              goal: [person.goalX, person.goalY],
              route: person.motionGroup,
              vehicle: person.vehicle,
            }
          }),
          passengers: [...boat.passengers],
        }
      }
      tick(world, 1 / 12)
    }
    throw new Error(
      `Mission 10 party did not automatically board: ${JSON.stringify({
        boat,
        selection: world.selected,
        people: followerIds.map(id => {
          const unit = world.units.find(candidate => candidate.id === id),
            person = unit?.native
          return {
            id,
            vehicle: person?.vehicle,
            position: person && [person.x, person.y],
            goal: person && [person.goalX, person.goalY],
            route: person?.motionGroup,
            order: person && currentPersonOrder(world.buildingOrders, person),
          }
        }),
        message: world.message,
      })}`
    )
  }, { boatId: launchedMission10.boatId, followerIds: mission10Party })
  assert.deepEqual(automaticBoarding.restored, automaticBoarding.before)
  assert.deepEqual(automaticBoarding.passengers.toSorted(), mission10Party.toSorted())
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  const landedMission10 = await page.evaluate(async ({ boatId, followerIds, before, target }) => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      { currentPersonOrder } = await import('/app/person-orders.ts'),
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
    const continuation = structuredClone(world)
    let completed = false
    for (let turn = 0; turn < 4_000; turn++) {
      completed = followerIds.every(id => {
        const unit = continuation.units.find(candidate => candidate.id === id),
          person = unit?.native ?? unit?.fight?.motion
        return person && currentPersonOrder(continuation.buildingOrders, person)?.model !== 3 &&
          Math.hypot((person.x - target.x) << 16 >> 16, (person.y - target.y) << 16 >> 16) < 1_200
      })
      if (completed) break
      tick(continuation, 1 / 12)
    }
    return {
      moved,
      completed,
      boarded: boardedIds.size === followerIds.length,
      boardedIds: [...boardedIds],
      passengers: [...boat.passengers],
      people: followerIds.map(id => world.units.find(unit => unit.id === id)?.native?.vehicle),
    }
  }, {
    boatId: launchedMission10.boatId,
    followerIds: mission10Party,
    before: mission10Gather.boat,
    target: mission10Landing.native,
  })
  assert.equal(landedMission10.moved, true, JSON.stringify(landedMission10))
  assert.equal(landedMission10.completed, true, JSON.stringify(landedMission10))
  assert.equal(landedMission10.boarded, true, JSON.stringify(landedMission10))
  assert.deepEqual(landedMission10.boardedIds.toSorted(), mission10Party.toSorted())
  assert.ok(landedMission10.people.every(vehicle => vehicle === 0), JSON.stringify(landedMission10))
  assert.deepEqual(landedMission10.passengers, [])

  await page.keyboard.press('Escape')
  const mission10SelectionDrag = await page.evaluate(async ids => {
    const scene = globalThis.testScene,
      units = ids.map(id => scene.world.units.find(unit => unit.id === id)),
      { nativePosition } = await import('/app/model.ts'),
      { terrainPointHeight } = await import('/app/native-terrain.ts'),
      target = {
        x: units.reduce((sum, unit) => sum + unit.x, 0) / units.length,
        z: units.reduce((sum, unit) => sum + unit.z, 0) / units.length,
      }
    scene.focus(target)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const bounds = scene.container.getBoundingClientRect(),
      point = world => {
        const projected = scene.view.project(
          world,
          terrainPointHeight(scene.world.land, nativePosition(scene.world, world)) / 45
        )
        return { x: bounds.left + projected.screenX, y: bounds.top + projected.screenY }
      },
      x = units.map(unit => unit.x),
      z = units.map(unit => unit.z),
      pickable = unit => {
        const projected = scene.unitScreen(unit.id),
          sprite = scene.unitMeshes.get(unit.id)?.userData.bounds,
          base = {
            x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
            y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
          }
        for (let dy = sprite.top; dy <= sprite.bottom; dy += 2)
          for (let dx = sprite.left; dx <= sprite.right; dx += 2) {
            const click = { x: base.x + dx, y: base.y + dy }
            if (scene.pickUnit({ clientX: click.x, clientY: click.y })?.id === unit.id)
              return click
          }
        return null
      },
      worship = units.filter(unit => unit.kind === 'warrior').map(pickable).filter(Boolean).slice(0, 1)
    if (worship.length !== 1) {
      throw new Error('Transported Mission 10 worshippers are not pickable')
    }
    return {
      from: point({ x: Math.min(...x) - 2, z: Math.min(...z) - 2 }),
      to: point({ x: Math.max(...x) + 2, z: Math.max(...z) + 2 }),
      worship,
    }
  }, mission10Party)
  await page.mouse.move(mission10SelectionDrag.from.x, mission10SelectionDrag.from.y)
  await page.mouse.down()
  await page.mouse.move(mission10SelectionDrag.to.x, mission10SelectionDrag.to.y, { steps: 12 })
  await page.mouse.up()
  assert.deepEqual(
    await page.evaluate(() => globalThis.testScene.world.selected.toSorted()),
    mission10Party.toSorted()
  )
  await page.keyboard.press('Escape')
  await page.mouse.click(mission10SelectionDrag.worship[0].x, mission10SelectionDrag.worship[0].y)
  await page.getByLabel('Select warrior').click()
  await page.getByLabel('Select warrior').click()
  const mission10Worshippers = await page.evaluate(() => globalThis.testScene.world.selected)
  assert.equal(mission10Worshippers.length, 3)
  assert.ok(mission10Worshippers.every(id => mission10Party.includes(id)))
  const totemPoint = await page.evaluate(() => {
    const scene = globalThis.testScene,
      totem = scene.world.shrines.find(shrine => shrine.kind === 'linkedEffects'),
      target = { x: totem.x, z: totem.z }
    scene.focus(target)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const point = scene.screen(totem),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -150; dy <= 15; dy += 3)
      for (let dx = -35; dx <= 35; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          !scene.pickUnit(event) &&
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
    // The transported Warriors worship while the Shaman remains available for the second leg.
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
    },
      control = structuredClone(world)
    await globalThis.testStore.saveCheckpoint()
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Mission 10 Totem checkpoint failed')
    const restored = globalThis.testStore.getWorld(),
      restoredTotem = restored.shrines.find(shrine => shrine.kind === 'linkedEffects'),
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

  await page.keyboard.press('Escape')
  await page.getByLabel('Select warrior').click({ modifiers: ['Control'] })
  let secondLegWarriors = await page.evaluate(ids => {
    const world = globalThis.testScene.world,
      survivors = ids.filter(id => {
        const unit = world.units.find(candidate => candidate.id === id)
        return (
          unit &&
          world.selected.includes(unit.id) &&
          unit.team === 'blue' &&
          unit.kind === 'warrior' &&
          unit.hp > 0
        )
      })
    if (survivors.length < 1)
      throw new Error(`Mission 10 first-Totem party has too few survivors: ${survivors}`)
    return survivors
  }, mission10Party)
  const secondLegBoat = await page.evaluate(boatId => {
    const scene = globalThis.testScene,
      boat = scene.world.vehicles.find(vehicle => vehicle.id === boatId),
      mesh = scene.vehicleMeshes.get(boat.id)
    scene.focus(mesh.position)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    const projected = scene.view.screen(mesh.position, scene.camera),
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
    throw new Error(
      `No exposed Mission 10 Boat geometry for the second crossing: ${JSON.stringify({
        boat,
        mesh: scene.vehicleMeshes.get(boat.id) && {
          visible: scene.vehicleMeshes.get(boat.id).visible,
          position: scene.vehicleMeshes.get(boat.id).position.toArray(),
        },
        selected: scene.world.selected,
        selectedPeople: scene.world.units
          .filter(unit => scene.world.selected.includes(unit.id))
          .map(unit => ({ id: unit.id, hp: unit.hp, position: [unit.x, unit.z] })),
      })}`
    )
  }, launchedMission10.boatId)
  await page.mouse.click(secondLegBoat.x, secondLegBoat.y)
  secondLegWarriors = await page.evaluate(async ({ boatId, followerIds }) => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; turn < 4_000; turn++) {
      const alive = followerIds.filter(id => {
        const unit = world.units.find(candidate => candidate.id === id)
        return unit && unit.hp > 0
      })
      if (
        alive.length &&
        alive.every(id => world.units.find(unit => unit.id === id)?.native?.vehicle === boatId)
      )
        return alive
      tick(world, 1 / 12)
    }
    throw new Error(
      `Mission 10 party did not reboard for the second Totem: ${JSON.stringify({
        passengers: world.vehicles.find(vehicle => vehicle.id === boatId)?.passengers,
        people: followerIds.map(id => ({
          id,
          vehicle: world.units.find(unit => unit.id === id)?.native?.vehicle,
          hp: world.units.find(unit => unit.id === id)?.hp,
        })),
      })}`
    )
  }, { boatId: launchedMission10.boatId, followerIds: secondLegWarriors })

  await page.keyboard.press('h')
  const secondLegShaman = await page.evaluate(() => {
    const world = globalThis.testScene.world,
      shaman = world.units.find(
        unit => world.selected.includes(unit.id) && unit.team === 'blue' && unit.kind === 'shaman'
      )
    if (!shaman || shaman.hp <= 0) throw new Error('Mission 10 Shaman did not survive the first Totem')
    return shaman.id
  })
  await page.mouse.click(secondLegBoat.x, secondLegBoat.y)
  await page.evaluate(async ({ boatId, shamanId }) => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; turn < 4_000; turn++) {
      if (world.units.find(unit => unit.id === shamanId)?.native?.vehicle === boatId) return
      tick(world, 1 / 12)
    }
    throw new Error('Mission 10 Shaman did not board for the second Totem')
  }, { boatId: launchedMission10.boatId, shamanId: secondLegShaman })
  const secondLegParty = [...secondLegWarriors, secondLegShaman]
  await page.keyboard.press('Escape')
  await page.getByLabel('Select warrior').click({ modifiers: ['Control'] })

  const secondTotemLanding = await page.evaluate(async boatId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, findPath, nativePosition } = await import('/app/model.ts'),
      { vehicleCanDisembark } = await import('/app/vehicle-routing.ts'),
      { worshipHeadPose } = await import('/app/live-worship.ts'),
      { worshipApproach } = await import('/app/worship.ts'),
      boat = world.vehicles.find(vehicle => vehicle.id === boatId),
      passenger = world.units.find(unit => unit.id === boat.passengers[0]),
      totem = world.shrines.find(shrine => shrine.name === 'Erosion Totem Pole'),
      destination = nativePosition(world, totem),
      land = { flags: world.land.flags, categories: world.land.categories, cellObjects: () => [] },
      enemies = world.units.filter(
        unit => unit.team === 'green' && unit.hp > 0 && unit.inside === null && !unit.native?.vehicle
      ),
      routeLength = point => {
        const target = browserPosition(point),
          routeWorld = structuredClone(world),
          probe = routeWorld.units.find(unit => unit.id === passenger.id),
          probeTotem = routeWorld.shrines.find(shrine => shrine.id === totem.id)
        Object.assign(probe, { x: target.x, z: target.z })
        Object.assign(probe.native, { x: point.x & 65535, y: point.y & 65535, vehicle: 0 })
        return findPath(
          routeWorld,
          probe,
          browserPosition(worshipApproach(worshipHeadPose(routeWorld, probeTotem)))
        ).length
      },
      candidates = []
    for (let y = -4_096; y <= 4_096; y += 512)
      for (let x = -4_096; x <= 4_096; x += 512) {
        const point = { x: destination.x + x, y: destination.y + y },
          distance = Math.hypot(x, y)
        if (!distance || !vehicleCanDisembark(land, boat, point)) continue
        const target = browserPosition(point),
          route = routeLength(point),
          safety = Math.min(...enemies.map(unit => Math.hypot(unit.x - target.x, unit.z - target.z)))
        if (route) candidates.push({ distance, point, route, safety })
      }
    candidates.sort(
      (a, b) => b.safety - a.safety || a.route - b.route || a.distance - b.distance || a.point.y - b.point.y || a.point.x - b.point.x
    )
    for (const { point } of candidates) {
      const target = browserPosition(point)
      for (const bearing of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        scene.cameraBearing = bearing
        scene.updateView()
        scene.focus(target)
        scene.onChange()
        scene.renderer.render(scene.scene, scene.camera)
        cancelAnimationFrame(scene.frame)
        const projected = scene.screen(target),
          bounds = scene.container.getBoundingClientRect(),
          center = {
            x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
            y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
          },
          seen = new Set(),
          hits = []
        for (let radius = 0; radius <= 100; radius += 3)
          for (let dy = -radius; dy <= radius; dy += 3)
            for (let dx = -radius; dx <= radius; dx += 3) {
              if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue
              const screen = { x: center.x + dx, y: center.y + dy },
                event = { clientX: screen.x, clientY: screen.y },
                picked = scene.pick(event),
                native = picked && nativePosition(world, picked)
              if (
                picked &&
                document.elementFromPoint(screen.x, screen.y) === scene.renderer.domElement &&
                !scene.pickUnit(event) &&
                !scene.pickWorldObject(event) &&
                vehicleCanDisembark(land, boat, native)
              ) {
                const key = `${native.x},${native.y}`
                if (seen.has(key)) continue
                seen.add(key)
                hits.push({
                  screen,
                  native,
                  offset: Math.hypot(picked.x - target.x, picked.z - target.z),
                })
              }
        }
        for (const { screen, native, offset } of hits.sort((a, b) => a.offset - b.offset)) {
          if (offset > 1.5) break
          return { ...screen, native }
        }
      }
    }
    throw new Error('No exposed Mission 10 ground objective near the second Totem')
  }, launchedMission10.boatId)
  await page.mouse.click(secondTotemLanding.x, secondTotemLanding.y)
  await page.evaluate(async ({ boatId, followerIds }) => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      { currentPersonOrder } = await import('/app/person-orders.ts'),
      boat = world.vehicles.find(vehicle => vehicle.id === boatId)
    for (let turn = 0; turn < 12_000; turn++) {
      tick(world, 1 / 12)
      if (
        !boat.passengers.length &&
        followerIds.every(id => world.units.find(unit => unit.id === id)?.native?.vehicle === 0)
      )
        return
    }
    throw new Error(
      `Mission 10 party did not disembark at the second Totem: ${JSON.stringify({
        boat,
        people: followerIds.map(id => {
          const unit = world.units.find(candidate => candidate.id === id),
            person = unit?.native
          return {
            id,
            hp: unit?.hp,
            vehicle: person?.vehicle,
            state: person?.state,
            position: person && [person.x, person.y],
            destination: person && [person.destinationX, person.destinationY],
            goal: person && [person.goalX, person.goalY],
            motionGroup: person?.motionGroup,
            path: unit?.path,
            order: person && currentPersonOrder(world.buildingOrders, person),
          }
        }),
      })}`
    )
  }, { boatId: launchedMission10.boatId, followerIds: secondLegParty })

  await page.keyboard.press('Escape')
  await page.keyboard.press('h')
  await page.getByLabel('Select warrior').click({ modifiers: ['Control'] })
  const assignSecondTotem = async () => {
    const point = await page.evaluate(async () => {
      const scene = globalThis.testScene,
        world = scene.world,
        { liveCommandContext } = await import('/app/live-command.ts'),
        totem = world.shrines.find(shrine => shrine.name === 'Erosion Totem Pole')
      scene.focus(totem)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      cancelAnimationFrame(scene.frame)
      const projected = scene.screen(totem),
        bounds = scene.container.getBoundingClientRect(),
        x = bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y = bounds.top + ((1 - projected.y) * bounds.height) / 2
      for (let dy = -150; dy <= 15; dy += 3)
        for (let dx = -35; dx <= 35; dx += 3) {
          const event = { clientX: x + dx, clientY: y + dy },
            picked = scene.pickWorldObject(event),
            context = picked && liveCommandContext(world, picked)
          if (
            document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
            !scene.pickUnit(event) &&
            picked?.id === totem.id &&
            context?.model === 27 &&
            context.enabled
          )
            return { x: event.clientX, y: event.clientY }
        }
      throw new Error('No exposed Mission 10 second-Totem geometry')
    })
    await page.mouse.click(point.x, point.y)
    await page.evaluate(followerIds => {
      const world = globalThis.testScene.world,
        totem = world.shrines.find(shrine => shrine.name === 'Erosion Totem Pole'),
        assigned = followerIds.filter(id => world.units.find(unit => unit.id === id)?.work === totem.id)
      if (assigned.length < 2)
        throw new Error(
          `Rendered second-Totem command found no route: ${JSON.stringify({
            selected: world.selected,
            assigned,
            message: world.message,
            people: followerIds.map(id => {
              const unit = world.units.find(candidate => candidate.id === id)
              return unit && { id, hp: unit.hp, position: [unit.x, unit.z] }
            }),
          })}`
        )
    }, secondLegParty)
  }
  await assignSecondTotem()

  await page.evaluate(async () => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      totem = world.shrines.find(shrine => shrine.name === 'Erosion Totem Pole')
    for (let turn = 0; totem.progress === 0 && turn < 2_000; turn++) tick(world, 1 / 12)
    if (totem.progress === 0) throw new Error('Second Totem worshippers never reached the head')
  })

  for (let shot = 0; shot < 4; shot++) {
    await page.keyboard.press('h')
    const target = await page.evaluate(async () => {
      const scene = globalThis.testScene,
        world = scene.world,
        { spellInRange } = await import('/app/spell-casting.ts'),
        shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
        totem = world.shrines.find(shrine => shrine.name === 'Erosion Totem Pole'),
        enemy = world.units
          .filter(
            unit =>
              unit.team === 'green' &&
              unit.hp > 0 &&
              Math.hypot(unit.x - totem.x, unit.z - totem.z) < 14 &&
              spellInRange(world, shaman, 2, unit)
          )
          .sort(
            (a, b) =>
              Math.hypot(a.x - shaman.x, a.z - shaman.z) -
              Math.hypot(b.x - shaman.x, b.z - shaman.z)
          )[0]
      return enemy && { id: enemy.id, x: totem.x, z: totem.z }
    })
    if (!target) break
    await page.evaluate(() => {
      const scene = globalThis.testScene
      if (!scene.overviewActive) scene.overview()
      for (let frame = 0; scene.overviewStage && frame < 200; frame++) scene.stepViewChange()
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      cancelAnimationFrame(scene.frame)
    })
    await page.keyboard.press('1')
    const blastPoint = await page.evaluate(target => {
      const scene = globalThis.testScene,
        projected = scene.screen(target),
        bounds = scene.container.getBoundingClientRect(),
        event = {
          clientX: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          clientY: bounds.top + ((1 - projected.y) * bounds.height) / 2,
        },
        picked = scene.pick(event)
      if (!picked || Math.hypot(picked.x - target.x, picked.z - target.z) > 1)
        throw new Error(`Globe did not expose Mission 10 defender ${target.id}`)
      return { x: event.clientX, y: event.clientY }
    }, target)
    await page.mouse.click(blastPoint.x, blastPoint.y)
    if ((await page.evaluate(() => globalThis.testScene.world.mode)) !== null)
      throw new Error(`Mission 10 Blast ${target.id} was rejected`)
    await page.evaluate(async () => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts')
      for (let turn = 0; turn < 512; turn++) {
        tick(world, 1 / 12)
        const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
        if (
          !shaman?.casting &&
          !world.projectiles.some(projectile => projectile.spell === 'blast') &&
          world.castingTribes[0].cooldown === 0
        )
          return
      }
      throw new Error('Mission 10 Blast did not resolve')
    })
  }

  await page.evaluate(async () => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      totem = world.shrines.find(shrine => shrine.name === 'Erosion Totem Pole')
    // The rendered Blast exchange is proven above; isolate checkpoint continuation from surviving combat.
    for (const enemy of world.units.filter(
      unit => unit.team === 'green' && unit.hp > 0 && Math.hypot(unit.x - totem.x, unit.z - totem.z) < 14
    ))
      enemy.hp = 0
    tick(world, 1 / 12)
  })

  await page.evaluate(() => {
    const scene = globalThis.testScene
    if (scene.overviewActive) scene.overview()
    for (let frame = 0; scene.overviewStage && frame < 200; frame++) scene.stepViewChange()
    scene.onChange()
  })
  await page.keyboard.press('Escape')
  await page.keyboard.press('h')
  await page.getByLabel('Select warrior').click({ modifiers: ['Control'] })
  await assignSecondTotem()

  const completedSecondTotem = await page.evaluate(async followerIds => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      totem = world.shrines.find(shrine => shrine.name === 'Erosion Totem Pole'),
      assigned = followerIds.filter(id => world.units.find(unit => unit.id === id)?.work === totem.id)
    if (assigned.length < 2)
      throw new Error(
        `Rendered second-Totem input assigned too few followers: ${JSON.stringify({
          selected: world.selected,
          assigned,
          people: followerIds.map(id => {
            const unit = world.units.find(candidate => candidate.id === id)
            return { id, hp: unit?.hp, work: unit?.work, position: unit && [unit.x, unit.z] }
          }),
        })}`
      )
    for (let turn = 0; totem.progress === 0 && turn < 2_000; turn++) tick(world, 1 / 12)
    if (!totem.active || totem.progress <= 0)
      throw new Error(`Second Totem did not begin live worship: ${JSON.stringify(totem)}`)
    await globalThis.testStore.saveCheckpoint()
    const control = structuredClone(world)
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Second-Totem checkpoint failed')
    const restored = globalThis.testStore.getWorld(),
      restoredTotem = restored.shrines.find(shrine => shrine.name === 'Erosion Totem Pole'),
      snapshot = candidate => {
        const shrine = candidate.shrines.find(entry => entry.name === 'Erosion Totem Pole')
        return {
          turn: candidate.turn,
          randomState: candidate.randomState,
          timer: candidate.campaignTimer,
          inputMask: candidate.inputMask,
          variables: [candidate.ai.variables[6], candidate.ai.variables[9], candidate.ai.variables[18]],
          shrine: {
            active: shrine.active,
            remaining: shrine.remaining,
            uses: shrine.uses,
            work: shrine.work,
            progress: shrine.progress,
          },
          flyby: candidate.flyby,
          effects: candidate.effects.map(effect => ({
            id: effect.id,
            kind: effect.kind,
            age: effect.age,
            erosion: !!effect.erosion,
          })),
          landVersion: candidate.landVersion,
        }
      }
    for (let turn = 0; !restored.ai.variables[6] && turn < 6_000; turn++) {
      tick(control, 1 / 12)
      tick(restored, 1 / 12)
    }
    if (!restored.ai.variables[6] || !control.ai.variables[6])
      throw new Error(
        `Second Totem did not complete after reload: ${JSON.stringify({
          control: snapshot(control),
          restored: snapshot(restored),
        })}`
      )
    return {
      assigned: assigned.length,
      presentationStarted: !!(restored.inputMask & 0x40) && !!(restored.flyby.flags & 1),
      restored: snapshot(restored),
      deterministic: snapshot(control),
      flybyEvents: restored.flyby.events.map(event => [
        event.kind,
        event.value,
        event.start,
        event.duration,
      ]),
    }
  }, secondLegParty)
  assert.ok(completedSecondTotem.assigned >= 2)
  assert.equal(completedSecondTotem.presentationStarted, true)
  assert.deepEqual(completedSecondTotem.restored, completedSecondTotem.deterministic)
  assert.deepEqual(completedSecondTotem.restored.variables, [1, 1, 63])
  assert.equal(completedSecondTotem.restored.timer, null)
  assert.equal(completedSecondTotem.restored.shrine.remaining, 0)
  assert.equal(completedSecondTotem.restored.shrine.uses, 1)
  assert.deepEqual(completedSecondTotem.flybyEvents, [
    [2, 186, 1, 34],
    [1, 49152, 2, 30],
    [1, 50190, 32, 30],
    [2, 1497, 36, 30],
    [1, 57346, 63, 30],
    [2, 1009, 66, 28],
  ])

  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  const finalPresentation = await page.evaluate(presentationStarted => {
    const scene = globalThis.testScene,
      world = scene.world,
      start = scene.previous ?? performance.now()
    cancelAnimationFrame(scene.frame)
    let frames = 0,
      sawFlyby = presentationStarted
    while (world.inputMask & 0x40 && frames < 1_200) {
      sawFlyby ||= !!(world.flyby.flags & 1)
      scene.animate(start + (++frames * 1_000) / 24)
      cancelAnimationFrame(scene.frame)
    }
    return { frames, sawFlyby, inputMask: world.inputMask }
  }, completedSecondTotem.presentationStarted)
  assert.equal(finalPresentation.sawFlyby, true, JSON.stringify(finalPresentation))
  assert.equal(finalPresentation.inputMask & 0x40, 0, JSON.stringify(finalPresentation))

  if (errors.length) throw new Error(`Mission 10 browser errors: ${JSON.stringify(errors)}`)
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByText(/^Objectives · \d \/ 3$/).click()
  await page.getByText('✓ Reach the Totem Pole in the Matak settlement', { exact: true }).waitFor()
  await page.getByLabel('Close menu').click()

  const settlementErosion = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts')
    while (world.ai.variables[18] > 1 && world.turn < 20_000) tick(world, 1 / 12)
    scene.focus({ x: -3, z: 55 })
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    const gl = scene.renderer.getContext(),
      size = gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      beforePixels = new Uint8Array(size),
      afterPixels = new Uint8Array(size)
    scene.animate(scene.previous ?? performance.now())
    cancelAnimationFrame(scene.frame)
    gl.readPixels(
      0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
      gl.RGBA, gl.UNSIGNED_BYTE, beforePixels
    )
    const beforeHeights = Array.from(world.land.heights),
      beforeGreen = world.buildings.filter(building => building.team === 'green').map(b => b.id)
    tick(world, 1 / 12)
    const head = world.shrines.find(
        shrine =>
          shrine.name === 'Erosion stone head' && shrine.uses === 1 && shrine.forced === true
      ),
      delayedEffects = world.effects.filter(effect => effect.erosion).map(effect => [effect.x, effect.z])
    for (let turn = 0; turn < 120; turn++) tick(world, 1 / 12)
    scene.animate(scene.previous ?? performance.now())
    cancelAnimationFrame(scene.frame)
    gl.readPixels(
      0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
      gl.RGBA, gl.UNSIGNED_BYTE, afterPixels
    )
    const afterGreen = world.buildings.filter(building => building.team === 'green').map(b => b.id),
      removed = beforeGreen.filter(id => !afterGreen.includes(id)),
      staleBuildingMeshes = [...scene.buildingMeshes.keys()].filter(
        id => !world.buildings.some(building => building.id === id)
      ),
      changedPixels = beforePixels.reduce(
        (count, value, index) =>
          index % 4 === 0 &&
          (value !== afterPixels[index] ||
            beforePixels[index + 1] !== afterPixels[index + 1] ||
            beforePixels[index + 2] !== afterPixels[index + 2])
            ? count + 1
            : count,
        0
      )
    return {
      countdown: world.ai.variables[18],
      head: head && { uses: head.uses, targets: head.effectTargets?.length },
      delayedEffects,
      changedHeights: world.land.heights.filter(
        (height, index) => height !== beforeHeights[index]
      ).length,
      changedPixels,
      terrainVersions: [scene.terrainVersion, world.landVersion],
      removed,
      removedMeshes: removed.filter(id => !scene.buildingMeshes.has(id)),
      staleBuildingMeshes,
      status: world.status,
    }
  })
  assert.equal(settlementErosion.countdown, 0, JSON.stringify(settlementErosion))
  assert.deepEqual(settlementErosion.head, { uses: 1, targets: 10 })
  assert.equal(settlementErosion.delayedEffects.length, 10, JSON.stringify(settlementErosion))
  assert.ok(settlementErosion.changedHeights > 0, JSON.stringify(settlementErosion))
  assert.ok(settlementErosion.changedPixels > 100, JSON.stringify(settlementErosion))
  assert.equal(settlementErosion.terrainVersions[0], settlementErosion.terrainVersions[1])
  assert.deepEqual(settlementErosion.removedMeshes, settlementErosion.removed)
  assert.deepEqual(settlementErosion.staleBuildingMeshes, [])
  assert.equal(settlementErosion.status, 'playing')

  await page.evaluate(() => globalThis.testStore.startMission(10))
  assert.deepEqual(
    await page.evaluate(() => {
      const world = globalThis.testStore.getWorld(),
        totem = world.shrines.find(shrine => shrine.kind === 'linkedEffects')
      return {
        timer: world.campaignTimer,
        latches: [world.ai.variables[6], world.ai.variables[9], world.ai.variables[18]],
        remaining: totem.remaining,
        nextTotem: world.shrines.some(shrine => shrine.name === 'Erosion Totem Pole'),
      }
    }),
    { timer: null, latches: [0, 0, 0], remaining: 1, nextTotem: false }
  )
  assert.deepEqual(errors, [])
  console.log(
    'PASS: Mission 8 continues through exact Missions 9 and 10; both Mission 10 Totems, Boat crossings, flybys, deadline clear, settlement Erosion, checkpoint and restart paths work'
  )
} finally {
  await browser.close()
}
