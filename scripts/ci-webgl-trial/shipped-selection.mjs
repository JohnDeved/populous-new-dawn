import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, statfsSync, existsSync, openSync, writeSync, closeSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

const [rootArg, outputArg, expectedCommit] = process.argv.slice(2)
const side = 'selection-texture'
assert.ok(rootArg && outputArg)
assert.equal(expectedCommit, 'cd967306e82d42d60f731e1d90e808e46b7fa00e')
const root = resolve(rootArg), output = resolve(outputArg)
assert.ok(!existsSync(output), 'Use a fresh evidence directory')
mkdirSync(output, { recursive: true })
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
assert.equal(git('rev-parse', 'HEAD'), expectedCommit)
assert.equal(git('diff', '--name-only', 'HEAD', '--'), '')
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
const source = Object.fromEntries(tracked.map(path => [path, hash(resolve(root, path))]))
const dependencies = path => {
  const result = {}
  const walk = (dir, prefix = '') => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const name = prefix + entry.name, path = resolve(dir, entry.name)
      if (entry.isDirectory()) walk(path, name + '/')
      else if (entry.isFile()) { const s = statSync(path); result[name] = [s.size, s.mtimeMs] }
    }
  }
  walk(path)
  return createHash('sha256').update(JSON.stringify(result)).digest('hex')
}
const depsBefore = dependencies(resolve(root, 'node_modules'))
const trialInputs = Object.fromEntries(['shipped-selection.mjs', 'selection-episode.mjs']
  .map(name => [name, hash(new URL(name, import.meta.url))]))
const require = createRequire(resolve(root, 'package.json'))
const { chromium } = require('@playwright/test')
const { browserConfiguration } = await import(pathToFileURL(resolve(root, 'scripts/tutorial-browser/browser-config.mjs')).href)
const { runSelectionEpisode } = await import('./selection-episode.mjs')
const config = browserConfiguration()
assert.deepEqual(config.launch.args, ['--headless', '--remote-debugging-pipe'])
assert.equal(config.launch.chromiumSandbox, true)
const runtimePath = process.env.MINIFLARE_WORKERD_PATH
assert.ok(runtimePath && isAbsolute(runtimePath), 'Require the checksum-verified official local runtime')
const runtimeSha256 = hash(runtimePath)
assert.equal(runtimeSha256, '620d9f7e5eb461067e08af17316aaa087445b4232e0e98e3dd146763bd9ab394', 'Validate trusted runtime bytes before executing them')
const runtime = { path: runtimePath, sha256: runtimeSha256,
  version: execFileSync(runtimePath, ['--version'], { encoding: 'utf8', timeout: 10000 }).trim(),
  release: 'https://github.com/cloudflare/workerd/releases/tag/v1.20261110.1',
  archiveSha256: '6d710b0f310e21383ee52fe8c71aa8cca3f51c2c04a48ec03e56868e97e1e65d' }
assert.equal(runtime.version, 'workerd 2026-11-10')
assert.equal(runtime.sha256, '620d9f7e5eb461067e08af17316aaa087445b4232e0e98e3dd146763bd9ab394')
const receipt = {
  status: 'running', side, commit: expectedCommit, tree: git('rev-parse', 'HEAD^{tree}'), source,
  scenarioSha256: hash(import.meta.filename), launch: config.launch, browserSha256: hash(config.browserPath),
  runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT,
  workflowCommit: process.env.GITHUB_SHA, startedAt: new Date().toISOString(), errors: [], warnings: [],
  runtime, trialInputs, checks: [], captures: [], limits: ['Exact candidate shipped Vinext/Cloudflare bundle served by separately pinned official workerd v1.20261110.1 via the supported MINIFLARE_WORKERD_PATH override; not the old locked runtime, deployed Cloudflare edge or a synthetic merge.',
    'Exact candidate public campaign in two fresh contexts: one held then real-released selection.png response, one aborted selection.png request. These are explicit network-fault fixtures, not ordinary network acceptance. No supplied world state, storage seeds or synthetic rendered pixels.',
    'No native execution, audio/fullscreen, development StrictMode or current-main merge acceptance. Modal-loaded visibility is required only after public return and presentation resumes.',
    'Software rendering is not hardware performance or original-game framebuffer equivalence.'],
}
const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
const origin = 'http://127.0.0.1:5198'
const owned = []
// Each process group belongs only to this runner. Retain bounded logs and terminal outcomes.
function startOwned(args, logName) {
  const fd = openSync(resolve(output, logName), 'wx')
  let bytes = 0, logOverflow = false
  const child = spawn('pnpm', args, { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CLOUDFLARE_CF_FETCH_ENABLED: 'false', WRANGLER_SEND_METRICS: 'false' } })
  const state = { command: ['pnpm', ...args], pid: child.pid, code: null, signal: null, closed: false }
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
let browser, timer, buildInputs

