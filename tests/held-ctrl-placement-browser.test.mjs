import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  assertPlacementStep,
  finishHeldCtrlPlacement,
  heldCtrlPlacementLimitMs,
} from '../scripts/tutorial-browser/held-ctrl-placement.mjs'

const state = () => ({ level: 1, paused: false, buildingIds: [1, 2], selected: [7], mode: 'hut' })
test('step oracle rejects missing/duplicate/replaced plans, modifier exit or selection drift', () => {
  const before = state(),
    after = { ...state(), buildingIds: [1, 2, 3] }
  assert.doesNotThrow(() => assertPlacementStep(before, after, 1, 'hut'))
  for (const patch of [
    { level: 2 },
    { paused: true },
    { mode: null },
    { selected: [] },
    { buildingIds: [1, 2] },
    { buildingIds: [1, 3, 4] },
    { buildingIds: [1, 2, 2] },
  ])
    assert.throws(() => assertPlacementStep(before, { ...after, ...patch }, 1, 'hut'))
  assert.doesNotThrow(() => assertPlacementStep(before, state(), 0, 'hut'))
  assert.doesNotThrow(() => assertPlacementStep(before, { ...after, mode: null }, 1, null))
})
async function fixture(run) {
  const output = mkdtempSync(join(tmpdir(), 'held-ctrl-placement-test-'))
  const report = { status: 'running', errors: [], previews: [], contextClosed: false }
  const context = { async close() {} }
  const read = () => JSON.parse(readFileSync(join(output, 'held-ctrl-placement.json'), 'utf8'))
  try {
    await run({ output, report, context, read })
  } finally {
    rmSync(output, { recursive: true, force: true })
  }
}
test('success receipt requires completed context cleanup', async () =>
  fixture(async options => {
    const result = await finishHeldCtrlPlacement(options)
    assert.equal(result.status, 'passed')
    assert.equal(result.contextClosed, true)
    assert.deepEqual(options.read(), result)
  }))
test('late runtime errors during cleanup reject acceptance', async () =>
  fixture(async options => {
    options.context.close = async () => {
      options.report.errors.push('late runtime error')
    }
    await assert.rejects(finishHeldCtrlPlacement(options), AggregateError)
    assert.equal(options.read().status, 'failed')
    assert.match(options.read().failures[0].message, /late runtime error/)
  }))
test('original failure, cleanup failure and deadline remain terminal failures', async () =>
  fixture(async options => {
    options.failed = true
    options.failure = Error('preview mismatch')
    options.report.timedOut = true
    options.context.close = async () => {
      throw Error('close failed')
    }
    await assert.rejects(finishHeldCtrlPlacement(options), AggregateError)
    const result = options.read()
    assert.equal(result.status, 'failed')
    assert.equal(result.contextClosed, false)
    assert.equal(result.failures.length, 3)
    assert.match(result.failures[0].message, /preview mismatch/)
    assert.match(result.failures[1].message, /close failed/)
    assert.match(result.failures[2].message, /60-second/)
  }))
test('source-only scenario preserves existing caps and uses real keyboard/mouse input', () => {
  assert.equal(heldCtrlPlacementLimitMs, 60000)
  assert.equal(browserCapMs('tutorial'), 240000)
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/held-ctrl-placement.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /keyboard.down\('Control'\)/)
  assert.match(source, /keyboard.up\('Control'\)/)
  assert.match(source, /page.mouse.click/)
  assert.match(source, /elementFromPoint/)
})
test('falsey original rejection remains a failure after cleanup', async () =>
  fixture(async options => {
    options.failed = true
    options.failure = undefined
    await assert.rejects(
      finishHeldCtrlPlacement(options),
      error => error instanceof AggregateError && error.errors[0] === undefined
    )
    assert.equal(options.read().status, 'failed')
  }))

test('dedicated owner bounds setup and episode without changing prior caps', () => {
  assert.equal(browserCapMs('held-ctrl-placement'), 90000)
  assert.equal(browserCapMs('building-panel-edges'), 90000)
  assert.equal(browserCapMs('frontend-held-escape'), 180000)
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/run.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /heldCtrlScenarioSha256: hash\(heldCtrlScenario\)/)
  assert.match(source, /receipt\.heldCtrlPlacement = await/)
  assert.ok(
    source.indexOf('}, receipt.browserCapMs)') < source.indexOf('receipt.heldCtrlPlacement = await')
  )
  assert.match(source, /held-ctrl-placement.json/)
})
