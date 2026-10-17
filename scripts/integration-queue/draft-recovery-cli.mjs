#!/usr/bin/env node
// A file-backed explicit connector boundary, never a shell/HTTP mutation runner.
import assert from 'node:assert/strict'
import {
  readFileSync,
  realpathSync,
  lstatSync,
  existsSync,
  openSync,
  closeSync,
  unlinkSync,
} from 'node:fs'
import { dirname, resolve, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sha256, digest } from './policy.mjs'
import { atomicWrite } from './cli.mjs'
import { GitHubReader } from './github.mjs'
import { observeAdmission } from './admission-observer.mjs'
import { collectDraftRecoveryObservation } from './draft-recovery-observer.mjs'
import {
  DRAFT_CONNECTOR,
  READY_CONNECTOR,
  prepareDraftRecovery,
  dispatchDraftRecovery,
  recordDraftRecoveryReceipt,
  observeDraftRecovery,
  recoveryDescriptor,
  prepareOriginalReady,
  recordOriginalReadyReceipt,
  observeOriginalReady,
  validateOriginalReadyCompletion,
} from './draft-recovery.mjs'

function trusted(path, expected) {
  assert(
    isAbsolute(path) && realpathSync(path) === path && lstatSync(path).isFile(),
    'Canonical regular input required'
  )
  const bytes = readFileSync(path)
  assert(bytes.length <= 4 * 1024 * 1024, 'Recovery input bound exceeded')
  assert.equal(sha256(bytes), expected, 'Trusted input digest differs')
  return JSON.parse(bytes)
}

