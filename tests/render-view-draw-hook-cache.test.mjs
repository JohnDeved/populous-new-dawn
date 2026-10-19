// Actual RenderView preparation and draw hooks. Controlled Three resources and
// existing texture/motion fixture leaves replace browser/GPU work; no pixel or
// hardware claim. Callback identities observe only the native object hook.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'
import { modelMatrix } from '../app/projection.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeSelectionScene } from './support/selection-scene.mjs'

const triangle = () =>
  new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3)
  )
const firstMaterial = object =>
  Array.isArray(object.material) ? object.material[0] : object.material
function setup() {
  const view = new RenderView(),
    scene = new THREE.Scene(),
    objects = [],
    materials = new Set()
  view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  const add = (kind = 'mesh', material, geometry = triangle()) => {
    material ??=
      kind === 'sprite'
        ? new THREE.SpriteMaterial()
        : kind === 'line'
          ? new THREE.LineBasicMaterial()
          : new THREE.MeshBasicMaterial()
    const object =
      kind === 'sprite'
        ? new THREE.Sprite(material)
        : kind === 'line'
          ? new THREE.Line(geometry, material)
          : new THREE.Mesh(geometry, material)
    if (kind === 'sprite') geometry.dispose()
    const group = new THREE.Group()
    group.add(object)
    scene.add(group)
    objects.push(object)
    materials.add(material)
    return object
  }
  const close = () => {
    const geometries = new Set()
    scene.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line)
        geometries.add(object.geometry)
      if (object.material)
        for (const material of Array.isArray(object.material) ? object.material : [object.material])
          materials.add(material)
    })
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(material => material.dispose())
    view.dispose()
  }
  return { view, scene, objects, materials, add, close }
}
function draw(object, scene, material = firstMaterial(object), callback = object.onBeforeRender) {
  callback(null, scene, new THREE.Camera(), object.geometry, material, null)
  return material.userData.nativeUniforms
}
function sample(local) {
  return {
    range: Array.from(local.nativePainterRange.value),
    sprite: local.nativePainterSprite.value,
    scale: local.nativeModelScale.value,
    size: local.nativeObjectScale.value,
    relative: local.nativeRelative.value,
    cell: local.nativeCellAnchor.value.toArray(),
    basis: Array.from(local.nativeObjectBasis.value),
    atlas: local.nativeAtlasTransform.value.toArray(),
  }
}
function shader(material, kind = 'basic') {
  const source = THREE.ShaderLib[kind]
  const result = {
    uniforms: {},
    vertexShader: source.vertexShader,
    fragmentShader: source.fragmentShader,
  }
  material.onBeforeCompile(result, null)
  return result
}

test('native draw hooks read current metadata, ranges and draw-time material uniforms', () => {
  const fixture = setup()
  try {
    for (const kind of ['mesh', 'sprite', 'line']) {
      const object = fixture.add(kind),
        group = object.parent
      fixture.view.prepare(fixture.scene)
      const callback = object.onBeforeRender,
        originalLocal = firstMaterial(object).userData.nativeUniforms
      Object.assign(object.userData, {
        nativeScale: 2,
        nativeSize: 7,
        nativeRelative: true,
        atlasTransform: new THREE.Vector4(0.2, 0.3, 0.4, 0.5),
      })
      Object.assign(group.userData, {
        cellPosition: { x: 8, z: -10 },
        nativeHeading: 512,
        nativeTilt: 64,
        nativeRoll: 32,
      })
      fixture.view.painter.ranges.set(object, [37, 2])
      const expected = {
        range: [37, 2],
        sprite: kind === 'sprite' ? 1 : 0,
        scale: 2,
        size: 7,
        relative: 1,
        cell: [8, 0, -10, 1],
        basis: modelMatrix(512, 64, 32),
        atlas: [0.2, 0.3, 0.4, 0.5],
      }
      assert.deepEqual(
        sample(draw(object, fixture.scene, firstMaterial(object), callback)),
        expected
      )
      assert.equal(originalLocal.nativeAtlasTransform.value, object.userData.atlasTransform)
      fixture.view.overview = true
      assert.deepEqual(sample(draw(object, fixture.scene)).range, [-1, 0])
      fixture.view.overview = false
      const replacement =
        kind === 'sprite'
          ? new THREE.SpriteMaterial()
          : kind === 'line'
            ? new THREE.LineBasicMaterial()
            : new THREE.MeshBasicMaterial()
      fixture.materials.add(replacement)
      assert.equal(
        draw(object, fixture.scene, replacement, callback),
        undefined,
        'unprepared draw material retains the original early return'
      )
      object.material = replacement
      let foreignCalls = 0
      object.onBeforeRender = () => foreignCalls++
      fixture.view.prepare(fixture.scene)
      const local = draw(object, fixture.scene)
      assert.notEqual(local, originalLocal)
      assert.deepEqual(sample(local), expected)
      assert.equal(foreignCalls, 0, 'eligible preparation still replaces a foreign object hook')
    }
  } finally {
    fixture.close()
  }
})

