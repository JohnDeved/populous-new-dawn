import type { NativePoint } from './world-types.ts'
import type { HutOccupancySmokeState } from './hut-occupancy-smoke.ts'

interface SecondaryBase {
  serial: number
  counter: number
}
type SecondaryContent =
  | { kind: 'hutRoot'; building: number; position: NativePoint }
  | { kind: 'hutPuff'; position: NativePoint; lifetime: number; frameStart: number }
  | { kind: 'orderMarker'; effect: number }
export type SecondaryEffect = SecondaryBase & SecondaryContent
export interface SecondaryEffects {
  slots: (SecondaryEffect | null)[]
  free: number[]
  order: number[]
  nextSerial: number
  animationFrame: number
  lastTurn: number
  roots: Record<number, { state: HutOccupancySmokeState; slot: number | null }>
  reservations: string[]
}

export function createSecondaryEffects(turn = 0): SecondaryEffects {
  return {
    slots: Array(160).fill(null),
    free: Array.from({ length: 160 }, (_, index) => index),
    order: [],
    nextSerial: 1,
    animationFrame: 0,
    lastTurn: turn,
    roots: {},
    reservations: [],
  }
}

export function secondaryEffectCount(state: SecondaryEffects) {
  return state.order.length + state.reservations.length
}

export function allocateSecondaryEffect(
  state: SecondaryEffects,
  effect: Omit<SecondaryBase, 'serial'> & SecondaryContent,
  reserve = 0
) {
  const count = secondaryEffectCount(state)
  if (count > 160 - reserve || count >= 160 || !state.free.length) return null
  const slot = state.free.pop()!
  state.slots[slot] = { ...effect, serial: state.nextSerial++ }
  state.order.unshift(slot)
  return slot
}

export function releaseSecondaryEffect(state: SecondaryEffects, slot: number) {
  if (!state.slots[slot]) return
  state.slots[slot] = null
  state.order.splice(state.order.indexOf(slot), 1)
  state.free.push(slot)
}

// 004ee300 reconstructs both lists from physical slots. Save/restore retains
// counters/lifetimes but must not accidentally invent a new allocation order.
export function rebuildSecondaryLists(state: SecondaryEffects) {
  state.order = []
  state.free = []
  for (const [slot, effect] of state.slots.entries()) {
    if (effect) state.order.unshift(slot)
    else state.free.push(slot)
  }
}
