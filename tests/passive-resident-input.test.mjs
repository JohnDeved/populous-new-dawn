// Node-only input contracts with supplied world, DOM, and command-result boundaries.
// These run the maintained browser callback bodies and shipped context/order/picker
// leaves. No createWorld, model command, fixed turn, browser, or arrival is simulated.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as pointer from '../qa/erosion-ordinary/input.mjs'
import * as orders from '../app/person-orders.ts'
import * as command from '../app/live-command.ts'
import * as terrain from '../app/world-terrain-runtime.ts'
import { createNativeTerrain } from '../app/native-terrain.ts'
import { createMission1VaultInput, Mission1PreclickRejection } from '../scripts/local-render/mission1-vault-input.mjs'

const modules = {
  '/qa/erosion-ordinary/input.mjs': pointer,
  '/app/person-orders.ts': orders,
  '/app/live-command.ts': command,
  '/app/world-terrain-runtime.ts': terrain,
  // Casting is outside this contract. Imports are admitted, but no spell leaf
  // is supplied: an accidental call fails rather than inventing spell behavior.
  '/app/spell-casting.ts': {},
  '/app/native-math.ts': {},
  '/app/world-rules.ts': {},
}
const evaluate = (fn, argument) => Function('imports',
  `return (${fn.toString().replaceAll('import(', 'imports(')})`
)(async path => {
  assert.ok(Object.hasOwn(modules, path), `Unexpected browser import: ${path}`)
  return modules[path]
})(argument)

const outside = { x: -11, z: 39 }

function fixture(t, { commandRecipient = null, failClick = false } = {}) {
  const shaman = { id: 1, kind: 'shaman', team: 'blue', hp: 100, x: 0, z: 30, inside: null, work: null }
  const brave = { id: 21, kind: 'brave', team: 'blue', hp: 100, x: -11, z: 34, inside: 37, work: 37 }
  const other = { ...brave, id: 22, inside: null, work: null }
  const hut = { id: 37, kind: 'hut', team: 'blue', hp: 100, progress: 1, level: 1,
    object: 107, angle: 0, anchor: { x: 64512, y: 54784 }, x: -11, z: 34 }
  const land = createNativeTerrain(new Int16Array(16384).fill(64))
  land.walkMasks.forEach(mask => mask.fill(255))
  const world = { units: [shaman, brave, other], buildings: [hut], trees: [], shrines: [], vehicles: [],
    selected: [brave.id], turn: 40, lastOrderTurn: 39, paused: false, mode: null,
    land, landVersion: 0, terrainVersion: 0, buildingFootprints: new Map(), sceneryShadows: new Map(),
    castingTribes: [{ flags: 0 }], buildingOrders: { records: Array.from({ length: 800 }, orders.emptyPersonOrder) } }
  const listeners = [], issued = [], clicks = [], waits = [], report = { actions: [] }
  const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 }),
    addEventListener(type, callback, capture = false) { listeners.push({ type, callback, capture }) },
    removeEventListener(type, callback, capture = false) {
      const index = listeners.findIndex(item => item.type === type && item.callback === callback && item.capture === capture)
      assert.ok(index >= 0, 'Only the installed listener may be removed')
      listeners.splice(index, 1)
    },
  }
  const supplied = { object: null, point: outside }
  const scene = { world, renderer: { domElement: canvas }, pointerAck: { until: 0, target: 0 },
    cameraPosition: {}, view: { projection: {} }, buildingMeshes: new Map(), screen: () => ({ x: 0, y: 0 }),
    pickUnit: () => null, picking: { pickPerson: () => null },
    pickWorldObject: () => supplied.object, pick: () => supplied.point }
  const originals = [scene.pickUnit, scene.picking.pickPerson, scene.pickWorldObject, scene.pick]
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  globalThis.document = { elementFromPoint: () => canvas }
  t.after(() => {
    window.mission1VaultDispatch?.finish()
    delete globalThis.window
    delete globalThis.document
  })
  const page = {
    evaluate,
    async waitForFunction(fn, argument) {
      waits.push(fn.toString())
      assert.ok(await evaluate(fn, argument), 'Readiness must already be supplied; never advance a turn')
    },
    mouse: { async click(x, y) {
      clicks.push({ x, y })
      for (const type of ['pointerdown', 'pointerup']) {
        const event = { type, clientX: x, clientY: y, button: 0, buttons: Number(type === 'pointerdown'),
          isTrusted: true, target: canvas, pointerType: 'mouse',
          ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }
        for (const item of [...listeners].filter(item => item.type === type && item.capture)) item.callback(event)
        if (failClick) throw Error('Supplied pointer delivery failed')
        if (type === 'pointerup') {
          // Supplied handler-result boundary, not the game's command dispatcher.
          // Real pick/context/order leaves decide the target/model and build the
          // observed order. Movement, occupancy, and controller evolution are absent.
          const target = scene.pickWorldObject(event) ?? scene.pick(event)
          const context = pointer.createMoveContextProbe(world)(target)
          assert.equal(context.enabled, true)
          const id = commandRecipient ?? world.selected[0]
          const recipient = world.units.find(unit => unit.id === id)
          const person = { model: recipient.kind === 'brave' ? 2 : 7, flags4: 0,
            immediateCommand: 0, commands: [1, 0, 0, 0, 0, 0, 0, 0], commandCursor: 0 }
          assert.equal(orders.acceptsPersonOrder(person, context.model), true)
          const order = orders.emptyPersonOrder()
          if (context.model === 3) orders.prepareMovementOrder(order,
            { x: Math.round((target.x + 8) * 256), y: Math.round((-target.z - 8) * 256) }, 0,
            world.land, () => assert.fail('The supplied outside target must not need building correction'))
          else {
            assert.equal(context.model, 8)
            orders.prepareBuildingEntryOrder(order, target.id, 0, 0, false)
          }
          order.references = 1
          world.buildingOrders.records[1] = order
          recipient.native = person
          recipient.work = context.model === 8 ? target.id : null
          issued.push({ id, model: context.model, target: target.id ?? null })
          world.lastOrderTurn = world.turn
          scene.pointerAck = { until: 1, target: target.id ?? 0 }
        }
        for (const item of [...listeners].filter(item => item.type === type && !item.capture)) item.callback(event)
      }
    } },
  }
  const input = createMission1VaultInput({ page, signal: new AbortController().signal, report,
    save() {}, originalShamanId: shaman.id })
  const restored = () => {
    assert.equal(listeners.length, 0)
    assert.equal(window.mission1VaultDispatch, undefined)
    assert.deepEqual([scene.pickUnit, scene.picking.pickPerson, scene.pickWorldObject, scene.pick], originals)
  }
  return { input, world, shaman, brave, other, hut, supplied, report, clicks, issued, waits, restored }
}

