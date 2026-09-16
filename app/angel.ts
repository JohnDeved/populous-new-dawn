import { movePosition, nativeAngle, short } from './native-math.ts'
import { browserPosition, wrappedDistance, wrappedPlanarDelta } from './world-coordinates.ts'
import { tribeForTeam, type AngelState, type Effect, type Unit, type World } from './world-types.ts'

const STRIKE_DISTANCE = 0x1f8
// ponytail: bounded chase speed until the native 600 speed field's movement scaling is recovered.
const FLIGHT_STEP = 128

export function createAngelState(): AngelState {
  return {
    phase: 'seeking',
    target: null,
    heading: 0,
    timer: 0,
    // FUN_004d2740 state 28 initializes AOD_DURATION at +0x97.
    lifetime: 2500,
  }
}

function nearestEnemy(w: World, angel: Effect) {
  let nearest: Unit | undefined,
    distance = Infinity
  const tribe = tribeForTeam(angel.team!)
  for (const unit of w.units) {
    const targetTribe = tribeForTeam(unit.team),
      person =
        unit.flight ??
        unit.fight?.motion ??
        unit.native ??
        unit.entry?.person ??
        unit.builder?.person
    if (
      unit.hp <= 0 ||
      unit.inside !== null ||
      unit.invisibility ||
      !!((person?.flags4 ?? 0) & 0x1000) ||
      targetTribe < 0 ||
      targetTribe === tribe ||
      !!(w.outcome.alliances[tribe] & (1 << targetTribe))
    )
      continue
    const candidate = wrappedDistance(angel, unit)
    if (candidate < distance) {
      nearest = unit
      distance = candidate
    }
  }
  return nearest
}

function faceAndMove(angel: Effect, target: Unit) {
  const delta = wrappedPlanarDelta(angel, target),
    angle = nativeAngle(delta.x, delta.z),
    position = {
      x: (Math.round(angel.x * 256) + 2048) & 65535,
      y: (-Math.round(angel.z * 256) - 2048) & 65535,
    }
  angel.angel!.heading = Math.PI - (angle * Math.PI) / 1024
  movePosition(position, angle, FLIGHT_STEP)
  Object.assign(angel, browserPosition({ x: short(position.x), y: short(position.y) }))
}

export type AngelEvent = { hit?: Unit; expired?: true }

function inStrikeRange(angel: Effect, target: Unit) {
  const delta = wrappedPlanarDelta(angel, target)
  return Math.abs(delta.x) < STRIKE_DISTANCE && Math.abs(delta.z) < STRIKE_DISTANCE
}

export function stepAngel(w: World, angel: Effect): AngelEvent {
  const state = angel.angel!
  if (state.phase === 'dying') {
    if (--state.timer <= 0) return { expired: true }
    return {}
  }
  if (--state.lifetime <= 0) {
    state.phase = 'dying'
    state.timer = 16
    state.target = null
    return {}
  }
  if (state.phase === 'striking') {
    const target = w.units.find(unit => unit.id === state.target)
    if (state.timer > 8 && (!target || target.hp <= 0)) {
      state.phase = 'seeking'
      state.target = null
      return {}
    }
    state.timer--
    if (state.timer === 8 && target) return { hit: target }
    if (state.timer <= 0) {
      state.phase = 'seeking'
      state.target = null
    }
    return {}
  }
  const target =
    w.units.find(unit => unit.id === state.target && unit.hp > 0) ?? nearestEnemy(w, angel)
  state.target = target?.id ?? null
  if (!target) return {}
  if (inStrikeRange(angel, target)) {
    state.phase = 'striking'
    state.timer = 28
    return {}
  }
  faceAndMove(angel, target)
  return {}
}
