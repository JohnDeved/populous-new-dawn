import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, statfsSync, existsSync, openSync, writeSync, closeSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

const [rootArg, outputArg, expectedCommit] = process.argv.slice(2)
const side = 'after'
assert.ok(rootArg && outputArg && ['before', 'after'].includes(side) && /^[0-9a-f]{40}$/.test(expectedCommit))
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
const { collapseObservedCampaignMessages } = await import(pathToFileURL(resolve(root, 'scripts/public-keyboard-owner.mjs')).href)
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
  scenarioSha256: hash(import.meta.filename), launch: config.launch, browserSha256: hash(config.browserPath),
  runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT,
  workflowCommit: process.env.GITHUB_SHA, startedAt: new Date().toISOString(), errors: [], warnings: [],
  runtime, checks: [], captures: [], limits: ['Exact candidate shipped Vinext/Cloudflare bundle served by separately pinned official workerd v1.20261110.1 via the supported MINIFLARE_WORKERD_PATH override; not the old locked runtime, deployed Cloudflare edge or a synthetic merge.',
    'Maintained compact-status scenario uses public Mission 1 input, real feedback and UI save/load. Tutorial loading intentionally holds and continues one real landscape request. No seeded saves, injected world state, altered simulation time or supplied pixels.',
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
let browser, context, page, timer, totalTimer, nojsContext, buildInputs

try {
  save()
  // Fail this larger sequence within seven minutes, leaving the outer eight-minute
  // step time for normal process/browser cleanup and terminal evidence retention.
  totalTimer = setTimeout(() => {
    receipt.totalTimedOut = true
    save()
    for (const owner of owned) owner.kill('SIGTERM')
    void browser?.close()
  }, 420000)
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
  // JavaScript-disabled loading-shell SSR is separate from hydrated gameplay acceptance.
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
  // The maintained scenario owns its fresh contexts and uses only public inputs.
  // This wrapper records errors and warnings for every page without changing game state.
  const controller = new AbortController()
  timer = setTimeout(() => {
    receipt.timedOut = true
    controller.abort(new Error('Bounded acceptance deadline exceeded'))
    save()
    void browser.close()
  }, 300000)
  const observedContexts = []
  const scenarioBrowser = {
    async newContext(options) {
      const next = await browser.newContext({ ...options, serviceWorkers: 'block', acceptDownloads: false })
      observedContexts.push(next)
      next.on('page', p => {
        p.on('pageerror', error => { receipt.errors.push(String(error)); save() })
        p.on('console', message => {
          if (message.type() === 'error') receipt.errors.push(message.text())
          if (message.type() === 'warning') receipt.warnings.push(message.text())
        })
      })
      return next
    },
  }
  const compactPath = resolve(import.meta.dirname, 'compact-status-pause-trial.mjs')
  const { default: compact } = await import(pathToFileURL(compactPath).href)
  receipt.compactScenarioSha256 = hash(compactPath)
  receipt.maintainedCompactSourceSha256 = hash(resolve(root, 'scripts/local-render/compact-status-pause.mjs'))
  receipt.compactAdapter = 'Exact maintained scenario with bounded visible-metric readiness before unchanged F8 assertions, plus diagnostic observations/screenshots; separate experiment file, no candidate source mutation.'
  receipt.compact = await compact({ browser: scenarioBrowser, url: origin, root, output, signal: controller.signal })
  assert.equal(receipt.compact.status, 'passed')
  assert.deepEqual(receipt.compact.errors, [])
  assert.equal(browser.contexts().length, 0, 'Compact scenario must close its contexts')
  save()

  // Fresh Tutorial entry with one held real landscape request establishes the
  // loading input guard. It supplies no response pixels, data or World state.
  context = await scenarioBrowser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  page = await context.newPage()
  page.setDefaultTimeout(25000)
  const button = name => page.getByRole('button', { name, exact: true })
  const settle = () => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  const { waitForStartupMenu } = await import(pathToFileURL(resolve(root, 'scripts/browser-new-game.mjs')).href)
  let releaseLandscape
  const landscapeHeld = new Promise(resolve => { releaseLandscape = resolve })
  let landscapeRequests = 0
  await page.route('**/original/landscape.bin', async route => {
    landscapeRequests++
    await landscapeHeld
    await route.continue()
  })
  try {
    await page.goto(origin, { waitUntil: 'domcontentloaded' })
    await waitForStartupMenu(page)
    await button('Tutorial').click()
    await page.locator('[data-loading-phase="loading"]').waitFor({ state: 'visible' })
    const routeDeadline = Date.now() + 25000
    while (!landscapeRequests && Date.now() < routeDeadline) await new Promise(done => setTimeout(done, 20))
    assert.equal(landscapeRequests, 1, 'Exactly one real landscape request must be held before input')
    await page.keyboard.press('Space')
    await settle()
    assert.equal(await page.locator('[data-loading-phase="loading"]').isVisible(), true)
    assert.equal(await page.locator('[data-original-pause-status]').count(), 0)
    assert.equal(await page.locator('[data-original-pause-menu]').count(), 0)
    await page.screenshot({ path: resolve(output, 'tutorial-loading-input-guard.png') })
    receipt.checks.push({ name: 'tutorial-loading-space-guard', controlledSetup: 'One real landscape request held, then continued without replacement data.' })
    save()
  } finally { releaseLandscape() }
  await bindGame(page)
  assert.equal(landscapeRequests, 1, 'Exactly one real Tutorial landscape request was held')
  await page.waitForFunction(() => window.testStore.getWorld().ai.variables[9] === 2)
  const observeTutorial = () => page.evaluate(() => {
    const world = window.testStore.getWorld(), scene = window.testSceneRef.current, gl = scene.renderer.getContext()
    const extension = gl.getExtension('WEBGL_debug_renderer_info')
    return { level: world.outcome.level, stage: world.ai.variables[9], turn: world.turn, time: world.time,
      paused: world.paused, drawMode: world.drawMode, overview: scene.overviewActive,
      message: world.message, messageUntil: world.messageUntil,
      authoredText: [...document.querySelectorAll('.campaign-messages details[open] p')].map(el => el.textContent),
      pauseLabel: document.querySelector('[data-original-pause-status]')?.getAttribute('aria-label') ?? null,
      renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      webgl: gl.getParameter(gl.VERSION), viewport: [innerWidth, innerHeight], dpr: devicePixelRatio }
  })
  const opening = await observeTutorial()
  assert.equal(opening.level, 79); assert.equal(opening.drawMode, 2); assert.equal(opening.overview, true)
  assert.equal(opening.message, ''); assert.equal(opening.messageUntil, 0)
  assert.ok(opening.authoredText.some(text => text.trim().length > 0), 'Original Tutorial opening text must be visible')
  await page.screenshot({ path: resolve(output, 'tutorial-authored-opening.png') })
  await button('Pause game').click()
  await page.waitForFunction(() => window.testStore.getWorld().paused)
  await collapseObservedCampaignMessages(page, { observe: observation => {
    receipt.checks.push({ name: 'tutorial-opening-public-collapse', observation }); save()
  } })
  await button('Resume game').click()
  await page.waitForFunction(() => !window.testStore.getWorld().paused)
  await page.getByLabel('Island battlefield. Click to select, right-click to move, drag to select a group.', { exact: true })
    .click({ position: { x: 250, y: 200 } })
  assert.equal((await observeTutorial()).stage, 2, 'Public focus click must preserve the opening stage')
  assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('button,summary,input,select,textarea,[contenteditable]'))), false)
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => window.testStore.getWorld().ai.variables[9] === 3)
  await page.locator('.campaign-messages').getByText(/Move the mouse pointer to the edge/).waitFor()
  await button('Pause game').click()
  await page.locator('[data-original-pause-status]').waitFor({ state: 'visible' })
  const pausedTutorial = await observeTutorial()
  assert.equal(pausedTutorial.paused, true); assert.equal(pausedTutorial.pauseLabel, 'Paused')
  assert.ok(pausedTutorial.authoredText.some(text => /Move the mouse pointer to the edge/.test(text)))
  await page.screenshot({ path: resolve(output, 'tutorial-authored-paused.png') })
  await button('Game settings').click()
  await page.getByRole('dialog', { name: 'Game menu', exact: true }).waitFor({ state: 'visible' })
  assert.equal(await page.locator('[data-original-pause-status]').count(), 0)
  await button('Continue Game').click()
  await page.locator('[data-original-pause-status]').waitFor({ state: 'visible' })
  const restoredTutorial = await observeTutorial()
  assert.equal(restoredTutorial.paused, true)
  assert.equal(restoredTutorial.turn, pausedTutorial.turn)
  assert.deepEqual(restoredTutorial.authoredText, pausedTutorial.authoredText)
  receipt.checks.push({ name: 'tutorial-authored-opening-and-paused-menu-preservation', opening, paused: pausedTutorial, restored: restoredTutorial })
  save()
  await context.close(); context = null; page = null
  assert.equal(browser.contexts().length, 0)
  receipt.captures = readdirSync(output).filter(file => file.endsWith('.png')).sort().map(file => {
    const path = resolve(output, file), bytes = readFileSync(path)
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    return { file, sha256: hash(path), bytes: bytes.length, physicalWidth: bytes.readUInt32BE(16), physicalHeight: bytes.readUInt32BE(20) }
  })
  assert.ok(receipt.captures.length <= 32, 'Bound the maintained compact plus Tutorial capture inventory')
  assert.deepEqual(receipt.errors, []); assert.equal(receipt.timedOut, undefined); assert.equal(receipt.totalTimedOut, undefined)
  assert.deepEqual(receipt.warnings.filter(text => /hydrat|server.rendered|didn.t match|#418|#423/i.test(text)), [], 'No hydration warnings')
  receipt.acceptance = { compact: 'passed', tutorialOpeningAndPause: 'passed', controlledLoadingGuard: 'passed' }
  receipt.status = 'passed'
} catch (error) {
  receipt.status = 'failed'; receipt.failure = error.stack ?? String(error); process.exitCode = 1
  if (page && !page.isClosed()) try { await page.screenshot({ path: resolve(output, `${side}-failure.png`), timeout: 3000 }) } catch {}
} finally {
  clearTimeout(timer); clearTimeout(totalTimer)
  receipt.cleanupErrors = []
  for (const [owner, close] of [['nojsContext', () => nojsContext?.close()], ['context', () => context?.close()], ['browser', () => browser?.close()], ...owned.map((owner, index) => ['process-' + index, () => owner.stop()])]) {
    try { await close() } catch (error) { receipt.cleanupErrors.push({ owner, error: String(error) }) }
  }
  try {
    for (const [path, digest] of Object.entries(source)) assert.equal(hash(resolve(root, path)), digest, path)
    assert.equal(git('diff', '--name-only', 'HEAD', '--'), '')
    assert.equal(dependencies(resolve(root, 'node_modules')), depsBefore)
    assert.equal(hash(runtimePath), runtime.sha256, 'Official runtime bytes changed')
    if (buildInputs) for (const [path, digest] of Object.entries(buildInputs)) assert.equal(hash(resolve(root, 'dist', path)), digest, 'Build input changed: ' + path)
    receipt.inputsUnchanged = true
  } catch (error) { receipt.inputFailure = String(error); receipt.status = 'failed'; process.exitCode = 1 }
  receipt.cleanupVerified = receipt.cleanupErrors.length === 0
  if (!receipt.cleanupVerified) { receipt.status = 'failed'; process.exitCode = 1 }
  receipt.endedAt = new Date().toISOString(); save()
  console.log(JSON.stringify({ side, status: receipt.status, failure: receipt.failure, captures: receipt.captures.length, output }))
}

