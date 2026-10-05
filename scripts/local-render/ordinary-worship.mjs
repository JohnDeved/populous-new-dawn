import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { checkpointObservation, readCommittedCheckpoint } from './checkpoint-observer.mjs'

// Prepared acceptance inputs, not claimed results. Run one row per fresh owned
// profile/output. The default is the small diagnostic; no automatic matrix loop.
export const routes = {
  'm1-bridge': { mission: 1, reward: 'bridge', model: 12, x: -5, z: 25, required: 1, target: 28, timeout: 120000 },
  'm1-lightning': { mission: 1, reward: 'lightning', model: 3, x: 11, z: 1, required: 1, target: 32, timeout: 120000 },
  'm1-bridge-fallback': { mission: 1, reward: 'bridge', model: 12, x: -5, z: 25, required: 1, target: 28, fallback: true, flightTab: true, timeout: 120000 },
  'm2-tornado': { mission: 2, reward: 'tornado', model: 4, x: -59, z: -105, required: 2, target: 82, flightTab: true, timeout: 300000 },
  'm1-checkpoint-resize': { mission: 1, reward: 'lightning', model: 3, x: 11, z: 1, required: 1, target: 32, checkpoint: true, resize: true, flightTab: true, timeout: 150000 },
}
const digest = bytes => createHash('sha256').update(bytes).digest('hex')

// Deliberately separate before-image observation. The accepted baseline lacks
// the candidate's runtime, provenance and overlay; it must never be tested by
// candidate assertions or have a before-image synthesized from those assets.
async function installBaselineObserver(page, route) {
  await page.evaluate(route => {
    const scene = window.testSceneRef.current, restorers = []
    const evidence = window.ordinaryWorship = { armed: { turn: scene.world.turn }, events: [],
      samples: [], errors: [], raised: null, phaseZero: null, payout: null, last: null, restored: false }
    const snapshot = () => {
      const w = scene.world, gift = w.gifts.find(g => g.reward === route.reward)
      return structuredClone({ turn: w.turn, paused: w.paused, mode: w.mode,
        stock: w.shots[route.reward], count: w.giftCounts[route.reward],
        gift: gift ? { id: gift.id, phase: gift.phase, remaining: gift.remaining, frame: gift.frame } : null,
        runtimePresent: !!w.worshipAcquisition, overlayPresent: !!document.querySelector('.worship-acquisition-overlay'),
        tab: document.querySelector('.dock-tabs [aria-pressed="true"]')?.getAttribute('aria-label') })
    }
    const observe = callback => { try { callback() } catch (error) { evidence.errors.push(String(error)) } }
    const wrap = (owner, key, after) => {
      const own = Object.hasOwn(owner, key), original = owner[key]
      const wrapped = function (...args) { const result = original.apply(this, args); observe(after); return result }
      owner[key] = wrapped
      restorers.push(() => {
        if (owner[key] !== wrapped) throw Error(`Baseline observer ownership changed: ${key}`)
        if (own) owner[key] = original; else delete owner[key]
      })
    }
    wrap(scene.gameClock, 'afterTurn', () => {
      const after = snapshot(), before = evidence.last
      if (after.gift && !before.gift) evidence.events.push({ kind: 'gift-born', state: after })
      if (after.gift?.phase === 0 && !evidence.phaseZero) evidence.phaseZero = after
      if (after.count > before.count && !evidence.payout) evidence.payout = { before, after }
      evidence.last = after
    })
    wrap(scene, 'updateHudFrame', () => {
      const state = snapshot()
      if (state.gift?.phase && !evidence.raised) evidence.raised = { state, png: scene.renderer.domElement.toDataURL() }
      if (state.gift?.phase === 0 && !evidence.samples.length)
        evidence.samples.push({ stage: 'phase-zero-baseline', state, png: scene.renderer.domElement.toDataURL() })
    })
    evidence.last = snapshot()
    window.restoreOrdinaryWorshipObserver = () => {
      for (const restore of restorers.reverse()) observe(restore)
      evidence.restored = evidence.errors.length === 0
      delete window.restoreOrdinaryWorshipObserver
    }
  }, route)
}

