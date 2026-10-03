import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, tick } from '../app/model.ts'
import { appendLiveOrders } from '../app/live-movement.ts'
import { emptyPersonOrder } from '../app/person-orders.ts'
import { UnitMotion, unitPosition, interpolateUnitPosition } from '../app/unit-motion.ts'

function scenario(kind, shared) {
  const w = createStartedWorld()
  w.manaWorld.gameFlags = 32
  retainFixtureUnits(w, u => u.kind === 'shaman')
  w.terrain.fill(3)
  w.terrainVersion++
  const b = addBuilding(w, 'blue', kind, { x: -2, z: 32 }, true, { angle: Math.PI })
  const people = Array.from({ length: 8 }, (_, i) => addUnit(w, 'blue', 'brave', { x: 7 + i * .4, z: 33 }))
  if (shared) appendLiveOrders(w, people, { ...emptyPersonOrder(), model: 8, a: b.id }, true)
  else {
    w.selected = people.map(u => u.id)
    command(w, b)
  }
  return { w, b, people }
}

for (const kind of ['camp', 'temple', 'spyHut', 'firewarriorHut']) {
  for (const shared of [false, true]) {
    test(`${kind} ${shared ? 'shared command-8' : 'human group command'} retains visible admission interpolation`, () => {
      const { w, b, people } = scenario(kind, shared), motion = new UnitMotion(), control = structuredClone(w)
      let arrivals = 0
      for (let turn = 0; turn < 200 && arrivals < 5; turn++) {
        const before = new Map(people.map(u => [u.id, { inside: u.inside, position: unitPosition(w, u) }]))
        motion.beforeTurn(w)
        tick(w, 1 / 12)
        motion.afterTurn(w)
        tick(control, 1 / 12)
        assert.deepEqual(w, control, 'render snapshots must not mutate the simulation or RNG')
        for (const u of people) {
          const prior = before.get(u.id)
          if (prior.inside !== null || u.inside !== b.id) continue
          arrivals++
          assert.equal(u.entry.person.renderFlags & 16, 0)
          const to = unitPosition(w, u)
          assert.notDeepEqual(prior.position, to, 'fixture must move on the admission turn')
          for (const fraction of [0, .25, .5, .75, 1]) {
            w.pendingTime = fraction / 12
            const expected = interpolateUnitPosition(prior.position, to, fraction)
            assert.deepEqual(motion.position(w, u), expected, `person ${u.id} turn ${w.turn} fraction ${fraction}`)
          }
          w.pendingTime = control.pendingTime
        }
      }
      assert.equal(arrivals, 5)
      assert.equal(b.admission.inside, 5)
      assert.equal(people.filter(u => u.inside === null).length, 3)
    })
  }
}

test('hidden admission, exit, replacement and explicit placement remain discrete', () => {
  const { w, b, people } = scenario('camp', false), u = people[0], motion = new UnitMotion()
  // Obtain the actual live command person before testing presentation boundaries.
  tick(w, 1 / 12)
  assert.ok(u.entry)
  const discrete = change => {
    motion.beforeTurn(w)
    change()
    u.x += 1
    motion.afterTurn(w)
    w.pendingTime = 0
    assert.deepEqual(motion.position(w, u), unitPosition(w, u))
  }
  discrete(() => { u.inside = b.id; u.entry.person.renderFlags |= 16 })
  discrete(() => { u.inside = null; u.entry.person.renderFlags &= ~16 })
  discrete(() => { u.inside = b.id; u.kind = 'warrior' })
  discrete(() => { u.inside = null })
  discrete(() => { u.inside = b.id; u.team = 'red' })
  u.x += 20 // Placement outside a turn cannot use retained interpolation history.
  assert.deepEqual(motion.position(w, u), unitPosition(w, u))
  const replacement = addUnit(w, 'blue', 'brave', { x: 50, z: 50 })
  replacement.id = u.id
  assert.deepEqual(motion.position(w, replacement), unitPosition(w, replacement))
})
