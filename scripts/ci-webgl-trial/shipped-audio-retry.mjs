import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, statfsSync, existsSync, openSync, writeSync, closeSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

const [rootArg, outputArg, expectedCommit] = process.argv.slice(2)
const side = 'audio-retry'
assert.ok(rootArg && outputArg && /^[0-9a-f]{40}$/.test(expectedCommit))
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
const require = createRequire(resolve(root, 'package.json'))
const { chromium } = require('@playwright/test')
const { browserConfiguration } = await import(pathToFileURL(resolve(root, 'scripts/tutorial-browser/browser-config.mjs')).href)
const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
const { openCampaignFromMainMenu } = await import(pathToFileURL(resolve(root, 'scripts/browser-new-game.mjs')).href)
const { default: audioRetryEpisode } = await import('./audio-retry-episode.mjs')
const episodePath = resolve(import.meta.dirname, 'audio-retry-episode.mjs')
const { assertEscapeRuntime } = await import(pathToFileURL(resolve(root, 'scripts/local-render/options-native-escape.mjs')).href)
const config = browserConfiguration()
assert.deepEqual(config.launch.args, ['--headless', '--remote-debugging-pipe'])
assert.equal(config.launch.chromiumSandbox, true)
const runtimePath = process.env.MINIFLARE_WORKERD_PATH
assert.ok(runtimePath && isAbsolute(runtimePath), 'Require the checksum-verified official local runtime')
const runtime = { path: runtimePath, sha256: hash(runtimePath),
  version: execFileSync(runtimePath, ['--version'], { encoding: 'utf8', timeout: 10000 }).trim(),
  release: 'https://github.com/cloudflare/workerd/releases/tag/v1.20261110.1',
  archiveSha256: '6d710b0f310e21383ee52fe8c71aa8cca3f51c2c04a48ec03e56868e97e1e65d' }
