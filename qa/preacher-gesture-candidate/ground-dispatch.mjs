// Candidate adapter of accepted inherited dispatch: only prepareGround changes.
// The delivered event, recipient and acceptance checks below remain unchanged.
import assert from 'node:assert/strict'
import { acceptedInputBoundary } from '../preacher-gesture-baseline/inherited/input-boundary.mjs'
export function createOrderDispatch({ page, read, log, pollUI, health, ordinary, signal }) {
  const requireOrderable = state => {
    health(state); assert.equal(state.paused, false); assert.equal(state.mode, null)
    assert.ok(state.selected.length, 'Ordinary order requires an exact selected group')
  }
  const prepareGround = async (hit, before) => {
    const fresh = await page.evaluate(async ({ hit, selected }) => {
      const [{ nativePosition }, { restingCellCollision }] = await Promise.all([
        import('/app/model.ts'), import('/app/person-collision.ts')])
      const scene = window.testSceneRef.current, w = scene.world
      const { findEntityInput, observeEntityPointer, createMoveContextProbe } = window.nativeGuardProbes
      if (window.campaignEntityPointer) throw Error('Pointer observer already active')
      const contextAt = createMoveContextProbe(w)
      const collisionAt = point => {
        const native = nativePosition(w, point), cell = (native.y >> 9) * 128 + (native.x >> 9)
        return restingCellCollision({ flags: w.land.flags[cell], category: w.land.categories[cell] }, w.land.walkMasks[0], native)
      }
      const fresh = window.nativeGuardCandidateGround.findFreshGround({ scene, doc: document, hit, selected,
        findEntityInput, contextAt, collisionAt, currentScene: window.testSceneRef.current,
        currentWorld: window.testStore.getWorld() })
      if (fresh.hit) window.campaignEntityPointer = observeEntityPointer(scene, document, null, window.nativeGuardReadInput)
      return fresh
    }, { hit, selected: before.selected })
    log({ action: 'ground-immediate-revalidation', originalHit: hit, ...fresh })
    assert.ok(fresh.hit, 'No fresh legal 5x5 ground interior before delivery')
    return fresh.hit
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
    let entityPrepared = false, inputError = null, delivery = null
    try {
      if (hit.id) await ordinary.prepareEntityClick(hit, before)
      else hit = await prepareGround(hit, before)
      entityPrepared = true
      log({ action: 'world-order-click', hit, selected: before.selected })
      await page.mouse.click(hit.x, hit.y)
    } catch (error) { inputError = error; throw error }
    finally {
      try { delivery = await ordinary.finishEntityClick(hit, entityPrepared && !inputError) }
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
    const after = await read(); health(after)
    const commandState = state => ({ turn: state.turn, lastOrderTurn: state.lastOrderTurn,
      pointerAck: state.pointerAck, selected: state.selected, effects: state.effects,
      units: state.units.filter(u => before.selected.includes(u.id)), epoch: state.epoch })
    log({ action: 'world-order-observation', hit, before: commandState(before), after: commandState(after) })
    const boundary = acceptedInputBoundary(before, after, hit, delivery), { acceptance } = boundary
    log({ action: 'synchronous-input-boundary-accepted', hit, ...boundary })
    log({ action: 'world-order-input-observed', hit, acceptance, selected: before.selected,
      orders: after.units.filter(u => before.selected.includes(u.id)).map(u => ({ id: u.id, order: u.order, work: u.work,
        attackBuildingId: u.attackBuildingId })) })
    return { before, after, acceptance, inputBefore: boundary.inputBefore, inputAfter: boundary.inputAfter }
  }
  return { clickOrder }
}
