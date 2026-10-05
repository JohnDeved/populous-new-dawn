import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { checkpointObservation, readCommittedCheckpoint } from './checkpoint-observer.mjs'
import { prepareM1LightningRoute, m1RouteSource, publicWorshipOrder } from './ordinary-worship-m1-route.mjs'

// One phase per invocation, one frozen scenario for both browser processes.
// Save and Load use the SAME profile/origin/source/runtime, fresh output paths.
// No automatic retries: a missed real tail or unavailable hidden state is unproved.
const phases = new Set(['flight-save', 'flight-load', 'tail-save', 'tail-load', 'hidden', 'restart', 'missing-geometry'])

async function installEarlyObserver(page, phase) {
  await page.evaluate(async phase => {
    const { GameScene } = await import('/app/scene.ts'), restorers = []
    const evidence = window.worshipBoundaryEvidence = {
      errors: [], replacement: null, start: null, cues: 0, visits: 0,
      handoffs: [], draws: {}, drawCosts: [], visibility: [], firstVisibleDraw: null, resumedMotion: null, restored: false,
    }
    const focus = w => {
      const observed = structuredClone({ level: w.outcome.level, turn: w.turn, paused: w.paused,
        acquisition: w.worshipAcquisition, gifts: w.gifts.filter(g => g.reward === 'lightning'),
        stock: w.shots.lightning, count: w.giftCounts.lightning,
        gameplayRandom: w.randomState, cosmeticRandom: w.cosmeticRandom })
      // Preserve JSON-unsafe values only in observation copies. The native
      // gift duration is the sole admitted infinity; never repair a stored null.
      for (const gift of observed.gifts)
        if (typeof gift.duration !== 'number' || (!Number.isFinite(gift.duration) && gift.duration !== Infinity))
          throw Error('Unexpected gift duration in boundary observation')
      const retain = (value, path = '') => {
        if (typeof value === 'number') {
          if (value === Infinity && /^gifts\.\d+\.duration$/.test(path)) return { pndNumber: '+Infinity' }
          if (!Number.isFinite(value)) throw Error(`Unexpected nonfinite number at ${path}`)
          return Object.is(value, -0) ? { pndNumber: '-0' } : value
        }
        if (value === undefined) return { pndValue: 'undefined' }
        if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
        if (Array.isArray(value)) return Array.from({ length: value.length }, (_, i) =>
          i in value ? retain(value[i], `${path}.${i}`) : { pndValue: 'array-hole' })
        if (typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype)
          throw Error(`Unsupported observation value at ${path}`)
        if (Object.hasOwn(value, 'pndNumber') || Object.hasOwn(value, 'pndValue'))
          throw Error(`Reserved observation tag in original state at ${path}`)
        return Object.fromEntries(Object.entries(value).map(([key, item]) =>
          [key, retain(item, path ? `${path}.${key}` : key)]))
      }
      return retain(observed)
    }
    window.worshipBoundaryFocus = focus
    const observe = fn => { try { return fn() } catch (error) {
      if (evidence.errors.length < 16) evidence.errors.push(String(error.stack ?? error))
    } }
    const wrap = (owner, key, factory) => {
      const own = Object.hasOwn(owner, key), original = owner[key], replacement = factory(original)
      owner[key] = replacement
      const restore = () => {
        if (owner[key] !== replacement) throw Error(`Changed observer owner: ${key}`)
        if (own) owner[key] = original; else delete owner[key]
      }
      restorers.push(restore)
      return restore
    }
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
    for (; fiber && !store; fiber = fiber.return) for (let hook = fiber.memoizedState; hook; hook = hook.next)
      if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
    if (!store) throw Error('Store unavailable before public mission/Load')
    const before = store.getWorld()
    const unsubscribe = store.subscribe(() => {
      const world = store.getWorld()
      if (world === before || evidence.replacement) return
      observe(() => {
        // Runs inside replaceWorld publication, before public Load auto-resume
        // and before the new scene constructor. No pause or store mutation.
        evidence.replacement = focus(world)
        window.worshipBoundaryReplacement = { version: 1, world: structuredClone(world) }
      })
      unsubscribe()
    })
    restorers.push(unsubscribe)
    let awaitingVisibleDraw = false, currentDrawing = null, insideDraw = false, measureCalls = 0
    const costCounts = { active: 0, paused: 0 }
    const visibility = () => queueMicrotask(() => observe(() => {
      const scene = window.worshipBoundaryScene
      if (!scene) return
      evidence.visibility.push({ hidden: document.hidden, previous: scene.previous, focus: focus(scene.world) })
      if (evidence.visibility.length > 8) throw Error('Visibility observation bound exceeded')
      if (!document.hidden) awaitingVisibleDraw = true
    }))
    document.addEventListener('visibilitychange', visibility)
    restorers.push(() => document.removeEventListener('visibilitychange', visibility))
    const installAcquisitionObserver = scene => {
      if (evidence.observationArmed) throw Error('Acquisition observer already installed')
      evidence.observationArmed = focus(scene.world)
      const presentation = scene.worshipPresentation,
        canvas = document.querySelector('.worship-acquisition-overlay'), ctx = canvas.getContext('2d')
      const gl = scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
      evidence.renderer = { webgl: gl.getParameter(gl.VERSION),
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) }
      wrap(scene, 'onSound', original => function (...args) {
        const result = original.apply(this, args)
        if (args[0] === 0x71) evidence.cues++
        return result
      })
      wrap(scene.gameClock, 'afterTurn', original => function (...args) {
        const queued = [...scene.world.worshipAcquisition.requests], result = original.apply(this, args)
        if (queued.length) observe(() => evidence.handoffs.push({ turn: scene.world.turn, queued, focus: focus(scene.world), diagnostics: structuredClone(presentation.diagnostics) }))
        if (phase === 'missing-geometry' && scene.world.giftCounts.lightning && !evidence.faultPayout)
          observe(() => { evidence.faultPayout = focus(scene.world) })
        return result
      })
      wrap(scene.gameClock, 'worshipVisit', original => function (...args) {
        const motion = () => {
          const w = scene.world, spell = w.worshipAcquisition.controllers.spell
          return spell && { turn: w.turn, paused: w.paused, active: spell.active, model: spell.model,
            giftId: spell.giftId, position: { ...spell.position }, clock: { ...w.worshipAcquisition.clock } }
        }
        const before = phase === 'flight-load' && !evidence.resumedMotion ? observe(motion) : null
        const result = original.apply(this, args)
        evidence.visits++
        if (before?.active && !before.paused) observe(() => {
          const after = motion()
          if (after?.giftId === before.giftId && !after.paused &&
              (after.position.x !== before.position.x || after.position.y !== before.position.y))
            evidence.resumedMotion = { before, after }
        })
        return result
      })
      wrap(presentation.bridge, 'measure', original => function (...args) {
        const result = original.apply(this, args)
        if (insideDraw) measureCalls++
        if (currentDrawing && args[0] === 3) currentDrawing.layout = result
        return result
      })
      wrap(presentation, 'sprite', original => function (...args) {
        const result = original.apply(this, args)
        // Bind the actual returned sprite canvas to its original command.
        // This is draw wiring evidence, not an independent source-raster oracle.
        if (currentDrawing) currentDrawing.spriteRequest = { command: args[0], image: result }
        return result
      })
      wrap(ctx, 'drawImage', original => function (...args) {
        const result = original.apply(this, args)
        if (currentDrawing && args.length === 9 && args[0] instanceof HTMLImageElement) observe(() => {
          const t = this.getTransform()
          currentDrawing.bodyCall = { kind: 'body', args: args.slice(1), transform: [t.a, t.b, t.c, t.d, t.e, t.f], alpha: this.globalAlpha }
        })
        if (currentDrawing && args.length === 5) observe(() => {
          const request = currentDrawing.spriteRequest
          if (request?.command.owner !== 'pulse' || request.command.model !== 3 || args[0] !== request.image) return
          const t = this.getTransform()
          currentDrawing.pulseCall = { kind: 'pulse', frame: request.command.frame,
            args: args.slice(1), transform: [t.a, t.b, t.c, t.d, t.e, t.f], alpha: this.globalAlpha,
            sourceSize: [request.image.width, request.image.height] }
        })
        return result
      })
      wrap(presentation, 'draw', original => function (...args) {
        const tag = window.worshipBoundaryDrawTag,
          commands = scene.world.worshipAcquisition.controllers.drawCommands,
          command = commands.find(c => c.model === 3),
          category = scene.world.paused ? 'paused' : 'active',
          cost = command && costCounts[category] < 64 ? {
            category, commandCount: commands.length, referenceCount: new Set(commands.map(c => c.geometry)).size,
            turn: scene.world.turn, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
          } : null
        currentDrawing = tag && command && !evidence.draws[tag] ? { tag, command, layout: null, bodyCall: null, pulseCall: null } : null
        const drawing = currentDrawing
        let result, duration
        measureCalls = 0; insideDraw = true
        const started = performance.now()
        try { result = original.apply(this, args) }
        finally { duration = performance.now() - started; currentDrawing = null; insideDraw = false }
        observe(() => {
          if (cost) { costCounts[category]++; evidence.drawCosts.push({ ...cost, milliseconds: duration, measureCalls }) }
          if (awaitingVisibleDraw) {
            evidence.firstVisibleDraw = { turn: scene.world.turn, clock: structuredClone(scene.world.worshipAcquisition.clock) }
            awaitingVisibleDraw = false
          }
          if (drawing) {
            const call = phase === 'tail-load' && tag === 'restored-first-frame' ? drawing.pulseCall : drawing.bodyCall
            const alpha = { testedPixels: 0, nontransparent: 0, samples: [], bounds: null }
            if (call) {
              const [a, b, c, d, e, f] = call.transform,
                [x, y, w, h] = call.kind === 'body' ? call.args.slice(4) : call.args,
                corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([x, y]) => [a * x + c * y + e, b * x + d * y + f]),
                left = Math.max(0, Math.floor(Math.min(...corners.map(p => p[0])))),
                top = Math.max(0, Math.floor(Math.min(...corners.map(p => p[1])))),
                right = Math.min(canvas.width, Math.ceil(Math.max(...corners.map(p => p[0])))),
                bottom = Math.min(canvas.height, Math.ceil(Math.max(...corners.map(p => p[1]))))
              if (right > left && bottom > top) {
                const count = (right - left) * (bottom - top)
                if (count > 1_000_000) throw Error('Overlay alpha observation exceeds bounded region')
                const pixels = ctx.getImageData(left, top, right - left, bottom - top)
                alpha.bounds = [left, top, pixels.width, pixels.height]; alpha.testedPixels = count
                for (let i = 3; i < pixels.data.length; i += 4) if (pixels.data[i]) {
                  alpha.nontransparent++
                  if (alpha.samples.length < 8) alpha.samples.push([left + ((i >>> 2) % pixels.width), top + Math.floor((i >>> 2) / pixels.width), pixels.data[i]])
                }
              }
            }
            evidence.draws[tag] = { turn: scene.world.turn,
              command: structuredClone(drawing.command), layout: structuredClone(drawing.layout), bodyCall: drawing.bodyCall, pulseCall: drawing.pulseCall,
              alpha, canvas: [canvas.width, canvas.height], dpr: devicePixelRatio,
              viewport: [innerWidth, innerHeight], hidden: canvas.hidden, png: canvas.toDataURL() }
          }
        })
        return result
      })
    }
    window.armWorshipBoundaryAcquisition = () => {
      const scene = window.worshipBoundaryScene, w = scene.world, a = w.worshipAcquisition, c = a.controllers
      if (scene.world !== store.getWorld() || w.gifts.length || a.requests.length ||
          c.spell?.active || c.companion?.active || c.pulse?.active || c.drawCommands.length ||
          !scene.worshipPresentation.canvas.hidden)
        throw Error('Lightning observation requires current scene and completed prerequisite presentation')
      installAcquisitionObserver(scene)
    }
    const restoreStart = wrap(GameScene.prototype, 'start', original => function (...args) {
      observe(() => {
        if (evidence.start) throw Error('Unexpected second scene start in this phase')
        window.worshipBoundaryScene = this
        evidence.start = { focus: focus(this.world), startedBefore: this.started,
          currentWorld: this.world === store.getWorld(), connected: this.renderer.domElement.isConnected }
        if (phase.endsWith('-load')) installAcquisitionObserver(this)
        // The one-shot prototype hook restores BEFORE original start. Load instance
        // observers precede original RAF; fresh phases retain this initial snapshot
        // but install acquisition observers only after the ordinary Bridge route.
        restoreStart(); restorers.splice(restorers.indexOf(restoreStart), 1)
      })
      return original.apply(this, args)
    })
    window.prepareWorshipBoundaryRestart = () => {
      if (phase !== 'restart' || evidence.restart) throw Error('Unexpected restart observation request')
      const old = window.worshipBoundaryScene, oldOverlay = old.worshipPresentation.canvas, beforeWorld = store.getWorld()
      if (old.world !== beforeWorld || !old.world.worshipAcquisition.controllers.spell?.active) throw Error('Restart requires genuine current flight')
      window.worshipBoundaryOldScene = old
      window.worshipBoundaryOldOverlay = oldOverlay
      evidence.restart = { before: focus(old.world), cues: 0, replacement: null, start: null }
      const unsubscribe = store.subscribe(() => {
        const world = store.getWorld()
        if (world === beforeWorld) return
        observe(() => { evidence.restart.replacement = focus(world) })
        unsubscribe()
      })
      restorers.push(unsubscribe)
      const restoreRestartStart = wrap(GameScene.prototype, 'start', original => function (...args) {
        observe(() => {
          if (this === old || evidence.restart.start) throw Error('Restart did not produce one new scene')
          window.worshipBoundaryScene = this
          evidence.restart.start = { focus: focus(this.world), startedBefore: this.started,
            currentWorld: this.world === store.getWorld(), oldWorldReused: this.world === beforeWorld }
          wrap(this, 'onSound', original => function (...args) {
            const result = original.apply(this, args)
            if (args[0] === 0x71) evidence.restart.cues++
            return result
          })
          restoreRestartStart(); restorers.splice(restorers.indexOf(restoreRestartStart), 1)
        })
        return original.apply(this, args)
      })
    }
    window.restoreWorshipBoundaryObserver = () => {
      for (const restore of restorers.reverse()) observe(restore)
      evidence.restored = evidence.errors.length === 0
      delete window.restoreWorshipBoundaryObserver
    }
  }, phase)
}

