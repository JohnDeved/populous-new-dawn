// Actual CPU Painter/RenderView and shipped terrain constructors. Existing
// texture-loader hooks and local asset reads supply IO/GPU leaves only.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'
import { visibleTerrainCopies } from '../app/terrain-visibility.ts'
import { loadSceneFixture, makeSceneFixture } from './support/bloodlust-scene.mjs'

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
function frame(view = new RenderView()) {
  const scene = new THREE.Scene(),
    objects = []
  let transparentSort
  const renderer = {
    setTransparentSort: value => {
      transparentSort = value
    },
  }
  view.update(640, 480, { x: 0, z: 0 }, 0, 0, false)
  const add = (object, metadata = {}) => {
    const parent = new THREE.Group()
    parent.userData = { point: { id: objects.length + 1 }, ...metadata }
    parent.add(object)
    scene.add(parent)
    objects.push(object)
    return object
  }
  const update = () => {
    scene.updateMatrixWorld(true)
    view.prepare(scene)
    scene.onBeforeRender(renderer, scene, new THREE.Camera())
  }
  const snapshot = () => ({
    commands: view.painter.commandsBySlot.map(command => (command ? { ...command } : null)),
    depths: Array.from(view.painter.texture.image.data),
    ranges: objects.map(object => view.painter.ranges.get(object)),
    groups: objects.map(object => object.geometry?.groups.map(group => ({ ...group }))),
  })
  const close = () => {
    view.painter.afterRender()
    const geometries = new Set(),
      materials = new Set()
    for (const object of objects) {
      if (object instanceof THREE.Mesh) geometries.add(object.geometry)
      for (const material of Array.isArray(object.material) ? object.material : [object.material])
        materials.add(material)
    }
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(material => material.dispose())
    view.dispose()
  }
  return {
    view,
    scene,
    objects,
    add,
    update,
    snapshot,
    close,
    get transparentSort() {
      return transparentSort
    },
  }
}
function measure(view, call) {
  const original = view.relative,
    records = new Set()
  let calls = 0
  view.relative = function (...args) {
    calls++
    const result = original.apply(this, args)
    assert.ok(!records.has(result), 'maintained relative returns a distinct result record')
    records.add(result)
    return result
  }
  try {
    call()
  } finally {
    view.relative = original
  }
  return { calls, resultRecords: records.size }
}

