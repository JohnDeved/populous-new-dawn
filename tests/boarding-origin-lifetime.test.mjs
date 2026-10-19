import test from 'node:test'
import assert from 'node:assert/strict'
import * as boarding from '../app/vehicle-boarding-orders.ts'
import { allocatePersonOrder, emptyPersonOrder } from '../app/person-orders.ts'

const order = (b, known = true) => ({
  ...emptyPersonOrder(),
  model: 22,
  b,
  ...(known ? { boardingOriginKnown: true } : {}),
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

test('captured origin zero is distinct from unmarked legacy payloads', () => {
  assert.equal(boarding.boardingTargetLeftOrigin(order(0), target(10, 0)), true)
  for (const b of [0, 0x1234]) {
    const legacy = order(b, false),
      before = structuredClone(legacy)
    assert.equal(boarding.boardingTargetLeftOrigin(legacy, target(128, 128)), false)
    assert.deepEqual(legacy, before, 'unknown origin is not inferred or mutated')
  }
  assert.equal(
    boarding.boardingTargetLeftOrigin({ ...order(0), model: 3 }, target(10, 0)),
    false,
    'the browser marker does not reinterpret another native command model'
  )
})

test('reusing a zero-reference command slot clears captured-origin provenance', () => {
  const record = order(0),
    pool = { cursor: 1, active: 0, records: Array.from({ length: 800 }, emptyPersonOrder) }
  pool.records[1] = record
  assert.equal(allocatePersonOrder(pool), 1)
  assert.equal(Object.hasOwn(record, 'boardingOriginKnown'), false)
  assert.equal(record.b, 0, 'native payload preservation remains unchanged')
  assert.equal(boarding.boardingTargetLeftOrigin(record, target(10, 0)), false)
})
