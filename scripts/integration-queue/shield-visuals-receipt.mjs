// Data-only admission of the mandatory Shield episode. Original unit-frame
// bytes come from the caller's trusted source pins, never candidate execution.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { checkpointCodec } from '../tutorial-browser/checkpoint-codec.mjs'
import { SHIELD_VISUAL_INPUTS } from '../tutorial-browser/shield-visuals-inputs.mjs'
import { validateShieldCapture, validateShieldPng } from '../tutorial-browser/shield-evidence.mjs'
import { validateAngelPng } from './spell-visuals-render-evidence.mjs'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export async function validateShieldReceipt(shield, read, expected) {
  const pins = Object.fromEntries(SHIELD_VISUAL_INPUTS.map(name => [name, expected.inputs[name]]))
  assert.equal(shield.schema, 'populous-new-dawn/shield-visuals'); assert.equal(shield.schemaVersion, 1)
  assert.equal(shield.status, 'passed'); assert.equal(shield.admission, 'admitted')
  assert.deepEqual(shield.source, { commit: expected.identity.mergeSha, files: pins })
  assert.equal(shield.expectedRevision, expected.identity.mergeSha); assert.equal(shield.currentCheckpointVersion, 4)
  assert.deepEqual(shield.errors, []); assert.ok(!shield.error && !shield.timedOut)
  const budget = shield.budget, cleanup = shield.cleanup
  assert.equal(budget.capMs, 45000); assert.equal(budget.outerReserveMs, 10000)
  assert.ok(Number.isFinite(budget.runnerDeadlineAt)); assert.ok(Number.isFinite(budget.remainingAtAdmissionMs) && budget.remainingAtAdmissionMs >= 55000 && budget.remainingAtAdmissionMs <= 180000)
  assert.ok(Number.isFinite(budget.startedMonotonicMs) && budget.startedMonotonicMs >= 0)
  assert.equal(budget.deadlineMonotonicMs, budget.startedMonotonicMs + 45000)
  assert.ok(Number.isFinite(budget.elapsedMs) && budget.elapsedMs >= 0 && budget.elapsedMs < 45000)
  for (const key of ['contextCreated', 'closeRequested', 'contextClosed', 'closedWithinBudget']) assert.equal(cleanup[key], true)
  for (const key of ['notCreated', 'lateCreation', 'creationPendingOrFailed', 'error']) assert.ok(!cleanup[key])
  for (const key of ['createdElapsedMs', 'closeRequestedElapsedMs', 'closedElapsedMs']) assert.ok(Number.isFinite(cleanup[key]))
  assert.ok(cleanup.createdElapsedMs >= 0 && cleanup.createdElapsedMs <= cleanup.closeRequestedElapsedMs)
  assert.ok(cleanup.closeRequestedElapsedMs <= cleanup.closedElapsedMs && cleanup.closedElapsedMs <= budget.elapsedMs)
  assert.ok(Buffer.isBuffer(expected.originalUnits), 'Pinned original unit-frame JSON bytes are required')
  assert.equal(hash(expected.originalUnits), expected.inputs['app/original-units.json'])
  const units = JSON.parse(expected.originalUnits)
  const setup = JSON.parse(read('shield-checkpoint-source.json'))
  assert.deepEqual(setup, shield.setup); assert.equal(setup.version, 4)
  assert.equal(setup.sourceCommit, expected.identity.mergeSha); assert.deepEqual(setup.sourceFiles, pins)
  assert.equal(setup.transferSha256, hash(read('shield-checkpoint-transfer.json')))
  assert.equal(setup.expectedLoadedSha256, hash(read('shield-checkpoint-expected.json')))
  assert.equal(shield.initialLoad.completeWorldMatched, true)
  assert.equal(shield.initialLoad.sha256, hash(read('shield-initial-load-boundary.json')))
  assert.deepEqual(JSON.parse(read('shield-initial-load-boundary.json')), JSON.parse(read('shield-checkpoint-expected.json')))
  const supplied = checkpointCodec(JSON.parse(read('shield-checkpoint-transfer.json')), true)
  assert.equal(supplied.version, 4)
  const saved = JSON.parse(read('shield-public-save.json'))
  assert.equal(saved.version, 4); assert.equal(shield.saved.version, 4); assert.equal(shield.loaded.version, 4)
  assert.equal(shield.saved.worldSha256, hash(JSON.stringify(saved.world)))
  assert.equal(shield.loaded.worldSha256, hash(read('shield-public-load-boundary.json')))
  assert.equal(shield.loaded.completeWorldMatched, true)
  assert.deepEqual(JSON.parse(read('shield-public-load-expected.json')), JSON.parse(read('shield-public-load-boundary.json')))
  const ids = [...setup.ids.blue, ...setup.ids.foreign]
  assert.equal(setup.ids.blue.length, 6); assert.equal(setup.ids.foreign.length, 3)
  assert.equal(new Set([...ids, setup.ids.shaman]).size, 10)
  assert.equal(setup.supplied.shieldShots, 1); assert.equal(setup.supplied.foreignRemainingTurns, 180)
  assert.equal(shield.beforeCast.shots, 1); assert.equal(shield.beforeCast.inputMask, 0)
  assert.deepEqual(shield.beforeCast.selected, [setup.ids.shaman]); assert.equal(shield.afterCast.shots, 0)
  for (const name of ['beforeCast', 'afterCast', 'pauseBefore', 'pauseAfter', 'beforeExpiry', 'terminal']) {
    const state = shield[name]
    assert.deepEqual(state.people.map(person => person.id), ids)
    assert.equal(state.sceneStoreMatch, true); assert.equal(state.canvasConnected, true)
  }
  assert.ok(shield.beforeCast.people.slice(0, 6).every(person => person.shield === 0))
  assert.ok(shield.beforeCast.people.slice(6).every(person => person.shield > 0))
  assert.ok(shield.afterCast.people.every(person => person.shield > 0 && person.flags3 & 0x8000 && !person.fight))
  const pause = shield.visiblePause
  assert.equal(pause.timestamp, pause.sceneTimestamp)
  assert.equal(pause.beforeSha256, hash(pause.before)); assert.equal(pause.afterSha256, hash(pause.after))
  const beforePause = checkpointCodec(JSON.parse(pause.before), true), afterPause = checkpointCodec(JSON.parse(pause.after), true)
  assert.equal(beforePause.paused, false); assert.equal(afterPause.paused, true)
  assert.deepEqual({ ...beforePause, paused: true }, afterPause)
  assert.deepEqual(pause.clockBefore, pause.clockAfter)
  assert.equal(pause.onlyPausedChanged, true)
  assert.deepEqual(shield.pauseBefore, shield.pauseAfter)
  const savedWorld = checkpointCodec(saved.world, true)
  assert.deepEqual(shield.saved.people.map(person => person.id), ids)
  for (const person of shield.saved.people) {
    const unit = savedWorld.units.find(unit => unit.id === person.id)
    assert.ok(unit); assert.equal(unit.shield, person.shield); assert.equal(unit.native.flags3, person.flags3)
  }
  const loadedWorld = checkpointCodec(JSON.parse(read('shield-public-load-boundary.json')), true)
  for (const person of shield.beforeExpiry.people) {
    const unit = loadedWorld.units.find(unit => unit.id === person.id)
    assert.ok(unit && unit.shield >= person.shield && person.shield > 0)
  }
  assert.equal(shield.atlas.sha256, expected.inputs['public/original/shield.png']); assert.ok(shield.atlas.bytes > 0)
  assert.equal(shield.buildIdentity.revision, expected.identity.mergeSha)
  assert.equal(shield.buildIdentity.sha256, hash(read('shield-build-frames.json')))
  assert.equal(JSON.parse(read('shield-build-frames.json')).buildRevision, expected.identity.mergeSha)
  await validateAngelPng(read('shield-context.png'), 1280, 900, false)
  assert.deepEqual(shield.captures.map(capture => capture.label), ['original', 'scaled', 'loaded'])
  for (const [index, capture] of shield.captures.entries()) {
    const owners = index === 0 ? [0, 1, 2, 3] : [0]
    const acceptance = validateShieldCapture(capture, { owners, scaled: index === 1, units })
    assert.deepEqual(capture.acceptance, acceptance)
    for (const sample of capture.samples) {
      assert.equal(sample.id, sample.owner === 0 ? ids[0] : setup.ids.foreign[sample.owner - 1])
      assert.equal(sample.filename, `shield-${capture.label}-${sample.owner}.png`)
      assert.deepEqual(validateShieldPng(read(sample.filename), sample),
        { pngSha256: sample.pngSha256, retainedRgbaSha256: sample.retainedRgbaSha256 })
    }
  }
  assert.equal(shield.disposal.materials, ids.length * 3)
  assert.equal(shield.disposal.disposedMaterials, ids.length * 3); assert.equal(shield.disposal.disposedAtlas, 0)
  for (const key of ['sceneReplaced', 'worldReplaced', 'disposed', 'canvasRemoved']) assert.equal(shield.disposal[key], true)
  assert.equal(shield.expiry.error, null); assert.equal(shield.expiry.done, true)
  assert.ok(shield.expiry.samples.length >= 2 && shield.expiry.samples.length <= 256)
  let previous
  for (const sample of shield.expiry.samples) {
    assert.deepEqual(sample.people.map(person => person.id), setup.ids.foreign)
    assert.ok(Number.isSafeInteger(sample.turn) && Number.isSafeInteger(sample.stamp))
    if (previous) {
      const turns = (sample.turn - previous.turn) >>> 0
      assert.ok(turns <= 180)
      for (const [index, person] of sample.people.entries())
        assert.equal(person.remaining, Math.max(0, previous.people[index].remaining - turns))
    }
    previous = sample
  }
  assert.ok(shield.expiry.samples[0].people.every(person => person.remaining > 0))
  assert.ok(previous.people.every(person => person.remaining === 0 && !(person.flags3 & 0x8000) &&
    person.visible.length === 3 && person.visible.every(visible => visible === false)))
  assert.ok(shield.terminal.people.slice(0, 6).every(person => person.shield > 0 && person.flags3 & 0x8000))
  assert.ok(shield.terminal.people.slice(6).every(person => person.shield === 0 && !(person.flags3 & 0x8000)))
}
