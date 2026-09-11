import rules from './original-rules.json' with { type: 'json' }
import { nativeAngle, positionDistance, random } from './native-math.ts'
import { faceBuildingPoint, nearBuildingPoint } from './building-work.ts'
import {
  approachCombatBuilding,
  approachCombatPlan,
  approachCombatPosition,
  enterCombatBuilding,
  type PursuingPerson,
} from './combat-pursuit.ts'
import {
  personAnimationObject,
  recoverPersonMovement,
  setPersonAnimationRow,
  stepPersonWait,
  stopPersonMovement,
  type PersonStateEffects,
} from './person-state.ts'
import type { Builder } from './building-workers.ts'

interface Point {
  x: number
  y: number
}
interface TimberTarget extends Point {
  id: number
  class: number
  model: number
  flags2: number
}
interface FetchSite {
  id: number
  class: number
  building: number
  flags3: number
  searchIndex: number
  angle: number
  inside: Point
  outside: Point
  occupied: number
}
interface FetchEffects {
  animation: PersonStateEffects['setAnimation']
  destination: (point: Point) => void
  directDestination: (point: Point) => void
  releaseMotion: () => void
  sound: (cue: number, flags: number) => void
  target: (id: number) => TimberTarget | undefined
  refreshSearch: (point: Point, angle: number) => void
  findWood: (index: number) => number
  looseWood: (point: Point, tribe: number) => number
  reserve: (id: number) => void
  transfer: (from: number, to: number, amount: number) => void
}
type Worker = PursuingPerson & { counter: number }
const short = (n: number) => (n << 16) >> 16
const Phase = {
  Outside: 1,
  Return: 2,
  Inside: 3,
  Harvest: 4,
  Deposit: 5,
  Search: 17,
  Door: 22,
  Approach: 24,
  Retry: 27,
  Lost: 50,
} as const

function steer(p: Worker, angle: number, effects: FetchEffects) {
  effects.releaseMotion()
  p.turnAngle = angle & 2047
  p.flags2 = (p.flags2 | 0x1080) >>> 0
}

// 0x4392a0: this approach retains its original target point, without pursuit
// replanning or consuming the outer hauling controller's timeout.
function approachTimber(rng: { randomState: number }, p: Worker, effects: FetchEffects) {
  const target = p.target ? effects.target(p.target) : undefined
  if (p.assignment & 16) {
    if (!target) throw new Error(`Missing timber target ${p.target}`)
    p.assignment &= ~16
    recoverPersonMovement(rng, p, effects.animation)
    effects.destination(target)
    faceBuildingPoint(p, target, 2047)
  }
  if (!target || !target.class || target.flags2 & 1) return 2
  return Number(!(p.counter & 1) && nearBuildingPoint(p, { x: p.goalX, y: p.goalY }, 112))
}

// 0x439740: leave occupied footprint cells, then wait three clear-cell visits.
function leaveDoor(
  rng: { randomState: number },
  p: Worker,
  occupied: number,
  effects: FetchEffects
) {
  if (p.assignment & 16) {
    p.assignment &= ~16
    steer(p, p.heading + (random(rng) & 511) - 256, effects)
    recoverPersonMovement(rng, p, effects.animation)
    p.timer = 3
  }
  if (occupied & 1023) {
    p.timer = 3
    return false
  }
  if (p.assignment & 16) {
    p.assignment &= ~16
    recoverPersonMovement(rng, p, effects.animation)
  }
  p.timer = short(p.timer - 1)
  return p.timer === 0
}

