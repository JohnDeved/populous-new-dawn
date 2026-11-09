// Actual GameStore, constructor resource assignment, building renderer and overlay
// sprite caller. Buildings/commands and texture/DOM/GPU leaves are controlled;
// these are regression fixtures, not ordinary-play or original-pixel evidence.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { createGameStore } from '../app/game-store.ts'
import { createGift } from '../app/world-effects.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeHutSmokeScene } from './support/hut-smoke-scene.mjs'
import { bindSceneEnvironment } from './support/world-environment-scene.mjs'

for (const [mission, bank, atlas] of [
  [1, 'c', 'atlas'],
  [2, 's', 'atlas-s'],
  [3, 'p', 'atlas-p'],
  [6, 'c', 'atlas'],
  [10, 'p', 'atlas-p'],
  [4, 'c', 'atlas'],
]) {
  test(`actual M${mission} building caller shares ${bank} animation across all Temple tribes`, async () => {
    const api = await loadSceneFixture(),
      store = createGameStore()
    if (mission !== 1) store.startMission(mission)
    const world = store.getWorld(),
      binding = store.bindPresentation(world),
      fixture = await makeHutSmokeScene(world),
      temples = ['red', 'yellow', 'green', 'blue'].map((team, index) =>
        api.addBuilding(world, team, 'temple', { x: -30 + index * 14, z: 20 }, true)
      )
    try {
      await bindSceneEnvironment(fixture.scene)
      const original = new Map()
      for (let visit = 0; visit < 9; visit++) {
        const snapshot = binding.snapshot()
        assert.ok(snapshot, `M${mission} has a resource even when no acquisition is active`)
        fixture.scene.templeResourceSnapshot = snapshot
        fixture.render()
        for (const temple of temples) {
          const group = fixture.scene.buildingMeshes.get(temple.id),
            [mesh] = group.children,
            object = { blue: 95, red: 96, yellow: 97, green: 98 }[temple.team]
          assert.equal(mesh.userData.nativeModel, object)
          assert.ok(
            mesh.userData.templeTileOffset,
            `M${mission} ${temple.team} completed Temple must consume the shared animated tile`
          )
          assert.equal(mesh.material.map.image.src, `/original/${atlas}.png`)
          const before = original.get(temple.id)
          if (before) {
            assert.equal(mesh, before.mesh, 'phase changes do not rebuild the world mesh')
            assert.equal(mesh.geometry, before.geometry)
            assert.deepEqual([...mesh.geometry.getAttribute('uv').array], before.uv)
          } else {
            original.set(temple.id, {
              mesh,
              geometry: mesh.geometry,
              uv: [...mesh.geometry.getAttribute('uv').array],
            })
          }
          const shader = {
            uniforms: {},
            vertexShader: '#include <uv_vertex>\n#include <begin_vertex>',
            fragmentShader: '#include <colorspace_fragment>',
          }
          mesh.material.onBeforeCompile(shader)
          assert.equal(shader.uniforms.templeTileOffset, mesh.userData.templeTileOffset)
          assert.deepEqual(shader.uniforms.templeTileOffset.value.toArray(), [
            ((snapshot.tile & 7) - (92 & 7)) / 8,
            -((snapshot.tile >> 3) - (92 >> 3)) / 32,
          ])
          assert.equal(mesh.userData.templeResourceEpoch, snapshot.epoch)
          assert.equal(binding.snapshot(), snapshot, 'all tribe consumers only read one snapshot')
        }
        binding.advance()
      }
    } finally {
      fixture.close()
      binding.release()
    }
  })
}

test('actual non-Blue completion joins the running resource instead of starting a local flame', async () => {
  const api = await loadSceneFixture(),
    store = createGameStore()
  store.startMission(3)
  const world = store.getWorld(),
    temple = api.addBuilding(world, 'yellow', 'temple', { x: 24, z: 70 }, true),
    binding = store.bindPresentation(world),
    fixture = await makeHutSmokeScene(world)
  try {
    await bindSceneEnvironment(fixture.scene)
    binding.advance()
    binding.advance()
    for (let stage = 0; stage < 4; stage++) {
      temple.damageState = { stage, tilt: 0, roll: 0 }
      fixture.scene.templeResourceSnapshot = binding.snapshot()
      fixture.render()
      const [mesh] = fixture.scene.buildingMeshes.get(temple.id).children
      assert.equal(mesh.userData.stage, stage)
      assert.ok(![...mesh.geometry.getAttribute('textureMode').array].includes(32))
      assert.equal(mesh.userData.templeTileOffset, undefined)
    }
    temple.damageState.stage = 4
    const snapshot = binding.snapshot()
    fixture.scene.templeResourceSnapshot = snapshot
    fixture.render()
    const [completed] = fixture.scene.buildingMeshes.get(temple.id).children
    assert.ok(completed.userData.templeTileOffset, 'completed Yellow Temple joins the shared phase')
    assert.equal(snapshot.tile, 94)
    assert.deepEqual(completed.userData.templeTileOffset.value.toArray(), [0.25, -0])
    assert.equal(binding.snapshot(), snapshot)
  } finally {
    fixture.close()
    binding.release()
  }
})

