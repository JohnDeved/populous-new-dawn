import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createCapacityPolicy, populationCeiling, restoreCapacityPolicy } from '../app/capacity-policy.ts'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { createWorld, addUnit, addBuilding, HOME, populationLimit, syncLandscapeObjects } from '../app/model.ts'
import { createWorldState } from '../app/world-state.ts'
import { createConvertWild, stepConvertWild } from '../app/convert-wild.ts'
import { allocatePersonOrder, attachPersonOrder, clearPersonOrders, commitPersonOrders,
  createPersonOrderPool, emptyPersonOrder, removePersonOrder } from '../app/person-orders.ts'
import { clearFollowingBoardingOrders } from '../app/vehicle-boarding-orders.ts'

const effects = {
  prepare: (order, model, a, b, flags = 0) => Object.assign(order, { model, a, b, flags }),
  stopWork() {}, releaseSpell() {}, deleteObject() {}, releaseFight() {},
}
const person = id => ({ id, model: 2, state: 10, substate: 0, x: 0, y: 0,
  flags2: 0, flags3: 0, flags4: 0, assignment: 0, selectionFlags: 128,
  commands: Array(8).fill(0), commandCursor: 0, immediateCommand: 0,
  orderLocation: 0, commandStatus: 0, workTarget: 0 })

test('new browser games are scalable; authored IDs and classic creation remain unchanged', async () => {
  const classic = createWorld(), store = await createCampaignFixtureStore([2]), scalable = store.getWorld()
  assert.deepEqual(classic.capacityPolicy, { version: 1, mode: 'classic' })
  assert.deepEqual(scalable.capacityPolicy, { version: 1, mode: 'scalable' })
  assert.deepEqual(scalable.units, classic.units)
  assert.deepEqual(scalable.buildings, classic.buildings)
  assert.deepEqual(scalable.shrines, classic.shrines)
  assert.equal(scalable.randomState, classic.randomState)
  assert.ok(scalable.nextId >= 1024)
  assert.equal(scalable.buildingOrders.scalable, true)
  assert.equal(classic.buildingOrders.scalable, undefined)
  store.restart()
  assert.equal(store.getWorld().capacityPolicy.mode, 'scalable')
  assert.equal(store.startMission(2), true)
  assert.equal(store.getWorld().capacityPolicy.mode, 'scalable')
  assert.throws(() => createCapacityPolicy('unknown'), RangeError)
})

test('scalable housing keeps real hut contributions without the classic 200 ceiling', () => {
  for (const mode of ['classic', 'scalable']) {
    const world = createWorldState(1, mode)
    // Supplied housing only: this isolates capacity, not construction throughput.
    world.buildings = Array.from({ length: 40 }, (_, id) => ({ id: id + 1,
      team: 'blue', kind: 'hut', level: 3, progress: 1, hp: 100 }))
    assert.equal(populationLimit(world, 'blue'), mode === 'classic' ? 200 : 286)
    world.buildings[0].progress = 0.5
    world.buildings[1].hp = 0
    world.buildings[2].team = 'red'
    world.buildings[3].kind = 'tower'
    assert.equal(populationLimit(world, 'blue'), mode === 'classic' ? 200 : 258)
    assert.equal(populationLimit(world, 'red'), 13)
  }
})

test('Convert Wild retains the classic 199/200 boundary and scales recruitment independently of housing', () => {
  for (const mode of ['classic', 'scalable']) for (const count of [199, 200, 201, 1000]) {
    const target = { id: 1, class: 1, model: 1, x: 0x8000, y: 0x8000, h: 100 },
      spell = createConvertWild(target, 0, 0, false), converted = []
    stepConvertWild(spell, { randomState: 1 }, {
      population: () => count, populationCeiling: populationCeiling(createCapacityPolicy(mode)),
      people: cell => cell === 0x8080 ? [target] : [], unsupported: () => false,
      strand() {}, suppressed: () => false, convert: p => converted.push(p.id), sparkle() {},
    })
    assert.equal(converted.length, Number(mode === 'scalable' || count < 200), `${mode}/${count}`)
  }
})

