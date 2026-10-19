// GitHub-only diagnostic of the built worker: never a deployment or local browser fallback.
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { browserConfiguration } from '../tutorial-browser/browser-config.mjs'
import bitmapSampling, { pauseSampling } from './bitmap-sampling.mjs'

const root = resolve(import.meta.dirname, '../..')
const output = resolve(root, 'outputs/ui-readiness-browser')
const upload = resolve(root, 'outputs/ui-readiness-upload')
assert.ok(!existsSync(output), 'Require fresh output')
mkdirSync(output, { recursive: true })
mkdirSync(upload, { recursive: true })
const receipt = { status: 'running', cases: [], runId: process.env.GITHUB_RUN_ID,
  attempt: process.env.GITHUB_RUN_ATTEMPT, node: process.version,
  limits: ['Built Vinext/RSC worker served by local workerd on GitHub Ubuntu; not deployed Cloudflare/CDN behavior.',
    'Fresh browser contexts are not HTTP-cache benchmarks. These bitmap sampling cases do not route assets or measure HTTP caching; pixelated CSS interventions are explicitly labeled experiments, not source baselines.',
    'Sandboxed headless Chrome, no hardware-performance or original executable claim.'] }
const save = () => {
  const data = JSON.stringify(receipt, null, 2) + '\n'
  writeFileSync(resolve(output, 'receipt.json'), data)
  writeFileSync(resolve(upload, 'receipt.json'), Buffer.byteLength(data) <= 128 * 1024 * 1024 ? data :
    JSON.stringify({ status: 'failed', reason: 'Receipt exceeded upload limit', commit: receipt.commit }))
}
save() // Preserve setup failures before Git, source, build or browser inspection.
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex')
let source
const config = browserConfiguration()
const url = 'http://127.0.0.1:5199'
const servingDescription = receipt.limits[0]
let browser, server, timer
let globalTimedOut = false
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const closeBrowser = async () => {
  let deadline
  try { await Promise.race([browser?.close(), new Promise((_, reject) => { deadline = setTimeout(() => reject(Error('Browser close exceeded 5 seconds')), 5000) })]) }
  finally { clearTimeout(deadline) }
}
const stopServer = async () => {
  if (!server?.pid) return { status: 'not-started' }
  const alive = () => { try { process.kill(-server.pid, 0); return true } catch (error) { if (error.code === 'ESRCH') return false; throw error } }
  if (!alive()) return { status: 'already-exited', exitCode: server.exitCode }
  process.kill(-server.pid, 'SIGTERM')
  for (let i = 0; i < 20 && alive(); i++) await sleep(100)
  let forced = false
  if (alive()) { forced = true; process.kill(-server.pid, 'SIGKILL') }
  for (let i = 0; i < 20 && alive(); i++) await sleep(100)
  return { status: alive() ? 'failed' : 'stopped', forced, exitCode: server.exitCode, signalCode: server.signalCode }
}
let serverLog = ''
let logTruncated = false
const append = data => {
  if (serverLog.length + data.length <= 2 * 1024 * 1024) serverLog += data.toString()
  else logTruncated = true
}
function artifacts(directory, prefix = '') {
  return Object.fromEntries(readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name), name = prefix + entry.name
    if (name === 'receipt.json') return [] // Do not publish a stale self-hash.
    return entry.isDirectory() ? Object.entries(artifacts(path, name + '/')) : [[name, { bytes: statSync(path).size, sha256: hash(path) }]]
  }))
}
try {
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Only the reviewed GitHub runner is supported')
  receipt.commit = git('rev-parse', 'HEAD')
  receipt.candidate = process.env.CANDIDATE_SHA
  receipt.runtimeHelp = process.env.RUNTIME_HELP_SHA
  receipt.runtimeSource = process.env.RUNTIME_SOURCE_SHA
  receipt.base = process.env.PR_BASE_SHA
  const wrap = run => args => run({ ...args, sourceCommit: receipt.runtimeSource, expectedSampling: 'crisp-edges' })
  const suites = { bitmap: [
    ['frontend-wide', wrap(bitmapSampling), 'source', { viewport: { width: 2560, height: 1267 }, deviceScaleFactor: 1 }],
    ['frontend-highdpi', wrap(bitmapSampling), 'source', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }],
    ['pause-smoke', wrap(pauseSampling), 'source', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }],
  ] }
  receipt.suite = process.env.UI_DIAGNOSTIC_SUITE
  assert.ok(Object.hasOwn(suites, receipt.suite), 'Require one fixed reviewed suite')
  const cases = suites[receipt.suite]
  receipt.expectedCases = cases.length
  save()

  assert.equal(receipt.commit, process.env.GITHUB_SHA, 'Require exact diagnostic push commit, not a PR merge')
  assert.equal(git('status', '--porcelain', '--untracked-files=no'), '', 'Require clean tracked source')
  source = receipt.source = Object.fromEntries(git('ls-files').split('\n').map(name => [name, hash(resolve(root, name))]))
  receipt.browserVersion = execFileSync(config.browserPath, ['--version'], { encoding: 'utf8', timeout: 5000 }).trim()
  receipt.browserSha256 = hash(config.browserPath)
  receipt.launch = config.launch
  assert.equal(receipt.browserVersion, process.env.EXPECTED_CHROME_VERSION, 'Reviewed installed Chrome version required; no install/fallback')
  assert.equal(receipt.browserSha256, process.env.EXPECTED_CHROME_SHA256, 'Reviewed Chrome binary hash required')
  receipt.lockSha256 = hash(resolve(root, 'package-lock.json'))
  receipt.installedLockSha256 = hash(resolve(root, 'node_modules/.package-lock.json'))
  receipt.workerConfigSha256 = hash(resolve(root, 'dist/server/wrangler.json'))
  receipt.buildArtifacts = artifacts(resolve(root, 'dist'))
  save()
  server = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--config', 'dist/server/wrangler.json',
    '--local', '--ip', '127.0.0.1', '--port', '5199'], { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  server.stdout.on('data', append); server.stderr.on('data', append)
  server.on('error', error => { receipt.serverError = String(error); save() })
  timer = setTimeout(() => { globalTimedOut = true; receipt.status = 'timed-out'; save(); void browser?.close() }, 7 * 60_000)
  const deadline = Date.now() + 60_000
  for (;;) {
    assert.equal(server.exitCode, null, 'Worker server exited before readiness')
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) })
      const html = await response.text()
      if (response.ok && html.includes('<html')) {
        receipt.document = { status: response.status, sha256: createHash('sha256').update(html).digest('hex'), bytes: Buffer.byteLength(html) }
        break
      }
    } catch { /* Server startup is bounded by deadline. */ }
    assert.ok(Date.now() < deadline, 'Worker did not serve HTML within 60 seconds')
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  browser = await chromium.launch(config.launch)
  for (const [name, run, mode = name, contextOptions] of cases) {
    if (globalTimedOut) break
    const directory = resolve(output, name)
    mkdirSync(directory)
    process.env.POPULOUS_PREPARED_MODE = mode
    process.env.POPULOUS_INGAME_MODE = mode
    const context = await browser.newContext({ ...contextOptions, serviceWorkers: 'block' })
    const page = await context.newPage()
    page.setDefaultTimeout(30_000); page.setDefaultNavigationTimeout(30_000)
    const row = { name, status: 'running' }; receipt.cases.push(row); save()
    let caseTimedOut = false
    const cap = setTimeout(() => { caseTimedOut = true; row.status = 'timed-out'; void context.close() }, 90_000)
    try {
      row.result = await run({ page, context, output: directory, url, servingDescription })
      if (row.result?.status === 'timed-out') caseTimedOut = true
      assert.equal(row.result?.status, 'passed', 'Helper must explicitly report passed')
      row.status = caseTimedOut || globalTimedOut ? 'timed-out' : 'passed'
    } catch (error) {
      if (error.name === 'DiagnosticTimeoutError') caseTimedOut = true
      row.status = caseTimedOut || globalTimedOut || receipt.caseTimedOut ? 'timed-out' : 'failed'; row.error = String(error.stack) }
    finally { clearTimeout(cap); await context.close(); save() }
    if (caseTimedOut) { receipt.caseTimedOut = true; throw Error(`Case deadline expired: ${name}; later cases not started`) }
  }
  assert.ok(!globalTimedOut, 'Global diagnostic deadline expired')
  assert.equal(receipt.cases.length, receipt.expectedCases, 'All bounded cases must run')
  assert.ok(receipt.cases.every(row => row.status === 'passed'), 'One or more diagnostic cases failed')
  receipt.status = 'passed'
} catch (error) { receipt.status = globalTimedOut || receipt.caseTimedOut ? 'timed-out' : 'failed'; receipt.error = String(error.stack); process.exitCode = 1 }
finally {
  clearTimeout(timer)
  try { await closeBrowser() } catch (error) { receipt.status = globalTimedOut || receipt.caseTimedOut ? 'timed-out' : 'failed'; receipt.browserCleanupError = String(error); process.exitCode = 1 }
  try {
    receipt.serverCleanup = await stopServer()
    assert.notEqual(receipt.serverCleanup.status, 'failed', 'Owned server process group survived cleanup')
  } catch (error) { receipt.status = globalTimedOut || receipt.caseTimedOut ? 'timed-out' : 'failed'; receipt.cleanupError = String(error); process.exitCode = 1 }
  writeFileSync(resolve(output, 'server.log'), serverLog)
  receipt.serverLogTruncated = logTruncated
  try {
    for (const [name, expected] of Object.entries(source ?? {})) assert.equal(hash(resolve(root, name)), expected, `Source drift: ${name}`)
    receipt.sourceUnchanged = !!source
    receipt.artifacts = artifacts(output)

  } catch (error) { receipt.status = globalTimedOut || receipt.caseTimedOut ? 'timed-out' : 'failed'; receipt.finalizationError = String(error); process.exitCode = 1 }
  const artifactBytes = Object.values(receipt.artifacts ?? {}).reduce((sum, file) => sum + file.bytes, 0)
  receipt.upload = { limitBytes: 128 * 1024 * 1024, artifactBytes, excluded: false }
  const serialized = JSON.stringify(receipt, null, 2) + '\n'
  if (artifactBytes + Buffer.byteLength(serialized) > receipt.upload.limitBytes) {
    receipt.status = globalTimedOut || receipt.caseTimedOut ? 'timed-out' : 'failed'; process.exitCode = 1
    receipt.upload.excluded = true
    receipt.upload.reason = 'Artifact set plus receipt exceeds 128 MiB; upload contains failure receipt only.'
  } else try {
    for (const name of Object.keys(receipt.artifacts ?? {})) {
      const target = resolve(upload, name); mkdirSync(dirname(target), { recursive: true })
      copyFileSync(resolve(output, name), target)
    }
  } catch (error) { receipt.status = globalTimedOut || receipt.caseTimedOut ? 'timed-out' : 'failed'; receipt.upload.error = String(error); process.exitCode = 1 }
  save()
  // Account for the final receipt and any late error metadata, not a pre-copy estimate.
  const stagedBytes = Object.values(artifacts(upload)).reduce((sum, file) => sum + file.bytes, 0) + statSync(resolve(upload, 'receipt.json')).size
  if (stagedBytes > 128 * 1024 * 1024) {
    receipt.status = globalTimedOut || receipt.caseTimedOut ? 'timed-out' : 'failed'
    receipt.upload = { ...receipt.upload, excluded: true, stagedBytes, reason: 'Final staged total exceeds 128 MiB; failure receipt only.' }
    writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
    rmSync(upload, { recursive: true, force: true }) // Only this run's generated upload staging.
    mkdirSync(upload)
    writeFileSync(resolve(upload, 'receipt.json'), JSON.stringify({ status: receipt.status, commit: receipt.commit, upload: receipt.upload }))
    process.exitCode = 1
  }
}
