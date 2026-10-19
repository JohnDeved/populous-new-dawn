import test from 'node:test'
import assert from 'node:assert/strict'
import * as boarding from '../app/vehicle-boarding-orders.ts'
import { allocatePersonOrder, emptyPersonOrder } from '../app/person-orders.ts'

const order = b => ({
  ...emptyPersonOrder(),
  model: 22,
  b,
})
const target = (x, y) => ({ x: x * 256, y: y * 256 })

test('boarding origin limit uses wrapped unhalved byte distances and cancels at 100', () => {
  const left = boarding.boardingTargetLeftOrigin
  // The clicked point is not even-cell masked; only the current craft cell is.
  assert.equal(left(order(0x0101), target(8, 8)), false, '7² + 7² = 98')
  assert.equal(left(order(0x0101), target(9, 9)), false, 'current odd cells round down to 8/8')
  assert.equal(left(order(0x0000), target(6, 8)), true, '6² + 8² = 100')
  assert.equal(left(order(0x0000), target(10, 0)), true, '10² = 100')
  assert.equal(left(order(0x0101), target(8, 6)), false, '7² + 5² = 74')
  assert.equal(left(order(0x0101), target(10, 6)), true, '9² + 5² = 106')
  assert.equal(left(order(0xfffe), target(2, 2)), false, 'wraps both byte axes')
  assert.equal(left(order(0), target(511, 511)), false, 'mask current position to cell 254/254')
  assert.equal(
    left(order(0x807f), target(128, 128)),
    false,
    'signed-short seam is not a large jump'
  )
})

test('every boarding origin expires without browser metadata, including zero', () => {
  for (const b of [0, 0x1234]) {
    const command = { model: 22, b },
      before = structuredClone(command)
    assert.equal(boarding.boardingTargetLeftOrigin(command, target(128, 128)), true)
    assert.deepEqual(command, before, 'testing the origin does not mutate its payload')
  }
  assert.equal(
    boarding.boardingTargetLeftOrigin({ ...order(0), model: 3 }, target(10, 0)),
    false,
    'the origin limit does not reinterpret another native command model'
  )
})

test('reusing a zero-reference command slot clears identity and retains native payloads', () => {
  const record = { ...order(0x1234), a: 62, flags: 128, object: 91 },
    pool = { cursor: 1, active: 0, records: Array.from({ length: 800 }, emptyPersonOrder) }
  pool.records[1] = record
  assert.equal(allocatePersonOrder(pool), 1)
  assert.deepEqual([record.model, record.flags, record.object], [0, 0, 0])
  assert.deepEqual([record.a, record.b], [62, 0x1234], 'native payloads survive allocation')
  assert.equal(boarding.boardingTargetLeftOrigin(record, target(10, 0)), false)
})
