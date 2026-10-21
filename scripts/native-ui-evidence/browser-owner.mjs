import assert from 'node:assert/strict'
import { readdirSync, lstatSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { limits } from './policy.mjs'

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
  return { bytes, screenshots, files }
}

// One browser, with all candidate-created contexts/pages inside the same owner.
// Capture actual injected request URLs at route.abort/fulfill, not broad console
// text filters. Runtime errors always fail, including inside fallback contexts.
export function ownBrowser(browser, output, report) {
  const active = new Set(), expected = new Map(), routeHandlers = new WeakMap()
  let closed = false, admitting = false
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
    assert.ok([...active].reduce((n, context) => n + context.pages().length, 0) <= limits.maxPages, 'Page budget exceeded')
    page.setDefaultTimeout(25000); page.setDefaultNavigationTimeout(30000)
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
      const result = await screenshot({ ...options, timeout: Math.min(options.timeout ?? 10000, 10000) })
      artifactInventory(output)
      return result
    }
  }
  const create = browser.newContext.bind(browser)
  const owned = new Proxy(browser, { get(target, key) {
    if (key === 'newContext') return async options => {
      assert.ok(!closed && admitting, 'Browser owner is not admitting resources')
      assert.ok(active.size < limits.maxContexts, 'Context budget exceeded')
      const context = await create(options)
      active.add(context); instrumentRoutes(context)
      context.on('page', instrumentPage)
      context.on('close', () => active.delete(context))
      return context
    }
    if (['newPage', 'newBrowserCDPSession'].includes(key)) throw Error('Unowned browser API is not admitted')
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value
  } })
  return { browser: owned,
    beginEpisode() { assert.equal(active.size, 0); assert.equal(closed, false); expected.clear(); admitting = true },
    async closeContexts() { admitting = false; for (const context of [...active]) await context.close(); assert.equal(active.size, 0) },
    async close() { closed = true; for (const context of [...active]) await context.close(); await browser.close() },
  }
}
