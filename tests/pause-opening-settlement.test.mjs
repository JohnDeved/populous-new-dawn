import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

for (const scenario of ['recovery', 'style']) {
  const source = readFileSync(new URL(`../scripts/local-render/original-pause-checkpoint-${scenario}.mjs`, import.meta.url), 'utf8')
  const admission = source.match(/const action = await waitForPauseStartup\(page\)([\s\S]*?)await page.waitForFunction\(\(\) => !window.testStore.getWorld\(\).inputMask\)/)[0]
  for (const fails of [false, true]) test(`${scenario} settles authored opening before unlocked-input acceptance (${fails ? 'failure' : 'success'})`, async () => {
    const calls = [], failure = new Error('opening remained modal')
    const run = vm.runInNewContext(`(async () => { ${admission} })`, {
      page: { waitForFunction: async () => calls.push('unlocked') },
      waitForPauseStartup: async () => 'skip',
      skipPauseIntroduction: async () => calls.push('skip'),
      settleOpeningMessages: async () => { calls.push('settle'); if (fails) throw failure },
    })
    if (fails) await assert.rejects(run(), error => error === failure)
    else await run()
    assert.deepEqual(calls, fails ? ['skip', 'settle'] : ['skip', 'settle', 'unlocked'])
  })
}
