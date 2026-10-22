import assert from 'node:assert/strict'
import test from 'node:test'
import { runPauseStyleModes, assertPauseStyleCoverage, closePauseStyleContext } from '../scripts/local-render/pause-style-case-plan.mjs'
const signal = () => new AbortController().signal
function fixture(fallback) {
  const records = [], fullscreen = []
  for (const [width, height] of [[320,240], [640,480], [1920,1080], [800,450]]) {
    const size = `${width}x${height}`
    fullscreen.push({ fallback, label: `root-${size}` })
    for (const category of ['Game','Sound','Graphics']) fullscreen.push({ fallback, label: `options-${category}-${size}` })
    for (const panel of ['save','load']) {
      records.push({ fallback, panel, viewport: { width, height } })
      if (width !== 320) fullscreen.push({ fallback, label: `${panel}-${size}` })
    }
  }
  return { records, fullscreen }
}
for (const [mode, expected] of [['combined',[false,true]], ['native',[false]], ['fallback',[true]]]) {
  test(`${mode} dispatch retains fixed mode order`, async () => {
    const seen = []
    await runPauseStyleModes(mode, signal(), async value => seen.push(value))
    assert.deepEqual(seen, expected)
  })
}
test('unknown and inherited mode names fail before dispatch', async () => {
  for (const mode of ['other','constructor','__proto__',undefined])
    await assert.rejects(runPauseStyleModes(mode, signal(), () => assert.fail('must not run')), /Unknown pause-style/)
})
test('pre-aborted case does not create a context', async () => {
  const c = new AbortController(), reason = Error('deadline'); c.abort(reason)
  await assert.rejects(runPauseStyleModes('native', c.signal, () => assert.fail('must not run')), e => e === reason)
})
test('failure settles cleanup before rejection and never starts fallback', async () => {
  const events = [], reason = Error('predicate failed')
  await assert.rejects(runPauseStyleModes('combined', signal(), async value => {
    events.push(value)
    try { throw reason } finally { await Promise.resolve(); events.push('closed') }
  }), e => e === reason)
  assert.deepEqual(events, [false,'closed'])
})
test('next context awaits asynchronous cleanup', async () => {
  const events = []; let release, entered
  const cleanup = new Promise(resolve => { release = resolve })
  const started = new Promise(resolve => { entered = resolve })
  const work = runPauseStyleModes('combined', signal(), async value => {
    events.push(value)
    if (!value) { entered(); await cleanup; events.push('closed') }
  })
  await started; assert.deepEqual(events, [false])
  release(); await work; assert.deepEqual(events, [false,'closed',true])
})
test('cancellation during cleanup prevents the next context', async () => {
  const c = new AbortController(), seen = [], reason = Error('deadline')
  await assert.rejects(runPauseStyleModes('combined', c.signal, async value => {
    seen.push(value); await Promise.resolve(); c.abort(reason)
  }), e => e === reason)
  assert.deepEqual(seen, [false])
})
test('cleanup failure is retained without replacing primary failure', async () => {
  const receipt = { errors: [] }, primary = Error('primary'), cleanup = Error('cleanup')
  await assert.rejects((async () => {
    try { throw primary } finally { await closePauseStyleContext({ close: async () => { throw cleanup } }, true, receipt) }
  })(), e => e === primary)
  assert.deepEqual(receipt.errors, ['Pause context cleanup failed: Error: cleanup'])
})
test('cleanup-only failure fails; successful cleanup adds no error', async () => {
  const receipt = { errors: [] }, cleanup = Error('cleanup')
  await assert.rejects(closePauseStyleContext({ close: async () => { throw cleanup } }, false, receipt), e => e === cleanup)
  await closePauseStyleContext({ close: async () => {} }, false, receipt)
  assert.equal(receipt.errors.length, 1)
})
test('exact per-mode and combined ledgers pass', () => {
  const a = fixture(false), b = fixture(true)
  assert.equal(a.records.length, 8); assert.equal(a.fullscreen.length, 22)
  assertPauseStyleCoverage('native', a.records, a.fullscreen)
  assertPauseStyleCoverage('fallback', b.records, b.fullscreen)
  assertPauseStyleCoverage('combined', [...a.records,...b.records], [...a.fullscreen,...b.fullscreen])
})
test('duplicate, omitted, wrong-font and unexpected keys fail', () => {
  for (const field of ['records','fullscreen']) for (const kind of ['duplicate','omit','font','unknown']) {
    const data = fixture(false), list = data[field]
    if (kind === 'duplicate') list[1] = structuredClone(list[0])
    if (kind === 'omit') list.pop()
    if (kind === 'font') list[0].fallback = true
    if (kind === 'unknown') { if (field === 'records') list[0].panel = 'other'; else list[0].label = 'other' }
    assert.throws(() => assertPauseStyleCoverage('native', data.records, data.fullscreen))
  }
  const data = fixture(false); data.records[0].fallback = 'false'
  assert.throws(() => assertPauseStyleCoverage('native', data.records, data.fullscreen), /Font variant/)
})
test('one passing mode cannot satisfy combined coverage', () => {
  const data = fixture(false)
  assert.throws(() => assertPauseStyleCoverage('combined', data.records, data.fullscreen))
})

test('portable registry owns the new tests and split entrypoints without activating them', async () => {
  const { readFileSync } = await import('node:fs')
  const registry = JSON.parse(readFileSync(new URL('../engineering/checks.json', import.meta.url), 'utf8'))
  const lane = registry.checks.find(check => check.id === 'native-ui-evidence-tests')
  assert.ok(lane.args.includes('tests/pause-style-case-plan.test.mjs'))
  for (const path of ['scripts/local-render/pause-style-case-plan.mjs', 'scripts/local-render/original-pause-checkpoint-native-style.mjs', 'scripts/local-render/original-pause-checkpoint-fallback-style.mjs'])
    assert.ok(lane.inputs.includes(path), path)
})