// Only these instance callbacks are wrapped. Originals execute exactly once,
// synchronously and with their original receiver/arguments. Observation errors
// are retained instead of throwing into the shipped clock. No World writes,
// random calls, clock stepping, render calls or RAF cancellation occur here.
async function installObserver(page, input) {
  await page.evaluate(async input => {
    const { interpolateWorshipPoint, worshipDrawPoint, worshipHandoffGeometry } =
      await import('/app/worship-acquisition-layout.ts')
    const scene = window.testSceneRef.current, presentation = scene.worshipPresentation,
      canvas = document.querySelector('.worship-acquisition-overlay'), context = canvas.getContext('2d'),
      restorers = [], seen = new Set(), art = input.art.bodyFrames[input.route.model], rect = input.hud.rects[art.source]
    const evidence = window.ordinaryWorship = {
      armed: { turn: scene.world.turn, reward: input.route.reward }, events: [], samples: [],
      errors: [], raised: null, decoded: null, handoff: null, arrival: null, payout: null,
      last: null, draws: 0, cues: 0, restored: false,
    }
    let sequence = 0, operation = 'outside', drawing = null
    const tab = () => document.querySelector('.dock-tabs [aria-pressed="true"]')?.getAttribute('aria-label')
    const snapshot = () => {
      const w = scene.world, gift = w.gifts.find(g => g.reward === input.route.reward && g.ordinaryWorship)
      return structuredClone({ turn: w.turn, paused: w.paused, mode: w.mode, status: w.status,
        stock: w.shots[input.route.reward], count: w.giftCounts[input.route.reward], tab: tab(),
        gift: gift ? { id: gift.id, phase: gift.phase, remaining: gift.remaining, frame: gift.frame,
          height: gift.height, ordinaryWorship: gift.ordinaryWorship } : null,
        requests: w.worshipAcquisition.requests, clock: w.worshipAcquisition.clock,
        spell: w.worshipAcquisition.controllers.spell, pulse: w.worshipAcquisition.controllers.pulse,
        companionActive: !!w.worshipAcquisition.controllers.companion?.active,
        commands: w.worshipAcquisition.controllers.drawCommands.length,
        hidden: canvas.hidden, diagnostics: presentation.diagnostics,
      })
    }
    const observe = callback => { try { return callback() } catch (error) {
      if (evidence.errors.length < 16) evidence.errors.push(String(error.stack ?? error))
    } }
    const event = (kind, value) => {
      if (evidence.events.length >= 64) throw Error('Observation event bound exceeded')
      evidence.events.push({ sequence: ++sequence, kind, ...value })
    }
    const wrap = (owner, key, factory) => {
      const own = Object.hasOwn(owner, key), original = owner[key], wrapped = factory(original)
      owner[key] = wrapped
      restorers.push(() => {
        if (owner[key] !== wrapped) throw Error(`Observer ownership changed: ${key}`)
        if (own) owner[key] = original
        else delete owner[key]
      })
    }
    wrap(scene, 'onSound', original => function (...args) {
      const result = original.apply(this, args)
      if (args[0] === 0x71) observe(() => { evidence.cues++; event('cue', { operation, turn: scene.world.turn }) })
      return result
    })
    wrap(presentation.bridge, 'select', original => function (...args) {
      const before = observe(snapshot), result = original.apply(this, args)
      observe(() => {
        const after = snapshot(), gift = after.gift,
          anchor = gift && presentation.anchors.get(gift.id)
        event('select', { operation, model: args[0], before, after, measurement: result,
          anchor: anchor && structuredClone(anchor),
          expectedGeometry: result ? worshipHandoffGeometry(result, anchor) : null })
      })
      return result
    })
    wrap(scene.gameClock, 'afterTurn', original => function (...args) {
      const before = observe(snapshot), previousOperation = operation
      operation = 'afterTurn/handoff'
      let result
      try { result = original.apply(this, args) } finally { operation = previousOperation }
      observe(() => {
        const after = snapshot(), last = evidence.last
        if (after.gift && !last?.gift && !seen.has('birth')) {
          seen.add('birth'); event('gift-born', { state: after })
        }
        if (before.requests.includes(before.gift?.id) && after.spell?.giftId === before.gift.id) {
          evidence.handoff = { before, after }; event('handoff', evidence.handoff)
        }
        if (last && after.count > last.count) {
          evidence.payout = { before: last, after }; event('payout', evidence.payout)
        }
        evidence.last = after
      })
      return result
    })
    wrap(scene.gameClock, 'worshipVisit', original => function (...args) {
      const before = observe(snapshot), previousOperation = operation
      operation = 'worshipVisit/arrival'
      let result
      try { result = original.apply(this, args) } finally { operation = previousOperation }
      observe(() => {
        const after = snapshot()
        if (before.gift?.remaining > 1 && after.gift?.remaining === 1 && !evidence.arrival) {
          evidence.arrival = { before, after }; event('arrival-clamp', evidence.arrival)
        }
      })
      return result
    })
    wrap(presentation.bridge, 'measure', original => function (...args) {
      const result = original.apply(this, args)
      if (drawing && args[0] === input.route.model) drawing.layout = result
      return result
    })
    wrap(context, 'drawImage', original => function (...args) {
      const result = original.apply(this, args)
      if (drawing && args.length === 9 && args[0] instanceof HTMLImageElement &&
          args[1] === rect.x + art.crop.x && args[2] === rect.y + art.crop.y) observe(() => {
        const transform = this.getTransform()
        drawing.call = { args: args.slice(1), transform: [transform.a, transform.b, transform.c, transform.d, transform.e, transform.f],
          alpha: this.globalAlpha, smoothing: this.imageSmoothingEnabled, source: args[0].currentSrc,
          sourceSize: [args[0].naturalWidth, args[0].naturalHeight] }
        if (!evidence.decoded) {
          const decode = document.createElement('canvas'); decode.width = art.w; decode.height = art.h
          const dc = decode.getContext('2d'); dc.drawImage(args[0], rect.x, rect.y, art.w, art.h, 0, 0, art.w, art.h)
          evidence.decoded = { frame: art.source, rgba: [...dc.getImageData(0, 0, art.w, art.h).data], png: decode.toDataURL() }
        }
      })
      return result
    })
    wrap(presentation, 'draw', original => function (...args) {
      const state = scene.world.worshipAcquisition,
        command = state.controllers.drawCommands.find(c => c.kind === 'body' && c.model === input.route.model),
        prior = state.previousDrawCommands.find(c => c.kind === 'body'),
        previous = command && prior?.geometry === command.geometry && !!prior.radians === !!command.radians ? prior : undefined,
        interval = state.clock.nextVisit - state.clock.lastVisit,
        fraction = scene.world.paused || scene.world.land.landFlags & 2 || !interval ? 1 : Math.max(0, Math.min(1, (state.clock.elapsed - state.clock.lastVisit) / interval)),
        changedFields = previous ? ['x', 'y', 'scale', 'radians'].filter(key => previous[key] !== command[key]) : [],
        intermediate = !!previous && fraction > 0 && fraction < 1 && changedFields.length > 0,
        visualStage = command && (innerWidth !== 1440 ? 'resized' : command.finalLeg ? 'final-leg' : command.radians ? 'rotated' : 'zero-angle'),
        stage = visualStage && (!seen.has(visualStage) ? visualStage : intermediate && !seen.has('intermediate') ? 'intermediate' : null),
        ownedState = () => structuredClone({ acquisition: scene.world.worshipAcquisition,
          gameplayRandom: scene.world.randomState, cosmeticRandom: scene.world.cosmeticRandom }),
        beforeDraw = stage ? observe(ownedState) : null
      drawing = command ? { command, layout: null, call: null } : null
      const current = drawing
      let result
      try { result = original.apply(this, args) } finally { drawing = null }
      // The preceding scene render can legitimately consume cosmetic RNG for
      // Lightning. This pair brackets only the owned overlay draw call.
      const afterDraw = stage ? observe(ownedState) : null
      observe(() => {
        const gift = scene.world.gifts.find(g => g.reward === input.route.reward && g.ordinaryWorship)
        if (gift?.phase && !evidence.raised) {
          const group = scene.fxMeshes.get(gift.id), anchor = presentation.anchors.get(gift.id)
          if (group && anchor) {
            evidence.raised = { turn: scene.world.turn, gift: structuredClone(gift), anchor: structuredClone(anchor),
              group: { name: group.name, visible: group.visible, position: group.position.toArray(), frame: group.userData.frame },
              // Actual rendered WebGL canvas; no hiding/re-rendering to fabricate isolation.
              png: scene.renderer.domElement.toDataURL() }
          }
        }
        if (!current?.call || !current.layout) return
        evidence.draws++
        if (!stage) return
        seen.add(stage)
        if (intermediate) seen.add('intermediate')
        const point = worshipDrawPoint(interpolateWorshipPoint(command, previous, fraction), command.geometry, current.layout, command.finalLeg),
          scale = (previous ? previous.scale + (command.scale - previous.scale) * fraction : command.scale) * current.layout.hudScale,
          angleDelta = previous ? Math.atan2(Math.sin(command.radians - previous.radians), Math.cos(command.radians - previous.radians)) : 0,
          angle = previous ? previous.radians + angleDelta * fraction : command.radians,
          width = art.crop.width * scale, height = art.crop.height * scale,
          dpr = devicePixelRatio || 1, cos = Math.cos(-angle), sin = Math.sin(-angle),
          expected = { args: [rect.x + art.crop.x, rect.y + art.crop.y, art.crop.width, art.crop.height,
            command.radians ? -width / 2 : 0, command.radians ? -height / 2 : 0, width, height],
            transform: [dpr * cos, dpr * sin, -dpr * sin, dpr * cos,
              dpr * (point.x + art.crop.x * scale), dpr * (point.y + art.crop.y * scale)] }
        const [a, b, c, d, e, f] = current.call.transform, [, , , , x, y, w, h] = current.call.args,
          corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([x, y]) => [a * x + c * y + e, b * x + d * y + f]),
          left = Math.max(0, Math.floor(Math.min(...corners.map(p => p[0])))),
          top = Math.max(0, Math.floor(Math.min(...corners.map(p => p[1])))),
          right = Math.min(canvas.width, Math.ceil(Math.max(...corners.map(p => p[0])))),
          bottom = Math.min(canvas.height, Math.ceil(Math.max(...corners.map(p => p[1]))))
        if (right <= left || bottom <= top) throw Error(`Body fully outside overlay: ${stage}`)
        const image = context.getImageData(left, top, right - left, bottom - top),
          crop = document.createElement('canvas')
        crop.width = image.width; crop.height = image.height; crop.getContext('2d').putImageData(image, 0, 0)
        const texels = [], pixelScaleX = a * w / art.crop.width, pixelScaleY = d * h / art.crop.height
        // Independent limited pixel correspondence: only unrotated, >=2-device-
        // pixel opaque texels, safely inside both source run and destination.
        // Body is submitted after companions; alpha255 replaces pixels behind it.
        if (!command.radians && Math.abs(b) < 1e-8 && Math.abs(c) < 1e-8 && pixelScaleX >= 2 && pixelScaleY >= 2) {
          const source = evidence.decoded.rgba
          for (let sy = art.crop.y + 1; sy < art.crop.y + art.crop.height - 1 && texels.length < 8; sy++)
            for (let sx = art.crop.x + 1; sx < art.crop.x + art.crop.width - 1 && texels.length < 8; sx++) {
              if (![[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].every(([dx, dy]) => source[((sy + dy) * art.w + sx + dx) * 4 + 3] === 255)) continue
              const px = Math.floor(a * x + e + (sx - art.crop.x + 0.5) * pixelScaleX),
                py = Math.floor(d * y + f + (sy - art.crop.y + 0.5) * pixelScaleY)
              if (px < left || py < top || px >= right || py >= bottom) continue
              const sourceOffset = (sy * art.w + sx) * 4, destinationOffset = ((py - top) * image.width + px - left) * 4
              texels.push({ source: [sx, sy], destination: [px, py],
                expected: source.slice(sourceOffset, sourceOffset + 4), actual: [...image.data.slice(destinationOffset, destinationOffset + 4)] })
            }
        }
        evidence.samples.push({ stage, turn: scene.world.turn, state: snapshot(), fraction, dpr,
          interpolation: { matchingPriorBinding: !!previous, intermediate, changedFields, previous: previous && structuredClone(previous) },
          drawOwnership: { before: beforeDraw, after: afterDraw }, opaqueTexels: texels,
          viewport: [innerWidth, innerHeight], command: structuredClone(command), layout: structuredClone(current.layout),
          actual: current.call, expected, crop: [left, top, image.width, image.height],
          nontransparent: image.data.filter((_byte, i) => i % 4 === 3 && image.data[i] > 0).length,
          png: crop.toDataURL() })
      })
      return result
    })
    evidence.last = snapshot()
    window.restoreOrdinaryWorshipObserver = () => {
      for (const restore of restorers.reverse()) observe(restore)
      evidence.restored = evidence.errors.length === 0
      delete window.restoreOrdinaryWorshipObserver
    }
  }, input)
}

