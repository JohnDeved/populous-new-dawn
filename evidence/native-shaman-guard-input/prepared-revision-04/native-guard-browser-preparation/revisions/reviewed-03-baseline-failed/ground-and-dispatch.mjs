// Source-reviewed adapter boundary: read/clone/pick only; delivered input is Playwright.
import assert from 'node:assert/strict'
import { acceptedOrderEvidence } from './accepted-input.mjs'
export function createOrderDispatch({ page, read, log, pollUI, health, ordinary, signal }) {
  const requireOrderable = state => {
    health(state); assert.equal(state.paused, false); assert.equal(state.mode, null)
    assert.ok(state.selected.length, 'Ordinary order requires an exact selected group')
  }
  const prepareGround = async (hit, before) => {
    const context = await page.evaluate(({ hit }) => {
      const scene = window.testSceneRef.current
      return window.nativeGuardProbes.createMoveContextProbe(scene.world)({ ...hit.point })
    }, { hit })
    assert.equal(context.model, 3); assert.equal(context.enabled, true)
    const fresh = await page.evaluate(({ hit, selected }) => {
      const scene = window.testSceneRef.current, w = scene.world
      const { findEntityInput, observeEntityPointer } = window.nativeGuardProbes
      const inspect = point => {
        const canvasOwned = document.elementFromPoint(point.x, point.y) === scene.renderer.domElement
        const event = { clientX: point.x, clientY: point.y }
        return { canvasOwned, hitId: canvasOwned && scene.picking.pick(event) === null && scene.pick(event) ? 0 : null }
      }
      const point = findEntityInput([hit], 0, inspect), picked = scene.pick({ clientX: hit.x, clientY: hit.y })
      const valid = Number.isInteger(hit.x) && Number.isInteger(hit.y) && !!point && !!picked &&
        Math.hypot(picked.x - hit.point.x, picked.z - hit.point.z) < 0.25 &&
        !w.paused && w.status === 'playing' && !w.inputMask && w.mode === null &&
        JSON.stringify(w.selected) === JSON.stringify(selected)
      if (window.campaignEntityPointer) throw Error('Pointer observer already active')
      if (valid) window.campaignEntityPointer = observeEntityPointer(scene, document, null)
      return { valid, point, picked, turn: w.turn, selected: [...w.selected] }
    }, { hit, selected: before.selected })
    log({ action: 'ground-immediate-revalidation', hit, context, fresh })
    assert.equal(fresh.valid, true, 'Ground pixel changed before delivery')
  }
  const clickOrder = async hit => {
    signal.throwIfAborted()
    let before = await read(); requireOrderable(before)
    // Separate this dispatch from a previous command on the same turn without
    // advancing the simulation ourselves. This makes lastOrderTurn a fresh witness.
    if (before.turn <= before.lastOrderTurn) {
      await pollUI(() => page.evaluate(() => {
        const w = window.testSceneRef.current.world
        return w.turn > w.lastOrderTurn
      }), 5000, 'fresh order dispatch turn')
      before = await read(); requireOrderable(before)
      }
    let entityPrepared = false, inputError = null
    try {
      if (hit.id) await ordinary.prepareEntityClick(hit, before)
      else await prepareGround(hit, before)
      entityPrepared = true
      log({ action: 'world-order-click', hit, selected: before.selected })
      await page.mouse.click(hit.x, hit.y)
    } catch (error) { inputError = error; throw error }
    finally {
      try { await ordinary.finishEntityClick(hit, entityPrepared && !inputError) }
      catch (error) {
        if (!inputError) throw error
        const diagnostic = { level: 10, kind: 'entity-input-diagnostic', hit, at: new Date().toISOString(),
          error: String(error?.stack ?? error), primaryError: String(inputError?.stack ?? inputError) }
        // Neither diagnostic assertion nor logging failure may replace the
        // original input/preparation error. Both observations remain retained.
        try { log({ action: 'entity-pointer-cleanup-error', ...diagnostic }) }
        finally { throw inputError }
      }
    }
    await page.mouse.move(400, 780)
    const after = await read()
    const commandState = state => ({ turn: state.turn, lastOrderTurn: state.lastOrderTurn,
      pointerAck: state.pointerAck, selected: state.selected, effects: state.effects,
      units: state.units.filter(u => before.selected.includes(u.id)), epoch: state.epoch })
    log({ action: 'world-order-observation', hit, before: commandState(before), after: commandState(after) })
    const acceptance = acceptedOrderEvidence(before, after, hit)
    log({ action: 'world-order-input-observed', hit, acceptance, selected: before.selected,
      orders: after.units.filter(u => before.selected.includes(u.id)).map(u => ({ id: u.id, order: u.order, work: u.work,
        attackBuildingId: u.attackBuildingId })) })
    return { before, after, acceptance }
  }
  const groundHit = point => page.evaluate(point => {
    const scene = window.testSceneRef.current, rect = scene.container.getBoundingClientRect()
    const projected = scene.screen(point), x = rect.x + (projected.x + 1) * rect.width / 2,
      y = rect.y + (1 - projected.y) * rect.height / 2
    const candidates = []
    for (let r = 0; r <= 8; r += 2) for (const [dx, dy] of [[r,0],[-r,0],[0,r],[0,-r]]) candidates.push({ x: x + dx, y: y + dy })
    const inspect = p => {
      const canvasOwned = document.elementFromPoint(p.x, p.y) === scene.renderer.domElement
      const event = { clientX: p.x, clientY: p.y }, ground = canvasOwned && scene.pick(event)
      return { canvasOwned, hitId: ground && scene.picking.pick(event) === null && Math.hypot(ground.x - point.x, ground.z - point.z) <= 1.5 ? 0 : null }
    }
    const hit = window.nativeGuardProbes.findEntityInput(candidates, 0, inspect)
    if (!hit) return null
    const picked = scene.pick({ clientX: hit.x, clientY: hit.y })
    const context = window.nativeGuardProbes.createMoveContextProbe(scene.world)({ x: picked.x, z: picked.z })
    return context.model === 3 && context.enabled ? { ...hit, point: { x: picked.x, z: picked.z }, context } : null
  }, point)
  const move = async point => {
    await ordinary.map(point)
    const hit = await groundHit(point)
    log({ action: 'ordinary-ground-target', requested: point, hit })
    assert.ok(hit, 'Visible integer interior ground with an enabled ordinary move context')
    return clickOrder(hit)
  }
  return { clickOrder, move }
}
