import assert from 'node:assert/strict'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { timberPhaseObjects } from '../app/timber-phase-index.ts'
import { looseTimberInCell } from '../app/timber-search.ts'
import { stateDigest } from '../scripts/bench-simulation.mjs'

const tree = (id, x = 0, z = 0) => ({ id, x, z, logs: 1, model: 11 })
const cellOf = t => (((Math.round((-t.z - 8) * 256) & 65535) >> 9) * 128 + ((Math.round((t.x + 8) * 256) & 65535) >> 9))
function* original(w, cell) {
  for (let i = w.trees.length - 1; i >= 0; i--) {
    const t = w.trees[i]
    if (cellOf(t) === cell) yield { id: t.id, class: t.logs > 0 ? 5 : 0, model: t.model, flags4: t.flags4 ?? 0, wood: Math.round(t.logs * 100) }
  }
}
const make = w => timberPhaseObjects(w, cellOf, cell => original(w, cell))

test('phase buckets preserve reverse ties, native seams, duplicates and live values', () => {
  const repeated = tree(9), w = { trees: [tree(1), tree(2, 255.999, -256), tree(3, -8.001953125, -8), repeated, repeated] }
  const indexed = make(w)
  for (const c of new Set(w.trees.map(cellOf))) assert.deepEqual([...indexed(c)], [...original(w, c)])
  const iterator = indexed(cellOf(repeated))
  assert.equal(iterator.next().value.id, 9)
  repeated.flags4 = 0x100000; repeated.logs = 327.68; repeated.model = 2
  assert.deepEqual(iterator.next().value, { id: 9, class: 5, model: 2, flags4: 0x100000, wood: 32768 })
  repeated.logs = 0
  assert.deepEqual([...indexed(cellOf(repeated))], [...original(w, cellOf(repeated))])
})

test('phase boundary roster edits cannot reuse old membership', () => {
  const w = { trees: [tree(1), tree(2)] }
  for (const mutate of [() => {}, () => w.trees.reverse(), () => w.trees.push(tree(3)), () => w.trees.splice(1, 1), () => { w.trees[0].x += 30 }, () => { w.trees = [tree(4, -256, 256)] }]) {
    mutate()
    const indexed = make(w)
    for (const c of new Set(w.trees.map(cellOf))) assert.deepEqual([...indexed(c)], [...original(w, c)])
  }
})

test('fog, never-consumed iterators and empty rosters do not synchronize positions', () => {
  const w = { trees: [tree(1)] }; let calls = 0
  const indexed = timberPhaseObjects(w, t => { calls++; return cellOf(t) }, c => original(w, c))
  indexed(0)
  assert.equal(calls, 0)
  assert.equal(looseTimberInCell({ objects: indexed, landFlags: 0, levelFlags: 4, playerTribe: 0, land: { flags: new Uint32Array(16384) } }, 0, 0), 0)
  assert.equal(calls, 0)
  const iterator = indexed(cellOf(w.trees[0]))
  assert.equal(calls, 0)
  iterator.next(); assert.equal(calls, 1)
  Array.from(indexed(cellOf(w.trees[0]))); assert.equal(calls, 1)
  Array.from(timberPhaseObjects({ trees: [] }, () => assert.fail('empty sync'), () => [])(0))
})

test('custom accessors and sparse arrays retain original fallback reads and errors', () => {
  for (const key of ['x', 'z', 'id', 'logs', 'model', 'flags4']) {
    const w = { trees: [tree(1)] }, t = w.trees[0], value = t[key]
    let reads = 0
    Object.defineProperty(t, key, { get() { reads++; return value }, configurable: true })
    const indexed = make(w); const iterator = indexed(0)
    assert.equal(reads, 0)
    const actual = [...iterator], actualReads = reads; reads = 0
    assert.deepEqual(actual, [...original(w, 0)])
    assert.equal(reads, actualReads)
  }
  const w = { trees: new Array(1) }
  assert.throws(() => [...make(w)(0)], TypeError)
  assert.throws(() => [...original(w, 0)], TypeError)
})

test('whole authored M6 and dirty-terrain search phases match untouched parent', { skip: !process.env.PND_TIMBER_BASELINE }, async () => {
  const { createWorld, tick } = await import('../app/model.ts')
  const parent = await import(pathToFileURL(`${process.env.PND_TIMBER_BASELINE}/app/model.ts`).href)
  const { stepLiveTimberSearches } = await import('../app/live-construction-runtime.ts')
  const old = await import(pathToFileURL(`${process.env.PND_TIMBER_BASELINE}/app/live-construction-runtime.ts`).href)
  const { refreshTimberSearch } = await import('../app/timber-search.ts')
  const a = parent.createWorld(6), b = createWorld(6)
  for (let turn = 0; turn < 120; turn++) {
    parent.tick(a, 1 / 12); tick(b, 1 / 12)
    assert.equal(stateDigest(b), stateDigest(a), `M6 turn ${turn}`)
  }
  for (const w of [a, b]) {
    refreshTimberSearch(w.timberSearches, { searchIndex: -1 }, 0x2020, 0)
    w.terrain[0] += 1; w.terrainVersion++
  }
  old.stepLiveTimberSearches(a); stepLiveTimberSearches(b)
  assert.equal(stateDigest(b), stateDigest(a), 'dirty synchronization and route invalidation ordering')
})

test('accessor-backed world roster takes untouched fallback without an admission read', () => {
  let reads = 0
  const trees = [tree(1)], w = {}
  Object.defineProperty(w, 'trees', { get() { reads++; return trees } })
  const indexed = make(w), actual = [...indexed(cellOf(trees[0]))], actualReads = reads
  reads = 0
  assert.deepEqual(actual, [...original(w, cellOf(trees[0]))])
  assert.equal(reads, actualReads)
})
