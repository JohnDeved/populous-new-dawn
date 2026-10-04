import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Scenario for scripts/local-render/harness.mjs; its browser keeps the sandbox.
export default async function transportIdle({ page, openMission, output, receipt }) {
  mkdirSync(output, { recursive: true })
  await openMission(22)
  const ids = await page.evaluate(async () => {
    const scene = window.testScene, w = scene.world
    const { addUnit, browserPosition, command, tick } = await import('/app/model.ts')
    cancelAnimationFrame(scene.frame)
    w.speed = 0
    w.manaWorld.gameFlags = 32
    w.inputMask = 0
    const boat = w.vehicles.find(v => v.model === 1)
    w.units = []; w.pathfinding.people.clear()
    const spy = addUnit(w, 'blue', 'spy', browserPosition(boat))
    w.selected = [spy.id]
    if (!command(w, { ...browserPosition(boat), id: boat.id })) throw Error('Board command rejected')
    for (let i = 0; i < 24 && !spy.native?.vehicle; i++) tick(w, 1 / 12)
    if (spy.native?.vehicle !== boat.id) throw Error('Spy did not board')
    scene.focus(browserPosition(boat))
    for (let i = 0; scene.cameraMotion.active && i < 64; i++) scene.updateCameraMotion(1 / 24)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return { spy: spy.id, boat: boat.id }
  })
  await page.getByTitle('followers', { exact: true }).click()
  const buttons = page.locator('.command-dock button[aria-label^="Disguise selected spies as "]')
  assert.ok(await buttons.count())
  const label = await buttons.first().getAttribute('aria-label')
  await page.screenshot({ path: resolve(output, 'aboard-before.png') })
  await buttons.first().click()
  const completed = await page.evaluate(async ids => {
    const scene = window.testScene, w = scene.world
    const { tick } = await import('/app/model.ts')
    const spy = w.units.find(u => u.id === ids.spy), boat = w.vehicles.find(v => v.id === ids.boat)
    tick(w, 1 / 12)
    const first = { state: spy.native.state, disguise: spy.native.disguise, speed: spy.native.speed }
    for (let i = 0; i < 63; i++) tick(w, 1 / 12)
    scene.onChange(); scene.animate(scene.previous); cancelAnimationFrame(scene.frame)
    return { first, state: spy.native.state, vehicle: spy.native.vehicle, disguise: spy.native.disguise, passengers: boat.passengerCount }
  }, ids)
  assert.equal(completed.first.state, 30)
  assert.equal(completed.first.speed, 0)
  assert.equal(completed.first.disguise & 63, 63)
  assert.equal(completed.state, 30)
  assert.equal(completed.vehicle, ids.boat)
  assert.equal(completed.disguise & 63, 0)
  assert.equal(completed.passengers, 1)
  await page.screenshot({ path: resolve(output, 'aboard-after.png') })
  await buttons.last().click()
  assert.equal(await page.evaluate(async id => {
    const { tick } = await import('/app/model.ts'), w = window.testScene.world
    tick(w, 1 / 12)
    return w.units.find(u => u.id === id).native.state
  }, ids.spy), 30)
  assert.deepEqual(receipt.errors, [])
  const renderer = await page.evaluate(() => {
    const gl = window.testScene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
  })
  const result = {
    status: 'passed', label, completed, renderer,
    scope: 'Staged Spy population/location; real command boarding and rendered disguise/replacement controls.',
    limits: 'Cloud headless rendering only; no hardware performance or ordinary Spy acquisition claim. Balloon command-position boundary is separate.',
  }
  writeFileSync(resolve(output, 'result.json'), JSON.stringify(result, null, 2) + '\n')
  console.log('PASS: rendered Boat disguise control completes to state30, holds 63 turns and accepts replacement without page errors')
  return result
}
