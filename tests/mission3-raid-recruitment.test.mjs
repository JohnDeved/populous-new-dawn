import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const fixturePath = resolve(root, 'tests/fixtures/mission3-raid-recruitment-origins.json')
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'))
const evidence = resolve(root, 'references/verification/mission3-raid-recruitment-origin-2026-10-06')
const witnesses = ['attempt1', 'established-attempt1'].flatMap(name =>
  JSON.parse(readFileSync(join(evidence, name, 'stdout.log'), 'utf8')).cases.map(c => c.native))
assert.deepEqual(witnesses.map(c => c.id), fixture.cases.map(c => c.id))

function runAdapter(path, count) {
  const run = spawnSync(process.execPath, ['--max-old-space-size=256', '--experimental-test-module-mocks',
    resolve(root, 'scripts/mission3-raid-recruitment-pair.mjs'), path], {
    cwd: root, encoding: 'utf8', timeout: 20_000, maxBuffer: 1024 * 1024,
    env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' },
    input: Array.from({ length: count }, (_, caseIndex) => JSON.stringify({ caseIndex })).join('\n') + '\n',
  })
  assert.equal(run.error, undefined)
  assert.equal(run.status, 0, run.stderr)
  const records = run.stdout.trim().split('\n').map(line => JSON.parse(line))
  assert.equal(records.length, count)
  return records
}

// Portable-only regression against retained, independently reviewed native records.
// Native replay uses the incremental parent protocol; this test executes no native code.
const observed = runAdapter(fixturePath, 3)
const temporary = mkdtempSync(join(tmpdir(), 'pnd-raid-origin-'))
let zero
try {
  const zeroFixture = structuredClone(fixture)
  zeroFixture.cases = [{ ...fixture.cases[2], constructionBaseCell: 0 }]
  const path = join(temporary, 'zero-base.json')
  writeFileSync(path, JSON.stringify(zeroFixture))
  ;[zero] = runAdapter(path, 1)
} finally {
  rmSync(temporary, { recursive: true, force: true })
}

// Optional bounded raw records for source-bound failure-first/after receipts.
if (process.env.PND_RAID_RECRUITMENT_OUTPUT) {
  const output = resolve(root, process.env.PND_RAID_RECRUITMENT_OUTPUT)
  assert.ok(relative(root, output).startsWith('work/orchestration/'))
  writeFileSync(output, JSON.stringify({ nativeWitnesses: witnesses, observed, portableOnlyZeroBase: zero }, null, 2) + '\n', { flag: 'wx' })
}

for (let index = 0; index < witnesses.length; index++) {
  test(`Mission3 recruitment preserves original ${witnesses[index].id}`, () => {
    assert.equal(observed[index].id, witnesses[index].id)
    assert.deepEqual(observed[index].comparison, witnesses[index].comparison)
    assert.equal(observed[index].adapter.records.tasksBefore.length, 10)
    assert.equal(observed[index].adapter.records.unitsBefore.length, 7)
  })
}

test('Mission3 recruitment retains a valid established base at cell zero', () => {
  assert.equal(zero.adapter.suppliedConstructionBase, 0)
  assert.equal(zero.comparison.selector.origin, 0)
  assert.equal(zero.comparison.count, 3)
  assert.equal(zero.comparison.task.selected, 0)
  assert.ok(zero.adapter.allowedWorldChangesAsserted)
})
