import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { bindGame } from '../../scripts/browser-game.mjs'
import { installReplacementObservation, replacementIdentity } from '../preacher-gesture-candidate/load-boundary.mjs'
import { readQueuedPreservingStop } from '../erosion-ordinary/stop.mjs'

export function requireContinuation(profile, pins) {
  assert.equal(profile.mode, 'reused'); assert.equal(profile.id, pins.profileId)
  assert.equal(profile.inputs.application, pins.application)
  assert.equal(profile.previousRun.runId, pins.priorRunId)
  assert.equal(profile.previousRun.receiptSha256, pins.previousReceiptSha256)
  assert.equal(profile.previousRun.sourceFingerprint, pins.previousSourceFingerprint)
  assert.equal(profile.previousRun.sourceCommit, pins.previousSourceCommit)
  assert.equal(profile.previousRun.checker, pins.previousChecker)
  assert.equal(profile.previousRun.cleanupVerified, true); assert.equal(profile.previousRun.continuationVerified, true)
  assert.deepEqual(profile.checkpointAtStart, pins.checkpoint)
  assert.deepEqual(profile.previousRun.checkpointAtEnd, pins.checkpoint)
}

// Continuation of this same driver: genuine Load→Pause only. No route is chosen
// until these actual current candidate records have been independently inspected.
export default async function loadDiagnostics({ page, root, output, receipt, signal, observeCheckpoint }) {
  const pins = JSON.parse(readFileSync(resolve(root, 'qa/preacher-automatic-response/continuation-inputs.json')))
  requireContinuation(receipt.profile, pins)
  const sha = p => createHash('sha256').update(readFileSync(resolve(root, p))).digest('hex')
  assert.equal(sha(pins.previousReceipt), pins.previousReceiptSha256)
  assert.equal(sha(pins.originalAcquisition.receipt), pins.originalAcquisition.sha256)
  assert.equal(sha(pins.originalAcquisition.firstAdmission), pins.originalAcquisition.firstAdmissionSha256)
  const started = performance.now(), commands = resolve(output, 'commands'); mkdirSync(commands)
  const report = { status: 'running', phase: 'load-diagnostics', originalAcquisition: pins.originalAcquisition,
    originalActors: pins.originalActors,
    prefixSourceCommit: pins.originalAcquisition.sourceCommit ?? pins.previousSourceCommit,
    prefixRunId: pins.originalAcquisition.runId ?? pins.priorRunId, failures: [],
    scope: 'Ordinary Load3336 then Pause and read-only current geometry. No new movement, Save, automatic-response or conversion claim.' }
  const save = () => writeFileSync(resolve(output, 'load-diagnostics.json'), JSON.stringify({ ...report,
    source: receipt.source, elapsedMs: performance.now() - started }, null, 2) + '\n')
  const check = () => {
    signal.throwIfAborted(); assert.ok(performance.now() - started < pins.caps.scenarioMs, '90-second Load diagnostic bound')
    assert.deepEqual(receipt.errors, [])
    const stop = readQueuedPreservingStop(commands, 1, receipt.profile.runId, { includeOrdinary: true })
    if (!stop) return
    writeFileSync(resolve(output, 'stop-command.json'), stop.bytes)
    const exact = stop.valid && JSON.parse(stop.bytes)[0]?.runId === receipt.profile.runId
    report.stop = { exact, sha256: stop.sha256, saveIssued: false }
    throw Error(exact ? 'Requested preserving stop during Load diagnostics' : 'Unexpected control; stop without executing it')
  }
  let failure
  try {
    save(); check(); await page.evaluate(installReplacementObservation); check()
    await page.getByRole('dialog', { name: 'Start game', exact: true }).getByRole('button', { name: 'Load Game', exact: true }).click(); check()
    report.boundary = await page.evaluate(async id => {
      const { readLoadedResponse } = await import('/qa/preacher-automatic-response/checkpoint.mjs')
      return readLoadedResponse(id)
    }, pins.originalActors.preacherId); check()
    // Full committed-record digest is verified before and after Load. This exact
    // replacement comparison additionally binds the genuine acquired native owner.
    assert.deepEqual(JSON.parse(JSON.stringify(report.boundary.response)), pins.savedResponse)
    for (const key of ['version', 'level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256'])
      assert.deepEqual(report.boundary.digest[key], pins.checkpoint[key], key)
    await bindGame(page); check()
    report.identity = await page.evaluate(replacementIdentity); check()
    assert.ok(report.identity.sameStore && report.identity.newWorld && report.identity.newScene && report.identity.currentCorrespondence)
    assert.equal(report.identity.error, null)
    report.firstBound = await page.evaluate(() => ({ turn: window.testStore.getWorld().turn, paused: window.testStore.getWorld().paused })); check()
    assert.equal(report.firstBound.paused, false, 'Record actual Load auto-resume separately')
    await page.getByRole('button', { name: 'Pause game', exact: true }).click(); check()
    report.diagnostics = await page.evaluate(async ids => {
      const { readResponsePeople } = await import('/qa/preacher-automatic-response/diagnostics.mjs')
      const { unitAnimationSource } = await import('/app/model.ts')
      const scene = window.testSceneRef.current, w = scene.world, actor = w.units.find(u => u.id === ids.preacherId)
      const shaman = w.units.find(u => u.id === ids.shamanId), temple = w.buildings.find(b => b.id === ids.templeId)
      if (w !== window.testStore.getWorld() || !w.paused || w.outcome.level !== 3 || !actor?.native ||
        unitAnimationSource(actor) !== actor.native || w.objectCells.objects.get(actor.id) !== actor.native ||
        actor.team !== 'blue' || actor.kind !== 'preacher' || actor.hp <= 0 || !shaman || shaman.hp <= 0 ||
        shaman.team !== 'blue' || shaman.kind !== 'shaman' || !temple || temple.team !== 'blue' || temple.progress !== 1)
        throw Error('Paused loaded acquisition identity changed')
      return { turn: w.turn, time: w.time, paused: w.paused, speed: w.speed, status: w.status,
        effectiveScanCounter: w.turn & 255, retainedPersonCounter: actor.native.counter,
        inputMask: w.inputMask, mode: w.mode, selected: [...w.selected],
        source: { id: actor.id, hp: actor.hp, x: actor.x, z: actor.z },
        shaman: { id: shaman.id, hp: shaman.hp, x: shaman.x, z: shaman.z }, templeId: temple.id,
        rng: [w.randomState, w.cosmeticRandom.randomState], people: readResponsePeople(w, actor.native, { all: true }),
        renderer: { canvas: [scene.renderer.domElement.width, scene.renderer.domElement.height],
          contextLost: scene.renderer.getContext().isContextLost() } }
    }, pins.originalActors); check()
    assert.equal(report.diagnostics.status, 'playing'); assert.equal(report.diagnostics.speed, 1)
    assert.ok(report.diagnostics.turn >= pins.checkpoint.turn)
    await page.screenshot({ path: resolve(output, 'loaded3336-paused.png'), timeout: 5000 }); check()
    report.committedAfter = await observeCheckpoint('After ordinary Load and Pause - no Save'); check()
    assert.deepEqual(report.committedAfter.checkpoint, pins.checkpoint)
    report.status = 'passed'; save()
  } catch (error) { failure = error; report.status = 'failed'; report.failures.push(String(error?.stack ?? error)); save() }
  finally {
    try { await page.evaluate(() => window.campaignReplacement?.dispose?.()) }
    catch (error) { report.status = 'failed'; report.failures.push(String(error?.stack ?? error)); failure = failure ? new AggregateError([failure, error], 'Load diagnostics and cleanup failed') : error }
    save()
  }
  if (failure) throw failure
  return report
}
