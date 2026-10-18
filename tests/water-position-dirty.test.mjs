import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

await loadSceneFixture()
const { updateWater } = await import('../app/scene-terrain-runtime.ts')
function fixture(category = 0) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3))
  for (const name of ['light', 'highlight'])
    geometry.setAttribute(name, new THREE.Float32BufferAttribute(6, 3))
  geometry.setAttribute('surface', new THREE.Float32BufferAttribute([0, 0], 1))
  return {
    terrain: { geometry },
    waves: new Uint8Array(65536),
    landIndex: x => x,
    world: {
      turn: 0,
      landVersion: 0,
      lightRevision: 0,
      land: {
        heights: [128, 256],
        categories: [category, category],
        flags: [0, 0],
        buildingIds: [0, 0],
      },
    },
  }
}
const attr = (s, name = 'position') => s.terrain.geometry.getAttribute(name)
const bits = s => Uint32Array.from(new Uint32Array(attr(s).array.buffer))

test('changed dry turns and light-only updates avoid only byte-identical position dirty marks', () => {
  const s = fixture()
  updateWater(s)
  assert.equal(attr(s).version, 1)
  const original = bits(s),
    light = attr(s, 'light').version,
    highlight = attr(s, 'highlight').version
  let avoided = 0
  for (let turn = 1; turn <= 10; turn++) {
    s.world.turn = turn
    updateWater(s)
    assert.deepEqual(bits(s), original)
    assert.equal(attr(s).version, 1)
    avoided++
  }
  s.world.land.buildingIds[0] = 8 << 10
  s.world.lightRevision++
  const previousHighlight = Float32Array.from(attr(s, 'highlight').array)
  updateWater(s)
  assert.equal(attr(s).version, 1)
  assert.notDeepEqual(attr(s, 'highlight').array, previousHighlight)
  assert.equal(attr(s, 'light').version, light + 11)
  assert.equal(attr(s, 'highlight').version, highlight + 11)
  assert.equal(avoided, 10, 'ten controlled dry turns avoid ten formerly unconditional marks')
  const versions = ['position', 'light', 'highlight'].map(n => attr(s, n).version)
  updateWater(s)
  assert.deepEqual(
    ['position', 'light', 'highlight'].map(n => attr(s, n).version),
    versions,
    'existing same-key early return'
  )
  s.terrain.geometry.dispose()
})

test('actual wave changes dirty position and repeated wave bytes do not', () => {
  const s = fixture(1)
  updateWater(s)
  assert.equal(attr(s).version, 0)
  s.waves.fill(32)
  s.world.turn = 23
  updateWater(s)
  assert.equal(attr(s).getY(0), 8 / 128)
  assert.equal(attr(s).version, 1)
  s.world.turn++
  updateWater(s)
  assert.equal(attr(s).version, 1)
  s.waves.fill(64)
  s.world.turn++
  updateWater(s)
  assert.equal(attr(s).version, 2)
  s.terrain.geometry.dispose()
})

test('land changes, new geometry and waterState reset preserve observable deformation', () => {
  const s = fixture()
  updateWater(s)
  s.world.land.heights[1]++
  s.world.landVersion++
  updateWater(s)
  assert.equal(attr(s).version, 2)
  assert.equal(attr(s).getY(1), 257 / 128)
  const previous = s.terrain.geometry
  s.terrain.geometry = previous.clone()
  assert.notEqual(s.terrain.geometry.id, previous.id)
  attr(s).setY(0, -1)
  const version = attr(s).version
  updateWater(s)
  assert.equal(attr(s).getY(0), 1)
  assert.equal(attr(s).version, version + 1)
  const replacement = attr(s).clone()
  replacement.setY(0, -2)
  s.terrain.geometry.setAttribute('position', replacement)
  s.waterState = undefined // Existing caller reset, not a new invalidation key.
  updateWater(s)
  assert.equal(replacement.getY(0), 1)
  assert.equal(replacement.version, 1)
  previous.dispose()
  s.terrain.geometry.dispose()
})

test('stored Float32 bits handle rounding, signed zero and NaN payload changes', () => {
  const s = fixture()
  s.world.land.heights = [0.1, 0]
  updateWater(s)
  const version = attr(s).version
  s.world.turn++
  updateWater(s)
  assert.equal(attr(s).version, version, 'compare rounded stored float, not JS input')
  attr(s).setY(1, -0)
  s.world.turn++
  updateWater(s)
  assert.equal(Object.is(attr(s).getY(1), 0), true)
  assert.equal(attr(s).version, version + 1, 'signed zero is a changed byte pattern')
  const raw = new Uint32Array(attr(s).array.buffer)
  raw[1] = 0x7fc00001
  s.world.land.heights[0] = NaN
  const before = raw[1],
    prior = attr(s).version
  s.world.turn++
  updateWater(s)
  assert.equal(attr(s).version, prior + Number(raw[1] !== before))
  s.terrain.geometry.dispose()
})

