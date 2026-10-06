import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const path = resolve(root, 'tests/fixtures/mission3-raid-recruitment-loaded-cell.json')
const fixture = JSON.parse(readFileSync(path, 'utf8'))
const retained = JSON.parse(readFileSync(resolve(root,
  'references/verification/mission3-raid-recruitment-origin-2026-10-06/attempt1/stdout.log'), 'utf8'))
  .cases.find(c => c.native.id === 'no-base-authored-coordinates').native.comparison
const temporary = mkdtempSync(join(tmpdir(), 'pnd-loaded-shaman-cell-'))
const rows = []
try {
  for (const checkpointRoundTrip of [false, true]) {
    const fixturePath = join(temporary, checkpointRoundTrip ? 'checkpoint.json' : 'direct.json')
    writeFileSync(fixturePath, JSON.stringify({ ...fixture, checkpointRoundTrip }))
    const result = spawnSync(process.execPath, ['--max-old-space-size=256', '--experimental-test-module-mocks',
      resolve(root, 'scripts/mission3-raid-recruitment-pair.mjs'), fixturePath], {
      cwd: root, encoding: 'utf8', timeout: 20_000, maxBuffer: 1024 * 1024,
      env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' },
      input: '{"caseIndex":0}\n{"caseIndex":1}\n',
    })
    assert.equal(result.error, undefined)
    assert.equal(result.status, 0, result.stderr)
    const records = result.stdout.trim().split('\n').map(line => JSON.parse(line))
    assert.equal(records.length, 2)
    for (const [index, observed] of records.entries()) rows.push({ checkpointRoundTrip, index, observed })
  }
} finally {
  rmSync(temporary, { recursive: true, force: true })
}

for (const { checkpointRoundTrip, index, observed } of rows) {
  test(`Mission3 retains loaded Shaman origin for ${fixture.cases[index].id}${checkpointRoundTrip ? ' after checkpoint' : ''}`, () => {
    const expected = structuredClone(retained)
    if (fixture.cases[index].liveShamanId === 0) expected.flags3 = expected.flags3.filter(p => p.id !== 307)
    assert.deepEqual(observed.comparison, expected)
    assert.equal(observed.adapter.checkpointRoundTrip, checkpointRoundTrip)
    assert.equal(observed.adapter.records.tasksBefore.length, 10)
    assert.equal(observed.adapter.records.unitsBefore.length, index === 0 ? 7 : 6)
  })
}
