// Explicit one-time local registration; importing this module has no side effects.
import assert from 'node:assert/strict'
import { existsSync, lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sourceReceipt, profileRuntimeReceipt } from '../../scripts/local-render/harness.mjs'
import { profileInputReceipt, validateProfilePaths } from '../../scripts/local-render/owned-profile.mjs'
import { RECOVERY, readArtifact, readRecoveryAdmission, verifyClosedCopy, createRecoveredSermonRecord, digest } from './recovery-admission.mjs'

export function registerRecoveredSermon(reference, output, execute = false) {
  const payload = JSON.parse(readArtifact(reference)), { target } = payload
  const path = target.profile.path, browser = resolve(path, 'browser')
  output = resolve(output)
  const parent = validateProfilePaths(target.root, path, output)
  assert.ok(!existsSync(path), 'Registration requires a new target profile directory')
  assert.ok(!existsSync(output), 'Registration requires a new evidence directory')
  const context = { root: target.root, path, id: target.profile.id, origin: target.origin,
    source: sourceReceipt(target.root), inputs: profileInputReceipt(target.root, target.scenario.path),
    runtime: profileRuntimeReceipt(target.root, target.runtime.browserPath, createRequire(resolve(target.root, 'package.json'))),
    scenario: { path: target.scenario.path, sha256: digest(readFileSync(target.scenario.path)) }, correspondence: null }
  const admission = readRecoveryAdmission(reference, context, { storagePath: payload.closedCopy.path })
  const inventory = JSON.parse(readArtifact(payload.closedCopy.inventory))
  const recordPath = resolve(target.root, 'work/orchestration/mission-three-controls/recovery-4813/sermon-record.json')
  validateProfilePaths(target.root, path, dirname(recordPath))
  assert.ok(!existsSync(dirname(recordPath)), 'Recovery provenance directory must be new')
  assert.equal(lstatSync(target.root).dev, inventory.directory.device, 'Recovery is a same-filesystem rename')
  const result = { kind: 'mission3-actual-validator-directory-registration', status: 'preflight-passed',
    source: context.source, admissionSha256: reference.sha256, acceptedMappingSha256: RECOVERY.mappingSha256,
    validatorRunId: RECOVERY.validatorRunId, originalSaveRunId: RECOVERY.saveRunId,
    from: payload.closedCopy.path, to: browser, profileId: target.profile.id, recordPath,
    closedCopyInventorySha256: payload.closedCopy.inventory.sha256, browserDirectoryInode: inventory.directory.inode,
    limits: ['Registration only; no gameplay Load, Save, original cleanup or clean Run14 result. Private profile bytes remain local.'] }
  if (!execute) return result
  mkdirSync(parent, { recursive: true, mode: 0o700 })
  mkdirSync(path, { mode: 0o700 })
  // A rename preserves the actual validated context and its inodes. No recopy,
  // database repair, cleanup or replacement is attempted after any failure.
  renameSync(payload.closedCopy.path, browser)
  verifyClosedCopy(browser, inventory)
  const createdAt = new Date().toISOString()
  const marker = { version: 1, purpose: 'populous-local-render-game-only', id: target.profile.id,
    path, createdAt, binding: { root: target.root, origin: target.origin,
      application: target.inputs.application, runtime: target.runtime }, lastRun: null, recoveryAdmission: reference }
  writeFileSync(resolve(path, 'populous-profile.json'), JSON.stringify(marker, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
  mkdirSync(dirname(recordPath), { recursive: true, mode: 0o700 })
  const record = createRecoveredSermonRecord(admission, createdAt)
  writeFileSync(recordPath, JSON.stringify(record, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
  mkdirSync(output, { recursive: true, mode: 0o700 })
  Object.assign(result, { status: 'registered', registeredAt: createdAt,
    markerSha256: digest(readFileSync(resolve(path, 'populous-profile.json'))),
    recordSha256: digest(readFileSync(recordPath)), afterDirectoryInode: lstatSync(browser).ino })
  writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
  return result
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, referencePath, output, ...extra] = process.argv.slice(2)
  assert.ok(['--check', '--execute'].includes(mode) && referencePath && output && extra.length === 0,
    'Usage: register-recovered-sermon.mjs --check|--execute reference.json new-output-directory')
  const reference = JSON.parse(readFileSync(resolve(referencePath), 'utf8'))
  console.log(JSON.stringify(registerRecoveredSermon(reference, output, mode === '--execute'), null, 2))
}