test('unsupported/custom position writers retain unconditional dirty marks; missing waves still returns', () => {
  const s = fixture()
  const position = attr(s),
    original = position.setY
  position.setY = function (...args) {
    return original.apply(this, args)
  }
  updateWater(s)
  const version = position.version
  s.world.turn++
  updateWater(s)
  assert.equal(position.version, version + 1)
  s.waves = undefined
  s.world.turn++
  updateWater(s)
  assert.equal(position.version, version + 1)
  s.terrain.geometry.dispose()
})

test('authored M1/M2 light-only updates retain native cache but actual water deformation rebuilds it', async t => {
  const { readFileSync } = await import('node:fs')
  const { RenderView } = await import('../app/render-view.ts')
  const { rebuildTerrain, landIndex } = await import('../app/scene-terrain-runtime.ts')
  const api = await loadSceneFixture()
  for (const level of [1, 2])
    await t.test(`M${level}`, () => {
      const view = new RenderView(),
        world = api.createWorld(level)
      const terrain = new THREE.InstancedMesh(
        new THREE.BufferGeometry(),
        new THREE.MeshBasicMaterial(),
        9
      )
      Object.assign(terrain.userData, {
        painterGround: true,
        terrainGrid: true,
        nativeRelative: true,
      })
      const s = {
        world,
        terrain,
        view,
        decorations: new THREE.Group(),
        updateView() {},
        waves: new Uint8Array(
          readFileSync(new URL('../public/original/waves.bin', import.meta.url))
        ),
      }
      s.landIndex = (x, z) => landIndex(s, x, z)
      try {
        rebuildTerrain(s)
        view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
        updateWater(s)
        view.updateTerrainVisibility(terrain)
        const mouse = new THREE.Vector2(0.1, 0.1),
          camera = new THREE.Camera()
        const pick = () => view.pickCandidates(mouse, [terrain], camera, true)
        const originalHits = pick(),
          originalCache = view.groundPickCache.get(terrain).get(0)
        assert.ok(originalHits.length > 0)
        const oldBits = bits(s),
          version = attr(s).version
        world.lightRevision++
        updateWater(s)
        assert.deepEqual(bits(s), oldBits)
        assert.equal(attr(s).version, version, 'one genuinely redundant light-only mark avoided')
        assert.deepEqual(pick(), originalHits)
        assert.equal(view.groundPickCache.get(terrain).get(0), originalCache)
        world.turn = 23
        updateWater(s)
        assert.notDeepEqual(bits(s), oldBits)
        assert.equal(attr(s).version, version + 1, 'actual authored waves remain dirty')
        pick()
        assert.notEqual(view.groundPickCache.get(terrain).get(0), originalCache)
      } finally {
        view.dispose()
        terrain.geometry.dispose()
        terrain.material.dispose()
      }
    })
})

test('normalized and interleaved attributes keep their existing version invalidation', () => {
  for (const kind of ['normalized', 'interleaved']) {
    const s = fixture()
    if (kind === 'normalized') attr(s).normalized = true
    else
      s.terrain.geometry.setAttribute(
        'position',
        new THREE.InterleavedBufferAttribute(
          new THREE.InterleavedBuffer(new Float32Array([0, 0, 0, 7, 1, 0, 0, 7]), 4),
          3,
          0
        )
      )
    const version = () =>
      attr(s).isInterleavedBufferAttribute ? attr(s).data.version : attr(s).version
    updateWater(s)
    const before = version()
    s.world.turn++
    updateWater(s)
    assert.equal(version(), before + 1, kind)
    s.terrain.geometry.dispose()
  }
})

test('custom coordinate readers and shared position backing conservatively remain dirty', () => {
  for (const kind of ['getX', 'getZ', 'shared', 'subclass', 'malformed', 'alias']) {
    const s = fixture()
    updateWater(s)
    let position = attr(s)
    if (kind === 'malformed') {
      position = new THREE.Float32BufferAttribute([0, 1, 0, 0], 3)
      s.terrain.geometry.setAttribute('position', position)
    } else if (kind === 'alias') {
      s.terrain.geometry.setAttribute('light', new THREE.BufferAttribute(position.array, 3))
    } else if (kind === 'shared') {
      const shared = new Float32Array(new SharedArrayBuffer(position.array.byteLength))
      shared.set(position.array)
      position.array = shared
    } else if (kind === 'subclass') {
      class CustomAttribute extends THREE.Float32BufferAttribute {}
      position = new CustomAttribute(position.array, 3)
      s.terrain.geometry.setAttribute('position', position)
    } else {
      const original = position[kind]
      position[kind] = function (i) {
        this.array[i * 3 + 2] += 1
        return original.call(this, i)
      }
    }
    const version = position.version
    s.world.turn++
    updateWater(s)
    assert.equal(position.version, version + 1, kind)
    s.terrain.geometry.dispose()
  }
})