async function readStoredFocus(page) {
  return page.evaluate(async () => {
    if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn')) return null
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('populous-new-dawn')
      request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('Missing checkpoint database')) }
      request.onerror = () => reject(request.error); request.onsuccess = () => resolve(request.result)
    })
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('checkpoints', 'readonly'), request = tx.objectStore('checkpoints').get('latest')
        tx.oncomplete = () => resolve(request.result?.world ? window.worshipBoundaryFocus(request.result.world) : null)
        tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error ?? Error('Checkpoint read aborted'))
      })
    } finally { db.close() }
  })
}

const snap = page => page.evaluate(() => window.worshipBoundaryFocus(window.worshipBoundaryScene.world))
const body = state => {
  const spell = state.acquisition.controllers.spell
  return spell && { position: spell.position, scale: spell.scale, rotation: spell.rotation, giftId: spell.giftId }
}
const eligibleFlight = state => !!state?.acquisition.controllers.spell?.active && state.gifts.some(g => g.ordinaryWorship && g.remaining > 1)
const eligibleTail = state => !!state?.acquisition.controllers.pulse?.active &&
  !state.acquisition.controllers.spell?.active && !state.acquisition.controllers.companion?.active

async function orderLightning(page, waitForShamanReadiness, report) {
  const shrine = await page.evaluate(() => window.testStore.getWorld().shrines.find(s =>
    s.kind === 'lightning' && s.x === 11 && s.z === 1))
  assert.ok(shrine?.ordinarySpellReward); assert.equal(shrine.required, 1); assert.equal(shrine.target, 32)
  await publicWorshipOrder(page, shrine, 'brave', report, waitForShamanReadiness)
  return report.orders.at(-1)
}

