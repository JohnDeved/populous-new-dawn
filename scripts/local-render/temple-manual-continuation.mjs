// Adapted from reviewed public7da59ae Temple continuation. Carry only this run's
// real committed Save2695; all preceding ordinary attempts remain failed.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import templeTrainingAuto from './temple-training-auto.mjs'
import { createTempleManualSteps } from './temple-manual-inspection.mjs'
import { checkpointObservation } from './checkpoint-observer.mjs'

export const templeContinuationSource = Object.freeze({
  output: 'work/orchestration/temple-manual-ordinary-02',
  receiptSha256: 'c11ea0bac499182a18b8b12793157b982b3f4bd92ae4e675979266783f6ac998',
  prefixSha256: '48d5401cc0df3077dc12d4658706bc51bfef31d101f55188eee9e12fe7f754ad',
  trainingSha256: '84d1569c8fc079962bc3dc023ec4e7408b9743db3273c5e66c323bbd0011b6be',
  profileId: '52b15b5c-e8c7-4401-adb5-8ed98a4f2999',
  priorRunId: '10d07e7b-b407-48be-a40c-747d1c6d83c0',
  sourceFingerprint: '1366bbed856647dbfe42b91768bf0b90664853c408e44c87ad9e435d1a4e0438',
  application: 'fd34b74165d8ecb8a459f42a58d5c879c8ba05587e8d90e5eb1a65f1ddb6c31f',
  checker: 'a1e36a36e7305549e02117fc68f19a24dd20b97376f2f60cd740e8735f1e4843',
  checkpointSha256: 'ed9e36de19fdca40671f2ff54d0f785f2f00417c6d87f11f8c8a3f92f902bf51',
  origin: 'http://127.0.0.1:4374',
})
export const templeContinuationBounds = Object.freeze({ harnessMs: 1500000, loadMs: 15000 })
export const templeContinuationPrevious = Object.freeze({
  output: 'work/orchestration/temple-manual-ordinary-03',
  receiptSha256: 'cb92af049b5103a5050e56e15cf95f58b8434bff6661032c820bd5ad0864df4c',
  trainingSha256: '95c579d6ddcddc68bc78d446715e5b325a95ce7c42d9f9459ae354596c754172',
  loadSha256: '0ac414fcdde16561993dab954a417fe1e69614ed5af14212b0fc36cd76f867ab',
  priorRunId: '2c7783da-f039-4172-b0bf-75ad09a55195',
  sourceFingerprint: '8a151c0a27191d7d1067e86494ae0e0876e5c37cfb380041eb50d26f9e6fdb08',
  checker: '5ed8e59b49374586b2a325c3c839ba4c157cb31124e0f246079a1e38b37c6f1a',
})

export function readTempleContinuation(root, receipt) {
  const read = (file, expected, output = templeContinuationSource.output) => {
    const bytes = readFileSync(resolve(root, output, file))
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
  assert.equal(prior.errors.length, 2)
  assert.match(prior.errors[0], /status of 500/)
  assert.match(prior.errors[1], /invalid import.*require/s)
  assert.equal(prior.profile.cleanupVerified, true)
  assert.equal(prior.profile.continuationVerified, true)
  assert.equal(prefix.status, 'passed')
  assert.deepEqual(prefix.cleanupErrors, [])
  assert.equal(prefix.terminal.stats.trained, 0)
  assert.equal(training.status, 'failed')
  assert.match(
    training.failure,
    /Failed to fetch dynamically imported module.*temple-manual-witness/
  )
  assert.deepEqual(training.cleanupErrors, [])
  assert.equal(training.manual.expiry.status, 'failed')
  assert.equal(training.manual.expiry.observation, undefined)
  assert.deepEqual(training.manual.expiry.cleanupErrors, [])
  assert.deepEqual(training.observation.cleanupErrors, [])
  assert.equal(training.observation.epochs.length, 1)
  const epoch = training.observation.epochs[0]
  assert(epoch.closed && !epoch.overflow)
  assert.deepEqual(epoch.errors, [])
  assert.equal(epoch.input, null)
  assert.equal(epoch.records.filter(row => row.kind === 'request').length, 0)
  // Carry the latest failed lease separately from the genuine earned prefix.
  const previous = templeContinuationPrevious,
    latest = read('receipt.json', previous.receiptSha256, previous.output),
    latestTraining = read('temple-training-auto.json', previous.trainingSha256, previous.output),
    latestLoad = read('temple-manual-continuation.json', previous.loadSha256, previous.output)
  assert.equal(latest.status, 'failed')
  assert.deepEqual(latest.errors, [])
  assert.equal(latest.profile.cleanupVerified, true)
  assert.equal(latest.profile.continuationVerified, true)
  assert.deepEqual(latest.profile.checkpointAtEnd, prior.profile.checkpointAtEnd)
  assert.equal(latestLoad.status, 'passed')
  assert.deepEqual(latestLoad.cleanupErrors, [])
  assert.equal(latestTraining.status, 'failed')
  assert.deepEqual(latestTraining.cleanupErrors, [])
  assert.deepEqual(latestTraining.observation.cleanupErrors, [])
  assert.equal(latestTraining.manual.expiry.status, 'passed')
  const approach = latestTraining.manual.approach
  assert.equal(approach.status, 'failed')
  assert.deepEqual(approach.cleanupErrors, [])
  assert.equal(approach.observation.creation, null)
  assert.equal(approach.observation.input, null)
  assert.equal(approach.observation.request.result, 'automatic:created')
  assert.match(approach.observation.errors.join('\n'), /Actual fresh manual allocation required/)
  assert.equal(receipt.profile.mode, 'reused')
  assert.equal(receipt.profile.id, templeContinuationSource.profileId)
  assert.equal(receipt.profile.origin, templeContinuationSource.origin)
  assert.equal(receipt.profile.previousRun.runId, previous.priorRunId)
  assert.equal(receipt.profile.previousRun.receiptSha256, previous.receiptSha256)
  assert.equal(receipt.profile.previousRun.sourceFingerprint, previous.sourceFingerprint)
  assert.equal(receipt.profile.previousRun.checker, previous.checker)
  assert.equal(receipt.profile.inputs.application, templeContinuationSource.application)
  assert.equal(receipt.profile.correspondence?.decision, 'ACCEPT')
  assert.deepEqual(receipt.profile.checkpointAtStart, prior.profile.checkpointAtEnd)
  assert.equal(
    receipt.profile.checkpointAtStart.checkpointSha256,
    templeContinuationSource.checkpointSha256
  )
  assert.equal(receipt.profile.checkpointAtStart.turn, 2695)
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

export default async function templeManualContinuation(context) {
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
      resolve(output, 'temple-manual-continuation.json'),
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
    assert.equal(published.turn, 2695)
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
  return templeTrainingAuto(
    context,
    {
      ...prior,
      harnessMs: templeContinuationBounds.harnessMs,
      evidence: report,
    },
    createTempleManualSteps(context)
  )
}
