import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'

const source = readFileSync(new URL('../app/scene-entities.ts', import.meta.url), 'utf8')
const start = source.indexOf('function refreshShrineGroups(')
const end = source.indexOf('\nexport function updateUnitsFrame(', start)
assert.ok(start > 0 && end > start)
const refresh = new Function(
  `${stripTypeScriptTypes(source.slice(start, end))}; return refreshShrineGroups`
)()
const owner = () => ({ byId: new Map(), buckets: [] })
const original = shrines => {
  const map = new Map()
  shrines.forEach(shrine => {
    const { id } = shrine
    const bucket = map.get(id)
    if (bucket) bucket.push(shrine)
    else map.set(id, [shrine])
  })
  return map
}
const compare = (actual, expected) => {
  assert.deepEqual([...actual.keys()], [...expected.keys()])
  for (const [id, records] of expected) {
    assert.equal(actual.get(id).length, records.length)
    records.forEach((record, index) => assert.equal(actual.get(id)[index], record))
  }
}

test('preserves first-key and duplicate-record order, including accepted unusual IDs', () => {
  const records = [2, 1, 2, NaN, NaN, -0, 0, undefined].map(id => ({ id }))
  compare(refresh(owner(), records), original(records))
})
test('reuses every bucket for a stable roster across frames', () => {
  const state = owner(),
    records = Array.from({ length: 100 }, (_, id) => ({ id }))
  refresh(state, records)
  const first = state.buckets.slice()
  for (let frame = 0; frame < 100; frame++) {
    compare(refresh(state, records), original(records))
    first.forEach((bucket, i) => assert.equal(state.buckets[i], bucket))
  }
})
test('removes old records and keys on reorder, despawn and checkpoint object replacement', () => {
  const state = owner(),
    first = [{ id: 1 }, { id: 2 }, { id: 3 }]
  refresh(state, first)
  const discarded = state.buckets[2]
  const replacement = [{ id: 3 }, { id: 1 }, { id: 3 }]
  compare(refresh(state, replacement), original(replacement))
  assert.equal(state.buckets.length, 2)
  assert.deepEqual(discarded, [])
  assert.equal(
    state.buckets.flat().some(record => first.includes(record)),
    false
  )
  compare(refresh(state, []), new Map())
  assert.deepEqual(state.buckets, [])
})
test('isolates scene owners and preserves array forEach sparse-input semantics', () => {
  const one = owner(),
    two = owner(),
    records = []
  records[2] = { id: 7 }
  compare(refresh(one, records), original(records))
  refresh(two, [{ id: 7 }])
  assert.notEqual(one.byId, two.byId)
  assert.notEqual(one.buckets[0], two.buckets[0])
  refresh(two, [])
  assert.equal(one.byId.get(7)[0], records[2])
})
test('reads each ID once and retains exact synchronous consumer wiring', () => {
  let reads = 0
  refresh(owner(), [
    {
      get id() {
        reads++
        return 4
      },
    },
  ])
  assert.equal(reads, 1)
  assert.match(source, /refreshShrineGroups\(shrineGroups, scene\.world\.shrines\)/)
  assert.match(
    source,
    /unitAnimation\(scene\.world, u, selectedIds, buildingsById, shrineBuckets\)/
  )
})
