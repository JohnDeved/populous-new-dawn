import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { compactResearch, retrieveResearch, evaluateResearchClaims, claimContractSha256 } from '../scripts/orchestration/research-evidence.mjs'
import { main } from '../scripts/orchestration/cli.mjs'

const sha = value => createHash('sha256').update(value).digest('hex')
const expected = { sourceFingerprint: sha('source'), query: 'training + indirect dispatch?', adapterVersion: 'local-v1' }
function fixture(t) {
  const repo = mkdtempSync(join(tmpdir(), 'pnd-research-'))
  t.after(() => rmSync(repo, { recursive: true, force: true }))
  const code = 'void training() { /* raw pseudocode */ }\n'
  const instructions = [{ address: '0x52a7fc', mnemonic: 'CALL', target: '[eax+0x38]' }]
  const assembly = JSON.stringify({ function: { instructions } })
  writeFileSync(join(repo, 'export.c'), code)
  writeFileSync(join(repo, 'assembly.json'), assembly)
  const sources = [{ id: 'code', path: 'export.c', sha256: sha(code) }, { id: 'asm', path: 'assembly.json', sha256: sha(assembly) }]
  const packet = { version: 1, identity: expected, sources, unknowns: ['packet-level limit'], dossiers: [{
    id: 'training', question: expected.query, facts: { directCalls: 0, indirectCall: '0x52a7fc' },
    inferences: ['backend dispatch'], unknowns: ['slot +0x38 callback unproved'], sourceLocations: ['export.c:1'],
    raw: { pseudocode: code, assembly: instructions },
    rawSources: { pseudocode: { sourceId: 'code', format: 'text' }, assembly: { sourceId: 'asm', format: 'json', keys: ['function', 'instructions'] } },
  }] }
  const claim = { id: 'owner-observation', authority: 'browser-observation', dimensions: ['trusted-input', 'owner-retention'], requiredClaims: [], sourceIds: ['code'], maxAgeMs: 1000 }
  const result = { claimId: claim.id, authority: claim.authority, dimensions: [...claim.dimensions], status: 'passed', observedAtMs: 2000,
    identity: expected, contractSha256: claimContractSha256(claim), sourceIds: ['code'], sourceSha256s: { code: sources[0].sha256 } }
  const claims = { version: 1, identity: expected, sources, requiredClaims: [claim.id], claims: [claim], results: [result] }
  return { repo, packet, claims, claim, result }
}
const evaluate = f => evaluateResearchClaims(f.repo, f.claims, expected, 2500)

test('compact views preserve all conclusions, source IDs and unknown indirect calls; raw round-trips', t => {
  const f = fixture(t), view = compactResearch(f.repo, f.packet, expected)
  const { raw, ...retained } = f.packet.dossiers[0]
  assert.deepEqual(view.dossiers[0], retained)
  assert.deepEqual(view.sources, f.packet.sources)
  assert.deepEqual(view.unknowns, f.packet.unknowns)
  assert.match(view.rawOmissions, /not exhaustive proof/)
  for (const field of Object.keys(raw)) assert.deepEqual(retrieveResearch(f.repo, view, expected, 'training', field), raw[field])
})
for (const key of ['sourceFingerprint', 'query', 'adapterVersion']) test(`source/query/version mismatch fails: ${key}`, t => {
  const f = fixture(t), wrong = { ...expected, [key]: key === 'sourceFingerprint' ? sha('other') : 'other' }
  assert.throws(() => compactResearch(f.repo, f.packet, wrong), /mismatch/)
  assert.throws(() => evaluateResearchClaims(f.repo, f.claims, wrong, 2500), /mismatch/)
  const view = compactResearch(f.repo, f.packet, expected)
  assert.throws(() => retrieveResearch(f.repo, view, wrong, 'training', 'pseudocode'), /mismatch/)
})
for (const mode of ['tamper', 'missing', 'traversal', 'symlink', 'duplicate-id', 'conflicting-path-hash', 'bad-selector', 'raw-disagrees']) test(`raw sources fail closed: ${mode}`, t => {
  const f = fixture(t)
  if (mode === 'tamper') writeFileSync(join(f.repo, 'export.c'), 'changed')
  if (mode === 'missing') rmSync(join(f.repo, 'export.c'))
  if (mode === 'traversal') f.packet.sources[0].path = '../export.c'
  if (mode === 'symlink') { rmSync(join(f.repo, 'export.c')); symlinkSync('/etc/hostname', join(f.repo, 'export.c')) }
  if (mode === 'duplicate-id') f.packet.sources.push(f.packet.sources[0])
  if (mode === 'conflicting-path-hash') f.packet.sources.push({ ...f.packet.sources[0], id: 'other', sha256: sha('wrong') })
  if (mode === 'bad-selector') f.packet.dossiers[0].rawSources.assembly.keys = ['absent']
  if (mode === 'raw-disagrees') f.packet.dossiers[0].raw.pseudocode = 'unrelated'
  assert.throws(() => compactResearch(f.repo, f.packet, expected))
})
for (const command of ['research-view', 'research-read']) for (const mode of ['malformed-json', 'missing-selector'])
  test(`${command} identifies the raw source and selector needing repair: ${mode}`, t => {
    const f = fixture(t)
    const packet = command === 'research-read' ? compactResearch(f.repo, f.packet, expected) : f.packet
    const raw = mode === 'malformed-json' ? '{private-evidence-content' : '{"function":{}}'
    writeFileSync(join(f.repo, 'assembly.json'), raw)
    packet.sources.find(source => source.id === 'asm').sha256 = sha(raw)
    writeFileSync(join(f.repo, 'packet.json'), JSON.stringify(packet))
    const args = [command, '--packet', 'packet.json', '--source-fingerprint', expected.sourceFingerprint,
      '--query', expected.query, '--adapter-version', expected.adapterVersion]
    if (command === 'research-read') args.push('--dossier', 'training', '--field', 'assembly')
    mkdirSync(join(f.repo, 'scripts/orchestration'), { recursive: true })
    for (const name of ['cli.mjs', 'dependency-profile.mjs', 'research-evidence.mjs', 'review-bundle.mjs', 'receipt-streams.mjs'])
      writeFileSync(join(f.repo, 'scripts/orchestration', name), readFileSync(new URL(`../scripts/orchestration/${name}`, import.meta.url)))
    const result = spawnSync(process.execPath, ['scripts/orchestration/cli.mjs', ...args], { cwd: f.repo, encoding: 'utf8' })
    assert.equal(result.status, 1, result.stderr)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /dossier "training", field "assembly", source "asm", selector \["function","instructions"\]/)
    assert.match(result.stderr, mode === 'malformed-json' ? /Invalid raw JSON.*inspect the backing source JSON/ : /Missing raw selector.*missing key "instructions"/)
    assert.doesNotMatch(result.stderr, /private-evidence-content/)
  })
