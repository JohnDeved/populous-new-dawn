import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorldState } from '../app/world-state.ts'
import { createLivePerson } from '../app/live-people.ts'
import { stepLiveOrderQueue } from '../app/live-movement.ts'
import { stepLiveBuildingAttack } from '../app/live-building-combat.ts'
import { allocatePersonOrder, attachPersonOrder, currentPersonOrder } from '../app/person-orders.ts'

// Supplied queue-completion fixture. Real attachment/removal and the live update
// adapter run; the command body is supplied. Actual M18 replay is separate evidence.
function fixture(model, a, b, { immediate = false, cancelled = false } = {}) {
  const w = createWorldState(18)
  w.land.flags.fill(0)
  w.land.categories.fill(0)
  const u = addUnit(w, 'blue', 'firewarrior', { x: 35, z: 29 })
  const p = createLivePerson(w, u)
  u.native = p
  Object.assign(p, { state: 10, commandStatus: model, counter: 1,
    anchorX: 2304, anchorY: 4352, anchorFlags: 17, flags3: p.flags3 | 1 })
  const id = allocatePersonOrder(w.buildingOrders), order = w.buildingOrders.records[id]
  Object.assign(order, { model, a, b, flags: cancelled ? 1 : 0 })
  const unexpected = () => assert.fail('fixture must not need a target, motion, or spell consumer')
  attachPersonOrder(w.buildingOrders, p, id, immediate ? -1 : 0, {
    prepare: unexpected, stopWork: unexpected, releaseSpell: unexpected,
    deleteObject: unexpected, releaseFight: unexpected,
  })
  return { w, u, p, order }
}

function finish({ w, u, p, order }, body = () => 1) {
  const random = w.randomState, turn = w.turn, nextId = w.nextId
  const result = stepLiveOrderQueue(w, u, p, { [order.model === 21 ? 19 : order.model]: body })
  assert.equal(result, 17)
  assert.equal(currentPersonOrder(w.buildingOrders, p), undefined)
  assert.equal(order.references, 0)
  assert.equal(w.buildingOrders.active, 0)
  assert.equal(p.flags3 & 1, 0)
  assert.equal(p.commandStatus, 0)
  assert.equal(w.randomState, random, 'completion introduces no random draw')
  assert.equal(w.turn, turn, 'the queue consumer does not advance the game clock')
  assert.equal(w.nextId, nextId, 'the queue consumer allocates no world objects')
}

for (const model of [11, 19, 21]) {
  for (const b of [0, 3084, 65535]) {
    test(`command ${model} completion decodes packed cell 55850 independently of range ${b}`, () => {
      const f = fixture(model, 55850, b)
      finish(f)
      assert.deepEqual([f.p.anchorX, f.p.anchorY, f.p.anchorFlags], [11008, 56064, 0])
      assert.deepEqual([f.order.a, f.order.b], [55850, b], 'completion preserves the command payload')
    })
  }
  for (const a of [0, 0x00ff, 0xff00, 0xffff]) {
    test(`command ${model} centers wrapped packed cell ${a}`, () => {
      const f = fixture(model, a, 3084)
      finish(f)
      assert.deepEqual([f.p.anchorX, f.p.anchorY], [((a & 254) + 1) * 256, (((a >>> 8) & 254) + 1) * 256])
    })
  }
}

for (const options of [{ immediate: true }, { cancelled: true }]) {
  test(`command 21 uses the same anchor for ${options.immediate ? 'immediate' : 'cancelled'} completion`, () => {
    const f = fixture(21, 55850, 3084, options)
    finish(f, options.cancelled ? () => assert.fail('cancelled command body must not run') : () => 1)
    assert.deepEqual([f.p.anchorX, f.p.anchorY, f.p.anchorFlags], [11008, 56064, 0])
  })
}

test('an incomplete area command retains its anchor, queue, payload, flags and RNG', () => {
  const f = fixture(21, 55850, 3084), before = structuredClone(f.w)
  assert.equal(stepLiveOrderQueue(f.w, f.u, f.p, { 19: () => 0 }), 0)
  assert.deepEqual(f.w, before)
})

test('raw movement coordinates remain raw instead of being interpreted as a packed cell', () => {
  const f = fixture(3, 55850, 3084)
  finish(f)
  assert.deepEqual([f.p.anchorX, f.p.anchorY, f.p.anchorFlags], [56064, 3328, 0])
})

test('command 28 retains the descriptor skip-anchor rule', () => {
  const f = fixture(28, 55850, 3084)
  finish(f)
  assert.deepEqual([f.p.anchorX, f.p.anchorY, f.p.anchorFlags], [2304, 4352, 17])
})

test('guard completion continues to resolve the saved Shaman target position', () => {
  const f = fixture(30, 0, 3084)
  const target = addUnit(f.w, 'blue', 'shaman', { x: -14, z: 37 })
  target.native = createLivePerson(f.w, target)
  f.order.a = target.id
  const { x, y } = target.native
  finish(f)
  assert.deepEqual([f.p.anchorX, f.p.anchorY, f.p.anchorFlags], [(x & 0xfe00) + 256, (y & 0xfe00) + 256, 0])
})

test('live automatic Firewarrior target loss completes the M18 order into its local rest anchor', () => {
  const { w, u, p, order } = fixture(21, 55850, 3084, { immediate: true })
  // Same command and ranged-person phase as the actual turn-23336 failure.
  // The missing target is supplied; the attack body and rest transition are real.
  Object.assign(p, { x: 10939, y: 56037, substate: 10, workTarget: 12345,
    anchorX: 11008, anchorY: 56064 })
  order.flags = 32
  stepLiveBuildingAttack(w, u)
  assert.equal(currentPersonOrder(w.buildingOrders, p), undefined)
  assert.equal(order.references, 0)
  assert.equal(p.state, 19, 'the unobstructed fixture can immediately enter local resting')
  assert.equal(p.substate, 0)
  assert.equal(u.native, p)
  assert.deepEqual([p.anchorX, p.anchorY, p.anchorFlags], [11008, 56064, 0])
})
