import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import original from '../app/original-angel.json' with { type: 'json' }

// Actual resource, material, lighting and live effect callers. Texture loading
// is supplied; these attribute assertions do not claim browser/GPU pixel parity.
const originalLoad = THREE.TextureLoader.prototype.load
THREE.TextureLoader.prototype.load = function (url) {
  const texture = new THREE.Texture()
  texture.image = { src: url }
  return texture
}
await loadSceneFixture()
const { nativeModel, nativeModels, updateModelLighting, releaseGroup } = await import('../app/scene-assets.ts')
const { environmentForHeader } = await import('../app/world-environment.ts')
const { angelModelResource, makeAngelMeshes, drawAngelMeshes } = await import('../app/scene-angel.ts')
const { createAngelState } = await import('../app/angel.ts')
const { advanceAngelPresentation, requestAngelBase, angelPosePositions } = await import('../app/angel-presentation.ts')
const { makeFx, animateFx, updateEffectsFrame } = await import('../app/scene-effects.ts')
const { GameScene } = await import('../app/scene.ts')
const environment = environmentForHeader({ landscapeBank: 12, objectBank: 2 })
test.after(() => { THREE.TextureLoader.prototype.load = originalLoad })

test('all 1640 existing native-model outputs are byte-identical to the pre-refactor baseline', () => {
  // Captured BEFORE extraction of the resource-taking factory, from
  // 80dfb6f7e689110a091707c765f35d36c2bcff39. Includes every existing model,
  // bank2/6, stage0..4, ordinary/Temple material, transformed native lighting,
  // all attribute arrays, UVs, modes, biases, scales and compiled shader text.
  const hash = createHash('sha256')
  hash.update('[')
  let count = 0
  for (const bank of [2, 6])
    for (const id of Object.keys(nativeModels).map(Number))
      for (const stage of [0, 1, 2, 3, 4])
        for (const animated of [false, true]) {
          const mesh = nativeModel(id, 2, stage, animated, environmentForHeader({ landscapeBank: 12, objectBank: bank }))
          const group = new THREE.Group()
          Object.assign(group.userData, { nativeHeading: 513, nativeTilt: 45, nativeRoll: -56 })
          group.add(mesh)
          updateModelLighting(mesh)
          const shader = { uniforms: {}, vertexShader: '#include <uv_vertex>\n#include <begin_vertex>', fragmentShader: '#include <colorspace_fragment>' }
          mesh.material.onBeforeCompile(shader)
          const snapshot = {
            bank, id, stage, animated,
            attributes: Object.fromEntries(Object.entries(mesh.geometry.attributes).map(([key, value]) => [key, { itemSize: value.itemSize, array: [...value.array] }])),
            scale: mesh.scale.toArray(),
            material: { side: mesh.material.side, alphaTest: mesh.material.alphaTest, defines: mesh.material.defines, map: mesh.material.map.image.src, program: mesh.material.customProgramCacheKey() },
            shader,
          }
          if (count++) hash.update(',')
          hash.update(JSON.stringify(snapshot))
          releaseGroup(group)
        }
  hash.update(']')
  assert.equal(count, 1640)
  assert.equal(hash.digest('hex'), '43f9090e1c0a31160302635aa5801d84da1c151848619c55736d410771c95e7f')
})

test('owner resources translate only flagged tiles and preserve every local UV coordinate', () => {
  for (const bank of [2, 6])
    for (const base of [62, 69])
      for (const owner of [-1, 0, 1, 2, 3]) {
        const resource = angelModelResource(base, owner, bank), source = original.bases[base].model
        assert.equal(resource, angelModelResource(base, owner, bank), 'immutable resource is cached')
        assert.deepEqual(resource.data.p, source.p)
        for (const field of ['scale', 'faces', 'normals', 'modes', 'biases'])
          assert.deepEqual(resource.data[field], source[field])
        let vertex = 0
        for (let face = 0; face < source.tiles.length; face++) {
          const from = source.tiles[face], to = resource.data.tiles[face]
          assert.equal(to, original.tribeTiles.includes(from) ? from + owner : from)
          const count = source.faces[face * 2] === 3 ? 3 : 6
          for (let corner = 0; corner < count; corner++) {
            const i = (vertex + corner) * 2
            assert.ok(Math.abs((resource.data.uv[i] * 8 - (to & 7)) - (source.uv[i] * 8 - (from & 7))) < 1e-12)
            assert.ok(Math.abs(((1 - resource.data.uv[i + 1]) * 32 - (to >> 3)) - ((1 - source.uv[i + 1]) * 32 - (from >> 3))) < 1e-12)
          }
          vertex += count
        }
      }
})

