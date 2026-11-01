import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';

test('shared resource helper fixtures preserve fail-closed boundaries', () => {
  // Python guards every subprocess API before importing the helpers. This runs
  // generated fixtures only, never the live qualifier or application commands.
  const result = spawnSync('python3', ['-I', '-B', 'tests/shared-resource-helpers.test.py'], {
    cwd: new URL('..', import.meta.url),
    timeout: 60_000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.ifError(result.error);
  assert.equal(result.signal, null, 'pure fixture process terminated by signal');
  assert.equal(result.status, 0, 'shared resource helper fixtures failed');
});
