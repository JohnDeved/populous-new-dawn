import assert from 'node:assert/strict'
import test from 'node:test'
import { combatPerson, combatWorld, nativePersonModel, nativePersonTribe } from '../app/live-combat.ts'
import { inEngagementArea } from '../app/melee-engagement.ts'
import { addUnit, createWorldState } from '../app/world-state.ts'

// Preserve the former projection as an independent oracle for this allocation
// change. Existing native combat fixtures separately cover targeting rules.
const position = u => ({
  x: Math.round((u.x + 8) * 256) & 65535,
  y: Math.round((-u.z - 8) * 256) & 65535,
})
function previousCombatPerson(u) {
  const p = u.builder?.person ?? u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
  const held = u.attackReservation ?? { flags4: 0, reactionTimer: 0, reactionDuration: 0 }
  let state = u.path.length || u.work !== null ? 10 : 17
  if (u.fight) state = 25
  return {
    ...position(u), ...held,
    id: u.id, class: 1, model: nativePersonModel(u), tribe: nativePersonTribe(u),
    flags2: (p?.flags2 ?? 0) | (u.inside === null ? 0 : 0x800000),
    flags4: (p?.flags4 ?? 0) | held.flags4 | (u.lift > 0 ? 0x400 : 0) |
      (u.invisibility ? 0x1000 : 0) | (u.ghost ? 0x800 : 0),
    state: p?.state ?? state, life: Math.round(u.hp * 20),
    vehicle: p?.vehicle ?? 0, group: u.fight?.group ?? 0, disguise: p?.disguise ?? 0,
  }
}

test('combat projections preserve owner precedence, flags, reservations and wrapped positions', () => {
  const w = createWorldState(1)
  const u = addUnit(w, 'blue', 'spy', { x: -8.001953125, z: 248.001953125 })
  const owner = state => ({ state, flags2: 0x810004, flags4: 0x80000400, vehicle: 123, disguise: 129 })
  const check = () => assert.deepEqual(combatPerson(u), previousCombatPerson(u))
  check()
  u.path = [{ x: 10, z: 10 }]
  check()
  u.work = 44
  u.inside = 99
  u.hp = 0.525
  u.lift = 1
  u.invisibility = { remaining: 10 }
  u.ghost = { remaining: 10 }
  u.attackReservation = { flags4: 0x300000, reactionTimer: 2, reactionDuration: 48 }
  u.entry = { person: owner(21) }
  check()
  u.native = owner(19)
  check()
  u.fight = { group: 778, motion: owner(25) }
  check()
  u.flight = owner(31)
  check()
  u.builder = { person: owner(10) }
  check()
  const projected = combatPerson(u)
  projected.reactionTimer++
  projected.flags4 = 0
  assert.deepEqual(u.attackReservation, { flags4: 0x300000, reactionTimer: 2, reactionDuration: 48 })
})

test('combat broadphase preserves wrapped ranges and roster order across a population sweep', () => {
  const w = createWorldState(1)
  let seed = 0x12345678
  const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0)
  for (let i = 0; i < 512; i++) {
    const u = addUnit(w, i & 1 ? 'red' : 'blue', 'warrior', {
      x: ((next() & 0x3ffff) - 0x20000) / 256,
      z: ((next() & 0x3ffff) - 0x20000) / 256,
    })
    if (!(i % 17)) u.hp = 0
    if (!(i % 37)) u.hp = NaN
  }
  for (const source of [{ x: 0, y: 0 }, { x: 65535, y: 65535 }, { x: 32768, y: 511 }]) {
    for (const range of [0, 1, 2, 3, 7, 16, 127, 128, 129, 255]) {
      const eligible = w.units.filter(u => u.hp > 0 && inEngagementArea(source, position(u), range))
      const { world, owners } = combatWorld(w, source, range)
      assert.deepEqual([...world.objects], eligible.map(u => [u.id, previousCombatPerson(u)]), `range ${range}`)
      assert.deepEqual([...owners.keys()], eligible.map(u => u.id))
      for (const u of eligible) assert.equal(owners.get(u.id), u)
    }
  }
})

test('combat broadphase does not project the second axis of distant people', () => {
  const w = createWorldState(1)
  const u = addUnit(w, 'red', 'warrior', { x: 64, z: 0 })
  Object.defineProperty(u, 'z', {
    get() { return assert.fail('the first wrapped axis already excludes this person') },
  })
  assert.equal(combatWorld(w, { x: 0, y: 0 }, 3).world.objects.size, 0)
})
