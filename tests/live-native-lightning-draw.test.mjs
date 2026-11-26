import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

const point = (x, y, h = 0) => ({ x: 2048 + 256 * x, y: -2048 + 256 * y, h })
const parent = { from: point(10, 13), to: point(40, 30) }
const culled = { from: point(12, 20, 45), to: point(39, 46, 45) }

async function fixture(segments) {
  await loadSceneFixture()
  const api = await import('../app/scene-effects.ts')
  const lightning = { segments }
  const scene = {
    container: { clientWidth: 128, clientHeight: 128 },
    view: {
      project: (world, height) => ({
        screenX: world.x, screenY: -world.z, flags: height ? 0x80000001 : 0,
      }),
    },
    world: { effects: [{ lightning }], cosmeticRandom: { randomState: 1 }, randomState: 91 },
  }
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial())
  return { scene, mesh, lightning, ...api }
}

test('00475350 live draw visit rolls a visible branch stream without spending RNG on culled bolts', async () => {
  const { scene, mesh, lightning, lightningDrawVisit, animateLightning } =
    await fixture([culled, parent])
  try {
    lightningDrawVisit(scene)
    assert.equal(scene.world.cosmeticRandom.randomState, 0xa56708bf, 'one recursion stream only')
    assert.equal(scene.world.randomState, 91, 'simulation RNG untouched')
    animateLightning(scene, mesh, lightning)
    const alpha = mesh.geometry.getAttribute('opacity')
    const lines = Array.from({ length: alpha.count / 6 },
      (_, i) => Math.round(alpha.getX(i * 6) * 255))
    assert.deepEqual(lines, [
      200, 112, 98, 98, 98, 98, 98, 98, 98, 98, 85, 85, 74, 74, 74, 85, 85, 85, 85, 85, 85,
    ])
    animateLightning(scene, mesh, lightning)
    assert.equal(scene.world.cosmeticRandom.randomState, 0xa56708bf, 'mesh update does not reroll')
  } finally {
    mesh.geometry.dispose()
    mesh.material.dispose()
  }
})

test('00516500 live bolt mesh uses ceil corners for a diagonal and swapped endpoints', async () => {
  const { scene, mesh, lightning, animateLightning } = await fixture([parent])
  const positions = () => {
    const a = mesh.geometry.getAttribute('position')
    return Array.from({ length: a.count }, (_, i) => [
      (a.getX(i) + 1) * 64,
      (1 - a.getY(i)) * 64,
    ])
  }
  try {
    // Independently of branch visits, admit a single parent-only segment.
    animateLightning(scene, mesh, lightning)
    assert.deepEqual(positions(), [[9,17], [39,34], [42,27], [9,17], [42,27], [12,10]])
    lightning.segments = [{ from: parent.to, to: parent.from }]
    animateLightning(scene, mesh, lightning)
    assert.deepEqual(positions(), [[42,27], [12,10], [9,17], [42,27], [9,17], [39,34]])
    assert.equal(scene.world.cosmeticRandom.randomState, 1)
  } finally {
    mesh.geometry.dispose()
    mesh.material.dispose()
  }
})