test('shipped visible terrain retains complete painter output, shared projections, ambience and picking', async () => {
  const api = await loadSceneFixture(),
    world = api.createWorld(1)
  const supplied = await makeSceneFixture(world)
  const { initializeTerrain, rebuildTerrain, landIndex } =
    await import('../app/scene-terrain-runtime.ts')
  const { updateView } = await import('../app/scene-camera-runtime.ts')
  const fixture = frame(),
    owner = supplied.scene,
    originalFetch = globalThis.fetch
  Object.assign(owner, {
    view: fixture.view,
    viewPoint: { x: 0, z: 0 },
    cameraBearing: 0,
    viewZoom: 0,
    overviewActive: false,
    globeMorph: { value: 0 },
    container: { clientWidth: 640, clientHeight: 480 },
    terrainLoad: new AbortController(),
    terrainMap: new THREE.DataTexture(),
    waterMap: new THREE.DataTexture(new Uint8Array(256 * 256 * 4), 256, 256),
    terrainTextures: null,
    decorations: new THREE.Group(),
    updateTerrainTexture: () => {},
    landIndex: (x, z) => landIndex(owner, x, z),
    updateView: () => updateView(owner),
  })
  // The maintained camera owner reads this DOM size; no camera/land owner is disabled.
  globalThis.document.documentElement = { clientWidth: 640 }
  const requests = [],
    rows = []
  globalThis.fetch = async url => {
    requests.push(url)
    const bytes = readFileSync(new URL(`../public${url}`, import.meta.url))
    return {
      ok: true,
      arrayBuffer: async () =>
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    }
  }
  try {
    const initialized = initializeTerrain(owner)
    owner.terrain = fixture.add(initialized.terrain)
    await initialized.ready
    rebuildTerrain(owner)
    const terrain = owner.terrain,
      position = terrain.geometry.getAttribute('position')
    assert.deepEqual(requests, ['/original/landscape.bin', '/original/waves.bin'])
    assert.equal(terrain.instanceMatrix.count, 9, 'actual terrain keeps its nine-copy capacity')
    assert.equal(position.count, 128 * 128 * 6)
    assert.equal(terrain.userData.nativeRelative, true)
    assert.equal(terrain.userData.painterGround, true)
    assert.equal(terrain.userData.terrainGrid, true)
    assert.equal(terrain.userData.nativeScale, undefined)
    fixture.view.painter.land = world.land
    fixture.view.painter.landFlags = world.land.flags
    for (const [point, angle] of [
      [{ x: 0, z: 0 }, 0],
      [{ x: 127, z: 127 }, Math.PI / 2],
    ]) {
      owner.viewPoint = point
      owner.cameraBearing = angle
      owner.updateView()
      const before = structuredClone(world)
      let previous, previousProjections, previousPick
      for (let repeat = 0; repeat < 2; repeat++) {
        const sound = {
          total: 0,
          low: 0,
          water: 0,
          high: 0,
          trees: false,
          overview: false,
          activity: 0,
        }
        fixture.view.painter.pendingSoundEnvironment = sound
        const counts = measure(fixture.view, fixture.update)
        assert.equal(
          terrain.count,
          visibleTerrainCopies(fixture.view.bounds, fixture.view.rawCenter).length
        )
        assert.ok(terrain.count > 0 && terrain.count < 9, 'measure only ordinary visible copies')
        assert.ok(
          terrain.geometry.drawRange.count > 0 && terrain.geometry.drawRange.count < position.count,
          'the real visibility/index owner limits submitted terrain'
        )
        assert.deepEqual(fixture.view.painter.ranges.get(terrain), [0, 128 * 128 * 2])
        assert.ok(fixture.view.painter.commandsBySlot.some(Boolean))
        assert.deepEqual(sound, { ...sound, ...fixture.view.painter.terrainAmbience.result() })
        assert.equal(fixture.view.painter.pendingSoundEnvironment, undefined)
        const vertices = fixture.view.painter.vertices.get(position, true),
          projections = vertices.projected.slice()
        assert.ok(projections.some(Boolean))
        if (previousProjections)
          for (let i = 0; i < projections.length; i++)
            assert.equal(
              projections[i],
              previousProjections[i],
              'maintained ground projection records remain reusable'
            )
        const camera = new THREE.Camera(),
          matrix = new THREE.Matrix4()
        let hit
        for (const command of fixture.view.painter.commandsBySlot) {
          if (!command) continue
          const instance = Math.floor(command.slot / (128 * 128 * 2))
          terrain.getMatrixAt(instance, matrix)
          const points = [0, 1, 2].map(j =>
            fixture.view.screen(
              new THREE.Vector3()
                .fromBufferAttribute(position, command.face * 3 + j)
                .applyMatrix4(matrix),
              camera,
              true
            )
          )
          if (!points.every(p => Math.abs(p.x) < 0.8 && Math.abs(p.y) < 0.8)) continue
          const mouse = new THREE.Vector2(
            points.reduce((n, p) => n + p.x, 0) / 3,
            points.reduce((n, p) => n + p.y, 0) / 3
          )
          hit = fixture.view.pick(mouse, [terrain], camera)
          if (hit) break
        }
        assert.ok(hit, 'actual submitted terrain remains available to maintained picking')
        assert.equal(hit.object, terrain)
        assert.ok(fixture.view.painter.command(terrain, hit.triangle, hit.instance))
        assert.equal(hit.depth, fixture.view.painter.depth(terrain, hit.triangle, hit.instance))
        assert.ok(Number.isFinite(hit.depth))
        const pick = { triangle: hit.triangle, instance: hit.instance, depth: hit.depth }
        const output = { ...fixture.snapshot(), sound: { ...sound }, pick }
        if (previous) {
          assert.deepEqual(output, previous)
          assert.deepEqual(pick, previousPick)
        }
        rows.push({
          point,
          angle,
          repeat,
          visibleInstances: terrain.count,
          submittedIndices: terrain.geometry.drawRange.count,
          ...counts,
          outputSha256: hash(output),
        })
        previous = output
        previousProjections = projections
        previousPick = pick
        fixture.view.painter.afterRender()
        assert.deepEqual(
          world,
          before,
          'Painter preserves full World, land and both RNG owners after camera setup'
        )
      }
    }
    console.log(JSON.stringify({ diagnostic: 'shipped-visible-terrain-relative-results', rows }))
  } finally {
    globalThis.fetch = originalFetch
    owner.terrainLoad.abort()
    owner.terrainMap.dispose()
    owner.waterMap.dispose()
    fixture.close()
    supplied.close()
  }
})

