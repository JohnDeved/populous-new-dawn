import assert from 'node:assert/strict'
import test from 'node:test'
import { createBlastPreparation, findProposedBlastPixel } from '../qa/blast-ordinary/preparation.mjs'

// Fake copied records only: no simulation, browser, runtime module or fixture.
function observation(turn = 100, overrides = {}) {
  return {
    turn,
    state: { failures: [], actor: { id: 54, hp: 100 }, cameraSettled: true, inputMask: 0 },
    response: [{ id: 19, orderModel: 19, speed: 60, fighting: false, position: { x: turn, y: 200 } }],
    distance: 8, targetError: null, actorFighting: false,
    box: { x: 20, y: 30, width: 10, height: 20 },
    existingHit: { x: 25, y: 40 }, nextHit: { x: 25, y: 40 },
    inspection: { canvasOwned: 3, outsideCanvas: 1, targetHit: 1, nullHit: 1, otherHit: 1,
      sampleLimit: 250, samples: [{ x: 25, y: 40, canvasOwned: true, hitId: 19, geometricId: 19 }] },
    renderedBody: { originalTargetPresent: true, sameIdIsOriginal: true, targetId: 19, hp: 100,
      team: 'green', kind: 'warrior', inside: null, activeNative: { id: 19, class: 1, flags2: 0 },
      visible: true, pickable: true, visibleLayer: true, layerHasPainterSource: true },
    moving: true, live: true, phenotype: true, ready: false, phase: 'preparing', rejections: [],
    ...overrides,
  }
}

test('response onset, range onset and pixel miss survive tail eviction and input/output mutation', () => {
  const preparation = createBlastPreparation({ targetId: 19, capacity: 2 })
  const first = observation(100, { distance: 12, targetError: 'out of range', live: false })
  preparation.observe(first)
  first.response[0].position.x = -1
  first.state.actor.hp = 0
  const inRange = observation(101, { existingHit: null, nextHit: null })
  preparation.observe(inRange)
  inRange.inspection.samples[0].hitId = -1
  for (let turn = 102; turn < 108; turn++) preparation.observe(observation(turn))
  const report = preparation.read()
  assert.equal(report.firstLiveResponse.turn, 100)
  assert.equal(report.firstLiveResponse.response[0].position.x, 100)
  assert.equal(report.firstLiveResponse.state.actor.hp, 100)
  assert.equal(report.firstInRangeResponse.turn, 101)
  assert.equal(report.firstPixelMiss.turn, 101)
  assert.equal(report.firstPixelMiss.inspection.samples[0].hitId, 19)
  assert.equal(report.lastLiveResponse.turn, 107)
  assert.deepEqual(report.rows.map(row => row.turn), [106, 107])
  report.firstLiveResponse.response[0].position.x = -2
  report.firstInRangeResponse.state.actor.hp = -2
  report.lastLiveResponse.response.length = 0
  report.rows[0].inspection.samples[0].hitId = -2
  const reread = preparation.read()
  assert.equal(reread.firstLiveResponse.response[0].position.x, 100)
  assert.equal(reread.firstInRangeResponse.state.actor.hp, 100)
  assert.equal(reread.lastLiveResponse.response[0].id, 19)
  assert.equal(reread.rows[0].inspection.samples[0].hitId, 19)
})

test('fixed gate failures retain the first raw row without following caller rejection names', () => {
  const preparation = createBlastPreparation({ targetId: 19, capacity: 1 })
  const first = observation(100, { response: [], live: false, moving: false, distance: null,
    targetError: 'missing target', existingHit: null, nextHit: null, phenotype: false,
    state: { cameraSettled: false, inputMask: 1, failures: ['actorHealth'] },
    renderedBody: { visible: false }, phase: 'search', rejections: ['unbounded-name'] })
  preparation.observe(first)
  preparation.observe(observation(101))
  const report = preparation.read()
  assert.deepEqual(Object.keys(report.firstFailures), ['response', 'live', 'moving', 'range', 'camera', 'body', 'pixel', 'phenotype'])
  for (const failed of Object.values(report.firstFailures)) {
    assert.equal(failed.turn, 100)
    assert.equal(failed.phase, 'search')
    assert.deepEqual(failed.rejections, ['unbounded-name'])
  }
  report.firstFailures.live.state.failures.length = 0
  assert.deepEqual(preparation.read().firstFailures.live.state.failures, ['actorHealth'])
})

