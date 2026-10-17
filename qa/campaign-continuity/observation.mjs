// Verification-only observer. It never calls a simulation, command or renderer.
import { observeCampaignConversions } from '../../scripts/campaign-conversion-observer.mjs'
import { recordErosionTurn, erosionProgress } from './erosion-observer.mjs'

// This is a source-bound allocation-prefix calculation, not a World creation.
// In the inspected Mission 3 prefix, every row takes exactly one nextId++ path;
// buildingId also takes nextId++ below 1024. Reject every unreviewed row family.
export function authoredVictimIdentity(objects) {
  const prefix = objects.filter(o => o.index <= 52)
  if (prefix.length !== 53 || prefix.some((o, i) => o.index !== i))
    throw Error('Authored allocation prefix changed')
  for (const o of prefix)
    if (!(o.type === 1 || o.type === 2 && o.owner !== 255 || o.type === 5 && o.model <= 6))
      throw Error('Unreviewed allocation family before authored victim')
  const victim = prefix.at(-1)
  if (victim.type !== 1 || victim.model !== 2 || victim.owner !== 2 || victim.x !== -43 || victim.z !== -107)
    throw Error('Authored victim descriptor changed')
  return { id: prefix.length, objectIndex: victim.index, initial: { x: victim.x, z: victim.z },
    source: 'world-state nextId=1; reviewed one-allocation world-initialization prefix0..52' }
}

export class MissionDefeat extends Error {
  constructor() { super('Observed Mission 3 defeat'); this.name = 'MissionDefeat' }
}

export function requireNotDefeated(status) {
  if (status === 'lost') throw new MissionDefeat()
}

const wrapped = v => ((v + 128) % 256 + 256) % 256 - 128
const near = (a, b, radius) => Math.hypot(wrapped(a.x - b.x), wrapped(a.z - b.z)) <= radius
const short = n => n << 16 >> 16
export function minimapInput({ width, height, rect, center, heading, target, maxDistance = 2048 }, pick, ownsPoint) {
  const wrap = v => ((v + 32768) % 65536 + 65536) % 65536 - 32768
  let best = null
  for (let y = 2; y < height - 2; y++) for (let x = 2; x < width - 2; x++) {
    const native = pick(width, height, center, heading, { x, y })
    const distance = Math.hypot(wrap(native.x - target.x), wrap(native.y - target.y))
    const point = { x: rect.x + x / width * rect.width, y: rect.y + y / height * rect.height }
    if ((!best || distance < best.distance) && ownsPoint(point)) best = { distance, ...point, native }
  }
  return best && best.distance <= maxDistance ? best : null
}
const markerCell = point => ({
  // Read-only equivalent of nativePosition → commandMarkerPoint → browserPosition.
  x: short(((Math.round((point.x + 8) * 256) & 0xfe00) + 256) - 2048) / 256,
  z: -short(((Math.round((-point.z - 8) * 256) & 0xfe00) + 256) + 2048) / 256,
})
export function acceptedOrderEvidence(before, after, hit) {
  if (!(after.lastOrderTurn > before.lastOrderTurn && after.lastOrderTurn >= before.turn &&
    after.pointerAck.until > before.pointerAck.until && after.pointerAck.target === (hit.id ?? 0)))
    throw Error('Missing fresh command dispatch and pointer acknowledgement')
  const intended = u => {
    // Model19 stores a packed landscape cell, never a building identity. Only the
    // shipped read-only lookup can tie that cell to the actual clicked building.
    if (u.order?.model === 19) return hit.collection === 'buildings' &&
      !(u.order.flags & 1) && u.attackBuildingId === hit.id
    return hit.id ? u.work === hit.id || u.target === hit.id || u.order?.a === hit.id :
      [3, 17, 31, 32].includes(u.order?.model) && near({
        x: short(u.order.a - 2048) / 256, z: -short(u.order.b + 2048) / 256,
      }, hit.point, 3)
  }
  const recipients = after.units.filter(u => before.selected.includes(u.id) && intended(u))
  if (!recipients.length) throw Error('No selected recipient carries the requested target')
  let marker = null
  if (!hit.id) {
    const cell = markerCell(hit.point)
    marker = after.effects.find(e => e.kind === 'orderMarker' &&
      !before.effects.some(old => old.id === e.id) && near(e, cell, 1 / 256))
    if (!marker && before.observation?.name === after.observation?.name)
      marker = after.observation?.orderMarkers.find(e =>
        e.cursor > before.observation.orderMarkerCursor &&
        e.commandTurn === after.lastOrderTurn && e.observedTurn >= e.commandTurn &&
        e.observedTurn <= after.turn && !before.effects.some(old => old.id === e.id) &&
        near(e, cell, 1 / 256))
    if (!marker) throw Error('No fresh ground marker at the requested cell')
  }
  const unchanged = recipients.every(u => {
    const old = before.units.find(old => old.id === u.id)
    return old && intended(old) && JSON.stringify([old.work, old.target, old.order, old.attackBuildingId]) ===
      JSON.stringify([u.work, u.target, u.order, u.attackBuildingId])
  })
  return { kind: unchanged ? 'fresh-input-existing-order' : 'fresh-input-new-order',
    recipientIds: recipients.map(u => u.id), marker }
}

