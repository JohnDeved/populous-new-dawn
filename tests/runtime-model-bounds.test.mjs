// Private internal-runtime contract regression. Real RenderView/Picker methods
// are not decorated. Texture IO and already-submitted painter records are supplied.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import * as THREE from 'three'
const app = new URL('../app/', import.meta.url)
const baselineURL = new URL('__runtime_model_parent.ts', app).href
let enclosures = 0
globalThis.__runtimeModelEnclosure = () => enclosures++
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === baselineURL) return { url: baselineURL, shortCircuit: true }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url === baselineURL) return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(readFileSync(new URL('./fixtures/runtime-model-pick-parent.ts.txt', import.meta.url), 'utf8'), { mode: 'transform' }) }
    if (url.startsWith(app.href) && url.endsWith('.json')) return { format: 'module', shortCircuit: true, source: 'export default ' + readFileSync(new URL(url), 'utf8') }
    if (url.startsWith(app.href) && url.endsWith('.ts')) {
      let source = readFileSync(new URL(url), 'utf8')
      if (url.endsWith('/model-pick-bounds.ts')) source = source.replace('    this.valid = true', '    globalThis.__runtimeModelEnclosure(); this.valid = true')
      return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(source, { mode: 'transform' }) }
    }
    return next(url, context)
  },
})
const { nativeModel, ownedStaticNativeModel, geometry, releaseGroup } = await import('../app/scene-assets.ts')
const { nativeModelResource } = await import('../app/model-resources.ts')
const { createRuntimeModelPicking, releaseRuntimeModel, runtimeModelAsset } = await import('../app/owned-static-model.ts')
const { ScenePicking } = await import('../app/scene-picking.ts')
const { ScenePicking: BaselinePicking } = await import(baselineURL)
const { RenderView } = await import('../app/render-view.ts')
const { modelStage } = await import('../app/model-faces.ts')
const { cameraPreset } = await import('../app/projection.ts')
const { createPointerFrameMetrics } = await import('../app/pointer-frame-metrics.ts')
const far = { clientX: -1000000, clientY: -1000000 }
function update(view, point = { x: 0, z: 0 }, n = 0) {
  view.update(800, 600, point, n * Math.PI / 7, n * 2, false, 800, cameraPreset(n * 2))
}
function submit(view, meshes) {
  view.painter.ranges = new WeakMap()
  view.painter.commandsBySlot = meshes.map((mesh, i) => {
    view.painter.ranges.set(mesh, [i, 1])
    return { slot: i, alpha: false, bucket: 10, cell: i, phase: 0, object: i, face: 0, order: i }
  })
}
function attachPicking(scene, runtime = true) {
  scene.frame = 1
  scene.terrain = new THREE.Group()
  scene.unitMeshes = new Map()
  scene.renderer = { domElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: scene.view.projection.width, height: scene.view.projection.height }) } }
  const context = runtime ? createRuntimeModelPicking(scene.view) : undefined
  return { scene, view: scene.view, runtime: context, picking: new ScenePicking(scene, context), baseline: new BaselinePicking(scene) }
}
function fixture(t, { id = 13, stage = 4, owned = true, runtime = true, meshes = 1 } = {}) {
  const oldLoad = THREE.TextureLoader.prototype.load
  THREE.TextureLoader.prototype.load = () => new THREE.Texture()
  const view = new RenderView(), objects = new THREE.Group(), decorations = new THREE.Group(), groups = [], pieces = []
  try {
    for (let i = 0; i < meshes; i++) {
      const group = new THREE.Group(); group.userData = { building: 7 + i }
      const mesh = owned ? ownedStaticNativeModel(id, 2, stage) : nativeModel(id, 2, stage)
      group.position.x = i * 3
      group.add(mesh); objects.add(group); groups.push(group); pieces.push(mesh)
    }
  } finally { THREE.TextureLoader.prototype.load = oldLoad }
  update(view); submit(view, pieces)
  t.after(() => { releaseGroup(objects); view.dispose() })
  return { ...attachPicking({ view, objects, decorations }, runtime), mesh: pieces[0], group: groups[0], pieces, groups }
}
function compare(f, event, { built, metrics } = {}) {
  f.scene.frame++
  const world = f.assertWorld ? structuredClone(f.scene.world) : undefined
  const expected = f.baseline.pick(event)
  if (world) assert.deepEqual(f.scene.world, world, 'baseline pick preserves the fully initialized World')
  const actual = f.picking.pick(event, metrics)
  if (world) assert.deepEqual(f.scene.world, world, 'candidate pick preserves the same fully initialized World')
  assert.equal(actual, expected); assert.equal(f.picking.lastKind, f.baseline.lastKind)
  if (built !== undefined) assert.equal(f.picking.models.has(f.mesh), built)
  for (const mesh of f.pieces ?? [f.mesh]) {
    const candidate = f.picking.models.get(mesh), parent = f.baseline.models.get(mesh)
    if (candidate && parent && candidate.key === parent.key) assert.deepEqual(candidate.commands, parent.commands)
  }
  return actual
}
function hitPoint(f) {
  const candidates = new BaselinePicking(f.scene).model(f.mesh, 'find-interior').filter(c => c.kind === 'model')
  for (const command of candidates) {
    const event = { clientX: Math.trunc(command.points.reduce((s, p) => s + p.x, 0) / 3), clientY: Math.trunc(command.points.reduce((s, p) => s + p.y, 0) / 3) }
    if (new BaselinePicking(f.scene).pick(event) !== null) return event
  }
  assert.fail('fixture must have a genuine ordinary model hit')
}

