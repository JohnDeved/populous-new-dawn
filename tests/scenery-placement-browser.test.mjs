import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  assertPreview,
  finishSceneryPlacement,
  sceneryPlacementLimitMs,
} from '../scripts/tutorial-browser/scenery-placement.mjs'

const state = () => ({
  level: 1,
  paused: true,
  turn: 12,
  buildingIds: [1, 2],
  shadows: [[3, 55, 4, 512, 1024]],
  treeMeshes: 1,
})
test('preview contract rejects world, clock, placement, scenery or rendered-tree drift', () => {
  const before = state()
  assert.doesNotThrow(() => assertPreview(before, state()))
  for (const patch of [
    { level: 2 },
    { paused: false },
    { turn: 13 },
    { buildingIds: [1, 2, 3] },
    { shadows: [[3, 55, 4, 1024, 1024]] },
    { treeMeshes: 0 },
  ])
    assert.throws(() => assertPreview(before, { ...state(), ...patch }))
})
async function fixture(run) {
  const output = mkdtempSync(join(tmpdir(), 'scenery-placement-test-'))
  const report = { status: 'running', errors: [], previews: [], contextClosed: false }
  const context = { async close() {} }
  const read = () => JSON.parse(readFileSync(join(output, 'scenery-placement.json'), 'utf8'))
  try {
    await run({ output, report, context, read })
  } finally {
    rmSync(output, { recursive: true, force: true })
  }
}
test('success receipt requires completed context cleanup', async () =>
  fixture(async options => {
    const result = await finishSceneryPlacement(options)
    assert.equal(result.status, 'passed')
    assert.equal(result.contextClosed, true)
    assert.deepEqual(options.read(), result)
  }))
test('late runtime errors during cleanup reject acceptance', async () =>
  fixture(async options => {
    options.context.close = async () => {
      options.report.errors.push('late runtime error')
    }
    await assert.rejects(finishSceneryPlacement(options), AggregateError)
    assert.equal(options.read().status, 'failed')
    assert.match(options.read().failures[0].message, /late runtime error/)
  }))
test('original failure, cleanup failure and deadline remain terminal failures', async () =>
  fixture(async options => {
    options.failure = Error('preview mismatch')
    options.report.timedOut = true
    options.context.close = async () => {
      throw Error('close failed')
    }
    await assert.rejects(finishSceneryPlacement(options), AggregateError)
    const result = options.read()
    assert.equal(result.status, 'failed')
    assert.equal(result.contextClosed, false)
    assert.equal(result.failures.length, 3)
    assert.match(result.failures[0].message, /preview mismatch/)
    assert.match(result.failures[1].message, /close failed/)
    assert.match(result.failures[2].message, /60-second/)
  }))
test('existing hosted runner keeps prior scenarios, bounded timing and source identity', () => {
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/run.mjs', import.meta.url),
    'utf8'
  )
  assert.equal(sceneryPlacementLimitMs, 60000)
  assert.ok(source.indexOf('receipt.result =') < source.indexOf('receipt.selectorInspection ='))
  assert.ok(
    source.indexOf('receipt.selectorInspection =') < source.indexOf('receipt.sceneryPlacement =')
  )
  assert.match(source, /sceneryScenarioSha256: hash\(sceneryScenario\)/)
  assert.match(source, /180000\)/)
  assert.match(source, /120000\)/)
  assert.match(source, /receipt\.status = 'passed'/)
})