export function createEpoch(name, baselineGameTime = 0) {
  if (!name || !Number.isFinite(baselineGameTime) || baselineGameTime < 0)
    throw Error('Observation epoch requires a name and nonnegative baseline')
  return { name, baselineGameTime, lastGameTime: baselineGameTime, activeSeconds: 0,
    firstTurn: null, lastTurn: null, samples: 0, conversions: null, errors: [],
    speedViolations: [], firstConversion: null, orderMarkerCursor: 0, orderMarkers: [], sermon: null }
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
  for (const effect of world.effects ?? []) {
    if (effect.kind !== 'orderMarker' || epoch.orderMarkers.some(e => e.id === effect.id)) continue
    const owner = world.secondaryEffects?.slots.find(s => s?.kind === 'orderMarker' && s.effect === effect.id)
    if (!owner) continue
    epoch.orderMarkers.push({ cursor: ++epoch.orderMarkerCursor, id: effect.id,
      x: effect.x, z: effect.z, observedTurn: world.turn, commandTurn: world.lastOrderTurn,
      secondarySerial: owner.serial, turnsRemaining: effect.turnsRemaining })
  }
  // The secondary pool has160 slots. Keep a bounded observation window; accepted
  // command logs separately retain each matched witness before it can be evicted.
  if (epoch.orderMarkers.length > 512) epoch.orderMarkers.splice(0, epoch.orderMarkers.length - 512)
  if (world.speed !== 1 && !epoch.speedViolations.includes(world.speed))
    epoch.speedViolations.push(world.speed)
  recordErosionTurn(epoch, world)
  const previous = epoch.conversions
  const sermon = epoch.sermon
  if (sermon && !sermon.firstOwned) {
    const preacher = world.units.find(u => u.id === sermon.preacherId && u.team === 'blue' && u.kind === 'preacher' && u.hp > 0)
    const listeners = preacher ? world.units.filter(u => sermon.candidateIds.includes(u.id) &&
      u.team === 'yellow' && u.kind === 'brave' && u.hp > 0 && u.inside === null &&
      u.native?.model === 2 && u.native.tribe === 2 && u.native.state === 23 &&
      u.native.workTarget === sermon.preacherId).sort((a, b) => a.id - b.id) : []
    if (listeners.length) {
      if (previous?.turn !== world.turn - 1) throw Error('Missing adjacent pre-sermon observation')
      const victim = listeners[0], before = previous.units.find(u => u.id === victim.id)
      if (!before || before.team !== 'yellow' || before.kind !== 'brave' || before.hp <= 0 ||
        before.state === 23 && before.workTarget === sermon.preacherId)
        throw Error('First owned sermon lacks a new prospective onset')
      sermon.firstOwned = { turnBefore: previous.turn, turnAfter: world.turn, gameTime: world.time,
        preacherId: preacher.id, sameTurnIds: listeners.map(u => u.id), before: { ...before },
        victim: sermonCandidate(victim) }
    }
  }
  epoch.conversions = observeCampaignConversions(world, previous)
  if (!epoch.firstConversion && epoch.conversions.events.length)
    epoch.firstConversion = { turn: world.turn, time: world.time, observedAt: Date.now() }
}

