import assert from 'node:assert/strict'

function workerAlive(snapshot) {
  assert.equal(snapshot.worker?.id, snapshot.workerId)
  assert.equal(snapshot.worker.kind, 'brave')
  assert.equal(snapshot.worker.team, 'blue')
  assert(snapshot.worker.hp > 0)
  assert.equal(snapshot.worker.tree, null)
  assert.equal(snapshot.worker.harvesting, false)
  assert.equal(snapshot.worker.delivery, null)
  assert.equal(snapshot.worker.fighting, false)
  assert.equal(snapshot.worker.builder, false)
}

function healthyHut(snapshot) {
  assert.equal(snapshot.level, 1)
  assert.equal(snapshot.target?.id, snapshot.targetId)
  assert.equal(snapshot.target.kind, 'hut')
  assert.equal(snapshot.target.team, 'blue')
  assert.equal(snapshot.target.level, 1)
  assert(snapshot.target.hp > 0 && snapshot.target.hp <= 170)
  assert.equal(snapshot.target.damage, 0)
  assert.equal(snapshot.target.burning, false)
  assert.equal(snapshot.target.preparing, false)
  assert.equal(snapshot.target.upgrading, false)
}

export function assertHutResidentReady(snapshot) {
  healthyHut(snapshot)
  workerAlive(snapshot)
  assert.equal(snapshot.status, 'playing')
  assert.equal(snapshot.inputMask, 0)
  assert.equal(snapshot.speed, 1)
  assert.equal(snapshot.target.progress, 1)
  assert.equal(snapshot.target.hp, 170)
  assert.equal(snapshot.target.remaining, 300)
  assert.equal(snapshot.target.logs, 300)
  assert.equal(snapshot.target.activity & 0x8000, 0)
  assert.equal(snapshot.target.inside, 1)
  assert.deepEqual(snapshot.target.occupants.filter(Boolean), [snapshot.workerId])
  assert.equal(snapshot.target.queueHead, 0)
  assert.equal(snapshot.target.queueFrom, 0)
  assert.equal(snapshot.target.entering, 0)
  assert.deepEqual(snapshot.target.builders, [])
  assert.deepEqual(snapshot.staff, [snapshot.workerId])
  assert.equal(snapshot.worker.inside, snapshot.targetId)
  assert.equal(snapshot.worker.resident, true)
  assert.equal(snapshot.worker.entry, false)
  assert.equal(snapshot.worker.cargo, 0)
  assert.deepEqual(snapshot.targetOrders, [])
  assert.deepEqual(snapshot.otherTimberActors, [])
  for (const tree of snapshot.timber) {
    assert.equal(tree.burning, false)
    assert.equal(tree.reservations, 0)
  }
}

export function assertHutDismantleStarted(before, after, sameResidentPerson) {
  assertHutResidentReady(before)
  healthyHut(after)
  workerAlive(after)
  assert.equal(after.turn, before.turn, 'click evidence must bracket the synchronous handler')
  assert.deepEqual(before.selected, [], 'clear selection before ordinary pointer dwell')
  assert.deepEqual(after.selected, [])
  assert.equal(sameResidentPerson, true, 'resident must become the registered entry owner')
  assert.equal(after.worker.resident, false)
  assert.equal(after.worker.entry, true)
  assert.equal(after.worker.registered, true)
  assert.equal(after.worker.entryOrdersMatch, true)
  assert.equal(after.worker.inside, null)
  assert.equal(after.worker.work, after.targetId)
  assert.equal(after.worker.order?.model, 10)
  assert.equal(after.worker.order.a, after.targetId)
  assert.equal(after.worker.order.flags & 1, 0)
  assert.equal(after.worker.order.references, 1)
  assert.equal(after.target.activity & 0x8000, 0x8000)
  assert.equal(after.target.inside, 0)
  assert.deepEqual(after.target.occupants.filter(Boolean), [])
  assert.equal(after.targetOrders.length, 1)
  assert.equal(after.targetOrders[0].id, after.worker.orderId)
  assert.equal(after.target.remaining, before.target.remaining)
  assert.equal(after.worker.cargo, before.worker.cargo)
  assert.deepEqual(after.timber, before.timber)
}

