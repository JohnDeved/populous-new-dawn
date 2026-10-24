import { setWorldPaused } from '../browser-world-input.mjs'
import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { projectionCoverage, sha256 } from './spell-projection-coverage.mjs'

export const spellProjectionLimitMs = 35000
export function assertProjectionWindow(before, after) {
  for (const snapshot of [before, after]) {
    for (const name of ['turn', 'landFlags', 'loadFlags', 'gameFlags', 'levelFlags2'])
      assert.ok(Number.isInteger(snapshot[name]), `Missing or invalid ${name}`)
    assert.equal(snapshot.level, 1)
    assert.equal(snapshot.paused, true)
    assert.equal(
      snapshot.sameIdentity,
      true,
      'Scene, store and world identities must remain unchanged'
    )
    assert.equal(snapshot.canvasConnected, true)
    assert.equal(snapshot.inputMask, 0)
    assert.equal(snapshot.landFlags & (2 | 0x800000), 0)
    assert.equal(snapshot.loadFlags & 0x200, 0)
    assert.equal(snapshot.gameFlags & (2 | 32), 0)
    assert.equal(snapshot.levelFlags2 & 0x100000, 0)
    assert.ok(snapshot.computerTribes.length > 0, 'Ordinary computer callback gates must be open')
    assert.ok(snapshot.eligiblePeople > 0, 'Projection must have living outside people')
  }
  assert.ok(after.turn >= before.turn + 8, 'At least eight natural turns must advance')
}

export async function finishSpellProjection({
  context,
  cdp,
  coverageStarted,
  report,
  output,
  failure,
}) {
  const failures = failure ? [failure] : []
  // Coverage and context cleanup are independent, including on failed assertions.
  if (cdp) {
    try {
      if (coverageStarted) await cdp.send('Profiler.stopPreciseCoverage')
      await cdp.send('Profiler.disable')
      await cdp.send('Debugger.disable')
      await cdp.detach()
      report.coverageClosed = true
    } catch (error) {
      failures.push(error)
    }
  }
  try {
    await context.close()
    report.contextClosed = true
  } catch (error) {
    failures.push(error)
  }
  if (report.errors.length) failures.push(Error(`Runtime errors: ${JSON.stringify(report.errors)}`))
  if (report.timedOut) failures.push(Error('Spell projection episode exceeded its 35-second bound'))
  report.status = failures.length ? 'failed' : 'passed'
  report.failures = failures.map(error => ({ message: String(error), stack: error.stack }))
  writeFileSync(resolve(output, 'spell-projection.json'), JSON.stringify(report, null, 2) + '\n')
  if (failures.length)
    throw new AggregateError(failures, 'Spell projection witness failed; see receipt')
  return report
}

