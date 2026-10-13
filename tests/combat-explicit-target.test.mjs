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

import { pauseExplicitCombatTarget } from '../app/combat-explicit-target.ts'
test('explicit elevated-target pause decrements twice on entry then restarts without dropping ownership', () => {
  const p = {
      ...person(),
      physics: 18,
      cargo: 0,
      assignment: 0,
      renderFlags: 16,
      flags2: 0x40000080,
      substate: 12,
      timer: 99,
      animationMode: 0,
    },
    t = { ...target(), flags4: 0x400 },
    events = [],
    rng = { randomState: 123 }
  const e = {
    animation: () => events.push('animation'),
    releaseMotion: () => events.push('release'),
  }
  pauseExplicitCombatTarget(rng, p, t, e)
  assert.equal(p.timer, 6)
  assert.equal(p.substate, 12)
  assert.equal(p.assignment & 16, 0)
  assert.equal(p.renderFlags & 16, 16)
  assert.equal(p.animationMode, 4)
  assert.equal(p.turnAngle, p.heading)
  assert.deepEqual(events, ['animation'])
  for (let i = 0; i < 6; i++) pauseExplicitCombatTarget(rng, p, t, e)
  assert.equal(p.timer, 0)
  assert.equal(p.substate, 0)
  assert.ok(p.flags2 & 0x40000000)
  assert.equal(rng.randomState, 123)
  p.substate = 12
  pauseExplicitCombatTarget(rng, p, { ...t, flags4: 0 }, e)
  assert.equal(p.timer, 7)
  assert.equal(p.substate, 0)
})

import { prepareCombatOrderVisit } from '../app/combat-order-search.ts'
test('in-body route failure can enter and execute the explicit target pause without bypassing queue entry', () => {
  const p = {
      ...person(),
      id: 89,
      tribe: 0,
      model: 7,
      physics: 18,
      flags2: 0x40000000,
      flags3: 0,
      substate: 0,
      assignment: 0,
      cargo: 0,
      renderFlags: 16,
      marchCooldown: 0,
      turnAngle: 1000,
      turnY: 1000,
    },
    t = { ...target(), flags4: 0x400 },
    w = { randomState: 123, playerTribe: 0, alert: 0, marches: [] },
    events = [],
    e = {
      ...effects(events),
      animation: () => {},
      approachPoint: () => ({ ...t, kind: 1 }),
      destination: to => {
        p.goalX = to.x
        p.goalY = to.y
        p.flags4 |= 0x10000000
      },
      withinArea: () => false,
      select: () => {
        throw new Error('pause must skip selection')
      },
      prepareTarget: () => {
        throw new Error('pause must not depart')
      },
      range: () => 0,
      trackTarget: () => trackExplicitCombatTarget(p, t, effects(events)),
    }
  assert.equal(p.flags4 & 0x10000000, 0)
  assert.deepEqual(prepareCombatOrderVisit(w, p, { model: 28, flags: 128, a: 17, b: 0 }, e), {
    complete: false,
    restart: false,
  })
  assert.equal(p.substate, 12)
  assert.equal(p.flags4 & 0x10000000, 0)
  pauseExplicitCombatTarget(w, p, t, e)
  assert.equal(p.substate, 12)
  assert.equal(p.timer, 6)
})