test('passive Brave uses one explicit command3 dispatch while the actual Shaman remains the health guard', async t => {
  const f = fixture(t)
  const landBefore = structuredClone(f.world.land)
  const hit = await f.input.fixedGround(outside)
  assert.equal(hit.rejection, null)
  assert.deepEqual(hit.point, outside)
  assert.equal(hit.search.inspected, 1)
  const evidence = await f.input.dispatch(hit, 3, [f.brave.id])
  assert.deepEqual(f.issued, [{ id: f.brave.id, model: 3, target: null }])
  assert.deepEqual(evidence.before.selected, [f.brave.id])
  assert.equal(evidence.before.units[0].kind, 'brave')
  assert.equal(evidence.after.units[0].order.model, 3)
  assert.deepEqual([evidence.after.units[0].order.a, evidence.after.units[0].order.b], [64768, 53504])
  assert.equal(f.shaman.native, undefined)
  assert.deepEqual(f.world.land, landBefore, 'Context probes may synchronize only detached terrain')
  assert.equal(f.world.buildingFootprints.size, 0)
  assert.equal(f.clicks.length, 1)
  assert.equal(f.waits.length, 1)
  f.restored()
})

test('clickEntity composes real rendered-interior and command8 admission for the explicit Brave', async t => {
  const f = fixture(t)
  f.brave.inside = null
  f.brave.work = null
  f.supplied.object = f.hut
  const evidence = await f.input.clickEntity('buildings', f.hut.id, 8, false, [f.brave.id])
  assert.deepEqual(f.issued, [{ id: f.brave.id, model: 8, target: f.hut.id }])
  assert.equal(evidence.after.units[0].work, f.hut.id)
  assert.equal(evidence.after.units[0].order.model, 8)
  assert.equal(f.clicks.length, 1)
  assert.equal(f.waits.length, 1)
  assert.equal(f.shaman.native, undefined)
  f.restored()
})

