import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const source = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
const boundary = '  assert.equal(receipt.browserTimedOut, undefined)'
const start = source.indexOf(boundary)
assert.ok(start > 0 && source.indexOf(boundary, start + 1) < 0)
const helperStart = source.indexOf('function failureMessage(')
const helperEnd = source.indexOf('// Keep the admission token', helperStart)
assert.ok(helperStart < 0 || helperEnd > helperStart)
const helpers = helperStart < 0 ? '' : source.slice(helperStart, helperEnd)
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const owners = ['context', 'browser', 'server']
const unprintable = '[Unprintable thrown value]'
const revoked = () => { const value = Proxy.revocable({}, {}); value.revoke(); return value.proxy }
const hostile = [
  ['null prototype', () => Object.create(null)],
  ['revoked proxy', revoked],
  ['throwing conversion', () => ({ [Symbol.toPrimitive]() { throw null } })],
  ['nonprimitive conversion', () => ({ toString: () => ({}), valueOf: () => ({}) })],
]

async function observe(options = {}) {
  const receipt = { status: 'running', errors: [], ...options.receipt }
  const process = {}, calls = [], saved = [], logs = [], diagnosticCalls = []
  const owner = name => ({ close() {
    assert.equal(this, ports[name], `${name} receiver`)
    calls.push(name)
    if (options.closeFailures?.has(name)) {
      const reason = options.closeFailures.get(name)
      if (options.synchronous) throw reason
      return Promise.reject(reason)
    }
    return Promise.resolve()
  } })
  const ports = Object.fromEntries(owners.map(name => [name, owner(name)]))
  const dependencies = {
    scenario() {
      if (Object.hasOwn(options, 'reason')) {
        if (options.synchronous) throw options.reason
        return Promise.reject(options.reason)
      }
      return Promise.resolve()
    }, assert, receipt, process, resolve,
    page: options.page ? {
      async evaluate() {
        diagnosticCalls.push('evaluate')
        if (Object.hasOwn(options, 'evaluateFailure')) throw options.evaluateFailure
        return { active: 'fixture', body: 'fixture' }
      },
      async screenshot() {
        diagnosticCalls.push('screenshot')
        if (Object.hasOwn(options, 'screenshotFailure')) throw options.screenshotFailure
      },
    } : undefined,
    selectedScenario: options.selectedScenario ?? 'gameplay-frames',
    timer: 'fixture-timer', clearTimeout: timer => { assert.equal(timer, 'fixture-timer') },
    ...ports,
    verifySource: () => { if (Object.hasOwn(options, 'sourceFailure')) throw options.sourceFailure },
    outputManifest: () => { if (Object.hasOwn(options, 'manifestFailure')) throw options.manifestFailure; return {} },
    dist: '/fixture/dist',
    m2Fixture: options.m2Fixture ? { receipt: { transferSha256: 'transfer', checkpointSha256: 'checkpoint' } } : undefined,
    hash: path => { if (Object.hasOwn(options, 'hashFailure')) throw options.hashFailure; return path.endsWith('.v8') ? 'checkpoint' : 'transfer' },
    metadata: () => options.after ?? {}, dependencies: [], before: {}, createHash,
    save: () => saved.push(JSON.parse(JSON.stringify(receipt))),
    console: { log: value => logs.push(value) }, out: '/fixture',
    recoveryReceipt: () => { if (Object.hasOwn(options, 'evidenceFailure')) throw options.evidenceFailure; return {} },
    recoveryReceiptLog: () => 'recovery fixture',
    profileCasesReceipt: () => { if (Object.hasOwn(options, 'evidenceFailure')) throw options.evidenceFailure; return {} },
    profileCasesReceiptLog: () => 'profile fixture',
    mission10CrewReceipt: () => { if (Object.hasOwn(options, 'evidenceFailure')) throw options.evidenceFailure; return {} },
    mission10CrewReceiptLog: () => 'mission10 fixture',
  }
  // Execute the complete terminal catch/finally from the maintained runner,
  // including JSON serialization of its final receipt, with supplied ports.
  // Imports, admission, browser execution and full-runner acceptance do not run.
  const run = new AsyncFunction(...Object.keys(dependencies), helpers + 'try {\nawait scenario()\n' + source.slice(start))
  let escaped = false
  try { await run(...Object.values(dependencies)) } catch { escaped = true }
  return { receipt, process, calls, saved, logs, diagnosticCalls, escaped }
}

