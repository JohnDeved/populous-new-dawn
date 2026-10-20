import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit } from '../app/model.ts'
import { cleanBattles, processBattles, processOwnedBattles } from '../app/combat-runtime.ts'
import { createMeleePerson } from '../app/live-people.ts'
import { EncounterPhase } from '../app/melee-encounter.ts'

function field() {
  const w = createWorld()
  w.units = []; w.buildings = []; w.shrines = []; w.fights = []
  w.terrain.fill(3); w.terrainVersion++
  w.turn = 1
  w.manaWorld.gameFlags |= 64
  return w
}
function group(w, count = 2, x = 0, action = 'strike') {
  const members = Array.from({ length: count }, (_, i) =>
    addUnit(w, i & 1 ? 'blue' : 'red', 'warrior', { x: x + i / 4, z: 0 }))
  const b = { id: w.nextId++, x, z: 0, angle: 512, members: members.map(u => u.id) }
  w.fights.push(b)
  for (const [i, u] of members.entries()) {
    u.fight = { group: b.id, opponent: members[i ? 0 : 1].id,
      action, animation: action, started: w.turn, remaining: 10 }
    u.fight.motion = createMeleePerson(w, u)
  }
  return { b, members }
}
function pair(w) {
  return [structuredClone(w), structuredClone(w)]
}
function physicalOwnerLinks(w) {
  return w.units.map(u => {
    const owners = [u.native, u.flight, u.fight?.motion, u.entry?.person, u.builder?.person]
    return owners.map(p => p ? {
      sameOwner: owners.map(other => p === other),
      cellRegistry: w.objectCells.objects.get(p.id) === p,
      pathRegistry: w.pathfinding.people.get(p.id) === p,
    } : null)
  })
}
function visit(eager, owned) {
  processBattles(eager)
  processOwnedBattles(owned)
  assert.deepEqual(owned, eager, 'complete world values, including RNG')
  assert.deepEqual(physicalOwnerLinks(owned), physicalOwnerLinks(eager),
    'per-unit physical-owner and cell/path registry relationships')
}

test('owned scheduler lookup matches eager resolution for every group size and live action', () => {
  for (const action of ['strike', 'attack', 'special', 'approach', 'ready', 'recoil', 'push']) {
    const w = field()
    for (let i = 0; i < 24; i++) addUnit(w, 'blue', 'brave', { x: 70, z: i })
    for (let count = 2; count <= 6; count++) group(w, count, (count - 2) * 10, action)
    const [eager, owned] = pair(w)
    for (let turn = 0; turn < 12; turn++) {
      visit(eager, owned)
      eager.turn++; owned.turn++
      eager.time = eager.turn / 12; owned.time = owned.turn / 12
    }
  }
})

test('duplicate IDs retain cleanup last-match and processing first-match ownership', () => {
  const w = field(), { members } = group(w)
  const duplicate = structuredClone(members[0])
  duplicate.fight.remaining = 30
  w.units.unshift(duplicate)
  const [eager, owned] = pair(w)
  visit(eager, owned)
  assert.equal(owned.units[0].fight.remaining, 29)
  assert.equal(owned.units[1].fight.remaining, 10)
})

test('sparse slots, invalid members, airborne owners and non-finite IDs keep eager cleanup', () => {
  const w = field(), { b, members } = group(w, 4)
  b.slots = [members[0].id, 0, members[1].id, members[2].id, members[3].id, NaN]
  members[2].hp = 0
  members[3].flight = members[3].fight.motion
  members[3].flight.state = 31
  addUnit(w, 'blue', 'brave', { x: 40, z: 0 }).id = NaN
  const [eager, owned] = pair(w)
  visit(eager, owned)
  assert.deepEqual(cleanBattles(owned), cleanBattles(eager))
  assert.deepEqual(owned, eager)
})

test('encounter promotion before later groups preserves live owners and native registrations', () => {
  const w = field(), { b, members } = group(w)
  b.encounter = [...b.members]
  for (const [i, u] of members.entries()) {
    u.fight.action = 'encounter'
    u.fight.motion.state = 29
    u.fight.motion.substate = i ? EncounterPhase.Wait : EncounterPhase.Approach
    u.fight.motion.flags2 |= 0x40000000
  }
  group(w, 3, 20, 'approach')
  const [eager, owned] = pair(w), originalId = b.id
  visit(eager, owned)
  assert.equal(owned.fights[0].encounter, undefined)
  assert.notEqual(owned.fights[0].id, originalId, 'real encounter promotion allocates a new group')
  visit(eager, owned)
})

test('every new call rebuilds references after same-turn replacement and owner changes', () => {
  const w = field()
  group(w, 4)
  const [eager, owned] = pair(w)
  visit(eager, owned)
  for (const world of [eager, owned]) {
    world.units = world.units.map(u => structuredClone(u)).reverse()
    world.units[0].hp = 0
    world.units[1].flight = world.units[1].fight.motion
    world.units[1].flight.state = 31
    world.units[2].fight.remaining = 42
    addUnit(world, 'blue', 'brave', { x: 40, z: 0 })
  }
  visit(eager, owned)
})

test('public processing retains eager array lookups for direct callers', () => {
  const w = field()
  group(w, 2)
  group(w, 4, 20)
  let lookups = 0
  Object.defineProperty(w.units, 'find', { value(predicate) {
    lookups++
    return Array.prototype.find.call(this, predicate)
  } })
  processBattles(w)
  assert.equal(lookups, 6, 'one original eager find per packed member')
  assert.ok(cleanBattles(w) instanceof Map, 'public cleanup keeps its Map result')
})

test('empty owned and public battle visits make identical no-op transitions', () => {
  visit(...pair(field()))
})
