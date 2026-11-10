import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [rootArg, outputArg, expectedCommit] = process.argv.slice(2)
const side = 'after'
assert.ok(rootArg && outputArg)
assert.equal(expectedCommit, '1f76849ea332c1328553f13f4819d46f92f82ee7')
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
  status: 'running', side, harnessCommit: expectedCommit, harnessTree: git('rev-parse', 'HEAD^{tree}'), source,
  scenarioSha256: hash(import.meta.filename), launch: config.launch, browserSha256: hash(config.browserPath),
  runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT,
  workflowCommit: process.env.GITHUB_SHA, startedAt: new Date().toISOString(), errors: [], warnings: [],
  checks: [], captures: [], limits: ['Live production URL with fresh browser contexts. Checkout identity binds observation helpers, not remotely served code. Deployment source attribution requires the separate deployment receipt and captured response hashes.',
    'Fresh Mission 1 through ordinary public controls. No seeded saves, injected world state, altered simulation time or supplied pixels.',
    'No-JavaScript inspection proves the initial loading shell only; public controls give scoped functional hydration evidence, not full UI equivalence.',
    'Software rendering is not hardware performance or original-game framebuffer equivalence.'],
}
const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
const origin = 'https://populous-new-dawn.webtorrent.workers.dev/'
receipt.origin = origin
receipt.network = []
const responseTasks = []
const observedResponses = new Set()
const publicHeaders = headers => Object.fromEntries(
  ['content-type', 'cache-control', 'etag', 'last-modified', 'cf-cache-status', 'cf-ray']
    .flatMap(name => headers[name] === undefined ? [] : [[name, headers[name]]]))
async function checkLiveIdentity(stage) {
  const url = new URL('pnd-build-identity.txt', origin).href
  const response = await fetch(url, { signal: AbortSignal.timeout(25000), redirect: 'error', cache: 'no-store' })
  assert.equal(response.status, 200, 'Production build identity must be present')
  assert.equal(response.url, url)
  const body = await response.text()
  assert.equal(body, `schema=1\nsource_sha=${expectedCommit}\n`, 'Production source changed or differs from the expected deployment')
  const file = `production-build-identity-${stage}.txt`
  writeFileSync(resolve(output, file), body)
  const entry = { stage, url, status: response.status, sourceSha: expectedCommit,
    observedAt: new Date().toISOString(), headers: publicHeaders(Object.fromEntries(response.headers)),
    file, sha256: hash(resolve(output, file)) }
  ;(receipt.productionIdentity ??= []).push(entry)
  save()
}
let browser, context, page, timer, nojsContext

try {
  save()
  await checkLiveIdentity('before')
  const response = await fetch(origin, { signal: AbortSignal.timeout(25000), redirect: 'error' })
  assert.equal(response.status, 200, 'Production returned a non-200 response')
  assert.equal(response.url, origin)
  assert.match(response.headers.get('content-type'), /text\/html/)
  const html = await response.text()
  assert.ok(Buffer.byteLength(html) < 8 * 1024 * 1024, 'Bound SSR HTML size')
  writeFileSync(resolve(output, 'initial-ssr.html'), html)
  receipt.ssr = { status: response.status, contentType: response.headers.get('content-type'),
    url: response.url, headers: publicHeaders(Object.fromEntries(response.headers)), htmlSha256: hash(resolve(output, 'initial-ssr.html')), bytes: Buffer.byteLength(html) }
  browser = await chromium.launch(config.launch)
  receipt.browserVersion = browser.version()
  // A JavaScript-disabled document must already contain the server-rendered Home.
  nojsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block', acceptDownloads: false })
  const nojsPage = await nojsContext.newPage()
  const nojsResponse = await nojsPage.goto(origin, { waitUntil: 'domcontentloaded', timeout: 25000 })
  assert.equal(nojsResponse.status(), 200)
  assert.equal(nojsResponse.url(), origin)
  assert.equal(nojsPage.url(), origin)
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
    page.on('response', response => {
      const url = response.url(), type = response.request().resourceType()
      if (new URL(url).origin !== new URL(origin).origin || !['script', 'stylesheet'].includes(type) || observedResponses.has(`${dpr}:${url}`)) return
      observedResponses.add(`${dpr}:${url}`)
      responseTasks.push((async () => {
        const entry = { dpr, url, type, status: response.status(), headers: publicHeaders(response.headers()) }
        try {
          const body = await response.body()
          entry.bytes = body.length
          entry.sha256 = createHash('sha256').update(body).digest('hex')
        } catch (error) { entry.error = String(error) }
        receipt.network.push(entry)
      })())
    })
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
    assert.equal(navigation.url(), origin)
    assert.equal(page.url(), origin)
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
    await Promise.all(responseTasks)
    await context.close(); context = null; page = null
  }
  assert.deepEqual(receipt.errors, []); assert.equal(receipt.timedOut, undefined)
  assert.deepEqual(receipt.warnings.filter(text => /hydrat|server.rendered|didn.t match|#418|#423/i.test(text)), [], 'No hydration warnings')
  assert.ok(receipt.network.some(entry => entry.type === 'script' && entry.status === 200 && entry.sha256), 'Capture actual production script bytes')
  assert.deepEqual(receipt.network.filter(entry => entry.error || entry.status !== 200), [], 'No failed script/style response')
  const assetManifest = dpr => receipt.network.filter(entry => entry.dpr === dpr)
    .map(({ url, type, sha256, bytes }) => ({ url, type, sha256, bytes }))
    .sort((a, b) => a.url.localeCompare(b.url))
  assert.deepEqual(assetManifest(2), assetManifest(1), 'Full script/style manifest changed between contexts')
  await checkLiveIdentity('after')
  receipt.hydration = { publicControlsCompletedAtDpr: [1, 2], errors: [] }
  receipt.status = 'passed'
} catch (error) {
  receipt.status = 'failed'; receipt.failure = error.stack ?? String(error); process.exitCode = 1
  if (page && !page.isClosed()) try { await page.screenshot({ path: resolve(output, `${side}-failure.png`), timeout: 3000 }) } catch {}
} finally {
  clearTimeout(timer)
  receipt.cleanupErrors = []
  for (const [owner, close] of [['nojsContext', () => nojsContext?.close()], ['context', () => context?.close()], ['browser', () => browser?.close()]]) {
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

