// One ordinary worship dispatch. No model command, clock, renderer or storage writes.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { errors } from '@playwright/test'
import { bindGame, showAllMissions, readShamanReadiness } from '../../scripts/browser-game.mjs'
import { readQueuedPreservingStop, pollWithPreservation } from './stop.mjs'
import { limits, readLaunchPlan, serverIdentity, sha256, evidenceBytes, browserModules } from './source-policy.mjs'
import { observeLoadedModules } from './runtime.mjs'

const ownRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)))
// The maintained harness imports this named scenario before creating a profile/server.
const launch = readLaunchPlan(ownRoot, process.env.POPULOUS_EROSION_LAUNCH_PLAN)

export default async function ordinaryErosion({ page, root, output, url, signal, receipt }) {
  assert.equal(resolve(root), ownRoot); assert.equal(output, launch.plan.output); assert.equal(url, launch.plan.origin)
  assert.deepEqual(receipt.source, launch.source)
  assert.equal(receipt.profile?.mode, 'created'); assert.equal(receipt.profile.path, launch.plan.profilePath)
  assert.equal(receipt.profile.previousRun ?? null, null); assert.equal(receipt.profile.checkpointAtStart, null)
  page.setDefaultTimeout(2000)
  const started = Date.now(), commands = resolve(output, 'commands'), actions = [], startupBindingTimeouts = []
  mkdirSync(commands, { recursive: false })
  let stopped = false, actorId, moduleObserver, attached = false, primaryError
  let resultValue, primaryFailed = false, cleanupFailed = false, cleanupError
  const cleanupFailures = []
  const record = entry => actions.push({ ordinal: actions.length + 1, wallMs: Date.now() - started, ...entry })
  const save = (name, data) => { const bytes = evidenceBytes(data); writeFileSync(resolve(output, name), bytes); return sha256(bytes) }
  const checkStop = async () => {
    signal.throwIfAborted()
    assert.equal(stopped, false, 'The run is already stopping')
    assert.ok(Date.now() - started < launch.plan.bounds.scenarioWallMs, 'Scenario wall bound reached')
    const stop = readQueuedPreservingStop(commands, 1, receipt.profile.runId, { includeOrdinary: true })
    if (!stop) return
    stopped = true
    writeFileSync(resolve(output, 'stop-command.json'), stop.bytes)
    const exact = stop.valid && JSON.parse(stop.bytes)[0]?.runId === receipt.profile.runId
    record({ kind: 'stop', valid: !!exact, sha256: stop.sha256 })
    throw Error(exact ? 'Requested current-run preserving stop; no Save is issued' : 'Unexpected/malformed control input; stopping without executing it')
  }
  const poll = (check, timeout, label) => pollWithPreservation(check, { checkStop, timeout, label, interval: 100 })
  const input = async (kind, details, action) => {
    await checkStop(); record({ kind, ...details, phase: 'before' })
    await action()
    await checkStop(); record({ kind, ...details, phase: 'completed' })
  }
  const button = async name => {
    const control = page.getByRole('button', { name, exact: true })
    await poll(async () => await control.isVisible() && await control.isEnabled(), limits.cameraMs, name)
    await input('button', { name }, () => control.click({ timeout: 1500 }))
  }
  const read = () => page.evaluate(async id => {
    const { currentPersonOrder } = await import('/app/person-orders.ts')
    const s = window.testSceneRef?.current, w = s?.world
    if (!s?.renderer.domElement.isConnected || w !== window.testStore?.getWorld() || w.outcome.level !== 3) throw Error('Current Mission3 scene/store mismatch')
    if (window.erosionOrdinary && window.erosionOrdinary.world !== w) throw Error('Original capture World was replaced')
    const u = id ? w.units.find(u => u.id === id) : w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    if (!window.erosionOriginal) {
      if (id !== undefined && id !== null) throw Error('Original World observation disappeared')
      if (!u || w.units.filter(unit => unit.team === 'blue' && unit.kind === 'shaman').length !== 1) throw Error('One original Blue Shaman required')
      const boundId = u.id
      window.erosionOriginal = { scene: s, world: w, actor: u, current() {
        const current = window.testSceneRef?.current
        if (current !== s || current.world !== w || window.testStore?.getWorld() !== w || !w.units.includes(u) || u.id !== boundId) throw Error('Original scene/World/actor identity changed')
        return current
      } }
    }
    window.erosionOriginal.current()
    if (u !== window.erosionOriginal.actor) throw Error('Original actor reference changed')
    const p = u?.builder?.person ?? u?.flight ?? u?.fight?.motion ?? u?.native ?? u?.entry?.person
    const shrine = w.shrines.find(h => h.id === 101)
    return { level: w.outcome.level, turn: w.turn, time: w.time, speed: w.speed, paused: w.paused, status: w.status,
      inputMask: w.inputMask, mode: w.mode, orderCursor: w.orderCursor, selected: [...w.selected], lastOrderTurn: w.lastOrderTurn,
      pointerAck: { ...s.pointerAck }, contextLost: s.renderer.getContext().isContextLost(),
      actor: u && { id: u.id, kind: u.kind, team: u.team, hp: u.hp, x: u.x, z: u.z, inside: u.inside, fighting: !!u.fight,
        order: p ? currentPersonOrder(w.buildingOrders, p) : null, work: u.work, state: p?.state, substate: p?.substate, speed: p?.speed },
      shrine: shrine && { id: shrine.id, kind: shrine.kind, x: shrine.x, z: shrine.z, uses: shrine.uses, work: shrine.work, followers: shrine.followers,
        active: shrine.active, target: shrine.target, required: shrine.required, remaining: shrine.remaining },
      lifecycle: window.erosionOrdinary?.observer.progress() ?? null,
      complete: window.erosionOrdinary?.observer.complete() ?? false }
  }, actorId)
  const health = state => {
    assert.equal(state.level, 3); assert.ok(['playing', 'won'].includes(state.status)); assert.equal(state.speed, 1)
    assert.equal(state.paused, false); assert.equal(state.contextLost, false)
    assert.equal(state.actor?.id, actorId); assert.equal(state.actor?.team, 'blue'); assert.equal(state.actor?.kind, 'shaman')
    assert.ok(state.actor.hp > 0 && !state.actor.fighting, 'Original Shaman unavailable or in combat; no replacement tactic')
    assert.deepEqual(state.lifecycle?.errors ?? [], []); assert.deepEqual(state.lifecycle?.speedViolations ?? [], [])
  }
  const settleCamera = () => poll(() => page.evaluate(() => {
    const s = window.erosionOriginal.current()
    return !s.world.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition
  }), limits.cameraMs, 'actual camera settlement')
  const viewHead = async target => {
    await settleCamera()
    const hit = await page.evaluate(async point => {
      const s = window.erosionOriginal.current(), { minimapPick } = await import('/app/minimap.ts')
      const { minimapInput } = await import('/qa/erosion-ordinary/minimap-input.mjs')
      const rect = s.mini.getBoundingClientRect()
      return minimapInput({ width: s.mini.width, height: s.mini.height, rect,
        center: { x: Math.round((s.viewPoint.x + 8) * 256), y: Math.round((-s.viewPoint.z - 8) * 256) },
        heading: Math.round(s.cameraBearing * 1024 / Math.PI),
        target: { x: Math.round((point.x + 8) * 256), y: Math.round((-point.z - 8) * 256) }, maxDistance: 8 * 256 },
      minimapPick, p => document.elementFromPoint(p.x, p.y) === s.mini)
    }, target)
    assert.ok(hit, 'A visible owned minimap pixel must map near this head')
    await input('minimap', { target, hit }, () => page.mouse.click(hit.x, hit.y))
    await settleCamera()
  }
  const findHeadInput = () => page.evaluate(async () => {
    const s = window.erosionOriginal.current(), head = s.world.shrines.find(h => h.id === 101)
    const { findEntityInput, inspectEntityPoint } = await import('/qa/erosion-ordinary/input.mjs')
    const mesh = s.shrineMeshes.get(head.id)?.g, r = s.container.getBoundingClientRect(), candidates = []
    const q = s.screen(mesh?.position ?? head), center = { x: r.x + (q.x + 1) * r.width / 2, y: r.y + (1 - q.y) * r.height / 2 }
    mesh?.traverse(child => {
      if (child.userData.nativeModel === undefined || !child.visible) return
      for (const { points } of s.picking.model(child, JSON.stringify(s.view.projection)).filter(c => c.kind === 'model'))
        for (const weights of [[1, 1, 1], [2, 1, 1], [1, 2, 1], [1, 1, 2]]) {
          const total = weights.reduce((a, b) => a + b, 0)
          candidates.push({ x: r.x + points.reduce((sum, p, i) => sum + p.x * weights[i], 0) / total,
            y: r.y + points.reduce((sum, p, i) => sum + p.y * weights[i], 0) / total })
        }
    })
    candidates.sort((a, b) => Math.hypot(a.x - center.x, a.y - center.y) - Math.hypot(b.x - center.x, b.y - center.y))
    for (let dy = -150; dy <= 64; dy += 4) for (let dx = -100; dx <= 100; dx += 4) candidates.push({ x: center.x + dx, y: center.y + dy })
    const hit = findEntityInput(candidates, 101, point => inspectEntityPoint(s, 'shrines', point))
    return hit && { ...hit, id: 101, collection: 'shrines' }
  })
  const verifyInputs = () => {
    assert.deepEqual(serverIdentity(root), launch.server, 'Compiler/server/harness inputs changed')
    assert.equal(sha256(readFileSync(process.env.POPULOUS_EROSION_LAUNCH_PLAN)), launch.planSha256, 'Reviewed launch plan changed')
    assert.deepEqual(receipt.errors, [])
  }
  try {
    moduleObserver = await observeLoadedModules(page, root, url, checkStop)
    await input('show-all-missions', {}, () => showAllMissions(page))
    await input('mission-start', { mission: 3 }, async () => {
      await page.getByRole('button', { name: 'Mission 3', exact: true }).focus()
      await checkStop(); await page.keyboard.press('Enter')
    })
    await poll(async () => {
      try { await bindGame(page); return true }
      catch (error) {
        if (!(error instanceof errors.TimeoutError)) throw error
        assert.ok(startupBindingTimeouts.length < 64, 'Startup binding diagnostic bound reached')
        startupBindingTimeouts.push({ wallMs: Date.now() - started, message: String(error) })
        return false
      }
    }, limits.startupMs - (Date.now() - started), 'Mission3 scene binding')
    const initial = await read(); actorId = initial.actor.id
    assert.equal(initial.actor.kind, 'shaman'); assert.equal(initial.actor.team, 'blue')
    assert.equal(initial.shrine.kind, 'erosionEffect'); assert.equal(initial.shrine.uses, 0)
    save('initial.json', initial)
    const skip = page.getByRole('button', { name: /^Skip introduction/ })
    if (await skip.isVisible()) await input('skip-introduction', {}, () => skip.click({ timeout: 1500 }))
    let resumedAtStartup = false
    await poll(async () => {
      if ((await read()).paused) {
        assert.equal(resumedAtStartup, false, 'Repeated startup pause; no automatic resume loop')
        await button('Resume game'); resumedAtStartup = true
      }
      return (await readShamanReadiness(page)).ready === true
    }, limits.startupMs - (Date.now() - started), 'original Shaman opening completion')
    health(await read())
    if (launch.plan.purpose === 'startup-smoke') {
      await checkStop()
      await page.evaluate(async paths => {
        window.erosionOriginal.current()
        for (const path of paths) await import('/' + path)
        window.erosionOriginal.current()
        if (window.erosionOrdinary) throw Error('Startup smoke must not arm capture')
      }, browserModules)
      await checkStop()
      const loaded = await moduleObserver.read(), final = await read()
      health(final); assert.equal(final.shrine.uses, 0); assert.equal(final.lifecycle, null)
      verifyInputs()
      const files = { modules: save('modules.json', loaded.modules), startup: save('startup-smoke.json', { initial, final, actions, startupBindingTimeouts, restoreTested: false }) }
      await checkStop(); await page.screenshot({ path: resolve(output, 'startup-ready.png'), timeout: 5000 }); await checkStop()
      resultValue = { erosionStartupSmoke: { files, runId: receipt.profile.runId, sourceFingerprint: receipt.source.fingerprint,
        originalActorId: actorId, launchPlanSha256: launch.planSha256, serverIdentity: launch.server, scriptObservations: loaded.observations,
        scope: 'Startup and module/scene readiness only; no capture declaration or worship dispatch', restoreTested: false } }
    } else {
      for (let n = 0; n < 3; n++) {
        const current = await read()
        if (!current.mode && !current.selected.length && !current.orderCursor) break
        await input('key', { key: 'Escape' }, () => page.keyboard.press('Escape'))
      }
      await button('Select and focus shaman')
      const selected = await read(); health(selected); assert.deepEqual(selected.selected, [actorId]); assert.equal(selected.mode, null)
      await viewHead(selected.shrine)
      let hit
      for (let attempt = 0; attempt < 4; attempt++) {
        hit = await findHeadInput(); record({ kind: 'head-hit-probe', attempt, hit })
        if (hit) break
        if (attempt === 3) break
        const corridor = await page.evaluate(() => {
          const s = window.erosionOriginal.current()
          for (const y of [750, 650, 550]) if ([280, 792].every(x => document.elementFromPoint(x, y) === s.renderer.domElement)) return { x: 280, y, end: 792 }
          return null
        })
        assert.ok(corridor, 'Visible canvas corridor required for ordinary camera drag')
        await input('camera-drag', corridor, async () => {
          await page.mouse.move(corridor.x, corridor.y); await checkStop()
          await page.mouse.down({ button: 'right' })
          try { await checkStop(); await page.mouse.move(corridor.end, corridor.y, { steps: 12 }) }
          finally { await page.mouse.up({ button: 'right' }) }
        })
        await settleCamera()
      }
      assert.ok(hit, 'No owned integer head interior; do not substitute another input')
      const context = await page.evaluate(async () => {
        const s = window.erosionOriginal.current(), { createMoveContextProbe } = await import('/qa/erosion-ordinary/input.mjs')
        return createMoveContextProbe(s.world)(s.world.shrines.find(h => h.id === 101))
      })
      assert.equal(context.model, 27); assert.equal(context.enabled, true); assert.equal(context.shrineId, 101)
      record({ kind: 'detached-command-context', context })
      const identity = { runId: receipt.profile.runId, profileId: receipt.profile.id,
        source: { commit: receipt.source.commit, fingerprint: receipt.source.fingerprint } }
      await page.evaluate(async ({ identity, actorId }) => {
        const { observeOrdinaryErosion } = await import('/qa/erosion-ordinary/lifecycle.mjs')
        const s = window.erosionOriginal.current()
        if (window.erosionOrdinary) throw Error('No observer rearming')
        window.erosionOrdinary = { world: s.world, observer: observeOrdinaryErosion(s.gameClock, s.world, identity, actorId) }
      }, { identity, actorId }); attached = true
      const loadedBefore = await moduleObserver.read()
      await poll(() => page.evaluate(() => { const w = window.erosionOriginal.current().world; return w.turn > w.lastOrderTurn }), 5000, 'fresh user-order turn')
      const before = await read(); health(before); assert.equal(before.inputMask, 0); assert.equal(before.orderCursor, 0); assert.deepEqual(before.selected, [actorId])
      await page.evaluate(async hit => {
        const { findEntityInput, inspectEntityPoint, observeEntityPointer } = await import('/qa/erosion-ordinary/input.mjs')
        const s = window.erosionOriginal.current()
        if (!findEntityInput([hit], 101, p => inspectEntityPoint(s, 'shrines', p))) throw Error('Head hit became stale')
        window.erosionPointer = observeEntityPointer(s, document, hit)
      }, hit)
      let delivered
      try { await input('worship-click', { hit, actorId }, () => page.mouse.click(hit.x, hit.y)) }
      finally {
        delivered = await page.evaluate(() => {
          const observer = window.erosionPointer; delete window.erosionPointer
          return observer?.finish()
        })
      }
      const after = await read(); health(after)
      assert.equal(delivered?.restored, true); assert.deepEqual(delivered.errors, [])
      assert.deepEqual(delivered.events.map(e => [e.type, e.x, e.y, e.button, e.trusted, e.canvasOwned, e.canvasTarget]),
        ['pointerdown', 'pointerup'].map(type => [type, hit.x, hit.y, 0, true, true, true]))
      assert.ok(delivered.events.every(e => ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'].every(key => e.args[key] === false)), 'Worship input must be unmodified')
      for (const event of delivered.events) {
        for (const state of [event.state, event.after]) {
          assert.equal(state.currentSceneMatches, true); assert.equal(state.currentWorldMatches, true)
          assert.equal(state.armedWorldMatches, true); assert.equal(state.armedCanvasMatches, true)
          assert.equal(state.target?.id, 101); assert.equal(state.target?.kind, 'erosionEffect')
        }
        assert.ok(event.picks.every(pick => pick.receiverMatches && !pick.threw), 'Actual picker receiver/error mismatch')
      }
      assert.ok(delivered.events.some(event => event.picks.some(pick => pick.id === 101)), 'Actual handler did not pick the authored head')
      assert.ok(after.lastOrderTurn > before.lastOrderTurn && after.pointerAck.until > before.pointerAck.until && after.pointerAck.target === 101)
      assert.equal(after.actor.order?.model, 27); assert.equal(after.actor.order.flags & 1, 0); assert.equal(after.actor.order.a, 101)
      record({ kind: 'worship-accepted', actorId, hit, before, after, delivered })
      let progress = JSON.stringify([after.actor.x, after.actor.z, after.shrine.work]), progressAt = Date.now(), activationAt = null
      let arrived = false, worked = false
      await poll(async () => {
        const state = await read(); health(state)
        save('progress.json', state)
        if (!state.lifecycle?.erosion.use) {
          assert.equal(state.actor.order?.model, 27, 'Original worship order changed before activation; no reissue')
          assert.equal(state.actor.order.a, 101)
          const wrap = value => ((value + 128) % 256 + 256) % 256 - 128
          const near = Math.hypot(wrap(state.actor.x - state.shrine.x), wrap(state.actor.z - state.shrine.z)) <= 4
          const qualifying = near && [10, 33].includes(state.actor.state) && state.actor.speed === 0 && state.actor.substate > 0 && state.shrine.followers > 0
          if (qualifying && !arrived) { arrived = true; record({ kind: 'worship-arrival', state }) }
          if (qualifying && state.shrine.work > after.shrine.work && !worked) { worked = true; record({ kind: 'worship-work', state }) }
        }
        const key = JSON.stringify([Math.round(state.actor.x * 4), Math.round(state.actor.z * 4), state.shrine.work])
        if (key !== progress) { progress = key; progressAt = Date.now() }
        assert.ok(Date.now() - progressAt < limits.progressMs, 'No original-actor travel/head-work progress for90seconds')
        if (state.lifecycle?.erosion.use) activationAt ??= Date.now()
        if (activationAt !== null) assert.ok(Date.now() - activationAt < limits.retirementMs, 'Erosion retirement exceeded30seconds')
        return state.complete
      }, limits.wallMs - (Date.now() - started), 'ordinary Erosion activation and retirement')
      assert.ok(arrived && worked, 'Actual original-actor arrival and head-work transition were not observed')
      const final = await read(), result = await page.evaluate(() => window.erosionOrdinary.observer.read())
      const loadedAfter = await moduleObserver.read()
      assert.deepEqual(loadedAfter, loadedBefore, 'Loaded source/module identity changed')
      verifyInputs()
      const files = { capture: save('capture.json', result.capture), lifecycle: save('lifecycle.json', result.lifecycle),
        modules: save('modules.json', loadedAfter.modules), inputs: save('inputs.json', { version: 1, kind: 'ordinary-m3-shaman-erosion-inputs',
          runId: receipt.profile.runId, sourceFingerprint: receipt.source.fingerprint, originalActorId: actorId, initial, actions, startupBindingTimeouts, final, restoreTested: false }) }
      await checkStop(); await page.screenshot({ path: resolve(output, 'erosion-retired.png'), timeout: 5000 }); await checkStop()
      resultValue = { erosionReplay: { files, runId: receipt.profile.runId, sourceFingerprint: receipt.source.fingerprint,
        launchPlanSha256: launch.planSha256, serverIdentity: launch.server, scriptObservations: loadedAfter.observations,
        originalActorId: actorId, firstTurn: result.capture.steps[0].turn, finalTurn: result.capture.steps.at(-1).turn,
        restoreTested: false, scope: 'Ordinary one-order activation and64 captured calls; no Save/Load or full native game claim' } }
    }
  } catch (error) { primaryFailed = true; primaryError = error }
  finally {
    const rememberCleanup = error => {
      if (!cleanupFailed) { cleanupFailed = true; cleanupError = error }
      let message = 'Cleanup failed'
      try { message = String(error) || message } catch { /* Retain the nonempty diagnostic. */ }
      cleanupFailures.push(message)
    }
    try { save('actions.json', { runId: receipt.profile.runId, actions, startupBindingTimeouts, failure: primaryFailed ? String(primaryError) || 'Scenario failed' : null }) }
    catch (error) { rememberCleanup(error) }
    if (attached) try {
      const closed = await page.evaluate(() => {
        const observed = window.erosionOrdinary
        observed.observer.dispose()
        const epoch = observed.observer.progress()
        delete window.erosionOrdinary
        return epoch
      })
      assert.deepEqual(closed.errors, [], 'Diagnostic hooks did not close cleanly')
    } catch (error) { rememberCleanup(error) }
    if (moduleObserver) try { await moduleObserver.dispose() } catch (error) { rememberCleanup(error) }
  }
  if (cleanupFailed) receipt.erosionCleanupFailures = cleanupFailures
  if (primaryFailed) throw primaryError
  if (cleanupFailed) throw cleanupError
  return resultValue
}
