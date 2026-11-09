import test from 'node:test'
import assert from 'node:assert/strict'
import { getBrowserModelSunlightShades, modelLighting, sunlightShades } from '../app/model-lighting.ts'

test('browser-current lighting returns one frozen static table', () => {
  const table = getBrowserModelSunlightShades()
  assert.equal(getBrowserModelSunlightShades(), table)
  assert.equal(Object.isFrozen(table), true)
  assert.equal(table.length, 1024)
  assert.ok(table.every(value => Number.isInteger(value) && value >= 0 && value <= 255))
  assert.deepEqual(table, sunlightShades())
})

test('a borrower cannot modify the renderer-owned table', () => {
  const table = getBrowserModelSunlightShades(), before = [...table]
  assert.throws(() => { table[0] = 0 }, TypeError)
  assert.throws(() => table.push(0), TypeError)
  assert.deepEqual(getBrowserModelSunlightShades(), before)
})

test('the existing sunlight factory remains independent and mutable', () => {
  const table = getBrowserModelSunlightShades(), separate = sunlightShades()
  assert.notEqual(separate, table)
  assert.equal(Object.isFrozen(separate), false)
  const old = table[0]
  separate[0] = old + 1
  assert.equal(table[0], old)
})

test('ordinary model rendering consumes the exposed table in every heading quadrant', () => {
  const data = {
    p: [0, 0, 0, 1, 0, 0, 0, 1, 0], uv: [0, 0, 0, 0, 0, 0], scale: 1,
    faces: [3, 15], tiles: [0], normals: [[0, 383, 767, 1023]], modes: [6], biases: [0],
  }
  const table = getBrowserModelSunlightShades()
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    const actual = modelLighting(data, data.p, 4, quadrant * 512)
    assert.deepEqual(actual.shades, Array(3).fill(table[data.normals[0][quadrant]]))
  }
})
