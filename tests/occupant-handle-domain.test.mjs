import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, addBuilding, createWorld, setSelection, command, tick } from '../app/model.ts'
import { retainFixtureUnits } from './level-start-fixture.mjs'
import { objectsInCell } from '../app/object-cells.ts'
import { createGameStore } from '../app/game-store.ts'

// Supplied allocation-boundary fixture; all entry/exit/training uses public orders.
// Browser handles are not native pool indices and must not alias at16 bits.
for (const id of [32767, 32768, 65535, 65536]) {
  test(`ordinary hut exit retains full person handle ${id}`, async () => {
    const store = createGameStore()
    store.startMission(1)
    const w = store.getWorld()
    retainFixtureUnits(w, u => u.team !== 'blue' || u.kind === 'shaman')
    const hut = w.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
    const camp = addBuilding(w, 'blue', 'camp', { x: 9, z: 41 }, true)
    w.nextId = id
    const u = addUnit(w, 'blue', 'brave', { x: 7, z: 33 })
    const until = (condition, limit = 1000) => {
      for (let n = 0; n < limit && !condition(); n++) tick(w, 1 / 12)
      assert.ok(condition(), `condition at ${w.turn}`)
    }
    setSelection(w, [u.id])
    assert.ok(command(w, hut))
    until(() => u.inside === hut.id && !!u.resident)
    assert.equal(hut.admission.occupants.filter(x => x === id).length, 1)
    setSelection(w, [u.id])
    assert.ok(command(w, { x: 7, z: 33 }))
    assert.equal(u.inside, null)
    assert.ok(!hut.admission.occupants.includes(id))
    assert.equal(hut.admission.inside, 0)
    const p = u.native
    assert.ok(p)
    assert.equal(w.objectCells.objects.get(id), p)
    assert.ok([...objectsInCell(w.objectCells, (p.y & 0xfe00) | ((p.x >>> 8) & 254))].includes(p))
    setSelection(w, [id])
    assert.ok(command(w, camp))
    until(() => u.inside === camp.id)
    assert.ok(camp.admission.occupants.includes(id))
    assert.ok(!hut.admission.occupants.includes(id))
    await store.saveCheckpoint()
    assert.ok(store.loadCheckpoint())
    const replay = store.getWorld()
    assert.deepEqual(replay, w)
    for (let n = 0; n < 64; n++) {
      tick(w, 1 / 12)
      tick(replay, 1 / 12)
      assert.deepEqual(replay, w)
    }
  })
}

test('live occupant aliases sharing low16 bits leave only their exact slot', () => {
  const w = createWorld(1)
  retainFixtureUnits(w, u => u.team !== 'blue' || u.kind === 'shaman')
  const hut = w.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
  const people = []
  for (const id of [33332, 98868]) {
    w.nextId = id
    people.push(addUnit(w, 'blue', 'brave', { x: 7, z: 33 }))
  }
  setSelection(
    w,
    people.map(u => u.id)
  )
  assert.ok(command(w, hut))
  for (let n = 0; n < 1000 && !people.every(u => u.resident); n++) tick(w, 1 / 12)
  assert.ok(people.every(u => u.inside === hut.id && u.resident))
  for (const [index, u] of people.entries()) {
    setSelection(w, [u.id])
    assert.ok(command(w, { x: 7, z: 33 }))
    assert.equal(u.inside, null)
    assert.ok(!hut.admission.occupants.includes(u.id))
    assert.equal(hut.admission.inside, 1 - index)
    if (!index) {
      assert.equal(people[1].inside, hut.id)
      assert.ok(hut.admission.occupants.includes(people[1].id))
    }
  }
})

test('native slot comparison retains signed-word semantics without the live adapter', async () => {
  const { removeBuildingOccupant, leaveBuilding } = await import('../app/building-occupants.ts')
  const p = { id: 33332, tribe: 0, x: 0, y: 0 },
    b = { id: 10, inside: 1, occupants: [33332, 0, 0, 0, 0, 0] },
    w = {
      people: new Map([[p.id, p]]),
      buildings: new Map([[b.id, b]]),
      buildingAt: () => 0,
      tribes: [{ buildingIds: [10] }],
    }
  const before = structuredClone(b)
  assert.equal(removeBuildingOccupant(w, b, p, {}), undefined)
  leaveBuilding(w, p, {})
  assert.deepEqual(b, before)
})

