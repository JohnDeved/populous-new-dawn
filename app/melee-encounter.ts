import { nativeAngle, random } from './native-math.ts'
import { groundVelocity } from './person-motion.ts'
import {
  releasePersonRoute,
  setDirectPersonDestination,
  type MotionRoutes,
  type RoutedPerson,
} from './person-routes.ts'
import {
  setPersonAnimationRow,
  stopPersonMovement,
  stepPersonIdleGesture,
  type StatefulPerson,
} from './person-state.ts'
import type { Animation } from './animation.ts'
import rules from './original-rules.json' with { type: 'json' }
import sprites from './original-units.json' with { type: 'json' }

export const EncounterPhase = {
  Wait: 4,
  Approach: 5,
  Strike: 6,
  Knockback: 7,
  Reapproach: 8,
} as const

export type EncounterPerson = StatefulPerson &
  RoutedPerson &
  Animation & {
    heading: number
    slowTurn: number
    velocity: { x: number; y: number; z: number }
  }
interface EncounterWorld {
  randomState: number
  gameFlags: number
  routes: MotionRoutes
}
interface EncounterEffects {
  animation: (p: StatefulPerson, object: number) => void
  height: (x: number, y: number) => number
  sound: (p: EncounterPerson, cue: number) => void
}
const short = (n: number) => (n << 16) >> 16
const duration = (p: Animation) =>
  (rules.animationDescriptors[p.draw].step + 1) * sprites.frameCounts[p.object]

function face(w: EncounterWorld, p: EncounterPerson, target: EncounterPerson, snap: boolean) {
  const angle = nativeAngle(short(target.x - p.x), -short(target.y - p.y)) & 2047
  if (snap) {
    p.heading = angle
    p.angle = p.flags2 & 0x8000 ? (angle + 1024) & 2047 : angle
  }
  releasePersonRoute(w.routes, p)
  p.flags2 = (p.flags2 | 0x1080) >>> 0
  p.turnAngle = angle
  return angle
}

function change(p: EncounterPerson, phase: number) {
  p.substate = phase
  p.flags2 = (p.flags2 | 0x40000000) >>> 0
}

// Outdoor branch of 0x518630. The attacker is visited before the defender;
// transitions made by the attacker are visible to the defender on this visit.
// Building encounters (phases 1–3) require their actual occupancy consumers.
export function stepMeleeEncounter(
  w: EncounterWorld,
  attacker: EncounterPerson,
  defender: EncounterPerson,
  e: EncounterEffects
): 'waiting' | 'fight' | 'cancelled' {
  if (attacker.tribe === defender.tribe) return 'cancelled'
  let fight = false
  for (const [p, target] of [
    [attacker, defender],
    [defender, attacker],
  ]) {
    if (p.state !== 29) return fight ? 'fight' : 'cancelled'
    const entering = !!(p.flags2 & 0x40000000)
    if (p.substate >= EncounterPhase.Wait && p.substate <= EncounterPhase.Reapproach)
      p.flags2 = (p.flags2 & ~0x40000000) >>> 0
    switch (p.substate) {
      case EncounterPhase.Wait:
        if (entering) {
          p.timer = 40
          stopPersonMovement(p, e.animation)
          face(w, p, target, false)
        }
        stepPersonIdleGesture(w, p, 8, e.animation, object => sprites.frameCounts[object])
        if (p.timer < 1) return fight ? 'fight' : 'cancelled'
        break
      case EncounterPhase.Approach:
      case EncounterPhase.Reapproach:
        if (entering) {
          p.timer = 40
          // 0x4d5010 uses running speed and omits 0x4d4f40's fast-person multiplier.
          const speed = short(rules.personRunningSpeeds[p.physics])
          p.speed = short(speed + (random(w) % ((speed >> 2) >>> 0 || 1)))
          setPersonAnimationRow(p, p.cargo ? 5 : 1, e.animation)
        }
        setDirectPersonDestination(w.routes, p, target)
        p.timer = short(p.timer - 1)
        if (p.timer < 1) return fight ? 'fight' : 'cancelled'
        if (
          Math.abs(short(target.x) - short(p.x)) < 315 &&
          Math.abs(short(target.y) - short(p.y)) < 315
        ) {
          if (w.gameFlags & 64) fight = true
          else if (p.substate === EncounterPhase.Reapproach) {
            if (defender.substate === EncounterPhase.Wait) fight = true
          } else if (target.substate === EncounterPhase.Wait)
            change(attacker, EncounterPhase.Strike)
        }
        break
      case EncounterPhase.Strike:
        if (entering) {
          p.speed = 0
          setPersonAnimationRow(p, 10, e.animation)
          p.timer = duration(p)
          face(w, p, target, true)
        }
        p.timer = short(p.timer - 1)
        if (p.timer === 2) change(defender, EncounterPhase.Knockback)
        if (p.timer < 1) {
          e.sound(p, 13)
          change(p, EncounterPhase.Reapproach)
        }
        break
      case EncounterPhase.Knockback:
        if (entering) {
          p.timer = 2
          p.flags2 = (p.flags2 | 0x82000) >>> 0
          p.flags4 = (p.flags4 | 0x2000) >>> 0
          p.flags3 = (p.flags3 | 0x8000000) >>> 0
          e.animation(p, rules.personAnimationObjects[11 * 9 + p.model])
          const angle = face(w, p, target, true)
          const spread = random(w) % 682,
            speed = (random(w) % 100) + 100
          groundVelocity(p.velocity, p, speed, (angle + spread + 683) & 2047, e.height)
        }
        if (p.timer < 1) {
          if (!(p.flags2 & 0x80000)) change(p, EncounterPhase.Wait)
        } else {
          p.timer = short(p.timer - 1)
          if (!p.timer) stopPersonMovement(p, e.animation)
        }
        break
      case 1:
      case 2:
      case 3:
        throw new Error('Building encounters require occupancy and exit controllers')
    }
  }
  return fight ? 'fight' : 'waiting'
}
