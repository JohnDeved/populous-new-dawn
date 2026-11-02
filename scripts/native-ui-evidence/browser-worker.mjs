import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { readdirSync, lstatSync, symlinkSync, accessSync, constants, writeFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { browserConfiguration } from '../tutorial-browser/browser-config.mjs'
import { candidateDependency, candidateDependencyExport, manualIdentity, separateRoots, git, sha256 } from './identity.mjs'
import { runNativeUiEvidence } from './adapter.mjs'
import { recordUnstartedFailure } from './ledger.mjs'
import { createPauseTraceStorage, assertPauseTraceVersions } from './pause-click-trace.mjs'
const [candidate, infrastructure, output, dist] = process.argv.slice(2)
const { candidateRoot, infrastructureRoot } = separateRoots(candidate, infrastructure)
const identity = manualIdentity(process.env)
assert.equal(git(candidateRoot, 'rev-parse', 'HEAD'), identity.candidateSha)
assert.equal(git(infrastructureRoot, 'rev-parse', 'HEAD'), identity.workflowSha)
const abort = new AbortController()
let browser, server, stage = 'candidate-dependency-import'
process.once('SIGTERM', () => { abort.abort(new Error('Supervised worker terminated')); void browser?.close() })
try {
  const { preview } = await import(candidateDependency(candidateRoot, 'vite'))
  const chromium = await candidateDependencyExport(candidateRoot, '@playwright/test', 'chromium')
  assert.equal(typeof chromium?.launch, 'function', 'Candidate Playwright chromium must expose launch')
  stage = 'pause-trace-version'
  const traceVersions = Object.fromEntries(['@playwright/test', 'playwright-core'].map(name =>
    [name, JSON.parse(readFileSync(new URL(candidateDependency(candidateRoot, `${name}/package.json`)), 'utf8')).version]))
  assertPauseTraceVersions(traceVersions)
  stage = 'chrome-provenance'
  const config = browserConfiguration() // Fixed official sandboxed Chrome; no path/flag override.
  accessSync(config.browserPath, constants.X_OK)
  const browserIdentity = { ...config, traceVersions, sha256: sha256(config.browserPath),
    version: execFileSync(config.browserPath, ['--version'], { encoding: 'utf8' }).trim(), status: 'not-launched' }
  const saveBrowser = () => writeFileSync(resolve(output, 'browser-provenance.json'), JSON.stringify(browserIdentity, null, 2) + '\n')
  saveBrowser()
  stage = 'candidate-public-links'
  for (const entry of readdirSync(resolve(candidateRoot, 'public'))) {
    const source = resolve(candidateRoot, 'public', entry)
    symlinkSync(source, resolve(dist, entry), lstatSync(source).isDirectory() ? 'dir' : 'file')
  }
  stage = 'candidate-preview'
  server = await preview({ configFile: false, root: resolve(candidateRoot, 'scripts/tutorial-browser/fixture'),
    publicDir: false, build: { outDir: dist }, preview: { host: '127.0.0.1', port: 5198, strictPort: true } })
  stage = 'chrome-launch'
  const pauseTraceStorage = createPauseTraceStorage(output)
  browserIdentity.launch = { ...config.launch, tracesDir: pauseTraceStorage.work }; saveBrowser()
  browser = await chromium.launch(browserIdentity.launch)
  browserIdentity.status = 'launched'; browserIdentity.playwrightVersion = browser.version(); saveBrowser()
  stage = 'ui-episodes'
  const report = await runNativeUiEvidence({ browser, candidateRoot, infrastructureRoot, output,
    url: 'http://127.0.0.1:5198', signal: abort.signal, pauseTraceStorage })
  assert.equal(report.status, 'passed')
  console.log(JSON.stringify({ browser: browserIdentity, version: browser.version(), identity, status: report.status }))
} catch (error) {
  recordUnstartedFailure(output, stage, error)
  throw error
} finally {
  await browser?.close(); await server?.close()
}
