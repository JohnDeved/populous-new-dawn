// One reviewed Run14 recovery. This reads provenance; it never opens game storage.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { resolve, relative, sep } from 'node:path'

export const RECOVERY = Object.freeze({
  kind: 'mission3-run14-validated-copy',
  mappingSha256: '99268b2986a5eaf3018365f6af25a3ee982d6e8237ce3716c98868b49ccfe9e6',
  saveRunId: 'c5c7823d-867a-4426-b004-addf73dac590',
  profileId: 'bb9f0c5f-7228-4cd1-befc-f62d8c199fa3',
  saveCommit: '81dab9e1ac74fd4aa3879d629758edbd388cfd7f',
  validatorRunId: '83de011e-2c35-42c5-9010-e9e7b7d01a48',
  validatorCommit: '43c52f8968222b198bb7b1eae83b57878c3d9d71',
  innerSha256: '5be2b9f8e483fc35939cee72d422ecfd0ea07862bd89343d346421b3b9870bed',
  outerSha256: '052f6d6d7c0dfe00045dbc6b5cc42b52b559547847ec7055c7e678d5800f0154',
  inventorySha256: '34ff30b75ef9e44ec8e85f8d5f4638296297632000f9f8c5a130221175efbd65',
  closedCopySha256: '8626e0b8a9dacc055edaa44cb1b6ce60d2d7652d91946d7dfe59cd5aefb00daa',
  manifestSha256: '9cf8d03670cbe1d73c7d9bdacf1d4370699d98b9a64e9880cedd33e28f47a67e',
  scriptSha256: 'f892b839b411bb518ba4df89ab59deaf32899968aeb62087749e9bea52f6d8fb',
  origin: 'http://127.0.0.1:4366',
})
export const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const uuid = value => typeof value === 'string' && /^[a-f0-9-]{36}$/.test(value)
const regular = path => {
  assert.equal(resolve(path), path, 'Canonical recovery path required')
  assert.equal(realpathSync(path), path, 'Recovery paths must not follow symlinks')
  const stat = lstatSync(path)
  assert.ok(stat.isFile() && stat.nlink === 1 && stat.uid === process.getuid(), 'Owned regular recovery file required')
  return stat
}
export function readArtifact(ref) {
  assert.ok(ref && hash(ref.sha256)); regular(ref.path)
  const bytes = readFileSync(ref.path)
  assert.equal(digest(bytes), ref.sha256, `Changed recovery evidence: ${ref.path}`)
  return bytes
}
const readJson = ref => JSON.parse(readArtifact(ref))
const pinned = (ref, expected) => { assert.equal(ref?.sha256, expected); return readJson(ref) }

export function verifyClosedCopy(path, inventory) {
  assert.equal(realpathSync(path), path, 'Closed copy must have no symlink ancestors')
  const stat = lstatSync(path)
  assert.ok(stat.isDirectory() && stat.uid === process.getuid() && !(stat.mode & 0o077))
  assert.equal(stat.ino, inventory.directory.inode); assert.equal(stat.dev, inventory.directory.device)
  const names = []
  const walk = directory => {
    for (const name of readdirSync(directory).sort()) {
      const entry = resolve(directory, name), info = lstatSync(entry)
      assert.ok(!info.isSymbolicLink(), 'No symlink in closed validator copy')
      if (info.isDirectory()) walk(entry)
      else { assert.ok(info.isFile()); names.push(relative(path, entry)) }
    }
  }
  walk(path)
  assert.deepEqual(names.sort(), inventory.files.map(file => file.path).sort(), 'Closed-copy file set changed')
  for (const file of inventory.files) {
    assert.ok(!file.path.split(sep).includes('..') && file.kind === 'file')
    const entry = resolve(path, file.path), current = regular(entry)
    for (const [field, actual] of Object.entries({ inode: current.ino, device: current.dev, mode: current.mode,
      uid: current.uid, links: current.nlink, bytes: current.size })) assert.equal(actual, file[field], `Closed-copy ${field}: ${file.path}`)
    assert.equal(digest(readFileSync(entry)), file.sha256, `Closed-copy bytes: ${file.path}`)
  }
  for (const name of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
    try { lstatSync(resolve(path, name)) } catch (error) { if (error.code === 'ENOENT') continue; throw error }
    throw Error('Existing browser ownership marker in closed copy')
  }
}

