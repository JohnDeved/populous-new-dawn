import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { episodes, acceptSeries, boundedEpisode } from './policy.mjs'
import { artifactInventory, ownBrowser } from './browser-owner.mjs'

export async function runNativeUiEvidence({ browser, candidateRoot, infrastructureRoot, url, output, signal }) {
  const report = { status: 'running', episodes: [], errors: [], warnings: [], expectedErrors: [], injectedRequests: [] }
  const save = () => writeFileSync(resolve(output, 'episodes.json'), JSON.stringify(report, null, 2) + '\n')
  const owner = ownBrowser(browser, output, report)
  try {
    for (const episode of episodes) {
      signal.throwIfAborted()
      const record = { id: episode.id, owner: episode.owner, path: episode.path, capMs: episode.capMs,
        status: 'running', timedOut: false, cleanupVerified: false, startedAt: new Date().toISOString() }
      report.episodes.push(record); save()
      const dir = resolve(output, episode.id); mkdirSync(dir)
      try {
        record.result = await boundedEpisode(async signal => {
          const receipt = { errors: [], warnings: [] }
          const args = { browser: owner.browser, url, root: candidateRoot, output: dir, receipt, signal }
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
          record.receipt = receipt
          return result
        }, { capMs: episode.capMs, signal, close: () => owner.closeContexts() })
        record.cleanupVerified = true
        assert.deepEqual(report.errors, [], 'Unexpected console/runtime errors, including fallback contexts')
        artifactInventory(output)
        record.status = 'passed'
      } catch (error) {
        record.status = 'failed'; record.error = String(error); record.stack = error.stack
        record.timedOut = /deadline|timed out/i.test(String(error))
        throw error
      } finally { record.finishedAt = new Date().toISOString(); save() }
    }
    acceptSeries(report.episodes)
    report.status = 'passed'
    return report
  } catch (error) { report.status = 'failed'; throw error }
  finally { await owner.close(); report.cleanupVerified = true; save(); artifactInventory(output) }
}
