// No game/runtime imports, stepping or input. Pick observations are supplied by the caller.
const gates = ['response', 'live', 'stationary', 'range', 'camera', 'body', 'pixel', 'phenotype']
const pixelCounts = ['canvasOwned', 'outsideCanvas', 'targetHit', 'nullHit', 'otherHit']

export function createBlastPreparation({ targetId, capacity = 96, maximumSetupTurn = 1800, minimumDistance = 7 }) {
  if (!Number.isInteger(targetId) || targetId < 1) throw Error('Preparation targetId must be a positive integer')
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 96) throw Error('Preparation capacity must be 1..96')
  if (!Number.isInteger(maximumSetupTurn) || maximumSetupTurn < 1 || maximumSetupTurn > 1800) throw Error('Preparation maximumSetupTurn must be 1..1800')
  if (![0, 7].includes(minimumDistance)) throw Error('Declared baseline0 or candidate7 distance required')
  const rows = [], firstFailures = Object.fromEntries(gates.map(gate => [gate, null]))
  const inspectionTotals = { reads: 0, total: 0, ...Object.fromEntries(pixelCounts.map(key => [key, 0])), sampleCount: 0 }
  let total = 0, dropped = 0, firstLiveResponse = null, lastLiveResponse = null
  let firstInRangeResponse = null, firstPixelMiss = null, firstTerminal = null, stopReason = null

  const terminalReason = (row, response) => {
    const body = row.renderedBody
    if (typeof body?.hp === 'number' && body.hp <= 0) return 'target-dead'
    if (body?.originalTargetPresent === false) return 'target-removed'
    if (body?.sameIdIsOriginal === false || body?.targetId != null && body.targetId !== targetId) return 'target-replaced'
    if (body?.activeNative && body.activeNative.flags2 & 1) return 'target-removed'
    if (firstLiveResponse && body?.inside !== null && body?.inside !== undefined) return 'target-housed'
    if (firstLiveResponse && !response) return 'response-ended'
    if (row.turn >= maximumSetupTurn) return 'setup-turn-limit'
    return null
  }
  const read = () => structuredClone({ version: 1, targetId, capacity, maximumSetupTurn, minimumDistance, total, dropped, rows,
    firstLiveResponse, lastLiveResponse, firstInRangeResponse, firstPixelMiss,
    firstFailures, inspectionTotals, firstTerminal, stopReason })

  return {
    read,
    observe(observation) {
      // A stopped diagnostic cannot be rearmed by later replacement/recovery rows.
      if (stopReason) return { stopReason }
      if (!observation || typeof observation !== 'object' || Array.isArray(observation)) throw Error('Preparation observation must be a copied row')
      const row = structuredClone(observation)
      if (!Number.isInteger(row.turn) || row.turn < 0) throw Error('Actual preparation turn required')
      const response = row.response?.find(person => person.id === targetId && [3, null].includes(person.orderModel))
      const state = row.state, body = row.renderedBody
      stopReason = terminalReason(row, response)
      const qualified = {
        response: !!response,
        live: row.live === true,
        stationary: row.stationary === true,
        range: !!response && Number.isFinite(row.distance) && row.distance >= minimumDistance && row.targetError === null,
        camera: state?.cameraSettled === true && !state.inputMask,
        body: body?.visible === true && body.pickable === true && body.visibleLayer === true && body.layerHasPainterSource === true,
        pixel: row.preparationKind === 'proposed-pixel' ? !!row.nextHit : !!row.existingHit,
        phenotype: row.phenotype === true,
      }
      total++; rows.push(row)
      if (rows.length > capacity) { rows.shift(); dropped++ }
      for (const gate of gates) if (!qualified[gate] && !firstFailures[gate]) firstFailures[gate] = row
      if (row.inspection) {
        inspectionTotals.reads++
        for (const key of pixelCounts) {
          const value = row.inspection[key]
          if (Number.isSafeInteger(value) && value >= 0) inspectionTotals[key] += value
        }
        inspectionTotals.total = inspectionTotals.canvasOwned + inspectionTotals.outsideCanvas
        inspectionTotals.sampleCount += row.inspection.samples?.length ?? 0
      }
      if (stopReason) firstTerminal = row
      else if (response) {
        firstLiveResponse ??= row
        lastLiveResponse = row
        if (qualified.range) firstInRangeResponse ??= row
        if (qualified.live && qualified.stationary && qualified.range && qualified.camera && row.pixelSearchAttempted !== false && !row.existingHit && !row.nextHit)
          firstPixelMiss ??= row
      }
      // The full copied tail is available on read(), outside the release window.
      return { stopReason }
    },
  }
}