// Application exceptions preserve their original propagation. Only diagnostic
// exceptions are contained, so evidence failure cannot suppress the next RAF.
export function diagnosticErrorText(error) {
  try { return String(error?.stack ?? error) }
  catch { return 'Unprintable diagnostic failure' }
}

export function observeBuilding(b) {
  const admission = b.admission
  return { id: b.id, kind: b.kind, team: b.team, x: b.x, z: b.z, hp: b.hp,
    progress: b.progress, logs: b.logs, builders: [...(b.builders ?? [])], occupants: [...(admission?.occupants ?? [])],
    inside: admission?.inside ?? 0, trainingMana: admission?.storedMana,
    trainingCost: admission?.trainingCost, queue: admission?.queueHead ?? 0 }
}

export class IncompleteRun extends Error {
  constructor(code, message) { super(message); this.name = 'IncompleteRun'; this.code = code }
}

const sermonCandidate = u => ({ id: u.id, team: u.team, kind: u.kind, hp: u.hp,
  x: u.x, z: u.z, inside: u.inside, state: u.native?.state, workTarget: u.native?.workTarget,
  model: u.native?.model, tribe: u.native?.tribe, timer: u.native?.timer,
  flags2: u.native?.flags2, flags3: u.native?.flags3, flags4: u.native?.flags4 })

export function armSermonObservation(epoch, world, preacherId) {
  if (epoch.sermon) throw Error('Sermon candidate policy cannot be re-armed')
  const preacher = world.units.find(u => u.id === preacherId && u.team === 'blue' && u.kind === 'preacher' && u.hp > 0)
  if (!preacher) throw new IncompleteRun('required-preacher-unavailable', 'Cannot arm without the actual live Blue Preacher')
  if (epoch.conversions?.events.some(e => e.victims.some(v => v.workTarget === preacherId)))
    throw new IncompleteRun('retrospective-sermon-arm', 'This Preacher already converted someone before the candidate declaration')
  const candidates = world.units.filter(u => u.team === 'yellow' && u.kind === 'brave' && u.hp > 0).sort((a, b) => a.id - b.id)
  if (!candidates.length || candidates.length > 200)
    throw new IncompleteRun('victim-search-limit', 'Candidate declaration requires1–200 current living Yellow Braves')
  if (candidates.some(u => u.native?.state === 23 && u.native.workTarget === preacherId))
    throw new IncompleteRun('retrospective-sermon-arm', 'An owned sermon already began before candidate declaration')
  epoch.sermon = { armedAtTurn: world.turn, armedAtGameTime: world.time, preacherId,
    rule: 'First new owned state23 among these current living Yellow Braves; lowest ID on a same-turn tie. No re-arming or post-conversion selection.',
    candidateIds: candidates.map(u => u.id), candidates: candidates.map(sermonCandidate), firstOwned: null }
  return epoch.sermon
}

export function requireDeclaredPreacherOrder(snapshot, declared) {
  if (!declared && snapshot.units.some(u => snapshot.selected.includes(u.id) &&
    u.team === 'blue' && u.kind === 'preacher'))
    throw Error('Declare the prospective candidate pool before any Preacher order')
}

export function requireFirstOwnedListener(snapshot, preacherId, declaration, epochName) {
  const epoch = snapshot.observation, sermon = epoch?.sermon
  if (epoch?.name !== epochName || !sermon || sermon.preacherId !== preacherId ||
    declaration?.preacherId !== preacherId || sermon.armedAtTurn !== declaration.armedAtTurn ||
    JSON.stringify(sermon.candidateIds) !== JSON.stringify(declaration.candidateIds))
    throw Error('Capture requires the original prospective declaration and observation epoch')
  const first = sermon.firstOwned
  if (!first) throw Error('No first owned listener has been observed')
  if (first.preacherId !== preacherId || !declaration.candidateIds.includes(first.victim.id) ||
    first.turnBefore < declaration.armedAtTurn || first.turnAfter !== first.turnBefore + 1)
    throw Error('Capture requires the exact adjacent-turn prospective onset')
  if (!checkCondition(snapshot, { type: 'first-owned-sermon', preacherId }))
    throw new IncompleteRun('missed-sermon-window', 'The first observed candidate is no longer an actual owned listener; no replacement may be selected')
  return structuredClone(first)
}

