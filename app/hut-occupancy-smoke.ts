import type { Building } from './world-types.ts'

// Transient presentation listeners: never stored in World/checkpoints. The
// admission owner notifies only after its actual resident slots have changed.
const occupancyListeners = new WeakMap<Building, Set<() => void>>()

export function observeHutOccupancy(building: Building, reconcile: () => void) {
  let listeners = occupancyListeners.get(building)
  if (!listeners) {
    listeners = new Set()
    occupancyListeners.set(building, listeners)
  }
  listeners.add(reconcile)
  return () => {
    listeners.delete(reconcile)
    if (!listeners.size && occupancyListeners.get(building) === listeners)
      occupancyListeners.delete(building)
  }
}

export function notifyHutOccupancy(building: Building) {
  occupancyListeners.get(building)?.forEach(reconcile => reconcile())
}

export type HutSmokeSequence = 'hutSmokePartial' | 'hutSmokeFull'

interface RootSmoke {
  mode: 'partial' | 'full'
  visible: boolean
  lifetime: number
  frameStart: number
}

export interface HutOccupancySmokeState {
  lastBuildingCounter: number
  root: RootSmoke | null
}

export interface HutSmokeLayer {
  sequence: HutSmokeSequence
  frame: number
}

const rootFor = (occupants: number, capacity: number, animationFrame: number): RootSmoke | null => {
  if (occupants <= 0 || capacity <= 0) return null
  return {
    mode: occupants >= capacity ? 'full' : 'partial',
    visible: true,
    lifetime: occupants >= capacity ? -1 : 16,
    frameStart: animationFrame,
  }
}

export function createHutOccupancySmoke(
  buildingCounter: number,
  occupants: number,
  capacity: number,
  animationFrame: number
): HutOccupancySmokeState {
  return {
    lastBuildingCounter: buildingCounter & 255,
    root: rootFor(occupants, capacity, animationFrame),
  }
}

export function reconcileHutOccupancySmoke(
  state: HutOccupancySmokeState,
  occupants: number,
  capacity: number,
  animationFrame: number
) {
  let mode: RootSmoke['mode'] | null = null
  if (occupants > 0 && capacity > 0) mode = occupants >= capacity ? 'full' : 'partial'
  if (!mode) {
    const changed = state.root !== null
    state.root = null
    return changed
  }
  if (state.root?.mode === mode) return false
  state.root = rootFor(occupants, capacity, animationFrame)
  return true
}

function stepPartialRoot(root: RootSmoke, drawRandom: () => number, animationFrame: number) {
  if (root.mode === 'full') return
  if (!root.visible && (drawRandom() & 15) < 3) {
    root.visible = true
    root.lifetime = 16
    root.frameStart = animationFrame
  }
  if (root.visible && root.lifetime > 0 && --root.lifetime === 0) root.visible = false
}

export function stepHutOccupancySmoke(
  state: HutOccupancySmokeState,
  buildingCounter: number,
  occupants: number,
  capacity: number,
  animationFrame: number,
  drawRandom: () => number
) {
  const target = buildingCounter & 255
  let remaining = (target - state.lastBuildingCounter) & 255
  while (remaining-- > 0) {
    state.lastBuildingCounter = (state.lastBuildingCounter + 1) & 255
    // 0x403280 -> 0x40c4e0 samples completed player buildings on this phase.
    // A newly allocated root is not processed again in that same allocated-list visit.
    const allocated =
      !(state.lastBuildingCounter & 31) &&
      reconcileHutOccupancySmoke(state, occupants, capacity, animationFrame)
    if (!allocated && state.root) stepPartialRoot(state.root, drawRandom, animationFrame)
  }
}

const frame = (animationFrame: number, start: number) => (((animationFrame - start) % 16) + 16) % 16

export function hutOccupancySmokeLayer(
  state: HutOccupancySmokeState,
  animationFrame: number
): HutSmokeLayer | null {
  const { root } = state
  if (!root?.visible) return null
  return {
    sequence: root.mode === 'full' ? 'hutSmokeFull' : 'hutSmokePartial',
    frame: frame(animationFrame, root.frameStart),
  }
}
