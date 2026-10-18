import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import { validGpuFrameTiming } from '../app/gpu-frame-timing.ts'

// Shared with the owned local-render harness; ordinary entry and actual Scene.
export async function checkPerformancePage(page, { output } = {}) {
  const overlay = page.locator('.fps-graph')
  await page.setViewportSize({ width: 640, height: 480 })
  await page.waitForFunction(() => Number(document.querySelector('.fps-graph strong')?.textContent) > 0)
  assert.equal(await overlay.isVisible(), true)
  const facts = await overlay.evaluate(el => {
    const box = el.getBoundingClientRect()
    return { x: box.x, y: box.y, width: box.width, height: box.height, clickThrough: getComputedStyle(el).pointerEvents === 'none', label: el.getAttribute('aria-label'), live: el.getAttribute('aria-live'), focusables: el.querySelectorAll('button,a,input,select,[tabindex]').length, text: el.textContent }
  })
  assert.equal(facts.clickThrough, true)
  assert.match(facts.label, /performance/i)
  assert.notEqual(facts.live, 'assertive')
  assert.equal(facts.focusables, 1)
  assert.ok(facts.x >= 0 && facts.y >= 0 && facts.x + facts.width <= 640 && facts.y + facts.height <= 480)
  assert.match(facts.text, /Synchronous CPU excludes overlay and GPU; async GPU details are in exports/)
  assert.equal(await overlay.evaluate(el => { const r = el.getBoundingClientRect(); return !el.contains(document.elementFromPoint(r.x + 10, r.y + 10)) }), true)
  if (output) await page.screenshot({ path: resolve(output, 'performance-640x480.png') })
  const exportButton = overlay.getByRole('button', { name: 'Export recent frames', exact: true })
  assert.equal(await exportButton.evaluate(el => getComputedStyle(el).pointerEvents), 'auto')
  await page.evaluate(() => {
    cancelAnimationFrame(window.testScene.frame)
    window.exportInputEvents = []
    window.exportInputListener = event => window.exportInputEvents.push(event.type)
    for (const type of ['pointerdown', 'pointerup', 'click', 'keydown', 'keyup'])
      window.addEventListener(type, window.exportInputListener)
  })
  for (const keyboard of [false, true]) {
    const pending = page.waitForEvent('download')
    if (keyboard) { await exportButton.focus(); await page.keyboard.press('Space') }
    else await exportButton.click()
    const download = await pending
    const report = JSON.parse(readFileSync(await download.path(), 'utf8'))
    assert.equal(report.schemaVersion, 1)
    assert.match(report.buildRevision, /^(?:[0-9a-f]{40}(?:-dirty)?|unknown)$/)
    assert.ok(report.frames.length > 0 && report.frames.length <= 1200)
    assert.ok(report.frames.every(frame => validGpuFrameTiming(frame.sceneRenderGpu)), 'actual F8 frames expose valid optional GPU states')
    assert.ok(report.frames.every(frame => frame.sceneRenderGpu.status === 'available' || frame.sceneRenderGpu.milliseconds === undefined), 'unavailable GPU timing is unknown, not zero')
    assert.ok(report.timing.capturedSpanMs > 0)
    assert.ok(report.frames.every(frame => Number.isFinite(frame.pointerTooltipCpuMs)))
    assert.ok(report.frames.some(frame => frame.pointerBreakdown !== null))
    assert.equal(report.session.level, 1)
    if (output) await download.saveAs(resolve(output, keyboard ? 'keyboard-frame-export.json' : 'pointer-frame-export.json'))
  }
  assert.deepEqual(await page.evaluate(() => window.exportInputEvents), [], 'button activation does not reach game input handlers')
  await page.evaluate(() => {
    for (const type of ['pointerdown', 'pointerup', 'click', 'keydown', 'keyup'])
      window.removeEventListener(type, window.exportInputListener)
    window.testScene.frame = requestAnimationFrame(window.testScene.animate)
  })
  await page.evaluate(() => document.activeElement?.blur())
  await page.keyboard.press('F8')
  assert.equal(await overlay.count(), 0, 'trusted F8 disables overlay')
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Options', exact: true }).click()
  await page.getByRole('button', { name: 'Browser compatibility and help', exact: true }).click()
  const menuToggle = page.getByRole('button', { name: 'Toggle performance overlay · F8', exact: true })
  assert.equal(await menuToggle.getAttribute('aria-pressed'), 'false', 'menu reflects preceding F8 change')
  await menuToggle.click(); assert.equal(await overlay.count(), 1)
  assert.equal(await menuToggle.getAttribute('aria-pressed'), 'true')
  await menuToggle.click(); assert.equal(await overlay.count(), 0)
  await menuToggle.click(); assert.equal(await overlay.count(), 1)
  await page.getByRole('button', { name: 'Back to Options', exact: true }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Continue Game', exact: true }).click()
  await page.evaluate(() => { cancelAnimationFrame(window.testScene.frame); document.activeElement?.blur() })
  const lifecycle = await page.evaluate(() => {
    const scene = window.testScene, graph = scene.fpsGraph
    const check = (value, message) => { if (!value) throw Error(message) }
    const metric = name => graph.element.querySelector(`[data-metric="${name}"]`).textContent
    graph.reset()
    graph.update(1000, 0, 0, 0, 'Live', 0)
    for (let i = 1; i <= 32; i++) graph.update(1000 + i * 1000 / 120, 2, 3, 100, 'Live', 7)
    check(metric('fps') === '120', '120 callback cadence')
    check(metric('simulation') === '2.00 ms' && metric('render') === '3.00 ms' && metric('calls') === '100', 'exact CPU and draw means')
    graph.reset(); graph.update(0, 0, 0, 0, 'Live', 0)
    for (let i = 1; i <= 10; i++) graph.update(i * 10, 1, 2, 3, 'Live', 5)
    graph.update(250, 1, 2, 3, 'Live', 5)
    check(metric('fps') === '44' && metric('peak') === '150.0 ms', 'unclamped spike')
    for (let i = 1; i <= 300; i++) graph.update(250 + i * 10, 1, 2, 3, 'Live', 5)
    check(graph.samples.count === 240 && graph.samples.history.length === 240, 'fixed ring')
    const points = graph.element.querySelector('polyline').getAttribute('points').trim().split(/\s+/).map(p => p.split(',').map(Number))
    check(points.length <= 240 && points.every(([x, y]) => x >= 0 && x <= 240 && y >= 0 && y <= 60), 'graph bounds')
    const before = JSON.stringify({ turn: scene.world.turn, randomState: scene.world.randomState, cosmeticRandom: scene.world.cosmeticRandom, paused: scene.world.paused, inputMask: scene.world.inputMask, selected: scene.world.selected, keys: [...scene.keys] })
    for (const extra of [{ repeat: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { metaKey: true }]) scene.renderer.domElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8', code: 'F8', bubbles: true, ...extra }))
    check(scene.fpsGraph === graph, 'repeat/modifier F8 ignored')
    const input = document.createElement('input'); document.body.appendChild(input); input.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8', code: 'F8', bubbles: true })); input.remove()
    check(scene.fpsGraph === graph, 'editable F8 ignored')
    for (const target of [null, window, document]) {
      const event = new KeyboardEvent('keydown', { key: 'F8', code: 'F8' })
      Object.defineProperty(event, 'target', { value: target }); scene.keyDown(event)
      check(scene.fpsGraph === null, 'non-Element F8 safely toggles without throwing')
      scene.keyDown(event); check(scene.fpsGraph !== null, 'restore after direct handler test')
    }
    scene.renderer.domElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8', code: 'F8', bubbles: true }))
    check(scene.fpsGraph === null && !graph.element.isConnected, 'F8 off destroys diagnostic')
    scene.renderer.domElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8', code: 'F8', bubbles: true }))
    check(scene.fpsGraph !== graph && scene.fpsGraph.samples.count === 0, 'F8 on starts empty')
    const after = JSON.stringify({ turn: scene.world.turn, randomState: scene.world.randomState, cosmeticRandom: scene.world.cosmeticRandom, paused: scene.world.paused, inputMask: scene.world.inputMask, selected: scene.world.selected, keys: [...scene.keys] })
    check(before === after, 'toggle preserves clock, input, pause and both RNG states')
    const active = scene.fpsGraph
    scene.world.paused = true
    scene.previous = 1000000
    scene.animate(1000000); cancelAnimationFrame(scene.frame)
    scene.animate(1000250); cancelAnimationFrame(scene.frame)
    check(active.element.querySelector('[data-metric="state"]').textContent === 'Paused · rendering', 'paused sampling remains labeled')
    check(active.samples.drawCalls > 0 && active.samples.simulationMs >= 0 && active.samples.renderMs >= 0, 'actual renderer and CPU samples')
    scene.modalSuspended = true
    scene.animate(1000500); cancelAnimationFrame(scene.frame)
    check(active.element.querySelector('[data-metric="state"]').textContent === 'Menu · rendering' && active.samples.simulationMs === 0, 'menu rendering has zero simulation CPU')
    scene.modalSuspended = false
    window.dispatchEvent(new Event('blur'))
    check(active.samples.count === 0, 'blur reset')
    Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'))
    scene.animate(2000000); cancelAnimationFrame(scene.frame)
    check(active.samples.count === 0, 'hidden tab does not collect samples')
    Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange'))
    scene.animate(3000000); cancelAnimationFrame(scene.frame)
    check(active.samples.count === 0, 'resume skips hidden interval')
    delete document.hidden
    const gl = scene.renderer.getContext(), extension = gl.getExtension('WEBGL_debug_renderer_info')
    const result = { deterministicCadence: 120, spikeCadence: 44, spikeMs: 150, maxHistory: active.samples.history.length, renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), drawCalls: scene.renderer.info.render.calls, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio }
    scene.previous = null; scene.frame = requestAnimationFrame(scene.animate)
    return result
  })
  await page.waitForFunction(() => Number(document.querySelector('.fps-graph strong')?.textContent) > 0)
  // A small paired natural-frame observation, not a hardware benchmark. Same paused
  // scene, ABBA off/on/on/off; first eight callbacks per batch warm the state.
  const overhead = await page.evaluate(async () => {
    const scene = window.testScene, original = scene.animate, rows = []
    let batch
    scene.animate = now => {
      const start = performance.now(); original(now); const duration = performance.now() - start
      if (batch) {
        if (batch.previous !== null && batch.skip-- <= 0) batch.samples.push({ cpuMs: duration, frameMs: now - batch.previous })
        batch.previous = now
        if (batch.samples.length === 40) { const done = batch; batch = null; done.resolve(done.samples) }
      }
    }
    try {
      for (const enabled of [false, true, true, false]) {
        if (!!scene.fpsGraph !== enabled) scene.togglePerformance()
        const samples = await new Promise(resolve => { batch = { skip: 8, samples: [], previous: null, resolve } })
        rows.push({ enabled, samples })
      }
    } finally { scene.animate = original; if (!scene.fpsGraph) scene.togglePerformance() }
    return { method: 'Paused Mission 1, natural RAF, 640x480 DPR1, ABBA, 8 warmup + 40 samples each', softwareOnly: true, rows }
  })
  if (output) writeFileSync(resolve(output, 'performance-observations.json'), JSON.stringify({ facts, lifecycle, overhead }, null, 2))
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.waitForFunction(() => Number(document.querySelector('.fps-graph strong')?.textContent) > 0)
  const wideDownload = page.waitForEvent('download')
  await exportButton.click()
  await wideDownload
  if (output) await page.screenshot({ path: resolve(output, 'performance-1280x720.png') })
  const wide = await overlay.boundingBox()
  assert.ok(wide.x >= 0 && wide.y + wide.height <= 720 && wide.x + wide.width <= 1280)
  const liveText = await overlay.innerText()
  assert.ok(!/NaN|Infinity/.test(liveText))
  await page.evaluate(() => window.testScene.dispose())
  assert.equal(await overlay.count(), 0)
  const report = { status: 'passed', facts, lifecycle, overhead, liveText, limitation: 'Headless software renderer; CPU callback observations include browser scheduling/noise. No GPU timing, hardware FPS certification, or broad performance claim.' }
  if (output) writeFileSync(resolve(output, 'performance.json'), JSON.stringify(report, null, 2))
  return report
}

export async function performanceScenario({ page, url, openMission, output }) {
  await page.setViewportSize({ width: 640, height: 480 })
  await openMission(1)
  assert.equal(await page.locator('.fps-graph').count(), 0, 'ordinary play is opt-out')
  await page.goto(`${url}/?fps`, { waitUntil: 'domcontentloaded' })
  await openMission(1)
  return checkPerformancePage(page, { output })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const browser = await chromium.launch({ headless: true })
  try {
    const ordinary = await openGame(browser)
    assert.equal(await ordinary.page.locator('.fps-graph').count(), 0)
    await ordinary.page.context().close()
    const url = new URL(process.env.POPULOUS_URL ?? 'http://localhost:3000'); url.searchParams.set('fps', '')
    process.env.POPULOUS_URL = url.href
    const { page, errors } = await openGame(browser)
    await checkPerformancePage(page)
    assert.deepEqual(errors, [])
    console.log('passed: performance telemetry, opt-in lifecycle, bounded graph, click-through, real game samples and bounded software overhead observation')
  } finally { await browser.close() }
}
