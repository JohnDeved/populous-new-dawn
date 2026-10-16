import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { finishInspection } from '../scripts/tutorial-browser/selector-inspection.mjs'

async function fixture(run) {
  const output = mkdtempSync(join(tmpdir(), 'selector-cleanup-'))
  const events = [], errors = []
  const options = {
    output, errors, episodes: [{ initiallyPaused: true }],
    observation: { async evaluate() { events.push('disconnect') } },
    context: { async close() { events.push('close') } },
  }
  const receipt = () => JSON.parse(readFileSync(join(output, 'selector-inspection.json'), 'utf8'))
  try { await run({ options, events, errors, receipt }) } finally { rmSync(output, { recursive: true, force: true }) }
}

test('selector saves success only after observation and context cleanup finish', async () => {
  await fixture(async ({ options, events, receipt }) => {
    options.context.close = async () => {
      assert.equal(existsSync(join(options.output, 'selector-inspection.json')), false)
      events.push('close')
    }
    const terminal = await finishInspection(options)
    assert.deepEqual(events, ['disconnect', 'close'])
    assert.deepEqual(receipt(), terminal)
    assert.equal(terminal.status, 'passed')
    assert.deepEqual(terminal.cleanup, { observationDisconnected: true, contextClosed: true, errors: [] })
  })
})

test('selector rejects and saves runtime/console errors emitted during close', async () => {
  await fixture(async ({ options, errors, receipt }) => {
    options.context.close = async () => { errors.push('late pageerror', 'late console error') }
    await assert.rejects(finishInspection(options), error => {
      assert.ok(error instanceof AggregateError)
      assert.match(error.errors[0].message, /late pageerror.*late console error/)
      return true
    })
    assert.equal(receipt().status, 'failed')
    assert.deepEqual(receipt().errors, ['late pageerror', 'late console error'])
    assert.equal(receipt().cleanup.contextClosed, true)
  })
})

test('selector preserves scenario and both cleanup failures while attempting context close', async () => {
  await fixture(async ({ options, events, errors, receipt }) => {
    const scenarioError = new Error('selector assertion failed')
    const disconnectError = new Error('observer disconnect failed')
    const closeError = new Error('context close failed')
    options.failure = scenarioError
    options.diagnostics = { state: { sameWorld: false } }
    options.observation.evaluate = async () => { events.push('disconnect'); throw disconnectError }
    options.context.close = async () => { events.push('close'); errors.push('late error'); throw closeError }
    await assert.rejects(finishInspection(options), error => {
      assert.deepEqual(error.errors.slice(0, 3), [scenarioError, disconnectError, closeError])
      assert.match(error.errors[3].message, /late error/)
      return true
    })
    assert.deepEqual(events, ['disconnect', 'close'])
    const terminal = receipt()
    assert.equal(terminal.status, 'failed')
    assert.match(terminal.failure.message, /selector assertion failed/)
    assert.deepEqual(terminal.failure.state, { sameWorld: false })
    assert.equal(terminal.cleanup.observationDisconnected, false)
    assert.equal(terminal.cleanup.contextClosed, false)
    assert.deepEqual(terminal.cleanup.errors.map(error => error.phase), ['observationDisconnected', 'contextClosed'])
    assert.deepEqual(terminal.errors, ['late error'])
  })
})
