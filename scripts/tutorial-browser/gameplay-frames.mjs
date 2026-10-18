import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, showAllMissions } from '../browser-game.mjs'
import { m2NativePointerTarget } from './frame-export.mjs'
import { m2HudPoint, m2RouteReady, m2StartupReady } from './m2-pointer-f8.mjs'
import { gameplayFramePlan as plan, gameplayFrameLimits, summarizeGameplayPhase } from './gameplay-frame-evidence.mjs'

// Read-only observer. No clocks, simulation state, renderer or picker calls are replaced.
export function observeGameplayFramePhase() {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  return { timestampMs: performance.now(), timeOriginUnixMs: performance.timeOrigin,
    level: world.outcome.level, turn: world.turn, paused: world.paused, inputMask: world.inputMask,
    speed: world.speed, sameScene: scene === window.testScene && scene.world === world && scene.renderer.domElement.isConnected,
    camera: { ...scene.cameraPosition }, viewport: { width: innerWidth, height: innerHeight },
    visibility: document.visibilityState }
}

export default async function ({ page, url, output, expectedRevision }) {
  const report = { schema: 'populous-new-dawn/gameplay-frame-recording', schemaVersion: 1,
    status: 'running', plan, expectedRevision, phases: [], limits: gameplayFrameLimits }
  const save = () => writeFileSync(resolve(output, 'gameplay-frames.json'), JSON.stringify(report, null, 2) + '\n')
  const observe = () => page.evaluate(observeGameplayFramePhase)
  const graph = page.locator('.fps-graph')
  save()
  try {
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
      await page.getByRole('button', { name: /^Skip introduction/ }).click()
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask && !window.testStore.getWorld().paused)
    await page.mouse.move(900, 400)
    report.warmupBefore = await observe()
    await page.waitForTimeout(plan.warmupMs)
    report.warmupAfter = await observe()
    assert.ok(report.warmupAfter.turn > report.warmupBefore.turn, 'natural gameplay must advance during warmup')
    await graph.waitFor({ state: 'hidden' })
    for (const phase of plan.phases) {
      // Real menu interruption followed by public Escape and world-pointer recovery.
      // This setup is outside measured windows, never passed off as live gameplay.
      if (phase.name === 'menu-recovery') {
        await page.getByRole('button', { name: 'Game settings', exact: true }).click()
        await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'visible' })
        report.menuBefore = await observe()
        assert.equal(report.menuBefore.paused, true)
        await page.waitForTimeout(300)
        await page.keyboard.press('Escape')
        await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'hidden' })
        await page.waitForFunction(() => !window.testStore.getWorld().paused)
        report.menuAfter = await observe()
      }
      const point = phase.route === 'hud' ? await page.evaluate(m2HudPoint)
        : phase.nativeWork ? await page.evaluate(m2NativePointerTarget) : { x: 900, y: 400 }
      assert.ok(point, 'a visible authored person is required for native hover work')
      await page.mouse.move(point.x, point.y)
      await page.waitForFunction(m2RouteReady, { ...point, world: phase.route === 'world' })
      await page.keyboard.press('F8')
      await graph.waitFor({ state: 'visible' })
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
      // Focus/Space activates the real export button without moving the world pointer
      // into the HUD. Export/action frames stay outside independently observed bounds.
      const button = page.getByRole('button', { name: 'Export recent frames', exact: true })
      await button.focus()
      const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Space')])
      assert.match(download.suggestedFilename(), /^populous-frames-.*\.json$/)
      const filename = `gameplay-frame-${phase.name}.json`
      const target = resolve(output, filename)
      await download.saveAs(target)
      record.rawFile = filename
      // Always retain the original bytes, even when validation below fails.
      const summary = summarizeGameplayPhase(readFileSync(target, 'utf8'), phase, before, after, expectedRevision)
      const summaryFile = `gameplay-summary-${phase.name}.json`
      writeFileSync(resolve(output, summaryFile), JSON.stringify(summary, null, 2) + '\n')
      Object.assign(record, { status: 'passed', summaryFile, rawSha256: summary.rawSha256,
        frameCount: summary.analysis.sampleCount, turnsAdvanced: summary.turnsAdvanced, work: summary.work })
      await page.keyboard.press('F8')
      await graph.waitFor({ state: 'hidden' })
      save()
    }
    report.after = await observe()
    await page.screenshot({ path: resolve(output, 'gameplay-frames-final.png') })
    report.status = 'passed'
    return report
  } catch (error) {
    report.status = 'failed'; report.failure = { message: String(error), stack: error.stack }
    throw error
  } finally { save() }
}
