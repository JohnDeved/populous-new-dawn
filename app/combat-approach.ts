import { nativeAngle, random } from './native-math.ts'
import { stepCombatPursuit, PursuitResult, type PursuingPerson } from './combat-pursuit.ts'
import {
  stopPersonMovement,
  stepPersonIdleGesture,
  stepPersonWait,
  type PersonStateEffects,
} from './person-state.ts'

interface Point {
  x: number
  y: number
}
export type CombatApproachPerson = PursuingPerson & {
  counter: number
  commandPhase: number // Last observed member count; native byte +0xaa.
  object: number
  draw: number
  slowTurn: number
}
export type ApproachedFight = Point & {
  id: number
  class: number
  flags2: number
  flags4: number
  vehicle: number
  count: number
  reactionTimer: number
}
interface FightApproachEffects {
  animation: PersonStateEffects['setAnimation']
  frameCount: (object: number) => number
  plannedDestination: (point: Point) => void
  directDestination: (point: Point) => void
  available: () => boolean
  waitingPosition: () => Point
  move: (point: Point) => void
  releaseMotion: () => void
}
const Phase = { Approach: 34, Position: 38, FaceAway: 39, FaceFight: 40 } as const
const short = (n: number) => (n << 16) >> 16
const near = (a: Point, b: Point, radius: number) =>
  Math.abs(short(a.x) - short(b.x)) < radius && Math.abs(short(a.y) - short(b.y)) < radius

// Fight-target branch of 0x51a2a0, substate 1. The outer attack-order controller
// owns target selection/validity, its common entry flags, and join/retry dispatch.
export function approachFight(
  rng: { randomState: number },
  p: CombatApproachPerson,
  fight: ApproachedFight,
  e: FightApproachEffects
): 'continue' | 'join' | 'restart' {
  const phase = (next: number) => {
    p.animationMode = next
    p.assignment |= 16
  }
  const pursue = (radius: number) =>
    stepCombatPursuit(rng, p, fight, radius, {
      animation: e.animation,
      destination: e.plannedDestination,
    })
  if (p.flags2 & 0x40000000) {
    p.target = fight.id
    p.flags2 = (p.flags2 & ~0x40000000) >>> 0
    phase(Phase.Approach)
    p.commandPhase = fight.count
  }
  let result: 'continue' | 'join' | 'restart' = 'continue'
  const approaching = p.animationMode === Phase.Approach
  switch (p.animationMode) {
    case Phase.Approach: {
      if (p.assignment & 16) {
        p.timer = 64
        p.commandPhase = fight.count
      }
      const progress = pursue(224)
      if (progress === PursuitResult.Moving) {
        if (near({ x: p.goalX, y: p.goalY }, p, 504) && !e.available()) phase(Phase.Position)
        if (fight.count !== p.commandPhase && !e.available()) result = 'restart'
      } else if (progress === PursuitResult.Arrived) {
        if (e.available()) result = 'join'
        else phase(Phase.Position)
      } else result = 'restart'
      break
    }
    case Phase.Position: {
      if (p.assignment & 16) {
        p.timer = 64
        pursue(0)
      }
      p.timer = short(p.timer - 1)
      if (p.timer === 0) result = 'restart'
      else {
        const to = e.waitingPosition()
        e.directDestination(to)
        if (near(to, p, 112) && !(p.flags4 & 0x400)) {
          e.move(to)
          stopPersonMovement(p, e.animation)
          phase(Phase.FaceFight)
        }
      }
      break
    }
    case Phase.FaceAway:
    case Phase.FaceFight: {
      if (p.assignment & 16) {
        p.assignment &= ~16
        let angle = nativeAngle(short(fight.x - p.x), -short(fight.y - p.y))
        if (p.animationMode === Phase.FaceAway) angle = (angle + 1024) & 2047
        if (p.flags2 & 128) p.turnAngle = angle
        p.heading = angle
        p.angle = p.flags2 & 0x8000 ? (angle + 1024) & 2047 : angle
        p.timer = 16
        stopPersonMovement(p, e.animation)
      }
      const away = p.animationMode === Phase.FaceAway
      if (!(p.counter & (away ? 3 : 1))) {
        const angle = p.heading - (away ? 142 : 56) + (random(rng) % (away ? 284 : 113))
        e.releaseMotion()
        p.turnAngle = angle & 65535
        p.flags2 = (p.flags2 | 0x1080) >>> 0
      }
      stepPersonIdleGesture(rng, p, 32, e.animation, e.frameCount)
      p.timer = short(p.timer - 1)
      if (p.timer === 0) phase(away ? Phase.FaceFight : Phase.FaceAway)
      if (!(p.counter & 7) && !near(e.waitingPosition(), p, 112)) phase(Phase.Position)
      break
    }
  }
  if (!approaching && fight.count !== p.commandPhase) phase(Phase.Approach)
  if (result === 'restart') {
    fight.flags4 = (fight.flags4 & ~0x100000) >>> 0
    if (fight.reactionTimer) fight.reactionTimer = (fight.reactionTimer - 1) & 255
  }
  return result
}

