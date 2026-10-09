import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import setupTemple from './mission3-temple-checkpoint.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { checkpointObservation } from './checkpoint-observer.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'
import {
  assertTempleTrainInput,
  assertTempleFreshRequest,
  assertTempleLifecycle,
} from './temple-training-contract.mjs'

export const templeTrainingBounds = Object.freeze({
  harnessMs: 1500000,
  reservedTailMs: 120000,
  readinessMs: 20000,
  committedMs: 10000,
  loadMs: 15000,
  conversionMs: 45000,
  maxRecordsPerEpoch: 8192,
})
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const clearOwnership = s => !s.record && !s.latch && !s.reservations && !s.dom.present
const idleTemple = s =>
  s.target?.hp > 0 &&
  s.target.progress >= 1 &&
  s.target.builders.every(id => !id) &&
  !s.target.workers.length &&
  !(s.target.admission.activity & (128 | 0x8000)) &&
  !s.target.admission.inside &&
  s.target.admission.occupants.every(id => !id) &&
  !s.target.admission.queueHead &&
  !s.target.admission.queueFrom &&
  !s.target.admission.entering

export function assertTempleTrainingReadiness(r) {
  assert.equal(r.level, 3)
  assert.equal(r.speed, 1)
  assert.equal(r.status, 'playing')
  assert.equal(r.current, true)
  assert.equal(r.paused, false)
  assert.equal(r.inputMask, 0)
  assert.equal(r.unlockedTemple, true)
  assert(!r.overviewStage)
  assert(r.shamanAlive && r.shaman.length === 1)
  assert(r.braves.filter(u => !u.ghost).length >= 5)
  assert.equal(r.preachers.length, 0)
  assert.equal(r.otherActiveSchools.length, 0)
  assert.equal(r.gameFlags & 32, 0)
  assert.equal(r.tribe.playerType, 2)
  assert.equal(r.cost, 3500)
  assert(r.generatedMana >= 62, 'Five idle Braves and one Shaman must meet the source baseline')
  assert.equal(r.target.kind, 'temple')
  assert.equal(r.target.team, 'blue')
  assert.equal(r.target.admission.class, 2)
  assert.equal(r.target.admission.model, 5)
  assert.equal(r.target.admission.tribe, 0)
  assert(idleTemple(r) && clearOwnership(r))
}

