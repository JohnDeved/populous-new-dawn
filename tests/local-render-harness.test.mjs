import test from 'node:test'
import assert from 'node:assert/strict'
import { launchOptions, parseOptions } from '../scripts/local-render/harness.mjs'
test('local launch preserves sandbox and removes all unsafe Playwright defaults', () => {
  const options = launchOptions('/tmp/official-headless-shell')
  assert.equal(options.chromiumSandbox, true)
  assert.equal(options.ignoreDefaultArgs, true)
  assert.deepEqual(options.args, ['--remote-debugging-pipe'])
  assert.ok(!JSON.stringify(options).includes('--no-sandbox'))
  assert.ok(!JSON.stringify(options).includes('--enable-unsafe-swiftshader'))
  assert.throws(() => launchOptions(''), /installed official/)
})
test('CLI accepts separate game root, owned output, browser and bounded settings', () => {
  const options = parseOptions(['--game-root', '/tmp/game', '--port', '4199', '--output', '/tmp/proof', '--browser', '/tmp/shell', '--mission', '3', '--timeout', '90000'])
  assert.equal(options.gameRoot, '/tmp/game'); assert.equal(options.port, 4199)
  assert.equal(options.output, '/tmp/proof'); assert.equal(options.browserPath, '/tmp/shell')
  assert.equal(options.mission, 3); assert.equal(options.timeout, 90000)
})
test('CLI rejects unknown flags, missing values and unbounded inputs', () => {
  for (const args of [['--no-sandbox', 'true'], ['--port'], ['--port', '80'], ['--port', 'NaN'], ['--mission', '0'], ['--timeout', '-1']]) assert.throws(() => parseOptions(args))
})
