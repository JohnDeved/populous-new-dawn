// Passive adapter for a prospectively armed, independently retained lifecycle.
// Browser/profile/scenario composition remains deferred until separately reviewed.
import { armErosionCapture } from '../../app/erosion-observation.ts'

const insist = (condition, message) => { if (!condition) throw Error(message) }
export function attachErosionCapture(clock, world, epoch, attribution) {
  insist(world.outcome.level === 3 && world.shrines.some(s => s.id === 101 && s.kind === 'erosionEffect' && s.uses === 0), 'Arm on the actual unused Mission 3 shrine')
  insist(epoch.erosion?.shrineId === 101 && !epoch.erosion.use, 'Requires a prospective lifecycle observer before shrine use')
  const identity = structuredClone({ runId: attribution.runId, profileId: attribution.profileId, source: attribution.source })
  const original = clock.afterTurn, turns = []
  let lastTurn = world.turn, effect, controller, handle, onsetTurn, failure = null, disposed = false
  const fail = error => {
    failure = 'Erosion capture attribution failed'
    try { failure = String(error) || failure } catch {}
    handle?.detach()
  }
  const observe = () => {
    if (failure || turns.length === 64) return
    insist(world.turn === lastTurn + 1, 'Missing adjacent capture attribution turn')
    lastTurn = world.turn
    insist(!epoch.errors.length && !epoch.speedViolations.length, 'Lifecycle observer failed')
    const lifecycle = epoch.erosion
    if (!handle) {
      if (!lifecycle.use) return
      insist(lifecycle.use.turn === world.turn && lifecycle.effects.length === 1, 'Capture missed the unique actual onset')
      const record = lifecycle.effects[0]
      effect = world.effects.find(e => e.id === record.onset.id)
      insist(effect?.kind === 'erosion' && effect.age === 0 && effect.erosion?.remaining === 64 && record.onsetTurn === world.turn, 'Actual new Erosion controller required')
      controller = effect.erosion; onsetTurn = world.turn
      handle = armErosionCapture(controller)
      return
    }
    insist(effect.erosion === controller && effect.id === lifecycle.effects[0].onset.id, 'Controller identity changed')
    const status = handle.status()
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
  clock.afterTurn = wrapper
  return {
    read() {
      insist(!failure && turns.length === 64 && handle, failure ?? 'Incomplete ordinary Erosion capture')
      const capture = handle.read()
      insist(!capture.failure && capture.detached && capture.visits.length === 64, 'Invalid detached capture')
      return { version: 1, kind: 'ordinary-m3-erosion-controller-inputs', ...structuredClone(identity),
        level: 3, shrineId: 101, effectId: effect.id, onsetTurn,
        failure: null, detached: true, steps: capture.visits.map((visit, index) => ({ turn: turns[index], visit: {
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
      handle?.detach()
    },
  }
}
