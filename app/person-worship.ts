import { nativeAngle, random } from './native-math.ts'
import { nearBuildingPoint as near } from './building-work.ts'
import { worshipApproach } from './worship.ts'
import type { StatefulPerson } from './person-state.ts'
import type { Animation } from './animation.ts'
import rules from './original-rules.json' with { type: 'json' }

interface Point {
  x: number
  y: number
}
export type WorshipHead = Point & { angle: number; nextSlot: number; slotTimer: number }
export type WorshipPerson = StatefulPerson &
  Animation & {
    counter: number
    h: number
    heading: number
    goalX: number
    goalY: number
    turnY: number
    velocity: { x: number; y: number; z: number }
  }
export interface WorshipEffects {
  findPlace: () => { point: Point; slot: number; mode: number } | null
  occupied: (point: Point) => boolean
  shamanOnly: () => boolean
  destination: (point: Point) => void
  recover: () => void
  disembark: () => void
  anchor: (point: Point) => void
  relocate: (point: Point) => void
  releaseRoute: () => void
  animation: (object: number) => void
  sound: (cue: number) => void
}
const short = (n: number) => (n << 16) >> 16

// Complete command-27 body, 0x43bcc0. Shared motion/route/animation consumers
// retain their existing owners; this controller owns the original task phases.
export function stepWorshipPerson(
  poseRandom: { randomState: number },
  p: WorshipPerson,
  head: WorshipHead,
  frameCounts: ArrayLike<number>,
  e: WorshipEffects
) {
  let done = false
  p.flags2 = (p.flags2 & ~0x200000) >>> 0
  if (p.substate === 0) {
    let check = !(p.counter & 3)
    if (p.flags2 & 0x40000000) {
      p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      e.destination(worshipApproach(head))
      e.recover()
      check = true
    }
    if (check && near(p, { x: p.goalX, y: p.goalY }, 1592)) {
      p.substate = 1
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    }
  } else if (p.substate === 1) {
    if (p.flags2 & 0x40000000) {
      p.animationMode = 0
      p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      const place = e.findPlace()
      p.animationMode = place?.mode ?? 0
      if (p.flags4 & 0x10000000) e.destination(worshipApproach(head))
      else if (place) {
        if (place.mode === 1) {
          head.slotTimer = 16
          head.nextSlot = place.slot + 1 < 50 ? place.slot + 1 : 0
        }
        e.recover()
        e.destination(place.point)
      } else done = true
    }
    if (p.vehicle && near(p, { x: p.goalX, y: p.goalY }, 568)) e.disembark()
    p.flags2 = (p.flags2 | 0x200000) >>> 0
    if (p.flags4 & 0x10000000 || p.counter & 1) return done
    const destination = { x: p.turnAngle, y: p.turnY }
    if (!near(p, destination, 1080)) return done
    if (p.animationMode === 1 && e.occupied(destination)) {
      p.substate = 1
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    } else if (near(p, { x: p.goalX, y: p.goalY }, 12)) {
      if (p.model !== 7 && e.shamanOnly()) {
        done = true
        e.anchor(p)
      }
      if (!done) {
        p.substate = 2
        p.flags2 = (p.flags2 | 0x40000000) >>> 0
        e.relocate(destination)
        p.velocity.x = 0
        p.velocity.y = 0
        p.velocity.z = 0
        p.speed = 0
        p.flags2 = (p.flags2 & ~0x200000) >>> 0
        const angle = nativeAngle(short(head.x - p.x), -short(head.y - p.y)) & 2047
        e.releaseRoute()
        p.turnAngle = angle
        p.flags2 = (p.flags2 | 0x1080) >>> 0
        e.anchor(worshipApproach(head))
      }
    }
  } else if (p.substate === 2 || p.substate === 3) {
    if (p.substate === 2) {
      if (p.model !== 7 && !(p.flags4 & 16)) e.sound(82)
      if (p.flags2 & 0x40000000) {
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
        e.animation(rules.personAnimationObjects[27 + p.model])
        p.f1 = 0
        p.f2 = 0
        p.renderFlags &= ~2
      } else if (!p.f1 && p.f2 >= frameCounts[p.object] - 1) {
        p.substate = 3
        p.flags2 = (p.flags2 | 0x40000000) >>> 0
      }
    } else {
      if (p.flags2 & 0x40000000) {
        p.renderFlags |= 2
        p.f1 = 1
        p.f2 = 0
        p.flags2 = (p.flags2 & ~0x40200000) >>> 0
        p.timer = (random(poseRandom) & 15) + 8
      }
      p.timer = short(p.timer - 1)
      if (!p.timer) {
        p.substate = 2
        p.flags2 = (p.flags2 | 0x40000000) >>> 0
      }
    }
    if (p.flags2 & 0x2004 || p.speed) {
      p.substate = 1
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    }
  }
  return done
}
