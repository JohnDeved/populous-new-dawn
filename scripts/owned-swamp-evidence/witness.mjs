import assert from 'node:assert/strict'

// Pure assertions shared by the browser episode and supplied-record unit tests.
export function assertLive(w) {
  assert.equal(w.current, true, 'mounted scene/store identity must agree')
  assert.equal(w.effectPresent, true)
  assert.equal(w.meshPresent, true)
  assert.ok(w.remaining > 0, 'control requires a live, unexpired trap')
}

export function assertCancelled(w) {
  assert.equal(w.current, true)
  assert.equal(w.effectPresent, true, 'input must not splice the effect')
  assert.equal(w.meshPresent, true, 'input must not bypass renderer retirement')
  assert.equal(w.remaining, 0, 'ordinary input must mark cancellation before a turn')
}

export function assertRetired(w) {
  assert.equal(w.current, true)
  assert.equal(w.effectPresent, false)
  assert.equal(w.meshPresent, false)
  assert.equal(w.groupDetached, true)
  assert.equal(w.remaining, -1, 'one real logical visit must retire the zero lifetime')
}

// Evaluated in the mounted page. Retained references are only observation handles.
export function readWitness() {
  const h = window.__ownedSwampWitness
  if (!h) throw Error('Missing explicitly supplied trap witness')
  const s = window.testSceneRef.current
  return {
    current: s === h.scene && s.world === h.world && window.testStore.getWorld() === h.world &&
      s.renderer.domElement.isConnected && !s.disposed,
    id: h.fx.id, turn: h.world.turn, remaining: h.fx.swamp.remaining,
    effectPresent: h.world.effects.includes(h.fx), meshPresent: s.fxMeshes.get(h.fx.id) === h.group,
    groupDetached: h.group.parent === null, selected: [...h.world.selected], mode: h.world.mode,
    inputMask: h.world.inputMask, paused: h.world.paused,
  }
}