async function restartDuringFlight(page, bindGame, waitForShamanReadiness, wait, output) {
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  const menu = page.locator('dialog.game-dialog')
  await menu.waitFor({ state: 'visible' })
  await page.evaluate(() => window.prepareWorshipBoundaryRestart())
  await menu.getByRole('button', { name: 'Restart world', exact: true }).click()
  await bindGame(page)
  await wait(() => !!window.worshipBoundaryEvidence.restart?.start, null, 45000, 'New scene starts after public Restart')
  const result = await page.evaluate(() => {
    const old = window.worshipBoundaryOldScene, next = window.worshipBoundaryScene, presentation = old.worshipPresentation,
      overlays = [...document.querySelectorAll('.worship-acquisition-overlay')]
    return { observation: window.worshipBoundaryEvidence.restart, initial: window.worshipBoundaryEvidence.start.focus,
      old: { disposed: old.disposed, overlayConnected: window.worshipBoundaryOldOverlay.isConnected,
        sprites: presentation.sprites.size, anchors: presentation.anchors.size, previousParticles: presentation.previousParticles.size },
      next: { distinct: next !== old, disposed: next.disposed, overlayCount: overlays.length,
        ownsOnlyOverlay: overlays[0] === next.worshipPresentation.canvas, overlayConnected: next.worshipPresentation.canvas.isConnected,
        rendererConnected: next.renderer.domElement.isConnected } }
  })
  assert.deepEqual(result.old, { disposed: true, overlayConnected: false, sprites: 0, anchors: 0, previousParticles: 0 })
  assert.deepEqual(result.next, { distinct: true, disposed: false, overlayCount: 1, ownsOnlyOverlay: true, overlayConnected: true, rendererConnected: true })
  const start = result.observation.start
  assert.equal(start.startedBefore, false); assert.equal(start.currentWorld, true); assert.equal(start.oldWorldReused, false)
  assert.deepEqual(start.focus.acquisition, result.initial.acquisition, 'Restart restores the complete pre-RAF acquisition state, including deadline and limiter')
  assert.equal(start.focus.stock, result.initial.stock, 'Restart restores the original pre-RAF Lightning stock')
  assert.deepEqual(start.focus.gifts, []); assert.equal(start.focus.count, 0)
  await wait(() => !window.worshipBoundaryScene.world.inputMask || !!(window.worshipBoundaryScene.world.flyby.flags & 1), null, 45000, 'Restart introduction becomes skippable')
  const skip = page.locator('.skip-introduction')
  if (await skip.isVisible()) await skip.click()
  const resume = page.getByRole('button', { name: 'Resume game', exact: true })
  if (await resume.isVisible()) await resume.click()
  result.readiness = await waitForShamanReadiness(page, { timeout: 45000 })
  const turn = (await snap(page)).turn
  await wait(turn => window.worshipBoundaryScene.world.turn >= turn + 12, turn, 10000, 'Clean replacement remains on ordinary clock')
  result.after = await snap(page)
  assert.equal(await page.evaluate(() => window.worshipBoundaryEvidence.restart.cues), 0)
  assert.equal(result.after.count, 0); assert.deepEqual(result.after.gifts, [])
  assert.deepEqual(result.after.acquisition.controllers, { spell: null, companion: null, pulse: null, drawCommands: [] })
  await page.screenshot({ path: resolve(output, 'restart-clean-scene.png') })
  return result
}

