import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

test('native function inventory rejects incomplete analysis and preserves exact source identity', () => {
  const script = fileURLToPath(new URL('./native_function_inventory_test.py', import.meta.url))
  const result = spawnSync('python3', [script], {
    encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  })
  assert.equal(result.status, 0, String(result.error ?? '') + result.stdout + result.stderr)
})
