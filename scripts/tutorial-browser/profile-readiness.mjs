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
    flyby: { flags: world.flyby?.flags ?? null },
    introductionSkipAvailable: (world.inputMask & 64) !== 0 && (world.flyby.flags & 0x51) === 0x11,
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
    ? {
        ...campaignShamanReadiness(snapshot),
        level: snapshot.outcome.level,
        flybyFlags: snapshot.flyby?.flags ?? null,
        introductionSkipAvailable: snapshot.introductionSkipAvailable === true,
      }
    : { ready: false, reason: 'Scene/store changed during readiness observation' }
}

export async function waitRecoveryReadiness(page, { timeout = 30000, signal, onBlocked } = {}) {
  const deadline = performance.now() + timeout
  const publicActions = []
  let before,
    samples = 0
  for (;;) {
    signal?.throwIfAborted()
    const after = recoveryReadiness(await page.evaluate(recoveryReadinessSnapshot))
    before ??= after
    samples++
    const remaining = deadline - performance.now()
    if (remaining <= 0)
      throw new Error(
        `Profile recovery readiness timed out: ${JSON.stringify({ ...after, publicActions })}`
      )
    if (after.ready) return { before, after, samples, publicActions }
    const action = await onBlocked?.({ after, remainingMs: remaining })
    if (action) publicActions.push({ sample: samples, ...action })
    signal?.throwIfAborted()
    const afterActionRemaining = deadline - performance.now()
    if (afterActionRemaining <= 0)
      throw new Error(
        `Profile recovery readiness timed out: ${JSON.stringify({ ...after, publicActions })}`
      )
    await page.waitForTimeout(Math.min(100, afterActionRemaining))
  }
}
