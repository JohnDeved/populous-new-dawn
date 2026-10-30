import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

// This reviewed zero-import closure is deliberately pinned, never auto-generated.
// Changing the helper requires requalification by the AST and native-ESM tests.
export const SPY_HELPER = Object.freeze({ path: 'scripts/controlled-scene-frames.mjs',
  sha256: '7ec23575119be18bb18ddba834c393527ed8a93f321a1b5a0acf4e82410270ee',
  bytes: 4308, imports: Object.freeze([]) })
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

export function qualifySpyHelper(bytes) {
  assert.ok(Buffer.isBuffer(bytes), 'Delivery requires original helper Buffer')
  assert.equal(bytes.length, SPY_HELPER.bytes, 'Requalify changed helper closure')
  assert.equal(hash(bytes), SPY_HELPER.sha256, 'Requalify changed helper closure')
  return { ...SPY_HELPER, imports: [] }
}

// Test-owned native ESM delivery, NOT a production asset or a source transform.
export async function installSpyHelperDelivery({ page, url, bytes, deadlineAt, report }) {
  const qualified = qualifySpyHelper(bytes), body = Buffer.from(bytes)
  const endpoint = new URL('/' + qualified.path, url)
  assert.ok(['http:', 'https:'].includes(endpoint.protocol))
  assert.equal(endpoint.username, ''); assert.equal(endpoint.password, '')
  const href = endpoint.href
  const result = { version: 1, method: 'test-routed-native-esm',
    cachePolicy: 'playwright-routing-disables-http-cache', ...qualified,
    origin: endpoint.origin, pathname: endpoint.pathname, url: href,
    requests: 0, fulfilled: 0, installed: false, removed: false, routeRemoved: false, listenerRemoved: false,
    preflight: null, cacheReused: false, error: null }
  report.delivery = result
  let active = false, closed = false, reserved = false
  const pending = []
  const remember = error => { result.error ??= String(error) }
  const request = req => { if (req.url() === href) result.requests++ }
  const handle = async route => {
    try {
      const req = route.request()
      assert.ok(active && Date.now() < deadlineAt, 'Helper delivery outside owned epoch/deadline')
      assert.equal(req.url(), href); assert.equal(req.method(), 'GET')
      assert.equal(req.resourceType(), 'script')
      assert.equal(req.frame(), page.mainFrame(), 'Helper must belong to the main page')
      assert.equal(reserved, false, 'Helper must be delivered exactly once')
      reserved = true // Reserve before await, including overlapping requests.
      await route.fulfill({ status: 200, contentType: 'text/javascript',
        headers: { 'cache-control': 'no-store' }, body })
      result.fulfilled++
    } catch (error) {
      remember(error)
      await route.abort('failed').catch(remember)
    }
  }
  const handler = route => { const task = handle(route); pending.push(task); return task }
  const close = async () => {
    if (closed) return result
    closed = true; active = false
    try {
      await page.unroute(href, handler)
      result.routeRemoved = true
    } catch (error) { remember(error) }
    try { page.off('request', request); result.listenerRemoved = true }
    catch (error) { remember(error) }
    result.removed = result.routeRemoved && result.listenerRemoved
    return result
  }
  try {
    page.on('request', request)
    await page.route(href, handler)
    active = true; result.installed = true
  } catch (error) { remember(error); await close(); throw error }
  return { result, close,
    async preflight() {
      assert.equal(result.preflight, null)
      assert.ok(active && Date.now() < deadlineAt)
      assert.equal(new URL(page.url()).origin, endpoint.origin, 'Preview origin changed')
      const timeout = Math.min(8000, deadlineAt - Date.now())
      const [response, exports] = await Promise.all([
        page.waitForResponse(r => r.url() === href, { timeout }),
        page.evaluate(async href => {
          const module = await import(href)
          return { keys: Object.keys(module).sort(), frameMs: module.CONTROLLED_FRAME_MS,
            runType: typeof module.runSceneFrames }
        }, href),
      ])
      await Promise.all(pending) // Response arrival alone does not settle route.fulfill.
      const received = await response.body()
      assert.equal(response.status(), 200)
      assert.match(response.headers()['content-type'], /^text\/javascript(?:;|$)/)
      assert.ok(received.equals(body), 'Native module response differs from qualified bytes')
      assert.deepEqual(exports, { keys: ['CONTROLLED_FRAME_MS', 'runSceneFrames'],
        frameMs: 1000 / 24, runType: 'function' })
      assert.equal(result.requests, 1); assert.equal(result.fulfilled, 1)
      assert.equal(result.error, null)
      result.preflight = { sha256: hash(received), bytes: received.length, status: response.status(),
        exports, beforeCapture: true }
      return result
    },
    verifyCacheReuse() {
      assert.ok(result.preflight && active)
      assert.equal(result.requests, 1); assert.equal(result.fulfilled, 1)
      assert.equal(result.error, null)
      result.cacheReused = true
      return result
    },
  }
}
