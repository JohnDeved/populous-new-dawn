// Continue the genuine saved1190 state from ordinary02. Never replay its prefix.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mission3BuildingScreen from './mission3-building-screen.mjs'

export const continuationSource = {
  output: 'work/orchestration/mission3-building-screen-7025ead7-02',
  receiptSha256: 'f83a3468ce55b141458386b21d4ea5eae10e9935e1864075265e5d80c78f53ae',
  reportSha256: 'be0d64482b31b28014c592e869ed3b8fc7b5d8d40960e6bf0b47a443d70bae63',
  profileId: '8b25752a-6092-42c5-abea-1a878556835a',
  priorRunId: 'a5916834-705d-4cec-9755-fe6df160441b',
  sourceFingerprint: '0ecbd829daada686a868d067a232b8be2110730cadcf97fc47f4d7f4eab0c042',
  application: '3bdc2b425b8e99e88a31b913e7ed83d8cc1e307640f30d67d6832b16024b0b25',
  checker: '4ff987b583c1386ea3a6983d464905982eaac265abc0d7b6caf17561bd0cbdf2',
  checkpointSha256: '0e5ebc6902e2834f4a296fd46d6df18e70263f2056e920984aa485ebb50afedf',
  origin: 'http://127.0.0.1:4191',
}

// Same narrow historical-JSON bridge as PR274. Live Load comparisons remain
// lossless; no value from this report is written into World or checkpoint storage.
export function assertMission3SerializedCheckpoint(actual, serialized) {
  assert.equal(actual.level, 3)
  assert.equal(actual.turn, 1190)
  assert.equal(actual.paused, true)
  assert.equal(actual.temple, false)
  assert.equal(actual.gifts.length, 1)
  assert.equal(serialized.gifts.length, 1)
  const tag = {
    mission: 3,
    head: 91,
    reward: 92,
    slot: 0,
    rewardClass: 2,
    model: 5,
    completedTurn: 1133,
    serial: 3141,
  }
  for (const gift of [actual.gifts[0], serialized.gifts[0]]) {
    assert.equal(gift.id, 3141)
    assert.equal(gift.kind, 'gift')
    assert.equal(gift.reward, 'temple')
    assert.equal(gift.remaining, 25)
    assert.deepEqual(gift.buildingAcquisition, tag)
  }
  assert.equal(actual.gifts[0].duration, Infinity)
  assert.equal(serialized.gifts[0].duration, null)
  const projected = structuredClone(actual)
  projected.gifts[0].duration = null
  assert.deepEqual(projected, serialized)
  const controller = actual.acquisition.controllers.building
  assert.equal(controller.active, true)
  assert.equal(controller.giftId, 3141)
  assert.equal(controller.phase, 4)
  assert.equal(controller.visits, 14)
  assert.equal(controller.pending, false)
}

export function readMission3Continuation(root, receipt) {
  const hash = bytes => createHash('sha256').update(bytes).digest('hex')
  const prior = (name, expected) => {
    const bytes = readFileSync(resolve(root, continuationSource.output, name))
    assert.equal(hash(bytes), expected, 'Prior failed evidence changed')
    return JSON.parse(bytes)
  }
  const previous = prior('receipt.json', continuationSource.receiptSha256)
  const original = prior('mission3-temple-checkpoint.json', continuationSource.reportSha256)
  assert.equal(previous.status, 'failed')
  assert.equal(original.status, 'failed')
  assert.match(original.failure, /Trusted Restart must observe the actual restored active owner/)
  assert.deepEqual(previous.errors, [])
  assert.equal(previous.profile.cleanupVerified, true)
  assert.equal(previous.profile.continuationVerified, true)
  assert.equal(receipt.profile.mode, 'reused')
  assert.equal(receipt.profile.id, continuationSource.profileId)
  assert.equal(receipt.profile.origin, continuationSource.origin)
  assert.equal(receipt.profile.previousRun.runId, continuationSource.priorRunId)
  assert.equal(receipt.profile.previousRun.receiptSha256, continuationSource.receiptSha256)
  assert.equal(receipt.profile.previousRun.sourceFingerprint, continuationSource.sourceFingerprint)
  assert.equal(receipt.profile.previousRun.checker, continuationSource.checker)
  assert.equal(receipt.profile.inputs.application, continuationSource.application)
  assert.equal(receipt.profile.correspondence?.decision, 'ACCEPT')
  assert.deepEqual(receipt.profile.checkpointAtStart, previous.profile.checkpointAtEnd)
  assert.equal(
    receipt.profile.checkpointAtStart.checkpointSha256,
    continuationSource.checkpointSha256
  )
  const acquisition = original.acquisition
  assert.equal(acquisition.status, 'failed')
  assert.deepEqual(acquisition.activeSave.digest.checkpoint, previous.profile.checkpointAtEnd)
  const epochs = structuredClone(acquisition.epochs)
  for (const evidence of Object.values(epochs)) {
    assert.equal(evidence.restored, true)
    assert.deepEqual(evidence.errors, [])
    for (const frame of Object.values(evidence.frames))
      for (const field of ['buildingFile', 'overlayFile']) {
        const image = frame[field]
        if (!image) continue
        assert.match(image.file, /^m3-[a-zA-Z]+-[a-zA-Z]+-(building|overlay)\.png$/)
        assert.equal(
          hash(readFileSync(resolve(root, continuationSource.output, image.file))),
          image.sha256
        )
        image.priorOutput = continuationSource.output
      }
  }
  assert.equal(epochs.fresh.source.shamanId, 46)
  assert.equal(epochs.fresh.birth.turn, 1133)
  assert.equal(epochs.fresh.birth.gift.id, 3141)
  return {
    source: continuationSource,
    epochs,
    shamanId: 46,
    birth: acquisition.epochs.fresh.birth,
    activeSave: acquisition.activeSave,
    validateSaved(committed) {
      assert.equal(committed?.version, 1)
      assertMission3SerializedCheckpoint(
        committed.snapshot,
        acquisition.activeSave.boundary.snapshot
      )
    },
  }
}

export default async function mission3BuildingScreenContinuation(context) {
  const continuation = readMission3Continuation(context.root, context.receipt)
  return mission3BuildingScreen(context, continuation)
}
