import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { closeCompletedPrimaryTutorial, readPrimaryTutorialFinalState } from '../scripts/tutorial-browser/primary-tutorial-lifecycle.mjs'

const source = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
const start = source.indexOf('  receipt.result = await (await import(pathToFileURL(scenario).href))')
const end = source.indexOf('  receipt.sceneryPlacement =', start)
assert.ok(start > 0 && end > start)
const block = source.slice(start, end)
  .replace('await (await import(pathToFileURL(scenario).href)).default({ page, context, browser, url, root, output: out, receipt })', 'await primary()')
  .replace('await (await import(pathToFileURL(selectorScenario).href)).default({ browser, url, output: out })', 'await next()')
assert.equal(block.includes('import('), false)
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const caller = new AsyncFunction('selectedScenario', 'receipt', 'context', 'page', 'browser', 'closeCompletedPrimaryTutorial', 'writeFileSync', 'resolve', 'out', 'save', 'primary', 'next', block + '\nreturn {context, page}')

function fixture(options = {}) {
  const events = [], records = [], receipt = { errors: [] }, other = {}, contexts = [other]
  const context = { async close() {
    events.push('close')
    if (options.duringClose) receipt.errors.push('late console error')
    if (options.closeFailure) throw options.closeFailure
    contexts.splice(contexts.indexOf(context), 1)
  } }
  contexts.push(context)
  const page = { context: () => context, async evaluate(fn) {
    events.push('snapshot')
    assert.equal(fn, readPrimaryTutorialFinalState)
    if (options.snapshotFailure) throw options.snapshotFailure
    return { active: 'button', body: 'completed primary' }
  } }
  const browser = { contexts: () => [...contexts] }
  const run = (selectedScenario = 'tutorial') => caller(selectedScenario, receipt, context, page, browser,
    closeCompletedPrimaryTutorial, (path, data) => {
      events.push('persist')
      assert.equal(path, 'evidence/primary-tutorial-context.json')
      records.push(JSON.parse(data))
      if (options.persistFailure) throw options.persistFailure
      if (options.terminalPersistFailure && records.length === 2) throw options.terminalPersistFailure
    }, (...parts) => parts.join('/'), 'evidence', () => { events.push('save'); if (options.terminalSaveFailure && records.length === 2) throw options.terminalSaveFailure },
    async () => { events.push('primary'); if (options.primaryFailure) throw options.primaryFailure; return { checks: ['complete'] } },
    async () => { events.push('next'); assert.equal(contexts.includes(context), selectedScenario !== 'tutorial'); return 'next-result' })
  return { run, events, records, receipt, context, page, contexts, other }
}

test('actual tutorial caller preserves primary evidence, closes before next and clears only owned references', async () => {
  const f = fixture(), refs = await f.run()
  assert.deepEqual(refs, { context: undefined, page: undefined })
  assert.deepEqual(f.events, ['primary','snapshot','persist','save','close','persist','save','next'])
  assert.deepEqual(f.contexts, [f.other])
  assert.equal(f.records[0].status, 'closing')
  assert.equal(f.records[1].status, 'passed')
  assert.equal(f.records[1].contextClosed, true)
  assert.deepEqual(f.records[1].result, { checks: ['complete'] })
  assert.equal(f.records[1].contextsBefore, 2)
  assert.equal(f.records[1].contextsAfter, 1)
})

test('non-tutorial caller keeps its existing context ownership', async () => {
  const f = fixture(), refs = await f.run('other')
  assert.equal(refs.context, f.context); assert.equal(refs.page, f.page)
  assert.deepEqual(f.events, ['primary','next']); assert.equal(f.records.length, 0)
})

test('primary failure is preserved and prevents retirement and next episode', async () => {
  const error = Error('primary failure'), f = fixture({ primaryFailure: error })
  await assert.rejects(f.run(), candidate => candidate === error)
  assert.deepEqual(f.events, ['primary']); assert.ok(f.contexts.includes(f.context))
})

