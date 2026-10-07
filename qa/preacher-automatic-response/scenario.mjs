import assert from 'node:assert/strict'
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { acquirePreacher } from '../preacher-gesture-candidate/acquire.mjs'
import { installReplacementObservation, replacementIdentity } from '../preacher-gesture-candidate/load-boundary.mjs'
import { installNativeGuardObserver } from '../preacher-gesture-baseline/inherited/observer.mjs'
import { readQueuedPreservingStop } from '../erosion-ordinary/stop.mjs'
import { bindGame, readShamanReadiness } from '../../scripts/browser-game.mjs'
import { waitForCheckpointReadback } from '../../scripts/checkpoint-readback.mjs'
import { requireResponseCheckpoint, requireSameCheckpoint } from './checkpoint.mjs'
import { clearForwardDefender } from './forward-defender.mjs'
import loadDiagnostics, { requireContinuation } from './load-diagnostics.mjs'
import { chooseCrossing, confirmCrossing } from './crossing-input.mjs'
import { createHash } from 'node:crypto'
import { sourceCorrespondence } from '../erosion-ordinary/runtime.mjs'
import { scannerModulePins, bindScannerCallsites } from './observe.mjs'

// Same read-only scriptParsed/getScriptSource protocol as erosion/runtime.mjs,
// narrowed to the actual response scanner and its three callers. No debugger pause.
export async function captureScannerBinding(page, root, origin, check) {
  const session = await page.context().newCDPSession(page), parsed = new Map()
  const hash = value => createHash('sha256').update(value).digest('hex')
  const record = event => {
    let url
    try { url = new URL(event.url) } catch { return }
    const path = url.pathname.slice(1)
    if (url.origin !== origin || !(path in scannerModulePins)) return
    const events = parsed.get(path) ?? []
    if (!events.some(v => v.scriptId === event.scriptId) && events.length < 2) events.push(event)
    parsed.set(path, events)
  }
  session.on('Debugger.scriptParsed', record)
  try {
    await session.send('Debugger.enable')
    const modules = {}, contexts = []
    for (const [path, expected] of Object.entries(scannerModulePins)) {
      check(); const events = parsed.get(path) ?? []
      assert.equal(events.length, 1, 'One actually parsed module: ' + path)
      const event = events[0], { scriptSource } = await session.send('Debugger.getScriptSource', { scriptId: event.scriptId })
      check(); const original = readFileSync(resolve(root, path), 'utf8')
      assert.equal(hash(original), expected)
      const correspondence = sourceCorrespondence(scriptSource, original, event.sourceMapURL)
      contexts.push(event.executionContextId)
      modules[path] = { url: event.url, scriptId: event.scriptId, executionContextId: event.executionContextId,
        sourceSha256: hash(original), servedSha256: hash(scriptSource), servedBody: scriptSource,
        sourceMapURL: event.sourceMapURL, correspondence }
    }
    assert.equal(new Set(contexts).size, 1)
    return { modules, bindings: bindScannerCallsites(modules) }
  } finally { session.off('Debugger.scriptParsed', record); await session.detach() }
}

export function requireScannerRestoration(result) {
  requireCleanup({ observer: result })
  assert.ok(result && !result.notInstalled && result.callbacks > 0, 'Observed scanner descriptor must be restored before Save')
}

export function verifyCommittedSave(before, committed, provenance) {
  assert.ok(committed && provenance?.checkpoint, 'Independent committed Save readback is required')
  assert.deepEqual(committed.response, before)
  const keys = ['version', 'level', 'turn', 'time', 'checkpointSha256', 'actorsSha256', 'terrainSha256', 'stockSha256']
  for (const key of keys) {
    assert.notEqual(committed.digest?.[key], undefined, key)
    assert.deepEqual(provenance.checkpoint[key], committed.digest[key], key)
  }
  return structuredClone(provenance.checkpoint)
}

