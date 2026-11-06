import assert from 'node:assert/strict'
import { readdirSync, lstatSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { limits } from './policy.mjs'
import { createPauseTraceOwner, inspectPauseTraceStorage } from './pause-click-trace.mjs'

export const pageActionTimeout = 25000

export function artifactInventory(root) {
  const files = []
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name)
      assert.equal(entry.isSymbolicLink(), false, 'Artifacts must not link source/build/dependencies')
      if (entry.isDirectory()) walk(path)
      else {
        assert.ok(entry.isFile())
        files.push({ path: relative(root, path), bytes: lstatSync(path).size })
      }
    }
  }
  walk(root)
  const bytes = files.reduce((sum, file) => sum + file.bytes, 0)
  const screenshots = files.filter(file => file.path.endsWith('.png')).length
  assert.ok(bytes <= limits.artifactBytes, 'Artifact byte budget exceeded')
  assert.ok(screenshots <= limits.screenshots, 'Screenshot budget exceeded')
  inspectPauseTraceStorage(root)
  return { bytes, screenshots, files }
}

// One browser, with all candidate-created contexts/pages inside the same owner.
// Capture actual injected request URLs at route.abort/fulfill, not broad console
// text filters. Runtime errors always fail, including inside fallback contexts.
export function ownBrowser(browser, output, report, { pauseTraceStorage, singleBufferScreenshot } = {}) {
  const traces = pauseTraceStorage ? createPauseTraceOwner(pauseTraceStorage) : null
  if (traces) report.pauseClickTraces = traces.report
  let episode
  const active = new Set(), expected = new Map(), routeHandlers = new WeakMap(), pendingContexts = new Set(), pendingPages = new Set()
  let closed = false, admitting = false, generation = 0
  const cleanupFailures = [], pendingBufferScreenshots = new Set()
  let screenshotClock = performance.now(), pendingBufferOperations = 0
  const bufferPolicy = singleBufferScreenshot
  if (bufferPolicy !== undefined) {
    assert.deepEqual(Object.keys(bufferPolicy).sort(), ['deadlineMs', 'signal'])
    assert.equal(typeof bufferPolicy.signal?.throwIfAborted, 'function')
    assert.ok(Number.isFinite(bufferPolicy.deadlineMs) && bufferPolicy.deadlineMs > screenshotClock)
    report.bufferScreenshot = { attempted: 0, succeeded: 0, pending: false, status: 'unused', bytes: 0, errors: [] }
  }
  function bufferGuard(context, page, epoch) {
    const now = performance.now()
    assert.ok(Number.isFinite(now) && now >= screenshotClock, 'Screenshot clock must not move backward')
    screenshotClock = now
    bufferPolicy.signal.throwIfAborted()
    assert.ok(now < bufferPolicy.deadlineMs, 'Original screenshot deadline exhausted')
    assert.ok(!closed && admitting && epoch === generation && active.has(context) &&
      context.pages().includes(page) && !page.isClosed(), 'Buffer screenshot lost owned page')
    assert.deepEqual(report.bufferScreenshot.errors, [], 'Earlier screenshot failure remains fatal')
    return bufferPolicy.deadlineMs - now
  }
  async function bufferScreenshot(page, context, epoch, screenshot, options) {
    const accounting = report.bufferScreenshot
    let ownsPending = false
    accounting.attempted++ // Reserve before validation or any asynchronous boundary.
    try {
      assert.equal(accounting.attempted, 1, 'Only one buffer screenshot attempt is admitted')
      const remaining = bufferGuard(context, page, epoch)
      assert.ok(options && Object.getPrototypeOf(options) === Object.prototype)
      assert.deepEqual(Reflect.ownKeys(options), ['timeout'], 'Only a timeout is admitted for the fixed viewport PNG')
      assert.ok(Number.isFinite(options.timeout) && options.timeout > 0 &&
        options.timeout <= 10000 && options.timeout <= remaining, 'Screenshot timeout exceeds the original allowance')
      assert.ok(artifactInventory(output).screenshots < limits.screenshots, 'Screenshot budget exceeded')
      const actionDeadline = screenshotClock + options.timeout
      const actionGuard = () => {
        const routeRemaining = bufferGuard(context, page, epoch)
        const remaining = Math.min(routeRemaining, actionDeadline - screenshotClock)
        assert.ok(remaining > 0, 'Original screenshot action deadline exhausted')
        return remaining
      }
      accounting.status = 'observing'; ownsPending = true
      pendingBufferOperations++; accounting.pending = true
      const observation = await page.evaluate(() => ({ viewport: { width: innerWidth, height: innerHeight },
        dpr: devicePixelRatio, userAgent: navigator.userAgent,
        renderers: [...document.querySelectorAll('.world-viewport canvas, canvas[data-world-scene]')].map(canvas => {
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
          if (!gl) return { kind: 'unavailable' }
          const debug = gl.getExtension('WEBGL_debug_renderer_info')
          return { kind: 'WebGL', renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
            vendor: gl.getParameter(debug ? debug.UNMASKED_VENDOR_WEBGL : gl.VENDOR), version: gl.getParameter(gl.VERSION) }
        }) }))
      const nativeRemaining = actionGuard()
      assert.deepEqual(observation.viewport, { width: 960, height: 720 }, 'Fixed screenshot viewport required')
      assert.equal(observation.dpr, 1, 'Fixed screenshot DPR required')
      report.observations.push({ screenshot: 'owned-buffer', ...observation })
      accounting.status = 'capturing'
      const result = await screenshot({ type: 'png', fullPage: false,
        timeout: Math.min(options.timeout, 10000, nativeRemaining) })
      actionGuard()
      assert.ok(Buffer.isBuffer(result) && result.length > 0 && result.length <= 8 * 1024 * 1024,
        'Owned screenshot must be a nonempty bounded PNG buffer')
      assert.equal(result.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Expected native PNG buffer')
      artifactInventory(output)
      actionGuard()
      accounting.succeeded = 1; accounting.bytes = result.length; accounting.status = 'succeeded'
      return result
    } catch (error) {
      accounting.status = 'failed'; accounting.errors.push(String(error))
      report.errors.push({ kind: 'buffer-screenshot', text: String(error) })
      throw error
    } finally { if (ownsPending) pendingBufferOperations--; accounting.pending = pendingBufferOperations > 0 }
  }
  const pageCount = () => [...active].reduce((n, context) => n + context.pages().length, 0)
  function instrumentRoutes(target) {
    const original = target.route.bind(target), unroute = target.unroute.bind(target)
    target.route = async (pattern, handler, options) => {
      const wrapped = async (route, request) => {
        const record = (kind, detail) => {
          const event = { url: route.request().url(), kind, detail }
          const pending = expected.get(event.url) ?? []
          pending.push(event); expected.set(event.url, pending); report.injectedRequests.push(event)
        }
        const proxy = new Proxy(route, { get(object, key) {
          if (key === 'abort') return reason => { record('abort', reason ?? 'failed'); return object.abort(reason) }
          if (key === 'fulfill') return options => {
            if (options?.status >= 400) record('http', options.status)
            return object.fulfill(options)
          }
          const value = object[key]; return typeof value === 'function' ? value.bind(object) : value
        } })
        return handler(proxy, request)
      }
      routeHandlers.set(handler, wrapped)
      return original(pattern, wrapped, options)
    }
    target.unroute = (pattern, handler) => unroute(pattern, handler ? routeHandlers.get(handler) ?? handler : undefined)
  }
  function instrumentPage(page, context, epoch) {
    assert.ok(pageCount() <= limits.maxPages, 'Page budget exceeded')
    page.setDefaultTimeout(pageActionTimeout); page.setDefaultNavigationTimeout(30000)
    instrumentRoutes(page)
    page.on('pageerror', error => report.errors.push({ kind: 'runtime', text: String(error) }))
    page.on('crash', () => report.errors.push({ kind: 'crash', text: 'Page crashed' }))
    page.on('console', message => {
      if (!['error', 'warning'].includes(message.type())) return
      const event = { kind: message.type(), text: message.text(), url: message.location().url }
      if (message.type() === 'warning') report.warnings.push(event)
      else if (expected.get(event.url)?.length && /^Failed to load resource: (net::ERR_FAILED|the server responded with a status of (404|500)\b)/.test(event.text)) {
        report.expectedErrors.push({ ...event, injection: expected.get(event.url).shift() })
      } else report.errors.push(event)
    })
    const screenshot = page.screenshot.bind(page)
    page.screenshot = async options => {
      if (bufferPolicy !== undefined) {
        const pending = bufferScreenshot(page, context, epoch, screenshot, options)
        pendingBufferScreenshots.add(pending)
        try { return await pending } finally { pendingBufferScreenshots.delete(pending) }
      }
      assert.ok(!closed && admitting, 'No screenshot after cleanup')
      assert.ok(options?.path && resolve(options.path).startsWith(resolve(output) + '/'), 'Screenshot must remain in evidence output')
      assert.ok(artifactInventory(output).screenshots < limits.screenshots, 'Screenshot budget exceeded')
      const observation = await page.evaluate(() => ({ viewport: { width: innerWidth, height: innerHeight },
        dpr: devicePixelRatio, userAgent: navigator.userAgent,
        renderers: [...document.querySelectorAll('.world-viewport canvas, canvas[data-world-scene]')].map(canvas => {
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
          if (!gl) return { kind: 'unavailable' }
          const debug = gl.getExtension('WEBGL_debug_renderer_info')
          return { kind: 'WebGL', renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
            vendor: gl.getParameter(debug ? debug.UNMASKED_VENDOR_WEBGL : gl.VENDOR), version: gl.getParameter(gl.VERSION) }
        }) }))
      report.observations.push({ screenshot: relative(output, resolve(options.path)), ...observation })
      const result = await screenshot({ ...options, timeout: Math.min(options.timeout ?? 10000, 10000) })
      artifactInventory(output)
      return result
    }
  }
  const create = browser.newContext.bind(browser)
  function createContext(options) {
    assert.ok(!closed && admitting, 'Browser owner is not admitting resources')
    assert.ok(active.size + pendingContexts.size < limits.maxContexts, 'Context budget exceeded')
    const epoch = generation
    const pending = Promise.resolve().then(() => create(options)).then(async context => {
      if (closed || !admitting || epoch !== generation) {
        try { await context.close() } catch (error) { cleanupFailures.push(error) }
        throw Error('Late context closed after cleanup')
      }
      active.add(context); instrumentRoutes(context)
      const newPage = context.newPage.bind(context)
      context.newPage = async () => {
        assert.ok(!closed && admitting && epoch === generation, 'No page creation after cleanup')
        assert.ok(pageCount() + pendingPages.size < limits.maxPages, 'Page budget exceeded')
        const pending = Promise.resolve().then(() => newPage()).then(async page => {
          if (closed || !admitting || epoch !== generation) {
            try { await page.close() } catch (error) { cleanupFailures.push(error) }
            throw Error('Late page closed after cleanup')
          }
          return page
        })
        pendingPages.add(pending)
        try { return await pending } finally { pendingPages.delete(pending) }
      }
      context.on('page', page => {
        if (closed || !admitting || epoch !== generation) { void page.close().catch(error => cleanupFailures.push(error)); return }
        instrumentPage(page, context, epoch)
      })
      context.on('close', () => active.delete(context))
      if (traces) {
        await traces.attach(context, episode)
        if (closed || !admitting || epoch !== generation) {
          try { await context.close() } catch (error) { cleanupFailures.push(error) }
          throw Error('Late traced context closed after cleanup')
        }
      }
      return context
    })
    pendingContexts.add(pending)
    return pending.finally(() => pendingContexts.delete(pending))
  }
  const owned = new Proxy(browser, { get(target, key) {
    if (key === 'newContext') return async options => createContext(options)
    if (['newPage', 'newBrowserCDPSession'].includes(key)) throw Error('Unowned browser API is not admitted')
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value
  } })
  return { browser: owned,
    beginEpisode(nextEpisode) { assert.equal(active.size + pendingContexts.size + pendingPages.size, 0); assert.equal(closed, false); expected.clear(); episode = nextEpisode; admitting = true },
    assertTraceEpisode(current) { traces?.assertEpisode(current) },
    finishTraces() { traces?.finish() },
    async closeContexts() {
      admitting = false; generation++
      const results = await Promise.allSettled([...active].map(context => context.close()))
      await Promise.allSettled([...pendingContexts, ...pendingPages])
      if (bufferPolicy !== undefined) await Promise.allSettled([...pendingBufferScreenshots])
      assert.equal(active.size, 0)
      const failure = results.find(result => result.status === 'rejected'); if (failure) throw failure.reason
      if (cleanupFailures.length) throw cleanupFailures[0]
    },
    async close() {
      closed = true; admitting = false; generation++
      await browser.close()
      await Promise.allSettled([...pendingContexts, ...pendingPages])
      for (const context of [...active]) await context.close()
      if (bufferPolicy !== undefined) await Promise.allSettled([...pendingBufferScreenshots])
      if (cleanupFailures.length) throw cleanupFailures[0]
    },
  }
}
