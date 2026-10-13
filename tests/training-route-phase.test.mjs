import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, tick } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { appendLiveOrders } from '../app/live-movement.ts'
import { emptyPersonOrder } from '../app/person-orders.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

// Supplied unobstructed approach; exercise public player and shared AI order
// producers. This checks counter ownership, not original doorway throughput.
function scenario(kind, producer, orderModel = 8) {
  const w = createStartedWorld(1)
  retainFixtureUnits(w, u => u.kind === 'shaman')
  w.manaWorld.gameFlags = 32
  w.terrain.fill(3)
  w.terrainVersion++
  const b = addBuilding(w, 'blue', kind, { x: -2, z: 32 }, true)
  const units = Array.from({ length: 8 }, (_, i) =>
    addUnit(w, 'blue', 'brave', { x: 7 + i * .4, z: 33 }))
  for (const u of units) {
    u.native = createLivePerson(w, u)
    registerLivePerson(w, u.native)
  }
  if (producer === 'human') {
    w.selected = units.map(u => u.id)
    assert.equal(command(w, b), true)
  } else {
    const order = { ...emptyPersonOrder(), model: orderModel, a: b.id }
    assert.deepEqual(appendLiveOrders(w, units, order, true), { accepted: true, count: 8 })
  }
  tick(w, 1 / 12)
  for (const [i, u] of units.entries()) {
    assert.equal(u.native, null)
    assert.equal(w.pathfinding.people.get(u.id), u.entry.person)
    // Retained allocation phases and byte wrap must survive the route adapter.
    u.entry.person.counter = (255 + i) & 255
  }
  return { w, b, units }
}

for (const kind of ['camp', 'temple', 'spyHut', 'firewarriorHut']) {
  for (const producer of ['human', 'ai']) {
    test(`${kind} ${producer} routed entry preserves per-person counter phases through admission`, () => {
      const { w, b, units } = scenario(kind, producer)
      for (let turn = 0; turn < 90; turn++) {
        const before = units.map(u => u.entry.person.counter)
        tick(w, 1 / 12)
        for (const [i, u] of units.entries())
          assert.equal(u.entry.person.counter, (before[i] + 1) & 255,
            `person ${u.id}, turn ${w.turn}: route advancement must not replace the retained phase`)
      }
      assert.equal(b.admission.inside, 5)
      assert.equal(units.filter(u => u.inside === b.id).length, 5)
      assert.ok(b.admission.queueHead)
    })
  }
}

test('checkpoint reload retains training route owner and its distinct phase', () => {
  const { w, b, units } = scenario('camp', 'human')
  const restored = migrateCheckpoint(structuredClone(w))
  assert.ok(restored)
  for (let turn = 0; turn < 90; turn++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    for (const u of units) {
      const actual = restored.units.find(person => person.id === u.id)
      assert.equal(actual.entry.person.counter, u.entry.person.counter)
      assert.equal(actual.inside, u.inside)
    }
  }
  assert.equal(restored.buildings.find(building => building.id === b.id).admission.inside, 5)
})

test('route-only legacy owners retain world-turn synchronization', async () => {
  const { stepLiveRoute } = await import('../app/live-pathfinding.ts')
  const { w, units } = scenario('camp', 'human')
  const u = units[0], p = u.entry.person
  // Isolate the existing legacy-adapter branch; canonical entry owners above
  // must be excluded without changing this route-only compatibility behavior.
  delete u.entry
  p.counter = 255
  stepLiveRoute(w, u)
  assert.equal(p.counter, w.turn & 255)
})

for (const kind of ['hut', 'tower', 'boatHouse', 'balloonHut']) {
  test(`${kind} routed entry uses the same retained counter owner`, () => {
    const { w, units } = scenario(kind, 'ai')
    const before = units.map(u => u.entry.person.counter)
    tick(w, 1 / 12)
    for (const [i, u] of units.entries())
      assert.equal(u.entry.person.counter, (before[i] + 1) & 255)
  })
}


test('dismantling approach keeps its retained entry counter', () => {
  const { w, units } = scenario('camp', 'ai', 10)
  const before = units.map(u => u.entry.person.counter)
  tick(w, 1 / 12)
  for (const [i, u] of units.entries())
    assert.equal(u.entry.person.counter, (before[i] + 1) & 255)
})
