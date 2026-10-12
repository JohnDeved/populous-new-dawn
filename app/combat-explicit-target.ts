import type { CombatTarget, CombatPerson } from './combat-targets.ts'
import type { SearchingCombatPerson } from './combat-order-search.ts'
import type { PersonOrder } from './person-orders.ts'
import { stepPersonWait, type PersonStateEffects } from './person-state.ts'
import { nativeAngle } from './native-math.ts'

interface Point {
  x: number
  y: number
}
const short = (n: number) => (n << 16) >> 16
const near = (a: Point, b: Point) =>
  Math.abs(short(a.x) - short(b.x)) < 1080 && Math.abs(short(a.y) - short(b.y)) < 1080

// 0x51bf10: explicit target tracking precedes attack readiness and selection.
export function trackExplicitCombatTarget(
  p: SearchingCombatPerson,
  target: CombatPerson | undefined,
  e: {
    outside: (target: CombatPerson) => Point | undefined
    destination: (point: Point) => void
    directDestination: (point: Point) => void
    supportsTarget: (target: CombatPerson) => boolean
    targetOnWater: (target: CombatPerson) => boolean
    releaseMotion: () => void
  }
) {
  if (!target || target.flags2 & 1 || target.life < 1) return 1
  if (!(p.counter & 3)) {
    const outside = e.outside(target)
    if (outside) {
      if ((p.goalX ^ outside.x) & 0xfe00 || (p.goalY ^ outside.y) & 0xfe00) e.destination(outside)
    } else if (near(p, target)) e.directDestination(target)
    else if (!near({ x: p.goalX, y: p.goalY }, target)) e.destination(target)
  }
  if (!(p.flags4 & 0x10000000)) return 0
  let blocked = !!(target.flags4 & 0x400) || (!e.supportsTarget(target) && !target.vehicle)
  let result = blocked ? 2 : 0
  if (p.model !== 6) {
    if (target.vehicle) {
      result = 1
      blocked = true
    }
  } else if (target.vehicle && e.targetOnWater(target)) {
    blocked = true
    if (p.flags2 & 0x800) result = 1
    else e.directDestination(target)
  }
  if (blocked) {
    e.releaseMotion()
    p.flags4 = (p.flags4 & ~0x10000000) >>> 0
  }
  return result
}

// Command-28 branch of 0x51c3c0. It does not reserve a freshly scanned target.
export function selectExplicitCombatTarget(
  objects: ReadonlyMap<number, CombatTarget>,
  p: Pick<CombatPerson, 'model'>,
  order: Pick<PersonOrder, 'a' | 'flags'>
) {
  const target = objects.get(order.a)
  if (!target || target.flags2 & 1) return undefined
  if (target.class === 1) {
    if (p.model === 4 && target.model !== 4 && !(order.flags & 64)) return undefined
    if (target.group) {
      const group = objects.get(target.group)
      if (!group) throw new Error('Missing explicit combat group owner')
      if (group.model !== 9) return { target: group, type: 1 }
    }
    return { target, type: 2 }
  }
  if (target.class === 2) return { target, type: 3 }
  return undefined
}

// 0x51fce0 non-Preacher tail. A false shared-body result returns immediately;
// a completed body only finishes this direct order when its target is aboard.
export const explicitCombatCommandResult = (bodyComplete: boolean, targetVehicle: number) =>
  Number(bodyComplete && targetVehicle !== 0)

// 0x51a2a0 substate 12 and 0x439240. The entry visit decrements once before
// the conditional waiting visit; losing the elevated target restarts immediately.
export function pauseExplicitCombatTarget(
  rng: { randomState: number },
  p: SearchingCombatPerson,
  target: CombatPerson | undefined,
  e: { animation: PersonStateEffects['setAnimation']; releaseMotion: () => void }
) {
  if (p.flags2 & 0x40000000) {
    p.timer = 8
    p.assignment |= 16
    const preserved = p.renderFlags & 16
    p.animationMode = 4
    p.flags2 = (p.flags2 & ~0x40000000) >>> 0
    stepPersonWait(rng, p, e, false)
    p.renderFlags |= preserved
  }
  if (target && !(target.flags2 & 1) && target.life > 0 && target.flags4 & 0x400) {
    if (!(p.counter & 3)) {
      const angle = nativeAngle(short(target.x - p.x), -short(target.y - p.y))
      if (p.flags2 & 128) p.turnAngle = angle
      p.heading = angle
      p.angle = p.flags2 & 0x8000 ? (angle + 1024) & 2047 : angle
    }
    if (!stepPersonWait(rng, p, e, false)) return
  }
  p.substate = 0
  p.flags2 = (p.flags2 | 0x40000000) >>> 0
}
