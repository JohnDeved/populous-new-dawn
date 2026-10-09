// Supplied World/DOM/render boundaries; no model turns or browser execution.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import * as orders from '../app/person-orders.ts'
import * as idle from '../app/person-idle.ts'
import * as animation from '../app/unit-animation-source.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import { removeBuildingOccupant } from '../app/building-occupants.ts'
import { selectBuildingOccupants } from '../app/live-building-entry.ts'
import { cancelInteraction, selectUnit, canOrder } from '../app/selection-runtime.ts'
import { createNativeTerrain } from '../app/native-terrain.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import * as drag from '../app/drag-selection.ts'
import * as math from '../app/native-math.ts'
import { blastPersonTargeting } from '../app/blast-targeting.ts'
import * as pointerObservation from '../qa/erosion-ordinary/input.mjs'
import { SPELLS } from '../app/world-rules.ts'
import { installHutResidentWitness, installResidentCheckpointBoundary, readResidentCommitted,
  installResidentPanelSelection, installResidentSelectionClear, installOutsideBraveSelection,
  readHutResidentRoster } from '../scripts/local-render/hut-resident-witness.mjs'
import { assertPassiveResident, assertResidentDeparture, assertResidentCommitted, finishResidentHandles,
  assertOutsideBraveReady, assertOutsideBraveSelection } from '../scripts/local-render/hut-resident.mjs'

const modules = { '/app/person-orders.ts': orders, '/app/person-idle.ts': idle,
  '/app/unit-animation-source.ts': animation, '/app/original-rules.json': { default: rules },
  '/qa/erosion-ordinary/input.mjs': pointerObservation }
const browserCall = (fn, spec) => Function('imports', `return (${fn.toString().replaceAll('import(', 'imports(')})`)(async name => {
  assert.ok(Object.hasOwn(modules, name), name); return modules[name]
})(spec)
const install = spec => browserCall(installHutResidentWitness, spec)
function element() {
  const listeners = []
  return { isConnected: true, disabled: false, hidden: false, listeners,
    addEventListener(type, fn, capture = false) { listeners.push({ type, fn, capture }) },
    removeEventListener(type, fn, capture = false) {
      const index = listeners.findIndex(item => item.type === type && item.fn === fn && item.capture === capture)
      assert.ok(index >= 0); listeners.splice(index, 1)
    },
    emit(type, more = {}) { const e = { type, target: this, isTrusted: true, button: 0,
      ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, ...more }
      for (const capture of [true, false])
        for (const { fn } of [...listeners].filter(item => item.type === type && item.capture === capture)) fn(e)
    }, contains(target) { return target === this } }
}
function fixture(t) {
  const p = { id: 13, class: 1, model: 2, tribe: 0, life: 1000, building: 37,
    x: 64768, y: 53504, goalX: 64768, goalY: 53504, h: 64, commands: Array(8).fill(0),
    immediateCommand: 0, commandCursor: 0, commandStatus: 0, state: 10, previousState: 17,
    substate: 0, flags2: 0x804000, flags3: 0, flags4: 0, renderFlags: 16, assignment: 0,
    displacement: { x: 10, y: -5, h: 3 }, speed: 0, counter: 4, vehicle: 0, motionGroup: 0 }
  const u = { id: 13, kind: 'brave', team: 'blue', hp: 50, x: -11, z: 39,
    inside: null, work: 37, path: [], entry: { person: p }, native: null }
  const b = { id: 37, kind: 'hut', team: 'blue', hp: 100, progress: 1,
    admission: { id: 37, class: 2, model: 1, tribe: 0, object: 107, angle: 0,
      anchorX: 64512, anchorY: 54784, inside: 0, occupants: Array(6).fill(0), activity: 8, flags2: 0, flags3: 0 } }
  const w = { turn: 800, time: 40, paused: false, status: 'playing', inputMask: 0, mode: null,
    orderCursor: 0, outcome: { level: 1 }, land: { landFlags: 0 },
    selected: [13], randomState: 123, units: [u], buildings: [b], lastOrderTurn: 799,
    objectCells: { objects: new Map() }, pathfinding: { people: new Map() },
    buildingOrders: { records: [orders.emptyPersonOrder(), { ...orders.emptyPersonOrder(), model: 3, a: p.x, b: p.y }] },
    typed: new Uint16Array([1, 65535]), odd: Infinity }
  const canvas = element(); canvas.toDataURL = () => 'data:image/png;base64,AA=='
  const calls = [], scene = { world: w, scene: {}, camera: {},
    gameClock: { beforeTurn(...args) { calls.push({ name: 'before', receiver: this, args }); return 17 },
      afterTurn(...args) { calls.push({ name: 'after', receiver: this, args }); return 18 } },
    renderer: { domElement: canvas, info: { render: { frame: 0 } },
      render(...args) { calls.push({ name: 'render', receiver: this, args }); this.info.render.frame++; return 19 } },
    unitScreen: () => ({ x: 20, y: 30 }), buildingMeshes: new Map([[37, { position: {} }]]),
    view: { screen: () => ({ x: 0, y: 0, z: 0 }) }, buildingPanels: new Map() }
  let current = w
  const subscriptions = new Set(), store = { getWorld: () => current,
    subscribe(fn) { subscriptions.add(fn); return () => subscriptions.delete(fn) },
    // Supplied store publication boundary, with actual typed structuredClone.
    publish(world) { current = world; for (const fn of subscriptions) fn() } }
  globalThis.window = Object.assign(element(), { testSceneRef: { current: scene }, testStore: store })
  t.after(() => { window.hutResidentWitness?.close(); delete globalThis.window; delete globalThis.document; delete globalThis.indexedDB })
  const complete = () => { u.entry = undefined; u.native = null; u.inside = 37; u.work = null
    u.resident = { building: 37, slot: 0, person: p }; b.admission.inside = 1; b.admission.occupants[0] = 13 }
  return { w, u, b, p, scene, canvas, calls, store, subscriptions, complete,
    spec: { hutId: 37, unitId: 13, deadlineAt: Date.now() + 30000 } }
}

