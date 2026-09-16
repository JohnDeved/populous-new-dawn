import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    errors = []
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Mission 10', exact: true }).click()
  await bindGame(page)
  page.setDefaultTimeout(20_000)
  const setup = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick, browserPosition } = await import('/app/model.ts'),
      { nativePosition, supportsFollower } = await import('/app/world-terrain-runtime.ts'),
      { createLivePerson } = await import('/app/live-people.ts'),
      boat = world.vehicles.find(vehicle => vehicle.model === 1 && vehicle.active),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    if (!boat || !shaman || boat.passengerCount) throw new Error('Mission 10 destruction setup failed')
    for (let turn = 0; boat.life > 1_000 && turn < 5_000; turn++) tick(world, 1 / 12)
    if (!boat.active || boat.life > 1_000) throw new Error(`Boat did not age naturally: ${boat.life}`)
    const point = browserPosition(boat)
    let shore
    for (let radius = 0.5; !shore && radius <= 12; radius += 0.5)
      for (let dz = -radius; !shore && dz <= radius; dz += 0.5)
        for (let dx = -radius; !shore && dx <= radius; dx += 0.5) {
          const candidate = { x: point.x + dx, z: point.z + dz }
          if (supportsFollower(world, candidate)) shore = candidate
        }
    if (!shore) throw new Error('No supported Mission 10 shore near the Boat')
    Object.assign(shaman, shore, { hp: 100, path: [], casting: null, flight: undefined, lift: 0 })
    shaman.native = createLivePerson(world, shaman)
    Object.assign(shaman.native, nativePosition(world, shore))
    world.pathfinding.people.set(shaman.id, shaman.native)
    boat.team = 'green'
    world.selected = [shaman.id]
    world.shots.blast = 1
    world.castingTribes[0].cooldown = 0
    world.inputMask = 0
    world.speed = 0
    scene.focus(point)
    scene.startGroundView(2)
    scene.onChange()
    return { id: boat.id, life: boat.life, point }
  })
  await page.waitForFunction(
    () => !globalThis.testScene.cameraMotion.active && !globalThis.testScene.viewTransition
  )

  await page.keyboard.press('1')
  const target = await page.evaluate(point => {
    const scene = globalThis.testScene,
      projected = scene.screen(point),
      bounds = scene.container.getBoundingClientRect()
    return {
      x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
      y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
    }
  }, setup.point)
  await page.mouse.click(target.x, target.y)
  assert.equal(
    await page.evaluate(() => globalThis.testScene.world.projectiles.some(p => p.spell === 'blast')),
    true,
    'rendered input launches Blast'
  )
  const castTarget = await page.evaluate(() =>
    globalThis.testScene.world.projectiles.find(projectile => projectile.spell === 'blast')?.target
  )
  assert.ok(
    Math.hypot(castTarget.x - setup.point.x, castTarget.z - setup.point.z) < 3,
    `rendered Blast target missed the Boat: ${JSON.stringify({ castTarget, boat: setup.point })}`
  )

  const destroyed = await page.evaluate(async vehicleId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      boat = world.vehicles.find(vehicle => vehicle.id === vehicleId)
    let previous = boat.life,
      blastDamage = false,
      waveSeen = false,
      maxDrop = 0
    world.speed = 1
    for (let turn = 0; boat.active && turn < 1_200; turn++) {
      tick(world, 1 / 12)
      waveSeen ||= world.effects.some(effect => effect.wave)
      maxDrop = Math.max(maxDrop, previous - boat.life)
      blastDamage ||= maxDrop > 1
      previous = boat.life
    }
    world.speed = 0
    scene.onChange()
    scene.animate(scene.previous ?? performance.now())
    cancelAnimationFrame(scene.frame)
    const mesh = scene.vehicleMeshes.get(vehicleId)
    if (!(await globalThis.testStore.saveCheckpoint()))
      throw new Error('Destroyed Mission 10 Boat checkpoint save failed')
    return {
      blastDamage,
      active: boat.active,
      state: boat.destructionState,
      passengers: [...boat.passengers],
      meshVisible: mesh?.visible,
      waveSeen,
      maxDrop,
      team: boat.team,
      levelFlags2: world.levelFlags2,
    }
  }, setup.id)
  assert.equal(destroyed.blastDamage, true, `Blast did not damage the Boat: ${JSON.stringify(destroyed)}`)
  assert.deepEqual({
    active: destroyed.active,
    state: destroyed.state,
    passengers: destroyed.passengers,
    meshVisible: destroyed.meshVisible,
  }, {
    active: false,
    state: 5,
    passengers: [],
    meshVisible: true,
  })

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
  const lifecycle = await restoredPage.evaluate(async vehicleId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      boat = world.vehicles.find(vehicle => vehicle.id === vehicleId)
    const restored = [boat.active, boat.destructionState === 5]
    scene.onChange()
    scene.animate(scene.previous ?? performance.now())
    cancelAnimationFrame(scene.frame)
    const before = scene.vehicleMeshes.get(vehicleId)?.position.y
    for (let turn = 0; turn < 4; turn++) tick(world, 1 / 12)
    scene.onChange()
    scene.animate(scene.previous ?? performance.now())
    cancelAnimationFrame(scene.frame)
    const after = scene.vehicleMeshes.get(vehicleId)?.position.y
    for (let turn = 0; boat.destructionState && turn < 200; turn++) tick(world, 1 / 12)
    scene.onChange()
    scene.animate(scene.previous ?? performance.now())
    cancelAnimationFrame(scene.frame)
    return {
      restored,
      sank: after < before,
      removed: !scene.vehicleMeshes.has(vehicleId),
    }
  }, setup.id)
  assert.deepEqual(lifecycle, { restored: [false, true], sank: true, removed: true })
  assert.deepEqual(errors, [])
  console.log(
    'PASS: rendered Mission 10 Blast damages a naturally aged enemy Boat; destruction survives fresh-page reload, visibly sinks, and removes its mesh'
  )
} finally {
  await browser.close()
}
