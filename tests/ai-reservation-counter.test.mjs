import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, command, setSelection, tick } from '../app/model.ts'
import { createLivePerson, changeLivePersonState, registerLivePerson } from '../app/live-people.ts'

// Supplied state isolates the missing scheduler byte. This is not campaign or
// complete state-14 controller/physics equivalence. State 14 is AI reservation,
// distinct from public player selection.
function subject(counter = 93) {
  const world = createWorld(), unit = world.units.find(u => u.team === 'blue' && u.kind === 'brave')
  world.manaWorld.gameFlags = 32
  world.units = [unit]
  world.buildings = []
  world.shrines = []
  world.trees = []
  const person = (unit.native = createLivePerson(world, unit))
  registerLivePerson(world, person)
  changeLivePersonState(world, unit, 14)
  person.counter = counter
  return { world, unit, person }
}

test('AI reservation retains its own byte counter and advances once per logical visit', () => {
  const { world, unit, person } = subject(), rng = world.randomState
  tick(world, 1 / 24)
  assert.equal(world.turn, 0)
  assert.equal(person.counter, 93)
  tick(world, 1 / 24)
  assert.equal(world.turn, 1)
  assert.equal(person.counter, 94, 'native class_counter is not a global-turn stamp')
  assert.equal(unit.native, person)
  assert.equal(person.state, 14)
  assert.equal(world.randomState, rng, 'the counter visit adds no RNG consumption')
})

test('reserved byte wraps across serial catch-up visits without duplicate alias ticks', () => {
  const { world, unit, person } = subject(254), counters = []
  world.pathfinding.people.set(unit.id, person)
  assert.equal(world.objectCells.objects.get(unit.id), person)
  tick(world, 3 / 12, { afterTurn: () => counters.push(person.counter) })
  assert.deepEqual(counters, [255, 0, 1])
  assert.equal(unit.native, person)
  assert.equal(world.pathfinding.people.get(unit.id), person)
})

test('AI reserve/release transitions do not tick; the resumed movement owner ticks once', () => {
  const { world, unit, person } = subject(60)
  tick(world, 1 / 12)
  assert.equal(person.counter, 61)
  changeLivePersonState(world, unit, 10)
  assert.equal(person.counter, 61, 'release is not an object visit')
  setSelection(world, [unit.id])
  assert.equal(command(world, { x: unit.x + 6, z: unit.z }), true)
  assert.equal(person.counter, 61, 'issuing the order is not an object visit')
  tick(world, 1 / 12)
  assert.equal(unit.native, person)
  assert.equal(person.counter, 62, 'movement already owns the next increment')
  changeLivePersonState(world, unit, 14)
  assert.equal(person.counter, 62, 'reservation initialization is not a visit')
  tick(world, 1 / 12)
  assert.equal(person.counter, 63)
})

test('public selection/deselection does not enter AI reservation or tick the owner', () => {
  const { world, unit, person } = subject(61)
  changeLivePersonState(world, unit, 10)
  setSelection(world, [unit.id])
  assert.equal(person.state, 10)
  assert.equal(person.counter, 61)
  setSelection(world, [])
  assert.equal(person.state, 10)
  assert.equal(person.counter, 61)
})

test('earlier flight ownership increments once and does not also visit reservation', () => {
  const { world, unit, person } = subject(61)
  unit.flight = person
  person.flags2 |= 0x80000
  tick(world, 1 / 12)
  assert.equal(person.counter, 62)
})

test('pause, land pause, and dead-person gates do not invent reserved visits', () => {
  const { world, unit, person } = subject(61)
  world.paused = true
  tick(world, 1 / 12)
  assert.equal(person.counter, 61)
  world.paused = false
  world.land.landFlags |= 2
  tick(world, 1 / 12)
  assert.equal(person.counter, 61)
  world.land.landFlags &= ~2
  unit.hp = 0
  tick(world, 1 / 12)
  assert.equal(person.counter, 61)
})