test('draw-hook reuse leaves indexed conversion, shared-material ownership and shader patches intact', () => {
  const fixture = setup(),
    texture = new THREE.Texture()
  texture.userData.encodedColors = true
  const material = new THREE.MeshBasicMaterial({ map: texture })
  material.customProgramCacheKey = () => 'ownership-seed'
  material.onBeforeCompile = function (compiled) {
    compiled.uniforms.originalOwner = { value: this }
  }
  let converted = 0
  const indexed = new THREE.BoxGeometry()
  indexed.addEventListener('dispose', () => converted++)
  try {
    const a = fixture.add('mesh', material, indexed),
      b = fixture.add('mesh', material)
    fixture.view.prepare(fixture.scene)
    assert.equal(converted, 1)
    assert.notEqual(a.geometry, indexed)
    assert.equal(a.geometry.index, null)
    assert.equal(a.material, material)
    assert.notEqual(b.material, material)
    assert.equal(b.material.map, texture)
    assert.equal(fixture.view.materials.get(a.material).owner, a)
    assert.equal(fixture.view.materials.get(b.material).owner, b)
    const ownedGeometry = a.geometry,
      ownedB = b.material,
      compileA = a.material.onBeforeCompile
    const localA = a.material.userData.nativeUniforms,
      localB = b.material.userData.nativeUniforms
    assert.notEqual(localA, localB)
    const initial = shader(a.material),
      copied = shader(b.material)
    assert.equal(initial.uniforms.originalOwner.value, material)
    assert.equal(copied.uniforms.originalOwner.value, material)
    assert.equal(initial.uniforms.nativeBasis, fixture.view.uniforms.nativeBasis)
    assert.equal(initial.uniforms.nativePainterRange, localA.nativePainterRange)
    assert.equal(copied.uniforms.nativePainterRange, localB.nativePainterRange)
    assert.equal(initial.vertexShader.match(/uniform sampler2D nativePainter;/g).length, 1)
    assert.ok(initial.fragmentShader.includes('sRGBTransferEOTF(sampledDiffuseColor)'))
    assert.ok(initial.vertexShader.includes('gl_Position=nativePosition(transformed)'))
    assert.equal(a.material.customProgramCacheKey(), 'native-mesh-true-false-ownership-seed')
    for (let frame = 0; frame < 3; frame++) {
      fixture.view.prepare(fixture.scene)
      assert.equal(converted, 1)
      assert.equal(a.geometry, ownedGeometry)
      assert.equal(b.material, ownedB)
      assert.equal(a.material.onBeforeCompile, compileA)
      assert.equal(a.material.userData.nativeUniforms, localA)
      assert.deepEqual(shader(a.material).vertexShader, initial.vertexShader)
      assert.deepEqual(shader(a.material).fragmentShader, initial.fragmentShader)
    }
    const replacement = new THREE.BoxGeometry(),
      previous = a.geometry
    let replacementDisposed = 0
    replacement.addEventListener('dispose', () => replacementDisposed++)
    previous.dispose()
    a.geometry = replacement
    fixture.view.prepare(fixture.scene)
    assert.equal(replacementDisposed, 1)
    assert.notEqual(a.geometry, replacement)
    assert.equal(a.geometry.index, null)
    draw(a, fixture.scene)
  } finally {
    fixture.close()
    texture.dispose()
  }
})

