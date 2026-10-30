import { prepareWorldInput } from '../browser-world-input.mjs'
import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import { registerRetiredGameplayOwnership, sampleRetiredGameplayOwnership, clearRetiredGameplayOwnership } from './gameplay-ownership-observer.mjs'
import assert from 'node:assert/strict'
import { gameplayThreeCycleProfile } from './gameplay-resource-profile.mjs'
import { captureGameplayThreeCycleHeapSample, gameplayThreeCycleHeapPolicy, gameplayThreeCycleHeapLimits, gameplayThreeCycleProtocol, gameplayThreeCycleResourceLimits, validateGameplayThreeCycleHeapProbe, summarizeGameplayThreeCycleWorkload } from './gameplay-heap-observer.mjs'
import { captureGameplayMatchedHeapSample, gameplayMatchedHeapPolicy, gameplayMatchedHeapLimits, gameplayMatchedProtocol, gameplayHeapResourceLimits, validateGameplayMatchedHeapProbe, summarizeGameplayMatchedWorkload } from './gameplay-heap-observer.mjs'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, showAllMissions } from '../browser-game.mjs'
import { m2NativePointerTarget } from './frame-export.mjs'
import { m2HudPoint, m2RouteReady, m2StartupReady } from './m2-pointer-f8.mjs'
import { observeGameplayResources, captureRetiredGameplayScene, assertResourceLive, summarizeResourceRestart, assertResourceScenario } from './gameplay-resource-observer.mjs'
import { gameplayFramePlan as plan, gameplayFrameLimits, summarizeGameplayPhase } from './gameplay-frame-evidence.mjs'

// Read-only phase observer. No clocks, simulation state, renderer or picker calls are replaced.
// The dedicated resource scenario separately requests GC after all F8 windows.
export function observeGameplayFramePhase() {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  return { timestampMs: performance.now(), timeOriginUnixMs: performance.timeOrigin,
    level: world.outcome.level, turn: world.turn, paused: world.paused, inputMask: world.inputMask,
    speed: world.speed, sameScene: scene === window.testScene && scene.world === world && scene.renderer.domElement.isConnected,
    camera: { ...scene.cameraPosition }, viewport: { width: innerWidth, height: innerHeight },
    visibility: document.visibilityState }
}

export function gameplayPhaseSchedule(measuredPhases) {
  assert.ok(Array.isArray(measuredPhases) && measuredPhases.length > 0 && new Set(measuredPhases).size === measuredPhases.length)
  assert.ok(measuredPhases.every(name => plan.phases.some(phase => phase.name === name)))
  const lastPhase = Math.max(...measuredPhases.map(name => plan.phases.findIndex(phase => phase.name === name)))
  return plan.phases.slice(0, lastPhase + 1).map(phase => ({ phase, measured: measuredPhases.includes(phase.name) }))
}