test('entry captures original record, natural main render only, and exact restoration', async t => {
  const f = fixture(t), before = f.scene.gameClock.beforeTurn, after = f.scene.gameClock.afterTurn, render = f.scene.renderer.render
  const api = await install(f.spec)
  api.armEntry()
  f.canvas.emit('pointerdown')
  orders.prepareBuildingEntryOrder(f.w.buildingOrders.records[1], 37, 0, 0, false)
  f.w.buildingOrders.records[1].references = 1; f.p.commands[0] = 1
  f.canvas.emit('pointerup')
  assert.equal(f.scene.gameClock.beforeTurn('turn'), 17)
  f.scene.renderer.render(f.scene.scene, f.scene.camera)
  f.complete(); f.p.commands[0] = 0; f.w.buildingOrders.records[1].references = 0
  assert.equal(f.scene.gameClock.afterTurn('turn'), 18)
  assert.equal(f.scene.renderer.render({}, f.scene.camera), 19)
  assert.equal(api.read().frames.resident, undefined)
  f.scene.renderer.render(f.scene.scene, f.scene.camera)
  const e = api.read()
  assert.equal(e.admission.samePerson, true); assertPassiveResident(e.latest, 13, 37)
  assert.equal(e.entryInput.after.order.model, 8); assert.equal(e.entryInput.after.order.a, 37)
  assert.equal(e.entryInput.after.order.references, 1); assert.equal(e.admission.entryOrderReferences, 0)
  assert.deepEqual(Object.keys(e.frames), ['entry', 'resident'])
  assert.equal(e.frames.resident.rendererFrame, 3)
  const terminal = api.close(); assert.deepEqual(terminal.errors, []); assert.equal(terminal.closed, true)
  assert.equal(f.scene.gameClock.beforeTurn, before); assert.equal(f.scene.gameClock.afterTurn, after)
  assert.equal(f.scene.renderer.render, render); assert.equal(Object.hasOwn(f.w.objectCells.objects, 'set'), false)
  assert.equal(f.canvas.listeners.length, 0); assert.equal(window.hutResidentWitness, undefined)
  assert.equal(f.calls[0].receiver, f.scene.gameClock); assert.deepEqual(f.calls[0].args, ['turn'])
})