test('snapshot failure still closes owned context and retains original failure without advancing', async () => {
  const error = Error('snapshot failure'), f = fixture({ snapshotFailure: error })
  await assert.rejects(f.run(), candidate => candidate instanceof AggregateError && candidate.errors.includes(error))
  assert.equal(f.events.includes('next'), false); assert.deepEqual(f.contexts, [f.other])
  assert.equal(f.records.at(-1).status, 'failed'); assert.equal(f.records.at(-1).contextClosed, true)
})

test('close failure is terminal, preserves evidence and leaves outer cleanup ownership intact', async () => {
  const error = Error('close failure'), f = fixture({ closeFailure: error })
  await assert.rejects(f.run(), candidate => candidate instanceof AggregateError && candidate.errors.includes(error))
  assert.equal(f.events.includes('next'), false); assert.ok(f.contexts.includes(f.context))
  assert.equal(f.records.at(-1).contextClosed, false); assert.equal(f.records.at(-1).status, 'failed')
})

test('errors arriving during close remain visible and prevent the next episode', async () => {
  const f = fixture({ duringClose: true })
  await assert.rejects(f.run(), AggregateError)
  assert.deepEqual(f.records.at(-1).errors, ['late console error'])
  assert.equal(f.events.includes('next'), false); assert.deepEqual(f.contexts, [f.other])
})

test('evidence-write failure cannot skip owned cleanup or advance', async () => {
  const error = Error('write failure'), f = fixture({ persistFailure: error })
  await assert.rejects(f.run(), candidate => candidate instanceof AggregateError && candidate.errors.includes(error))
  assert.equal(f.events.includes('next'), false); assert.deepEqual(f.contexts, [f.other])
})

test('ownership mismatch never closes an unrelated context', async () => {
  const f = fixture(); let closed = false
  await assert.rejects(closeCompletedPrimaryTutorial({ browser: { contexts: () => [f.other] }, context: { close: () => { closed = true } }, page: f.page, result: {}, errors: [], persist: () => {} }), /ownership mismatch/)
  assert.equal(closed, false)
})


test('terminal-only evidence write failure marks in-memory receipt failed without retrying', async () => {
  const error = Error('terminal write failure'), f = fixture({ terminalPersistFailure: error })
  await assert.rejects(f.run(), candidate => candidate instanceof AggregateError && candidate.errors.includes(error))
  assert.equal(f.events.includes('next'), false); assert.equal(f.records.length, 2)
  assert.equal(f.receipt.primaryTutorial.status, 'failed')
  assert.equal(f.receipt.primaryTutorial.finalPersistenceFailed, true)
  assert.ok(f.receipt.primaryTutorial.failures.includes(String(error)))
  assert.deepEqual(f.contexts, [f.other])
})

test('terminal-only main receipt save failure preserves its cause for outer failure evidence', async () => {
  const error = Error('terminal save failure'), f = fixture({ terminalSaveFailure: error })
  const caught = await f.run().then(() => assert.fail('must fail'), error => error)
  assert.ok(caught instanceof AggregateError && caught.errors.includes(error))
  assert.equal(f.events.includes('next'), false); assert.equal(f.records.length, 2)
  assert.equal(f.receipt.primaryTutorial.status, 'failed')
  assert.ok(f.receipt.primaryTutorial.failures.includes(String(error)))
  const catchStart = source.indexOf("  receipt.status = 'failed'; receipt.failure = String(error); receipt.stack = error.stack; process.exitCode = 1")
  const catchEnd = source.indexOf('  if (page) {', catchStart)
  assert.ok(catchStart > 0 && catchEnd > catchStart)
  const receipt = {}, process = {}
  new Function('error', 'receipt', 'process', source.slice(catchStart, catchEnd))(caught, receipt, process)
  assert.ok(receipt.failureCauses.includes(String(error)))
  assert.equal(receipt.status, 'failed'); assert.equal(process.exitCode, 1)
})