const receipt = {
  status: 'running', side, commit: expectedCommit, tree: git('rev-parse', 'HEAD^{tree}'), source,
  scenarioSha256: hash(import.meta.filename), episodeSha256: hash(episodePath), launch: config.launch, browserSha256: hash(config.browserPath),
  runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT,
  workflowCommit: process.env.GITHUB_SHA, startedAt: new Date().toISOString(), errors: [], warnings: [],
  runtime, checks: [], captures: [], limits: ['Exact candidate shipped local Worker using separately pinned official workerd v1.20261110.1; not the locked runtime, deployed edge or a synthetic merge.',
    'Public Mission 1 and Options controls with a disclosed single-WAV network fixture: bounded first-response hold, one synthetic HTTP 503, then real unchanged retry response.',
    'No audio-method replacement, injected World state, supplied successful sound bytes or waveform/native acoustic acceptance. No held music-stream, loading fullscreen, focused-portal race or StrictMode coverage.',
    'Four episode screenshots plus one no-JavaScript loading shell; default sandboxed SwiftShader is not hardware performance or original-game framebuffer equivalence.'],
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
let browser, context, page, timer, nojsContext, buildInputs
const abort = new AbortController()

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
  assertEscapeRuntime(process.platform, receipt.browserVersion, origin + '/')
  // A JavaScript-disabled document must already contain the server-rendered loading shell.
  nojsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block', acceptDownloads: false })
  const nojsPage = await nojsContext.newPage()
  const nojsResponse = await nojsPage.goto(origin, { waitUntil: 'domcontentloaded', timeout: 25000 })
  assert.equal(nojsResponse.status(), 200)
  assert.equal(await nojsPage.locator('main.game-shell').count(), 1)
  assert.match(await nojsPage.title(), /Populous/)
  await nojsPage.screenshot({ path: resolve(output, 'server-rendered-no-js.png') })
  receipt.ssr.noJavaScriptMain = true
  receipt.ssr.screenshot = { file: 'server-rendered-no-js.png', sha256: hash(resolve(output, 'server-rendered-no-js.png')) }
  await nojsContext.close(); nojsContext = null
  const deadlineAt = Date.now() + 180000
  timer = setTimeout(() => {
    receipt.timedOut = true; abort.abort(new Error('Options trial deadline exceeded')); save()
    void browser.close()
  }, 180000)
  context = await browser.newContext({ viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1,
    serviceWorkers: 'block', acceptDownloads: false })
  page = await context.newPage(); page.setDefaultTimeout(25000)
  page.on('pageerror', error => { receipt.errors.push({ type: 'pageerror', text: String(error) }); save() })
  page.on('console', message => {
    if (message.type() === 'error') receipt.errors.push({ type: 'console', text: message.text(), location: message.location() })
    if (message.type() === 'warning') receipt.warnings.push(message.text())
  })
  const navigation = await page.goto(origin, { waitUntil: 'domcontentloaded' })
  assert.equal(navigation.status(), 200)
  assert.equal(await page.locator('main.game-shell').count(), 1)
  await openCampaignFromMainMenu(page)
  await page.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => {
    const world = window.testStore.getWorld()
    return Boolean(world.flyby.flags & 1) || !world.inputMask
  })
  const observeStartup = () => page.evaluate(() => {
    const w = window.testStore.getWorld(), scene = window.testSceneRef.current, gl = scene.renderer.getContext()
    const extension = gl.getExtension('WEBGL_debug_renderer_info')
    return { level: w.outcome.level, turn: w.turn, time: w.time, paused: w.paused, inputMask: w.inputMask,
      renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      webgl: gl.getParameter(gl.VERSION), viewport: [innerWidth, innerHeight], dpr: devicePixelRatio }
  })
  const introduction = await observeStartup()
  assert.equal(introduction.level, 1)
  const skip = page.getByRole('button', { name: /Skip introduction/ })
  let skipClicked = false
  if (introduction.inputMask) {
    try { await skip.click({ noWaitAfter: true }); skipClicked = true }
    catch (error) {
      if (error.name !== 'TimeoutError' || await skip.isVisible() ||
        await page.evaluate(() => Boolean(window.testStore.getWorld().inputMask))) throw error
    }
  }
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
  const ready = await observeStartup()
  assert.equal(ready.level, 1); assert.equal(ready.paused, false)
  receipt.checks.push({ name: 'natural-mission1-public-introduction-exit', before: introduction, skipClicked, after: ready }); save()
  receipt.episode = await audioRetryEpisode({ page, root, output, deadlineAt,
    signal: abort.signal, revision: expectedCommit })
  assert.equal(receipt.episode.status, 'passed')
  assert.equal(receipt.episode.captures.length, 4)
  receipt.captures = receipt.episode.captures.map(file => ({ file, sha256: hash(resolve(output, file)),
    metadata: receipt.episode.captureMetadata.find(item => item.name === file) }))
  receipt.after = await observeStartup()
  await context.close(); context = null; page = null
  assert.equal(receipt.errors.length, 1, 'Exactly the deliberately supplied HTTP 503 may produce a console error')
  const expectedError = receipt.errors[0]
  assert.equal(expectedError.type, 'console')
  assert.equal(expectedError.location.url, receipt.episode.targetUrl)
  assert.match(expectedError.text, /^Failed to load resource: the server responded with a status of 503(?: \(Service Unavailable\))?$/)
  receipt.expectedNetworkError = expectedError
  assert.equal(receipt.timedOut, undefined)
  assert.deepEqual(receipt.warnings.filter(text => /hydrat|server.rendered|didn.t match|#418|#423/i.test(text)), [], 'No hydration warnings')
  receipt.hydration = { audioRetryCompletedAtDpr: [1], errors: [] }
  receipt.status = 'passed'
} catch (error) {
  receipt.status = 'failed'; receipt.failure = error?.stack ?? String(error); process.exitCode = 1
  // The four-image episode cap remains fixed, including after failure.
} finally {
  clearTimeout(timer)
  receipt.cleanupErrors = []
  for (const [owner, close] of [['nojsContext', () => nojsContext?.close()], ['context', () => context?.close()], ['browser', () => browser?.close()], ...owned.map((owner, index) => ['process-' + index, () => owner.stop()])]) {
    try { await close() } catch (error) { receipt.cleanupErrors.push({ owner, error: String(error) }) }
  }
  try {
    for (const [path, digest] of Object.entries(source)) assert.equal(hash(resolve(root, path)), digest, path)
    assert.equal(git('diff', '--name-only', 'HEAD', '--'), '')
    assert.equal(dependencies(resolve(root, 'node_modules')), depsBefore)
    assert.equal(hash(runtimePath), runtime.sha256, 'Official runtime bytes changed')
    assert.equal(hash(episodePath), receipt.episodeSha256, 'Episode source changed')
    assert.equal(hash(import.meta.filename), receipt.scenarioSha256, 'Runner source changed')
    if (buildInputs) for (const [path, digest] of Object.entries(buildInputs)) assert.equal(hash(resolve(root, 'dist', path)), digest, 'Build input changed: ' + path)
    receipt.inputsUnchanged = true
  } catch (error) { receipt.inputFailure = String(error); receipt.status = 'failed'; process.exitCode = 1 }
  receipt.cleanupVerified = receipt.cleanupErrors.length === 0
  if (!receipt.cleanupVerified) { receipt.status = 'failed'; process.exitCode = 1 }
  receipt.endedAt = new Date().toISOString(); save()
  console.log(JSON.stringify({ side, status: receipt.status, failure: receipt.failure, captures: receipt.captures.length, output }))
}

