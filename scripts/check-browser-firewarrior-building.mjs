import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame, effectPixels } from './browser-game.mjs'

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
  await page.waitForFunction(() => globalThis.testScene.world.outcome.level === 10)
  page.setDefaultTimeout(15_000)
  await page.getByLabel('Select brave').click()
  const school = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { buildingDoor } = await import('/app/live-command.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      building = world.buildings.find(b => b.team === 'blue' && b.kind === 'firewarriorHut'),
      brave = world.units.find(u => world.selected.includes(u.id) && u.kind === 'brave')
    if (!building || !brave) throw new Error('Mission 10 training path is unavailable')
    Object.assign(brave, buildingDoor(building))
    syncLivePersonCells(world)
    world.speed = 0
    scene.focus(building)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    return building.id
  })
  const objectPoint = async id =>
    page.evaluate(id => {
      const scene = globalThis.testScene,
        object = scene.world.buildings.find(candidate => candidate.id === id),
        projected = scene.screen(object),
        bounds = scene.container.getBoundingClientRect(),
        x = bounds.left + ((projected.x + 1) * bounds.width) / 2,
        y = bounds.top + ((1 - projected.y) * bounds.height) / 2
      for (let dy = -90; dy <= 30; dy += 3)
        for (let dx = -45; dx <= 45; dx += 3) {
          const event = { clientX: x + dx, clientY: y + dy }
          if (
            document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
            scene.pickWorldObject(event)?.id === object.id
          )
            return { x: event.clientX, y: event.clientY }
        }
      throw new Error(`No exposed building geometry for ${id}`)
    }, id)
  await page.mouse.click(...Object.values(await objectPoint(school)))
  assert.equal(await page.evaluate(id => {
    const world = globalThis.testScene.world,
      building = world.buildings.find(candidate => candidate.id === id),
      brave = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave')
    return brave?.work === id || brave?.inside === id || building?.admission?.occupants.includes(brave?.id)
  }, school), true, 'rendered building input must issue the training command')
  const firewarrior = await page.evaluate(async schoolId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      building = world.buildings.find(candidate => candidate.id === schoolId)
    for (
      let turn = 0;
      !world.units.some(unit => unit.team === 'blue' && unit.kind === 'firewarrior') && turn < 2_000;
      turn++
    ) {
      building.timer = 65535
      tick(world, 1 / 12)
    }
    const trained = world.units.find(unit => unit.team === 'blue' && unit.kind === 'firewarrior')
    if (!trained) throw new Error('Mission 10 Firewarrior training timed out')
    scene.onChange()
    return trained.id
  }, school)
  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      { setSelection } = await import('/app/model.ts')
    setSelection(scene.world, [])
    scene.onChange()
  })
  await page.getByLabel('Select firewarrior').click()
  const target = await page.evaluate(async sourceId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      source = world.units.find(unit => unit.id === sourceId),
      hostiles = world.buildings.filter(candidate => candidate.team === 'green' && candidate.progress === 1),
      nearest = building => Math.min(...hostiles.filter(other => other !== building).map(
        other => Math.hypot(building.x - other.x, building.z - other.z)
      )),
      building = hostiles.toSorted((a, b) => nearest(b) - nearest(a))[0]
    if (!source || !building || !world.selected.includes(source.id))
      throw new Error('Shipped Firewarrior selection or authored target is unavailable')
    for (const unit of world.units)
      if (unit.team !== 'blue')
        Object.assign(unit, { inside: building.id, target: null, path: [] })
    Object.assign(source, {
      x: building.x + 2,
      z: building.z,
      target: null,
      work: null,
      inside: null,
      path: [],
      cooldown: 0,
    })
    syncLivePersonCells(world)
    scene.focus(building)
    for (let frame = 0; scene.cameraMotion.active && frame < 64; frame++)
      scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    return { id: building.id, source: source.id }
  }, firewarrior)
  await page.mouse.click(...Object.values(await objectPoint(target.id)))
  const launched = await page.evaluate(async ({ id, source }) => {
    const world = globalThis.testScene.world,
      { currentPersonOrder } = await import('/app/person-orders.ts'),
      { tick } = await import('/app/model.ts'),
      shooter = world.units.find(unit => unit.id === source)
    for (
      let turn = 0;
      !world.effects.some(effect => effect.firewarriorShot?.source === source) && turn < 8;
      turn++
    )
      tick(world, 1 / 12)
    const shots = world.effects.filter(effect => effect.firewarriorShot?.source === source)
    return {
      order: currentPersonOrder(world.buildingOrders, shooter.native)?.model,
      ids: shots.map(shot => shot.id),
      targets: shots.map(shot => shot.firewarriorShot.target),
      impacts: shots.map(shot => !!shot.firewarriorShot.impact),
      cooldown: shooter.cooldown,
      target: id,
    }
  }, target)
  assert.equal(launched.order, 19)
  assert.equal(launched.ids.length, 2)
  assert.ok(launched.targets.every(id => id === launched.target))
  assert.deepEqual(launched.impacts, [false, true])
  assert.equal(launched.cooldown, 25 / 12)
  await page.waitForFunction(ids => ids.every(id => globalThis.testScene.fxMeshes.has(id)), launched.ids)
  assert.ok(await effectPixels(page, launched.ids), 'Firewarrior building volley must reach the GPU')
  const impact = await page.evaluate(async ({ id, source }) => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts'),
      building = world.buildings.find(candidate => candidate.id === id),
      shooter = world.units.find(unit => unit.id === source)
    for (let turn = 0; !building.damageState?.damage && turn < 12; turn++) tick(world, 1 / 12)
    const first = { damage: building.damageState?.damage, attacker: building.damageState?.attacker }
    let prior = shooter.cooldown,
      repeated = false
    for (let turn = 0; !repeated && turn < 80; turn++) {
      tick(world, 1 / 12)
      repeated = shooter.cooldown > prior
      prior = shooter.cooldown
    }
    for (let turn = 0; (building.damageState?.damage ?? 0) <= first.damage && turn < 12; turn++)
      tick(world, 1 / 12)
    return { first, repeated, target: shooter.target, damage: building.damageState?.damage }
  }, target)
  assert.ok([39, 40].includes(impact.first.damage), JSON.stringify(impact.first))
  assert.equal(impact.first.attacker, 0)
  assert.equal(impact.repeated, true)
  assert.equal(impact.target, target.id)
  assert.ok(impact.damage > impact.first.damage)
  assert.deepEqual(errors, [])
  console.log('PASS: Mission 10 UI-trained Firewarrior repeatedly damages an authored completed enemy building through command 19')
} finally {
  await browser.close()
}
