import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, accessSync, constants, mkdirSync, statfsSync } from 'node:fs'
import { resolve } from 'node:path'
import { browserConfiguration } from '../tutorial-browser/browser-config.mjs'
import { candidateDependency, candidateDependencyExport, git, sha256 } from '../native-ui-evidence/identity.mjs'
import { directoryManifest } from '../native-ui-evidence/files.mjs'
import { runModalInvalidation } from './run.mjs'
import { supervisorProof } from './supervisor-proof.mjs'
import { settleWithin } from './deadline.mjs'
import { boundedTimeline, captureOwnedCgroup } from './diagnostics.mjs'
import { writeEvidence } from './evidence-writer.mjs'
import { captureBrowserStorage } from './browser-storage.mjs'
const [root, output, dist, revision] = process.argv.slice(2)
const report = { status: 'failed', revision, supervisor: supervisorProof('browser') }
const timeline = boundedTimeline(); report.lifecycle = timeline.report; report.cgroupSnapshots = []
let browser, server, failure
const save = () => writeEvidence(output, 'browser-identity.json', JSON.stringify(report, null, 2) + '\n')
const checkpoint = label => {
  if (report.cgroupSnapshots.length >= 8) return
  try { report.cgroupSnapshots.push({ label, ...captureOwnedCgroup(report.supervisor),
    runtimeMounts: report.storage?.mounts?.map(mount => { const fs = statfsSync(mount.path); return { path: mount.path,
      allocatedBytes: (fs.blocks - fs.bfree) * fs.bsize, availableBytes: fs.bavail * fs.bsize, availableInodes: fs.ffree } }) }) }
  catch (error) { report.cgroupSnapshots.push({ label, status: 'diagnostic-error', error: String(error).slice(0, 512) }) }
}
const record = (kind, detail) => {
  timeline.record(kind, detail)
  try { save() } catch (error) { report.diagnosticWriteFailure = String(error).slice(0, 512) }
}
record('worker-start'); checkpoint('worker-start')
try {
  report.storage = captureBrowserStorage({ temporary: resolve(output, '../tmp'), output, root, dist, supervisor: report.supervisor }); save()
  assert.equal(report.storage.acceptance.status, 'passed', report.storage.acceptance.error)
  for (const key of ['HOME', 'XDG_CACHE_HOME', 'XDG_CONFIG_HOME', 'XDG_RUNTIME_DIR']) mkdirSync(process.env[key], { mode: 0o700 })
  assert.equal(git(root, 'rev-parse', 'HEAD'), revision)
  assert.deepEqual(directoryManifest(dist), JSON.parse(readFileSync(resolve(output, 'served-build.json'), 'utf8')))
  const { preview } = await import(candidateDependency(root, 'vite'))
  const chromium = await candidateDependencyExport(root, '@playwright/test', 'chromium')
  const config = browserConfiguration() // No environment path, sandbox or flag override.
  accessSync(config.browserPath, constants.X_OK)
  report.browser = { ...config, sha256: sha256(config.browserPath),
    version: execFileSync(config.browserPath, ['--version'], { encoding: 'utf8', timeout: 5000 }).trim(),
    playwright: JSON.parse(readFileSync(new URL(candidateDependency(root, '@playwright/test/package.json')), 'utf8')).version }
  report.buildManifestSha256 = sha256(resolve(output, 'served-build.json')); save()
  server = await preview({ configFile: false, root: resolve(root, 'scripts/tutorial-browser/fixture'),
    publicDir: false, build: { outDir: dist }, preview: { host: '127.0.0.1', port: 5198, strictPort: true } })
  record('browser-launch-requested'); checkpoint('before-browser-launch')
  browser = await chromium.launch(config.launch)
  record('browser-launched'); checkpoint('after-browser-launch')
  browser.on('disconnected', () => {
    checkpoint('browser-disconnected'); record('browser-disconnected')
  })
  report.browser.runtimeVersion = browser.version(); save()
  const result = await runModalInvalidation({ browser, url: 'http://127.0.0.1:5198',
    candidateRoot: root, output, head: revision, recordLifecycle: record })
  assert.equal(result.status, 'passed'); assert.equal(result.runtime.buildRevision, revision)
  report.renderer = result.runtime; report.status = 'passed'
} catch (error) { failure = error; report.failure = String(error); process.exitCode = 1; checkpoint('acquisition-failed'); record('worker-failure', String(error)) }
finally {
  checkpoint('before-cleanup'); record('worker-cleanup-start')
  report.cleanup = {
    browser: await settleWithin(() => { record('browser-close-requested', 'worker-finally'); return browser?.close({ reason: 'modal-worker-finally' }) }, 1000),
    server: await settleWithin(() => server?.close(), 1000),
  }
  if (Object.values(report.cleanup).some(result => result.status !== 'fulfilled')) {
    report.status = 'failed'; process.exitCode = 1
  }
  checkpoint('after-cleanup'); record('worker-finish', report.status)
  report.completedAt = new Date().toISOString(); save()
}
if (failure) console.error(failure)
