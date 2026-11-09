import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('native event replay synthetic schema and adversarial contracts (no native execution)', () => {
  const script = fileURLToPath(new URL('./native-event-replay.test.py', import.meta.url))
  const result = spawnSync('python3', ['-B', script, '-v'], { encoding: 'utf8', timeout: 30000 })
  assert.equal(result.error, undefined)
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
