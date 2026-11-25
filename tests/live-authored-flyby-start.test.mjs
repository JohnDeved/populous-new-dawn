import assert from 'node:assert/strict'
import test from 'node:test'
import { browserPosition, createWorld, nativePosition, tick } from '../app/model.ts'
import { levelStartCamera } from '../app/level-start.ts'
import { stepFlyby } from '../app/flyby.ts'

test('the authored M3 flyby locks input and holds the starting camera through all six warmup samples', () => {
  const w = createWorld(3)
  const shaman = w.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  assert.equal(shaman.id, 46)
  const seed = levelStartCamera(nativePosition(w, shaman), w.manaWorld.gameFlags)
  const initial = browserPosition(seed)
  const camera = {
    x: Math.round((initial.x + 8) * 256),
    y: Math.round((-initial.z - 8) * 256),
    angle: seed.angle,
    zoom: 0,
  }
  const pose = () => [camera.x, camera.y, camera.angle, camera.zoom]
  const openingPose = [10752, -22784, 256, 0]
  while (w.turn < 15) tick(w, 1 / 12)
  assert.deepEqual([w.inputMask, w.flyby.flags, w.flyby.cursor, w.flyby.events.length], [0, 16, 0, 0])
  assert.deepEqual(pose(), openingPose)

  tick(w, 1 / 12)
  assert.equal(w.turn, 16)
  assert.equal(w.inputMask, 64)
  assert.equal(w.flyby.flags, 21)
  assert.equal(w.flyby.cursor, 0)
  assert.equal(w.flyby.events.length, 22)
  const read = () => stepFlyby(w.flyby, camera, 24, w.paused)
  const count = []
  for (let i = 0; i < 6; i++) {
    assert.deepEqual(read(), [])
    count.push(w.flyby.warmup)
    assert.deepEqual(pose(), openingPose)
    assert.equal(w.turn, 16)
  }
  assert.deepEqual(count, [5, 4, 3, 2, 1, 0])
  assert.deepEqual([w.flyby.frame, w.flyby.cursor, w.flyby.frameRate], [0, 0, 23])

  for (let i = 0; i < 4; i++) read()
  assert.deepEqual([w.flyby.frame, w.flyby.cursor], [4, 3])
  assert.deepEqual(pose(), [10753, -22782, 259, 3])
  assert.equal(w.turn, 16)
})
