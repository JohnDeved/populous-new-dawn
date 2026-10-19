import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Admission: scripts/ui-readiness-browser/run.mjs supplies this exact scenario
// contract. No browser launch, storage writes, synthetic game state or deployment.
// servingDescription is preserved verbatim, not interpreted as commit evidence.
export default async function checkMenuFeedback({ page: runnerPage, context, output, url, servingDescription }) {
  assert.ok(runnerPage && context?.browser(), 'Admitted runner page/context required')
  const report = { status: 'running', url, servingDescription, started: new Date().toISOString(), phases: [], samples: [], limits: 'Canvas readback plus screenshots; no native or hardware performance equivalence claim.' }
  const hardEnd = Date.now() + 84000
  const reportPath = resolve(output, 'menu-feedback-report.json')
  let writes = Promise.resolve()
  const persist = () => {
    const snapshot = JSON.stringify(report, null, 2)
    writes = writes.then(() => writeFile(reportPath, snapshot))
    return writes
  }
  let expired = false, owned, closing, rejectDeadline
  const timeoutError = new Error('Menu feedback diagnostic exceeded 80000ms')
  timeoutError.name = 'DiagnosticTimeoutError'
  const deadline = new Promise((_, reject) => { rejectDeadline = reject })
  const close = () => {
    if (!owned) return Promise.resolve()
    if (!closing) {
      let timer
      closing = Promise.race([owned.close(), new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Owned context cleanup exceeded 4000ms')), Math.max(0, Math.min(4000, hardEnd - Date.now())))
      })]).finally(() => clearTimeout(timer))
    }
    return closing
  }
  const timer = setTimeout(() => {
    expired = true
    rejectDeadline(timeoutError)
    void close().catch(() => {})
  }, 80000)
  const step = async action => {
    if (expired) throw timeoutError
    const result = await Promise.race([Promise.resolve().then(() => {
      if (expired) throw timeoutError
      return action()
    }), deadline])
    if (expired) throw timeoutError
    return result
  }
  const phase = async name => { report.phases.push({ name, at: new Date().toISOString() }); await step(persist) }
  const finalPersist = async () => {
    let timer
    try {
      await Promise.race([persist(), new Promise((_, reject) => {
        timer = setTimeout(() => reject(timeoutError), Math.max(0, hardEnd - Date.now()))
      })])
    } finally { clearTimeout(timer) }
  }
  try {
    await step(() => mkdir(output, { recursive: true }))
    await step(persist)
    await step(() => context.browser().newContext({ viewport: { width: 2560, height: 1267 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' }).then(async created => {
      owned = created
      if (expired) { await close(); throw timeoutError }
      return created
    }))
    const page = await step(() => owned.newPage())
    page.setDefaultTimeout(8000)
    page.setDefaultNavigationTimeout(25000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await phase('navigate-public-startup')
    await step(() => page.goto(url, { waitUntil: 'domcontentloaded' }))
    const menu = page.getByRole('dialog', { name: 'Main menu', exact: true })
    await step(() => menu.waitFor({ state: 'visible' }))
    await step(() => page.waitForFunction(() => document.querySelector('[data-original-main-menu]')?.dataset.backgroundReady === 'true'))
    const tooltip = page.locator('[data-menu-tooltip-visible]')
    const snapshot = (clientX, clientY) => step(() => page.evaluate(({ clientX, clientY }) => {
      const canvas = document.querySelector('[data-original-main-menu] canvas')
      const bounds = canvas.getBoundingClientRect()
      const scale = bounds.width / canvas.width
      const frame = canvas.parentElement.getBoundingClientRect()
      const x = Math.floor((clientX - frame.left) / scale) + (canvas.width - 640) / 2
      const y = Math.floor((clientY - frame.top) / scale)
      const bytes = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
      let inside = 2166136261, outside = 2166136261
      for (let at = 0; at < bytes.length; at++) {
        const pixel = at >> 2, px = pixel % canvas.width, py = Math.floor(pixel / canvas.width)
        if (px >= x - 64 && px < x + 64 && py >= y - 64 && py < y + 64) inside = Math.imul(inside ^ bytes[at], 16777619)
        else outside = Math.imul(outside ^ bytes[at], 16777619)
      }
      return { inside: inside >>> 0, outside: outside >>> 0, x, y, canvasWidth: canvas.width, bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }, dpr: devicePixelRatio }
    }, { clientX, clientY }))
    const sampleGlow = async (name, x, y) => {
      await phase(name)
      await step(() => page.mouse.move(x, y))
      await step(() => page.waitForTimeout(220)) // Let pointer RAF and shadow position settle.
      const samples = []
      for (let frame = 0; frame < 4; frame++) {
        samples.push(await snapshot(x, y))
        if (frame === 0 || frame === 3) await step(() => page.screenshot({ path: resolve(output, `${name}-${frame}.png`) }))
        if (frame < 3) await step(() => page.waitForTimeout(125))
      }
      report.samples.push({ name, x, y, samples }); await step(persist)
      assert.ok(new Set(samples.map(s => s.inside)).size > 1, `${name}: successive native glow masks must visibly change`)
      assert.equal(new Set(samples.map(s => s.outside)).size, 1, `${name}: non-glow pixels must stay stationary`)
      assert.ok(samples[0].x >= 0 && samples[0].x < samples[0].canvasWidth)
      return samples[0]
    }
    const left = await sampleGlow('wide-left', 80, 1000)
    const center = await sampleGlow('wide-center', 1280, 1000)
    const right = await sampleGlow('wide-right', 2480, 1000)
    assert.ok(left.x < (left.canvasWidth - 640) / 2, 'Left evidence must be beyond native frame')
    assert.ok(right.x > (right.canvasWidth + 640) / 2, 'Right evidence must be beyond native frame')
    assert.ok(Math.abs(center.x - center.canvasWidth / 2) <= 1)

    const row = menu.getByRole('button', { name: 'Multiplayer', exact: true })
    assert.equal(await step(() => row.getAttribute('aria-disabled')), 'true')
    assert.equal(await step(() => row.getAttribute('title')), null, 'No competing browser tooltip')
    const reason = await step(() => row.getAttribute('data-menu-tooltip'))
    assert.ok(reason?.length)
    assert.equal(await step(() => row.getAttribute('aria-description')), reason)
    const hover = async () => {
      const bounds = await step(() => row.boundingBox()); assert.ok(bounds)
      await step(() => page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2))
    }
    await phase('tooltip-hover-delay')
    await hover()
    await step(() => page.waitForTimeout(180))
    assert.equal(await step(() => tooltip.count()), 0, 'Tooltip must not appear before 501ms dwell')
    await step(() => tooltip.waitFor({ state: 'visible' }))
    assert.equal(await step(() => tooltip.count()), 1)
    const rect = await step(() => tooltip.boundingBox())
    assert.ok(rect && rect.width > 0 && rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= 2561 && rect.y + rect.height <= 1268)
    await step(() => page.screenshot({ path: resolve(output, 'tooltip-hover.png') }))
    await step(() => page.mouse.move(80, 1000))
    await step(() => tooltip.waitFor({ state: 'hidden' }))
    await phase('tooltip-keyboard-focus')
    await step(() => row.focus())
    await step(() => page.waitForTimeout(180))
    assert.equal(await step(() => tooltip.count()), 0)
    await step(() => tooltip.waitFor({ state: 'visible' }))
    await step(() => page.screenshot({ path: resolve(output, 'tooltip-focus.png') }))
    await step(() => page.keyboard.press('Enter'))
    assert.equal(await step(() => menu.isVisible()), true)
    assert.equal(await step(() => page.locator('[data-world-selector]').count()), 0)
    // aria-disabled rejects locator.click; use a genuine pointer click instead.
    await hover()
    const bounds = await step(() => row.boundingBox())
    await step(() => page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2))
    await step(() => tooltip.waitFor({ state: 'hidden' }))
    assert.equal(await step(() => menu.isVisible()), true)
    assert.equal(await step(() => page.locator('[data-world-selector]').count()), 0)
    await phase('resize-and-repeat')
    await step(() => page.mouse.move(80, 1000)); await hover()
    await step(() => tooltip.waitFor({ state: 'visible' }))
    await step(() => page.setViewportSize({ width: 1920, height: 1080 }))
    await step(() => tooltip.waitFor({ state: 'hidden' }))
    await sampleGlow('resized-left', 30, 900)
    await sampleGlow('resized-right', 1890, 900)
    await hover(); await step(() => tooltip.waitFor({ state: 'visible' }))
    await step(() => page.mouse.move(30, 900)); await step(() => tooltip.waitFor({ state: 'hidden' }))
    assert.deepEqual(errors, [], 'No page errors')
    await phase('assertions-passed')
    await step(close)
    report.status = 'passed'
    report.finished = new Date().toISOString()
    await step(persist)
    if (expired) throw timeoutError
    return report
  } catch (error) {
    report.status = expired ? 'timed-out' : 'failed'; report.error = String(error?.stack ?? error)
    report.finished = new Date().toISOString(); await finalPersist()
    throw error
  } finally {
    clearTimeout(timer)
    try { await close() } catch (error) {
      report.status = expired ? 'timed-out' : 'failed'; report.cleanupError = String(error); await finalPersist()
      throw expired ? timeoutError : error
    }
  }
}