export default async function spellProjection({ browser, url, output, root, dist }) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  })
  const report = {
    status: 'running',
    errors: [],
    limits: [
      'Ordinary public Mission 1 start and unpaused simulation; no injected entities, forced ticks or production hooks',
      'Precise coverage proves adapter execution only; it changes optimization and is not a performance/FPS measurement',
      'No natural spell-firing, terrain-refresh rendering, native equivalence or campaign-unlock claim',
      'Actual Home through plain Vite, not Vinext/Cloudflare/RSC hosting',
    ],
  }
  let page,
    cdp,
    coverageStarted = false,
    failure
  const timer = setTimeout(() => {
    report.timedOut = true
    void context.close().catch(error => report.errors.push(String(error)))
  }, spellProjectionLimitMs)
  try {
    page = await context.newPage()
    page.setDefaultTimeout(10000)
    page.on('pageerror', error => report.errors.push(String(error)))
    page.on('console', message => {
      if (message.type() === 'error') report.errors.push(message.text())
    })
    page.on('crash', () => report.errors.push('Page crashed'))
    const button = name => page.getByRole('button', { name, exact: true })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await button('New Game').click()
    await page.locator('[data-original-tutorial-recommendation]').waitFor()
    await button('No').click()
    await button('Start Mission 1').click()
    await bindGame(page)
    const startup = await page.waitForFunction(() => {
      const world = window.testStore.getWorld()
      if (!world.inputMask) return 'ready'
      return (world.inputMask & 64) && (world.flyby.flags & 0x51) === 0x11 ? 'skip' : false
    })
    if ((await startup.jsonValue()) === 'skip')
      await skipIntroductionWithSpace(page, { timeout: 10000 })
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    await setWorldPaused(page, true, { timeout: 10000 })
    await page.waitForFunction(() => window.testStore.getWorld().paused)
    await page.evaluate(() => {
      window.spellProjectionWitness = {
        scene: window.testSceneRef.current,
        store: window.testStore,
        world: window.testStore.getWorld(),
      }
    })
    const read = () =>
      page.evaluate(() => {
        const scene = window.testSceneRef.current,
          store = window.testStore,
          w = store.getWorld(),
          initial = window.spellProjectionWitness
        return {
          level: w.outcome.level,
          turn: w.turn,
          paused: w.paused,
          inputMask: w.inputMask,
          sameIdentity:
            scene === initial.scene &&
            store === initial.store &&
            w === initial.world &&
            scene.world === w,
          canvasConnected: scene.renderer.domElement.isConnected,
          landFlags: w.land.landFlags,
          loadFlags: w.manaWorld.loadFlags,
          gameFlags: w.manaWorld.gameFlags,
          levelFlags2: w.levelFlags2,
          computerTribes: w.manaTribes
            .slice(0, w.tribeCount)
            .flatMap((t, id) =>
              t.active && (t.defeatTimer | 0) < 97 && !(t.flags2 & 64) && t.playerType === 1
                ? [id]
                : []
            ),
          eligiblePeople: w.units.filter(u => u.hp > 0 && u.inside === null).length,
        }
      })
    report.before = await read()
    report.renderer = await page.evaluate(() => {
      const scene = window.testSceneRef.current,
        gl = scene.renderer.getContext(),
        debug = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        version: gl.getParameter(gl.VERSION),
        renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        viewport: [innerWidth, innerHeight],
        dpr: devicePixelRatio,
        canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight],
      }
    })
    assert.ok(report.renderer.version.startsWith('WebGL 2.0'))
    await page.screenshot({ path: resolve(output, 'spell-projection-before.png') })
    cdp = await context.newCDPSession(page)
    await cdp.send('Debugger.enable')
    await cdp.send('Profiler.enable')
    await cdp.send('Profiler.startPreciseCoverage', {
      callCount: true,
      detailed: false,
      allowTriggeredUpdates: false,
    })
    coverageStarted = true
    await cdp.send('Profiler.takePreciseCoverage') // Reset startup/paused activity immediately before public Resume.
    await setWorldPaused(page, false, { timeout: 10000 })
    await page.waitForFunction(
      turn => !window.testStore.getWorld().paused && window.testStore.getWorld().turn >= turn + 8,
      report.before.turn
    )
    await setWorldPaused(page, true, { timeout: 10000 })
    await page.waitForFunction(() => window.testStore.getWorld().paused)
    const coverage = await cdp.send('Profiler.takePreciseCoverage')
    report.after = await read()
    assertProjectionWindow(report.before, report.after)
    const original = readFileSync(resolve(root, 'app/computer-runtime.ts'), 'utf8')
    const candidates = []
    for (const script of coverage.result) {
      if (!script.url.startsWith(`${new URL(url).origin}/`)) continue
      const pathname = decodeURIComponent(new URL(script.url).pathname)
      const file = resolve(dist, `.${pathname}`)
      if (
        !file.startsWith(resolve(dist) + sep) ||
        !file.endsWith('.js') ||
        !existsSync(`${file}.map`)
      )
        continue
      const mapText = readFileSync(`${file}.map`, 'utf8'),
        map = JSON.parse(mapText)
      if (
        !map.sources?.some(source =>
          source.replaceAll('\\', '/').endsWith('/app/computer-runtime.ts')
        )
      )
        continue
      const code = readFileSync(file, 'utf8')
      const observed = await cdp.send('Debugger.getScriptSource', { scriptId: script.scriptId })
      assert.equal(
        observed.scriptSource,
        code,
        'Browser script bytes must equal the source-bound emitted bundle'
      )
      writeFileSync(
        resolve(output, 'spell-projection-coverage.json'),
        JSON.stringify({ timestamp: coverage.timestamp, script }, null, 2) + '\n'
      )
      candidates.push({
        url: script.url,
        bundleSha256: sha256(code),
        sourceMapSha256: sha256(mapText),
        originalSha256: sha256(original),
        functions: projectionCoverage({ code, map, original, functions: script.functions }),
      })
    }
    assert.equal(
      candidates.length,
      1,
      'Exactly one source-bound coverage bundle must contain the adapter'
    )
    report.coverage = candidates[0]
    await page.screenshot({ path: resolve(output, 'spell-projection-after.png') })
  } catch (error) {
    failure = error
    if (page)
      try {
        await page.screenshot({
          path: resolve(output, 'spell-projection-failure.png'),
          timeout: 3000,
        })
      } catch (diagnostic) {
        report.diagnosticError = String(diagnostic)
      }
  } finally {
    clearTimeout(timer)
  }
  return finishSpellProjection({ context, cdp, coverageStarted, report, output, failure })
}
