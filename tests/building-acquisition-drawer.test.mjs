import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { BuildingAcquisitionTriangleSurface } from '../app/building-acquisition-drawer.ts'
import { collectBuildingAcquisitionTriangles } from '../app/building-acquisition-triangles.ts'

// Real Three geometry/material/texture objects, supplied GPU renderer stub.
// These tests prove buffer, shader and ownership contracts, not rendered pixels.
function setup() {
  const calls = [],
    snapshots = [],
    canvas = {},
    atlas = new THREE.Texture({ width: 256, height: 1024 }),
    renderer = {
      domElement: canvas,
      setClearColor: (...args) => calls.push(['clearColor', ...args]),
      setPixelRatio: (...args) => calls.push(['ratio', ...args]),
      setSize: (...args) => calls.push(['size', ...args]),
      clear: () => calls.push(['clear']),
      render(scene, camera) {
        const mesh = scene.children[0]
        snapshots.push({
          mesh,
          camera,
          attributes: Object.fromEntries(
            Object.entries(mesh.geometry.attributes).map(([name, attribute]) => [
              name,
              Array.from(attribute.array),
            ])
          ),
        })
      },
      dispose: () => calls.push(['dispose']),
      forceContextLoss: () => calls.push(['loseContext']),
    },
    surface = new BuildingAcquisitionTriangleSurface(atlas, () => renderer)
  return { surface, renderer, atlas, calls, snapshots, canvas }
}
const triangles = (face = 0) =>
  collectBuildingAcquisitionTriangles(
    {
      whole: false,
      submissions: [
        {
          face,
          transformed: [
            [0, 0, 0],
            [100, 0, 0],
            [100, 100, 0],
            [0, 100, 0],
          ],
          projected: [
            [10, 10],
            [110, 10],
            [110, 110],
            [10, 110],
          ],
          flight: 0,
        },
      ],
    },
    { width: 640, height: 480 }
  )

test('detached pass preserves painter buffers, affine W1, encoded RGB and strict cutout', () => {
  const { surface, renderer, atlas, snapshots, canvas } = setup(),
    commands = [...triangles(), ...triangles(2)]
  assert.equal(surface.draw(commands, 640, 480, 2), canvas)
  const { mesh, attributes } = snapshots[0],
    material = mesh.material,
    owned = material.uniforms.atlas.value
  assert.equal(renderer.sortObjects, false)
  assert.equal(mesh.frustumCulled, false)
  assert.equal(mesh.geometry.drawRange.count, 12)
  assert.deepEqual(
    attributes.position.slice(0, 36),
    commands.flatMap(t => t.points.flatMap(p => [p.x, p.y, 0]))
  )
  assert.deepEqual(attributes.alphaCutout.slice(0, 12), [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0])
  assert.deepEqual(
    attributes.faceLight.slice(0, 12),
    commands.flatMap(t => Array(3).fill(Math.fround(t.diffuse / 255)))
  )
  assert.equal(material.depthTest, false)
  assert.equal(material.depthWrite, false)
  assert.equal(material.blending, THREE.NoBlending)
  assert.equal(material.toneMapped, false)
  assert.match(material.vertexShader, /0\.0, 1\.0\)/)
  assert.match(material.fragmentShader, /texel\.a <= 127\.0 \/ 255\.0\) discard/)
  assert.match(material.fragmentShader, /vec4\(texel\.rgb \* diffuse, 1\.0\)/)
  assert.notEqual(owned, atlas)
  assert.equal(owned.source, atlas.source)
  assert.equal(owned.colorSpace, THREE.NoColorSpace)
  assert.equal(owned.minFilter, THREE.LinearFilter)
  assert.equal(owned.magFilter, THREE.LinearFilter)
  assert.equal(owned.generateMipmaps, false)
  assert.equal(owned.anisotropy, 1)
  surface.dispose()
})

