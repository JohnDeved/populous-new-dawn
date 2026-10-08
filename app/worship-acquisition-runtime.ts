import {
  createWorshipAcquisitionState,
  startWorshipAcquisition,
  startBuildingAcquisition,
  stepWorshipAcquisition,
  type WorshipAcquisitionGeometry,
  type WorshipAcquisitionState,
  type WorshipAcquisitionDrawCommand,
  type WorshipTargetModel,
} from './worship-acquisition.ts'
import { random } from './native-math.ts'
import type { Gift, World } from './world-types.ts'

export interface WorshipAcquisitionRuntime {
  controllers: WorshipAcquisitionState
  requests: number[]
  previousDrawCommands: WorshipAcquisitionDrawCommand[]
  clock: {
    elapsed: number
    nextVisit: number
    lastVisit: number
    limiter: number
    normalRate: number
  }
}

export function createWorshipAcquisitionRuntime(): WorshipAcquisitionRuntime {
  return {
    controllers: createWorshipAcquisitionState(),
    requests: [],
    previousDrawCommands: [],
    clock: { elapsed: 0, nextVisit: 0, lastVisit: 0, limiter: 0, normalRate: 40 },
  }
}

// Source-derived nominal periods. The native loop samples both candidates
// before drawing, then selects using the limiter after the UI controllers run.
export function worshipDeadline(clock: WorshipAcquisitionRuntime['clock'], preLimiter: number) {
  const helperRate = preLimiter & 2 ? 14 : preLimiter & 4 ? 20 : preLimiter & 1 ? 24 : 60,
    normalRate = Math.max(12, Math.min(60, Math.trunc(clock.normalRate)))
  return clock.nextVisit + Math.trunc(1000 / (clock.limiter ? helperRate : normalRate))
}

export interface WorshipHandoffBridge {
  geometry: (gift: Gift) => WorshipAcquisitionGeometry | null
  cue: () => void
  failed: (gift: Gift) => void
}

export function startPendingWorshipAcquisitions(world: World, bridge: WorshipHandoffBridge) {
  const requests = world.worshipAcquisition.requests
  world.worshipAcquisition.requests = []
  const gifts = requests.flatMap(id => {
    const gift = world.gifts.find(candidate => candidate.id === id)
    return (gift?.ordinaryWorship || gift?.buildingAcquisition) && gift.recipient === world.manaWorld.playerTribe ? [gift] : []
  })
  // Completion-time clones prepend to the native list. Same-turn heads are
  // visited newest authored head first, then their links in ascending slot order.
  // Reverse that clone order here only; the browser payout traversal is unchanged.
  gifts.sort((a, b) => {
    const first = (a.ordinaryWorship ?? a.buildingAcquisition)!,
      second = (b.ordinaryWorship ?? b.buildingAcquisition)!
    return (
      second.completedTurn - first.completedTurn ||
      first.head - second.head ||
      second.slot - first.slot ||
      second.serial - first.serial
    )
  })
  for (const gift of gifts) {
    bridge.cue()
    let geometry: WorshipAcquisitionGeometry | null = null
    try {
      geometry = bridge.geometry(gift)
    } catch {
      // A detached/failed HUD must not throw out of the clock or defer a handoff.
    }
    if (!geometry) {
      bridge.failed(gift)
      continue
    }
    if (gift.buildingAcquisition) {
      startBuildingAcquisition(world.worshipAcquisition.controllers, { giftId: gift.id, geometry }, () => random(world.cosmeticRandom))
      continue
    }
    startWorshipAcquisition(world.worshipAcquisition.controllers, {
      giftId: gift.id,
      model: gift.ordinaryWorship!.model,
      geometry,
    })
  }
}

export function visitWorshipAcquisition(
  world: World,
  reselectPanel: (model: WorshipTargetModel) => void
) {
  const state = world.worshipAcquisition,
    paused = world.paused || !!(world.land.landFlags & 2)
  state.previousDrawCommands = state.controllers.drawCommands
  state.clock.lastVisit = state.clock.nextVisit
  const result = stepWorshipAcquisition(state.controllers, {
    paused,
    random: () => random(world.cosmeticRandom),
  })
  if (result.buildingArrival) reselectPanel(7)
  for (const arrival of result.arrivals) {
    // Native panel reopening precedes the arrival flag/handle/timer checks.
    reselectPanel(arrival.model)
    if (world.land.landFlags & 8) continue
    const gift = world.gifts.find(candidate => candidate.id === arrival.giftId)
    if (gift?.ordinaryWorship && gift.remaining > 1) gift.remaining = 1
  }
  state.clock.limiter = result.limiterActive ? state.clock.limiter | 4 : state.clock.limiter & ~4
}
