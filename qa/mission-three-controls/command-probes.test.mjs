import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorldState } from '../../app/world-state.ts'
import { createMoveContextProbe, isOrdinaryMoveContext } from './command-probes.mjs'

const fixture = () => {
  const w = createWorldState(3)
  w.units = [{ id: 3242, team: 'blue', kind: 'preacher', hp: 55, x: 27, z: 75 }]
  w.selected = [3242]
  w.buildings = [{ id: 1016, team: 'yellow', kind: 'hut', hp: 170, progress: 1,
    x: -27.0546875, z: -107.078125, level: 1, angle: 0 }]
  return w
}

test('visually unpicked ground in a registered enemy building cell is rejected as a move', () => {
  const w = fixture(), original = structuredClone(w)
  const inspect = createMoveContextProbe(w)
  const context = inspect({ x: -28.93573121901977, z: -106.98719388391692 })
  assert.equal(context.model, 19)
  assert.equal(context.buildingId, 1016)
  assert.equal(isOrdinaryMoveContext(context), false)
  assert.equal(w.buildingFootprints.size, 0, 'Only the detached clone received footprint registration')
  assert.deepEqual(w, original)
})

test('a genuine enabled ground move remains eligible while blocked/coastal and other contexts are rejected', () => {
  const w = fixture(), original = structuredClone(w), inspect = createMoveContextProbe(w)
  assert.equal(isOrdinaryMoveContext(inspect({ x: 35, z: 81 })), true)
  assert.equal(isOrdinaryMoveContext(inspect({ x: 90, z: 90 })), false)
  for (const context of [null, { model: 3, enabled: false }, { model: 8, enabled: true }, { model: 19, enabled: true }])
    assert.equal(isOrdinaryMoveContext(context), false)
  assert.deepEqual(w, original)
})