export function waitDisposition(snapshot, condition, savedSermon) {
  // A staging/movement condition must not consume the short first-listener
  // window, even when that condition becomes true on the same observation.
  if (!savedSermon && snapshot.observation?.sermon?.firstOwned) return 'capture-sermon'
  return checkCondition(snapshot, condition) ? 'complete' : 'wait'
}

export function requireCancelledSermon(before, after, victimId, preacherId) {
  const prior = before.units.find(u => u.id === victimId), victim = after.units.find(u => u.id === victimId)
  if (!prior || prior.team !== 'yellow' || prior.personOwner !== 'native' ||
    prior.nativeState !== 23 || prior.owner !== preacherId ||
    prior.conversionNative?.state !== 23 || prior.conversionNative.workTarget !== preacherId)
    throw Error('Cancellation requires the previously owned exact listener')
  if (!victim || victim.team !== 'yellow' || victim.kind !== 'brave' || victim.hp <= 0 ||
    victim.nativeState === 23 || victim.owner !== 0 || victim.flags4 & 128 || victim.conversionNative?.state === 23)
    throw Error('The exact listener has not released sermon ownership and its listener flag')
  const reused = !!(victim.flags2 & 0x200000), fight = victim.fight
  if (!reused && !(victim.personOwner === 'native' && victim.conversionNative &&
    victim.conversionNative.state === victim.nativeState && victim.conversionNative.workTarget === 0 &&
    victim.conversionNative.flags2 === victim.flags2 && victim.conversionNative.flags4 === victim.flags4))
    throw Error('Cleared flags must belong to the observed released native listener')
  // Browser melee entry (live-people.ts) sets0x40200200 on the fight-owned
  // person. A late poll cannot claim it observed the intermediate cleared bit.
  if (reused && !(victim.personOwner === 'fight' && victim.conversionNative === null && fight &&
    fight.group > 0 && fight.groupExists && fight.personId === victimId &&
    [25, 29].includes(victim.nativeState) && fight.state === victim.nativeState &&
    fight.flags2 === victim.flags2 && (fight.flags2 & 0x200200) === 0x200200))
    throw Error('The cancellation bit remains set without an observed fight-person handoff')
  return { kind: reused ? 'released-listener-observed-in-combat' : 'released-native-listener',
    victimId, preacherId, turnBefore: before.turn, turnAfter: after.turn,
    releasedOwner: victim.owner, listenerFlag: victim.flags4 & 128,
    clearedBitObserved: !reused, personOwner: victim.personOwner, flags2: victim.flags2,
    fight: fight ? structuredClone(fight) : null }
}

export function requiredActorStop(snapshot, condition) {
  if (condition.type === 'shrine-used' && Object.hasOwn(condition, 'workerId')) {
    if (checkCondition(snapshot, condition)) return null
    const worker = snapshot.units.find(unit => unit.id === condition.workerId)
    if (!Number.isInteger(condition.workerId) || !worker || !(worker.hp > 0) || worker.team !== 'blue' || worker.kind !== 'brave')
      return new IncompleteRun('worship-worker-unavailable', `Required Blue Brave${condition.workerId} is absent or unavailable`)
    if (worker.personOwner === 'fight' || worker.fight || worker.order?.model !== 27 || worker.order.a !== condition.id)
      return new IncompleteRun('worship-worker-order-lost', `Required Brave${condition.workerId} no longer follows worship order27/${condition.id}`)
    return null
  }
  if (!['first-owned-sermon', 'listener', 'conversion'].includes(condition.type)) return null
  if (condition.type === 'conversion' && checkCondition(snapshot, condition)) return null
  const preacher = snapshot.units.find(u => u.id === condition.preacherId)
  const victim = snapshot.units.find(u => u.id === condition.id)
  if (!preacher || preacher.hp <= 0 || preacher.team !== 'blue' || preacher.kind !== 'preacher')
    return new IncompleteRun('required-preacher-unavailable', `Required Blue Preacher${condition.preacherId} is absent or unavailable`)
  if (condition.type === 'first-owned-sermon') {
    if (snapshot.observation.sermon?.firstOwned)
      return new IncompleteRun('missed-sermon-window', 'The first observed candidate is no longer an actual owned listener; no replacement may be selected')
    return null
  }
  if (!victim || victim.hp <= 0 || victim.team !== 'yellow' || victim.kind !== 'brave')
    return new IncompleteRun('required-victim-unavailable', `Required Yellow Brave${condition.id} is absent or unavailable without conversion evidence`)
  return null
}