export function requireCleanup(value) {
  assert.ok(value && !value.error, value?.error ?? 'Missing cleanup')
  for (const result of [value.observer, value.pointer, value.inputRead]) if (result) {
    assert.deepEqual(result.errors, []); assert.equal(result.restored, true)
  }
  assert.deepEqual(value.tail?.errors ?? [], [])
}

// Paused preparation is camera/picking only. Actual dispatch remains unpaused.
export function requirePausedResponse(row, id, before) {
  assert.equal(row.paused, true); assert.equal(row.level, 3); assert.equal(row.status, 'playing')
  assert.equal(row.speed, 1); assert.equal(row.visibility, 'visible'); assert.equal(row.inputMask, 0)
  assert.equal(row.mode, null); assert.deepEqual(row.selected, [id])
  const unit = row.units.find(u => u.id === id), p = unit?.native
  assert.ok(p && Number.isInteger(unit.nativeIdentity) && unit.nativeIdentity > 0 && unit.nativeIdentity === unit.sourceIdentity)
  assert.equal(unit.kind, 'preacher'); assert.equal(unit.team, 'blue'); assert.equal(unit.inside, null)
  assert.ok(unit.hp > 0 && p.life === Math.round(unit.hp * 20)); assert.equal(p.registered, true)
  assert.equal(p.class, 1); assert.equal(p.model, 4); assert.equal(p.tribe, 0)
  assert.equal(p.state, 10); assert.equal(p.commandStatus, 32)
  assert.equal(unit.order?.model, 32); assert.equal(unit.order.flags, 32); assert.equal(unit.order.references, 1)
  assert.equal(p.immediateCommand, unit.order.id)
  assert.equal(p.orders.find(q => q.id === p.commands[p.commandCursor])?.record?.model, 3)
  if (before) {
    for (const key of ['turn', 'time', 'epoch', 'sceneIdentity', 'worldIdentity']) assert.equal(row[key], before[key], key)
    const old = before.units.find(u => u.id === id)
    for (const key of ['nativeIdentity', 'sourceIdentity', 'hp', 'x', 'z']) assert.equal(unit[key], old[key], key)
    assert.deepEqual([p.commands, p.commandCursor, unit.order], [old.native.commands, old.native.commandCursor, old.order])
  }
  return unit
}

export function requireInterruptionEpoch(progress, completed) {
  assert.equal(progress.captureOnly, true)
  assert.ok(Number.isInteger(completed.observedRows) && completed.observedRows >= 0 &&
    completed.observedRows <= progress.totalRows, 'Actual inputAfter observation boundary required')
  assert.deepEqual(progress.captureViolations.filter(v => v.index < completed.observedRows), [],
    'Pre-input ownership/scene/clock violation remains fatal')
  return { completed, postInputViolations: progress.captureViolations.filter(v => v.index >= completed.observedRows) }
}

