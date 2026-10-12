import assert from 'node:assert/strict'
import test from 'node:test'
import {
  trackExplicitCombatTarget,
  selectExplicitCombatTarget,
  explicitCombatCommandResult,
} from '../app/combat-explicit-target.ts'

const person = () => ({
  model: 7,
  counter: 4,
  x: 1000,
  y: 1000,
  goalX: 1000,
  goalY: 1000,
  flags2: 0,
  flags4: 0,
})
const target = () => ({
  id: 17,
  class: 1,
  model: 4,
  x: 3000,
  y: 1000,
  life: 1100,
  flags2: 0,
  flags4: 0,
  vehicle: 0,
  group: 0,
})
function effects(events, overrides = {}) {
  return {
    outside: () => undefined,
    destination: p => events.push(['route', p.x, p.y]),
    directDestination: p => events.push(['direct', p.x, p.y]),
    supportsTarget: () => true,
    targetOnWater: () => false,
    releaseMotion: () => events.push(['release']),
    ...overrides,
  }
}

test('explicit tracking preserves fourth-turn drift, near and occupied-building branches', () => {
  const p = person(),
    t = target(),
    events = []
  assert.equal(trackExplicitCombatTarget(p, t, effects(events)), 0)
  assert.deepEqual(events.splice(0), [['route', 3000, 1000]])
  p.counter = 5
  assert.equal(trackExplicitCombatTarget(p, t, effects(events)), 0)
  assert.deepEqual(events, [])
  p.counter = 8
  t.x = 2079
  trackExplicitCombatTarget(p, t, effects(events))
  assert.deepEqual(events.splice(0), [['direct', 2079, 1000]])
  t.x = 2080
  trackExplicitCombatTarget(p, t, effects(events))
  assert.deepEqual(events.splice(0), [['route', 2080, 1000]])
  trackExplicitCombatTarget(p, t, effects(events, { outside: () => ({ x: 2560, y: 1024 }) }))
  assert.deepEqual(events, [['route', 2560, 1024]])
})

test('explicit target invalidation and blocked transport results retain original timing', () => {
  const p = person(),
    t = target(),
    events = []
  assert.equal(trackExplicitCombatTarget(p, undefined, effects(events)), 1)
  assert.equal(trackExplicitCombatTarget(p, { ...t, life: 0 }, effects(events)), 1)
  assert.deepEqual(events, [])
  p.counter = 5
  t.vehicle = 9
  assert.equal(trackExplicitCombatTarget(p, t, effects(events)), 0)
  p.flags4 = 0x10000000
  assert.equal(trackExplicitCombatTarget(p, t, effects(events)), 1)
  assert.equal(p.flags4, 0)
  assert.deepEqual(events.splice(0), [['release']])
  p.flags4 = 0x10000000
  t.vehicle = 0
  t.flags4 = 0x400
  assert.equal(trackExplicitCombatTarget(p, t, effects(events)), 2)
  assert.deepEqual(events, [['release']])
  for (const complete of [false, true])
    for (const vehicle of [0, 9])
      assert.equal(
        explicitCombatCommandResult(complete, vehicle),
        Number(complete && vehicle !== 0)
      )
})

test('explicit selector preserves person, existing fight-group and building identity without reservation', () => {
  const t = target(),
    p = person(),
    order = { a: t.id, flags: 0 },
    objects = new Map([[t.id, t]])
  assert.deepEqual(selectExplicitCombatTarget(objects, p, order), { target: t, type: 2 })
  const group = { id: 99, class: 10, model: 8, flags2: 0 }
  t.group = group.id
  objects.set(group.id, group)
  assert.deepEqual(selectExplicitCombatTarget(objects, p, order), { target: group, type: 1 })
  group.model = 9
  assert.deepEqual(selectExplicitCombatTarget(objects, p, order), { target: t, type: 2 })
  objects.delete(group.id)
  assert.throws(
    () => selectExplicitCombatTarget(objects, p, order),
    /Missing explicit combat group/
  )
  t.group = 0
  t.model = 2
  assert.equal(selectExplicitCombatTarget(objects, { model: 4 }, order), undefined)
  assert.equal(selectExplicitCombatTarget(objects, { model: 4 }, { ...order, flags: 64 }).type, 2)
  const building = { id: 105, class: 2, model: 4, flags2: 0 }
  objects.set(105, building)
  assert.deepEqual(selectExplicitCombatTarget(objects, p, { a: 105, flags: 0 }), {
    target: building,
    type: 3,
  })
  assert.equal(selectExplicitCombatTarget(objects, p, { a: 0, flags: 0 }), undefined)
})