export function requireCurrentConvertedWorker(snapshot, victimId, preacherId, replacementId) {
  const event = requireConversion(snapshot.observation, victimId, preacherId)
  if (event.replacements[0].id !== replacementId)
    throw new IncompleteRun('current-conversion-required', 'Current worker must come from this epoch\'s exact conversion')
  const worker = snapshot.units.find(unit => unit.id === replacementId)
  if (snapshot.units.some(unit => unit.id === victimId) || !worker || !(worker.hp > 0) || worker.team !== 'blue' || worker.kind !== 'brave' ||
    !(worker.flags3 & 0x1000000) || !(worker.flags4 & 0x40000))
    throw new IncompleteRun('converted-worker-unavailable', 'The freshly observed converted Brave is unavailable')
  return worker
}

export function selectSermonAnchor(snapshot, authoredId) {
  const yellow = snapshot.units.filter(u => u.team === 'yellow')
  if (yellow.length > 200) throw new IncompleteRun('victim-search-limit', 'Yellow population exceeds the bounded200-person search')
  const candidates = yellow.filter(u => u.kind === 'brave' && u.hp > 0 && u.inside === null &&
    u.nativeState === 19 && u.preachingEligible === true && near(u, { x: -43, z: -107 }, 32))
  candidates.sort((a, b) => Math.hypot(wrapped(a.x + 43), wrapped(a.z + 107)) -
    Math.hypot(wrapped(b.x + 43), wrapped(b.z + 107)) || a.id - b.id)
  // Prospective tactic only: this margin does not prove safe routes or immunity.
  // Keep authored preference only after excluding nearby observed specialists.
  const specialists = yellow.filter(u => u.kind !== 'brave' && u.hp > 0)
    .sort((a, b) => a.id - b.id).map(({ id, kind, x, z, hp, inside }) => ({ id, kind, x, z, hp, inside }))
  const assessments = candidates.map(u => ({ id: u.id, x: u.x, z: u.z,
    distances: specialists.map(s => ({ id: s.id, distance: Math.hypot(wrapped(s.x - u.x), wrapped(s.z - u.z)) })) }))
  const excludedIds = assessments.filter(a => a.distances.some(d => d.distance <= 8)).map(a => a.id)
  const remaining = candidates.filter(u => !excludedIds.includes(u.id))
  const search = { specialistExclusionRadius: 8, specialists, assessments,
    candidateIds: candidates.map(u => u.id), excludedIds, remainingIds: remaining.map(u => u.id) }
  const victim = remaining.find(u => u.id === authoredId) ?? remaining[0]
  if (!victim) {
    const error = new IncompleteRun('no-eligible-victim', 'No observed idle eligible Yellow Brave outside the declared specialist margin')
    error.search = search
    throw error
  }
  return { anchor: victim, ...search,
    reason: victim.id === authoredId ? 'authored victim remains eligible outside specialist margin' :
      'nearest eligible idle Yellow Brave outside specialist margin, then lowest ID' }
}