test('owned snapshot and emitted geometry are isolated from mutable legacy caches', t => {
  const generic = fixture(t, { owned: false, runtime: false }), source = nativeModelResource(13)
  const cached = geometry('original-2-13-4', () => assert.fail('legacy cache exists'))
  const original = cached.attributes.position.array[0]
  cached.attributes.position.array[0] = original + 100
  const f = fixture(t)
  cached.attributes.position.array[0] = original
  const resource = f.mesh.userData.nativeResource
  assert.notEqual(resource, source); assert.notEqual(resource.data, source.data)
  assert.deepEqual(resource.data, source.data)
  assert.deepEqual([...f.mesh.geometry.attributes.position.array], modelStage(source.data, 4).p.map(Math.fround))
  for (const value of [resource, resource.data, resource.data.p, resource.data.faces, resource.data.normals, ...resource.data.normals]) assert.ok(Object.isFrozen(value))
  assert.throws(() => { resource.data.p[0] = 7 }, TypeError)
  assert.equal(runtimeModelAsset(generic.mesh), undefined)
  compare(f, far, { built: false }); compare(generic, far, { built: true })
})

test('stationary rejected bounds reuse exact value key; outside-to-inside materializes once', t => {
  const f = fixture(t), start = enclosures
  compare(f, far, { built: false })
  assert.equal(enclosures - start, 1)
  const partial = f.runtime.bounds.get(f.mesh)
  assert.ok(partial)
  update(f.view) // ordinary producer replaces projection object, not effective values
  compare(f, { clientX: far.clientX + 7, clientY: far.clientY }, { built: false })
  assert.equal(enclosures - start, 1); assert.equal(f.runtime.bounds.get(f.mesh), partial)
  assert.equal(compare(f, hitPoint(f), { built: true }), 7)
  assert.equal(enclosures - start, 1, 'overlapping cached enclosure needs no repeated interval calculation')
  assert.equal(f.runtime.bounds.has(f.mesh), false)
  const record = f.picking.models.get(f.mesh)
  compare(f, far, { built: true }); assert.equal(f.picking.models.get(f.mesh), record)
  assert.equal(f.picking.model(f.mesh, 'direct'), f.picking.model(f.mesh, 'direct'))
})

test('A complete -> rejected B -> A rebuilds, and cache deletion is not a model build', t => {
  const f = fixture(t)
  compare(f, hitPoint(f), { built: true })
  const original = f.picking.models.get(f.mesh), metrics = createPointerFrameMetrics(true)
  update(f.view, { x: 1, z: 0 })
  compare(f, far, { built: false, metrics })
  assert.equal(metrics.modelWork[0], 0)
  assert.ok(f.runtime.bounds.has(f.mesh))
  const count = enclosures
  compare(f, { ...far, clientX: far.clientX + 1 }, { built: false, metrics })
  assert.equal(enclosures, count); assert.equal(metrics.modelWork[0], 0)
  update(f.view)
  compare(f, hitPoint(f), { built: true, metrics })
  assert.notEqual(f.picking.models.get(f.mesh), original)
  assert.equal(metrics.modelWork[0], 1); assert.equal(f.runtime.bounds.has(f.mesh), false)
})