test('a pixel miss is retained only with the other live, moving, range and camera gates', () => {
  const preparation = createBlastPreparation({ targetId: 19 })
  const misses = { existingHit: null, nextHit: null }
  for (const overrides of [{ pixelSearchAttempted: false }, { live: false }, { moving: false }, { distance: 6 }, { targetError: 'out of range' },
    { state: { cameraSettled: false, inputMask: 0 } }, { state: { cameraSettled: true, inputMask: 1 } },
    { nextHit: { x: 25, y: 40 } }]) {
    preparation.observe(observation(100, { ...misses, ...overrides }))
    assert.equal(preparation.read().firstPixelMiss, null)
  }
  preparation.observe(observation(101, { ...misses, phenotype: false, renderedBody: { visible: false } }))
  assert.equal(preparation.read().firstPixelMiss.turn, 101)
})

test('initial absent or different response waits; losing the observed target model19 response stops', () => {
  const preparation = createBlastPreparation({ targetId: 19 })
  assert.deepEqual(preparation.observe(observation(100, { response: [] })), { stopReason: null })
  assert.deepEqual(preparation.observe(observation(101, { response: [{ id: 20, orderModel: 19 }] })), { stopReason: null })
  assert.equal(preparation.read().firstLiveResponse, null)
  preparation.observe(observation(102))
  const terminal = observation(103, { response: [] })
  assert.deepEqual(preparation.observe(terminal), { stopReason: 'response-ended' })
  terminal.state.actor.hp = -1
  assert.deepEqual(preparation.observe(observation(104)), { stopReason: 'response-ended' })
  const report = preparation.read()
  assert.equal(report.firstTerminal.turn, 103)
  assert.equal(report.firstTerminal.state.actor.hp, 100)
  assert.equal(report.lastLiveResponse.turn, 102)
  assert.equal(report.total, 4)
  report.firstTerminal.turn = 999
  assert.equal(preparation.read().firstTerminal.turn, 103)
})

test('a changed response order cannot conceal the end of the model19 response', () => {
  const preparation = createBlastPreparation({ targetId: 19 })
  preparation.observe(observation())
  assert.equal(preparation.observe(observation(101, { response: [{ id: 19, orderModel: 3 }] })).stopReason, 'response-ended')
})

test('death, removal, deletion and identity loss stop even before any response appeared', () => {
  for (const [change, reason] of [
    [{ hp: 0 }, 'target-dead'],
    [{ originalTargetPresent: false, sameIdIsOriginal: false }, 'target-removed'],
    [{ sameIdIsOriginal: false }, 'target-replaced'],
    [{ targetId: 20 }, 'target-replaced'],
    [{ activeNative: { id: 19, class: 1, flags2: 1 } }, 'target-removed'],
  ]) {
    const preparation = createBlastPreparation({ targetId: 19 })
    const row = observation(100, { response: [] })
    Object.assign(row.renderedBody, change)
    assert.equal(preparation.observe(row).stopReason, reason)
    assert.equal(preparation.read().firstTerminal.turn, 100)
    assert.equal(preparation.read().firstLiveResponse, null)
    assert.equal(preparation.observe(observation(101)).stopReason, reason)
  }
})

test('retention defaults to 96 copied rows while inspection counts cover all observations', () => {
  const preparation = createBlastPreparation({ targetId: 19 })
  for (let turn = 0; turn < 120; turn++) preparation.observe(observation(turn))
  const report = preparation.read()
  assert.equal(report.capacity, 96)
  assert.equal(report.total, 120)
  assert.equal(report.dropped, 24)
  assert.equal(report.rows.length, 96)
  assert.equal(report.rows[0].turn, 24)
  assert.equal(report.firstLiveResponse.turn, 0)
  assert.deepEqual(report.inspectionTotals, { reads: 120, total: 480, canvasOwned: 360,
    outsideCanvas: 120, targetHit: 120, nullHit: 120, otherHit: 120, sampleCount: 120 })
  assert.equal('complete' in report, false)
  assert.equal('passed' in report, false)
})

test('invalid target identity and unbounded retention are rejected', () => {
  for (const capacity of [0, 97, -1, 1.5, Infinity])
    assert.throws(() => createBlastPreparation({ targetId: 19, capacity }), /capacity/)
  for (const targetId of [0, -1, 1.5, null, undefined])
    assert.throws(() => createBlastPreparation({ targetId }), /targetId/)
})

