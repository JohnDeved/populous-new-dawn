import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

test('cloud bootstrap preserves work and verifies recovery inputs', () => {
  const result = spawnSync('python3', ['tests/cloud-bootstrap.test.py'], {
    cwd: new URL('..', import.meta.url), encoding: 'utf8', timeout: 120_000,
  });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}\n${result.error ?? ''}`);
});

test('bound source-only bootstrap never installs or copies asset payload', () => {
  const fixtureRoot = mkdtempSync(join(process.env.PND_BOOTSTRAP_FIXTURE_ROOT ?? tmpdir(), 'pnd-bootstrap-'));
  try {
    const result = spawnSync('python3', ['-B', 'tests/shared-workspace-bootstrap.test.py'], {
      cwd: new URL('..', import.meta.url), encoding: 'utf8', timeout: 120_000,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PND_BOOTSTRAP_FIXTURE_ROOT: fixtureRoot },
    });
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}\n${result.error ?? ''}`);
  } finally {
    rmSync(fixtureRoot, { recursive: true });
  }
});

