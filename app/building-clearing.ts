import rules from './original-rules.json' with { type: 'json' }
import { random } from './native-math.ts'
import { faceBuildingPoint, nearBuildingPoint } from './building-work.ts'
import {
  recoverPersonMovement,
  stopPersonMovement,
  setPersonAnimationRow,
  stepPersonWait,
  type StatefulPerson,
  type PersonStateEffects,
} from './person-state.ts'
import { currentPersonOrder, type OrderPool, type OrderedPerson } from './person-orders.ts'
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'
import type { Builder } from './building-workers.ts'

interface Point {
  x: number
  y: number
}
type Worker = StatefulPerson & { counter: number; heading: number; goalX: number; goalY: number }
interface Scenery extends Point {
  id: number
  class: number
  model: number
  flags2: number
}
interface Effects {
  animation: PersonStateEffects['setAnimation']
  destination: (point: Point) => void
  releaseMotion: () => void
}
const short = (n: number) => (n << 16) >> 16
const goal = (p: Worker) => ({ x: p.goalX, y: p.goalY })
const alive = (p: Scenery | undefined) => !!p && p.class !== 0 && !(p.flags2 & 1)
function changePhase(p: Worker, task: Builder, phase: number) {
  task.phase = phase
  p.assignment |= 16
}
function steer(p: Worker, angle: number, effects: Effects) {
  effects.releaseMotion()
  p.turnAngle = angle & 2047
  p.flags2 = (p.flags2 | 0x1080) >>> 0
}

export const SceneryPhase = {
  Deposit: 1,
  Rest: 4,
  Find: 10,
  Approach: 11,
  Retreat: 13,
  Remove: 20,
  Inspect: 21,
  Pickup: 29,
  Harvest: 51,
} as const
const PeoplePhase = { Rest: 4, Wait: 5, Find: 14, Approach: 15, Clear: 16 } as const

// Complete task 3, 0x495d70. Footprint traversal and object lookup retain native
// order; transfer, destruction and loose-log allocation belong to their owners.
export function stepBuildingScenery(
  rng: { randomState: number },
  p: Worker,
  task: Builder,
  site: {
    outside: Point
    scenery: () => Iterable<Scenery>
    target: (id: number) => Scenery | undefined
  },
  effects: Effects & {
    sound: (cue: number, flags: number) => void
    transfer: (target: number, capacity: number) => void
    remove: (target: number) => void
    dropTimber: () => void
  }
) {
  const next = (phase: number) => changePhase(p, task, phase)
  p.flags2 = (p.flags2 & ~0x8000) >>> 0
  if (task.restart) {
    task.restart = false
    task.busy = 0
    next(SceneryPhase.Rest)
  }
  const entering = !!(p.assignment & 16)
  switch (task.phase) {
    case SceneryPhase.Rest:
      if (entering) {
        p.timer = 16
        p.target = 0
      }
      if (stepPersonWait(rng, p, effects, true)) next(SceneryPhase.Find)
      return 0
    case SceneryPhase.Find: {
      if (p.counter & 7) return 0
      // The shipped executable reads person +0x90: bit 10 of command slot 2.
      // Preserve this surprising guard rather than treating it as scenery flags.
      if (!(p.commands[2] & 1024))
        for (const object of site.scenery())
          if (object.class === 5 && rules.sceneryResourceFlags[object.model] & 64) {
            p.target = object.id
            next(SceneryPhase.Approach)
            return 0
          }
      return 2
    }
    case SceneryPhase.Approach: {
      const target = site.target(p.target)
      if (entering) {
        if (!target) throw new Error('Clearing approach has no target record')
        p.assignment &= ~16
        recoverPersonMovement(rng, p, effects.animation)
        effects.destination(target)
        faceBuildingPoint(p, target, 2047)
      }
      if (!alive(target)) next(SceneryPhase.Rest)
      else if (!(p.counter & 1) && nearBuildingPoint(p, goal(p), 112)) next(SceneryPhase.Inspect)
      return 0
    }
    case SceneryPhase.Inspect: {
      if (entering) p.timer = 6
      const target = site.target(p.target)
      if (!alive(target)) {
        next(SceneryPhase.Rest)
        return 0
      }
      if (!stepPersonWait(rng, p, effects, false)) return 0
      const flags = rules.sceneryResourceFlags[target!.model]
      if (flags & 128) next(SceneryPhase.Remove)
      else if (flags & 16) next(SceneryPhase.Harvest)
      else if (target!.model === 11) next(SceneryPhase.Pickup)
      return 0
    }
    case SceneryPhase.Remove:
    case SceneryPhase.Pickup:
    case SceneryPhase.Harvest: {
      if (task.phase === SceneryPhase.Harvest && entering) {
        p.assignment &= ~16
        p.speed = 0
        setPersonAnimationRow(p, 6, effects.animation)
        effects.sound(1, 16)
        p.timer = rules.personHarvestTurns[p.model]
      }
      if (!nearBuildingPoint(p, goal(p), 112)) {
        next(SceneryPhase.Find)
        return 0
      }
      const target = site.target(p.target)
      if (!alive(target)) {
        next(SceneryPhase.Rest)
        return 0
      }
      if (task.phase === SceneryPhase.Remove) {
        effects.remove(p.target)
        next(SceneryPhase.Retreat)
        return 0
      }
      const capacity = short(rules.personWood[p.model])
      if (short(p.cargo) < capacity) {
        if (task.phase === SceneryPhase.Harvest) {
          p.timer = short(p.timer - 1)
          if (p.timer !== 0) return 0
        }
        effects.transfer(p.target, capacity)
      }
      next(SceneryPhase.Deposit)
      return 0
    }
    case SceneryPhase.Retreat:
      if (entering) {
        p.timer = 5
        p.assignment &= ~16
        recoverPersonMovement(rng, p, effects.animation)
        steer(p, p.heading + 1024, effects)
      }
      p.flags2 |= 0x8000
      p.timer = short(p.timer - 1)
      if (!p.timer) {
        stopPersonMovement(p, effects.animation)
        p.flags2 = (p.flags2 & ~0x8000) >>> 0
        if (p.flags2 & 128) p.turnAngle = p.heading
        p.angle = p.heading
        next(SceneryPhase.Rest)
      }
      return 0
    case SceneryPhase.Deposit:
      if (entering) {
        p.assignment &= ~16
        effects.destination(site.outside)
        faceBuildingPoint(p, site.outside, 2047)
        recoverPersonMovement(rng, p, effects.animation)
      }
      if (!(p.counter & 1) && nearBuildingPoint(p, goal(p), 112)) {
        effects.dropTimber()
        next(SceneryPhase.Rest)
      }
  }
  return 0
}

