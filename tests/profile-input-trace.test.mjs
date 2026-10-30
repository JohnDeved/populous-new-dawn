import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { traceProfileInput } from '../scripts/tutorial-browser/profile-input-trace.mjs'

function directory(t) {
  const path = mkdtempSync(join(tmpdir(), 'pnd-profile-input-trace-'))
  t.after(() => rmSync(path, { recursive: true, force: true }))
  return path
}

test('profile trace brackets only the unchanged real input and retains bounded raw bytes', async t => {
  const output = directory(t), events = [], bytes = Buffer.from('supplied trace bytes'), report = {}
  const previous = join(output, 'profile-input-trace.zip')
  writeFileSync(previous, 'preexisting evidence')
  const context = { tracing: {
    start: async options => { assert.deepEqual(options, { screenshots: false, snapshots: false, sources: false }); events.push('start') },
    stop: async ({ path }) => { events.push('stop'); writeFileSync(path, bytes) },
  } }
  const result = await traceProfileInput(context, report, output, async () => { events.push('real input'); return 42 })
  assert.equal(result, 42); assert.deepEqual(events, ['start', 'real input', 'stop'])
  assert.deepEqual(Buffer.from(report.inputActionTrace.archive.base64, 'base64'), bytes)
  assert.equal(report.inputActionTrace.stopped, true)
  assert.equal(report.inputActionTrace.status, 'retained')
  assert.equal(readFileSync(previous, 'utf8'), 'preexisting evidence')
  assert.deepEqual(readdirSync(output), ['profile-input-trace.zip'], 'Only the exclusive temporary directory is removed')
})

test('profile trace retains the original input failure despite stop errors or excessive diagnostic bytes', async t => {
  for (const mode of ['stop-error', 'oversize']) {
    const output = directory(t), report = {}, original = Error('original 2500ms input failure')
    const context = { tracing: { start: async () => {}, stop: async ({ path }) => {
      if (mode === 'stop-error') { writeFileSync(path, 'partial ZIP'); throw Error('trace stop failed') }
      writeFileSync(path, Buffer.alloc(512 * 1024 + 1))
    } } }
    await assert.rejects(traceProfileInput(context, report, output, async () => { throw original }), error => error === original)
    assert.equal(report.inputActionTrace.inputError, String(original))
    assert.equal(report.inputActionTrace.status, 'diagnostic-failed')
    assert.equal(report.inputActionTrace.archive, undefined)
    assert.equal(existsSync(join(output, 'profile-input-trace.zip')), false)
    assert.deepEqual(readdirSync(output), [], 'Rejected partial writes are cleaned too')
  }
})

test('profile trace start failure never dispatches input and still attempts cleanup', async t => {
  const output = directory(t), error = Error('trace start failed'), report = {}, events = []
  await assert.rejects(traceProfileInput({ tracing: {
    start: async () => { events.push('start'); throw error },
    stop: async () => { events.push('stop'); throw Error('not started') },
  } }, report, output, async () => assert.fail('No delayed input after failed trace setup')), value => value === error)
  assert.deepEqual(events, ['start', 'stop'])
})

test('stalled trace cleanup cannot replace the original timeout and late files are removed', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const output = directory(t), report = {}, original = Error('original input timeout')
  let release, reachedStop
  const stopped = new Promise(resolve => { reachedStop = resolve })
  const run = traceProfileInput({ tracing: { start: async () => {}, stop: ({ path }) => {
    reachedStop()
    return new Promise(resolve => { release = () => { writeFileSync(path, 'late diagnostic'); resolve() } })
  } } }, report, output, async () => { throw original })
  await stopped
  t.mock.timers.tick(1000)
  await assert.rejects(run, error => error === original)
  assert.equal(report.inputActionTrace.stopped, false)
  assert.match(report.inputActionTrace.cleanupError, /diagnostic deadline/)
  release(); await Promise.resolve(); await Promise.resolve()
  assert.equal(existsSync(join(output, 'profile-input-trace.zip')), false)
  assert.deepEqual(readdirSync(output), [])
})

test('late rejected stop also removes its exclusively owned partial trace', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const output = directory(t), report = {}, original = Error('original input timeout')
  let rejectStop, reachedStop
  const stopped = new Promise(resolve => { reachedStop = resolve })
  const run = traceProfileInput({ tracing: { start: async () => {}, stop: ({ path }) => {
    reachedStop()
    return new Promise((_, reject) => { rejectStop = () => { writeFileSync(path, 'partial late ZIP'); reject(Error('late failure')) } })
  } } }, report, output, async () => { throw original })
  await stopped; t.mock.timers.tick(1000)
  await assert.rejects(run, error => error === original)
  rejectStop(); await Promise.resolve(); await Promise.resolve()
  assert.deepEqual(readdirSync(output), [])
})

test('a stalled trace start cannot dispatch late gameplay input', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const output = directory(t), report = {}
  let release
  const run = traceProfileInput({ tracing: {
    start: () => new Promise(resolve => { release = resolve }),
    stop: async () => { throw Error('not started') },
  } }, report, output, async () => assert.fail('No late input'))
  t.mock.timers.tick(1000)
  await assert.rejects(run, /diagnostic deadline/)
  release(); await Promise.resolve()
  assert.equal(report.inputActionTrace.inputStartedMs, undefined)
})

test('profile diagnostic does not alter the explicit setup/response contract and owned context closure around the diagnostic', () => {
  const source = readFileSync(new URL('../scripts/local-render/campaign-profile-recovery.mjs', import.meta.url), 'utf8')
  assert.match(source, /if \(!report\.inputActionTrace\)[\s\S]*?traceProfileInput\(page\.context\(\), report, output, \(\) => skipInput\(page\)\)/)
  assert.match(source, /else await skipInput\(page\)/)
  assert.match(source, /finally \{ await context\.close\(\) \}/)
  assert.doesNotMatch(source, /skipPauseIntroduction\(page, \{ timeout:/, 'Trace does not extend or restart the response budget')
})