export async function recoveryMain(
  argv = process.argv.slice(2),
  {
    Reader = GitHubReader,
    clock = Date.now,
    observe = collectDraftRecoveryObservation,
    admissionObserve = observeAdmission,
    persist = atomicWrite,
  } = {}
) {
  assert.equal(argv.length, 5, 'Usage: manifest-path sha256 mode input-path sha256')
  const [manifestPath, manifestHash, mode, inputPath, inputHash] = argv
  assert(
    [
      'observe',
      'prepare',
      'dispatch-draft',
      'record-draft',
      'observe-draft',
      'prepare-ready',
      'record-ready',
      'observe-ready',
      'verify-final',
    ].includes(mode)
  )
  const manifest = trusted(manifestPath, manifestHash),
    input = trusted(inputPath, inputHash)
  const grant = trusted(manifest.grantPath, manifest.grantSha256)
  const journal = manifest.originalJournalPath
  assert(isAbsolute(journal) && resolve(journal) === journal && realpathSync(journal) === journal)
  assert.equal(grant.originalJournalSha256, manifest.originalJournalSha256)
  const sidecar = `${journal}.draft-recovery.json`
  const driverRoot = fileURLToPath(new URL('../../', import.meta.url)),
    driver = new Reader({ cwd: driverRoot })
  assert.equal(driver.git('rev-parse', 'HEAD'), manifest.driverHead)
  assert.equal(driver.git('status', '--porcelain', '--untracked-files=normal'), '')
  const candidate = realpathSync(manifest.candidate)
  assert(lstatSync(candidate).isDirectory(), 'Candidate directory required')
  for (const path of [journal, sidecar, manifestPath, inputPath, manifest.grantPath])
    assert(
      path !== candidate && !path.startsWith(`${candidate}/`),
      'Recovery state must be outside candidate'
    )
  const reader = new Reader({ cwd: candidate })
  const originalInput = trusted(journal, manifest.originalJournalSha256)
  assert.equal(originalInput.journalPath, journal, 'Copied journal path is forbidden')
  assert.equal(originalInput.records.at(-1).grant.journalPath, journal)
  const observeWithAdmission = () => {
    const entry = trusted(manifest.entryPath, manifest.entrySha256)
    assert.equal(digest(entry), originalInput.records.at(-1).grant.entryDigest)
    const admission = admissionObserve(
      reader,
      entry,
      originalInput.records.at(-1).grant,
      manifest.entryPath
    )
    return { ...observe(reader, grant, clock), admission }
  }
  if (mode === 'observe') return observeWithAdmission()
  // Same canonical lock as admission. No automatic stale lock reclamation.
  const lock = `${journal}.lock`,
    fd = openSync(lock, 'wx', 0o600)
  try {
    const original = trusted(journal, manifest.originalJournalSha256)
    assert.equal(original.journalPath, journal, 'Copied journal path is forbidden')
    assert.equal(original.records.at(-1).grant.journalPath, journal)
    let saved = null
    let sidecarPresent = false
    try {
      lstatSync(sidecar)
      sidecarPresent = true
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    if (sidecarPresent) {
      assert(
        lstatSync(sidecar).isFile() && realpathSync(sidecar) === sidecar,
        'Noncanonical recovery state'
      )
      saved = JSON.parse(readFileSync(sidecar, 'utf8'))
    }
    if (mode === 'prepare') {
      for (const [pathKey, hashKey] of [
        ['denialReceiptPath', 'denialReceiptSha256'],
        ['authorizationReceiptPath', 'authorizationReceiptSha256'],
        ['terminationReceiptPath', 'terminationReceiptSha256'],
      ]) {
        const path = manifest[pathKey]
        assert(realpathSync(path) === path)
        assert.equal(sha256(readFileSync(path)), grant[hashKey])
      }
      const result = prepareDraftRecovery(
        original,
        manifest.originalJournalSha256,
        saved,
        grant,
        input.observations,
        clock()
      )
      persist(sidecar, result.ledger)
      return {
        status: result.descriptor ? 'prepared-not-dispatched' : 'observed-draft',
        recoveryDigest: digest(grant),
        readyAuthority: false,
      }
    }
    assert(
      saved && saved.records.at(-1).grantDigest === digest(grant),
      'Recovery grant not prepared'
    )
    let next, descriptor
    try {
      if (mode === 'dispatch-draft') {
        const fresh =
          mode === 'dispatch-draft' || mode === 'prepare-ready'
            ? observeWithAdmission()
            : observe(reader, grant, clock)
        next = dispatchDraftRecovery(saved, digest(grant), fresh, original, clock())
        descriptor = recoveryDescriptor(next.records.at(-1))
      } else if (mode === 'record-draft' || mode === 'record-ready') {
        assert.equal(sha256(readFileSync(input.rawReceiptPath)), input.receipt.rawReceiptSha256)
        next =
          mode === 'record-draft'
            ? recordDraftRecoveryReceipt(saved, digest(grant), input.receipt, clock())
            : recordOriginalReadyReceipt(saved, input.receipt, clock())
      } else {
        const fresh =
          mode === 'dispatch-draft' || mode === 'prepare-ready'
            ? observeWithAdmission()
            : observe(reader, grant, clock)
        if (mode === 'observe-draft')
          next = observeDraftRecovery(saved, digest(grant), fresh, original, clock())
        if (mode === 'prepare-ready') {
          next = prepareOriginalReady(saved, input.authorization, fresh, original, clock())
          descriptor = recoveryDescriptor(next.records.at(-1), true)
        }
        if (mode === 'observe-ready') next = observeOriginalReady(saved, fresh, original, clock())
        if (mode === 'verify-final') {
          const entry = trusted(manifest.entryPath, manifest.entrySha256)
          const admissionGrant = original.records.at(-1).grant
          assert.equal(digest(entry), admissionGrant.entryDigest)
          const validation = admissionObserve(reader, entry, admissionGrant, manifest.entryPath)
          // Full validation can take minutes. Re-observe timeline/state afterward;
          // freshness must cover both observations, otherwise fail closed.
          const finalState = observe(reader, grant, clock)
          if (validation.activeAttempts || validation.full.state === 'missing') {
            next = observeOriginalReady(saved, finalState, original, clock())
            if (!validation.activeAttempts)
              assert(
                clock() - next.records.at(-1).normalReady.receipts[0].at < 300_000,
                'No Full admission after five minutes'
              )
            persist(sidecar, next)
            return { status: 'waiting-for-source-bound-validation', mergeAuthority: false }
          }
          next = validateOriginalReadyCompletion(saved, finalState, original, validation, clock())
        }
      }
    } catch (error) {
      saved.records.at(-1).phase = 'stopped'
      saved.records.at(-1).receipts.push({
        stage: 'stopped',
        at: clock(),
        reason: String(error.message).slice(0, 300),
      })
      persist(sidecar, saved)
      throw error
    }
    persist(sidecar, next) // Durable spend BEFORE returning any executable connector descriptor.
    return {
      status: descriptor ? 'dispatch-intended-call-connector-once' : 'receipt-recorded',
      descriptor,
      originalTransportOutcome: 'unknown',
      mergeAuthority: false,
    }
  } finally {
    closeSync(fd)
    unlinkSync(lock)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(await recoveryMain()))
  } catch (error) {
    console.error(
      `Recovery stopped: ${String(error.message)
        .replace(/[\r\n]/g, ' ')
        .slice(0, 500)}`
    )
    process.exitCode = 2
  }
}
