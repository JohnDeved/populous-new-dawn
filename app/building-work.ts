import rules from './original-rules.json' with { type: 'json' }
import { movePosition, nativeAngle, random } from './native-math.ts'
import {
  recoverPersonMovement,
  stopPersonMovement,
  setPersonAnimationRow,
  type StatefulPerson,
  type PersonStateEffects,
} from './person-state.ts'
import type { Builder } from './building-workers.ts'

interface Point {
  x: number
  y: number
}
type Worker = StatefulPerson & { counter: number; heading: number; goalX: number; goalY: number }
interface WorkSite {
  model: number
  building: number
  occupied: number
  center: Point
  outside: Point
}
interface WorkEffects {
  destination: (point: Point, direct: boolean) => void
  animation: PersonStateEffects['setAnimation']
  rest: () => void
  sound: (cue: number, flags: number) => void
}
const short = (n: number) => (n << 16) >> 16
const near = (a: Point, b: Point, limit: number) =>
  Math.abs(short(a.x) - short(b.x)) < limit && Math.abs(short(a.y) - short(b.y)) < limit
const Phase = { NearDoor: 54, Approach: 1, Enter: 3, Wander: 23, Work: 4 } as const
const nextMovementPhase: Record<number, number> = {
  [Phase.NearDoor]: Phase.Approach,
  [Phase.Approach]: Phase.Enter,
  [Phase.Enter]: Phase.Wander,
  [Phase.Wander]: Phase.Work,
}

function face(person: Worker, to: Point, mask: number) {
  const angle = nativeAngle(short(to.x - person.x), -short(to.y - person.y)) & mask
  if (person.flags2 & 128) person.turnAngle = angle
  person.heading = angle
  person.angle = person.flags2 & 0x8000 ? (angle + 1024) & 2047 : angle
}

function approach(
  rng: { randomState: number },
  person: Worker,
  site: WorkSite,
  enter: boolean,
  effects: Pick<WorkEffects, 'destination' | 'animation'>
) {
  if (enter) person.flags4 = ((person.flags4 & 0xfffefff8) | 1) >>> 0
  const point = enter ? site.center : site.outside
  effects.destination(point, enter && near(person, site.outside, 312))
  face(person, point, 2047)
  person.assignment &= ~16
  recoverPersonMovement(rng, person, effects.animation)
}

// Task 2, 0x4958f0, including its approach/arrival and wait consumers.
export function stepBuildingWork(
  rng: { randomState: number },
  person: Worker,
  task: Builder,
  site: WorkSite,
  effects: WorkEffects
) {
  const next = (phase: number) => {
    task.phase = phase
    person.assignment |= 16
  }
  if (task.restart) {
    task.restart = false
    task.busy = 1
    next(site.building & 255 && !(site.occupied & 255) ? Phase.NearDoor : Phase.Wander)
    if (site.occupied & 255) person.flags4 = ((person.flags4 & 0xfffefff8) | 1) >>> 0
  }
  if (task.phase === Phase.Work) {
    if (person.assignment & 16) {
      person.assignment &= ~16
      if (site.building) {
        face(person, site.center, 255) // This action retains the original eight-bit heading mask.
        person.speed = 0
        setPersonAnimationRow(person, 6, effects.animation)
        effects.sound(20, 16)
        person.timer = (random(rng) & 15) + 16
      } else {
        stopPersonMovement(person, effects.animation)
        person.timer = (random(rng) & 7) + 8
        effects.rest()
      }
    }
    if (task.busy) task.busy = (task.busy - 1) & 255
    person.timer = short(person.timer - 1)
    if (!person.timer) {
      task.busy = 0
      next(Phase.Wander)
    }
    return
  }
  if (!Object.hasOwn(nextMovementPhase, task.phase)) return
  if (task.phase !== Phase.NearDoor) task.busy = 0
  if (person.assignment & 16) {
    if (task.phase === Phase.Wander) {
      const point = { ...site.center },
        radius = rules.buildingWorkRadius[site.model]
      movePosition(point, random(rng) & 2047, site.building ? radius : radius >> 1)
      effects.destination(point, true)
      face(person, point, 2047)
      person.assignment &= ~16
      recoverPersonMovement(rng, person, effects.animation)
    } else approach(rng, person, site, task.phase === Phase.Enter, effects)
  }
  const limit = task.phase === Phase.NearDoor ? 1080 : 112
  if (!(person.counter & 1) && near(person, { x: person.goalX, y: person.goalY }, limit))
    next(nextMovementPhase[task.phase])
}

