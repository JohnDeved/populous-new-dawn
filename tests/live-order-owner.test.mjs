import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorldState } from '../app/world-state.ts'
import { appendLiveOrders } from '../app/live-movement.ts'
import { startMeleeKnockback } from '../app/live-people.ts'
import { emptyPersonOrder } from '../app/person-orders.ts'

// Supplied controller ownership, with real append/clear/attach and knockback entry.
// These cases do not advance a turn or establish a new flight restart contract.
function fixture() {
  const w = createWorldState(1)
  w.units = []
  w.objectCells.objects.clear()
  w.objectCells.heads.fill(0)
  w.pathfinding.people.clear()
  w.buildingOrders.records = Array.from({ length: 800 }, emptyPersonOrder)
  Object.assign(w.buildingOrders, { active: 0, cursor: 1 })
  w.land.categories.fill(0)
  w.land.flags.fill(0)
  const units = Array.from({ length: 3 }, (_, i) =>
    addUnit(w, 'blue', 'warrior', { x: i, z: 0 })
  )
  const command = Object.assign(emptyPersonOrder(), { model: 19, a: 0x2020 })
  assert.deepEqual(appendLiveOrders(w, units, command, false), { accepted: true, count: 3 })
  const people = units.map(u => u.native)
  const old = people[0].commands.find(Boolean)
  for (const i of [1, 2]) {
    people[i].state = 25
    units[i].fight = { motion: people[i], group: 0, started: w.turn, opponent: 0 }
    units[i].native = null
  }
  startMeleeKnockback(w, units[2])
  units[2].fight = null
  assert.equal(units[2].flight, people[2])
  assert.ok(people.every((p, i) => w.objectCells.objects.get(units[i].id) === p))
  return { w, units, people, old, command }
}

const motion = p => structuredClone({
  state: p.state, substate: p.substate, speed: p.speed, x: p.x, y: p.y, h: p.h,
  velocity: p.velocity, object: p.object, f1: p.f1, f2: p.f2,
  anchorX: p.anchorX, anchorY: p.anchorY, route: p.route,
})

for (const replace of [false, true]) test(`live append ${replace ? 'replaces' : 'extends'} the registered fight/flight queues`, () => {
  const { w, units, people, old, command } = fixture()
  const before = people.slice(1).map(motion)
  const registrySize = w.objectCells.objects.size
  command.a = 0x2222
  assert.deepEqual(appendLiveOrders(w, units, command, replace), { accepted: true, count: 3 })
  for (const [i, p] of people.entries()) {
    assert.equal(w.objectCells.objects.get(units[i].id), p, 'append retains the registered person identity')
    assert.deepEqual(p.commands.filter(Boolean).map(id => w.buildingOrders.records[id].a),
      replace ? [0x2222] : [0x2020, 0x2222])
  }
  const shared = people[0].commands.filter(Boolean).at(-1)
  assert.ok(people.every(p => p.commands.includes(shared)))
  assert.equal(w.buildingOrders.records[shared].model, 19)
  assert.equal(w.buildingOrders.records[shared].references, 3)
  assert.equal(w.buildingOrders.records[old].references, replace ? 0 : 3)
  assert.equal(w.buildingOrders.active, replace ? 1 : 2)
  assert.equal(w.objectCells.objects.size, registrySize)
  assert.equal(units[1].fight.motion, people[1])
  assert.equal(units[2].flight, people[2])
  assert.equal(units[1].native, null, 'fight ownership does not create a native alias')
  assert.equal(units[2].native, null, 'flight ownership does not create a native alias')
  assert.deepEqual(people.slice(1).map(motion), before, 'existing state25 motion skip is preserved')
})
