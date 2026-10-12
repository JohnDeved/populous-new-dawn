// Actual CPU Painter and RenderView projection/visibility/picking methods.
// Controlled Three objects and a transparent-sort callback replace GPU submission;
// these checks do not establish ordinary browser pixels or hardware performance.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

function frameFixture(world, point = { x: 0, z: 0 }) {
  const view = new RenderView(),
    scene = new THREE.Scene(),
    objects = []
  view.update(800, 600, point, 0, 0, false)
  scene.userData.world = world
  let transparentSort
  const renderer = {
    setTransparentSort: sort => {
      transparentSort = sort
    },
  }
  const register = (label, object, position, metadata = {}) => {
    const group = new THREE.Group()
    group.userData = { unit: objects.length + 1, ...metadata }
    object.name = label
    object.position.set(position.x, position.y ?? 0, position.z)
    group.add(object)
    scene.add(group)
    view.materials.set(object.material, {})
    objects.push(object)
    return object
  }
  const sprite = (label, position, metadata = {}) =>
    register(
      label,
      new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true })),
      position,
      metadata
    )
  const mesh = (label, position, values, options = {}) => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(values, 3))
    const object = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ transparent: !!options.alpha })
    )
    Object.assign(object.userData, options.userData)
    return register(label, object, position, options.metadata)
  }
  const update = () => {
    scene.updateMatrixWorld(true)
    view.painter.update(scene, renderer)
  }
  const output = () =>
    objects.flatMap(object => {
      const range = view.painter.ranges.get(object)
      if (!range) return []
      return Array.from({ length: range[1] }, (_, triangle) => {
        const command = view.painter.command(object, triangle)
        if (!command) return null
        const { slot, ...fields } = command
        assert.equal(view.painter.commandsBySlot[slot], command)
        const depth = view.painter.depth(object, triangle, 0)
        assert.ok(Number.isFinite(depth), 'observed painter depth must be a real submitted slot')
        return { label: object.name, triangle, ...fields, depth }
      }).filter(Boolean)
    })
  const close = () => {
    view.painter.afterRender()
    const geometries = new Set()
    for (const object of objects) {
      if (object instanceof THREE.Mesh) geometries.add(object.geometry)
      object.material.dispose()
    }
    geometries.forEach(geometry => geometry.dispose())
    view.dispose()
  }
  return {
    view,
    scene,
    objects,
    sprite,
    mesh,
    register,
    update,
    output,
    close,
    get transparentSort() {
      return transparentSort
    },
  }
}

const oppositeFaces = [-1, 0, 0, 1, 0, 0, 0, 1, 0, -1, 0, 0, 0, 1, 0, 1, 0, 0]