for (const model of [3, 8]) test(`command${model} refuses a different selected recipient before pointer delivery`, async t => {
  const f = fixture(t)
  f.world.selected = [f.other.id]
  const hit = model === 3 ? { x: 500, y: 400, point: outside }
    : { x: 500, y: 400, collection: 'buildings', id: f.hut.id }
  if (model === 8) f.supplied.object = f.hut
  await assert.rejects(f.input.dispatch(hit, model, [f.brave.id]), error =>
    error instanceof Mission1PreclickRejection && !error.inputAttempted && /Selected recipients changed/.test(error.message))
  assert.deepEqual(f.clicks, [])
  assert.deepEqual(f.issued, [])
  f.restored()
})

test('command8 refuses the Shaman as a housing recipient even with matching expected IDs', async t => {
  const f = fixture(t)
  f.world.selected = [f.shaman.id]
  f.supplied.object = f.hut
  await assert.rejects(f.input.dispatch({ x: 500, y: 400, collection: 'buildings', id: f.hut.id }, 8, [f.shaman.id]),
    /Housing requires the intended living all-Brave cohort/)
  assert.equal(f.clicks.length, 0)
  f.restored()
})

test('the explicit Brave cannot replace a lost original Shaman health guard', async t => {
  const f = fixture(t)
  f.shaman.hp = 0
  await assert.rejects(f.input.dispatch({ x: 500, y: 400, point: outside }, 3, [f.brave.id]), /Original Shaman was lost/)
  assert.equal(f.brave.hp, 100)
  assert.equal(f.clicks.length, 0)
  f.restored()
})

test('a foreign Hut resolves to its real attack context and cannot be admitted as command8', async t => {
  const f = fixture(t)
  f.hut.team = 'red'
  f.supplied.object = f.hut
  await assert.rejects(f.input.clickEntity('buildings', f.hut.id, 8, false, [f.brave.id]), /Ordinary command context changed/)
  assert.equal(f.report.actions.find(entry => entry.label === 'rendered-target').hit.diagnostics.context.model, 19)
  assert.equal(f.clicks.length, 0)
  f.restored()
})

test('a different object under the retained Hut pixel is refused without a replacement click', async t => {
  const f = fixture(t)
  f.supplied.object = { ...f.hut, id: 999 }
  await assert.rejects(f.input.dispatch({ x: 500, y: 400, collection: 'buildings', id: f.hut.id }, 8, [f.brave.id]),
    /Rendered target became stale/)
  assert.equal(f.clicks.length, 0)
  f.restored()
})

test('direct Brave dispatch stops at a retryable ground rejection without probing or clicking again', async t => {
  const f = fixture(t)
  f.supplied.point = { x: -10, z: 39 }
  await assert.rejects(f.input.dispatch({ x: 500, y: 400, point: outside }, 3, [f.brave.id]), error =>
    error instanceof Mission1PreclickRejection && error.retryable && !error.inputAttempted)
  assert.equal(f.report.actions.length, 1)
  assert.equal(f.report.actions[0].label, 'final-dispatch-preflight')
  assert.equal(f.clicks.length, 0)
  f.restored()
})

for (const model of [3, 8]) test(`wrong command${model} recipient after one delivered click fails evidence and never retries`, async t => {
  const f = fixture(t, { commandRecipient: 22 })
  f.brave.inside = null
  f.brave.work = null
  const hit = model === 3 ? { x: 500, y: 400, point: outside }
    : { x: 500, y: 400, collection: 'buildings', id: f.hut.id }
  if (model === 8) f.supplied.object = f.hut
  await assert.rejects(f.input.dispatch(hit, model, [f.brave.id]),
    /The actual command must reach a selected recipient/)
  assert.deepEqual(f.issued, [{ id: f.other.id, model, target: model === 8 ? f.hut.id : null }])
  assert.equal(f.clicks.length, 1)
  f.restored()
})

test('one failed Brave click restores all observers and never dispatches a fallback input', async t => {
  const f = fixture(t, { failClick: true })
  await assert.rejects(f.input.dispatch({ x: 500, y: 400, point: outside }, 3, [f.brave.id]), /Supplied pointer delivery failed/)
  assert.equal(f.clicks.length, 1)
  assert.deepEqual(f.issued, [])
  assert.equal(f.report.actions.find(entry => entry.label === 'final-dispatch-preflight').inputAttempted, true)
  assert.equal(f.report.actions.filter(entry => entry.label === 'actual-dispatch').length, 1)
  f.restored()
})