// Complete task-7 controller, 0x496750. Resource search/cache ownership,
// reservations, transfers and route submission belong to the live world.
// Return 2 hands control back to the plan's work task after delivery.
export function stepBuildingFetch(
  rng: { randomState: number },
  p: Worker,
  task: Builder,
  site: FetchSite,
  effects: FetchEffects
) {
  const next = (phase: number) => {
    task.phase = phase
    p.assignment |= 16
  }
  const returnToSite = () => {
    p.assignment &= ~16
    recoverPersonMovement(rng, p, effects.animation)
    effects.destination(site.outside)
    faceBuildingPoint(p, site.outside, 2047)
  }
  if (task.restart || p.assignment & 16) effects.refreshSearch(site.outside, site.angle)
  if (task.restart) {
    task.restart = false
    next(Phase.Return)
  }
  const entering = !!(p.assignment & 16),
    built = site.class === 2 || !!site.building,
    entrance = () => ({ ...effects, inside: () => site.inside, outside: () => site.outside })
  switch (task.phase) {
    case Phase.Outside:
      if (approachCombatBuilding(rng, p, 56, entrance())) next(Phase.Inside)
      break
    case Phase.Return:
      if (entering) {
        p.assignment &= ~16
        if (built) returnToSite()
        else {
          next(Phase.Search)
          break
        }
      }
      if (!(p.counter & 1) && nearBuildingPoint(p, { x: p.goalX, y: p.goalY }, 112))
        next(Phase.Door)
      break
    case Phase.Inside:
      if ((site.class === 2 ? enterCombatBuilding : approachCombatPlan)(rng, p, entrance()))
        next(Phase.Deposit)
      break
    case Phase.Harvest: {
      const target = p.target ? effects.target(p.target) : undefined
      if (!target || !target.class || target.flags2 & 1) {
        next(Phase.Return)
        break
      }
      if (entering) {
        p.assignment &= ~16
        if (target.class === 5 && rules.sceneryResourceFlags[target.model] & 16) {
          p.speed = 0
          setPersonAnimationRow(p, 6, effects.animation)
          effects.sound(1, 16)
          p.timer = rules.personHarvestTurns[p.model]
        } else {
          p.timer = 3
          stopPersonMovement(p, effects.animation)
        }
      }
      if (stepPersonWait(rng, p, effects, true)) {
        effects.transfer(target.id, p.id, short(rules.personWood[p.model]))
        const object = personAnimationObject(p)
        if (object !== -1) effects.animation(p, object)
        next(!built || nearBuildingPoint(p, site.outside, 248) ? Phase.Inside : Phase.Outside)
      }
      break
    }
    case Phase.Deposit:
      if (entering) p.timer = 8
      if (stepPersonWait(rng, p, effects, true)) {
        effects.transfer(p.id, site.id, short(p.cargo))
        return 2
      }
      break
    case Phase.Search:
      if (entering) {
        p.assignment &= ~16
        stopPersonMovement(p, effects.animation)
        p.timer = 8
      }
      if (p.cargo) next(Phase.Deposit)
      else if (!(p.counter & 7)) {
        effects.refreshSearch(site.outside, site.angle)
        const id = effects.findWood((site.searchIndex << 24) >> 24)
        if (id) {
          p.target = id
          site.flags3 = (site.flags3 & ~0x1000) >>> 0
          next(Phase.Approach)
        } else {
          steer(p, random(rng), effects)
          if (stepPersonWait(rng, p, effects, true)) next(Phase.Retry)
          site.flags3 = (site.flags3 | 0x1000) >>> 0
        }
      }
      break
    case Phase.Door:
      if (entering) {
        const id = effects.looseWood(site.outside, p.tribe)
        if (id) {
          p.target = id
          next(Phase.Approach)
          break
        }
      }
      if (leaveDoor(rng, p, site.occupied, effects)) next(Phase.Search)
      break
    case Phase.Approach:
      if (entering) {
        p.timer = 1024
        approachTimber(rng, p, effects)
        if (p.flags4 & 0x10000000) {
          next(Phase.Retry)
          p.flags4 = (p.flags4 & ~0x10000000) >>> 0
        } else effects.reserve(p.target)
      }
      p.timer = short(p.timer - 1)
      if (p.timer) {
        const result = approachTimber(rng, p, effects)
        if (result) next(result === 1 ? Phase.Harvest : Phase.Lost)
      } else next(Phase.Lost)
      break
    case Phase.Retry:
      if (entering) {
        p.timer = 16
        const angle =
          positionDistance(p, site.outside) < 1025
            ? random(rng)
            : nativeAngle(short(site.outside.x - p.x), -short(site.outside.y - p.y))
        steer(p, angle, effects)
      }
      // 0x4394e0 performs the ordinary arrival visit and decrements its timer,
      // even on the turn that arrival succeeds.
      {
        const arrived = approachCombatPosition(rng, p, effects.animation)
        p.timer = short(p.timer - 1)
        if (arrived || !p.timer) next(Phase.Search)
      }
      break
    case Phase.Lost:
      if (entering) returnToSite()
      if (!(p.counter & 3) && nearBuildingPoint(p, { x: p.goalX, y: p.goalY }, 1080))
        next(Phase.Search)
      break
  }
  return 0
}
