import { recoverPersonMovement, stopPersonMovement, type StatefulPerson } from './person-state.ts'
import {
  releasePersonRoute,
  setDirectPersonDestination,
  type MotionRoutes,
  type RoutedPerson,
} from './person-routes.ts'
import { nativeAngle } from './native-math.ts'
import type { UnitKind } from './model.ts'
import { nativeUnitModel } from './unit-kinds.ts'
import rules from './original-rules.json' with { type: 'json' }
import sprites from './original-units.json' with { type: 'json' }

export type MeleeAttack = 'attack' | 'strike' | 'special'
const short = (n: number) => (n << 16) >> 16
const animationRows = { attack: 10, strike: 8, special: 16, recoil: 9 }

export function meleeAnimationObject(kind: UnitKind, action: MeleeAttack | 'recoil') {
  return rules.personAnimationObjects[animationRows[action] * 9 + nativeUnitModel(kind)]
}

// Timers in 0x518fb0 use the authored object duration. Recoil substates 5/6
// override it for knockback and shamans respectively.
export function meleeDuration(kind: UnitKind, action: MeleeAttack | 'recoil', knockback = false) {
  if (action === 'recoil') {
    if (knockback) return 4
    if (kind === 'shaman') return 7
  }
  const [object, draw] = rules.animationObjects[meleeAnimationObject(kind, action)]
  return (rules.animationDescriptors[draw].step + 1) * sprites.frameCounts[object]
}

// 0x518fb0, ready fighter decision. Distance is from the opponent's assigned
// fight slot, not from the attacker. Choosing an attack consumes no extra RNG.
export function chooseMeleeAttack(
  kind: UnitKind,
  choice: number,
  opponent: { ready: boolean; fighting: boolean; slotDistanceSquared: number },
  groupSize: number
): MeleeAttack | null {
  if (opponent.ready) {
    if (kind === 'shaman') return choice <= 6 ? 'attack' : 'special'
    if (choice <= 4) return 'attack'
    return choice < 14 ? 'special' : 'strike'
  }
  if (choice >= 4 || opponent.slotDistanceSquared >= 129600) return null
  if (!opponent.fighting) return 'special'
  if (groupSize <= 2) return null
  return choice & 1 ? 'strike' : 'special'
}

// 0x518fb0 before attack selection. A ready fighter displaced from its slot
// switches phase now and starts moving on its next visit.
export function approachMeleeSlot(
  w: { randomState: number; routes: MotionRoutes },
  p: StatefulPerson & RoutedPerson & { substate: number; heading: number; h: number },
  slot: { x: number; y: number },
  center: { x: number; y: number },
  outer: boolean,
  effects: {
    animation: (p: StatefulPerson, object: number) => void
    move: (point: { x: number; y: number }) => void
  }
) {
  // The arrival test subtracts signed coordinates without wrapping the delta.
  const arrived = () =>
    Math.abs(short(slot.x) - short(p.x)) <= 11 && Math.abs(short(slot.y) - short(p.y)) <= 11
  if (p.substate === 0) {
    recoverPersonMovement(w, p, effects.animation)
    if (arrived()) {
      effects.move(slot)
      p.substate = 1
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    } else setDirectPersonDestination(w.routes, p, slot)
  }
  if (p.substate !== 1) return false
  if (p.flags2 & 0x40000000) {
    p.flags2 = (p.flags2 & ~0x40000000) >>> 0
    stopPersonMovement(p, effects.animation)
    if (outer) {
      const angle = nativeAngle(short(center.x - p.x), -short(center.y - p.y)) & 2047
      p.heading = angle
      p.angle = p.flags2 & 0x8000 ? (angle + 1024) & 2047 : angle
      releasePersonRoute(w.routes, p)
      p.flags2 = (p.flags2 | 0x1080) >>> 0
      p.turnAngle = angle
    }
  }
  if (arrived()) return true
  p.substate = 0
  p.flags2 = (p.flags2 | 0x40000000) >>> 0
  return false
}
