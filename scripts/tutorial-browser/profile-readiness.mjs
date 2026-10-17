import { campaignShamanReadiness } from '../campaign-start-readiness.mjs'

// Read only the current scene's Shaman and eligibility inputs. Eligibility stays
// in the existing production-source observer, evaluated by Node, not a source URL
// which plain production Vite hosting does not expose.
export function recoveryReadinessSnapshot() {
  const scene = window.testSceneRef?.current,
    store = window.testStore
  if (
    !scene?.renderer?.domElement?.isConnected ||
    scene.world !== store?.getWorld() ||
    document.querySelector('.loading-world')
  )
    return null
  const world = scene.world
  return {
    units: world.units.filter(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0),
    status: world.status,
    paused: world.paused,
    inputMask: world.inputMask,
    turn: world.turn,
    selected: [...world.selected],
    levelStart: world.levelStart,
    outcome: { level: world.outcome.level },
  }
}

export function recoveryReadiness(snapshot) {
  return snapshot
    ? { ...campaignShamanReadiness(snapshot), level: snapshot.outcome.level }
    : { ready: false, reason: 'Scene/store changed during readiness observation' }
}

export async function waitRecoveryReadiness(page, { timeout = 30000, signal } = {}) {
  const deadline = performance.now() + timeout
  let before,
    samples = 0
  for (;;) {
    signal?.throwIfAborted()
    const after = recoveryReadiness(await page.evaluate(recoveryReadinessSnapshot))
    before ??= after
    samples++
    const remaining = deadline - performance.now()
    if (remaining <= 0)
      throw Error(`Profile recovery readiness timed out: ${JSON.stringify(after)}`)
    if (after.ready) return { before, after, samples }
    await page.waitForTimeout(Math.min(100, remaining))
  }
}