type PursuedPerson = Point & {
  id: number
  class: number
  tribe: number
  life: number
  flags2: number
  vehicle: number
  workFlags: number
}

// Person-target branches of 0x51a2a0: pursuit (2), housed approach (6), and
// waiting for an existing encounter (8). The caller creates encounters/retries.
export function approachCombatPerson(
  rng: { randomState: number },
  p: CombatApproachPerson,
  target: PursuedPerson,
  e: Pick<
    FightApproachEffects,
    'animation' | 'frameCount' | 'plannedDestination' | 'releaseMotion'
  > & {
    buildingAt: (point: Point) => { flags: number; id: number }
    approachBuilding: (radius: number) => boolean
    fightModel: (id: number) => number
  }
): 'continue' | 'encounter' | 'inside' | 'restart' | 'retarget' {
  if (target.tribe === p.tribe || target.life < 1) return 'restart'
  const change = (state: number) => {
    p.substate = state
    p.flags2 = (p.flags2 | 0x40000000) >>> 0
  }
  switch (p.substate) {
    case 2: {
      let probe = !(p.counter & 3)
      if (p.flags2 & 0x40000000) {
        p.target = target.id
        p.timer = 64
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
        probe = true
      }
      const building = probe ? e.buildingAt(target) : undefined
      if (building && building.flags & 512) {
        change(6)
        p.target = building.id
        return 'continue'
      }
      const progress = stepCombatPursuit(rng, p, target, 224, {
        animation: e.animation,
        destination: e.plannedDestination,
      })
      if (progress === PursuitResult.Moving) {
        if (near({ x: p.goalX, y: p.goalY }, p, 280) && target.workFlags) change(8)
      } else if (progress === PursuitResult.Arrived) {
        if (!target.workFlags) return 'encounter'
        if (e.fightModel(target.workFlags) !== 9) return 'restart'
        change(8)
      } else return 'restart'
      return 'continue'
    }
    case 6: {
      if (target.workFlags) return 'restart'
      const building = short(p.target)
      p.workTarget = building & 65535
      let ready = false
      if (p.flags2 & 0x40000000) {
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
        ready = e.buildingAt(p).id === building && e.buildingAt(target).id === building
        if (!ready) {
          p.assignment |= 16
          p.timer = 64
          p.animationMode = 30
        }
      }
      let result: 'continue' | 'inside' | 'restart' = 'continue'
      if (!ready) {
        p.timer = short(p.timer - 1)
        if (p.timer < 0) result = 'restart'
        else if (e.approachBuilding(56)) {
          if (e.buildingAt(target).id === short(p.target)) ready = true
          else change(2)
        }
      }
      if (ready) result = 'inside'
      p.workTarget = target.id
      return result
    }
    case 8: {
      if (p.flags2 & 0x40000000) {
        p.timer = 8
        p.assignment &= ~16
        p.speed = 0
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      }
      stepPersonIdleGesture(rng, p, 8, e.animation, e.frameCount)
      const available = !target.workFlags || e.fightModel(target.workFlags) !== 9
      const expired = stepPersonWait(rng, p, e, true)
      return available || expired ? 'retarget' : 'continue'
    }
    default:
      throw new Error(`Unsupported person-target approach state ${p.substate}`)
  }
}

// Substate 7 of 0x51a2a0. Entry visits the wait helper twice and preserves only
// the original pose's render bit 16 across the first initialization.
export function retryCombatTarget(
  rng: { randomState: number },
  p: CombatApproachPerson,
  e: Pick<FightApproachEffects, 'animation' | 'releaseMotion'>
) {
  if (p.flags2 & 0x40000000) {
    p.timer = 16
    p.assignment |= 16
    const preserved = p.renderFlags & 16
    p.animationMode = 4
    p.flags2 = (p.flags2 & ~0x40000000) >>> 0
    stepPersonWait(rng, p, e, true)
    p.renderFlags |= preserved
  }
  if (stepPersonWait(rng, p, e, true)) {
    p.substate = 0
    p.flags2 = (p.flags2 | 0x40000000) >>> 0
  }
}