test('actual public Hut command defers allocation until the entry producer, with nonzero release proof', async t => {
  const f = fixture(t)
  f.u.entry = undefined; f.u.native = f.p; f.u.work = null
  f.w.buildingOrders.cursor = 1; f.w.buildingOrders.active = 0
  f.w.manaWorld = { gameFlags: 0 }
  const commandSource = readFileSync(new URL('../app/live-command.ts', import.meta.url), 'utf8')
  const body = commandSource.slice(commandSource.indexOf('  // Non-ground commands retain'))
  // Execute the actual ordinary-Hut command branch. Route planning, terrain,
  // release and message boundaries are supplied; no model turn is run.
  const command = Function('canOrder', 'acceptsPersonOrder', 'combatPerson', 'entrance',
    'planLivePath', 'release', 'acceptLivePath', 'tell',
    `return ${stripTypeScriptTypes(`function command(w, p, model, context) { ${body}`)}`)(canOrder, orders.acceptsPersonOrder,
      () => f.p, () => ({ x: -11, z: 36.5 }), () => f.p, () => {},
      (_w, u, p) => { u.native = p; u.path = [{ x: -11, z: 36.5 }] }, () => {})
  const entrySource = readFileSync(new URL('../app/live-building-entry.ts', import.meta.url), 'utf8')
  const beginSource = entrySource.slice(entrySource.indexOf('function begin('), entrySource.indexOf('export function rebuildLiveTrainingQueue'))
  const effects = { prepare() { assert.fail('Unexpected order preparation') }, stopWork() {},
    releaseSpell() {}, deleteObject() {}, releaseFight() {} }
  // Actual begin/allocate/attach bodies own the delayed queue and same-person
  // handoff. State-animation initialization is a supplied boundary.
  const begin = Function('allocatePersonOrder', 'attachPersonOrder', 'orderEffects',
    'defaultPersonState', 'initializeBuildingPerson', 'person',
    `${stripTypeScriptTypes(beginSource)}; return begin`)(orders.allocatePersonOrder,
      orders.attachPersonOrder, effects, () => 10, () => {}, () => assert.fail('Existing person required'))
  const api = await install(f.spec); api.armEntry(); f.canvas.emit('pointerdown')
  assert.equal(command(f.w, f.b, 8, { building: f.b }), true)
  f.w.lastOrderTurn = f.w.turn; f.canvas.emit('pointerup')
  assert.equal(f.u.work, 37); assert.equal(api.read().entryInput.after.order, null)
  assert.equal(api.read().entryCommand ?? null, null)
  f.scene.gameClock.beforeTurn()
  f.u.entry = begin(f.w, f.u, f.b); f.w.turn++
  f.scene.gameClock.afterTurn()
  const allocated = api.read().entryCommand
  assert.ok(allocated?.orderId > 0); assert.equal(allocated.order.model, 8)
  assert.equal(allocated.order.a, 37); assert.equal(allocated.order.references, 1)
  assert.equal(allocated.samePerson, true)
  orders.clearPersonOrders(f.w.buildingOrders, f.p, effects); f.complete()
  f.w.turn++; f.scene.gameClock.afterTurn()
  assert.equal(api.read().admission.entryOrderId, allocated.orderId)
  assert.equal(api.read().admission.entryOrderReferences, 0)
  assert.equal(api.read().admission.samePerson, true); assert.deepEqual(api.close().errors, [])
})

test('real mode1 removal inserts the exact passive record before indicator cleanup', async t => {
  const f = fixture(t), api = await install(f.spec)
  f.complete(); api.armMove('final-departure', true)
  const context = { people: new Map([[13, f.p]]), buildings: new Map([[37, f.b.admission]]),
    orders: f.w.buildingOrders, turn: f.w.turn, towerTribes: 0, tribes: [], buildingAt: () => 0 }
  // Production insertCell's Map.set is the observed boundary. Terrain sampling,
  // cell linking and indicator effects are supplied; actual remove/set/restore
  // occupancy bodies determine their synchronous order and exact person argument.
  const effects = { terrainHeight: () => 60,
    insertCell(p) { assert.equal(p, f.p); f.w.objectCells.objects.set(p.id, p) },
    updateIndicator() { assert.equal(f.b.admission.occupants[0], 0); f.u.inside = null
      f.u.resident = undefined; f.p.building = null },
    planExitPoint() { assert.fail('Hut does not use plan geometry') } }
  assert.equal(removeBuildingOccupant(context, f.b.admission, f.p, effects), f.p)
  assert.equal(f.p.renderFlags & 16, 0); assert.deepEqual(f.p.displacement, { x: 0, y: 0, h: 0 })
  // A subsequent public command may create a different active movement owner.
  // The checker deliberately proves only the earlier exact mode1 insertion.
  const active = structuredClone(f.p); f.u.native = active; f.w.objectCells.objects.set(13, active)
  active.commands[0] = 1; active.state = 10; active.previousState = 17; active.commandStatus = 3
  f.w.lastOrderTurn = 800; f.canvas.emit('pointerup')
  f.scene.gameClock.beforeTurn(); active.commands[0] = 0; active.state = rules.personModels[2].idleState
  active.previousState = 10; active.commandStatus = 0; f.w.turn++
  f.scene.gameClock.afterTurn(); f.scene.renderer.render(f.scene.scene, f.scene.camera)
  const e = api.close(); assertResidentDeparture(e, 13, 37)
  assert.equal(e.departures[0].personBuilding, 37); assert.ok(e.frames.departure)
  assert.equal(e.moves[0].ended.native.id, 13)
})

test('clone admission, live ownership, cancelled/replaced orders and wrong render are rejected', async t => {
  const f = fixture(t), api = await install(f.spec)
  api.armEntry(); f.canvas.emit('pointerdown')
  orders.prepareBuildingEntryOrder(f.w.buildingOrders.records[1], 37, 0, 0, false)
  f.w.buildingOrders.records[1].references = 1; f.p.commands[0] = 1
  f.canvas.emit('pointerup'); f.scene.gameClock.beforeTurn(); f.complete()
  f.u.resident.person = structuredClone(f.p); f.scene.gameClock.afterTurn()
  assert.equal(api.read().admission.samePerson, false)
  f.u.native = f.p
  assert.throws(() => assertPassiveResident(api.read().latest, 13, 37))
  f.scene.renderer.render.call({ ...f.scene.renderer }, f.scene.scene, f.scene.camera)
  assert.deepEqual(api.read().frames, {})
  f.u.native = f.p; f.u.inside = null; f.u.work = null; f.p.commands[0] = 1
  Object.assign(f.w.buildingOrders.records[1], { model: 3, a: f.p.x, b: f.p.y })
  f.w.objectCells.objects.set(13, f.p); f.w.lastOrderTurn = 800
  api.armMove('initial-exit'); f.canvas.emit('pointerup')
  f.w.buildingOrders.records[1].flags |= 1; f.scene.gameClock.afterTurn()
  assert.match(api.read().errors.join('\n'), /command replaced/)
})

test('entry without an observed nonzero allocation cannot claim released references', async t => {
  const f = fixture(t), api = await install(f.spec)
  f.u.entry = undefined; f.u.native = f.p
  api.armEntry(); f.canvas.emit('pointerdown'); f.canvas.emit('pointerup')
  f.complete(); f.scene.gameClock.afterTurn()
  assert.equal(api.read().admission, null)
  assert.match(api.close().errors.join('\n'), /lacks the observed nonzero command8 allocation/)
})

for (const invalid of ['missing', 'wrong-target', 'cancelled', 'references', 'replaced'])
test(`first entry allocation rejects ${invalid}`, async t => {
  const f = fixture(t), api = await install(f.spec)
  f.u.entry = undefined; f.u.native = f.p
  api.armEntry(); f.canvas.emit('pointerdown'); f.canvas.emit('pointerup')
  f.u.native = null; f.u.entry = { person: f.p }
  orders.prepareBuildingEntryOrder(f.w.buildingOrders.records[1], 37, 0, 0, false)
  f.w.buildingOrders.records[1].references = 1; f.p.commands[0] = 1
  if (invalid === 'missing') f.p.commands[0] = 0
  if (invalid === 'wrong-target') f.w.buildingOrders.records[1].a = 38
  if (invalid === 'cancelled') f.w.buildingOrders.records[1].flags |= 1
  if (invalid === 'references') f.w.buildingOrders.records[1].references = 0
  f.scene.gameClock.afterTurn()
  if (invalid === 'replaced') {
    f.w.buildingOrders.records[2] = structuredClone(f.w.buildingOrders.records[1])
    f.p.commands[0] = 2; f.scene.gameClock.beforeTurn()
  }
  assert.match(api.close().errors.join('\n'), /command8 allocation (missing or changed|replaced)/)
})

test('the first actual entry owner cannot be replaced by a later entry visit', async t => {
  const f = fixture(t), api = await install(f.spec)
  api.armEntry(); f.scene.gameClock.beforeTurn()
  f.u.entry.person = structuredClone(f.p); f.scene.gameClock.beforeTurn()
  f.complete(); f.scene.gameClock.afterTurn()
  assert.match(api.read().errors.join('\n'), /Original entry person replaced/)
})

test('missing render resources, observer exceptions and original primitive throws stay transparent', async t => {
  const f = fixture(t)
  f.scene.gameClock.beforeTurn = () => { throw null }
  const api = await install(f.spec); api.armEntry()
  assert.throws(() => f.scene.gameClock.beforeTurn(), error => error === null)
  f.scene.buildingMeshes.clear(); f.scene.renderer.render(f.scene.scene, f.scene.camera)
  assert.deepEqual(api.read().frames, {}); assert.deepEqual(api.read().errors, [])
  f.scene.world = {}; assert.equal(f.scene.gameClock.afterTurn(), 18)
  assert.match(api.read().errors.join('\n'), /ownership changed/)
  api.close(); assert.throws(() => f.scene.gameClock.beforeTurn(), error => error === null)
})

test('partial installation restores prior methods; foreign APIs and replacements survive close', async t => {
  const f = fixture(t), before = f.scene.gameClock.beforeTurn
  const after = f.scene.gameClock.afterTurn; f.scene.gameClock.afterTurn = null
  await assert.rejects(install(f.spec), /Missing resident observation/)
  assert.equal(f.scene.gameClock.beforeTurn, before)
  f.scene.gameClock.afterTurn = after
  const api = await install(f.spec), foreign = {}, callback = () => 23
  window.hutResidentWitness = foreign; f.scene.gameClock.beforeTurn = callback
  const e = api.close(); api.close()
  assert.equal(window.hutResidentWitness, foreign); assert.equal(f.scene.gameClock.beforeTurn, callback)
  assert.match(e.errors.join('\n'), /Foreign replacement/); assert.match(e.errors.join('\n'), /Foreign resident API/)
  delete window.hutResidentWitness
})

test('trusted Save/typed committed read and Load publication preserve within-world fields', async t => {
  const f = fixture(t), api = await install(f.spec); f.complete(); f.w.paused = true
  const saveButton = element(), loadButton = element()
  saveButton.textContent = 'Save checkpoint'; loadButton.textContent = 'Load checkpoint'
  globalThis.document = { querySelectorAll: () => [saveButton, loadButton] }
  const save = installResidentCheckpointBoundary({ kind: 'save' }); saveButton.emit('click')
  const saved = save.read(); assert.equal(saved.admitted, true); assertPassiveResident(saved.summary, 13, 37)
  const committed = structuredClone(window.hutResidentCheckpointRecord)
  assert.equal(committed.world.odd, Infinity); assert.ok(committed.world.typed instanceof Uint16Array)
  assert.ok(committed.world.objectCells.objects instanceof Map)
  globalThis.indexedDB = { databases: async () => [{ name: 'populous-new-dawn' }], open() {
    const request = {}; queueMicrotask(() => { request.result = { close() {}, transaction(name, mode) {
      assert.equal(name, 'checkpoints'); assert.equal(mode, 'readonly')
      const tx = { objectStore() { return { get(key) { assert.equal(key, 'latest')
        const read = { result: committed }; queueMicrotask(() => tx.oncomplete()); return read } } } }
      return tx
    } }; request.onsuccess() }); return request
  } }
  assertResidentCommitted(await readResidentCommitted(), saved)
  const life = committed.world.units[0].resident.person.life
  committed.world.units[0].resident.person.life--
  assert.throws(() => assertResidentCommitted({ version: 2, summary: saved.summary }, saved))
  assert.throws(() => assertResidentCommitted({ version: 1, summary: api.summary(committed.world) }, saved))
  assert.notDeepEqual((await readResidentCommitted()).summary, saved.summary)
  committed.world.units[0].resident.person.life = life
  assert.deepEqual(save.close().errors, [])
  const load = installResidentCheckpointBoundary({ kind: 'load' })
  api.close(); loadButton.emit('click')
  const restored = structuredClone(committed.world); f.store.publish(restored)
  restored.paused = false // Shipped Page callback follows synchronous publication.
  const loaded = load.read(); assert.deepEqual(loaded.summary, saved.summary)
  assert.deepEqual(load.close().errors, []); assert.equal(f.subscriptions.size, 0)
  f.scene.world = restored
  const fresh = await install(f.spec)
  assertPassiveResident(fresh.read().latest, 13, 37)
  assert.notEqual(restored.units[0].resident.person, f.p)
  assert.equal(fresh.world, restored); fresh.close()
})

test('checkpoint untrusted admission and foreign replacement retain errors without mutation', async t => {
  const f = fixture(t); const api = await install(f.spec); f.complete()
  const button = element(); button.textContent = 'Load checkpoint'
  globalThis.document = { querySelectorAll: () => [button] }
  const observer = installResidentCheckpointBoundary({ kind: 'load' })
  button.emit('click', { isTrusted: false }); f.store.publish(structuredClone(f.w))
  assert.match(observer.read().errors.join('\n'), /Trusted checkpoint|before trusted/)
  const foreign = {}; window.hutResidentCheckpointRecord = foreign
  assert.match(observer.close().errors.join('\n'), /Foreign checkpoint/)
  assert.equal(window.hutResidentCheckpointRecord, foreign); api.close()
})

test('resident panel observes selection after its existing public handler and restores only itself', t => {
  const f = fixture(t); f.complete(); const button = element(), panel = { hidden: false, querySelector: () => button }
  f.scene.buildingPanels.set(37, panel); f.w.selected = []
  button.addEventListener('click', () => { f.w.selected = [13] })
  const observer = installResidentPanelSelection({ hutId: 37, unitId: 13 })
  button.emit('click'); const e = observer.close()
  assert.deepEqual(e.event.selected, [13]); assert.equal(e.event.trusted, true)
  assert.equal(e.event.inside, 37); assert.equal(button.listeners.length, 1)
})

for (const selection of [[30], [13]]) test(`actual Escape and panel selection compose from ${selection}`, t => {
  const f = fixture(t); f.complete(); f.w.selected = [...selection]
  f.w.units.push({ id: 30, kind: 'shaman', team: 'blue', hp: 100, inside: null, path: [] })
  const button = element(), panel = { hidden: false, querySelector: () => button }
  f.scene.buildingPanels.set(37, panel)
  const active = { closest: () => null }; globalThis.document = { activeElement: active }
  // Execute the actual current Page key callback, supplying only its React,
  // audio and unrelated key boundaries; Escape consumes real cancelInteraction.
  const pageSource = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  const match = /const key = (\(e: KeyboardEvent\) => \{[\s\S]*?\n {4}\})\n {4}window\.addEventListener\('keydown', key\)/.exec(pageSource)
  assert.ok(match)
  const source = match[1].replace(': KeyboardEvent', '').replaceAll(' as HTMLElement', '')
  const key = Function('world', 'store', 'ready', 'SPELLS', 'tutorialLevel', 'cancelInteraction', 'update',
    `return (${source})`)(f.w, { getWorld: () => f.w, change: fn => fn(f.w) }, true, SPELLS, 0, cancelInteraction, () => {})
  window.addEventListener('keydown', key)
  const clearing = installResidentSelectionClear()
  window.emit('keydown', { key: 'Escape', code: 'Escape', target: active })
  const cleared = clearing.close(); assert.equal(cleared.event.trusted, true)
  assert.deepEqual(cleared.event.after.selected, []); assert.equal(cleared.event.after.mode, null)
  button.addEventListener('click', () => selectBuildingOccupants(f.w, f.b, 13, false))
  const selecting = installResidentPanelSelection({ hutId: 37, unitId: 13 })
  button.emit('click'); assert.deepEqual(selecting.close().event.selected, [13])
  assert.equal(f.u.inside, 37); assert.equal(f.w.lastOrderTurn, 799)
  assert.equal(f.w.randomState, 123); assert.equal(f.u.resident.person, f.p)
  window.removeEventListener('keydown', key)
})

function ownUnitFixture(t, picked = 13) {
  const f = fixture(t)
  f.u.entry = undefined; f.u.native = f.p; f.u.work = null; f.p.building = null; f.p.flags2 = 0x20000
  f.p.state = 19; f.w.selected = []; f.w.manaWorld = { gameFlags: 0 }
  f.w.land = createNativeTerrain(new Int16Array(16384).fill(64)); f.w.landVersion = f.w.terrainVersion = 0
  f.w.sounds = []; f.w.soundSerial = 0; f.w.shrines = []; f.w.trees = []; f.w.vehicles = []
  f.w.units.push({ ...f.u, id: 14, native: { ...f.p, id: 14 } })
  Object.assign(f.scene, { overviewActive: false, overviewStage: 0, dragActive: { value: false },
    globeMotion: { dragging: false }, cameraPosition: {}, pointerButtons: 0,
    unitMeshes: new Map(), selectionOverlay: { visible: false }, acknowledgePointer() {}, onSound() {}, onChange() {},
    picking: { pickPerson: () => picked, pick: () => picked },
    pick: () => ({ x: f.u.x, z: f.u.z }), pickWorldObject: () => null })
  Object.assign(f.canvas, { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 }), setPointerCapture() {} })
  globalThis.document = { elementFromPoint: () => f.canvas }
  const source = readFileSync(new URL('../app/scene-input-runtime.ts', import.meta.url), 'utf8')
  const bindings = { ...drag, ...math, nativePosition, canOrder, selectUnit, blastPersonTargeting,
    command: () => assert.fail('An own-unit selection must not dispatch an order') }
  const actual = name => {
    const start = source.indexOf(`export function ${name}(`), end = source.indexOf('\nexport function ', start + 1)
    assert.ok(start >= 0 && end > start)
    const body = stripTypeScriptTypes(source.slice(start, end).replace('export ', ''))
    return Function(...Object.keys(bindings), `${body}; return ${name}`)(...Object.values(bindings))
  }
  const down = actual('pointerDown'), up = actual('pointerUp'), update = actual('updateDrag'), pickUnit = actual('pickUnit')
  f.scene.pickUnit = event => pickUnit(f.scene, event)
  f.scene.updateDrag = event => update(f.scene, event)
  f.canvas.addEventListener('pointerdown', event => down(f.scene, event))
  f.canvas.addEventListener('pointerup', event => up(f.scene, event))
  const point = { x: 420, y: 380 }
  return { ...f, point, click() {
    for (const [type, buttons] of [['pointerdown', 1], ['pointerup', 0]])
      f.canvas.emit(type, { buttons, pointerId: 1, clientX: point.x, clientY: point.y })
  } }
}

