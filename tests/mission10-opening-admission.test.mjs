import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('../scripts/tutorial-browser/mission10-profile.mjs', import.meta.url), 'utf8')
const body = source.match(/const openMission = async mission => \{([\s\S]*?)\n          \}/)[1]

for (const startup of ['skip', 'ready']) test(`M10 ${startup} startup settles campaign ownership before original input readiness`, async () => {
  const calls = []
  const open = vm.runInNewContext(`(async mission => {${body}})`, {
    assert, page: { getByRole: () => ({ focus: async () => calls.push('focus') }),
      keyboard: { press: async () => calls.push('Enter') },
      waitForFunction: async predicate => {
        calls.push(predicate.name === 'pauseStartupReady' ? 'startup' : 'unlocked')
        return { jsonValue: async () => startup, dispose: async () => calls.push('dispose') }
      } },
    showAllMissions: async () => calls.push('missions'), bindGame: async () => calls.push('bind'),
    pauseStartupReady: function pauseStartupReady() {},
    skipPauseIntroduction: async () => calls.push('skip'),
    settleOpeningMessages: async () => calls.push('settle'),
  })
  await open(10)
  assert.deepEqual(calls, ['missions', 'focus', 'Enter', 'bind', 'startup', 'dispose', ...(startup === 'skip' ? ['skip'] : []), 'settle', 'unlocked'])
})

test('M10 settlement failure prevents entering crew acceptance', async () => {
  let unlocked = false
  const open = vm.runInNewContext(`(async mission => {${body}})`, {
    assert, page: { getByRole: () => ({ focus: async () => {} }), keyboard: { press: async () => {} },
      waitForFunction: async predicate => {
        if (predicate.name !== 'pauseStartupReady') unlocked = true
        return { jsonValue: async () => 'ready', dispose: async () => {} }
      } },
    showAllMissions: async () => {}, bindGame: async () => {}, pauseStartupReady: function pauseStartupReady() {},
    settleOpeningMessages: async () => { throw Error('unsettled opening') },
  })
  await assert.rejects(open(10), /unsettled opening/)
  assert.equal(unlocked, false)
})
