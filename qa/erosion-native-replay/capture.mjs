// Passive adapter for a prospectively armed, independently retained lifecycle.
// Browser/profile/scenario composition remains deferred until separately reviewed.
import { declareNextErosionCapture } from '../../app/erosion-observation.ts'

const insist = (condition, message) => { if (!condition) throw Error(message) }
export function attachErosionCapture(clock, world, epoch, attribution) {
  const shrine = world.shrines.find(s => s.id === 101 && s.kind === 'erosionEffect' && s.uses === 0)
  insist(world.outcome.level === 3 && shrine, 'Declare on the actual unused Mission 3 shrine')
  insist(epoch.erosion?.version === 2 && epoch.erosion.shrineId === 101 && !epoch.erosion.use, 'Requires a prospective version2 lifecycle observer before shrine use')
  const targets = shrine.effectTargets ?? [shrine.effectTarget]
  insist(targets.length === 1 && [targets[0]?.x, targets[0]?.z].every(Number.isFinite), 'One finite authored Erosion target required')
  const identity = structuredClone({ runId: attribution.runId, profileId: attribution.profileId, source: attribution.source })
  const original = clock.afterTurn, turns = []
  // nativePosition also synchronizes terrain. Only its pure x/y formula belongs
  // in a passive observer; actual constructor/step snapshots supply height.
  const handle = declareNextErosionCapture({
    x: Math.round((targets[0].x + 8) * 256) & 65535,
    y: Math.round((-targets[0].z - 8) * 256) & 65535,
  })
  let lastTurn = world.turn, effect, controller, onsetTurn, failure = null, disposed = false
  const fail = error => {
    failure = 'Erosion capture attribution failed'
    try { failure = String(error) || failure } catch { /* Keep the nonempty diagnostic marker. */ }
    handle.detach()
  }
  const observe = () => {
    if (failure || turns.length === 64) return
    insist(world.turn === lastTurn + 1, 'Missing adjacent capture attribution turn')
    lastTurn = world.turn
    insist(!epoch.errors.length && !epoch.speedViolations.length, 'Lifecycle observer failed')
    const lifecycle = epoch.erosion
    const status = handle.status()
    insist(!status.failure, status.failure ?? 'Erosion creation capture failed')
    if (!effect) {
      if (!lifecycle.use) {
        insist(!status.created, 'Unexpected Erosion creation without the actual shrine use')
        return
      }
      insist(lifecycle.use.turn === world.turn && lifecycle.effects.length === 1, 'Capture missed the unique actual onset')
      const record = lifecycle.effects[0]
      effect = world.effects.find(e => e.id === record.onset.id)
      insist(effect?.kind === 'erosion' && effect.age === 0 && effect.erosion?.remaining === 63 && record.onset.remaining === 63 && record.onsetTurn === world.turn && status.count === 1, 'Actual immediate first processing at onset required')
      insist(handle.matches(effect.erosion) && world.effects.filter(e => e.erosion && handle.matches(e.erosion)).length === 1, 'The declared constructor identity must own the actual unique effect')
      controller = effect.erosion; onsetTurn = world.turn
    }
    insist(effect.erosion === controller && handle.matches(controller) && effect.id === lifecycle.effects[0].onset.id, 'Controller identity changed')
    insist(!status.failure && status.count === turns.length + 1, 'Missing, extra or failed Erosion step capture')
    turns.push(world.turn) // Actual observed turn, never reconstructed at export.
    if (turns.length === 64) {
      insist(controller.remaining === 0 && !world.effects.includes(effect) && lifecycle.effects[0].retired?.turnAfter === world.turn, 'Actual zero-counter removal required')
      handle.detach()
    } else insist(world.effects.includes(effect), 'Controller disappeared before retirement')
  }
  function wrapper(...args) {
    const result = original?.apply(this, args)
    try { observe() } catch (error) { fail(error) }
    return result
  }
  try { clock.afterTurn = wrapper } catch (error) { handle.detach(); throw error }
  return {
    read() {
      insist(!failure && turns.length === 64, failure ?? 'Incomplete ordinary Erosion capture')
      const capture = handle.read()
      insist(!capture.failure && capture.detached && capture.visits.length === 64 && capture.creation?.remaining === 64, 'Invalid detached capture')
      return { version: 2, kind: 'ordinary-m3-erosion-controller-inputs', ...structuredClone(identity),
        level: 3, shrineId: 101, effectId: effect.id, onsetTurn,
        failure: null, detached: true, creation: capture.creation, steps: capture.visits.map((visit, index) => ({ turn: turns[index], visit: {
          ...visit,
          before: { ...visit.before, heights: Array.from(visit.before.heights) },
          after: visit.after && { ...visit.after, heights: Array.from(visit.after.heights) },
        } })) }
    },
    dispose() {
      if (disposed) return
      disposed = true
      if (clock.afterTurn !== wrapper) fail(Error('Capture wrapper was replaced'))
      else clock.afterTurn = original
      handle.detach()
    },
  }
}
