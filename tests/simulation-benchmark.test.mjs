// The protocol tests never import the engine or execute timed workloads.
import assert from 'node:assert/strict'
import test from 'node:test'
import { pairedOrder, stateDigest, summarize, validateVerification, workloadOptions } from '../scripts/bench-simulation.mjs'

test('world digest detects alias changes, cycles and ordered containers', () => {
  const make = () => {
    const shared = { id: 1 }, state = { units: [shared], registry: new Map([[1, shared]]) }
    state.self = state
    return state
  }
  assert.equal(stateDigest(make()), stateDigest(make()))
  const altered = make()
  altered.registry.set(1, { id: 1 })
  assert.notEqual(stateDigest(make()), stateDigest(altered), 'equal-looking records must retain object aliases')
  assert.notEqual(stateDigest(new Map([[1, 2], [3, 4]])), stateDigest(new Map([[3, 4], [1, 2]])))
  assert.notEqual(stateDigest(new Set([1, 2])), stateDigest(new Set([2, 1])))
  assert.equal(stateDigest({ b: 2, a: 1 }), stateDigest({ a: 1, b: 2 }), 'plain record insertion history is not a value difference')
})

test('world digest preserves sparse arrays, special numbers and field types', () => {
  const sparse = []
  sparse[1] = 1
  const pairs = [[-0, 0], [NaN, null], [Infinity, 'Infinity'], [undefined, 'undefined'], [sparse, [undefined, 1]], [1n, 1]]
  for (const [left, right] of pairs) assert.notEqual(stateDigest(left), stateDigest(right))
  assert.notEqual(stateDigest(Object.assign(Object.create(null), { x: 1 })), stateDigest({ x: 1 }))
  assert.throws(() => stateDigest({ get x() { return 1 } }), /accessor/)
  assert.throws(() => stateDigest({ action() {} }), /unsupported world value/)
  assert.throws(() => stateDigest(new WeakMap()), /unsupported world prototype/)
})

test('world digest checks typed bytes and view/buffer aliases without pool garbage', () => {
  const shared = new ArrayBuffer(8), independent = new ArrayBuffer(8)
  assert.equal(stateDigest(new Uint16Array([1, 2])), stateDigest(new Uint16Array([1, 2])))
  assert.notEqual(stateDigest(new Uint16Array([1, 2])), stateDigest(new Uint16Array([1, 3])))
  assert.notEqual(stateDigest(new Uint16Array([1, 2])), stateDigest(new Uint8Array([1, 0, 2, 0])))
  assert.notEqual(
    stateDigest({ a: new Uint8Array(shared, 0, 4), b: new Uint8Array(shared, 4, 4) }),
    stateDigest({ a: new Uint8Array(shared, 0, 4), b: new Uint8Array(independent, 4, 4) })
  )
  const view = new Uint8Array(shared, 0, 4), before = stateDigest(view)
  new Uint8Array(shared)[7] = 19
  assert.equal(stateDigest(view), before, 'unused backing bytes are outside the visible view')
  assert.notEqual(stateDigest({ view, buffer: shared }), stateDigest({ view, buffer: independent }), 'direct buffer aliases are observable')
})

test('workloads and statistical replicates have explicit bounded configurations', () => {
  const configured = workloadOptions({ scenarios: 'mission18,march', turns: 'mission18=3600,march=120', people: '200' })
  assert.deepEqual(configured.scenarios.map(value => [value.name, value.turns, value.people, value.seed]), [['mission18', 3600, null, null], ['march', 120, 200, null]])
  assert.deepEqual(pairedOrder(0), ['baseline', 'candidate'])
  assert.deepEqual(pairedOrder(1), ['candidate', 'baseline'])
  assert.deepEqual(summarize([4, 1, 3, 2]), { count: 4, median: 2.5, p95: 4, p99: 4, min: 1, max: 4 })
  for (const options of [{ scenarios: 'missing' }, { scenarios: 'march,march' }, { turns: '0' }, { turns: 'march=1,unknown=2' }, { people: '1.5' }, { seed: '-1' }])
    assert.throws(() => workloadOptions(options))
})

test('comparisons reject incomplete, stale or workload-mismatched correctness proof', () => {
  const report = { version: 1, harnessSha256: 'harness', sources: { baseline: 'base', candidate: 'head' }, runtime: { node: 'same' }, workload: workloadOptions({ scenarios: 'mission6', turns: '2' }) }
  const proof = {
    ...structuredClone(report), mode: 'verify', status: 'passed', verification: { clockTurns: 240, valuesEveryTurn: true },
    results: ['tick', 'clock'].map(driver => ({ scenario: 'mission6', driver, turns: 2, checkpoints: [{ turn: 0, sha256: '0'.repeat(64) }, { turn: 2, sha256: '1'.repeat(64) }] })),
  }
  assert.doesNotThrow(() => validateVerification(proof, report))
  const changes = [value => { value.status = 'failed' }, value => { value.sources.candidate = 'changed' }, value => { value.harnessSha256 = 'changed' }, value => { value.runtime.node = 'changed' }, value => { value.workload.scenarios[0].turns = 3 }, value => { value.results.pop() }, value => { value.results[0].checkpoints.pop() }, value => { value.results[0].checkpoints[0].turn = 1 }, value => { value.results[0].checkpoints[1].sha256 = 'corrupted' }]
  for (const alter of changes) { const changed = structuredClone(proof); alter(changed); assert.throws(() => validateVerification(changed, report)) }
})
