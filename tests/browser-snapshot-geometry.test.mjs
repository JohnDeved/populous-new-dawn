import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { createSnapshotGeometryObserver, snapshotGeometryContract } from '../scripts/browser-performance/snapshot-geometry.mjs'

function fixture() {
  const geometry = new THREE.BufferGeometry(), count = 128 * 128 * 6
  const positions = new Float32Array(count * 3)
  positions.set([0, 0, 0, 1, 0, 0, 0, 0, 1, 2, 0, 0])
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array([0, 1, 2, 1, 2, 3, 10, 11, 12]), 1))
  geometry.setDrawRange(0, 6); geometry.computeBoundingBox()
  const terrain = new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial(), 9)
  terrain.count = 1
  terrain.setMatrixAt(0, new THREE.Matrix4())
  terrain.userData = { nativeRelative: true, painterGround: true, terrainGrid: true }
  const ground = new THREE.Group(), root = new THREE.Scene()
  root.add(ground); ground.add(terrain); root.updateMatrixWorld(true)
  return { terrain, ground, scene: root, world: {}, view: {}, disposed: false }
}
const signature = observer => {
  const buffer = new Float64Array(observer.witnessWidth)
  assert.equal(observer.writeWitness(buffer, 0), buffer.length)
  return [...buffer]
}

test('self-contained terrain observer produces bounded content identity without page hooks or consumer calls', async () => {
  const scene = fixture(), rebuilt = (0, eval)(`(${createSnapshotGeometryObserver.toString()})`)
  const observer = rebuilt(scene), before = JSON.stringify(scene.terrain.geometry.toJSON())
  for (const owner of [scene.terrain, scene.ground, scene.scene])
    owner.updateWorldMatrix = owner.updateMatrixWorld = owner.traverseVisible = () => { throw Error('consumer/update called') }
  const one = await observer.captureBoundary(), two = await observer.captureBoundary()
  assert.equal(one.fingerprintSha256, two.fingerprintSha256)
  assert.deepEqual(one.witness, two.witness)
  assert.equal(JSON.stringify(scene.terrain.geometry.toJSON()), before)
  assert.equal(observer.witnessWidth, observer.witnessFields.length)
  assert.ok(observer.witnessWidth < 128)
  assert.ok(one.timestampMs >= one.observationStartTimestampMs)
  assert.equal(one.metadata.index.submittedCount, 6)
  assert.match(snapshotGeometryContract.limit, /Transient unversioned writes/)
})

test('fixed-size witness fills caller storage without allocating/traversing geometry', () => {
  const scene = fixture(), observer = createSnapshotGeometryObserver(scene)
  const buffer = new Float64Array(observer.witnessWidth + 4).fill(-1)
  const position = scene.terrain.geometry.attributes.position
  position.array.every = position.array.map = position.array.slice = () => { throw Error('per-frame geometry traversal') }
  assert.equal(observer.writeWitness(buffer, 2), observer.witnessWidth + 2)
  assert.equal(buffer[0], -1); assert.equal(buffer[1], -1); assert.equal(buffer.at(-1), -1)
  assert.equal(buffer[2], 1)
  assert.throws(() => observer.writeWitness(new Float64Array(1)), /buffer is too small/)
})

test('same content across process-local identities/versions has same cross-arm fingerprint', async () => {
  const a = fixture(), b = fixture()
  b.terrain.geometry.attributes.position.needsUpdate = true
  b.terrain.geometry.index.needsUpdate = true
  b.terrain.instanceMatrix.needsUpdate = true
  const left = await createSnapshotGeometryObserver(a).captureBoundary()
  const right = await createSnapshotGeometryObserver(b).captureBoundary()
  assert.equal(left.fingerprintSha256, right.fingerprintSha256)
  assert.notDeepEqual(left.witness, right.witness)
})

test('persistent unversioned consumed position/index/instance writes change boundary hash', async () => {
  for (const target of ['position', 'index', 'instance']) {
    const scene = fixture(), observer = createSnapshotGeometryObserver(scene), before = await observer.captureBoundary()
    if (target === 'position') scene.terrain.geometry.attributes.position.array[0] = 0.5
    if (target === 'index') scene.terrain.geometry.index.array[0] = 3
    if (target === 'instance') scene.terrain.instanceMatrix.array[12] = 256
    assert.deepEqual(signature(observer), before.witness, 'Unversioned bytes are intentionally not read per frame')
    assert.notEqual((await observer.captureBoundary()).fingerprintSha256, before.fingerprintSha256, target)
  }
})

