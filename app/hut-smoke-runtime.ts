import type { Building, Effect, World } from './world-types.ts'
import { buildingModel, buildingPose, buildingSocketPoint } from './building-shapes.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { random } from './native-math.ts'
import rules from './original-rules.json' with { type: 'json' }
import {
  createHutOccupancySmoke,
  hutOccupancySmokeSocket,
  reconcileHutOccupancySmoke,
  stepHutSmokeRoot,
} from './hut-occupancy-smoke.ts'
import {
  allocateSecondaryEffect,
  createSecondaryEffects,
  releaseSecondaryEffect,
  rebuildSecondaryLists,
} from './secondary-effects.ts'

const eligible = (b: Building) =>
  b.kind === 'hut' &&
  b.team === 'blue' &&
  b.progress >= 1 &&
  b.hp > 0 &&
  (!b.damageState || b.damageState.state === 2)

function smokePosition(w: World, b: Building) {
  const socket = buildingSocketPoint(buildingPose(b), hutOccupancySmokeSocket(buildingModel(b)))
  return { x: socket.x, y: socket.y, h: terrainPointHeight(w.land, socket) + socket.heightOffset }
}

export function hutSmokeState(w: World, b: Building) {
  const owner = w.secondaryEffects,
    existing = owner.roots[b.id]
  if (existing) return existing.state
  owner.roots[b.id] = {
    slot: null,
    state: createHutOccupancySmoke(b.counter, 0, 0, owner.animationFrame),
  }
  reconcileWorldHutSmoke(w, b)
  return owner.roots[b.id].state
}

export function reconcileWorldHutSmoke(w: World, b: Building) {
  const owner = w.secondaryEffects
  if (!eligible(b) && !owner.roots[b.id]) return
  owner.roots[b.id] ??= {
    slot: null,
    state: createHutOccupancySmoke(b.counter, 0, 0, owner.animationFrame),
  }
  const record = owner.roots[b.id]
  const occupants = eligible(b) ? w.units.filter(u => u.inside === b.id && u.hp > 0).length : 0,
    capacity = eligible(b) ? rules.buildingCapacity[buildingModel(b)] : 0
  if (!reconcileHutOccupancySmoke(record.state, occupants, capacity, owner.animationFrame)) return
  if (record.slot !== null) releaseSecondaryEffect(owner, record.slot)
  record.slot = null
  const { root } = record.state
  if (!root) return
  record.slot = allocateSecondaryEffect(
    owner,
    { kind: 'hutRoot', building: b.id, counter: w.effectCounter, position: smokePosition(w, b) },
    root.mode === 'full' ? 10 : 20
  )
  if (record.slot === null) record.state.root = null
}

export function registerSecondaryMarker(w: World, effect: Effect) {
  return (
    allocateSecondaryEffect(w.secondaryEffects, {
      kind: 'orderMarker',
      effect: effect.id,
      counter: w.effectCounter,
    }) !== null
  )
}

// One chronological secondary traversal follows the primary building/person pass.
// The copied order defers children prepended during this traversal to the next turn.
export function stepSecondaryEffects(w: World) {
  const owner = w.secondaryEffects
  if (owner.lastTurn === w.turn) return
  owner.lastTurn = w.turn
  for (const [id, record] of Object.entries(owner.roots)) {
    const building = w.buildings.find(b => b.id === Number(id))
    if (!building || !eligible(building)) {
      if (record.slot !== null) releaseSecondaryEffect(owner, record.slot)
      record.slot = null
      record.state.root = null
    }
    if (building) record.state.lastBuildingCounter = building.counter & 255
  }
  const visits = [...owner.order]
  for (const slot of visits) {
    const effect = owner.slots[slot]
    if (!effect) continue
    effect.counter = (effect.counter + 1) & 255
    if (effect.kind === 'orderMarker') {
      const visual = w.effects.find(f => f.id === effect.effect)
      if (visual) visual.age += 1 / 12
      if (!visual || --visual.turnsRemaining! === 0 || visual.age >= visual.duration) {
        if (visual) visual.duration = visual.age
        releaseSecondaryEffect(owner, slot)
      }
    } else if (effect.kind === 'hutPuff') {
      if (--effect.lifetime === 0) releaseSecondaryEffect(owner, slot)
    } else {
      const root = owner.roots[effect.building]?.state.root
      if (!root) {
        releaseSecondaryEffect(owner, slot)
        continue
      }
      if (root.mode === 'full' && !(effect.counter & 7) && (random(w.cosmeticRandom) & 31) < 2)
        allocateSecondaryEffect(
          owner,
          {
            kind: 'hutPuff',
            counter: w.effectCounter,
            position: { ...effect.position },
            lifetime: 16,
            frameStart: owner.animationFrame,
          },
          20
        )
      stepHutSmokeRoot(root, () => random(w.cosmeticRandom), owner.animationFrame)
    }
  }
  w.effects = w.effects.filter(f => f.age < f.duration)
}

export function restoreSecondaryEffects(w: World) {
  if (!w.secondaryEffects) {
    w.secondaryEffects = createSecondaryEffects(w.turn)
    // Legacy browser markers were unbounded. Discard any that cannot acquire
    // an owner, otherwise the secondary-only expiry pass would never visit them.
    w.effects = w.effects.filter(
      effect => effect.kind !== 'orderMarker' || registerSecondaryMarker(w, effect)
    )
  }
  rebuildSecondaryLists(w.secondaryEffects)
  // DOM panels/previews are transient and are rebuilt by their actual adapters.
  w.secondaryEffects.reservations = []
  // Older saves could retain a burning hut's root until occupant evacuation.
  // Restore the same eligibility now, including when play resumes paused.
  for (const building of w.buildings)
    if (!eligible(building)) reconcileWorldHutSmoke(w, building)
}
