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
    } else {
      if (task.phase === Phase.Enter) person.flags4 = ((person.flags4 & 0xfffefff8) | 1) >>> 0
      const point = task.phase === Phase.Enter ? site.center : site.outside
      effects.destination(point, task.phase === Phase.Enter && near(person, site.outside, 312))
      face(person, point, 2047)
    }
    person.assignment &= ~16
    recoverPersonMovement(rng, person, effects.animation)
  }
  const limit = task.phase === Phase.NearDoor ? 1080 : 112
  if (!(person.counter & 1) && near(person, { x: person.goalX, y: person.goalY }, limit))
    next(nextMovementPhase[task.phase])
}
