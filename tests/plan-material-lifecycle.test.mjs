// Actual plan creation/removal, RenderView ownership and GameScene disposal.
// World populations, texture IO and unrelated teardown leaves are controlled;
// disposal events are not GPU-memory, browser-crash or performance evidence.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makePlanScene } from './support/plan-scene.mjs'

async function setup(t, count = 1) {
  const api = await loadSceneFixture(),
    world = api.createWorld(22)
  world.buildings = []
  const add = () => api.addBuilding(world, 'red', 'hut', { x: 0, z: 0 }, false, { plan: true })
  for (let index = 0; index < count; index++) assert.ok(add().preparation)
  const fixture = await makePlanScene(world),
    { scene } = fixture,
    { RenderView } = await import('../app/render-view.ts'),
    { GameScene } = await import('../app/scene.ts'),
    { texture } = await import('../app/scene-assets.ts')
  scene.cursor = new THREE.Mesh(new THREE.BufferGeometry(), scene.cursor.material)
  scene.cursor.material.map = texture('atlas')
  scene.cursor.visible = false
  scene.scene = new THREE.Scene()
  scene.scene.add(scene.ground)
  // Match the constructor's ownership-relevant order: cursor before plans,
  // which updateBuildingsFrame appends to ground. Visibility does not skip prepare.
  scene.ground.add(scene.objects, scene.decorations, scene.cursor)
  scene.view = new RenderView()
  scene.view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  const noop = () => {}
  // Keep GameScene.dispose, releaseGroup and RenderView.dispose unchanged.
  // Only unrelated browser/audio/UI leaves are replaced in this Node fixture.
  Object.assign(scene, {
    disposed: false,
    cancelNearbyFollowers: noop,
    ownedSounds: new Map(),
    terrainLoad: new AbortController(),
    resize: { disconnect: noop },
    disposeListeners: [],
    globe: Object.assign(new THREE.Group(), { dispose: noop }),
    waterMap: new THREE.Texture(),
    terrainMap: new THREE.Texture(),
    renderer: { dispose: noop, domElement: { remove: noop } },
    cancelTooltipInspection: noop,
    tooltipElement: { remove: noop },
    pointerOutline: { remove: noop },
    buildingPanels: new Map(),
    objectPanels: { dispose: noop },
    spellPointer: { remove: noop },
    worshipPresentation: { dispose: noop },
  })
  const observations = []
  const watch = resource => {
    let count = 0
    const listener = () => count++
    resource.addEventListener('dispose', listener)
    observations.push(() => resource.removeEventListener('dispose', listener))
    return () => count
  }
  const dispose = () => GameScene.prototype.dispose.call(scene)
  t.after(() => {
    dispose()
    observations.forEach(remove => remove())
    // Restore the pre-existing fixture's texture/DOM leaves. Its own cleanup
    // is outside the observed application lifecycle and has no GPU resources.
    fixture.close()
  })
  return { ...fixture, world, add, watch, dispose, prepare: () => scene.view.prepare(scene.scene) }
}

test('unprepared plan removal retains cursor material and cached atlas until scene teardown', async t => {
  const f = await setup(t),
    { scene, world } = f
  f.render()
  const [plan] = scene.plans.values(),
    geometryDisposals = f.watch(plan.geometry),
    cursorDisposals = f.watch(scene.cursor.material),
    atlasDisposals = f.watch(scene.cursor.material.map)
  assert.equal(plan.material, scene.cursor.material)
  world.buildings = []
  f.render()
  f.render()
  assert.equal(scene.plans.size, 0)
  assert.equal(plan.parent, null)
  assert.equal(geometryDisposals(), 1)
  assert.equal(cursorDisposals(), 0)
  assert.equal(atlasDisposals(), 0)
  f.dispose()
  f.dispose()
  assert.equal(geometryDisposals(), 1)
  assert.equal(cursorDisposals(), 1)
  assert.equal(atlasDisposals(), 0, 'scene teardown also retains the cached atlas')
})

test('prepared plans release only their clones once, and scene teardown owns remaining plans', async t => {
  const f = await setup(t, 3),
    { scene, world } = f,
    cursor = scene.cursor.material,
    cursorDisposals = f.watch(cursor),
    atlasDisposals = f.watch(cursor.map)
  f.render()
  const plans = [...scene.plans.values()]
  assert.ok(plans.every(plan => plan.material === cursor))
  f.prepare()
  const materials = plans.map(plan => plan.material),
    materialDisposals = materials.map(f.watch),
    geometryDisposals = plans.map(plan => f.watch(plan.geometry))
  assert.equal(scene.cursor.material, cursor, 'invisible cursor retains the source material')
  assert.equal(new Set(materials).size, 3)
  for (const material of materials) {
    assert.notEqual(material, cursor)
    assert.equal(material.map, cursor.map, 'clones borrow the cached atlas')
    assert.notEqual(material.userData.nativeUniforms, cursor.userData.nativeUniforms)
  }
  f.prepare()
  assert.deepEqual(
    plans.map(plan => plan.material),
    materials,
    'repeat preparation retains ownership'
  )
  world.buildings = world.buildings.slice(2)
  f.render()
  f.render()
  assert.deepEqual(
    materialDisposals.map(count => count()),
    [1, 1, 0]
  )
  assert.deepEqual(
    geometryDisposals.map(count => count()),
    [1, 1, 0]
  )
  assert.equal(cursorDisposals(), 0)
  assert.equal(atlasDisposals(), 0)
  assert.deepEqual(
    plans.map(plan => plan.parent),
    [null, null, scene.ground]
  )

  const unprepared = f.add()
  f.render()
  assert.equal(scene.plans.get(unprepared.id).material, cursor)
  const unpreparedGeometry = f.watch(scene.plans.get(unprepared.id).geometry)
  f.dispose()
  f.dispose()
  assert.deepEqual(
    materialDisposals.map(count => count()),
    [1, 1, 1]
  )
  assert.deepEqual(
    geometryDisposals.map(count => count()),
    [1, 1, 1]
  )
  assert.equal(unpreparedGeometry(), 1)
  assert.equal(cursorDisposals(), 1, 'scene cleanup deduplicates the still-shared source')
  assert.equal(atlasDisposals(), 0)
})

test('material-array cleanup deduplicates prepared clones while retaining a shared cursor entry', async t => {
  const f = await setup(t),
    { scene, world } = f,
    cursor = scene.cursor.material,
    cursorDisposals = f.watch(cursor),
    atlasDisposals = f.watch(cursor.map)
  f.render()
  const [plan] = scene.plans.values()
  // Plans currently start with one material. This controlled array exercises
  // RenderView's supported array ownership branch, not a shipped plan variant.
  plan.material = [cursor, cursor]
  f.prepare()
  const [first, second] = plan.material,
    firstDisposals = f.watch(first),
    secondDisposals = f.watch(second)
  assert.notEqual(first, cursor)
  assert.notEqual(second, cursor)
  assert.notEqual(first, second)
  plan.material = [first, first, cursor, second, second]
  world.buildings = []
  f.render()
  f.render()
  assert.equal(firstDisposals(), 1)
  assert.equal(secondDisposals(), 1)
  assert.equal(cursorDisposals(), 0)
  assert.equal(atlasDisposals(), 0)
  f.dispose()
  f.dispose()
  assert.equal(firstDisposals(), 1)
  assert.equal(secondDisposals(), 1)
  assert.equal(cursorDisposals(), 1)
  assert.equal(atlasDisposals(), 0)
})