function finalFailure(result) {
  assert.equal(result.escaped, false, 'diagnostics do not escape')
  assert.deepEqual(result.calls, owners, 'all ordinary owners are attempted in order')
  assert.equal(result.receipt.status, 'failed')
  assert.equal(result.process.exitCode, 1)
  assert.ok(result.saved.length >= 1, 'final JSON receipt is retained')
  assert.equal(result.saved.at(-1).status, 'failed')
  assert.equal(result.logs.length, 1, 'terminal JSON summary is retained')
  assert.equal(JSON.parse(result.logs[0]).status, 'failed')
}

for (const synchronous of [false, true]) {
  for (const [name, make] of hostile) {
    test(`hostile scenario ${name}, ${synchronous ? 'throw' : 'rejection'}`, async () => {
      const result = await observe({ reason: make(), synchronous })
      finalFailure(result)
      assert.equal(result.receipt.failure, unprintable)
      assert.equal(result.receipt.cleanupVerified, true)
      assert.equal(result.receipt.stack, undefined)
    })
  }
}

for (const [name, reason] of [['undefined', undefined], ['null', null], ['false', false], ['zero', 0], ['bigint', 0n], ['symbol', Symbol('reason')]]) {
  test(`ordinary falsey or primitive scenario reason: ${name}`, async () => {
    const result = await observe({ reason })
    finalFailure(result)
    assert.equal(result.receipt.failure, String(reason))
    assert.equal(result.receipt.cleanupVerified, true)
  })
}

for (const [name, make, expected] of [
  ['throwing stack', () => ({ toString: () => 'primary', get stack() { throw null } }), undefined],
  ['bigint stack', () => ({ toString: () => 'primary', stack: 1n }), undefined],
  ['circular stack', () => { const stack = {}; stack.self = stack; return { toString: () => 'primary', stack } }, undefined],
  ['throwing code', () => ({ toString: () => 'primary', get code() { throw null } }), undefined],
  ['string stack', () => ({ toString: () => 'primary', stack: 'source stack' }), 'source stack'],
]) {
  test(`scenario metadata stays JSON-safe: ${name}`, async () => {
    const result = await observe({ reason: make() })
    finalFailure(result)
    assert.equal(result.receipt.failure, 'primary')
    assert.equal(result.receipt.stack, expected)
  })
}

test('stack and timeout metadata are read once and preserve a genuine timeout', async () => {
  let stackReads = 0, codeReads = 0
  const reason = { toString: () => 'timed out', get stack() { stackReads++; return 'timeout stack' }, get code() { codeReads++; return 'SNAPSHOT_EPISODE_TIMEOUT' } }
  const result = await observe({ reason })
  finalFailure(result)
  assert.equal(stackReads, 1); assert.equal(codeReads, 1)
  assert.equal(result.receipt.browserTimedOut, true)
  assert.equal(result.receipt.stack, 'timeout stack')
})

test('aggregate preserves ordered printable and hostile cause diagnostics', async () => {
  const reason = new AggregateError([new Error('first'), Object.create(null), revoked(), false], 'combined')
  const result = await observe({ reason })
  finalFailure(result)
  assert.equal(result.receipt.failure, 'AggregateError: combined')
  assert.deepEqual(result.receipt.failureCauses, ['Error: first', unprintable, unprintable, 'false'])
  assert.equal(result.receipt.failureCausesUnavailable, undefined)
})

for (const [name, change] of [
  ['throwing getter', reason => Object.defineProperty(reason, 'errors', { get() { throw null } })],
  ['revoked collection', reason => { reason.errors = revoked() }],
  ['nonarray collection', reason => { reason.errors = { first: 'unreadable' } }],
  ['throwing iterator', reason => { reason.errors[Symbol.iterator] = () => { throw null } }],
]) {
  test(`unavailable aggregate causes remain a failed receipt: ${name}`, async () => {
    const reason = new AggregateError([new Error('first')], 'combined'); change(reason)
    const result = await observe({ reason })
    finalFailure(result)
    assert.equal(result.receipt.failure, 'AggregateError: combined')
    assert.equal(result.receipt.failureCauses, undefined)
    assert.equal(result.receipt.failureCausesUnavailable, true)
  })
}

