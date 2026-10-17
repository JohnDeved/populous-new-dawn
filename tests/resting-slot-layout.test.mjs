import assert from 'node:assert/strict'
import test from 'node:test'
import { createRestingSlots, rebuildRestingSlots, restingSlotAvailable } from '../app/resting-slots.ts'
import { idleSlotPosition, stepRestingPerson } from '../app/person-idle.ts'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { createLivePerson } from '../app/live-people.ts'

// The native initializer packs n+1 points per shape, including its zero center.
// Pointer+4*slot lookup can read the following shape, even for valid ownership.
const adjacent = [
  [1, 2, 2, 0], [1, 3, 2, 1], [1, 4, 2, 2], [1, 5, 3, 0], [1, 6, 3, 1],
  [2, 3, 3, 0], [2, 4, 3, 1], [2, 5, 3, 2], [2, 6, 3, 3],
  [3, 4, 4, 0], [3, 5, 4, 1], [3, 6, 4, 2],
  [4, 5, 5, 0], [4, 6, 5, 1], [5, 6, 6, 0],
]

test('resting shapes retain adjacent initialized geometry for every six-slot lookup', () => {
  const slots = createRestingSlots()
  assert.equal(slots[0], slots[6])
  for (let shape = 0; shape <= 8; shape++) {
    for (let slot = 0; slot <= Math.max(6, shape); slot++) {
      assert.ok(slots[shape][slot], `shape ${shape}, slot ${slot}`)
    }
  }
  for (const [shape, slot, next, index] of adjacent) {
    assert.equal(slots[shape][slot], slots[next][index], 'same initialized backing point')
    for (const cell of [0, 1538, 0xfefe]) {
      assert.deepEqual(idleSlotPosition(slots, cell, shape * 16 + slot),
        idleSlotPosition(slots, cell, next * 16 + index))
    }
  }
  assert.deepEqual(idleSlotPosition(slots, 1538, 0x14), { x: 768, y: 1712 })
  assert.deepEqual(slots.slice(1).map((row, shape) => row.slice(0, shape + 2).length),
    [2, 3, 4, 5, 6, 7, 8, 9], 'all 44 initialized ring points remain present')
})

test('native sparse group compaction can produce shape one, slot four without corrupt ownership', () => {
  const p = { id: 1, class: 1, model: 2, assignment: 1, anchorFlags: 5,
    formationCell: 1538, flags3: 0 }
  rebuildRestingSlots({ cellObjects: () => [p] }, p.formationCell)
  assert.equal(p.anchorFlags, 0x14, 'native byte compaction decrements later empty entries too')
  assert.equal(p.assignment, 3)
  assert.equal(p.flags3, 0)
  assert.deepEqual(idleSlotPosition(createRestingSlots(), p.formationCell, p.anchorFlags),
    { x: 768, y: 1712 })
})

test('state 19 consumes the native shape-one slot-four destination and preserves ownership', () => {
  const w = createWorldState(18), u = addUnit(w, 'red', 'brave', { x: 0, z: 0 })
  const p = createLivePerson(w, u), slots = createRestingSlots()
  // Exact relevant fields at the reproduced M18 failure, after its normal move.
  Object.assign(p, { state: 19, substate: 1, x: 710, y: 1680, formationCell: 1538,
    anchorFlags: 0x14, assignment: 3, flags2: 0, counter: 241 })
  w.land.heights.fill(50)
  w.land.flags.fill(0)
  w.land.categories.fill(0)
  const rest = { land: w.land, orders: w.buildingOrders, cellObjects: () => [p],
    outside: () => assert.fail('no building'), search: w.indexedSearch, slotOffsets: slots }
  const destinations = []
  const result = stepRestingPerson({ randomState: 1, turn: 44529,
    poseRandom: { randomState: 2 }, shamans: new Map(), slotOffsets: slots }, p, {
    setAnimation: () => {}, releaseMotion: () => assert.fail('no release'), occupied: () => false,
    validSlot: () => restingSlotAvailable(rest, p), findSlot: () => assert.fail('already owned'),
    directDestination: to => destinations.push(to), insert: () => assert.fail('not there yet'),
    height: () => 50, allocateLog: () => assert.fail('no timber'), sound: () => {},
    refreshCell: () => assert.fail('no refresh'), frameCount: () => 1,
  })
  assert.equal(result, 0)
  assert.equal(p.substate, 2)
  assert.equal(p.anchorFlags, 0x14)
  assert.equal(p.assignment, 3)
  assert.deepEqual(destinations, [{ x: 768, y: 1712 }])
})
