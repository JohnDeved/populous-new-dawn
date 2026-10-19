import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { writeMission10Fixture } from './support/mission10-profile-receipt.mjs'
import { validateMission10Profile } from '../scripts/integration-queue/profile-recovery.mjs'
import {
  profileRecoveryReceipt,
  profileRecoveryReceiptLog,
} from '../scripts/tutorial-browser/profile-recovery-receipt.mjs'

test('profile producer binds actual screenshots, cases, runtime and raw receipt', () => {
  const output = mkdtempSync(join(tmpdir(), 'profile-receipt-'))
  try {
    writeFileSync(join(output, 'receipt.json'), 'raw evidence')
    writeFileSync(join(output, 'observed.png'), 'pixel bytes')
    const receipt = {
      status: 'passed',
      selectedScenario: 'profile-recovery',
      source: { commit: '1'.repeat(40), files: {} },
      browserSha256: 'a'.repeat(64), browserVersion: 'Chrome', node: process.version, launch: {}, buildPackageVersions: {},
      build: { exitCode: 0, signal: null, timedOut: false, capMs: 120000 },
      browserCapMs: 180000,
      profileRecovery: {
        status: 'passed',
        runtime: { input: 'same' },
        runtimeAfter: { input: 'same' },
        cases: [
          { kind: 'empty', fixture: true, status: 'passed', diagnostic: 'not in compact envelope' },
        ],
        screenshots: [{ name: 'observed.png', viewport: { width: 123, height: 456 }, dpr: 2 }],
      },
    }
    receipt.mission10Profile = writeMission10Fixture(output, receipt)
    const envelope = profileRecoveryReceipt(receipt, output, {})
    assert.equal(validateMission10Profile(envelope.mission10, receipt.source.commit), true)
    assert.equal(envelope.runtimeUnchanged, true)
    assert.deepEqual(envelope.build, receipt.build)
    assert.equal(envelope.browserTimedOut, false)
    assert.equal(envelope.browserCapMs, 180000)
    assert.deepEqual(envelope.cases, [{ kind: 'empty', status: 'passed', fixture: true }])
    assert.deepEqual(envelope.screenshots[0].viewport, { width: 123, height: 456 })
    assert.equal(envelope.screenshots[0].dpr, 2)
    assert.equal(envelope.receiptSha256, createHash('sha256').update('raw evidence').digest('hex'))
    assert.match(profileRecoveryReceiptLog(envelope), /^PND_PROFILE_RECOVERY_RECEIPT=/)
    receipt.profileRecovery.runtimeAfter.input = 'changed'
    assert.equal(profileRecoveryReceipt(receipt, output, {}).runtimeUnchanged, false)
    receipt.profileRecovery.screenshots[0].name = 'missing.png'
    assert.throws(() => profileRecoveryReceipt(receipt, output, {}), /ENOENT/)
    receipt.profileRecovery.status = 'failed'
    assert.throws(() => profileRecoveryReceipt(receipt, output, {}), /Successful profile/)
    assert.throws(() => profileRecoveryReceiptLog({ oversized: 'x'.repeat(12000) }), /bound/)
  } finally {
    rmSync(output, { recursive: true, force: true })
  }
})
