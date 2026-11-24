import assert from 'node:assert/strict'
import test from 'node:test'
import { quickCameraAction, quickCameraTarget, REINCARNATION_CAMERA_ACTION, SHAMAN_CAMERA_ACTION } from '../app/quick-camera-shortcuts.ts'
import { browserPosition } from '../app/world-coordinates.ts'

test('H admission preserves both current Pause state sources and leaves Period eligible', () => {
  const coords = { x: 12345, y: 54321 }
  const shaman = { kind: 'shaman', team: 'blue', hp: 100, ...browserPosition(coords) }
  const s = { x: 8448, y: 23808 }, world = { units: [shaman], reincarnationSites: [s], land: { landFlags: 0 }, paused: false }
  assert.equal(quickCameraAction({ code: 'Period', key: '.', repeat: false }), SHAMAN_CAMERA_ACTION)
  assert.equal(quickCameraAction({ code: 'KeyH', key: 'h', repeat: false }), REINCARNATION_CAMERA_ACTION)
  for (const [paused, flags, allowed] of [[true, 0, false], [false, 2, false], [true, 2, false], [false, 8, true]]) {
    world.paused = paused
    world.land.landFlags = flags
    assert.deepEqual(quickCameraTarget(world, REINCARNATION_CAMERA_ACTION), allowed ? browserPosition(s) : null)
    assert.notEqual(quickCameraTarget(world, SHAMAN_CAMERA_ACTION), null)
  }
})

test('dead, ghost and enemy Shamans never become the Period target', () => {
 const t = { kind:'shaman', team:'blue', hp:0, x:1,z:2 }
 const context = { units:[t, { ...t, hp:1, ghost:true }, { ...t, hp:1, team:'red' }] }
 assert.equal(quickCameraTarget(context, SHAMAN_CAMERA_ACTION), null)
})

test('all 128 × 128 authored native cells center from an interior off-center point', () => {
  const shaman = { kind:'shaman', team:'blue', hp:100 }
  const context = { units:[shaman] }
  for (let i=0;i<128;i++) for (let j=0;j<128;j++) {
    Object.assign(shaman, browserPosition({x: i*512+13, y: j*512+492}))
    const target = quickCameraTarget(context, SHAMAN_CAMERA_ACTION)
    const expected = browserPosition({x: i*512+256, y:j*512+256})
    if (target.x !== expected.x || target.z !== expected.z) assert.deepEqual(target, expected, `cell ${i},${j}`)
  }
})