test('actual own-unit pointerDown/updateDrag/pointerUp/selectUnit select only original Brave13', async t => {
  const f = ownUnitFixture(t), originalPick = f.scene.pickUnit
  const api = await browserCall(installOutsideBraveSelection, { unitId: 13, point: f.point })
  assertOutsideBraveReady(api.read().initial); f.click()
  assertOutsideBraveSelection(api.close())
  assert.equal(f.scene.pickUnit, originalPick); assert.equal(f.canvas.listeners.length, 2)
  assert.deepEqual(f.w.selected, [13]); assert.equal(f.w.lastOrderTurn, 799)
  assert.equal(f.w.randomState, 123)
})

test('wrong actual own-unit pick fails after one click and restores the observer', async t => {
  const f = ownUnitFixture(t, 14), originalPick = f.scene.pickUnit
  const api = await browserCall(installOutsideBraveSelection, { unitId: 13, point: f.point })
  f.click(); const e = api.close()
  assert.throws(() => assertOutsideBraveSelection(e))
  assert.deepEqual(f.w.selected, [14]); assert.equal(f.scene.pickUnit, originalPick)
  assert.equal(f.canvas.listeners.length, 2); assert.equal(e.events.length, 2)
})

test('outside selection rejects changed synchronous orders and an already-inside target', async t => {
  const f = ownUnitFixture(t)
  f.canvas.addEventListener('pointerup', () => { f.p.immediateCommand = 1; f.w.lastOrderTurn++ })
  const api = await browserCall(installOutsideBraveSelection, { unitId: 13, point: f.point })
  f.click(); assert.throws(() => assertOutsideBraveSelection(api.close()))
  f.u.inside = 37
  const closed = await browserCall(installOutsideBraveSelection, { unitId: 13, point: f.point })
  assert.throws(() => assertOutsideBraveReady(closed.read().initial)); closed.close()
})

