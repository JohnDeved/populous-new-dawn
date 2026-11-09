// The protocol tests never import the engine or execute timed workloads.
import assert from 'node:assert/strict'
import test from 'node:test'
import { pairedOrder, stateDigest, summarize, validateTerrainWitness, validateVerification, workloadOptions } from '../scripts/bench-simulation.mjs'

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

test('terrain workloads retain authored populations and declare their untimed setup', () => {
  const configured = workloadOptions({ scenarios: 'bridge,armageddon,erosion', people: '400', seed: '123' })
  assert.deepEqual(configured.scenarios, [
    { name: 'bridge', turns: 96, people: null, seed: 123 },
    { name: 'armageddon', turns: 192, people: null, seed: 123 },
    { name: 'erosion', turns: 64, people: null, seed: 123 },
  ])
  assert.match(configured.scope, /ordinary Shaman worship/)
  assert.match(configured.scope, /one supplied Armageddon shot/)
  assert.match(configured.scope, /suspends ordinary movement during deformation/)
  assert.match(configured.scope, /stopping one turn before natural activation/)
  assert.match(configured.scope, /sampled compatibility surface and walk masks unchanged/)
  assert.deepEqual(workloadOptions({}).scenarios.map(value => value.name), ['mission18', 'mission6', 'march', 'combat', 'blocked', 'dismantle'], 'new workloads remain explicit opt-ins')
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

test('terrain comparisons require height changes and complete lifetimes, while masks and sampled surfaces may stay equal', () => {
  const report = { version: 1, harnessSha256: 'harness', sources: { baseline: 'base', candidate: 'head' }, runtime: { node: 'same' }, workload: workloadOptions({ scenarios: 'bridge,armageddon' }) }
  const activity = {
    initialHeightSha256: '1'.repeat(64), initialWalkMaskSha256: '2'.repeat(64),
    finalHeightSha256: '3'.repeat(64), finalWalkMaskSha256: '4'.repeat(64),
    initialSurfaceSha256: '5'.repeat(64), finalSurfaceSha256: '6'.repeat(64),
    surfaceSampleCount: 9409, surfaceValuesUnchanged: false,
    heightChangedTurns: 1, walkMaskChangedTurns: 1, surfaceChangedTurns: 1,
    initialTerrainVersion: 0, finalTerrainVersion: 1, initialLandVersion: 0, finalLandVersion: 1,
    terrainVersionChangedTurns: 1, landVersionChangedTurns: 1, terrainVersionIncrements: 1, landVersionIncrements: 1,
    prelude: { shamanPathObserved: true, shamanMoved: true, pathSearches: 1 },
  }
  const proof = {
    ...structuredClone(report), mode: 'verify', status: 'passed', verification: { clockTurns: 240, valuesEveryTurn: true },
    results: report.workload.scenarios.flatMap(spec => ['tick', 'clock'].map(driver => ({
      scenario: spec.name, driver, turns: spec.turns,
      checkpoints: [{ turn: 0, sha256: '0'.repeat(64) }, { turn: spec.turns, sha256: '1'.repeat(64) }],
      witness: { terrain: { ...structuredClone(activity), ...(spec.name === 'bridge'
        ? { bridgeTerrainVisits: 62, finalBridgeTurn: 63, headUses: 1, bridges: 1, effectRetired: true }
        : { armageddonPhase0Visits: 128, armageddonDeformationVisits: 64, finalTerrainRemaining: 0, finalArmageddonPhase: 1, maximumStagedParticipants: 4, arenaCenterHeight: 50 }) } },
    }))),
  }
  assert.doesNotThrow(() => validateVerification(proof, report))
  const unchangedSamples = structuredClone(proof)
  for (const row of unchangedSamples.results) {
    row.witness.terrain.walkMaskChangedTurns = 0
    row.witness.terrain.finalWalkMaskSha256 = row.witness.terrain.initialWalkMaskSha256
    row.witness.terrain.surfaceChangedTurns = 0
    row.witness.terrain.finalSurfaceSha256 = row.witness.terrain.initialSurfaceSha256
    row.witness.terrain.surfaceValuesUnchanged = true
  }
  assert.doesNotThrow(() => validateVerification(unchangedSamples, report), 'native deformation need not change passability bits or sampled surface values')
  const changes = [
    value => { delete value.results[0].witness },
    value => { value.results[0].witness.terrain.bridgeTerrainVisits-- },
    value => { value.results[0].witness.terrain.prelude.shamanPathObserved = false },
    value => { value.results[1].witness.terrain.walkMaskChangedTurns = -1 },
    value => { value.results[1].witness.terrain.walkMaskChangedTurns = 0 }, // Conflicts with its different final digest.
    value => { value.results[2].witness.terrain.armageddonDeformationVisits-- },
    value => { value.results[2].witness.terrain.maximumStagedParticipants = 0 },
    value => { value.results[2].witness.terrain.maximumStagedParticipants = Infinity },
    value => { value.results[2].witness.terrain.maximumStagedParticipants = '4' },
    value => { value.results[2].witness.terrain.finalArmageddonPhase = Infinity },
    value => { value.results[2].witness.terrain.finalArmageddonPhase = '1' },
    value => { value.results[2].witness.terrain.finalArmageddonPhase = 3 },
    value => { value.results[3].witness.terrain.heightChangedTurns = 0 },
    value => { value.results[0].witness.terrain.heightChangedTurns = -1 },
    value => { value.results[0].witness.terrain.heightChangedTurns = 0.5 },
    value => { value.results[0].witness.terrain.heightChangedTurns = value.results[0].turns + 1 },
    value => { value.results[0].witness.terrain.heightChangedTurns = Infinity },
    value => { value.results[3].witness.terrain.finalWalkMaskSha256 = 'invalid' },
    value => { value.results[0].witness.terrain.surfaceChangedTurns = -1 },
    value => { value.results[0].witness.terrain.surfaceChangedTurns = 0.5 },
    value => { value.results[0].witness.terrain.surfaceChangedTurns = value.results[0].turns + 1 },
    value => { value.results[0].witness.terrain.surfaceChangedTurns = Infinity },
    value => { value.results[0].witness.terrain.surfaceChangedTurns = '1' },
    value => { value.results[0].witness.terrain.surfaceChangedTurns = 0 },
    value => { value.results[0].witness.terrain.surfaceValuesUnchanged = true },
    value => { value.results[0].witness.terrain.finalSurfaceSha256 = 'invalid' },
    value => { value.results[0].witness.terrain.surfaceSampleCount = 0 },
    value => { value.results[0].witness.terrain.surfaceSampleCount = '9409' },
    value => { value.results[0].witness.terrain.terrainVersionIncrements = 0 },
    value => { value.results[0].witness.terrain.landVersionChangedTurns = 0 },
    value => { value.results[0].witness.terrain.terrainVersionChangedTurns = value.results[0].turns + 1 },
    value => { value.results[0].witness.terrain.terrainVersionChangedTurns = '1' },
    value => { value.results[0].witness.terrain.finalLandVersion = 2 },
    value => { value.results[0].witness.terrain.landVersionIncrements = Infinity },
    value => { value.results[0].witness.terrain.terrainVersionIncrements = 0.5 },
    value => { value.results[0].witness.terrain.terrainVersionIncrements = '1'; value.results[0].witness.terrain.finalTerrainVersion = '01' },
  ]
  for (const alter of changes) {
    const changed = structuredClone(proof)
    alter(changed)
    assert.throws(() => validateVerification(changed, report))
  }
  const partial = structuredClone(proof)
  partial.verification.clockTurns = 61
  for (const row of partial.results.filter(row => row.driver === 'clock')) {
    row.turns = 61
    row.checkpoints.at(-1).turn = 61
  }
  assert.throws(() => validateVerification(partial, report), /complete deformation lifecycle/)
})

function erosionWitness(turns) {
  const work = Math.min(turns, 63), retired = turns >= 64
  return { terrain: {
    initialHeightSha256: '1'.repeat(64), finalHeightSha256: '2'.repeat(64), heightChangedTurns: 1,
    initialWalkMaskSha256: '3'.repeat(64), finalWalkMaskSha256: '3'.repeat(64), walkMaskChangedTurns: 0,
    initialSurfaceSha256: '4'.repeat(64), finalSurfaceSha256: '4'.repeat(64), surfaceChangedTurns: 0,
    surfaceSampleCount: 9409, surfaceValuesUnchanged: true,
    initialTerrainVersion: 5, finalTerrainVersion: 5 + work, initialLandVersion: 5, finalLandVersion: 5 + work,
    terrainVersionChangedTurns: work, landVersionChangedTurns: work, terrainVersionIncrements: work, landVersionIncrements: work,
    erosionActivations: 1, erosionActivationAge: 0, erosionInitialRemaining: 63,
    erosionWorkVisits: work, erosionRetirementVisits: retired ? 1 : 0,
    erosionRemaining: Array.from({ length: Math.min(turns, 64) }, (_, index) => 63 - index),
    finalErosionRemaining: Math.max(64 - turns, 0), remainingErosionEffects: retired ? 0 : 1,
    effectRetired: retired, headUses: 1, headRemaining: 0,
    prelude: {
      mission: 3, headId: 101, headUsesBeforeActivation: 0, workBeforeActivation: 39,
      followersBeforeActivation: 1, suppliedShots: [], turns: 595,
      shamanPathObserved: true, shamanMoved: true, pathSearches: 1,
    },
  } }
}

function erosionProof(clockTurns = 240) {
  const report = { version: 1, harnessSha256: 'harness', sources: { baseline: 'base', candidate: 'head' }, runtime: { node: 'same' }, workload: workloadOptions({ scenarios: 'erosion' }) }
  const proof = {
    ...structuredClone(report), mode: 'verify', status: 'passed', verification: { clockTurns, valuesEveryTurn: true },
    results: ['tick', 'clock'].map(driver => {
      const turns = driver === 'tick' ? 64 : Math.min(clockTurns, 64)
      return { scenario: 'erosion', driver, turns, checkpoints: [{ turn: 0, sha256: '0'.repeat(64) }, { turn: turns, sha256: '1'.repeat(64) }], witness: erosionWitness(turns) }
    }),
  }
  return { report, proof }
}

test('erosion comparisons require natural activation, all work visits and retirement in both drivers', () => {
  const { report, proof } = erosionProof()
  assert.doesNotThrow(() => validateVerification(proof, report), 'unchanged sampled surface is disclosed despite 63 observed version increments')
  const fewerRefreshes = structuredClone(proof)
  for (const { witness: { terrain } } of fewerRefreshes.results) {
    terrain.terrainVersionIncrements = terrain.terrainVersionChangedTurns = 12
    terrain.landVersionIncrements = terrain.landVersionChangedTurns = 12
    terrain.finalTerrainVersion = terrain.initialTerrainVersion + 12
    terrain.finalLandVersion = terrain.initialLandVersion + 12
  }
  assert.doesNotThrow(() => validateVerification(fewerRefreshes, report), 'an erosion work visit refreshes terrain only when its erode pass requests a terrain update')
  const changes = [
    value => { value.erosionActivations = 0 },
    value => { value.erosionActivations = 2 },
    value => { value.erosionActivationAge = 1 },
    value => { value.erosionInitialRemaining = 64 },
    value => { value.erosionWorkVisits = 62 },
    value => { value.erosionRetirementVisits = 0 },
    value => { value.erosionRemaining.splice(20, 1) },
    value => { value.erosionRemaining[20]++ },
    value => { value.finalErosionRemaining = 1 },
    value => { value.remainingErosionEffects = 1 },
    value => { value.effectRetired = false },
    value => { value.headUses = 2 },
    value => { value.headRemaining = 1 },
    value => { value.prelude.headUsesBeforeActivation = 1 },
    value => { value.prelude.workBeforeActivation = 40 },
    value => { value.prelude.suppliedShots.push({ spell: 'erosion', count: 1 }) },
    value => { value.prelude.shamanMoved = false },
    value => { value.prelude.shamanMoved = 'true' },
    value => { value.prelude.pathSearches = Infinity },
    value => { value.prelude.followersBeforeActivation = 0.5 },
    value => { value.prelude.turns = 2401 },
    value => { value.surfaceValuesUnchanged = false },
    value => { value.terrainVersionIncrements = 0; value.terrainVersionChangedTurns = 0; value.finalTerrainVersion = value.initialTerrainVersion },
    value => { value.heightChangedTurns = 0; value.finalHeightSha256 = value.initialHeightSha256 },
  ]
  for (const alter of changes) {
    const changed = structuredClone(proof)
    alter(changed.results[1].witness.terrain)
    assert.throws(() => validateVerification(changed, report))
  }
  const partial = erosionProof(63)
  assert.throws(() => validateVerification(partial.proof, partial.report), /complete deformation lifecycle/, 'a complete work phase without retirement is still a partial clock proof')
})

test('erosion diagnostic prefixes accept the observed partial lifecycle without claiming retirement', () => {
  const spec = { name: 'erosion' }
  for (const [turns, workVisits, retirementVisits, remaining] of [[1, 1, 0, 63], [32, 32, 0, 32], [63, 63, 0, 1], [64, 63, 1, 0], [96, 63, 1, 0]]) {
    const witness = erosionWitness(turns)
    assert.deepEqual([witness.terrain.erosionWorkVisits, witness.terrain.erosionRetirementVisits, witness.terrain.finalErosionRemaining], [workVisits, retirementVisits, remaining])
    assert.doesNotThrow(() => validateTerrainWitness(spec, witness, turns))
    const invalid = structuredClone(witness)
    invalid.terrain.erosionRetirementVisits = retirementVisits ? 0 : 1
    assert.throws(() => validateTerrainWitness(spec, invalid, turns))
  }
  const unchangedPrefix = erosionWitness(1)
  unchangedPrefix.terrain.heightChangedTurns = 0
  unchangedPrefix.terrain.finalHeightSha256 = unchangedPrefix.terrain.initialHeightSha256
  assert.doesNotThrow(() => validateTerrainWitness(spec, unchangedPrefix, 1), 'a short diagnostic prefix need not have produced an actual height change yet')
})
