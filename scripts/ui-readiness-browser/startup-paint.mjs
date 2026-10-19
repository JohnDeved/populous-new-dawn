import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Diagnostic response gates only. The supplied production page owns all application state.
export default async function ({ page, context, url, output, servingDescription }) {
  const mode = process.env.POPULOUS_PREPARED_MODE
  assert.ok(['startup-inline-ssr', 'startup-critical-style-isolation'].includes(mode))
  const report = { mode, scope: mode === 'startup-inline-ssr' ? 'SSR inline artwork, hydration and real main-menu readiness' : 'Pre-hydration inline artwork and critical geometry with external stylesheets explicitly failed; no hydration or main-menu claim', stylesheetFailures: [], status: 'running', url, servingDescription, phases: [], requests: [], errors: [], routeErrors: [],
    limits: ['Controlled response holds are not a real network speed profile. The critical-style isolation case explicitly aborts stylesheets because pending blocking CSS prevents paint; this is a resource-failure diagnostic, not cold-network timing.',
      'Screenshots and bounded frame samples establish observed paint only, not every possible frame. Paint Timing entries are browser observations, not proof of zero black time before HTML delivery. Missing paint entries mean unavailable/not observed, never zero.',
      'Normal external blocking stylesheets may still delay paint. The stylesheet-abort case proves isolated critical layout, not normal cold-navigation paint timing.',
      'No application state, clocks, readiness, storage, or native timeout is injected or changed.',
      'Inline artwork is not fetched. This proves independence from external image responses, not a browser data-decode failure or universal zero-black startup.'] }
  const save = () => writeFileSync(resolve(output, 'startup.json'), JSON.stringify(report, null, 2) + '\n')
  const started = performance.now(), now = () => Math.round(performance.now() - started)
  const gate = () => { let release; const promise = new Promise(resolve => { release = resolve }); return {promise, release} }
  const scripts = gate(), label = gate(), frontend = gate()
  const scriptObserved = gate(), frontendObserved = gate()
  const observed = async (promise, name) => {
    let timer
    try {
      await Promise.race([promise, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${name} request was not observed within15000ms`)), 15000)
      })])
    } finally { clearTimeout(timer) }
  }
  let scriptReleased = false, labelReleased = mode !== 'startup-critical-style-isolation', frontendReleased = false
  let heldScripts = 0, heldFrontend = 0, heldImages = 0, labelRequests = 0, maskRequests = 0
  const releaseScripts = () => { if (scriptReleased) return; scriptReleased = true; scripts.release() }
  const releaseLabel = () => { if (labelReleased) return; labelReleased = true; label.release() }
  const releaseFrontend = () => { if (frontendReleased) return; frontendReleased = true; frontend.release() }
  let primaryError = null, cleanupError = null
  const activeRoutes = new Set()
  const handleRoute = async route => {
    const request = route.request(), path = new URL(request.url()).pathname
    if (path === '/original/loading-label.png') labelRequests++
    if (path === '/original/loading-mask.png') maskRequests++
    if (request.resourceType() === 'stylesheet' && mode === 'startup-critical-style-isolation') {
      report.stylesheetFailures.push({path, action: 'abort-failed', at: now()}); save()
      return route.abort('failed')
    }
    if (request.resourceType() === 'script' && !scriptReleased) {
      heldScripts++; scriptObserved.release(); await scripts.promise
    }
    if (request.resourceType() === 'image' && !labelReleased) {
      heldImages++; await label.promise
    }
    if (path === '/original/frontend/composition.bin' && !frontendReleased) {
      heldFrontend++; frontendObserved.release(); await frontend.promise
    }
    return route.continue()
  }
  // Never let an asynchronous routing rejection escape Node and bypass runner cleanup.
  // Errors remain failures; they are not discarded or retried.
  const route = requestRoute => {
    const task = handleRoute(requestRoute).catch(error => {
      report.routeErrors.push({ path: new URL(requestRoute.request().url()).pathname, message: String(error.stack ?? error) })
      save()
    })
    activeRoutes.add(task)
    void task.then(() => activeRoutes.delete(task))
    return task
  }
  const pageError = error => { report.errors.push(error.message); save() }
  page.on('pageerror', pageError)
  await context.route('**/*', route)
  const snapshot = () => page.evaluate(() => {
    const loading = document.querySelector('.loading-world'), art = document.querySelector('.loading-original-art')
    const label = document.querySelector('.loading-original-label img'), mask = document.querySelector('.loading-original-art > img')
    const text = document.querySelector('.loading-original-label > span'), note = document.querySelector('.loading-world > p')
    const inspect = element => {
      if (!element) return null
      const style = getComputedStyle(element), rect = element.getBoundingClientRect()
      return {text: element.textContent, clipPath: style.clipPath, display: style.display, visibility: style.visibility,
        width: rect.width, height: rect.height, x: rect.x, y: rect.y, hidden: element.hidden,
        source: element.getAttribute('src'), complete: element.complete, naturalWidth: element.naturalWidth, background: style.backgroundColor}
    }
    const paint = performance.getEntriesByType('paint').map(entry => ({name: entry.name, startTime: entry.startTime, duration: entry.duration}))
    const navigation = performance.getEntriesByType('navigation').map(entry => ({
      name: entry.name, type: entry.type, startTime: entry.startTime, duration: entry.duration,
      requestStart: entry.requestStart, responseStart: entry.responseStart, responseEnd: entry.responseEnd,
      domInteractive: entry.domInteractive, domContentLoadedEventStart: entry.domContentLoadedEventStart,
      domContentLoadedEventEnd: entry.domContentLoadedEventEnd, loadEventStart: entry.loadEventStart,
      loadEventEnd: entry.loadEventEnd, transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
    }))
    const stylesheetLinks = [...document.querySelectorAll('link[rel~="stylesheet"]')].map(link => ({
      href: link.href, media: link.media, disabled: link.disabled, sheetAvailable: !!link.sheet,
    }))
    const stylesheetUrls = new Set(stylesheetLinks.map(link => link.href))
    const stylesheetResources = performance.getEntriesByType('resource').filter(entry => stylesheetUrls.has(entry.name)).map(entry => ({
      name: entry.name, initiatorType: entry.initiatorType, startTime: entry.startTime, duration: entry.duration,
      responseStart: entry.responseStart, responseEnd: entry.responseEnd, transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize, decodedBodySize: entry.decodedBodySize,
    }))
    return {timing: {sampledAt: performance.now(), timeOrigin: performance.timeOrigin,
        paintStatus: paint.length ? 'observed' : 'not-yet-observed-or-unavailable', paint, navigation,
        stylesheetLinkCount: stylesheetLinks.length, stylesheetResourceCount: stylesheetResources.length,
        stylesheetLinks, stylesheetResources},
      viewport: {width: innerWidth, height: innerHeight}, loading: inspect(loading), art: inspect(art), label: inspect(label), mask: inspect(mask),
      text: inspect(text), note: inspect(note), phase: loading?.dataset.loadingPhase,
      labelReady: loading?.dataset.labelReady, maskFailed: loading?.dataset.maskFailed,
      preloads: [...document.querySelectorAll('link[rel="preload"][as="image"]')].map(link => link.getAttribute('href'))}
  })
  const phase = async name => {
    const result = await snapshot()
    report.phases.push({name, at: now(), result, heldScripts, heldFrontend, heldImages, labelRequests, maskRequests}); save()
    await page.screenshot({path: resolve(output, `${name}.png`), timeout: 5000})
    return result
  }
  const noGeneric = state => {
    assert.ok(state.loading, 'real loading surface exists')
    assert.equal(state.loading.background, 'rgb(0, 0, 0)')
    assert.equal(state.text?.clipPath, 'inset(50%)', 'generic label stays visually clipped')
    if (state.note) assert.equal(state.note.clipPath, 'inset(50%)', 'checkpoint note stays visually clipped')
    assert.equal(state.art.width, 130); assert.equal(state.art.height, 161)
    assert.ok(Math.abs(state.art.x - (state.viewport.width - 130) / 2) <= 1)
    assert.ok(Math.abs(state.art.y - (state.viewport.height - 161) / 2) <= 1)
    assert.equal(state.label.width, 82); assert.equal(state.label.height, 20)
    assert.equal(state.label.y - state.art.y, -26)
  }
  const samples = async () => {
    for (let i = 0; i < 12; i++) {
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)))
      noGeneric(await snapshot())
    }
  }
  save()
  try {
    const response = await page.goto(url, {waitUntil: 'commit', timeout: 25000})
    assert.ok(response?.ok(), 'production document request succeeds')
    report.responseHeaders = await response.allHeaders(); save()
    await page.locator('.loading-world').waitFor({state: 'attached', timeout: 15000})
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.loading-world')).backgroundColor === 'rgb(0, 0, 0)', null, {timeout: 15000})
    await observed(scriptObserved.promise, 'Hydration script')
    assert.ok(heldScripts > 0, 'actual hydration scripts are held')
    await page.waitForFunction(() => document.querySelector('.loading-original-art > img')?.naturalWidth > 0 && document.querySelector('.loading-original-label img')?.naturalWidth > 0, null, {timeout: 15000})
    const state = await phase('01-inline-art-before-hydration')
    noGeneric(state)
    assert.equal(state.mask.naturalWidth, 130)
    assert.equal(state.label.naturalWidth, 82)
    assert.equal(state.label.hidden, false)
    assert.equal(state.labelReady, 'false', 'not gated on hydration image callbacks')
    for (const [image, expected] of [[state.mask, 'baacd745948a9f02fff7f2d4ba2ad3b509fe533f4fee5ad820a8aab5db3f0960'],
      [state.label, '9b5344c17384895329eea031ab56c0243600022970bdfb814ed7ce25feb625c9']]) {
      assert.ok(image.source.startsWith('data:image/png;base64,'))
      assert.equal(createHash('sha256').update(Buffer.from(image.source.split(',')[1], 'base64')).digest('hex'), expected)
    }
    assert.equal(labelRequests, 0); assert.equal(maskRequests, 0)
    await samples()
    if (mode === 'startup-critical-style-isolation') {
      assert.ok(report.stylesheetFailures.length > 0, 'actual external stylesheets were explicitly failed')
      assert.equal(scriptReleased, false, 'isolation proof is before hydration')
    } else {
    releaseScripts()
    await page.waitForFunction(() => document.querySelector('.loading-world')?.dataset.labelReady === 'true', null, {timeout: 15000})
    noGeneric(await phase('02-inline-art-after-hydration'))
    await samples()
    await observed(frontendObserved.promise, 'Frontend composition')
    assert.ok(heldFrontend > 0, 'actual frontend preparation remained gated for inspection')
    releaseLabel(); releaseFrontend()
    await page.locator('[data-original-main-menu]').waitFor({state: 'visible', timeout: 20000})
    assert.equal(await page.locator('.loading-world').count(), 0, 'actual preparation clears loading')
    await phase('04-main-menu-after-real-readiness')
    assert.equal(labelRequests, 0); assert.equal(maskRequests, 0)
    assert.deepEqual(report.errors, [])
    }
    assert.deepEqual(report.errors, [])
    report.status = 'checks-passed-cleanup-pending'; save()
  } catch (error) {
    report.status = 'failed'; report.failure = error.stack ?? String(error); save()
    await page.screenshot({path: resolve(output, 'failed.png'), timeout: 5000}).catch(() => {})
    primaryError = error
  } finally {
    releaseScripts(); releaseLabel(); releaseFrontend()
    let timer
    try {
      // This fresh context contains only this helper's route. The wait behavior
      // drains callbacks BEFORE interception is removed, unlike unroute(default).
      await Promise.race([context.unrouteAll({ behavior: 'wait' }), new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error('Startup route cleanup exceeded3000ms')
          error.name = 'DiagnosticTimeoutError'; reject(error)
        }, 3000)
      })])
      assert.equal(activeRoutes.size, 0, 'Every held route callback settled before teardown')
      report.routeCleanup = { status: 'drained', activeRoutes: activeRoutes.size }
    } catch (error) {
      cleanupError = error
      report.routeCleanup = { status: 'failed', activeRoutes: activeRoutes.size, error: String(error.stack ?? error) }
    } finally { clearTimeout(timer); page.off('pageerror', pageError) }
    report.status = primaryError || cleanupError || report.routeErrors.length || report.errors.length ? 'failed' : 'passed'
    save()
  }
  if (cleanupError?.name === 'DiagnosticTimeoutError') {
    if (primaryError) cleanupError.cause = primaryError
    throw cleanupError
  }
  if (primaryError) throw primaryError
  if (cleanupError) throw cleanupError
  assert.deepEqual(report.errors, [], 'Page errors are real diagnostic failures')
  assert.deepEqual(report.routeErrors, [], 'Routing errors are real diagnostic failures')
  return {status: report.status, mode, phases: report.phases.length}
}