test('scalable allocation crosses 799 live orders and releases/reuses the same wide handle', () => {
  const pool = createPersonOrderPool(true), people = []
  for (let i = 0; i < 1000; i++) {
    const p = person(i + 1), id = allocatePersonOrder(pool)
    Object.assign(pool.records[id], { model: 3, a: i, b: i + 1 })
    attachPersonOrder(pool, p, id, 0, effects)
    people.push(p)
  }
  assert.equal(new Set(people.map(p => p.commands[0])).size, 1000)
  assert.equal(pool.records.length, 1600)
  assert.equal(pool.active, 1000)
  assert.ok(people.at(-1).commands[0] > 799)
  const restored = structuredClone(pool), id = people[900].commands[0]
  removePersonOrder(restored, people[900], 0, effects)
  assert.equal(restored.records[id].references, 0)
  restored.cursor = id
  assert.equal(allocatePersonOrder(restored), id)
  assert.equal(pool.records[id].references, 1, 'save clone is independent')
  for (const p of people.filter((_, i) => i !== 900)) clearPersonOrders(pool, p, effects)
  assert.equal(pool.active, 1)
})

test('scalable group allocation does not alias its last free record across eight queued commands', () => {
  const pool = createPersonOrderPool(true), p = person(1)
  for (let i = 1; i < 799; i++) pool.records[i].references = 1
  pool.active = 798
  pool.cursor = 799
  const group = { count: 8, cursor: 8, records: Array.from({ length: 8 }, (_, i) =>
    ({ ...emptyPersonOrder(), model: 3, a: i * 100, b: i * 100 + 1 })) }
  assert.equal(commitPersonOrders(pool, group, [p], [-1, -1, -1], effects), true)
  assert.equal(new Set(p.commands).size, 8)
  assert.deepEqual(p.commands.map(id => pool.records[id].a), [0, 100, 200, 300, 400, 500, 600, 700])
  assert.equal(pool.active, 806)
  assert.equal(group.count, 0)
})

test('scalable reference and active counts never wrap at ushort boundaries', () => {
  const pool = createPersonOrderPool(true), p = person(1), order = pool.records[1]
  Object.assign(order, { model: 22, references: 65535, a: 7 })
  pool.active = 1
  attachPersonOrder(pool, p, 1, 1, effects)
  assert.equal(order.references, 65536)
  clearFollowingBoardingOrders(pool, p, 2, 1, () => 1, effects.deleteObject)
  assert.equal(order.references, 65535)
  assert.equal(pool.active, 1)
  Object.assign(order, { references: 0 })
  pool.active = 65535 // Isolated arithmetic boundary, not a valid saved pool.
  attachPersonOrder(pool, p, 1, 0, effects)
  assert.equal(pool.active, 65536)
  removePersonOrder(pool, p, 0, effects)
  assert.equal(pool.active, 65535)
  order.references = Number.MAX_SAFE_INTEGER
  const before = structuredClone({ pool, p })
  assert.throws(() => attachPersonOrder(pool, p, 1, 0, effects), RangeError)
  assert.deepEqual({ pool, p }, before)
})

test('scalable stores save and restore mode, expanded pool and exact continuation owners', async () => {
  const store = createGameStore(), world = store.getWorld()
  world.buildingOrders.records.push(...Array.from({ length: 800 }, emptyPersonOrder))
  world.buildingOrders.cursor = 900
  const expected = structuredClone(world)
  await store.saveCheckpoint()
  store.restart()
  assert.equal(store.getWorld().buildingOrders.records.length, 800)
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld(), expected)
  assert.equal(store.getWorld().buildingOrders.cursor, 900)
})

test('missing policy rejects; malformed scalable modes, counts and reservations reject', () => {
  const legacy = createWorld()
  delete legacy.capacityPolicy
  const ids = legacy.units.map(u => u.id), nextId = legacy.nextId
  assert.throws(() => migrateCheckpoint(legacy), RangeError)
  assert.equal(legacy.capacityPolicy, undefined)
  assert.equal(legacy.buildingOrders.scalable, undefined)
  assert.deepEqual(legacy.units.map(u => u.id), ids)
  assert.equal(legacy.nextId, nextId)
  for (const corrupt of [
    w => { w.capacityPolicy.mode = 'unlimited' },
    w => { w.capacityPolicy.version = 2 },
    w => { delete w.capacityPolicy },
    w => { delete w.buildingOrders.scalable },
    w => { w.buildingOrders.active = -1 },
    w => { w.buildingOrders.active = 1 },
    w => { w.buildingOrders.records[1].references = NaN },
    w => { w.buildingOrders.records[1].references = -1 },
    w => { w.buildingOrders.records[1].references = Number.MAX_SAFE_INTEGER + 1 },
    w => { w.buildingOrders.cursor = 800 },
    w => { w.nextId = 1 },
    w => { w.nextId = w.units[0].id },
    w => { w.nextId = Number.MAX_SAFE_INTEGER },
  ]) {
    const world = createWorld(1, 'scalable')
    corrupt(world)
    assert.throws(() => migrateCheckpoint(world), RangeError)
  }
})

