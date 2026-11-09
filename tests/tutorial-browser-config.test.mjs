import test from 'node:test'
import assert from 'node:assert/strict'
import { browserConfiguration } from '../scripts/tutorial-browser/browser-config.mjs'

test('actual-Home browser keeps the hosted Linux Chrome default and sandbox contract', () => {
  assert.deepEqual(browserConfiguration(), {
    browserPath: '/opt/google/chrome/chrome',
    browserPathSource: 'hosted-default',
    launch: {
      channel: 'chrome', headless: true, chromiumSandbox: true, ignoreDefaultArgs: true,
      args: ['--headless', '--remote-debugging-pipe'], timeout: 30000,
    },
  })
})

test('explicit Mac executable is both the recorded and launched path with the same sandbox settings', () => {
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const config = browserConfiguration(executablePath)
  assert.equal(config.browserPath, executablePath)
  assert.equal(config.browserPathSource, 'explicit-override')
  assert.deepEqual(config.launch, {
    executablePath, headless: true, chromiumSandbox: true, ignoreDefaultArgs: true,
    args: ['--headless', '--remote-debugging-pipe'], timeout: 30000,
  })
  assert.equal('channel' in config.launch, false)
})

test('browser override rejects empty, relative and non-string executable paths', () => {
  for (const value of ['', './chrome', 'chrome', null, 12]) {
    assert.throws(() => browserConfiguration(value), /absolute verified browser executable/)
  }
})
