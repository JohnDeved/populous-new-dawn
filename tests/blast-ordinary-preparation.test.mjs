import assert from 'node:assert/strict'
import test from 'node:test'
import { createBlastPreparation, releaseHeldBlast, findProposedBlastPixel } from '../qa/blast-ordinary/preparation.mjs'

// Fake copied records only: no simulation, browser, runtime module or fixture.
function observation(turn = 100, overrides = {}) {
  return {
    turn,
    state: { failures: [], actor: { id: 54, hp: 100 }, cameraSettled: true, inputMask: 0 },
    response: [{ id: 19, orderModel: 3, speed: 60, fighting: false, position: { x: turn, y: 200 } }],
    distance: 8, targetError: null, actorFighting: false,
    box: { x: 20, y: 30, width: 10, height: 20 },
    existingHit: { x: 25, y: 40 }, nextHit: { x: 25, y: 40 },
    inspection: { canvasOwned: 3, outsideCanvas: 1, targetHit: 1, nullHit: 1, otherHit: 1,
      sampleLimit: 250, samples: [{ x: 25, y: 40, canvasOwned: true, hitId: 19, geometricId: 19 }] },
    renderedBody: { originalTargetPresent: true, sameIdIsOriginal: true, targetId: 19, hp: 100,
      team: 'blue', kind: 'brave', inside: null, activeNative: { id: 19, class: 1, flags2: 0 },
      visible: true, pickable: true, visibleLayer: true, layerHasPainterSource: true },
    stationary: true, live: true, phenotype: true, ready: false, phase: 'preparing', rejections: [],
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
  const first = observation(100, { response: [], live: false, stationary: false, distance: null,
    targetError: 'missing target', existingHit: null, nextHit: null, phenotype: false,
    state: { cameraSettled: false, inputMask: 1, failures: ['actorHealth'] },
    renderedBody: { visible: false }, phase: 'search', rejections: ['unbounded-name'] })
  preparation.observe(first)
  preparation.observe(observation(101))
  const report = preparation.read()
  assert.deepEqual(Object.keys(report.firstFailures), ['response', 'live', 'stationary', 'range', 'camera', 'body', 'pixel', 'phenotype'])
  for (const failed of Object.values(report.firstFailures)) {
    assert.equal(failed.turn, 100)
    assert.equal(failed.phase, 'search')
    assert.deepEqual(failed.rejections, ['unbounded-name'])
  }
  report.firstFailures.live.state.failures.length = 0
  assert.deepEqual(preparation.read().firstFailures.live.state.failures, ['actorHealth'])
})

test('a pixel miss is retained only with the other live, stationary, range and camera gates', () => {
  const preparation = createBlastPreparation({ targetId: 19 })
  const misses = { existingHit: null, nextHit: null }
  for (const overrides of [{ pixelSearchAttempted: false }, { live: false }, { stationary: false }, { distance: 6 }, { targetError: 'out of range' },
    { state: { cameraSettled: false, inputMask: 0 } }, { state: { cameraSettled: true, inputMask: 1 } },
    { nextHit: { x: 25, y: 40 } }]) {
    preparation.observe(observation(100, { ...misses, ...overrides }))
    assert.equal(preparation.read().firstPixelMiss, null)
  }
  preparation.observe(observation(101, { ...misses, phenotype: false, renderedBody: { visible: false } }))
  assert.equal(preparation.read().firstPixelMiss.turn, 101)
})

