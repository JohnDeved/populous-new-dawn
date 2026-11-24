import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, command, tick } from '../app/model.ts'

function formation() {
  const w = createWorld(1, 'scalable')
  const units = [13, 14, 15, 16, 17, 18].map(id => w.units.find(u => u.id === id))
  for (const u of units) assert.deepEqual([u.team, u.kind], ['blue', 'brave'])
  w.selected = units.map(u => u.id)
  assert.equal(command(w, { x: -20, z: 35 }), true)
  for (let i = 0; i < 24; i++) tick(w, 1 / 12)
  assert.equal(w.marching.length, 1)
  const g = w.marching[0]
  assert.deepEqual(g.members, [13, 18, 15, 17, 16, 14, 0, 0, 0, 0, 0, 0])
  const people = new Map(units.map(u => [u.id, u.native]))
  const events = []
  // Observe writes before the normal physics phase consumes the destination bit.
  for (const [id, person] of people) {
    for (const key of ['turnAngle', 'turnY', 'flags2', 'counter']) {
      let value = person[key]
      Object.defineProperty(person, key, {
        enumerable: true,
        configurable: true,
        get: () => value,
        set: next => {
          events.push([id, key, value, next])
          value = next
        },
      })
    }
  }
  const visit = () => {
    events.length = 0
    tick(w, 1 / 12)
    for (const u of units) assert.equal(u.native, people.get(u.id), `owner ${u.id}`)
  }
  return { w, g, people, events, visit }
}

function checkWrites(events, expected, priorCount) {
  assert.ok(priorCount >= 0)
  const writes = events.slice(0, priorCount)
  for (let i = 0; i < expected.length; i++) {
    const [id, x, y] = expected[i]
    const [a, b, mark] = writes.slice(i * 3, i * 3 + 3)
    assert.deepEqual([a?.[0], a?.[1], a?.[3]], [id, 'turnAngle', x])
    assert.deepEqual([b?.[0], b?.[1], b?.[3]], [id, 'turnY', y])
    assert.deepEqual([mark?.[0], mark?.[1], mark?.[3]], [id, 'flags2', (mark[2] | 0x1000) >>> 0])
    assert.equal(mark[2] & 0x80, 0, 'no existing alternate-turn bit is exercised in this route')
  }
}

test('a moving M1 marching group sets its six owned targets before follower physics', () => {
  const { w, g, events, visit } = formation()
  assert.deepEqual([g.x, g.y], [1855, 54524])
  visit()
  assert.deepEqual([w.turn, g.x, g.y], [25, 1784, 54501])
  const firstPhysics = events.findIndex(([, key]) => key === 'counter')
  assert.equal(firstPhysics, 18)
  checkWrites(events, [
    [13, 1784, 54501], [18, 1864, 54213], [15, 1688, 54773],
    [17, 2056, 54581], [16, 2136, 54293], [14, 1960, 54853],
  ], firstPhysics)
})

test('ordinary marching member release restores the retained order destination', () => {
  const { w, g, events, visit } = formation()
  while (w.turn < 37) visit()
  assert.equal(g.count, 6)
  visit()
  assert.deepEqual([w.turn, g.count], [38, 4])
  assert.equal(g.members.includes(18), false)
  assert.equal(g.members.includes(15), false)
  checkWrites(events, [[18, 256, 54016], [15, 256, 54016]],
    events.findIndex(([, key]) => key === 'counter'))
})

test('the live marching destination setter clears a supplied alternate-turn flag', () => {
  const { g, people, events, visit } = formation()
  const leader = people.get(g.members[0])
  assert.equal(leader.flags2 & 0x80, 0)
  // Only the old flag is supplied; the group and its first target are genuine.
  leader.flags2 |= 0x80
  visit()
  const mark = events.find(([id, key]) => id === g.members[0] && key === 'flags2')
  assert.equal(mark[2] & 0x80, 0x80)
  assert.equal(mark[3], ((mark[2] & ~0x80) | 0x1000) >>> 0)
})
