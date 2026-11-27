import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('authored Mission 7 builds the ordinary Vault reward marker at occupied socket 1', async () => {
  const { createWorld, nativePosition, makeShrines } = await loadSceneFixture()
  const world = createWorld(7)
  const shrine = world.shrines.find(s => s.kind === 'vault' && s.reward === 'invisibility')
  assert.deepEqual([shrine.id, shrine.model, shrine.angle], [1, 154, Math.PI])
  const load = THREE.TextureLoader.prototype.load
  const objects = new THREE.Group()
  const shrineMeshes = new Map()
  const observed = new Map()
  const texture = new THREE.Texture()
  // Native harness supplied terrain height 200 and final graphics consumers.
  const scene = {
    world: { ...world, shrines: [shrine] }, objects, shrineMeshes,
    locate: (group, p, height) => observed.set(group, { p, height }),
    orientModel: () => {}, y: () => 200 / 45,
  }
  try {
    THREE.TextureLoader.prototype.load = () => texture
    makeShrines(scene)
    const marker = shrineMeshes.get(shrine.id)?.g.userData.vaultKnowledgeMarker
    assert.ok(marker && marker.parent === objects)
    const { p, height } = observed.get(marker)
    const { x, y } = nativePosition(world, p)
    assert.deepEqual([x, y, p.heightOffset], [26880, 14080, 1072])
    assert.ok(Math.abs(height * 45 - 1272) < 1e-9)
  } finally {
    THREE.TextureLoader.prototype.load = load
    objects.traverse(o => {
      o.geometry?.dispose()
      o.material?.dispose()
    })
    texture.dispose()
  }
})
