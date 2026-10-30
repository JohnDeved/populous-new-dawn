import { commandCategory } from '../browser-command-categories.mjs'
import { setWorldPaused } from '../browser-world-input.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { waitForStartupMenu } from '../browser-new-game.mjs'
import { checkpointCodec } from './checkpoint-codec.mjs'
import { m2LoadReady } from './m2-pointer-f8.mjs'
import { createSpySourceFixture } from './spy-source-fixture.mjs'
import { withSpySourceBrowser } from './spy-source-budget.mjs'
import { installSpyHelperDelivery } from './spy-source-delivery.mjs'
import { installSpyCapture } from './spy-source-capture.mjs'
import { installSpySourceObserver, readSpySourceHold } from './spy-source-observer.mjs'
import { validateSpySourceObservation } from './spy-source-evidence.mjs'
import { awaitSpySourceReadiness } from './spy-source-readiness.mjs'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')

// These shipped commands reject paused worlds. Resume through the same public
// control before input, then observe the running state before submitting it.
export async function resumeSpySourceInput(page, action, name, run, options = { timeout: 8000 }) {
  await action(`Resume before ${name}`, () => setWorldPaused(page, false, options))
  await page.waitForFunction(() => !window.testStore.getWorld().paused)
  await action(name, run)
}

// Read-only qualification follows both production pointerDown selection and
// pointerUp command resolution, after public Resume. Raw model hits alone can
// lose to a person or nearby vehicle in the actual command path.
export function readSpySabotageTarget(id) {
  const scene = window.testSceneRef.current, world = scene.world,
    building = world.buildings.find(b => b.id === id)
  if (world.paused) throw Error('Sabotage target must be observed after public Resume')
  const p = scene.screen(building), rect = scene.renderer.domElement.getBoundingClientRect(),
    center = { x: rect.left + (p.x + 1) * rect.width / 2, y: rect.top + (1 - p.y) * rect.height / 2 },
    candidates = []
  for (const dy of [-30, -50, -10, -70, 10, -90])
    for (const dx of [0, -10, 10, -25, 25, -40, 40]) {
      const event = { clientX: Math.trunc(center.x + dx), clientY: Math.trunc(center.y + dy) },
        canvasOwned = document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement,
        rawId = scene.picking.pick(event), downPerson = scene.pickUnit(event)?.id ?? null,
        upPerson = scene.picking.pickPerson(event), commandObject = scene.pickWorldObject(event)?.id ?? null
      candidates.push({ x: event.clientX, y: event.clientY, canvasOwned, rawId, downPerson, upPerson, commandObject })
      if (canvasOwned && rawId === id && downPerson === null && upPerson == null && commandObject === id)
        return { ...candidates.at(-1), id, turn: world.turn, paused: world.paused,
          camera: { ...scene.cameraPosition }, candidates }
    }
  throw Error('Supplied hostile hut lacks a genuine exposed production command hit: ' + JSON.stringify(candidates))
}

export function readSpyCommandFailure({ spyId, targetId, commandPick }) {
  const scene = window.testSceneRef?.current, world = scene?.world,
    spy = world?.units.find(unit => unit.id === spyId), native = spy?.native,
    event = commandPick && { clientX: commandPick.x, clientY: commandPick.y },
    orderIds = native ? [native.immediateCommand, ...native.commands] : [],
    observed = window.__pndSpySourceObservation?.retain()
  return { turn: world?.turn, paused: world?.paused, inputMask: world?.inputMask,
    selected: world?.selected.slice(0, 20), lastOrderTurn: world?.lastOrderTurn,
    runtime: window.__pndSpySourceObservation?.readRuntime?.(),
    targetId, spy: spy && { id: spy.id, hp: spy.hp, target: spy.target, x: spy.x, z: spy.z, native: { ...native },
      fight: spy.fight, flight: spy.flight, entry: spy.entry },
    orders: orderIds.map(id => ({ id, record: world.buildingOrders.records[id] })),
    camera: scene && { ...scene.cameraPosition }, pointer: scene?.pointerScreen,
    navigationPointer: scene?.navigationPointer,
    pick: event && { rawId: scene.picking.pick(event), person: scene.picking.pickPerson(event),
      downPerson: scene.pickUnit(event)?.id ?? null, commandObject: scene.pickWorldObject(event)?.id ?? null,
      canvasOwned: document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement },
    observation: observed && { ...observed, samples: observed.samples.slice(-64), crops: observed.crops.slice(0, 2) } }
}

