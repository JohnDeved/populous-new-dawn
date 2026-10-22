import test from 'node:test'
import assert from 'node:assert/strict'
import { helpContextTopic } from '../app/help-topic.ts'

const object = (type, model, extra = {}) => ({ type, model, flags: 0, ...extra })
const topic = picked => helpContextTopic({ picked })

test('source person and building model tables preserve every addressed entry', () => {
  for (const [model, expected] of [null, 992, 1024, 1025, 1027, 1028, 1026, 1023, 1020].entries())
    assert.equal(topic(object(1, model)), expected)
  for (const [model, expected] of [null, 996, 996, 996, 997, 999, 1000, 998, 1001, 996,
    996, 996, 996, 1002, 1002, 1003, 1003, 1004, 990].entries())
    assert.equal(topic(object(2, model)), expected)
  assert.equal(topic(object(1, 99)), null)
  assert.equal(topic(object(2, 99)), null)
})

test('vehicle and scenery use original flags and subtype, never display names', () => {
  assert.equal(topic(object(4, 1, { vehicleFlags: 0 })), 993)
  assert.equal(topic(object(4, 2, { vehicleFlags: 1 })), 994)
  assert.equal(topic(object(4, 2)), null, 'missing source definition is not guessed')
  for (const model of [1, 2, 3, 4, 5, 6, 11]) assert.equal(topic(object(5, model)), 986)
  for (const [shrineType, expected] of [[1, 1070], [2, 989], [4, 991], [3, null]])
    assert.equal(topic(object(5, 9, { shrineType })), expected)
  assert.equal(topic(object(5, 7)), null)
})

test('HUD controls precede world context and missing help metadata uses Control Panel', () => {
  for (const [hud, expected] of [[{ topic: 1051 }, 1051], [{ topic: 0 }, 1046], [null, null]])
    assert.equal(helpContextTopic({ hud, picked: object(1, 7) }), expected)
})

test('valid picked object, fallback object, cell building and terrain have native priority', () => {
  const cell = { flags: 0x10200, terrainFlags: 0, building: object(2, 18) }
  assert.equal(helpContextTopic({ picked: object(1, 7), fallback: object(1, 2), cell }), 1023)
  assert.equal(helpContextTopic({ picked: object(1, 7, { flags: 1 }), fallback: object(1, 2), cell }), 1024)
  assert.equal(helpContextTopic({ picked: object(0, 7), cell }), 990)
  assert.equal(helpContextTopic({ picked: object(3, 1), cell }), null, 'valid unsupported object retains topic')
  cell.building.flags = 1
  assert.equal(helpContextTopic({ cell }), 988)
  cell.flags = 0
  assert.equal(helpContextTopic({ cell }), 987)
  cell.terrainFlags = 1
  assert.equal(helpContextTopic({ cell }), null, 'ordinary empty ground retains topic')
  assert.equal(helpContextTopic({}), null)
})


test('cell building pointer is ignored unless native cell flag0x200 is present', () => {
  const cell = { flags: 0, terrainFlags: 0, building: object(2, 18) }
  assert.equal(helpContextTopic({ cell }), 987)
  cell.terrainFlags = 1
  assert.equal(helpContextTopic({ cell }), null)
  cell.flags = 0x200
  assert.equal(helpContextTopic({ cell }), 990)
})
