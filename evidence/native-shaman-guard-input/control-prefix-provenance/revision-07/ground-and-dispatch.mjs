// Source-reviewed adapter boundary: read/clone/pick only; delivered input is Playwright.
import assert from 'node:assert/strict'
import { acceptedInputBoundary } from './input-boundary.mjs'
export const movePointSets = Object.freeze({
  firewarrior: Object.freeze([{x:29,z:-11},{x:31,z:-11},{x:33,z:-9}].map(Object.freeze)),
  shaman: Object.freeze([{x:25,z:-1},{x:27,z:-1},{x:29,z:-1}].map(Object.freeze)),
})
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
      if (valid) window.campaignEntityPointer = observeEntityPointer(scene, document, null, window.nativeGuardReadInput)
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
    let entityPrepared = false, inputError = null, delivery = null
    try {
      if (hit.id) await ordinary.prepareEntityClick(hit, before)
      else await prepareGround(hit, before)
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
  const groundHit = point => page.evaluate(point => {
    const scene = window.testSceneRef.current, rect = scene.container.getBoundingClientRect()
    const projected = scene.screen(point), x = rect.x + (projected.x + 1) * rect.width / 2,
      y = rect.y + (1 - projected.y) * rect.height / 2
    const candidates = []
    // Preserve the original order, including the four radius0 duplicates.
    for (let r = 0; r <= 8; r += 2) for (const [dx, dy] of [[r,0],[-r,0],[0,r],[0,-r]]) candidates.push({ x: x + dx, y: y + dy })
    const diagnostics = { requested:point,turn:scene.world.turn,selected:[...scene.world.selected],
      camera:{position:{...scene.cameraPosition},bearing:scene.cameraBearing,motionActive:scene.cameraMotion.active},
      rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},projected:{x,y,finite:Number.isFinite(x)&&Number.isFinite(y)},
      candidateSequence:candidates,roundedCandidateSequence:candidates.map(p=>({x:Math.round(p.x),y:Math.round(p.y)})),
      counts:{inspect:0,groundPick:0,objectPick:0},reasons:{},examples:{},visitedPixels:[],
      cacheScope:'Accepted findEntityInput memoizes pixels. Only its actual inspect callbacks and existing picker calls are recorded; no diagnostic re-picks.' }
    const cache = () => ({lastKey:scene.picking.lastKey??null,lastId:scene.picking.lastId??null,lastKind:scene.picking.lastKind??null})
    const inspect = p => {
      diagnostics.counts.inspect++
      const canvasOwned = document.elementFromPoint(p.x, p.y) === scene.renderer.domElement
      const event = { clientX: p.x, clientY: p.y }, beforeCache=cache()
      let ground=null,pickedId=null
      if(canvasOwned){diagnostics.counts.groundPick++;ground=scene.pick(event)}
      if(ground){diagnostics.counts.objectPick++;pickedId=scene.picking.pick(event)}
      const distance=ground?Math.hypot(ground.x-point.x,ground.z-point.z):null
      const reason=!canvasOwned?'not-canvas-owned':!ground?'no-ground-pick':pickedId!==null?'competing-object':!(distance<=1.5)?'outside-target-radius':'accepted-ground-pixel'
      diagnostics.reasons[reason]=(diagnostics.reasons[reason]??0)+1
      diagnostics.visitedPixels.push({x:p.x,y:p.y,reason})
      const examples=diagnostics.examples[reason]??=[]
      if(examples.length<3)examples.push({pixel:{x:p.x,y:p.y},canvasOwned,ground:ground?{x:ground.x,z:ground.z}:null,
        pickedId:pickedId===undefined?'undefined':pickedId,distance,beforeCache,afterCache:cache()})
      return { canvasOwned, hitId: reason==='accepted-ground-pixel'?0:null }
    }
    const hit = window.nativeGuardProbes.findEntityInput(candidates, 0, inspect)
    diagnostics.uniqueVisitedPixels=new Set(diagnostics.visitedPixels.map(p=>p.x+','+p.y)).size
    diagnostics.repeatedInspectCoordinates=diagnostics.counts.inspect-diagnostics.uniqueVisitedPixels
    if (!hit) return {hit:null,diagnostics:{...diagnostics,decision:'no-integer-5x5-interior'}}
    diagnostics.counts.groundPick++
    const picked = scene.pick({ clientX: hit.x, clientY: hit.y })
    if(!picked)return {hit:null,diagnostics:{...diagnostics,decision:'center-ground-disappeared',interior:hit,centerPick:null}}
    const context = window.nativeGuardProbes.createMoveContextProbe(scene.world)({ x: picked.x, z: picked.z })
    const decision=context.model!==3?'context-model-not-3':!context.enabled?'context-disabled':'accepted-model3-interior'
    return {hit:decision==='accepted-model3-interior'?{...hit,point:{x:picked.x,z:picked.z},context}:null,
      diagnostics:{...diagnostics,decision,interior:hit,centerPick:{x:picked.x,z:picked.z},context}}
  }, point)
  const move = async name => {
    assert.ok(Object.hasOwn(movePointSets,name),'Only the prospectively fixed move point sets are allowed')
    const points=movePointSets[name]
    await ordinary.map(points[0])
    for(const [index,point] of points.entries()) {
      signal.throwIfAborted()
      const probe=await groundHit(point)
      log({action:'ordinary-ground-target',pointSet:name,index,requested:point,...probe})
      // Once dispatched, any input/acceptance failure propagates. No later point
      // is attempted as a repair to an unaccepted or rejected command.
      if(probe.hit) {
        const result=await clickOrder(probe.hit)
        log({action:'ordinary-ground-move-accepted',pointSet:name,index,requested:point,actualPoint:probe.hit.point,
          pixel:{x:probe.hit.x,y:probe.hit.y},acceptance:result.acceptance,beforeTurn:result.before.turn,afterTurn:result.after.turn})
        return result
      }
    }
    assert.fail('No enabled model3 integer interior in the three same-view source-defined point probes')
  }
  return { clickOrder, move }
}
