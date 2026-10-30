// Trusted read-only resolver. Resolve only the current job's exact numeric
// artifact, then bind every retained byte before exposing any selection input.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { readArtifactZip } from '../artifact-zip.mjs'
import { composedContract, composedInventory, validateComposedArtifact } from './composed-profile-artifact.mjs'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export const profileArchiveLimit = 16 * 1024 * 1024
const required = {
  created: ['receipt.json', 'boat-checkpoint.json', 'boarded.png', 'boarded-class-selected.png', 'before-public-save.png', 'saved-occupied-boat.png'],
  reused: ['receipt.json', 'boat-checkpoint.json', 'restored-occupied-boat.png', 'loaded-class-selected.png', 'unloaded-alive.png', 'unloaded-class-selected.png'],
}
function artifactUpload(log, mergeSha, prefix) {
  assert.match(mergeSha, /^[a-f0-9]{40}$/)
  const lines = log.split('\n').map(line => line.replace(/^\d{4}-\d\d-\d\dT\S+\s+/, ''))
  const one = pattern => { const rows = lines.map(line => line.match(pattern)).filter(Boolean); assert.equal(rows.length, 1, 'Missing/duplicate artifact upload binding'); return rows[0] }
  const name = `${prefix}-${mergeSha}`
  const uploaded = one(new RegExp(`^Artifact ${name} has been successfully uploaded! Final size is ([1-9][0-9]*) bytes\\. Artifact ID is ([1-9][0-9]*)$`))
  const finalized = one(new RegExp(`^Artifact ${name}\\.zip successfully finalized\\. Artifact ID ([1-9][0-9]*)$`))
  const digest = one(/^SHA256 digest of uploaded artifact zip is ([a-f0-9]{64})$/)[1]
  assert.equal(uploaded[2], finalized[1])
  const bytes = Number(uploaded[1]), id = Number(uploaded[2])
  assert.ok(Number.isSafeInteger(id) && Number.isSafeInteger(bytes) && bytes <= profileArchiveLimit)
  return { id, name, bytes, sha256: digest }
}
export const profileArtifactUpload = (log, mergeSha) => artifactUpload(log, mergeSha, 'profile-recovery-browser')
export const mission10ArtifactUpload = (log, mergeSha) => artifactUpload(log, mergeSha, 'mission10-crew-persistence-browser')
export function validateProfileArtifactMetadata(metadata, upload, identity) {
  const prefix = `https://api.github.com/repos/${identity.repository}/actions/artifacts/${upload.id}`
  assert.equal(metadata.id, upload.id); assert.equal(metadata.name, upload.name)
  assert.equal(metadata.expired, false); assert.equal(metadata.size_in_bytes, upload.bytes)
  assert.equal(metadata.digest, `sha256:${upload.sha256}`)
  assert.equal(metadata.url, prefix); assert.equal(metadata.archive_download_url, `${prefix}/zip`)
  assert.equal(String(metadata.workflow_run?.id), identity.runId)
  assert.equal(metadata.workflow_run?.head_sha, identity.headSha)
}
function boundArchive(archive, upload, allowed) {
  assert.equal(archive.length, upload.bytes); assert.equal(hash(archive), upload.sha256)
  const files = readArtifactZip(archive, { maxArchiveBytes: profileArchiveLimit, maxFileBytes: 32 * 1024 * 1024,
    maxTotalBytes: 128 * 1024 * 1024, maxEntries: 128,
    allowName: name => allowed.has(name) })
  const read = (path, digest, size) => {
    const bytes = files.get(path); assert.ok(bytes, `Missing retained artifact: ${path}`)
    assert.equal(hash(bytes), digest); if (size !== undefined) assert.equal(bytes.length, size)
    return bytes
  }
  const json = bytes => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  return { files, read, json }
}
function boundHost(read, json, receipt) {
  const host = json(read('receipt.json', receipt.receiptSha256))
  assert.equal(host.source.commit, receipt.identity.mergeSha); assert.equal(host.status, 'passed')
  for (const [raw, compact] of [['head','headSha'], ['base','baseSha'], ['merge','mergeSha'], ['runId','runId'], ['runAttempt','runAttempt']])
    assert.equal(host.github?.[raw], receipt.identity[compact], `Raw host GitHub ${raw} differs`)
  for (const [path, digest] of Object.entries(receipt.inputs)) assert.equal(host.source.files[path], digest)
  for (const key of ['selectedScenario', 'build', 'sourceAfter', 'cleanupVerified', 'errors', 'dependencyChanges',
    'dependenciesBeforeSha256', 'dependenciesAfterSha256', 'browserCapMs', 'browserPath', 'launch'])
    assert.deepEqual(host[key], receipt[key], `Raw host ${key} differs`)
  assert.equal(host.browserTimedOut ?? false, receipt.browserTimedOut)
  return host
}
function boundRecovery(files, read, json, host, receipt) {
  assert.equal(host.profileRecovery.status, receipt.scenarioStatus)
  assert.deepEqual(host.profileRecovery.cases.map(({ kind, status, fixture }) => ({ kind, status, fixture })), receipt.cases)
  assert.equal(!!host.profileRecovery.runtime && !!host.profileRecovery.runtimeAfter &&
    isDeepStrictEqual(host.profileRecovery.runtime, host.profileRecovery.runtimeAfter), receipt.runtimeUnchanged)
  assert.ok(files.has('profile-recovery.json'), 'Missing profile recovery raw report')
  assert.deepEqual(json(files.get('profile-recovery.json')), host.profileRecovery)
  assert.deepEqual(receipt.screenshots.map(({ sha256, ...shot }) => { assert.match(sha256, /^[a-f0-9]{64}$/); return shot }), host.profileRecovery.screenshots)
  for (const shot of receipt.screenshots) read(shot.name, shot.sha256)
  return host.profileRecovery
}
export function resolveProfileCasesArtifact(archive, upload, receipt, expected) {
  const allowed = new Set(['receipt.json', 'build.log', 'profile-recovery.json',
    'malformed-profile-selector.png', 'ordinary-fresh-load.png', ...composedInventory(expected, 'profile')])
  const { files, read, json } = boundArchive(archive, upload, allowed)
  const host = boundHost(read, json, receipt)
  assert.equal(receipt.kind, 'profile-recovery-cases-browser')
  assert.equal(host.selectedScenario, 'profile-recovery')
  assert.equal(receipt.mission10, undefined, 'Recovery artifact cannot claim M10')
  assert.equal(host.mission10Profile, undefined, 'Recovery artifact cannot claim M10')
  const recovery = boundRecovery(files, read, json, host, receipt)
  if (!composedContract(expected)) return recovery
  assert.equal(validateComposedArtifact(files, host, expected, 'profile'), true, 'Unresolved composed Profile resolver')
  return { recovery, composedVerified: true }
}
function resolveArtifact(archive, upload, receipt, standalone, expected) {
  if (composedContract(expected)) assert.equal(standalone, true)
  const allowed = new Set(['receipt.json', 'build.log', 'mission10-profile.json', 'mission10-artifacts.json',
    ...(standalone ? [] : ['profile-recovery.json', 'malformed-profile-selector.png', 'ordinary-fresh-load.png']),
    ...composedInventory(expected, 'mission10'),
    ...Object.entries(required).flatMap(([mode, names]) => names.map(name => `mission10-${mode}--${name}`))])
  const { files, read, json } = boundArchive(archive, upload, allowed)
  const host = boundHost(read, json, receipt), value = receipt.mission10
  if (standalone) {
    assert.equal(receipt.kind, 'mission10-crew-persistence-browser')
    assert.equal(host.selectedScenario, 'mission10-profile')
    assert.equal(host.profileRecovery, undefined, 'Separate M10 artifact cannot claim recovery cases')
    assert.equal(receipt.screenshots, undefined, 'M10 screenshot ownership is phase-specific')
  } else boundRecovery(files, read, json, host, receipt)
  const report = json(read('mission10-profile.json', value.reportSha256))
  assert.deepEqual(host.mission10Profile, report)
  assert.equal(report.phases.length, 2)
  for (const key of ['status', 'sourceCommit', 'sourceFingerprint', 'runtimeSha256']) assert.equal(report[key], value[key])
  const manifest = json(read(value.artifacts.path, value.artifacts.sha256, value.artifacts.bytes))
  assert.equal(manifest.version, 1); assert.equal(manifest.status, 'passed'); assert.equal(manifest.complete, true)
  assert.equal(manifest.sourceCommit, value.sourceCommit); assert.equal(manifest.sourceFingerprint, value.sourceFingerprint)
  assert.deepEqual(manifest.errors, []); assert.deepEqual(manifest.missingExpected, [])
  assert.equal(manifest.files.length, 12, 'Unexpected retained M10 inventory')
  const seen = new Set()
  for (const { source, retained } of manifest.files) {
    assert.match(source.path, /^mission10-(?:created|reused)\/[a-z0-9][a-z0-9-]*\.(?:json|log|png)$/)
    assert.equal(retained.path, source.path.replace('/', '--'))
    assert.ok(!seen.has(retained.path), 'Duplicate manifest path'); seen.add(retained.path)
    assert.ok(Number.isSafeInteger(source.bytes) && source.bytes >= 0)
    assert.equal(source.bytes, retained.bytes); assert.equal(source.sha256, retained.sha256)
    read(retained.path, retained.sha256, retained.bytes)
  }
  assert.deepEqual([...files.keys()].filter(name => /^mission10-(?:created|reused)--/.test(name)).sort(), [...seen].sort())
  for (const [mode, names] of Object.entries(required)) for (const name of names)
    assert.ok(seen.has(`mission10-${mode}--${name}`), 'Incomplete retained M10 inventory')
  const rawPhases = value.phases.map((phase, index) => {
    const raw = json(read(phase.receiptName, phase.receiptSha256))
    const result = json(read(phase.resultName, phase.resultSha256))
    assert.equal(result.source?.commit, value.sourceCommit); assert.equal(result.source?.fingerprint, value.sourceFingerprint)
    const checkpoint = value => value === null ? null : ['version', 'level', 'turn', 'time', 'checkpointSha256', 'actorsSha256', 'terrainSha256', 'stockSha256'].map(key => value[key])
    assert.deepEqual(checkpoint(index === 0 ? result.saved.checkpoint : result.saved), index === 0 ? phase.saved : value.phases[0].saved)
    assert.deepEqual(checkpoint(result.loaded ?? null), phase.loaded)
    assert.deepEqual(result.actions.filter(action => action.phase === 'after' &&
      ['ordinary rally click', 'ordinary Boat boarding click', 'public Save single click', 'public Load Game',
        'ordinary Boat right-click inspection', 'public Unload all passengers'].includes(action.label)).map(action => action.label), phase.publicActions)
    assert.deepEqual(raw.result, result); assert.equal(raw.status, 'passed'); assert.deepEqual(raw.errors, [])
    assert.equal(raw.source.commit, value.sourceCommit); assert.equal(raw.source.fingerprint, value.sourceFingerprint)
    assert.equal(raw.runtimeSha256, value.runtimeSha256); assert.equal(hash(JSON.stringify(raw.runtime)), value.runtimeSha256)
    assert.equal(raw.runtime.browserSha256, host.browserSha256); assert.equal(raw.runtime.browserVersion, host.browserVersion)
    assert.equal(raw.runtime.node, host.node); assert.deepEqual(raw.runtime.launch, host.launch); assert.deepEqual(raw.runtime.packages, host.buildPackageVersions)
    assert.deepEqual(phase.binding, [0, raw.sourceAfter, true, raw.profile.id, raw.profile.runId,
      raw.profile.previousRun?.runId ?? null, raw.cleanupVerified, raw.profile.continuationVerified])
    assert.equal(raw.profile.cleanupVerified, raw.cleanupVerified)
    assert.equal(phase.checkpointAtStart, raw.profile.checkpointAtStart?.checkpointSha256 ?? null)
    assert.equal(phase.checkpointAtEnd, raw.profile.checkpointAtEnd?.checkpointSha256 ?? null)
    assert.equal(report.phases[index].mode, phase.mode); assert.equal(report.phases[index].receipt, phase.receiptName)
    assert.equal(report.phases[index].sourceReceipt, `mission10-${phase.mode}/receipt.json`)
    assert.equal(report.phases[index].receiptSha256, phase.receiptSha256)
    for (const shot of phase.screenshots) read(shot.name, shot.sha256)
    return result
  })
  if (!composedContract(expected)) return rawPhases
  assert.equal(validateComposedArtifact(files, host, expected, 'mission10'), true, 'Unresolved composed Mission10 resolver')
  return { phases: rawPhases, composedVerified: true }
}

export const resolveProfileArtifact = (archive, upload, receipt) => resolveArtifact(archive, upload, receipt, false)
export const resolveMission10Artifact = (archive, upload, receipt, expected) => resolveArtifact(archive, upload, receipt, true, expected)
