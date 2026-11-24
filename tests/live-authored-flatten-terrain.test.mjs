import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, command, createWorld, setSelection, tick } from '../app/model.ts'
import { rightClickSpellCharging } from '../app/spell-charging.ts'
import { SPELLS } from '../app/world-rules.ts'

test('ordinary M21 worship interpolates the authored Flatten vertices on its first live turn', () => {
  const w = createWorld(21)
  const head = w.shrines.find(shrine => shrine.kind === 'flattenEffect')
  const braves = () => w.units.filter(u => u.team === 'blue' && u.kind === 'brave')
  const advanceUntil = (condition, deadline) => {
    while (!condition() && w.turn < deadline) tick(w, 1 / 12)
    assert.ok(condition(), `not reached by turn ${deadline}`)
  }
  tick(w, 1 / 12)
  assert.equal(w.shots.convertWild, 0)
  assert.ok(
    rightClickSpellCharging(w, SPELLS.find(s => s.id === 'convertWild'), {
      ctrlKey: true,
      shiftKey: false,
    })
  )
  advanceUntil(() => w.shots.convertWild > 0, 1000)
  assert.ok(cast(w, 'convertWild', { x: 31, z: 87 }))
  advanceUntil(() => braves().length === 6, 1500)
  setSelection(w, braves().slice(0, 3).map(u => u.id))
  assert.equal(head.id, 2)
  assert.ok(command(w, head))
  advanceUntil(() => head.uses === 1, 1208)
  assert.equal(w.turn, 1208)
  const flatten = w.effects.find(f => !!f.flatten)?.flatten
  assert.deepEqual(flatten?.center, { x: 9472, y: 33024, h: 897 })
  assert.equal(flatten.targetHeight, 897)
  assert.equal(flatten.remaining, 15)
  assert.equal(flatten.terrainRadius, 0)

  const before = w.land.heights.slice()
  tick(w, 1 / 12)
  assert.equal(w.turn, 1209)
  assert.equal(flatten.remaining, 14)
  const changed = Array.from(w.land.heights).flatMap((height, index) =>
    height === before[index] ? [] : [[index, before[index], height]]
  )
  assert.deepEqual(changed, [
    [8210, 807, 818],
    [8211, 619, 637],
    [8338, 1024, 1009],
    [8339, 989, 983],
  ])
})
