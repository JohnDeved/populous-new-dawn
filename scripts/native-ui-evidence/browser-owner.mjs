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
export function ownBrowser(browser, output, report, { pauseTraceStorage } = {}) {
  const traces = pauseTraceStorage ? createPauseTraceOwner(pauseTraceStorage) : null
  if (traces) report.pauseClickTraces = traces.report
  let episode
  const active = new Set(), expected = new Map(), routeHandlers = new WeakMap(), pendingContexts = new Set(), pendingPages = new Set()
  let closed = false, admitting = false, generation = 0
  const cleanupFailures = []
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
  function instrumentPage(page) {
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
        instrumentPage(page)
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
      assert.equal(active.size, 0)
      const failure = results.find(result => result.status === 'rejected'); if (failure) throw failure.reason
      if (cleanupFailures.length) throw cleanupFailures[0]
    },
    async close() {
      closed = true; admitting = false; generation++
      await browser.close()
      await Promise.allSettled([...pendingContexts, ...pendingPages])
      for (const context of [...active]) await context.close()
      if (cleanupFailures.length) throw cleanupFailures[0]
    },
  }
}
