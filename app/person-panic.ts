import rules from './original-rules.json' with { type: 'json' }
import { random } from './native-math.ts'
import { defaultPersonState, type StatefulPerson } from './person-state.ts'
import { setPersonAnchor } from './person-order-update.ts'

interface Point {
  x: number
  y: number
  h: number
}
type PanickingPerson = StatefulPerson &
  Point & { anchorX: number; anchorY: number; anchorFlags: number }

// State 26 in 0x4d32b0 (switch case 25). Shared person physics runs first.
export function stepPersonPanic(
  p: PanickingPerson,
  gameFlags: number,
  effects: { sound: () => void; outside: (point: Point) => Point }
) {
  if (!(p.flags4 & 16)) effects.sound()
  p.timer = ((p.timer - 1) << 16) >> 16
  if (p.timer >= 0) return 0
  const next = defaultPersonState(p, gameFlags)
  setPersonAnchor(p, effects.outside({ x: p.x, y: p.y, h: p.h }))
  return next
}

// Complete 0x4d9200, called only while the person's unsigned +0xa4 is nonzero.
// Allocation owns each particle's initializer; failed allocations still consume the turn.
export function stepPersonFireTrail(
  p: Point & { burnTrail: number },
  displacement: Point,
  allocate: (
    model: 3 | 10,
    position: Point
  ) =>
    | {
        flags2: number
        flags3: number
        displacement?: Point
      }
    | undefined
) {
  const position = { x: p.x, y: p.y, h: ((p.h + 16) << 16) >> 16 }
  for (const model of p.burnTrail > 8 ? ([3, 10] as const) : ([3] as const)) {
    const particle = allocate(model, position)
    if (!particle) continue
    particle.flags2 = (particle.flags2 | 0x4000) >>> 0
    particle.flags3 = (particle.flags3 | 0x100) >>> 0
    particle.displacement = { ...displacement }
  }
  p.burnTrail = (p.burnTrail - 1) & 255
}

// 0x408840: one successful building-flame allocation visits its cell chain.
// Repeated sockets deliberately revisit people; even protected people get a trail.
export function ignitePeopleInFireCell<
  T extends { class: number; model: number; tribe: number; flags2: number; burnTrail: number },
>(w: { randomState: number }, tribe: number, people: Iterable<T>, panic: (person: T) => void) {
  for (const person of people) {
    if (
      person.class !== 1 ||
      person.tribe !== tribe ||
      rules.personModels[person.model].flags & 0x100
    )
      continue
    if (!(person.flags2 & 0x100000)) panic(person)
    person.burnTrail = (random(w) & 7) + 8
  }
}
