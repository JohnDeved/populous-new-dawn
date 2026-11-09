import assert from 'node:assert/strict'
import test from 'node:test'
import { FramePerformance } from '../app/frame-performance.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import * as THREE from 'three'

function fixture() {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))
  geometry.setAttribute('surface', new THREE.Float32BufferAttribute([0], 1))
  for (const name of ['light', 'highlight'])
    geometry.setAttribute(name, new THREE.Float32BufferAttribute(3, 3))
  return {
    terrain: { geometry },
    waves: new Uint8Array(65536),
    landIndex: () => 0,
    world: {
      turn: 0,
      landVersion: 0,
      lightRevision: 0,
      land: { heights: [128], categories: [0], flags: [0], buildingIds: [0] },
    },
  }
}

test('optional frame-level water reasons survive ring wrap and missing-field/reset samples', () => {
  const samples = new FramePerformance()
  samples.sample(16, 1, 1, 1, 4, 0, 16, 'live', undefined, 32)
  assert.equal(samples.recentFrames()[0].waterUpdateReasons, 32)
  for (let i = 2; i <= 1203; i++)
    samples.sample(16, 1, 1, 1, 4, 0, i * 16, 'live', undefined, i % 128)
  const frames = samples.recentFrames()
  assert.equal(frames.length, 1200)
  assert.equal(frames[0].waterUpdateReasons, 4)
  assert.equal(frames.at(-1).waterUpdateReasons, 1203 % 128)
  samples.reset()
  samples.sample(16, 1, 1, 1, 4, 0, 16, 'live')
  assert.equal('waterUpdateReasons' in samples.recentFrames()[0], false)
  for (const invalid of [-1, 128, NaN, Infinity, 1.5])
    assert.equal(samples.sample(16, 1, 1, 1, 4, 0, 32, 'live', undefined, invalid), false)
})

test('actual water calls OR exact key-change/skip reasons without measuring stored bytes', async () => {
  await loadSceneFixture()
  const { updateWater } = await import('../app/scene-terrain-runtime.ts')
  const s = fixture(),
    metrics = { reasons: 0 }
  try {
    updateWater(s, metrics)
    assert.equal(metrics.reasons, 4)
    metrics.reasons = 0
    updateWater(s, metrics)
    assert.equal(metrics.reasons, 1)
    metrics.reasons = 0
    s.world.lightRevision++
    updateWater(s, metrics)
    assert.equal(metrics.reasons, 32)
    metrics.reasons = 0
    s.world.turn++
    s.world.landVersion++
    updateWater(s, metrics)
    assert.equal(metrics.reasons, 8 | 16)
    metrics.reasons = 0
    const previousGeometry = s.terrain.geometry
    s.terrain.geometry = previousGeometry.clone()
    previousGeometry.dispose()
    updateWater(s, metrics)
    assert.equal(metrics.reasons, 64)
    updateWater(s, metrics)
    assert.equal(metrics.reasons, 64 | 1, 'multiple actual call reasons are OR-ed')
    metrics.reasons = 0
    s.waterState = 'unknown'
    updateWater(s, metrics)
    assert.equal(metrics.reasons, 4)
    metrics.reasons = 0
    s.waves = undefined
    updateWater(s, metrics)
    assert.equal(metrics.reasons, 2)
    updateWater(s, metrics)
    assert.equal(metrics.reasons, 2, 'OR mask is not a count')
  } finally {
    s.terrain.geometry.dispose()
  }
})

test('real GameScene environment and water wrappers carry only explicitly supplied frame metrics', async () => {
  await loadSceneFixture()
  const { GameScene } = await import('../app/scene.ts')
  const s = Object.assign(Object.create(GameScene.prototype), fixture(), {
    ground: {},
    globe: {},
    scene: {},
    space: null,
    overviewActive: false,
    updateSky() {},
    container: { clientWidth: 640, clientHeight: 480 },
    view: { config: { horizon: 0 } },
    skyFlash: {},
  })
  s.world.outcome = { skyCounter: 0, lastDefeated: 0 }
  const metrics = { reasons: 0 }
  try {
    s.updateEnvironmentFrame(0, metrics)
    assert.equal(metrics.reasons, 4)
    metrics.reasons = 0
    s.world.lightRevision++
    s.updateEnvironmentFrame(0, metrics)
    assert.equal(metrics.reasons, 32)
    s.world.turn++
    s.updateWater()
    assert.equal(metrics.reasons, 32, 'off-frame call does not attach to previous frame')
    metrics.reasons = 0
    s.updateEnvironmentFrame(0, metrics)
    assert.equal(metrics.reasons, 1)
  } finally {
    s.terrain.geometry.dispose()
  }
})

test('disabled water recording does not split keys or add state reads', async () => {
  await loadSceneFixture()
  const { updateWater } = await import('../app/scene-terrain-runtime.ts')
  const s = fixture()
  updateWater(s)
  let reads = 0
  const state = s.waterState
  Object.defineProperty(s, 'waterState', {
    get() {
      reads++
      return state
    },
  })
  const split = String.prototype.split
  try {
    String.prototype.split = () => {
      throw Error('diagnostic key work while disabled')
    }
    updateWater(s)
    assert.equal(reads, 1)
  } finally {
    String.prototype.split = split
    s.terrain.geometry.dispose()
  }
})
