import assert from 'node:assert/strict'

// Hold an immutable serialized string, never a live World object or a narrowed
// selection of fields. The same full serialization is compared at each caller's
// original observation point; successful reads do not transfer the whole World.
export async function capturePauseWorld(page) {
  return page.evaluateHandle(() => JSON.stringify(window.testStore.getWorld()))
}

export async function assertPauseWorldUnchanged(page, snapshot) {
  const result = await page.evaluate(expected => {
    const actual = JSON.stringify(window.testStore.getWorld())
    return actual === expected ? true : { actual, expected }
  }, snapshot)
  if (result !== true) {
    // Both strings came from that same evaluation. Do not re-read a changing
    // World on failure, and preserve assert.equal's complete mismatch payload.
    assert.equal(result.actual, result.expected)
  }
}

export async function disposePauseWorld(snapshot, ...primaryErrors) {
  try { await snapshot.dispose() }
  catch (error) {
    if (!primaryErrors.length) throw error
    // Even throw undefined/null or a frozen Error must remain the primary
    // failure. Best-effort annotation cannot replace it with a TypeError.
    try { primaryErrors[0].worldSnapshotDisposeError = String(error) } catch {}
  }
}
