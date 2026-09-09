import rules from './original-rules.json' with { type: 'json' }
import { dropCarriedTimber } from './timber.ts'
import { random, nativeAngle } from './native-math.ts'
import { positionsOverlap } from './person-motion.ts'
import { stepPersonPose, type Animation } from './animation.ts'
import {
  randomPersonSpeed,
  setPersonAnimationRow,
  personAnimationObject,
  stopPersonMovement,
  resetPersonMotion,
  defaultPersonState,
  type StatefulPerson,
  type PersonStateEffects,
} from './person-state.ts'

type Point = { x: number; y: number }
export type IdlePerson = StatefulPerson &
  Animation & {
    counter: number
    h: number
    heading: number
    goalX: number
    goalY: number
    anchorFlags: number
    commandPhase: number
  }
export type IdleWorld = {
  randomState: number
  turn: number
  poseRandom: { randomState: number }
  shamans: ReadonlyMap<number, Point>
  slotOffsets: readonly (readonly Point[])[]
}
export type IdleEffects = {
  setAnimation: PersonStateEffects['setAnimation']
  releaseMotion: () => void
  occupied: () => boolean
  validSlot: () => boolean
  findSlot: () => boolean
  directDestination: (to: Point) => void
  insert: (to: Point & { h: number }) => void
  height: (to: Point) => number
  allocateLog: () => boolean
  sound: (cue: number) => void
  refreshCell: (cell: number) => void
  frameCount: (object: number) => number
}
const short = (n: number) => (n << 16) >> 16
const near = (a: Point, b: Point, limit: number) =>
  Math.abs(short(a.x) - short(b.x)) < limit && Math.abs(short(a.y) - short(b.y)) < limit

type ApproachingPerson = StatefulPerson & {
  counter: number
  slowTurn: number
  goalX: number
  goalY: number
  anchorX: number
  anchorY: number
}
type ApproachEffects = {
  setAnimation: PersonStateEffects['setAnimation']
  collision: (point: Point) => number
  height: (point: Point) => number
  searchStart: () => number
  searchNext: (id: number) => Point | null
  searchEnd: (id: number) => void
  destination: (point: Point) => void
  allocateOrder: () => number
  adjacentBuilding: () => number
  buildingPoint: (id: number) => Point
  prepareOrder: (id: number, model: number, point: Point) => void
  occupied: () => boolean
  clearOrders: () => void
  attachOrder: (id: number) => void
  initialize: () => void
}

// Complete 0x4d3dd0 and the state-17 controller embedded in 0x4d32b0.
export function samePersonCell(a: Point, b: Point) {
  return !(((a.x ^ b.x) | (a.y ^ b.y)) & 0xfe00)
}
export function stepIdleApproach(p: ApproachingPerson, collision: ApproachEffects['collision']) {
  const next = !p.slowTurn && samePersonCell(p, { x: p.goalX, y: p.goalY }) ? 19 : 0
  if (p.flags2 & 0x2004 || (!(p.counter & 15) && p.flags2 & 0x800)) {
    if (collision({ x: p.anchorX, y: p.anchorY })) p.flags2 = (p.flags2 | 16) >>> 0
  }
  return next
}

