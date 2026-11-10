import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, statfsSync, existsSync, openSync, writeSync, closeSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import strictmodeEpisode from './strictmode-episode.mjs'

const [rootArg, outputArg, expectedCommit] = process.argv.slice(2)
assert.equal(expectedCommit, '1a8dec3c9d5dce83051c3e8faae0b93a127dd11e')
const root = resolve(rootArg), output = resolve(outputArg)
assert.equal(existsSync(output), false, 'Fresh evidence directory required')
mkdirSync(output, { recursive: true })
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
assert.equal(git('rev-parse', 'HEAD'), expectedCommit)
assert.equal(git('diff', '--name-only', 'HEAD', '--'), '')
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
const source = Object.fromEntries(tracked.map(path => [path, hash(resolve(root, path))]))
function dependencies() {
  const entries = {}
  const walk = (dir, prefix = '') => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const name = prefix + entry.name, path = resolve(dir, entry.name)
      if (entry.isDirectory()) walk(path, name + '/')
      else if (entry.isFile()) { const stat = statSync(path); entries[name] = [stat.size, stat.mtimeMs] }
    }
  }
  walk(resolve(root, 'node_modules'))
  return createHash('sha256').update(JSON.stringify(entries)).digest('hex')
}
const depsBefore = dependencies()
const require = createRequire(resolve(root, 'package.json'))
const { chromium } = require('@playwright/test')
const { browserConfiguration } = await import(pathToFileURL(resolve(root, 'scripts/tutorial-browser/browser-config.mjs')).href)
const config = browserConfiguration()
assert.deepEqual(config.launch.args, ['--headless', '--remote-debugging-pipe'])
assert.equal(config.launch.chromiumSandbox, true)
const infrastructure = Object.fromEntries(['strictmode-runner.mjs', 'strictmode-host.mjs', 'strictmode-episode.mjs', 'strictmode-probe.mjs', 'strictmode-transform.mjs'].map(name => [name, hash(resolve(import.meta.dirname, name))]))
const receipt = { status: 'running', commit: expectedCommit, tree: git('rev-parse', 'HEAD^{tree}'), source, infrastructure,
  launch: config.launch, browserSha256: hash(config.browserPath), node: process.version,
  runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT, workflowCommit: process.env.GITHUB_SHA,
  startedAt: new Date().toISOString(), errors: [], warnings: [], cases: [], captures: [],
  limits: ['Real React development StrictMode in a supplied Vite client host, not shipped vinext App Router/SSR or deployed edge.',
    'Actual Home with one hash-locked observed subscribe argument. Original store/listener/snapshot/setter code remains intact; this is disclosed serve-time instrumentation.',
    'Two fresh contexts, two Home mounts per context, valid and hud-size-only blocked-read cases; public game/settings controls plus labelled host rerender/unmount/remount controls.',
    'Four original screenshots; no production navigation-remount, broader storage, native parity, assistive-technology or hardware-performance acceptance.'] }
