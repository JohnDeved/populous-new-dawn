import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, statfsSync, existsSync, openSync, writeSync, closeSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
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
const receipt = {
  status: 'running', side, commit: expectedCommit, tree: git('rev-parse', 'HEAD^{tree}'), source,
  scenarioSha256: hash(import.meta.filename), launch: config.launch, browserSha256: hash(config.browserPath),
  runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT,
  workflowCommit: process.env.GITHUB_SHA, startedAt: new Date().toISOString(), errors: [], warnings: [],
  checks: [], captures: [], limits: ['Exact candidate shipped Vinext/Cloudflare bundle served by local workerd; not deployed Cloudflare edge or a synthetic merge.',
    'Fresh Mission 1 through ordinary public controls. No seeded saves, injected world state, altered simulation time or supplied pixels.',
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
let browser, context, page, timer, nojsContext, buildInputs

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
  // A JavaScript-disabled document must already contain the server-rendered Home.
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
  timer = setTimeout(() => { receipt.timedOut = true; save(); void browser.close() }, 180000)
  for (const dpr of [1, 2]) {
    context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: dpr, serviceWorkers: 'block', acceptDownloads: false })
    page = await context.newPage(); page.setDefaultTimeout(25000)
    page.on('pageerror', error => { receipt.errors.push(String(error)); save() })
    page.on('console', message => { if (message.type() === 'error') receipt.errors.push(message.text()); if (message.type() === 'warning') receipt.warnings.push(message.text()) })
    const button = name => page.getByRole('button', { name, exact: true })
    const settle = () => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
    const observe = () => page.evaluate(() => {
      const w = window.testStore.getWorld(), scene = window.testSceneRef.current, gl = scene.renderer.getContext()
      const extension = gl.getExtension('WEBGL_debug_renderer_info'), node = document.querySelector('[data-original-pause-status]'), rect = node?.getBoundingClientRect()
      return { level: w.outcome.level, turn: w.turn, time: w.time, paused: w.paused, mode: w.mode, inputMask: w.inputMask,
        message: w.message, messageUntil: w.messageUntil, messageVisible: w.messageUntil > w.time,
        flybyFlags: w.flyby.flags,
        worldMessages: [...document.querySelectorAll('.world-message')].map(el => el.textContent),
        renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), webgl: gl.getParameter(gl.VERSION),
        pause: node ? { label: node.getAttribute('aria-label'), font: node.getAttribute('data-font'), pointerEvents: getComputedStyle(node).pointerEvents,
          x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height } : null,
        legacyPauseVisible: !!document.querySelector('.paused-badge'), viewport: [innerWidth, innerHeight], dpr: devicePixelRatio }
    })
    const capture = async name => {
      await settle(); const observation = await observe(), file = `${side}-${name}-dpr${dpr}.png`
      await page.screenshot({ path: resolve(output, file) })
      receipt.captures.push({ file, sha256: hash(resolve(output, file)), observation }); save()
      return observation
    }
    const navigation = await page.goto(origin, { waitUntil: 'domcontentloaded' })
    assert.equal(navigation.status(), 200)
    assert.equal(await page.locator('main.game-shell').count(), 1)
    await openCampaignFromMainMenu(page)
    await button('Start Mission 1').click()
    await bindGame(page)
    const initial = await observe()
    assert.equal(initial.level, 1)
    if (side === 'after') { assert.equal(initial.message, ''); assert.equal(initial.messageUntil, 0) }
    else assert.match(initial.message, /Select a brave and send them to the southern stone head/)
    receipt.checks.push({ name: `initial-startup-message-dpr${dpr}`, observation: initial }); save()
    await capture('initial-introduction-1440x1000')
    const skip = page.getByRole('button', { name: /Skip introduction/ })
    // Scene/store binding precedes the authored flyby and its public Skip UI.
    // Wait for that owner, then let the real control's click await DOM readiness.
    await page.waitForFunction(() => {
      const world = window.testStore.getWorld()
      return Boolean(world.flyby.flags & 1) || !world.inputMask
    })
    const introduction = await observe()
    let skipClicked = false
    if (introduction.inputMask) {
      try {
        await skip.click({ noWaitAfter: true })
        skipClicked = true
      } catch (error) {
        // Natural completion may remove Skip between observation and click.
        // Accept only a timeout after both real exit conditions are observed.
        if (error.name !== 'TimeoutError' || await skip.isVisible() ||
          await page.evaluate(() => Boolean(window.testStore.getWorld().inputMask))) throw error
      }
    }
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    receipt.checks.push({ name: `public-introduction-exit-dpr${dpr}`, before: introduction,
      skipClicked, after: await observe() }); save()
    await capture('startup-playing-1440x1000')
    await button('Pause game').click()
    await page.waitForFunction(() => window.testStore.getWorld().paused)
    const paused = await capture('paused-1440x1000')
    if (side === 'after') { assert.equal(paused.pause.label, 'Paused'); assert.equal(paused.pause.pointerEvents, 'none'); assert.equal(paused.legacyPauseVisible, false); assert.equal(paused.worldMessages.length, 0) }
    else assert.equal(paused.legacyPauseVisible, true)
    // Open authored message panels own keyboard input. Collapse their public
    // summaries while paused, preserving the exact message records and World.
    await collapseObservedCampaignMessages(page, { observe: observation => {
      receipt.checks.push({ name: `public-campaign-collapse-dpr${dpr}`, observation }); save()
    } })
    await button('Resume game').click()
    await page.waitForFunction(turn => !window.testStore.getWorld().paused && window.testStore.getWorld().turn > turn, paused.turn)
    if (side === 'after') assert.equal((await observe()).pause, null)
    await page.getByLabel('Island battlefield. Click to select, right-click to move, drag to select a group.', { exact: true })
      .click({ position: { x: 250, y: 200 } })
    for (const expected of [true, false, true]) {
      await page.keyboard.press('Space')
      await page.waitForFunction(paused => window.testStore.getWorld().paused === paused, expected)
    }
    receipt.checks.push({ name: `public-resume-repeated-space-dpr${dpr}`, observation: await observe() }); save()
    if (side === 'after') {
      const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
      await button('Game settings').click()
      await menu.waitFor({ state: 'visible' })
      await settle(); assert.equal((await observe()).pause, null)
      assert.equal(await button('Continue Game').evaluate(node => node === document.activeElement), true)
      // Space activates the naturally focused Continue Game button. The menu
      // must restore the prior paused state, not toggle the gameplay pause key.
      await page.keyboard.press('Space')
      await menu.waitFor({ state: 'hidden' })
      await page.locator('[data-original-pause-status]').waitFor({ state: 'visible' })
      assert.equal((await observe()).paused, true)
      await button('Game settings').click()
      await menu.waitFor({ state: 'visible' })
      await settle(); assert.equal((await observe()).pause, null)
      await page.keyboard.press('Escape')
      await menu.waitFor({ state: 'hidden' })
      await page.locator('[data-original-pause-status]').waitFor({ state: 'visible' })
      assert.equal((await observe()).paused, true)
      receipt.checks.push({ name: `paused-menu-space-escape-dpr${dpr}`, observation: await observe() }); save()
      for (const [width, height] of [[640, 480], [639, 480], [900, 360]]) {
        await page.setViewportSize({ width, height })
        const advisory = page.getByRole('button', { name: /^Continue anyway/ })
        if (await advisory.isVisible()) await advisory.click()
        const state = await capture(`paused-${width}x${height}`)
        assert.equal(state.paused, true); assert.equal(state.pause.font, String(width * height >= 307200 ? 3 : 4))
        assert.equal(state.pause.right, width - 2); assert.equal(state.pause.bottom, height); assert.equal(state.pause.pointerEvents, 'none')
      }
    }
    await context.close(); context = null; page = null
  }
  assert.deepEqual(receipt.errors, []); assert.equal(receipt.timedOut, undefined)
  assert.deepEqual(receipt.warnings.filter(text => /hydrat|server.rendered|didn.t match|#418|#423/i.test(text)), [], 'No hydration warnings')
  receipt.hydration = { publicControlsCompletedAtDpr: [1, 2], errors: [] }
  receipt.status = 'passed'
} catch (error) {
  receipt.status = 'failed'; receipt.failure = error.stack ?? String(error); process.exitCode = 1
  if (page && !page.isClosed()) try { await page.screenshot({ path: resolve(output, `${side}-failure.png`), timeout: 3000 }) } catch {}
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
    if (buildInputs) for (const [path, digest] of Object.entries(buildInputs)) assert.equal(hash(resolve(root, 'dist', path)), digest, 'Build input changed: ' + path)
    receipt.inputsUnchanged = true
  } catch (error) { receipt.inputFailure = String(error); receipt.status = 'failed'; process.exitCode = 1 }
  receipt.cleanupVerified = receipt.cleanupErrors.length === 0
  if (!receipt.cleanupVerified) { receipt.status = 'failed'; process.exitCode = 1 }
  receipt.endedAt = new Date().toISOString(); save()
  console.log(JSON.stringify({ side, status: receipt.status, failure: receipt.failure, captures: receipt.captures.length, output }))
}