test('changed unrelated source also blocks on-demand retrieval', t => {
  const f = fixture(t), view = compactResearch(f.repo, f.packet, expected)
  writeFileSync(join(f.repo, 'assembly.json'), '{}')
  assert.throws(() => retrieveResearch(f.repo, view, expected, 'training', 'pseudocode'), /hash mismatch/)
})
test('exact finite claim succeeds without conferring native/pixel credit', t => {
  const f = fixture(t)
  assert.equal(evaluate(f).status, 'passed')
  assert.match(evaluate(f).limits, /No native, pixel, gameplay or parity credit/)
})
for (const dimension of ['original-native-counter-policy', 'matched-original-doorway-pixels']) test(`browser pass cannot promote ${dimension}`, t => {
  const f = fixture(t)
  f.claim.dimensions.push(dimension)
  // Even updating contract identity cannot conjure the missing dimension.
  f.result.contractSha256 = claimContractSha256(f.claim)
  assert.equal(evaluate(f).checks[0].reason, 'result-contract-incompatible')
})
for (const mode of ['missing', 'unknown', 'failed', 'blocked', 'not-run', 'stale', 'future', 'contract', 'authority', 'source', 'source-hash', 'later-failure', 'failure-tie', 'unknown-tie', 'later-incompatible']) test(`claim acceptance rejects ${mode}`, t => {
  const f = fixture(t)
  if (mode === 'missing') f.claims.results = []
  if (['unknown', 'failed', 'blocked', 'not-run'].includes(mode)) f.result.status = mode
  if (mode === 'stale') f.result.observedAtMs = 0
  if (mode === 'future') f.result.observedAtMs = 3000
  if (mode === 'contract') f.result.contractSha256 = sha('changed')
  if (mode === 'authority') f.result.authority = 'native'
  if (mode === 'source') f.result.sourceIds = ['absent']
  if (mode === 'source-hash') f.result.sourceSha256s.code = sha('changed')
  if (mode === 'later-failure') f.claims.results.push({ ...f.result, observedAtMs: 2200, status: 'failed' })
  if (mode === 'failure-tie') f.claims.results.unshift({ ...f.result, status: 'failed' })
  if (mode === 'unknown-tie') f.claims.results.push({ ...f.result, status: 'unknown' })
  if (mode === 'later-incompatible') f.claims.results.push({ ...f.result, observedAtMs: 2200, contractSha256: sha('old') })
  assert.equal(evaluate(f).status, 'failed')
})
for (const key of ['sourceFingerprint', 'query', 'adapterVersion']) test(`result ${key} must match current identity`, t => {
  const f = fixture(t)
  f.result.identity = { ...expected, [key]: key === 'sourceFingerprint' ? sha('stale') : 'stale' }
  assert.equal(evaluate(f).checks[0].reason, 'result-identity-mismatch')
})
test('required callback must have its own proof, including transitive dependencies', t => {
  const f = fixture(t)
  f.claim.requiredClaims.push('callback')
  f.result.contractSha256 = claimContractSha256(f.claim)
  assert.equal(evaluate(f).checks[1].reason, 'required-claim-missing')
  f.claims.claims.push({ ...f.claim, id: 'callback', requiredClaims: ['callback-leaf'] })
  assert.equal(evaluate(f).checks[1].reason, 'result-missing')
  assert.equal(evaluate(f).checks[2].reason, 'required-claim-missing')
})
test('changed source cannot reuse passing result by updating the source manifest', t => {
  const f = fixture(t)
  writeFileSync(join(f.repo, 'export.c'), 'changed')
  f.claims.sources[0].sha256 = sha('changed')
  assert.equal(evaluate(f).checks[0].reason, 'result-source-mismatch')
})
test('CLI projects and retrieves packets with caller-bound identity', t => {
  const f = fixture(t), args = ['--packet', 'packet.json', '--source-fingerprint', expected.sourceFingerprint, '--query', expected.query, '--adapter-version', expected.adapterVersion]
  writeFileSync(join(f.repo, 'packet.json'), JSON.stringify(f.packet))
  const view = main(['research-view', ...args], f.repo)
  writeFileSync(join(f.repo, 'packet.json'), JSON.stringify(view))
  assert.equal(main(['research-read', ...args, '--dossier', 'training', '--field', 'pseudocode'], f.repo), f.packet.dossiers[0].raw.pseudocode)
  writeFileSync(join(f.repo, 'packet.json'), JSON.stringify(f.claims))
  // CLI uses real current time: old fixtures are stale, never silently accepted.
  assert.equal(main(['research-claims', ...args], f.repo).status, 'failed')
})