test('wide live cell heads preserve full handles, native order and checkpoint continuation', async () => {
  const { insertObjectIntoCell, removeObjectFromCell, moveObjectInCells, cellObjectOrder } =
    await import('../app/object-cells.ts')
  const { createGameStore, migrateCheckpoint } = await import('../app/game-store.ts')
  const store = createGameStore()
  store.startMission(1)
  const w = store.getWorld()
  tick(w, 1 / 12)
  // Controlled intact legacy representation, before any high-handle allocation.
  w.objectCells.heads = new Uint16Array(w.objectCells.heads)
  const order = cellObjectOrder(w.objectCells),
    heads = [...w.objectCells.heads]
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restoredLegacy = store.getWorld()
  assert.ok(restoredLegacy.objectCells.heads instanceof Float64Array)
  migrateCheckpoint(w)
  assert.deepEqual(restoredLegacy, w)
  assert.ok(w.objectCells.heads instanceof Float64Array)
  assert.deepEqual([...w.objectCells.heads], heads)
  assert.deepEqual(cellObjectOrder(w.objectCells), order)
  const cells = { heads: new Float64Array(16384), objects: new Map() }
  const pair = [33332, 98868, 65536, 4294967296].map(id => ({
    id,
    x: 1024,
    y: 1024,
    h: 0,
    flags2: 0,
    flags3: 0,
    cellNext: 0,
    cellPrevious: 0,
    displacement: { x: 0, y: 0, h: 0 },
  }))
  for (const p of pair) {
    cells.objects.set(p.id, p)
    insertObjectIntoCell(cells, p, p)
  }
  assert.deepEqual(
    [...objectsInCell(cells, 1028)].map(p => p.id),
    pair.map(p => p.id).reverse()
  )
  assert.equal(moveObjectInCells(cells, pair[0], { x: 1025, y: 1025, h: 0 }), false)
  assert.equal(moveObjectInCells(cells, pair[0], { x: 2048, y: 1024, h: 0 }), true)
  assert.deepEqual(
    [...objectsInCell(cells, 1032)].map(p => p.id),
    [33332]
  )
  removeObjectFromCell(cells, pair[3])
  assert.deepEqual(
    [...objectsInCell(cells, 1028)].map(p => p.id),
    [65536, 98868]
  )
  // Actual public save/load retains the widened representation and world aliases.
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(replay, w)
  for (let n = 0; n < 64; n++) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, w)
  }
})

test('live handle decoder also preserves exact identity in the fallback building scan', async () => {
  const { leaveBuilding, removeBuildingOccupant } = await import('../app/building-occupants.ts')
  const { buildingAdmission } = await import('../app/live-building-entry.ts')
  const { createLivePerson } = await import('../app/live-people.ts')
  const world = createWorld(1),
    hut = world.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
  const b = buildingAdmission(world, hut)
  const people = [33332, 98868].map(id => {
    const p = createLivePerson(
      world,
      world.units.find(u => u.team === 'blue' && u.kind === 'brave')
    )
    p.id = id
    p.flags2 |= 0x800000
    return p
  })
  b.inside = 2
  b.occupants = [33332, 98868, 0, 0, 0, 0]
  const context = {
    people: new Map(people.map(p => [p.id, p])),
    buildings: new Map([[b.id, b]]),
    occupantId: id => id,
    buildingAt: () => 0,
    tribes: [{ buildingIds: [b.id] }],
    orders: world.buildingOrders,
    turn: 0,
    towerTribes: 0,
  }
  const effects = { terrainHeight: () => 0, insertCell: () => {}, updateIndicator: () => {} }
  leaveBuilding(context, people[0], effects)
  assert.deepEqual(b.occupants, [0, 98868, 0, 0, 0, 0])
  assert.equal(b.inside, 1)
  assert.equal(removeBuildingOccupant(context, b, people[1], effects), people[1])
  assert.deepEqual(b.occupants, [0, 0, 0, 0, 0, 0])
  assert.equal(b.inside, 0)
})