function countRelative(view, call) {
  const original = view.relative,
    records = new Set()
  let calls = 0
  view.relative = function (...args) {
    calls++
    const result = original.apply(this, args)
    assert.equal(
      records.has(result),
      false,
      'the maintained relative method returns a fresh record'
    )
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

test('painter keeps accepted commands, depths, ranges and alpha restoration when anchors are rejected', async () => {
  const api = await loadSceneFixture(),
    world = api.createWorld(1),
    before = structuredClone(world)
  const mixed = frameFixture(world),
    accepted = frameFixture(world)
  try {
    const build = fixture => {
      const a = fixture.sprite('visible-sprite', { x: 0, z: 0 })
      const hiddenSprite = fixture.sprite('rejected-sprite', { x: 100, z: 0 })
      const model = fixture.mesh('visible-model', { x: 1, z: 0 }, oppositeFaces, {
        alpha: true,
        userData: { nativeScale: 1, nativeSize: 256, stage: 4 },
      })
      const hiddenModel = fixture.mesh('rejected-model', { x: -100, z: 0 }, oppositeFaces, {
        userData: { nativeScale: 1, nativeSize: 256, stage: 4 },
      })
      assert.equal(fixture.view.visible(a.position), true)
      assert.equal(fixture.view.visible(model.position), true)
      assert.equal(fixture.view.visible(hiddenSprite.position), false)
      assert.equal(fixture.view.visible(hiddenModel.position), false)
      return { model, hiddenSprite, hiddenModel }
    }
    const a = build(mixed),
      b = build(accepted)
    b.hiddenSprite.visible = b.hiddenModel.visible = false
    const material = a.model.material,
      groups = a.model.geometry.groups
    for (let frame = 0; frame < 3; frame++) {
      mixed.update()
      accepted.update()
      assert.deepEqual(mixed.output(), accepted.output())
      assert.ok(mixed.output().some(command => command.label === 'visible-model'))
      assert.equal(mixed.view.painter.source(a.hiddenSprite), undefined)
      assert.equal(mixed.view.painter.source(a.hiddenModel), undefined)
      assert.deepEqual(mixed.view.painter.ranges.get(a.hiddenSprite), [1, 1])
      assert.deepEqual(mixed.view.painter.ranges.get(a.model), [2, 2])
      assert.deepEqual(mixed.view.painter.ranges.get(a.hiddenModel), [4, 2])
      assert.equal(mixed.view.painter.commandsBySlot.length, 6)
      for (const slot of [1, 4, 5]) assert.equal(mixed.view.painter.texture.image.data[slot], 2)
      const item = (object, id) => ({
        object,
        group: { start: 0 },
        groupOrder: 0,
        renderOrder: 0,
        z: 0,
        id,
      })
      assert.equal(
        Math.sign(mixed.transparentSort(item(a.model, 1), item(mixed.objects[0], 2))),
        Math.sign(accepted.transparentSort(item(b.model, 1), item(accepted.objects[0], 2)))
      )
      mixed.view.painter.afterRender()
      accepted.view.painter.afterRender()
      assert.equal(a.model.material, material)
      assert.equal(a.model.geometry.groups, groups)
      assert.deepEqual(world, before, 'Painter does not advance World, terrain or either RNG owner')
    }
  } finally {
    mixed.close()
    accepted.close()
  }
})

test('painter retains wrapped anchors, unwrapped rejection and metadata cell visibility independently of origin', async () => {
  const api = await loadSceneFixture(),
    world = api.createWorld(1),
    before = structuredClone(world)
  const fixture = frameFixture(world, { x: 127, z: 0 })
  try {
    const wrapped = fixture.sprite('wrapped', { x: -129, y: 2, z: 0 })
    const unwrapped = fixture.sprite('unwrapped', { x: -129, y: 2, z: 0 })
    unwrapped.userData.nativeRelative = true
    const forcedVisible = fixture.mesh('metadata-visible', { x: 27, y: 3, z: 0 }, oppositeFaces, {
      userData: { nativeScale: 1, nativeSize: 256, stage: 0 },
      metadata: { cellPosition: { x: 127, z: 0 } },
    })
    const forcedRejected = fixture.sprite(
      'metadata-rejected',
      { x: 127, z: 0 },
      {
        cellPosition: { x: 27, z: 0 },
      }
    )
    assert.equal(fixture.view.visible(wrapped.position), true)
    assert.equal(fixture.view.visible(unwrapped.position, true), false)
    assert.equal(fixture.view.visible(forcedVisible.position), false)
    const samples = [],
      original = fixture.view.relative
    fixture.view.relative = function (point, height, nativeRelative) {
      const result = original.call(this, point, height, nativeRelative)
      samples.push({ point: point.toArray(), height, nativeRelative, result })
      return result
    }
    try {
      fixture.update()
    } finally {
      fixture.view.relative = original
    }
    assert.ok(fixture.view.painter.source(wrapped))
    assert.ok(fixture.view.painter.source(forcedVisible))
    assert.equal(fixture.view.painter.source(unwrapped), undefined)
    assert.equal(fixture.view.painter.source(forcedRejected), undefined)
    const sample = samples.find(entry => entry.point[0] === forcedVisible.position.x)
    assert.deepEqual(
      sample.result,
      original.call(
        fixture.view,
        forcedVisible.position,
        (forcedVisible.position.y * 128) / 45,
        false
      )
    )
    assert.equal(sample.height, (forcedVisible.position.y * 128) / 45)
    assert.deepEqual(world, before)
  } finally {
    fixture.close()
  }
})

test('unscaled per-face projection and current picking survive an invisible object origin', async () => {
  const api = await loadSceneFixture(),
    world = api.createWorld(1),
    before = structuredClone(world)
  const fixture = frameFixture(world)
  try {
    const object = fixture.mesh(
      'per-face-fallback',
      { x: 100, z: 0 },
      [-100, 0, 0, -99, 0, 0, -100, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      { userData: { nativeScale: 0 } }
    )
    assert.equal(fixture.view.visible(object.position), false)
    const measure = countRelative(fixture.view, fixture.update)
    assert.deepEqual(
      measure,
      { calls: 4, resultRecords: 4 },
      'unscaled origin and three accepted vertices retain their projection path'
    )
    assert.ok(fixture.view.painter.command(object, 0))
    assert.equal(fixture.view.painter.command(object, 1), undefined)
    const camera = new THREE.Camera(),
      points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
      ].map(point => fixture.view.screen(point, camera))
    const mouse = new THREE.Vector2(
      points.reduce((sum, point) => sum + point.x, 0) / 3,
      points.reduce((sum, point) => sum + point.y, 0) / 3
    )
    const hit = fixture.view.pick(mouse, [object], camera)
    assert.ok(hit, 'maintained projected picking resolves the submitted fallback face')
    assert.equal(hit.object, object)
    assert.equal(hit.triangle, 0)
    assert.equal(hit.instance, 0)
    assert.equal(hit.depth, fixture.view.painter.depth(object, 0, 0))
    const ground = fixture.mesh(
      'ground-projection-fallback',
      { x: 100, z: 0 },
      [-100, 0, 0, -99, 0, 0, -100, 1, 0, -100, 0, 0, -100, 1, 0, -99, 0, 0],
      { userData: { painterGround: true, terrainGrid: true } }
    )
    const groundMeasure = countRelative(fixture.view, fixture.update)
    assert.deepEqual(
      groundMeasure,
      { calls: 8, resultRecords: 8 },
      'both unscaled origins and their accepted shared vertices retain projection'
    )
    assert.equal(fixture.output().filter(command => command.label === ground.name).length, 1)
    const vertices = fixture.view.painter.vertices.get(
      ground.geometry.getAttribute('position'),
      true
    )
    const projections = vertices.projected.slice()
    fixture.update()
    assert.ok(projections.some(Boolean), 'ground clipping uses the maintained projected vertices')
    for (let i = 0; i < projections.length; i++)
      assert.equal(
        vertices.projected[i],
        projections[i],
        'existing projected records remain reusable'
      )
    assert.deepEqual(world, before)
  } finally {
    fixture.close()
  }
})

test('rejected sprite and native-model instances avoid unused relative calls and result records', async () => {
  const api = await loadSceneFixture(),
    world = api.createWorld(1),
    before = structuredClone(world),
    rows = []
  for (const kind of ['sprite', 'native-model'])
    for (const population of [64, 256, 1024]) {
      const fixture = frameFixture(world)
      try {
        const visible = fixture.sprite('accepted-sentinel', { x: 0, z: 0 })
        if (kind === 'sprite') {
          for (let i = 0; i < population; i++) fixture.sprite(`rejected-${i}`, { x: 100, z: 0 })
        } else {
          const geometry = new THREE.BufferGeometry()
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(oppositeFaces, 3))
          const object = new THREE.InstancedMesh(
            geometry,
            new THREE.MeshBasicMaterial(),
            population
          )
          Object.assign(object.userData, { nativeScale: 1, nativeSize: 256, stage: 0 })
          const matrix = new THREE.Matrix4().makeTranslation(100, 0, 0)
          for (let i = 0; i < population; i++) object.setMatrixAt(i, matrix)
          fixture.register('rejected-instances', object, { x: 0, z: 0 })
        }
        fixture.update()
        fixture.view.painter.afterRender()
        const measure = countRelative(fixture.view, fixture.update)
        rows.push({ kind, population, ...measure })
        assert.ok(fixture.view.painter.source(visible))
        assert.equal(fixture.view.painter.commandsBySlot.filter(Boolean).length, 1)
        assert.equal(
          fixture.view.painter.commandsBySlot.length,
          1 + population * (kind === 'sprite' ? 1 : 2)
        )
        assert.deepEqual(world, before)
      } finally {
        fixture.close()
      }
    }
  console.log(JSON.stringify({ diagnostic: 'existing-anchor-rejection-relative-results', rows }))
  for (const row of rows) {
    assert.equal(
      row.calls,
      1,
      `${row.kind}/${row.population}: only the accepted sentinel is projected`
    )
    assert.equal(row.resultRecords, 1)
  }
})