export function inOrdinaryPreachingCells(point, victim) {
  // Same whole-cell square as inEngagementArea with ordinary commandAux=3.
  const delta = (a, b) => (((((a >>> 8) & 254) - ((b >>> 8) & 254)) + 128) & 255) - 128
  return Math.abs(delta(Math.round((point.x + 8) * 256), Math.round((victim.x + 8) * 256))) <= 2 &&
    Math.abs(delta(Math.round((-point.z - 8) * 256), Math.round((-victim.z - 8) * 256))) <= 2
}

export function activeBudget(conversionActiveSeconds = null) {
  if (conversionActiveSeconds === null) return 900
  if (!Number.isFinite(conversionActiveSeconds) || conversionActiveSeconds < 0)
    throw Error('A conversion budget requires an observed nonnegative active time')
  return Math.min(2400, conversionActiveSeconds + 1800)
}

export function requireActiveBudget(active, conversionActiveSeconds = null) {
  const budget = activeBudget(conversionActiveSeconds)
  if (active >= budget) throw new IncompleteRun('active-budget',
    `Active resource envelope reached at ${active}s (limit ${budget}s)`)
}

export function waitDiagnosticStop({ now, clockAdvancedAt, animationAdvancedAt, wallElapsed,
  wallLimit, active, budget, changedAt, scope }) {
  if (now - clockAdvancedAt >= 30_000 || now - animationAdvancedAt >= 30_000)
    return new IncompleteRun('clock-stall', 'No simulation/animation clock advancement for 30 wall seconds')
  if (wallElapsed >= wallLimit) return new IncompleteRun('wall-envelope', 'Outer wall resource envelope reached')
  if (active >= budget) return new IncompleteRun('active-budget',
    `Pooled diagnostic budget reached at ${active}s; no gameplay failure inferred`)
  if (active - changedAt >= 120) return new IncompleteRun('progress-stall',
    `No relevant ${scope} progress for two active minutes`)
  return null
}

