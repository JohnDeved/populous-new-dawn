import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import templeTrainingAuto from './temple-training-auto.mjs'
import { checkpointObservation } from './checkpoint-observer.mjs'

export const templeContinuationSource = Object.freeze({
  output: 'work/orchestration/temple-training-ordinary-01',
  receiptSha256: 'b5dc24256876106e133197051980083ad4c2423f1988cde4b8afe62e94466513',
  prefixSha256: 'e41e75ff6c487caab69b2453e8c7704261bb685f73c2a26a8ea0131890f2f484',
  trainingSha256: '5fe2a858f1e7321df36577b1c9a7361a02de2470baf1737e16215ce5fe6e2f2c',
  profileId: '40098e9e-ba78-423c-b5b2-56cb71ec92a5',
  priorRunId: '3d339e9a-b802-40af-b2a8-3758bb876be1',
  sourceFingerprint: '4da74033b435626e43135ed01f2135dda41b28d2a3fc082f5b3dc9f638866553',
  application: '03f74a0bd90f58c94e8bc03044d5f9795f441dae0bc1f4c201e08fbb98df6115',
  checker: 'b9d702e2b1d494a16faa8c7a8ab52b3e4260e841dbc072c14ce8486d96de5069',
  checkpointSha256: 'fe4188c37a1d5667d18019e945da2b3dae5b8f3a45d9141ce8f349118c3d1141',
  origin: 'http://127.0.0.1:4193',
})
export const templeContinuationBounds = Object.freeze({ harnessMs: 240000, loadMs: 15000 })

export function readTempleContinuation(root, receipt) {
  const read = (file, expected) => {
    const bytes = readFileSync(resolve(root, templeContinuationSource.output, file))
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      expected,
      'Prior ordinary evidence changed'
    )
    return JSON.parse(bytes)
  }
  const prior = read('receipt.json', templeContinuationSource.receiptSha256)
  const prefix = read('mission3-temple-checkpoint.json', templeContinuationSource.prefixSha256)
  const training = read('temple-training-auto.json', templeContinuationSource.trainingSha256)
  assert.equal(prior.status, 'failed')
  assert.deepEqual(prior.errors, [])
  assert.equal(prior.profile.cleanupVerified, true)
  assert.equal(prior.profile.continuationVerified, true)
  assert.equal(prefix.status, 'passed')
  assert.deepEqual(prefix.cleanupErrors, [])
  assert.equal(prefix.terminal.stats.trained, 0)
  assert.equal(training.status, 'failed')
  assert.match(training.failure, /Declared Temple tail deadline expired/)
  assert.deepEqual(training.cleanupErrors, [])
  assert.deepEqual(training.observation.cleanupErrors, [])
  assert.equal(training.observation.epochs.length, 1)
  const epoch = training.observation.epochs[0]
  assert(epoch.closed && !epoch.overflow)
  assert.deepEqual(epoch.errors, [])
  assert.equal(epoch.input, null)
  assert.equal(epoch.records.filter(row => row.kind === 'request').length, 0)
  assert.equal(receipt.profile.mode, 'reused')
  assert.equal(receipt.profile.id, templeContinuationSource.profileId)
  assert.equal(receipt.profile.origin, templeContinuationSource.origin)
  assert.equal(receipt.profile.previousRun.runId, templeContinuationSource.priorRunId)
  assert.equal(receipt.profile.previousRun.receiptSha256, templeContinuationSource.receiptSha256)
  assert.equal(
    receipt.profile.previousRun.sourceFingerprint,
    templeContinuationSource.sourceFingerprint
  )
  assert.equal(receipt.profile.previousRun.checker, templeContinuationSource.checker)
  assert.equal(receipt.profile.inputs.application, templeContinuationSource.application)
  assert.equal(receipt.profile.correspondence?.decision, 'ACCEPT')
  assert.deepEqual(receipt.profile.checkpointAtStart, prior.profile.checkpointAtEnd)
  assert.equal(
    receipt.profile.checkpointAtStart.checkpointSha256,
    templeContinuationSource.checkpointSha256
  )
  assert.equal(receipt.profile.checkpointAtStart.turn, 2685)
  assert.deepEqual(prefix.checkpoint.digest.checkpoint, prior.profile.checkpointAtEnd)
  return {
    prefix,
    setupFile: resolve(root, templeContinuationSource.output, 'mission3-temple-checkpoint.json'),
  }
}