test('native polygon encoding selects neutral and four tribe atlas tiles without a second +1', () => {
  // 004718c0 and 00471a80 both encode tile + 1; only the latter adds owner.
  const pairs = [[161, 169], [162, 170], [163, 171], [164, 172], [165, 173]]
  for (const base of [62, 69])
    for (const owner of [-1, 0, 1, 2, 3]) {
      const source = original.bases[base].model
      const actual = angelModelResource(base, owner, 2).data.tiles
      for (const [index, tile] of source.tiles.entries()) {
        if (tile === 162) assert.equal(actual[index], pairs[owner + 1][0])
        if (tile === 170) assert.equal(actual[index], pairs[owner + 1][1])
      }
    }
})

test('two Angels own independent mutable geometry and consume only displayed pose state', () => {
  const a = createAngelState(), b = createAngelState()
  const left = makeAngelMeshes(0, environment), right = makeAngelMeshes(0, environment)
  try {
    drawAngelMeshes(left, a, 0, environment)
    drawAngelMeshes(right, b, 0, environment)
    const first = left.children[1], other = right.children[1]
    assert.notEqual(first.geometry, other.geometry)
    assert.notEqual(first.geometry.getAttribute('position').array, other.geometry.getAttribute('position').array)
    assert.equal(first.userData.nativeResource, other.userData.nativeResource)
    assert.equal(first.material.map, other.material.map)
    const originalOther = [...other.geometry.getAttribute('position').array]
    advanceAngelPresentation(a.presentation)
    advanceAngelPresentation(a.presentation)
    const before = structuredClone(a), version = first.geometry.getAttribute('position').version
    drawAngelMeshes(left, a, 0, environment)
    assert.ok(first.geometry.getAttribute('position').version > version)
    assert.deepEqual([...first.geometry.getAttribute('position').array], [...angelPosePositions(a.presentation.displayed)])
    assert.deepEqual([...other.geometry.getAttribute('position').array], originalOther)
    assert.ok(first.geometry.boundingSphere.radius > 0)
    const updatedVersion = first.geometry.getAttribute('position').version
    for (let i = 0; i < 20; i++) drawAngelMeshes(left, a, 0, environment)
    assert.deepEqual(a, before)
    assert.equal(first.geometry.getAttribute('position').version, updatedVersion)
    for (let i = 0; i < 6; i++) requestAngelBase(a.presentation, 62)
    advanceAngelPresentation(a.presentation)
    drawAngelMeshes(left, a, 0, environment)
    assert.equal(left.children[0].visible, true)
    assert.equal(left.children[1].visible, false)
    assert.deepEqual([...left.children[0].geometry.getAttribute('position').array], [...angelPosePositions(a.presentation.displayed)])
  } finally {
    releaseGroup(left)
    releaseGroup(right)
  }
})

test('owner changes and removal dispose owned resources but never cached atlas textures', () => {
  const state = createAngelState(), group = makeAngelMeshes(0, environment)
  const old = [...group.children], counts = { geometry: 0, material: 0, texture: 0 }
  for (const mesh of old) {
    mesh.geometry.addEventListener('dispose', () => counts.geometry++)
    mesh.material.addEventListener('dispose', () => counts.material++)
  }
  const texture = old[0].material.map
  const disposed = () => counts.texture++
  texture.addEventListener('dispose', disposed)
  try {
    drawAngelMeshes(group, state, 3, environment)
    assert.deepEqual(counts, { geometry: 2, material: 2, texture: 0 })
    assert.equal(group.userData.owner, 3)
    assert.ok(group.children[0].userData.nativeResource.data.tiles.includes(165))
    assert.equal(group.children[0].material.map, texture)
    releaseGroup(group)
    assert.equal(counts.texture, 0)
    const next = makeAngelMeshes(0, environment)
    drawAngelMeshes(next, state, 0, environment)
    assert.equal(next.children[1].material.map, texture)
    assert.deepEqual([...next.children[1].geometry.getAttribute('position').array], [...angelPosePositions(state.presentation.displayed)])
    releaseGroup(next)
  } finally {
    texture.removeEventListener('dispose', disposed)
  }
})