test('offset Float32 views preserve untouched bytes, pending dirtiness and update ranges', () => {
  const s = fixture()
  const backing = new Float32Array(10)
  backing.fill(99)
  const position = attr(s)
  backing.set(position.array, 2)
  position.array = backing.subarray(2, 8)
  updateWater(s)
  position.addUpdateRange(0, 3)
  position.needsUpdate = true
  const pendingVersion = position.version,
    ranges = structuredClone(position.updateRanges)
  s.world.lightRevision++
  updateWater(s)
  assert.equal(position.version, pendingVersion, 'do not clear previous pending dirty version')
  assert.deepEqual(position.updateRanges, ranges)
  assert.deepEqual([...backing.slice(0, 2), ...backing.slice(8)], [99, 99, 99, 99])
  s.world.land.heights[1]++
  s.world.landVersion++
  updateWater(s)
  assert.equal(position.version, pendingVersion + 1)
  assert.deepEqual(position.updateRanges, ranges, 'existing range semantics unchanged')
  s.terrain.geometry.dispose()
})

for (const method of ['getX', 'getZ', 'setY']) {
  test(`accessor-backed ${method} returning canonical method remains dirty without extra getter calls`, () => {
    const s = fixture()
    updateWater(s)
    const position = attr(s),
      canonical = THREE.BufferAttribute.prototype[method]
    let reads = 0
    Object.defineProperty(position, method, {
      configurable: true,
      get() {
        reads++
        position.array[2] += 1
        return canonical
      },
    })
    const version = position.version,
      beforeZ = position.array[2]
    s.world.turn++
    updateWater(s)
    assert.equal(position.version, version + 1, 'custom accessor must preserve dirty fallback')
    assert.equal(reads, position.count, 'eligibility must not invoke accessor')
    assert.equal(position.array[2], beforeZ + position.count)
    s.terrain.geometry.dispose()
  })
}

test('prototype setY replacement that changes Z remains dirty', () => {
  const s = fixture()
  updateWater(s)
  const position = attr(s),
    descriptor = Object.getOwnPropertyDescriptor(THREE.BufferAttribute.prototype, 'setY')
  const version = position.version,
    beforeZ = position.array[2]
  let calls = 0
  THREE.BufferAttribute.prototype.setY = function (index, value) {
    calls++
    this.array[index * 3 + 2] += 1
    return descriptor.value.call(this, index, value)
  }
  try {
    s.world.turn++
    updateWater(s)
    assert.equal(position.version, version + 1)
    assert.equal(calls, position.count)
    assert.equal(position.array[2], beforeZ + 1)
  } finally {
    Object.defineProperty(THREE.BufferAttribute.prototype, 'setY', descriptor)
    s.terrain.geometry.dispose()
  }
})

// Exact current-main a2cdba7f updateWater, independent of the eligibility repair.
const parentUpdateWaterSource =
  "function updateWater(scene: GameScene) {\n  if (!scene.waves) return\n  const w = scene.world,\n    key = `${w.turn}:${w.landVersion}:${w.lightRevision}:${scene.terrain.geometry.id}`\n  if (key === scene.waterState) return\n  scene.waterState = key\n  // Shared wet points animate height/light; the acquired texture stays spatial.\n  const pos = scene.terrain.geometry.getAttribute('position'),\n    surface = scene.terrain.geometry.getAttribute('surface'),\n    light = scene.terrain.geometry.getAttribute('light'),\n    highlight = scene.terrain.geometry.getAttribute('highlight')\n  for (let j = 0; j < pos.count; j++) {\n    const i = scene.landIndex(pos.getX(j), pos.getZ(j)),\n      p = waterPoint(w.land, i, w.turn, scene.waves)\n    // 0x4673b0 uses the same diffuse conversion on coast and land; only\n    // open-water triangles suppress the additive warm light channel.\n    const colors = vertexLighting(p.color, surface.getX(j) ? 0 : 0xfdb935)\n    pos.setY(j, p.height / 128)\n    light.setXYZ(\n      j,\n      ((colors.diffuse >>> 16) & 255) / 255,\n      ((colors.diffuse >>> 8) & 255) / 255,\n      (colors.diffuse & 255) / 255\n    )\n    highlight.setXYZ(\n      j,\n      ((colors.specular >>> 16) & 255) / 255,\n      ((colors.specular >>> 8) & 255) / 255,\n      (colors.specular & 255) / 255\n    )\n  }\n  highlight.needsUpdate = true\n  light.needsUpdate = true\n  pos.needsUpdate = true\n}\n"

