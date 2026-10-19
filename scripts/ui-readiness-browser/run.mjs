// GitHub-only diagnostic of the built worker: never a deployment or local browser fallback.
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { browserConfiguration } from '../tutorial-browser/browser-config.mjs'
import frontend from '../local-render/frontend-prepared-assets.mjs'
import ingame from '../local-render/ingame-prepared-assets.mjs'
import palette from './building-palette.mjs'
import help from './contextual-help.mjs'

assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Only the reviewed GitHub runner is supported')
const root = resolve(import.meta.dirname, '../..')
const output = resolve(root, 'outputs/ui-readiness-browser')
assert.ok(!existsSync(output), 'Require fresh output')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const commit = git('rev-parse', 'HEAD')
assert.equal(commit, process.env.GITHUB_SHA, 'Require exact proposed merge')
assert.equal(git('status', '--porcelain', '--untracked-files=no'), '', 'Require clean tracked source')
const source = Object.fromEntries(git('ls-files').split('\n').map(name => [name, hash(resolve(root, name))]))
assert.ok(existsSync(resolve(root, 'dist/server/wrangler.json')), 'Build must produce the worker config')
mkdirSync(output, { recursive: true })
const config = browserConfiguration()
const receipt = { status: 'running', commit, head: process.env.PR_HEAD_SHA, base: process.env.PR_BASE_SHA,
  runId: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT, node: process.version,
  browserVersion: execFileSync(config.browserPath, ['--version'], { encoding: 'utf8' }).trim(),
  browserSha256: hash(config.browserPath), launch: config.launch, source,
  lockSha256: hash(resolve(root, 'package-lock.json')),
  installedLockSha256: hash(resolve(root, 'node_modules/.package-lock.json')),
  workerConfigSha256: hash(resolve(root, 'dist/server/wrangler.json')), cases: [],
  limits: ['Built Vinext/RSC worker served by local workerd on GitHub Ubuntu; not deployed Cloudflare/CDN behavior.',
    'Fresh browser context per case; routing disables HTTP cache. Reopening tests same-document reuse.',
    'Sandboxed headless Chrome, no hardware-performance or original executable claim.'] }
const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
const url = 'http://127.0.0.1:5199'
const servingDescription = receipt.limits[0]
let browser, server, timer
const stopServer = () => {
  if (!server?.pid) return
  try { process.kill(-server.pid, 'SIGTERM') } catch { return }
  setTimeout(() => { try { process.kill(-server.pid, 'SIGKILL') } catch { /* Owned group already exited. */ } }, 2000).unref()
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
  receipt.buildArtifacts = artifacts(resolve(root, 'dist'))
  save()
  server = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--config', 'dist/server/wrangler.json',
    '--local', '--ip', '127.0.0.1', '--port', '5199'], { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  server.stdout.on('data', append); server.stderr.on('data', append)
  server.on('error', error => { receipt.serverError = String(error); save() })
  timer = setTimeout(() => { receipt.status = 'timed-out'; save(); void browser?.close(); stopServer() }, 7 * 60_000)
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
  for (const [skin, run, modes] of [
    ['frontend', frontend, ['healthy', 'font-failure', 'slider-failure', 'late-success']],
    ['ingame', ingame, ['healthy', 'font-failure', 'slider-failure', 'late-font', 'late-sliders']],
    ['palette', palette, ['baseline']],
    ['help', help, ['contextual']],
  ]) for (const mode of modes) {
    const name = `${skin}-${mode}`, directory = resolve(output, name)
    mkdirSync(directory)
    process.env.POPULOUS_PREPARED_MODE = mode
    process.env.POPULOUS_INGAME_MODE = mode
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, serviceWorkers: 'block' })
    const page = await context.newPage()
    page.setDefaultTimeout(30_000); page.setDefaultNavigationTimeout(30_000)
    const row = { name, status: 'running' }; receipt.cases.push(row); save()
    const cap = setTimeout(() => { row.status = 'timed-out'; void context.close() }, 90_000)
    try {
      row.result = await run({ page, context, output: directory, url, servingDescription })
      row.status = 'passed'
    } catch (error) { row.status = 'failed'; row.error = String(error.stack) }
    finally { clearTimeout(cap); await context.close(); save() }
  }
  assert.ok(receipt.cases.every(row => row.status === 'passed'), 'One or more diagnostic cases failed')
  receipt.status = 'passed'
} catch (error) { receipt.status = 'failed'; receipt.error = String(error.stack); process.exitCode = 1 }
finally {
  clearTimeout(timer)
  await browser?.close()
  stopServer()
  writeFileSync(resolve(output, 'server.log'), serverLog)
  receipt.serverLogTruncated = logTruncated
  try {
    for (const [name, expected] of Object.entries(source)) assert.equal(hash(resolve(root, name)), expected, `Source drift: ${name}`)
    receipt.sourceUnchanged = true
    receipt.artifacts = artifacts(output)
    assert.ok(Object.values(receipt.artifacts).reduce((sum, file) => sum + file.bytes, 0) < 128 * 1024 * 1024, 'Diagnostic outputs exceed 128 MiB')
  } catch (error) { receipt.status = 'failed'; receipt.finalizationError = String(error); process.exitCode = 1 }
  save()
}
