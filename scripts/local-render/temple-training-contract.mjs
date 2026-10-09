import assert from 'node:assert/strict'

const live = p => p && p.kind === 'brave' && p.team === 'blue' && p.hp > 0
const empty = s =>
  s.target &&
  !(s.target.admission.activity & 128) &&
  !s.target.admission.inside &&
  s.target.admission.occupants.every(id => !id) &&
  !s.target.admission.queueHead &&
  !s.target.admission.queueFrom &&
  !s.target.admission.entering &&
  !s.target.workers.length
const released = s => !s.record && !s.latch && s.reservations === 0 && !s.dom.present
const unpainted = s => !s.dom.focused && !s.dom.hovered && (!s.dom.present || s.dom.hidden)
export const templeIdleReady = s =>
  s.target?.hp > 0 &&
  s.target.progress >= 1 &&
  s.target.builders.every(id => !id) &&
  !(s.target.admission.activity & 0x8000) &&
  empty(s) &&
  !s.record &&
  !s.latch &&
  s.reservations === 0 &&
  unpainted(s)
export function assertTempleIdleReadiness(s) {
  assert(
    templeIdleReady(s),
    'Idle Temple requires empty gameplay and ownership; a hidden inactive cache is allowed'
  )
}

export function assertTempleTrainInput(evidence, targetId, traineeId) {
  assert.equal(evidence.restored, true)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(
    evidence.events.map(row => row.type),
    ['pointerdown', 'pointerup']
  )
  for (const event of evidence.events) {
    assert(event.trusted && event.targetMatches && event.canvasOwned && event.button === 0)
    assert(!event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey)
    assert.deepEqual(event.state.selected, [traineeId])
  }
  const before = evidence.events[0].state,
    after = evidence.events[1].state,
    person = after.trainee
  assert.equal(after.turn, before.turn)
  assert.equal(after.target.id, targetId)
  assert(live(person))
  assert.equal(person.id, traineeId)
  assert.equal(person.entryPersonId, traineeId)
  assert.equal(person.entryIdentity, person.registeredIdentity)
  assert(person.entryIdentity)
  assert.equal(person.entryOrdersMatch, true)
  assert.equal(person.commands.length, 8)
  assert.equal(person.order.model, 8)
  assert.equal(person.order.a, targetId)
  assert.equal(person.order.flags & 1, 0)
  assert.equal(person.order.references, 1)
  assert.equal(person.work, targetId)
  assert(person.orderId > 0)
  return { traineeId, targetId, personIdentity: person.entryIdentity, orderId: person.orderId }
}

export function assertTempleFreshRequest(row, targetId, traineeId) {
  assert.equal(row.kind, 'request')
  assert.equal(row.receiverMatches, true)
  assert.equal(row.threw, false)
  const { before, after } = row
  assert.equal(after.turn, before.turn)
  assert.equal(before.target.id, targetId)
  assert.equal(before.target.kind, 'temple')
  assert.equal(before.target.admission.model, 5)
  assert.equal(before.target.admission.class, 2)
  assert.equal(before.target.team, 'blue')
  assert(
    before.target.hp > 0 && before.target.progress >= 1 && before.target.admission.activity & 128
  )
  assert(live(before.trainee))
  assert.equal(before.trainee.id, traineeId)
  assert.equal(before.target.admission.inside, 1)
  assert.deepEqual(before.target.admission.occupants.filter(Boolean), [traineeId])
  assert.equal(before.record, null)
  assert.equal(before.latch, false)
  assert.equal(before.reservations, 0)
  assert.equal(row.result, 'automatic:created')
  assert.deepEqual(
    { ...after.record, identity: 0 },
    { identity: 0, automatic: true, phase: -1, remaining: 0, hold: 16 }
  )
  assert.equal(after.latch, true)
  assert.equal(after.reservations, 1)
  // The chosen idle precondition is separate from this source boundary: actual
  // input may hover an existing cache before admission. This callback must not
  // create, reveal, hide, focus or remove any DOM itself.
  assert.deepEqual(
    after.dom,
    before.dom,
    'Automatic callback must preserve the preexisting DOM cache'
  )
  assert.deepEqual(after.target, before.target)
  assert.deepEqual(after.trainee, before.trainee)
  assert.deepEqual(after.preachers, before.preachers)
  assert.equal(after.trained, before.trained)
  return after.record.identity
}