test('workspace bounds are copied per mesh and painter source gates admission', t => {
  const f = fixture(t, { meshes: 3 })
  submit(f.view, f.pieces.slice(0, 2)); compare(f, far)
  const [a, b, absent] = f.pieces.map(mesh => f.runtime.bounds.get(mesh))
  assert.ok(a && b); assert.notEqual(a, b); assert.notEqual(a, f.runtime.workspace.bounds)
  assert.equal(absent, undefined); assert.equal(f.picking.models.has(f.pieces[2]), false)
  const snapshot = { ...a }
  f.groups[1].position.z += 2; compare(f, far)
  assert.deepEqual(a, snapshot)
  submit(f.view, f.pieces)
  compare(f, hitPoint(f))
})

test('normal camera updates, pose/nativeSize and construction stages preserve exact commands', t => {
  for (const id of [5, 13, 15, 95, 109, 143, 144]) for (let stage = 0; stage < 5; stage++) {
    const f = fixture(t, { id, stage })
    for (let n = 0; n < 4; n++) {
      update(f.view, { x: n === 3 ? 256 : n * 2, z: -n * 2 }, n)
      f.mesh.userData.nativeSize = 32 + n * 117
      Object.assign(f.group.userData, { nativeHeading: n * 471, nativeTilt: n * 31, nativeRoll: -n * 42 })
      f.group.position.set(n * 2, n / 3, -n * 2)
      compare(f, far)
      const commands = new BaselinePicking(f.scene).model(f.mesh, 'sample'), bound = commands.at(-1).bounds
      for (const point of [{ clientX: bound.x, clientY: bound.y }, { clientX: bound.x + bound.width, clientY: bound.y + bound.height }, ...commands.filter(c => c.kind === 'model').slice(0, 2).map(c => ({ clientX: Math.trunc(c.points.reduce((s, p) => s + p.x, 0) / 3), clientY: Math.trunc(c.points.reduce((s, p) => s + p.y, 0) / 3) }))]) compare(f, point)
    }
  }
})

test('explicit ownership exit invalidates complete and partial caches before raw writes', t => {
  for (const inside of [false, true]) {
    const f = fixture(t)
    compare(f, inside ? hitPoint(f) : far)
    const version = f.mesh.geometry.attributes.position.version
    releaseRuntimeModel(f.mesh, f.runtime)
    assert.equal(runtimeModelAsset(f.mesh), undefined); assert.equal(f.runtime.bounds.has(f.mesh), false)
    assert.equal(f.mesh.geometry.attributes.position.version, version + 1)
    f.mesh.geometry.attributes.position.array[0] += 30
    compare(f, far, { built: true })
    compare(f, hitPoint(f), { built: true })
  }
  const f = fixture(t), clone = f.mesh.clone()
  clone.geometry = clone.geometry.clone() // mutable handoff may not share owned positions
  clone.geometry.attributes.position.array[0] += 20
  assert.notEqual(clone.geometry.attributes.position.array[0], f.mesh.geometry.attributes.position.array[0])
  assert.equal(runtimeModelAsset(clone), undefined)
  f.group.remove(f.mesh); f.group.add(clone); f.mesh = clone; f.pieces[0] = clone; submit(f.view, [clone])
  compare(f, far, { built: true })
})

test('generic/custom construction is eager with exact observable property reads', t => {
  const observed = (target, trace) => new Proxy(target, { get(object, key, receiver) { trace.push('get:' + String(key)); return Reflect.get(object, key, receiver) }, getOwnPropertyDescriptor(object, key) { trace.push('descriptor:' + String(key)); return Reflect.getOwnPropertyDescriptor(object, key) }, getPrototypeOf(object) { trace.push('prototype'); return Reflect.getPrototypeOf(object) } })
  for (const install of [
    (f, trace) => { f.mesh.userData = observed(f.mesh.userData, trace) },
    (f, trace) => { f.group.userData = observed(f.group.userData, trace) },
    (f, trace) => { f.view.projection = observed(f.view.projection, trace) },
    (f, trace) => { const view = f.view; Object.defineProperty(f.scene, 'view', { get() { trace.push('view'); return view } }) },
  ]) {
    const f = fixture(t, { owned: false, runtime: false }), trace = []
    install(f, trace)
    const expected = f.baseline.pick(far), expectedTrace = [...trace]; trace.length = 0
    assert.equal(f.picking.pick(far), expected); assert.deepEqual(trace, expectedTrace)
    assert.ok(f.picking.models.has(f.mesh))
  }
  const f = fixture(t, { owned: false, runtime: false }), actualTrace = [], expectedTrace = []
  assert.equal(observed(f.picking, actualTrace).pick(far), observed(f.baseline, expectedTrace).pick(far))
  assert.deepEqual(actualTrace, expectedTrace)
  let called = 0
  f.picking.model = function () { assert.equal(arguments.length, 2); called++; return [{ kind: 'bounds', id: 99, bucket: 10, face: 0, bounds: { x: 0, y: 0, width: 1, height: 1 } }] }
  f.scene.frame++; f.picking.pick(far); assert.equal(called, 1)
})

