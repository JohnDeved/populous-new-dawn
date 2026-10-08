// Diagnostic copies only: no game/runtime imports, stepping, picking or input.
const gates = ['response', 'live', 'moving', 'range', 'camera', 'body', 'pixel', 'phenotype']
const pixelCounts = ['canvasOwned', 'outsideCanvas', 'targetHit', 'nullHit', 'otherHit']

export function createBlastPreparation({ targetId, capacity = 96, maximumSetupTurn = 1800 }) {
  if (!Number.isInteger(targetId) || targetId < 1) throw Error('Preparation targetId must be a positive integer')
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 96) throw Error('Preparation capacity must be 1..96')
  if (!Number.isInteger(maximumSetupTurn) || maximumSetupTurn < 1 || maximumSetupTurn > 1800) throw Error('Preparation maximumSetupTurn must be 1..1800')
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
  const read = () => structuredClone({ version: 1, targetId, capacity, maximumSetupTurn, total, dropped, rows,
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
      const response = row.response?.find(person => person.id === targetId && person.orderModel === 19)
      const state = row.state, body = row.renderedBody
      stopReason = terminalReason(row, response)
      const qualified = {
        response: !!response,
        live: row.live === true,
        moving: row.moving === true,
        range: !!response && Number.isFinite(row.distance) && row.distance >= 7 && row.targetError === null,
        camera: state?.cameraSettled === true && !state.inputMask,
        body: body?.visible === true && body.pickable === true && body.visibleLayer === true && body.layerHasPainterSource === true,
        pixel: !!row.existingHit,
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
        if (qualified.live && qualified.moving && qualified.range && qualified.camera && row.pixelSearchAttempted !== false && !row.existingHit && !row.nextHit)
          firstPixelMiss ??= row
      }
      // The full copied tail is available on read(), outside the release window.
      return { stopReason }
    },
  }
}