test('repeat draws reuse resources, clear stale geometry and never mutate commands', () => {
  const { surface, calls, snapshots } = setup(),
    commands = triangles(),
    before = structuredClone(commands)
  for (const triangle of commands) {
    triangle.points.forEach(Object.freeze)
    Object.freeze(triangle.points)
    Object.freeze(triangle)
  }
  Object.freeze(commands)
  surface.draw(commands, 640, 480)
  surface.draw(commands, 640, 480)
  assert.equal(snapshots[0].mesh, snapshots[1].mesh)
  assert.deepEqual(snapshots[0].attributes, snapshots[1].attributes)
  assert.deepEqual(commands, before)
  assert.equal(calls.filter(([name]) => name === 'size').length, 1)
  surface.draw(commands, 800, 600, 2)
  assert.deepEqual(snapshots.at(-1).mesh.material.uniforms.shell.value.toArray(), [800, 600])
  surface.draw([], 800, 600, 2)
  assert.equal(snapshots.at(-1).mesh.geometry.drawRange.count, 0)
  assert.equal(snapshots.length, 3, 'empty draw clears without submitting old triangles')
  assert.equal(calls.filter(([name]) => name === 'clear').length, 4)
  surface.dispose()
})

test('overlay disposal releases only its own texture, geometry, material and context once', () => {
  const { surface, atlas, snapshots, calls } = setup()
  surface.draw(triangles(), 640, 480)
  const { mesh } = snapshots[0],
    disposed = []
  atlas.addEventListener('dispose', () => disposed.push('shared'))
  mesh.geometry.addEventListener('dispose', () => disposed.push('geometry'))
  mesh.material.addEventListener('dispose', () => disposed.push('material'))
  mesh.material.uniforms.atlas.value.addEventListener('dispose', () =>
    disposed.push('owned texture')
  )
  surface.dispose()
  surface.dispose()
  assert.deepEqual(disposed, ['geometry', 'material', 'owned texture'])
  assert.equal(calls.filter(([name]) => name === 'dispose').length, 1)
  assert.equal(calls.filter(([name]) => name === 'loseContext').length, 1)
  assert.throws(() => surface.draw([], 640, 480), /disposed/)
})

test('Temple mode32 is fullbright cutout and bank replacement owns only its wrapper', () => {
  const { surface, atlas, snapshots, calls } = setup(),
    p = new THREE.Texture({ width: 256, height: 1024 }),
    disposed = []
  const command = collectBuildingAcquisitionTriangles(
    {
      whole: false,
      submissions: [
        {
          face: 127,
          transformed: [
            [0, 0, 500],
            [100, 0, 500],
            [100, 100, 500],
            [0, 100, 500],
          ],
          projected: [
            [10, 10],
            [110, 10],
            [110, 110],
            [10, 110],
          ],
          flight: 0,
        },
      ],
    },
    { width: 640, height: 480, model: 95, templeTile: 100 }
  )
  surface.draw(triangles(), 640, 480)
  const first = snapshots[0].mesh.material.uniforms.atlas.value
  first.addEventListener('dispose', () => disposed.push('old wrapper'))
  atlas.addEventListener('dispose', () => disposed.push('shared c'))
  p.addEventListener('dispose', () => disposed.push('shared p'))
  surface.setAtlas(p)
  surface.draw(command, 640, 480)
  const second = snapshots.at(-1).mesh.material.uniforms.atlas.value
  assert.notEqual(second, first)
  assert.equal(second.source, p.source)
  assert.deepEqual(snapshots.at(-1).attributes.alphaCutout.slice(0, 6), Array(6).fill(1))
  assert.deepEqual(snapshots.at(-1).attributes.faceLight.slice(0, 6), Array(6).fill(1))
  surface.setAtlas(p)
  assert.equal(snapshots.at(-1).mesh.material.uniforms.atlas.value, second)
  assert.deepEqual(disposed, ['old wrapper'])
  assert.equal(calls.filter(([kind]) => kind === 'size').length, 1)
  surface.dispose()
  assert.deepEqual(disposed, ['old wrapper'])
})
