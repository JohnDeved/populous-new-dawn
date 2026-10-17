import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';

test('cloud bootstrap preserves work and verifies recovery inputs', () => {
  const result = spawnSync('python3', ['tests/cloud-bootstrap.test.py'], {
    cwd: new URL('..', import.meta.url), encoding: 'utf8', timeout: 120_000,
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}\n${result.error ?? ''}`);
});