async function missingGeometry(page, wait, output) {
  await wait(() => window.worshipBoundaryScene.world.gifts.some(g => g.reward === 'lightning' && g.ordinaryWorship && g.phase > 0), null, 120000, 'Real positive-phase gift before DOM-only fault')
  const staged = await page.evaluate(() => {
    const world = window.worshipBoundaryScene.world, gift = world.gifts.find(g => g.reward === 'lightning' && g.ordinaryWorship && g.phase > 0),
      hud = document.querySelector('.native-hud')
    if (!gift || world.paused || !hud || hud.getBoundingClientRect().width <= 0) throw Error('Positive-phase DOM fault window unavailable')
    const priorStyle = hud.getAttribute('style'), state = window.worshipBoundaryFocus(world)
    window.restoreWorshipGeometryHud = () => {
      if (document.querySelector('.native-hud') !== hud) throw Error('Fault HUD ownership changed')
      if (priorStyle === null) hud.removeAttribute('style'); else hud.setAttribute('style', priorStyle)
      const result = { exactStyle: hud.getAttribute('style') === priorStyle, width: hud.getBoundingClientRect().width }
      delete window.restoreWorshipGeometryHud
      if (!result.exactStyle || result.width <= 0) throw Error('Original HUD style did not restore exactly')
      return result
    }
    hud.style.display = 'none' // Explicit exceptional-path DOM fault, never normal acceptance.
    return { label: 'Staged display:none on actual .native-hud only', priorStyle, state,
      hiddenRect: { width: hud.getBoundingClientRect().width, offsetWidth: hud.offsetWidth } }
  })
  assert.equal(staged.hiddenRect.width, 0); assert.equal(staged.hiddenRect.offsetWidth, 0)
  const gift = staged.state.gifts[0]
  await wait(() => window.worshipBoundaryScene.worshipPresentation.diagnostics.length > 0, null, 10000, 'Real missing-geometry diagnostic')
  const fault = await page.evaluate(() => ({ state: window.worshipBoundaryFocus(window.worshipBoundaryScene.world),
    diagnostics: window.worshipBoundaryScene.worshipPresentation.diagnostics, cues: window.worshipBoundaryEvidence.cues }))
  assert.equal(fault.diagnostics.length, 1); assert.equal(fault.diagnostics[0].reason, 'handoff geometry')
  assert.equal(fault.diagnostics[0].gift, gift.id); assert.equal(fault.diagnostics[0].model, 3)
  assert.equal(fault.cues, 1); assert.equal(fault.state.paused, false)
  assert.deepEqual(fault.state.acquisition.controllers, { spell: null, companion: null, pulse: null, drawCommands: [] })
  await wait(turn => window.worshipBoundaryScene.world.turn >= turn + 2, fault.state.turn, 5000, 'Ordinary unpaused fallback countdown')
  const counting = await snap(page)
  assert.equal(counting.paused, false)
  assert.equal(counting.gifts[0].remaining, fault.state.gifts[0].remaining - (counting.turn - fault.state.turn))
  assert.equal(counting.count, staged.state.count)
  await wait(() => !!window.worshipBoundaryEvidence.faultPayout, null, 20000, 'Ordinary countdown pays once')
  const payout = await page.evaluate(() => window.worshipBoundaryEvidence.faultPayout)
  assert.equal(payout.turn, staged.state.turn + gift.remaining, 'Unshortened actual remaining countdown owns payout')
  assert.equal(payout.count, staged.state.count + 1); assert.equal(payout.stock, staged.state.stock + 1)
  const restoration = await page.evaluate(() => window.restoreWorshipGeometryHud())
  await wait(turn => window.worshipBoundaryScene.world.turn >= turn + 12, payout.turn, 10000, 'No late controller initialization after HUD restore')
  const after = await snap(page)
  assert.equal(after.count, payout.count); assert.equal(after.stock, payout.stock)
  assert.deepEqual(after.acquisition.requests, [])
  assert.deepEqual(after.acquisition.controllers, { spell: null, companion: null, pulse: null, drawCommands: [] })
  assert.equal(await page.evaluate(() => window.worshipBoundaryEvidence.cues), 1)
  assert.equal(await page.evaluate(() => window.worshipBoundaryScene.worshipPresentation.diagnostics.length), 1)
  assert.equal(await page.locator('.worship-acquisition-overlay').isHidden(), true)
  await page.screenshot({ path: resolve(output, 'geometry-fault-restored.png') })
  return { staged, fault, counting, payout, restoration, after }
}

