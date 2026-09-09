import rules from './original-rules.json' with { type: 'json' }
import sprites from './original-units.json' with { type: 'json' }
import { movePosition, random } from './native-math.ts'
import {
  recoverPersonMovement,
  stopPersonMovement,
  setPersonAnimationRow,
  type StatefulPerson,
  type PersonStateEffects,
} from './person-state.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'
import type { Animation } from './animation.ts'
import type { Builder } from './building-workers.ts'

type Worker = StatefulPerson &
  Animation & { counter: number; h: number; goalX: number; goalY: number }
interface Vertex {
  index: number
  mask: number
}
const short = (n: number) => (n << 16) >> 16
const signedByte = (n: number) => (n << 24) >> 24
const Phase = { Rest: 4, Approach: 7, Rise: 8, Grade: 9, Pause: 21, Stamp: 28 } as const
function arrived(person: Worker) {
  const distance = (a: number, b: number) => {
    const d = Math.abs(short(a) - short(b))
    return d > 32767 ? 65535 - d : d
  }
  return distance(person.x, person.goalX) < 32 && distance(person.y, person.goalY) < 32
}

// Task 8, 0x497030: seek a grade vertex, approach, stamp/jump and alter its
// height. Terrain queues and movement integration remain shared world consumers.
export function stepBuildingLevel(
  rng: { randomState: number },
  person: Worker,
  task: Builder,
  plan: { model: number; height: number; alternateHeight: number; revalidate: boolean },
  land: Pick<NativeTerrain, 'heights' | 'flags'>,
  vertices: () => Vertex[],
  effects: {
    animation: PersonStateEffects['setAnimation']
    destination: (point: { x: number; y: number }) => void
    releaseMotion: () => void
    terrainChanged: (index: number) => void
    sound: (cue: number, flags: number) => void
  }
) {
  const next = (phase: number) => {
    task.phase = phase
    person.assignment |= 16
  }
  person.flags2 = (person.flags2 & ~0x200200) >>> 0
  if (task.restart) {
    task.restart = false
    next(Phase.Rest)
  }
  const entering = !!(person.assignment & 16)
  switch (task.phase) {
    case Phase.Rest:
    case Phase.Pause: {
      const resting = task.phase === Phase.Rest,
        carrying = person.model === 7 || person.cargo !== 0
      if (entering) {
        person.timer = carrying ? 6 : 3
        if (resting) person.timer = 8
      }
      if (!resting && carrying && person.timer === 2)
        setPersonAnimationRow(person, person.cargo ? 5 : 1, effects.animation)
      if (entering) {
        person.assignment &= ~16
        stopPersonMovement(person, effects.animation)
      }
      if (resting && !(person.counter & 31)) {
        const angle = random(rng) & 2047
        effects.releaseMotion()
        person.turnAngle = angle
        person.flags2 = (person.flags2 | 0x1080) >>> 0
      }
      person.timer = short(person.timer - 1)
      if (!person.timer) {
        if (resting) next(Phase.Approach)
        else next(carrying ? Phase.Rise : Phase.Stamp)
      }
      return
    }
    case Phase.Approach: {
      person.flags2 |= 0x200000
      if (entering) {
        person.assignment &= ~16
        const points = vertices()
        if (!points.length) throw new RangeError('Building has no terrain grade vertices')
        const start = random(rng) % points.length
        let chosen = -1
        for (let i = 0; i < points.length; i++) {
          const index = (start + i) % points.length,
            h = land.heights[points[index].index]
          if (
            plan.model === 10
              ? h !== plan.height && h !== plan.alternateHeight
              : Math.abs(h - plan.height) > 1
          ) {
            chosen = index
            break
          }
        }
        if (chosen < 0) return 2
        task.busy = chosen & 255
        const vertex = points[chosen],
          { index } = vertex
        let angle = 256
        if (!(vertex.mask & 1)) {
          const west = (index & ~127) | ((index - 1) & 127)
          const neighbors = [(index - 128) & 16383, (west - 128) & 16383, west]
          const facing = neighbors.findIndex(i => points.some(p => p.index === i && p.mask & 1))
          if (facing === -1) throw new RangeError('Grade vertex has no adjacent occupied tile')
          angle = 768 + facing * 512
        }
        const point = { x: (index & 127) * 512, y: (index >> 7) * 512 }
        movePosition(point, angle, 128)
        effects.destination(point)
        recoverPersonMovement(rng, person, effects.animation)
      }
      person.flags2 |= 512
      if (arrived(person)) next(Phase.Pause)
      return
    }
    case Phase.Stamp:
      if (entering) {
        person.assignment &= ~16
        const object = rules.personAnimationObjects[(person.cargo ? 4 : 7) * 9 + person.model]
        effects.animation(person, object)
        if (!person.cargo) {
          person.f2 = 0
          person.f1 = signedByte(rules.animationDescriptors[person.draw].hold)
        }
        person.assignment |= 128
        person.speed = 0
        person.timer =
          (sprites.frameCounts[rules.animationObjects[object][0]] *
            signedByte(rules.animationDescriptors[person.draw].step + 1)) &
          255
      }
      person.timer = short(person.timer - 1)
      if (!person.timer) next(Phase.Grade)
      return
    case Phase.Rise:
      person.h = short(person.h + 48)
      next(Phase.Grade)
      return
    case Phase.Grade: {
      setPersonAnimationRow(person, person.cargo ? 4 : 0, effects.animation)
      if (!arrived(person)) {
        next(Phase.Approach)
        return
      }
      const vertex = vertices()[signedByte(task.busy)]
      if (!vertex) throw new RangeError('Invalid builder grade vertex')
      const target =
        (plan.model === 13 || plan.model === 14) && vertex.mask & 128 ? 0 : short(plan.height)
      const before = land.heights[vertex.index],
        difference = target - before,
        step = short(rules.buildingLevelStep[plan.model])
      const complete = Math.abs(difference) <= step
      if (difference) {
        land.heights[vertex.index] = complete ? target : before + Math.sign(difference) * step
        effects.terrainChanged(vertex.index)
      }
      next(complete ? Phase.Rest : Phase.Pause)
      plan.revalidate = false
      person.h = terrainPointHeight(land, person)
      person.flags4 = (person.flags4 & ~1024) >>> 0
      effects.sound(2, 0)
      return
    }
  }
}
