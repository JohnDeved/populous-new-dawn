import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Exact ordinary route retained in the failed-overall exploratory packet at
// 4186e9d, prepare-journey.mjs. Its natural crossing is evidence; the overall
// receipt is not a clean checker pass. No inherited acceleration/fixtures.
export const m1RouteSource = {
  evidenceCommit: '4186e9d2173fb865c5663efdf7169c9ca7dd61ea',
  evidencePath: 'references/verification/mission-one-controls-2026-10-04/prepare-journey.mjs',
  evidenceSha256: '8d2242bafd35c9557a8cdde1673d1187d79081ee5cd98fae68b2f6a09431bd36',
  application: 'b8465001a618b97ded7d7a7cd4afc4a1fc7240f5',
  limitation: 'Ordinary crossing observed; exploratory process receipt remains failed for separate later commands.',
  helperSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
}

// The stable original-event worship routine is shared byte-for-byte (apart
// from its export name) with primary pilot ca25d68; no second targeting policy.
async function clearSelection(page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await page.evaluate(() => !window.testStore.getWorld().mode && !window.testStore.getWorld().selected.length)) return
    await page.keyboard.press('Escape')
  }
  assert.equal(await page.evaluate(() => !window.testStore.getWorld().mode && !window.testStore.getWorld().selected.length), true)
}

