import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, accessSync, constants } from 'node:fs'
import { resolve } from 'node:path'
import { browserConfiguration } from '../tutorial-browser/browser-config.mjs'
import { candidateDependency, candidateDependencyExport, git, sha256 } from '../native-ui-evidence/identity.mjs'
import { directoryManifest } from '../native-ui-evidence/files.mjs'
import { runModalInvalidation } from './run.mjs'
import { supervisorProof } from './supervisor-proof.mjs'
import { settleWithin } from './deadline.mjs'
const [root, output, dist, revision] = process.argv.slice(2)
const report = { status: 'failed', revision, supervisor: supervisorProof('browser') }
let browser, server, failure
const save = () => writeFileSync(resolve(output, 'browser-identity.json'), JSON.stringify(report, null, 2) + '\n')
try {
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
  browser = await chromium.launch(config.launch)
  report.browser.runtimeVersion = browser.version(); save()
  const result = await runModalInvalidation({ browser, url: 'http://127.0.0.1:5198',
    candidateRoot: root, output, head: revision })
  assert.equal(result.status, 'passed'); assert.equal(result.runtime.buildRevision, revision)
  report.renderer = result.runtime; report.status = 'passed'
} catch (error) { failure = error; report.failure = String(error); process.exitCode = 1 }
finally {
  report.cleanup = {
    browser: await settleWithin(() => browser?.close(), 1000),
    server: await settleWithin(() => server?.close(), 1000),
  }
  if (Object.values(report.cleanup).some(result => result.status !== 'fulfilled')) {
    report.status = 'failed'; process.exitCode = 1
  }
  report.completedAt = new Date().toISOString(); save()
}
if (failure) console.error(failure)
