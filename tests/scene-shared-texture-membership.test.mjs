import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadTexture, releaseGroup, retryFailedTexture } from '../app/scene-assets.ts'

test('repeated retirement reuses texture membership until an explicit cache mutation', () => {
  const SavedSet = globalThis.Set, SavedWeakSet = globalThis.WeakSet
  const oldLoad = THREE.TextureLoader.prototype.load
  const owners = new Map()
  THREE.TextureLoader.prototype.load = (url, success, progress, fail) => {
    const texture = new THREE.Texture()
    owners.set(url, { texture, success, fail })
    return texture
  }
  const shared = loadTexture('ram21-test').texture
  let snapshots = 0
  function inspect(values) {
    if (Array.isArray(values) && values.includes(shared)) snapshots++
  }
  globalThis.Set = class extends SavedSet {
    constructor(values) { inspect(values); super(values) }
  }
  globalThis.WeakSet = class extends SavedWeakSet {
    constructor(values) { inspect(values); super(values) }
  }
  const retire = tex => releaseGroup(new THREE.Sprite(new THREE.SpriteMaterial({ map: tex })))
  let sharedDisposals = 0, ownedDisposals = 0, replacementDisposals = 0
  shared.addEventListener('dispose', () => sharedDisposals++)
  const owned = new THREE.Texture()
  owned.addEventListener('dispose', () => ownedDisposals++)
  try {
    retire(shared)
    retire(shared)
    retire(owned)
    assert.equal(sharedDisposals, 0)
    assert.equal(ownedDisposals, 1)
    const initialSnapshots = snapshots
    const pending = loadTexture('ram21-retry').texture
    retire(pending)
    owners.get('/original/ram21-retry.png').fail(new Error('test failure'))
    const replacement = retryFailedTexture('ram21-retry').texture
    replacement.addEventListener('dispose', () => replacementDisposals++)
    assert.notEqual(replacement, pending)
    retire(replacement)
    retire(replacement)
    assert.equal(replacementDisposals, 0)
    assert.equal(initialSnapshots, 1, 'only one texture membership snapshot for three retirements')
    assert.equal(snapshots, 3, 'one new snapshot for each changed cache epoch')
  } finally {
    THREE.TextureLoader.prototype.load = oldLoad
    globalThis.Set = SavedSet
    globalThis.WeakSet = SavedWeakSet
  }
})

test('reentrant insertion preserves the outer retirement snapshot', () => {
  const oldLoad = THREE.TextureLoader.prototype.load
  THREE.TextureLoader.prototype.load = () => new THREE.Texture()
  const trigger = new THREE.Texture()
  const tail = new THREE.Sprite(new THREE.SpriteMaterial())
  const g = new THREE.Group()
  g.add(new THREE.Sprite(new THREE.SpriteMaterial({ map: trigger })), tail)
  let observed = 0
  trigger.addEventListener('dispose', () => {
    const added = loadTexture('ram21-reentrant').texture
    added.addEventListener('dispose', () => observed++)
    // The nested call sees the new owner; the enclosing retirement must
    // still use its entry-time snapshot, matching prior disposal semantics.
    releaseGroup(new THREE.Sprite(new THREE.SpriteMaterial({ map: added })))
    assert.equal(observed, 0)
    tail.material.map = added
  })
  try {
    releaseGroup(g)
    assert.equal(observed, 1)
    releaseGroup(new THREE.Sprite(new THREE.SpriteMaterial({ map: tail.material.map })))
    assert.equal(observed, 1)
  } finally {
    THREE.TextureLoader.prototype.load = oldLoad
  }
})
