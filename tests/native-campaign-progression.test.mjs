import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  createNativeCampaignFlags,
  nativeCampaignMissions,
  nativeCampaignMissionStatus,
  transitionNativeCampaign,
} from '../app/native-campaign-progression.ts'

// Manually traced from the committed disassembly, not captured native execution.
// Completion is supplied by the caller before selector entry, never by this model.
const evidence = new URL('../decomp/research/native-campaign-progression/', import.meta.url)
const range = (first, last) => Array.from({ length: last - first + 1 }, (_, i) => first + i)
const snapshot = (completed = [], available = [], other = 0) =>
  range(1, 25).map(mission => other | (completed.includes(mission) ? 1 : 0) |
    (available.includes(mission) ? 4 : 0))
const marked = (flags, bit) => range(1, 25).filter(mission => (flags[mission - 1] & bit) !== 0)
const availableIncomplete = flags => range(1, 25).filter(mission => (flags[mission - 1] & 5) === 4)
const victory = mission => ({ kind: 'victory', mission })

test('source packet identifies the executable and retains every exact listing hash', () => {
  const provenance = JSON.parse(readFileSync(new URL('provenance.json', evidence), 'utf8'))
  assert.equal(provenance.executable.sha256, '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  assert.match(provenance.method, /not executed/)
  for (const file of provenance.files) {
    assert.equal(createHash('sha256').update(readFileSync(new URL(file.file, evidence))).digest('hex'), file.sha256)
  }
})

test('new native profile opens only mission 1 and allocates independent snapshots', () => {
  const flags = createNativeCampaignFlags()
  assert.deepEqual(nativeCampaignMissions, range(1, 25))
  assert.deepEqual(marked(flags, 1), [])
  assert.deepEqual(marked(flags, 4), [1])
  flags[0] = 255
  assert.deepEqual(createNativeCampaignFlags(), snapshot([], [1]))
  assert.deepEqual(transitionNativeCampaign(createNativeCampaignFlags(), { kind: 'return' }), {
    flags: snapshot([], [1]), recommendation: 1, resultState: 10, movie: null,
  })
})

test('completed, available and selectable are distinct native flag queries', () => {
  for (let byte = 0; byte <= 255; byte++) {
    const flags = Array(25).fill(byte)
    assert.deepEqual(nativeCampaignMissionStatus(flags, 17), {
      completed: (byte & 1) !== 0,
      available: (byte & 4) !== 0,
      selectable: (byte & 5) !== 0,
    })
  }
  assert.deepEqual(nativeCampaignMissionStatus(snapshot([9]), 9), {
    completed: true, available: false, selectable: true,
  })
  assert.equal(nativeCampaignMissionStatus(snapshot([], [], 2), 9).selectable, false)
})

// Expected mission sets and anchors are static oracles for specific assembly paths.
const cases = [
  ['win 1 opens 2', [1], [1], victory(1), [1, 2], 2],
  ['opening replay searches after the current mission, not from 1', [3, 4], [3], victory(3), [3, 5], 5],
  ['opening branch reaching 16 opens all four worlds', range(1, 15), range(1, 15), victory(15), range(1, 19), 16],
  ['completed 16 falls through to the visited-only fork scan', [14, 15, 16], [14], victory(14), [14, 16, 17], 17],
  ['opening replay can fall through every completed branch to 22', range(1, 21), [], victory(1), range(16, 22), 22],
  ['win 17 unlocks 20 but recommends 18', [16, 17], [16, 17, 18, 19], victory(17), [16, 17, 18, 19, 20], 18],
  ['fork replay does not open unvisited later worlds', [19], [], victory(19), [16], 16],
  ['right pair unlocks 21 independently', [18, 19], [18, 19], victory(19), [16, 18, 19, 21], 16],
  ['win 20 with incomplete right pair returns to fork', [16, 17, 20], [7, 16, 17, 20], victory(20), [7, 16, 17, 18, 20], 18],
  ['win 21 with incomplete left pair returns to fork', [18, 19, 21], [18, 19, 21], victory(21), [16, 18, 19, 21], 16],
  ['20 complete and right pair complete recommends 21', [16, 17, 18, 19, 20], [16, 17, 18, 19, 20], victory(20), [16, 17, 18, 19, 20, 21], 21],
  ['20 and 21 complete enter 22 even in a supplied inconsistent snapshot', [20, 21], [], victory(21), [22], 22],
  ['reaching 24 from the completed pair does not request the victory-24 movie', [20, 21, 22, 23], [], victory(21), [24], 24],
  ['win 22 advances to 23', [22], [], victory(22), [23], 23],
  ['unmarked 22 remains 22, proving this routine does not award completion', [], [], victory(22), [22], 22],
  ['win 24 opens 25 and requests outro', [24], [], victory(24), [25], 25, 'outro'],
  ['all late worlds completed still recommend 25', [23, 24, 25], [], victory(23), [25], 25],
  ['non-victory completed-only history does not reconstruct four-way availability', range(1, 15), [], { kind: 'return' }, [16], 16],
  ['non-victory common tail checks both pairs independently', [16, 17, 18, 19], [], { kind: 'return', playIntro: true }, [1, 20, 21], 1, 'intro'],
  ['all-complete non-victory returns to 25, not terminal state', range(1, 25), [], { kind: 'return' }, [20, 21, 25], 25],
]

for (const [name, completed, available, entry, expectedAvailable, recommendation, movie = null] of cases) {
  test(`static oracle: ${name}`, () => {
    const input = Object.freeze(snapshot(completed, available, 0xa2))
    const result = transitionNativeCampaign(input, Object.freeze(entry))
    assert.deepEqual(result, {
      flags: snapshot(completed, expectedAvailable, 0xa2), recommendation, resultState: 10, movie,
    })
    assert.notEqual(result.flags, input)
    assert.deepEqual(input, snapshot(completed, available, 0xa2))
    assert.deepEqual(transitionNativeCampaign(result.flags, entry), result, 'repeated entry is a flag-state fixed point')
  })
}

test('mission 25 victory preserves all flags, omits common unlocks, and leaves anchor ownership alone', () => {
  const input = Object.freeze(snapshot([16, 17, 18, 19, 25], [25], 0xa2))
  const result = transitionNativeCampaign(input, victory(25))
  assert.deepEqual(result, { flags: [...input], recommendation: null, resultState: 12, movie: null })
  assert.equal(result.flags[19] & 4, 0)
  assert.equal(result.flags[20] & 4, 0)
  assert.deepEqual(transitionNativeCampaign(result.flags, victory(25)), result)
})

test('all 16 fork completion combinations retain recommendation versus independent unlocks', () => {
  // Columns: completed16..19, recommendation, every newly available mission.
  // Each row follows 00412aae's visited-prefix scan, then 00412da8's pair tests.
  const forkOracles = [
    [[], 16, [16]],
    [[16], 17, [16, 17]],
    [[17], 16, [16]],
    [[16, 17], 18, [16, 17, 18, 20]],
    [[18], 16, [16]],
    [[16, 18], 17, [16, 17]],
    [[17, 18], 16, [16]],
    [[16, 17, 18], 19, [16, 17, 18, 19, 20]],
    [[19], 16, [16]],
    [[16, 19], 17, [16, 17]],
    [[17, 19], 16, [16]],
    [[16, 17, 19], 18, [16, 17, 18, 20]],
    [[18, 19], 16, [16, 21]],
    [[16, 18, 19], 17, [16, 17, 21]],
    [[17, 18, 19], 16, [16, 21]],
    [[16, 17, 18, 19], 20, [16, 17, 18, 19, 20, 21]],
  ]
  for (const [completed, recommendation, available] of forkOracles) {
    for (const mission of [16, 17, 18, 19]) {
      assert.deepEqual(transitionNativeCampaign(snapshot(completed), victory(mission)), {
        flags: snapshot(completed, available), recommendation, resultState: 10, movie: null,
      }, `C=${completed}; selected mission=${mission}`)
    }
  }
})

test('ordinary campaign can take 20 before the right fork without a global linear unlock', () => {
  let flags = createNativeCampaignFlags()
  for (const mission of range(1, 14)) {
    flags = [...flags]
    flags[mission - 1] |= 1 // External completion producer, not selector progression.
    const result = transitionNativeCampaign(flags, victory(mission))
    assert.equal(result.recommendation, mission + 1)
    assert.deepEqual(availableIncomplete(result.flags), [mission + 1])
    flags = result.flags
  }
  const route = [
    [15, 16, [16, 17, 18, 19]],
    [16, 17, [17, 18, 19]],
    [17, 18, [18, 19, 20]],
    [20, 18, [18, 19]],
    [18, 19, [19]],
    [19, 21, [21]],
    [21, 22, [22]],
    [22, 23, [23]],
    [23, 24, [24]],
    [24, 25, [25]],
    [25, null, []],
  ]
  for (const [mission, recommendation, available] of route) {
    assert.equal(nativeCampaignMissionStatus(flags, mission).selectable, true)
    flags = [...flags]
    flags[mission - 1] |= 1
    const result = transitionNativeCampaign(flags, victory(mission))
    assert.equal(result.recommendation, recommendation)
    assert.deepEqual(availableIncomplete(result.flags), available)
    assert.equal(result.resultState, mission === 25 ? 12 : 10)
    assert.equal(result.movie, mission === 24 ? 'outro' : null)
    flags = result.flags
  }
  assert.deepEqual(marked(flags, 1), range(1, 25))
})

test('right fork and mission 21 can finish before left fork and mission 20', () => {
  let flags = transitionNativeCampaign(snapshot(range(1, 15), range(1, 15)), victory(15)).flags
  const route = [
    [18, 16, [16, 17, 19]],
    [19, 16, [16, 17, 21]],
    [21, 16, [16, 17]],
    [16, 17, [17]],
    [17, 20, [20]],
    [20, 22, [22]],
  ]
  for (const [mission, recommendation, available] of route) {
    assert.equal(nativeCampaignMissionStatus(flags, mission).selectable, true)
    flags = [...flags]
    flags[mission - 1] |= 1
    const result = transitionNativeCampaign(flags, victory(mission))
    assert.equal(result.recommendation, recommendation)
    assert.deepEqual(availableIncomplete(result.flags), available)
    flags = result.flags
  }
})

test('defensive input guards reject invalid domains without changing the supplied flags', () => {
  const flags = Object.freeze(createNativeCampaignFlags())
  for (const mission of [0, -1, 26, 99, 1.5, NaN, Infinity, '1', null, undefined]) {
    assert.throws(() => transitionNativeCampaign(flags, victory(mission)), RangeError)
    assert.throws(() => nativeCampaignMissionStatus(flags, mission), RangeError)
  }
  for (const malformed of [[], Array(24).fill(0), Array(26).fill(0), Array(25), null,
    ...[-1, 256, 1.5, NaN, Infinity, '4', undefined].map(value => Array(25).fill(value))]) {
    assert.throws(() => transitionNativeCampaign(malformed, { kind: 'return' }), RangeError)
    assert.throws(() => nativeCampaignMissionStatus(malformed, 1), RangeError)
  }
  assert.throws(() => transitionNativeCampaign(flags, { kind: 'defeat' }), RangeError)
  assert.throws(() => transitionNativeCampaign(flags, { kind: 'return', playIntro: 1 }), TypeError)
  assert.deepEqual(flags, snapshot([], [1]))
})

test('a valid but unavailable selected mission is not mistaken for victory authorization', () => {
  const flags = Object.freeze(createNativeCampaignFlags())
  assert.equal(nativeCampaignMissionStatus(flags, 22).selectable, false)
  const result = transitionNativeCampaign(flags, victory(22))
  assert.deepEqual(marked(result.flags, 1), [])
  assert.equal(result.recommendation, 22)
  // This faithfully models the supplied selector snapshot, not a browser entry gate.
  assert.deepEqual(marked(result.flags, 4), [1, 22])
})