test('over 1024 new followers cannot consume later construction handles', () => {
  const world = createWorld(1, 'scalable'), original = new Set(world.units.map(u => u.id))
  for (let i = 0; i < 1100; i++) addUnit(world, 'blue', 'brave', HOME)
  assert.ok(world.units.filter(u => !original.has(u.id)).every(u => u.id >= 1024))
  const nextId = world.nextId, used = new Set([
    ...world.units, ...world.vehicles, ...world.buildings, ...world.shrines,
  ].map(o => o.id))
  for (const x of [-8, 8]) {
    const building = addBuilding(world, 'blue', 'hut', { x, z: 32 })
    assert.ok(building.id > 0 && building.id < 1024 && !used.has(building.id))
    used.add(building.id)
    assert.equal(world.nextId, nextId)
    syncLandscapeObjects(world)
    assert.ok(world.land.buildingIds.some(id => (id & 1023) === building.id))
  }
  assert.doesNotThrow(() => restoreCapacityPolicy(world))
  const restored = migrateCheckpoint(structuredClone(world))
  assert.equal(restored.nextId, nextId)
  assert.deepEqual(restored.buildings, world.buildings)
})

test('terrain handle reuse protects vehicles and linked heads, and exhaustion is non-mutating', () => {
  const world = createWorld(1, 'scalable')
  world.vehicles.push({ id: 1023 })
  world.shrines[0].linkedShrine = { ...structuredClone(world.shrines[0]), id: 1022 }
  const building = addBuilding(world, 'blue', 'hut', { x: 8, z: 32 })
  assert.equal(building.id, 1021)
  world.vehicles = Array.from({ length: 1023 }, (_, i) => ({ id: i + 1 }))
  const before = structuredClone(world)
  assert.throws(() => addBuilding(world, 'blue', 'hut', { x: -8, z: 32 }), /No free terrain building handles/)
  assert.deepEqual(world, before)
})

test('scalable checkpoint counts real queue owners once across registry/controller aliases', async () => {
  const { createLivePerson, registerLivePerson } = await import('../app/live-people.ts')
  const store = createGameStore(), world = store.getWorld(), pool = world.buildingOrders,
    units = [0, 1].map(x => addUnit(world, 'blue', 'warrior', { x, z: 32 })),
    people = units.map(unit => createLivePerson(world, unit)), id = allocatePersonOrder(pool)
  pool.records[id].model = 3
  for (const [i, unit] of units.entries()) {
    unit.native = people[i]
    registerLivePerson(world, people[i])
    world.pathfinding.people.set(unit.id, people[i])
    attachPersonOrder(pool, people[i], id, 0, effects)
  }
  // Controller/registry aliases do not create more queue ownership. Each
  // repeated slot, including the immediate slot, does acquire a reference.
  units[0].fight = { motion: people[0], group: 0, started: 0, opponent: 0 }
  units[0].native = null
  attachPersonOrder(pool, people[0], id, 1, effects)
  attachPersonOrder(pool, people[0], id, -1, effects)
  assert.equal(pool.records[id].references, 4)
  assert.doesNotThrow(() => restoreCapacityPolicy(world))
  for (const count of [1, 3, 5]) {
    const broken = structuredClone(world)
    broken.buildingOrders.records[id].references = count
    assert.throws(() => migrateCheckpoint(broken), /ownership count/, `references=${count}`)
  }
  const orphan = structuredClone(world)
  const unowned = allocatePersonOrder(orphan.buildingOrders)
  orphan.buildingOrders.records[unowned].references = 1
  orphan.buildingOrders.active++
  assert.throws(() => migrateCheckpoint(orphan), /ownership count/)
  for (const cursor of [-1, 8, 0.5, '0']) {
    const broken = structuredClone(world)
    broken.units.find(u => u.id === units[0].id).fight.motion.commandCursor = cursor
    assert.throws(() => migrateCheckpoint(broken), /person-order handle/)
  }
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld(), world)
  const restored = store.getWorld(), first = restored.units.find(u => u.id === units[0].id)
  assert.equal(first.fight.motion, restored.objectCells.objects.get(first.id))
  assert.equal(first.fight.motion, restored.pathfinding.people.get(first.id))
})