test('initial absent or different response waits; losing the observed target model3 movement stops', () => {
  const preparation = createBlastPreparation({ targetId: 19 })
  assert.deepEqual(preparation.observe(observation(100, { response: [] })), { stopReason: null })
  assert.deepEqual(preparation.observe(observation(101, { response: [{ id: 20, orderModel: 3 }] })), { stopReason: null })
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

test('a changed response order cannot conceal the end of the model3 movement', () => {
  const preparation = createBlastPreparation({ targetId: 19 })
  preparation.observe(observation())
  assert.equal(preparation.observe(observation(101, { response: [{ id: 19, orderModel: 19 }] })).stopReason, 'response-ended')
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
// queues a movement order, and person initialization leaves the building. A later housed
// sample ends the already observed outdoor response, not its initial wait.
test('initial housing waits, then a real response followed by housing stops without rearming', () => {
  for (const inside of [0, 71]) {
    const preparation = createBlastPreparation({ targetId: 19 })
    const housed = observation(309, { response: [], live: true, stationary: false, box: null,
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

function heldFixture({ failPreparation = false, failCancellation = false, dirtyRelease = false } = {}) {
  const log = [], retained = [], state = { mode: 'blast', selected: [3], buttons: 0, castCount: 0, lastOrderTurn: 70 }
  const prepared = { turn: 90, point: { x: 30, y: 40 } }, failure = Error('expired original hover')
  const callbacks = {
    press: async () => { log.push('down'); state.buttons = 1 },
    prepare: async () => { log.push('read'); if (failPreparation) throw failure; return prepared },
    release: async value => { log.push(value ? 'up-cast' : 'up-cancelled'); state.buttons = 0; if (value || dirtyRelease) state.castCount++ },
    cancel: async () => { log.push('escape'); if (failCancellation) return; if (state.mode) state.mode = null; else state.selected = [] },
    read: async () => ({ ...state, selected: [...state.selected] }),
    retain: value => retained.push(structuredClone(value)),
  }
  return { callbacks, log, retained, state, prepared, failure }
}
test('held Blast preparation leaves only fresh read then ordinary up after the press', async () => {
  const f = heldFixture()
  assert.equal(await releaseHeldBlast(f.callbacks), f.prepared)
  assert.deepEqual(f.log, ['down', 'read', 'up-cast'])
  assert.equal(f.state.castCount, 1)
  assert.deepEqual(f.retained, [])
})
test('expired held preparation clears mode and followers before up without cast or order', async () => {
  const f = heldFixture({ failPreparation: true })
  await assert.rejects(releaseHeldBlast(f.callbacks), error => error === f.failure)
  assert.deepEqual(f.log, ['down', 'read', 'escape', 'escape', 'up-cancelled'])
  assert.deepEqual(f.retained.at(-1).cancelled.selected, [])
  assert.equal(f.retained.at(-1).cancelled.mode, null)
  assert.equal(f.retained.at(-1).after.castCount, 0)
  assert.equal(f.retained.at(-1).after.lastOrderTurn, 70)
  assert.deepEqual(f.retained[0].before.selected, [3], 'earlier retained state stays detached')
})
test('uncleared held mode or selection blocks mouse-up; cleanup cast is retained and rejected', async () => {
  const blocked = heldFixture({ failPreparation: true, failCancellation: true })
  await assert.rejects(releaseHeldBlast(blocked.callbacks), AggregateError)
  assert.deepEqual(blocked.log, ['down', 'read', 'escape', 'escape'])
  const dirty = heldFixture({ failPreparation: true, dirtyRelease: true })
  await assert.rejects(releaseHeldBlast(dirty.callbacks), AggregateError)
  assert.equal(dirty.retained.at(-1).after.castCount, 1)
})

test('admission latch retains detached success and settles early and late failures', async () => {
  const { createBlastAdmission } = await import('../qa/blast-ordinary/preparation.mjs')
  const latch = createBlastAdmission(), value = { turn: 5, selected: [3] }, early = latch.wait()
  latch.accept(value); value.selected[0] = 4
  assert.deepEqual(await early, { turn: 5, selected: [3] })
  const late = await latch.wait(); late.selected[0] = 5
  assert.deepEqual(await latch.wait(), { turn: 5, selected: [3] })
  assert.throws(() => latch.accept(value), /already settled/)
  const failed = createBlastAdmission(); failed.fail(Error('release rejected'))
  await assert.rejects(failed.wait(), /release rejected/)
})

test('missing input and abort bound the host waiter without an unhandled rejection', async () => {
  const { createBlastAdmission, waitForBlastAdmission } = await import('../qa/blast-ordinary/preparation.mjs')
  const missing = createBlastAdmission(), signal = new AbortController()
  await assert.rejects(waitForBlastAdmission(missing.wait(), signal.signal, 5), /timed out/)
  missing.fail(Error('disposed after timeout'))
  const aborted = createBlastAdmission(), controller = new AbortController()
  const waiting = assert.rejects(waitForBlastAdmission(aborted.wait(), controller.signal), /host abort/)
  controller.abort(Error('host abort')); await waiting
  aborted.fail(Error('disposed after abort'))
})

test('the predeclared move follows normal up but does not await admission transport', async () => {
  const { sendPlannedBlastMove } = await import('../qa/blast-ordinary/preparation.mjs')
  const log = [], signal = new AbortController().signal
  let complete
  const admission = new Promise(resolve => { complete = resolve })
  const normalUp = async () => { log.push('up') }
  await normalUp()
  const pending = sendPlannedBlastMove({ admission, signal, move: async () => { log.push('move') } })
  assert.deepEqual(log, ['up', 'move'])
  complete({ value: { acceptedRelease: true } })
  assert.deepEqual(await pending, { acceptedRelease: true })
})

test('failed first admission still fails after the one declared move; abort or failed up prevents dispatch', async () => {
  const { sendPlannedBlastMove } = await import('../qa/blast-ordinary/preparation.mjs')
  const failure = Error('first cast failed'), signal = new AbortController().signal
  let moves = 0
  await assert.rejects(sendPlannedBlastMove({ admission: Promise.resolve({ error: failure }), signal, move: async () => { moves++ } }), error => error === failure)
  assert.equal(moves, 1)
  const stopped = new AbortController(); stopped.abort(Error('stop before second input'))
  await assert.rejects(sendPlannedBlastMove({ admission: Promise.resolve({ value: {} }), signal: stopped.signal, move: async () => { moves++ } }), /stop before second/)
  assert.equal(moves, 1)
  const failedUp = async () => { throw Error('normal up failed') }
  await assert.rejects(async () => {
    await failedUp()
    await sendPlannedBlastMove({ admission: Promise.resolve({ value: {} }), signal, move: async () => { moves++ } })
  }, /normal up failed/)
  assert.equal(moves, 1)
})
