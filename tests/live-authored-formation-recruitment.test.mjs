import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, command, tick } from '../app/model.ts'
import { positionDistance } from '../app/native-math.ts'

const ids = [13, 18, 15, 17, 16, 14]
function recruit() {
  const w = createWorld(1, 'scalable')
  const units = ids.map(id => w.units.find(u => u.id === id))
  for (const u of units) assert.deepEqual([u.team, u.kind], ['blue', 'brave'])
  w.selected = [...ids].sort((a, b) => a - b)
  assert.equal(command(w, { x: -20, z: 35 }), true)
  for (let i = 0; i < 23; i++) tick(w, 1 / 12)
  assert.equal(w.marching.length, 0)

  const observations = []
  const people = new Map(units.map(u => [u.id, u.native]))
  for (const [id, person] of people) {
    let flags = person.flags3
    assert.equal(flags & 0x10, 0)
    Object.defineProperty(person, 'flags3', {
      enumerable: true,
      configurable: true,
      get: () => flags,
      set: next => {
        if ((flags ^ next) & 0x10) {
          const target = { x: person.destinationX, y: person.destinationY }
          observations.push([id, next & 0x10, positionDistance(person, target),
            w.marching.length, person.assignment & 0x20])
        }
        flags = next
      },
    })
  }
  tick(w, 1 / 12)
  assert.equal(w.turn, 24)
  for (const u of units) assert.equal(u.native, people.get(u.id), `owner ${u.id}`)
  assert.equal(w.marching.length, 1)
  return { observations, people, group: w.marching[0] }
}

test('M1 formation scans registered movers and picks the closest marked Brave as leader', () => {
  const { observations, group } = recruit()
  const marked = observations.filter(([, flag]) => flag === 0x10)
  assert.deepEqual(marked, [
    [13, 16, 1677, 0, 0], [18, 16, 2139, 0, 0], [15, 16, 1819, 0, 0],
    [17, 16, 2734, 0, 0], [16, 16, 3210, 0, 0], [14, 16, 3187, 0, 0],
  ])
  assert.equal(group.members[0], 13)
  assert.equal(group.members[0], marked.reduce((a, b) => a[2] < b[2] ? a : b)[0])
})

test('M1 successful recruitment clears leader and follower marks and attaches the same owners', () => {
  const { observations, people, group } = recruit()
  assert.deepEqual(observations.filter(([, flag]) => flag === 0).map(([id, , , groups, assignment]) =>
    [id, groups, assignment]), [[13, 1, 32], [18, 1, 0], [15, 1, 0],
    [17, 1, 0], [16, 1, 0], [14, 1, 0]])
  assert.deepEqual(group.members, [...ids, 0, 0, 0, 0, 0, 0])
  assert.deepEqual([group.count, group.freeSlot], [6, 6])
  for (const person of people.values())
    assert.deepEqual([person.flags3 & 0x10, person.assignment & 0x20], [0, 0x20])
})

test('a later compatible M1 mover joins the already-running formation in its next free slot', () => {
  const w = createWorld(1, 'scalable')
  w.selected = [13, 15, 18]
  assert.equal(command(w, { x: -20, z: 35 }), true)
  for (let i = 0; i < 4; i++) tick(w, 1 / 12)
  w.selected = [14, 16, 17]
  assert.equal(command(w, { x: -20, z: 35 }), true)
  while (w.turn < 30) tick(w, 1 / 12)

  assert.equal(w.marching.length, 1)
  const g = w.marching[0]
  const u = w.units.find(u => u.id === 14)
  const person = u.native
  assert.deepEqual([g.count, g.freeSlot, g.members[5]], [5, 5, 0])
  assert.deepEqual(g.members.slice(0, 5), [13, 18, 15, 16, 17])
  assert.equal(person.assignment & 0x20, 0)

  tick(w, 1 / 12)

  assert.equal(w.turn, 31)
  assert.equal(w.marching.length, 1)
  assert.equal(w.marching[0], g)
  assert.equal(u.native, person)
  assert.deepEqual([g.count, g.freeSlot, g.members[5]], [6, 6, 14])
  assert.ok(person.assignment & 0x20)
})
