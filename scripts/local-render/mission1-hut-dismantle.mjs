import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { checkpointObservation } from './checkpoint-observer.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'
import { waitForShamanReadiness } from '../browser-game.mjs'
import {
  assertHutResidentReady,
  assertHutDismantleStarted,
  assertHutPartialCheckpoint,
  assertHutDismantleFinished,
} from './mission1-hut-dismantle-contract.mjs'

export const hutDismantleBounds = Object.freeze({
  innerMs: 360000,
  outerMs: 400000,
  killGraceMs: 15000,
  readinessMs: 30000,
  workMs: 120000,
  committedMs: 10000,
  loadMs: 15000,
  cleanupMs: 20000,
  maxEvents: 64,
  attempts: 1,
})

// Run only through the maintained harness, on a newly created task-owned profile.
// The parent binds the fresh profile/output, unused supported port and browser lane.
export default async function ({ page, output, receipt, openMission, observeCheckpoint, signal }) {
  assert.equal(receipt.profile?.mode, 'created', 'One fresh profile; no retry/continuation')
  assert.equal(receipt.profile.checkpointAtStart, null)
  const owner = randomUUID(),
    deadline = Date.parse(receipt.startedAt) + hutDismantleBounds.innerMs,
    report = {
      status: 'running',
      source: receipt.source,
      bounds: hutDismantleBounds,
      actions: [],
      cleanupErrors: [],
      owner,
    },
    save = () =>
      writeFileSync(
        resolve(output, 'mission1-hut-dismantle.json'),
        JSON.stringify(report, null, 2) + '\n'
      )
  let installed = false,
    failure = null
  const admit = (end = deadline) => {
    signal.throwIfAborted()
    assert(Date.now() < Math.min(end, deadline), 'Declared Hut episode deadline expired')
  }
  const options = ms => {
    admit()
    return { timeout: Math.max(1, Math.min(ms, deadline - Date.now())) }
  }
  const runtime = method =>
    page.evaluate(
      ({ owner, method }) => {
        const held = window.mission1HutDismantle
        if (held?.owner !== owner) throw Error('Hut observer ownership changed')
        return held.api[method]()
      },
      { owner, method }
    )
  const status = async () => {
    admit()
    const value = await runtime('status')
    report.latest = value
    save()
    assert.deepEqual(value.errors, [])
    assert.deepEqual(value.current.errors, [])
    assert.equal(value.overflow, false)
    return value
  }
  const wait = async (duration, predicate) => {
    const end = Math.min(deadline, Date.now() + duration)
    for (;;) {
      admit(end)
      const value = await status()
      if (predicate(value)) return value
      await page.waitForTimeout(Math.min(25, Math.max(1, end - Date.now())))
    }
  }
  save()
  try {
    admit()
    await openMission(1)
    report.readiness = await waitForShamanReadiness(page, options(60000))
    const shamanId = report.readiness.after.shaman.id,
      input = createMission1VaultInput({
        page,
        signal,
        report,
        save,
        originalShamanId: shamanId,
        deadlineAt: deadline,
      })
    // Imports and control discovery happen while the public settings menu owns
    // pause, before dismantling can start. No Save is made during prewarming.
    await input.button('Game settings')
    await page.locator('dialog.game-dialog').waitFor({ state: 'visible', ...options(5000) })
    await page.evaluate(async () => {
      await Promise.all([
        import('/scripts/local-render/mission1-hut-dismantle-witness.mjs'),
        import('/scripts/local-render/mission1-hut-dismantle-snapshot.mjs'),
        import('/scripts/local-render/mission1-hut-dismantle-contract.mjs'),
        import('/app/scene.ts'),
        import('/scripts/local-render/temple-training-checkpoint.mjs'),
        import('/scripts/local-render/mission3-building-lifecycle.mjs'),
      ])
      for (const name of ['Save checkpoint', 'Load checkpoint'])
        if (
          ![...document.querySelectorAll('button')].some(
            button => button.textContent.trim() === name
          )
        )
          throw Error(`Public ${name} control missing`)
    })
    await input.button('Close menu')
    await input.resume()
    const readinessEnd = Math.min(deadline, Date.now() + hutDismantleBounds.readinessMs)
    const setupInput = createMission1VaultInput({
      page,
      signal,
      report,
      save,
      originalShamanId: shamanId,
      deadlineAt: readinessEnd,
    })
    let chosen
    while (!chosen) {
      admit(readinessEnd)
      const readiness = await page.evaluate(async () => {
        const { mission1Huts, hutDismantleSnapshot } =
            await import('/scripts/local-render/mission1-hut-dismantle-snapshot.mjs'),
          { assertHutResidentReady } =
            await import('/scripts/local-render/mission1-hut-dismantle-contract.mjs'),
          scene = window.testSceneRef.current,
          world = scene.world,
          rosters = []
        if (world !== window.testStore.getWorld() || !scene.isCurrent())
          throw Error('Current M1 Scene required')
        for (const source of mission1Huts(world)) {
          const target = world.buildings.find(item => item.id === source.id),
            residents = world.units.filter(unit => unit.inside === source.id && unit.hp > 0)
          rosters.push({ ...source, residents: residents.map(unit => unit.id) })
          if (residents.length !== 1) continue
          const ids = { targetId: source.id, workerId: residents[0].id },
            snapshot = hutDismantleSnapshot(world, ids)
          try {
            assertHutResidentReady(snapshot)
          } catch {
            continue
          }
          return { chosen: { ...source, ...ids, x: target.x, z: target.z }, rosters }
        }
        return { chosen: null, rosters }
      })
      report.rosters = readiness.rosters
      save()
      chosen = readiness.chosen
      if (!chosen) await page.waitForTimeout(50)
    }
    report.target = chosen
    save()
    for (let attempts = 0; attempts < 3; attempts++) {
      const clear = await page.evaluate(
        () => !window.testStore.getWorld().selected.length && !window.testStore.getWorld().mode
      )
      if (clear) break
      await setupInput.action('clear-selection', () => page.keyboard.press('Escape'))
    }
    await setupInput.view(chosen)
    report.hit = await setupInput.entityPoint('buildings', chosen.targetId, null)
    save()
    assert.equal(report.hit.rejection, null)
    admit(readinessEnd)
    await page.evaluate(
      async ({ owner, chosen, maxEvents }) => {
        if (window.mission1HutDismantle) throw Error('Foreign Hut observer present')
        const { installHutDismantleRuntime } =
            await import('/scripts/local-render/mission1-hut-dismantle-witness.mjs'),
          { GameScene } = await import('/app/scene.ts'),
          api = installHutDismantleRuntime({
            scene: window.testSceneRef.current,
            store: window.testStore,
            ids: { targetId: chosen.targetId, workerId: chosen.workerId },
            prototype: GameScene.prototype,
            sceneRef: () => window.testSceneRef,
            maxEvents,
          })
        window.mission1HutDismantle = { owner, api }
      },
      { owner, chosen, maxEvents: hutDismantleBounds.maxEvents }
    )
    installed = true
    await page.mouse.move(20, 20)
    await page.mouse.move(report.hit.x, report.hit.y)
    const dismantle = page.getByRole('button', { name: 'Dismantle hut', exact: true })
    admit(readinessEnd)
    await dismantle.waitFor({
      state: 'visible',
      ...options(Math.max(1, readinessEnd - Date.now())),
    })
    report.beforeInput = await runtime('snapshot')
    assertHutResidentReady(report.beforeInput)
    await runtime('armInput')
    await setupInput.action('Dismantle hut', () =>
      dismantle.click(options(Math.min(5000, readinessEnd - Date.now())))
    )
    report.input = await runtime('input')
    save()
    assertHutDismantleStarted(
      report.input.before,
      report.input.after,
      report.input.sameResidentPerson
    )
    const baseline = report.input.before
    await page.mouse.move(20, 20)
    await wait(hutDismantleBounds.workMs, value => value.current.current.remaining < 300)
    await input.pause()
    report.partial = await runtime('snapshot')
    save()
    await page.screenshot({ path: resolve(output, 'hut-partial-work.png'), ...options(5000) })
    report.partialScreenshot = 'hut-partial-work.png'
    save()
    assertHutPartialCheckpoint(baseline, report.partial)
    await input.button('Game settings')
    await runtime('armSave')
    await input.button('Save checkpoint')
    report.saved = await runtime('saved')
    save()
    assert.equal(report.saved.status.captured, true)
    assert.equal(report.saved.status.trusted, true)
    assert.deepEqual(report.saved.status.errors, [])
    assertHutPartialCheckpoint(baseline, report.saved.status.publication.target)
    const committedEnd = Math.min(deadline, Date.now() + hutDismantleBounds.committedMs)
    const committed = await waitForCheckpointReadback(
      async () => {
        admit(committedEnd)
        report.committed = await page.evaluate(checkpointObservation)
        save()
        return JSON.stringify(report.committed) === JSON.stringify(report.saved.actual)
      },
      {
        pause: async () => {
          admit(committedEnd)
          await page.waitForTimeout(100)
        },
      }
    )
    assert.equal(committed, true, 'Full typed public Save must commit')
    report.profileSave = await observeCheckpoint('M1 partial Hut dismantle Save')
    save()
    await runtime('armLoad')
    await input.button('Load checkpoint')
    const loaded = await wait(
      hutDismantleBounds.loadMs,
      value => value.epochs === 2 && value.start?.attached
    )
    assert.deepEqual(loaded.start.errors, [])
    assert.equal(loaded.start.restored, true)
    assert.equal(loaded.oldDisposed, true)
    report.loaded = await runtime('loaded')
    save()
    assert.equal(report.loaded.status.captured, true)
    assert.equal(report.loaded.status.trusted, true)
    assert.deepEqual(report.loaded.status.errors, [])
    assertHutPartialCheckpoint(baseline, report.loaded.status.publication.target)
    assert.deepEqual(report.loaded.digest, report.saved.expectedLoad)
    for (const key of ['turn', 'target', 'worker', 'targetOrders', 'timber'])
      assert.deepEqual(
        report.loaded.initial[key],
        report.loaded.status.publication.target[key],
        `pre-RAF Load ${key}`
      )
    await page.mouse.move(20, 20)
    await wait(
      hutDismantleBounds.workMs,
      value => !value.current.current.targetPresent && !value.current.current.entry
    )
    await wait(hutDismantleBounds.cleanupMs, value => {
      const s = value.current.current
      return !s.panel && !s.record && !s.latch && !s.hovered && !s.menuOpen && !s.reservations
    })
    report.finished = await runtime('finish')
    report.final = report.finished.final
    save()
    await page.screenshot({ path: resolve(output, 'hut-terminal.png'), ...options(5000) })
    report.terminalScreenshot = 'hut-terminal.png'
    save()
    report.recovery = assertHutDismantleFinished(baseline, report.final)
    assert.deepEqual(receipt.errors, [])
    report.status = 'passed'
  } catch (error) {
    failure = error
    report.status = 'failed'
    report.error = String(error?.stack ?? error)
  } finally {
    if (!report.terminalScreenshot)
      try {
        await page.screenshot({ path: resolve(output, 'hut-terminal-failure.png'), timeout: 5000 })
        report.terminalScreenshot = 'hut-terminal-failure.png'
      } catch (error) {
        report.cleanupErrors.push(String(error))
      }
    if (installed)
      try {
        report.observation = await page.evaluate(owner => {
          const held = window.mission1HutDismantle
          if (held?.owner !== owner) throw Error('Foreign Hut observer preserved during cleanup')
          try {
            return held.api.close()
          } finally {
            delete window.mission1HutDismantle
          }
        }, owner)
        report.cleanupErrors.push(...report.observation.errors)
        if (report.observation.overflow) report.cleanupErrors.push('Meaningful-event overflow')
        for (const epoch of report.observation.epochs ?? [])
          if (
            epoch.visits.last - epoch.visits.initial !== epoch.visits.count ||
            (epoch.visits.count && epoch.visits.first !== epoch.visits.initial + 1)
          )
            report.cleanupErrors.push('Noncontiguous fixed-turn epoch')
      } catch (error) {
        report.cleanupErrors.push(String(error))
      }
    if (report.cleanupErrors.length) report.status = 'failed'
    save()
  }
  if (failure) throw failure
  assert.deepEqual(report.cleanupErrors, [])
  return report
}
