// Explicit finite inventory and authenticated raw-host bindings; never infer policy.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import sourceInputs from './composed-source-inputs.json' with { type: 'json' }
import { COMPOSED_PROFILE_POLICY } from './policy.mjs'
import { validateTornadoEvidence } from './composed-tornado-evidence.mjs'
import { validateSpyEvidence } from './composed-spy-evidence.mjs'
export const COMPOSED_SOURCE_INPUTS = Object.freeze(sourceInputs)
export const TORNADO_FILES = Object.freeze(['tornado-appearance.json',
  ...['land', 'water'].flatMap(kind => ['spawn', 'active', ...(kind === 'land' ? ['first-tail', 'last-tail'] : []), 'restart']
    .map(stage => `tornado-${kind}-${stage}-normal.png`)),
  ...['land', 'water'].flatMap(kind => ['black', 'white'].map(color => `tornado-${kind}-diagnostic-${color}.png`))])
export const SPY_FILES = Object.freeze(['spy-source.json', 'spy-source-context.png',
  ...Array.from({ length: 12 }, (_, i) => `spy-source-frame-${i}.png`)])
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const json = bytes => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
export function composedContract(expected) {
  if (expected === undefined) return false
  assert.ok(expected && typeof expected.then !== 'function')
  assert.equal(expected.profileArtifactPolicy, COMPOSED_PROFILE_POLICY)
  assert.equal(expected.browserPolicy, 'profile-split-v1'); assert.equal(expected.checkpointVersion, 3)
  return true
}
export function composedInventory(expected, kind) {
  if (!composedContract(expected)) return []
  assert.ok(['profile', 'mission10'].includes(kind))
  return kind === 'profile' ? TORNADO_FILES : SPY_FILES
}
function boundSources(host, expected) {
  assert.equal(composedContract(expected), true)
  assert.equal(host.source.commit, expected.identity.mergeSha)
  assert.deepEqual(Object.keys(expected.sourceBytes).sort(), [...COMPOSED_SOURCE_INPUTS].sort())
  let total = 0
  for (const path of COMPOSED_SOURCE_INPUTS) {
    const bytes = expected.sourceBytes[path]
    assert.ok(Buffer.isBuffer(bytes) && bytes.length <= 32 * 1024 * 1024, 'Invalid immutable composed source bytes')
    total += bytes.length; assert.ok(total <= 128 * 1024 * 1024, 'Composed source byte bound')
    assert.equal(host.source.files[path], hash(bytes), `Composed immutable source differs: ${path}`)
  }
}
export function validateComposedArtifact(files, host, expected, kind) {
  boundSources(host, expected)
  assert.equal(host.status, 'passed')
  if (kind === 'profile') {
    assert.equal(host.spySource, undefined)
    for (const path of TORNADO_FILES) assert.ok(files.has(path), `Missing Tornado artifact: ${path}`)
    const report = json(files.get('tornado-appearance.json'))
    assert.equal(validateTornadoEvidence(report, { hostReport: host.tornadoAppearance, mergeSha: expected.identity.mergeSha,
      browserVersion: host.browserVersion, files, sourceBytes: expected.sourceBytes }), true, 'Unresolved Tornado evidence')
  } else {
    assert.equal(kind, 'mission10'); assert.equal(host.tornadoAppearance, undefined)
    const frames = [...files.keys()].filter(name => name.startsWith('spy-source-frame-'))
    assert.equal(frames.length, 2); assert.ok(frames.includes('spy-source-frame-0.png'))
    for (const name of frames) assert.ok(SPY_FILES.includes(name))
    assert.ok(files.has('spy-source.json') && files.has('spy-source-context.png'))
    const phaseReceipts = ['created', 'reused'].map(mode => json(files.get(`mission10-${mode}--receipt.json`)))
    assert.equal(validateSpyEvidence(json(files.get('spy-source.json')), { hostReport: host.spySource,
      sourceBytes: expected.sourceBytes, mergeSha: expected.identity.mergeSha, browserVersion: host.browserVersion,
      files, phaseReceipts, mission10Report: host.mission10Profile }), true, 'Unresolved Spy evidence')
  }
  return true
}