export async function publicWorshipOrder(page, shrine, kind, report, waitForShamanReadiness) {
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
  const attempt = { shrine, kind, readiness, identity, skipped,
    cameraAssistance: 'scene.focus before mode setup; ordinary RAF only' }
  report.orders.push(attempt)
  const neutral = await page.evaluate(() => {
    const r = window.testSceneRef.current.container.getBoundingClientRect()
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }
  })
  await page.mouse.move(neutral.x, neutral.y)
  // Same settlement boundary as accepted M3 driver81dab9e map(), with
  // read-only velocity/navigation checks after ordinary pointer placement.
  const settle = () => page.waitForFunction(() => {
    const s = window.testSceneRef.current
    return !s.world.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition &&
      !Object.values(s.cameraVelocity).some(Boolean) && !s.navigationButtons()
  }, null, { timeout: 30000, polling: 50 })
  await settle()
  await page.evaluate(shrine => window.testSceneRef.current.focus(shrine), shrine)
  await settle()
  const point = attempt.point = await page.evaluate(id => {
    const s = window.testSceneRef.current, head = s.world.shrines.find(h => h.id === id),
      r = s.container.getBoundingClientRect(), mesh = s.shrineMeshes.get(id)?.g,
      p = s.screen(mesh?.position ?? head),
      center = { x: Math.round(r.x + (p.x + 1) * r.width / 2), y: Math.round(r.y + (1 - p.y) * r.height / 2) },
      owns = (x, y) => {
        const e = { clientX: x, clientY: y }
        return x > r.left + 24 && x < r.right - 24 && y > r.top + 24 && y < r.bottom - 24 &&
          !s.pickUnit(e) && s.picking.pickPerson(e) === null && s.pickWorldObject(e)?.id === id &&
          document.elementFromPoint(x, y) === s.renderer.domElement
      }, candidates = []
    mesh?.traverse(child => {
      if (child.userData.nativeModel === undefined || !child.visible) return
      for (const command of s.picking.model(child, JSON.stringify(s.view.projection))) {
        if (command.kind !== 'model') continue
        candidates.push({ x: Math.round(r.x + command.points.reduce((n, p) => n + p.x, 0) / command.points.length),
          y: Math.round(r.y + command.points.reduce((n, p) => n + p.y, 0) / command.points.length) })
      }
    })
    for (let dy = -140; dy <= 60; dy += 4) for (let dx = -100; dx <= 100; dx += 4)
      candidates.push({ x: center.x + dx, y: center.y + dy })
    candidates.sort((a, b) => Math.hypot(a.x - center.x, a.y - center.y + 32) - Math.hypot(b.x - center.x, b.y - center.y + 32))
    for (const radius of [6, 4, 2]) for (const candidate of candidates) {
      if (![-radius, 0, radius].every(dx => [-radius, 0, radius].every(dy => owns(candidate.x + dx, candidate.y + dy)))) continue
      return { ...candidate, radius, neighbors: 9, center }
    }
    throw Error(`No integer interior shrine hit with a two-pixel ownership margin for ${id}`)
  }, shrine.id)
  await page.mouse.move(point.x, point.y)
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  let listening = false
  try {
    attempt.preClick = await page.evaluate(async ({ id, point, kind }) => {
      const { liveCommandContext } = await import('/app/live-command.ts')
      const s = window.testSceneRef.current, canvas = s.renderer.domElement,
        e = { clientX: point.x, clientY: point.y },
        state = event => ({ turn: s.world.turn, currentScene: s === window.testSceneRef.current, sameWorld: s.world === window.testStore.getWorld(),
          paused: s.world.paused, inputMask: s.world.inputMask, overviewStage: s.overviewStage,
          mode: s.world.mode, selected: [...s.world.selected], keys: [...s.keys], lastOrderTurn: s.world.lastOrderTurn,
          message: s.world.message, down: structuredClone(s.down), drag: structuredClone(s.drag),
          targetPerson: s.picking.pickPerson(event), targetUnit: s.pickUnit(event)?.id ?? null,
          targetObject: s.pickWorldObject(event)?.id ?? null, ground: s.pick(event),
          commandContext: (() => {
            // The source helper synchronizes terrain metadata. Supply a detached
            // clone so this diagnostic cannot write the live World or its RNG.
            const person = s.picking.pickPerson(event), target = s.world.units.find(u => u.id === person) ??
              (s.world.selected.length ? s.pickWorldObject(event) : null) ?? s.pick(event)
            if (!target) return null
            const context = liveCommandContext(structuredClone(s.world), { x: target.x, z: target.z, id: target.id })
            return { target: { id: target.id, x: target.x, z: target.z }, model: context?.model,
              enabled: context?.enabled, shrine: context?.shrine?.id, building: context?.building?.id }
          })(),
          camera: { point: { ...s.viewPoint }, bearing: s.cameraBearing, position: s.camera.position.toArray(),
            motion: s.cameraMotion.active, resultActive: s.resultCamera.active, transition: !!s.viewTransition,
            native: { ...s.cameraPosition }, velocity: { ...s.cameraVelocity }, navigation: s.navigationButtons() },
          worshippers: s.world.units.filter(u => u.team === 'blue' && u.kind === kind && u.work === id).map(u => u.id) }),
        owns = (x, y) => {
          const e = { clientX: x, clientY: y }
          return !s.pickUnit(e) && s.picking.pickPerson(e) === null && s.pickWorldObject(e)?.id === id &&
            document.elementFromPoint(x, y) === canvas
        },
        evidence = window.ordinaryWorshipPointerAttempt = { before: state(e), events: [], errors: [], restored: false },
        listeners = []
      for (const type of ['pointerdown', 'pointerup']) for (const capture of [true, false]) {
        const listener = event => {
          try {
            if (evidence.events.length >= 8) throw Error('Pointer evidence bound exceeded')
            evidence.events.push({ type: event.type, stage: capture ? 'window-capture-before-game' : 'window-bubble-after-game',
              x: event.clientX, y: event.clientY, button: event.button, buttons: event.buttons, pointerId: event.pointerId,
              pointerType: event.pointerType, isTrusted: event.isTrusted, targetIsCanvas: event.target === canvas,
              composedPathIncludesCanvas: event.composedPath().includes(canvas), defaultPrevented: event.defaultPrevented,
              modifiers: { shift: event.shiftKey, control: event.ctrlKey, alt: event.altKey, meta: event.metaKey }, state: state(event) })
          } catch (error) { evidence.errors.push(String(error)) }
        }
        window.addEventListener(type, listener, capture); listeners.push({ type, listener, capture })
      }
      window.restoreOrdinaryWorshipPointerAttempt = () => {
        for (const { type, listener, capture } of listeners) window.removeEventListener(type, listener, capture)
        evidence.after = state(e); evidence.restored = true
        delete window.restoreOrdinaryWorshipPointerAttempt
        return evidence
      }
      return { state: evidence.before, stableInterior: [-point.radius, 0, point.radius].every(dx =>
        [-point.radius, 0, point.radius].every(dy => owns(point.x + dx, point.y + dy))) }
    }, { id: shrine.id, point, kind })
    listening = true
    assert.equal(attempt.preClick.stableInterior, true, 'Actual integer interior hit must remain valid immediately before input')
    assert.equal(attempt.preClick.state.camera.motion, 0)
    assert.equal(attempt.preClick.state.camera.navigation, 0)
    assert.equal(Object.values(attempt.preClick.state.camera.velocity).some(Boolean), false)
    assert.equal(attempt.preClick.state.sameWorld, true); assert.equal(attempt.preClick.state.paused, false)
    assert.equal(attempt.preClick.state.inputMask, 0); assert.equal(!!attempt.preClick.state.overviewStage, false)
    assert.equal(!!attempt.preClick.state.camera.resultActive, false); assert.equal(attempt.preClick.state.camera.transition, false)
    const native = attempt.preClick.state.camera.native, short = value => value << 16 >> 16
    assert.ok(Math.hypot(short(native.x - Math.round((shrine.x + 8) * 256)),
      short(native.y - Math.round((-shrine.z - 8) * 256))) <= 1, 'Settled camera retains the requested native destination')
    await page.mouse.click(point.x, point.y)
  } finally {
    if (listening) attempt.pointer = await page.evaluate(() => window.restoreOrdinaryWorshipPointerAttempt())
  }
  const accepted = attempt.accepted = attempt.pointer.after
  assert.deepEqual(attempt.pointer.errors, []); assert.equal(attempt.pointer.restored, true)
  assert.deepEqual(attempt.pointer.events.map(e => [e.type, e.stage]), [
    ['pointerdown', 'window-capture-before-game'], ['pointerdown', 'window-bubble-after-game'],
    ['pointerup', 'window-capture-before-game'], ['pointerup', 'window-bubble-after-game'],
  ], 'Retain the exact original DOM pointer dispatch around existing game listeners')
  for (const event of attempt.pointer.events) {
    assert.equal(event.targetIsCanvas, true); assert.equal(event.isTrusted, true)
    assert.equal(event.x, point.x); assert.equal(event.y, point.y)
    assert.deepEqual(event.modifiers, { shift: false, control: false, alt: false, meta: false })
  }
  assert.equal(accepted.paused, false)
  assert.ok(accepted.worshippers.length, `${kind} public worship order must be accepted: ${JSON.stringify(accepted)}`)
}