// The unchanged public prefix closes its observer before this training-only epoch starts.
export default async function templeTrainingAuto(context) {
  const { page, signal, output, receipt, observeCheckpoint } = context
  const deadline = Date.parse(receipt.startedAt) + templeTrainingBounds.harnessMs
  const prefix = await setupTemple(context)
  assert.equal(prefix.status, 'passed')
  assert.deepEqual(prefix.cleanupErrors, [])
  assert.equal(prefix.terminal.stats.trained, 0)
  assert(
    Date.now() + templeTrainingBounds.reservedTailMs < deadline,
    'Setup left insufficient declared tail budget'
  )
  const report = {
    status: 'running',
    bounds: templeTrainingBounds,
    source: receipt.source,
    setup: {
      file: 'mission3-temple-checkpoint.json',
      sha256: sha(readFileSync(resolve(output, 'mission3-temple-checkpoint.json'))),
      targetId: prefix.plan.id,
      committed: prefix.checkpoint.digest,
    },
    actions: [],
    cleanupErrors: [],
    epochs: null,
  }
  const save = () =>
    writeFileSync(
      resolve(output, 'temple-training-auto.json'),
      JSON.stringify(report, null, 2) + '\n'
    )
  const targetId = prefix.plan.id,
    shamanId = prefix.readiness.after.shaman.id
  const tailDeadline = Math.min(deadline, Date.now() + templeTrainingBounds.reservedTailMs)
  const input = createMission1VaultInput({
    page,
    signal,
    report,
    save,
    originalShamanId: shamanId,
    deadlineAt: tailDeadline,
  })
  let installed = false,
    failed = false,
    failure,
    traineeId,
    baseline
  const admitted = end => {
    signal.throwIfAborted()
    assert(Date.now() < Math.min(end, tailDeadline), 'Declared Temple tail deadline expired')
  }
  const status = async () => {
    const value = await page.evaluate(() => window.templeTraining.status())
    assert.deepEqual(value.errors, [])
    assert.equal(value.overflow, false)
    const s = value.current
    assert(
      s.current &&
        s.level === 3 &&
        s.status === 'playing' &&
        s.speed === 1 &&
        s.shamans.includes(shamanId)
    )
    if (s.target?.admission.activity & 128) {
      assert(s.braves.length >= 5 && !s.otherActiveSchools.length && !(s.gameFlags & 32))
    }
    return value
  }
  const wait = async (label, duration, predicate, sharedDeadline = tailDeadline) => {
    const end = Math.min(tailDeadline, sharedDeadline, Date.now() + duration)
    for (;;) {
      admitted(end)
      const value = await status()
      report.latest = { label, ...value }
      save()
      if (predicate(value)) return value
      await page.waitForTimeout(50)
    }
  }
  const clearSelection = async () => {
    for (let i = 0; i < 3; i++) {
      const s = (await status()).current
      if (!s.selected.length && !s.mode) return
      await input.action('clear-selection', () => page.keyboard.press('Escape'))
    }
    assert.fail('Public Escape did not clear selection/mode')
  }
  try {
    report.initial = await page.evaluate(
      async ({ targetId }) => {
        const { installTempleTrainingRuntime } =
          await import('/scripts/local-render/temple-training-witness.mjs')
        return installTempleTrainingRuntime({ targetId })
      },
      { targetId }
    )
    installed = true
    save()
    // Prefix leaves the public menu open, so Save lookup and all imports are already warm.
    await input.button('Close menu')
    await input.resume()
    await page.mouse.move(20, 975)
    const readinessEnd = Date.now() + templeTrainingBounds.readinessMs
    await wait(
      'crew-departed-and-inspection-retired',
      templeTrainingBounds.readinessMs,
      value => idleTemple(value.current) && clearOwnership(value.current),
      readinessEnd
    )
    await clearSelection()
    await input.button('Select brave')
    await input.view(prefix.plan)
    report.readiness = baseline = await page.evaluate(() => window.templeTraining.readiness())
    save()
    assertTempleTrainingReadiness(baseline)
    assert.equal(baseline.selected.length, 1)
    traineeId = baseline.selected[0]
    assert(baseline.braves.some(u => u.id === traineeId && !u.ghost && u.inside === null))
    // Complete module imports and the current-turn command gate before target preparation.
    await input.prepareDispatch()
    report.hit = await input.entityPoint('buildings', targetId, 8)
    save()
    assert.equal(report.hit.rejection, null)
    await page.evaluate(id => window.templeTraining.armInput(id), traineeId)
    try {
      report.dispatch = await input.dispatch(report.hit, 8, [traineeId])
    } finally {
      report.trainingInput = await page.evaluate(() => window.templeTraining.finishInput())
      save()
    }
    report.recipient = assertTempleTrainInput(report.trainingInput, targetId, traineeId)
    await page.mouse.move(20, 975)
    report.active = await wait(
      'actual-entry-and-four-held-visits',
      templeTrainingBounds.readinessMs,
      value => !!value.firstRequest && value.heldVisits >= 4,
      readinessEnd
    )
    save()
    assertTempleFreshRequest(report.active.firstRequest, targetId, traineeId)
    assert.equal(report.active.current.trained, baseline.trained)
    assert.equal(report.active.current.preachers.length, 0)
    assert(report.active.current.record?.automatic && report.active.current.offTarget)
    report.frame = await page.evaluate(() => window.templeTraining.frame())
    save()
    assert(
      report.frame.panel && report.frame.snapshot.dom.present && !report.frame.snapshot.dom.hidden
    )
    writeFileSync(
      resolve(output, 'temple-training-active-panel.png'),
      Buffer.from(report.frame.panel.split(',')[1], 'base64')
    )
    delete report.frame.panel
    await page.screenshot({ path: resolve(output, 'temple-training-active.png') })
    await input.button('Game settings')
    await page.waitForFunction(() => window.testStore.getWorld().paused)
    report.beforeSave = (await status()).current
    save()
    assert.equal(report.beforeSave.trained, baseline.trained)
    assert(report.beforeSave.target.admission.activity & 128)
    await page.evaluate(() => window.templeTraining.armSave())
    await input.button('Save checkpoint')
    report.saved = await page.evaluate(() => window.templeTraining.saveDigests())
    save()
    assert(report.saved.status.captured && report.saved.status.trusted)
    assert.deepEqual(report.saved.status.errors, [])
    assert.equal(report.saved.status.publication.target.target.activity & 128, 128)
    const saveEnd = Math.min(tailDeadline, Date.now() + templeTrainingBounds.committedMs)
    const matched = await waitForCheckpointReadback(
      async () => {
        admitted(saveEnd)
        report.committed = await page.evaluate(checkpointObservation)
        save()
        return JSON.stringify(report.committed) === JSON.stringify(report.saved.actual)
      },
      {
        pause: async () => {
          admitted(saveEnd)
          await page.waitForTimeout(100)
        },
      }
    )
    assert.equal(matched, true, 'Exact typed public Save must commit')
    report.afterSave = (await status()).current
    save()
    assert.equal(report.afterSave.record.identity, report.beforeSave.record.identity)
    assert(report.afterSave.latch && report.afterSave.reservations === 1)
    report.profileSave = await observeCheckpoint('M3 active Temple training Save')
    save()
    await page.evaluate(() => window.templeTraining.armLoad())
    await input.button('Load checkpoint')
    const loadEnd = Math.min(tailDeadline, Date.now() + templeTrainingBounds.loadMs)
    for (;;) {
      admitted(loadEnd)
      report.load = await page.evaluate(() => window.templeTraining.loadStatus())
      save()
      if (report.load.epochs === 2 && report.load.start?.restored) break
      await page.waitForTimeout(50)
    }
    const conversionEnd = Date.now() + templeTrainingBounds.conversionMs
    await page.mouse.move(20, 975)
    assert.deepEqual(report.load.start.errors, [])
    assert.equal(report.load.start.attached, true)
    assert.equal(report.load.sameSession, true)
    assert.equal(report.load.oldDisposed, true)
    report.loadedDigest = await page.evaluate(() => window.templeTraining.loadDigest())
    save()
    assert.deepEqual(report.loadedDigest, report.saved.expectedLoad)
    assert(report.load.checkpoint.captured && report.load.checkpoint.trusted)
    assert.deepEqual(report.load.checkpoint.errors, [])
    assert.deepEqual(
      report.load.checkpoint.publication.target.tooltipSession,
      report.load.checkpoint.click.target.tooltipSession
    )
    assert.deepEqual(
      report.load.loadInitialSession,
      report.load.checkpoint.publication.target.tooltipSession
    )
    report.restoredActive = await wait(
      'restored-training-visit',
      templeTrainingBounds.readinessMs,
      value => !!value.firstRequest && value.heldVisits >= 4,
      conversionEnd
    )
    save()
    assertTempleFreshRequest(report.restoredActive.firstRequest, targetId, traineeId)
    report.released = await wait(
      'natural-Preacher-and-retirement',
      templeTrainingBounds.conversionMs,
      value =>
        value.current.trained > baseline.trained &&
        idleTemple(value.current) &&
        clearOwnership(value.current),
      conversionEnd
    )
    save()
    await page.screenshot({ path: resolve(output, 'temple-training-released.png') })
    report.finalCommitted = await page.evaluate(checkpointObservation)
    save()
    assert.deepEqual(report.finalCommitted, report.committed)
    assert.deepEqual(receipt.errors, [])
  } catch (error) {
    failed = true
    failure = error
    report.failure = String(error?.stack ?? error)
  } finally {
    if (installed) {
      try {
        report.observation = await page.evaluate(() => window.templeTraining.close())
      } catch (error) {
        report.cleanupErrors.push(String(error))
      }
    }
    save()
  }
  if (!failed) {
    try {
      assert.deepEqual(report.cleanupErrors, [])
      assert.deepEqual(report.observation.cleanupErrors, [])
      assert.equal(report.observation.epochs.length, 2)
      report.epochs = report.observation.epochs.map((epoch, index) =>
        assertTempleLifecycle(epoch, {
          targetId,
          traineeId,
          initialPreachers: baseline.preachers.map(p => p.id),
          initialTrained: baseline.trained,
          complete: index === 1,
        })
      )
      for (const boundary of Object.values(report.observation.boundaries))
        assert.deepEqual(boundary.errors, [])
      report.status = 'passed'
    } catch (error) {
      failed = true
      failure = error
      report.failure = String(error?.stack ?? error)
    }
  }
  if (failed) report.status = 'failed'
  save()
  if (failed) throw failure
  return report
}