const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
const owned = []
// Each process group belongs only to this runner. Retain bounded logs and terminal outcomes.
function startOwned(args, logName) {
  const fd = openSync(resolve(output, logName), 'wx')
  let bytes = 0, logOverflow = false
  const child = spawn(process.execPath, args, { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development' } })
  const state = { command: [process.execPath, ...args], pid: child.pid, code: null, signal: null, closed: false }
  const kill = signal => {
    if (!child.pid) return
    try { process.kill(-child.pid, signal) } catch (error) { if (error.code !== 'ESRCH') throw error }
  }
  const log = data => {
    if (bytes + data.length > 32 * 1024 * 1024) { logOverflow = true; kill('SIGTERM'); return }
    bytes += data.length; writeSync(fd, data)
  }
  child.stdout.on('data', log); child.stderr.on('data', log)
  const terminal = new Promise(done => {
    child.once('error', error => { state.error = String(error) })
    child.once('close', (code, signal) => { Object.assign(state, { code, signal, closed: true, logOverflow }); closeSync(fd); done(state) })
  })
  const wait = ms => new Promise(done => setTimeout(done, ms))
  const owner = { state, terminal, kill, async stop() {
    if (!state.closed) kill('SIGTERM')
    if (!state.closed) await Promise.race([terminal, wait(5000)])
    if (!state.closed) { state.forced = true; kill('SIGKILL'); await Promise.race([terminal, wait(5000)]) }
    if (!state.closed) throw Error('Owned process failed to close: ' + child.pid)
    try { process.kill(-child.pid, 0); throw Error('Owned process group survived: ' + child.pid) }
    catch (error) { if (error.code !== 'ESRCH') throw error }
    assert.equal(logOverflow, false, 'Bounded process log overflow')
    assert.equal(state.forced, undefined, 'Owned process required forced cleanup')
  } }
  owned.push(owner)
  return owner
}

let browser, context, timer
const abort = new AbortController(), origin = 'http://127.0.0.1:5200/'
const fixture = resolve(root, 'work/hud-strictmode-fixture')
try {
  save()
  const memoryAvailable = Number(readFileSync('/proc/meminfo', 'utf8').match(/^MemAvailable:\s+(\d+) kB$/m)[1]) * 1024
  const disk = statfsSync(root)
  receipt.admission = { memoryAvailable, diskAvailable: disk.bavail * disk.bsize, freeInodes: disk.ffree }
  assert.ok(memoryAvailable >= 3.75 * 1024 ** 3); assert.ok(receipt.admission.diskAvailable >= 4 * 1024 ** 3); assert.ok(disk.ffree >= 50000)
  const server = startOwned([resolve(import.meta.dirname, 'strictmode-host.mjs'), root, output, expectedCommit], 'server.log')
  receipt.server = server.state
  const serverDeadline = Date.now() + 60000
  let response
  while (!response) {
    assert.equal(server.state.closed, false, 'Development host exited before readiness')
    try { response = await fetch(origin, { signal: AbortSignal.timeout(5000), redirect: 'error' }) }
    catch (error) {
      if (Date.now() >= serverDeadline || error.cause?.code !== 'ECONNREFUSED') throw error
      await new Promise(done => setTimeout(done, 200))
    }
  }
  assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /text\/html/)
  const html = await response.text(); assert.ok(Buffer.byteLength(html) < 1024 * 1024)
  writeFileSync(resolve(output, 'host-response.html'), html)
  browser = await chromium.launch(config.launch)
  receipt.browserVersion = browser.version(); assert.equal(receipt.browserVersion, '156.0.8078.79')
  const deadlineAt = Date.now() + 180000
  timer = setTimeout(() => { receipt.timedOut = true; abort.abort(Error('StrictMode shared deadline exceeded')); save(); void browser.close() }, 180000)
  for (const name of ['valid', 'blocked']) {
    context = await browser.newContext({ viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1, serviceWorkers: 'block', acceptDownloads: false })
    const page = await context.newPage(); page.setDefaultTimeout(25000)
    const diagnostic = (target, item) => { if (target.length >= 100) { receipt.diagnosticOverflow = true; return } target.push({ case: name, ...item }) }
    page.on('pageerror', error => diagnostic(receipt.errors, { type: 'pageerror', text: String(error) }))
    page.on('console', message => {
      if (message.type() === 'error') diagnostic(receipt.errors, { type: 'console', text: message.text(), location: message.location() })
      if (message.type() === 'warning') diagnostic(receipt.warnings, { text: message.text() })
    })
    const result = await strictmodeEpisode({ page, name, root, output, url: origin, deadlineAt, signal: abort.signal })
    assert.equal(result.status, 'passed'); assert.equal(result.captures.length, 2)
    receipt.cases.push(result)
    receipt.captures.push(...result.captures.map(file => ({ file, sha256: hash(resolve(output, file)) })))
    await context.close(); context = null
    assert.deepEqual(receipt.errors, []); assert.equal(receipt.diagnosticOverflow, undefined)
    save()
  }
  assert.equal(receipt.cases.length, 2); assert.equal(receipt.captures.length, 4)
  assert.equal(receipt.timedOut, undefined)
  receipt.status = 'passed'
} catch (error) {
  receipt.status = 'failed'; receipt.failure = error?.stack ?? String(error); process.exitCode = 1
} finally {
  clearTimeout(timer); receipt.cleanupErrors = []
  for (const [owner, close] of [['context', () => context?.close()], ['browser', () => browser?.close()], ...owned.map((owner, index) => ['process-' + index, () => owner.stop()])]) {
    try { await close() } catch (error) { receipt.cleanupErrors.push({ owner, error: String(error) }) }
  }
  try {
    for (const [path, digest] of Object.entries(source)) assert.equal(hash(resolve(root, path)), digest, path)
    assert.equal(git('diff', '--name-only', 'HEAD', '--'), '')
    assert.equal(dependencies(), depsBefore)
    for (const [name, digest] of Object.entries(infrastructure)) assert.equal(hash(resolve(import.meta.dirname, name)), digest, name)
    if (existsSync(resolve(output, 'host.json'))) {
      receipt.host = JSON.parse(readFileSync(resolve(output, 'host.json'), 'utf8'))
      assert.equal(receipt.host.closed, true); assert.notEqual(receipt.host.status, 'failed')
      assert.equal(receipt.host.originalHomeSha256, source['app/page.tsx'])
      assert.equal(hash(resolve(fixture, 'main.tsx')), receipt.host.mainSha256)
      assert.equal(hash(resolve(fixture, 'index.html')), receipt.host.htmlSha256)
      if (receipt.status === 'passed') assert.ok(receipt.host.transforms >= 1 && receipt.host.transforms <= 4)
    } else throw Error('Missing host cleanup receipt')
    receipt.inputsUnchanged = true
  } catch (error) { receipt.inputFailure = String(error); receipt.status = 'failed'; process.exitCode = 1 }
  receipt.cleanupVerified = receipt.cleanupErrors.length === 0
  if (!receipt.cleanupVerified) { receipt.status = 'failed'; process.exitCode = 1 }
  receipt.endedAt = new Date().toISOString(); save()
  console.log(JSON.stringify({ status: receipt.status, failure: receipt.failure, captures: receipt.captures.length, output }))
}
