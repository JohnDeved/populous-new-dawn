import { movePosition, positionDistanceSquared, random } from './native-math.ts'

type Position = { x: number; y: number; h: number }
export type ConvertWildTarget = Position & { id: number; class: number; model: number }

export interface ConvertWild {
  center: Position
  tribe: number
  counter: number
  remaining: number
  radius: 4 | 6
}

export function createConvertWild(
  center: Position,
  tribe: number,
  counter: number,
  computer: boolean
) {
  return {
    center: { x: center.x & 65535, y: center.y & 65535, h: center.h },
    tribe,
    counter: counter & 255,
    remaining: computer ? 22 : 18,
    radius: computer ? 6 : 4,
  } satisfies ConvertWild
}

// 0x512350: every eighth class-7 visit converts the nearest supported wild
// person in a 5x5 player or 7x7 computer footprint, one person per scan.
export function stepConvertWild(
  spell: ConvertWild,
  game: { randomState: number },
  effects: {
    population: () => number
    people: (cell: number) => Iterable<ConvertWildTarget>
    unsupported: (person: ConvertWildTarget) => boolean
    strand: (person: ConvertWildTarget) => void
    suppressed: () => boolean
    convert: (person: ConvertWildTarget) => void
    sparkle: (position: Position, turns: number) => void
  }
) {
  if (spell.remaining) spell.remaining--
  if (effects.population() < 200 && !(spell.counter & 7)) {
    const center = ((spell.center.x >>> 8) & 254) | (spell.center.y & 0xfe00)
    let nearest: ConvertWildTarget | undefined,
      distance = 0xffffffff
    for (let y = -spell.radius; y <= spell.radius; y += 2)
      for (let x = -spell.radius; x <= spell.radius; x += 2) {
        const cell = (((center & 255) + x) & 255) | ((((center >>> 8) + y) & 255) << 8)
        for (const person of effects.people(cell)) {
          if (person.class !== 1 || person.model !== 1) continue
          if (effects.unsupported(person)) {
            effects.strand(person)
            continue
          }
          const candidate = positionDistanceSquared(spell.center, person)
          if (candidate < distance) {
            nearest = person
            distance = candidate
          }
        }
      }
    if (nearest) {
      if (effects.suppressed()) spell.remaining = 0
      else {
        spell.remaining = 18
        effects.convert(nearest)
      }
    }
  }
  if (!spell.remaining) return false
  for (let i = 0; i < 4; i++) {
    const position = { ...spell.center, h: spell.center.h - 0x18 }
    movePosition(position, random(game) & 2047, 0x500)
    effects.sparkle(position, (random(game) & 3) + 4)
  }
  return true
}