export function validateRecoveryFacts(payload, inner, outer, context) {
  assert.equal(payload.version, 1); assert.equal(payload.kind, RECOVERY.kind)
  assert.equal(payload.mappingSha256, RECOVERY.mappingSha256)
  assert.equal(payload.predecessor.kind, 'read-only-checkpoint-copy-validation')
  assert.equal(payload.predecessor.gameplay, false)
  assert.equal(payload.predecessor.runId, RECOVERY.validatorRunId)
  assert.equal(payload.predecessor.cleanupScope, 'validator-copy-context-only')
  assert.equal(payload.predecessor.continuationVerified, undefined)
  assert.equal(payload.predecessor.sourceFingerprint, undefined)
  assert.equal(inner.status, 'passed'); assert.equal(inner.cleanupVerified, true)
  assert.deepEqual(inner.cleanup, { status: 'verified', connected: false }); assert.deepEqual(inner.errors, [])
  assert.equal(inner.sourceCommit, RECOVERY.validatorCommit); assert.deepEqual(inner.inputsBefore, inner.inputsAfter)
  assert.equal(outer.runId, RECOVERY.validatorRunId); assert.equal(outer.status, 'passed')
  assert.equal(outer.phase, 'finished'); assert.equal(outer.exitCode, 0); assert.equal(outer.signal, null)
  assert.deepEqual(outer.source, outer.sourceAfter); assert.equal(outer.source.headOid, RECOVERY.validatorCommit)
  assert.deepEqual(inner.checkpointBefore, inner.checkpointAfter)
  assert.deepEqual(payload.predecessor.checkpoint, inner.checkpointAfter)
  assert.equal(inner.checkpointAfter.level, 3); assert.equal(inner.checkpointAfter.turn, 4813)
  assert.equal(inner.checkpointAfter.time, 4813 / 12)
  assert.equal(inner.checkpointAfter.checkpointSha256, '720e96e28b46a029e22a1c97729ead760471c96e4e10c59fd5ae620d5e66f57a')
  for (const key of ['checkpointSha256', 'actorsSha256', 'terrainSha256', 'stockSha256']) assert.ok(hash(inner.checkpointAfter[key]))
  const victim = inner.actors.units.find(unit => unit.id === 50), preacher = inner.actors.units.find(unit => unit.id === 3163)
  assert.equal(victim?.native.id, 50); assert.equal(victim.team, 'yellow'); assert.equal(victim.kind, 'brave'); assert.equal(victim.hp, 50)
  assert.equal(victim.native.state, 23); assert.equal(victim.native.workTarget, 3163); assert.equal(victim.native.timer, 62)
  assert.equal(preacher?.native.id, 3163); assert.equal(preacher.team, 'blue'); assert.equal(preacher.kind, 'preacher'); assert.equal(preacher.hp, 55)
  const target = payload.target
  assert.ok(uuid(target.profile.id)); assert.notEqual(target.profile.id, RECOVERY.profileId)
  assert.equal(target.origin, RECOVERY.origin); assert.equal(context.origin, target.origin)
  for (const key of ['root', 'source', 'inputs', 'runtime']) assert.deepEqual(context[key], target[key], `Recovery target ${key} changed`)
  assert.equal(context.path, target.profile.path); assert.equal(context.id, target.profile.id)
  assert.equal(target.source.root, target.root); assert.ok(hash(target.source.fingerprint) && hash(target.inputs.checker))
  assert.equal(target.scenario.path, resolve(target.root, 'qa/mission-three-controls/driver.mjs'))
  assert.deepEqual(context.scenario, target.scenario)
  assert.equal(context.correspondence ?? null, null, 'Recovery admits no source correspondence')
}

