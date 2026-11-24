import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, nativePosition, tick } from '../app/model.ts'
import { declareNextErosionCapture } from '../app/erosion-observation.ts'

test('ordinary M3 Erosion activation marks a real in-range Wildman but not the adjacent outside control', () => {
  const w = createWorld(3)
  const head = w.shrines.find(s => s.id === 101)
  const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  assert.equal(shaman.id, 46)
  const opening = () => w.levelStart.some(s => s.phase !== 4 || s.wave || s.carriers.length ||
    s.stoneTurns.some(t => t !== null && w.turn - t < 20))
  while (opening() && w.turn < 256) tick(w, 1 / 12)
  assert.equal(opening(), false)
  assert.equal(w.turn, 73)
  w.selected = [shaman.id]
  assert.equal(command(w, { id: head.id, x: head.x, z: head.z }), true)

  const p = nativePosition(w, head.effectTarget)
  const capture = declareNextErosionCapture({ x: p.x & 65535, y: p.y & 65535 })
  const pair = [44, 43].map(id => w.units.find(u => u.id === id))
  function sample() {
    return pair.map(u => {
      assert.equal(u.team, 'wild')
      assert.ok(u.hp > 0)
      assert.equal(u.inside, null)
      const o = u.native
      assert.ok(o)
      const p = nativePosition(w, u)
      return { o, x: p.x & 65535, y: p.y & 65535, flags: o.flags2 }
    })
  }
  try {
    while (w.turn < 595 && capture.status().count === 0) tick(w, 1 / 12)
    assert.equal(w.turn, 595)
    assert.equal(head.uses, 0)
    const before = sample()
    assert.deepEqual(before.map(row => row.flags), [131072, 131072])
    tick(w, 1 / 12)
    assert.equal(w.turn, 596)
    assert.equal(head.uses, 1)
    const observed = capture.read()
    assert.equal(observed.failure, null)
    assert.equal(observed.visits.length, 1)
    const terrain = observed.visits[0].notifications.filter(n => n.kind === 'terrain')
    assert.deepEqual(terrain, [{ kind: 'terrain', cell: 35322, completed: true }])
    const cell = terrain[0].cell
    const after = sample()
    const distance = ({ x, y }) => {
      const dx = Math.abs((x >> 9) - ((cell & 254) >> 1))
      const dy = Math.abs((y >> 9) - (cell >> 9))
      return Math.max(Math.min(dx, 128 - dx), Math.min(dy, 128 - dy))
    }
    assert.deepEqual(after.map(distance), [4, 7])
    for (let i = 0; i < pair.length; i++) {
      assert.equal(after[i].o, before[i].o)
      assert.deepEqual([after[i].x, after[i].y], [before[i].x, before[i].y])
    }
    assert.deepEqual(after.map(row => row.flags), [131076, 131072])
  } finally {
    capture.detach()
  }
})
