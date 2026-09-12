import rules from './original-rules.json' with { type: 'json' }
import { cellDelta, random } from './native-math.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'

type Position = { x: number; y: number; h: number }
type Ground = Pick<NativeTerrain, 'heights' | 'flags' | 'categories'>

export interface Earthquake {
  anchor: number
  tribe: number
  remaining: number
  orientation: number
}

export type EarthquakeEffects<T> = {
  sound: (cue: number) => void
  shake: (amount: number) => void
  buildings: (cell: number) => Iterable<T>
  model: (building: T) => number
  evacuate: (building: T) => void
  damage: (building: T) => void
  spark: (position: Position) => void
  fissure: (cell: number) => void
  terrain: (anchor: number, radius: number) => void
}

const indexOf = (cell: number) => (cell >>> 9) * 128 + ((cell & 254) >>> 1)
const offset = (cell: number, x: number, y: number) =>
  (((cell & 255) + x) & 255) | ((((cell >>> 8) + y) & 255) << 8)

export function createEarthquake(
  center: Pick<Position, 'x' | 'y'>,
  tribe: number,
  game: { randomState: number }
): Earthquake {
  return {
    anchor: ((center.x >>> 8) & 254) | (center.y & 0xfe00),
    tribe,
    remaining: 120,
    orientation: random(game) & 3,
  }
}

const deformation = [
  [-20, -20, 20, 10],
  [0, -20, 10, 20],
  [-20, 0, 20, 10],
  [-20, -20, 10, 20],
] as const
const fissures = [
  [10, 18, 10, 2],
  [-2, 10, 2, 10],
  [10, -2, 10, 2],
  [18, 10, 2, 10],
] as const

// 0x50d9a0: effect model 26, spawned by spell model 14.
export function stepEarthquake<T>(
  land: Ground,
  quake: Earthquake,
  game: { randomState: number },
  effects: EarthquakeEffects<T>
) {
  if (!--quake.remaining) return false
  effects.sound(0xad)
  const phase = quake.remaining > 60 ? 120 - quake.remaining : quake.remaining,
    sineIndex = Math.trunc((phase * 512) / 120)
  effects.shake(Math.imul(rules.sine[sineIndex], 256) >> 16)

  if (!(quake.remaining & 31))
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const cell = offset(quake.anchor, -16 + x * 2, -16 + y * 2)
        for (const building of effects.buildings(cell))
          if (effects.model(building) !== 18 && (random(game) & 0x7f) < 20) {
            effects.evacuate(building)
            effects.damage(building)
          }
      }

  if (quake.remaining !== 60) return true
  effects.sound(0x15)
  const [startX, startY, width, height] = deformation[quake.orientation]
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const cell = offset(quake.anchor, startX + x * 2, startY + y * 2),
        dx = cellDelta(cell, quake.anchor) * 256,
        dy = cellDelta(cell >>> 8, quake.anchor >>> 8) * 256,
        distance = Math.floor(Math.sqrt(dx * dx + dy * dy))
      if (distance >= 4096) continue
      const position = {
          x: (((cell & 255) + 1) << 8) & 65535,
          y: ((((cell >>> 8) + 1) & 255) << 8) & 65535,
          h: terrainPointHeight(land, {
            x: (((cell & 255) + 1) << 8) & 65535,
            y: ((((cell >>> 8) + 1) & 255) << 8) & 65535,
          }),
        },
        index = indexOf(cell),
        delta = Math.trunc((-600 * (4096 - distance)) / 4096)
      effects.spark(position)
      land.heights[index] = Math.max(0, Math.min(1024, position.h + delta))
    }

  const [fissureX, fissureY, fissureWidth, fissureHeight] = fissures[quake.orientation]
  for (let y = 0; y < fissureHeight; y++)
    for (let x = 0; x < fissureWidth; x++) {
      const cell = offset(quake.anchor, fissureX + x * 2, fissureY + y * 2),
        flags = rules.terrainCategoryFlags[land.categories[indexOf(cell)] & 15]
      if (flags & 2) continue
      effects.fissure(cell)
      random(game)
    }
  effects.terrain(quake.anchor, 10)
  return true
}
