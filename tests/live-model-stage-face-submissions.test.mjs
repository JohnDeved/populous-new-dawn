import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import facing from './fixtures/model-facing.json' with { type: 'json' }

const basis = [16384, 0, 0, 0, 16384, 0, 0, 0, 16384]
const projection = {
  matrix: basis, curvature: 0, depth: 4096, perspective: 12, scale: 65536,
  width: 1240, height: 1000, centerX: 620, centerY: 500,
  fractionX: 0, fractionY: 0, pixelScaleX: 1, pixelScaleY: 1,
}
function witness(mesh, painter, scene, fixture) {
  // One supplied model face at an ordinary constructed mesh's authored stage.
  mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(fixture.raw.flatMap(
    v => v.map((x, i) => x * (i === 2 ? -1 : 1) / (mesh.userData.nativeScale * 3)),
  ), 3))
  painter.update(scene, { setTransparentSort() {} })
  return Number(!!painter.command(mesh, 0))
}

for (const [label, stages, side] of [
  ['completed', [4], THREE.BackSide],
  ['under-construction', [0, 1, 2, 3], THREE.DoubleSide],
]) {
  test(label + ' native model material and CPU painter preserve the sampled native face admission', async t => {
    await loadSceneFixture()
    const { nativeModel } = await import('../app/scene-assets.ts')
    const { Painter } = await import('../app/painter.ts')
    let visited = 0
    const texture = new THREE.Texture()
    t.mock.method(THREE.TextureLoader.prototype, 'load', () => texture)
    try {
      for (const stage of stages) {
        const mesh = nativeModel(79, 2, stage)
        const original = mesh.geometry
        mesh.geometry = new THREE.BufferGeometry()
        mesh.userData.nativeSize = 256
        const group = new THREE.Group(), scene = new THREE.Scene()
        group.add(mesh)
        scene.add(group)
        scene.updateMatrixWorld(true)
        const painter = new Painter({
          center: { x: 0, y: 0 }, materials: new Set([mesh.material]),
          uniforms: { nativeBasis: { value: basis } },
          projection, visible: () => true, relative: () => ({ x: 0, y: 0, z: 0 }),
        })
        try {
          assert.equal(mesh.material.side, side)
          for (const c of facing.cases.filter(c => c.stage === stage)) {
            assert.equal(witness(mesh, painter, scene, c), c.submitted, JSON.stringify(c))
            visited++
          }
        } finally {
          painter.dispose()
          original.dispose()
          mesh.geometry.dispose()
          mesh.material.dispose()
        }
      }
    } finally {
      texture.dispose()
    }
    assert.equal(visited, stages.length * 8)
  })
}
