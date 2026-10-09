import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, waitForShamanReadiness } from '../browser-game.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { readCommittedCheckpoint } from './checkpoint-observer.mjs'
import { installHutResidentWitness, readHutResidentRoster, readResidentCommitted,
  installResidentCheckpointBoundary, installResidentPanelSelection, installResidentSelectionClear,
  installOutsideBraveSelection } from './hut-resident-witness.mjs'

export const hutResidentExitPoint = Object.freeze({ x: -11, z: 39 })

export function assertResidentCommitted(committed, saved) {
  assert.equal(committed?.version, 1)
  assert.deepEqual(committed.summary, saved.summary)
}

export function assertOutsideBraveReady(state) {
  assert.ok(state.worldMatches && state.actorMatches)
  assert.equal(state.unit?.id, 13); assert.equal(state.unit?.kind, 'brave'); assert.equal(state.unit?.team, 'blue')
  assert.ok(state.unit.hp > 0); assert.equal(state.unit.inside, null)
  assert.deepEqual(state.selected, []); assert.equal(state.mode, null); assert.equal(state.inputMask, 0)
  assert.equal(state.paused, false); assert.ok(!state.overview && !state.overviewStage && !state.dragActive)
}

export function assertOutsideBraveSelection(evidence) {
  assert.deepEqual(evidence.errors, []); assert.equal(evidence.closed, true)
  assert.equal(evidence.delivered.restored, true); assert.deepEqual(evidence.delivered.errors, [])
  assert.deepEqual(evidence.events.map(event => event.type), ['pointerdown', 'pointerup'])
  for (const event of evidence.events) {
    assertOutsideBraveReady(event.before)
    assert.ok(event.trusted && event.targetMatches && event.canvasOwned && event.modifiers.every(value => !value))
    assert.equal(event.button, 0); assert.equal(event.x, evidence.point.x); assert.equal(event.y, evidence.point.y)
    assert.ok(event.after.worldMatches && event.after.actorMatches)
    assert.equal(event.after.turn, event.before.turn)
    assert.equal(event.after.lastOrderTurn, event.before.lastOrderTurn)
    assert.equal(event.after.randomState, event.before.randomState)
    assert.deepEqual(event.after.orders, event.before.orders)
    assert.equal(event.after.unit.work, event.before.unit.work); assert.equal(event.after.unit.inside, null)
    assert.equal(event.after.down.unit, 13); assert.equal(event.after.down.extend, false)
    assert.equal(event.after.dragActive, false)
    const delivered = evidence.delivered.events.find(row => row.type === event.type)
    assert.ok(delivered?.picks.some(pick => pick.id === 13 && pick.name === (event.type === 'pointerdown' ? 'pickUnit' : 'pickPerson')))
    assert.ok(delivered.picks.every(pick => pick.receiverMatches && !pick.threw))
  }
  assert.deepEqual(evidence.events[0].after.selected, [])
  assert.deepEqual(evidence.events[1].after.selected, [13])
}

export function assertPassiveResident(state, unitId, hutId) {
  assert.ok(state.correspondence && state.activeAbsent && state.animationAbsent)
  assert.equal(state.unit.id, unitId); assert.equal(state.unit.inside, hutId)
  assert.ok(state.unit.hp > 0); assert.equal(state.building.id, hutId)
  assert.equal(state.resident.person.id, unitId); assert.equal(state.resident.person.class, 1)
  assert.equal(state.resident.person.immediateCommand, 0)
  assert.ok(state.resident.person.commands.every(id => id === 0))
  assert.equal(state.registered, false)
}

export function assertResidentDeparture(evidence, unitId, hutId) {
  assert.deepEqual(evidence.errors, [])
  assert.equal(evidence.departures.length, 1)
  const boundary = evidence.departures[0]
  for (const key of ['receiverMatches', 'samePerson', 'slotCleared', 'unitStillInside', 'returnMatches', 'registeredSame'])
    assert.equal(boundary[key], true, `Mode1 insertion ${key}`)
  assert.equal(boundary.key, unitId)
  assert.equal(boundary.before.unit.inside, hutId)
  assert.equal(evidence.latest.unit.inside, null)
  assert.equal(evidence.latest.resident, undefined)
  assert.ok(!evidence.latest.building.slots.includes(unitId))
  assert.ok(evidence.moves.some(move => move.label === 'final-departure' && move.done))
}