// Public minimap picking from that exact archive. All camera operations precede
// spell mode. Real RAF alone updates geometry; no render or animation calls.
async function minimap(page, point, budget) {
  const neutral = await page.evaluate(() => {
    const r = window.testSceneRef.current.container.getBoundingClientRect()
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }
  })
  await page.mouse.move(neutral.x, neutral.y)
  const settle = () => page.waitForFunction(() => {
    const s = window.testSceneRef.current
    return !s.world.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition
  }, null, { timeout: budget(30000), polling: 50 })
  await settle()
  const pick = await page.evaluate(async point => {
    const s = window.testSceneRef.current, { minimapPick } = await import('/app/minimap.ts'),
      r = s.mini.getBoundingClientRect(), width = s.mini.width, height = s.mini.height,
      center = { x: Math.round((s.viewPoint.x + 8) * 256), y: Math.round((-s.viewPoint.z - 8) * 256) },
      target = { x: Math.round((point.x + 8) * 256), y: Math.round((-point.z - 8) * 256) },
      heading = Math.round(s.cameraBearing * 1024 / Math.PI),
      wrap = v => ((v + 32768) % 65536 + 65536) % 65536 - 32768
    let best = { distance: Infinity }
    for (let y = 2; y < height - 2; y++) for (let x = 2; x < width - 2; x++) {
      const n = minimapPick(width, height, center, heading, { x, y }),
        distance = Math.hypot(wrap(n.x - target.x), wrap(n.y - target.y))
      if (distance < best.distance) best = { distance, native: n, x: r.x + x / width * r.width, y: r.y + y / height * r.height }
    }
    if (document.elementFromPoint(best.x, best.y) !== s.mini) throw Error('Minimap does not own selected pixel')
    return best
  }, point)
  await page.mouse.click(pick.x, pick.y)
  await page.mouse.move(neutral.x, neutral.y)
  await settle()
  const camera = await page.evaluate(() => structuredClone(window.testSceneRef.current.cameraPosition)), short = v => v << 16 >> 16
  assert.ok(Math.hypot(short(camera.x - pick.native.x), short(camera.y - pick.native.y)) <= 1,
    'Public minimap reaches the actual clicked native destination')
  return { point, pick, camera, control: 'public minimap; ordinary camera settling; accepted M3 driver81dab9e contract' }
}

