import assert from 'node:assert/strict'
import test from 'node:test'
import rules from '../app/original-rules.json' with { type: 'json' }
import { terrainQuarterPassable, updateWalkMasks } from '../app/native-terrain.ts'

const indexOf = cell => (cell >>> 9) * 128 + ((cell & 254) >>> 1)
const neighbor = (index, x, y) =>
  (((index >>> 7) + y) & 127) * 128 + (((index & 127) + x) & 127)

// These are the original allocation-heavy formulas, kept independent of the
// optimized helper shared by terrainQuarterPassable and updateWalkMasks.
function legacyQuarterPassable(land, cell, limit) {
  const index = indexOf(cell),
    heights = land.heights,
    a = heights[index],
    b = heights[neighbor(index, 0, 1)],
    c = heights[neighbor(index, 1, 1)],
    d = heights[neighbor(index, 1, 0)],
    quarter = cell & 1 ? (cell & 256 ? 2 : 3) : (cell >> 8) & 1
  const corners = land.flags[index] & 1
    ? quarter === 0 ? [a, b, d] : quarter === 2 ? [b, c, d] : [a, b, c, d]
    : quarter === 1 ? [a, b, c] : quarter === 3 ? [a, c, d] : [a, b, c, d]
  return Math.max(0, ...corners) - Math.min(1024, ...corners) <= limit
}

function legacyUpdate(land, center, suppliedRadius) {
  const radius = (suppliedRadius << 16) >> 16
  if (radius < 0) throw new RangeError('Negative native walk-mask radius')
  const limits = [rules.landHeightConstant, rules.alternateLandHeightConstant]
  for (let pass = 0; pass < 2; pass++)
    for (let y = 0; y < radius * 4 + 1; y++)
      for (let x = 0; x < radius * 4 + 1; x++) {
        const cell =
          (((center & 255) - radius * 2 + x) & 255) |
          ((((center >>> 8) - radius * 2 + y) & 255) << 8)
        const allowed = !(land.flags[indexOf(cell)] & 0x80004) &&
          legacyQuarterPassable(land, cell, limits[pass])
        const mask = land.walkMasks[pass],
          byte = cell >> 3,
          bit = 1 << (cell & 7)
        mask[byte] = allowed ? mask[byte] | bit : mask[byte] & ~bit
      }
}

function terrain() {
  return {
    heights: new Int16Array(16384),
    flags: new Uint32Array(16384),
    walkMasks: [new Uint8Array(8192), new Uint8Array(8192)],
  }
}

function random(seed) {
  return () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0)
}

function compare(land, jobs, label = '') {
  const expected = structuredClone(land),
    arrays = [land.heights, land.flags, ...land.walkMasks],
    buffers = arrays.map(array => array.buffer),
    masks = land.walkMasks
  for (const [cell, radius] of jobs) legacyUpdate(expected, cell, radius)
  for (const [cell, radius] of jobs) updateWalkMasks(land, cell, radius)
  // Compare the entire input/output graph: masks may deliberately alias inputs.
  assert.deepEqual(land, expected, label)
  assert.equal(land.walkMasks, masks)
  for (const [index, array] of [land.heights, land.flags, ...land.walkMasks].entries()) {
    assert.equal(array, arrays[index], `${label}: view ${index}`)
    assert.equal(array.buffer, buffers[index], `${label}: buffer ${index}`)
  }
}

test('walk masks match the legacy loop across seeded terrain and independently mixed diagonals', () => {
  for (const seed of [0x12345678, 0x87654321, 0x9e3779b9]) {
    const nextHeight = random(seed),
      nextFlag = random(seed ^ 0x6a09e667),
      land = terrain()
    for (let index = 0; index < land.heights.length; index++) {
      const height = nextHeight()
      land.heights[index] = index % 5 ? (height >>> 16) % 2048 - 512 : height
      // Use an independent stream's high bit; successive LCG low bits alternate.
      const flags = nextFlag()
      land.flags[index] = (flags & ~0x80005) | (flags >>> 31) |
        (index % 17 === 0 ? 4 : 0) | (index % 29 === 0 ? 0x80000 : 0)
    }
    for (const mask of land.walkMasks)
      for (let index = 0; index < mask.length; index++) mask[index] = nextHeight() >>> 16
    const jobs = Array.from({ length: 96 }, () => [nextHeight(), nextHeight() % 4])
    compare(land, jobs, `seed ${seed}`)
  }
})

