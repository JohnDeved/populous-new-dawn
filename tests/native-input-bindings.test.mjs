import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';

test('native input-binding atlas decodes synthetic tables and fails closed', () => {
  const result = spawnSync('python3', ['-B', 'tests/native-input-bindings.test.py'], {
    cwd: new URL('..', import.meta.url), encoding: 'utf8', timeout: 120_000,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}\n${result.error ?? ''}`);
});