function readHistory(snapshot, inventory, inner) {
  assert.equal(inventory.profileId, RECOVERY.profileId); assert.equal(inventory.interruptedRunId, RECOVERY.saveRunId)
  assert.equal(inventory.sourceCommit, RECOVERY.saveCommit); assert.equal(inventory.execExitCode, 130)
  assert.equal(inventory.originalOwnerLockPreserved, true); assert.equal(inventory.originalInnerReceiptExists, false)
  assert.equal(inventory.fileCount, 179); assert.equal(inventory.files.length, 179)
  for (const file of inventory.files) {
    assert.ok(!file.copy.split('/').includes('..'))
    const path = resolve(snapshot, file.copy); assert.equal(regular(path).size, file.bytes)
    assert.equal(digest(readFileSync(path)), file.copySha256, `Preserved snapshot changed: ${file.copy}`)
  }
  const read = name => JSON.parse(readFileSync(resolve(snapshot, 'run14-evidence', name)))
  const journey = read('journey.json'), saved = read('sermon-saved.json'), failed = read('batch-0048-failed.json')
  assert.equal(journey.status, 'in-progress'); assert.deepEqual(journey.failures.map(f => f.index), [29, 48])
  assert.equal(failed.turn, 4893); assert.equal(failed.time, 407.75); assert.equal(failed.paused, true)
  assert.equal(saved.turn, 4813); assert.equal(saved.time, 4813 / 12); assert.equal(saved.paused, true)
  assert.equal(saved.speed, 1); assert.equal(saved.status, 'playing'); assert.ok(!saved.completedMissions.includes(3))
  const source = journey.continuation.qaContinuation.source
  assert.equal(source.commit, RECOVERY.saveCommit); assert.equal(journey.continuation.qaContinuation.recordedByRunId, RECOVERY.saveRunId)
  const firstOwned = journey.victimSelection, declaration = journey.sermonPlan.declaration
  assert.equal(firstOwned.turnBefore, 4777); assert.equal(firstOwned.turnAfter, 4778)
  assert.equal(firstOwned.victim.id, 50); assert.deepEqual(firstOwned.sameTurnIds, [50, 53])
  assert.equal(firstOwned.preacherId, 3163); assert.equal(declaration.armedAtTurn, 4101)
  assert.deepEqual(saved.units.filter(u => u.team === 'blue' && u.hp > 0).map(u => u.id), inner.actors.blueIds)
  assert.equal(inner.actors.blueIds.length, 13)
  assert.deepEqual(journey.milestones.map(m => m.name), ['vault', 'shaman-home', 'temple', 'preacher', 'listener', 'sermon-saved'])
  return { source, profile: journey.continuation.profile, origin: RECOVERY.origin, savedByRunId: RECOVERY.saveRunId,
    checkpoint: inner.checkpointAfter, ids: journey.ids, declaration, epoch: journey.sermonPlan.epoch, firstOwned,
    retainedBlueIds: inner.actors.blueIds, milestones: journey.milestones, activeSeconds: failed.time,
    inputs: journey.inputs, failures: journey.failures, acquisition: journey.continuation, initialMission3Absent: true,
    originalInterruption: { execSession: inventory.execSession, execExitCode: 130, innerReceipt: 'absent', cleanup: 'unknown', originalLock: 'preserved' },
    checkpointMeasurement: { kind: 'read-only-validator', runId: RECOVERY.validatorRunId, innerReceiptSha256: RECOVERY.innerSha256 },
    scope: 'Newly assembled recovered provenance for the genuine Run14 UI Save. Original failures and unknown cleanup remain; the full digest was measured later by the storage validator. New gameplay requires fresh ordinary Load and witnesses.' }
}

