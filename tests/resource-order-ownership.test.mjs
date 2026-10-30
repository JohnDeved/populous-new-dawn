import assert from 'node:assert/strict'
import test from 'node:test'
import { emptyPersonOrder, writePersonOrder, appendPersonOrders, removePersonOrder } from '../app/person-orders.ts'

// Actual order writer, allocator, eligibility, append and release functions.
// Routing/harvesting preparation is deliberately supplied: these tests assert
// its invocation payload and ownership, not live picking or native search parity.
function person(id) {
  return { id, model: 2, state: 17, substate: 0, x: 0x1200, y: 0x5600,
    flags2: 0, flags3: 0, flags4: 0, assignment: 0, selectionFlags: 128,
    commands: Array(8).fill(0), commandCursor: 0, immediateCommand: 0,
    orderLocation: 0, commandStatus: 0, workTarget: 0 }
}
function fixture() {
  const pool = { records: Array.from({ length: 800 }, emptyPersonOrder), cursor: 1, active: 0 }
  const calls = [], deleted = [], acknowledged = []
  const unexpected = () => assert.fail('unexpected world effect')
  const effects = {
    prepare(order, model, a, b, flags) {
      calls.push({ model, a, b, flags })
      Object.assign(order, { model, a, b, flags })
    },
    deleteObject(id) { deleted.push(id) },
    acknowledge(first, counts) { acknowledged.push({ first, counts: [...counts] }) },
    stopWork: unexpected, releaseSpell: unexpected, releaseFight: unexpected, special: unexpected,
  }
  return { pool, calls, deleted, acknowledged, effects }
}
function resource(subtype) {
  const order = emptyPersonOrder()
  writePersonOrder(order, 7, subtype, 0x5612, 128)
  return order
}

test('resource append carries each selector and shares one record until the last selected owner releases it', () => {
  for (const [subtype, selector] of [[0, 12], [1, 4], [2, 8]]) {
    const f = fixture(), a = person(1), b = person(2), untouched = person(3)
    untouched.selectionFlags = 0
    const before = structuredClone(untouched), command = resource(subtype)
    assert.equal(command.flags, 128 | selector)
    assert.ok(appendPersonOrders(f.pool, command, [a, b, untouched], f.effects))
    const id = a.commands[0]
    assert.ok(id > 0)
    assert.equal(b.commands[0], id)
    assert.deepEqual(untouched, before)
    assert.deepEqual(f.calls, Array(2).fill({ model: 7, a: 0x1280, b: 0x5680, flags: 128 | selector }))
    assert.equal(f.pool.records[id].flags, 128 | selector)
    assert.equal(f.pool.records[id].references, 2)
    assert.equal(f.pool.active, 1)
    assert.equal(f.acknowledged.length, 1)
    assert.equal(f.acknowledged[0].first, 1)
    assert.equal(f.acknowledged[0].counts[2], 2)
    f.pool.records[id].object = 777
    removePersonOrder(f.pool, a, 0, f.effects)
    assert.equal(f.pool.records[id].references, 1)
    assert.equal(f.pool.active, 1)
    assert.deepEqual(f.deleted, [])
    removePersonOrder(f.pool, b, 0, f.effects)
    assert.equal(f.pool.records[id].references, 0)
    assert.equal(f.pool.active, 0)
    assert.deepEqual(f.deleted, [777])
    assert.equal(a.assignment & 0x8000, 0x8000)
    assert.equal(b.assignment & 0x8000, 0x8000)
  }
})

test('full circular resource queue uses immediate slot and releases the previous immediate owner without replacing queued orders', () => {
  const f = fixture(), p = person(1)
  for (let id = 1; id <= 9; id++) Object.assign(f.pool.records[id], { model: 7, flags: 8, references: 1 })
  p.commands = [1, 2, 3, 4, 5, 6, 7, 8]
  p.commandCursor = 5
  p.immediateCommand = 9
  f.pool.records[9].object = 777
  f.pool.active = 9
  const queued = structuredClone(f.pool.records.slice(1, 9))
  assert.ok(appendPersonOrders(f.pool, resource(2), [p], f.effects))
  assert.deepEqual(p.commands, [1, 2, 3, 4, 5, 6, 7, 8])
  assert.deepEqual(f.pool.records.slice(1, 9), queued)
  assert.equal(p.commandCursor, 5)
  assert.equal(p.immediateCommand, 10)
  assert.equal(f.pool.records[9].references, 0)
  assert.equal(f.pool.records[10].references, 1)
  assert.equal(f.pool.records[10].flags, 136)
  assert.equal(f.pool.active, 9)
  assert.deepEqual(f.deleted, [777])
})

test('exhausted resource append leaves every existing order, person and input command untouched without acknowledgments', () => {
  const f = fixture(), p = person(1), command = resource(2)
  for (let id = 1; id < 800; id++) Object.assign(f.pool.records[id], { model: 7, references: 1, flags: 8 })
  f.pool.active = 799
  p.commands[0] = 1
  p.immediateCommand = 2
  const before = structuredClone({ pool: f.pool, p, command })
  assert.equal(appendPersonOrders(f.pool, command, [p], f.effects), false)
  assert.deepEqual({ pool: f.pool, p, command }, before)
  assert.deepEqual(f.calls, [])
  assert.deepEqual(f.deleted, [])
  assert.deepEqual(f.acknowledged, [])
})
