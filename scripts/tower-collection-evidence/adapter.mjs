import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ownBrowser } from '../native-ui-evidence/browser-owner.mjs'
import { boundedEpisode } from '../native-ui-evidence/policy.mjs'
import { artifactInventory, towerLimits, singleEpisodeBrowser } from './policy.mjs'
import { git, fullSha } from '../native-ui-evidence/identity.mjs'
import { acceptTowerResult } from './acceptance.mjs'

// Reuse the existing process-group supervisor and browser owner without loosening their bounds.
export async function runTowerCollectionEvidence({ browser, candidateRoot, output, url, signal }) {
  const revision = fullSha(git(candidateRoot, 'rev-parse', 'HEAD'))
  const report = { revision, status: 'running', cleanupVerified: false,
    claim: 'Focused #914 Tower collection/checkpoint only; not full native-UI acceptance',
    errors: [], warnings: [], injectedRequests: [], expectedErrors: [], observations: [], setup: {} }
  const save = () => writeFileSync(resolve(output, 'tower-collection-series.json'), JSON.stringify(report, null, 2) + '\n')
  const owner = ownBrowser(browser, output, report)
  let failure, failed = false
  try {
    owner.beginEpisode({ id: 'mission4-tower-collection' })
    report.result = await boundedEpisode(async (episodeSignal, deadlineAt) => {
      report.deadlineAt = deadlineAt
      const { runTowerCollectionEpisode } = await import(pathToFileURL(resolve(candidateRoot, 'scripts/tower-collection-evidence/episode.mjs')).href)
      assert.equal(typeof runTowerCollectionEpisode, 'function')
      const result = await runTowerCollectionEpisode({
        browser: singleEpisodeBrowser(owner.browser, report), url, output,
        signal: episodeSignal, deadlineAt, revision,
      })
      acceptTowerResult(result, revision, artifactInventory(output))
      assert.deepEqual(report.errors, [], 'All page runtime/crash/console errors must remain fatal')
      artifactInventory(output)
      return result
    }, { capMs: towerLimits.browserMs, signal, close: () => owner.closeContexts() })
    signal.throwIfAborted()
    assert.deepEqual(report.errors, [])
    report.status = 'passed'
  } catch (error) { failed = true; failure = error; report.status = 'failed'; report.failure = String(error) }
  finally {
    try { await owner.close(); report.cleanupVerified = true }
    catch (error) {
      report.status = 'failed'; report.cleanupError = String(error)
      if (!failed) { failed = true; failure = error }
    }
    try { signal.throwIfAborted(); assert.deepEqual(report.errors, []); artifactInventory(output) }
    catch (error) {
      report.status = 'failed'; report.finalError = String(error)
      if (!failed) { failed = true; failure = error }
    }
    try {
      save()
      artifactInventory(output)
    } catch (error) {
      report.status = 'failed'; report.artifactError = String(error)
      if (!failed) { failed = true; failure = error }
      // One bounded failure receipt attempt, never delete held evidence to fit.
      try { save() } catch (writeError) { report.receiptWriteError = String(writeError) }
    }
  }
  if (failed) throw failure
  return report
}