export function attachObserver(clock, world, epoch, observe = recordTurn) {
  const original = clock.afterTurn
  const sample = () => {
    try { observe(epoch, world) }
    catch (error) { epoch.errors.push({ turn: world.turn, error: diagnosticErrorText(error) }) }
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
  if (!event) throw Error('No exact singleton locked-victim/Blue-preacher conversion')
  return event
}

export function progressKey(snapshot, scope, ids = []) {
  const included = new Set(ids)
  const units = snapshot.units.filter(u => !ids.length || included.has(u.id))
  const buildings = snapshot.buildings.filter(b => !ids.length || included.has(b.id))
  // Turn/time alone are deliberately excluded: a spinning simulation is not
  // proof of a progressing route, construction, training, sermon or combat.
  if (scope === 'construction') {
    const construction = new Set(buildings.map(b => b.id))
    const workers = snapshot.units.filter(u => included.has(u.id) || construction.has(u.work) ||
      u.order?.model === 6 && construction.has(u.order.a) ||
      buildings.some(b => b.builders?.includes(u.id)))
    return JSON.stringify([buildings.map(b =>
      [b.id, b.hp, b.progress, b.logs, b.inside, b.occupants, b.queue]),
    workers.map(u => [u.id, Math.round(u.x * 4), Math.round(u.z * 4), u.work, u.cargo,
      u.harvest, u.delivery, u.tree, u.route, u.builder, u.order])])
  }
  if (scope === 'training') return JSON.stringify([buildings.map(b =>
    [b.id, b.hp, b.trainingMana, b.trainingCost, b.inside, b.occupants, b.queue]),
  units.map(u => [u.id, u.kind, Math.round(u.x * 4), Math.round(u.z * 4), u.inside, u.order])])
  if (scope === 'worship') return JSON.stringify([snapshot.unlockedTemple,
    snapshot.shrines.filter(h => !ids.length || included.has(h.id)).map(h =>
      [h.id, h.work, h.progress, h.uses, h.followers]),
    units.map(u => [u.id, Math.round(u.x * 4), Math.round(u.z * 4), u.work])])
  if (scope === 'sermon') return JSON.stringify(units.map(u =>
    [u.id, u.team, u.hp, Math.round(u.x * 4), Math.round(u.z * 4), u.nativeState, u.owner,
      u.nativeState === 23 ? u.timer : null]))
  return JSON.stringify([units.map(u => [u.id, u.team, u.kind, u.hp,
    Math.round(u.x * 4), Math.round(u.z * 4), u.order, u.inside, u.work]),
  buildings.map(b => [b.id, b.hp, b.progress, b.logs, b.inside, b.occupants, b.queue]), snapshot.status])
}

// Progress belongs to this objective, never unrelated wandering/combat.
export function objectiveProgress(snapshot, condition, scope, ids = []) {
  if (condition.type === 'shrine-used' && Object.hasOwn(condition, 'workerId')) {
    const head = snapshot.shrines.find(shrine => shrine.id === condition.id)
    const worker = snapshot.units.find(unit => unit.id === condition.workerId && unit.hp > 0 && unit.team === 'blue' && unit.kind === 'brave' &&
      unit.personOwner !== 'fight' && !unit.fight && unit.order?.model === 27 && unit.order.a === condition.id)
    return JSON.stringify([head && [head.id, head.work, head.progress, head.uses, head.followers],
      worker && [worker.id, Math.round(worker.x * 4), Math.round(worker.z * 4), worker.work]])
  }
  if (condition.type === 'shaman-ready') {
    const ready = snapshot.readiness, shaman = ready?.shaman
    return JSON.stringify([snapshot.status, snapshot.paused, snapshot.inputMask, ready?.ready,
      ready?.levelStartPhase, shaman && [shaman.id, shaman.hp, shaman.canOrder, shaman.selectable,
        shaman.state, shaman.flags2, shaman.flags4, shaman.commandStatus]])
  }
  if (condition.type.startsWith('erosion-')) return erosionProgress(snapshot, condition.id)
  if (['effect-present', 'effect-finished'].includes(condition.type))
    return JSON.stringify(snapshot.effects.filter(effect => effect.kind === condition.kind).map(effect => [effect.id, effect.kind, effect.age]))
  const watched = ids.length ? ids : [condition.id, condition.preacherId, ...(condition.ids ?? [])].filter(Number.isInteger)
  if (condition.type === 'trained-kind') return JSON.stringify([
    watched.length ? progressKey(snapshot, 'training', watched) : null,
    checkCondition(snapshot, condition),
  ])
  if (condition.type === 'won') return JSON.stringify([snapshot.status,
    snapshot.units.filter(unit => unit.team !== 'wild').map(unit => [unit.id, unit.team, unit.hp]),
    snapshot.buildings.map(building => [building.id, building.team, building.hp])])
  return progressKey(snapshot, scope, watched)
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
    case 'listener': return !!u && u.team === 'yellow' && u.nativeState === 23 && u.owner === condition.preacherId &&
      snapshot.units.some(p => p.id === condition.preacherId && p.team === 'blue' && p.kind === 'preacher' && p.hp > 0)
    case 'first-owned-sermon': {
      const first = snapshot.observation.sermon?.firstOwned
      return !!first && first.preacherId === condition.preacherId &&
        snapshot.units.some(v => v.id === first.victim.id && v.team === 'yellow' && v.kind === 'brave' &&
          v.hp > 0 && v.nativeState === 23 && v.owner === condition.preacherId) &&
        snapshot.units.some(p => p.id === condition.preacherId && p.team === 'blue' && p.kind === 'preacher' && p.hp > 0)
    }
    case 'conversion': return !!snapshot.observation.conversions?.events.some(e =>
      e.victims.length === 1 && e.replacements.length === 1 &&
      e.victims[0].id === condition.id && e.victims[0].workTarget === condition.preacherId)
    case 'shrine-used': return !!h && h.uses >= (condition.uses ?? 1)
    case 'erosion-onset': {
      const e = snapshot.observation.erosion
      return !!e && e.shrineId === condition.id && !!e.use && e.effects.length === e.targets.length && e.effects.length > 0
    }
    case 'erosion-retired': {
      const e = snapshot.observation.erosion
      return !!e && e.shrineId === condition.id && !!e.use && e.effects.length === e.targets.length && e.effects.length > 0 &&
        e.effects.every(effect => effect.retired && effect.samples.length === 64)
    }
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