test('custom accessors and prototype writers match exact current-parent bytes, versions and callback order', async () => {
  const { stripTypeScriptTypes } = await import('node:module')
  const { waterPoint } = await import('../app/water.ts')
  const { vertexLighting } = await import('../app/projection.ts')
  const parentUpdateWater = new Function(
    'waterPoint',
    'vertexLighting',
    'return ' + stripTypeScriptTypes(parentUpdateWaterSource)
  )(waterPoint, vertexLighting)
  for (const kind of ['getX', 'getZ', 'setY', 'prototype-writer', 'prototype-accessor']) {
    function run(update) {
      const s = fixture()
      update(s)
      const position = attr(s),
        proto = THREE.BufferAttribute.prototype
      const saved = Object.getOwnPropertyDescriptor(proto, 'setY'),
        trace = []
      const name = kind.startsWith('prototype') ? 'setY' : kind,
        canonical = proto[name]
      const owner = kind.startsWith('prototype') ? proto : position
      if (kind === 'prototype-writer')
        Object.defineProperty(owner, name, {
          ...saved,
          value: function (index, value) {
            trace.push(index)
            this.array[index * 3 + 2]++
            return canonical.call(this, index, value)
          },
        })
      else
        Object.defineProperty(owner, name, {
          configurable: true,
          get() {
            trace.push(name)
            position.array[2]++
            return canonical
          },
        })
      try {
        s.world.turn++
        update(s)
        return {
          position: [...bits(s)],
          light: [...attr(s, 'light').array],
          highlight: [...attr(s, 'highlight').array],
          version: position.version,
          trace,
        }
      } finally {
        if (kind.startsWith('prototype')) Object.defineProperty(proto, 'setY', saved)
        s.terrain.geometry.dispose()
      }
    }
    assert.deepEqual(run(updateWater), run(parentUpdateWater), kind)
  }
})

test('interposed attribute prototype cannot bypass custom-writer fallback', () => {
  const s = fixture()
  updateWater(s)
  const position = attr(s),
    prototype = THREE.Float32BufferAttribute.prototype
  const parent = Object.getPrototypeOf(prototype),
    original = parent.setY
  const custom = Object.create(parent)
  custom.setY = function (index, value) {
    this.array[index * 3 + 2]++
    return original.call(this, index, value)
  }
  const version = position.version
  Object.setPrototypeOf(prototype, custom)
  try {
    s.world.turn++
    updateWater(s)
    assert.equal(position.version, version + 1)
  } finally {
    Object.setPrototypeOf(prototype, parent)
    s.terrain.geometry.dispose()
  }
})

test('metadata accessors preserve exact parent bytes, reads and dirty versions', async () => {
  const { stripTypeScriptTypes } = await import('node:module')
  const { waterPoint } = await import('../app/water.ts')
  const { vertexLighting } = await import('../app/projection.ts')
  const parent = new Function(
    'waterPoint',
    'vertexLighting',
    'return ' + stripTypeScriptTypes(parentUpdateWaterSource)
  )(waterPoint, vertexLighting)
  for (const key of [
    'count',
    'array',
    'itemSize',
    'normalized',
    'light.array',
    'highlight.array',
  ]) {
    function run(update) {
      const s = fixture()
      update(s)
      const position = attr(s),
        owner = key.includes('.') ? attr(s, key.split('.')[0]) : position,
        field = key.includes('.') ? 'array' : key,
        value = owner[field],
        array = position.array
      let reads = 0
      Object.defineProperty(owner, field, {
        configurable: true,
        get() {
          reads++
          array[2]++
          return value
        },
      })
      try {
        s.world.turn++
        update(s)
        return { reads, version: position.version, bits: [...new Uint32Array(array.buffer)] }
      } finally {
        s.terrain.geometry.dispose()
      }
    }
    assert.deepEqual(run(updateWater), run(parent), key)
  }
})

test('typed-array buffer metadata hooks are not invoked by eligibility', () => {
  for (const key of ['buffer', 'byteOffset', 'length']) {
    const s = fixture()
    updateWater(s)
    const position = attr(s),
      array = position.array,
      value = array[key]
    let reads = 0
    Object.defineProperty(array, key, {
      configurable: true,
      get() {
        reads++
        array[2]++
        return value
      },
    })
    try {
      s.world.turn++
      updateWater(s)
      assert.equal(reads, 0, `parent never reads typed-array ${key}`)
    } finally {
      s.terrain.geometry.dispose()
    }
  }
})
