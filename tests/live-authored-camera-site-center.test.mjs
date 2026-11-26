import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, nativePosition, select, tick } from '../app/model.ts'
import {
  quickCameraTarget,
  REINCARNATION_CAMERA_ACTION,
  SHAMAN_CAMERA_ACTION,
} from '../app/quick-camera-shortcuts.ts'

test('the authored M6 camera site stays centered after the Shaman moves away', () => {
  const w = createWorld(6)
  const shaman = w.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  assert.equal(shaman.id, 95)
  assert.deepEqual(nativePosition(w, shaman), { x: 15104, y: 13708, h: 192 })
  const site = () => quickCameraTarget(w, REINCARNATION_CAMERA_ACTION)
  const shamanTarget = () => quickCameraTarget(w, SHAMAN_CAMERA_ACTION)
  assert.deepEqual(shamanTarget(), { x: 51, z: -61 })
  const startTarget = site()

  while (w.turn < 430) tick(w, 1 / 12)
  select(w, 'shaman')
  assert.deepEqual(w.selected, [95])
  assert.ok(command(w, { x: 73, z: -58 }))
  while (w.turn < 550) tick(w, 1 / 12)
  assert.deepEqual(nativePosition(w, shaman), { x: 20588, y: 13009, h: 382 })
  assert.deepEqual(shamanTarget(), { x: 73, z: -59 })
  assert.deepEqual([startTarget, site()], [{ x: 51, z: -61 }, { x: 51, z: -61 }])
  assert.deepEqual(w.reincarnationSites[0], { x: 15104, y: 13568, h: 192 })
})