export type ClearingPerson = Pick<
  OrderedPerson,
  | 'id'
  | 'model'
  | 'state'
  | 'x'
  | 'y'
  | 'flags2'
  | 'commands'
  | 'commandCursor'
  | 'immediateCommand'
> & { class: number; tribe: number; speed: number }
// 0x4df1c0 plus task-4's class/tribe/preacher gates.
function obstructsPlan(p: ClearingPerson, tribe: number, orders: OrderPool) {
  if (p.class !== 1 || p.tribe !== tribe) return false
  if (p.state !== 10 || (p.model === 4 && !p.speed)) return true
  const order = currentPersonOrder(orders, p)
  return !!order && !(order.flags & 1) && (order.model === 11 || order.model === 25)
}

// Complete task 4, 0x496220, with native indexed search. Command allocation,
// attachment and person reinitialization are supplied by the live command owner.
export function stepBuildingPeople(
  rng: { randomState: number },
  p: Worker,
  task: Builder,
  site: {
    tribe: number
    orders: OrderPool
    search: Uint8Array
    flags: Uint32Array
    occupants: () => Iterable<ClearingPerson>
    cellPeople: (index: number) => Iterable<ClearingPerson>
    available: (index: number) => boolean
  },
  effects: Effects & {
    allocateOrder: (to: Point) => number
    displace: (person: ClearingPerson, order: number) => void
  }
) {
  const next = (phase: number) => changePhase(p, task, phase)
  if (task.restart) {
    task.restart = false
    next(PeoplePhase.Rest)
  }
  const entering = !!(p.assignment & 16)
  switch (task.phase) {
    case PeoplePhase.Rest:
      if (entering) p.timer = 12
      if (stepPersonWait(rng, p, effects, true)) next(PeoplePhase.Find)
      break
    case PeoplePhase.Wait:
      if (entering) p.timer = 16
      if (!(p.counter & 7)) steer(p, random(rng), effects)
      if (stepPersonWait(rng, p, effects, true)) next(PeoplePhase.Clear)
      break
    case PeoplePhase.Find:
      if (p.counter & 7) break
      for (const other of site.occupants())
        if (obstructsPlan(other, site.tribe, site.orders)) {
          effects.destination({ x: (other.x & 0xfe00) + 256, y: (other.y & 0xfe00) + 256 })
          next(PeoplePhase.Approach)
          return 0
        }
      return 2
    case PeoplePhase.Approach:
      if (entering) {
        p.assignment &= ~16
        recoverPersonMovement(rng, p, effects.animation)
      }
      if (!(p.counter & 1) && nearBuildingPoint(p, goal(p), 112)) next(PeoplePhase.Wait)
      break
    case PeoplePhase.Clear: {
      if (!nearBuildingPoint(p, goal(p), 568)) {
        next(PeoplePhase.Find)
        break
      }
      const id = startIndexedSearch(site.search, 2, p.heading, 0, 16)
      if (id) {
        let destination: Point | null = null
        try {
          for (
            let delta = nextIndexedSearch(site.search, id);
            delta;
            delta = nextIndexedSearch(site.search, id)
          ) {
            const x = ((p.x >> 9) + delta.x) & 127,
              y = ((p.y >> 9) + delta.y) & 127,
              index = y * 128 + x
            if (!(site.flags[index] & 1024) && site.available(index)) {
              destination = { x: x * 512 + 256, y: y * 512 + 256 }
              break
            }
          }
        } finally {
          endIndexedSearch(site.search, id)
        }
        const order = destination && effects.allocateOrder(destination)
        if (order) {
          const index = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
          site.flags[index] |= 0x4000
          for (const other of site.cellPeople(index))
            if (obstructsPlan(other, site.tribe, site.orders) && !(other.flags2 & 0x1000000))
              effects.displace(other, order)
        }
      }
      next(PeoplePhase.Rest)
    }
  }
  return 0
}
