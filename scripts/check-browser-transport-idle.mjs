import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { vehiclePoint } from './check-browser-vehicle-panel.mjs'

// Scenario for scripts/local-render/harness.mjs; its browser keeps the sandbox.
// Default preserves the Boat check; model3 selects the bounded Balloon repair.
export default async function transportIdle({ page, openMission, output, receipt }) {
  const model = Number(process.env.POPULOUS_TRANSPORT_IDLE_MODEL ?? 1)
  assert.ok([1, 3].includes(model), 'transport idle model must be Boat1 or Balloon3')
  const kind = model === 1 ? 'Boat' : 'Balloon'
  mkdirSync(output, { recursive: true })
  await openMission(22)
  const ids = await page.evaluate(async model => {
    const scene = window.testSceneRef.current, w = scene.world
    const { addUnit, browserPosition } = await import('/app/model.ts')
    if (w.paused || w.status !== 'playing' || w.inputMask) throw Error('Mission input is not ready')
    cancelAnimationFrame(scene.frame)
    w.speed = 0
    w.manaWorld.gameFlags |= 32
    const vehicle = w.vehicles.find(v => v.model === model)
    if (!vehicle || vehicle.passengerCount) throw Error('Authored vehicle is not empty')
    // Supporting fixture: add one selected driver candidate beside the real craft.
    // Keep every authored person and route; commands and disguise use actual UI.
    const authored = w.units.map(u => u.id)
    const spy = addUnit(w, 'blue', 'spy', browserPosition(vehicle))
    w.selected = [spy.id]
    scene.onChange(); scene.animate(scene.previous); cancelAnimationFrame(scene.frame)
    return { spy: spy.id, vehicle: vehicle.id, authored }
  }, model)
  const point = await vehiclePoint(page, ids.vehicle)
  await page.mouse.click(point.x, point.y)
  const boarding = await page.evaluate(async ids => {
    const scene = window.testSceneRef.current, w = scene.world
    const { tick } = await import('/app/model.ts')
    const { currentPersonOrder } = await import('/app/person-orders.ts')
    const spy = w.units.find(u => u.id === ids.spy), vehicle = w.vehicles.find(v => v.id === ids.vehicle)
    const order = spy.native && currentPersonOrder(w.buildingOrders, spy.native)
    if (order?.model !== 22 || order.a !== ids.vehicle) throw Error('Mesh click did not accept the boarding command')
    const accepted = { model: order.model, target: order.a }
    let turns = 0
    for (; turns < 24 && !spy.native.vehicle; turns++) tick(w, 1 / 12)
    scene.onChange(); scene.animate(scene.previous); cancelAnimationFrame(scene.frame)
    return { accepted, turns, vehicle: spy.native.vehicle, driver: vehicle.passengers[0], count: vehicle.passengerCount,
      selected: [...w.selected], authoredRetained: ids.authored.every(id => w.units.some(u => u.id === id)),
      airborne: !!(spy.native.flags4 & 0x2000000) }
  }, ids)
  assert.equal(boarding.vehicle, ids.vehicle)
  assert.equal(boarding.driver, ids.spy)
  assert.equal(boarding.count, 1)
  assert.equal(boarding.authoredRetained, true)
  assert.equal(boarding.airborne, model === 3)
  assert.deepEqual(boarding.selected, [ids.spy])
  await page.getByTitle('followers', { exact: true }).click()
  const buttons = page.locator('.command-dock button[aria-label^="Disguise selected spies as "]')
  assert.ok(await buttons.count())
  const label = await buttons.first().getAttribute('aria-label')
  await page.screenshot({ path: resolve(output, 'aboard-before.png') })
  await buttons.first().click()
  const accepted = await page.evaluate(async id => {
    const w = window.testSceneRef.current.world, p = w.units.find(u => u.id === id).native
    const { currentPersonOrder } = await import('/app/person-orders.ts')
    const order = currentPersonOrder(w.buildingOrders, p)
    return { order, destination: [p.destinationX, p.destinationY], state: p.state, vehicle: p.vehicle }
  }, ids.spy)
  assert.equal(accepted.order?.model, 16, 'rendered disguise click accepted command16 before any simulated turn')
  assert.equal(accepted.order.flags & 1, 0)
  assert.equal(accepted.vehicle, ids.vehicle)
  if (model === 3) assert.deepEqual(accepted.destination, [accepted.order.a & 65535, accepted.order.b & 65535])
  const completed = await page.evaluate(async ids => {
    const scene = window.testSceneRef.current, w = scene.world
    const { tick } = await import('/app/model.ts')
    const spy = w.units.find(u => u.id === ids.spy), vehicle = w.vehicles.find(v => v.id === ids.vehicle)
    tick(w, 1 / 12)
    const first = { state: spy.native.state, disguise: spy.native.disguise, speed: spy.native.speed, position: [vehicle.x, vehicle.y] }
    for (let i = 0; i < 63; i++) tick(w, 1 / 12)
    scene.onChange(); scene.animate(scene.previous); cancelAnimationFrame(scene.frame)
    return { first, state: spy.native.state, vehicle: spy.native.vehicle, disguise: spy.native.disguise,
      passengers: vehicle.passengerCount, position: [vehicle.x, vehicle.y], status: w.status,
      authoredRetained: ids.authored.every(id => w.units.some(u => u.id === id)) }
  }, ids)
  assert.equal(completed.first.state, 30)
  assert.equal(completed.first.speed, 0)
  assert.equal(completed.first.disguise & 63, 63)
  assert.equal(completed.state, 30)
  assert.equal(completed.vehicle, ids.vehicle)
  assert.equal(completed.disguise, (accepted.order.a & 3) << 6)
  assert.equal(completed.passengers, 1)
  assert.deepEqual(completed.position, completed.first.position, 'rest starts after command completion')
  assert.equal(completed.status, 'playing')
  assert.equal(completed.authoredRetained, true)
  await page.screenshot({ path: resolve(output, 'aboard-after.png') })
  const replacementLabel = await buttons.last().getAttribute('aria-label')
  await buttons.last().click()
  const replacement = await page.evaluate(async id => {
    const { tick } = await import('/app/model.ts'), { currentPersonOrder } = await import('/app/person-orders.ts')
    const w = window.testSceneRef.current.world, p = w.units.find(u => u.id === id).native
    const order = currentPersonOrder(w.buildingOrders, p)
    if (order?.model !== 16) throw Error('Replacement disguise command not accepted')
    const tribe = order.a & 3
    tick(w, 1 / 12)
    return { tribe, state: p.state, disguise: p.disguise, vehicle: p.vehicle }
  }, ids.spy)
  assert.equal(replacement.state, 30)
  assert.equal(replacement.disguise, (replacement.tribe << 6) | 63)
  assert.equal(replacement.vehicle, ids.vehicle)
  assert.deepEqual(receipt.errors, [])
  const renderer = await page.evaluate(() => {
    const gl = window.testSceneRef.current.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
  })
  const result = {
    status: 'passed', model, kind, label, boarding, accepted, completed, replacementLabel, replacement,
    renderer, viewport: page.viewportSize(), devicePixelRatio: await page.evaluate(() => window.devicePixelRatio),
    scope: 'Staged one Spy and selection beside an empty authored Mission22 craft; authored population retained. Actual mesh-click boarding and rendered disguise/replacement controls; deterministic ticks and camera focus are supporting setup.',
    limits: 'Cloud headless rendering only. No hardware performance, ordinary Spy acquisition, natural campaign, complete vehicle lifecycle, encoded cell/object command positions or non-driver scheduling claim. Checkpoint continuation has separate source coverage.',
  }
  writeFileSync(resolve(output, 'result.json'), JSON.stringify(result, null, 2) + '\n')
  console.log(`PASS: rendered ${kind} driver disguise accepts command16, completes to state30, holds63 turns and accepts replacement without page errors`)
  return result
}
