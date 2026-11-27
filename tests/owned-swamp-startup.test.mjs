import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
const source = readFileSync(new URL('../scripts/owned-swamp-evidence/scenario.mjs', import.meta.url), 'utf8')
const start = source.indexOf("    if (startupValue === 'skip')")
const end = source.indexOf('    await deadline.run(() => page.evaluate(async () => {', start)
assert.ok(start > 0 && end > start)
const body = source.slice(start, end)
for (const startupValue of ['skip', 'ready']) test(`${startupValue} startup settles before unchanged input readiness`, async () => {
  const calls = []
  const run = vm.runInNewContext(`(async () => {${body}})`, {
    startupValue, deadline: { run: fn => fn() },
    page: { getByRole: () => ({ click: async () => calls.push('skip') }), waitForFunction: async () => calls.push('ready') },
    settleOpeningMessages: async () => calls.push('settle'),
  })
  await run()
  assert.deepEqual(calls, [...(startupValue === 'skip' ? ['skip'] : []), 'settle', 'ready'])
})
test('unsettled startup fails before readiness or Swamp setup', async () => {
  const run = vm.runInNewContext(`(async () => {${body}})`, {
    startupValue: 'ready', deadline: { run: fn => fn() }, page: { waitForFunction: async () => assert.fail('must not run') },
    settleOpeningMessages: async () => { throw Error('unsettled') },
  })
  await assert.rejects(run(), /unsettled/)
})