// Diagnostic collection gets only a bounded part of the existing episode time.
// It cannot replace the original failure or delay closure beyond that deadline.
export async function retainSpyCommandFailure(page, report, fixture, deadlineAt, now = Date.now) {
  const remaining = Math.min(500, deadlineAt - now())
  if (remaining <= 0) { report.failureDiagnostics = { status: 'deadline-exhausted' }; return }
  let timer
  try {
    report.failureDiagnostics = await Promise.race([
      page.evaluate(readSpyCommandFailure, { spyId: fixture.spyId, targetId: fixture.targetId, commandPick: report.commandPick }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Failure diagnostics budget exhausted')), remaining) }),
    ])
  } catch (error) { report.failureDiagnostics = { status: 'unavailable', error: String(error) } }
  finally { clearTimeout(timer) }
}

// Standalone supplied-fixture presentation witness. It may run only after the
// complete existing M10 episode, never as a substitute for either of its phases.
export default async function spySource(options) {
  const { output, url, source } = options
  const report = { status: 'running', evidenceVersion: 3, errors: [], actions: [], sourceCommit: source.commit,
    sources: Object.fromEntries(['spy-source.mjs', 'spy-source-fixture.mjs', 'spy-source-budget.mjs',
      'spy-source-observer.mjs', 'spy-source-capture.mjs', 'spy-source-delivery.mjs', 'spy-source-evidence.mjs', 'spy-source-readiness.mjs', 'checkpoint-codec.mjs', '../browser-command-categories.mjs']
      .map(file => [file, hash(readFileSync(new URL(file, import.meta.url)))])),
    inputs: Object.fromEntries(['scripts/controlled-scene-frames.mjs', 'app/scene.ts', 'app/game-clock.ts', 'app/world-turn.ts', 'app/follower-appearance.ts', 'app/scene-entities.ts',
      'app/live-building-combat.ts', 'app/original-units.json', 'app/checkpoint-format.ts',
      'tests/fixtures/follower-source-witness.json', 'tests/fixtures/follower-source-artwork.json']
      .map(file => [file, hash(readFileSync(new URL(`../../${file}`, import.meta.url)))])),
    limits: [
      'Supplied current-format checkpoint with flat terrain, school, Brave, training funding and hostile hut; real training controller, not natural Mission12/campaign acquisition.',
      'Public Load Game, Skip introduction when the restored flyby owns input, Select spy, right-click focus, disguise, canvas sabotage command, Pause and Resume; public input and actual production Home renderer; the sabotage capture uses controlled elapsed full Scene frames.',
      'Transparent pre-animation afterTurn ledger, separate completed-step logical ledger and controlled 1000/24ms complete Scene frames with immutable actual frame0/1 crops. Not natural wall-clock timing or performance. No hardware performance, original-game execution, all-sprite sweep or pixel-perfect native raster claim.',
      'Helper delivery is test-routed native ESM. Playwright routing disables HTTP cache; module-map reuse is not natural network/cache/performance evidence, and route removal is not a cache-restoration claim.',
      'Exact logical pending entry and the first rendered entry frame must both be observed. A missed frame, short budget or absent crop is failure, not a skip or substituted later sample.',
    ] }
  const save = () => writeFileSync(resolve(output, 'spy-source.json'), JSON.stringify(report, null, 2) + '\n')
  save()
  try {
    await withSpySourceBrowser({ ...options, report }, async (browser, budget) => {
      report.browserVersion = browser.version()
      const fixture = await createSpySourceFixture(source.commit)
      report.fixture = fixture.receipt; report.spyId = fixture.spyId; report.targetId = fixture.targetId; save()
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
      const page = await context.newPage()
      page.setDefaultTimeout(8000)
      const errors = error => { if (report.errors.length < 20) report.errors.push(String(error).slice(0, 2000)) }
      page.on('pageerror', errors)
      page.on('console', message => { if (message.type() === 'error') errors(message.text()) })
      page.on('crash', () => errors('Spy page crashed'))
      const button = name => page.getByRole('button', { name, exact: true })
      const action = async (name, run) => {
        const item = { name, startedAt: Date.now() }; report.actions.push(item); save()
        await run(); item.endedAt = Date.now(); save()
      }
      let delivery
      try {
        delivery = await installSpyHelperDelivery({ page, url,
          bytes: readFileSync(new URL('../controlled-scene-frames.mjs', import.meta.url)),
          deadlineAt: budget.deadlineAt, report })
        await page.addInitScript({ content: `window.spyCheckpointCodec = ${checkpointCodec.toString()};` })
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        const readback = await page.evaluate(async encoded => {
          const checkpoint = window.spyCheckpointCodec(JSON.parse(encoded), true)
          const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('populous-new-dawn', 1)
            request.onupgradeneeded = () => request.result.createObjectStore('checkpoints')
            request.onerror = () => reject(request.error); request.onsuccess = () => resolve(request.result)
          })
          try {
            await new Promise((resolve, reject) => {
              const tx = db.transaction('checkpoints', 'readwrite')
              tx.objectStore('checkpoints').put(checkpoint, 'latest')
              tx.oncomplete = resolve; tx.onerror = tx.onabort = () => reject(tx.error)
            })
            return await new Promise((resolve, reject) => {
              const tx = db.transaction('checkpoints', 'readonly'), request = tx.objectStore('checkpoints').get('latest')
              tx.oncomplete = () => resolve(JSON.stringify(window.spyCheckpointCodec(request.result)))
              tx.onerror = tx.onabort = () => reject(tx.error)
            })
          } finally { db.close() }
        }, JSON.stringify(fixture.transfer))
        assert.deepEqual(JSON.parse(readback), fixture.transfer, 'Full structured checkpoint survives actual IDB')
        report.checkpointReadbackSha256 = hash(readback)
        assert.equal(report.checkpointReadbackSha256, fixture.receipt.transferSha256)
        await page.reload({ waitUntil: 'domcontentloaded' })
        await delivery.preflight(); save()
        await waitForStartupMenu(page)
        await page.waitForFunction(m2LoadReady)
        await page.evaluate(() => {
          const main = document.querySelector('main')
          let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
          for (; fiber && !store; fiber = fiber.return)
            for (let hook = fiber.memoizedState; hook; hook = hook.next)
              if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
          if (!store) throw Error('Store unavailable before public Load')
          const before = store.getWorld()
          const unsubscribe = store.subscribe(() => {
            if (store.getWorld() === before) return
            window.spyLoadBoundary = JSON.stringify(window.spyCheckpointCodec(store.getWorld()))
            unsubscribe()
          })
        })
        await action('Public Load Game', () => button('Load Game').click())
        assert.deepEqual(JSON.parse(await page.evaluate(() => window.spyLoadBoundary)), fixture.expected,
          'Public Load admits the exact full current checkpoint')
        report.loadBoundaryMatched = true
        await bindGame(page)
        await awaitSpySourceReadiness({ page, report, action, save, deadlineAt: budget.deadlineAt })
        report.renderer = await page.evaluate(() => {
          const gl = window.testSceneRef.current.renderer.getContext()
          const debug = gl.getExtension('WEBGL_debug_renderer_info')
          return { version: gl.getParameter(gl.VERSION), renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER) }
        })
        await action('Public Pause', () => setWorldPaused(page, true, { timeout: Math.min(8000, budget.deadlineAt - Date.now()) }))
        await page.waitForFunction(() => window.testStore.getWorld().paused)
        await action('Select trained Spy', () => button('Select spy').click())
        await action('Public Spy focus', () => button('Select spy').click({ button: 'right' }))
        await page.waitForFunction(() => !window.testSceneRef.current.cameraMotion.active && !window.testSceneRef.current.viewTransition)
        assert.deepEqual(await page.evaluate(() => window.testStore.getWorld().selected), [fixture.spyId])
        await action('Open followers', () => commandCategory(page, 'followers').click())
        await resumeSpySourceInput(page, action, 'Disguise as Dakini', () => button('Disguise selected spies as Dakini').click(), { timeout: Math.min(8000, budget.deadlineAt - Date.now()) })
        await page.waitForFunction(id => window.testStore.getWorld().units.find(unit => unit.id === id)?.native?.disguise === 0x40, fixture.spyId)
        await action('Pause before sabotage', () => setWorldPaused(page, true, { timeout: Math.min(8000, budget.deadlineAt - Date.now()) }))
        await page.waitForFunction(() => window.testStore.getWorld().paused)
        report.capture = await page.evaluate(installSpyCapture, { deadlineAt: budget.deadlineAt })
        const observationStart = await page.evaluate(installSpySourceObserver, { spyId: fixture.spyId, targetId: fixture.targetId, controlled: true })
        assert.equal(observationStart.error, null, 'Logical observer must own its hook before public sabotage')
        await resumeSpySourceInput(page, action, 'Canvas sabotage command', async () => {
          const target = await page.evaluate(readSpySabotageTarget, fixture.targetId)
          report.commandPick = target; save()
          await page.mouse.click(target.x, target.y)
        }, { timeout: Math.min(8000, budget.deadlineAt - Date.now()) })
        report.order = await page.evaluate(id => {
          const world = window.testStore.getWorld(), spy = world.units.find(unit => unit.id === id)
          return { target: spy.target, selected: [...world.selected], lastOrderTurn: world.lastOrderTurn }
        }, fixture.spyId)
        assert.equal(report.order.target, fixture.targetId)
        report.capture = await page.evaluate(async () => {
          const { runSceneFrames } = await import('/scripts/controlled-scene-frames.mjs')
          const observer = window.__pndSpySourceObservation
          return window.__pndSpyCapture.drive(runSceneFrames, observer.sample, () => {
            if (observer.result.error) throw Error(observer.result.error)
            return observer.result.done
          })
        })
        delivery.verifyCacheReuse()
        await delivery.close()
        assert.equal(report.delivery.error, null)
        await action('Pause real source136', () => setWorldPaused(page, true, { timeout: Math.min(8000, budget.deadlineAt - Date.now()) }))
        await page.waitForFunction(() => window.testStore.getWorld().paused)
        report.capture = await page.evaluate(() => window.__pndSpyCapture.release())
        report.holdBefore = await page.evaluate(readSpySourceHold, fixture.spyId)
        assert.equal(report.holdBefore.spy.native.object, 136)
        await page.waitForTimeout(180)
        report.holdAfter = await page.evaluate(readSpySourceHold, fixture.spyId)
        report.observation = await page.evaluate(() => window.__pndSpySourceObservation.retain())
        for (const crop of report.observation.crops) {
          assert.match(crop.filename, /^spy-source-frame-\d+\.png$/)
          assert.ok(crop.png.startsWith('data:image/png;base64,'))
          const bytes = Buffer.from(crop.png.slice('data:image/png;base64,'.length), 'base64')
          assert.ok(bytes.length > 0 && bytes.length < 256 * 1024)
          crop.sha256 = hash(bytes); delete crop.png
          writeFileSync(resolve(output, crop.filename), bytes, { flag: 'wx' })
        }
        await page.screenshot({ path: resolve(output, 'spy-source-context.png'), timeout: 3000 })
        await action('Public Resume continuation', () => setWorldPaused(page, false, { timeout: Math.min(8000, budget.deadlineAt - Date.now()) }))
        await page.waitForFunction(turn => window.testStore.getWorld().turn > turn, report.holdAfter.turn)
        report.resumed = await page.evaluate(readSpySourceHold, fixture.spyId)
        report.validation = validateSpySourceObservation(report)
        assert.deepEqual(report.errors, [])
      } catch (error) {
        await retainSpyCommandFailure(page, report, fixture, budget.deadlineAt)
        if (!page.isClosed()) report.capture = await page.evaluate(() => window.__pndSpyCapture?.result).catch(() => report.capture)
        save()
        throw error
      } finally {
        await delivery?.close()
        if (!page.isClosed()) {
          try {
            const final = await page.evaluate(() => {
              const errors = [], observer = window.__pndSpySourceObservation, capture = window.__pndSpyCapture
              try { observer?.stop() } catch (error) { errors.push(String(error)) }
              try { capture?.abandon() } catch (error) { errors.push(String(error)) }
              return { capture: capture?.result, hook: observer?.result.hook, errors }
            })
            if (final.capture) report.capture = final.capture
            report.captureCleanup = { completed: true, hook: final.hook, errors: final.errors }
            if (final.errors.length || final.capture?.error ||
              (final.capture?.installed && !final.capture.released) ||
              (final.hook?.installed && (!final.hook.restored || final.hook.foreign)))
              report.captureCleanupFailure = 'Final capture ownership cleanup failed'
          } catch (error) { report.captureCleanupFailure = String(error) }
          save() // Preserve post-abandon outcomes even when the original episode failed.
        } else report.captureCleanupFailure = 'Page closed before capture ownership cleanup'
        // Browser ownership wrapper also closes any context if this fails.
        await context.close()
      }
    })
    assert.equal(report.captureCleanupFailure, undefined, 'Capture ownership cleanup must succeed')
    report.status = 'passed'
  } catch (error) {
    report.status = 'failed'; report.failure = String(error); throw error
  } finally { save() }
  return report
}
