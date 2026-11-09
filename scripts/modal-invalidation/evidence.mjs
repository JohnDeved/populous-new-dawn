import assert from 'node:assert/strict'

// This consumes real browser observations. It never drives rendering or simulation.
export function validateModalInvalidationEvidence(e) {
  assert.equal(e.kind, 'modal-invalidation-browser-v1')
  assert.match(e.head, /^[0-9a-f]{40}$/)
  assert.equal(e.browserErrors.length, 0)
  assert.equal(e.cleanupVerified, true)
  assert.equal(e.sceneOwnerUnchanged, true)
  assert.deepEqual(e.episodes.map(x => x.kind), ['late-texture', 'webgl-restoration'])
  for (const x of e.episodes) {
    assert.equal(x.samples.length >= 3, true)
    assert.equal(Number.isFinite(x.triggerAt), true)
    assert.equal(x.triggerCompleted, true)
    assert.equal(x.triggerWasSynthetic, false)
    assert.equal(x.samples[0].at < x.triggerAt, true)
    assert.equal(x.samples.at(-1).at > x.triggerAt, true)
    assert.equal(x.samples.every((s, i, all) => !i || s.at > all[i - 1].at), true)
    assert.equal(x.samples.every(s => s.modalSuspended && s.ownerUnchanged), true)
    for (const s of x.samples) {
      assert.equal(Number.isFinite(s.at), true)
      assert.equal(Number.isSafeInteger(s.observedDrawCount) && s.observedDrawCount >= 0, true)
      assert.equal(Number.isSafeInteger(s.frozenState?.turn) && s.frozenState.turn >= 0, true)
      for (const field of ['person', 'shot']) {
        assert.equal(Array.isArray(s.frozenState[field]) && s.frozenState[field].length > 0, true)
        assert.equal(s.frozenState[field].every(Number.isFinite), true)
      }
      assert.deepEqual(s.frozenState, x.samples[0].frozenState)
    }
    const before = x.samples.filter(s => s.at < x.triggerAt)
    const after = x.samples.filter(s => s.at > x.triggerAt)
    assert.equal(before.length >= 2 && after.length >= 2, true)
    assert.equal(before.at(-1).at - before[0].at >= 350, true)
    assert.equal(after.at(-1).at - after[0].at >= 350, true)
    assert.equal(before.every(s => s.observedDrawCount === before[0].observedDrawCount), true)
    assert.equal(after[0].observedDrawCount, before[0].observedDrawCount + 1)
    assert.equal(after.every(s => s.observedDrawCount === after[0].observedDrawCount), true)
    assert.equal(x.pixelReadback.nonempty, true)
    assert.equal(x.pixelReadback.afterTrigger, true)
    if (x.kind === 'late-texture') {
      assert.equal(x.texture.statusBefore, 'loading')
      assert.equal(x.texture.statusAfter, 'ready')
      assert.equal(x.texture.readyResult, true)
      assert.equal(x.texture.completionRevisionAfter, x.texture.completionRevisionBefore + 1)
      assert.equal(x.texture.realImageDecode, true)
      assert.equal(x.texture.usedByVisibleMaterial, true)
      assert.equal(x.pixelReadback.changedFromBefore, true)
    } else {
      assert.equal(x.pixelReadback.changedFromBefore, false)
      assert.equal(x.context.extension, 'WEBGL_lose_context')
      assert.equal(x.context.lostEventTrusted, true)
      assert.equal(x.context.restoredEventTrusted, true)
      assert.equal(x.context.observedLost, true)
      assert.equal(x.context.observedRestored, true)
      assert.equal(x.context.restoredAt > x.context.lostAt, true)
    }
  }
  return { status: 'passed', scope: 'two bounded modal invalidation browser episodes; not performance or native pixel equivalence' }
}
