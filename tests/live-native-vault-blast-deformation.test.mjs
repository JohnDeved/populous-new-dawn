import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { makeSceneFixture } from './support/bloodlust-scene.mjs'

async function observe(t, near) {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const { createWorld, command, select, cast, tick, advanceGame, updateShrinesFrame, renderSceneFrame } =
    await loadSceneFixture()
  const { GameScene } = await import('../app/scene.ts')
  const world = createWorld(6)
  for (let i = 0; i < 100; i++) tick(world, 1 / 12)
  assert.equal(world.inputMask, 0)
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const target = world.shrines.find(s => s.id === 352 && s.kind === 'vault')
  const other = world.shrines.find(s => s.id === 17 && s.kind === 'vault')
  assert.ok(shaman && target && other)
  assert.deepEqual([target.x, target.z, other.x, other.z], [39, -89, -51, -111])
  select(world, 'shaman')
  assert.ok(command(world, { x: 39, z: -86 }))
  for (let i = 0; i < 300 && Math.hypot(shaman.x - 39, shaman.z + 86) > 3; i++) tick(world, 1 / 12)
  assert.equal(world.turn, 197)
  const { scene, close } = await makeSceneFixture(world)
  t.after(close)
  const { y, locate, orientModel } = GameScene.prototype
  Object.assign(scene, {
    shrineMeshes: new Map(), waveFrames: new WeakMap(), y, locate, orientModel,
    scene: new THREE.Scene(), camera: new THREE.Camera(),
    worshipPresentation: { rememberBodies() {} },
  })
  scene.scene.add(scene.objects)
  // Keep the real CPU update/traversal; supply only renderer submission and
  // unrelated view/presentation boundaries, not the entity, shape or phase.
  scene.view.prepare = () => {}
  scene.view.painter = { render() {} }
  const draw = () => {
    updateShrinesFrame(scene)
    renderSceneFrame(scene, null, undefined)
    const g = scene.shrineMeshes.get(target.id).g
    const far = scene.shrineMeshes.get(other.id).g
    const attr = entity => entity.children[0].geometry.getAttribute('nativeWaveOffset').array
    assert.equal(other.shake, undefined, 'same cast leaves the uninvolved Vault unhit')
    assert.equal(far.userData.nativeWave, undefined)
    assert.ok(attr(far).every(x => x === 0), 'uninvolved Vault buffer remains zero')
    return {
      phase: g.userData.nativeWave?.phase ?? 0,
      first: Array.from(attr(g).slice(0, 6)),
      zero: attr(g).every(x => x === 0),
    }
  }
  assert.deepEqual(draw(), {phase: 0, first: [0, 0, 0, 0, 0, 0], zero: true})
  assert.ok(cast(world, 'blast', near ? target : { x: 49, z: -82 }))
  for (let i = 0; i < 12 && !target.shake; i++) tick(world, 1 / 12)
  assert.deepEqual([world.turn, world.shots.blast, target.shake, target.shakeOrigin],
    near ? [207, 3, 1, 20526] : [209, 3, 1, 19000])
  const frames = [draw()]
  for (let i = 0; i < 3; i++) {
    advanceGame(world, scene.gameClock, 1 / 24)
    frames.push(draw())
  }
  assert.equal(target.shake, 0)
  return frames
}

test('004762b0 authored Vault Blast produces and retires three sampled CPU deformation phases', async t => {
  assert.deepEqual(await observe(t, true), [
    { phase: 1, first: [0, 0, -3, 8, -5, 7], zero: false },
    { phase: 2, first: [0, 0, -2, 3, -2, 3], zero: false },
    { phase: 3, first: [0, 0, -1, 1, -1, 1], zero: false },
    { phase: 0, first: [0, 0, 0, 0, 0, 0], zero: true },
  ])
})

test('004762b0 a farther admitted Blast can shake the Vault without deforming any CPU vertex', async t => {
  assert.deepEqual(await observe(t, false), [1, 2, 3, 0].map(phase =>
    ({ phase, first: [0, 0, 0, 0, 0, 0], zero: true })))
})