export function requireInterruptedResponse(input, id, prepared) {
  const before = input.inputBefore.automaticResponse, after = input.inputAfter.automaticResponse
  assert.ok(before && after, 'Synchronous response snapshots are required')
  assert.ok(prepared?.paused && prepared.order?.model === 32, 'Paused restored32 binding required')
  const requirePreparedOrder = row => {
    assert.ok(row.sameWorld && row.sameActor && row.nativeOnly && row.registeredOwner && !row.busy)
    assert.equal(row.actor.id, prepared.actor.id); assert.equal(row.person.id, prepared.person.id)
    assert.equal(row.person.commandStatus, 32); assert.equal(row.person.immediateCommand, prepared.order.id)
    assert.deepEqual(row.order, prepared.order, 'The actual32 must be the exact paused prepared record/payload')
    assert.deepEqual([row.person.commandCursor, row.commands, row.queued],
      [prepared.person.commandCursor, prepared.commands, prepared.queued], 'Prepared queued ownership changed')
  }
  requirePreparedOrder(prepared); requirePreparedOrder(before)
  const turns = before.turn - prepared.turn, interval = input.inputBefore.automaticResponseInterval
  assert.ok(Number.isInteger(turns) && turns >= 0 && turns <= 360, 'Bounded Resume-to-input interval required')
  assert.ok(Array.isArray(interval)); assert.equal(interval.length, turns * 2, 'Complete passive interval required')
  for (let offset = 0; offset < interval.length; offset += 2) {
    const a = interval[offset], b = interval[offset + 1], turn = prepared.turn + offset / 2
    assert.equal(a.phase, 'beforeTurn'); assert.equal(a.turn, turn)
    assert.equal(b.phase, 'afterTurn'); assert.equal(b.turn, turn + 1)
    requirePreparedOrder(a); requirePreparedOrder(b)
  }
  for (const row of [before, after]) {
    assert.ok(row.sameWorld && row.sameActor && row.nativeOnly && row.registeredOwner && !row.busy)
    assert.equal(row.actor.id, id); assert.ok(row.actor.hp > 0 && row.person.life === Math.round(row.actor.hp * 20))
  }
  assert.equal(before.order?.model, 32); assert.equal(before.person.commandStatus, 32)
  assert.equal(before.person.immediateCommand, before.order.id)
  assert.equal(after.order?.model, 3); assert.equal(after.person.immediateCommand, 0)
  const old = input.inputBefore.units.find(u => u.id === id), current = input.inputAfter.units.find(u => u.id === id)
  assert.ok(Number.isInteger(old.nativeIdentity) && old.nativeIdentity > 0)
  assert.equal(current.nativeIdentity, old.nativeIdentity)
  const released = after.retiredOrders.find(q => q.id === before.order.id && q.identity === before.order.identity)
  assert.ok(released, 'Exact old32 record must be observed after the input handler')
  assert.equal(released.references, 0); assert.deepEqual(after.listeners, [])
  assert.ok(Number.isInteger(after.observationIndex) && after.observationIndex >= 0)
  assert.equal(before.observationIndex, after.observationIndex, 'No passive turn/render row inside the synchronous handler')
  return { scope: 'synchronous-existing-pointer-handler', observedRows: after.observationIndex, beforeTurn: before.turn, afterTurn: after.turn,
    nativeIdentity: current.nativeIdentity, released, listeners: after.listeners, currentOrder: after.order }
}

// Compose the existing synchronous input read with the existing passive response
// read. No controller hook or game command is added. Restore the exact descriptor.
export function installInputResponseRead(prepared) {
  if (window.preacherInputRead) throw Error('Response input read already installed')
  const descriptor = Object.getOwnPropertyDescriptor(window, 'nativeGuardReadInput')
  const original = descriptor?.value, observer = window.preacherResponse, read = observer?.read
  if (typeof original !== 'function' || typeof read !== 'function' || !Array.isArray(observer?.tracker?.rows))
    throw Error('Owned input/response readers required')
  if (!prepared?.paused || !Number.isInteger(prepared.turn)) throw Error('Paused response binding required')
  let calls = 0
  const wrapper = function (...args) {
    const input = Reflect.apply(original, this, args)
    if (Object.hasOwn(input, 'automaticResponse')) throw Error('Response field already owned')
    calls++
    const response = read('input-boundary')
    const interval = observer.tracker.rows.filter(row =>
      row.phase === 'beforeTurn' ? row.turn >= prepared.turn && row.turn < response.turn :
        row.phase === 'afterTurn' && row.turn > prepared.turn && row.turn <= response.turn)
    if (interval.length > 720) throw Error('Resume-to-input phase-row cap exceeded')
    return { ...input, automaticResponse: response, automaticResponseInterval: interval.map(row => ({
      phase: row.phase, turn: row.turn, sameWorld: row.sameWorld, sameActor: row.sameActor,
      nativeOnly: row.nativeOnly, registeredOwner: row.registeredOwner, busy: row.busy,
      actor: { id: row.actor?.id }, person: row.person && { id: row.person.id,
        commandStatus: row.person.commandStatus, immediateCommand: row.person.immediateCommand,
        commandCursor: row.person.commandCursor }, order: row.order, commands: row.commands, queued: row.queued })) }
  }
  Object.defineProperty(window, 'nativeGuardReadInput', { ...descriptor, value: wrapper })
  window.preacherInputRead = { finish() {
    if (window.nativeGuardReadInput !== wrapper) throw Error('Input reader ownership changed')
    Object.defineProperty(window, 'nativeGuardReadInput', descriptor)
    const restored = window.nativeGuardReadInput === original
    delete window.preacherInputRead
    return { restored, calls, errors: [] }
  } }
  return { installed: true }
}

