import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')

test('CMS interop unit gates use no keys or native crypto', () => {
  const result = spawnSync('python', ['-I', '-B', 'tests/cms-interop.test.py'], {
    cwd: root, encoding: 'utf8', timeout: 15000, maxBuffer: 65536,
  })
  assert.equal(result.error, undefined)
  assert.equal(result.signal, null)
  assert.equal(result.status, 0, result.stderr)
})

test('CMS artifact is separate, exact and success-only without changing full-check aggregation', () => {
  const workflow = read('.github/workflows/ready-pr-check.yml')
  const quality = workflow.split('\n  quality:\n')[1].split('\n  test-shards:\n')[0]
  const producer = quality.indexOf('name: Qualify generated-only CMS encryption')
  const gate = quality.indexOf('name: Reject tracked input mutation')
  const upload = quality.indexOf('name: Upload generated-only CMS interoperability fixture')
  assert.ok(producer >= 0 && producer < gate && gate < upload)
  const section = quality.slice(upload)
  assert.match(section, /name: cms-interop-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}-quality/)
  assert.equal(section.match(/\$\{\{ runner\.temp \}\}/g)?.length, 2)
  assert.match(section, /-quality\/envelope\.cms\n/)
  assert.match(section, /-quality\/summary\.json\n/)
  assert.doesNotMatch(section, /continue-on-error|if:|\*|private|generated\.bin|stderr|stdout/)
  assert.match(quality, /name: full-check-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}-quality\n {10}path: work\/ci\/receipt\.json\n/)
  assert.match(workflow, /pattern: full-check-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}-\*/)
  assert.match(quality, /35s python -I -B scripts\/cms-interop\/run\.py/)
  const entry = read('scripts/cms-interop/run.py')
  assert.doesNotMatch(entry, /'-decrypt'|'-inkey'|'-provider'|'-genkey'|'-genpkey'|'-enc'/)
  assert.match(entry, /for signum in \(signal\.SIGTERM, signal\.SIGINT\)/)
  assert.match(entry, /signal\.signal\(signum, interrupted\)/)
  assert.doesNotMatch(read('scripts/cms-interop/bounded.py'), /OPENSSL_CONF/)
  assert.match(read('scripts/cms-interop/bounded.py'), /env=\{'PATH': '\/usr\/bin:\/bin', 'LANG': 'C'\}/)
})
