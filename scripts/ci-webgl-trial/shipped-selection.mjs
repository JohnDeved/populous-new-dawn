import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, statfsSync, existsSync, symlinkSync, lstatSync, openSync, writeSync, closeSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

const [rootArg, outputArg, expectedCommit] = process.argv.slice(2)
const side = 'compact-admission'
assert.ok(rootArg && outputArg)
assert.equal(expectedCommit, '648ad3d4c6ee11223053892cbe90b99fa033611a')
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
const trialInputs = Object.fromEntries(['shipped-selection.mjs']
  .map(name => [name, hash(new URL(name, import.meta.url))]))
const require = createRequire(resolve(root, 'package.json'))
const { chromium } = require('@playwright/test')
const { browserConfiguration } = await import(pathToFileURL(resolve(root, 'scripts/tutorial-browser/browser-config.mjs')).href)
const { default: runM2Functional } = await import(pathToFileURL(resolve(root, 'scripts/tutorial-browser/m2-pointer-f8.mjs')).href)
const { default: spellHypnotise } = await import(pathToFileURL(resolve(root, 'scripts/tutorial-browser/spell-hypnotise.mjs')).href)
const { createM2Checkpoint } = await import(pathToFileURL(resolve(root, 'scripts/tutorial-browser/m2-checkpoint.mjs')).href)
const { preview } = await import(pathToFileURL(require.resolve('vite')).href)
const config = browserConfiguration()
assert.deepEqual(config.launch.args, ['--headless', '--remote-debugging-pipe'])
assert.equal(config.launch.chromiumSandbox, true)
const receipt = {
  status: 'running', side, commit: expectedCommit, tree: git('rev-parse', 'HEAD^{tree}'), source,
  scenarioSha256: hash(import.meta.filename), launch: config.launch, browserSha256: hash(config.browserPath),
  runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT,
  workflowCommit: process.env.GITHUB_SHA, startedAt: new Date().toISOString(), errors: [], warnings: [],
  trialInputs, checks: [], captures: [], limits: ['Exact-head production Home through plain Vite, not shipped Vinext/Cloudflare/RSC or deployment.', 'Original compact lane: separate M2 compact/picking, Hypnotise and ownership contexts; unchanged per-episode and180s aggregate cap. Software rendering is not FPS evidence.'],
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
let browser, timer, buildInputs, server, m2Fixture
const fixture = resolve(root, 'scripts/tutorial-browser/fixture'), dist = resolve(output, 'dist')

try {
  save()
  const memoryAvailable = Number(readFileSync('/proc/meminfo', 'utf8').match(/^MemAvailable:\s+(\d+) kB$/m)[1]) * 1024
  const disk = statfsSync(root)
  receipt.admission = { memoryAvailable, diskAvailable: disk.bavail * disk.bsize, freeInodes: disk.ffree }
  assert.ok(memoryAvailable >= 3.75 * 1024 ** 3, 'Require 3.75 GiB available memory')
  assert.ok(receipt.admission.diskAvailable >= 4 * 1024 ** 3, 'Require 4 GiB available disk')
  assert.ok(disk.ffree >= 50000, 'Require 50000 free inodes')
  const build = startOwned(['exec', 'node', resolve(root, 'scripts/tutorial-browser/build-home.mjs'), fixture, dist], 'build.log')
  let buildTimer = setTimeout(() => { build.state.timedOut = true; build.kill('SIGTERM') }, 120000)
  let buildKill = setTimeout(() => build.kill('SIGKILL'), 125000)
  try { receipt.build = await build.terminal } finally { clearTimeout(buildTimer); clearTimeout(buildKill) }
  assert.equal(receipt.build.code, 0); assert.equal(receipt.build.timedOut, undefined)
  assert.equal(receipt.build.logOverflow, false)
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
    walk(dist)
    return result
  }
  buildInputs = snapshotBuild()
  receipt.buildInputs = buildInputs
  for (const entry of readdirSync(resolve(root, 'public'))) {
    const target = resolve(dist, entry); assert.equal(existsSync(target), false)
    symlinkSync(resolve(root, 'public', entry), target, lstatSync(resolve(root, 'public', entry)).isDirectory() ? 'dir' : 'file')
  }
  server = await preview({ configFile: false, root: fixture, build: { outDir: dist }, preview: { host: '127.0.0.1', port: 5198, strictPort: true } })
  m2Fixture = await createM2Checkpoint(output, { commit: expectedCommit, files: source })
  receipt.fixture = m2Fixture.receipt
  browser = await chromium.launch(config.launch)
  receipt.browserVersion = browser.version()
  assert.equal(receipt.browserVersion, '157.0.8103.50')
  const deadlineAt = Date.now() + 180000
  timer = setTimeout(() => {
    receipt.timedOut = true; save()
    void browser.close()
  }, 180000)
  receipt.episodes = []
  for (const [name, options] of [
    ['compact', { compactMessages: true }], ['picking', { pickingPaths: true }],
    ['hypnotise', null], ['callbacks', { campaignCallbacks: true }],
  ]) {
    assert.equal(receipt.timedOut, undefined)
    assert.equal(browser.isConnected(), true)
    assert.equal(browser.contexts().length, 0)
    const episodeOutput = resolve(output, name)
    mkdirSync(episodeOutput)
    const episode = name === 'hypnotise'
      ? await spellHypnotise({ browser, url: origin, output: episodeOutput, deadlineAt })
      : await runM2Functional({ browser, url: origin, output: episodeOutput, fixture: m2Fixture, ...options })
    assert.equal(episode.status, 'passed')
    assert.equal(episode.contextClosed, true)
    assert.deepEqual(episode.errors, [])
    receipt.episodes.push({ name, episode })
    for (const file of readdirSync(episodeOutput).filter(file => file.endsWith('.png')))
      receipt.captures.push({ name: name + '/' + file, sha256: hash(resolve(episodeOutput, file)) })
    save()
  }
  assert.equal(receipt.episodes.length, 4)
  assert.equal(browser.contexts().length, 0)
  assert.equal(receipt.timedOut, undefined)
  receipt.status = 'passed-awaiting-pixel-review'
} catch (error) {
  receipt.status = 'failed'; receipt.failure = error?.stack ?? String(error); process.exitCode = 1
  // Available episode diagnostics are retained; Hypnotise may have no failure PNG.
} finally {
  clearTimeout(timer)
  try {
    const retained = new Map(receipt.captures.map(capture => [capture.name, capture]))
    const collect = (directory, prefix = '') => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const name = prefix + entry.name, path = resolve(directory, entry.name)
        // Generated build/public assets are not diagnostic captures.
        if (!prefix && entry.name === 'dist') continue
        if (entry.isDirectory()) collect(path, name + '/')
        else if (entry.isFile() && name.endsWith('.png'))
          retained.set(name, { name, sha256: hash(path) })
      }
    }
    collect(output)
    receipt.captures = [...retained.values()]
  } catch (error) { receipt.captureHashFailure = String(error); receipt.status = 'failed'; process.exitCode = 1 }
  receipt.cleanupErrors = []
  for (const [owner, close] of [['browser', () => browser?.close()], ['server', () => server?.close()], ...owned.map((owner, index) => ['process-' + index, () => owner.stop()])]) {
    try { await close() } catch (error) { receipt.cleanupErrors.push({ owner, error: String(error) }) }
  }
  try {
    for (const [path, digest] of Object.entries(source)) assert.equal(hash(resolve(root, path)), digest, path)
    assert.equal(git('diff', '--name-only', 'HEAD', '--'), '')
    assert.equal(dependencies(resolve(root, 'node_modules')), depsBefore)
    if (buildInputs) for (const [path, digest] of Object.entries(buildInputs)) assert.equal(hash(resolve(dist, path)), digest, 'Build input changed: ' + path)
    for (const [name, digest] of Object.entries(trialInputs)) assert.equal(hash(new URL(name, import.meta.url)), digest, name)
    if (m2Fixture) {
      assert.equal(hash(resolve(output, 'm2-checkpoint-transfer.json')), m2Fixture.receipt.transferSha256)
      assert.equal(hash(resolve(output, 'm2-checkpoint.v8')), m2Fixture.receipt.checkpointSha256)
      receipt.fixtureUnchanged = true
    }
    receipt.inputsUnchanged = true
  } catch (error) { receipt.inputFailure = String(error); receipt.status = 'failed'; process.exitCode = 1 }
  receipt.cleanupVerified = receipt.cleanupErrors.length === 0
  if (!receipt.cleanupVerified) { receipt.status = 'failed'; process.exitCode = 1 }
  receipt.endedAt = new Date().toISOString(); save()
  console.log(JSON.stringify({ side, status: receipt.status, failure: receipt.failure, captures: receipt.captures.length, output }))
}

