import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/model.ts'
import { refreshTerrainSurface } from '../app/world-terrain-runtime.ts'

const GRID = 97
const at = (x, z) => (z + 48) * GRID + x + 48
const neighbor = (index, x, y) =>
  (((index >>> 7) + y) & 127) * 128 + (((index & 127) + x) & 127)

// Keep the original point sampler and generic refresh loop as an independent
// oracle. In particular, each signed product shifts separately before the final
// signed-short conversion; averaging corners first changes legitimate results.
function legacyPointHeight(land, point) {
  const index = ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9),
    heights = land.heights,
    a = heights[index],
    b = heights[neighbor(index, 0, 1)],
    c = heights[neighbor(index, 1, 1)],
    d = heights[neighbor(index, 1, 0)],
    x = (point.x & 510) >> 1,
    y = (point.y & 510) >> 1
  const height = land.flags[index] & 1
    ? x + y < 256
      ? a + (((d - a) * x) >> 8) + (((b - a) * y) >> 8)
      : c + (((d - c) * (256 - y)) >> 8) + (((b - c) * (256 - x)) >> 8)
    : y < x
      ? a + (((c - d) * y) >> 8) + (((d - a) * x) >> 8)
      : a + (((c - b) * x) >> 8) + (((b - a) * y) >> 8)
  return (height << 16) >> 16
}

function legacyRefresh(world) {
  for (let index = 0; index < world.terrain.length; index++) {
    const x = (index % GRID) - 48,
      z = Math.floor(index / GRID) - 48,
      height = legacyPointHeight(world.land, { x: (x + 8) * 256, y: (-z - 8) * 256 }) / 45
    world.terrain[index] = height || -0.35
  }
  world.terrainVersion++
  world.landVersion = world.terrainVersion
}

function world(length = GRID * GRID) {
  return {
    land: { heights: new Int16Array(16384), flags: new Uint32Array(16384) },
    terrain: new Array(length).fill(NaN),
    terrainVersion: 17,
    landVersion: 3,
  }
}

function random(seed) {
  return () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0)
}

function compare(actual, label = '') {
  const expected = {
      land: { heights: actual.land.heights.slice(), flags: actual.land.flags.slice() },
      terrain: actual.terrain.slice(),
      terrainVersion: actual.terrainVersion,
      landVersion: actual.landVersion,
    },
    output = actual.terrain,
    heights = actual.land.heights,
    flags = actual.land.flags,
    heightBuffer = heights.buffer,
    flagBuffer = flags.buffer
  legacyRefresh(expected)
  refreshTerrainSurface(actual)
  assert.deepEqual(actual.terrain, expected.terrain, label)
  assert.equal(actual.terrainVersion, expected.terrainVersion, `${label}: terrain version`)
  assert.equal(actual.landVersion, expected.landVersion, `${label}: land version`)
  assert.equal(actual.terrain, output, `${label}: output identity`)
  assert.equal(actual.land.heights, heights, `${label}: height view identity`)
  assert.equal(actual.land.flags, flags, `${label}: flag view identity`)
  assert.equal(heights.buffer, heightBuffer)
  assert.equal(flags.buffer, flagBuffer)
  assert.deepEqual(heights, expected.land.heights, `${label}: unchanged heights`)
  assert.deepEqual(flags, expected.land.flags, `${label}: unchanged flags`)
}

test('surface resampling matches all 9,409 legacy samples with independently mixed stored diagonals', () => {
  for (const seed of [0x12345678, 0x87654321, 0x9e3779b9]) {
    const actual = world(),
      nextHeight = random(seed),
      nextFlag = random(seed ^ 0xbb67ae85),
      diagonals = [0, 0]
    for (let index = 0; index < actual.land.heights.length; index++) {
      actual.land.heights[index] = nextHeight() >>> 16
      const bits = nextFlag(),
        diagonal = bits >>> 31
      actual.land.flags[index] = (bits & ~1) | diagonal
      diagonals[diagonal]++
    }
    assert.ok(diagonals.every(count => count > 4000))
    compare(actual, `seed ${seed}`)
    assert.ok(Array.isArray(actual.terrain))
    assert.ok(actual.terrain.every(Number.isFinite))
  }
})

