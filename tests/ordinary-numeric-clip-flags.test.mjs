import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { OrdinaryNumericProjection } from '../app/ordinary-numeric-projection.ts'

// Exact helper bytes from fba1b019d6852a35853fa4ed4d95525841b32466.
// Loading an old RenderView with candidate helper imports is not an independent oracle.
const frozenSource = readFileSync(
  new URL('./fixtures/ordinary-numeric-projection-before-clip.ts.txt', import.meta.url), 'utf8'
)
assert.equal(
  createHash('sha256').update(frozenSource).digest('hex'),
  '509943ed976fadfb515d6d496d209e04c2f3ab417c6c9525708f8a368fc5ce0b'
)
// A synthetic app-local URL keeps the original helper's dependency resolution;
// the exact frozen fixture stays outside TypeScript's production source glob.
const baselineURL = new URL('../app/__ordinary_numeric_before_clip.ts', import.meta.url).href
const hook = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === baselineURL) return { url: baselineURL, shortCircuit: true }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url === baselineURL)
      return { format: 'module', shortCircuit: true,
        source: stripTypeScriptTypes(frozenSource, { mode: 'transform' }) }
    return next(url, context)
  },
})
let BaselineProjection
try {
  BaselineProjection = (await import(baselineURL)).OrdinaryNumericProjection
} finally {
  hook.deregister()
}

const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
const projection = (changes = {}) => ({
  matrix: [16384, 0, 0, 0, 16384, 0, 0, 0, 16384],
  curvature: 0, depth: 16384, perspective: 0, scale: 65536,
  width: 800, height: 600, centerX: 400, centerY: 300,
  fractionX: 0, fractionY: 0, pixelScaleX: 1, pixelScaleY: 1,
  ...changes,
})
const pair = () => [new OrdinaryNumericProjection(), new BaselineProjection()]

function compareAppend([actual, baseline], args) {
  const inputs = structuredClone(args)
  const expectedSlot = baseline.append(...args), slot = actual.append(...args)
  assert.equal(slot, expectedSlot)
  assert.equal(actual.length, baseline.length)
  assert.deepEqual(
    Array.from(actual.values.subarray(0, actual.length * 6)),
    Array.from(baseline.values.subarray(0, baseline.length * 6))
  )
  assert.deepEqual(args, inputs, 'neither helper mutates caller inputs')
  return slot
}

test('owned numeric coordinates match frozen helper at every viewport clip boundary', () => {
  const helpers = pair(), observedFlags = new Set()
  for (const [centerX, centerY, expectedFlags] of [
    [400, 300, 0], [0, 0, 0], [799, 599, 0],
    [-1, 300, 2], [800, 300, 4], [801, 300, 4],
    [400, -1, 8], [400, 600, 16], [400, 601, 16],
    [-1, -1, 2], [800, 600, 4],
  ]) {
    // Raw (-8, 0, -8) has zero native-relative coordinates. The viewport
    // centers therefore place the projection exactly on either side of each edge.
    compareAppend(helpers, [-8, 0, -8, identity, 0, 0,
      projection({ centerX, centerY }), 16384])
    const flags = helpers[1].projected.flags
    assert.equal(flags, expectedFlags, 'baseline fixture really exercises this clip branch')
    observedFlags.add(flags)
  }
  assert.deepEqual([...observedFlags].sort((a, b) => a - b), [0, 2, 4, 8, 16])
})

test('nonpositive projection depths preserve sentinel coordinates and numeric depth lanes', () => {
  const helpers = pair()
  for (const depth of [-16384, -1, 0, 1, 16384])
    for (const configDepth of [-1, 0, 16384, 32768, 32769]) {
      const slot = compareAppend(helpers, [-8, 0, -8, identity, 0, 0,
        projection({ depth, centerX: 1, centerY: 1 }), configDepth])
      assert.equal(helpers[0].values[slot * 6 + 5], configDepth / 16384 - 1)
      if (depth <= 0) {
        assert.equal(helpers[1].projected.screenX, -15)
        assert.equal(helpers[1].projected.screenY, 17)
      }
    }
})

test('full transforms and nonfinite or signed-zero inputs preserve all six exact lanes', () => {
  const helpers = pair()
  for (const matrix of [identity,
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 256, -0.125, -256, 1],
    [1, 0, 0.125, 0, 0.25, 2, 0, 0, 0, 0.5, 1, 0.0001, 4, -8, 16, 1],
  ])
    for (const value of [-Infinity, -128, -0, 0, 0.125, 127.5, Infinity, NaN])
      for (const axis of [0, 1, 2]) {
        const point = [-8, 0, -8]
        point[axis] = value
        compareAppend(helpers, [...point, matrix, -32768, 32768,
          projection({ curvature: 128, pixelScaleX: 1.5, pixelScaleY: 1.5 }), 16384])
      }
})

test('reused records and reset storage do not carry clip flags into later coordinates', () => {
  const helpers = pair()
  for (const centerX of [-1, 400, 800, 0, 400]) {
    helpers.forEach(helper => helper.reset())
    assert.equal(compareAppend(helpers, [-8, 0, -8, identity, 0, 0,
      projection({ centerX }), 16384]), 0)
    assert.equal(compareAppend(helpers, [-7, 0.125, -6, identity, 0, 0,
      projection(), 16384]), 1)
  }
})
