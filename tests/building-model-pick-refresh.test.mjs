// Caller regression for issue #1035 (scripts/check-browser-model-highlight.mjs):
// ScenePicking resolves building models through the painter submission of the last
// render. A building model added, replaced (construction stage) or removed by the
// actual updateBuildingsFrame caller is therefore unpickable at that frame's pointer
// update, and an unchanged pointer/view/turn previously never re-picked it: a
// stationary pointer lost hover over a rebuilt model indefinitely while paused.
// The actual renderSceneFrame must invalidate the pointer state after that render.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { makeHutSmokeScene } from './support/hut-smoke-scene.mjs'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('building model changes re-pick the stationary pointer after their first render', async t => {
  const api = await loadSceneFixture()
  const world = api.createWorld(1)
  const fixture = await makeHutSmokeScene(world)
  t.after(fixture.close)
  const { scene } = fixture
  const order = []
  Object.assign(scene, {
    scene: new THREE.Group(),
    renderer: {},
    pointerState: 'stationary',
    worshipPresentation: { rememberBodies() {} },
  })
  Object.assign(scene.view, {
    prepare: () => order.push('prepare'),
    painter: { render: () => order.push(['render', scene.pointerState]) },
  })
  const frame = () => {
    scene.pointerState = 'stationary'
    fixture.render()
    const before = scene.pointerState
    api.renderSceneFrame(scene, null, undefined)
    return { before, after: scene.pointerState }
  }

  assert.deepEqual(frame(), { before: 'stationary', after: '' }, 'initial models')
  assert.deepEqual(order.at(-1), ['render', 'stationary'], 'invalidated only after the render')
  assert.deepEqual(frame(), { before: 'stationary', after: 'stationary' }, 'no model change')

  const red = world.buildings.find(b => b.team === 'red' && b.progress >= 1 && b.hp > 0)
  assert.ok(red, 'authored Mission 1 Red building')
  const old = scene.buildingMeshes.get(red.id)
  Object.assign(red, { team: 'blue', progress: 0.5 })
  assert.deepEqual(frame(), { before: 'stationary', after: '' }, 'staged model replaced')
  assert.notEqual(scene.buildingMeshes.get(red.id), old)
  assert.deepEqual(frame(), { before: 'stationary', after: 'stationary' }, 'staged model kept')

  world.buildings.splice(world.buildings.indexOf(red), 1)
  assert.deepEqual(frame(), { before: 'stationary', after: '' }, 'model removed')
  assert.equal(scene.buildingMeshes.has(red.id), false)
})
