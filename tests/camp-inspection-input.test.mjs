import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { campStartup, assertCampStartup, campGround, selectCampPlan, assertCampPlacement, campCompletion } from '../scripts/local-render/camp-inspection-input.mjs'
import campInspection from '../scripts/local-render/camp-inspection.mjs'

const root = process.env.CAMP_INSPECTION_PRODUCT_ROOT ?? new URL('..', import.meta.url).pathname
const source = file => readFileSync(resolve(root, file), 'utf8')
const body = (file, start, end) => {
  const text = source(file), first = text.indexOf(start), last = text.indexOf(end, first)
  assert.ok(first >= 0 && last > first)
  return stripTypeScriptTypes(text.slice(first, last).replace(/^export /, ''))
}

test('Mission 2 entry stays a named existing-runner scenario', () => {
  assert.equal(typeof campInspection, 'function')
  const driver = readFileSync(new URL('../scripts/local-render/camp-inspection.mjs', import.meta.url), 'utf8')
  assert.match(driver, /episodeMs: 300000/); assert.match(driver, /constructionMs: 180000, reservedTailMs: 60000/)
  assert.ok(driver.indexOf('await input.view(report.declaration.ground)') < driver.indexOf('await selectCampPlan'))
  assert.ok(driver.indexOf('await naturalBoundary(ground)') < driver.indexOf('await selectCampPlan'))
  assert.ok(driver.indexOf('assert.ok(campCompletion(report.completed, hut))') < driver.indexOf('await clear()'))
  assert.ok(driver.indexOf('await clear()') < driver.indexOf("await phase('camp-initial', named)"))
  assert.match(driver, /assertHutCheckpointRestore\(committed, loaded.typed\)/)
  assert.match(driver, /checkpointSha256 === saved.typed.checkpointSha256/)
})

test('live startup uses converted Brave identities and actual shipped order eligibility', async () => {
  const canOrder = Function('unitAnimationSource', `${body('app/selection-runtime.ts', 'export function canOrder(', '\nexport function select(')};return canOrder`)(u => u.native)
  const world = { outcome: { level: 2 }, status: 'playing', speed: 1, paused: false, mode: null,
    unlockedCamp: true, selected: [57], turn: 300, buildings: [], units: [
      { id: 57, kind: 'shaman', team: 'blue', hp: 100, native: { flags2: 0 } },
      ...Array.from({ length: 8 }, (_, i) => ({ id: 1000 + i, kind: 'brave', team: 'blue', hp: 100, native: { flags2: 0 } })),
      { id: 64, kind: 'brave', team: 'blue', hp: 100, native: { flags2: 0x100000 } }] }
  const result = await campStartup({ scene: { world }, canOrder })
  assertCampStartup(result); assert.deepEqual(result.braves.map(u => u.id), Array.from({ length: 8 }, (_, i) => 1000 + i))
  for (const change of [r => { r.braves.pop() }, r => { r.speed = 0 }, r => { r.level = 1 }, r => { r.camps = [4] }]) {
    const bad = structuredClone(result); change(bad); assert.throws(() => assertCampStartup(bad))
  }
})

test('rendered camp preparation isolates terrain synchronization and never focuses or renders', async () => {
  const world = { land: { flags: new Uint16Array([2]) } }, canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) }
  const point = { x: -99, z: -105 }, scene = { world, renderer: { domElement: canvas, info: { render: { frame: 17 } } }, frame: 9,
    screen: () => ({ x: 0, y: 0 }), pick: () => point, picking: { pick: () => null } }
  let calls = 0
  const result = await campGround({ preferred: point, deadlineAt: Date.now() + 1000, scene,
    doc: { elementFromPoint: () => canvas }, placementError: w => { assert.notEqual(w, world); w.land.flags[0] = 8; calls++; return null },
    buildingPlanPose: w => { assert.notEqual(w, world); return { anchorX: 1, anchorY: 2, angle: 3 } } })
  assert.equal(world.land.flags[0], 2); assert.equal(calls, 2); assert.deepEqual(result.anchor, { x: 1, y: 2 })
  assert.deepEqual([result.x, result.y, result.sceneFrame, result.rendererFrame], [400, 300, 9, 17])
})

test('public camp prefix preserves Shift selection, actual tab labels and mode prerequisites', async () => {
  const calls = [], value = { mode: null, speed: 1, paused: false, unlockedCamp: true, selected: [57, 1000], braves: [{ id: 1000 }] }
  const page = { getByLabel(name, options) {
    assert.equal(options.exact, true)
    return { async click(options) { calls.push(name); if (name === 'Select brave') assert.deepEqual(options.modifiers, ['Shift']); else { assert.equal(name, 'buildings B'); value.mode = null } } }
  }, getByRole(role, options) {
    assert.equal(role, 'button'); assert.equal(options.name, 'Warrior Training Hut, 8 wood'); assert.equal(options.exact, true)
    return { async click() { calls.push(options.name); value.mode = 'camp' } }
  }, async evaluate(fn) { assert.equal(fn, campStartup); return value } }
  const result = await selectCampPlan({ page, action: async (_label, run) => run(), remaining: () => 100 })
  assert.deepEqual(calls, ['Select brave', 'buildings B', 'Warrior Training Hut, 8 wood']); assert.equal(result.mode, 'camp')
  value.selected = [57]
  await assert.rejects(selectCampPlan({ page, action: async (_label, run) => run(), remaining: () => 100 }), /eligible Brave/)
})