test('authentic scaled model13 and sprites retain origin projection, commands and alpha restoration', async () => {
  const api = await loadSceneFixture(),
    world = api.createWorld(1),
    supplied = await makeSceneFixture(world)
  const { nativeModel } = await import('../app/scene-assets.ts')
  const fixture = frame(),
    before = structuredClone(world)
  try {
    const model = fixture.add(nativeModel(13, 2, 4, false, supplied.scene.environment), {
      point: { id: 1, model: 3 },
    })
    const sprite = fixture.add(new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true })))
    assert.equal(model.userData.nativeResource.id, 13)
    assert.ok(model.userData.nativeScale)
    model.material.transparent = true
    const material = model.material,
      groups = model.geometry.groups,
      rows = []
    let previous
    for (let repeat = 0; repeat < 2; repeat++) {
      const counts = measure(fixture.view, fixture.update),
        output = fixture.snapshot()
      assert.deepEqual(
        counts,
        { calls: 2, resultRecords: 2 },
        'both truthy model and sprite still need their origin'
      )
      assert.ok(fixture.view.painter.source(model))
      assert.ok(fixture.view.painter.source(sprite))
      assert.ok(output.commands.filter(Boolean).every(c => c.alpha))
      const item = (object, id) => ({
        object,
        group: { start: 0 },
        groupOrder: 0,
        renderOrder: 0,
        z: 0,
        id,
      })
      const expected =
        fixture.view.painter.depth(sprite, 0, 0) - fixture.view.painter.depth(model, 0, 0)
      assert.equal(
        Math.sign(fixture.transparentSort(item(model, 1), item(sprite, 2))),
        Math.sign(expected || -1)
      )
      if (previous) assert.deepEqual(output, previous)
      previous = output
      rows.push({ repeat, ...counts, outputSha256: hash(output) })
      fixture.view.painter.afterRender()
      assert.equal(model.material, material)
      assert.equal(model.geometry.groups, groups)
      assert.deepEqual(world, before)
    }
    console.log(JSON.stringify({ diagnostic: 'scaled-model-sprite-origin-controls', rows }))
  } finally {
    fixture.close()
    supplied.close()
  }
})

test('supplied unscaled unique, shared and instanced faces avoid only their unused origin records', async () => {
  const api = await loadSceneFixture(),
    world = api.createWorld(1),
    before = structuredClone(world),
    rows = []
  for (const kind of ['unique', 'shared', 'instanced'])
    for (const population of [64, 256, 1024]) {
      const fixture = frame()
      try {
        const values = []
        for (let i = 0; i < (kind === 'instanced' ? 1 : population); i++) {
          const d = kind === 'unique' ? i / (population * 20) : 0
          values.push(-1 + d, d, 0, 1 + d, d, 0, d, 1 + d, 0)
        }
        const geometry = new THREE.BufferGeometry().setAttribute(
          'position',
          new THREE.Float32BufferAttribute(values, 3)
        )
        const object =
          kind === 'instanced'
            ? new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial(), population)
            : new THREE.Mesh(geometry, new THREE.MeshBasicMaterial())
        if (kind === 'instanced')
          for (let i = 0; i < population; i++) object.setMatrixAt(i, new THREE.Matrix4())
        fixture.add(object)
        assert.equal(
          object.userData.nativeScale,
          undefined,
          'supplied generic geometry has no authentic native model metadata'
        )
        fixture.update()
        fixture.view.painter.afterRender()
        const counts = measure(fixture.view, fixture.update)
        assert.equal(fixture.view.painter.commandsBySlot.filter(Boolean).length, population)
        assert.equal(fixture.view.painter.commandsBySlot.length, population)
        assert.equal(
          fixture.view.painter.vertices.get(geometry.getAttribute('position')).seen.filter(Boolean)
            .length,
          kind === 'unique' ? population * 3 : 3
        )
        rows.push({ kind, population, ...counts, outputSha256: hash(fixture.snapshot()) })
        assert.deepEqual(world, before)
      } finally {
        fixture.close()
      }
    }
  console.log(JSON.stringify({ diagnostic: 'supplied-unscaled-origin-relative-results', rows }))
  for (const row of rows) {
    const expected = row.kind === 'shared' ? 3 : row.population * 3
    assert.equal(
      row.calls,
      expected,
      `${row.kind}/${row.population}: only accepted unique vertex projections remain`
    )
    assert.equal(row.resultRecords, expected)
  }
})