test('actual effect callers use original meshes, heading and scale without a Warrior layer or render clock', () => {
  const state = createAngelState(), effect = { angel: state, team: 'yellow', x: 0, z: 0, height: 5, age: 0, kind: 'angel' }
  const scene = { environment, world: {}, locate() {}, animatePerson() { assert.fail('Angel cannot enter a follower layer renderer') } }
  const group = makeFx(scene, effect)
  try {
    state.heading = Math.PI - 513 * Math.PI / 1024
    state.presentation.displayed.scale = 70
    const before = structuredClone(effect)
    animateFx(scene, group, effect)
    assert.equal(group.name, 'angel-of-death')
    assert.equal(group.children.length, 2)
    assert.equal(group.children[1].userData.nativeModel, 69)
    assert.equal(group.children[1].userData.nativeSize, 70)
    assert.equal(group.userData.layers, undefined)
    assert.equal(group.userData.directions, undefined)
    assert.equal(group.userData.draw, undefined)
    assert.deepEqual([group.userData.nativeHeading, group.userData.nativeTilt, group.userData.nativeRoll], [513, 0, 0])
    assert.equal(group.children[1].material.map.image.src, '/original/atlas.png')
    assert.deepEqual(effect, before)
  } finally {
    releaseGroup(group)
  }
})

test('ordinary effects-frame caller converts height once, preserves position and releases removed Angels', () => {
  const effect = { id: 1001, angel: createAngelState(), team: 'red', x: -127.5, z: 126, height: 7.2, age: 0, kind: 'angel' }
  const scene = {
    environment, world: { effects: [effect] }, ground: new THREE.Group(), fxMeshes: new Map(),
    locate: GameScene.prototype.locate,
    releaseGroup, projectileMotion: { position() {} },
    animatePerson() { assert.fail('no Warrior rendering') },
    makeFx(effect) { return makeFx(this, effect) },
    animateFx(group, effect) { return animateFx(this, group, effect) },
  }
  updateEffectsFrame(scene)
  const group = scene.fxMeshes.get(1001), mesh = group.children[1]
  assert.deepEqual(group.position.toArray(), [-127.5, Math.round(7.2 * 45) / 128, 126])
  assert.equal(group.parent, scene.ground)
  assert.equal(mesh.userData.nativeResource.data.tiles.includes(163), true)
  let geometries = 0, materials = 0
  for (const child of group.children) {
    child.geometry.addEventListener('dispose', () => geometries++)
    child.material.addEventListener('dispose', () => materials++)
  }
  scene.world.effects = []
  updateEffectsFrame(scene)
  assert.equal(scene.fxMeshes.size, 0)
  assert.equal(group.parent, null)
  assert.deepEqual([geometries, materials], [2, 2])
})


test('browser evidence UV oracle matches actual native mesh sampling, not raw imported UV coordinates', async () => {
  const { expectedAngelUV } = await import('../scripts/tutorial-browser/angel-visuals-evidence.mjs')
  for (const owner of [0, 1, 2, 3]) {
    const group = makeAngelMeshes(owner, environment)
    try {
      for (const mesh of group.children) {
        const expected = expectedAngelUV(mesh.userData.nativeModel, owner)
        assert.deepEqual([...mesh.geometry.getAttribute('uv').array], expected.uv)
        assert.deepEqual(mesh.userData.nativeResource.data.tiles, expected.tiles)
        assert.notDeepEqual(expected.uv, [...new Float32Array(mesh.userData.nativeResource.data.uv)])
      }
    } finally { releaseGroup(group) }
  }
})
