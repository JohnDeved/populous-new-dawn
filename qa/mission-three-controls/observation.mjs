// Verification-only observer. It never calls a simulation, command or renderer.
import { observeCampaignConversions } from '../../scripts/campaign-conversion-observer.mjs'

export function createEpoch(name, baselineGameTime = 0) {
  if (!name || !Number.isFinite(baselineGameTime) || baselineGameTime < 0)
    throw Error('Observation epoch requires a name and nonnegative baseline')
  return { name, baselineGameTime, lastGameTime: baselineGameTime, activeSeconds: 0,
    firstTurn: null, lastTurn: null, samples: 0, conversions: null, errors: [],
    speedViolations: [], firstConversion: null }
}

export function recordTurn(epoch, world) {
  if (!Number.isFinite(world.time) || world.time < epoch.lastGameTime)
    throw Error('Game time rewound inside an observation epoch')
  if (epoch.lastTurn !== null && world.turn < epoch.lastTurn)
    throw Error('Simulation turn rewound inside an observation epoch')
  epoch.activeSeconds += world.time - epoch.lastGameTime
  epoch.lastGameTime = world.time
  epoch.firstTurn ??= world.turn
  epoch.lastTurn = world.turn
  epoch.samples++
  if (world.speed !== 1 && !epoch.speedViolations.includes(world.speed))
    epoch.speedViolations.push(world.speed)
  epoch.conversions = observeCampaignConversions(world, epoch.conversions)
  if (!epoch.firstConversion && epoch.conversions.events.length)
    epoch.firstConversion = { turn: world.turn, time: world.time, observedAt: Date.now() }
}

// Application exceptions preserve their original propagation. Only diagnostic
// exceptions are contained, so evidence failure cannot suppress the next RAF.
export function attachObserver(clock, world, epoch, observe = recordTurn) {
  const original = clock.afterTurn
  const sample = () => {
    try { observe(epoch, world) }
    catch (error) { epoch.errors.push({ turn: world.turn, error: String(error.stack ?? error) }) }
  }
  function wrapper(...args) {
    const result = original?.apply(this, args)
    sample()
    return result
  }
  clock.afterTurn = wrapper
  sample()
  let attached = true
  return () => {
    if (!attached) return true
    if (clock.afterTurn !== wrapper) {
      epoch.errors.push({ turn: world.turn, error: 'Observer ownership changed before detach' })
      return false
    }
    clock.afterTurn = original
    attached = false
    return true
  }
}

export function requireConversion(epoch, victimId, preacherId) {
  if (epoch.errors.length || epoch.speedViolations.length)
    throw Error('Observation errors or non-normal speed invalidate conversion evidence')
  const event = epoch.conversions?.events.find(event =>
    event.victims.length === 1 && event.replacements.length === 1 &&
    event.victims[0].id === victimId && event.victims[0].workTarget === preacherId)
  if (!event) throw Error('No exact singleton authored-victim/Blue-preacher conversion')
  return event
}

export function progressKey(snapshot, scope, ids = []) {
  const included = new Set(ids)
  const units = snapshot.units.filter(u => !ids.length || included.has(u.id))
  const buildings = snapshot.buildings.filter(b => !ids.length || included.has(b.id))
  // Turn/time alone are deliberately excluded: a spinning simulation is not
  // proof of a progressing route, construction, training, sermon or combat.
  if (scope === 'construction') return JSON.stringify(buildings.map(b =>
    [b.id, b.hp, b.progress, b.logs, b.occupants]))
  if (scope === 'training') return JSON.stringify([buildings.map(b =>
    [b.id, b.hp, b.trainingMana, b.trainingCost, b.occupants, b.queue]),
  snapshot.units.filter(u => u.team === 'blue').map(u => [u.id, u.kind]),
  units.map(u => [u.id, Math.round(u.x * 4), Math.round(u.z * 4), u.inside, u.order])])
  if (scope === 'worship') return JSON.stringify([snapshot.unlockedTemple,
    snapshot.shrines.filter(h => !ids.length || included.has(h.id)).map(h =>
      [h.id, h.work, h.progress, h.uses, h.followers]),
    units.map(u => [u.id, Math.round(u.x * 4), Math.round(u.z * 4), u.work])])
  if (scope === 'sermon') return JSON.stringify(units.map(u =>
    [u.id, u.team, u.hp, Math.round(u.x * 4), Math.round(u.z * 4), u.nativeState, u.owner, u.timer]))
  return JSON.stringify([units.map(u => [u.id, u.team, u.kind, u.hp,
    Math.round(u.x * 4), Math.round(u.z * 4), u.order, u.inside, u.work]),
  buildings.map(b => [b.id, b.hp, b.progress, b.logs, b.occupants]), snapshot.status])
}

export function checkCondition(snapshot, condition) {
  const u = snapshot.units.find(u => u.id === condition.id)
  const b = snapshot.buildings.find(b => b.id === condition.id)
  const h = snapshot.shrines.find(h => h.id === condition.id)
  switch (condition.type) {
    case 'temple-unlocked': return snapshot.unlockedTemple
    case 'building-complete': return !!b && b.progress === 1
    case 'trained-kind': return snapshot.units.some(u => u.team === 'blue' && u.kind === condition.kind &&
      !(condition.existingIds ?? []).includes(u.id))
    case 'listener': return !!u && u.team === 'yellow' && u.nativeState === 23 && u.owner === condition.preacherId
    case 'conversion': return !!snapshot.observation.conversions?.events.some(e =>
      e.victims.length === 1 && e.replacements.length === 1 &&
      e.victims[0].id === condition.id && e.victims[0].workTarget === condition.preacherId)
    case 'shrine-used': return !!h && h.uses >= (condition.uses ?? 1)
    case 'effect-present': return snapshot.effects.some(e => e.kind === condition.kind)
    case 'effect-finished': return !snapshot.effects.some(e => e.kind === condition.kind)
    case 'target-gone': return !u && !b
    case 'units-near': {
      const wrap = v => ((v + 128) % 256 + 256) % 256 - 128
      return !!u && Math.hypot(wrap(u.x - condition.point.x), wrap(u.z - condition.point.z)) <= condition.distance
    }
    case 'won': return snapshot.status === 'won'
    case 'shaman-ready': return snapshot.readiness.ready
    default: throw Error(`Unsupported wait condition: ${condition.type}`)
  }
}