// Baseline reuses only the first tested pixel of each former5x5 candidate.
// This preserves the nine-point search envelope without claiming prior hover.
export function findProposedBlastPixel(candidates, targetId, inspect) {
  if (candidates.length > 9) throw Error('At most nine baseline pixel candidates')
  const visited = new Set()
  for (const candidate of candidates) {
    const x = Math.round(candidate.x) - 2, y = Math.round(candidate.y) - 2, key = `${x},${y}`
    if (!Number.isFinite(x) || !Number.isFinite(y) || visited.has(key)) continue
    visited.add(key)
    const actual = inspect({ x, y })
    if (actual.canvasOwned && actual.hitId === targetId) return { x, y, kind: 'proposed-pixel' }
  }
  return null
}

// One ordinary held-left gesture. Preparation uses read-only observations; only
// its caller may admit the final release. Failed preparation cancels twice before
// mouse-up, and proves the cleanup neither casts nor orders selected followers.
export async function releaseHeldBlast({ press, prepare, release, cancel, read, retain }) {
  let released = false
  try {
    await press()
    const prepared = await prepare()
    await release(prepared)
    released = true
    return prepared
  } catch (error) {
    if (!released) {
      const cleanup = { before: await read() }
      retain(cleanup)
      try {
        await cancel(); await cancel()
        cleanup.cancelled = await read(); retain(cleanup)
        if (cleanup.cancelled.mode !== null || cleanup.cancelled.selected.length)
          throw Error('Held release cleanup requires cleared mode and selection')
        await release(null)
        cleanup.after = await read(); retain(cleanup)
        if (cleanup.after.mode !== null || cleanup.after.selected.length || cleanup.after.buttons !== 0 ||
            cleanup.after.castCount !== cleanup.before.castCount || cleanup.after.lastOrderTurn !== cleanup.before.lastOrderTurn)
          throw Error('Held release cleanup changed cast or order state')
      } catch (cleanupError) { throw new AggregateError([error, cleanupError], 'Held Blast preparation and cleanup failed') }
    }
    throw error
  }
}

// Bind the actual registered person after the public staging order completes.
// The binding is QA metadata; neither the World nor person/order records change.
export function bindStagedBlastTarget(original, point, currentOrder) {
  const { scene, world, target, stagePerson } = original
  const person = target?.native ?? target?.entry?.person
  if (scene.world !== world || world.units.find(unit => unit.id === target?.id) !== target ||
      target.team !== 'blue' || target.kind !== 'brave' || target.hp <= 0 || target.inside !== null ||
      !person || person !== stagePerson || person.class !== 1 || person.flags2 & 1 || world.objectCells.objects.get(target.id) !== person)
    throw Error('Original staged person identity or registered owner changed')
  const order = currentOrder(world.buildingOrders, person)
  const ready = (!order || !!(order.flags & 1)) && Math.hypot(target.x - point.x, target.z - point.z) <= 2
  const observation = { ready, turn: world.turn, targetId: target.id, x: target.x, z: target.z,
    position: { x: person.x, y: person.y, h: person.h }, state: person.state, speed: person.speed,
    order: order ? { model: order.model, flags: order.flags, a: order.a, b: order.b } : null }
  if (ready) original.movePerson = person
  return observation
}

export function stationaryBlastTarget(person, previousTurn, previousPosition, turn, actorFighting = false) {
  return !!(person && previousPosition && turn > previousTurn && person.idle && !person.fighting && !actorFighting &&
    person.position.x === previousPosition.x && person.position.y === previousPosition.y)
}

// One read-only notification of the actual accepted release. No event or clock
// is scheduled. Every subscriber gets a detached value; cancellation settles it.
export function createBlastAdmission() {
  let resolve, reject, settled = false
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  void promise.catch(() => {})
  return {
    accept(value) {
      if (settled) throw Error('Movement admission already settled')
      const copy = structuredClone(value)
      settled = true; resolve(copy)
    },
    fail(error) { if (!settled) { settled = true; reject(error) } },
    wait: () => promise.then(value => structuredClone(value)),
  }
}

export function waitForBlastAdmission(promise, signal, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    let timer
    const done = fn => value => { clearTimeout(timer); signal.removeEventListener('abort', abort); fn(value) }
    const abort = () => done(reject)(signal.reason ?? Error('Movement admission aborted'))
    signal.addEventListener('abort', abort, { once: true })
    timer = setTimeout(() => done(reject)(Error('Movement admission timed out')), timeoutMs)
    promise.then(done(resolve), done(reject))
    if (signal.aborted) { signal.removeEventListener('abort', abort); abort() }
  })
}

// Called only after the normal mouse-up promise completes. The one predeclared
// public move does not wait for admission transport; validation follows it.
export async function sendPlannedBlastMove({ admission, signal, move }) {
  signal.throwIfAborted()
  await move()
  const result = await admission
  if (result.error) throw result.error
  return result.value
}