try {
  save()
  const memoryAvailable = Number(readFileSync('/proc/meminfo', 'utf8').match(/^MemAvailable:\s+(\d+) kB$/m)[1]) * 1024
  const disk = statfsSync(root)
  receipt.admission = { memoryAvailable, diskAvailable: disk.bavail * disk.bsize, freeInodes: disk.ffree }
  assert.ok(memoryAvailable >= 3.75 * 1024 ** 3, 'Require 3.75 GiB available memory')
  assert.ok(receipt.admission.diskAvailable >= 4 * 1024 ** 3, 'Require 4 GiB available disk')
  assert.ok(disk.ffree >= 50000, 'Require 50000 free inodes')
  const build = startOwned(['run', 'build:cloudflare'], 'build.log')
  let buildTimer = setTimeout(() => { build.state.timedOut = true; build.kill('SIGTERM') }, 120000)
  let buildKill = setTimeout(() => build.kill('SIGKILL'), 125000)
  try { receipt.build = await build.terminal } finally { clearTimeout(buildTimer); clearTimeout(buildKill) }
  assert.equal(receipt.build.code, 0); assert.equal(receipt.build.timedOut, undefined)
  assert.equal(receipt.build.logOverflow, false)
  const generatedConfig = JSON.parse(readFileSync(resolve(root, 'dist/server/wrangler.json'), 'utf8'))
  const rejectRemote = value => {
    if (!value || typeof value !== 'object') return
    assert.notEqual(value.remote, true, 'Remote bindings are outside this local-only trial')
    for (const child of Object.values(value)) rejectRemote(child)
  }
  rejectRemote(generatedConfig)
  const snapshotBuild = () => {
    const result = {}
    const walk = (dir, prefix = '') => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const name = prefix + entry.name, path = resolve(dir, entry.name)
        if (entry.isDirectory()) walk(path, name + '/')
        else if (entry.isFile()) result[name] = hash(path)
        else throw Error('Unexpected generated non-regular input: ' + name)
      }
    }
    walk(resolve(root, 'dist'))
    return result
  }
  buildInputs = snapshotBuild()
  receipt.buildInputs = buildInputs
  const server = startOwned(['exec', 'wrangler', 'dev', '--local', '--config', 'dist/server/wrangler.json',
    '--ip', '127.0.0.1', '--port', '5198', '--inspector-port', '0'], 'server.log')
  receipt.server = server.state
  const deadline = Date.now() + 60000
  let response
  while (!response) {
    assert.equal(server.state.closed, false, 'Production server exited before readiness')
    try { response = await fetch(origin, { signal: AbortSignal.timeout(5000), redirect: 'error' }) }
    catch (error) {
      if (Date.now() >= deadline || error.cause?.code !== 'ECONNREFUSED') throw error
      await new Promise(done => setTimeout(done, 200))
    }
  }
  assert.equal(response.status, 200, 'Shipped SSR returned a non-200 response')
  assert.match(response.headers.get('content-type'), /text\/html/)
  const html = await response.text()
  assert.ok(Buffer.byteLength(html) < 8 * 1024 * 1024, 'Bound SSR HTML size')
  writeFileSync(resolve(output, 'initial-ssr.html'), html)
  receipt.ssr = { status: response.status, contentType: response.headers.get('content-type'),
    htmlSha256: hash(resolve(output, 'initial-ssr.html')), bytes: Buffer.byteLength(html) }
  browser = await chromium.launch(config.launch)
  receipt.browserVersion = browser.version()
  assert.equal(receipt.browserVersion, '156.0.8078.79')
  timer = setTimeout(() => {
    receipt.timedOut = true; save()
    void browser.close()
  }, 240000)
  receipt.episode = await runSelectionEpisode({ browser, sourceRoot: root,
    output: resolve(output, 'selection-episode'), expectedCommit })
  assert.equal(receipt.episode.status, 'passed-awaiting-pixel-review')
  assert.equal(receipt.episode.images.length, 3)
  receipt.captures = receipt.episode.images
  assert.equal(receipt.timedOut, undefined)
  receipt.status = 'passed-awaiting-pixel-review'
} catch (error) {
  receipt.status = 'failed'; receipt.failure = error?.stack ?? String(error); process.exitCode = 1
  // Do not add failure screenshots beyond the retained three-image selection cap.
} finally {
  clearTimeout(timer)
  receipt.cleanupErrors = []
  for (const [owner, close] of [['browser', () => browser?.close()], ...owned.map((owner, index) => ['process-' + index, () => owner.stop()])]) {
    try { await close() } catch (error) { receipt.cleanupErrors.push({ owner, error: String(error) }) }
  }
  try {
    for (const [path, digest] of Object.entries(source)) assert.equal(hash(resolve(root, path)), digest, path)
    assert.equal(git('diff', '--name-only', 'HEAD', '--'), '')
    assert.equal(dependencies(resolve(root, 'node_modules')), depsBefore)
    assert.equal(hash(runtimePath), runtime.sha256, 'Official runtime bytes changed')
    if (buildInputs) for (const [path, digest] of Object.entries(buildInputs)) assert.equal(hash(resolve(root, 'dist', path)), digest, 'Build input changed: ' + path)
    for (const [name, digest] of Object.entries(trialInputs)) assert.equal(hash(new URL(name, import.meta.url)), digest, name)
    receipt.inputsUnchanged = true
  } catch (error) { receipt.inputFailure = String(error); receipt.status = 'failed'; process.exitCode = 1 }
  receipt.cleanupVerified = receipt.cleanupErrors.length === 0
  if (!receipt.cleanupVerified) { receipt.status = 'failed'; process.exitCode = 1 }
  receipt.endedAt = new Date().toISOString(); save()
  console.log(JSON.stringify({ side, status: receipt.status, failure: receipt.failure, captures: receipt.captures.length, output }))
}