export function readRecoveryAdmission(reference, context, { storagePath } = {}) {
  const payload = readJson(reference), review = readJson(reference.review)
  assert.equal(review.decision, 'ACCEPT'); assert.ok(review.reviewer && review.reference)
  assert.equal(review.admissionSha256, reference.sha256); assert.equal(review.sourceCommit, payload.target.source.commit)
  assert.equal(review.sourceFingerprint, payload.target.source.fingerprint); assert.equal(review.checker, payload.target.inputs.checker)
  const predecessor = payload.predecessor
  const inner = pinned(predecessor.innerReceipt, RECOVERY.innerSha256), outer = pinned(predecessor.outerReceipt, RECOVERY.outerSha256)
  pinned(predecessor.sourceManifest, RECOVERY.manifestSha256)
  assert.equal(predecessor.validatorScript.sha256, RECOVERY.scriptSha256); readArtifact(predecessor.validatorScript)
  validateRecoveryFacts(payload, inner, outer, context)
  assert.equal(digest(readFileSync(payload.target.scenario.path)), payload.target.scenario.sha256)
  assert.equal(payload.snapshot.path, inner.snapshot)
  assert.equal(payload.closedCopy.path, resolve(inner.output, 'browser'))
  const inventory = pinned(payload.snapshot.inventory, RECOVERY.inventorySha256)
  const files = pinned(payload.closedCopy.inventory, RECOVERY.closedCopySha256)
  assert.equal(files.browserPath, payload.closedCopy.path); assert.equal(files.validatorReceiptSha256, RECOVERY.innerSha256)
  if (storagePath) verifyClosedCopy(storagePath, files)
  const sermon = readHistory(payload.snapshot.path, inventory, inner)
  return { reference, target: payload.target, predecessor: { ...predecessor, source: outer.source,
    sourceSchema: 'pnd-command-receipt.source', cleanup: inner.cleanup }, sermon,
    closedCopy: payload.closedCopy, mappingSha256: payload.mappingSha256 }
}

export function createRecoveredSermonRecord(admission, assembledRecoveryAt) {
  assert.ok(typeof assembledRecoveryAt === 'string' && Number.isFinite(Date.parse(assembledRecoveryAt)))
  return structuredClone({ version: 1, kind: 'mission3-recovered-ui-sermon', assembledRecoveryAt,
    recordedByRunId: null, continuationPolicy: 'single-gameplay-segment', ...admission.sermon, recoveryAdmissionSha256: admission.reference.sha256,
    targetProfile: admission.target.profile, targetSource: admission.target.source })
}

export function validateRecoveredSermonRecord(record, { source, profile, origin, checkpoint }) {
  const admission = profile?.recoveryAdmission
  assert.ok(admission, 'Recovery requires the separately verified admission')
  const expected = createRecoveredSermonRecord(admission, record.assembledRecoveryAt)
  assert.deepEqual(Object.keys(record).sort(), Object.keys(expected).sort(), 'Recovered provenance has unexpected or omitted fields')
  for (const key of Object.keys(expected).filter(key => key !== 'recordedByRunId')) assert.deepEqual(record[key], expected[key], `Recovered sermon ${key} changed`)
  assert.equal(record.continuationBlockedReason, undefined, 'A withheld sermon record cannot authorize continuation')
  assert.equal(profile.mode, 'reused'); assert.equal(profile.id, admission.target.profile.id)
  assert.equal(profile.path, admission.target.profile.path); assert.equal(origin, RECOVERY.origin)
  assert.deepEqual(checkpoint, record.checkpoint); assert.deepEqual(source, admission.target.source)
  assert.deepEqual(profile.inputs, admission.target.inputs); assert.equal(profile.correspondence, null)
  assert.equal(record.recordedByRunId, null, 'Recovered provenance authorizes only one gameplay segment')
  assert.equal(profile.previousRun, null, 'No recovery retry or second segment')
  assert.equal(profile.recoveryClaim?.runId, profile.runId, 'Recovered entry owns its single claim')
  return structuredClone({ ...record, recordedByRunId: profile.runId })
}
