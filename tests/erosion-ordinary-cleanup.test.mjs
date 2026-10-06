// Invoke the actual scenario function but fail before page/World/input work.
// Fixture methods do not create a browser, profile, file or model.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const source = readFileSync(new URL('../qa/erosion-ordinary/scenario.mjs', import.meta.url), 'utf8')
const marker = 'export default async function ordinaryErosion'
assert.ok(source.includes(marker))
const body = source.slice(source.indexOf(marker)).replace('export default ', '')
const root = '/synthetic', sourceReceipt = {}
const launch = { plan: { output: '/synthetic/out', origin: 'http://127.0.0.1:1', profilePath: '/synthetic/profile' }, source: sourceReceipt }
for (const primary of [undefined, null, false, 0, '', new Error('synthetic primary')]) {
  test(`scenario cleanup preserves the original thrown ${String(primary)} value`, async () => {
    const cleanup = new Error('synthetic archive cleanup failure')
    let observations = 0, cleanups = 0
    const bindings = { assert, resolve, ownRoot: root, launch, mkdirSync() {}, writeFileSync() { cleanups++; throw cleanup },
      sha256() {}, evidenceBytes: JSON.stringify, observeLoadedModules: async () => { observations++; throw primary }, limits: { wallMs: 900000 } }
    const scenario = new Function(...Object.keys(bindings), `return (${body})`)(...Object.values(bindings))
    const receipt = { source: sourceReceipt, profile: { mode: 'created', path: launch.plan.profilePath, previousRun: null, checkpointAtStart: null, runId: 'synthetic' } }
    let threw = false, actual
    try { await scenario({ page: { setDefaultTimeout() {} }, root, output: launch.plan.output, url: launch.plan.origin,
      signal: { throwIfAborted() {} }, receipt }) }
    catch (error) { threw = true; actual = error }
    assert.equal(threw, true); assert.ok(Object.is(actual, primary))
    assert.equal(observations, 1); assert.equal(cleanups, 1)
    assert.deepEqual(receipt.erosionCleanupFailures, [String(cleanup)])
  })
}
