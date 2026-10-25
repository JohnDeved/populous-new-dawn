import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { episodes, acceptSeries, boundedEpisode } from './policy.mjs'
import { artifactInventory, ownBrowser } from './browser-owner.mjs'
import { assertPauseResult } from './pause-acceptance.mjs'
import { assertAudioResult } from './audio-acceptance.mjs'
import { initialEpisodeReport } from './ledger.mjs'

export async function runNativeUiEvidence({ browser, candidateRoot, infrastructureRoot, url, output, signal }) {
  const report = initialEpisodeReport()
  report.status = 'running'
  const save = () => writeFileSync(resolve(output, 'episodes.json'), JSON.stringify(report, null, 2) + '\n')
  const owner = ownBrowser(browser, output, report)
  let primaryError, cleanupError
  try {
    for (const episode of episodes) {
      signal.throwIfAborted()
      owner.beginEpisode()
      const record = report.episodes.find(record => record.id === episode.id)
      record.status = 'running'; record.startedAt = new Date().toISOString(); save()
      const dir = resolve(output, episode.id); mkdirSync(dir)
      try {
        record.result = await boundedEpisode(async (signal, deadlineAt) => {
          const receipt = { errors: [], warnings: [] }
          // Retain the same live receipt on failures, not only successful returns.
          record.receipt = receipt; record.deadlineAt = deadlineAt
          const args = { browser: owner.browser, url, root: candidateRoot, output: dir, receipt, signal, deadlineAt }
          if (episode.primary) {
            args.context = await owner.browser.newContext({ viewport: { width: 640, height: 480 } })
            args.page = await args.context.newPage()
            // The two original exported episodes consume primary-page errors.
            // The owner independently validates exact injected URLs for all pages.
            if (['startup-logo', 'selector-recovery'].includes(episode.id)) {
              args.page.on('pageerror', error => receipt.errors.push(String(error)))
              args.page.on('console', message => { if (message.type() === 'error') receipt.errors.push(message.text()) })
            }
            await args.page.goto(url, { waitUntil: 'domcontentloaded' })
            if (episode.naturalLogo) await args.page.getByRole('dialog', { name: 'Main menu', exact: true }).waitFor()
            else if (episode.id === 'selector-recovery') {
              const { waitForStartupMenu } = await import(pathToFileURL(resolve(candidateRoot, 'scripts/browser-new-game.mjs')).href)
              await waitForStartupMenu(args.page)
            }
          }
          const root = episode.owner === 'candidate' ? candidateRoot : infrastructureRoot
          const module = await import(pathToFileURL(resolve(root, episode.path)).href)
          assert.equal(typeof module[episode.exportName ?? 'default'], 'function')
          const result = await module[episode.exportName ?? 'default'](args)
          if (episode.pauseMode) {
            assert.equal(episode.primary, false)
            assertPauseResult(episode.pauseMode, result)
          }
          if (episode.audioMode) {
            assert.equal(episode.primary, false)
            assertAudioResult(episode.audioMode, result)
          }
          return result
        }, { capMs: episode.capMs, signal, close: () => owner.closeContexts() })
        record.cleanupVerified = true
        assert.deepEqual(report.errors, [], 'Unexpected console/runtime errors, including fallback contexts')
        artifactInventory(output)
        record.status = 'passed'
      } catch (error) {
        record.status = 'failed'; record.error = String(error); record.stack = error.stack
        if (error.cleanupError) record.cleanupError = error.cleanupError
        if (error.traceWriteError) record.traceWriteError = error.traceWriteError
        record.timedOut = /deadline|timed out/i.test(String(error))
        throw error
      } finally { record.finishedAt = new Date().toISOString(); save() }
    }
    acceptSeries(report.episodes)
    report.status = 'passed'
  } catch (error) { report.status = 'failed'; primaryError = error instanceof Error ? error : new Error(String(error)) }
  finally {
    try { await owner.close(); report.cleanupVerified = true }
    catch (error) { report.cleanupError = String(error); report.status = 'failed'; cleanupError = error }
    finally {
      save()
      try { artifactInventory(output) }
      catch (error) { report.artifactError = String(error); report.status = 'failed'; cleanupError ??= error; save() }
    }
  }
  if (primaryError) { if (cleanupError) primaryError.cleanupError = String(cleanupError); throw primaryError }
  if (cleanupError) throw cleanupError
  return report
}
