import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8')
const body = source.match(/waitReady = async phase => \{([\s\S]*?)\n    \}\n  try/)[1]

test('F9 readiness settles public opening messages before its original unlocked-input wait', async () => {
  const calls = []
  const page = {
    waitForFunction: async predicate => { calls.push(predicate.toString().includes('skip-introduction') ? 'introduction' : 'unlocked'); return { dispose: async () => calls.push('dispose') } },
    locator: () => ({ isVisible: async () => true, click: async () => calls.push('skip') }),
  }
  const ready = vm.runInNewContext(`(async phase => {${body}})`, {
    page, bindGame: async () => calls.push('bind'),
    settleOpeningMessages: async () => calls.push('settle'), diagnostics: { stage() {} },
  })
  for (const phase of ['new game', 'checkpoint load', 'restart']) {
    calls.length = 0
    await ready(phase)
    assert.deepEqual(calls, ['bind', 'introduction', 'skip', 'dispose', 'settle', 'unlocked'])
    assert.ok(source.includes(`await waitReady('${phase}')`))
  }
  assert.match(source, /spellTestLimitMs = 75000/)
  assert.match(source, /page\.setDefaultTimeout\(12000\)/)
})

test('F9 does not proceed to acceptance after opening settlement fails', async () => {
  let unlocked = false
  const ready = vm.runInNewContext(`(async phase => {${body}})`, {
    page: { locator: () => ({ isVisible: async () => false }), waitForFunction: async predicate => {
      if (!predicate.toString().includes('skip-introduction')) unlocked = true
      return { dispose: async () => {} }
    } }, bindGame: async () => {}, diagnostics: { stage() {} },
    settleOpeningMessages: async () => { throw Error('modal did not settle') },
  })
  await assert.rejects(ready('new game'), /modal did not settle/)
  assert.equal(unlocked, false)
})
