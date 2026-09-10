import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/tower-panel.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { occupantPanel } from '../app/training-panel.ts'
import { createWorld, addBuilding, addUnit, command, tick } from '../app/model.ts'
import { selectBuildingOccupants, dismantleBuilding } from '../app/live-building-entry.ts'

function scenario(kind) {
  const w = createWorld()
  w.inputMask = 0
  w.manaWorld.gameFlags = 32
  const b = addBuilding(w, 'blue', 'tower', { x: -2, z: 32 }, true, { angle: Math.PI }),
    u = addUnit(w, 'blue', kind, { x: 7, z: 33 })
  w.selected = [u.id]
  command(w, b)
  for (let i = 0; i < 300 && u.inside !== b.id; i++) tick(w, 1 / 12)
  assert.equal(u.inside, b.id)
  return { w, b, u }
}

test('tower panel matches every original one-slot draw trace', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  for (const c of fixture.cases) assert.deepEqual(occupantPanel(c), c.expected)
})

test('tower panel selection preserves occupancy; ordinary orders leave without teleporting', () => {
  for (const kind of ['brave', 'warrior', 'shaman']) {
    const { w, b, u } = scenario(kind)
    w.selected = []
    selectBuildingOccupants(w, b, u.id, false)
    assert.deepEqual(w.selected, [u.id])
    assert.equal(u.inside, b.id)
    selectBuildingOccupants(w, b, u.id, true)
    assert.deepEqual(w.selected, [])
    assert.equal(u.inside, b.id)
    selectBuildingOccupants(w, b, u.id, true)
    assert.deepEqual(w.selected, [u.id])
    const before = [u.x, u.z]
    command(w, { x: 9, z: 37 })
    assert.equal(u.inside, null)
    assert.deepEqual([u.x, u.z], before)
    for (let i = 0; i < 300 && u.path.length; i++) tick(w, 1 / 12)
    assert.equal(u.path.length, 0)
    assert.equal(u.supportHeight, undefined)
  }
})

test('tower dismantling releases its occupant and only braves perform the work', () => {
  for (const kind of ['brave', 'warrior', 'shaman']) {
    const { w, b, u } = scenario(kind),
      before = [u.x, u.z]
    dismantleBuilding(w, b)
    assert.equal(u.inside, null)
    assert.deepEqual([u.x, u.z], before)
    for (let i = 0; i < 400 && b.hp > 0; i++) tick(w, 1 / 12)
    assert.equal(b.hp <= 0, kind === 'brave', kind)
    assert.ok(u.hp > 0)
  }
})
