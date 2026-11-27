import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import original from './fixtures/sky-horizon.json' with { type: 'json' }

const loaded = loadSceneFixture().then(async ({ createWorld }) => {
  const runtime = await import('../app/scene-camera-runtime.ts')
  const { createSkyMotion } = await import('../app/sky.ts')
  return { ...runtime, createSkyMotion, createWorld }
})

async function skyScene() {
  const { createWorld, createSkyMotion } = await loaded
  const sky = {
    world: createWorld(1), scene: new THREE.Scene(), space: null,
    viewPoint: { x: -8, z: -8 }, cameraBearing: 0, overviewActive: false,
    skyLoaded: true, skyOwned: createSkyMotion(), skyMotion: createSkyMotion(),
    skyRemainder: 0, skyGrid: new Int32Array(4992), skyClouds: [],
    container: { clientWidth: 640, clientHeight: 480 }, view: { config: { horizon: 195 } },
    ground: { visible: true }, globe: { visible: false },
    skyBackdrop: new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      uniforms: { map: { value: null }, height: { value: -1 } },
    })),
    skyFlash: new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      uniforms: { height: { value: -1 }, rgba: { value: new THREE.Vector4() } },
    })),
    updateWater: () => {},
  }
  return sky
}

function dispose(scene) {
  for (const mesh of [scene.skyFlash, scene.skyBackdrop, ...scene.skyClouds]) {
    mesh.geometry.dispose()
    mesh.material.dispose()
  }
}

test('ordinary type-2 scene submits the retained two-layer cloud geometry at native horizon', async () => {
  const { makeSky, updateSky } = await loaded
  const scene = await skyScene()
  const { layers, quad, horizon, width, height } = original.cases[0]
  assert.deepEqual([width, height, horizon, layers.length], [640, 480, 195, 2])
  assert.deepEqual(quad, [[0, 0, 0, 0], [640, 0, 1, 0], [640, 195, 1, 1], [0, 195, 0, 1]])
  const load = THREE.TextureLoader.prototype.load
  const texture = new THREE.Texture()
  try {
    THREE.TextureLoader.prototype.load = () => texture
    makeSky(scene)
    updateSky(scene)
    assert.ok(scene.skyBackdrop.visible)
    assert.equal(scene.skyBackdrop.material.uniforms.height.value, horizon / height)
    assert.equal(scene.skyClouds.length, 2)
    for (const [i, mesh] of scene.skyClouds.entries()) {
      assert.ok(mesh.visible)
      const {position, fade} = mesh.geometry.attributes
      assert.equal(position.count, 31)
      assert.equal(mesh.geometry.index.count, 126)
      for (const [j, [x, y, color]] of layers[i].entries()) {
        assert.equal(position.getX(j), Math.fround(x * 2 / width - 1))
        assert.equal(position.getY(j), Math.fround(1 - y * 2 / height))
        assert.equal(fade.getX(j), Math.fround((color >>> 24) / 255))
      }
    }
    scene.view.config.horizon = 0
    updateSky(scene)
    assert.equal(scene.skyBackdrop.material.uniforms.height.value, 0)
    assert.ok(scene.skyClouds.every(mesh => !mesh.visible))
  } finally {
    THREE.TextureLoader.prototype.load = load
    dispose(scene)
    texture.dispose()
  }
})

test('ordinary defeat sky scene submits the selected tribe flash color at clamped bounds', async () => {
  const { updateEnvironmentFrame } = await loaded
  const scene = await skyScene()
  scene.updateSky = () => {}
  try {
    scene.world.outcome.lastDefeated = 2
    scene.world.outcome.skyCounter = 1
    updateEnvironmentFrame(scene, 0)
    assert.ok(scene.skyFlash.visible)
    const {height, rgba} = scene.skyFlash.material.uniforms
    assert.equal(height.value, 195 / 480)
    assert.deepEqual(rgba.value.toArray(), [191, 147, 39, 0x48].map(n => n / 255))
    scene.view.config.horizon = 720
    scene.world.outcome.skyCounter = 2
    updateEnvironmentFrame(scene, 0)
    assert.equal(height.value, 1)
    assert.deepEqual(rgba.value.toArray(), [191, 147, 39, 0x60].map(n => n / 255))
    scene.world.outcome.skyCounter = 0
    updateEnvironmentFrame(scene, 0)
    assert.equal(scene.skyFlash.visible, false)
  } finally {
    dispose(scene)
  }
})