for (const synchronous of [false, true]) {
  for (const owner of owners) {
    for (const [name, make] of hostile) {
      test(`${owner} cleanup ${synchronous ? 'throw' : 'rejection'} stays JSON-safe: ${name}`, async () => {
        const result = await observe({ reason: new Error('primary'), synchronous, closeFailures: new Map([[owner, make()]]) })
        finalFailure(result)
        assert.equal(result.receipt.failure, 'Error: primary')
        assert.equal(result.receipt.cleanupVerified, false)
        assert.equal(result.receipt.cleanupError, unprintable)
        assert.deepEqual(result.receipt.cleanupErrors, [{ owner, error: unprintable }])
      })
    }
  }
}

test('all hostile cleanup failures remain ordered after a passing scenario', async () => {
  const result = await observe({ closeFailures: new Map(owners.map(owner => [owner, Object.create(null)])) })
  finalFailure(result)
  assert.equal(result.receipt.failure, undefined)
  assert.equal(result.receipt.cleanupVerified, false)
  assert.deepEqual(result.receipt.cleanupErrors, owners.map(owner => ({ owner, error: unprintable })))
})

for (const key of ['evaluateFailure', 'screenshotFailure']) {
  for (const [name, make] of hostile.slice(0, 2)) {
    test(`failed page diagnostics do not escape: ${key}, ${name}`, async () => {
      const result = await observe({ reason: new Error('primary'), page: true, [key]: make() })
      finalFailure(result)
      assert.equal(result.receipt.failure, 'Error: primary')
      assert.equal(result.receipt.diagnosticError, unprintable)
      assert.deepEqual(result.diagnosticCalls, key === 'evaluateFailure' ? ['evaluate'] : ['evaluate', 'screenshot'])
    })
  }
}

for (const [key, options, field] of [
  ['sourceFailure', {}, 'sourceAfter'],
  ['manifestFailure', { receipt: { outputManifest: {} } }, 'sourceAfter'],
  ['hashFailure', { m2Fixture: true }, 'm2FixtureError'],
]) {
  test(`post-run verification remains failed and reportable: ${key}`, async () => {
    const result = await observe({ ...options, [key]: Object.create(null) })
    finalFailure(result)
    assert.equal(result.receipt[field], unprintable)
    assert.equal(result.receipt.cleanupVerified, true)
  })
}

for (const selectedScenario of ['pause-checkpoint-recovery', 'profile-recovery', 'mission10-profile']) {
  test(`failed evidence summary remains failed and reportable: ${selectedScenario}`, async () => {
    const result = await observe({ selectedScenario, evidenceFailure: Object.create(null) })
    finalFailure(result)
    assert.equal(result.receipt.failure, unprintable)
    assert.equal(result.receipt.evidenceError, unprintable)
    assert.equal(result.saved.length, 2)
  })
}

test('successful terminal path preserves its ordinary passing receipt', async () => {
  const result = await observe({ m2Fixture: true })
  assert.equal(result.escaped, false)
  assert.deepEqual(result.calls, owners)
  assert.equal(result.receipt.status, 'passed')
  assert.equal(result.receipt.cleanupVerified, true)
  assert.equal(result.receipt.m2FixtureUnchanged, true)
  assert.equal(result.receipt.sourceAfter, 'identical')
  assert.deepEqual(result.receipt.dependencyChanges, [])
  assert.equal(result.process.exitCode, undefined)
  assert.equal(result.saved.length, 1)
  for (const field of ['failure', 'stack', 'failureCauses', 'failureCausesUnavailable', 'cleanupError', 'diagnosticError']) assert.equal(Object.hasOwn(result.receipt, field), false)
})

test('dependency changes still fail the final receipt', async () => {
  const result = await observe({ after: { dependency: 'changed' } })
  finalFailure(result)
  assert.deepEqual(result.receipt.dependencyChanges, ['dependency'])
})