const snapshot = page => page.evaluate(() => {
  const s = window.testSceneRef.current, w = window.testStore.getWorld(),
    u = w.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
  return { turn: w.turn, paused: w.paused, inputMask: w.inputMask, mode: w.mode,
    message: w.message, lastOrderTurn: w.lastOrderTurn, selected: [...w.selected],
    stock: w.shots.bridge, count: w.giftCounts.bridge, bridges: w.stats.bridges, landVersion: w.landVersion,
    sameWorld: s.world === w, connected: s.renderer.domElement.isConnected,
    loading: !!document.querySelector('.loading-world'),
    shaman: u && { id: u.id, hp: u.hp, x: u.x, z: u.z, work: u.work, path: structuredClone(u.path), casting: u.casting?.spell },
    gifts: w.gifts.map(g => ({ id: g.id, reward: g.reward, phase: g.phase, remaining: g.remaining })) }
})

export async function prepareM1LightningRoute({ page, waitForShamanReadiness, signal, report, save }) {
  const result = report.prerequisite = { source: m1RouteSource, deadlineMs: 180000, actions: [], status: 'running' },
    deadline = performance.now() + result.deadlineMs,
    remaining = maximum => {
      signal.throwIfAborted()
      const value = Math.min(maximum, deadline - performance.now())
      assert.ok(value > 0, 'M1 crossing prerequisite deadline')
      return value
    },
    wait = (fn, arg, maximum) => page.waitForFunction(fn, arg, { timeout: remaining(maximum), polling: 50 }),
    record = entry => { result.actions.push(entry); save() }
  const ready = async label => {
    const resume = page.getByRole('button', { name: 'Resume game', exact: true })
    if (await resume.isVisible()) await resume.click()
    const skipped = []
    while ((await snapshot(page)).inputMask) {
      remaining(45000)
      const skip = page.locator('.skip-introduction')
      if (await skip.isVisible()) { skipped.push((await snapshot(page)).turn); await skip.click() }
      else await page.waitForTimeout(100)
    }
    const readiness = await waitForShamanReadiness(page, { timeout: remaining(45000) }), state = await snapshot(page)
    record({ kind: 'readiness', label, skipped, readiness, state })
    assert.equal(state.sameWorld, true); assert.equal(state.connected, true); assert.equal(state.loading, false)
    assert.equal(state.paused, false); assert.equal(state.inputMask, 0)
  }
  const selectShaman = async () => {
    for (let i = 0; i < 3; i++) {
      if (await page.evaluate(() => !window.testStore.getWorld().mode && !window.testStore.getWorld().selected.length)) break
      await page.keyboard.press('Escape')
    }
    await page.getByRole('button', { name: 'followers', exact: true }).click()
    await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
    const state = await snapshot(page)
    record({ kind: 'select-shaman', state })
    assert.deepEqual(state.selected, [state.shaman.id]); assert.equal(state.mode, null)
  }
  const ground = async (point, spell = null) => {
    const search = await page.evaluate(async ({ point, spell }) => {
      const s = window.testSceneRef.current, r = s.container.getBoundingClientRect(), projected = s.screen(point),
        center = { x: r.x + (projected.x + 1) * r.width / 2, y: r.y + (1 - projected.y) * r.height / 2 },
        { supportsFollower, spellTargetError } = await import('/app/model.ts'), probe = structuredClone(s.world), candidates = []
      // Imported validation synchronizes terrain caches. Use a detached clone,
      // never the live World, for both support and spell-range diagnostics.
      for (let radius = 0; radius <= 32; radius += 2) for (const [dx, dy] of [[0, -radius], [0, radius], [-radius, 0], [radius, 0]]) {
        const event = { clientX: center.x + dx, clientY: center.y + dy },
          canvasOwned = document.elementFromPoint(event.clientX, event.clientY) === s.renderer.domElement,
          person = s.picking.pickPerson(event), object = s.pickWorldObject(event)?.id ?? null,
          hit = s.pick(event), distance = hit ? Math.hypot(hit.x - point.x, hit.z - point.z) : null,
          supported = hit ? supportsFollower(probe, hit) : false,
          error = hit && spell ? spellTargetError(probe, spell, hit) : null
        candidates.push({ x: event.clientX, y: event.clientY, canvasOwned, person, object,
          hit: hit && { x: hit.x, z: hit.z }, distance, supported, error })
        // scene-input-runtime.pointerUp intentionally ignores people/objects
        // in spell mode and uses the terrain pick. Movement still excludes them.
        if (!canvasOwned || (!spell && (person !== null || object !== null)) ||
            !hit || distance > 0.5 || !supported || error) continue
        return { target: { x: event.clientX, y: event.clientY, point: { x: hit.x, z: hit.z }, lead: point, error }, candidates }
      }
      return { target: null, candidates }
    }, { point, spell })
    record({ kind: 'ground-pick', lead: point, spell, policy: spell ? 'Shipped spell-mode terrain pick' : 'Unobstructed movement target', ...search })
    assert.ok(search.target, `No valid canvas-owned dry ground near archived ${point.x},${point.z}; see bounded ground-pick diagnostics`)
    return search.target
  }
  try {
    await ready('Bridge worship'); await selectShaman()
    result.initial = await snapshot(page)
    const head = await page.evaluate(() => window.testStore.getWorld().shrines.find(h => h.kind === 'bridge' && h.x === -5 && h.z === 25))
    assert.ok(head); assert.equal(head.required, 1); assert.equal(head.target, 28); assert.equal(head.uses, 0)
    record({ kind: 'camera', ...await minimap(page, head, remaining) })
    const worship = { kind: 'worship', head, before: await snapshot(page) }
    record(worship)
    report.orders ??= []
    await publicWorshipOrder(page, head, 'shaman', report, waitForShamanReadiness)
    worship.after = await snapshot(page); save()
    await wait(initial => {
      const w = window.testStore.getWorld()
      return w.shots.bridge > initial.stock && w.giftCounts.bridge > initial.count
    }, result.initial, 75000)
    result.earned = await snapshot(page); save()
    await ready('Leave Bridge worship'); await selectShaman()
    record({ kind: 'camera', ...await minimap(page, { x: 0, z: 20 }, remaining) })
    const shore = await ground({ x: 0, z: 20 }), move = { kind: 'move', shore, before: await snapshot(page) }
    record(move); await page.mouse.click(shore.x, shore.y)
    move.after = await snapshot(page); save()
    assert.ok(move.after.lastOrderTurn > move.before.lastOrderTurn, JSON.stringify(move.after))
    await wait(({ id, point }) => {
      const u = window.testStore.getWorld().units.find(u => u.id === id)
      return u?.hp > 0 && u.work === null && !u.casting && !u.path.length && Math.hypot(u.x - point.x, u.z - point.z) < 1.3
    }, { id: move.after.shaman.id, point: shore.point }, 60000)
    await wait(() => {
      const w = window.testStore.getWorld(), a = w.worshipAcquisition, c = a?.controllers
      return !w.gifts.some(g => g.reward === 'bridge') && (!a || (!a.requests.length &&
        !c.spell?.active && !c.companion?.active && !c.pulse?.active && !c.drawCommands.length &&
        document.querySelector('.worship-acquisition-overlay').hidden))
    }, null, 30000)
    await ready('Land Bridge cast')
    record({ kind: 'camera', ...await minimap(page, { x: 0, z: 4 }, remaining) })
    const target = await ground({ x: 0, z: 4 }, 'bridge'), cast = { kind: 'cast-bridge', target, before: await snapshot(page) }
    record(cast)
    await page.getByRole('button', { name: /^spells/ }).click()
    await page.getByRole('button', { name: /^Land Bridge, [1-9] shots$/ }).click()
    assert.equal(await page.evaluate(() => window.testStore.getWorld().mode), 'bridge')
    cast.validation = await page.evaluate(async target => {
      const s = window.testSceneRef.current, e = { clientX: target.x, clientY: target.y }, hit = s.pick(e),
        { spellTargetError } = await import('/app/model.ts')
      return { owned: document.elementFromPoint(target.x, target.y) === s.renderer.domElement,
        point: hit && { x: hit.x, z: hit.z },
        error: hit ? spellTargetError(structuredClone(s.world), 'bridge', hit) : 'No terrain hit' }
    }, target)
    save(); assert.equal(cast.validation.owned, true); assert.equal(cast.validation.error, null)
    assert.ok(Math.hypot(cast.validation.point.x - target.point.x, cast.validation.point.z - target.point.z) < 0.05)
    await page.mouse.click(target.x, target.y)
    cast.after = await snapshot(page); save()
    assert.equal(cast.after.stock, cast.before.stock - 1, JSON.stringify(cast.after))
    await wait(before => {
      const w = window.testStore.getWorld()
      return w.stats.bridges === before + 1 && w.effects.some(e => e.bridge)
    }, cast.before.bridges, 15000)
    cast.effect = await page.evaluate(() => structuredClone(window.testStore.getWorld().effects.find(e => e.bridge)))
    save(); assert.ok(cast.effect?.bridge, 'Observe actual Bridge controller before its retirement')
    await wait(before => {
      const w = window.testStore.getWorld()
      return w.stats.bridges === before + 1 && !w.effects.some(e => e.bridge) && !w.projectiles.some(p => p.spell === 'bridge')
    }, cast.before.bridges, 45000)
    result.crossing = await snapshot(page)
    result.path = await page.evaluate(async () => {
      const { findPath } = await import('/app/model.ts'), w = structuredClone(window.testStore.getWorld()),
        brave = w.units.find(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0),
        head = w.shrines.find(h => h.kind === 'lightning' && h.x === 11 && h.z === 1)
      const path = findPath(w, brave, head)
      return { actor: { id: brave.id, x: brave.x, z: brave.z }, head: { id: head.id, x: head.x, z: head.z }, points: path }
    })
    save(); assert.ok(result.path.points.length, 'Actual raised terrain must connect a real Brave to Lightning')
    await ready('Lightning handoff')
    result.status = 'passed'; save(); return result
  } catch (error) { result.status = 'failed'; result.failure = error.stack; save(); throw error }
}
