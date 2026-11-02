import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
const start = runner.indexOf('    receipt.snapshotQueryArm = {}'), end = runner.indexOf("  } else if (selectedScenario === 'ordinary-pointer-smoke')", start)
assert.ok(start >= 0 && end > start)
const body = runner.slice(start, end).replaceAll('await import(', 'await importing(')
const block = body.slice(body.indexOf('Object.fromEntries(['), body.indexOf('].map(path'))
const paths = [...block.matchAll(/'([^']+)'/g)].map(m => m[1])
for (const mode of ['accepted', 'missing-pin', 'invalid-pin', 'profile-refused', 'import-refused']) {
  test(`actual query dispatch ${mode} binds source before model import`, async () => {
    const calls = [], receipt = { buildRevision: 'a'.repeat(40) }, files = Object.fromEntries(paths.map(p => [p, 'b'.repeat(64)]))
    if (mode === 'missing-pin') delete files[paths[0]]
    if (mode === 'invalid-pin') files[paths[0]] = 'bad'
    const importing = async path => {
      calls.push(path)
      if (path.endsWith('snapshot-drag-contract.mjs')) return { inspectDragSource: () => { calls.push('inspect'); return {} } }
      if (path.endsWith('reader-build.mjs')) return { readerSourceEvidence: () => { calls.push('profile'); return { profile: mode === 'profile-refused' ? null : 'supplied', importSha256: mode === 'import-refused' ? null : 'd'.repeat(64) } } }
      if (path.endsWith('snapshot-reader-proof.mjs')) return { readerImportSha256: 'd'.repeat(64) }
      if (path.endsWith('snapshot-query-arm.mjs')) return { default: async args => { calls.push('route'); Object.assign(args.receipt, { status: 'observed-unqualified', comparisonEligible: false, interpretationEligible: false }) } }
      if (path.endsWith('checkpoint-format.ts')) return { CHECKPOINT_VERSION: 5 }
      throw Error('unexpected import')
    }
    const execute = () => vm.runInNewContext('(async () => {' + body + '})()', { assert, receipt, importing, source: { files }, root: 'root', browser: {}, url: 'url', out: 'out', dist: 'dist' })
    if (mode === 'accepted') {
      await execute(); assert.ok(calls.indexOf('profile') < calls.findIndex(p => p.endsWith('snapshot-query-arm.mjs'))); assert.equal(calls.at(-1), 'route')
    } else {
      await assert.rejects(execute()); assert.equal(calls.some(p => p.endsWith('snapshot-query-arm.mjs') || p.endsWith('checkpoint-format.ts')), false)
      assert.equal(receipt.snapshotQueryArmEntered, undefined)
      if (mode.endsWith('pin')) assert.deepEqual(calls, [])
    }
  })
}
test('pre-entry refusal closes browser and server through original outer fallback', async () => {
  const a = runner.indexOf('    receipt.queryArmRunnerCleanup = {'), b = runner.indexOf("  } else if (selectedScenario === 'camera-motion-evidence')", a)
  assert.ok(a >= 0 && b > a)
  const receipt = { snapshotQueryArm: {} }, process = {}, calls = []
  await vm.runInNewContext('(async () => {' + runner.slice(a,b) + '})()', { receipt, process,
    browser: { close: () => calls.push('browser') }, server: { close: () => calls.push('server') },
    closeOrdinaryPointerSmokeOwner: async close => { await close(); return { confirmed: true } } })
  assert.deepEqual(calls, ['browser','server']); assert.equal(receipt.cleanupVerified, false); assert.equal(process.exitCode, 1)
})