test('ordinary initialized campaign queues save/load under scalable ownership validation', async () => {
  const store = await createCampaignFixtureStore([5, 6, 22])
  for (const mission of [1, 5, 6, 22]) {
    assert.equal(store.startMission(mission), true)
    // Existing migration also normalizes authored shrine rewards. Compare the
    // complete migrated world, without dropping queues, IDs or alias assertions.
    const before = migrateCheckpoint(structuredClone(store.getWorld()))
    await store.saveCheckpoint()
    assert.equal(store.loadCheckpoint(), true, `mission ${mission}`)
    assert.deepEqual(store.getWorld(), before)
  }
})

test('live scalable scenery clearance treats bit-10 queue indices as handles, not flags', async () => {
  const { processBuilderWork } = await import('../app/live-construction-runtime.ts')
  const { createLivePerson } = await import('../app/live-people.ts')
  const { buildingFootprintCells, buildingPose } = await import('../app/building-shapes.ts')
  const { browserPosition } = await import('../app/world-coordinates.ts')
  const { SceneryPhase } = await import('../app/building-clearing.ts')
  for (const mode of ['classic', 'scalable']) {
    const world = createWorld(1, mode), building = addBuilding(world, 'blue', 'hut', { x: -2, z: 32 }),
      unit = world.units.find(u => u.kind === 'brave' && u.team === 'blue'),
      p = createLivePerson(world, unit), cell = buildingFootprintCells(buildingPose(building))[0],
      tree = world.trees.find(t => t.model === 1 && t.logs > 0)
    Object.assign(tree, browserPosition({ x: (cell & 127) * 512 + 256, y: (cell >> 7) * 512 + 256 }))
    if (mode === 'scalable') {
      world.buildingOrders.records.push(...Array.from({ length: 800 }, emptyPersonOrder))
      world.buildingOrders.cursor = 1024
      const id = allocatePersonOrder(world.buildingOrders)
      assert.equal(id, 1024)
      world.buildingOrders.records[id].model = 3
      attachPersonOrder(world.buildingOrders, p, id, 2, effects)
    } else p.commands[2] = 1024 // Supplied native guard input, not a classic allocation.
    unit.builder = { task: 3, busy: 0, phase: SceneryPhase.Find, restart: false, person: p }
    world.turn = 0
    processBuilderWork(world, unit, building)
    assert.equal(unit.builder.task, mode === 'scalable' ? 3 : 2)
    assert.equal(p.target, mode === 'scalable' ? tree.id : 0)
    if (mode === 'scalable') assert.equal(unit.builder.phase, SceneryPhase.Approach)
  }
})

test('scalable formation release tests the entire queue handle; classic retains the low byte', async () => {
  const { initializePersonState } = await import('../app/person-state.ts')
  const { createLivePerson } = await import('../app/live-people.ts')
  for (const mode of ['classic', 'scalable']) for (const handle of [0, 255, 256, 799, 1024, 1280]) {
    const world = createWorldState(1, mode), unit = addUnit(world, 'blue', 'brave', HOME),
      p = createLivePerson(world, unit), formations = []
    Object.assign(p, { state: 10, previousState: 1, assignment: 1, flags3: 0, formationCell: 123 })
    p.commands[0] = handle
    initializePersonState({ randomState: 1, instantFacing: false, levelFlags: 0,
      orders: world.buildingOrders, tribes: world.manaTribes }, p, {
      deselectPassengers() {}, rebuildTrainingQueue() {}, releaseMotion() {}, startOrders() {}, setAnimation() {},
      rebuildFormation: cell => formations.push(cell),
    })
    assert.deepEqual(formations, (mode === 'scalable' ? handle : handle & 255) ? [123] : [], `${mode}/${handle}`)
  }
})

test('scalable reservation validation includes recursively linked shrine owners without alias loops', () => {
  for (const id of [1024, Number.MAX_SAFE_INTEGER + 1, -1]) {
    const world = createWorld(1, 'scalable'), root = world.shrines[0]
    root.linkedShrine = { ...root, id, linkedShrine: root }
    const before = structuredClone(world)
    assert.throws(() => restoreCapacityPolicy(world), /object ID/)
    assert.deepEqual(world, before, 'invalid hidden ownership is rejected without rewriting the graph')
  }
  const world = createWorld(1, 'scalable'), root = world.shrines[0]
  root.linkedShrine = world.shrines[1]
  root.linkedShrine.linkedShrine = root
  assert.doesNotThrow(() => restoreCapacityPolicy(world), 'each identity is validated once')
})
