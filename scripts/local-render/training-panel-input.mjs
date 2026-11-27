import assert from 'node:assert/strict'

// All imported helpers below are read-only. The real ordinary input remains the
// only selection/order producer; this receipt does not create a person or mana.
export async function trainingReadiness({ id, scene = window.testSceneRef.current, mana, occupancy } = {}) {
  mana ??= await import('/app/mana.ts')
  occupancy ??= await import('/app/building-occupants.ts')
  const w = scene.world, b = w.buildings.find(b => b.id === id)
  const people = w.units.filter(u => u.team === 'blue' && u.hp > 0)
  return structuredClone({ turn: w.turn, selected: w.selected,
    braves: people.filter(u => u.kind === 'brave').map(u => u.id),
    warriors: people.filter(u => u.kind === 'warrior').map(u => u.id),
    shaman: people.filter(u => u.kind === 'shaman').map(u => u.id),
    generatedMana: mana.generatedMana(mana.liveManaOrders, mana.manaPeople(w), w.manaTribes)[0],
    singleCost: occupancy.nativeTrainingCost(people.filter(u => u.kind === 'warrior').length, 3, w.manaTribes[0].playerType),
    tribe: w.manaTribes[0], camp: b && { id: b.id, timer: b.timer, admission: b.admission },
    trained: w.stats.trained, level: w.outcome.level, speed: w.speed, paused: w.paused })
}

export function assertSingleTrainingInput(records, target, point) {
  const input = records.filter(row => row.phase === 'train-one-brave' && row.kind === 'input' && row.canvasTarget &&
    ['pointerdown', 'pointerup'].includes(row.type))
  assert.deepEqual(input.map(row => [row.type, row.trusted, row.canvasOwned, row.button, row.x, row.y]),
    ['pointerdown', 'pointerup'].map(type => [type, true, true, 0, point.x, point.y]))
  assert.ok(input.every(row => row.modifiers.every(value => !value)))
  const { before, after } = input[1]
  assert.equal(before.turn, after.turn); assert.equal(before.mode, null)
  assert.equal(before.selected.length, 1)
  const person = after.training.people.find(person => person.id === before.selected[0])
  assert.equal(person?.kind, 'brave'); assert.equal(person.team, 'blue'); assert.ok(person.hp > 0)
  assert.equal(person.work, target.id); assert.equal(person.orderOwner, 'entry.person')
  assert.equal(person.orderPersonId, person.id)
  assert.ok(Number.isInteger(person.orderOwnerIdentity) && person.orderOwnerIdentity > 0)
  assert.equal(person.registeredIdentity, person.orderOwnerIdentity); assert.equal(person.entryOrdersMatch, true)
  assert.ok(Array.isArray(person.commands) && person.commands.length === 8)
  assert.ok(person.commands.every(id => Number.isInteger(id) && id >= 0))
  assert.ok(Number.isInteger(person.commandCursor) && person.commandCursor >= 0 && person.commandCursor < 8)
  const orders = person.commands.map(id => ({ id, value: after.orders.records[id] }))
    .filter(({ value }) => value?.model === 8 && value.a === target.id && !(value.flags & 1))
  assert.equal(orders.length, 1); assert.equal(orders[0].value.references, 1)
  return { personId: person.id, personIdentity: person.orderOwnerIdentity, orderId: orders[0].id, inputOrdinal: input[1].ordinal }
}

export function assertAutomaticRequest(row, id, { fresh = true, traineeId } = {}) {
  assert.equal(row.kind, 'automatic-training-request'); assert.equal(row.target, id)
  assert.equal(row.receiverMatches, true); assert.equal(row.threw, false)
  assert.equal(row.before.turn, row.after.turn)
  const beforeCamp = row.before.training.camps.find(b => b.id === id)
  const afterCamp = row.after.training.camps.find(b => b.id === id)
  assert.ok(beforeCamp.admission.activity & 128)
  if (traineeId !== undefined) {
    assert.equal(beforeCamp.admission.inside, 1)
    assert.deepEqual(beforeCamp.admission.occupants.filter(Boolean), [traineeId])
    const trainee = row.before.training.people.find(person => person.id === traineeId)
    assert.equal(trainee?.kind, 'brave'); assert.equal(trainee.team, 'blue'); assert.ok(trainee.hp > 0)
    assert.equal(trainee.inside, id)
  }
  assert.deepEqual(afterCamp.admission, beforeCamp.admission, 'UI callback precedes conversion and does not change gameplay')
  assert.deepEqual(row.after.training.people, row.before.training.people)
  assert.equal(row.after.training.trained, row.before.training.trained)
  const record = row.after.records.find(record => record.id === id)
  assert.equal(record?.automatic, true); assert.equal(row.after.training.latches.includes(id), true)
  assert.equal(afterCamp.reservationCount, 1)
  if (fresh) {
    assert.equal(row.before.records.some(record => record.id === id), false)
    assert.equal(row.before.training.latches.includes(id), false)
    assert.deepEqual([record.phase, record.remaining, record.hold], [-1, 0, 16])
    assert.equal(row.after.panels.some(panel => panel.id === id), false, 'Fresh callback cannot paint before a controller step')
  }
  return record
}

