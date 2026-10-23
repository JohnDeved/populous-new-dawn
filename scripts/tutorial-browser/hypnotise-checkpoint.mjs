import assert from 'node:assert/strict'

// Installed before the public Load action. Observe the replacement's synchronous
// notifications, including Home's normal resumed-state notification before RAF.
export function observeHypnotiseLoad() {
  const store = window.testStore,
    original = store.getWorld()
  const unsubscribe = store.subscribe(() => {
    const world = store.getWorld()
    if (world === original || world.paused) return
    window.__hypnotiseLoaded = {
      turn: world.turn,
      stock: world.shots.hypnotise,
      randomState: world.randomState,
      paused: world.paused,
    }
    unsubscribe()
  })
}

export function validateHypnotiseLoad(saved, loaded) {
  assert.equal(saved.paused, true)
  assert.deepEqual(
    loaded,
    { ...saved, paused: false },
    'Public Load preserves saved content but resumes by design'
  )
}
