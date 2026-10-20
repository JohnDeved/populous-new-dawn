import assert from 'node:assert/strict'
import { profileHostReceipt } from './profile-host-receipt.mjs'
import { mission10ProfileReceipt } from './mission10-profile-receipt.mjs'
import { isDeepStrictEqual } from 'node:util'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Evidence only. The trusted integration reader independently validates this
// envelope against the current Actions attempt and reviewed Git blobs.
function recoveryReceipt(receipt, output, env, includeMission10) {
  const result = receipt.profileRecovery
  assert.ok(
    result?.status === 'passed' &&
      Array.isArray(result?.cases) &&
      Array.isArray(result?.screenshots),
    'Successful profile scenario must provide cases'
  )
  const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')
  return {
    version: 1,
    kind: includeMission10 ? 'profile-recovery-browser' : 'profile-recovery-cases-browser',
    status: receipt.status,
    ...profileHostReceipt(receipt, output, env),
    ...(includeMission10 ? { mission10: mission10ProfileReceipt(receipt, output) } : {}),
    scenarioStatus: result.status,
    runtimeUnchanged:
      !!result.runtime &&
      !!result.runtimeAfter &&
      isDeepStrictEqual(result.runtime, result.runtimeAfter),
    cases: result.cases.map(({ kind, status, fixture }) => ({ kind, status, fixture })),
    screenshots: result.screenshots.map(s => ({
      ...s,
      sha256: hash(resolve(output, s.name)),
    })),
  }
}

export function profileRecoveryReceiptLog(receipt) {
  const json = JSON.stringify(receipt)
  if (Buffer.byteLength(json) > 12000) throw Error('Recovery receipt exceeds bounded log envelope')
  return `PND_PROFILE_RECOVERY_RECEIPT=${Buffer.from(json).toString('base64')}\nPND_PROFILE_RECOVERY_SHA256=${createHash('sha256').update(json).digest('hex')}`
}

// The historical composite policy remains strict; split admission is explicit.
export const profileRecoveryReceipt = (receipt, output, env = process.env) => recoveryReceipt(receipt, output, env, true)
export function profileCasesReceipt(receipt, output, env = process.env) {
  assert.equal(receipt.mission10Profile, undefined, 'Recovery job must not claim a separate M10 episode')
  return recoveryReceipt(receipt, output, env, false)
}
export const profileCasesReceiptLog = receipt => profileRecoveryReceiptLog(receipt).replaceAll('PND_PROFILE_RECOVERY_', 'PND_PROFILE_CASES_')
