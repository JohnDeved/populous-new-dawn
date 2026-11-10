import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, lstatSync, statSync, symlinkSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [rootArg, outputArg, side, expectedCommit] = process.argv.slice(2)
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
const { preview } = await import(pathToFileURL(require.resolve('vite')).href)
const { browserConfiguration } = await import(pathToFileURL(resolve(root, 'scripts/tutorial-browser/browser-config.mjs')).href)
const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
const { openCampaignFromMainMenu } = await import(pathToFileURL(resolve(root, 'scripts/browser-new-game.mjs')).href)
const config = browserConfiguration()
assert.deepEqual(config.launch.args, ['--headless', '--remote-debugging-pipe'])
assert.equal(config.launch.chromiumSandbox, true)
const receipt = {
  status: 'running', side, commit: expectedCommit, tree: git('rev-parse', 'HEAD^{tree}'), source,
  scenarioSha256: hash(import.meta.filename), launch: config.launch, browserSha256: hash(config.browserPath),
  runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT,
  workflowCommit: process.env.GITHUB_SHA, startedAt: new Date().toISOString(), errors: [], warnings: [],
  checks: [], captures: [], limits: ['Actual production Home through Vite, not Vinext/Cloudflare/RSC hosting.',
    'Fresh Mission 1 through ordinary public controls. No seeded saves, injected world state, altered simulation time or supplied pixels.',
    'Software rendering is not hardware performance or original-game framebuffer equivalence.'],
}
const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
let browser, server, context, page, timer
try {
  save()
  const fixture = resolve(root, 'scripts/tutorial-browser/fixture'), dist = resolve(output, 'dist')
  receipt.build = await new Promise((done, reject) => {
    const child = spawn(process.execPath, [resolve(root, 'scripts/tutorial-browser/build-home.mjs'), fixture, dist], { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
    const chunks = []; let timedOut = false, force
    child.stdout.on('data', bytes => chunks.push(bytes)); child.stderr.on('data', bytes => chunks.push(bytes))
    const kill = signal => { try { process.kill(-child.pid, signal) } catch (error) { if (error.code !== 'ESRCH') throw error } }
    const cap = setTimeout(() => { timedOut = true; kill('SIGTERM'); force = setTimeout(() => kill('SIGKILL'), 3000) }, 120000)
    child.once('error', error => { clearTimeout(cap); clearTimeout(force); reject(error) })
    child.once('close', (code, signal) => { clearTimeout(cap); clearTimeout(force); writeFileSync(resolve(output, 'build.log'), Buffer.concat(chunks)); done({ code, signal, timedOut }) })
  })
  assert.equal(receipt.build.code, 0); assert.equal(receipt.build.timedOut, false)
  for (const entry of readdirSync(resolve(root, 'public'))) {
    const target = resolve(dist, entry); assert.equal(existsSync(target), false)
    symlinkSync(resolve(root, 'public', entry), target, lstatSync(resolve(root, 'public', entry)).isDirectory() ? 'dir' : 'file')
  }
  server = await preview({ configFile: false, root: fixture, build: { outDir: dist }, preview: { host: '127.0.0.1', port: 5198, strictPort: true } })
  browser = await chromium.launch(config.launch)
  receipt.browserVersion = browser.version()
  timer = setTimeout(() => { receipt.timedOut = true; save(); void browser.close() }, 180000)
  for (const dpr of side === 'after' ? [1, 2] : [1]) {
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
    await page.goto('http://127.0.0.1:5198', { waitUntil: 'domcontentloaded' })
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
    await button('Resume game').click()
    await page.waitForFunction(turn => !window.testStore.getWorld().paused && window.testStore.getWorld().turn > turn, paused.turn)
    if (side === 'after') assert.equal((await observe()).pause, null)
    await page.locator('.world-viewport canvas').click({ position: { x: 250, y: 200 } })
    for (const expected of [true, false, true]) {
      await page.keyboard.press('Space')
      await page.waitForFunction(paused => window.testStore.getWorld().paused === paused, expected)
    }
    receipt.checks.push({ name: `public-resume-repeated-space-dpr${dpr}`, observation: await observe() }); save()
    if (side === 'after') {
      await button('Game settings').click()
      await settle(); assert.equal((await observe()).pause, null)
      await page.keyboard.press('Space'); assert.equal((await observe()).paused, true)
      await page.keyboard.press('Escape')
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
  receipt.status = 'passed'
} catch (error) {
  receipt.status = 'failed'; receipt.failure = error.stack ?? String(error); process.exitCode = 1
  if (page && !page.isClosed()) try { await page.screenshot({ path: resolve(output, `${side}-failure.png`), timeout: 3000 }) } catch {}
} finally {
  clearTimeout(timer)
  receipt.cleanupErrors = []
  for (const [owner, close] of [['context', () => context?.close()], ['browser', () => browser?.close()], ['server', () => server?.close()]]) {
    try { await close() } catch (error) { receipt.cleanupErrors.push({ owner, error: String(error) }) }
  }
  try {
    for (const [path, digest] of Object.entries(source)) assert.equal(hash(resolve(root, path)), digest, path)
    assert.equal(git('diff', '--name-only', 'HEAD', '--'), '')
    assert.equal(dependencies(resolve(root, 'node_modules')), depsBefore)
    receipt.inputsUnchanged = true
  } catch (error) { receipt.inputFailure = String(error); receipt.status = 'failed'; process.exitCode = 1 }
  receipt.cleanupVerified = receipt.cleanupErrors.length === 0
  if (!receipt.cleanupVerified) { receipt.status = 'failed'; process.exitCode = 1 }
  receipt.endedAt = new Date().toISOString(); save()
  console.log(JSON.stringify({ side, status: receipt.status, failure: receipt.failure, captures: receipt.captures.length, output }))
}