// Existing startup control/discovery semantics; this only attaches a passive
// capture before the actual public Load Game click. It never calls store.Load.
export async function armTempleStartupLoad({ targetId }) {
  const { armTempleCheckpoint, readTempleCommittedLoad } =
    await import('/scripts/local-render/temple-training-checkpoint.mjs')
  if (window.templeStartupLoad) throw Error('Startup Load observation already owned')
  const button = [...document.querySelectorAll('button')].find(
    item => item.textContent.trim() === 'Load Game'
  )
  if (!button?.isConnected || button.disabled) throw Error('Public Load Game unavailable')
  const main = document.querySelector('main')
  let store = null,
    fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
  for (; fiber && !store; fiber = fiber.return)
    for (let hook = fiber.memoizedState; hook; hook = hook.next)
      if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) {
        store = hook.memoizedState
        break
      }
  if (!store?.hasCheckpoint()) throw Error('Actual Page checkpoint restore is not ready')
  const expected = await readTempleCommittedLoad()
  const snapshot = ({ world }) => {
    const target = world.buildings.find(b => b.id === targetId)
    return {
      level: world.outcome.level,
      turn: world.turn,
      paused: world.paused,
      trained: world.stats.trained,
      unlockedTemple: world.unlockedTemple,
      target: target
        ? {
            id: target.id,
            kind: target.kind,
            team: target.team,
            hp: target.hp,
            progress: target.progress,
            object: target.object,
            stage: target.construction?.stage ?? null,
            activity: target.admission?.activity,
            inside: target.admission?.inside,
          }
        : null,
    }
  }
  const capture = armTempleCheckpoint({ kind: 'load', store, button, snapshot })
  const api = {
    async result() {
      return { expected, status: capture.status(), actual: await capture.digest() }
    },
    close() {
      const status = capture.close()
      if (window.templeStartupLoad !== api)
        status.errors.push('Foreign startup Load observer preserved')
      else delete window.templeStartupLoad
      return status
    },
  }
  window.templeStartupLoad = api
  return { expected, status: capture.status() }
}

export default async function templeTrainingContinuation(context) {
  const { root, page, output, receipt, signal } = context
  const prior = readTempleContinuation(root, receipt)
  const report = {
    status: 'running',
    source: templeContinuationSource,
    bounds: templeContinuationBounds,
    cleanupErrors: [],
  }
  const save = () =>
    writeFileSync(
      resolve(output, 'temple-training-continuation.json'),
      JSON.stringify(report, null, 2) + '\n'
    )
  let armed = false,
    failure
  try {
    report.armed = await page.evaluate(armTempleStartupLoad, { targetId: prior.prefix.plan.id })
    armed = true
    save()
    assert.deepEqual(report.armed.expected.committed, receipt.profile.checkpointAtStart)
    const loadEnd = Date.now() + templeContinuationBounds.loadMs
    await page
      .getByRole('dialog', { name: 'Start game', exact: true })
      .getByRole('button', { name: 'Load Game', exact: true })
      .click({ timeout: templeContinuationBounds.loadMs })
    // Maintained continuation ordering: pause is the next public input.
    await page
      .getByRole('button', { name: 'Pause game', exact: true })
      .click({ timeout: Math.max(1, loadEnd - Date.now()) })
    await bindGame(page)
    signal.throwIfAborted()
    assert(Date.now() < loadEnd, 'Startup public Load exceeded its declared bound')
    report.loaded = await page.evaluate(() => window.templeStartupLoad.result())
    save()
    assert(report.loaded.status.trusted && report.loaded.status.captured)
    assert.deepEqual(report.loaded.status.errors, [])
    assert.deepEqual(report.loaded.actual, report.loaded.expected.expectedLoad)
    const published = report.loaded.status.publication.target
    assert.equal(published.turn, 2685)
    assert.equal(published.paused, true)
    assert.equal(published.trained, 0)
    assert.equal(published.unlockedTemple, true)
    assert.equal(published.target.id, prior.prefix.plan.id)
    assert.equal(published.target.progress, 1)
    assert.equal(published.target.kind, 'temple')
    report.committed = await page.evaluate(checkpointObservation)
    save()
    assert.deepEqual(report.committed, receipt.profile.checkpointAtStart)
  } catch (error) {
    failure = error
    report.failure = String(error?.stack ?? error)
  } finally {
    if (armed)
      try {
        report.cleanup = await page.evaluate(() => window.templeStartupLoad.close())
      } catch (error) {
        report.cleanupErrors.push(String(error))
      }
    save()
  }
  if (!failure)
    try {
      assert.deepEqual(report.cleanupErrors, [])
      assert.deepEqual(report.cleanup.errors, [])
    } catch (error) {
      failure = error
      report.failure = String(error?.stack ?? error)
    }
  report.status = failure ? 'failed' : 'passed'
  save()
  if (failure) throw failure
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  return templeTrainingAuto(context, {
    ...prior,
    harnessMs: templeContinuationBounds.harnessMs,
    evidence: report,
  })
}
