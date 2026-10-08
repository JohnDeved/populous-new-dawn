import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, waitForShamanReadiness } from '../../scripts/browser-game.mjs'
import { waitForSavedCheckpoint } from '../../scripts/local-render/early-missions.mjs'
import { pollWithPreservation, readQueuedPreservingStop } from '../erosion-ordinary/stop.mjs'
import { assertNoCast, assertCancellationSequence, assertCast, assertActivePause, assertFrozen } from './controls-evidence.mjs'

// Separate remaining-control witness. Never changes the moving-target contract.
export default async function blastControls({ page, output, receipt, openMission, observeCheckpoint, signal }) {
  assert.equal(receipt.profile?.mode, 'created', 'Controls require their own fresh owned profile')
  assert.equal(receipt.profile.checkpointAtStart, null)
  page.setDefaultTimeout(10000)
  const limits = { wallMs: 240000, setupMs: 140000, maximumSetupTurn: 1800, cameraMs: 15000, castMs: 10000, castTurns: 48 }
  const started = Date.now(), commands = resolve(output, 'commands')
  mkdirSync(commands)
  const report = { source: receipt.source, runId: receipt.profile.runId, limits, actions: [], checks: [], proofs: [],
    method: 'Public Mission 2, HUD/mouse/keyboard input and real RAF. Read-only input/turn/store/IndexedDB observations; diagnostic validators use detached clones. No world, stock, storage or clock injection.',
    limitsOfEvidence: 'Remaining ordinary controls only; no moving-target, native-executable or hardware-performance claim.' }
  const save = () => writeFileSync(resolve(output, 'controls.json'), JSON.stringify(report, null, 2) + '\n')
  const checkStop = async () => {
    signal.throwIfAborted()
    assert.ok(Date.now() - started < limits.wallMs, 'Controls wall bound reached')
    const stop = readQueuedPreservingStop(commands, 1, receipt.profile.runId, { includeOrdinary: true })
    if (stop) { writeFileSync(resolve(output, 'stop-command.json'), stop.bytes); throw Error('Current-run stop input received') }
  }
  const poll = (fn, timeout, label) => pollWithPreservation(fn, { checkStop, timeout, label, interval: 50, sleep: ms => page.waitForTimeout(ms) })
  const input = async (name, fn) => {
    await checkStop(); report.actions.push({ name, phase: 'before', wallMs: Date.now() - started })
    await fn()
    report.actions.push({ name, phase: 'after', wallMs: Date.now() - started }); await checkStop()
  }
  const button = name => page.getByRole('button', { name, exact: true })
  const snap = () => page.evaluate(() => window.controlQA.controlSnapshot(window.testSceneRef.current.world))
  const settle = () => poll(() => page.evaluate(() => {
    const scene = window.testSceneRef.current
    return !scene.world.inputMask && !scene.cameraMotion.active && !scene.resultCamera.active && !scene.viewTransition
  }), limits.cameraMs, 'ordinary camera settlement')
  const healthy = state => {
    assert.equal(state.level, 2); assert.equal(state.status, 'playing'); assert.equal(state.speed, 1)
    assert.equal(state.flags & 32, 0); assert.equal(state.inputMask, 0); assert.ok(state.actor?.hp > 0)
  }
  const collect = async (name, fn, targetId = null) => {
    await page.evaluate(targetId => {
      const q = window.controlQA, scene = window.testSceneRef.current
      if (q.observer) throw Error('Previous controls observer is still attached')
      q.observer = q.observeControls(scene, q.observeEntityPointer, scene.world.units.find(unit => unit.id === targetId))
    }, targetId)
    let proof
    try { await fn() }
    finally {
      proof = await page.evaluate(() => {
        const q = window.controlQA, result = q.observer.finish(); q.observer = null; return result
      })
      report.proofs.push({ name, ...proof }); save()
    }
    assert.deepEqual(proof.errors, []); assert.deepEqual(proof.pointer.errors, []); assert.equal(proof.cleanupVerified, true)
    return proof
  }
  const up = proof => proof.events.filter(event => event.type === 'pointerup' && event.button === 0)
  const pointerUp = proof => proof.pointer.events.filter(event => event.type === 'pointerup' && event.button === 0)
  const finishCast = async (startTurn, point) => poll(async () => {
    const state = await snap(); healthy(state)
    assert.ok(!state.paused && state.turn - startTurn <= limits.castTurns, 'Cast exceeded active-turn bound')
    return page.evaluate(point => {
      const q = window.controlQA, w = window.testSceneRef.current.world
      return !w.projectiles.some(shot => shot.team === 'blue' && shot.spell === 'blast') && q.spellTargetError(structuredClone(w), 'blast', point) === null
    }, point)
  }, limits.castMs, 'ordinary cast retirement and Shaman readiness')
  const lifecycle = (proof, shot) => {
    const rows = proof.turns, arrival = rows.findIndex(row => row.phase === 'beforeTurn' && row.state.projectiles.some(value => value.id === shot.id && value.phase === 'arrived'))
    assert.ok(arrival >= 0, 'Actual arrived visit must be observed')
    const before = rows[arrival].state, after = rows[arrival + 1]
    assert.equal(after?.phase, 'afterTurn'); assert.equal(after.state.turn, before.turn + 1)
    assert.ok(!after.state.projectiles.some(value => value.id === shot.id))
    const emitted = after.state.effects.filter(effect => !before.effects.some(old => old.id === effect.id))
    for (const kind of ['blast', 'blastWave']) assert.equal(emitted.filter(effect => effect.kind === kind).length, 1, `One actual ${kind} impact allocation required`)
    return { arrivedTurn: before.turn, retiredTurn: after.state.turn, emitted }
  }
  const findGround = kind => page.evaluate(kind => {
    const q = window.controlQA, scene = window.testSceneRef.current, w = scene.world, actor = w.units.find(unit => unit.id === q.actorId)
    const candidates = kind === 'stage'
      ? [[-99, -101], [-98.5, -101], [-99.5, -101], [-99, -100.5], [-99, -101.5]]
      : [8, 10, 12, 16, 24, 32, 48].flatMap(radius => Array.from({ length: 8 }, (_, i) => [actor.x + Math.cos(i * Math.PI / 4) * radius, actor.z + Math.sin(i * Math.PI / 4) * radius]))
    const rect = scene.container.getBoundingClientRect(), probe = structuredClone(w)
    const move = kind === 'stage' ? q.createMoveContextProbe(w) : null
    for (const [x, z] of candidates) {
      const projected = scene.screen({ x, z }), event = { clientX: Math.round(rect.left + (projected.x + 1) * rect.width / 2), clientY: Math.round(rect.top + (1 - projected.y) * rect.height / 2) }
      if (document.elementFromPoint(event.clientX, event.clientY) !== scene.renderer.domElement || scene.picking.pick(event) !== null || scene.picking.pickPerson(event) !== null) continue
      const point = scene.pick(event)
      if (!point || Math.hypot(point.x - x, point.z - z) >= 0.75) continue
      const error = q.spellTargetError(probe, 'blast', point)
      if (kind === 'stage' ? !q.isOrdinaryMoveContext(move(point)) : kind === 'far' ? error?.code !== -2 : error !== null) continue
      if (kind === 'near' && [...w.units, ...w.buildings, ...w.trees].some(object => Math.hypot(object.x - point.x, object.z - point.z) < 6)) continue
      return { x: event.clientX, y: event.clientY, point: { x: point.x, z: point.z }, kind, targetError: error, turn: w.turn, candidates: candidates.length }
    }
    return null
  }, kind)
  let targetId, ground, primaryError
  try {
    await openMission(2)
    report.readiness = await waitForShamanReadiness(page)
    await page.evaluate(async () => {
      const evidence = await import('/qa/blast-ordinary/controls-evidence.mjs'), observer = await import('/qa/blast-ordinary/controls-observer.mjs')
      const input = await import('/qa/erosion-ordinary/input.mjs'), preparation = await import('/qa/blast-ordinary/preparation.mjs')
      const { currentPersonOrder } = await import('/app/person-orders.ts'), { spellTargetError } = await import('/app/model.ts')
      const scene = window.testSceneRef.current, world = scene.world
      const actor = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0 && !unit.ghost)
      if (!actor || world.shots.blast !== 4 || world.stats.cast !== 0) throw Error('Untouched ordinary Mission 2 start required')
      window.controlQA = { ...evidence, ...observer, ...input, ...preparation, currentPersonOrder, spellTargetError, actorId: actor.id,
        original: { scene, world, actor, braves: world.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 && unit.inside === null && !unit.ghost) } }
    })
    report.start = await snap(); healthy(report.start)
    await input('select-and-focus-shaman', async () => {
      await page.keyboard.press('Escape'); await page.getByLabel('followers', { exact: true }).click()
      await button('Select and focus shaman').click()
    })
    await settle()
    await input('select-one-original-brave', async () => { await page.keyboard.press('Escape'); await button('Select brave').click() })
    targetId = await page.evaluate(() => {
      const q = window.controlQA, w = q.original.world, target = w.units.find(unit => unit.id === w.selected[0])
      if (w.selected.length !== 1 || !q.original.braves.includes(target)) throw Error('One original outdoor Brave must be selected by HUD')
      q.original.target = target; return target.id
    })
    const stage = await findGround('stage'); assert.ok(stage, 'No ordinary staging ground in the fixed five-point envelope')
    const staged = await collect('public-Brave-staging', () => input('stage-Brave', () => page.mouse.click(stage.x, stage.y)))
    const deliveredStage = pointerUp(staged)[0]
    assert.ok(deliveredStage?.trusted && deliveredStage.canvasOwned)
    report.staging = await page.evaluate(() => {
      const q = window.controlQA, o = q.original, person = o.target.native ?? o.target.entry?.person
      o.stagePerson = person
      const order = q.currentPersonOrder(o.world.buildingOrders, person)
      return { targetId: o.target.id, order: order && { model: order.model, a: order.a & 65535, b: order.b & 65535 }, actor: { x: o.actor.x, z: o.actor.z } }
    })
    assert.equal(report.staging.order?.model, 3)
    assert.equal(report.staging.order.a, Math.round((stage.point.x + 8) * 256) & 65535)
    assert.equal(report.staging.order.b, Math.round((-stage.point.z - 8) * 256) & 65535)
    let previous
    await poll(async () => {
      const observed = await page.evaluate(point => {
        const q = window.controlQA, result = q.bindStagedBlastTarget(q.original, point, q.currentPersonOrder)
        return { ...result, hp: q.original.actor.hp }
      }, stage.point)
      assert.ok(observed.hp > 0 && observed.turn < limits.maximumSetupTurn, 'Staging identity/turn bound failed')
      const stable = observed.ready && observed.speed === 0 && previous && observed.turn > previous.turn && JSON.stringify(observed.position) === JSON.stringify(previous.position)
      previous = observed; return stable
    }, Math.max(1, limits.setupMs - (Date.now() - started)), 'same Brave becoming stationary')
    report.staged = previous
    await input('pause-Blast-charging', async () => {
      await page.keyboard.press('Escape'); await page.keyboard.press('1'); await page.keyboard.press('Escape')
      await button('Blast, 4 shots').click({ button: 'right' })
    })
    let state = await snap(); assert.equal(state.charging, false); assert.equal(state.disabled & 2, 2); assert.equal(state.stock, 4)
    const cancel = await collect('cancel-and-key-repeat', () => input('cancel-and-key-repeat', async () => {
      await page.keyboard.press('1'); await page.keyboard.press('Escape')
      await page.keyboard.press('1'); await page.mouse.click(stage.x, stage.y, { button: 'right' })
      await page.keyboard.press('1'); await page.keyboard.press('1')
    }))
    assertCancellationSequence(cancel.events)
    state = await snap(); assert.equal(state.mode, null); assert.deepEqual(state.selected, []); assert.equal(state.stock, 4)
    report.checks.push({ name: 'cancel-and-key-repeat', status: 'passed' })
    ground = await findGround('near'); const far = await findGround('far')
    assert.ok(ground && far, 'Fixed ground search must find both a clear in-range point and visible out-of-range point')
    report.ground = { near: ground, far }
    await input('arm-range-rejection', () => page.keyboard.press('1'))
    const rejected = await collect('out-of-range', () => input('out-of-range', () => page.mouse.click(far.x, far.y)))
    const rejection = up(rejected)[0]; assert.ok(rejection?.canvasOwned); assertNoCast(rejection)
    assert.equal(rejection.after.mode, 'blast'); assert.equal(rejection.after.message, 'Beyond your reach. Move your shaman closer.')
    assert.ok(pointerUp(rejected)[0].picks.some(pick => pick.name === 'pick' && pick.owner === 'scene' && pick.point))
    await page.locator('.world-message').filter({ hasText: rejection.after.message }).waitFor()
    await page.screenshot({ path: resolve(output, 'out-of-range.png') })
    report.checks.push({ name: 'out-of-range', status: 'passed' })
    const groundStart = await snap()
    const groundProof = await collect('empty-ground-and-repeated-click', async () => {
      await input('ground-double-click', () => page.mouse.dblclick(ground.x, ground.y))
      await finishCast(groundStart.turn, ground.point)
    })
    const groundEvents = up(groundProof); assert.equal(groundEvents.length, 2)
    const groundShot = assertCast(groundEvents[0], pointerUp(groundProof)[0])
    assertNoCast(groundEvents[1]); assert.equal(groundEvents[1].before.mode, null)
    assert.deepEqual(groundEvents[1].after.selected, []); assert.equal(groundEvents[1].after.lastOrderTurn, groundEvents[1].before.lastOrderTurn)
    report.checks.push({ name: 'empty-ground-and-repeated-click', status: 'passed', lifecycle: lifecycle(groundProof, groundShot) })

    await input('arm-person-save-cast', () => page.keyboard.press('1'))
    const hit = await page.evaluate(() => {
      const q = window.controlQA, scene = window.testSceneRef.current, target = q.original.target, rect = scene.container.getBoundingClientRect()
      if (scene.world.units.find(unit => unit.id === target.id) !== target || q.spellTargetError(structuredClone(scene.world), 'blast', target)) throw Error('Original staged target is not castable')
      const box = scene.picking.personBounds(target.id), points = []
      if (box) for (const fy of [0.5, 0.35, 0.65]) for (const fx of [0.5, 0.35, 0.65])
        points.push({ x: rect.left + box.x + box.width * fx, y: rect.top + box.y + box.height * fy })
      return q.findEntityInput(points, target.id, point => q.inspectEntityPoint(scene, 'units', point))
    })
    assert.ok(hit, 'No prospective owned person pixel for active-save control')
    await input('position-person-pointer', () => page.mouse.move(hit.x, hit.y))
    const active = await collect('person-release-and-public-pause', () => input('person-release-then-Space', async () => {
      // No read, screenshot, menu navigation or injected pause between these inputs.
      await page.mouse.down(); await page.mouse.up(); await page.keyboard.press('Space')
    }), targetId)
    const release = up(active)[0], shot = assertCast(release, pointerUp(active)[0], { targetId })
    const pause = active.events.find(event => event.code === 'Space')
    assertActivePause(release, pause, shot.id, targetId)
    const paused = await snap(); assertFrozen(pause.after, paused)
    await page.waitForTimeout(1200); assertFrozen(paused, await snap())
    await input('open-paused-settings', () => button('Game settings').click())
    const menu = page.locator('dialog.game-dialog'); await menu.waitFor({ state: 'visible' })
    assertFrozen(paused, await snap())
    const saved = await page.evaluate(targetId => window.controlQA.activeCheckpointProjection(window.testSceneRef.current.world, targetId), targetId)
    assert.ok(saved.projectiles.some(value => value.id === shot.id && ['windup', 'flying'].includes(value.phase)))
    report.saved = saved; save()
    await input('Save checkpoint', () => menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click())
    await waitForSavedCheckpoint(page, saved.turn, signal); await checkStop()
    const committed = await page.evaluate(targetId => window.controlQA.readActiveCheckpoint(targetId), targetId)
    assert.deepEqual(committed, saved, 'Committed active cast must equal the paused save')
    report.committed = await observeCheckpoint('Active Blast save committed')
    await page.screenshot({ path: resolve(output, 'active-cast-saved-settings.png') })
    await page.reload({ waitUntil: 'domcontentloaded' })
    const selector = page.getByRole('dialog', { name: 'Start game', exact: true }); await selector.waitFor()
    await page.evaluate(async targetId => {
      const { activeCheckpointProjection, controlSnapshot } = await import('/qa/blast-ordinary/controls-evidence.mjs')
      const { readActiveCheckpoint } = await import('/qa/blast-ordinary/controls-observer.mjs')
      const { spellTargetError } = await import('/app/model.ts')
      window.controlQA = { activeCheckpointProjection, controlSnapshot, readActiveCheckpoint, spellTargetError }
      const main = document.querySelector('main')
      let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
      for (; fiber && !store; fiber = fiber.return)
        for (let hook = fiber.memoizedState; hook; hook = hook.next)
          if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
      if (!store) throw Error('Store unavailable before public Load')
      const before = store.getWorld()
      window.controlsLoadedBoundary = null; window.controlsLoadError = null
      const unsubscribe = store.subscribe(() => {
        const world = store.getWorld()
        if (world === before) return
        try { window.controlsLoadedBoundary = activeCheckpointProjection(world, targetId) }
        catch (error) { window.controlsLoadError = String(error) }
        finally { unsubscribe() }
      })
    }, targetId)
    await input('Load Game', () => selector.getByRole('button', { name: 'Load Game', exact: true }).click())
    const loaded = await page.evaluate(() => ({ boundary: window.controlsLoadedBoundary, error: window.controlsLoadError }))
    report.loaded = loaded.boundary
    report.loadObservationError = loaded.error
    save()
    assert.equal(loaded.error, null); assert.deepEqual(loaded.boundary, saved, 'Synchronous public Load boundary must preserve the genuine active cast')
    await bindGame(page)
    state = await snap(); healthy(state); assert.equal(state.paused, false)
    await finishCast(saved.turn, ground.point)
    state = await snap(); assert.ok(state.turn > saved.turn); assert.equal(state.castCount, saved.castCount); assert.equal(state.stock, 2)
    assert.deepEqual(await page.evaluate(targetId => window.controlQA.readActiveCheckpoint(targetId), targetId), committed, 'Load must not rewrite the checkpoint')
    report.checks.push({ name: 'public-pause-active-save-fresh-page-Load', status: 'passed', resumed: state })
    // Rebind only observation helpers in this new document; never reuse old World references.
    await page.evaluate(async () => {
      Object.assign(window.controlQA, await import('/qa/blast-ordinary/controls-observer.mjs'), await import('/qa/erosion-ordinary/input.mjs'))
      window.controlQA.actorId = window.testSceneRef.current.world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman' && !unit.ghost)?.id
    })
    ground = await findGround('near'); assert.ok(ground, 'Freshly loaded camera needs a new verified ground pixel')
    report.loadedGround = ground
    for (const stock of [2, 1]) {
      await input(`arm-remaining-stock-${stock}`, () => page.keyboard.press('1'))
      const before = await snap(); assert.equal(before.stock, stock)
      const proof = await collect(`consume-stock-${stock}`, async () => {
        await input(`cast-remaining-stock-${stock}`, () => page.mouse.click(ground.x, ground.y))
        await finishCast(before.turn, ground.point)
      })
      const consumed = assertCast(up(proof)[0], pointerUp(proof)[0]); lifecycle(proof, consumed)
    }
    ground = await findGround('near'); assert.ok(ground, 'Zero-stock rejection needs a fresh valid in-range ground point')
    report.noStockGround = ground
    await button('Blast, 0 shots').waitFor()
    await input('arm-zero-stock', () => page.keyboard.press('1'))
    const empty = await collect('no-stock', () => input('no-stock-click', () => page.mouse.click(ground.x, ground.y)))
    const noStock = up(empty)[0]; assertNoCast(noStock); assert.equal(noStock.after.stock, 0)
    assert.ok(noStock.canvasOwned)
    const noStockTerrain = pointerUp(empty)[0].picks.find(pick => pick.name === 'pick' && pick.owner === 'scene' && pick.point)?.point
    assert.ok(noStockTerrain && Math.hypot(noStockTerrain.x - ground.point.x, noStockTerrain.z - ground.point.z) < 0.75, 'No-stock input must reach the freshly validated ground point')
    assert.equal(noStock.after.mode, 'blast')
    assert.equal(noStock.after.message, 'Blast is charging. Braves working or inside huts generate more mana.')
    await page.locator('.world-message').filter({ hasText: noStock.after.message }).waitFor()
    await page.screenshot({ path: resolve(output, 'no-stock.png') })
    report.checks.push({ name: 'ordinary-stock-exhaustion-and-rejection', status: 'passed' })
    await input('Pause game', () => button('Pause game').click())
    const held = await snap(); await page.waitForTimeout(1000); assertFrozen(held, await snap())
    await input('Resume game', () => button('Resume game').click())
    await poll(async () => { const state = await snap(); return !state.paused && state.turn > held.turn }, 10000, 'public pause-button resume')
    report.checks.push({ name: 'pause-button-hold-and-resume', status: 'passed' })
    report.final = await snap(); assert.equal(report.final.charging, false); assert.equal(report.final.stock, 0)
    assert.deepEqual(receipt.errors, [])
  } catch (error) { primaryError = error }
  finally {
    report.status = primaryError ? 'failed' : 'passed'; report.failure = primaryError?.stack
    save()
  }
  if (primaryError) throw primaryError
  return { stage: 'ordinary-Blast-remaining-controls', status: report.status, evidence: resolve(output, 'controls.json'),
    remainingAcceptance: ['independent review', 'separate moving-target pair and paired-frame review', 'final combined-tree gates'] }
}
