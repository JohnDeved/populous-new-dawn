// Pure bounded data validation: safe in the trusted no-install reporter.
import assert from 'node:assert/strict'
import { sha256 } from './protocol.mjs'
import { dragSourceProfiles } from './snapshot-drag-contract.mjs'
import { recognizeReaderSources, readerContract, inactiveHelperReaderSha256 } from './snapshot-readers.mjs'
export const readerImportSha256 = sha256("import * as THREE from 'three'")
export const readerProofContract = Object.freeze({ version: 2, readers: readerContract,
  comparison: 'exact-original-fingerprint-first; otherwise admitted-source-and-reader-equivalence-only',
  inputs: 'unchanged-metadata-position-index-instances', withinArm: 'same-reader-and-runtime-bundle-every-session',
  stableFallback: 'five-stable-cohorts-only; exact-reader-tokens-except-inactive-normalization-helper; strict-data-import-and-provenance-required',
  limitation: 'No retrospective equivalence for artifacts without complete raw reader and provenance evidence' })
const keys = (object, names) => { assert.ok(object && typeof object === 'object' && !Array.isArray(object)); assert.deepEqual(Object.keys(object).sort(), [...names].sort()) }
const digest = value => assert.ok(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value))
const finite = value => assert.ok(typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e9)
export function validateReaderEvidence(value) {
  keys(value, ['version', 'sources', 'rawSha256', 'allSourcesSha256', 'semanticSha256', 'strictData', 'matrixBinding', 'sessionStable', 'source', 'provenance'])
  assert.equal(value.version, 1)
  for (const name of ['strictData', 'matrixBinding', 'sessionStable']) assert.equal(value[name], true)
  const recognized = recognizeReaderSources(value.sources)
  for (const name of ['rawSha256', 'allSourcesSha256', 'semanticSha256']) assert.equal(value[name], recognized[name])
  keys(value.source, ['profile', 'slices', 'importSha256'])
  if (value.source.importSha256 !== null) digest(value.source.importSha256)
  if (value.source.profile === null) assert.deepEqual(value.source.slices, [])
  else {
    const profile = dragSourceProfiles.find(profile => profile.id === value.source.profile)
    assert.ok(profile, 'Unknown reader source profile')
    assert.ok(Array.isArray(value.source.slices)); assert.equal(value.source.slices.length, profile.slices.length)
    for (const [i, slice] of value.source.slices.entries()) {
      const expected = profile.slices[i]
      keys(slice, ['id', 'expectedSha256', 'actualSha256', 'reason'])
      assert.equal(slice.id, expected.id); assert.equal(slice.expectedSha256, expected.sha256 ?? null); assert.equal(slice.reason, null)
      if (expected.absentFile) assert.equal(slice.actualSha256, null)
      else { digest(slice.actualSha256); if (expected.sha256) assert.equal(slice.actualSha256, expected.sha256) }
    }
  }
  keys(value.provenance, ['dependenciesSha256', 'threeSha256', 'packageSha256', 'lockSha256', 'builderSha256', 'bundleSha256'])
  Object.values(value.provenance).forEach(digest)
  return recognized
}
export function geometryProof(boundary) {
  return Object.fromEntries(['metadata', 'positionSha256', 'indexSha256', 'instancesSha256', 'consumerMethodsSha256'].map(key => [key, boundary[key]]))
}
export function validateGeometryProof(proof, originalSha256, readerSha256) {
  keys(proof, ['metadata', 'positionSha256', 'indexSha256', 'instancesSha256', 'consumerMethodsSha256'])
  for (const key of ['positionSha256', 'indexSha256', 'instancesSha256', 'consumerMethodsSha256']) digest(proof[key])
  assert.equal(proof.consumerMethodsSha256, readerSha256)
  const m = proof.metadata
  keys(m, ['version', 'position', 'index', 'drawRange', 'instanceCount', 'worldMatrix', 'boundingBox', 'nativeRelative', 'painterGround', 'terrainGrid', 'nativeScale', 'nativeSize', 'parentBasis'])
  assert.equal(m.version, 1)
  assert.deepEqual(m.position, { type: 'Float32Array', count: 98304, itemSize: 3, normalized: false })
  keys(m.index, ['type', 'submittedCount', 'itemSize', 'normalized'])
  assert.equal(m.index.type, 'Uint32Array'); assert.equal(m.index.itemSize, 1); assert.equal(m.index.normalized, false)
  assert.ok(Number.isSafeInteger(m.index.submittedCount) && m.index.submittedCount > 0 && m.index.submittedCount <= 98304 && m.index.submittedCount % 3 === 0)
  assert.deepEqual(m.drawRange, { start: 0, count: m.index.submittedCount })
  assert.ok(Number.isSafeInteger(m.instanceCount) && m.instanceCount >= 1 && m.instanceCount <= 9)
  for (const [key, length] of [['worldMatrix', 16], ['boundingBox', 6], ['parentBasis', 3]]) {
    assert.ok(Array.isArray(m[key]) && m[key].length === length); m[key].forEach(finite)
  }
  for (const key of ['nativeRelative', 'painterGround', 'terrainGrid']) assert.equal(m[key], true)
  assert.equal(m.nativeScale, 0); assert.equal(m.nativeSize, 0)
  assert.equal(sha256(JSON.stringify(proof)), originalSha256, 'Original geometry fingerprint/component mismatch')
  return sha256(JSON.stringify({ metadata: m, positionSha256: proof.positionSha256, indexSha256: proof.indexSha256, instancesSha256: proof.instancesSha256 }))
}
export function equivalentReaderEvidence(contexts) {
  if (!Array.isArray(contexts) || contexts.length !== 6 || contexts.some(context => !context?.evidence)) return false
  try {
    const raw = new Set(), common = [], bySide = { base: [], head: [] }
    for (const { side, evidence } of contexts) {
      validateReaderEvidence(evidence)
      raw.add(evidence.rawSha256)
      if (!Object.hasOwn(bySide, side) || !evidence.source.profile || evidence.source.importSha256 !== readerImportSha256) return false
      const { bundleSha256, ...shared } = evidence.provenance
      common.push(JSON.stringify([shared, evidence.semanticSha256]))
      bySide[side].push(JSON.stringify([evidence.allSourcesSha256, bundleSha256, evidence.source]))
    }
    return raw.size === 2 && new Set(common).size === 1 && Object.values(bySide).every(values => values.length === 3 && new Set(values).size === 1)
  } catch { return false }
}

// Independent of held-drag source admission only for this strictly narrower
// substitution proof. The import digest attests the AST-owned reviewed query
// input prefix, not merely an import string (see readerImportAdmission).
export function equivalentInactiveHelperEvidence(contexts) {
  if (!Array.isArray(contexts) || contexts.length !== 6 || contexts.some(context => !context?.evidence)) return false
  try {
    const raw = new Set(), common = [], bySide = { base: [], head: [] }
    for (const { side, evidence } of contexts) {
      validateReaderEvidence(evidence)
      raw.add(evidence.rawSha256)
      if (!Object.hasOwn(bySide, side) || evidence.source.importSha256 !== readerImportSha256) return false
      const { bundleSha256, ...shared } = evidence.provenance
      common.push(JSON.stringify([shared, inactiveHelperReaderSha256(evidence.sources)]))
      bySide[side].push(JSON.stringify([evidence.allSourcesSha256, bundleSha256, evidence.source]))
    }
    return raw.size === 2 && new Set(common).size === 1 && Object.values(bySide).every(values => values.length === 3 && new Set(values).size === 1)
  } catch { return false }
}
