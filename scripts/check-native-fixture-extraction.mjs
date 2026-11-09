// Developer-only migration audit. Normal tests never need Git history or raw logs.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'

const root = fileURLToPath(new URL('../', import.meta.url))
const commit = 'bc9cabf404240ad99b2aab8c26e9b0137cdd7702'
const args = process.argv.slice(2)
assert.ok(args.length === 0 || (args.length === 2 && args[0] === '--archive-root'),
  'usage: node scripts/check-native-fixture-extraction.mjs [--archive-root PATH]')
const archived = path => args.length
  ? readFileSync(resolve(args[1], path))
  : execFileSync('git', ['show', `${commit}:${path}`], { cwd: root, maxBuffer: 4 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fixture = name => JSON.parse(readFileSync(resolve(root, `tests/fixtures/${name}.json`)))
const policyBytes = readFileSync(resolve(root, 'decomp/research/firewarrior-firing-phase/owned-projection.json'))
const policy = JSON.parse(policyBytes)
const projections = {
  'mission3-raid-allocation-native': data => data.cases.map(c => c.native),
  'mission3-raid-recruitment-native': data => data.cases.map(c => ({ id: c.native.id, comparison: c.native.comparison })),
  'firewarrior-firing-phase-native': data => data.cases.map(c => ({
    name: c.name,
    initialFields: c.visits[0].before.fields,
    visits: c.visits.map(visit => ({
      complete: visit.complete,
      ...(!visit.complete ? {
        activeFields: Object.fromEntries(policy.activeAfterFields.map(field => [field, visit.after.fields[field]])),
        activeBits: Object.fromEntries(policy.activeAfterBits.map(bit =>
          [bit.field, visit.after.fields[bit.field] & Number(bit.maskHex)])),
      } : {}),
    })),
  })),
}
for (const [name, project] of Object.entries(projections)) {
  const reference = fixture(name)
  assert.equal(reference.schemaVersion, 1)
  assert.equal(reference.kind, name)
  assert.equal(reference.provenance.commit, commit)
  const expected = reference.provenance.sources.flatMap(source => {
    const bytes = archived(source.path)
    const decoded = source.path.endsWith('.gz') ? gunzipSync(bytes) : bytes
    assert.equal(bytes.length, source.bytes)
    assert.equal(decoded.length, source.decodedBytes)
    assert.equal(sha(bytes), source.sha256)
    assert.equal(sha(decoded), source.decodedSha256)
    return project(JSON.parse(decoded))
  })
  assert.deepEqual(reference.cases, expected, `${name}: exact independently recorded projection`)
}
const firing = fixture('firewarrior-firing-phase-native')
assert.equal(sha(policyBytes), firing.provenance.policySha256)
const input = readFileSync(resolve(root, firing.provenance.inputPath))
assert.equal(sha(input), policy.fixtureSha256)
assert.equal(sha(input), firing.provenance.inputSha256)
assert.deepEqual(input, gunzipSync(archived('evidence/firewarrior-firing-phase/native-comparison-20261006/fixtures.json.gz')))
console.log('Native fixture extraction verified: 5 allocation cases, 3 recruitment cases, 16 firing cases / 60 visits; authored firing input bytes unchanged.')
