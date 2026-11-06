import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

test('hosted Help metadata guards use supplied controls and cannot admit discovery tests', () => {
  const fixture = fileURLToPath(new URL('../scripts/help-discovery-evidence/observer_test.py', import.meta.url))
  const result = spawnSync('python3', ['-I', '-S', '-B', fixture], {
    encoding: 'utf8', timeout: 20_000, maxBuffer: 1024 * 1024,
  })
  if (result.error && result.stderr) process.stderr.write(result.stderr)
  assert.ifError(result.error)
  assert.equal(result.signal, null, result.stderr)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stderr, /Ran 29 tests/)
  assert.match(result.stderr, /\nOK\s*$/)
})
