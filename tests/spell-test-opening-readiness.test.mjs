import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8')
const body = source.match(/waitReady = async phase => \{([\s\S]*?)\n    \}\n  try/)[1]

const iconSource = readFileSync(new URL('../scripts/tutorial-browser/spell-icon-states.mjs', import.meta.url), 'utf8')
const iconBody = iconSource.match(/const open = async \(observedBrowser, mission = 1\) => \{([\s\S]*?)\n  \}/)[1]

test('spell icon opening settles messages before unchanged unlocked-input acceptance', async () => {
  for (const skip of [false, true]) {
    const calls = []
    const page = {
      setDefaultTimeout: value => assert.equal(value, 10000), goto: async () => {},
      getByRole: () => ({ focus: async () => {}, click: async () => calls.push('skip') }),
      keyboard: { press: async () => {} }, evaluate: async () => calls.push('scene'),
      waitForFunction: async predicate => {
        calls.push(predicate.toString().includes('skip-introduction') ? 'introduction' : 'unlocked')
        return { jsonValue: async () => skip ? 'skip' : 'ready', dispose: async () => calls.push('dispose') }
      },
    }
    const open = vm.runInNewContext(`(async (observedBrowser, mission = 1) => {${iconBody}})`, {
      url: 'https://unused.invalid', showAllMissions: async () => {}, bindGame: async () => {},
      settleOpeningMessages: async () => calls.push('settle'),
    })
    await open({ newContext: async () => ({ newPage: async () => page }) })
    assert.deepEqual(calls, ['introduction', ...(skip ? ['skip'] : []), 'dispose', 'settle', 'unlocked', 'scene'])
  }
  assert.match(iconSource, /spellIconEpisodeLimitMs = 75000/)
})

test('spell icon opening settlement failure prevents unlocked-input acceptance', async () => {
  const failure = Error('opening modal remains'), calls = []
  const open = vm.runInNewContext(`(async (observedBrowser, mission = 1) => {${iconBody}})`, {
    url: 'https://unused.invalid', showAllMissions: async () => {}, bindGame: async () => {},
    settleOpeningMessages: async () => { throw failure },
  })
  const page = {
    setDefaultTimeout() {}, goto: async () => {}, getByRole: () => ({ focus: async () => {} }),
    keyboard: { press: async () => {} }, evaluate: async () => calls.push('scene'),
    waitForFunction: async predicate => {
      calls.push(predicate.toString().includes('skip-introduction') ? 'introduction' : 'unlocked')
      return { jsonValue: async () => 'ready', dispose: async () => {} }
    },
  }
  await assert.rejects(open({ newContext: async () => ({ newPage: async () => page }) }), error => error === failure)
  assert.deepEqual(calls, ['introduction'])
})

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