async function clearSelection(page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await page.evaluate(() => !window.testStore.getWorld().mode && !window.testStore.getWorld().selected.length)) return
    await page.keyboard.press('Escape')
  }
  assert.equal(await page.evaluate(() => !window.testStore.getWorld().mode && !window.testStore.getWorld().selected.length), true)
}

async function worshipOrder(page, shrine, kind, report, waitForShamanReadiness) {
  const resume = page.getByRole('button', { name: 'Resume game', exact: true })
  if (await resume.isVisible()) await resume.click()
  const flybyDeadline = performance.now() + 45000, skipped = []
  for (;;) {
    const state = await page.evaluate(() => ({ turn: window.testStore.getWorld().turn, inputMask: window.testStore.getWorld().inputMask }))
    if (!state.inputMask) break
    assert.ok(performance.now() < flybyDeadline, `Reward flyby/input gate before ${kind} worship did not finish`)
    const skip = page.locator('.skip-introduction')
    if (await skip.isVisible()) { await skip.click(); skipped.push(state) }
    else await page.waitForTimeout(100)
  }
  const readiness = await waitForShamanReadiness(page, { timeout: 45000 })
  const identity = await page.evaluate(() => {
    const scene = window.testSceneRef.current, world = window.testStore.getWorld()
    return { sameWorld: scene.world === world, connected: scene.renderer.domElement.isConnected,
      loading: !!document.querySelector('.loading-world'), paused: world.paused, inputMask: world.inputMask }
  })
  assert.deepEqual(identity, { sameWorld: true, connected: true, loading: false, paused: false, inputMask: 0 })
  await clearSelection(page)
  if (kind === 'shaman') await page.getByRole('button', { name: 'followers', exact: true }).click()
  await page.getByRole('button', { name: kind === 'shaman' ? 'Select and focus shaman' : `Select ${kind}`, exact: true }).click(
    kind === 'brave' ? { modifiers: ['Shift'] } : {})
  // Camera assistance only. This shipped helper also clears mode; call it before
  // selecting the public test mode. Let ordinary RAF update geometry and panels.
  await page.evaluate(shrine => window.testSceneRef.current.focus(shrine), shrine)
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const point = await page.evaluate(id => {
    const scene = window.testSceneRef.current, head = scene.world.shrines.find(s => s.id === id),
      bounds = scene.container.getBoundingClientRect(), mesh = scene.shrineMeshes.get(id)?.g,
      projected = scene.screen(mesh?.position ?? head),
      center = { x: bounds.x + (projected.x + 1) * bounds.width / 2, y: bounds.y + (1 - projected.y) * bounds.height / 2 },
      owns = point => scene.picking.pickPerson(point) === null && scene.pickWorldObject(point)?.id === id &&
        document.elementFromPoint(point.clientX, point.clientY) === scene.renderer.domElement
    for (let dy = -140; dy <= 60; dy += 4) for (let dx = -100; dx <= 100; dx += 4) {
      const p = { clientX: center.x + dx, clientY: center.y + dy }
      if (owns(p)) return { x: p.clientX, y: p.clientY }
    }
    const candidates = []
    mesh?.traverse(child => {
      if (child.userData.nativeModel === undefined || !child.visible) return
      for (const command of scene.picking.model(child, JSON.stringify(scene.view.projection))) {
        if (command.kind !== 'model') continue
        const p = { clientX: bounds.x + command.points.reduce((n, p) => n + p.x, 0) / command.points.length,
          clientY: bounds.y + command.points.reduce((n, p) => n + p.y, 0) / command.points.length }
        candidates.push(p)
      }
    })
    const hit = candidates.find(owns)
    if (!hit) throw Error(`No canvas-owned shrine hit for ${id}`)
    return { x: hit.clientX, y: hit.clientY }
  }, shrine.id)
  await page.mouse.click(point.x, point.y)
  const accepted = await page.evaluate(({ id, kind }) => {
    const w = window.testStore.getWorld()
    return { turn: w.turn, paused: w.paused, selected: [...w.selected], inputMask: w.inputMask,
      mode: w.mode, message: w.message, lastOrderTurn: w.lastOrderTurn,
      worshippers: w.units.filter(u => u.team === 'blue' && u.kind === kind && u.work === id).map(u => u.id) }
  }, { id: shrine.id, kind })
  // Retain attempted UI order and rejection feedback even when acceptance fails.
  report.orders.push({ shrine, kind, point, readiness, identity, skipped,
    cameraAssistance: 'scene.focus before mode setup; ordinary RAF only', accepted })
  assert.equal(accepted.paused, false)
  assert.ok(accepted.worshippers.length, `${kind} public worship order must be accepted: ${JSON.stringify(accepted)}`)
}

