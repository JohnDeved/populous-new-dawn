// Production CPU atlas and scene upload caller; fake only the WebGL transfer boundary.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { readTerrainTextures, terrainAtlas } from '../app/terrain-texture.ts'
import { createFootprints, stampFootprints } from '../app/footprints.ts'

const raw = readFileSync('public/original/landscape.bin')
const textures = readTerrainTextures(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength))
const cellAt = (x, z) => ((68 + x) & 127) | (((59 - z) & 127) << 7)
const equalBytes = (actual, expected, label) =>
  assert.equal(Buffer.compare(actual, expected), 0, label)

function copyRegion(source, destination, width, [left, top, right, bottom]) {
  assert.ok(left >= 0 && top >= 0 && left < right && top < bottom)
  assert.ok(right <= width && bottom <= width)
  for (let y = top; y < bottom; y++) {
    const start = (y * width + left) * 4
    destination.set(source.subarray(start, start + (right - left) * 4), start)
  }
}

test('changed atlas bounds cover exact pixels across sparse, seam, repeated and dense edits at both sizes', async () => {
  const { createWorld } = await loadSceneFixture()
  for (const size of [8, 32]) {
    const world = createWorld(2), width = size * 128
    let atlas = terrainAtlas(world.land, textures, undefined, size)
    assert.deepEqual(atlas.updatedBounds, [0, 0, width, width])
    const uploaded = atlas.pixels.slice(), pixels = atlas.pixels
    const cases = [
      ['local height', () => { world.land.heights[cellAt(20, 30)] += 31 }],
      ['repeat local height', () => { world.land.heights[cellAt(20, 30)] += 17 }],
      ['shadow only', () => { world.land.shadows[cellAt(50, 70)] ^= 7 }],
      ['native seams', () => { world.land.heights[0] += 23; world.land.heights[16383] += 29 }],
      ['atlas seams', () => { world.land.heights[cellAt(0, 0)] += 13; world.land.heights[cellAt(127, 127)] += 19 }],
      ['dense', () => { for (let i = 0; i < 16384; i++) world.land.heights[i]++ }],
    ]
    for (const [name, mutate] of cases) {
      mutate()
      atlas = terrainAtlas(world.land, textures, atlas, size)
      assert.equal(atlas.pixels, pixels, `${name}: CPU image identity`)
      assert.ok(atlas.updated > 0, name)
      assert.ok(atlas.updatedBounds.every(value => value % size === 0), name)
      copyRegion(atlas.pixels, uploaded, width, atlas.updatedBounds)
      const fresh = terrainAtlas(world.land, textures, undefined, size)
      equalBytes(atlas.pixels, fresh.pixels, `${name}: incremental CPU shading`)
      equalBytes(uploaded, fresh.pixels, `${name}: bounded transfer covers every changed byte`)
      if (name === 'local height') {
        const [left, top, right, bottom] = atlas.updatedBounds
        assert.ok((right - left) * (bottom - top) * 4 < pixels.byteLength / 100)
      }
      if (name === 'dense') {
        assert.equal(atlas.updated, 16384)
        assert.deepEqual(atlas.updatedBounds, [0, 0, width, width])
      }
      atlas = terrainAtlas(world.land, textures, atlas, size)
      assert.equal(atlas.updated, 0, `${name}: repeated unchanged check`)
      assert.equal(atlas.updatedBounds, null)
    }
  }
})

function sceneFixture(world) {
  const uploads = [], gpu = new Uint8Array(4096 * 4096 * 4)
  let uploadedVersion, lost = false
  const render = texture => {
    if (lost || uploadedVersion === texture.version) return
    gpu.set(texture.image.data)
    uploads.push({ kind: 'full', bounds: [0, 0, 4096, 4096], bytes: gpu.byteLength })
    uploadedVersion = texture.version
  }
  const renderer = {
    getContext: () => ({ isContextLost: () => lost }),
    copyTextureToTexture(source, destination, region, position) {
      assert.equal(lost, false, 'lost context must defer to a pending full upload')
      render(destination) // Three initializes pending/restored/disposed targets before copying.
      assert.equal(source.version, 0, 'staging source stays unbound')
      assert.equal(source.image, destination.image)
      assert.equal(destination.flipY, false, 'the existing DataTexture row orientation')
      assert.deepEqual([position.x, position.y], [region.min.x, region.min.y])
      const bounds = [region.min.x, region.min.y, region.max.x, region.max.y]
      assert.ok(bounds.every(value => value % 32 === 0))
      copyRegion(source.image.data, gpu, 4096, bounds)
      uploads.push({ kind: 'region', bounds, bytes: (bounds[2] - bounds[0]) * (bounds[3] - bounds[1]) * 4 })
    },
  }
  const terrainMap = new THREE.DataTexture(new Uint8Array(4), 1, 1)
  terrainMap.addEventListener('dispose', () => { uploadedVersion = undefined; gpu.fill(0) })
  return {
    world, terrainTextures: textures, terrainMap, terrainUpload: new THREE.DataTexture(),
    terrainMapVersion: null, terrainShadows: new Uint8Array(16384), renderer, uploads, gpu,
    render: () => render(terrainMap),
    loseContext() { lost = true; gpu.fill(0) },
    restoreContext() { lost = false; uploadedVersion = undefined },
  }
}