test('nativeIgnore transitions and the actual SelectionOverlay retain their hook policies', async () => {
  await loadSceneFixture()
  const { SelectionOverlay } = await import('../app/drag-overlay.ts')
  const fixture = setup(),
    texture = new THREE.Texture()
  try {
    const ignored = fixture.add(),
      overlay = new SelectionOverlay(texture, fixture.view)
    let calls = 0
    const foreign = () => calls++
    ignored.userData.nativeIgnore = true
    ignored.onBeforeRender = foreign
    fixture.scene.add(overlay)
    const overlayHook = overlay.onBeforeRender
    fixture.view.painter.ranges.set(overlay, [17, 2])
    fixture.view.prepare(fixture.scene)
    assert.equal(ignored.onBeforeRender, foreign)
    assert.equal(ignored.frustumCulled, true)
    assert.equal(firstMaterial(ignored).userData.nativeUniforms, undefined)
    assert.equal(overlay.onBeforeRender, overlayHook)
    draw(overlay, fixture.scene)
    assert.equal(overlay.material.uniforms.base.value, 17)
    assert.equal(overlay.material.uniforms.painter.value, fixture.view.painter.texture)
    ignored.userData.nativeIgnore = false
    fixture.view.prepare(fixture.scene)
    assert.equal(ignored.frustumCulled, false)
    assert.ok(draw(ignored, fixture.scene))
    assert.equal(calls, 0)
    ignored.userData.nativeIgnore = true
    ignored.onBeforeRender = foreign
    fixture.view.prepare(fixture.scene)
    assert.equal(ignored.onBeforeRender, foreign)
    ignored.userData.nativeIgnore = false
    fixture.view.prepare(fixture.scene)
    assert.ok(draw(ignored, fixture.scene))
    assert.equal(calls, 0)
  } finally {
    fixture.close()
    texture.dispose()
  }
})

test('object clones, reparenting and new views read their own current draw state', () => {
  const a = setup(),
    b = setup()
  try {
    const object = a.add()
    a.view.painter.ranges.set(object, [11, 1])
    a.view.prepare(a.scene)
    const firstHook = object.onBeforeRender
    object.parent.userData.cellPosition = { x: 1, z: 2 }
    assert.deepEqual(sample(draw(object, a.scene)).cell, [1, 0, 2, 1])
    const parent = new THREE.Group()
    parent.userData = { cellPosition: { x: -3, z: 9 }, nativeHeading: 256 }
    parent.add(object)
    b.scene.add(parent)
    b.view.painter.ranges.set(object, [70, 3])
    b.view.prepare(b.scene)
    assert.notEqual(object.onBeforeRender, firstHook)
    assert.deepEqual(sample(draw(object, b.scene)).range, [70, 3])
    assert.deepEqual(sample(draw(object, b.scene)).cell, [-3, 0, 9, 1])
    assert.deepEqual(sample(draw(object, b.scene)).basis, modelMatrix(256))
    assert.deepEqual(sample(draw(object, b.scene, firstMaterial(object), firstHook)).range, [11, 1])
    a.view.prepare(b.scene)
    assert.deepEqual(sample(draw(object, b.scene)).range, [11, 1])
    const clone = object.clone(),
      cloneParent = new THREE.Group()
    cloneParent.userData.cellPosition = { x: 4, z: -5 }
    cloneParent.add(clone)
    b.scene.add(cloneParent)
    a.view.painter.ranges.set(clone, [52, 4])
    a.view.prepare(b.scene)
    assert.notEqual(clone.material, object.material)
    assert.notEqual(clone.onBeforeRender, object.onBeforeRender)
    assert.deepEqual(sample(draw(clone, b.scene)).range, [52, 4])
    assert.deepEqual(sample(draw(clone, b.scene)).cell, [4, 0, -5, 1])
  } finally {
    a.close()
    b.close()
  }
})