async function checkpointBeforeOrders(page, root, output, signal) {
  const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const { waitForCheckpointReadback } = await import(pathToFileURL(resolve(root, 'scripts/checkpoint-readback.mjs')).href)
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  const menu = page.locator('dialog.game-dialog')
  await menu.waitFor({ state: 'visible' })
  const pauseBoundary = await page.evaluate(() => {
    const world = window.testStore.getWorld(), scene = window.testSceneRef.current
    return { turn: world.turn, paused: world.paused, sameWorld: scene.world === world,
      connected: scene.renderer.domElement.isConnected, loading: !!document.querySelector('.loading-world') }
  })
  assert.equal(pauseBoundary.paused, true, 'Settings must have publicly paused before Save')
  assert.equal(pauseBoundary.sameWorld, true); assert.equal(pauseBoundary.connected, true); assert.equal(pauseBoundary.loading, false)
  const turn = pauseBoundary.turn
  await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  let saved
  assert.equal(await waitForCheckpointReadback(async () => {
    signal.throwIfAborted(); saved = await readCommittedCheckpoint(page)
    return saved?.turn === turn && saved?.level === 1
  }), true, 'Public save must finish its actual IndexedDB transaction')
  await page.screenshot({ path: resolve(output, 'saved-settings.png') })
  await page.reload({ waitUntil: 'domcontentloaded' })
  const selector = page.getByRole('dialog', { name: 'Start game', exact: true })
  await selector.waitFor({ state: 'visible' })
  await page.evaluate(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
    for (; fiber && !store; fiber = fiber.return) for (let hook = fiber.memoizedState; hook; hook = hook.next)
      if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
    if (!store) throw Error('Store unavailable before public Load')
    const before = store.getWorld()
    window.ordinaryWorshipLoaded = null; window.ordinaryWorshipLoadError = null
    const unsubscribe = store.subscribe(() => {
      const w = store.getWorld()
      if (w === before) return
      try { window.ordinaryWorshipLoaded = { version: 1, world: structuredClone(w) } }
      catch (error) { window.ordinaryWorshipLoadError = String(error) }
      finally { unsubscribe() }
    })
  })
  await selector.getByRole('button', { name: 'Load Game', exact: true }).click()
  await page.waitForFunction(() => window.ordinaryWorshipLoaded !== null || window.ordinaryWorshipLoadError !== null)
  assert.equal(await page.evaluate(() => window.ordinaryWorshipLoadError), null)
  const loaded = await page.evaluate(checkpointObservation, { observationName: 'ordinaryWorshipLoaded' })
  // Normal migration rebuilds transient panel reservations, so full hashes are
  // retained without claiming byte equality across that intentional boundary.
  for (const key of ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256'])
    assert.deepEqual(loaded[key], saved[key], `Synchronous Load boundary ${key}`)
  await bindGame(page)
  assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), false, 'Public Load auto-resumes')
  await page.waitForFunction(turn => window.testStore.getWorld().turn > turn, saved.turn)
  assert.equal((await readCommittedCheckpoint(page)).checkpointSha256, saved.checkpointSha256)
  return { boundary: 'before worship orders, not an in-flight controller restore', pauseBoundary, saved, loaded, autoResume: true,
    comparison: 'Exact level, turn, time, actors, terrain and stock; full digests retained. Normal migration rebuilds transient panel reservations.' }
}

