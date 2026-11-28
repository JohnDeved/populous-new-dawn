import assert from 'node:assert/strict'
import test from 'node:test'
import { readTerrainTextures, terrainAtlas } from '../app/terrain-texture.ts'

const mapCells = 128 * 128
const size = 8
const width = size * 128
const imageBytes = width * width * 4

function fixture() {
  const tex = readTerrainTextures(new ArrayBuffer(386048))
  tex.palette.set([21, 35, 72, 255, 55, 88, 180, 255])
  for (let i = 0; i < tex.colors.length; i++) tex.colors[i] = i % 2
  tex.cliffs[1] = 1
  return {
    tex,
    land: {
      heights: new Uint16Array(mapCells).fill(5),
      cliffs: new Uint8Array(mapCells),
      shadows: new Uint8Array(mapCells),
      flags: new Uint8Array(mapCells),
    },
  }
}

test('first terrain atlas fills the supplied image in place and still requests the full upload bounds', () => {
  const { land, tex } = fixture()
  const previousImage = new Uint8Array(imageBytes).fill(155)
  const normal = terrainAtlas(land, tex, undefined, size)
  const first = terrainAtlas(land, tex, undefined, size, undefined, previousImage)
  assert.ok(first.pixels === previousImage, 'first atlas must keep the supplied image backing')
  assert.deepEqual(first, normal)
  assert.equal(first.updated, mapCells)
  assert.deepEqual(first.updatedBounds, [0, 0, width, width])

  const undersized = new Uint8Array(imageBytes - 1).fill(42)
  assert.throws(() => terrainAtlas(land, tex, undefined, size, undefined, undersized), RangeError)
  assert.equal(undersized[0], 42)
})

test('dirty land rebuild still reuses the atlas backing and matches a fresh rebuild', () => {
  const { land, tex } = fixture()
  const first = terrainAtlas(land, tex, undefined, size)
  land.heights[4000] += 21
  const update = terrainAtlas(land, tex, first, size)
  assert.ok(update.pixels === first.pixels)
  assert.ok(update.updated > 0 && update.updated < mapCells)
  assert.ok(update.updatedBounds)
  const fresh = terrainAtlas(land, tex, undefined, size)
  assert.deepEqual(update.pixels, fresh.pixels)
  assert.deepEqual(update.cells, fresh.cells)

  const unchanged = terrainAtlas(land, tex, update, size)
  assert.ok(unchanged.pixels === update.pixels)
  assert.equal(unchanged.updated, 0)
  assert.equal(unchanged.updatedBounds, null)
})

test('a different atlas lifecycle has independent storage', () => {
  const { land, tex } = fixture()
  const first = terrainAtlas(land, tex, undefined, size)
  const fresh = terrainAtlas(land, tex, undefined, size)
  assert.ok(first.pixels !== fresh.pixels)
  assert.deepEqual(first.pixels, fresh.pixels)
})