test('unused index tail and inactive instance slots are excluded from actual-submission hash', async () => {
  const scene = fixture(), observer = createSnapshotGeometryObserver(scene), before = await observer.captureBoundary()
  scene.terrain.geometry.index.array[8] = 90000
  scene.terrain.instanceMatrix.array[16 + 12] = 512
  assert.equal((await observer.captureBoundary()).fingerprintSha256, before.fingerprintSha256)
})

test('version/count/transform/reference changes are witnessed and invalid bindings fail closed', async () => {
  const scene = fixture(), observer = createSnapshotGeometryObserver(scene), before = signature(observer)
  scene.terrain.geometry.index.needsUpdate = true
  assert.notDeepEqual(signature(observer), before)
  scene.terrain.geometry.drawRange.count = 3
  assert.notDeepEqual(signature(observer), before)
  scene.terrain.matrixWorld.elements[12] = 2
  assert.notDeepEqual(signature(observer), before)
  scene.terrain.geometry.attributes.position.array = scene.terrain.geometry.attributes.position.array.slice()
  assert.equal(signature(observer)[0], 0)
  await assert.rejects(observer.captureBoundary(), /binding\/visibility\/shape changed/)
})

test('unsupported structure, missing real bounds, drawRange start, malformed index, and NaN reject admission', async () => {
  const missing = fixture(); missing.terrain.geometry.boundingBox = null
  assert.throws(() => createSnapshotGeometryObserver(missing), /real-query bounding box/)
  const child = fixture(); child.terrain.add(new THREE.Object3D())
  assert.throws(() => createSnapshotGeometryObserver(child), /hierarchy/)
  for (const change of [s => { s.terrain.geometry.drawRange.start = 1 }, s => { s.terrain.count = 10 },
    s => { s.terrain.geometry.index.array[0] = 128 * 128 * 6 },
    s => { s.terrain.geometry.attributes.position.array[0] = NaN }]) {
    const scene = fixture(), observer = createSnapshotGeometryObserver(scene)
    change(scene)
    await assert.rejects(observer.captureBoundary(), /Snapshot terrain geometry/)
  }
})

test('different draw prefix, active instances, or effective transform changes cross-arm fingerprint', async () => {
  for (const change of [s => { s.terrain.geometry.drawRange.count = 3 }, s => { s.terrain.count = 2 },
    s => { s.terrain.matrixWorld.elements[12] = 1 }, s => { s.ground.userData.nativeHeading = 512 }]) {
    const scene = fixture(), observer = createSnapshotGeometryObserver(scene), before = await observer.captureBoundary()
    change(scene)
    assert.notEqual((await observer.captureBoundary()).fingerprintSha256, before.fingerprintSha256)
  }
})


test('own consumer overrides reject admission and later accessor changes invalidate the binding witness', async () => {
  for (const target of ['getAttribute', 'getIndex', 'getMatrixAt']) {
    const scene = fixture(), owner = target === 'getMatrixAt' ? scene.terrain : scene.terrain.geometry
    owner[target] = () => { throw Error('must not be invoked') }
    assert.throws(() => createSnapshotGeometryObserver(scene), /own consumer method override/)
  }
  for (const target of ['getAttribute', 'getIndex', 'getMatrixAt']) {
    const scene = fixture(), observer = createSnapshotGeometryObserver(scene)
    const owner = target === 'getMatrixAt' ? scene.terrain : scene.terrain.geometry
    owner[target] = () => { throw Error('must not be invoked') }
    assert.equal(signature(observer)[0], 0)
    await assert.rejects(observer.captureBoundary(), /binding\/visibility\/shape changed/)
  }
})

test('inherited consumer source difference cannot hide behind identical raw geometry bytes', async () => {
  const a = fixture(), b = fixture()
  const prototype = Object.create(Object.getPrototypeOf(b.terrain.geometry))
  prototype.getIndex = function getIndex() { return this.attributes.unobservedIndex }
  Object.setPrototypeOf(b.terrain.geometry, prototype)
  const left = await createSnapshotGeometryObserver(a).captureBoundary()
  const right = await createSnapshotGeometryObserver(b).captureBoundary()
  assert.equal(left.positionSha256, right.positionSha256)
  assert.equal(left.indexSha256, right.indexSha256)
  assert.equal(left.instancesSha256, right.instancesSha256)
  assert.notEqual(left.consumerMethodsSha256, right.consumerMethodsSha256)
  assert.notEqual(left.fingerprintSha256, right.fingerprintSha256)
})
