import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

test('native research input links preserve committed identities and reject unsafe targets', () => {
  const result = spawnSync('python3', ['-B', fileURLToPath(new URL('./shared_native_inputs_test.py', import.meta.url))], {
    encoding: 'utf8',
    timeout: 30_000,
  })
  assert.equal(result.error, undefined)
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