// Complete 0x4d6f90, including search failure, inside/vehicle transitions and
// preacher command creation. Indexed search is explicitly type 2, angle 0,
// range 0..32 (the native allocator clamps the last radius to 31).
export function initializeIdleApproach(
  gameFlags: number,
  p: ApproachingPerson,
  e: ApproachEffects
) {
  const transition = (state: number) => {
    if (!(p.flags2 & 0x100000)) {
      p.previousState = p.state
      p.state = state
      e.initialize()
    }
  }
  if (p.vehicle) {
    transition(30)
    return
  }
  let search = true
  if (
    rules.personModels[p.model].flags & 0x400 &&
    near({ x: p.anchorX, y: p.anchorY }, p, 568) &&
    !e.collision(p)
  ) {
    search = false
    p.speed = 0
    setPersonAnimationRow(p, p.cargo ? 4 : 0, e.setAnimation)
    p.anchorX = p.x
    p.anchorY = p.y
  }
  if (search) {
    const center = { x: (p.anchorX >> 8) & 254, y: (p.anchorY >> 8) & 254 },
      id = e.searchStart()
    let chosen: Point | null = null
    if (id) {
      for (let delta = e.searchNext(id); delta; delta = e.searchNext(id)) {
        const to = {
          x: ((((center.x + delta.x * 2) & 254) + 1) * 256) & 65535,
          y: ((((center.y + delta.y * 2) & 254) + 1) * 256) & 65535,
        }
        e.height(to) // 0x4d72d0 computes height even though only XY survive.
        if (!e.collision(to)) {
          chosen = to
          break
        }
      }
      e.searchEnd(id)
    }
    if (chosen) {
      p.anchorX = chosen.x
      p.anchorY = chosen.y
    }
    e.destination({ x: p.anchorX, y: p.anchorY })
  }
  if (p.flags2 & 0x800000) {
    transition(21)
    return
  }
  if (p.model === 4) {
    const id = e.allocateOrder()
    if (!id) return
    let model = 17,
      to = { x: p.anchorX, y: p.anchorY }
    if (p.flags2 & 0x800000) {
      const building = e.adjacentBuilding()
      if (building) {
        model = 31
        to = e.buildingPoint(building)
      }
    }
    e.prepareOrder(id, model, to)
    if (!e.occupied()) p.flags3 = (p.flags3 | 1) >>> 0
    e.clearOrders()
    e.attachOrder(id)
    resetPersonMotion(p)
    transition(defaultPersonState(p, gameFlags))
  } else {
    const next = stepIdleApproach(p, e.collision)
    if (next) transition(next)
  }
}

// Complete 0x4d5650. Slot zero is the center used while turning back to rest.
// Shape 0 and 6 share the native default pointer at 0x895ef1.
export function idleSlotPosition(
  offsets: IdleWorld['slotOffsets'],
  cell: number,
  flags: number,
  index = flags & 15
) {
  const offset = offsets[flags >> 4][index]
  return {
    x: (((cell & 254) + 1) * 256 + offset.x) & 65535,
    y: ((((cell >> 8) & 254) + 1) * 256 + offset.y) & 65535,
  }
}

// Complete 0x4d7330, state-19 initialization after reaching the anchor cell.
export function initializeRestingPerson(
  w: Pick<IdleWorld, 'turn'>,
  p: IdlePerson,
  e: Pick<IdleEffects, 'setAnimation' | 'releaseMotion'>
) {
  if (w.turn >>> 0 > 1) p.stateObject = 0
  p.flags2 = (p.flags2 | 0x40000000) >>> 0
  p.substate = 0
  if (rules.personModels[p.model].flags & 0x400) {
    stopPersonMovement(p, e.setAnimation)
    p.substate = 8
  }
  p.flags2 = (p.flags2 | 0x40000000) >>> 0
  p.assignment |= 1
  e.releaseMotion()
}