test('surface centers retain separate signed shifts, signed-short wrap and exact zero replacement', () => {
  const cases = [
    { diagonal: 0, corners: [-32768, -32767, -32768, 0], center: 32767 / 45 },
    { diagonal: 1, corners: [0, -32768, -32767, -32768], center: 32767 / 45 },
    { diagonal: 0, corners: [0, 1, 0, 0], center: -1 / 45 },
    { diagonal: 1, corners: [0, 1, 0, 1], center: -0.35 },
  ]
  for (const { diagonal, corners, center } of cases) {
    const actual = world()
    for (const [index, height] of [[0, corners[0]], [128, corners[1]],
      [129, corners[2]], [1, corners[3]]]) actual.land.heights[index] = height
    actual.land.flags[0] = 0x84000100 | diagonal
    compare(actual, `${corners}; diagonal ${diagonal}`)
    assert.equal(actual.terrain[at(-7, -9)], center)
  }
  for (const height of [-32768, -1, 0, 1, 32767]) {
    const actual = world()
    actual.land.heights.fill(height)
    compare(actual, `flat signed height ${height}`)
    assert.ok(actual.terrain.every(value => Object.is(value, height / 45 || -0.35)))
  }
})

test('surface resampling crosses both native seams and fills the final odd row and column', () => {
  const actual = world()
  for (let index = 0; index < actual.land.heights.length; index++) {
    actual.land.heights[index] = (index * 31) ^ (index >>> 1)
    actual.land.flags[index] = ((index & 127) ^ (index >>> 7)) & 1
  }
  compare(actual)
  for (const [x, z] of [[-9, -8], [-8, -9], [-8, -8], [-7, -9],
    [-48, -48], [48, -48], [-48, 48], [48, 48]]) {
    const expected = legacyPointHeight(actual.land, { x: (x + 8) * 256, y: (-z - 8) * 256 }) / 45
    assert.equal(actual.terrain[at(x, z)], expected || -0.35, `seam/edge ${x}, ${z}`)
  }
  for (let index = 0; index < GRID; index++) {
    assert.ok(Number.isFinite(actual.terrain[(GRID - 1) * GRID + index]))
    assert.ok(Number.isFinite(actual.terrain[index * GRID + GRID - 1]))
  }
})

test('surface refresh on an actual world observes stored diagonal edits and advances versions once', () => {
  const actual = createWorld(1),
    output = actual.terrain
  assert.ok(Array.isArray(output))
  actual.land.heights[0] = 0
  actual.land.heights[128] = 0
  actual.land.heights[129] = 100
  actual.land.heights[1] = 0
  actual.land.flags[0] &= ~1
  const previousVersion = actual.terrainVersion
  compare(actual, 'original stored diagonal')
  assert.equal(actual.terrain[at(-7, -9)], 50 / 45)
  assert.equal(actual.terrainVersion, previousVersion + 1)
  actual.land.flags[0] |= 1
  compare(actual, 'only the stored diagonal changes')
  assert.equal(actual.terrain[at(-7, -9)], -0.35)
  assert.equal(actual.terrainVersion, previousVersion + 2)
  assert.equal(actual.landVersion, previousVersion + 2)
  assert.equal(actual.terrain, output)
})

test('surface refresh preserves the generic loop for nonstandard output and native plane lengths', () => {
  for (const length of [0, 1, 96, 97, 98, 9408, 9410, 9506]) {
    const actual = world(length)
    for (let index = 0; index < actual.land.heights.length; index++) {
      actual.land.heights[index] = index * 13
      actual.land.flags[index] = (index >>> 3) & 1
    }
    compare(actual, `output length ${length}`)
    assert.equal(actual.terrain.length, length)
  }
  for (const plane of ['heights', 'flags']) {
    const actual = world()
    actual.land.heights.fill(135)
    actual.land[plane] = actual.land[plane].subarray(0, 16383)
    compare(actual, `short native ${plane} plane`)
  }
})

test('surface refresh supports offset native views without touching their surrounding bytes', () => {
  const heightBuffer = new ArrayBuffer(32784),
    flagBuffer = new ArrayBuffer(65560),
    actual = world()
  new Uint8Array(heightBuffer).fill(0xa7)
  new Uint8Array(flagBuffer).fill(0x69)
  actual.land.heights = new Int16Array(heightBuffer, 8, 16384)
  actual.land.flags = new Uint32Array(flagBuffer, 12, 16384)
  for (let index = 0; index < actual.land.heights.length; index++) {
    actual.land.heights[index] = (index * 8191) ^ (index >>> 5)
    actual.land.flags[index] = (index >>> 3) & 1
  }
  const beforeHeights = new Uint8Array(heightBuffer).slice(),
    beforeFlags = new Uint8Array(flagBuffer).slice()
  compare(actual)
  assert.deepEqual(new Uint8Array(heightBuffer), beforeHeights)
  assert.deepEqual(new Uint8Array(flagBuffer), beforeFlags)
})
