import assert from 'node:assert/strict'
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { acquirePreacher } from '../preacher-gesture-candidate/acquire.mjs'
import { installReplacementObservation, replacementIdentity } from '../preacher-gesture-candidate/load-boundary.mjs'
import { installNativeGuardObserver } from '../preacher-gesture-baseline/inherited/observer.mjs'
import { readQueuedPreservingStop } from '../erosion-ordinary/stop.mjs'
import { bindGame, readShamanReadiness } from '../../scripts/browser-game.mjs'
import { waitForCheckpointReadback } from '../../scripts/checkpoint-readback.mjs'
import { requireResponseCheckpoint, requireSameCheckpoint } from './checkpoint.mjs'

export function requireCleanup(value) {
  assert.ok(value && !value.error, value?.error ?? 'Missing cleanup')
  for (const result of [value.observer, value.pointer]) if (result) {
    assert.deepEqual(result.errors, []); assert.equal(result.restored, true)
  }
  assert.deepEqual(value.tail?.errors ?? [], [])
}

export default async function responseScenario(context) {
  const { page, output, receipt, signal, observeCheckpoint } = context
  const baseline = process.env.PND_RESPONSE_SIDE === 'baseline', started = performance.now()
  assert.ok(['baseline', 'candidate'].includes(process.env.PND_RESPONSE_SIDE))
  assert.equal(receipt.profile?.mode, 'created'); assert.equal(receipt.profile.checkpointAtStart, null)
  const commands = resolve(output, 'commands'); mkdirSync(commands)
  const report = { side: process.env.PND_RESPONSE_SIDE, status: 'running', stages: [], failures: [], events: [], screenshots: [],
    scope: 'Ordinary automatic32 reachability and owned queue lifecycle; original component proof and pixels are separate.' }
  let acquisition, progress, saved, restored, originalFinished = false, activeStage, primaryFailure, stopped = false, epoch = 'original'
  const persist = () => writeFileSync(resolve(output, 'response.json'), JSON.stringify({ ...report,
    source: receipt.source, elapsedMs: performance.now() - started, activeStage, progress, saved, restored }, null, 2) + '\n')
  const check = () => {
    signal.throwIfAborted(); assert.deepEqual(receipt.errors, []); assert.equal(stopped, false)
    if (activeStage) assert.ok(performance.now() - activeStage.started < activeStage.capMs, activeStage.name + ' wall ceiling')
    const stop = readQueuedPreservingStop(commands, 1, receipt.profile.runId, { includeOrdinary: true })
    if (!stop) return
    stopped = true; writeFileSync(resolve(output, 'stop-command.json'), stop.bytes)
    const exact = stop.valid && JSON.parse(stop.bytes)[0]?.runId === receipt.profile.runId
    report.stop = { valid: !!exact, sha256: stop.sha256, latestCheckpointPreserved: true }
    throw Error(exact ? 'Requested preserving stop; no new Save issued' : 'Malformed/unexpected control; stopping without execution')
  }
  const begin = (name, capMs) => { activeStage = { name, started: performance.now(), capMs }; persist() }
  const end = detail => { check(); report.stages.push({ ...activeStage, elapsedMs: performance.now() - activeStage.started, ...detail }); activeStage = null; persist() }
  const retain = batch => {
    if (!batch) return
    for (const row of batch.rows) appendFileSync(resolve(output, epoch + '-phases.jsonl'), JSON.stringify(row) + '\n')
    progress = batch.progress; report.events.push(...batch.events)
  }
  const drain = async () => {
    check(); const batch = await page.evaluate(() => window.preacherResponse.drain()); retain(batch); persist()
    assert.deepEqual(batch.errors, []); assert.notEqual(progress.status, 'failed', progress.reason); check()
  }
  const poll = async predicate => {
    for (;;) { check(); if (await predicate()) { check(); return }; await page.waitForTimeout(100) }
  }
  const button = async name => { check(); await page.getByRole('button', { name, exact: true }).click(); check() }
  const shot = async name => {
    assert.ok(report.screenshots.length < 6); check()
    const observed = await page.evaluate(() => window.preacherResponse?.read('screenshot-before') ?? null)
    if (observed) assert.equal(observed.paused, true)
    await page.screenshot({ path: resolve(output, name + '.png'), timeout: 5000 })
    const after = await page.evaluate(() => window.preacherResponse?.read('screenshot-after') ?? null)
    if (observed) { assert.equal(after.turn, observed.turn); assert.equal(after.paused, true) }
    report.screenshots.push({ path: name + '.png', observed, after, label: 'Actual ordinary paused screenshot, not the earlier response instant' }); check()
  }
  const finishObserver = async () => {
    const result = await page.evaluate(() => ({ observer: window.preacherResponse?.finish(), tail: window.preacherResponse?.drain() }))
    retain(result.tail); requireCleanup(result); originalFinished = true; persist()
    assert.notEqual(progress?.status, 'failed', progress?.reason); return result
  }
  const saveCheckpoint = async (name, require32) => {
    await button('Game settings')
    const before = await page.evaluate(async id => {
      const { responseProjection } = await import('/qa/preacher-automatic-response/checkpoint.mjs')
      return responseProjection({ version: 1, world: window.testStore.getWorld() }, id)
    }, acquisition.preacherId)
    assert.equal(before.paused, true); if (require32) requireResponseCheckpoint(before)
    await button('Save checkpoint')
    let committed
    assert.equal(await waitForCheckpointReadback(async () => {
      check(); committed = await page.evaluate(async id => {
        const { readStoredResponse } = await import('/qa/preacher-automatic-response/checkpoint.mjs')
        return readStoredResponse(id)
      }, acquisition.preacherId); check()
      if (!committed || committed.response.turn !== before.turn) return false
      assert.deepEqual(committed.response, before); return true
    }, { attempts: 100 }), true)
    const provenance = await observeCheckpoint(name)
    assert.equal(provenance.checkpoint.checkpointSha256, committed.digest.checkpointSha256)
    await shot(name); await page.getByRole('button', { name: /^Continue Game/ }).click(); check()
    return { ...committed, before, provenance }
  }
  try {
    begin('ordinary-acquisition-and-safe17', 360000)
    acquisition = await acquirePreacher({ ...context, signal: { throwIfAborted: check } })
    const id = acquisition.preacherId
    const initial = await acquisition.dispatch.clickOrder(acquisition.safe)
    assert.equal(initial.inputAfter.units.find(u => u.id === id).order.model, 3)
    await poll(async () => {
      const row = await acquisition.read(), u = row.units.find(v => v.id === id)
      acquisition.health(row)
      if (u.order?.model !== 17 || u.native?.commandStatus !== 17 || u.native.substate !== 2) return false
      acquisition.finishAcquisition({ turn: row.turn, person: u.native }); return true
    })
    end({ id, templeId: acquisition.templeId, traineeId: acquisition.traineeId })
    begin('ordinary-acquisition-checkpoint', 15000)
    report.acquisitionCheckpoint = await saveCheckpoint('acquired-checkpoint', false); end({ committed: true })

    begin('moving-approach-and-first-automatic32', 180000)
    await acquisition.select('preacher')
    await acquisition.ordinary.map({ x: -39, z: -110 })
    const hit = await acquisition.ground({ x: -39, z: -110 }); assert.ok(hit, 'Declared approach ground is unavailable')
    await page.evaluate(async ({ id, baseline }) => {
      const { installResponseObservation } = await import('/qa/preacher-automatic-response/observe.mjs')
      return installResponseObservation({ id, baseline })
    }, { id, baseline })
    report.approach = await acquisition.dispatch.clickOrder(hit)
    const accepted = report.approach.inputAfter.units.find(v => v.id === id)
    assert.equal(accepted.order.model, 3); assert.equal(accepted.native.immediateCommand, 0)
    await poll(async () => { await drain(); return baseline ? progress.status === 'baseline-omission' : !!progress.startup })
    if (baseline) {
      end({ outcome: 'qualified-ordinary-omission', beforeTurn: progress.encounter.beforeTurn, afterTurn: progress.encounter.afterTurn })
      await button('Pause game'); await shot('baseline-qualified-omission')
      report.status = 'baseline-omission-observed'; await finishObserver(); persist()
      // Positive behavior acceptance stays failed, while the diagnostic result is retained.
      throw Error('Qualified ordinary automatic-response visit retained; immediate32 is absent on baseline')
    }
    end({ firstResponseTurn: progress.firstResponse.after.turn, startup: progress.startup.person })

    begin('ordinary32-save-and-natural-release', 120000)
    await button('Pause game')
    const paused = await page.evaluate(() => window.preacherResponse.read('ordinary-pause'))
    assert.equal(paused.order?.model, 32, '32 expired before actual Pause; preserve failed assertion')
    saved = await saveCheckpoint('active32-checkpoint', true)
    await poll(async () => { await drain(); return progress.status === 'released' })
    assert.ok(progress.listenerIds.length); assert.ok(progress.startup); assert.ok(progress.rendered.length)
    report.originalProgress = progress
    await finishObserver(); end({ releasedTurn: progress.released.after.turn })

    begin('fresh-page-Load-exact32-boundary', 90000)
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.getByRole('dialog', { name: 'Start game', exact: true }).waitFor({ timeout: 30000 })
    const empty = await page.evaluate(() => ({ response: typeof window.preacherResponse, scene: typeof window.testSceneRef }))
    assert.deepEqual(empty, { response: 'undefined', scene: 'undefined' })
    await page.evaluate(installReplacementObservation); await button('Load Game')
    const boundary = await page.evaluate(async id => {
      const { readLoadedResponse } = await import('/qa/preacher-automatic-response/checkpoint.mjs')
      return readLoadedResponse(id)
    }, id)
    requireSameCheckpoint(saved.response, boundary.response)
    for (const key of ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256'])
      assert.deepEqual(boundary.digest[key], saved.digest[key], key)
    await bindGame(page)
    const identity = await page.evaluate(replacementIdentity)
    assert.ok(identity.sameStore && identity.newWorld && identity.newScene && identity.currentCorrespondence)
    assert.equal(identity.error, null)
    let readiness
    await poll(async () => { readiness = await readShamanReadiness(page); return readiness.ready === true })
    assert.equal(readiness.level, 3)
    await page.evaluate(installNativeGuardObserver)
    await page.evaluate(async () => {
      window.nativeGuardProbes = await import('/qa/preacher-gesture-baseline/inherited/browser-probes.mjs')
      window.nativeGuardCandidateGround = await import('/qa/preacher-gesture-candidate/ground-input.mjs')
    })
    const firstBound = await acquisition.read(); assert.equal(firstBound.paused, false)
    restored = { boundary, identity, firstBoundTurn: firstBound.turn, readiness, empty }
    end({ savedTurn: saved.response.turn, firstBoundTurn: firstBound.turn })

    begin('loaded32-ordinary-movement-interruption', 30000)
    epoch = 'loaded'; originalFinished = false
    await page.evaluate(async id => {
      const { installResponseObservation } = await import('/qa/preacher-automatic-response/observe.mjs')
      return installResponseObservation({ id, loaded: true, captureOnly: true })
    }, id)
    await acquisition.select('preacher')
    const state = await acquisition.read(), unit = state.units.find(v => v.id === id)
    assert.equal(unit.order?.model, 32, 'Restored32 expired before interruption')
    // Camera first, then fresh ordinary ground/context/recipient validation.
    const retreat = { x: unit.x + 6, z: unit.z + 2 }
    await acquisition.ordinary.map(retreat)
    const target = await acquisition.ground(retreat, null, 2); assert.ok(target)
    report.interruption = await acquisition.dispatch.clickOrder(target)
    const inputBefore = report.interruption.inputBefore.units.find(v => v.id === id)
    const inputAfter = report.interruption.inputAfter.units.find(v => v.id === id)
    assert.equal(inputBefore.order?.model, 32, 'Actual input handler no longer interrupts32')
    assert.equal(inputAfter.order?.model, 3); assert.equal(inputAfter.native.immediateCommand, 0)
    assert.equal(inputAfter.nativeIdentity, inputBefore.nativeIdentity)
    await finishObserver()
    const released = await page.evaluate(({ id, old }) => {
      const w = window.testStore.getWorld(), u = w.units.find(v => v.id === id)
      return { references: w.buildingOrders.records[old].references,
        registered: w.objectCells.objects.get(id) === u.native,
        listeners: w.units.filter(v => v.native?.state === 23 && v.native.workTarget === id).map(v => v.id) }
    }, { id, old: inputBefore.order.id })
    assert.equal(released.references, 0); assert.equal(released.registered, true); assert.deepEqual(released.listeners, [])
    report.interruption.released = released
    await button('Pause game'); await shot('loaded32-interrupted-with-move3'); end({ accepted: true })
    report.status = 'passed'; persist()
  } catch (error) {
    primaryFailure = error; report.failures.push(String(error?.stack ?? error))
    if (report.status !== 'baseline-omission-observed') report.status = 'failed'
    persist()
  } finally {
    try {
      const cleanup = await page.evaluate(finished => {
        const pointer = window.campaignEntityPointer?.finish(); delete window.campaignEntityPointer
        const observer = !finished ? window.preacherResponse?.finish() : undefined
        const tail = window.preacherResponse?.drain()
        window.campaignReplacement?.dispose?.()
        return { pointer, observer, tail }
      }, originalFinished)
      retain(cleanup.tail); requireCleanup(cleanup)
      writeFileSync(resolve(output, 'observer-cleanup.json'), JSON.stringify(cleanup, null, 2) + '\n')
    } catch (error) {
      report.failures.push(String(error?.stack ?? error)); report.status = 'failed'
      primaryFailure = primaryFailure ? new AggregateError([primaryFailure, error], 'Assertion and cleanup failures') : error
    }
    persist()
  }
  if (primaryFailure) throw primaryFailure
  return report
}