// Complete 0x4d73e0. Slot search/ownership, allocation and world insertion are
// explicit consumers. Preserve same-turn fallthrough and the two RNG streams.
export function stepRestingPerson(w: IdleWorld, p: IdlePerson, e: IdleEffects) {
  let result = 0,
    reposition = false
  const animation = () => {
    const object = personAnimationObject(p)
    if (object !== -1) e.setAnimation(p, object)
  }
  const rest = () => setPersonAnimationRow(p, p.cargo ? 4 : 0, e.setAnimation)
  const slot = (index = p.anchorFlags & 15) =>
    idleSlotPosition(w.slotOffsets, p.formationCell, p.anchorFlags, index)
  const faceHeading = () => {
    if (p.flags2 & 128) p.turnAngle = p.heading
    p.angle = p.flags2 & 0x8000 ? (p.heading + 1024) & 2047 : p.heading
  }
  const drop = () => dropCarriedTimber(p, e.allocateLog, () => e.sound(11))
  if (!e.occupied() && !(p.flags4 & 0x800)) p.stateObject = (p.stateObject + 1) & 65535
  if (p.flags2 & 0x2004)
    return positionsOverlap(p, 56, { x: p.goalX, y: p.goalY }, 512) ? 0 : p.previousState
  if (p.substate === 0) {
    if (!(p.anchorFlags & 15) || !e.validSlot()) {
      if (!e.findSlot()) result = 1
      else p.substate = near(slot(), p, 48) ? 3 : 1
    } else p.substate = 1
  }
  if (p.substate === 1) {
    p.substate = 2
    p.flags2 = (p.flags2 | 0x200200) >>> 0
    p.speed = randomPersonSpeed(w, p)
    setPersonAnimationRow(p, p.cargo ? 5 : 1, e.setAnimation)
    const to = slot()
    p.flags2 = (near(to, p, 216) ? p.flags2 | 32 : p.flags2 & ~32) >>> 0
    e.directDestination(to)
  }
  if (p.substate === 2) {
    reposition = true
    if (!e.validSlot()) p.substate = 0
    else if (near(slot(), p, 48)) p.substate = 3
    if (p.substate !== 2) {
      faceHeading()
      p.flags2 = (p.flags2 & ~0x200220) >>> 0
    }
  }
  switch (p.substate) {
    case 3: {
      p.substate = 4
      p.timer = 10
      const to = slot()
      e.insert({ ...to, h: e.height(to) })
      p.speed = 0
      p.flags4 = (p.flags4 & ~0x400) >>> 0
      rest()
      if ((p.anchorFlags & 240) > 16) {
        e.directDestination(slot(0))
        faceHeading()
      }
    }
    // falls through
    case 4:
      p.timer = short(p.timer - 1)
      reposition = true
      if (!p.timer) {
        p.flags2 = (p.flags2 | 0x40000000) >>> 0
        p.substate = 5
        drop()
        animation()
        e.refreshCell(p.formationCell)
      }
      break
    case 5:
      reposition = true
      if (p.flags2 & 0x40000000) {
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
        rest()
      }
      if (!(p.counter & 31)) {
        if ((random(w) & 31) > 18) {
          p.substate = 6
          p.flags2 = (p.flags2 | 0x40000000) >>> 0
        }
        if ((random(w) & 63) > 60) {
          p.substate = 10
          p.flags2 = (p.flags2 | 0x40000000) >>> 0
        }
      }
      break
    case 6:
      p.substate = 7
      p.timer = (random(w) % 28) + 4
      {
        const heading = p.heading
        e.releaseMotion()
        p.turnAngle = (heading + (p.timer & 1 ? 768 : -768)) & 2047
        p.flags2 = (p.flags2 | 0x201080) >>> 0
      }
    // falls through
    case 7:
      p.timer = short(p.timer - 1)
      reposition = true
      if (!p.timer) {
        p.substate = 5
        p.flags2 = (p.flags2 | 0x40000000) >>> 0
        e.directDestination(slot(0))
        p.flags2 = (p.flags2 & ~0x200000) >>> 0
      }
      break
    case 8:
      if (p.flags2 & 0x40000000) {
        p.speed = 0
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
        rest()
        drop()
      }
      break
    case 9:
      if (p.flags2 & 0x40000000) {
        p.timer = 32
        p.animationMode = 1
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
        p.assignment |= 16
        e.setAnimation(p, rules.personAnimationObjects[27 + p.model])
      }
      stepPersonPose(p, w.poseRandom)
      if (!(p.counter & 3)) {
        const shaman = w.shamans.get(p.tribe)
        if (shaman) {
          const angle = nativeAngle(short(shaman.x - p.x), -short(shaman.y - p.y))
          e.releaseMotion()
          p.turnAngle = angle & 2047
          p.flags2 = (p.flags2 | 0x1080) >>> 0
        }
      }
      p.timer = short(p.timer - 1)
      if (!p.timer) {
        const shaman = w.shamans.get(p.tribe)
        if (!shaman || !near(shaman, p, 2360)) {
          p.substate = 5
          p.flags2 = (p.flags2 | 0x40000000) >>> 0
          animation()
        } else p.timer = 32
      }
      break
    case 10:
      if (p.flags2 & 0x40000000) {
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
        if (p.model === 2 || ([3, 6].includes(p.model) && (p.anchorFlags & 240) <= 16)) {
          e.setAnimation(p, p.model === 2 ? 161 : p.model === 3 ? 162 : 163)
          p.timer = 1
        } else if (![3, 6].includes(p.model)) p.timer = 0
        // Native uses global 0x5a6adc, not this person's animation object.
        if (p.timer)
          p.timer = short(
            (rules.animationDescriptors[p.draw].step + 1) *
              e.frameCount(rules.restingAnimationFrameSource) +
              1
          )
      }
      p.timer = short(p.timer - 1)
      if (p.timer < 1) {
        p.flags2 = (p.flags2 | 0x40000000) >>> 0
        p.timer = 0
        p.substate = 5
      } else if (!p.f1 && p.f2 >= e.frameCount(short(p.object)) - 1) rest()
      break
  }
  if (reposition && !(p.counter & 3) && p.assignment & 2) {
    p.substate = 1
    p.assignment &= ~2
  }
  return result
}
