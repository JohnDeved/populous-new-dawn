import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ordinaryM1EnemyBlast, { createM1EnemyPreparation, createM1PointerAttempt } from '../qa/blast-ordinary/m1-scenario.mjs'

test('enemy admission has no stationary neighborhood helper or pixel offsets', () => {
  const source = readFileSync(new URL('../qa/blast-ordinary/m1-scenario.mjs', import.meta.url), 'utf8')
  const admission = source.slice(source.indexOf('    const observe = '), source.indexOf("    }, 'one actual preparation move, first natural draw and one admission')"))
  assert.ok(admission.length > 0)
  assert.doesNotMatch(admission, /findEntityInput|interiorRadius|\bd[xy]\b/)
  assert.match(admission, /inspectEntityPoint\(s, 'units', point\)/)
  assert.match(admission, /actual\.canvasOwned && actual\.hitId === target\.id/)
  assert.match(admission, /if \(cheapReady && \(stage === 'preparation' \|\| firstDrawHover\)\) \{\s*const probe = structuredClone\(w\)/)
  assert.match(admission, /let rangeStatus = 'unprobed', targetError = 'unprobed'/)
  assert.match(admission, /stage === 'preparation' && cheapReady && gates\.range/)
})

const readyPreparation = () => ({ preparationReady: true, rangeStatus: 'probed', targetError: null, pixel: { x: 50, y: 60 } })
const pointerProbe = () => ({ move: { turn: 10 }, draw: { turn: 10, renderFrame: 40 }, errors: [] })
const admissionRow = (gates = { hover: true, pixel: true, range: true }) => ({ gates,
  ready: Object.values(gates).every(Boolean), withinBounds: true, rangeStatus: 'probed', targetError: null, errors: [], failures: [] })
function pointerHarness({ move = async () => {}, checkStop = async () => {} } = {}) {
  const retained = [], calls = [], controller = new AbortController()
  let time = 100
  const attempt = createM1PointerAttempt({ checkStop, signal: controller.signal, now: () => time++,
    move: async point => { calls.push(point); await move(point) }, retain: value => retained.push(value) })
  return { attempt, retained, calls, controller }
}

test('one preparation move and one admission cannot become a pointer chase', async () => {
  const { attempt, retained, calls } = pointerHarness()
  await attempt.move(readyPreparation())
  await assert.rejects(attempt.move(readyPreparation()), /Only one preparation/)
  assert.deepEqual(calls, [{ x: 50, y: 60 }])
  assert.equal(retained.length, 1); assert.equal(retained[0].completed, true)
  assert.equal(retained[0].hostBefore, 100); assert.equal(retained[0].hostAfter, 101)
  const result = attempt.admit(admissionRow(), pointerProbe())
  assert.deepEqual(result, { castReady: true, diagnosticComplete: false, complete: false, missingGates: [] })
  assert.throws(() => attempt.admit(admissionRow(), pointerProbe()), /Only one fresh postdraw/)
})

test('a clean first-draw gate miss is a completed diagnostic without a cast', async () => {
  const { attempt, calls } = pointerHarness()
  await attempt.move(readyPreparation())
  const result = attempt.admit(admissionRow({ hover: false, pixel: true, range: true }), pointerProbe())
  assert.deepEqual(result, { castReady: false, diagnosticComplete: true, complete: false, missingGates: ['hover'] })
  assert.equal(calls.length, 1)
  assert.throws(() => attempt.admit(admissionRow(), pointerProbe()), /Only one fresh postdraw/)
})

test('preparation input failure is retained and is never retried or admitted', async () => {
  const { attempt, retained, calls } = pointerHarness({ move: async () => { throw Error('actual input failed') } })
  await assert.rejects(attempt.move(readyPreparation()), /actual input failed/)
  assert.equal(retained.length, 1); assert.equal(retained[0].inputAttempted, true); assert.equal(retained[0].completed, false)
  assert.match(retained[0].failure, /actual input failed/); assert.equal(retained[0].hostAfter, 101)
  await assert.rejects(attempt.move(readyPreparation()), /Only one preparation/)
  assert.throws(() => attempt.admit(admissionRow(), pointerProbe()), /input must finish/)
  assert.equal(calls.length, 1)
})

test('abort and unprobed range cannot spend the preparation move', async () => {
  const aborted = pointerHarness()
  aborted.controller.abort(Error('stop input'))
  await assert.rejects(aborted.attempt.move(readyPreparation()), /stop input/)
  assert.equal(aborted.calls.length, 0); assert.equal(aborted.retained[0].inputAttempted, false)
  const unprobed = pointerHarness()
  await assert.rejects(unprobed.attempt.move({ ...readyPreparation(), rangeStatus: 'unprobed' }), /probed/)
  assert.equal(unprobed.calls.length, 0)
})

test('missing draw, expired bounds and real observer errors remain failures', async () => {
  for (const [row, probe, error] of [
    [admissionRow(), { move: {}, errors: [] }, /first natural draw/],
    [admissionRow(), { ...pointerProbe(), errors: ['observer failure'] }, /Pointer observation failed/],
    [{ ...admissionRow(), errors: ['episode failure'] }, pointerProbe(), /Episode observation failed/],
    [{ ...admissionRow(), withinBounds: false }, pointerProbe(), /window expired/],
    [{ ...admissionRow({ hover: false }), failures: ['scene'] }, pointerProbe(), /Setup observation failed/],
  ]) {
    const { attempt } = pointerHarness()
    await attempt.move(readyPreparation())
    assert.throws(() => attempt.admit(row, probe), error)
    assert.throws(() => attempt.admit(admissionRow(), pointerProbe()), /Only one fresh postdraw/)
  }
})

test('preparation keeps first gate failures and motion when its bounded tail rolls', () => {
  const preparation = createM1EnemyPreparation(2)
  preparation.observe({ turn: 526, gates: { moving: false, pixel: false, range: true }, ready: false })
  preparation.observe({ turn: 527, gates: { moving: true, pixel: false, range: true }, ready: false })
  preparation.observe({ turn: 528, gates: { moving: true, pixel: true, range: true }, ready: true })
  preparation.observe({ turn: 529, gates: { moving: true, pixel: false, range: false }, ready: false })
  const result = preparation.read()
  assert.equal(result.total, 4); assert.equal(result.dropped, 2)
  assert.deepEqual(result.rows.map(row => row.turn), [528, 529])
  assert.equal(result.firstFailures.moving.turn, 526)
  assert.equal(result.firstFailures.pixel.turn, 526)
  assert.equal(result.firstFailures.range.turn, 529)
  assert.equal(result.firstMoving.turn, 527)
  assert.equal(result.firstReady.turn, 528)
})

test('retained preparation is detached from both producer and readers', () => {
  const preparation = createM1EnemyPreparation()
  const row = { turn: 526, gates: { moving: false, pixel: false }, position: { x: 1, y: 2 }, ready: false }
  preparation.observe(row)
  row.position.x = 99; row.gates.pixel = true
  const copy = preparation.read()
  copy.rows[0].position.y = 99; copy.firstFailures.pixel.position.x = 99
  const retained = preparation.read()
  assert.deepEqual(retained.rows[0].position, { x: 1, y: 2 })
  assert.equal(retained.firstFailures.pixel.gates.pixel, false)
  assert.deepEqual(retained.firstFailures.pixel.position, { x: 1, y: 2 })
})

test('preparation rejects invalid bounds and turns without adding evidence', () => {
  for (const capacity of [0, -1, 97, 1.5, Infinity]) assert.throws(() => createM1EnemyPreparation(capacity))
  const preparation = createM1EnemyPreparation()
  for (const turn of [-1, 1.5, NaN, undefined])
    assert.throws(() => preparation.observe({ turn, gates: {}, ready: false }))
  assert.equal(preparation.read().total, 0)
})

test('scenario refuses baseline or reused profiles before any browser operation', async () => {
  const previous = process.env.POPULOUS_BLAST_EXPECTATION
  let browserReads = 0
  const page = new Proxy({}, { get() { browserReads++; throw Error('Unexpected browser operation') } })
  try {
    process.env.POPULOUS_BLAST_EXPECTATION = 'baseline'
    await assert.rejects(ordinaryM1EnemyBlast({ page, receipt: {} }), /candidate/)
    process.env.POPULOUS_BLAST_EXPECTATION = 'candidate'
    await assert.rejects(ordinaryM1EnemyBlast({ page, receipt: { profile: { mode: 'reused' } } }), /fresh candidate profile/)
    assert.equal(browserReads, 0)
  } finally {
    if (previous === undefined) delete process.env.POPULOUS_BLAST_EXPECTATION
    else process.env.POPULOUS_BLAST_EXPECTATION = previous
  }
})


test('ground primer excludes persons while retaining actual non-person terrain semantics', () => {
  const source = readFileSync(new URL('../qa/blast-ordinary/m1-scenario.mjs', import.meta.url), 'utf8')
  const primer = source.slice(source.indexOf('    const primer = await page.evaluate'), source.indexOf('    report.primer = { hit: primer }'))
  assert.ok(primer.length > 0)
  assert.doesNotMatch(primer, /pickUnit|pickWorldObject/)
  assert.match(primer, /const occupied = person !== null/)
  assert.match(primer, /pickedCell.x === wanted.x && pickedCell.y === wanted.y && error === null/)
})


test('an unprobed range never becomes the first observed range failure', () => {
  const preparation = createM1EnemyPreparation()
  preparation.observe({ turn: 10, gates: { pixel: false, range: false }, rangeStatus: 'unprobed', ready: false })
  assert.equal(preparation.read().firstFailures.range, undefined)
  preparation.observe({ turn: 11, gates: { pixel: true, range: false }, rangeStatus: 'probed', ready: false })
  assert.equal(preparation.read().firstFailures.range.turn, 11)
})

test('actual route caller delegates once to maintained moveGround and propagates uncertain input failure', async () => {
  const source = readFileSync(new URL('../qa/blast-ordinary/m1-scenario.mjs', import.meta.url), 'utf8')
  const start = source.indexOf('    const move = async '), end = source.indexOf("\n    await checked(() => input.button('Select and focus shaman'))", start)
  assert.ok(start >= 0 && end > start)
  // Execute the actual local caller body with supplied input/arrival observations.
  // The maintained helper's browser work and native arrival are not simulated here.
  const body = source.slice(start, end), point = { x: 0.2, z: 3.5 }, calls = []
  const report = { startup: { actorId: 30 }, route: [] }, hit = { point }, order = { model: 3, flags: 0, a: 2099, b: 62592 }
  const delivered = { after: { units: [{ id: 30, orderId: 1, order }], lastOrderTurn: 100 } }
  let failure
  const input = { button: async () => {}, view: async () => {},
    moveGround: async (...args) => { calls.push(args); if (failure) throw failure; return { hit, delivered } },
    fixedGround: () => assert.fail('Caller bypassed maintained preparation'), dispatch: () => assert.fail('Caller bypassed maintained dispatch') }
  const route = new Function('input', 'checked', 'settle', 'page', 'report', 'save', 'poll', 'healthy', 'current', 'assert', `${body}; return move`)(
    input, fn => fn(), async () => {}, { evaluate: async () => ({ done: true, turn: 123 }) }, report, () => {}, async check => assert.equal(await check(), true), () => {}, async () => ({}), assert)
  const result = await route('crossing', point, true)
  assert.deepEqual(calls, [[point, true]]); assert.equal(result.hit, hit); assert.equal(result.delivered, delivered)
  failure = Error('Actual or uncertain input failure')
  await assert.rejects(route('crossing', point, true), error => error === failure)
  assert.equal(calls.length, 2, 'The caller must not retry a helper failure')
})
