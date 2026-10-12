import test from 'node:test'
import assert from 'node:assert/strict'
import { clearFollowingBoardingOrders } from '../app/vehicle-boarding-orders.ts'

test('post-boarding cleanup scans seven circular slots and preserves other orders', () => {
  const record = (model, a, references = 1, flags = 0, object = 0) => ({
    model,
    a,
    references,
    flags,
    object,
    b: 0,
  })
  const pool = {
      cursor: 9,
      active: 8,
      records: [
        null,
        record(22, 10),
        record(22, 10, 1, 0, 99),
        record(22, 11),
        record(3, 10),
        record(22, 12),
        record(22, 10, 1, 1),
        record(22, 10, 2),
        record(22, 10),
      ],
    },
    person = { commands: [2, 3, 4, 5, 6, 7, 1, 8], commandCursor: 6 },
    model = id =>
      new Map([
        [10, 1],
        [11, 3],
      ]).get(id),
    events = []
  const aiPool = structuredClone(pool),
    ai = structuredClone(person)
  clearFollowingBoardingOrders(aiPool, ai, 1, 1, model, () => assert.fail('AI cleanup'))
  assert.deepEqual(aiPool, pool)
  assert.deepEqual(ai, person)
  clearFollowingBoardingOrders(pool, person, 2, 1, model, id => {
    events.push([id, person.commands[0], pool.records[2].references, pool.active])
  })
  assert.deepEqual(person.commands, [0, 3, 4, 5, 6, 0, 1, 0])
  assert.deepEqual(events, [[99, 0, 0, 6]])
  assert.equal(pool.records[7].references, 1)
  assert.equal(pool.records[1].references, 1)
  assert.equal(pool.active, 6)
})
