import assert from 'node:assert/strict'
import test from 'node:test'
import { orderSound } from '../app/audio.ts'

function fixture(units, selected = []) {
  const calls = []
  const scene = { world: { units, selected }, onSound: cue => { calls.push(cue) } }
  return { scene, calls }
}

// Independent exhaustive form of the previous audible rule: an existing selected
// Shaman wins, any other existing selected follower acknowledges, otherwise silence.
function expected(units, selected) {
  const matching = units.filter(unit => selected.includes(unit.id))
  return matching.length ? [matching.some(unit => unit.kind === 'shaman') ? 0x19 : 0x37] : []
}

test('ordinary selected followers use the existing Shaman or follower acknowledgement', () => {
  const units = [{ id: 3, kind: 'brave' }, { id: 5, kind: 'shaman' }, { id: 8, kind: 'warrior' }]
  for (const selected of [[], [3], [5], [8], [3, 8], [3, 5, 8], [9], [9, 8], [5, 5]]) {
    const { scene, calls } = fixture(units, selected)
    orderSound(scene)
    assert.deepEqual(calls, expected(units, selected), JSON.stringify(selected))
  }
})

test('explicit pre-command selection takes precedence over the current selection', () => {
  const { scene, calls } = fixture([{ id: 1, kind: 'brave' }, { id: 2, kind: 'shaman' }], [2])
  orderSound(scene, [1])
  orderSound(scene, [])
  orderSound(scene, [99])
  assert.deepEqual(calls, [0x37])
  orderSound(scene)
  assert.deepEqual(calls, [0x37, 0x19])
})

test('all small roster and selection combinations retain the exhaustive acknowledgement rule', () => {
  const choices = [
    null,
    { id: 0, kind: 'brave' },
    { id: 0, kind: 'shaman' },
    { id: 1, kind: 'warrior' },
    { id: 1, kind: 'shaman' },
    { id: 2, kind: 'preacher' },
  ]
  const selections = [[]]
  for (const a of [0, 1, 2, 99])
    for (const b of [undefined, 0, 1, 2, 99])
      for (const c of [undefined, 0, 1, 2, 99])
        selections.push([a, b, c].filter(id => id !== undefined))
  let cases = 0
  for (const a of choices)
    for (const b of choices)
      for (const c of choices) {
        const units = [a, b, c].filter(Boolean)
        for (const selected of selections) {
          const { scene, calls } = fixture(units, selected)
          orderSound(scene)
          assert.deepEqual(calls, expected(units, selected))
          cases++
        }
      }
  assert.equal(cases, 21816)
})

test('acknowledgement preserves the supplied world and selection, including unrelated state', () => {
  const units = Object.freeze([
    Object.freeze({ id: 7, kind: 'brave', team: 'red', hp: 0 }),
    Object.freeze({ id: 9, kind: 'shaman', team: 'blue', hp: 100 }),
  ])
  const selected = Object.freeze([7, 7, 42])
  const { scene, calls } = fixture(units, selected)
  scene.world.randomState = 123
  Object.freeze(scene.world)
  orderSound(scene)
  assert.deepEqual(calls, [0x37], 'this cue selector must not invent new ownership or HP filters')
  assert.equal(scene.world.units, units)
  assert.equal(scene.world.selected, selected)
  assert.equal(scene.world.randomState, 123)
})

test('large all-follower groups, missing IDs and late Shamans match the same rule', () => {
  const units = Array.from({ length: 10000 }, (_, id) => ({ id, kind: 'brave' }))
  const selected = units.map(unit => unit.id)
  const { scene, calls } = fixture(units, selected)
  orderSound(scene)
  units.at(-1).kind = 'shaman'
  orderSound(scene)
  scene.world.units = units.slice(0, -1)
  orderSound(scene, [9999])
  orderSound(scene, [9998, 9999])
  assert.deepEqual(calls, [0x37, 0x19, 0x37])
})

test('the selected Shaman still submits exactly one callback and preserves callback errors', () => {
  const failure = new Error('audio callback failed')
  let calls = 0
  const { scene } = fixture([{ id: 1, kind: 'shaman' }, { id: 2, kind: 'shaman' }], [1, 2])
  scene.onSound = cue => {
    calls++
    assert.equal(cue, 0x19)
    throw failure
  }
  assert.throws(() => orderSound(scene), error => error === failure)
  assert.equal(calls, 1)
})