test('actual placeBuilding body assigns selected reachable workers and a created plan alone is insufficient', () => {
  const placeBody = body('app/live-command.ts', 'export function placeBuilding(', '\n// Shared browser target adapter')
  const adopt = Function('currentPersonOrder', `${body('app/live-movement.ts', 'export function adoptLiveOrders(', '\n// Player clicks append')};return adoptLiveOrders`)(
    (pool, person) => pool.records[person.immediateCommand || person.commands[person.commandCursor]])
  const world = { paused: false, status: 'playing', unlockedCamp: true, mode: 'camp', selected: [57, 1000, 1001],
    buildings: [], units: [{ id: 57, kind: 'shaman', team: 'blue', hp: 100 },
      ...[1000, 1001].map(id => ({ id, kind: 'brave', team: 'blue', hp: 100, native: { id, commands: Array(8).fill(0), commandCursor: 0, immediateCommand: 0 } }))],
    buildingOrders: { records: [null], cursor: 0 } }
  const bindings = { BUILDINGS: [{ id: 'camp', name: 'Warrior Training Hut', cost: 8 }], tell() {},
    buildingPlanPose: () => ({ anchorX: 2, anchorY: 4, angle: 0 }), browserPosition: () => ({ x: -99, z: -105 }),
    placementError: () => null, canOrder: u => u.hp > 0, distance: u => u.id, findPath: (_w, u) => u.id === 1000 ? [{}] : [],
    rules: { buildingMaxWorkers: { 7: 16 } }, buildingModel: () => 7,
    addBuilding(w, team, kind) { const b = { id: 1010, team, kind, hp: 800, progress: 0, anchor: { x: 2, y: 4 } }; w.buildings.push(b); return b },
    allocatePersonOrder(pool) { pool.records.push({}); return 1 }, writePersonOrder(order, model, a, b, flags) { Object.assign(order, { model, a, b, flags }) },
    release() {}, startLiveOrder(_w, u, id) { u.native.commands[0] = id },
    startLiveConstructionOrder(w, u) { u.builder = {}; w.buildings[0].builders[0] = u.id; adopt(w, u, u.native); return true },
    route() {}, entrance: () => ({}) }
  const place = Function(...Object.keys(bindings), `${placeBody};return placeBuilding`)(...Object.values(bindings))
  const snapshot = () => structuredClone({ turn: 10, selected: world.selected, mode: world.mode, orders: world.buildingOrders,
    construction: { camps: world.buildings, workers: world.units.filter(u => u.builder).map(u => ({ ...u, orderOwner: 'builder.person', orderOwnerIdentity: 1, orderPersonId: u.builder.person.id, commands: u.builder.person.commands, commandCursor: u.builder.person.commandCursor, immediateCommand: u.builder.person.immediateCommand })) } })
  const before = snapshot(); assert.equal(place(world, 'camp', { x: -99, z: -105 }), true); const after = snapshot()
  const row = type => ({ phase: 'place-camp', kind: 'input', type, trusted: true, canvasOwned: true, canvasTarget: true,
    button: 0, x: 400, y: 300, modifiers: [false, false, false, false], before, after })
  const rows = [row('pointerdown'), row('pointerup')], ground = { x: 400, y: 300, anchor: { x: 2, y: 4 } }
  assert.deepEqual(assertCampPlacement(rows, ground).recipients, [1000])
  const bad = structuredClone(rows); bad[1].after.construction.workers = []
  assert.throws(() => assertCampPlacement(bad, ground), /worker admission/)
})

test('progress completion waits for actual crew departure and empty admission ownership', () => {
  const camp = { id: 1010, identity: 1, hp: 800, progress: 1, builders: [0, 0], admission: {
    inside: 0, occupants: [0, 0, 0, 0, 0, 0], queueHead: 0, queueFrom: 0, entering: 0, entryTimer: 0, activity: 8 } }
  const state = { level: 2, status: 'playing', speed: 1, paused: false, construction: { camps: [camp], workers: [] } }
  assert.equal(campCompletion(state, camp), true)
  for (const change of [s => { s.construction.camps[0].progress = 0.9 }, s => { s.construction.camps[0].preparation = {} },
    s => { s.construction.camps[0].builders[0] = 1000 }, s => { s.construction.workers.push({ id: 1000, work: 1010 }) },
    s => { s.construction.camps[0].admission.inside = 1 }, s => { s.construction.camps[0].admission.queueHead = 1000 },
    s => { s.construction.camps[0].admission.activity |= 128 }, s => { s.construction.camps[0].admission.activity |= 0x8000 }]) {
    const bad = structuredClone(state); change(bad); assert.equal(campCompletion(bad, camp), false)
  }
  const replaced = structuredClone(state); replaced.construction.camps[0].identity++
  assert.throws(() => campCompletion(replaced, camp), /replaced/)
})


test('retained ordinary01 boundary fails closed when the queue owner was not observed', () => {
  const observed = JSON.parse(readFileSync(new URL('./fixtures/camp-inspection-ordinary01-placement.json', import.meta.url), 'utf8'))
  assert.equal(observed.provenance.reportSha256, 'dcdd2a379f38ce78c5dea741fe69f7daec5026b2fed57e7df40ec67d90a229b2')
  assert.equal(observed.records[1].after.construction.camps[0].id, 1022)
  assert.equal(observed.records[1].after.construction.workers.length, 9)
  assert.equal(observed.records[1].after.orders.records[29].references, 9)
  assert.throws(() => assertCampPlacement(observed.records, observed.ground), /Actual construction queue owner missing for worker 278/)
})
