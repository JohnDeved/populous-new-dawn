import assert from 'node:assert/strict'

export const queryWitnessOffsets = Object.freeze([[3, 0], [3, 3], [0, 3], [-3, 0], [0, -3], [0, 0]].map(Object.freeze))
export const queryWitnessLimits = Object.freeze({ rawBytes: 8 * 1024 * 1024, evidenceBytes: 1024 * 1024 })
const describe = error => { try { return String(error).slice(0, 2000) } catch { return '<unprintable failure>' } }

// One post-load ordinary-input observation, not a comparative report. The caller
// owns the whole-operation deadline, exclusive artifact quota, page and browser.
export async function captureSnapshotQueryWitnessCore({ expectedRevision, check, retain }, leaves) {
  const packet = { version: 1, role: 'single-arm-ordinary-query-witness-not-comparison',
    comparisonEligible: false, interpretationEligible: false, status: 'incomplete',
    expectedRevision, name: 'ordinary-hover', point: { x: 900, y: 400 }, blocks: [] }
  let failed = false, failure, observerAttempted = false
  const fail = error => { if (!failed) { failed = true; failure = error; packet.failure = describe(error) } }
  const step = async (fn, ...args) => { check(); const value = await fn(...args); check(); return value }
  const save = async () => {
    check()
    const text = JSON.stringify(packet)
    assert.ok(Buffer.byteLength(text) <= queryWitnessLimits.evidenceBytes, 'Query evidence byte cap exceeded')
    return step(retain, 'arm-query-witness.json', text)
  }
  try {
    assert.match(expectedRevision ?? '', /^[a-f0-9]{40}$/)
    packet.preparation = await step(leaves.prepare)
    packet.before = await step(leaves.observe)
    packet.readers = await step(leaves.installGeometry)
    observerAttempted = true
    await step(leaves.installObserver)
    for (const [index, [dx, dy]] of queryWitnessOffsets.entries()) {
      const geometryBefore = await step(leaves.boundary)
      const x = packet.point.x + dx, y = packet.point.y + dy
      await step(leaves.arm, { geometryWitness: geometryBefore.witness, type: 'pointermove', x, y, buttons: 0 })
      await step(leaves.move, x, y)
      await step(leaves.waitFour)
      const block = await step(leaves.finishFour)
      const geometryAfter = await step(leaves.boundary)
      packet.blocks.push({ preparation: null, geometryBefore, geometryAfter, ...block })
      assert.equal(block.event.sequence, index + 1)
    }
    packet.after = await step(leaves.observe)
  } catch (error) { fail(error) }
  finally {
    try {
      const cleanup = await leaves.cleanup(observerAttempted)
      packet.observer = cleanup.observer
      packet.observerCleanupConfirmed = cleanup.confirmed === true
      assert.equal(packet.observerCleanupConfirmed, true, 'Query observer cleanup unconfirmed')
    } catch (error) { packet.observerCleanupConfirmed = false; packet.cleanupFailure = describe(error); fail(error) }
  }
  if (!failed) {
    try {
      // Exactly one public export. Raw evidence survives a later validator refusal.
      const raw = await step(leaves.exportRaw, queryWitnessLimits.rawBytes)
      assert.equal(typeof raw, 'string')
      assert.ok(Buffer.byteLength(raw) <= queryWitnessLimits.rawBytes, 'Query raw byte cap exceeded')
      packet.raw = await step(retain, 'arm-query-frames.json', raw)
      packet.summary = await step(leaves.summarize, raw, packet)
      packet.status = 'observed-unqualified'
    } catch (error) { fail(error) }
  }
  if (failed) packet.status = 'failed'
  try { await save() } catch (error) { fail(error) }
  if (failed) throw failure
  return packet
}