// The ledger is deliberately narrow: any competing timber work is a rejected
// episode, not a guessed attribution. Baseline trees may grow naturally; their
// quantities must never fall. Every new loose log remains individually named.
export function assertHutTimberLedger(baseline, current) {
  assertHutResidentReady(baseline)
  workerAlive(current)
  assert.equal(current.targetId, baseline.targetId)
  assert.equal(current.workerId, baseline.workerId)
  assert.equal(
    current.worker.hp,
    baseline.worker.hp,
    'unrelated worker damage invalidates the episode'
  )
  assert.deepEqual(current.otherTimberActors, [])
  // world.wood is a periodically recomputed scenery total, including growing
  // trees and earlier drops. It is diagnostic only, never recovery credit.
  const initial = new Map(baseline.timber.map(tree => [tree.id, tree]))
  assert.equal(new Set(current.timber.map(tree => tree.id)).size, current.timber.length)
  for (const tree of baseline.timber) {
    const retained = current.timber.find(candidate => candidate.id === tree.id)
    assert(retained, `baseline timber ${tree.id} disappeared`)
    assert.equal(retained.model, tree.model)
    assert(retained.amount >= tree.amount, `baseline timber ${tree.id} was consumed`)
    if (tree.model === 11) assert.equal(retained.amount, tree.amount)
    assert.equal(retained.burning, false)
    assert.equal(retained.reservations, 0)
  }
  const dropped = current.timber.filter(tree => !initial.has(tree.id))
  for (const tree of dropped) {
    assert.equal(tree.model, 11, 'only newly dropped loose timber is credited')
    assert.equal(tree.amount, 100)
    assert.equal(tree.burning, false)
    assert.equal(tree.reservations, 0)
  }
  const remaining = current.target?.remaining ?? 0,
    carried = current.worker.cargo - baseline.worker.cargo,
    loose = dropped.reduce((sum, tree) => sum + tree.amount, 0)
  assert([0, 100, 200, 300].includes(remaining))
  assert([0, 100].includes(carried))
  if (current.target) {
    healthyHut(current)
    assert.equal(current.target.logs, remaining)
    assert.equal(current.target.progress, remaining / 300)
    assert.equal(current.target.activity & 0x8000, 0x8000)
    assert.deepEqual(current.staff, [current.workerId])
    assert.equal(current.worker.entry, true)
    assert.equal(current.worker.registered, true)
    assert.equal(current.worker.entryOrdersMatch, true)
    assert.equal(current.worker.order?.model, 10)
    assert.equal(current.worker.order.a, current.targetId)
    assert.equal(current.worker.order.flags & 1, 0)
    assert.equal(current.worker.order.references, 1)
    assert.equal(current.targetOrders.length, 1)
    assert.equal(current.targetOrders[0].id, current.worker.orderId)
  }
  assert.equal(
    remaining + carried + loose,
    300,
    'remaining plus net recovered timber must equal 300'
  )
  return {
    remaining,
    carried,
    loose,
    recovered: carried + loose,
    droppedIds: dropped.map(tree => tree.id),
  }
}

// Call on each actual fixed turn, not an intermittent polling sample. A transfer
// consumes exactly 100 remaining units into this worker; a drop exchanges its
// carried 100 for one freshly allocated model11 identity on a separate turn.
export function assertHutTimberVisit(baseline, previous, current) {
  assert.equal(current.turn, previous.turn + 1, 'no unobserved simulation turns')
  const before = assertHutTimberLedger(baseline, previous),
    after = assertHutTimberLedger(baseline, current),
    transferred = before.remaining - after.remaining,
    carried = after.carried - before.carried,
    dropped = after.droppedIds.filter(id => !before.droppedIds.includes(id))
  if (current.target && previous.target)
    assert.equal(
      current.target.hp,
      Math.min(previous.target.hp, 170 * previous.target.progress),
      'building-turn health follows the preceding dismantle progress'
    )
  if (current.worker.entry && previous.worker.entry)
    assert.equal(
      current.worker.orderId,
      previous.worker.orderId,
      'the same dismantle order continues'
    )
  for (const tree of previous.timber) {
    const retained = current.timber.find(candidate => candidate.id === tree.id)
    assert(
      retained && retained.amount >= tree.amount,
      `timber ${tree.id} was consumed between visits`
    )
  }
  assert([0, 100].includes(transferred))
  if (transferred) {
    assert.equal(carried, 100)
    assert.deepEqual(dropped, [])
    assert.equal(previous.worker.order?.model, 10)
    assert.equal(previous.worker.order.a, previous.targetId)
    assert.equal(previous.worker.phase, 3, 'the real work phase owns timber recovery')
  } else if (dropped.length) {
    assert.equal(dropped.length, 1)
    assert.equal(carried, -100)
    assert.equal(previous.worker.order?.model, 10)
    assert.equal(previous.worker.order.a, previous.targetId)
  } else assert.equal(carried, 0)
  return { turn: current.turn, transferred, dropped, ...after }
}

export function assertHutPartialCheckpoint(baseline, saved) {
  const ledger = assertHutTimberLedger(baseline, saved)
  assert([100, 200].includes(ledger.remaining), 'Save must contain actual partial work')
  assert.equal(saved.paused, true)
  assert.equal(saved.worker.entry, true)
  assert.equal(saved.worker.registered, true)
  assert.equal(saved.worker.entryOrdersMatch, true)
  assert.equal(saved.worker.order?.model, 10)
  assert.equal(saved.worker.order.a, saved.targetId)
  assert.equal(saved.worker.order.references, 1)
  assert.equal(saved.worker.order.flags & 1, 0)
  assert.equal(saved.worker.nativeCargo, saved.worker.cargo)
  return ledger
}

export function assertHutDismantleFinished(baseline, final) {
  const ledger = assertHutTimberLedger(baseline, final)
  assert.equal(final.target, null)
  assert.equal(ledger.recovered, 300)
  assert.equal(final.worker.entry, false)
  assert.equal(final.worker.inside, null)
  assert.equal(final.worker.work, null)
  assert.equal(final.worker.orderId, 0)
  assert.deepEqual(final.targetOrders, [])
  assert.deepEqual(final.staff, [])
  assert.equal(final.footprint, false)
  assert.equal(final.reservations, 0)
  assert(final.presentation, 'actual Scene cleanup must be observed')
  assert.equal(final.presentation.currentWorld, true)
  for (const key of ['record', 'latch', 'panel', 'hovered', 'menuOpen'])
    assert.equal(final.presentation[key], false, key)
  return ledger
}