test('authored mission producers retain ownership across pose, timber and vehicle updates; resource/stage replacement creates fresh meshes', async t => {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const { makeHutSmokeScene } = await import('./support/hut-smoke-scene.mjs')
  const api = await loadSceneFixture(), { GameScene } = await import('../app/scene.ts')
  const { makeDecorations, updateDecorationsFrame } = await import('../app/scene-terrain-runtime.ts')
  const world = api.createWorld(10), base = await makeHutSmokeScene(world), { scene } = base
  Object.setPrototypeOf(scene, GameScene.prototype)
  delete scene.locate; delete scene.orientModel; delete scene.makeDecorations
  Object.assign(scene, { view: new RenderView(), vehicleMeshes: new Map(), waveFrames: new WeakMap() })
  const f = attachPicking(scene)
  t.after(() => { scene.view.dispose(); base.close() })
  const before = structuredClone(world)
  base.render(); api.updateVehiclesFrame(scene); makeDecorations(scene)
  assert.equal(world.randomState, before.randomState, 'presentation setup must not consume gameplay RNG')
  assert.deepEqual(world.cosmeticRandom, before.cosmeticRandom)
  const building = world.buildings.find(b => scene.buildingMeshes.has(b.id))
  const vehicle = world.vehicles.find(v => scene.vehicleMeshes.has(v.id))
  const treeGroup = scene.decorations.children.find(g => g.userData.point?.model >= 1 && g.userData.point.model <= 6)
  assert.ok(building && vehicle && treeGroup)
  const buildingMesh = scene.buildingMeshes.get(building.id).children[0]
  const vehicleMesh = scene.vehicleMeshes.get(vehicle.id).children[0]
  const treeMesh = treeGroup.children[0]
  for (const mesh of [buildingMesh, vehicleMesh, treeMesh]) assert.ok(runtimeModelAsset(mesh))
  f.mesh = buildingMesh; f.pieces = [buildingMesh, vehicleMesh, treeMesh]
  submit(f.view, f.pieces); update(f.view, building)
  const beforePicking = structuredClone(world)
  f.assertWorld = true // both arms start after the identical, shared smoke-root initialization
  compare(f, far)
  for (const mesh of f.pieces) {
    f.mesh = mesh
    const origin = new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld)
    update(f.view, { x: origin.x, z: origin.z })
    compare(f, far)
    compare(f, hitPoint(f))
  }
  assert.deepEqual(world, beforePicking, 'picking must not mutate authored gameplay/presentation state')
  // Controlled samples of the actual producers' supported state transitions.
  // They are not claims that damage/chopping were naturally earned in play.
  building.damageState = { stage: 4, tilt: 31, roll: -42 }
  base.render()
  const posedBuilding = scene.buildingMeshes.get(building.id).children[0]
  building.damageState.tilt = 41
  base.render()
  assert.equal(scene.buildingMeshes.get(building.id).children[0], posedBuilding)
  const originalVehiclePosition = [...vehicleMesh.geometry.attributes.position.array]
  vehicle.heading += 0.2; vehicle.x += 64; vehicle.h += 3
  vehicle.apparentTribe = 1
  api.updateVehiclesFrame(scene)
  assert.equal(scene.vehicleMeshes.get(vehicle.id).children[0], vehicleMesh)
  assert.deepEqual([...vehicleMesh.geometry.attributes.position.array], originalVehiclePosition)
  const originalTree = [...treeMesh.geometry.attributes.position.array]
  scene.treeSignature = world.trees.map(tree => tree.logs >= 1 ? '1' : '0').join('')
  treeGroup.userData.point.logs = Math.max(1, treeGroup.userData.point.logs - 1)
  updateDecorationsFrame(scene)
  assert.deepEqual([...treeMesh.geometry.attributes.position.array], originalTree)
  assert.ok(Number.isInteger(treeMesh.userData.nativeSize))
  treeGroup.userData.point.burn = { scale: 117 }
  updateDecorationsFrame(scene)
  assert.equal(treeMesh.userData.nativeSize, 117)
  f.pieces = [posedBuilding, vehicleMesh, treeMesh]; submit(f.view, f.pieces)
  for (const mesh of f.pieces) {
    f.mesh = mesh; mesh.updateWorldMatrix(true, false)
    const origin = new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld)
    update(f.view, { x: origin.x, z: origin.z }); compare(f, far); compare(f, hitPoint(f))
  }
  building.damageState.stage = 3; base.render()
  const replacement = scene.buildingMeshes.get(building.id).children[0]
  assert.notEqual(replacement, posedBuilding); assert.ok(runtimeModelAsset(replacement))
  assert.equal(f.picking.models.has(replacement), false); assert.equal(f.runtime.bounds.has(replacement), false)
  f.mesh = replacement; f.pieces = [replacement]; submit(f.view, f.pieces); update(f.view, building)
  compare(f, far); compare(f, hitPoint(f))
  const tree = treeGroup.userData.point, remainingLogs = tree.logs
  tree.logs = 0; updateDecorationsFrame(scene)
  assert.equal(scene.decorations.children.some(g => g.userData.point?.id === tree.id), false)
  tree.logs = remainingLogs; updateDecorationsFrame(scene)
  const newTree = scene.decorations.children.find(g => g.userData.point?.id === tree.id).children[0]
  assert.notEqual(newTree, treeMesh); assert.ok(runtimeModelAsset(newTree))
  assert.equal(f.picking.models.has(newTree), false); assert.equal(f.runtime.bounds.has(newTree), false)
  f.mesh = newTree; f.pieces = [newTree]
  submit(f.view, [treeMesh]) // prior frame's source does not admit a replacement mesh
  const count = enclosures; compare(f, far); assert.equal(enclosures, count)
  submit(f.view, [newTree]); newTree.updateWorldMatrix(true, false)
  const origin = new THREE.Vector3().setFromMatrixPosition(newTree.matrixWorld)
  update(f.view, { x: origin.x, z: origin.z }); compare(f, far); compare(f, hitPoint(f))
})