test('actual acquisition sprite caller preserves M1 and other p-mission companion pixels', async t => {
  await loadSceneFixture()
  const { WorshipAcquisitionPresentation } = await import('../app/scene-worship-acquisition.ts'),
    { texture } = await import('../app/scene-assets.ts'),
    previousLoad = THREE.TextureLoader.prototype.load,
    previousDocument = globalThis.document,
    images = new Map()
  THREE.TextureLoader.prototype.load = function load(url, onLoad) {
    const result = new THREE.Texture({ src: url, complete: true, naturalWidth: 256 })
    queueMicrotask(() => onLoad?.(result))
    return result
  }
  t.after(() => {
    for (const [map, image] of images) map.image = image
    THREE.TextureLoader.prototype.load = previousLoad
    if (previousDocument === undefined) delete globalThis.document
    else globalThis.document = previousDocument
  })
  for (const name of ['effects', 'temple-sparkles-p']) {
    const map = texture(name)
    images.set(map, map.image)
    map.image = { src: `/original/${name}.png`, complete: true, naturalWidth: 256 }
  }
  for (const [mission, bank, expectedAtlas, expectedRGB, palette] of [
    [1, 'c', 'effects', 0x123456, 0],
    [2, 's', 'effects', 0x123456, 0],
    [3, 'p', 'temple-sparkles-p', 0xf7ebc9, 0],
    [10, 'p', 'effects', 0x123456, 0],
    [3, 'c', 'effects', 0x123456, 0],
    [3, 'p', 'effects', 0x123456, 'ghost'],
  ]) {
    const drawn = [],
      pixels = [],
      store = createGameStore()
    store.startMission(mission)
    globalThis.document = {
      createElement: () => ({
        getContext: () => ({
          drawImage: image => drawn.push(image.src),
          getImageData: () => ({ data: new Uint8ClampedArray([255, 255, 255, 255]) }),
          putImageData: image => pixels.push([...image.data]),
        }),
      }),
    }
    // Prospective/stale resource is a supplied leaf. The unchanged baseline
    // sprite caller wrongly interprets any non-null resource as M3 admission.
    const snapshot = Object.freeze({
        bank,
        modelAtlas: bank === 'c' ? 'atlas' : `atlas-${bank}`,
        epoch: 1,
        counter: 2,
        tile: 94,
      }),
      presentation = Object.assign(Object.create(WorshipAcquisitionPresentation.prototype), {
        scene: { world: store.getWorld(), templeResourceSnapshot: snapshot },
        sprites: new Map(),
      })
    const sprite = presentation.sprite({
      frame: palette === 'ghost' ? 318 : 1288,
      palette,
      rgb: 0x123456,
    })
    assert.ok(sprite)
    assert.deepEqual(drawn, [`/original/${expectedAtlas}.png`], `M${mission}/${bank}/${palette}`)
    assert.deepEqual(pixels, [
      [expectedRGB >>> 16, (expectedRGB >>> 8) & 255, expectedRGB & 255, 255],
    ])
    assert.equal(presentation.scene.templeResourceSnapshot, snapshot)
  }
})

test('shared resources do not expand authored building-reward provenance', () => {
  for (const [mission, reward, model] of [
    [1, 'camp', 7],
    [3, 'temple', 5],
  ]) {
    const store = createGameStore()
    store.startMission(mission)
    const world = store.getWorld(),
      vault = world.shrines.find(shrine => shrine.kind === 'vault' && shrine.reward === reward)
    assert.ok(vault)
    assert.equal(createGift(world, reward, vault).buildingAcquisition.model, model)
    assert.equal(createGift(world, reward, { ...vault }).buildingAcquisition, undefined)
    vault.rewardRecipient = 2
    assert.equal(createGift(world, reward, vault).buildingAcquisition, undefined)
  }
  const source = createGameStore()
  source.startMission(3)
  const original = source.getWorld().shrines.find(shrine => shrine.reward === 'temple')
  for (const mission of [6, 10]) {
    const store = createGameStore()
    store.startMission(mission)
    const world = store.getWorld(),
      supplied = structuredClone(original)
    world.shrines.push(supplied)
    assert.equal(
      createGift(world, 'temple', supplied).buildingAcquisition,
      undefined,
      `M${mission} cannot admit a Temple screen reward from shared c/p resources`
    )
  }
})
