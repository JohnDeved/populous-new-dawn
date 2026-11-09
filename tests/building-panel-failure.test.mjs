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
  [{ timedOut: true }, /35-second bound/],
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