test('checkpoint/restart reconstructs fresh runtime caches and generic shrines remain eager', async t => {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const { makeHutSmokeScene } = await import('./support/hut-smoke-scene.mjs')
  const api = await loadSceneFixture(), { GameScene } = await import('../app/scene.ts')
  const original = api.createWorld(10), restored = api.migrateCheckpoint(structuredClone(original))
  let prior
  for (const world of [original, restored, api.createWorld(10)]) {
    const base = await makeHutSmokeScene(world), { scene } = base
    Object.setPrototypeOf(scene, GameScene.prototype)
    delete scene.locate; delete scene.orientModel
    scene.view = new RenderView(); scene.vehicleMeshes = new Map()
    const f = attachPicking(scene)
    try {
      api.updateVehiclesFrame(scene)
      const group = scene.vehicleMeshes.values().next().value
      assert.ok(group)
      f.mesh = group.children[0]; f.pieces = [f.mesh]
      assert.ok(runtimeModelAsset(f.mesh)); assert.equal(f.picking.models.has(f.mesh), false)
      if (prior) assert.notEqual(f.mesh, prior)
      prior = f.mesh
      group.updateWorldMatrix(true, true)
      update(f.view, { x: group.position.x, z: group.position.z }); submit(f.view, f.pieces)
      compare(f, far); compare(f, hitPoint(f))
      const shrine = new THREE.Group(); shrine.userData.shrine = 700
      const mesh = nativeModel(30); shrine.add(mesh); scene.objects.add(shrine)
      assert.equal(runtimeModelAsset(mesh), undefined)
      submit(f.view, [mesh]); f.mesh = mesh; f.pieces = [mesh]
      compare(f, far, { built: true })
      mesh.geometry.attributes.position.array[0] += 1
      mesh.geometry.attributes.position.needsUpdate = true
      compare(f, far, { built: true })
    } finally { scene.view.dispose(); base.close() }
  }
})

