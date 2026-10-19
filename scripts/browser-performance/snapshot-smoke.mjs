// Candidate-only functional admission. Never creates a comparative report or
// invokes the write-capable reporter. Browser timing values are raw diagnostics.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import capture from './snapshot-capture.mjs'
import { inspectDragSource, dragContract } from './snapshot-drag-contract.mjs'
import { createSnapshotFixture, validateSnapshotFixture } from './snapshot-setup.mjs'
import { readerDependencyManifest, readerBundleManifest, readerBuildProvenance, readerSourceEvidence } from './reader-build.mjs'
import { readerImportSha256 } from './snapshot-reader-proof.mjs'
import { plan, shards } from './snapshot-protocol.mjs'
import { createSnapshotEpisodeBudget } from './snapshot-smoke-budget.mjs'

export default async function snapshotSmoke({ browser, url, output, source, expectedRevision, dist,
  createFixture = createSnapshotFixture, captureScenario = capture,
  budgetClock = {} }) {
  const receipt = { version: 1, role: 'candidate-functional-smoke-not-trusted-comparison',
    sourceCommit: source.commit, expectedRevision, status: 'incomplete', sessions: [],
    comparativeClassification: 'not-run', execution: { timeOriginUnixMs: performance.timeOrigin, stages: [] }, limits: [
      'One candidate source only; no paired baseline or performance signal.',
      'Two sequential fresh contexts, not independent comparative browser sessions.',
      'Raw CPU values are retained for attribution validation only, not speed claims.',
      'Maximum two 90-second episodes, 180 seconds combined: expanded from one shared 90-second budget; unchanged six-minute hosted job ceiling includes all setup/build/cleanup.',
    ] }
  const save = () => writeFileSync(resolve(output, 'candidate-snapshot-smoke.json'), JSON.stringify(receipt, null, 2) + '\n')
  const now = budgetClock.now ?? (() => performance.now())
  const stage = async (name, operation) => {
    const record = { name, status: 'running', startedAtMs: now() }; receipt.execution.stages.push(record); save()
    try { const result = await operation(); record.status = 'passed'; return result }
    catch (error) { record.status = 'failed'; record.failure = String(error); throw error }
    finally { record.endedAtMs = now(); record.elapsedMs = record.endedAtMs - record.startedAtMs; save() }
  }
  const runEpisode = createSnapshotEpisodeBudget({ ledger: receipt.execution, expire: () => browser.close(), save,
    now, schedule: budgetClock.schedule, cancel: budgetClock.cancel })
  receipt.execution.startedAtMs = now()
  save()
  try {
    const root = resolve(import.meta.dirname, '../..')
    // Fixture/provenance are one-time preparation, not charged to either
    // browser episode. They remain inside the hosted job's hard total bound.
    const { dependencies, bundle, readerSource, readerProvenance, fixture } = await stage('prepare', async () => {
      receipt.dragSource = inspectDragSource(root)
      const dependencies = dist ? readerDependencyManifest(root) : null
      const bundle = dist ? readerBundleManifest(dist) : null
      const readerSource = readerSourceEvidence(root, receipt.dragSource)
      const readerProvenance = dist ? readerBuildProvenance(root, dependencies, bundle,
        ['scripts/tutorial-browser/build-home.mjs', 'scripts/tutorial-browser/fixture/main.tsx', 'scripts/browser-performance/reader-build.mjs']) : null
      if (dist) writeFileSync(resolve(output, 'reader-build-provenance.json'), JSON.stringify({ dependencies, bundle, readerSource, readerProvenance }, null, 2) + '\n')
      const fixture = await createFixture({ source })
      fixture.receipt = { ...fixture.receipt, executionRole: receipt.role,
        setup: 'TEST SETUP: candidate production-controller authored turn-70 snapshot; functional smoke only, not trusted comparative evidence or a browser-recorded save' }
      const { transferText, expectedText } = validateSnapshotFixture(fixture)
      for (const [name, text] of [['snapshot-transfer.json', transferText], ['snapshot-expected.json', expectedText],
        ['snapshot-source.json', JSON.stringify(fixture.receipt, null, 2)]])
        writeFileSync(resolve(output, name), text, { flag: 'wx' })
      receipt.snapshotSha256 = fixture.receipt.snapshotSha256; save()
      return { dependencies, bundle, readerSource, readerProvenance, fixture }
    })
    for (const shard of Object.keys(shards)) {
      const folder = `snapshot-${shard}`, directory = resolve(output, folder); mkdirSync(directory)
      const session = { shard, status: 'incomplete', recording: `${folder}/snapshot-frames.json`, errors: [] }
      receipt.sessions.push(session); save()
      let context
      try {
        await runEpisode(shard, async () => {
          try {
            context = await browser.newContext({ viewport: plan.viewport, deviceScaleFactor: plan.deviceScaleFactor })
            const page = await context.newPage(); page.setDefaultTimeout(15000)
            const error = value => { if (session.errors.length < 20) session.errors.push(String(value).slice(0, 2000)) }
            page.on('pageerror', error); page.on('crash', () => error('Page crashed'))
            page.on('console', message => { if (message.type() === 'error') error(message.text()) })
            const result = await captureScenario({ page, url, output: directory, fixture, expectedRevision, shard, dragSource: receipt.dragSource, readerSource, readerProvenance, getErrorCount: () => session.errors.length })
            if (dist) {
              assert.ok(result.readers, 'Functional smoke must prove actual reader bodies/prototypes')
              session.readerProof = result.readers.source.profile && result.readers.source.importSha256 === readerImportSha256
                ? 'complete-source-and-callee' : 'reader-bodies-and-prototype-only'
            }
            assert.equal(result.status, 'passed'); assert.deepEqual(result.phases.map(p => p.name), shards[shard])
            assert.ok(result.phases.every(p => p.status === 'passed' || (p.name === dragContract.phase && p.status === 'unsupported-source-contract')));
            session.unsupportedPhases = result.phases.filter(p => p.status === 'unsupported-source-contract').map(p => p.name); assert.deepEqual(session.errors, [])
            session.phases = result.phases.map(p => p.name)
          } finally {
            try { await stage(`cleanup:${shard}`, () => context?.close()) }
            catch (error) { session.cleanupFailure = String(error); throw error }
          }
        })
        session.status = 'passed'
      } catch (error) {
        session.failure = String(error).slice(0, 2000)
        if (error.code === 'SNAPSHOT_EPISODE_TIMEOUT') { session.timedOut = true; receipt.timeoutStage = shard; throw error }
        if (session.cleanupFailure) throw error // Never start another context after failed ownership cleanup.
      } finally { save() }
    }
    assert.ok(receipt.sessions.every(s => s.status === 'passed'), 'Candidate snapshot functional smoke incomplete; inspect raw evidence')
    await stage('verify-provenance', async () => {
      if (dist) { assert.equal(readerDependencyManifest(root).sha256, dependencies.sha256); assert.deepEqual(readerBundleManifest(dist), bundle) }
    })
    receipt.status = 'passed'; return receipt
  } catch (error) { receipt.failure = String(error); throw error }
  finally { receipt.execution.endedAtMs = now(); receipt.execution.elapsedMs = receipt.execution.endedAtMs - receipt.execution.startedAtMs; save() }
}
