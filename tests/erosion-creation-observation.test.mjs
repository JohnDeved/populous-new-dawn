import assert from 'node:assert/strict'
import test from 'node:test'
import { createErosion, stepErosion } from '../app/erosion.ts'
import * as observation from '../app/erosion-observation.ts'

const center = { x: 63744, y: 35072, h: 200 }
const fixture = () => ({ land: { heights: new Int16Array(16384).fill(200) }, game: { randomState: 123 } })

test('prospective declaration binds the exact constructor return before immediate first processing', () => {
  const expected = { x: center.x, y: center.y }, handle = observation.declareNextErosionCapture(expected)
  try {
    expected.x = 0
    const controller = createErosion(center), before = structuredClone(controller), f = fixture()
    assert.equal(handle.matches(controller), true)
    assert.equal(handle.matches(structuredClone(controller)), false)
    assert.deepEqual(controller, before)
    assert.equal(stepErosion(f.land, controller, f.game, { sound() {}, terrain() {} }), true)
    const capture = handle.read()
    assert.deepEqual(capture.creation, { center, remaining: 64 })
    assert.equal(capture.visits.length, 1)
    assert.equal(capture.visits[0].before.remaining, 64)
    assert.equal(capture.visits[0].after.remaining, 63)
    capture.creation.center.x = 0
    assert.deepEqual(handle.read().creation.center, center)
  } finally { handle.detach() }
})

test('wrong first target and second creation fail permanently without replacing or mutating controllers', () => {
  for (const mode of ['wrong-first', 'same-second', 'different-second']) {
    const handle = observation.declareNextErosionCapture(center)
    try {
      const firstCenter = mode === 'wrong-first' ? { ...center, x: 4 } : center
      const first = createErosion(firstCenter), before = structuredClone(first)
      if (mode !== 'wrong-first') createErosion(mode === 'same-second' ? center : { ...center, y: 8 })
      assert.ok(handle.status().failure)
      const replacement = createErosion(center)
      assert.equal(handle.matches(replacement), false)
      assert.equal(handle.matches(first), false)
      assert.deepEqual(first, before)
      assert.deepEqual(replacement, { center, remaining: 64 })
      const f = fixture()
      assert.equal(stepErosion(f.land, first, f.game, { sound() {}, terrain() {} }), true)
      assert.equal(handle.status().count, 0)
    } finally { handle.detach() }
  }
})

test('duplicate declarations invalidate the original instead of overwriting or rearming it', () => {
  const handle = observation.declareNextErosionCapture(center)
  try {
    assert.throws(() => observation.declareNextErosionCapture(center), /already|active/)
    const controller = createErosion(center)
    assert.ok(handle.status().failure); assert.equal(handle.matches(controller), false)
  } finally { handle.detach() }
})

test('late declarations cannot bind a preexisting controller; close is idempotent and never auto-rearms', () => {
  const old = createErosion(center), before = structuredClone(old)
  const handle = observation.declareNextErosionCapture(center)
  assert.equal(handle.matches(old), false)
  handle.detach(); handle.detach()
  const later = createErosion(center)
  assert.equal(handle.matches(later), false)
  assert.equal(handle.status().created, false)
  assert.deepEqual(old, before); assert.deepEqual(later, before)
})

test('a constructor exception retains its identity and cannot bind a partial object', () => {
  const handle = observation.declareNextErosionCapture(center), sentinel = new Error('constructor argument')
  try {
    assert.throws(() => createErosion({ get x() { throw sentinel }, y: center.y, h: center.h }), error => error === sentinel)
    assert.equal(handle.status().created, false)
  } finally { handle.detach() }
})

test('constructor diagnostic binding failures never change the returned object or its immediate step', () => {
  for (const diagnostic of ['', { toString() { throw Error('unprintable') } }]) {
    const handle = observation.declareNextErosionCapture(center), set = WeakMap.prototype.set
    let controller
    try {
      try {
        WeakMap.prototype.set = () => { throw diagnostic }
        controller = createErosion(center)
      } finally { WeakMap.prototype.set = set }
      assert.deepEqual(controller, { center, remaining: 64 })
      assert.ok(handle.status().failure)
      const f = fixture()
      assert.equal(stepErosion(f.land, controller, f.game, { sound() {}, terrain() {} }), true)
      assert.equal(controller.remaining, 63); assert.equal(handle.status().count, 0)
    } finally { WeakMap.prototype.set = set; handle.detach() }
  }
})