test('actual unit and native-model factories keep live hooks and resource ownership through removal', async () => {
  const api = await loadSceneFixture(),
    world = api.createWorld(22)
  const fixture = await makeSelectionScene(world)
  const { nativeModel } = await import('../app/scene-assets.ts')
  const view = new RenderView(),
    scene = new THREE.Scene()
  fixture.scene.view = view
  view.update(800, 600, world.units[0], 0, 0, false)
  scene.add(fixture.scene.objects)
  const modelGroup = new THREE.Group()
  modelGroup.add(nativeModel(13, 2, 4, false, fixture.scene.environment))
  scene.add(modelGroup)
  try {
    const model = modelGroup.children[0],
      atlas = model.material.map
    let atlasDisposed = 0,
      modelDisposed = 0,
      materialDisposed = 0
    atlas.addEventListener('dispose', () => atlasDisposed++)
    model.geometry.addEventListener('dispose', () => modelDisposed++)
    model.material.addEventListener('dispose', () => materialDisposed++)
    for (let frame = 0; frame < 3; frame++) {
      fixture.scene.gameClock.animationFrame = frame
      fixture.render()
      const before = structuredClone(world)
      view.prepare(scene)
      assert.ok(fixture.scene.unitMeshes.size)
      for (const group of fixture.scene.unitMeshes.values())
        for (const layer of group.userData.layers) {
          const local = draw(layer, scene)
          assert.equal(local.nativeAtlasTransform.value, layer.userData.atlasTransform)
          assert.equal(local.nativePainterSprite.value, 1)
        }
      assert.equal(draw(model, scene).nativeModelScale.value, model.userData.nativeScale)
      assert.deepEqual(
        world,
        before,
        'preparation and draw hooks preserve all World/terrain/RNG state'
      )
    }
    fixture.scene.releaseGroup(modelGroup)
    modelGroup.removeFromParent()
    assert.equal(modelDisposed, 1)
    assert.equal(materialDisposed, 1)
    assert.equal(atlasDisposed, 0)
    world.units = []
    fixture.render()
    view.prepare(scene)
    assert.equal(fixture.scene.unitMeshes.size, 0)
    assert.equal(fixture.scene.objects.children.length, 0)
    assert.equal(atlasDisposed, 0)
  } finally {
    modelGroup.removeFromParent()
    fixture.close()
    view.dispose()
  }
})

test('warmed preparation reuses native object callbacks while retaining every hook assignment', () => {
  const rows = []
  for (const kind of ['mesh', 'sprite'])
    for (const population of [64, 256, 1024]) {
      const fixture = setup(),
        seen = new Set(),
        assignments = []
      try {
        for (let i = 0; i < population; i++) {
          const object = fixture.add(kind)
          let current = object.onBeforeRender
          Object.defineProperty(object, 'onBeforeRender', {
            configurable: true,
            get: () => current,
            set: value => {
              assignments.push(value)
              current = value
            },
          })
        }
        for (const phase of ['cold', 'warm-1', 'warm-2']) {
          const previousAssignments = assignments.length,
            previousIdentities = seen.size
          fixture.view.prepare(fixture.scene)
          fixture.objects.forEach(object => seen.add(object.onBeforeRender))
          rows.push({
            kind,
            population,
            phase,
            assigned: assignments.length - previousAssignments,
            newCallbacks: seen.size - previousIdentities,
          })
          for (const object of fixture.objects) assert.ok(draw(object, fixture.scene))
        }
      } finally {
        fixture.close()
      }
    }
  console.log(JSON.stringify({ diagnostic: 'native-object-draw-hook-identities', rows }))
  for (const row of rows) {
    assert.equal(
      row.assigned,
      row.population,
      'the hook is still assigned at every eligible prepare'
    )
    assert.equal(
      row.newCallbacks,
      row.phase === 'cold' ? row.population : 0,
      `${row.kind}/${row.population}/${row.phase}: only cold preparation creates native object hooks`
    )
  }
})