export default async function ({ page, context, root, output, receipt, openMission, signal }) {
  const phase = process.env.POPULOUS_WORSHIP_BOUNDARY_PHASE ?? 'flight-save'
  assert.ok(phases.has(phase), `Unknown boundary phase: ${phase}`)
  assert.ok(receipt.profile, 'Boundary phases require an owned --profile')
  const loading = phase.endsWith('-load'), tail = phase.startsWith('tail-')
  assert.equal(receipt.profile.mode, loading ? 'reused' : 'created', 'Save/hidden use fresh profile; Load reuses its paired save')
  const { bindGame, waitForShamanReadiness } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const { waitForCheckpointReadback } = await import(pathToFileURL(resolve(root, 'scripts/checkpoint-readback.mjs')).href)
  const report = { phase, status: 'running', source: receipt.source,
    focusEncoding: 'Observation-only typed tags preserve native gift.duration +Infinity, negative zero, undefined and array holes across JSON. All other nonfinite values, null duration, unsupported objects and original reserved tags fail; finite numbers remain exact.',
    scenarioSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
    method: 'Real RAF, public mouse/HUD/Save/Load. Read-only synchronous replacement and original-once pre-start callback observation. No direct World/clock/RNG mutation.',
    browserVersion: receipt.browserVersion, routeHelperSha256: m1RouteSource.helperSha256,
    drawCostMethod: 'At most64 active and64 paused samples. Bracket only original presentation.draw; outer state snapshots and PNG capture excluded. Nested observer counters/pass-through wrappers remain; selected draw-argument capture has small extra overhead. Shared CPU/headless/software timing is diagnostic, not FPS or a speedup claim.',
    coveredBoundary: phase === 'restart' ? 'Actual live old-scene disposal via public Restart, not browser termination' : phase === 'missing-geometry' ? 'Explicit DOM-only exceptional-path geometry fault after a real gift' : phase,
    limits: 'Headless/software functional evidence. Two-process continuation is distinct from fresh-page reload. DPR2 is CDP device emulation, not a physical display. Actual drawImage calls plus bounded alpha output and PNG establish limited overlay correspondence; another concurrent sprite can contribute to the alpha region. No full native raster or hardware performance claim. Tail window may be missed; hidden-state support must be demonstrated.' }
  const saveReport = () => writeFileSync(resolve(output, 'ordinary-worship-boundaries.json'), JSON.stringify(report, null, 2) + '\n')
  let armed = false, cover, cdp, originalDisplay
  const wait = async (predicate, argument, timeout, label) => {
    signal.throwIfAborted()
    try { await page.waitForFunction(predicate, argument, { timeout, polling: 10 }) }
    catch (error) { throw Error(`${label}: ${error.message}`) }
  }
  const finish = async () => {
    await wait(() => {
      const w = window.worshipBoundaryScene.world, c = w.worshipAcquisition.controllers
      return !w.gifts.some(g => g.reward === 'lightning') && !c.spell?.active && !c.companion?.active && !c.pulse?.active &&
        !c.drawCommands.length && document.querySelector('.worship-acquisition-overlay').hidden
    }, null, 30000, 'Ordinary acquisition cleanup')
    return snap(page)
  }
  try {
    await installEarlyObserver(page, phase); armed = true
    if (loading) {
      const previous = receipt.profile.previousRun
      assert.equal(previous.status, 'passed'); assert.equal(previous.cleanupVerified, true); assert.equal(previous.continuationVerified, true)
      assert.equal(previous.sourceFingerprint, receipt.source.fingerprint, 'Both processes require the exact same frozen source')
      const priorBytes = readFileSync(previous.receiptPath), priorDigest = createHash('sha256').update(priorBytes).digest('hex')
      assert.equal(priorDigest, previous.receiptSha256, 'Previous receipt bytes must match the owned-profile marker before trusting their result')
      const prior = JSON.parse(priorBytes.toString('utf8'))
      report.previousReceiptIntegrity = { sha256: priorDigest, verified: true }
      assert.equal(prior.result.phase, tail ? 'tail-save' : 'flight-save')
      assert.equal(prior.scenario.sha256, report.scenarioSha256)
      assert.equal(prior.result.routeHelperSha256, report.routeHelperSha256, 'Both process runs require identical prerequisite helper bytes')
      assert.deepEqual(receipt.profile.checkpointAtStart, prior.profile.checkpointAtEnd)
      const savedFocus = await readStoredFocus(page), stored = await readCommittedCheckpoint(page)
      assert.deepEqual(savedFocus, prior.result.saved.focus)
      assert.equal((tail ? eligibleTail : eligibleFlight)(savedFocus), true, 'Paired committed save must retain requested acquisition phase')
      await page.evaluate(() => { window.worshipBoundaryDrawTag = 'restored-first-frame' })
      await page.getByRole('dialog', { name: 'Start game', exact: true }).getByRole('button', { name: 'Load Game', exact: true }).click()
      await wait(() => !!window.worshipBoundaryEvidence.replacement, null, 30000, 'Synchronous public Load replacement')
      report.replacement = await page.evaluate(() => window.worshipBoundaryEvidence.replacement)
      assert.deepEqual(report.replacement, savedFocus, 'Acquisition, gifts, clock residual and RNG survive exact replacement')
      const loaded = await page.evaluate(checkpointObservation, { observationName: 'worshipBoundaryReplacement' })
      for (const key of ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256']) assert.deepEqual(loaded[key], stored[key])
      await bindGame(page)
      const start = await page.evaluate(() => window.worshipBoundaryEvidence.start)
      assert.equal(start.startedBefore, false); assert.equal(start.currentWorld, true); assert.equal(start.connected, true)
      assert.equal(start.focus.paused, false, 'Public Load auto-resumes before normal scene start')
      assert.deepEqual(start.focus.acquisition, savedFocus.acquisition, 'Observer was armed before the first real RAF visit')
      report.saved = { checkpoint: stored, focus: savedFocus }
      report.final = await finish()
      if (!tail) {
        report.resumedMotion = await page.evaluate(() => window.worshipBoundaryEvidence.resumedMotion)
        assert.ok(report.resumedMotion, 'Original UI visits must move the saved body after public Load auto-resumes')
        assert.equal(report.resumedMotion.before.giftId, savedFocus.acquisition.controllers.spell.giftId)
        assert.equal(report.resumedMotion.before.model, 3)
        assert.equal(report.resumedMotion.before.paused, false); assert.equal(report.resumedMotion.after.paused, false)
        assert.notDeepEqual(report.resumedMotion.after.position, report.resumedMotion.before.position)
      }
      const firstDraw = await page.evaluate(() => window.worshipBoundaryEvidence.draws['restored-first-frame'])
      assert.ok(firstDraw, 'Early observer must retain the real restored body/pulse draw')
      assert.ok(tail ? firstDraw.pulseCall : firstDraw.bodyCall, 'Restored frame needs a phase-appropriate actual drawImage call')
      assert.equal(firstDraw.hidden, false)
      assert.ok(firstDraw.alpha.testedPixels > 0 && firstDraw.alpha.nontransparent > 0, 'Restored frame needs actual nontransparent overlay output')
      const pending = Number(savedFocus.gifts.some(g => g.ordinaryWorship && g.remaining > 0))
      assert.equal(report.final.count, savedFocus.count + pending, 'No lost or duplicate payout after restart')
      assert.equal(report.final.stock, savedFocus.stock + pending)
      assert.equal((await readCommittedCheckpoint(page)).checkpointSha256, stored.checkpointSha256)
      assert.equal(await page.evaluate(() => window.worshipBoundaryEvidence.cues), 0, 'Load must not replay acquisition cue')
      report.continuation = { kind: 'second browser process with verified previous owned cleanup', previousRunId: previous.runId, loaded }
    } else {
      assert.equal(receipt.profile.checkpointAtStart, null)
      await openMission(1)
      await prepareM1LightningRoute({ page, waitForShamanReadiness, signal, report, save: saveReport })
      await page.evaluate(() => window.armWorshipBoundaryAcquisition())
      report.order = await orderLightning(page, waitForShamanReadiness, report)
      if (phase !== 'missing-geometry') await wait(() => {
          const c = window.worshipBoundaryScene.world.worshipAcquisition.controllers
          return c.spell?.active && c.spell.step === 2 && c.spell.visits <= 4
        }, null, 120000, 'Early ordinary flight')
      if (phase === 'missing-geometry') {
        report.geometryFault = await missingGeometry(page, wait, output)
      } else if (phase === 'restart') {
        report.restart = await restartDuringFlight(page, bindGame, waitForShamanReadiness, wait, output)
      } else if (phase === 'hidden') {
        await page.evaluate(() => { window.worshipBoundaryEvidence.firstVisibleDraw = null })
        cover = await context.newPage()
        await cover.bringToFront()
        try { await wait(() => document.hidden, null, 3000, 'Actual background document visibility') }
        catch (error) { report.status = 'blocked'; throw Error(`Hidden-page acceptance blocked: browser did not report document.hidden. ${error.message}`) }
        const hidden = await snap(page)
        assert.equal(hidden.paused, true, 'Shipped blur/visibility handler pauses the world')
        await page.waitForTimeout(750)
        const later = await snap(page)
        assert.deepEqual(later.acquisition, hidden.acquisition, 'Hidden pages retain controller state and UI deadline residual')
        assert.equal(later.turn, hidden.turn)
        await page.bringToFront()
        await wait(() => !document.hidden && !!window.worshipBoundaryEvidence.firstVisibleDraw, null, 5000, 'Real foreground and first draw')
        const first = await page.evaluate(() => window.worshipBoundaryEvidence.firstVisibleDraw)
        assert.deepEqual(first.clock, hidden.acquisition.clock, 'Visibility reset discards hidden elapsed backlog before first draw')
        await page.getByRole('button', { name: 'Resume game', exact: true }).click()
        report.hidden = { before: hidden, after: later, firstVisibleDraw: first }
        report.final = await finish()
      } else {
        if (!tail) {
          await page.getByRole('button', { name: 'Pause game', exact: true }).click()
          const paused = await snap(page)
          assert.equal(paused.paused, true)
          await page.waitForTimeout(150)
          const settled = await snap(page)
          await page.waitForTimeout(300)
          const held = await snap(page)
          assert.equal(held.turn, paused.turn); assert.deepEqual(body(held), body(settled))
          assert.ok(held.acquisition.clock.elapsed > settled.acquisition.clock.elapsed, 'Visible paused UI visits continue')
          // Preserve this genuinely active first pause for Save. The paired
          // fresh-process public Load owns resume and records original UI-visit
          // motion; a second host click race must not consume the flight first.
          assert.equal(eligibleFlight(held), true, 'First visible pause must retain an eligible live body/gift')
          report.visiblePause = { paused, settled, held, resumeBoundary: 'Paired fresh-process public Load auto-resume' }
        } else {
          try {
            await wait(() => {
              const c = window.worshipBoundaryScene.world.worshipAcquisition.controllers
              return c.pulse?.active && !c.spell?.active && !c.companion?.active
            }, null, 15000, 'Genuine independent pulse tail')
          } catch (error) { report.status = 'unproved'; throw Error(`Ordinary tail window was not caught; no retry or injected state. ${error.message}`) }
          report.tailBeforeMenu = await snap(page)
          if (!eligibleTail(report.tailBeforeMenu)) { report.status = 'unproved'; throw Error('Tail retired before public menu interaction; no fabricated checkpoint') }
        }
        await page.getByRole('button', { name: 'Game settings', exact: true }).click()
        const menu = page.locator('dialog.game-dialog')
        await menu.waitFor({ state: 'visible' })
        const boundary = await page.evaluate(() => {
          const s = window.worshipBoundaryScene, w = window.testStore.getWorld()
          return { sameWorld: s.world === w, paused: w.paused, turn: w.turn }
        })
        assert.equal(boundary.sameWorld, true); assert.equal(boundary.paused, true)
        if (!tail) {
          await page.getByLabel('HUD size', { exact: true }).selectOption('1')
          await page.evaluate(() => { window.worshipBoundaryDrawTag = 'hud-before' })
          await wait(() => !!window.worshipBoundaryEvidence.draws['hud-before'], null, 5000, 'Actual pre-change HUD draw')
          await page.getByLabel('HUD size', { exact: true }).selectOption('2')
          originalDisplay = { viewport: page.viewportSize(), dpr: await page.evaluate(() => devicePixelRatio) }
          cdp = await page.context().newCDPSession(page)
          await page.setViewportSize({ width: 1280, height: 900 })
          // Existing repository QA route; only display metrics change. Normal
          // RAF and ResizeObserver own all scene/canvas updates.
          await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 2, mobile: false })
          await wait(() => {
            const s = window.worshipBoundaryScene, overlay = document.querySelector('.worship-acquisition-overlay'), shell = s.container.parentElement
            return devicePixelRatio === 2 && s.renderer.getPixelRatio() === 1.8 &&
              overlay.width === Math.round(shell.clientWidth * 2) && overlay.height === Math.round(shell.clientHeight * 2)
          }, null, 5000, 'Emulated DPR2 backing sizes settle through ordinary RAF')
          await page.evaluate(() => { window.worshipBoundaryDrawTag = 'hud-after' })
          await wait(() => !!window.worshipBoundaryEvidence.draws['hud-after'], null, 5000, 'Actual resized HUD draw')
          const draws = await page.evaluate(() => window.worshipBoundaryEvidence.draws)
          const before = draws['hud-before'], after = draws['hud-after']
          assert.deepEqual(after.command.geometry, before.command.geometry)
          assert.ok(after.layout.hudScale > before.layout.hudScale)
          assert.ok(before.bodyCall && after.bodyCall)
          const ratio = after.layout.hudScale / before.layout.hudScale
          assert.ok(Math.abs(after.bodyCall.args[6] - before.bodyCall.args[6] * ratio) < 1e-5, 'Actual paused body width rebinds to measured HUD scale')
          const backing = await page.evaluate(() => {
            const s = window.worshipBoundaryScene, rect = s.container.getBoundingClientRect(), shell = s.container.parentElement,
              overlay = document.querySelector('.worship-acquisition-overlay')
            return { dpr: devicePixelRatio, webglRatio: s.renderer.getPixelRatio(), world: [s.renderer.domElement.width, s.renderer.domElement.height],
              expectedWorld: [Math.floor(rect.width * 1.8), Math.floor(rect.height * 1.8)], overlay: [overlay.width, overlay.height],
              expectedOverlay: [Math.round(shell.clientWidth * 2), Math.round(shell.clientHeight * 2)] }
          })
          assert.equal(backing.dpr, 2); assert.equal(backing.webglRatio, 1.8)
          assert.deepEqual(backing.world, backing.expectedWorld); assert.deepEqual(backing.overlay, backing.expectedOverlay)
          assert.equal(after.dpr, 2)
          report.display = { viewport: after.viewport, dpr: after.dpr, ratio, backing, sourceGeometryUnchanged: true, kind: 'CDP-emulated DPR2' }
        }
        await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
        let committed, focus
        assert.equal(await waitForCheckpointReadback(async () => {
          signal.throwIfAborted(); committed = await readCommittedCheckpoint(page)
          if (committed?.turn !== boundary.turn) return false
          focus = await readStoredFocus(page); return !!focus && focus.turn === boundary.turn
        }), true, 'Await actual Save IndexedDB transaction outside async polling predicates')
        report.saved = { checkpoint: committed, focus, boundary }
        if (!(tail ? eligibleTail(focus) : eligibleFlight(focus))) {
          report.status = 'unproved'
          throw Error(`Public ${tail ? 'pulse-tail' : 'in-flight'} checkpoint missed its eligible state; no continuation accepted and no automatic retry`)
        }
        await page.screenshot({ path: resolve(output, 'saved-settings.png') })
      }
    }
    report.status = 'passed'
  } catch (error) {
    if (report.status === 'running') report.status = 'failed'
    report.failure = error.stack; throw error
  } finally {
    if (phase === 'missing-geometry' && !page.isClosed()) {
      try { report.faultStyleCleanup = await page.evaluate(() => window.restoreWorshipGeometryHud?.() ?? null) }
      catch (error) { report.cleanupFailure = String(error); report.status = 'failed' }
    }
    if (cdp) {
      try {
        await cdp.send('Emulation.clearDeviceMetricsOverride')
        await page.setViewportSize(originalDisplay.viewport)
        await wait(dpr => devicePixelRatio === dpr, originalDisplay.dpr, 5000, 'Restore original device metrics')
        report.displayRestored = true
      } catch (error) { report.displayRestored = false; report.cleanupFailure = String(error); report.status = 'failed' }
      finally { await cdp.detach().catch(error => { report.cleanupFailure = String(error); report.status = 'failed' }) }
    }
    if (cover && !cover.isClosed()) await cover.close()
    if (armed && !page.isClosed()) {
      await page.evaluate(() => window.restoreWorshipBoundaryObserver?.())
      report.observer = await page.evaluate(() => window.worshipBoundaryEvidence)
      for (const [tag, sample] of Object.entries(report.observer.draws)) {
        const filename = `overlay-${tag}.png`
        writeFileSync(resolve(output, filename), Buffer.from(sample.png.split(',')[1], 'base64'))
        sample.artifact = filename; delete sample.png
      }
    }
    saveReport()
  }
  try {
    assert.deepEqual(report.observer.errors, []); assert.equal(report.observer.restored, true)
    assert.equal(report.cleanupFailure, undefined)
    assert.deepEqual(receipt.errors, [])
    for (const sample of report.observer.drawCosts)
      assert.equal(sample.measureCalls, sample.referenceCount, 'Original draw measures each reference geometry once')
  } catch (error) { report.status = 'failed'; report.failure = error.stack; saveReport(); throw error }
  return report
}