test('authored Level 2 producer/query lifecycle has real buildings and trees, no invented vehicles, and identical complete results/World', async t => {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const { makeHutSmokeScene } = await import('./support/hut-smoke-scene.mjs')
  const api = await loadSceneFixture(), { GameScene } = await import('../app/scene.ts')
  const { makeDecorations, updateDecorationsFrame } = await import('../app/scene-terrain-runtime.ts')
  const world = api.createWorld(2), base = await makeHutSmokeScene(world), { scene } = base
  Object.setPrototypeOf(scene, GameScene.prototype)
  delete scene.locate; delete scene.orientModel; delete scene.makeDecorations
  Object.assign(scene, { view: new RenderView(), vehicleMeshes: new Map(), shrineMeshes: new Map(), waveFrames: new WeakMap() })
  const f = attachPicking(scene)
  t.after(() => { scene.view.dispose(); base.close() })
  base.render(); api.updateVehiclesFrame(scene); makeDecorations(scene); api.updateShrinesFrame(scene)
  assert.equal(world.vehicles.length, 0, 'authored Level 2 has no vehicle to promote')
  assert.equal(scene.vehicleMeshes.size, 0)
  const buildingMeshes = [...scene.buildingMeshes.values()].map(g => g.children[0])
  const treeMeshes = scene.decorations.children.filter(g => g.userData.point && g.userData.point.model !== 11).map(g => g.children[0])
  const shrineMeshes = [...scene.shrineMeshes.values()].map(entry => entry.g.children[0])
  assert.ok(buildingMeshes.length > 0 && treeMeshes.length > 0)
  for (const mesh of [...buildingMeshes, ...treeMeshes]) assert.ok(runtimeModelAsset(mesh))
  for (const mesh of shrineMeshes) assert.equal(runtimeModelAsset(mesh), undefined)
  f.pieces = [...buildingMeshes, ...treeMeshes, ...shrineMeshes]
  f.assertWorld = true
  submit(f.view, f.pieces)
  for (const mesh of [buildingMeshes[0], treeMeshes[0]]) {
    f.mesh = mesh; mesh.updateWorldMatrix(true, false)
    const origin = new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld)
    update(f.view, { x: origin.x, z: origin.z })
    compare(f, far)
    compare(f, hitPoint(f), { built: true })
    assert.deepEqual(f.picking.models.get(mesh).commands, f.baseline.models.get(mesh).commands)
    const complete = f.picking.models.get(mesh)
    // Same authored scene after normal unchanged frame producers and camera update.
    base.render(); api.updateVehiclesFrame(scene)
    scene.treeSignature = world.trees.map(tree => tree.logs >= 1 ? '1' : '0').join('')
    updateDecorationsFrame(scene); api.updateShrinesFrame(scene)
    update(f.view, { x: origin.x, z: origin.z })
    compare(f, far)
    compare(f, hitPoint(f), { built: true })
    assert.deepEqual(f.picking.models.get(mesh).commands, f.baseline.models.get(mesh).commands)
    assert.ok(complete.commands.length > 0)
  }
  for (const mesh of shrineMeshes.filter(mesh => mesh.parent.visible)) {
    f.mesh = mesh; compare(f, far, { built: true })
  }
})

test('all authored camera presets, resize/wrap and same-frame pointer cache retain query parity', t => {
  const f = fixture(t)
  for (let index = 0; index < 50; index++) {
    f.view.update(640 + index * 3, 480 + index, { x: index % 2 ? 256 : 0, z: index % 3 ? 0 : -256 }, index * Math.PI / 19, index, false, 800, cameraPreset(Math.floor(index / 5), index % 5))
    compare(f, far)
    const expected = new BaselinePicking(f.scene).model(f.mesh, 'edge').at(-1).bounds
    const event = { clientX: expected.x + Math.trunc(expected.width / 2), clientY: expected.y + Math.trunc(expected.height / 2) }
    compare(f, event)
    const count = enclosures, record = f.picking.models.get(f.mesh), partial = f.runtime.bounds.get(f.mesh)
    assert.equal(f.picking.pick(event), f.baseline.pick(event))
    assert.equal(enclosures, count); assert.equal(f.picking.models.get(f.mesh), record); assert.equal(f.runtime.bounds.get(f.mesh), partial)
  }
})
