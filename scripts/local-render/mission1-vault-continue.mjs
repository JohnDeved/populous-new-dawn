// Explicit continuation of the real ordinary06 saved946. The harness alone
// owns the private profile lease, reviewed checker correspondence and browser.
import assert from 'node:assert/strict'
import { readCommittedCheckpoint } from './checkpoint-observer.mjs'
import { installMission1VaultCheckpointState, readMission1VaultCheckpoint } from './mission1-vault-checkpoint.mjs'

export const savedMission1Vault946 = {
  profileId: 'ea3649ee-81c5-4a3f-8083-afcf6183ba2a',
  sourceRunId: 'a3251263-1ea2-4e91-ad6b-2d4846d68bfb',
  checkpoint: { version: 1, level: 1, turn: 946, time: 78.83333333333333,
    checkpointSha256: 'd737edcff40882186b99f996a7243df01659bf02f3504eedff36f15398391f33',
    actorsSha256: '8a142c897265e89d0e46afa365c3b35ff574e31dfc4c2182b9680caf2215bc7a',
    terrainSha256: 'ad22b7bc4c2af4d8348d33ec6b8508a272211df0059e959ea622413050b8af31',
    stockSha256: 'fd37aa2220cfb25ee1919b591c99ca427ca6fb97f329902edecfcc2643f6a4c2' },
}
export function assertMission1ContinuationProfile(profile, committed) {
  assert.equal(profile?.mode, 'reused', 'Continuation requires the existing harness-owned profile')
  assert.equal(profile.id, savedMission1Vault946.profileId)
  assert.equal(profile.correspondence?.decision, 'ACCEPT', 'Harness-verified reviewed checker correspondence required')
  assert.equal(profile.previousRun?.cleanupVerified, true)
  assert.equal(profile.previousRun?.continuationVerified, true)
  assert.deepEqual(profile.previousRun.checkpointAtEnd, savedMission1Vault946.checkpoint)
  assert.deepEqual(profile.checkpointAtStart, savedMission1Vault946.checkpoint)
  assert.deepEqual(committed, savedMission1Vault946.checkpoint, 'Actual committed checkpoint differs from saved946')
}
export async function readMission1ContinuationSeed(page, receipt) {
  const committed = await readCommittedCheckpoint(page)
  assertMission1ContinuationProfile(receipt.profile, committed)
  await page.evaluate(installMission1VaultCheckpointState)
  const saved = await page.evaluate(readMission1VaultCheckpoint)
  assert.equal(saved.level, 1); assert.equal(saved.turn, 946); assert.equal(saved.active, true)
  assert.equal(saved.camp, false); assert.equal(saved.gifts, 0); assert.equal(saved.bridges, 1)
  assert.equal(saved.glow.f1, 12); assert.equal(saved.glow.displayedFrame, 2)
  assert.deepEqual(saved.shaman, [{ id: 30, hp: 100, x: -4.28515625, z: 3.11328125 }])
  return { saved, originalShamanId: 30, provenance: { profileId: receipt.profile.id,
    sourceRunId: savedMission1Vault946.sourceRunId, checkpoint: committed } }
}
export default async function continueMission1VaultKnowledge(args) {
  const { default: scenario } = await import('./mission1-vault-knowledge.mjs')
  return scenario({ ...args, continueSaved946: true })
}
