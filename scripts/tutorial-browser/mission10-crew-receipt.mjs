import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { profileHostReceipt } from './profile-host-receipt.mjs'
import { mission10ProfileReceipt } from './mission10-profile-receipt.mjs'

export function mission10CrewReceipt(receipt, output, env = process.env) {
  assert.equal(receipt.selectedScenario, 'mission10-profile')
  assert.equal(receipt.profileRecovery, undefined, 'M10 job must not claim recovery cases')
  return { version: 1, kind: 'mission10-crew-persistence-browser', status: receipt.status,
    ...profileHostReceipt(receipt, output, env), mission10: mission10ProfileReceipt(receipt, output) }
}
export function mission10CrewReceiptLog(receipt) {
  const json = JSON.stringify(receipt)
  if (Buffer.byteLength(json) > 12000) throw Error('Mission 10 receipt exceeds bounded log envelope')
  return `PND_MISSION10_CREW_RECEIPT=${Buffer.from(json).toString('base64')}\nPND_MISSION10_CREW_SHA256=${createHash('sha256').update(json).digest('hex')}`
}