test('only raw pseudocode/assembly can be omitted, without overwriting packet omissions', t => {
  const f = fixture(t)
  f.packet.omissions = ['existing limitation']
  assert.deepEqual(compactResearch(f.repo, f.packet, expected).omissions, f.packet.omissions)
  f.packet.dossiers[0].raw.conclusion = 'not raw code'
  f.packet.dossiers[0].rawSources.conclusion = f.packet.dossiers[0].rawSources.pseudocode
  assert.throws(() => compactResearch(f.repo, f.packet, expected), /Only pseudocode/)
})
test('equal-time failures reject in either order and later pass can supersede a failure', t => {
  const f = fixture(t)
  const failed = { ...f.result, status: 'failed' }
  for (const results of [[f.result, failed], [failed, f.result]]) {
    f.claims.results = results
    assert.equal(evaluate(f).status, 'failed')
  }
  f.claims.results = [failed, { ...f.result, observedAtMs: 2300 }]
  assert.equal(evaluate(f).status, 'passed')
})
test('freshness boundary is inclusive and empty or duplicate contracts fail closed', t => {
  const f = fixture(t)
  f.result.observedAtMs = 1500
  assert.equal(evaluate(f).status, 'passed')
  f.claims.claims.push(f.claim)
  assert.throws(() => evaluate(f), /Duplicate claim/)
  f.claims.claims.pop()
  f.claim.dimensions = []
  assert.throws(() => evaluate(f), /Invalid research claim/)
})
test('actual CLI exit status distinguishes accepted, failed and malformed claims', t => {
  const f = fixture(t)
  mkdirSync(join(f.repo, 'scripts/orchestration'), { recursive: true })
  for (const name of ['cli.mjs', 'dependency-profile.mjs', 'research-evidence.mjs', 'review-bundle.mjs', 'receipt-streams.mjs']) {
    writeFileSync(join(f.repo, 'scripts/orchestration', name), readFileSync(new URL(`../scripts/orchestration/${name}`, import.meta.url)))
  }
  f.claim.maxAgeMs = 60_000
  f.result.contractSha256 = claimContractSha256(f.claim)
  f.result.observedAtMs = Date.now()
  const args = ['scripts/orchestration/cli.mjs', 'research-claims', '--packet', 'claims.json', '--source-fingerprint', expected.sourceFingerprint,
    '--query', expected.query, '--adapter-version', expected.adapterVersion]
  for (const [status, code] of [['passed', 0], ['unknown', 1], ['invalid', 1]]) {
    f.result.status = status
    writeFileSync(join(f.repo, 'claims.json'), JSON.stringify(f.claims))
    const result = spawnSync(process.execPath, args, { cwd: f.repo, encoding: 'utf8' })
    assert.equal(result.status, code, result.stderr)
    if (status !== 'invalid') assert.equal(JSON.parse(result.stdout).status, code ? 'failed' : 'passed')
  }
})
