import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readCommittedCheckpoint } from './checkpoint-observer.mjs'
import { publicWorshipOrder } from './ordinary-worship-m1-route.mjs'

// A focused original draw-method cost observation, not a hardware frame/FPS
// benchmark or a before/after speedup claim. No full diagnostic observer runs.
export default async function ({ page, root, output, receipt, openMission, signal }) {
  assert.equal(receipt.source.commit, 'cfa86a32f03d021cd1ad725eed9f458ab239d56b')
  assert.equal(receipt.profile?.mode, 'created')
  assert.equal(await readCommittedCheckpoint(page), null)
  const report = { status: 'running', source: receipt.source, orders: [],
    scenarioSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
    helperSha256: createHash('sha256').update(readFileSync(new URL('./ordinary-worship-m1-route.mjs', import.meta.url))).digest('hex'),
    workload: { mission: 1, head: 'Authored ordinary Land Bridge (-5,25)', viewport: [1440, 1000], dpr: 1,
      clock: 'Real RAF and shipped public worship order', idleWarmup: 8, idleSamples: 32, activeWarmup: 8, maximumActiveSamples: 128 },
    measurement: 'Elapsed performance.now around original presentation.draw only. Inputs/categories prepared before timer; arrays/statistics after timer. A minimal bridge.measure call-count wrapper remains inside measured call. No screenshots, pixel reads, state clones, drawImage/Canvas primitive or clock hooks inside measurement.',
    limits: 'Sandboxed headless software-renderer/shared cloud CPU diagnostic costs only. Browser timer quantization and minimal call-count-wrapper overhead retained. No hardware FPS, total frame time, uncontended hardware performance or speedup claim.' }
  const save = () => writeFileSync(resolve(output, 'ordinary-worship-cost.json'), JSON.stringify(report, null, 2) + '\n')
  const deadline = performance.now() + 180000
  const wait = (predicate, argument, maximum) => {
    signal.throwIfAborted()
    const timeout = Math.min(maximum, deadline - performance.now())
    assert.ok(timeout > 0, 'Cost workload deadline')
    return page.waitForFunction(predicate, argument, { timeout, polling: 50 })
  }
  const { waitForShamanReadiness } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  let armed = false
  try {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await openMission(1)
    const resume = page.getByRole('button', { name: 'Resume game', exact: true })
    if (await resume.isVisible()) await resume.click()
    report.readiness = await waitForShamanReadiness(page, { timeout: 45000 })
    report.initial = await page.evaluate(() => {
      const s = window.testSceneRef.current, w = s.world, gl = s.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
      return { turn: w.turn, stock: w.shots.bridge, count: w.giftCounts.bridge, status: w.status, paused: w.paused,
        sameWorld: w === window.testStore.getWorld(), dpr: devicePixelRatio, viewport: [innerWidth, innerHeight],
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        webgl: gl.getParameter(gl.VERSION), contextLost: gl.isContextLost(),
        head: structuredClone(w.shrines.find(h => h.kind === 'bridge' && h.x === -5 && h.z === 25)) }
    })
    assert.equal(report.initial.sameWorld, true); assert.equal(report.initial.contextLost, false)
    assert.equal(report.initial.dpr, 1); assert.deepEqual(report.initial.viewport, report.workload.viewport)
    assert.equal(report.initial.head.required, 1); assert.equal(report.initial.head.target, 28)
    assert.ok(report.initial.head.ordinarySpellReward)
    await page.evaluate(() => {
      const s = window.testSceneRef.current, presentation = s.worshipPresentation, bridge = presentation.bridge,
        evidence = window.worshipCost = { mode: 'idle', counts: { idle: 0, active: 0 }, idle: [], active: [], restored: false },
        originalDraw = presentation.draw, originalMeasure = bridge.measure,
        ownDraw = Object.hasOwn(presentation, 'draw'), ownMeasure = Object.hasOwn(bridge, 'measure')
      let measuring = false, measureCalls = 0
      const measure = function (...args) { if (measuring) measureCalls++; return originalMeasure.apply(this, args) }
      const draw = function (...args) {
        const mode = evidence.mode, commands = s.world.worshipAcquisition.controllers.drawCommands,
          eligible = mode === 'idle' ? commands.length === 0 : mode === 'active' && commands.length > 0,
          index = eligible ? ++evidence.counts[mode] : 0,
          selected = index > 8 && evidence[mode].length < (mode === 'idle' ? 32 : 128)
        if (!selected) return originalDraw.apply(this, args)
        const sample = { turn: s.world.turn, paused: s.world.paused, commandCount: commands.length,
          referenceCount: new Set(commands.map(c => c.geometry)).size,
          body: commands.some(c => c.kind === 'body'), pulse: commands.some(c => c.owner === 'pulse') }
        measureCalls = 0; measuring = true
        const start = performance.now()
        let result, duration
        try { result = originalDraw.apply(this, args) }
        finally { duration = performance.now() - start; measuring = false }
        evidence[mode].push({ ...sample, milliseconds: duration, measureCalls })
        return result
      }
      bridge.measure = measure; presentation.draw = draw
      window.restoreWorshipCost = () => {
        if (presentation.draw !== draw || bridge.measure !== measure) throw Error('Cost wrapper ownership changed')
        if (ownDraw) presentation.draw = originalDraw; else delete presentation.draw
        if (ownMeasure) bridge.measure = originalMeasure; else delete bridge.measure
        evidence.mode = 'off'; evidence.restored = true; delete window.restoreWorshipCost
      }
    })
    armed = true
    await wait(() => window.worshipCost.idle.length === 32, null, 15000)
    await page.evaluate(() => { window.worshipCost.mode = 'off' })
    await publicWorshipOrder(page, report.initial.head, 'brave', report, waitForShamanReadiness)
    await page.evaluate(() => { window.worshipCost.mode = 'active' })
    await wait(initial => {
      const w = window.testStore.getWorld()
      return w.giftCounts.bridge === initial.count + 1 && w.shots.bridge === initial.stock + 1
    }, report.initial, 120000)
    await wait(() => {
      const s = window.testSceneRef.current, w = s.world, c = w.worshipAcquisition.controllers
      return !w.gifts.some(g => g.ordinaryWorship) && !c.spell?.active && !c.pulse?.active && !c.companion?.active &&
        !c.drawCommands.length && s.worshipPresentation.canvas.hidden
    }, null, 30000)
    await page.evaluate(() => { window.worshipCost.mode = 'off' })
    report.final = await page.evaluate(() => {
      const s = window.testSceneRef.current, w = s.world
      return { turn: w.turn, stock: w.shots.bridge, count: w.giftCounts.bridge, status: w.status,
        diagnostics: structuredClone(s.worshipPresentation.diagnostics), overlayHidden: s.worshipPresentation.canvas.hidden }
    })
    // All measured samples are already complete before the only screenshot.
    await page.screenshot({ path: resolve(output, 'cost-workload-complete.png') })
    report.status = 'observed'
  } catch (error) { report.status = 'failed'; report.failure = String(error.stack); throw error }
  finally {
    if (armed && !page.isClosed()) {
      await page.evaluate(() => window.restoreWorshipCost())
      report.samples = await page.evaluate(() => window.worshipCost)
    }
    save()
  }
  try {
    assert.equal(report.samples.restored, true); assert.equal(report.samples.idle.length, 32)
    assert.ok(report.samples.active.length >= 16, 'Retain at least 16 active frames after 8 warmup calls')
    assert.ok(report.samples.active.some(s => s.body), 'Real acquired body reaches measured original draw')
    for (const sample of [...report.samples.idle, ...report.samples.active]) {
      assert.equal(sample.measureCalls, sample.referenceCount, 'One real geometry measure per immutable reference')
      assert.ok(Number.isFinite(sample.milliseconds) && sample.milliseconds >= 0)
    }
    const stats = samples => {
      const values = samples.map(s => s.milliseconds).sort((a, b) => a - b), at = p => values[Math.floor((values.length - 1) * p)]
      return { count: values.length, min: values[0], median: at(0.5), p95: at(0.95), max: values.at(-1),
        total: values.reduce((sum, value) => sum + value, 0), zeroSamples: values.filter(v => v === 0).length }
    }
    report.statistics = { idle: stats(report.samples.idle), active: stats(report.samples.active) }
    assert.deepEqual(receipt.errors, []); assert.deepEqual(report.final.diagnostics, [])
    assert.equal(report.final.stock, report.initial.stock + 1); assert.equal(report.final.count, report.initial.count + 1)
    report.status = 'passed'; save(); return report
  } catch (error) { report.status = 'failed'; report.failure = String(error.stack); save(); throw error }
}