test('quarter ranges preserve signed extrema, stored diagonals, exact limits and blocked mask bits', () => {
  const thresholds = [rules.landHeightConstant, rules.alternateLandHeightConstant],
    patterns = [
      [0, 0, 512, 0],
      [1024, 1025, 1024, 1024],
      [-32768, -32768, -32768, -32768],
      [32767, 32767, 32767, 32767],
      [-32768, 32767, -1, 1025],
      ...thresholds.flatMap(limit => [-1, 0, 1].map(delta => [0, 0, limit + delta, 0])),
    ]
  for (const corners of patterns)
    for (const diagonal of [0, 1])
      for (const blocked of [0, 4, 0x80000, 0x80004]) {
        const land = terrain()
        for (const [index, height] of [[0, corners[0]], [128, corners[1]],
          [129, corners[2]], [1, corners[3]]]) land.heights[index] = height
        land.flags[0] = 0x84000100 | blocked | diagonal
        land.walkMasks[0].fill(0xa5)
        land.walkMasks[1].fill(0x5a)
        for (const cell of [0, 1, 256, 257])
          for (const limit of [-1, 0, 1.5, ...thresholds, 32767, 65535, Infinity, NaN])
            assert.equal(terrainQuarterPassable(land, cell, limit),
              legacyQuarterPassable(land, cell, limit), `${corners}; ${diagonal}; ${cell}; ${limit}`)
        compare(land, [0, 1, 256, 257].map(cell => [cell, 0]),
          `${corners}; diagonal ${diagonal}; blocked ${blocked}`)
      }
})

test('walk-mask refreshes preserve wrapped seams and native signed-short coercions', () => {
  const land = terrain(),
    next = random(0xbadc0ffe)
  for (let index = 0; index < land.heights.length; index++) {
    land.heights[index] = next() >>> 20
    land.flags[index] = next() >>> 31
  }
  land.walkMasks[0].fill(0xff)
  land.walkMasks[1].fill(0x69)
  compare(land, [
    [0, 2], [255, 1], [65280, 1], [65535, 2], [-1, 65537],
    [4294967297, 1.875], [-2147483648, -65536], [NaN, NaN],
    [Infinity, Infinity], [-Infinity, 0], [-1.75, -0.75],
  ])
  compare(land, [[65535, 65]], 'refresh square crosses both seams more than once')
})

test('walk-mask refreshes change only requested bits and observe subsequent input edits', () => {
  const land = terrain()
  land.walkMasks[0].fill(0x55)
  land.walkMasks[1].fill(0xaa)
  compare(land, [[3, 0]])
  assert.equal(land.walkMasks[0][0], 0x5d)
  assert.equal(land.walkMasks[1][0], 0xaa)
  assert.equal(land.walkMasks[0][1], 0x55)
  assert.equal(land.walkMasks[1][1], 0xaa)
  land.flags[indexOf(3)] |= 4
  compare(land, [[3, 0]])
  assert.equal(land.walkMasks[0][0], 0x55)
  assert.equal(land.walkMasks[1][0], 0xa2)
  land.flags[indexOf(3)] &= ~4
  land.heights[indexOf(3)] = -32768
  compare(land, [[3, 0]])
})

test('walk-mask refreshes retain offset views, surrounding bytes and original buffer identities', () => {
  const makeView = (Type, length, offset) => {
    const buffer = new ArrayBuffer(offset + length * Type.BYTES_PER_ELEMENT + 16)
    new Uint8Array(buffer).fill(0xa7)
    return new Type(buffer, offset, length)
  }
  const land = {
    heights: makeView(Int16Array, 16384, 8),
    flags: makeView(Uint32Array, 16384, 12),
    walkMasks: [makeView(Uint8Array, 8192, 9), makeView(Uint8Array, 8192, 13)],
  }
  land.heights.fill(100)
  land.flags.fill(1)
  const backing = [land.heights, land.flags, ...land.walkMasks]
    .map(array => new Uint8Array(array.buffer).slice())
  compare(land, [[0, 2], [65535, 1]])
  for (const [index, array] of [land.heights, land.flags, ...land.walkMasks].entries()) {
    const bytes = new Uint8Array(array.buffer),
      end = array.byteOffset + array.byteLength
    assert.deepEqual(bytes.subarray(0, array.byteOffset), backing[index].subarray(0, array.byteOffset))
    assert.deepEqual(bytes.subarray(end), backing[index].subarray(end))
  }
})

test('walk-mask refreshes retain the legacy write order for overlapping views', () => {
  const types = [Int16Array, Uint32Array, Uint8Array, Uint8Array],
    lengths = [16384, 16384, 8192, 8192]
  for (let first = 0; first < 4; first++)
    for (let second = first + 1; second < 4; second++) {
      const shared = new ArrayBuffer(65536)
      new Uint8Array(shared).fill(3)
      const arrays = [new Int16Array(16384), new Uint32Array(16384),
        new Uint8Array(8192), new Uint8Array(8192)]
      arrays[first] = new types[first](shared, 0, lengths[first])
      arrays[second] = new types[second](shared, second >= 2 ? 1 : 0, lengths[second])
      compare({ heights: arrays[0], flags: arrays[1], walkMasks: arrays.slice(2) },
        [[0, 2], [255, 1]], `shared views ${first}/${second}`)
    }
})

test('negative converted walk-mask radii fail before any mutation', () => {
  for (const radius of [-1, -1.25, 32768, 65535, 98304, -65537]) {
    const land = terrain()
    land.walkMasks[0].fill(0xa5)
    const before = structuredClone(land)
    assert.throws(() => updateWalkMasks(land, 0, radius),
      { name: 'RangeError', message: 'Negative native walk-mask radius' })
    assert.deepEqual(land, before)
  }
})
