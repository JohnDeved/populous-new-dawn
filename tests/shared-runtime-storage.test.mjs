import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('shared runtime storage preserves source identity, isolates caches and rejects drift', () => {
  const testPath = fileURLToPath(new URL('./shared_runtime_storage_test.py', import.meta.url));
  const result = spawnSync('python3', [testPath], {
    encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
