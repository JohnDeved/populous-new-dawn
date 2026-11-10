import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
const boundary = source.indexOf('  // The original timer is already cleared.')
const start = source.lastIndexOf('  } else {\n', boundary)
const end = source.lastIndexOf('\n  }\n', boundary)
assert.ok(start > source.indexOf('} finally {') && end > start && boundary > end)
// Execute the actual ordinary-owner cleanup block with supplied close ports.
// No browser, server, runner import or full lifecycle acceptance is implied.
const helperStart = source.indexOf('function failureMessage(')
const helperEnd = source.indexOf('// Keep the admission token', helperStart)
const helpers = helperStart < 0 ? '' : source.slice(helperStart, helperEnd)
assert.ok(helperStart < 0 || helperEnd > helperStart)
const cleanup = new (Object.getPrototypeOf(async function () {}).constructor)(
  'context', 'browser', 'server', 'receipt', 'process',
  helpers + source.slice(start + '  } else {\n'.length, end),
)
const owners = ['context', 'browser', 'server']
const reasons = [undefined, null, false, 0, NaN, '', 0n, Symbol('close'), new Error('close'), { detail: 'close' }]

function fixture(failures = new Map(), synchronous = false, initial = { status: 'passed' }) {
  const calls = []
  const ports = owners.map(owner => ({
    close() {
      assert.equal(this, ports[owners.indexOf(owner)], `${owner} keeps its receiver`)
      calls.push(owner)
      if (failures.has(owner)) {
        if (synchronous) throw failures.get(owner)
        return Promise.reject(failures.get(owner))
      }
      return Promise.resolve()
    },
  }))
  const receipt = { ...initial }, process = {}
  return { calls, ports, receipt, process, run: () => cleanup(...ports, receipt, process) }
}

test('successful cleanup preserves order and a passing scenario', async () => {
  const f = fixture()
  await f.run()
  assert.deepEqual(f.calls, owners)
  assert.equal(f.receipt.cleanupVerified, true)
  assert.equal(f.receipt.status, 'passed')
  assert.equal(f.receipt.cleanupError, undefined)
  assert.equal(f.receipt.cleanupErrors, undefined)
  assert.equal(f.process.exitCode, undefined)
})

for (const synchronous of [false, true]) {
  for (const owner of owners) {
    for (const [index, reason] of reasons.entries()) {
      test(`${owner} ${synchronous ? 'throw' : 'rejection'} ${index} does not omit later cleanup`, async () => {
        const f = fixture(new Map([[owner, reason]]), synchronous)
        await f.run()
        assert.deepEqual(f.calls, owners)
        assert.equal(f.receipt.cleanupVerified, false)
        assert.equal(f.receipt.status, 'failed')
        assert.equal(f.process.exitCode, 1)
        assert.equal(f.receipt.cleanupError, String(reason))
        assert.deepEqual(f.receipt.cleanupErrors, [{ owner, error: String(reason) }])
      })
    }
  }
}

test('multiple cleanup failures retain first error and every failed owner in order', async () => {
  const failures = new Map([['context', ''], ['browser', null], ['server', new Error('server')]])
  const f = fixture(failures)
  await f.run()
  assert.deepEqual(f.calls, owners)
  assert.equal(f.receipt.cleanupVerified, false)
  assert.equal(f.receipt.cleanupError, '')
  assert.deepEqual(f.receipt.cleanupErrors, [...failures].map(([owner, error]) => ({ owner, error: String(error) })))
  assert.equal(f.receipt.status, 'failed')
  assert.equal(f.process.exitCode, 1)
})

test('successful cleanup cannot promote an already failed scenario', async () => {
  const f = fixture(new Map(), false, { status: 'failed', failure: 'primary', stack: 'primary stack' })
  f.process.exitCode = 1
  await f.run()
  assert.equal(f.receipt.cleanupVerified, true)
  assert.equal(f.receipt.status, 'failed')
  assert.equal(f.receipt.failure, 'primary')
  assert.equal(f.receipt.stack, 'primary stack')
  assert.equal(f.process.exitCode, 1)
})

test('cleanup failure does not replace primary scenario evidence', async () => {
  const f = fixture(new Map([['context', new Error('cleanup')]]), false,
    { status: 'failed', failure: 'primary', stack: 'primary stack' })
  await f.run()
  assert.deepEqual(f.calls, owners)
  assert.equal(f.receipt.failure, 'primary')
  assert.equal(f.receipt.stack, 'primary stack')
  assert.equal(f.receipt.status, 'failed')
  assert.equal(f.process.exitCode, 1)
})

test('absent owners are permitted after early setup failure', async () => {
  const receipt = { status: 'failed', failure: 'setup' }, process = { exitCode: 1 }
  await cleanup(undefined, undefined, undefined, receipt, process)
  assert.equal(receipt.cleanupVerified, true)
  assert.equal(receipt.status, 'failed')
  assert.equal(receipt.failure, 'setup')
  assert.equal(process.exitCode, 1)
})

test('remaining server is attempted when earlier owners are absent', async () => {
  const calls = [], receipt = { status: 'failed' }, process = { exitCode: 1 }
  await cleanup(undefined, undefined, { close() { calls.push('server') } }, receipt, process)
  assert.deepEqual(calls, ['server'])
  assert.equal(receipt.cleanupVerified, true)
  assert.equal(receipt.status, 'failed')
  assert.equal(process.exitCode, 1)
})

test('later closes wait until the preceding rejection settles', async () => {
  let rejectContext
  const calls = [], receipt = { status: 'passed' }, process = {}
  const context = { close() { calls.push('context'); return new Promise((_, reject) => { rejectContext = reject }) } }
  const browser = { close() { calls.push('browser') } }
  const server = { close() { calls.push('server') } }
  const operation = cleanup(context, browser, server, receipt, process)
  assert.deepEqual(calls, ['context'])
  rejectContext(undefined)
  await operation
  assert.deepEqual(calls, owners)
  assert.equal(receipt.cleanupVerified, false)
  assert.equal(receipt.status, 'failed')
  assert.equal(process.exitCode, 1)
})
