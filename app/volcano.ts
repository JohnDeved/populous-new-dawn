import rules from './original-rules.json' with { type: 'json' }
import { cellDelta, movePosition, random } from './native-math.ts'
import type { NativeTerrain } from './native-terrain.ts'

type Position = { x: number; y: number; h: number }
type Ground = Pick<NativeTerrain, 'heights' | 'flags' | 'cliffs' | 'shadows'>

export interface Volcano {
  center: Position
  cell: number
  tribe: number
  remaining: number
  rumbling: boolean
}

export type VolcanoEffects<P, B> = {
  sound: (cue: number, mode: number) => void
  shake: (amount: number) => void
  people: (cell: number) => Iterable<P>
  exempt: (person: P) => boolean
  disturb: (person: P, tribe: number) => void
  buildings: (cell: number) => Iterable<B>
  collapse: (building: B) => void
  rock: (position: Position) => void
  fireball: (position: Position, large: boolean) => void
  gloop: (position: Position) => void
  burst: (position: Position) => void
  terrain: (cell: number, radius: number) => void
}

const indexOf = (cell: number) => (cell >>> 9) * 128 + ((cell & 254) >>> 1)
const offset = (cell: number, x: number, y: number) =>
  (((cell & 255) + x) & 255) | ((((cell >>> 8) + y) & 255) << 8)
const clampHeight = (height: number) => Math.max(0, Math.min(1024, height))
const randomPosition = (
  volcano: Volcano,
  game: { randomState: number },
  mask: number,
  base = 0
) => {
  const distance = base + 2 * (random(game) & mask),
    angle = random(game) & 2047,
    position = { ...volcano.center }
  movePosition(position, angle, distance)
  return position
}

export function createVolcano(center: Position, tribe: number): Volcano {
  return {
    center: { x: center.x & 65535, y: center.y & 65535, h: center.h },
    cell: ((center.x >>> 8) & 254) | (center.y & 0xfe00),
    tribe,
    remaining: 160,
    rumbling: false,
  }
}

// 0x50e060: effect model 15, spawned by spell model 16.
export function stepVolcano<P, B>(
  land: Ground,
  volcano: Volcano,
  game: { randomState: number },
  effects: VolcanoEffects<P, B>
) {
  if (!--volcano.remaining) return false
  if (!volcano.rumbling) {
    volcano.rumbling = true
    effects.sound(0xaf, 2)
  }
  const age = 160 - volcano.remaining,
    shakePhase = volcano.remaining > 80 ? age : volcano.remaining,
    sine = rules.sine[Math.trunc((shakePhase * 512) / 160)]
  effects.shake((sine << 7) >> 16)
  if (age === 80) {
    effects.sound(0xb0, 0)
    return true
  }
  if (age <= 80 || age >= 140) return true

  const phase = age - 80
  for (let y = -14; y < 14; y += 2)
    for (let x = -14; x < 14; x += 2) {
      const cell = offset(volcano.cell, x, y),
        radius = Math.floor(
          Math.sqrt(
            (cellDelta(cell, volcano.cell) * 256) ** 2 +
              (cellDelta(cell >>> 8, volcano.cell >>> 8) * 256) ** 2
          )
        )
      if (radius >= 0xa00) continue
      const target =
          radius >= 0x500
            ? Math.trunc(((0xa00 - radius) * 1024) / 0x500)
            : 0x500 - radius <= 0x280
              ? Math.imul(rules.sine[512 + Math.trunc(((0x500 - radius) * 1024) / 0x500)], 1024) >>
                16
              : 1,
        index = indexOf(cell),
        current = land.heights[index]
      land.heights[index] = clampHeight(current + Math.trunc((target - current) / (60 - phase)))
    }

  if (phase >= 25 && phase <= 50) effects.rock(randomPosition(volcano, game, 0x1ff, 0x600))
  if (phase >= 35) {
    const position = randomPosition(volcano, game, 0x7f),
      kind = random(game) & 7
    if (kind < 2) {
      const count = random(game) & 7
      for (let i = 0; i < count; i++) effects.fireball(position, false)
    } else if (kind < 4) effects.fireball({ ...position, h: position.h + 100 }, true)
  }
  if (phase >= 40) effects.gloop(randomPosition(volcano, game, 0x7f))

  if (phase === 30) {
    for (let y = -6; y < 6; y += 2)
      for (let x = -6; x < 6; x += 2) {
        const cell = offset(volcano.cell, x, y)
        for (const person of effects.people(cell))
          if (!effects.exempt(person)) effects.disturb(person, volcano.tribe)
        for (const building of effects.buildings(cell)) effects.collapse(building)
      }
    effects.burst(volcano.center)
  }

  if (phase >= 30) {
    const target = Math.trunc((944 * (phase - 30)) / 30),
      center = indexOf(volcano.cell)
    land.cliffs[center] = Math.min(255, land.cliffs[center] + 10)
    land.flags[center] |= 0x0c000000
    land.shadows[center] = 128
    for (let y = -2; y <= 2; y += 2)
      for (let x = -2; x <= 2; x += 2) {
        if (!x && !y) continue
        const index = indexOf(offset(volcano.cell, x, y))
        if (land.heights[index] >= target) continue
        land.heights[index] = target
        land.cliffs[index] = Math.min(255, land.cliffs[index] + 16)
        land.flags[index] |= 0x0c000000
        land.shadows[index] = 128
      }
  }
  effects.terrain(volcano.cell, 7)
  return true
}
