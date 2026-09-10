import rules from './original-rules.json' with { type: 'json' }
import { nativeAngle } from './native-math.ts'
import { pursuitDestinationChanged } from './person-routes.ts'
import {
  recoverPersonMovement,
  stopPersonMovement,
  type StatefulPerson,
  type PersonStateEffects,
} from './person-state.ts'
import type { PersonOrder } from './person-orders.ts'

interface Point {
  x: number
  y: number
}
type Target = Point & { class: number; flags2: number; vehicle: number }
export type PursuingPerson = StatefulPerson & { goalX: number; goalY: number; heading: number }
interface MotionEffects {
  animation: PersonStateEffects['setAnimation']
  destination: (point: Point) => void
}
const short = (n: number) => (n << 16) >> 16
const near = (a: Point, b: Point, radius: number) =>
  Math.abs(short(a.x) - short(b.x)) < radius && Math.abs(short(a.y) - short(b.y)) < radius

function faceTarget(p: PursuingPerson, target: Point) {
  const angle = nativeAngle(short(target.x - p.x), -short(target.y - p.y))
  if (p.flags2 & 128) p.turnAngle = angle
  p.heading = angle
  p.angle = p.flags2 & 0x8000 ? (angle + 1024) & 2047 : angle
}

export const PursuitResult = { Moving: 0, Arrived: 1, Lost: 2, Blocked: 3 } as const

// Complete 0x439850. Destination/arrival comparisons use signed coordinates,
// while entry facing uses a wrapped delta. The caller owns the 64-turn timer.
export function stepCombatPursuit(
  rng: { randomState: number },
  p: PursuingPerson,
  target: Target | undefined,
  radius: number,
  e: MotionEffects
) {
  if (p.assignment & 16) {
    if (!target) throw new Error('Pursuit entry requires its allocated target')
    p.assignment &= ~16
    p.flags4 = ((p.flags4 & ~0x10007) | 0x10000) >>> 0
    recoverPersonMovement(rng, p, e.animation)
    e.destination(target)
    faceTarget(p, target)
    p.flags2 = (p.flags2 | 512) >>> 0
  }
  let result: number = PursuitResult.Lost
  if (
    target &&
    target.class &&
    !(target.flags2 & 1) &&
    (!target.vehicle || rules.personModels[p.model].flags & 0x2000)
  ) {
    p.timer = short(p.timer - 1)
    if (p.timer) {
      if (pursuitDestinationChanged(p, target, radius)) e.destination(target)
      result = near({ x: p.goalX, y: p.goalY }, p, radius + 56)
        ? PursuitResult.Arrived
        : PursuitResult.Moving
    }
  }
  if (p.flags4 & 0x10000000) {
    p.flags4 = (p.flags4 & ~0x10000000) >>> 0
    result = PursuitResult.Blocked
  }
  return result
}

// Complete 0x520300: after selecting a target, recover ordinary motion and
// prepare vehicle travel. Ranged followers first check whether they can fire.
export function beginCombatPursuit(
  rng: { randomState: number },
  p: PursuingPerson,
  order: PersonOrder,
  target: Target,
  e: MotionEffects & {
    canFire: (target: Target) => boolean
    commandPosition: (order: PersonOrder) => Point
    vehicleDestination: (point: Point, mode: number) => void
  }
) {
  p.assignment &= ~8
  const ranged = p.model === 6
  if (ranged) {
    faceTarget(p, target)
    if (e.canFire(target)) {
      if (!p.vehicle || !(p.flags4 & 0x2000000)) {
        stopPersonMovement(p, e.animation)
        e.destination(p)
      }
      return false
    }
    if (near({ x: p.goalX, y: p.goalY }, p, 568) || (p.vehicle && !(p.flags4 & 0x2000000)))
      return true
  }
  recoverPersonMovement(rng, p, e.animation)
  if (!ranged) e.vehicleDestination(e.commandPosition(order), 1)
  return false
}

// Complete 0x438af0: the attack area's arrival gate differs from pursuit arrival.
// Range/vehicle readiness are existing native consumers supplied by the caller.
export function withinCombatArea(
  p: Pick<PursuingPerson, 'model' | 'vehicle' | 'flags4' | 'x' | 'y' | 'goalX' | 'goalY'>,
  order: PersonOrder,
  target: Target | undefined,
  e: { vehicleReady: () => boolean; range: () => number }
) {
  if (p.model !== 6 && p.vehicle && !e.vehicleReady()) return false
  const area = !!(rules.personCommands[order.model].flags & 0x800)
  let center: Point = p
  if (p.flags4 & 0x80000) center = { x: p.goalX, y: p.goalY }
  else if (area) center = { x: ((order.a & 254) + 1) * 256, y: (((order.a >>> 8) & 254) + 1) * 256 }
  else if (target && target.class && !(target.flags2 & 1)) center = target
  let radius: number
  if (p.model === 6) radius = e.range() * 256
  else {
    let extent: number
    if (order.flags & 4) extent = 3072
    else if (!area || !(order.b & 255) || !(order.b >>> 8)) extent = e.range()
    else extent = Math.max((order.b & 255) + 1, (order.b >>> 8) + 1)
    radius = (extent + 1) * 512
  }
  return near(p, center, radius + 56)
}

interface EntranceEffects extends MotionEffects {
  inside: () => Point
  outside: () => Point
  directDestination: (point: Point) => void
}

// 0x438db0 and 0x439030 differ only in the permitted structure collision bit.
export function approachCombatPlan(
  rng: { randomState: number },
  p: PursuingPerson & { counter: number },
  e: EntranceEffects
) {
  return enterCombatStructure(rng, p, e, 1)
}

export function enterCombatBuilding(
  rng: { randomState: number },
  p: PursuingPerson & { counter: number },
  e: EntranceEffects
) {
  return enterCombatStructure(rng, p, e, 4)
}

function enterCombatStructure(
  rng: { randomState: number },
  p: PursuingPerson & { counter: number },
  e: EntranceEffects,
  permission: number
) {
  if (p.assignment & 16) {
    p.assignment &= ~16
    p.flags4 = ((p.flags4 & ~0x10007) | permission) >>> 0
    const inside = e.inside(),
      outside = e.outside()
    if (near(outside, p, 312)) e.directDestination(inside)
    else e.destination(inside)
    faceTarget(p, inside)
    recoverPersonMovement(rng, p, e.animation)
  }
  return !(p.counter & 1) && near({ x: p.goalX, y: p.goalY }, p, 112)
}

// Complete 0x438f20: stop outside the entrance before attempting entry.
export function approachCombatBuilding(
  rng: { randomState: number },
  p: PursuingPerson & { counter: number },
  radius: number,
  e: MotionEffects & { outside: () => Point }
) {
  if (p.assignment & 16) {
    p.assignment &= ~16
    const outside = e.outside()
    e.destination(outside)
    faceTarget(p, outside)
    recoverPersonMovement(rng, p, e.animation)
  }
  return !(p.counter & 1) && near({ x: p.goalX, y: p.goalY }, p, radius + 56)
}

// Complete 0x439480: movement recovery and arrival for a preselected strike point.
export function approachCombatPosition(
  rng: { randomState: number },
  p: PursuingPerson & { counter: number },
  animation: PersonStateEffects['setAnimation']
) {
  if (p.assignment & 16) {
    p.assignment &= ~16
    recoverPersonMovement(rng, p, animation)
  }
  return !(p.counter & 1) && near({ x: p.goalX, y: p.goalY }, p, 112)
}
