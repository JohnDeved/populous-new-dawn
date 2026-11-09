import test from 'node:test'
import assert from 'node:assert/strict'
import { assertPauseGroup } from '../scripts/native-ui-evidence/pause-acceptance.mjs'
function fixture() {
  return ['native', 'fallback'].map(mode => {
    const records = [], fullscreen = [], fallback = mode === 'fallback'
    for (const size of ['320x240', '640x480', '800x450', '1920x1080']) {
      const [width, height] = size.split('x').map(Number)
      fullscreen.push({ fallback, label: `root-${size}` })
      for (const category of ['Game', 'Sound', 'Graphics']) fullscreen.push({ fallback, label: `options-${category}-${size}` })
      for (const panel of ['save', 'load']) {
        records.push({ fallback, panel, viewport: { width, height } })
        if (size !== '320x240') fullscreen.push({ fallback, label: `${panel}-${size}` })
      }
    }
    return { id: `pause-checkpoint-${mode}`, status: 'passed', timedOut: false, cleanupVerified: true,
      result: { executionContract: { version: 'pause-style-split-v1', mode, primary: false }, records, fullscreen } }
  })
}
test('both exact independent font variants require all sixteen body and forty-four focus outcomes', () => {
  const records = fixture()
  assert.equal(records.flatMap(record => record.result.records).length, 16)
  assert.equal(records.flatMap(record => record.result.fullscreen).length, 44)
  assertPauseGroup(records)
})
test('a missing, duplicate, skipped, timed-out, unclean or legacy case never passes', () => {
  const mutations = [r => r.pop(), r => r.push(r[0]), r => { r[1].status = 'not-run' },
    r => { r[1].timedOut = true }, r => { r[1].cleanupVerified = false },
    r => { delete r[0].result.executionContract }, r => { r[0].result.executionContract.primary = true },
    r => { r[0].id = 'pause-checkpoint' }, r => { r[1].result.executionContract.mode = 'native' }]
  for (const mutate of mutations) { const records = fixture(); mutate(records); assert.throws(() => assertPauseGroup(records)) }
})
test('omitted, duplicated, extra and mislabelled body/focus outcomes never pass', () => {
  for (const key of ['records', 'fullscreen']) for (const change of ['omit', 'duplicate', 'extra', 'wrong-variant']) {
    const records = fixture(), items = records[1].result[key]
    if (change === 'omit') items.pop()
    if (change === 'duplicate') items[1] = items[0]
    if (change === 'extra') items.push(items[0])
    if (change === 'wrong-variant') items[0].fallback = false
    assert.throws(() => assertPauseGroup(records))
  }
})
