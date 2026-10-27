import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, rmdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const fixture of ['test_evidence_archive.py', 'test_collect_native_ui_archive.py']) {
  test(`archive-first synthetic qualification: ${fixture}`, context => {
    const temporary = mkdtempSync(path.join(tmpdir(), 'pnd-archive-tests-'))
    const result = spawnSync('python3', ['-I', '-B', path.join(root, 'tests', fixture), '-v'], {
      cwd: root,
      env: { ...process.env, TMPDIR: temporary, PYTHONDONTWRITEBYTECODE: '1' },
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 4 * 1024 * 1024,
    })
    context.diagnostic(result.stdout ?? '')
    context.diagnostic(result.stderr ?? '')
    // Python tests clean their own fixtures, including ordinary assertion failures.
    // Preserve the outer root/logs and interruption leftovers; never recursively clean.
    assert.equal(result.error, undefined, String(result.error))
    assert.equal(result.signal, null)
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.deepEqual(readdirSync(temporary), [], 'Synthetic fixture leaked owned temporary files')
    rmdirSync(temporary)
  })
}
