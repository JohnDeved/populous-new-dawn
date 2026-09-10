import rules from './original-rules.json' with { type: 'json' }
import { movePosition, nativeAngle, random } from './native-math.ts'
import {
  buildingInsidePoint,
  buildingOutsidePoint,
  type BuildingShapePose,
} from './building-shapes.ts'
import { damageBuildingByPerson, shakeBuilding } from './building-damage.ts'
import {
  approachCombatBuilding,
  enterCombatBuilding,
  approachCombatPosition,
} from './combat-pursuit.ts'
import { setPersonAnimationRow, type PersonStateEffects } from './person-state.ts'
import type { CombatApproachPerson } from './combat-approach.ts'

type Attacker = CombatApproachPerson & {
  anchorX: number
  anchorY: number
  anchorFlags: number
  disguise: number
}
type Target = BuildingShapePose &
  Parameters<typeof shakeBuilding>[0] &
  Parameters<typeof damageBuildingByPerson>[1] & { class: number; model: number }
type World = Parameters<typeof damageBuildingByPerson>[0] & { randomState: number }
interface Point {
  x: number
  y: number
}
const short = (n: number) => (n << 16) >> 16
const Phase = {
  Position: 23,
  Approach: 30,
  Enter: 31,
  Challenge: 37,
  Strike: 46,
  SpecialPosition: 52,
  SpecialStrike: 53,
} as const

// Building-target branch of 0x51a2a0. Destination, occupants and encounter
// ownership remain with the world; geometry, poses, timing and damage run here.
export function attackCombatBuilding<T extends { flags2: number }>(
  w: World,
  p: Attacker,
  b: Target,
  e: {
    animation: PersonStateEffects['setAnimation']
    destination: (point: Point) => void
    directDestination: (point: Point) => void
    buildingAt: (point: Point) => number
    hasDefenders: () => boolean
    removeDefender: () => T | undefined
    encounter: (defender: T, mode: number) => void
    releaseMotion: () => void
    sound: (id: number, flags: number) => void
  }
): 'continue' | 'restart' {
  if (b.class !== 2 || b.tribe === p.tribe) return 'restart'
  const phase = (next: number) => {
    p.animationMode = next
    p.assignment |= 16
  }
  const attackPose = () => {
    p.speed = 0
    setPersonAnimationRow(p, 6, e.animation)
  }
  const motion = {
    ...e,
    inside: () => buildingInsidePoint(b),
    outside: () => buildingOutsidePoint(b),
  }
  if (p.flags2 & 0x40000000) {
    p.flags2 = (p.flags2 & ~0x40000000) >>> 0
    phase(b.model === 19 ? Phase.SpecialPosition : Phase.Approach)
  }
  switch (p.animationMode) {
    case Phase.Position: {
      if (p.assignment & 16) {
        const point = buildingInsidePoint(b),
          angle = random(w) & 2047
        if (p.model !== 7) movePosition(point, angle, rules.buildingWorkRadius[b.model])
        e.directDestination(point)
        if (p.flags2 & 128) p.turnAngle = angle
        p.heading = angle
        p.angle = p.flags2 & 0x8000 ? (angle + 1024) & 2047 : angle
      }
      b.buildingFlags |= 16
      if (approachCombatPosition(w, p, e.animation)) phase(Phase.Strike)
      break
    }
    case Phase.Approach:
      if (p.assignment & 16) p.timer = 64
      p.timer = short(p.timer - 1)
      if (p.timer < 0) return 'restart'
      if (approachCombatBuilding(w, p, 56, motion)) phase(Phase.Enter)
      break
    case Phase.Enter:
      if (p.assignment & 16) {
        // 0x4da170: entering an attacked structure reveals an invisible attacker.
        if (p.flags4 & 0x1000) {
          e.sound(53, 0)
          p.flags4 = (p.flags4 & ~0x1000) >>> 0
          p.renderFlags &= ~(w.tribes[w.playerTribe].flags & 8 || p.tribe === w.playerTribe
            ? 0x4000
            : 16)
        }
        p.timer = 64
      }
      p.flags2 = (p.flags2 & ~0x2000000) >>> 0
      b.buildingFlags |= 16
      p.timer = short(p.timer - 1)
      if (p.timer < 0) return 'restart'
      if (enterCombatBuilding(w, p, motion)) {
        if (!e.hasDefenders()) phase(Phase.Position)
        else if (b.state === 1) return 'restart'
        else phase(Phase.Challenge)
      }
      break
    case Phase.Challenge:
      if (p.assignment & 16) {
        p.timer = 16
        p.assignment &= ~16
        attackPose()
      }
      shakeBuilding(b, 6)
      b.buildingFlags |= 16
      if (p.timer > 0) p.timer = short(p.timer - 1)
      else if (!e.hasDefenders()) phase(Phase.Position)
      else if (b.buildingFlags & 4) {
        const defender = e.removeDefender()
        if (!defender) return 'restart'
        defender.flags2 = (defender.flags2 & ~16) >>> 0
        e.encounter(defender, 1)
      }
      break
    case Phase.Strike:
      if (p.assignment & 16) {
        p.assignment &= ~16
        attackPose()
        e.sound(1, 16)
        p.renderFlags &= ~16
        p.timer = (random(w) & 15) + 8
      }
      shakeBuilding(b, 6)
      b.buildingFlags |= 16
      if (!(p.flags4 & 0x800)) damageBuildingByPerson(w, b, p)
      p.timer = short(p.timer - 1)
      if (p.timer < 1) phase(Phase.Position)
      break
    case Phase.SpecialPosition:
      if (p.assignment & 16) {
        const center = { x: (b.x & 0xfe00) + 256, y: (b.y & 0xfe00) + 256 }
        const point = { ...center },
          angle = random(w) & 2047
        movePosition(point, angle, rules.buildingWorkRadius[19])
        const start = { ...point }
        while (e.buildingAt(point) & 1023) {
          movePosition(point, angle, 32)
          // A fully occupied world must not hang the browser; valid searches are unchanged.
          if (point.x === start.x && point.y === start.y) return 'restart'
        }
        e.destination(point)
        p.anchorX = center.x
        p.anchorY = center.y
        p.anchorFlags = 0
      }
      if (approachCombatPosition(w, p, e.animation)) phase(Phase.SpecialStrike)
      break
    case Phase.SpecialStrike:
      if (p.assignment & 16) {
        p.assignment &= ~16
        attackPose()
        const angle = nativeAngle(short(b.x - p.x), -short(b.y - p.y))
        e.releaseMotion()
        p.turnAngle = angle & 2047
        p.flags2 = (p.flags2 | 0x1080) >>> 0
      }
      shakeBuilding(b, 6)
      b.buildingFlags |= 16
      if (!(p.flags4 & 0x800)) damageBuildingByPerson(w, b, p)
      if (p.model === 5) p.disguise = (p.tribe << 6) & 255
      break
  }
  return 'continue'
}
