import test from 'node:test'
import assert from 'node:assert/strict'
import { createStageTiming } from '../scripts/tutorial-browser/stage-timing.mjs'

test('stage timing records supplied elapsed boundaries without scheduling or invoking workload', () => {
  let now = 100
  const timing = createStageTiming(() => now)
  timing.mark('reveal:start')
  now = 125
  timing.mark('reveal:hit-complete')
  now = 131
  timing.mark('reveal:end')
  assert.deepEqual(timing.report.entries, [
    { stage: 'reveal:start', elapsedMs: 0 },
    { stage: 'reveal:hit-complete', elapsedMs: 25 },
    { stage: 'reveal:end', elapsedMs: 31 },
  ])
  assert.equal(timing.report.clockErrors, 0)
})

test('an interrupted stage retains its last boundary and bounded storage', () => {
  const timing = createStageTiming(() => 10)
  timing.mark('reveal:start')
  assert.equal(timing.report.entries.at(-1).stage, 'reveal:start')
  for (let i = 0; i < 140; i++) timing.mark('boundary')
  assert.equal(timing.report.entries.length, 128)
  assert.equal(timing.report.dropped, 13)
  assert.equal(timing.report.entries[0].stage, 'reveal:start')
})

test('clock failures and invalid labels cannot throw or fabricate elapsed time', () => {
  let value = 20
  const timing = createStageTiming(() => {
    if (value === 'throw') throw Error('clock unavailable')
    return value
  })
  for (const invalid of [NaN, Infinity, 19, 'throw']) {
    value = invalid
    assert.doesNotThrow(() => timing.mark('failed-clock'))
  }
  value = 24
  timing.mark('recovered')
  assert.deepEqual(timing.report.entries.slice(0, 4).map(x => x.elapsedMs), [null, null, null, null])
  assert.equal(timing.report.entries.at(-1).elapsedMs, 4)
  assert.equal(timing.report.clockErrors, 4)
  timing.mark('x'.repeat(97)); timing.mark(null)
  assert.equal(timing.report.invalidLabels, 2)
  assert.equal(timing.report.entries.length, 5)
})
