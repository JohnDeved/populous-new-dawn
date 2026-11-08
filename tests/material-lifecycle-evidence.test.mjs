import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';

test('material lifecycle fixtures and read-only host regression preserve fail-closed boundaries', () => {
  // Sequential fixtures plus bounded read-only Linux loader identity regression.
  // No acquisition, compiler build, qualifier or browser.
  for (const suite of ['controller', 'execution', 'fresh-projection', 'hosted-entry', 'hosted-resources', 'hosted-workflow', 'bwrap-prerequisites']) {
    const result = spawnSync('python3', ['-I', '-B', `tests/material-${suite}.test.py`], {
      cwd: new URL('..', import.meta.url),
      timeout: 20_000,
      maxBuffer: 1024 * 1024,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    assert.ifError(result.error);
    assert.equal(result.signal, null, `${suite} pure suite terminated by signal`);
    assert.equal(result.status, 0, `${suite} pure suite failed`);
  }
});
