import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'

const fixture = readFileSync(new URL('../scripts/tutorial-browser/building-panel-fixture.mjs', import.meta.url), 'utf8')
const scenario = readFileSync(new URL('../scripts/tutorial-browser/building-panel-identity.mjs', import.meta.url), 'utf8')
const createSource = fixture.slice(fixture.indexOf('export function createBoundary('), fixture.indexOf('\nexport function replaceBetweenPaints(')).replace('export ', '')
const setupEnd = scenario.indexOf("    // Projected candidates are observations;")
const waitStart = scenario.lastIndexOf('    await page.waitForFunction(', setupEnd)
assert.ok(waitStart > 0 && setupEnd > waitStart)
const waitSource = scenario.slice(waitStart, setupEnd).trim()

test('allocation setup requests the same view without pretending renderer samples advance controller time', () => {
  const calls = [], old = { id: 1023 }, transition = { remaining: 18 }
  const world = { inputMask: 0, paused: true, nextId: 1, levelStart: [{ phase: 4, wave: null, carriers: [] }] }
  const scene = { world, isCurrent: () => true,
    focus: target => calls.push(['focus', target]),
    startGroundView: preset => { calls.push(['view', preset]); scene.viewTransition = transition },
    updateCameraMotion: () => { calls.push(['sample']) },
    onChange: () => calls.push(['publish']),
  }
  const context = { addBuilding: (...args) => { calls.push(['add', ...args]); return old },
    requireState: (condition, message) => assert.ok(condition, message) }
  const createBoundary = vm.runInNewContext(`${createSource}; createBoundary`, context)
  const result = createBoundary(scene)
  assert.equal(result.scene, scene)
  assert.equal(result.world, world)
  assert.equal(result.old, old)
  assert.equal(world.nextId, 1024)
  assert.deepEqual(calls.map(call => call[0]), ['add', 'focus', 'view', 'publish'])
  assert.equal(calls[2][1], 3)
  assert.equal(scene.viewTransition, transition)
  assert.equal(world.paused, true)
})

test('actual pre-hover wait refuses a mounted building while camera transition is still active', async () => {
  let predicate
  const scene = { viewTransition: { remaining: 18 }, buildingMeshes: new Map([[1023, {}]]) }
  const context = { window: { testSceneRef: { current: scene }, buildingIdentity: { old: { id: 1023 } } },
    page: { waitForFunction: callback => { predicate = callback } } }
  await vm.runInNewContext(`(async () => { ${waitSource} })()`, context)
  assert.equal(predicate(), false)
  scene.viewTransition = { remaining: 1 }
  assert.equal(predicate(), false)
  scene.viewTransition = null
  assert.equal(predicate(), true)
  scene.buildingMeshes.clear()
  assert.equal(predicate(), false)
})

test('the settling gate precedes unchanged public hover, focus and replacement; episode deadline remains 35 seconds', () => {
  assert.ok(setupEnd < scenario.indexOf('    await page.mouse.move(point.x, point.y)'))
  assert.ok(scenario.indexOf('await panel.locator(\'.dismantle-control\').focus()') < scenario.indexOf("    await screenshot('original')"))
  assert.match(scenario, /buildingPanelIdentityLimitMs = 35000/)
  assert.match(fixture, /Original panel must actually be visible/)
  assert.match(fixture, /No rendered frame may intervene during replacement/)
})