// Source chronology: buildingCounterattack includes occupied-building residents,
// queues model19, and person initialization leaves the building. A later housed
// sample ends the already observed outdoor response, not its initial wait.
test('initial housing waits, then a real response followed by housing stops without rearming', () => {
  for (const inside of [0, 71]) {
    const preparation = createBlastPreparation({ targetId: 19 })
    const housed = observation(309, { response: [], live: true, moving: false, box: null,
      existingHit: null, nextHit: null, distance: null, targetError: 'missing target' })
    Object.assign(housed.renderedBody, { inside, visible: false, pickable: false, activeNative: null })
    assert.equal(preparation.observe(housed).stopReason, null)
    assert.equal(preparation.read().firstLiveResponse, null)
    assert.equal(preparation.read().rows[0].renderedBody.inside, inside)
    assert.equal(preparation.observe(observation(423)).stopReason, null)
    assert.equal(preparation.read().firstLiveResponse.turn, 423)
    assert.equal(preparation.observe({ ...housed, turn: 440 }).stopReason, 'target-housed')
    assert.equal(preparation.read().firstTerminal.turn, 440)
    assert.equal(preparation.observe(observation(441)).stopReason, 'target-housed')
  }
})

test('initial housing cannot outlive the unchanged no-response setup deadline', () => {
  const preparation = createBlastPreparation({ targetId: 19, maximumSetupTurn: 1800 })
  const housed = observation(1799, { response: [] })
  housed.renderedBody.inside = 71
  assert.equal(preparation.observe(housed).stopReason, null)
  assert.equal(preparation.observe({ ...housed, turn: 1800 }).stopReason, 'setup-turn-limit')
  assert.equal(preparation.read().firstLiveResponse, null)
  assert.equal(preparation.read().firstTerminal.turn, 1800)
  assert.equal(preparation.observe(observation(1801)).stopReason, 'setup-turn-limit')
  assert.equal(preparation.read().total, 2)
  for (const maximumSetupTurn of [0, 1801, Infinity])
    assert.throws(() => createBlastPreparation({ targetId: 19, maximumSetupTurn }), /maximumSetupTurn/)
})


test('baseline proposes one observed owned target pixel without claiming a neighborhood or prior hover', () => {
  const calls = [], proposed = findProposedBlastPixel([{ x: 472, y: 392 }, { x: 469, y: 392 }], 19, point => {
    calls.push(point)
    return { canvasOwned: true, hitId: point.x === 467 ? 19 : 1207 }
  })
  assert.deepEqual(calls, [{ x: 470, y: 390 }, { x: 467, y: 390 }])
  assert.deepEqual(proposed, { x: 467, y: 390, kind: 'proposed-pixel' })
  assert.equal('interiorRadius' in proposed, false)
  assert.equal('hover' in proposed, false)
  assert.equal(findProposedBlastPixel([{ x: 469, y: 392 }], 19, () => ({ canvasOwned: false, hitId: 19 })), null)
  assert.equal(findProposedBlastPixel([{ x: 469, y: 392 }], 19, () => ({ canvasOwned: true, hitId: 1207 })), null)
})

test('baseline pixel search stays within the original nine first-tested pixels and ignores duplicate points', () => {
  let calls = 0
  const candidates = Array.from({ length: 9 }, () => ({ x: 20, y: 30 }))
  assert.equal(findProposedBlastPixel(candidates, 19, () => { calls++; return { canvasOwned: true, hitId: null } }), null)
  assert.equal(calls, 1)
  assert.throws(() => findProposedBlastPixel([...candidates, { x: 2, y: 2 }], 19, () => null), /At most nine/)
})

test('baseline can retain actual in-range evidence below seven; candidate margin remains declared', () => {
  const row = observation(10, { distance: 2, existingHit: null, nextHit: { x: 10, y: 20, kind: 'proposed-pixel' }, preparationKind: 'proposed-pixel' })
  const baseline = createBlastPreparation({ targetId: 19, minimumDistance: 0 }), candidate = createBlastPreparation({ targetId: 19 })
  baseline.observe(row); candidate.observe(row)
  assert.equal(baseline.read().firstInRangeResponse.turn, 10)
  assert.equal(baseline.read().firstFailures.pixel, null)
  assert.equal(candidate.read().firstInRangeResponse, null)
  assert.equal(candidate.read().minimumDistance, 7)
})
