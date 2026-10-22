import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readSpySabotageTarget, resumeSpySourceInput } from '../scripts/tutorial-browser/spy-source.mjs'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { withoutCampaignPopup } from './support/world-input-page.mjs'
import { worldPauseState } from '../scripts/browser-world-input.mjs'
await loadSceneFixture()
const { pickWorldObject } = await import('../app/scene-input-runtime.ts')

function setup(t, blocked) {
  const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 200 }) },
    target = { id: 1022, x: 0, z: 0 }, vehicle = { id: 77, active: true, x: 0, y: 0 },
    world = { paused: false, turn: 262, buildings: [target], shrines: [], vehicles: [vehicle] },
    scene = { world, renderer: { domElement: canvas }, overviewActive: false,
      cameraPosition: { x: 10, y: 20, angle: 30 }, camera: {},
      screen: () => ({ x: 0, y: 0 }),
      view: { screen: () => ({ x: 0, y: 0.3 }) },
      vehicleMeshes: new Map([[77, { visible: blocked === 'vehicle', position: {} }]]),
      picking: { pick: () => 1022, pickPerson: () => blocked === 'person' ? 99 : null },
      pickUnit: () => blocked === 'person' ? { id: 99 } : null }
  scene.pickWorldObject = event => pickWorldObject(scene, event)
  const descriptors = new Map(['window', 'document'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]))
  globalThis.window = { testSceneRef: { current: scene } }
  globalThis.document = { elementFromPoint: () => blocked === 'overlay' ? {} : canvas }
  t.after(() => { for (const [k, d] of descriptors) if (d) Object.defineProperty(globalThis, k, d); else delete globalThis[k] })
  return scene
}

test('raw hut hit can resolve to a nearby vehicle in the actual production command picker', t => {
  const scene = setup(t, 'vehicle'), event = { clientX: 100, clientY: 70 }
  assert.equal(scene.picking.pick(event), 1022, 'old witness qualified this point')
  assert.equal(scene.pickWorldObject(event).id, 77, 'production resolves the vehicle first')
  const chosen = readSpySabotageTarget(1022)
  assert.equal(chosen.candidates[0].commandObject, 77)
  assert.notDeepEqual({ x: chosen.x, y: chosen.y }, { x: 100, y: 70 })
  assert.equal(scene.pickWorldObject({ clientX: chosen.x, clientY: chosen.y }).id, 1022)
  assert.equal(chosen.commandObject, 1022)
})

for (const blocked of ['person', 'overlay']) test(`target qualification rejects ${blocked} ownership`, t => {
  setup(t, blocked)
  assert.throws(() => readSpySabotageTarget(1022), /lacks a genuine exposed production command hit/)
})

test('actual driver resumes before selecting a current production hit and clicking it', async t => {
  const scene = setup(t), source = readFileSync(new URL('../scripts/tutorial-browser/spy-source.mjs', import.meta.url), 'utf8'),
    start = source.indexOf("await resumeSpySourceInput(page, action, 'Canvas sabotage command'"),
    end = source.indexOf('        report.order =', start), events = [], report = {}
  assert.ok(start > 0 && end > start)
  scene.world.paused = true
  assert.throws(() => readSpySabotageTarget(1022), /after public Resume/)
  const page = withoutCampaignPopup({
    keyboard: { press: async key => {
      assert.equal(key, 'Space'); events.push('resume'); scene.world.paused = false
    } },
    waitForFunction: async () => { assert.equal(scene.world.paused, false); events.push('running') },
    evaluate: async (fn, id) => {
      if (fn === worldPauseState) return { paused: scene.world.paused, inputMask: 0, turn: scene.world.turn }
      events.push('qualify'); return fn(id)
    },
    mouse: { click: async (x, y) => { assert.equal(scene.pickWorldObject({ clientX: x, clientY: y }).id, 1022); events.push('click') } } }),
    drive = new (Object.getPrototypeOf(async function () {}).constructor)(
      'page', 'action', 'resumeSpySourceInput', 'readSpySabotageTarget', 'fixture', 'report', 'save', 'budget', source.slice(start, end))
  await drive(page, async (_name, run) => run(), resumeSpySourceInput, readSpySabotageTarget,
    { targetId: 1022 }, report, () => {}, { deadlineAt: Date.now() + 8000 })
  assert.deepEqual(events, ['resume', 'running', 'qualify', 'click'])
  assert.equal(report.commandPick.commandObject, 1022)
})

test('failure diagnostics retain native orders, live pick and observer before closure without mutation', async t => {
  const { readSpyCommandFailure, retainSpyCommandFailure } = await import('../scripts/tutorial-browser/spy-source.mjs'),
    scene = setup(t), native = { immediateCommand: 4, commands: [5], commandCursor: 0, state: 10 },
    spy = { id: 2170, target: null, native }, report = { commandPick: { x: 100, y: 70 } }, events = []
  Object.assign(scene.world, { units: [spy], selected: [2170], buildingOrders: { records: { 4: { model: 3 }, 5: { model: 15 } } } })
  window.__pndSpySourceObservation = { retain: () => { events.push('retain'); return { samples: [{ turn: 261 }], crops: [], error: null } } }
  const before = structuredClone(scene.world), page = { evaluate: async (fn, args) => { assert.equal(fn, readSpyCommandFailure); return fn(args) } }
  await retainSpyCommandFailure(page, report, { spyId: 2170, targetId: 1022 }, 1000, () => 900)
  assert.deepEqual(scene.world, before)
  assert.deepEqual(events, ['retain'])
  assert.equal(report.failureDiagnostics.orders[0].record.model, 3)
  assert.equal(report.failureDiagnostics.pick.commandObject, 1022)
  assert.equal(report.failureDiagnostics.spy.target, null)
})

test('diagnostic failure and exhausted budget never replace the scenario failure or reopen its cap', async () => {
  const { retainSpyCommandFailure } = await import('../scripts/tutorial-browser/spy-source.mjs'), report = {}
  await retainSpyCommandFailure({ evaluate: async () => { throw Error('page closed') } }, report, {}, 100, () => 99)
  assert.match(report.failureDiagnostics.error, /page closed/)
  await retainSpyCommandFailure({ evaluate: () => assert.fail('no time left') }, report, {}, 100, () => 100)
  assert.equal(report.failureDiagnostics.status, 'deadline-exhausted')
  const source = readFileSync(new URL('../scripts/tutorial-browser/spy-source.mjs', import.meta.url), 'utf8')
  assert.match(source, /catch \(error\) \{\s*await retainSpyCommandFailure[\s\S]*?throw error\s*\} finally \{[\s\S]*?await context.close\(\)/)
})
