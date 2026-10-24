// Explicit browser contract command, deliberately outside Node test discovery.
// No gameplay is loaded or driven. No production asset/CSP/launch flag changes.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { once } from 'node:events'
import { pathToFileURL } from 'node:url'
import { installSpyHelperDelivery } from './tutorial-browser/spy-source-delivery.mjs'

export async function checkSpyModuleDelivery(browser, deadlineAt) {
  const server = createServer((req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'content-type': 'text/html',
        'content-security-policy': "default-src 'none'; script-src 'self'; connect-src 'self'" })
      res.end('<!doctype html><title>Native ESM delivery contract</title>')
    } else { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('No source modules in this preview') }
  })
  const contexts = [], deliveries = [], receipt = { status: 'running', capMs: 20000 }
  let timer, primary, deadlineClosure
  const cleanupErrors = []
  const failedCleanup = error => cleanupErrors.push(String(error))
  try {
    assert.ok(deadlineAt > Date.now() && deadlineAt - Date.now() <= 20000)
    timer = setTimeout(() => {
      receipt.timedOut = true
      server.closeAllConnections()
      deadlineClosure = browser.close().catch(failedCleanup)
    }, deadlineAt - Date.now())
    server.listen(0, '127.0.0.1'); await once(server, 'listening')
    const url = `http://127.0.0.1:${server.address().port}/`, helper = new URL('/scripts/controlled-scene-frames.mjs', url).href
    const newPage = async () => {
      const context = await browser.newContext(); contexts.push(context)
      const page = await context.newPage(); page.setDefaultTimeout(Math.min(3000, deadlineAt - Date.now()))
      return page
    }
    const baseline = await newPage(); await baseline.goto(url)
    const missing = await baseline.request.get(helper)
    assert.equal(missing.status(), 404)
    await assert.rejects(baseline.evaluate(href => import(href), helper))
    receipt.unrouted404 = true
    const page = await newPage(), report = {}
    let foreignCalls = 0
    const foreign = route => { foreignCalls++; return route.fulfill({ status: 200, body: 'foreign-owned' }) }
    await page.route(new URL('/foreign', url).href, foreign)
    const delivery = await installSpyHelperDelivery({ page, url,
      bytes: readFileSync(new URL('./controlled-scene-frames.mjs', import.meta.url)), deadlineAt, report })
    deliveries.push(delivery)
    await page.goto(url)
    // Mirror the actual checkpoint lifecycle: a new document after IDB seeding.
    const beforeReload = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const open = indexedDB.open('delivery-contract', 1)
        open.onupgradeneeded = () => open.result.createObjectStore('checkpoints')
        open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error)
      })
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction('checkpoints', 'readwrite')
          tx.objectStore('checkpoints').put('seeded', 'latest')
          tx.oncomplete = resolve; tx.onerror = tx.onabort = () => reject(tx.error)
        })
      } finally { db.close() }
      return performance.timeOrigin
    })
    assert.equal(report.delivery.requests, 0, 'Do not import into the discarded document')
    await page.reload()
    assert.notEqual(await page.evaluate(() => performance.timeOrigin), beforeReload)
    await delivery.preflight()
    receipt.preflightAfterReload = true
    // Actual native import, not a mocked evaluate callback. Module cache reuse is
    // required even though the original response has cache-control:no-store.
    assert.equal(await page.evaluate(async href => {
      const a = await import(href), b = await import(href)
      return a === b && a.CONTROLLED_FRAME_MS === 1000 / 24 && typeof a.runSceneFrames === 'function'
    }, helper), true)
    delivery.verifyCacheReuse(); await delivery.close()
    assert.equal(report.delivery.removed, true); assert.equal(report.delivery.error, null)
    assert.equal(await page.evaluate(async () => (await fetch('/foreign')).text()), 'foreign-owned')
    assert.equal(foreignCalls, 1, 'Owned removal must not touch foreign handlers')
    assert.equal(await page.evaluate(async () => (await fetch('/scripts/controlled-scene-frames.mjs')).status), 404)
    receipt.delivery = report.delivery
    // Query and different-origin URLs must never be fulfilled by the exact route.
    const negativePage = await newPage(), negativeReport = {}
    const negative = await installSpyHelperDelivery({ page: negativePage, url,
      bytes: readFileSync(new URL('./controlled-scene-frames.mjs', import.meta.url)), deadlineAt, report: negativeReport })
    deliveries.push(negative); await negativePage.goto(url)
    await assert.rejects(negativePage.evaluate(href => import(href + '?unqualified'), helper))
    await assert.rejects(negativePage.evaluate(href => import(href.replace('127.0.0.1', 'localhost')), helper))
    assert.equal(negativeReport.delivery.fulfilled, 0)
    await assert.rejects(negativePage.evaluate(href => fetch(href), helper), 'Non-script request fails closed')
    assert.match(negativeReport.delivery.error, /script/)
    await negative.close(); assert.equal(negativeReport.delivery.removed, true)
    receipt.negativeRequestsRejected = true; receipt.status = 'passed'
  } catch (error) { primary = error; receipt.status = 'failed'; receipt.failure = String(error) }
  finally {
    for (const delivery of deliveries) {
      try { await delivery.close() } catch (error) { failedCleanup(error) }
    }
    for (const context of contexts) {
      try { await context.close() } catch (error) { failedCleanup(error) }
    }
    try {
      server.closeAllConnections()
      if (server.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    } catch (error) { failedCleanup(error) }
    finally { clearTimeout(timer) }
    await deadlineClosure
    receipt.cleanupErrors = cleanupErrors
    receipt.cleanupVerified = !cleanupErrors.length && !server.listening && deliveries.every(d => d.result.removed)
    if (receipt.timedOut || !receipt.cleanupVerified) {
      receipt.status = 'failed'
      primary ??= Error(receipt.timedOut ? 'Module delivery contract exceeded20second deadline' : 'Module delivery cleanup failed')
      receipt.failure ??= String(primary)
    }
    console.log(JSON.stringify(receipt))
  }
  if (primary) throw primary
  return receipt
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { chromium } = await import('@playwright/test')
  const deadlineAt = Date.now() + 20000
  const browser = await chromium.launch({ headless: true, timeout: 8000 })
  try { await checkSpyModuleDelivery(browser, deadlineAt) }
  finally { await browser.close() }
}