// Preserve even primitive primary failures when observation/persistence also fails.
export async function finishResidentHandles(handles, report, save, primary, retainFrames = () => {}) {
  let failed = primary.failed, failure = primary.failure
  const retain = error => { report.status = 'failed'; if (!failed) { failed = true; failure = error; report.failure = String(error?.stack ?? error) } }
  for (const [label, handle] of handles) if (handle) {
    try { report[label] = await handle.evaluate(api => api.close()); retainFrames(report[label], label)
      assert.equal(report[label].closed, true); assert.deepEqual(report[label].errors ?? [], []) }
    catch (error) { (report.cleanupErrors ??= []).push({ label, error: String(error) }); retain(error) }
    finally { try { await handle.dispose() } catch (error) { (report.cleanupErrors ??= []).push({ label, error: String(error) }); retain(error) } }
  }
  try { save() } catch (error) { retain(error) }
  if (failed) throw failure
}

export default async function hutResident({ page, output, receipt, openMission, observeCheckpoint, signal }) {
  const deadlineAt = Date.now() + 300000
  const report = { status: 'running', declaration: { mission: 1, hutObject: 42, hutAnchor: [64512, 54784],
    exitPoint: hutResidentExitPoint, unitId: 13, maxSeconds: 300,
    route: 'Select original outside Brave13 once, enter fixed Hut37, public Save/Load, final departure; no retries.' },
    actions: [], epochs: [], preparations: [], errors: [],
    limits: 'New resident identity is proved at synchronous ownership/slot boundaries. PNGs show natural visible entry/occupancy/exit only. No post-handler movement identity, legacy-save recovery, Swarm or original GPU/clock equivalence.' }
  let witness, checkpoint, failed = false, failure, input, unitId, hutId
  const save = () => writeFileSync(resolve(output, 'hut-resident.json'), JSON.stringify(report, null, 2) + '\n')
  const retainFrames = (epoch, prefix) => {
    if (!epoch?.frames) return
    for (const [name, frame] of Object.entries(epoch.frames)) {
      const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(frame.png)
      assert.ok(match, 'Natural renderer PNG required')
      const path = `${prefix}-${name}.png`
      writeFileSync(resolve(output, path), Buffer.from(match[1], 'base64')); frame.png = path
    }
  }
  const remaining = maximum => {
    signal.throwIfAborted(); const time = deadlineAt - Date.now()
    assert.ok(time > 0, 'Resident episode admission deadline exhausted')
    return Math.min(maximum, time)
  }
  const read = async () => {
    report.latest = await witness.evaluate(api => api.read()); save()
    assert.deepEqual(report.latest.errors, [])
    return report.latest
  }
  const wait = async predicate => {
    await page.waitForFunction(({ api, predicate }) => {
      const value = api.read()
      if (value.errors.length) throw new Error(value.errors.join('\n'))
      return predicate === 'move' ? value.moveDone
        : predicate === 'resident' ? !!value.admission && !!value.frames.entry && !!value.frames.resident
          : !!value.frames.departure
    }, { api: witness, predicate }, { timeout: remaining(45000), polling: 50 })
    return read()
  }
  const persistEpoch = async () => {
    const epoch = await witness.evaluate(api => api.close())
    report.epochs.push(epoch); save()
    retainFrames(epoch, `resident-${report.epochs.length}`)
    save(); await witness.dispose(); witness = null
    assert.deepEqual(epoch.errors, []); assert.equal(epoch.closed, true)
    return epoch
  }
  const clearSelection = async () => {
    let clear, primaryClear = { failed: false }
    const clearing = { kind: 'clear-selection' }; report.actions.push(clearing)
    try {
      clear = await page.evaluateHandle(installResidentSelectionClear)
      await input.action('Escape clears prior selection', () => page.keyboard.press('Escape'))
    } catch (error) { primaryClear = { failed: true, failure: error } }
    await finishResidentHandles([['selectionClear', clear]], clearing, save, primaryClear)
    const cleared = clearing.selectionClear
    assert.ok(cleared.event?.trusted && cleared.event.worldMatches)
    assert.equal(cleared.event.key, 'Escape'); assert.ok(cleared.event.modifiers.every(value => !value))
    assert.equal(cleared.event.blockedTarget, false); assert.equal(cleared.event.inputMask, 0)
    assert.deepEqual(cleared.event.after.selected, []); assert.equal(cleared.event.after.mode, null)
    assert.equal(cleared.event.after.orderCursor, 0)
    assert.equal(cleared.event.after.lastOrderTurn, cleared.before.lastOrderTurn)
  }
  const selectResident = async () => {
    await clearSelection()
    await input.view(report.roster.hut)
    const hit = await input.entityPoint('buildings', hutId, null)
    report.preparations.push({ kind: 'panel-hover', hit }); save()
    assert.equal(hit.rejection, null)
    await input.action('hover-fixed-Hut-panel', () => page.mouse.move(hit.x, hit.y))
    const locator = page.locator(`.training-panel:not([hidden]) button[data-person="${unitId}"]`)
    await locator.waitFor({ state: 'visible', timeout: remaining(12000) })
    let panel, primary = { failed: false }
    const entry = { kind: 'resident-selection', unitId, hutId }; report.actions.push(entry)
    try {
      panel = await page.evaluateHandle(installResidentPanelSelection, { hutId, unitId })
      await input.action('select-physical-Hut-resident', () => locator.click({ timeout: remaining(12000) }))
    } catch (error) { primary = { failed: true, failure: error } }
    await finishResidentHandles([['selection', panel]], entry, save, primary)
    assert.deepEqual(entry.selection.event.selected, [unitId])
    assert.equal(entry.selection.event.inside, hutId)
    for (const key of ['trusted', 'targetMatches', 'worldMatches']) assert.equal(entry.selection.event[key], true)
  }
  const move = async (label, exactDeparture) => {
    await input.prepareDispatch()
    const hit = await input.fixedGround(hutResidentExitPoint)
    report.preparations.push({ kind: label, hit }); save()
    assert.equal(hit.rejection, null)
    await witness.evaluate((api, spec) => api.armMove(spec.label, spec.exactDeparture), { label, exactDeparture })
    report.actions.push({ label, delivered: await input.dispatch(hit, 3, [unitId]) }); save()
    await wait('move')
  }
  save()
  try {
    assert.ok(receipt.profile && receipt.profile.mode === 'created' && receipt.profile.checkpointAtStart === null)
    page.setDefaultTimeout(30000)
    await openMission(1)
    report.readiness = await waitForShamanReadiness(page, { timeout: remaining(30000) })
    report.roster = await page.evaluate(readHutResidentRoster); save()
    const roster = report.roster
    assert.equal(roster.level, 1); assert.equal(roster.inputMask, 0); assert.equal(roster.speed, 1)
    assert.equal(roster.status, 'playing'); assert.equal(roster.paused, false); assert.equal(roster.sceneMatches, true)
    assert.equal(roster.shamanId, 30); assert.equal(roster.hut?.id, 37)
    assert.ok(roster.hut?.hp > 0 && roster.hut.progress === 1)
    assert.ok(roster.hut.admission.inside < roster.hut.capacity && roster.hut.admission.occupants.includes(0))
    const original = roster.braves.find(unit => unit.id === 13)
    assert.ok(original && original.kind === 'brave' && original.team === 'blue' && original.hp > 0)
    assert.equal(original.inside, null)
    hutId = roster.hut.id; unitId = 13
    input = createMission1VaultInput({ page, signal, report, save, originalShamanId: roster.shamanId, deadlineAt })
    await clearSelection(); await input.view(original)
    const selectionPoint = await input.entityPoint('units', unitId, null)
    report.preparations.push({ kind: 'outside-Brave-selection', hit: selectionPoint }); save()
    assert.equal(selectionPoint.rejection, null)
    let selection, selectionFailure = { failed: false }
    try {
      selection = await page.evaluateHandle(installOutsideBraveSelection, { unitId, point: selectionPoint })
      report.outsideSelection = await selection.evaluate(api => api.read()); save()
      assertOutsideBraveReady(report.outsideSelection.initial)
      await input.action('Select original outside Brave13', () => page.mouse.click(selectionPoint.x, selectionPoint.y))
    } catch (error) { selectionFailure = { failed: true, failure: error } }
    await finishResidentHandles([['outsideSelection', selection]], report, save, selectionFailure)
    assertOutsideBraveSelection(report.outsideSelection)
    witness = await page.evaluateHandle(installHutResidentWitness, { hutId, unitId, deadlineAt })
    await input.view(roster.hut)
    report.entryPreflight = await witness.evaluate(api => api.armEntry()); save()
    assert.equal(report.entryPreflight.unit.inside, null)
    assert.ok(report.entryPreflight.building.inside < report.entryPreflight.building.capacity)
    assert.ok(report.entryPreflight.building.slots.includes(0))
    report.entryInput = await input.clickEntity('buildings', hutId, 8, false, [unitId]); save()
    const admitted = await wait('resident')
    const beforeEntry = admitted.entryInput
    assert.ok(beforeEntry.trusted && beforeEntry.canvasTarget && beforeEntry.button === 0)
    assert.deepEqual(beforeEntry.before.selected, [unitId]); assert.equal(beforeEntry.before.unit.inside, null)
    assert.ok(beforeEntry.before.building.inside < beforeEntry.before.building.capacity)
    assert.ok(beforeEntry.before.building.slots.includes(0))
    assert.equal(beforeEntry.after.order.model, 8); assert.equal(beforeEntry.after.order.a, hutId)
    assert.equal(beforeEntry.after.order.references, 1); assert.equal(admitted.admission.entryOrderReferences, 0)
    assert.equal(admitted.admission.samePerson, true)
    assertPassiveResident(admitted.latest, unitId, hutId)
    await input.pause(); await input.button('Game settings')
    checkpoint = await page.evaluateHandle(installResidentCheckpointBoundary, { kind: 'save' })
    await input.button('Save checkpoint')
    report.saved = await checkpoint.evaluate(api => api.read()); save()
    assert.deepEqual(report.saved.errors, []); assert.equal(report.saved.admitted, true)
    assertPassiveResident(report.saved.summary, unitId, hutId)
    const committedDeadline = Date.now() + remaining(15000)
    for (;;) {
      report.committed = await page.evaluate(readResidentCommitted); save()
      if (report.committed?.version === 1 && JSON.stringify(report.committed.summary) === JSON.stringify(report.saved.summary)) break
      assert.ok(Date.now() < committedDeadline, 'Public Save did not commit the exact resident')
      await page.waitForTimeout(100)
    }
    assertResidentCommitted(report.committed, report.saved)
    report.savedDigest = await observeCheckpoint('Passive Hut resident committed Save'); save()
    assert.match(report.savedDigest.checkpoint.checkpointSha256, /^[a-f0-9]{64}$/)
    report.saveCleanup = await checkpoint.evaluate(api => api.close()); await checkpoint.dispose(); checkpoint = null
    assert.deepEqual(report.saveCleanup.errors, [])
    checkpoint = await page.evaluateHandle(installResidentCheckpointBoundary, { kind: 'load' })
    await persistEpoch()
    // No host read or persistence between the adjacent public Load/Pause controls.
    await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click({ timeout: remaining(15000) })
    await page.getByRole('button', { name: 'Pause game', exact: true }).click({ timeout: remaining(15000) })
    report.loaded = await checkpoint.evaluate(api => api.read()); save()
    assert.deepEqual(report.loaded.errors, []); assert.equal(report.loaded.admitted, true)
    assert.deepEqual(report.loaded.summary, report.committed.summary)
    report.loadCleanup = await checkpoint.evaluate(api => api.close()); await checkpoint.dispose(); checkpoint = null
    assert.deepEqual(report.loadCleanup.errors, [])
    await bindGame(page)
    witness = await page.evaluateHandle(installHutResidentWitness, { hutId, unitId, deadlineAt })
    assertPassiveResident((await read()).latest, unitId, hutId)
    await input.resume(); await selectResident(); await move('final-departure', true); await wait('departure')
    const departed = await persistEpoch(); assertResidentDeparture(departed, unitId, hutId)
    report.finalCheckpoint = await readCommittedCheckpoint(page)
    assert.equal(report.finalCheckpoint.checkpointSha256, report.savedDigest.checkpoint.checkpointSha256)
    assert.deepEqual(receipt.errors, [])
    report.status = 'observed-pending-pixel-review'; save()
  } catch (error) { failed = true; failure = error; report.status = 'failed'; report.failure = String(error?.stack ?? error) }
  finally {
    await finishResidentHandles([['checkpointCleanup', checkpoint], ['witnessCleanup', witness]], report, save, { failed, failure }, retainFrames)
  }
  return report
}
