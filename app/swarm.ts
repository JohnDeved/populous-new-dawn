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
  phase?: 0 | 1 | 2 | 3
  hidden?: boolean
  outside?: SwarmPoint
  inside?: SwarmPoint
}

export type SwarmPhase = 'initializing' | 'wandering' | 'building'

export interface SwarmPoint {
  x: number
  y: number
}

export interface SwarmState {
  phase: SwarmPhase
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
  building?: number
  visitedBuildings?: number[]
  stage?: number
  destination?: SwarmPoint
  directed?: boolean
  stopped?: boolean
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
    phase: 'initializing',
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
  const state = value as SwarmState
  state.phase ??= state.insects.length ? 'wandering' : 'initializing'
  return state
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

export function stepSwarmWander(w: { randomState: number }, state: SwarmState) {
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
}

export function stepSwarmMotion(
  w: { randomState: number },
  state: SwarmState,
  terrainHeight: (p: Pick<NativePoint, 'x' | 'y'>) => number,
  wander = true
) {
  if (wander) stepSwarmWander(w, state)
  if (!state.stopped) {
    const heading =
      state.directed && state.destination
        ? nativeAngle(short(state.destination.x - state.x), -short(state.destination.y - state.y))
        : state.heading
    const parent = { x: state.x, y: state.y }
    movePosition(parent, heading, SWARM_SPEED)
    state.x = parent.x
    state.y = parent.y
    state.h = terrainHeight(parent) + 200
  }

  for (const insect of state.insects) {
    if (insect.phase) {
      if (insect.phase === 1) {
        decaySwarmJitter(insect)
        if (stepSwarmInsectTarget(insect, insect.outside!, true, terrainHeight)) insect.phase = 2
      } else if (insect.phase === 2) {
        if (stepSwarmInsectTarget(insect, insect.inside!, false, terrainHeight))
          insect.hidden = true
      } else if (stepSwarmInsectTarget(insect, insect.outside!, false, terrainHeight)) {
        insect.hidden = false
        insect.phase = 0
      }
      continue
    }
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
    decaySwarmJitter(insect)
  }
}

// 005112d0; retained signed-word arithmetic also covers supplied edge values.
export function decaySwarmJitter(insect: SwarmInsect) {
  for (let i = 0; i < insect.jitter.length; i++)
    if (insect.jitter[i]) insect.jitter[i] = Math.max(0, short(insect.jitter[i] - 2))
}

// 00511180. Arrival tests signed coordinates separately, not wrapped deltas.
export function stepSwarmInsectTarget(
  insect: SwarmInsect,
  target: SwarmPoint,
  resetVelocity: boolean,
  terrainHeight: (p: SwarmPoint) => number
) {
  const dx = short(target.x) - short(insect.x),
    dy = short(target.y) - short(insect.y),
    distance = Math.abs(dx) + Math.abs(dy)
  if (resetVelocity) {
    insect.vx = short(div(dx, 2))
    insect.vy = short(div(dy, 2))
  }
  if (distance < 200) return true
  insect.vx = clamp(short(insect.vx + div(dx * 32, distance)), -64, 64)
  insect.vy = clamp(short(insect.vy + div(dy * 32, distance)), -64, 64)
  insect.x = (insect.x + insect.vx) & 65535
  insect.y = (insect.y + insect.vy) & 65535
  const ground = terrainHeight(insect),
    height = ground + insect.verticalOffset
  if (short(insect.h) > height) insect.h = short(Math.max(short(insect.h - 35), height))
  if (short(insect.h) < ground) insect.h = short(ground + 2)
  return false
}

export interface SwarmBuildingEffects {
  acquire: (history: readonly number[]) => number | undefined
  valid: (id: number) => boolean
  outside: (id: number) => SwarmPoint
  inside: (id: number) => SwarmPoint
  eject: (id: number) => void
}

// 00510120 parent phases. Exactly one stage runs per visit; the caller owns
// common ground scans, parent/child motion, and the always-running lifetime.
export function stepSwarmBuilding(
  w: { randomState: number },
  state: SwarmState,
  effects: SwarmBuildingEffects
) {
  if (state.phase === 'wandering') {
    state.directed = false
    stepSwarmWander(w, state)
    if (state.remaining & 63) return
    state.visitedBuildings ??= []
    const history = state.visitedBuildings
    const id = effects.acquire(history)
    if (id === undefined) return
    if (history.length < 10) history.push(id)
    else history[random(w) % 10] = id
    state.building = id
    state.phase = 'building'
    state.stage = 0
    return
  }
  if (state.phase !== 'building') return
  const id = state.building!
  if (!effects.valid(id)) {
    state.phase = 'wandering'
    return
  }
  switch (state.stage) {
    case 0:
      state.stage = 1
      break
    case 1:
      state.destination = effects.outside(id)
      state.directed = true
      state.stage = 2
      break
    case 2:
      if (
        Math.abs(short(state.destination!.x) - short(state.x)) < 112 &&
        Math.abs(short(state.destination!.y) - short(state.y)) < 112
      )
        state.stage = 3
      break
    case 3:
      for (const insect of state.insects) {
        insect.outside = { ...state.destination! }
        insect.inside = effects.inside(id)
        insect.phase = 1
      }
      state.stopped = true
      state.stage = 4
      break
    case 4:
      if (state.insects.every(insect => insect.hidden)) state.stage = 5
      break
    case 5:
      effects.eject(id)
      state.wander = 4
      state.stage = 6
      break
    case 6:
      if (--state.wander <= 0) state.stage = 7
      break
    case 7:
      for (const insect of state.insects) {
        insect.phase = 3
        insect.jitter = Array.from({ length: 10 }, () => signed9(random(w)))
      }
      state.stage = 8
      break
    case 8:
      if (state.insects.every(insect => !insect.hidden)) state.stage = 9
      break
    case 9:
      for (const insect of state.insects) {
        insect.vx = random(w) & 127
        insect.verticalVelocity = random(w) & 127
        insect.vy = random(w) & 127
      }
      state.phase = 'wandering'
      state.stopped = false
      break
  }
}