test('scene keeps first full upload and uses one bounded upload for local/dense land and shadow invalidations', async t => {
  const { createWorld } = await loadSceneFixture()
  const { updateTerrainTexture } = await import('../app/scene-terrain-runtime.ts')
  const scene = sceneFixture(createWorld(2)), world = scene.world
  world.footprints = createFootprints()
  updateTerrainTexture(scene)
  assert.equal(scene.terrainMap.version, 1)
  assert.deepEqual(scene.uploads, [])
  scene.render()
  assert.deepEqual(scene.uploads.map(u => u.bytes), [67108864])
  const baselineVersion = scene.terrainMap.version
  for (const [name, mutate] of [
    ['local', () => { world.land.heights[cellAt(20, 30)] += 19; world.landVersion++ }],
    ['repeat', () => { world.land.heights[cellAt(20, 30)] += 11; world.landVersion++ }],
    ['shadow', () => { world.land.shadows[cellAt(50, 70)] ^= 7 }],
    ['dense', () => { for (let i = 0; i < 16384; i++) world.land.heights[i]++; world.landVersion++ }],
  ]) {
    scene.uploads.length = 0
    mutate()
    updateTerrainTexture(scene)
    scene.render()
    assert.equal(scene.terrainMap.version, baselineVersion, `${name}: no deferred full upload`)
    assert.equal(scene.uploads.length, 1, `${name}: one terrain rectangle, including dense edits`)
    assert.equal(scene.uploads[0].kind, 'region')
    t.diagnostic(JSON.stringify({ case: name, uploads: scene.uploads }))
    if (name === 'dense') assert.equal(scene.uploads[0].bytes, 67108864)
    else assert.ok(scene.uploads[0].bytes < 67108864 / 100)
    equalBytes(scene.gpu, terrainAtlas(world.land, textures).pixels, `${name}: uploaded bytes`)
    scene.uploads.length = 0
    updateTerrainTexture(scene)
    scene.render()
    assert.deepEqual(scene.uploads, [], `${name}: stable update makes no transfers`)
  }
  world.landVersion++ // A version advance with no pixel change is still synchronized.
  updateTerrainTexture(scene)
  assert.equal(scene.terrainMapVersion, world.landVersion)
  assert.deepEqual(scene.uploads, [])
})

test('simultaneous footprints inside/outside the terrain rectangle retain all pixels without redundant covered uploads', async () => {
  const { createWorld } = await loadSceneFixture()
  const { updateTerrainTexture } = await import('../app/scene-terrain-runtime.ts')
  const scene = sceneFixture(createWorld(2)), world = scene.world
  world.footprints = createFootprints()
  updateTerrainTexture(scene); scene.render(); scene.uploads.length = 0
  const inside = cellAt(20, 30), outside = cellAt(90, 100)
  world.land.heights[inside] += 29; world.landVersion++
  for (const cell of [inside, outside]) stampFootprints(world.footprints, (cell & 127) * 512 + 64, (cell >> 7) * 512 + 96)
  assert.equal(world.footprints.dirty.size, 2)
  updateTerrainTexture(scene); scene.render()
  assert.equal(scene.uploads.length, 2, 'one uncovered footprint and one terrain rectangle')
  assert.equal(scene.uploads[0].bytes, 4096)
  assert.equal(world.footprints.dirty.size, 0)
  equalBytes(scene.gpu, terrainAtlas(world.land, textures, undefined, 32, world.footprints.pixels).pixels,
    'terrain and footprint edits compose with exact palette/row ordering')
  scene.uploads.length = 0
  stampFootprints(world.footprints, (outside & 127) * 512 + 80, (outside >> 7) * 512 + 112)
  updateTerrainTexture(scene); scene.render()
  assert.deepEqual(scene.uploads.map(u => u.bytes), [4096], 'footprint-only path remains one tile')
  equalBytes(scene.gpu, terrainAtlas(world.land, textures, undefined, 32, world.footprints.pixels).pixels)
})

test('pending initial upload, disposal, and loss/restoration retain a complete CPU image for destination initialization', async () => {
  const { createWorld } = await loadSceneFixture()
  const { updateTerrainTexture } = await import('../app/scene-terrain-runtime.ts')
  const scene = sceneFixture(createWorld(2)), world = scene.world
  world.footprints = createFootprints()
  updateTerrainTexture(scene) // Do not render before the next local edit.
  const edit = () => { world.land.heights[cellAt(20, 30)] += 7; world.landVersion++; updateTerrainTexture(scene) }
  edit(); scene.render()
  assert.deepEqual(scene.uploads.map(u => u.kind), ['full', 'region'])
  equalBytes(scene.gpu, terrainAtlas(world.land, textures).pixels)
  scene.uploads.length = 0; scene.terrainMap.dispose(); edit(); scene.render()
  assert.deepEqual(scene.uploads.map(u => u.kind), ['full', 'region'])
  equalBytes(scene.gpu, terrainAtlas(world.land, textures).pixels)
  scene.uploads.length = 0; scene.loseContext(); edit(); edit()
  assert.deepEqual(scene.uploads, [], 'no transfer while context is lost')
  scene.restoreContext(); scene.render()
  assert.deepEqual(scene.uploads.map(u => u.kind), ['full'])
  equalBytes(scene.gpu, terrainAtlas(world.land, textures).pixels, 'all edits while lost reach restored texture')
  scene.uploads.length = 0; edit(); scene.render()
  assert.deepEqual(scene.uploads.map(u => u.kind), ['region'])
  equalBytes(scene.gpu, terrainAtlas(world.land, textures).pixels)
})