export default async function responseScenario(context) {
  if (process.env.PND_RESPONSE_PHASE === 'load-diagnostics') return loadDiagnostics(context)
  const savedEntry = process.env.PND_RESPONSE_PHASE === 'saved-response'
  const loadedPrefix = process.env.PND_RESPONSE_PHASE === 'crossing' ? await loadDiagnostics(context) : null
  const { page, root, url, output, receipt, signal, observeCheckpoint } = context
  const baseline = process.env.PND_RESPONSE_SIDE === 'baseline', started = performance.now()
  assert.ok(['baseline', 'candidate'].includes(process.env.PND_RESPONSE_SIDE))
  if (loadedPrefix) assert.equal(loadedPrefix.side, baseline ? 'baseline' : 'candidate')
  const prospective = !!loadedPrefix && !baseline
  assert.equal(receipt.profile?.mode, loadedPrefix || savedEntry ? 'reused' : 'created')
  if (!loadedPrefix && !savedEntry) assert.equal(receipt.profile.checkpointAtStart, null)
  const commands = resolve(output, 'commands'); if (!loadedPrefix) mkdirSync(commands)
  const report = { side: process.env.PND_RESPONSE_SIDE, savedEntry, status: 'running', loadedPrefix, stages: [], failures: [], events: [], screenshots: [],
    scope: savedEntry ? 'Genuine saved32 Load and interruption tail; prior qualified entry and lifecycle are carried from the reviewed failed prefix.' :
      'Ordinary automatic32 reachability and owned queue lifecycle; original component proof and pixels are separate.',
    qualificationMode: savedEntry ? 'saved32 interruption tail - prior entry and lifecycle carried' : prospective ? 'first qualifying automatic32; every earlier episode retained' : 'first automatic32' }
  let acquisition, progress, saved, restored, savedPins, id, originalFinished = false, activeStage, primaryFailure, stopped = false, epoch = 'original'
  let latestVerifiedCheckpoint = receipt.profile.checkpointAtStart
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
    if (batch.scannerRestoration) {
      report.scannerRestorations ??= {}; report.scannerRestorations[epoch] = batch.scannerRestoration
    }
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
  const finishObserver = async completed => {
    const result = await page.evaluate(() => ({ observer: window.preacherResponse?.finish(), tail: window.preacherResponse?.drain() }))
    retain(result.tail); requireCleanup(result); originalFinished = true
    if (completed) report.interruptionInterval = requireInterruptionEpoch(progress, completed)
    writeFileSync(resolve(output, epoch + '-observer-restoration.json'), JSON.stringify(result.observer, null, 2) + '\n'); persist()
    assert.notEqual(progress?.status, 'failed', progress?.reason); return result
  }
  const saveCheckpoint = async (name, require32) => {
    if (prospective && require32) {
      const scanner = await page.evaluate(() => window.preacherResponse.scannerStatus())
      requireScannerRestoration(scanner); report.scannerRestorations ??= {}; report.scannerRestorations[epoch] = scanner
      writeFileSync(resolve(output, epoch + '-scanner-restoration.json'), JSON.stringify(scanner, null, 2) + '\n'); persist()
    }
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
    latestVerifiedCheckpoint = verifyCommittedSave(before, committed, provenance)
    report.latestVerifiedSave = { name, checkpoint: latestVerifiedCheckpoint, provenance }; persist()
    await shot(name); await page.getByRole('button', { name: /^Continue Game/ }).click(); check()
    return { ...committed, before, provenance }
  }
  try {
    if (savedEntry) {
      savedPins = JSON.parse(readFileSync(resolve(root, 'qa/preacher-automatic-response/saved-response-inputs.json')))
      requireContinuation(receipt.profile, savedPins)
      const readPinned = entry => {
        const bytes = readFileSync(resolve(root, entry.path))
        assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256)
        return JSON.parse(bytes)
      }
      const previous = readPinned(savedPins.response), priorReceipt = readPinned(savedPins.receipt)
      assert.equal(priorReceipt.status, 'failed'); assert.equal(priorReceipt.profile.runId, savedPins.priorRunId)
      saved = previous.saved; requireResponseCheckpoint(saved.response)
      verifyCommittedSave(saved.before, saved, saved.provenance)
      assert.deepEqual(savedPins.originalActors, previous.loadedPrefix.originalActors)
      readPinned({ path: savedPins.originalAcquisition.receipt, sha256: savedPins.originalAcquisition.sha256 })
      readPinned({ path: savedPins.originalAcquisition.firstAdmission, sha256: savedPins.originalAcquisition.firstAdmissionSha256 })
      assert.deepEqual(saved.digest, savedPins.checkpoint)
      assert.deepEqual(previous.latestVerifiedSave.checkpoint, savedPins.checkpoint)
      assert.deepEqual(priorReceipt.profile.checkpointAtEnd, savedPins.checkpoint)
      id = savedPins.originalActors.preacherId
      assert.equal(saved.response.actor.id, id)
      report.savedPrefix = { source: savedPins.previousSourceCommit, runId: savedPins.priorRunId,
        status: priorReceipt.status, checkpoint: savedPins.checkpoint, originalAcquisition: savedPins.originalAcquisition }
      persist()
    } else {
    begin(loadedPrefix ? 'bind-genuinely-loaded-acquisition' : 'ordinary-acquisition-and-safe17', loadedPrefix ? 20000 : 360000)
    if (loadedPrefix) await button('Resume game')
    acquisition = await acquirePreacher({ ...context, signal: { throwIfAborted: check }, loadedAcquisition: loadedPrefix ? {
      ids: loadedPrefix.originalActors, originalAcquisition: loadedPrefix.originalAcquisition,
      boundaryActorId: loadedPrefix.boundary.response.actor.id,
      checkpointSha256: loadedPrefix.committedAfter.checkpoint.checkpointSha256 } : null })
    id = acquisition.preacherId
    if (!loadedPrefix) {
    const initial = await acquisition.dispatch.clickOrder(acquisition.safe)
    assert.equal(initial.inputAfter.units.find(u => u.id === id).order.model, 3)
    await poll(async () => {
      const row = await acquisition.read(), u = row.units.find(v => v.id === id)
      acquisition.health(row)
      if (u.order?.model !== 17 || u.native?.commandStatus !== 17 || u.native.substate !== 2) return false
      acquisition.finishAcquisition({ turn: row.turn, person: u.native }); return true
    })
    }
    end({ id, templeId: acquisition.templeId, traineeId: acquisition.traineeId })
    if (!loadedPrefix) {
      begin('ordinary-acquisition-checkpoint', 15000)
      report.acquisitionCheckpoint = await saveCheckpoint('acquired-checkpoint', false); end({ committed: true })
    }

    begin('forward-defender-and-first-automatic32', 180000)
    report.forwardDefender = await clearForwardDefender({ page, acquisition, check }); persist()
    await acquisition.select('preacher')
    if (loadedPrefix || !baseline) {
      report.crossingPlan = await chooseCrossing(page, id); check(); persist()
      assert.ok(report.crossingPlan.chosen, 'No coherent actual Brave has a bounded clear crossing')
    }
    const destination = report.crossingPlan ? report.crossingPlan.chosen.destination : { x: -39, z: -110 }
    await acquisition.ordinary.map(destination)
    const hit = await acquisition.ground(destination); assert.ok(hit, 'Declared approach ground is unavailable')
    if (report.crossingPlan) { report.crossingConfirmed = await confirmCrossing(page, report.crossingPlan, hit); check(); persist() }
    const scanner = prospective ? await captureScannerBinding(page, root, new URL(url).origin, check) : null
    if (scanner) {
      writeFileSync(resolve(output, 'scanner-source-binding.json'), JSON.stringify(scanner, null, 2) + '\n')
      report.scannerBindings = scanner.bindings; persist()
    }
    await page.evaluate(async ({ id, baseline, prospective, scannerBindings }) => {
      const { installResponseObservation } = await import('/qa/preacher-automatic-response/observe.mjs')
      return installResponseObservation({ id, baseline, prospective, scannerBindings })
    }, { id, baseline, prospective, scannerBindings: scanner?.bindings ?? null })
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
    end({ ...(prospective ? { firstQualifiedResponseTurn: progress.firstResponse.after.turn,
      qualifiedEpisode: progress.qualifiedEpisode, firstObservedResponseTurn: progress.firstObservedResponse.after.turn }
      : { firstResponseTurn: progress.firstResponse.after.turn }), startup: progress.startup.person })

    begin('ordinary32-save-and-natural-release', 120000)
    await button('Pause game')
    const paused = await page.evaluate(() => window.preacherResponse.read('ordinary-pause'))
    assert.equal(paused.order?.model, 32, '32 expired before actual Pause; preserve failed assertion')
    saved = await saveCheckpoint('active32-checkpoint', true)
    await poll(async () => { await drain(); return progress.status === 'released' })
    assert.ok(progress.listenerIds.length); assert.ok(progress.startup); assert.ok(progress.rendered.length)
    report.originalProgress = progress
    await finishObserver(); end({ releasedTurn: progress.released.after.turn })

    }
    begin('fresh-page-Load-exact32-boundary', 90000)
    if (!savedEntry) await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.getByRole('dialog', { name: 'Start game', exact: true }).waitFor({ timeout: 30000 })
    const empty = await page.evaluate(() => ({ response: typeof window.preacherResponse, scene: typeof window.testSceneRef }))
    assert.deepEqual(empty, { response: 'undefined', scene: 'undefined' })
    await page.evaluate(installReplacementObservation); await button('Load Game')
    // Observe normal auto-resume, then Pause before digest/binding/picking work.
    // The replacement observer already owns the synchronous saved-state clone.
    const autoResumed = await page.evaluate(() => {
      const w = window.campaignReplacement.store.getWorld()
      return { turn: w.turn, paused: w.paused }
    })
    assert.equal(autoResumed.paused, false)
    await button('Pause game')
    const pausedLoad = await page.evaluate(() => {
      const w = window.campaignReplacement.store.getWorld()
      return { turn: w.turn, paused: w.paused }
    })
    assert.equal(pausedLoad.paused, true)
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
    const readiness = await readShamanReadiness(page)
    assert.equal(readiness.level, 3); assert.equal(readiness.inputMask, 0)
    assert.equal(readiness.shaman?.canOrder, true); assert.equal(readiness.shaman?.selectable, true)
    // ready is correctly false while paused; never relabel that observation.
    assert.equal(readiness.ready, false)
    if (!savedEntry) {
      await page.evaluate(installNativeGuardObserver)
      await page.evaluate(async () => {
        window.nativeGuardProbes = await import('/qa/preacher-gesture-baseline/inherited/browser-probes.mjs')
        window.nativeGuardCandidateGround = await import('/qa/preacher-gesture-candidate/ground-input.mjs')
      })
    }
    if (savedEntry) acquisition = await acquirePreacher({ ...context, signal: { throwIfAborted: check },
      loadedAcquisition: { ids: savedPins.originalActors, boundaryActorId: id,
        checkpointSha256: savedPins.checkpoint.checkpointSha256, originalAcquisition: savedPins.originalAcquisition },
      pausedLoaded: true })
    const firstBound = await acquisition.read(); requirePausedResponse(firstBound, id)
    restored = { boundary, identity, autoResumed, pausedLoad, firstBoundTurn: firstBound.turn, readiness, empty }
    end({ savedTurn: saved.response.turn, firstBoundTurn: firstBound.turn })

    begin('loaded32-ordinary-movement-interruption', 30000)
    epoch = 'loaded'; originalFinished = false
    await page.evaluate(async id => {
      const { installResponseObservation } = await import('/qa/preacher-automatic-response/observe.mjs')
      return installResponseObservation({ id, loaded: true, captureOnly: true })
    }, id)
    // Save retains the exact selected Preacher. Do not use additive roster
    // selection or spend the restored32 lifetime on a new focus/selection cycle.
    const state = await acquisition.read(), unit = requirePausedResponse(state, id)
    const retreat = { x: unit.x + 6, z: unit.z + 2 }
    // The normal centered hit(817,412) is covered by the paused badge. Keep one
    // fixed camera offset; the inherited5x5 probe still proves actual canvas ownership.
    const camera = { x: retreat.x + 24, z: retreat.z }
    await acquisition.ordinary.map(camera); check()
    requirePausedResponse(await acquisition.read(), id, state)
    const target = await acquisition.ground(retreat, null, 2)
    report.interruptionPreparation = { before: state, retreat, camera, target,
      after: await acquisition.read(), scope: 'Ordinary paused camera and owned-canvas picking only' }
    requirePausedResponse(report.interruptionPreparation.after, id, state); persist()
    assert.ok(target, 'Paused offset view has no legal owned ground interior; retain no-hit diagnostics')
    report.interruptionPreparation.response = await page.evaluate(() => window.preacherResponse.read('paused-interruption-prepared'))
    assert.equal(report.interruptionPreparation.response.paused, true); persist()
    await page.evaluate(installInputResponseRead, report.interruptionPreparation.response)
    let inputFailure
    try {
      await button('Resume game')
      report.interruption = await acquisition.dispatch.clickOrder(target)
      report.interruption.released = requireInterruptedResponse(report.interruption, id, report.interruptionPreparation.response)
    } catch (error) { inputFailure = error; throw error }
    finally {
      try {
        report.interruptionReadCleanup = await page.evaluate(() => window.preacherInputRead?.finish())
        assert.ok(report.interruptionReadCleanup)
        requireCleanup({ pointer: report.interruptionReadCleanup }); persist()
      } catch (error) {
        throw inputFailure ? new AggregateError([inputFailure, error], 'Input and read-restoration failures') : error
      }
    }
    // This later ordinary state may already contain automatic re-engagement.
    // It is retained separately and cannot overwrite the synchronous release.
    report.interruption.later = await page.evaluate(() => window.preacherResponse.read('after-input-host-return'))
    await finishObserver(report.interruption.released)
    await button('Pause game'); await shot('after-loaded32-interruption'); end({ accepted: true })
    report.status = 'passed'; persist()
  } catch (error) {
    primaryFailure = error; report.failures.push(String(error?.stack ?? error))
    if (report.status !== 'baseline-omission-observed') report.status = 'failed'
    persist()
  } finally {
    try {
      const cleanup = await page.evaluate(finished => {
        const inputRead = window.preacherInputRead?.finish()
        const pointer = window.campaignEntityPointer?.finish(); delete window.campaignEntityPointer
        delete window.preacherCrossingPin
        const observer = !finished ? window.preacherResponse?.finish() : undefined
        const tail = window.preacherResponse?.drain()
        window.campaignReplacement?.dispose?.()
        return { pointer, observer, tail, inputRead }
      }, originalFinished)
      retain(cleanup.tail); requireCleanup(cleanup)
      if (loadedPrefix || savedEntry) {
        report.committedAfterCrossing = await observeCheckpoint(report.latestVerifiedSave ?
          'After ordinary candidate - latest verified Save' : savedEntry ?
            'After saved32 interruption - no Save' : 'After ordinary crossing - no Save')
        assert.deepEqual(report.committedAfterCrossing.checkpoint, latestVerifiedCheckpoint)
      }
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