export default async function ({ page, url, output, expectedRevision, measuredPhases = plan.phases.map(phase => phase.name), resourceLifecycle = false, resourceProfile, ownershipProbe }) {
  assertResourceScenario(resourceLifecycle, measuredPhases, plan.phases.map(phase => phase.name))
  assert.ok(resourceProfile === undefined || (resourceLifecycle && resourceProfile === gameplayThreeCycleProfile), 'Unknown resource profile')
  const threeCycles = resourceProfile === gameplayThreeCycleProfile
  assert.ok(ownershipProbe === undefined || (ownershipProbe === 'weak-v1' && threeCycles), 'Ownership diagnostic requires three-cycle-v1')
  const schedule = gameplayPhaseSchedule(measuredPhases)
  const report = { schema: 'populous-new-dawn/gameplay-frame-recording', schemaVersion: 1,
    status: 'running', plan, measuredPhases, expectedRevision, phases: [], limits: gameplayFrameLimits }
  if (resourceLifecycle) {
    report.schemaVersion = 2; delete report.phases
    report.protocol = gameplayMatchedProtocol; report.cycles = []
    report.resources = { version: 3, status: 'observing', limits: gameplayHeapResourceLimits }
    if (threeCycles) {
      report.schemaVersion = 3; report.resourceProfile = resourceProfile
      report.protocol = gameplayThreeCycleProtocol
      report.resources = { version: 4, status: 'observing', limits: gameplayThreeCycleResourceLimits, restarts: [] }
    }
  }
  if (ownershipProbe) report.ownershipProbe = { version: 1, scope: 'bounded-retired-wrapper-survival-only' }
  const save = () => writeFileSync(resolve(output, 'gameplay-frames.json'), JSON.stringify(report, null, 2) + '\n')
  const observe = () => page.evaluate(observeGameplayFramePhase)
  const graph = page.locator('.fps-graph')
  let heapSession
  save()
  try {
    if (ownershipProbe) await page.evaluate(clearRetiredGameplayOwnership)
    await page.setViewportSize(plan.viewport)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await showAllMissions(page)
    await page.getByRole('button', { name: 'Mission 2', exact: true }).click()
    await bindGame(page)
    const startup = await page.waitForFunction(m2StartupReady)
    report.startup = await startup.jsonValue()
    await startup.dispose()
    assert.equal(report.startup.level, 2)
    if (report.startup.action === 'skip')
      await skipIntroductionWithSpace(page, { timeout: 25000 })
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask && !window.testStore.getWorld().paused)
    const runCycle = async (report, prefix = '') => {
      report.inputPopups = await prepareWorldInput(page)
      await page.mouse.move(900, 400)
      if (resourceLifecycle) {
        report.pointerReset = { x: 900, y: 400, observedTimestampMs: await page.evaluate(() => performance.now()) }
        report.resources = { beforeWarmup: await page.evaluate(observeGameplayResources) }
        assertResourceLive(report.resources.beforeWarmup)
      }
      report.warmupBefore = await observe()
      await page.waitForTimeout(plan.warmupMs)
      report.warmupAfter = await observe()
      assert.ok(report.warmupAfter.turn > report.warmupBefore.turn, 'natural gameplay must advance during warmup')
      await graph.waitFor({ state: 'hidden' })
      // Shards retain all prerequisite UI/input phases in their original order.
      // Setup-only phases are unmeasured, not silently replaced by injected state.
      for (const { phase, measured } of schedule) {
        // Real menu interruption followed by public Escape and world-pointer recovery.
        // This setup is outside measured windows, never passed off as live gameplay.
        if (phase.name === 'menu-recovery') {
          await page.getByRole('button', { name: 'Menu', exact: true }).click()
          await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'visible' })
          report.menuBefore = await observe()
          assert.equal(report.menuBefore.paused, true)
          await page.waitForTimeout(300)
          await page.keyboard.press('Escape')
          await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'hidden' })
          await page.waitForFunction(() => !window.testStore.getWorld().paused)
          report.menuAfter = await observe()
        }
        report.inputPopups.push(...await prepareWorldInput(page))
        const point = phase.route === 'hud' ? await page.evaluate(m2HudPoint)
          : phase.nativeWork ? await page.evaluate(m2NativePointerTarget) : { x: 900, y: 400 }
        assert.ok(point, 'a visible authored person is required for native hover work')
        await page.mouse.move(point.x, point.y)
        await page.waitForFunction(m2RouteReady, { ...point, world: phase.route === 'world' })
        if (measured) {
          await page.keyboard.press('F8')
          await graph.waitFor({ state: 'visible' })
        }
        const before = await observe()
        const record = { name: phase.name, point, before, inputs: [], status: 'running' }
        report.phases.push(record); save()
        const clockStart = performance.now()
        const waitUntil = async offsetMs => {
          const delay = offsetMs - (performance.now() - clockStart)
          if (delay > 0) await page.waitForTimeout(delay)
        }
        const input = async (command, action) => {
          await waitUntil(command.offsetMs)
          await action()
          record.inputs.push({ ...command, observedTimestampMs: await page.evaluate(() => performance.now()) })
        }
        if (phase.moving) {
          for (const [index, [dx, dy]] of plan.pointerOffsets.entries()) {
            const command = { offsetMs: index * plan.pointerIntervalMs, action: 'move', x: point.x + dx, y: point.y + dy }
            await input(command, () => page.mouse.move(command.x, command.y))
          }
        } else if (phase.camera) {
          try {
            for (const command of plan.cameraInputs)
              await input(command, () => page.keyboard[command.action](command.key))
          } finally {
            // Release only keys owned by this scenario even if an action fails.
            await page.keyboard.up('ArrowRight'); await page.keyboard.up('w')
          }
        }
        await waitUntil(plan.phaseDurationMs)
        const after = await observe()
        record.after = after
        if (!measured) { record.status = 'setup-only'; save(); continue }
        // Focus/Space activates the real export button without moving the world pointer
        // into the HUD. Export/action frames stay outside independently observed bounds.
        const button = page.getByRole('button', { name: 'Export recent frames', exact: true })
        await button.focus()
        const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Space')])
        assert.match(download.suggestedFilename(), /^populous-frames-.*\.json$/)
        const filename = `${prefix}gameplay-frame-${phase.name}.json`
        const target = resolve(output, filename)
        await download.saveAs(target)
        record.rawFile = filename
        // Always retain the original bytes, even when validation below fails.
        const summary = summarizeGameplayPhase(readFileSync(target, 'utf8'), phase, before, after, expectedRevision)
        const summaryFile = `${prefix}gameplay-summary-${phase.name}.json`
        writeFileSync(resolve(output, summaryFile), JSON.stringify(summary, null, 2) + '\n')
        Object.assign(record, { status: 'passed', summaryFile, rawSha256: summary.rawSha256,
          frameCount: summary.analysis.sampleCount, turnsAdvanced: summary.turnsAdvanced, work: summary.work })
        await page.keyboard.press('F8')
        await graph.waitFor({ state: 'hidden' })
        save()
      }
      report.after = await observe()
      report.screenshotFile = `${prefix}gameplay-frames-final.png`
      await page.screenshot({ path: resolve(output, report.screenshotFile) })
      if (resourceLifecycle) {
        report.resources.afterWorkload = await page.evaluate(observeGameplayResources)
        assertResourceLive(report.resources.afterWorkload)
        assert.equal(report.resources.afterWorkload.sceneUuid, report.resources.beforeWarmup.sceneUuid)
        assert.equal(report.resources.afterWorkload.timeOriginUnixMs, report.resources.beforeWarmup.timeOriginUnixMs)
        assert.ok(report.resources.afterWorkload.timestampMs > report.resources.beforeWarmup.timestampMs)
        assert.ok(report.resources.afterWorkload.turn > report.resources.beforeWarmup.turn)
      }
    }
    if (!resourceLifecycle) await runCycle(report)
    if (resourceLifecycle) {
      const first = { id: 'cycle-1', startup: report.startup, phases: [] }
      report.cycles.push(first)
      await runCycle(first, 'cycle-1-')
      // Exactly one intervention at each complete post-workload endpoint, outside F8.
      report.resources.heap = { version: 2, status: 'running', policy: gameplayMatchedHeapPolicy, limits: gameplayMatchedHeapLimits, samples: [], sessionDetached: false }; save()
      if (threeCycles) Object.assign(report.resources.heap, { version: 3, policy: gameplayThreeCycleHeapPolicy, limits: gameplayThreeCycleHeapLimits })
      heapSession = await page.context().newCDPSession(page)
      const heapSample = boundary => (threeCycles ? captureGameplayThreeCycleHeapSample : captureGameplayMatchedHeapSample)({ session: heapSession, boundary,
        onSample: sample => { report.resources.heap.samples.push(sample); save() },
        ...(ownershipProbe ? { afterHeapRead: () => page.evaluate(sampleRetiredGameplayOwnership) } : {}),
        observe: () => page.evaluate(observeGameplayResources),
        assertF8Hidden: async () => assert.equal(await graph.isVisible(), false, 'Heap probe must remain outside F8 windows') })
      await heapSample('after-cycle-1-workload'); save()
      // Each restart reuses only the existing alias; retirement deletes it before rebinding.
      const restartCycle = async (previous, nextId) => {
        const restart = { status: 'running' }
        if (threeCycles) {
          Object.assign(restart, { fromCycle: previous.id, toCycle: nextId })
          report.resources.restarts.push(restart)
        } else report.resources.restart = restart
        save()
        await page.getByRole('button', { name: 'Menu', exact: true }).click()
        const menu = page.locator('dialog[data-original-pause-menu]')
        await menu.getByRole('button', { name: 'Restart Level', exact: true }).click()
        await menu.getByRole('button', { name: 'Yes', exact: true }).click()
        const disposed = await page.waitForFunction(() => window.testScene?.disposed === true)
        await disposed.dispose()
        try {
          if (ownershipProbe) restart.ownershipRegistration = await page.evaluate(registerRetiredGameplayOwnership)
        } finally {
          // Even unsupported/malformed diagnostics must release the old aliases.
          restart.retired = await page.evaluate(captureRetiredGameplayScene)
        }
        save()
        await bindGame(page)
        const restarted = await page.waitForFunction(m2StartupReady)
        const ready = await restarted.jsonValue(); await restarted.dispose()
        assert.equal(ready.level, 2)
        if (ready.action === 'skip') await skipIntroductionWithSpace(page, { timeout: 25000 })
        await page.waitForFunction(() => !window.testStore.getWorld().inputMask && !window.testStore.getWorld().paused)
        const rendered = await page.waitForFunction(() => {
          const memory = window.testSceneRef?.current?.renderer.info.memory
          return memory?.geometries > 0 && memory?.textures > 0
        })
        await rendered.dispose()
        restart.after = await page.evaluate(observeGameplayResources)
        await page.waitForTimeout(plan.warmupMs)
        restart.settled = await page.evaluate(observeGameplayResources)
        Object.assign(restart, summarizeResourceRestart(previous.resources.afterWorkload,
          restart.retired, restart.after, restart.settled))
        return ready
      }
      const ready = await restartCycle(first, 'cycle-2')
      const second = { id: 'cycle-2', startup: ready, phases: [] }
      report.cycles.push(second)
      await runCycle(second, 'cycle-2-')
      await heapSample('after-cycle-2-workload'); save()
      if (threeCycles) {
        const third = { id: 'cycle-3', startup: await restartCycle(second, 'cycle-3'), phases: [] }
        report.cycles.push(third)
        await runCycle(third, 'cycle-3-')
        await heapSample('after-cycle-3-workload'); save()
      }
      const closingHeapSession = heapSession; heapSession = undefined
      await closingHeapSession.detach()
      report.resources.heap.sessionDetached = true
      if (threeCycles) {
        report.resources.heap.status = 'passed-three-cycle-descriptive-observations'
        report.resources.status = 'passed-three-cycle-protocol'
        report.resources.heap.deltas = validateGameplayThreeCycleHeapProbe(report.resources.heap, report.resources, report.cycles)
        report.observedWorkloadComparison = summarizeGameplayThreeCycleWorkload(report.cycles)
      } else {
        report.resources.heap.status = 'passed-two-cycle-descriptive-observations'
        validateGameplayMatchedHeapProbe(report.resources.heap, report.resources, report.cycles)
        report.resources.status = 'passed-two-cycle-matched-protocol'
        report.observedWorkloadComparison = summarizeGameplayMatchedWorkload(report.cycles)
      }
    }

    report.status = 'passed'
    return report
  } catch (error) {
    report.status = 'failed'; report.failure = { message: String(error), stack: error.stack }
    throw error
  } finally {
    // Do not leave test bindings retaining a Scene after success or failure.
    try {
      if (resourceLifecycle && !page.isClosed()) await page.evaluate(() => {
        delete window.testScene; delete window.testSceneRef; delete window.testStore
        delete window.__populousGameplayOwnershipV1
      })
    } catch (cleanupError) {
      report.status = 'failed'; report.resourceObserverCleanupFailure = String(cleanupError)
      throw cleanupError
    } finally {
      try {
        if (heapSession) await heapSession.detach()
      } catch (cleanupError) {
        report.status = 'failed'; report.heapObserverCleanupFailure = String(cleanupError)
        throw cleanupError
      } finally { save() }
    }
  }
}
