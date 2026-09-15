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
  assert.deepEqual(errors, [])
  console.log(
    'PASS: Mission 8 continues to exact Mission 9; Vault, shore construction, native Boat House production, visible Boat, boarding, sailing, disembark and checkpoint paths work'
  )
} finally {
  await browser.close()
}