const Departure = {
  Door: 2,
  Center: 3,
  Rest: 4,
  Settle: 5,
  Ready: 6,
  Turn: 18,
  ClearSite: 19,
  FaceSite: 21,
} as const

// Task 9, 0x497690. Readiness belongs to the plan's completion gate; reaching
// phase 6 does not itself remove the worker or its assignment.
export function stepBuildingDeparture(
  rng: { randomState: number },
  person: Worker,
  task: Builder,
  site: WorkSite & { onBuilding: boolean },
  effects: Pick<WorkEffects, 'destination' | 'animation'> & { releaseMotion: () => void }
) {
  const next = (phase: number) => {
    task.phase = phase
    person.assignment |= 16
  }
  const steer = (angle: number) => {
    effects.releaseMotion()
    person.turnAngle = angle & 2047
    person.flags2 = (person.flags2 | 0x1080) >>> 0
  }
  if (task.restart) {
    task.restart = false
    next(site.onBuilding ? Departure.Center : Departure.ClearSite)
  }
  const entering = !!(person.assignment & 16)
  switch (task.phase) {
    case Departure.Door:
    case Departure.Center:
      if (entering) approach(rng, person, site, task.phase === Departure.Center, effects)
      if (!(person.counter & 1) && near(person, { x: person.goalX, y: person.goalY }, 112))
        next(task.phase === Departure.Center ? Departure.Rest : Departure.Turn)
      return
    case Departure.ClearSite:
      if (entering) {
        person.assignment &= ~16
        let angle = random(rng)
        if (rules.buildingFlags[site.model] & 512)
          angle =
            nativeAngle(
              short(site.outside.x - site.center.x),
              -short(site.outside.y - site.center.y)
            ) +
            (angle & 1023) -
            512
        recoverPersonMovement(rng, person, effects.animation)
        steer(angle)
      }
      if (!(person.counter & 3) && !(site.occupied & 1023)) next(Departure.FaceSite)
      return
    case Departure.Ready:
      if (entering) {
        person.assignment &= ~16
        stopPersonMovement(person, effects.animation)
      }
      if (!(person.counter & 31) && site.occupied & 1023) next(Departure.Door)
      return
    case Departure.Rest:
    case Departure.Settle:
    case Departure.Turn:
    case Departure.FaceSite:
      if (entering) {
        switch (task.phase) {
          case Departure.Rest:
            person.timer = (random(rng) & 7) + 1
            break
          case Departure.Settle:
            person.timer = 6
            break
          case Departure.Turn:
            person.timer = 5
            steer(person.heading + (random(rng) % 796) - 398)
            break
          case Departure.FaceSite:
            person.timer = 1
            face(person, site.center, 2047)
            break
        }
        person.assignment &= ~16
        if (task.phase === Departure.Turn) recoverPersonMovement(rng, person, effects.animation)
        else stopPersonMovement(person, effects.animation)
      }
      if (task.phase === Departure.Rest && !(person.counter & 31)) steer(random(rng))
      person.timer = short(person.timer - 1)
      if (!person.timer) {
        switch (task.phase) {
          case Departure.Rest:
            next(Departure.Door)
            break
          case Departure.Settle:
            next(Departure.Ready)
            break
          case Departure.Turn:
            next(Departure.FaceSite)
            break
          case Departure.FaceSite:
            next(Departure.Settle)
            break
        }
      }
  }
}
