import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { artifactInventory as commonInventory, ownBrowser } from '../native-ui-evidence/browser-owner.mjs'
import { boundedEpisode } from '../native-ui-evidence/policy.mjs'
import { enterOptionsMission } from './mission-entry.mjs'
import { git, fullSha } from '../native-ui-evidence/identity.mjs'

export const optionsLimits = Object.freeze({ browserMs: 180000, screenshots: 8, artifactBytes: 64 * 1024 * 1024 })
export function assertOptionsArtifactInventory(inventory) {
  assert.ok(inventory.screenshots <= optionsLimits.screenshots, 'Partial Options screenshot cap exceeded')
  assert.ok(inventory.bytes <= optionsLimits.artifactBytes, 'Partial Options artifact cap exceeded')
  return inventory
}
export const artifactInventory = output => assertOptionsArtifactInventory(commonInventory(output))

// Called only by the isolated worker under the existing Linux process-group
// supervisor (180s + existing 5s forced cleanup). No new broad-suite mode.
export async function runOptionsControlsEvidence({ browser, candidateRoot, output, url, signal }) {
  const revision = fullSha(git(candidateRoot, 'rev-parse', 'HEAD'))
  const report = { revision, status: 'running', cleanupVerified: false,
    claim: 'Partial #885 controls only; not full native-UI acceptance',
    errors: [], warnings: [], injectedRequests: [], expectedErrors: [], observations: [], setup: {} }
  const save = () => writeFileSync(resolve(output, 'options-controls-series.json'), JSON.stringify(report, null, 2) + '\n')
  const owner = ownBrowser(browser, output, report)
  let failure, failed = false
  try {
    owner.beginEpisode({ id: 'options-browser-controls-partial' })
    report.result = await boundedEpisode(async (episodeSignal, deadlineAt) => {
      report.deadlineAt = deadlineAt
      const context = await owner.browser.newContext({ viewport: { width: 1280, height: 960 } })
      const page = await context.newPage()
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await enterOptionsMission(page, candidateRoot, { signal: episodeSignal, deadlineAt, trace: report.setup })
      const { default: episode } = await import(pathToFileURL(resolve(candidateRoot, 'scripts/local-render/options-browser-controls.mjs')).href)
      const result = await episode({ page, output, deadlineAt, signal: episodeSignal, revision })
      assert.equal(result.status, 'passed')
      assert.deepEqual(report.errors, [], 'All page runtime/crash/console errors must remain fatal')
      artifactInventory(output)
      return result
    }, { capMs: optionsLimits.browserMs, signal, close: () => owner.closeContexts() })
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