export function assertTempleLifecycle(
  epoch,
  { targetId, traineeId, initialPreachers, initialTrained, complete = true }
) {
  assert(epoch.closed && !epoch.overflow)
  assert.deepEqual(epoch.errors, [])
  if (complete) {
    assert(released(epoch.initial), 'Loaded Scene must start without transient panel ownership')
    assert(epoch.initial.target.admission.activity & 128)
  }
  const requests = epoch.records.filter(row => row.kind === 'request')
  assert(requests.length > 0)
  const identity = assertTempleFreshRequest(requests[0], targetId, traineeId)
  const targetIdentity = requests[0].after.target.identity
  for (const row of requests) {
    assert(row.receiverMatches && !row.threw)
    assert.deepEqual(row.after.target, row.before.target)
    assert.deepEqual(row.after.trainee, row.before.trainee)
    assert.deepEqual(row.after.preachers, row.before.preachers)
    assert.equal(row.after.trained, row.before.trained)
    assert.equal(row.after.turn, row.before.turn)
    assert(live(row.before.trainee))
    assert.equal(row.before.trainee.id, traineeId)
    assert.deepEqual(row.before.target.admission.occupants.filter(Boolean), [traineeId])
    assert.equal(row.before.target.admission.inside, 1)
  }
  const steps = epoch.records.filter(
    row => row.kind === 'step' && row.ordinal > requests[0].ordinal
  )
  let previous = { phase: -1, remaining: 0, hold: 16 },
    held = 0,
    exit = 0,
    retired = false
  for (const row of steps) {
    assert(row.receiverMatches && !row.threw)
    const { before, after } = row
    assert.equal(after.target.identity, targetIdentity)
    assert.equal(after.target.id, targetId)
    assert(after.target.hp > 0 && after.target.progress >= 1)
    if (retired) {
      assert(released(after))
      continue
    }
    assert(before.record)
    assert.equal(before.record.identity, identity)
    assert.equal(before.record.phase, previous.phase)
    assert.equal(before.record.remaining, previous.remaining)
    const active = !!(before.target.admission.activity & 128)
    let expected
    if (previous.phase === -1) expected = [0, 2]
    else if (previous.phase === 0)
      expected = previous.remaining ? [0, previous.remaining - 1] : [1, 15]
    else if (previous.phase === 1 && active) expected = [1, 15]
    else if (previous.phase === 1) expected = [2, 2]
    else expected = previous.remaining ? [2, previous.remaining - 1] : null
    if (!expected) {
      assert(released(after))
      retired = true
      assert.equal(exit, 3)
    } else {
      assert(after.record)
      assert.equal(after.record.identity, identity)
      assert.equal(after.record.automatic, true)
      assert.deepEqual([after.record.phase, after.record.remaining], expected)
      assert.equal(after.record.hold, 16)
      assert.equal(after.reservations, 1)
      assert.equal(after.latch, expected[0] < 2)
      if (
        previous.phase === 1 &&
        expected[0] === 1 &&
        active &&
        before.offTarget &&
        after.offTarget
      )
        held++
      if (expected[0] === 2) exit++
      previous = { ...after.record }
    }
  }
  assert(held >= 4, 'Four actual off-target active visits required')
  if (!complete) {
    assert.equal(epoch.disposed, true, 'Initial Scene must be disposed by public Load')
    // Disposal owns the initial epoch's release; it is not a natural conversion claim.
    assert(released(epoch.final))
    return { firstRequest: requests[0].ordinal, heldVisits: held }
  }
  assert(retired, 'Natural record retirement required')
  assert(empty(epoch.final) && released(epoch.final))
  assert.equal(epoch.final.trained, initialTrained + 1)
  assert(!epoch.final.trainee || epoch.final.trainee.hp <= 0)
  const fresh = epoch.final.preachers.filter(p => !initialPreachers.includes(p.id))
  assert.equal(fresh.length, 1)
  assert.equal(epoch.final.preachers.length, initialPreachers.length + 1)
  assert(fresh[0].hp > 0 && fresh[0].team === 'blue' && fresh[0].kind === 'preacher')
  return {
    firstRequest: requests[0].ordinal,
    heldVisits: held,
    traineeId,
    replacementId: fresh[0].id,
    trained: epoch.final.trained,
  }
}
