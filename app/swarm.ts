import { movePosition, nativeAngle, positionDistanceSquared, random, short } from './native-math.ts'
import type { NativePoint } from './world-types.ts'

export const SWARM_LIFETIME = 200
export const SWARM_INSECT_COUNT = 60
export const SWARM_SCAN_INTERVAL = 8
export const SWARM_SPEED = 80

export interface SwarmInsect {
  index?: number
  x: number
  y: number
  h: number
  vx: number
  verticalVelocity?: number
  vy: number
  verticalOffset: number
  jitter: number[]
}

export interface SwarmState {
  tribe: number
  remaining: number
  applied: boolean
  origin: { x: number; y: number }
  x: number
  y: number
  h: number
  heading: number
  wander: number
  insects: SwarmInsect[]
}

const signed9 = (n: number) => (n & 0x1ff) - 0x100
const signed7 = (n: number) => (n & 0x7f) - 0x40
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n))
const div = (n: number, d: number) => Math.trunc(n / d)

// 0x510020 initializes only the model-21 controller. Its 60 model-27 children
// belong to the controller's first processing visit in 0x510120/0x510d40.
export function createSwarmState(
  w: { randomState: number },
  center: NativePoint,
  tribe: number,
  terrainHeight: (p: Pick<NativePoint, 'x' | 'y'>) => number
): SwarmState {
  return {
    tribe,
    remaining: SWARM_LIFETIME,
    applied: false,
    origin: { x: center.x & 65535, y: center.y & 65535 },
    x: center.x & 65535,
    y: center.y & 65535,
    h: terrainHeight(center) + 200,
    heading: random(w) & 0x7ff,
    wander: random(w) & 0x1f,
    insects: [],
  }
}

// 0x510d40. Gameplay RNG order is position x/y, signed controller-relative
// height, three motion fields (0x49/0x4b/0x4d), then ten signed jitter fields.
export function initializeSwarmInsects(w: { randomState: number }, state: SwarmState) {
  if (state.insects.length) return
  for (let index = 0; index < SWARM_INSECT_COUNT; index++) {
    const x = (state.x + signed9(random(w))) & 65535,
      y = (state.y + signed9(random(w))) & 65535,
      verticalOffset = signed7(random(w)),
      vx = random(w) & 0x7f,
      verticalVelocity = random(w) & 0x7f,
      vy = random(w) & 0x7f,
      jitter = Array.from({ length: 10 }, () => signed9(random(w)))
    state.insects.push({
      index,
      x,
      y,
      h: state.h + verticalOffset,
      vx,
      verticalVelocity,
      vy,
      verticalOffset,
      jitter,
    })
  }
}

export function hasSwarmRuntime(value: {
  tribe: number
  remaining: number
  applied: boolean
}): value is SwarmState {
  return Array.isArray((value as SwarmState).insects)
}

export function swarmState(value: {
  tribe: number
  remaining: number
  applied: boolean
}): SwarmState {
  return value as SwarmState
}

export function swarmNeedsScan(state: SwarmState) {
  return (state.remaining & (SWARM_SCAN_INTERVAL - 1)) === 0
}

// 0x510120 removes matching low-nibble child indices during remaining 15..1,
// then clears the survivors when the controller expires. The stable allocation
// ordinal is the browser particle equivalent of the native child index.
export function stepSwarmLifetime(state: SwarmState) {
  if (state.remaining > 0 && state.remaining < 16)
    state.insects = state.insects.filter(
      (insect, index) => ((insect.index ?? index) & 0xf) !== state.remaining
    )
  state.remaining--
  if (state.remaining > 0) return true
  state.insects = []
  return false
}

export function stepSwarmMotion(
  w: { randomState: number },
  state: SwarmState,
  terrainHeight: (p: Pick<NativePoint, 'x' | 'y'>) => number
) {
  if (positionDistanceSquared(state, state.origin) < 0x900001) {
    const before = state.wander
    state.wander = before - 1
    if (before === 0) {
      state.wander = random(w) & 0x1f
      state.heading = random(w) & 0x7ff
    }
  } else {
    state.wander = random(w) & 0x1f
    const dx = short(state.origin.x - state.x),
      dy = short(state.origin.y - state.y)
    state.heading = (nativeAngle(dx, -dy) + (random(w) & 0x7f) - 0x40) & 0x7ff
  }

  const parent = { x: state.x, y: state.y }
  movePosition(parent, state.heading, SWARM_SPEED)
  state.x = parent.x
  state.y = parent.y
  state.h = terrainHeight(parent) + 200

  for (const insect of state.insects) {
    const dx = short(state.x - insect.x),
      dy = short(state.y - insect.y),
      distance = Math.max(1, Math.abs(dx) + Math.abs(dy))
    insect.vx = clamp(insect.vx + div(dx * 32, distance), -128, 128)
    insect.vy = clamp(insect.vy + div(dy * 32, distance), -128, 128)
    insect.x = (insect.x + insect.vx) & 65535
    insect.y = (insect.y + insect.vy) & 65535
    const ground = terrainHeight(insect),
      target = ground + insect.verticalOffset
    if (target < insect.h) insect.h = Math.max(target, insect.h - 35)
    if (insect.h < ground) insect.h = ground + 2
    for (let i = 0; i < insect.jitter.length; i++) {
      const value = insect.jitter[i]
      if (value) insect.jitter[i] = Math.max(0, value - 2)
    }
  }
}