test('roster retains all original identities and current orders even when fixed Hut is empty', async t => {
  const f = fixture(t); f.b.anchor = { x: 64512, y: 54784 }; f.b.x = -11; f.b.z = 33
  f.w.speed = 1; f.p.commands[0] = 1
  const roster = await browserCall(readHutResidentRoster)
  assert.deepEqual(roster.braves.map(unit => unit.id), [13, 14, 15, 16, 17, 18])
  assert.deepEqual(roster.residents, []); assert.equal(roster.hut.admission.inside, 0)
  assert.equal(roster.braves[0].owners.entry.orderId, 1)
  assert.equal(roster.braves[0].owners.entry.order.model, 3)
  assert.equal(roster.braves[1].missing, true)
})

for (const primary of [undefined, null, false, 0, 'failure']) test(`cleanup keeps primitive primary ${String(primary)}`, async () => {
  const report = {}, calls = [], frames = { frames: { entry: {} }, closed: true }
  const handle = { evaluate: async fn => fn({ close() { calls.push('close'); return frames } }),
    dispose: async () => { calls.push('dispose'); throw new Error('dispose') } }
  await assert.rejects(finishResidentHandles([['witness', handle]], report, () => { throw new Error('save') },
    { failed: true, failure: primary }, value => { calls.push('frames'); assert.equal(value, frames) }), error => error === primary)
  assert.deepEqual(calls, ['close', 'frames', 'dispose']); assert.equal(report.witness, frames)
})
