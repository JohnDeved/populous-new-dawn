import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import buildingPanelIdentity, { finishBuildingPanelIdentity } from '../scripts/tutorial-browser/building-panel-identity.mjs'

// Actual episode and terminal writer with supplied transport/cleanup outcomes.
// No browser, gameplay, rendering or deadline-performance acceptance is claimed.
const rejections = [undefined, null, false, 0, NaN, '', Error('transport failed')]
function fixture(t) {
  const output = mkdtempSync(join(tmpdir(), 'pnd-building-failure-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  const path = join(output, 'building-panel-identity.json')
  return { output, path, receipt: () => JSON.parse(readFileSync(path, 'utf8')) }
}
async function rejectedBy(operation, expected) {
  const outcome = await operation.then(value => ({ value }), error => ({ error }))
  assert.ok(outcome.error instanceof AggregateError, 'The actual episode must reject')
  assert.equal(outcome.error.errors.length, expected.length)
  expected.forEach((error, index) => assert.ok(Object.is(outcome.error.errors[index], error)))
  return outcome.error
}

for (const [index, failure] of rejections.entries()) {
  test(`actual episode retains startup rejection ${index}: ${String(failure)}`, async t => {
    const f = fixture(t)
    let closed = 0
    const browser = { newContext: async () => ({
      newPage: async () => { throw failure },
      close: async () => { closed++ },
    }) }
    await rejectedBy(buildingPanelIdentity({ browser, url: 'http://invalid.test/', output: f.output }), [failure])
    assert.equal(closed, 1)
    const receipt = f.receipt()
    assert.equal(receipt.status, 'failed')
    assert.equal(receipt.contextClosed, true)
    assert.deepEqual(receipt.failures.map(value => value.message), [String(failure)])
    assert.equal(receipt.completed, undefined)
    assert.equal(receipt.timedOut, undefined)
  })

  test(`terminal writer retains cleanup rejection ${index}: ${String(failure)}`, async t => {
    const f = fixture(t)
    await rejectedBy(finishBuildingPanelIdentity({
      context: { close: async () => { throw failure } }, report: { errors: [] }, output: f.output,
    }), [failure])
    const receipt = f.receipt()
    assert.equal(receipt.status, 'failed')
    assert.equal(receipt.contextClosed, undefined)
    assert.deepEqual(receipt.failures.map(value => value.message), [String(failure)])
  })
}

test('omitted failure is success; explicitly present undefined remains failure', async t => {
  for (const failed of [false, true]) {
    const f = fixture(t), report = { errors: [] }
    const options = { context: { close: async () => {} }, report, output: f.output }
    if (failed) options.failure = undefined
    if (failed) await rejectedBy(finishBuildingPanelIdentity(options), [undefined])
    else assert.equal(await finishBuildingPanelIdentity(options), report)
    assert.equal(f.receipt().status, failed ? 'failed' : 'passed')
    assert.equal(f.receipt().contextClosed, true)
  }
})

test('primary and cleanup failures both survive in order with the original Error stack', async t => {
  const f = fixture(t), failure = Error('primary failure')
  await rejectedBy(finishBuildingPanelIdentity({
    context: { close: async () => { throw null } }, report: { errors: [] }, output: f.output, failure,
  }), [failure, null])
  const receipt = f.receipt()
  assert.equal(receipt.status, 'failed')
  assert.deepEqual(receipt.failures.map(value => value.message), [String(failure), 'null'])
  assert.equal(receipt.failures[0].stack, failure.stack)
})

test('actual episode keeps a falsey navigation failure when diagnostic capture also rejects', async t => {
  const f = fixture(t)
  let captured = 0, closed = 0
  const page = { setDefaultTimeout() {}, on() {}, goto: async () => { throw false },
    screenshot: async () => { captured++; throw null } }
  const browser = { newContext: async () => ({ newPage: async () => page, close: async () => { closed++ } }) }
  await rejectedBy(buildingPanelIdentity({ browser, url: 'http://invalid.test/', output: f.output }), [false])
  assert.equal(captured, 1)
  assert.equal(closed, 1)
  const receipt = f.receipt()
  assert.equal(receipt.status, 'failed')
  assert.equal(receipt.diagnosticError, 'null')
  assert.deepEqual(receipt.screenshots, {})
})

test('terminal receipt waits for cleanup settlement and preserves its rejection', async t => {
  const f = fixture(t), report = { status: 'running', errors: [] }
  let reject
  const closed = new Promise((_, fail) => { reject = fail })
  const outcome = rejectedBy(finishBuildingPanelIdentity({
    context: { close: () => closed }, report, output: f.output, failure: 0,
  }), [0, undefined])
  assert.equal(report.status, 'running')
  assert.equal(existsSync(f.path), false)
  reject(undefined)
  await outcome
  assert.equal(f.receipt().status, 'failed')
})

for (const [boundary, message] of [
  [{ timedOut: true }, /45-second bound/],
  [{ errors: ['runtime failure'] }, /Runtime errors/],
]) test(`terminal writer independently rejects ${message}`, async t => {
  const f = fixture(t)
  await assert.rejects(finishBuildingPanelIdentity({
    context: { close: async () => {} }, report: { errors: [], ...boundary }, output: f.output,
  }), error => {
    assert.ok(error instanceof AggregateError)
    assert.equal(error.errors.length, 1, 'No supplied primary failure can mask the guard')
    assert.match(String(error.errors[0]), message)
    return true
  })
  assert.equal(f.receipt().status, 'failed')
  assert.equal(f.receipt().contextClosed, true)
})

// Virtual time exercises the actual owner, not a replacement timeout helper.
// These supplied context outcomes do not establish browser completion or speed.
test('actual episode expires once at 45 seconds and retains timeout plus cleanup', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const f = fixture(t), cancelled = Error('context closed by deadline')
  let entered, rejectPage, closed = 0
  const started = new Promise(resolve => { entered = resolve })
  const browser = { newContext: async () => ({
    newPage: () => new Promise((_, reject) => { rejectPage = reject; entered() }),
    close: async () => { closed++; rejectPage(cancelled) },
  }) }
  const result = buildingPanelIdentity({ browser, url: 'http://invalid.test/', output: f.output })
    .then(value => ({ value }), error => ({ error }))
  await started
  t.mock.timers.tick(44999)
  assert.equal(closed, 0, 'No premature context close')
  assert.equal(existsSync(f.path), false, 'Pending owner cannot publish success')
  t.mock.timers.tick(1)
  const { error } = await result
  assert.ok(error instanceof AggregateError)
  assert.equal(error.errors.length, 2)
  assert.equal(error.errors[0], cancelled, 'Original transport rejection survives')
  assert.match(String(error.errors[1]), /45-second bound/)
  assert.equal(closed, 2, 'Deadline closes the context and final cleanup still settles')
  const receipt = f.receipt()
  assert.equal(receipt.status, 'failed')
  assert.equal(receipt.timedOut, true)
  assert.equal(receipt.contextClosed, true)
  assert.equal(receipt.completed, undefined)
  assert.equal(receipt.timing.entries.filter(mark => mark.stage === 'deadline:fired').length, 1)
  t.mock.timers.tick(45000)
  assert.equal(closed, 2, 'No repeating deadline after settlement')
})

test('an earlier episode failure cancels the 45-second owner timer', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const f = fixture(t)
  let entered, rejectPage, closed = 0
  const started = new Promise(resolve => { entered = resolve })
  const browser = { newContext: async () => ({
    newPage: () => new Promise((_, reject) => { rejectPage = reject; entered() }),
    close: async () => { closed++ },
  }) }
  const result = rejectedBy(buildingPanelIdentity({ browser, url: 'http://invalid.test/', output: f.output }), [false])
  await started
  t.mock.timers.tick(1234)
  rejectPage(false)
  await result
  assert.equal(closed, 1)
  assert.equal(f.receipt().timedOut, undefined)
  assert.deepEqual(f.receipt().failures.map(value => value.message), ['false'])
  t.mock.timers.tick(45000)
  assert.equal(closed, 1, 'The cleared timer must not close an already-settled context')
})