export default async function ({ page, root, output, receipt, openMission, signal }) {
  const routeName = process.env.POPULOUS_WORSHIP_ROUTE ?? 'm1-lightning', route = routes[routeName],
    baseline = process.env.POPULOUS_WORSHIP_BASELINE === '1'
  assert.ok(route, `Unknown POPULOUS_WORSHIP_ROUTE: ${routeName}`)
  if (baseline) {
    assert.ok(['m1-bridge', 'm1-lightning'].includes(routeName), 'Baseline is limited to the explicitly comparable M1 diagnostics')
    assert.equal(receipt.source.commit, '89c9629991489fd1ce6dc52e938d1cec346bfead', 'Before-image baseline must be accepted89c9629')
  }
  if (receipt.profile) assert.equal(receipt.profile.mode, 'created', 'Every matrix row needs a fresh task profile')
  assert.equal(await readCommittedCheckpoint(page), null, 'Do not reuse another task’s storage')
  const { waitForShamanReadiness } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const report = { routeName, route, baseline, source: receipt.source, scenarioSha256: digest(readFileSync(new URL(import.meta.url))),
    method: 'Shipped UI/mouse orders; real elapsed RAF. Read-only instance callback/Canvas/IndexedDB observations. Camera focus assistance is labeled per order.',
    orders: [], status: 'running', limits: 'Headless/software browser functional pixels, not original GPU pixels or hardware performance. Production layout helpers make draw arguments live-binding correspondence, not an independent full raster oracle. Canonical decoded source pixels and any sampled opaque-texel checks are separate evidence. Source-bound body interpolation is intentional. Overlay crops may include companions. No fixed-elapsed/staged run.',
    remainingMatrix: ['In-flight controller save/restart without late observer arming', 'Pause/resume and hidden-page transitions', 'DPR 2 and HUD-size preference changes', 'Simultaneous heads and independent pulse replacement', 'Representative hardware performance'] }
  const save = () => writeFileSync(resolve(output, 'ordinary-worship.json'), JSON.stringify(report, null, 2) + '\n')
  const deadline = performance.now() + route.timeout
  const wait = async (predicate, argument, label, maximum = 120000) => {
    signal.throwIfAborted()
    const timeout = Math.min(maximum, deadline - performance.now())
    assert.ok(timeout > 0, `Route deadline before ${label}`)
    try { await page.waitForFunction(predicate, argument, { timeout, polling: 50 }) }
    catch (error) { throw Error(`${label}: ${error.message}`) }
  }
  let armed = false
  try {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await openMission(route.mission)
    const resume = page.getByRole('button', { name: 'Resume game', exact: true })
    if (await resume.isVisible()) await resume.click()
    report.readiness = await waitForShamanReadiness(page, { timeout: 45000 })
    report.opening = await page.evaluate(() => {
      const s = window.testSceneRef.current, w = s.world, gl = s.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
      return { level: w.outcome.level, turn: w.turn, paused: w.paused, status: w.status,
        blue: w.units.filter(u => u.team === 'blue' && u.hp > 0).map(u => ({ id: u.id, kind: u.kind })),
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        webgl: gl.getParameter(gl.VERSION), contextLost: gl.isContextLost(), dpr: devicePixelRatio }
    })
    assert.equal(report.opening.level, route.mission)
    assert.equal(report.opening.contextLost, false)
    if (route.mission === 1) {
      const bytes = readFileSync(resolve(root, 'app/level-one.ts')),
        sourceSha256 = digest(bytes)
      assert.equal(sourceSha256, 'e840e4ea8895ada4131c7d2da2ce70330307956ea7a6e647e55e76bf6026bd33', 'Bind the immutable authored M1 source')
      const exported = bytes.toString('utf8').match(/^export default (.+);\s*$/m)
      assert.ok(exported, 'Expected generated M1 source format')
      const authored = JSON.parse(exported[1]).objects
        .filter(o => o.type === 1 && o.model === 2 && o.owner === 0)
        .map(o => ({ sourceIndex: o.index, x: o.x, z: o.z }))
      assert.deepEqual(authored.map(o => o.sourceIndex), [13, 14, 15, 16, 17, 18])
      // Reviewed createWorld prefix: nextId starts at1; one building, one head
      // and ten trees allocate before these six people. Reward object2 does
      // not allocate. addUnit therefore assigns browser IDs13..18 in this source.
      const bound = authored.map((o, index) => ({ ...o, id: 13 + index }))
      for (const person of bound)
        assert.equal(report.opening.blue.find(u => u.id === person.id)?.kind, 'brave', `Authored M1 Brave ${person.sourceIndex} must remain alive and Blue`)
      report.opening.authoredBraves = { source: 'app/level-one.ts', sourceSha256, bound }
      // Real RAF also runs the two starting huts' normal birth clocks while
      // startup readiness settles. Additional living followers remain in play.
      report.opening.additionalBraves = report.opening.blue.filter(u => u.kind === 'brave' && !bound.some(b => b.id === u.id))
    }
    if (route.checkpoint) report.checkpoint = await checkpointBeforeOrders(page, root, output, signal)
    if (baseline) await installBaselineObserver(page, route)
    else {
      const art = JSON.parse(readFileSync(resolve(root, 'app/original-worship-acquisition.json'), 'utf8')),
        hud = JSON.parse(readFileSync(resolve(root, 'app/original-hud.json'), 'utf8'))
      await installObserver(page, { route, art, hud })
    }
    armed = true
    if (route.mission === 2) {
      const bridge = await page.evaluate(() => window.testStore.getWorld().shrines.find(s => s.kind === 'bridgeEffect' && s.x === -113 && s.z === 113))
      assert.ok(bridge, 'Authored M2 terrain bridge prerequisite')
      await worshipOrder(page, bridge, 'shaman', report, waitForShamanReadiness)
      await wait(id => window.testStore.getWorld().shrines.find(s => s.id === id)?.uses > 0, bridge.id, 'M2 bridge worship', 150000)
      await wait(() => !window.testStore.getWorld().effects.some(e => e.kind === 'bridge'), null, 'M2 terrain bridge finishes', 90000)
      await wait(() => window.testStore.getWorld().units.filter(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0).length >= 2, null, 'Real M2 opening followers join', 30000)
    }
    const shrine = await page.evaluate(({ x, z, reward }) => window.testStore.getWorld().shrines.find(s => s.x === x && s.z === z && s.kind === reward), route)
    assert.ok(shrine, 'Authored ordinary source head')
    assert.equal(shrine.required, route.required); assert.equal(shrine.target, route.target)
    if (!baseline) assert.ok(shrine.ordinarySpellReward, 'Source head must retain ordinary provenance')
    report.shrine = shrine; save()
    await worshipOrder(page, shrine, route.mission === 2 ? 'shaman' : 'brave', report, waitForShamanReadiness)
    if (route.mission === 2) await worshipOrder(page, shrine, 'brave', report, waitForShamanReadiness)
    if (route.fallback) {
      await page.getByRole('button', { name: 'Focus Dakini tribe', exact: true }).click()
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      report.fallbackCamera = 'Public Focus Dakini tribe after worship order, before mode setup'
    }
    await page.getByRole('button', { name: 'buildings B', exact: true }).click()
    await page.getByRole('button', { name: 'Hut, 3 wood', exact: true }).click()
    assert.equal(await page.evaluate(() => window.testStore.getWorld().mode), 'hut')
    if (baseline) {
      await wait(() => !!window.ordinaryWorship.phaseZero || !!window.ordinaryWorship.errors.length, null, 'Baseline phase zero', 120000)
      await page.screenshot({ path: resolve(output, 'phase-zero-composite.png') })
    } else {
      await wait(() => !!window.ordinaryWorship.handoff || !!window.ordinaryWorship.errors.length, null, 'Ordinary phase-zero handoff', 180000)
      assert.deepEqual(await page.evaluate(() => window.ordinaryWorship.errors), [])
      if (route.resize) await page.setViewportSize({ width: 1280, height: 900 })
      // Public tab change intentionally clears mode; the earlier automatic
      // handoff must have preserved Hut, then arrival must reopen Spells.
      if (route.flightTab) {
        await page.getByRole('button', { name: 'followers', exact: true }).click()
        report.publicFlightTab = await page.evaluate(() => ({ turn: window.testStore.getWorld().turn,
          tab: document.querySelector('.dock-tabs [aria-pressed="true"]')?.getAttribute('aria-label'), mode: window.testStore.getWorld().mode }))
      }
      await page.screenshot({ path: resolve(output, 'phase-zero-composite.png') })
    }
    await wait(() => !!window.ordinaryWorship.payout || !!window.ordinaryWorship.errors.length, null, 'Arrival and ordinary next-turn payout', 30000)
    await wait(({ baseline, reward }) => {
      const w = window.testStore.getWorld()
      if (baseline) return !w.gifts.some(g => g.reward === reward)
      const c = w.worshipAcquisition.controllers
      return !w.gifts.some(g => g.ordinaryWorship) && !c.spell?.active && !c.companion?.active && !c.pulse?.active &&
        c.drawCommands.length === 0 && document.querySelector('.worship-acquisition-overlay').hidden
    }, { baseline, reward: route.reward }, 'Body, companion, pulse and overlay retire', 30000)
    report.final = await page.evaluate(() => ({ turn: window.testStore.getWorld().turn,
      status: window.testStore.getWorld().status, paused: window.testStore.getWorld().paused,
      diagnostics: window.testSceneRef.current.worshipPresentation?.diagnostics ?? [] }))
    await page.screenshot({ path: resolve(output, 'acquisition-complete.png') })
    report.status = 'observed'
  } catch (error) { report.failure = error.stack; report.status = 'failed'; throw error }
  finally {
    if (armed && !page.isClosed()) {
      await page.evaluate(() => window.restoreOrdinaryWorshipObserver?.())
      report.observer = await page.evaluate(() => window.ordinaryWorship)
      for (const [label, item] of [['raised-world', report.observer.raised], ['decoded-body', report.observer.decoded],
        ...report.observer.samples.map(sample => [`${baseline ? 'world' : 'overlay'}-${sample.stage}`, sample])]) {
        if (!item?.png) continue
        const filename = `${label}.png`
        writeFileSync(resolve(output, filename), Buffer.from(item.png.split(',')[1], 'base64'))
        item.artifact = filename; delete item.png
      }
      if (report.observer.decoded) {
        report.observer.decoded.rgbaSha256 = digest(Buffer.from(report.observer.decoded.rgba))
        delete report.observer.decoded.rgba
      }
    }
    save()
  }
  try {
    if (baseline) {
      const o = report.observer, born = o.events.find(e => e.kind === 'gift-born')?.state
      assert.deepEqual(o.errors, []); assert.equal(o.restored, true)
      assert.ok(o.raised && born && o.phaseZero && o.payout, 'Real baseline lifecycle and pixels must be retained')
      assert.equal(o.phaseZero.runtimePresent, false); assert.equal(o.phaseZero.overlayPresent, false)
      assert.equal(o.phaseZero.gift.phase, 0); assert.equal(o.phaseZero.mode, 'hut')
      assert.match(o.phaseZero.tab, /^buildings/)
      report.baselineStockTiming = { bornTurn: born.turn, initialRemaining: born.gift.remaining,
        phaseZeroTurn: o.phaseZero.turn, payoutTurn: o.payout.after.turn,
        observedObjectTurns: o.payout.after.turn - born.turn }
      assert.equal(report.baselineStockTiming.observedObjectTurns, born.gift.remaining)
      assert.deepEqual(receipt.errors, [])
      report.status = 'baseline-observed'; save(); return report
    }
    const o = report.observer, handoffSelect = o.events.find(e => e.kind === 'select' && e.operation === 'afterTurn/handoff'),
      arrivalSelect = o.events.find(e => e.kind === 'select' && e.operation === 'worshipVisit/arrival')
    assert.deepEqual(o.errors, []); assert.equal(o.restored, true); assert.equal(o.cues, 1)
    assert.ok(o.armed.turn < o.handoff.before.turn, 'Observation must precede completion')
    assert.equal(o.handoff.before.gift.phase, 0)
    assert.deepEqual(o.handoff.after.spell.geometry, handoffSelect.expectedGeometry)
    assert.equal(handoffSelect.before.mode, 'hut'); assert.equal(handoffSelect.after.mode, 'hut')
    assert.match(handoffSelect.before.tab, /^buildings/); assert.match(handoffSelect.after.tab, /^spells/)
    assert.equal(Boolean(handoffSelect.anchor?.valid), !route.fallback, 'Raised origin versus actual offscreen fallback')
    assert.ok(o.raised, 'Raised source body must be observed before phase zero')
    assert.ok(o.arrival && o.payout, 'Arrival and payout must both be observed')
    assert.equal(o.arrival.after.gift.remaining, 1)
    assert.equal(o.arrival.after.stock, o.arrival.before.stock, 'Arrival does not grant stock')
    assert.equal(o.payout.after.turn, o.arrival.after.turn + 1, 'Next object turn owns payout')
    assert.equal(o.payout.after.count, o.handoff.before.count + 1)
    assert.equal(o.payout.after.stock, o.arrival.after.stock + 1)
    assert.match(arrivalSelect.before.tab, route.flightTab ? /^followers/ : /^spells/)
    assert.match(arrivalSelect.after.tab, /^spells/)
    assert.equal(arrivalSelect.before.mode, arrivalSelect.after.mode)
    const art = JSON.parse(readFileSync(resolve(root, 'app/original-worship-acquisition.json'), 'utf8')).bodyFrames[route.model]
    assert.equal(o.decoded?.rgbaSha256, art.rgbaSha256, 'Actual draw source must decode to the original ordinary-palette frame')
    assert.ok(o.samples.some(s => s.command.radians), 'Nonzero native rotation branch reaches actual Canvas draw')
    assert.ok(o.samples.some(s => s.interpolation.intermediate), 'Capture a changed body pose at a genuine fraction strictly between zero and one with matching previous binding')
    if (route.resize) assert.ok(o.samples.some(s => s.stage === 'resized'))
    for (const sample of o.samples) {
      assert.deepEqual(sample.drawOwnership.after, sample.drawOwnership.before, 'Owned draw/interpolation cannot mutate acquisition state or either RNG')
      for (const key of ['args', 'transform']) sample.actual[key].forEach((value, i) =>
        assert.ok(Math.abs(value - sample.expected[key][i]) < 1e-5, `${sample.stage} ${key}[${i}]`))
      assert.equal(sample.actual.alpha, 1); assert.equal(sample.actual.smoothing, false)
      assert.ok(sample.nontransparent > 0, `${sample.stage} actual overlay pixels`)
      assert.deepEqual(sample.command.geometry, o.handoff.after.spell.geometry, 'Resize cannot mutate immutable reference geometry')
      for (const texel of sample.opaqueTexels) assert.deepEqual(texel.actual, texel.expected, `${sample.stage} opaque source texel ${texel.source}`)
    }
    const texelCount = o.samples.reduce((total, sample) => total + sample.opaqueTexels.length, 0)
    report.pixelCorrespondence = { status: texelCount ? 'passed for sampled opaque texels only' : 'unproved: no eligible zero-angle scaled sample',
      sampledOpaqueTexels: texelCount, fullRasterOracle: false, originalGpuPixels: false }
    assert.deepEqual(report.final.diagnostics, []); assert.deepEqual(receipt.errors, [])
    report.status = 'passed'; save(); return report
  } catch (error) { report.status = 'failed'; report.failure = error.stack; save(); throw error }
}
