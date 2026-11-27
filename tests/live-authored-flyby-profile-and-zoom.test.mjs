import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

async function opening() {
  const { createWorld, tick, nativePosition, browserPosition } = await loadSceneFixture()
  const { levelStartCamera } = await import('../app/level-start.ts')
  const { updateFlyby } = await import('../app/scene-camera-runtime.ts')
  const world = createWorld(3)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  assert.ok(shaman)
  const seed = levelStartCamera(nativePosition(world, shaman), world.manaWorld.gameFlags)
  for (let i = 0; i < 20 && world.turn < 16; i++) tick(world, 1 / 12)
  assert.equal(world.turn, 16)
  assert.equal(world.inputMask, 64)
  const committed = []
  const scene = {
    world, wasFlying: false, keys: new Set(), levelStartCameraSeeded: true,
    viewPoint: browserPosition(seed), cameraBearing: seed.angle * Math.PI / 1024,
    cancelOverview() {}, updateTooltipController() {}, commitSky() {}, acquireForcedTooltip() {},
    updateView() { committed.push(this.viewZoom) }, camera: { up: { set() {} } },
  }
  const frame = target => {
    for (let i = 0; i < 80 && (world.flyby.warmup || world.flyby.frame < target); i++)
      assert.equal(updateFlyby(scene, 1 / 24), true)
    assert.equal(world.flyby.frame, target)
    assert.equal(world.turn, 16)
  }
  return { world, scene, frame, committed }
}

test('ordinary M3 flyby replans its second X track using the first track’s carried velocity', async () => {
  const { world, scene, frame } = await opening()
  frame(41)
  assert.equal(scene.flybyCamera.x, 11001)
  const carried = world.flyby.axes.x.velocity
  assert.equal(carried, 4.1920857429504395)

  frame(42)
  const { axes, tracks } = world.flyby
  assert.equal(tracks[1].duration, 80)
  assert.equal(axes.x.initial, carried)
  assert.deepEqual(
    [axes.x.accelerateUntil, axes.x.cruise, axes.x.brakeFrom],
    [20.62568473815918, -180.9925994873047, 60]
  )
  frame(47)
  assert.equal(scene.flybyCamera.x, 10890)
})

test('ordinary M3 flyby publishes biased signed zoom through its camera update', async () => {
  const { world, scene, frame, committed } = await opening()
  const observed = []
  for (const sample of [3, 4, 5]) {
    frame(sample)
    assert.equal(world.flyby.tracks[3].active, true)
    assert.equal(scene.flybyCamera.zoom, scene.viewZoom)
    observed.push([committed.at(-1), world.flyby.axes.zoom.velocity])
  }
  assert.deepEqual(observed, [[0, 0.5], [3, 3.484131336212158], [9, 6.468262672424316]])
})
