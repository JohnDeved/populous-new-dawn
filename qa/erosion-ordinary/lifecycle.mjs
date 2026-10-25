// Prospective ordinary-world observation only. Never constructs or steps a World.
import { attachErosionCapture } from '../erosion-native-replay/capture.mjs'

const insist = (value, message) => { if (!value) throw Error(message) }
const errorText = error => { try { return String(error?.stack ?? error) || 'Observation failed' } catch { return 'Unprintable observation failure' } }
const point = value => ({ x: value.x, z: value.z })
const samePoint = (a, b) => a.x === b.x && a.z === b.z
const state = effect => ({ id: effect.id, kind: effect.kind, ...point(effect), age: effect.age,
  remaining: effect.erosion.remaining, center: { ...effect.erosion.center } })

export function observeOrdinaryErosion(clock, world, identity, actorId) {
  const actor = world.units.find(u => u.id === actorId), shrine = world.shrines.find(s => s.id === 101)
  insist(world.outcome.level === 3 && actor?.team === 'blue' && actor.kind === 'shaman' && actor.hp > 0, 'Original living Blue Shaman required')
  insist(shrine?.kind === 'erosionEffect' && shrine.uses === 0 && shrine.active && shrine.remaining === 1, 'Unused authored one-use Erosion head required')
  const targets = (shrine.effectTargets ?? [shrine.effectTarget]).map(point)
  insist(targets.length === 1 && targets.every(p => Number.isFinite(p.x) && Number.isFinite(p.z)), 'One actual authored target required')
  const existingIds = world.effects.filter(e => e.erosion).map(e => e.id)
  insist(!world.effects.some(e => e.erosion && samePoint(e, targets[0])), 'Matching effect already exists')
  const epoch = { runId: identity.runId, sourceFingerprint: identity.source.fingerprint, errors: [], speedViolations: [],
    erosion: { version: 2, shrineId: 101, initialUses: 0, armedAtTurn: world.turn, lastTurn: world.turn,
      targets, existingIds, use: null, effects: [] } }
  const original = clock.afterTurn
  let effect, controller, detached = false
  const observe = () => {
    const e = epoch.erosion
    insist(world.turn === e.lastTurn + 1, 'Missing adjacent lifecycle turn')
    e.lastTurn = world.turn
    if (world.speed !== 1 && !epoch.speedViolations.includes(world.speed)) epoch.speedViolations.push(world.speed)
    insist(world.units.includes(actor) && actor.team === 'blue' && actor.kind === 'shaman' && actor.hp > 0, 'Original Shaman disappeared or changed')
    insist(world.shrines.includes(shrine) && JSON.stringify((shrine.effectTargets ?? [shrine.effectTarget]).map(point)) === JSON.stringify(targets), 'Authored head/targets changed')
    if (!e.use) {
      if (shrine.uses === 0) return
      insist(shrine.uses === 1, 'Unexpected shrine use transition')
      const matches = world.effects.filter(fx => fx.kind === 'erosion' && !existingIds.includes(fx.id) && samePoint(fx, targets[0]))
      insist(matches.length === 1, 'One uniquely observed new Erosion required')
      effect = matches[0]; controller = effect.erosion
      insist(controller?.remaining === 63 && effect.age === 0, 'Observe actual immediate first processing at63')
      e.use = { turn: world.turn, uses: shrine.uses, remaining: shrine.remaining, active: shrine.active }
      e.effects.push({ onsetTurn: world.turn, onset: state(effect), samples: [[world.turn, 63]], last: state(effect), retired: null })
      return
    }
    insist(shrine.uses === 1, 'Additional shrine use is not this capture')
    const record = e.effects[0]
    if (record.retired) return
    const elapsed = world.turn - record.onsetTurn
    insist(effect.erosion === controller && effect.id === record.onset.id && samePoint(effect, record.onset), 'Lifecycle controller/effect identity changed')
    insist(JSON.stringify(controller.center) === JSON.stringify(record.onset.center), 'Native center changed')
    insist(elapsed >= 1 && elapsed <= 63 && controller.remaining === 63 - elapsed, 'Missing/extra Erosion processing visit')
    record.samples.push([world.turn, controller.remaining])
    if (elapsed < 63) {
      insist(world.effects.includes(effect), 'Effect removed before its actual zero visit')
      record.last = state(effect)
    } else {
      insist(!world.effects.includes(effect) && effect.duration === effect.age && Number.isFinite(effect.age), 'Actual zero-counter removal required')
      record.retired = { turnBefore: world.turn - 1, turnAfter: world.turn, remaining: controller.remaining, absentFromWorld: true, age: effect.age, duration: effect.duration }
    }
  }
  function wrapper(...args) {
    const result = original?.apply(this, args)
    try { observe() } catch (error) { epoch.errors.push(errorText(error)) }
    return result
  }
  clock.afterTurn = wrapper
  let capture
  try { capture = attachErosionCapture(clock, world, epoch, identity) }
  catch (error) { clock.afterTurn = original; throw error }
  return {
    progress: () => structuredClone(epoch),
    complete: () => !!epoch.erosion.effects[0]?.retired && !epoch.errors.length && !epoch.speedViolations.length,
    read: () => ({ capture: capture.read(), lifecycle: structuredClone(epoch) }),
    dispose() {
      if (detached) return
      detached = true; capture.dispose()
      if (clock.afterTurn === wrapper) clock.afterTurn = original
      else epoch.errors.push('Lifecycle wrapper was replaced')
    },
  }
}