export function assertAutomaticLifecycle(records, id, epoch, initialTrained, traineeId) {
  assert.ok(Number.isInteger(traineeId) && traineeId > 0)
  const requests = records.filter(row => row.kind === 'automatic-training-request' && row.epoch === epoch && row.target === id)
  assert.ok(requests.length > 0)
  const first = assertAutomaticRequest(requests[0], id, { traineeId })
  const target = requests[0].before.training.camps.find(b => b.id === id)
  const originalIds = new Set(requests[0].before.training.people.map(person => person.id))
  assert.equal(requests[0].before.training.trained, initialTrained)
  const ticks = records.filter(row => row.kind === 'tick' && row.epoch === epoch && row.ordinal > requests[0].ordinal)
  const same = state => state.records.find(record => record.id === id)
  const shape = record => record && [record.identity, record.automatic, record.phase, record.remaining, record.hold]
  let expected = shape(first), heldVisits = 0, expiry, release, replacement
  for (const row of ticks) {
    assert.deepEqual(shape(same(row.before)), expected, 'Actual record cannot disappear, restart or change ownership between visits')
    for (const state of [row.before, row.after]) {
      const camp = state.training.camps.find(b => b.id === id)
      assert.equal(camp?.identity, target.identity); assert.ok(camp.hp > 0); assert.equal(camp.progress, 1)
    }
    let [, , phase, remaining, hold] = expected
    const active = !!(row.before.training.camps.find(b => b.id === id).admission.activity & 128)
    if (phase === 1) {
      remaining = active ? hold : 0
      if (active) {
        heldVisits++
        assert.notEqual(row.after.input?.object?.id, id)
        assert.ok(!row.after.panels.some(panel => panel.id === id && (panel.hovered || panel.focused)))
      } else if (!expiry) expiry = row
    }
    if (!remaining) { phase++; remaining = phase === 1 ? hold : 3 }
    if (phase === 3) {
      assert.equal(same(row.after), undefined, 'Phase2 zero retires on the next existing visit')
      release = row; break
    }
    remaining--
    expected = [first.identity, true, phase, remaining, hold]
    assert.deepEqual(shape(same(row.after)), expected, 'Exact existing 3/16/3 visit sequence required')
    assert.equal(row.after.training.latches.includes(id), phase < 2)
    assert.equal(row.after.training.camps.find(b => b.id === id).reservationCount, 1)
  }
  assert.ok(heldVisits >= 4, 'Four real phase1 held visits required')
  assert.ok(expiry, 'Activity clear must enter phase2 on an actual visit')
  assert.ok(release, 'Natural record retirement required')
  for (const state of [expiry.after, release.after]) {
    assert.equal(state.training.trained, initialTrained + 1, 'Exactly the one selected Brave must train')
    assert.ok(!state.training.people.some(person => person.id === traineeId && person.hp > 0), 'Original trainee must retire')
    const created = state.training.people.filter(person => person.hp > 0 && person.kind === 'warrior' && !originalIds.has(person.id))
    assert.equal(created.length, 1, 'Exactly one new living Blue Warrior replacement required')
    assert.equal(created[0].team, 'blue'); assert.equal(created[0].kind, 'warrior')
    replacement ??= created[0].id; assert.equal(created[0].id, replacement)
    const camp = state.training.camps.find(b => b.id === id)
    assert.equal(camp.admission.activity & 128, 0); assert.equal(camp.admission.inside, 0)
    assert.ok(camp.admission.occupants.every(value => value === 0))
    for (const key of ['queueHead', 'queueFrom', 'entering']) assert.equal(camp.admission[key], 0)
    assert.equal(state.training.latches.includes(id), false)
  }
  assert.equal(release.after.training.camps.find(b => b.id === id).reservationCount, 0)
  assert.equal(release.after.panels.some(panel => panel.id === id), false)
  return { firstRequest: requests[0].ordinal, heldVisits, expiry: expiry.ordinal,
    release: release.ordinal, traineeId, replacementId: replacement, trained: release.after.training.trained }
}
